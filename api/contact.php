<?php
// api/contact.php
// يتولى هذا السكربت استقبال بيانات نموذج "تواصل معنا" وإرسالها عبر بريد إلكتروني

require_once 'config.php'; // يحتوي على إعدادات قاعدة البيانات والبريد
// include db connection so we can store messages
require_once 'db.php';

header('Content-Type: application/json; charset=UTF-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// support JSON payload from fetch
$raw = file_get_contents('php://input');
$jsonInput = json_decode($raw, true);
if ($jsonInput && is_array($jsonInput)) {
    // merge into $_POST for backward compatibility
    $_POST = array_merge($_POST, $jsonInput);
}

// استخدم filter_input للحصول على القيم بشكل آمن
$name = trim(filter_input(INPUT_POST, 'name', FILTER_SANITIZE_STRING) ?? '');
$email = trim(filter_input(INPUT_POST, 'email', FILTER_SANITIZE_EMAIL) ?? '');
$phone = trim(filter_input(INPUT_POST, 'phone', FILTER_SANITIZE_STRING) ?? '');
$subject = trim(filter_input(INPUT_POST, 'subject', FILTER_SANITIZE_STRING) ?? 'رسالة من الموقع');
$message = trim(filter_input(INPUT_POST, 'message', FILTER_SANITIZE_STRING) ?? '');

if (!$name || !$email || !$message) {
    http_response_code(400);
    echo json_encode(['error' => 'Name, email and message are required']);
    exit;
}

// تأكد من أن البريد الإلكتروني صالح
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid email address']);
    exit;
}

$to = defined('ADMIN_EMAIL') ? ADMIN_EMAIL : $email; // fallback to sender if not defined

$body = "Name: $name\n";
$body .= "Email: $email\n";
if ($phone) {
    $body .= "Phone: $phone\n";
}
$body .= "\nMessage:\n$message\n";

$headers = "From: $email\r\n" .
           "Reply-To: $email\r\n" .
           "Content-Type: text/plain; charset=UTF-8";

// حاول إرسال البريد
$mailSent = mail($to, $subject, $body, $headers);

// تجاهل الأخطاء أثناء إدخال الرسالة في قاعدة البيانات
try {
    if (isset($pdo)) {
        // ensure table exists (useful on fresh installs)
        $pdo->exec("CREATE TABLE IF NOT EXISTS `contact_messages` (
            `id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
            `name` VARCHAR(191) NOT NULL,
            `email` VARCHAR(191) NOT NULL,
            `phone` VARCHAR(45) NULL,
            `subject` VARCHAR(255) DEFAULT NULL,
            `message` LONGTEXT NOT NULL,
            `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            KEY `idx_created_at` (`created_at`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;");

        $stmt = $pdo->prepare('INSERT INTO contact_messages (name, email, phone, subject, message, created_at) VALUES (?, ?, ?, ?, ?, NOW())');
        $stmt->execute([$name, $email, $phone, $subject, $message]);

        // سجل النشاط في الجدول العام
        log_activity('contact_message', "رسالة من $name", [
            'user_type' => 'customer',
            'user_name' => $name,
            'user_ip' => $_SERVER['REMOTE_ADDR'] ?? null,
            'new_value' => ['email' => $email, 'subject' => $subject]
        ]);
    }
} catch (Exception $e) {
    error_log('Contact insert error: ' . $e->getMessage());
}

if ($mailSent) {
    echo json_encode(['ok' => true]);
} else {
    // even if mail fails, we kept DB copy so still return success to avoid leaking email config
    echo json_encode(['ok' => false, 'error' => 'Failed to send email']);
}
