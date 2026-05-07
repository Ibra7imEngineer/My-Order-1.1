/**
 * Advanced Insights Modal System
 * High-End Dashboard Analytics with Charts and Maps
 * Requires: Chart.js or ApexCharts, Leaflet.js
 */

// CDN Links needed in index.html head:
// For Chart.js:
// <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.js"></script>

// For ApexCharts (recommended for better dark theme):
// <script src="https://cdn.jsdelivr.net/npm/apexcharts"></script>

// <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
// <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>

let advancedChartsInstances = {
  basketChart: null,
  trafficChart: null,
  regionalChart: null,
  map: null,
};

/**
 * Location Coordinates Mapping
 * Maps Egyptian region names to Leaflet [latitude, longitude] coordinates
 * Used for dynamic map navigation and auto-zoom features
 */
const locationCoordinates = {
  // Egyptian locations with their geographic coordinates
  "سيدي سالم": [31.27, 30.78],
  "سيدي سالم كفرالشيخ": [31.27, 30.78],
  التفتيش: [31.2, 30.85],
  كفرالشيخ: [31.11, 30.94],
  القاهرة: [30.0444, 31.2357],
  الإسكندرية: [31.2001, 29.9187],
  الجيزة: [30.0131, 31.2089],
  الشرقية: [30.5565, 31.3409],
  المنوفية: [30.3461, 31.0047],
  البحيرة: [30.6905, 30.8481],
  الدقهلية: [31.1671, 31.4174],
  الفيوم: [29.3084, 30.8413],
  "بني سويف": [29.0703, 31.3091],
  المنيا: [28.1198, 30.75],
  أسيوط: [27.1815, 30.5741],
  سوهاج: [26.5546, 31.6948],
  قنا: [26.154, 32.7306],
  الأقصر: [25.6872, 32.6369],
  أسوان: [24.0889, 32.8998],
  الإسماعيلية: [30.5968, 32.2734],
  بورسعيد: [31.2565, 32.2841],
  السويس: [29.9668, 32.5498],
  "شمال سيناء": [31.0753, 33.9471],
  "جنوب سيناء": [28.2863, 33.5102],
  "البحر الأحمر": [26.1207, 34.2656],
  "مرسى مطروح": [31.3451, 27.2384],
  "الوادي الجديد": [25.5164, 29.1917],
};

/**
 * Data Processing Functions for Dynamic Charts
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

  // Initialize counters for ALL 7 days with 0 orders each
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
      // Extract region from address
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
 * Process orders data for Market Basket Analysis (Horizontal Bar Chart)
 * Identifies top 5 product pairs that are frequently bought together
 * Implements mandatory TOP 5 filter for professional, uncluttered visualization
 * @param {Array} orders - Array of order objects with items array
 * @returns {Object} - { labels: [], data: [] } - Top 5 product pairs by frequency
 */
function processMarketBasketData(orders) {
  const pairCounts = {};

  // Process each order to find item pairs
  orders.forEach((order) => {
    if (order.items && Array.isArray(order.items) && order.items.length > 1) {
      // Get unique item names in this order
      const items = [
        ...new Set(
          order.items
            .map((item) =>
              typeof item === "string" ? item : item.item_name || item.name,
            )
            .filter((name) => name),
        ),
      ];

      // Generate all possible pairs from items in this order
      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          const pair = [items[i], items[j]].sort().join(" + ");
          pairCounts[pair] = (pairCounts[pair] || 0) + 1;
        }
      }
    }
  });

  // MANDATORY TOP 5 FILTER: Sort descending by frequency and keep only top 5
  const topPairs = Object.entries(pairCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5); // FILTER: Keep only top 5 most frequent product pairs

  const labels = topPairs.map(([pair]) => pair);
  const data = topPairs.map(([, count]) => count);

  return { labels, data };
}

/**
 * Update map view to a specific location with smooth animation
 * @param {string} locationName - Name of location (in Arabic or English)
 * @param {number} zoomLevel - Optional zoom level (default: 12)
 */
