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

    // ============================================================
    // 1. MARKET BASKET ANALYSIS - Items Bought Together
    // ============================================================
    $basketStmt = $pdo->prepare(
        'SELECT 
            oi1.item_name as item1,
            oi2.item_name as item2,
            COUNT(*) as frequency
        FROM order_items oi1
        INNER JOIN order_items oi2 
            ON oi1.order_id = oi2.order_id 
            AND oi1.item_id < oi2.item_id
        GROUP BY oi1.item_id, oi2.item_id
        ORDER BY frequency DESC
        LIMIT 8'
    );
    $basketStmt->execute();
    $basketAnalysis = $basketStmt->fetchAll();

    // Format basket analysis for chart
    $basketData = [];
    foreach ($basketAnalysis as $pair) {
        $basketData[] = [
            'pair' => $pair['item1'] . ' + ' . $pair['item2'],
            'frequency' => (int)$pair['frequency']
        ];
    }

    // ============================================================
    // 2. DAILY TRAFFIC HEATMAP - Order Density by Day of Week
    // ============================================================
    $heatmapStmt = $pdo->prepare(
        'SELECT 
            DAYNAME(created_at) as day_name,
            DAYOFWEEK(created_at) as day_num,
            COUNT(*) as order_count,
            COALESCE(SUM(total_price), 0) as daily_revenue
        FROM orders
        GROUP BY DAYOFWEEK(created_at), DAYNAME(created_at)
        ORDER BY day_num ASC'
    );
    $heatmapStmt->execute();
    $heatmapData = $heatmapStmt->fetchAll();

    // Map day names to Arabic and organize
    $dayMapping = [
        'Sunday' => 'الأحد',
        'Monday' => 'الاثنين',
        'Tuesday' => 'الثلاثاء',
        'Wednesday' => 'الأربعاء',
        'Thursday' => 'الخميس',
        'Friday' => 'الجمعة',
        'Saturday' => 'السبت'
    ];

    $heatmapFormatted = [];
    $maxOrders = 1; // avoid division by zero

    // Find max for normalization
    foreach ($heatmapData as $day) {
        if ((int)$day['order_count'] > $maxOrders) {
            $maxOrders = (int)$day['order_count'];
        }
    }

    foreach ($heatmapData as $day) {
        $englishDay = $day['day_name'];
        $arabicDay = $dayMapping[$englishDay] ?? $englishDay;
        $orderCount = (int)$day['order_count'];
        $intensity = $maxOrders > 0 ? ($orderCount / $maxOrders) : 0;

        $heatmapFormatted[] = [
            'day' => $arabicDay,
            'day_en' => $englishDay,
            'order_count' => $orderCount,
            'revenue' => (float)$day['daily_revenue'],
            'intensity' => $intensity
        ];
    }

    // ============================================================
    // 3. REGIONAL SALES MAP - Orders by Address
    // ============================================================
    $regionStmt = $pdo->prepare(
        'SELECT 
            address,
            COUNT(*) as order_count,
            COALESCE(SUM(total_price), 0) as region_revenue
        FROM orders
        WHERE address IS NOT NULL AND address != ""
        GROUP BY address
        ORDER BY order_count DESC
        LIMIT 20'
    );
    $regionStmt->execute();
    $regionData = $regionStmt->fetchAll();

    // Format regional data with mock coordinates
    // In production, you might use a geocoding API to get lat/lng
    $regionFormatted = [];
    foreach ($regionData as $region) {
        // Mock coordinates - In production use real geocoding
        $mockLat = 30.0444 + (rand(-100, 100) / 1000);
        $mockLng = 31.2357 + (rand(-100, 100) / 1000);

        $regionFormatted[] = [
            'address' => $region['address'],
            'order_count' => (int)$region['order_count'],
            'revenue' => (float)$region['region_revenue'],
            'latitude' => $mockLat,
            'longitude' => $mockLng
        ];
    }

    // ============================================================
    // General Statistics
    // ============================================================
    $statsStmt = $pdo->prepare(
        'SELECT 
            COUNT(DISTINCT order_id) as total_orders,
            COALESCE(SUM(total_price), 0) as total_revenue,
            COUNT(DISTINCT address) as unique_regions,
            AVG(total_price) as avg_order_value
        FROM orders
        WHERE address IS NOT NULL AND address != ""'
    );
    $statsStmt->execute();
    $stats = $statsStmt->fetch();

    respond(200, [
        'success' => true,
        'data' => [
            'marketBasket' => $basketData,
            'dailyTraffic' => $heatmapFormatted,
            'regionalSales' => $regionFormatted,
            'statistics' => [
                'total_orders' => (int)$stats['total_orders'],
                'total_revenue' => (float)$stats['total_revenue'],
                'unique_regions' => (int)$stats['unique_regions'],
                'avg_order_value' => (float)$stats['avg_order_value']
            ]
        ]
    ]);

} catch (PDOException $e) {
    respond(500, [
        'success' => false,
        'error' => 'Database error: ' . $e->getMessage()
    ]);
} catch (Exception $e) {
    respond(500, [
        'success' => false,
        'error' => 'Server error: ' . $e->getMessage()
    ]);
}
