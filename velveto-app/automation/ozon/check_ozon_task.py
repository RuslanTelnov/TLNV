import requests
import json
import os
from dotenv import load_dotenv
import sys

# Load env from .env.ozon
load_dotenv(os.path.join(os.getcwd(), "ozon-automation", ".env.ozon"))

OZON_CLIENT_ID = os.getenv('OZON_CLIENT_ID')
OZON_API_KEY = os.getenv('OZON_API_KEY')

headers = {
    'Client-Id': OZON_CLIENT_ID,
    'Api-Key': OZON_API_KEY,
    'Content-Type': 'application/json'
}

def check_task(task_id):
    url = "https://api-seller.ozon.ru/v1/product/import/info"
    payload = {"task_id": int(task_id)}
    
    print(f"🔍 Checking task {task_id}...")
    
    try:
        response = requests.post(url, headers=headers, json=payload)
        if response.status_code == 200:
            print("✅ Status retrieved:")
            print(json.dumps(response.json(), indent=2, ensure_ascii=False))
        else:
            print(f"❌ FAILED: {response.status_code}")
            print(response.text)
    except Exception as e:
        print(f"❌ Exception: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        task_id = sys.argv[1]
    else:
        # Try to read from file
        try:
            with open("ozon-automation/last_task_id.txt", "r") as f:
                task_id = f.read().strip()
        except:
            print("Usage: python check_ozon_task.py <task_id>")
            sys.exit(1)
            
    check_task(task_id)
