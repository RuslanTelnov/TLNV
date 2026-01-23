
import requests
import json

TOKEN = "dutmsmqJIEi4CpuX2PNPDLbNcdpiRwNpKc3mwggACq0="

def probe_capabilities():
    headers = {
        "X-Auth-Token": TOKEN,
        "User-Agent": "Mozilla/5.0"
    }

    print("--- Probing API Capabilities ---")

    # 1. Check Merchant API (Points of Service)
    # This usually works for any active merchant
    url_points = "https://kaspi.kz/shop/api/v2/points"
    print(f"1. Testing Merchant API (Points): {url_points}")
    try:
        resp = requests.get(url_points, headers=headers, timeout=10)
        print(f"   Status: {resp.status_code}")
        if resp.status_code == 200:
            print("   SUCCESS! Token is valid for Merchant API.")
            print(f"   Data sample: {resp.text[:100]}")
        else:
            print(f"   Failed: {resp.text[:200]}")
    except Exception as e:
        print(f"   Error: {e}")

    # 2. Check Orders (Recent) - requires rights
    # Must provide creationDate filter (last 30 days)
    import time
    timestamp = int(time.time() * 1000) - (7 * 24 * 3600 * 1000) # 7 days ago
    
    url_orders = f"https://kaspi.kz/shop/api/v2/orders?page[number]=0&page[size]=5&filter[orders][creationDate][$ge]={timestamp}"
    print(f"\n2. Testing Orders API: {url_orders}")
    try:
        resp = requests.get(url_orders, headers=headers, timeout=10)
        print(f"   Status: {resp.status_code}")
        if resp.status_code == 200:
            print("   SUCCESS! Token can read orders.")
            data = resp.json()
            if 'data' in data and len(data['data']) > 0:
                print(f"   First Order Code: {data['data'][0].get('code')}")
                # Try to print merchant info from order?
                print(f"   Order attributes: {data['data'][0].get('attributes')}")
            else:
                print("   Result: Valid but no orders found (empty list).")
        else:
            print(f"   Failed: {resp.text[:200]}")
    except Exception as e:
        print(f"   Error: {e}")

    # 3. Check Content API (XML Mode)
    # Some older accounts only support XML
    url_xml = "https://kaspi.kz/shop/api/products"
    headers_xml = headers.copy()
    headers_xml["Accept"] = "application/xml"
    print(f"\n3. Testing Content API (XML Mode): {url_xml}")
    try:
        resp = requests.get(url_xml, headers=headers_xml, timeout=10)
        print(f"   Status: {resp.status_code}")
        if resp.status_code == 200:
            print("   SUCCESS! Token can access Product List (XML).")
        else:
             print(f"   Failed: {resp.text[:200]}")
    except Exception as e:
        print(f"   Error: {e}")

if __name__ == "__main__":
    probe_capabilities()
