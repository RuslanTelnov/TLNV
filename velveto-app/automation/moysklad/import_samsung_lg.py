import os
import time
import json
from supabase import create_client, Client
from playwright.sync_api import sync_playwright
from playwright_stealth import Stealth
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def import_samsung_lg():
    queries = [
        "чехол для пульта телевизора samsung",
        "чехол для пульта телевизора lg"
    ]
    
    with sync_playwright() as p:
        # Mobile emulation
        iphone_13 = p.devices['iPhone 13']
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            **iphone_13,
            locale='ru-RU',
            timezone_id='Asia/Almaty'
        )
        
        # Apply stealth
        stealth = Stealth()
        stealth.apply_stealth_sync(context)
        
        page = context.new_page()
        
        try:
            print("🏠 Visiting home page...")
            page.goto("https://www.wildberries.ru/", wait_until="domcontentloaded")
            time.sleep(2)
            
            for query in queries:
                url = f"https://www.wildberries.ru/catalog/0/search.aspx?search={query}&sort=popular"
                print(f"🔎 Searching for: {query}")
                
                page.goto(url, wait_until="domcontentloaded")
                time.sleep(5)
                
                # Extract details
                print("📦 Extracting product details...")
                try:
                    page.wait_for_selector('.product-card', timeout=10000)
                except:
                    print("⚠️ Timeout waiting for .product-card")
                
                products = page.evaluate("""() => {
                    const cards = Array.from(document.querySelectorAll('.product-card'));
                    return cards.map(card => {
                        try {
                            const link = card.querySelector('a.product-card__link');
                            const href = link ? link.href : '';
                            const idMatch = href.match(/catalog\/(\d+)\/detail/);
                            const id = idMatch ? parseInt(idMatch[1]) : null;
                            
                            const nameEl = card.querySelector('.product-card__name');
                            const name = nameEl ? nameEl.innerText.trim() : 'Unknown';
                            
                            const brandEl = card.querySelector('.product-card__brand');
                            const brand = brandEl ? brandEl.innerText.trim() : '';
                            
                            const priceEl = card.querySelector('.price__lower-price');
                            const priceText = priceEl ? priceEl.innerText.trim() : '';
                            const price = parseInt(priceText.replace(/\D/g, '')) || 0;
                            
                            const imgEl = card.querySelector('.product-card__img');
                            const imgUrl = imgEl ? imgEl.src : '';
                            
                            return { id, name, brand, price, imgUrl };
                        } catch (e) {
                            return null;
                        }
                    }).filter(p => p && p.id);
                }""")
                
                top_10 = products[:10]
                print(f"✅ Found {len(products)} products. Importing top 10...")
                
                count = 0
                for p in top_10:
                    try:
                        wb_id = p['id']
                        name = f"{p['brand']} / {p['name']}" if p['brand'] else p['name']
                        price = p['price']
                        image_url = p['imgUrl']
                        
                        data = {
                            "id": wb_id,
                            "name": name,
                            "price": price,
                            "image_url": image_url,
                            "currency": "KZT",
                            "sale_price_u": price, # Backfill immediately
                            "url": f"https://www.wildberries.ru/catalog/{wb_id}/detail.aspx"
                        }
                        
                        supabase.schema('Parser').table('wb_top_products').upsert(data).execute()
                        print(f"   💾 Saved {wb_id}: {name} - {price}")
                        count += 1
                    except Exception as e:
                        print(f"   ❌ Error saving {wb_id}: {e}")
                
                print(f"🎉 Imported {count} products for '{query}'.")
                time.sleep(2)

        except Exception as e:
            print(f"❌ Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    import_samsung_lg()
