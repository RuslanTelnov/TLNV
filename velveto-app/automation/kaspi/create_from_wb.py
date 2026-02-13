import os
import json
import sys
from supabase import create_client, Client
from dotenv import load_dotenv
import requests

# Add current directory to path to import modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from modules.creator import prepare_card_payload, create_card
from modules.wb_enricher import WBEnricher
from modules.url_helper import extract_wb_article
from modules.image_uploader import ImageUploader
import config

def init_supabase() -> Client:
    """Initializes Supabase client."""
    # Try different .env locations
    current_file_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(os.path.dirname(current_file_dir))
    
    env_paths = [
        os.path.join(os.getcwd(), ".env.local"),
        os.path.join(os.getcwd(), "moysklad-web", ".env.local"),
        os.path.join(project_root, ".env.local"),
        os.path.join(os.getcwd(), ".env"),
    ]
    
    for path in env_paths:
        if os.path.exists(path):
            print(f"✅ Loaded env from: {path}", file=sys.stderr)
            load_dotenv(path)
            break
            
    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    
    if not url or not key:
        raise ValueError("Supabase URL or Key not found in environment variables.")
        
    return create_client(url, key)

def load_full_schema():
    """Load the full Kaspi schema from JSON file."""
    try:
        schema_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../../data/kaspi_full_schema.json')
        if os.path.exists(schema_path):
            with open(schema_path, 'r', encoding='utf-8') as f:
                return json.load(f)
    except Exception as e:
        print(f"⚠️ Error loading full schema: {e}", file=sys.stderr)
    return None

def find_category_in_schema(product_name, schema):
    """Find best matching category in full schema by title."""
    if not schema: return None
    
    product_name_lower = product_name.lower()
    best_match = None
    max_score = 0
    
    # Keyword based scoring
    keywords = [w for w in product_name_lower.split() if len(w) > 2]
    
    for cat in schema:
        score = 0
        cat_title = cat.get('title', '').lower() # Assuming 'title' field based on previous scripts, but observed 'name' in output above. Check both.
        if not cat_title:
             cat_title = cat.get('name', '').lower()
             
        # Simple keyword matching
        for kw in keywords:
            if kw in cat_title:
                score += 1
                
        if score > max_score:
            max_score = score
            best_match = cat
            
    if max_score > 0:
        return best_match
    return None

def map_wb_to_kaspi(wb_product):
    """Maps Wildberries product data to Kaspi format."""
    from modules.category_mapper import KaspiCategoryMapper
    
    product_name = wb_product.get("name", "")
    product_description = wb_product.get("description", "") or ""
    raw_attributes = wb_product.get("attributes", {})
    
    # 1. Try Legacy Mapper first (it has fine-tuned logic for specific categories)
    category_name, category_type = KaspiCategoryMapper.detect_category(
        product_name, 
        product_description
    )
    
    kaspi_attributes = {}
    
    if category_name:
        print(f"📋 Detected category (Legacy): {category_name} ({category_type})", file=sys.stderr)
        kaspi_attributes = KaspiCategoryMapper.generate_attributes(
            product_name,
            product_description,
            category_type,
            category_name,
            raw_attributes=raw_attributes
        )
    else:
        # 2. Fallback to Full Schema Search
        print(f"⚠️ Legacy mapper failed for: {product_name}. Trying Full Schema search...", file=sys.stderr)
        schema = load_full_schema()
        best_cat = find_category_in_schema(product_name, schema)
        
        if best_cat:
            category_name = best_cat.get('code')
            print(f"✅ Found match in Full Schema: {best_cat.get('title') or best_cat.get('name')} ({category_name})", file=sys.stderr)
            
            # Universal Attribute Filling logic
            # Use mandatory attributes from schema
            for attr in best_cat.get('attributes', []):
                if attr.get('mandatory'):
                    code = attr.get('code')
                    # Try to find in WB attributes (fuzzy match)
                    found_val = None
                    attr_title = code.split('*')[-1].lower() # e.g. "Brand" from "Category*Brand"
                    
                    for k, v in raw_attributes.items():
                        if attr_title in k.lower():
                             found_val = v
                             break
                    
                    # If not found, check standard fields
                    if not found_val:
                        if 'brand' in attr_title and wb_product.get('brand'):
                             found_val = wb_product.get('brand')
                        elif 'color' in attr_title:
                             # Try to extract color from text
                             pass 
                    
                    if found_val:
                         kaspi_attributes[code] = found_val
                    else:
                        # Required but missing? Maybe set a default to pass validation?
                        # Kaspi validation is strict. 
                        # For now, skip if unknown, might fail creation but better than nothing.
                        pass
        else:
             print(f"❌ Unknown category for product: {product_name}", file=sys.stderr)
             return None

    print(f"🏷️  Generated {len(kaspi_attributes)} attributes", file=sys.stderr)
    
    # Description fallback
    description = product_description or product_name
    if len(description) < 100:
        description = f"{description}. Качественный товар от проверенного бренда. Идеально подходит для ежедневного использования."
    
    # FORCE GENERIC BRAND (User Request: "везде указывай без бренда")
    brand = "Generic"
            
    scraped_data = {
        "title": product_name,
        "description": description,
        "images": [wb_product.get("image_url")] if wb_product.get("image_url") else [],
        "attributes": kaspi_attributes,
        "category_name": category_name,
        "brand": brand
    }
    
    return scraped_data

