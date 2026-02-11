import requests
import json
import sys
import os

token = 'dutmsmqJIEi4CpuX2PNPDLbNcdpiRwNpKc3mwggACq0='
categories = [
    'Master - Cups and saucers sets',
    'Master - Men socks',
    'Master - Women socks',
    'Master - Backpacks',
    'Master - Stuffed toys',
    'Master - Key wallets',
    'Master - Power banks'
]

results = {}
headers = {
    'X-Auth-Token': token,
    'User-Agent': 'Mozilla/5.0'
}

for c in categories:
    print(f"Fetching attributes for: {c}")
    url = f'https://kaspi.kz/shop/api/products/classification/attributes?c={c}'
    try:
        resp = requests.get(url, headers=headers)
        if resp.status_code == 200:
            results[c] = resp.json()
        else:
            print(f"  Error {resp.status_code}: {resp.text}")
            results[c] = f'Error {resp.status_code}'
    except Exception as e:
        print(f"  Exception: {e}")
        results[c] = f'Exception: {e}'

with open('kaspi-automation/data/category_attributes.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, indent=2, ensure_ascii=False)

print("\nDone! Results saved to kaspi-automation/data/category_attributes.json")
