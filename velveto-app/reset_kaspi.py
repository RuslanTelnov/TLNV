import os
import sys
import json
from dotenv import load_dotenv
from supabase import create_client

load_dotenv('.env.local')
sb_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
sb_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
supabase = create_client(sb_url, sb_key)

print("🔄 Resetting products with potential Kaspi validation errors...")

# Query using JSONB arrow operator
query = supabase.schema('Parser').table('wb_search_results').select("id, specs") \
    .eq("kaspi_created", True) \
    .limit(1000)

# We can also add a filter for specs->>kaspi_status.neq.approved manually if needed
# but let's just fetch all created and filtered in python if needed.

res = query.execute()

if not res.data:
    print("No products found to reset.")
    sys.exit(0)

filtered_data = [p for p in res.data if p.get('specs', {}).get('kaspi_status') != 'approved']
print(f"📡 Found {len(filtered_data)} products to reset (excluding approved).")

# Do it in batches of 50
batch_size = 50
for i in range(0, len(filtered_data), batch_size):
    batch = filtered_data[i:i+batch_size]
    print(f"Processing batch {i//batch_size + 1}...")
    
    for p in batch:
        pid = p['id']
        specs = p.get('specs', {})
        specs.pop('kaspi_created', None)
        specs.pop('kaspi_upload_id', None)
        specs.pop('kaspi_sku', None)
        specs.pop('kaspi_status', None)
        specs['kaspi_reset_at'] = "now()"
        
        try:
             supabase.schema('Parser').table('wb_search_results').update({
                "kaspi_created": False,
                "conveyor_status": "idle",
                "specs": specs
            }).eq("id", pid).execute()
        except Exception as e:
             print(f"Error resetting {pid}: {e}")

print("✅ Reset complete. Conveyor will now pick them up and re-create cards.")
