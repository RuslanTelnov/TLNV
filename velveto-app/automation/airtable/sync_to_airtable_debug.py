import os
import requests
import time
import json
from dotenv import load_dotenv
from supabase import create_client, Client

# Load env variables
env_paths = [
    os.path.join(os.getcwd(), ".env.local"),
    os.path.join(os.path.dirname(__file__), "..", "..", ".env.local"),
    os.path.join(os.getcwd(), ".env")
]
for path in env_paths:
    if os.path.exists(path):
        load_dotenv(path)
        break

URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL", "").strip('"').strip("'")
KEY = (os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY", "")).strip('"').strip("'")

if not URL or not KEY:
    print("❌ Error: Supabase credentials not found in env")
    exit(1)

supabase: Client = create_client(URL, KEY)

def get_config():
    try:
        res = supabase.schema('Parser').table('client_configs').select('*').limit(1).execute()
        if res.data:
            return res.data[0]
    except Exception as e:
        print(f"⚠️ Error fetching config: {e}")
    return None

def sync_products():
    config = get_config()
    if not config:
        print("❌ Config not found.")
        return

    # API Token Logic
    api_key = os.getenv("AIRTABLE_API_KEY")
    if not api_key:
        api_key = config.get('airtable_api_key') or config.get('rest_api_key')
        
    base_id = os.getenv("AIRTABLE_BASE_ID") or config.get('airtable_base_id')
    
    # Table names from config or defaults
    table_main = config.get('airtable_table_name') or "Main"
    table_fix = config.get('airtable_fix_table') or "Requires Fix"
    table_rejected = config.get('airtable_rejected_table') or "Rejected"

    if not api_key or not base_id or not table_main:
        # print(f"ℹ️ Airtable not fully configured.")
        return

    print(f"🔄 Syncing to Airtable: {table_main}, {table_fix}, {table_rejected}")

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    def sync_to_table(product, table_name, id_key):
        specs = product.get('specs') or {}
        already_synced_id = specs.get(id_key)
        
        # Mapping to Russian columns per User Request
        k_status = specs.get('kaspi_status') or ('created' if product.get('kaspi_created') else 'pending')
        
        # Map internal status to Russian human-readable
        status_map = {
            'pending': 'Ожидание',
            'moderation': 'На модерации',
            'created': 'Опубликован',
            'requires_fix': 'Нужна доработка',
            'rejected': 'Отклонен',
            'manual_review': 'Ручная проверка'
        }
        status_ru = status_map.get(k_status, k_status)
        
        if specs.get('needs_manual_review'):
             status_ru = "Проверка данных (WB)"

        # Get MS Code for the and Airtable column
        ms_code = specs.get('kaspi_sku')
        if not ms_code:
            # Try to fetch from products table if available
            try:
                res_ms = supabase.schema('Parser').table('products').select('code').eq('article', str(product['id'])).execute()
                if res_ms.data:
                    ms_code = res_ms.data[0].get('code')
            except: pass

        # Get Moderation Comments
        comment = specs.get('moderation_comment') or ""
        if not comment and specs.get('kaspi_errors'):
            errors = specs.get('kaspi_errors')
            if isinstance(errors, list):
                comment = "; ".join([str(e) for e in errors])
            else:
                comment = str(errors)
        
        # Add Integrity Error to comment if present
        integrity_error = specs.get('integrity_error')
        if integrity_error:
             if comment: comment += f" | ОШИБКА: {integrity_error}"
             else: comment = f"ОШИБКА: {integrity_error}"

        fields = {
            "Название": product.get('name') or "Unknown",
            "Категория": specs.get('kaspi_category') or product.get('query') or "Unknown",
            "Бренд": product.get('brand') or "Generic",
            "Цена": product.get('price_kzt') or 0,
            "Артикул WB": str(product.get('id')),
            "Код МС": ms_code or "",
            "Статус": status_ru,
            "Комментарий": comment,
            "Изображение": product.get('image_url') or ""
        }

        url = f"https://api.airtable.com/v0/{base_id}/{table_name}"
        
        try:
            # We use POST for all since user wants to see them in new tables
            # But for MAIN we can use PATCH to update status
            resp = None
            if table_name == table_main and already_synced_id:
                resp = requests.patch(f"{url}/{already_synced_id}", headers=headers, json={"fields": fields})
            else:
                # For Fix/Rejected, we always want to ensure it exists
                if already_synced_id:
                     print(f"🔄 Updating existing record {already_synced_id} in {table_name}...")
                     resp = requests.patch(f"{url}/{already_synced_id}", headers=headers, json={"fields": fields})
                     
                     # 🚨 KEY FIX: If record was deleted in Airtable (404), create it again!
                     if resp.status_code == 404:
                         print(f"⚠️ Record {already_synced_id} not found in Airtable (deleted?). Re-creating...")
                         resp = requests.post(url, headers=headers, json={"fields": fields})
                else:
                     print(f"➕ Creating new record in {table_name}...")
                     resp = requests.post(url, headers=headers, json={"fields": fields})
            
            if resp.status_code in [200, 201]:
                return resp.json().get('id')
            else:
                print(f"❌ Airtable Error ({table_name}): {resp.status_code} - {resp.text}")
                return None
        except Exception as e:
            print(f"❌ Airtable Request Exception: {e}")
            return None

    while True:
        try:
            # Fetch products that need sync
            # Logic: either not in Main, OR (is moderation error AND not in Fix table), OR (is rejected AND not in Rejected table)
            # For simplicity, we fetch recent updates and check their specs.
            # Fetch ONLY the test product
            res = supabase.schema('Parser').table('wb_search_results')\
                .select('*')\
                .eq('id', 158419112)\
                .execute()
            
            products = res.data or []
            if not products:
                break

            processed_count = 0
            for p in products:
                specs = p.get('specs') or {}
                k_status = specs.get('kaspi_status') or ('created' if p.get('kaspi_created') else 'pending')
                
                updated_specs = False
                
                # 1. Sync to Main Table (Always)
                main_id = sync_to_table(p, table_main, 'airtable_id')
                if main_id and main_id != specs.get('airtable_id'):
                    specs['airtable_id'] = main_id
                    updated_specs = True
                
                # 2. Filter-based routing
                if k_status == 'requires_fix' or specs.get('needs_manual_review'):
                     # Both internal 'requires_fix' and our new 'manual_review' go to the fix table
                     fix_id = sync_to_table(p, table_fix, 'airtable_fix_id')
                     if fix_id and fix_id != specs.get('airtable_fix_id'):
                         specs['airtable_fix_id'] = fix_id
                         updated_specs = True
                         
                elif k_status == 'rejected':
                     rej_id = sync_to_table(p, table_rejected, 'airtable_rejected_id')
                     if rej_id and rej_id != specs.get('airtable_rejected_id'):
                         specs['airtable_rejected_id'] = rej_id
                         updated_specs = True
                
                if updated_specs:
                    supabase.schema('Parser').table('wb_search_results')\
                        .update({'specs': specs})\
                        .eq('id', p['id'])\
                        .execute()
                    processed_count += 1
            
            print(f"✅ Sync Batch Complete. Updated {processed_count} records.")
            break # Exit loop for now (worker.py will call this periodically)

        except Exception as e:
            print(f"❌ sync_products loop error: {e}")
            break

if __name__ == "__main__":
    sync_products()
