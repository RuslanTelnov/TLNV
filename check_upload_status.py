
import os
import sys
import requests
import json

# Add parent directory to path to import config
sys.path.append(os.path.join(os.getcwd(), 'moysklad-web', 'automation', 'kaspi'))
import config

def check_status(upload_id):
    token = config.KASPI_API_TOKEN
    if not token:
        print("No token")
        return

    headers = {
        "X-Auth-Token": token,
        "Accept": "application/json"
    }

    url = f"{config.KASPI_CONTENT_API_URL}/products/import/history?code={upload_id}"
    
    print(f"Checking status for upload: {upload_id}")
    print(f"URL: {url}")
    # print(f"Headers: {headers}") # Don't print private token
    
    try:
        resp = requests.get(url, headers=headers, timeout=10) # 10s timeout
        print(f"Response Code: {resp.status_code}")
        
        if resp.status_code == 200:
            data = resp.json()
            print(json.dumps(data, indent=2, ensure_ascii=False))
        else:
            print(f"Error: {resp.status_code}")
            print(resp.text)
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        # Default to the one we just created if no arg provided
        upload_id = "9f815440-e654-49d9-a202-3c4bebb4f829"
    else:
        upload_id = sys.argv[1]
        
    check_status(upload_id)
