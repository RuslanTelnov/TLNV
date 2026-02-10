import os
import requests
import base64
import argparse
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# MoySklad settings
LOGIN = os.getenv("MOYSKLAD_LOGIN")
PASSWORD = os.getenv("MOYSKLAD_PASSWORD")
BASE_URL = "https://api.moysklad.ru/api/remap/1.2"

if not LOGIN or not PASSWORD:
    print(json.dumps({"error": "Missing MoySklad credentials in .env"}))
    exit(1)

auth_str = f"{LOGIN}:{PASSWORD}"
auth_b64 = base64.b64encode(auth_str.encode()).decode()
HEADERS = {
    "Authorization": f"Basic {auth_b64}",
    "Content-Type": "application/json"
}

def get_or_create_store(name):
    """Get or create store in MoySklad"""
    url = f"{BASE_URL}/entity/store?filter=name={name}"
    try:
        resp = requests.get(url, headers=HEADERS)
        if resp.status_code == 200:
            rows = resp.json().get('rows', [])
            if rows:
                return rows[0]['meta']
        
        # Create if not found
        resp = requests.post(f"{BASE_URL}/entity/store", json={"name": name}, headers=HEADERS)
        if resp.status_code == 200:
            return resp.json()['meta']
    except Exception:
        return None
    return None

def get_or_create_group(name):
    """Get or create product folder in MoySklad"""
    url = f"{BASE_URL}/entity/productfolder?filter=name={name}"
    try:
        resp = requests.get(url, headers=HEADERS)
        if resp.status_code == 200:
            rows = resp.json().get('rows', [])
            if rows:
                return rows[0]['meta']
        
        # Create if not found
        resp = requests.post(f"{BASE_URL}/entity/productfolder", json={"name": name}, headers=HEADERS)
        if resp.status_code == 200:
            return resp.json()['meta']
    except Exception as e:
        return None
    return None

def get_price_type(name="Розничная цена"):
    """Get price type meta"""
    url = f"{BASE_URL}/context/companysettings/pricetype"
    try:
        resp = requests.get(url, headers=HEADERS)
        if resp.status_code == 200:
            for pt in resp.json():
                if pt['name'] == name:
                    return pt['meta']
            if len(resp.json()) > 0:
                return resp.json()[0]['meta']
    except Exception:
        pass
    return None

def get_organization():
    """Get first organization meta"""
    url = f"{BASE_URL}/entity/organization"
    try:
        resp = requests.get(url, headers=HEADERS)
        if resp.status_code == 200:
            rows = resp.json().get('rows', [])
            if rows:
                return rows[0]['meta']
    except Exception:
        pass
    return None

def create_enter(product_meta, store_meta, price):
    """Create Oprimodovanie (Enter) document"""
    org_meta = get_organization()
    if not org_meta or not store_meta:
        return None
        
    payload = {
        "organization": {"meta": org_meta},
        "store": {"meta": store_meta},
        "positions": [
            {
                "quantity": 1,
                "price": int(price) * 100,
                "assortment": {"meta": product_meta}
            }
        ]
    }
    
    try:
        resp = requests.post(f"{BASE_URL}/entity/enter", json=payload, headers=HEADERS)
        if resp.status_code == 200:
            return resp.json()['id']
    except Exception:
        pass
    return None

