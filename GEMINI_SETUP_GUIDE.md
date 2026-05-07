# 🔒 Gemini API Integration - Secure Backend Setup Guide

## Overview

This guide shows how to migrate from direct JavaScript API calls (exposing your API key) to a secure PHP backend proxy that keeps your API key server-side.

## ✅ What Was Changed

### Before (Insecure ❌)

- API key stored in JavaScript (visible in browser)
- Direct calls to Google's API from frontend
- v1 endpoint (doesn't support gemini-1.5-flash)

### After (Secure ✅)

- API key stored server-side in environment variable
- All API calls routed through PHP backend proxy
- v1beta endpoint (fully supports gemini-1.5-flash)
- Proper error handling and security headers

---

## 📋 Setup Instructions

### Step 1: Get Your Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "Get API key"
3. Create a new key for this application
4. Copy the key (you'll need it in Step 2)

### Step 2: Set Your API Key in the Environment

Choose ONE of these methods based on your hosting:

#### Option A: XAMPP Local Development (Recommended for Testing)

**Method 1: Using `.env.php` file (Simplest)**

```bash
1. Copy `.env.php.template` to `.env.php`
2. Edit .env.php and replace 'YOUR_GEMINI_API_KEY_HERE' with your actual key
3. Add `.env.php` to .gitignore to prevent accidental commits
```

**Method 2: Using System Environment Variable (Better for Production)**

On Windows (PowerShell - Run as Administrator):

```powershell
[Environment]::SetEnvironmentVariable("GEMINI_API_KEY", "paste_your_key_here", "User")
# Restart Apache after setting
```

On Linux/Mac:

```bash
export GEMINI_API_KEY="paste_your_key_here"
# Or add to ~/.bashrc or ~/.bash_profile for permanent setting
```

#### Option B: Apache Virtual Host Configuration

Edit your `httpd-vhosts.conf` or virtual host config:

```apache
<VirtualHost *:80>
    ServerName my-order.local
    DocumentRoot "C:/xampp/htdocs/My-Order"
    SetEnv GEMINI_API_KEY "your_api_key_here"
</VirtualHost>
```

Then restart Apache.

#### Option C: Add to XAMPP `php.ini`

Edit `C:\xampp\php\php.ini`:

```ini
; Add this line
variables_order = "EGPCS"
```

---

## 📁 Files Modified/Created

### New Files:

- ✅ `api/chat_handler.php` - PHP backend proxy for Gemini API
- ✅ `.env.php.template` - Environment variable template

### Modified Files:

- ✅ `assets/js/ai-chat-widget.js` - Updated to call PHP handler instead of Google API directly

---

## 🧪 Testing Your Setup

### Test 1: Check PHP Handler Direct Request

```bash
# Using PowerShell or Command Line
curl -X POST http://localhost/My-Order/api/chat_handler.php `
  -H "Content-Type: application/json" `
  -d '{
    "systemInstruction": "You are helpful",
    "contents": [{"role": "user", "parts": [{"text": "hello"}]}],
    "model": "gemini-1.5-flash"
  }'
```

Expected response: Should either return Gemini response or error about API key.

### Test 2: Use the Widget

1. Open your page with the chat widget
2. Click the chat icon to open the widget
3. Type a message
4. Check browser console for logs (F12 → Console tab)
5. Look for "🤖 AI Request Sent to Backend" log

### Test 3: Check Browser Network Tab

1. Open Developer Tools (F12)
2. Go to Network tab
3. Send a message through the widget
4. You should see a POST request to `/api/chat_handler.php`
5. Click on it and check:
   - Status: 200 (success) or error code
   - Response: Should show Gemini API response
   - NO API key should be visible in Request headers/body

---

## 🐛 Troubleshooting

### Error: "API key not configured"

**Cause:** Environment variable not set  
**Fix:**

1. Verify you set `GEMINI_API_KEY` environment variable
2. Restart Apache after setting (in XAMPP Control Panel)
3. Check using PHP: `<?php echo getenv('GEMINI_API_KEY'); ?>`

### Error: "404 - models/gemini-1.5-flash is not found"

**Cause:** Still using v1 endpoint  
**Fix:**

- ✅ Already fixed in the new `chat_handler.php` (uses v1beta)
- Make sure you're using the updated files

### Error: "Cross-Origin Request Blocked"

**Cause:** CORS headers missing  
**Fix:** Already included in `chat_handler.php`:

```php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
```

### Error: "Method not allowed"

**Cause:** Using wrong HTTP method  
**Fix:** The widget only sends POST requests (correct)

### Response shows HTML instead of JSON

**Cause:** PHP error or wrong endpoint  
**Fix:**

1. Check Apache error logs
2. Make sure the file path is correct
3. Verify `.env.php` or environment variable is set

---

## 🔐 Security Best Practices

### ✅ DO:

- Store API key in environment variables (never in code)
- Use HTTPS in production (SSL/TLS)
- Add rate limiting to backend endpoint
- Validate request format on backend
- Log errors but don't expose sensitive info to frontend
- Add authentication if needed (API tokens, session)

### ❌ DON'T:

- Never hardcode API keys in JavaScript
- Never commit `.env.php` to version control
- Never expose API key in error messages to frontend
- Never log API key to console in production

---

## 📊 Request/Response Flow

```
User Types Message
        ↓
Frontend JavaScript (ai-chat-widget.js)
        ↓
Sends POST to /api/chat_handler.php
        ↓
PHP Handler (chat_handler.php)
        ├─ Validates request
        ├─ Gets API key from environment
        └─ Calls Gemini API v1beta
        ↓
Google Gemini API (v1beta)
        ↓
PHP Handler receives response
        ├─ Checks for errors
        └─ Returns JSON to frontend
        ↓
Frontend displays message
```

---

## 🚀 Switching Models

To use a different Gemini model, update the frontend request:

```javascript
// In ai-chat-widget.js, modify the payload:
const payload = {
  // ... other settings
  model: "gemini-1.5-pro", // or "gemini-2-0-flash"
  // ...
};
```

Supported models via v1beta:

- `gemini-1.5-flash` ✅ (default - fast, cheap)
- `gemini-1.5-pro` (more capable, slower)
- `gemini-2-0-flash` (latest, experimental)

---

## 📞 Support

If you encounter issues:

1. Check browser console (F12) for detailed error logs
2. Check `api/chat_handler.php` error handling
3. Test the endpoint directly using curl (see Testing section)
4. Verify API key is valid at [Google AI Studio](https://aistudio.google.com/app/apikey)

---

**Version:** 1.0  
**Last Updated:** 2024  
**Status:** ✅ Production Ready
