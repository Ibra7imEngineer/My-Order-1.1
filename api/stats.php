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

try {
    // determine table name (allow override from config)
    $table = 'orders';
    if (!empty($order_config['orders_table'])) {
        $candidate = $order_config['orders_table'];
        // basic validation: only allow letters, numbers and underscore
        if (preg_match('/^[A-Za-z0-9_]+$/', $candidate)) {
            $table = $candidate;
        }
    }

    // Aggregates
    $sqlAgg = "SELECT COALESCE(SUM(total),0) AS revenue, COUNT(*) AS orders, COALESCE(AVG(total),0) AS avg_order FROM `" . $table . "`";
    $stmt = $pdo->query($sqlAgg);
    $agg = $stmt->fetch(PDO::FETCH_ASSOC);

    // 7-day trend (last 7 days including today)
    $trendSql = "SELECT DATE(created_at) AS day, COALESCE(SUM(total),0) AS total FROM `" . $table . "` WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY) GROUP BY DATE(created_at) ORDER BY DATE(created_at) ASC";
    $trendStmt = $pdo->prepare($trendSql);
    $trendStmt->execute();
    $trend = [];
    $trendRows = $trendStmt->fetchAll(PDO::FETCH_ASSOC);
    // normalize to exact 7-day window
    $days = [];
    for ($i = 6; $i >= 0; $i--) {
        $d = date('Y-m-d', strtotime("-{$i} days"));
        $days[$d] = 0;
    }
    foreach ($trendRows as $r) {
        $days[$r['day']] = (float)$r['total'];
    }

    $trendData = array_map(function($day, $total){ return ['day' => $day, 'total' => (float)$total]; }, array_keys($days), $days);

    // إضافة عدد رسائل التواصل إلى الإحصائيات
    try {
        $cntStmt = $pdo->query("SELECT COUNT(*) AS total FROM contact_messages");
        $cntRow = $cntStmt->fetch(PDO::FETCH_ASSOC);
        $contactsCount = isset($cntRow['total']) ? (int)$cntRow['total'] : 0;
    } catch (Exception $e) {
        $contactsCount = 0;
    }

    echo json_encode([
        'success' => true,
        'revenue' => (float)$agg['revenue'],
        'orders' => (int)$agg['orders'],
        'avg_order' => (float)$agg['avg_order'],
        'trend' => array_values($trendData),
        'contacts' => $contactsCount,
    ], JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'DB error', 'error' => $e->getMessage()]);
}

