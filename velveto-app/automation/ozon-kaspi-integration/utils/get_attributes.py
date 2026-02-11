import requests
import json
import os
from dotenv import load_dotenv

import sys

# Load env from ozon-automation folder
load_dotenv(os.path.join(os.getcwd(), "ozon-automation", ".env.ozon"))

OZON_CLIENT_ID = os.getenv('OZON_CLIENT_ID')
OZON_API_KEY = os.getenv('OZON_API_KEY')

headers = {
    'Client-Id': OZON_CLIENT_ID,
    'Api-Key': OZON_API_KEY,
    'Content-Type': 'application/json'
}

def get_attributes(category_id, type_id=None):
    print(f"\nGetting attributes for Category ID: {category_id}, Type ID: {type_id}...")
    
    payload = {
        "description_category_id": category_id,
        "language": "DEFAULT"
    }
    if type_id:
        payload["type_id"] = type_id

    response = requests.post(
        "https://api-seller.ozon.ru/v1/description-category/attribute",
        headers=headers,
        json=payload
    )
    
    if response.status_code == 200:
        data = response.json()
        result = data.get('result', [])
        print(f"Found {len(result)} attributes.")
        
        required = [attr for attr in result if attr.get('is_required')]
        print(f"REQUIRED Attributes ({len(required)}):")
        for attr in required:
            print(f"  - {attr['name']} (ID: {attr['id']}, Type: {attr['type']})")
            if attr.get('dictionary_id'):
                print(f"    Dictionary ID: {attr['dictionary_id']}")
            
        return result
    else:
        print(f"Error: {response.status_code}")
        print(response.text)
        return None

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 get_attributes.py <category_id> [type_id]")
        sys.exit(1)
        
    cat_id = int(sys.argv[1])
    t_id = int(sys.argv[2]) if len(sys.argv) > 2 else None
    get_attributes(cat_id, t_id)
