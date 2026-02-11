import sys
import json
import urllib.parse
import re
from playwright.sync_api import sync_playwright

def search_kaspi(query):
    encoded_query = urllib.parse.quote(query)
    url = f"https://kaspi.kz/shop/search/?text={encoded_query}"
    
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=[
                "--disable-blink-features=AutomationControlled",
                "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            ]
        )
        context = browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = context.new_page()
        
        try:
            # print(f"Navigating to {url}...", file=sys.stderr)
            page.goto(url, wait_until="domcontentloaded", timeout=30000)
            
            # Wait for results
            try:
                page.wait_for_selector(".item-card", timeout=10000)
            except:
                if "captcha" in page.content().lower():
                    print(json.dumps({"error": "Kaspi Captcha detected"}))
                    return
                print(json.dumps({"error": "No results found"}))
                return

            # Get first item
            first_item = page.locator(".item-card").first
            
            title = first_item.locator(".item-card__name-link").inner_text().strip()
            
            # Image
            img_el = first_item.locator(".item-card__image-wrapper img").first
            src = img_el.get_attribute("src")
            
            if src:
                large_src = src.replace("gallery-medium", "gallery-large")
            else:
                large_src = None

            # SKU from link
            link_el = first_item.locator(".item-card__name-link").first
            href = link_el.get_attribute("href")
            sku = None
            if href:
                # href looks like https://kaspi.kz/shop/p/-117420207/
                match = re.search(r'-(\d+)/', href)
                if match:
                    sku = match.group(1)

            result = {
                "title": title,
                "sku": sku,
                "image_url": large_src,
                "source": "kaspi_search"
            }
            
            print(json.dumps(result))
            
        except Exception as e:
            print(json.dumps({"error": str(e)}))
        finally:
            browser.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Query required"}))
        sys.exit(1)
    
    query = sys.argv[1]
    search_kaspi(query)
