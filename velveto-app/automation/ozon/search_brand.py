import requests
import json
import os
from dotenv import load_dotenv

# Load env from .env.ozon
load_dotenv(os.path.join(os.getcwd(), "ozon-automation", ".env.ozon"))

OZON_CLIENT_ID = os.getenv('OZON_CLIENT_ID')
OZON_API_KEY = os.getenv('OZON_API_KEY')

headers = {
    'Client-Id': OZON_CLIENT_ID,
    'Api-Key': OZON_API_KEY,
    'Content-Type': 'application/json'
}

def search_brand(query="Velveto"):
    url = "https://api-seller.ozon.ru/v1/description-category/attribute/values"
    
    # Backpack category ID: 17027904
    # Brand Attribute ID: 85
    
    payload = {
        "attribute_id": 85,
        "description_category_id": 17027904,
        "type_id": 115945533,
        "language": "DEFAULT",
        "last_value_id": 0,
        "limit": 20,
        "query": query
    }
    
    print(f"🔍 Searching for brand '{query}'...")
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        if response.status_code == 200:
            data = response.json()
            print(json.dumps(data, indent=2, ensure_ascii=False))
        else:
            print(f"❌ FAILED: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"❌ Exception: {e}")

if __name__ == "__main__":
    search_brand()
