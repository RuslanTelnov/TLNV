import time
import subprocess
import sys
import os
from datetime import datetime

# Path to the sync script
SCRIPT_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "sync_ozon_orders.py")
INTERVAL = 60 # Seconds

def log(message):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {message}")

def run_sync():
    log("🔄 Starting sync cycle...")
    try:
        result = subprocess.run(
            [sys.executable, SCRIPT_PATH],
            capture_output=True,
            text=True,
            timeout=120
        )
        if result.returncode == 0:
            # Only log if there's interesting output (e.g. not just "Found 0 orders")
            if "Found 0 orders" not in result.stdout:
                log(result.stdout)
            else:
                log("✅ No new orders.")
        else:
            log(f"❌ Sync failed:\n{result.stderr}")
    except Exception as e:
        log(f"❌ Execution error: {e}")

def main():
    log(f"🚀 Ozon Sync Loop started. Interval: {INTERVAL}s")
    while True:
        run_sync()
        time.sleep(INTERVAL)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        log("🛑 Loop stopped by user.")
