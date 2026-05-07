<?php
/**
 * =============================================================================
 * Professional Restaurant Management API
 * =============================================================================
 * 
 * This unified API handles all restaurant operations:
 * - Website Order Submission: POST /process_all.php (action=submit-order)
 * - Dashboard Menu Management: GET/POST /process_all.php (action=fetch/add/delete)
 * 
 * Security Features:
 * - MySQLi with prepared statements (prevents SQL injection)
 * - Input validation and sanitization
 * - CORS headers for cross-domain requests
 * - UTF-8 encoding for Arabic support
 * - Proper HTTP status codes and error handling
 * 
 * Database: restaurant_orders
 * Tables: menu, orders, order_items
 * 
 * =============================================================================
 */

declare(strict_types=1);

// ============================================================================
// HEADERS & CORS Configuration
// ============================================================================

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

// CORS - Adjust '*' to your domain in production
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS, DELETE');
header('Access-Control-Allow-Headers: Content-Type, Accept, X-Requested-With');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ============================================================================
// DATABASE CONFIGURATION
// ============================================================================

$dbConfig = [
    'host'     => 'localhost',
    'user'     => 'root',
    'password' => '',
    'database' => 'restaurant_orders',
    'port'     => 3306,
    'charset'  => 'utf8mb4'
];

// ============================================================================
// RESPONSE HELPER FUNCTIONS
// ============================================================================

/**
 * Send JSON response with HTTP status code
 */
