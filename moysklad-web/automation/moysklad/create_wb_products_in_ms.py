import os
import requests
import base64
from dotenv import load_dotenv
from supabase import create_client, Client

# Explicitly load from web env
load_dotenv("moysklad-web/.env.local")

# Supabase settings
SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# MoySklad settings
LOGIN = os.getenv("MOYSKLAD_LOGIN")
PASSWORD = os.getenv("MOYSKLAD_PASSWORD")
BASE_URL = "https://api.moysklad.ru/api/remap/1.2"

auth_str = f"{LOGIN}:{PASSWORD}"
auth_b64 = base64.b64encode(auth_str.encode()).decode()
HEADERS = {
    "Authorization": f"Basic {auth_b64}",
    "Content-Type": "application/json"
}

def get_or_create_group(name):
    """Get or create product folder in MoySklad"""
    url = f"{BASE_URL}/entity/productfolder?filter=name={name}"
    try:
        resp = requests.get(url, headers=HEADERS)
        if resp.status_code == 200:
            rows = resp.json().get('rows', [])
            if rows:
                print(f"📂 Found group '{name}': {rows[0]['id']}")
                return rows[0]['meta']
        
        # Create if not found
        print(f"📂 Creating group '{name}'...")
        resp = requests.post(f"{BASE_URL}/entity/productfolder", json={"name": name}, headers=HEADERS)
        if resp.status_code == 200:
            return resp.json()['meta']
        else:
            print(f"❌ Error creating group: {resp.text}")
    except Exception as e:
        print(f"❌ Error getting/creating group: {e}")
    return None

def get_price_type(name="Цена продажи"):
    """Get price type meta"""
    url = f"{BASE_URL}/context/companysettings/pricetype"
    try:
        resp = requests.get(url, headers=HEADERS)
        if resp.status_code == 200:
            for pt in resp.json():
                if pt['name'] == name:
                    return pt['meta']
            # Fallback to first
            if len(resp.json()) > 0:
                return resp.json()[0]['meta']
    except Exception as e:
        print(f"❌ Error getting price type: {e}")
    return None

def upload_image_to_ms(ms_id, image_url, name):
    """Download image from URL and upload to MoySklad product"""
    if not image_url:
        return
    
    try:
        from PIL import Image
        import io
        
        # Download image
        print(f"   📸 Downloading image for MS: {image_url}")
        img_resp = requests.get(image_url, timeout=10)
        if img_resp.status_code == 200:
            image_content = img_resp.content
            
            # Convert to JPEG (since MS might not like WebP)
            try:
                img = Image.open(io.BytesIO(image_content))
                if img.mode in ('RGBA', 'LA', 'P'):
                    rgb_img = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'P':
                        img = img.convert('RGBA')
                    rgb_img.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
                    img = rgb_img
                
                img_byte_arr = io.BytesIO()
                img.save(img_byte_arr, format='JPEG', quality=90)
                image_content = img_byte_arr.getvalue()
                print("   🎨 Converted WebP to JPEG")
            except Exception as conv_err:
                print(f"   ⚠️ Image conversion failed, trying raw: {conv_err}")

            content = base64.b64encode(image_content).decode('utf-8')
            filename = f"{name.replace('/', '_')}.jpg"
            
            # Upload to MS
            url = f"{BASE_URL}/entity/product/{ms_id}/images"
            payload = {
                "filename": filename,
                "content": content
            }
            resp = requests.post(url, json=payload, headers=HEADERS)
            if resp.status_code == 200:
                print(f"   ✅ Image uploaded to MoySklad")
            else:
                print(f"   ❌ Failed to upload image to MS: {resp.text}")
        else:
            print(f"   ❌ Failed to download image: {img_resp.status_code}")
    except Exception as e:
        print(f"   ❌ Error in image upload process: {e}")

