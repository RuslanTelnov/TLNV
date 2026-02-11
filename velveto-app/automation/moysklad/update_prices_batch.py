import os
from dotenv import load_dotenv
from supabase import create_client, Client
from datetime import datetime

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Error: SUPABASE_URL or SUPABASE_KEY not found")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def update_prices():
    updates = [
        {"id": 114992813, "price": 3770},
        {"id": 309265419, "price": 4770},
        {"id": 200527396, "price": 5560}
    ]
    
    for item in updates:
        data = {
            "id": item["id"],
            "price": item["price"],
            "sale_price_u": item["price"],
            "updated_at": datetime.utcnow().isoformat(),
            "currency": "KZT"
        }
        
        print(f"Updating {item['id']} with price {item['price']} KZT...")
        try:
            supabase.schema('Parser').table('wb_top_products').upsert(data).execute()
            print("Success!")
        except Exception as e:
            print(f"Error updating {item['id']}: {e}")

if __name__ == "__main__":
    update_prices()
