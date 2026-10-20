// Shared behaviour: 3D hero parallax, card tilt, scroll reveal, SVG scenes.

const NS = "http://www.w3.org/2000/svg";
const el = (tag, attrs = {}, parent) => {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
};

// Multi-tier pagoda (Big Wild Goose Pagoda style) drawn into an <svg viewBox="0 0 400 500">
function buildPagoda(svg, { wall = "#7a2a22", roof = "#c8952b", glow = "#e8bd62", tiers = 7, crescent = false } = {}) {
  const g = el("g", {}, svg);
  let y = 470;
  let w = 190;
  el("rect", { x: 80, y: 470, width: 240, height: 18, fill: roof, opacity: .9 }, g);
  el("rect", { x: 60, y: 488, width: 280, height: 12, fill: wall }, g);
  for (let i = 0; i < tiers; i++) {
    const h = 44 - i * 2.5;
    const x = 200 - w / 2;
    el("rect", { x, y: y - h, width: w, height: h, fill: wall }, g);
    el("rect", { x: 200 - 9, y: y - h + 10, width: 18, height: h - 14, rx: 9, fill: "#1e1b24" }, g);
    el("rect", { x: 200 - 3, y: y - h + 16, width: 6, height: h - 20, rx: 3, fill: glow, opacity: .85 }, g);
    // eave
    el("polygon", { points: `${x - 16},${y - h} ${x + w + 16},${y - h} ${x + w},${y - h - 10} ${x},${y - h - 10}`, fill: roof }, g);
    y -= h + 8;
    w -= 17;
  }
  el("rect", { x: 197, y: y - 30, width: 6, height: 34, fill: roof }, g);
  if (crescent) {
    el("circle", { cx: 200, cy: y - 42, r: 15, fill: roof }, g);
    el("circle", { cx: 206, cy: y - 45, r: 13, fill: "#0c2f26" }, g);
  } else {
    el("circle", { cx: 200, cy: y - 36, r: 8, fill: glow }, g);
  }
}

// Row of terracotta-warrior silhouettes
function buildWarriors(svg, { cols = 9, rows = 3, fill = "#8a3b2c", hi = "#c4673f" } = {}) {
  for (let r = 0; r < rows; r++) {
    const s = 1 - r * 0.2;
    const baseY = 470 - r * 62;
    const g = el("g", { opacity: 1 - r * 0.18 }, svg);
    for (let c = 0; c < cols; c++) {
      const cx = 30 + c * (440 / (cols - 1)) + (r % 2 ? 22 : 0);
      const body = el("g", { transform: `translate(${cx} ${baseY}) scale(${s})` }, g);
      el("rect", { x: -17, y: -86, width: 34, height: 86, rx: 8, fill }, body);
      el("rect", { x: -20, y: -66, width: 40, height: 10, fill: hi, opacity: .55 }, body);
      el("rect", { x: -11, y: -118, width: 22, height: 28, rx: 9, fill }, body);
      el("circle", { cx: 0, cy: -124, r: 5, fill: hi }, body);
      el("rect", { x: -8, y: -106, width: 16, height: 3, fill: "#2a0f0c", opacity: .6 }, body);
    }
  }
}

function buildSkyline(svg, color) {
  const pts = [];
  for (let i = 0; i <= 12; i++) pts.push(`${i * 46},${400 - (Math.sin(i * 1.3) * 40 + 70)}`);
  el("polygon", { points: `0,500 ${pts.join(" ")} 552,500`, fill: color }, svg);
}

function mountScenes() {
  document.querySelectorAll("[data-scene]").forEach((svg) => {
    const k = svg.dataset.scene;
    if (k === "pagoda") buildPagoda(svg, { crescent: false });
    if (k === "pagoda-green") buildPagoda(svg, { wall: "#0f5a45", roof: "#e8bd62", glow: "#ffe3a1", crescent: true });
    if (k === "warriors") buildWarriors(svg);
    if (k === "ridge") buildSkyline(svg, svg.dataset.color || "#2b2631");
  });
}

// Mouse / touch driven 3D parallax on a .scene
function initScene(scene) {
  const stage = scene.querySelector(".stage");
  const layers = [...scene.querySelectorAll(".layer")];
  layers.forEach((l, i) => (l.style.transform = `translateZ(${(l.dataset.z ?? i * 40)}px)`));
  const move = (x, y) => {
    const r = scene.getBoundingClientRect();
    const px = ((x - r.left) / r.width - 0.5) * 2;
    const py = ((y - r.top) / r.height - 0.5) * 2;
    stage.style.transform = `rotateY(${px * 14}deg) rotateX(${-py * 10}deg)`;
  };
  const reset = () => (stage.style.transform = "rotateY(-8deg) rotateX(3deg)");
  reset();
  window.addEventListener("mousemove", (e) => move(e.clientX, e.clientY));
  window.addEventListener("touchmove", (e) => move(e.touches[0].clientX, e.touches[0].clientY), { passive: true });
  scene.addEventListener("mouseleave", reset);
  // gentle idle sway when pointer is absent
  let t = 0, active = false;
  window.addEventListener("mousemove", () => (active = true), { once: true });
  const idle = () => {
    t += 0.01;
    if (!active) stage.style.transform = `rotateY(${Math.sin(t) * 10}deg) rotateX(${Math.cos(t * 0.7) * 4}deg)`;
    requestAnimationFrame(idle);
  };
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches) idle();
}

function initTilt() {
  document.querySelectorAll(".tilt").forEach((c) => {
    c.addEventListener("mousemove", (e) => {
      const r = c.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      c.style.transform = `perspective(900px) rotateY(${x * 14}deg) rotateX(${-y * 14}deg) translateY(-6px)`;
    });
    c.addEventListener("mouseleave", () => (c.style.transform = ""));
  });
}

function initReveal() {
  const io = new IntersectionObserver(
    (es) => es.forEach((e) => e.isIntersecting && (e.target.classList.add("in"), io.unobserve(e.target))),
    { threshold: 0.12 }
  );
  document.querySelectorAll(".reveal").forEach((n) => io.observe(n));
}

// Position ring faces around a circle
function initRing() {
  document.querySelectorAll(".ring").forEach((ring) => {
    const faces = [...ring.querySelectorAll(".face")];
    const step = 360 / faces.length;
    const radius = Math.round(135 / Math.tan(Math.PI / faces.length)) + 30;
    faces.forEach((f, i) => (f.style.transform = `rotateY(${i * step}deg) translateZ(${radius}px)`));
  });
}

function initForms() {
  document.querySelectorAll("form.lead").forEach((f) =>
    f.addEventListener("submit", (e) => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(f));
      // Placeholder: wire to the real WhatsApp number / email / Meta lead form before launch.
      const to = f.dataset.wa;
      const msg = encodeURIComponent(
        `Hello Tang Xu Travel, I'd like a quote.\n` + Object.entries(d).map(([k, v]) => `${k}: ${v}`).join("\n")
      );
      if (to) window.open(`https://wa.me/${to}?text=${msg}`, "_blank");
      else location.href = `mailto:${f.dataset.mail}?subject=Journey enquiry&body=${msg}`;
    })
  );
}

document.addEventListener("DOMContentLoaded", () => {
  mountScenes();
  document.querySelectorAll(".scene").forEach(initScene);
  initTilt();
  initReveal();
  initRing();
  initForms();
});
