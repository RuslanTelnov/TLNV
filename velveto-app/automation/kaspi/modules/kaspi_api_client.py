import requests
import json
import time

class KaspiApiClient:
    def __init__(self, token):
        self.token = token
        self.base_url = "https://kaspi.kz/shop/api"
        self.headers = {
            "Content-Type": "text/plain",
            "X-Auth-Token": self.token,
            "Accept": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }

    def _get(self, endpoint, params=None):
        url = f"{self.base_url}{endpoint}"
        response = requests.get(url, headers=self.headers, params=params)
        response.raise_for_status()
        return response.json()

    def _post(self, endpoint, data):
        url = f"{self.base_url}{endpoint}"
        # Kaspi API expects text/plain content type even for JSON body
        response = requests.post(url, headers=self.headers, data=json.dumps(data))
        response.raise_for_status()
        return response.json()

    def get_categories(self):
        """Fetch all categories"""
        return self._get("/products/classification/categories")

    def get_attributes(self, category_code):
        """Fetch attributes for a specific category"""
        return self._get("/products/classification/attributes", params={"c": category_code})

    def get_attribute_values(self, category_code, attribute_code):
        """Fetch possible values for a specific attribute"""
        return self._get("/products/classification/attribute/values", 
                         params={"c": category_code, "a": attribute_code})

    def import_products(self, products):
        """
        Import products to Kaspi
        items: list of dictionaries conforming to Kaspi product schema
        """
        return self._post("/products/import", products)

    def get_import_result(self, upload_id):
        """Check the status of an import"""
        return self._get("/products/import/result", params={"i": upload_id})
