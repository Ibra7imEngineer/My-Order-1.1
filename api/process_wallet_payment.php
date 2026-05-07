<?php
/**
 * ==================================================
 * My Order - Digital Wallet Payment Handler
 * ==================================================
 * 
 * Handles Vodafone Cash and InstaPay payments
 * with mobile wallet redirects and confirmations
 */

header('Content-Type: application/json; charset=utf-8');
require_once 'db_config.php';

class WalletPaymentHandler {
    private $db;
    private $vodafoneConfig;
    private $instaPayConfig;

    public function __construct($db) {
        $this->db = $db;
        
        // Vodafone Cash Configuration
        $this->vodafoneConfig = [
            'api_url' => 'https://vodafone-gateway.example.com/api',
            'merchant_id' => getenv('VODAFONE_MERCHANT_ID') ?: 'VODAFONE_MERCHANT',
            'api_key' => getenv('VODAFONE_API_KEY') ?: 'VODAFONE_KEY',
        ];

        // InstaPay Configuration
        $this->instaPayConfig = [
            'api_url' => 'https://instapay-gateway.example.com/api',
            'merchant_id' => getenv('INSTAPAY_MERCHANT_ID') ?: 'INSTAPAY_MERCHANT',
            'api_key' => getenv('INSTAPAY_API_KEY') ?: 'INSTAPAY_KEY',
        ];
    }