def create_from_wb(article_input):
    """Fetches WB product from Supabase and creates Kaspi card."""
    print(f"🚀 Starting Kaspi card creation for: {article_input}")
    
    try:
        # Extract ID from input (could be a URL)
        article_id = extract_wb_article(str(article_input))
        if not article_id:
            print(f"❌ Could not extract valid WB Article ID from: {article_input}")
            return False
            
        print(f"🆔 Extracted WB Article ID: {article_id}")
        
        supabase = init_supabase()
        
        # Fetch product from 'products' table (which has enriched data) or fallback to 'wb_top_products'
        print(f"🔍 Searching for product {article_id} in database...")
        
        wb_product = None
        
        # 1. Try 'wb_search_results' (Primary Source)
        # Note: wb_search_results uses 'id' as integer (NM ID)
        try:
            resp2 = supabase.schema('Parser').table('wb_search_results').select("*").eq("id", int(article_id)).execute()
            if resp2.data:
                wb_product = resp2.data[0]
                print(f"📦 Found in 'wb_search_results': {wb_product.get('name')}")
        except Exception as e:
            print(f"⚠️  Database error: {e}")
                
        if not wb_product:
            print(f"ℹ️  Product {article_id} not found in database. Will attempt to create from WB data.")
            # Create a minimal object for the enricher
            wb_product = {
                "id": int(article_id),
                "name": f"Product {article_id}", # Placeholder
                "image_url": f"https://basket-01.wb.ru/vol{int(article_id)//100000}/part{int(article_id)//1000}/{article_id}/images/big/1.webp" # Generic WB image URL logic
            }
        
        # Enrich data from WB public API
        print(f"✨ Enriching data for WB Article: {article_id}...")
        wb_product = WBEnricher.enrich_product_data(wb_product)
        
        # Update name and description if enriched
        if wb_product.get("wb_full_data"):
            full_data = wb_product["wb_full_data"]
            if full_data.get("imt_name"):
                wb_product["name"] = full_data["imt_name"]
            if full_data.get("description"):
                wb_product["description"] = full_data["description"]
                
        # Upsert into wb_search_results (ensures it exists for future use)
        try:
            # Prepare update data
            update_data = {
                "name": wb_product.get("name"),
                "price_kzt": wb_product.get("price_kzt", 0),
                "image_url": wb_product.get("image_url"),
                "brand": wb_product.get("brand"),
                "updated_at": "now()"
            }
            
            # Merge specs if they exist to avoid wiping MS/Kaspi IDs
            current_specs = wb_product.get("specs") or {}
            if wb_product.get("wb_full_data"):
                current_specs["enriched"] = True
                update_data["specs"] = current_specs

            # Try to update first
            supabase.schema('Parser').table('wb_search_results').update(update_data).eq("id", int(article_id)).execute()
            print(f"💾 Updated product {article_id} in wb_search_results.")
        except Exception as e:
            print(f"⚠️  Failed to update/upsert product info: {e}")
        
        # Map data
        kaspi_data = map_wb_to_kaspi(wb_product)
        if not kaspi_data:
            print(f"❌ Failed to map product data (likely unknown category).")
            return False
        
        # Prepare payload
        # Priority 1: Use 'code' from MoySklad (Strictly required)
        sku = None
        
        # Check 'products' table for the code (synced from MS)
        try:
             res_ms = supabase.schema('Parser').table('products').select("code", "id").eq("article", str(article_id)).execute()
             if res_ms.data and res_ms.data[0].get("code"):
                  sku = res_ms.data[0]["code"]
                  print(f"🔗 Found MoySklad Code in DB: {sku}")
                  # Also update local ms_id if missing
                  if not wb_product.get("moysklad_id") and res_ms.data[0].get("id"):
                      wb_product["moysklad_id"] = res_ms.data[0]["id"]
        except:
             pass
             
        # If not in DB, try fetching from MS API
        if not sku:
            print(f"⚠️  Code not found in DB for {article_id}. Searching in MoySklad API...")
            try:
                # Load MS Credentials
                load_dotenv('moysklad-web/.env.local')
                login = os.getenv('MOYSKLAD_LOGIN')
                password = os.getenv('MOYSKLAD_PASSWORD')
                
                if login and password:
                    ms_url = f"https://api.moysklad.ru/api/remap/1.2/entity/product?filter=article={article_id}"
                    resp = requests.get(ms_url, auth=(login, password))
                    if resp.status_code == 200:
                        ms_data = resp.json()
                        rows = ms_data.get('rows', [])
                        if rows:
                            product_row = rows[0]
                            sku = product_row.get('code')
                            wb_product["moysklad_id"] = product_row.get('id')
                            print(f"🔗 Found MoySklad Code via API: {sku}")
            except Exception as e:
                print(f"⚠️  Error fetching from MS API: {e}")

        if not sku:
             print(f"❌ STRICT MODE: MoySklad Code (SKU) not found for Article {article_id}.")
             print("   Please create the product in MoySklad first or ensure synchronization.")
             return False
        
        # Ensure we have images (Kaspi requires at least one, and at least 500x500)
        # 1. Try from Specs (Best Quality from WB)
        images = []
        if wb_product.get("image_url"):
             images.append(wb_product.get("image_url"))
             
        # Check specs for more
        if "specs" in wb_product and isinstance(wb_product["specs"], dict):
             spec_images = wb_product["specs"].get("image_urls", [])
             if spec_images:
                  images = spec_images # Prefer the full list from specs
        
        # 2. Fallback to MoySklad (if specs missing)
        if not images and wb_product.get("moysklad_id"):
            print(f"🖼️  Fetching images from MoySklad for ID: {wb_product['moysklad_id']}...")
            try:
                # Basic Auth for MoySklad
                load_dotenv('moysklad-web/.env.local')
                login = os.getenv('MOYSKLAD_LOGIN')
                password = os.getenv('MOYSKLAD_PASSWORD')
                if login and password:
                    ms_url = f"https://api.moysklad.ru/api/remap/1.2/entity/product/{wb_product['moysklad_id']}/images"
                    resp = requests.get(ms_url, auth=(login, password))
                    if resp.status_code == 200:
                        ms_data = resp.json()
                        rows = ms_data.get('rows', [])
                        if rows:
                            images = [] # Reset to fill from MS
                            for row in rows:
                                # Look for a better URL
                                img_url = row.get('miniature', {}).get('href')
                                if img_url:
                                    img_url = img_url.replace('miniature=true', 'miniature=false')
                                    images.append(img_url)
            except Exception as e:
                print(f"⚠️ Failed to fetch MS image: {e}")

        # Proxy images through Supabase (Kaspi cannot download from WB directly)
        proxied_images = []
        if images:
            print(f"🖼️  Proxying {len(images)} images through Supabase...")
            try:
                uploader = ImageUploader()
                for idx, img_url in enumerate(images[:8]): # Kaspi limit: 8 images
                    pub_url = uploader.upload_image_from_url(img_url, sku, idx+1)
                    if pub_url:
                        proxied_images.append(pub_url)
            except Exception as e:
                print(f"⚠️  Image proxy failed: {e}")
                # Fallback to original (though likely to fail)
                proxied_images = images[:8]

        # Use custom prefix "201" to generate a unique internal barcode
        # and avoid binding to existing cards (Global Catalog)
        payload = prepare_card_payload(kaspi_data, sku, custom_barcode_prefix="201")
        if proxied_images:
            payload["images"] = [{"url": img} for img in proxied_images]
        
        print(f"📝 Prepared payload for SKU: {sku} with {len(images)} images")
        # print(json.dumps(payload, indent=2, ensure_ascii=False))
        
        # Create card
        success, upload_id = create_card(payload)
        
        if success:
            print(f"✅ Successfully created Kaspi card for {sku}")
            # Update status in Supabase so it shows in dashboard
            try:
                # Since we cannot modify schema to add columns, we store metadata in 'specs' jsonb
                
                # 1. Fetch current specs
                current_data = supabase.schema('Parser').table('wb_search_results').select("specs").eq("id", int(article_id)).execute()
                specs = {}
                if current_data.data and current_data.data[0].get("specs"):
                    specs = current_data.data[0]["specs"]
                    
                # 2. Update specs with Kaspi info
                specs["kaspi_created"] = True
                specs["kaspi_upload_id"] = upload_id or "unknown"
                specs["kaspi_sku"] = sku
                
                # Save back with only existing columns
                update_data = {
                    "kaspi_created": True,
                    # "kaspi_status": "moderation", # Column doesn't exist, stored in specs
                    "specs": specs
                }
                
                # Add Kaspi Attributes to specs if available
                if kaspi_data and kaspi_data.get("attributes"):
                     specs["kaspi_attributes"] = kaspi_data["attributes"]
                
                # Store extra info in specs instead of columns
                specs["kaspi_status"] = "moderation"
                specs["kaspi_upload_id"] = upload_id or "unknown"
                update_data["specs"] = specs

                supabase.schema('Parser').table('wb_search_results').update(update_data).eq("id", int(article_id)).execute()
                print(f"🔄 Updated DB status in wb_search_results: ID={upload_id}, Status=moderation")
            except Exception as e:
                print(f"⚠️  Failed to update status in Supabase: {e}")
        else:
            print(f"❌ Failed to create Kaspi card for {sku}")
            
        return success

    except Exception as e:
        print(f"❌ Error in create_from_wb: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python3 create_from_wb.py <wb_article_id>")
        sys.exit(1)
        
    article_id = sys.argv[1]
    create_from_wb(article_id)
