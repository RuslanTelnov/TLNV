import os
import re

files = [
    "add_code_column.sql",
    "add_kaspi_monitoring.sql",
    "client_configs.sql",
    "cloud_migration_final.sql",
    "create_parser_queue.sql",
    "create_products.sql",
    "create_sourcing_table.sql",
    "create_warehouse_tables.sql",
    "fix_rls.sql",
    "moysklad-web/automation/database_migration/add_conveyor_columns.sql",
    "moysklad-web/automation/moysklad/create_table.sql",
    "moysklad-web/automation/moysklad/create_wb_search_table.sql",
    "moysklad-web/check_schema.sql",
    "reload_schema.sql",
    "restore_tables.sql",
    "update_configs_table.sql"
]

def repair_sql(filepath):
    if not os.path.exists(filepath):
        return
        
    print(f"Repairing {filepath}...")
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Fix double schema
    content = content.replace('"Parser"."Parser".', '"Parser".')
    content = content.replace('"Parser". "Parser".', '"Parser".')
    
    # Fix "Parser".IF NOT EXISTS -> IF NOT EXISTS "Parser".
    content = re.sub(r'"Parser"\.IF\s+NOT\s+EXISTS\s+"Parser"\.', 'IF NOT EXISTS "Parser".', content, flags=re.IGNORECASE)
    content = re.sub(r'"Parser"\.\s+IF\s+NOT\s+EXISTS', 'IF NOT EXISTS', content, flags=re.IGNORECASE)

    # Fix incorrectly prefixed keywords (heuristic)
    keywords = ["true", "false", "null", "now", "uuid", "numeric", "text", "jsonb", "timestamptz", "string", "int", "integer", "boolean", "bigint", "serial", "float"]
    for kw in keywords:
        content = re.sub(rf'"Parser"\.{kw}\b', kw, content, flags=re.IGNORECASE)
        content = re.sub(rf'"Parser"\s+{kw}\b', kw, content, flags=re.IGNORECASE)

    # Specific fixes for messed up ON policies
    content = re.sub(r'ON\s+"Parser"\.true\b', 'ON true', content, flags=re.IGNORECASE)
    content = re.sub(r'ON\s+"Parser"\.false\b', 'ON false', content, flags=re.IGNORECASE)
    
    # Fix CREATE TABLE messed up line
    content = re.sub(r'CREATE\s+TABLE\s+"Parser"\.IF\s+NOT\s+EXISTS\s+"Parser"\.', 'CREATE TABLE IF NOT EXISTS "Parser".', content, flags=re.IGNORECASE)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

if __name__ == "__main__":
    for f in files:
        repair_sql(f)
    print("Repair done!")
