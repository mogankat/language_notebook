/* Handwriting practice: write with a finger, mouse or Apple Pencil, check it against the real
   strokes, and watch the stroke order.
   Stroke order data: KanjiVG by Ulrich Apel, CC BY-SA 3.0 (https://kanjivg.tagaini.net),
   fetched per character on demand. Without it (e.g. offline) the pad falls back to a font glyph
   and writing can't be checked automatically. */

const KVG_BASE = 'https://cdn.jsdelivr.net/gh/KanjiVG/kanjivg@r20250816/kanji/';
const kvgCache = new Map();
// Kana, ー, 々 and kanji: the characters worth practising (skips ~, spaces, punctuation, romaji)
// Korean Hangul syllables and letters are writable too (but have no stroke data to check against)
const WRITABLE = /[\u3041-\u3096\u309d\u309e\u30a1-\u30fa\u30fc-\u30fe\u3005\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff\uac00-\ud7a3\u3131-\u318e]/;
const HAS_STROKE_DATA = /[\u3041-\u3096\u309d\u309e\u30a1-\u30fa\u30fc-\u30fe\u3005\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/; // KanjiVG: kana and kanji only
const writableChars = text => [...String(text || '')].filter(c => WRITABLE.test(c));

function loadStrokes(ch) {
  if (!HAS_STROKE_DATA.test(ch)) return Promise.resolve(null);
  if (!kvgCache.has(ch)) {
    const file = ch.codePointAt(0).toString(16).padStart(5, '0') + '.svg';
    kvgCache.set(ch, fetch(KVG_BASE + file)
      .then(r => (r.ok ? r.text() : null))
      .then(t => {
        if (!t) return null;
        const doc = new DOMParser().parseFromString(t, 'image/svg+xml');
        // Paths appear in stroke order; numbers say where to label each stroke
        const paths = [...doc.querySelectorAll('path')].map(p => p.getAttribute('d')).filter(Boolean);
        const nums = [...doc.querySelectorAll('text')].map(n => ({ n: n.textContent, at: n.getAttribute('transform') }));
        return paths.length ? { paths, nums } : null;
      })
      .catch(() => { kvgCache.delete(ch); return null; })); // offline: try again next time
  }
  return kvgCache.get(ch);
}

/* ---------- checking handwriting ----------
   Each stroke is resampled to N evenly spaced points. Both the writing and the reference are scaled
   to fit the same square (so writing a bit small or off-centre is fine), then stroke k of the writing
   is compared with stroke k of the reference. That checks stroke count, order, direction and shape.
   A stroke matches when its average point distance, start/end distance and worst point distance are
   all within tolerance. Tuned on simulated sloppy writing of all kana: ~98% of correct-but-sloppy
   writing passes, and lookalikes like ね/ぬ and わ/れ are told apart (ナ/す can still be confused). */
const N = 24, TOL = { mean: 0.18, ends: 0.25, worst: 0.35 };
let samplerPath = null;
function samplePath(d) {
  if (!samplerPath) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('style', 'position:absolute;width:0;height:0;overflow:hidden');
    svg.setAttribute('aria-hidden', 'true');
    samplerPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    svg.appendChild(samplerPath); document.body.appendChild(svg);
  }
  samplerPath.setAttribute('d', d);
  const len = samplerPath.getTotalLength();
  return Array.from({ length: N }, (_, k) => { const p = samplerPath.getPointAtLength(len * k / (N - 1)); return [p.x / 109, p.y / 109]; });
}
async function referenceStrokes(ch) {
  const data = await loadStrokes(ch);
  if (!data) return null;
  data.samples ||= data.paths.map(samplePath);
  return data.samples;
}
function resample(stroke) {
  const pts = stroke.map(p => [p[0], p[1]]), cum = [0];
  for (let k = 1; k < pts.length; k++) cum.push(cum[k - 1] + Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]));
  const total = cum[cum.length - 1];
  if (!total) return Array.from({ length: N }, () => pts[0]);
  const out = []; let j = 1;
  for (let k = 0; k < N; k++) {
    const t = total * k / (N - 1);
    while (j < pts.length - 1 && cum[j] < t) j++;
    const seg = cum[j] - cum[j - 1] || 1, f = Math.min(1, Math.max(0, (t - cum[j - 1]) / seg));
    out.push([pts[j - 1][0] + (pts[j][0] - pts[j - 1][0]) * f, pts[j - 1][1] + (pts[j][1] - pts[j - 1][1]) * f]);
  }
  return out;
}
function fitToSquare(strokes) {
  const all = strokes.flat(), xs = all.map(p => p[0]), ys = all.map(p => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const size = Math.max(maxX - minX, maxY - minY) || 1, cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
  return strokes.map(s => s.map(p => [(p[0] - cx) / size + 0.5, (p[1] - cy) / size + 0.5]));
}
const strokeDistance = (a, b) => a.reduce((t, p, k) => t + Math.hypot(p[0] - b[k][0], p[1] - b[k][1]), 0) / a.length;
function strokeMatches(a, b) {
  const d = k => Math.hypot(a[k][0] - b[k][0], a[k][1] - b[k][1]);
  if (Math.max(d(0), d(N - 1)) > TOL.ends) return false;
  let worst = 0; for (let k = 0; k < N; k++) worst = Math.max(worst, d(k));
  return worst <= TOL.worst && strokeDistance(a, b) <= TOL.mean;
}

// → {ok: true|false|null (can't check), reason, bad: index of the stroke to highlight}
async function checkCharacter(ch, ink) {
  if (!HAS_STROKE_DATA.test(ch)) return { ok: null, reason: 'Hangul can’t be checked automatically yet. Compare your writing with the red letter yourself.' };
  if (!ink?.length) return { ok: false, reason: 'Nothing written yet.' };
  const ref = await referenceStrokes(ch);
  if (!ref) return { ok: null, reason: HAS_STROKE_DATA.test(ch)
    ? 'Can’t check this character right now (stroke data needs an internet connection). Compare it with the red character yourself.'
    : 'Hangul can’t be checked automatically yet. Compare your writing with the red letter yourself.' };
  const mine = fitToSquare(ink.map(resample)), theirs = fitToSquare(ref);
  if (mine.length !== theirs.length) {
    const n = theirs.length;
    return { ok: false, reason: `You wrote ${mine.length} stroke${mine.length === 1 ? '' : 's'}; ${ch} has ${n}. Tap “Stroke order” to see them.` };
  }
  for (let k = 0; k < mine.length; k++) {
    if (strokeMatches(mine[k], theirs[k])) continue;
    if (strokeMatches([...mine[k]].reverse(), theirs[k]))
      return { ok: false, reason: `Stroke ${k + 1} goes the wrong way. Tap “Stroke order” to see its direction.`, bad: k };
    const other = theirs.findIndex((r, j) => j !== k && strokeMatches(mine[k], r));
    if (other >= 0) return { ok: false, reason: `Stroke order: your stroke ${k + 1} should be stroke ${other + 1}.`, bad: k };
    return { ok: false, reason: `Stroke ${k + 1} doesn’t match. Compare it with the highlighted red stroke.`, bad: k };
  }
  return { ok: true, reason: 'Looks right!' };
}

/* createPad(root, {checkButton}) builds a pad inside root.
   pad.load(text, {trace}) practises each writable character of text in turn;
   pad.check() checks every character and shows the results;
   pad.isEmpty() is true until something has been written. */
function createPad(root, { checkButton = true } = {}) {
  root.classList.add('wp');
  root.innerHTML = `
    <div class="wp-top">
      <button type="button" class="btn wp-arrow" data-act="prev" aria-label="Previous character">‹</button>
      <div class="wp-slots"></div>
      <button type="button" class="btn wp-arrow" data-act="next" aria-label="Next character">›</button>
    </div>
    <div class="wp-box">
      <svg class="wp-grid" viewBox="0 0 100 100" aria-hidden="true"><path d="M50 2V98M2 50H98"/></svg>
      <svg class="wp-guide" viewBox="0 0 109 109" aria-hidden="true"></svg>
      <canvas aria-label="Writing area"></canvas>
    </div>
    <div class="wp-tools">
      <button type="button" class="btn" data-act="undo">Undo</button>
      <button type="button" class="btn" data-act="clear">Clear</button>
      <button type="button" class="btn" data-act="trace">Trace</button>
      <button type="button" class="btn" data-act="order">Stroke order</button>
      ${checkButton ? '<button type="button" class="btn primary" data-act="check">Check</button>' : ''}
    </div>
    <p class="wp-msg"></p>
    <p class="wp-credit">Stroke order: <a href="https://kanjivg.tagaini.net" target="_blank" rel="noopener">KanjiVG</a> (CC BY-SA 3.0)</p>`;
  const q = s => root.querySelector(s);
  const box = q('.wp-box'), canvas = q('canvas'), guide = q('.wp-guide'), ctx = canvas.getContext('2d');
  // ink[i] = strokes for character i; a stroke is a list of [x, y, pressure] in 0..1 box coordinates
  const st = { chars: [], i: 0, ink: [], checked: [], results: [], trace: false, order: false, penSeen: false, cur: null, token: 0, timers: [] };

  const msg = (t, cls = '') => { const m = q('.wp-msg'); m.textContent = t || ''; m.className = 'wp-msg ' + cls; };
  const inkColor = () => getComputedStyle(root).getPropertyValue('--ink').trim() || '#000';

  function fit() {
    const r = box.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    if (!r.width) return;
    canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
    redraw();
  }
  new ResizeObserver(fit).observe(box);

  function drawStroke(s, from = 0) {
    const W = canvas.width, base = W * 0.03;
    ctx.strokeStyle = ctx.fillStyle = inkColor(); ctx.lineCap = ctx.lineJoin = 'round';
    if (s.length === 1 && from === 0) { // a tap: dakuten ゛ dots are often just taps
      ctx.beginPath(); ctx.arc(s[0][0] * W, s[0][1] * W, base * (0.3 + 0.45 * s[0][2]), 0, Math.PI * 2); ctx.fill();
      return;
    }
    for (let k = Math.max(1, from); k < s.length; k++) {
      const a = s[k - 1], b = s[k];
      ctx.lineWidth = base * (0.55 + 0.9 * b[2]);
      ctx.beginPath(); ctx.moveTo(a[0] * W, a[1] * W); ctx.lineTo(b[0] * W, b[1] * W); ctx.stroke();
    }
  }
  function redraw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    (st.ink[st.i] || []).forEach(s => drawStroke(s));
  }

  const point = e => {
    const r = canvas.getBoundingClientRect();
    // Apple Pencil reports real pressure; fingers and mice get a medium line
    const p = e.pointerType === 'pen' && e.pressure > 0 ? e.pressure : 0.5;
    return [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height, p];
  };
  canvas.addEventListener('pointerdown', e => {
    if (e.pointerType === 'pen') st.penSeen = true;
    else if (e.pointerType === 'touch' && st.penSeen) return; // palm rejection once the Pencil is in use
    if (st.cur || !st.chars.length) return;
    e.preventDefault();
    try { canvas.setPointerCapture(e.pointerId); } catch {} // keeps the stroke going if the finger slides off the box
    stopOrder();
    if (st.results[st.i]) { st.results[st.i] = null; st.checked[st.i] = false; msg(''); update(); } // rewriting after a check
    st.cur = { id: e.pointerId, pts: [point(e)] };
    (st.ink[st.i] ||= []).push(st.cur.pts);
    drawStroke(st.cur.pts);
  });
  canvas.addEventListener('pointermove', e => {
    if (!st.cur || e.pointerId !== st.cur.id) return;
    const from = st.cur.pts.length;
    const evs = e.getCoalescedEvents?.(); // in-between points: smoother Pencil lines
    for (const ev of evs?.length ? evs : [e]) st.cur.pts.push(point(ev));
    drawStroke(st.cur.pts, from);
  });
  const end = e => { if (st.cur && e.pointerId === st.cur.id) { st.cur = null; renderSlots(); } };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);

  async function drawGuide() {
    const ch = st.chars[st.i], token = ++st.token;
    stopOrder();
    guide.innerHTML = `<text class="glyph" x="54.5" y="58" text-anchor="middle" dominant-baseline="middle" font-size="86">${esc(ch)}</text>`;
    const data = await loadStrokes(ch);
    if (token !== st.token || !data) return;
    const bad = st.results[st.i]?.bad;
    guide.innerHTML = data.paths.map((d, k) => `<path d="${esc(d)}"${k === bad ? ' class="bad"' : ''}/>`).join('') +
      `<g class="nums">${data.nums.map(n => `<text transform="${esc(n.at)}">${esc(n.n)}</text>`).join('')}</g>`;
  }
  function stopOrder() {
    st.timers.forEach(clearTimeout); st.timers = [];
    if (!st.order) return;
    st.order = false;
    guide.querySelectorAll('path').forEach(p => { p.style.transition = p.style.strokeDasharray = p.style.strokeDashoffset = ''; });
    update();
  }
  async function playOrder() {
    await loadStrokes(st.chars[st.i]);
    const paths = [...guide.querySelectorAll('path')];
    if (!paths.length) { msg(HAS_STROKE_DATA.test(st.chars[st.i]) ? 'Stroke order needs an internet connection the first time each character is shown.' : 'Stroke order isn’t available for Hangul yet. Tap “Trace” to write over the letter.'); return; }
    stopOrder(); st.order = true; update();
    let t = 300;
    for (const p of paths) {
      const len = p.getTotalLength(), dur = Math.max(350, len * 10);
      p.style.transition = 'none'; p.style.strokeDasharray = len; p.style.strokeDashoffset = len;
      st.timers.push(setTimeout(() => { p.style.transition = `stroke-dashoffset ${dur}ms linear`; p.style.strokeDashoffset = 0; }, t));
      t += dur + 200;
    }
  }

  function renderSlots() {
    q('.wp-top').hidden = st.chars.length < 2;
    q('.wp-slots').innerHTML = st.chars.map((c, k) => {
      const r = st.results[k], show = st.checked[k] || st.trace;
      const cls = (k === st.i ? ' cur' : '') + (st.ink[k]?.length ? ' inked' : '') + (r?.ok === true ? ' ok' : r?.ok === false ? ' bad' : '');
      return `<button type="button" class="slot${cls}" data-go="${k}" lang="ja">${show ? esc(c) : k + 1}</button>`;
    }).join('');
  }
  function showResult() {
    const r = st.results[st.i];
    if (r) msg((r.ok ? '✓ ' : r.ok === false ? '✗ ' : '') + r.reason, r.ok ? 'good' : r.ok === false ? 'bad' : '');
  }
  function update() {
    box.classList.toggle('trace', st.trace);
    box.classList.toggle('checked', !!st.checked[st.i]);
    box.classList.toggle('order', st.order);
    box.classList.toggle('has-bad', st.results[st.i]?.bad != null);
    q('[data-act="trace"]').classList.toggle('on', st.trace);
    q('[data-act="prev"]').disabled = st.i === 0;
    q('[data-act="next"]').disabled = st.i >= st.chars.length - 1;
    renderSlots();
  }
  function go(k) {
    if (k < 0 || k >= st.chars.length) return;
    st.i = k; msg(''); redraw(); drawGuide(); update(); showResult();
  }
  async function checkOne(k) {
    st.results[k] = await checkCharacter(st.chars[k], st.ink[k]);
    st.checked[k] = true;
  }

  root.addEventListener('click', async e => {
    const goTo = e.target.closest('[data-go]');
    if (goTo) return go(+goTo.dataset.go);
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (!act) return;
    e.target.blur();
    if (act === 'undo') { st.ink[st.i]?.pop(); redraw(); renderSlots(); }
    if (act === 'clear') { st.ink[st.i] = []; st.checked[st.i] = false; st.results[st.i] = null; msg(''); redraw(); drawGuide(); update(); }
    if (act === 'trace') { st.trace = !st.trace; update(); }
    if (act === 'order') playOrder();
    if (act === 'check') { await checkOne(st.i); stopOrder(); drawGuide(); update(); showResult(); }
    if (act === 'prev') go(st.i - 1);
    if (act === 'next') go(st.i + 1);
  });

  return {
    load(text, { trace = false } = {}) {
      Object.assign(st, { chars: writableChars(text), i: 0, ink: [], checked: [], results: [], trace, cur: null });
      msg(st.chars.length ? '' : 'Nothing to write here: this entry has no kana or kanji.');
      st.chars.forEach(loadStrokes); // prefetch so stroke order and checking are ready
      requestAnimationFrame(fit);
      if (st.chars.length) go(0); else { guide.innerHTML = ''; update(); }
    },
    // Check every character → {ok: true|false|null (couldn't check), results}
    async check() {
      await Promise.all(st.chars.map((_, k) => checkOne(k)));
      const firstBad = st.results.findIndex(r => r.ok !== true);
      stopOrder(); go(firstBad >= 0 ? firstBad : st.i);
      const ok = st.results.some(r => r.ok === false) ? false : st.results.every(r => r.ok === true) ? true : null;
      return { ok, results: st.results };
    },
    isEmpty: () => !st.ink.some(s => s?.length),
  };
}

/* ---------- practice dialog (from a character or a word) ---------- */
let dialogPad = null, writeWord = null;
function openWrite({ text, title, sub = '', trace = false, word = null }) {
  dialogPad ||= createPad(document.getElementById('wPad'));
  writeWord = word;
  document.getElementById('wTitle').textContent = title;
  document.getElementById('wSub').innerHTML = sub;
  document.getElementById('dWrite').showModal();
  dialogPad.load(text, { trace });
}
function writeChar(ch, romaji) {
  openWrite({ text: ch, title: `${ch}  ·  ${romaji}`, trace: true });
}
function writeWordEntry(w) {
  if (!w) return;
  const sub = `<button type="button" class="btn icon-btn" data-wsay aria-label="Play pronunciation">${ICON.speaker}</button>` +
    (w.reading ? ` <button type="button" class="btn" data-whint>Show reading</button>` : '');
  openWrite({ text: w.jp, title: w.meaning, sub, word: w });
}
document.getElementById('wSub').addEventListener('click', e => {
  if (e.target.closest('[data-wsay]')) sayWord(writeWord);
  const h = e.target.closest('[data-whint]');
  if (h) h.outerHTML = `<span class="f-read" lang="ja">${esc(writeWord.reading)}</span>`;
});
