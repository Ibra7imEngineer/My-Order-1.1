<?php
header('Content-Type: application/json; charset=utf-8');
require __DIR__ . '/db.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method Not Allowed']);
    exit;
}

$payload = json_decode(file_get_contents('php://input'), true);
if (!$payload) $payload = $_POST;

// authenticate
if (!is_admin_authenticated()) {
    $provided = $payload['api_secret'] ?? '';
    if (empty($order_config['api_secret']) || $provided !== $order_config['api_secret']) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit;
    }
}

$orderId = $payload['orderId'] ?? null;
$newStatus = $payload['status'] ?? null;

if (!$orderId || !$newStatus) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Missing orderId or status']);
    exit;
}

try {
    $stmt = $pdo->prepare('UPDATE orders SET status = ? WHERE order_id = ?');
    $stmt->execute([$newStatus, $orderId]);
    echo json_encode(['success' => true, 'rows' => $stmt->rowCount()]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'DB error', 'error' => $e->getMessage()]);
}
