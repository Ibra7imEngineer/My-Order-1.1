<?php
/**
 * =============================================================================
 * Menu Migration Script: Google Sheets → MySQL
 * =============================================================================
 *
 * This one-time script migrates all menu items from Google Sheets to the
 * local MySQL database (restaurant_orders.menu table).
 *
 * Features:
 * - Fetches JSON data from Google Apps Script URL
 * - Handles flexible field naming (Item Name, name, itemName, etc.)
 * - Maps categories (food, drinks, sweets) to database format
 * - Prevents duplicate items using INSERT IGNORE (MySQL constraint)
 * - Provides detailed migration report
 * - Includes error handling and logging
 *
 * Usage: Navigate to http://localhost/My-Order/migrate_menu_to_mysql.php
 *
 * =============================================================================
 */

declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');

// ============================================================================
// Database Configuration
// ============================================================================
$dbHost = 'localhost';
$dbName = 'restaurant_orders';
$dbUser = 'root';
$dbPass = '';

$dsn = "mysql:host={$dbHost};dbname={$dbName};charset=utf8mb4";
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    PDO::ATTR_EMULATE_PREPARES => false,
];

// ============================================================================
// Google Sheets API URL (from script.js)
// ============================================================================
$googleSheetsUrl = 'https://script.google.com/macros/s/AKfycbwNk_soG4ddyF3jJ8NbT__IOS2FSafEK7uT5Om8fyw2Kjz8S9Cn7EVX-lNqQar9VSF9/exec';

// ============================================================================
// Response Helper Function
// ============================================================================
function respond(int $statusCode, array $payload): void
{
    http_response_code($statusCode);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
    exit;
}

// ============================================================================
// Fetch Google Sheets Data
// ============================================================================
$migrationReport = [
    'status' => 'error',
    'message' => '',
    'totalItems' => 0,
    'insertedItems' => 0,
    'duplicateItems' => 0,
    'failedItems' => 0,
    'errors' => [],
    'insertedItemsList' => [],
    'duplicateItemsList' => [],
    'failedItemsList' => [],
];

try {
    // Fetch JSON from Google Sheets
    $jsonData = @file_get_contents($googleSheetsUrl);
    
    if ($jsonData === false) {
        throw new Exception(
            '❌ Failed to fetch data from Google Sheets. ' .
            'Verify the Google Apps Script is deployed and the URL is correct.'
        );
    }

    $items = json_decode($jsonData, true);
    
    if ($items === null) {
        throw new Exception(
            '❌ Failed to parse JSON from Google Sheets. ' .
            'Response may not be valid JSON: ' . substr($jsonData, 0, 200)
        );
    }

    // Ensure items is an array
    if (!is_array($items)) {
        $items = isset($items['items']) && is_array($items['items'])
            ? $items['items']
            : (isset($items['menu']) && is_array($items['menu'])
                ? $items['menu']
                : []);
    }

    if (empty($items)) {
        throw new Exception('No menu items found in Google Sheets data.');
    }

    $migrationReport['totalItems'] = count($items);

    // Connect to MySQL
    $pdo = new PDO($dsn, $dbUser, $dbPass, $options);

    // ========================================================================
    // Process Each Item
    // ========================================================================
    foreach ($items as $index => $item) {
        try {
            // Extract and normalize field names (Google Sheets may use various formats)
            $itemName = trim(
                $item['Item Name'] ??
                $item['item_name'] ??
                $item['name'] ??
                $item['Name'] ??
                $item['itemName'] ??
                ''
            );

            $unitPrice = floatval(
                $item['Price'] ??
                $item['price'] ??
                $item['Price (ج.م)'] ??
                $item['cost'] ??
                $item['value'] ??
                0
            );

            $categoryRaw = trim(
                $item['Category'] ??
                $item['category'] ??
                $item['cat'] ??
                $item['type'] ??
                'food'
            );

            $imageUrl = trim(
                $item['Image URL'] ??
                $item['image_url'] ??
                $item['image'] ??
                $item['img'] ??
                $item['imageUrl'] ??
                'https://via.placeholder.com/320x220?text=No+Image'
            );

            // Validate required fields
            if (empty($itemName)) {
                throw new Exception('Item name is missing or empty');
            }

            if ($unitPrice <= 0) {
                throw new Exception("Invalid price: {$unitPrice}");
            }

            // Normalize category to database format
            $category = normalizeCategory($categoryRaw);

            // ====================================================================
            // Insert into MySQL (with duplicate prevention)
            // ====================================================================
            $sql = '
                INSERT IGNORE INTO menu 
                (item_name, unit_price, category, image_url)
                VALUES 
                (:itemName, :unitPrice, :category, :imageUrl)
            ';

            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':itemName' => $itemName,
                ':unitPrice' => $unitPrice,
                ':category' => $category,
                ':imageUrl' => $imageUrl,
            ]);

            $insertedRows = $stmt->rowCount();

            if ($insertedRows > 0) {
                $migrationReport['insertedItems']++;
                $migrationReport['insertedItemsList'][] = [
                    'item_name' => $itemName,
                    'unit_price' => $unitPrice,
                    'category' => $category,
                ];
            } else {
                // Item was not inserted (duplicate detected)
                $migrationReport['duplicateItems']++;
                $migrationReport['duplicateItemsList'][] = [
                    'item_name' => $itemName,
                    'category' => $category,
                    'reason' => 'Already exists (unique constraint on item_name + category)',
                ];
            }
        } catch (Exception $e) {
            // Handle errors for individual items
            $migrationReport['failedItems']++;
            $migrationReport['failedItemsList'][] = [
                'index' => $index,
                'item' => $item,
                'error' => $e->getMessage(),
            ];
            $migrationReport['errors'][] = $e->getMessage();
        }
    }

    // ========================================================================
    // Finalize Report
    // ========================================================================
    $migrationReport['status'] = 'success';
    $migrationReport['message'] = sprintf(
        '✅ Migration completed! Processed %d items: %d inserted, %d duplicates skipped, %d failed.',
        $migrationReport['totalItems'],
        $migrationReport['insertedItems'],
        $migrationReport['duplicateItems'],
        $migrationReport['failedItems']
    );

    respond(200, $migrationReport);

} catch (Exception $e) {
    $migrationReport['status'] = 'error';
    $migrationReport['message'] = '❌ ' . $e->getMessage();
    $migrationReport['errors'][] = $e->getMessage();
    respond(500, $migrationReport);
}

// ============================================================================
// Helper Function: Normalize Category
// ============================================================================
function normalizeCategory(string $raw): string
{
    $normalized = mb_strtolower(trim($raw), 'UTF-8');

    // Map English names to database format
    if (in_array($normalized, ['food', 'foods', 'أطعمة'], true)) {
        return 'food';
    }
    if (in_array($normalized, ['drinks', 'drink', 'مشروبات'], true)) {
        return 'drinks';
    }
    if (in_array($normalized, ['sweets', 'dessert', 'حلويات'], true)) {
        return 'sweets';
    }

    // Return as-is if already in database format or unknown
    return $raw;
}
?>
