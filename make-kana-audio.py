#!/usr/bin/env python3
"""Generate audio/kana/<romaji>.m4a for every character in the Characters tab,
using the macOS built-in Japanese voice (Kyoko). Re-run if the charts change."""
import os, re, subprocess
here = os.path.dirname(os.path.abspath(__file__))
html = open(os.path.join(here, 'index.html'), encoding='utf-8').read()
out = os.path.join(here, 'audio', 'kana'); os.makedirs(out, exist_ok=True)
cells = set()
for rows in re.findall(r"parseRows\('([^']+)'\)", html):
    for cell in re.split(r"[ |]", rows):
        m = re.match(r"^([^\x00-\x7f]+)([a-z]+)$", cell)
        if m: cells.add((m.group(1), m.group(2)))
for kana, romaji in sorted(cells, key=lambda c: c[1]):
    path = os.path.join(out, romaji + '.m4a')
    if os.path.exists(path): continue
    subprocess.run(['say', '-v', 'Kyoko', '-r', '150', '-o', path, '--file-format=m4af', '--data-format=aac', kana], check=True)
print(f'{len(cells)} characters, files in audio/kana/')
