
import requests
import os

TOKEN = "dutmsmqJIEi4CpuX2PNPDLbNcdpiRwNpKc3mwggACq0="
XML_FILE = "kaspi_upload_manual.xml"

def try_xml_upload():
    if not os.path.exists(XML_FILE):
        print("XML file not found!")
        return

    with open(XML_FILE, 'rb') as f:
        xml_data = f.read()

    headers = {
        "X-Auth-Token": TOKEN,
        "User-Agent": "Mozilla/5.0",
        "Content-Type": "application/xml",
        "Accept": "*/*"
    }

    # Attempt 1: POST to /products (RESTful)
    url_1 = "https://kaspi.kz/shop/api/products"
    print(f"Attempt 1: POST XML to {url_1}")
    try:
        resp = requests.post(url_1, data=xml_data, headers=headers, timeout=30)
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.text[:300]}")
    except Exception as e:
         print(f"Error: {e}")

    # Attempt 2: POST to /products/import (Maybe accepts XML?)
    url_2 = "https://kaspi.kz/shop/api/products/import"
    print(f"\nAttempt 2: POST XML to {url_2}")
    try:
        resp = requests.post(url_2, data=xml_data, headers=headers, timeout=30)
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.text[:300]}")
    except Exception as e:
         print(f"Error: {e}")

if __name__ == "__main__":
    try_xml_upload()
