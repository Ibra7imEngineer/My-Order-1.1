<?php
/**
 * My Order - Helper Functions
 * ✨ Clean Code | 🔐 Security First | 🚀 Performance Optimized
 * 
 * يحتوي على دوال التنظيف والتحقق من البيانات والمصادقة
 */

// ==================== Data Sanitization ====================

/**
 * تنظيف وتطهير البيانات النصية
 * Sanitize text input to prevent XSS attacks
 * 
 * @param string $input البيانات المدخلة
 * @return string البيانات المطهرة
 */
function sanitizeText($input) {
    if (!is_string($input)) {
        return $input;
    }
    return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
}

/**
 * تنظيف البيانات من نوع Array
 * Sanitize array recursively
 * 
 * @param array $data المصفوفة المدخلة
 * @return array البيانات المطهرة
 */
function sanitizeArray($data) {
    if (!is_array($data)) {
        return sanitizeText((string)$data);
    }
    
    return array_map(function($value) {
        if (is_array($value)) {
            return sanitizeArray($value);
        }
        return sanitizeText((string)$value);
    }, $data);
}

/**
 * تنظيف رقم الهاتف (إزالة الرموز غير الضرورية)
 * Sanitize phone number - remove all non-digits
 * 
 * @param string $phone رقم الهاتف
 * @return string رقم الهاتف المنظف
 */
function sanitizePhone($phone) {
    return preg_replace('/[^0-9+]/', '', $phone);
}

/**
 * تنظيف البريد الإلكتروني
 * Sanitize email address
 * 
 * @param string $email البريد الإلكتروني
 * @return string البريد الإلكتروني المطهر
 */
function sanitizeEmail($email) {
    return filter_var(trim($email), FILTER_SANITIZE_EMAIL);
}

// ==================== Validation Functions ====================

/**
 * التحقق من صحة رقم الهاتف (صيغة مصرية)
 * Validate Egyptian phone number format
 * Accepts: 201xxxxxxxxx, 01xxxxxxxxx, +201xxxxxxxxx
 * 
 * @param string $phone رقم الهاتف
 * @return bool صحة الرقم
 */
function validatePhone($phone) {
    $cleanPhone = preg_replace('/[^0-9]/', '', $phone);
    
    // Check Egyptian numbers (11 digits starting with 1 or 10 digits with country code 20)
    if (strlen($cleanPhone) === 11 && $cleanPhone[0] === '1') {
        return preg_match('/^1[0-9]{10}$/', $cleanPhone);
    }
    if (strlen($cleanPhone) === 12 && substr($cleanPhone, 0, 2) === '20') {
        return preg_match('/^20[0-9]{10}$/', $cleanPhone);
    }
    
    return false;
}

/**
 * التحقق من صحة البريد الإلكتروني
 * Validate email address format
 * 
 * @param string $email البريد الإلكتروني
 * @return bool صحة البريد
 */
function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

/**
 * التحقق من صحة مبلغ مالي
 * Validate monetary amount - must be non-negative number
 * 
 * @param mixed $amount المبلغ
 * @return bool صحة المبلغ
 */
function validateAmount($amount) {
    $num = (float)$amount;
    return is_numeric($amount) && $num >= 0;
}

/**
 * التحقق من أن القيمة ليست فارغة
 * Check if value is not empty/null
 * 
 * @param mixed $value القيمة
 * @return bool
 */
function isNotEmpty($value) {
    if (is_array($value)) {
        return count($value) > 0;
    }
    return !empty(trim((string)$value));
}

/**
 * التحقق من طول النص
 * Validate text length
 * 
 * @param string $text النص
 * @param int $minLength الحد الأدنى للطول
 * @param int $maxLength الحد الأقصى للطول
 * @return bool
 */
function validateLength($text, $minLength = 1, $maxLength = 255) {
    $len = strlen(trim($text));
    return $len >= $minLength && $len <= $maxLength;
}

// ==================== Authentication Functions ====================

/**
 * التحقق من تسجيل الدخول (Admin)
 * Check if user is authenticated as admin
 * 
 * @return bool
 */
