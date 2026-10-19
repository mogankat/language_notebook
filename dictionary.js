/* Dictionary search in the Words tab: look words up in JMdict and add them to your notebook.
   Data: dict/jmdict-common.json, built by build-dictionary.py from JMdict, the property of the
   Electronic Dictionary Research and Development Group (EDRDG), used under its licence (CC BY-SA 4.0).
   Entries are [kanji forms, kana forms, senses (lists of English glosses), flags (1 = usually kana, 2 = phrase)].
   The file loads the first time something is searched. */

let DICT = null, dictLoading = null, dictError = false, dictShown = [];

function loadDictionary() {
  dictLoading ||= fetch('dict/jmdict-common.json')
    .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(d => {
      // Pre-normalise once so each search is a fast scan
      DICT = d.words.map(e => ({
        e,
        forms: [...e[0], ...e[1]].map(norm),
        loose: e[1].map(k => looseKana(norm(k))),
        glosses: e[2].map(sense => sense.map(g => g.toLowerCase())),
      }));
      renderDict();
    })
    .catch(() => { dictError = true; dictLoading = null; renderDict(); });
  return dictLoading;
}

const isKanaOrKanji = s => /[ぁ-ヿ㐀-鿿]/.test(s);
const dictWord = e => (e[3] & 1 || !e[0].length ? e[1][0] : e[0][0]); // how the word is usually written
const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function searchDict(q) {
  q = q.trim();
  const nq = norm(q);
  let kana = isKanaOrKanji(nq) ? nq : '';
  if (!kana && /^[a-z' -]+$/i.test(q)) { // romaji → kana, only if it converts completely
    const k = toKana(q.toLowerCase().replace(/[' ]/g, ''));
    if (!/[a-z]/.test(k)) kana = k;
  }
  const en = /[a-z]/i.test(q) ? q.toLowerCase() : '';
  const enWord = en && new RegExp(`(^|[^a-z])${escRe(en)}([^a-z]|$)`);
  const lk = kana && looseKana(kana);
  const hits = [];
  for (const d of DICT) {
    let s = 0;
    if (kana) {
      for (const f of d.forms) {
        if (f === kana) s = Math.max(s, 100);
        else if (f.startsWith(kana)) s = Math.max(s, 70 - Math.min(20, f.length - kana.length));
        else if (kana.length > 1 && f.includes(kana)) s = Math.max(s, 35);
      }
      if (s < 95) d.loose.forEach((f, k) => { // e.g. koohii → コーヒー (same length beats こうひ)
        if (f === lk) s = Math.max(s, norm(d.e[1][k]).length === kana.length ? 95 : 90);
      });
    }
    if (en) {
      d.glosses.forEach((sense, si) => sense.forEach((g, gi) => {
        let core = g; // strip (asides), including nested ones like "dog (Canis (lupus) familiaris)"
        while (/\([^()]*\)/.test(core)) core = core.replace(/\s*\([^()]*\)/g, '');
        core = core.replace(/^to /, '').trim();
        let v = core === en || g === en ? 95 : enWord.test(g) ? 60 : en.length > 2 && g.includes(en) ? 25 : 0;
        if (v) s = Math.max(s, v - si * 8 - gi * 2); // earlier meanings rank higher
      }));
    }
    if (s > 0) hits.push([s, d]);
  }
  hits.sort((a, b) => b[0] - a[0] || dictWord(a[1].e).length - dictWord(b[1].e).length);
  return hits.slice(0, 30).map(h => h[1].e);
}

// Kana → romaji for readings of kana-only words (すし → sushi), using the converter table in reverse
const ROMAJI = (() => {
  const prefer = new Set(['shi', 'chi', 'tsu', 'fu', 'ji', 'sha', 'shu', 'sho', 'cha', 'chu', 'cho', 'ja', 'ju', 'jo']), m = {};
  for (const [r, k] of Object.entries(R)) if (/^[a-z]+$/.test(r) && (!m[k] || prefer.has(r))) m[k] = r;
  m['ん'] = 'n';
  return m;
})();
function toRomaji(s) {
  s = toHira(s); let out = '';
  for (let i = 0; i < s.length; i++) {
    const two = ROMAJI[s.substr(i, 2)];
    if (two) { out += two; i++; continue; }
    const c = s[i];
    if (c === 'っ') { const next = ROMAJI[s.substr(i + 1, 2)] || ROMAJI[s[i + 1]] || ''; out += next[0] || ''; continue; }
    if (c === 'ー') { const v = out.match(/[aiueo](?=[^aiueo]*$)/); out += v ? v[0] : '-'; continue; }
    out += ROMAJI[c] || c;
  }
  return out;
}

function inNotebook(e) {
  const forms = new Set([...e[0], ...e[1]].map(norm));
  return words.some(w => forms.has(norm(w.jp)));
}

function renderDict() {
  const box = $('dictBox'), q = $('q').value.trim();
  box.hidden = !q;
  if (!q) return;
  if (!DICT) {
    $('dictList').innerHTML = `<div class="empty">${dictError ? 'The dictionary couldn’t load. Check your connection and search again.' : 'Loading the dictionary…'}</div>`;
    if (!dictError) loadDictionary(); else dictError = false; // next search retries
    return;
  }
  dictShown = searchDict(q);
  $('dictList').innerHTML = dictShown.length ? dictShown.map((e, i) => {
    const jp = dictWord(e), reading = e[1][0] !== jp ? e[1][0] : '';
    const senses = e[2].slice(0, 3).map((s, k) => `<span class="sense">${e[2].length > 1 ? `<b>${k + 1}</b> ` : ''}${esc(s.join('; '))}</span>`).join(' ');
    const added = inNotebook(e);
    return `<div class="card dict-card">
      <div><span class="jp" lang="ja">${esc(jp)}</span>${reading ? ` <span class="reading" lang="ja">${esc(reading)}</span>` : ''}${e[3] & 2 ? ' <span class="type">phrase</span>' : ''}</div>
      ${added ? '<span class="dict-added">✓ Added</span>' : `<button class="btn primary small" data-add="${i}">+ Add</button>`}
      <div class="meaning dict-senses">${senses}</div>
    </div>`;
  }).join('') : '<div class="empty">No dictionary matches.</div>';
}

// Short meaning for the notebook: drop dictionary asides like "(esp. cool or cold)" and long explanations
const tidyGloss = g => g.replace(/\s*\((esp|e\.g|i\.e|usu|lit|orig|obs|oft|in ref)\.?[^)]*\)/gi, '').trim();
function shortMeaning(sense) {
  const gl = sense.map(tidyGloss).filter(Boolean);
  return [gl[0], ...gl.slice(1).filter(g => g.length <= 25)].slice(0, 3).join('; ');
}

function addFromDict(e) {
  const kanaOnly = $('dictSpell').value === 'kana';
  const jp = kanaOnly ? e[1][0] : dictWord(e), hasKanji = /[㐀-鿿]/.test(jp);
  const [first, ...more] = e[2];
  const meaning = shortMeaning(first);
  // Notes keep the full first meaning (if it was shortened) and the other meanings
  const notes = [meaning !== first.join('; ') ? first.join('; ') : '', more.length ? 'Also: ' + more.map(s => s.join('; ')).join(' · ') : '']
    .filter(Boolean).join('\n');
  const id = uid();
  words.push({
    id, added: Date.now(), jp,
    reading: hasKanji ? e[1][0] : toRomaji(jp), // kanji words get their kana; kana words get romaji
    meaning,
    type: e[3] & 2 ? 'phrase' : 'word',
    tags: parseTags($('dictTag').value),
    notes,
  });
  persist({ words: [id] });
  render();
}

$('dictList').addEventListener('click', ev => {
  const b = ev.target.closest('[data-add]');
  if (b) addFromDict(dictShown[+b.dataset.add]);
});
// Remember the tag and spelling choice for added words, per device
for (const [id, key] of [['dictTag', 'jn.dictTag'], ['dictSpell', 'jn.dictSpell']]) {
  try { const v = localStorage.getItem(key); if (v) $(id).value = v; } catch {}
  $(id).addEventListener('input', () => { try { localStorage.setItem(key, $(id).value); } catch {} });
}
