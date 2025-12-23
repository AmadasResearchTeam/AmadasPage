// js/app.js
(function initCursor() {
  function start() {
    if (!window.kursor) return;

    // tránh tạo cursor nhiều lần khi  include header ở nhiều trang
    if (window.__AMADAS_CURSOR__) return;
    window.__AMADAS_CURSOR__ = true;

    new window.kursor({
      type: 1,
      removeDefaultCursor: true,
      color: "#ffffff"
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