function isAdminAuthenticated() {
    return isset($_SESSION['is_admin']) && $_SESSION['is_admin'] === true;
}

/**
 * التحقق من أن المستخدم مسؤول
 * Verify admin credentials
 * 
 * @param string $username اسم المستخدم
 * @param string $password كلمة المرور
 * @return bool
 */
function verifyAdminCredentials($username, $password) {
    global $order_config;
    
    // Use hash_equals for timing-safe comparison
    return hash_equals($order_config['admin_username'], $username) && 
           hash_equals($order_config['admin_password'], $password);
}

/**
 * التحقق من سر API
 * Verify API secret
 * 
 * @param string $providedSecret السر المقدم
 * @return bool
 */
function verifyApiSecret($providedSecret) {
    global $order_config;
    
    if (empty($order_config['api_secret'])) {
        return false;
    }
    
    return hash_equals($order_config['api_secret'], $providedSecret);
}

/**
 * التحقق من التفويض (إما مسؤول أو سر API)
 * Check authorization - either admin or API secret
 * 
 * @return bool
 */
function isAuthorized() {
    // Check admin session
    if (isAdminAuthenticated()) {
        return true;
    }
    
    // Check API secret from GET/POST
    $apiSecret = $_GET['api_secret'] ?? $_POST['api_secret'] ?? $_SERVER['HTTP_X_API_SECRET'] ?? '';
    
    return !empty($apiSecret) && verifyApiSecret($apiSecret);
}

// ==================== Request Utilities ====================

/**
 * الحصول على بيانات الطلب (JSON أو POST)
 * Get request data from JSON body or POST
 * 
 * @return array
 */
function getRequestData() {
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
    
    // Try JSON first
    if (stripos($contentType, 'application/json') !== false) {
        $raw = file_get_contents('php://input');
        $data = json_decode($raw, true);
        if (is_array($data)) {
            return $data;
        }
    }
    
    // Fall back to POST
    return $_POST;
}

/**
 * الحصول على IP العميل
 * Get client's IP address
 * 
 * @return string
 */
function getClientIp() {
    // Check for IP from shared internet
    if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
        $ip = $_SERVER['HTTP_CLIENT_IP'];
    }
    // Check for IP passed from proxy
    elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $ip = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'])[0];
    }
    // Check for remote address
    else {
        $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    }
    
    // Validate IP
    return filter_var($ip, FILTER_VALIDATE_IP) ?: '0.0.0.0';
}

// ==================== Database Utilities ====================

/**
 * إنشاء معرّف فريد للطلب
 * Generate unique order ID
 * Format: ORD-TIMESTAMP-RANDOM
 * 
 * @return string
 */
function generateOrderId() {
    $timestamp = time();
    $random = strtoupper(substr(uniqid(), -6));
    return sprintf('ORD-%d-%s', $timestamp, $random);
}

/**
 * تحضير رقم الهاتف (تحويل لصيغة موحدة)
 * Normalize phone number to standard format
 * 
 * @param string $phone رقم الهاتف
 * @return string
 */
function normalizePhone($phone) {
    $clean = preg_replace('/[^0-9]/', '', $phone);
    
    // Convert to 20xxx format (international)
    if (strlen($clean) === 11 && $clean[0] === '1') {
        $clean = '20' . substr($clean, 1);
    }
    
    return $clean;
}

/**
 * تحويل العملة (صيغة عددية إلى نصية مع العملة)
 * Format currency for display
 * 
 * @param float $amount المبلغ
 * @param string $currency الرمز (default: EGP)
 * @return string
 */
function formatCurrency($amount, $currency = 'EGP') {
    return number_format((float)$amount, 2, '.', ',') . ' ' . $currency;
}

// ==================== Logging Functions ====================

/**
 * تسجيل الأنشطة في قاعدة البيانات
 * Log activity to database
 * 
 * @param string $activityType نوع النشاط (order_created, order_updated, etc)
 * @param array $data بيانات إضافية
 * @return void
 */
