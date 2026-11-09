const STYLES = /*__STYLES__*/[];
const MINS = [['1', '১ মিনিট'], ['2', '২ মিনিট'], ['3', '৩ মিনিট'], ['5', '৫ মিনিট']];
const LANGS = [['bn', 'বাংলা'], ['en', 'English']];
const VOICES = [['female', 'নারী কণ্ঠ'], ['male', 'পুরুষ কণ্ঠ'], ['none', 'ভয়েস ছাড়া']];
const TONES = [['simple', 'সহজ, বন্ধুর মতো'], ['serious', 'গম্ভীর, তথ্যভরা'], ['dramatic', 'নাটকীয়']];
const TONE_TXT = { simple: 'সহজ ও বন্ধুত্বপূর্ণ', serious: 'গম্ভীর ও তথ্যভরা', dramatic: 'নাটকীয় ও আবেগী' };
const AUDS = [['general', 'সাধারণ মানুষ'], ['students', 'শিক্ষার্থী'], ['tech', 'ইঞ্জিনিয়ার ও টেক'], ['yt', 'ইউটিউব দর্শক']];
const AUD_TXT = { general: 'সাধারণ মানুষ', students: 'শিক্ষার্থী', tech: 'ইঞ্জিনিয়ার ও টেক আগ্রহী', yt: 'ইউটিউব দর্শক' };
const SBS = [['no', 'না, সরাসরি ফিল্ম'], ['yes', 'হ্যাঁ, আগে দেখাও']];
const STATUS = { queued: 'অপেক্ষায়', making: 'বানানো হচ্ছে', review: 'আপনার দেখার জন্য', done: 'তৈরি', failed: 'সমস্যা হয়েছে' };
const WPM = 115; // Bangla narration words per minute, a safe estimate for a calm read
const $ = id => document.getElementById(id);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const S = { style: null, cat: 'all', q: '', min: '5', lang: 'bn', voice: 'female', tone: 'simple', aud: 'general', sb: 'no', ideas: [], idea: null, story: null, films: [], reqs: [], current: null };
let db = null, sample = null;

function toast(m) { const t = $('toast'); t.textContent = m; t.hidden = false; clearTimeout(toast.h); toast.h = setTimeout(() => t.hidden = true, 3600); }
const FIELDS = ['f-interest', 'f-topic', 'f-notes'];
function save() { try { const o = { style: S.style, min: S.min, lang: S.lang, voice: S.voice, tone: S.tone, aud: S.aud, sb: S.sb, ideas: S.ideas, idea: S.idea, story: S.story }; for (const f of FIELDS) o[f] = $(f).value; localStorage.setItem('studio-draft-2', JSON.stringify(o)); } catch (e) {} }
function load() { try { const d = JSON.parse(localStorage.getItem('studio-draft-2') || 'null'); if (!d) return; for (const k of ['style', 'min', 'lang', 'voice', 'tone', 'aud', 'sb', 'ideas', 'idea', 'story']) if (d[k] != null) S[k] = d[k]; for (const f of FIELDS) $(f).value = d[f] || ''; } catch (e) {} }
const minutes = () => Math.max(.5, Math.min(10, parseFloat(S.min) || 5));
const styleOf = slug => STYLES.find(s => s.slug === slug);

