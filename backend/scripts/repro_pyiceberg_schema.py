
import sys
try:
    from pyiceberg.schema import Schema
    from pyiceberg.types import (
        NestedField, StringType, IntegerType, BooleanType, 
        TimestampType, DoubleType
    )
except ImportError:
    print("PyIceberg not installed. Skipping test.")
    sys.exit(0)

print("Constructing Schema with problematic fields...")

try:
    # IDs 1-6 reserved for system fields in Ibex logic
    # Start user fields at 7
    fields = [
        NestedField(1, "_tenant_id", StringType(), required=True),
        NestedField(2, "_record_id", StringType(), required=True),
        NestedField(3, "_timestamp", TimestampType(), required=True),
        NestedField(4, "_version", IntegerType(), required=True),
        NestedField(5, "_deleted", BooleanType(), required=False),
        NestedField(6, "_deleted_at", TimestampType(), required=False),
        
        # User Fields
        NestedField(7, "id", StringType(), required=True),
        NestedField(8, "user_id", StringType(), required=True),
        NestedField(9, "status", StringType(), required=True),
        NestedField(10, "category", StringType(), required=False),
        NestedField(11, "description", StringType(), required=False),
        NestedField(12, "image_url", StringType(), required=False),
        NestedField(13, "analysis_result", StringType(), required=False),
        NestedField(14, "error_message", StringType(), required=False),
        NestedField(15, "retry_count", IntegerType(), required=False),
        NestedField(16, "estimated_completion", StringType(), required=False),
        NestedField(17, "completed_at", StringType(), required=False),
        NestedField(18, "created_at", StringType(), required=True),
        NestedField(19, "updated_at", StringType(), required=True)
    ]

    schema = Schema(*fields)
    print("Schema constructed successfully!")
    print(schema)
    
    # Verify fields exist
    missing = []
    for f in ["category", "description", "updated_at"]:
        try:
            schema.find_field(f)
            print(f"✅ Found {f}")
        except ValueError:
            print(f"❌ Missing {f}")
            missing.append(f)
            
    if missing:
        sys.exit(1)
    else:
        sys.exit(0)

except Exception as e:
    print(f"❌ Exception: {e}")
    sys.exit(1)
