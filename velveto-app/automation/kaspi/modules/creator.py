import json
import requests
import sys
import os

# Add parent directory to path to import config
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import config

def map_attributes(scraped_attributes):
    """
    Maps scraped attributes to Kaspi specific attribute codes.
    Since the scraper now returns codes, we just pass them through.
    """
    return scraped_attributes

def calculate_ean13_checksum(digits):
    """Calculates the checksum digit for EAN-13."""
    total = 0
    for i, digit in enumerate(digits):
        n = int(digit)
        if i % 2 == 0: # Even index (0-based) is odd position (1-based) -> weight 1
             total += n
        else: # Odd index is even position -> weight 3
             total += n * 3
             
    checksum = (10 - (total % 10)) % 10
    return str(checksum)

def generate_internal_ean13(seed, prefix="200"):
    """Generates a pseudo EAN-13 starting with prefix (default 200) based on a seed."""
    # Extract digits from seed
    seed_digits = ''.join(filter(str.isdigit, str(seed)))
    if not seed_digits:
        seed_digits = "0"
        
    # Take up to 9 digits from the end, pad with zeros
    # Format: Prefix (3) + digits (9) + checksum (1) = 13
    payload_digits = seed_digits[-9:].zfill(9)
    
    base = prefix + payload_digits
    checksum = calculate_ean13_checksum(base)
    return base + checksum

def prepare_card_payload(scraped_data, sku, custom_barcode_prefix="201"):
    """
    Prepares the payload for creating a product card using Kaspi Content API.
    """
    # Map attributes to the list of dictionaries format required by Content API
    attributes_list = []
    scraped_attributes = scraped_data.get("attributes", {})
    
    # Generate an internal EAN-13 barcode based on SKU
    # Force 201 prefix to avoid collisions and force new card creation
    barcode = generate_internal_ean13(sku, prefix=custom_barcode_prefix)
    
    # BLACKLIST keywords that should NOT be taken from source data (WB)
    # to avoid collisions or grouping with existing cards
    blacklist_keywords = ["barcode", "штрихкод", "ean", "vendor code", "артикул производителя", "brand", "марка", "бренд"]
    
    for code, value in scraped_attributes.items():
        # Check if attribute code contains any blacklisted keyword
        code_lower = code.lower()
        if any(kw in code_lower for kw in blacklist_keywords):
            # print(f"🚫 Filtering out conflicting attribute: {code}")
            continue
            
        attributes_list.append({
            "code": code,
            "value": value
        })

    # ADD BARCODE AS ATTRIBUTE
    # Try to find the correct 'Vendor code' or 'Barcode' attribute based on category
    category_name = scraped_data.get("category_name", "")
    
    if category_name and category_name.startswith("Master - "):
        prefix = category_name.replace("Master - ", "")
        
        # Add Vendor Code (The unique ID that prevents grouping)
        barcode_attr = f"{prefix}*Vendor code"
        attributes_list.append({
            "code": barcode_attr,
            "value": barcode
        })
        
        # Add Brand to attributes
        brand_attr = f"{prefix}*Brand"
        attributes_list.append({
            "code": brand_attr,
            "value": "Generic"
        })
    else:
        # Fallback for non-Master categories
        attributes_list.append({
            "code": "Barcode",
            "value": barcode
        })
        attributes_list.append({
            "code": "Brand",
            "value": "Generic"
        })

    # TITLE SHOULD REMAIN ORIGINAL AS PER USER REQUEST
    original_title = scraped_data.get("title", "")
    
    payload = {
        "sku": str(sku)[:64],
        "title": original_title[:1000],
        "description": scraped_data.get("description", "")[:1000] if scraped_data.get("description") else "",
        "brand": "Generic", # FORCE GENERIC BRAND
        "category": scraped_data.get("category_name"), 
        "attributes": attributes_list,
        "images": [{"url": img} if isinstance(img, str) else img for img in scraped_data.get("images", [])]
    }
    return payload

def create_card(payload):
    """
    Sends the product data to Kaspi Content Import API using KaspiApiClient.
    """
    token = config.KASPI_API_TOKEN
    if not token:
        print("WARNING: No API token found. Skipping API call.")
        return False, None
    
    try:
        # Import internally to avoid circular dependencies or path issues if run directly
        try:
            from modules.kaspi_api_client import KaspiApiClient
        except ImportError:
            # Fallback for direct execution
            from kaspi_api_client import KaspiApiClient

        client = KaspiApiClient(token)
        
        print(f"Sending data to Kaspi API...")
        # Wrap payload in a list as per schema
        final_payload = [payload]
        
        response = client.import_products(final_payload)
        
        print("✅ API Call Success!")
        upload_id = response.get("code")
        if upload_id:
             print(f"Upload ID: {upload_id}")
        else:
             print(f"Response (no code?): {response}")
             
        return True, upload_id

    except Exception as e:
        print(f"❌ Error creating card: {e}")
        return False, None

if __name__ == "__main__":
    # Test with dummy data
    test_data = {
        "title": "Test Product",
        "description": "Test Description",
        "attributes": {"Color": "Red"}
    }
    payload = prepare_card_payload(test_data, "TEST-SKU-123")
    print(json.dumps(payload, indent=2, ensure_ascii=False))
