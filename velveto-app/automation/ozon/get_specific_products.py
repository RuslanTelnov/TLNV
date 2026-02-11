import os
import requests
import base64
import json
from dotenv import load_dotenv
from supabase import create_client, Client

# Load env from moysklad-automation folder
load_dotenv(os.path.join(os.getcwd(), "moysklad-automation", ".env"))

# MoySklad Settings
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

# Supabase Settings
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
BUCKET_NAME = "product-images"

def upload_to_supabase(content, filename):
    """Upload image to Supabase Storage and return public URL"""
    try:
        path = f"ozon_upload_{filename}"
        supabase.storage.from_(BUCKET_NAME).upload(
            path=path,
            file=content,
            file_options={"content-type": "image/jpeg", "upsert": "true"}
        )
        return supabase.storage.from_(BUCKET_NAME).get_public_url(path)
    except Exception as e:
        print(f"   ⚠️ Error uploading to Supabase: {e}")
    return None

def get_specific_products():
    print("🚀 Starting specific product fetch from MoySklad...")
    
    # Read target IDs
    target_file = os.path.join(os.getcwd(), "ozon-automation", "target_ids.txt")
    if not os.path.exists(target_file):
        print("❌ Target IDs file not found.")
        return
        
    with open(target_file, "r") as f:
        target_ids = [line.strip() for line in f if line.strip()]
        
    print(f"🎯 Target IDs (Articles): {target_ids}")
    
    # We'll fetch all products from the main warehouse and filter locally
    # fetching by article one by one might be slow if there are many, 
    # but for 20 items it's fine. However, fetching all is safer to get stock info correctly.
    
    url = f"{BASE_URL}/entity/assortment"
    params = {
        "store": f"https://api.moysklad.ru/api/remap/1.2/entity/store/{MAIN_WAREHOUSE_ID}",
        "limit": 100, 
        "stockMode": "positiveOnly",
        "expand": "images,components"
    }
    
    # Note: If the catalog is huge, we might need pagination. 
    # For now assuming < 100 items in stock or just fetching first batch.
    # Better approach for specific items: Search by article.
    
    products_to_process = []
    
    for article in target_ids:
        print(f"🔎 Searching for article: {article}")
        search_url = f"{BASE_URL}/entity/assortment"
        search_params = {
             "store": f"https://api.moysklad.ru/api/remap/1.2/entity/store/{MAIN_WAREHOUSE_ID}",
             "filter": f"article={article}",
             "expand": "images"
        }
        
        resp = requests.get(search_url, headers=HEADERS, params=search_params)
        if resp.status_code != 200:
            print(f"   ❌ Error searching for {article}: {resp.status_code}")
            continue
            
        data = resp.json()
        rows = data.get('rows', [])
        
        if not rows:
            print(f"   ⚠️ Article {article} not found or no stock.")
            continue
            
        item = rows[0] # Take the first match
        
        ms_id = item.get('id')
        name = item.get('name')
        stock = item.get('stock', 0)
        quantity = item.get('quantity', 0)
        description = item.get('description', '')
        
        price = 0
        sale_prices = item.get('salePrices', [])
        if sale_prices:
            price = sale_prices[0].get('value', 0) / 100
            
        images = item.get('images')
        
        # Image handling
        image_url = None
        image_filename = None
        if isinstance(images, dict) and 'rows' in images and len(images['rows']) > 0:
            first_image = images['rows'][0]
            image_url = first_image.get('meta', {}).get('downloadHref')
            image_filename = first_image.get('filename', f"{ms_id}.jpg")
            
        print(f"   ✅ Found: {name} (Qty: {quantity}, Price: {price})")
        
        # Download image
        public_image_url = None
        local_image_path = None
        if image_url:
            try:
                img_resp = requests.get(image_url, headers=HEADERS)
                if img_resp.status_code == 200:
                    images_dir = os.path.join(os.getcwd(), "ozon-automation", "images")
                    os.makedirs(images_dir, exist_ok=True)
                    local_image_path = os.path.join(images_dir, image_filename)
                    with open(local_image_path, "wb") as f:
                        f.write(img_resp.content)
                    
                    # Upload to Supabase
                    public_image_url = upload_to_supabase(img_resp.content, image_filename)
                else:
                    print(f"      ⚠️ Failed to download image")
            except Exception as e:
                print(f"      ⚠️ Error image: {e}")
        
        # Attributes
        attributes = item.get('attributes', [])
        parsed_attributes = {}
        for attr in attributes:
            if 'name' in attr:
                 parsed_attributes[attr['name']] = attr.get('value')
        
        products_to_process.append({
            "ms_id": ms_id,
            "name": name,
            "article": article,
            "stock": stock,
            "price": price,
            "description": description,
            "image_url": public_image_url,
            "local_image_path": local_image_path,
            "attributes": parsed_attributes
        })

    # Save to JSON
    output_file = os.path.join(os.getcwd(), "ozon-automation", "products_to_process.json")
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(products_to_process, f, indent=2, ensure_ascii=False)
        
    print(f"💾 Saved {len(products_to_process)} products to {output_file}")

if __name__ == "__main__":
    get_specific_products()
