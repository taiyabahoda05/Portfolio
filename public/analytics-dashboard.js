
(() => {
  const tokenInput = document.getElementById("admin-token");
  const loadButton = document.getElementById("load-analytics");
  const status = document.getElementById("status");
  const content = document.getElementById("analytics-content");
  const total = document.getElementById("total-visits");
  const body = document.getElementById("visits-body");

  const API_BASE_URL = ["localhost", "127.0.0.1"].includes(window.location.hostname)
    ? ""
    : "https://taiyaba-portfolio-analytics.onrender.com";

  function cell(value) {
    const element = document.createElement("td");
    element.textContent = value == null || value === "" ? "—" : String(value);
    return element;
  }

  async function loadAnalytics() {
    const token = tokenInput.value.trim();

    if (!token) {
      status.textContent = "Enter your analytics access token.";
      return;
    }

    loadButton.disabled = true;
    status.textContent = "Loading visit records…";

    try {
      const response = await fetch(`${API_BASE_URL}/api/analytics/summary`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        cache: "no-store",
        credentials: "omit"
      });

      if (!response.ok) {
        throw new Error(
          response.status === 401
            ? "Invalid access token."
            : "Unable to load analytics."
        );
      }

      const data = await response.json();

      total.textContent = String(data.total);
      body.replaceChildren();

      for (const visit of data.recent) {
        const row = document.createElement("tr");

        const date = visit.visitedAt
          ? new Date(visit.visitedAt).toLocaleString()
          : "—";

        [
          date,
          visit.visitorId,
          visit.device,
          visit.browser,
          visit.operatingSystem,
          visit.page,
          visit.referrer
        ].forEach(value => row.append(cell(value)));

        body.append(row);
      }

      content.hidden = false;
      status.textContent = `Loaded ${data.recent.length} recent visits.`;

    } catch (error) {
      content.hidden = true;
      status.textContent = error.message;

    } finally {
      loadButton.disabled = false;
    }
  }

  loadButton.addEventListener("click", loadAnalytics);

  tokenInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      loadAnalytics();
    }
  });
})();
