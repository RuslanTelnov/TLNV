from playwright.sync_api import sync_playwright
import sys
import time

def dump_page(url, output_file):
    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=["--disable-blink-features=AutomationControlled"]
        )
        context = browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = context.new_page()
        print(f"Navigating to {url}...")
        page.goto(url, wait_until="domcontentloaded", timeout=60000)
        
        # Wait a bit for dynamic content
        time.sleep(5)
        
        # Try to scroll down to trigger lazy loading
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        time.sleep(2)
        
        # Save text content
        text = page.locator("body").inner_text()
        with open("wb_debug.txt", "w", encoding="utf-8") as f:
            f.write(text)
        print(f"Saved text to wb_debug.txt")
        
        # Save screenshot
        page.screenshot(path="wb_debug.png")
        print(f"Saved screenshot to wb_debug.png")
        
        content = page.content()
        with open(output_file, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Saved HTML to {output_file}")
        browser.close()

if __name__ == "__main__":
    url = "https://www.wildberries.ru/catalog/195676297/detail.aspx"
    dump_page(url, "wb_debug.html")
