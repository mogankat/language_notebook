#!/usr/bin/env python3
"""Build dict/jmdict-common.json, the compact dictionary the Words tab searches.

Source: JMdict common words in JSON from https://github.com/scriptin/jmdict-simplified/releases
(download jmdict-eng-common-*.json.tgz and extract it), then run:

    python3 build-dictionary.py path/to/jmdict-eng-common-X.Y.Z.json

JMdict is the property of the Electronic Dictionary Research and Development Group (EDRDG)
and is used under its licence (CC BY-SA 4.0): https://www.edrdg.org/edrdg/licence.html

Output: {"date": ..., "words": [[kanji forms], [kana forms], [[glosses of sense 1], ...], flags]}
flags: 1 = usually written in kana, 2 = expression/phrase
"""
import json, os, sys

MAX_SENSES, MAX_GLOSSES = 4, 4

def build(src):
    d = json.load(open(src, encoding='utf-8'))
    out = []
    for w in d['words']:
        # common spellings first
        kanji = [k['text'] for k in sorted(w['kanji'], key=lambda k: not k['common'])]
        kana = [k['text'] for k in sorted(w['kana'], key=lambda k: not k['common'])]
        senses, flags = [], 0
        for s in w['sense'][:MAX_SENSES]:
            glosses = [g['text'] for g in s['gloss'] if g['lang'] == 'eng'][:MAX_GLOSSES]
            if glosses:
                senses.append(glosses)
        if not senses or not kana:
            continue
        first = w['sense'][0]
        if 'uk' in first['misc'] or not kanji:
            flags |= 1
        if 'exp' in first['partOfSpeech']:
            flags |= 2
        out.append([kanji, kana, senses, flags])
    return {'date': d.get('dictDate'), 'source': 'JMdict (EDRDG), CC BY-SA 4.0', 'words': out}

if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    data = build(sys.argv[1])
    here = os.path.dirname(os.path.abspath(__file__))
    os.makedirs(os.path.join(here, 'dict'), exist_ok=True)
    dest = os.path.join(here, 'dict', 'jmdict-common.json')
    with open(dest, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, separators=(',', ':'))
    print(f"{len(data['words'])} words → {dest} ({os.path.getsize(dest) / 1e6:.1f} MB)")