function sendResponse(int $statusCode, array $data): void
{
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

/**
 * Send success response
 */
function successResponse($data, string $message = 'تم بنجاح'): void
{
    sendResponse(200, [
        'success' => true,
        'message' => $message,
        'data'    => $data
    ]);
}

/**
 * Send error response
 */
function errorResponse(int $statusCode, string $error, $details = null): void
{
    $response = [
        'success' => false,
        'error'   => $error
    ];
    if ($details !== null) {
        $response['details'] = $details;
    }
    sendResponse($statusCode, $response);
}

// ============================================================================
// DATABASE CONNECTION CLASS
// ============================================================================

class Database
{
    private $mysqli;
    private $connected = false;

    public function __construct(array $config)
    {
        $this->mysqli = new mysqli(
            $config['host'],
            $config['user'],
            $config['password'],
            $config['database'],
            $config['port']
        );

        if ($this->mysqli->connect_error) {
            errorResponse(500, 'خطأ الاتصال بقاعدة البيانات', $this->mysqli->connect_error);
        }

        if (!$this->mysqli->set_charset($config['charset'])) {
            errorResponse(500, 'خطأ في تعيين ترميز UTF-8');
        }

        $this->connected = true;
    }

    public function query(string $sql, string $types = '', array $params = [])
    {
        $stmt = $this->mysqli->prepare($sql);
        if (!$stmt) {
            errorResponse(500, 'خطأ في تحضير الاستعلام', $this->mysqli->error);
        }

        if (!empty($params)) {
            $stmt->bind_param($types, ...$params);
        }

        if (!$stmt->execute()) {
            errorResponse(500, 'خطأ في تنفيذ الاستعلام', $this->mysqli->error);
        }

        return $stmt->get_result() ?: true;
    }

    public function getLastInsertId(): int
    {
        return (int) $this->mysqli->insert_id;
    }

    public function close(): void
    {
        if ($this->connected) {
            $this->mysqli->close();
        }
    }

    public function beginTransaction(): void
    {
        $this->mysqli->begin_transaction();
    }

    public function commit(): void
    {
        $this->mysqli->commit();
    }

    public function rollback(): void
    {
        $this->mysqli->rollback();
    }
}

// ============================================================================
// MENU MANAGEMENT CLASS
// ============================================================================

class MenuManager
{
    private $db;

    public function __construct(Database $db)
    {
        $this->db = $db;
    }

    /**
     * Fetch all menu items
     * Returns: Array of all menu items with id, item_name, unit_price, category, image_url
     */
    public function fetchAll(): array
    {
        $result = $this->db->query(
            'SELECT id, item_name, unit_price, category, image_url, created_at FROM menu ORDER BY category, item_name'
        );

        $items = [];
        while ($row = $result->fetch_assoc()) {
            $items[] = [
                'id'         => (int) $row['id'],
                'item_name'  => $row['item_name'],
                'unit_price' => (float) $row['unit_price'],
                'category'   => $row['category'],
                'image_url'  => $row['image_url'] ?? ''
            ];
        }

        return $items;
    }

    /**
     * Add a new menu item (or update if exists)
     * IMPORTANT: category comes from HTML select, not auto-determined
     * 
     * @param string $itemName     Item name (required)
     * @param float  $unitPrice    Price (required, >= 0)
     * @param string $category     Category from select: أطعمة, مشروبات, حلويات (required)
     * @param string $imageUrl     Image URL or file path (optional)
     * @param bool   $upsert       If true, update existing instead of rejecting (default: false)
     * 
     * @return array ['success' => bool, 'id' => int|null, 'message' => string, 'isUpdate' => bool]
     */
    public function add(string $itemName, float $unitPrice, string $category, string $imageUrl = '', bool $upsert = false): array
    {
        // Validation
        $itemName = trim($itemName);
        if (empty($itemName)) {
            return [
                'success' => false, 
                'error' => 'اسم المنتج مطلوب'
            ];
        }

        if ($unitPrice < 0) {
            return [
                'success' => false, 
                'error' => 'السعر يجب أن يكون موجباً'
            ];
        }

        // Validate category - MUST be one of the three options
        $validCategories = ['أطعمة', 'مشروبات', 'حلويات'];
        if (!in_array($category, $validCategories, true)) {
            return [
                'success' => false, 
                'error' => 'التصنيف غير صحيح'
            ];
        }

        $imageUrl = trim($imageUrl);

        // Check if product already exists
        $existingId = $this->getExistingId($itemName, $category);
        
        if ($existingId !== null) {
            if ($upsert) {
                // Update existing product
                $result = $this->db->query(
                    'UPDATE menu SET unit_price = ?, image_url = ?, updated_at = NOW() WHERE id = ?',
                    'dsi',
                    [$unitPrice, $imageUrl, $existingId]
                );

                if (!$result) {
                    return [
                        'success' => false, 
                        'error' => 'فشل تحديث المنتج'
                    ];
                }

                return [
                    'success' => true,
                    'id'      => $existingId,
                    'isUpdate' => true,
                    'message' => "تم تحديث المنتج '$itemName' بنجاح"
                ];
            } else {
                // Product exists - offer to update or suggest cleanup
                return [
                    'success' => false, 
                    'error' => "المنتج '$itemName' موجود بالفعل في فئة '$category'",
                    'suggestion' => 'يمكنك تنفيذ التنظيف من خلال cleanup_duplicates.php أو حاول إسم مختلف قليلاً'
                ];
            }
        }

        // Insert new product
        $result = $this->db->query(
            'INSERT INTO menu (item_name, unit_price, category, image_url) VALUES (?, ?, ?, ?)',
            'sdss',
            [$itemName, $unitPrice, $category, $imageUrl]
        );

        if (!$result) {
            // Check if error is duplicate (shouldn't happen but safety check)
            if (stripos($this->db->error, 'Duplicate') !== false) {
                return [
                    'success' => false,
                    'error' => "المنتج '$itemName' موجود بالفعل في قاعدة البيانات",
                    'dbError' => $this->db->error,
                    'suggestion' => 'يرجى تنفيذ cleanup_duplicates.php أولاً'
                ];
            }
            
            return [
                'success' => false, 
                'error' => 'فشل إضافة المنتج: ' . $this->db->error
            ];
        }

        $insertId = $this->db->getLastInsertId();

        return [
            'success' => true,
            'id'      => $insertId,
            'isUpdate' => false,
            'message' => "تم إضافة المنتج '$itemName' بنجاح"
        ];
    }

    /**
     * Get the ID of an existing menu item by name and category
     * Returns null if not found
     */
    private function getExistingId(string $itemName, string $category): ?int
    {
        $result = $this->db->query(
            'SELECT id FROM menu WHERE item_name = ? AND category = ? LIMIT 1',
            'ss',
            [$itemName, $category]
        );

        $row = $result->fetch_assoc();
        return $row ? (int)$row['id'] : null;
    }

    /**
     * Check whether a menu item with the same name and category already exists
     */
    private function exists(string $itemName, string $category): bool
    {
        $result = $this->db->query(
            'SELECT 1 FROM menu WHERE item_name = ? AND category = ? LIMIT 1',
            'ss',
            [$itemName, $category]
        );

        $row = $result->fetch_assoc();
        return (bool) $row;
    }

    /**
     * Delete a menu item by ID
     * 
     * @param int $id Menu item ID
     * @return array ['success' => bool]
     */
    public function delete(int $id): array
    {
        if ($id <= 0) {
            return ['success' => false, 'error' => 'معرّف غير صحيح'];
        }

        $result = $this->db->query(
            'DELETE FROM menu WHERE id = ?',
            'i',
            [$id]
        );

        if (!$result) {
            return ['success' => false, 'error' => 'فشل حذف المنتج'];
        }

        return ['success' => true, 'message' => 'تم حذف المنتج بنجاح'];
    }

    /**
     * Get a specific menu item by name
     * Used for order submission to ensure item_name and category match
     */
    public function getByName(string $itemName): ?array
    {
        $result = $this->db->query(
            'SELECT id, item_name, unit_price, category FROM menu WHERE item_name = ?',
            's',
            [$itemName]
        );

        $row = $result->fetch_assoc();
        if (!$row) {
            return null;
        }

        return [
            'id'         => (int) $row['id'],
            'item_name'  => $row['item_name'],
            'unit_price' => (float) $row['unit_price'],
            'category'   => $row['category']
        ];
    }
}

// ============================================================================
// ORDER MANAGEMENT CLASS
// ============================================================================

class OrderManager
{
    private $db;

    public function __construct(Database $db)
    {
        $this->db = $db;
    }

    /**
     * Create a complete order with items
     * 
     * This transaction-safe function:
     * 1. Inserts customer data into orders table
     * 2. Loops through cart items and inserts each into order_items table
     * 3. Uses actual menu data to ensure category and price accuracy
     * 4. Calculates and stores subtotals for each item
     * 5. Triggers automatically calculate and update order total_price
     * 
     * @param string $customerName Customer name
     * @param string $phone        Phone number
     * @param string $address      Delivery address
     * @param array  $cartItems    Array of items: [{'item_name': '', 'quantity': 2, ...}, ...]
     * 
     * @return array ['success' => bool, 'order_id' => int|null, 'data' => array]
     */
    public function createOrder(
        string $customerName,
        string $phone,
        string $address,
        array $cartItems
    ): array {
        // Validation
        $customerName = trim($customerName);
        if (empty($customerName)) {
            return ['success' => false, 'error' => 'اسم العميل مطلوب'];
        }

        $phone = trim($phone);
        if (empty($phone)) {
            return ['success' => false, 'error' => 'رقم الهاتف مطلوب'];
        }

        if (empty($cartItems) || !is_array($cartItems)) {
            return ['success' => false, 'error' => 'سلة الطلب فارغة أو غير صحيحة'];
        }

        // Start transaction for data integrity
        $this->db->beginTransaction();

        try {
            // Step 1: Insert order header
            $result = $this->db->query(
                'INSERT INTO orders (customer_name, phone, address, order_status, total_price) VALUES (?, ?, ?, ?, ?)',
                'ssssd',
                [$customerName, $phone, $address, 'pending', 0.00]
            );

            if (!$result) {
                throw new Exception('فشل إنشاء الطلب');
            }

            $orderId = $this->db->getLastInsertId();

            // Step 2: Insert order items
            $totalPrice = 0;
            $menuManager = new MenuManager($this->db);

            foreach ($cartItems as $item) {
                $itemName = trim($item['item_name'] ?? '');
                $quantity = (int) ($item['quantity'] ?? 0);
                $category = trim($item['category'] ?? 'أطعمة'); // Use category from cart item

                if (empty($itemName) || $quantity <= 0) {
                    throw new Exception('عنصر بيانات غير صحيح في السلة');
                }

                // Get item from menu to ensure consistency
                $menuItem = $menuManager->getByName($itemName);
                if (!$menuItem) {
                    throw new Exception("المنتج '$itemName' غير موجود في المنيو");
                }

                $subtotal = $menuItem['unit_price'] * $quantity;
                $totalPrice += $subtotal;

                // Insert order item with category from cart item (not from menu)
                $itemResult = $this->db->query(
                    'INSERT INTO order_items (order_id, menu_id, item_name, category, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    'iisidds',
                    [
                        $orderId,
                        $menuItem['id'],
                        $menuItem['item_name'],  // Ensure exact match from menu
                        $category,               // Category from cart item
                        $quantity,
                        $menuItem['unit_price'],
                        $subtotal
                    ]
                );

                if (!$itemResult) {
                    throw new Exception('فشل إضافة عنصر الطلب');
                }
            }

            // Step 3: Update order total (triggers will also update this)
            $updateResult = $this->db->query(
                'UPDATE orders SET total_price = ? WHERE order_id = ?',
                'di',
                [$totalPrice, $orderId]
            );

            if (!$updateResult) {
                throw new Exception('فشل تحديث إجمالي الطلب');
            }

            // Commit transaction
            $this->db->commit();

            return [
                'success'  => true,
                'order_id' => $orderId,
                'data'     => [
                    'customer_name' => $customerName,
                    'phone'        => $phone,
                    'address'      => $address,
                    'total_price'  => $totalPrice,
                    'items_count'  => count($cartItems),
                    'message'      => 'تم إنشاء الطلب بنجاح'
                ]
            ];

        } catch (Exception $e) {
            // Rollback on error
            $this->db->rollback();

            return [
                'success' => false,
                'error'   => 'فشل عملية الطلب: ' . $e->getMessage()
            ];
        }
    }
}

// ============================================================================
// REQUEST HANDLER
// ============================================================================

try {
    // Initialize database
    $db = new Database($dbConfig);

    // Get action parameter from GET, POST, or JSON body
    $action = $_GET['action'] ?? $_POST['action'] ?? null;
    
    // If action not found in GET/POST and this is a JSON request, parse the body
    if (empty($action)) {
        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
        if (stripos($contentType, 'application/json') !== false) {
            $rawBody = file_get_contents('php://input');
            $jsonData = json_decode($rawBody, true);
            if (is_array($jsonData) && json_last_error() === JSON_ERROR_NONE) {
                $action = $jsonData['action'] ?? null;
            }
        }
    }

    if (empty($action)) {
        errorResponse(400, 'معامل الإجراء (action) مطلوب');
    }

    // ========================================================================
    // MENU MANAGEMENT ENDPOINTS
    // ========================================================================

    if ($action === 'fetch') {
        // GET all menu items
        // Usage: GET /process_all.php?action=fetch
        $menuManager = new MenuManager($db);
        $items = $menuManager->fetchAll();
        successResponse($items, 'تم جلب المنيو بنجاح');
    }

    elseif ($action === 'add') {
        // POST to add new menu item
        // Usage: POST /process_all.php
        // Body: {action: 'add', item_name: '...', unit_price: 50, category: 'أطعمة', image_url: '...'}

        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            errorResponse(405, 'يجب استخدام طريقة POST');
        }

        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
        if (stripos($contentType, 'application/json') === false && stripos($contentType, 'application/x-www-form-urlencoded') === false) {
            errorResponse(415, 'نوع المحتوى غير صحيح');
        }

        // Parse input
        $data = [];
        if (stripos($contentType, 'application/json') !== false) {
            $rawBody = file_get_contents('php://input');
            $data = json_decode($rawBody, true);
            if (!is_array($data) || json_last_error() !== JSON_ERROR_NONE) {
                errorResponse(400, 'JSON غير صحيح');
            }
        } else {
            $data = $_POST;
        }

        $itemName = trim($data['item_name'] ?? '');
        $unitPrice = (float) ($data['unit_price'] ?? 0);
        $category = trim($data['category'] ?? ''); // IMPORTANT: From HTML select, not auto-determined
        $imageUrl = trim($data['image_url'] ?? '');

        if (empty($itemName)) {
            errorResponse(422, 'اسم المنتج مطلوب');
        }
        if ($unitPrice <= 0) {
            errorResponse(422, 'السعر يجب أن يكون أكبر من صفر');
        }
        if (empty($category)) {
            errorResponse(422, 'التصنيف مطلوب');
        }

        $menuManager = new MenuManager($db);
        $result = $menuManager->add($itemName, $unitPrice, $category, $imageUrl);

        if (!$result['success']) {
            // Determine HTTP status code
            $statusCode = 422;
            if (stripos($result['error'], 'موجود بالفعل') !== false || stripos($result['error'], 'Duplicate') !== false) {
                $statusCode = 409;
            }
            
            // Response with error details and suggestions
            $response = [
                'success' => false,
                'error' => $result['error']
            ];
            
            // Add helpful suggestion if applicable
            if (isset($result['suggestion'])) {
                $response['suggestion'] = $result['suggestion'];
            }
            
            if (isset($result['dbError'])) {
                $response['dbError'] = $result['dbError'];
            }
            
            sendResponse($statusCode, $response);
        }

        successResponse($result, $result['message']);
    }

    elseif ($action === 'delete') {
        // DELETE menu item
        // Usage: POST/DELETE /process_all.php
        // Body: {action: 'delete', id: 5}

        if ($_SERVER['REQUEST_METHOD'] !== 'POST' && $_SERVER['REQUEST_METHOD'] !== 'DELETE') {
            errorResponse(405, 'يجب استخدام طريقة POST أو DELETE');
        }

        // Parse input
        $data = [];
        if ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
            $rawBody = file_get_contents('php://input');
            $data = json_decode($rawBody, true);
        } else {
            $data = $_POST;
        }

        $id = (int) ($data['id'] ?? 0);

        if ($id <= 0) {
            errorResponse(422, 'معرّف صحيح مطلوب');
        }

        $menuManager = new MenuManager($db);
        $result = $menuManager->delete($id);

        if (!$result['success']) {
            errorResponse(422, $result['error']);
        }

        successResponse($result, $result['message']);
    }

    // ========================================================================
    // ORDER SUBMISSION ENDPOINT
    // ========================================================================

    elseif ($action === 'submit-order') {
        // POST to submit a new order
        // Usage: POST /process_all.php
        // Body: {
        //   action: 'submit-order',
        //   customer_name: 'محمد أحمد',
        //   phone: '01001234567',
        //   address: 'شارع النيل، القاهرة',
        //   cart_items: [
        //     {item_name: 'برجر', quantity: 2},
        //     {item_name: 'بيبسي', quantity: 1}
        //   ]
        // }

        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            errorResponse(405, 'يجب استخدام طريقة POST');
        }

        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
        if (stripos($contentType, 'application/json') === false) {
            errorResponse(415, 'يجب استخدام Content-Type: application/json');
        }

        $rawBody = file_get_contents('php://input');
        $data = json_decode($rawBody, true);

        if (!is_array($data) || json_last_error() !== JSON_ERROR_NONE) {
            errorResponse(400, 'JSON غير صحيح');
        }

        $customerName = trim($data['customer_name'] ?? '');
        $phone = trim($data['phone'] ?? '');
        $address = trim($data['address'] ?? '');
        $cartItems = $data['cart_items'] ?? [];

        if (empty($customerName)) {
            errorResponse(422, 'اسم العميل مطلوب');
        }
        if (empty($phone)) {
            errorResponse(422, 'رقم الهاتف مطلوب');
        }
        if (empty($address)) {
            errorResponse(422, 'عنوان التوصيل مطلوب');
        }
        if (empty($cartItems)) {
            errorResponse(422, 'السلة فارغة، أضف منتجات قبل الطلب');
        }

        $orderManager = new OrderManager($db);
        $result = $orderManager->createOrder($customerName, $phone, $address, $cartItems);

        if (!$result['success']) {
            errorResponse(422, $result['error']);
        }

        successResponse($result['data'], 'تم تقديم الطلب بنجاح! معرّف الطلب: ' . $result['order_id']);
    }

    // ========================================================================
    // UNKNOWN ACTION
    // ========================================================================

    else {
        errorResponse(400, "الإجراء '$action' غير معروف");
    }

} catch (Exception $e) {
    errorResponse(500, 'حدث خطأ في الخادم', $e->getMessage());
} finally {
    if (isset($db)) {
        $db->close();
    }
}
