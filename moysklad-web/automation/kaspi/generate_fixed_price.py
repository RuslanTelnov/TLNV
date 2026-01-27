import os
import requests
import xml.etree.ElementTree as ET
from datetime import datetime
from supabase import create_client
from dotenv import load_dotenv

# Config
FIXCOM_XML_URL = "https://mskaspi.fixhub.kz/xml/35fde8f355cd299f7a3e26cbe0e4f917.xml"
RETAIL_DIVISOR = 0.3 # Matching route.js logic

def generate_xml():
    print(f"🚀 Starting Hybrid XML generation...")
    
    # 1. Load Enviroment
    # Explicitly check for .env locations
    env_paths = [
        'moysklad-web/.env.local',
        '.env',
        '../.env'
    ]
    loaded = False
    for path in env_paths:
        if os.path.exists(path):
            load_dotenv(path)
            print(f"✅ Loaded env from {path}")
            loaded = True
            break
            
    sb_url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    sb_key = os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    
    if not sb_url or not sb_key:
        print("❌ Supabase credentials missing!")
        return
        
    supabase = create_client(sb_url, sb_key)
    
    # 2. Fetch Fixcom XML
    print(f"📡 Fetching Fixcom XML: {FIXCOM_XML_URL}")
    try:
        resp = requests.get(FIXCOM_XML_URL, timeout=30)
        resp.raise_for_status()
        fixcom_root = ET.fromstring(resp.content)
    except Exception as e:
        print(f"❌ Failed to fetch Fixcom XML: {e}")
        return

    # 3. Fetch Local Products
    print("🔍 Fetching local products from Supabase...")
    # Fetch mapping for MoySklad codes
    ms_res = supabase.table('products').select('article, code').execute()
    code_map = {str(p['article']): p['code'] for p in ms_res.data if p['article'] and p['code']}
    
    # Fetch our newly created products
    local_res = supabase.table('wb_search_results').select('*').eq('kaspi_created', True).execute()
    local_products = local_res.data
    print(f"📦 Found {len(local_products)} local products marked as created on Kaspi.")
    if local_products:
        print(f"DEBUG: First 5 local IDs: {[p['id'] for p in local_products[:5]]}")

    # 4. Prepare for Merge
    # Extract existing SKUs from Fixcom to avoid duplicates
    # Note: Using namespace for findall
    ns = {'k': 'kaspiShopping'}
    existing_skus = set()
    offers_node = fixcom_root.find('k:offers', ns)
    if offers_node is None:
        offers_node = ET.SubElement(fixcom_root, '{kaspiShopping}offers')
    else:
        for offer in offers_node.findall('k:offer', ns):
            sku = offer.get('sku')
            if sku:
                existing_skus.add(str(sku))

    print(f"🔗 Fixcom already has {len(existing_skus)} offers.")

    # 5. Add local products to XML
    added_count = 0
    # 5. Add local products to XML
    NS_URI = "kaspiShopping"
    NS = f"{{{NS_URI}}}" # e.g. {kaspiShopping}
    
    added_count = 0
    for p in local_products:
        specs = p.get('specs', {})
        
        # Consistent SKU Logic: Specs -> codeMap -> ID Fallback (No suffixes)
        sku = specs.get('kaspi_sku')
        if not sku:
            sku = code_map.get(str(p['id']))
        if not sku:
            sku = f"{p['id']}"
            
        sku = str(sku)
        
        if sku in existing_skus:
            continue
            
        price_kzt = p.get('price_kzt', 0)
        price = int(price_kzt / RETAIL_DIVISOR)
        
        if price < 500:
            continue
            
        stock = 'yes' if specs.get('stock', 0) > 0 else 'no'
        
        # Create Offer element WITH NAMESPACE
        offer = ET.SubElement(offers_node, f'{NS}offer', sku=sku)
        
        model_name = p['name']
        if len(model_name) > 100:
            model_name = model_name[:97] + "..."
            
        ET.SubElement(offer, f'{NS}model').text = model_name
        ET.SubElement(offer, f'{NS}brand').text = p.get('brand') or 'Generic'
        
        availabilities = ET.SubElement(offer, f'{NS}availabilities')
        ET.SubElement(availabilities, f'{NS}availability', available=stock, storeId='PP1')
        
        ET.SubElement(offer, f'{NS}price').text = str(price)
        
        existing_skus.add(sku)
        added_count += 1

    # 6. Update Metadata
    fixcom_root.set('date', datetime.now().strftime('%d.%m.%Y %H:%M'))
    
    # 7. Write to File
    # Register namespace to avoid ns0: prefixes
    ET.register_namespace('', NS_URI)
    
    print(f"💾 Saving consolidated XML with {len(existing_skus)} total offers...")
    tree = ET.ElementTree(fixcom_root)
    
    # Save to both root and public (to be sure)
    output_paths = ['price.xml', 'moysklad-web/public/price.xml']
    
    for out_path in output_paths:
        try:
            with open(out_path, 'wb') as f:
                f.write(b'<?xml version="1.0" encoding="utf-8"?>\n')
                tree.write(f, encoding='utf-8', xml_declaration=False)
            print(f"✅ Success! Generated {out_path} (Added {added_count} new products).")
        except Exception as e:
            print(f"⚠️ Failed to write to {out_path}: {e}")

if __name__ == "__main__":
    generate_xml()