function updateMapView(locationName, zoomLevel = 12) {
  if (!advancedChartsInstances.map) {
    console.warn("Map instance not initialized yet");
    return;
  }

  // Normalize location name
  const normalizedLocation = locationName.trim();
  const coordinates = locationCoordinates[normalizedLocation];

  if (!coordinates) {
    console.warn(
      `Location "${normalizedLocation}" not found in coordinates mapping`,
    );
    console.info("Available locations:", Object.keys(locationCoordinates));
    return;
  }

  // Animate map to the location with smooth fly-to effect
  advancedChartsInstances.map.flyTo(coordinates, zoomLevel, {
    duration: 1.5,
    easeLinearity: 0.25,
  });

  console.info(
    `Map updated to: ${normalizedLocation} [${coordinates[0]}, ${coordinates[1]}]`,
  );
}

/**
 * Get all available location names
 * @returns {array} Array of location names
 */
function getAvailableLocations() {
  return Object.keys(locationCoordinates);
}

/**
 * Initialize Advanced Insights Modal
 */
async function initializeAdvancedInsightsModal() {
  // Create modal HTML
  const modalHTML = `
        <div id="advancedInsightsOverlay" class="advanced-insights-overlay">
            <div id="advancedInsightsModal" class="advanced-insights-modal">
                <!-- Header -->
                <div class="advanced-insights-header">
                    <h2><i class="fas fa-chart-line"></i> Advanced Insights</h2>
                    <button class="advanced-insights-close" onclick="closeAdvancedInsights()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <!-- Content Grid -->
                <div class="advanced-insights-content">
                    <!-- Section 1: Market Basket Analysis -->
                    <div class="insight-section" id="basketSection">
                        <h3 class="insight-title">
                            <i class="fas fa-shopping-basket"></i>
                            Market Basket Analysis
                        </h3>
                        <div id="basketLoadingState" class="insight-loading">
                            <div class="spinner"></div>
                            Loading...
                        </div>
                        <div id="basketChartContainer" class="insight-chart-container" style="display: none;">
                            <canvas id="basketChart"></canvas>
                        </div>
                        <div id="basketStats" class="insight-stats"></div>
                    </div>
                    
                    <!-- Section 2: Daily Traffic Heatmap -->
                    <div class="insight-section" id="trafficSection">
                        <h3 class="insight-title">
                            <i class="fas fa-fire"></i>
                            Daily Traffic Heatmap
                        </h3>
                        <div id="trafficLoadingState" class="insight-loading">
                            <div class="spinner"></div>
                            Loading...
                        </div>
                        <div id="trafficChartContainer" class="insight-chart-container" style="display: none;">
                            <canvas id="trafficChart"></canvas>
                        </div>
                        <div id="trafficStats" class="insight-stats"></div>
                    </div>
                    
                    <!-- Section 3: Regional Sales Donut Chart -->
                    <div class="insight-section" id="regionalSection">
                        <h3 class="insight-title">
                            <i class="fas fa-chart-pie"></i>
                            Regional Sales Distribution
                        </h3>
                        <div id="regionalLoadingState" class="insight-loading">
                            <div class="spinner"></div>
                            Loading...
                        </div>
                        <div id="regionalChartContainer" class="insight-chart-container" style="display: none;">
                            <canvas id="regionalChart"></canvas>
                        </div>
                        <div id="regionalStats" class="insight-stats"></div>
                    </div>
                </div>
            </div>
        </div>
    `;

  // Add modal to DOM if not already present
  if (!document.getElementById("advancedInsightsOverlay")) {
    document.body.insertAdjacentHTML("beforeend", modalHTML);
  }

  // Add event listeners
  document
    .getElementById("advancedInsightsOverlay")
    .addEventListener("click", (e) => {
      if (e.target.id === "advancedInsightsOverlay") {
        closeAdvancedInsights();
      }
    });

  // Keyboard escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeAdvancedInsights();
    }
  });

  // Fetch and render data
  await loadAdvancedInsightsData();
}

/**
 * Open Advanced Insights Modal
 */
function openAdvancedInsights() {
  const overlay = document.getElementById("advancedInsightsOverlay");
  if (overlay) {
    overlay.classList.add("active");
    document.body.style.overflow = "hidden";
    // Ensure charts are redrawn when modal opens
    setTimeout(() => {
      if (advancedChartsInstances.basketChart)
        advancedChartsInstances.basketChart.resize();
      if (advancedChartsInstances.trafficChart)
        advancedChartsInstances.trafficChart.resize();
      if (advancedChartsInstances.regionalChart)
        advancedChartsInstances.regionalChart.resize();
      if (advancedChartsInstances.map)
        advancedChartsInstances.map.invalidateSize();
    }, 100);
  }
}

