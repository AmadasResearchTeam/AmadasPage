// js/filterpaper.js
(() => {
  "use strict";

  if (window.__AMADAS_FILTERPAPER__) return;
  window.__AMADAS_FILTERPAPER__ = true;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function ensureStyleOnce() {
    if (document.getElementById("amadas-pub-year-style")) return;

    const st = document.createElement("style");
    st.id = "amadas-pub-year-style";
    st.textContent = `
      /* Top filter pill like screenshot */
      .pub-filter-top{display:flex; align-items:center; gap:10px; margin:6px 0 18px;}
      .pub-year-pill{
        display:inline-flex; align-items:center; gap:10px;
        padding:10px 14px;
        border-radius:16px;
        border:1px solid rgba(255,255,255,.16);
        background: rgba(255,255,255,.06);
        backdrop-filter: blur(6px);
      }
      .pub-year-pill .lbl{font-weight:600; opacity:.9}
      .pub-year-pill select{
        appearance:none; -webkit-appearance:none; -moz-appearance:none;
        border:0; outline:0;
        background: transparent;
        color: inherit;
        font-size: 1rem;
        padding-right: 26px;
        cursor: pointer;
      }
      .pub-year-pill .caret{
        margin-left:-18px;
        pointer-events:none;
        opacity:.8;
      }

      /* Year section bar like screenshot */
      .pub-year-sections{display:flex; flex-direction:column; gap:18px;}
      .pub-year-section{display:flex; flex-direction:column; gap:12px;}
      .pub-year-header{
        display:flex; align-items:center; justify-content:space-between;
        padding:3px 22px;
        border-radius:22px;
        border:1px solid rgba(255,255,255,.14);
        background: rgba(255,255,255,.05);
        backdrop-filter: blur(6px);
      }
      .pub-year-header .y{font-size:22px; font-weight:800; letter-spacing:.5px;}
      .pub-year-header .c{font-size:15px; opacity:.85;}
      .pub-year-header button.toggle{
        all: unset;
        cursor: pointer;
        width: 100%;
        display:flex; align-items:center; justify-content:space-between;
      }

      .pub-year-list{margin:0; padding-left: 0; list-style: none;}
      /* nếu pub-list của bạn đã có style, giữ nguyên — chỉ đảm bảo không bị lệch */
      .pub-year-list .pub-item{list-style: none;}

      .pub-collapsed .pub-year-list{display:none;}
    `;
    document.head.appendChild(st);
  }

  function normYear(y) {
    y = String(y || "").trim();
    return /^\d{4}$/.test(y) ? y : "";
  }

  function getYearsFromItems(items) {
    const years = Array.from(
      new Set(items.map(li => normYear(li.dataset.year)).filter(Boolean))
    ).sort((a, b) => Number(b) - Number(a));
    return years;
  }

  function getYearFromUrl(validYears) {
    try {
      const u = new URL(window.location.href);
      const y = u.searchParams.get("year");
      if (y && (y === "all" || validYears.includes(y))) return y;
    } catch {}
    return "all";
  }

  function setYearToUrl(year) {
    try {
      const u = new URL(window.location.href);
      if (!year || year === "all") u.searchParams.delete("year");
      else u.searchParams.set("year", year);
      history.replaceState(history.state, "", u.pathname + u.search + u.hash);
    } catch {}
  }

  function reindexWithinVisibleLists(container) {
    // đánh số theo thứ tự item đang hiển thị (khi lọc năm)
    const visibleItems = $$(".pub-year-section:not([hidden]) .pub-year-list .pub-item", container);
    let idx = 1;
    for (const li of visibleItems) {
      const s = $(".pub-index", li);
      if (s) s.textContent = idx++;
    }
  }

  function buildUI() {
    const list = document.getElementById("pubAllList");
    const host = document.getElementById("pubYearGroups");
    if (!list || !host) return false;

    // lấy item gốc (không clone)
    const srcItems = $$("li.pub-item[data-year]", list);
    if (srcItems.length === 0) return false;

    ensureStyleOnce();

    // years
    const years = getYearsFromItems(srcItems);

    // clear host + dựng layout
    host.innerHTML = "";
    host.dataset.built = "1";

    // Filter top
    const top = document.createElement("div");
    top.className = "pub-filter-top";

    const pill = document.createElement("div");
    pill.className = "pub-year-pill";
    pill.innerHTML = `
      <span class="lbl">Year:</span>
      <select id="pubYearSelect" aria-label="Publication year filter"></select>
      <span class="caret">▾</span>
    `;

    top.appendChild(pill);
    host.appendChild(top);

    const sel = pill.querySelector("#pubYearSelect");
    // options
    const optAll = document.createElement("option");
    optAll.value = "all";
    optAll.textContent = "All";
    sel.appendChild(optAll);

    for (const y of years) {
      const opt = document.createElement("option");
      opt.value = y;
      opt.textContent = y;
      sel.appendChild(opt);
    }

    // Sections container
    const sections = document.createElement("div");
    sections.className = "pub-year-sections";
    host.appendChild(sections);

    // group items by year and render
    const byYear = new Map();
    for (const it of srcItems) {
      const y = normYear(it.dataset.year);
      if (!y) continue;
      if (!byYear.has(y)) byYear.set(y, []);
      byYear.get(y).push(it);
    }

    for (const y of years) {
      const items = byYear.get(y) || [];
      const sec = document.createElement("section");
      sec.className = "pub-year-section";
      sec.dataset.year = y;

      const header = document.createElement("div");
      header.className = "pub-year-header";

      // header is clickable to collapse/expand
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "toggle";
      toggle.innerHTML = `
        <span class="y">${y}</span>
        <span class="c">${items.length} item(s)</span>
      `;
      header.appendChild(toggle);
      sec.appendChild(header);

      const ol = document.createElement("ol");
      ol.className = "pub-list pub-year-list";

      // clone DOM nodes so list gốc vẫn giữ được (để rebuild nếu cần)
      for (const it of items) {
        const clone = it.cloneNode(true);
        ol.appendChild(clone);
      }

      sec.appendChild(ol);
      sections.appendChild(sec);

      // collapse behavior
      toggle.addEventListener("click", () => {
        sec.classList.toggle("pub-collapsed");
      });
    }

    // Hide source list (keep for future rebuild)
    list.style.display = "none";
    list.setAttribute("aria-hidden", "true");

    // apply filter from URL
    const initial = getYearFromUrl(years);
    sel.value = initial;

    function applyFilter(year) {
      const y = year || "all";

      const secs = $$(".pub-year-section", sections);
      for (const s of secs) {
        const match = (y === "all") || (s.dataset.year === y);
        s.hidden = !match;
      }

      setYearToUrl(y);
      reindexWithinVisibleLists(host);
    }

    sel.addEventListener("change", () => applyFilter(sel.value));
    applyFilter(initial);

    return true;
  }

  function boot() {
    buildUI();
  }

  // Init normal load
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }

  window.addEventListener("amadas:spa:rendered", boot);

  const mo = new MutationObserver(() => {
    const host = document.getElementById("pubYearGroups");
    const list = document.getElementById("pubAllList");
    if (host && list && host.dataset.built !== "1") boot();
  });
  mo.observe(document.body, { childList: true, subtree: true });
})();
