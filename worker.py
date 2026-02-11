import time
import os
import sys
import subprocess
import threading
import concurrent.futures
import random
from dotenv import load_dotenv
from supabase import create_client, Client

# Load env from local file
load_dotenv(os.path.join(os.getcwd(), "moysklad-web", ".env.local"))

url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not url or not key:
    print("❌ Error: Missing Supabase keys in moysklad-web/.env.local")
    exit(1)

supabase: Client = create_client(url, key)

# Fix paths to import modules
automation_path = os.path.join(os.getcwd(), 'moysklad-web', 'automation', 'moysklad')
kaspi_path = os.path.join(os.getcwd(), 'moysklad-web', 'automation', 'kaspi')
airtable_path = os.path.join(os.getcwd(), 'moysklad-web', 'automation', 'airtable')
notifications_path = os.path.join(os.getcwd(), 'automation', 'notifications')

sys.path.append(automation_path) 
sys.path.append(kaspi_path)
sys.path.append(airtable_path)
sys.path.append(notifications_path)

try:
    from telegram_bot import send_alert
except ImportError:
    print("⚠️ Warning: Could not import Telegram notifier")
    def send_alert(message):
        pass

try:
    from process_conveyor import run_conveyor as run_conveyor_logic
except ImportError as e:
    print(f"⚠️ Warning: Could not import conveyor logic: {e}")
    def run_conveyor_logic(**kwargs):
        print("Conveyor logic not available due to import error.")

try:
    from sync_to_airtable import sync_products as sync_to_airtable_func
except ImportError as e:
    print(f"⚠️ Warning: Could not import Airtable sync logic: {e}")
    def sync_to_airtable_func():
        # Fallback to subprocess if direct import fails
        try:
            subprocess.run(["python3", "moysklad-web/automation/airtable/sync_to_airtable.py"], check=False)
        except:
            pass

try:
    from discovery_keywords import KEYWORDS as DISCOVERY_KEYWORDS
except ImportError:
    # If discovery_keywords.py import fails, try to load it directly
    try:
        import importlib.util
        spec = importlib.util.spec_from_file_location("discovery_keywords", os.path.join(automation_path, "discovery_keywords.py"))
        dk_mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(dk_mod)
        DISCOVERY_KEYWORDS = dk_mod.KEYWORDS
    except:
        DISCOVERY_KEYWORDS = ["Хиты", "Игрушки", "Дом", "Кухня", "Спорт", "Авто", "Красота"]

# Global state to track active jobs
active_jobs_lock = threading.Lock()
active_jobs = set()

def start_background_services():
    """Starts background services (Kaspi Checker, Airtable Sync)"""
    def run_periodically():
        while True:
            # 1. Kaspi Status Checker
            try:
                # print("⏱️  Running Kaspi Status Checker...")
                subprocess.run(["python3", "moysklad-web/automation/kaspi/check_kaspi_status.py"], check=False)
            except Exception as e:
                print(f"⚠️ Kaspi Status Checker Error: {e}")
            
            # 2. Airtable Sync
            try:
                # print("⏱️  Running Periodic Airtable Sync...")
                sync_to_airtable_func()
            except Exception as e:
                print(f"⚠️ Airtable Sync Error: {e}")

            time.sleep(300) # Every 5 minutes
            
    print("🚀 Starting Background Services (Kaspi Checker + Airtable Sync)...")
    t = threading.Thread(target=run_periodically, daemon=True)
    t.start()
    return t

def check_autonomous_mode():
    """Checks if autonomous mode is enabled and adds a job if queue is empty"""
    try:
        # 1. Fetch config from Supabase
        is_auto = False
        try:
            # Query the whole row instead of specific column to avoid 400 if column is missing
            res = supabase.schema('Parser').table('client_configs').select('*').eq('id', 1).limit(1).execute()
            if res.data and len(res.data) > 0:
                is_auto = res.data[0].get('is_autonomous_mode', False)
        except Exception as e:
            # Column missing or other DB error, default to manual mode
            if not ("400" in str(e) or "is_autonomous_mode" in str(e)):
                print(f"[{time.strftime('%Y-%m-%d %H:%M:%S')}] ⚠️ Supabase Config Error: {e}", file=sys.stderr)
            
        if is_auto:
            # Check if queue count is low
            count_res = supabase.schema('Parser').table("parser_queue").select("id", count="exact").eq("status", "pending").execute()
            pending_count = count_res.count if count_res.count is not None else 0
            
            if pending_count < 2:
                # Add a random discovery job
                keyword = random.choice(DISCOVERY_KEYWORDS)
                print(f"🤖 Autonomous Mode: Adding job for '{keyword}'")
                supabase.schema('Parser').table("parser_queue").insert({
                    "mode": "search",
                    "query": keyword,
                    "status": "pending"
                }).execute()
                return True
    except Exception as e:
        print(f"⚠️ Autonomous Mode Check Error: {e}")
    return False

