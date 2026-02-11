import os

# Kaspi Configuration
KASPI_BASE_URL = "https://kaspi.kz"
KASPI_SEARCH_URL = "https://kaspi.kz/shop/search/?text={}"
KASPI_MERCHANT_API_URL = "https://kaspi.kz/shop/api/v2"
KASPI_CONTENT_API_URL = "https://kaspi.kz/shop/api"

# API Token (Load from env or set here temporarily)
KASPI_API_TOKEN = os.getenv("KASPI_API_TOKEN", "dutmsmqJIEi4CpuX2PNPDLbNcdpiRwNpKc3mwggACq0=")

# User Agent for scraping
USER_AGENT = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

# Data Directories
DATA_DIR = "data"
IMAGES_DIR = os.path.join(DATA_DIR, "images")

if not os.path.exists(IMAGES_DIR):
    os.makedirs(IMAGES_DIR)
