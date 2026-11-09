#!/usr/bin/env python3
"""Burj Khalifa — "Engineering Diary, part 1" (test cut, ~53 s): one board, one continuous camera.
    python3 scenes/_gen_film.py   ->  scenes/film.json + audio/cues.json
Layout in board px (zoom 1 shows 1,920 board px across). Ground line y = GY; the tower stands on it at x = TX.
Timed on the narration (audio/vo/dur.json) and a 96 bpm grid (beat 0.625 s)."""
import json, math, os, re

HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.dirname(HERE)
VO = json.load(open(os.path.join(ROOT, 'audio', 'vo', 'dur.json')))
BW, BH = 6400, 3600
TX, GY, TOP = 3000, 1500, 150          # tower axis, ground line, apex
BEAT = 60 / 96
DUR = 53.0

E, EV = [], []
def el(**k): E.append(k); return k
def ev(t, type, **k): EV.append(dict(t=round(t, 4), type=type, **k)); return t

class Cam:
    def __init__(s, x, y, z, roll=0):
        s.base = dict(x=x, y=y, z=z, roll=roll); s.cur = dict(x=x, y=y, lz=math.log(z), roll=roll); s.moves = []; s.shakes = []
    def to(s, t, d, x=None, y=None, z=None, roll=None, a=2, b=2):
        m = dict(t=round(t, 4), d=d, a=a, b=b)
        if x is not None: m['dx'] = round(x - s.cur['x'], 2); s.cur['x'] = x
        if y is not None: m['dy'] = round(y - s.cur['y'], 2); s.cur['y'] = y
        if z is not None: m['dl'] = math.log(z) - s.cur['lz']; s.cur['lz'] = math.log(z)
        if roll is not None: m['dr'] = roll - s.cur['roll']; s.cur['roll'] = roll
        s.moves.append(m); return t + d
    def shake(s, t, amp=6, f=9, k=7, dir=(0, 1), roll=0):
        s.shakes.append(dict(t=t, amp=amp, f=f, k=k, dir=list(dir), roll=roll))
    def json(s):
        return dict(x=s.base['x'], y=s.base['y'], z=s.base['z'], roll=s.base['roll'], moves=s.moves, shakes=s.shakes)

# ----------------------------------------------------------------- narration timeline (voice starts)
T = dict(L1=.5, L2=3.9, L3=6.3, L4=12.8, L5=16.8, L6=20.4, L7=24.0, L8=28.4, L9=32.0, L10=36.0, L11=43.3)
SIL = (15.9, 16.8)         # the one real silence, before the turn: only the room
LINES = {
 'L1': 'দুবাইয়ের আকাশে মাথা তুলে দাঁড়িয়ে আছে বুর্জ খলিফা।',
 'L2': 'উচ্চতা ৮২৮ মিটার।',
 'L3': 'নিচ থেকে তাকালে প্রশ্ন জাগে — এত উঁচু, এত সরু একটা ভবন বাতাসের চাপ সামলে দাঁড়িয়ে থাকে কীভাবে?',
 'L4': 'এই প্রশ্নের উত্তর খুঁজতেই আজকের ইঞ্জিনিয়ারিং ডায়েরি।',
 'L5': 'তবে গল্পটা শুরু হবে আকাশে নয় — মাটির নিচে।',
 'L6': '২০০৪ সালের জানুয়ারিতে শুরু হয় খননকাজ।',
 'L7': 'এমন একটা ভবনের পুরো ওজন বহন করার জন্য দরকার ছিল বিশেষ ভিত্তি।',
 'L8': 'মাটির নিচে তৈরি করা হয় শক্তিশালী কংক্রিটের পাইল।',
 'L9': 'তার ওপর বসানো হয় পুরু, রড দিয়ে শক্ত করা কংক্রিটের ভিত্তি।',
 'L10': 'ওপরের ভবনের ভার এই ভিত্তি হয়ে পাইলগুলোর মাধ্যমে মাটিতে পৌঁছায়।',
 'L11': 'কিন্তু মজবুত ভিত্তি তৈরি করলেই তো কাজ শেষ নয়।',
}
SPLIT = {'L3': 29, 'L7': 31, 'L9': 31, 'L10': 31}   # a cue longer than one safe line is cut at the nearest space after this many characters

# ----------------------------------------------------------------- the tower: a stepped elevation, drawn in marker
def prof(sign):
    pts = [(170, GY), (170, 1250), (140, 1250), (140, 1010), (112, 1010), (112, 800), (86, 800), (86, 590), (62, 590), (62, 400), (38, 400), (26, 250), (0, TOP)]
    return [[TX + sign * w, y] for w, y in pts]
