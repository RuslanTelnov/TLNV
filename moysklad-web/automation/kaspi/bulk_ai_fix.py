
import os
import sys
import json
import time
from anthropic import Anthropic
from supabase import create_client, Client
from dotenv import load_dotenv

# Load env variables
load_dotenv("moysklad-web/.env.local")

# Supabase Initialization
url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
if not url or not key:
    print("❌ Error: Missing Supabase credentials.")
    sys.exit(1)

supabase: Client = create_client(url, key)

# Anthropic Initialization
anthropic_key = os.environ.get("ANTHROPIC_API_KEY")
if not anthropic_key:
    # Try fetching from DB
    res = supabase.schema('Parser').table('client_configs').select('anthropic_api_key').limit(1).execute()
    if res.data and res.data[0].get('anthropic_api_key'):
         anthropic_key = res.data[0]['anthropic_api_key']

if not anthropic_key or anthropic_key == "Not Set":
     print("❌ Error: Missing ANTHROPIC_API_KEY")
     sys.exit(1)

anthropic = Anthropic(api_key=anthropic_key)

def get_rejected_products():
    print("🔍 Fetching rejected products...")
    res = supabase.schema('Parser').table('wb_search_results').select("*").eq("kaspi_status", "rejected").execute()
    return res.data

def get_ai_suggestion(product):
    print(f"🤖 Analyzing product {product['id']} ({product.get('name')})...")
    
    rejection_reason = product.get('kaspi_details', 'Unknown reason')
    specs = product.get('specs', {})
    
    # Construct User Prompt
    product_desc = f"""
    Product ID: {product['id']}
    Name: {product.get('name')}
    Description: {product.get('description', '')}
    Current Category ID: {specs.get('kaspi_category_id', 'Unknown')}
    
    Rejection Reason: {rejection_reason}
    """
    
    system_prompt = """
    You are an expert Kaspi Marketplace moderator assistant.
    Your goal is to help a merchant fix a rejected product.
    
    Analyze the Rejection Reason and the Product Data.
    Provide a JSON response with:
    1. "analysis": A short, clear explanation of why it was rejected (in Russian).
    2. "actions": A list of suggested fixes. Each action must have:
       - "label": Button text (e.g., "Переименовать в X", "Сменить категорию") (in Russian).
       - "type": "update_field".
       - "payload": { "field": "name" | "description" | "kaspi_category_id", "value": "New Value" }.
    
    Common Rejections & Fixes:
    - "Некорректная категория": Suggest a better category ID based on the product name/description.
    - "Некорректное описание": Suggest removing prohibited words (Instagram, phone numbers, "best quality", etc.).
    - "Некорректное название": Suggest a cleaner name (Brand + Model + Type).
    - "Missing images": Provide a generic advice (no action payload possible usually, but suggest checking source).
    
    If you cannot determine a specific fix, suggest cleaning up the description.
    Return raw JSON only.
    """
    
    models = [
        "claude-3-5-sonnet-20241022",
        "claude-3-5-sonnet-latest",
        "claude-3-sonnet-20240229",
        "claude-3-opus-20240229",
        "claude-3-haiku-20240307"
    ]
    
    for model in models:
        try:
            print(f"   Trying model: {model}...")
            message = anthropic.messages.create(
                model=model,
                max_tokens=1024,
                system=system_prompt,
                messages=[
                    {"role": "user", "content": product_desc}
                ]
            )
            
            text = message.content[0].text
            # Clean markdown
            text = text.replace("```json", "").replace("```", "").strip()
            data = json.loads(text)
            return data
        except Exception as e:
            if "not_found_error" in str(e):
                continue
            print(f"❌ AI Error ({model}): {e}")
            
    print("❌ All models failed.")
    return None

def apply_fix(product, suggestion):
    if not suggestion or not suggestion.get("actions"):
        print("⚠️ No actions suggested.")
        return False
        
    action = suggestion["actions"][0] # Apply the first action
    payload = action.get("payload")
    label = action.get("label")
    
    if not payload:
        print(f"⚠️ Action '{label}' has no payload.")
        return False
        
    field = payload.get("field")
    value = payload.get("value")
    
    print(f"🛠️ Applying fix: {label} ({field} -> {value})")
    
    update_data = {}
    
    # Handle Virtual Fields (specs) vs Real Columns
    if field in ["kaspi_category_id", "description"]:
        specs = product.get('specs') or {}
        specs[field] = value
        update_data['specs'] = specs
    elif field in ["name", "brand"]:
        update_data[field] = value
    else:
        print(f"⚠️ Unknown field: {field}")
        return False
        
    # Reset status to trigger re-creation
    update_data["kaspi_status"] = "pending_fix" # Internal state
    update_data["kaspi_created"] = False
    update_data["conveyor_status"] = "idle" # Trigger conveyor
    update_data["kaspi_details"] = None # Clear error
    
    
    # Store retries in specs since column prevents adding it easily
    specs = update_data.get('specs') or product.get('specs') or {}
    current_retries = specs.get('moderation_retries', 0)
    specs['moderation_retries'] = current_retries + 1
    update_data['specs'] = specs
    
    # update_data["moderation_retries"] = retries + 1 # Removed column update
    
    try:
        supabase.schema('Parser').table('wb_search_results').update(update_data).eq("id", product['id']).execute()
        print("✅ Fix applied successfully!")
        return True
    except Exception as e:
        print(f"❌ DB Update Error: {e}")
        return False

def main():
    products = get_rejected_products()
    
    if not products:
        print("✅ No rejected products found.")
        return

    print(f"📦 Found {len(products)} rejected products.")
    
    for p in products:
        print("\n---------------------------------------------------")
        suggestion = get_ai_suggestion(p)
        if suggestion:
            print(f"💡 Analysis: {suggestion.get('analysis')}")
            apply_fix(p, suggestion)
            time.sleep(1) # Rate limit safety

if __name__ == "__main__":
    main()
