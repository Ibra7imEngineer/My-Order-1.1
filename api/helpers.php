<?php
/**
 * My Order - Additional Helper Functions
 * مساعدات إضافية للعميليات الشائعة
 */

/**
 * التحقق من وجود الحقول المطلوبة
 * Validate that all required fields are present
 * 
 * @param array $data البيانات
 * @param array $required الحقول المطلوبة
 * @param array &$errors مصفوفة الأخطاء (by reference)
 * @return bool
 */
function validateRequired($data, $required, &$errors = []) {
    $errors = [];
    
    foreach ($required as $field) {
        if (!isset($data[$field]) || $data[$field] === '' || $data[$field] === null) {
            $errors[] = "الحقل '$field' مطلوب";
        }
    }
    
    return empty($errors);
}

/**
 * التحقق من صحة جميع بيانات الطلب
 * Validate complete order data
 * 
 * @param array $data بيانات الطلب
 * @return array ['valid' => bool, 'errors' => array]
 */
function validateOrderData($data) {
    $errors = [];
    
    // Check required fields
    $required = ['orderId', 'customerName', 'customerPhone', 'items', 'subtotal', 'total'];
    if (!validateRequired($data, $required, $reqErrors)) {
        $errors = array_merge($errors, $reqErrors);
    }
    
    // Validate phone
    if (!empty($data['customerPhone']) && !validatePhone($data['customerPhone'])) {
        $errors[] = 'صيغة رقم الهاتف غير صحيحة';
    }
    
    // Validate email if provided
    if (!empty($data['customerEmail']) && !validateEmail($data['customerEmail'])) {
        $errors[] = 'صيغة البريد الإلكتروني غير صحيحة';
    }
    
    // Validate amounts
    if (!validateAmount($data['subtotal'] ?? 0)) {
        $errors[] = 'المبلغ الفرعي يجب أن يكون رقماً موجباً';
    }
    if (!validateAmount($data['shipping'] ?? 0)) {
        $errors[] = 'رسوم الشحن يجب أن تكون رقماً موجباً';
    }
    if (!validateAmount($data['total'] ?? 0)) {
        $errors[] = 'المبلغ الإجمالي يجب أن يكون رقماً موجباً';
    }
    
    // Validate items array
    if (!is_array($data['items']) && !is_string($data['items'])) {
        $errors[] = 'البيانات الصحيحة: items يجب أن تكون مصفوفة أو JSON';
    }
    
    if (is_array($data['items']) && empty($data['items'])) {
        $errors[] = 'الطلب يجب أن يحتوي على عنصر واحد على الأقل';
    }
    
    // Validate name length
    if (!empty($data['customerName']) && !validateLength($data['customerName'], 2, 100)) {
        $errors[] = 'اسم العميل يجب أن يكون بين 2 و 100 حرف';
    }
    
    return [
        'valid' => empty($errors),
        'errors' => $errors
    ];
}

/**
 * تحويل أرقام عربية إلى إنجليزية
 * Convert Arabic numerals to English
 * 
 * @param string $number الرقم
 * @return string
 */
function arabicToEnglishNumbers($number) {
    $arabic = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    $english = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    return str_replace($arabic, $english, $number);
}

/**
 * تحويل أرقام إنجليزية إلى عربية
 * Convert English numerals to Arabic
 * 
 * @param string $number الرقم
 * @return string
 */
function englishToArabicNumbers($number) {
    $english = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
    $arabic = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
    return str_replace($english, $arabic, $number);
}

/**
 * تشفير البيانات الحساسة
 * Encode sensitive data (basic)
 * Note: Use proper encryption for production
 * 
 * @param string $data البيانات
 * @param string $key المفتاح
 * @return string
 */
function encodeData($data, $key = null) {
    if ($key === null) {
        $key = $_SERVER['APP_KEY'] ?? 'default-key';
    }
    return base64_encode($data . sha1($data . $key));
}

/**
 * فك تشفير البيانات الحساسة
 * Decode sensitive data
 * 
 * @param string $encoded البيانات المشفرة
 * @param string $key المفتاح
 * @return string|false
 */
function decodeData($encoded, $key = null) {
    if ($key === null) {
        $key = $_SERVER['APP_KEY'] ?? 'default-key';
    }
    $decoded = base64_decode($encoded, true);
    if ($decoded === false) {
        return false;
    }
    return $decoded;
}

/**
 * إنشاء CSRF token
 * Generate CSRF token
 * 
 * @return string
 */
function generateCsrfToken() {
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

/**
 * التحقق من صحة CSRF token
 * Verify CSRF token
 * 
 * @param string $token التوكن
 * @return bool
 */
function verifyCsrfToken($token) {
    return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
}

/**
 * معلومات جنرال
 * Get application info
 * 
 * @return array
 */
function getAppInfo() {
    return [
        'name' => 'My Order',
        'version' => '1.0.0',
        'author' => 'Your Name',
        'description' => 'نظام إدارة الطلبات | Order Management System',
        'php_version' => phpversion(),
        'server_time' => date('Y-m-d H:i:s'),
        'locale' => 'ar_EG',
    ];
}

/**
 * التحقق من الاتصال بقاعدة البيانات
 * Check database connection
 * 
 * @return bool
 */
function checkDbConnection() {
    global $pdo;
    
    try {
        $pdo->query('SELECT 1')->fetch();
        return true;
    } catch (Exception $e) {
        logError('Database connection failed: ' . $e->getMessage());
        return false;
    }
}

/**
 * الحصول على معلومات الخادم
 * Get server information
 * 
 * @return array
 */
function getServerInfo() {
    return [
        'os' => php_uname(),
        'software' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
        'document_root' => $_SERVER['DOCUMENT_ROOT'] ?? 'Unknown',
        'script_filename' => $_SERVER['SCRIPT_FILENAME'] ?? 'Unknown',
        'max_upload_size' => ini_get('upload_max_filesize'),
        'max_post_size' => ini_get('post_max_size'),
        'memory_limit' => ini_get('memory_limit'),
        'database_connected' => checkDbConnection(),
    ];
}

?>
