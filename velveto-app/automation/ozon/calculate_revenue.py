import os
import requests
import json
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv('ozon-automation/.env.ozon')

OZON_CLIENT_ID = os.getenv('OZON_CLIENT_ID')
OZON_API_KEY = os.getenv('OZON_API_KEY')

if not OZON_CLIENT_ID or not OZON_API_KEY:
    print("Error: OZON_CLIENT_ID or OZON_API_KEY not found in .env.ozon")
    exit(1)

HEADERS = {
    'Client-Id': OZON_CLIENT_ID,
    'Api-Key': OZON_API_KEY,
    'Content-Type': 'application/json'
}

def get_orders(since_date, to_date, scheme='fbo'):
    """
    Fetch orders from Ozon API.
    scheme: 'fbo' or 'fbs'
    """
    if scheme == 'fbs':
        url = f"https://api-seller.ozon.ru/v3/posting/{scheme}/list"
    else:
        url = f"https://api-seller.ozon.ru/v2/posting/{scheme}/list"
    
    orders = []
    offset = 0
    limit = 1000
    
    print(f"Fetching {scheme.upper()} orders from {since_date} to {to_date}...")
    
    while True:
        payload = {
            "dir": "ASC",
            "filter": {
                "since": since_date.strftime("%Y-%m-%dT%H:%M:%S.000Z"),
                "to": to_date.strftime("%Y-%m-%dT%H:%M:%S.000Z"),
                "status": "delivered" 
            },
            "limit": limit,
            "offset": offset,
            "with": {
                "analytics_data": True,
                "financial_data": True
            }
        }
        
        try:
            response = requests.post(url, headers=HEADERS, json=payload, timeout=30)
            response.raise_for_status()
            data = response.json()
            
            result = data.get('result', [])
            
            # Handle v3 response where result is a dict containing 'postings'
            if isinstance(result, dict) and 'postings' in result:
                result = result['postings']
            
            if not result:
                break
                
            orders.extend(result)
            
            if len(result) < limit:
                break
                
            offset += limit
            
        except requests.exceptions.RequestException as e:
            print(f"Error fetching {scheme.upper()} orders: {e}")
            if response.text:
                print(f"Response: {response.text}")
            break
            
    print(f"Found {len(orders)} {scheme.upper()} orders.")
    return orders

def calculate_revenue():
    # Default to last 30 days
    to_date = datetime.now()
    since_date = to_date - timedelta(days=30)
    
    print(f"Calculating revenue from {since_date.date()} to {to_date.date()}")
    print("-" * 50)
    
    fbo_orders = get_orders(since_date, to_date, 'fbo')
    fbs_orders = get_orders(since_date, to_date, 'fbs')
    
    all_orders = fbo_orders + fbs_orders
    
    total_gross_revenue = 0.0
    total_deductions = 0.0
    total_net_revenue = 0.0
    orders_count = 0
    
    # Group by day for better visibility
    daily_stats = {}
    
    for order in all_orders:
        # Date for grouping
        created_at = order.get('created_at')
        if created_at:
            date_str = created_at.split('T')[0]
        else:
            date_str = "Unknown"
            
        if date_str not in daily_stats:
            daily_stats[date_str] = {
                'gross': 0.0,
                'deductions': 0.0,
                'net': 0.0,
                'count': 0
            }

        order_gross = 0.0
        order_commission = 0.0
        order_services = 0.0
        
        financial_data = order.get('financial_data', {})
        products_financial = financial_data.get('products', [])
        
        # Calculate Gross Revenue (Price) and Commission
        if products_financial:
             for p in products_financial:
                 price = float(p.get('price', 0))
                 commission = float(p.get('commission_amount', 0))
                 
                 order_gross += price
                 order_commission += commission
        else:
            # Fallback if financial data is missing (shouldn't happen with delivered orders)
            products = order.get('products', [])
            for p in products:
                price = float(p.get('price', 0))
                order_gross += price

        # Calculate Services (Logistics, etc.)
        # Services are usually at the order level in financial_data -> posting_services
        posting_services = financial_data.get('posting_services', {})
        if posting_services:
            # Marketplace services (logistics, last mile, etc.)
            marketplace_service_item = posting_services.get('marketplace_service_item_fulfillment', 0) + \
                                       posting_services.get('marketplace_service_item_pickup', 0) + \
                                       posting_services.get('marketplace_service_item_dropoff_pvz', 0) + \
                                       posting_services.get('marketplace_service_item_dropoff_sc', 0) + \
                                       posting_services.get('marketplace_service_item_dropoff_ff', 0) + \
                                       posting_services.get('marketplace_service_item_direct_flow_trans', 0) + \
                                       posting_services.get('marketplace_service_item_return_flow_trans', 0) + \
                                       posting_services.get('marketplace_service_item_deliv_to_customer', 0) + \
                                       posting_services.get('marketplace_service_item_return_not_deliv_to_customer', 0) + \
                                       posting_services.get('marketplace_service_item_return_part_goods_customer', 0) + \
                                       posting_services.get('marketplace_service_item_return_after_deliv_to_customer', 0)

            order_services += abs(float(marketplace_service_item))

        order_deductions = order_commission + order_services
        order_net = order_gross - order_deductions
        
        total_gross_revenue += order_gross
        total_deductions += order_deductions
        total_net_revenue += order_net
        orders_count += 1
        
        daily_stats[date_str]['gross'] += order_gross
        daily_stats[date_str]['deductions'] += order_deductions
        daily_stats[date_str]['net'] += order_net
        daily_stats[date_str]['count'] += 1

    print("-" * 80)
    print(f"{'Date':<12} | {'Orders':<6} | {'Gross Rev':>12} | {'Deductions':>12} | {'Net Rev':>12}")
    print("-" * 80)
    
    for date in sorted(daily_stats.keys()):
        stats = daily_stats[date]
        print(f"{date:<12} | {stats['count']:<6} | {stats['gross']:>12,.2f} | {stats['deductions']:>12,.2f} | {stats['net']:>12,.2f}")
        
    print("-" * 80)
    print(f"Total Orders (Delivered): {orders_count}")
    print(f"Total Gross Revenue:      {total_gross_revenue:,.2f} RUB")
    print(f"Total Deductions:         {total_deductions:,.2f} RUB")
    print(f"Total Net Revenue:        {total_net_revenue:,.2f} RUB")

if __name__ == "__main__":
    calculate_revenue()