function seg(id, name, opts, after) {
  $(id).innerHTML = opts.map(([v, l]) => `<label><input type="radio" name="${name}" value="${v}" ${S[name] === v ? 'checked' : ''}><span>${l}</span></label>`).join('');
  $(id).addEventListener('change', e => { S[name] = e.target.value; if (after) after(); save(); renderSum(); });
}
function syncMin() { $('f-min').value = S.min; for (const r of document.querySelectorAll('#seg-min input')) r.checked = r.value === S.min; lenNote(); }
function lenNote() {
  const m = minutes(), n = $('len-note');
  if (m > 3) { n.hidden = false; n.textContent = `${m} মিনিটের ফিল্ম বেশ বড়। বানাতে আনুমানিক ${Math.round(m * 1.2)} থেকে ${Math.round(m * 2)} ঘণ্টা আর অনেক টোকেন লাগতে পারে। প্রথমে ১ বা ২ মিনিটে দেখে নিলে ঝুঁকি কম।`; }
  else n.hidden = true;
}
function renderChips() {
  const cats = [['all', 'সব']].concat([...new Map(STYLES.map(s => [s.cat, s.bn])).entries()]);
  $('chips').innerHTML = cats.map(([k, l]) => `<button class="chip" type="button" data-c="${esc(k)}" aria-pressed="${S.cat === k}">${esc(l)}</button>`).join('');
}
function renderGrid() {
  const q = S.q.trim().toLowerCase();
  const list = STYLES.filter(s => (S.cat === 'all' || s.cat === S.cat) && (!q || (s.en + ' ' + s.film + ' ' + (s.uses || []).join(' ')).toLowerCase().includes(q)));
  $('grid').innerHTML = list.length ? list.map(s => `<button class="card" type="button" data-s="${s.slug}" aria-pressed="${S.style === s.slug}"><img src="${s.img}" alt="${esc(s.en)} স্টাইলের একটা ফ্রেম" loading="lazy"><span class="t"><b>${esc(s.en)}</b><span>${esc(s.bn)}</span><span>${esc(s.line)}</span></span></button>`).join('') : '<div class="empty-note">এই নামে কোনো স্টাইল পাওয়া যায়নি।</div>';
}
function renderIdeas() {
  $('ideas').innerHTML = S.ideas.map((d, i) => { const st = styleOf(d.bestStyle); return `<button class="idea" type="button" data-i="${i}" aria-pressed="${S.idea === i}"><b>${esc(d.title)}</b><span class="small">${esc(d.hook)}</span><span class="small muted">${esc(d.why)}</span>${st ? `<span class="fit">ভালো মানায়: ${esc(st.en)}</span>` : ''}</button>`; }).join('');
}
function renderSum() {
  const st = styleOf(S.style), lang = LANGS.find(l => l[0] === S.lang)[1], v = VOICES.find(l => l[0] === S.voice)[1];
  $('pick-note').textContent = st ? `বাছা হয়েছে: ${st.en}` : '৬৬টা স্টাইলের একটা ক্লিক করুন';
  const topic = $('f-topic').value.trim();
  $('sum').innerHTML = st || topic ? `<b>${esc(st ? st.en : 'স্টাইল বাছা হয়নি')}</b> · ${minutes()} মিনিট · ${lang} · ${v}<br><span class="small muted">${esc(topic || 'বিষয় এখনো ঠিক হয়নি')}${S.story ? ' · গল্প তৈরি আছে' : ' · গল্প এখনো লেখা হয়নি'}</span>` : 'স্টাইল আর বিষয় ঠিক করলে এখানে সারসংক্ষেপ আসবে।';
}

