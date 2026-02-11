import requests
import json
import os
from dotenv import load_dotenv

# Load env from .env.ozon
script_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(script_dir, ".env.ozon")
load_dotenv(env_path)

OZON_CLIENT_ID = os.getenv('OZON_CLIENT_ID')
OZON_API_KEY = os.getenv('OZON_API_KEY')

if not OZON_CLIENT_ID or not OZON_API_KEY:
    print(f"❌ Error: Ozon credentials not found in {env_path}")
    print(f"Current CWD: {os.getcwd()}")
else:
    print(f"ℹ️ Loaded Ozon credentials from {env_path}")

headers = {
    'Client-Id': OZON_CLIENT_ID,
    'Api-Key': OZON_API_KEY,
    'Content-Type': 'application/json'
}

# Default Attribute Constants (fallbacks)
BRAND_ID = 85
NO_BRAND_VALUE_ID = 5061932 # "T-Design"
GENDER_ID = 9163
UNISEX_GENDER_VALUE_ID = 22883
MODEL_NAME_ID = 9048
TYPE_ID = 8229 # This might vary by category, need to check mapping

def upload_to_catbox(file_path):
    """Upload file to catbox.moe and return public URL"""
    print(f"☁️ Uploading {os.path.basename(file_path)} to catbox.moe...")
    try:
        with open(file_path, 'rb') as f:
            files = {'fileToUpload': f}
            data = {'reqtype': 'fileupload'}
            response = requests.post('https://catbox.moe/user/api.php', files=files, data=data)
            if response.status_code == 200:
                url = response.text.strip()
                print(f"✅ Public URL: {url}")
                return url
            else:
                print(f"❌ Catbox upload failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Catbox exception: {e}")
    return None

def load_category_mapping():
    # Try current directory first
    mapping_file = "ozon_category_mapping.json"
    if not os.path.exists(mapping_file):
        # Try subfolder
        mapping_file = os.path.join("ozon-automation", "ozon_category_mapping.json")
    
    if not os.path.exists(mapping_file):
        # Try absolute path based on script location
        script_dir = os.path.dirname(os.path.abspath(__file__))
        mapping_file = os.path.join(script_dir, "ozon_category_mapping.json")

    if not os.path.exists(mapping_file):
        print(f"⚠️ Mapping file not found: {mapping_file}")
        return {}
        
    with open(mapping_file, "r", encoding="utf-8") as f:
        return json.load(f)

def find_category_config(product_name, mapping):
    name_lower = product_name.lower()
    # Sort keys by length descending to match specific phrases first (e.g. "мягкая игрушка" before "игрушка")
    for key in sorted(mapping.keys(), key=len, reverse=True):
        if key in name_lower:
            return mapping[key]
    return None

import sys

