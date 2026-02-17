import os
import sys
from supabase import create_client
from dotenv import load_dotenv

def main():
    load_dotenv("velveto-app/.env.local")
    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    
    if not url or not key:
        print("Error: Supabase credentials missing")
        return
        
    supabase = create_client(url, key)
    
    # 1. Total products in wb_search_results
    res = supabase.schema('Parser').table('wb_search_results').select('count', count='exact').execute()
    total = res.count
    
    # 2. MS Created
    res = supabase.schema('Parser').table('wb_search_results').select('count', count='exact').eq('ms_created', True).execute()
    ms_count = res.count
    
    # 3. Kaspi Created
    res = supabase.schema('Parser').table('wb_search_results').select('count', count='exact').eq('kaspi_created', True).execute()
    kaspi_count = res.count
    
    # 4. Analyze Status and Brand Distribution
    res = supabase.schema('Parser').table('wb_search_results').select('brand, specs, kaspi_created, conveyor_status').execute()
    k_stats = {}
    c_stats = {}
    b_stats = {}
    
    for r in res.data:
        # Brand
        b = r.get('brand') or 'Generic'
        b_stats[b] = b_stats.get(b, 0) + 1
        
        # Kaspi Status (from specs)
        specs = r.get('specs') or {}
        k_s = specs.get('kaspi_status') or ('created' if r.get('kaspi_created') else 'none')
        k_stats[k_s] = k_stats.get(k_s, 0) + 1
        
        # Conveyor Status
        c_s = r.get('conveyor_status') or 'none'
        c_stats[c_s] = c_stats.get(c_s, 0) + 1

    print(f"📊 --- Database Diagnostics ---")
    print(f"Total Products: {total}")
    print(f"MoySklad Created: {ms_count}")
    print(f"Kaspi Created: {kaspi_count}")
    
    print(f"\n🏷️  Kaspi Status Distribution (from specs):")
    for s, c in k_stats.items():
        print(f"- {s}: {c}")
        
    print(f"\n⚙️  Conveyor Status Distribution:")
    for s, c in c_stats.items():
        print(f"- {s}: {c}")

    print(f"\n🏭 Brand Distribution (Top 10):")
    sorted_brands = sorted(b_stats.items(), key=lambda x: x[1], reverse=True)
    for b, c in sorted_brands[:10]:
        print(f"- {b}: {c}")

    # 6. Check Config
    res = supabase.schema('Parser').table('client_configs').select('*').limit(1).execute()
    if res.data:
        config = res.data[0]
        print(f"\n🔧 Config:")
        print(f"- Airtable Base: {config.get('airtable_base_id')}")
        print(f"- Airtable Table: {config.get('airtable_table_name')}")
        print(f"- Autonomous Mode: {config.get('is_autonomous_mode')}")
    
    # 5. Check for common errors in conveyor_log
    res = supabase.schema('Parser').table('wb_search_results').select('conveyor_log').not_.is_('conveyor_log', 'null').limit(20).execute()
    if res.data:
        print(f"\n📝 Recent Logs Snippets:")
        for r in res.data:
            print(f"- {r['conveyor_log'][:100]}")

if __name__ == "__main__":
    main()
