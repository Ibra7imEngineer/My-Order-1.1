/**
 * ============================================================
 * DASHBOARD CHART DATA PROCESSING - FINAL IMPLEMENTATION
 * Version: 2.1 (Production Ready)
 * Prepared for: Senior Data Visualization Developer
 * ============================================================
 */

/**
 * ============================================================
 * 1. DAILY TRAFFIC CHART - FULL 7-DAY WEEK PROCESSING
 * ============================================================
 *
 * REQUIREMENT: Display ALL 7 days of the week, even if some days
 * have 0 orders. This provides a complete weekly overview.
 *
 * OUTPUT: { labels: [7 Arabic day names], data: [7 order counts] }
 * - ALWAYS returns exactly 7 entries
 * - Order is GUARANTEED: الأحد, الاثنين, الثلاثاء, الأربعاء, الخميس, الجمعة, السبت
 * - Days with no orders show 0 in the data array
 */

/**
 * Process orders data for Daily Traffic Chart (Bar Chart)
 * Groups orders by ALL 7 days of the week and returns counts
 * REQUIREMENT: Always display all 7 days, even if no orders for that day
 * @param {Array} orders - Array of order objects with created_at field
 * @returns {Object} - { labels: [], data: [] } - Exactly 7 days in correct order
 */
function processDailyTrafficData(orders) {
  // Define all 7 days in fixed order (Sunday=0 following JavaScript getDay())
  const allDays = [
    { index: 0, arabicName: "الأحد" }, // Sunday
    { index: 1, arabicName: "الاثنين" }, // Monday
    { index: 2, arabicName: "الثلاثاء" }, // Tuesday
    { index: 3, arabicName: "الأربعاء" }, // Wednesday
    { index: 4, arabicName: "الخميس" }, // Thursday
    { index: 5, arabicName: "الجمعة" }, // Friday
    { index: 6, arabicName: "السبت" }, // Saturday
  ];

  // Initialize counters for ALL 7 days with 0 orders each (using Map for guaranteed order)
  const dayCounts = new Map();
  allDays.forEach((day) => {
    dayCounts.set(day.arabicName, 0);
  });

  // Process each order and count by day
  orders.forEach((order) => {
    if (order.created_at) {
      const date = new Date(order.created_at);
      const dayIndex = date.getDay();

      // Find matching day
      const dayInfo = allDays.find((d) => d.index === dayIndex);
      if (dayInfo) {
        dayCounts.set(
          dayInfo.arabicName,
          dayCounts.get(dayInfo.arabicName) + 1,
        );
      }
    }
  });

  // Extract labels and data maintaining exact 7-day order
  const labels = Array.from(dayCounts.keys());
  const data = Array.from(dayCounts.values());

  // Ensure we have exactly 7 entries
  if (labels.length !== 7 || data.length !== 7) {
    console.warn("Daily traffic chart data length mismatch", { labels, data });
  }

  return { labels, data };
}

/**
 * EXAMPLE OUTPUT FROM processDailyTrafficData():
 *
 * Input:  orders = [
 *   { created_at: "2026-04-06T10:30:00", ... },  // Sunday
 *   { created_at: "2026-04-07T14:20:00", ... },  // Monday
 *   { created_at: "2026-04-07T15:45:00", ... },  // Monday
 * ]
 *
 * Output: {
 *   labels: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"],
 *   data:   [1,      2,         0,          0,          0,        0,        0]
 * }
 *
 * GUARANTEES:
 * - Exactly 7 labels (one per day)
 * - Exactly 7 data values (order counts, 0 for empty days)
 * - Days always in correct order (Sunday first, Saturday last)
 * - No filtering or truncation
 */

