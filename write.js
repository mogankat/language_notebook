/* Handwriting practice: write with a finger, mouse or Apple Pencil, compare with the real
   character, and watch the stroke order.
   Stroke order data: KanjiVG by Ulrich Apel, CC BY-SA 3.0 (https://kanjivg.tagaini.net),
   fetched per character on demand. Without it (e.g. offline) the pad falls back to a font glyph. */

const KVG_BASE = 'https://cdn.jsdelivr.net/gh/KanjiVG/kanjivg@r20250816/kanji/';
const kvgCache = new Map();
// Kana, ー, 々 and kanji: the characters worth practising (skips ~, spaces, punctuation, romaji)
const WRITABLE = /[ぁ-ゖゝゞァ-ヺー-ヾ々㐀-䶿一-鿿豈-﫿]/;
const writableChars = text => [...String(text || '')].filter(c => WRITABLE.test(c));

function loadStrokes(ch) {
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

/* createPad(root, {checkButton}) builds a pad inside root.
   pad.load(text, {trace}) practises each writable character of text in turn;
   pad.revealAll() shows the correct characters over everything written. */
function createPad(root, { checkButton = true } = {}) {
  root.classList.add('wp');
  root.innerHTML = `
    <div class="wp-slots"></div>
    <div class="wp-box">
      <svg class="wp-grid" viewBox="0 0 100 100" aria-hidden="true"><path d="M50 2V98M2 50H98"/></svg>
      <svg class="wp-guide" viewBox="0 0 109 109" aria-hidden="true"></svg>
      <canvas aria-label="Writing area"></canvas>
    </div>
    <div class="wp-tools">
      <button type="button" class="btn" data-act="undo">↶ Undo</button>
      <button type="button" class="btn" data-act="clear">Clear</button>
      <button type="button" class="btn" data-act="trace">Trace</button>
      <button type="button" class="btn" data-act="order">Stroke order</button>
    </div>
    <div class="wp-nav">
      <button type="button" class="btn" data-act="prev">‹ Prev</button>
      ${checkButton ? '<button type="button" class="btn primary" data-act="check">Check</button>' : '<span></span>'}
      <button type="button" class="btn" data-act="next">Next ›</button>
    </div>
    <p class="wp-msg"></p>
    <p class="wp-credit">Stroke order: <a href="https://kanjivg.tagaini.net" target="_blank" rel="noopener">KanjiVG</a> (CC BY-SA 3.0)</p>`;
  const q = s => root.querySelector(s);
  const box = q('.wp-box'), canvas = q('canvas'), guide = q('.wp-guide'), ctx = canvas.getContext('2d');
  // ink[i] = strokes for character i; a stroke is a list of [x, y, pressure] in 0..1 box coordinates
  const st = { chars: [], i: 0, ink: [], checked: [], trace: false, order: false, penSeen: false, cur: null, token: 0, timers: [] };

  const msg = t => { q('.wp-msg').textContent = t || ''; };
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
    canvas.setPointerCapture(e.pointerId);
    stopOrder();
    st.cur = { id: e.pointerId, pts: [point(e)] };
    (st.ink[st.i] ||= []).push(st.cur.pts);
    drawStroke(st.cur.pts);
  });
  canvas.addEventListener('pointermove', e => {
    if (!st.cur || e.pointerId !== st.cur.id) return;
    const from = st.cur.pts.length;
    for (const ev of e.getCoalescedEvents?.() || [e]) st.cur.pts.push(point(ev)); // smoother Pencil lines
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
    guide.innerHTML = data.paths.map(d => `<path d="${esc(d)}"/>`).join('') +
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
    if (!paths.length) { msg('Stroke order needs an internet connection the first time each character is shown.'); return; }
    stopOrder(); st.order = true; update(); msg('');
    let t = 300;
    for (const p of paths) {
      const len = p.getTotalLength(), dur = Math.max(350, len * 10);
      p.style.transition = 'none'; p.style.strokeDasharray = len; p.style.strokeDashoffset = len;
      st.timers.push(setTimeout(() => { p.style.transition = `stroke-dashoffset ${dur}ms linear`; p.style.strokeDashoffset = 0; }, t));
      t += dur + 200;
    }
  }

  function renderSlots() {
    const slots = q('.wp-slots');
    slots.hidden = st.chars.length < 2;
    slots.innerHTML = st.chars.map((c, k) => {
      const show = st.checked[k] || st.trace;
      return `<button type="button" class="slot${k === st.i ? ' cur' : ''}${st.ink[k]?.length ? ' inked' : ''}" data-go="${k}" lang="ja">${show ? esc(c) : k + 1}</button>`;
    }).join('');
  }
  function update() {
    box.classList.toggle('trace', st.trace);
    box.classList.toggle('checked', !!st.checked[st.i]);
    box.classList.toggle('order', st.order);
    q('[data-act="trace"]').classList.toggle('on', st.trace);
    const multi = st.chars.length > 1;
    q('[data-act="prev"]').style.visibility = multi ? '' : 'hidden';
    q('[data-act="next"]').style.visibility = multi ? '' : 'hidden';
    q('[data-act="prev"]').disabled = st.i === 0;
    q('[data-act="next"]').disabled = st.i >= st.chars.length - 1;
    renderSlots();
  }
  function go(k) {
    if (k < 0 || k >= st.chars.length) return;
    st.i = k; msg(''); redraw(); drawGuide(); update();
  }

  root.addEventListener('click', e => {
    const goTo = e.target.closest('[data-go]');
    if (goTo) return go(+goTo.dataset.go);
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (!act) return;
    e.target.blur();
    if (act === 'undo') { st.ink[st.i]?.pop(); redraw(); renderSlots(); }
    if (act === 'clear') { st.ink[st.i] = []; st.checked[st.i] = false; redraw(); update(); }
    if (act === 'trace') { st.trace = !st.trace; update(); }
    if (act === 'order') playOrder();
    if (act === 'check') { st.checked[st.i] = true; update(); msg('Your writing is under the red character. Tap “Stroke order” to see how it’s written.'); }
    if (act === 'prev') go(st.i - 1);
    if (act === 'next') go(st.i + 1);
  });

  return {
    load(text, { trace = false } = {}) {
      Object.assign(st, { chars: writableChars(text), i: 0, ink: [], checked: [], trace, cur: null });
      msg(st.chars.length ? '' : 'Nothing to write here: this entry has no kana or kanji.');
      st.chars.forEach(loadStrokes); // prefetch so stroke order is ready
      requestAnimationFrame(fit);
      if (st.chars.length) go(0); else { guide.innerHTML = ''; update(); }
    },
    revealAll() { st.checked = st.chars.map(() => true); stopOrder(); update(); },
  };
}

/* ---------- practice dialog (from a character or a word) ---------- */
let dialogPad = null, writeWord = null;
function openWrite({ text, title, sub = '', trace = false, word = null }) {
  dialogPad ||= createPad($('wPad'));
  writeWord = word;
  $('wTitle').textContent = title;
  $('wSub').innerHTML = sub;
  $('dWrite').showModal();
  dialogPad.load(text, { trace });
}
function writeChar(ch, romaji) {
  openWrite({ text: ch, title: `${ch}  ·  ${romaji}`, trace: true });
}
function writeWordEntry(w) {
  if (!w) return;
  const sub = `<button type="button" class="btn" data-wsay>🔊</button>` +
    (w.reading ? ` <button type="button" class="btn" data-whint>Show reading</button>` : '');
  openWrite({ text: w.jp, title: w.meaning, sub, word: w });
}
document.getElementById('wSub').addEventListener('click', e => {
  if (e.target.closest('[data-wsay]')) sayWord(writeWord);
  const h = e.target.closest('[data-whint]');
  if (h) h.outerHTML = `<span class="f-read" lang="ja">${esc(writeWord.reading)}</span>`;
});
