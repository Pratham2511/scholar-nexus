#!/bin/bash
# ScholarAI dev server watcher — restarts the Next.js dev server if it crashes.
# Designed to be fully detached (parent PID = 1) via setsid.
# Usage: setsid -f bash /home/z/my-project/scripts/watch-dev.sh

cd /home/z/my-project
LOG=/home/z/my-project/dev.log

while true; do
  # Check if port 3000 is listening
  if ss -tln 2>/dev/null | grep -q ":3000 "; then
    sleep 10
    continue
  fi

  echo "[$(date '+%Y-%m-%d %H:%M:%S')] Port 3000 not listening — starting dev server..." >> "$LOG"
  setsid -f bash -c 'cd /home/z/my-project && exec ./node_modules/.bin/next dev -p 3000' > /dev/null 2>&1
  # Wait for it to come up
  sleep 15
done
