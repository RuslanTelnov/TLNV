import os
import asyncio
from dotenv import load_dotenv
from supabase import create_client
from sync_stock import sync_stock

load_dotenv("moysklad-automation/.env")

# Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def clean_and_sync():
    print("🧹 Starting cleanup and sync process...")

    # 1. Reset all stocks to 0
    print("1️⃣  Resetting all stocks to 0 in Supabase...")
    try:
        # Update all rows where stock is not -1 (effectively all)
        # Using a filter that matches everything is required by Supabase API for mass updates usually
        # But supabase-py might allow it. Let's try to fetch IDs first to be safe and batch update?
        # Or just use a broad filter.
        
        # Fetch all IDs first
        res = supabase.schema('Parser').table('products').select("id").execute()
        all_ids = [item['id'] for item in res.data]
        print(f"   Found {len(all_ids)} products. Resetting stocks...")
        
        # Batch update is not directly supported in one call for different values, 
        # but here value is same (0).
        # We can try updating with a filter.
        
        # Chunking to avoid timeouts if many products
        chunk_size = 1000
        for i in range(0, len(all_ids), chunk_size):
            chunk = all_ids[i:i+chunk_size]
            supabase.schema('Parser').table('products').update({"stock": 0}).in_("id", chunk).execute()
            print(f"   Reset chunk {i}-{i+len(chunk)}")
            
    except Exception as e:
        print(f"❌ Error resetting stocks: {e}")
        return

    # 2. Run Sync (Updates stock for items that exist in MS with > 0)
    print("\n2️⃣  Running Sync Stock...")
    sync_stock()

    # 3. Delete products with stock 0 - SKIPPED for Market Scout
    # print("\n3️⃣  Deleting products with stock 0...")
    # try:
    #     # Delete where stock is 0
    #     res = supabase.schema('Parser').table('products').delete().eq("stock", 0).execute()
    #     print(f"✅ Deleted {len(res.data)} products with 0 stock.")
    # except Exception as e:
    #     print(f"❌ Error deleting products: {e}")

    print("\n🏁 Cleanup complete.")

if __name__ == "__main__":
    clean_and_sync()
