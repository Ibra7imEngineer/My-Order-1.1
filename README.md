# 🍕 My Order - موقع طلب الطعام الرقمي المتقدم

<div dir="rtl" align="right">

## 📋 نظرة عامة

**My Order** هو موقع احترافي متكامل لطلب الطعام والتوصيل السريع. يوفر تجربة مستخدم سلسة وآمنة مع دعم شامل للعربية وتطبيقات الويب التقدمية (PWA).

---

## 👨‍💻 معلومات المطور

| المعلومة              | التفاصيل                                                                            |
| --------------------- | ----------------------------------------------------------------------------------- |
| **المطور**            | Ibrahim Mohamed                                                                     |
| **البريد الإلكتروني** | ibra7im.engineer@gmail.com                                                          |
| **Instagram**         | [@ibra7im_mo7amad](https://www.instagram.com/ibra7im_mo7amad?igsh=N3oyZWxubDA2YTYw) |
| **LinkedIn**          | [Ibrahim Mohamed](https://www.linkedin.com/in/ibra7im-mo7amed)                      |
| **الإصدار**           | 2.0 - نسخة احترافية متقدمة                                                          |
| **الجودة**            | ⭐ 5 نجوم                                                                           |

---

## ✨ المميزات الرئيسية

### 🎨 واجهة المستخدم

- ✅ واجهة عصرية وسهلة الاستخدام
- ✅ دعم كامل للغة العربية (RTL)
- ✅ تصميم متجاوب يعمل على جميع الأجهزة
- ✅ نمط داكن وفاتح
- ✅ رسوميات عالية الجودة

### 🔐 الأمان والحماية

- ✅ عناوين أمان HTTP
- ✅ حماية ضد XSS (Cross-Site Scripting)
- ✅ سياسة أمان المحتوى (CSP)
- ✅ اتصالات آمنة HTTPS
- ✅ تشفير البيانات الحساسة

### 📱 تطبيق ويب تقدمي (PWA)

- ✅ تثبيت كتطبيق على الهاتف
- ✅ عمل بدون اتصال إنترنت (Offline Mode)
- ✅ تسريع تحميل الصفحات
- ✅ Push Notifications
- ✅ Manifest.json متكامل

### 📊 إدارة البيانات

- ✅ قاعدة بيانات MySQL قوية
- ✅ تكامل Firebase اختياري
- ✅ LocalStorage للتخزين المحلي
- ✅ مزامنة البيانات في الوقت الفعلي

### 🍔 قائمة الطعام (Menu)

- ✅ فئات متعددة (أطعمة، مشروبات، حلويات)
- ✅ صور عالية الجودة
- ✅ أسعار واضحة
- ✅ إمكانية البحث والتصفية

### 🛒 سلة التسوق

- ✅ إضافة/حذف العناصر
- ✅ تعديل الكمية
- ✅ حساب السعر الإجمالي تلقائياً
- ✅ عرض ملخص الطلب

### 📦 إدارة الطلبات

- ✅ طلبات جديدة
- ✅ تتبع حالة الطلب
- ✅ سجل الطلبات السابقة
- ✅ إلغاء الطلب

### 🏪 إدارة الفروع

- ✅ دعم فروع متعددة
- ✅ معلومات الفرع (الهاتف، العنوان)
- ✅ ساعات العمل والإجازات

### 👤 إدارة المستخدم

- ✅ التسجيل والدخول
- ✅ محفظة رقمية
- ✅ سجل الطلبات
- ✅ المفضلة والعناوين المحفوظة

---

## 📁 هيكل المشروع

```
My-Order_project_pro/
│
├── 📄 index.html              ← الصفحة الرئيسية (الواجهة)
├── 🎨 style.css               ← أنماط التصميم
├── 📜 script.js               ← المنطق الأساسي (5900+ سطر)
│
├── 🔥 firebase-config.js      ← إعدادات Firebase
├── 🗄️ mysql-integration.js    ← دوال MySQL من JavaScript
├── 📦 db-seed.js              ← بيانات اختبار افتراضية
│
├── 🌐 Firebase/
│   ├── firebase-config.js
│   └── README.md
│
├── 🖥️ Backend/
│   ├── api.php                ← واجهة برمجية REST
│   ├── config.php             ← إعدادات قاعدة البيانات
│   ├── database.sql           ← هيكل قاعدة البيانات
│   └── README.md
│
├── ⚙️ الملفات الإعدادية
│   ├── manifest.json          ← PWA Manifest
│   ├── settings.json          ← إعدادات التطبيق
│   ├── MIGRATION_GUIDE.js     ← دليل الترحيل
│
├── 📚 الملفات التوضيحية
│   ├── README.md              ← هذا الملف
│   ├── README_MySQL.md        ← دليل MySQL
│   ├── SETUP_MySQL.md         ← خطوات الإعداد
│   └── QUICK_START.sh         ← بدء سريع
│
└── 🔧 الملفات الأخرى
    ├── sw.js                  ← Service Worker
    └── الموقع.txt             ← رابط الموقع
```

---

## 🗄️ هيكل قاعدة البيانات

### 📌 جدول المنتجات (products)

```
sql
CREATE TABLE products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    category VARCHAR(50) NOT NULL,      -- food, drinks, sweets
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 📦 جدول الطلبات (orders)

```
sql
CREATE TABLE orders (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id VARCHAR(50) UNIQUE NOT NULL,
    customer_name VARCHAR(255),
    customer_phone VARCHAR(20),
    customer_email VARCHAR(255),
    total_price DECIMAL(10, 2),
    notes TEXT,
    branch_id INT,
    user_id INT,
    status VARCHAR(50) DEFAULT 'جديد',   -- جديد، قيد التحضير، في الطريق، مسلم
    delivered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branches(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);
```

### 🛍️ جدول تفاصيل الطلب (order_items)

```
sql
CREATE TABLE order_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    order_id VARCHAR(50),
    product_id INT,
    quantity INT,
    price DECIMAL(10, 2),
    FOREIGN KEY (order_id) REFERENCES orders(order_id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);
```

### 🏪 جدول الفروع (branches)

```
sql
CREATE TABLE branches (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    working_hours VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE
);
```

### 👥 جدول المستخدمين (users)

```
sql
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    profile_image VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);
```

---

## 🚀 خطوات البدء السريع

### المتطلبات الأساسية

- **Server**: XAMPP أو WampServer أو أي خادم PHP
- **قاعدة البيانات**: MySQL 5.7+
- **متصفح**: Chrome, Firefox, Safari, Edge (الحديثة)
- **Node.js** (اختياري - للبناء والتطوير)

### 1️⃣ تثبيت XAMPP

```
bash
# Windows
- اذهب إلى https://www.apachefriends.org/
- حمل XAMPP Windows Installer
- شغّل المثبت واتبع التعليمات
- شغّل لوحة التحكم XAMPP Control Panel
- ابدأ Apache و MySQL

# macOS
brew install xampp
# أو احمله من: https://www.apachefriends.org/

# Linux
sudo apt-get install apache2 mysql-server php
```

### 2️⃣ نقل المشروع

```
bash
# Windows
D:\xampp\htdocs\my_order\

# Linux/Mac
/Applications/XAMPP/htdocs/my_order/
# أو
/var/www/html/my_order/
```

### 3️⃣ إعداد قاعدة البيانات

```
bash
# افتح phpMyAdmin
http://localhost/phpmyadmin/

# أو من سطر الأوامر:
mysql -u root < Backend/database.sql
```

### 4️⃣ الوصول للتطبيق

```
http://localhost/my_order/
```

✅ **سيتم إنشاء قاعدة البيانات والجداول تلقائياً!**

---

## 🔌 واجهة برمجية REST API

### Endpoints الأساسية

#### المنتجات

```
http
# الحصول على جميع المنتجات
GET /Backend/api.php?action=getProducts

# الحصول على المنتجات حسب الفئة
GET /Backend/api.php?action=getProductsByCategory&category=food

# الاستجابة:
{
    "status": "success",
    "data": [
        {
            "id": 1,
            "name": "برجر كلاسيك",
            "price": 120,
            "category": "food",
            "image_url": "..."
        }
    ]
}
```

#### الطلبات

```
http
# حفظ طلب جديد
POST /Backend/api.php?action=saveOrder
Content-Type: application/json

{
    "customer_name": "أحمد محمد",
    "customer_phone": "0501234567",
    "customer_email": "ahmed@example.com",
    "items": [
        {"product_id": 1, "quantity": 2},
        {"product_id": 2, "quantity": 1}
    ],
    "branch_id": 1,
    "notes": "بدون بصل من فضلك"
}

# الحصول على جميع الطلبات
GET /Backend/api.php?action=getOrders

# الحصول على طلب بمعرفة رقمه
GET /Backend/api.php?action=getOrderById&id=ORD123456

# تحديث حالة الطلب
POST /Backend/api.php?action=updateOrder
{
    "order_id": "ORD123456",
    "status": "قيد التحضير"
}

# حذف طلب
POST /Backend/api.php?action=deleteOrder
{
    "order_id": "ORD123456"
}
```

#### الفروع

```
http
# الحصول على جميع الفروع
GET /Backend/api.php?action=getBranches

# الاستجابة:
{
    "status": "success",
    "data": [
        {
            "id": 1,
            "name": "فرع المدينة",
            "phone": "0501234567",
            "address": "شارع الملك الرئيسي"
        }
    ]
}
```

---

## 🔥 Firebase Integration (اختياري)

إذا كنت تريد استخدام Firebase بدلاً من MySQL:

### إعدادات Firebase

```
javascript
// في firebase-config.js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project.firebaseio.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-messaging-id",
  appId: "your-app-id",
};
```

### عمليات الطلبات في Firebase

```
javascript
// حفظ طلب
saveOrderToFirebase({
    customer_name: "أحمد",
    items: [...],
    total_price: 350,
    branch_id: 1
});

// جلب الطلبات
fetchAllOrders((orders) => {
    console.log("الطلبات:", orders);
});

// تتبع تحديثات الطلب
trackOrderUpdates('ORDER_ID', (order) => {
    console.log("حالة الطلب:", order.status);
});
```

---

## 🛠️ التطوير والتخصيص

### تعديل قائمة المنتجات

#### الطريقة 1: عبر phpMyAdmin

```
sql
INSERT INTO products (name, price, category, image_url)
VALUES ('برجر جديد', 150, 'food', 'image-url');
```

#### الطريقة 2: عبر JavaScript

```
javascript
const newProduct = {
  id: Date.now(),
  name: "برجر جديد",
  price: 150,
  cat: "food",
  img: "https://...",
};

// حفظ محلياً
localStorage.setItem("products", JSON.stringify([...products, newProduct]));

// أو إرساله للخادم
fetch("Backend/api.php?action=addProduct", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(newProduct),
});
```

### تخصيص الألوان والأنماط

```
css
/* في style.css */
:root {
  --primary-color: #ff6b35; /* اللون الأساسي */
  --secondary-color: #004e89; /* اللون الثانوي */
  --success-color: #28a745; /* لون النجاح */
  --danger-color: #dc3545; /* لون الخطورة */
  --warning-color: #ffc107; /* لون التحذير */
}
```

### تعديل البيانات الافتراضية

```
javascript
// في script.js - قسم defaultItems
const defaultItems = [
  {
    id: 1,
    name: "برجر كنج كلاسيك",
    price: 120,
    cat: "food",
    img: "https://...",
  },
  // أضف منتجات أخرى هنا
];
```

---

## 📱 استخدام PWA

### تثبيت التطبيق

1. افتح الموقع في المتصفح
2. انقر على زر "تثبيت" أو "Add to Home Screen"
3. سيتم تثبيت التطبيق كتطبيق منفصل

### الميزات المتاحة بدون إنترنت

- عرض المنتجات المخزنة محلياً
- إنشاء طلبات محلية (ستُرسل عند الاتصال)
- عمل جميع الوظائف الأساسية

```
javascript
// الخدمة العاملة (Service Worker) تتعامل تلقائياً مع الاتصال
// في sw.js
self.addEventListener("fetch", (event) => {
  // الرد من الكاش إذا لم يكن هناك اتصال
});
```

---

## 🔒 الأمان والحماية

### فحص الأمان

- ✅ معالجة آمنة للمدخلات
- ✅ حماية ضد SQL Injection
- ✅ حماية ضد XSS
- ✅ CORS محدود
- ✅ تشفير كلمات المرور (bcrypt)

### أفضل الممارسات

```
php
// في Backend/api.php
// استخدام Prepared Statements
$stmt = $conn->prepare("SELECT * FROM products WHERE id = ?");
$stmt->bind_param("i", $product_id);
$stmt->execute();

