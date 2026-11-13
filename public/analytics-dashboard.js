
(() => {
  const tokenInput = document.getElementById("admin-token");
  const loadButton = document.getElementById("load-analytics");
  const status = document.getElementById("status");
  const content = document.getElementById("analytics-content");
  const total = document.getElementById("total-visits");
  const uniqueVisitors = document.getElementById("unique-visitors");
  const last30 = document.getElementById("last-30-visits");
  const body = document.getElementById("visits-body");
  const pagesBreakdown = document.getElementById("pages-breakdown");
  const devicesBreakdown = document.getElementById("devices-breakdown");
  const browsersBreakdown = document.getElementById("browsers-breakdown");

  const API_BASE_URL = ["localhost", "127.0.0.1"].includes(window.location.hostname)
    ? ""
    : "https://taiyaba-portfolio-analytics.onrender.com";

  function cell(value) {
    const element = document.createElement("td");
    element.textContent = value == null || value === "" ? "—" : String(value);
    return element;
  }

  function renderBreakdown(container, items) {
    container.replaceChildren();

    if (!Array.isArray(items) || items.length === 0) {
      const empty = document.createElement("p");
      empty.className = "empty-breakdown";
      empty.textContent = "No data available yet.";
      container.append(empty);
      return;
    }

    const largestCount = Math.max(...items.map(item => Number(item.count) || 0), 1);

    for (const item of items) {
      const row = document.createElement("div");
      row.className = "breakdown-item";

      const heading = document.createElement("div");
      heading.className = "breakdown-heading";

      const label = document.createElement("span");
      label.textContent = item._id || "Unknown";

      const count = document.createElement("span");
      count.textContent = String(item.count || 0);

      const track = document.createElement("div");
      track.className = "breakdown-track";
      track.setAttribute("aria-hidden", "true");

      const fill = document.createElement("div");
      fill.className = "breakdown-fill";
      fill.style.width = `${Math.max(0, Math.min(100, (Number(item.count) / largestCount) * 100))}%`;

      heading.append(label, count);
      track.append(fill);
      row.append(heading, track);
      container.append(row);
    }
  }

  function formatCount(value) {
    return new Intl.NumberFormat().format(Number(value) || 0);
  }

  async function loadAnalytics() {
    const token = tokenInput.value.trim();

    if (!token) {
      status.dataset.state = "error";
      status.textContent = "Enter your analytics access token.";
      return;
    }

    loadButton.disabled = true;
    status.dataset.state = "loading";
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
      const recent = Array.isArray(data.recent) ? data.recent : [];

      total.textContent = formatCount(data.total);
      uniqueVisitors.textContent = formatCount(data.uniqueVisitors);
      last30.textContent = formatCount(data.last30);
      body.replaceChildren();

      for (const visit of recent) {
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

      renderBreakdown(pagesBreakdown, data.pages);
      renderBreakdown(devicesBreakdown, data.devices);
      renderBreakdown(browsersBreakdown, data.browsers);
      content.hidden = false;
      status.dataset.state = "success";
      status.textContent = `Loaded ${recent.length} recent visits.`;

    } catch (error) {
      content.hidden = true;
      status.dataset.state = "error";
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
