<?php
/**
 * My Order - Example: Complete Order Creation
 * مثال عملي: إنشاء طلب كامل مع جميع الخدعات
 */

// This is an EXAMPLE file - Not meant for production
// Use this as reference for implementing order creation

echo "<!-- My Order - Complete Examples -->\n";

// ==================== Example 1: Basic Order Creation ====================

echo "<!-- EXAMPLE 1: Basic Order Creation -->\n";
?>

<h2>Example 1: Basic Order Creation with JavaScript</h2>

<script>
async function createOrder() {
    // Step 1: Prepare order data
    const orderData = {
        orderId: 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        customerName: 'محمد علي أحمد',
        customerPhone: '201001234567',
        customerEmail: 'customer@example.com',
        customerAddress: 'القاهرة، مصر - شارع النيل 123',
        items: [
            {
                id: 'sandwich-1',
                name: 'ساندويتش دجاج',
                quantity: 2,
                price: 45.00,
                total: 90.00
            },
            {
                id: 'drink-1',
                name: 'عصير برتقال',
                quantity: 2,
                price: 20.00,
                total: 40.00
            }
        ],
        subtotal: 130.00,
        shipping: 10.00,
        total: 140.00,
        notes: 'بدون طماطم - إضافة خس',
        status: 'جديد'
    };

    try {
        // Step 2: Send to API
        const response = await fetch('/api/order.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': document.querySelector('[name="csrf_token"]')?.value || ''
            },
            body: JSON.stringify(orderData)
        });

        // Step 3: Handle response
        const result = await response.json();
        
        if (result.success) {
            console.log('✅ Order created successfully!');
            console.log('Order ID:', result.orderId);
            console.log('Database ID:', result.databaseId);
            
            // Show success message to user
            alert('تم إنشاء الطلب بنجاح رقم: ' + result.orderId);
            
            // Reset form
            document.getElementById('orderForm')?.reset();
            
            // Redirect to confirmation page
            // window.location.href = '/order-confirmation.html?id=' + result.databaseId;
        } else {
            console.error('❌ Error:', result.message);
            alert('خطأ: ' + result.message);
        }
    } catch (error) {
        console.error('Network error:', error);
        alert('خطأ في الشبكة: تعذر الاتصال بالخادم');
    }
}

// Call this when form is submitted
// document.getElementById('orderForm').addEventListener('submit', (e) => {
//     e.preventDefault();
//     createOrder();
// });
</script>

<?php

// ==================== Example 2: PHP Implementation ====================

echo "\n<!-- EXAMPLE 2: PHP Implementation -->\n";

?>

<h2>Example 2: PHP - Create Order with Validation</h2>

<pre><code class="language-php">
&lt;?php
require 'api/db.php';
require 'api/functions.php';
require 'api/helpers.php';

// Get incoming data
$input = getRequestData();

// Sanitize
$input = sanitizeArray($input);

// Validate
$validation = validateOrderData($input);

if (!$validation['valid']) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Validation errors',
        'errors' => $validation['errors']
    ]);
    exit;
}

// Prepare data
$prepared = prepareOrderData($input);

