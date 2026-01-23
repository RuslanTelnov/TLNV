
import os
import json
from supabase import create_client
from dotenv import load_dotenv

load_dotenv("moysklad-web/.env.local")
url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

sb = create_client(url, key)

# Find a product that has a name (so it exists) but kaspi_create is false/null
# Also filter by some known category keyword if possible to ensure success
# Try explicit false or null
res = sb.table("wb_search_results").select("id, name").eq("kaspi_created", False).limit(5).execute()

if not res.data:
    # Try just searching for "духи" to see what we have
    res = sb.table("wb_search_results").select("id, name, kaspi_created").ilike("name", "%духи%").limit(5).execute()

if res.data:
    print("Candidates:")
    for item in res.data:
        print(f"ID: {item['id']} - Name: {item['name']}")
else:
    print("No candidates found.")