// تنظيف المخرجات
$output = htmlspecialchars($input, ENT_QUOTES, 'UTF-8');
```

```
javascript
// في script.js
// التحقق من المدخلات
function validateOrder(order) {
  if (!order.customer_name || order.customer_name.trim() === "") {
    return { valid: false, message: "الاسم مطلوب" };
  }
  // ... تحققات أخرى
  return { valid: true };
}
```

---

## 🐛 استكشاف الأخطاء

### مشكلة: قاعدة البيانات لا تتصل

```
bash
# تحقق من:
1. هل MySQL قيد التشغيل؟
   - افتح XAMPP Control Panel
   - تأكد من تشغيل MySQL

2. معلومات الاتصال صحيحة؟
   - تحقق من Backend/config.php
   - المستخدم: root
   - كلمة المرور: (فارغة عادة في XAMPP)
   - قاعدة البيانات: my_order_db

3. الأذونات؟
   - قد تحتاج لإنشاء مستخدم MySQL جديد
```

### مشكلة: الصور لا تظهر

```
javascript
// استخدم صور من URLs موثوقة:
// - Unsplash: https://unsplash.com/
// - Pexels: https://www.pexels.com/
// - Pixabay: https://pixabay.com/

// أو استخدم Base64:
const imageBase64 = "data:image/jpeg;base64,...";
```

### مشكلة: التطبيق بطيء

```
bash
# تحسين الأداء:
1. استخدم Caching
   - قاعدة البيانات مع Memcached
   - الصور مع CDN
   - CSS/JS مضغوطة ومدمجة

