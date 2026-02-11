from curl_cffi import requests
import json
import time

def test_ozon_search():
    # Try to search for "socks" or something simple
    # Using the composer API endpoint for search
    query = "носки"
    url = f"https://www.ozon.ru/api/composer-api.bx/page/json/v2?url=/search/?text={query}"
    
    print(f"Testing Ozon Search API: {url}")
    
    # Headers mimicking a real browser visit
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json",
        "Accept-Language": "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7",
        "Referer": "https://www.ozon.ru/",
        "Origin": "https://www.ozon.ru"
    }
    
    try:
        # impersonate="chrome110" is crucial here
        resp = requests.get(url, headers=headers, impersonate="chrome110", timeout=15)
        print(f"Status: {resp.status_code}")
        
        if resp.status_code == 200:
            print("Success!")
            try:
                data = resp.json()
                # Save to file to inspect structure
                with open("ozon_search_result.json", "w", encoding="utf-8") as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
                print("Saved to ozon_search_result.json")
                
                # Try to find products in the widgetStates
                if 'widgetStates' in data:
                    print(f"Found {len(data['widgetStates'])} widgets")
                    for key, value in data['widgetStates'].items():
                        if 'searchResultsV2' in key:
                            print(f"Found search results widget: {key}")
                            items = json.loads(value).get('items', [])
                            print(f"Found {len(items)} items")
                            if items:
                                first = items[0]
                                print(f"First item: {first.get('mainState', {}).get('name')}")
                                print(f"Price: {first.get('mainState', {}).get('price')}")
            except Exception as e:
                print(f"JSON Parse Error: {e}")
                print(resp.text[:500])
        else:
            print("Failed")
            # print(resp.text[:500])
            
    except Exception as e:
        print(f"Request Error: {e}")

if __name__ == "__main__":
    test_ozon_search()