el(type='ink', kind='line', id='towerR', points=prof(1), lw=12, color='graphite', t=.5, d=3.3, ea=1.4, eb=1.8)
el(type='ink', kind='line', id='towerL', points=prof(-1), lw=12, color='graphite', t=.6, d=3.3, ea=1.4, eb=1.8)
core = [[TX, GY - 20], [TX, TOP + 40]]
el(type='ink', kind='line', id='core', points=core, lw=6, color='grey', alpha=.6, dash=[34, 26], t=1.6, d=2.4, ea=1.6, eb=1.6)
ev(.5, 'ink', d=3.3, kind='line', v=.5)

# ----------------------------------------------------------------- hook: 828 m, ridden by the camera
el(type='ink', kind='dim', id='dim828', **{'from': [TX + 345, GY], 'to': [TX + 345, TOP]}, ext=[[TX + 175, GY, TX + 365], [TX + 30, TOP, TX + 365]], extColor='grey',
   lw=12, color='blue', t=.7, d=3.0, ea=1.5, eb=2.0)
ev(.7, 'dimzip', d=3.0, v=1.0); ev(3.7, 'arrow', v=1.0)
el(type='ink', kind='write', id='w828', text='৮২৮ মিটার', xy=[TX + 400, 860], size=110, color='blue', t=.1, d=.9)
ev(.1, 'ink', d=.9, kind='write')

# ----------------------------------------------------------------- the question (red: the thing to decide)
el(type='tag', id='tag_wind', text='বাতাস সামলে দাঁড়ায় কীভাবে?', xy=[TX - 1020, 620], size=72, color='red', rot=-1.5, arrive=dict(t=9.7, kind='swing', d=.9, amp=10))
ev(9.7, 'tag', v=.7)
el(type='ink', kind='write', id='q', text='?', xy=[TX - 520, 1000], size=520, color='red', t=10.5, d=.9, erase=dict(t=44.0, d=.5))
ev(10.5, 'ink', d=.9, kind='write')
el(type='ink', kind='write', id='diary', text='ইঞ্জিনিয়ারিং ডায়েরি', xy=[TX + 430, 430], size=92, color='graphite', t=13.1, d=1.5)
ev(13.1, 'ink', d=1.5, kind='write')

# ----------------------------------------------------------------- the turn: the first sound after the silence is the ground line
GX0, GX1 = 800, 5600
el(type='ink', kind='line', id='ground', points=[[GX0, GY], [GX1, GY]], lw=16, color='graphite', t=SIL[1], d=.7, ea=1.4, eb=2.2)
ev(SIL[1], 'ground', v=1.0)
soil = []
import random
R = random.Random(4)
for i in range(46):
    x = GX0 + 40 + i * (GX1 - GX0 - 80) / 45
    soil.append(dict(points=[[round(x, 1), GY + 24], [round(x - 44, 1), GY + 78 + R.random() * 40]], t=round(17.6 + i * .035, 3), d=.07, lw=6, color='grey'))
el(type='ink', kind='hatch', id='soil', strokes=soil, lw=6, color='grey', alpha=.55)
el(type='ink', kind='line', id='leader', points=[[TX, GY + 20], [TX, 2230]], lw=14, color='graphite', t=17.0, d=1.5, arrow=True, ea=1.6, eb=2.0)
ev(17.0, 'ink', d=1.5, kind='line', v=.6)
el(type='ink', kind='write', id='under', text='মাটির নিচে', xy=[3560, 1840], size=112, color='graphite', t=18.1, d=1.0, erase=dict(t=41.2, d=.5, ghost=.03))
ev(18.1, 'ink', d=1.0, kind='write')

# ----------------------------------------------------------------- the dig: January 2004
pit = [[2480, GY + 12], [2480, 2160], [3520, 2160], [3520, GY + 12]]
el(type='ink', kind='line', id='pit', points=pit, lw=10, color='graphite', dash=[40, 24], t=20.6, d=1.9, ea=1.5, eb=1.8)
ev(20.6, 'ink', d=1.9, kind='line', v=.6)
el(type='tag', id='tag_2004', text='জানুয়ারি ২০০৪', xy=[3535, 1690], size=66, rot=1.2, arrive=dict(t=21.5, kind='swing', d=.9, amp=9), leave=dict(t=41.4, kind='pop', d=.45, to=[200, -140], spin=18))
ev(21.5, 'tag', v=.7); ev(41.4, 'pop', v=.5)
el(type='ink', kind='write', id='vitti', text='ভিত্তি', xy=[3560, 2130], size=110, color='graphite', t=25.2, d=.9, erase=dict(t=41.2, d=.5, ghost=.03))
ev(25.2, 'ink', d=.9, kind='write')

