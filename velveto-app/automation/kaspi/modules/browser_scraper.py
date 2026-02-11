from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.service import Service
import json
import sys
import os
import time

# Add parent directory to path to import config
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import config

def get_driver():
    chrome_options = Options()
    chrome_options.add_argument("--headless")
    chrome_options.add_argument("--no-sandbox")
    chrome_options.add_argument("--disable-dev-shm-usage")
    chrome_options.add_argument(f"user-agent={config.USER_AGENT}")
    
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=chrome_options)
    return driver

def scrape_product_selenium(url):
    driver = get_driver()
    product_data = {
        "title": "",
        "description": "",
        "images": [],
        "attributes": {},
        "category_id": None,
        "source_url": url
    }
    
    try:
        print(f"Scraping {url}...")
        driver.get(url)
        
        # Wait for title to ensure page load
        try:
            WebDriverWait(driver, 15).until(
                EC.presence_of_element_located((By.TAG_NAME, "h1"))
            )
        except:
            print("Timeout waiting for h1")

        # 0. Close City Dialog / Popups
        try:
            # Try to find close button for dialog
            close_btns = driver.find_elements(By.CSS_SELECTOR, ".dialog__close, .modal__close, .close-button")
            for btn in close_btns:
                if btn.is_displayed():
                    print("Closing dialog...")
                    btn.click()
                    time.sleep(1)
        except Exception as e:
            print(f"Error closing dialog: {e}")

        # Scroll down
        driver.execute_script("window.scrollTo(0, 300);")
        time.sleep(1)
        
        # 1. Title
        try:
            h1 = driver.find_element(By.TAG_NAME, "h1")
            product_data["title"] = h1.text.strip()
        except Exception as e:
            print(f"Error getting title: {e}")
            
        # 2. Description
        try:
            # Check for "Show more" description
            try:
                more_btns = driver.find_elements(By.CSS_SELECTOR, ".description__more, .item__description-more")
                for btn in more_btns:
                    if btn.is_displayed():
                        driver.execute_script("arguments[0].click();", btn)
                        time.sleep(1)
            except:
                pass

            desc_selectors = [
                ".item__description-text",
                ".description__text",
                "[class*='description']",
                ".product-description"
            ]
            for sel in desc_selectors:
                elems = driver.find_elements(By.CSS_SELECTOR, sel)
                if elems:
                    text = elems[0].text.strip()
                    if len(text) > 10:
                        product_data["description"] = text
                        break
        except Exception as e:
            print(f"Error getting description: {e}")
            
        # 3. Images
        try:
            img_selectors = [
                ".item__slider-pic",
                ".gallery__image",
                ".item__main-img",
                "img[src*='gallery-large']"
            ]
            found_images = set()
            for sel in img_selectors:
                imgs = driver.find_elements(By.CSS_SELECTOR, sel)
                for img in imgs:
                    src = img.get_attribute("src")
                    if src and "http" in src:
                        large_src = src.replace("small", "large").replace("medium", "large")
                        if large_src not in found_images:
                            product_data["images"].append(large_src)
                            found_images.add(large_src)
        except Exception as e:
            print(f"Error getting images: {e}")
            
        # 4. Attributes
        try:
            # Click "Specifications" tab if it exists
            try:
                tabs = driver.find_elements(By.XPATH, "//*[contains(text(), 'Характеристики')]")
                for tab in tabs:
                    if tab.is_displayed():
                        print("Clicking Specifications tab...")
                        driver.execute_script("arguments[0].click();", tab)
                        time.sleep(2)
                        break
            except:
                pass

            # Strategy 1: Definition lists (dl/dt/dd)
            dls = driver.find_elements(By.TAG_NAME, "dl")
            for dl in dls:
                dts = dl.find_elements(By.TAG_NAME, "dt")
                dds = dl.find_elements(By.TAG_NAME, "dd")
                if len(dts) == len(dds):
                    for i in range(len(dts)):
                        key = dts[i].text.strip()
                        val = dds[i].text.strip()
                        if key and val:
                            product_data["attributes"][key] = val
                            
            # Strategy 2: Specific Kaspi classes
            if not product_data["attributes"]:
                specs = driver.find_elements(By.CSS_SELECTOR, ".specifications-list__item")
                for spec in specs:
                    try:
                        text = spec.text.split("\n")
                        if len(text) >= 2:
                            key = text[0].strip()
                            val = text[1].strip()
                            product_data["attributes"][key] = val
                        else:
                            key_elem = spec.find_element(By.CSS_SELECTOR, "[class*='term']")
                            val_elem = spec.find_element(By.CSS_SELECTOR, "[class*='definition']")
                            product_data["attributes"][key_elem.text.strip()] = val_elem.text.strip()
                    except:
                        continue

        except Exception as e:
            print(f"Error getting attributes: {e}")

        return product_data
        
    except Exception as e:
        print(f"Error scraping: {e}")
        return None
    finally:
        driver.quit()

if __name__ == "__main__":
    url = "https://kaspi.kz/shop/p/panama-vel01-razmer-universal-nyi-seryi-150510865/?c=750000000"
    if len(sys.argv) > 1:
        url = sys.argv[1]
        
    data = scrape_product_selenium(url)
    if data:
        print(json.dumps(data, indent=2, ensure_ascii=False))
    else:
        print("FAILED_TO_SCRAPE")
