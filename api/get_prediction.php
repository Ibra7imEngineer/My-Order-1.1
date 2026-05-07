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

    // Get all orders data for analysis
    $ordersStmt = $pdo->prepare('
        SELECT total_price, created_at
        FROM orders
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        ORDER BY created_at ASC
    ');
    $ordersStmt->execute();
    $orders = $ordersStmt->fetchAll();

    if (empty($orders)) {
        respond(200, [
            'success' => true,
            'predicted_amount' => 0,
            'daily_average' => 0,
            'growth_rate' => 0,
            'data_points' => 0,
            'message' => 'لا توجد بيانات كافية للتنبؤ. يرجى انتظار المزيد من الطلبات.',
        ]);
    }

    // Calculate daily revenues for the last 7 days
    $dailyRevenues = [];
    $sevenDaysAgo = date('Y-m-d', strtotime('-7 days'));

    foreach ($orders as $order) {
        $orderDate = date('Y-m-d', strtotime($order['created_at']));
        if ($orderDate >= $sevenDaysAgo) {
            if (!isset($dailyRevenues[$orderDate])) {
                $dailyRevenues[$orderDate] = 0;
            }
            $dailyRevenues[$orderDate] += (float) $order['total_price'];
        }
    }

    // Calculate metrics
    $totalRevenue7Days = array_sum($dailyRevenues);
    $daysWithData = count($dailyRevenues);
    $dailyAverage = $daysWithData > 0 ? $totalRevenue7Days / $daysWithData : 0;

    // If we have less than 7 days of data, use all available data
    if ($daysWithData < 7) {
        $allRevenue = array_sum(array_column($orders, 'total_price'));
        $totalDays = count($orders) > 0 ? count($orders) : 1; // Avoid division by zero
        $dailyAverage = $allRevenue / $totalDays;
    }

    // Calculate growth rate (comparing last 3 days vs previous 3 days)
    $dates = array_keys($dailyRevenues);
    sort($dates);
    $recent3Days = array_slice($dates, -3);
    $previous3Days = array_slice($dates, -6, 3);

    $recentRevenue = 0;
    $previousRevenue = 0;

    foreach ($recent3Days as $date) {
        $recentRevenue += $dailyRevenues[$date] ?? 0;
    }
    foreach ($previous3Days as $date) {
        $previousRevenue += $dailyRevenues[$date] ?? 0;
    }

    $growthRate = 0;
    if ($previousRevenue > 0) {
        $growthRate = (($recentRevenue - $previousRevenue) / $previousRevenue) * 100;
    }

    // Predict next week's sales
    $predictedAmount = round($dailyAverage * 7, 2);

    respond(200, [
        'success' => true,
        'predicted_amount' => $predictedAmount,
        'daily_average' => round($dailyAverage, 2),
        'growth_rate' => round($growthRate, 2),
        'data_points' => $daysWithData,
        'total_revenue_7days' => $totalRevenue7Days,
        'message' => 'التوقع مبني على بيانات حقيقية من قاعدة البيانات',
    ]);

} catch (Throwable $e) {
    respond(500, [
        'success' => false,
        'error' => 'خطأ في الخادم: ' . $e->getMessage(),
    ]);
}
?>