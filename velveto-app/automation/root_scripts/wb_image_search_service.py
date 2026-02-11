import sys
import json
import time
import os
import requests
import re
from playwright.sync_api import sync_playwright

def log(msg):
    print(f"DEBUG: {msg}", file=sys.stderr)


def download_image(url):
    try:
        response = requests.get(url, stream=True)
        if response.status_code == 200:
            filename = f"temp_search_{int(time.time())}.jpg"
            filepath = os.path.abspath(filename)
            with open(filepath, 'wb') as f:
                for chunk in response.iter_content(1024):
                    f.write(chunk)
            return filepath
    except Exception as e:
        return None
    return None

def wb_image_search(image_url):
    log(f"Starting search for: {image_url}")
    image_path = download_image(image_url)
    log(f"Downloaded image to: {image_path}")
    if not image_path:
        print(json.dumps({"error": "Failed to download image"}))
        return

    # Desktop User Agent (Chrome)
    user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"

    with sync_playwright() as p:
        log("Launching browser...")
        browser = p.chromium.launch(
            headless=True,
            args=[
                "--disable-blink-features=AutomationControlled",
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-infobars",
                "--window-position=0,0",
                "--ignore-certifcate-errors",
                "--ignore-certifcate-errors-spki-list",
            ]
        )
        context = browser.new_context(
            viewport={'width': 375, 'height': 812}, # iPhone X
            user_agent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
            is_mobile=True,
            has_touch=True
        )
        page = context.new_page()
        page.add_init_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        
        try:
            log("Navigating to WB...")
            page.goto("https://www.wildberries.ru", wait_until="domcontentloaded", timeout=15000)
            log("Navigated. Waiting for search input...")
            
            # Wait for preloader to disappear
            try:
                log("Waiting for preloader to disappear...")
                page.wait_for_selector(".general-preloader", state="detached", timeout=30000)
                log("Preloader disappeared.")
            except:
                log("Preloader wait timeout or not found.")

            # Click camera button (using aria-label or class)
            try:
                # Wait for search input to be ready
                log("Waiting for search input (and anti-bot check)...")
                page.wait_for_selector("#searchInput", timeout=15000)
                
                # Handle popups NOW that we are on the real page
                try:
                    log("Checking for popups...")
                    # Wait a bit for potential popups
                    time.sleep(2)
                    
                    # Try to close popup by clicking top right corner (blindly)
                    # This is risky but might work for full screen ads
                    # page.mouse.click(350, 50) 
                    
                    # Common popup close buttons
                    close_buttons = [
                        ".popup__close",
                        ".j-close-popup",
                        "button[aria-label='Закрыть']",
                        ".close-button",
                        "div[class*='popup'] button[class*='close']"
                    ]
                    for selector in close_buttons:
                        try:
                            if page.locator(selector).first.is_visible(timeout=1000):
                                log(f"Closing popup with selector: {selector}")
                                page.locator(selector).first.click()
                                time.sleep(1)
                        except:
                            pass
                except Exception as e:
                    log(f"Popup handling error: {e}")
                
                # Upload file using file chooser or custom popup
                try:
                    log("Attempting to upload file...")
                    
                    # Try the new button first (Custom Popup Flow)
                    new_btn = page.locator("#searchByImageFormAbNew")
                    if new_btn.is_visible():
                        log("Clicking new camera button...")
                        new_btn.click()
                        
                        log("Waiting for custom popup...")
                        # Wait for popup container to be visible
                        popup_container = page.locator("#uploadImageForSearchByImagePopUpContainer")
                        popup_container.wait_for(state="visible", timeout=10000)
                        log("Popup container visible.")
                        
                        # Find file input inside popup
                        # Usually it's an input[type='file'] inside the popup
                        file_input = popup_container.locator("input[type='file']").first
                        if file_input.count() == 0:
                            # Maybe it's not inside the container directly?
                            file_input = page.locator("input[type='file']").first
                        
                        log("Setting file on input...")
                        file_input.set_input_files(image_path)
                        
                        # Dispatch events just in case
                        file_input.evaluate("e => e.dispatchEvent(new Event('change', {bubbles: true}))")
                        file_input.evaluate("e => e.dispatchEvent(new Event('input', {bubbles: true}))")
                        log("File set on popup input.")
                        
                    else:
                        # Fallback to old flow (File Chooser)
                        log("New button not visible, trying generic flow...")
                        with page.expect_file_chooser(timeout=5000) as fc_info:
                            camera_btn = page.locator(".search-catalog__btn--photo").first
                            if camera_btn.count() > 0:
                                camera_btn.evaluate("el => el.classList.remove('hide')")
                                camera_btn.click(force=True)
                            else:
                                page.locator("label[aria-label='Поиск по фото']").first.click(force=True)
                        
                        file_chooser = fc_info.value
                        file_chooser.set_files(image_path)
                        log("File set in file chooser.")

                except Exception as e:
                    log(f"Upload error: {e}")
                    # Fallback to direct input setting if everything else failed
                    try:
                        log("Trying direct input fallback...")
                        file_input = page.locator("input[type='file']").first
                        if file_input.count() > 0:
                            file_input.set_input_files(image_path)
                            file_input.evaluate("e => e.dispatchEvent(new Event('change', {bubbles: true}))")
                    except:
                        pass
                

                # Wait for results
                # URL should change to /search?...
                log("Waiting for URL change...")
                page.wait_for_url("**/search?**", timeout=15000)
                log("URL changed. Waiting for product cards...")
                
                # Wait for product cards
                page.wait_for_selector(".product-card", timeout=30000)
                
                # Extract results (Top 5)
                products = []
                cards = page.locator(".product-card").all()[:5]
                
                for card in cards:
                    try:
                        # Extract ID from link
                        link = card.locator("a.product-card__link").get_attribute("href")
                        wb_id = link.split("/catalog/")[1].split("/")[0]
                        
                        # Title
                        title = card.locator(".product-card__name").inner_text().strip()
                        
                        # Price
                        price_text = card.locator(".price__lower-price").inner_text().strip()
                        price = int(re.sub(r"[^\d]", "", price_text))
                        
                        # Image
                        img = card.locator("img").get_attribute("src")
                        if img and not img.startswith("http"):
                            img = "https:" + img
                            
                        products.append({
                            "id": wb_id,
                            "title": title,
                            "price": price,
                            "image_url": img,
                            "url": link,
                            "source": "wb"
                        })
                    except:
                        continue
                
                print(json.dumps({"results": products}))
                
            except Exception as e:
                print(json.dumps({"error": f"Search failed: {str(e)}"}))
                try:
                    page.screenshot(path="wb_search_error.png")
                except:
                    pass
                
        except Exception as e:
             error_msg = f"Browser error: {str(e)}"
             print(json.dumps({"error": error_msg}))
             try:
                 page.screenshot(path="wb_search_error.png")
             except:
                 pass
        finally:
            browser.close()
            if os.path.exists(image_path):
                os.remove(image_path)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Image URL required"}))
        sys.exit(1)
    
    import re # Import here to be safe
    image_url = sys.argv[1]
    wb_image_search(image_url)
