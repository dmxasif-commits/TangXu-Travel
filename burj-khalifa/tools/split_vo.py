#!/usr/bin/env python3
"""One file with all 11 lines -> L1 ... L11 in audio/vo_user/.
Put the file at audio/vo_user/all.(mp3|wav|m4a|ogg|flac). Lines must be separated by a clear pause (about 1.5 s or more);
pauses inside a line (commas, the dash in L3) are shorter. The splitter finds the long pauses and needs exactly 11 pieces.
    python3 tools/split_vo.py   then   python3 tools/import_vo.py"""
import glob, os, re, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
SRC = os.environ.get('VO_USER_DIR') or os.path.join(ROOT, 'audio', 'vo_user')
fs = [f for f in glob.glob(os.path.join(SRC, 'all.*')) if f.rsplit('.', 1)[-1].lower() in ('mp3', 'wav', 'm4a', 'ogg', 'flac', 'aac')]
if not fs: sys.exit('put the single file at audio/vo_user/all.mp3 (or .wav/.m4a)')
f = fs[0]
total = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).decode())
def pieces(d, noise):
    log = subprocess.run(['ffmpeg', '-v', 'info', '-i', f, '-af', f'silencedetect=noise={noise}dB:d={d}', '-f', 'null', '-'], capture_output=True, text=True).stderr
    st = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', log)]; en = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', log)]
    cuts = []; pos = 0.0
    for a, b in zip(st, en + [total] * (len(st) - len(en))):
        if a - pos > .4: cuts.append((pos, a))
        pos = b
    if total - pos > .4: cuts.append((pos, total))
    return cuts
best = None
for noise in (-38, -34, -42, -30):
    for d in (1.2, 1.0, .9, .8, .7, .6):
        c = pieces(d, noise)
        if len(c) == 11: best = c; break
    if best: break
if not best:
    c = pieces(.9, -38); print(f'found {len(c)} pieces instead of 11:'); [print(f'  {i + 1}: {a:.1f}-{b:.1f} s ({b - a:.1f} s)') for i, (a, b) in enumerate(c)]
    sys.exit('Leave a clear pause of about 1.5 s between lines and keep pauses inside a line short, then try again.')
for i, (a, b) in enumerate(best, 1):
    out = os.path.join(SRC, f'L{i}.wav'); subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', f, '-ss', f'{max(0, a - .08):.3f}', '-to', f'{min(total, b + .12):.3f}', '-ac', '1', '-ar', '48000', out], check=True)
    print(f'L{i}: {a:.2f}-{b:.2f} s ({b - a:.2f} s)')
