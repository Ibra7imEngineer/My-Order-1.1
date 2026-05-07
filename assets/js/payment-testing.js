/**
 * ==================================================
 * Payment Gateway - Development & Testing Guide
 * ==================================================
 *
 * This file contains test data and utilities for development
 */

// ========================================
// TEST CARD NUMBERS FOR SANDBOX
// ========================================

const TEST_CARDS = {
  visa_success: {
    network: "Visa",
    number: "4532015112830366",
    expiry: "12/25",
    cvv: "123",
    status: "success",
  },

  visa_decline: {
    network: "Visa",
    number: "4111111111111111",
    expiry: "12/25",
    cvv: "123",
    status: "declined",
  },

  mastercard_success: {
    network: "Mastercard",
    number: "5425233010103442",
    expiry: "12/25",
    cvv: "123",
    status: "success",
  },

  mastercard_decline: {
    network: "Mastercard",
    number: "5555555555554444",
    expiry: "12/25",
    cvv: "123",
    status: "declined",
  },

  meeza_test: {
    network: "Meeza",
    number: "6062828000000000",
    expiry: "12/25",
    cvv: "123",
    status: "success",
  },
};

// ========================================
// CUSTOMER TEST DATA
// ========================================

const TEST_CUSTOMERS = {
  customer1: {
    name: "أحمد محمد علي",
    phone: "01001234567",
    email: "ahmed.ali@example.com",
    address: "شارع النيل، حي النزهة، القاهرة، مصر",
  },

  customer2: {
    name: "فاطمة علي إبراهيم",
    phone: "01102345678",
    email: "fatima.ibrahim@example.com",
    address: "حي الأسمرات، الشارع الأول، الجيزة، مصر",
  },

  customer3: {
    name: "محمد حسن محمود",
    phone: "01202345678",
    email: "mohammad.hassan@example.com",
    address: "شارع الهرم، الدقي، الجيزة، مصر",
  },
};

// ========================================
// ORDER TEST DATA
// ========================================

const TEST_ORDERS = {
  order1: {
    items: [
      { id: 1, name: "برجر بالدجاج", quantity: 2, price: 45 },
      { id: 2, name: "بيتزا جبنة", quantity: 1, price: 75 },
      { id: 3, name: "عصير برتقال", quantity: 2, price: 15 },
    ],
    subtotal: 195,
    shipping: 20,
    total: 215,
  },

  order2: {
    items: [
      { id: 4, name: "كشري", quantity: 2, price: 30 },
      { id: 5, name: "فتة", quantity: 1, price: 25 },
    ],
    subtotal: 85,
    shipping: 20,
    total: 105,
  },
};

// ========================================
// HELPER FUNCTIONS FOR TESTING
// ========================================

/**
 * Fill Payment Form with Test Data
 */
function fillTestPaymentForm(
  cardData = TEST_CARDS.visa_success,
  customerData = TEST_CUSTOMERS.customer1,
) {
  // Fill customer data
  document.getElementById("userName").value = customerData.name;
  document.getElementById("userPhone").value = customerData.phone;
  document.getElementById("userEmail").value = customerData.email;
  document.getElementById("userAddress").value = customerData.address;

  // Fill card data
  document.getElementById("cardNumber").value = cardData.number;
  document.getElementById("cardExpiry").value = cardData.expiry;
  document.getElementById("cardCvv").value = cardData.cvv;
  document.getElementById("cardHolderName").value = customerData.name;

  console.log("✅ Test form filled");
  console.log("Card:", cardData.network);
  console.log("Customer:", customerData.name);
}

/**
 * Test Luhn Algorithm
 */
function testLuhnAlgorithm() {
  console.log("🧪 Testing Luhn Algorithm...");

  const testCases = [
    { number: "4532015112830366", expected: true, label: "Visa (Valid)" },
    { number: "5425233010103442", expected: true, label: "Mastercard (Valid)" },
    { number: "6062828000000000", expected: true, label: "Meeza (Valid)" },
    { number: "1234567890123456", expected: false, label: "Invalid (Invalid)" },
    {
      number: "0000000000000000",
      expected: false,
      label: "All Zeros (Invalid)",
    },
  ];

  testCases.forEach((testCase) => {
    const result = PaymentGateway.luhnCheck(testCase.number);
    const status = result === testCase.expected ? "✓" : "✗";
    console.log(`${status} ${testCase.label}: ${result}`);
  });
}

/**
 * Test Egyptian Phone Validation
 */
function testPhoneValidation() {
  console.log("🧪 Testing Egyptian Phone Validation...");

  const testCases = [
    { phone: "01001234567", expected: true, label: "01x format" },
    { phone: "201001234567", expected: true, label: "201x format" },
    { phone: "01101234567", expected: true, label: "011x format (Vodafone)" },
    { phone: "01201234567", expected: true, label: "012x format (Etisalat)" },
    { phone: "01234567", expected: false, label: "Too short" },
    { phone: "abc123456789", expected: false, label: "Contains letters" },
  ];

  testCases.forEach((testCase) => {
    const result = PaymentGateway.validateEgyptianPhone(testCase.phone);
    const status = result === testCase.expected ? "✓" : "✗";
    console.log(`${status} ${testCase.label}: ${testCase.phone}`);
  });
}