// Insert into database
try {
    $stmt = $pdo->prepare('
        INSERT INTO orders 
        (order_id, customer_name, customer_phone, customer_email, 
         customer_address, items, subtotal, shipping, total, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ');
    
    $stmt->execute([
        $prepared['order_id'],
        $prepared['customer_name'],
        $prepared['customer_phone'],
        $prepared['customer_email'],
        $prepared['customer_address'],
        $prepared['items'],
        $prepared['subtotal'],
        $prepared['shipping'],
        $prepared['total'],
        $prepared['status']
    ]);
    
    // Log the activity
    logActivity('order_created', [
        'item_id' => $prepared['order_id'],
        'item_name' => 'Order ' . $prepared['order_id'],
        'user_name' => $prepared['customer_name'],
        'action' => 'Created order'
    ]);
    
    // Send success
    sendSuccess([
        'message' => 'Order created successfully',
        'orderId' => $prepared['order_id']
    ]);
    
} catch (Exception $e) {
    logError($e->getMessage());
    sendError('Failed to create order', 500);
}
?>
</code></pre>

<?php

// ==================== Example 3: Payment Integration ====================

echo "\n<!-- EXAMPLE 3: With Payment Integration -->\n";

?>

<h2>Example 3: Order with Payment Status</h2>

<pre><code class="language-php">
&lt;?php
// Step 1: Create order with payment_status = 'pending'
$stmt = $pdo->prepare('INSERT INTO orders (...) VALUES (...)');
// (see Example 2)

// Step 2: Process payment (using payment gateway)
$paymentGateway = new PaymentProcessor();
$paymentResult = $paymentGateway->charge(
    amount: $prepared['total'],
    currency: 'EGP',
    card: $_POST['card_number'],
    name: $prepared['customer_name']
);

// Step 3: Update payment status
if ($paymentResult['success']) {
    $stmt = $pdo->prepare('UPDATE orders SET payment_status = ? WHERE order_id = ?');
    $stmt->execute(['completed', $prepared['order_id']]);
    
    // Log successful payment
    logActivity('payment_completed', [
        'item_id' => $prepared['order_id'],
        'action' => 'Payment processed successfully'
    ]);
    
    sendSuccess(['message' => 'Payment successful']);
} else {
    // Update as failed
    $stmt = $pdo->prepare('UPDATE orders SET payment_status = ? WHERE order_id = ?');
    $stmt->execute(['failed', $prepared['order_id']]);
    
    sendError('Payment failed: ' . $paymentResult['error']);
}
?>
</code></pre>

<?php

// ==================== Example 4: Handling Complex Items ====================

echo "\n<!-- EXAMPLE 4: Complex Order Items -->\n";

?>

<h2>Example 4: Orders with Multiple Items and Customizations</h2>

<pre><code class="language-javascript">
// Order with multiple complex items
const complexOrder = {
    orderId: 'ORD-' + Date.now(),
    customerName: 'محمد علي',
    customerPhone: '201001234567',
    items: [
        {
            id: 'combo-1',
            name: 'وجبة برجر + مشروب',
            quantity: 1,
            basePrice: 99.00,
            customizations: [
                { name: 'حجم وجبة', value: 'large', price: 10 },
                { name: 'إضافات', value: ['جبنة', 'بيكون'], price: 15 }
            ],
            subtotal: 124.00
        },
        {
            id: 'pizza-1',
            name: 'بيتزا ديلوكس',
            quantity: 1,
            basePrice: 120.00,
            customizations: [
                { name: 'حجم', value: 'large', price: 20 },
                { name: 'طاقم توصيل', value: 'true', price: 0 }
            ],
            subtotal: 140.00
        }
    ],
    subtotal: 264.00,
    shipping: 15.00,
    discount: 10.00,
    total: 269.00
};

fetch('/api/order.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(complexOrder)
})
.then(r => r.json())
.then(data => {
    if (data.success) {
        console.log('Order created:', data.orderId);
    }
});
</code></pre>

<?php

// ==================== Example 5: Error Handling ====================

echo "\n<!-- EXAMPLE 5: Error Handling -->\n";

?>

<h2>Example 5: Comprehensive Error Handling</h2>

<pre><code class="language-javascript">
async function createOrderWithErrorHandling() {
    const orderData = { /* ... */ };
    
    try {
        const response = await fetch('/api/order.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData),
            timeout: 5000 // 5 second timeout
        });

        // Check HTTP status
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // Check API response
        if (!data.success) {
            // Handle specific error types
            if (data.message.includes('Invalid phone')) {
                alert('رقم الهاتف غير صحيح. استخدم صيغة مصرية: 201001234567');
            } else if (data.message.includes('duplicate')) {
                alert('رقم الطلب موجود بالفعل');
            } else {
                alert('خطأ: ' + data.message);
            }
            return false;
        }

        // Success
        alert('✅ تم إنشاء الطلب: ' + data.orderId);
        return true;

    } catch (error) {
        if (error.name === 'TypeError') {
            alert('❌ خطأ في الشبكة - تحقق من الاتصال');
        } else if (error.message.includes('timeout')) {
            alert('❌ انتهت مهلة انتظار الخادم');
        } else {
            alert('❌ حدث خطأ: ' + error.message);
        }
        return false;
    }
}
</code></pre>

<?php

// ==================== Example 6: Database Query Examples ====================

echo "\n<!-- EXAMPLE 6: Common Database Queries -->\n";

?>

<h2>Example 6: Database Queries for Orders</h2>

<pre><code class="language-php">
&lt;?php
require 'api/db.php';

// Query 1: Get all orders
$stmt = $pdo->query('SELECT * FROM orders ORDER BY created_at DESC');
$orders = $stmt->fetchAll();

