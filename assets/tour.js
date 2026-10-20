// Xi'an 3D journey: click a landmark, the camera flies there, the traveller follows a route and "arrives".

const STOPS = [
  { id: "airport", x: 150, y: 110, icon: "✈", c: "#3b5a74", name: "Xianyang Airport", kicker: "Stop 0 · Arrival",
    text: "Your journey starts here. A driver with your name on a sign takes you straight to the city — no queues, no haggling.",
    my: "Halal snacks and prayer-room directions are shared before you land.", us: "Private transfer, jet-lag friendly check-in at your hotel.",
    days: 0, rmb: 0, usd: 0, addable: false, img: "airport.jpg" },
  { id: "muslim", x: 445, y: 305, icon: "🕌", c: "#1d7a5f", name: "Muslim Quarter & Great Mosque", kicker: "Stop 1 · Hui heritage",
    text: "A thousand years of Hui Muslim life: the Great Mosque of Xi'an (742 AD) with Chinese-style courtyards, and the lanes of halal street food behind it.",
    my: "Halal lamb skewers, roujiamo and biangbiang noodles. Prayer stop arranged at the mosque.", us: "A living slice of Silk Road history — Islam arrived here 1,300 years ago.",
    days: 1, rmb: 380, usd: 120, addable: true, img: "mosque.jpg" },
  { id: "bell", x: 510, y: 345, icon: "🔔", c: "#b8302a", name: "Bell & Drum Towers", kicker: "Stop 2 · The heart of the city",
    text: "Ming-dynasty towers at the exact centre of Xi'an. Climb for sunset, then listen as the drum answers the bell.",
    my: "Easy walk from the Muslim Quarter — a natural pairing in one day.", us: "Golden-hour photography with a local guide who knows the best angles.",
    days: 0.5, rmb: 120, usd: 45, addable: true, img: "bell.jpg" },
  { id: "wall", x: 510, y: 470, icon: "🧱", c: "#9b4a2c", name: "Ming City Wall", kicker: "Stop 3 · 14 km of stone",
    text: "The best-preserved city wall in China. Rent a bike and ride the whole ring on top, with the modern skyline on one side and old roofs on the other.",
    my: "Family-friendly, flat and shaded rest stops — good for children and elders.", us: "Active, scenic and surprisingly peaceful in the morning.",
    days: 0.5, rmb: 160, usd: 60, addable: true, img: "wall.jpg" },
  { id: "pagoda", x: 565, y: 595, icon: "🏯", c: "#c8952b", name: "Big Wild Goose Pagoda", kicker: "Stop 4 · Tang Dynasty, 652 AD",
    text: "Built to hold the scriptures Xuanzang carried back from India. Seven storeys of brick rising above fountains and gardens.",
    my: "Quiet gardens and a calm pace between prayer times.", us: "The Tang Dynasty at its most elegant — a Silk Road story in stone.",
    days: 0.5, rmb: 200, usd: 70, addable: true, img: "pagoda.jpg" },
  { id: "night", x: 660, y: 560, icon: "🌙", c: "#4a3a63", name: "Tang Paradise by Night", kicker: "Stop 5 · Lantern-lit Chang'an",
    text: "A recreated Tang garden glowing with lanterns, dance shows and a thousand lights on the water.",
    my: "A halal dinner can be arranged before the show.", us: "The evening you'll tell people about — dinner, show and the illuminated avenue.",
    days: 0.5, rmb: 420, usd: 150, addable: true, img: "night.jpg" },
  { id: "army", x: 880, y: 330, icon: "🏺", c: "#8a3b2c", name: "Terracotta Army", kicker: "Stop 6 · 210 BC, Lintong",
    text: "Eight thousand life-size soldiers, each with a different face, guarding the First Emperor. Go early with a private historian and see the pits before the crowds.",
    my: "Halal lunch arranged on the way; prayer break built into the day.", us: "Private historian, early-access timing and a long lunch with a view.",
    days: 1, rmb: 650, usd: 240, addable: true, img: "army.jpg" },
];

// Filled with real credits for downloaded photos (see assets/img/CREDITS.json)
const CREDITS = window.TX_CREDITS || {};  // assets/credits.js

const PERDAY = { my: 700, us: 260 };
const state = { persona: "my", at: -1, plan: [], visited: new Set(), playing: false, timer: null };

const $ = (id) => document.getElementById(id);
const vp = $("viewport"), world = $("world"), plane = $("plane"), pinsEl = $("pins"), trav = $("traveller"),
  layer = $("routeLayer"), card = $("arrive");
const NS = "http://www.w3.org/2000/svg";
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

