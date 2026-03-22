Local run instructions — My-Order-main

This project can run under XAMPP/Apache or using PHP's built-in server for quick testing.

1. Using XAMPP (recommended for production-like testing)

- Place the project under the Apache document root (already at `c:/xampp/htdocs/My-Order-main`).
- Start XAMPP Control Panel and start `Apache` (run control panel as Administrator if needed).
- Open in browser: http://localhost/My-Order-main/admin/dashboard.php

If you need to start Apache from PowerShell (requires Administrator):

```powershell
# Run PowerShell as Administrator
net start Apache2.4
# or, if XAMPP installs service name differently, start the control panel and click Start on Apache
```

2. Using PHP built-in server (no admin privileges)

- Open PowerShell in the project root `c:\xampp\htdocs\My-Order-main`.
- Run:

```powershell
# starts a quick development server on port 8000
php -S localhost:8000 -t .
```

- Open in browser: http://localhost:8000/admin/dashboard.php

Notes:

- The admin pages use relative API paths (`/api/...`) so both hosting methods work when the server's document root is the project folder.
- If you run the built-in server from the project root, use the `:8000` URLs above; if using XAMPP use `/My-Order-main` path.

3. Test the API endpoints from PowerShell (after server is running)

```powershell
# Example (XAMPP)
Invoke-RestMethod -Uri 'http://localhost/My-Order-main/api/stats.php' -UseBasicParsing
Invoke-RestMethod -Uri 'http://localhost/My-Order-main/api/orders.php' -UseBasicParsing

# Example (PHP built-in)
Invoke-RestMethod -Uri 'http://localhost:8000/api/stats.php' -UseBasicParsing
Invoke-RestMethod -Uri 'http://localhost:8000/api/orders.php' -UseBasicParsing
```

4. If authentication prevents API access

- The API accepts admin session cookies; open the admin pages in a browser and login first.
- Alternatively, set an `api_secret` in `api/config.php` / `api/db.php` (if available) and call the endpoints with `?api_secret=THE_SECRET`.

5. Troubleshooting

- If `Invoke-RestMethod` fails with "Unable to connect to the remote server" then Apache/PHP server isn't running or port is blocked.
- If `net start Apache2.4` returns "Access is denied", run PowerShell as Administrator.

If you want, I can now run the API checks — start the server using one of the methods above and tell me when ready, or let me know if you want me to adjust any other UI/JS behavior.
