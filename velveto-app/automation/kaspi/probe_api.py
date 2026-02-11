import requests
import json
import sys
import os

# Add parent directory to path to import config
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import config

def probe_api():
    token = config.KASPI_API_TOKEN
    headers = {
        "X-Auth-Token": token,
        "User-Agent": config.USER_AGENT,
        "Accept": "application/json"
    }
    
    # Try v2 import history
    url_v2 = f"{config.KASPI_MERCHANT_API_URL}/products/import"
    print(f"--- Probing {url_v2} (GET) ---")
    try:
        response = requests.get(url_v2, headers=headers)
        print(f"Status: {response.status_code}")
        try:
            print(json.dumps(response.json(), indent=2, ensure_ascii=False))
        except:
            print(f"Body: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

    print("\n")

    # Try v1/no-version import history (as per search result)
    url_no_v = "https://kaspi.kz/shop/api/products/import"
    print(f"--- Probing {url_no_v} (GET) ---")
    try:
        response = requests.get(url_no_v, headers=headers)
        print(f"Status: {response.status_code}")
        try:
            print(json.dumps(response.json(), indent=2, ensure_ascii=False))
        except:
            print(f"Body: {response.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    probe_api()
