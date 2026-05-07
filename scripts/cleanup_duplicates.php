<?php
/**
 * =============================================================================
 * Menu Duplicate Cleanup Script
 * =============================================================================
 * 
 * This script removes duplicate menu items from the database.
 * It keeps the FIRST (oldest) entry and removes all subsequent duplicates.
 * 
 * Duplicates are identified by: (item_name, category) combination
 * 
 * Usage: 
 * 1. Open this file in browser: http://localhost/My-Order/cleanup_duplicates.php
 * 2. Review the report
 * 3. Click "Execute Cleanup" button if confirmed
 * 
 * =============================================================================
 */

declare(strict_types=1);

// Database configuration
$dbConfig = [
    'host'     => 'localhost',
    'user'     => 'root',
    'password' => '',
    'database' => 'restaurant_orders',
    'port'     => 3306,
    'charset'  => 'utf8mb4'
];

// Connect to database
$db = new mysqli(
    $dbConfig['host'],
    $dbConfig['user'],
    $dbConfig['password'],
    $dbConfig['database'],
    $dbConfig['port']
);

if ($db->connect_error) {
    die("❌ فشل الاتصال بقاعدة البيانات: " . $db->connect_error);
}

$db->set_charset($dbConfig['charset']);

// Detect execute action
$action = $_GET['action'] ?? $_POST['action'] ?? '';

if ($action === 'execute') {
    // Execute cleanup
    $cleanupSql = <<<SQL
        DELETE m1 FROM menu m1 
        WHERE id NOT IN (
            SELECT MIN(id) FROM menu m2 
            GROUP BY item_name, category
        )
    SQL;

    if ($db->query($cleanupSql)) {
        $affectedRows = $db->affected_rows;
        $message = "✅ تم حذف $affectedRows من المنتجات المكررة بنجاح!";
    } else {
        $message = "❌ خطأ في تنفيذ التنظيف: " . $db->error;
    }
}

// Get duplicate count
$countSql = <<<SQL
    SELECT COUNT(*) as duplicate_count 
    FROM menu m1 
    WHERE id NOT IN (
        SELECT MIN(id) FROM menu m2 
        GROUP BY item_name, category
    )
SQL;

$result = $db->query($countSql);
$countRow = $result->fetch_assoc();
$duplicateCount = (int) $countRow['duplicate_count'];

// Get list of duplicates
$duplicatesSql = <<<SQL
    SELECT 
        item_name,
        category,
        COUNT(*) as count,
        GROUP_CONCAT(id ORDER BY id) as ids,
        GROUP_CONCAT(created_at ORDER BY id) as dates
    FROM menu
    GROUP BY item_name, category
    HAVING count > 1
    ORDER BY count DESC, item_name
SQL;

$duplicatesResult = $db->query($duplicatesSql);
$duplicates = [];
while ($row = $duplicatesResult->fetch_assoc()) {
    $duplicates[] = $row;
}

