import requests
import json
import os
from dotenv import load_dotenv

load_dotenv('.env.ozon')

OZON_CLIENT_ID = os.getenv('OZON_CLIENT_ID')
OZON_API_KEY = os.getenv('OZON_API_KEY')

headers = {
    'Client-Id': OZON_CLIENT_ID,
    'Api-Key': OZON_API_KEY,
    'Content-Type': 'application/json'
}

# Get list of products
print("Getting product list...")
response = requests.post(
    "https://api-seller.ozon.ru/v3/product/list",
    headers=headers,
    json={"filter": {}, "limit": 5}
)

if response.status_code == 200:
    products = response.json()['result']['items']
    print(f"Found {len(products)} products")
    
    # Get details of first product
    if products:
        product_id = products[0]['product_id']
        offer_id = products[0]['offer_id']
        
        print(f"\nGetting details for product {product_id} (offer_id: {offer_id})...")
        
        # Get product info
        response2 = requests.post(
            "https://api-seller.ozon.ru/v2/product/info",
            headers=headers,
            json={"product_id": product_id}
        )
        
        if response2.status_code == 200:
            product_info = response2.json()
            with open('existing_product_template.json', 'w', encoding='utf-8') as f:
                json.dump(product_info, f, indent=2, ensure_ascii=False)
            print("✅ Saved product template to existing_product_template.json")
            
            # Print key fields
            result = product_info.get('result', {})
            print(f"\nKey fields:")
            print(f"  Name: {result.get('name')}")
            print(f"  Category ID: {result.get('description_category_id')}")
            print(f"  Type ID: {result.get('type_id')}")
            print(f"  Attributes: {len(result.get('attributes', []))} attributes")
        else:
            print(f"Error getting product info: {response2.text}")
else:
    print(f"Error: {response.text}")
