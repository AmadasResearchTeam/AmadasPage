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

  // Nếu segment cuối có dấu "." thì mới coi là file (vd index.html)
  const last = parts[parts.length - 1] || "";
  const isFile = last.includes(".");

  if (isFile) parts.pop(); // chỉ pop khi đúng là file
  if (parts.length === 0) return "";
  return Array(parts.length).fill("..").join("/");
}


function rewriteHeaderLinks(root) {
  const header = document.querySelector(".site-header");
  if (!header) return;

  const toRoot = (rel) => (root ? `${root}/${rel}` : rel);

  const homeLink = header.querySelector('a.nav-link[href="index.html"], a.nav-link[href="./index.html"]');
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

document.addEventListener("DOMContentLoaded", async () => {
  const root = getRootPrefix();
  const p = (rel) => (root ? `${root}/${rel}` : rel);

  try {
    await loadPartial("#header-container", p("layout/partials/header.html"));

    rewriteHeaderLinks(root);

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
    await loadPartial("#core-container", p("layout/contact/coremember.html"))

    if (document.querySelector("#member-container"))
    await loadPartial("#member-container", p("layout/contact/member.html"))

   if (document.querySelector("#jounal-container"))
    await loadPartial("#jounal-container", p("layout/publications/jounal.html"))

   if (document.querySelector("#Introjounal-container"))
    await loadPartial("#Introjounal-container", p("layout/publications/IntroPub.html"))

    if (document.querySelector("#conference-container"))
    await loadPartial("#conference-container", p("layout/publications/conference.html"))

    // if (document.querySelector("#project-container"))
    // await loadPartial("#project-container", p("layout/publications/project.html"))
  } catch (err) {
    console.error(err);
  }
});
