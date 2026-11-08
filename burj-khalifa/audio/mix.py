"""Score, foley, room and the Bangla voice -> out/mix.wav (48 kHz stereo). Everything is timed from events.json and audio/vo/dur.json."""
import json, os, sys
import numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
LIB = os.environ.get('LIB', '/root/lemo-opuscar'); sys.path.insert(0, LIB)
from core.audio import sfx, pluck as P
from core.audio.sfx import SR, add, bp, lp, hp, noise, brown, t_, compress, limit
from scipy.ndimage import uniform_filter1d

ej = json.load(open(f'{ROOT}/events.json')); EV = ej['ev']; DUR = ej['dur']; N = int(DUR * SR)
scene = json.load(open(f'{ROOT}/scenes/film.json')); T = scene['cues']; SIL = T['silence']
VO = json.load(open(f'{HERE}/vo/dur.json'))
BEAT = 60 / 96
rng = np.random.default_rng(3)
def sm(x, f=8): return uniform_filter1d(x, size=max(1, int(SR / f)))
def curve(pts):
    t = np.arange(N) / SR; return np.interp(t, [p[0] for p in pts], [p[1] for p in pts])

# ---- room: air conditioning + far traffic through the window, ~20 dB under the voice, audible in the silence
room = np.zeros((N, 2))
ac = lp(brown(DUR + .1), 160)[:N]; tr = bp(noise(DUR + .1), 250, 900)[:N] * (.5 + .5 * np.sin(np.arange(N) / SR * .35)) ** 2
room[:, 0] = ac * .030 + tr * .010; room[:, 1] = np.roll(ac, 90) * .030 + np.roll(tr, 400) * .010

# ---- foley
fol = np.zeros((N, 2))
def squeak(d, v, f0=2200, f1=5200):
    x = bp(noise(d), f0, f1); u = np.linspace(0, 1, len(x)); x = x * (.45 + .55 * np.abs(np.sin(u * d * 55))) * np.sin(np.pi * u) ** .6; return x * v
def click(f=900, d=.09, v=1.0):
    u = t_(d); return (np.sin(2 * np.pi * f * u) * np.exp(-u / .018) + bp(noise(d), 1500, 6000) * np.exp(-u / .006) * .6) * v
for e in EV:
    t, ty = e['t'], e['type']; v = e.get('v', 1.0)
    if ty == 'ink':
        d = max(.2, e.get('d', .5)); add(fol, squeak(d, .034 * v, 1800 if e.get('kind') == 'write' else 1400, 5200), t, 1.0, -.1)
    elif ty == 'dimzip':
        d = e.get('d', 1.0); add(fol, squeak(d, .04 * v, 1500, 6500), t, 1.0, .1); add(fol, sfx.whoosh(min(d, .6), .3), t, .05, 0)
    elif ty == 'arrow': add(fol, click(1300, .08, .6), t, .09 * v, .1)
    elif ty == 'tag':
        add(fol, click(520, .14, 1.0), t, .12 * v, -.2); add(fol, click(880, .08, .5), t + .22, .05, -.2)
    elif ty == 'clack': add(fol, click(640 + 38 * e['n'], .1, 1.0), t, .13, (e['n'] - 4) / 10)
    elif ty == 'thump':
        u = t_(.5); x = np.sin(2 * np.pi * 58 * u * (1 + .4 * np.exp(-u * 20))) * np.exp(-u / .12) + bp(noise(.5), 200, 1800) * np.exp(-u / .03) * .5
        add(fol, x, t, .38, 0)
    elif ty == 'ground':
        add(fol, click(260, .18, 1.0), t, .16, 0); add(fol, squeak(.7, .05, 1200, 4200), t, 1.0, 0)
    elif ty == 'wind':
        d = e['d']; n = int(d * SR); g = bp(noise(d + .05), 180, 1400)[:n] * np.linspace(0, 1, n) ** 1.6 * (.7 + .3 * np.sin(np.arange(n) / SR * 1.7))
        add(fol, g, t, .09, 0)
for t_w, v in ((5.2, .5), (16.95, .55), (43.3, .6)): add(fol, sfx.whoosh(1.2, .6), t_w - .1, .05 * v * 2, 0)

