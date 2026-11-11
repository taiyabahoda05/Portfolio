(() => {
  if (window.location.pathname === "/analytics.html") return;

  const payload = {
    page: window.location.pathname,
    referrer: document.referrer || ""
  };

  const sendVisit = () => {
    fetch("/api/analytics/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
      credentials: "same-origin"
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
