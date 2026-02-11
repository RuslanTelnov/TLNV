import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv(os.path.join(os.getcwd(), "moysklad-web", ".env.local"))

url: str = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key: str = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

supabase: Client = create_client(url, key)

article = "123873313"

print(f"🔍 Searching for article {article} in wb_products...")

try:
    # Try 'wb_products' or 'wildberries_products' - checking table list first might be better but let's guess
    # Based on previous context, it might be 'wb_products'
    response = supabase.schema('Parser').table('wb_products').select("*").eq("nm_id", int(article)).execute()
    
    if response.data:
        print(f"✅ Found in wb_products: {len(response.data)}")
    else:
        print("❌ Not found in wb_products.")

except Exception as e:
    print(f"❌ Error (wb_products): {e}")
    
    # Try searching by article string if nm_id is not the column or type mismatch
    try:
        response = supabase.schema('Parser').table('wb_products').select("*").eq("article", article).execute()
        if response.data:
             print(f"✅ Found in wb_products (by article col): {len(response.data)}")
        else:
             print("❌ Not found in wb_products (by article col).")
    except Exception as e2:
        print(f"❌ Error 2: {e2}")
