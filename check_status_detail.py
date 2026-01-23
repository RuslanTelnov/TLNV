
import requests
import json
import time
import sys

UPLOAD_ID = "f347d9d1-928c-444a-aeee-afda70da3ef7" # The latest one
TOKEN = "dutmsmqJIEi4CpuX2PNPDLbNcdpiRwNpKc3mwggACq0="

def check_status():
    url = f"https://kaspi.kz/shop/api/products/import/history?code={UPLOAD_ID}"
    headers = {
        "X-Auth-Token": TOKEN,
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
    
    print(f"Checking status for: {UPLOAD_ID}")
    
    try:
        # Increase timeout
        resp = requests.get(url, headers=headers, timeout=60)
        
        print(f"Status Code: {resp.status_code}")
        if resp.status_code == 200:
            data = resp.json()
            print(json.dumps(data, indent=2, ensure_ascii=False))
            
            # Specific check for errors
            if 'attributes' in data:
                 print("\nUpload details found.")
        else:
            print("Response:", resp.text)
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        UPLOAD_ID = sys.argv[1]
    check_status()
