import requests
import os
from dotenv import load_dotenv

load_dotenv('moysklad-web/.env.local')

login = os.getenv('MOYSKLAD_LOGIN')
password = os.getenv('MOYSKLAD_PASSWORD')
product_id = '8ba240e5-5bf4-11f0-0a80-1ac900460b68'

url = f"https://api.moysklad.ru/api/remap/1.2/entity/product/{product_id}/images"

response = requests.get(url, auth=(login, password))

if response.status_code == 200:
    data = response.json()
    images = data.get('rows', [])
    if images:
        for img in images:
            print(f"Found image: {img.get('filename')}")
            # Print all keys to see available sizes
            print(f"Keys: {img.keys()}")
            if 'miniature' in img: print(f"Miniature: {img['miniature']['href']}")
            if 'tiny' in img: print(f"Tiny: {img['tiny']['href']}")
            # MoySklad also has a direct download link usually in the 'meta' or 'downloadHref'
            if 'downloadHref' in img: print(f"Download: {img['downloadHref']}")
    else:
        print("No images found for this product in MoySklad.")
else:
    print(f"Failed to fetch images from MoySklad: {response.status_code}")
    print(response.text)
