from curl_cffi import requests
import json

def test_ozon_mobile_v2():
    # Another variant of the mobile endpoint
    url = "https://api.ozon.ru/composer-api.bx/page/json/v2?url=/search/?text=iphone"
    
    # Headers from a real android session capture (anonymized)
    headers = {
        "User-Agent": "ozonapp_android/16.14.0+1658",
        "x-o3-app-name": "ozonapp_android",
        "x-o3-app-version": "16.14.0(1658)",
        "x-o3-device-type": "mobile",
        "Accept": "application/json; charset=utf-8",
        "Content-Type": "application/json; charset=utf-8",
        "Host": "api.ozon.ru",
        "Connection": "Keep-Alive",
        "Accept-Encoding": "gzip"
    }
    
    print(f"Testing Mobile API V2: {url}")
    
    try:
        # Not using impersonate here to avoid conflicting with mobile headers
        # But sometimes we need it for TLS handshake. Let's try without first.
        resp = requests.get(url, headers=headers, timeout=10)
        print(f"Status (No Impersonate): {resp.status_code}")
        
        if resp.status_code != 200:
             # Try with impersonate but keeping headers
             print("Retrying with impersonate...")
             resp = requests.get(url, headers=headers, impersonate="chrome110", timeout=10)
             print(f"Status (With Impersonate): {resp.status_code}")

        if resp.status_code == 200:
            print("Success!")
            print(resp.text[:500])
        else:
            print("Failed")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_ozon_mobile_v2()
