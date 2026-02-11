import requests
import sys

url = "https://kaspi.kz/shop/p/-150510865/"
headers = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}

try:
    print(f"Checking {url}...")
    response = requests.get(url, headers=headers, allow_redirects=True)
    print(f"Status: {response.status_code}")
    print(f"Final URL: {response.url}")
except Exception as e:
    print(f"Error: {e}")
