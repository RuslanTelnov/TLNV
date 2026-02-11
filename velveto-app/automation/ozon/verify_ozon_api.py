import os
import requests
import json
from dotenv import load_dotenv

load_dotenv()

CLIENT_ID = os.getenv("OZON_CLIENT_ID")
API_KEY = os.getenv("OZON_API_KEY")

if not CLIENT_ID or not API_KEY:
    print("Error: OZON_CLIENT_ID or OZON_API_KEY not found in .env")
    exit(1)

def verify_credentials():
    endpoints = [
        ("v1/description-category/tree", {"language": "DEFAULT"}), # Correct endpoint
        ("v2/product/list", {"filter": {}, "limit": 10}), # Should work if products exist
        ("v1/warehouse/list", {})
    ]
    
    for endpoint, payload in endpoints:
        url = f"https://api-seller.ozon.ru/{endpoint}"
        headers = {
            "Client-Id": CLIENT_ID,
            "Api-Key": API_KEY
        }
        
        print(f"Testing {url}...")
        
        try:
            response = requests.post(url, headers=headers, json=payload)
            
            if response.status_code == 200:
                print(f"SUCCESS: {endpoint} works!")
                # print(response.json())
                return
            else:
                print(f"FAILURE: {endpoint} returned {response.status_code}")
                print(response.text)
                
        except Exception as e:
            print(f"Exception: {e}")

if __name__ == "__main__":
    verify_credentials()
