<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/db_config.php';

function respond(int $statusCode, array $payload): void
{
    http_response_code($statusCode);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

try {
    $pdo = new PDO($dsn, $dbUser, $dbPass, $options);

    // إجمالي الإيرادات وعدد الطلبات
    $summarySql = 'SELECT COALESCE(SUM(total_price),0) AS total_revenue, COUNT(*) AS total_orders FROM orders';
    $summary = $pdo->query($summarySql)->fetch();

    // عد الأيام الفريدة التي تحتوي على طلبات
    $activeDaysSql = 'SELECT COUNT(DISTINCT DATE(created_at)) AS active_days FROM orders';
    $activeDaysResult = $pdo->query($activeDaysSql)->fetch();
    $activeDays = max((int)$activeDaysResult['active_days'], 1); // تجنب القسمة على صفر
    $averageDailyRevenue = (float)$summary['total_revenue'] / $activeDays;

    // أكثر منتج مبيعاً
    $topProductSql = 'SELECT item_name, SUM(quantity) AS total_qty
                      FROM order_items
                      GROUP BY item_name
                      ORDER BY total_qty DESC
                      LIMIT 1';
    $topProductRow = $pdo->query($topProductSql)->fetch();
    $topProduct = $topProductRow && !empty(trim((string)($topProductRow['item_name'] ?? ''))) ? $topProductRow['item_name'] : 'No Data';

    // Peak ordering hour
    $peakHourStmt = $pdo->prepare('SELECT HOUR(created_at) AS peak_hour, COUNT(*) AS cnt FROM orders GROUP BY peak_hour ORDER BY cnt DESC LIMIT 1');
    $peakHourStmt->execute();
    $peakHourRow = $peakHourStmt->fetch();
    if ($peakHourRow && isset($peakHourRow['peak_hour']) && $peakHourRow['peak_hour'] !== null) {
        $hourInt = (int)$peakHourRow['peak_hour'];
        $peakHour = str_pad((string)$hourInt, 2, '0', STR_PAD_LEFT) . ':00';
    } else {
        $peakHour = 'No Data';
    }

    // بيانات الإيرادات اليومية لآخر 7 أيام
    $dailyRevenueSql = 'SELECT DATE(created_at) AS date, COALESCE(SUM(total_price),0) AS revenue
                        FROM orders
                        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
                        GROUP BY DATE(created_at)
                        ORDER BY DATE(created_at) ASC';
    $dailyRows = $pdo->query($dailyRevenueSql)->fetchAll();

    // تأكد من تكملة الأيام الفارغة (آخر 7 أيام)
    $dailyRevenue = [];
    $dayMap = [];
    foreach ($dailyRows as $row) {
        $dayMap[ $row['date'] ] = (float) $row['revenue'];
    }

    for ($i = 6; $i >= 0; $i--) {
        $d = new DateTime();
        $d->modify("-{$i} days");
        $key = $d->format('Y-m-d');
        $dailyRevenue[] = [
            'date' => $key,
            'revenue' => isset($dayMap[$key]) ? $dayMap[$key] : 0,
        ];
    }

    // فئات المبيعات (طعام/مشروبات/حلويات) عبر item_name إن لم تكن هناك فئة category
    $categorySql = 'SELECT
                        CASE
                            WHEN LOWER(item_name) LIKE "%قهوة%" OR LOWER(item_name) LIKE "%شاي%" OR LOWER(item_name) LIKE "%عصير%" OR LOWER(item_name) LIKE "%ماء%" OR LOWER(item_name) LIKE "%drink%" OR LOWER(item_name) LIKE "%مشروبات%" THEN "drinks"
                            WHEN LOWER(item_name) LIKE "%حلو%" OR LOWER(item_name) LIKE "%كيك%" OR LOWER(item_name) LIKE "%بسكويت%" OR LOWER(item_name) LIKE "%حلويات%" THEN "sweets"
                            ELSE "food"
                        END AS category_key,
                        COALESCE(SUM(subtotal),0) AS category_revenue
                    FROM order_items
                    GROUP BY category_key';
    $categoryRows = $pdo->query($categorySql)->fetchAll();

    $categorySales = [
        'food' => 0,
        'drinks' => 0,
        'sweets' => 0,
    ];
    foreach ($categoryRows as $row) {
        if (isset($categorySales[$row['category_key']])) {
            $categorySales[$row['category_key']] = (float) $row['category_revenue'];
        }
    }

    // سحب الطلبات وتحميل العناصر المسماة (JOIN order_items)
    $ordersSql = 'SELECT o.order_id, o.customer_name, o.phone, o.address, o.total_price, o.order_status, o.created_at, 
                         GROUP_CONCAT(DISTINCT oi.item_name ORDER BY oi.item_name SEPARATOR ", ") AS item_names
                  FROM orders o
                  LEFT JOIN order_items oi ON oi.order_id = o.order_id
                  GROUP BY o.order_id
                  ORDER BY o.created_at DESC
                  LIMIT 200';
    $orders = $pdo->query($ordersSql)->fetchAll();

    respond(200, [
        'success' => true,
        'total_revenue' => (float) $summary['total_revenue'],
        'total_orders' => (int) $summary['total_orders'],
        'active_days' => $activeDays,
        'average_daily_revenue' => round($averageDailyRevenue, 2),
        'top_product' => $topProduct,
        'peak_hour' => $peakHour,
        'daily_revenue' => $dailyRevenue,
        'category_sales' => $categorySales,
        'orders' => $orders,
    ]);

} catch (Throwable $e) {
    respond(500, [
        'success' => false,
        'error' => 'خطأ في الخادم: ' . $e->getMessage(),
    ]);
}
