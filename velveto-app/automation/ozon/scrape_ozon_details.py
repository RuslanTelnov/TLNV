from playwright.sync_api import sync_playwright
import json
import os
import time
from playwright_stealth.stealth import Stealth

MATCHED_FILE = os.path.join(os.getcwd(), "ozon-automation", "matched_products.json")
READY_FILE = os.path.join(os.getcwd(), "ozon-automation", "ready_to_create.json")

def scrape_details():
    if not os.path.exists(MATCHED_FILE):
        print("No matched products to scrape.")
        return

    with open(MATCHED_FILE, 'r') as f:
        products = json.load(f)
        
    enriched_products = []
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        )
        page = context.new_page()
        Stealth().apply_stealth_sync(page)
        
        for product in products:
            link = product['ozon_link']
            print(f"Scraping {link}...")
            
            try:
                page.goto(link, timeout=60000)
                page.wait_for_load_state("networkidle")
                
                # Scrape Title
                title = page.title()
                # Try to get h1
                try:
                    h1 = page.inner_text('h1')
                    if h1:
                        title = h1
                except:
                    pass
                
                # Scrape Description
                description = ""
                try:
                    # Ozon description selector varies. Try generic text block or look for "Описание"
                    # Usually it's in a div with id "description" or similar
                    description = page.locator('#section-description').inner_text()
                except:
                    try:
                        description = page.locator('div[data-widget="webDescription"]').inner_text()
                    except:
                        pass
                
                # Scrape Images
                images = []
                try:
                    # Look for image gallery
                    imgs = page.eval_on_selector_all('div[data-widget="webGallery"] img', 'elements => elements.map(e => e.src)')
                    # Filter for high res
                    images = [img for img in imgs if 'c500' not in img and 'c200' not in img] # Rough filter
                    if not images:
                         # Fallback to all images
                         images = imgs
                except:
                    pass

                # Scrape Breadcrumbs (Category)
                category_path = []
                try:
                    breadcrumbs = page.eval_on_selector_all('ol[itemtype="http://schema.org/BreadcrumbList"] li span[itemprop="name"]', 'elements => elements.map(e => e.innerText)')
                    category_path = breadcrumbs
                except:
                    pass
                
                # Scrape Attributes
                attributes = {}
                try:
                    # Characteristics section
                    # This is hard to generalize, but usually dl/dt/dd or div rows
                    # Try to find text "Характеристики" and look after it
                    pass 
                except:
                    pass

                print(f"  Title: {title}")
                print(f"  Category Path: {category_path}")
                print(f"  Images found: {len(images)}")
                
                enriched_products.append({
                    **product,
                    "scraped_title": title,
                    "scraped_description": description,
                    "scraped_images": images,
                    "category_path": category_path,
                    "scraped_attributes": attributes
                })
                
            except Exception as e:
                print(f"⚠️ Error scraping {link}: {e}")
                
            time.sleep(2)
            
        browser.close()
        
    with open(READY_FILE, 'w', encoding='utf-8') as f:
        json.dump(enriched_products, f, indent=2, ensure_ascii=False)
        
    print(f"Saved {len(enriched_products)} products to {READY_FILE}")

if __name__ == "__main__":
    scrape_details()
