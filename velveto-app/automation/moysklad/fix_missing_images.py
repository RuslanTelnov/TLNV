
import os
import requests
import base64
from dotenv import load_dotenv
from supabase import create_client, Client
from PIL import Image
import io

# Find .env.local relative to script location
script_dir = os.path.dirname(os.path.abspath(__file__))
env_path = os.path.join(script_dir, "..", "..", ".env.local")
load_dotenv(env_path)

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

def upload_image_to_ms(ms_id, image_url, name):
    if not image_url: return
    try:
        img_resp = requests.get(image_url, timeout=10)
        if img_resp.status_code == 200:
            image_content = img_resp.content
            
            # Convert to JPEG
            try:
                img = Image.open(io.BytesIO(image_content))
                if img.mode in ('RGBA', 'LA', 'P'):
                    rgb_img = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'P': img = img.convert('RGBA')
                    rgb_img.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
                    img = rgb_img
                
                img_byte_arr = io.BytesIO()
                img.save(img_byte_arr, format='JPEG', quality=90)
                image_content = img_byte_arr.getvalue()
            except:
                pass

            content = base64.b64encode(image_content).decode('utf-8')
            filename = f"{name.replace('/', '_')}.jpg"
            url = f"{BASE_URL}/entity/product/{ms_id}/images"
            resp = requests.post(url, json={"filename": filename, "content": content}, headers=HEADERS)
            if resp.status_code == 200:
                print(f"   ✅ Fixed image for: {name}")
                return True
            else:
                print(f"   ❌ Failed to upload for {name}: {resp.text}")
    except Exception as e:
        print(f"   ❌ Error for {name}: {e}")
    return False

def main():
    print("🚀 Fixing missing images and UPDATING PRICES (JPEG Mode)...")
    # Fetch products that have moysklad_id and price
    response = supabase.schema('Parser').table('products').select("moysklad_id, name, image_url, price").not_.is_("moysklad_id", "null").order("id", desc=True).execute()
    products = response.data
    
    # Get price type meta once
    price_type_meta = None
    res_pt = requests.get(f"{BASE_URL}/context/companysettings/pricetype", headers=HEADERS)
    if res_pt.status_code == 200:
        for pt in res_pt.json():
            if pt['name'] == "Розничная цена":
                price_type_meta = pt['meta']
                break
    
    currency_meta = {
        "href": f"{BASE_URL}/entity/currency/de9494d6-23f4-11ef-0a80-0eb00010b181",
        "type": "currency"
    }

    for p in products:
        ms_id = p['moysklad_id']
        name = p['name']
        image_url = p['image_url']
        price = p.get('price', 0)
        
        if price > 0 and price_type_meta:
            retail_val = int((price * 100 / 30) * 100)
            min_val = int((price * 100 / 45) * 100)
            
            # Update Price
            price_payload = {
                "salePrices": [{"value": retail_val, "priceType": {"meta": price_type_meta}}],
                "minPrice": {"value": min_val, "currency": {"meta": currency_meta}}
            }
            requests.put(f"{BASE_URL}/entity/product/{ms_id}", json=price_payload, headers=HEADERS)
            print(f"💰 Updated price for {name}: {retail_val//100}")

        # Check/Fix Images
        try:
            res = requests.get(f"{BASE_URL}/entity/product/{ms_id}/images", headers=HEADERS)
            if res.status_code == 200:
                if res.json().get('meta', {}).get('size', 0) == 0:
                    print(f"📦 Product {name} has NO images. Uploading...")
                    upload_image_to_ms(ms_id, image_url, name)
        except:
            pass

if __name__ == "__main__":
    main()
