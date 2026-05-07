<?php
/**
 * Menu Management API Controller
 * Handles all CRUD operations for restaurant menu items
 * 
 * Actions: fetch, add, delete, update
 * Uses MySQLi with prepared statements for security
 * Returns JSON responses with proper error handling
 */

declare(strict_types=1);

// Header Configuration
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');

// CORS Headers (adjust '*' to your domain in production)
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Accept');

// Handle OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// ============================================================================
// Database Configuration
// ============================================================================

$dbConfig = [
    'host'     => 'localhost',        // Your MySQL host
    'user'     => 'root',              // Your MySQL username
    'password' => '',                  // Your MySQL password
    'database' => 'restaurant_orders', // Database name
    'port'     => 3306,                // MySQL port
    'charset'  => 'utf8mb4'
];

// ============================================================================
// Response Helper Functions
// ============================================================================

/**
 * Send JSON response with HTTP status code
 * 
 * @param int $statusCode HTTP status code
 * @param array $data Response data
 */
function sendResponse(int $statusCode, array $data): void
{
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

/**
 * Send success response
 * 
 * @param mixed $data Response data
 * @param string $message Success message
 */
function successResponse($data, string $message = 'Success'): void
{
    sendResponse(200, [
        'success' => true,
        'message' => $message,
        'data'    => $data
    ]);
}

/**
 * Send error response
 * 
 * @param int $statusCode HTTP status code
 * @param string $error Error message
 * @param mixed $details Additional error details
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
// Database Connection Class
// ============================================================================

class Database
{
    private $mysqli;

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
            errorResponse(500, 'Database connection failed', $this->mysqli->connect_error);
        }

        // Set charset to utf8mb4 for proper Arabic and Unicode support
        $this->mysqli->set_charset('utf8mb4');
    }

    public function getConnection(): mysqli
    {
        return $this->mysqli;
    }

    public function close(): void
    {
        $this->mysqli->close();
    }
}

// ============================================================================
// Menu Management Class
// ============================================================================

class MenuManager
{
    private $db;
    private $mysqli;

    public function __construct(Database $db)
    {
        $this->db = $db;
        $this->mysqli = $db->getConnection();
    }

    /**
     * Normalize category value to English key format
     * Accepts both English and Arabic inputs
     * 
     * @param string $category Raw category value
     * @return string Normalized category key (food, drinks, sweets)
     */
    private function normalizeCategory(string $category): string
    {
        $normalized = mb_strtolower(trim($category), 'UTF-8');

        // Map English values
        if (in_array($normalized, ['food', 'foods', 'أطعمة'], true)) {
            return 'food';
        }
        if (in_array($normalized, ['drinks', 'drink', 'مشروبات'], true)) {
            return 'drinks';
        }
        if (in_array($normalized, ['sweets', 'dessert', 'حلويات'], true)) {
            return 'sweets';
        }

        // Default to 'food' if unrecognized
        return 'food';
    }

    /**
     * Get all menu items
     * 
     * @param string|null $category Optional: filter by category (food, drinks, sweets)
     * @return array Array of menu items
     */
    public function fetchAll(?string $category = null): array
    {
        $query = 'SELECT id, item_name, unit_price, category, image_url, created_at FROM menu';

        if ($category !== null) {
            $normalizedCat = $this->normalizeCategory($category);
            $query .= ' WHERE category = ?';
            $stmt = $this->mysqli->prepare($query);
            if ($stmt === false) {
                errorResponse(500, 'Failed to prepare query', $this->mysqli->error);
            }
            $stmt->bind_param('s', $normalizedCat);
        } else {
            $stmt = $this->mysqli->prepare($query);
            if ($stmt === false) {
                errorResponse(500, 'Failed to prepare query', $this->mysqli->error);
            }
        }

        if (!$stmt->execute()) {
            errorResponse(500, 'Query execution failed', $stmt->error);
        }

        $result = $stmt->get_result();
        $items = [];

        while ($row = $result->fetch_assoc()) {
            $items[] = [
                'id'         => (int)$row['id'],
                'item_name'  => $row['item_name'],
                'unit_price' => (float)$row['unit_price'],
                'category'   => $row['category'],
                'image_url'  => $row['image_url'],
                'created_at' => $row['created_at']
            ];
        }

        $stmt->close();
        return $items;
    }

    /**
     * Add a new menu item
     * 
     * @param string $itemName Item name (required, must be unique)
     * @param float $price Unit price (required, must be >= 0)
     * @param string $category Category: 'food', 'drinks', or 'sweets'
     * @param string|null $imageUrl Image URL (optional)
     * @return array Created item with id
     */
    public function add(string $itemName, float $price, string $category, ?string $imageUrl = null): array
    {
        // Validate inputs
        $itemName = trim($itemName);
        if (empty($itemName) || strlen($itemName) < 2) {
            errorResponse(400, 'Item name must be at least 2 characters long');
        }

        if ($price < 0 || $price > 999999.99) {
            errorResponse(400, 'Price must be between 0 and 999999.99');
        }

        $normalizedCategory = $this->normalizeCategory($category);
        $imageUrl = $imageUrl !== null ? trim($imageUrl) : null;

        // Prepare INSERT statement
        $query = 'INSERT INTO menu (item_name, unit_price, category, image_url) VALUES (?, ?, ?, ?)';
        $stmt = $this->mysqli->prepare($query);
        if ($stmt === false) {
            errorResponse(500, 'Failed to prepare query', $this->mysqli->error);
        }

        $stmt->bind_param('sdss', $itemName, $price, $normalizedCategory, $imageUrl);

        if (!$stmt->execute()) {
            // Handle duplicate entry error
            if ($stmt->errno === 1062) {
                errorResponse(409, 'Item name already exists in the menu');
            }
            errorResponse(500, 'Failed to insert item', $stmt->error);
        }

        $itemId = $stmt->insert_id;
        $stmt->close();

        return [
            'id'         => $itemId,
            'item_name'  => $itemName,
            'unit_price' => $price,
            'category'   => $normalizedCategory,
            'image_url'  => $imageUrl
        ];
    }

    /**
     * Delete a menu item by ID
     * 
     * @param int $id Item ID
     * @return array Deleted item info
     */
    public function delete(int $id): array
    {
        if ($id <= 0) {
            errorResponse(400, 'Invalid item ID');
        }

        // First, fetch the item to confirm it exists
        $selectQuery = 'SELECT item_name, unit_price, category FROM menu WHERE id = ?';
        $selectStmt = $this->mysqli->prepare($selectQuery);
        if ($selectStmt === false) {
            errorResponse(500, 'Failed to prepare SELECT query', $this->mysqli->error);
        }

        $selectStmt->bind_param('i', $id);
        $selectStmt->execute();
        $result = $selectStmt->get_result();
        $item = $result->fetch_assoc();
        $selectStmt->close();

        if ($item === null) {
            errorResponse(404, 'Menu item not found');
        }

        // Delete the item
        $deleteQuery = 'DELETE FROM menu WHERE id = ?';
        $deleteStmt = $this->mysqli->prepare($deleteQuery);
        if ($deleteStmt === false) {
            errorResponse(500, 'Failed to prepare DELETE query', $this->mysqli->error);
        }

        $deleteStmt->bind_param('i', $id);
        if (!$deleteStmt->execute()) {
            errorResponse(500, 'Failed to delete item', $deleteStmt->error);
        }

        $deleteStmt->close();

        return [
            'id'         => $id,
            'item_name'  => $item['item_name'],
            'unit_price' => (float)$item['unit_price'],
            'category'   => $item['category']
        ];
    }

    /**
     * Update a menu item
     * 
     * @param int $id Item ID
     * @param array $updates Fields to update: item_name, unit_price, category, image_url
     * @return array Updated item
     */
    public function update(int $id, array $updates): array
    {
        if ($id <= 0) {
            errorResponse(400, 'Invalid item ID');
        }

        // Fetch current item
        $selectQuery = 'SELECT * FROM menu WHERE id = ?';
        $selectStmt = $this->mysqli->prepare($selectQuery);
        if ($selectStmt === false) {
            errorResponse(500, 'Failed to prepare SELECT query', $this->mysqli->error);
        }

        $selectStmt->bind_param('i', $id);
        $selectStmt->execute();
        $result = $selectStmt->get_result();
        $item = $result->fetch_assoc();
        $selectStmt->close();

        if ($item === null) {
            errorResponse(404, 'Menu item not found');
        }

        // Build dynamic update query
        $allowedFields = ['item_name', 'unit_price', 'category', 'image_url'];
        $updateFields = [];
        $params = [];
        $types = '';

        foreach ($updates as $field => $value) {
            if (!in_array($field, $allowedFields, true)) {
                continue; // Skip unknown fields
            }

            if ($value === null || $value === '') {
                continue; // Skip null/empty values
            }

            // Validate specific fields
            if ($field === 'unit_price') {
                $value = (float)$value;
                if ($value < 0 || $value > 999999.99) {
                    errorResponse(400, 'Price must be between 0 and 999999.99');
                }
                $types .= 'd';
            } elseif ($field === 'category') {
                // Validate category - MUST be one of the three Arabic options
                $validCategories = ['أطعمة', 'مشروبات', 'حلويات'];
                $categoryValue = trim((string)$value);
                if (!in_array($categoryValue, $validCategories, true)) {
                    errorResponse(400, 'Category must be: أطعمة, مشروبات, or حلويات');
                }
                $value = $categoryValue;
                $types .= 's';
            } else {
                $value = trim((string)$value);
                if ($field === 'item_name' && strlen($value) < 2) {
                    errorResponse(400, 'Item name must be at least 2 characters long');
                }
                $types .= 's';
            }

            $updateFields[] = "{$field} = ?";
            $params[] = $value;
        }

        if (empty($updateFields)) {
            errorResponse(400, 'No valid fields to update');
        }

        // Add ID to params for WHERE clause
        $params[] = $id;
        $types .= 'i';

        // Build and execute update query
        $query = 'UPDATE menu SET ' . implode(', ', $updateFields) . ' WHERE id = ?';
        $stmt = $this->mysqli->prepare($query);
        if ($stmt === false) {
            errorResponse(500, 'Failed to prepare UPDATE query', $this->mysqli->error);
        }

        // Bind parameters dynamically
        $stmt->bind_param($types, ...$params);

        if (!$stmt->execute()) {
            // Handle duplicate entry error
            if ($stmt->errno === 1062) {
                errorResponse(409, 'Item name already exists in the menu');
            }
            errorResponse(500, 'Failed to update item', $stmt->error);
        }

        $stmt->close();

        // Fetch and return updated item
        $selectQuery = 'SELECT id, item_name, unit_price, category, image_url FROM menu WHERE id = ?';
        $selectStmt = $this->mysqli->prepare($selectQuery);
        if ($selectStmt === false) {
            errorResponse(500, 'Failed to prepare SELECT query', $this->mysqli->error);
        }

        $selectStmt->bind_param('i', $id);
        $selectStmt->execute();
        $result = $selectStmt->get_result();
        $updatedItem = $result->fetch_assoc();
        $selectStmt->close();

        return [
            'id'         => (int)$updatedItem['id'],
            'item_name'  => $updatedItem['item_name'],
            'unit_price' => (float)$updatedItem['unit_price'],
            'category'   => $updatedItem['category'],
            'image_url'  => $updatedItem['image_url']
        ];
    }
}

