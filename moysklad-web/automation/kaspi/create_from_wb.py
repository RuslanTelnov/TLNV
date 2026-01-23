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
import config

def init_supabase() -> Client:
    """Initializes Supabase client."""
    # Try different .env locations
    env_paths = [
        os.path.join(os.getcwd(), "moysklad-web", ".env.local"),
        os.path.join(os.getcwd(), ".env"),
        os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "moysklad-web", ".env.local")
    ]
    
    for path in env_paths:
        if os.path.exists(path):
            load_dotenv(path)
            break
            
    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    
    if not url or not key:
        raise ValueError("Supabase URL or Key not found in environment variables.")
        
    return create_client(url, key)

def map_wb_to_kaspi(wb_product):
    """Maps Wildberries product data to Kaspi format."""
    from modules.category_mapper import KaspiCategoryMapper
    
    product_name = wb_product.get("name", "")
    product_description = wb_product.get("description", "") or ""
    raw_attributes = wb_product.get("attributes", {})
    
    # Detect category
    category_name, category_type = KaspiCategoryMapper.detect_category(
        product_name, 
        product_description
    )
    
    if not category_name:
        print(f"❌ Unknown category for product: {product_name}", file=sys.stderr)
        return None

    print(f"📋 Detected category: {category_name} ({category_type})", file=sys.stderr)
    
    # Generate attributes based on category
    kaspi_attributes = KaspiCategoryMapper.generate_attributes(
        product_name,
        product_description,
        category_type,
        category_name,
        raw_attributes=raw_attributes
    )
    
    print(f"🏷️  Generated {len(kaspi_attributes)} attributes", file=sys.stderr)
    
    # Validate attributes
    is_valid, missing = KaspiCategoryMapper.validate_attributes(
        kaspi_attributes,
        category_type
    )
    
    if not is_valid:
        print(f"⚠️  Missing required attributes: {', '.join(missing)}", file=sys.stderr)
    
    description = product_description or product_name
    if len(description) < 100:
        description = f"{description}. Качественный товар от проверенного бренда. Идеально подходит для ежедневного использования. Прочный материал обеспечивает долгий срок службы и комфорт при эксплуатации."
    
    brand_raw = wb_product.get("brand")
    brand = "Generic"
    
    # Sanitize brand
    if brand_raw and isinstance(brand_raw, str):
        clean = brand_raw.strip()
        if clean and clean.lower() not in ["хит продаж", "promo", "new", "sale"]:
            brand = clean
            
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
            resp2 = supabase.table("wb_search_results").select("*").eq("id", int(article_id)).execute()
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
            upsert_data = {
                "id": int(article_id),
                "name": wb_product.get("name"),
                "price_kzt": wb_product.get("price_kzt", 0),
                "image_url": wb_product.get("image_url"),
                "updated_at": "now()"
            }
            # Only add specs if they are interesting
            if wb_product.get("wb_full_data"):
                 upsert_data["specs"] = {"enriched": True}
                 
            supabase.table("wb_search_results").upsert(upsert_data).execute()
            print(f"💾 Upserted product {article_id} to wb_search_results.")
        except Exception as e:
            print(f"⚠️  Failed to upsert product: {e}")
        
        # Map data
        kaspi_data = map_wb_to_kaspi(wb_product)
        if not kaspi_data:
            print(f"❌ Failed to map product data (likely unknown category).")
            return False
        
        # Prepare payload
        # Use WB article as SKU (Exact Match with MoySklad)
        sku = str(article_id)
        
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

        # Use custom prefix "201" to generate a unique internal barcode
        # and avoid binding to existing cards (Global Catalog)
        payload = prepare_card_payload(kaspi_data, sku, custom_barcode_prefix="201")
        if images:
            payload["images"] = [{"url": img} for img in images]
        
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
                current_data = supabase.table("wb_search_results").select("specs").eq("id", int(article_id)).execute()
                specs = {}
                if current_data.data and current_data.data[0].get("specs"):
                    specs = current_data.data[0]["specs"]
                    
                # 2. Update specs with Kaspi info
                specs["kaspi_created"] = True
                specs["kaspi_upload_status"] = "uploaded"
                specs["kaspi_upload_id"] = upload_id or "unknown"
                specs["kaspi_sku"] = sku
                
                # 3. Save back
                update_data = {
                    "kaspi_created": True, # Keep this boolean as it exists in table (checked earlier) or is useful
                    "specs": specs
                }
                
                # Add Kaspi Attributes to specs if available
                if kaspi_data and kaspi_data.get("attributes"):
                     specs["kaspi_attributes"] = kaspi_data["attributes"]
                     update_data["specs"] = specs
                
                supabase.table("wb_search_results").update(update_data).eq("id", int(article_id)).execute()
                print(f"🔄 Updated DB status in wb_search_results (specs): ID={upload_id}")
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
