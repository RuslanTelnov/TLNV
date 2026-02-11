from curl_cffi import requests as crequests
import json
import re

def inspect_sellers(url):
    print(f"Fetching {url}...")
    try:
        # Use curl_cffi to bypass potential bot protection
        response = crequests.get(
            url, 
            impersonate="chrome120",
            headers={
                "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7"
            }
        )
        
        if response.status_code != 200:
            print(f"Error: Status code {response.status_code}")
            return

        html = response.text
        
        with open("kaspi_product_debug.html", "w", encoding="utf-8") as f:
            f.write(html)
        print("Saved HTML to kaspi_product_debug.html")
        # Kaspi often puts offers in a separate API call or a different JSON block
        
        # Check for "offers" in the HTML
        if "offers" in html:
            print("Found 'offers' string in HTML.")
            
        # Try to extract the main JSON
        start_marker = "BACKEND.components.item = {"
        start_index = html.find(start_marker)
        
        if start_index != -1:
            start_index += len(start_marker) - 1
            brace_count = 0
            json_str = ""
            
            for i in range(start_index, len(html)):
                char = html[i]
                if char == '{':
                    brace_count += 1
                elif char == '}':
                    brace_count -= 1
                
                json_str += char
                
                if brace_count == 0:
                    break
            
            try:
                data = json.loads(json_str)
                print("Extracted JSON keys:", data.keys())
                
                if "offers" in data:
                    print("Found 'offers' in JSON!")
                    print(json.dumps(data["offers"], indent=2, ensure_ascii=False)[:500]) # Print first 500 chars
                else:
                    print("'offers' NOT found in main JSON.")
                    
                # Check other potential keys
                if "sellers" in data:
                    print("Found 'sellers' in JSON!")
            except Exception as e:
                print(f"Error parsing JSON: {e}")
        else:
            print("BACKEND.components.item not found.")

    except Exception as e:
        print(f"Error: {e}")

    # Test API endpoints
    sku = "150510865"
    if "150510865" in url:
        pass
    else:
        # Extract SKU from URL
        match = re.search(r'-(\d+)/', url)
        if match:
            sku = match.group(1)
    
    print(f"\nTesting API endpoints for SKU: {sku}")
    
    endpoints = [
        f"https://kaspi.kz/yml/offer-view/offers/{sku}",
        f"https://kaspi.kz/shop/api/v2/offers/{sku}",
        f"https://kaspi.kz/shop/api/products/{sku}/offers",
        f"https://kaspi.kz/shop/api/v1/products/{sku}/offers"
    ]
    
    headers = {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Referer": url,
        "X-KS-City": "750000000" # Almaty
    }
    
    for ep in endpoints:
        print(f"Testing {ep}...")
        try:
            resp = crequests.get(ep, headers=headers, impersonate="chrome120")
            print(f"Status: {resp.status_code}")
            if resp.status_code == 200:
                try:
                    data = resp.json()
                    print("Success! JSON keys:", data.keys())
                    if "offers" in data:
                        print(f"Found {len(data['offers'])} offers.")
                        print(json.dumps(data['offers'][0], indent=2, ensure_ascii=False))
                    elif isinstance(data, list):
                         print(f"Found {len(data)} items in list.")
                         print(json.dumps(data[0], indent=2, ensure_ascii=False))
                except:
                    print("Response is not JSON:", resp.text[:100])
        except Exception as e:
            print(f"Error: {e}")

if __name__ == "__main__":
    url = "https://kaspi.kz/shop/p/panama-vel01-razmer-universal-nyi-seryi-150510865/?c=750000000"
    inspect_sellers(url)

