// ==============================================================================
// KDD ANALYTICS LAB - DASHBOARD CONTROLLER (app.js)
// ==============================================================================

document.addEventListener("DOMContentLoaded", () => {
  initTabs();
  initOverview();
  initPersonas();
  initExplorer();
  initBenchmark();
  initSimulator();
  initSqlConsole();
});

// ------------------------------------------------------------------------------
// 1. TABS MANAGEMENT
// ------------------------------------------------------------------------------
let currentActiveTab = "overview";
const initializedCharts = {};

function initTabs() {
  const tabBtns = document.querySelectorAll(".tab-btn");
  const tabPanes = document.querySelectorAll(".tab-pane");

  tabBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const tabId = btn.getAttribute("data-tab");
      if (tabId === currentActiveTab) return;

      tabBtns.forEach((b) => b.classList.remove("active"));
      tabPanes.forEach((p) => p.classList.remove("active"));

      btn.classList.add("active");
      const targetPane = document.getElementById(`tab-${tabId}`);
      if (targetPane) targetPane.classList.add("active");

      currentActiveTab = tabId;

      // Trigger resize for Chart.js instances inside newly visible tab
      setTimeout(() => {
        Object.values(initializedCharts).forEach((chart) => {
          if (chart && typeof chart.resize === "function") chart.resize();
        });
      }, 50);
    });
  });
}

