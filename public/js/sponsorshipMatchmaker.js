(function attachSponsorshipMatchmaker(global) {
  const DEFAULT_RECOMMENDATIONS = [
    {
      id: "techgear",
      brand: "TechGear",
      matchScore: 98,
      niche: "Software Engineering",
      budget: "$5k - $10k",
      contact: "partners@techgear.com",
    },
    {
      id: "codeacademy",
      brand: "CodeAcademy",
      matchScore: 92,
      niche: "Education",
      budget: "$8k - $15k",
      contact: "influencers@codeacademy.dev",
    },
    {
      id: "fitlife",
      brand: "FitLife",
      matchScore: 65,
      niche: "Fitness",
      budget: "$2k - $5k",
      contact: "sponsorships@fitlife.co",
    },
  ];

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function getMatchStyle(score) {
    if (score >= 90) {
      return { background: "#dcfce7", text: "#166534" };
    }
    if (score >= 75) {
      return { background: "#fef9c3", text: "#854d0e" };
    }
    return { background: "#fef2f2", text: "#991b1b" };
  }

  function normalizeRecommendations(value) {
    if (!Array.isArray(value)) {
      return [];
    }

    return value
      .filter((item) => item && item.id != null && typeof item.brand === "string")
      .map((item) => ({
        id: String(item.id),
        brand: item.brand,
        matchScore: Number.isFinite(Number(item.matchScore))
          ? Math.max(0, Math.min(100, Number(item.matchScore)))
          : 0,
        niche: item.niche || "Unknown",
        budget: item.budget || "Not provided",
        contact: item.contact || "",
      }))
      .sort((a, b) => b.matchScore - a.matchScore);
  }

  function renderRecommendations(container, recommendations, state) {
    const items = normalizeRecommendations(recommendations);

    if (state === "loading") {
      container.innerHTML = `
        <div style="text-align:center;padding:60px 20px;background:#f8fafc;border-radius:12px;border:1px solid #e2e8f0">
          <div style="width:40px;height:40px;border:4px solid #e2e8f0;border-top-color:#3b82f6;border-radius:50%;animation:creatoros-matchmaker-spin 1s linear infinite;margin:0 auto 16px"></div>
          <h3 style="margin:0 0 8px;color:#334155">Analyzing Audience Demographics...</h3>
          <p style="margin:0;color:#64748b;font-size:14px">Cross-referencing your engagement metrics with active brand campaigns.</p>
        </div>`;
      return;
    }

    if (state === "error") {
      container.innerHTML = `
        <div style="padding:24px;background:#fef2f2;border:1px solid #fecaca;border-radius:12px;color:#991b1b" role="alert">
          <strong>Recommendations unavailable.</strong>
          <p style="margin:8px 0 0">Please try again later.</p>
        </div>`;
      return;
    }

    if (items.length === 0) {
      container.innerHTML = `
        <div style="padding:24px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;color:#475569">
          No matching sponsorship opportunities were found.
        </div>`;
      return;
    }

    container.innerHTML = items
      .map((brand) => {
        const colors = getMatchStyle(brand.matchScore);
        return `
          <article data-brand-id="${escapeHtml(brand.id)}" style="display:flex;justify-content:space-between;align-items:center;gap:24px;background:#fff;border:1px solid #cbd5e1;border-radius:12px;padding:24px;box-shadow:0 4px 6px -1px rgba(0,0,0,.1)">
            <div style="min-width:0">
              <h3 style="margin:0 0 12px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;font-size:20px;color:#0f172a">
                ${escapeHtml(brand.brand)}
                <span style="font-size:12px;background:${colors.background};color:${colors.text};padding:4px 10px;border-radius:12px;font-weight:bold">
                  ${brand.matchScore}% Audience Match
                </span>
              </h3>
              <div style="display:flex;gap:24px;flex-wrap:wrap">
                <div>
                  <p style="margin:0 0 4px;font-size:12px;color:#64748b;text-transform:uppercase;font-weight:bold">Niche</p>
                  <p style="margin:0;font-size:15px;color:#334155;font-weight:500">${escapeHtml(brand.niche)}</p>
                </div>
                <div>
                  <p style="margin:0 0 4px;font-size:12px;color:#64748b;text-transform:uppercase;font-weight:bold">Est. Budget</p>
                  <p style="margin:0;font-size:15px;color:#334155;font-weight:500">${escapeHtml(brand.budget)}</p>
                </div>
              </div>
            </div>
            <button type="button" data-outreach-brand="${escapeHtml(brand.id)}" style="flex:0 0 180px;padding:12px 24px;background:#2563eb;color:#fff;border:0;border-radius:8px;font-weight:bold;font-size:15px;cursor:pointer">
              Draft AI Pitch
            </button>
          </article>`;
      })
      .join("");
  }

  function render(container, options = {}) {
    if (!(container instanceof HTMLElement)) {
      throw new TypeError("A valid HTML element is required.");
    }

    const recommendations = options.recommendations || DEFAULT_RECOMMENDATIONS;
    container.innerHTML = `
      <div style="max-width:850px;margin:0 auto;font-family:system-ui,sans-serif">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:16px;margin-bottom:24px;flex-wrap:wrap">
          <div>
            <h2 style="margin:0 0 4px;color:#1e293b">AI Sponsorship Matchmaker</h2>
            <p style="margin:0;color:#64748b;font-size:14px">Discover brand deals mathematically aligned with your audience.</p>
          </div>
          <span style="background:#f1f5f9;padding:8px 16px;border-radius:20px;font-size:14px;font-weight:bold;color:#0f172a;border:1px solid #cbd5e1">
            Audience Profile Strength: <span>92%</span>
          </span>
        </div>
        <div data-recommendation-results></div>
      </div>`;

    if (!document.getElementById("creatoros-matchmaker-styles")) {
      const style = document.createElement("style");
      style.id = "creatoros-matchmaker-styles";
      style.textContent = "@keyframes creatoros-matchmaker-spin { to { transform: rotate(360deg); } }";
      document.head.appendChild(style);
    }

    const results = container.querySelector("[data-recommendation-results]");
    renderRecommendations(results, recommendations, "ready");
  }

  global.CreatorOSSponsorshipMatchmaker = { render };
})(window);
