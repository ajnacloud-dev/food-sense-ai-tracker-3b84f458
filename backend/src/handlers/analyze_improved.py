"""
Improved Analysis Handler with S3 Image Storage
This demonstrates how receipt images should be handled using S3 presigned URLs
instead of storing base64 data in the database
"""

import json
import uuid
import base64
from datetime import datetime
from typing import Dict, Any, Optional

from lib.auth_provider import require_auth, get_user_id
from lib.validators import validate_request, ValidationError
from lib.logger import logger, log_handler
from config.settings import settings
from utils.http import respond


def upload_base64_to_s3(db, base64_image: str, user_id: str) -> Optional[str]:
    """
    Upload a base64 image to S3 and return the S3 URL

    Args:
        db: Database/storage service instance
        base64_image: Base64 encoded image string (with or without data URL prefix)
        user_id: User ID for tracking

    Returns:
        S3 URL of the uploaded image or None if upload fails
    """
    try:
        # Remove data URL prefix if present
        if base64_image.startswith('data:'):
            # Extract the base64 part from data URL
            # Format: data:image/png;base64,<base64_data>
            header, base64_data = base64_image.split(',', 1)
            # Extract mime type from header
            mime_type = header.split(':')[1].split(';')[0]
        else:
            base64_data = base64_image
            mime_type = 'image/jpeg'  # Default mime type

        # Generate unique filename
        file_extension = mime_type.split('/')[-1]
        filename = f"receipts/{user_id}/{uuid.uuid4()}.{file_extension}"

        # Upload to S3 using the existing upload functionality
        result = db.upload_file(base64_data, filename, mime_type)

        if result.get('success'):
            # Return the S3 URL (not the base64 data)
            s3_url = result.get('url')
            logger.info(
                "Image uploaded to S3",
                user_id=user_id,
                filename=filename,
                s3_url=s3_url
            )
            return s3_url
        else:
            logger.error(
                "Failed to upload image to S3",
                user_id=user_id,
                error=result.get('error')
            )
            return None

    except Exception as e:
        logger.error(
            "Error uploading image to S3",
            user_id=user_id,
            error=str(e)
        )
        return None


def get_presigned_url(db, s3_key: str, expiry_seconds: int = 3600) -> Optional[str]:
    """
    Get a presigned URL for an S3 object

    Args:
        db: Database/storage service instance
        s3_key: S3 object key
        expiry_seconds: URL expiry time in seconds (default 1 hour)

    Returns:
        Presigned URL or None if generation fails
    """
    try:
        result = db.get_download_url(s3_key, expiry_seconds=expiry_seconds)
        if result.get('success'):
            return result.get('data', {}).get('download_url')
        return None
    except Exception as e:
        logger.error(
            "Error generating presigned URL",
            s3_key=s3_key,
            error=str(e)
        )
        return None


def _store_receipt_improved(
    db, user_id: str, entry_id: str, ai_data: Dict,
    image_url: str, logger
) -> Dict[str, Any]:
    """
    Store receipt in database with S3 image storage
    Instead of storing base64 data, upload to S3 and store the URL
    """
    try:
        # Check if image_url is base64 data
        s3_image_url = None
        if image_url and image_url.startswith('data:'):
            # This is base64 data - upload to S3
            logger.info("Uploading receipt image to S3", user_id=user_id)
            s3_image_url = upload_base64_to_s3(db, image_url, user_id)

            if not s3_image_url:
                logger.warning(
                    "Failed to upload image to S3, storing without image",
                    user_id=user_id
                )
        elif image_url and (image_url.startswith('http://') or image_url.startswith('https://')):
            # This is already a URL, use as is
            s3_image_url = image_url

        # Extract receipt data
        merchant = ai_data.get('merchant_name', 'Unknown Vendor')
        date_str = ai_data.get('purchase_date') or datetime.utcnow().strftime('%Y-%m-%d')
        total = ai_data.get('total_amount', 0.0)

        # Create receipt record with S3 URL instead of base64
        receipt_record = {
            'id': entry_id,
            'user_id': user_id,
            'vendor': merchant,
            'receipt_date': date_str,
            'total_amount': total,
            'currency': ai_data.get('currency', 'USD'),
            'category': ai_data.get('category', 'General'),
            'image_url': s3_image_url or '',  # Store S3 URL, not base64
            'image_storage_type': 's3' if s3_image_url else 'none',
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }

        # Store receipt
        db.write('app_receipts', [receipt_record])

        # Store receipt items if available
        items = ai_data.get('items', [])
        if items:
            item_records = []
            for item in items:
                item_records.append({
                    'id': str(uuid.uuid4()),
                    'receipt_id': entry_id,
                    'name': item.get('name', 'Unknown Item'),
                    'price': item.get('price', 0.0),
                    'quantity': item.get('quantity', 1.0),
                    'category': item.get('category'),
                    'created_at': datetime.utcnow().isoformat()
                })
            db.write('app_receipt_items', item_records)

        logger.info(
            "Receipt stored with S3 image",
            entry_id=entry_id,
            user_id=user_id,
            merchant=merchant,
            total=total,
            item_count=len(items),
            has_s3_image=bool(s3_image_url)
        )

        return {
            'success': True,
            'entry_id': entry_id,
            'status': 'completed',
            'category': 'receipt',
            'summary': {
                'merchant': merchant,
                'total': total,
                'items': len(items)
            },
            'image_url': s3_image_url  # Return S3 URL for client use
        }

    except Exception as e:
        logger.error(
            "Failed to store receipt",
            entry_id=entry_id,
            error=str(e)
        )
        raise


