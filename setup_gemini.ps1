# =========================================================
# Quick Setup Script for Gemini API Integration (Windows)
# =========================================================
# This script helps you set up the secure backend proxy
# Run: powershell -ExecutionPolicy Bypass -File setup_gemini.ps1
# =========================================================

Write-Host "╔═══════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Gemini API - Secure Backend Setup (Windows)     ║" -ForegroundColor Cyan
Write-Host "║  This script configures your API key             ║" -ForegroundColor Cyan
Write-Host "╚═══════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Get current directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path

# Check if .env.php exists
if (-Not (Test-Path "$scriptPath\.env.php")) {
    Write-Host "📋 Creating .env.php from template..." -ForegroundColor Yellow
    Copy-Item "$scriptPath\.env.php.template" "$scriptPath\.env.php"
    Write-Host "✅ Created .env.php" -ForegroundColor Green
}
else {
    Write-Host "⚠️  .env.php already exists" -ForegroundColor Yellow
}

# Check if environment variable is set
$apiKey = [Environment]::GetEnvironmentVariable("GEMINI_API_KEY", "User")
if ([string]::IsNullOrEmpty($apiKey)) {
    Write-Host ""
    Write-Host "⚠️  GEMINI_API_KEY environment variable not set" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "📖 To set it, run this as Administrator:" -ForegroundColor Cyan
    Write-Host '   [Environment]::SetEnvironmentVariable("GEMINI_API_KEY", "your_key_here", "User")' -ForegroundColor White
    Write-Host ""
    Write-Host "   Then restart PowerShell/Command Prompt and Apache (XAMPP Control Panel)" -ForegroundColor Gray
}
else {
    Write-Host "✅ GEMINI_API_KEY environment variable is set" -ForegroundColor Green
}

# Check PHP files
Write-Host ""
Write-Host "📁 Checking files..." -ForegroundColor Cyan

if (Test-Path "$scriptPath\api\chat_handler.php") {
    Write-Host "✅ api/chat_handler.php exists" -ForegroundColor Green
}
else {
    Write-Host "❌ api/chat_handler.php NOT found" -ForegroundColor Red
}

if (Test-Path "$scriptPath\assets\js\ai-chat-widget.js") {
    Write-Host "✅ assets/js/ai-chat-widget.js exists" -ForegroundColor Green
}
else {
    Write-Host "❌ assets/js/ai-chat-widget.js NOT found" -ForegroundColor Red
}

Write-Host ""
Write-Host "╔═══════════════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  Setup Complete! Next Steps:                      ║" -ForegroundColor Green
Write-Host "╠═══════════════════════════════════════════════════╣" -ForegroundColor Green
Write-Host "║ 1. Edit .env.php and add your Gemini API key     ║" -ForegroundColor Green
Write-Host "║    Location: $scriptPath\.env.php" -ForegroundColor Green
Write-Host "║                                                   ║" -ForegroundColor Green
Write-Host "║ 2. Add .env.php to .gitignore (if using Git)     ║" -ForegroundColor Green
Write-Host "║                                                   ║" -ForegroundColor Green
Write-Host "║ 3. Restart Apache from XAMPP Control Panel        ║" -ForegroundColor Green
Write-Host "║    (Stop → Start Apache)                          ║" -ForegroundColor Green
Write-Host "║                                                   ║" -ForegroundColor Green
Write-Host "║ 4. Open your app and test the chat widget         ║" -ForegroundColor Green
Write-Host "║                                                   ║" -ForegroundColor Green
Write-Host "║ For detailed guide, see:                          ║" -ForegroundColor Green
Write-Host "║ GEMINI_SETUP_GUIDE.md                            ║" -ForegroundColor Green
Write-Host "╚═══════════════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
