<?php
/**
 * My Order - Create/Update Order API
 * واجهة برمجية لإنشاء وتحديث الطلبات
 * ✨ جودة 5 نجوم | ⚡ سرعة عالية | 🔐 أمان مضمون
 */

// ==================== Headers & Security ====================
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-CSRF-Token');
header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: DENY');
header('X-XSS-Protection: 1; mode=block');
header('Strict-Transport-Security: max-age=31536000; includeSubDomains');

// Handle preflight CORS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    die(json_encode(['success' => false, 'message' => 'Method Not Allowed - Use POST']));
}

// ==================== Includes ====================
require __DIR__ . '/db.php';
require __DIR__ . '/functions.php';
require __DIR__ . '/helpers.php';

// ==================== Rate Limiting ====================
function checkRateLimit() {
    $ip = getClientIp();
    $window = 60; // seconds
    $limit = 30;  // requests per minute
    
    $cacheFile = __DIR__ . '/../.rate_limit_' . hash('sha256', $ip);
    $now = time();
    
    // Get current request count
    $count = 0;
    if (file_exists($cacheFile)) {
        $lastRequest = file_get_contents($cacheFile);
        $timestamp = (int)$lastRequest;
        
        if (($now - $timestamp) < $window) {
            $countFile = $cacheFile . '_count';
            if (file_exists($countFile)) {
                $count = (int)file_get_contents($countFile);
            }
            $count++;
        } else {
            $count = 1;
        }
    } else {
        $count = 1;
    }
    
    // Check limit
    if ($count > $limit) {
        return false;
    }
    
    // Store current request
    file_put_contents($cacheFile, $now);
    file_put_contents($cacheFile . '_count', $count);
    
    return true;
}

// Check rate limit
if (!checkRateLimit()) {
    http_response_code(429);
    sendError('الكثير من الطلبات. يرجى المحاولة مرة أخرى لاحقاً.', 429);
}

// ==================== Get & Process Input ====================
$input = getRequestData();

// If empty, try URL encoded
if (empty($input) && !empty($_POST)) {
    $input = $_POST;
}

// Sanitize input
$input = sanitizeArray($input);

// ==================== Determine Action ====================
$action = $input['action'] ?? 'create'; // 'create' or 'update'
$orderId = $input['orderId'] ?? $input['order_id'] ?? null;

// ==================== CREATE ORDER ====================
if ($action === 'create') {
    handleCreateOrder($input, $pdo);
}

// ==================== UPDATE ORDER (Admin Only) ====================
elseif ($action === 'update') {
    handleUpdateOrder($input, $pdo);
}

// ==================== Invalid Action ====================
else {
    sendError('إجراء غير معروف: ' . htmlspecialchars($action), 400);
}

// ==================== Handler Functions ====================

/**
 * Handle order creation
 */
