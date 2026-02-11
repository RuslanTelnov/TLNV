from curl_cffi import requests
import json

def test_ozon_recon():
    product_id = 1710393028
    url = f"https://www.ozon.ru/product/dozhdevik-light-of-seraphina-{product_id}/"
    
    print(f"Testing Ozon Product: {product_id}")
    print(f"URL: {url}")
    
    # 1. Direct Page Access (curl_cffi)
    print("\n--- 1. Direct Page Access (curl_cffi) ---")
    try:
        resp = requests.get(url, impersonate="chrome110", timeout=10)
        print(f"Status: {resp.status_code}")
        if resp.status_code == 200:
            if "__NEXT_DATA__" in resp.text:
                print("Found __NEXT_DATA__ (SSR JSON)!")
                # Extract JSON
                start = resp.text.find('id="__NEXT_DATA__" type="application/json">') + len('id="__NEXT_DATA__" type="application/json">')
                end = resp.text.find('</script>', start)
                json_data = resp.text[start:end]
                try:
                    data = json.loads(json_data)
                    print("Successfully parsed JSON data")
                    # Look for price
                    # This structure is complex and changes, but let's see if we can find 'price' key
                    print(f"JSON keys: {list(data.keys())}")
                except:
                    print("Failed to parse JSON")
            else:
                print("No __NEXT_DATA__ found")
        else:
            print("Blocked or failed")
    except Exception as e:
        print(f"Error: {e}")

    # 2. Composer API (Guessing endpoint)
    print("\n--- 2. Composer API (Guessing) ---")
    # This is a common pattern for Ozon's mobile/web api
    api_url = "https://www.ozon.ru/api/composer-api.bx/page/json/v2?url=/product/dozhdevik-light-of-seraphina-1710393028/"
    try:
        resp = requests.get(api_url, impersonate="chrome110", timeout=10)
        print(f"Testing API: {api_url}")
        print(f"Status: {resp.status_code}")
        if resp.status_code == 200:
            try:
                data = resp.json()
                print("Successfully fetched API JSON")
                # print(json.dumps(data, indent=2)[:500]) # Print start
                if 'widgetStates' in data:
                    print(f"Found widgetStates: {len(data['widgetStates'])} widgets")
            except:
                print("Failed to parse API JSON")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_ozon_recon()
