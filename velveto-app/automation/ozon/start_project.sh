#!/bin/bash
# Start the Ozon Sync Loop in the background

# Get the directory of this script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Define log file
LOG_FILE="$DIR/sync.log"

# Check if already running
if pgrep -f "run_sync_loop.py" > /dev/null; then
    echo "⚠️  Sync loop is already running."
    exit 1
fi

echo "🚀 Starting Ozon Sync Loop..."
nohup python3 "$DIR/run_sync_loop.py" > "$LOG_FILE" 2>&1 &

echo "✅ Sync loop started in background."
echo "📄 Logs are being written to: $LOG_FILE"
