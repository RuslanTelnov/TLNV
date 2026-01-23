
import requests
import json
import sys
import os

# Helper to load config if needed, or just hardcode for this diag script
token = 'dutmsmqJIEi4CpuX2PNPDLbNcdpiRwNpKc3mwggACq0='
category = 'Master - Stuffed toys'

def fetch_schema():
    headers = {
        'X-Auth-Token': token,
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json'
    }
    
    # URL to fetch attributes for the category
    url = f'https://kaspi.kz/shop/api/products/classification/attributes?c={category}'
    
    print(f"Fetching schema for: {category}")
    try:
        resp = requests.get(url, headers=headers, timeout=10)
        print(f"Status: {resp.status_code}")
        if resp.status_code == 200:
            data = resp.json()
            # Save to file for inspection
            with open('toys_schema.json', 'w', encoding='utf-8') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
            print("Saved to toys_schema.json")
            
            # Print mandatory ones
            mandatory = [x for x in data if x.get('mandatory')]
            print(f"Found {len(mandatory)} mandatory attributes:")
            for m in mandatory:
                print(f" - {m.get('code')} ({m.get('title')}): {m.get('type')}")
        else:
            print("Error:", resp.text)
            
    except Exception as e:
        print(f"Failed: {e}")

if __name__ == "__main__":
    fetch_schema()
