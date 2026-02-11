import os
import requests
import base64
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

# Supabase settings
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
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

def get_price_type(name="Розничная цена"):
    """Get price type meta"""
    url = f"{BASE_URL}/context/companysettings/pricetype"
    try:
        resp = requests.get(url, headers=HEADERS)
        if resp.status_code == 200:
            for pt in resp.json():
                if pt['name'] == name:
                    return pt['meta']
            if len(resp.json()) > 0:
                return resp.json()[0]['meta']
    except Exception as e:
        print(f"❌ Error getting price type: {e}")
    return None

def download_image_as_base64(url):
    """Download image and convert to base64"""
    try:
        resp = requests.get(url)
        if resp.status_code == 200:
            return base64.b64encode(resp.content).decode('utf-8')
    except Exception as e:
        print(f"❌ Error downloading image: {e}")
    return None

def update_product_in_ms(product, price_type_meta):
    """Update product in MoySklad"""
    name = product['name']
    wb_id = str(product['id'])
    image_url = product['image_url']
    
    # Find product by externalCode
    url = f"{BASE_URL}/entity/product?filter=externalCode={wb_id}"
    try:
        resp = requests.get(url, headers=HEADERS)
        if resp.status_code != 200:
            print(f"❌ Error searching for '{name}': {resp.text}")
            return False
            
        rows = resp.json().get('rows', [])
        if not rows:
            print(f"⚠️ Product '{name}' not found in MS.")
            return False
            
        ms_product_id = rows[0]['id']
        
        # Prepare update payload
        payload = {
            "salePrices": [
                {
                    "value": 0, # Zero price
                    "priceType": {"meta": price_type_meta}
                }
            ]
        }
        
        # Add image if available
        if image_url:
            img_b64 = download_image_as_base64(image_url)
            if img_b64:
                payload["images"] = [{
                    "filename": "image.jpg",
                    "content": img_b64
                }]
                print(f"   📸 Image downloaded and prepared.")
        
        # Update product
        update_url = f"{BASE_URL}/entity/product/{ms_product_id}"
        update_resp = requests.put(update_url, json=payload, headers=HEADERS)
        
        if update_resp.status_code == 200:
            print(f"✅ Updated '{name}': Price=0, Image Uploaded.")
            return True
        else:
            print(f"❌ Error updating '{name}': {update_resp.text}")
            
    except Exception as e:
        print(f"❌ Error updating product: {e}")
    
    return False

def main():
    print("🚀 Starting WB Product Refinement in MoySklad...")

    # 1. Get Price Type
    price_type_meta = get_price_type("Розничная цена")
    if not price_type_meta:
        print("❌ Failed to get price type. Aborting.")
        return

    # 2. Fetch WB Products
    response = supabase.schema('Parser').table('wb_top_products').select("*").execute()
    products = response.data
    print(f"Found {len(products)} products to update.")
    
    updated_count = 0
    for p in products:
        if update_product_in_ms(p, price_type_meta):
            updated_count += 1
            
    print(f"🏁 Update complete. Refined {updated_count} products.")

if __name__ == "__main__":
    main()
