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

def get_product_details(ms_id):
    """Fetch details for a product from MoySklad"""
    url = f"{BASE_URL}/entity/product/{ms_id}"
    try:
        resp = requests.get(url, headers=HEADERS)
        if resp.status_code == 200:
            return resp.json()
    except Exception as e:
        print(f"Error fetching details for {ms_id}: {e}")
    return None

def main():
    print("🚀 Starting MoySklad Data Sync (Prices & Images)...")
    
    # Fetch products from Supabase that have a moysklad_id
    response = supabase.schema('Parser').table('products').select("id, name, moysklad_id").not_.is_("moysklad_id", "null").execute()
    
    products = response.data
    print(f"Found {len(products)} products to check.")
    
    updated_count = 0
    
    for p in products:
        ms_id = p['moysklad_id']
        # print(f"Checking {p['name']} ({ms_id})...")
        
        data = get_product_details(ms_id)
        
        if data:
            updates = {}
            
            # 1. Min Price
            min_price = 0
            if 'minPrice' in data:
                min_price = data['minPrice'].get('value', 0)
                updates['min_price'] = min_price
            
            # 2. Cost Price (buyPrice)
            cost_price = 0
            if 'buyPrice' in data:
                cost_price = data['buyPrice'].get('value', 0)
                updates['cost_price'] = cost_price
                
            # 3. Sale Price (first one)
            sale_price = 0
            if 'salePrices' in data and len(data['salePrices']) > 0:
                sale_price = data['salePrices'][0].get('value', 0)
                updates['price'] = sale_price

            if updates:
                try:
                    supabase.schema('Parser').table('products').update(updates).eq("id", p['id']).execute()
                    print(f"✅ Updated {p['name']}: Min={min_price/100}, Cost={cost_price/100}, Sale={sale_price/100}")
                    updated_count += 1
                except Exception as e:
                    print(f"❌ Error updating Supabase: {e}")
        else:
            print(f"⚠️ Could not fetch data for {p['name']}")
            
    print(f"🏁 Sync complete. Updated {updated_count} products.")

if __name__ == "__main__":
    main()
