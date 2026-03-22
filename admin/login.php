<?php
require __DIR__ . '/../api/db.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $user = $_POST['username'] ?? '';
    $pass = $_POST['password'] ?? '';
    if ($user === $order_config['admin_username'] && $pass === $order_config['admin_password']) {
        $_SESSION['is_admin'] = true;
        header('Location: index.php');
        exit;
    } else {
        $error = 'بيانات الدخول غير صحيحة';
    }
}
?>
<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>تسجيل دخول لوحة الإدارة</title>
  <style>body{font-family:Arial,Helvetica,sans-serif;background:#f6f8fa;display:flex;align-items:center;justify-content:center;height:100vh}form{background:#fff;padding:24px;border-radius:8px;box-shadow:0 6px 24px rgba(0,0,0,0.08);width:320px}input{width:100%;padding:10px;margin:8px 0;border:1px solid #e6e9ee;border-radius:6px}button{width:100%;padding:10px;background:#FF6B35;color:#fff;border:none;border-radius:6px;font-weight:700}</style>
</head>
<body>
  <form method="post">
    <h2 style="margin:0 0 8px 0">لوحة إدارة My Order</h2>
    <?php if (!empty($error)) echo '<div style="color:#ef4444;margin-bottom:8px">'.htmlspecialchars($error).'</div>'; ?>
    <input name="username" placeholder="اسم المستخدم" required />
    <input name="password" placeholder="كلمة المرور" type="password" required />
    <button type="submit">تسجيل الدخول</button>
    <p style="font-size:12px;color:#888;margin-top:10px">تفقد `api/db.php` لتعديل بيانات الدخول.</p>
  </form>
</body>
</html>
