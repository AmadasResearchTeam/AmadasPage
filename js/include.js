// js/include.js
(() => {
  "use strict";

  // tránh chạy 2 lần nếu lỡ include trùng
  if (window.__AMADAS_SPA_READY__) return;
  window.__AMADAS_SPA_READY__ = true;

  const getCurrentMain = () =>
    document.querySelector("main.page") || document.querySelector("main");

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

  /* ====================== ACTIVE NAV ====================== */
  const ROUTE_RULES = [
    // friendly -> file thật để fetch
    { friendly: "/team", file: "layout/partials/contact.html" },
    { friendly: "/contact", file: "layout/partials/contactus.html" },
    { friendly: "/publications", file: "layout/publications/publication.html" },
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
      const file = norm("/" + String(r.file || "").replace(/^\//, ""));

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

  /* ====================== LOAD CONTAINERS ====================== */
  async function loadAllContainers(root) {
    const p = (rel) => withRoot(root, rel);

    const headerContainer = document.querySelector("#header-container");
    if (headerContainer && !headerContainer.innerHTML.trim()) {
      await loadPartial("#header-container", p("layout/partials/header.html"));
    }

    rewriteHeaderLinks(root);
    setActiveNavLink();

    const footerContainer = document.querySelector("#footer-container");
    if (footerContainer && !footerContainer.innerHTML.trim()) {
      await loadPartial("#footer-container", p("layout/partials/footer.html"));
    }

    // home sections
    const hero = document.querySelector("#hero-container");
    if (hero && !hero.innerHTML.trim())
      await loadPartial("#hero-container", p("layout/partials/hero.html"));

    const project = document.querySelector("#project-container");
    if (project && !project.innerHTML.trim())
      await loadPartial("#project-container", p("layout/partials/project.html"));

    const blog = document.querySelector("#blog-container");
    if (blog && !blog.innerHTML.trim())
      await loadPartial("#blog-container", p("layout/partials/blog.html"));

    const people = document.querySelector("#people-container");
    if (people && !people.innerHTML.trim())
      await loadPartial("#people-container", p("layout/partials/people.html"));

    // team/contact
    const advisor = document.querySelector("#advisor-container");
    if (advisor && !advisor.innerHTML.trim())
      await loadPartial("#advisor-container", p("layout/contact/advisor.html"));

    const core = document.querySelector("#core-container");
    if (core && !core.innerHTML.trim())
      await loadPartial("#core-container", p("layout/contact/coremember.html"));

    const member = document.querySelector("#member-container");
    if (member && !member.innerHTML.trim())
      await loadPartial("#member-container", p("layout/contact/member.html"));

    const colabf = document.querySelector("#colab-container");
    if (colabf && !colabf.innerHTML.trim())
      await loadPartial("#colab-container", p("layout/contact/Collaborators.html"));

    // publications
    const jounal = document.querySelector("#jounal-container");
    if (jounal && !jounal.innerHTML.trim())
      await loadPartial("#jounal-container", p("layout/publications/jounal.html"));

    const introJ = document.querySelector("#Introjounal-container");
    if (introJ && !introJ.innerHTML.trim())
      await loadPartial("#Introjounal-container", p("layout/publications/IntroPub.html"));

    const conf = document.querySelector("#conference-container");
    if (conf && !conf.innerHTML.trim())
      await loadPartial("#conference-container", p("layout/publications/conference.html"));
  }

  /* ====================== SPA: CSS + URL REWRITE ====================== */
  const STATIC_CSS = new Set(
    Array.from(document.querySelectorAll('link[rel="stylesheet"][href]'))
      .map((l) => {
        try {
          return new URL(l.getAttribute("href"), window.location.href).toString();
        } catch {
          return null;
        }
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
      try {
        abs = new URL(href, baseUrl).toString();
      } catch {
        continue;
      }

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
      try {
        el.setAttribute("src", new URL(v, baseUrl).toString());
      } catch {}
    });

    container.querySelectorAll("[href]").forEach((el) => {
      const v = el.getAttribute("href") || "";
      if (isSpecial(v)) return;
      try {
        el.setAttribute("href", new URL(v, baseUrl).toString());
      } catch {}
    });
  }

  function extractMain(doc) {
    return doc.querySelector("main.page") || doc.querySelector("main");
  }

  function removeNestedShellContainers(mainEl) {
    if (!mainEl) return;
    mainEl
      .querySelectorAll("#header-container, #footer-container")
      .forEach((n) => n.remove());
  }

  /* ====================== ROUTE RESOLVE (friendly -> file thật để fetch) ====================== */
  function resolveFetchUrl(targetUrl) {
    const targetPath = norm(targetUrl.pathname);

    const rule = ROUTE_RULES.find((r) => norm(r.friendly) === targetPath);
    if (!rule) return new URL(targetUrl.href);

    const fileRel = String(rule.file || "").replace(/^\//, "");
    const rootNow = getRootPrefixFromPath(window.location.pathname);

    const abs = new URL(withRoot(rootNow, fileRel), window.location.href);
    abs.search = targetUrl.search;
    abs.hash = ""; // fetch không cần hash
    return abs;
  }

  /* ====================== SPA RENDER EVENT ====================== */
  function emitSpaRendered(detail) {
    try {
      window.dispatchEvent(
        new CustomEvent("amadas:spa:rendered", { detail: detail || {} })
      );
    } catch {}
  }

  /* ====================== SCRIPT LOADER (ONCE) ====================== */
  function ensureScriptOnce(id, srcAbs, onload) {
    const existing = document.getElementById(id);
    if (existing) {
      if (typeof onload === "function") {
        if (existing.dataset.loaded === "1") onload();
        else existing.addEventListener("load", onload, { once: true });
      }
      return;
    }

    const s = document.createElement("script");
    s.id = id;
    s.src = srcAbs;
    s.defer = true;

    s.addEventListener(
      "load",
      () => {
        s.dataset.loaded = "1";
        if (typeof onload === "function") {
          try {
            onload();
          } catch {}
        }
      },
      { once: true }
    );

    document.head.appendChild(s);
  }

  /* ====================== FILTERPAPER.JS LOADER ====================== */
  function ensureFilterPaperJs() {
    const root = getRootPrefixFromPath(window.location.pathname);
    const srcAbs = new URL(withRoot(root, "js/filterpaper.js"), window.location.href).toString();
    ensureScriptOnce("amadas-filterpaper-js", srcAbs);
  }

  /* ====================== TET.JS LOADER ====================== */
  function ensureTetIfHome() {
    const canon = toCanonicalPath(window.location.pathname);
    if (canon !== "/") return;

    const root = getRootPrefixFromPath(window.location.pathname);
    const tetSrc = new URL(withRoot(root, "js/tet.js"), window.location.href).toString();

    ensureScriptOnce("spa-tet-js", tetSrc, () => {
      if (typeof window.tetInit === "function") {
        try {
          window.tetInit();
        } catch {}
      }
    });

    // nếu đã có sẵn tetInit (script cache nhanh) thì init luôn
    if (typeof window.tetInit === "function") {
      try {
        window.tetInit();
      } catch {}
    }
  }

  /* ====================== SPA: NAVIGATE ====================== */
  let navigating = false;

  async function spaNavigateTo(targetHref, { fromPop = false } = {}) {
    if (navigating) return;
    navigating = true;

    try {
      const targetUrl = new URL(targetHref, window.location.href);

      const currentMain = getCurrentMain();
      if (!currentMain) {
        window.location.href = targetUrl.href;
        return;
      }

      if (targetUrl.origin !== window.location.origin) {
        window.location.href = targetUrl.href;
        return;
      }

      const hash = targetUrl.hash || "";
      const fetchUrl = resolveFetchUrl(targetUrl);

      const res = await fetch(fetchUrl.href, { cache: "no-store" });
      if (!res.ok) {
        console.warn("[AMADAS SPA] fetch failed -> full reload", fetchUrl.href, res.status);
        window.location.href = targetUrl.href;
        return;
      }

      const htmlText = await res.text();
      const doc = new DOMParser().parseFromString(htmlText, "text/html");

      if (doc.title) document.title = doc.title;

      applyCssFromDoc(doc, fetchUrl.href);

      const incomingMain = extractMain(doc);
      if (!incomingMain) {
        console.warn("[AMADAS SPA] missing <main> in fetched doc -> full reload", fetchUrl.href);
        window.location.href = targetUrl.href;
        return;
      }

      currentMain.innerHTML = incomingMain.innerHTML;
      if (!currentMain.classList.contains("page")) currentMain.classList.add("page");
      rewriteRelativeUrls(currentMain, fetchUrl.href);
      removeNestedShellContainers(currentMain);

      if (!fromPop) {
        history.pushState(
          { spa: 1 },
          "",
          targetUrl.pathname + targetUrl.search + (hash || "")
        );
      }

      // IMPORTANT: dùng root theo file thật (fetchUrl) để load partials ổn định
      const newRoot = getRootPrefixFromPath(fetchUrl.pathname);
      rewriteHeaderLinks(newRoot);
      setActiveNavLink();

      await loadAllContainers(newRoot);

      // load filter + tet + notify render
      ensureFilterPaperJs();
      ensureTetIfHome();
      emitSpaRendered({ type: "navigate", path: targetUrl.pathname });

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
      try {
        window.location.href = targetHref;
      } catch {}
    } finally {
      navigating = false;
    }
  }

  /* ====================== CLICK INTERCEPT (GLOBAL) ====================== */
  function isProbablyAssetPath(pathname) {
    return /\.(pdf|zip|rar|7z|png|jpe?g|gif|webp|svg|mp4|mp3|wav|woff2?|ttf|otf)$/i.test(
      pathname || ""
    );
  }

  function shouldInterceptLink(a, e) {
    if (!a) return false;

    // opt-out
    if (a.hasAttribute("data-no-spa") || a.closest("[data-no-spa]")) return false;
    if (a.classList.contains("no-spa")) return false;

    // download / new tab
    if (a.hasAttribute("download")) return false;
    if (a.target && a.target !== "_self") return false;

    // modifiers
    if (
      e.defaultPrevented ||
      e.button !== 0 ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey
    )
      return false;

    const href = a.getAttribute("href") || "";
    if (!href) return false;

    // ignore anchors & special schemes
    if (href.startsWith("#")) return false;
    if (/^(mailto:|tel:|javascript:|data:)/i.test(href)) return false;

    // same-origin only
    let url;
    try {
      url = new URL(href, window.location.href);
    } catch {
      return false;
    }
    if (url.origin !== window.location.origin) return false;

    // avoid hijacking file assets
    if (isProbablyAssetPath(url.pathname)) return false;

    // cần có main để SPA thay nội dung
    if (!getCurrentMain()) return false;

    return true;
  }

  function installSpaClick() {
    document.addEventListener(
      "click",
      (e) => {
        const a = e.target.closest("a");
        if (!a) return;

        if (!shouldInterceptLink(a, e)) return;

        e.preventDefault();
        spaNavigateTo(a.getAttribute("href") || a.href).catch(console.error);
      },
      true
    );

    window.addEventListener("popstate", () => {
      if (!getCurrentMain()) return;
      spaNavigateTo(window.location.href, { fromPop: true }).catch(console.error);
    });
  }

  /* ====================== INIT ====================== */
  document.addEventListener("DOMContentLoaded", async () => {
    try {
      const root = getRootPrefix();
      await loadAllContainers(root);

      if (getCurrentMain()) installSpaClick();

      // load filter + tet + notify initial render
      ensureFilterPaperJs();
      ensureTetIfHome();
      emitSpaRendered({ type: "initial", path: window.location.pathname });

      console.log("[AMADAS SPA] ready:", window.location.pathname);
    } catch (err) {
      console.error(err);
    }
  });
})();
