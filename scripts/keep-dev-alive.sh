#!/bin/bash
# Keeps the Next.js dev server running — restarts if it crashes.
# Logs to /home/z/my-project/dev.log

cd /home/z/my-project

while true; do
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Starting Next.js dev server..." >> dev.log
  bun run dev >> dev.log 2>&1
  EXIT_CODE=$?
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Dev server exited with code $EXIT_CODE. Restarting in 3s..." >> dev.log
  sleep 3
done
