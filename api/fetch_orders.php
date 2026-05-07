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

    // Fetch all orders with their items
    $ordersStmt = $pdo->prepare(
        'SELECT
            o.order_id,
            o.customer_name,
            o.phone,
            o.address,
            o.total_price,
            o.order_status,
            o.created_at,
            GROUP_CONCAT(m.item_name SEPARATOR "|") as items
        FROM orders o
        LEFT JOIN order_items oi ON o.order_id = oi.order_id
        LEFT JOIN menu m ON oi.menu_id = m.id
        WHERE o.address IS NOT NULL AND o.address != ""
        GROUP BY o.order_id
        ORDER BY o.created_at DESC'
    );
    $ordersStmt->execute();
    $ordersData = $ordersStmt->fetchAll();

    // Format orders data for frontend processing
    $orders = [];
    foreach ($ordersData as $order) {
        $orders[] = [
            'order_id' => (int)$order['order_id'],
            'customer_name' => $order['customer_name'],
            'phone' => $order['phone'],
            'address' => $order['address'],
            'total_price' => (float)$order['total_price'],
            'order_status' => $order['order_status'],
            'created_at' => $order['created_at'],
            'items' => $order['items'] ? explode('|', $order['items']) : []
        ];
    }

    respond(200, [
        'success' => true,
        'data' => $orders,
        'total' => count($orders)
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