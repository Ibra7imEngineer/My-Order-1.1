// db-seed.js
// تحميل هذا الملف في المتصفح بعد تحميل Firebase (أو استدعاءه من Console)
// سيستخدم window.firebaseDB.seedMenuData و seedBranches و seedAdminUser

(function(){
const sampleMenu = [
  // --- قسم الأطعمة (Food) ---
  { id: 1, name: 'برجر كنج كلاسيك', price: 120, cat: 'food', img: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500' },
  { id: 2, name: 'بيتزا مارغريتا', price: 150, cat: 'food', img: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=500' },
  { id: 3, name: 'سباجيتي بولونيز', price: 110, cat: 'food', img: 'https://images.unsplash.com/photo-1516100882582-96c3a05fe590?w=500' },
  { id: 6, name: 'برجر دبل تشيز', price: 160, cat: 'food', img: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=500' },
  { id: 7, name: 'فاهيتا دجاج', price: 130, cat: 'food', img: 'https://i.ytimg.com/vi/9rQ9sCsuhRE/maxresdefault.jpg' },
  { id: 8, name: 'تشيكن سلايدر', price: 95, cat: 'food', img: 'https://images.deliveryhero.io/image/talabat/MenuItems/mmw_638785302646390343' },
  { id: 9, name: 'سلطة خضراء', price: 80, cat: 'food', img: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500' },
  { id: 10, name: 'سوشي سيت', price: 220, cat: 'food', img: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500' },
  { id: 16, name: 'شاورما دجاج', price: 90, cat: 'food', img: 'https://images.unsplash.com/photo-1529006557810-274b9b2fc783?w=500' },
  { id: 17, name: 'بطاطس مقلية', price: 50, cat: 'food', img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSsDvjHKJr-qPCjvGXYHS58a5JQeOo1nDTHtg&s' },

  // --- قسم المشروبات (Drinks) ---
  { id: 4, name: 'عصير برتقال طبيعي', price: 30, cat: 'drinks', img: 'https://images.unsplash.com/photo-1557800636-894a64c1696f?w=500' },
  { id: 11, name: 'عصير مانجو طازج', price: 35, cat: 'drinks', img: 'https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?w=500' },
  { id: 12, name: 'لاتيه بارد', price: 40, cat: 'drinks', img: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=500' },
  { id: 13, name: 'كابتشينو', price: 38, cat: 'drinks', img: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQgod5ahYgnGxjCQkZvC4NGvlJuZL97HaSYOA&s' },
  { id: 19, name: 'عصير تفاح فريش', price: 33, cat: 'drinks', img: 'https://images.unsplash.com/photo-1542444455-bc95121b6a38?w=500' },
  { id: 20, name: 'سموذي التوت', price: 48, cat: 'drinks', img: 'https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=500' },

  // --- قسم الحلويات (Sweets) ---
  { id: 5, name: 'كعكة الشوكولاتة', price: 70, cat: 'sweets', img: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500' },
  { id: 14, name: 'تشيز كيك فراولة', price: 85, cat: 'sweets', img: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=500' },
  { id: 15, name: 'بسبوسة بالمكسرات', price: 45, cat: 'sweets', img: 'https://www.exception-group.com/wp-content/uploads/2024/08/1.webp' },
  { id: 18, name: 'كريب نوتيلا', price: 60, cat: 'sweets', img: 'https://images.unsplash.com/photo-1519676867240-f03562e64548?w=500' },
  // --- أصناف إضافية (New Items) ---
  { id: 21, name: 'مشويات مشكلة (كباب وكفتة)', price: 280, cat: 'food', img: 'https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?w=500' },
  { id: 22, name: 'دجاج مقلي (بروستد)', price: 140, cat: 'food', img: 'https://cdn.arabsstock.com/uploads/images/180294/a-collection-of-crispy-fried-thumbnail-180294.webp' },
  { id: 23, name: 'ستيك لحم ريب آي', price: 350, cat: 'food', img: 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=500' },
  { id: 24, name: 'كلوب ساندوتش', price: 95, cat: 'food', img: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=500' },
  { id: 25, name: 'تاكو مكسيكي', price: 110, cat: 'food', img: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=500' },
  { id: 26, name: 'سلطة سيزر دجاج', price: 85, cat: 'food', img: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=500' },
  { id: 27, name: 'هوت دوج سبيشال', price: 65, cat: 'food', img: 'https://images.unsplash.com/photo-1612392062631-94dd858cba88?w=500' },
  { id: 28, name: 'جمبري مشوي', price: 220, cat: 'food', img: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=500' },
  { id: 29, name: 'لازانيا باللحم', price: 130, cat: 'food', img: 'https://images.arla.com/recordid/400FD751-4B22-4CC2-BE79C5E5B417A2F5/easy-beef-lasagna-with-bechamel-sauce.jpg' },
  { id: 30, name: 'أجنحة دجاج حارة', price: 90, cat: 'food', img: 'https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=500' }
];

    const sampleBranches = [
        { id: 'b_1', name: 'فرع القاهرة - النيل', address: 'شارع النيل، القاهرة', phone: '01001234567', hours: '12:00 - 02:00' },
        { id: 'b_2', name: 'فرع وسط البلد', address: 'ميدان التحرير، القاهرة', phone: '01012345678', hours: '11:00 - 03:00' }
    ];

    const sampleAdmin = {
        email: 'admin@myorder.local',
        displayName: 'MyOrderAdmin',
        note: 'هذا حساب مشرف تجريبي. أنشئ حساب مصادق عبر Firebase Console للبيئة الحقيقية.'
    };

    async function seedAll() {
        // إذا كانت دوال Firebase متاحة، استخدمها
        if (typeof window.firebaseDB !== 'undefined' && window.firebaseDB.seedMenuData) {
            try {
                console.log('🔄 بدء تهيئة البيانات في Firebase...');
                await window.firebaseDB.seedMenuData(sampleMenu);
                await window.firebaseDB.seedBranches(sampleBranches);
                await window.firebaseDB.seedAdminUser(sampleAdmin);
                console.log('✅ انتهت عملية التهيئة في Firebase بنجاح');
                alert('✅ تم تهيئة قاعدة البيانات في Firebase بنجاح.');
                return true;
            } catch (err) {
                console.error('❌ حدث خطأ أثناء التهيئة في Firebase:', err);
                alert('❌ فشل تهيئة البيانات في Firebase. افتح الكونسول لمزيد من التفاصيل.');
                return false;
            }
        }

        // خلاف ذلك، قم بتهيئة LocalStorage كبديل محلي
        try {
            console.log('🔁 Firebase غير متاح — سيتم استخدام LocalStorage لتهيئة البيانات محلياً');
            localStorage.setItem('myMenuData', JSON.stringify(sampleMenu));
            localStorage.setItem('myBranches', JSON.stringify(sampleBranches));
            localStorage.setItem('myAdmin', JSON.stringify(sampleAdmin));
            alert('✅ تم تهيئة البيانات محلياً في LocalStorage. أعد تحميل الصفحة لعرض البيانات.');
            return true;
        } catch (err) {
            console.error('❌ فشل تهيئة LocalStorage:', err);
            alert('❌ فشل تهيئة البيانات محلياً. افتح الكونسول لمزيد من التفاصيل.');
            return false;
        }
    }

    // افعل seedAll() من الكونسول أو استدعِه مباشرة:
    // seedAll();

    window.DBSeeder = { seedAll, sampleMenu, sampleBranches, sampleAdmin };
})();
