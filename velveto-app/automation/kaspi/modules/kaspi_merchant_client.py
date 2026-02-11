import requests
import json
import time

class KaspiMerchantApiClient:
    def __init__(self, token):
        self.token = token
        self.base_url = "https://kaspi.kz/shop/api/v2"
        self.headers = {
            "Content-Type": "application/vnd.api+json",
            "X-Auth-Token": self.token,
            "Accept": "application/vnd.api+json",
            "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }

    def _get(self, endpoint, params=None):
        url = f"{self.base_url}{endpoint}"
        response = requests.get(url, headers=self.headers, params=params)
        response.raise_for_status()
        return response.json()

    def get_orders(self, start_date_ms, end_date_ms, status=None, page_number=0, page_size=20):
        """
        Fetch orders from Kaspi Merchant API.
        start_date_ms, end_date_ms: timestamps in milliseconds
        """
        params = {
            "filter[orders][creationDate][$ge]": start_date_ms,
            "filter[orders][creationDate][$le]": end_date_ms,
            "page[number]": page_number,
            "page[size]": page_size
        }
        if status:
            params["filter[orders][status]"] = status
            
        return self._get("/orders", params=params)

    def get_order_entries(self, order_id):
        """Fetch items for a specific order"""
        return self._get(f"/orders/{order_id}/entries")

    def get_points_of_service(self):
        """Fetch points of service (warehouses)"""
        return self._get("/pointsofservice")
