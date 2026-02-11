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

def get_dict_values(category_id, type_id, attribute_id, search_term=""):
    print(f"\nGetting values for Attribute ID: {attribute_id} (Search: '{search_term}')...")
    
    payload = {
        "description_category_id": category_id,
        "type_id": type_id,
        "attribute_id": attribute_id,
        "language": "DEFAULT",
        "limit": 100
    }
    
    # If Ozon supports search in this endpoint (it usually does via 'last_value_id' pagination, but maybe not search term directly?)
    # Actually v1/description-category/attribute/values doesn't support search query in body usually.
    # But let's try just fetching first page.
    
    response = requests.post(
        "https://api-seller.ozon.ru/v1/description-category/attribute/values",
        headers=headers,
        json=payload
    )
    
    if response.status_code == 200:
        data = response.json()
        result = data.get('result', [])
        print(f"Found {len(result)} values.")
        
        for val in result:
            if not search_term or search_term.lower() in val['value'].lower():
                print(f"  - {val['value']} (ID: {val['id']})")
                
        return result
    else:
        print(f"Error: {response.status_code}")
        print(response.text)
        return None

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python3 get_dict_values.py <category_id> <type_id> <attribute_id> [search_term]")
        sys.exit(1)
        
    cat_id = int(sys.argv[1])
    t_id = int(sys.argv[2])
    attr_id = int(sys.argv[3])
    search = sys.argv[4] if len(sys.argv) > 4 else ""
    
    get_dict_values(cat_id, t_id, attr_id, search)
