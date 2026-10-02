# Divide la foto del burger (scontornata con rembg in /tmp/burger_cut.png) in 5 strati per la scena 3D e scrive assets/js/burger-data.js.
# Requisiti: pip install pillow numpy scipy opencv-python-headless rembg
import numpy as np, cv2, base64, json
from PIL import Image
from scipy import ndimage
src = np.asarray(Image.open('/tmp/burger_cut.png').convert('RGBA'))  # 1500x1000, coordinate originali
H0, W0 = src.shape[:2]
rgb = src[:,:,:3]; alpha = src[:,:,3]
sil = alpha > 128
X, Y = np.meshgrid(np.arange(W0), np.arange(H0))
def curva(pts):
    xs, ys = zip(*pts); return np.interp(np.arange(W0), xs, ys)[None,:]
C1 = curva([(0,355),(270,355),(350,385),(500,425),(700,437),(850,432),(1000,410),(1150,375),(1220,340),(1500,340)])   # fondo del pane sopra
PT = curva([(0,470),(290,470),(500,455),(800,450),(1100,455),(1210,480),(1500,480)])                                   # cima della carne
C3 = curva([(0,640),(300,640),(400,700),(600,742),(800,752),(1000,732),(1150,690),(1210,640),(1500,640)])               # fondo della carne
hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV).astype(np.float32)
h, s, v = hsv[:,:,0]*2, hsv[:,:,1]/255, hsv[:,:,2]/255
k = lambda r: cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(r,r))
def pulisci(m, aperto=5, chiuso=9, minimo=1500):
    m = cv2.morphologyEx(m.astype(np.uint8), cv2.MORPH_OPEN, k(aperto))
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, k(chiuso))
    lab, n = ndimage.label(m); sz = ndimage.sum(m, lab, range(1,n+1))
    return np.isin(lab, [i+1 for i,z in enumerate(sz) if z >= minimo])
sotto1 = Y > C1
verde = sil & sotto1 & (h > 55) & (h < 160) & (s > 0.3) & (v > 0.25)
insalata = pulisci(verde, 3, 7, 800)
mezzo = sil & sotto1 & (Y <= C3) & ~insalata
condimenti = pulisci(mezzo & (v > 0.42) & (s > 0.42) & ((h < 55) | (h > 330)), 5, 11, 3000)
carne = mezzo & ~condimenti & (v < 0.55) & (X > 288) & (X < 1214)
pane_sotto = sil & (Y > C3) & ~insalata
pane_sopra = sil & ~sotto1

def hull(m):
    pts = cv2.findNonZero(m.astype(np.uint8)); hh = cv2.convexHull(pts)
    out = np.zeros(m.shape, np.uint8); cv2.fillConvexPoly(out, hh, 1); return out.astype(bool)
