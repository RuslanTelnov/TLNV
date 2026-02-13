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

print("🔍 Auditing last 50 unique uploads...")
res = supabase.schema('Parser').table('wb_search_results').select("id, specs").not_.is_("specs->>kaspi_upload_id", "null").order("updated_at", desc=True).limit(200).execute()

tasks = {}
for p in res.data:
    uid = p['specs'].get('kaspi_upload_id')
    if uid and uid != "unknown" and uid not in tasks:
        tasks[uid] = p

print(f"📡 Checking {len(tasks)} unique upload IDs...")

stats = {"SUCCESS": 0, "ERRORS": 0, "PROCESSING": 0, "OTHER": 0}
for uid in list(tasks.keys())[:50]:
    try:
        res = client.get_import_result(uid)
        total = res.get('total', 0)
        errs = res.get('errors', 0)
        
        if total > 0 and errs == 0:
            stats["SUCCESS"] += 1
        elif errs > 0:
            stats["ERRORS"] += 1
            # print(f"❌ {uid}: {errs} errors")
        else:
            stats["PROCESSING"] += 1
    except:
        stats["OTHER"] += 1

print(f"\nSummary of last 50 uploads:")
print(json.dumps(stats, indent=2))