def create_product(name, article, price, image_urls=None):
    folder_meta = get_or_create_group("Parser WB")
    if not folder_meta:
        return {"error": "Failed to get target folder"}

    price_type_meta = get_price_type("Розничная цена")
    if not price_type_meta:
        return {"error": "Failed to get price type"}

    # Check if exists
    url = f"{BASE_URL}/entity/product?filter=externalCode={article}"
    ms_product_id = None
    product_meta = None
    
    try:
        resp = requests.get(url, headers=HEADERS)
        if resp.status_code == 200:
            rows = resp.json().get('rows', [])
            if rows:
                ms_product_id = rows[0]['id']
                product_meta = rows[0]['meta']
    except Exception as e:
        return {"error": f"Error checking existence: {str(e)}"}

    payload = {
        "name": name,
        "externalCode": article,
        "article": article,
        "productFolder": {"meta": folder_meta},
        "description": "Imported from WB Top Dashboard",
        "salePrices": [
            {
                "value": int(price) * 100, # Convert to cents
                "priceType": {"meta": price_type_meta}
            }
        ],
        "images": []
    }

    if image_urls:
        for i, img_url in enumerate(image_urls[:5]): # Limit to 5 images
            try:
                # Try curl_cffi first
                try:
                    from curl_cffi import requests as curl_requests
                    img_resp = curl_requests.get(img_url, timeout=10, impersonate="chrome")
                    image_content = img_resp.content
                except:
                    img_resp = requests.get(img_url, timeout=10)
                    image_content = img_resp.content
                
                if image_content:
                    try:
                        from PIL import Image
                        import io
                        img = Image.open(io.BytesIO(image_content))
                        if img.mode in ('RGBA', 'LA', 'P'):
                            rgb_img = Image.new('RGB', img.size, (255, 255, 255))
                            if img.mode == 'P':
                                img = img.convert('RGBA')
                            rgb_img.paste(img, mask=img.split()[-1] if img.mode in ('RGBA', 'LA') else None)
                            img = rgb_img
                        
                        img_byte_arr = io.BytesIO()
                        img.save(img_byte_arr, format='JPEG', quality=85)
                        image_content = img_byte_arr.getvalue()
                        
                        payload["images"].append({
                            "filename": f"image_{i+1}.jpg",
                            "content": base64.b64encode(image_content).decode()
                        })
                        print(f"✅ Image {i+1} downloaded and validated successfully")
                    except Exception as img_err:
                        print(f"⚠️ Image {i+1} validation failed: {img_err}")
                else:
                    print(f"⚠️ Failed to download image {i+1}: Empty content")
            except Exception as e:
                print(f"⚠️ Failed to download image {i+1}: {e}")

    try:
        if not ms_product_id:
            # Create
            resp = requests.post(f"{BASE_URL}/entity/product", json=payload, headers=HEADERS)
            if resp.status_code == 200:
                created_product = resp.json()
                ms_product_id = created_product['id']
                product_meta = created_product['meta']
                action = "created"
            else:
                return {"error": f"Error creating product: {resp.text}"}
        else:
            # Update
            if "images" in payload:
                del payload["images"] 
            
            resp = requests.put(f"{BASE_URL}/entity/product/{ms_product_id}", json=payload, headers=HEADERS)
            if resp.status_code == 200:
                action = "updated"
            else:
                return {"error": f"Error updating product: {resp.text}"}
        
        # --- OPRIMODOVANIE (ENTER) ---
        # REMOVED: Unconditional stocking here causes duplication. 
        # The conveyor script now handles stocking by checking global stock first.
        # store_meta = get_or_create_store("Склад ВБ")
        # enter_id = create_enter(product_meta, store_meta, price)
        
        return {
            "success": True, 
            "id": ms_product_id, 
            "action": action,
            "enter_id": None,
            "store": "Склад ВБ (Stocking skipped)"
        }

    except Exception as e:
        return {"error": f"Request failed: {str(e)}"}


def main():
    parser = argparse.ArgumentParser(description='Create product in MoySklad')
    parser.add_argument('--name', required=True, help='Product name')
    parser.add_argument('--article', required=True, help='Product article/ID')
    parser.add_argument('--price', required=True, type=float, help='Product price')
    parser.add_argument('--image_urls', nargs='+', help='Product image URLs')

    args = parser.parse_args()

    result = create_product(args.name, args.article, args.price, args.image_urls)
    
    print("JSON_START")
    print(json.dumps(result))
    print("JSON_END")

if __name__ == "__main__":
    main()
