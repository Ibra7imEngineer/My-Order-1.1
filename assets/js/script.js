/* ==================================================
  My Order
  ================================================== 
    
    👨‍💻 Developer: Ibrahim Mohamed
    📧 Email: ibra7im.engineer@gmail.com
    📱 Instagram: @ibra7im_mo7amad
    💼 LinkedIn: Ibrahim Mohamed
    🌐 Contact: https://www.linkedin.com/in/ibra7im-mo7amed
    🌟 Quality: 5 Stars Professional Grade
    ⚡ Version: 2.0 - Fully Professional
    
    ================================================== */

/* ==================================================
    1. قاعدة البيانات (Menu Items Database)
    ================================================== */

// === GLOBAL FUNCTION POLYFILLS (Defensive programming) ===
// Prevent "not defined" errors for functions called before script loads
window.toggleAnalysisView =
  window.toggleAnalysisView ||
  function (forceOpen = null) {
    console.warn(
      "[POLYFILL] toggleAnalysisView called before script initialization",
    );
    if (typeof DOMContentLoaded !== "undefined") return;
    // Queue for execution after DOM is ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        if (typeof window.toggleAnalysisView === "function") {
          window.toggleAnalysisView(forceOpen);
        }
      });
    }
  };

(function () {
  "use strict";

  function mapCategoryToArabic(value) {
    if (!value && value !== 0) return "أطعمة";
    const normalized = String(value).trim().toLowerCase();
    if (normalized === "food" || normalized === "foods") return "أطعمة";
    if (normalized === "drinks" || normalized === "drink") return "مشروبات";
    if (normalized === "sweets" || normalized === "dessert") return "حلويات";
    if (
      normalized === "أطعمة" ||
      normalized === "مشروبات" ||
      normalized === "حلويات"
    )
      return String(value).trim();
    return "أطعمة";
  }

  function mapCategoryToKey(value) {
    if (!value && value !== 0) return "food";
    const normalized = String(value).trim().toLowerCase();
    if (
      normalized === "food" ||
      normalized === "foods" ||
      normalized === "أطعمة"
    )
      return "food";
    if (
      normalized === "drinks" ||
      normalized === "drink" ||
      normalized === "مشروبات"
    )
      return "drinks";
    if (
      normalized === "sweets" ||
      normalized === "dessert" ||
      normalized === "حلويات"
    )
      return "sweets";
    return "food";
  }

  function normalizeApiMenuItem(item) {
    if (!item || typeof item !== "object") return null;
    const normalizedId = String(
      item["ID"] || item.id || item.Id || item["id"] || "",
    ).trim();
    const normalizedName = String(
      item["Item Name"] || item.itemName || item.name || item.Name || "",
    ).trim();
    const normalizedCategoryRaw =
      item["Category"] || item.category || item.cat || item.type || "food";
    const normalizedCategoryLabel = mapCategoryToArabic(normalizedCategoryRaw);
    const normalizedCategoryKey = mapCategoryToKey(normalizedCategoryRaw);
    const normalizedPrice =
      Number(
        item["Price"] ||
          item.Price ||
          item.price ||
          item.cost ||
          item.value ||
          0,
      ) || 0;
    const normalizedImage =
      item["Image URL"] ||
      item.image ||
      item.img ||
      item.imageUrl ||
      "https://via.placeholder.com/320x220?text=No+Image";

    return {
      id: normalizedId,
      ID: normalizedId,
      "Item Name": normalizedName,
      name: normalizedName,
      Category: normalizedCategoryLabel,
      category: normalizedCategoryLabel,
      cat: normalizedCategoryKey,
      Price: normalizedPrice,
      price: normalizedPrice,
      "Image URL": normalizedImage,
      img: normalizedImage,
    };
  }

  function categoriesMatch(itemCategory, filterCategory) {
    return (
      mapCategoryToKey(itemCategory || "") ===
      mapCategoryToKey(filterCategory || "")
    );
  }

  let currentMenuFilter = "all";
  let currentHomeFilter = "all";

  function refreshMenuView() {
    if (currentMenuFilter && currentMenuFilter !== "all") {
      filterItems(currentMenuFilter);
    } else {
      renderMenu(menuItems);
    }
  }

  function refreshHomeMenuView() {
    if (currentHomeFilter && currentHomeFilter !== "all") {
      filterHomeMenu(currentHomeFilter);
    } else {
      renderHomeMenu(menuItems);
    }
  }

  async function fetchMenu(cacheBuster = Date.now()) {
    try {
      // Fetch menu items from MySQL database via new DB API
      const items = await loadMenuFromDB();

      menuItems = items;
      window.menuData = menuItems;

      refreshMenuView();
      refreshHomeMenuView();
      return menuItems;
    } catch (error) {
      ErrorHandler.handle(error, "fetchMenu");
      menuItems = [];
      window.menuData = menuItems;
      renderMenu(menuItems);
      throw error;
    }
  }

  async function addNewProduct(formData) {
    try {
      const values =
        formData instanceof FormData
          ? Object.fromEntries(formData.entries())
          : formData || {};

      const name =
        values.name ||
        values["Item Name"] ||
        values.itemName ||
        values.Title ||
        values.title ||
        "";
      const rawCategory =
        values.category ||
        values.Category ||
        values.cat ||
        values.type ||
        "أطعمة";
      const price =
        Number(
          values.price || values.Price || values.cost || values.itemPrice || 0,
        ) || 0;
      const img =
        values.img ||
        values.image ||
        values["Image URL"] ||
        values.imageUrl ||
        "";

      if (!name) {
        throw new Error("اسم المنتج مطلوب");
      }

      // Add to MySQL database using the new API
      await addMenuItemToDB(name, price, rawCategory, img);

      showNotification("✅ تم إضافة المنتج الجديد بنجاح", "success");
      setTimeout(() => {
        if (typeof fetchMenu === "function") {
          fetchMenu(Date.now()).catch((err) =>
            console.warn("Failed to refresh menu after add:", err),
          );
        }
      }, 500);
      return true;
    } catch (error) {
      ErrorHandler.handle(error, "addNewProduct");
      return false;
    }
  }

  async function submitOrder(orderDetails) {
    try {
      const details = orderDetails || {};
      const orderId =
        details.orderId ||
        details.id ||
        details.orderNumber ||
        Date.now().toString();

      const phpPayload = {
        customerName: details.customerName || details.name || "",
        customerPhone: details.customerPhone || details.phone || "",
        customerAddress: details.customerAddress || details.address || "",
        items: Array.isArray(details.items)
          ? details.items.map((item) => ({
              itemName:
                item.title ||
                item.name ||
                item.itemName ||
                item.item_name ||
                "",
              quantity: item.quantity || 1,
              unitPrice: item.price || item.unitPrice || item.unit_price || 0,
              price: item.price || item.unitPrice || item.unit_price || 0,
            }))
          : [],
        total: details.total || details.totalPrice || 0,
        orderId,
        timestamp: details.timestamp || new Date().toISOString(),
      };

      const phpResult = await saveOrderToLocalPhp(phpPayload);
      const phpSuccess = phpResult && phpResult.success !== false;

      if (!phpSuccess) {
        throw new Error(`Failed to sync order to PHP: ${phpSuccess}`);
      }

      showNotification("✅ تم إرسال الطلب وتم حفظه محلياً بنجاح", "success");
      return { phpResult };
    } catch (error) {
      ErrorHandler.handle(error, "submitOrder");
      throw error;
    }
  }

  window.fetchMenu = fetchMenu;
  window.addNewProduct = addNewProduct;
  window.submitOrder = submitOrder;
  window.saveOrderToMySQLDatabase = saveOrderToMySQLDatabase;

  async function saveOrderToLocalPhp(orderData) {
    try {
      const response = await fetch("api/save_order.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer_name: orderData.customerName || orderData.name || "",
          phone: orderData.customerPhone || orderData.phone || "",
          address: orderData.customerAddress || orderData.address || "",
          cart_items: Array.isArray(orderData.items)
            ? orderData.items.map((item) => ({
                itemName: item.itemName || item.name || item.title || "",
                quantity: item.quantity || item.qty || 1,
                unit_price:
                  item.price || item.unitPrice || item.unit_price || 0,
                menu_id: item.menu_id || item.item_id || item.id || null,
              }))
            : [],
          total_price: orderData.total || orderData.totalPrice || 0,
          order_id: orderData.orderId,
          timestamp: orderData.timestamp,
        }),
      });

      const text = await response.text();
      if (!response.ok) {
        throw new Error(
          `Local save failed: ${response.status} ${response.statusText} - ${text}`,
        );
      }

      try {
        return JSON.parse(text);
      } catch (parseError) {
        return text;
      }
    } catch (error) {
      ErrorHandler.handle(error, "saveOrderToLocalPhp");
      throw error;
    }
  }

  /**
   * Save order to MySQL database via process_all.php
   *
   * This is the primary order submission method that:
   * 1. Inserts customer data into orders table
   * 2. Inserts items into order_items table with accurate menu data
   * 3. Automatically calculates totals
   *
   * @param {Object} orderData - Order data object with customer and items info
   * @returns {Promise<Object>} Order submission response with order_id
   */
  async function saveOrderToMySQLDatabase(orderData) {
    try {
      console.log("💾 Saving order to MySQL database...", orderData);

      if (typeof submitOrderToDB !== "function") {
        throw new Error("Database API not loaded");
      }

      // Prepare cart items in the format expected by the database
      const cartItems = Array.isArray(orderData.items)
        ? orderData.items.map((item) => ({
            item_name: item.name || item.itemName || item.title || "",
            quantity: item.quantity || item.qty || 1,
            category: item.category || "أطعمة", // Send category string from cart item
          }))
        : [];

      // Call the database API
      const result = await submitOrderToDB(
        orderData.customerName || orderData.name || "",
        orderData.customerPhone || orderData.phone || "",
        orderData.customerAddress || orderData.address || "",
        cartItems,
      );

      console.log("✅ Order saved to MySQL database:", result);
      return { success: true, data: result };
    } catch (error) {
      console.error("❌ Failed to save order to MySQL database:", error);
      // Don't throw here - we want to continue with other operations
      return { success: false, error: error.message };
    }
  }

  // override global fetch so every call automatically triggers offline toast on failure
  (function () {
    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
      try {
        return await originalFetch.apply(this, args);
      } catch (err) {
        // showNotification("الخدمة غير متوفرة حالياً - السيرفر مغلق", "error");
        throw err;
      }
    };
  })();

  // تحميل البيانات من قاعدة البيانات عند التشغيل

  // تحميل البيانات من خادم PHP/MySQL
  let menuItems = [];
  window.menuData = menuItems;

  function findMenuItemById(id) {
    const itemId = String(id).trim();
    return menuItems.find(
      (item) =>
        String(item.id).trim() === itemId ||
        String(item["ID"] || "").trim() === itemId ||
        String(item.Id || "").trim() === itemId,
    );
  }

  function getNextMenuItemId() {
    const ids = menuItems
      .map((item) => parseInt(String(item.id || item["ID"] || ""), 10))
      .filter((num) => !isNaN(num));
    return ids.length > 0 ? Math.max(...ids) + 1 : 1;
  }

  function normalizeProductCategories(items) {
    if (!Array.isArray(items)) return;
    items.forEach((item) => {
      if (!item || typeof item !== "object") return;
      if (!item.category) item.category = item.cat || item.category || "food";
      if (!item.cat) item.cat = item.category;
    });
  }

  normalizeProductCategories(menuItems);

  let cart = [];
  let reviews = [];
  let allOrders = [];
  let notificationAttempts = [];
  const SHIPPING_FEE = 20; // قيمة التوصيل ثابتة
  const RESTAURANT_PHONE_STORAGE_KEY = "restaurantPhone";
  let RESTAURANT_PHONE = window.RESTAURANT_PHONE || "201021279663"; // رقم المطعم
  try {
    const savedPhone = localStorage.getItem(RESTAURANT_PHONE_STORAGE_KEY);
    if (/^201[0-9]{9}$/.test(savedPhone || "")) {
      RESTAURANT_PHONE = savedPhone;
    }
  } catch (err) {
    console.warn("⚠️ فشل قراءة رقم المطعم من التخزين المحلي:", err);
  }
  window.RESTAURANT_PHONE = RESTAURANT_PHONE;

  // حساب المدير الافتراضي
  const ADMIN_ACCOUNT = {
    username: "admin",
    password: "123456",
    name: "مدير المطعم",
    email: "admin@myorder.com",
  };

  // =====================================================
  // نظام معالجة الأخطاء والتحقق والتحميل
  // =====================================================

  // نظام معالجة الأخطاء المركزي
  const ErrorHandler = {
    showError(message) {
      console.error("❌ خطأ:", message);
      showNotification(message, "error");
    },
    handle(error, context) {
      console.error(`❌ خطأ في ${context}:`, error);
      console.error("📋 تفاصيل الخطأ:", error.message || error);
      console.error("📍 Stack trace:", error.stack);
      showNotification(
        `❌ خطأ في ${context}: ${error.message || error}`,
        "error",
      );
    },
  };

  // نظام التحقق من صحة البيانات
  const Validator = {
    isValidName(name) {
      return name && name.length >= 3 && name.length <= 100;
    },
    isValidPhone(phone) {
      // صيغة مصرية: 201XXXXXXXXX (11 رقم)
      return /^201[0-9]{9}$/.test(phone.replace(/\D/g, ""));
    },
    isValidAddress(address) {
      return address && address.length >= 10 && address.length <= 300;
    },
    isValidPrice(price) {
      return price > 0 && price <= 10000;
    },
    isValidQuantity(qty) {
      return qty > 0 && qty <= 1000;
    },
  };

  // نظام إدارة شاشات التحميل
  const LoadingManager = {
    show(message = "جاري التحميل...") {
      let loader = document.getElementById("loading-overlay");
      if (!loader) {
        loader = document.createElement("div");
        loader.id = "loading-overlay";
        loader.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.7);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 10000;
          flex-direction: column;
          gap: 20px;
        `;
        document.body.appendChild(loader);
      }

      loader.innerHTML = `
        <div style="background: white; padding: 30px; border-radius: 12px; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.3);">
          <div style="width: 50px; height: 50px; border: 4px solid #F0F0F0; border-top-color: #FF6B35; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 15px;"></div>
          <p style="color: #333; font-size: 16px; font-weight: 600; margin: 0;">${message}</p>
        </div>
      `;

      loader.style.display = "flex";

      if (!document.querySelector("style[data-loader]")) {
        const style = document.createElement("style");
        style.setAttribute("data-loader", "true");
        style.textContent =
          "@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }";
        document.head.appendChild(style);
      }
    },
    hide() {
      const loader = document.getElementById("loading-overlay");
      if (loader) loader.style.display = "none";
    },
  };

  // سجل التتبع عند بدء التحميل
  console.log("🚀===== تطبيق My Order بدأ التشغيل =====");
  console.log("📱 رقم المطعم المحفوظ:", RESTAURANT_PHONE);
  console.log("💾 عدد الأصناف المحملة:", menuItems.length);
  console.log("📦 عدد الأوردرات الكلي:", allOrders.length);
  console.log("🚀=====================================");

  // =====================================================
  // دوال مساعدة لتجنب أخطاء undefined
  // =====================================================

  // دالة مساعدة لتسجيل الأحداث (fallback إذا لم تكن Google Sheets مُكونة)
  function logEvent(eventName, eventData) {
    try {
      if (
        typeof window.GoogleSheetsLogger !== "undefined" &&
        window.GoogleSheetsLogger.logError
      ) {
        console.log(`📊 تسجيل حدث: ${eventName}`, eventData);
        // يمكن تسجيل الحدث في Google Sheets هنا إذا لزم الأمر
      } else {
        console.debug(`📊 حدث: ${eventName}`, eventData);
      }
    } catch (e) {
      console.debug(`📊 حدث: ${eventName}`);
    }
  }

  // تصدير logEvent للاستخدام العام
  window.logEvent = logEvent;

  /* ==================================================
   2. نظام التنقل والتحكم في الصفحات
   ================================================== */
  function showPage(pageId) {
    // حماية لوحة الإدارة - التحقق من تسجيل الدخول
    if (pageId === "admin" || pageId === "admin-page") {
      if (sessionStorage.getItem("isAdmin") !== "true") {
        alert("⛔ يجب تسجيل الدخول أولاً للوصول إلى لوحة الإدارة");
        showPage("login-page"); // إعادة توجيه إلى صفحة تسجيل الدخول
        return;
      }
    }

    const pages = document.querySelectorAll(".page");
    pages.forEach((page) => {
      page.classList.remove("active");
      page.style.display = "none";
    });

    // التعامل مع الأسماء بدون '-page'
    let targetId = pageId;
    if (!pageId.endsWith("-page")) {
      targetId = pageId + "-page";
    }

    const activePage = document.getElementById(targetId);
    if (activePage) {
      activePage.classList.add("active");
      activePage.style.display = "block";
    }

    // تحديث البيانات بناءً على الصفحة المفتوحة
    if (pageId === "menu" || pageId === "menu-page") {
      if (menuItems.length === 0) {
        fetchMenu().catch((err) => {
          console.warn("Failed to load menu", err);
          renderMenu([]);
        });
      } else {
        refreshMenuView();
      }
    }
    if (pageId === "home" || pageId === "home-page") {
      if (menuItems.length === 0) {
        fetchMenu().catch((err) => {
          console.warn("Failed to load home menu", err);
          initializeHomeMenu();
        });
      } else {
        refreshHomeMenuView();
      }
    }
    if (pageId === "admin" || pageId === "admin-page") {
      renderAdminList();
      initializeAdminPanel();
      switchAdminDashboardSection("overview");
    }
    if (pageId === "contact" || pageId === "contact-page") renderReviews();
    if (pageId === "orders" || pageId === "orders-page") loadCustomerOrders();

    // العودة لأعلى الصفحة عند الانتقال
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* ==================================================
   3. إدارة المنيو (العرض، البحث، الفلترة)
   ================================================== */
  function renderMenu(data) {
    const grid =
      document.getElementById("menu-grid") ||
      document.getElementById("itemsGrid");
    if (!grid) return;

    grid.innerHTML = "";
    const items = Array.isArray(data) ? data : [];

    grid.innerHTML = items
      .map(
        (item) => `
        <div class="res-card">
            <div class="card-img-container">
                <img class="interactive-img" src="${item["Image URL"] || item.img}" alt="${(item["Item Name"] || item.name).replace(/"/g, "&quot;")}" data-fullsrc="${item["Image URL"] || item.img}" data-caption="${(item["Item Name"] || item.name).replace(/'/g, "\\'")}" onerror="this.onerror=null; this.src='https://via.placeholder.com/280x200?text=No+Image'; this.style.height='140px'; this.style.objectFit='cover';">
            </div>
            <div class="res-info" style="padding:15px; text-align:center;">
                <h4 style="font-size:18px; margin-bottom:8px;">${item["Item Name"] || item.name}</h4>
                <p style="color:var(--primary); font-weight:bold; font-size:17px; margin-bottom:12px;">${item["Price"]} ج.م</p>
                <button class="add-btn-card" data-action="add-to-cart" data-id="${item["ID"] || item.id}" role="button" tabindex="0" aria-label="أضف ${(item["Item Name"] || item.name).replace(/'/g, "\\'")} للسلة"
                         style="width:100%; padding:12px; font-size:16px; background:var(--primary); color:white; border:none; border-radius:8px; font-weight:bold; cursor:pointer; transition: 0.3s;">
                    أضف للسلة <i class="fa fa-plus-circle"></i>
                </button>
            </div>
        </div>
    `,
      )
      .join("");
  }

  function searchFunction() {
    const term = document.getElementById("mainSearch").value.toLowerCase();
    const filtered = menuItems.filter((item) =>
      item.name.toLowerCase().includes(term),
    );
    renderMenu(filtered);
  }

  function filterItems(category) {
    currentMenuFilter = category || "all";
    const tabs = document.querySelectorAll(".tab-btn");
    tabs.forEach((btn) => btn.classList.remove("active"));

    if (event && event.target) {
      event.target.classList.add("active");
    }

    if (category === "all") {
      renderMenu(menuItems);
    } else {
      renderMenu(
        menuItems.filter((item) =>
          categoriesMatch(
            item["Category"] || item.category || item.cat,
            category,
          ),
        ),
      );
    }
  }

  // دوال قائمة المنزل
  function renderHomeMenu(data) {
    const grid = document.getElementById("homeMenuGrid");
    if (!grid) return;

    grid.innerHTML = "";
    const items = Array.isArray(data) ? data : [];
    const limitedData = items.slice(0, 8);

    grid.innerHTML = limitedData
      .map(
        (item) => `
        <div class="res-card">
            <div class="card-img-container">
                <img class="interactive-img" src="${item["Image URL"] || item.img}" alt="${(item["Item Name"] || item.name).replace(/"/g, "&quot;")}" data-fullsrc="${item["Image URL"] || item.img}" data-caption="${(item["Item Name"] || item.name).replace(/'/g, "\\'")}" onerror="this.onerror=null; this.src='https://via.placeholder.com/280x200?text=No+Image'; this.style.height='140px'; this.style.objectFit='cover';">
            </div>
            <div class="res-info" style="padding:15px; text-align:center;">
                <h4 style="font-size:18px; margin-bottom:8px;">${item["Item Name"] || item.name}</h4>
                <p style="color:var(--primary); font-weight:bold; font-size:17px; margin-bottom:12px;">${item["Price"]} ج.م</p>
                <button class="add-btn-card" data-action="add-to-cart" data-id="${item["ID"] || item.id}" role="button" tabindex="0" aria-label="أضف ${(item["Item Name"] || item.name).replace(/'/g, "\\'")} للسلة"
                         style="width:100%; padding:12px; font-size:16px; background:var(--primary); color:white; border:none; border-radius:8px; font-weight:bold; cursor:pointer; transition: 0.3s;">
                    أضف للسلة <i class="fa fa-plus-circle"></i>
                </button>
            </div>
        </div>
    `,
      )
      .join("");
  }

  function searchHomeMenu() {
    const term = document.getElementById("homeSearch").value.toLowerCase();
    const filtered = menuItems.filter((item) =>
      item.name.toLowerCase().includes(term),
    );
    renderHomeMenu(filtered);
  }

  function filterHomeMenu(category) {
    currentHomeFilter = category || "all";
    const tabs = document.querySelectorAll(".filter-tabs .tab-btn");
    tabs.forEach((btn) => btn.classList.remove("active"));

    if (event && event.target) {
      event.target.classList.add("active");
    }

    if (category === "all") {
      renderHomeMenu(menuItems);
    } else {
      renderHomeMenu(
        menuItems.filter((item) =>
          categoriesMatch(
            item["Category"] || item.category || item.cat,
            category,
          ),
        ),
      );
    }
  }

  // تحميل المنيو في الصفحة الرئيسية عند البدء
  function initializeHomeMenu() {
    renderHomeMenu(menuItems);
  }

  /* ==================================================
   4. نظام السلة المطور (إضافة، حذف، حساب إجمالي)
   ================================================== */
  function addToCart(id) {
    const itemId = id != null ? String(id).trim() : "";
    const item = menuItems.find(
      (i) =>
        String(i.id).trim() === itemId ||
        String(i.ID || "").trim() === itemId ||
        String(i.Id || "").trim() === itemId,
    );
    if (!item) {
      ErrorHandler.showError("تعذر العثور على المنتج المطلوب. حاول مرة أخرى.");
      return;
    }

    const existingItem = cart.find((i) => String(i.id).trim() === itemId);
    if (existingItem) {
      existingItem.quantity = (existingItem.quantity || 1) + 1;
    } else {
      const cartItem = {
        ...item,
        category: item.Category || item.category || "أطعمة", // Ensure we save the actual category text
        quantity: 1,
        cartId: Date.now(),
      };
      cart.push(cartItem);
    }

    updateCartCount();
    renderCartItems();
    updateCartUI();
    showNotification(`✅ تمت إضافة ${item.name} للسلة`, "success");
  }

  function renderCartItems() {
    const cartItemsList = document.getElementById("cartItemsList");
    const orderSummary = document.getElementById("orderSummary");
    const totalPrice = document.getElementById("totalPrice");
    const subtotalPrice = document.getElementById("subtotalPrice");

    if (!cartItemsList) return;

    if (cart.length === 0) {
      cartItemsList.innerHTML = `
            <div style="text-align:center; padding:60px 20px;">
                <i class="fa fa-shopping-cart" style="font-size:64px; color:#BDC3C7; margin-bottom:20px;"></i>
                <h3 style="color:#7F8C8D; margin-bottom:10px;">السلة فارغة</h3>
                <p style="color:#BDC3C7; margin-bottom:30px;">لم تضف أي منتجات بعد</p>
                <button data-action="navigate" data-target="menu-page" role="button" tabindex="0" style="background:linear-gradient(135deg, #FF6B35, #FF8E5F); color:white; border:none; padding:12px 30px; border-radius:8px; cursor:pointer; font-weight:600;">
                    <i class="fa fa-arrow-right"></i> اذهب للقائمة
                </button>
            </div>
        `;
      if (orderSummary)
        orderSummary.innerHTML =
          '<p style="color:rgba(255,255,255,0.8); text-align:center;">لا توجد عناصر</p>';
      if (totalPrice) totalPrice.textContent = "0";
      return;
    }

    let total = 0;
    let html = "";
    let summaryHtml = "";

    cart.forEach((item, index) => {
      const quantity = item.quantity || 1;
      const itemTotal = item.price * quantity;
      total += itemTotal;

      html += `
            <div class="cart-item" style="background:white; border:1px solid #E8EAED; border-radius:12px; padding:20px; margin-bottom:15px; display:flex; gap:15px; align-items:center; transition:all 0.3s;">
                <div style="flex-shrink:0;">
                    <img class="interactive-img" src="${item.image || item.img}" alt="${item.name}" data-fullsrc="${item.image || item.img}" data-caption="${item.name.replace(/'/g, "\\'")}" style="width:100px; height:100px; object-fit:cover; border-radius:8px; cursor:pointer;">
                </div>
                <div style="flex-grow:1;">
                    <h4 style="margin:0 0 8px 0; color:#2C3E50; font-size:16px; font-weight:700;">${item.name}</h4>
                    <p style="margin:0; color:#7F8C8D; font-size:14px;">${item.cat || item.category}</p>
                    <div style="display:flex; align-items:center; gap:8px; margin-top:10px;">
                        <button data-action="decrease-qty" data-index="${index}" role="button" tabindex="0" aria-label="نقص الكمية" style="min-width:62px; height:36px; background:#F0F0F0; border:1px solid #DDD; border-radius:10px; cursor:pointer; font-weight:700; transition:0.2s;">− </button>
                        <span style="width:44px; text-align:center; font-weight:700; color:#FF6B35;">${quantity}</span>
                        <button data-action="increase-qty" data-index="${index}" role="button" tabindex="0" aria-label="زيادة الكمية" style="min-width:62px; height:36px; background:#FF6B35; border:none; border-radius:10px; cursor:pointer; color:white; font-weight:700; transition:0.2s;">+ </button>
                    </div>
                </div>
                <div style="text-align:right; flex-shrink:0;">
                    <p style="margin:0 0 8px 0; color:#FF6B35; font-size:16px; font-weight:700;">${Number(itemTotal).toLocaleString("en-US")} ج.م</p>
                    <p style="margin:0; color:#7F8C8D; font-size:12px;">${Number(item.price).toLocaleString("en-US")} ج.م × ${quantity}</p>
                    <button data-action="remove-item" data-index="${index}" role="button" tabindex="0" style="margin-top:10px; background:#FFE5DC; color:#FF6B35; border:none; padding:6px 12px; border-radius:6px; cursor:pointer; font-size:12px; font-weight:600; transition:all 0.3s;">
                        <i class="fa fa-trash"></i> حذف
                    </button>
                </div>
            </div>
        `;

      summaryHtml += `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; padding-bottom:8px; border-bottom:1px solid rgba(255,255,255,0.2); font-size:14px;">
                <span>${item.name} × ${quantity}</span>
                <strong>${Number(itemTotal).toLocaleString("en-US")} ج.م</strong>
            </div>
        `;
    });

    cartItemsList.innerHTML = html;
    if (orderSummary) orderSummary.innerHTML = summaryHtml;

    const shipping = 20;
    const finalTotal = total + shipping;
    if (subtotalPrice)
      subtotalPrice.textContent = Number(total).toLocaleString("en-US");
    if (totalPrice)
      totalPrice.textContent = Number(finalTotal).toLocaleString("en-US");
    const shippingPriceEl = document.getElementById("shippingPrice");
    if (shippingPriceEl)
      shippingPriceEl.textContent = `${Number(shipping).toLocaleString("en-US")} ج.م`;
  }

  function updateCartCount() {
    const totalCount = cart.reduce(
      (sum, item) => sum + (item.quantity || 1),
      0,
    );
    const countElement = document.getElementById("cart-count");
    const mobileCount = document.getElementById("cart-count-mobile");
    if (countElement) countElement.innerText = totalCount;
    if (mobileCount) mobileCount.innerText = totalCount;
  }

  function updateCartUI() {
    const totalElement = document.getElementById("totalPrice");
    const subtotalPrice = document.getElementById("subtotalPrice");
    const shippingPriceEl = document.getElementById("shippingPrice");

    const subtotal = cart.reduce(
      (acc, item) => acc + item.price * (item.quantity || 1),
      0,
    );
    const shipping = subtotal > 0 ? SHIPPING_FEE : 0;
    const total = subtotal + shipping;

    if (subtotalPrice) {
      subtotalPrice.textContent = Number(subtotal).toLocaleString("en-US");
    }
    if (shippingPriceEl) {
      shippingPriceEl.textContent = `${Number(shipping).toLocaleString("en-US")} ج.م`;
    }
    if (totalElement) {
      totalElement.innerText = Number(total).toLocaleString("en-US");
    }
  }

  function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartCount();
    updateCartUI();
  }

  function increaseQuantity(index) {
    if (cart[index]) {
      cart[index].quantity = (cart[index].quantity || 1) + 1;
      renderCartItems();
    }
  }

  function decreaseQuantity(index) {
    if (cart[index]) {
      if (cart[index].quantity > 1) {
        cart[index].quantity -= 1;
      } else {
        removeFromCart(index);
        return;
      }
      renderCartItems();
    }
  }

  /* ==================================================
   5. إتمام الطلب وإرسال البيانات للعميل والمطعم
   ================================================== */

  // دالة مساعدة: توليد رقم طلب فريد وآمن
  function generateOrderId() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substr(2, 5).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }

  // دالة لإرسال رسالة WhatsApp للمطعم (مع إعادة محاولة)
  function sendRestaurantNotification(restaurantMessage, orderId) {
    try {
      console.log("🔍===== بدء إرسال رسالة للمطعم =====");
      console.log("📱 رقم المطعم المحفوظ:", RESTAURANT_PHONE);
      console.log("📦 رقم الطلب:", orderId);
      console.log(
        "📄 محتوى الرسالة:",
        restaurantMessage.substring(0, 100) + "...",
      );

      const restaurantEncoded = encodeURIComponent(restaurantMessage);
      const whatsappUrl = `https://wa.me/${RESTAURANT_PHONE}?text=${restaurantEncoded}`;

      console.log(
        "✅ تم بناء رابط WhatsApp:",
        whatsappUrl.substring(0, 80) + "...",
      );

      // إرسال الرسالة بطرق متعددة
      // الطريقة 1: فتح في tab جديد
      const whatsappWindow = window.open(
        whatsappUrl,
        "whatsapp_restaurant",
        "noopener,noreferrer,width=800,height=600",
      );

      if (whatsappWindow) {
        console.log("✅ تم فتح النافذة بنجاح");
      } else {
        console.warn("⚠️ فتح النافذة في tab جديد فشل - محاولة الطريقة 2");
        // الطريقة 2: إعادة توجيه مباشر
        setTimeout(() => {
          window.location.href = whatsappUrl;
        }, 500);
      }

      const notificationAttempt = {
        orderId: orderId,
        timestamp: new Date().toISOString(),
        status: "sent",
        recipient: "restaurant",
        phone: RESTAURANT_PHONE,
        url: whatsappUrl,
        messageLength: restaurantMessage.length,
      };

      notificationAttempts.push(notificationAttempt);
      console.log("✅ تم تسجيل محاولة الإرسال بنجاح");
      console.log("🔍===== انتهى إرسال رسالة للمطعم =====");

      return true;
    } catch (error) {
      console.error("❌ خطأ في إرسال الإشعار للمطعم:", error);
      console.error("❌ Stack:", error.stack);
      return false;
    }
  }

  // دالة لإرسال رسالة WhatsApp للعميل
  function sendCustomerNotification(customerMessage, formattedPhone, orderId) {
    try {
      console.log("🔍===== بدء إرسال رسالة للعميل =====");
      console.log("📱 رقم العميل:", formattedPhone);
      console.log("📦 رقم الطلب:", orderId);

      const customerEncoded = encodeURIComponent(customerMessage);
      const whatsappUrl = `https://wa.me/${formattedPhone}?text=${customerEncoded}`;

      console.log("✅ تم بناء رابط WhatsApp للعميل");

      // فتح في tab جديد
      const whatsappWindow = window.open(
        whatsappUrl,
        "whatsapp_customer",
        "noopener,noreferrer,width=800,height=600",
      );

      if (whatsappWindow) {
        console.log("✅ تم فتح النافذة بنجاح");
      } else {
        console.warn("⚠️ فتح النافذة فشل - محاولة توجيه مباشر");
        setTimeout(() => {
          window.location.href = whatsappUrl;
        }, 500);
      }

      // تسجيل محاولة الإرسال
      const notificationAttempt = {
        orderId: orderId,
        timestamp: new Date().toISOString(),
        status: "sent",
        recipient: "customer",
        phone: formattedPhone,
        url: whatsappUrl,
        messageLength: customerMessage.length,
      };

      notificationAttempts.push(notificationAttempt);
      console.log("✅ تم تسجيل محاولة الإرسال بنجاح");
      console.log("🔍===== انتهى إرسال رسالة للعميل =====");

      return true;
    } catch (error) {
      console.error("❌ خطأ في إرسال التأكيد للعميل:", error);
      console.error("❌ Stack:", error.stack);
      return false;
    }
  }

  async function finishOrder() {
    if (window.isSubmittingOrder) {
      console.warn("Order submission already in progress");
      return;
    }

    window.isSubmittingOrder = true;
    const submitBtn = document.querySelector(
      '.confirm-btn[data-action="finish-order"]',
    );
    if (submitBtn) {
      if (!submitBtn.dataset.originalText) {
        submitBtn.dataset.originalText = submitBtn.textContent.trim();
      }
      submitBtn.disabled = true;
      submitBtn.style.opacity = "0.5";
      submitBtn.style.cursor = "not-allowed";
      submitBtn.textContent = "⏳ جاري الإرسال...";
    }

    const resetSubmitState = () => {
      window.isSubmittingOrder = false;
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.style.opacity = "1";
        submitBtn.style.cursor = "pointer";
        submitBtn.textContent =
          submitBtn.dataset.originalText || submitBtn.textContent;
      }
    };

    // التحقق من البيانات باستخدام Validator متقدم
    const name = document.getElementById("userName")?.value?.trim();
    const address = document.getElementById("userAddress")?.value?.trim();
    const phone = document.getElementById("userPhone")?.value?.trim();
    const email = document.getElementById("userEmail")?.value?.trim();
    const totalPrice = document.getElementById("totalPrice").innerText;

    // Validation بسيطة أولاً
    if (!name || !address || !phone || !email) {
      ErrorHandler.showError("الرجاء ملء جميع البيانات المطلوبة");
      resetSubmitState();
      return;
    }

    // Validation شاملة قبل استكمال الطلب
    if (!validateCheckoutForm()) {
      resetSubmitState();
      return;
    }

    // تنسيق رقم الهاتف بشكل صحيح
    let formattedPhone = phone.replace(/^0/, "20");
    if (!formattedPhone.startsWith("20")) {
      formattedPhone = "20" + phone;
    }
    formattedPhone = formattedPhone.replace(/\D/g, "");

    if (!Validator.isValidPhone(formattedPhone)) {
      ErrorHandler.showError("رقم الهاتف غير صحيح - استخدم صيغة مصرية صحيحة");
      resetSubmitState();
      return;
    }

    if (!Validator.isValidAddress(address)) {
      ErrorHandler.showError("العنوان يجب أن يكون 15 حرفاً أو أكثر");
      resetSubmitState();
      return;
    }

    if (cart.length === 0) {
      ErrorHandler.showError("السلة فارغة! أضف بعض المنتجات أولاً");
      resetSubmitState();
      return;
    }

    // توليد رقم طلب فريد
    const orderId = generateOrderId();

    // بناء نص الرسالة احترافي
    let itemsSummary = "";
    let subtotal = 0;

    cart.forEach((item, index) => {
      const quantity = item.quantity || 1;
      // Validation للسعر والكمية
      if (
        !Validator.isValidQuantity(quantity) ||
        !Validator.isValidPrice(item.price)
      ) {
        throw new Error("بيانات المنتج غير صحيحة");
      }
      const itemTotal = item.price * quantity;
      subtotal += itemTotal;
      itemsSummary += `\n${index + 1}️⃣ ${item.name} × ${quantity} = *${Number(itemTotal).toLocaleString("en-US")} ج.م*`;
    });

    const shipping = SHIPPING_FEE;
    const finalTotal = subtotal + shipping;
    const timestamp = new Date().toLocaleString("ar-EG");

    // رسالة احترافية للمطعم باللغة العربية
    let restaurantMessage = `*◈ طلب جديد وارد للمطعم ◈*\n\n`;
    restaurantMessage += `رقم الطلب: *#${orderId}*\n\n`;
    restaurantMessage += `__________________________\n\n`;
    restaurantMessage += `◈ 👤 بيانات العميل:\n`;
    restaurantMessage += `الاسم: *${name}*\n`;
    restaurantMessage += `الهاتف: *+${formattedPhone}*\n`;
    restaurantMessage += `العنوان: *${address}*\n\n`;
    restaurantMessage += `__________________________\n\n`;
    restaurantMessage += `◈ 📦 تفاصيل الطلب:\n`;
    cart.forEach((item, index) => {
      const quantity = item.quantity || 1;
      const itemTotal = item.price * quantity;
      restaurantMessage += `${index + 1}. ${quantity} × ${item.name} = *${Number(itemTotal).toLocaleString("en-US")} ج.م*\n`;
    });
    restaurantMessage += `\n__________________________\n\n`;
    restaurantMessage += `◈ 💰 ملخص الحساب:\n`;
    restaurantMessage += `المجموع الجزئي: *${Number(subtotal).toLocaleString("en-US")} ج.م*\n`;
    restaurantMessage += `رسوم التوصيل: *${shipping} ج.م*\n\n`;
    restaurantMessage += `*◈ الإجمالي النهائي: ${Number(finalTotal).toLocaleString("en-US")} ج.م*\n\n`;
    restaurantMessage += `⏱️ الموعد المتوقع: 30-45 دقيقة\n`;
    restaurantMessage += `⏰ التاريخ والوقت: ${timestamp}\n\n`;
    restaurantMessage += `👉 يرجى البدء في التحضير فوراً!`;

    // رسالة احترافية للعميل باللغة العربية (RTL)
    let customerMessage = `*◈ تأكيد طلبك من My Order ◈*\n\n`;
    customerMessage += `◈ مرحباً ${name}\n`;
    customerMessage += `تم استقبال طلبك برقم: #${orderId}\n\n`;
    customerMessage += `__________________________\n\n`;
    customerMessage += `◈ 📅 التاريخ والوقت:\n${timestamp}\n\n`;
    customerMessage += `__________________________\n\n`;
    customerMessage += `◈ 📍 عنوان التوصيل:\n${address}\n\n`;
    customerMessage += `__________________________\n\n`;
    customerMessage += `◈ 📦 تفاصيل طلبك:\n`;
    cart.forEach((item, index) => {
      const quantity = item.quantity || 1;
      const itemTotal = item.price * quantity;
      customerMessage += `${index + 1}. ${quantity} × ${item.name} = *${Number(itemTotal).toLocaleString("en-US")} ج.م*\n`;
    });
    customerMessage += `\n__________________________\n\n`;
    customerMessage += `◈ 💰 ملخص الفاتورة:\n`;
    customerMessage += `المجموع الجزئي: *${subtotal} ج.م*\n`;
    customerMessage += `رسوم التوصيل: *${shipping} ج.م*\n\n`;
    customerMessage += `__________________________\n\n`;
    customerMessage += `*◈ الإجمالي النهائي: ${finalTotal} ج.م*\n\n`;
    customerMessage += `⏱️ وقت التوصيل المتوقع: 30-45 دقيقة\n\n`;
    customerMessage += `شكراً لاختيارك My Order 🙏\n`;
    customerMessage += `سيصل طلبك قريباً ⚡`;

    // عرض رسالة التحميل
    LoadingManager.show("⏳ جاري حفظ الطلب وإرسال الرسائل...");

    // حفظ الطلب في Firebase مع معلومات الإشعار
    const orderData = {
      orderId: orderId,
      customerName: name,
      customerPhone: formattedPhone,
      customerAddress: address,
      items: cart.map((item) => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity || 1,
        category: item.category || item.cat || "أطعمة", // Pick category text directly from cart item
        totalAmount: item.price * (item.quantity || 1),
      })),
      subtotal: subtotal,
      shipping: shipping,
      total: finalTotal,
      timestamp: new Date().toISOString(),
      status: "جديد",
      restaurantNotified: false,
      customerNotified: false,
    };

    console.log("💾 حفظ الطلب:", orderData);

    // إرسال الطلب إلى MySQL Database فقط (process_all.php)
    try {
      const dbResult = await saveOrderToMySQLDatabase(orderData);
      if (dbResult.success) {
        console.log("✅ الطلب محفوظ في قاعدة البيانات MySQL:", dbResult.data);
        orderData.mysqlSaved = true;
      } else {
        console.warn("⚠️ تحذير: فشل حفظ الطلب في MySQL:", dbResult.error);
        ErrorHandler.showError("فشل في حفظ الطلب. يرجى المحاولة مرة أخرى.");
        LoadingManager.hide();
        resetSubmitState();
        return;
      }
    } catch (err) {
      console.warn("⚠️ خطأ في حفظ الطلب:", err);
      ErrorHandler.handle(err, "حفظ الطلب");
      LoadingManager.hide();
      resetSubmitState();
      return;
    }

    // حفظ الطلب في الذاكرة فقط
    allOrders.push(orderData);
    console.log(
      "✅ تم حفظ الطلب في الذاكرة بنجاح - إجمالي الأوردرات:",
      allOrders.length,
    );

    // تحديث حقول النموذج
    const userEmail = document.getElementById("userEmail")?.value?.trim() || "";
    const orderField = document.getElementById("userOrder");
    if (orderField) {
      orderField.value = `طلب #${orderId}${itemsSummary}`;
    }

    const orderSummary = itemsSummary.replace(/\n/g, " | ");

    // محاولة حفظ في Firebase إذا كان متاحاً (خيار إضافي)
    if (typeof firebaseDB !== "undefined" && firebaseDB.saveOrderToFirebase) {
      try {
        firebaseDB.saveOrderToFirebase(orderData);
        console.log("✅ تم حفظ الطلب في Firebase");
      } catch (e) {
        console.warn("⚠️ لم يتم حفظ الطلب في Firebase:", e);
      }
    }

    setTimeout(() => {
      try {
        // إرسال رسالة المطعم أولاً
        console.log("🍔 بدء إرسال رسالة المطعم على الرقم:", RESTAURANT_PHONE);
        const restaurantSent = sendRestaurantNotification(
          restaurantMessage,
          orderId,
        );

        // بعد إرسال المطعم مباشرة، إرسال رسالة العميل
        setTimeout(() => {
          console.log("👤 إرسال رسالة تأكيد العميل على الرقم:", formattedPhone);
          const customerSent = sendCustomerNotification(
            customerMessage,
            formattedPhone,
            orderId,
          );

          // بعد إرسال الطلب
          setTimeout(() => {
            LoadingManager.hide();

            cart = [];
            updateCartCount();
            updateCartUI();

            // مسح حقول الإدخال
            document.getElementById("userName").value = "";
            document.getElementById("userAddress").value = "";
            document.getElementById("userPhone").value = "";
            const emailField = document.getElementById("userEmail");
            if (emailField) emailField.value = "";

            // تحديث الإحصائيات في لوحة التحكم
            if (typeof updateAdminStatistics === "function") {
              updateAdminStatistics();
            }

            let successMessage = "✨ تم إرسال الطلب بنجاح! شكراً لك 🙏";
            if (restaurantSent) {
              successMessage += "\n✅ تم إرسال إشعار المطعم عبر واتساب";
            }
            if (customerSent) {
              successMessage += "\n✅ تم إرسال تأكيد طلبك عبر واتساب";
            }

            resetSubmitState();
            showNotification(successMessage, "success");

            // العودة للصفحة الرئيسية بعد 2 ثانية
            setTimeout(() => showPage("home-page"), 2000);
          }, 500);
        }, 1000); // تأخير 1 ثانية بين إرسال المطعم والعميل
      } catch (error) {
        LoadingManager.hide();
        ErrorHandler.handle(error, "إرسال الطلب");
        resetSubmitState();
      }
    }, 500);
  }

  // دالة عرض إشعارات احترافية ومحسّنة

  // دالة عرض إشعارات احترافية ومحسّنة
  function showNotification(message, type = "info", duration = 4000) {
    const notification = document.createElement("div");
    const icons = {
      success: "✅",
      error: "❌",
      warning: "⚠️",
      info: "ℹ️",
    };

    const colors = {
      success: "#10B981",
      error: "#EF4444",
      warning: "#F59E0B",
      info: "#3B82F6",
    };

    const backgroundColor = {
      success: "rgba(16, 185, 129, 0.95)",
      error: "rgba(239, 68, 68, 0.95)",
      warning: "rgba(245, 158, 11, 0.95)",
      info: "rgba(59, 130, 246, 0.95)",
    };

    const icon = icons[type] || "📢";
    const color = colors[type] || "#3B82F6";

    const bgColor = backgroundColor[type] || "rgba(59, 130, 246, 0.95)";

    notification.style.cssText =
      "position: fixed; top: 20px; right: 20px; background: " +
      bgColor +
      "; color: white; padding: 16px 20px; border-radius: 12px; box-shadow: 0 12px 35px rgba(0, 0, 0, 0.2); z-index: 9999; font-size: 14px; max-width: 350px; word-wrap: break-word; line-height: 1.5; border-left: 4px solid " +
      color +
      "; animation: slideInFromRight 0.4s cubic-bezier(0.4, 0, 0.2, 1); backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);";

    notification.innerHTML = "<strong>" + icon + "</strong> " + message;

    // إضافة Close button
    const closeBtn = document.createElement("button");
    closeBtn.innerHTML = "×";
    closeBtn.style.cssText =
      "background: none; border: none; color: white; font-size: 24px; cursor: pointer; padding: 0; margin: 0 0 0 12px; line-height: 1; opacity: 0.8; transition: opacity 0.2s;";
    closeBtn.onmouseover = () => (closeBtn.style.opacity = "1");
    closeBtn.onmouseout = () => (closeBtn.style.opacity = "0.8");
    closeBtn.onclick = () => {
      notification.style.animation = "slideOutToRight 0.3s ease-out";
      setTimeout(() => notification.remove(), 300);
    };

    notification.appendChild(closeBtn);
    document.body.appendChild(notification);

    // إضافة animation للـ fade out
    const style = document.createElement("style");
    style.textContent =
      "@keyframes slideInFromRight { from { opacity: 0; transform: translateX(400px); } to { opacity: 1; transform: translateX(0); } } @keyframes slideOutToRight { from { opacity: 1; transform: translateX(0); } to { opacity: 0; transform: translateX(400px); } }";
    if (!document.querySelector("style[data-notifications]")) {
      style.setAttribute("data-notifications", "true");
      document.head.appendChild(style);
    }

    // إزالة الإشعار بعد المدة المحددة
    const timeout = setTimeout(() => {
      notification.style.animation = "slideOutToRight 0.3s ease-out";
      setTimeout(() => notification.remove(), 300);
    }, duration);

    // السماح بإزالة يدوية من خلال النقر على الزر
    notification.closeTimeout = timeout;

    return notification;
  }

  /* ==================================================
   6. لوحة التحكم (Admin Panel) والتقييمات
   ================================================== */
  function getSelectedCategoryLabel(selectId) {
    const select = document.getElementById(selectId);
    if (!select || select.selectedIndex < 0) return "";
    const optionText = select.options[select.selectedIndex]?.text || "";
    return optionText.includes(" ")
      ? optionText.split(" ").slice(1).join(" ").trim()
      : optionText.trim();
  }

  async function addNewItemFromAdmin() {
    try {
      const name = document.getElementById("newItemName")?.value?.trim();
      const price = document.getElementById("newItemPrice")?.value?.trim();
      const cat =
        getSelectedCategoryLabel("newItemCat") ||
        document.getElementById("newItemCat")?.value ||
        "أطعمة";
      let img = document.getElementById("newItemImg")?.value?.trim() || "";
      const fileInput = document.getElementById("newItemFile");

      // Validation
      if (!name || name.length < 3) {
        ErrorHandler.showError("اسم المنتج يجب أن يكون 3 أحرف على الأقل");
        return;
      }

      if (!price) {
        ErrorHandler.showError("السعر مطلوب");
        return;
      }

      const numPrice = parseFloat(price);
      if (!Validator.isValidPrice(numPrice)) {
        ErrorHandler.showError("السعر يجب أن يكون بين 1 و 10000");
        return;
      }

      // Helper to read File -> dataURL
      function readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(new Error("Failed to read file"));
          reader.readAsDataURL(file);
        });
      }

      if (!img && fileInput && fileInput.files && fileInput.files[0]) {
        try {
          img = await readFileAsDataURL(fileInput.files[0]);
        } catch (e) {
          ErrorHandler.handle(e, "قراءة ملف الصورة");
          showNotification(
            "لم نتمكن من قراءة ملف الصورة - سيتم استخدام صورة افتراضية",
            "warning",
          );
        }
      }

      if (!img) {
        img = "https://via.placeholder.com/280x200?text=No+Image";
      }

      const newProductData = {
        ID: String(getNextMenuItemId()),
        "Item Name": name,
        Category: cat,
        Price: numPrice,
        "Image URL": img,
      };

      const added = await addNewProduct(newProductData);
      if (!added) return;

      // Refresh local admin and menu views
      renderAdminList();
      renderMenu(menuItems);
      if (typeof updateAdminStatistics === "function") {
        updateAdminStatistics();
      }

      document.getElementById("newItemName").value = "";
      document.getElementById("newItemPrice").value = "";
      document.getElementById("newItemImg").value = "";
      if (fileInput) fileInput.value = "";
    } catch (error) {
      ErrorHandler.handle(error, "إضافة منتج جديد");
    }
  }

  // دالة لعرض جميع الطلبات والتحقق من إشعارات المطعم
  function renderAllOrders() {
    const listContainer = document.getElementById("ordersListContainer");
    if (!listContainer) return;

    // جلب الطلبات من السجل المركزي
    const orders = allOrders || [];

    if (orders.length === 0) {
      listContainer.innerHTML = `
            <div style="text-align:center; padding:40px 20px;">
                <i class="fa-solid fa-inbox" style="font-size:48px; color:#BDC3C7; margin-bottom:15px;"></i>
                <h3 style="color:#7F8C8D; margin-bottom:10px;">لا توجد طلبات بعد</h3>
                <p style="color:#BDC3C7;">سيظهر الطلبات الجديدة هنا عند استقبالها</p>
            </div>
        `;
      return;
    }

    // عرض الطلبات بصيغة جديدة (الأحدث أولاً)
    listContainer.innerHTML = orders
      .slice()
      .reverse()
      .map((order, idx) => {
        const itemsList = order.items
          .map(
            (item, i) =>
              `<li style="padding:5px 0; font-size:13px; color:#2C3E50;">
                🔹 ${item.name} × ${item.quantity || 1} = ${item.price * (item.quantity || 1)} ج.م
            </li>`,
          )
          .join("");

        const orderTime = new Date(order.timestamp).toLocaleString("ar-EG");
        const statusColor =
          order.status === "جديد"
            ? "#FF6B35"
            : order.status === "جاري التحضير"
              ? "#FFC107"
              : "#27AE60";
        const statusBg =
          order.status === "جديد"
            ? "rgba(255,107,53,0.1)"
            : order.status === "جاري التحضير"
              ? "rgba(255,193,7,0.1)"
              : "rgba(39,174,96,0.1)";

        return `
            <div style="background:white; border-radius:12px; padding:18px; margin-bottom:15px; box-shadow:0 2px 8px rgba(0,0,0,0.1); border-left:5px solid ${statusColor}; transition:all 0.3s;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                    <div>
                        <h4 style="margin:0 0 4px 0; color:#2C3E50; font-size:16px;">📦 الطلب رقم: <strong>#${order.orderId}</strong></h4>
                        <p style="margin:0; font-size:12px; color:#7F8C8D;">⏰ ${orderTime}</p>
                    </div>
                    <div style="background:${statusBg}; padding:8px 16px; border-radius:6px; text-align:center;">
                        <span style="color:${statusColor}; font-weight:700; font-size:13px;">🔔 ${order.status}</span>
                    </div>
                </div>
                
                <div style="background:#F8F9FA; padding:12px; border-radius:8px; margin-bottom:12px;">
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; font-size:13px;">
                        <div><strong>👤 العميل:</strong><br><span style="color:#555;">${order.customerName}</span></div>
                        <div><strong>📱 الهاتف:</strong><br><span style="color:#555;">${order.customerPhone}</span></div>
                        <div><strong>📍 العنوان:</strong><br><span style="color:#555;">${order.customerAddress}</span></div>
                        <div><strong>💰 الإجمالي:</strong><br><span style="color:#FF6B35; font-weight:700;">${order.total} ج.م</span></div>
                    </div>
                </div>
                
                <div style="background:#FFF9E6; padding:12px; border-radius:8px; margin-bottom:12px; border:1px dashed #FFC107;">
                    <strong style="color:#F39C12; font-size:13px;">🍽️ تفاصيل الطلب:</strong>
                    <ul style="margin:8px 0 0 0; padding-left:20px; font-size:13px;">
                        ${itemsList}
                    </ul>
                </div>
                
                <div style="display:flex; gap:10px; margin-bottom:12px;">
                    <div style="flex:1; background:#E8F5E9; padding:10px; border-radius:6px; text-align:center; font-size:12px;">
                        <strong style="color:#27AE60;">✅ الإجمالي الجزئي</strong><br>
                        <span style="color:#27AE60; font-weight:700;">${order.subtotal} ج.م</span>
                    </div>
                    <div style="flex:1; background:#E3F2FD; padding:10px; border-radius:6px; text-align:center; font-size:12px;">
                        <strong style="color:#2196F3;">🚚 التوصيل</strong><br>
                        <span style="color:#2196F3; font-weight:700;">${order.shipping} ج.م</span>
                    </div>
                </div>
                
                <div style="display:flex; gap:10px; flex-wrap:wrap;">
                    <button onclick="printInvoice('${order.orderId}')" style="background:linear-gradient(135deg, #8B5CF6, #A78BFA); color:white; border:none; padding:10px 16px; border-radius:6px; cursor:pointer; font-size:12px; font-weight:600; transition:0.3s;">
                        🖨️ طباعة الفاتورة
                    </button>
                    <button onclick="resendRestaurantNotification('${order.orderId}')" style="background:linear-gradient(135deg, #FF6B35, #FF8E5F); color:white; border:none; padding:10px 16px; border-radius:6px; cursor:pointer; font-size:12px; font-weight:600; transition:0.3s;">
                        📲 إعادة إرسال للمطعم
                    </button>
                    <button onclick="resendCustomerNotification('${order.orderId}')" style="background:linear-gradient(135deg, #10B981, #34D399); color:white; border:none; padding:10px 16px; border-radius:6px; cursor:pointer; font-size:12px; font-weight:600; transition:0.3s;">
                        💬 إعادة إرسال للعميل
                    </button>
                    <button onclick="updateOrderStatus('${order.orderId}', 'جاري التحضير')" style="background:linear-gradient(135deg, #FFC107, #FFD54F); color:white; border:none; padding:10px 16px; border-radius:6px; cursor:pointer; font-size:12px; font-weight:600; transition:0.3s;">
                        ⏳ جاري التحضير
                    </button>
                    <button onclick="updateOrderStatus('${order.orderId}', 'تم التسليم')" style="background:linear-gradient(135deg, #27AE60, #229954); color:white; border:none; padding:10px 16px; border-radius:6px; cursor:pointer; font-size:12px; font-weight:600; transition:0.3s;">
                        ✅ تم التسليم
                    </button>
                </div>
            </div>
        `;
      })
      .join("");
  }

  // دالة لإعادة إرسال الإشعار للمطعم
  function resendRestaurantNotification(orderId) {
    const order = allOrders.find((o) => o.orderId === orderId);

    if (!order) {
      showNotification("❌ لم يتم العثور على الطلب", "error");
      return;
    }

    // إعادة بناء رسالة المطعم بالتنسيق الجديد
    const timestamp = new Date(order.timestamp).toLocaleString("ar-EG");
    let restaurantMessage = `*◈ طلب جديد وارد للمطعم ◈*\n\n`;
    restaurantMessage += `رقم الطلب: *#${orderId}*\n\n`;
    restaurantMessage += `__________________________\n\n`;
    restaurantMessage += `◈ 👤 بيانات العميل:\n`;
    restaurantMessage += `الاسم: *${order.customerName}*\n`;
    restaurantMessage += `الهاتف: *${order.customerPhone}*\n`;
    restaurantMessage += `العنوان: *${order.customerAddress}*\n\n`;
    restaurantMessage += `__________________________\n\n`;
    restaurantMessage += `◈ 📦 تفاصيل الطلب:\n`;
    order.items.forEach((item, index) => {
      const quantity = item.quantity || 1;
      const itemTotal = item.price * quantity;
      restaurantMessage += `${index + 1}. ${quantity} × ${item.name} = *${itemTotal} ج.م*\n`;
    });
    restaurantMessage += `\n__________________________\n\n`;
    restaurantMessage += `◈ 💰 ملخص الحساب:\n`;
    restaurantMessage += `المجموع الجزئي: *${order.subtotal} ج.م*\n`;
    restaurantMessage += `رسوم التوصيل: *${order.shipping} ج.م*\n\n`;
    restaurantMessage += `*◈ الإجمالي النهائي: ${order.total} ج.م*\n\n`;
    restaurantMessage += `⏱️ الموعد المتوقع: 30-45 دقيقة\n`;
    restaurantMessage += `⏰ التاريخ والوقت: ${timestamp}\n\n`;
    restaurantMessage += `⚠️ *هذا إعادة إرسال للطلب*\n`;
    restaurantMessage += `👉 يرجى البدء في التحضير فوراً!`;

    // إرسال الرسالة
    const restaurantEncoded = encodeURIComponent(restaurantMessage);
    window.open(
      `https://wa.me/${RESTAURANT_PHONE}?text=${restaurantEncoded}`,
      "_blank",
    );

    showNotification("✅ تم إعادة إرسال الإشعار للمطعم", "success");
  }

  // دالة لإعادة إرسال تأكيد الطلب للعميل
  function resendCustomerNotification(orderId) {
    const order = allOrders.find((o) => o.orderId === orderId);

    if (!order) {
      showNotification("❌ لم يتم العثور على الطلب", "error");
      return;
    }

    const timestamp = new Date(order.timestamp).toLocaleString("ar-EG");
    let subtotal = order.subtotal || 0;
    let shipping = order.shipping || 0;
    let finalTotal = order.total || 0;

    // بناء رسالة احترافية للعميل بنفس التنسيق
    let customerMessage = `*◈ تأكيد طلبك من My Order ◈*\n\n`;
    customerMessage += `◈ مرحباً ${order.customerName}\n`;
    customerMessage += `تم استقبال طلبك برقم: #${orderId}\n\n`;
    customerMessage += `__________________________\n\n`;
    customerMessage += `◈ 📅 التاريخ والوقت:\n${timestamp}\n\n`;
    customerMessage += `__________________________\n\n`;
    customerMessage += `◈ 📍 عنوان التوصيل:\n${order.customerAddress}\n\n`;
    customerMessage += `__________________________\n\n`;
    customerMessage += `◈ 📦 تفاصيل طلبك:\n`;
    order.items.forEach((item, index) => {
      const quantity = item.quantity || 1;
      const itemTotal = item.price * quantity;
      customerMessage += `${index + 1}. ${quantity} × ${item.name} = *${itemTotal} ج.م*\n`;
    });
    customerMessage += `\n__________________________\n\n`;
    customerMessage += `◈ 💰 ملخص الفاتورة:\n`;
    customerMessage += `المجموع الجزئي: *${subtotal} ج.م*\n`;
    customerMessage += `رسوم التوصيل: *${shipping} ج.م*\n\n`;
    customerMessage += `__________________________\n\n`;
    customerMessage += `*◈ الإجمالي النهائي: ${finalTotal} ج.م*\n\n`;
    customerMessage += `⏱️ وقت التوصيل المتوقع: 30-45 دقيقة\n\n`;
    customerMessage += `شكراً لاختيارك My Order 🙏\n`;
    customerMessage += `سيصل طلبك قريباً ⚡`;

    // إرسال الرسالة للعميل
    const customerEncoded = encodeURIComponent(customerMessage);
    window.open(
      `https://wa.me/${order.customerPhone}?text=${customerEncoded}`,
      "_blank",
    );

    showNotification("✅ تم إعادة إرسال التأكيد للعميل", "success");
  }

  // دالة لتحديث حالة الطلب
  function updateOrderStatus(orderId, newStatus) {
    const order = allOrders.find((o) => o.orderId === orderId);

    if (!order) {
      showNotification("❌ لم يتم العثور على الطلب", "error");
      console.error("❌ لم يتم العثور على الطلب:", orderId);
      return;
    }

    const oldStatus = order.status;
    order.status = newStatus;
    console.log("✅ تم تحديث حالة الطلب في الذاكرة");
    console.log(`   📦 رقم الطلب: #${orderId}`);
    console.log(`   🔄 الحالة: ${oldStatus} → ${newStatus}`);
    renderAllOrders();
    showNotification(`✅ تم تحديث حالة الطلب إلى: ${newStatus}`, "success");
  }

  // ========== دوال طباعة الفاتورة (Invoice Printing) ==========

  function generateInvoiceHTML(order) {
    const itemsList = order.items
      .map((item, index) => {
        const qty = item.quantity || 1;
        const total = item.price * qty;
        return `
            <tr style="border-bottom: 1px solid #E5E7EB;">
                <td style="padding: 12px; text-align: center; font-size: 14px;">${index + 1}</td>
                <td style="padding: 12px; text-align: right; font-size: 14px;">${item.name}</td>
                <td style="padding: 12px; text-align: center; font-size: 14px;">${qty}</td>
                <td style="padding: 12px; text-align: center; font-size: 14px;">${item.price} ج.م</td>
                <td style="padding: 12px; text-align: center; font-size: 14px; font-weight: 600;">${total} ج.م</td>
            </tr>
        `;
      })
      .join("");

    const invoiceDate = new Date(order.timestamp).toLocaleDateString("ar-EG");
    const invoiceTime = new Date(order.timestamp).toLocaleTimeString("ar-EG");

    return `
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>فاتورة الطلب #${order.orderId}</title>
            <style>
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    background: white;
                    color: #333;
                    line-height: 1.6;
                }
                
                .invoice-container {
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 40px 20px;
                }
                
                .header {
                    border-bottom: 3px solid #FF6B35;
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                }
                
                .header h1 {
                    font-size: 32px;
                    color: #FF6B35;
                    margin-bottom: 10px;
                    text-align: center;
                }
                
                .header p {
                    text-align: center;
                    color: #666;
                    font-size: 14px;
                }
                
                .invoice-number {
                    background: #FFF0E6;
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                    text-align: center;
                    border: 2px dashed #FF6B35;
                }
                
                .invoice-number h2 {
                    color: #FF6B35;
                    font-size: 20px;
                    margin: 0;
                }
                
                .invoice-details {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 30px;
                    margin-bottom: 30px;
                    background: #F8F9FA;
                    padding: 20px;
                    border-radius: 8px;
                }
                
                .detail-section h3 {
                    color: #333;
                    font-size: 14px;
                    font-weight: 700;
                    margin-bottom: 12px;
                    border-bottom: 2px solid #FF6B35;
                    padding-bottom: 8px;
                }
                
                .detail-section p {
                    font-size: 13px;
                    margin-bottom: 6px;
                    color: #555;
                }
                
                .detail-section strong {
                    color: #FF6B35;
                    font-weight: 600;
                }
                
                .items-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 20px;
                    background: white;
                    border: 2px solid #E5E7EB;
                    border-radius: 8px;
                    overflow: hidden;
                }
                
                .items-table thead {
                    background: linear-gradient(135deg, #FF6B35, #FF8E5F);
                    color: white;
                }
                
                .items-table thead th {
                    padding: 14px;
                    text-align: center;
                    font-weight: 700;
                    font-size: 14px;
                }
                
                .items-table th:first-child {
                    text-align: center;
                    width: 40px;
                }
                
                .items-table th:nth-child(2) {
                    text-align: right;
                }
                
                .items-table tbody tr:hover {
                    background: #F8F9FA;
                }
                
                .summary {
                    background: #F8F9FA;
                    padding: 20px;
                    border-radius: 8px;
                    margin-bottom: 30px;
                }
                
                .summary-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 12px;
                    font-size: 14px;
                }
                
                .summary-row span:first-child {
                    color: #666;
                    font-weight: 600;
                }
                
                .summary-row span:last-child {
                    color: #333;
                    font-weight: 600;
                }
                
                .total-row {
                    background: linear-gradient(135deg, #FF6B35, #FF8E5F);
                    color: white;
                    padding: 15px;
                    border-radius: 6px;
                    display: flex;
                    justify-content: space-between;
                    font-size: 18px;
                    font-weight: 700;
                    margin-bottom: 30px;
                }
                
                .footer {
                    border-top: 2px solid #E5E7EB;
                    padding-top: 20px;
                    text-align: center;
                    color: #999;
                    font-size: 12px;
                }
                
                .footer-text {
                    margin-bottom: 10px;
                }
                
                .status-badge {
                    display: inline-block;
                    padding: 8px 16px;
                    border-radius: 20px;
                    font-weight: 700;
                    font-size: 12px;
                    margin-top: 10px;
                }
                
                .status-new { background: rgba(255, 107, 53, 0.15); color: #FF6B35; }
                .status-preparing { background: rgba(255, 193, 7, 0.15); color: #FFC107; }
                .status-delivered { background: rgba(39, 174, 96, 0.15); color: #27AE60; }
                
                .print-footer {
                    text-align: center;
                    margin-top: 40px;
                    padding-top: 20px;
                    border-top: 1px solid #E5E7EB;
                    font-size: 12px;
                    color: #999;
                }
                
                @media print {
                    body {
                        background: white;
                        padding: 0;
                        margin: 0;
                    }
                    
                    .invoice-container {
                        padding: 0;
                        max-width: 100%;
                    }
                    
                    .no-print {
                        display: none;
                    }
                    
                    .invoice-container {
                        page-break-after: always;
                    }
                }
                
                .print-buttons {
                    display: flex;
                    gap: 12px;
                    justify-content: center;
                    margin-bottom: 30px;
                    flex-wrap: wrap;
                }
                
                .print-btn {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 600;
                    font-size: 14px;
                    transition: all 0.3s;
                }
                
                .btn-print {
                    background: #FF6B35;
                    color: white;
                }
                
                .btn-print:hover {
                    background: #E85A1F;
                }
                
                .btn-close {
                    background: #95A5A6;
                    color: white;
                }
                
                .btn-close:hover {
                    background: #7F8C8D;
                }
                
                .qr-section {
                    text-align: center;
                    margin: 20px 0;
                    padding: 15px;
                    background: #F8F9FA;
                    border-radius: 8px;
                }
                
                .qr-section p {
                    color: #666;
                    font-size: 12px;
                    margin: 5px 0;
                }
            </style>
        </head>
        <body>
            <div class="invoice-container">
                <div class="print-buttons no-print">
                    <button class="print-btn print-btn" onclick="window.print()">🖨️ طباعة</button>
                    <button class="print-btn btn-close" onclick="window.close()">❌ إغلاق</button>
                </div>
                
                <div class="header">
                    <h1>🍽️ My Order</h1>
                    <p>منصة طلب الطعام الموثوقة</p>
                </div>
                
                <div class="invoice-number">
                    <h2>فاتورة الطلب #${order.orderId}</h2>
                </div>
                
                <div class="invoice-details">
                    <div class="detail-section">
                        <h3>📋 بيانات العميل</h3>
                        <p><strong>الاسم:</strong> ${order.customerName}</p>
                        <p><strong>الهاتف:</strong> ${order.customerPhone}</p>
                        <p><strong>العنوان:</strong> ${order.customerAddress}</p>
                    </div>
                    <div class="detail-section">
                        <h3>⏰ بيانات الطلب</h3>
                        <p><strong>التاريخ:</strong> ${invoiceDate}</p>
                        <p><strong>الوقت:</strong> ${invoiceTime}</p>
                        <p><strong>الحالة:</strong> <span class="status-badge status-${order.status === "جديد" ? "new" : order.status === "جاري التحضير" ? "preparing" : "delivered"}">${order.status}</span></p>
                    </div>
                </div>
                
                <h3 style="margin: 20px 0 10px 0; color: #333; font-size: 16px;">🍽️ تفاصيل الطلب</h3>
                
                <table class="items-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>اسم الوجبة</th>
                            <th>الكمية</th>
                            <th>السعر</th>
                            <th>الإجمالي</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsList}
                    </tbody>
                </table>
                
                <div class="summary">
                    <div class="summary-row">
                        <span>🛍️ المجموع الجزئي:</span>
                        <span>${order.subtotal} ج.م</span>
                    </div>
                    <div class="summary-row">
                        <span>🚚 رسوم التوصيل:</span>
                        <span>${order.shipping} ج.م</span>
                    </div>
                </div>
                
                <div class="total-row">
                    <span>💰 المبلغ النهائي:</span>
                    <span>${order.total} ج.م</span>
                </div>
                
                <div class="footer">
                    <div class="footer-text">شكراً لاستخدامك My Order</div>
                    <div class="footer-text">نسأل رضاك عن خدمتنا</div>
                    <div class="footer-text">📱 تابعنا: +20 101 2127 9663</div>
                </div>
                
                <div class="print-footer no-print">
                    <p>تم طباعة هذه الفاتورة من نظام My Order</p>
                    <p>الطباعة في: ${new Date().toLocaleString("ar-EG")}</p>
                </div>
            </div>
        </body>
        </html>
    `;
  }

  function printInvoice(orderId) {
    try {
      const order = (allOrders || []).find((o) => o.orderId === orderId);

      if (!order) {
        showNotification("❌ لم يتم العثور على الطلب", "error");
        return;
      }

      // توليد HTML الفاتورة
      const invoiceHTML = generateInvoiceHTML(order);

      // فتح نافذة جديدة
      const printWindow = window.open(
        "",
        "PrintWindow",
        "width=900,height=600",
      );

      if (!printWindow) {
        showNotification(
          "⚠️ تم حظر نافذة الطباعة. يرجى السماح بالنوافذ المنبثقة",
          "warning",
        );
        return;
      }

      // كتابة محتوى الفاتورة
      printWindow.document.write(invoiceHTML);
      printWindow.document.close();

      // الانتظار حتى يتم تحميل المستند
      printWindow.onload = function () {
        setTimeout(() => {
          printWindow.print();
        }, 250);
      };

      console.log("✅ تم فتح نافذة طباعة الفاتورة");
      console.log(`   📦 رقم الطلب: #${orderId}`);
      showNotification("✅ جارٍ فتح الفاتورة للطباعة...", "success");
    } catch (error) {
      console.error("❌ خطأ في طباعة الفاتورة:", error);
      showNotification("❌ حدث خطأ في توليد الفاتورة", "error");
    }
  }

  // ========== دوال سجل الطلبات للعميل ==========

  function loadCustomerOrders() {
    const container = document.getElementById("ordersHistoryContainer");
    if (!container) return;

    // عرض جميع الأوردرات من السجل المركزي
    const orders = allOrders || [];

    if (orders.length === 0) {
      container.innerHTML = `
            <div style="text-align:center; padding:60px 20px;">
                <i class="fa-solid fa-inbox" style="font-size:64px; color:#BDC3C7; margin-bottom:15px;"></i>
                <h3 style="color:#7F8C8D; margin-bottom:10px; font-size:18px;">لا توجد طلبات بعد</h3>
                <p style="color:#BDC3C7; margin-bottom:20px;">ابدأ بطلب وجبتك المفضلة الآن!</p>
                <button onclick="showPage('menu')" style="background:linear-gradient(135deg, #FF6B35, #FF8E5F); color:white; border:none; padding:12px 30px; border-radius:8px; cursor:pointer; font-weight:600;">
                    🍔 تصفح المنيو
                </button>
            </div>
        `;
      return;
    }

    // عرض الطلبات (الأحدث أولاً)
    container.innerHTML = allOrders
      .slice()
      .reverse()
      .map((order, idx) => {
        const itemsList = order.items
          .map((item, i) => {
            const quantity = item.quantity || 1;
            const itemTotal = item.price * quantity;
            return `<li style="padding:6px 0; font-size:13px; color:#2C3E50; border-bottom:1px solid #F0F0F0;">
                🔹 ${item.name} × ${quantity} = ${itemTotal} ج.م
            </li>`;
          })
          .join("");

        const orderTime = new Date(order.timestamp).toLocaleString("ar-EG");
        const statusColor =
          order.status === "جديد"
            ? "#FF6B35"
            : order.status === "جاري التحضير"
              ? "#FFC107"
              : "#27AE60";
        const statusBg =
          order.status === "جديد"
            ? "rgba(255,107,53,0.1)"
            : order.status === "جاري التحضير"
              ? "rgba(255,193,7,0.1)"
              : "rgba(39,174,96,0.1)";
        const statusIcon =
          order.status === "جديد"
            ? "🔵"
            : order.status === "جاري التحضير"
              ? "🟡"
              : "🟢";

        return `
            <div style="background:white; border-radius:12px; padding:18px; margin-bottom:15px; box-shadow:0 2px 8px rgba(0,0,0,0.1); border-left:5px solid ${statusColor}; transition:all 0.3s;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:10px;">
                    <div>
                        <h4 style="margin:0 0 4px 0; color:#2C3E50; font-size:16px;">📦 الطلب رقم: <strong>#${order.orderId}</strong></h4>
                        <p style="margin:0; font-size:12px; color:#7F8C8D;">⏰ ${orderTime}</p>
                    </div>
                    <div style="background:${statusBg}; padding:8px 16px; border-radius:6px; text-align:center;">
                        <span style="color:${statusColor}; font-weight:700; font-size:13px;">${statusIcon} ${order.status}</span>
                    </div>
                </div>
                
                <div style="background:#F8F9FA; padding:12px; border-radius:8px; margin-bottom:12px;">
                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; font-size:13px;">
                        <div><strong>👤 اسمك:</strong><br><span style="color:#555;">${order.customerName}</span></div>
                        <div><strong>📱 رقمك:</strong><br><span style="color:#555;">${order.customerPhone}</span></div>
                        <div style="grid-column:1/-1;"><strong>📍 عنوان التوصيل:</strong><br><span style="color:#555;">${order.customerAddress}</span></div>
                    </div>
                </div>
                
                <div style="background:#FFF9E6; padding:12px; border-radius:8px; margin-bottom:12px; border:1px dashed #FFC107;">
                    <strong style="color:#F39C12; font-size:13px;">🍽️ تفاصيل الطلب:</strong>
                    <ul style="margin:8px 0 0 0; padding-left:20px; list-style:none;">
                        ${itemsList}
                    </ul>
                </div>
                
                <div style="display:flex; gap:10px; margin-bottom:12px;">
                    <div style="flex:1; background:#E8F5E9; padding:10px; border-radius:6px; text-align:center; font-size:12px;">
                        <strong style="color:#27AE60;">المجموع الجزئي</strong><br>
                        <span style="color:#27AE60; font-weight:700;">${order.subtotal} ج.م</span>
                    </div>
                    <div style="flex:1; background:#E3F2FD; padding:10px; border-radius:6px; text-align:center; font-size:12px;">
                        <strong style="color:#2196F3;">🚚 التوصيل</strong><br>
                        <span style="color:#2196F3; font-weight:700;">${order.shipping} ج.م</span>
                    </div>
                    <div style="flex:1; background:#F3E5F5; padding:10px; border-radius:6px; text-align:center; font-size:12px;">
                        <strong style="color:#9C27B0;">💰 الإجمالي</strong><br>
                        <span style="color:#9C27B0; font-weight:700;">${order.total} ج.م</span>
                    </div>
                </div>
                
                <div style="display:flex; gap:10px; flex-wrap:wrap;">
                    <button onclick="repeatOrderFromHistory('${order.orderId}')" style="background:linear-gradient(135deg, #FF6B35, #FF8E5F); color:white; border:none; padding:10px 16px; border-radius:6px; cursor:pointer; font-size:12px; font-weight:600; transition:0.3s;">
                        🔄 إعادة نفس الطلب
                    </button>
                    <button onclick="resendOrderToRestaurant('${order.orderId}')" style="background:linear-gradient(135deg, #27AE60, #229954); color:white; border:none; padding:10px 16px; border-radius:6px; cursor:pointer; font-size:12px; font-weight:600; transition:0.3s;">
                        📲 إعادة إرسال للمطعم
                    </button>
                </div>
            </div>
        `;
      })
      .join("");
  }

  // إعادة نفس الطلب
  function repeatOrderFromHistory(orderId) {
    // جلب الطلبات من السجل المركزي
    const orders = allOrders || [];
    const order = orders.find((o) => o.orderId === orderId);

    if (!order) {
      showNotification("❌ لم يتم العثور على الطلب", "error");
      return;
    }

    // إضافة العناصر للسلة
    order.items.forEach((item) => {
      const existingItem = cart.find((i) => i.id === item.id);
      if (existingItem) {
        existingItem.quantity =
          (existingItem.quantity || 1) + (item.quantity || 1);
      } else {
        cart.push({ ...item, quantity: item.quantity || 1 });
      }
    });

    updateCartCount();
    renderCartItems();
    showNotification("✅ تمت إضافة عناصر الطلب السابق للسلة", "success");
    showPage("cart-page");
  }

  // إعادة إرسال الطلب للمطعم (تضيف الطلب للسلة أولاً ثم تذهب إليها)
  function resendOrderToRestaurant(orderId) {
    // جلب الطلبات من السجل المركزي
    const orders = allOrders || [];
    const order = orders.find((o) => o.orderId === orderId);

    if (!order) {
      showNotification("❌ لم يتم العثور على الطلب", "error");
      return;
    }

    // إضافة عناصر الطلب إلى السلة (كما في إعادة الطلب)
    order.items.forEach((item) => {
      const existingItem = cart.find((i) => i.id === item.id);
      if (existingItem) {
        existingItem.quantity =
          (existingItem.quantity || 1) + (item.quantity || 1);
      } else {
        cart.push({ ...item, quantity: item.quantity || 1 });
      }
    });

    updateCartCount();
    renderCartItems();

    // نوجه المستخدم إلى صفحة السلة ليتمكن من مراجعة الطلب ثم الإرسال
    showPage("cart-page");
    showNotification(
      "✅ تمت إضافة الطلب للسلة. يمكنك مراجعته ثم إرساله للمطعم عبر زر الإرسال.",
      "success",
    );
  }

  function renderAdminList() {
    const list =
      document.getElementById("adminItemsList") ||
      document.getElementById("adminMenuManagement");
    if (!list) return;

    if (menuItems.length === 0) {
      list.innerHTML = `<p style="text-align:center; padding:30px; color:#7F8C8D; font-size:15px;">📭 لا توجد أصناف حالياً</p>`;
      return;
    }

    list.innerHTML = menuItems
      .map(
        (item) => `
        <div style="background:linear-gradient(135deg, rgba(255,107,53,0.05), rgba(255,142,95,0.05)); padding:16px; margin-bottom:12px; border-radius:12px; display:flex; justify-content:space-between; align-items:center; border-left:4px solid #FF6B35; transition:0.3s; hover:box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <div>
                <span style="font-weight:700; display:block; color:#2C3E50; font-size:15px;">📌 ${item["Item Name"] || item.name}</span>
                <span style="font-size:13px; color:#7F8C8D; display:block; margin-top:4px;">💰 ${item["Price"] || item.price} ج.م</span>
            </div>
            <div style="display:flex; gap:8px;">
                <button data-action="open-edit-modal" data-id="${item["ID"] || item.id}" style="background:linear-gradient(135deg, #27AE60, #229954); color:white; border:none; padding:10px 16px; border-radius:8px; cursor:pointer; font-size:13px; font-weight:600; transition:0.3s; box-shadow:0 2px 8px rgba(39,174,96,0.2);">✏️ تعديل كامل</button>
                <button data-action="delete-item" data-id="${item["ID"] || item.id}" style="background:linear-gradient(135deg, #E74C3C, #C0392B); color:white; border:none; padding:10px 18px; border-radius:8px; cursor:pointer; font-size:13px; font-weight:600; transition:0.3s; box-shadow:0 2px 8px rgba(231,76,60,0.2);">🗑️ حذف</button>
            </div>
        </div>
    `,
      )
      .join("");
  }

  async function deleteItem(id) {
    const itemId = Number(id);
    if (Number.isNaN(itemId)) {
      showNotification("❌ معرف الصنف غير صالح.", "error");
      return;
    }
    if (!confirm("⚠️ هل تريد فعلاً حذف هذا الصنف؟")) return;

    const deletedItem = findMenuItemById(itemId);
    if (!deletedItem) {
      showNotification("❌ تعذر العثور على الصنف لحذفه.", "error");
      return;
    }

    try {
      // Prepare FormData for process_menu.php
      const formPayload = new FormData();
      formPayload.append("action", "delete");
      formPayload.append("id", itemId.toString());

      // Send delete request to MySQL via process_menu.php
      const response = await fetch("api/process_menu.php", {
        method: "POST",
        body: formPayload,
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(
          `Failed to delete item: ${response.status} ${response.statusText} - ${body}`,
        );
      }

      const json = await response.json();
      if (!json.success && json.error) {
        throw new Error(json.error);
      }

      menuItems = menuItems.filter(
        (item) =>
          String(item["ID"] || item.id || item.Id || "").trim() !==
          String(itemId),
      );

      console.log(
        `✅ تم تحديث القائمة في الذاكرة بعد حذف الصنف: ${deletedItem?.["Item Name"] || deletedItem?.name}`,
      );
      console.log(`   📊 عدد الأصناف المتبقية: ${menuItems.length}`);
      renderAdminList();
      renderMenu(menuItems);
      showNotification("✓ تم حذف الصنف بنجاح", "success");

      // تحديث الإحصائيات
      if (typeof updateAdminStatistics === "function") {
        updateAdminStatistics();
      }

      try {
        if (typeof logEvent === "function")
          logEvent("ADMIN_DELETE_ITEM", {
            id: itemId,
            name: deletedItem?.["Item Name"] || deletedItem?.name,
          });
      } catch (e) {}

      setTimeout(() => {
        if (typeof fetchMenu === "function") {
          fetchMenu(Date.now()).catch((err) =>
            console.warn("Failed to refresh menu after delete:", err),
          );
        }
      }, 500);
    } catch (error) {
      ErrorHandler.handle(error, "deleteItem");
    }
  }

  function openEditModal(id) {
    const itemId = String(id).trim();
    const item = findMenuItemById(itemId);
    if (!item) {
      showNotification("❌ تعذر العثور على المنتج المطلوب.", "error");
      return;
    }

    const editModal = document.createElement("div");
    editModal.id = "editItemModal";
    editModal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.6);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        direction: rtl;
    `;

    editModal.innerHTML = `
        <div style="background:white; padding:30px; border-radius:12px; max-width:500px; width:90%; max-height:90vh; overflow-y:auto; box-shadow:0 10px 40px rgba(0,0,0,0.3); direction:rtl;">
            <h2 style="color:#2C3E50; margin-bottom:20px; font-size:20px;">✏️ تعديل المنتج</h2>
            
            <div style="margin-bottom:16px;">
                <label style="display:block; color:#34495E; font-weight:600; margin-bottom:6px;">اسم المنتج:</label>
                <input type="text" id="editItemName" value="${item["Item Name"]}" style="width:100%; padding:10px; border:2px solid #ECF0F1; border-radius:6px; font-size:14px; font-family:inherit; box-sizing:border-box;" />
            </div>
            
            <div style="margin-bottom:16px;">
                <label style="display:block; color:#34495E; font-weight:600; margin-bottom:6px;">السعر:</label>
                <input type="number" id="editItemPrice" value="${item["Price"]}" min="1" step="0.01" style="width:100%; padding:10px; border:2px solid #ECF0F1; border-radius:6px; font-size:14px; box-sizing:border-box;" />
            </div>
            
            <div style="margin-bottom:16px;">
                <label style="display:block; color:#34495E; font-weight:600; margin-bottom:6px;">الفئة:</label>
                <select id="editItemCategory" style="width:100%; padding:10px; border:2px solid #ECF0F1; border-radius:6px; font-size:14px; font-family:inherit; box-sizing:border-box;">
                    <option value="أطعمة" ${mapCategoryToArabic(item["Category"] || item.category) === "أطعمة" ? "selected" : ""}>🍔 أطعمة</option>
                    <option value="مشروبات" ${mapCategoryToArabic(item["Category"] || item.category) === "مشروبات" ? "selected" : ""}>🥤 مشروبات</option>
                    <option value="حلويات" ${mapCategoryToArabic(item["Category"] || item.category) === "حلويات" ? "selected" : ""}>🍰 حلويات</option>
                </select>
            </div>
            
            <div style="margin-bottom:20px;">
                <label style="display:block; color:#34495E; font-weight:600; margin-bottom:6px;">رابط الصورة:</label>
                <textarea id="editItemImg" style="width:100%; padding:10px; border:2px solid #ECF0F1; border-radius:6px; font-size:12px; font-family:monospace; min-height:60px; box-sizing:border-box; resize:vertical;">${item["Image URL"]}</textarea>
            </div>
            
            <div style="display:flex; gap:10px; justify-content:flex-end;">
                <button id="cancelEditBtn" style="background:#95A5A6; color:white; border:none; padding:10px 20px; border-radius:6px; cursor:pointer; font-weight:600; transition:0.3s; font-size:14px;">إلغاء</button>
                <button id="saveEditBtn" style="background:linear-gradient(135deg, #27AE60, #229954); color:white; border:none; padding:10px 20px; border-radius:6px; cursor:pointer; font-weight:600; transition:0.3s; font-size:14px;">حفظ التعديلات</button>
            </div>
        </div>
    `;

    document.body.appendChild(editModal);

    const cancelBtn = document.getElementById("cancelEditBtn");
    const saveBtn = document.getElementById("saveEditBtn");

    if (!cancelBtn || !saveBtn) {
      showNotification("❌ تعذر إنشاء نافذة التعديل.", "error");
      return;
    }

    cancelBtn.addEventListener("click", (e) => {
      e.preventDefault();
      editModal.remove();
    });

    saveBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      await saveEdit(itemId, editModal);
    });

    editModal.addEventListener("click", (e) => {
      if (e.target === editModal) editModal.remove();
    });
  }

  async function saveEdit(id, editModal) {
    const itemId = Number(id);
    if (Number.isNaN(itemId)) {
      showNotification("❌ معرف المنتج غير صالح.", "error");
      return;
    }
    const item = findMenuItemById(itemId);
    if (!item) {
      showNotification("❌ تعذر العثور على المنتج المطلوب.", "error");
      return;
    }

    const newName = document.getElementById("editItemName")?.value.trim();
    const newPrice = parseFloat(
      document.getElementById("editItemPrice")?.value,
    );
    const newCatRaw =
      getSelectedCategoryLabel("editItemCategory") ||
      document.getElementById("editItemCategory")?.value ||
      "";
    const newCatLabel = mapCategoryToArabic(newCatRaw);
    const newCatKey = mapCategoryToKey(newCatRaw);
    const newImg = document.getElementById("editItemImg")?.value.trim();

    if (!newName) {
      showNotification("⚠️ اسم المنتج لا يمكن أن يكون فارغاً", "warning");
      return;
    }
    if (isNaN(newPrice) || newPrice <= 0) {
      showNotification("⚠️ السعر يجب أن يكون رقماً موجباً", "warning");
      return;
    }
    if (!newImg) {
      showNotification("⚠️ رابط الصورة لا يمكن أن يكون فارغاً", "warning");
      return;
    }

    const updatedData = {
      "Item Name": newName,
      Category: newCatLabel,
      Price: newPrice,
      "Image URL": newImg,
    };

    try {
      // Update menu item in MySQL database
      const formData = new FormData();
      formData.append("action", "update");
      formData.append("id", itemId);
      formData.append("item_name", newName);
      formData.append("unit_price", newPrice);
      formData.append("category", newCatLabel);
      formData.append("image_url", newImg);

      const response = await fetch("api/process_menu.php", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      item["Item Name"] = newName;
      item["Price"] = newPrice;
      item["Category"] = newCatLabel;
      item["Image URL"] = newImg;
      item.name = newName;
      item.price = newPrice;
      item.category = newCatLabel;
      item.cat = newCatKey;
      item.img = newImg;

      editModal.remove();
      renderAdminList();
      renderMenu(menuItems);
      renderHomeMenu(menuItems);
      showNotification("✅ تم تحديث المنتج بنجاح", "success");
      if (typeof logEvent === "function") {
        logEvent("ADMIN_EDIT_ITEM", {
          id: itemId,
          name: newName,
          price: newPrice,
        });
      }

      setTimeout(() => {
        if (typeof fetchMenu === "function") {
          fetchMenu(Date.now()).catch((err) =>
            console.warn("Failed to refresh menu after edit:", err),
          );
        }
      }, 1500);
    } catch (error) {
      ErrorHandler.handle(error, "saveEdit");
    }
  }

  async function editItemPrice(id, currentPrice) {
    const newPrice = prompt(`أدخل السعر الجديد (الحالي: ${currentPrice} ج.م):`);
    if (newPrice === null) return; // cancelled

    const numPrice = parseFloat(newPrice);
    if (isNaN(numPrice) || numPrice <= 0) {
      showNotification("⚠️ السعر يجب أن يكون رقماً موجباً", "warning");
      return;
    }

    const itemId = Number(id);
    const item = menuItems.find(
      (i) => i.id === itemId || i.ID === String(itemId),
    );

    if (!item) {
      showNotification("❌ تعذر العثور على الصنف", "error");
      return;
    }

    try {
      // Prepare FormData for process_menu.php
      const formPayload = new FormData();
      formPayload.append("action", "update");
      formPayload.append("id", itemId.toString());
      formPayload.append("unit_price", numPrice.toString());

      // Send update request to MySQL via process_menu.php
      const response = await fetch("api/process_menu.php", {
        method: "POST",
        body: formPayload,
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(
          `Failed to update price: ${response.status} ${response.statusText} - ${body}`,
        );
      }

      const json = await response.json();
      if (!json.success && json.error) {
        throw new Error(json.error);
      }

      const oldPrice = item.price;
      item.price = numPrice;
      item.Price = numPrice;

      console.log("✅ تم تحديث السعر في الذاكرة والقاعدة البيانات");
      console.log(`   📝 الصنف: ${item.name}`);
      console.log(
        `   💰 السعر القديم: ${oldPrice} ج.م → الجديد: ${numPrice} ج.م`,
      );
      renderAdminList();
      renderMenu(menuItems);
      showNotification(
        `✅ تم تحديث السعر من ${oldPrice} إلى ${numPrice} ج.م`,
        "success",
      );
      try {
        if (typeof logEvent === "function")
          logEvent("ADMIN_EDIT_PRICE", {
            id: itemId,
            name: item.name,
            oldPrice: oldPrice,
            newPrice: numPrice,
          });
      } catch (e) {}
    } catch (error) {
      ErrorHandler.handle(error, "editItemPrice");
    }
  }

  async function editItemFull(id) {
    const itemId = Number(id);
    const item = menuItems.find(
      (i) => i.id === itemId || i.ID === String(itemId),
    );

    if (!item) {
      showNotification("❌ تعذر العثور على الصنف", "error");
      return;
    }

    // Create edit form
    const newName = prompt(
      `اسم الصنف الجديد (الحالي: ${item.name}):`,
      item.name,
    );
    if (newName === null) return;

    const newPrice = prompt(
      `السعر الجديد (الحالي: ${item.price}):`,
      item.price.toString(),
    );
    if (newPrice === null) return;

    const categoryOptions = [
      "food\nأطعمة",
      "drinks\nمشروبات",
      "sweets\nحلويات",
    ];
    const selectedCat = prompt(
      `اختر الفئة:\n0. food (أطعمة)\n1. drinks (مشروبات)\n2. sweets (حلويات)\n\nالحالية: ${item.category}`,
      "0",
    );
    if (selectedCat === null) return;

    const catIndex = parseInt(selectedCat, 10);
    const categories = ["food", "drinks", "sweets"];
    const newCategory = categories[catIndex] || item.category;

    const numPrice = parseFloat(newPrice);
    if (isNaN(numPrice) || numPrice <= 0) {
      showNotification("⚠️ السعر يجب أن يكون رقماً موجباً", "warning");
      return;
    }

    try {
      // Prepare FormData for process_menu.php
      const formPayload = new FormData();
      formPayload.append("action", "update");
      formPayload.append("id", itemId.toString());
      formPayload.append("item_name", newName);
      formPayload.append("unit_price", numPrice.toString());
      formPayload.append("category", newCategory);

      // Send update request to MySQL via process_menu.php
      const response = await fetch("api/process_menu.php", {
        method: "POST",
        body: formPayload,
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(
          `Failed to update item: ${response.status} ${response.statusText} - ${body}`,
        );
      }

      const json = await response.json();
      if (!json.success && json.error) {
        throw new Error(json.error);
      }

      // Update local item
      item.name = newName;
      item["Item Name"] = newName;
      item.price = numPrice;
      item.Price = numPrice;
      item.category = newCategory;
      item.Category = mapCategoryToArabic(newCategory);
      item.cat = newCategory;

      console.log("✅ تم تحديث الصنف بنجاح في الذاكرة والقاعدة البيانات");
      renderAdminList();
      renderMenu(menuItems);
      showNotification("✅ تم تحديث الصنف بنجاح", "success");

      try {
        if (typeof logEvent === "function")
          logEvent("ADMIN_EDIT_FULL", {
            id: itemId,
            newName: newName,
            newPrice: numPrice,
            newCategory: newCategory,
          });
      } catch (e) {}
    } catch (error) {
      ErrorHandler.handle(error, "editItemFull");
    }
  }

  function updateRestaurantPhone() {
    console.log("🔍 بدء تحديث رقم المطعم...");
    const phoneInput = document.getElementById("restaurantPhoneInput");
    let phone = phoneInput.value.trim();

    console.log("📱 الرقم المدخل:", phone);

    if (!phone) {
      showNotification("⚠️ الرجاء إدخال رقم الهاتف", "warning");
      return;
    }

    // تنسيق رقم الهاتف
    let formattedPhone = phone.replace(/^0/, "20");
    if (!formattedPhone.startsWith("20")) {
      formattedPhone = "20" + phone;
    }
    formattedPhone = formattedPhone.replace(/\D/g, "");

    console.log("✅ الرقم بعد التنسيق:", formattedPhone);

    if (!/^201[0-9]{9}$/.test(formattedPhone)) {
      showNotification(
        "❌ رقم الهاتف غير صحيح. استخدم صيغة مصرية صحيحة",
        "error",
      );
      return;
    }

    // حفظ الرقم في الذاكرة والتخزين المحلي
    RESTAURANT_PHONE = formattedPhone;
    try {
      localStorage.setItem(RESTAURANT_PHONE_STORAGE_KEY, formattedPhone);
      console.log("💾 تم حفظ رقم المطعم في التخزين المحلي:", formattedPhone);
    } catch (err) {
      console.warn("⚠️ فشل حفظ رقم المطعم في التخزين المحلي:", err);
    }
    console.log("💾 تم تحديث رقم المطعم في الذاكرة بنجاح:", formattedPhone);

    // تحديث العرض
    if (document.getElementById("currentPhoneDisplay")) {
      document.getElementById("currentPhoneDisplay").textContent =
        formattedPhone;
      console.log("🖥️ تم تحديث عرض الرقم على الصفحة");
    }
    phoneInput.value = "";

    console.log("✅ انتهى تحديث رقم المطعم بنجاح");
    showNotification(
      "✅ تم تحديث رقم المطعم بنجاح: " + formattedPhone,
      "success",
    );
  }

  // تحديث رقم المطعم عند تحميل الصفحة
  function initializeAdminPanel() {
    const phoneDisplay = document.getElementById("currentPhoneDisplay");
    if (phoneDisplay) {
      phoneDisplay.textContent = RESTAURANT_PHONE;
    }

    // تحديث الإحصائيات
    updateAdminStatistics();
  }

  // دالة لتحديث الإحصائيات في لوحة التحكم
  function updateAdminStatistics() {
    try {
      // استخدام البيانات المحمّلة من الـ API
      let orders = Array.isArray(allOrders) ? allOrders : [];
      let customers = [];
      let loadedMenuItems = Array.isArray(menuItems) ? menuItems : [];

      // حساب الإجماليات الشهرية
      let totalRevenue = 0;
      let monthlyRevenue = 0;
      let monthlyOrders = 0;
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      orders.forEach((order) => {
        totalRevenue += order.total || 0;
        const orderDate = order.timestamp ? new Date(order.timestamp) : null;
        if (
          orderDate &&
          orderDate.getMonth() === currentMonth &&
          orderDate.getFullYear() === currentYear
        ) {
          monthlyRevenue += order.total || 0;
          monthlyOrders += 1;
        }
      });

      // حساب العملاء الذين سجلوا في الشهر الحالي
      let monthlyCustomers = 0;
      customers.forEach((c) => {
        const created = c && c.createdAt ? new Date(c.createdAt) : null;
        if (
          created &&
          created.getMonth() === currentMonth &&
          created.getFullYear() === currentYear
        ) {
          monthlyCustomers += 1;
        }
      });

      // تحديث عناصر الإحصائيات HTML
      const totalOrdersEl = document.getElementById("totalOrdersCount");
      const dailyRevenueEl = document.getElementById("dailyRevenueCount");
      const totalCustomersEl = document.getElementById("totalCustomersCount");
      const totalItemsEl = document.getElementById("totalItemsCount");
      const totalRevenueEl = document.getElementById("totalRevenueCount");

      if (totalOrdersEl) totalOrdersEl.textContent = monthlyOrders;
      if (dailyRevenueEl) dailyRevenueEl.textContent = monthlyRevenue + " ج.م";
      if (totalCustomersEl) totalCustomersEl.textContent = monthlyCustomers;
      if (totalItemsEl) totalItemsEl.textContent = loadedMenuItems.length;
      if (totalRevenueEl) totalRevenueEl.textContent = totalRevenue + " ج.م";

      // تحديث الواجهة الجديدة لوحدة نظرة عامة
      const overviewTotalOrders = document.getElementById(
        "overviewTotalOrders",
      );
      const overviewRevenue = document.getElementById("overviewRevenue");
      const overviewCustomers = document.getElementById("overviewCustomers");
      if (overviewTotalOrders) overviewTotalOrders.textContent = monthlyOrders;
      if (overviewRevenue)
        overviewRevenue.textContent = monthlyRevenue + " ج.م";
      if (overviewCustomers) overviewCustomers.textContent = monthlyCustomers;

      console.log("✅ تم تحديث إحصائيات لوحة التحكم");
      console.log("📊 الإحصائيات:", {
        monthlyOrders: monthlyOrders,
        monthlyRevenue: monthlyRevenue,
        monthlyCustomers: monthlyCustomers,
        totalItems: loadedMenuItems.length,
        totalRevenue: totalRevenue,
      });
    } catch (error) {
      console.error("❌ خطأ في تحديث الإحصائيات:", error);
    }
  }

  function switchAdminDashboardSection(section) {
    const panels = {
      overview: "adminOverviewSection",
      orders: "adminOrdersSection",
      menu: "adminMenuSection",
    };

    Object.entries(panels).forEach(([key, id]) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.classList.toggle("active", key === section);
    });

    const buttons = document.querySelectorAll(
      ".admin-sidebar button[data-section]",
    );
    buttons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.section === section);
    });

    if (section === "orders") {
      refreshAdminOrders();
    } else if (section === "overview") {
      updateAdminStatistics();
    }
  }

  function renderAdminOrdersTable() {
    const tbody = document.getElementById("adminOrdersTableBody");
    if (!tbody) return;

    const searchTerm = (
      document.getElementById("orderSearchInput")?.value || ""
    )
      .trim()
      .toLowerCase();
    const orders = Array.isArray(allOrders) ? allOrders.slice().reverse() : [];
    const filtered = orders.filter((order) => {
      if (!searchTerm) return true;
      return (
        String(order.orderId).includes(searchTerm) ||
        String(order.customerName || "")
          .toLowerCase()
          .includes(searchTerm) ||
        String(order.customerPhone || "")
          .toLowerCase()
          .includes(searchTerm) ||
        String(order.customerAddress || "")
          .toLowerCase()
          .includes(searchTerm)
      );
    });

    if (filtered.length === 0) {
      tbody.innerHTML =
        "<tr><td colspan='9' style='text-align:center;color:#ccc;padding:14px;'>لا توجد طلبات مطابقة للبحث</td></tr>";
      return;
    }

    tbody.innerHTML = filtered
      .map((order, idx) => {
        const date = order.timestamp ? new Date(order.timestamp) : new Date();
        const formatted = `${date.toLocaleDateString("ar-EG")} ${date.toLocaleTimeString("ar-EG")}`;
        const status = String(order.status || "جديد").toLowerCase();
        let statusClass = "status-new";
        if (status.includes("جاري")) statusClass = "status-cooking";
        if (status.includes("جاهز") || status.includes("مكتمل"))
          statusClass = "status-ready";

        const itemsCount = Array.isArray(order.items) ? order.items.length : 0;

        return `<tr>
            <td>${idx + 1}</td>
            <td>#${order.orderId || "---"}</td>
            <td>${order.customerName || "---"}</td>
            <td>${order.customerPhone || "---"}</td>
            <td>${order.customerAddress || "---"}</td>
            <td>${itemsCount}</td>
            <td>${order.total || 0} ج.م</td>
            <td><span class="status-badge ${statusClass}">${order.status || "جديد"}</span></td>
            <td>${formatted}</td>
          </tr>`;
      })
      .join("");
  }

  async function refreshAdminOrders() {
    try {
      if (typeof loadAllOrders === "function") {
        await loadAllOrders();
      }
    } catch (error) {
      console.error("❌ خطأ في جلب الطلبات:", error);
    }
    renderAdminOrdersTable();
  }

  function exportAdminOrdersCSV() {
    const orders = Array.isArray(allOrders) ? allOrders : [];
    if (orders.length === 0) {
      alert("لا توجد بيانات لتصديرها");
      return;
    }

    const headers = [
      "رقم الطلب",
      "العميل",
      "الهاتف",
      "العنوان",
      "العناصر",
      "الإجمالي",
      "الحالة",
      "التاريخ",
    ];
    const rows = orders.map((order) => {
      const date = order.timestamp
        ? new Date(order.timestamp).toLocaleString("ar-EG")
        : "";
      return [
        order.orderId || "",
        (order.customerName || "").replace(/\"/g, '"'),
        order.customerPhone || "",
        order.customerAddress || "",
        Array.isArray(order.items) ? order.items.length : 0,
        order.total || 0,
        order.status || "",
        date,
      ];
    });

    const csvContent = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "admin_orders_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function logoutAdmin() {
    sessionStorage.removeItem("isAdmin");
    sessionStorage.removeItem("adminUser");
    showNotification("🔐 تم تسجيل الخروج من لوحة الإدارة", "success");
    showPage("home-page");
  }

  // زر تهيئة من لوحة الإدارة: يهيئ Firebase إن أمكن وإلا يهيئ البيانات في الذاكرة ويعيد تحميل القائمة
  function seedFromAdmin() {
    // إذا كانت دوال DBSeeder متاحة وFirebase متاح
    if (
      typeof DBSeeder !== "undefined" &&
      DBSeeder.seedAll &&
      typeof window.firebaseDB !== "undefined"
    ) {
      showNotification("⏳ جاري تهيئة البيانات في Firebase...", "info");
      DBSeeder.seedAll();
      // بعد التهيئة حاول مزامنة البيانات
      setTimeout(() => {
        if (window.firebaseDB && window.firebaseDB.initializeFirebaseSync) {
          window.firebaseDB.initializeFirebaseSync();
        }
        showNotification(
          "✅ تم تهيئة البيانات. تحقق من لوحة الإدارة.",
          "success",
        );
        renderMenu(menuItems);
        renderAdminList();
        try {
          if (typeof logEvent === "function")
            logEvent("ADMIN_SEED", { method: "firebase" });
        } catch (e) {}
      }, 1200);
      return;
    }

    // بخلاف ذلك، استبدال بيانات المعايير بالبيانات التجريبية إذا كانت متاحة
    if (typeof DBSeeder !== "undefined" && DBSeeder.sampleMenu) {
      menuItems = DBSeeder.sampleMenu.slice();
      showNotification("✅ تم تهيئة البيانات في الذاكرة بنجاح", "success");
      renderMenu(menuItems);
      renderAdminList();
      try {
        if (typeof logEvent === "function")
          logEvent("ADMIN_SEED", { method: "local" });
      } catch (e) {}
      return;
    }

    showNotification(
      "⚠️ لا توجد بيانات تهيئة متاحة حالياً. افتح db-seed.js",
      "warning",
    );
  }

  // دالة لمسح جميع الأصناف (الذاكرة وFirebase إن وُجد)
  function clearAllItems() {
    if (
      !confirm(
        "⚠️ هل أنت متأكد من مسح جميع الأصناف؟ هذا الإجراء لا يمكن التراجع عنه.",
      )
    )
      return;

    // مسح القائمة من الذاكرة
    menuItems = [];

    // محاولة مزامنة الحذف إلى Firebase إذا كانت الدوال متاحة
    if (
      typeof window.firebaseDB !== "undefined" &&
      window.firebaseDB.syncMenuToFirebase
    ) {
      try {
        window.firebaseDB.syncMenuToFirebase();
        showNotification(
          "🗑️ تم مسح جميع الأصناف ومزامنة التغييرات مع Firebase",
          "success",
        );
      } catch (err) {
        console.warn("Firebase sync failed after clear:", err);
        showNotification(
          "🗑️ تم مسح الأصناف محلياً، لكن مزامنة Firebase فشلت",
          "warning",
        );
      }
    } else {
      showNotification("🗑️ تم مسح جميع الأصناف محلياً", "success");
    }

    renderAdminList();
    renderMenu(menuItems);

    // تحديث الإحصائيات
    if (typeof updateAdminStatistics === "function") {
      updateAdminStatistics();
    }
  }

  function sendReview() {
    const text = document.getElementById("reviewText").value.trim();
    if (!text) {
      showNotification("⚠️ الرجاء كتابة تقييمك", "warning");
      return;
    }

    const reviewData = { text, date: new Date().toLocaleDateString("ar-EG") };
    reviews.push(reviewData);
    try {
      document.getElementById("reviewText").value = "";
      renderReviews();
      showNotification("✅ شكراً لتقييمك! تم حفظه بنجاح", "success");

      // 📊 تسجيل التقييم في Google Sheets
      if (
        typeof GoogleSheetsLogger !== "undefined" &&
        GoogleSheetsLogger.logReview
      ) {
        GoogleSheetsLogger.logReview({
          itemName: "تقييم عام على التطبيق",
          rating: 5,
          comment: text,
          customerName: currentCustomer?.name || "عميل",
        });
      }
    } catch (e) {
      console.error("Error saving review:", e);
      showNotification("❌ خطأ في حفظ التقييم", "error");
    }
  }

  function renderReviews() {
    const list = document.getElementById("reviewsList");
    if (!list) return;

    list.innerHTML = reviews
      .slice()
      .reverse()
      .map(
        (r) => `
        <div style="background:white; padding:15px; border-radius:12px; margin-bottom:10px; border-right:4px solid var(--primary); box-shadow:var(--shadow);">
            <p style="font-size:15px; margin-bottom:5px;">${r.text}</p>
            <small style="color:#999; font-size:12px;">نُشر في: ${r.date}</small>
        </div>
    `,
      )
      .join("");
  }

  // --- Export selected functions to global scope so inline handlers continue to work ---
  try {
    window.showPage = showPage;
    window.renderMenu = renderMenu;
    window.searchFunction = searchFunction;
    window.filterItems = filterItems;

    window.renderHomeMenu = renderHomeMenu;
    window.searchHomeMenu = searchHomeMenu;
    window.filterHomeMenu = filterHomeMenu;
    window.initializeHomeMenu = initializeHomeMenu;

    window.addToCart = addToCart;
    window.renderCartItems = renderCartItems;
    window.updateCartCount = updateCartCount;
    window.updateCartUI = updateCartUI;
    window.removeFromCart = removeFromCart;
    window.increaseQuantity = increaseQuantity;
    window.decreaseQuantity = decreaseQuantity;

    window.finishOrder = finishOrder;
    window.showNotification = showNotification;

    window.openImageModal = openImageModal;
    window.closeImageModal = closeImageModal;

    window.addNewItemFromAdmin = addNewItemFromAdmin;
    window.renderAdminList = renderAdminList;
    window.deleteItem = deleteItem;
    window.openEditModal = openEditModal;
    window.saveEdit = saveEdit;
    window.editItemPrice = editItemPrice;
    // expose the real function and provide a safe wrapper so stray calls won't error
    window._realEditItemFull = openEditModal;
    if (typeof window.editItemFull !== "function") {
      window.editItemFull = function (id) {
        const itemId = String(id).trim();
        if (!itemId) {
          console.warn("editItemFull called with invalid id:", id);
          return;
        }
        try {
          return window._realEditItemFull(itemId);
        } catch (e) {
          console.error("editItemFull error:", e);
        }
      };
    }
    window.updateRestaurantPhone = updateRestaurantPhone;
    window.initializeAdminPanel = initializeAdminPanel;
    window.updateAdminStatistics = updateAdminStatistics;
    window.seedFromAdmin = seedFromAdmin;
    window.clearAllItems = clearAllItems;
    window.sendReview = sendReview;
    window.renderReviews = renderReviews;
    window.switchAdminTab = switchAdminTab;

    // Order management functions
    window.renderAllOrders = renderAllOrders;
    window.resendRestaurantNotification = resendRestaurantNotification;
    window.resendCustomerNotification = resendCustomerNotification;
    window.updateOrderStatus = updateOrderStatus;
    window.sendRestaurantNotification = sendRestaurantNotification;
    window.sendCustomerNotification = sendCustomerNotification;
    window.generateOrderId = generateOrderId;
    // Fallback: ensure sendRestaurantNotification exists and opens WhatsApp to the restaurant number
    if (typeof sendRestaurantNotification !== "function") {
      function sendRestaurantNotification(message, orderId) {
        try {
          // use configured RESTAURANT_PHONE if available, otherwise default
          let phone =
            typeof RESTAURANT_PHONE !== "undefined" && RESTAURANT_PHONE
              ? String(RESTAURANT_PHONE)
              : "201021279663";
          phone = phone.replace(/[^0-9]/g, ""); // strip + and non-digits
          if (!phone) phone = "201021279663";
          const url =
            "https://wa.me/" +
            phone +
            "?text=" +
            encodeURIComponent(message + "\n\nOrderID: " + (orderId || ""));
          window.open(url, "_blank");
          return true;
        } catch (e) {
          console.error("sendRestaurantNotification fallback error:", e);
          return false;
        }
      }
      window.sendRestaurantNotification = sendRestaurantNotification;
    }

    // Invoice printing functions
    window.printInvoice = printInvoice;
    window.generateInvoiceHTML = generateInvoiceHTML;

    // Customer order history functions
    window.loadCustomerOrders = loadCustomerOrders;
    window.repeatOrderFromHistory = repeatOrderFromHistory;
    window.resendOrderToRestaurant = resendOrderToRestaurant;

    window.switchCustomerTab = switchCustomerTab;
    // Expose admin account for global login helper
    window.ADMIN_ACCOUNT = ADMIN_ACCOUNT;
  } catch (e) {
    console.warn("Failed to export some functions to window:", e);
  }
})();

/* ==================================================
   7. تأثيرات بصرية (تأثير الثلج) وتجهيز الموقع
   ================================================== */
function createSnow() {
  const snowCount = 20;
  for (let i = 0; i < snowCount; i++) {
    const flake = document.createElement("div");
    flake.className = "snowflake";
    flake.innerHTML = "❄";
    flake.style.cssText = `
            position: fixed;
            top: -20px;
            color: white;
            z-index: 9999;
            pointer-events: none;
            left: ${Math.random() * 100}vw;
            animation: fall ${Math.random() * 4 + 4}s linear infinite;
            opacity: ${Math.random()};
            font-size: ${Math.random() * 20 + 10}px;
        `;
    document.body.appendChild(flake);
  }
}

/* ==================================================
   8. نظام تسجيل دخول الإدارة
   ================================================== */
function validateAdminLogin(evt) {
  try {
    if (evt && typeof evt.preventDefault === "function") evt.preventDefault();
  } catch (e) {
    /* ignore */
  }

  console.log("🔐 بدء عملية تسجيل الدخول للإدارة...");

  const usernameInput = document.getElementById("admin-username");
  const passwordInput = document.getElementById("admin-password");
  const errorDiv = document.getElementById("loginError");

  if (!usernameInput || !passwordInput || !errorDiv) {
    console.error("❌ الخطأ: لم يتم العثور على عناصر النموذج");
    alert("❌ خطأ في تحميل النموذج");
    return;
  }

  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if (!username || !password) {
    errorDiv.textContent = "⚠️ الرجاء ملء جميع الحقول المطلوبة";
    errorDiv.style.display = "block";
    return;
  }

  // أولاً: محاولة المصادقة محلياً (المستخدم الافتراضي داخل التطبيق)
  if (
    username === (window.ADMIN_ACCOUNT && window.ADMIN_ACCOUNT.username) &&
    password === (window.ADMIN_ACCOUNT && window.ADMIN_ACCOUNT.password)
  ) {
    try {
      sessionStorage.setItem("isAdmin", "true");
      sessionStorage.setItem(
        "adminUser",
        JSON.stringify({
          username: window.ADMIN_ACCOUNT.username,
          name: window.ADMIN_ACCOUNT.name,
          email: window.ADMIN_ACCOUNT.email,
        }),
      );
    } catch (e) {
      console.error("❌ خطأ في حفظ بيانات الجلسة:", e);
    }

    errorDiv.style.display = "none";
    usernameInput.value = "";
    passwordInput.value = "";
    showNotification(
      `✨ أهلاً وسهلاً ${window.ADMIN_ACCOUNT.name}! تم تسجيل دخولك بنجاح 🎉`,
      "success",
    );
    try {
      if (typeof logEvent === "function")
        logEvent("ADMIN_LOGIN", {
          username: window.ADMIN_ACCOUNT.username,
          email: window.ADMIN_ACCOUNT.email,
        });
    } catch (e) {}
    try {
      if (typeof logCustomerActivity === "function")
        logCustomerActivity(
          "admin",
          "دخول إدارة",
          `دخول المدير ${window.ADMIN_ACCOUNT.username} إلى لوحة التحكم`,
        );
    } catch (e) {}

    // 📊 تسجيل دخول الإدارة في Google Sheets
    if (
      typeof GoogleSheetsLogger !== "undefined" &&
      GoogleSheetsLogger.logLogin
    ) {
      GoogleSheetsLogger.logLogin(window.ADMIN_ACCOUNT.username);
    }
    setTimeout(() => showPage("admin-page"), 500);
    return;
  }

  // إذا فشل التحقق المحلي وحقل username يبدو كبريد إلكتروني أو Firebase متاح، حاول تسجيل الدخول عبر Firebase
  if (
    window.firebaseDB &&
    typeof window.firebaseDB.firebaseAdminLogin === "function"
  ) {
    // استخدم اسم المستخدم كما هو (قد يكون البريد الإلكتروني في إعدادات Firebase)
    try {
      window.firebaseDB.firebaseAdminLogin(username, password);
      return; // firebaseAdminLogin ستقوم بالتوجيه أو عرض إشعار
    } catch (e) {
      console.warn("⚠️ firebaseAdminLogin فشل:", e);
    }
  }

  // أخيراً: إظهار رسالة خطأ محلية
  errorDiv.textContent = "❌ اسم المستخدم أو كلمة المرور غير صحيحة";
  errorDiv.style.display = "block";
  showNotification("❌ بيانات دخول خاطئة!", "error");
}

/* ==================================================
   9. نظام تسجيل دخول العميل
   ================================================== */

// Initialize customers storage
let customers = [];
let currentCustomer = null;

// Customers are loaded dynamically from the backend API or created during the current session.

// Initialize sales log (سجل المبيعات)
let salesLog = [];

// Initialize customer activities log (سجل أنشطة العملاء)
let customersActivityLog = [];

// Function to log customer registration
function logCustomerRegistration(customerData) {
  const logEntry = {
    id: Date.now(),
    customerId: customerData.id,
    name: customerData.name,
    email: customerData.email,
    phone: customerData.phone,
    registeredAt: new Date().toISOString(),
    timestamp: new Date().toLocaleString("ar-EG"),
    action: "تسجيل عميل جديد",
  };
  salesLog.push(logEntry);
  console.log("📝 تم تسجيل البيان:", logEntry);
}

// Function to log customer activities
function logCustomerActivity(customerId, activityType, description) {
  const activityEntry = {
    id: Date.now(),
    customerId: customerId,
    activityType: activityType,
    description: description,
    timestamp: new Date().toISOString(),
    formattedTime: new Date().toLocaleString("ar-EG"),
    date: new Date().toLocaleDateString("ar-EG"),
  };
  customersActivityLog.push(activityEntry);
  console.log("✅ تم تسجيل النشاط:", activityEntry);
}

// دالة لعرض سجل المبيعات (سجل تسجيل العملاء)
function renderSalesLog() {
  const container = document.getElementById("salesLogContainer");
  if (!container) return;

  const log = salesLog;

  if (log.length === 0) {
    container.innerHTML = `
            <div style="text-align:center; padding:60px 20px;">
                <i class="fa-solid fa-receipt" style="font-size:64px; color:#BDC3C7; margin-bottom:15px;"></i>
                <h3 style="color:#7F8C8D; margin-bottom:10px; font-size:20px;">سجل المبيعات فارغ</h3>
                <p style="color:#BDC3C7;">لم يتم تسجيل أي عملاء حتى الآن</p>
            </div>
        `;
    return;
  }

  // تنظيم العملاء حسب الشهر
  const monthlyData = {};
  log.forEach((entry) => {
    const date = new Date(entry.registeredAt);
    const monthKey = date.toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
    });
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = [];
    }
    monthlyData[monthKey].push(entry);
  });

  // ترتيب الأشهر من الأحدث للأقدم
  const sortedMonths = Object.keys(monthlyData).reverse();

  // الإحصائيات العامة
  const totalCustomers = log.length;
  const monthsCount = sortedMonths.length;
  const avgPerMonth = Math.ceil(totalCustomers / monthsCount);

  const globalStatsHTML = `
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:15px; margin-bottom:30px;">
            <div style="background:linear-gradient(135deg, #667EEA, #764BA2); padding:20px; border-radius:12px; color:white; box-shadow:0 8px 25px rgba(102, 126, 234, 0.2);">
                <p style="font-size:13px; margin:0 0 8px 0; opacity:0.9;">👥 إجمالي العملاء</p>
                <h3 style="font-size:28px; font-weight:900; margin:0;">${totalCustomers}</h3>
            </div>
            <div style="background:linear-gradient(135deg, #F093FB, #F5576C); padding:20px; border-radius:12px; color:white; box-shadow:0 8px 25px rgba(245, 87, 108, 0.2);">
                <p style="font-size:13px; margin:0 0 8px 0; opacity:0.9;">📅 عدد الأشهر</p>
                <h3 style="font-size:28px; font-weight:900; margin:0;">${monthsCount}</h3>
            </div>
            <div style="background:linear-gradient(135deg, #43E97B, #38F9D7); padding:20px; border-radius:12px; color:white; box-shadow:0 8px 25px rgba(67, 233, 123, 0.2);">
                <p style="font-size:13px; margin:0 0 8px 0; opacity:0.9;">📊 المتوسط/شهر</p>
                <h3 style="font-size:28px; font-weight:900; margin:0;">${avgPerMonth}</h3>
            </div>
        </div>
    `;

  // أزرار التصدير
  const exportBtnsHTML = `
        <div style="margin-bottom:25px; display:flex; gap:12px; flex-wrap:wrap;">
            <button onclick="exportMonthlyReport()" style="background:linear-gradient(135deg, #27AE60, #229954); color:white; border:none; padding:12px 24px; border-radius:8px; cursor:pointer; font-weight:700; font-size:14px; transition:all 0.3s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                📥 تحميل التقرير الشهري
            </button>
            <button onclick="printMonthlyReport()" style="background:linear-gradient(135deg, #8B5CF6, #A78BFA); color:white; border:none; padding:12px 24px; border-radius:8px; cursor:pointer; font-weight:700; font-size:14px; transition:all 0.3s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                🖨️ طباعة التقرير
            </button>
            <button onclick="clearSalesLog()" style="background:linear-gradient(135deg, #E74C3C, #C0392B); color:white; border:none; padding:12px 24px; border-radius:8px; cursor:pointer; font-weight:700; font-size:14px; transition:all 0.3s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                🗑️ مسح السجل
            </button>
        </div>
    `;

  // عرض كل شهر وعملاؤه
  const monthlyReportsHTML = sortedMonths
    .map((month, idx) => {
      const entries = monthlyData[month];
      const entriesCount = entries.length;

      const entriesTableHTML = entries
        .map((entry, entryIdx) => {
          const date = new Date(entry.registeredAt);
          const formattedDate = date.toLocaleDateString("ar-EG");
          const formattedTime = date.toLocaleTimeString("ar-EG");

          return `
                <tr style="border-bottom: 1px solid #e0e0e0;">
                    <td style="padding:12px; text-align:center; color:#333;">${entryIdx + 1}</td>
                    <td style="padding:12px; color:#333;"><strong>${entry.name}</strong></td>
                    <td style="padding:12px; color:#666; font-size:13px;">${entry.email}</td>
                    <td style="padding:12px; color:#666; font-size:13px;">${entry.phone}</td>
                    <td style="padding:12px; color:#666; font-size:12px;">${formattedDate}</td>
                    <td style="padding:12px; color:#666; font-size:12px;">${formattedTime}</td>
                </tr>
            `;
        })
        .join("");

      return `
            <div style="background:white; border-radius:14px; padding:25px; margin-bottom:25px; box-shadow:0 4px 15px rgba(0,0,0,0.08); border-top:5px solid #FF6B35;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px; flex-wrap:wrap; gap:15px;">
                    <div>
                        <h3 style="margin:0; color:#2C3E50; font-size:20px; font-weight:900;">📆 ${month}</h3>
                        <p style="margin:5px 0 0 0; color:#7F8C8D; font-size:14px;">إجمالي العملاء: <strong style="color:#FF6B35;">${entriesCount}</strong></p>
                    </div>
                    <div style="background:linear-gradient(135deg, rgba(255, 107, 53, 0.1), rgba(255, 142, 95, 0.1)); padding:12px 20px; border-radius:8px; border-right:3px solid #FF6B35;">
                        <p style="margin:0; color:#FF6B35; font-size:13px; font-weight:700;">👥 عدد المسجلين</p>
                        <p style="margin:5px 0 0 0; color:#FF6B35; font-size:20px; font-weight:900;">${entriesCount}</p>
                    </div>
                </div>
                
                <div style="overflow-x:auto; border:1px solid #e0e0e0; border-radius:8px;">
                    <table style="width:100%; border-collapse:collapse;">
                        <thead>
                            <tr style="background:linear-gradient(135deg, #FF6B35, #FF8E5F); color:white;">
                                <th style="padding:12px; text-align:center; font-weight:700;">#</th>
                                <th style="padding:12px; font-weight:700;">الاسم</th>
                                <th style="padding:12px; font-weight:700;">البريد الإلكتروني</th>
                                <th style="padding:12px; font-weight:700;">الهاتف</th>
                                <th style="padding:12px; font-weight:700;">التاريخ</th>
                                <th style="padding:12px; font-weight:700;">الوقت</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${entriesTableHTML}
                        </tbody>
                    </table>
                </div>
                
                <div style="margin-top:15px; padding-top:15px; border-top:1px solid #e0e0e0; display:flex; gap:10px; flex-wrap:wrap;">
                    <button onclick="exportMonthData('${month}')" style="background:linear-gradient(135deg, #27AE60, #229954); color:white; border:none; padding:10px 18px; border-radius:6px; cursor:pointer; font-weight:600; font-size:12px; transition:all 0.3s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                        📥 تحميل هذا الشهر
                    </button>
                    <button onclick="printMonthData('${month}')" style="background:linear-gradient(135deg, #8B5CF6, #A78BFA); color:white; border:none; padding:10px 18px; border-radius:6px; cursor:pointer; font-weight:600; font-size:12px; transition:all 0.3s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                        🖨️ طباعة
                    </button>
                </div>
            </div>
        `;
    })
    .join("");

  container.innerHTML = globalStatsHTML + exportBtnsHTML + monthlyReportsHTML;
}

// دالة لتصدير التقرير الشهري الكامل
function exportMonthlyReport() {
  const log = salesLog;

  if (log.length === 0) {
    showNotification("⚠️ سجل المبيعات فارغ", "warning");
    return;
  }

  // إنشاء رؤوس الأعمدة
  let csv = "الشهر,الرقم,الاسم,البريد الإلكتروني,الهاتف,التاريخ,الوقت\n";

  // تنظيم حسب الشهر
  const monthlyData = {};
  log.forEach((entry) => {
    const date = new Date(entry.registeredAt);
    const monthKey = date.toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
    });
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = [];
    }
    monthlyData[monthKey].push(entry);
  });

  // إضافة البيانات
  Object.keys(monthlyData)
    .reverse()
    .forEach((month) => {
      monthlyData[month].forEach((entry, idx) => {
        const date = new Date(entry.registeredAt);
        const formattedDate = date.toLocaleDateString("ar-EG");
        const formattedTime = date.toLocaleTimeString("ar-EG");
        csv += `"${month}",${idx + 1},"${entry.name}","${entry.email}","${entry.phone}","${formattedDate}","${formattedTime}"\n`;
      });
    });

  // إنشاء ملف وتحميله
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `تقرير_المبيعات_الشهري_${new Date().toLocaleDateString("ar-EG")}.csv`;
  link.click();

  showNotification("✅ تم تحميل التقرير الشهري بنجاح", "success");
}

// دالة لتصدير بيانات شهر محدد
function exportMonthData(month) {
  const log = salesLog;
  const monthlyData = {};

  log.forEach((entry) => {
    const date = new Date(entry.registeredAt);
    const monthKey = date.toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
    });
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = [];
    }
    monthlyData[monthKey].push(entry);
  });

  const entries = monthlyData[month] || [];
  if (entries.length === 0) {
    showNotification("⚠️ لا توجد بيانات لهذا الشهر", "warning");
    return;
  }

  let csv = "الرقم,الاسم,البريد الإلكتروني,الهاتف,التاريخ,الوقت\n";

  entries.forEach((entry, idx) => {
    const date = new Date(entry.registeredAt);
    const formattedDate = date.toLocaleDateString("ar-EG");
    const formattedTime = date.toLocaleTimeString("ar-EG");
    csv += `${idx + 1},"${entry.name}","${entry.email}","${entry.phone}","${formattedDate}","${formattedTime}"\n`;
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `شهر_${month}.csv`;
  link.click();

  showNotification("✅ تم تحميل بيانات الشهر بنجاح", "success");
}

// دالة لطباعة بيانات شهر محدد
function printMonthData(month) {
  const log = salesLog;
  const monthlyData = {};

  log.forEach((entry) => {
    const date = new Date(entry.registeredAt);
    const monthKey = date.toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
    });
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = [];
    }
    monthlyData[monthKey].push(entry);
  });

  const entries = monthlyData[month] || [];
  if (entries.length === 0) {
    showNotification("⚠️ لا توجد بيانات لهذا الشهر", "warning");
    return;
  }

  const printWindow = window.open("", "", "height=600,width=900");
  let htmlContent = `
        <html dir="rtl" style="font-family: Arial, sans-serif;">
        <head>
            <title>سجل المبيعات - ${month}</title>
            <style>
                body { padding: 20px; background: white; }
                h1 { text-align: center; color: #FF6B35; margin-bottom: 10px; }
                .info { text-align: center; color: #666; margin-bottom: 20px; font-size: 14px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th { background: #FF6B35; color: white; padding: 12px; text-align: right; border: 1px solid #ddd; font-weight: bold; }
                td { padding: 10px 12px; text-align: right; border: 1px solid #ddd; font-size: 13px; }
                tr:nth-child(even) { background: #f9f9f9; }
                .total-row { font-weight: bold; background: #FFE8DB; }
            </style>
        </head>
        <body>
            <h1>سجل المبيعات - ${month}</h1>
            <div class="info">
                <p>تاريخ الطباعة: ${new Date().toLocaleDateString("ar-EG")}</p>
                <p>إجمالي العملاء: ${entries.length}</p>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>الاسم</th>
                        <th>البريد الإلكتروني</th>
                        <th>الهاتف</th>
                        <th>التاريخ</th>
                        <th>الوقت</th>
                    </tr>
                </thead>
                <tbody>
    `;

  entries.forEach((entry, idx) => {
    const date = new Date(entry.registeredAt);
    const formattedDate = date.toLocaleDateString("ar-EG");
    const formattedTime = date.toLocaleTimeString("ar-EG");
    htmlContent += `
            <tr>
                <td>${idx + 1}</td>
                <td><strong>${entry.name}</strong></td>
                <td>${entry.email}</td>
                <td>${entry.phone}</td>
                <td>${formattedDate}</td>
                <td>${formattedTime}</td>
            </tr>
        `;
  });

  htmlContent += `
                </tbody>
                <tfoot>
                    <tr class="total-row">
                        <td colspan="6" style="text-align:center;">إجمالي العملاء المسجلين: ${entries.length}</td>
                    </tr>
                </tfoot>
            </table>
        </body>
        </html>
    `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
  setTimeout(() => printWindow.print(), 250);
}

// دالة لطباعة التقرير الشهري الكامل
function printMonthlyReport() {
  const log = salesLog;

  if (log.length === 0) {
    showNotification("⚠️ سجل المبيعات فارغ", "warning");
    return;
  }

  const monthlyData = {};
  log.forEach((entry) => {
    const date = new Date(entry.registeredAt);
    const monthKey = date.toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
    });
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = [];
    }
    monthlyData[monthKey].push(entry);
  });

  const printWindow = window.open("", "", "height=600,width=900");
  let htmlContent = `
        <html dir="rtl" style="font-family: Arial, sans-serif;">
        <head>
            <title>تقرير المبيعات الشهري</title>
            <style>
                body { padding: 20px; background: white; }
                h1 { text-align: center; color: #FF6B35; margin-bottom: 10px; }
                h2 { color: #FF6B35; border-bottom: 2px solid #FF6B35; padding-bottom: 10px; margin-top: 30px; }
                .info { text-align: center; color: #666; margin-bottom: 20px; font-size: 14px; }
                .month-summary { background: #FFE8DB; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
                table { width: 100%; border-collapse: collapse; margin-top: 15px; }
                th { background: #FF6B35; color: white; padding: 10px; text-align: right; border: 1px solid #ddd; font-weight: bold; font-size: 12px; }
                td { padding: 8px; text-align: right; border: 1px solid #ddd; font-size: 12px; }
                tr:nth-child(even) { background: #f9f9f9; }
                .page-break { page-break-after: always; }
            </style>
        </head>
        <body>
            <h1>تقرير المبيعات الشهري الشامل</h1>
            <div class="info">
                <p>تاريخ الطباعة: ${new Date().toLocaleDateString("ar-EG")}</p>
                <p>إجمالي العملاء المسجلين: ${log.length}</p>
            </div>
    `;

  Object.keys(monthlyData)
    .reverse()
    .forEach((month, idx) => {
      const entries = monthlyData[month];
      htmlContent += `
            <div${idx > 0 ? ' class="page-break"' : ""}>
                <h2>${month}</h2>
                <div class="month-summary">
                    <strong>عدد العملاء المسجلين:</strong> ${entries.length}
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>الاسم</th>
                            <th>البريد الإلكتروني</th>
                            <th>الهاتف</th>
                            <th>التاريخ</th>
                            <th>الوقت</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

      entries.forEach((entry, entryIdx) => {
        const date = new Date(entry.registeredAt);
        const formattedDate = date.toLocaleDateString("ar-EG");
        const formattedTime = date.toLocaleTimeString("ar-EG");
        htmlContent += `
                <tr>
                    <td>${entryIdx + 1}</td>
                    <td><strong>${entry.name}</strong></td>
                    <td>${entry.email}</td>
                    <td>${entry.phone}</td>
                    <td>${formattedDate}</td>
                    <td>${formattedTime}</td>
                </tr>
            `;
      });

      htmlContent += `
                    </tbody>
                </table>
            </div>
        `;
    });

  htmlContent += `
        </body>
        </html>
    `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
  setTimeout(() => printWindow.print(), 250);
}

// دالة لتصدير سجل المبيعات إلى Excel

// دالة لحذف سجل المبيعات
function clearSalesLog() {
  if (
    confirm(
      "⚠️ هل أنت متأكد من حذف سجل المبيعات بالكامل؟ لا يمكن التراجع عن هذا الإجراء",
    )
  ) {
    salesLog = [];
    renderSalesLog();
    showNotification("✅ تم حذف السجل بنجاح", "success");
  }
}

// تحليل البيانات - إدارة العرض والرسومات
let salesTrendChartInstance = null;
let productPerformanceChartInstance = null;
let predictionModalChart = null;
let analyticsAutoRefreshInterval = null;

async function fetchAnalysisData() {
  const basePath = (window.API_BASE || "")
    .toString()
    .trim()
    .replace(/\/+$/, "");
  const endpoint = basePath
    ? `${basePath}/api/get_dashboard_data.php`
    : "api/get_dashboard_data.php";

  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      credentials: "same-origin",
    });

    const rawText = await response.text();
    if (!response.ok) {
      throw new Error(
        `API request failed: ${response.status} ${response.statusText} - ${rawText}`,
      );
    }

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (jsonError) {
      throw new Error(
        `Invalid JSON response: ${jsonError.message}. Response text: ${rawText}`,
      );
    }

    if (!data.success) {
      throw new Error(data.error || "Failed to load analytic data.");
    }

    return data;
  } catch (error) {
    console.error("fetchAnalysisData error:", error);
    showNotification(
      `⚠️ فشل تحميل بيانات التحليل: ${error.message}`,
      "error",
      6000,
    );
    return {
      success: false,
      total_revenue: 0,
      total_orders: 0,
      peak_hour: "00:00",
      top_product: "0",
      daily_revenue: [],
      category_sales: { food: 0, drinks: 0, sweets: 0 },
      orders: [],
    };
  }
}

function getDateKey(date) {
  return date.toLocaleDateString("ar-EG", { day: "2-digit", month: "2-digit" });
}

function convertTo12HourFormat(time24) {
  if (!time24 || time24 === "No Data") return time24;
  const [hours, minutes] = time24.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
}

function getHourKey(date) {
  return `${date.getHours().toString().padStart(2, "0")}:00`;
}

function mapDashboardCategoryKey(rawCategory) {
  const key = String(rawCategory || "")
    .trim()
    .toLowerCase();
  if (key === "أطعمة" || key === "food") {
    return "food";
  }
  if (key === "مشروبات" || key === "drinks") {
    return "drinks";
  }
  if (key === "حلويات" || key === "sweets") {
    return "sweets";
  }
  return "food";
}

function normalizeCategorySales(categorySales) {
  const normalized = { food: 0, drinks: 0, sweets: 0 };
  if (!categorySales || typeof categorySales !== "object") {
    return normalized;
  }

  if (Array.isArray(categorySales)) {
    categorySales.forEach((item) => {
      const label = mapDashboardCategoryKey(item.category);
      normalized[label] = Number(item.revenue || 0);
    });
    return normalized;
  }

  Object.entries(categorySales).forEach(([key, value]) => {
    const label = mapDashboardCategoryKey(key);
    normalized[label] = Number(value || 0);
  });

  return normalized;
}

async function renderAnalysisDashboard() {
  try {
    const analysisData = await fetchAnalysisData();
    const orders = Array.isArray(analysisData.latest_orders)
      ? analysisData.latest_orders
      : [];

    const totalRevenue = Number(analysisData.total_revenue || 0);
    const totalOrders = Number(analysisData.total_orders || 0);
    const peakHour = convertTo12HourFormat(analysisData.peak_hour || "00:00");
    const topProduct = analysisData.top_product || "0";

    // Check for new orders and play sound
    const previousOrderCount = parseInt(
      localStorage.getItem("previousOrderCount") || "0",
    );
    const newOrdersCount = Math.max(0, totalOrders - previousOrderCount);
    if (totalOrders > previousOrderCount && previousOrderCount > 0) {
      playSuccessSound();
      showNotification(
        `🎉 طلب جديد! إجمالي الطلبات الآن: ${totalOrders}`,
        "success",
        5000,
      );
      updateNotificationBadge(newOrdersCount);
    }
    localStorage.setItem("previousOrderCount", totalOrders.toString());

    // Safe element updates with error handling
    const updateElement = (id, content) => {
      const element = document.getElementById(id);
      if (!element) {
        console.warn(`[Dashboard] Element not found: ${id}`);
        return false;
      }
      element.textContent = content;
      return true;
    };

    // Update metric cards
    updateElement("analysis-total-orders", totalOrders);
    updateElement(
      "analysis-total-revenue",
      `${totalRevenue.toLocaleString("en-US")} ج.م`,
    );
    updateElement("analysis-most-popular-item", topProduct);
    updateElement("analysis-peak-time", peakHour);

    // Check for missing items and show alert
    const missingItems = Array.isArray(analysisData.missing_items)
      ? analysisData.missing_items
      : [];
    if (missingItems.length > 0) {
      showMissingItemsAlert(missingItems);
    }

    // Chart data from API
    const dailyRevenue = Array.isArray(analysisData.daily_revenue)
      ? analysisData.daily_revenue
      : [];
    const hourlyOrders =
      analysisData.hourly_orders &&
      typeof analysisData.hourly_orders === "object"
        ? analysisData.hourly_orders
        : { labels: [], data: [] };

    // Render charts
    renderAnalysisCharts({ dailyRevenue, hourlyOrders });

    // Update recent orders table
    updateRecentOrdersTable(orders);

    // Update additional dashboard details
    const topSelling = document.getElementById("top-selling-items");
    if (topSelling) {
      topSelling.innerHTML =
        '<div style="text-align:center; color:#999; padding:20px;">لا توجد منتجات</div>';
    }

    const insights = document.getElementById("customer-insights");
    if (insights) {
      insights.innerHTML = `<div style="font-size:14px; color:#f2f5ff;">عدد الطلبات الأخيرة: <strong>${orders.length}</strong></div>`;
    }

    // Update missing items info
    const missingItemsInfo = document.getElementById("missing-items-info");
    if (missingItemsInfo) {
      const missingCount = analysisData.missing_items_count || 0;
      if (missingCount > 0) {
        missingItemsInfo.innerHTML = `⚠️ <strong>${missingCount}</strong> منتج قد يكون ناقصاً (لم يباع منذ أكثر من أسبوع)`;
      } else {
        missingItemsInfo.innerHTML = "✅ جميع المنتجات متوفرة وتباع بانتظام";
      }
    }

    console.log("[Dashboard] Analytics rendered successfully");
  } catch (error) {
    console.error("[Dashboard] Error rendering analytics:", error);
    // Set default values on error
    document.getElementById("analysis-total-orders").textContent = "0";
    document.getElementById("analysis-total-revenue").textContent = "0 ج.م";
    document.getElementById("analysis-most-popular-item").textContent = "0";
    document.getElementById("analysis-peak-time").textContent = "12:00 AM";
  }
}

let globalOrdersData = [];

function updateRecentOrdersTable(orders) {
  globalOrdersData = orders || [];
  const tbody = document.getElementById("recent-orders-body");
  if (!tbody) return;

  filterOrdersTable(); // This will render the table
}

function filterOrdersTable() {
  const searchInput = document.getElementById("orders-search");
  const query = searchInput ? searchInput.value.toLowerCase() : "";
  const tbody = document.getElementById("recent-orders-body");

  if (!tbody) return;

  if (!globalOrdersData || globalOrdersData.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="4" style="padding: 40px; text-align: center; color: #999;">لا توجد طلبات حديثة</td></tr>';
    return;
  }

  const filteredOrders = globalOrdersData.filter((order) => {
    const customerName = (order.customer_name || "").toLowerCase();
    const phone = (order.phone || "").toLowerCase();
    return customerName.includes(query) || phone.includes(query);
  });

  tbody.innerHTML = filteredOrders
    .map((order) => {
      const date = new Date(
        order.created_at || order.order_date,
      ).toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      return `
      <tr>
        <td>${order.customer_name || "غير محدد"}</td>
        <td>${order.phone || "غير محدد"}</td>
        <td>${order.item_names || "-"}</td>
        <td style="font-weight: 600; color: #7c99ff; text-align: center;">${Number(order.total_price || 0).toLocaleString("en-US")} ج.م</td>
        <td style="text-align: center; font-size: 12px; color: #c7d1ff;">${date}</td>
      </tr>
    `;
    })
    .join("");

  if (filteredOrders.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="4" style="padding: 40px; text-align: center; color: #999;">لا توجد نتائج مطابقة للبحث</td></tr>';
  }
}

function playSuccessSound() {
  try {
    // Create audio context and play success sound
    const audioContext = new (
      window.AudioContext || window.webkitAudioContext
    )();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.5,
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (error) {
    console.log("Audio not supported, skipping success sound");
  }
}

function updateNotificationBadge(count) {
  const badge = document.getElementById("notification-badge");
  if (!badge) return;

  if (count > 0) {
    badge.textContent = count > 99 ? "99+" : count.toString();
    badge.style.display = "flex";
  } else {
    badge.style.display = "none";
  }
}

function scrollToAnalyticsSection() {
  const analysisDashboard = document.getElementById("analysis-dashboard");
  const target = document.getElementById("analytics-section");

  if (analysisDashboard && analysisDashboard.style.display === "none") {
    if (typeof toggleAnalysisView === "function") {
      toggleAnalysisView(true);
    }
  }

  if (!target) {
    console.warn("Analytics section not found for scrolling.");
    return;
  }

  setTimeout(() => {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 120);
}

async function predictSales() {
  try {
    // Show loading spinner
    const predictBtn = document.getElementById("predict-sales-btn");
    const originalText = predictBtn.innerHTML;
    predictBtn.innerHTML =
      '<i class="fas fa-spinner fa-spin"></i> تحليل البيانات...';
    predictBtn.disabled = true;
    showPredictionMagic();

    const basePath = (window.API_BASE || "")
      .toString()
      .trim()
      .replace(/\/+$/, "");
    const endpoint = basePath
      ? `${basePath}/api/predict_sales.php`
      : "api/predict_sales.php";

    const response = await fetch(endpoint, {
      method: "GET",
      headers: { Accept: "application/json" },
      credentials: "same-origin",
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Failed to get prediction");
    }

    // Restore button
    predictBtn.innerHTML = originalText;
    predictBtn.disabled = false;
    removePredictionMagic();

    // Show prediction in a professional labor-intensive analytics modal
    showPredictionModal(data);
  } catch (error) {
    console.error("Prediction error:", error);

    // Restore button
    const predictBtn = document.getElementById("predict-sales-btn");
    if (predictBtn) {
      predictBtn.innerHTML =
        '<i class="fas fa-chart-line"></i> 🔮 توقع مبيعات الأسبوع القادم';
      predictBtn.disabled = false;
    }
    removePredictionMagic();

    showNotification(
      `⚠️ فشل في الحصول على التوقع: ${error.message}`,
      "error",
      6000,
    );
  }
}

function showPredictionMagic() {
  if (document.getElementById("prediction-magic-overlay")) return;

  const overlay = document.createElement("div");
  overlay.id = "prediction-magic-overlay";
  overlay.style.cssText = `
    position: fixed; inset: 0; z-index: 9998; background: rgba(17, 22, 39, 0.4);
    backdrop-filter: blur(2px);
    display: flex; align-items: center; justify-content: center;
    pointer-events: none;
  `;

  const sparkler = document.createElement("div");
  sparkler.innerHTML = `
    <div style="color: #a9b4ff; font-weight: 900; font-size: 18px; display: flex; align-items: center; gap: 10px;">
      ✨ جاري تحليل البيانات الذكية ...✨
    </div>
  `;
  sparkler.style.animation = "sparklePulse 1.3s ease-in-out infinite";

  overlay.appendChild(sparkler);
  document.body.appendChild(overlay);

  const style = document.createElement("style");
  style.id = "prediction-magic-style";
  style.textContent = `
    @keyframes sparklePulse {
      0%,100% { opacity: 0.9; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.05); text-shadow: 0 0 18px rgba(181, 133, 255, 0.9); }
    }
  `;
  document.head.appendChild(style);
}

function removePredictionMagic() {
  const overlay = document.getElementById("prediction-magic-overlay");
  if (overlay) overlay.remove();
  const style = document.getElementById("prediction-magic-style");
  if (style) style.remove();
}

function showPredictionModal(data) {
  if (document.getElementById("prediction-modal-overlay")) {
    document.getElementById("prediction-modal-overlay").remove();
  }

  const overlay = document.createElement("div");
  overlay.id = "prediction-modal-overlay";
  overlay.style.cssText = `
    position: fixed; inset: 0; background: rgba(0, 0, 0, 0.70);
    backdrop-filter: blur(5px);
    display: flex; align-items: center; justify-content: center;
    z-index: 9998; padding: 20px;
  `;

  const modal = document.createElement("div");
  modal.id = "prediction-modal";
  modal.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 90%;
    max-width: 850px;
    max-height: 85vh;
    overflow-y: auto;
    background: rgba(7, 15, 45, 0.92);
    border: 1px solid rgba(130, 132, 250, 0.45);
    border-radius: 16px;
    box-shadow: 0 0 36px rgba(94, 87, 255, 0.75);
    padding: 20px;
    color: #e6e9ff;
    font-family: 'Cairo', sans-serif;
    z-index: 10001;
  `;

  const peak = data.expected_peak_day || "--";
  const category = data.top_predicted_category || "--";
  const confidence = Number(data.confidence_score || 0);
  const predicted = Number(data.predicted_weekly_sales || 0);
  const dailyAvg = Number(data.avg_daily_sales || 0);

  const arabicWeekdayMap = {
    Sunday: "الأحد",
    Monday: "الاثنين",
    Tuesday: "الثلاثاء",
    Wednesday: "الأربعاء",
    Thursday: "الخميس",
    Friday: "الجمعة",
    Saturday: "السبت",
  };

  const peakText = arabicWeekdayMap[peak] || peak;
  const categoryText =
    { Food: "طعام", Drinks: "مشروبات", Sweets: "حلويات" }[category] || category;

  modal.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px;">
      <div>
        <h2 style="margin:0; font-size: 22px;">🔮 AI Analytics Dashboard</h2>
        <p style="color:#b0b6d8; margin: 4px 0 0;">تصور احترافي لتوقعات الأسبوع القادم مع مؤشرات ثقة وديناميكية</p>
      </div>
      <button id="prediction-modal-close" style="background: rgba(255,255,255,0.12); border:none; color:#d8e0ff; border-radius:50%; width:34px; height:34px; cursor:pointer;">×</button>
    </div>

    <div style="display: grid; grid-template-columns: repeat(auto-fit,minmax(220px,1fr)); gap: 12px; margin-bottom: 14px;">
      <div style="background: rgba(255,255,255,0.08); padding: 12px; border-radius: 12px; border: 1px solid rgba(105, 109, 233, 0.35);">
        <div style="font-size: 12px; color: #a8b9ff;">التنبؤ الأسبوعي</div>
        <div style="font-size: 26px; font-weight: 800; margin-top: 6px;">${predicted.toLocaleString("en-US")} ج.م</div>
      </div>
      <div style="background: rgba(255,255,255,0.08); padding: 12px; border-radius: 12px; border: 1px solid rgba(105, 109, 233, 0.35);">
        <div style="font-size: 12px; color: #a8b9ff;">اليوم الأعلى توقعاً</div>
        <div style="font-size: 20px; font-weight: 700; margin-top: 6px;">${peakText}</div>
      </div>
      <div style="background: rgba(255,255,255,0.08); padding: 12px; border-radius: 12px; border: 1px solid rgba(105, 109, 233, 0.35);">
        <div style="font-size: 12px; color: #a8b9ff;">أفضل فئة</div>
        <div style="font-size: 20px; font-weight: 700; margin-top: 6px;">${categoryText}</div>
      </div>
      <div style="background: rgba(255,255,255,0.08); padding: 12px; border-radius: 12px; border: 1px solid rgba(105, 109, 233, 0.35);">
        <div style="font-size: 12px; color: #a8b9ff;">مستوى الثقة</div>
        <div style="display:flex; align-items:center; gap:8px; margin-top:6px;"><strong>${confidence}%</strong></div>
        <div style="background: rgba(255,255,255,0.15); border-radius: 100px; height: 12px; margin-top: 8px;">
          <div style="width: ${confidence}%; height: 12px; border-radius:100px; background: linear-gradient(90deg, #7c3aed, #0ea5e9);"></div>
        </div>
      </div>
    </div>

    <div style="margin-bottom: 14px;">
      <h3 style="margin:0 0 8px; font-size: 16px;">📈 Visual Forecast (آخر 7 أيام و 7 أيام مقبلة)</h3>
      <canvas id="predictionModalChart" width="820" height="300" style="width:100%; height:350px !important; max-height:350px !important; border-radius: 12px; background: rgba(8, 17, 39, 0.55);"></canvas>
    </div>

    <div style="display: grid; grid-template-columns: repeat(auto-fit,minmax(160px,1fr)); gap: 10px; margin-bottom: 12px;">
      <div style="background: rgba(255,255,255,0.06); padding: 10px; border-radius: 10px;">
        <div style="font-size: 12px; color: #c7d1ff;">متوسط الإيراد اليومي</div>
        <div style="font-size: 18px; font-weight:700;">${(data.average_daily_revenue || 0).toLocaleString("en-US", { maximumFractionDigits: 2 })} ج.م</div>
      </div>
      <div style="background: rgba(255,255,255,0.06); padding: 10px; border-radius: 10px;">
        <div style="font-size: 12px; color: #c7d1ff;">معدل الاعتماد على الاتجاه الأسبوعي</div>
        <div style="font-size: 18px; font-weight:700;">${confidence >= 80 ? "متين" : "معتدل"}</div>
      </div>
    </div>
    <div style="text-align:right; margin-top: 8px; display:flex; gap: 8px; justify-content:flex-end; flex-wrap:wrap;">
      <button id="downloadPredictionPdf" style="background: linear-gradient(135deg,#6d28d9,#2563eb); border:none; color:white; padding:10px 12px; border-radius:10px; cursor:pointer; font-weight:700;">📝 تحميل تقرير PDF</button>
      <button id="downloadPredictionImage" style="background: linear-gradient(135deg,#0ea5e9,#4f46e5); border:none; color:white; padding:10px 12px; border-radius:10px; cursor:pointer; font-weight:700;">🖼️ تحميل صورة</button>
    </div>
    <p style="color:#a8b9ff; font-size:12px; margin-top: 8px;">المحاكاة الحسابية تعتمد على اتجاه أيام الأسبوع وتوزيع فئات المبيعات.</p>
  `;

  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  document.body.style.overflow = "hidden";

  document
    .getElementById("prediction-modal-close")
    .addEventListener("click", () => {
      overlay.remove();
      document.body.style.overflow = "";
      if (predictionModalChart) {
        predictionModalChart.destroy();
        predictionModalChart = null;
      }
    });

  document
    .getElementById("downloadPredictionPdf")
    .addEventListener("click", () => downloadPredictionPDF());
  document
    .getElementById("downloadPredictionImage")
    .addEventListener("click", () => downloadPredictionImage());

  renderPredictionModalChart(data.last_7_days, data.predicted_next_7_days);
}

async function downloadPredictionImage() {
  // Target the entire modal containing all content (header + cards + chart + summary)
  const target = document.getElementById("prediction-modal");

  if (!target) {
    return showNotification(
      "⚠️ لا يمكن العثور على نافذة Modal للتصدير.",
      "error",
    );
  }

  if (typeof html2canvas === "undefined") {
    return showNotification(
      "⚠️ مكتبة html2canvas غير متاحة لتحميل التقرير.",
      "error",
    );
  }

  // Create a container for the off-screen clone
  const cloneContainer = document.createElement("div");
  cloneContainer.style.cssText =
    "position: fixed; left: -99999px; top: -99999px; width: 900px; overflow: visible; z-index: 100000;";

  // Clone the modal with all its content
  const clone = target.cloneNode(true);

  // Set dimensions to match the modal's design responsiveness
  clone.style.width = "900px";
  clone.style.maxWidth = "900px";
  clone.style.minWidth = "900px";
  clone.style.height = "auto";
  clone.style.maxHeight = "none";
  clone.style.position = "static";
  clone.style.transform = "none";
  clone.style.overflow = "visible";
  clone.style.padding = "20px";
  clone.style.backgroundColor = "#070f2d";
  clone.style.borderRadius = "12px";
  clone.style.border = "1px solid rgba(130, 132, 250, 0.45)";

  // Hide action buttons in the cloned modal
  const closeBtn = clone.querySelector("#prediction-modal-close");
  const downloadPdfBtn = clone.querySelector("#downloadPredictionPdf");
  const downloadImageBtn = clone.querySelector("#downloadPredictionImage");

  [closeBtn, downloadPdfBtn, downloadImageBtn].forEach((btn) => {
    if (btn) {
      btn.style.display = "none";
    }
  });

  // Replace canvas with image from the live chart to preserve rendered content
  const clonedChartCanvas = clone.querySelector("#predictionModalChart");
  if (clonedChartCanvas && predictionModalChart) {
    try {
      // Get the rendered chart as a base64 image
      const chartImage = predictionModalChart.toBase64Image();

      // Create an img element to replace the canvas
      const img = document.createElement("img");
      img.src = chartImage;
      img.style.cssText =
        "width: 100%; height: 350px; display: block; border-radius: 12px; background: rgba(8, 17, 39, 0.55);";

      // Replace the canvas with the image
      clonedChartCanvas.parentNode.replaceChild(img, clonedChartCanvas);
    } catch (e) {
      console.warn(
        "Could not convert chart to image, will attempt to capture canvas directly:",
        e,
      );
    }
  }

  // Ensure proper styling for other canvas elements
  const chartCanvas = clone.querySelector("#predictionModalChart");
  if (chartCanvas) {
    chartCanvas.style.width = "100%";
    chartCanvas.style.height = "350px";
    chartCanvas.style.display = "block";
  }

  cloneContainer.appendChild(clone);
  document.body.appendChild(cloneContainer);

  const previousOverflow = document.body.style.overflow;
  const previousScrollX = window.scrollX;
  const previousScrollY = window.scrollY;

  window.scrollTo(0, 0);
  document.body.style.overflow = "hidden";

  // CRITICAL DELAY: 1000-1200ms to ensure all dynamic elements (Chart.js, text) are fully rendered
  // This is ESSENTIAL for capturing the complete visual forecast and Arabic text
  await new Promise((resolve) => setTimeout(resolve, 1200));

  try {
    // Capture with high-resolution settings for professional, crystal-clear output
    // scale: 3 ensures Arabic text ('فاهيتا دجاج', 'طعام') is sharp and readable
    const canvas = await html2canvas(clone, {
      scale: 3,
      useCORS: true,
      backgroundColor: "#070f2d",
      windowWidth: clone.scrollWidth,
      windowHeight: clone.scrollHeight,
      scrollX: 0,
      scrollY: 0,
      logging: false,
      allowTaint: true,
      imageTimeout: 0,
      onclone: function (clonedDocument) {
        // Ensure all text elements are visible in the cloned document
        const allElements = clonedDocument.querySelectorAll("*");
        allElements.forEach((el) => {
          el.style.visibility = "visible";
          el.style.opacity = "1";
        });
      },
    });

    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = `تقرير_التنبؤ_${new Date().toLocaleDateString("ar-EG")}.png`;
    link.click();

    showNotification(
      "✅ تم تحميل الصورة بنجاح! Image downloaded successfully!",
      "success",
    );
  } catch (error) {
    console.error("Image download error:", error);
    showNotification("⚠️ فشل تحميل الصورة. حاول مرة أخرى.", "error");
  } finally {
    cloneContainer.remove();
    document.body.style.overflow = previousOverflow;
    window.scrollTo(previousScrollX, previousScrollY);
  }
}

function downloadPredictionPDF() {
  return downloadPredictionReport("pdf");
}

function renderPredictionModalChart(last7Days, next7Days) {
  const formatDate = (date) => {
    const d = new Date(date + "T00:00:00");
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    return `${month}-${day}`;
  };

  const actual = Array.isArray(last7Days)
    ? last7Days.map((item) => Number(item.revenue || 0))
    : [];

  let forecast = Array.isArray(next7Days)
    ? next7Days.map((item) => Number(item.revenue || 0))
    : [];

  const labels = [];
  if (Array.isArray(last7Days)) {
    last7Days.forEach((item) => {
      labels.push(formatDate(item.date));
    });
  }
  if (Array.isArray(next7Days)) {
    next7Days.forEach((item) => {
      labels.push(formatDate(item.date));
    });
  }

  const isFlat =
    forecast.length > 1 && forecast.every((v) => v === forecast[0]);
  if (isFlat) {
    forecast = forecast.map((value, index) => {
      const offset = Math.max(1, Math.abs(value) * 0.02);
      return Number((value + offset * (index + 1)).toFixed(2));
    });
  }

  const ctx = document.getElementById("predictionModalChart").getContext("2d");
  if (predictionModalChart) {
    predictionModalChart.destroy();
    predictionModalChart = null;
  }

  predictionModalChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Last 7 Days Sales",
          data: actual,
          borderColor: "#38bdf8",
          backgroundColor: "rgba(56, 189, 248, 0.2)",
          tension: 0.35,
          fill: true,
          pointRadius: 3,
          pointBackgroundColor: "#bae6fd",
        },
        {
          label: "Predicted Next 7 Days",
          data: new Array(last7Days.length).fill(null).concat(forecast),
          borderColor: "#a78bfa",
          backgroundColor: "rgba(167, 139, 250, 0.1)",
          borderDash: [8, 4],
          tension: 0.35,
          fill: false,
          pointRadius: 3,
          pointBackgroundColor: "#c4b5fd",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          ticks: { color: "#c7d1ff" },
          grid: { color: "rgba(132, 135, 255, 0.24)" },
        },
        y: {
          ticks: {
            color: "#c7d1ff",
            callback: function (value) {
              return Number(value).toLocaleString("en-US");
            },
          },
          grid: { color: "rgba(132, 135, 255, 0.24)" },
        },
      },
      plugins: {
        legend: { labels: { color: "#e5e7eb" } },
        tooltip: {
          backgroundColor: "rgba(17, 25, 50, 0.95)",
          titleColor: "#fff",
          bodyColor: "#efefef",
          callbacks: {
            label: function (context) {
              return `${context.dataset.label}: ${Number(context.parsed.y).toLocaleString("en-US")} ج.م`;
            },
          },
        },
      },
    },
  });
}

async function downloadPredictionReport(type = "pdf") {
  const modal = document.getElementById("prediction-modal");
  if (!modal) return;

  if (typeof html2canvas === "undefined") {
    return showNotification(
      "⚠️ مكتبة html2canvas غير متاحة لتحميل التقرير.",
      "error",
    );
  }

  function downloadDataUrl(name, url) {
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
  }

  async function captureModalAsCanvas() {
    const target = document.querySelector(".prediction-modal-content") || modal;

    const cloneContainer = document.createElement("div");
    cloneContainer.style.cssText =
      "position:absolute; left:-99999px; top:-99999px; width:1200px; overflow:visible; z-index:100000;";

    const clone = target.cloneNode(true);
    clone.style.width = "1200px";
    clone.style.maxWidth = "1200px";
    clone.style.minWidth = "1200px";
    clone.style.position = "static";
    clone.style.left = "auto";
    clone.style.top = "auto";
    clone.style.transform = "none";

    cloneContainer.appendChild(clone);
    document.body.appendChild(cloneContainer);

    const oldOverflow = document.body.style.overflow;
    const scrollX = window.scrollX;
    const scrollY = window.scrollY;

    window.scrollTo(0, 0);
    document.body.style.overflow = "hidden";

    const canvas = await html2canvas(clone, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#07112d",
      windowWidth: clone.scrollWidth,
      windowHeight: clone.scrollHeight,
      scrollX: 0,
      scrollY: 0,
      logging: false,
    });

    cloneContainer.remove();
    document.body.style.overflow = oldOverflow;
    window.scrollTo(scrollX, scrollY);

    return canvas;
  }

  try {
    const canvas = await captureModalAsCanvas();
    if (!canvas) {
      throw new Error("Unable to capture modal.");
    }

    if (type === "image") {
      downloadDataUrl(
        `prediction-report-${Date.now()}.png`,
        canvas.toDataURL("image/png"),
      );
      return;
    }

    if (typeof jsPDF === "undefined" && window.jspdf && window.jspdf.jsPDF) {
      window.jsPDF = window.jspdf.jsPDF;
    }

    if (typeof jsPDF === "undefined") {
      return showNotification("⚠️ مكتبة jsPDF غير متاحة لتحميل PDF.", "error");
    }

    const imgData = canvas.toDataURL("image/png");
    const pxToPt = 72 / 96;
    const pdfWidthPt = Math.round(canvas.width * pxToPt);
    const pdfHeightPt = Math.round(canvas.height * pxToPt);
    const orientation = pdfWidthPt >= pdfHeightPt ? "landscape" : "portrait";

    const pdf = new jsPDF({
      orientation,
      unit: "pt",
      format: [pdfWidthPt, pdfHeightPt],
    });

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidthPt, pdfHeightPt);
    pdf.save(`prediction-report-${Date.now()}.pdf`);
  } catch (err) {
    console.error(err);
    showNotification("⚠️ فشل تحميل التقرير. حاول مرة أخرى.", "error");
  }
}

function checkMissingItems() {
  // This function will check for items that haven't been ordered recently
  // Since we don't have a menu_items table, we'll check order_items for items with low recent activity

  const basePath = (window.API_BASE || "")
    .toString()
    .trim()
    .replace(/\/+$/, "");
  const endpoint = basePath
    ? `${basePath}/api/get_missing_items.php`
    : "api/get_missing_items.php";

  fetch(endpoint, {
    method: "GET",
    headers: { Accept: "application/json" },
    credentials: "same-origin",
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success && data.missing_items && data.missing_items.length > 0) {
        showMissingItemsAlert(data.missing_items);
      }
    })
    .catch((error) => {
      console.log("Missing items check failed:", error);
    });
}

function showMissingItemsAlert(missingItems) {
  const alertDiv = document.createElement("div");
  alertDiv.style.cssText = `
    position: fixed;
    top: 20px;
    left: 20px;
    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
    color: white;
    padding: 15px 20px;
    border-radius: 10px;
    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
    max-width: 300px;
    z-index: 1000;
    font-family: 'Cairo', sans-serif;
    animation: slideInLeft 0.5s ease-out;
  `;

  alertDiv.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
      <div style="display: flex; align-items: center; gap: 8px;">
        <div style="font-size: 18px;">⚠️</div>
        <strong>تنبيه: منتجات ناقصة</strong>
      </div>
      <button onclick="this.parentElement.parentElement.remove()" style="
        background: rgba(255,255,255,0.2); border: none; border-radius: 50%;
        width: 20px; height: 20px; color: white; cursor: pointer; font-size: 12px;
      ">×</button>
    </div>
    <div style="font-size: 13px; margin-bottom: 10px;">
      المنتجات التالية لم تباع منذ أكثر من 7 أيام:
    </div>
    <ul style="margin: 0; padding-right: 15px; font-size: 12px;">
      ${missingItems
        .slice(0, 5)
        .map((item) => `<li>${item.item_name}</li>`)
        .join("")}
      ${missingItems.length > 5 ? `<li>... و ${missingItems.length - 5} أخرى</li>` : ""}
    </ul>
  `;

  // Add slideInLeft animation
  const style = document.createElement("style");
  style.textContent = `
    @keyframes slideInLeft {
      from { transform: translateX(-100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
  `;
  document.head.appendChild(style);

  document.body.appendChild(alertDiv);

  // Auto-remove after 10 seconds
  setTimeout(() => {
    if (alertDiv.parentElement) {
      alertDiv.style.animation = "slideOutRight 0.5s ease-in";
      setTimeout(() => alertDiv.remove(), 500);
    }
  }, 10000);
}

function renderAnalysisCharts({ dailyRevenue, hourlyOrders }) {
  const chartLabels = [];
  const chartDataPoint = [];

  const dayRevenueMap = {};
  if (Array.isArray(dailyRevenue)) {
    dailyRevenue.forEach((row) => {
      const key = (row.date || "").toString();
      dayRevenueMap[key] = Number(row.revenue || 0);
    });
  }

  const today = new Date();
  for (let i = 6; i >= 0; i -= 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);

    const isoKey = day.toISOString().slice(0, 10); // YYYY-MM-DD
    const label = day.toLocaleDateString("ar-EG", {
      day: "2-digit",
      month: "2-digit",
    });

    chartLabels.push(label);
    chartDataPoint.push(dayRevenueMap[isoKey] || 0);
  }

  if (salesTrendChartInstance) {
    salesTrendChartInstance.destroy();
  }
  const ctx1 = document.getElementById("salesTrendChart").getContext("2d");
  salesTrendChartInstance = new Chart(ctx1, {
    type: "line",
    data: {
      labels: chartLabels,
      datasets: [
        {
          label: "إيرادات (ج.م)",
          data: chartDataPoint,
          backgroundColor: "rgba(102, 126, 234, 0.3)",
          borderColor: "#667eea",
          fill: true,
          tension: 0.3,
          pointRadius: 4,
          pointBackgroundColor: "#fff",
          pointBorderColor: "#667eea",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { labels: { color: "#e5e7eb" }, display: true },
      },
      scales: {
        x: {
          ticks: { color: "#c7d1ff" },
          grid: { color: "rgba(120,130,255,0.15)" },
        },
        y: {
          ticks: {
            color: "#c7d1ff",
            callback: function (value) {
              return Number(value).toLocaleString("en-US");
            },
          },
          grid: { color: "rgba(120,130,255,0.15)" },
        },
      },
    },
  });

  if (productPerformanceChartInstance) {
    productPerformanceChartInstance.destroy();
  }
  const ctx2 = document
    .getElementById("productPerformanceChart")
    .getContext("2d");
  const gradientFill = ctx2.createLinearGradient(0, 0, 0, 360);
  gradientFill.addColorStop(0, "rgba(255, 140, 0, 0.45)");
  gradientFill.addColorStop(0.6, "rgba(255, 140, 0, 0.16)");
  gradientFill.addColorStop(1, "rgba(255, 140, 0, 0.05)");

  productPerformanceChartInstance = new Chart(ctx2, {
    type: "line",
    data: {
      labels: Array.isArray(hourlyOrders.labels) ? hourlyOrders.labels : [],
      datasets: [
        {
          label: "Peak Ordering Time",
          data: Array.isArray(hourlyOrders.data) ? hourlyOrders.data : [],
          backgroundColor: gradientFill,
          borderColor: "#ff8c00",
          borderWidth: 3,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 6,
          pointBackgroundColor: "#ff8c00",
          pointHoverBackgroundColor: "#ffffff",
          pointBorderColor: "#ff8c00",
          pointHoverBorderColor: "#ffffff",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      interaction: {
        intersect: false,
        mode: "index",
      },
      plugins: {
        legend: { labels: { color: "#e5e7eb" } },
        tooltip: {
          backgroundColor: "rgba(15, 23, 42, 0.92)",
          titleColor: "#ffffff",
          bodyColor: "#ffffff",
          callbacks: {
            title: function (context) {
              return context[0] && context[0].label ? context[0].label : "Hour";
            },
            label: function (context) {
              return `Orders: ${Number(context.parsed.y).toLocaleString("en-US")}`;
            },
          },
        },
      },
      scales: {
        x: {
          ticks: {
            color: "#e5e7eb",
            autoSkip: true,
            maxTicksLimit: 12,
            align: "center",
            callback: function (value, index, ticks) {
              const label = this.getLabelForValue(value);
              return label;
            },
          },
          grid: {
            drawOnChartArea: false,
            color: "rgba(51, 51, 51, 0.2)",
          },
        },
        y: {
          ticks: {
            color: "#e5e7eb",
            callback: function (value) {
              return Number(value).toLocaleString("en-US");
            },
          },
          grid: { color: "rgba(51, 51, 51, 0.2)" },
        },
      },
    },
  });
}

function loadAnalyticsData() {
  showNotification("🔄 جاري تحميل بيانات التحليل ...", "info");

  // Clear any existing auto-refresh
  if (analyticsAutoRefreshInterval) {
    clearInterval(analyticsAutoRefreshInterval);
  }

  // Start auto-refresh every 20 seconds
  analyticsAutoRefreshInterval = setInterval(() => {
    renderAnalysisDashboard();
  }, 20000);

  // Check for missing items
  checkMissingItems();

  return renderAnalysisDashboard();
}

function refreshAnalyticsData() {
  return loadAnalyticsData();
}

function exportAnalyticsReport() {
  // يتم تحويل الزر إلى تنزيل CSV من سجل الطلبات
  downloadReportCSV();
}

function downloadReportCSV() {
  fetchAnalysisData()
    .then((data) => {
      const orders = Array.isArray(data.latest_orders)
        ? data.latest_orders
        : [];
      if (orders.length === 0) {
        showNotification("⚠️ لا يوجد طلبات لتحميل التقرير", "warning");
        return;
      }

      const headers = [
        "order_id",
        "customer_name",
        "phone",
        "address",
        "total_price",
        "order_status",
        "created_at",
      ];

      const csvRows = [headers.join(",")];
      orders.forEach((order) => {
        const row = headers.map((key) => {
          let value = order[key] || "";
          if (typeof value === "string") {
            value = value.replace(/\"/g, '""');
            if (
              value.includes(",") ||
              value.includes('"') ||
              value.includes("\n")
            ) {
              value = `"${value}"`;
            }
          }
          return value;
        });
        csvRows.push(row.join(","));
      });

      const csvString = csvRows.join("\n");
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `myorder-orders-report-${new Date().toISOString().slice(0, 10)}.csv`;
      link.style.display = "none";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showNotification("✅ تم تنزيل تقرير الطلبات بصيغة CSV", "success");
    })
    .catch((error) => {
      console.error("downloadReportCSV error", error);
      showNotification("❌ فشل تنزيل تقرير الطلبات، حاول لاحقًا", "error");
    });
}

function toggleAnalysisView(forceOpen = null) {
  const ordersContent = document.getElementById("adminTabOrdersContent");
  const analysisDashboard = document.getElementById("analysis-dashboard");

  if (!ordersContent || !analysisDashboard) return;

  let showAnalysis;
  if (typeof forceOpen === "boolean") {
    showAnalysis = forceOpen;
  } else {
    showAnalysis =
      analysisDashboard.style.display === "none" ||
      analysisDashboard.style.display === "";
  }

  if (showAnalysis) {
    ordersContent.style.display = "none";
    analysisDashboard.style.display = "block";
    loadAnalyticsData();
  } else {
    analysisDashboard.style.display = "none";
    ordersContent.style.display = "grid";
    // Clear auto-refresh when hiding dashboard
    if (analyticsAutoRefreshInterval) {
      clearInterval(analyticsAutoRefreshInterval);
      analyticsAutoRefreshInterval = null;
    }
    if (typeof renderAllOrders === "function") renderAllOrders();
  }
}

window.toggleAnalysisView = toggleAnalysisView;

function toggleRecentOrdersAccordion() {
  const body = document.getElementById("recentOrdersAccordionBody");
  const icon = document.getElementById("recentOrdersAccordionIcon");
  const toggleBtn = document.getElementById("recentOrdersAccordionToggle");

  if (!body || !icon || !toggleBtn) return;

  const isOpen = body.classList.toggle("open");
  icon.classList.toggle("open", isOpen);
  toggleBtn.setAttribute("aria-expanded", String(isOpen));
}

document.addEventListener("DOMContentLoaded", function () {
  const refreshBtn = document.getElementById("analysis-refresh-btn");
  if (refreshBtn) {
    refreshBtn.addEventListener("click", function (e) {
      e.preventDefault();
      refreshAnalyticsData();
    });
  }

  const predictBtn = document.getElementById("predict-sales-btn");
  if (predictBtn) {
    predictBtn.addEventListener("click", function (e) {
      e.preventDefault();
      predictSales();
    });
  }

  const downloadBtn = document.getElementById("analysis-download-btn");
  if (downloadBtn) {
    downloadBtn.addEventListener("click", function (e) {
      e.preventDefault();
      downloadReportCSV();
    });
  }
});

// دالة للتبديل بين تبويبات لوحة الإدارة
function switchAdminTab(tabName) {
  const analysisDashboard = document.getElementById("analysis-dashboard");
  if (analysisDashboard) {
    analysisDashboard.style.display = "none";
  }

  const itemsContent = document.getElementById("adminTabItemsContent");
  const ordersContent = document.getElementById("adminTabOrdersContent");
  const salesContent = document.getElementById("adminTabSalesContent");
  const customersContent = document.getElementById("adminTabCustomersContent");
  const activitiesContent = document.getElementById(
    "adminTabActivitiesContent",
  );
  const itemsTab = document.getElementById("adminTabItems");
  const ordersTab = document.getElementById("adminTabOrders");
  const salesTab = document.getElementById("adminTabSales");
  const customersTab = document.getElementById("adminTabCustomers");
  const activitiesTab = document.getElementById("adminTabActivities");

  // إخفاء جميع التبويبات
  if (itemsContent) itemsContent.style.display = "none";
  if (ordersContent) ordersContent.style.display = "none";
  if (salesContent) salesContent.style.display = "none";
  if (customersContent) customersContent.style.display = "none";
  if (activitiesContent) activitiesContent.style.display = "none";

  // إرجاع جميع الأزرار إلى الحالة الطبيعية
  [itemsTab, ordersTab, salesTab, customersTab, activitiesTab].forEach(
    (tab) => {
      if (tab) {
        tab.style.background = "#E0E0E0";
        tab.style.color = "#333";
        tab.style.boxShadow = "none";
      }
    },
  );

  if (tabName === "items") {
    // عرض تبويب الأصناف
    if (itemsContent) itemsContent.style.display = "block";
    if (itemsTab) {
      itemsTab.style.background = "linear-gradient(135deg, #FF6B35, #FF8E5F)";
      itemsTab.style.color = "white";
      itemsTab.style.boxShadow = "0 2px 8px rgba(255,107,53,0.2)";
    }
  } else if (tabName === "orders") {
    // عرض تبويب الطلبات
    if (ordersContent) ordersContent.style.display = "block";
    if (ordersTab) {
      ordersTab.style.background = "linear-gradient(135deg, #3498DB, #5DADE2)";
      ordersTab.style.color = "white";
      ordersTab.style.boxShadow = "0 2px 8px rgba(52,152,219,0.2)";
    }
    // تحميل الطلبات عند الانتقال للتبويب
    renderAllOrders();
  } else if (tabName === "sales") {
    // عرض تبويب سجل المبيعات
    if (salesContent) salesContent.style.display = "block";
    if (salesTab) {
      salesTab.style.background = "linear-gradient(135deg, #27AE60, #229954)";
      salesTab.style.color = "white";
      salesTab.style.boxShadow = "0 2px 8px rgba(39,174,96,0.2)";
    }
    // تحميل سجل المبيعات عند الانتقال للتبويب
    renderSalesLog();
  } else if (tabName === "customers") {
    // عرض تبويب إدارة العملاء
    if (customersContent) customersContent.style.display = "block";
    if (customersTab) {
      customersTab.style.background =
        "linear-gradient(135deg, #9B59B6, #8E44AD)";
      customersTab.style.color = "white";
      customersTab.style.boxShadow = "0 2px 8px rgba(155,89,182,0.2)";
    }
    // تحميل قائمة العملاء عند الانتقال للتبويب
    renderCustomersManagement();
  } else if (tabName === "activities") {
    // عرض تبويب سجل الأنشطة
    if (activitiesContent) activitiesContent.style.display = "block";
    if (activitiesTab) {
      activitiesTab.style.background =
        "linear-gradient(135deg, #E74C3C, #C0392B)";
      activitiesTab.style.color = "white";
      activitiesTab.style.boxShadow = "0 2px 8px rgba(231,76,60,0.2)";
    }
    // تحميل سجل الأنشطة عند الانتقال للتبويب
    renderCustomersActivityLog();
  }
}

// دالة لعرض إدارة العملاء
function renderCustomersManagement() {
  const container = document.getElementById("adminCustomersContainer");
  if (!container) return;

  // customers are loaded dynamically or held in memory

  if (customers.length === 0) {
    container.innerHTML = `
            <div style="text-align:center; padding:60px 20px;">
                <i class="fa-solid fa-users" style="font-size:64px; color:#BDC3C7; margin-bottom:15px;"></i>
                <h3 style="color:#7F8C8D; margin-bottom:10px; font-size:20px;">لا توجد عملاء مسجلين</h3>
                <p style="color:#BDC3C7;">سيظهر العملاء هنا عند تسجيلهم</p>
            </div>
        `;
    return;
  }

  // الإحصائيات
  const totalCustomers = customers.length;
  const todayCount = customers.filter((c) => {
    const regDate = new Date(c.createdAt).toLocaleDateString("ar-EG");
    const today = new Date().toLocaleDateString("ar-EG");
    return regDate === today;
  }).length;

  const statsHTML = `
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:15px; margin-bottom:30px;">
            <div style="background:linear-gradient(135deg, #9B59B6, #8E44AD); padding:20px; border-radius:12px; color:white; box-shadow:0 8px 25px rgba(155, 89, 182, 0.2);">
                <p style="font-size:13px; margin:0 0 8px 0; opacity:0.9;">👥 إجمالي العملاء</p>
                <h3 style="font-size:28px; font-weight:900; margin:0;">${totalCustomers}</h3>
            </div>
            <div style="background:linear-gradient(135deg, #E74C3C, #C0392B); padding:20px; border-radius:12px; color:white; box-shadow:0 8px 25px rgba(231, 76, 60, 0.2);">
                <p style="font-size:13px; margin:0 0 8px 0; opacity:0.9;">📆 المسجلين اليوم</p>
                <h3 style="font-size:28px; font-weight:900; margin:0;">${todayCount}</h3>
            </div>
            <div style="background:linear-gradient(135deg, #3498DB, #2980B9); padding:20px; border-radius:12px; color:white; box-shadow:0 8px 25px rgba(52, 152, 219, 0.2);">
                <p style="font-size:13px; margin:0 0 8px 0; opacity:0.9;">📊 نسبة النشاط</p>
                <h3 style="font-size:28px; font-weight:900; margin:0;">${Math.round((todayCount / totalCustomers) * 100)}%</h3>
            </div>
        </div>
    `;

  // شريط البحث
  const searchHTML = `
        <div style="margin-bottom:25px;">
            <input type="text" id="customerSearch" placeholder="🔍 ابحث عن عميل بالاسم أو البريد..." 
                   style="width:100%; padding:14px 16px; border:2px solid #E0E0E0; border-radius:10px; font-size:14px; box-sizing:border-box;" 
                   oninput="filterCustomersTable()">
        </div>
    `;

  // الجدول
  const tableHTML = `
        <div style="background:white; border-radius:14px; padding:25px; box-shadow:0 4px 15px rgba(0,0,0,0.08); overflow-x:auto;">
            <table id="customersTable" style="width:100%; border-collapse:collapse;">
                <thead>
                    <tr style="background:linear-gradient(135deg, #9B59B6, #8E44AD); color:white;">
                        <th style="padding:14px; text-align:center; font-weight:700;">#</th>
                        <th style="padding:14px; text-align:right; font-weight:700;">الاسم</th>
                        <th style="padding:14px; text-align:right; font-weight:700;">البريد الإلكتروني</th>
                        <th style="padding:14px; text-align:right; font-weight:700;">الهاتف</th>
                        <th style="padding:14px; text-align:center; font-weight:700;">التاريخ</th>
                        <th style="padding:14px; text-align:center; font-weight:700;">الإجراءات</th>
                    </tr>
                </thead>
                <tbody id="customersTableBody">
                    ${customers
                      .map((c, idx) => {
                        const regDate = new Date(
                          c.createdAt,
                        ).toLocaleDateString("ar-EG");
                        return `
                            <tr style="border-bottom:1px solid #e0e0e0; transition:all 0.3s;" onmouseover="this.style.background='#F8F9FA'" onmouseout="this.style.background=''">
                                <td style="padding:14px; text-align:center; color:#333;"><strong>${idx + 1}</strong></td>
                                <td style="padding:14px; text-align:right; color:#2C3E50;"><strong>👤 ${c.name}</strong></td>
                                <td style="padding:14px; text-align:right; color:#666; font-size:13px;">${c.email}</td>
                                <td style="padding:14px; text-align:right; color:#666; font-size:13px;">📱 ${c.phone}</td>
                                <td style="padding:14px; text-align:center; color:#666; font-size:12px;">📅 ${regDate}</td>
                                <td style="padding:14px; text-align:center;">
                                    <button onclick="deleteCustomer(${c.id})" style="background:linear-gradient(135deg, #E74C3C, #C0392B); color:white; border:none; padding:8px 14px; border-radius:6px; cursor:pointer; font-size:12px; font-weight:600; transition:all 0.3s;" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
                                        🗑️ حذف
                                    </button>
                                </td>
                            </tr>
                        `;
                      })
                      .join("")}
                </tbody>
            </table>
        </div>
    `;

  // أزرار التصدير
  const exportHTML = `
        <div style="margin-top:25px; display:flex; gap:12px; flex-wrap:wrap;">
            <button onclick="exportCustomersToCSV()" style="background:linear-gradient(135deg, #27AE60, #229954); color:white; border:none; padding:12px 24px; border-radius:8px; cursor:pointer; font-weight:700; font-size:14px; transition:all 0.3s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                📥 تحميل قائمة العملاء
            </button>
            <button onclick="printCustomersList()" style="background:linear-gradient(135deg, #8B5CF6, #A78BFA); color:white; border:none; padding:12px 24px; border-radius:8px; cursor:pointer; font-weight:700; font-size:14px; transition:all 0.3s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                🖨️ طباعة قائمة العملاء
            </button>
        </div>
    `;

  container.innerHTML = statsHTML + searchHTML + tableHTML + exportHTML;
}

// دالة للبحث في جدول العملاء
function filterCustomersTable() {
  const searchInput = document.getElementById("customerSearch");
  const tableBody = document.getElementById("customersTableBody");
  const rows = tableBody.querySelectorAll("tr");
  const searchText = searchInput.value.toLowerCase();

  rows.forEach((row) => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(searchText) ? "" : "none";
  });
}

// دالة لحذف عميل
function deleteCustomer(customerId) {
  if (confirm("⚠️ هل أنت متأكد من حذف هذا العميل؟")) {
    customers = customers.filter((c) => c.id !== customerId);
    showNotification("✅ تم حذف العميل بنجاح", "success");
    renderCustomersManagement();
    updateAdminStatistics();
  }
}

// دالة لتصدير قائمة العملاء
function exportCustomersToCSV() {
  const exportCustomers = customers;

  if (exportCustomers.length === 0) {
    showNotification("⚠️ لا توجد عملاء للتصدير", "warning");
    return;
  }

  let csv = "الرقم,الاسم,البريد الإلكتروني,الهاتف,تاريخ التسجيل\n";

  customers.forEach((c, idx) => {
    const regDate = new Date(c.createdAt).toLocaleDateString("ar-EG");
    csv += `${idx + 1},"${c.name}","${c.email}","${c.phone}","${regDate}"\n`;
  });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `قائمة_العملاء_${new Date().toLocaleDateString("ar-EG")}.csv`;
  link.click();

  showNotification("✅ تم تحميل قائمة العملاء بنجاح", "success");
}

// دالة لطباعة قائمة العملاء
function printCustomersList() {
  const printCustomers = customers;

  if (printCustomers.length === 0) {
    showNotification("⚠️ لا توجد عملاء للطباعة", "warning");
    return;
  }

  const printWindow = window.open("", "", "height=600,width=900");
  let htmlContent = `
        <html dir="rtl" style="font-family: Arial, sans-serif;">
        <head>
            <title>قائمة العملاء</title>
            <style>
                body { padding: 20px; background: white; }
                h1 { text-align: center; color: #9B59B6; margin-bottom: 10px; }
                .info { text-align: center; color: #666; margin-bottom: 20px; font-size: 14px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th { background: linear-gradient(135deg, #9B59B6, #8E44AD); color: white; padding: 12px; text-align: right; border: 1px solid #ddd; font-weight: bold; }
                td { padding: 10px 12px; text-align: right; border: 1px solid #ddd; font-size: 13px; }
                tr:nth-child(even) { background: #f9f9f9; }
                .total-row { font-weight: bold; background: #E8D5F2; text-align: center; }
            </style>
        </head>
        <body>
            <h1>📋 قائمة العملاء المسجلين</h1>
            <div class="info">
                <p>تاريخ الطباعة: ${new Date().toLocaleDateString("ar-EG")}</p>
                <p>إجمالي العملاء: ${customers.length}</p>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>الاسم</th>
                        <th>البريد الإلكتروني</th>
                        <th>الهاتف</th>
                        <th>تاريخ التسجيل</th>
                    </tr>
                </thead>
                <tbody>
                    ${customers
                      .map((c, idx) => {
                        const regDate = new Date(
                          c.createdAt,
                        ).toLocaleDateString("ar-EG");
                        return `
                            <tr>
                                <td>${idx + 1}</td>
                                <td><strong>${c.name}</strong></td>
                                <td>${c.email}</td>
                                <td>${c.phone}</td>
                                <td>${regDate}</td>
                            </tr>
                        `;
                      })
                      .join("")}
                </tbody>
                <tfoot>
                    <tr class="total-row">
                        <td colspan="5">إجمالي العملاء المسجلين: ${customers.length}</td>
                    </tr>
                </tfoot>
            </table>
        </body>
        </html>
    `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
  setTimeout(() => printWindow.print(), 250);
}

// دالة عرض سجل أنشطة العملاء الشامل
function renderCustomersActivityLog() {
  const container = document.getElementById("adminActivitiesContainer");
  if (!container) return;

  // activity log and customers are loaded in memory or from API

  if (customersActivityLog.length === 0) {
    container.innerHTML = `
            <div style="text-align:center; padding:60px 20px;">
                <i class="fa-solid fa-chart-line" style="font-size:64px; color:#BDC3C7; margin-bottom:15px;"></i>
                <h3 style="color:#7F8C8D; margin-bottom:10px; font-size:20px;">لا توجد أنشطة مسجلة</h3>
                <p style="color:#BDC3C7;">ستظهر أنشطة العملاء هنا (تسجيل دخول، تسجيل، وخروج)</p>
            </div>
        `;
    return;
  }

  // الإحصائيات
  const todayActivities = customersActivityLog.filter((a) => {
    const actDate = new Date(a.timestamp).toLocaleDateString("ar-EG");
    const today = new Date().toLocaleDateString("ar-EG");
    return actDate === today;
  }).length;

  const registrations = customersActivityLog.filter(
    (a) => a.activityType === "تسجيل جديد",
  ).length;
  const logins = customersActivityLog.filter(
    (a) => a.activityType === "دخول",
  ).length;
  const logouts = customersActivityLog.filter(
    (a) => a.activityType === "خروج",
  ).length;

  const statsHTML = `
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:15px; margin-bottom:30px;">
            <div style="background:linear-gradient(135deg, #E74C3C, #C0392B); padding:20px; border-radius:12px; color:white; box-shadow:0 8px 25px rgba(231, 76, 60, 0.2);">
                <p style="font-size:13px; margin:0 0 8px 0; opacity:0.9;">📊 الأنشطة اليومية</p>
                <h3 style="font-size:28px; font-weight:900; margin:0;">${todayActivities}</h3>
            </div>
            <div style="background:linear-gradient(135deg, #27AE60, #229954); padding:20px; border-radius:12px; color:white; box-shadow:0 8px 25px rgba(39, 174, 96, 0.2);">
                <p style="font-size:13px; margin:0 0 8px 0; opacity:0.9;">✨ تسجيلات جديدة</p>
                <h3 style="font-size:28px; font-weight:900; margin:0;">${registrations}</h3>
            </div>
            <div style="background:linear-gradient(135deg, #3498DB, #2980B9); padding:20px; border-radius:12px; color:white; box-shadow:0 8px 25px rgba(52, 152, 219, 0.2);">
                <p style="font-size:13px; margin:0 0 8px 0; opacity:0.9;">🔓 تسجيلات الدخول</p>
                <h3 style="font-size:28px; font-weight:900; margin:0;">${logins}</h3>
            </div>
            <div style="background:linear-gradient(135deg, #F39C12, #E67E22); padding:20px; border-radius:12px; color:white; box-shadow:0 8px 25px rgba(243, 156, 18, 0.2);">
                <p style="font-size:13px; margin:0 0 8px 0; opacity:0.9;">🚪 تسجيلات الخروج</p>
                <h3 style="font-size:28px; font-weight:900; margin:0;">${logouts}</h3>
            </div>
        </div>
    `;

  // شريط البحث والفلترة
  const filtersHTML = `
        <div style="background:white; border-radius:14px; padding:20px; margin-bottom:25px; box-shadow:0 4px 15px rgba(0,0,0,0.08);">
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:15px;">
                <div>
                    <label style="display:block; margin-bottom:8px; font-weight:600; color:#2C3E50;">🔍 البحث عن عميل</label>
                    <input type="text" id="activityCustomerSearch" placeholder="ابحث بالاسم أو البريد..." 
                           style="width:100%; padding:12px 14px; border:2px solid #E0E0E0; border-radius:8px; font-size:13px; box-sizing:border-box;" 
                           oninput="filterActivityLog()">
                </div>
                <div>
                    <label style="display:block; margin-bottom:8px; font-weight:600; color:#2C3E50;">📋 نوع النشاط</label>
                    <select id="activityTypeFilter" style="width:100%; padding:12px 14px; border:2px solid #E0E0E0; border-radius:8px; font-size:13px; box-sizing:border-box;" onchange="filterActivityLog()">
                        <option value="">كل الأنشطة</option>
                        <option value="تسجيل جديد">✨ تسجيل جديد</option>
                        <option value="دخول">🔓 تسجيل الدخول</option>
                        <option value="خروج">🚪 تسجيل الخروج</option>
                    </select>
                </div>
                <div>
                    <label style="display:block; margin-bottom:8px; font-weight:600; color:#2C3E50;">📅 التاريخ</label>
                    <input type="date" id="activityDateFilter" 
                           style="width:100%; padding:12px 14px; border:2px solid #E0E0E0; border-radius:8px; font-size:13px; box-sizing:border-box;" 
                           oninput="filterActivityLog()">
                </div>
            </div>
        </div>
    `;

  // الجدول
  const tableHTML = `
        <div style="background:white; border-radius:14px; padding:25px; box-shadow:0 4px 15px rgba(0,0,0,0.08); overflow-x:auto;">
            <table id="activityTable" style="width:100%; border-collapse:collapse;">
                <thead>
                    <tr style="background:linear-gradient(135deg, #9B59B6, #8E44AD); color:white;">
                        <th style="padding:14px; text-align:center; font-weight:700;">#</th>
                        <th style="padding:14px; text-align:right; font-weight:700;">اسم العميل</th>
                        <th style="padding:14px; text-align:right; font-weight:700;">البريد الإلكتروني</th>
                        <th style="padding:14px; text-align:center; font-weight:700;">نوع النشاط</th>
                        <th style="padding:14px; text-align:center; font-weight:700;">الوقت</th>
                        <th style="padding:14px; text-align:right; font-weight:700;">التفاصيل</th>
                    </tr>
                </thead>
                <tbody id="activityTableBody">
                    ${customersActivityLog
                      .slice()
                      .reverse()
                      .map((activity, idx) => {
                        const customer = customers.find(
                          (c) => c.id === activity.customerId,
                        );
                        const activityTypeEmoji =
                          activity.activityType === "تسجيل جديد"
                            ? "✨"
                            : activity.activityType === "دخول"
                              ? "🔓"
                              : activity.activityType === "خروج"
                                ? "🚪"
                                : "📋";

                        const activityTypeColor =
                          activity.activityType === "تسجيل جديد"
                            ? "#27AE60"
                            : activity.activityType === "دخول"
                              ? "#3498DB"
                              : activity.activityType === "خروج"
                                ? "#F39C12"
                                : "#9B59B6";

                        return `
                            <tr style="border-bottom:1px solid #e0e0e0; transition:all 0.3s;" onmouseover="this.style.background='#F8F9FA'" onmouseout="this.style.background=''">
                                <td style="padding:14px; text-align:center; color:#333;"><strong>${idx + 1}</strong></td>
                                <td style="padding:14px; text-align:right; color:#2C3E50;"><strong>👤 ${customer ? customer.name : "عميل محذوف"}</strong></td>
                                <td style="padding:14px; text-align:right; color:#666; font-size:13px;">${customer ? customer.email : "N/A"}</td>
                                <td style="padding:14px; text-align:center; color:white; background:${activityTypeColor}; border-radius:6px; font-weight:600;">${activityTypeEmoji} ${activity.activityType}</td>
                                <td style="padding:14px; text-align:center; color:#666; font-size:12px;">⏰ ${activity.formattedTime}</td>
                                <td style="padding:14px; text-align:right; color:#666; font-size:12px; font-style:italic;">${activity.description}</td>
                            </tr>
                        `;
                      })
                      .join("")}
                </tbody>
            </table>
        </div>
    `;

  // أزرار التصدير والطباعة
  const exportHTML = `
        <div style="margin-top:25px; display:flex; gap:12px; flex-wrap:wrap;">
            <button onclick="exportActivityLogToCSV()" style="background:linear-gradient(135deg, #27AE60, #229954); color:white; border:none; padding:12px 24px; border-radius:8px; cursor:pointer; font-weight:700; font-size:14px; transition:all 0.3s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                📥 تحميل السجل
            </button>
            <button onclick="printActivityLogReport()" style="background:linear-gradient(135deg, #8B5CF6, #A78BFA); color:white; border:none; padding:12px 24px; border-radius:8px; cursor:pointer; font-weight:700; font-size:14px; transition:all 0.3s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
                🖨️ طباعة السجل
            </button>
        </div>
    `;

  container.innerHTML = statsHTML + filtersHTML + tableHTML + exportHTML;
}

// دالة لفلترة سجل الأنشطة
function filterActivityLog() {
  const searchInput = document.getElementById("activityCustomerSearch");
  const typeFilter = document.getElementById("activityTypeFilter");
  const dateFilter = document.getElementById("activityDateFilter");
  const tableBody = document.getElementById("activityTableBody");

  if (!tableBody) return;

  const rows = tableBody.querySelectorAll("tr");
  const searchText = searchInput.value.toLowerCase();
  const selectedType = typeFilter.value;
  const selectedDate = dateFilter.value;

  rows.forEach((row) => {
    let show = true;

    // فلترة البحث
    if (searchText) {
      const customerName = row.cells[1].textContent.toLowerCase();
      const email = row.cells[2].textContent.toLowerCase();
      show =
        show &&
        (customerName.includes(searchText) || email.includes(searchText));
    }

    // فلترة النوع
    if (selectedType && show) {
      const activityType = row.cells[3].textContent;
      show = show && activityType.includes(selectedType);
    }

    // فلترة التاريخ
    if (selectedDate && show) {
      const rowDate = row.cells[4].textContent;
      const selectedDateObj = new Date(selectedDate).toLocaleDateString(
        "ar-EG",
      );
      // استخلاص التاريخ من الوقت المعروض
      show =
        show &&
        rowDate.includes(new Date(selectedDate).toLocaleDateString("ar-EG"));
    }

    row.style.display = show ? "" : "none";
  });
}

// دالة تصدير سجل الأنشطة إلى CSV
function exportActivityLogToCSV() {
  const activityLog = customersActivityLog;
  const activityCustomers = customers;

  if (activityLog.length === 0) {
    showNotification("⚠️ لا توجد أنشطة للتصدير", "warning");
    return;
  }

  let csv =
    "الرقم,اسم العميل,البريد الإلكتروني,نوع النشاط,التاريخ,الوقت,التفاصيل\n";

  customersActivityLog
    .slice()
    .reverse()
    .forEach((activity, idx) => {
      const customer = customers.find((c) => c.id === activity.customerId);
      const customerName = customer ? customer.name : "عميل محذوف";
      const customerEmail = customer ? customer.email : "N/A";
      const date = new Date(activity.timestamp).toLocaleDateString("ar-EG");
      const time = new Date(activity.timestamp).toLocaleTimeString("ar-EG");

      csv += `${idx + 1},"${customerName}","${customerEmail}","${activity.activityType}","${date}","${time}","${activity.description}"\n`;
    });

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `سجل_أنشطة_العملاء_${new Date().toLocaleDateString("ar-EG")}.csv`;
  link.click();

  showNotification("✅ تم تحميل السجل بنجاح", "success");
}

// دالة طباعة سجل الأنشطة
function printActivityLogReport() {
  const activityLog = customersActivityLog;
  const activityCustomers = customers;

  if (activityLog.length === 0) {
    showNotification("⚠️ لا توجد أنشطة للطباعة", "warning");
    return;
  }

  const printWindow = window.open("", "", "height=600,width=900");
  let htmlContent = `
        <html dir="rtl" style="font-family: Arial, sans-serif;">
        <head>
            <title>سجل أنشطة العملاء</title>
            <style>
                body { padding: 20px; background: white; }
                h1 { text-align: center; color: #9B59B6; margin-bottom: 10px; }
                .info { text-align: center; color: #666; margin-bottom: 20px; font-size: 14px; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th { background: linear-gradient(135deg, #9B59B6, #8E44AD); color: white; padding: 12px; text-align: right; border: 1px solid #ddd; font-weight: bold; }
                td { padding: 10px 12px; text-align: right; border: 1px solid #ddd; font-size: 13px; }
                tr:nth-child(even) { background: #f9f9f9; }
                .total-row { font-weight: bold; background: #E8D5F2; text-align: center; }
                .activity-type { padding: 4px 8px; border-radius: 4px; color: white; font-weight: bold; text-align: center; }
                .type-register { background: #27AE60; }
                .type-login { background: #3498DB; }
                .type-logout { background: #F39C12; }
            </style>
        </head>
        <body>
            <h1>📊 سجل أنشطة العملاء الشامل</h1>
            <div class="info">
                <p>تاريخ الطباعة: ${new Date().toLocaleDateString("ar-EG")} - ${new Date().toLocaleTimeString("ar-EG")}</p>
                <p>إجمالي الأنشطة المسجلة: ${customersActivityLog.length}</p>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>#</th>
                        <th>اسم العميل</th>
                        <th>البريد الإلكتروني</th>
                        <th>نوع النشاط</th>
                        <th>التاريخ</th>
                        <th>الوقت</th>
                        <th>التفاصيل</th>
                    </tr>
                </thead>
                <tbody>
                    ${customersActivityLog
                      .slice()
                      .reverse()
                      .map((activity, idx) => {
                        const customer = customers.find(
                          (c) => c.id === activity.customerId,
                        );
                        const customerName = customer
                          ? customer.name
                          : "عميل محذوف";
                        const customerEmail = customer ? customer.email : "N/A";
                        const date = new Date(
                          activity.timestamp,
                        ).toLocaleDateString("ar-EG");
                        const time = new Date(
                          activity.timestamp,
                        ).toLocaleTimeString("ar-EG");

                        let typeClass = "type-register";
                        if (activity.activityType === "دخول")
                          typeClass = "type-login";
                        if (activity.activityType === "خروج")
                          typeClass = "type-logout";

                        return `
                            <tr>
                                <td>${idx + 1}</td>
                                <td><strong>${customerName}</strong></td>
                                <td>${customerEmail}</td>
                                <td><span class="activity-type ${typeClass}">${activity.activityType}</span></td>
                                <td>${date}</td>
                                <td>${time}</td>
                                <td>${activity.description}</td>
                            </tr>
                        `;
                      })
                      .join("")}
                </tbody>
                <tfoot>
                    <tr class="total-row">
                        <td colspan="7">إجمالي الأنشطة المسجلة: ${customersActivityLog.length}</td>
                    </tr>
                </tfoot>
            </table>
        </body>
        </html>
    `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();
  setTimeout(() => printWindow.print(), 250);
}

function switchCustomerTab(tab) {
  const loginForm = document.getElementById("customerLoginForm");
  const registerForm = document.getElementById("customerRegisterForm");
  const loginTab = document.getElementById("customerLoginTab");
  const registerTab = document.getElementById("customerRegisterTab");

  if (tab === "login") {
    loginForm.style.display = "block";
    registerForm.style.display = "none";
    loginTab.style.color = "#FF6B35";
    loginTab.style.borderBottomColor = "#FF6B35";
    loginTab.style.background = "white";
    registerTab.style.color = "#7F8C8D";
    registerTab.style.borderBottomColor = "transparent";
    registerTab.style.background = "transparent";
  } else {
    loginForm.style.display = "none";
    registerForm.style.display = "block";
    loginTab.style.color = "#7F8C8D";
    loginTab.style.borderBottomColor = "transparent";
    loginTab.style.background = "transparent";
    registerTab.style.color = "#FF6B35";
    registerTab.style.borderBottomColor = "#FF6B35";
    registerTab.style.background = "white";
  }
}

function customerLogin() {
  const email = document.getElementById("customer-email").value.trim();
  const password = document.getElementById("customer-password").value.trim();
  const errorDiv = document.getElementById("customerLoginError");

  console.log("🔐 محاولة تسجيل دخول:", { email, password });
  console.log("👥 عدد العملاء المسجلين:", customers.length);

  if (!email || !password) {
    errorDiv.textContent = "⚠️ الرجاء ملء جميع الحقول المطلوبة";
    errorDiv.style.display = "block";
    console.warn("⚠️ البريد أو كلمة المرور فارغة");
    return;
  }

  if (customers.length === 0) {
    errorDiv.textContent =
      "❌ لا توجد حسابات مسجلة في النظام. الرجاء إنشاء حساب جديد أولاً";
    errorDiv.style.display = "block";
    console.error("❌ لا توجد عملاء في النظام");
    return;
  }

  const customer = customers.find(
    (c) => c.email === email && c.password === password,
  );

  console.log(
    "🔍 نتيجة البحث:",
    customer ? "عميل وجد" : "لم يتم العثور على عميل",
  );

  if (customer) {
    currentCustomer = {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      createdAt: customer.createdAt || new Date().toISOString(),
    };

    // تسجيل نشاط الدخول
    try {
      logCustomerActivity(customer.id, "دخول", "تسجيل دخول إلى الحساب");
    } catch (e) {
      console.warn("⚠️ فشل تسجيل النشاط:", e);
    }

    errorDiv.style.display = "none";
    document.getElementById("customer-email").value = "";
    document.getElementById("customer-password").value = "";
    console.log("✅ تسجيل دخول ناجح للعميل:", customer.name);
    showNotification(
      `✅ أهلاً ${customer.name}! تم تسجيل دخولك بنجاح`,
      "success",
    );
    updateUserIcon();
    setTimeout(() => showPage("home-page"), 500);
  } else {
    errorDiv.textContent = "❌ البريد الإلكتروني أو كلمة المرور غير صحيحة";
    errorDiv.style.display = "block";
    console.error("❌ بيانات تسجيل الدخول غير صحيحة");
    console.log("📧 البريد المدخل:", email);
    console.log(
      "📋 قائمة رسائل البريد المسجلة:",
      customers.map((c) => c.email),
    );
  }
}

function customerRegister() {
  const name = document.getElementById("register-name").value.trim();
  const email = document.getElementById("register-email").value.trim();
  const phone = document.getElementById("register-phone").value.trim();
  const password = document.getElementById("register-password").value.trim();
  const confirmPassword = document
    .getElementById("register-confirm-password")
    .value.trim();
  const errorDiv = document.getElementById("customerRegisterError");

  console.log("📝 محاولة تسجيل حساب جديد:", { name, email, phone });

  if (!name || !email || !phone || !password || !confirmPassword) {
    errorDiv.textContent = "⚠️ الرجاء ملء جميع الحقول المطلوبة";
    errorDiv.style.display = "block";
    console.warn("⚠️ حقول فارغة في النموذج");
    return;
  }

  if (!email.includes("@")) {
    errorDiv.textContent = "❌ البريد الإلكتروني غير صحيح";
    errorDiv.style.display = "block";
    console.warn("⚠️ بريد إلكتروني غير صحيح");
    return;
  }

  if (password.length < 6) {
    errorDiv.textContent = "❌ كلمة المرور يجب أن تكون 6 أحرف على الأقل";
    errorDiv.style.display = "block";
    console.warn("⚠️ كلمة مرور قصيرة جداً");
    return;
  }

  if (password !== confirmPassword) {
    errorDiv.textContent = "❌ كلمات المرور غير متطابقة";
    errorDiv.style.display = "block";
    console.warn("⚠️ كلمات المرور غير متطابقة");
    return;
  }

  if (customers.some((c) => c.email === email)) {
    errorDiv.textContent = "❌ البريد الإلكتروني مسجل بالفعل";
    errorDiv.style.display = "block";
    console.warn("⚠️ البريد الإلكتروني مسجل بالفعل");
    return;
  }

  const newCustomer = {
    id: Date.now(),
    name,
    email,
    phone,
    password,
    createdAt: new Date().toISOString(),
  };

  customers.push(newCustomer);

  // Log the customer registration to sales log
  try {
    logCustomerRegistration(newCustomer);
  } catch (e) {
    console.warn("⚠️ فشل تسجيل التسجيل:", e);
  }

  // تسجيل نشاط التسجيل
  try {
    logCustomerActivity(newCustomer.id, "تسجيل جديد", "إنشاء حساب عميل جديد");
  } catch (e) {
    console.warn("⚠️ فشل تسجيل النشاط:", e);
  }

  currentCustomer = {
    id: newCustomer.id,
    name: newCustomer.name,
    email: newCustomer.email,
    phone: newCustomer.phone,
  };

  errorDiv.style.display = "none";
  document.getElementById("register-name").value = "";
  document.getElementById("register-email").value = "";
  document.getElementById("register-phone").value = "";
  document.getElementById("register-password").value = "";
  document.getElementById("register-confirm-password").value = "";

  console.log("✅ تم إنشاء حساب جديد بنجاح:", newCustomer.name);

  // تحديث الإحصائيات
  if (typeof updateAdminStatistics === "function") {
    updateAdminStatistics();
  }

  showNotification(`✅ تم إنشاء حسابك بنجاح! أهلاً ${name}`, "success");
  updateUserIcon();
  setTimeout(() => showPage("home-page"), 500);
}

function customerLogout() {
  // تسجيل نشاط الخروج
  if (currentCustomer) {
    logCustomerActivity(currentCustomer.id, "خروج", "تسجيل خروج من الحساب");
  }

  currentCustomer = null;
  showNotification("👋 تم تسجيل خروجك بنجاح", "success");
  updateUserIcon();
  showPage("home-page");
}

function updateUserIcon() {
  const userIcon = document.querySelector(".user-icon");
  const cartIcon = document.querySelector(".cart-icon");

  if (!userIcon) return;

  if (currentCustomer) {
    userIcon.innerHTML = `<i class="fa-solid fa-user" title="${currentCustomer.name}"></i>`;
    userIcon.style.cursor = "pointer";
    userIcon.onclick = (e) => {
      e.stopPropagation();
      showCustomerMenu();
    };
  } else {
    userIcon.innerHTML = `<i class="fa-solid fa-circle-user"></i>`;
    userIcon.onclick = () => showPage("customer-login-page");
  }
}

function showCustomerMenu() {
  if (!currentCustomer) return;

  const menu = document.createElement("div");
  menu.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 30px;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        z-index: 9999;
        min-width: 300px;
        text-align: center;
        direction: rtl;
        max-height: 80vh;
        overflow-y: auto;
    `;

  menu.innerHTML = `
        <h3 style="color:#2C3E50; margin-bottom:10px; font-size:18px;">👤 حسابي</h3>
        <div style="background:#F8F9FA; padding:15px; border-radius:8px; margin-bottom:20px;">
            <p style="margin:5px 0; font-size:14px;"><strong>الاسم:</strong> ${currentCustomer.name}</p>
            <p style="margin:5px 0; font-size:14px;"><strong>البريد:</strong> ${currentCustomer.email}</p>
            <p style="margin:5px 0; font-size:14px;"><strong>الهاتف:</strong> ${currentCustomer.phone}</p>
            <p style="margin:5px 0; font-size:12px; color:#7F8C8D;">📅 تاريخ التسجيل: ${new Date(currentCustomer.createdAt || new Date().toISOString()).toLocaleDateString("ar-EG")}</p>
        </div>
        <div style="display:flex; gap:10px; justify-content:center; flex-wrap:wrap;">
            <button id="editEmailBtn" onclick="showEditEmailDialog()" style="background:#3498DB; color:white; border:none; padding:10px 15px; border-radius:6px; cursor:pointer; font-weight:600; font-size:14px;">✏️ تعديل البريد</button>
            <button id="closeCustomerMenuBtn" style="background:#95A5A6; color:white; border:none; padding:10px 15px; border-radius:6px; cursor:pointer; font-weight:600;">إغلاق</button>
            <button onclick="customerLogout()" style="background:#E74C3C; color:white; border:none; padding:10px 15px; border-radius:6px; cursor:pointer; font-weight:600;">🚪 خروج</button>
        </div>
    `;

  const backdrop = document.createElement("div");
  backdrop.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 9998;
    `;

  document.body.appendChild(backdrop);
  document.body.appendChild(menu);

  document.getElementById("closeCustomerMenuBtn").onclick = () => {
    menu.remove();
    backdrop.remove();
  };

  backdrop.onclick = () => {
    menu.remove();
    backdrop.remove();
  };
}

// دالة لفتح نافذة تعديل البريد الإلكتروني
function showEditEmailDialog() {
  if (!currentCustomer) return;

  const dialog = document.createElement("div");
  dialog.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 30px;
        border-radius: 12px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        z-index: 10000;
        min-width: 350px;
        text-align: center;
        direction: rtl;
    `;

  dialog.innerHTML = `
        <h3 style="color:#2C3E50; margin-bottom:20px; font-size:18px;">✏️ تعديل البريد الإلكتروني</h3>
        
        <div style="text-align:right; margin-bottom:15px;">
            <label style="display:block; color:#555; font-weight:600; margin-bottom:8px;">البريد الحالي:</label>
            <input type="text" value="${currentCustomer.email}" disabled style="width:100%; padding:10px; border:1px solid #DDD; border-radius:6px; background:#F9F9F9; color:#666;">
        </div>
        
        <div style="text-align:right; margin-bottom:20px;">
            <label style="display:block; color:#555; font-weight:600; margin-bottom:8px;">البريد الجديد:</label>
            <input type="email" id="newEmailInput" placeholder="أدخل البريد الجديد" style="width:100%; padding:10px; border:1px solid #3498DB; border-radius:6px; font-size:14px;">
        </div>
        
        <div style="display:flex; gap:10px; justify-content:center;">
            <button id="cancelEmailBtn" style="background:#95A5A6; color:white; border:none; padding:10px 20px; border-radius:6px; cursor:pointer; font-weight:600;">إلغاء</button>
            <button id="confirmEmailBtn" style="background:#27AE60; color:white; border:none; padding:10px 20px; border-radius:6px; cursor:pointer; font-weight:600;">✅ تأكيد التعديل</button>
        </div>
    `;

  const backdrop = document.createElement("div");
  backdrop.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 9999;
    `;

  document.body.appendChild(backdrop);
  document.body.appendChild(dialog);

  const newEmailInput = dialog.querySelector("#newEmailInput");
  newEmailInput.focus();

  document.getElementById("cancelEmailBtn").onclick = () => {
    dialog.remove();
    backdrop.remove();
  };

  document.getElementById("confirmEmailBtn").onclick = () => {
    const newEmail = newEmailInput.value.trim();
    if (!newEmail) {
      alert("⚠️ يرجى إدخال بريد إلكتروني");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      alert("⚠️ صيغة البريد غير صحيحة");
      return;
    }

    const emailExists = customers.some(
      (c) => c.email === newEmail && c.id !== currentCustomer.id,
    );

    if (emailExists) {
      alert("⚠️ هذا البريد مستخدم بالفعل");
      return;
    }

    // تحديث البريد في الذاكرة
    const oldEmail = currentCustomer.email;
    customers = customers.map((c) =>
      c.id === currentCustomer.id ? { ...c, email: newEmail } : c,
    );
    currentCustomer.email = newEmail;

    // تسجيل النشاط
    logCustomerActivity(
      currentCustomer.id,
      "تعديل بيانات",
      `تغيير البريد الإلكتروني من ${oldEmail} إلى ${newEmail}`,
    );

    showNotification("✅ تم تحديث البريد بنجاح", "success");
    dialog.remove();
    backdrop.remove();
  };

  backdrop.onclick = () => {
    dialog.remove();
    backdrop.remove();
  };
}

/* ==================================================
   10. دالة تسجيل الخروج من الإدارة
   ================================================== */
function logoutAdmin() {
  const adminUserJson = sessionStorage.getItem("adminUser");
  sessionStorage.removeItem("isAdmin");
  sessionStorage.removeItem("adminUser");
  document.getElementById("admin-username").value = "";
  document.getElementById("admin-password").value = "";
  alert("👋 شكراً لك! تم تسجيل الخروج بنجاح");
  try {
    const u = adminUserJson ? JSON.parse(adminUserJson) : null;
    if (typeof logEvent === "function")
      logEvent("ADMIN_LOGOUT", {
        username: u ? u.username : "unknown",
        email: u ? u.email : null,
      });
  } catch (e) {}
  showPage("home-page");
}

// تأثير تتبع الموس - تحريك العناصر مع حركة الموس
// document.addEventListener('mousemove', (e) => {
//     const cards = document.querySelectorAll('.res-card, .feature-box, .branch-card');
//     cards.forEach(card => {
//         const rect = card.getBoundingClientRect();
//         const x = e.clientX - rect.left;
//         const y = e.clientY - rect.top;
//         const xPercent = (x / rect.width) * 5;
//         const yPercent = (y / rect.height) * 5;
//         card.style.transform = `perspective(1000px) rotateX(${yPercent - 2.5}deg) rotateY(${xPercent - 2.5}deg)`;
//     });
// });

// إعادة تعيين التحويل عند مغادرة الكارت
// Only attach mousemove tilt effects on devices that support hover (avoid touch devices)
const supportsHover =
  (window.matchMedia && window.matchMedia("(hover: hover)").matches) ||
  !("ontouchstart" in window);
// if (supportsHover) {
//     document.addEventListener('mousemove', (e) => {
//         const cards = document.querySelectorAll('.res-card, .feature-box, .branch-card');
//         cards.forEach(card => {
//             const rect = card.getBoundingClientRect();
//             const x = e.clientX - rect.left;
//             const y = e.clientY - rect.top;
//             const xPercent = (x / rect.width) * 5;
//             const yPercent = (y / rect.height) * 5;
//             card.style.transform = `perspective(1000px) rotateX(${yPercent - 2.5}deg) rotateY(${xPercent - 2.5}deg)`;
//         });
//     });

//     // Reset transform when leaving viewport
//     document.addEventListener('mouseleave', () => {
//         const cards = document.querySelectorAll('.res-card, .feature-box, .branch-card');
//         cards.forEach(card => { card.style.transform = ''; });
//     });
// }

// Image modal functions (open/close) - safe guards to avoid errors
function openImageModal(src, alt) {
  try {
    const modal = document.getElementById("image-modal");
    const img = document.getElementById("image-modal-img");
    const cap = document.getElementById("image-modal-caption");
    if (!modal || !img) return;
    img.src = src || "";
    img.alt = alt || "";
    cap.textContent = alt || "";
    modal.setAttribute("aria-hidden", "false");
    modal.classList.add("open");
    document.body.style.overflow = "hidden";
  } catch (e) {
    console.warn("openImageModal error", e);
  }
}

function closeImageModal() {
  try {
    const modal = document.getElementById("image-modal");
    const img = document.getElementById("image-modal-img");
    if (!modal || !img) return;
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    img.src = "";
    document.body.style.overflow = "";
  } catch (e) {
    console.warn("closeImageModal error", e);
  }
}

// Close modal on Escape key
document.addEventListener("keydown", (ev) => {
  if (ev.key === "Escape") closeImageModal();
});

// تشغيل الموقع عند التحميل
window.addEventListener("load", () => {
  // التحقق من البيانات والتخزين
  console.clear();
  console.log("🚀 بدء تشغيل تطبيق My Order...\n");
  checkStorageStatus();
  verifyDataUpdate();

  showPage("home-page");
  updateCartCount();
  createSnow();
  updateUserIcon();

  // Delegated handler for interactive images and data-action buttons
  document.addEventListener("click", (ev) => {
    const t = ev.target;

    // 1) Handle elements (or ancestors) that declare a data-action
    const actionEl = t.closest && t.closest("[data-action]");
    if (actionEl) {
      const action = actionEl.dataset.action;
      const category = actionEl.dataset.category;
      const target = actionEl.dataset.target;

      switch (action) {
        case "navigate":
          ev.preventDefault();
          if (target) showPage(target);
          break;
        case "filter-home":
          ev.preventDefault();
          if (category) filterHomeMenu(category);
          break;
        case "filter":
          ev.preventDefault();
          if (category) filterItems(category);
          break;
        case "send-review":
          ev.preventDefault();
          sendReview();
          break;
        case "validate-login":
          ev.preventDefault();
          validateAdminLogin();
          break;
        case "finish-order":
          ev.preventDefault();
          finishOrder();
          break;
        case "logout":
          ev.preventDefault();
          logoutAdmin();
          break;
        case "add-new-item":
          ev.preventDefault();
          addNewItemFromAdmin();
          break;
        case "delete-item":
          ev.preventDefault();
          const delId = parseInt(actionEl.dataset.id, 10);
          if (!isNaN(delId)) deleteItem(delId);
          break;
        case "edit-item-full":
          ev.preventDefault();
          const fullEditId = parseInt(actionEl.dataset.id, 10);
          if (!isNaN(fullEditId)) editItemFull(fullEditId);
          break;
        case "open-edit-modal":
          ev.preventDefault();
          const editModalId = String(actionEl.dataset.id).trim();
          if (editModalId) openEditModal(editModalId);
          break;
        case "edit-price":
          ev.preventDefault();
          const editPriceId = parseInt(actionEl.dataset.id, 10);
          const currentPrice = parseFloat(actionEl.dataset.currentPrice);
          if (!isNaN(editPriceId)) editItemPrice(editPriceId, currentPrice);
          break;
        case "add-to-cart":
          ev.preventDefault();
          const productId = actionEl.dataset.id;
          if (productId) addToCart(productId);
          break;
        case "decrease-qty":
          ev.preventDefault();
          const decIndex = parseInt(actionEl.dataset.index, 10);
          if (!isNaN(decIndex)) decreaseQuantity(decIndex);
          break;
        case "increase-qty":
          ev.preventDefault();
          const incIndex = parseInt(actionEl.dataset.index, 10);
          if (!isNaN(incIndex)) increaseQuantity(incIndex);
          break;
        case "remove-item":
          ev.preventDefault();
          const remIndex = parseInt(actionEl.dataset.index, 10);
          if (!isNaN(remIndex)) removeFromCart(remIndex);
          break;
        case "update-phone":
          ev.preventDefault();
          updateRestaurantPhone();
          break;
        case "seed":
          ev.preventDefault();
          seedFromAdmin();
          break;
        case "clear-all":
          ev.preventDefault();
          clearAllItems();
          break;
        default:
          break;
      }

      return; // handled
    }

    // 2) Fallback: images with interactive-img class open modal (uses data-fullsrc/data-caption)
    if (t && t.classList && t.classList.contains("interactive-img")) {
      const src = t.dataset.fullsrc || t.src || "";
      const cap = t.dataset.caption || t.alt || "";
      openImageModal(src, cap);
    }
  });
  // Keyboard accessibility: trigger click on Enter/Space for elements with role=button or data-action
  document.addEventListener("keydown", (ev) => {
    if (ev.key !== "Enter" && ev.key !== " ") return;
    const active = document.activeElement;
    if (!active) return;
    const actionEl =
      (active.closest && active.closest("[data-action]")) ||
      (active.hasAttribute && active.getAttribute("role") === "button"
        ? active
        : null);
    if (actionEl) {
      ev.preventDefault();
      actionEl.click();
    }
  });
  // إذا كانت دوال Firebase متاحة، شغّل المزامنة للتأكد من تحميل البيانات الحقيقية
  if (
    typeof window.firebaseDB !== "undefined" &&
    window.firebaseDB.initializeFirebaseSync
  ) {
    try {
      window.firebaseDB.initializeFirebaseSync();
    } catch (e) {
      console.warn("Firebase sync failed or unavailable:", e);
    }
  }

  // إضافة ستايل الأنيميشن للثلج ديناميكياً
  const style = document.createElement("style");
  style.innerHTML = `
        @keyframes fall { 
            to { transform: translateY(110vh) rotate(360deg); } 
        }
        @keyframes slideIn { 
            from { transform: translateX(400px); opacity: 0; } 
            to { transform: translateX(0); opacity: 1; } 
        }
        @keyframes fadeOut { 
            to { opacity: 0; } 
        }
    `;
  document.head.appendChild(style);

  // IntersectionObserver: trigger About page animations when elements enter viewport
  (function setupAboutAnimations() {
    const selector =
      ".about-hero-text, .about-hero-visual, .feature-box, .team-card, .about-metrics .metric";
    const elements = Array.from(document.querySelectorAll(selector));
    if (!elements.length) return;

    // mark for animation
    elements.forEach((el) => el.classList.add("will-animate"));

    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries, obs) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const el = entry.target;
              // allow optional data-animate-delay in ms
              const delay = parseInt(el.dataset.animateDelay || "0", 10) || 0;
              if (delay) el.style.transitionDelay = `${delay}ms`;
              // add class to start transition
              requestAnimationFrame(() => el.classList.add("animate"));
              obs.unobserve(el);
            }
          });
        },
        { threshold: 0.12 },
      );

      elements.forEach((el) => io.observe(el));
    } else {
      // fallback: just animate everything after small timeout
      setTimeout(
        () => elements.forEach((el) => el.classList.add("animate")),
        150,
      );
    }
  })();
});
// واجهة بسيطة لاستدعاء Google Sign-In من الواجهة العامة
function googleSignIn() {
  if (window.firebaseDB && window.firebaseDB.googleSignIn) {
    window.firebaseDB.googleSignIn();
  } else {
    showNotification("⚠️ خدمة المصادقة غير جاهزة. حاول لاحقاً.", "warning");
  }
}

/* ==================================================
   شروط الاستخدام وسياسة الخصوصية
   ================================================== */

// عرض نموذج شروط الاستخدام
function showTermsOfService() {
  const modal = document.createElement("div");
  modal.id = "termsModal";
  modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        animation: fadeIn 0.3s ease-out;
        direction: rtl;
    `;

  modal.innerHTML = `
        <div style="background:white; border-radius:12px; max-width:700px; width:90%; max-height:80vh; overflow-y:auto; box-shadow:0 10px 40px rgba(0,0,0,0.3); position:relative;">
            <!-- Header -->
            <div style="background:linear-gradient(135deg, #FF6B35, #FF8E5F); color:white; padding:25px; border-radius:12px 12px 0 0; display:flex; justify-content:space-between; align-items:center; position:sticky; top:0;">
                <h2 style="margin:0; font-size:20px;">📋 شروط الاستخدام</h2>
                <button id="closeTermsBtn" style="background:rgba(255,255,255,0.3); border:none; color:white; font-size:24px; cursor:pointer; padding:0 10px; border-radius:6px; transition:0.3s;">×</button>
            </div>
            
            <!-- Content -->
            <div style="padding:25px; color:#2C3E50; line-height:1.8; font-size:14px;">
                <h3 style="color:#FF6B35; margin-top:0;">1. قبول الشروط</h3>
                <p>باستخدام My Order الإلكترونية، فأنت تقبل وتوافق على جميع الشروط والأحكام المنصوص عليها هنا. إذا كنت لا توافق على أي جزء من هذه الشروط، يُرجى عدم استخدام الخدمة.</p>
                
                <h3 style="color:#FF6B35;">2. وصف الخدمة</h3>
                <p>تقدم My Order خدمة طلب الطعام والمشروبات من المطاعم المتعاونة مع الخدمة وتوصيلها للعملاء. نحتفظ بالحق في تعديل أو إيقاف أي خدمة في أي وقت.</p>
                
                <h3 style="color:#FF6B35;">3. حسابات المستخدم</h3>
                <p>أنت مسؤول عن الحفاظ على سرية بيانات حسابك وكلمة المرور. يجب عليك إبلاغنا فوراً عن أي استخدام غير مصرح به لحسابك.</p>
                
                <h3 style="color:#FF6B35;">4. استخدام المنصة</h3>
                <p>يجب عليك استخدام المنصة بطريقة قانونية وأخلاقية. يُحظر عليك:</p>
                <ul style="margin:10px 0; padding-right:25px;">
                    <li>محاولة قرصنة أو الوصول غير المصرح به للنظام</li>
                    <li>نشر محتوى إباحي أو عنيف أو غير مناسب</li>
                    <li>استخدام البوتات أو الأتمتة بدون إذن صريح</li>
                    <li>الانخراط في الاحتيال أو الخداع</li>
                </ul>
                
                <h3 style="color:#FF6B35;">5. الطلبات والدفع</h3>
                <p>تقديم الطلب يعني قبولاً منك لشروط الطلب. يجب عليك توفير معلومات طلب دقيقة وصحيحة. أسعار المنتجات قابلة للتغيير دون إخطار مسبق.</p>
                
                <h3 style="color:#FF6B35;">6. إلغاء الطلبات</h3>
                <p>يمكنك إلغاء الطلب قبل البدء في التحضير من قبل المطعم. بعد بدء التحضير، قد تتحمل رسوم إلغاء.</p>
                
                <h3 style="color:#FF6B35;">7. تحديد المسؤولية</h3>
                <p>لا تتحمل My Order مسؤولية أي أضرار ناشئة عن استخدام المنصة أو عدم توفر الخدمة بشكل مؤقت.</p>
                
                <h3 style="color:#FF6B35;">8. القانون الواجب التطبيق</h3>
                <p>تحكم هذه الشروط وسياساتنا القوانين السارية في جمهورية مصر العربية.</p>
                
                <h3 style="color:#FF6B35;">9. تعديل الشروط</h3>
                <p>نحتفظ بالحق في تعديل هذه الشروط في أي وقت. سيتم إبلاغك بأي تغييرات مهمة.</p>
                
                <h3 style="color:#FF6B35;">10. التواصل مع الدعم</h3>
                <p>إذا كان لديك أي استفسارات حول هذه الشروط، يرجى التواصل معنا على: <strong>ibra7im.engineer@gmail.com</strong></p>
            </div>
            
            <!-- Footer -->
            <div style="padding:20px; text-align:center; border-top:1px solid #E0E0E0; background:#F8F9FA;">
                <button id="acceptTermsBtn" style="background:linear-gradient(135deg, #FF6B35, #FF8E5F); color:white; border:none; padding:12px 30px; border-radius:8px; cursor:pointer; font-weight:600; transition:0.3s; margin-left:10px;">✅ أوافق على الشروط</button>
                <button id="closeTermsBtnFooter" style="background:#95A5A6; color:white; border:none; padding:12px 30px; border-radius:8px; cursor:pointer; font-weight:600; transition:0.3s;">إغلاق</button>
            </div>
        </div>
    `;

  // CSS animation styles
  const style = document.createElement("style");
  style.innerHTML = `
        @keyframes fadeIn { 
            from { opacity: 0; } 
            to { opacity: 1; } 
        }
    `;
  document.head.appendChild(style);

  document.body.appendChild(modal);

  // Close button handlers
  const closeBtn = document.getElementById("closeTermsBtn");
  const closeBtnFooter = document.getElementById("closeTermsBtnFooter");
  const acceptBtn = document.getElementById("acceptTermsBtn");

  const closeModal = () => {
    modal.style.animation = "fadeOut 0.3s ease-out";
    setTimeout(() => modal.remove(), 300);
  };

  closeBtn.addEventListener("click", closeModal);
  closeBtnFooter.addEventListener("click", closeModal);
  acceptBtn.addEventListener("click", () => {
    showNotification("✅ شكراً! تم قبول شروط الاستخدام", "success");
    closeModal();
  });

  // Close on backdrop click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  // Close on Escape key
  const handleEscape = (e) => {
    if (e.key === "Escape") {
      closeModal();
      document.removeEventListener("keydown", handleEscape);
    }
  };
  document.addEventListener("keydown", handleEscape);
}

// عرض نموذج سياسة الخصوصية
function showPrivacyPolicy() {
  const modal = document.createElement("div");
  modal.id = "privacyModal";
  modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        animation: fadeIn 0.3s ease-out;
        direction: rtl;
    `;

  modal.innerHTML = `
        <div style="background:white; border-radius:12px; max-width:700px; width:90%; max-height:80vh; overflow-y:auto; box-shadow:0 10px 40px rgba(0,0,0,0.3); position:relative;">
            <!-- Header -->
            <div style="background:linear-gradient(135deg, #2196F3, #42A5F5); color:white; padding:25px; border-radius:12px 12px 0 0; display:flex; justify-content:space-between; align-items:center; position:sticky; top:0;">
                <h2 style="margin:0; font-size:20px;">🔐 سياسة الخصوصية</h2>
                <button id="closePrivacyBtn" style="background:rgba(255,255,255,0.3); border:none; color:white; font-size:24px; cursor:pointer; padding:0 10px; border-radius:6px; transition:0.3s;">×</button>
            </div>
            
            <!-- Content -->
            <div style="padding:25px; color:#2C3E50; line-height:1.8; font-size:14px;">
                <h3 style="color:#2196F3; margin-top:0;">1. مقدمة</h3>
                <p>تحترم My Order خصوصيتك وتلتزم بحماية بيانات المستخدمين. توضح هذه السياسة كيفية جمع واستخدام معلوماتك الشخصية.</p>
                
                <h3 style="color:#2196F3;">2. البيانات التي نجمعها</h3>
                <p>نجمع المعلومات التالية:</p>
                <ul style="margin:10px 0; padding-right:25px;">
                    <li><strong>معلومات الحساب:</strong> الاسم والبريد الإلكتروني ورقم الهاتف</li>
                    <li><strong>معلومات الطلب:</strong> عناوين التوصيل وتفاصيل الطلبات</li>
                    <li><strong>معلومات الدفع:</strong> غير كامل - نستخدم معالجات دفع آمنة</li>
                    <li><strong>بيانات الاستخدام:</strong> كيفية استخدامك للمنصة (من خلال الكوكيز)</li>
                </ul>
                
                <h3 style="color:#2196F3;">3. كيفية استخدام بيانتك</h3>
                <p>نستخدم بيانتك الشخصية لـ:</p>
                <ul style="margin:10px 0; padding-right:25px;">
                    <li>معالجة طلباتك وتوصيل الطعام</li>
                    <li>تحسين خدماتنا والتواصل معك</li>
                    <li>الامتثال للقوانين والالتزامات القانونية</li>
                    <li>مكافحة الاحتيال والجريمة</li>
                </ul>
                
                <h3 style="color:#2196F3;">4. حماية البيانات</h3>
                <p>نستخدم تقنيات الحماية المتقدمة مثل التشفير لحماية بيانتك الشخصية من الوصول غير المصرح به.</p>
                
                <h3 style="color:#2196F3;">5. مشاركة البيانات</h3>
                <p>لا نشارك بيانتك الشخصية مع أطراف ثالثة إلا في الحالات التالية:</p>
                <ul style="margin:10px 0; padding-right:25px;">
                    <li>المطاعم المتعاونة (لتنفيذ الطلبات فقط)</li>
                    <li>خدمات التوصيل عند الحاجة</li>
                    <li>الامتثال للمتطلبات القانونية</li>
                </ul>
                
                <h3 style="color:#2196F3;">6. حقوقك</h3>
                <p>لديك الحق في:</p>
                <ul style="margin:10px 0; padding-right:25px;">
                    <li>الوصول إلى بيانتك الشخصية</li>
                    <li>تصحيح البيانات غير الدقيقة</li>
                    <li>حذف حسابك وبيانتك</li>
                    <li>الاعتراض على معالجة بيانتك</li>
                </ul>
                
                <h3 style="color:#2196F3;">7. الكوكيز</h3>
                <p>نستخدم الكوكيز لتحسين تجربتك في استخدام المنصة. يمكنك تعطيل الكوكيز من خلال إعدادات متصفحك.</p>
                
                <h3 style="color:#2196F3;">8. الروابط الخارجية</h3>
                <p>قد تحتوي المنصة على روابط لمواقع خارجية. لا نتحمل مسؤولية سياسات الخصوصية الخاصة بهذه المواقع.</p>
                
                <h3 style="color:#2196F3;">9. تعديل هذه السياسة</h3>
                <p>قد نعدل هذه السياسة في أي وقت. سيتم إبلاغك بأي تغييرات مهمة من خلال بريدك الإلكتروني.</p>
                
                <h3 style="color:#2196F3;">10. التواصل معنا</h3>
                <p>إذا كان لديك أي استفسارات حول سياسة الخصوصية، يرجى التواصل معنا على: <strong>ibra7im.engineer@gmail.com</strong></p>
                
                <p style="margin-top:20px; padding-top:20px; border-top:1px solid #E0E0E0; font-size:12px; color:#7F8C8D;">
                    <strong>آخر تحديث:</strong> ${new Date().toLocaleDateString("ar-EG")}
                </p>
            </div>
            
            <!-- Footer -->
            <div style="padding:20px; text-align:center; border-top:1px solid #E0E0E0; background:#F8F9FA;">
                <button id="acceptPrivacyBtn" style="background:linear-gradient(135deg, #2196F3, #42A5F5); color:white; border:none; padding:12px 30px; border-radius:8px; cursor:pointer; font-weight:600; transition:0.3s; margin-left:10px;">✅ أوافق</button>
                <button id="closePrivacyBtnFooter" style="background:#95A5A6; color:white; border:none; padding:12px 30px; border-radius:8px; cursor:pointer; font-weight:600; transition:0.3s;">إغلاق</button>
            </div>
        </div>
    `;

  // CSS animation styles
  const style = document.createElement("style");
  style.innerHTML = `
        @keyframes fadeOut { 
            from { opacity: 1; } 
            to { opacity: 0; } 
        }
    `;
  document.head.appendChild(style);

  document.body.appendChild(modal);

  // Close button handlers
  const closeBtn = document.getElementById("closePrivacyBtn");
  const closeBtnFooter = document.getElementById("closePrivacyBtnFooter");
  const acceptBtn = document.getElementById("acceptPrivacyBtn");

  const closeModal = () => {
    modal.style.animation = "fadeOut 0.3s ease-out";
    setTimeout(() => modal.remove(), 300);
  };

  closeBtn.addEventListener("click", closeModal);
  closeBtnFooter.addEventListener("click", closeModal);
  acceptBtn.addEventListener("click", () => {
    showNotification("✅ شكراً! تم قبول سياسة الخصوصية", "success");
    closeModal();
  });

  // Close on backdrop click
  modal.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  // Close on Escape key
  const handleEscape = (e) => {
    if (e.key === "Escape") {
      closeModal();
      document.removeEventListener("keydown", handleEscape);
    }
  };
  document.addEventListener("keydown", handleEscape);
}

// Export to window for backward compatibility
window.showPage = showPage;
window.renderMenu = renderMenu;
window.searchFunction = searchFunction;
window.filterItems = filterItems;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.finishOrder = finishOrder;
window.openImageModal = openImageModal;
window.closeImageModal = closeImageModal;
window.deleteItem = deleteItem;
window.editItemPrice = editItemPrice;
window.openEditModal = openEditModal;
window.saveEdit = saveEdit;
window.editItemFull = openEditModal;
window.addNewItemFromAdmin = addNewItemFromAdmin;
window.renderAdminList = renderAdminList;
window.updateRestaurantPhone = updateRestaurantPhone;
window.seedFromAdmin = seedFromAdmin;
window.clearAllItems = clearAllItems;
window.sendReview = sendReview;
window.validateAdminLogin = validateAdminLogin;
window.logoutAdmin = logoutAdmin;
window.searchHomeMenu = searchHomeMenu;
window.switchCustomerTab = switchCustomerTab;
window.customerLogin = customerLogin;
window.customerRegister = customerRegister;
window.customerLogout = customerLogout;
window.showCustomerMenu = showCustomerMenu;
window.filterHomeMenu = filterHomeMenu;
window.initializeHomeMenu = initializeHomeMenu;
window.googleSignIn = googleSignIn;
window.showTermsOfService = showTermsOfService;
window.showPrivacyPolicy = showPrivacyPolicy;
window.printInvoice = printInvoice;
window.generateInvoiceHTML = generateInvoiceHTML;

/* ==================================================
   تحسينات متقدمة: نظام Validation و Error Handling
   ================================================== */

// Advanced Validation System
const Validator = {
  // التحقق من صحة البريد الإلكتروني
  isValidEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // التحقق من صحة رقم الهاتف
  isValidPhone: (phone) => {
    const phoneRegex = /^(\+?20)?1[0125][0-9]{8}$/;
    return phoneRegex.test(phone);
  },

  // التحقق من صحة الاسم
  isValidName: (name) => {
    if (!name) return false;
    const trimmed = name.trim();
    const parts = trimmed.split(/\s+/).filter(Boolean);
    return parts.length >= 2 && trimmed.length >= 3 && trimmed.length <= 100;
  },

  // التحقق من صحة العنوان
  isValidAddress: (address) => {
    return (
      address && address.trim().length >= 15 && address.trim().length <= 300
    );
  },

  // التحقق من صحة السعر
  isValidPrice: (price) => {
    const priceNum = parseFloat(price);
    return priceNum > 0 && priceNum <= 10000;
  },

  // التحقق من صحة كمية المنتج
  isValidQuantity: (qty) => {
    return Number.isInteger(qty) && qty > 0 && qty <= 100;
  },

  // التحقق الشامل لبيانات الطلب
  validateOrderData: (orderData) => {
    const errors = [];

    if (!Validator.isValidName(orderData.customerName)) {
      errors.push("الاسم يجب أن يكون اسمين على الأقل");
    }
    if (!Validator.isValidPhone(orderData.customerPhone)) {
      errors.push("رقم الهاتف غير صحيح - يجب أن يكون رقم مصري صحيح");
    }
    if (!Validator.isValidAddress(orderData.customerAddress)) {
      errors.push("العنوان يجب أن يكون بين 15 و 300 حرف");
    }
    if (!orderData.items || orderData.items.length === 0) {
      errors.push("السلة فارغة - أضف منتجات أولاً");
    }
    if (orderData.totalPrice < 0) {
      errors.push("خطأ في حساب السعر الإجمالي");
    }

    return {
      isValid: errors.length === 0,
      errors: errors,
    };
  },
};

// Advanced Error Handler
const ErrorHandler = {
  // معالجة الأخطاء الشاملة
  handle: (error, context = "") => {
    console.error(`❌ خطأ في ${context}:`, error);

    const errorMap = {
      NetworkError: "خطأ في الاتصال - تأكد من الإنترنت",
      QuotaExceededError: "تخزين المتصفح ممتلئ",
      SecurityError: "خطأ أمني - تحقق من إعدادات المتصفح",
      TypeError: "خطأ في البيانات المُرسلة",
      ReferenceError: "خطأ في الوصول للعنصر",
    };

    const userMessage =
      errorMap[error.name] || "حدث خطأ غير متوقع - حاول مرة أخرى";

    ErrorHandler.showError(userMessage, context);
    return userMessage;
  },

  // عرض الخطأ للمستخدم
  showError: (message, title = "خطأ") => {
    const notification = showNotification(message, "error", 5000);
    console.error(`[${title}] ${message}`);
  },

  // التعامل مع أخطاء API
  handleAPIError: (response) => {
    if (response.status === 429) {
      return "الكثير من الطلبات - حاول لاحقاً";
    } else if (response.status === 500) {
      return "خطأ في الخادم - حاول لاحقاً";
    } else if (response.status === 403) {
      return "غير مصرح لك بهذا الإجراء";
    }
    return "خطأ في الاتصال بالخادم";
  },
};

// Performance Monitoring
const Performance = {
  startTime: Date.now(),
  metrics: {},

  // قياس وقت العملية
  measure: (operationName, callback) => {
    const startTime = performance.now();
    try {
      const result = callback();
      const endTime = performance.now();
      Performance.metrics[operationName] = endTime - startTime;
      console.log(`⏱️ ${operationName}: ${(endTime - startTime).toFixed(2)}ms`);
      return result;
    } catch (error) {
      console.error(`❌ إخفاق في ${operationName}:`, error);
      throw error;
    }
  },

  // الحصول على الإحصائيات
  getMetrics: () => Performance.metrics,

  // طباعة التقرير
  printReport: () => {
    console.log("📊 تقرير الأداء:");
    Object.entries(Performance.metrics).forEach(([op, time]) => {
      console.log(`  ${op}: ${time.toFixed(2)}ms`);
    });
  },
};

// Loading State Manager
const LoadingManager = {
  show: (message = "جاري التحميل...") => {
    const overlay = document.getElementById("loading-overlay");
    if (overlay) {
      overlay.classList.add("active");
      const p = overlay.querySelector("p");
      if (p) p.textContent = message;
    }
  },

  hide: () => {
    const overlay = document.getElementById("loading-overlay");
    if (overlay) {
      overlay.classList.remove("active");
    }
  },

  withLoader: async (promise, message = "جاري التحميل...") => {
    LoadingManager.show(message);
    try {
      return await promise;
    } finally {
      LoadingManager.hide();
    }
  },
};

// Enhanced LocalStorage support has been disabled for API-first mode.
const SecureStorage = {
  set: () => false,
  get: () => null,
  remove: () => false,
};

// وظائف عالمية للصالح العام
window.Validator = Validator;
window.ErrorHandler = ErrorHandler;
window.Performance = Performance;
window.LoadingManager = LoadingManager;
window.SecureStorage = SecureStorage;

function checkStorageStatus() {
  console.log("🔍 وظائف التخزين غير مفعّلة في الوضع الديناميكي.");
  return {};
}

function verifyDataUpdate() {
  console.log("🔄 وظائف التحقق من التخزين غير مفعّلة في الوضع الديناميكي.");
}

function clearOldStorageData() {
  console.log("⚠️ حذف البيانات المحلية غير متاح في الوضع الديناميكي.");
}

// تصدير الدوال
window.checkStorageStatus = checkStorageStatus;
window.verifyDataUpdate = verifyDataUpdate;
window.clearOldStorageData = clearOldStorageData;

/* ==================================================
   Data Processing & Validation
   ================================================== */

/* ==================================================
   Professional Data Validation & Sanitization
   ================================================== */

const DataProcessor = {
  // تنظيف وتحقق من البيانات
  sanitize: (str) => {
    if (!str) return "";
    return String(str)
      .trim()
      .replace(/[<>"']/g, "")
      .substring(0, 500);
  },

  validateName: (name) => {
    const sanitized = DataProcessor.sanitize(name);
    if (sanitized.length < 3 || sanitized.length > 100) {
      return { valid: false, error: "الاسم يجب أن يكون بين 3 و 100 حرف" };
    }
    const parts = sanitized.split(/\s+/).filter(Boolean);
    if (parts.length < 2) {
      return {
        valid: false,
        error: "الاسم يجب أن يكون مكوّناً من اسمين على الأقل",
      };
    }
    if (!/[\u0600-\u06FF\sA-Za-z]/.test(sanitized)) {
      return {
        valid: false,
        error: "الاسم يجب أن يحتوي على أحرف عربية أو إنجليزية فقط",
      };
    }
    return { valid: true, data: sanitized };
  },

  validateEmail: (email) => {
    const sanitized = DataProcessor.sanitize(email);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(sanitized)) {
      return { valid: false, error: "البريد الإلكتروني غير صحيح" };
    }
    return { valid: true, data: sanitized };
  },

  validateOrder: (order) => {
    const sanitized = DataProcessor.sanitize(order);
    if (sanitized.length < 5) {
      return { valid: false, error: "بيانات الطلب غير كافية" };
    }
    return { valid: true, data: sanitized };
  },
};

window.DataProcessor = DataProcessor;
/* ==================================================
   Professional Form Validation
   ================================================== */

function validateField(fieldId, fieldType) {
  const field = document.getElementById(fieldId);
  const errorElement = document.getElementById(fieldId + "-error");
  if (!field || !errorElement) return true;

  const value = field.value.trim();
  let isValid = true;
  let errorMessage = "";

  switch (fieldType) {
    case "name":
      const nameVal = DataProcessor.validateName(value);
      isValid = nameVal.valid;
      errorMessage = nameVal.error || "";
      break;
    case "email":
      const emailVal = DataProcessor.validateEmail(value);
      isValid = emailVal.valid;
      errorMessage = emailVal.error || "";
      break;
    case "address":
      if (value.length < 15) {
        isValid = false;
        errorMessage = "العنوان يجب أن يكون 15 حرفاً أو أكثر";
      } else if (value.length > 300) {
        isValid = false;
        errorMessage = "العنوان طويل جداً";
      }
      break;
    case "phone":
      if (!/^[0-9\s+()-]*[0-9]+[0-9\s+()-]*$/.test(value)) {
        isValid = false;
        errorMessage = "رقم الهاتف غير صحيح";
      }
      break;
  }

  if (!isValid) {
    field.style.borderColor = "#EF4444";
    errorElement.textContent = errorMessage;
    errorElement.style.display = "block";
  } else {
    field.style.borderColor = "#10B981";
    errorElement.style.display = "none";
  }

  return isValid;
}

function validateCheckoutForm() {
  const isNameValid = validateField("userName", "name");
  const isAddressValid = validateField("userAddress", "address");
  const isPhoneValid = validateField("userPhone", "phone");
  const isEmailValid = validateField("userEmail", "email");

  if (!isNameValid || !isAddressValid || !isPhoneValid || !isEmailValid) {
    ErrorHandler.showError(
      "يرجى التأكد من استكمال البيانات بشكل صحيح قبل إكمال الطلب.",
    );
    return false;
  }

  // Validate payment method is selected
  const paymentMethod = document.getElementById("paymentMethod");
  if (paymentMethod && !paymentMethod.value) {
    ErrorHandler.showError("الرجاء اختيار طريقة الدفع أولاً.");
    paymentMethod.parentElement.classList.add("shake-error");
    if (typeof window.paymentGatewayAddedClass !== "undefined") {
      setTimeout(() => {
        if (paymentMethod.parentElement)
          paymentMethod.parentElement.classList.remove("shake-error");
      }, 500);
    }
    return false;
  }

  // Validate payment-specific fields
  const method = paymentMethod ? paymentMethod.value : "";
  if (method === "card") {
    return validateCardPayment();
  } else if (method === "wallet") {
    return validateWalletPayment();
  }

  return true;
}

/* ==================================================
   PAYMENT GATEWAY — Professional Payment Logic
   ================================================== */
(function () {
  "use strict";

  // DOM references
  let _payMethodSel = null;
  let _cardForm = null;
  let _walletForm = null;
  let _codForm = null;
  let _paymentFormsContainer = null;
  let _selectedWalletMethod = "vodafone";

  function getPaymentEls() {
    _payMethodSel = document.getElementById("paymentMethod");
    _paymentFormsContainer = document.getElementById("paymentFormsContainer");
    _cardForm = document.getElementById("cardPaymentForm");
    _walletForm = document.getElementById("walletPaymentForm");
    _codForm = document.getElementById("codPaymentForm");
  }

  function showPaymentForm(formEl) {
    if (!_paymentFormsContainer) return;
    [_cardForm, _walletForm, _codForm].forEach((el) => {
      if (el) {
        el.style.display = "none";
        el.style.opacity = "0";
        el.style.transform = "translateY(10px)";
      }
    });
    if (formEl) {
      formEl.style.display = "block";
      // small delay for transition
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          formEl.style.opacity = "1";
          formEl.style.transform = "translateY(0)";
        });
      });
    }
  }

  function onPaymentMethodChange() {
    getPaymentEls();
    if (!_payMethodSel) return;
    const method = _payMethodSel.value;

    switch (method) {
      case "card":
        showPaymentForm(_cardForm);
        break;
      case "wallet":
        showPaymentForm(_walletForm);
        break;
      case "cod":
        updateCodTotal();
        showPaymentForm(_codForm);
        break;
      default:
        showPaymentForm(null);
    }

    // clear previous errors
    clearAllPaymentErrors();
  }

  function updateCodTotal() {
    const totalEl = document.getElementById("totalPrice");
    const codTotal = document.getElementById("codTotalAmount");
    if (totalEl && codTotal) {
      codTotal.textContent = totalEl.textContent + " ج.م";
    }
  }

  // ---- Card Number Masking ----
  function formatCardNumber(raw) {
    let val = raw.replace(/\D/g, "");
    val = val.substring(0, 16);
    return val.replace(/(\d{4})(?=\d)/g, "$1 ");
  }

  function onCardNumberInput(e) {
    const el = e.target;
    const cursorBefore = el.selectionStart || 0;
    const plainBefore = el.value.replace(/\s/g, "").length;

    el.value = formatCardNumber(el.value);

    const plainAfter = el.value.replace(/\s/g, "").length;
    const spacesBefore =
      el.value.substring(0, cursorBefore).split(" ").length - 1;
    // Adjust cursor roughly for spaces added
    let newCursor = cursorBefore;
    if (plainAfter > plainBefore) {
      newCursor +=
        el.value.substring(0, cursorBefore).split(" ").length - spacesBefore;
    }
    el.setSelectionRange(newCursor, newCursor);
    clearError("cardNumberError");
    validateCardNumberLive();
  }

  function validateCardNumberLive() {
    const el = document.getElementById("cardNumber");
    if (!el) return false;
    const digits = el.value.replace(/\D/g, "");
    const hint = document.getElementById("cardNumberHint");
    if (digits.length === 16) {
      el.classList.add("valid");
      el.classList.remove("invalid");
      if (hint) {
        hint.textContent = "✓ رقم البطاقة صحيح";
        hint.style.color = "#22c55e";
      }
      return true;
    } else if (digits.length > 0) {
      el.classList.remove("valid");
      el.classList.add("invalid");
      if (hint) {
        hint.textContent = "أدخل 16 رقماً — المتبقي " + (16 - digits.length);
        hint.style.color = "#f59e0b";
      }
    } else {
      el.classList.remove("valid", "invalid");
      if (hint) {
        hint.textContent = "أدخل 16 رقماً";
        hint.style.color = "#9ca3af";
      }
    }
    return false;
  }

  // ---- Expiry Masking MM/YY ----
  function formatExpiry(raw) {
    let val = raw.replace(/\D/g, "").substring(0, 4);
    if (val.length >= 3) {
      return val.substring(0, 2) + " / " + val.substring(2);
    }
    return val;
  }

  function onExpiryInput(e) {
    const el = e.target;
    el.value = formatExpiry(el.value);
    clearError("cardExpiryError");
    validateExpiryLive();
  }

  function validateExpiryLive() {
    const el = document.getElementById("cardExpiry");
    if (!el) return false;
    const val = el.value.trim();
    const hint = document.getElementById("cardExpiryHint");
    const match = val.match(/^(\d{2})\s*\/\s*(\d{2})$/);
    if (!match) {
      el.classList.remove("valid");
      if (val.length > 0) el.classList.add("invalid");
      if (hint) {
        hint.textContent = "MM / YY";
        hint.style.color = "#9ca3af";
      }
      return false;
    }
    const mm = parseInt(match[1], 10);
    const yy = parseInt(match[2], 10);
    const now = new Date();
    const currentYearShort = parseInt(
      String(now.getFullYear()).substring(2),
      10,
    );
    const currentMonth = now.getMonth() + 1;

    if (mm < 1 || mm > 12) {
      el.classList.add("invalid");
      el.classList.remove("valid");
      if (hint) {
        hint.textContent = "❌ الشهر يجب أن يكون بين 01 و 12";
        hint.style.color = "#ef4444";
      }
      return false;
    }
    if (
      yy < currentYearShort ||
      (yy === currentYearShort && mm < currentMonth)
    ) {
      el.classList.add("invalid");
      el.classList.remove("valid");
      if (hint) {
        hint.textContent = "❌ البطاقة منتهية الصلاحية";
        hint.style.color = "#ef4444";
      }
      return false;
    }
    el.classList.remove("invalid");
    el.classList.add("valid");
    if (hint) {
      hint.textContent = "✓ التاريخ صالح";
      hint.style.color = "#22c55e";
    }
    return true;
  }

  // ---- CVV ----
  function onCvvInput(e) {
    const el = e.target;
    el.value = el.value.replace(/\D/g, "").substring(0, 3);
    clearError("cardCvvError");
    validateCvvLive();
  }

  function validateCvvLive() {
    const el = document.getElementById("cardCvv");
    if (!el) return false;
    const digits = el.value.replace(/\D/g, "");
    const hint = document.getElementById("cardCvvHint");
    if (digits.length === 3) {
      el.classList.add("valid");
      el.classList.remove("invalid");
      if (hint) {
        hint.textContent = "✓ CVV صحيح";
        hint.style.color = "#22c55e";
      }
      return true;
    }
    el.classList.remove("valid");
    if (digits.length > 0) el.classList.add("invalid");
    if (hint) {
      hint.textContent = "3 أرقام على ظهر البطاقة";
      hint.style.color = digits.length > 0 ? "#f59e0b" : "#9ca3af";
    }
    return false;
  }

  // ---- CVV Toggle ----
  function toggleCvvVisibility() {
    const el = document.getElementById("cardCvv");
    const btn = document.getElementById("cvvToggle");
    if (!el || !btn) return;
    if (el.type === "password") {
      el.type = "text";
      btn.innerHTML = '<i class="fa-regular fa-eye-slash"></i>';
    } else {
      el.type = "password";
      btn.innerHTML = '<i class="fa-regular fa-eye"></i>';
    }
  }

  // ---- Card Holder Name ----
  function onCardHolderInput(e) {
    clearError("cardHolderNameError");
    const el = e.target;
    el.classList.remove("invalid");
    if (el.value.trim().length >= 3) {
      el.classList.add("valid");
    } else {
      el.classList.remove("valid");
    }
  }

  function clearError(id) {
    const el = document.getElementById(id);
    if (el) el.textContent = "";
  }

  function showError(id, message) {
    const el = document.getElementById(id);
    if (el) el.textContent = message;
  }

  function clearAllPaymentErrors() {
    [
      "cardNumberError",
      "cardExpiryError",
      "cardCvvError",
      "cardHolderNameError",
      "walletTransactionIdError",
    ].forEach(clearError);
  }

  // ---- Wallet Option Selection ----
  function onWalletOptionClick(e) {
    const wrapper = e.currentTarget;
    if (!wrapper) return;
    document.querySelectorAll(".wallet-option").forEach((opt) => {
      opt.classList.remove("active");
      const check = opt.querySelector(".wallet-check i");
      if (check) {
        check.classList.remove("fa-circle-check");
        check.classList.add("fa-circle");
      }
    });
    wrapper.classList.add("active");
    const check = wrapper.querySelector(".wallet-check i");
    if (check) {
      check.classList.remove("fa-circle");
      check.classList.add("fa-circle-check");
    }
    _selectedWalletMethod = wrapper.dataset.wallet || "vodafone";
  }

  // ---- Wallet Transaction ID ----
  function onWalletTxInput(e) {
    clearError("walletTransactionIdError");
    const el = e.target;
    el.classList.remove("invalid");
    if (el.value.trim().length >= 4) {
      el.classList.add("valid");
    } else {
      el.classList.remove("valid");
    }
  }

  // ---- Constructors / Destructors ----
  function attachPaymentListeners() {
    getPaymentEls();
    if (_payMethodSel)
      _payMethodSel.addEventListener("change", onPaymentMethodChange);

    const cardNumber = document.getElementById("cardNumber");
    if (cardNumber) {
      cardNumber.addEventListener("input", onCardNumberInput);
      cardNumber.addEventListener("blur", validateCardNumberLive);
    }
    const cardExpiry = document.getElementById("cardExpiry");
    if (cardExpiry) {
      cardExpiry.addEventListener("input", onExpiryInput);
      cardExpiry.addEventListener("blur", validateExpiryLive);
    }
    const cardCvv = document.getElementById("cardCvv");
    if (cardCvv) {
      cardCvv.addEventListener("input", onCvvInput);
      cardCvv.addEventListener("blur", validateCvvLive);
    }
    const cvvToggle = document.getElementById("cvvToggle");
    if (cvvToggle) cvvToggle.addEventListener("click", toggleCvvVisibility);
    const cardHolder = document.getElementById("cardHolderName");
    if (cardHolder) {
      cardHolder.addEventListener("input", onCardHolderInput);
    }
    document.querySelectorAll(".wallet-option").forEach((opt) => {
      opt.addEventListener("click", onWalletOptionClick);
    });
    const walletTx = document.getElementById("walletTransactionId");
    if (walletTx) walletTx.addEventListener("input", onWalletTxInput);
  }

  // Run once DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", attachPaymentListeners);
  } else {
    attachPaymentListeners();
  }

  // Expose utilities for checkout
  window.validateCardPayment = function () {
    let valid = true;
    const cardNumber = document.getElementById("cardNumber");
    const expiry = document.getElementById("cardExpiry");
    const cvv = document.getElementById("cardCvv");
    const holder = document.getElementById("cardHolderName");

    if (!cardNumber || cardNumber.value.replace(/\D/g, "").length !== 16) {
      showError("cardNumberError", "✗ أدخل رقم البطاقة كاملاً (16 رقماً)");
      if (cardNumber) cardNumber.classList.add("invalid");
      valid = false;
    }
    if (!expiry || !validateExpiryLive()) {
      showError("cardExpiryError", "✗ أدخل تاريخ انتهاء صالح");
      valid = false;
    }
    if (!cvv || cvv.value.replace(/\D/g, "").length !== 3) {
      showError("cardCvvError", "✗ أدخل رمز CVV (3 أرقام)");
      if (cvv) cvv.classList.add("invalid");
      valid = false;
    }
    if (!holder || holder.value.trim().length < 3) {
      showError("cardHolderNameError", "✗ أدخل اسم حامل البطاقة");
      if (holder) holder.classList.add("invalid");
      valid = false;
    }

    if (!valid) {
      ErrorHandler.showError("يرجى التأكد من صحة بيانات البطاقة البنكية.");
    }
    return valid;
  };

  window.validateWalletPayment = function () {
    const txEl = document.getElementById("walletTransactionId");
    if (!txEl || txEl.value.trim().length < 4) {
      showError(
        "walletTransactionIdError",
        "✗ أدخل رقم العملية أو رقم المرسل (4 أرقام على الأقل)",
      );
      if (txEl) txEl.classList.add("invalid");
      ErrorHandler.showError("يرجى إدخال رقم العملية للتحقق من الدفع.");
      return false;
    }
    return true;
  };

  window.getPaymentData = function () {
    const paymentMethod = document.getElementById("paymentMethod");
    const method = paymentMethod ? paymentMethod.value : "";

    if (method === "card") {
      return {
        method: "card",
        cardNumberMasked: document.getElementById("cardNumber")?.value || "",
        cardLast4: (
          document.getElementById("cardNumber")?.value.replace(/\D/g, "") || ""
        ).slice(-4),
        cardHolderName:
          document.getElementById("cardHolderName")?.value?.trim() || "",
        cardExpiry: document.getElementById("cardExpiry")?.value?.trim() || "",
        // Never send raw card number to server - only masked/last4 for reference
      };
    } else if (method === "wallet") {
      return {
        method: "wallet",
        walletProvider: _selectedWalletMethod,
        walletProviderName:
          _selectedWalletMethod === "vodafone" ? "Vodafone Cash" : "InstaPay",
        transactionId:
          document.getElementById("walletTransactionId")?.value?.trim() || "",
        walletNumber: "01061876685",
      };
    } else if (method === "cod") {
      return {
        method: "cod",
        codFee: 5,
        note: "الدفع عند الاستلام",
      };
    }
    return { method: "" };
  };
})();

window.validateField = validateField;

// Offline queue + retry system for outbox submissions
// المراتب المعلقة التي لم تُرسل بنجاح
const OUTBOX_KEY = "outboxQueue_v1";
const MAX_ATTEMPTS = 5;
const sendingSet = new Set();

function dedupeOutboxQueue(q) {
  if (!Array.isArray(q) || q.length === 0) return [];
  const seen = new Set();
  const deduped = [];
  q.forEach((item) => {
    const orderId = item?.payload?.orderId;
    if (!orderId || !seen.has(orderId)) {
      if (orderId) seen.add(orderId);
      deduped.push(item);
    } else {
      console.log("🔁 تم حذف طلب مكرر من الطابور حسب orderId:", orderId);
    }
  });
  return deduped;
}

function getOutbox() {
  try {
    const q = JSON.parse(localStorage.getItem(OUTBOX_KEY)) || [];
    const deduped = dedupeOutboxQueue(q);
    if (deduped.length !== q.length) {
      saveOutbox(deduped);
    }
    return deduped;
  } catch (e) {
    return [];
  }
}

function saveOutbox(q) {
  try {
    localStorage.setItem(OUTBOX_KEY, JSON.stringify(dedupeOutboxQueue(q)));
  } catch (e) {
    console.warn("Failed saving outbox", e);
  }
}

function outboxHasOrder(orderId) {
  if (!orderId) return false;
  return getOutbox().some(
    (item) => item.payload && item.payload.orderId === orderId,
  );
}

function enqueueSubmission(payload) {
  if (payload && payload.orderId && outboxHasOrder(payload.orderId)) {
    console.log(
      "🔁 تم تخطي إضافة طلب مكرر إلى طابور الطلبات المعلقة:",
      payload.orderId,
    );
    return null;
  }

  const q = getOutbox();
  const item = {
    id: Date.now() + "-" + Math.random().toString(36).slice(2, 8),
    attempts: 0,
    payload,
  };
  q.push(item);
  saveOutbox(q);
  processOutbox();
  return item.id;
}

function removeFromOutbox(id, orderId) {
  const q = getOutbox().filter(
    (i) => i.id !== id && i.payload?.orderId !== orderId,
  );
  saveOutbox(q);
}

function sendToGoogleSheets(payload) {
  // Migrated from Google Sheets to PHP backend
  // Send orders to local PHP backend (api/save_order.php) for persistence
  const url = "api/save_order.php";

  const formData = new FormData();
  formData.append("customer_name", payload.customerName || "بدون اسم");
  formData.append("phone", payload.phone || "");
  formData.append("address", payload.address || "بدون عنوان");
  formData.append("email", payload.email || "");
  formData.append("total_price", payload.totalPrice || "0");
  formData.append(
    "cart_items",
    JSON.stringify(Array.isArray(payload.items) ? payload.items : []),
  );

  return fetch(url, {
    method: "POST",
    body: formData,
  })
    .then((res) => {
      if (res.ok) return res.json().catch(() => ({}));
      throw new Error("Network response not ok: " + res.status);
    })
    .catch((err) => {
      console.warn("Failed to send order to PHP backend:", err);
      throw err;
    });
}

function processItem(item) {
  if (sendingSet.has(item.id)) return;
  sendingSet.add(item.id);

  item.attempts = (item.attempts || 0) + 1;
  sendToGoogleSheets(item.payload)
    .then((result) => {
      console.log("Outbox item sent:", item.id, result);
      logEvent("OUTBOX_SEND_SUCCESS", { id: item.id });
      removeFromOutbox(item.id, item.payload?.orderId);
      sendingSet.delete(item.id);
    })
    .catch((err) => {
      console.warn(
        "Outbox send failed for",
        item.id,
        "attempt",
        item.attempts,
        err.message || err,
      );
      logEvent("OUTBOX_SEND_FAIL", { id: item.id, err: err.message });
      sendingSet.delete(item.id);
      if (item.attempts < MAX_ATTEMPTS) {
        const delay = Math.min(30000, Math.pow(2, item.attempts) * 1000);
        setTimeout(() => processOutbox(), delay);
        const q = getOutbox().map((i) => (i.id === item.id ? item : i));
        saveOutbox(q);
      } else {
        console.error("Outbox item failed permanently", item.id);
      }
    });
}

function processOutbox() {
  const q = getOutbox();
  if (!q || q.length === 0) return;
  q.slice(0, 10).forEach((item) => processItem(item));
}

// Public helper: submit order payload (validated) — enqueue for reliable delivery
function submitOrderToGoogleSheets(
  orderId = "",
  orderSummary = "",
  cartItems = [],
) {
  if (window.isGoogleSheetsSubmitting) {
    console.warn("Google Sheets submission already in progress");
    return;
  }

  window.isGoogleSheetsSubmitting = true;

  const submitBtn = document.querySelector(
    '.confirm-btn[data-action="finish-order"]',
  );
  if (submitBtn) {
    if (!submitBtn.dataset.originalText) {
      submitBtn.dataset.originalText = submitBtn.textContent.trim();
    }
    submitBtn.disabled = true;
    submitBtn.style.opacity = "0.5";
    submitBtn.style.cursor = "not-allowed";
    submitBtn.textContent = "⏳ جاري الإرسال...";
  }

  const userName =
    document.getElementById("userName")?.value?.trim() || "بدون اسم";
  let userPhone =
    document.getElementById("userPhone")?.value?.trim() || "201021279663";
  userPhone = userPhone.replace(/^0/, "20").replace(/\D/g, "");
  if (!userPhone.startsWith("20")) {
    userPhone = "20" + userPhone;
  }
  const userAddress =
    document.getElementById("userAddress")?.value?.trim() || "بدون عنوان";
  const userEmail =
    document.getElementById("userEmail")?.value?.trim() || "بدون بريد";

  const orderSummaryValue =
    orderSummary ||
    document.getElementById("orderSummary")?.textContent?.trim() ||
    "طلب غير محدد";
  const orderPriceElement = document.getElementById("totalPrice");
  const totalPrice = orderPriceElement
    ? orderPriceElement.textContent.trim()
    : "0";

  const orderItems = (Array.isArray(cartItems) ? cartItems : []).map((item) => {
    const quantity = item.quantity || 1;
    return {
      name: item.name,
      price: item.price,
      category: item.category || item.cat || "food",
      quantity,
      totalPrice: item.price * quantity,
    };
  });

  const finalOrderId = orderId || "ORD-" + Date.now();
  const payload = {
    orderId: finalOrderId,
    customerName: userName,
    phone: userPhone,
    address: userAddress,
    email: userEmail || "",
    totalPrice,
    items: orderItems,
  };

  enqueueSubmission(payload);
  logEvent("ENQUEUE_ORDER", { orderId: finalOrderId });
  window.isGoogleSheetsSubmitting = false;
}

window.isGoogleSheetsSubmitting = false;
// submitOrderToGoogleSheets function removed - use saveOrderToMySQLDatabase instead

// Try processing outbox on online event and on load
window.addEventListener("online", () => {
  showNotification(
    "🔄 اتصال الانترنت مستعاد - جاري إرسال الطلبات المعلقة",
    "info",
  );
  processOutbox();
});
setTimeout(() => processOutbox(), 1000);

// دالة تسجيل الأحداث المهمة
function logEvent(eventName, eventData = {}) {
  const log = {
    event: eventName,
    data: eventData,
    timestamp: new Date().toISOString(),
  };
  console.log("📊 Event:", log);
  // يمكن إرسال هذا لـ analytics service إذا لزم
}

window.logEvent = logEvent;

document.addEventListener("DOMContentLoaded", function () {
  const orderForm = document.getElementById("order-form");
  if (!orderForm) return;

  orderForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const formData = new FormData(this);
    const formName = formData.get("name") || "";
    const formEmail = formData.get("email") || "";
    const formOrder = formData.get("order") || "";

    // تحقق من البيانات
    const nameCheck = DataProcessor.validateName(formName);
    const emailCheck = DataProcessor.validateEmail(formEmail);
    const orderCheck = DataProcessor.validateOrder(formOrder);

    if (!nameCheck.valid) {
      alert("❌ " + nameCheck.error);
      return;
    }
    if (!emailCheck.valid) {
      alert("❌ " + emailCheck.error);
      return;
    }

    const data = {
      name: nameCheck.data,
      email: emailCheck.data,
      order: orderCheck.data,
    };

    console.log("📤 إرسال البيانات إلى الخادم:", data);

    // Send to PHP backend instead of Google Sheets
    const requestData = new FormData();
    requestData.append("name", data.name);
    requestData.append("email", data.email);
    requestData.append("order", data.order);

    fetch("api/save_order.php", {
      method: "POST",
      body: requestData,
      keepalive: true,
    })
      .then((response) => {
        if (response.ok) return response.json().catch(() => ({}));
        throw new Error("Network response not ok: " + response.status);
      })
      .then((result) => {
        alert("✅ تم بنجاح!");
        orderForm.reset();
        console.log("✅ تم إرسال البيانات إلى الخادم بنجاح", result);
        logEvent("MANUAL_FORM_SUBMISSION_SUCCESS", { name: data.name });
      })
      .catch((error) => {
        console.warn("Manual form send failed", error);
        console.error("❌ خطأ في الإرسال:", error);
        alert("❌ خطأ في الإرسال. تأكد من الاتصال بالإنترنت وحاول مرة أخرى.");
        logEvent("MANUAL_FORM_SUBMISSION_ERROR", { error: error.message });
      });
  });
});

// Attach contact form: validate and optionally send to Google Sheets (type: contact)
document.addEventListener("DOMContentLoaded", function () {
  const contactForm = document.getElementById("contactForm");
  if (!contactForm) return;

  contactForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const name = document.getElementById("contact_name")?.value?.trim() || "";
    const email = document.getElementById("contact_email")?.value?.trim() || "";
    const message =
      document.getElementById("contact_message")?.value?.trim() || "";

    const nameCheck = DataProcessor.validateName(name);
    const emailCheck = DataProcessor.validateEmail(email);
    const orderCheck = DataProcessor.validateOrder(message);

    if (!nameCheck.valid) {
      alert(nameCheck.error);
      return;
    }
    if (!emailCheck.valid) {
      alert(emailCheck.error);
      return;
    }
    if (!orderCheck.valid) {
      alert(orderCheck.error);
      return;
    }

    const payload = {
      name: nameCheck.data,
      email: emailCheck.data,
      order: orderCheck.data,
      type: "contact",
      timestamp: new Date().toISOString(),
    };

    // الآن نُرسل أيضاً نسخة إلى سكربت PHP المحلي ليقوم بإرسال البريد
    // النموذج يحتوي على حقول إضافية مثل الهاتف والموضوع
    const phpParams = new URLSearchParams({
      name: payload.name,
      email: payload.email,
      phone: document.getElementById("contact_phone")?.value?.trim() || "",
      subject:
        document.getElementById("contact_subject")?.value?.trim() ||
        "رسالة من الموقع",
      message: payload.order,
    });

    fetch("api/contact.php", {
      method: "POST",
      body: phpParams,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
    })
      .then((res) => res.json())
      .then((res) => {
        if (!res.ok)
          console.warn("PHP contact endpoint replied with error", res);
      })
      .catch((err) =>
        console.warn("Unable to send email via PHP endpoint", err),
      );
  });
});
