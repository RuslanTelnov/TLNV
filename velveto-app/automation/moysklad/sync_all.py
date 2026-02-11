import subprocess
import sys
import os
from datetime import datetime

def run_script(script_name):
    print(f"🚀 Starting {script_name}...")
    try:
        # Assuming scripts are in the same directory as this one
        script_path = os.path.join(os.path.dirname(__file__), script_name)
        result = subprocess.run([sys.executable, script_path], check=True, text=True)
        print(f"✅ {script_name} completed successfully.\n")
    except subprocess.CalledProcessError as e:
        print(f"❌ Error running {script_name}: {e}")
        # We continue to the next script even if one fails, but you might want to stop
        # sys.exit(1) 

def main():
    print(f"🔄 Starting Full Sync at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 50)

    # 0. Fetch Fresh Data from Wildberries
    run_script("wb_parser.py")

    # 1. Sync Prices and Stock from MoySklad to Supabase
    run_script("sync_ms_data.py")

    # 2. Sync Images from MoySklad to Supabase
    run_script("sync_ms_images.py")

    # 3. Export New WB Products to MoySklad (and then to Supabase)
    run_script("create_wb_products_in_ms.py")

    print("=" * 50)
    print("🏁 Full Sync Complete!")

if __name__ == "__main__":
    main()
