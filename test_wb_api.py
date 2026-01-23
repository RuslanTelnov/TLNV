import requests
import json
import urllib.parse

def test_search(query):
    encoded_query = urllib.parse.quote(query)
    # Common WB API endpoint for search
    # dest=-1257786 is often used for Astana/KZ or general regions. 
    # Let's try a generic one first.
    url = f"https://search.wb.ru/exactmatch/ru/common/v5/search?ab_testing=false&appType=1&curr=kzt&dest=-1257786&query={encoded_query}&resultset=catalog&sort=popular&spp=30&suppressSpellcheck=false"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "*/*",
        "Origin": "https://www.wildberries.ru",
        "Referer": f"https://www.wildberries.ru/catalog/0/search.aspx?search={encoded_query}"
    }
    
    print(f"Testing URL: {url}")
    
    try:
        resp = requests.get(url, headers=headers, timeout=10)
        print(f"Status Code: {resp.status_code}")
        
        if resp.status_code == 200:
            data = resp.json()
            products = data.get('data', {}).get('products', [])
            print(f"Found {len(products)} products via API.")
            if products:
                print("Sample Product:", products[0]['name'], products[0]['id'])
                return True
        else:
            print("Response:", resp.text[:200])
            
    except Exception as e:
        print(f"Error: {e}")
        
    return False

if __name__ == "__main__":
    test_search("кукла")