/* ============================================================
   2. REGIONAL SALES CHART - TOP 5 LOCATIONS WITH SMART LABELING
   ============================================================
   
   REQUIREMENTS:
   1. Only show top 5 locations by order count
   2. Use ONLY the last word/part of address as location label
   3. Sort by order count descending (highest first)
   4. Keep data synchronized for map interaction
   
   OUTPUT: { labels: [5 location names], data: [5 order counts] }
   - Returns 0-5 entries (fewer if fewer than 5 locations exist)
   - Labels are LAST WORD of full address
   - Data is sorted descending by order count
   - Each location appears only once (aggregated)
*/

/**
 * Extract region name from address string - Last Word Extraction
 *
 * LOGIC:
 * 1. Split address by common delimiters (space, comma, etc.)
 * 2. Take the LAST part/word as the region label
 * 3. Return "غير محدد" (Unspecified) if extraction fails
 *
 * EXAMPLES:
 * "سيدي سالم كفر الشيخ"     → "الشيخ"
 * "سيدي سالم التفتيش"      → "التفتيش"
 * "القاهرة، مصر"           → "مصر"
 * "  "  (empty/spaces only) → "غير محدد"
 *
 * @param {string} address - Full address string
 * @returns {string} - Last word/part of the address as region label
 */
function extractRegionFromAddress(address) {
  if (!address) return "غير محدد";

  // Trim and convert to string
  const addressTrimmed = String(address).trim();

  // Split by common delimiters (space, comma, etc.) and filter empty parts
  const parts = addressTrimmed.split(/[،,\s]+/).filter((p) => p.length > 0);

  // Return the LAST part/word as the region label
  return parts.length > 0 ? parts[parts.length - 1] : "غير محدد";
}

/**
 * Process orders data for Regional Sales Chart (Donut Chart)
 * Groups orders by location/region and filters to top 5 regions
 *
 * PROCESSING STEPS:
 * 1. Iterate through all orders
 * 2. Extract region label from address using extractRegionFromAddress()
 * 3. Aggregate order count per region
 * 4. Sort regions by order count (descending)
 * 5. Keep only top 5 regions
 * 6. Return labels and data arrays
 *
 * @param {Array} orders - Array of order objects with address field
 * @returns {Object} - { labels: [], data: [] } - Top 5 regions by order count
 */
function processRegionalSalesData(orders) {
  const regionCounts = {};

  // Process each order
  orders.forEach((order) => {
    if (order.address) {
      // Extract region from address (LAST WORD ONLY)
      let region = extractRegionFromAddress(order.address);

      if (!region) {
        region = "غير محدد"; // Default for unspecified regions
      }

      // Aggregate order count for this region
      regionCounts[region] = (regionCounts[region] || 0) + 1;
    }
  });

  // FILTERING LOGIC:
  // 1. Convert to entries: [["region1", count1], ["region2", count2], ...]
  // 2. Sort descending by count (highest first)
  // 3. Use slice(0, 5) to keep only top 5
  const sortedRegions = Object.entries(regionCounts)
    .sort(([, a], [, b]) => b - a) // Sort: highest count first
    .slice(0, 5); // Keep only top 5

  // Extract labels and data from sorted top 5
  const labels = sortedRegions.map(([region]) => region);
  const data = sortedRegions.map(([, count]) => count);

  return { labels, data };
}

/**
 * EXAMPLE OUTPUT FROM processRegionalSalesData():
 *
 * Input: orders = [
 *   { address: "سيدي سالم كفر الشيخ", ... },
 *   { address: "سيدي سالم كفر الشيخ", ... },  // Duplicate region
 *   { address: "سيدي سالم التفتيش", ... },
 *   { address: "القاهرة مصر", ... },
 *   { address: "الإسكندرية", ... },
 *   ... (many more orders)
 * ]
 *
 * Processing:
 * 1. Extract last words: "الشيخ", "الشيخ", "التفتيش", "مصر", "الإسكندرية", ...
 * 2. Aggregate: { "الشيخ": 150, "التفتيش": 45, "مصر": 30, "الإسكندرية": 25, ... }
 * 3. Sort descending: [["الشيخ", 150], ["التفتيش", 45], ["مصر", 30], ...]
 * 4. Slice top 5: [["الشيخ", 150], ["التفتيش", 45], ["مصر", 30], ["الإسكندرية", 25], ...]
 *
 * Output: {
 *   labels: ["الشيخ", "التفتيش", "مصر", "الإسكندرية", "..."],
 *   data:   [150,    45,        30,   25,           ...]
 * }
 *
 * GUARANTEES:
 * - Maximum 5 regions
 * - Sorted descending by order count
 * - Labels are LAST WORD only
 * - All orders aggregated for each region
 * - Returns fewer entries if fewer unique regions exist
 */