def create_product_in_ms(product, folder_meta, price_type_meta, extra_attributes=None):
    """Create product in MoySklad and sync to Supabase"""
    name = product['name']
    price = product['price'] # Integer from DB
    wb_id = str(product['id']) # Use as externalCode or article
    # image_url = product.get('image_url') # Handled later as list
    
    ms_product_id = None
    
    # Check if exists by externalCode (WB ID)
    url = f"{BASE_URL}/entity/product?filter=externalCode={wb_id}"
    try:
        resp = requests.get(url, headers=HEADERS)
        if resp.status_code == 200:
            rows = resp.json().get('rows', [])
            if rows:
                print(f"⏭️  Product '{name}' already exists in MS.")
                ms_product_id = rows[0]['id']
    except Exception as e:
        print(f"⚠️ Error checking existence: {e}")

    # Pricing Calculation
    # Formula: Price * 100 / divisor
    # Retail (salePrices): WB_Price * 100 / 30
    # Minimum (minPrice): WB_Price * 100 / 45
    # MS requires values in cents (* 100)
    
    retail_price_val = int((price * 100 / 30) * 100)
    min_price_val = int((price * 100 / 45) * 100)

    # Use default currency for minPrice
    currency_meta = {
        "href": f"{BASE_URL}/entity/currency/de9494d6-23f4-11ef-0a80-0eb00010b181",
        "type": "currency",
        "mediaType": "application/json"
    }

    if not ms_product_id:
        # Create new product
        payload = {
            "name": name,
            "externalCode": wb_id,
            "article": wb_id, 
            "productFolder": {"meta": folder_meta},
            "description": "Imported from WB Parser",
            "salePrices": [
                {
                    "value": retail_price_val, 
                    "priceType": {"meta": price_type_meta}
                }
            ],
            "minPrice": {
                "value": min_price_val,
                "currency": {"meta": currency_meta}
            }
        }
        
        if extra_attributes:
            payload["attributes"] = extra_attributes
        
        try:
            resp = requests.post(f"{BASE_URL}/entity/product", json=payload, headers=HEADERS)
            if resp.status_code == 200:
                print(f"✅ Created '{name}' (Price: {price} -> Retail: {retail_price_val//100})")
                ms_product_id = resp.json()['id']
                
                # UPLOAD IMAGES IMMEDIATELY
                image_urls = product.get('image_urls', [])
                if not image_urls and product.get('image_url'):
                    image_urls = [product.get('image_url')]
                
                for idx, img_url in enumerate(image_urls):
                    print(f"   🖼️ Uploading image {idx+1}/{len(image_urls)}...")
                    upload_image_to_ms(ms_product_id, img_url, f"{name}_{idx+1}")
                
            else:
                print(f"❌ Error creating '{name}': {resp.text}")
                return False, f"API Error: {resp.text}"
        except Exception as e:
            print(f"❌ Error creating product request: {e}")
            return False, f"Request Error: {str(e)}"
    else:
        # Product exists, update price
        payload = {
            "salePrices": [
                {
                    "value": retail_price_val, 
                    "priceType": {"meta": price_type_meta}
                }
            ],
            "minPrice": {
                "value": min_price_val,
                "currency": {"meta": currency_meta}
            }
        }
        try:
            resp = requests.put(f"{BASE_URL}/entity/product/{ms_product_id}", json=payload, headers=HEADERS)
            if resp.status_code == 200:
                print(f"🔄 Updated price for '{name}' to {retail_price_val//100}")
            else:
                print(f"❌ Error updating price for '{name}': {resp.text}")
        except Exception as e:
            print(f"❌ Error updating product request: {e}")

    # Sync to Supabase 'products' table for Dashboard
    if ms_product_id:
        try:
            # Upsert into products table
            db_data = {
                "name": name,
                "article": wb_id,
                "moysklad_id": ms_product_id,
                "price": price, # Use actual price from WB
                "image_url": image_url,
            }
            supabase.table("products").upsert(db_data, on_conflict="article").execute()
            print(f"   💾 Synced to Supabase Dashboard: {name} - {price} ₸")
        except Exception as e:
            print(f"   ❌ Error syncing to Supabase: {e}")

    if ms_product_id:
        return ms_product_id, None
    else:
        return False, "Unknown Error (check stdout)"

def main():
    print("🚀 Starting WB to MoySklad Export...")
    
    # 1. Get/Create Group
    folder_meta = get_or_create_group("Parser WB")
    if not folder_meta:
        print("❌ Failed to get target folder. Aborting.")
        return

    # 2. Get Price Type
    price_type_meta = get_price_type("Цена продажи")
    if not price_type_meta:
        print("❌ Failed to get price type. Aborting.")
        return

    # 3. Fetch WB Products
    response = supabase.table("wb_top_products").select("*").execute()
    products = response.data
    print(f"Found {len(products)} products to export.")
    
    created_count = 0
    for p in products:
        if create_product_in_ms(p, folder_meta, price_type_meta):
            created_count += 1
            
    print(f"🏁 Export complete. Created {created_count} new products.")

if __name__ == "__main__":
    main()
