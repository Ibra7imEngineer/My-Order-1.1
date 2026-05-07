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

function mapCategoryLabel(string $arabicCategory): string
{
    $normalized = trim($arabicCategory);
    if ($normalized === 'أطعمة') {
        return 'Food';
    }
    if ($normalized === 'مشروبات') {
        return 'Drinks';
    }
    if ($normalized === 'حلويات') {
        return 'Sweets';
    }

    return $normalized;
}

try {
    $pdo = new PDO($dsn, $dbUser, $dbPass, $options);

    // Total orders count
    $totalOrdersStmt = $pdo->prepare('SELECT COUNT(*) AS total_orders FROM orders');
    $totalOrdersStmt->execute();
    $totalOrders = (int) $totalOrdersStmt->fetch()['total_orders'];

    // Total revenue (sum of prices)
    $totalRevenueStmt = $pdo->prepare('SELECT COALESCE(SUM(total_price), 0) AS total_revenue FROM orders');
    $totalRevenueStmt->execute();
    $totalRevenue = (float) $totalRevenueStmt->fetch()['total_revenue'];

    // Count unique days with orders
    $activeDaysStmt = $pdo->prepare('SELECT COUNT(DISTINCT DATE(created_at)) AS active_days FROM orders');
    $activeDaysStmt->execute();
    $activeDays = (int) $activeDaysStmt->fetch()['active_days'];
    // Fallback: if no orders, set to 1 to avoid division by zero
    $activeDays = max($activeDays, 1);
    $averageDailyRevenue = $totalRevenue / $activeDays;

    // Latest 10 orders
    $latestOrdersStmt = $pdo->prepare('SELECT order_id, customer_name, phone, address, total_price, order_status, created_at AS order_date FROM orders ORDER BY created_at DESC LIMIT 10');
    $latestOrdersStmt->execute();
    $latestOrders = $latestOrdersStmt->fetchAll();

    // Daily revenue for the last 7 days
    $dailyRevenueStmt = $pdo->prepare('
        SELECT DATE(created_at) as date, COALESCE(SUM(total_price), 0) as revenue
        FROM orders
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
        GROUP BY DATE(created_at)
        ORDER BY DATE(created_at) ASC
    ');
    $dailyRevenueStmt->execute();
    $dailyRevenue = $dailyRevenueStmt->fetchAll();

    // Category sales - using the actual category column from order_items
    $categorySales = [];

    // Get category data from order_items table with better handling
    try {
        // Query the actual category column stored in order_items, excluding '0' and NULL values
        $categoryStmt = $pdo->prepare('
            SELECT
                category,
                SUM(quantity * unit_price) as revenue
            FROM order_items
            WHERE category IS NOT NULL 
            AND category != "" 
            AND category != "0"
            GROUP BY category
            ORDER BY revenue DESC
        ');
        $categoryStmt->execute();
        $categoryResults = $categoryStmt->fetchAll();

        foreach ($categoryResults as $row) {
            $categoryName = trim((string)$row['category']);
            if ($categoryName !== '') {
                $categoryLabel = mapCategoryLabel($categoryName);
                $categorySales[$categoryLabel] = (float) $row['revenue'];
            }
        }
    } catch (Exception $e) {
        // Table might not exist, continue with empty categories
    }

    // أكثر منتج مبيعاً
    $topProductStmt = $pdo->prepare('SELECT item_name, SUM(quantity) AS total_qty FROM order_items GROUP BY item_name ORDER BY total_qty DESC LIMIT 1');
    $topProductStmt->execute();
    $topProductRow = $topProductStmt->fetch();
    $topProduct = $topProductRow && !empty(trim((string)($topProductRow['item_name'] ?? ''))) ? $topProductRow['item_name'] : 'No Data';

    // Peak ordering time
    $peakHourStmt = $pdo->prepare('SELECT HOUR(created_at) AS peak_hour, COUNT(*) AS cnt FROM orders GROUP BY peak_hour ORDER BY cnt DESC LIMIT 1');
    $peakHourStmt->execute();
    $peakHourRow = $peakHourStmt->fetch();
    if ($peakHourRow && isset($peakHourRow['peak_hour']) && $peakHourRow['peak_hour'] !== null) {
        $hourInt = (int)$peakHourRow['peak_hour'];
        $peakHour = str_pad((string)$hourInt, 2, '0', STR_PAD_LEFT) . ':00';
    } else {
        $peakHour = 'No Data';
    }

    // Hourly orders for the Peak Ordering Time area chart
    $hourlyOrdersStmt = $pdo->prepare('
        SELECT HOUR(created_at) AS hour_of_day, COUNT(*) AS order_count
        FROM orders
        GROUP BY hour_of_day
        ORDER BY hour_of_day ASC
    ');
    $hourlyOrdersStmt->execute();
    $hourlyOrdersRows = $hourlyOrdersStmt->fetchAll();

    $hourlyOrderCounts = array_fill(0, 24, 0);
    foreach ($hourlyOrdersRows as $row) {
        if (isset($row['hour_of_day']) && $row['hour_of_day'] !== null) {
            $hourIndex = (int)$row['hour_of_day'];
            if ($hourIndex >= 0 && $hourIndex <= 23) {
                $hourlyOrderCounts[$hourIndex] = (int)$row['order_count'];
            }
        }
    }

    $hourlyOrders = [
        'labels' => [],
        'data' => [],
    ];
    foreach (range(0, 23) as $hour) {
        $period = $hour >= 12 ? 'PM' : 'AM';
        $hour12 = $hour % 12 === 0 ? 12 : $hour % 12;
        $hourlyOrders['labels'][] = sprintf('%d %s', $hour12, $period);
        $hourlyOrders['data'][] = $hourlyOrderCounts[$hour];
    }

    // Check for missing/unavailable items
    $missingItemsStmt = $pdo->prepare('
        SELECT
            item_name,
            MAX(o.created_at) as last_ordered,
            DATEDIFF(CURDATE(), MAX(o.created_at)) as days_since_last_order
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.order_id
        GROUP BY item_name
        HAVING days_since_last_order > 7
        ORDER BY days_since_last_order DESC
        LIMIT 10
    ');
    $missingItemsStmt->execute();
    $missingItems = $missingItemsStmt->fetchAll();

    respond(200, [
        'success' => true,
        'total_orders' => $totalOrders,
        'total_revenue' => $totalRevenue,
        'active_days' => $activeDays,
        'average_daily_revenue' => round($averageDailyRevenue, 2),
        'top_product' => $topProduct,
        'peak_hour' => $peakHour,
        'latest_orders' => $latestOrders,
        'daily_revenue' => $dailyRevenue,
        'hourly_orders' => $hourlyOrders,
        'category_sales' => $categorySales,
        'missing_items' => $missingItems,
        'missing_items_count' => count($missingItems),
    ]);

} catch (Throwable $e) {
    respond(500, [
        'success' => false,
        'error' => 'خطأ في الخادم: ' . $e->getMessage(),
    ]);
}
