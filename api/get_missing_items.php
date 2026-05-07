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

    // Find items that haven't been ordered in the last 7 days
    // This indicates they might be out of stock or unavailable
    $stmt = $pdo->prepare('
        SELECT
            item_name,
            MAX(o.created_at) as last_ordered,
            DATEDIFF(CURDATE(), MAX(o.created_at)) as days_since_last_order
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.order_id
        GROUP BY item_name
        HAVING days_since_last_order > 7
        ORDER BY days_since_last_order DESC
        LIMIT 20
    ');

    $stmt->execute();
    $missingItems = $stmt->fetchAll();

    // Also check for items that have never been ordered (if we had a menu table)
    // For now, we'll just return items with low recent activity

    respond(200, [
        'success' => true,
        'missing_items' => $missingItems,
        'total_missing' => count($missingItems),
        'message' => 'تم العثور على منتجات قد تكون ناقصة أو غير متوفرة',
    ]);

} catch (Throwable $e) {
    respond(500, [
        'success' => false,
        'error' => 'خطأ في الخادم: ' . $e->getMessage(),
    ]);
}
?>