
import requests
import json

token = 'dutmsmqJIEi4CpuX2PNPDLbNcdpiRwNpKc3mwggACq0='
headers = {
    'X-Auth-Token': token,
    'User-Agent': 'Mozilla/5.0',
    'Accept': 'application/json'
}

def fetch_children(code=None):
    url = 'https://kaspi.kz/shop/api/products/classification/categories'
    if code:
        url += f'?c={code}'
    
    print(f"Fetching children for: {code or 'ROOT'}")
    try:
        resp = requests.get(url, headers=headers, timeout=10)
        if resp.status_code == 200:
            return resp.json()
    except Exception as e:
        print(f"Failed: {e}")
    return []

def find_toys_code():
    # 1. Fetch root categories
    roots = fetch_children()
    toys_cat = None
    for c in roots:
        # Looking for something like "Tovary dlya detey" or "Toys"
        # Usually "Детские товары" or "Игрушки"
        # Print root names to help debug
        print(f"Root: {c.get('code')} - {c.get('title')}")
        if 'детские' in c.get('title').lower() or 'товары для детей' in c.get('title').lower():
            toys_cat = c
            
    if not toys_cat:
        print("Could not find 'Kids' category at root.")
        return

    print(f"Found Kids root: {toys_cat.get('title')} ({toys_cat.get('code')})")
    
    # 2. Fetch children of Kids
    kids_sub = fetch_children(toys_cat.get('code'))
    stuffed_cat = None
    
    for c in kids_sub:
        print(f"  Sub: {c.get('code')} - {c.get('title')}")
        if 'игрушки' in c.get('title').lower():
             # Found "Toys" subcategory?
             stuffed_cat = c
             break # Or might need to go deeper
             
    if stuffed_cat:
         print(f"Found Toys sub: {stuffed_cat.get('title')} ({stuffed_cat.get('code')})")
         # Fetch validation?
         # Check children of "Toys" to find "Stuffed toys"
         toys_sub = fetch_children(stuffed_cat.get('code'))
         for c in toys_sub:
             print(f"    Item: {c.get('code')} - {c.get('title')}")
             if 'мягкие' in c.get('title').lower():
                 print(f"!!! FOUND TARGET: {c.get('code')} - {c.get('title')}")
                 return c.get('code')
                 
    else:
        print("Could not find 'Toys' subcategory.")

if __name__ == "__main__":
    find_toys_code()