# ----------------------------------------------------------------- piles: magnets clack on in rhythm
PX = [2630 + i * 92 for i in range(9)]
for i, x in enumerate(PX):
    t = 29.0 + i * BEAT / 2
    el(type='ink', kind='line', id=f'pile{i}', points=[[x, 1600], [x, 2090]], lw=34, color='graphite', alpha=.85, t=round(t - .05, 3), d=.3, ea=1.2, eb=2.4)
    el(type='magnet', id=f'pm{i}', xy=[x, 1590], r=24, color='graphite', z=16, arrive=dict(t=round(t - .06, 3), kind='snap', d=.3, lift=90))
    ev(t, 'clack', n=i)
el(type='tag', id='tag_pile', text='পাইল', xy=[3535, 1990], size=72, rot=-1.0, arrive=dict(t=31.0, kind='swing', d=.9, amp=9), leave=dict(t=41.5, kind='pop', d=.45, to=[200, -120], spin=-18))
ev(31.0, 'tag', v=.7)

# ----------------------------------------------------------------- the raft slab
el(type='ink', kind='line', id='slab', points=[[2540, 1548], [3460, 1548]], lw=48, color='graphite', alpha=.9, t=32.5, d=1.1, ea=1.4, eb=2.2)
rods = []
for i in range(12):
    x = 2560 + i * 76
    rods.append(dict(points=[[x, 1530], [x + 50, 1566]], t=round(33.4 + i * .04, 3), d=.08, lw=5, color='grey'))
el(type='ink', kind='hatch', id='rods', strokes=rods, lw=5, color='grey', alpha=.6)
ev(32.5, 'ink', d=1.1, kind='line', v=.7); ev(33.65, 'thump', v=1.0)
el(type='tag', id='tag_raft', text='পুরু কংক্রিটের ভিত্তি', xy=[2180, 1410], size=64, rot=-1.4, arrive=dict(t=34.2, kind='swing', d=.9, amp=9), leave=dict(t=41.6, kind='pop', d=.45, to=[-200, -140], spin=18))
ev(34.2, 'tag', v=.7)

# ----------------------------------------------------------------- the load goes down through the piles (blue: measurement)
for i, x in enumerate((TX - 140, TX, TX + 140)):
    el(type='ink', kind='line', id=f'load{i}', points=[[x, 1330], [x, 2330]], lw=14, color='blue', arrow=True, t=36.7 + i * .4, d=1.6, ea=1.5, eb=2.0)
    ev(36.7 + i * .4, 'ink', d=1.6, kind='line', v=.5)
el(type='ink', kind='write', id='load_t', text='ভার', xy=[2100, 1300], size=120, color='blue', t=39.0, d=.6, erase=dict(t=42.0, d=.5, ghost=.03))
ev(39.0, 'ink', d=.6, kind='write')

# ----------------------------------------------------------------- the hook: the wind arrives (red)
for i, (y, x0) in enumerate(((520, 1500), (760, 1700), (1000, 1900))):
    el(type='ink', kind='line', id=f'wind{i}', points=[[x0, y], [TX - 230, y + 12 * (1 - i)]], lw=22 - i * 4, color='red', arrow=True, t=44.6 + i * .25, d=1.3, ea=1.6, eb=2.0)
    ev(44.6 + i * .25, 'ink', d=1.3, kind='line', v=.5)
ev(44.4, 'wind', d=8.5, v=1.0)
lean = [[TX, GY], [TX + 6, 1100], [TX + 28, 700], [TX + 70, 380], [TX + 125, TOP + 10]]
el(type='ink', kind='line', id='lean', points=lean, lw=10, color='red', dash=[22, 18], t=46.2, d=1.3, ea=1.6, eb=1.8)
el(type='ink', kind='write', id='end', text='ভিত হলেই শেষ নয়', xy=[1500, 1300], size=160, color='red', t=47.2, d=2.0)
ev(47.2, 'ink', d=2.0, kind='write')

# ----------------------------------------------------------------- camera: ride the line up, step back, drop below ground, hold, step back for the wind
c = Cam(TX + 300, 920, 1.1)
c.to(.5, 3.4, x=TX + 120, y=650, z=1.08, a=1.5, b=2.5)          # ride the dimension line up
c.to(5.2, 2.7, x=TX, y=820, z=.68, a=2, b=2.6)                  # pull back: the whole tower against the question
c.to(10.2, 3.0, x=TX - 60, y=860, z=.68, a=1.6, b=1.6)          # slow drift toward the question mark
c.to(13.4, 2.0, x=TX, y=820, z=.68, a=1.8, b=1.8)
c.to(16.95, 2.4, x=TX + 100, y=1930, z=.84, a=1.6, b=2.6)       # down the leader line, below ground
c.to(28.0, 1.8, x=TX + 60, y=1900, z=.9, a=2, b=2.4)            # in on the piles (labels stay inside: 1993-4127)
c.to(37.6, 1.8, x=TX, y=1800, z=.78, a=2, b=2.4)                # the judgement frame: slab, piles, load, held
c.to(39.4, 3.6, z=.8, a=1.6, b=1.6)
c.to(43.3, 3.2, x=TX - 200, y=640, z=.66, a=1.6, b=3.0)         # pull back and up for the wind (the dig stays below the frame)
c.to(46.5, 6.4, z=.68, a=1.4, b=1.4)
MB = [dict(t0=5.2, t1=7.4, n=4), dict(t0=16.95, t1=19.0, n=4), dict(t0=43.3, t1=46.0, n=4)]

