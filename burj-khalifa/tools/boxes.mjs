import path from 'path'; import { fileURLToPath } from 'url';
const DEMO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'); const LIB = process.env.LIB || '/root/lemo-opuscar';
const { openDemo, closeServer } = await import(path.join(LIB, 'core/render/page.mjs'));
const { browser, page } = await openDemo(DEMO, { w: 1920, h: 1080 });
for (const t of process.argv.slice(2).map(Number)) { const r = await page.evaluate(t => window.TEXTS(t), t); console.log('t=' + t, r.map(x => `${x.id}[${Math.round(x.x0)},${Math.round(x.y0)}-${Math.round(x.x1)},${Math.round(x.y1)}]`).join(' ')); }
await browser.close(); closeServer();
