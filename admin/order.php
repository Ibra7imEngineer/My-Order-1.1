<?php
require __DIR__ . '/../api/db.php';
if (!is_admin_authenticated()) {
    header('Location: login.php');
    exit;
}

$orderId = isset($_GET['id']) ? intval($_GET['id']) : 0;
if ($orderId <= 0) {
    http_response_code(400);
    echo "<p>معرف الطلب غير صالح.</p>";
    exit;
}

try {
    $stmt = $pdo->prepare("SELECT * FROM orders WHERE id = ? LIMIT 1");
    $stmt->execute([$orderId]);
    $order = $stmt->fetch();
} catch (Exception $e) {
    $order = false;
}

if (!$order) {
    http_response_code(404);
    echo "<p>لم يتم العثور على الطلب.</p>";
    exit;
}

// حاول فك JSON للعناصر
$items = [];
if (!empty($order['items'])) {
    $decoded = json_decode($order['items'], true);
    if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
        $items = $decoded;
    } else {
        // احتياطي: حاول unserialize إن كان مخزنًا بهذا الشكل
        $un = @unserialize($order['items']);
        if ($un !== false && is_array($un)) $items = $un;
    }
}

function esc($v) { return htmlspecialchars((string)$v, ENT_QUOTES, 'UTF-8'); }

?>
<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>تفاصيل الطلب — <?= esc($order['order_id'] ?: $order['id']) ?></title>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;800&display=swap" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.rtl.min.css" rel="stylesheet">
    <style>body{font-family:'Cairo',sans-serif;background:#0b1220;color:#fff;padding:20px} .card{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06)}</style>
  </head>
  <body>
    <div class="container">
      <a href="dashboard.php" class="btn btn-outline-light mb-3">← العودة للوحة التحكم</a>
      <div class="card p-4 mb-3">
        <h4>تفاصيل الطلب: <span class="text-primary"><?= esc($order['order_id'] ?: ('#'.$order['id'])) ?></span></h4>
        <div class="row mt-3">
          <div class="col-md-6">
            <h6>معلومات العميل</h6>
            <p class="mb-1"><strong>الاسم:</strong> <?= esc($order['customer_name']) ?></p>
            <p class="mb-1"><strong>الهاتف:</strong> <?= esc($order['customer_phone']) ?></p>
            <p class="mb-1"><strong>العنوان:</strong> <?= nl2br(esc($order['customer_address'])) ?></p>
          </div>
          <div class="col-md-6">
            <h6>معلومات الطلب</h6>
            <p class="mb-1"><strong>الحالة:</strong> <?= esc($order['status']) ?></p>
            <p class="mb-1"><strong>المجموع الفرعي:</strong> <?= number_format((float)$order['subtotal'],2) ?> ج.م</p>
            <p class="mb-1"><strong>مصاريف التوصيل:</strong> <?= number_format((float)$order['shipping'],2) ?> ج.م</p>
            <p class="mb-1"><strong>الإجمالي:</strong> <?= number_format((float)$order['total'],2) ?> ج.م</p>
            <p class="mb-1"><strong>التاريخ:</strong> <?= esc($order['created_at']) ?></p>
          </div>
        </div>
      </div>

      <div class="card p-3">
        <h6>العناصر</h6>
        <?php if (empty($items)): ?>
          <p class="text-muted">لا توجد عناصر أو تعذر تحليل بيانات العناصر.</p>
        <?php else: ?>
          <div class="table-responsive">
            <table class="table table-borderless text-white align-middle">
              <thead class="text-muted small"><tr><th>اسم العنصر</th><th>الكمية</th><th>سعر الوحدة</th><th>الإجمالي</th></tr></thead>
              <tbody>
                <?php foreach($items as $it):
                  $name = $it['name'] ?? $it['title'] ?? 'عنصر';
                  $qty = isset($it['quantity']) ? (float)$it['quantity'] : (isset($it['qty'])?(float)$it['qty']:1);
                  $price = isset($it['price']) ? (float)$it['price'] : (isset($it['unit_price'])?(float)$it['unit_price']:0);
                  $lineTotal = $qty * $price;
                ?>
                <tr>
                  <td><?= esc($name) ?></td>
                  <td><?= number_format($qty,2) ?></td>
                  <td><?= number_format($price,2) ?> ج.م</td>
                  <td><?= number_format($lineTotal,2) ?> ج.م</td>
                </tr>
                <?php endforeach; ?>
              </tbody>
            </table>
          </div>
        <?php endif; ?>
      </div>
    </div>
  </body>
</html>
