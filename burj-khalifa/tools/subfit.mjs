// Every Bangla subtitle cue must fit on one line inside the safe width (measured with the burned-in font).
import path from 'path'; import { fileURLToPath } from 'url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), DEMO = path.resolve(HERE, '..');
const LIB = process.env.LIB || '/root/lemo-opuscar';
const { openDemo, closeServer } = await import(path.join(LIB, 'core/render/page.mjs'));
const { browser, page } = await openDemo(DEMO, { w: 1920, h: 1080 });
const rows = await page.evaluate(() => window.SUBCHECK()); await browser.close(); closeServer();
let bad = 0; for (const r of rows) { if (!r.ok) bad++; console.log(`${r.ok ? 'OK ' : 'BAD'} #${r.i + 1} ${r.wz}px / ${r.safe}  ${r.zh}`); }
process.exit(bad ? 1 : 0);
