import os
import sys
import json
from datetime import datetime, timedelta
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

def get_orders():
    client = KaspiMerchantApiClient(TOKEN)
    
    # Last 7 days
    end_date = int(datetime.now().timestamp() * 1000)
    start_date = int((datetime.now() - timedelta(days=7)).timestamp() * 1000)
    
    try:
        raw_orders = client.get_orders(start_date, end_date)
        orders_data = raw_orders.get('data', [])
        
        results = []
        for order in orders_data:
            attr = order.get('attributes', {})
            order_id = order.get('id')
            
            # Fetch entries (items) for this order
            try:
                entries_raw = client.get_order_entries(order_id)
                entries = []
                for entry in entries_raw.get('data', []):
                    entry_attr = entry.get('attributes', {})
                    entries.append({
                        "sku": entry_attr.get('sku'),
                        "name": entry_attr.get('name') or "Unknown Product",
                        "quantity": entry_attr.get('quantity'),
                        "price": entry_attr.get('basePrice')
                    })
            except Exception as e:
                print(f"Error fetching entries for order {order_id}: {e}", file=sys.stderr)
                entries = []

            results.append({
                "id": order_id,
                "code": attr.get('code'),
                "status": attr.get('status'),
                "total_price": attr.get('totalPrice'),
                "creation_date": attr.get('creationDate'),
                "customer_name": attr.get('customer', {}).get('name'),
                "customer_phone": attr.get('customer', {}).get('cellPhone'),
                "warehouse": attr.get('originAddress', {}).get('displayName'),
                "is_delivery": attr.get('isKaspiDelivery'),
                "entries": entries
            })
            
        return results
    except Exception as e:
        print(f"Error fetching orders: {e}", file=sys.stderr)
        return []

if __name__ == "__main__":
    orders = get_orders()
    print(json.dumps(orders, indent=2, ensure_ascii=False))
