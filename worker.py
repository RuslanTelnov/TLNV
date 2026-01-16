import time
import os
import sys
import subprocess
import threading
from dotenv import load_dotenv
from supabase import create_client, Client

# Load env from local file
load_dotenv(os.path.join(os.getcwd(), "moysklad-web", ".env.local"))

url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not url or not key:
    print("❌ Error: Missing Supabase keys in moysklad-web/.env.local")
    exit(1)

supabase: Client = create_client(url, key)

# Fix path to import conveyor logic
# We need to add the directory containing process_conveyor.py AND the root of the automation modules
automation_path = os.path.join(os.getcwd(), 'moysklad-web', 'automation', 'moysklad')
kaspi_path = os.path.join(os.getcwd(), 'moysklad-web', 'automation', 'kaspi')
sys.path.append(automation_path) 
sys.path.append(kaspi_path)

try:
    # Now that 'automation/moysklad' is in sys.path, we can import modules inside it directly
    from process_conveyor import run_conveyor as run_conveyor_logic
except ImportError as e:
    print(f"⚠️ Warning: Could not import conveyor logic: {e}")
    # Attempt to debug import error further
    try:
         import process_conveyor
    except ImportError as e2:
         print(f"Debug import: {e2}")

    def run_conveyor_logic(**kwargs):
        print("Conveyor logic not available due to import error.")

def start_background_conveyor():
    """Starts the conveyor logic in a separate thread for real-time processing"""
    print("🚀 Starting Background Conveyor Thread (Instant Processing)...")
    
    # Run loop forever (single_pass=False), but DON'T run parser inside it (skip_parser=True)
    # because the parser is managed by the main worker loop jobs.
    t = threading.Thread(target=run_conveyor_logic, kwargs={"single_pass": False, "skip_parser": True}, daemon=True)
    t.start()
    return t

def run_parser(job):
    print(f"🚀 Starting job {job['id']}: {job['mode']} {job.get('query', '')}...")
    
    # Mark as processing
    supabase.table("parser_queue").update({"status": "processing"}).eq("id", job['id']).execute()
    
    cmd = ["python3", "moysklad-web/automation/moysklad/parse_wb_top.py"]
    
    if job['mode'] == 'top':
        cmd.extend(["--mode", "top"])
    else:
        cmd.extend([job['query']])
        
    cmd.extend(["--page", str(job.get('page', 1))])
    
    try:
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            print(f"✅ Job {job['id']} completed!")
            print("--- Output ---")
            print(result.stdout)
            print("--------------")
            supabase.table("parser_queue").update({
                "status": "completed",
                "log": f"Success. Log: {result.stdout[-1000:]}"
            }).eq("id", job['id']).execute()
            
            # Note: We DON'T trigger manual conveyor anymore because the background thread handles it instantly!
            
        else:
            print(f"❌ Job {job['id']} failed!")
            print(result.stderr)
            supabase.table("parser_queue").update({
                "status": "error",
                "log": result.stderr[-1000:]
            }).eq("id", job['id']).execute()
            
    except Exception as e:
        print(f"❌ Exception: {e}")
        supabase.table("parser_queue").update({
            "status": "error",
            "log": str(e)
        }).eq("id", job['id']).execute()

def main():
    print("👷 Parser Worker started. Waiting for jobs...")
    
    # Start the "Instant" processor
    start_background_conveyor()
    
    while True:
        try:
            # Fetch pending jobs
            res = supabase.table("parser_queue").select("*").eq("status", "pending").order("created_at", desc=False).limit(1).execute()
            jobs = res.data
            
            if jobs:
                run_parser(jobs[0])
            else:
                # print(".", end="", flush=True)
                time.sleep(2)
                
        except Exception as e:
            print(f"\n⚠️ Loop Error: {e}")
            time.sleep(5)

if __name__ == "__main__":
    main()
