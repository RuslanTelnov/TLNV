#!/bin/bash
pkill -f "python3.*worker.py"
echo "Killed existing worker."
sleep 2
nohup python3 worker.py > worker.log 2>&1 &
echo "Started new worker with PID $!"
