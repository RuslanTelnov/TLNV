import os
import sys
import json
import requests
from dotenv import load_dotenv
from supabase import create_client

# Add parent directory to path to import config
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import config

# Load env from moysklad-automation (where Supabase creds are)
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "moysklad-automation", ".env"))

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
else:
    supabase = None
    print("⚠️ Warning: Supabase credentials not found. Price fetching will fail.")

def get_price_from_ms(sku):
    """Fetch price from Supabase 'products' table."""
    if not supabase:
        return None
    
    try:
        # Assuming 'article' column holds the SKU
        response = supabase.schema('Parser').table('products').select("price").eq("article", sku).execute()
        if response.data:
            # Price is stored in cents/kopecks, convert to main unit
            raw_price = response.data[0].get("price", 0)
            return int(raw_price / 100)
    except Exception as e:
        print(f"Error fetching price for {sku}: {e}")
    
    return None

def publish_offer(sku, price=None, stock=10, preorder=False):
    """
    Publishes offer details (price, stock, availability) to Kaspi.
    If price is None, attempts to fetch from MS (Supabase).
    """
    token = config.KASPI_API_TOKEN
    if not token:
        print("❌ Error: KASPI_API_TOKEN not found.")
        return False

    # 1. Resolve Price
    if price is None:
        print(f"Fetching price for {sku} from MS...")
        price = get_price_from_ms(sku)
        if price is None:
            print("❌ Error: Could not determine price (not provided and not found in MS).")
            return False
        print(f"✅ Found price: {price}")

    headers = {
        "Content-Type": "application/json",
        "X-Auth-Token": token,
        "User-Agent": config.USER_AGENT
    }

    url = f"{config.KASPI_MERCHANT_API_URL}/products/import"

    # Construct payload
    payload = {
        "sku": sku,
        "price": price,
        "stock": stock,
    }
    
    if preorder:
        # Kaspi usually handles preorder via availability="preorder" 
        # and sometimes a specific delivery window.
        # Based on user request "predzakaz 30 days", we'll try standard preorder mapping.
        # If specific API field is needed (e.g. deliveryType), it might be needed here.
        # For now, we'll assume availability="preorder" implies the extended delivery.
        payload["availability"] = "preorder"
        # Some integrations use 'preorderDays'
        payload["preorderDays"] = 30
    else:
        payload["availability"] = "yes"

    print(f"Sending offer update for {sku}...")
    print(f"Payload: {json.dumps(payload, indent=2)}")

    try:
        final_payload = [payload]
        response = requests.post(url, json=final_payload, headers=headers)
        
        if response.status_code in [200, 201, 202, 204]:
            print("✅ Offer update successful!")
            return True
        else:
            print(f"❌ Offer update failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False

    except Exception as e:
        print(f"Error publishing offer: {e}")
        return False

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Publish Kaspi Offer")
    parser.add_argument("sku", help="SKU/Article")
    parser.add_argument("--price", type=int, help="Price in KZT (optional, fetches from MS if missing)")
    parser.add_argument("--stock", type=int, default=10, help="Stock quantity (default: 10)")
    parser.add_argument("--preorder", action="store_true", help="Set preorder mode (30 days)")
    
    args = parser.parse_args()
    
    publish_offer(args.sku, args.price, args.stock, args.preorder)
