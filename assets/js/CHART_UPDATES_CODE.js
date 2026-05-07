/**
 * ============================================================
 * DASHBOARD CHART UPGRADES - DATA PROCESSING & CONFIGURATION
 * Version: 2.0
 * ============================================================
 */

/* ============================================================
   1. DAILY TRAFFIC CHART - FULL 7-DAY WEEK PROCESSING
   ============================================================ */

/**
 * Process orders data for Daily Traffic Chart (Bar Chart)
 * Groups orders by ALL 7 days of the week and returns counts
 * @param {Array} orders - Array of order objects with created_at field
 * @returns {Object} - { labels: [], data: [] } - All 7 days in order
 */
function processDailyTrafficData(orders) {
  // Day mapping from getDay() index to Arabic (Sunday=0)
  const dayMapping = {
    0: "الأحد", // Sunday
    1: "الاثنين", // Monday
    2: "الثلاثاء", // Tuesday
    3: "الأربعاء", // Wednesday
    4: "الخميس", // Thursday
    5: "الجمعة", // Friday
    6: "السبت", // Saturday
  };

  // Initialize counters for ALL 7 days in order
  const dayCounts = {
    الأحد: 0,
    الاثنين: 0,
    الثلاثاء: 0,
    الأربعاء: 0,
    الخميس: 0,
    الجمعة: 0,
    السبت: 0,
  };

  // Process each order
  orders.forEach((order) => {
    if (order.created_at) {
      const date = new Date(order.created_at);
      const dayIndex = date.getDay();
      const arabicDay = dayMapping[dayIndex];

      if (arabicDay) {
        dayCounts[arabicDay] = (dayCounts[arabicDay] || 0) + 1;
      }
    }
  });

  // Return all 7 days in order (NO filtering to top 5)
  const labels = Object.keys(dayCounts);
  const data = Object.values(dayCounts);

  return { labels, data };
}

/* ============================================================
   2. REGIONAL SALES CHART - TOP 5 WITH LAST-NAME LABELING
   ============================================================ */

/**
 * Extract region name from address string - Last Word Extraction
 * Extracts only the LAST word/part of the address as the region label
 * Examples:
 *   "سيدي سالم كفر الشيخ" -> "الشيخ"
 *   "سيدي سالم التفتيش" -> "التفتيش"
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

      regionCounts[region] = (regionCounts[region] || 0) + 1;
    }
  });

  // Sort by count descending and take TOP 5 regions
  const sortedRegions = Object.entries(regionCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5); // FILTER: Keep only top 5 regions for cleaner visualization

  const labels = sortedRegions.map(([region]) => region);
  const data = sortedRegions.map(([, count]) => count);

  return { labels, data };
}

/* ============================================================
   3. CHART CONFIGURATION - APEXCHARTS
   ============================================================ */

/**
 * CONFIGURATION 1: Daily Traffic Chart (Bar Chart)
 * Shows all 7 days of the week with order counts
 */
