#!/usr/bin/env python3
"""Build dict/zh.json, the Chinese dictionary for the Words tab.

Sources (download both, then run this script):
  - CC-CEDICT (CC BY-SA 4.0): https://www.mdbg.net/chinese/export/cedict/cedict_1_0_ts_utf-8_mdbg.txt.gz (gunzip it)
  - Word frequencies from OpenSubtitles, by Hermit Dave (CC BY-SA 4.0):
      https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/zh_cn/zh_cn_50k.txt

    python3 build-dictionary-cedict.py cedict_1_0_ts_utf-8_mdbg.txt zh_cn_50k.txt

Output: {"lang": "zh", "words": [[simplified, traditional, pinyin, senses, flags, measure word]]}
  pinyin has tone marks (nǐ hǎo); senses: lists of English glosses; flags: 2 = idiom/phrase.
"""
import json, os, re, sys

MAX_WORDS, MAX_SENSES = 15000, 4
LINE = re.compile(r'^(\S+) (\S+) \[([^\]]+)\] /(.+)/$')
SKIP_GLOSS = re.compile(r'^(surname |variant of|old variant of|archaic variant|see |used in |abbr\. for|(\(.*\) )?Japanese variant|erhua variant)', re.I)
TONES = {'a': 'āáǎà', 'e': 'ēéěè', 'i': 'īíǐì', 'o': 'ōóǒò', 'u': 'ūúǔù', 'ü': 'ǖǘǚǜ'}

def marks(pinyin):
    out = []
    for syl in pinyin.split():
        m = re.match(r'^([a-zA-Z:]+)([1-5])$', syl)
        if not m:
            out.append(syl.replace('u:', 'ü'))
            continue
        base, tone = m.group(1).replace('u:', 'ü').replace('U:', 'Ü'), int(m.group(2))
        if tone == 5:
            out.append(base)
            continue
        low = base.lower()
        i = low.find('a')
        if i < 0: i = low.find('e')
        if i < 0 and 'ou' in low: i = low.find('o')
        if i < 0:
            i = max((k for k, c in enumerate(low) if c in 'aeiouü'), default=-1)
        if i < 0:
            out.append(base)
            continue
        mark = TONES[low[i]][tone - 1]
        out.append(base[:i] + (mark.upper() if base[i] != low[i] else mark) + base[i + 1:])
    # write a word's syllables together, as pinyin normally is: "wo3 men5" → "wǒmen", "Xi1 an1" → "Xī'ān"
    word = ''
    for k, syl in enumerate(out):
        if k and syl[:1].lower() in 'aeoāáǎàēéěèōóǒò':
            word += "'"
        word += syl
    return word

SIDE = re.compile(r'^\((dialect|literary|old|archaic|Tw|Taiwan|slang|onom\.|coll\.|Cantonese|obsolete|euphemism|honorific)')
INLINE = re.compile(r'(?:[^\s|\[\]()]+\|)?([^\s|\[\]()]+)\[([a-zA-Z0-9: ]+)\]')  # 綠帽子|绿帽子[lu:4 mao4 zi5]
def tidy(g):
    return INLINE.sub(lambda m: f'{m.group(1)} ({marks(m.group(2))})', g).strip()

# Essential beginner phrases the frequency list splits into separate words
KEEP = set('不客气 没关系 早上好 晚上好 晚安 不好意思 欢迎 请问 多少钱 我爱你 生日快乐 新年快乐 好久不见 一路平安 祝你好运 我不知道 没问题 慢走 干杯 加油'.split())

def build(cedict, freq):
    rank = {}
    for i, line in enumerate(open(freq, encoding='utf-8')):
        w = line.split(' ')[0].strip()
        if w and w not in rank:
            rank[w] = i
    entries = {}
    for line in open(cedict, encoding='utf-8'):
        if line.startswith('#'):
            continue
        m = LINE.match(line.strip())
        if not m:
            continue
        trad, simp, pinyin, glosses = m.groups()
        if simp not in rank and simp not in KEEP:
            continue
        glosses = glosses.split('/')
        mw = [g[3:] for g in glosses if g.startswith('CL:')]
        # measure words also appear inside glosses: "cat (CL:隻|只[zhi1])"
        for g in glosses:
            mm = re.search(r'\(CL:([^)]+)\)', g)
            if mm: mw.append(mm.group(1))
        glosses = [re.sub(r'\s*\(CL:[^)]+\)', '', g) for g in glosses]
        good = [tidy(g) for g in glosses if g and not g.startswith('CL:') and not SKIP_GLOSS.match(g)]
        if not good:
            continue
        proper = pinyin[:1].isupper()  # names of people and places
        entries.setdefault(simp, []).append({'trad': trad, 'pinyin': pinyin, 'glosses': good, 'mw': mw, 'proper': proper})
    out = []
    for simp in sorted(entries, key=lambda w: rank.get(w, 3000)):  # kept beginner phrases rank as fairly common
        cands = entries[simp]
        common = [c for c in cands if not c['proper']] or cands
        # main reading: not only dialect/literary/slang meanings, then the most meanings
        mainstream = [c for c in common if not all(SIDE.match(g) for g in c['glosses'])] or common
        best = max(mainstream, key=lambda c: len(c['glosses']))
        senses = [[g] for g in best['glosses']][:MAX_SENSES]
        idiom = any('(idiom)' in g for g in best['glosses'])
        mw = ''
        if best['mw']:  # "個|个[ge4]" → "个 (gè)"
            mm = re.match(r'(?:[^|\[,]+\|)?([^\[,]+)\[([^\]]+)\]', best['mw'][0])
            mw = f'{mm.group(1)} ({marks(mm.group(2))})' if mm else ''
        out.append([simp, best['trad'], marks(best['pinyin']), senses, 2 if idiom else 0, mw])
        if len(out) >= MAX_WORDS:
            break
    return {'lang': 'zh', 'source': 'CC-CEDICT (CC BY-SA 4.0); frequencies: Hermit Dave FrequencyWords (CC BY-SA 4.0)', 'words': out}

if __name__ == '__main__':
    if len(sys.argv) != 3:
        sys.exit(__doc__)
    data = build(sys.argv[1], sys.argv[2])
    here = os.path.dirname(os.path.abspath(__file__))
    dest = os.path.join(here, 'dict', 'zh.json')
    with open(dest, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, separators=(',', ':'))
    print(f"zh: {len(data['words'])} entries → {dest} ({os.path.getsize(dest) / 1e6:.1f} MB)")
