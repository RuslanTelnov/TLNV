import os
import requests
import base64
import json
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Setup paths and load env
env_paths = ['.env.local', '.env', '../.env']
for path in env_paths:
    if os.path.exists(path):
        load_dotenv(path)
        break

LOGIN = os.getenv("MOYSKLAD_LOGIN")
PASSWORD = os.getenv("MOYSKLAD_PASSWORD")
BASE_URL = "https://api.moysklad.ru/api/remap/1.2"
WB_STORE_ID = "6c721ced-f052-11f0-0a80-03a50013dad7"

if not LOGIN or not PASSWORD:
    print(json.dumps({"error": "Missing MoySklad credentials"}))
    exit(1)

auth_str = f"{LOGIN}:{PASSWORD}"
auth_b64 = base64.b64encode(auth_str.encode()).decode()
HEADERS = {
    "Authorization": f"Basic {auth_b64}",
    "Content-Type": "application/json"
}

def get_kaspi_orders():
    # Fetch orders from the last 30 days
    # date_from = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d %H:%M:%S")
    # Using a simple limit for now to get most recent ones
    
    url = f"{BASE_URL}/entity/customerorder?limit=100&order=created,desc&expand=positions,positions.assortment,state"
    
    try:
        response = requests.get(url, headers=HEADERS)
        if response.status_code != 200:
            return {"error": f"MS API Error: {response.status_code}", "details": response.text}
        
        data = response.json()
        orders = data.get('rows', [])
        
        formatted_orders = []
        for order in orders:
            code = order.get('code', '')
            ext_code = order.get('externalCode', '')
            description = order.get('description', '')
            
            # Check if it's a Kaspi order
            is_kaspi = "kaspi" in code.lower() or "kaspi" in ext_code.lower() or "kaspi" in description.lower()
            if not is_kaspi:
                continue
            
            # Identify warehouse
            store_href = order.get('store', {}).get('meta', {}).get('href', '')
            warehouse = "PP1" if WB_STORE_ID in store_href else "OTHER"
            
            # Extract customer name from description if possible
            # Example: "Заказ Kaspi №810610607, Покупатель: Е Аружан, Телефон: ..."
            customer_name = "Kaspi Customer"
            if "Покупатель:" in description:
                try:
                    parts = description.split("Покупатель:")
                    customer_name = parts[1].split(",")[0].strip()
                except:
                    pass
            
            # Format entries
            entries = []
            for pos in order.get('positions', {}).get('rows', []):
                assortment = pos.get('assortment', {})
                entries.append({
                    "name": assortment.get('name', 'Unknown Product'),
                    "quantity": int(pos.get('quantity', 0)),
                    "sku": assortment.get('article', assortment.get('code', 'N/A'))
                })
            
            formatted_orders.append({
                "id": order.get('id'),
                "code": order.get('name'), # Use user-friendly name (Kaspi ID)
                "creation_date": order.get('created'),
                "status": order.get('state', {}).get('name', 'UNKNOWN'),
                "total_price": float(order.get('sum', 0)) / 100.0,
                "customer_name": customer_name,
                "warehouse": warehouse,
                "entries": entries
            })
            
        return formatted_orders

    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    result = get_kaspi_orders()
    print(json.dumps(result, ensure_ascii=False))
