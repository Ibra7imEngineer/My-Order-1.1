<?php
// CRITICAL: Suppress PHP errors to prevent HTML output breaking JSON
error_reporting(0);
ini_set('display_errors', 0);

ob_start();
if (ob_get_level() && ob_get_length() > 0) {
    ob_clean();
}

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit(json_encode(['ok' => 1]));
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit(json_encode(['error' => 'Only POST requests are allowed']));
}

// Get API key from .env.php
$API_KEY = '';
$env_file = __DIR__ . '/../.env.php';

if (file_exists($env_file)) {
    $env_content = file_get_contents($env_file);
    // Extract key using regex
    if (preg_match('/\$GEMINI_API_KEY\s*=\s*[\'"]([^\'"]+)[\'"]/i', $env_content, $matches)) {
        $API_KEY = $matches[1];
    }
}

// Also try environment variable
if (empty($API_KEY)) {
    $API_KEY = getenv('GEMINI_API_KEY');
}

if (empty($API_KEY) || $API_KEY === 'YOUR_API_KEY_HERE') {
    http_response_code(500);
    exit(json_encode([
        'error' => 'No API key',
        'file' => $env_file . ' exists: ' . (file_exists($env_file) ? 'yes' : 'no')
    ]));
}

$input = file_get_contents('php://input');
if ($input === false || $input === '') {
    http_response_code(400);
    exit(json_encode(['error' => 'Empty request body']));
}

$data = json_decode($input, true);
if (json_last_error() !== JSON_ERROR_NONE) {
    http_response_code(400);
    exit(json_encode([
        'error' => 'Invalid JSON payload',
        'details' => json_last_error_msg(),
    ]));
}

$contents = $data['contents'] ?? [];
$message = '';
if (!empty($contents) && is_array($contents)) {
    $lastMsg = end($contents);
    $message = trim($lastMsg['parts'][0]['text'] ?? '');
} elseif (!empty($data['message'])) {
    $message = trim($data['message']);
}
if ($message === '') {
    http_response_code(400);
    exit(json_encode(['error' => 'Message is required']));
}

// $API_KEY is already loaded and validated from .env.php above
$apiKey = $API_KEY;

$supportedModels = [
    'gemini-2.0-flash',
    'gemini-2.0-flash-001',
    'gemini-2.5-flash',
    'gemini-2.5-pro',
];

$requestedModel = trim($data['model'] ?? '');
$model = in_array($requestedModel, $supportedModels, true)
    ? $requestedModel
    : $supportedModels[0];

$payload = [
    'systemInstruction' => [
        'parts' => [[
            'text' => $data['systemInstruction'] ?? 'You are a helpful assistant.',
        ]],
    ],
    'contents' => [
        [
            'role' => 'user',
            'parts' => [[
                'text' => $message,
            ]],
        ],
    ],
    'generationConfig' => [
        'temperature' => $data['temperature'] ?? 0.7,
        'maxOutputTokens' => $data['maxOutputTokens'] ?? 256,
        'topP' => $data['topP'] ?? 0.95,
        'topK' => $data['topK'] ?? 40,
    ],
];

$lastError = null;
$reply = null;
$providerResponse = null;
foreach (array_unique(array_merge([$model], $supportedModels)) as $candidateModel) {
    $url = 'https://generativelanguage.googleapis.com/v1beta/models/' . urlencode($candidateModel) . ':generateContent?key=' . urlencode($apiKey);
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($payload),
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_TIMEOUT => 30,
        CURLOPT_CONNECTTIMEOUT => 10,
    ]);

    $response = curl_exec($ch);
    $curlError = curl_error($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($curlError) {
        http_response_code(502);
        exit(json_encode(['error' => 'AI request failed', 'details' => $curlError]));
    }

    $decoded = json_decode($response, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        error_log("Gemini raw response: " . substr($response, 0, 1000));
        http_response_code(502);
        exit(json_encode([
            'error' => 'Invalid JSON response from AI provider',
            'provider_response' => substr($response, 0, 1000),
        ]));
    }

    if ($httpCode < 200 || $httpCode >= 300) {
        $errorMessage = $decoded['error']['message'] ?? $decoded['status'] ?? 'AI provider returned an error';
        $providerResponse = $decoded;

        $isFallbackError =
            $httpCode === 404 ||
            $httpCode === 503 ||
            $httpCode === 429 ||
            stripos($errorMessage, 'not supported for generateContent') !== false ||
            stripos($errorMessage, 'is not found') !== false ||
            stripos($errorMessage, 'high demand') !== false ||
            stripos($errorMessage, 'unavailable') !== false;

        if ($isFallbackError) {
            $lastError = $errorMessage;
            continue;
        }

        // Special handling for quota exceeded errors
        if ($httpCode === 429 || stripos($errorMessage, 'quota exceeded') !== false || stripos($errorMessage, 'RESOURCE_EXHAUSTED') !== false) {
            http_response_code(429);
            exit(json_encode([
                'error' => 'تم تجاوز حد الاستخدام المجاني للذكاء الاصطناعي. يرجى الانتظار قليلاً أو التواصل معنا لترقية الخدمة.',
                'details' => 'Quota exceeded - please upgrade your API plan or wait for reset.',
                'provider_response' => $decoded
            ]));
        }

        http_response_code($httpCode);
        exit(json_encode(['error' => $errorMessage, 'provider_response' => $decoded]));
    }

    $reply = $decoded['candidates'][0]['content']['parts'][0]['text'] ?? null;
    if ($reply !== null) {
        $providerResponse = $decoded;
        break;
    }

    $lastError = 'AI response format is invalid or missing reply text';
    $providerResponse = $decoded;
}

if ($reply === null) {
    http_response_code(502);
    exit(json_encode([
        'error' => 'AI response format is invalid or no supported Gemini model was available',
        'provider_response' => $providerResponse,
        'tried_models' => array_unique(array_merge([$model], $supportedModels)),
        'last_error' => $lastError,
    ]));
}

echo json_encode(['reply' => $reply]);
exit;


