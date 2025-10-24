#!/bin/bash
# Deployment script for YOLO Object Detection Flask API

echo "🚀 Deploying YOLO Object Detection Flask API..."
echo "=" * 50

# Create virtual environment
echo "📦 Creating virtual environment..."
python -m venv venv

# Activate virtual environment
if [[ "$OSTYPE" == "msys" ]]; then
    # Windows Git Bash
    source venv/Scripts/activate
else
    # Linux/Mac
    source venv/bin/activate
fi

echo "✅ Virtual environment activated"

# Install dependencies
echo "📥 Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo "✅ Dependencies installed"

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p static/uploads
mkdir -p static/results
mkdir -p static/css
mkdir -p static/js
mkdir -p templates

echo "✅ Directories created"

# Set permissions (Linux/Mac only)
if [[ "$OSTYPE" != "msys" ]]; then
    chmod 755 static/uploads
    chmod 755 static/results
    echo "✅ Permissions set"
fi

# Check if YOLO model exists
echo "🤖 Checking YOLO model..."
if [ ! -f "../yolo11n.pt" ]; then
    echo "⚠️ YOLO model not found at ../yolo11n.pt"
    echo "💡 Model will be auto-downloaded on first run"
else
    echo "✅ YOLO model found"
fi

# Run application
echo "🌐 Starting Flask application..."
echo "Access web interface: http://localhost:5000"
echo "API base URL: http://localhost:5000/api/"
echo "=" * 50

python doan.py