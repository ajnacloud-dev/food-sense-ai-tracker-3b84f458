
-- Update the receipt prompt to use the new structured format
UPDATE prompts 
SET 
  system_prompt = 'You are an AI assistant specialized in receipt analysis. You extract detailed information from receipt images and text with high accuracy. Always return valid JSON matching the exact schema provided.',
  user_prompt_template = 'Analyze the receipt image (and any text): {description}

• Enrich each item name with a short description.  
• Include `receipt_id` if present anywhere.

Return JSON matching this schema (no extra text):

{
  "merchant": {
    "store_name": "",
    "store_address": "",
    "city": "",
    "state": "",
    "postal_code": "",
    "country": ""
  },
  "transaction": {
    "date": "",
    "time": "",
    "receipt_id": "",
    "purchase_channel": ""
  },
  "items": [
    {
      "name": "",
      "description": "",
      "price": 0.00,
      "quantity": 1,
      "category": "",
      "subcategory": "",
      "sku": "",
      "discount": 0.00
    }
  ],
  "subtotal": 0.00,
  "tax_details": [
    { "tax_rate": 0.00, "tax_amount": 0.00 }
  ],
  "discount_details": [
    { "discount_name": "", "discount_amount": 0.00 }
  ],
  "total": 0.00,
  "payment": {
    "method": "",
    "card_last_digits": "",
    "transaction_id": ""
  },
  "currency": "",
  "notes": ""
}'
WHERE category = 'receipt' AND is_active = true;
