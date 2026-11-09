"""Score, foley, rain and voice -> out/mix.wav (48 kHz stereo). Everything comes from timeline.json / events.json."""
import json, os, sys
import numpy as np, soundfile as sf
HERE = os.path.dirname(os.path.abspath(__file__))
LIB = os.environ.get('LIB', '/root/lemo-opuscar')
sys.path.insert(0, LIB)
from core.audio import sfx, pluck as P
from core.audio.sfx import SR, add, bp, lp, hp, noise, brown, t_, compress, limit

TL = json.load(open(f'{HERE}/timeline.json'))
EVJ = json.load(open(f'{HERE}/events.json'))
EV = EVJ['ev']
DUR = TL['dur']; N = int(DUR * SR)
rng = np.random.default_rng(5)
BEAT = 60 / 72
rk = np.array(TL['rain'])
from scipy.interpolate import PchipInterpolator
rainI = PchipInterpolator(rk[:, 0], rk[:, 1])
def I(t): return float(np.clip(rainI(np.clip(t, 0, DUR)), 0, 1))

def env_curve(fn):
    t = np.arange(N) / SR
    return np.array([fn(x) for x in t[::480]])  # 100 Hz control rate
def upsample(c):
    x = np.interp(np.arange(N) / SR, np.arange(len(c)) * 480 / SR, c)
    return x

def sm(x, f=8):
    from scipy.ndimage import uniform_filter1d
    return uniform_filter1d(x, size=int(SR / f))

# ---------- ambience ----------
room = lp(brown(DUR + .1), 220)[:N] * .5
rain_c = upsample(env_curve(lambda t: I(t + .8) if t < 12 else I(t)))     # picture shows rain later than we hear it (J-cut)
hiss = bp(noise(DUR + .1), 2500, 9000)[:N]
patter = bp(noise(DUR + .1), 500, 2200)[:N]
wob = 1 + .25 * np.sin(np.arange(N) / SR * 3.1) * np.sin(np.arange(N) / SR * 0.7)
rain = (hiss * .060 + patter * .055 * wob) * np.clip(sm(rain_c, 12), 0, 1) ** 1.3
stream_c = upsample(env_curve(lambda t: .07 * np.clip((t - 13) / 2, 0, 1) * (1 if t < 18.4 else (.35 if t < 21.6 else max(0, 1 - (t - 21.6) / 1.2) * .35))))
stream = bp(noise(DUR + .1), 1400, 4800)[:N] * (.6 + .4 * np.sin(np.arange(N) / SR * 7.3) ** 2) * stream_c

amb = np.zeros((N, 2))
for ch, d in enumerate([0, 1]):
    pass
amb[:, 0] = room * .02 + rain * 1.0 + stream * .7
amb[:, 1] = room * .02 + np.roll(rain, 240) * 1.0 + np.roll(stream, 120) * .7

# ---------- foley ----------
fol = np.zeros((N, 2))
def pat(v=1.0):
    d = .12; return lp(noise(d), 700) * np.exp(-t_(d) / .03) * v

# painting-in: paper/brush rustle
for e in EV:
    if e['type'] == 'brush':
        d = min(e['dur'], max(.3, 18.4 - e['t']));
        if e['t'] >= 18.4: continue
        x = bp(noise(d), 1800, 6500); u = np.linspace(0, 1, len(x)); x = x * (.5 + .5 * np.sin(u * d * 38)) ** 1.5 * np.sin(np.pi * u) ** .8
        add(fol, x, e['t'], .030 * e.get('vol', 1), e['pan'])
    if e['type'] == 'note':
        d = max(.5, e['dur']); x = bp(noise(d), 3000, 9000); u = np.linspace(0, 1, len(x)); x = x * (.4 + .6 * np.abs(np.sin(u * d * 23))) * np.sin(np.pi * u)
        add(fol, x, e['t'], .02, 0)
S = TL['sfx']
# the opening drop
d = .35; x = bp(noise(d), 300, 2800) * np.exp(-t_(d) / .05); add(fol, x, S['splat'], .22, 0)
d = .5; f = 190 * np.exp(-t_(d) * 5); add(fol, np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t_(d) / .09), S['splat'], .16, 0)
d = 2.4; x = bp(noise(d), 3500, 8000); x = x * np.sin(np.pi * np.linspace(0, 1, len(x))) ** 2; add(fol, x, S['splat'] + .1, .03, 0)
# steps and umbrella patter
for a, b in TL['walk']:
    t = a
    while t < b:
        add(fol, pat(1.0 + rng.random() * .2), t, .10 * (1 if t < 19 else .8), (t - 18) / 30)
        t += .52
    d = b - a
    x = bp(noise(d), 700, 3200); u = np.linspace(0, 1, len(x)); add(fol, x * np.sin(np.pi * u) ** .4 * (.7 + .3 * np.sin(u * d * 31)), a, .035, 0)
# eave drop lands, rings
def ping(f, d, v):
    x = np.sin(2 * np.pi * f * t_(d) * (1 + .12 * np.exp(-t_(d) * 25))) * np.exp(-t_(d) / (d / 6)); return x * v
add(fol, ping(1180, .5, 1), S['ripple'], .20, -.1)
add(fol, ping(1770, .35, .5), S['ripple'] + .04, .06, .1)
add(fol, ping(1180, .4, .4), S['ripple'] + .35, .035, -.1)
add(fol, bp(noise(.06), 2000, 7000) * np.exp(-t_(.06) / .012), S['eave'], .03, -.1)    # the drop forming on the eave
# door, window, mist, last drop
add(fol, sfx.click(.9, .6), S['latch'], .12, .0)
add(fol, sfx.creak(.5), S['latch'] + .05, .05, .0)
add(fol, sfx.whoosh(1.7, .7), S['mistA'], .07, 0)
add(fol, ping(1320, .6, 1), S['lastdrop'], .22, .3)

