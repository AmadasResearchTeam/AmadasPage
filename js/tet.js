// js/tet.js
(() => {
  "use strict";

  if (window.__AMADAS_TET__) return;
  window.__AMADAS_TET__ = true;

  const prefersReducedMotion =
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

  const isPhone = () => window.matchMedia("(max-width: 768px)").matches;

  const ASSETS = {
    lanternLeft: "img/holiday/Latern_left.png",
    lanternRight: "img/holiday/Latern_right.png",
  };

  const IDS = {
    left: "tet-lantern-left",
    right: "tet-lantern-right",
    confetti: "confetti-canvas",
  };

  let mounted = false;

  function removeIfExists(id) {
    const el = document.getElementById(id);
    if (el) el.remove();
  }

  function createFixedImage({ id, src, className, wobble = false }) {
    removeIfExists(id);

    const wrap = document.createElement("div");
    wrap.id = id;
    wrap.className = `tet-fixed ${className}`;

    const inner = document.createElement("div");
    inner.className = `tet-inner` + (wobble ? " tet-wobble" : "");

    const img = document.createElement("img");
    img.src = src;
    img.alt = id;
    img.loading = "eager";
    img.decoding = "async";
    img.draggable = false;

    inner.appendChild(img);
    wrap.appendChild(inner);
    document.body.appendChild(wrap);
  }

  // ---------- Decor ----------
  function initDecor() {
    if (!mounted) return;

    if (isPhone()) {
      removeIfExists(IDS.left);
      removeIfExists(IDS.right);
      return;
    }

    createFixedImage({
      id: IDS.left,
      src: ASSETS.lanternLeft,
      className: "tet-lantern-left",
      wobble: !prefersReducedMotion,
    });

    createFixedImage({
      id: IDS.right,
      src: ASSETS.lanternRight,
      className: "tet-lantern-right",
      wobble: !prefersReducedMotion,
    });
  }

  // ---------- Confetti (optional) ----------
  const confetti = {
    canvas: null,
    ctx: null,
    particles: [],
    rafId: null,
    w: 0,
    h: 0,
    dpr: 1,
  };

  function stopConfetti() {
    if (confetti.rafId) cancelAnimationFrame(confetti.rafId);
    confetti.rafId = null;
    confetti.particles = [];
    confetti.ctx = null;
    confetti.canvas = null;
    removeIfExists(IDS.confetti);
  }

  function mount() {
    if (mounted) return;
    mounted = true;

    document.body.classList.add("page-home");

    initDecor();
    // bật hoa giấy
    // ensureConfettiCanvas();
  }

  function unmount() {
    if (!mounted) return;
    mounted = false;

    document.body.classList.remove("page-home");

    removeIfExists(IDS.left);
    removeIfExists(IDS.right);
    stopConfetti();
  }

  function isHomeRoute() {
    const p = (window.location.pathname || "/").replace(/\/+$/, "");
    return p === "" || p === "/" || p.endsWith("/index.html") || p.endsWith("/index");
  }

  function syncToRoute() {
    if (isHomeRoute()) mount();
    else unmount();
  }

  // --- Bắt route change trong SPA: patch pushState/replaceState + popstate ---
  function installLocationChangeHook() {
    const fire = () => window.dispatchEvent(new Event("amadas:routechange"));

    const _push = history.pushState;
    history.pushState = function (...args) {
      const ret = _push.apply(this, args);
      fire();
      return ret;
    };

    const _replace = history.replaceState;
    history.replaceState = function (...args) {
      const ret = _replace.apply(this, args);
      fire();
      return ret;
    };

    window.addEventListener("popstate", fire);
  }

  installLocationChangeHook();

  window.addEventListener("amadas:routechange", syncToRoute);
  window.addEventListener("resize", () => {
    if (!mounted) return;
    initDecor();
  });

  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", syncToRoute);
  } else {
    syncToRoute();
  }
})();
