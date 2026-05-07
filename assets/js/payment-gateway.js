/**
 * ==================================================
 * My Order - Payment Gateway Module (Production-Ready)
 * ==================================================
 *
 * 👨‍💻 Developer: Ibrahim Mohamed
 * 📧 Email: ibra7im.engineer@gmail.com
 * ⭐ Version: 1.0 - Enterprise Grade Payment System
 * 🔒 Security: PCI-DSS Compliant
 * 🏦 Payment Providers: Paymob, Vodafone Cash, InstaPay
 *
 * ==================================================
 */

"use strict";

/**
 * ========================================
 * 1. PAYMENT GATEWAY CONFIGURATION
 * ========================================
 */

const PaymentGateway = {
  // Paymob API Configuration
  paymobConfig: {
    apiKey: "", // Set from environment or server
    iframeId: "paymob-payment-iframe",
    merchantId: "", // Your Merchant ID from Paymob
  },

  // Payment Methods Configuration
  paymentMethods: {
    card: {
      name: "بطاقة ائتمانية",
      supportedCards: ["visa", "mastercard", "meeza"],
      provider: "paymob",
      icon: "fa-credit-card",
    },
    vodafone: {
      name: "Vodafone Cash",
      phone: "01001887685",
      provider: "vodafone",
      icon: "fa-mobile-screen",
      color: "#FF0000",
    },
    instapay: {
      name: "InstaPay",
      identifier: "ibra7im@instapay",
      provider: "instapay",
      icon: "fa-bolt",
      color: "#FF9900",
    },
    cod: {
      name: "الدفع عند الاستلام",
      provider: "local",
      icon: "fa-hand-holding-dollar",
    },
  },

  // Current session data
  currentOrder: {
    orderId: null,
    amount: 0,
    items: [],
    customer: {},
    selectedMethod: null,
  },

  /**
   * ========================================
   * 2. INITIALIZATION
   * ========================================
   */

  init() {
    console.log("🔐 Initializing Payment Gateway...");
    this.attachEventListeners();
    this.setupFormValidation();
    this.loadPaymobScript();
    console.log("✅ Payment Gateway initialized");
  },

  attachEventListeners() {
    // Payment method selector
    const paymentMethodSelect = document.getElementById("paymentMethod");
    if (paymentMethodSelect) {
      paymentMethodSelect.addEventListener("change", (e) => {
        this.showPaymentForm(e.target.value);
      });
    }

    // Card input events
    this.setupCardInputs();

    // Payment form submit
    const submitButton = document.querySelector('[data-action="finish-order"]');
    if (submitButton) {
      submitButton.addEventListener("click", () => this.handleOrderSubmit());
    }

    // CVV toggle visibility
    const cvvToggle = document.getElementById("cvvToggle");
    if (cvvToggle) {
      cvvToggle.addEventListener("click", (e) => {
        e.preventDefault();
        const cvvInput = document.getElementById("cardCvv");
        cvvInput.type = cvvInput.type === "password" ? "text" : "password";
        cvvToggle.innerHTML =
          cvvInput.type === "password"
            ? '<i class="fa-regular fa-eye"></i>'
            : '<i class="fa-regular fa-eye-slash"></i>';
      });
    }

    // Wallet selection
    document.querySelectorAll(".wallet-option").forEach((option) => {
      option.addEventListener("click", (e) => {
        this.selectWallet(option.dataset.wallet);
      });
    });
  },

  /**
   * ========================================
   * 3. CARD INPUT HANDLING
   * ========================================
   */

  setupCardInputs() {
    const cardNumberInput = document.getElementById("cardNumber");
    const cardExpiryInput = document.getElementById("cardExpiry");
    const cardCvvInput = document.getElementById("cardCvv");

    // Card Number - Format and detect card type
    if (cardNumberInput) {
      cardNumberInput.addEventListener("input", (e) => {
        let value = e.target.value.replace(/\s/g, "");
        let formatted = value.match(/.{1,4}/g)?.join(" ") || value;
        e.target.value = formatted;

        // Detect card type
        this.detectCardType(value);

        // Validate card
        this.validateCardNumber(value);
      });
    }

    // Card Expiry - Format MM/YY
    if (cardExpiryInput) {
      cardExpiryInput.addEventListener("input", (e) => {
        let value = e.target.value.replace(/\D/g, "");
        if (value.length >= 2) {
          value = value.slice(0, 2) + " / " + value.slice(2, 4);
        }
        e.target.value = value;
        this.validateExpiry(e.target.value);
      });
    }

    // CVV - Only numbers
    if (cardCvvInput) {
      cardCvvInput.addEventListener("input", (e) => {
        e.target.value = e.target.value.replace(/\D/g, "").slice(0, 3);
        this.validateCVV(e.target.value);
      });
    }
  },

  /**
   * ========================================
   * 4. CARD TYPE DETECTION
   * ========================================
   */

  detectCardType(cardNumber) {
    const patterns = {
      visa: /^4[0-9]{12}(?:[0-9]{3})?$/,
      mastercard:
        /^5[1-5][0-9]{14}$|^2(?:22[1-9]|[23]\d{2}|4[0-9]{2}|5[1-9][0-9])[0-9]{12}$/,
      meeza: /^6062[0-9]{12}$/, // Egyptian National Payment Switch (Meeza)
    };

    const cardTypesContainer = document.querySelector(".card-icons");
    if (!cardTypesContainer) return;

    let detectedType = "unknown";

    for (let [type, pattern] of Object.entries(patterns)) {
      if (pattern.test(cardNumber)) {
        detectedType = type;
        break;
      }
    }

    // Update UI to show detected card type
    this.updateCardTypeDisplay(detectedType);
  },

  updateCardTypeDisplay(cardType) {
    const cardIcons = document.querySelector(".card-icons");
    if (!cardIcons) return;

    // Clear and add appropriate icon
    cardIcons.innerHTML = "";

    if (cardType === "visa") {
      cardIcons.innerHTML =
        '<i class="fa-brands fa-cc-visa" title="Visa"></i><i class="fa-brands fa-cc-mastercard" style="opacity:0.3;"></i><i class="fa-brands fa-cc-amex" style="opacity:0.3;"></i>';
    } else if (cardType === "mastercard") {
      cardIcons.innerHTML =
        '<i class="fa-brands fa-cc-visa" style="opacity:0.3;"></i><i class="fa-brands fa-cc-mastercard" title="Mastercard"></i><i class="fa-brands fa-cc-amex" style="opacity:0.3;"></i>';
    } else if (cardType === "meeza") {
      cardIcons.innerHTML =
        '<i class="fa-brands fa-cc-visa" style="opacity:0.3;"></i><i class="fa-brands fa-cc-mastercard" style="opacity:0.3;"></i><i class="fa-brands fa-cc-amex" title="Meeza"></i>';
    } else {
      cardIcons.innerHTML =
        '<i class="fa-brands fa-cc-visa"></i><i class="fa-brands fa-cc-mastercard"></i><i class="fa-brands fa-cc-amex"></i>';
    }
  },

  /**
   * ========================================
   * 5. VALIDATION FUNCTIONS
   * ========================================
   */

  // Luhn Algorithm for credit card validation
  luhnCheck(cardNumber) {
    if (!cardNumber || typeof cardNumber !== "string") return false;

    const digits = cardNumber.replace(/\D/g, "");
    if (digits.length < 13 || digits.length > 19) return false;

    let sum = 0;
    let isEven = false;

    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits[i], 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  },

  validateCardNumber(cardNumber) {
    const input = document.getElementById("cardNumber");
    const errorElement = document.getElementById("cardNumberError");
    const hintElement = document.getElementById("cardNumberHint");

    const cleanNumber = cardNumber.replace(/\s/g, "");

    if (cleanNumber.length === 0) {
      if (errorElement) errorElement.style.display = "none";
      if (hintElement) hintElement.style.display = "block";
      if (input) input.style.borderColor = "";
      return false;
    }

    if (cleanNumber.length < 13) {
      if (errorElement) {
        errorElement.textContent = "❌ رقم البطاقة غير كامل";
        errorElement.style.display = "block";
      }
      if (input) input.style.borderColor = "#EF4444";
      return false;
    }

    if (!this.luhnCheck(cleanNumber)) {
      if (errorElement) {
        errorElement.textContent = "❌ رقم البطاقة غير صحيح";
        errorElement.style.display = "block";
      }
      if (input) input.style.borderColor = "#EF4444";
      return false;
    }

    if (errorElement) errorElement.style.display = "none";
    if (hintElement) hintElement.style.display = "none";
    if (input) input.style.borderColor = "#10B981";
    return true;
  },

  validateExpiry(expiryString) {
    const input = document.getElementById("cardExpiry");
    const errorElement = document.getElementById("cardExpiryError");

    const match = expiryString.match(/(\d{2})\s\/\s(\d{2})/);
    if (!match) {
      if (errorElement) errorElement.style.display = "none";
      if (input) input.style.borderColor = "";
      return false;
    }

    const month = parseInt(match[1], 10);
    const year = parseInt("20" + match[2], 10);
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    if (month < 1 || month > 12) {
      if (errorElement) {
        errorElement.textContent = "❌ الشهر غير صحيح";
        errorElement.style.display = "block";
      }
      if (input) input.style.borderColor = "#EF4444";
      return false;
    }

    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      if (errorElement) {
        errorElement.textContent = "❌ البطاقة منتهية الصلاحية";
        errorElement.style.display = "block";
      }
      if (input) input.style.borderColor = "#EF4444";
      return false;
    }

    if (errorElement) errorElement.style.display = "none";
    if (input) input.style.borderColor = "#10B981";
    return true;
  },

  validateCVV(cvv) {
    const input = document.getElementById("cardCvv");
    const errorElement = document.getElementById("cardCvvError");

    if (cvv.length !== 3) {
      if (errorElement) errorElement.style.display = "none";
      if (input) input.style.borderColor = "";
      return false;
    }

    if (!/^\d{3}$/.test(cvv)) {
      if (errorElement) {
        errorElement.textContent = "❌ CVV يجب أن يكون 3 أرقام";
        errorElement.style.display = "block";
      }
      if (input) input.style.borderColor = "#EF4444";
      return false;
    }

    if (errorElement) errorElement.style.display = "none";
    if (input) input.style.borderColor = "#10B981";
    return true;
  },

  // Egyptian phone number validation
  validateEgyptianPhone(phone) {
    // Remove spaces and special characters
    const cleanPhone = phone.replace(/\D/g, "");

    // Must be 11 digits starting with 01
    const egyptianPhoneRegex = /^201[0-9]{9}$|^01[0-9]{9}$/;

    return egyptianPhoneRegex.test(cleanPhone);
  },

  setupFormValidation() {
    // Validate name
    const nameInput = document.getElementById("userName");
    if (nameInput) {
      nameInput.addEventListener("blur", (e) => {
        const value = e.target.value.trim();
        const errorElement = document.getElementById("userName-error");

        if (value.length < 5) {
          if (errorElement) {
            errorElement.textContent = "❌ الاسم يجب أن يكون 5 أحرف على الأقل";
            errorElement.style.display = "block";
          }
          e.target.style.borderColor = "#EF4444";
        } else {
          if (errorElement) errorElement.style.display = "none";
          e.target.style.borderColor = "#10B981";
        }
      });
    }

    // Validate phone
    const phoneInput = document.getElementById("userPhone");
    if (phoneInput) {
      phoneInput.addEventListener("blur", (e) => {
        const value = e.target.value.trim();
        const errorElement = document.getElementById("userPhone-error");

        if (!this.validateEgyptianPhone(value)) {
          if (errorElement) {
            errorElement.textContent =
              "❌ رقم هاتف مصري غير صحيح (01xxxxxxxxx)";
            errorElement.style.display = "block";
          }
          e.target.style.borderColor = "#EF4444";
        } else {
          if (errorElement) errorElement.style.display = "none";
          e.target.style.borderColor = "#10B981";
        }
      });
    }

    // Validate address
    const addressInput = document.getElementById("userAddress");
    if (addressInput) {
      addressInput.addEventListener("blur", (e) => {
        const value = e.target.value.trim();
        const errorElement = document.getElementById("userAddress-error");

        if (value.length < 15) {
          if (errorElement) {
            errorElement.textContent =
              "❌ العنوان يجب أن يكون 15 حرفاً على الأقل";
            errorElement.style.display = "block";
          }
          e.target.style.borderColor = "#EF4444";
        } else {
          if (errorElement) errorElement.style.display = "none";
          e.target.style.borderColor = "#10B981";
        }
      });
    }

    // Validate email
    const emailInput = document.getElementById("userEmail");
    if (emailInput) {
      emailInput.addEventListener("blur", (e) => {
        const value = e.target.value.trim();
        const errorElement = document.getElementById("userEmail-error");
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!emailRegex.test(value)) {
          if (errorElement) {
            errorElement.textContent = "❌ بريد إلكتروني غير صحيح";
            errorElement.style.display = "block";
          }
          e.target.style.borderColor = "#EF4444";
        } else {
          if (errorElement) errorElement.style.display = "none";
          e.target.style.borderColor = "#10B981";
        }
      });
    }
  },

  /**
   * ========================================
   * 6. PAYMENT FORM DISPLAY
   * ========================================
   */

  showPaymentForm(method) {
    // Hide all forms
    document.querySelectorAll(".payment-form-section").forEach((form) => {
      form.style.display = "none";
    });

    this.currentOrder.selectedMethod = method;

    // Show selected form
    switch (method) {
      case "card":
        const cardForm = document.getElementById("cardPaymentForm");
        if (cardForm) cardForm.style.display = "block";
        this.initPaymobCard();
        break;

      case "wallet":
        const walletForm = document.getElementById("walletPaymentForm");
        if (walletForm) walletForm.style.display = "block";
        break;

      case "cod":
        const codForm = document.getElementById("codPaymentForm");
        if (codForm) {
          codForm.style.display = "block";
          // Update COD total
          const totalAmount = document.getElementById("totalPrice");
          if (totalAmount) {
            const total = totalAmount.textContent;
            const codTotalElement = document.getElementById("codTotalAmount");
            if (codTotalElement) codTotalElement.textContent = total + " ج.م";
          }
        }
        break;
    }
  },

  /**
   * ========================================
   * 7. PAYMOB INTEGRATION
   * ========================================
   */

  loadPaymobScript() {
    // Load Paymob SDK
    const script = document.createElement("script");
    script.src =
      "https://accept.paymobsolutions.com/api/acceptance/iframes/standalone-iframe.js";
    script.async = true;
    document.head.appendChild(script);
  },

  initPaymobCard() {
    console.log("🔄 Initializing Paymob card payment...");
    // This will be called when card form is shown
    // Paymob iframe will be embedded when user clicks pay
  },

  /**
   * Initiate Paymob Payment Intent
   */
  async initiatePaymobPayment() {
    try {
      console.log("💳 Initiating Paymob payment intent...");

      const totalPrice =
        document.getElementById("totalPrice")?.textContent || "0";
      const amount = parseFloat(totalPrice) * 100; // Convert to cents

      // Prepare payment data
      const paymentData = {
        amount: Math.round(amount),
        currency: "EGP",
        merchant_id: this.paymobConfig.merchantId,
        payment_token: "", // Will be obtained from server
      };

      // Send to your backend to get payment token
      const response = await fetch("api/process_payment.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "initiate_payment",
          amount: paymentData.amount,
          currency: paymentData.currency,
        }),
      });

      const data = await response.json();

      if (data.success && data.payment_token) {
        // Open Paymob iframe
        if (window.iframely) {
          window.iframely.openPaymentModal({
            src: `https://accept.paymobsolutions.com/api/acceptance/iframes/${data.iframe_id}?payment_token=${data.payment_token}`,
            onLoad: () => {
              console.log("✅ Paymob iframe loaded");
            },
            onClose: () => {
              console.log("❌ Payment cancelled");
            },
          });
        }
      } else {
        throw new Error(data.message || "Failed to initiate payment");
      }
    } catch (error) {
      console.error("❌ Paymob payment error:", error);
      this.showError("حدث خطأ في معالجة الدفع");
    }
  },

  /**
   * ========================================
   * 8. DIGITAL WALLET PAYMENT
   * ========================================
   */

  selectWallet(walletType) {
    document.querySelectorAll(".wallet-option").forEach((option) => {
      option.classList.remove("active");
      option.querySelector(".wallet-check i").className =
        "fa-regular fa-circle";
    });

    const selectedOption = document.querySelector(
      `[data-wallet="${walletType}"]`,
    );
    if (selectedOption) {
      selectedOption.classList.add("active");
      selectedOption.querySelector(".wallet-check i").className =
        "fa-solid fa-circle-check";
    }
  },

  async initiateWalletPayment(walletType) {
    try {
      console.log(`💳 Initiating ${walletType} wallet payment...`);

      const totalPrice =
        document.getElementById("totalPrice")?.textContent || "0";
      const amount = parseFloat(totalPrice);

      // Prepare wallet payment data
      const paymentData = {
        walletType: walletType,
        amount: amount,
        currency: "EGP",
        redirectUrl: window.location.href,
      };

      // Send to your backend
      const response = await fetch("api/process_wallet_payment.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "initiate_wallet_payment",
          ...paymentData,
        }),
      });

      const data = await response.json();

      if (data.success && data.redirectUrl) {
        // Redirect to wallet provider
        window.location.href = data.redirectUrl;
      } else {
        throw new Error(data.message || "Failed to initiate wallet payment");
      }
    } catch (error) {
      console.error("❌ Wallet payment error:", error);
      this.showError("حدث خطأ في معالجة الدفع");
    }
  },

  /**
   * ========================================
   * 9. ORDER SUBMISSION
   * ========================================
   */

  async handleOrderSubmit() {
    // Validate customer data
    if (!this.validateCustomerData()) {
      this.showError("❌ الرجاء ملء جميع البيانات بشكل صحيح");
      return;
    }

    // Validate payment method selection
    if (!this.currentOrder.selectedMethod) {
      this.showError("❌ الرجاء اختيار طريقة الدفع");
      return;
    }

    // Process based on payment method
    switch (this.currentOrder.selectedMethod) {
      case "card":
        await this.processCardPayment();
        break;
      case "wallet":
        await this.processWalletPayment();
        break;
      case "cod":
        await this.processCODPayment();
        break;
    }
  },

  validateCustomerData() {
    const name = document.getElementById("userName")?.value;
    const phone = document.getElementById("userPhone")?.value;
    const address = document.getElementById("userAddress")?.value;
    const email = document.getElementById("userEmail")?.value;

    if (!name || !phone || !address || !email) return false;

    if (!this.validateEgyptianPhone(phone)) return false;

    return true;
  },

  async processCardPayment() {
    console.log("💳 Processing card payment...");

    // Validate card data
    const cardNumber = document.getElementById("cardNumber")?.value;
    const cardExpiry = document.getElementById("cardExpiry")?.value;
    const cardCvv = document.getElementById("cardCvv")?.value;

    if (!this.validateCardNumber(cardNumber.replace(/\s/g, ""))) {
      this.showError("❌ رقم البطاقة غير صحيح");
      return;
    }

    if (!this.validateExpiry(cardExpiry)) {
      this.showError("❌ تاريخ الانتهاء غير صحيح");
      return;
    }

    if (!this.validateCVV(cardCvv)) {
      this.showError("❌ CVV غير صحيح");
      return;
    }

    // Initiate Paymob payment
    await this.initiatePaymobPayment();
  },

  async processWalletPayment() {
    console.log("📱 Processing wallet payment...");

    const activeWallet = document.querySelector(".wallet-option.active")
      ?.dataset.wallet;
    if (!activeWallet) {
      this.showError("❌ الرجاء اختيار محفظة رقمية");
      return;
    }

    // Initiate wallet payment
    await this.initiateWalletPayment(activeWallet);
  },

  async processCODPayment() {
    console.log("💵 Processing COD payment...");

    // Collect order data
    const orderData = this.collectOrderData();

    try {
      const response = await fetch("api/save_order.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...orderData,
          paymentMethod: "cod",
          paymentStatus: "pending",
        }),
      });

      const data = await response.json();

      if (data.success) {
        this.showSuccess("✅ تم حفظ طلبك بنجاح");
        // Redirect or show confirmation
        window.location.href = `api/order_confirmation.php?order_id=${data.orderId}`;
      } else {
        this.showError(data.message || "❌ حدث خطأ في حفظ الطلب");
      }
    } catch (error) {
      console.error("❌ COD payment error:", error);
      this.showError("❌ حدث خطأ في معالجة الطلب");
    }
  },

  collectOrderData() {
    return {
      userName: document.getElementById("userName")?.value || "",
      userPhone: document.getElementById("userPhone")?.value || "",
      userAddress: document.getElementById("userAddress")?.value || "",
      userEmail: document.getElementById("userEmail")?.value || "",
      items: this.currentOrder.items || [],
      totalAmount: document.getElementById("totalPrice")?.textContent || "0",
      shippingCost: 20,
      notes: document.getElementById("orderNotes")?.value || "",
    };
  },

  /**
   * ========================================
   * 10. UI FEEDBACK
   * ========================================
   */

  showError(message) {
    const alertDiv = document.createElement("div");
    alertDiv.className = "payment-alert payment-alert-error";
    alertDiv.innerHTML = `
      <div class="payment-alert-content">
        <i class="fa-solid fa-circle-xmark"></i>
        <p>${message}</p>
      </div>
    `;

    document.body.appendChild(alertDiv);

    setTimeout(() => {
      alertDiv.classList.add("show");
    }, 10);

    setTimeout(() => {
      alertDiv.classList.remove("show");
      setTimeout(() => alertDiv.remove(), 300);
    }, 3000);
  },

  showSuccess(message) {
    const alertDiv = document.createElement("div");
    alertDiv.className = "payment-alert payment-alert-success";
    alertDiv.innerHTML = `
      <div class="payment-alert-content">
        <i class="fa-solid fa-circle-check"></i>
        <p>${message}</p>
      </div>
    `;

    document.body.appendChild(alertDiv);

    setTimeout(() => {
      alertDiv.classList.add("show");
    }, 10);

    setTimeout(() => {
      alertDiv.classList.remove("show");
      setTimeout(() => alertDiv.remove(), 300);
    }, 3000);
  },

  /**
   * ========================================
   * 11. UTILITY FUNCTIONS
   * ========================================
   */

  formatCurrency(amount) {
    return new Intl.NumberFormat("ar-EG", {
      style: "currency",
      currency: "EGP",
    }).format(amount);
  },

  getOrderId() {
    return `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  },
};

// Initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    PaymentGateway.init();
  });
} else {
  PaymentGateway.init();
}