2. تحسين قاعدة البيانات:
   - أضف indexes على الأعمدة المهمة
   - استخدم LIMIT في الاستعلامات

3. تحسين الواجهة:
   - Lazy Loading للصور
   - Code Splitting للـ JavaScript
```

---

## 📚 الملفات الإضافية

### SETUP_MySQL.md

دليل شامل لإعداد MySQL والاتصال

### MIGRATION_GUIDE.js

أمثلة عملية لهجرة البيانات من Firebase إلى MySQL

### QUICK_START.sh

سكريبت bash للبدء السريع (Linux/Mac)

### MIGRATION_GUIDE.js

```
javascript
// مثال: نقل البيانات من Firebase إلى MySQL
const migrateOrders = async () => {
  const orders = await fetchAllOrdersFromFirebase();

  for (let order of orders) {
    await saveOrderToMySQL(order);
  }

  console.log("✅ تم نقل جميع الطلبات بنجاح!");
};
```

---

## 💻 متطلبات التطوير

### الأدوات الموصى بها

```
bash
# محرر الأكواد
- Visual Studio Code
- Sublime Text
- WebStorm

# متصفحات التطوير
- Chrome DevTools
- Firefox Developer
- Safari Web Inspector

# أدوات أخرى
- Git للتحكم بالإصدارات
- Postman لاختبار API
- phpMyAdmin لإدارة قاعدة البيانات
```

### تثبيت في بيئة التطوير

```
bash
# استنساخ المشروع
git clone <repository-url>
cd My-Order_project_pro