function handleCreateOrder($input, $pdo) {
    // ---- Validate Required Fields ----
    $required = ['orderId', 'customerName', 'customerPhone', 'items', 'total'];
    
    $validation = validateOrderData($input);
    if (!$validation['valid']) {
        sendError('بيانات غير صحيحة: ' . implode(', ', $validation['errors']), 400);
    }
    
    // ---- Prepare Data ----
    $prepared = prepareOrderData($input);
    
    // Generate UUID for order
    $uuid = uniqid(bin2hex(random_bytes(8)), true);
    
    // ---- Insert Order ----
    try {
        $stmt = $pdo->prepare('
            INSERT INTO orders 
            (uuid, order_id, customer_name, customer_email, customer_phone, customer_address, 
             items, subtotal, shipping, total, status, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ');
        
        $executed = $stmt->execute([
            $uuid,
            $prepared['order_id'],
            $prepared['customer_name'],
            $prepared['customer_email'],
            $prepared['customer_phone'],
            $prepared['customer_address'],
            $prepared['items'],
            $prepared['subtotal'],
            $prepared['shipping'],
            $prepared['total'],
            $prepared['status'],
            $prepared['notes']
        ]);
        
        if (!$executed) {
            throw new Exception('Failed to execute insert query');
        }
        
        $orderId = $pdo->lastInsertId();
        
        // ---- Log Activity ----
        logActivity('order_created', [
            'item_id' => $prepared['order_id'],
            'item_name' => $prepared['order_id'],
            'user_name' => $prepared['customer_name'],
            'action' => 'New order created',
            'user_ip' => getClientIp(),
            'status' => $prepared['status']
        ]);
        
        // ---- Send Success Response ----
        sendSuccess([
            'message' => 'تم إنشاء الطلب بنجاح',
            'orderId' => $prepared['order_id'],
            'uuid' => $uuid,
            'databaseId' => $orderId,
            'total' => formatCurrency($prepared['total'])
        ], 201);
        
    } catch (Exception $e) {
        // Check if order ID already exists
        if (strpos($e->getMessage(), 'Duplicate') !== false || 
            strpos($e->getMessage(), 'UNIQUE') !== false) {
            
            logError('Duplicate order ID: ' . $prepared['order_id'], 'order_creation');
            sendError('معرف الطلب موجود بالفعل. الرجاء استخدام معرف فريد.', 409);
        }
        
        logError($e->getMessage(), 'order_creation');
        sendError('فشل إنشاء الطلب: ' . $e->getMessage(), 500);
    }
}

/**
 * Handle order update (Admin only)
 */
function handleUpdateOrder($input, $pdo) {
    // ---- Authorization Check ----
    if (!isAuthorized()) {
        http_response_code(401);
        sendError('غير مصرح. يرجى تسجيل الدخول.', 401);
    }
    
    // ---- Validate Order ID ----
    $orderId = $input['orderId'] ?? $input['order_id'] ?? null;
    
    if (empty($orderId)) {
        sendError('معرف الطلب مطلوب للتحديث', 400);
    }
    
    // ---- Get Current Order ----
    try {
        $stmt = $pdo->prepare('SELECT * FROM orders WHERE order_id = ? LIMIT 1');
        $stmt->execute([$orderId]);
        $order = $stmt->fetch();
        
        if (!$order) {
            sendError('الطلب غير موجود', 404);
        }
        
        // ---- Update Fields ----
        $newStatus = $input['status'] ?? $order['status'];
        $newNotes = $input['notes'] ?? $order['notes'];
        
        $stmt = $pdo->prepare('
            UPDATE orders 
            SET status = ?, notes = ?, updated_at = NOW()
            WHERE order_id = ?
            LIMIT 1
        ');
        
        $stmt->execute([$newStatus, $newNotes, $orderId]);
        
        // ---- Log Change ----
        logActivity('order_updated', [
            'item_id' => $orderId,
            'item_name' => 'Order ' . $orderId,
            'action' => 'Status updated',
            'user_name' => isAdminAuthenticated() ? 'Admin User' : 'API',
            'old_value' => $order['status'],
            'new_value' => $newStatus,
            'status' => $newStatus
        ]);
        
        // ---- Log in order_history ----
        $stmt = $pdo->prepare('
            INSERT INTO order_history (order_id, action, old_status, new_status, changed_by, change_reason)
            VALUES (?, ?, ?, ?, ?, ?)
        ');
        
        $stmt->execute([
            $orderId,
            'status_change',
            $order['status'],
            $newStatus,
            isAdminAuthenticated() ? 'admin' : 'api',
            $input['reason'] ?? null
        ]);
        
        // ---- Send Success Response ----
        sendSuccess([
            'message' => 'تم تحديث الطلب بنجاح',
            'orderId' => $orderId,
            'oldStatus' => $order['status'],
            'newStatus' => $newStatus
        ]);
        
    } catch (Exception $e) {
        logError($e->getMessage(), 'order_update');
        sendError('فشل تحديث الطلب', 500);
    }
}

?>