# ----------------------------------------------------------------- re-time to the voice actually used
# The shots were designed on the baseline narration (scenes/base_dur.json). When audio/vo/dur.json differs (another voice),
# every time in the film is warped piecewise-linearly so each picture event keeps its place relative to its line.
BASE = json.load(open(os.path.join(HERE, 'base_dur.json'))); KEYS = list(LINES.keys()); BT = dict(T); DUR_BASE = DUR
NT = {}
for i, k in enumerate(KEYS):
    NT[k] = BT[k] if i == 0 else round(NT[KEYS[i - 1]] + VO[KEYS[i - 1]] + max(.3, BT[k] - BT[KEYS[i - 1]] - BASE[KEYS[i - 1]]), 3)
KNOTS = [(0.0, 0.0)] + [(BT[k], NT[k]) for k in KEYS] + [(DUR_BASE, NT['L11'] + DUR_BASE - BT['L11'])]
def W(t):
    if t <= KNOTS[0][0]: return t
    for (a, b), (c_, d_) in zip(KNOTS, KNOTS[1:]):
        if t <= c_: return b + (t - a) * (d_ - b) / (c_ - a)
    return KNOTS[-1][1] + (t - KNOTS[-1][0])
NUM = (int, float)
def warp(o):
    if isinstance(o, list):
        for x in o: warp(x)
    elif isinstance(o, dict):
        if isinstance(o.get('t'), NUM) and isinstance(o.get('d'), NUM):
            t0, d0 = o['t'], o['d']; o['t'] = round(W(t0), 4); o['d'] = round(W(t0 + d0) - W(t0), 4)
        elif isinstance(o.get('t'), NUM): o['t'] = round(W(o['t']), 4)
        for k in ('t0', 't1', 'out'):
            if isinstance(o.get(k), NUM): o[k] = round(W(o[k]), 4)
        for k, v in o.items():
            if isinstance(v, (list, dict)): warp(v)
for obj_ in (E, EV, c.moves, c.shakes, MB): warp(obj_)
SIL = (round(W(SIL[0]), 3), round(W(SIL[1]), 3)); T = dict(NT); DUR = round(W(DUR_BASE), 3)

# ----------------------------------------------------------------- subtitles: one line each, long ones cut in two
def cut(text, n):
    i = text.find(' ', n)
    return [text] if i < 0 else [text[:i].rstrip(' —'), text[i + 1:]]
subs = []
for k, txt in LINES.items():
    t0, d = T[k], VO[k]; ev(t0, 'vo', id=k)
    parts = cut(txt, SPLIT[k]) if k in SPLIT else [txt]
    tot = sum(len(p) for p in parts); a = t0
    for p in parts:
        span = (d + .6) * len(p) / tot
        subs.append(dict(t0=round(a, 3), t1=round(a + max(1.8, span), 3), zh=p, en='', speech=round(d * len(p) / tot, 3)))
        a += d * len(p) / tot
for a_, b_ in zip(subs, subs[1:]):
    if a_['t1'] > b_['t0'] - .02: a_['t1'] = round(b_['t0'] - .02, 3)

scene = dict(dur=DUR, board=dict(w=BW, h=BH, seed=19, texScale=.42, ghosts=110), hand=1.0, sheen=.075,
             light=dict(x=-1800, y=-2400, r=17000, min=.8),
             tray=[dict(kind='marker', color='graphite', x=1500, rot=-2), dict(kind='marker', color='blue', x=1900, rot=1.5),
                   dict(kind='marker', color='red', x=2260, rot=-1), dict(kind='eraser', x=4400, rot=.5), dict(kind='marker', color='graphite', x=5200, rot=3)],
             cam=c.json(), mb=MB, elements=E, ev=sorted(EV, key=lambda e: e['t']), subs=subs, cues=dict(T, silence=SIL, bpm=96, warp=KNOTS))
json.dump(scene, open(os.path.join(HERE, 'film.json'), 'w'), ensure_ascii=False, indent=1)
json.dump([dict(t0=s['t0'], t1=s['t1'], text=s['zh']) for s in subs], open(os.path.join(ROOT, 'audio', 'cues.json'), 'w'), ensure_ascii=False, indent=1)
print('scenes/film.json', DUR, 's ·', len(E), 'elements ·', len(EV), 'events ·', len(subs), 'subtitle cues')
