
import requests
import json

# Product ID known to exist in the "visible" dashboard
PRODUCT_ID = "8143657"

# Variants
TOKEN_RAW = "dutmsmqJIEi4CpuX2PNPDLbNcdpiRwNpKc3mwggACq0"
TOKEN_PADDED = "dutmsmqJIEi4CpuX2PNPDLbNcdpiRwNpKc3mwggACq0="

def test_token(token_val, label):
    url = f"https://kaspi.kz/shop/api/products/{PRODUCT_ID}"
    headers = {
        "X-Auth-Token": token_val,
        "Accept": "application/json",
         "User-Agent": "Mozilla/5.0"
    }
    
    print(f"Testing {label} ('{token_val}') on {url}...")
    try:
        resp = requests.get(url, headers=headers, timeout=10)
        print(f"Status: {resp.status_code}")
        if resp.status_code == 200:
             print("SUCCESS! Token works and found product.")
        elif resp.status_code == 401:
             print("FAILED: 401 Unauthorized (Invalid Token)")
        elif resp.status_code == 404:
             print("FAILED: 404 Not Found (Valid Token, Wrong Merchant/Product)")
        else:
             print(f"Result: {resp.status_code}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_token(TOKEN_RAW, "RAW (User provided)")
    test_token(TOKEN_PADDED, "PADDED (With =)")
