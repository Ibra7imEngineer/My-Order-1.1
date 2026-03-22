# 📚 My Order - API Quick Reference Guide

## دليل سريع للواجهة البرمجية

---

## 🎯 Quick Links

- **Setup Guide:** [BACKEND_SETUP.md](BACKEND_SETUP.md)
- **Test Connection:** [api/test.php](api/test.php)
- **Code Examples:** [api/EXAMPLES.php](api/EXAMPLES.php)
- **Database Schema:** [schema.sql](schema.sql)

---

## 📦 Installation (5 Minutes)

### 1. Create Configuration File

```bash
cp api/config.php.example api/config.php
```

### 2. Configure Database

Edit `api/config.php`:

```php
$DB_HOST = '127.0.0.1';
$DB_NAME = 'myorder';
$DB_USER = 'root';
$DB_PASS = '';
```

### 3. Create Database

In phpMyAdmin:

1. Create database: `myorder`
2. Import: `schema.sql`
3. Character set: `utf8mb4`

### 4. Test Connection

Navigate to: `http://localhost/My-Order-main/api/test.php`

---

## 🔄 API Endpoints

### Create Order

```http
POST /api/order.php
Content-Type: application/json

{
  "orderId": "ORD-123456",
  "customerName": "محمد علي",
  "customerPhone": "201001234567",
  "customerEmail": "test@example.com",
  "customerAddress": "القاهرة",
  "items": [
    {"name": "منتج", "price": 100, "quantity": 1}
  ],
  "subtotal": 100,
  "shipping": 0,
  "total": 100,
  "notes": "ملاحظات إضافية"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Order created successfully",
  "orderId": "ORD-123456",
  "databaseId": 1
}
```

---

### Get All Orders (Admin)

```http
GET /api/orders.php?api_secret=YOUR_SECRET
```

Or with status filter:

```http
GET /api/orders.php?status=جديد&api_secret=YOUR_SECRET
```

**Response:**

```json
{
  "success": true,
  "orders": [
    {
      "id": 1,
      "order_id": "ORD-123456",
      "customer_name": "محمد",
      "total": 100,
      "status": "جديد",
      "created_at": "2026-03-22 10:30:00"
    }
  ]
}
```

---

### Update Order Status (Admin)

```http
POST /api/order.php
Content-Type: application/json

{
  "action": "update",
  "orderId": "ORD-123456",
  "status": "تم التسليم",
  "notes": "تم التسليم بنجاح",
  "api_secret": "YOUR_SECRET"
}
```

---

## 🛠️ Available Functions

### Sanitization

```php
sanitizeText($input)           // Clean text for XSS
sanitizeArray($data)           // Clean array
sanitizePhone($phone)          // Remove non-digits
sanitizeEmail($email)          // Clean email
```

### Validation

```php
validatePhone($phone)          // Check format ✓
validateEmail($email)          // Check format ✓
validateAmount($amount)        // Check positive ✓
validateLength($text, 2, 100)  // Check length ✓
isNotEmpty($value)             // Check not empty ✓
```

### Authentication

```php
isAdminAuthenticated()         // Check session
isAuthorized()                 // Check admin or API secret
verifyAdminCredentials($u, $p) // Login verification
```

### Utilities

```php
generateOrderId()              // Create unique ID
normalizePhone($phone)         // Convert to standard
formatCurrency($amount)        // Format for display
getRequestData()               // Get JSON/POST
getClientIp()                  // Get user IP
```

### Logging

```php
logActivity($type, $data)      // Log to database
logError($message, $context)   // Log to file
```

### Response

```php
sendSuccess($data, $code)      // Send JSON success
sendError($msg, $code, $extra) // Send JSON error
```

---

## 💾 Database Tables

### Orders Table (Main)

```
id (INT)
uuid (VARCHAR 36)
order_id (VARCHAR 60 UNIQUE)
customer_name (VARCHAR 191)
customer_phone (VARCHAR 32)
customer_email (VARCHAR 191)
items (LONGTEXT JSON)
subtotal, shipping, total (DECIMAL)
status (VARCHAR)
payment_status (VARCHAR)
created_at, updated_at (TIMESTAMP)
```

### Users Table

```
id, uuid, name, email, phone
address, city, postal_code
is_admin (BOOLEAN)
is_active (BOOLEAN)
```

### Activity Logs Table

```
id, activity_type, user_type
user_id, user_name, user_ip
action, item_id, item_name
created_at
```

---

## ✅ Validation Rules

### Phone Number

- **Format:** Egyptian only
- **Valid:** `201001234567` or `01001234567`
- **Invalid:** `123`, `+201001234567` (format varies)

### Email

- **Standard:** RFC-compliant
- **Valid:** `user@example.com`
- **Invalid:** `user@`, `@example.com`

### Amounts

- **Range:** 0 to 9999999.99
- **Decimals:** Max 2 decimal places
- **Valid:** 100, 99.99, 0.50
- **Invalid:** -50, abc, 1000000000

### Customer Name

- **Length:** 2-100 characters
- **Special chars:** Allowed (Arabic/English)
- **Valid:** "محمد علي", "John Smith"

### Order ID

- **Length:** Max 60 characters
- **Unique:** Must not exist
- **Format:** Alphanumeric + dash/underscore
- **Valid:** "ORD-123456", "ORD-ABC-2026-001"

---

## 🚨 Error Codes

