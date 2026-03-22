<?php
require __DIR__ . '/../api/db.php';
if (!is_admin_authenticated()) {
    header('Location: login.php');
    exit;
}

// ======== اجلب الإحصائيات من قاعدة البيانات بطريقة آمنة وسريعة ========
try {
    // إجمالي الأرباح
    $stmt = $pdo->query("SELECT COALESCE(SUM(total),0) AS total_revenue FROM orders");
    $totalRevenueRow = $stmt->fetch();
    $totalRevenue = isset($totalRevenueRow['total_revenue']) ? (float)$totalRevenueRow['total_revenue'] : 0.0;

    // إجمالي الطلبات
    $stmt = $pdo->query("SELECT COUNT(*) AS total_orders FROM orders");
    $totalOrdersRow = $stmt->fetch();
    $totalOrders = isset($totalOrdersRow['total_orders']) ? (int)$totalOrdersRow['total_orders'] : 0;

    // عدد الزوار (مميز حسب رقم الهاتف)
    $stmt = $pdo->query("SELECT COUNT(DISTINCT customer_phone) AS visitors FROM orders");
    $visitorsRow = $stmt->fetch();
    $visitorsCount = isset($visitorsRow['visitors']) ? (int)$visitorsRow['visitors'] : 0;

    // متوسط قيمة الطلب — حماية من القسمة على صفر
    $avgOrderValue = $totalOrders > 0 ? ($totalRevenue / $totalOrders) : 0.0;

    // إجمالي رسائل التواصل
    $stmt = $pdo->query("SELECT COUNT(*) AS total_contacts FROM contact_messages");
    $totalContactsRow = $stmt->fetch();
    $totalContacts = isset($totalContactsRow['total_contacts']) ? (int)$totalContactsRow['total_contacts'] : 0;

    // أخر رسائل التواصل للعرض
    $stmt = $pdo->prepare("SELECT name, email, subject, message, created_at FROM contact_messages ORDER BY created_at DESC LIMIT 8");
    $stmt->execute();
    $recentContacts = $stmt->fetchAll();

    // آخر 7 أيام — المبيعات اليومية
    $stmt = $pdo->prepare("SELECT DATE(created_at) AS d, COALESCE(SUM(total),0) AS total FROM orders WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) GROUP BY DATE(created_at) ORDER BY DATE(created_at) ASC");
    $stmt->execute();
    $rows = $stmt->fetchAll();
    // املأ الأيام المفقودة بصفر
    $last7 = [];
    for ($i = 6; $i >= 0; $i--) {
        $date = date('Y-m-d', strtotime("-$i days"));
        $last7[$date] = 0.0;
    }
    foreach ($rows as $r) {
        $last7[$r['d']] = (float)$r['total'];
    }

    // أخر الطلبات لعرض الجدول
    $stmt = $pdo->prepare("SELECT id, order_id, customer_name, total, status, created_at FROM orders ORDER BY created_at DESC LIMIT 12");
    $stmt->execute();
    $recentOrders = $stmt->fetchAll();
} catch (Exception $e) {
    $totalRevenue = 0.0; $totalOrders = 0; $visitorsCount = 0; $avgOrderValue = 0.0; $last7 = []; $recentOrders = [];
    $totalContacts = 0; $recentContacts = [];
}

