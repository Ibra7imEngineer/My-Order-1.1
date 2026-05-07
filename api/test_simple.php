<?php
// Simple test - just check if PHP is working
header('Content-Type: application/json');

$api_key = 'NOT_SET';

// Check environment variable
if (!empty(getenv('GEMINI_API_KEY'))) {
    $api_key = 'SET_IN_ENV';
}

// Check .env.php
if (file_exists(__DIR__ . '/../.env.php')) {
    include __DIR__ . '/../.env.php';
    if (!empty($GEMINI_API_KEY) && $GEMINI_API_KEY !== 'YOUR_API_KEY_HERE') {
        $api_key = 'SET_IN_ENV_PHP';
    }
}

echo json_encode([
    'status' => 'ok',
    'php' => 'working',
    'api_key' => $api_key,
    'timestamp' => date('Y-m-d H:i:s')
]);
?>
