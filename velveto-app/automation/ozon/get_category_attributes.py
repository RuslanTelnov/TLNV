import requests
import json
import os
from dotenv import load_dotenv

if os.path.exists(".env.ozon"):
    load_dotenv(".env.ozon")
else:
    load_dotenv(os.path.join(os.getcwd(), "ozon-automation", ".env.ozon"))

OZON_CLIENT_ID = os.getenv('OZON_CLIENT_ID')
OZON_API_KEY = os.getenv('OZON_API_KEY')

headers = {
    'Client-Id': OZON_CLIENT_ID,
    'Api-Key': OZON_API_KEY,
    'Content-Type': 'application/json'
}

def get_attributes(category_id):
    url = "https://api-seller.ozon.ru/v1/description-category/attribute"
    payload = {
        "description_category_id": int(category_id),
        "type_id": int(category_id),
        "language": "DEFAULT"
    }
    
    print(f"Fetching attributes for category {category_id}...")
    try:
        resp = requests.post(url, headers=headers, json=payload)
        if resp.status_code != 200:
            print(f"Error: {resp.status_code} - {resp.text}")
            return

        data = resp.json()
        attributes = data.get('result', [])
        
        for attr in attributes:
            print(f"ID: {attr['id']} | Name: {attr['name']} | Type: {attr['type']} | Required: {attr.get('is_required', False)}")
            if attr['name'] == 'Тип':
                print(f"*** FOUND TYPE ATTRIBUTE: {attr['id']} ***")
            
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    import sys
    cat_id = sys.argv[1] if len(sys.argv) > 1 else "17028706"
    get_attributes(cat_id)