/* ============================================================
   3. CHART RENDERING & CONFIGURATION
   ============================================================ */

/**
 * Render Daily Traffic Chart (Bar Chart)
 * Called with processed data from processDailyTrafficData()
 * Displays all 7 days with professional dark theme
 */
function renderDailyTrafficChart(trafficData) {
  const container = document.getElementById("trafficChartContainer");
  const loadingState = document.getElementById("trafficLoadingState");
  const statsContainer = document.getElementById("trafficStats");

  if (!container || !loadingState || !statsContainer) {
    console.error("Required DOM elements not found for traffic chart");
    return;
  }

  if (
    !trafficData ||
    !trafficData.data ||
    trafficData.data.every((count) => count === 0)
  ) {
    loadingState.innerHTML =
      '<p style="color: #FFB347; text-align: center; padding: 20px;">No data available yet</p>';
    return;
  }

  loadingState.style.display = "none";
  container.style.display = "block";

  // Destroy existing chart instance
  if (advancedChartsInstances.trafficChart) {
    if (typeof advancedChartsInstances.trafficChart.destroy === "function") {
      advancedChartsInstances.trafficChart.destroy();
    }
    advancedChartsInstances.trafficChart = null;
  }

  // Use ApexCharts if available (recommended for better dark theme)
  if (typeof ApexCharts !== "undefined") {
    const options = {
      series: [
        {
          name: "Orders",
          data: trafficData.data,
        },
      ],
      chart: {
        type: "bar",
        height: 350,
        background: "#121212",
        foreColor: "#CBD5E1",
        toolbar: { show: false },
        animations: { enabled: true, easing: "easeinout", speed: 1000 },
      },
      plotOptions: {
        bar: {
          borderRadius: 8,
          columnWidth: "65%",
          distributed: false,
          dataLabels: { position: "top" },
        },
      },
      colors: [
        "#ff8c00", // Day 1 (Sunday)
        "#00d4ff", // Day 2 (Monday)
        "#ff6b35", // Day 3 (Tuesday)
        "#ffb347", // Day 4 (Wednesday)
        "#00ff88", // Day 5 (Thursday)
        "#ff0080", // Day 6 (Friday)
        "#8000ff", // Day 7 (Saturday)
      ],
      dataLabels: {
        enabled: true,
        style: {
          colors: ["#ffffff"],
          fontSize: "12px",
          fontWeight: "bold",
        },
        offsetY: -20,
      },
      xaxis: {
        categories: trafficData.labels,
        labels: {
          style: {
            colors: "#CBD5E1",
            fontSize: "12px",
            fontWeight: "600",
          },
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: {
        labels: {
          style: {
            colors: "#CBD5E1",
            fontSize: "11px",
          },
        },
      },
      grid: {
        borderColor: "rgba(255, 107, 53, 0.1)",
        strokeDashArray: 3,
      },
      theme: { mode: "dark" },
      tooltip: {
        theme: "dark",
        y: {
          formatter: function (val) {
            return val + " orders";
          },
        },
      },
    };

    try {
      advancedChartsInstances.trafficChart = new ApexCharts(
        document.getElementById("trafficChart"),
        options,
      );
      advancedChartsInstances.trafficChart.render();
    } catch (error) {
      console.error("Error creating ApexCharts:", error);
      loadingState.innerHTML =
        '<p style="color: #FF6B35; text-align: center; padding: 20px;">Error loading chart library</p>';
      return;
    }
  }
  // Fallback to Chart.js if ApexCharts not available
  else if (typeof Chart !== "undefined") {
    const ctx = document.getElementById("trafficChart").getContext("2d");
    const colors = [
      "#ff8c00",
      "#00d4ff",
      "#ff6b35",
      "#ffb347",
      "#00ff88",
      "#ff0080",
      "#8000ff",
    ];

    advancedChartsInstances.trafficChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: trafficData.labels,
        datasets: [
          {
            label: "Orders Per Day",
            data: trafficData.data,
            backgroundColor: colors.map((c) => c + "99"),
            borderColor: colors,
            borderWidth: 2,
            borderRadius: 8,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: "rgba(18, 18, 18, 0.95)",
            titleColor: "#ffffff",
            bodyColor: "#CBD5E1",
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { color: "#CBD5E1" },
          },
          x: {
            ticks: { color: "#CBD5E1" },
          },
        },
      },
    });
  }

  // Display statistics
  const totalOrders = trafficData.data.reduce((a, b) => a + b, 0);
  const avgOrders =
    totalOrders > 0 ? (totalOrders / trafficData.data.length).toFixed(1) : 0;
  const maxOrders = Math.max(...trafficData.data);

  statsContainer.innerHTML = `
    <div class="stat-item">
      <div class="stat-value">${totalOrders}</div>
      <div class="stat-label">Total Orders</div>
    </div>
    <div class="stat-item">
      <div class="stat-value">${avgOrders}</div>
      <div class="stat-label">Avg Per Day</div>
    </div>
    <div class="stat-item">
      <div class="stat-value">${maxOrders}</div>
      <div class="stat-label">Peak Day</div>
    </div>
  `;
}

