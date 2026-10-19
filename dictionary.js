/* Dictionary search in the Words tab: look words up and add them to your notebook.
   Each language has its own file (LANGS[LANG].dict), loaded the first time something is searched:
   - Japanese: dict/jmdict-common.json, built by build-dictionary.py from JMdict, the property of the
     Electronic Dictionary Research and Development Group (EDRDG), used under its licence (CC BY-SA 4.0).
     Entries: [kanji forms, kana forms, senses (lists of English glosses), flags (1 = usually kana, 2 = phrase)]
   - Chinese: dict/zh.json, built by build-dictionary-cedict.py from CC-CEDICT (CC BY-SA 4.0).
     Entries: [simplified, traditional, pinyin (tone marks), senses, flags (2 = idiom), measure word]
   - French, Spanish, German, Korean: dict/<lang>.json, built by build-dictionary-wiktionary.py from Wiktionary
     (via kaikki.org) and FrequencyWords, both CC BY-SA 4.0.
     Entries: [display (with article), lemma, reading (IPA or romanization), senses, flags (2 = phrase), gender] */

let DICT = null, dictLoading = null, dictError = false, dictShown = [];

function loadDictionary() {
  dictLoading ||= fetch(L.dict)
    .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(d => {
      // Pre-normalise once so each search is a fast scan
      DICT = d.words.map(LANG === 'zh' ? e => ({
        e, word: e[0], trad: e[1], reading: e[2], senses: e[3], phrase: !!(e[4] & 2), mw: e[5],
        forms: [...new Set([e[0], e[1]])], pin: plainPinyin(e[2]),
        glosses: e[3].map(sense => sense.map(g => g.toLowerCase())),
      }) : LANG === 'ja' ? e => ({
        e, word: e[3] & 1 || !e[0].length ? e[1][0] : e[0][0], // how the word is usually written
        kana: e[1][0], senses: e[2], phrase: !!(e[3] & 2),
        forms: [...e[0], ...e[1]].map(norm),
        loose: e[1].map(k => looseKana(norm(k))),
        glosses: e[2].map(sense => sense.map(g => g.toLowerCase())),
      }) : e => ({
        e, word: e[0], lemma: e[1], reading: e[2], senses: e[3], phrase: !!(e[4] & 2), gender: e[5],
        forms: LANG === 'ko' ? [e[1]] : [...new Set([fold(e[0]), fold(e[1])])],
        roman: LANG === 'ko' ? [...new Set([looseRoman(e[2] || ''), looseRoman(romanizeKo(e[1]))])].filter(Boolean) : [],
        glosses: e[3].map(sense => sense.map(g => g.toLowerCase())),
      }));
      renderDict();
    })
    .catch(() => { dictError = true; dictLoading = null; renderDict(); });
  return dictLoading;
}

