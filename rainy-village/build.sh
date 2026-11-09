#!/bin/sh
# One-command build. Needs the Lemo-Opuscar library (LIB) and ffmpeg 7+ on PATH.
set -e
LIB=${LIB:-/root/lemo-opuscar}
HERE=$(cd "$(dirname "$0")" && pwd)
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
[ -d "$HERE/voice" ] || "$LIB/.venv/bin/python" "$LIB/core/tts/tts.py" "$HERE/lines.json" "$HERE/voice"
cd "$LIB"
node core/render/events.mjs "$HERE"
node core/render/readcheck.mjs "$HERE"
node core/render/video.mjs "$HERE" --fps 24 --workers 3 --out "$HERE/out/video.mp4"
"$LIB/.venv/bin/python" "$HERE/mix.py"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/rainy-village.mp4" 24 1
"$LIB/.venv/bin/python" - <<PY
import json
l=json.load(open("$HERE/timeline.json"))["lines"]; d=json.load(open("$HERE/voice/dur.json"))
json.dump([{"t0":x["t"],"t1":x["t"]+max(1.8,d[x["id"]]+.6),"text":x["text"]} for x in l],open("$HERE/cues.json","w"))
PY
"$LIB/.venv/bin/python" core/render/srt.py "$HERE/cues.json" "$HERE/rainy-village.srt"
node core/render/still.mjs "$HERE" 28.8 --out "$HERE/stills" >/dev/null && cp "$HERE/stills/t_28.8.jpg" "$HERE/poster.jpg"
