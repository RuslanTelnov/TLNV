import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# The 5 WB IDs we fetched
wb_ids = [200527396, 114992813, 309265419, 179790764, 124019598]
wb_ids_str = [str(id) for id in wb_ids]

print(f"Checking for WB IDs: {wb_ids_str}")

response = supabase.schema('Parser').table('products').select("id, name, article").in_("article", wb_ids_str).execute()

print(f"Found {len(response.data)} matches in MS products table:")
for p in response.data:
    print(f"MATCH! MS ID: {p['id']}, Name: {p['name']}, Article: {p['article']}")
