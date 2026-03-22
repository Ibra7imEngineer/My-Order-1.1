# 📋 My Order - Backend Setup Guide

## دليل إعداد الجزء الخلفي

**Version:** 1.0.0  
**Created:** March 22, 2026  
**Language:** PHP 7.4+ | MySQL 5.7+ | Arabic & English

---

## 🚀 Quick Start

### متطلبات النظام / System Requirements

- XAMPP (with PHP 7.4+ and MySQL 5.7+)
- Apache Server
- MySQL Database
- Modern Web Browser

### خطوات الإعداد / Setup Steps

#### 1️⃣ تحضير قاعدة البيانات / Database Preparation

```bash
# Copy the database configuration
cp api/config.php.example api/config.php

# Edit api/config.php with your credentials
# Default values:
# $DB_HOST = '127.0.0.1'
# $DB_NAME = 'myorder'
# $DB_USER = 'root'
# $DB_PASS = ''
```

#### 2️⃣ إنشاء قاعدة البيانات / Create Database

**Option A: Using phpMyAdmin**

1. Open `http://localhost/phpmyadmin`
2. Create new database: `myorder`
3. Import `schema.sql` file
4. Set charset to `utf8mb4`

**Option B: Using MySQL Command Line**

```bash
mysql -u root -p < schema.sql
```

**Option C: Using MySQL GUI (Workbench)**

1. Open MySQL Workbench
2. File → Open SQL Script → Select `schema.sql`
3. Execute the script

#### 3️⃣ التحقق من الإعداد / Verify Setup

```
Navigate to: http://localhost/My-Order-main/api/test.php
```

You should see a success message with database connection status.

---

## 📁 دليل الملفات / File Structure

```
My-Order-main/
├── api/
│   ├── config.php.example      # Configuration template
│   ├── config.php              # Your local configuration (create from example)
│   ├── db.php                  # Database connection (PDO)
│   ├── functions.php           # Helper functions & validation ✨ NEW
│   ├── helpers.php             # Additional utilities ✨ NEW
│   ├── order.php               # Create/Submit order
│   ├── orders.php              # Get all orders (Admin)
│   ├── stats.php               # Statistics & Reports
│   └── test.php                # Test database connection
│
├── admin/
│   ├── login.php               # Admin login
│   ├── logout.php              # Admin logout
│   ├── index.php               # Dashboard
│   └── order.php               # Order management
│
├── schema.sql                  # Database schema (Enhanced) ✨ UPDATED
├── index.html                  # Frontend
├── style.css                   # Styling
├── script.js                   # Frontend logic
├── manifest.json               # PWA manifest
├── sw.js                       # Service Worker
└── README.md                   # Documentation
```

---

## 🔐 Security Features

### 1. **Database Connection (PDO)**

```php
// Uses prepared statements to prevent SQL injection
$stmt = $pdo->prepare('SELECT * FROM users WHERE email = ?');
$stmt->execute([$email]);
```

### 2. **Input Validation & Sanitization**

- Removes XSS attack vectors
- Validates phone numbers (Egyptian format)
- Validates email addresses
- Validates monetary amounts
- Length restrictions on all text inputs

### 3. **CORS & Security Headers**

```php
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
```

### 4. **Rate Limiting**

- 30 requests per minute per IP
- Prevents brute force attacks
- File-based implementation

### 5. **Admin Authentication**

- Session-based authentication
- Credentials in `api/config.php`
- Change credentials immediately in production!

---

## 📝 Available Functions

### Data Sanitization (Functions.php)

| Function                | Purpose                 | Returns |
| ----------------------- | ----------------------- | ------- |
| `sanitizeText($input)`  | Clean text from XSS     | string  |
| `sanitizeArray($data)`  | Clean array recursively | array   |
| `sanitizePhone($phone)` | Remove non-digits       | string  |
| `sanitizeEmail($email)` | Clean email             | string  |

### Validation (Functions.php)

| Function                            | Purpose                  | Returns |
| ----------------------------------- | ------------------------ | ------- |
| `validatePhone($phone)`             | Check Egyptian format    | bool    |
| `validateEmail($email)`             | Check email format       | bool    |
| `validateAmount($amount)`           | Check if positive number | bool    |
| `validateLength($text, $min, $max)` | Check string length      | bool    |
| `isNotEmpty($value)`                | Check if not empty       | bool    |

### Authentication (Functions.php)

| Function                               | Purpose                   | Returns |
| -------------------------------------- | ------------------------- | ------- |
| `isAdminAuthenticated()`               | Check admin session       | bool    |
| `verifyAdminCredentials($user, $pass)` | Verify login              | bool    |
| `verifyApiSecret($secret)`             | Check API secret          | bool    |
| `isAuthorized()`                       | Check auth (admin OR API) | bool    |

