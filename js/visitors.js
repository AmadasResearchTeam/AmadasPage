// js/visitors.js
(function () {
  const totalEl = document.getElementById("visitor-total");
  const onlineEl = document.getElementById("visitor-online");

  if (!totalEl || !onlineEl) return;

  // stable session id per browser
  const KEY = "amadas_sid";
  let sid = localStorage.getItem(KEY);
  if (!sid) {
    sid = (crypto?.randomUUID?.() || ("sid_" + Math.random().toString(16).slice(2)));
    localStorage.setItem(KEY, sid);
  }

  async function ping() {
    try {
      const r = await fetch("/api/visitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sid }),
      });
      if (!r.ok) throw new Error("API failed");
      const data = await r.json();

      totalEl.textContent = typeof data.total === "number" ? data.total.toLocaleString() : "...";
      onlineEl.textContent = typeof data.online === "number" ? data.online.toLocaleString() : "...";
    } catch (e) {
      // fallback UI
      totalEl.textContent = "...";
      onlineEl.textContent = "...";
    }
  }

  // first ping + keep alive
  ping();
  setInterval(ping, 15_000); // update every 15s
})();