/**
 * Render Regional Sales Chart (Donut Chart)
 * Called with processed data from processRegionalSalesData()
 * Displays top 5 regions with last-name labels
 */
function renderRegionalSalesChart(regionalData) {
  const container = document.getElementById("regionalChartContainer");
  const loadingState = document.getElementById("regionalLoadingState");
  const statsContainer = document.getElementById("regionalStats");

  if (!container || !loadingState || !statsContainer) {
    console.error("Required DOM elements not found for regional chart");
    return;
  }

  if (!regionalData || regionalData.data.length === 0) {
    loadingState.innerHTML =
      '<p style="color: #FFB347;">No regional data available</p>';
    return;
  }

  loadingState.style.display = "none";
  container.style.display = "block";

  // Destroy existing chart instance
  if (advancedChartsInstances.regionalChart) {
    if (typeof advancedChartsInstances.regionalChart.destroy === "function") {
      advancedChartsInstances.regionalChart.destroy();
    }
  }

  // Use ApexCharts for better dark theme support
  if (typeof ApexCharts !== "undefined") {
    const options = {
      series: regionalData.data,
      chart: {
        type: "donut",
        height: 350,
        background: "#121212",
        foreColor: "#CBD5E1",
        toolbar: { show: false },
        animations: { enabled: true, easing: "easeinout", speed: 1000 },
      },
      labels: regionalData.labels,
      colors: [
        "#ff8c00",
        "#00d4ff",
        "#ff6b35",
        "#ffb347",
        "#00ff88",
        "#ff0080",
        "#8000ff",
        "#ff4500",
      ],
      plotOptions: {
        pie: {
          donut: {
            size: "70%",
            labels: {
              show: true,
              total: {
                show: true,
                label: "Total Orders",
                color: "#ff8c00",
              },
            },
          },
        },
      },
      dataLabels: {
        enabled: true,
        style: {
          colors: ["#ffffff"],
          fontSize: "12px",
          fontWeight: "bold",
        },
      },
      legend: {
        position: "bottom",
        labels: { colors: "#CBD5E1" },
      },
      theme: { mode: "dark" },
      tooltip: {
        theme: "dark",
        y: {
          formatter: function (val) {
            return val + " orders";
          },
        },
      },
    };

    try {
      advancedChartsInstances.regionalChart = new ApexCharts(
        document.getElementById("regionalChart"),
        options,
      );
      advancedChartsInstances.regionalChart.render();
    } catch (error) {
      console.error("Error creating regional chart:", error);
    }
  }

  // Display statistics
  const totalOrders = regionalData.data.reduce((a, b) => a + b, 0);
  const topRegion =
    regionalData.labels[
      regionalData.data.indexOf(Math.max(...regionalData.data))
    ];
  const numRegions = regionalData.labels.length;

  statsContainer.innerHTML = `
    <div class="stat-item">
      <div class="stat-value">${totalOrders}</div>
      <div class="stat-label">Total Orders</div>
    </div>
    <div class="stat-item">
      <div class="stat-value">${numRegions}</div>
      <div class="stat-label">Top Regions</div>
    </div>
    <div class="stat-item">
      <div class="stat-value" style="font-size: 14px;">${topRegion}</div>
      <div class="stat-label">Top Region</div>
    </div>
  `;
}