### Utilities (Functions.php & helpers.php)

| Function                  | Purpose                    | Returns |
| ------------------------- | -------------------------- | ------- |
| `getRequestData()`        | Get JSON/POST data         | array   |
| `getClientIp()`           | Get user IP                | string  |
| `generateOrderId()`       | Create order ID            | string  |
| `normalizePhone($phone)`  | Convert to standard format | string  |
| `formatCurrency($amount)` | Format for display         | string  |

### Response (Functions.php)

| Function                         | Purpose                    |
| -------------------------------- | -------------------------- |
| `sendSuccess($data, $code)`      | Send JSON success response |
| `sendError($msg, $code, $extra)` | Send JSON error response   |

### Logging (Functions.php)

| Function                       | Purpose                    |
| ------------------------------ | -------------------------- |
| `logActivity($type, $data)`    | Log to activity_logs table |
| `logError($message, $context)` | Log to errors.log file     |

---

## 📊 Database Schema

### Users Table

```
id (INT, Primary Key)
uuid (VARCHAR 36, Unique)
name (VARCHAR 191)
email (VARCHAR 191, Unique)
phone (VARCHAR 32)
address (TEXT)
is_admin (BOOLEAN)
is_active (BOOLEAN)
created_at (TIMESTAMP)
```

### Products Table

```
id (INT, Primary Key)
uuid (VARCHAR 36, Unique)
name (VARCHAR 191)
category (VARCHAR 100)
price (DECIMAL 10,2)
stock_quantity (INT)
is_available (BOOLEAN)
image_url (VARCHAR 255)
```

### Orders Table (Enhanced)

```
id (INT, Primary Key)
uuid (VARCHAR 36, Unique)
order_id (VARCHAR 60, Unique)
user_id (INT, Foreign Key)
customer_name (VARCHAR 191)
customer_phone (VARCHAR 32)
customer_email (VARCHAR 191)
items (LONGTEXT JSON)
subtotal (DECIMAL 10,2)
discount_amount (DECIMAL 10,2)
shipping (DECIMAL 10,2)
total (DECIMAL 10,2)
payment_method (VARCHAR 100)
status (VARCHAR 50)
payment_status (VARCHAR 50)
created_at (TIMESTAMP)
updated_at (TIMESTAMP)
```

### Activity Logs Table

```
id (INT, Primary Key)
activity_type (VARCHAR 100)
user_type (VARCHAR 50)
user_id (VARCHAR 191)
action (VARCHAR 500)
created_at (TIMESTAMP)
```

---

## 💻 API Endpoints

### Creating an Order (Example)

**Endpoint:** `POST /api/order.php`

**Request:**

```json
{
  "orderId": "ORD-123456",
  "customerName": "محمد علي",
  "customerPhone": "201001234567",
  "customerEmail": "customer@example.com",
  "customerAddress": "القاهرة - مصر",
  "items": [
    {
      "id": "product-1",
      "name": "ساندويتش دجاج",
      "quantity": 2,
      "price": 45.0,
      "total": 90.0
    }
  ],
  "subtotal": 90.0,
  "shipping": 10.0,
  "total": 100.0,
  "status": "جديد",
  "notes": "بدون طماطم"
}
```

**Response (Success):**

```json
{
  "success": true,
  "message": "Order created successfully",
  "orderId": "ORD-123456",
  "insertId": 1
}
```

**Response (Error):**

```json
{
  "success": false,
  "message": "Invalid phone number format"
}
```

### Getting All Orders (Admin)

**Endpoint:** `GET /api/orders.php`

**Requirements:**

- Admin Session OR
- API Secret in query: `?api_secret=YOUR_SECRET`

**Response:**

```json
{
  "success": true,
  "orders": [
    {
      "id": 1,
      "order_id": "ORD-123456",
      "customer_name": "محمد علي",
      "status": "جديد",
      "total": 100.0,
      "created_at": "2026-03-22 10:30:00"
    }
  ]
}
```

---

## 🧪 Testing the API

### Test Connection

```bash
curl http://localhost/My-Order-main/api/test.php
```

### Create Order (Using cURL)

```bash
curl -X POST http://localhost/My-Order-main/api/order.php \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "TEST-001",
    "customerName": "محمد علي",
    "customerPhone": "201001234567",
    "items": [{"name": "منتج", "price": 50, "quantity": 1}],
    "subtotal": 50,
    "shipping": 0,
    "total": 50
  }'
```

### Using JavaScript/Fetch

```javascript
const data = {
  orderId: "ORD-" + Date.now(),
  customerName: "Your Name",
  customerPhone: "201001234567",
  items: [{ name: "Product", price: 100, quantity: 1 }],
  subtotal: 100,
  shipping: 0,
  total: 100,
};

fetch("/api/order.php", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data),
})
  .then((r) => r.json())
  .then((json) => console.log(json));
```

