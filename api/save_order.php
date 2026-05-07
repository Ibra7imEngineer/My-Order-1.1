<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/db_config.php';

function respond(int $statusCode, array $payload): void
{
    http_response_code($statusCode);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Map category names (Arabic or English) to standard English categories
 * Converts: أطعمة -> Food, مشروبات -> Drinks, حلويات -> Sweets
 */
function mapCategoryToEnglish(string $category): string
{
    $normalized = mb_strtolower(trim($category), 'UTF-8');
    
    // Arabic to English mapping
    if ($normalized === 'أطعمة' || $normalized === 'food') {
        return 'Food';
    }
    if ($normalized === 'مشروبات' || $normalized === 'drinks') {
        return 'Drinks';
    }
    if ($normalized === 'حلويات' || $normalized === 'sweets') {
        return 'Sweets';
    }
    
    // If input doesn't match any known category, try keyword matching
    if (strpos($normalized, 'سموذي') !== false || strpos($normalized, 'عصير') !== false || 
        strpos($normalized, 'drink') !== false || strpos($normalized, 'beverage') !== false) {
        return 'Drinks';
    }
    if (strpos($normalized, 'حلوى') !== false || strpos($normalized, 'كيك') !== false || 
        strpos($normalized, 'آيس كريم') !== false || strpos($normalized, 'sweet') !== false || 
        strpos($normalized, 'cake') !== false || strpos($normalized, 'dessert') !== false) {
        return 'Sweets';
    }
    
    // Default to Food
    return 'Food';
}

/**
 * Determine category based on item name (AI-like keyword matching)
 * Returns ENGLISH category names only: 'Food', 'Drinks', 'Sweets'
 */
function getCategory(string $itemName): string
{
    $itemName = mb_strtolower($itemName, 'UTF-8');
    
    // Check for drinks keywords (Arabic & English)
    if (strpos($itemName, 'سموذي') !== false || strpos($itemName, 'عصير') !== false ||
        strpos($itemName, 'drink') !== false || strpos($itemName, 'beverage') !== false ||
        strpos($itemName, 'juice') !== false || strpos($itemName, 'coffee') !== false ||
        strpos($itemName, 'tea') !== false || strpos($itemName, 'soda') !== false) {
        return 'Drinks';
    }
    
    // Check for sweets keywords (Arabic & English)
    if (strpos($itemName, 'حلوى') !== false || strpos($itemName, 'كيك') !== false || 
        strpos($itemName, 'آيس كريم') !== false || strpos($itemName, 'تحلية') !== false ||
        strpos($itemName, 'sweet') !== false || strpos($itemName, 'cake') !== false || 
        strpos($itemName, 'dessert') !== false || strpos($itemName, 'ice cream') !== false) {
        return 'Sweets';
    }
    
    // Default to Food
    return 'Food';
}

/**
 * Ensure category is one of: 'Food', 'Drinks', 'Sweets'
 * Returns valid English category or falls back to 'Food'
 */
function ensureValidEnglishCategory(string $category): string
{
    $category = mapCategoryToEnglish($category);
    $valid = ['Food', 'Drinks', 'Sweets'];
    if (in_array($category, $valid, true)) {
        return $category;
    }
    return 'Food'; // Safe fallback
}

function ensureOrderItemsCategoryColumn(PDO $pdo): void
{
    $columnExists = $pdo->query("SHOW COLUMNS FROM order_items LIKE 'category'")->fetch(PDO::FETCH_ASSOC);
    if ($columnExists === false) {
        $pdo->exec(
            "ALTER TABLE order_items ADD COLUMN category VARCHAR(100) NOT NULL DEFAULT 'Food', ADD INDEX idx_category (category)"
        );
    }
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, [
        'success' => false,
        'error' => 'Method not allowed. Use POST.',
    ]);
}

$contentType = $_SERVER['CONTENT_TYPE'] ?? '';
if (stripos($contentType, 'application/json') === false) {
    respond(415, [
        'success' => false,
        'error' => 'Content-Type must be application/json.',
    ]);
}

$rawBody = file_get_contents('php://input');
$data = json_decode($rawBody, true);
if (!is_array($data) || json_last_error() !== JSON_ERROR_NONE) {
    respond(400, [
        'success' => false,
        'error' => 'Invalid JSON payload.',
    ]);
}

$customerName = trim((string) ($data['customer_name'] ?? ''));
$phone = trim((string) ($data['phone'] ?? ''));
$address = trim((string) ($data['address'] ?? ''));
$items = $data['cart_items'] ?? [];

if ($customerName === '') {
    respond(422, [
        'success' => false,
        'error' => 'Customer name is required.',
    ]);
}

if (!is_array($items) || count($items) === 0) {
    respond(422, [
        'success' => false,
        'error' => 'Order items are required.',
    ]);
}

