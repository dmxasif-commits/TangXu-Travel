// Every board text that is on screen must be fully inside the frame (margin MARGIN px, above the subtitle strip when a cue is showing).
// A text that is partly cut by the frame edge, or that touches the subtitle strip, is reported with its time ranges.
import path from 'path'; import fs from 'fs'; import { fileURLToPath } from 'url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), DEMO = path.resolve(HERE, '..');
const LIB = process.env.LIB || '/root/lemo-opuscar';
const { openDemo, closeServer } = await import(path.join(LIB, 'core/render/page.mjs'));
const W = 1920, H = 1080, M = 40, STRIP_TOP = H * .86;
const { browser, page } = await openDemo(DEMO, { w: W, h: H });
const dur = await page.evaluate(() => window.DUR); const scene = JSON.parse(fs.readFileSync(path.join(DEMO, 'scenes/film.json'), 'utf8'));
const bad = new Map();
for (let t = 0.05; t < dur; t += 0.1) {
  const rows = await page.evaluate(t => window.TEXTS(t), t);
  const cue = (scene.subs || []).some(s => t >= s.t0 && t < s.t1);
  for (const r of rows) {
    const inter = r.x1 > 0 && r.x0 < W && r.y1 > 0 && r.y0 < H; if (!inter) continue;
    const inside = r.x0 >= M && r.x1 <= W - M && r.y0 >= M && r.y1 <= (cue ? STRIP_TOP : H - M);
    if (!inside) { const k = r.id; (bad.get(k) || bad.set(k, []).get(k)).push(+t.toFixed(2)); }
  }
}
await browser.close(); closeServer();
const ranges = a => { const o = []; let s = a[0], p = a[0]; for (const t of a.slice(1)) { if (t - p > .15) { o.push([s, p]); s = t; } p = t; } o.push([s, p]); return o; };
let n = 0;
for (const [id, a] of bad) { n++; console.log(`CUT ${id.padEnd(10)} ` + ranges(a).map(([s, e]) => `${s.toFixed(1)}–${e.toFixed(1)}s`).join('  ')); }
console.log(n ? `${n} texts are cut or too close to the edge` : 'all board texts stay fully in frame');
process.exit(n ? 1 : 0);