// ---------- camera ----------
function baseScale() { return Math.min(vp.clientWidth / 1000 * 1.05, vp.clientHeight / 700 * 1.35); }
function camTo(x, y, zoom) {
  const s = baseScale() * zoom;
  const shift = innerWidth > 760 && state.at >= 0 && zoom > 1 ? 0.34 : 0.5;  // leave room for the arrival card
  const cx = vp.clientWidth * shift, cy = vp.clientHeight * 0.55;
  world.style.setProperty("--inv", (1 / s).toFixed(4));
  world.style.transform = `translate(${cx - x * s}px, ${cy - y * s}px) scale(${s})`;
}
function overview() { state.at = -1; hideCard(); camTo(510, 350, 1); setTilt(52, -6); markActive(-1); }
function setTilt(rx, rz) { vp.style.setProperty("--rx", rx + "deg"); vp.style.setProperty("--rz", rz + "deg"); }

// ---------- pins ----------
pinsEl.style.cssText = "position:absolute;inset:0;transform-style:preserve-3d";
STOPS.forEach((s, i) => {
  const p = document.createElement("div");
  p.className = "pin"; p.style.left = s.x + "px"; p.style.top = s.y + "px"; p.style.setProperty("--c", s.c);
  p.innerHTML = `<div class="shadow"></div><div class="stem"><div class="dot"><i>${s.icon}</i></div><div class="tag">${s.name}</div></div>`;
  pinsEl.appendChild(p); s.el = p;
});

// 3D hit-testing is unreliable on the tilted plane, so resolve clicks from the pins' projected boxes.
function pinAt(x, y) {
  let best = -1, bd = 1e9;
  STOPS.forEach((s, i) => {
    const r = s.el.querySelector(".dot").getBoundingClientRect(), t = s.el.querySelector(".tag").getBoundingClientRect();
    const inside = (b) => x >= b.left - 6 && x <= b.right + 6 && y >= b.top - 6 && y <= b.bottom + 6;
    if (inside(r) || inside(t)) { const d = Math.hypot(x - (r.left + r.width / 2), y - (r.top + r.height / 2)); if (d < bd) { bd = d; best = i; } }
  });
  return best;
}
vp.addEventListener("click", (e) => { if (e.target.closest(".hud, .arrive")) return; const i = pinAt(e.clientX, e.clientY); if (i >= 0) flyTo(i); });
vp.addEventListener("mousemove", (e) => { vp.style.cursor = pinAt(e.clientX, e.clientY) >= 0 ? "pointer" : ""; });

// progress dots
const prog = $("progress");
STOPS.forEach((_, i) => { const d = document.createElement("i"); d.addEventListener("click", () => flyTo(i)); prog.appendChild(d); });

// ---------- traveller & route ----------
let tpos = { x: STOPS[0].x, y: STOPS[0].y };
placeTrav(tpos.x, tpos.y);
function placeTrav(x, y) { trav.style.transform = `translate(${x}px, ${y}px)`; tpos = { x, y }; }
const ease = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
function curve(a, b) {
  const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2, dx = b.x - a.x, dy = b.y - a.y;
  return { c: { x: mx - dy * 0.18, y: my + dx * 0.18 } };
}
function flyTraveller(to, ms) {
  const from = { ...tpos }, { c } = curve(from, to);
  const path = document.createElementNS(NS, "path");
  path.setAttribute("d", `M${from.x} ${from.y} Q${c.x} ${c.y} ${to.x} ${to.y}`);
  path.setAttribute("fill", "none"); path.setAttribute("stroke", "#e8bd62"); path.setAttribute("stroke-width", "5");
  path.setAttribute("stroke-linecap", "round"); path.setAttribute("stroke-dasharray", "2 12");
  path.setAttribute("opacity", ".9");
  layer.appendChild(path);
  if (reduce) { placeTrav(to.x, to.y); return; }
  const t0 = performance.now();
  (function step(now) {
    const t = Math.min(1, (now - t0) / ms), e = ease(t), u = 1 - e;
    placeTrav(u * u * from.x + 2 * u * e * c.x + e * e * to.x, u * u * from.y + 2 * u * e * c.y + e * e * to.y);
    if (t < 1) requestAnimationFrame(step);
  })(t0);
}

