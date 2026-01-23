
import requests
import json

TOKEN = "dutmsmqJIEi4CpuX2PNPDLbNcdpiRwNpKc3mwggACq0="
PRODUCT_ID = "8143657"

def check_product():
    # Try multiple variations of the URL
    urls = [
        f"https://kaspi.kz/shop/api/products/{PRODUCT_ID}",
        f"https://kaspi.kz/shop/api/v2/offers/{PRODUCT_ID}",
        f"https://kaspi.kz/shop/api/content/products/{PRODUCT_ID}" 
    ]
    
    headers = {
        "X-Auth-Token": TOKEN,
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0"
    }
    
    print(f"Checking for known product {PRODUCT_ID}...")
    
    for url in urls:
        print(f"Trying {url}...")
        try:
            resp = requests.get(url, headers=headers, timeout=10)
            print(f"Status: {resp.status_code}")
            if resp.status_code == 200:
                print("SUCCESS! Found product.")
                print(resp.text[:300])
                return
            else:
                 print(f"Failed: {resp.status_code}")
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    check_product()
