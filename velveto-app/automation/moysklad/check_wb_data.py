import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

response = supabase.schema('Parser').table('wb_top_products').select("*").limit(5).execute()

print(f"Found {len(response.data)} products in wb_top_products:")
for p in response.data:
    print(f"ID: {p['id']}, Name: {p['name']}, Price: {p['price']}, Sale Price U: {p.get('sale_price_u')}")