/**
 * Close Advanced Insights Modal
 */
function closeAdvancedInsights() {
  const overlay = document.getElementById("advancedInsightsOverlay");
  if (overlay) {
    overlay.classList.remove("active");
    document.body.style.overflow = "auto";
  }
}

/**
 * Fetch Advanced Insights Data from Backend
 */
async function loadAdvancedInsightsData() {
  try {
    // Fetch orders data from backend
    const ordersResponse = await fetch("api/fetch_orders.php");
    if (!ordersResponse.ok) {
      throw new Error(`HTTP error! status: ${ordersResponse.status}`);
    }

    const ordersResult = await ordersResponse.json();

    if (!ordersResult.success) {
      throw new Error(ordersResult.error || "Failed to load orders data");
    }

    const orders = ordersResult.data || [];

    // Process data for each chart
    const dailyTrafficData = processDailyTrafficData(orders);
    const regionalSalesData = processRegionalSalesData(orders);
    const marketBasketData = processMarketBasketData(orders);

    // Initialize charts with processed data
    renderDailyTrafficChart(dailyTrafficData);
    renderRegionalSalesChart(regionalSalesData);
    renderMarketBasketChart(marketBasketData);
  } catch (error) {
    console.error("Error loading advanced insights:", error);
    showError("Error loading data: " + error.message);
  }
}

/**
 * Render Market Basket Analysis Chart (Horizontal Bar Chart)
 */
