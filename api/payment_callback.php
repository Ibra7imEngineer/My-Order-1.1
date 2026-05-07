<?php
/**
 * ==================================================
 * Payment Callback Handler
 * ==================================================
 * 
 * Handles callbacks from Paymob payment gateway
 * Verifies transaction and updates order status
 */

header('Content-Type: application/json; charset=utf-8');
require_once 'db_config.php';
require_once 'paymob-config.php';

class PaymentCallbackHandler {
    private $db;
    private $apiKey;

    public function __construct($db, $apiKey) {
        $this->db = $db;
        $this->apiKey = $apiKey;
    }

    /**
     * Handle Paymob Callback
     */
    public function handleCallback($data) {
        try {
            // Verify HMAC signature
            if (!$this->verifySignature($data)) {
                throw new Exception('Invalid payment signature');
            }

            $orderId = $data['order']['id'] ?? null;
            $transactionId = $data['transaction']['id'] ?? null;
            $amount = $data['amount_cents'] ?? 0;
            $success = $data['success'] ?? false;

            if (!$orderId || !$transactionId) {
                throw new Exception('Missing order or transaction ID');
            }

            // Update order status
            if ($success) {
                $this->updateOrderStatus($orderId, 'completed', $transactionId);
                $this->sendConfirmationEmail($orderId);
                
                return [
                    'success' => true,
                    'message' => 'Payment verified successfully',
                    'order_id' => $orderId,
                    'transaction_id' => $transactionId,
                ];
            } else {
                $this->updateOrderStatus($orderId, 'failed', $transactionId);
                
                return [
                    'success' => false,
                    'message' => 'Payment failed',
                    'order_id' => $orderId,
                ];
            }

        } catch (Exception $e) {
            error_log('Callback Error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    /**
     * Verify HMAC Signature
     */
    private function verifySignature($data) {
        $receivedHmac = $data['hmac'] ?? '';
        unset($data['hmac']);

        // Build message to hash
        $messageToHash = '';
        foreach ($data as $value) {
            if (is_array($value)) {
                foreach ($value as $v) {
                    $messageToHash .= $v;
                }
            } else {
                $messageToHash .= $value;
            }
        }

        // Calculate expected HMAC
        $calculatedHmac = hash_hmac('sha256', $messageToHash, $this->apiKey);

        // Compare using constant-time comparison
        return hash_equals($calculatedHmac, $receivedHmac);
    }

    /**
     * Update Order Status
     */
    private function updateOrderStatus($orderId, $status, $transactionId) {
        $sql = "UPDATE orders 
                SET payment_status = ?, 
                    transaction_id = ?,
                    updated_at = NOW()
                WHERE order_id = ?";

        $stmt = $this->db->prepare($sql);
        if (!$stmt) {
            throw new Exception('Database prepare error');
        }

        $stmt->bind_param('sss', $status, $transactionId, $orderId);
        
        if (!$stmt->execute()) {
            throw new Exception('Failed to update order status');
        }

        $stmt->close();
        return true;
    }

    /**
     * Send Confirmation Email
     */
    private function sendConfirmationEmail($orderId) {
        try {
            // Get order details
            $sql = "SELECT * FROM orders WHERE order_id = ?";
            $stmt = $this->db->prepare($sql);
            $stmt->bind_param('s', $orderId);
            $stmt->execute();
            $result = $stmt->get_result();
            $order = $result->fetch_assoc();
            $stmt->close();

            if (!$order) {
                throw new Exception('Order not found');
            }

            // Prepare email
            $to = $order['customer_email'];
            $subject = "تأكيد استلام طلبك | My Order - Order #" . $orderId;
            
            $message = $this->buildEmailContent($order);
            
            $headers = "MIME-Version: 1.0\r\n";
            $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
            $headers .= "From: noreply@myorder.com\r\n";

            // Send email
            mail($to, $subject, $message, $headers);

            return true;

        } catch (Exception $e) {
            error_log('Email sending error: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Build Email Content (HTML)
     */
    private function buildEmailContent($order) {
        $items = json_decode($order['items'], true) ?? [];
        $itemsHtml = '';

        foreach ($items as $item) {
            $itemsHtml .= "
                <tr style='border-bottom: 1px solid #e0e0e0;'>
                    <td style='padding: 12px; text-align: right;'>{$item['name']}</td>
                    <td style='padding: 12px; text-align: center;'>{$item['quantity']}</td>
                    <td style='padding: 12px; text-align: left;'>{$item['price']} ج.م</td>
                </tr>
            ";
        }

        $html = "
            <!DOCTYPE html>
            <html dir='rtl' lang='ar'>
            <head>
                <meta charset='UTF-8'>
                <meta name='viewport' content='width=device-width, initial-scale=1.0'>
                <style>
                    body { font-family: 'Cairo', Arial, sans-serif; direction: rtl; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #FF6B35, #FF8E5F); color: white; padding: 20px; border-radius: 8px; text-align: center; }
                    .content { background: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 8px; }
                    .order-details { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; }
                    .order-details label { font-weight: bold; color: #333; display: block; margin-top: 10px; }
                    table { width: 100%; border-collapse: collapse; margin: 15px 0; }
                    .total { background: #FF6B35; color: white; padding: 15px; border-radius: 8px; font-size: 18px; font-weight: bold; text-align: center; }
                    .footer { text-align: center; color: #999; margin-top: 20px; font-size: 12px; }
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <h1>🎉 تم استقبال طلبك بنجاح</h1>
                        <p>شكراً لاختيارك My Order</p>
                    </div>

                    <div class='content'>
                        <h2 style='color: #333; margin-bottom: 15px;'>تفاصيل الطلب</h2>
                        
                        <div class='order-details'>
                            <label>رقم الطلب:</label>
                            <p>{$order['order_id']}</p>

                            <label>اسم العميل:</label>
                            <p>{$order['customer_name']}</p>

                            <label>رقم الهاتف:</label>
                            <p>{$order['customer_phone']}</p>

                            <label>عنوان التوصيل:</label>
                            <p>{$order['customer_address']}</p>

                            <label>تاريخ الطلب:</label>
                            <p>{$order['created_at']}</p>
                        </div>

                        <h3 style='color: #333; margin-top: 20px; margin-bottom: 10px;'>المنتجات المطلوبة</h3>
                        <table>
                            <thead style='background: #FF6B35; color: white;'>
                                <tr>
                                    <th style='padding: 12px; text-align: right; border-radius: 4px 0 0 0;'>المنتج</th>
                                    <th style='padding: 12px; text-align: center;'>الكمية</th>
                                    <th style='padding: 12px; text-align: left; border-radius: 0 4px 0 0;'>السعر</th>
                                </tr>
                            </thead>
                            <tbody>
                                {$itemsHtml}
                            </tbody>
                        </table>

                        <div class='total'>
                            المجموع الكلي: {$order['total_amount']} ج.م
                        </div>

                        <p style='margin-top: 20px; line-height: 1.8; color: #555;'>
                            <strong>حالة الطلب:</strong> سيتم توصيل طلبك قريباً إلى عنوان التوصيل المحدد. يمكنك متابعة حالة طلبك من خلال تطبيقنا.
                        </p>

                        <p style='margin-top: 15px; padding: 15px; background: #e8f5e9; border-radius: 8px; color: #2e7d32; border-right: 3px solid #4caf50;'>
                            <strong>💚 نصيحة:</strong> احتفظ برقم طلبك <strong>{$order['order_id']}</strong> للاستفسارات والشكاوى.
                        </p>
                    </div>

                    <div class='footer'>
                        <p>© 2024 My Order. جميع الحقوق محفوظة.</p>
                        <p>للتواصل: support@myorder.com</p>
                        <p>الدفع آمن وموثوق ✓ PCI-DSS Certified</p>
                    </div>
                </div>
            </body>
            </html>
        ";

        return $html;
    }
}

// Handle callback
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    
    $handler = new PaymentCallbackHandler($conn, PAYMOB_API_KEY);
    $response = $handler->handleCallback($input);

    echo json_encode($response);
    http_response_code($response['success'] ? 200 : 400);
} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
}
?>
