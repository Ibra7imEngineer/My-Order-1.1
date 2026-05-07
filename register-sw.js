// External Service Worker registration to avoid inline-CSP issues
// ⚠️ Note: Service Workers only work on HTTP/HTTPS, not on file:// protocol

if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    // Check if running on file:// protocol
    if (window.location.protocol === "file:") {
      console.warn("⚠️ Service Worker cannot register on file:// protocol.");
      console.info("💡 Service Worker requires HTTP/HTTPS.");
      console.info(
        "   Host the app on a static server or deploy it to a hosting provider.",
      );
      return;
    }

    navigator.serviceWorker
      .register("./sw.js")
      .then(function (reg) {
        console.log(
          "✅ Service Worker registered successfully (scope):",
          reg.scope,
        );
      })
      .catch(function (err) {
        console.warn("⚠️ Service Worker registration failed:", err.message);
        if (err.message.includes("Unsupported protocol")) {
          console.info(
            "💡 Service Workers require HTTP/HTTPS. Host the app on a static server or deploy it to a hosting provider instead of file://",
          );
        }
      });
  });
} else {
  console.warn("⚠️ Service Workers are not supported in this browser.");
}
