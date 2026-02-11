import os
import requests
import base64
import json
from dotenv import load_dotenv

load_dotenv("moysklad-automation/.env")

# MoySklad
LOGIN = os.getenv("MOYSKLAD_LOGIN")
PASSWORD = os.getenv("MOYSKLAD_PASSWORD")

auth_str = f"{LOGIN}:{PASSWORD}"
auth_b64 = base64.b64encode(auth_str.encode()).decode()
HEADERS = {
    "Authorization": f"Basic {auth_b64}"
}

def download_images():
    print("⬇️  Downloading images for restock candidates...")
    
    with open("moysklad-automation/restock_candidates.json", "r", encoding="utf-8") as f:
        candidates = json.load(f)
        
    updated_candidates = []
    
    if not os.path.exists("moysklad-automation/images"):
        os.makedirs("moysklad-automation/images")
        
    for item in candidates:
        ms_id = item.get('ms_id')
        image_url = item.get('image_url')
        name = item.get('name')
        
        if not image_url:
            print(f"   ⚠️ No image for {name}")
            updated_candidates.append(item)
            continue
            
        # Check if already downloaded
        filename = f"{ms_id}.jpg"
        filepath = os.path.join("moysklad-automation/images", filename)
        
        if os.path.exists(filepath):
            # print(f"   ✅ Already exists: {name}")
            item['local_image_path'] = os.path.abspath(filepath)
            updated_candidates.append(item)
            continue
            
        try:
            # Download
            # Note: MoySklad image URLs might be redirects or require auth
            resp = requests.get(image_url, headers=HEADERS, stream=True)
            if resp.status_code == 200:
                with open(filepath, 'wb') as f:
                    for chunk in resp.iter_content(1024):
                        f.write(chunk)
                
                item['local_image_path'] = os.path.abspath(filepath)
                # print(f"   ✅ Downloaded: {name}")
            else:
                print(f"   ❌ Failed to download {name}: {resp.status_code}")
                
        except Exception as e:
            print(f"   ❌ Error downloading {name}: {e}")
            
        updated_candidates.append(item)
        
    # Save updated list
    with open("moysklad-automation/restock_candidates_with_images.json", "w", encoding="utf-8") as f:
        json.dump(updated_candidates, f, indent=2, ensure_ascii=False)
        
    print(f"✅ Processed {len(updated_candidates)} candidates.")

if __name__ == "__main__":
    download_images()