/* ---- Claude helpers (sample capability) ---- */
const styleList = () => STYLES.map(s => `${s.slug} = ${s.en} (${(s.uses || []).join(', ')})`).join('\n');
async function research() {
  if (!sample) { toast('এই ভিউতে Claude-এর সুবিধা চালু নেই'); return; }
  const interest = $('f-interest').value.trim(), st = styleOf(S.style);
  $('research').disabled = true; $('research-state').textContent = 'খোঁজা হচ্ছে...';
  const prompt = `তুমি একজন ডকুমেন্টারি ফিল্মের রিসার্চার। দর্শক: ${AUD_TXT[S.aud]}. আগ্রহের ক্ষেত্র: ${interest || 'যেকোনো, যেটা সবচেয়ে মজার ও দৃশ্যমান'}. ${st ? 'ভিজ্যুয়াল স্টাইল ঠিক করা আছে: ' + st.en + ' (' + st.line + '). বিষয়গুলো এই স্টাইলে ভালো মানাতে হবে।' : 'স্টাইল এখনো ঠিক হয়নি, প্রতিটা বিষয়ের জন্য নিচের তালিকা থেকে সবচেয়ে মানানসই একটা স্টাইল বাছো।'}\n৮টা আলাদা ফিল্মের বিষয় দাও। যেগুলোর একটা পরিষ্কার প্রশ্ন বা মোড় আছে, চোখে দেখানো যায়, আর সত্য তথ্য দিয়ে বলা সম্ভব। কোনো সংখ্যা বা তথ্য বানিয়ে লিখো না।\nস্টাইলের তালিকা (slug = নাম (কোন ধরনের কাজে ভালো)):\n${styleList()}\nশুধু JSON অ্যারে ফেরত দাও, প্রতিটা এলিমেন্ট: {"title": "বাংলায় বিষয়ের নাম", "hook": "প্রথম ৩ সেকেন্ডে দর্শককে কী আটকে রাখবে, এক লাইনে", "why": "কেন এটা ভালো ফিল্ম, এক লাইনে", "bestStyle": "তালিকার একটা slug"}`;
  try {
    const arr = await sample.json(prompt, { cache: false });
    S.ideas = (Array.isArray(arr) ? arr : arr.ideas || []).slice(0, 8); S.idea = null; renderIdeas(); save();
    $('research-state').textContent = `${S.ideas.length}টা আইডিয়া পেলাম। একটা ক্লিক করুন।`;
  } catch (e) { $('research-state').textContent = e && e.code === 'not_granted' ? 'অনুমতি দেওয়া হয়নি।' : 'আইডিয়া আনা যায়নি, আবার চেষ্টা করুন।'; }
  $('research').disabled = false;
}
async function writeStory(instruction) {
  if (!sample) { toast('এই ভিউতে Claude-এর সুবিধা চালু নেই'); return; }
  const topic = $('f-topic').value.trim(); if (!topic) { toast('আগে ১ নম্বর ধাপে বিষয় বাছুন বা লিখুন'); return; }
  const st = styleOf(S.style), m = minutes(), words = Math.round(m * WPM * .92), bn = S.lang === 'bn';
  $('write').disabled = true; $('write-state').textContent = m > 2 ? 'লেখা হচ্ছে, বড় ফিল্মে এক-দুই মিনিট লাগতে পারে...' : 'লেখা হচ্ছে...';
  const prev = instruction && S.story ? `\nআগের খসড়া (এটা শুধু ঠিক করো, গোড়া থেকে নয়):\n${JSON.stringify(S.story)}\nবদলের নির্দেশ: ${instruction}` : '';
  const prompt = `তুমি একজন ডকুমেন্টারি ফিল্মের গল্পকার ও পরিচালক। ${m} মিনিটের একটা ফিল্মের গল্প আর ভয়েসওভার লেখো।\nবিষয়: ${topic}\nভিজ্যুয়াল স্টাইল: ${st ? st.en + ' (' + st.line + ')' : 'ঠিক হয়নি'}\nদর্শক: ${AUD_TXT[S.aud]}। কথার ধরন: ${TONE_TXT[S.tone]}।\nভয়েসওভারের ভাষা: ${bn ? 'বাংলা (সহজ, কথ্য-ঘেঁষা, উচ্চারণ করে পড়ার মতো; সংখ্যা কথায় লিখো না, অঙ্কেই লিখো)' : 'English'}।\nমোট ভয়েসওভার প্রায় ${words} শব্দ হবে। দৃশ্যের seconds-এর যোগফল প্রায় ${Math.round(m * 60)} হবে। ${Math.max(5, Math.round(m * 2.2))}টার মতো দৃশ্য।\nনিয়ম: একটা মূল প্রশ্ন বা চাওয়া, একটা মোড়, একটা প্রতিধ্বনিত শেষ। প্রথম ৩ সেকেন্ডে চোখ আটকানো কিছু। কোনো সংখ্যা, নাম বা তারিখ বানিয়ে লিখো না; যে তথ্য নিশ্চিত নও সেটা "facts" তালিকায় দাও যাচাইয়ের জন্য। প্রতিটা দৃশ্যের "visual"-এ লেখো ওই স্টাইলে পর্দায় কী দেখা যাবে।${prev}\nশুধু JSON ফেরত দাও: {"logline": "এক লাইনে ফিল্মের সারকথা", "scenes": [{"title": "দৃশ্যের নাম", "visual": "পর্দায় কী দেখা যাবে", "narration": "ভয়েসওভারের কথা", "seconds": 20}], "facts": ["যাচাই করতে হবে এমন তথ্য বা দাবি"]}`;
  try {
    const r = await sample.json(prompt, { cache: false, modelTier: 'complex' });
    if (!r || !Array.isArray(r.scenes) || !r.scenes.length) throw new Error('bad');
    S.story = { logline: String(r.logline || ''), scenes: r.scenes.map(x => ({ title: String(x.title || ''), visual: String(x.visual || ''), narration: String(x.narration || ''), seconds: Number(x.seconds) || 0 })), facts: (r.facts || []).map(String) };
    renderStory(); save(); renderSum(); $('write-state').textContent = 'গল্প তৈরি। কথাগুলো নিজে বদলাতে পারবেন।';
  } catch (e) { $('write-state').textContent = e && e.code === 'not_granted' ? 'অনুমতি দেওয়া হয়নি।' : 'গল্প লেখা যায়নি, আবার চেষ্টা করুন।'; }
  $('write').disabled = false;
}
const countWords = t => (t.trim().match(/\S+/g) || []).length;
function renderStory() {
  const st = S.story; if (!st) { $('story').innerHTML = ''; return; }
  $('story').innerHTML = `<p><b>${esc(st.logline)}</b></p>
    <div class="scenes">${st.scenes.map((s, i) => `<div class="scene"><header><b>দৃশ্য ${i + 1}: ${esc(s.title)}</b><span class="small muted">${s.seconds || '?'} সেকেন্ড</span></header><div class="vis">পর্দায়: ${esc(s.visual)}</div><textarea data-i="${i}" aria-label="দৃশ্য ${i + 1}-এর ভয়েসওভার">${esc(s.narration)}</textarea></div>`).join('')}</div>
    <div class="tot" id="tot"></div>
    ${st.facts.length ? `<h3 style="margin-top:14px">ফিল্ম বানানোর আগে যাচাই হবে</h3><ul class="facts small">${st.facts.map(f => `<li>${esc(f)}</li>`).join('')}</ul>` : ''}
    <div class="revise"><input id="rev" type="text" placeholder="বদলের নির্দেশ, যেমন: শুরুটা আরও আকর্ষণীয় করো" aria-label="বদলের নির্দেশ"><button class="btn" id="revbtn" type="button">এভাবে বদলে লেখো</button></div>`;
  renderTot();
}
function renderTot() {
  const st = S.story, el = $('tot'); if (!st || !el) return;
  const m = minutes(), tw = st.scenes.reduce((a, s) => a + countWords(s.narration), 0), est = tw / WPM, ts = st.scenes.reduce((a, s) => a + (s.seconds || 0), 0), ok = Math.abs(est - m) <= Math.max(.5, m * .2);
  el.innerHTML = `<span>মোট ${tw} শব্দ, পড়তে প্রায় ${est.toFixed(1)} মিনিট</span><span class="pill ${ok ? 's-done' : 's-queued'}">${ok ? `লক্ষ্য ${m} মিনিটের কাছাকাছি` : `লক্ষ্য ${m} মিনিট, তাই কথা বাড়ানো বা কমানো দরকার`}</span><span class="small muted">দৃশ্যের সময়ের যোগফল ${ts} সেকেন্ড</span>`;
}

