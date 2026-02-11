import os
import sys
from supabase import create_client, Client
from dotenv import load_dotenv

# Ensure we can import telegram_bot from the same directory
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
try:
    from telegram_bot import send_alert
except ImportError:
    def send_alert(msg):
        print(f"DEBUG: {msg}")

# Load environment variables
load_dotenv('moysklad-web/.env.local')

URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not URL or not KEY:
    print("❌ Error: Missing Supabase keys.")
    sys.exit(1)

supabase: Client = create_client(URL, KEY)

def check_low_stock(threshold=5):
    """Fetches products with stock below threshold and sends an alert."""
    print(f"🔍 Checking for products with stock < {threshold}...")
    
    try:
        res = supabase.schema('Parser').table('products').select("name, article, stock").lt('stock', threshold).gt('stock', 0).execute()
        
        products = res.data
        if not products:
            print("✅ No low stock products found.")
            return

        message = f"📉 <b>Low Stock Alert</b> (Threshold: {threshold})\n\n"
        for p in products:
            message += f"• {p['name']} ({p['article']}): <b>{p['stock']}</b> шт.\n"
        
        if len(products) > 10:
            message = f"📉 <b>Low Stock Alert</b>: Found {len(products)} items with low stock. Please check the dashboard."
            
        send_alert(message)
        print(f"✅ Alert sent for {len(products)} products.")
        
    except Exception as e:
        print(f"❌ Error checking low stock: {e}")

if __name__ == "__main__":
    threshold = int(sys.argv[1]) if len(sys.argv) > 1 else 5
    check_low_stock(threshold)