# ---------- music ----------
mus = np.zeros((N, 2))
def kal(p, t, v=.7, pan=0, g=.55): add(mus, np.asarray(P.pluck('kalimba', p, 2.2, vel=v)), t, g, pan)
def gtr(p, t, v=.6, pan=-.2, g=.5): add(mus, np.asarray(P.pluck('nylon_guitar', p, 3.0, vel=v)), t, g, pan)
def box(p, t, v=.6, pan=.25, g=.4): add(mus, np.asarray(P.pluck('music_box', p, 2.5, vel=v)), t, g, pan)
def pad(freqs, t0, d, g, fade=1.5):
    x = np.zeros(int(d * SR))
    for f in freqs:
        for det in (-.7, .7): x += np.sin(2 * np.pi * (f + det) * t_(d) + rng.random() * 6)
    tt = np.arange(len(x)) / SR; x = lp(x, 900) * np.clip(np.minimum(tt / fade, (d - tt) / fade), 0, 1)
    add(mus, x, t0, g, 0)
# A  (0.8 - 9.0): sparse kalimba, A minor pentatonic
for t, p in [(0.83, 'E4'), (1.67, 'A4'), (3.33, 'C5'), (4.17, 'E4'), (5.83, 'G4'), (6.67, 'A4'), (8.33, 'E5')]: kal(p, t, .65, pan=(t % 3 - 1.5) / 4)
pad([110, 164.8], 4.0, 14.5, .010, 3)
# B  (9.0 - 18.3): nylon guitar arpeggios over Am F C
CH = [('A2', 'E3', 'A3', 'C4', 'E4'), ('F2', 'C3', 'F3', 'A3', 'C4'), ('C3', 'G3', 'C4', 'E4', 'G4')]
IDX = [0, 2, 1, 3, 2, 4, 3, 2]
for b, ch in enumerate(CH):
    t0 = 9.0 + b * 4 * BEAT
    for i, k in enumerate(IDX):
        t = t0 + i * BEAT / 2
        if t < 18.2: gtr(ch[k], t, .55 + .15 * (i % 2 == 0))
for t, p in [(10.0, 'E5'), (11.7, 'G5'), (14.2, 'A5'), (15.9, 'G5'), (17.3, 'E5')]: kal(p, t, .55, .3, .4)
# C  (21.5 - 30): music box and kalimba, softer; window warms into a rising figure
pad([110, 164.8, 220], 21.5, 8.5, .010, 2)
for t, p in [(21.67, 'A4'), (22.5, 'E5'), (23.33, 'C5'), (24.17, 'D5'), (25.0, 'E5')]: box(p, t, .5)
for i, p in enumerate(['A4', 'C5', 'E5', 'A5']): box(p, S['glow'] + i * .22, .6 + .08 * i, .1 * (i - 1.5), .45)
kal('A3', 27.5, .55, -.2, .5); kal('E4', 28.3, .5, .2, .45)
kal('A4', S['lastdrop'] + .05, .6, .3, .6)
# the silence: music out 18.1 -> 18.45, back in 21.5 -> 22.1 (kept as a gain curve)
def mgain(t):
    if t < 18.1: return 1.0
    if t < 18.45: return 1 - (t - 18.1) / .35
    if t < 21.5: return 0.0
    if t < 22.1: return (t - 21.5) / .6
    return 1.0
mg = sm(upsample(env_curve(mgain)), 20)
mus *= mg[:, None]

# ---------- voice ----------
vox = np.zeros((N, 2)); vmask = np.zeros(N)
for l in TL['lines']:
    w, sr = sf.read(f'{HERE}/voice/{l["id"]}.wav')
    if w.ndim > 1: w = w.mean(1)
    if sr != SR:
        import soxr; w = soxr.resample(w, sr, SR)
    w = compress(w.astype(np.float64), thr=.2, ratio=4); w *= .17 / (np.sqrt(np.mean(w ** 2)) + 1e-9) * .45
    add(vox, w, l['t'], 1.0, 0)
    s = int(l['t'] * SR); vmask[s:s + len(w)] = 1
duck = 1 - .38 * sm(vmask, 6)
mus *= duck[:, None]; amb *= (1 - .15 * sm(vmask, 6))[:, None]

# ---------- master ----------
tot = amb + fol + mus * 1.0 + vox * 1.0
r = np.sqrt(np.mean(vox[vox != 0] ** 2)) if np.any(vox) else 1
m = np.sqrt(np.mean(mus[mus != 0] ** 2)) if np.any(mus) else 1
print('voice rms %.4f music rms %.4f (ratio %.1f dB)' % (r, m, 20 * np.log10(r / (m + 1e-9))))
tot = np.stack([limit(tot[:, 0], .9), limit(tot[:, 1], .9)], 1)
os.makedirs(f'{HERE}/out', exist_ok=True)
sf.write(f'{HERE}/out/mix.wav', tot.astype(np.float32), SR)
# per-layer stems for the review
for nm, a in [('amb', amb), ('fol', fol), ('mus', mus), ('vox', vox)]:
    print(nm, 'rms %.4f' % np.sqrt(np.mean(a ** 2)))
