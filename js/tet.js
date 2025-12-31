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
    popupImage: "img/holiday/happynewyear.png",
  };

  const IDS = {
    left: "tet-lantern-left",
    right: "tet-lantern-right",
    confetti: "confetti-canvas",

    popup: "tet-popup",
    popupClose: "tet-popup-close",
    popupBackdrop: "tet-popup-backdrop",
  };

  // Đổi version nếu muốn popup xuất hiện lại sau khi đã tắt
  const POPUP_VERSION = "v2"; // đổi v1 -> v2 để user đã tắt trước đó vẫn thấy lại
  const POPUP_STORAGE_KEY = `amadas_tet_popup_dismissed_${POPUP_VERSION}`;

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

  // ---------- Popup (image only) ----------
  function hasDismissedPopup() {
    try {
      return localStorage.getItem(POPUP_STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  }

  function setDismissedPopup() {
    try {
      localStorage.setItem(POPUP_STORAGE_KEY, "1");
    } catch {
      // ignore
    }
  }

  function closePopup() {
    const popup = document.getElementById(IDS.popup);
    if (!popup) return;

    popup.classList.add("is-hiding");
    setDismissedPopup();

    window.setTimeout(() => {
      removeIfExists(IDS.popup);
    }, 200);
  }

  function showPopup() {
    if (!mounted) return;
    if (hasDismissedPopup()) return;
    if (document.getElementById(IDS.popup)) return;

    const popup = document.createElement("div");
    popup.id = IDS.popup;
    popup.className = "tet-popup";
    popup.setAttribute("role", "dialog");
    popup.setAttribute("aria-modal", "true");
    popup.setAttribute("aria-label", "Happy New Year");

    // Backdrop (click ngoài để đóng)
    const backdrop = document.createElement("div");
    backdrop.id = IDS.popupBackdrop;
    backdrop.className = "tet-popup__backdrop";
    backdrop.addEventListener("click", closePopup);

    // Panel
    const panel = document.createElement("div");
    panel.className = "tet-popup__panel";

    // Image wrap
    const imgWrap = document.createElement("div");
    imgWrap.className = "tet-popup__imageWrap";

    // Close button: góc trái trên cùng của hình
    const closeBtn = document.createElement("button");
    closeBtn.id = IDS.popupClose;
    closeBtn.className = "tet-popup__close";
    closeBtn.type = "button";
    closeBtn.setAttribute("aria-label", "Đóng");
    closeBtn.innerHTML = "✕";
    closeBtn.addEventListener("click", closePopup);

    // Image
    const img = document.createElement("img");
    img.src = ASSETS.popupImage;
    img.alt = "Happy New Year";
    img.loading = "eager";
    img.decoding = "async";
    img.draggable = false;

    imgWrap.appendChild(img);

    // Assemble
    panel.appendChild(closeBtn);
    panel.appendChild(imgWrap);

    popup.appendChild(backdrop);
    popup.appendChild(panel);
    document.body.appendChild(popup);

    // ESC to close
    const onKeydown = (e) => {
      if (e.key === "Escape") closePopup();
    };
    window.addEventListener("keydown", onKeydown, { once: true });
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

    // Popup: bật sau 1 nhịp để tránh “giật”
    window.setTimeout(() => {
      showPopup();
    }, prefersReducedMotion ? 0 : 180);

    // bật hoa giấy nếu muốn
    // ensureConfettiCanvas();
  }

  function unmount() {
    if (!mounted) return;
    mounted = false;

    document.body.classList.remove("page-home");

    removeIfExists(IDS.left);
    removeIfExists(IDS.right);
    stopConfetti();

    // rời home thì đóng popup luôn (nếu đang mở)
    removeIfExists(IDS.popup);
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