    /**
     * Process Vodafone Cash Payment
     */
    public function processVodafonePayment($orderData) {
        try {
            // Validate phone number
            if (!$this->isValidEgyptianPhone($orderData['userPhone'])) {
                throw new Exception('Invalid Egyptian phone number');
            }

            // Create payment request
            $paymentRequest = [
                'merchant_id' => $this->vodafoneConfig['merchant_id'],
                'amount' => (int)$orderData['totalAmount'],
                'currency' => 'EGP',
                'customer_phone' => $this->normalizePhoneNumber($orderData['userPhone']),
                'reference_id' => 'ORD-' . time(),
                'description' => 'Food Order',
                'return_url' => $_SERVER['HTTP_HOST'] . '/api/wallet_callback.php?method=vodafone',
                'callback_url' => $_SERVER['HTTP_HOST'] . '/api/wallet_callback.php?method=vodafone&callback=true',
            ];

            // Send to Vodafone API
            $response = $this->callVodafoneAPI('/payment/initiate', $paymentRequest);

            if (!$response['success']) {
                throw new Exception('Failed to initiate Vodafone payment: ' . $response['message']);
            }

            // Save order
            $orderId = $this->saveWalletOrder('vodafone', $orderData, $response['transaction_id']);

            return [
                'success' => true,
                'order_id' => $orderId,
                'redirectUrl' => $response['redirect_url'],
                'transaction_id' => $response['transaction_id'],
            ];

        } catch (Exception $e) {
            error_log('Vodafone Payment Error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    /**
     * Process InstaPay Payment
     */
    public function processInstaPayPayment($orderData) {
        try {
            // Validate phone or identifier
            $identifier = $orderData['walletIdentifier'] ?? '';
            if (empty($identifier)) {
                throw new Exception('InstaPay identifier is required');
            }

            // Create payment request
            $paymentRequest = [
                'merchant_id' => $this->instaPayConfig['merchant_id'],
                'amount' => (float)$orderData['totalAmount'],
                'currency' => 'EGP',
                'recipient' => $identifier, // Can be phone number or InstaPay ID
                'reference' => 'ORD-' . time(),
                'description' => 'Food Order Payment',
                'return_url' => $_SERVER['HTTP_HOST'] . '/api/wallet_callback.php?method=instapay',
                'notification_url' => $_SERVER['HTTP_HOST'] . '/api/wallet_callback.php?method=instapay&callback=true',
            ];

            // Send to InstaPay API
            $response = $this->callInstaPayAPI('/payment/create', $paymentRequest);

            if (!$response['success']) {
                throw new Exception('Failed to initiate InstaPay payment: ' . $response['message']);
            }

            // Save order
            $orderId = $this->saveWalletOrder('instapay', $orderData, $response['transaction_id']);

            return [
                'success' => true,
                'order_id' => $orderId,
                'redirectUrl' => $response['redirect_url'],
                'transaction_id' => $response['transaction_id'],
            ];

        } catch (Exception $e) {
            error_log('InstaPay Payment Error: ' . $e->getMessage());
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    /**
     * Validate Wallet Callback
     */
    public function validateWalletCallback($walletType, $data) {
        switch ($walletType) {
            case 'vodafone':
                return $this->validateVodafoneCallback($data);
            case 'instapay':
                return $this->validateInstaPayCallback($data);
            default:
                return false;
        }
    }

    private function validateVodafoneCallback($data) {
        // Verify signature from Vodafone
        $signature = $data['signature'] ?? '';
        unset($data['signature']);

        $messageToSign = json_encode($data);
        $calculatedSignature = hash_hmac('sha256', $messageToSign, $this->vodafoneConfig['api_key']);

        return hash_equals($calculatedSignature, $signature);
    }

    private function validateInstaPayCallback($data) {
        // Verify signature from InstaPay
        $signature = $data['signature'] ?? '';
        unset($data['signature']);

        $messageToSign = json_encode($data);
        $calculatedSignature = hash_hmac('sha256', $messageToSign, $this->instaPayConfig['api_key']);

        return hash_equals($calculatedSignature, $signature);
    }

    /**
     * Make API Call to Vodafone
     */
    private function callVodafoneAPI($endpoint, $data) {
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $this->vodafoneConfig['api_url'] . $endpoint,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($data),
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $this->vodafoneConfig['api_key'],
            ],
            CURLOPT_TIMEOUT => 10,
            CURLOPT_SSL_VERIFYPEER => true,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200) {
            error_log('Vodafone API Error: ' . $response);
            return ['success' => false, 'message' => 'API Error'];
        }

        return json_decode($response, true) ?? ['success' => false];
    }

    /**
     * Make API Call to InstaPay
     */
    private function callInstaPayAPI($endpoint, $data) {
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $this->instaPayConfig['api_url'] . $endpoint,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($data),
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'X-API-Key: ' . $this->instaPayConfig['api_key'],
            ],
            CURLOPT_TIMEOUT => 10,
            CURLOPT_SSL_VERIFYPEER => true,
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($httpCode !== 200) {
            error_log('InstaPay API Error: ' . $response);
            return ['success' => false, 'message' => 'API Error'];
        }

        return json_decode($response, true) ?? ['success' => false];
    }

    /**
     * Save Wallet Order to Database
     */
    private function saveWalletOrder($walletType, $orderData, $transactionId) {
        try {
            $orderId = 'ORD-' . time() . '-' . rand(1000, 9999);
            $timestamp = date('Y-m-d H:i:s');

            $sql = "INSERT INTO orders (
                order_id, customer_name, customer_phone, customer_email,
                customer_address, items, total_amount, payment_method,
                payment_status, payment_reference, transaction_id, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

            $stmt = $this->db->prepare($sql);
            if (!$stmt) {
                throw new Exception('Database error');
            }

            $itemsJson = json_encode($orderData['items'] ?? []);
            $paymentStatus = 'pending_wallet_confirmation';

            $stmt->bind_param(
                'ssssssdsssss',
                $orderId,
                $orderData['userName'],
                $orderData['userPhone'],
                $orderData['userEmail'],
                $orderData['userAddress'],
                $itemsJson,
                $orderData['totalAmount'],
                $walletType,
                $paymentStatus,
                $orderId,
                $transactionId,
                $timestamp
            );

            if (!$stmt->execute()) {
                throw new Exception('Failed to save order');
            }

            $stmt->close();
            return $orderId;

        } catch (Exception $e) {
            error_log('Save Wallet Order Error: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * ========================================
     * VALIDATION HELPERS
     * ========================================
     */

    /**
     * Validate Egyptian Phone Number
     */
    private function isValidEgyptianPhone($phone) {
        $cleanPhone = preg_replace('/\D/', '', $phone);
        // Must be 11 digits starting with 01
        return preg_match('/^201[0-9]{9}$|^01[0-9]{9}$/', $cleanPhone) === 1;
    }

    /**
     * Normalize Egyptian Phone Number to International Format
     */
    private function normalizePhoneNumber($phone) {
        $cleanPhone = preg_replace('/\D/', '', $phone);
        
        // Convert 01x to 201x
        if (substr($cleanPhone, 0, 1) === '0') {
            $cleanPhone = '2' . $cleanPhone;
        }

        // Ensure 20 prefix
        if (substr($cleanPhone, 0, 2) !== '20') {
            $cleanPhone = '20' . $cleanPhone;
        }

        return $cleanPhone;
    }

    /**
     * Generate Transaction ID
     */
    private function generateTransactionId() {
        return 'TXN-' . time() . '-' . substr(md5(rand()), 0, 8);
    }
}

// Handle requests
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true);
    $handler = new WalletPaymentHandler($conn);
    $response = [];

    switch ($input['action'] ?? '') {
        case 'initiate_vodafone_payment':
            $response = $handler->processVodafonePayment([
                'userName' => $input['userName'] ?? '',
                'userPhone' => $input['userPhone'] ?? '',
                'userEmail' => $input['userEmail'] ?? '',
                'userAddress' => $input['userAddress'] ?? '',
                'totalAmount' => $input['amount'] ?? 0,
                'items' => $input['items'] ?? []
            ]);
            break;

        case 'initiate_instapay_payment':
            $response = $handler->processInstaPayPayment([
                'userName' => $input['userName'] ?? '',
                'userPhone' => $input['userPhone'] ?? '',
                'userEmail' => $input['userEmail'] ?? '',
                'userAddress' => $input['userAddress'] ?? '',
                'walletIdentifier' => $input['walletIdentifier'] ?? '',
                'totalAmount' => $input['amount'] ?? 0,
                'items' => $input['items'] ?? []
            ]);
            break;

        default:
            $response = [
                'success' => false,
                'message' => 'Unknown action'
            ];
    }

    echo json_encode($response);
} else {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid request']);
}
?>
