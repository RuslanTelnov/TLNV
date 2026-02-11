import os
import json
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Fetch top 5 products with non-empty articles
response = supabase.schema('Parser').table('products').select("id, name, article").neq("article", "").limit(5).execute()

products_to_fetch = []
for p in response.data:
    article = str(p['article']).strip()
    if article and article.isdigit():
        products_to_fetch.append({"id": p['id'], "article": article, "name": p['name']})

print(json.dumps(products_to_fetch, indent=2))