?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>تنظيف المنتجات المكررة</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        
        .container {
            background: white;
            border-radius: 10px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
            padding: 30px;
            max-width: 900px;
            width: 100%;
        }
        
        h1 {
            color: #333;
            margin-bottom: 10px;
            text-align: center;
        }
        
        .subtitle {
            color: #666;
            text-align: center;
            margin-bottom: 30px;
            font-size: 14px;
        }
        
        .alert {
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
            font-weight: 500;
        }
        
        .alert-success {
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .alert-info {
            background-color: #d1ecf1;
            color: #0c5460;
            border: 1px solid #bee5eb;
        }
        
        .alert-warning {
            background-color: #fff3cd;
            color: #856404;
            border: 1px solid #ffeeba;
        }
        
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 15px;
            margin-bottom: 30px;
        }
        
        .stat-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
            text-align: center;
        }
        
        .stat-value {
            font-size: 28px;
            font-weight: bold;
            color: #667eea;
        }
        
        .stat-label {
            font-size: 12px;
            color: #666;
            margin-top: 5px;
            text-transform: uppercase;
        }
        
        .duplicates-section {
            margin-top: 30px;
        }
        
        .duplicates-title {
            font-size: 18px;
            font-weight: bold;
            color: #333;
            margin-bottom: 15px;
            border-bottom: 2px solid #667eea;
            padding-bottom: 10px;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
        }
        
        thead {
            background: #f8f9fa;
        }
        
        th {
            padding: 12px;
            text-align: right;
            font-weight: 600;
            color: #333;
            border-bottom: 2px solid #e0e0e0;
        }
        
        td {
            padding: 12px;
            border-bottom: 1px solid #e0e0e0;
        }
        
        tr:hover {
            background-color: #f8f9fa;
        }
        
        .duplicate-badge {
            display: inline-block;
            background: #ff6b6b;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
        }
        
        .button-group {
            display: flex;
            gap: 10px;
            justify-content: center;
            flex-wrap: wrap;
            margin-top: 20px;
        }
        
        button {
            padding: 12px 30px;
            font-size: 16px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.3s ease;
        }
        
        .btn-primary {
            background: #667eea;
            color: white;
        }
        
        .btn-primary:hover {
            background: #5568d3;
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
        }
        
        .btn-secondary {
            background: #6c757d;
            color: white;
        }
        
        .btn-secondary:hover {
            background: #5a6268;
            transform: translateY(-2px);
        }
        
        .empty-state {
            text-align: center;
            padding: 40px;
            color: #666;
        }
        
        .empty-state-icon {
            font-size: 48px;
            margin-bottom: 15px;
        }
        
        .code-block {
            background: #f4f4f4;
            border: 1px solid #ddd;
            border-radius: 5px;
            padding: 15px;
            margin: 15px 0;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            overflow-x: auto;
            direction: ltr;
            text-align: left;
        }
        
        @media (max-width: 600px) {
            .container {
                padding: 15px;
            }
            
            h1 {
                font-size: 20px;
            }
            
            table {
                font-size: 13px;
            }
            
            th, td {
                padding: 8px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🧹 تنظيف المنتجات المكررة</h1>
        <p class="subtitle">إزالة العناصر المكررة من قاعدة البيانات</p>
        
        <?php if ($message): ?>
            <div class="alert alert-success">
                <?= htmlspecialchars($message) ?>
            </div>
        <?php endif; ?>
        
        <div class="alert alert-info">
            ℹ️ يتم الاحتفاظ بأول إدخال (الأقدم) وحذف جميع النسخ المكررة.
        </div>
        
        <div class="stats">
            <div class="stat-card">
                <div class="stat-value"><?= $duplicateCount ?></div>
                <div class="stat-label">منتجات مكررة</div>
            </div>
            <div class="stat-card">
                <div class="stat-value"><?= count($duplicates) ?></div>
                <div class="stat-label">مجموعات مميزة</div>
            </div>
        </div>
        
        <?php if ($duplicateCount > 0): ?>
            <div class="duplicates-section">
                <div class="duplicates-title">📋 قائمة المنتجات المكررة</div>
                <table>
                    <thead>
                        <tr>
                            <th>اسم المنتج</th>
                            <th>الفئة</th>
                            <th>عدد النسخ</th>
                            <th>معرّفات</th>
                            <th>التواريخ</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($duplicates as $item): ?>
                            <tr>
                                <td><?= htmlspecialchars($item['item_name']) ?></td>
                                <td><?= htmlspecialchars($item['category']) ?></td>
                                <td>
                                    <span class="duplicate-badge">
                                        +<?= (int)$item['count'] - 1 ?>
                                    </span>
                                </td>
                                <td><code><?= htmlspecialchars($item['ids']) ?></code></td>
                                <td style="font-size: 12px; color: #666;">
                                    <?php 
                                        $dates = explode(',', $item['dates']);
                                        echo implode('<br>', array_map('htmlspecialchars', $dates));
                                    ?>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
                
                <div class="alert alert-warning">
                    ⚠️ تحذير: بمجرد تنفيذ التنظيف، لا يمكن التراجع عن العملية!
                </div>
                
                <div class="button-group">
                    <form method="POST" style="display: inline;">
                        <input type="hidden" name="action" value="execute">
                        <button type="submit" class="btn-primary" onclick="return confirm('هل أنت متأكد؟ سيتم حذف ' + <?= $duplicateCount ?> + ' منتج مكرر');">
                            ✅ تنفيذ التنظيف
                        </button>
                    </form>
                    <button class="btn-secondary" onclick="location.reload();">
                        🔄 إعادة تحميل
                    </button>
                </div>
            </div>
        <?php else: ?>
            <div class="empty-state">
                <div class="empty-state-icon">✨</div>
                <h3>لا توجد منتجات مكررة</h3>
                <p>قاعدة البيانات نظيفة تماماً!</p>
            </div>
        <?php endif; ?>
        
        <hr style="margin: 30px 0; border: none; border-top: 2px solid #e0e0e0;">
        
        <div style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 8px;">
            <h3 style="margin-bottom: 15px;">📝 أمر SQL يدوي (اختياري)</h3>
            <p style="font-size: 13px; margin-bottom: 10px; color: #666;">إذا كنت تريد تنفيذ التنظيف يدوياً عبر phpMyAdmin:</p>
            <div class="code-block">
DELETE m1 FROM menu m1<br>
WHERE id NOT IN (<br>
&nbsp;&nbsp;&nbsp;&nbsp;SELECT MIN(id) FROM menu m2<br>
&nbsp;&nbsp;&nbsp;&nbsp;GROUP BY item_name, category<br>
)
            </div>
        </div>
    </div>
</body>
</html>
