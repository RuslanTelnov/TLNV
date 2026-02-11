import os
import requests
import json
from dotenv import load_dotenv

# Load Environment
script_dir = os.path.dirname(os.path.abspath(__file__))
# Navigate up 4 levels to reach moysklad-automation root
env_path = os.path.abspath(os.path.join(script_dir, "../../../../.env"))
load_dotenv(env_path)

ozon_env_path = os.path.join(script_dir, ".env.ozon")
if os.path.exists(ozon_env_path):
    load_dotenv(ozon_env_path)

OZON_CLIENT_ID = os.getenv('OZON_CLIENT_ID')
OZON_API_KEY = os.getenv('OZON_API_KEY')

HEADERS = {
    'Client-Id': OZON_CLIENT_ID,
    'Api-Key': OZON_API_KEY,
    'Content-Type': 'application/json'
}

CATEGORY_ID = 34955 # Средства от насекомых

def get_category_attributes(cat_id):
    # DIRECTLY FETCH VALUES FOR "TYPE" ATTRIBUTE (ID 8229)
    # This acts as both a check for the category and gets us the ID we need.
    print(f"🔍 Fetching values for Attribute 8229 (Type) in Category {cat_id}")
    get_dictionary_values(cat_id, 8229)
    
    # Also fetch all attributes using v3 if possible, but let's stick to v2/category/attribute which might be the one.
    # If v3 returned 404, maybe it's `v2/category/attribute` (without s)?
    
def get_dictionary_values(cat_id, attr_id):
    url = "https://api-seller.ozon.ru/v2/category/attribute/values"
    payload = {
        "attribute_id": attr_id,
        "description_category_id": cat_id,
        "language": "DEFAULT",
        "limit": 100
    }
    
    print(f"   Getting values for Attribute {attr_id}...")
    try:
        resp = requests.post(url, headers=HEADERS, json=payload)
        if resp.status_code == 200:
            values = resp.json().get('result', [])
            print(f"   ✅ Found {len(values)} possible values:")
            for val in values:
                # Filter for "Insect" related
                if "насеком" in val['value'].lower() or "таракан" in val['value'].lower() or "средство" in val['value'].lower():
                     print(f"      - ID: {val['id']} | Value: {val['value']}")
                
                # Also print first 5 just in case
                if values.index(val) < 5:
                     print(f"      (Sample) ID: {val['id']} | Value: {val['value']}")

        else:
            print(f"   ❌ Error fetching values: {resp.text}")
    except Exception as e:
        print(f"   ❌ Exception fetching values: {e}")

if __name__ == "__main__":
    # We only need the values for Type ID 8229
    get_category_attributes(CATEGORY_ID)

