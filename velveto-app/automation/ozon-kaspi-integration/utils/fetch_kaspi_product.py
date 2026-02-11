import sys
import json
import time
import re
from playwright.sync_api import sync_playwright

def fetch_kaspi_product(sku):
    url = f"https://kaspi.kz/shop/p/-{sku}/"
    
    with sync_playwright() as p:
        # Launch browser with stealth-like args
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
            
            # Wait for title to ensure page loaded
            try:
                page.wait_for_selector("h1.item__heading", timeout=10000)
            except:
                # If h1 not found, maybe it's a 404 or captcha
                if "captcha" in page.content().lower():
                    return {"error": "Kaspi Captcha detected"}
                return {"error": "Product not found or page structure changed"}

            # Extract Data
            title = page.locator("h1.item__heading").inner_text().strip()
            
            # Price - handle ranges or single price
            # Usually .item__price-once
            price_text = page.locator(".item__price-once").first.inner_text().strip()
            # Clean price (remove ₸ and spaces)
            price = int(re.sub(r"[^\d]", "", price_text))
            
            # Images
            images = []
            try:
                # Try to find all images in the slider/gallery
                selectors = [
                    ".item__slider-pic img",
                    ".gallery__main-img",
                    ".item__main-img img",
                    "div.item__slider img"
                ]
                
                for selector in selectors:
                    elements = page.locator(selector).all()
                    for el in elements:
                        src = el.get_attribute("src")
                        if src and "kaspi.kz/p/" in src:
                            # Convert to larger format if possible
                            large_src = src.replace("gallery-medium", "gallery-large")
                            if large_src not in images:
                                images.append(large_src)
                
                # If still no images, try a broader search
                if not images:
                    imgs = page.locator("img").all()
                    for img in imgs:
                        src = img.get_attribute("src")
                        if src and "kaspi.kz/img/m/p/" in src:
                            large_src = src.replace("gallery-medium", "gallery-large")
                            if large_src not in images:
                                images.append(large_src)

            except Exception as e:
                print(f"DEBUG: Image extraction error: {e}", file=sys.stderr)

            result = {
                "sku": sku,
                "title": title,
                "price": price,
                "image_url": images[0] if images else "",
                "images": images,
                "url": url,
                "source": "kaspi"
            }
            
            print(json.dumps(result))
            
        except Exception as e:
            print(json.dumps({"error": str(e)}))
        finally:
            browser.close()

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "SKU required"}))
        sys.exit(1)
    
    sku = sys.argv[1]
    fetch_kaspi_product(sku)