/* ---- films and queue ---- */
function playFilm(f) {
  S.current = f.id;
  $('player').innerHTML = `<video controls playsinline preload="metadata" ${f.poster ? `poster="${esc(f.poster)}"` : ''} src="${esc(f.url)}"></video>`;
  $('now').innerHTML = `<div><b>${esc(f.title)}</b><div class="small muted">${esc(f.styleName || '')}${f.durationSec ? ' · ' + f.durationSec + ' সেকেন্ড' : ''}</div></div>`;
  renderShelf();
}
function renderShelf() {
  if (!S.films.length) { $('shelf').innerHTML = '<div class="empty-note">তৈরি হওয়া ফিল্ম এখানে সারি দিয়ে আসবে।</div>'; return; }
  $('shelf').innerHTML = S.films.map(f => `<button class="film" type="button" data-f="${esc(f.id)}" aria-current="${S.current === f.id}">${f.poster ? `<img src="${esc(f.poster)}" alt="">` : '<span class="ph"></span>'}<span><b>${esc(f.title)}</b><span class="small muted">${esc(f.styleName || '')}</span></span></button>`).join('');
}
function renderQueue() {
  if (!S.reqs.length) { $('queue').innerHTML = '<div class="empty-note">জমা দেওয়া গল্প এখানে দেখা যাবে, সঙ্গে অবস্থা: অপেক্ষায়, বানানো হচ্ছে বা তৈরি।</div>'; return; }
  $('queue').innerHTML = S.reqs.map(r => {
    const film = r.filmId && S.films.find(f => f.id === r.filmId), mins = r.lengthMin || (r.lengthSec ? r.lengthSec / 60 : '');
    return `<div class="req"><div><b>${esc(r.title || 'নামহীন')}</b> <span class="pill s-${esc(r.status)}">${esc(STATUS[r.status] || r.status)}</span>
      <div class="meta"><span>${esc(r.styleName)}</span><span>${esc(mins)} মিনিট</span><span>${r.language === 'bn' ? 'বাংলা' : 'English'}</span>${Array.isArray(r.scenes) && r.scenes.length ? `<span>${r.scenes.length}টা দৃশ্য লেখা আছে</span>` : '<span>গল্প Claude পরে লিখবে</span>'}</div>
      ${r.statusNote ? `<div class="small" style="margin-top:6px">${esc(r.statusNote)}</div>` : ''}</div>
      <div class="acts">${film ? `<button class="btn small primary" data-play="${esc(film.id)}" type="button">দেখুন</button>` : ''}${r.status === 'queued' ? `<button class="btn small" data-del="${esc(r.id)}" type="button">মুছুন</button>` : ''}</div></div>`;
  }).join('');
}
async function submit() {
  const st = styleOf(S.style), topic = $('f-topic').value.trim();
  if (!topic) { toast('আগে ১ নম্বর ধাপে বিষয় বাছুন বা লিখুন'); return; }
  if (!st) { toast('২ নম্বর ধাপে একটা স্টাইল বাছুন'); return; }
  if (!db) { toast('এই মুহূর্তে সেভ করা যাচ্ছে না। সাইন-ইন করা আছে কি না দেখুন'); return; }
  $('send').disabled = true;
  try {
    const doc = { title: topic, topic, styleSlug: st.slug, styleName: st.en, lengthMin: minutes(), lengthSec: Math.round(minutes() * 60), language: S.lang, voice: S.voice, tone: S.tone, audience: S.aud, storyboard: S.sb === 'yes', notes: $('f-notes').value.trim(), status: 'queued', createdAt: new Date().toISOString() };
    if (S.story) { doc.logline = S.story.logline; doc.scenes = S.story.scenes; doc.factsToVerify = S.story.facts; doc.story = S.story.scenes.map(s => s.narration).join('\n'); }
    await db.collection('requests').add(doc);
    toast('জমা হয়েছে। এবার Claude সেশনে বলুন ফিল্মটা বানাতে।');
    $('queue').scrollIntoView({ behavior: 'smooth', block: 'center' });
  } catch (e) { toast('জমা হয়নি: ' + (e && e.message ? e.message : 'আবার চেষ্টা করুন')); }
  $('send').disabled = false;
}

