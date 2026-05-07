#!/bin/bash
# =========================================================
# Quick Setup Script for Gemini API Integration
# =========================================================
# This script helps you set up the secure backend proxy
# Run: bash setup_gemini.sh
# =========================================================

echo "╔═══════════════════════════════════════════════════╗"
echo "║  Gemini API - Secure Backend Setup               ║"
echo "║  This script configures your API key             ║"
echo "╚═══════════════════════════════════════════════════╝"
echo ""

# Check if .env.php exists
if [ ! -f ".env.php" ]; then
    echo "📋 Creating .env.php from template..."
    cp .env.php.template .env.php
    echo "✅ Created .env.php"
else
    echo "⚠️  .env.php already exists"
fi

# Check if environment variable is set
if [ -z "$GEMINI_API_KEY" ]; then
    echo ""
    echo "⚠️  GEMINI_API_KEY environment variable not set"
    echo ""
    echo "📖 To set it, add to your shell profile:"
    echo "   export GEMINI_API_KEY='your_key_here'"
    echo ""
    echo "   Then reload with: source ~/.bashrc  (or ~/.bash_profile on Mac)"
else
    echo "✅ GEMINI_API_KEY environment variable is set"
fi

# Check PHP files
echo ""
echo "📁 Checking files..."

if [ -f "api/chat_handler.php" ]; then
    echo "✅ api/chat_handler.php exists"
else
    echo "❌ api/chat_handler.php NOT found"
fi

if [ -f "assets/js/ai-chat-widget.js" ]; then
    echo "✅ assets/js/ai-chat-widget.js exists"
else
    echo "❌ assets/js/ai-chat-widget.js NOT found"
fi

echo ""
echo "╔═══════════════════════════════════════════════════╗"
echo "║  Setup Complete! Next Steps:                      ║"
echo "╠═══════════════════════════════════════════════════╣"
echo "║ 1. Edit .env.php and add your API key             ║"
echo "║ 2. Add .env.php to .gitignore                     ║"
echo "║ 3. Restart Apache (XAMPP Control Panel)           ║"
echo "║ 4. Open your app and test the chat widget         ║"
echo "║                                                   ║"
echo "║ For detailed guide, see: GEMINI_SETUP_GUIDE.md   ║"
echo "╚═══════════════════════════════════════════════════╝"
