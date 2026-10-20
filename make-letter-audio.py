#!/usr/bin/env python3
"""Generate audio/<lang>/<id>.m4a for the Letters / Hangul / Pinyin tab of French, German, Korean,
Spanish and Chinese, using the macOS voices (Thomas, Anna, Yuna, Paulina, Tingting). Reads the LETTERS table in languages.js.
Re-run after changing that table. (Japanese kana: make-kana-audio.py.)"""
import json, os, re, subprocess

VOICES = {'fr': 'Thomas', 'de': 'Anna', 'ko': 'Yuna', 'es': 'Paulina', 'zh': 'Tingting'}
here = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(here, 'languages.js'), encoding='utf-8').read()
letters = json.loads(re.search(r'/\*LETTERS-JSON\*/(.*?)/\*END-LETTERS-JSON\*/', src, re.S).group(1))
for lang, groups in letters.items():
    out = os.path.join(here, 'audio', lang)
    os.makedirs(out, exist_ok=True)
    n = 0
    for group in groups:
        for it in group['items']:
            path = os.path.join(out, it['id'] + '.m4a')
            if not os.path.exists(path):
                subprocess.run(['say', '-v', VOICES[lang], '-r', '150', '-o', path + '.aiff', it['say']], check=True)
                # small AAC; afconvert also drops the padding `say` adds to its own .m4a files
                subprocess.run(['afconvert', '-f', 'm4af', '-d', 'aac', '-b', '32000', path + '.aiff', path], check=True)
                os.remove(path + '.aiff')
            n += 1
    print(f'{lang}: {n} letters, files in audio/{lang}/')
