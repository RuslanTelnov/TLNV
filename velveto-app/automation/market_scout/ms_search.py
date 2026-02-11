import os
import requests
import base64
from dotenv import load_dotenv

# Load .env from moysklad-automation directory
env_path = os.path.join(os.path.dirname(__file__), '..', 'moysklad-automation', '.env')
load_dotenv(env_path)

# MoySklad settings
LOGIN = os.getenv("MOYSKLAD_LOGIN")
PASSWORD = os.getenv("MOYSKLAD_PASSWORD")
BASE_URL = "https://api.moysklad.ru/api/remap/1.2"

auth_str = f"{LOGIN}:{PASSWORD}"
auth_b64 = base64.b64encode(auth_str.encode()).decode()
HEADERS = {
    "Authorization": f"Basic {auth_b64}",
    "Content-Type": "application/json"
}

class MSSearch:
    def __init__(self):
        if not LOGIN or not PASSWORD:
            raise ValueError("MOYSKLAD_LOGIN and MOYSKLAD_PASSWORD must be set in .env")

    def search_product(self, name):
        """Search for a product by name in MoySklad"""
        url = f"{BASE_URL}/entity/product?search={name}"
        try:
            resp = requests.get(url, headers=HEADERS)
            if resp.status_code == 200:
                data = resp.json()
                rows = data.get('rows', [])
                if rows:
                    # Return the first match
                    return rows[0]
            else:
                print(f"MS Search Error: {resp.status_code}")
        except Exception as e:
            print(f"Error searching MS: {e}")
        return None

    def get_product_image(self, product_id):
        """Get the first image URL for a product"""
        url = f"{BASE_URL}/entity/product/{product_id}/images"
        try:
            resp = requests.get(url, headers=HEADERS)
            if resp.status_code == 200:
                rows = resp.json().get('rows', [])
                if rows:
                    # We need to download this because MS image links require auth
                    # So we will download it to a temp file and return the local path
                    meta = rows[0]['meta']
                    download_href = meta['downloadHref']
                    filename = rows[0]['filename']
                    return self._download_image(download_href, filename)
        except Exception as e:
            print(f"Error fetching image: {e}")
        return None

    def _download_image(self, url, filename):
        """Download image to local temp directory"""
        try:
            resp = requests.get(url, headers=HEADERS)
            if resp.status_code == 200:
                # Ensure temp dir exists
                temp_dir = os.path.join(os.path.dirname(__file__), '..', 'temp_images')
                os.makedirs(temp_dir, exist_ok=True)
                
                file_path = os.path.join(temp_dir, filename)
                with open(file_path, 'wb') as f:
                    f.write(resp.content)
                return os.path.abspath(file_path)
        except Exception as e:
            print(f"Error downloading image content: {e}")
        return None

if __name__ == "__main__":
    # Test
    ms = MSSearch()
    prod = ms.search_product("Панама")
    if prod:
        print(f"Found: {prod['name']} ({prod['id']})")
        img_path = ms.get_product_image(prod['id'])
        print(f"Image saved to: {img_path}")
    else:
        print("Product not found")
