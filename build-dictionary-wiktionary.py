#!/usr/bin/env python3
"""Build dict/<lang>.json (French, German or Korean) for the Words tab dictionary.

Sources (download both, then run this script):
  - Wiktionary entries extracted by kaikki.org (CC BY-SA 4.0 / GFDL):
      https://kaikki.org/dictionary/French/kaikki.org-dictionary-French.jsonl   (and German, Korean)
  - Word frequencies from OpenSubtitles, by Hermit Dave (CC BY-SA 4.0):
      https://github.com/hermitdave/FrequencyWords  content/2018/<fr|de|ko>/<fr|de|ko>_50k.txt

    python3 build-dictionary-wiktionary.py fr kaikki.org-dictionary-French.jsonl fr_50k.txt

Keeps the most frequent base words (not inflected forms) plus common phrases whose words are all
frequent. Output: {"lang", "words": [[display, lemma, reading, senses, flags, gender]]}
  display: with article for nouns (le chat, l’école, die Katze); reading: IPA (fr/de) or
  romanization (ko); senses: lists of English glosses; flags: 2 = phrase; gender: m/f/n/pl or "".
"""
import json, os, re, sys

MAX_WORDS, MAX_PHRASES, MAX_SENSES, MAX_GLOSSES = 15000, 6000, 4, 4
SKIP_POS = {'name', 'character', 'symbol', 'prefix', 'suffix', 'infix', 'affix', 'interfix', 'circumfix',
            'punct', 'romanization', 'proverb', 'contraction'}
FORM_TAGS = {'form-of', 'alt-of', 'misspelling', 'obsolete', 'archaic', 'dated', 'abbreviation', 'initialism'}
VOWEL_START = re.compile(r'^[aeiouyàâäéèêëîïôöûùüœæ]', re.I)

def load_freq(path):
    rank = {}
    for i, line in enumerate(open(path, encoding='utf-8')):
        w = line.split(' ')[0].strip().lower()
        if w and w not in rank:
            rank[w] = i
    return rank

def gender_of(e):
    # Headword template first ("m,,^" → m); a rare plural-only sense must not turn der Apfel into die Apfel
    for h in e.get('head_templates') or []:
        args = h.get('args') or {}
        g = (args.get('1') or args.get('g') or '').split(',')[0].strip()
        if g in ('m', 'f', 'n'):
            return g
        if g in ('p', 'pl'):
            return 'pl'
        if g in ('mf', 'm-f', 'f-m', 'mfbysense'):
            return ''
    tags = set(((e.get('senses') or [{}])[0].get('tags')) or [])
    if 'masculine' in tags and 'feminine' in tags:
        return ''
    for t, g in (('masculine', 'm'), ('feminine', 'f'), ('neuter', 'n')):
        if t in tags:
            return g
    return 'pl' if 'plural-only' in tags else ''

# Clear meanings for key beginner phrases whose Wiktionary glosses are grammar descriptions
OVERRIDES = {'ko': {
    '감사합니다': 'thank you (formal)', '고맙습니다': 'thank you (formal)', '고마워요': 'thank you (polite)',
    '안녕하세요': 'hello', '안녕': 'hi; bye (casual)', '안녕히 가세요': 'goodbye (to someone leaving)',
    '안녕히 계세요': 'goodbye (when you are leaving)', '네': 'yes', '예': 'yes', '아니요': 'no',
    '죄송합니다': 'I’m sorry (formal)', '미안해요': 'I’m sorry (polite)', '괜찮아요': 'it’s okay; I’m fine',
    '주세요': 'please give me', '실례합니다': 'excuse me',
}}

def with_article(lang, word, gender, ipa=''):
    if re.match(r"^(le|la|les|l'|l’|un|une|des|der|die|das|ein|eine) ", word, re.I) or re.match(r"^l['’]", word, re.I):
        return word  # phrase already starts with an article
    if lang == 'fr':
        if gender == 'pl':
            return 'les ' + word
        if gender in ('m', 'f'):
            # l’ before a vowel sound, including silent h (l’homme) but not aspirated h (le héros, IPA starts with a consonant)
            elide = VOWEL_START.match(word) or (word[:1].lower() == 'h' and IPA_VOWEL.match(ipa or '') and word.lower() not in H_ASPIRE)
            return ('l’' + word) if elide else ('le ' if gender == 'm' else 'la ') + word
    if lang == 'de':
        art = {'m': 'der', 'f': 'die', 'n': 'das', 'pl': 'die'}.get(gender)
        if art:
            return f'{art} {word}'
    return word

def reading_of(lang, e):
    if lang == 'ko':
        for f in e.get('forms') or []:
            if 'romanization' in (f.get('tags') or []):
                return f['form'].strip('?!. ')
        return ''
    ipas = [s['ipa'] for s in e.get('sounds') or [] if s.get('ipa')]
    slash = [i for i in ipas if i.startswith('/')]
    return (slash or ipas or [''])[0]

def good_senses(e):
    out = []
    for s in e.get('senses', []):
        if s.get('form_of') or s.get('alt_of') or set(s.get('tags') or []) & FORM_TAGS:
            continue
        g = [x for x in (s.get('glosses') or [])[-1:] if x and not re.match(r'^(plural|inflection|feminine|masculine|past participle|present participle|alternative|obsolete) (of|form)', x)]
        if g:
            # one sense = one gloss line; split long "a, b, c" lists into separate glosses
            parts = [shorten(p.strip()) for p in re.split(r';\s*', g[0]) if p.strip()]
            out.append(parts[:MAX_GLOSSES])
    return out