---

## ⚙️ Configuration

### Edit `api/config.php`

```php
// Database credentials
$DB_HOST = '127.0.0.1';      // XAMPP default
$DB_NAME = 'myorder';
$DB_USER = 'root';            // XAMPP default
$DB_PASS = '';                // No password by default

// Admin credentials (CHANGE IMMEDIATELY!)
$ADMIN_USERNAME = 'admin';
$ADMIN_PASSWORD = '12345';

// Optional: API secret for programmatic access
$API_SECRET = 'your-secret-key-here';

// Optional: Webhook for forwarding orders
$RESTRO_WEBHOOK = ''; // e.g., https://your-panel.example/webhook
```

---

## 🛠️ Common Issues & Solutions

### ❌ Database Connection Failed

**Problem:** "DB connection failed"

**Solutions:**

1. Check XAMPP MySQL is running
2. Verify credentials in `api/config.php`
3. Ensure database `myorder` exists
4. Check MySQL is listening on `127.0.0.1:3306`

### ❌ Invalid Phone Number

**Problem:** "Invalid phone number format"

**Solutions:**

- Use Egyptian format: `01xxxxxxxxx` or `201xxxxxxxxx`
- Valid example: `201001234567` or `01001234567`

### ❌ ORDER_ID Already Exists

**Problem:** UNIQUE constraint failed

**Solution:**

- Generate unique order IDs in frontend
- Use: `ORD-${Date.now()}-${Math.random()}`

### ❌ Permission Denied

**Problem:** Directory not writable

**Solutions:**

```bash
# On Windows, make sure XAMPP runs as admin
# On Linux/Mac:
chmod 755 /path/to/My-Order-main
chmod 755 /path/to/My-Order-main/logs
```

---

## 📚 Code Examples

### Example 1: Validate Order Data

```php
<?php
require 'api/functions.php';
require 'api/db.php';

$data = [
    'customerName' => 'محمد',
    'customerPhone' => '201001234567',
    'customerEmail' => 'test@example.com',
    'items' => [['name' => 'Item', 'price' => 100, 'qty' => 1]],
    'subtotal' => 100,
    'total' => 100
];

// Sanitize
$data = sanitizeArray($data);

// Validate phone
if (!validatePhone($data['customerPhone'])) {
    die('Invalid phone');
}

// Validate email
if (!validateEmail($data['customerEmail'])) {
    die('Invalid email');
}

echo 'All validations passed!';
?>
```

### Example 2: Insert Order with Logging

```php
<?php
require 'api/db.php';
require 'api/functions.php';

$data = getRequestData();
$prepared = prepareOrderData($data);

try {
    $stmt = $pdo->prepare(
        'INSERT INTO orders (order_id, customer_name, customer_phone, items, total, status)
         VALUES (?, ?, ?, ?, ?, ?)'
    );

    $stmt->execute([
        $prepared['order_id'],
        $prepared['customer_name'],
        $prepared['customer_phone'],
        $prepared['items'],
        $prepared['total'],
        $prepared['status']
    ]);

    // Log activity
    logActivity('order_created', [
        'user_name' => $prepared['customer_name'],
        'item_name' => 'Order ' . $prepared['order_id'],
        'action' => 'Created new order'
    ]);

    sendSuccess(['message' => 'Order created', 'orderId' => $prepared['order_id']]);

} catch (Exception $e) {
    logError($e->getMessage(), 'order_creation');
    sendError('Failed to create order', 500);
}
?>
```

---

## 🚀 Production Checklist

- [ ] Change admin credentials in `api/config.php`
- [ ] Set strong `$API_SECRET` value
- [ ] Enable HTTPS (SSL certificate)
- [ ] Set file permissions securely (chmod 755)
- [ ] Create logs directory with proper permissions
- [ ] Test all API endpoints
- [ ] Set up database backups
- [ ] Monitor activity logs regularly
- [ ] Implement rate limiting (already done in `order.php`)
- [ ] Update phone validation for your region
- [ ] Review security headers
- [ ] Test with real data

---

## 📖 Additional Resources

- [PHP PDO Documentation](https://www.php.net/manual/en/book.pdo.php)
- [OWASP Security Best Practices](https://owasp.org/)
- [MySQL Optimization](https://dev.mysql.com/doc/)
- [JSON.org](https://www.json.org/)

---

## 📞 Support

For issues or questions:

1. Check the troubleshooting section above
2. Review error logs in `logs/errors.log`
3. Check activity logs in database `activity_logs` table
4. Inspect browser console for frontend errors

---

## 📄 License

This project is provided as-is for educational and commercial use.

**Last Updated:** March 22, 2026  
**Version:** 1.0.0
