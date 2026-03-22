<?php
/**
 * API endpoint لإدارة السجلات والأنشطة
 * Logging API endpoint
 */
require __DIR__ . '/db.php';
header('Content-Type: application/json; charset=utf-8');

$action = $_GET['action'] ?? $_POST['action'] ?? null;
$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($action) {
        // تسجيل نشاط عام
        case 'log_activity':
            if ($method !== 'POST') {
                throw new Exception('POST method required');
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            $result = log_activity(
                $data['activity_type'] ?? 'unknown',
                $data['action'] ?? 'unknown',
                [
                    'user_type' => $data['user_type'] ?? 'customer',
                    'user_id' => $data['user_id'] ?? null,
                    'user_name' => $data['user_name'] ?? null,
                    'item_id' => $data['item_id'] ?? null,
                    'item_name' => $data['item_name'] ?? null,
                    'old_value' => $data['old_value'] ?? null,
                    'new_value' => $data['new_value'] ?? null,
                    'status' => $data['status'] ?? 'success',
                ]
            );
            
            echo json_encode([
                'success' => $result,
                'message' => $result ? 'نشاط مسجل بنجاح' : 'فشل التسجيل',
            ]);
            break;
        
        // تسجيل جلسة المستخدم
        case 'log_session':
            if ($method !== 'POST') {
                throw new Exception('POST method required');
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            $result = log_user_session(
                $data['user_type'] ?? 'customer',
                $data['user_id'] ?? null,
                $data['user_name'] ?? null,
                $data['action'] ?? 'login',
                $data['status'] ?? 'success'
            );
            
            echo json_encode([
                'success' => $result,
                'message' => $result ? 'جلسة مسجلة' : 'فشل التسجيل',
            ]);
            break;
        
        // تسجيل تاريخ الطلب
        case 'log_order':
            if ($method !== 'POST') {
                throw new Exception('POST method required');
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            $result = log_order_history(
                $data['order_id'] ?? null,
                $data['action'] ?? 'update',
                $data['old_status'] ?? null,
                $data['new_status'] ?? null,
                $data['changed_by'] ?? null,
                $data['reason'] ?? null
            );
            
            echo json_encode([
                'success' => $result,
                'message' => $result ? 'تاريخ الطلب مسجل' : 'فشل التسجيل',
            ]);
            break;
        
        // تسجيل المبيعات
        case 'log_sale':
            if ($method !== 'POST') {
                throw new Exception('POST method required');
            }
            
            $data = json_decode(file_get_contents('php://input'), true);
            $result = log_sale(
                $data['order_id'] ?? null,
                $data['product_id'] ?? null,
                $data['product_name'] ?? null,
                $data['quantity'] ?? 1,
                $data['unit_price'] ?? 0,
                $data['total_price'] ?? 0,
                $data['customer_name'] ?? null,
                $data['payment_method'] ?? null
            );
            
            echo json_encode([
                'success' => $result,
                'message' => $result ? 'المبيعة مسجلة' : 'فشل التسجيل',
            ]);
            break;
        
        // الحصول على سجل الأنشطة
        case 'get_activities':
            $limit = $_GET['limit'] ?? 100;
            $user_type = $_GET['user_type'] ?? null;
            $activity_type = $_GET['activity_type'] ?? null;
            
            $logs = get_activity_logs($limit, $user_type, $activity_type);
            
            echo json_encode([
                'success' => true,
                'count' => count($logs),
                'logs' => $logs,
            ]);
            break;
        
        // الحصول على سجل الطلب
        case 'get_order_history':
            $order_id = $_GET['order_id'] ?? null;
            
            if (!$order_id) {
                throw new Exception('order_id required');
            }
            
            $history = get_order_history($order_id);
            
            echo json_encode([
                'success' => true,
                'order_id' => $order_id,
                'history' => $history,
                'count' => count($history),
            ]);
            break;
        
        // الحصول على إحصائيات المبيعات
        case 'get_sales_stats':
            $start_date = $_GET['start_date'] ?? null;
            $end_date = $_GET['end_date'] ?? null;
            
            $stats = get_sales_statistics($start_date, $end_date);
            
            echo json_encode([
                'success' => true,
                'stats' => $stats,
            ]);
            break;
        
        // الحصول على إحصائيات عامة
        case 'get_dashboard_logs':
            if (!is_admin_authenticated()) {
                throw new Exception('Unauthorized');
            }
            
            // آخر 10 أنشطة
            $recent_activities = get_activity_logs(10);
            
            // آخر 10 مبيعات
            $stmt = $pdo->prepare("SELECT * FROM sales_log ORDER BY created_at DESC LIMIT 10");
            $stmt->execute();
            $recent_sales = $stmt->fetchAll();
            
            // إحصائيات اليوم
            $stmt = $pdo->prepare("
                SELECT 
                    COUNT(*) as total_orders,
                    SUM(total_price) as total_sales
                FROM sales_log
                WHERE DATE(created_at) = DATE(NOW())
            ");
            $stmt->execute();
            $today_stats = $stmt->fetch();
            
            // إحصائيات الأسبوع
            $stmt = $pdo->prepare("
                SELECT 
                    COUNT(*) as total_orders,
                    SUM(total_price) as total_sales
                FROM sales_log
                WHERE WEEK(created_at) = WEEK(NOW())
            ");
            $stmt->execute();
            $week_stats = $stmt->fetch();
            
            echo json_encode([
                'success' => true,
                'recent_activities' => $recent_activities,
                'recent_sales' => $recent_sales,
                'today_stats' => $today_stats,
                'week_stats' => $week_stats,
            ]);
            break;
        
        default:
            echo json_encode([
                'success' => false,
                'message' => "Unknown action: $action",
                'available_actions' => [
                    'log_activity',
                    'log_session',
                    'log_order',
                    'log_sale',
                    'get_activities',
                    'get_order_history',
                    'get_sales_stats',
                    'get_dashboard_logs',
                ]
            ]);
    }
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage(),
    ]);
}
