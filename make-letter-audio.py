#!/usr/bin/env python3
"""Generate audio/<lang>/<id>.m4a for the Letters / Hangul tab of French, German and Korean,
using the macOS voices (Thomas, Anna, Yuna). Reads the LETTERS table in languages.js.
Re-run after changing that table. (Japanese kana: make-kana-audio.py.)"""
import json, os, re, subprocess

VOICES = {'fr': 'Thomas', 'de': 'Anna', 'ko': 'Yuna'}
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
                subprocess.run(['say', '-v', VOICES[lang], '-r', '150', '-o', path,
                                '--file-format=m4af', '--data-format=aac', it['say']], check=True)
            n += 1
    print(f'{lang}: {n} letters, files in audio/{lang}/')
