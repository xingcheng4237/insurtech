#!/bin/bash
echo "=== Manual Collection Trigger ==="
echo "Time: $(date)"
echo ""
echo "Triggering collection via tRPC API..."
echo ""

# Use the correct tRPC batch format
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
  "http://localhost:3000/api/trpc/news.collect" \
  -H "Content-Type: application/json" \
  -d '{}' 2>&1)

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

echo "HTTP Status: $HTTP_CODE"
echo "Response: $BODY"

if [ "$HTTP_CODE" = "200" ]; then
  echo ""
  echo "✓ Collection triggered successfully!"
  echo "Check the latest report at:"
  echo "https://3000-iqk9ivytp0ejto7yfld64-ca1b18b7.manus-asia.computer/latest"
else
  echo ""
  echo "✗ Collection failed with HTTP $HTTP_CODE"
fi