def create_cards(input_file_path=None):
    if input_file_path:
        input_file = input_file_path
    else:
        input_file = os.path.join(os.getcwd(), "ozon-automation", "products_to_process.json")
        
    if not os.path.exists(input_file):
        print(f"❌ Input file not found: {input_file}")
        return

    with open(input_file, "r", encoding="utf-8") as f:
        products = json.load(f)

    # If input is a single dict (from API), wrap in list
    if isinstance(products, dict):
        products = [products]

    mapping = load_category_mapping()
    print(f"ℹ️ Loaded {len(mapping)} category mappings.")

    print(f"🚀 Processing {len(products)} products for Ozon creation...")

    items_payload = []

    for p in products:
        ms_id = p.get('ms_id') or p.get('moysklad_id')
        name = p.get('name')
        article = p.get('article')
        price = str(p.get('price'))
        local_image_path = p.get('local_image_path')
        
        # Determine category from mapping
        config = find_category_config(name, mapping)
        
        if not config:
            print(f"⚠️ Skipping {name}: No matching category in mapping.")
            continue

        category_id = config.get('description_category_id')
        type_value_id = config.get('type_id')
        type_name = config.get('type_name', 'Товар')
        mapped_attributes = config.get('attributes', {})

        # Image handling
        image_url = None
        if local_image_path and os.path.exists(local_image_path):
            image_url = upload_to_catbox(local_image_path)
        elif p.get('image_url'):
            # If we have a remote URL, use it directly (assuming it's public)
            # Or we could download and re-upload to be safe, but let's try direct first if it's not a local path
            image_url = p.get('image_url')
            print(f"ℹ️ Using existing remote URL for image: {image_url}")
            
        if not image_url:
            print(f"⚠️ No image found. Attempting to fetch from Kaspi for '{name}'...")
            try:
                import subprocess
                # Assuming script is run from project root or ozon-automation
                # We need to find the path to search_kaspi.py
                kaspi_script = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "kaspi-automation", "search_kaspi.py")
                
                if os.path.exists(kaspi_script):
                    result = subprocess.run(
                        ["python3", kaspi_script, name], 
                        capture_output=True, 
                        text=True,
                        timeout=30
                    )
                    if result.returncode == 0:
                        data = json.loads(result.stdout)
                        if data.get("image_url"):
                            image_url = data.get("image_url")
                            print(f"✅ Found Kaspi image: {image_url}")
                        else:
                            print(f"❌ Kaspi search returned no image: {data.get('error')}")
                    else:
                        print(f"❌ Kaspi script failed: {result.stderr}")
                else:
                    print(f"❌ Kaspi script not found at {kaspi_script}")
            except Exception as e:
                print(f"❌ Error searching Kaspi: {e}")

        if not image_url:
            print(f"⚠️ Warning: No image found for {name}. Using placeholder.")
            image_url = "https://images.unsplash.com/photo-1557683316-973673baf926?w=400&q=80"

        print(f"🔨 Preparing payload for: {name} ({type_name})")

        # Construct Attributes
        attributes = []
        
        # 1. Brand (Required for most)
        brand_val = mapped_attributes.get(str(BRAND_ID), NO_BRAND_VALUE_ID)
        attributes.append({
            "complex_id": 0,
            "id": BRAND_ID,
            "values": [{"dictionary_value_id": brand_val, "value": "T-Design"}] # Value text might be ignored if dict id is present
        })

        # 2. Model Name (Often required)
        attributes.append({
            "complex_id": 0,
            "id": MODEL_NAME_ID,
            "values": [{"value": name[:50]}]
        })

        # 3. Type (Required)
        attributes.append({
            "complex_id": 0,
            "id": TYPE_ID, 
            "values": [{"dictionary_value_id": type_value_id, "value": type_name}]
        })

        # 4. Gender (If mapped)
        if str(GENDER_ID) in mapped_attributes:
            gender_val = mapped_attributes[str(GENDER_ID)]
            attributes.append({
                "complex_id": 0,
                "id": GENDER_ID,
                "values": [{"dictionary_value_id": gender_val, "value": "Унисекс"}] # Label is guess
            })

        # 5. TN VED (Hardcoded for now, or could be mapped)
        attributes.append({
             "complex_id": 0,
             "id": 22232, # TN VED
             "values": [{"value": "4202929100"}] # Default for bags, might need change
        })

        # Determine Offer ID (Article)
        offer_id = str(article) if article else str(ms_id)
        
        # Determine Barcode
        # If article is numeric and reasonable length, use it. Otherwise empty.
        barcode = offer_id if offer_id.isdigit() and 8 <= len(offer_id) <= 14 else ""

        item = {
            "attributes": attributes,
            "barcode": barcode,
            "description_category_id": category_id,
            "type_id": type_value_id,
            "name": name,
            "offer_id": offer_id,
            "price": price,
            "vat": "0",
            "weight": 500,
            "weight_unit": "g",
            "width": 300,
            "height": 400,
            "depth": 150,
            "dimension_unit": "mm",
            "images": [
                image_url
            ]
        }
        items_payload.append(item)

    if not items_payload:
        print("❌ No valid items to create.")
        return

    payload = {"items": items_payload}
    
    url = "https://api-seller.ozon.ru/v3/product/import"
    
    print(f"📤 Sending {len(items_payload)} items to Ozon...")
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        if response.status_code == 200:
            print("✅ SUCCESS! Task created.")
            print(response.json())
            # Save task_id for checking status
            task_id = response.json().get('result', {}).get('task_id')
            if task_id:
                with open("ozon-automation/last_task_id.txt", "w") as f:
                    f.write(str(task_id))
        else:
            print(f"❌ FAILED: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"❌ Exception: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        create_cards(sys.argv[1])
    else:
        create_cards()
