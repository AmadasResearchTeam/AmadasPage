// js/include.js
async function loadPartial(selector, url) {
  const el = document.querySelector(selector);
  if (!el) return;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to load ${url}: ${res.status}`);

  el.innerHTML = await res.text();
}

function getRootPrefix() {
  let path = window.location.pathname.split("?")[0].split("#")[0];
  const parts = path.split("/").filter(Boolean);

  const last = parts[parts.length - 1] || "";
  const isFile = last.includes(".");

  if (isFile) parts.pop();
  if (parts.length === 0) return "";
  return Array(parts.length).fill("..").join("/");
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
    if (file.endsWith(".html")) m.set(file.slice(0, -5), friendly); // bỏ .html
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

  // fallback home
  if (currentCanon === "/") {
    const home = links.find((a) => {
      const href = a.getAttribute("href") || "";
      return href.includes("index");
    });
    if (home) home.classList.add("active");
  }
}

/* ====================== LOAD PARTIALS ====================== */

document.addEventListener("DOMContentLoaded", async () => {
  const root = getRootPrefix();
  const p = (rel) => (root ? `${root}/${rel}` : rel);

  try {
    await loadPartial("#header-container", p("layout/partials/header.html"));

    rewriteHeaderLinks(root);

    // quan trọng: header load xong + rewrite xong rồi mới set active
    setActiveNavLink();

    if (document.querySelector("#hero-container"))
      await loadPartial("#hero-container", p("layout/partials/hero.html"));

    if (document.querySelector("#project-container"))
      await loadPartial("#project-container", p("layout/partials/project.html"));

    if (document.querySelector("#blog-container"))
      await loadPartial("#blog-container", p("layout/partials/blog.html"));

    if (document.querySelector("#people-container"))
      await loadPartial("#people-container", p("layout/partials/people.html"));

    if (document.querySelector("#footer-container"))
      await loadPartial("#footer-container", p("layout/partials/footer.html"));

    if (document.querySelector("#advisor-container"))
      await loadPartial("#advisor-container", p("layout/contact/advisor.html"));

    if (document.querySelector("#core-container"))
      await loadPartial("#core-container", p("layout/contact/coremember.html"));

    if (document.querySelector("#member-container"))
      await loadPartial("#member-container", p("layout/contact/member.html"));

    if (document.querySelector("#jounal-container"))
      await loadPartial("#jounal-container", p("layout/publications/jounal.html"));

    if (document.querySelector("#Introjounal-container"))
      await loadPartial("#Introjounal-container", p("layout/publications/IntroPub.html"));

    if (document.querySelector("#conference-container"))
      await loadPartial("#conference-container", p("layout/publications/conference.html"));
  } catch (err) {
    console.error(err);
  }
});
