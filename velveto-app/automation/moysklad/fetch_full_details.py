import os
import time
import json
import requests
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def get_basket_number(wb_id):
    vol = wb_id // 100000
    if 0 <= vol <= 143: return "01"
    if 144 <= vol <= 287: return "02"
    if 288 <= vol <= 431: return "03"
    if 432 <= vol <= 719: return "04"
    if 720 <= vol <= 1007: return "05"
    if 1008 <= vol <= 1061: return "06"
    if 1062 <= vol <= 1115: return "07"
    if 1116 <= vol <= 1169: return "08"
    if 1170 <= vol <= 1313: return "09"
    if 1314 <= vol <= 1601: return "10"
    if 1602 <= vol <= 1655: return "11"
    if 1656 <= vol <= 1919: return "12"
    if 1920 <= vol <= 2045: return "13"
    if 2046 <= vol <= 2189: return "14"
    if 2190 <= vol <= 2405: return "15"
    if 2406 <= vol <= 2621: return "16"
    if 2622 <= vol <= 2837: return "17"
    if 2838 <= vol <= 3053: return "18"
    if 3054 <= vol <= 3269: return "19"
    if 3270 <= vol <= 3485: return "20"
    if 3486 <= vol <= 3701: return "21"
    return "22"

def fetch_full_details():
    print("📦 Fetching product IDs from database...")
    response = supabase.schema('Parser').table('wb_top_products').select("id").execute()
    product_ids = [item['id'] for item in response.data]
    print(f"   Found {len(product_ids)} products.")

    for wb_id in product_ids:
        print(f"🔄 Processing {wb_id}...")
        try:
            vol = wb_id // 100000
            part = wb_id // 1000
            basket = get_basket_number(wb_id)
            
            # Fetch card.json
            url = f"https://basket-{basket}.wbbasket.ru/vol{vol}/part{part}/{wb_id}/info/ru/card.json"
            resp = requests.get(url, timeout=10)
            
            if resp.status_code != 200:
                print(f"   ❌ API Error: {resp.status_code}")
                continue
                
            data = resp.json()
            
            # Extract Specs
            specs = {}
            for opt in data.get("options", []):
                name = opt.get("name")
                value = opt.get("value")
                if name and value:
                    specs[name] = value
            
            # Extract Images
            # We can try to guess count or use 'media' field if available
            # But let's just try to fetch up to 20 images or until 404?
            # Actually, 'media' field usually has 'count' or similar?
            # Let's just assume up to 10 images for now, or check if 'media' -> 'count' exists
            
            pics_count = 10 # Default fallback
            if "media" in data and "count" in data["media"]:
                 pics_count = data["media"]["count"]
            elif "media" in data and "has_video" in data["media"]:
                 # Sometimes structure varies, but let's stick to simple loop
                 pass
            
            # Better approach: check if image exists? No, that's slow.
            # Let's just generate 10 URLs. The frontend will handle 404s? 
            # Or we can check the first few.
            # Actually, the 'card.wb.ru' API returned 'pics' count. 'card.json' might not have it directly in top level.
            # But 'media' usually has it.
            
            images = []
            for i in range(1, 12): # Try 11 images
                img_url = f"https://basket-{basket}.wbbasket.ru/vol{vol}/part{part}/{wb_id}/images/big/{i}.webp"
                images.append(img_url)
            
            # Update Database
            update_data = {
                "specs": specs,
                "images": images,
                "brand": data.get("selling", {}).get("brand_name", "") or data.get("subj_name", ""),
                # "name": data.get("imt_name", "") # Sometimes imt_name is empty
            }
            
            supabase.schema('Parser').table('wb_top_products').update(update_data).eq("id", wb_id).execute()
            print(f"   ✅ Updated {wb_id}: {len(specs)} specs")
            
            time.sleep(0.2)

        except Exception as e:
            print(f"   ❌ Error processing {wb_id}: {e}")

if __name__ == "__main__":
    fetch_full_details()
