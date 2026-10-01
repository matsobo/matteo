"""Prepara le immagini del sito dalle foto fornite da Matteo.
1) ritaglio (rembg) -> /tmp/cut/*.png (vedi README)   2) pulizia bordi, ricolorazione petali,
3) peonie per l'hero + mappe di profondità   4) composizioni del compositore (forma x tono).
Uso: python3 tools/prepara_foto.py  (dalla cartella petali-incantati, dopo il ritaglio)"""
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage
import colorsys, os

CUT = '/tmp/cut/'
OUT = 'assets/img/'
os.makedirs(OUT + 'peonia', exist_ok=True); os.makedirs(OUT + 'mazzi', exist_ok=True)

def load(n): return np.array(Image.open(CUT + n).convert('RGBA')).astype(np.float32) / 255

def defringe(A, white_bg=True, erode=2):
    a = A[..., 3]
    a = ndimage.grey_erosion(a, size=(erode * 2 + 1, erode * 2 + 1))
    a = ndimage.gaussian_filter(a, 0.7)
    B = A.copy()
    if white_bg:  # toglie il bianco di sfondo mescolato nei bordi
        k = np.clip(A[..., 3], 0.05, 1)[..., None]
        B[..., :3] = np.clip((A[..., :3] - (1 - k)), 0, 1) / k
        B[..., :3] = np.where(A[..., 3:4] > 0.95, A[..., :3], B[..., :3])
    B[..., 3] = a
    return B

def trim(A, pad=6):
    ys, xs = np.where(A[..., 3] > 0.02)
    return A[max(0, ys.min() - pad):ys.max() + pad, max(0, xs.min() - pad):xs.max() + pad]

def rgb2hsv(R):
    r, g, b = R[..., 0], R[..., 1], R[..., 2]
    mx, mn = R.max(-1), R.min(-1); d = mx - mn + 1e-6
    h = np.where(mx == r, ((g - b) / d) % 6, np.where(mx == g, (b - r) / d + 2, (r - g) / d + 4)) / 6
    s = np.where(mx > 0, d / (mx + 1e-6), 0)
    return h, s, mx

def hsv2rgb(h, s, v):
    i = np.floor(h * 6) % 6; f = h * 6 - np.floor(h * 6)
    p, q, t = v * (1 - s), v * (1 - f * s), v * (1 - (1 - f) * s)
    out = np.zeros(h.shape + (3,), np.float32)
    for k, (a, b, c) in enumerate([(v, t, p), (q, v, p), (p, v, t), (p, q, v), (t, p, v), (v, p, q)]):
        m = i == k; out[m] = np.stack([a[m], b[m], c[m]], -1)
    return out

def petal_mask(A):
    """petali = tutto ciò che non è verde (foglie/steli), vetro o vimini; morbido."""
    h, s, v = rgb2hsv(A[..., :3])
    green = np.exp(-((h - 0.27) / 0.09) ** 2) * np.clip((s - 0.12) / 0.15, 0, 1)
    brown = np.exp(-((h - 0.07) / 0.04) ** 2) * np.clip((s - 0.3) / 0.2, 0, 1) * (v < 0.8)
    m = np.clip(1 - green - brown, 0, 1)
    return ndimage.gaussian_filter(m, 1.2)

def recolor(A, mode, mask=None):
    if mode == 'orig': return A
    m = petal_mask(A) if mask is None else mask
    h, s, v = rgb2hsv(A[..., :3])
    lum = (A[..., :3] @ np.array([0.3, 0.59, 0.11], np.float32))
    if mode == 'bianco':
        Ln = np.clip(lum / (np.percentile(lum[m > 0.5], 95) + 1e-3), 0, 1) if (m > 0.5).any() else lum
        tgt = np.clip(np.stack([0.72 + 0.28 * Ln] * 3, -1) * np.array([1.0, 0.98, 0.93], np.float32), 0, 1)
    elif mode == 'cipria':
        tgt = hsv2rgb(np.full_like(h, 0.97), np.clip(s * 0.42, 0, 0.32), np.clip(0.35 + v * 0.7, 0, 1))
    elif mode == 'lilla':
        tgt = hsv2rgb(np.full_like(h, 0.77), np.clip(np.maximum(s, 0.2) * 0.5, 0, 0.42), np.clip(0.12 + v * 0.92, 0, 1))
    elif mode == 'magenta':
        tgt = hsv2rgb(np.full_like(h, 0.92), np.clip(np.maximum(s, 0.3) * 1.15, 0, 0.92), np.clip(v * 0.82, 0, 1))
    elif mode in ('corallo', 'arancio', 'giallo'):
        tint = {'corallo': (0.98, 0.42, 0.36), 'arancio': (1.0, 0.55, 0.16), 'giallo': (1.0, 0.82, 0.25)}[mode]
        L = np.clip(lum * 1.05, 0, 1)[..., None]
        tgt = np.clip(np.array(tint, np.float32) * (0.25 + 0.85 * L) + (L ** 6) * 0.2, 0, 1)
    out = A.copy()
    out[..., :3] = A[..., :3] * (1 - m[..., None]) + tgt * m[..., None]
    return out

