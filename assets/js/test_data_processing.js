// Test file for Advanced Insights Data Processing Functions
// Run this in browser console to test the functions

// Sample orders data for testing
const sampleOrders = [
  {
    order_id: 1,
    customer_name: "Test Customer 1",
    address: "سيدي سالم كفرالشيخ",
    created_at: "2026-04-06T10:30:00",
    items: ["برجر كنج كلاسيك", "بيتزا مارغريتا"],
  },
  {
    order_id: 2,
    customer_name: "Test Customer 2",
    address: "التفتيش",
    created_at: "2026-04-06T14:15:00",
    items: ["برجر دبل تشيز", "سباجيتي بولونيز"],
  },
  {
    order_id: 3,
    customer_name: "Test Customer 3",
    address: "سيدي سالم كفرالشيخ",
    created_at: "2026-04-07T09:45:00",
    items: ["برجر كنج كلاسيك", "برجر دبل تشيز"],
  },
  {
    order_id: 4,
    customer_name: "Test Customer 4",
    address: "القاهرة",
    created_at: "2026-04-07T16:20:00",
    items: ["بيتزا مارغريتا", "سباجيتي بولونيز"],
  },
];

// Test the data processing functions
console.log("Testing Daily Traffic Data Processing:");
const dailyTraffic = processDailyTrafficData(sampleOrders);
console.log(dailyTraffic);

console.log("\nTesting Regional Sales Data Processing:");
const regionalSales = processRegionalSalesData(sampleOrders);
console.log(regionalSales);

console.log("\nTesting Market Basket Data Processing:");
const marketBasket = processMarketBasketData(sampleOrders);
console.log(marketBasket);

// Expected outputs:
// Daily Traffic: Should show counts for different days
// Regional Sales: Should show counts for "سيدي سالم كفرالشيخ", "التفتيش", "القاهرة"
// Market Basket: Should show pairs like "برجر كنج كلاسيك + برجر دبل تشيز"
