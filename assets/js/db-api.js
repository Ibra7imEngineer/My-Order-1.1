/**
 * =============================================================================
 * MySQL Database API Integration
 * =============================================================================
 *
 * This module provides clean functions to interact with the MySQL database
 * through the process_all.php API endpoint.
 *
 * Functions:
 * - loadMenuFromDB()        Fetch all menu items
 * - addMenuItemToDB()       Add a new menu item with proper category
 * - deleteMenuItemFromDB()  Delete a menu item by ID
 * - submitOrderToDB()       Submit a complete order with items
 *
 * =============================================================================
 */

// API Base URL
const DB_API_BASE = "api/process_all.php";

/**
 * Load all menu items from the database
 *
 * @returns {Promise<Array>} Array of menu items with id, item_name, unit_price, category, image_url
 * @throws {Error} If fetch fails
 */
async function loadMenuFromDB() {
  try {
    const response = await fetch(`${DB_API_BASE}?action=fetch`);

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`دخطأ في الاتصال (${response.status}): ${body}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "فشل جلب المنيو");
    }

    // Transform MySQL response to match app format
    return (result.data || [])
      .map((item) => ({
        id: item.id,
        ID: String(item.id),
        "Item Name": item.item_name,
        name: item.item_name,
        Category: mapCategoryToArabic(item.category),
        category: item.category,
        cat: item.category,
        Price: item.unit_price,
        price: item.unit_price,
        "Image URL":
          item.image_url || "https://via.placeholder.com/320x220?text=No+Image",
        img:
          item.image_url || "https://via.placeholder.com/320x220?text=No+Image",
      }))
      .filter(Boolean);
  } catch (error) {
    console.error("❌ خطأ في تحميل المنيو:", error);
    throw error;
  }
}

/**
 * Add a new menu item to the database
 *
 * IMPORTANT: The category parameter MUST be one of the three Arabic categories:
 * - 'أطعمة' (Foods)
 * - 'مشروبات' (Drinks)
 * - 'حلويات' (Sweets)
 *
 * @param {string} itemName   - Item name (required)
 * @param {number} unitPrice  - Item price in EGP (required, must be > 0)
 * @param {string} category   - One of: 'أطعمة', 'مشروبات', 'حلويات' (required)
 * @param {string} imageUrl   - Item image URL (optional)
 *
 * @returns {Promise<Object>} {success: true, id: number} on success
 * @throws {Error} If validation fails or request fails
 */
async function addMenuItemToDB(itemName, unitPrice, category, imageUrl = "") {
  try {
    // Client-side validation
    if (!itemName || itemName.trim() === "") {
      throw new Error("اسم المنتج مطلوب");
    }

    if (unitPrice <= 0 || isNaN(unitPrice)) {
      throw new Error("السعر يجب أن يكون أكبر من صفر");
    }

    // Validate category - MUST be one of three options
    const validCategories = ["أطعمة", "مشروبات", "حلويات"];
    if (!validCategories.includes(category)) {
      throw new Error("التصنيف يجب أن يكون: أطعمة أو مشروبات أو حلويات");
    }

    // Prepare payload
    const payload = {
      action: "add",
      item_name: itemName.trim(),
      unit_price: parseFloat(unitPrice),
      category: category.trim(),
      image_url: imageUrl.trim(),
    };

    // Send to server
    const response = await fetch(DB_API_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const bodyText = await response.text();
      let errorMessage = bodyText;
      try {
        const json = JSON.parse(bodyText);
        errorMessage = json.details
          ? `${json.error}: ${json.details}`
          : json.error || bodyText;
      } catch {
        // Keep body text when JSON cannot be parsed
      }
      throw new Error(`خطأ في الاتصال (${response.status}): ${errorMessage}`);
    }

    const result = await response.json();

    if (!result.success) {
      let details = result.details ? `: ${result.details}` : "";
      let suggestion = result.suggestion ? `\n💡 ${result.suggestion}` : "";
      const fullMessage = `${result.error}${details}${suggestion}`;
      throw new Error(fullMessage);
    }

    console.log("✅ تم إضافة المنتج بنجاح:", result.data);
    return result.data;
  } catch (error) {
    console.error("❌ خطأ في إضافة المنتج:", error);
    throw error;
  }
}

/**
 * Delete a menu item from the database
 *
 * @param {number} itemId - Menu item ID to delete
 * @returns {Promise<Object>} {success: true} on success
 * @throws {Error} If request fails
 */
async function deleteMenuItemFromDB(itemId) {
  try {
    if (!itemId || itemId <= 0) {
      throw new Error("معرّف منتج صحيح مطلوب");
    }

    const payload = {
      action: "delete",
      id: parseInt(itemId),
    };

    const response = await fetch(DB_API_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`خطأ في الاتصال (${response.status}): ${body}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "فشل حذف المنتج");
    }

    console.log("✅ تم حذف المنتج بنجاح:", result);
    return result;
  } catch (error) {
    console.error("❌ خطأ في حذف المنتج:", error);
    throw error;
  }
}

