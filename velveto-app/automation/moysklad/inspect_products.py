import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

response = supabase.schema('Parser').table('products').select("id, name, article").limit(20).execute()

print("MS Products Sample:")
for p in response.data:
    print(f"ID: {p['id']}, Name: {p['name']}, Article: '{p.get('article')}'")