function renderMarketBasketChart(basketData) {
  const container = document.getElementById("basketChartContainer");
  const loadingState = document.getElementById("basketLoadingState");
  const statsContainer = document.getElementById("basketStats");

  if (!basketData || basketData.data.length === 0) {
    loadingState.innerHTML =
      '<p style="color: #FFB347;">No basket data available yet</p>';
    return;
  }

  loadingState.style.display = "none";
  container.style.display = "block";

  // Destroy existing chart
  if (advancedChartsInstances.basketChart) {
    if (typeof advancedChartsInstances.basketChart.destroy === "function") {
      advancedChartsInstances.basketChart.destroy();
    }
  }

  // Check if ApexCharts is available, otherwise use Chart.js
  if (typeof ApexCharts !== "undefined") {
    // ApexCharts version with dark theme
    const options = {
      series: [
        {
          name: "Frequency",
          data: basketData.data,
        },
      ],
      chart: {
        type: "bar",
        height: 300,
        background: "#121212",
        foreColor: "#CBD5E1",
        toolbar: {
          show: false,
        },
        animations: {
          enabled: true,
          easing: "easeinout",
          speed: 1000,
        },
      },
      plotOptions: {
        bar: {
          borderRadius: 6,
          horizontal: true,
          barHeight: "70%",
          distributed: false,
          dataLabels: {
            position: "bottom",
          },
        },
      },
      colors: ["#00d4ff", "#ff8c00", "#ff6b35", "#ffb347", "#00ff88"],
      dataLabels: {
        enabled: true,
        textAnchor: "start",
        style: {
          colors: ["#ffffff"],
          fontSize: "12px",
          fontWeight: "bold",
        },
        formatter: function (val) {
          return val;
        },
        offsetX: 0,
      },
      xaxis: {
        categories: basketData.labels,
        labels: {
          style: {
            colors: "#CBD5E1",
            fontSize: "11px",
          },
        },
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
      },
      yaxis: {
        labels: {
          style: {
            colors: "#CBD5E1",
            fontSize: "11px",
            fontWeight: "600",
          },
          maxWidth: 200,
          offsetX: 0,
        },
      },
      grid: {
        borderColor: "rgba(0, 212, 255, 0.1)",
        strokeDashArray: 3,
        xaxis: {
          lines: {
            show: false,
          },
        },
      },
      theme: {
        mode: "dark",
      },
      tooltip: {
        theme: "dark",
        y: {
          formatter: function (val) {
            return val + " times purchased together";
          },
        },
      },
    };

    advancedChartsInstances.basketChart = new ApexCharts(
      document.getElementById("basketChart"),
      options,
    );
    advancedChartsInstances.basketChart.render();
  } else if (typeof Chart !== "undefined") {
    // Chart.js fallback with dark theme
    const ctx = document.getElementById("basketChart").getContext("2d");

    // Create neon gradient colors
    const gradients = basketData.data.map((_, index) => {
      const canvas = document.createElement("canvas");
      const ctx_temp = canvas.getContext("2d");
      const gradient = ctx_temp.createLinearGradient(0, 0, 400, 0);
      const colors = ["#00d4ff", "#ff8c00", "#ff6b35", "#ffb347", "#00ff88"];
      gradient.addColorStop(0, colors[index % colors.length] + "CC");
      gradient.addColorStop(1, colors[index % colors.length] + "66");
      return gradient;
    });

    advancedChartsInstances.basketChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: basketData.labels,
        datasets: [
          {
            label: "Times Purchased Together",
            data: basketData.data,
            backgroundColor: gradients,
            borderColor: [
              "#00d4ff",
              "#ff8c00",
              "#ff6b35",
              "#ffb347",
              "#00ff88",
            ],
            borderWidth: 2,
            borderRadius: 8,
            barThickness: "flex",
            maxBarThickness: 40,
          },
        ],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: "rgba(18, 18, 18, 0.95)",
            borderColor: "#00d4ff",
            borderWidth: 2,
            titleColor: "#ffffff",
            bodyColor: "#CBD5E1",
            padding: 12,
            borderRadius: 8,
            displayColors: false,
            callbacks: {
              label: function (context) {
                return context.parsed.x + " times purchased together";
              },
            },
          },
        },
        scales: {
          x: {
            ticks: {
              color: "#CBD5E1",
              font: { size: 11 },
            },
            grid: {
              color: "rgba(0, 212, 255, 0.1)",
              borderDash: [5, 5],
            },
            beginAtZero: true,
          },
          y: {
            ticks: {
              color: "#CBD5E1",
              font: { size: 11, weight: "600" },
              maxTicksLimit: 5,
            },
            grid: { display: false },
          },
        },
      },
    });
  }

  // Display stats
  const totalPairs = basketData.data.length;
  const maxFrequency = Math.max(...basketData.data);
  const avgFrequency =
    basketData.data.length > 0
      ? (
          basketData.data.reduce((a, b) => a + b, 0) / basketData.data.length
        ).toFixed(1)
      : 0;

  statsContainer.innerHTML = `
    <div class="stat-item">
      <div class="stat-value">${totalPairs}</div>
      <div class="stat-label">Product Pairs</div>
    </div>
    <div class="stat-item">
      <div class="stat-value">${maxFrequency}</div>
      <div class="stat-label">Max Frequency</div>
    </div>
    <div class="stat-item">
      <div class="stat-value">${avgFrequency}</div>
      <div class="stat-label">Avg Frequency</div>
    </div>
  `;
}

/**
 * Render Regional Sales Chart (Donut Chart)
 */