| Code | Message            | Meaning                         |
| ---- | ------------------ | ------------------------------- |
| 200  | OK                 | Success                         |
| 201  | Created            | Order created                   |
| 400  | Bad Request        | Invalid input                   |
| 401  | Unauthorized       | Not logged in / Invalid API key |
| 404  | Not Found          | Order doesn't exist             |
| 405  | Method Not Allowed | Use POST not GET                |
| 409  | Conflict           | Duplicate order ID              |
| 429  | Too Many Requests  | Rate limit exceeded             |
| 500  | Server Error       | Database/Server error           |

---

## 📝 Code Template: Create Order from Frontend

### HTML Form

```html
<form id="orderForm">
  <input type="text" name="orderid" placeholder="Order ID" required />
  <input type="text" name="customerName" placeholder="Name" required />
  <input type="tel" name="customerPhone" placeholder="Phone" required />
  <input type="email" name="customerEmail" placeholder="Email" />
  <textarea name="customerAddress" placeholder="Address"></textarea>

  <input type="number" name="subtotal" placeholder="Subtotal" required />
  <input type="number" name="shipping" placeholder="Shipping" value="0" />
  <input type="number" name="total" placeholder="Total" required />

  <button type="submit">Create Order</button>
</form>
```

### JavaScript Handler

```javascript
document.getElementById("orderForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData);

  // Add items (example)
  data.items = [{ name: "Item 1", price: data.subtotal, quantity: 1 }];

  try {
    const response = await fetch("/api/order.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (result.success) {
      alert("✅ Order created: " + result.orderId);
    } else {
      alert("❌ Error: " + result.message);
    }
  } catch (error) {
    alert("Network error: " + error.message);
  }
});
```

---

## 🔍 Debugging Tips

### Check Database Connection

```bash
curl http://localhost/My-Order-main/api/test.php
```

### View Error Log

```bash
tail -f logs/errors.log
```

### Check Activity Log (Database)

```sql
SELECT * FROM activity_logs ORDER BY created_at DESC LIMIT 10;
```

### Verify Rate Limit

```bash
# Create file: .rate_limit_[IP_HASH]
# If too many requests, file is updated
```

### Test with cURL

```bash
curl -X POST http://localhost/My-Order-main/api/order.php \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "TEST-001",
    "customerName": "Test",
    "customerPhone": "201001234567",
    "items": [{"name": "Test", "price": 100, "qty": 1}],
    "subtotal": 100,
    "shipping": 0,
    "total": 100
  }'
```

---

## 🔐 Security Checklist

- [ ] Changed admin password in `config.php`
- [ ] Set strong `$API_SECRET`
- [ ] All inputs validated before database
- [ ] Using prepared statements (PDO)
- [ ] CORS headers configured
- [ ] Rate limiting enabled
- [ ] Error logs not exposed to public
- [ ] Activity logging enabled
- [ ] File permissions set (755)
- [ ] HTTPS enabled in production
- [ ] Phone validation works for your region
- [ ] Database backups scheduled

---

## 📊 Common Queries

### Get Today's Orders

```sql
SELECT * FROM orders
WHERE DATE(created_at) = CURDATE()
ORDER BY created_at DESC;
```

### Get Orders by Status

```sql
SELECT * FROM orders
WHERE status = 'جديد'
ORDER BY created_at DESC;
```

### Daily Revenue Report

```sql
SELECT DATE(created_at) as date,
       COUNT(*) as orders,
       SUM(total) as revenue
FROM orders
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

### Recent Activity Log

```sql
SELECT * FROM activity_logs
ORDER BY created_at DESC
LIMIT 50;
```

### Top 10 Customers

```sql
SELECT customer_phone, customer_name,
       COUNT(*) as order_count,
       SUM(total) as total_spent
FROM orders
GROUP BY customer_phone
ORDER BY total_spent DESC
LIMIT 10;
```

---

## 🎓 Learning Resources

- **PHP Documentation:** https://www.php.net/docs.php
- **PDO Tutorial:** https://www.php.net/manual/en/book.pdo.php
- **SQL Tutorial:** https://www.w3schools.com/sql/
- **REST API Best Practices:** https://restfulapi.net/
- **OWASP Security:** https://owasp.org/

---

## 📞 Troubleshooting

### "Database connection failed"

1. Check XAMPP MySQL is running
2. Verify credentials in `config.php`
3. Test at `api/test.php`

### "Invalid phone number format"

- Use format: `201001234567` (12 digits) or `01001234567` (11 digits)

### "Order ID already exists"

- Generate unique ID: `ORD-${Date.now()}-${Math.random()}`

### "Undefined variable" errors

- Check that `db.php` is included
- Verify `config.php` exists (copy from example)

### "Permission denied" (logs)

- Make sure `logs/` directory exists
- Set permissions: `chmod 755 logs/`

---

## 🚀 Next Steps

1. **Configure:** Update `api/config.php`
2. **Test:** Visit `api/test.php`
3. **Create:** Submit an order
4. **Monitor:** Check activity logs
5. **Deploy:** Move to production with HTTPS

---

**Last Updated:** March 22, 2026  
**Version:** 1.0.0

<div style="background: #f0f0f0; padding: 15px; border-radius: 5px; margin-top: 20px;">

## 🎉 You're Ready!

Your backend is fully set up with:

- ✅ Secure PDO database connection
- ✅ Input validation & sanitization
- ✅ Rate limiting
- ✅ Activity logging
- ✅ Error handling
- ✅ Admin authentication
- ✅ Clean Code architecture

Start creating orders through `/api/order.php`!

</div>
