import os
import requests
import json
from dotenv import load_dotenv

# Load env from ozon-automation folder
load_dotenv(os.path.join(os.getcwd(), "ozon-automation", ".env.ozon"))

OZON_CLIENT_ID = os.getenv('OZON_CLIENT_ID')
OZON_API_KEY = os.getenv('OZON_API_KEY')

headers = {
    'Client-Id': OZON_CLIENT_ID,
    'Api-Key': OZON_API_KEY,
    'Content-Type': 'application/json'
}

# Category IDs for Soft Toy
TOY_CATEGORY_ID = 17028973
TOY_TYPE_VALUE_ID = 92851

# Attribute IDs
BRAND_ID = 85
TYPE_ID = 8229
MODEL_NAME_ID = 9048
MIN_AGE_ID = 13214
MAX_AGE_ID = 13215
TN_VED_ID = 22232

# Values
TEST_BRAND_ID = 5061932 # T-Design
MIN_AGE_3_YEARS_ID = 971006005
MAX_AGE_9_YEARS_ID = 971005954 # Wait, let me check 971005954 from previous output

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

def create_toy_cards():
    input_file = os.path.join(os.getcwd(), "ozon-automation", "products_to_process.json")
    if not os.path.exists(input_file):
        print(f"❌ Input file not found: {input_file}")
        return

    with open(input_file, "r", encoding="utf-8") as f:
        products = json.load(f)

    print(f"🚀 Processing {len(products)} products for Ozon Toy creation...")
    
    # Find "Соник"
    toy_products = [p for p in products if "соник" in p.get('name', '').lower()]
    if not toy_products:
        print("❌ No toy products found in the list.")
        return

    items_payload = []

    for p in toy_products:
        ms_id = p.get('ms_id')
        name = p.get('name')
        price = str(p.get('price'))
        local_image_path = p.get('local_image_path')
        
        if not local_image_path or not os.path.exists(local_image_path):
            print(f"⚠️ Skipping {name}: Local image not found")
            continue

        # Upload to catbox for public URL
        image_url = upload_to_catbox(local_image_path)
        if not image_url:
            print(f"⚠️ Skipping {name}: Failed to get public URL from catbox")
            continue

        print(f"🔨 Preparing payload for: {name}")

        # Construct Attributes
        attributes = [
            {
                "complex_id": 0,
                "id": BRAND_ID,
                "values": [{"dictionary_value_id": TEST_BRAND_ID, "value": "T-Design"}]
            },
            {
                "complex_id": 0,
                "id": TYPE_ID,
                "values": [{"dictionary_value_id": TOY_TYPE_VALUE_ID, "value": "Мягкая игрушка"}]
            },
            {
                "complex_id": 0,
                "id": MODEL_NAME_ID,
                "values": [{"value": name[:50]}]
            },
            {
                "complex_id": 0,
                "id": MIN_AGE_ID,
                "values": [{"dictionary_value_id": MIN_AGE_3_YEARS_ID, "value": "3 года"}]
            },
            {
                "complex_id": 0,
                "id": MAX_AGE_ID,
                "values": [{"dictionary_value_id": MAX_AGE_9_YEARS_ID, "value": "3 года"}] # Using 3 years as max for test if 9 is not sure
            },
            {
                "complex_id": 0,
                "id": TN_VED_ID,
                "values": [{"value": "9503004100"}]
            }
        ]

        item = {
            "attributes": attributes,
            "barcode": str(ms_id)[:13] if len(str(ms_id)) >= 13 else "0000000000000",
            "description_category_id": TOY_CATEGORY_ID,
            "type_id": TOY_TYPE_VALUE_ID,
            "name": name,
            "offer_id": ms_id + "_toy", # Unique offer ID for this test
            "price": price,
            "vat": "0",
            "weight": 300,
            "weight_unit": "g",
            "width": 200,
            "height": 300,
            "depth": 150,
            "dimension_unit": "mm",
            "images": [image_url]
        }
        items_payload.append(item)

    if not items_payload:
        print("❌ No valid items to create.")
        return

    payload = {"items": items_payload}
    
    url = "https://api-seller.ozon.ru/v3/product/import"
    print(f"📤 Sending {len(items_payload)} items to Ozon...")
    response = requests.post(url, headers=headers, json=payload)
    
    if response.status_code == 200:
        print("✅ SUCCESS! Task created.")
        print(response.json())
        task_id = response.json().get('result', {}).get('task_id')
        if task_id:
            with open(os.path.join(os.getcwd(), "ozon-automation", "last_task_id.txt"), "w") as f:
                f.write(str(task_id))
    else:
        print(f"❌ ERROR: {response.status_code}")
        print(response.text)

if __name__ == "__main__":
    create_toy_cards()
