#!/bin/bash

# Agent Feature Integration Tests Runner
# This script runs the comprehensive integration tests for the agent features

echo "🚀 Starting Agent Feature Integration Tests..."
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo "Please create a .env file with the required configuration."
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Set test-specific environment variables if not already set
export API_URL=${API_URL:-"http://localhost:8000"}
export TEST_EMAIL=${TEST_EMAIL:-"admin@gmail.com"}
export TEST_PASSWORD=${TEST_PASSWORD:-"12345678"}

echo "📋 Test Configuration:"
echo "  API URL: $API_URL"
echo "  Test Email: $TEST_EMAIL"
echo ""

# Check if backend is running
echo "🔍 Checking if backend is running..."
if curl -s -f -o /dev/null "$API_URL/health" 2>/dev/null || curl -s -f -o /dev/null "$API_URL" 2>/dev/null; then
    echo "✅ Backend is running"
else
    echo "⚠️  Warning: Backend might not be running at $API_URL"
    echo "   Please start the backend with 'npm run dev' before running tests"
    echo ""
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "🧪 Running integration tests..."
echo ""

# Run the test file with ts-node
npx ts-node tests/test-anstric-e2e.ts

# Capture exit code
EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo "✨ All tests passed successfully!"
else
    echo "💥 Some tests failed. Check the output above for details."
fi

exit $EXIT_CODE