def feather_bottom(A, px=50):
    A = A.copy(); n = min(px, A.shape[0]); A[-n:, :, 3] *= np.linspace(1, 0, n)[:, None] ** 1.5; return A

def to_img(A): return Image.fromarray((np.clip(A, 0, 1) * 255).astype(np.uint8), 'RGBA')
def scale(A, f): im = to_img(A); return np.array(im.resize((max(1, int(im.width * f)), max(1, int(im.height * f))), Image.LANCZOS)).astype(np.float32) / 255

def paste(canvas, A, x, y, shadow=0.0):
    """incolla A (RGBA float) con l'angolo in alto a sinistra in (x,y); ombra morbida opzionale."""
    if shadow:
        sh = ndimage.gaussian_filter(A[..., 3], 9) * shadow
        sA = np.zeros_like(A); sA[..., 3] = sh; sA[..., :3] = np.array([0.18, 0.12, 0.1])
        paste(canvas, sA, x + 10, y + 16)
    H, W = A.shape[:2]; CH, CW = canvas.shape[:2]
    x0, y0, x1, y1 = max(0, x), max(0, y), min(CW, x + W), min(CH, y + H)
    if x1 <= x0 or y1 <= y0: return
    src = A[y0 - y:y1 - y, x0 - x:x1 - x]; dst = canvas[y0:y1, x0:x1]
    a = src[..., 3:4]; out_a = a + dst[..., 3:4] * (1 - a)
    dst[..., :3] = (src[..., :3] * a + dst[..., :3] * dst[..., 3:4] * (1 - a)) / np.clip(out_a, 1e-5, 1)
    dst[..., 3:4] = out_a

def bleed(A):
    A = A.copy(); solid = A[..., 3] > 0.5
    if solid.any() and (~solid).any():
        idx = ndimage.distance_transform_edt(~solid, return_distances=False, return_indices=True)
        A[..., :3] = np.where(solid[..., None], A[..., :3], A[..., :3][idx[0], idx[1]])
    return A

