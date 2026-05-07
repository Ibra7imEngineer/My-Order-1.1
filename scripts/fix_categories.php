<?php
/**
 * Fix Category Data Issues
 * This script cleans up all invalid category values ('0', NULL, empty strings)
 * in both menu and order_items tables, and validates data integrity
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$dbHost = 'localhost';
$dbName = 'restaurant_orders';
$dbUser = 'root';
$dbPass = '';
$dsn = "mysql:host={$dbHost};dbname={$dbName};charset=utf8mb4";
$options = [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
];

$results = [
    'success' => true,
    'menu_items_fixed' => 0,
    'order_items_fixed' => 0,
    'menu_invalidities' => [],
    'order_items_invalidities' => [],
    'messages' => [],
];

function categorizeByName($itemName): string
{
    $itemName = mb_strtolower($itemName, 'UTF-8');
    
    // Check for drinks keywords
    if (strpos($itemName, 'سموذي') !== false || 
        strpos($itemName, 'عصير') !== false ||
        strpos($itemName, 'قهوة') !== false ||
        strpos($itemName, 'شاي') !== false ||
        strpos($itemName, 'مشروب') !== false ||
        strpos($itemName, 'ماء') !== false ||
        strpos($itemName, 'drink') !== false) {
        return 'مشروبات';
    }
    
    // Check for sweets keywords
    if (strpos($itemName, 'حلوى') !== false || 
        strpos($itemName, 'كيك') !== false ||
        strpos($itemName, 'آيس كريم') !== false ||
        strpos($itemName, 'حلويات') !== false ||
        strpos($itemName, 'بسكويت') !== false ||
        strpos($itemName, 'dessert') !== false ||
        strpos($itemName, 'sweet') !== false) {
        return 'حلويات';
    }
    
    return 'أطعمة';
}

try {
    $pdo = new PDO($dsn, $dbUser, $dbPass, $options);
    $pdo->beginTransaction();
    
    // ===== FIX MENU TABLE =====
    $results['messages'][] = 'Step 1: Checking menu table for invalid categories...';
    
    // Find all invalid categories in menu table
    $invalidMenuItems = $pdo->query("
        SELECT id, item_name, category FROM menu 
        WHERE category = '0' 
        OR category = '' 
        OR category IS NULL
        OR category NOT IN ('أطعمة', 'مشروبات', 'حلويات', 'food', 'drinks', 'sweets')
    ")->fetchAll();
    
    $results['menu_invalidities'] = count($invalidMenuItems);
    
    if (count($invalidMenuItems) > 0) {
        $results['messages'][] = "Found " . count($invalidMenuItems) . " items with invalid categories in menu table.";
        
        $updateStmt = $pdo->prepare("UPDATE menu SET category = :category WHERE id = :id");
        
        foreach ($invalidMenuItems as $item) {
            $newCategory = categorizeByName($item['item_name']);
            $updateStmt->execute([
                ':category' => $newCategory,
                ':id' => $item['id']
            ]);
            $results['menu_items_fixed']++;
        }
        
        $results['messages'][] = "Fixed " . $results['menu_items_fixed'] . " items in menu table.";
    } else {
        $results['messages'][] = "Menu table has no invalid categories.";
    }
    
    // Standardize all English categories to Arabic in menu table
    $categoryMappings = [
        'food' => 'أطعمة',
        'drinks' => 'مشروبات',
        'sweets' => 'حلويات',
        'desserts' => 'حلويات',
    ];
    
    foreach ($categoryMappings as $oldCat => $newCat) {
        $result = $pdo->exec("UPDATE menu SET category = '{$newCat}' WHERE LOWER(category) = '{$oldCat}'");
        if ($result > 0) {
            $results['messages'][] = "Standardized '{$oldCat}' to '{$newCat}' in menu table ({$result} items).";
        }
    }
    
    // ===== FIX ORDER_ITEMS TABLE =====
    $results['messages'][] = 'Step 2: Checking order_items table for invalid categories...';
    
    // Find all invalid categories in order_items table
    $invalidOrderItems = $pdo->query("
        SELECT item_id, item_name, category FROM order_items 
        WHERE category = '0' 
        OR category = '' 
        OR category IS NULL
        OR category NOT IN ('أطعمة', 'مشروبات', 'حلويات')
    ")->fetchAll();
    
    $results['order_items_invalidities'] = count($invalidOrderItems);
    
    if (count($invalidOrderItems) > 0) {
        $results['messages'][] = "Found " . count($invalidOrderItems) . " items with invalid categories in order_items table.";
        
        $updateStmt = $pdo->prepare("UPDATE order_items SET category = :category WHERE item_id = :item_id");
        
        foreach ($invalidOrderItems as $row) {
            $newCategory = categorizeByName($row['item_name']);
            $updateStmt->execute([
                ':category' => $newCategory,
                ':item_id' => $row['item_id']
            ]);
            $results['order_items_fixed']++;
        }
        
        $results['messages'][] = "Fixed " . $results['order_items_fixed'] . " items in order_items table.";
    } else {
        $results['messages'][] = "Order items table has no invalid categories.";
    }
    
    // ===== VERIFY DATA INTEGRITY =====
    $results['messages'][] = 'Step 3: Verifying data integrity...';
    
    $menuCount = $pdo->query("SELECT COUNT(*) as cnt FROM menu")->fetch()['cnt'];
    $validMenuCount = $pdo->query("SELECT COUNT(*) as cnt FROM menu WHERE category IN ('أطعمة', 'مشروبات', 'حلويات')")->fetch()['cnt'];
    $results['messages'][] = "Menu table: {$validMenuCount} of {$menuCount} items have valid categories.";
    
    $orderItemsCount = $pdo->query("SELECT COUNT(*) as cnt FROM order_items")->fetch()['cnt'];
    $validOrderItemsCount = $pdo->query("SELECT COUNT(*) as cnt FROM order_items WHERE category IN ('أطعمة', 'مشروبات', 'حلويات')")->fetch()['cnt'];
    $results['messages'][] = "Order items table: {$validOrderItemsCount} of {$orderItemsCount} items have valid categories.";
    
    // Summary by category
    $categoryBreakdown = $pdo->query("SELECT category, COUNT(*) as cnt FROM menu GROUP BY category")->fetchAll();
    foreach ($categoryBreakdown as $row) {
        $results['messages'][] = "Menu - {$row['category']}: {$row['cnt']} items";
    }
    
    $pdo->commit();
    
    $results['messages'][] = "✓ All category data has been fixed and verified successfully!";
    
} catch (Throwable $e) {
    if (isset($pdo) && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    $results['success'] = false;
    $results['error'] = $e->getMessage();
}

http_response_code($results['success'] ? 200 : 500);
echo json_encode($results, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
?>