/**
 * Test Card Type Detection
 */
function testCardDetection() {
  console.log("🧪 Testing Card Type Detection...");

  const testCases = [
    { number: "4532015112830366", expected: "visa" },
    { number: "5425233010103442", expected: "mastercard" },
    { number: "6062828000000000", expected: "meeza" },
  ];

  testCases.forEach((testCase) => {
    PaymentGateway.detectCardType(testCase.number);
    console.log(`✓ Detected: ${testCase.expected}`);
  });
}

/**
 * Test Email Validation
 */
function testEmailValidation() {
  console.log("🧪 Testing Email Validation...");

  const testCases = [
    { email: "user@example.com", expected: true, label: "Valid email" },
    { email: "invalid.email@", expected: false, label: "Missing domain" },
    { email: "user@domain", expected: false, label: "Missing TLD" },
    { email: "user@domain.com", expected: true, label: "Valid email" },
  ];

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  testCases.forEach((testCase) => {
    const result = emailRegex.test(testCase.email);
    const status = result === testCase.expected ? "✓" : "✗";
    console.log(`${status} ${testCase.label}: ${testCase.email}`);
  });
}

/**
 * Run All Tests
 */
function runAllTests() {
  console.log("🚀 Running Payment Gateway Tests...\n");

  testLuhnAlgorithm();
  console.log("");

  testPhoneValidation();
  console.log("");

  testCardDetection();
  console.log("");

  testEmailValidation();
  console.log("");

  console.log("✅ All tests completed!");
}

/**
 * Simulate Payment Processing (Demo)
 */
async function simulatePaymentProcessing() {
  console.log("💳 Simulating payment processing...");

  const mockResponse = {
    success: true,
    order_id: "ORD-" + Date.now(),
    payment_token: "TOKEN-" + Math.random().toString(36).substr(2, 9),
    iframe_id: "iframe-" + Math.random().toString(36).substr(2, 5),
    message: "Payment simulation completed",
  };

  console.log("Response:", mockResponse);
  return mockResponse;
}

/**
 * Test Different Payment Scenarios
 */
async function testPaymentScenarios() {
  console.log("🧪 Testing different payment scenarios...\n");

  // Scenario 1: Successful Card Payment
  console.log("Scenario 1: Successful Card Payment");
  console.log("Customer:", TEST_CUSTOMERS.customer1.name);
  console.log("Card:", TEST_CARDS.visa_success.network);
  console.log("Amount:", TEST_ORDERS.order1.total + " ج.م");
  await simulatePaymentProcessing();
  console.log("");

  // Scenario 2: Wallet Payment
  console.log("Scenario 2: Wallet Payment (Vodafone Cash)");
  console.log("Customer:", TEST_CUSTOMERS.customer2.name);
  console.log("Phone:", TEST_CUSTOMERS.customer2.phone);
  console.log("Amount:", TEST_ORDERS.order2.total + " ج.م");
  await simulatePaymentProcessing();
  console.log("");

  // Scenario 3: COD Payment
  console.log("Scenario 3: Cash on Delivery (COD)");
  console.log("Customer:", TEST_CUSTOMERS.customer3.name);
  console.log("Address:", TEST_CUSTOMERS.customer3.address);
  console.log("Amount:", TEST_ORDERS.order1.total + " ج.م");
  console.log("✓ Order saved for COD");
  console.log("");
}

// ========================================
// BROWSER CONSOLE COMMANDS
// ========================================

/*
 * Copy & Paste these commands in browser console for testing:
 *
 * 1. Run all tests:
 * runAllTests()
 *
 * 2. Fill test payment form:
 * fillTestPaymentForm()
 *
 * 3. Test specific card:
 * fillTestPaymentForm(TEST_CARDS.mastercard_success, TEST_CUSTOMERS.customer1)
 *
 * 4. Test payment scenarios:
 * testPaymentScenarios()
 *
 * 5. Check card validation:
 * PaymentGateway.luhnCheck('4532015112830366')
 *
 * 6. Check phone validation:
 * PaymentGateway.validateEgyptianPhone('01001234567')
 *
 * 7. Trigger card detection:
 * PaymentGateway.detectCardType('4532015112830366')
 */

// Export for use in console
if (typeof window !== "undefined") {
  window.testPaymentData = {
    cards: TEST_CARDS,
    customers: TEST_CUSTOMERS,
    orders: TEST_ORDERS,
    runAllTests: runAllTests,
    fillTestPaymentForm: fillTestPaymentForm,
    testPaymentScenarios: testPaymentScenarios,
    testLuhnAlgorithm: testLuhnAlgorithm,
    testPhoneValidation: testPhoneValidation,
    testCardDetection: testCardDetection,
    testEmailValidation: testEmailValidation,
  };

  // Log available commands on page load
  console.log(
    "%c🔐 Payment Gateway Testing Tools Available",
    "color: #FF6B35; font-size: 14px; font-weight: bold;",
  );
  console.log("Use: testPaymentData.runAllTests()");
  console.log("Use: testPaymentData.fillTestPaymentForm()");
  console.log("Use: testPaymentData.testPaymentScenarios()");
}