# تثبيت المتطلبات (إن وجدت)
npm install

# قراءة التوثيق
cat README.md
cat SETUP_MySQL.md
cat QUICK_START.sh
```

---

## 🧪 اختبار التطبيق

### اختبار وحدات (Unit Tests)

```
javascript
// اختبر دالة التحقق من الطلب
function testValidateOrder() {
  const validOrder = {
    customer_name: "أحمد",
    customer_phone: "0501234567",
    items: [{ product_id: 1, quantity: 1 }],
  };

  const result = validateOrder(validOrder);
  console.assert(result.valid === true, "❌ الاختبار فشل!");
  console.log("✅ اختبار الطلب الصحيح: نجح");
}
```

### اختبار التكامل (Integration Tests)

```bash
# اختبر حفظ طلب جديد عبر الـ API الحديث
curl -X POST "http://localhost/My-Order-main/api/order.php" \
  -H "Content-Type: application/json" \
  -d '{"orderId":"ORD-100","customerName":"Test","customerPhone":"201011223344","items":[],"subtotal":0,"shipping":0,"total":0}'

# اختبر إرسال رسالة تواصل
curl -X POST "http://localhost/My-Order-main/api/contact.php" \
  -H "Content-Type: application/json" \
  -d '{"name":"Visitor","email":"a@b.com","message":"Hello"}'
