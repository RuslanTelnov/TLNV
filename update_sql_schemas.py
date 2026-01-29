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

def update_sql(filepath):
    if not os.path.exists(filepath):
        print(f"Skipping {filepath} (not found)")
        return
        
    print(f"Updating {filepath}...")
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Replace public. with "Parser".
    new_content = content.replace("public.", '"Parser".')
    new_content = new_content.replace("PUBLIC.", '"Parser".')
    
    # Add "Parser". to table names that don't have it (heuristic)
    # Target: CREATE TABLE, ALTER TABLE, DROP TABLE, INSERT INTO, UPDATE, FROM, JOIN, ON (policies)
    
    patterns = [
        (r'(?i)CREATE\s+TABLE\s+(IF\s+NOT\s+EXISTS\s+)?(?!"Parser"\.)([a-z_][a-z0-9_]*)', r'CREATE TABLE \1"Parser".\2'),
        (r'(?i)ALTER\s+TABLE\s+(?!"Parser"\.)([a-z_][a-z0-9_]*)', r'ALTER TABLE "Parser".\1'),
        (r'(?i)DROP\s+TABLE\s+(IF\s+EXISTS\s+)?(?!"Parser"\.)([a-z_][a-z0-9_]*)', r'DROP TABLE \1"Parser".\2'),
        (r'(?i)INSERT\s+INTO\s+(?!"Parser"\.)([a-z_][a-z0-9_]*)', r'INSERT INTO "Parser".\1'),
        (r'(?i)UPDATE\s+(?!"Parser"\.)([a-z_][a-z0-9_]*)', r'UPDATE "Parser".\1'),
        (r'(?i)FROM\s+(?!"Parser"\.)([a-z_][a-z0-9_]*)', r'FROM "Parser".\1'),
        (r'(?i)JOIN\s+(?!"Parser"\.)([a-z_][a-z0-9_]*)', r'JOIN "Parser".\1'),
        (r'(?i)ON\s+(?!"Parser"\.)([a-z_][a-z0-9_]*)', r'ON "Parser".\1'),
        (r'(?i)REFERENCES\s+(?!"Parser"\.)([a-z_][a-z0-9_]*)', r'REFERENCES "Parser".\1')
    ]
    
    for pattern, replacement in patterns:
        new_content = re.sub(pattern, replacement, new_content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)

if __name__ == "__main__":
    for f in files:
        update_sql(f)
    print("Done!")
