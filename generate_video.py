import subprocess
import os
import sys
import argparse
import requests
import io
from PIL import Image, ImageDraw, ImageFont
from dotenv import load_dotenv

# Path to the static ffmpeg discovered in the project
FFMPEG_PATH = "/home/wik/antigravity/scratch/moysklad-automation/ffmpeg-7.0.2-amd64-static/ffmpeg"
# System font for Pillow
FONT_PATH = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"

def get_ai_slogan(product_name):
    """Uses Gemini to generate a short, impactful marketing slogan."""
    load_dotenv('.env')
    load_dotenv('temp_tlnv_parser/velveto-app/.env.local')
    api_key = os.environ.get("OPENAI_API_KEY") 
    
    if not api_key:
        return "НОВИНКА"
        
    try:
        # Import inside to handle environment issues
        import google.generativeai as genai
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-1.5-flash')
        prompt = f"Придумай 1 короткую, взрывную рекламную фразу для товара: '{product_name}'. Максимум 3 слова. Без кавычек. На русском."
        response = model.generate_content(prompt)
        return response.text.strip().upper()
    except Exception as e:
        print(f"⚠️ AI Slogan error or module missing: {e}")
        # Fallback to a generic slogan
        return "ХИТ ПРОДАЖ"

def create_frame_with_text(image_path, text, resolution=(1080, 1440)):
    """Creates an image with the given text overlay using Pillow."""
    try:
        if image_path.startswith('http'):
            # Check for MoySklad credentials if needed
            headers = {}
            if "api.moysklad.ru" in image_path:
                load_dotenv('.env')
                load_dotenv('temp_tlnv_parser/velveto-app/.env.local')
                login = os.environ.get('MOYSKLAD_LOGIN')
                password = os.environ.get('MOYSKLAD_PASSWORD')
                if login and password:
                    import base64
                    auth = base64.b64encode(f'{login}:{password}'.encode()).decode()
                    headers['Authorization'] = f'Basic {auth}'
            
            resp = requests.get(image_path, headers=headers, timeout=10)
            img = Image.open(io.BytesIO(resp.content)).convert('RGB')
        else:
            img = Image.open(image_path).convert('RGB')
            
        # Target aspect ratio 3:4
        target_w, target_h = resolution
        img_aspect = img.width / img.height
        target_aspect = target_w / target_h
        
        if img_aspect > target_aspect:
            # Image is wider than 3:4, scale by height
            new_h = target_h
            new_w = int(new_h * img_aspect)
        else:
            # Image is taller than 3:4, scale by width
            new_w = target_w
            new_h = int(new_w / img_aspect)
            
        img = img.resize((new_w, new_h), Image.LANCZOS)
        
        # Crop/Center to 1080x1440
        left = (new_w - target_w) / 2
        top = (new_h - target_h) / 2
        img = img.crop((left, top, left + target_w, top + target_h))
        
        # Draw Text
        draw = ImageDraw.Draw(img)
        try:
            font = ImageFont.truetype(FONT_PATH, 80)
        except:
            font = ImageFont.load_default()
            
        # Get text size and position
        bbox = draw.textbbox((0, 0), text, font=font)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        
        tx = (target_w - tw) / 2
        ty = target_h - 250
        
        # Draw background bubble for text
        padding = 30
        draw.rectangle(
            [tx - padding, ty - padding, tx + tw + padding, ty + th + padding], 
            fill=(0, 0, 0, 180) # Semi-transparent black
        )
        
        draw.text((tx, ty), text, font=font, fill="white")
        
        frame_path = "temp_frame.png"
        img.save(frame_path)
        return frame_path
    except Exception as e:
        print(f"❌ Frame creation error: {e}")
        return None

def generate_video(image_input, output_path, text=None, product_name=None, duration=5):
    """
    Combines Pillow for text processing and FFmpeg for zoom animation.
    """
    if not text and product_name:
        text = get_ai_slogan(product_name)
    elif not text:
        text = "ЛУЧШИЙ ВЫБОР"

    print(f"🎨 Rendering frame with text: '{text}'...")
    frame_path = create_frame_with_text(image_input, text)
    
    if not frame_path:
        return False

    # FFmpeg zoompan filter (Zooming in)
    # Since we already have the base frame at the right res, we just animate it.
    width, height = 1080, 1440
    
    # Simple zoom filter
    vf = f"zoompan=z='min(zoom+0.0006,1.1)':d={duration*25}:s={width}x{height}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)'"
    
    cmd = [
        FFMPEG_PATH,
        "-y",
        "-loop", "1", "-t", str(duration),
        "-i", frame_path,
        "-vf", vf,
        "-c:v", "libx264",
        "-pix_fmt", "yuv420p",
        "-r", "25",
        output_path
    ]

    print(f"🎬 Running FFmpeg for Ken Burns effect...")
    try:
        subprocess.run(cmd, capture_output=True, text=True, check=True)
        print(f"✅ Video created: {output_path}")
        if os.path.exists(frame_path): os.remove(frame_path)
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ FFmpeg error!")
        print(e.stderr)
        return False

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--image", help="Image path or URL")
    parser.add_argument("--product", help="Product name for AI slogan")
    parser.add_argument("--text", help="Direct slogan text")
    parser.add_argument("--output", default="product_video.mp4")
    parser.add_argument("--test", action="store_true")
    
    args = parser.parse_args()
    
    if args.test:
        # Use a pink placeholder
        img = Image.new('RGB', (1000, 1000), color=(244, 114, 182))
        img.save("test_input.png")
        generate_video("test_input.png", "test_video.mp4", text="VELVETO TEST")
        os.remove("test_input.png")
    elif args.image:
        generate_video(args.image, args.output, text=args.text, product_name=args.product)
    else:
        print("Usage: python3 generate_video.py --image <path> [--product <name>]")
