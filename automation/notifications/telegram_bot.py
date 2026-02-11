import os
import requests
import sys
from dotenv import load_dotenv

# Ensure we load env from the correct place
# For automation scripts, they usually run from temp_tlnv_parser but might need moysklad-web/.env.local
load_dotenv()
load_dotenv('moysklad-web/.env.local')

class TelegramNotifier:
    def __init__(self):
        self.token = os.getenv("TELEGRAM_BOT_TOKEN")
        self.chat_id = os.getenv("TELEGRAM_CHAT_ID")
        
    def send_message(self, text):
        if not self.token or not self.chat_id:
            print("⚠️ Telegram Notification skipped: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID not set.", file=sys.stderr)
            return False
            
        url = f"https://api.telegram.org/bot{self.token}/sendMessage"
        payload = {
            "chat_id": self.chat_id,
            "text": text,
            "parse_mode": "HTML"
        }
        
        try:
            response = requests.post(url, json=payload, timeout=10)
            response.raise_for_status()
            return True
        except Exception as e:
            print(f"❌ Failed to send Telegram notification: {e}", file=sys.stderr)
            return False

def send_alert(message):
    notifier = TelegramNotifier()
    return notifier.send_message(message)

if __name__ == "__main__":
    # Test
    if send_alert("🚀 <b>System Test</b>: Telegram Notification module initialized."):
        print("✅ Test message sent!")
    else:
        print("❌ Failed to send test message.")
