import os
import requests
import time
from dotenv import load_dotenv
from supabase import create_client, Client

# Load env variables (for Supabase connection)
# Try to find .env.local in common locations
env_paths = [
    os.path.join(os.getcwd(), "moysklad-web", ".env.local"),
    os.path.join(os.path.dirname(__file__), "..", "..", ".env.local"),
    os.path.join(os.getcwd(), ".env.local")
]
for path in env_paths:
    if os.path.exists(path):
        load_dotenv(path)
        break

URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not URL or not KEY:
    print("❌ Error: Supabase credentials not found in env")
    exit(1)

supabase: Client = create_client(URL, KEY)

def get_config():
    try:
        res = supabase.schema('Parser').table('client_configs').select('*').limit(1).execute()
        if res.data:
            return res.data[0]
    except Exception as e:
        print(f"⚠️ Error fetching config: {e}")
    return None

def sync_products():
    config = get_config()
    if not config:
        print("❌ Config not found.")
        return

    api_key = config.get('airtable_api_key')
    base_id = config.get('airtable_base_id')
    table_name = config.get('airtable_table_name')

    if not api_key or not base_id or not table_name:
        # print("ℹ️ Airtable not configured. Skipping sync.")
        return

    print("🔄 Checking for new products to sync to Airtable...")

    while True:
        try:
            # Fetch unsynced products
            # Filter: airtable_id is null
            res = supabase.schema('Parser').table('wb_search_results')\
                .select('id, name, brand, price_kzt, image_url, product_url, updated_at, kaspi_status')\
                .is_('airtable_id', 'null')\
                .limit(50)\
                .execute()
            
            products = res.data or []
            if not products:
                print("✅ All up to date.")
                break

            print(f"📦 Found {len(products)} products to sync.")

            airtable_url = f"https://api.airtable.com/v0/{base_id}/{table_name}"
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }

            for product in products:
                fields = {
                    "Name": product.get('name') or "Unknown",
                    "Brand": product.get('brand') or "",
                    "Price": product.get('price_kzt'),
                    "Image URL": product.get('image_url'),
                    "Status ": product.get('kaspi_status') or "pending", # Added space
                    "WB ID": str(product.get('id'))
                }

                # Airtable requires 'fields' key
                payload = {"fields": fields}

                try:
                    # 1. Create in Airtable
                    resp = requests.post(airtable_url, headers=headers, json=payload)
                    
                    if resp.status_code in [200, 201]:
                        airtable_record = resp.json()
                        record_id = airtable_record.get('id')
                        
                        # 2. Update Supabase with Airtable ID
                        supabase.schema('Parser').table('wb_search_results')\
                            .update({'airtable_id': record_id})\
                            .eq('id', product['id'])\
                            .execute()
                            
                        print(f"✅ Synced: {product.get('name')[:30]}... -> {record_id}")
                    else:
                        print(f"❌ Airtable Error ({resp.status_code}): {resp.text}")
                        # If 404 (Table not found) or 401 (Auth), abort loop to save quota/logs
                        if resp.status_code in [401, 403, 404]:
                            return

                except Exception as e:
                    print(f"⚠️ Sync Error for {product['id']}: {e}")

            # Safety sleep to avoid Airtable rate limits (5 requests per second)
            time.sleep(1)

        except Exception as e:
            print(f"❌ Sync Loop Error: {e}")
            break

if __name__ == "__main__":
    sync_products()
