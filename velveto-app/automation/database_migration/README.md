# Database Migration Project

This directory contains the exported data from the old Supabase database and scripts to help migrate it to a new database.

## Contents

1.  **`products_export.json`**: Contains 642 product records from MoySklad.
2.  **`wb_search_results_export.json`**: Contains 190 search results from Wildberries.
3.  **`wb_top_products_export.json`**: Contains 37 top products data.
4.  **`export_db.py`**: The script used to export these files (for reference).
5.  **`import_db_template.py`**: A template script to import these JSON files into your new database.

## How to Import

1.  **Set up your new database** (Supabase or PostgreSQL).
2.  **Create the tables** in the new database. You can use the schema inferred from the JSON files.
3.  **Configure credentials**:
    *   Open `import_db_template.py`.
    *   Fill in your `NEW_DB_URL` and `NEW_DB_KEY` (or connection string).
4.  **Run the import**:
    ```bash
    python3 import_db_template.py
    ```
