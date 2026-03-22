/**
 * My Order - Enhanced Service Worker
 * ✨ جودة 5 نجوم | ⚡ سرعة عالية | 🔐 أمان مضمون
 *
 * Features:
 * - Advanced caching strategies
 * - Offline support
 * - Background sync
 * - Image caching
 */

// Configuration
const CACHE_NAME = "myorder-v2";
const STATIC_CACHE = "myorder-static-v2";
const DYNAMIC_CACHE = "myorder-dynamic-v2";
const IMAGE_CACHE = "myorder-images-v2";

// Assets to cache on install
const STATIC_ASSETS = [
  "/",
  "/index.html",
  "/offline.html",
  "/style.css",
  "/script.js",
  "/manifest.json",
  "/icons/icon-192.svg",
  "/icons/icon-512.svg",
  "/icons/apple-touch-icon-180.png",
  "/icons/apple-touch-icon-152.png",
  "/icons/apple-touch-icon-120.png",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css",
];

// Install event - cache static assets
self.addEventListener("install", (event) => {
  console.log("[SW] Installing Service Worker...");

  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log("[SW] Caching static assets");
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log("[SW] Static assets cached");
        return self.skipWaiting();
      })
      .catch((err) => {
        console.error("[SW] Cache failed:", err);
      }),
  );
});

// Activate event - clean old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating Service Worker...");

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              // Keep only current version caches
              return (
                name.startsWith("myorder-") &&
                name !== STATIC_CACHE &&
                name !== DYNAMIC_CACHE &&
                name !== IMAGE_CACHE
              );
            })
            .map((name) => {
              console.log("[SW] Deleting old cache:", name);
              return caches.delete(name);
            }),
        );
      })
      .then(() => {
        console.log("[SW] Service Worker activated");
        return self.clients.claim();
      }),
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") {
    return;
  }

  // Skip Chrome extensions and other non-http requests
  if (!url.protocol.startsWith("http")) {
    return;
  }

  // Different strategies for different resource types
  if (isImageRequest(request)) {
    // Images: Cache First, then Network
    event.respondWith(cacheFirst(request, IMAGE_CACHE));
  } else if (isStaticAsset(request)) {
    // Static assets: Cache First
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  } else if (isApiRequest(request)) {
    // API requests: Network First
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
  } else if (request.mode === "navigation") {
    // Navigation requests: Network First, fallback to cache
    event.respondWith(networkFirst(request, DYNAMIC_CACHE));
  } else {
    // Default: Stale While Revalidate
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
  }
});

// Helper functions to identify request types
function isImageRequest(request) {
  const url = new URL(request.url);
  return (
    url.pathname.match(/\.(jpg|jpeg|png|gif|svg|webp|ico)$/i) ||
    url.pathname.includes("/images/") ||
    url.pathname.includes("/icons/") ||
    url.pathname.includes("unsplash") ||
    url.pathname.includes("pexels")
  );
}

function isStaticAsset(request) {
  const url = new URL(request.url);
  return (
    url.pathname.match(/\.(js|css|woff|woff2|ttf|eot)$/i) ||
    url.pathname.includes("/icons/") ||
    url.pathname.includes("/fonts/")
  );
}

function isApiRequest(request) {
  const url = new URL(request.url);
  return url.pathname.startsWith("/api/");
}

// Cache First strategy
async function cacheFirst(request, cacheName) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    console.log("[SW] Serving from cache:", request.url);
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    if (networkResponse && networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
      console.log("[SW] Cached:", request.url);
    }

    return networkResponse;
  } catch (error) {
    console.error("[SW] Fetch failed:", error);
    // Return offline fallback for images
    if (isImageRequest(request)) {
      return caches.match("/icons/icon-192.svg");
    }
    throw error;
  }
}

// Network First strategy
async function networkFirst(request, cacheName) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse && networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log("[SW] Network failed, serving from cache:", request.url);
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline page for navigation
    if (request.mode === "navigation") {
      if (url.pathname.startsWith("/admin")) {
        // serve lightweight offline page when admin UI can't load
        const offlineMatch = await caches.match("/offline.html");
        if (offlineMatch) return offlineMatch;
      }
      return caches.match("/index.html");
    }

    throw error;
  }
}

// Stale While Revalidate strategy
async function staleWhileRevalidate(request, cacheName) {
  const cachedResponse = await caches.match(request);

  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse && networkResponse.ok) {
        const cache = caches.open(cacheName);
        cache.then((c) => c.put(request, networkResponse.clone()));
      }
      return networkResponse;
    })
    .catch((error) => {
      console.error("[SW] Revalidate failed:", error);
    });

  return cachedResponse || fetchPromise;
}

// Background Sync for offline orders
self.addEventListener("sync", (event) => {
  console.log("[SW] Background sync:", event.tag);

  if (event.tag === "sync-orders") {
    event.waitUntil(syncOrders());
  }
});

async function syncOrders() {
  console.log("[SW] Syncing offline orders...");
  // Get pending orders from IndexedDB and send them
  // This would integrate with your order system
}

// Push notifications (for future use)
self.addEventListener("push", (event) => {
  const options = {
    body: event.data ? event.data.text() : "New order received!",
    icon: "/icons/icon-192.svg",
    badge: "/icons/icon-192.svg",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
    actions: [
      { action: "view", title: "View" },
      { action: "close", title: "Close" },
    ],
  };

  event.waitUntil(self.registration.showNotification("My Order", options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "view") {
    event.waitUntil(clients.openWindow("/admin/"));
  }
});

console.log("[SW] My Order Service Worker loaded successfully");
