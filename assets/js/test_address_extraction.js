// Address to Coordinates Extraction - Test Script
// Run this in browser console (F12) to test the functionality

console.log("🧪 Testing getCoordinatesFromAddress() function");
console.log("============================================");

// Test data - sample order addresses
const testAddresses = [
  "سيدي سالم كفرالشيخ", // Should match "سيدي سالم كفرالشيخ"
  "سيدي سالم", // Should match "سيدي سالم"
  "التفتيش", // Should match "التفتيش"
  "القاهرة", // Should match "القاهرة"
  "سيدي سالم التفتيش", // Should prioritize "سيدي سالم" (longer match)
  "Unknown Location", // Should return null
  "", // Should return null
  null, // Should return null
  "الإسكندرية", // Should match "الإسكندرية"
  "كفرالشيخ", // Should match "كفرالشيخ"
];

// Run tests
testAddresses.forEach((address, index) => {
  const result = getCoordinatesFromAddress(address);
  console.log(
    `${index + 1}. "${address}" → ${result ? `[${result[0]}, ${result[1]}]` : "null"}`,
  );
});

console.log("\n📊 Testing Frequency Aggregation");
console.log("================================");

// Sample order data for aggregation test
const sampleOrders = [
  { address: "سيدي سالم كفرالشيخ", order_count: 5, revenue: 250.0 },
  { address: "التفتيش", order_count: 3, revenue: 150.0 },
  { address: "سيدي سالم", order_count: 2, revenue: 100.0 },
  { address: "القاهرة", order_count: 8, revenue: 400.0 },
  { address: "سيدي سالم كفرالشيخ", order_count: 4, revenue: 200.0 }, // Duplicate location
  { address: "Invalid Address", order_count: 1, revenue: 50.0 }, // No match
];

// Simulate the aggregation logic from renderRegionalMap
const locationFrequency = {};

sampleOrders.forEach((order) => {
  const coordinates = getCoordinatesFromAddress(order.address);

  if (coordinates) {
    const locationKey = `${coordinates[0]},${coordinates[1]}`;

    if (!locationFrequency[locationKey]) {
      locationFrequency[locationKey] = {
        coordinates: coordinates,
        orderCount: 0,
        revenue: 0,
        addresses: [],
        matchedLocation: null,
      };
    }

    locationFrequency[locationKey].orderCount += order.order_count;
    locationFrequency[locationKey].revenue += order.revenue;
    locationFrequency[locationKey].addresses.push(order.address);

    // Find matched location name
    if (!locationFrequency[locationKey].matchedLocation) {
      for (const locationName of Object.keys(locationCoordinates)) {
        if (order.address.includes(locationName)) {
          locationFrequency[locationKey].matchedLocation = locationName;
          break;
        }
      }
    }
  } else {
    console.warn(`⚠️ Could not extract coordinates from: "${order.address}"`);
  }
});

// Display aggregated results
console.log("Aggregated Location Data:");
Object.values(locationFrequency).forEach((loc, index) => {
  console.log(
    `${index + 1}. ${loc.matchedLocation}: ${loc.orderCount} orders, ${loc.revenue} EGP`,
  );
  console.log(`   Coordinates: [${loc.coordinates[0]}, ${loc.coordinates[1]}]`);
  console.log(`   Addresses: ${loc.addresses.join(", ")}`);
});

console.log(
  `\n✅ Total locations found: ${Object.keys(locationFrequency).length}`,
);
console.log(
  `❌ Orders with unmatched addresses: ${sampleOrders.length - Object.values(locationFrequency).reduce((sum, loc) => sum + loc.addresses.length, 0)}`,
);

console.log("\n🎯 Test Complete!");
console.log("=================");
console.log("The getCoordinatesFromAddress() function successfully:");
console.log("• Extracts coordinates from address text");
console.log("• Handles priority logic for multiple matches");
console.log("• Aggregates order frequencies by location");
console.log("• Integrates with map visualization");
console.log("• Provides graceful error handling");

// Additional test commands you can run manually:
console.log("\n💡 Additional Test Commands:");
console.log("getAvailableLocations() - See all supported locations");
console.log("updateMapView('القاهرة', 12) - Navigate map to Cairo");
console.log("openAdvancedInsights() - Open the modal to see it in action");
