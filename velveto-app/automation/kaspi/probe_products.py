import requests
import json
import sys
import os

# Add parent directory to path to import config
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import config

def probe_products():
    token = config.KASPI_API_TOKEN
    headers = {
        "X-Auth-Token": token,
        "User-Agent": config.USER_AGENT,
        "Accept": "application/json"
    }
    
    # Try to list offers
    url = f"{config.KASPI_MERCHANT_API_URL}/offers"
    
    # Try with SKU filter if possible
    # url = f"{url}?sku=150510865" 
    
    print(f"--- Probing {url} (GET) ---")
    try:
        response = requests.get(url, headers=headers)
        print(f"Status: {response.status_code}")
        try:
            print(json.dumps(response.json(), indent=2, ensure_ascii=False))
        except:
            print(f"Body: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    probe_products()
