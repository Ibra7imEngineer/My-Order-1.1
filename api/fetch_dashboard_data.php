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
    $summaryStmt = $pdo->prepare(
        'SELECT COALESCE(SUM(total_price), 0) AS total_revenue, COUNT(order_id) AS total_orders FROM orders'
    );
    $summaryStmt->execute();
    $summary = $summaryStmt->fetch();

    // عد الأيام الفريدة التي تحتوي على طلبات
    $activeDaysStmt = $pdo->prepare('SELECT COUNT(DISTINCT DATE(created_at)) AS active_days FROM orders');
    $activeDaysStmt->execute();
    $activeDaysResult = $activeDaysStmt->fetch();
    $activeDays = max((int)$activeDaysResult['active_days'], 1); // تجنب القسمة على صفر
    $averageDailyRevenue = (float)$summary['total_revenue'] / $activeDays;

    // وقت الذروة
    $peakStmt = $pdo->prepare(
        'SELECT HOUR(created_at) AS peak_hour, COUNT(*) AS order_count FROM orders GROUP BY HOUR(created_at) ORDER BY order_count DESC LIMIT 1'
    );
    $peakStmt->execute();
    $peakRow = $peakStmt->fetch();

    $peakHour = null;
    if ($peakRow !== false && isset($peakRow['peak_hour'])) {
        $hour = (int) $peakRow['peak_hour'];
        $peakHour = sprintf('%02d:00', $hour);
    }

    // بيانات الإيرادات اليومية (آخر 7 أيام)
    $dailyStmt = $pdo->prepare(
        'SELECT DATE(created_at) as date, COALESCE(SUM(total_price), 0) as revenue
         FROM orders
         WHERE created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 DAY)
         GROUP BY DATE(created_at)
         ORDER BY DATE(created_at) ASC'
    );
    $dailyStmt->execute();
    $dailyRevenue = $dailyStmt->fetchAll();

    // بيانات الطلبات التفصيلية (للتصدير CSV)
    $ordersStmt = $pdo->prepare(
        'SELECT order_id, customer_name, phone, address, total_price, order_status, created_at FROM orders ORDER BY created_at DESC'
    );
    $ordersStmt->execute();
    $orders = $ordersStmt->fetchAll();

    // بيانات المبيعات حسب الفئة (يمكن تعديل حسب جدولة الأصناف)
    // مبدئياً نعود 0 للمساعدة على استعلام العميل
    $categorySales = [
        'food' => 0,
        'drinks' => 0,
        'sweets' => 0,
    ];

    respond(200, [
        'success' => true,
        'total_revenue' => (float) $summary['total_revenue'],
        'total_orders' => (int) $summary['total_orders'],
        'active_days' => $activeDays,
        'average_daily_revenue' => round($averageDailyRevenue, 2),
        'peak_hour' => $peakHour ?? 'غير متاح',
        'daily_revenue' => $dailyRevenue,
        'category_sales' => $categorySales,
        'orders' => $orders,
        'most_popular_item' => null,
    ]);

} catch (Throwable $exception) {
    respond(500, [
        'success' => false,
        'error' => 'خطأ في قاعدة البيانات: ' . $exception->getMessage(),
    ]);
}
