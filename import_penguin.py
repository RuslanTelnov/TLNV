
import xml.etree.ElementTree as ET
import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv('moysklad-web/.env.local')
supabase_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
supabase_key = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
supabase = create_client(supabase_url, supabase_key)

ns = {'k': 'kaspiShopping'}
tree = ET.parse('fixcom_debug.xml')
root = tree.getroot()

# Find the specific offer
sku_target = "106768358_162916029"
offer = root.find(f".//k:offer[@sku='{sku_target}']", ns)

if offer:
    name = offer.find('k:model', ns).text
    price = offer.find('k:price', ns).text
    stock_node = offer.find('.//k:availability', ns)
    stock = stock_node.get('available') == 'yes' if stock_node else False
    
    print(f"Found: {name}, Price: {price}, Stock: {stock}")
    
    data = {
        'id': 106768358,
        'name': name,
        'price_kzt': int(price) if price else 0,
        'specs': {'legacy': True, 'kaspi_sku': sku_target, 'imported_from_fixcom': True}, 
        'updated_at': 'now()', 
        'kaspi_created': True
    }
    
    try:
        supabase.table('wb_search_results').upsert(data).execute()
        print('✅ Imported Penguin successfully')
    except Exception as e:
        print(f"Error upserting: {e}")
else:
    print("❌ Offer not found")