# forme piene (parti nascoste ricostruite con inpainting)
ell = ((X-751)/462.0)**2 + ((Y-600)/178.0)**2 <= 1          # sagoma ellittica della carne
forma_carne = ell & (Y > PT - 4) & (Y <= C3 + 4)
forma_pane_sotto = hull(pulisci(pane_sotto, 5, 9, 5000))
def riempi(forma, visibile, patch, modo='tile'):
    """Parti nascoste dello strato. 'tile': texture vera della patch ripetuta a specchio (carne).
    'mollica': faccia tagliata del pane, colore della mollica con grana fine e bordo tostato."""
    if modo == 'tile':
        x0,y0,x1,y1 = patch
        tile = rgb[y0:y1, x0:x1].astype(np.float32)
        tile = np.concatenate([tile, tile[:, ::-1]], 1); tile = np.concatenate([tile, tile[::-1]], 0)
        tex = np.tile(tile, (H0 // tile.shape[0] + 1, W0 // tile.shape[1] + 1, 1))[:H0, :W0]
    else:
        rng = np.random.default_rng(5)
        n = cv2.GaussianBlur(rng.normal(0, 1, (H0, W0)).astype(np.float32), (0,0), 1.2) * 9
        n2 = cv2.GaussianBlur(rng.normal(0, 1, (H0, W0)).astype(np.float32), (0,0), 7) * 14
        tex = np.dstack([np.full((H0, W0), c, np.float32) + n + n2 for c in (232, 206, 162)])
        bordo = ndimage.distance_transform_edt(forma)
        tost = np.clip(1 - bordo / 26, 0, 1)[..., None]
        tex = tex * (1 - tost * 0.35) + np.array([150, 95, 45], np.float32) * tost * 0.35
    peso = cv2.GaussianBlur(visibile.astype(np.float32), (0,0), 2.5)[..., None]
    peso = np.where(visibile[..., None], 1.0, peso * 0.6)
    return (rgb * peso + tex * (1 - peso)).clip(0,255).astype(np.uint8)
strati = []
def aggiungi(nome, forma, colore, rilievo, avanti, visibile=None):
    # sovrapposizione di pochi pixel sugli strati vicini (pixel originali): niente fessure a panino chiuso
    estesa = cv2.dilate(forma.astype(np.uint8), k(9)).astype(bool) & sil
    colore = np.where((estesa & ~forma)[..., None], rgb, colore)
    if visibile is not None: visibile = visibile | (estesa & ~forma)
    forma = forma | estesa
    a = (cv2.GaussianBlur(forma.astype(np.float32), (0,0), 1.2) * 255).clip(0,255).astype(np.uint8)
    a = np.minimum(a, np.where(forma, 255, a))
    ys, xs = np.where(a > 8); x0, x1, y0, y1 = xs.min()-4, xs.max()+5, ys.min()-4, ys.max()+5
    rgba = np.dstack([colore, a])[y0:y1, x0:x1]
    m = forma[y0:y1, x0:x1]
    d = ndimage.distance_transform_edt(m); d = d / (d.max() or 1)
    dome = np.sqrt(np.clip(1-(1-d)**2, 0, 1))
    dep = ndimage.gaussian_filter(dome, 3) * m
    im = Image.fromarray(rgba, 'RGBA'); sc = 0.75
    im = im.resize((round(im.width*sc), round(im.height*sc)), Image.LANCZOS)
    vis = (forma if visibile is None else (visibile & forma))[y0:y1, x0:x1].astype(np.float32)
    vis = cv2.GaussianBlur(vis, (0,0), 2)
    dm = Image.fromarray(np.dstack([(dep*255), (vis*255), np.zeros_like(dep)]).astype(np.uint8), 'RGB').resize((max(8,im.width//2), max(8,im.height//2)), Image.LANCZOS)
    im.save(f'/tmp/strati/{nome}.webp', quality=86, method=6); dm.save(f'/tmp/strati/{nome}-d.png', optimize=True)
    strati.append(dict(nome=nome, x=x0/W0, y=y0/H0, w=(x1-x0)/W0, h=(y1-y0)/H0, rilievo=rilievo, avanti=avanti))
# ordine dal basso verso l'alto
vis_ps = pane_sotto & ~((h > 58) & (h < 170) & (s > 0.25)) & ~((v < 0.42) & (Y < C3 + 120))
vis_ps = cv2.erode(vis_ps.astype(np.uint8), k(5)).astype(bool)
vis_c = forma_carne & (v < 0.45) & ~((h > 58) & (h < 170) & (s > 0.25)) & (Y > 505)
vis_c = pulisci(vis_c, 3, 5, 400)
vis_carne = forma_carne & ~cv2.dilate(condimenti.astype(np.uint8), k(5)).astype(bool) & ~insalata
# pixel della foto rimasti senza strato (ombre, salsa scura): vanno allo strato più vicino, con il colore originale
coperti = pane_sopra | condimenti | vis_carne | insalata | vis_ps
resto = sil & ~coperti
r_ins = resto & cv2.dilate(insalata.astype(np.uint8), k(11)).astype(bool) & ~cv2.dilate(forma_pane_sotto.astype(np.uint8), k(3)).astype(bool)
resto = resto & ~r_ins
r_cond = resto & (Y <= PT + 10) & cv2.dilate(condimenti.astype(np.uint8), k(21)).astype(bool)
r_carne = resto & (Y > PT + 10) & (Y <= C3 + 30) & forma_carne
r_sotto = resto & ~r_cond & ~r_carne & (Y > PT) & cv2.dilate(forma_pane_sotto.astype(np.uint8), k(15)).astype(bool)
col_ps = riempi(forma_pane_sotto, vis_ps, None, 'mollica'); col_ps = np.where(r_sotto[..., None], rgb, col_ps)
col_c = riempi(forma_carne, vis_c, (640,620,940,700), 'tile'); col_c = np.where(r_carne[..., None], rgb, col_c)
# ordine dal basso verso l'alto
aggiungi('pane-sotto', forma_pane_sotto | r_sotto, col_ps, 0.55, 0, vis_ps | r_sotto)
aggiungi('insalata', insalata | r_ins, rgb, 0.35, 3)
aggiungi('carne', forma_carne | r_carne, col_c, 0.6, 1, vis_carne | r_carne)
aggiungi('condimenti', condimenti | r_cond, rgb, 0.3, 2)
aggiungi('pane-sopra', pane_sopra, rgb, 0.85, 4)
du = lambda p, m: f'data:{m};base64,' + base64.b64encode(open(p,'rb').read()).decode()
js = {'ratio': W0/H0, 'strati': [dict(s, colore=du(f"/tmp/strati/{s['nome']}.webp",'image/webp'), prof=du(f"/tmp/strati/{s['nome']}-d.png",'image/png')) for s in strati]}
open('/home/user/matteo/siti/maragliano/assets/js/burger-data.js','w').write('/* Strati del burger (foto scontornata e divisa), come data URI: WebGL li accetta anche da file:// */\nwindow.MARA_BURGER = ' + json.dumps(js) + ';\n')
# anteprima esplosa
tav = Image.new('RGBA', (1500, 1700), (242,230,217,255))
for i, s in enumerate(strati):
    im = Image.open(f"/tmp/strati/{s['nome']}.webp").resize((round(s['w']*W0), round(s['h']*H0)))
    tav.alpha_composite(im, (round(s['x']*W0), round(s['y']*H0) + 700 - i*170))
tav.convert('RGB').resize((750,850)).save('/tmp/esploso.png')
print([ (s['nome'], round(s['w'],2), round(s['h'],2)) for s in strati ])
