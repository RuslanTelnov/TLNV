import requests
import json
import os
from dotenv import load_dotenv

if os.path.exists(".env.ozon"):
    load_dotenv(".env.ozon")
else:
    load_dotenv(os.path.join(os.getcwd(), "ozon-automation", ".env.ozon"))

OZON_CLIENT_ID = os.getenv('OZON_CLIENT_ID')
OZON_API_KEY = os.getenv('OZON_API_KEY')

headers = {
    'Client-Id': OZON_CLIENT_ID,
    'Api-Key': OZON_API_KEY,
    'Content-Type': 'application/json'
}

def check_v2_tree():
    url = "https://api-seller.ozon.ru/v2/category/tree"
    print("Fetching v2 category tree...")
    try:
        resp = requests.post(url, headers=headers, json={})
        if resp.status_code != 200:
            print(f"Error: {resp.status_code} - {resp.text}")
            return

        data = resp.json()
        tree = data.get('result', [])
        
        def traverse(nodes):
            for node in nodes:
                if "тренажер" in node['title'].lower():
                    print(f"Found: {node['title']} (ID: {node['category_id']})")
                
                if 'children' in node:
                    traverse(node['children'])
                    
        traverse(tree)
            
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    check_v2_tree()