// ------------------------------------------------------------------------------
// 2. OVERVIEW & FUNNEL
// ------------------------------------------------------------------------------
function initOverview() {
  if (typeof GLOBAL_STATS === "undefined") return;

  // 2.1 KPI Cards
  const setElText = (id, text) => {
    const el = document.getElementById(id);
    if (el) el.innerText = text;
  };

  setElText("kpi-events", GLOBAL_STATS.total_events.toLocaleString("vi-VN"));
  setElText("kpi-products", GLOBAL_STATS.total_products.toLocaleString("vi-VN"));
  setElText(
    "kpi-revenue",
    "$" + GLOBAL_STATS.total_revenue.toLocaleString("en-US", { maximumFractionDigits: 0 })
  );
  setElText("kpi-removal", GLOBAL_STATS.avg_removal_rate + "%");
  setElText("kpi-conversion", GLOBAL_STATS.avg_conversion_rate + "%");

  // 2.2 Funnel Steps
  const funnelContainer = document.getElementById("funnel-steps-container");
  if (funnelContainer && GLOBAL_STATS.funnel) {
    funnelContainer.innerHTML = GLOBAL_STATS.funnel
      .map((step, idx) => {
        const isLast = idx === GLOBAL_STATS.funnel.length - 1;
        const dropoffHtml =
          !isLast && idx < GLOBAL_STATS.funnel.length - 1
            ? `<div style="font-size: 11px; color: #ef4444; margin-top: 4px;">
                 <i class="fas fa-arrow-trend-down"></i> Tỷ lệ chuyển bước: ${Math.round(
                   (GLOBAL_STATS.funnel[idx + 1].count / step.count) * 100
                 )}%
               </div>`
            : "";

        return `
          <div class="funnel-step" style="border-left: 4px solid ${step.color}; background: #ffffff; padding: 14px 18px; border-radius: var(--radius-sm); margin-bottom: 10px; border: 1px solid var(--border-color); box-shadow: var(--shadow-subtle);">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="background: ${step.color}20; color: ${step.color}; width: 34px; height: 34px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 15px;">
                  <i class="fas ${step.icon}"></i>
                </span>
                <div>
                  <b style="font-size: 14px; color: #0f172a;">${step.stage}</b>
                  <div style="font-size: 12px; color: var(--text-dim);">${step.count.toLocaleString("vi-VN")} lượt ghi nhận</div>
                </div>
              </div>
              <div style="text-align: right;">
                <b style="font-size: 18px; color: ${step.color};">${step.pct}%</b>
                <div style="font-size: 11px; color: var(--text-dim);">so với lượt xem gốc</div>
              </div>
            </div>
            <div style="background: #e2e8f0; height: 7px; border-radius: 4px; overflow: hidden;">
              <div style="background: ${step.color}; width: ${step.pct}%; height: 100%; border-radius: 4px; transition: width 1s ease;"></div>
            </div>
            ${dropoffHtml}
          </div>
        `;
      })
      .join("");
  }

  // 2.3 Pareto Chart
  const paretoCanvas = document.getElementById("paretoChart");
  if (paretoCanvas && typeof Chart !== "undefined" && typeof PERSONA_DATA !== "undefined") {
    // Sort personas by total_revenue desc
    const sortedPersonas = [...PERSONA_DATA].sort((a, b) => b.total_revenue - a.total_revenue);
    let cumulative = 0;
    const cumPercentages = sortedPersonas.map((p) => {
      cumulative += p.pct_revenue;
      return Math.min(100, Math.round(cumulative * 10) / 10);
    });

    initializedCharts.pareto = new Chart(paretoCanvas, {
      type: "bar",
      data: {
        labels: sortedPersonas.map((p) => p.short_name),
        datasets: [
          {
            type: "line",
            label: "Tỷ lệ tích lũy (% Doanh thu)",
            data: cumPercentages,
            borderColor: "#ef4444",
            backgroundColor: "#ef4444",
            borderWidth: 2,
            pointRadius: 4,
            yAxisID: "y1",
          },
          {
            type: "bar",
            label: "% Doanh thu thực tế",
            data: sortedPersonas.map((p) => p.pct_revenue),
            backgroundColor: sortedPersonas.map((p) => p.color),
            borderRadius: 6,
            yAxisID: "y",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "top", labels: { boxWidth: 14, font: { size: 12 } } },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${ctx.raw}%`,
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            title: { display: true, text: "Đóng góp Doanh số (%)" },
            grid: { color: "rgba(0,0,0,0.05)" },
          },
          y1: {
            beginAtZero: true,
            max: 100,
            position: "right",
            title: { display: true, text: "Tích lũy (%)" },
            grid: { drawOnChartArea: false },
          },
        },
      },
    });
  }

  // 2.4 Monthly Trend Chart
  const monthlyCanvas = document.getElementById("monthlyTrendChart");
  if (monthlyCanvas && typeof Chart !== "undefined" && typeof MONTHLY_TRENDS !== "undefined") {
    initializedCharts.monthly = new Chart(monthlyCanvas, {
      type: "line",
      data: {
        labels: MONTHLY_TRENDS.map((m) => m.label || m.month),
        datasets: [
          {
            type: "bar",
            label: "Doanh thu ($ USD)",
            data: MONTHLY_TRENDS.map((m) => m.total_revenue || m.revenue || 0),
            backgroundColor: "rgba(37, 99, 235, 0.75)",
            borderRadius: 6,
            yAxisID: "y",
          },
          {
            type: "line",
            label: "Tỷ lệ Hủy giỏ (%)",
            data: MONTHLY_TRENDS.map((m) => m.avg_removal_rate || m.removal_rate || 70),
            borderColor: "#ef4444",
            backgroundColor: "#ef4444",
            borderWidth: 2.5,
            yAxisID: "y1",
          },
          {
            type: "line",
            label: "Tỷ lệ Chốt đơn (%)",
            data: MONTHLY_TRENDS.map((m) => m.avg_conv_rate || m.conv_rate || 14),
            borderColor: "#10b981",
            backgroundColor: "#10b981",
            borderWidth: 2.5,
            yAxisID: "y1",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "top", labels: { boxWidth: 14 } },
        },
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: "Doanh số ($ USD)" },
            grid: { color: "rgba(0,0,0,0.05)" },
          },
          y1: {
            beginAtZero: true,
            max: 100,
            position: "right",
            title: { display: true, text: "Tỷ lệ phần trăm (%)" },
            grid: { drawOnChartArea: false },
          },
        },
      },
    });
  }
}

// ------------------------------------------------------------------------------
// 3. PERSONAS DEEP DIVE
// ------------------------------------------------------------------------------
let currentSelectedPersonaId = "bestsellers";
let personaRadarChartInstance = null;

function initPersonas() {
  if (typeof PERSONA_DATA === "undefined") return;

  const selectorContainer = document.getElementById("persona-cards-selector");
  if (!selectorContainer) return;

  selectorContainer.innerHTML = PERSONA_DATA.map((p) => {
    const isAct = p.id === currentSelectedPersonaId;
    return `
      <div class="persona-card ${isAct ? "active" : ""}" data-pid="${p.id}" style="border-top: 4px solid ${p.color};">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
          <span style="background: ${p.color}15; color: ${p.color}; width: 32px; height: 32px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; font-size: 14px;">
            <i class="fas ${p.icon}"></i>
          </span>
          <span class="tag-badge" style="background: ${p.color}15; color: ${p.color}; font-size: 10.5px;">${p.badge}</span>
        </div>
        <b style="font-size: 13px; color: #0f172a; display: block; margin-bottom: 4px;">${p.short_name}</b>
        <div style="font-size: 11px; color: var(--text-dim);">
          ${p.count.toLocaleString("vi-VN")} SP (${p.pct_products}%) • ${p.pct_revenue}% Doanh số
        </div>
      </div>
    `;
  }).join("");

  // Attach card click handlers
  selectorContainer.querySelectorAll(".persona-card").forEach((card) => {
    card.addEventListener("click", () => {
      const pid = card.getAttribute("data-pid");
      selectPersona(pid);
    });
  });

  // Select initial persona
  selectPersona(currentSelectedPersonaId);
}

function selectPersona(pid) {
  currentSelectedPersonaId = pid;
  const persona = PERSONA_DATA.find((p) => p.id === pid);
  if (!persona) return;

  // Highlight card
  document.querySelectorAll(".persona-card").forEach((c) => {
    if (c.getAttribute("data-pid") === pid) c.classList.add("active");
    else c.classList.remove("active");
  });

  // Title
  const titleEl = document.getElementById("detail-persona-title");
  if (titleEl) {
    titleEl.innerHTML = `
      <i class="fas ${persona.icon}" style="color: ${persona.color}; margin-right: 8px;"></i>
      ${persona.full_name}
      <span class="tag-badge" style="background: ${persona.color}20; color: ${persona.color}; margin-left: 10px; font-size: 12px;">${persona.badge}</span>
    `;
  }

  // Quick stats
  document.getElementById("p-kpi-count").innerText = `${persona.count.toLocaleString("vi-VN")} SP (${persona.pct_products}%)`;
  document.getElementById("p-kpi-rev").innerText = `$${persona.total_revenue.toLocaleString("en-US", { maximumFractionDigits: 0 })} (${persona.pct_revenue}%)`;
  document.getElementById("p-kpi-views").innerText = Math.round(persona.avg_view).toLocaleString("vi-VN") + " views";
  document.getElementById("p-kpi-removal").innerText = `${persona.avg_removal_pct}%`;
  document.getElementById("p-kpi-conv").innerText = `${persona.avg_conv_pct}%`;
  document.getElementById("p-kpi-price").innerText = `$${persona.avg_price}`;

  // Qualitative Analysis
  document.getElementById("p-plain-explanation").innerText = persona.plain_explanation || "";
  document.getElementById("p-current-state").innerText = persona.current_state || "";
  document.getElementById("p-root-cause").innerText = persona.root_cause || "";
  document.getElementById("p-future-prediction").innerText = persona.future_prediction || "";

  // Actions list
  const actionsListEl = document.getElementById("p-actions-list");
  if (actionsListEl && persona.actions) {
    actionsListEl.innerHTML = persona.actions
      .map(
        (act) => `
        <li style="display: flex; align-items: flex-start; gap: 8px; margin-bottom: 8px; font-size: 13.5px; color: var(--text-main);">
          <i class="fas fa-check-circle" style="color: #059669; margin-top: 3px;"></i>
          <span>${act}</span>
        </li>
      `
      )
      .join("");
  }

  // Radar Chart
  updatePersonaRadar(persona);

  // Top products in this cluster
  updatePersonaTopProducts(persona);

  // Case study cards
  updatePersonaCaseStudies(persona.id);
}

function updatePersonaRadar(persona) {
  const radarCanvas = document.getElementById("personaRadarChart");
  if (!radarCanvas || typeof Chart === "undefined") return;

  // Normalized values 0-100 scale for intuitive comparison
  const normalize = (val, max) => Math.min(100, Math.round((val / max) * 100));

  const radarValues = [
    normalize(persona.avg_view, 500),
    normalize(persona.avg_cart, 300),
    normalize(persona.avg_price, 40),
    Math.min(100, persona.avg_conv_pct * 1.4),
    Math.min(100, persona.avg_removal_pct),
  ];

  const labels = [
    "Lượt xem (Views)",
    "Thêm giỏ (Carts)",
    "Đơn giá ($)",
    "Tỷ lệ chốt đơn (%)",
    "Tỷ lệ hủy giỏ (%)",
  ];

  if (personaRadarChartInstance) {
    personaRadarChartInstance.data.datasets[0].label = persona.short_name;
    personaRadarChartInstance.data.datasets[0].data = radarValues;
    personaRadarChartInstance.data.datasets[0].borderColor = persona.color;
    personaRadarChartInstance.data.datasets[0].backgroundColor = persona.color + "33";
    personaRadarChartInstance.update();
  } else {
    personaRadarChartInstance = new Chart(radarCanvas, {
      type: "radar",
      data: {
        labels: labels,
        datasets: [
          {
            label: persona.short_name,
            data: radarValues,
            borderColor: persona.color,
            backgroundColor: persona.color + "33",
            pointBackgroundColor: persona.color,
            pointBorderColor: "#fff",
            pointHoverBackgroundColor: "#fff",
            pointHoverBorderColor: persona.color,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            angleLines: { color: "rgba(0,0,0,0.08)" },
            grid: { color: "rgba(0,0,0,0.08)" },
            pointLabels: { font: { size: 11 } },
            ticks: { display: false, max: 100, min: 0 },
          },
        },
        plugins: {
          legend: { position: "top", labels: { boxWidth: 12 } },
        },
      },
    });
    initializedCharts.radar = personaRadarChartInstance;
  }
}

function updatePersonaTopProducts(persona) {
  const tbody = document.getElementById("p-top-products-body");
  if (!tbody || typeof TOP_PRODUCTS === "undefined") return;

  const clusterProducts = TOP_PRODUCTS.filter((p) => {
    return p.persona && p.persona.toLowerCase().includes(persona.short_name.toLowerCase());
  }).slice(0, 6);

  if (clusterProducts.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-dim); padding: 12px;">Đang tải danh sách mẫu...</td></tr>`;
    return;
  }

  tbody.innerHTML = clusterProducts
    .map(
      (p) => `
      <tr>
        <td><code>#${p.id}</code></td>
        <td><b>${p.brand || "Khác"}</b></td>
        <td>$${p.price.toFixed(2)}</td>
        <td>${p.views.toLocaleString()}</td>
        <td>${p.purchases.toLocaleString()}</td>
        <td><b style="color: #2563eb;">$${p.revenue.toLocaleString()}</b></td>
        <td><span style="color: ${p.removal_pct > 70 ? "#ef4444" : "#059669"};">${p.removal_pct}%</span></td>
        <td><span style="color: #059669;">${p.conv_pct}%</span></td>
      </tr>
    `
    )
    .join("");
}

function updatePersonaCaseStudies(pid) {
  const container = document.getElementById("p-case-studies-list");
  if (!container || typeof REPRESENTATIVE_PRODUCTS === "undefined") return;

  const cases = REPRESENTATIVE_PRODUCTS[pid] || [];
  if (cases.length === 0) {
    container.innerHTML = `<p style="color: var(--text-dim); padding: 12px;">Không có case study riêng cho nhóm này.</p>`;
    return;
  }

  container.innerHTML = cases
    .map(
      (c) => `
      <div class="case-study-card" style="background: #ffffff; border: 1px solid var(--border-color); border-radius: var(--radius-md); padding: 16px; box-shadow: var(--shadow-subtle); margin-bottom: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
          <div>
            <span class="tag-badge" style="background: #eff6ff; color: #2563eb; margin-bottom: 6px;">
              <i class="fas ${c.icon || "fa-tag"}"></i> ${c.badge || "Mặt hàng tiêu biểu"}
            </span>
            <h4 style="font-size: 15px; color: #0f172a; margin: 4px 0 2px;">${c.product_name}</h4>
            <small style="color: var(--text-dim);">Mã SP: <code>#${c.id}</code> • Thương hiệu: <b>${c.brand}</b> • Phân loại: ${c.category}</small>
          </div>
          <div style="text-align: right;">
            <div style="font-size: 18px; font-weight: 800; color: #059669;">$${c.price}</div>
            <small style="color: var(--text-dim);">Đơn giá</small>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; background: #f8fafc; padding: 10px; border-radius: var(--radius-sm); text-align: center; margin-bottom: 12px; border: 1px solid var(--border-color);">
          <div><small style="color: var(--text-dim); font-size: 10px;">Lượt xem</small><br><b style="font-size: 13px;">${c.views.toLocaleString()}</b></div>
          <div><small style="color: var(--text-dim); font-size: 10px;">Thêm giỏ</small><br><b style="font-size: 13px;">${c.carts.toLocaleString()}</b></div>
          <div><small style="color: var(--text-dim); font-size: 10px;">Đã mua</small><br><b style="font-size: 13px; color: #059669;">${c.purchases.toLocaleString()}</b></div>
          <div><small style="color: var(--text-dim); font-size: 10px;">Doanh số</small><br><b style="font-size: 13px; color: #2563eb;">$${c.revenue.toLocaleString()}</b></div>
          <div><small style="color: var(--text-dim); font-size: 10px;">Hủy giỏ</small><br><b style="font-size: 13px; color: #ef4444;">${c.removal_rate}</b></div>
          <div><small style="color: var(--text-dim); font-size: 10px;">Tỷ lệ chốt</small><br><b style="font-size: 13px; color: #059669;">${c.conv_rate}</b></div>
        </div>

        <div style="background: rgba(37, 99, 235, 0.05); border-left: 4px solid #2563eb; padding: 10px 14px; border-radius: 4px; font-size: 13px; color: #1e293b; line-height: 1.5;">
          <b><i class="fas fa-brain" style="color: #2563eb;"></i> Giải mã Tâm lý & Dấu chân Hành vi:</b>
          <p style="margin: 4px 0 0; color: #334155;">${c.behavior_insight}</p>
        </div>
      </div>
    `
    )
    .join("");
}

// ------------------------------------------------------------------------------
// 4. PRODUCT EXPLORER
// ------------------------------------------------------------------------------
let explorerCurrentPage = 1;
const explorerPageSize = 20;

function initExplorer() {
  if (typeof TOP_PRODUCTS === "undefined") return;

  const searchInput = document.getElementById("prod-search-input");
  const personaSelect = document.getElementById("prod-persona-select");
  const sortSelect = document.getElementById("prod-sort-select");

  const handleFilterChange = () => {
    explorerCurrentPage = 1;
    renderExplorerTable();
  };

  if (searchInput) searchInput.addEventListener("input", handleFilterChange);
  if (personaSelect) personaSelect.addEventListener("change", handleFilterChange);
  if (sortSelect) sortSelect.addEventListener("change", handleFilterChange);

  renderExplorerTable();
}

function getFilteredProducts() {
  if (typeof TOP_PRODUCTS === "undefined") return [];

  const query = (document.getElementById("prod-search-input")?.value || "").toLowerCase().trim();
  const personaFilter = document.getElementById("prod-persona-select")?.value || "all";
  const sortKey = document.getElementById("prod-sort-select")?.value || "rev_desc";

  let list = TOP_PRODUCTS.filter((p) => {
    const matchSearch =
      !query ||
      String(p.id).includes(query) ||
      (p.brand && p.brand.toLowerCase().includes(query));

    const matchPersona =
      personaFilter === "all" ||
      (p.persona && p.persona.toLowerCase().includes(personaFilter.toLowerCase()));

    return matchSearch && matchPersona;
  });

  // Sorting
  list.sort((a, b) => {
    switch (sortKey) {
      case "rev_desc":
        return b.revenue - a.revenue;
      case "view_desc":
        return b.views - a.views;
      case "rem_desc":
        return b.removal_pct - a.removal_pct;
      case "conv_desc":
        return b.conv_pct - a.conv_pct;
      case "price_desc":
        return b.price - a.price;
      default:
        return 0;
    }
  });

  return list;
}

function renderExplorerTable() {
  const list = getFilteredProducts();
  const tbody = document.getElementById("products-table-body");
  const countEl = document.getElementById("filtered-count");
  const pagEl = document.getElementById("table-pagination");
  if (!tbody) return;

  const total = list.length;
  const totalPages = Math.max(1, Math.ceil(total / explorerPageSize));
  explorerCurrentPage = Math.min(explorerCurrentPage, totalPages);

  const startIdx = (explorerCurrentPage - 1) * explorerPageSize;
  const pagedList = list.slice(startIdx, startIdx + explorerPageSize);

  if (countEl) {
    countEl.innerText = `Tìm thấy ${total.toLocaleString("vi-VN")} sản phẩm`;
  }

  if (pagedList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: var(--text-dim); padding: 24px;">Không tìm thấy sản phẩm nào phù hợp với bộ lọc.</td></tr>`;
  } else {
    tbody.innerHTML = pagedList
      .map(
        (p) => `
        <tr>
          <td><code>#${p.id}</code></td>
          <td><b>${p.brand || "Khác"}</b></td>
          <td><span class="tag-badge" style="font-size: 11px;">${p.persona || "Chưa gán"}</span></td>
          <td>$${p.price.toFixed(2)}</td>
          <td>${p.views.toLocaleString()}</td>
          <td>${p.purchases.toLocaleString()}</td>
          <td><b style="color: #2563eb;">$${p.revenue.toLocaleString()}</b></td>
          <td><span style="color: ${p.removal_pct > 75 ? "#ef4444" : "#059669"}; font-weight: 600;">${p.removal_pct}%</span></td>
          <td><span style="color: #059669; font-weight: 600;">${p.conv_pct}%</span></td>
        </tr>
      `
      )
      .join("");
  }

  // Render pagination
  if (pagEl) {
    pagEl.innerHTML = `
      <div style="font-size: 13px; color: var(--text-dim);">
        Trang <b>${explorerCurrentPage}</b> / <b>${totalPages}</b>
      </div>
      <div style="display: flex; gap: 8px;">
        <button class="btn-primary" style="padding: 6px 14px; font-size: 12px;" ${
          explorerCurrentPage <= 1 ? "disabled style='opacity: 0.5; cursor: not-allowed;'" : ""
        } id="btn-prev-page">
          <i class="fas fa-chevron-left"></i> Trang trước
        </button>
        <button class="btn-primary" style="padding: 6px 14px; font-size: 12px;" ${
          explorerCurrentPage >= totalPages ? "disabled style='opacity: 0.5; cursor: not-allowed;'" : ""
        } id="btn-next-page">
          Trang sau <i class="fas fa-chevron-right"></i>
        </button>
      </div>
    `;

    document.getElementById("btn-prev-page")?.addEventListener("click", () => {
      if (explorerCurrentPage > 1) {
        explorerCurrentPage--;
        renderExplorerTable();
      }
    });

    document.getElementById("btn-next-page")?.addEventListener("click", () => {
      if (explorerCurrentPage < totalPages) {
        explorerCurrentPage++;
        renderExplorerTable();
      }
    });
  }
}

// ------------------------------------------------------------------------------
// 5. BENCHMARK
// ------------------------------------------------------------------------------
function initBenchmark() {
  if (typeof BENCHMARK_DATA === "undefined") return;

  const container = document.getElementById("benchmark-cards-container");
  if (container) {
    container.innerHTML = BENCHMARK_DATA.map(
      (b) => `
      <div class="benchmark-card" style="background: #ffffff; border: 1px solid var(--border-color); border-top: 4px solid ${b.color}; border-radius: var(--radius-md); padding: 18px; box-shadow: var(--shadow-subtle);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
          <h4 style="font-size: 15px; color: #0f172a; margin: 0;">${b.model}</h4>
          <span class="tag-badge" style="background: ${b.color}15; color: ${b.color}; font-size: 11px;">${b.status}</span>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 14px; background: #f8fafc; padding: 10px; border-radius: var(--radius-sm); text-align: center; border: 1px solid var(--border-color);">
          <div>
            <small style="color: var(--text-dim); font-size: 10.5px;">Silhouette (Cao tốt)</small><br>
            <b style="font-size: 16px; color: ${b.silhouette > 0.4 ? "#059669" : "#e11d48"};">${b.silhouette}</b>
          </div>
          <div>
            <small style="color: var(--text-dim); font-size: 10.5px;">Davies-Bouldin (Thấp tốt)</small><br>
            <b style="font-size: 16px; color: ${b.dbi < 1.0 ? "#059669" : "#d97706"};">${b.dbi}</b>
          </div>
          <div>
            <small style="color: var(--text-dim); font-size: 10.5px;">Calinski-Harabasz</small><br>
            <b style="font-size: 13px; color: #2563eb;">${b.chi.toLocaleString()}</b>
          </div>
          <div>
            <small style="color: var(--text-dim); font-size: 10.5px;">Thời gian chạy</small><br>
            <b style="font-size: 13px; color: #7c3aed;">${b.runtime_s}s</b>
          </div>
        </div>

        <div style="font-size: 12.5px; margin-bottom: 8px; color: #059669;">
          <b><i class="fas fa-thumbs-up"></i> Ưu điểm:</b> ${b.pros}
        </div>
        <div style="font-size: 12.5px; color: #e11d48;">
          <b><i class="fas fa-triangle-exclamation"></i> Nhược điểm:</b> ${b.cons}
        </div>
      </div>
    `
    ).join("");
  }

  // Chart
  const benchCanvas = document.getElementById("benchmarkChart");
  if (benchCanvas && typeof Chart !== "undefined") {
    initializedCharts.benchmark = new Chart(benchCanvas, {
      type: "bar",
      data: {
        labels: BENCHMARK_DATA.map((b) => b.model.split(" ")[0]),
        datasets: [
          {
            label: "Silhouette Score (Càng cao càng tốt)",
            data: BENCHMARK_DATA.map((b) => b.silhouette),
            backgroundColor: "#2563eb",
            borderRadius: 6,
          },
          {
            label: "Davies-Bouldin Index (Càng thấp càng tốt)",
            data: BENCHMARK_DATA.map((b) => b.dbi),
            backgroundColor: "#f59e0b",
            borderRadius: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: "top" },
        },
        scales: {
          y: { beginAtZero: true, grid: { color: "rgba(0,0,0,0.05)" } },
        },
      },
    });
  }
}

// ------------------------------------------------------------------------------
// 6. SIMULATOR
// ------------------------------------------------------------------------------
function initSimulator() {
  const priceInput = document.getElementById("sim-price");
  const viewsInput = document.getElementById("sim-views");
  const cartsInput = document.getElementById("sim-carts");
  const removalInput = document.getElementById("sim-removal");

  const chkCoupon = document.getElementById("sim-chk-coupon");
  const chkShip = document.getElementById("sim-chk-ship");
  const chkBundle = document.getElementById("sim-chk-bundle");

  const updateSim = () => {
    const price = parseFloat(priceInput?.value || 4.5);
    const views = parseInt(viewsInput?.value || 80);
    const carts = parseInt(cartsInput?.value || 50);
    const removalRate = parseInt(removalInput?.value || 85);

    document.getElementById("val-sim-price").innerText = `$${price.toFixed(2)}`;
    document.getElementById("val-sim-views").innerText = views.toLocaleString();
    document.getElementById("val-sim-carts").innerText = carts.toLocaleString();
    document.getElementById("val-sim-removal").innerText = `${removalRate}%`;

    // Calculations
    const baseOrders = Math.round(carts * (1 - removalRate / 100));
    const baseRevenue = baseOrders * price;
    const leakageRevenue = Math.round(carts * (removalRate / 100)) * price;

    // Triggers effect
    let removalDiscount = 0;
    let couponDiscount = 0;
    if (chkCoupon?.checked) {
      removalDiscount += 16; // Cuts drop-off by 16%
      couponDiscount = 0.06; // 6% voucher
    }
    if (chkShip?.checked) {
      removalDiscount += 14; // Cuts drop-off by 14%
    }
    if (chkBundle?.checked) {
      removalDiscount += 8; // Cuts drop-off by 8%
    }

    const effectiveRemoval = Math.max(25, removalRate - removalDiscount);
    const effectivePrice = price * (1 - couponDiscount) + (chkBundle?.checked ? 1.0 : 0.0);
    const newOrders = Math.round(carts * (1 - effectiveRemoval / 100));
    const newRevenue = newOrders * effectivePrice;
    const gainedRevenue = Math.max(0, newRevenue - baseRevenue);

    // Persona heuristic classifier
    let personaTag = "";
    let recText = "";
    if (price < 2.5 && newOrders > 15) {
      personaTag = `<span class="tag-badge" style="background: #eff6ff; color: #2563eb;">2. Tiện tay Mua kèm (Impulse Add-on)</span>`;
      recText = "Sản phẩm giá cực mềm, độ nhạy giá thấp. Khách hàng thêm giỏ với tâm lý 'tiện tay mua luôn'. Cực kỳ thích hợp làm quà tặng kèm khi giỏ đạt mức tối thiểu.";
    } else if (effectiveRemoval >= 75) {
      personaTag = `<span class="tag-badge" style="background: #fef3c7; color: #d97706;">3. Nghẽn Thanh toán (High Hesitation)</span>`;
      recText = "Khách hàng rất quan tâm (Cart cao) nhưng bỏ giỏ do rào cản phí giao hàng hoặc phân vân với sản phẩm đối thủ. Bật Exit-Intent Voucher hoặc Freeship giúp phục hồi ngay tức thì!";
    } else if (price >= 25) {
      personaTag = `<span class="tag-badge" style="background: #f3e8ff; color: #7c3aed;">4. Giá trị cao - Kén khách (Premium Gems)</span>`;
      recText = "Dòng hàng cao cấp mang lại biên lợi nhuận ròng lớn. Khách xem xét kỹ trước khi chi tiền. Cần bổ sung đánh giá video thực tế, cam kết hàng chính hãng để tăng độ tin cậy.";
    } else if (newOrders >= 20 || newRevenue >= 300) {
      personaTag = `<span class="tag-badge" style="background: #dcfce7; color: #15803d;">1. Bán chạy Chủ lực (Star Bestseller)</span>`;
      recText = "Sản phẩm gánh doanh số sàn! Cần đảm bảo chuỗi cung ứng không bị đứt gãy và ưu tiên vị trí hiển thị đầu trang kết quả tìm kiếm.";
    } else {
      personaTag = `<span class="tag-badge" style="background: #fee2e2; color: #b91c1c;">5. Tồn kho Ngủ đông (Sleeping Stock)</span>`;
      recText = "Lượng tương tác và chuyển đổi còn thấp. Cân nhắc xả kho combo giảm giá hoặc đổi ảnh đại diện sản phẩm để thu hút lượt click mới.";
    }

    document.getElementById("sim-out-persona").innerHTML = personaTag;
    document.getElementById("sim-out-base-rev").innerText = `$${Math.round(baseRevenue).toLocaleString()}`;
    document.getElementById("sim-out-leakage").innerText = `-$${Math.round(leakageRevenue).toLocaleString()}`;
    document.getElementById("sim-out-new-rev").innerText = `$${Math.round(newRevenue).toLocaleString()}`;
    document.getElementById("sim-out-gain").innerText = `+$${Math.round(gainedRevenue).toLocaleString()}`;
    document.getElementById("sim-rec-text").innerText = recText;
  };

  [priceInput, viewsInput, cartsInput, removalInput, chkCoupon, chkShip, chkBundle].forEach((el) => {
    if (el) el.addEventListener("input", updateSim);
  });

  updateSim();
}

// ------------------------------------------------------------------------------
// 7. LIVE DUCKDB SQL CONSOLE
// ------------------------------------------------------------------------------
function initSqlConsole() {
  const presetsContainer = document.getElementById("sql-presets-container");
  const editor = document.getElementById("sql-query-editor");
  const runBtn = document.getElementById("run-sql-btn");
  const statusBar = document.getElementById("sql-status-bar");
  const tableHead = document.getElementById("sql-table-head");
  const tableBody = document.getElementById("sql-table-body");

  if (!editor || !runBtn) return;

  // Render presets
  if (presetsContainer && typeof SQL_PRESETS !== "undefined") {
    presetsContainer.innerHTML = SQL_PRESETS.map(
      (preset, idx) => `
      <button class="sql-preset-btn" data-idx="${idx}" style="background: #ffffff; border: 1px solid var(--border-color); padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; margin: 4px; transition: var(--transition);">
        <span style="display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: ${preset.color || "#2563eb"};"></span>
        ${preset.name}
      </button>
    `
    ).join("");

    presetsContainer.querySelectorAll(".sql-preset-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.getAttribute("data-idx"));
        const p = SQL_PRESETS[idx];
        if (p) {
          editor.value = p.query;
          statusBar.innerText = `Đã nạp mẫu: ${p.name}. Nhấn 'Thực thi Truy vấn' để chạy.`;
          statusBar.style.color = "var(--text-muted)";
        }
      });
    });

    // Load first preset by default
    if (SQL_PRESETS.length > 0) {
      editor.value = SQL_PRESETS[0].query;
    }
  }

  // Execute query handler
  runBtn.addEventListener("click", async () => {
    const query = editor.value.trim();
    if (!query) {
      statusBar.innerText = "Lỗi: Câu truy vấn rỗng!";
      statusBar.style.color = "#ef4444";
      return;
    }

    statusBar.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Đang thực thi truy vấn trên DuckDB In-Memory...`;
    statusBar.style.color = "#2563eb";
    runBtn.disabled = true;

    try {
      const response = await fetch("/api/sql", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: json.stringify ? JSON.stringify({ query: query }) : JSON.stringify({ query }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      // Render Head
      tableHead.innerHTML = `<tr>${result.columns.map((c) => `<th>${c}</th>`).join("")}</tr>`;

      // Render Body
      if (!result.data || result.data.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="${result.columns.length}" style="text-align: center; color: var(--text-dim); padding: 18px;">Truy vấn thành công nhưng không có kết quả trả về.</td></tr>`;
      } else {
        tableBody.innerHTML = result.data
          .map(
            (row) =>
              `<tr>${result.columns
                .map((col) => {
                  const val = row[col];
                  const displayVal = val === null || val === undefined ? "<i>null</i>" : val;
                  return `<td>${displayVal}</td>`;
                })
                .join("")}</tr>`
          )
          .join("");
      }

      statusBar.innerHTML = `<span style="color: #059669;"><i class="fas fa-circle-check"></i> Hoàn thành trong <b>${result.execution_time_ms} ms</b> • Trả về <b>${result.total_rows.toLocaleString()}</b> bản ghi</span>`;
    } catch (err) {
      statusBar.innerHTML = `<span style="color: #ef4444;"><i class="fas fa-triangle-exclamation"></i> Lỗi DuckDB: ${err.message}</span>`;
      tableHead.innerHTML = "";
      tableBody.innerHTML = `<tr><td style="color: #ef4444; padding: 16px;">${err.message}</td></tr>`;
    } finally {
      runBtn.disabled = false;
    }
  });
}

