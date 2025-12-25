// js/include.js
(() => {
  "use strict";

  // tránh chạy 2 lần nếu lỡ include trùng
  if (window.__AMADAS_SPA_READY__) return;
  window.__AMADAS_SPA_READY__ = true;

  /* ====================== BASIC LOAD PARTIAL ====================== */
  async function loadPartial(selector, url) {
    const el = document.querySelector(selector);
    if (!el) return;

    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);
    el.innerHTML = await res.text();
  }

  function getRootPrefixFromPath(pathname) {
    let path = (pathname || "/").split("?")[0].split("#")[0];
    const parts = path.split("/").filter(Boolean);

    const last = parts[parts.length - 1] || "";
    const isFile = last.includes(".");

    if (isFile) parts.pop();
    if (parts.length === 0) return "";
    return Array(parts.length).fill("..").join("/");
  }

  function getRootPrefix() {
    return getRootPrefixFromPath(window.location.pathname);
  }

  function withRoot(root, rel) {
    return root ? `${root}/${rel}` : rel;
  }

  function rewriteHeaderLinks(root) {
    const header = document.querySelector(".site-header");
    if (!header) return;

    const toRoot = (rel) => (root ? `${root}/${rel}` : rel);

    const homeLink = header.querySelector(
      'a.nav-link[href="index.html"], a.nav-link[href="./index.html"]'
    );
    if (homeLink) homeLink.setAttribute("href", toRoot("index.html"));

    const brand = header.querySelector("a.brand");
    if (brand) brand.setAttribute("href", toRoot("index.html#home"));

    const brandImg = header.querySelector("img.brand-logo");
    if (brandImg) {
      const src = brandImg.getAttribute("src") || "";
      if (!src.startsWith("http") && !src.startsWith("/") && !src.startsWith(root)) {
        brandImg.setAttribute("src", toRoot(src));
      }
    }

    header.querySelectorAll('a[href^="layout/"]').forEach((a) => {
      const href = a.getAttribute("href");
      if (!href) return;
      if (href.startsWith("http")) return;
      a.setAttribute("href", toRoot(href));
    });

    header.querySelectorAll('a[href^="#"]').forEach((a) => {
      const hash = a.getAttribute("href");
      if (!hash) return;
      a.setAttribute("href", toRoot(`index.html${hash}`));
    });
  }

  /* ====================== ACTIVE NAV (GIỮ NGUYÊN Ý TƯỞNG CỦA BẠN) ====================== */
  const ROUTE_RULES = [
    { friendly: "/team", file: "/layout/partials/contact.html" },
    { friendly: "/contact", file: "/layout/partials/contactus.html" },
    { friendly: "/publications", file: "/layout/publications/publication.html" },
  ];

  function norm(p) {
    p = (p || "").split("?")[0].split("#")[0];
    if (!p.startsWith("/")) p = "/" + p;
    if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
    if (p === "/index.html" || p === "/index") return "/";
    if (p.endsWith("/index.html")) p = p.slice(0, -11);
    if (p.endsWith("/index")) p = p.slice(0, -6);
    if (p === "") p = "/";
    return p;
  }

  const CANON_MAP = (() => {
    const m = new Map();
    m.set("/index.html", "/");
    m.set("/index", "/");
    m.set("/", "/");

    for (const r of ROUTE_RULES) {
      const friendly = norm(r.friendly);
      const file = norm(r.file);

      m.set(friendly, friendly);
      m.set(file, friendly);
      if (file.endsWith(".html")) m.set(file.slice(0, -5), friendly);
      m.set(file + "/", friendly);
      if (file.endsWith(".html")) m.set(file.slice(0, -5) + "/", friendly);
    }
    return m;
  })();

  function toCanonicalPath(pathname) {
    const p = norm(pathname);
    return CANON_MAP.get(p) || p;
  }

  function setActiveNavLink() {
    const header = document.querySelector(".site-header");
    if (!header) return;

    const links = Array.from(header.querySelectorAll("a.nav-link"));
    if (links.length === 0) return;

    links.forEach((a) => a.classList.remove("active"));

    const currentCanon = toCanonicalPath(window.location.pathname);

    for (const a of links) {
      const href = a.getAttribute("href");
      if (!href) continue;
      if (href.startsWith("#")) continue;

      const targetUrl = new URL(href, window.location.href);
      const targetCanon = toCanonicalPath(targetUrl.pathname);

      if (targetCanon === currentCanon) {
        a.classList.add("active");
        return;
      }
    }

    if (currentCanon === "/") {
      const home = links.find((a) => (a.getAttribute("href") || "").includes("index"));
      if (home) home.classList.add("active");
    }
  }

  /* ====================== LOAD CONTAINERS (NHƯ CŨ) ====================== */
  async function loadAllContainers(root) {
    const p = (rel) => withRoot(root, rel);

    // header/footer
    if (document.querySelector("#header-container") && !document.querySelector("#header-container").innerHTML.trim())
      await loadPartial("#header-container", p("layout/partials/header.html"));

    rewriteHeaderLinks(root);
    setActiveNavLink();

    if (document.querySelector("#footer-container") && !document.querySelector("#footer-container").innerHTML.trim())
      await loadPartial("#footer-container", p("layout/partials/footer.html"));

    // home sections
    if (document.querySelector("#hero-container") && !document.querySelector("#hero-container").innerHTML.trim())
      await loadPartial("#hero-container", p("layout/partials/hero.html"));

    if (document.querySelector("#project-container") && !document.querySelector("#project-container").innerHTML.trim())
      await loadPartial("#project-container", p("layout/partials/project.html"));

    if (document.querySelector("#blog-container") && !document.querySelector("#blog-container").innerHTML.trim())
      await loadPartial("#blog-container", p("layout/partials/blog.html"));

    if (document.querySelector("#people-container") && !document.querySelector("#people-container").innerHTML.trim())
      await loadPartial("#people-container", p("layout/partials/people.html"));

    // team/contact
    if (document.querySelector("#advisor-container") && !document.querySelector("#advisor-container").innerHTML.trim())
      await loadPartial("#advisor-container", p("layout/contact/advisor.html"));

    if (document.querySelector("#core-container") && !document.querySelector("#core-container").innerHTML.trim())
      await loadPartial("#core-container", p("layout/contact/coremember.html"));

    if (document.querySelector("#member-container") && !document.querySelector("#member-container").innerHTML.trim())
      await loadPartial("#member-container", p("layout/contact/member.html"));

    // publications
    if (document.querySelector("#jounal-container") && !document.querySelector("#jounal-container").innerHTML.trim())
      await loadPartial("#jounal-container", p("layout/publications/jounal.html"));

    if (document.querySelector("#Introjounal-container") && !document.querySelector("#Introjounal-container").innerHTML.trim())
      await loadPartial("#Introjounal-container", p("layout/publications/IntroPub.html"));

    if (document.querySelector("#conference-container") && !document.querySelector("#conference-container").innerHTML.trim())
      await loadPartial("#conference-container", p("layout/publications/conference.html"));
  }

  /* ====================== SPA: SWAP MAIN (NO RELOAD) ====================== */
  const STATIC_CSS = new Set(
    Array.from(document.querySelectorAll('link[rel="stylesheet"][href]'))
      .map((l) => {
        try { return new URL(l.getAttribute("href"), window.location.href).toString(); }
        catch { return null; }
      })
      .filter(Boolean)
  );

  function clearDynamicAssets() {
    document.querySelectorAll('link[data-spa="1"]').forEach((n) => n.remove());
  }

  function applyCssFromDoc(doc, baseUrl) {
    clearDynamicAssets();

    const links = Array.from(doc.querySelectorAll('link[rel="stylesheet"][href]'));
    for (const l of links) {
      const href = l.getAttribute("href");
      if (!href) continue;

      let abs;
      try { abs = new URL(href, baseUrl).toString(); } catch { continue; }

      if (STATIC_CSS.has(abs)) continue;
      if (document.querySelector(`link[rel="stylesheet"][href="${abs}"]`)) continue;

      const nl = document.createElement("link");
      nl.rel = "stylesheet";
      nl.href = abs;
      nl.setAttribute("data-spa", "1");
      document.head.appendChild(nl);
    }
  }

  function rewriteRelativeUrls(container, baseUrl) {
    const isSpecial = (v) =>
      !v ||
      v.startsWith("#") ||
      v.startsWith("mailto:") ||
      v.startsWith("tel:") ||
      v.startsWith("javascript:") ||
      v.startsWith("data:") ||
      v.startsWith("http://") ||
      v.startsWith("https://") ||
      v.startsWith("/");

    container.querySelectorAll("[src]").forEach((el) => {
      const v = el.getAttribute("src") || "";
      if (isSpecial(v)) return;
      try { el.setAttribute("src", new URL(v, baseUrl).toString()); } catch {}
    });

    container.querySelectorAll("[href]").forEach((el) => {
      const v = el.getAttribute("href") || "";
      if (isSpecial(v)) return;
      try { el.setAttribute("href", new URL(v, baseUrl).toString()); } catch {}
    });
  }

  function extractMain(doc) {
    return doc.querySelector("main.page") || doc.querySelector("main") || doc.body;
  }

  let navigating = false;

  async function spaNavigateTo(targetHref, { fromPop = false } = {}) {
    if (navigating) return;
    navigating = true;

    try {
      const targetUrl = new URL(targetHref, window.location.href);

      if (targetUrl.origin !== window.location.origin) {
        window.location.href = targetUrl.href;
        return;
      }

      const fetchUrl = new URL(targetUrl.href);
      const hash = fetchUrl.hash;
      fetchUrl.hash = "";

      const res = await fetch(fetchUrl.href, { cache: "no-store" });
      if (!res.ok) {
        window.location.href = targetUrl.href;
        return;
      }

      const htmlText = await res.text();
      const doc = new DOMParser().parseFromString(htmlText, "text/html");

      if (doc.title) document.title = doc.title;

      applyCssFromDoc(doc, fetchUrl.href);

      const incomingMain = extractMain(doc);
      const currentMain = document.querySelector("main.page") || document.querySelector("main");

      if (currentMain && incomingMain) {
        currentMain.innerHTML = incomingMain.innerHTML;
        if (!currentMain.classList.contains("page")) currentMain.classList.add("page");
        rewriteRelativeUrls(currentMain, fetchUrl.href);
      }

      if (!fromPop) {
        history.pushState({ spa: 1 }, "", targetUrl.pathname + targetUrl.search + (hash || ""));
      }

      const newRoot = getRootPrefixFromPath(targetUrl.pathname);
      rewriteHeaderLinks(newRoot);
      setActiveNavLink();

      await loadAllContainers(newRoot);

      if (hash && hash.length > 1) {
        const id = hash.slice(1);
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
        else window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (e) {
      console.error(e);
      try { window.location.href = targetHref; } catch {}
    } finally {
      navigating = false;
    }
  }

  function installSpaHeaderClick() {
    document.addEventListener(
      "click",
      (e) => {
        const a = e.target.closest("a");
        if (!a) return;

        if (!a.closest(".site-header")) return;

        if (a.target === "_blank") return;
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

        const href = a.getAttribute("href") || "";
        if (!href) return;

        if (
          href.startsWith("mailto:") ||
          href.startsWith("tel:") ||
          href.startsWith("javascript:") ||
          /^https?:\/\//i.test(href)
        ) return;

        if (href.startsWith("#")) return;

        e.preventDefault();
        spaNavigateTo(href).catch(console.error);
      },
      true
    );

    window.addEventListener("popstate", () => {
      spaNavigateTo(window.location.href, { fromPop: true }).catch(console.error);
    });
  }

  /* ====================== INIT ====================== */
  document.addEventListener("DOMContentLoaded", async () => {
    try {
      const root = getRootPrefix();
      await loadAllContainers(root);
      installSpaHeaderClick();

      // debug nhanh: mở console sẽ thấy
      console.log("[AMADAS SPA] ready:", window.location.pathname);
    } catch (err) {
      console.error(err);
    }
  });
})();
