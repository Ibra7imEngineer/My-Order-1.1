<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
require __DIR__ . '/db.php';

// Only allow admin sessions or API secret
if (!is_admin_authenticated()) {
    $provided = $_GET['api_secret'] ?? '';
    if (empty($order_config['api_secret']) || $provided !== $order_config['api_secret']) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit;
    }
}

$statusFilter = isset($_GET['status']) ? $_GET['status'] : null;

try {
    if ($statusFilter) {
        $stmt = $pdo->prepare('SELECT * FROM orders WHERE status = ? ORDER BY created_at DESC');
        $stmt->execute([$statusFilter]);
    } else {
        $stmt = $pdo->query('SELECT * FROM orders ORDER BY created_at DESC');
    }
    $orders = $stmt->fetchAll();
    echo json_encode(['success' => true, 'orders' => $orders], JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'DB error', 'error' => $e->getMessage()]);
}