function bind() {
  $('chips').addEventListener('click', e => { const b = e.target.closest('[data-c]'); if (!b) return; S.cat = b.dataset.c; renderChips(); renderGrid(); });
  $('q').addEventListener('input', e => { S.q = e.target.value; renderGrid(); });
  $('grid').addEventListener('click', e => { const b = e.target.closest('[data-s]'); if (!b) return; S.style = b.dataset.s; save(); renderGrid(); renderSum(); });
  $('ideas').addEventListener('click', e => {
    const b = e.target.closest('[data-i]'); if (!b) return; const d = S.ideas[+b.dataset.i]; if (!d) return;
    S.idea = +b.dataset.i; $('f-topic').value = d.title; if (styleOf(d.bestStyle) && !S.style) { S.style = d.bestStyle; renderGrid(); toast('স্টাইলও বাছা হলো: ' + styleOf(d.bestStyle).en + '। ২ নম্বর ধাপে বদলাতে পারবেন।'); }
    renderIdeas(); save(); renderSum();
  });
  $('shelf').addEventListener('click', e => { const b = e.target.closest('[data-f]'); if (!b) return; const f = S.films.find(x => x.id === b.dataset.f); if (f) { playFilm(f); window.scrollTo({ top: 0, behavior: 'smooth' }); } });
  $('queue').addEventListener('click', async e => {
    const p = e.target.closest('[data-play]'); if (p) { const f = S.films.find(x => x.id === p.dataset.play); if (f) { playFilm(f); window.scrollTo({ top: 0, behavior: 'smooth' }); } return; }
    const d = e.target.closest('[data-del]'); if (d && db) { try { await db.collection('requests').doc(d.dataset.del).delete(); toast('মুছে ফেলা হয়েছে'); } catch (x) { toast('মোছা যায়নি'); } }
  });
  $('story').addEventListener('input', e => { const t = e.target.closest('textarea[data-i]'); if (!t) return; S.story.scenes[+t.dataset.i].narration = t.value; renderTot(); save(); });
  $('story').addEventListener('click', e => { if (e.target.id === 'revbtn') { const v = $('rev').value.trim(); if (!v) { toast('কী বদলাতে চান লিখুন'); return; } writeStory(v); } });
  for (const id of FIELDS) $(id).addEventListener('input', () => { save(); renderSum(); });
  $('f-min').addEventListener('input', e => { S.min = e.target.value; for (const r of document.querySelectorAll('#seg-min input')) r.checked = r.value === S.min; lenNote(); save(); renderSum(); renderTot(); });
  $('send').addEventListener('click', submit); $('write').addEventListener('click', () => writeStory('')); $('research').addEventListener('click', research);
  $('copy').addEventListener('click', async () => { const t = $('cmdtext').textContent; try { await navigator.clipboard.writeText(t); toast('কপি হয়েছে'); } catch (e) { const r = document.createRange(); r.selectNodeContents($('cmdtext')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); toast('লেখাটা বেছে নেওয়া হয়েছে, কপি করে নিন'); } });
}

