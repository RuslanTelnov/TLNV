import os
import requests
import base64
import json
from dotenv import load_dotenv

# Load env
load_dotenv('.env.local')
load_dotenv() # Fallback to .env

LOGIN = os.getenv("MOYSKLAD_LOGIN")
PASSWORD = os.getenv("MOYSKLAD_PASSWORD")
BASE_URL = "https://api.moysklad.ru/api/remap/1.2"

auth_str = f"{LOGIN}:{PASSWORD}"
auth_b64 = base64.b64encode(auth_str.encode()).decode()
HEADERS = {
    "Authorization": f"Basic {auth_b64}",
    "Content-Type": "application/json"
}

def get_recent_orders():
    # Warehouse ID for "Склад ВБ"
    WB_STORE_ID = "6c721ced-f052-11f0-0a80-03a50013dad7"
    
    # Fetch last 100 customer orders with expanded positions
    url = f"{BASE_URL}/entity/customerorder?limit=100&order=created,desc&expand=positions,positions.assortment"
    response = requests.get(url, headers=HEADERS)
    if response.status_code == 200:
        orders = response.json().get('rows', [])
        wb_orders = []
        
        for order in orders:
            store_href = order.get('store', {}).get('meta', {}).get('href', '')
            if WB_STORE_ID in store_href:
                wb_orders.append(order)
        
        print(f"Total orders checked: {len(orders)}")
        print(f"Orders with 'Склад ВБ': {len(wb_orders)}")
        
        if wb_orders:
            print("\n--- Example Order with 'Склад ВБ' ---")
            example = wb_orders[0]
            # Print basic info and positions
            print(f"Order Name: {example.get('name')}")
            print(f"Description: {example.get('description')}")
            print("Positions:")
            for pos in example.get('positions', {}).get('rows', []):
                assortment = pos.get('assortment', {})
                name = assortment.get('name', 'Unknown')
                print(f"  - {name} (Qty: {pos.get('quantity')}, Price: {pos.get('price')})")
        else:
            print("No orders found with 'Склад ВБ' in recent 100.")
            # Let's print one regular order to see the expanded positions structure
            if orders:
                print("\n--- Example Regular Order with Expanded Positions ---")
                example = orders[0]
                print(f"Order Name: {example.get('name')}")
                print("Positions:")
                for pos in example.get('positions', {}).get('rows', []):
                    assortment = pos.get('assortment', {})
                    name = assortment.get('name', 'Unknown')
                    print(f"  - {name} (Qty: {pos.get('quantity')}, Price: {pos.get('price')})")

    else:
        print(f"Error fetching orders: {response.status_code} {response.text}")

if __name__ == "__main__":
    get_recent_orders()
