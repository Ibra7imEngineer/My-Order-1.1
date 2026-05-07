# 🔄 Gemini API Migration Summary

## What Changed?

### Problem ❌

- Your `ai-chat-widget.js` was making direct API calls to Google's Gemini API
- API key was exposed in the browser (visible in network requests and browser code)
- Endpoint was using v1 which doesn't support `gemini-1.5-flash`
- Error: `404 - models/gemini-1.5-flash is not found for API version v1`

### Solution ✅

- Created `api/chat_handler.php` - A PHP backend proxy
- JavaScript now calls your PHP backend instead of Google's API
- API key is stored server-side (in environment variable) - **never sent to browser**
- Updated endpoint to **v1beta** which fully supports `gemini-1.5-flash`
- Added proper security headers and error handling

---

## Files Changed

### 📝 New Files Created:

1. **`api/chat_handler.php`** - Backend proxy that handles all Gemini API requests
   - Keeps API key secure on server
   - Uses v1beta endpoint
   - Handles errors gracefully
   - Sets CORS headers for frontend requests

2. **`.env.php.template`** - Template for API key configuration
   - Copy to `.env.php`
   - Add your actual Gemini API key

3. **`GEMINI_SETUP_GUIDE.md`** - Comprehensive setup and troubleshooting guide

4. **`setup_gemini.ps1`** - Windows setup script (PowerShell)

5. **`setup_gemini.sh`** - Linux/Mac setup script (Bash)

### ✏️ Modified Files:

1. **`assets/js/ai-chat-widget.js`** - Updated to use backend proxy
   - Removed hardcoded API key
   - Changed endpoint to `/api/chat_handler.php`
   - Updated request/response handling
   - Updated console logs

---

## Code Comparison

### Before (Insecure):

```javascript
// ❌ API key exposed in browser
this.API_KEY = "AIzaSyBh-nW96sVQEffhZFS0NRp9U7aWkLm0YUI";

// ❌ Calling Google API directly from frontend
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.API_KEY}`,
  { method: "POST", ... }
);
```

### After (Secure):

```javascript
// ✅ No API key in frontend
this.API_ENDPOINT = "/api/chat_handler.php";

// ✅ Calling backend proxy
const response = await fetch(this.API_ENDPOINT, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload), // API key added by PHP backend
});
```

---

## PHP Backend Handler Flow

```
1. Frontend sends POST to /api/chat_handler.php
   └─ Contains: systemInstruction, contents, model, config

2. PHP Handler:
   ├─ Validates request
   ├─ Gets API key from environment variable
   └─ Builds payload for Gemini API

3. PHP calls Gemini API v1beta
   └─ https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent

4. PHP Handler returns response to frontend
   └─ Contains: candidates, text, etc.

5. Frontend displays AI response to user
```

---

## Quick Start

### 1. Set Your API Key

Choose ONE method:

**Option A: Using .env.php (easiest for local dev)**

```bash
cp .env.php.template .env.php
# Edit .env.php and add your API key
```

**Option B: Set environment variable (Windows PowerShell - as Admin)**

```powershell
[Environment]::SetEnvironmentVariable("GEMINI_API_KEY", "your_key_here", "User")
```

**Option C: Set environment variable (Linux/Mac)**

```bash
export GEMINI_API_KEY="your_key_here"
# Add to ~/.bashrc or ~/.bash_profile for persistence
```

### 2. Restart Apache

- Stop Apache in XAMPP Control Panel
- Start Apache again
- Or restart your system

### 3. Test

- Open your app with the chat widget
- Open browser DevTools (F12)
- Go to Network tab
- Send a chat message
- Verify:
  - ✅ POST request goes to `/api/chat_handler.php`
  - ✅ NO API key visible in request
  - ✅ Response contains Gemini AI reply

---

## Testing the Backend

### Using cURL (PowerShell):

```powershell
$body = @{
    systemInstruction = "You are helpful"
    contents = @(@{role = "user"; parts = @(@{text = "hello"})})
    model = "gemini-1.5-flash"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost/My-Order/api/chat_handler.php" `
  -Method POST `
  -Headers @{"Content-Type" = "application/json"} `
  -Body $body
```

### Using cURL (Bash):

```bash
curl -X POST http://localhost/My-Order/api/chat_handler.php \
  -H "Content-Type: application/json" \
  -d '{
    "systemInstruction": "You are helpful",
    "contents": [{"role": "user", "parts": [{"text": "hello"}]}],
    "model": "gemini-1.5-flash"
  }'
```

---

## Security Benefits

| Aspect                 | Before                      | After                       |
| ---------------------- | --------------------------- | --------------------------- |
| **API Key Location**   | Browser (exposed) ❌        | Server only (secure) ✅     |
| **API Key Visibility** | In network requests         | Never sent to browser       |
| **Direct API Access**  | From frontend ❌            | Only from backend ✅        |
| **Endpoint**           | v1 (no gemini-1.5-flash) ❌ | v1beta (full support) ✅    |
| **Error Handling**     | Frontend exposes details ❌ | Backend sanitizes errors ✅ |
| **CORS Headers**       | Missing ❌                  | Properly configured ✅      |

---

## Common Issues & Fixes

| Issue                                    | Fix                                                                       |
| ---------------------------------------- | ------------------------------------------------------------------------- |
| "API key not configured"                 | Set GEMINI_API_KEY environment variable and restart Apache                |
| "404 chat_handler.php"                   | Make sure the file is at `/api/chat_handler.php`                          |
| "Cross-Origin blocked"                   | Already handled - CORS headers are in chat_handler.php                    |
| Still getting 404 gemini-1.5-flash error | Your old cached HTML might be loading old JS. Hard refresh (Ctrl+Shift+R) |
| "Method not allowed"                     | Make sure you're sending POST requests (the widget does this correctly)   |

---

## Next Steps

1. ✅ Copy API key to `.env.php` or environment variable
2. ✅ Restart Apache
3. ✅ Test the chat widget
4. ✅ Check browser console for any errors
5. ✅ For production: Add authentication/rate limiting as needed

See **GEMINI_SETUP_GUIDE.md** for detailed documentation.
