import time
import os
import sys
import subprocess
import threading
import concurrent.futures
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
automation_path = os.path.join(os.getcwd(), 'moysklad-web', 'automation', 'moysklad')
kaspi_path = os.path.join(os.getcwd(), 'moysklad-web', 'automation', 'kaspi')
sys.path.append(automation_path) 
sys.path.append(kaspi_path)

try:
    from process_conveyor import run_conveyor as run_conveyor_logic
except ImportError as e:
    print(f"⚠️ Warning: Could not import conveyor logic: {e}")
    def run_conveyor_logic(**kwargs):
        print("Conveyor logic not available due to import error.")

# Global state to track active jobs
active_jobs_lock = threading.Lock()
active_jobs = set()

def start_background_conveyor():
    """Starts the conveyor logic in a separate thread for real-time processing"""
    print("🚀 Starting Integrated Conveyor (Single Pass: False, Skip Parser: True)...")
    t = threading.Thread(target=run_conveyor_logic, kwargs={"single_pass": False, "skip_parser": True}, daemon=True)
    t.start()
    return t

def run_parser(job):
    job_id = job['id']
    mode = job['mode']
    query = job.get('query', '')
    
    with active_jobs_lock:
        active_jobs.add(job_id)
        
    print(f"🚀 Starting job {job_id}: {mode} '{query}'...")
    
    # Mark as processing
    supabase.table("parser_queue").update({"status": "processing"}).eq("id", job_id).execute()
    
    cmd = ["python3", "moysklad-web/automation/moysklad/parse_wb_top.py"]
    
    if mode == 'top':
        cmd.extend(["--mode", "top"])
    else:
        cmd.extend([query])
        
    cmd.extend(["--page", str(job.get('page', 1))])
    
    try:
        # Run with timeout to prevent ghost jobs
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=1200) # 20 min timeout
        
        if result.returncode == 0:
            print(f"✅ Job {job_id} completed!")
            supabase.table("parser_queue").update({
                "status": "completed",
                "log": f"Success. Log: {result.stdout[-2000:]}"
            }).eq("id", job_id).execute()
        else:
            print(f"❌ Job {job_id} failed!")
            supabase.table("parser_queue").update({
                "status": "error",
                "log": result.stderr[-2000:]
            }).eq("id", job_id).execute()
            
    except subprocess.TimeoutExpired:
        print(f"⌛ Job {job_id} timed out!")
        supabase.table("parser_queue").update({
            "status": "error",
            "log": "Timeout error (20 minutes)"
        }).eq("id", job_id).execute()
    except Exception as e:
        print(f"❌ Exception in job {job_id}: {e}")
        supabase.table("parser_queue").update({
            "status": "error",
            "log": str(e)
        }).eq("id", job_id).execute()
    finally:
        with active_jobs_lock:
            active_jobs.remove(job_id)

def fetch_next_job():
    """
    Fetches the next pending job with priority:
    1. mode='search' (user queries)
    2. others (top charts, etc)
    """
    # 1. Check for search jobs
    res = supabase.table("parser_queue").select("*").eq("status", "pending").eq("mode", "search").order("created_at", desc=False).limit(1).execute()
    if res.data:
        return res.data[0]
        
    # 2. Check for any other jobs (top)
    res = supabase.table("parser_queue").select("*").eq("status", "pending").order("created_at", desc=False).limit(1).execute()
    if res.data:
        return res.data[0]
        
    return None

def main():
    print("👷 Multi-Worker Parser started. Waiting for jobs...")
    
    # Start the "Instant" processor
    start_background_conveyor()
    
    # Use ThreadPoolExecutor for concurrent jobs
    # MAX_WORKERS = 2 allows one 'top' and one 'search' or two 'search'
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
        while True:
            try:
                # Check if we have slots available
                with active_jobs_lock:
                    slots_busy = len(active_jobs)
                
                if slots_busy < 2:
                    job = fetch_next_job()
                    if job:
                        # Double check if job is already being processed (race condition)
                        with active_jobs_lock:
                            if job['id'] in active_jobs:
                                continue
                        
                        executor.submit(run_parser, job)
                
                time.sleep(2)
                
            except Exception as e:
                print(f"\n⚠️ Main Loop Error: {e}")
                time.sleep(5)

if __name__ == "__main__":
    main()
