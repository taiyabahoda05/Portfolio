(() => {
  if (window.location.pathname === "/analytics.html") return;

  const API_BASE_URL = ["localhost", "127.0.0.1"].includes(window.location.hostname)
    ? ""
    : "https://taiyaba-portfolio-analytics.onrender.com";

  const payload = {
    page: window.location.pathname,
    referrer: document.referrer || ""
  };

  const sendVisit = () => {
    fetch(`${API_BASE_URL}/api/analytics/visit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
      credentials: "omit"
    }).catch(() => {
      // Analytics must never interfere with the portfolio experience.
    });
  };

  if (document.readyState === "complete") {
    sendVisit();
  } else {
    window.addEventListener("load", sendVisit, { once: true });
  }
})();