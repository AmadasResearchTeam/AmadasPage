// js/visitors.js
(() => {
  const totalEl = document.getElementById("total-visits");
  const onlineEl = document.getElementById("online-now");

  // ===== 1) TOTAL VISITS (local per browser) =====
  const KEY_TOTAL = "amadas_total_visits";
  let total = parseInt(localStorage.getItem(KEY_TOTAL) || "0", 10);
  total += 1;
  localStorage.setItem(KEY_TOTAL, String(total));
  if (totalEl) totalEl.textContent = total.toLocaleString("en-US");

  // ===== 2) ONLINE NOW (tabs in same browser) =====
  // Mỗi tab là 1 "client"
  const tabId = crypto?.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());
  const bc = ("BroadcastChannel" in window) ? new BroadcastChannel("amadas_online") : null;

  const alive = new Map(); // tabId -> lastSeen(ms)
  const TTL = 3500;        // tab coi như offline nếu không thấy ping trong TTL
  const PING_EVERY = 1200; // mỗi tab ping định kỳ

  const now = () => Date.now();

  function pruneAndRender() {
    const t = now();
    for (const [id, ts] of alive.entries()) {
      if (t - ts > TTL) alive.delete(id);
    }
    // luôn tính cả chính tab này
    alive.set(tabId, t);

    if (onlineEl) onlineEl.textContent = String(alive.size);
  }

  function ping() {
    pruneAndRender();
    if (bc) bc.postMessage({ type: "PING", tabId, ts: now() });
  }

  if (bc) {
    bc.onmessage = (e) => {
      const msg = e.data || {};
      if (msg.type === "PING" && msg.tabId) {
        alive.set(msg.tabId, msg.ts || now());
        pruneAndRender();
      }
      if (msg.type === "HELLO") {
        // trả lời để tab mới biết mình đang online
        bc.postMessage({ type: "PING", tabId, ts: now() });
      }
    };

    // báo "HELLO" khi tab mới mở
    bc.postMessage({ type: "HELLO", tabId, ts: now() });
  }

  // chạy định kỳ
  ping();
  const timer = setInterval(ping, PING_EVERY);

  window.addEventListener("beforeunload", () => {
    clearInterval(timer);
    // không cần gửi "BYE" vì TTL sẽ tự loại
  });

  // ===== Year auto =====
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
