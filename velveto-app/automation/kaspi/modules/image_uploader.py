import os
import requests
import io
from PIL import Image
import os
import requests
import io
import time
from PIL import Image
from supabase import create_client

# Add parent directory to path to import config
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import config

class ImageUploader:
    def __init__(self):
        # Initialize Supabase client
        self.url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
        self.key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
        
        if not self.url or not self.key:
            # Try loading from .env.local relative to this script if env vars are missing
            from dotenv import load_dotenv
            env_path = os.path.join(os.path.dirname(__file__), '../../../.env.local')
            load_dotenv(env_path)
            self.url = os.getenv("NEXT_PUBLIC_SUPABASE_URL")
            self.key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") or os.getenv("NEXT_PUBLIC_SUPABASE_ANON_KEY")

        if not self.url or not self.key:
            raise ValueError("Supabase credentials not found")

        self.supabase = create_client(self.url, self.key)
        self.bucket_name = "kaspi-images"

    def upload_image_from_url(self, image_url: str, sku: str, index: int) -> str:
        """
        Downloads image from URL and uploads to Supabase Storage.
        Returns public URL.
        """
        try:
            print(f"⬇️ Downloading image: {image_url}")
            response = requests.get(image_url, timeout=10)
            response.raise_for_status()
            content = response.content
            
            # Convert to JPEG
            image = Image.open(io.BytesIO(content))
            image = image.convert("RGB")
            
            output = io.BytesIO()
            image.save(output, format="JPEG", quality=90)
            jpeg_content = output.getvalue()
            
            # Create unique filename: sku/sku_index_timestamp.jpg
            timestamp = int(time.time())
            filename = f"{sku}/{sku}_{index}_{timestamp}.jpg"
            content_type = "image/jpeg"
            
            # Upload to Supabase
            print(f"⬆️ Uploading to Supabase: {self.bucket_name}/{filename}")
            
            res = self.supabase.storage.from_(self.bucket_name).upload(
                path=filename,
                file=jpeg_content,
                file_options={"content-type": content_type, "upsert": "true"}
            )
            
            # Get Public URL
            public_url = self.supabase.storage.from_(self.bucket_name).get_public_url(filename)
            print(f"✅ Image uploaded: {public_url}")
            return public_url
            
        except Exception as e:
            print(f"❌ Failed to upload image {image_url}: {e}")
            return None

if __name__ == "__main__":
    # Test
    uploader = ImageUploader()
    # Dummy URL (WB logo or similar)
    test_url = "https://basket-31.wbbasket.ru/vol6192/part619295/619295922/images/big/1.webp" 
    url = uploader.upload_image_from_url(test_url, "TEST_SKU_REAL", 1)
    print(f"Result: {url}")
