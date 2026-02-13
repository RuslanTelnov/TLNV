import os
import sys
import json
from dotenv import load_dotenv
from supabase import create_client

load_dotenv('.env.local')
url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
supabase = create_client(url, key)

res = supabase.schema('Parser').table('wb_search_results').select("id", count="exact").eq("kaspi_created", True).execute()
print(f"Total kaspi_created=True: {res.count}")
