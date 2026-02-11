import requests
import base64

LOGIN = "shitov-11@bk.ru"
PASSWORD = "Diablo01"
BASE_URL = "https://api.moysklad.ru/api/remap/1.2"

# auth_str = f"{LOGIN}:{PASSWORD}"
# auth_b64 = base64.b64encode(auth_str.encode()).decode()
HEADERS = {
    # "Authorization": f"Basic {auth_b64}",
    "Content-Type": "application/json"
}

def list_attributes():
    url = f"{BASE_URL}/entity/product/metadata/attributes"
    try:
        resp = requests.get(url, headers=HEADERS, auth=(LOGIN, PASSWORD))
        # ...
        if resp.status_code == 200:
            rows = resp.json().get('rows', [])
            for row in rows:
                print(f"Name: {row['name']}, ID: {row['id']}, Type: {row['type']}")
        else:
            print(f"Error: {resp.status_code} - {resp.text}")
    except Exception as e:
        print(f"Exception: {e}")

if __name__ == "__main__":
    list_attributes()