```

_رسائل التواصل الآن تُخزّن في جدول `contact_messages` في قاعدة البيانات._

---

## 📈 التحسينات المستقبلية

- ✨ نظام التقييمات والمراجعات (Reviews)
- 💳 بوابات دفع متعددة (Stripe, PayPal)
- 📍 نظام التتبع بالخريطة (Google Maps)
- 🤖 نظام التوصيات باستخدام AI
- 📧 إرسال الإشعارات والبريد (Email/SMS)
- 📊 لوحة تحكم الإدارة (Admin Dashboard)
- 📱 تطبيقات موبايل (React Native/Flutter)
- 🌍 دعم لغات متعددة

---

## 📞 الدعم والمساعدة

### قنوات التواصل

| القناة                | الرابط                                                         |
| --------------------- | -------------------------------------------------------------- |
| **البريد الإلكتروني** | ibra7im.engineer@gmail.com                                     |
| **Instagram**         | [@ibra7im_mo7amad](https://www.instagram.com/ibra7im_mo7amad)  |
| **LinkedIn**          | [Ibrahim Mohamed](https://www.linkedin.com/in/ibra7im-mo7amed) |

### الأسئلة الشائعة (FAQ)

**س: هل يمكن استخدام MongoDB بدلاً من MySQL؟**
ج: نعم، تحتاج فقط لتعديل `Backend/config.php` للاتصال بـ MongoDB

**س: كيف أضيف طرق دفع؟**
ج: استخدم Stripe أو PayPal API في `script.js`

**س: هل التطبيق يعمل بدون إنترنت؟**
ج: نعم! Service Worker يوفر عمل بدون إنترنت

**س: كيف أنشر التطبيق للإنتاج؟**
ج: انظر قسم النشر أعلاه

---

## 📄 الترخيص

هذا المشروع مفتوح المصدر ومتاح تحت ترخيص MIT.

---

## 🎯 الشروع الفوري

```
bash
# 1. انسخ جميع الملفات إلى مجلد htdocs
cp -r My-Order_project_pro /path/to/xampp/htdocs/my_order

# 2. شغّل Apache و MySQL من لوحة التحكم

# 3. افتح المتصفح
open http://localhost/my_order/

# 4. استمتع! 🎉
```

---

## 📝 ملاحظات مهمة

- ✅ التطبيق آمن وجاهز للإنتاج
- ✅ يدعم جميع المتصفحات الحديثة
- ✅ متوافق مع جميع الأجهزة
- ✅ أداء محسّن ومسرّع
- ✅ توثيق شامل وسهل الفهم

---

## 🙏 شكر خاص

شكراً لاستخدامك **My Order**!

إذا أعجبك المشروع، يرجى مشاركته مع الآخرين وترك تقييم ⭐

---

**آخر تحديث:** 16 فبراير 2026  
**النسخة:** 2.0  
**الحالة:** ✅ جاهز للإنتاج

</div>
