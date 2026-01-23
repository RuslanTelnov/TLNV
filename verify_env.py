import os
from supabase import create_client

# Hardcoded values from user input and known URL
url = "https://jmughirkxcsiwfgdckbf.supabase.co"
key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImptdWdoaXJreGNzaXdmZ2Rja2JmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzMjYwODIsImV4cCI6MjA3OTkwMjA4Mn0.tMxdWYIsFDionp3qiudulhkWqUViu23KbNi-Fo5R0HQ"

print(f"Testing hardcoded key...")
print(f"URL: {url}")
print(f"KEY: {key}")

try:
    supabase = create_client(url, key)
    res = supabase.table("parser_queue").select("*").order("created_at", desc=True).limit(5).execute()
    print("✅ Connection successful!")
    print("Recent JOBS:")
    for job in res.data:
        print(f"ID: {job.get('id')} | Status: {job.get('status')} | Query: {job.get('query')} | Created: {job.get('created_at')}")
    
    # Check specific product
    res_prod = supabase.table("wb_search_results").select("*").eq("id", 198302948).execute()
    if res_prod.data:
        p = res_prod.data[0]
        print(f"Product: {p.get('name')}")
        print(f"Is Closed: {p.get('is_closed')}")
        print(f"Conveyor Status: {p.get('conveyor_status')}")
        print(f"Specs: {p.get('specs')}")
    else:
        print("Product 198302948 not found in DB.")
except Exception as e:
    print(f"❌ Connection failed: {e}")
