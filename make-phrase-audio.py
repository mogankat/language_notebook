#!/usr/bin/env python3
"""Record audio/phrases/<lang>/<topic>-<row>.m4a for every starter phrase in phrases.js, with the
macOS voices, so the phrases play even where the browser has no voice for the language.
Re-run after changing the STARTER table (it re-records everything)."""
import json, os, re, shutil, subprocess

VOICES = {'ja': 'Kyoko', 'zh': 'Tingting', 'ko': 'Yuna', 'fr': 'Thomas', 'es': 'Paulina', 'de': 'Anna'}
here = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(here, 'phrases.js'), encoding='utf-8').read()
topics = json.loads(re.search(r'/\*STARTER-JSON\*/(.*?)/\*END-STARTER-JSON\*/', src, re.S).group(1))
for lang, voice in VOICES.items():
    out = os.path.join(here, 'audio', 'phrases', lang)
    shutil.rmtree(out, ignore_errors=True)
    os.makedirs(out)
    n = 0
    for t, topic in enumerate(topics):
        for r, row in enumerate(topic['rows']):
            if lang not in row:
                continue
            text = row[lang][0].replace('…', ', ')  # read a blank as a short pause
            dest, tmp = os.path.join(out, f'{t}-{r}.m4a'), os.path.join(out, 'tmp.aiff')
            subprocess.run(['say', '-v', voice, '-r', '160', '-o', tmp, text], check=True)
            # AAC at 32 kbps; afconvert also drops the padding `say` adds to its own .m4a files (35 KB → 7 KB)
            subprocess.run(['afconvert', '-f', 'm4af', '-d', 'aac', '-b', '32000', tmp, dest], check=True)
            os.remove(tmp)
            n += 1
    print(f'{lang}: {n} phrases ({voice})')
