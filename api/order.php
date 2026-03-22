<?php
/**
 * My Order - Order API
 * ✨ جودة 5 نجوم | ⚡ سرعة عالية | 🔐 أمان مضمون
 */

// Security Headers
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only allow POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);
    exit;
}

// Rate Limiting - Simple implementation
$rateLimitFile = __DIR__ . '/../.rate_limit';
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$now = time();
$limit = 30; // requests per minute
$window = 60; // seconds

if (file_exists($rateLimitFile)) {
    $rateData = json_decode(file_get_contents($rateLimitFile), true);
} else {
    $rateData = [];
}

// Clean old entries
$rateData = array_filter($rateData, function($timestamp) use ($now, $window) {
    return ($now - $timestamp) < $window;
});

// Check rate limit
if (isset($rateData[$ip]) && count($rateData[$ip]) >= $limit) {
    http_response_code(429);
    echo json_encode(['success' => false, 'message' => 'Too many requests. Please try again later.']);
    exit;
}

// Add current request
$rateData[$ip][] = $now;
file_put_contents($rateLimitFile, json_encode($rateData));

// Database connection
require __DIR__ . '/db.php';

// Get input data
$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!$data || !is_array($data)) {
    $data = $_POST;
}

// Input Validation & Sanitization
function sanitizeInput($data) {
    if (is_array($data)) {
        return array_map('sanitizeInput', $data);
    }
    return htmlspecialchars(trim($data), ENT_QUOTES, 'UTF-8');
}

function validatePhone($phone) {
    // Egyptian phone format
    return preg_match('/^20[1-9][0-9]{9}$/', preg_replace('/[^0-9]/', '', $phone));
}

function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

// Sanitize data
$data = sanitizeInput($data);

// Required fields
$required = ['orderId', 'customerName', 'customerPhone', 'items', 'subtotal', 'shipping', 'total'];
foreach ($required as $r) {
    if (!isset($data[$r]) || $data[$r] === '') {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Missing field: ' . $r]);
        exit;
    }
}

// Validate phone number
$cleanPhone = preg_replace('/[^0-9]/', '', $data['customerPhone']);
if (!validatePhone($cleanPhone)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid phone number format']);
    exit;
}

// Validate email if provided
if (isset($data['customerEmail']) && !empty($data['customerEmail'])) {
    if (!validateEmail($data['customerEmail'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid email format']);
        exit;
    }
}

// Validate numeric values
$subtotal = (float)$data['subtotal'];
$shipping = (float)$data['shipping'];
$total = (float)$data['total'];

if ($subtotal < 0 || $shipping < 0 || $total < 0) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid price values']);
    exit;
}

// Validate items
if (!is_array($data['items']) || empty($data['items'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Order must contain at least one item']);
    exit;
}

// Sanitize strings
$order_id = substr(preg_replace('/[^a-zA-Z0-9\-_]/', '', $data['orderId']), 0, 60);
$customer_name = substr(trim($data['customerName']), 0, 100);
$customer_phone = $cleanPhone;
$customer_address = isset($data['customerAddress']) ? substr(trim($data['customerAddress']), 0, 300) : '';
$customer_email = isset($data['customerEmail']) ? filter_var(trim($data['customerEmail']), FILTER_SANITIZE_EMAIL) : '';

$items_json = is_string($data['items']) ? $data['items'] : json_encode($data['items'], JSON_UNESCAPED_UNICODE);
$status = isset($data['status']) ? substr(trim($data['status']), 0, 30) : 'جديد';

// Insert order
try {
    $stmt = $pdo->prepare('INSERT INTO orders (order_id, customer_name, customer_phone, customer_email, customer_address, items, subtotal, shipping, total, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())');
    $stmt->execute([$order_id, $customer_name, $customer_phone, $customer_email, $customer_address, $items_json, $subtotal, $shipping, $total, $status]);
    $insertId = $pdo->lastInsertId();
    
    // Log order creation
    log_activity('order_created', "طلب جديد: $order_id", [
        'user_type' => 'customer',
        'user_name' => $customer_name,
        'item_id' => $order_id,
        'new_value' => ['customer' => $customer_name, 'phone' => $customer_phone, 'total' => $total],
        'status' => 'success'
    ]);
    
    // Log each product sale
    $items = is_array($data['items']) ? $data['items'] : json_decode($items_json, true);
    if (is_array($items)) {
        foreach ($items as $item) {
            $itemId = isset($item['id']) ? (int)$item['id'] : 0;
            $itemName = isset($item['name']) ? substr($item['name'], 0, 100) : 'منتج';
            $itemQty = isset($item['quantity']) ? (int)$item['quantity'] : 1;
            $itemPrice = isset($item['price']) ? (float)$item['price'] : 0;
            $itemTotal = $itemPrice * $itemQty;
            
            log_sale(
                $order_id,
                $itemId,
                $itemName,
                $itemQty,
                $itemPrice,
                $itemTotal,
                $customer_name,
                $data['paymentMethod'] ?? null
            );
        }
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to create order', 'error' => 'Server error']);
    error_log("Order error: " . $e->getMessage());
    exit;
}

$response = [
    'success' => true, 
    'insertId' => $insertId, 
    'orderId' => $order_id,
    'message' => 'Order created successfully'
];

// Forward to webhook if configured
if (!empty($order_config['restro_webhook'])) {
    $ch = curl_init($order_config['restro_webhook']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['order' => $data], JSON_UNESCAPED_UNICODE));
    curl_setopt($ch, CURLOPT_TIMEOUT, 5);
    $whResp = curl_exec($ch);
    $err = curl_error($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $response['webhook'] = ['httpCode' => $httpCode, 'success' => ($httpCode === 200)];
}

echo json_encode($response, JSON_UNESCAPED_UNICODE);
