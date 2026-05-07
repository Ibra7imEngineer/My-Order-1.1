<?php
/**
 * ==================================================
 * Paymob API Configuration & Setup Guide
 * ==================================================
 * 
 * This file contains configuration for Paymob payment gateway
 * Store sensitive keys in environment variables or .env file
 * 
 * NEVER commit credentials to version control!
 */

// ========================================
// PAYMOB CONFIGURATION
// ========================================

class PaymobConfig {
    // API Credentials (Use environment variables)
    public static $API_KEY = null;
    public static $MERCHANT_ID = null;
    public static $IFRAME_ID = null;
    
    // API Endpoints
    public static $API_BASE = 'https://accept.paymobsolutions.com/api';
    public static $AUTH_ENDPOINT = '/auth/tokens';
    public static $ORDERS_ENDPOINT = '/ecommerce/orders';
    public static $PAYMENT_TOKENS_ENDPOINT = '/acceptance/payment_tokens';
    public static $TRANSACTIONS_ENDPOINT = '/acceptance/transactions';

    /**
     * Initialize Configuration from Environment
     */
    public static function init() {
        self::$API_KEY = getenv('PAYMOB_API_KEY') ?: $_ENV['PAYMOB_API_KEY'] ?? null;
        self::$MERCHANT_ID = getenv('PAYMOB_MERCHANT_ID') ?: $_ENV['PAYMOB_MERCHANT_ID'] ?? null;
        self::$IFRAME_ID = getenv('PAYMOB_IFRAME_ID') ?: $_ENV['PAYMOB_IFRAME_ID'] ?? null;

        if (!self::$API_KEY || !self::$MERCHANT_ID || !self::$IFRAME_ID) {
            throw new Exception('Paymob credentials not configured. Set environment variables.');
        }
    }

    /**
     * Get Full API Endpoint URL
     */
    public static function getEndpointUrl($endpoint) {
        return self::$API_BASE . $endpoint;
    }
}

// ========================================
// PAYMOB SETUP GUIDE
// ========================================

/*
 * STEP 1: Create Paymob Account
 * ============================
 * Visit: https://paymob.com
 * Sign up for a merchant account
 * 
 * STEP 2: Get API Credentials
 * ============================
 * 1. Log in to Paymob Dashboard
 * 2. Go to Settings > Integrations
 * 3. Copy your API Key (Auth Token)
 * 4. Copy your Merchant ID
 * 5. Create an iFrame and get its ID
 * 
 * STEP 3: Set Environment Variables
 * ===================================
 * Add to your .env file or system environment:
 * 
 * PAYMOB_API_KEY=your_api_key_from_paymob
 * PAYMOB_MERCHANT_ID=your_merchant_id
 * PAYMOB_IFRAME_ID=your_iframe_id
 * 
 * STEP 4: Configure Callback URL
 * ================================
 * Set in Paymob Dashboard:
 * - Success URL: https://yourdomain.com/api/payment_callback.php?status=success
 * - Failure URL: https://yourdomain.com/api/payment_callback.php?status=failure
 * - Response URL: https://yourdomain.com/api/payment_callback.php?status=response
 */

// ========================================
// EXAMPLE ENVIRONMENT FILE (.env)
// ========================================

/*
# ========== PAYMOB PAYMENT GATEWAY ==========
PAYMOB_API_KEY=your_api_key_here_min_128_chars
PAYMOB_MERCHANT_ID=your_merchant_id_here
PAYMOB_IFRAME_ID=your_iframe_id_here

# ========== VODAFONE CASH ==========
VODAFONE_MERCHANT_ID=your_vodafone_merchant_id
VODAFONE_API_KEY=your_vodafone_api_key

# ========== INSTAPAY ==========
INSTAPAY_MERCHANT_ID=your_instapay_merchant_id
INSTAPAY_API_KEY=your_instapay_api_key

# ========== DATABASE ==========
DB_HOST=localhost
DB_USER=root
DB_PASS=
DB_NAME=my_order
*/

// ========================================
// PAYMOB API PAYMENT FLOW
// ========================================