def save(A, path, w=None, q=84):
    im = to_img(bleed(A))
    if w and im.width > w: im = im.resize((w, int(im.height * w / im.width)), Image.LANCZOS)
    im.save(path, 'WEBP', quality=q, method=6); print(path, im.size, os.path.getsize(path) // 1024, 'KB')

# ---------- sorgenti pulite ----------
peo = {k: trim(defringe(load(f'peo-{k}.png'))) for k in 'LMR'}
bqt = trim(defringe(load('4.png')))
ran = load('3.png'); ran = trim(defringe(ran, white_bg=False, erode=2))
RAN_MASK = petal_mask(ran) * np.clip((0.42 - np.linspace(0, 1, ran.shape[0])[:, None]) / 0.06, 0, 1)
# foto 2: solo la peonia in primo piano (componente nitida più grande a destra)
p2 = load('2.png'); a2 = p2[..., 3] > 0.5
lab, k = ndimage.label(a2); objs = ndimage.find_objects(lab)
best = max(range(k), key=lambda i: (objs[i][1].start > p2.shape[1] * 0.4) * ndimage.sum(a2, lab, i + 1))
mm = ndimage.binary_dilation(lab == best + 1, iterations=4)
p2[..., 3] *= ndimage.gaussian_filter(mm.astype(np.float32), 2)
mag = trim(defringe(p2, white_bg=False, erode=1))

# ---------- hero: tre stadi + profondità ----------
H = 1100
for name, key in [('a', 'R'), ('b', 'L'), ('c', 'M')]:
    A = peo[key]
    # tela comune: stessa altezza, allineata al fondo e centrata sullo stelo
    f = H / A.shape[0]; A = scale(A, f)
    W = 900; canvas = np.zeros((H, W, 4), np.float32)
    stem_x = int(np.average(np.arange(A.shape[1]), weights=A[-40:, :, 3].sum(0) + 1e-3))
    paste(canvas, A, W // 2 - stem_x, 0)
    save(canvas, OUT + f'peonia/peonia-{name}.webp', w=900, q=86)
    al = canvas[..., 3] > 0.5
    d = ndimage.distance_transform_edt(al); d = np.sqrt(d / (d.max() + 1e-6))
    head = np.clip(1.2 - np.linspace(0, 1, H)[:, None] * 1.9, 0, 1)  # la corolla sporge più di foglie e stelo
    dep = ndimage.gaussian_filter(d * (0.35 + 0.65 * head), 6)
    Image.fromarray((np.clip(dep / dep.max(), 0, 1) * 255).astype(np.uint8)).resize((225, 275)).save(OUT + f'peonia/profondita-{name}.png')
    sm = np.array(Image.fromarray((canvas[..., 3] * 255).astype(np.uint8)).resize((225, 275), Image.LANCZOS)).astype(np.float32) / 255
    sm = ndimage.gaussian_filter(sm, 7)
    yy, xx = np.mgrid[0:275, 0:225]; edge = np.clip(np.minimum.reduce([xx, yy, 224 - xx, 274 - yy]) / 18, 0, 1)
    Image.fromarray((np.clip(sm * edge * 1.3, 0, 1) * 255).astype(np.uint8)).save(OUT + f'peonia/ombra-{name}.png')

# ---------- compositore: forma x tono ----------
CW, CH = 820, 960
def blank(): return np.zeros((CH, CW, 4), np.float32)
def head(A, frac): return feather_bottom(trim(A[:int(A.shape[0] * frac)]), 60)
heads = {'L': head(peo['L'], 0.44), 'M': head(peo['M'], 0.41), 'R': head(peo['R'], 0.46)}
ran_top = feather_bottom(trim(ran[:int(ran.shape[0] * 0.34)]), 70)          # i ranuncoli sopra il vaso
# nastro + steli del mazzo: dal bordo superiore del nastro rosa in giù
_h, _s, _v = rgb2hsv(bqt[..., :3])
_pink = (np.abs(_h - 0.94) < 0.05) & (_s > 0.12) & (_v > 0.75) & (bqt[..., 3] > 0.5)
_rows = np.where(_pink[int(bqt.shape[0] * 0.5):].sum(1) > 15)[0] + int(bqt.shape[0] * 0.5)
RIB = _rows.min()
bq_low = bqt.copy(); bq_low[:RIB, :, 3] = 0
_cols = np.where(_pink[RIB:RIB + 40].sum(0) > 0)[0]; _x0, _x1 = _cols.min() - 10, _cols.max() + 10
_top = np.zeros(bqt.shape[:2], bool); _top[RIB:RIB + 160] = True; _top[:, _x0:_x1] = False
_dh0 = np.minimum(np.abs(_h - 0.95), 1 - np.abs(_h - 0.95))
_ribbonish = ndimage.binary_dilation((_dh0 < 0.1) & (_s > 0.05) & (_v > 0.6), iterations=3)
bq_low[_top & ~_ribbonish, 3] = 0                     # niente foglie tagliate ai lati del nastro
bq_low[..., 3] = np.clip((bq_low[..., 3] - 0.3) / 0.45, 0, 1)   # via i residui semitrasparenti
bq_low = trim(bq_low, pad=0)
ran_stems = trim(ran[:int(ran.shape[0] * 0.455)])    # ranuncoli con gli steli fino al bordo del vaso

TONI = {
  'bianchi':  dict(peo='bianco', ran='bianco', nastro='bianco'),
  'cipria':   dict(peo='cipria', ran='orig', nastro='orig'),
  'accesi':   dict(peo='corallo', ran='arancio', nastro='orig'),
  'lilla':    dict(peo='lilla', ran='lilla', nastro='lilla'),
  'libero':   dict(peo='orig', ran='orig', nastro='orig'),
}

def mazzo(t):
    c = np.zeros((CH + 200, CW + 400, 4), np.float32)
    if t == 'accesi':  # il mazzo della foto è già nei toni accesi
        c = blank(); A = scale(bqt, (CH - 30) / bqt.shape[0]); paste(c, A, (CW - A.shape[1]) // 2, 15, shadow=0.25); return c
    T = TONI[t]
    r1 = scale(recolor(ran_stems, T['ran'], mask=petal_mask(ran_stems) * np.clip((0.75 - np.linspace(0, 1, ran_stems.shape[0])[:, None]) / 0.05, 0, 1)), 0.72)
    _h2, _s2, _ = rgb2hsv(bq_low[..., :3])
    _dh = np.minimum(np.abs(_h2 - 0.95), 1 - np.abs(_h2 - 0.95))
    ribbon_mask = ndimage.gaussian_filter((np.exp(-(_dh / 0.09) ** 2) * np.clip((_s2 - 0.04) / 0.08, 0, 1)).astype(np.float32), 1.5)
    low = scale(recolor(bq_low, T['nastro'], mask=ribbon_mask), 0.72)
    cx = (CW + 400) // 2; ry = 250
    rx = cx - r1.shape[1] // 2
    # stelo: punto in cui gli steli dei ranuncoli convergono (in basso al centro del ritaglio)
    stem_bottom = ry + r1.shape[0]
    hs = [scale(recolor(heads[k], T['peo']), sc) for k, sc in [('R', 0.5), ('M', 0.47), ('L', 0.49)]]
    xs = [cx - hs[0].shape[1] // 2 + 10, rx - 40, rx + r1.shape[1] - hs[2].shape[1] + 50]
    ys = [ry - hs[0].shape[0] + 110, ry - hs[1].shape[0] + 170, ry - hs[2].shape[0] + 160]
    for A, x, y in zip(hs, xs, ys): paste(c, A, x, y, shadow=0.3)
    paste(c, r1, rx, ry, shadow=0.3)
    if t == 'libero':
        A = scale(mag, 0.32); paste(c, A, cx + 40, ry + 70, shadow=0.35)
    # nastro sopra il punto di taglio degli steli
    paste(c, low, cx - low.shape[1] // 2 + 18, stem_bottom - 70, shadow=0.25)
    ys_, xs_ = np.where(c[..., 3] > 0.02)
    k = min(1.0, (CH - 20) / (ys_.max() - ys_.min() + 1), (CW - 20) / (xs_.max() - xs_.min() + 1))
    c = c[ys_.min():ys_.max() + 1, xs_.min():xs_.max() + 1]
    if k < 1: c = scale(c, k)
    out = blank(); paste(out, c, (CW - c.shape[1]) // 2, (CH - c.shape[0]) // 2)
    return out

def composizione(t):
    c = blank(); T = TONI[t]
    A = recolor(ran, 'arancio' if t == 'accesi' else T['ran'], mask=RAN_MASK)
    A = scale(A, (CW - 40) / A.shape[1]); paste(c, A, 20, CH - A.shape[0] - 30, shadow=0.2)
    top = CH - A.shape[0] - 30
    if t == 'accesi':
        h = scale(mag, 0.34); paste(c, h, 330, top + 40, shadow=0.35)
    elif t in ('libero', 'cipria', 'lilla'):
        h = scale(recolor(heads['L'], T['peo']), 0.4); paste(c, h, 300, top + 10, shadow=0.35)
    return c

def pianta(t):
    c = blank(); T = TONI[t]
    mode = {'bianchi': 'bianco', 'cipria': 'cipria', 'accesi': 'magenta', 'lilla': 'lilla', 'libero': 'orig'}[t]
    for k, s, dx in [('L', 0.62, -120), ('R', 0.6, 130), ('M', 0.66, 0)]:
        A = scale(recolor(peo[k], mode), s * 0.98)
        paste(c, A, CW // 2 - A.shape[1] // 2 + dx, 70 + (0 if k == 'M' else 60), shadow=0.25)
    # vaso in terracotta disegnato con luce morbida
    pw_top, pw_bot, ph, top = 330, 240, 330, CH - 360
    yy, xx = np.mgrid[0:ph, 0:CW].astype(np.float32)
    half = pw_top / 2 - (pw_top - pw_bot) / 2 * (yy / ph)
    u = (xx - CW / 2) / half
    inside = (np.abs(u) <= 1).astype(np.float32)
    shade = 0.55 + 0.45 * np.cos(np.clip(u, -1, 1) * 1.35 - 0.35)
    grain = (np.random.default_rng(3).random((ph, CW)) - 0.5) * 0.06
    base = np.array([0.72, 0.38, 0.24], np.float32)
    rgb = np.clip(base * shade[..., None] + grain[..., None], 0, 1)
    rim = (yy < 52).astype(np.float32)
    rgb = rgb * (1 + rim[..., None] * 0.1)                              # bordo più chiaro
    under = np.exp(-((yy - 56) / 7) ** 2)[..., None]; rgb = rgb * (1 - under * 0.35)   # ombra sotto il bordo
    rgb = rgb * (1 - (yy / ph)[..., None] * 0.18)                        # più scuro verso il fondo
    hi = np.exp(-((u + 0.45) / 0.12) ** 2)[..., None] * 0.12; rgb = np.clip(rgb + hi, 0, 1)
    pot = np.dstack([rgb, ndimage.gaussian_filter(inside, 0.8)])
    paste(c, pot, 0, top, shadow=0.3)
    return c

for form, fn in [('mazzo', mazzo), ('composizione', composizione), ('pianta', pianta)]:
    for t in TONI:
        save(fn(t), OUT + f'mazzi/{form}-{t}.webp', w=720, q=80)
