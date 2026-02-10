import os
import sys
import json
from dotenv import load_dotenv

# Add modules to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from modules.kaspi_merchant_client import KaspiMerchantApiClient
import config

# Load env
env_paths = [
    'moysklad-web/.env.local',
    '.env',
    '../.env'
]
for path in env_paths:
    if os.path.exists(path):
        load_dotenv(path)
        break

TOKEN = os.getenv("KASPI_API_TOKEN", config.KASPI_API_TOKEN)
ORDER_ID = "807594298" # From screenshot

def probe():
    client = KaspiMerchantApiClient(TOKEN)
    try:
        # Fetch last 1 day of orders
        end_date = int(datetime.now().timestamp() * 1000)
        start_date = int((datetime.now() - timedelta(days=1)).timestamp() * 1000)
        
        orders = client.get_orders(start_date, end_date)
        if not orders.get('data'):
            print("No orders found in the last day.")
            return
            
        first_order = orders['data'][0]
        order_id = first_order['id']
        order_code = first_order['attributes'].get('code')
        print(f"Probing entries for order ID: {order_id} (Code: {order_code})")
        
        entries = client.get_order_entries(order_id)
        print(json.dumps(entries, indent=2, ensure_ascii=False))
        
        # Also print the order attributes for context
        print("\nOrder Attributes:")
        print(json.dumps(first_order['attributes'], indent=2, ensure_ascii=False))
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    from datetime import datetime, timedelta
    probe()
