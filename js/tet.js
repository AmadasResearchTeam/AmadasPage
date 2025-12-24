(() => {
  const prefersReducedMotion =
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

  const isPhone = () => window.matchMedia("(max-width: 768px)").matches;

  const ASSETS = {
    lanternLeft: "img/holiday/Latern_left.png",
    lanternRight: "img/holiday/Latern_right.png",
  };

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
    // createFixedImage({
    //   id: "tet-lion",
    //   src: ASSETS.lion,
    //   className: "tet-lion",
    //   wobble: false,
    // });

    if (isPhone()) {
      removeIfExists("tet-lantern-left");
      removeIfExists("tet-lantern-right");
      return;
    }

    createFixedImage({
      id: "tet-lantern-left",
      src: ASSETS.lanternLeft,
      className: "tet-lantern-left",
      wobble: !prefersReducedMotion,
    });

    createFixedImage({
      id: "tet-lantern-right",
      src: ASSETS.lanternRight,
      className: "tet-lantern-right",
      wobble: !prefersReducedMotion,
    });
  }

  // ---------- Confetti (all screens) ----------
  const confetti = {
    canvas: null,
    ctx: null,
    particles: [],
    rafId: null,
    w: 0,
    h: 0,
    dpr: 1,
  };

  function calcParticleCount() {
    const base = Math.floor(confetti.w / 20);
    return Math.min(220, Math.max(90, base));
  }

  function makeParticle() {
    const colors = ["#ff3b30", "#ffcc00", "#34c759", "#0a84ff", "#ff2d55", "#bf5af2"];
    return {
      x: Math.random() * confetti.w,
      y: -30 - Math.random() * confetti.h * 0.35,
      w: 6 + Math.random() * 6,
      h: 8 + Math.random() * 10,
      vx: (-0.5 + Math.random()) * 0.9,
      vy: 1.7 + Math.random() * 2.7,
      rot: Math.random() * Math.PI,
      vr: (-0.5 + Math.random()) * 0.14,
      color: colors[(Math.random() * colors.length) | 0],
      alpha: 0.85 + Math.random() * 0.15,
    };
  }

  function setParticleCount(target) {
    const cur = confetti.particles.length;
    if (cur === target) return;
    if (cur < target) {
      for (let i = 0; i < target - cur; i++) confetti.particles.push(makeParticle());
    } else {
      confetti.particles.length = target;
    }
  }

  function resizeConfetti(forceReset = false) {
    if (!confetti.canvas || !confetti.ctx) return;

    confetti.dpr = Math.max(1, Math.floor(window.devicePixelRatio || 1));
    confetti.w = window.innerWidth;
    confetti.h = window.innerHeight;

    confetti.canvas.width = confetti.w * confetti.dpr;
    confetti.canvas.height = confetti.h * confetti.dpr;
    confetti.canvas.style.width = confetti.w + "px";
    confetti.canvas.style.height = confetti.h + "px";
    confetti.ctx.setTransform(confetti.dpr, 0, 0, confetti.dpr, 0, 0);

    if (!forceReset) setParticleCount(calcParticleCount());
  }

  function startConfettiLoop() {
    const tick = () => {
      const ctx = confetti.ctx;
      if (!ctx) return;

      ctx.clearRect(0, 0, confetti.w, confetti.h);

      for (const p of confetti.particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;

        if (p.x < -30) p.x = confetti.w + 30;
        if (p.x > confetti.w + 30) p.x = -30;

        if (p.y > confetti.h + 30) {
          p.x = Math.random() * confetti.w;
          p.y = -30;
          p.vy = 1.7 + Math.random() * 2.7;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }

      confetti.rafId = requestAnimationFrame(tick);
    };

    confetti.rafId = requestAnimationFrame(tick);
  }

  function ensureConfettiCanvas() {
    if (prefersReducedMotion) return;
    if (confetti.canvas) return;

    removeIfExists("confetti-canvas");
    const canvas = document.createElement("canvas");
    canvas.id = "confetti-canvas";
    document.body.appendChild(canvas);

    confetti.canvas = canvas;
    confetti.ctx = canvas.getContext("2d");

    resizeConfetti(true);
    setParticleCount(calcParticleCount());
    startConfettiLoop();
  }

  function mount() {
    initDecor();     
    // ensureConfettiCanvas(); hoa giấy
  }

  const run = () => mount();

  if (document.readyState === "loading") window.addEventListener("DOMContentLoaded", run);
  else run();

  window.addEventListener("resize", () => {
    initDecor(); 
    if (!prefersReducedMotion) {
    //   ensureConfettiCanvas(); hoa giấy
      resizeConfetti(false);
    }
  });
})();