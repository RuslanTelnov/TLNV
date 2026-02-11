import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv(os.path.join(os.getcwd(), "moysklad-web", ".env.local"))

url: str = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key: str = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

supabase: Client = create_client(url, key)

response = supabase.schema('Parser').table('products').select("*", count="exact", head=True).execute()
print(f"Total products: {response.count}")
