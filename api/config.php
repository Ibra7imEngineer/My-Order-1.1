<?php
// My Order - Database Configuration
// تم إنشاء هذا الملف تلقائياً — عدّل القيم حسب بيئتك

// قاعدة البيانات
$DB_HOST = '127.0.0.1';
$DB_NAME = 'myorder';
$DB_USER = 'root';
$DB_PASS = ''; // empty password for root (adjust if your MySQL uses a password)

// اختياري: webhook يُرسل الطلبات إليه (مثل RestroAdmin)
$RESTRO_WEBHOOK = '';
// مثال: $RESTRO_WEBHOOK = 'https://your-restroadmin.example/api/webhook';

// بيانات دخول لوحة الإدارة (اختياري — غيّرها في الإنتاج)
$ADMIN_USERNAME = 'admin';
$ADMIN_PASSWORD = '12345';

// مفتاح سري للوصول البرمجي عبر API (اتركه فارغاً إذا لم تحتجه)
$API_SECRET = '';
// مثال: $API_SECRET = 'your_secure_token_here';
// عنوان البريد الإلكتروني الذي تُستقبل عليه رسائل نموذج التواصل
// غيّر القيمة إلى بريدك الشخصي أو أي بريد تريد تسليم الرسائل إليه.
define('ADMIN_EMAIL', 'ibra7im.engineer@gmail.com');
?>
