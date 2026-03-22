<?php
require __DIR__ . '/../api/db.php';
if (!is_admin_authenticated()) {
    header('Location: login.php');
    exit;
}

// Defaults
$totalRevenue = '0.00';
$totalOrders = 0;
$todayRevenue = 0.0;
$todayOrders = 0;
$yesterdayRevenue = 0.0;
$yesterdayOrders = 0;
$trendData = [];

// Safe percentage helper: returns null when cannot compute (guards division)
function safe_pct($numerator, $denominator, $precision = 2) {
  if (!is_numeric($numerator)) return null;
  if (!is_numeric($denominator)) return null;
  $den = (float)$denominator;
  // explicit guard against zero (or effectively zero)
  if ($den == 0.0) return null;
  $num = (float)$numerator;
  $pct = (($num - $den) / $den) * 100;
  return round($pct, $precision);
}

try {
    // Summary totals
    $stmt = $pdo->query("SELECT COALESCE(SUM(total),0) AS revenue, COUNT(*) AS orders FROM orders");
    $row = $stmt->fetch();
    if ($row) {
        $totalRevenue = number_format((float)$row['revenue'], 2, '.', '');
        $totalOrders = (int)$row['orders'];
    }

    // Today
    $todayStmt = $pdo->prepare("SELECT COALESCE(SUM(total),0) AS revenue, COUNT(*) AS orders FROM orders WHERE DATE(created_at) = CURDATE()");
    $todayStmt->execute();
    $todayRow = $todayStmt->fetch();
    if ($todayRow) {
        $todayRevenue = (float)$todayRow['revenue'];
        $todayOrders = (int)$todayRow['orders'];
    }

    // Yesterday
    $yesterdayStmt = $pdo->prepare("SELECT COALESCE(SUM(total),0) AS revenue, COUNT(*) AS orders FROM orders WHERE DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)");
    $yesterdayStmt->execute();
    $yRow = $yesterdayStmt->fetch();
    if ($yRow) {
        $yesterdayRevenue = (float)$yRow['revenue'];
        $yesterdayOrders = (int)$yRow['orders'];
    }

    // Optional: users stats (if a `users` table exists) — guarded, failures keep defaults
    $totalUsers = 0;
    $todayUsers = 0;
    $yesterdayUsers = 0;
    try {
      $countRow = $pdo->query("SELECT COUNT(*) AS cnt FROM users");
      $c = $countRow->fetch();
      if ($c && isset($c['cnt'])) { $totalUsers = (int)$c['cnt']; }
      $tStmt = $pdo->prepare("SELECT COUNT(*) AS c FROM users WHERE DATE(created_at) = CURDATE()");
      $tStmt->execute(); $tr = $tStmt->fetch(); if ($tr) $todayUsers = (int)$tr['c'];
      $yStmt = $pdo->prepare("SELECT COUNT(*) AS c FROM users WHERE DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)");
      $yStmt->execute(); $yr = $yStmt->fetch(); if ($yr) $yesterdayUsers = (int)$yr['c'];
    } catch (Exception $e) {
      // ignore — keep user counts as zero if table missing or query fails
    }

    // Last 7 days (fill zeros to ensure 7 values)
    $trendStmt = $pdo->prepare("SELECT DATE(created_at) AS dt, COALESCE(SUM(total),0) AS rev FROM orders WHERE DATE(created_at) >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) GROUP BY DATE(created_at)");
    $trendStmt->execute();
    $rows = $trendStmt->fetchAll();
    $map = [];
    foreach ($rows as $r) { $map[$r['dt']] = (float)$r['rev']; }
    $trendData = [];
    for ($i = 6; $i >= 0; $i--) {
        $d = date('Y-m-d', strtotime("-{$i} days"));
        $trendData[] = isset($map[$d]) ? $map[$d] : 0.0;
    }
} catch (Exception $e) {
    // keep defaults on DB error
}
?>
<!doctype html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>لوحة الإدارة - My Order</title>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700&display=swap" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    :root{--bg:#f4f7f6;--card:#ffffff;--muted:#6b7280;--accent:#1e40af}
    body{font-family:'Cairo', Arial, Helvetica, sans-serif;background:var(--bg);padding:18px;color:#0f172a}
    .card.custom{background:var(--card);border:0;border-radius:12px;box-shadow:0 8px 24px rgba(15,23,42,0.06)}
    .stat-number{font-size:1.6rem;font-weight:700}
    .muted{color:var(--muted)}
    table{width:100%;border-collapse:collapse}
    td,th{padding:.6rem;border-bottom:1px solid #eef2f6;text-align:right}
    .btn-brand{background:linear-gradient(180deg,var(--accent),#0ea5e9);color:#fff}
    .icon-lg{font-size:1.6rem}
    .fa-coins{color:#f59e0b}
    .fa-box-check{color:#06b6d4}
    .fa-chart-area{color:#7c3aed}
    @media (max-width:576px){ .stat-number{font-size:1.1rem} }
  </style>
</head>
<body>
  <div class="container py-4">
    <div class="d-flex justify-content-between align-items-center mb-3">
      <div class="d-flex align-items-center gap-3">
        <h2 class="m-0">لوحة الإدارة — الطلبات</h2>
        <a href="/admin/dashboard.php" class="btn btn-brand btn-sm d-inline-flex align-items-center gap-2"><i class="fa-solid fa-chart-line"></i> اللوحة الذكية</a>
      </div>
      <div>
        <a href="logout.php" class="btn btn-outline-danger btn-sm"><i class="fa-solid fa-sign-out-alt"></i> تسجيل خروج</a>
      </div>
    </div>

    <div class="row g-3 mb-3">
      <div class="col-sm-6 col-md-4">
        <div class="card custom p-3 h-100">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <h6 class="mb-1">إجمالي الإيرادات</h6>
              <div class="stat-number text-success"><?php echo number_format((float)$totalRevenue, 2); ?> ج.م</div>
              <div class="muted small mt-1">
                اليوم: <?php echo number_format((float)$todayRevenue, 2); ?> ج.م
                <?php
                // guard before percent calc: safe_pct already checks denominator, but ensure types
                $revChange = safe_pct($todayRevenue, $yesterdayRevenue);
                if ($revChange !== null):
                    if ($revChange > 0): ?> <span class="text-success">▲ <?php echo $revChange; ?>%</span>
                    <?php elseif ($revChange < 0): ?> <span class="text-danger">▼ <?php echo abs($revChange); ?>%</span>
                    <?php else: ?> <span class="text-muted">→ 0%</span>
                    <?php endif;
                else: ?> <span class="text-muted">—</span>
                <?php endif; ?>
              </div>
            </div>
            <div class="text-end">
              <i class="fa-solid fa-coins icon-lg"></i>
            </div>
          </div>
        </div>
      </div>

      <div class="col-sm-6 col-md-4">
        <div class="card custom p-3 h-100">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <h6 class="mb-1">إجمالي الطلبات</h6>
              <div class="stat-number text-warning"><?php echo (int)$totalOrders; ?></div>
              <div class="muted small mt-1">
                اليوم: <?php echo (int)$todayOrders; ?> طلبات
                <?php
                // حماية القسمة: تأكد من أن عدد طلبات الأمس أكبر من صفر قبل الحساب
                if ($yesterdayOrders > 0) {
                    $ordersGrowth = round((($todayOrders - $yesterdayOrders) / $yesterdayOrders) * 100, 2);
                } else {
                    $ordersGrowth = null;
                }

                if ($ordersGrowth !== null) :
                    if ($ordersGrowth > 0) : ?> <span class="text-success">▲ <?php echo $ordersGrowth; ?>%</span>
                    <?php elseif ($ordersGrowth < 0) : ?> <span class="text-danger">▼ <?php echo abs($ordersGrowth); ?>%</span>
                    <?php else: ?> <span class="text-muted">→ 0%</span>
                    <?php endif;
                else: ?> <span class="text-muted">—</span>
                <?php endif; ?>
              </div>
            </div>
            <div class="text-end">
              <i class="fa-solid fa-box-check icon-lg"></i>
            </div>
          </div>
        </div>
      </div>

      <div class="col-12 col-md-4">
        <div class="card custom p-3 h-100">
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <h6 class="mb-1">الأسبوع (مخطط)</h6>
              <div class="muted small">آخر 7 أيام</div>
            </div>
            <div class="text-end"><i class="fa-solid fa-chart-area icon-lg"></i></div>
          </div>
          <div class="mt-2 sparkline" style="height:56px;">
            <canvas id="sparklineChart" style="width:100%;height:56px"></canvas>
          </div>
        </div>
      </div>
    </div>

    <div class="card custom p-3">
      <div class="d-flex gap-2 align-items-center mb-3">
        <select id="statusFilter" class="form-select form-select-sm w-auto">
          <option value="">كل الطلبات</option>
          <option value="جديد">جديد</option>
          <option value="جاري التحضير">جاري التحضير</option>
          <option value="تم التسليم">تم التسليم</option>
        </select>
        <button id="btnLoad" class="btn btn-primary btn-sm"><i class="fa-solid fa-filter me-1"></i> تحميل</button>
      </div>

      <div id="ordersContainer" class="table-responsive">جاري التحميل...</div>
    </div>
  </div>

  <script>
    const __SERVER_TREND = <?php echo json_encode(array_values($trendData)); ?>;
  </script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
  <script>
    // Use relative API base so the admin pages work whether served by Apache or PHP built-in
    const API_BASE = '';
    async function loadOrders(){
      const status = document.getElementById('statusFilter').value;
      const q = status ? '?status='+encodeURIComponent(status) : '';
      try{
        const res = await fetch(API_BASE + '/api/orders.php'+q, {credentials: 'same-origin'});
        const data = await res.json();
        if(!data.success){ document.getElementById('ordersContainer').innerText = 'خطأ في جلب الطلبات'; return; }
        const orders = data.orders || [];
        if(orders.length === 0){ document.getElementById('ordersContainer').innerText = 'لا توجد طلبات'; return; }
        const html = ['<table class="table table-borderless table-striped"><thead><tr><th class="text-end">رقم</th><th class="text-end">العميل</th><th class="text-end">هاتف</th><th class="text-end">العنوان</th><th class="text-end">الإجمالي</th><th class="text-end">الحالة</th><th class="text-end">إجراءات</th></tr></thead><tbody>'];
        orders.forEach(o=>{
          // ensure safe escaping where needed
          const itemsEncoded = encodeURIComponent(o.items || '');
          html.push(`<tr><td class="text-end">#${o.order_id}</td><td class="text-end">${o.customer_name}</td><td class="text-end">${o.customer_phone}</td><td class="text-end" style="max-width:240px">${o.customer_address}</td><td class="text-end">${o.total}</td><td class="text-end">${o.status}</td><td class="text-end"><button onclick="updateStatus('${o.order_id}','جاري التحضير')" class="btn btn-sm btn-outline-secondary me-1"><i class="fa-solid fa-hourglass-start"></i></button> <button onclick="updateStatus('${o.order_id}','تم التسليم')" class="btn btn-sm btn-success me-1"><i class="fa-solid fa-check"></i></button> <button onclick="viewItems('${itemsEncoded}')" class="btn btn-sm btn-outline-primary"><i class="fa-solid fa-box-open"></i></button></td></tr>`);
        });
        html.push('</tbody></table>');
        document.getElementById('ordersContainer').innerHTML = html.join('');
      }catch(err){ document.getElementById('ordersContainer').innerText = 'خطأ في الاتصال'; }
    }

    function viewItems(encoded){
      try{
        const items = decodeURIComponent(encoded || '');
        alert(items || 'لا توجد عناصر');
      }catch(e){ alert('خطأ في عرض العناصر'); }
    }

    async function updateStatus(orderId, status){
      try{
        const res = await fetch(API_BASE + '/api/update_order.php',{method:'POST',headers: {'Content-Type':'application/json'},body: JSON.stringify({orderId, status}), credentials:'same-origin'});
        const data = await res.json();
        if(data.success){ alert('تم التحديث'); loadOrders(); } else { alert('خطأ'); }
      }catch(e){ alert('خطأ في الاتصال'); }
    }

    document.getElementById('btnLoad').addEventListener('click', loadOrders);
    loadOrders();

    // Initialize sparkline Chart using server-provided data
    (function(){
      try{
        const ctx = document.getElementById('sparklineChart');
        if(!ctx) return;
        const labels = __SERVER_TREND.map((_,i)=>i+1);
        const data = __SERVER_TREND.map(v=>Number(v) || 0);
        new Chart(ctx, {
          type: 'line',
          data: { labels, datasets: [{ data, borderColor: '#1e40af', backgroundColor: 'rgba(30,64,175,0.08)', tension: 0.35, fill: true, pointRadius: 0 }] },
          options: { responsive: true, maintainAspectRatio: false, plugins:{legend:{display:false}}, scales:{x:{display:false}, y:{display:false}} }
        });
      }catch(e){/* ignore chart errors */}
    })();
  </script>
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