function renderRegionalSalesChart(regionalData) {
  const container = document.getElementById("regionalChartContainer");
  const loadingState = document.getElementById("regionalLoadingState");
  const statsContainer = document.getElementById("regionalStats");

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

  // Check if ApexCharts is available, otherwise use Chart.js
  if (typeof ApexCharts !== "undefined") {
    // ApexCharts version with dark theme
    const options = {
      series: regionalData.data,
      chart: {
        type: "donut",
        height: 300,
        background: "#121212",
        foreColor: "#CBD5E1",
        toolbar: {
          show: false,
        },
        animations: {
          enabled: true,
          easing: "easeinout",
          speed: 1000,
        },
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
          fillColors: [
            "#ff8c00",
            "#00d4ff",
            "#ff6b35",
            "#ffb347",
            "#00ff88",
            "#ff0080",
            "#8000ff",
            "#ff4500",
          ],
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
          breakpoint: 480,
          options: {
            chart: {
              height: 250,
            },
            legend: {
              position: "bottom",
            },
          },
        },
      ],
    };

    advancedChartsInstances.regionalChart = new ApexCharts(
      document.getElementById("regionalChart"),
      options,
    );
    advancedChartsInstances.regionalChart.render();
  } else if (typeof Chart !== "undefined") {
    // Chart.js fallback with dark theme
    const ctx = document.getElementById("regionalChart").getContext("2d");

    // Create neon colors for donut chart
    const colors = [
      "#ff8c00",
      "#00d4ff",
      "#ff6b35",
      "#ffb347",
      "#00ff88",
      "#ff0080",
      "#8000ff",
      "#ff4500",
    ];

    advancedChartsInstances.regionalChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: regionalData.labels,
        datasets: [
          {
            data: regionalData.data,
            backgroundColor: colors
              .slice(0, regionalData.data.length)
              .map((color) => color + "CC"),
            borderColor: colors.slice(0, regionalData.data.length),
            borderWidth: 3,
            hoverBorderWidth: 4,
            hoverBorderColor: "#ffffff",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "70%",
        plugins: {
          legend: {
            position: "bottom",
            labels: {
              color: "#CBD5E1",
              font: { size: 12, weight: "600" },
              padding: 15,
              usePointStyle: true,
              pointStyle: "circle",
            },
          },
          tooltip: {
            backgroundColor: "rgba(18, 18, 18, 0.95)",
            borderColor: "#ff8c00",
            borderWidth: 2,
            titleColor: "#ffffff",
            bodyColor: "#CBD5E1",
            padding: 12,
            borderRadius: 8,
            displayColors: true,
            callbacks: {
              label: function (context) {
                const label = context.label || "";
                const value = context.parsed;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const percentage = ((value / total) * 100).toFixed(1);
                return `${label}: ${value} orders (${percentage}%)`;
              },
            },
          },
        },
      },
    });
  }

  // Display stats
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
      <div class="stat-label">Top Regions</div>
    </div>
    <div class="stat-item">
      <div class="stat-value" style="font-size: 14px;">${topRegion}</div>
      <div class="stat-label">Top Region</div>
    </div>
  `;
}

/**
 * Render Daily Traffic Chart (Bar Chart)
 */
/**
 * Render Daily Traffic Chart (Bar Chart)
 * @param {Object} trafficData - { labels: [], data: [] }
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

  // Check if ApexCharts is available, otherwise use Chart.js
  if (typeof ApexCharts !== "undefined") {
    // ApexCharts version with dark theme
    const options = {
      series: [
        {
          name: "Orders",
          data: trafficData.data,
        },
      ],
      chart: {
        type: "bar",
        height: 300,
        background: "#121212",
        foreColor: "#CBD5E1",
        toolbar: {
          show: false,
        },
        animations: {
          enabled: true,
          easing: "easeinout",
          speed: 1000,
        },
      },
      plotOptions: {
        bar: {
          borderRadius: 8,
          columnWidth: "60%",
          distributed: false,
          dataLabels: {
            position: "top",
          },
        },
      },
      colors: [
        "#ff8c00",
        "#00d4ff",
        "#ff6b35",
        "#ffb347",
        "#00ff88",
        "#ff0080",
        "#8000ff",
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
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
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
  } else if (typeof Chart !== "undefined") {
    // Chart.js fallback with dark theme
    const ctx = document.getElementById("trafficChart").getContext("2d");

    // Create gradient colors
    const gradients = trafficData.data.map((_, index) => {
      const canvas = document.createElement("canvas");
      const ctx_temp = canvas.getContext("2d");
      const gradient = ctx_temp.createLinearGradient(0, 0, 0, 300);
      const colors = [
        "#ff8c00",
        "#00d4ff",
        "#ff6b35",
        "#ffb347",
        "#00ff88",
        "#ff0080",
        "#8000ff",
      ];
      gradient.addColorStop(0, colors[index % colors.length] + "CC");
      gradient.addColorStop(1, colors[index % colors.length] + "66");
      return gradient;
    });

    try {
      advancedChartsInstances.trafficChart = new Chart(ctx, {
        type: "bar",
        data: {
          labels: trafficData.labels,
          datasets: [
            {
              label: "Orders Per Day",
              data: trafficData.data,
              backgroundColor: gradients,
              borderColor: [
                "#ff8c00",
                "#00d4ff",
                "#ff6b35",
                "#ffb347",
                "#00ff88",
                "#ff0080",
                "#8000ff",
              ],
              borderWidth: 2,
              borderRadius: 10,
              barThickness: "flex",
              maxBarThickness: 50,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              backgroundColor: "rgba(18, 18, 18, 0.95)",
              borderColor: "#ff8c00",
              borderWidth: 2,
              titleColor: "#ffffff",
              bodyColor: "#CBD5E1",
              padding: 12,
              borderRadius: 8,
              displayColors: false,
              callbacks: {
                label: function (context) {
                  return context.parsed.y + " orders";
                },
              },
            },
          },
          scales: {
            x: {
              ticks: {
                color: "#CBD5E1",
                font: { size: 12, weight: "600" },
              },
              grid: { display: false },
            },
            y: {
              ticks: {
                color: "#CBD5E1",
                font: { size: 11 },
              },
              grid: {
                color: "rgba(255, 140, 0, 0.1)",
                borderDash: [5, 5],
              },
              beginAtZero: true,
            },
          },
        },
      });
    } catch (error) {
      console.error("Error creating Chart.js:", error);
      loadingState.innerHTML =
        '<p style="color: #FF6B35; text-align: center; padding: 20px;">Error loading chart library</p>';
      return;
    }
  } else {
    // Neither ApexCharts nor Chart.js is available
    loadingState.innerHTML =
      '<p style="color: #FF6B35; text-align: center; padding: 20px;">Chart libraries not loaded. Please check your internet connection.</p>';
    return;
  }

  // Display stats
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
 * Render Regional Sales Map
 */
async function renderRegionalMap(regionalData) {
  const container = document.getElementById("regionalMapContainer");
  const loadingState = document.getElementById("mapLoadingState");

  if (regionalData.length === 0) {
    loadingState.innerHTML =
      '<p style="color: #FFB347;">No regional data available</p>';
    return;
  }

  loadingState.style.display = "none";
  container.style.display = "block";

  // Check if Leaflet is available
  if (typeof L === "undefined") {
    container.innerHTML =
      '<p style="color: #FF6B35; padding: 20px;">Leaflet.js not loaded. Please include Leaflet CDN.</p>';
    return;
  }

  // Destroy existing map
  if (advancedChartsInstances.map) {
    advancedChartsInstances.map.remove();
  }

  // Initialize map centered on Egypt (Cairo)
  const map = L.map("regionalMapContainer", {
    center: [30.0444, 31.2357],
    zoom: 13,
    scrollWheelZoom: true,
  });

  // Use CartoDB DarkMatter tile layer (professional dark theme)
  L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
    attribution: "© CartoDB",
    maxZoom: 19,
    minZoom: 10,
  }).addTo(map);

  // Process addresses to extract coordinates and count frequencies
  const locationFrequency = {};

  regionalData.forEach((region) => {
    // Extract coordinates from address using the new function
    const coordinates = getCoordinatesFromAddress(region.address);

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

      locationFrequency[locationKey].orderCount += region.order_count;
      locationFrequency[locationKey].revenue += region.revenue;
      locationFrequency[locationKey].addresses.push(region.address);

      // Find which location name was matched for display
      if (!locationFrequency[locationKey].matchedLocation) {
        for (const locationName of Object.keys(locationCoordinates)) {
          if (region.address.includes(locationName)) {
            locationFrequency[locationKey].matchedLocation = locationName;
            break;
          }
        }
      }
    } else {
      console.warn(
        `Could not extract coordinates from address: "${region.address}"`,
      );
    }
  });

  // Convert to array for processing
  const aggregatedData = Object.values(locationFrequency);

  if (aggregatedData.length === 0) {
    container.innerHTML =
      '<p style="color: #FFB347; padding: 20px;">No valid locations found in order data</p>';
    return;
  }

  // Find max order count for scaling
  const maxOrders = Math.max(...aggregatedData.map((loc) => loc.orderCount));

  // Add heat circles for each aggregated location
  aggregatedData.forEach((location) => {
    const intensity = location.orderCount / maxOrders;
    const radius = 300 + intensity * 800; // Radius in meters
    const opacity = 0.4 + intensity * 0.5;

    // Circle marker with click handler for map navigation
    L.circleMarker(location.coordinates, {
      radius: 15 + intensity * 20,
      fillColor: "#FF6B35",
      color: "#FFB347",
      weight: 2,
      opacity: 0.8,
      fillOpacity: intensity,
    })
      .bindPopup(
        `
            <div style="color: #FFB347; font-weight: bold;">
                <div>${location.matchedLocation || "Location"}</div>
                <div style="font-size: 12px; margin-top: 8px;">
                    Orders: ${location.orderCount}<br>
                    Revenue: ${location.revenue.toFixed(2)} EGP<br>
                    <small>Addresses: ${location.addresses.length}</small>
                </div>
                <button onclick="updateMapView('${location.matchedLocation || location.addresses[0]}')" style="margin-top: 10px; background: #FF6B35; color: white; border: none; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-weight: 600; font-size: 11px;">
                    Navigate Here
                </button>
            </div>
        `,
        { closeButton: true, maxWidth: 200 },
      )
      .on("click", function () {
        // Optional: Auto-zoom when clicking marker
      })
      .addTo(map);

    // Optional: Add circle outline for heatmap effect
    L.circle(location.coordinates, {
      radius: radius,
      fillColor: "#FF6B35",
      fillOpacity: opacity * 0.15,
      color: "#FF6B35",
      weight: 1,
      opacity: opacity * 0.4,
      dashArray: "5, 5",
    }).addTo(map);
  });

  advancedChartsInstances.map = map;

  // Update map on window resize
  window.addEventListener("resize", () => {
    if (advancedChartsInstances.map) {
      advancedChartsInstances.map.invalidateSize();
    }
  });

  console.info(`Rendered ${aggregatedData.length} location markers on map`);
}

/**
 * Show Error Message
 */
function showError(message) {
  console.error(message);
  alert("Error: " + message);
}

/**
 * Auto-navigate to a location when clicking the "Navigate Here" button in popup
 * Tries to match the exact location or finds the closest match
 * @param {string} locationName - Name of the location/address
 */
function autoNavigateToLocation(locationName) {
  // First, try exact match
  if (locationCoordinates[locationName]) {
    updateMapView(locationName, 13);
    return;
  }

  // If exact match fails, try to find partial match
  const partialMatches = Object.keys(locationCoordinates).filter(
    (loc) =>
      loc.toLowerCase().includes(locationName.toLowerCase()) ||
      locationName.toLowerCase().includes(loc.toLowerCase()),
  );

  if (partialMatches.length > 0) {
    updateMapView(partialMatches[0], 13);
    console.info(`Navigated to closest match: ${partialMatches[0]}`);
    return;
  }

  console.warn(`Could not find location: ${locationName}`);
  console.info(
    "Tip: Add the location to the locationCoordinates mapping for better support",
  );
}

/**
 * Extract coordinates from order address by matching location names
 * Iterates through locationCoordinates keys and finds substring matches
 * Prioritizes more specific (longer) location names when multiple matches exist
 * @param {string} orderAddress - Full address text from order
 * @returns {array|null} [latitude, longitude] coordinates or null if no match
 */
function getCoordinatesFromAddress(orderAddress) {
  if (!orderAddress || typeof orderAddress !== "string") {
    return null;
  }

  const matches = [];

  // Iterate through all location keys
  for (const locationName of Object.keys(locationCoordinates)) {
    // Check if location name exists as substring in address
    if (orderAddress.includes(locationName)) {
      matches.push({
        name: locationName,
        coordinates: locationCoordinates[locationName],
        length: locationName.length, // For prioritizing more specific matches
      });
    }
  }

  if (matches.length === 0) {
    return null;
  }

  // If multiple matches, prioritize the most specific (longest) location name
  // This handles cases like "سيدي سالم" vs "سيدي سالم كفرالشيخ"
  if (matches.length > 1) {
    matches.sort((a, b) => b.length - a.length); // Sort by length descending
    console.info(
      `Multiple location matches found for "${orderAddress}". Using most specific: "${matches[0].name}"`,
    );
  }

  return matches[0].coordinates;
}

/**
 * Initialize when DOM is loaded
 */
document.addEventListener("DOMContentLoaded", () => {
  initializeAdvancedInsightsModal();
});

/**
 * Export functions to global scope for button click handlers
 */
window.openAdvancedInsights = openAdvancedInsights;
window.closeAdvancedInsights = closeAdvancedInsights;
window.updateMapView = updateMapView;
window.getAvailableLocations = getAvailableLocations;
window.autoNavigateToLocation = autoNavigateToLocation;
window.getCoordinatesFromAddress = getCoordinatesFromAddress;