def transform_receipt_response(receipt: Dict[str, Any], db) -> Dict[str, Any]:
    """
    Transform receipt response to include presigned URLs instead of base64 data

    Args:
        receipt: Receipt record from database
        db: Database/storage service instance

    Returns:
        Receipt with presigned URL for image
    """
    # If image_url contains base64 data, it needs to be migrated
    image_url = receipt.get('image_url', '')

    if image_url and image_url.startswith('data:'):
        # This is legacy base64 data - should be migrated to S3
        # For now, we'll leave it as is but log a warning
        logger.warning(
            "Receipt contains base64 image data - should be migrated to S3",
            receipt_id=receipt.get('id')
        )
    elif image_url and image_url.startswith('s3://'):
        # This is an S3 URL - generate a presigned URL
        s3_key = image_url.replace('s3://', '')
        presigned_url = get_presigned_url(db, s3_key)
        if presigned_url:
            receipt['image_url'] = presigned_url

    # Remove base64 data from items to reduce payload size
    if 'items' in receipt and isinstance(receipt['items'], str):
        # Parse items if they're stored as JSON string
        try:
            receipt['items'] = json.loads(receipt['items'])
        except:
            pass

    return receipt


# Example of how to use in the receipts endpoint
def list_receipts_improved(event, context):
    """
    GET /v1/receipts - List receipts with presigned URLs instead of base64
    """
    db = context['db']
    user_id = get_user_id(event) or 'local-dev-user'

    try:
        result = db.query("app_receipts", filters=[
            {"field": "user_id", "operator": "eq", "value": user_id}
        ], sort=[{"field": "created_at", "order": "desc"}], limit=50)

        if result.get('success'):
            receipts = result.get('data', {}).get('records', [])

            # Transform each receipt to use presigned URLs
            transformed_receipts = []
            for receipt in receipts:
                # Skip base64 data to reduce payload
                if receipt.get('image_url', '').startswith('data:'):
                    # Don't send base64 data to client
                    receipt['image_url'] = ''
                    receipt['image_format'] = 'base64_omitted'
                else:
                    receipt = transform_receipt_response(receipt, db)
                transformed_receipts.append(receipt)

            return respond(200, {
                "receipts": transformed_receipts,
                "total": len(transformed_receipts)
            })
        else:
            return respond(500, {"error": "Failed to fetch receipts"})

    except Exception as e:
        logger.error(f"Error listing receipts: {e}")
        return respond(500, {"error": str(e)})


# Migration script to move existing base64 images to S3
def migrate_receipts_to_s3(db):
    """
    One-time migration to move base64 images to S3
    """
    try:
        # Get all receipts with base64 images
        result = db.query("app_receipts", limit=1000)
        receipts = result.get('data', {}).get('records', [])

        migrated_count = 0
        for receipt in receipts:
            image_url = receipt.get('image_url', '')
            if image_url.startswith('data:'):
                # Upload to S3
                user_id = receipt.get('user_id')
                s3_url = upload_base64_to_s3(db, image_url, user_id)

                if s3_url:
                    # Update receipt with S3 URL
                    db.update('app_receipts', receipt['id'], {
                        'image_url': s3_url,
                        'image_storage_type': 's3'
                    })
                    migrated_count += 1
                    logger.info(
                        "Migrated receipt image to S3",
                        receipt_id=receipt['id'],
                        s3_url=s3_url
                    )

        logger.info(f"Migration complete: {migrated_count} receipts migrated to S3")
        return migrated_count

    except Exception as e:
        logger.error(f"Migration failed: {e}")
        raise