async function connect() {
  try { sample = await claude.use('sample'); } catch (e) { sample = null; }
  try { db = await claude.use('db'); } catch (e) { db = null; }
  if (!db) { $('dbstate').textContent = 'সেভ করার সুবিধা এখন বন্ধ'; return; }
  $('dbstate').textContent = 'সেভ করা আছে';
  const guard = setTimeout(() => { $('dbstate').textContent = 'লোড হতে দেরি হচ্ছে'; }, 10000);
  db.collection('films').orderBy('createdAt', 'desc').onSnapshot(snap => {
    clearTimeout(guard); S.films = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderShelf(); renderQueue();
    const cur = S.films.find(f => f.id === S.current) || S.films[0];
    if (cur && (!S.current || S.current !== cur.id)) playFilm(cur);
  }, () => { $('dbstate').textContent = 'ফিল্ম লোড করা যায়নি'; });
  db.collection('requests').orderBy('createdAt', 'desc').onSnapshot(snap => { S.reqs = snap.docs.map(d => ({ id: d.id, ...d.data() })); renderQueue(); }, () => {});
}

load(); renderChips(); renderGrid(); renderIdeas();
seg('seg-min', 'min', MINS, syncMin); seg('seg-lang', 'lang', LANGS); seg('seg-voice', 'voice', VOICES); seg('seg-tone', 'tone', TONES); seg('seg-aud', 'aud', AUDS); seg('seg-sb', 'sb', SBS);
syncMin(); bind(); renderStory(); renderSum(); connect();
