#!/bin/bash
# Weekly Performance Review Email Sender
# Sends performance stats for the past 7 days
set -e

echo "=== Weekly Performance Review Started ==="
echo "Time: $(date)"

# Step 1: Generate weekly performance report via API
echo "Step 1: Generating weekly performance report..."
cd /home/ubuntu/insurtech-tracker-web

REPORT=$(curl -s "http://localhost:3000/api/trpc/performance.weekly")
echo "Report generated successfully"

# Step 2: Send email using Python script
echo "Step 2: Sending weekly performance email..."
cd /home/ubuntu/insurtech-news-tracker

# Create a temporary Python script to send the weekly email
cat > send_weekly_email.py << 'PYTHON_SCRIPT'
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
import sys
import json

# Load environment variables
load_dotenv()

# Get the HTML report from stdin
report_json = sys.stdin.read()
report_data = json.loads(report_json)
html_content = report_data['result']['data']['json']['html']

# Email configuration
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SENDER_EMAIL = os.getenv("GMAIL_ADDRESS")
SENDER_PASSWORD = os.getenv("GMAIL_APP_PASSWORD")
RECIPIENT_EMAIL = "xingcheng4237@gmail.com"

# Create message
message = MIMEMultipart("alternative")
message["Subject"] = "📊 Weekly Performance Review - Insurtech News Tracker"
message["From"] = SENDER_EMAIL
message["To"] = RECIPIENT_EMAIL

# Attach HTML content
html_part = MIMEText(html_content, "html")
message.attach(html_part)

# Send email
try:
    with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
        server.starttls()
        server.login(SENDER_EMAIL, SENDER_PASSWORD)
        server.send_message(message)
    print("✅ Weekly performance email sent successfully!")
except Exception as e:
    print(f"❌ Failed to send email: {e}")
    sys.exit(1)
PYTHON_SCRIPT

# Run the Python script with the report data
echo "$REPORT" | python3 send_weekly_email.py

# Clean up
rm -f send_weekly_email.py

echo "=== Weekly Performance Review Complete ==="
echo "Email sent to: xingcheng4237@gmail.com"
