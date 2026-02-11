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
            # Retry logic
            max_retries = 3
            for attempt in range(max_retries):
                try:
                    # print(f"Navigating to {url} (Attempt {attempt+1}/{max_retries})...", file=sys.stderr)
                    page.goto(url, wait_until="domcontentloaded", timeout=60000)
                    break
                except Exception as e:
                    if attempt == max_retries - 1:
                        raise e
                    time.sleep(2)
            
            # Wait for title to ensure page loaded
            try:
                page.wait_for_selector("h1.item__heading", timeout=10000)
            except:
                # If h1 not found, maybe it's a 404 or captcha
                if "captcha" in page.content().lower():
                    return {"error": "Kaspi Captcha detected"}
                
                # Save HTML for debugging
                with open("kaspi_product_debug.html", "w") as f:
                    f.write(page.content())
                    
                return {"error": "Product not found or page structure changed"}

            # Save HTML for debugging
            with open("kaspi_product_debug.html", "w") as f:
                f.write(page.content())

            # Extract Data
            title = page.locator("h1.item__heading").inner_text().strip()
            
            # Price - handle ranges or single price
            price = 0
            try:
                # Try multiple selectors for price
                price_selectors = [
                    ".item__price-once",
                    ".item__price",
                    ".item__price-value"
                ]
                
                price_text = ""
                for selector in price_selectors:
                    if page.locator(selector).first.is_visible(timeout=5000):
                        price_text = page.locator(selector).first.inner_text().strip()
                        break
                
                if not price_text:
                    # Fallback: Search for price pattern in the whole text
                    print("DEBUG: Price selectors failed, trying regex...", file=sys.stderr)
                    page_content = page.content()
                    # Look for "price":1234 or "price": 1234 pattern in scripts
                    price_match = re.search(r'"price":\s*(\d+)', page_content)
                    if price_match:
                        price = int(price_match.group(1))
                    else:
                        # Look for visual price text like "1 234 ₸"
                        visible_text = page.inner_text("body")
                        # Find lines with ₸
                        for line in visible_text.split('\n'):
                            if '₸' in line and any(c.isdigit() for c in line):
                                # Extract number
                                clean_line = re.sub(r"[^\d]", "", line)
                                if clean_line:
                                    price = int(clean_line)
                                    break
                        
                        if price == 0:
                            print("DEBUG: Price element not found even with regex", file=sys.stderr)
                            page.screenshot(path="kaspi_debug_no_price.png")
                else:
                    # Clean price (remove ₸ and spaces)
                    price = int(re.sub(r"[^\d]", "", price_text))
            except Exception as e:
                print(f"DEBUG: Price extraction error: {e}", file=sys.stderr)
                page.screenshot(path="kaspi_debug_price_error.png")
            
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
                
                # Try meta tags if no images found
                if not images:
                    og_image = page.locator('meta[property="og:image"]').get_attribute("content")
                    if og_image:
                        images.append(og_image)
                    
                    link_image = page.locator('link[rel="image_src"]').get_attribute("href")
                    if link_image and link_image not in images:
                        images.append(link_image)


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
