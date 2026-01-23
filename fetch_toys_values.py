
import requests
import json

token = 'dutmsmqJIEi4CpuX2PNPDLbNcdpiRwNpKc3mwggACq0='
category_code = 'Master - Stuffed toys'

# List of enum attributes we need values for
attributes = [
    'Stuffed toys*Type',
    'Stuffed toys*Filler',
    'Stuffed toys*View',
    'Toys*Age',
    'Toys*Gender',
    'Toys*Color',
    'Toys*Material'
]

def fetch_values():
    headers = {
        'X-Auth-Token': token,
        'User-Agent': 'Mozilla/5.0',
        'Accept': 'application/json'
    }
    
    results = {}
    import urllib.parse
    
    encoded_cat = urllib.parse.quote(category_code)
    
    for code in attributes:
        encoded_attr = urllib.parse.quote(code)
        print(f"Fetching values for: {code}")
        # API to get values for a specific attribute in a category
        # Endpoint: /classification/attributes/values?c={category}&a={attribute_code}
        url = f'https://kaspi.kz/shop/api/products/classification/attributes/values?c={encoded_cat}&a={encoded_attr}'
        
        try:
            resp = requests.get(url, headers=headers, timeout=10)
            if resp.status_code == 200:
                vals = resp.json()
                # vals is usually list of dicts: [{"code": "...", "title": "..."}]
                results[code] = [v.get('title') for v in vals]
                print(f"  Got {len(vals)} values. First 5: {results[code][:5]}")
            else:
                print(f"  Error {resp.status_code}: {resp.text}")
        except Exception as e:
            print(f"  Failed: {e}")

    with open('toys_values.json', 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

if __name__ == "__main__":
    fetch_values()
