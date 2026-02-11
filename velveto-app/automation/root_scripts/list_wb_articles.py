import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv(os.path.join(os.getcwd(), "moysklad-web", ".env.local"))

url: str = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key: str = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

supabase: Client = create_client(url, key)

print(f"🔍 Listing articles in wb_top_products...")

try:
    response = supabase.schema('Parser').table('wb_top_products').select("id, name").limit(10).execute()
    
    if response.data:
        for item in response.data:
            print(f"ID: {item['id']}, Name: {item['name']}")
    else:
        print("❌ No products found.")

except Exception as e:
    print(f"❌ Error: {e}")
