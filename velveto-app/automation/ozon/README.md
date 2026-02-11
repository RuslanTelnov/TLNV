# Ozon Automation Project

This project automates the synchronization of orders from Ozon to MoySklad, ensuring stock is correctly reserved.

## Features
-   **Order Sync**: Fetches new orders from Ozon (FBS) and creates them in MoySklad.
-   **Stock Reservation**: Automatically reserves stock in "Основной склад" (Main Warehouse).
-   **Cancellation Sync**: Cancels orders in MoySklad if they are cancelled on Ozon, releasing the reserve.
-   **Continuous Loop**: Runs in the background to sync every minute.

## Setup

1.  **Environment Variables**:
    Ensure `.env.ozon` exists in `ozon-automation/` with:
    ```
    OZON_CLIENT_ID=...
    OZON_API_KEY=...
    ```
    Ensure `.env` exists in `moysklad-automation/` with MoySklad credentials.

2.  **Dependencies**:
    ```bash
    pip install -r requirements.txt
    ```

## Usage

### Start Synchronization
To start the background synchronization process:
```bash
./ozon-automation/start_project.sh
```
This will run the script in the background and write logs to `ozon-automation/sync.log`.

### Stop Synchronization
To stop the background process:
```bash
pkill -f run_sync_loop.py
```

### Manual Run
To run a single sync cycle manually:
```bash
python3 ozon-automation/sync_ozon_orders.py
```
