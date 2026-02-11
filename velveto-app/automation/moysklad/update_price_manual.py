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

def update_price():
    nm_id = 124019598
    price = 4320 # Verified via user screenshot
    
    data = {
        "id": nm_id,
        "price": price,
        "sale_price_u": price,
        "updated_at": datetime.utcnow().isoformat(),
        "currency": "KZT"
    }
    
    print(f"Updating {nm_id} with price {price} KZT...")
    try:
        supabase.schema('Parser').table('wb_top_products').upsert(data).execute()
        print("Success!")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    update_price()
