
import requests
import json
import urllib.parse
import sys

token = 'dutmsmqJIEi4CpuX2PNPDLbNcdpiRwNpKc3mwggACq0='
category_code = 'Master - Stuffed toys'

def fetch_brands(search_term="Generic"):
    headers = {
        'X-Auth-Token': token,
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json'
    }
    
    encoded_cat = urllib.parse.quote(category_code)
    # Endpoint to search brands for category
    # /classification/brands?c={code}&n={name}
    url = f'https://kaspi.kz/shop/api/products/classification/brands?c={encoded_cat}&n={search_term}'
    
    print(f"Searching for brand '{search_term}' in '{category_code}'...")
    try:
        resp = requests.get(url, headers=headers, timeout=10)
        if resp.status_code == 200:
            brands = resp.json()
            print(f"Found {len(brands)} brands.")
            for b in brands:
                print(f" - {b.get('name')} (Code: {b.get('code')})")
        else:
            print(f"Error {resp.status_code}: {resp.text}")
    except Exception as e:
        print(f"Failed: {e}")

if __name__ == "__main__":
    term = "Generic"
    if len(sys.argv) > 1:
        term = sys.argv[1]
    fetch_brands(term)
