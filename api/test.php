<?php
/**
 * My Order - Database Connection Test
 * اختبار الاتصال بقاعدة البيانات
 */

header('Content-Type: application/json; charset=utf-8');

// Get current directory
$dir = __DIR__;

// Check if config files exist
$configExample = $dir . '/config.php.example';
$configUser = $dir . '/config.php';
$dbFile = $dir . '/db.php';
$functionsFile = $dir . '/functions.php';

$results = [
    'success' => false,
    'checks' => [],
    'database' => null,
    'message' => ''
];

// Check 1: PHP version
$phpVersion = phpversion();
$results['checks']['php_version'] = [
    'required' => '7.4+',
    'actual' => $phpVersion,
    'status' => version_compare($phpVersion, '7.4.0', '>=') ? '✅ OK' : '❌ FAILED'
];

// Check 2: Required extensions
$extensions = ['pdo', 'pdo_mysql', 'json'];
$results['checks']['extensions'] = [];
foreach ($extensions as $ext) {
    $status = extension_loaded($ext) ? '✅ OK' : '❌ MISSING';
    $results['checks']['extensions'][$ext] = $status;
}

// Check 3: Files exist
$results['checks']['files'] = [
    'config.php.example' => file_exists($configExample) ? '✅ EXISTS' : '❌ MISSING',
    'config.php' => file_exists($configUser) ? '✅ EXISTS' : '⚠️ NOT CONFIGURED',
    'db.php' => file_exists($dbFile) ? '✅ EXISTS' : '❌ MISSING',
    'functions.php' => file_exists($functionsFile) ? '✅ EXISTS' : '❌ MISSING'
];

// Check 4: Database connection
$results['database'] = [
    'connected' => false,
    'host' => null,
    'database' => null,
    'error' => null,
    'tables' => []
];

if (file_exists($dbFile)) {
    try {
        // Suppress error output temporarily
        ob_start();
        
        // Include database configuration
        include $dbFile;
        
        ob_end_clean();
        
        // Try to connect and get info
        if (isset($pdo)) {
            $results['database']['connected'] = true;
            $results['database']['host'] = isset($DB_HOST) ? $DB_HOST : 'Unknown';
            $results['database']['database'] = isset($DB_NAME) ? $DB_NAME : 'Unknown';
            
            // Get list of tables
            $stmt = $pdo->query("SHOW TABLES");
            $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
            $results['database']['tables'] = $tables;
            
            // Check for required tables
            $requiredTables = ['orders', 'users', 'products', 'activity_logs'];
            $results['database']['required_tables'] = [];
            foreach ($requiredTables as $table) {
                $exists = in_array($table, $tables);
                $results['database']['required_tables'][$table] = $exists ? '✅ EXISTS' : '⚠️ NOT FOUND';
            }
        }
    } catch (Exception $e) {
        $results['database']['error'] = $e->getMessage();
    }
}

// Overall status
if ($results['database']['connected'] && 
    !empty($results['database']['tables']) &&
    $results['checks']['php_version']['status'] === '✅ OK') {
    
    $results['success'] = true;
    $results['message'] = '✅ All checks passed! Your My Order backend is ready.';
} else {
    $results['message'] = '⚠️ Some checks failed. Please review the results above.';
}

// Output results
echo json_encode($results, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

?>
