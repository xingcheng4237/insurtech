#!/bin/bash
# Daily News Collection with Email Delivery
# This script triggers web collection and sends email

set -e

echo "=== Insurtech News Daily Collection Started ==="
echo "Time: $(date)"

# Step 1: Trigger web collection via API
echo "Step 1: Collecting news via web API..."
cd /home/ubuntu/insurtech-tracker-web

# Use curl to trigger the collection endpoint
RESULT=$(curl -s -X POST "http://localhost:3000/api/trpc/news.collect" \
  -H "Content-Type: application/json" \
  -d '{"json":null}')

echo "Collection result: $RESULT"

# Step 2: Get the latest report from database
echo "Step 2: Fetching latest report..."
REPORT=$(curl -s "http://localhost:3000/api/trpc/news.latest")

# Step 3: Send email using the original Python script with updated report
echo "Step 3: Sending email..."
cd /home/ubuntu/insurtech-news-tracker

# Run the Python email sender
source .env 2>/dev/null || true
python3 daily_tracker.py

echo "=== Daily Collection Complete ==="
echo "Email sent to: xingcheng4237@gmail.com"
echo "Web report available at: https://3000-ir5oynqa6i83aykh6yi0b-f7f87a53.manus-asia.computer/latest"
