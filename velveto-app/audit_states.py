import os
import sys
import json
from dotenv import load_dotenv
from supabase import create_client

load_dotenv('.env.local')
url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
supabase = create_client(url, key)

res_true = supabase.schema('Parser').table('wb_search_results').select("id", count="exact").eq("kaspi_created", True).execute()
res_false = supabase.schema('Parser').table('wb_search_results').select("id", count="exact").eq("kaspi_created", False).execute()
res_null = supabase.schema('Parser').table('wb_search_results').select("id", count="exact").is_("kaspi_created", "null").execute()

print(f"True: {res_true.count}")
print(f"False: {res_false.count}")
print(f"Null: {res_null.count}")
