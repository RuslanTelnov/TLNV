
import json
import requests
import sys

# Manual Config
TOKEN = "dutmsmqJIEi4CpuX2PNPDLbNcdpiRwNpKc3mwggACq0="
URL = "https://kaspi.kz/shop/api/products/import"
SKU = "999472069784" # Pure numeric, distinct from WB ID
BARCODE = "2019999999999"

payload = {
    "sku": SKU,
    "title": "Мягкая игрушка Стич Тест Цифры",
    "description": "Тестовый товар для проверки загрузки с цифровым артикулом.",
    "brand": "Generic",
    "category": "Master - Stuffed toys",
    "attributes": [
        {"code": "Stuffed toys*Type", "value": "Мягкая игрушка"},
        {"code": "Stuffed toys*Height", "value": 35},
        {"code": "Stuffed toys*Filler", "value": "Синтепон"},
        {"code": "Stuffed toys*Character", "value": "Стич"},
        {"code": "Stuffed toys*View", "value": "Животные"},
        {"code": "Toys*Age", "value": "От 3 лет"},
        {"code": "Toys*Gender", "value": "Унисекс"},
        {"code": "Toys*Color", "value": "Синий"},
        {"code": "Toys*Material", "value": "Текстиль"}
    ],
    "images": [
        {"url": "https://ir.ozone.ru/s3/multimedia-q/wc1000/608707482.jpg"}
    ],
    "barcode": BARCODE,
    "model": "TestNumeric"
}

def send_numeric_test():
    headers = {
        "Content-Type": "text/plain",
        "Accept": "application/json",
        "X-Auth-Token": TOKEN,
        "User-Agent": "Mozilla/5.0"
    }
    
    body = json.dumps([payload], ensure_ascii=False)
    
    print(f"Sending NUMERIC SKU payload for {SKU}...")
    try:
        resp = requests.post(URL, data=body.encode('utf-8'), headers=headers, timeout=30)
        print(f"Status: {resp.status_code}")
        print(f"Response: {resp.text}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    send_numeric_test()