try {
    $pdo = new PDO($dsn, $dbUser, $dbPass, $options);
    ensureOrderItemsCategoryColumn($pdo);
    $pdo->beginTransaction();

    $orderStmt = $pdo->prepare(
        'INSERT INTO orders (customer_name, phone, address, total_price, order_status) VALUES (:customer_name, :phone, :address, :total_price, :order_status)'
    );

    $computedTotal = 0.0;
    $itemRows = [];

    // Prepare to fetch categories from menu table
    $menuByIdStmt = $pdo->prepare('SELECT id, item_name, category, unit_price FROM menu WHERE id = :menu_id LIMIT 1');
    $menuByNameStmt = $pdo->prepare('SELECT id, category FROM menu WHERE item_name = :item_name LIMIT 1');

    foreach ($items as $item) {
        $itemName = trim((string) ($item['itemName'] ?? $item['item_name'] ?? $item['name'] ?? $item['title'] ?? null));
        $quantity = isset($item['quantity']) ? (int) $item['quantity'] : (isset($item['qty']) ? (int) $item['qty'] : 0);
        $unitPrice = isset($item['unit_price']) ? (float) $item['unit_price'] : (isset($item['unitPrice']) ? (float) $item['unitPrice'] : (isset($item['price']) ? (float) $item['price'] : 0.0));
        $menuId = null;
        if (isset($item['menu_id']) && $item['menu_id'] !== '') {
            $menuId = (int) $item['menu_id'];
        } elseif (isset($item['item_id']) && $item['item_id'] !== '') {
            $menuId = (int) $item['item_id'];
        } elseif (isset($item['id']) && $item['id'] !== '') {
            $menuId = (int) $item['id'];
        }

        if ($itemName === '') {
            // قد يكون لم يتم تحديد اسم العنصر في بعض الإصدارات القديمة.
            $itemName = 'غير معروف';
        }
        if ($quantity <= 0) {
            $quantity = 1;
        }
        if ($unitPrice < 0) {
            $unitPrice = 0;
        }

        // Initialize category with AI-based keyword detection (returns English)
        $category = getCategory($itemName);
        
        // Priority 1: Fetch by menu_id if provided (most reliable)
        if ($menuId !== null && $menuId > 0) {
            try {
                $menuByIdStmt->execute([':menu_id' => $menuId]);
                $menuRow = $menuByIdStmt->fetch();
                if ($menuRow) {
                    $menuCategory = trim((string)($menuRow['category'] ?? ''));
                    // Map any category (Arabic or English) to English, then validate
                    if ($menuCategory !== '' && $menuCategory !== '0') {
                        $category = ensureValidEnglishCategory($menuCategory);
                    }
                    if ($unitPrice <= 0 && isset($menuRow['unit_price'])) {
                        $unitPrice = (float) $menuRow['unit_price'];
                    }
                }
            } catch (Exception $e) {
                // Continue to next fallback
            }
        }
        
        // Priority 2: Fetch by item_name if menu_id didn't work
        if ($menuId === null || $menuId <= 0) {
            try {
                $menuByNameStmt->execute([':item_name' => $itemName]);
                $menuRow = $menuByNameStmt->fetch();
                if ($menuRow) {
                    $menuCategory = trim((string)($menuRow['category'] ?? ''));
                    // Map any category (Arabic or English) to English, then validate
                    if ($menuCategory !== '' && $menuCategory !== '0') {
                        $category = ensureValidEnglishCategory($menuCategory);
                    }
                    if ($menuId === null || $menuId <= 0) {
                        $menuId = (int) $menuRow['id'];
                    }
                }
            } catch (Exception $e) {
                // If menu query fails, use getCategory fallback
            }
        }

        // Final validation: ensure category is ALWAYS one of the three valid English categories
        $category = ensureValidEnglishCategory($category);

        $subtotal = round($quantity * $unitPrice, 2);
        $computedTotal += $subtotal;
        $itemRows[] = [
            'item_name' => $itemName,
            'menu_id' => $menuId,
            'category' => $category,
            'quantity' => $quantity,
            'unit_price' => $unitPrice,
            'subtotal' => $subtotal,
        ];
    }

    $orderStmt->execute([
        ':customer_name' => $customerName,
        ':phone' => $phone,
        ':address' => $address,
        ':total_price' => $computedTotal,
        ':order_status' => 'pending',
    ]);

    $orderId = (int) $pdo->lastInsertId();
    if ($orderId <= 0) {
        throw new RuntimeException('Failed to create order.');
    }

    $itemStmt = $pdo->prepare(
        'INSERT INTO order_items (order_id, menu_id, item_name, category, quantity, unit_price, subtotal) VALUES (:order_id, :menu_id, :item_name, :category, :quantity, :unit_price, :subtotal)'
    );

    foreach ($itemRows as $row) {
        $itemStmt->execute([
            ':order_id' => $orderId,
            ':menu_id' => $row['menu_id'],
            ':item_name' => $row['item_name'],
            ':category' => $row['category'],
            ':quantity' => $row['quantity'],
            ':unit_price' => $row['unit_price'],
            ':subtotal' => $row['subtotal'],
        ]);
    }

    $pdo->commit();

    respond(201, [
        'success' => true,
        'message' => 'Order saved successfully.',
        'order_id' => $orderId,
        'total_price' => number_format($computedTotal, 2, '.', ''),
    ]);
} catch (Throwable $exception) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }

    $errorMessage = $exception->getMessage();
    respond(500, [
        'success' => false,
        'error' => 'Failed to save order: ' . $errorMessage,
    ]);
}
