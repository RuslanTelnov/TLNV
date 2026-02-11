import requests
import re
import json
import sys
import os

# Add parent directory to path to import config
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import config

def scrape_product_requests(url):
    headers = {
        "User-Agent": config.USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
        "Accept-Language": "en-US,en;q=0.9,ru;q=0.8",
        "Cache-Control": "max-age=0",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1"
    }
    
    try:
        print(f"Fetching {url}...")
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        
        html = response.text
        
        # Save HTML for debugging
        with open("debug_kaspi.html", "w", encoding="utf-8") as f:
            f.write(html)
            
        images = []
        attributes = {}
        
        # Robust JSON extraction using brace counting
        start_marker = "BACKEND.components.item = {"
        start_index = html.find(start_marker)
        
        if start_index != -1:
            start_index += len(start_marker) - 1 # Point to the first '{'
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
                
                # 1. Title
                if "card" in data:
                    card = data["card"]
                    if "title" in card:
                        title = card["title"]
                    if "categoryId" in card:
                        attributes["category_id"] = card["categoryId"] # Store temporarily in attributes or return separately
                    if "promoConditions" in card and "brand" in card["promoConditions"]:
                        attributes["brand"] = card["promoConditions"]["brand"]

                # 2. Description
                if "description" in data:
                    description = data["description"]
                
                # 3. Images
                if "galleryImages" in data:
                    for img in data["galleryImages"]:
                        if "large" in img:
                            images.append(img["large"])
                        elif "medium" in img:
                            images.append(img["medium"])
                
                # 4. Attributes
                if "specifications" in data:
                    for spec_group in data["specifications"]:
                        if "features" in spec_group:
                            for feature in spec_group["features"]:
                                key = feature.get("code") # Use code for API mapping
                                values = []
                                if "featureValues" in feature:
                                    for fv in feature["featureValues"]:
                                        if "value" in fv:
                                            values.append(fv["value"])
                                if key and values:
                                    attributes[key] = values[0] if len(values) == 1 else values # Store as list if multiple, or single value
                                    
            except Exception as e:
                print(f"Error parsing JSON: {e}")
        else:
             print("Warning: BACKEND.components.item not found in HTML")
             
        # Extract category_id and brand from attributes if stored there
        category_id = attributes.pop("category_id", None)
        brand = attributes.pop("brand", "Generic")
                
        return {
            "title": title,
            "description": description,
            "images": images,
            "attributes": attributes,
            "category_id": category_id,
            "brand": brand,
            "source_url": url
        }
        
    except Exception as e:
        print(f"Error scraping with requests: {e}")
        return None

def search_product_requests(article):
    """
    Returns the direct URL for the product based on article.
    """
    return f"https://kaspi.kz/shop/p/-{article}/"

if __name__ == "__main__":
    url = "https://kaspi.kz/shop/p/panama-vel01-razmer-universal-nyi-seryi-150510865/?c=750000000"
    if len(sys.argv) > 1:
        url = sys.argv[1]
        
    data = scrape_product_requests(url)
    print(json.dumps(data, indent=2, ensure_ascii=False))
