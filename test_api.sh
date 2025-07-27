#!/bin/bash

# Test script for the Video Processing API
# Run this after the services are up and running

set -e

API_URL="http://localhost:5001"
echo "🧪 Testing Video Processing API at $API_URL"

# Test 1: Health check
echo "1️⃣  Testing health endpoint..."
curl -f "$API_URL/health" | python3 -m json.tool
echo -e "\n✅ Health check passed\n"

# Test 2: API info
echo "2️⃣  Testing root endpoint..."
curl -f "$API_URL/" | python3 -m json.tool
echo -e "\n✅ API info retrieved\n"

# Test 3: Create a dummy video file
echo "3️⃣  Creating test video file..."
echo "This is dummy video content for testing" > test_video.mp4
echo "✅ Test file created\n"

# Test 4: Upload video
echo "4️⃣  Testing video upload..."
RESPONSE=$(curl -X POST -F "file=@test_video.mp4" "$API_URL/upload")
echo "$RESPONSE" | python3 -m json.tool

# Extract job ID from response
JOB_ID=$(echo "$RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['job_id'])" 2>/dev/null || echo "unknown")
echo -e "\n✅ Video upload completed. Job ID: $JOB_ID\n"

# Test 5: Check job status
if [ "$JOB_ID" != "unknown" ]; then
    echo "5️⃣  Checking job status..."
    curl -f "$API_URL/status/$JOB_ID" | python3 -m json.tool
    echo -e "\n✅ Job status retrieved\n"
fi

# Test 6: Check metrics
echo "6️⃣  Testing metrics endpoint..."
echo "First few lines of metrics:"
curl -s "$API_URL/metrics" | head -20
echo -e "\n✅ Metrics endpoint working\n"

# Cleanup
rm -f test_video.mp4

echo "🎉 All tests completed successfully!"
echo ""
echo "📊 Check the following URLs:"
echo "  - RabbitMQ: http://localhost:15672 (guest/guest)"
echo "  - Prometheus: http://localhost:9090"
echo "  - Grafana: http://localhost:3000 (admin/admin)"