const isKanaOrKanji = s => /[ぁ-ヿ㐀-鿿]/.test(s);
const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Score how well the typed text matches the word itself (not its English meaning)
function wordScore(d, q) {
  let s = 0;
  if (LANG === 'ja') {
    const nq = norm(q);
    let kana = isKanaOrKanji(nq) ? nq : '';
    if (!kana && /^[a-z' -]+$/i.test(q)) { // romaji → kana, only if it converts completely
      const k = toKana(q.toLowerCase().replace(/[' ]/g, ''));
      if (!/[a-z]/.test(k)) kana = k;
    }
    if (!kana) return 0;
    for (const f of d.forms) {
      if (f === kana) s = Math.max(s, 100);
      else if (f.startsWith(kana)) s = Math.max(s, 70 - Math.min(20, f.length - kana.length));
      else if (kana.length > 1 && f.includes(kana)) s = Math.max(s, 35);
    }
    const lk = looseKana(kana);
    if (s < 95) d.loose.forEach((f, k) => { // e.g. koohii → コーヒー (same length beats こうひ)
      if (f === lk) s = Math.max(s, norm(d.e[1][k]).length === kana.length ? 95 : 90);
    });
    return s;
  }
  if (LANG === 'zh') { // characters (simplified or traditional), or pinyin with or without tones
    const hanzi = /[\u3400-\u9fff]/.test(q), f0 = hanzi ? q.replace(/\s+/g, '') : plainPinyin(q);
    if (!f0) return 0;
    for (const f of hanzi ? d.forms : [d.pin]) {
      if (f === f0) s = Math.max(s, 100);
      else if (f.startsWith(f0)) s = Math.max(s, 70 - Math.min(20, f.length - f0.length));
      else if (hanzi && f.includes(f0)) s = Math.max(s, 35);
    }
    return s;
  }
  // French/German: accents, case and the article don't matter; Korean: Hangul or loose romanization
  const latinKo = LANG === 'ko' && !/[가-힣]/.test(q);
  const forms = latinKo ? d.roman : d.forms;
  const f0 = LANG === 'ko' ? (latinKo ? looseRoman(q) : q.replace(/\s+/g, '')) : fold(stripArticle(q));
  if (!f0) return 0;
  // German typed without umlauts: maedchen → madchen (folded forms already turn ä into a)
  const qs = LANG === 'de' && collapseUmlauts(f0) !== f0 ? [f0, collapseUmlauts(f0)] : [f0];
  for (const f of forms) for (const qq of qs) {
    const g = LANG === 'ko' ? f : stripArticle(f);
    if (g === qq || f === qq) s = Math.max(s, 100);
    else if (g.startsWith(qq)) s = Math.max(s, 70 - Math.min(20, g.length - qq.length));
    else if (qq.length > 2 && g.includes(qq)) s = Math.max(s, 35);
  }
  return s;
}

function searchDict(q) {
  q = q.trim();
  const en = /[a-z]/i.test(q) ? q.toLowerCase() : '';
  const enWord = en && new RegExp(`(^|[^a-z])${escRe(en)}([^a-z]|$)`);
  const hits = [];
  for (const d of DICT) {
    let s = wordScore(d, q);
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
  // Ties: Japanese prefers shorter words; the other dictionaries are already in frequency order
  hits.sort((a, b) => b[0] - a[0] || (LANG === 'ja' ? a[1].word.length - b[1].word.length : 0));
  return hits.slice(0, 30).map(h => h[1]);
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

function inNotebook(d) {
  if (LANG === 'zh') return words.some(w => d.forms.includes(w.jp));
  if (LANG === 'ja') {
    const forms = new Set([...d.e[0], ...d.e[1]].map(norm));
    return words.some(w => forms.has(norm(w.jp)));
  }
  const forms = new Set([d.word, d.lemma].map(x => fold(stripArticle(x))));
  return words.some(w => forms.has(fold(stripArticle(w.jp))));
}

const GENDER = { m: 'masculine', f: 'feminine', n: 'neuter', pl: 'plural' };

function renderDict() {
  const box = $('dictBox'), q = $('q').value.trim();
  box.hidden = !q || !L.dict; // blank projects have no dictionary
  if (!q) return;
  if (!DICT) {
    $('dictList').innerHTML = `<div class="empty">${dictError ? 'The dictionary couldn’t load. Check your connection and search again.' : 'Loading the dictionary…'}</div>`;
    if (!dictError) loadDictionary(); else dictError = false; // next search retries
    return;
  }
  dictShown = searchDict(q);
  $('dictList').innerHTML = dictShown.length ? dictShown.map((d, i) => {
    const reading = LANG === 'ja' ? (d.kana !== d.word ? d.kana : '') : LANG === 'zh' && d.trad !== d.word ? `${d.reading} · ${d.trad}` : d.reading;
    const senses = d.senses.slice(0, 3).map((s, k) => `<span class="sense">${d.senses.length > 1 ? `<b>${k + 1}</b> ` : ''}${esc(s.join('; '))}</span>`).join(' ');
    const tag = d.phrase ? 'phrase' : GENDER[d.gender] || '';
    return `<div class="card dict-card">
      <div><span class="jp" lang="${LANG}">${esc(d.word)}</span>${reading ? ` <span class="reading" lang="${LANG}">${esc(reading)}</span>` : ''}${tag ? ` <span class="type">${tag}</span>` : ''}</div>
      ${inNotebook(d) ? '<span class="dict-added">✓ Added</span>' : `<button class="btn primary small" data-add="${i}">+ Add</button>`}
      <div class="meaning dict-senses">${senses}</div>
    </div>`;
  }).join('') : '<div class="empty">No dictionary matches.</div>';
}

// Short meaning for the notebook: drop dictionary asides like "(esp. cool or cold)" and long explanations
const tidyGloss = g => g.replace(/\s*\((esp|e\.g|i\.e|usu|lit|orig|obs|oft|in ref)\.?[^)]*\)/gi, '')
  .replace(/^\((loanword|coll\.|colloquial|informal|formal)\)\s*(?=\S)/i, '').trim(); // "(loanword) coffee" → "coffee"
function shortMeaning(sense) {
  const gl = sense.map(tidyGloss).filter(Boolean);
  return [gl[0], ...gl.slice(1).filter(g => g.length <= 25)].slice(0, 3).join('; ');
}

function addFromDict(d) {
  let jp = d.word, reading = d.reading;
  if (LANG === 'zh' && $('dictSpell').value === 'trad') jp = d.trad;
  if (LANG === 'ja') {
    if ($('dictSpell').value === 'kana') jp = d.kana;
    reading = /[㐀-鿿]/.test(jp) ? d.kana : toRomaji(jp); // kanji words get their kana; kana words get romaji
  }
  const [first, ...more] = d.senses;
  const meaning = shortMeaning(first);
  // Notes keep the full first meaning (if it was shortened), the other meanings and, where the
  // article doesn't show it (l’école), the gender
  const notes = [
    meaning !== first.join('; ') ? first.join('; ') : '',
    more.length ? 'Also: ' + more.map(s => s.join('; ')).join(' · ') : '',
    LANG === 'fr' && /^l’/.test(jp) && GENDER[d.gender] ? `Gender: ${GENDER[d.gender]}` : '',
    LANG === 'zh' && d.mw ? `Measure word: ${d.mw}` : '',
    LANG === 'zh' && d.trad !== d.word ? (jp === d.trad ? `Simplified: ${d.word}` : `Traditional: ${d.trad}`) : '',
  ].filter(Boolean).join('\n');
  const id = uid();
  words.push({ id, added: Date.now(), jp, reading, meaning, type: d.phrase ? 'phrase' : 'word', tags: parseTags($('dictTag').value), notes });
  persist({ words: [id] });
  render();
}

$('dictList').addEventListener('click', ev => {
  const b = ev.target.closest('[data-add]');
  if (b) addFromDict(dictShown[+b.dataset.add]);
});
// Remember the tag and spelling choice for added words, per device and language
for (const [id, key] of [['dictTag', lkey('dictTag')], ['dictSpell', lkey('dictSpell')]]) {
  try { const v = localStorage.getItem(key); if (v) $(id).value = v; } catch {}
  $(id).addEventListener('input', () => { try { localStorage.setItem(key, $(id).value); } catch {} });
}
