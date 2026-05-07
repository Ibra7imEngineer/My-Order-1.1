<?php
/**
 * =========================================================
 * My Order - AI Chat Widget - Pre-made Professional Responses
 * =========================================================
 * 20 Professional Arabic responses for restaurant inquiries
 * Database: my_order (table: chat_responses)
 * =========================================================
 */

// Database configuration
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'my_order');

// Connect to database
$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);

if ($conn->connect_error) {
    die(json_encode(['error' => 'فشل الاتصال بقاعدة البيانات: ' . $conn->connect_error]));
}

// Set charset to UTF-8
$conn->set_charset("utf8mb4");

// Pre-made professional responses for the restaurant
$responses = [
    [
        'keyword' => 'أوقات العمل',
        'response' => 'نحن مفتوحون يومياً من الساعة 10:00 صباحاً إلى 10:00 مساءً. يمكنك زيارتنا في أي وقت خلال هذه الساعات. شكراً لاختيارك My Order! 🍽️'
    ],
    [
        'keyword' => 'التوصيل',
        'response' => 'خدمة التوصيل متاحة من الساعة 11:00 صباحاً إلى 9:30 مساءً. يستغرق التوصيل عادة من 30 إلى 45 دقيقة حسب الموقع. تكلفة التوصيل تبدأ من 10 جنيهات. 🚚'
    ],
    [
        'keyword' => 'القائمة',
        'response' => 'قائمتنا تحتوي على مجموعة متنوعة من الأطباق الشهية التقليدية والعصرية. لدينا خيارات للحوم والدواجن والأسماك والخضروات. يمكنك مشاهدة القائمة الكاملة على موقعنا أو التطبيق. 📱'
    ],
    [
        'keyword' => 'الأسعار',
        'response' => 'أسعارنا تنافسية وعادلة. معظم الأطباق الرئيسية تتراوح بين 50 و 200 جنيه. لدينا عروض خاصة وخصومات للطلبات الكبيرة. تواصل معنا للمزيد من التفاصيل! 💰'
    ],
    [
        'keyword' => 'الحجز',
        'response' => 'يمكنك حجز طاولة من خلال موقعنا الإلكتروني أو التطبيق أو بالاتصال المباشر على +20 102 127 9663. نوصي بالحجز المسبق خاصة في أيام نهاية الأسبوع. 📞'
    ],
    [
        'keyword' => 'الخيارات النباتية',
        'response' => 'نعم، لدينا خيارات نباتية متعددة وشهية. نقدم أطباق بالخضروات الطازجة والفطر والجبن والحبوب. يمكنك إخبارنا بتفضيلاتك الغذائية. 🥗'
    ],
    [
        'keyword' => 'الحساسية',
        'response' => 'نأخذ الحساسية بجدية كبيرة. يرجى إخبارنا بأي حساسية غذائية لديك قبل الطلب. فريقنا مدرب على التعامل مع المتطلبات الغذائية الخاصة. ⚠️'
    ],
    [
        'keyword' => 'الدفع',
        'response' => 'نقبل الدفع نقداً أو بطاقة ائتمان أو محافظ رقمية (Apple Pay, Google Pay). يمكن الدفع عند الاستلام أو قبل التوصيل. 💳'
    ],
    [
        'keyword' => 'الخصومات',
        'response' => 'نقدم خصومات خاصة للطلبات الكبيرة والحفلات. كما لدينا عروض أسبوعية وموسمية. تابعنا على وسائل التواصل للحصول على أحدث العروض! 🎉'
    ],
    [
        'keyword' => 'الشحنات الكبيرة',
        'response' => 'نستطيع التعامل مع الطلبات الكبيرة للمناسبات والحفلات. يرجى الاتصال بنا مسبقاً لتنسيق التفاصيل والسعر. رقمنا: +20 102 127 9663 📦'
    ],
    [
        'keyword' => 'الجودة',
        'response' => 'نستخدم مكونات طازة وعالية الجودة في جميع أطباقنا. فريق الطهي الخاص بنا ذو خبرة عالية ومدرب على أعلى معايير النظافة والسلامة. ✅'
    ],
    [
        'keyword' => 'التقييم',
        'response' => 'شكراً على اهتمامك! تقييماتك مهمة جداً لنا. يمكنك ترك تقييم بعد طلبك مباشرة على الموقع أو التطبيق. ⭐'
    ],
    [
        'keyword' => 'الشكاوى',
        'response' => 'نأسف لأي مشكلة تواجهك. رضاك أولويتنا. يرجى التواصل معنا فوراً على +20 102 127 9663 أو البريد الإلكتروني ibra7im.engineer@gmail.com 📧'
    ],
    [
        'keyword' => 'الموقع',
        'response' => 'نحن موجودون في شارع النيل، القاهرة، مصر. يمكنك الوصول إلينا بسهولة بالسيارة أو المترو. لدينا موقف سيارات واسع. 🏠'
    ],
    [
        'keyword' => 'الهاتف',
        'response' => 'رقم الهاتف الخاص بنا: +20 102 127 9663. يمكنك التواصل معنا من الساعة 10:00 صباحاً إلى 10:00 مساءً يومياً. 📞'
    ],
    [
        'keyword' => 'البريد الإلكتروني',
        'response' => 'بريدنا الإلكتروني: ibra7im.engineer@gmail.com. نرد على جميع الرسائل خلال 24 ساعة. 📬'
    ],
    [
        'keyword' => 'الوسائل التواصل',
        'response' => 'تابعنا على وسائل التواصل الاجتماعي للحصول على آخر العروض والأخبار. Instagram: @myorder_restaurant | Facebook: My Order Restaurant 📱'
    ],
    [
        'keyword' => 'الأطفال',
        'response' => 'نرحب بالأطفال! لدينا قائمة خاصة بالأطفال مع أطباق مفضلة لهم. المطعم آمن وودود للعائلات. 👶'
    ],
    [
        'keyword' => 'الحفلات',
        'response' => 'نوفر حزم خاصة للحفلات والمناسبات. يمكننا تجهيز الطعام والديكور. تواصل معنا لتنسيق تفاصيل حفلتك! 🎊'
    ],
    [
        'keyword' => 'شكراً',
        'response' => 'العفو! شكراً لك على اختيار My Order. نتطلع لخدمتك قريباً. لا تتردد في التواصل معنا في أي وقت. 😊'
    ]
];

// Create table if not exists
$createTableSQL = "
CREATE TABLE IF NOT EXISTS chat_responses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    keyword VARCHAR(100) NOT NULL UNIQUE,
    response TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_keyword (keyword)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
";

if (!$conn->query($createTableSQL)) {
    die(json_encode(['error' => 'فشل إنشاء الجدول: ' . $conn->error]));
}

// Clear existing responses
$conn->query("TRUNCATE TABLE chat_responses");

// Insert pre-made responses
$inserted = 0;
$failed = [];

foreach ($responses as $resp) {
    $keyword = $conn->real_escape_string($resp['keyword']);
    $response = $conn->real_escape_string($resp['response']);
    
    $sql = "INSERT INTO chat_responses (keyword, response) VALUES ('$keyword', '$response')";
    
    if ($conn->query($sql)) {
        $inserted++;
    } else {
        $failed[] = $keyword . ' - ' . $conn->error;
    }
}

$result = [
    'success' => true,
    'message' => 'تم تجهيز الإجابات المهنية بنجاح!',
    'inserted' => $inserted,
    'total' => count($responses),
    'failed' => $failed,
    'database' => 'my_order',
    'table' => 'chat_responses'
];

echo json_encode($result, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);

$conn->close();
?>
