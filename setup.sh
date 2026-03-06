#!/bin/bash
# Alice Trading Platform - Quick Start Script

echo "========================================"
echo "  AliceTrade Multi-Client Platform"
echo "========================================"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Install from https://nodejs.org"
    exit 1
fi

echo "✅ Node.js: $(node -v)"

# Setup backend
echo ""
echo "📦 Installing backend dependencies..."
cd backend && npm install
echo "✅ Backend ready"

# Setup frontend  
echo ""
echo "📦 Installing frontend dependencies..."
cd ../frontend && npm install
echo "✅ Frontend ready"

echo ""
echo "========================================"
echo "  Setup Complete!"
echo "========================================"
echo ""
echo "Next steps:"
echo "1. Edit backend/.env with your MySQL password"
echo "2. Import database: mysql -u root -p alice_trading < database/schema.sql"
echo "3. Start backend: cd backend && npm run dev"
echo "4. Start frontend: cd frontend && npm start"
echo ""
echo "Then open: http://localhost:3000"