# ---- music: a small rhythmic ensemble, walking to brisk. Silence 15.9-16.8, the first sound after it is the pen on the ground line.
mus = np.zeros((N, 2))
def bass(p, t, d=.55, v=.7, g=.55): add(mus, np.asarray(P.pluck('upright_bass_pizz', p, d, vel=v)), t, g, -.1)
def wood(t, v=1.0, f=1250): add(mus, click(f, .08, 1.0), t, .07 * v, .25)
def kick(t, v=1.0):
    u = t_(.25); add(mus, np.sin(2 * np.pi * 52 * u * (1 + .8 * np.exp(-u * 30))) * np.exp(-u / .07), t, .3 * v, 0)
def hat(t, v=1.0): add(mus, hp(noise(.05), 6000) * np.exp(-t_(.05) / .012), t, .04 * v, .3)
def brass(f, t, d=1.4, v=1.0):   # low brass stab: a few harmonics, slow-ish attack, low-passed
    u = t_(d); x = sum(np.sin(2 * np.pi * f * k * u) / k for k in (1, 2, 3, 4, 5)) * np.minimum(1, u / .07) * np.exp(-u / (d * .5)); add(mus, lp(x, 1400), t, .13 * v, 0)
LINE = ['A1', 'C2', 'E2', 'D2', 'F2', 'E2', 'D2', 'C2']        # the walking line, Am
def bar_notes(t0, t1, density):
    i = 0; t = t0
    while t < t1 - .01:
        bass(LINE[i % len(LINE)], t, .5, .65); i += 1; t += BEAT * density
# A 0 - 15.7: bass on the beat, wood on the off-beats, no kit
bar_notes(0.5, 15.5, 1)
t = 0.5 + BEAT / 2
while t < 15.4: wood(t, .6); t += BEAT * 2
# B 16.8 -> 43.3: the turn stab, then brisk: kit joins when the piles clack in (28.4)
brass(55.0, SIL[1] + .02, 1.6, 1.0)
bar_notes(SIL[1] + BEAT, 43.3, 1)
t = SIL[1] + BEAT
while t < 43.3:
    wood(t + BEAT / 2, .7); t += BEAT
t = 28.4
while t < 43.2: kick(t, .9); kick(t + BEAT * 2, .7); t += BEAT * 4
t = 28.4
while t < 43.2: hat(t, .8); hat(t + BEAT / 2, .5); t += BEAT
# C 43.3 -> end: thins to bass, a held low note at the end
bar_notes(43.3, 49.0, 2)
brass(55.0, 48.8, 4.0, .8)
mgain = curve([(0, 1), (15.2, 1), (15.7, 0), (16.78, 0), (16.8, 1), (DUR, 1)])
mgain = sm(mgain, 20); mus *= mgain[:, None]

# ---- voice
vox = np.zeros((N, 2)); vm = np.zeros(N)
for k, t0 in ((k, T[k]) for k in VO):
    w, sr = sf.read(f'{HERE}/vo/{k}.wav')
    if w.ndim > 1: w = w.mean(1)
    if sr != SR:
        import soxr; w = soxr.resample(w, sr, SR)
    w = compress(w.astype(np.float64), thr=.2, ratio=4); w *= .105 / (np.sqrt(np.mean(w ** 2)) + 1e-9)
    add(vox, w, t0, 1.0, 0); s = int(t0 * SR); vm[s:s + len(w)] = 1
duck = 1 - .45 * sm(vm, 6); mus *= duck[:, None]; fol *= (1 - .25 * sm(vm, 6))[:, None]

tot = room + fol + mus + vox
r = np.sqrt(np.mean(vox[vox != 0] ** 2)); m = np.sqrt(np.mean(mus[mus != 0] ** 2))
print('voice rms %.4f music rms %.4f -> voice %.1f dB over music' % (r, m, 20 * np.log10(r / m)))
tot = np.stack([limit(tot[:, 0], .9), limit(tot[:, 1], .9)], 1)
os.makedirs(f'{ROOT}/out', exist_ok=True); sf.write(f'{ROOT}/out/mix.wav', tot.astype(np.float32), SR)
for nm, a in (('room', room), ('fol', fol), ('mus', mus), ('vox', vox)): print(nm, 'rms %.4f' % np.sqrt(np.mean(a ** 2)))