function logActivity($activityType, $data = []) {
    global $pdo;
    
    try {
        $userType = isAdminAuthenticated() ? 'admin' : 'customer';
        $userId = $data['user_id'] ?? null;
        $userName = $data['user_name'] ?? null;
        $userIp = $data['user_ip'] ?? getClientIp();
        $action = $data['action'] ?? '';
        $itemId = $data['item_id'] ?? null;
        $itemName = $data['item_name'] ?? null;
        $status = $data['status'] ?? null;
        $oldValue = isset($data['old_value']) ? json_encode($data['old_value'], JSON_UNESCAPED_UNICODE) : null;
        $newValue = isset($data['new_value']) ? json_encode($data['new_value'], JSON_UNESCAPED_UNICODE) : null;
        
        $stmt = $pdo->prepare(
            'INSERT INTO activity_logs 
            (activity_type, user_type, user_id, user_name, user_ip, item_id, item_name, action, old_value, new_value, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())'
        );
        
        $stmt->execute([
            $activityType,
            $userType,
            $userId,
            $userName,
            $userIp,
            $itemId,
            $itemName,
            $action,
            $oldValue,
            $newValue,
            $status
        ]);
    } catch (Exception $e) {
        // Log to file if database fails
        error_log('Activity logging failed: ' . $e->getMessage());
    }
}

/**
 * تسجيل الأخطاء
 * Log errors safely
 * 
 * @param string $message رسالة الخطأ
 * @param string $context السياق
 * @return void
 */
function logError($message, $context = 'general') {
    $logFile = __DIR__ . '/../logs/errors.log';
    $timestamp = date('Y-m-d H:i:s');
    $ip = getClientIp();
    
    $logMessage = sprintf(
        "[%s] [%s] [%s] %s\n",
        $timestamp,
        $context,
        $ip,
        $message
    );
    
    // Create logs directory if it doesn't exist
    @mkdir(dirname($logFile), 0755, true);
    
    error_log($logMessage, 3, $logFile);
}

// ==================== Response Utilities ====================

/**
 * إرسال استجابة JSON ناجحة
 * Send success JSON response
 * 
 * @param array $data البيانات المراد إرسالها
 * @param int $statusCode رمز HTTP
 * @return void
 */
function sendSuccess($data = [], $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    
    $response = ['success' => true];
    if (!empty($data)) {
        $response = array_merge($response, $data);
    }
    
    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/**
 * إرسال استجابة JSON خطأ
 * Send error JSON response
 * 
 * @param string $message رسالة الخطأ
 * @param int $statusCode رمز HTTP
 * @param array $extra بيانات إضافية
 * @return void
 */
function sendError($message, $statusCode = 400, $extra = []) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    
    $response = [
        'success' => false,
        'message' => $message
    ];
    
    if (!empty($extra)) {
        $response = array_merge($response, $extra);
    }
    
    echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

// ==================== Data Preparation ====================

/**
 * تحضير بيانات الطلب (Convert to database format)
 * Prepare order data for storage
 * 
 * @param array $input البيانات المدخلة
 * @return array البيانات المحضرة
 */
function prepareOrderData($input) {
    return [
        'order_id' => substr($input['orderId'] ?? $input['order_id'] ?? '', 0, 60),
        'customer_name' => substr(trim($input['customerName'] ?? $input['customer_name'] ?? ''), 0, 191),
        'customer_phone' => normalizePhone($input['customerPhone'] ?? $input['customer_phone'] ?? ''),
        'customer_email' => sanitizeEmail($input['customerEmail'] ?? $input['customer_email'] ?? ''),
        'customer_address' => substr(trim($input['customerAddress'] ?? $input['customer_address'] ?? ''), 0, 500),
        'items' => is_string($input['items'] ?? '') ? $input['items'] : json_encode($input['items'] ?? [], JSON_UNESCAPED_UNICODE),
        'subtotal' => (float)($input['subtotal'] ?? 0),
        'shipping' => (float)($input['shipping'] ?? 0),
        'total' => (float)($input['total'] ?? 0),
        'status' => substr(trim($input['status'] ?? 'جديد'), 0, 50),
        'notes' => substr(trim($input['notes'] ?? ''), 0, 500),
    ];
}

?>
