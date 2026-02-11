import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Fetch WB products
wb_response = supabase.schema('Parser').table('wb_top_products').select("id, name, image_url").execute()
wb_map = {str(p['id']): p for p in wb_response.data}

# Fetch MS products
ms_response = supabase.schema('Parser').table('products').select("id, name, article").limit(50).execute()

print(f"Found {len(wb_map)} WB products.")
print("-" * 30)

matches = 0
for p in ms_response.data:
    article = str(p.get('article', '')).strip()
    if article in wb_map:
        print(f"MATCH! MS Product '{p['name']}' (Art: {article}) -> WB Image: {wb_map[article]['image_url']}")
        matches += 1
    else:
        # print(f"No match for MS Product '{p['name']}' (Art: {article})")
        pass

print("-" * 30)
print(f"Total Matches: {matches}")
