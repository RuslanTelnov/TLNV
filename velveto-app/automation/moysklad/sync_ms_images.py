import os
import requests
import base64
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

# Supabase settings
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

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

def get_ms_images(ms_id):
    """Fetch images for a product from MoySklad"""
    url = f"{BASE_URL}/entity/product/{ms_id}/images"
    try:
        resp = requests.get(url, headers=HEADERS)
        if resp.status_code == 200:
            rows = resp.json().get('rows', [])
            if rows:
                # Return the download href of the first image
                return rows[0]['meta']['downloadHref'], rows[0]['filename']
    except Exception as e:
        print(f"Error fetching images for {ms_id}: {e}")
    return None, None

def download_image(url):
    """Download image content from MoySklad"""
    try:
        resp = requests.get(url, headers=HEADERS)
        if resp.status_code == 200:
            return resp.content
    except Exception as e:
        print(f"Error downloading image: {e}")
    return None

def upload_to_supabase(content, filename):
    """Upload image to Supabase Storage"""
    bucket_name = "product-images"
    try:
        # Check if bucket exists, if not create (handling via exception usually)
        # Assuming bucket exists as per previous context
        
        path = f"ms_{filename}"
        supabase.storage.from_(bucket_name).upload(
            path=path,
            file=content,
            file_options={"content-type": "image/jpeg", "upsert": "true"}
        )
        return supabase.storage.from_(bucket_name).get_public_url(path)
    except Exception as e:
        print(f"Error uploading to Supabase: {e}")
    return None

def main():
    print("🚀 Starting MoySklad Image Sync...")
    
    # Fetch products from Supabase that have a moysklad_id
    # We'll limit to 20 for now to test
    response = supabase.schema('Parser').table('products').select("id, name, moysklad_id").not_.is_("moysklad_id", "null").limit(20).execute()
    
    products = response.data
    print(f"Found {len(products)} products to check.")
    
    updated_count = 0
    
    for p in products:
        ms_id = p['moysklad_id']
        print(f"Checking {p['name']} ({ms_id})...")
        
        img_url, filename = get_ms_images(ms_id)
        
        if img_url:
            print(f"   📸 Found image: {filename}")
            content = download_image(img_url)
            
            if content:
                public_url = upload_to_supabase(content, filename)
                if public_url:
                    # Update product in Supabase
                    supabase.schema('Parser').table('products').update({"image_url": public_url}).eq("id", p['id']).execute()
                    print(f"   ✅ Updated image_url: {public_url}")
                    updated_count += 1
                else:
                    print("   ❌ Failed to upload")
            else:
                print("   ❌ Failed to download content")
        else:
            print("   ⚪ No images found in MoySklad")
            
    print(f"🏁 Sync complete. Updated {updated_count} products.")

if __name__ == "__main__":
    main()
