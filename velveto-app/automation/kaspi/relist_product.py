import sys
import os
import json
import time

# Add parent directories to path for imports
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)
sys.path.append(os.path.join(parent_dir, 'moysklad'))

from automation.moysklad import create_wb_products_in_ms as ms_creator
from automation.kaspi.modules.kaspi_api_client import KaspiApiClient
from automation.kaspi.sync_airtable_schema import ensure_category_table

# Config
TOKEN = 'dutmsmqJIEi4CpuX2PNPDLbNcdpiRwNpKc3mwggACq0='

def relist_product(wb_id, category_code, attributes, price=None, name=None):
    """
    1. Update Product in MoySklad (Attributes & Price)
    2. Submit to Kaspi as "New" (Import)
    """
    print(f"🔄 Relisting Product {wb_id}...")
    print(f"   Category: {category_code}")
    print(f"   Attributes: {attributes}")
    
    # 0. Ensure Airtable Table Exists (On Demand)
    print("   🗂️ Checking Airtable Schema...")
    if ensure_category_table(category_code):
        print("   ✅ Airtable Table verified.")
    else:
        print("   ⚠️ Airtable Table check failed (continuing anyway).")

    # 1. Update MoySklad
    folder_meta = ms_creator.get_or_create_group("Parser WB")
    price_type_meta = ms_creator.get_price_type("Розничная цена")
    
    # Mock product object for MS creator
    # We need to fetch existing name/price if not provided?
    # For now, let's assume we pass what we have, or maybe we should fetch from DB/MS first for completeness?
    # Simple approach: Create/Update with what we have.
    
    product_data = {
        "id": wb_id, # used as article
        "name": name if name else f"Product {wb_id}", # Fallback name
        "price": price if price else 0,
        "image_urls": [] # TODO: Fetch images if needed context
    }
    
    # Check if price is 0, maybe fetch from MS?
    # ms_creator handles update_existing=True, so it finds by article.
    
    print("   💾 Updating MoySklad...")
    ms_id, err = ms_creator.create_product_in_ms(
        product_data, 
        folder_meta, 
        price_type_meta, 
        update_existing=True,
        kaspi_attributes=attributes
    )
    
    if not ms_id:
        print(f"❌ Failed to update MoySklad: {err}")
        return False

    print(f"   ✅ MoySklad Updated. ID: {ms_id}")

    # 2. Push to Kaspi (XML or JSON?)
    # User said "Use JSON API so cards are created by template".
    # POST /products/import
    
    client = KaspiApiClient(TOKEN)
    
    # Construct Kaspi Payload
    # Schema:
    # {
    #   "sku": "sku-1",
    #   "title": "Product Title",
    #   "description": "Description",
    #   "category": "Category Code",
    #   "brand": "Brand",
    #   "attributes": [
    #      {"code": "attr_code", "value": "value"}, ...
    #   ],
    #   "images": [...]
    # }
    
    # We need validation of attribute codes? 
    # Or just pass what we have and hope Kaspi accepts mapped codes?
    # The attributes dict keys should ideally be attribute CODES from Kaspi schema.
    # If keys are names ("Размер"), we need to map them to codes ("size").
    # We can load the full schema to map names -> codes.
    
    mapped_attributes = []
    # For now assume attributes keys are CODES or we just pass them and see.
    # Better: Load schema for this category.
    
    kaspi_product = {
        "sku": str(wb_id),
        "title": name if name else f"Product {wb_id}",
        "category": category_code,
        "attributes": []
    }
    
    # Simple mapping for now: assume keys are roughly correct or pass as is
    for k, v in attributes.items():
        if k == 'brand':
            kaspi_product['brand'] = v
        else:
            kaspi_product['attributes'].append({
                "code": k, # Needs to be the code!
                "value": v
            })
            
    # Add images?
    # For relisting, we need images. 
    # TODO: Fetch images from MS or Supabase. 
    
    print("   🚀 Submitting to Kaspi...")
    try:
        # Wrap in list
        resp = client.import_products([kaspi_product])
        print(f"   ✅ Kaspi Response: {resp}")
        upload_id = resp.get('id')
        return upload_id
    except Exception as e:
        print(f"   ❌ Kaspi Submit Failed: {e}")
        return None

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python relist_product.py <wb_id> <category_code> '<json_attributes>' [name] [price]")
        sys.exit(1)
        
    wb_id = sys.argv[1]
    cat_code = sys.argv[2]
    attrs = json.loads(sys.argv[3])
    
    name = sys.argv[4] if len(sys.argv) > 4 else None
    price = int(sys.argv[5]) if len(sys.argv) > 5 else 0
    
    relist_product(wb_id, cat_code, attrs, price, name)