// Query 2: Get orders by status
$stmt = $pdo->prepare('SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC');
$stmt->execute(['جديد']);
$newOrders = $stmt->fetchAll();

// Query 3: Get total sales by date
$stmt = $pdo->query('
    SELECT DATE(created_at) as date, COUNT(*) as count, SUM(total) as revenue
    FROM orders
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
    GROUP BY DATE(created_at)
    ORDER BY date DESC
');
$dailyStats = $stmt->fetchAll();

// Query 4: Get top customers
$stmt = $pdo->query('
    SELECT customer_phone, customer_name, COUNT(*) as order_count, SUM(total) as total_spent
    FROM orders
    GROUP BY customer_phone
    ORDER BY total_spent DESC
    LIMIT 10
');
$topCustomers = $stmt->fetchAll();

// Query 5: Get recent activity log
$stmt = $pdo->query('
    SELECT * FROM activity_logs
    ORDER BY created_at DESC
    LIMIT 50
');
$activityLog = $stmt->fetchAll();
?>
</code></pre>

<?php

// ==================== Info Section ====================

echo "\n<!-- Information Section -->\n";

?>

<h2>✅ Implementation Checklist</h2>

<ul>
    <li>✅ Database schema created and tables populated</li>
    <li>✅ PDO connection with error handling</li>
    <li>✅ Input validation and sanitization functions</li>
    <li>✅ Rate limiting (30 requests/minute)</li>
    <li>✅ Activity logging to database</li>
    <li>✅ Security headers (XSS, CSRF protection)</li>
    <li>✅ Phone number validation (Egyptian format)</li>
    <li>✅ Email validation</li>
    <li>✅ Monetary amount validation</li>
    <li>✅ Unique order ID handling</li>
    <li>✅ Admin authentication</li>
    <li>✅ API secret support</li>
    <li>✅ Order update functionality</li>
    <li>✅ Error logging to file</li>
    <li>✅ CORS headers for cross-origin requests</li>
</ul>

<h2>🚀 Next Steps</h2>

<ol>
    <li>Copy <code>api/config.php.example</code> to <code>api/config.php</code></li>
    <li>Update database credentials in <code>api/config.php</code></li>
    <li>Run <code>schema.sql</code> in phpMyAdmin</li>
    <li>Test connection at <code>api/test.php</code></li>
    <li>Integrate order creation in your frontend</li>
    <li>Test with example data</li>
    <li>Monitor activity logs in database</li>
    <li>Review error logs in <code>logs/errors.log</code></li>
</ol>

<h2>📚 Available Endpoints</h2>

<table border="1" cellpadding="10">
    <tr>
        <th>Endpoint</th>
        <th>Method</th>
        <th>Purpose</th>
        <th>Auth</th>
    </tr>
    <tr>
        <td>/api/order.php</td>
        <td>POST</td>
        <td>Create new order</td>
        <td>None</td>
    </tr>
    <tr>
        <td>/api/order.php</td>
        <td>POST</td>
        <td>Update order status (action=update)</td>
        <td>Admin/API Secret</td>
    </tr>
    <tr>
        <td>/api/orders.php</td>
        <td>GET</td>
        <td>Get all orders</td>
        <td>Admin/API Secret</td>
    </tr>
    <tr>
        <td>/api/test.php</td>
        <td>GET</td>
        <td>Test database connection</td>
        <td>None</td>
    </tr>
    <tr>
        <td>/api/stats.php</td>
        <td>GET</td>
        <td>Get order statistics</td>
        <td>Admin/API Secret</td>
    </tr>
</table>

<h2>🔗 Useful Links</h2>

<ul>
    <li><a href="/api/test.php">Test Database Connection</a></li>
    <li><a href="BACKEND_SETUP.md">Backend Setup Guide</a></li>
    <li><a href="/admin/login.php">Admin Login</a></li>
</ul>

<?php

// ==================== Summary ====================
echo "\n<!-- 
    SUMMARY:
    
    This file contains examples of how to use the My Order backend API.
    
    1. Database: MySQL with PDO (secure)
    2. Tables: users, products, orders, activity_logs, etc.
    3. Validation: Phone, email, amounts, lengths
    4. Security: Input sanitization, rate limiting, CORS headers
    5. Logging: Activity logs + error logs
    
    All functions are in api/functions.php and api/helpers.php
    
    Start implementing by creating an order through the /api/order.php endpoint
-->\n";

?>
