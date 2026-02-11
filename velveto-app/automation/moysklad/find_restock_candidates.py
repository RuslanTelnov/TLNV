import os
import requests
import base64
import json
from dotenv import load_dotenv

load_dotenv("moysklad-automation/.env")

# MoySklad
LOGIN = os.getenv("MOYSKLAD_LOGIN")
PASSWORD = os.getenv("MOYSKLAD_PASSWORD")
BASE_URL = "https://api.moysklad.ru/api/remap/1.2"
MAIN_WAREHOUSE_ID = "de940fd4-23f4-11ef-0a80-0eb00010b17c"

auth_str = f"{LOGIN}:{PASSWORD}"
auth_b64 = base64.b64encode(auth_str.encode()).decode()
HEADERS = {
    "Authorization": f"Basic {auth_b64}",
    "Content-Type": "application/json"
}

def find_restock_candidates():
    print("🔍 Searching for out-of-stock products in MoySklad...")
    
    url = f"{BASE_URL}/entity/assortment"
    params = {
        "store": f"https://api.moysklad.ru/api/remap/1.2/entity/store/{MAIN_WAREHOUSE_ID}",
        "limit": 100, # Reduce limit for expanded response
        "expand": "images"
    }
    
    offset = 0
    candidates = []
    
    while True:
        params["offset"] = offset
        print(f"   Fetching batch offset {offset}...")
        
        try:
            resp = requests.get(url, headers=HEADERS, params=params)
            if resp.status_code != 200:
                print(f"❌ Error: {resp.status_code} {resp.text}")
                break
                
            data = resp.json()
            rows = data.get('rows', [])
            if not rows:
                break
                
            for item in rows:
                meta = item.get('meta', {})
                type_ = meta.get('type')
                
                if type_ not in ['product', 'variant']:
                    continue
                    
                stock = int(item.get('stock', 0))
                
                if stock <= 0:
                    # Found a candidate!
                    name = item.get('name')
                    ms_id = item.get('id')
                    
                    # Get Image
                    image_url = None
                    images_data = item.get('images', {}).get('rows', [])
                    if images_data:
                        # Get the first image's mini or tiny URL, or better yet, the download href
                        # Usually 'mini', 'tiny', 'small' are available.
                        # We want a decent size for visual search. 'mini' is usually 200x200?
                        # Let's check the structure.
                        first_image = images_data[0]
                        meta_href = first_image.get('meta', {}).get('href')
                        # The download link is usually meta_href/download? Or mini/tiny are in 'mini', 'tiny' fields.
                        # Actually, 'mini' contains a 'href'.
                        if 'mini' in first_image:
                             image_url = first_image['mini']['href']
                        elif 'meta' in first_image:
                             # Fallback to meta href (might need auth to download)
                             image_url = first_image['meta']['href']

                    candidates.append({
                        "ms_id": ms_id,
                        "name": name,
                        "stock": stock,
                        "image_url": image_url
                    })
                    
        except Exception as e:
            print(f"❌ Exception: {e}")
            break
            
        offset += 100
        if offset >= data.get('meta', {}).get('size', 0):
            break
            
    print(f"✅ Found {len(candidates)} out-of-stock products.")
    
    # Save to file
    with open("moysklad-automation/restock_candidates.json", "w", encoding="utf-8") as f:
        json.dump(candidates, f, indent=2, ensure_ascii=False)
        
    return candidates

if __name__ == "__main__":
    find_restock_candidates()