def run_parser(job):
    job_id = job['id']
    mode = job['mode']
    query = job.get('query', '')
    
    with active_jobs_lock:
        active_jobs.add(job_id)
        
    print(f"🚀 Starting job {job_id}: {mode} '{query}'...")
    
    # Mark as processing
    supabase.schema('Parser').table("parser_queue").update({"status": "processing"}).eq("id", job_id).execute()
    
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
            supabase.schema('Parser').table("parser_queue").update({
                "status": "completed",
                "log": f"Success. Log: {result.stdout[-2000:]}"
            }).eq("id", job_id).execute()
        else:
            print(f"❌ Job {job_id} failed!")
            supabase.schema('Parser').table("parser_queue").update({
                "status": "error",
                "log": result.stderr[-2000:]
            }).eq("id", job_id).execute()
            
    except subprocess.TimeoutExpired:
        print(f"⌛ Job {job_id} timed out!")
        supabase.schema('Parser').table("parser_queue").update({
            "status": "error",
            "log": "Timeout error (20 minutes)"
        }).eq("id", job_id).execute()
    except Exception as e:
        print(f"❌ Exception in job {job_id}: {e}")
        supabase.schema('Parser').table("parser_queue").update({
            "status": "error",
            "log": str(e)
        }).eq("id", job_id).execute()
    finally:
        with active_jobs_lock:
            active_jobs.remove(job_id)
        
        # Trigger immediate Airtable sync after job
        try:
            print(f"🔄 Job {job_id} finished, triggering Airtable sync...")
            sync_to_airtable_func()
        except Exception as e:
            print(f"⚠️ Error in post-job sync: {e}")

def fetch_next_job():
    # 1. Check for search jobs
    res = supabase.schema('Parser').table("parser_queue").select("*").eq("status", "pending").eq("mode", "search").order("created_at", desc=False).limit(1).execute()
    if res.data:
        return res.data[0]
        
    # 2. Check for any other jobs (top)
    res = supabase.schema('Parser').table("parser_queue").select("*").eq("status", "pending").order("created_at", desc=False).limit(1).execute()
    if res.data:
        return res.data[0]
        
    return None

def main():
    print("👷 Multi-Worker Parser started. Waiting for jobs...")
    
    # Start Services
    start_background_services()
    
    # Also start the Conveyor Logic (Stream Processor)
    print("🚀 Starting Integrated Conveyor Stream...")
    send_alert("🚀 <b>Worker Started</b>\nMulti-Worker Parser and Conveyor Stream are now online.")
    t_conveyor = threading.Thread(target=run_conveyor_logic, kwargs={"single_pass": False, "skip_parser": True}, daemon=True)
    t_conveyor.start()
    
    # Use ThreadPoolExecutor for concurrent jobs
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
        while True:
            try:
                # Check if we have slots available
                with active_jobs_lock:
                    slots_busy = len(active_jobs)
                
                job = None
                if slots_busy < 2:
                    job = fetch_next_job()
                    
                    if not job:
                        # If no job, try Autonomous Mode
                        if check_autonomous_mode():
                            job = fetch_next_job()

                    if job:
                        with active_jobs_lock:
                            if job['id'] in active_jobs:
                                continue
                        
                        executor.submit(run_parser, job)
                
                time.sleep(2)
                
            except Exception as e:
                error_msg = f"⚠️ <b>Main Loop Error</b>\n{str(e)}"
                print(f"\n{error_msg}")
                send_alert(error_msg)
                time.sleep(5)

if __name__ == "__main__":
    main()
