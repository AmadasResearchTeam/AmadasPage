document.addEventListener("DOMContentLoaded", () => {
  const allList = document.getElementById("pubAllList");
  const groupsRoot = document.getElementById("pubYearGroups");

  const btn = document.getElementById("yearFilterBtn");
  const menu = document.getElementById("yearFilterMenu");
  const label = document.getElementById("yearFilterLabel");

  if (!allList || !groupsRoot || !btn || !menu || !label) return;

  const items = Array.from(allList.querySelectorAll(".pub-item"));

  const map = new Map(); 
  for (const li of items) {
    const y = (li.dataset.year || "").trim();
    if (!y) continue;
    if (!map.has(y)) map.set(y, []);
    map.get(y).push(li);
  }

  const years = Array.from(map.keys())
    .map(x => parseInt(x, 10))
    .filter(n => Number.isFinite(n))
    .sort((a,b) => b - a)
    .map(n => String(n));

  function renderGroups() {
    groupsRoot.innerHTML = "";
    for (const y of years) {
      const wrap = document.createElement("div");
      wrap.className = "pub-year-group";
      wrap.dataset.year = y;

      const head = document.createElement("div");
      head.className = "pub-year-heading";

      const h = document.createElement("h4");
      h.textContent = y;

      const count = document.createElement("div");
      count.className = "pub-year-count";
      count.textContent = `${map.get(y).length} item(s)`;

      head.appendChild(h);
      head.appendChild(count);

      const ol = document.createElement("ol");
      ol.className = "pub-list";

      for (const li of map.get(y)) {
        ol.appendChild(li.cloneNode(true));
      }

      wrap.appendChild(head);
      wrap.appendChild(ol);
      groupsRoot.appendChild(wrap);
    }

    allList.style.display = "none";
  }

  renderGroups();

  function buildMenu() {
    menu.innerHTML = "";

    const makeOpt = (value, text) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "pub-filter-option";
      b.setAttribute("role", "option");
      b.dataset.value = value;
      b.textContent = text;
      b.setAttribute("aria-selected", value === "all" ? "true" : "false");
      return b;
    };

    menu.appendChild(makeOpt("all", "All"));
    for (const y of years) menu.appendChild(makeOpt(y, y));
  }

  buildMenu();

  // 6) Filter function
  function applyFilter(yearValue) {
    const groups = Array.from(groupsRoot.querySelectorAll(".pub-year-group"));
    for (const g of groups) {
      const show = (yearValue === "all") || (g.dataset.year === yearValue);
      g.style.display = show ? "" : "none";
    }

    label.textContent = (yearValue === "all") ? "All" : yearValue;

    // aria-selected update
    const opts = Array.from(menu.querySelectorAll(".pub-filter-option"));
    for (const o of opts) {
      o.setAttribute("aria-selected", o.dataset.value === yearValue ? "true" : "false");
    }
  }

  // 7) Dropdown open/close
  function openMenu() {
    menu.classList.add("is-open");
    btn.setAttribute("aria-expanded", "true");
  }
  function closeMenu() {
    menu.classList.remove("is-open");
    btn.setAttribute("aria-expanded", "false");
  }
  function toggleMenu() {
    const isOpen = menu.classList.contains("is-open");
    isOpen ? closeMenu() : openMenu();
  }

  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleMenu();
  });

  menu.addEventListener("click", (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    if (!t.classList.contains("pub-filter-option")) return;

    const v = t.dataset.value || "all";
    applyFilter(v);
    closeMenu();
  });

  // click outside
  document.addEventListener("click", () => closeMenu());

  // ESC to close
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeMenu();
  });

  // default
  applyFilter("all");
});