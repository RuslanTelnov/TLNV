
import requests
import json
import sys

# Current Token
TOKEN = "dutmsmqJIEi4CpuX2PNPDLbNcdpiRwNpKc3mwggACq0="

def list_products():
    # Try different endpoints to see what works
    endpoints = [
        # Merchant API V2 (XML usually, but maybe supports JSON list?)
        "https://kaspi.kz/shop/api/v2/offers",
         # Content API
        "https://kaspi.kz/shop/api/products",
        "https://kaspi.kz/shop/api/products/import/history"
    ]
    
    headers = {
        "X-Auth-Token": TOKEN,
        "Accept": "application/json",
         "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

    print(f"Token: {TOKEN[:5]}...")

    for url in endpoints:
        print(f"\n--- Testing {url} ---")
        try:
            resp = requests.get(url, headers=headers, timeout=10)
            print(f"Status: {resp.status_code}")
            if resp.status_code == 200:
                try:
                    data = resp.json()
                    # If list, print first few
                    if isinstance(data, list):
                         print(f"Got list of {len(data)} items.")
                         if len(data) > 0:
                             print(json.dumps(data[:2], indent=2, ensure_ascii=False))
                    # If dict, print keys
                    elif isinstance(data, dict):
                        print("Got dict Response.")
                        if 'data' in data:
                             print(f"Data count: {len(data['data'])}")
                        else:
                             print(str(data)[:200])
                    else:
                         print(resp.text[:200])
                except:
                   print("Response is not JSON:")
                   print(resp.text[:200])
            else:
                print(f"Error: {resp.text[:200]}")
        except Exception as e:
            print(f"Exception: {e}")

if __name__ == "__main__":
    list_products()
