import os
import sys
import json
from dotenv import load_dotenv
from supabase import create_client

# Add paths
sys.path.append(os.path.join(os.getcwd(), 'automation/kaspi'))
from modules.kaspi_api_client import KaspiApiClient
import config

load_dotenv('.env.local')
sb_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
sb_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
supabase = create_client(sb_url, sb_key)

token = config.KASPI_API_TOKEN or os.getenv("KASPI_API_TOKEN") or os.getenv("KASPI_TOKEN")
client = KaspiApiClient(token)

print("🔍 Fetching uploads from database...")
# Fetch recent products with upload IDs
res = supabase.schema('Parser').table('wb_search_results').select("id, name, specs").not_.is_("specs->>kaspi_upload_id", "null").limit(100).execute()

tasks = {}
for p in res.data:
    upload_id = p['specs'].get('kaspi_upload_id')
    if upload_id and upload_id != "unknown":
        if upload_id not in tasks:
            tasks[upload_id] = []
        tasks[upload_id].append(p)

print(f"📡 Found {len(tasks)} unique upload tasks to check.")

for upload_id, products in tasks.items():
    print(f"\nChecking task {upload_id}...")
    try:
        result = client.get_import_result(upload_id)
        # Check if there are errors
        if result.get('errors', 0) > 0:
            print(f"❌ Task has {result['errors']} errors.")
            # For each product in the task, check its specific result
            res_details = result.get('result', {})
            for p in products:
                sku = p['specs'].get('kaspi_sku')
                if sku in res_details:
                    status = res_details[sku].get('state')
                    if status == "ERRORS":
                        errs = res_details[sku].get('errors', [])
                        print(f"  - Product {p['id']} ({p['name']}) FAILED: {errs}")
                        # OPTIONAL: Reset in DB?
    except Exception as e:
        print(f"  Error checking task {upload_id}: {e}")