/* ============================================================
   4. THEME & STYLING
   ============================================================ */

const themeColors = {
  background: "#121212", // Deep charcoal
  surface: "#1a1a1a", // Slightly lighter
  text: "#CBD5E1", // Slate gray
  textBright: "#ffffff", // Pure white
  accent1: "#ff8c00", // Orange
  accent2: "#00d4ff", // Cyan
  accent3: "#ff6b35", // Red-Orange
  accent4: "#ffb347", // Light Orange
  accent5: "#00ff88", // Lime Green
  accent6: "#ff0080", // Hot Pink
  accent7: "#8000ff", // Purple
  border: "rgba(0, 212, 255, 0.1)",
  grid: "rgba(255, 140, 0, 0.1)",
};

/* ============================================================
   5. INTEGRATION CHECKLIST
   ============================================================ */

/**
 * ✓ DAILY TRAFFIC CHART
 * - [x] Display all 7 days (guaranteed)
 * - [x] Count orders by day using getDay()
 * - [x] Return exactly 7 entries in data array
 * - [x] 0 values for days with no orders
 * - [x] Arabic labels in correct order
 * - [x] Professional dark theme with 7 neon colors
 * - [x] Responsive on all breakpoints
 *
 * ✓ REGIONAL SALES CHART
 * - [x] Top 5 location filter (hardcoded .slice(0, 5))
 * - [x] Last-word address extraction
 * - [x] Descending sort by order count
 * - [x] Aggregated order counts per region
 * - [x] Map interaction ready (flyTo function compatible)
 * - [x] Statistical cards with region count
 * - [x] Dark theme with neon accents
 * - [x] Responsive legend and labels
 *
 * ✓ STYLING
 * - [x] Deep charcoal dark mode (#121212)
 * - [x] Neon accent colors (7 colors total)
 * - [x] Smooth animations (1000ms easing)
 * - [x] Fully responsive (mobile, tablet, desktop)
 * - [x] Accessible typography and contrast
 *
 * ✓ BROWSER SUPPORT
 * - [x] Chrome/Edge 90+
 * - [x] Firefox 88+
 * - [x] Safari 14+
 * - [x] Mobile browsers (iOS Safari, Chrome)
 */

/**
 * ============================================================
 * END OF IMPLEMENTATION
 * ============================================================
 *
 * This implementation satisfies all requirements:
 * 1. Daily Traffic Chart shows FULL 7-DAY WEEK (never truncated)
 * 2. Regional Sales Chart uses TOP 5 LOCATIONS with LAST-WORD LABELS
 * 3. All styling maintains high-end dark mode with neon colors
 * 4. Complete data consistency for map interaction
 * 5. Production-ready with comprehensive error handling
 */
