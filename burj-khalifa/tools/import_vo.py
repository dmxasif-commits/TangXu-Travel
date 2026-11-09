#!/usr/bin/env python3
"""Use your own voice files. Put one audio file per line in audio/vo_user/ named L1 ... L11 (.mp3, .wav, .m4a, .ogg, .flac).
This converts each to audio/vo/Lk.wav (48 kHz mono, silence trimmed at both ends) and writes audio/vo/dur.json.
    python3 tools/import_vo.py"""
import glob, json, os, subprocess, sys
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
SRC, OUT = os.path.join(ROOT, 'audio', 'vo_user'), os.path.join(ROOT, 'audio', 'vo')
os.makedirs(OUT, exist_ok=True); dur = {}; missing = []
for i in range(1, 12):
    k = f'L{i}'; fs = [f for f in glob.glob(os.path.join(SRC, k + '.*')) if f.rsplit('.', 1)[-1].lower() in ('mp3', 'wav', 'm4a', 'ogg', 'flac', 'aac')]
    if not fs: missing.append(k); continue
    out = os.path.join(OUT, k + '.wav')
    af = 'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05,areverse'
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', fs[0], '-ac', '1', '-ar', '48000', '-af', af, out], check=True)
    d = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', out]).decode().strip())
    dur[k] = round(d, 3); print(k, dur[k], 's')
if missing: print('MISSING:', ', '.join(missing)); sys.exit(1)
json.dump(dur, open(os.path.join(OUT, 'dur.json'), 'w')); print('wrote audio/vo/dur.json')