// ============================================================================
// Request Processing
// ============================================================================

try {
    // Validate request method
    $method = $_SERVER['REQUEST_METHOD'];
    if ($method !== 'GET' && $method !== 'POST') {
        errorResponse(405, 'Method not allowed. Use GET or POST.');
    }

    // Get action parameter
    $action = $_GET['action'] ?? $_POST['action'] ?? null;
    if (empty($action)) {
        errorResponse(400, 'Missing required parameter: action');
    }

    $action = trim(strtolower((string)$action));

    // Initialize database connection
    $db = new Database($dbConfig);
    $menuManager = new MenuManager($db);

    // Route to appropriate action
    switch ($action) {
        case 'fetch':
            // Fetch all items or filter by category
            $category = $_GET['category'] ?? $_POST['category'] ?? null;
            $items = $menuManager->fetchAll($category);
            successResponse($items, 'Menu items fetched successfully');
            break;

        case 'add':
            // Add new item
            if ($method !== 'POST') {
                errorResponse(405, 'Action "add" requires POST method');
            }

            $itemName = $_POST['item_name'] ?? null;
            $price = $_POST['unit_price'] ?? null;
            $category = $_POST['category'] ?? 'food';

            if ($itemName === null || $price === null) {
                errorResponse(400, 'Missing required fields: item_name, unit_price');
            }

            $imageUrl = $_POST['image_url'] ?? null;

            try {
                $price = (float)$price;
            } catch (Exception $e) {
                errorResponse(400, 'Invalid price format');
            }

            $newItem = $menuManager->add($itemName, $price, $category, $imageUrl);
            successResponse($newItem, 'Item added successfully');
            break;

        case 'delete':
            // Delete item
            if ($method !== 'POST') {
                errorResponse(405, 'Action "delete" requires POST method');
            }

            $id = $_POST['id'] ?? null;
            if ($id === null) {
                errorResponse(400, 'Missing required field: id');
            }

            try {
                $id = (int)$id;
            } catch (Exception $e) {
                errorResponse(400, 'Invalid ID format');
            }

            $deletedItem = $menuManager->delete($id);
            successResponse($deletedItem, 'Item deleted successfully');
            break;

        case 'update':
            // Update item
            if ($method !== 'POST') {
                errorResponse(405, 'Action "update" requires POST method');
            }

            $id = $_POST['id'] ?? null;
            if ($id === null) {
                errorResponse(400, 'Missing required field: id');
            }

            try {
                $id = (int)$id;
            } catch (Exception $e) {
                errorResponse(400, 'Invalid ID format');
            }

            // Gather all possible update fields
            $updates = [];
            if (isset($_POST['item_name'])) {
                $updates['item_name'] = $_POST['item_name'];
            }
            if (isset($_POST['unit_price'])) {
                $updates['unit_price'] = $_POST['unit_price'];
            }
            if (isset($_POST['category'])) {
                $updates['category'] = $_POST['category'];
            }
            if (isset($_POST['image_url'])) {
                $updates['image_url'] = $_POST['image_url'];
            }

            if (empty($updates)) {
                errorResponse(400, 'No fields to update');
            }

            $updatedItem = $menuManager->update($id, $updates);
            successResponse($updatedItem, 'Item updated successfully');
            break;

        default:
            errorResponse(400, "Unknown action: '{$action}'");
    }

    $db->close();
} catch (Exception $e) {
    errorResponse(500, 'Internal server error', $e->getMessage());
}
