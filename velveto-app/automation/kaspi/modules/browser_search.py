from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.service import Service
import time
import sys
import os

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

def find_product_url_selenium(article):
    driver = get_driver()
    try:
        search_url = config.KASPI_SEARCH_URL.format(article)
        print(f"Opening {search_url}...")
        driver.get(search_url)
        
        # Wait for results to load
        try:
            # Wait for item card
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "a.item-card__name-link"))
            )
        except:
            print("Timeout waiting for results. Checking page source...")
            # print(driver.page_source[:500])
            
        # Find first product link
        links = driver.find_elements(By.CSS_SELECTOR, "a.item-card__name-link")
        if links:
            return links[0].get_attribute("href")
            
        # Try alternative selector (image link)
        links = driver.find_elements(By.CSS_SELECTOR, "a.item-card__image-wrapper")
        if links:
            return links[0].get_attribute("href")

        print("No products found.")
        return None
        
    except Exception as e:
        print(f"Error: {e}")
        return None
    finally:
        driver.quit()

if __name__ == "__main__":
    article = "150510865"
    if len(sys.argv) > 1:
        article = sys.argv[1]
        
    url = find_product_url_selenium(article)
    if url:
        print(f"FOUND_URL: {url}")
    else:
        print("NOT_FOUND")