// ---------- fly & arrive ----------
function flyTo(i) {
  const s = STOPS[i];
  hideCard();
  state.at = i;
  markActive(i);
  setTilt(44, i % 2 ? 4 : -8);
  camTo(s.x, s.y, i === 6 ? 1.7 : 2.3);
  flyTraveller({ x: s.x, y: s.y }, 1800);
  clearTimeout(state.arriveT);
  state.arriveT = setTimeout(() => arrive(i), reduce ? 0 : 1700);
}
function markActive(i) {
  STOPS.forEach((s, k) => { s.el.classList.toggle("on", k === i); s.el.classList.toggle("visited", state.visited.has(k) && k !== i); });
  [...prog.children].forEach((d, k) => { d.className = k === i ? "on" : state.visited.has(k) ? "v" : ""; });
}
function arrive(i) {
  const s = STOPS[i];
  state.visited.add(i); markActive(i);
  $("aKicker").textContent = s.kicker; $("aTitle").textContent = s.name; $("aText").textContent = s.text;
  renderPersona();
  const img = `url(assets/img/${s.img})`, fb = `linear-gradient(150deg, ${s.c}, #1e1b24)`;
  $("phImg").style.backgroundImage = `${img}, ${fb}`;
  const cr = CREDITS[s.id];
  $("aCredit").innerHTML = cr ? `Photo: <a href="${cr.page}" target="_blank" rel="noopener">${cr.author}</a> · ${cr.license}` : "";
  $("aDur").textContent = s.days ? `⏱ ${s.days} day${s.days > 1 ? "s" : ""}` : "⏱ on arrival";
  const add = $("aAdd");
  add.style.display = s.addable ? "" : "none";
  syncAdd();
  card.classList.add("show");
}
function hideCard() { card.classList.remove("show"); }
function renderPersona() {
  const s = STOPS[state.at]; if (!s) return;
  $("aNote").textContent = (state.persona === "my" ? "🇲🇾 " : "🇺🇸 ") + s[state.persona];
  $("aPrice").textContent = s.addable ? "💰 " + money(s[state.persona === "my" ? "rmb" : "usd"]) + " pp" : "";
}
const money = (n) => (state.persona === "my" ? "¥ " : "$ ") + n.toLocaleString();

// tilt photo with the mouse for a little 3D
card.addEventListener("mousemove", (e) => {
  const r = $("ph").getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
  $("phImg").style.transform = `translate(${x * -14}px, ${y * -10}px)`;
});

// ---------- plan ----------
function syncAdd() {
  const add = $("aAdd"), has = state.plan.includes(state.at);
  add.disabled = has; add.textContent = has ? "✔ In your journey" : "+ Add to my journey";
}
$("aAdd").addEventListener("click", () => { if (!state.plan.includes(state.at)) { state.plan.push(state.at); renderPlan(); syncAdd(); } });
function renderPlan() {
  const ul = $("routeList");
  if (!state.plan.length) { ul.innerHTML = '<li class="empty">Nothing yet — tap a landmark and press “Add to my journey”.</li>'; }
  else {
    ul.innerHTML = "";
    state.plan.forEach((i, k) => {
      const s = STOPS[i], li = document.createElement("li");
      li.innerHTML = `<b>${s.name}</b><small>${s.days} day${s.days > 1 ? "s" : ""} · ${money(s[state.persona === "my" ? "rmb" : "usd"])} pp</small><button aria-label="Remove">✕</button>`;
      li.querySelector("button").addEventListener("click", () => { state.plan.splice(k, 1); renderPlan(); syncAdd(); });
      ul.appendChild(li);
    });
  }
  const days = state.plan.reduce((a, i) => a + STOPS[i].days, 0);
  const key = state.persona === "my" ? "rmb" : "usd";
  const total = state.plan.reduce((a, i) => a + STOPS[i][key], 0) + Math.ceil(days) * PERDAY[state.persona];
  $("sDays").textContent = days || 0; $("sStops").textContent = state.plan.length;
  $("sPrice").textContent = state.plan.length ? money(total) : "—";
  $("sCta").href = state.persona === "my" ? "malaysia.html#quote" : "usa.html#plan";
}

// ---------- controls ----------
document.querySelectorAll(".persona button").forEach((b) => b.addEventListener("click", () => {
  state.persona = b.dataset.p;
  document.querySelectorAll(".persona button").forEach((x) => x.classList.toggle("on", x === b));
  renderPersona(); renderPlan();
}));
$("reset").addEventListener("click", () => { stopPlay(); overview(); });
$("play").addEventListener("click", () => (state.playing ? stopPlay() : startPlay()));
function startPlay() {
  state.playing = true; $("play").textContent = "❚❚ Pause tour";
  let k = state.at < 0 || state.at >= STOPS.length - 1 ? 0 : state.at + 1;
  const go = () => {
    if (!state.playing) return;
    flyTo(k);
    k++;
    if (k >= STOPS.length) { state.timer = setTimeout(stopPlay, 7000); return; }
    state.timer = setTimeout(go, 7500);
  };
  go();
}
function stopPlay() { state.playing = false; clearTimeout(state.timer); $("play").textContent = "▶ Play full tour"; }
addEventListener("resize", () => (state.at < 0 ? camTo(510, 350, 1) : camTo(STOPS[state.at].x, STOPS[state.at].y, state.at === 6 ? 1.7 : 2.3)));
addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") flyTo(Math.min(STOPS.length - 1, state.at + 1));
  if (e.key === "ArrowLeft") flyTo(Math.max(0, state.at - 1));
  if (e.key === "Escape") overview();
});

// credits list
const cl = $("creditList");
STOPS.forEach((s) => { const c = CREDITS[s.id]; if (c) { const li = document.createElement("li"); li.innerHTML = `${s.name}: <a href="${c.page}" target="_blank" rel="noopener">${c.title}</a> by ${c.author} (${c.license})`; cl.appendChild(li); } });

overview();
renderPlan();
