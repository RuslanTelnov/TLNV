
import json
import requests
import sys
import os

# Manual Config
TOKEN = "dutmsmqJIEi4CpuX2PNPDLbNcdpiRwNpKc3mwggACq0="
URL = "https://kaspi.kz/shop/api/products/import"
SKU = "TEST-SAFE-002"
BARCODE = "2019999999999"

payload = {
    "sku": SKU,
    "title": "Мягкая игрушка Синий Медведь 35 см",
    "description": "Мягкая игрушка из текстиля, высота 35 см. Безопасные материалы. Цвет синий.",
    "brand": "OEM",
    "category": "Master - Stuffed toys",
    "attributes": [
        {"code": "Stuffed toys*Type", "value": "Мягкая игрушка"},
        {"code": "Stuffed toys*Height", "value": 35},
        {"code": "Stuffed toys*Filler", "value": "Синтепон"},
        {"code": "Stuffed toys*Character", "value": "Медведь"}, # Safe generic
        {"code": "Stuffed toys*View", "value": "Животные"},
        {"code": "Toys*Age", "value": "От 3 лет"},
        {"code": "Toys*Gender", "value": "Унисекс"},
        {"code": "Toys*Color", "value": "Синий"},
        {"code": "Toys*Material", "value": "Текстиль"}
    ],
    "images": [
        {"url": "https://ir.ozone.ru/s3/multimedia-q/wc1000/608707482.jpg"} # Use a real image URL that is accessible
    ],
    "barcode": BARCODE,
    "model": "BlueBear-35"
}

def send_safe_payload():
    headers = {
        "Content-Type": "text/plain",
        "Accept": "application/json",
        "X-Auth-Token": TOKEN,
        "User-Agent": "Mozilla/5.0"
    }
    
    body = json.dumps([payload], ensure_ascii=False)
    
    print(f"Sending SAFE payload for {SKU}...")
    try:
        resp = requests.post(URL, data=body.encode('utf-8'), headers=headers, timeout=30)
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    send_safe_payload()
