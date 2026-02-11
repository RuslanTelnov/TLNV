import requests
import json
import os
from dotenv import load_dotenv

load_dotenv('../.env')

OZON_CLIENT_ID = os.getenv('OZON_CLIENT_ID')
OZON_API_KEY = os.getenv('OZON_API_KEY')

headers = {
    'Client-Id': OZON_CLIENT_ID,
    'Api-Key': OZON_API_KEY,
    'Content-Type': 'application/json'
}

def create_test_card():
    print("Creating test card for 'Рюкзак Капибара'...")
    
    # Data for "Рюкзак Капибара"
    payload = {
        "items": [
            {
                "attributes": [
                    {
                        "complex_id": 0,
                        "id": 85, # Brand
                        "values": [
                            {
                                "dictionary_value_id": 136382710, # Try "No Brand" common ID
                                "value": "Нет бренда"
                            }
                        ]
                    },
                    {
                        "complex_id": 0,
                        "id": 9163, # Gender
                        "values": [
                            {
                                "dictionary_value_id": 22882, # Girls
                                "value": "Девочки"
                            }
                        ]
                    },
                    {
                        "complex_id": 0,
                        "id": 9048, # Model Name
                        "values": [
                            {
                                "value": "Рюкзак Капибара Тест"
                            }
                        ]
                    },
                    {
                        "complex_id": 0,
                        "id": 8229, # Type
                        "values": [
                            {
                                "dictionary_value_id": 115945533, # Рюкзак
                                "value": "Рюкзак"
                            }
                        ]
                    },
                    {
                        "complex_id": 0,
                        "id": 22232, # TN VED (Optional? No, required)
                        # I need a valid TN VED code. 
                        # Dictionary 124412395.
                        # I'll try to skip it or use a dummy if possible, but it said REQUIRED.
                        # I'll try to find a value for "4202929100" (Textile bags)
                        "values": [
                             {
                                 "value": "4202929100" # Hope this works as text, otherwise need dict ID
                             }
                        ]
                    }
                ],
                "barcode": "1234567890123", # Dummy barcode
                "description_category_id": 17027904, # Accessories
                "type_id": 115945533, # Рюкзак
                "name": "Рюкзак Капибара Тестовый",
                "offer_id": "TEST_CAPYBARA_001",
                "price": "1500",
                "vat": "0",
                "weight": 200,
                "weight_unit": "g",
                "width": 200,
                "height": 300,
                "depth": 100,
                "dimension_unit": "mm",
                "images": [
                    {
                        "file_name": "https://ir.ozon.ru/documents/c396/5b/5b7d9b9a-0b8a-4b8a-9b8a-9b8a9b8a9b8a.jpg", # Need a valid public URL
                        "default": True
                    }
                ]
            }
        ]
    }
    
    # Note: Images must be uploaded first or use public URLs. 
    # Ozon allows public URLs in 'images' -> 'file_name' if 'url' is not supported?
    # v2/product/import expects 'images' as list of strings (URLs) OR list of objects?
    # Docs: "images": [ "url1", "url2" ]
    
    # Let's fix images structure
    payload['items'][0]['images'] = [
        "https://cdn1.ozone.ru/s3/multimedia-0/6066576560.jpg" # Example Ozon image
    ]
    
    # Also TN VED might need dictionary_value_id.
    # If I don't have it, I might fail.
    
    endpoints = [
        "https://api-seller.ozon.ru/v1/product/import",
        "https://api-seller.ozon.ru/v2/product/import",
        "https://api-seller.ozon.ru/v3/product/import"
    ]
    
    for url in endpoints:
        print(f"Testing {url}...")
        try:
            response = requests.post(
                url,
                headers=headers,
                json=payload
            )
            
            if response.status_code == 200:
                print(f"SUCCESS: {url} works!")
                print(response.json())
                return
            else:
                print(f"FAILURE: {url} returned {response.status_code}")
                print(response.text)
        except Exception as e:
            print(f"Exception: {e}")

if __name__ == "__main__":
    create_test_card()
