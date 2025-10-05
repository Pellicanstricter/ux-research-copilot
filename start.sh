#!/bin/bash

echo "🚀 Starting UX Research Copilot..."
echo ""

# Check if Redis is already running
if ! pgrep -x "redis-server" > /dev/null; then
    echo "📦 Starting Redis..."
    redis-server --daemonize yes
    sleep 1
else
    echo "✓ Redis already running"
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "⚠️  Virtual environment not found. Please run: python -m venv venv"
    exit 1
fi

echo "🔧 Starting API server..."
source venv/bin/activate
uvicorn main:app --reload --port 8001 &
API_PID=$!

echo "🎨 Starting Streamlit frontend..."
streamlit run streamlit_app.py &
STREAMLIT_PID=$!

echo ""
echo "✅ All services started!"
echo ""
echo "📍 Frontend: http://localhost:8501"
echo "📍 API: http://localhost:8001"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Wait for Ctrl+C
trap "echo ''; echo '🛑 Stopping services...'; kill $API_PID $STREAMLIT_PID 2>/dev/null; redis-cli shutdown 2>/dev/null; echo '✅ All services stopped'; exit" INT

wait
