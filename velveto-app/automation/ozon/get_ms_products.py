import os
import requests
import base64
import json
from dotenv import load_dotenv
from supabase import create_client, Client

script_dir = os.path.dirname(os.path.abspath(__file__))
# Navigate up 4 levels to reach moysklad-automation root
env_path = os.path.abspath(os.path.join(script_dir, "../../../../.env"))
load_dotenv(env_path)

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
if SUPABASE_URL and SUPABASE_KEY:
    try:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    except Exception as e:
        print(f"⚠️ Supabase init failed: {e}")
        supabase = None
else:
    print("⚠️ Supabase credentials missing. Supabase upload will be skipped.")
    supabase = None
BUCKET_NAME = "product-images"

def upload_to_supabase(content, filename):
    """Upload image to Supabase Storage and return public URL"""
    if not supabase:
        return None
    try:
        path = f"ozon_upload_{filename}"
        # Check if file exists to avoid re-uploading if not needed? 
        # For now, just upsert.
        supabase.storage.from_(BUCKET_NAME).upload(
            path=path,
            file=content,
            file_options={"content-type": "image/jpeg", "upsert": "true"}
        )
        return supabase.storage.from_(BUCKET_NAME).get_public_url(path)
    except Exception as e:
        print(f"   ⚠️ Error uploading to Supabase: {e}")
    return None

def get_products():
    print("🚀 Starting product fetch from MoySklad...")
    
    url = f"{BASE_URL}/entity/assortment"
    
    offset = 0
    all_rows = []
    
    while True:
        print(f"🔄 Fetching products offset {offset}...")
        params = {
            "store": f"https://api.moysklad.ru/api/remap/1.2/entity/store/{MAIN_WAREHOUSE_ID}",
            "limit": 100,
            "offset": offset,
            "stockMode": "positiveOnly",
            "expand": "images,components"
        }
        
        try:
            resp = requests.get(url, headers=HEADERS, params=params)
            if resp.status_code != 200:
                print(f"❌ Error fetching assortment: {resp.text}")
                break
                
            data = resp.json()
            rows = data.get('rows', [])
            all_rows.extend(rows)
            
            if len(rows) < 100:
                break
                
            offset += 100
        except Exception as e:
            print(f"❌ Exception fetching page: {e}")
            break

    products_to_process = []
    
    print(f"📥 Fetched total {len(all_rows)} items. Processing...")
    
    for item in all_rows:
        ms_id = item.get('id')
        name = item.get('name')
        stock = item.get('stock', 0)
        quantity = item.get('quantity', 0) 
        
        description = item.get('description', '')
        article = item.get('article', '')
        
        # Ensure we only process items with positive quantity
        if quantity <= 0:
            continue
            
        price = 0
        sale_prices = item.get('salePrices', [])
        if sale_prices:
            price = sale_prices[0].get('value', 0) / 100 # Convert from kopecks
            
        images = item.get('images')
        
        # Check if product has images
        if not images or images.get('meta', {}).get('size', 0) == 0:
            continue
            
        # Get the first image
        image_url = None
        image_filename = None
        if isinstance(images, dict) and 'rows' in images and len(images['rows']) > 0:
            first_image = images['rows'][0]
            image_url = first_image.get('meta', {}).get('downloadHref')
            image_filename = first_image.get('filename', f"{ms_id}.jpg")
            
        print(f"✅ Found: {name} (Available: {quantity}, Price: {price})")
        
        # Download image
        public_image_url = None
        local_image_path = None
        if image_url:
            try:
                img_resp = requests.get(image_url, headers=HEADERS)
                if img_resp.status_code == 200:
                    # Save locally
                    images_dir = os.path.join(os.getcwd(), "ozon-automation", "images")
                    os.makedirs(images_dir, exist_ok=True)
                    local_image_path = os.path.join(images_dir, image_filename)
                    with open(local_image_path, "wb") as f:
                        f.write(img_resp.content)
                    print(f"   💾 Saved locally: {local_image_path}")
                    
                    # Also try Supabase (optional now, but let's keep it)
                    public_image_url = upload_to_supabase(img_resp.content, image_filename)
                    if public_image_url:
                        print(f"   ☁️ Uploaded to Supabase: {public_image_url}")
                else:
                    print(f"   ⚠️ Failed to download image: {img_resp.status_code}")
            except Exception as e:
                print(f"   ⚠️ Error downloading/uploading image: {e}")
        else:
            print("   ℹ️ No image in MoySklad, will search later.")

        # Extract Attributes (if any)
        # MoySklad attributes are in 'attributes' list
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
    get_products()