def shorten(gloss):
    # "water, a liquid that is transparent, ..." → "water"
    if len(gloss) > 60:
        head = re.split(r',\s|\s\(', gloss)[0].strip()
        if 2 < len(head) < len(gloss):
            return head
    return gloss

# Wiktionary doesn't mark aspirated h, so common ones are listed: le héros, not l’héros
H_ASPIRE = set('''hache haie haine hall hamac hameau hamster hanche handicap hangar hareng haricot harpe hasard hâte
hausse haut hauteur havre hérisson héros hibou hockey homard honte hors-d’œuvre houx hublot huée huit hurlement hutte
hiérarchie hockey hollande hongrie hall halte hamburger hantise harnais hère hernie hêtre hiboux hippie hit hobby'''.split())

PHRASE_POS = {'phrase', 'intj', 'noun', 'verb', 'adj'}  # multi-word entries worth keeping (not "de la")
IPA_VOWEL = re.compile(r'^[/\[]?[aeiouyɛɔøœəɑɐɪʊʏ]')

def korean_rank(word, rank, tokens_by_first):
    if word.lower() in rank:
        return rank[word.lower()]
    if word.endswith('다') and len(word) >= 2:  # verbs/adjectives appear conjugated: match the stem
        stem = word[:-1]
        best = None
        for tok, r in tokens_by_first.get(stem[0], ()):
            if tok.startswith(stem) and len(tok) <= len(stem) + 3 and tok != stem:
                best = r if best is None else min(best, r)
        if best is not None:
            return best + 200  # a little behind exact matches
    return None

def build(lang, kaikki, freq):
    rank = load_freq(freq)
    tokens_by_first = {}
    if lang == 'ko':
        for tok, r in rank.items():
            tokens_by_first.setdefault(tok[0], []).append((tok, r))
    words, phrases = {}, {}
    for line in open(kaikki, encoding='utf-8'):
        e = json.loads(line)
        w, pos = e.get('word', ''), e.get('pos', '')
        if not w or pos in SKIP_POS or e.get('lang_code') not in (None, lang):
            continue
        senses = good_senses(e)
        if not senses:
            continue
        is_phrase = ' ' in w.strip() or pos == 'phrase'
        if is_phrase:
            if pos not in PHRASE_POS:
                continue
            toks = re.findall(r"\w+", w.lower())
            if not toks or len(toks) > 5 or any(rank.get(t, 10**9) > 20000 for t in toks):
                continue
            r = max(rank.get(t, 10**9) for t in toks)
            target = phrases
        else:
            r = korean_rank(w, rank, tokens_by_first) if lang == 'ko' else rank.get(w.lower())
            if r is None or r > 40000:
                continue
            target = words
        g = gender_of(e) if pos == 'noun' else ''
        item = target.setdefault(w, {'rank': r, 'senses': [], 'gender': '', 'reading': '', 'phrase': is_phrase, 'pos': set()})
        item['rank'] = min(item['rank'], r)
        item['senses'] += senses
        item['pos'].add(pos)
        item['gender'] = item['gender'] or g
        item['reading'] = item['reading'] or reading_of(lang, e)
    if lang == 'de':  # "Ich"/"Du" nouns borrow the frequency of the pronouns ich/du: drop them
        for w in [w for w, it in words.items() if w[:1].isupper() and it['pos'] == {'noun'}]:
            twin = words.get(w.lower())
            if twin and twin['pos'] & {'pron', 'det', 'article', 'particle', 'conj', 'prep'}:
                del words[w]
    for w, meaning in OVERRIDES.get(lang, {}).items():
        for items in (words, phrases):
            if w in items:
                items[w]['senses'].insert(0, [meaning])
    def pack(items, limit):
        out = []
        for w, it in sorted(items.items(), key=lambda kv: kv[1]['rank'])[:limit]:
            senses = []
            for s in it['senses']:
                if s not in senses:
                    senses.append(s)
            # Article only for words that are always nouns ("le chat", but not "manger" or "merci")
            gender = it['gender'] if it['pos'] == {'noun'} else ''
            out.append([with_article(lang, w, gender, it['reading']), w, it['reading'], senses[:MAX_SENSES],
                        2 if it['phrase'] else 0, gender])
        return out
    return {'lang': lang, 'source': 'Wiktionary via kaikki.org (CC BY-SA 4.0); frequencies: Hermit Dave FrequencyWords (CC BY-SA 4.0)',
            'words': pack(words, MAX_WORDS) + pack(phrases, MAX_PHRASES)}

if __name__ == '__main__':
    if len(sys.argv) != 4 or sys.argv[1] not in ('fr', 'de', 'ko'):
        sys.exit(__doc__)
    lang = sys.argv[1]
    data = build(lang, sys.argv[2], sys.argv[3])
    here = os.path.dirname(os.path.abspath(__file__))
    os.makedirs(os.path.join(here, 'dict'), exist_ok=True)
    dest = os.path.join(here, 'dict', f'{lang}.json')
    with open(dest, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, separators=(',', ':'))
    print(f"{lang}: {len(data['words'])} entries → {dest} ({os.path.getsize(dest) / 1e6:.1f} MB)")
