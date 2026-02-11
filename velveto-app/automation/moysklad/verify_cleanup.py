import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv("moysklad-automation/.env")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def verify():
    print("Verifying cleanup...")
    # Check for products with stock 0
    res = supabase.schema('Parser').table('products').select("count", count="exact").eq("stock", 0).execute()
    count = res.count
    
    if count == 0:
        print("✅ Verification PASSED: No products with stock 0 found.")
    else:
        print(f"❌ Verification FAILED: Found {count} products with stock 0.")

if __name__ == "__main__":
    verify()
