from playwright.sync_api import sync_playwright
import json
import os
import time

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
IMAGES_DIR = os.path.join(SCRIPT_DIR, "images")
PRODUCTS_FILE = os.path.join(SCRIPT_DIR, "products_to_process.json")
MATCHED_FILE = os.path.join(SCRIPT_DIR, "matched_products.json")

def find_matches():
    if not os.path.exists(PRODUCTS_FILE):
        print("No products to process.")
        return

    with open(PRODUCTS_FILE, 'r') as f:
        products = json.load(f)
        
    matched_products = []
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        )
        page = context.new_page()
        
        for product in products:
            ms_id = product['ms_id']
            image_filename = product['image_filename']
            image_path = os.path.join(IMAGES_DIR, image_filename)
            
            if not os.path.exists(image_path):
                print(f"Image not found: {image_path}")
                continue

            print(f"Processing {product['name']}...")
            
            try:
                page.goto("https://yandex.ru/images/", timeout=60000)
                
                # Click camera icon
                # Try multiple selectors
                try:
                    page.click('.mini-suggest__button_type_camera', timeout=5000)
                except:
                    try:
                        page.click('button[aria-label="Поиск по картинке"]', timeout=5000)
                    except:
                        print("Could not find camera button")
                        continue

                # Upload file
                file_input = page.locator('input[type="file"]')
                file_input.set_input_files(image_path)
                
                # Wait for results
                # Look for 'Sites' tab or just results list
                try:
                    page.wait_for_selector('.CbirSites-Item', timeout=20000)
                except:
                    print("Timeout waiting for results")
                    # Take screenshot for debug
                    page.screenshot(path=f"ozon-automation/debug_{ms_id}.png")
                    continue
                
                # Extract links from "Sites" section (CbirSites)
                # We look for links containing ozon.ru
                # links = page.eval_on_selector_all('a.CbirSites-ItemTitle', 'elements => elements.map(e => e.href)')
                
                # Debug: print all links
                links = page.eval_on_selector_all('a', 'elements => elements.map(e => e.href)')
                print(f"Found {len(links)} links. First 10: {links[:10]}")
                page.screenshot(path=f"ozon-automation/results_{ms_id}.png")

                ozon_link = None
                for link in links:
                    if "ozon.ru/product/" in link or "ozon.ru/context/detail/id/" in link:
                        ozon_link = link
                        break
                
                if ozon_link:
                    print(f"✅ Found Ozon link: {ozon_link}")
                    matched_products.append({
                        **product,
                        "ozon_link": ozon_link
                    })
                else:
                    print("❌ No Ozon link found in top results.")
                    
            except Exception as e:
                print(f"⚠️ Error: {e}")
                page.screenshot(path=f"ozon-automation/error_{ms_id}.png")
                
            time.sleep(2) # Be nice
                
        browser.close()
        
    with open(MATCHED_FILE, 'w', encoding='utf-8') as f:
        json.dump(matched_products, f, indent=2, ensure_ascii=False)
        
    print(f"Saved {len(matched_products)} matches to {MATCHED_FILE}")

if __name__ == "__main__":
    find_matches()
