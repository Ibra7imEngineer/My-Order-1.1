<?php
// Database configuration - القيم الافتراضية
$DB_HOST = '127.0.0.1';
$DB_NAME = 'myorder';
$DB_USER = 'root';
$DB_PASS = '';

// Try to load user config if present (copy api/config.php.example -> api/config.php)
$userConfig = __DIR__ . '/config.php';
if (file_exists($userConfig)) {
    include $userConfig; // this file may override $DB_HOST, $DB_NAME, $DB_USER, $DB_PASS, $RESTRO_WEBHOOK, $ADMIN_USERNAME, $ADMIN_PASSWORD, $API_SECRET
}

// Admin credentials (change before production)
$ADMIN_USERNAME = 'admin';
$ADMIN_PASSWORD = '12345'; // يمكنك تغييره هنا

// Simple API secret for programmatic access (optional)
$API_SECRET = '';

// Optional: webhook URL to forward orders to RestroAdmin or other panel
$RESTRO_WEBHOOK = ''; // مثال: https://your-restroadmin.example/webhook

try {
    $dsn = "mysql:host={$DB_HOST};dbname={$DB_NAME};charset=utf8mb4";
    $pdo = new PDO($dsn, $DB_USER, $DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false, // use native prepares for security
    ]);
} catch (Exception $e) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['success' => false, 'message' => 'DB connection failed', 'error' => $e->getMessage()]);
    exit;
}

// start session for admin auth
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// expose config array for includes
$order_config = [
    'restro_webhook' => $RESTRO_WEBHOOK,
    'admin_username' => $ADMIN_USERNAME,
    'admin_password' => $ADMIN_PASSWORD,
    'api_secret' => $API_SECRET,
];

function is_admin_authenticated() {
    return isset($_SESSION['is_admin']) && $_SESSION['is_admin'] === true;
}

// ========== نظام التسجيل الشامل ==========

/**
 * تسجيل الأنشطة والعمليات
 */
function log_activity($activity_type, $action, $options = []) {
    global $pdo;
    
    try {
        $user_type = $options['user_type'] ?? 'customer';
        $user_id = $options['user_id'] ?? null;
        $user_name = $options['user_name'] ?? null;
        $user_ip = $options['user_ip'] ?? $_SERVER['REMOTE_ADDR'];
        $item_id = $options['item_id'] ?? null;
        $item_name = $options['item_name'] ?? null;
        $old_value = $options['old_value'] ?? null;
        $new_value = $options['new_value'] ?? null;
        $status = $options['status'] ?? 'success';
        
        $stmt = $pdo->prepare("
            INSERT INTO activity_logs 
            (activity_type, user_type, user_id, user_name, user_ip, item_id, item_name, action, old_value, new_value, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ");
        
        return $stmt->execute([
            $activity_type,
            $user_type,
            $user_id,
            $user_name,
            $user_ip,
            $item_id,
            $item_name,
            $action,
            is_array($old_value) ? json_encode($old_value, JSON_UNESCAPED_UNICODE) : $old_value,
            is_array($new_value) ? json_encode($new_value, JSON_UNESCAPED_UNICODE) : $new_value,
            $status
        ]);
    } catch (Exception $e) {
        error_log("Log activity error: " . $e->getMessage());
        return false;
    }
}

/**
 * تسجيل جلسات المستخدمين
 */
function log_user_session($user_type, $user_id, $user_name, $action = 'login', $status = 'success') {
    global $pdo;
    
    try {
        $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? '';
        $user_ip = $_SERVER['REMOTE_ADDR'];
        
        $stmt = $pdo->prepare("
            INSERT INTO user_sessions 
            (user_type, user_id, user_name, user_ip, user_agent, action, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        ");
        
        return $stmt->execute([
            $user_type,
            $user_id,
            $user_name,
            $user_ip,
            $user_agent,
            $action,
            $status
        ]);
    } catch (Exception $e) {
        error_log("Log session error: " . $e->getMessage());
        return false;
    }
}

/**
 * تسجيل تاريخ تغييرات الطلبات
 */
function log_order_history($order_id, $action, $old_status = null, $new_status = null, $changed_by = null, $reason = null) {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare("
            INSERT INTO order_history 
            (order_id, action, old_status, new_status, changed_by, change_reason, created_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        ");
        
        return $stmt->execute([
            $order_id,
            $action,
            $old_status,
            $new_status,
            $changed_by,
            $reason
        ]);
    } catch (Exception $e) {
        error_log("Log order history error: " . $e->getMessage());
        return false;
    }
}

/**
 * تسجيل تفاصيل المبيعات
 */
function log_sale($order_id, $product_id, $product_name, $quantity, $unit_price, $total_price, $customer_name, $payment_method = null) {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare("
            INSERT INTO sales_log 
            (order_id, product_id, product_name, quantity, unit_price, total_price, customer_name, payment_method, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
        ");
        
        return $stmt->execute([
            $order_id,
            $product_id,
            $product_name,
            $quantity,
            $unit_price,
            $total_price,
            $customer_name,
            $payment_method
        ]);
    } catch (Exception $e) {
        error_log("Log sale error: " . $e->getMessage());
        return false;
    }
}

/**
 * الحصول على سجل الأنشطة
 */
function get_activity_logs($limit = 100, $user_type = null, $activity_type = null) {
    global $pdo;
    
    try {
        $query = "SELECT * FROM activity_logs WHERE 1=1";
        $params = [];
        
        if ($user_type) {
            $query .= " AND user_type = ?";
            $params[] = $user_type;
        }
        
        if ($activity_type) {
            $query .= " AND activity_type = ?";
            $params[] = $activity_type;
        }
        
        $query .= " ORDER BY created_at DESC LIMIT ?";
        $params[] = (int)$limit;
        
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        
        return $stmt->fetchAll();
    } catch (Exception $e) {
        error_log("Get activity logs error: " . $e->getMessage());
        return [];
    }
}

/**
 * الحصول على سجل الطلب
 */
function get_order_history($order_id) {
    global $pdo;
    
    try {
        $stmt = $pdo->prepare("
            SELECT * FROM order_history 
            WHERE order_id = ?
            ORDER BY created_at DESC
        ");
        $stmt->execute([$order_id]);
        
        return $stmt->fetchAll();
    } catch (Exception $e) {
        error_log("Get order history error: " . $e->getMessage());
        return [];
    }
}

/**
 * الحصول على إحصائيات المبيعات
 */
function get_sales_statistics($start_date = null, $end_date = null) {
    global $pdo;
    
    try {
        $query = "
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as total_orders,
                SUM(total_price) as total_sales,
                AVG(total_price) as avg_sale,
                COUNT(DISTINCT customer_name) as unique_customers
            FROM sales_log
            WHERE 1=1
        ";
        $params = [];
        
        if ($start_date) {
            $query .= " AND DATE(created_at) >= ?";
            $params[] = $start_date;
        }
        
        if ($end_date) {
            $query .= " AND DATE(created_at) <= ?";
            $params[] = $end_date;
        }
        
        $query .= " GROUP BY DATE(created_at) ORDER BY date DESC";
        
        $stmt = $pdo->prepare($query);
        $stmt->execute($params);
        
        return $stmt->fetchAll();
    } catch (Exception $e) {
        error_log("Get sales statistics error: " . $e->getMessage());
        return [];
    }
}

