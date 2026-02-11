import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv(os.path.join(os.getcwd(), "moysklad-web", ".env.local"))

url: str = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key: str = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

supabase: Client = create_client(url, key)

article = "123873313"

print(f"🔍 Searching for article {article} in wb_top_products...")

try:
    # Try searching by id (which seems to be the article/nm_id based on page.js: Art: {product.id})
    response = supabase.schema('Parser').table('wb_top_products').select("*").eq("id", int(article)).execute()
    
    if response.data:
        print(f"✅ Found in wb_top_products: {len(response.data)}")
    else:
        print("❌ Not found in wb_top_products.")

except Exception as e:
    print(f"❌ Error: {e}")