// JSON للـ Chart.js
$chartLabels = array_map(function($d){ return date('d M', strtotime($d)); }, array_keys($last7));
$chartData = array_values($last7);
?>
<!doctype html>
<html lang="ar" dir="rtl">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
    <title>لوحة التحكم — My Order</title>
    <!-- Cairo font -->
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;800&display=swap" rel="stylesheet">
    <!-- Bootstrap RTL 5 -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.rtl.min.css" rel="stylesheet">
    <!-- FontAwesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
    <!-- Chart.js -->
    <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
    <style>
      body { font-family: 'Cairo', sans-serif; background: var(--bg); color: #e6edf3; -webkit-font-smoothing:antialiased; }
      :root{ --primary:#ff6b35; --muted:#9ca3af; --card:#0f1724; --glass: rgba(255,255,255,0.03); --glass-border: rgba(255,255,255,0.06); --bg: linear-gradient(180deg,#061021 0%,#071428 100%); --card-shadow: 0 8px 30px rgba(2,6,23,0.6); }
      body.light { --card:#fff; --glass: rgba(0,0,0,0.04); --glass-border: rgba(0,0,0,0.06); --bg: #f8fafc; color: #0b1220; }
      .app-sidebar { width: 250px; min-height:100vh; background: linear-gradient(180deg,#041021 0,#071428 100%); box-shadow: inset -1px 0 0 rgba(255,255,255,0.02); }
      .nav-link { color: #cbd5e1; padding:10px 12px; border-radius:8px; transition: all .15s ease; }
      .nav-link:hover { background: rgba(255,255,255,0.03); color: #fff; transform: translateX(-3px); }
      .nav-link.active { background: linear-gradient(90deg,#ff8a50,#ff6b35); color: #fff; box-shadow: 0 6px 18px rgba(255,107,53,0.12); }
      .card-glass { background: linear-gradient(135deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01)); border:1px solid var(--glass-border); backdrop-filter: blur(6px); border-radius:12px; box-shadow: var(--card-shadow); transition: transform .12s ease, box-shadow .12s ease; }
      .card-glass:hover { transform: translateY(-4px); box-shadow: 0 14px 40px rgba(2,6,23,0.7); }
      .table-glass { background: linear-gradient(180deg, rgba(255,255,255,0.01), rgba(255,255,255,0.005)); border-radius:12px; border:1px solid var(--glass-border); box-shadow: 0 8px 24px rgba(2,6,23,0.5); }
      .stat-value { font-weight:800; font-size:1.6rem; color:var(--primary); }
      .badge-status { padding:6px 10px; border-radius: 999px; font-weight:700; }
      .badge-success { background:#d1fae5; color:#065f46; }
      .badge-warning { background:#fff7ed; color:#92400e; }
      .badge-danger { background:#fee2e2; color:#991b1b; }
      .topbar { background: transparent; }
      .rounded-lg { border-radius: 12px !important; }
      .search-input { max-width:420px; }
      .profile-img { width:44px;height:44px;border-radius:10px;object-fit:cover;border:2px solid rgba(255,255,255,0.06); }
      .chart-card { height:360px; }
      table.table thead th { color: #9ca3af; font-weight:700; font-size:0.9rem; border-bottom:1px solid rgba(255,255,255,0.03); }
      .btn-primary { background: linear-gradient(90deg,#ff8a50,#ff6b35); border: none; color:#fff; box-shadow: 0 8px 20px rgba(255,107,53,0.12); }
      /* offline placeholder styling */
      .offline-placeholder { color: var(--muted); text-align:center; }
      .offline-placeholder i { font-size: 4rem; color: #9ca3af; }
      .offline-placeholder h3 { margin-top: 0.75rem; }
      @media (max-width:768px) {
        .offline-placeholder i { font-size: 3rem; }
        .offline-placeholder h3 { font-size: 1.4rem; }
      }
      @media (max-width: 992px){ .app-sidebar{ position:fixed; right:-100%; z-index:1040; } .app-sidebar.show{ right:0; } }
    </style>
  </head>
  <body class="">
    <div class="d-flex">
      <aside class="app-sidebar p-3 text-white d-none d-lg-block">
        <div class="mb-4 d-flex align-items-center">
          <div class="me-3 bg-gradient" style="width:48px;height:48px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#ff8a50,#ff6b35);"><i class="fa-solid fa-burger text-white"></i></div>
            <div>
            <h5 class="mb-0">My Order</h5>
            <small class="text-muted">لوحة تحكم نظم الطلبات</small>
          </div>
        </div>
        <nav class="nav flex-column">
          <a class="nav-link active mb-1" href="#" onclick="switchTab('dashboard')"><i class="fa-solid fa-chart-line me-2"></i> لوحة التحكم</a>
          <a class="nav-link mb-1" href="#" onclick="switchTab('orders')"><i class="fa-solid fa-shopping-cart me-2"></i> الطلبات</a>
          <a class="nav-link mb-1" href="#" onclick="switchTab('products')"><i class="fa-solid fa-box me-2"></i> المنتجات</a>
          <a class="nav-link mb-1" href="#" onclick="switchTab('settings')"><i class="fa-solid fa-gear me-2"></i> الإعدادات</a>
        </nav>
        <div class="mt-auto pt-3 small text-muted">آخر تحديث: <span id="lastUpdate">--:--</span></div>
      </aside>
      <div class="flex-grow-1 p-3">
        <header class="d-flex justify-content-between align-items-center mb-4 topbar">
          <div class="d-flex align-items-center">
            <button id="menuToggle" class="btn btn-outline-light d-lg-none me-2"><i class="fa fa-bars"></i></button>
            <h3 class="mb-0">لوحة التحكم</h3>
            <small class="text-muted ms-3">نظرة عامة سريعة</small>
          </div>
          <div class="d-flex align-items-center gap-3">
            <div class="input-group search-input d-none d-md-flex">
              <span class="input-group-text bg-transparent border-0"><i class="fa fa-search text-muted"></i></span>
              <input id="quickSearch" class="form-control form-control-sm border-0 bg-transparent text-white" placeholder="ابحث بسرعة..." />
            </div>
            <button id="notifBtn" class="btn btn-sm btn-outline-light"><i class="fa-regular fa-bell"></i></button>
            <img src="https://ui-avatars.com/api/?name=Admin&background=ff6b35&color=fff&rounded=true" alt="avatar" class="profile-img" />
            <div class="form-check form-switch text-white">
              <input class="form-check-input" type="checkbox" id="themeToggle">
              <label class="form-check-label small" for="themeToggle">وضع فاتح</label>
            </div>
          </div>
        </header>

        <div id="dashboard" class="tab-pane active">
          <div class="row g-3 mb-3">
            <div class="col-6 col-md-3">
              <div class="card card-glass p-3">
                <div class="d-flex justify-content-between align-items-start">
                  <div>
                    <small class="text-muted">إجمالي الأرباح</small>
                    <div id="totalSales" class="stat-value mt-2"><?= number_format($totalRevenue,2) ?> ج.م</div>
                    <div class="text-muted small">منذ بداية النظام</div>
                  </div>
                  <div class="bg-gradient rounded-3 d-flex align-items-center justify-content-center" style="width:52px;height:52px;background:linear-gradient(135deg,#ff8a50,#ff6b35);"><i class="fa-solid fa-dollar-sign text-white"></i></div>
                </div>
              </div>
            </div>
            <div class="col-6 col-md-3">
              <div class="card card-glass p-3">
                <small class="text-muted">إجمالي الطلبات</small>
                <div id="totalOrders" class="stat-value mt-2"><?= number_format($totalOrders) ?></div>
                <div class="text-muted small">نمو نسبت</div>
              </div>
            </div>
            <div class="col-6 col-md-3">
              <div class="card card-glass p-3">
                <small class="text-muted">عدد الزوار</small>
                <div id="visitorsCount" class="stat-value mt-2"><?= number_format($visitorsCount) ?></div>
                <div class="text-muted small">أرقام مميزة</div>
              </div>
            </div>
            <div class="col-6 col-md-3">
              <div class="card card-glass p-3">
                <small class="text-muted">متوسط قيمة الطلب</small>
                <div id="avgOrderValue" class="stat-value mt-2"><?= number_format($avgOrderValue,2) ?> ج.م</div>
                <div class="text-muted small">محمي من القسمة على صفر</div>
              </div>
            </div>
            <div class="col-6 col-md-3">
              <div class="card card-glass p-3">
                <small class="text-muted">رسائل تواصل</small>
                <div id="totalContacts" class="stat-value mt-2"><?= number_format($totalContacts) ?></div>
                <div class="text-muted small">تم استلامها</div>
              </div>
            </div>
          </div>

          <div class="row g-3">
            <div class="col-lg-8">
              <div class="card card-glass p-3 chart-card">
                <div class="d-flex justify-content-between align-items-center mb-3">
                  <h6 class="mb-0">حركة المبيعات — 7 أيام</h6>
                  <div>
                    <button id="refreshChart" class="btn btn-sm btn-primary">تحديث</button>
                  </div>
                </div>
                <canvas id="salesChartCanvas" style="height:100%"></canvas>
              </div>
            </div>
            <div class="col-lg-4">
              <div class="card card-glass p-3">
                <h6>إحصائيات سريعة</h6>
                <ul class="list-unstyled mt-3">
                  <li class="mb-2">ذروة الطلبات: <strong class="float-start">7:30 م</strong></li>
                  <li class="mb-2">متوسط وقت التحضير: <strong class="float-start">18 دقيقة</strong></li>
                  <li class="mb-2">رضا العملاء: <strong class="float-start">4.8 / 5</strong></li>
                </ul>
                <div class="d-flex gap-2 mt-3">
                  <div class="flex-grow-1">
                    <small class="text-muted">توقع الأسبوع القادم</small>
                    <div id="nextWeekPrediction" class="stat-value mt-1">-- ج.م</div>
                  </div>
                  <div class="flex-grow-1 text-start">
                    <small class="text-muted">العناصر النشطة</small>
                    <div id="activeItems" class="stat-value mt-1">--</div>
                  </div>
                </div>
              </div>
              <div class="card card-glass p-3 mt-3">
                <h6>الفئات الأكثر مبيعاً</h6>
                <div class="mt-2">بيتزا: <span class="float-start fw-bold">38%</span></div>
                <div class="mt-2">مشروبات: <span class="float-start fw-bold">25%</span></div>
              </div>
            </div>
          </div>

          <div class="row g-3 mt-3">
            <div class="col-12">
              <div class="card table-glass p-3">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <h6 class="mb-0">آخر الطلبات</h6>
                  <a href="orders.php" class="small">عرض الكل</a>
                </div>
                <div class="table-responsive">
                  <table class="table table-borderless align-middle">
                    <thead>
                      <tr class="text-muted small"><th>رقم الطلب</th><th>العميل</th><th>المبلغ</th><th>الحالة</th><th>الوقت</th><th>الإجراء</th></tr>
                    </thead>
                    <tbody>
                      <?php foreach($recentOrders as $ord): ?>
                        <?php
                          $status = $ord['status'] ?? 'قيد الانتظار';
                          $badgeClass = 'badge-warning';
                          if (mb_stripos($status,'مكتمل') !== false || mb_stripos($status,'مسلم') !== false) $badgeClass = 'badge-success';
                          if (mb_stripos($status,'ملغى') !== false || mb_stripos($status,'خطأ') !== false) $badgeClass = 'badge-danger';
                        ?>
                        <tr>
                          <td class="fw-bold text-primary"><?= htmlspecialchars($ord['order_id'] ?: ('#'.$ord['id'])) ?></td>
                          <td><?= htmlspecialchars($ord['customer_name']) ?></td>
                          <td><?= number_format((float)$ord['total'],2) ?> ج.م</td>
                          <td><span class="badge-status <?= $badgeClass ?> px-2"><?= htmlspecialchars($status) ?></span></td>
                          <td class="text-muted small"><?= htmlspecialchars($ord['created_at']) ?></td>
                          <td><a href="order.php?id=<?= urlencode($ord['id']) ?>" class="btn btn-sm btn-outline-primary">عرض</a></td>
                        </tr>
                      <?php endforeach; ?>
                      <?php if(empty($recentOrders)): ?><tr><td colspan="6" class="text-center text-muted">لا توجد طلبات حالياً</td></tr><?php endif; ?>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          <!-- recent contact messages -->
          <div class="row g-3 mt-4">
            <div class="col-12">
              <div class="card table-glass p-3">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <h6 class="mb-0">آخر رسائل التواصل</h6>
                  <!-- link could be added to full messages page in future -->
                </div>
                <div class="table-responsive">
                  <table class="table table-borderless align-middle">
                    <thead>
                      <tr class="text-muted small"><th>الاسم</th><th>البريد</th><th>الموضوع</th><th>الرسالة</th><th>الوقت</th></tr>
                    </thead>
                    <tbody>
                      <?php foreach($recentContacts as $c): ?>
                        <tr>
                          <td><?= htmlspecialchars($c['name']) ?></td>
                          <td><?= htmlspecialchars($c['email']) ?></td>
                          <td><?= htmlspecialchars($c['subject']) ?></td>
                          <td style="max-width:240px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis"><?= htmlspecialchars($c['message']) ?></td>
                          <td class="text-muted small"><?= htmlspecialchars($c['created_at']) ?></td>
                        </tr>
                      <?php endforeach; ?>
                      <?php if(empty($recentContacts)): ?><tr><td colspan="5" class="text-center text-muted">لا توجد رسائل حالياً</td></tr><?php endif; ?>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- Bootstrap JS -->
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    <script>
      // data from server
      const chartLabels = <?= json_encode(array_values($chartLabels), JSON_UNESCAPED_UNICODE) ?>;
      const chartData = <?= json_encode(array_values($chartData), JSON_UNESCAPED_UNICODE) ?>;

      function safeNumber(v){ const n = Number(v); return Number.isFinite(n)?n:0; }

      // Render wave-style chart
      const ctx = document.getElementById('salesChartCanvas').getContext('2d');
      const salesChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: chartLabels,
          datasets: [{
            label: 'المبيعات',
            data: chartData.map(safeNumber),
            borderColor: '#ff6b35',
            backgroundColor: function(context){ const gradient = ctx.createLinearGradient(0,0,0,300); gradient.addColorStop(0,'rgba(255,107,53,0.18)'); gradient.addColorStop(1,'rgba(255,107,53,0.02)'); return gradient; },
            tension: 0.5,
            fill: true,
            pointRadius:5
          }]
        },
        options: {
          responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}},
          scales:{ y:{ beginAtZero:true, ticks:{ callback: (v)=> v + ' ج.م' } } }
        }
      });

      document.getElementById('refreshChart').addEventListener('click', ()=>{ salesChart.update(); });
      // theme toggle
      const themeToggle = document.getElementById('themeToggle');
      themeToggle.addEventListener('change', (e)=>{ document.body.classList.toggle('light', e.target.checked); });

      // mobile menu
      document.getElementById('menuToggle').addEventListener('click', ()=>{ document.querySelector('.app-sidebar').classList.toggle('show'); });

      // update last update time
      function updateLast(){ document.getElementById('lastUpdate').textContent = new Date().toLocaleTimeString('ar-SA',{hour:'2-digit',minute:'2-digit'}); }
      updateLast(); setInterval(updateLast, 60*1000);
    </script>
          </div>
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div class="glass p-6 rounded-2xl shadow-xl">
              <h3 class="text-xl font-bold text-gray-900 mb-4">📈 أداء المنتجات الأعلى</h3>
              <div class="space-y-3">
                <div class="flex justify-between items-center p-3 bg-orange-50 rounded-lg"><span class="font-semibold">بيتزا مارغريتا</span><span class="badge badge-success">156 طلب</span></div>
                <div class="flex justify-between items-center p-3 bg-blue-50 rounded-lg"><span class="font-semibold">برجر كلاسيك</span><span class="badge badge-success">142 طلب</span></div>
                <div class="flex justify-between items-center p-3 bg-purple-50 rounded-lg"><span class="font-semibold">سلطة قيصر</span><span class="badge badge-success">128 طلب</span></div>
              </div>
            </div>
            <div class="glass p-6 rounded-2xl shadow-xl">
              <h3 class="text-xl font-bold text-gray-900 mb-4">👥 إحصائيات العملاء</h3>
              <div class="space-y-3">
                <div class="flex justify-between items-center p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-lg"><span class="text-gray-700">إجمالي العملاء</span><span class="font-bold text-green-600">2,450</span></div>
                <div class="flex justify-between items-center p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg"><span class="text-gray-700">عملاء جدد</span><span class="font-bold text-blue-600">320</span></div>
                <div class="flex justify-between items-center p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg"><span class="text-gray-700">معدل الاحتفاظ</span><span class="font-bold text-purple-600">87%</span></div>
              </div>
            </div>
          </div>
          <div class="glass p-6 rounded-2xl shadow-xl">
            <h3 class="text-xl font-bold text-gray-900 mb-4">🎯 مقارنة الأداء الشهري</h3>
            <div class="chart-wrapper"><canvas id="performanceChart"></canvas></div>
          </div>
        </section>
        <section id="settings-tab" class="tab-content hidden p-6 lg:p-8 space-y-8">
          <div class="mb-8 animate-slide-down">
            <h2 class="text-4xl font-black text-white mb-2"><i class="fas fa-cog text-orange-500 mr-3"></i>الإعدادات</h2>
            <p class="text-gray-300">إعدادات لوحة التحكم والمتجر والإشعارات</p>
          </div>
          <div class="glass p-6 rounded-2xl shadow-xl">
            <h3 class="text-xl font-bold text-gray-900 mb-6">🍽️ إعدادات المطعم</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><label class="block text-gray-700 font-semibold mb-2">اسم المطعم</label><input id="restaurantName" type="text" value="My Order" class="w-full p-3 border border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none" /></div>
              <div><label class="block text-gray-700 font-semibold mb-2">رقم الهاتف</label><input id="restaurantPhone" type="tel" value="+20123456789" class="w-full p-3 border border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none" /></div>
              <div><label class="block text-gray-700 font-semibold mb-2">الحد الأدنى للطلب</label><input id="minOrder" type="number" value="50" class="w-full p-3 border border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none" /></div>
              <div><label class="block text-gray-700 font-semibold mb-2">مصاريف التوصيل</label><input id="deliveryFee" type="number" value="20" class="w-full p-3 border border-gray-300 rounded-lg focus:border-orange-500 focus:outline-none" /></div>
            </div>
            <button id="saveSettingsBtn" class="btn-primary mt-6 w-full"><i class="fas fa-save"></i> حفظ الإعدادات</button>
          </div>
          <div class="glass p-6 rounded-2xl shadow-xl">
            <h3 class="text-xl font-bold text-gray-900 mb-6">🔔 إعدادات الإشعارات</h3>
            <div class="space-y-4">
              <div class="flex justify-between items-center p-4 bg-gray-50 rounded-lg"><span class="text-gray-700 font-semibold">إشعارات الطلبات الجديدة</span><label class="toggle-switch"><input type="checkbox" checked /><span class="slider"></span></label></div>
              <div class="flex justify-between items-center p-4 bg-gray-50 rounded-lg"><span class="text-gray-700 font-semibold">إشعارات المراجعات</span><label class="toggle-switch"><input type="checkbox" checked /><span class="slider"></span></label></div>
            </div>
          </div>
          <div class="glass p-6 rounded-2xl shadow-xl">
            <h3 class="text-xl font-bold text-gray-900 mb-6">👤 إعدادات الحساب</h3>
            <div class="space-y-4">
              <button id="logoutBtn" class="w-full p-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-all cursor-pointer"><i class="fas fa-sign-out-alt"></i> تسجيل الخروج</button>
            </div>
          </div>
        </section>
        <section id="logs-tab" class="tab-content hidden p-6 lg:p-8">
          <div class="mb-8 animate-slide-down">
            <h2 class="text-4xl font-black text-white mb-2"><i class="fas fa-history text-orange-500 mr-3"></i>سجلات النشاط</h2>
            <p class="text-gray-300">عرض جميع الأنشطة والعمليات المسجلة</p>
          </div>
          <div class="glass p-4 rounded-xl shadow-lg mb-6">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input id="logSearch" type="text" placeholder="🔍 ابحث..." class="p-3 rounded-lg border border-gray-300 focus:outline-none" />
              <select id="logActivityFilter" class="p-3 rounded-lg border border-gray-300 focus:outline-none"><option value="">جميع الأنشطة</option><option value="order_created">طلبات جديدة</option><option value="order_updated">تحديثات</option></select>
              <button onclick="dashboard.loadActivityLogs()" class="btn-primary"><i class="fas fa-sync-alt"></i> تحديث</button>
            </div>
          </div>
          <div class="glass p-6 rounded-2xl shadow-xl">
            <div class="table-wrapper">
              <table>
                <thead><tr><th>الوقت</th><th>النشاط</th><th>المستخدم</th><th>الإجراء</th></tr></thead>
                <tbody id="activityLogsTableBody"></tbody>
              </table>
            </div>
          </div>
        </section>
        <section id="statistics-tab" class="tab-content hidden p-6 lg:p-8">
          <div class="mb-8 animate-slide-down">
            <h2 class="text-4xl font-black text-white mb-2"><i class="fas fa-chart-pie text-orange-500 mr-3"></i>إحصائيات المبيعات</h2>
            <p class="text-gray-300">تحليل مفصل للمبيعات والإيرادات</p>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div class="stat-card glass"><p class="text-gray-600 text-sm">مبيعات اليوم</p><h3 class="stat-value text-2xl font-black mt-2" id="todaySalesTotal">0</h3></div>
            <div class="stat-card glass"><p class="text-gray-600 text-sm">طلبات اليوم</p><h3 class="stat-value text-2xl font-black mt-2" id="todayOrdersCount">0</h3></div>
            <div class="stat-card glass"><p class="text-gray-600 text-sm">مبيعات الأسبوع</p><h3 class="stat-value text-2xl font-black mt-2" id="weekSalesTotal">0</h3></div>
            <div class="stat-card glass"><p class="text-gray-600 text-sm">طلبات الأسبوع</p><h3 class="stat-value text-2xl font-black mt-2" id="weekOrdersCount">0</h3></div>
          </div>
        </section>
    </div>
    <script>
      class AdminDashboard {
        constructor() {
          this.orders = [];
          this.products = [];
          this.charts = {};
          // flag to detect server unavailability
          this.offline = false;
          this.init();
        }
        async init() {
          await this.loadData();
          this.setupEventListeners();
          this.renderDashboard();
          this.startAutoRefresh();
        }
        async loadData() {
          try {
            const statsRes = await fetch('../api/stats.php', { credentials: 'same-origin', headers: { Accept: 'application/json' } });
            if (statsRes.ok) {
              const sdata = await statsRes.json();
              if (sdata && sdata.success) {
                const revEl = document.getElementById('totalSales');
                const ordersEl = document.getElementById('totalOrders');
                const avgEl = document.getElementById('avgOrderValue');
                const contactsEl = document.getElementById('totalContacts');
                if (revEl) revEl.textContent = `${(parseFloat(sdata.revenue) || 0).toFixed(2)} ج.م`;
                if (ordersEl) ordersEl.textContent = parseInt(sdata.orders) || 0;
                if (avgEl) avgEl.textContent = `${(parseFloat(sdata.avg_order) || 0).toFixed(2)} ج.م`;
                if (contactsEl) contactsEl.textContent = parseInt(sdata.contacts) || 0;
                this.trend = sdata.trend || [];
              }
            }
          } catch (e) { this.offline = true; }
          try {
            const res = await fetch('../api/orders.php', { credentials: 'same-origin', headers: { Accept: 'application/json' } });
            if (res.ok) {
              const data = await res.json();
              if (data && data.success && Array.isArray(data.orders)) {
                this.orders = data.orders.map((o) => {
                  let items = [];
                  try { items = o.items ? JSON.parse(o.items) : []; } catch (e) { items = []; }
                  return { id: o.id || o.order_id || null, totalPrice: parseFloat(o.total) || 0, date: (o.created_at || '').split(' ')[0] || new Date().toISOString().split('T')[0], status: o.status || '', items: items, raw: o };
                });
              }
            }
          } catch (e) { this.offline = true; }
          if (this.offline) {
            this.showOfflineState();
            return;
          }
          const storedProducts = localStorage.getItem('restaurantProducts');
          this.products = storedProducts ? JSON.parse(storedProducts) : this.generateSampleProducts();
          if (!this.orders || this.orders.length === 0) { this.orders = this.generateSampleOrders(); }
        }
        generateSampleOrders() {
          const orders = [];
          const now = new Date();
          for (let i = 0; i < 60; i++) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            orders.push({ id: `ORD-${1000 + i}`, date: date.toISOString().split('T')[0], totalPrice: Math.floor(Math.random() * 150) + 30, itemCount: Math.floor(Math.random() * 6) + 1 });
          }
          return orders;
        }
        generateSampleProducts() {
          return [
            { id: 1, name: 'بيتزا مارغريتا', category: 'بيتزا', price: 12.99, stock: 45, enabled: true },
            { id: 2, name: 'سلطة قيصر', category: 'سلطات', price: 9.99, stock: 30, enabled: true },
            { id: 3, name: 'سمك مشوي', category: 'مأكولات', price: 18.99, stock: 15, enabled: true },
            { id: 4, name: 'كعكة الشوكولاتة', category: 'حلويات', price: 6.99, stock: 25, enabled: false },
            { id: 5, name: 'خبز الثوم', category: 'مقبلات', price: 5.99, stock: 50, enabled: true },
            { id: 6, name: 'عصير الليمون', category: 'مشروبات', price: 3.99, stock: 100, enabled: true },
          ];
        }
        setupEventListeners() {
          document.getElementById('mobileMenuBtn').addEventListener('click', () => { document.querySelector('.sidebar').classList.toggle('active'); });
          const searchInput = document.getElementById('productSearch');
          const categoryFilter = document.getElementById('categoryFilter');
          if (searchInput) { searchInput.addEventListener('input', (e) => { const query = e.target.value.toLowerCase(); this.filterProducts(query, categoryFilter?.value || ''); }); }
          if (categoryFilter) { categoryFilter.addEventListener('change', (e) => { const query = searchInput?.value.toLowerCase() || ''; this.filterProducts(query, e.target.value); }); }
          const logoutBtn = document.getElementById('logoutBtn');
          if (logoutBtn) { logoutBtn.addEventListener('click', () => { if (confirm('❓ هل أنت متأكد من رغبتك في تسجيل الخروج؟')) { window.location.href = 'logout.php'; } }); }
        }
        filterProducts(query, category) {
          const rows = document.querySelectorAll('#productsTableBody tr');
          rows.forEach((row) => {
            const name = row.cells[0]?.textContent.toLowerCase() || '';
            const cat = row.cells[1]?.textContent.toLowerCase() || '';
            const matchesQuery = query === '' || name.includes(query);
            const matchesCategory = category === '' || cat.includes(category);
            row.style.display = matchesQuery && matchesCategory ? '' : 'none';
          });
        }
        renderDashboard() {
          if (this.offline) return;
          this.updateSummaryCards();
          this.renderSalesChart();
          this.renderCategoryChart();
          this.renderProductsTable();
          this.updateLastUpdate();
        }
        updateSummaryCards() {
          const last7Days = this.orders.slice(0, 7);
          const totalSales = last7Days.reduce((sum, order) => sum + order.totalPrice, 0);
          const avgOrderValue = last7Days.length > 0 ? totalSales / last7Days.length : 0;
          const nextWeekPrediction = this.predictNextWeekSales().totalPredicted;
          document.getElementById('totalSales').textContent = `${totalSales.toFixed(2)} ج.م`;
          document.getElementById('totalOrders').textContent = last7Days.length;
          document.getElementById('avgOrderValue').textContent = `${avgOrderValue.toFixed(2)} ج.م`;
          document.getElementById('nextWeekPrediction').textContent = `${nextWeekPrediction.toFixed(2)} ج.م`;
          const activeItems = this.products.filter((p) => p.enabled).length;
          document.getElementById('activeItems').textContent = activeItems;
        }
        predictNextWeekSales(period = 7) {
          if (this.offline || this.orders.length === 0) { return { dates: [], predictions: [], totalPredicted: 0, data: null }; }
          const sortedOrders = [...this.orders].sort((a, b) => new Date(b.date) - new Date(a.date));
          const dailyTotals = {};
          sortedOrders.forEach((order) => { if (!dailyTotals[order.date]) dailyTotals[order.date] = 0; dailyTotals[order.date] += order.totalPrice; });
          const lastDays = Object.entries(dailyTotals).sort((a, b) => new Date(b[0]) - new Date(a[0])).slice(0, 7).map(([, total]) => total).reverse();
          const smaValue = lastDays.reduce((sum, val) => sum + val, 0) / lastDays.length;
          const predictions = [];
          const today = new Date();
          let totalPredicted = 0;
          for (let i = 1; i <= 7; i++) {
            const nextDate = new Date(today);
            nextDate.setDate(nextDate.getDate() + i);
            const variance = (Math.random() - 0.5) * smaValue * 0.2;
            const predictedValue = smaValue + variance;
            predictions.push({ date: nextDate.toISOString().split('T')[0], value: Math.max(0, predictedValue) });
            totalPredicted += predictedValue;
          }
          return { dates: predictions.map((p) => p.date), predictions: predictions.map((p) => p.value), lastDays: lastDays, totalPredicted: totalPredicted, smaValue: smaValue, data: this.formatChartData(lastDays, predictions) };
        }
        formatChartData(lastDays, predictions) {
          const today = new Date();
          const lastDayLabels = [];
          for (let i = 6; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            lastDayLabels.push(date.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' }));
          }
          const predictionLabels = predictions.map((p) => {
            const date = new Date(p.date);
            return date.toLocaleDateString('ar-SA', { month: 'short', day: 'numeric' });
          });
          return {
            labels: [...lastDayLabels, ...predictionLabels],
            datasets: [
              {
                label: 'المبيعات الفعلية',
                data: [...lastDays, null],
                borderColor: '#FF6B35',
                backgroundColor: 'rgba(255, 107, 53, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 6,
                pointBackgroundColor: '#FF6B35',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointHoverRadius: 8,
                cubicInterpolationMode: 'monotone',
              },
              {
                label: 'المبيعات المتوقعة',
                data: [null, ...predictions.map((p) => p.value)],
                borderColor: '#10B981',
                borderDash: [5, 5],
                backgroundColor: 'rgba(16, 185, 129, 0.05)',
                borderWidth: 3,
                fill: false,
                tension: 0.4,
                pointRadius: 6,
                pointBackgroundColor: '#10B981',
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointHoverRadius: 8,
                cubicInterpolationMode: 'monotone',
              },
            ],
          };
        }
        renderSalesChart() {
          const ctx = document.getElementById('salesChart');
          const predictedData = this.predictNextWeekSales();
          if (this.charts.sales) this.charts.sales.destroy();
          this.charts.sales = new Chart(ctx, {
            type: 'line',
            data: predictedData.data,
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: true, position: 'top', labels: { usePointStyle: true, padding: 20, font: { size: 13, weight: 'bold' }, color: '#1F2937', boxWidth: 8, boxHeight: 8 } },
                tooltip: {
                  mode: 'index',
                  intersect: false,
                  backgroundColor: 'rgba(0, 0, 0, 0.9)',
                  padding: 15,
                  titleFont: { size: 14, weight: 'bold' },
                  bodyFont: { size: 13 },
                  callbacks: {
                    label: (context) => {
                      if (context.parsed.y !== null) {
                        return `${context.dataset.label}: ${context.parsed.y.toFixed(2)} ج.م`;
                      }
                      return '';
                    },
                  },
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  grid: { drawBorder: false, color: 'rgba(0, 0, 0, 0.05)' },
                  ticks: { callback: (v) => v.toFixed(0) + ' ج.م', color: '#6B7280', font: { size: 12 } },
                },
                x: { grid: { display: false }, ticks: { color: '#6B7280', font: { size: 12 } } },
              },
            },
          });
        }
        renderCategoryChart() {
          const ctx = document.getElementById('categoryChart');
          if (this.charts.category) this.charts.category.destroy();
          this.charts.category = new Chart(ctx, {
            type: 'doughnut',
            data: {
              labels: ['البيتزا والفطائر', 'السلطات والشوربات', 'المشروبات والحلويات', 'وجبات أخرى'],
              datasets: [ { data: [38, 22, 25, 15], backgroundColor: ['#FF6B35', '#004E89', '#9B59B6', '#10B981'], borderColor: '#fff', borderWidth: 3, hoverOffset: 10 } ],
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { padding: 20, font: { size: 12, weight: 'bold' }, color: '#1F2937' } }, tooltip: { callbacks: { label: (context) => `${context.label}: ${context.parsed}%` } } } },
          });
        }
        renderProductsTable() {
          const tbody = document.getElementById('productsTableBody');
          tbody.innerHTML = '';
          this.products.forEach((product) => {
            const row = document.createElement('tr');
            row.innerHTML = `
              <td class="font-semibold text-gray-900">${product.name}</td>
              <td class="text-gray-600">${product.category}</td>
              <td class="font-bold text-orange-600">${product.price.toFixed(2)} ج.م</td>
              <td><span class="badge badge-warning">${product.stock} قطع</span></td>
              <td><span class="badge badge-success">${Math.floor(Math.random() * 500) + 50} مبيع</span></td>
              <td>
                <label class="toggle-switch">
                  <input type="checkbox" ${product.enabled ? 'checked' : ''} onchange="dashboard.toggleProduct(${product.id})">
                  <span class="slider"></span>
                </label>
              </td>
              <td>
                <button onclick="alert('تحرير: ${product.name}')" class="text-blue-600 hover:text-blue-800 font-bold mr-2"><i class="fas fa-edit"></i></button>
              </td>
            `;
            tbody.appendChild(row);
          });
        }
        renderOrdersTable() {
          const tbody = document.getElementById('ordersTableBody');
          if (!tbody) return;
          tbody.innerHTML = '';
          const statuses = ['جديد', 'قيد الإعداد', 'جاهز', 'مسلم'];
          const statusBadges = { جديد: 'badge-danger', 'قيد الإعداد': 'badge-warning', جاهز: 'badge-warning', مسلم: 'badge-success' };
          for (let i = 0; i < 8; i++) {
            const status = statuses[Math.floor(Math.random() * statuses.length)];
            const row = document.createElement('tr');
            row.innerHTML = `
              <td class="font-semibold text-orange-600">#ORD-${1000 + i}</td>
              <td class="text-gray-700">أحمد محمد</td>
              <td class="font-bold text-gray-900">${(Math.random() * 100 + 25).toFixed(2)} ج.م</td>
              <td class="text-center">${Math.floor(Math.random() * 5) + 1}</td>
              <td><span class="badge ${statusBadges[status]}">${status}</span></td>
              <td class="text-gray-600">${Math.floor(Math.random() * 60)} دقيقة</td>
              <td><button onclick="alert('عرض التفاصيل')" class="text-blue-600 hover:text-blue-800 font-bold"><i class="fas fa-eye"></i></button></td>
            `;
            tbody.appendChild(row);
          }
        }
        renderRevenueChart() {
          const ctx = document.getElementById('revenueChart');
          if (!ctx) return;
          if (this.charts.revenue) this.charts.revenue.destroy();
          this.charts.revenue = new Chart(ctx, {
            type: 'bar',
            data: {
              labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'],
              datasets: [ { label: 'الإيرادات', data: [2400, 2210, 2290, 2000, 2181, 2500], backgroundColor: 'rgba(255, 107, 53, 0.8)' } ],
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, labels: { color: '#1F2937', font: { size: 12, weight: 'bold' } } } }, scales: { y: { ticks: { callback: (v) => v + ' ج.م', color: '#6B7280' } } } },
          });
        }
        renderPerformanceChart() {
          const ctx = document.getElementById('performanceChart');
          if (!ctx) return;
          if (this.charts.performance) this.charts.performance.destroy();
          this.charts.performance = new Chart(ctx, {
            type: 'line',
            data: {
              labels: ['الأسبوع 1', 'الأسبوع 2', 'الأسبوع 3', 'الأسبوع 4'],
              datasets: [
                { label: 'الطلبات', data: [120, 150, 140, 170], borderColor: '#FF6B35', backgroundColor: 'rgba(255, 107, 53, 0.1)', borderWidth: 3, tension: 0.4 },
                { label: 'الإيرادات (ج.م)', data: [2000, 2500, 2300, 2800], borderColor: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.1)', borderWidth: 3, tension: 0.4 },
              ],
            },
            options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, labels: { color: '#1F2937', font: { size: 12, weight: 'bold' } } } } },
          });
        }
        toggleProduct(productId) {
          const product = this.products.find((p) => p.id === productId);
          if (product) {
            product.enabled = !product.enabled;
            localStorage.setItem('restaurantProducts', JSON.stringify(this.products));
          }
        }
        
        async loadActivityLogs() {
          try {
            const res = await fetch('../api/log.php?action=get_activities&limit=50', { credentials: 'same-origin' });
            if (res.ok) {
              const data = await res.json();
              if (data.success && data.logs) {
                const tbody = document.getElementById('activityLogsTableBody');
                if (!tbody) return;
                tbody.innerHTML = '';
                
                data.logs.forEach((log) => {
                  const row = document.createElement('tr');
                  const dateTime = new Date(log.created_at).toLocaleString('ar-SA');
                  row.innerHTML = `
                    <td class="text-sm text-gray-600">${dateTime}</td>
                    <td class="font-semibold"><span class="badge badge-warning">${log.activity_type}</span></td>
                    <td class="text-gray-700">${log.user_name || log.user_id || 'system'}</td>
                    <td class="text-sm text-gray-600">${log.action.substring(0, 60)}</td>
                    <td class="text-xs"><span class="badge ${log.status === 'success' ? 'badge-success' : 'badge-danger'}">${log.status}</span></td>
                  `;
                  tbody.appendChild(row);
                });
              }
            }
          } catch (e) {
            console.error('Failed to load activity logs', e);
          }
        }
        
        async loadSalesStats() {
          try {
            const res = await fetch('../api/log.php?action=get_dashboard_logs', { credentials: 'same-origin' });
            if (res.ok) {
              const data = await res.json();
              if (data.success) {
                document.getElementById('todaySalesTotal').textContent = `${(data.today_stats?.total_sales || 0).toFixed(2)} ج.م`;
                document.getElementById('todayOrdersCount').textContent = data.today_stats?.total_orders || 0;
                document.getElementById('weekSalesTotal').textContent = `${(data.week_stats?.total_sales || 0).toFixed(2)} ج.م`;
                document.getElementById('weekOrdersCount').textContent = data.week_stats?.total_orders || 0;
              }
            }
          } catch (e) {
            console.error('Failed to load sales stats', e);
          }
        }
        updateLastUpdate() {
          const now = new Date();
          const timeStr = now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
          document.getElementById('lastUpdate').textContent = timeStr;
        }
        showOfflineState() {
          const dash = document.getElementById('dashboard');
          if (dash) {
            dash.innerHTML = `
              <div class="offline-placeholder d-flex flex-column align-items-center justify-content-center py-10">
                <i class="fas fa-server-slash fa-5x text-gray-400"></i>
                <h3 class="mt-4 text-2xl font-semibold">الخدمة غير متوفرة حالياً - السيرفر مغلق</h3>
                <p class="text-gray-500 mt-2">البيانات ستظهر عند استعادة الاتصال</p>
              </div>`;
          }
        }
        startAutoRefresh() {
          if (this.offline) return;
          setInterval(async () => {
            await this.loadData();
            this.updateSummaryCards();
            this.updateLastUpdate();
            try { this.renderSalesChart(); this.renderCategoryChart(); } catch (e) {}
          }, 1 * 60 * 1000);
        }
      }
      function switchTab(tabName) {
        document.querySelectorAll('.tab-content').forEach((tab) => tab.classList.add('hidden'));
        document.getElementById(`${tabName}-tab`).classList.remove('hidden');
        document.querySelectorAll('.nav-item').forEach((item) => item.classList.remove('active'));
        if (event && event.target) {
          event.target.closest('.nav-item')?.classList.add('active');
          document.querySelector('.sidebar').classList.remove('active');
        }
        setTimeout(() => {
          if (tabName === 'income') dashboard.renderRevenueChart();
          if (tabName === 'orders') dashboard.renderOrdersTable();
          if (tabName === 'analytics') dashboard.renderPerformanceChart();
          if (tabName === 'products') dashboard.renderProductsTable();
          if (tabName === 'logs') dashboard.loadActivityLogs();
          if (tabName === 'statistics') dashboard.loadSalesStats();
        }, 100);
      }
      function refreshChart() { dashboard.renderSalesChart(); dashboard.updateLastUpdate(); }
      async function refreshAll() {
        try { await dashboard.loadData(); dashboard.renderDashboard(); dashboard.updateLastUpdate(); } catch (e) { console.error('Refresh failed', e); }
      }
      const dashboard = new AdminDashboard();
    </script>
  </body>
</html>