/**
 * Submit a complete order to the database
 *
 * This function:
 * 1. Validates all customer data
 * 2. Validates cart items
 * 3. Sends to the server which:
 *    - Creates order header in orders table
 *    - Inserts items into order_items table
 *    - Automatically calculates totals
 *
 * @param {string} customerName - Full customer name (required)
 * @param {string} phone        - Phone number (required)
 * @param {string} address      - Delivery address (required)
 * @param {Array}  cartItems    - Array of cart items: [{item_name: '...', quantity: 2}, ...]
 *
 * @returns {Promise<Object>} {order_id: number, ...details} on success
 * @throws {Error} If validation fails or request fails
 */
async function submitOrderToDB(customerName, phone, address, cartItems) {
  try {
    // Validate customer data
    if (!customerName || customerName.trim() === "") {
      throw new Error("اسم العميل مطلوب");
    }

    if (!phone || phone.trim() === "") {
      throw new Error("رقم الهاتف مطلوب");
    }

    if (!address || address.trim() === "") {
      throw new Error("عنوان التوصيل مطلوب");
    }

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      throw new Error("السلة فارغة - أضف منتجات قبل الطلب");
    }

    // Validate cart items format
    const validatedItems = cartItems.map((item) => {
      if (!item.item_name || item.item_name.trim() === "") {
        throw new Error("اسم المنتج مطلوب");
      }
      if (!item.quantity || item.quantity <= 0) {
        throw new Error(`كمية غير صحيحة للمنتج: ${item.item_name}`);
      }
      return {
        item_name: item.item_name.trim(),
        quantity: parseInt(item.quantity),
        category: item.category || "أطعمة", // Include category from cart item
      };
    });

    // Prepare payload
    const payload = {
      action: "submit-order",
      customer_name: customerName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      cart_items: validatedItems,
    };

    console.log("📤 إرسال الطلب:", payload);

    // Send to server
    const response = await fetch(DB_API_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`خطأ في الاتصال (${response.status}): ${body}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "فشل تقديم الطلب");
    }

    console.log("✅ تم تقديم الطلب بنجاح:", result.data);
    return result.data;
  } catch (error) {
    console.error("❌ خطأ في تقديم الطلب:", error);
    throw error;
  }
}

/**
 * Helper function to map database category codes to Arabic names
 */
function mapCategoryToArabic(category) {
  const categoryMap = {
    أطعمة: "أطعمة",
    مشروبات: "مشروبات",
    حلويات: "حلويات",
    food: "أطعمة",
    drinks: "مشروبات",
    sweets: "حلويات",
  };
  return categoryMap[category] || category;
}

// Export for use in other files
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    loadMenuFromDB,
    addMenuItemToDB,
    deleteMenuItemFromDB,
    submitOrderToDB,
  };
}