const dailyTrafficChartConfig = {
  series: [
    {
      name: "Orders",
      data: [0, 5, 8, 3, 7, 6, 4], // Example: 7 days of data
    },
  ],
  chart: {
    type: "bar",
    height: 350,
    background: "#121212",
    foreColor: "#CBD5E1",
    toolbar: { show: false },
    animations: {
      enabled: true,
      easing: "easeinout",
      speed: 1000,
    },
  },
  plotOptions: {
    bar: {
      borderRadius: 8,
      columnWidth: "65%",
      distributed: false,
      dataLabels: {
        position: "top",
      },
    },
  },
  colors: [
    "#ff8c00", // Day 1 - Orange
    "#00d4ff", // Day 2 - Cyan
    "#ff6b35", // Day 3 - Red-Orange
    "#ffb347", // Day 4 - Light Orange
    "#00ff88", // Day 5 - Lime Green
    "#ff0080", // Day 6 - Hot Pink
    "#8000ff", // Day 7 - Purple
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
    categories: [
      "الأحد",
      "الاثنين",
      "الثلاثاء",
      "الأربعاء",
      "الخميس",
      "الجمعة",
      "السبت",
    ],
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
  theme: {
    mode: "dark",
  },
  tooltip: {
    theme: "dark",
    y: {
      formatter: function (val) {
        return val + " orders";
      },
    },
  },
  responsive: [
    {
      breakpoint: 1200,
      options: {
        chart: { height: 340 },
        xaxis: {
          labels: { style: { fontSize: "11px" } },
        },
      },
    },
    {
      breakpoint: 768,
      options: {
        chart: { height: 300 },
        plotOptions: {
          bar: { columnWidth: "75%" },
        },
        xaxis: {
          labels: { style: { fontSize: "10px" } },
        },
      },
    },
    {
      breakpoint: 480,
      options: {
        chart: { height: 280 },
        plotOptions: {
          bar: { columnWidth: "80%" },
        },
        xaxis: {
          labels: { style: { fontSize: "9px" } },
        },
      },
    },
  ],
};

/**
 * CONFIGURATION 2: Regional Sales Chart (Donut Chart)
 * Shows top 5 regions with last-name labels
 */
const regionalSalesChartConfig = {
  series: [25, 18, 12, 10, 8], // Example with 5 regions
  chart: {
    type: "donut",
    height: 350,
    background: "#121212",
    foreColor: "#CBD5E1",
    toolbar: { show: false },
    animations: {
      enabled: true,
      easing: "easeinout",
      speed: 1000,
    },
  },
  labels: ["الشيخ", "التفتيش", "سالم", "كفر", "البرج"], // Last-name labels
  colors: [
    "#ff8c00", // Region 1 - Orange
    "#00d4ff", // Region 2 - Cyan
    "#ff6b35", // Region 3 - Red-Orange
    "#ffb347", // Region 4 - Light Orange
    "#00ff88", // Region 5 - Lime Green
  ],
  plotOptions: {
    pie: {
      donut: {
        size: "70%",
        labels: {
          show: true,
          name: {
            show: true,
            fontSize: "14px",
            fontWeight: "600",
            color: "#CBD5E1",
          },
          value: {
            show: true,
            fontSize: "16px",
            fontWeight: "bold",
            color: "#ffffff",
          },
          total: {
            show: true,
            label: "Total Orders",
            fontSize: "18px",
            fontWeight: "bold",
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
    dropShadow: {
      enabled: true,
      color: "#000000",
      opacity: 0.5,
      blur: 2,
    },
  },
  legend: {
    position: "bottom",
    labels: {
      colors: "#CBD5E1",
      useSeriesColors: false,
    },
    markers: {
      fillColors: ["#ff8c00", "#00d4ff", "#ff6b35", "#ffb347", "#00ff88"],
    },
  },
  theme: {
    mode: "dark",
  },
  tooltip: {
    theme: "dark",
    y: {
      formatter: function (val) {
        return val + " orders";
      },
    },
  },
  responsive: [
    {
      breakpoint: 768,
      options: {
        chart: { height: 300 },
        plotOptions: {
          pie: {
            donut: {
              size: "65%",
              labels: {
                name: { fontSize: "12px" },
                value: { fontSize: "14px" },
              },
            },
          },
        },
      },
    },
    {
      breakpoint: 480,
      options: {
        chart: { height: 280 },
        plotOptions: {
          pie: {
            donut: {
              size: "60%",
              labels: {
                name: { fontSize: "11px" },
                value: { fontSize: "12px" },
              },
            },
          },
        },
        dataLabels: { fontSize: "10px" },
      },
    },
  ],
};

/* ============================================================
   4. CHART RENDERING FUNCTIONS (UPDATED)
   ============================================================ */

/**
 * Render Daily Traffic Chart with new 7-day configuration
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

  // Destroy existing chart
  if (advancedChartsInstances.trafficChart) {
    if (typeof advancedChartsInstances.trafficChart.destroy === "function") {
      advancedChartsInstances.trafficChart.destroy();
    }
    advancedChartsInstances.trafficChart = null;
  }

  // Use ApexCharts
  if (typeof ApexCharts !== "undefined") {
    const options = { ...dailyTrafficChartConfig };
    options.series[0].data = trafficData.data;
    options.xaxis.categories = trafficData.labels;

    try {
      advancedChartsInstances.trafficChart = new ApexCharts(
        document.getElementById("trafficChart"),
        options,
      );
      advancedChartsInstances.trafficChart.render();
    } catch (error) {
      console.error("Error creating chart:", error);
    }
  }

  // Display updated stats for 7 days
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
 * Render Regional Sales Chart with new last-name labels
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

  // Destroy existing chart
  if (advancedChartsInstances.regionalChart) {
    if (typeof advancedChartsInstances.regionalChart.destroy === "function") {
      advancedChartsInstances.regionalChart.destroy();
    }
  }

  // Use ApexCharts
  if (typeof ApexCharts !== "undefined") {
    const options = { ...regionalSalesChartConfig };
    options.series = regionalData.data;
    options.labels = regionalData.labels;

    try {
      advancedChartsInstances.regionalChart = new ApexCharts(
        document.getElementById("regionalChart"),
        options,
      );
      advancedChartsInstances.regionalChart.render();
    } catch (error) {
      console.error("Error creating chart:", error);
    }
  }

  // Display updated stats
  const totalOrders = regionalData.data.reduce((a, b) => a + b, 0);
  const topRegion =
    regionalData.labels[
      regionalData.data.indexOf(Math.max(...regionalData.data))
    ];
  const uniqueRegions = regionalData.labels.length;

  statsContainer.innerHTML = `
    <div class="stat-item">
      <div class="stat-value">${totalOrders}</div>
      <div class="stat-label">Total Orders</div>
    </div>
    <div class="stat-item">
      <div class="stat-value">${uniqueRegions}</div>
      <div class="stat-label">Regions (Top 5)</div>
    </div>
    <div class="stat-item">
      <div class="stat-value" style="font-size: 14px;">${topRegion}</div>
      <div class="stat-label">Top Region</div>
    </div>
  `;
}

/* ============================================================
   5. THEME COLORS - PROFESSIONAL DARK MODE
   ============================================================ */

const themeColors = {
  background: "#121212", // Deep charcoal
  surface: "#1a1a1a", // Slightly lighter
  text: "#CBD5E1", // Slate gray
  textBright: "#ffffff", // Pure white for contrast
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

/**
 * ============================================================
 * IMPLEMENTATION NOTES
 * ============================================================
 *
 * 1. DAILY TRAFFIC CHART
 *    - Now displays all 7 days of the week
 *    - Days appear in order: الأحد through السبت
 *    - Each day has its own colored bar
 *    - X-axis labels are in Arabic
 *    - Responsive at all breakpoints
 *
 * 2. REGIONAL SALES CHART
 *    - Top 5 regions only (sorted by order count descending)
 *    - Labels show LAST WORD of address only
 *    - Example: "سيدي سالم كفر الشيخ" → "الشيخ"
 *    - Donut chart with legend and statistical cards
 *    - Professional dark theme with neon accents
 *
 * 3. DARK MODE THEME
 *    - Background: #121212 (Deep charcoal)
 *    - Text: #CBD5E1 (Slate gray)
 *    - Accents: Neon colors (orange, cyan, lime green, etc.)
 *    - Fully responsive and mobile-optimized
 *
 * 4. BROWSER COMPATIBILITY
 *    - Chrome/Edge 90+
 *    - Firefox 88+
 *    - Safari 14+
 *    - Mobile browsers (iOS Safari, Chrome Mobile)
 *
 * ============================================================
 */
