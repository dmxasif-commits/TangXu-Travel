#!/bin/sh
# One-command build for the Burj Khalifa test cut. Needs the library (LIB), ffmpeg 7+ on PATH, and (for the voice) network access.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-/root/lemo-opuscar}; export LIB
PY="$LIB/.venv/bin/python"
[ -f "$HERE/audio/vo/dur.json" ] || "$PY" "$HERE/tools/run_with_proxy_ca.py" "$LIB/core/tts/tts_zh.py" "$HERE/audio/lines.json" "$HERE/audio/vo" --voice bn-BD-PradeepNeural --rate=-4%
python3 "$HERE/scenes/_gen_film.py"
cd "$LIB"
node core/render/readcheck.mjs "$HERE" --step 0.05
node core/render/events.mjs "$HERE"
node core/render/video.mjs "$HERE" --fps 24 --workers ${WORKERS:-3} --out "$HERE/out/video.mp4"
"$PY" "$HERE/audio/mix.py"
"$PY" core/render/srt.py "$HERE/audio/cues.json" "$HERE/burj-khalifa.srt"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/burj-khalifa.mp4" 24 1
node core/render/still.mjs "$HERE" 48 --prefix poster_ --out "$HERE/stills" >/dev/null && cp "$HERE/stills/poster_48.jpg" "$HERE/poster.jpg"
echo "done: $HERE/burj-khalifa.mp4"
