import os
import json
import sys
import argparse
from supabase import create_client, Client
from dotenv import load_dotenv

# Add current directory to path to import modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from modules.creator import prepare_card_payload, create_card
import config

def init_supabase() -> Client:
    """Initializes Supabase client."""
    # Try different .env locations
    env_paths = [
        os.path.join(os.getcwd(), "moysklad-web", ".env.local"),
        os.path.join(os.getcwd(), ".env.local"),
        os.path.join(os.getcwd(), ".env"),
        # Go up from script location: automation/kaspi -> automation -> moysklad-web -> .env.local
        os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), ".env.local"),
        # automation/kaspi -> moysklad-web root
        os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))), "moysklad-web", ".env.local"),
    ]
    
    for path in env_paths:
        if os.path.exists(path):
            load_dotenv(path)
            break
            
    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    
    if not url or not key:
        # Try fallback to SUPABASE_URL/KEY
        url = os.environ.get("SUPABASE_URL")
        key = os.environ.get("SUPABASE_KEY")
        
    if not url or not key:
        raise ValueError("Supabase URL or Key not found in environment variables.")
        
    return create_client(url, key)

def map_ms_to_kaspi(product):
    """Maps MoySklad product data to Kaspi format using Category Mapper."""
    from modules.category_mapper import KaspiCategoryMapper
    
    product_name = product.get("name", "")
    
    # Try to get description from specs or direct field
    specs = product.get("specs", {})
    if isinstance(specs, str):
        try:
            specs = json.loads(specs)
        except:
            specs = {}
            
    product_description = product.get("description", "")
    if not product_description and specs:
        product_description = specs.get("description", "")
    
    if not product_description:
        product_description = ""
    
    # Detect category
    category_code, category_type = KaspiCategoryMapper.detect_category(
        product_name, 
        product_description
    )
    
    if category_type == "restricted":
        print(f"⚠️  Category for '{product_name}' is RESTRICTED on Kaspi. Skipping.", file=sys.stderr)
        return "RESTRICTED"
        
    if not category_code:
        print(f"❌ Unknown category for product: {product_name}", file=sys.stderr)
        return None

    print(f"📋 Detected category: {category_code} ({category_type})", file=sys.stderr)
    
    # Generate attributes based on category
    kaspi_attributes = KaspiCategoryMapper.generate_attributes(
        product_name,
        product_description,
        category_type,
        category_code
    )
    
    # Validate attributes
    is_valid, missing = KaspiCategoryMapper.validate_attributes(
        kaspi_attributes,
        category_type
    )
    
    if not is_valid:
        print(f"⚠️  Missing required attributes: {', '.join(missing)}", file=sys.stderr)
    
    description = product_description or product_name
    if len(description) < 100:
        description = f"{description}. Качественный товар от проверенного бренда. Идеально подходит для ежедневного использования."
    
    # Get all images
    images = []
    if product.get("image_url"):
        images.append(product.get("image_url"))
    
    if specs and "image_urls" in specs:
        for img in specs["image_urls"]:
            if img not in images:
                images.append(img)
                
    # Get brand
    brand = product.get("brand", "Generic")
    if not brand or brand == "Generic":
        if specs and "brand" in specs:
            brand = specs["brand"]
    
    scraped_data = {
        "title": product_name,
        "description": description,
        "images": images,
        "attributes": kaspi_attributes,
        "category_name": category_code,
        "brand": brand or "Generic"
    }
    
    return scraped_data

def create_from_ms(article):
    """Fetches product from Supabase 'products' table and creates Kaspi card."""
    print(f"🚀 Starting Kaspi card creation for MS Article: {article}")
    
    try:
        supabase = init_supabase()
        
        # Fetch product from 'products' table
        response = supabase.schema('Parser').table('products').select("*").eq("article", article).execute()
        
        product = None
        if response.data:
            product = response.data[0]
            print(f"📦 Found product in 'products' table: {product.get('name')}")
        else:
            print(f"❌ Product with article {article} not found in Supabase 'products' table.")
            # Fallback for sync delays - check wb_search_results (raw parse)
            print("   Checking wb_search_results as fallback...")
            response2 = supabase.schema('Parser').table('wb_search_results').select("*").eq("id", int(article)).execute()
            if response2.data:
                product = response2.data[0]
                print(f"   Found in wb_search_results: {product.get('name')}")
            else:
                print(f"❌ Product with article {article} not found in Supabase 'wb_search_results' table either.")
                return False
        
        kaspi_data = map_ms_to_kaspi(product)
        if kaspi_data == "RESTRICTED":
            return False
            
        if not kaspi_data:
            print(f"❌ Failed to map product data (likely unknown category).")
            return False
        
        # Prepare payload
        # Priority 1: Use 'code' from MoySklad (standard integration style)
        # Priority 2: Use article-K (previous custom style)
        sku = product.get('code')
        if not sku:
            sku = f"{article}-K"
            
        payload = prepare_card_payload(kaspi_data, sku, custom_barcode_prefix="201")
        if kaspi_data.get("images"):
             payload["images"] = [{"url": img} for img in kaspi_data["images"]]

        
        print(f"📝 Prepared payload for SKU: {sku}")
        
        # Create card
        success, upload_id = create_card(payload)
        
        if success:
            print(f"✅ Successfully created Kaspi card for {sku}")
            # Update status in Supabase so it shows in dashboard
            try:
                # 1. Fetch current specs
                current_data = supabase.schema('Parser').table('wb_search_results').select("specs").eq("id", int(article)).execute()
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
                    "kaspi_created": True,
                    "specs": specs
                }
                
                supabase.schema('Parser').table('wb_search_results').update(update_data).eq("id", int(article)).execute()
                print(f"🔄 Updated kaspi_created and specs in wb_search_results: ID={upload_id}")
            except Exception as e:
                print(f"⚠️  Failed to update status in Supabase: {e}")
        else:
            print(f"❌ Failed to create Kaspi card for {sku}")
            
        return success

    except Exception as e:
        print(f"❌ Error in create_from_ms: {e}")
        return False

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Create Kaspi card from MS product')
    parser.add_argument('--article', required=True, help='Product article (from MS/Supabase)')
    args = parser.parse_args()
    
    create_from_ms(args.article)
