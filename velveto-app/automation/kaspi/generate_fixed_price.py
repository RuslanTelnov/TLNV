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
        '.env.local',
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
    ms_res = supabase.schema('Parser').table('products').select('article, code').execute()
    code_map = {str(p['article']): p['code'] for p in ms_res.data if p['article'] and p['code']}
    
    # Fetch our newly created products
    local_res = supabase.schema('Parser').table('wb_search_results').select('*').eq('kaspi_created', True).execute()
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

    # Merge logic: if we have a local product with ID X, remove any offers in Fixcom that start with "X_"
    # This suppression allows us to "take over" the product with our clean SKU.
    local_ids_str = set(str(p['id']) for p in local_products)
    
    offers_to_remove = []
    if offers_node is not None:
        for offer in offers_node.findall('k:offer', ns):
            sku = offer.get('sku')
            if sku:
                # Check if this SKU belongs to a local product
                # Logic: SKU is exactly ID or starts with "ID_"
                for local_id in local_ids_str:
                    if sku == local_id or sku.startswith(local_id + "_"):
                        offers_to_remove.append(offer)
                        # Identify SKU to remove from existing_skus if it was added
                        if str(sku) in existing_skus:
                            existing_skus.remove(str(sku))
                        print(f"♻️  Suppressing Fixcom offer {sku} in favor of local version.")
                        break
                        
        # Remove the suppressed offers
        for offer in offers_to_remove:
            offers_node.remove(offer)

    print(f"🔗 Fixcom offers after cleanup: {len(existing_skus)}")

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
        
        # If we suppressed the old one, existing_skus doesn't have it, so we add ours.
        if sku in existing_skus:
            print(f"⚠️ SKU {sku} already exists in Fixcom (not suppressed), skipping.")
            continue
            
        price_kzt = p.get('price_kzt', 0)
        price = int(price_kzt / RETAIL_DIVISOR)
        
        if price < 500:
            continue
            
        stock = 'yes' if specs.get('stock', 0) > 0 or specs.get('legacy') else 'no' # Assume stock for legacy import
        if specs.get('imported_from_fixcom'):
            # Use price from DB which we imported
             price = int(p['price_kzt'])
             # Ensure we map it correctly if needed, but imported price is usually KZT
        
        # Create Offer element WITH NAMESPACE
        offer = ET.SubElement(offers_node, f'{NS}offer', sku=sku)
        
        model_name = p['name']
        if len(model_name) > 1000: # Schema max 1024
            model_name = model_name[:997] + "..."
            
        ET.SubElement(offer, f'{NS}model').text = model_name
        ET.SubElement(offer, f'{NS}brand').text = p.get('brand') or 'Generic'
        
        availabilities = ET.SubElement(offer, f'{NS}availabilities')
        availabilities = ET.SubElement(offer, f'{NS}availabilities')
        if stock == 'yes':
             # For local products, we always use the "Pre-order 30 days" strategy
             ET.SubElement(availabilities, f'{NS}availability', available='yes', storeId='PP1', preorder='true')
             # Note: Different Kaspi versions use different tags for preorder days. 
             # Commonly it is availability=preorder or a specific attribute.
             # Based on common XML standards for Kaspi, we use available='yes' and a separate attribute if possible,
             # but most commonly it's handled via the 'preorder' attribute or just 'availability' value.
             # Let's use the most reliable one: available='yes' with 'preorder' indication.
        else:
             ET.SubElement(availabilities, f'{NS}availability', available='no', storeId='PP1')

        
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
    output_paths = ['price.xml', 'public/price.xml']
    
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