/*
 * Flow Diagram:
 * 
 * ┌─────────────────────────────────────────────────────────┐
 * │ 1. User fills payment form                              │
 * │    - Card Number, Expiry, CVV                           │
 * │    - Billing Information                                │
 * └────────────────┬────────────────────────────────────────┘
 *                  │
 * ┌────────────────▼────────────────────────────────────────┐
 * │ 2. Validate locally with Luhn Algorithm                 │
 * │    - Check card number format                           │
 * │    - Check expiry date                                  │
 * │    - Check CVV format                                   │
 * └────────────────┬────────────────────────────────────────┘
 *                  │
 * ┌────────────────▼────────────────────────────────────────┐
 * │ 3. Send to Backend (process_payment.php)                │
 * │    - Collect order data                                 │
 * │    - Call Paymob API to get auth token                  │
 * └────────────────┬────────────────────────────────────────┘
 *                  │
 * ┌────────────────▼────────────────────────────────────────┐
 * │ 4. Paymob Authentication                                │
 * │    - POST /api/auth/tokens                              │
 * │    - Get auth token (valid for 3600 seconds)            │
 * └────────────────┬────────────────────────────────────────┘
 *                  │
 * ┌────────────────▼────────────────────────────────────────┐
 * │ 5. Register Order                                       │
 * │    - POST /api/ecommerce/orders                         │
 * │    - Get order reference ID                             │
 * └────────────────┬────────────────────────────────────────┘
 *                  │
 * ┌────────────────▼────────────────────────────────────────┐
 * │ 6. Create Payment Token                                 │
 * │    - POST /api/acceptance/payment_tokens                │
 * │    - Get payment token for iframe                       │
 * └────────────────┬────────────────────────────────────────┘
 *                  │
 * ┌────────────────▼────────────────────────────────────────┐
 * │ 7. Return Payment Token to Frontend                      │
 * │    - Load Paymob iFrame with token                      │
 * │    - User enters card details securely                  │
 * └────────────────┬────────────────────────────────────────┘
 *                  │
 * ┌────────────────▼────────────────────────────────────────┐
 * │ 8. Process Payment                                      │
 * │    - Paymob processes payment                           │
 * │    - Returns transaction ID                             │
 * └────────────────┬────────────────────────────────────────┘
 *                  │
 * ┌────────────────▼────────────────────────────────────────┐
 * │ 9. Receive Callback                                     │
 * │    - POST /api/payment_callback.php                     │
 * │    - Verify HMAC signature                              │
 * │    - Update order status                                │
 * └────────────────┬────────────────────────────────────────┘
 *                  │
 * ┌────────────────▼────────────────────────────────────────┐
 * │ 10. Confirmation                                        │
 * │     - Show success/error message                        │
 * │     - Update order in database                          │
 * │     - Send confirmation email                           │
 * └─────────────────────────────────────────────────────────┘
 */

// ========================================
// SUPPORTED CARDS
// ========================================

$SUPPORTED_CARDS = [
    [
        'name' => 'Visa',
        'pattern' => '/^4[0-9]{12}(?:[0-9]{3})?$/',
        'length' => [13, 16, 19],
        'cvv_length' => 3,
    ],
    [
        'name' => 'Mastercard',
        'pattern' => '/^5[1-5][0-9]{14}$|^2(?:22[1-9]|[23]\d{2}|4[0-9]{2}|5[1-9][0-9])[0-9]{12}$/',
        'length' => [16],
        'cvv_length' => 3,
    ],
    [
        'name' => 'Meeza (ميزة)',
        'pattern' => '/^6062[0-9]{12}$/',
        'length' => [16],
        'cvv_length' => 3,
        'region' => 'Egypt',
        'provider' => 'Egyptian National Payment Switch',
    ],
    [
        'name' => 'American Express',
        'pattern' => '/^3[47][0-9]{13}$/',
        'length' => [15],
        'cvv_length' => 4,
    ],
];

// ========================================
// TEST CARD NUMBERS (Paymob Sandbox)
// ========================================

$TEST_CARDS = [
    [
        'network' => 'Visa',
        'number' => '4532015112830366',
        'expiry' => '12/25',
        'cvv' => '123',
        'status' => 'success',
    ],
    [
        'network' => 'Mastercard',
        'number' => '5425233010103442',
        'expiry' => '12/25',
        'cvv' => '123',
        'status' => 'success',
    ],
    [
        'network' => 'Visa (3D Secure)',
        'number' => '4111111111111111',
        'expiry' => '12/25',
        'cvv' => '123',
        'status' => 'requires_authentication',
        'password' => 'test',
    ],
];

// ========================================
// CURRENCY CODES
// ========================================

$CURRENCIES = [
    'EGP' => 'Egyptian Pound',
    'USD' => 'US Dollar',
    'EUR' => 'Euro',
    'SAR' => 'Saudi Riyal',
    'AED' => 'UAE Dirham',
];

// ========================================
// ERROR CODES & MESSAGES
// ========================================

$ERROR_CODES = [
    '1' => 'Approved',
    '2' => 'Declined',
    '3' => 'Card Blocked',
    '4' => 'Insufficient Funds',
    '5' => 'Expired Card',
    '6' => 'Invalid Card',
    '7' => 'Communication Error',
    '8' => 'Processing Error',
];

// ========================================
// PAYMENT STATUSES
// ========================================

$PAYMENT_STATUSES = [
    'pending' => 'Waiting for payment processing',
    'processing' => 'Payment is being processed',
    'completed' => 'Payment completed successfully',
    'failed' => 'Payment failed',
    'refunded' => 'Payment has been refunded',
    'pending_wallet_confirmation' => 'Waiting for wallet confirmation',
    'cancelled' => 'Payment cancelled by user',
];

?>
