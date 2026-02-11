import os
import requests
import json
import sys
from supabase import create_client
from dotenv import load_dotenv

# Add parent directory to path to import config
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import config

# Load environment variables
env_paths = [
    os.path.join(os.getcwd(), 'moysklad-web', '.env.local'),
    os.path.join(os.getcwd(), '.env'),
    os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), '.env'),
    os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), 'moysklad-web', '.env.local')
]

for path in env_paths:
    if os.path.exists(path):
        load_dotenv(path)
        print(f"✅ Loaded env from {path}")
        break

SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Error: Supabase credentials not found.")
    sys.exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def get_all_products():
    """Fetch all products from Supabase to sync stock."""
    print("Fetching products from Supabase...")
    try:
        # We fetch article and stock. 
        # Ideally we should fetch from wb_search_results too if that's the source for Kaspi IDs
        res = supabase.schema('Parser').table('products').select("article, stock").execute()
        return res.data
    except Exception as e:
        print(f"Error fetching from Supabase: {e}")
        return []

def update_kaspi_availability(products):
    """Send updates to Kaspi."""
    if not products:
        print("No products to update.")
        return

    print(f"Preparing to update {len(products)} products on Kaspi...")
    
    payloads = []
    for p in products:
        sku = p.get("article")
        stock = p.get("stock", 0)
        if not sku:
            continue
            
        # Construct payload
        if stock > 0:
            item = {
                "sku": sku,
                "availability": "preorder",
                "preorderDays": 30
            }
        else:
            item = {
                "sku": sku,
                "availability": "no" 
            }
        payloads.append(item)

    # Batch send (Kaspi limits: chunks of 100 or 500)
    chunk_size = 100
    url = f"{config.KASPI_MERCHANT_API_URL}/products/import"
    headers = {
        "Content-Type": "application/json",
        "X-Auth-Token": config.KASPI_API_TOKEN,
        "User-Agent": config.USER_AGENT
    }

    for i in range(0, len(payloads), chunk_size):
        chunk = payloads[i:i+chunk_size]
        print(f"Sending chunk {i}-{i+len(chunk)}...")
        
        try:
            response = requests.post(url, json=chunk, headers=headers)
            if response.status_code in [200, 201, 202, 204]:
                print(f"✅ Batch {i} success")
            else:
                print(f"❌ Batch {i} failed: {response.status_code} - {response.text}")
        except Exception as e:
            print(f"Error sending request: {e}")

if __name__ == "__main__":
    products = get_all_products()
    if products:
        print(f"Found {len(products)} products to sync.")
        update_kaspi_availability(products)
    else:
        print("No products found to sync.")
