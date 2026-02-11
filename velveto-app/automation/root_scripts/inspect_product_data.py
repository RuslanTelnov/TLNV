import os
from supabase import create_client, Client
from dotenv import load_dotenv
import json

load_dotenv(os.path.join(os.getcwd(), "moysklad-web", ".env.local"))

url: str = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key: str = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

supabase: Client = create_client(url, key)

article = "123873313"

print(f"🔍 Inspecting article: {article}")

try:
    # Check specific product
    response = supabase.schema('Parser').table('products').select("*").eq("article", article).execute()
    
    if response.data:
        product = response.data[0]
        print(f"✅ Product found: {product['name']}")
        print(f"   ID: {product['id']}")
        print(f"   Article (raw): {repr(product['article'])}")
        print(f"   Article type: {type(product['article'])}")
    else:
        print("❌ Product NOT found with exact match.")
        
        # Try finding it by iterating (in case of type mismatch in query)
        all_products = supabase.schema('Parser').table('products').select("*").execute()
        found = False
        for p in all_products.data:
            if str(p.get('article')) == article:
                print(f"⚠️ Found via iteration! DB Article: {repr(p.get('article'))}")
                found = True
                break
        if not found:
            print("❌ Product really not found.")

    # Check RLS (indirectly by seeing if we got data)
    # If we got data with anon key, RLS allows it.
    
except Exception as e:
    print(f"❌ Error: {e}")
