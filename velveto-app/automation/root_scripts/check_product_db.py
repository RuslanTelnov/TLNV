import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv(os.path.join(os.getcwd(), "moysklad-web", ".env.local"))

url: str = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key: str = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not url or not key:
    print("❌ Supabase credentials not found in .env.local")
    exit(1)

supabase: Client = create_client(url, key)

import sys
article = sys.argv[1] if len(sys.argv) > 1 else "123873313"

print(f"🔍 Searching for article: {article}")

try:
    response = supabase.schema('Parser').table('products').select("*").eq("article", article).execute()
    
    if response.data:
        print(f"✅ Found {len(response.data)} product(s):")
        for p in response.data:
            print(f"  - ID: {p.get('id')}")
            print(f"  - Name: {p.get('name')}")
            print(f"  - Article: {p.get('article')}")
            print(f"  - Stock: {p.get('stock')}")
    else:
        print("❌ Product not found in 'products' table.")

except Exception as e:
    print(f"❌ Error: {e}")
