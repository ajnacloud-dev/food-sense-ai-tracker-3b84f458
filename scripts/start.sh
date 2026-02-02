#!/bin/bash

echo "==========================================="
echo "🚀 Starting NutriWealth Application"
echo "==========================================="
echo ""

# Kill any existing processes on ports 8080 and 8081
echo "🧹 Cleaning up old processes..."
lsof -ti:8080 | xargs kill -9 2>/dev/null
lsof -ti:8081 | xargs kill -9 2>/dev/null
sleep 1

# Start backend
echo "📡 Starting backend server on port 8080..."
cd backend
python3 src/main.py &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
for i in {1..10}; do
    if curl -s -f -o /dev/null http://localhost:8080/health; then
        echo "✅ Backend is ready!"
        break
    fi
    sleep 1
done

# Start frontend
echo "🖥️  Starting frontend server on port 8081..."
cd ui
npm run dev &
FRONTEND_PID=$!
cd ..

# Wait for frontend to start
echo "⏳ Waiting for frontend to start..."
for i in {1..10}; do
    if curl -s -f -o /dev/null http://localhost:8081; then
        echo "✅ Frontend is ready!"
        break
    fi
    sleep 1
done

echo ""
echo "==========================================="
echo "✨ Application is ready!"
echo "==========================================="
echo ""
echo "📱 Frontend: http://localhost:8081"
echo "📡 Backend:  http://localhost:8080"
echo "📚 API Docs: http://localhost:8080/docs"
echo ""
echo "🔐 Login credentials for local development:"
echo "   Email: dev@local.com"
echo "   Password: any password (local mode)"
echo ""
echo "Press Ctrl+C to stop all services"
echo "==========================================="

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping services..."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    lsof -ti:8080 | xargs kill -9 2>/dev/null
    lsof -ti:8081 | xargs kill -9 2>/dev/null
    echo "✅ Services stopped"
    exit 0
}

# Set up trap to cleanup on Ctrl+C
trap cleanup INT

# Keep script running
wait