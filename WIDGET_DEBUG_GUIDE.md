# 🧪 AI Chat Widget - Debugging Guide

## المشكلة: الحصول على رسالة خطأ

إذا كنت تحصل على رسالة الخطأ:

```
عذراً، حدث خطأ أثناء معالجة طلبك. يرجى المحاولة مرة أخرى لاحقاً أو التواصل معنا على +20 102 127 9663.
```

اتبع هذه الخطوات للعثور على السبب الحقيقي:

---

## 1️⃣ فتح Developer Console

### في جميع المتصفحات:

- اضغط **F12** أو **Ctrl+Shift+I**
- انقر على تبويب **Console**
- ستظهر رسائل التصحيح هناك

---

## 2️⃣ اختبار API Connection

### في Console، اكتب:

```javascript
window.AIChatWidget.testAPIConnection();
```

### النتائج المتوقعة:

**✅ نجاح:**

```
🧪 Testing Gemini API Connection...
API Key: AIzaSyBh-nW...
Endpoint: https://generativelanguage.googleapis.com/...
Response Status: 200 OK
✅ API Test Successful!
Response: {...}
```

**❌ فشل:**

```
Response Status: 401 Unauthorized
❌ API Test Failed: {error: {...}}
```

---

## 3️⃣ الأخطاء الشائعة وحلولها

### ❌ خطأ 401: Unauthorized

**السبب:** API key غير صحيح أو منتهي الصلاحية
**الحل:**

1. تحقق من API key في `assets/js/ai-chat-widget.js` (سطر 16)
2. تأكد من أن المفتاح هو: `AIzaSyBh-nW96sVQEffhZFS0NRp9U7aWkLm0YUI`
3. تحقق من Google Cloud Console أن المفتاح نشط

### ❌ خطأ 429: Too Many Requests

**السبب:** تم تجاوز حد الطلبات
**الحل:**

1. انتظر بضع دقائق
2. أعد تحميل الصفحة
3. جرب مرة أخرى

### ❌ خطأ 500: Server Error

**السبب:** خطأ في خادم Google Gemini
**الحل:**

1. انتظر قليلاً
2. تحقق من حالة خدمة Google
3. جرب مرة أخرى لاحقاً

### ❌ No Response / Timeout

**السبب:** مشاكل في الشبكة أو الاتصال
**الحل:**

1. تحقق من اتصالك بالإنترنت
2. تحقق من firewall الخاص بك
3. جرب في متصفح مختلف

---

## 4️⃣ رسائل التصحيح المفيدة

عند إرسال رسالة، ستظهر في Console:

### ✅ طلب ناجح:

```
🤖 AI Request Sent:
   API Key: AIzaSyBh-nW...
   Endpoint: https://...
   Chat History Length: 1
📤 Request Payload: {...}
📥 API Response Status: 200 OK
✅ API Response Data: {...}
💬 Response Text: "مرحباً! كيف يمكنني مساعدتك؟"
```

### ❌ طلب فاشل:

```
🤖 AI Request Sent: ...
📥 API Response Status: 401 Unauthorized
❌ API Error Response: {error: {message: "Invalid API key"}}
❌ Chat Error: API Key غير صحيح أو منتهي الصلاحية
```

---

## 5️⃣ التحقق من الإعدادات

### في Console، تحقق من:

```javascript
// فحص الـ API Key
console.log(window.AIChatWidget.API_KEY);

// فحص الـ Endpoint
console.log(window.AIChatWidget.API_ENDPOINT);

// فحص System Prompt
console.log(window.AIChatWidget.SYSTEM_PROMPT);

// فحص Chat History
console.log(window.AIChatWidget.chatHistory);
```

---

## 6️⃣ أوامر مفيدة

### مسح سجل الدردشة:

```javascript
window.AIChatWidget.clearHistory();
```

### فتح/إغلاق الدردشة برمجياً:

```javascript
window.AIChatWidget.toggleChat();
```

### إرسال رسالة برمجياً:

```javascript
// تعيين القيمة في حقل الإدخال
document.querySelector(".ai-chat-input").value = "اختبار";
// ثم إرسالها
window.AIChatWidget.sendMessage();
```

---

## 7️⃣ فحص الشبكة

### في DevTools:

1. انقر على تبويب **Network**
2. أرسل رسالة في الدردشة
3. ابحث عن طلب GET يحتوي على "generativelanguage.googleapis.com"
4. تحقق من:
   - **Status**: يجب أن يكون 200
   - **Headers**: تحقق من "Content-Type: application/json"
   - **Response**: يجب أن يحتوي على "candidates"

---

## 8️⃣ تفعيل Logging التفصيلي

إذا أردت مزيداً من المعلومات، يمكنك إضافة هذا في البداية:

```javascript
// ضع هذا في Console
localStorage.debug = "true";
// ثم أعد تحميل الصفحة
```

---

## 9️⃣ تقرير الخطأ

إذا استمرت المشكلة، جمّع هذه المعلومات:

1. **رسالة الخطأ الكاملة من Console**
2. **API Key** (آخر 10 أحرف فقط)
3. **المتصفح والإصدار**
4. **النظام التشغيلي**
5. **الوقت الذي حدثت فيه المشكلة**

---

## 🔟 روابط مفيدة

- [Google Gemini API Documentation](https://ai.google.dev/docs)
- [Google Cloud Console](https://console.cloud.google.com)
- [API Rate Limits](https://ai.google.dev/docs/quotas_limits)

---

## إذا لم ينجح شيء:

اتصل بنا على: **+20 102 127 9663**

أو أرسل بريداً إلى: **ibra7im.engineer@gmail.com**

مع ذكر جميع رسائل الخطأ من Console.

---

_آخر تحديث: 2026-04-29_
