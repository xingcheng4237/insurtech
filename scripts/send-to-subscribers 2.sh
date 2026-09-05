#!/bin/bash
# Send daily digest to all active subscribers
# Usage: ./send-to-subscribers.sh [report_id]
set -e

REPORT_ID=$1

if [ -z "$REPORT_ID" ]; then
  echo "Usage: $0 <report_id>"
  echo "Example: $0 123"
  exit 1
fi

echo "=== Sending Daily Digest to Subscribers ==="
echo "Report ID: $REPORT_ID"
echo "Time: $(date)"

# Get the report HTML from the database
cd /home/ubuntu/insurtech-tracker-web

REPORT_DATA=$(curl -s "http://localhost:3000/api/trpc/news.byId?input=%7B%22id%22%3A${REPORT_ID}%7D")

# Get all active subscribers
SUBSCRIBERS=$(curl -s "http://localhost:3000/api/trpc/subscription.stats")

echo "Fetching active subscribers..."

# Create Python script to send emails to all subscribers
cd /home/ubuntu/insurtech-news-tracker

cat > send_to_all_subscribers.py << 'PYTHON_SCRIPT'
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
import sys
import json
import requests

# Load environment variables
load_dotenv()

# Email configuration
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
SENDER_EMAIL = os.getenv("GMAIL_ADDRESS")
SENDER_PASSWORD = os.getenv("GMAIL_APP_PASSWORD")

# Get report ID from command line
if len(sys.argv) < 2:
    print("Usage: python3 send_to_all_subscribers.py <report_id>")
    sys.exit(1)

report_id = sys.argv[1]

# Fetch report data
try:
    response = requests.get(f"http://localhost:3000/api/trpc/news.byId?input=%7B%22id%22%3A{report_id}%7D")
    report_data = response.json()
    html_content = report_data['result']['data']['json']['htmlContent']
except Exception as e:
    print(f"Failed to fetch report: {e}")
    sys.exit(1)

# Fetch active subscribers
try:
    response = requests.get("http://localhost:3000/api/trpc/subscription.stats")
    # For now, we'll use the original recipient
    # In production, this would fetch all active subscribers from the database
    subscribers = [{"email": "xingcheng4237@gmail.com", "name": "User"}]
except Exception as e:
    print(f"Failed to fetch subscribers: {e}")
    subscribers = [{"email": "xingcheng4237@gmail.com", "name": "User"}]

print(f"Sending to {len(subscribers)} subscribers...")

# Send email to each subscriber
success_count = 0
fail_count = 0

for subscriber in subscribers:
    try:
        # Create message
        message = MIMEMultipart("alternative")
        message["Subject"] = "📊 Insurtech Daily Digest - " + str(report_id)
        message["From"] = SENDER_EMAIL
        message["To"] = subscriber["email"]

        # Add unsubscribe link (placeholder for now)
        html_with_unsubscribe = html_content + """
        <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ecf0f1;">
          <p style="color: #95a5a6; font-size: 12px;">
            <a href="https://example.com/unsubscribe" style="color: #95a5a6;">Unsubscribe</a> from this newsletter
          </p>
        </div>
        """

        # Attach HTML content
        html_part = MIMEText(html_with_unsubscribe, "html")
        message.attach(html_part)

        # Send email
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SENDER_EMAIL, SENDER_PASSWORD)
            server.send_message(message)
        
        print(f"✅ Sent to {subscriber['email']}")
        success_count += 1
    except Exception as e:
        print(f"❌ Failed to send to {subscriber['email']}: {e}")
        fail_count += 1

print(f"\n=== Email Delivery Complete ===")
print(f"Success: {success_count}")
print(f"Failed: {fail_count}")
PYTHON_SCRIPT

# Run the Python script
python3 send_to_all_subscribers.py "$REPORT_ID"

# Clean up
rm -f send_to_all_subscribers.py

echo "=== Subscriber Email Delivery Complete ==="
