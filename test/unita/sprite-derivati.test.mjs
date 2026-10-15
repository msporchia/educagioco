/* I pezzi derivati in codice (strumenti/sprite/derivati.py, la configurazione dei muri obliqui in diagonali.py; docs/core/sprite.md): le maschere,
   la faccia che si sposta di un pixel per colonna, il bordo che corre lungo la diagonale, e che i fogli scritti in `sorgenti/` siano proprio
   quelli che il comando rifà (un foglio ritoccato a mano, o una configurazione cambiata senza rilanciarlo, è rosso). Lancia il vero script
   Python; senza python3 o Pillow (come in CI, che lancia solo le unità) salta e lo dice. */
import { spawnSync } from 'node:child_process'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

const J = JSON.stringify
const python = code => {
  const r = spawnSync('python3', ['-c', code], { encoding: 'utf8', cwd: new URL('../..', import.meta.url).pathname })
  return r.status === 0 ? JSON.parse(r.stdout.trim().split('\n').pop()) : null
}

const PROVA = `
import sys, json
sys.path.insert(0, 'strumenti/sprite')
import derivati as D, diagonali as G, inferno as I
from PIL import Image

def conta(m): return sum(1 for v in m.getdata() if v)
T = 16
# una tessera di prova: ogni colonna di un colore, ogni riga un'altra tinta
fila = Image.new('RGBA', (32, 20))
for x in range(32):
    for y in range(20): fila.putpixel((x, y), (x * 7 % 256, y * 12, 9, 255))
roccia = Image.new('RGBA', (16, 16), (50, 50, 50, 255))
bordo = Image.new('RGBA', (16, 4), (200, 10, 10, 255))
righe = list(range(16))
no = D.faccia_su_diagonale(fila, 'no', 0, righe)
ne = D.faccia_su_diagonale(fila, 'ne', 1, righe)
so = D.bordo_su_diagonale(roccia, bordo, 'so')
se = D.bordo_su_diagonale(roccia, bordo, 'se')
tri = D.triangolo(16, 'so')
cerchio = D.quarto_di_cerchio(16, 'no')
# lo stesso foglio che sta in sorgenti: i pezzi rifatti devono combaciare col PNG scritto
fuori = {}
for scena in G.SCENE:
    pezzi = G.costruisci(scena)
    foglio = Image.open(D.SORGENTI / 'sotterraneo/generati' / (G.SCENE[scena]['foglio'] + '.png')).convert('RGBA')
    nomi = sorted(pezzi)
    fuori[scena] = all(foglio.crop((16 * i, 0, 16 * i + 16, 32)).tobytes() == pezzi[n].convert('RGBA').crop((0, 0, 16, 32)).tobytes() if pezzi[n].height == 32
                      else foglio.crop((16 * i, 0, 16 * i + 16, 16)).tobytes() == pezzi[n].convert('RGBA').tobytes() for i, n in enumerate(nomi))
# e i pezzi dell'inferno (inferno.py): il foglio scritto in sorgenti è quello che il codice rifà adesso, pezzo per pezzo
inf = I.costruisci()
inf_foglio = Image.open(D.SORGENTI / 'sotterraneo/generati' / (I.FOGLIO + '.png')).convert('RGBA')
inf_json = json.loads((D.SORGENTI / 'sotterraneo/generati' / (I.FOGLIO + '.json')).read_text())
inferno_uguale = sorted(inf) == sorted(inf_json['sprite']) and all(
    inf_foglio.crop((s['da'][0], s['da'][1], s['da'][0] + s['cella'][0], s['da'][1] + s['cella'][1])).tobytes() == inf[n].convert('RGBA').tobytes()
    for n, s in inf_json['sprite'].items())
inferno_misure = {n: list(inf[n].size) for n in ('inferno-pav-stanze', 'inferno-pav-corridoi', 'inferno-tetto', 'inferno-medaglione')}
# senza cuciture: il lato destro continua nel sinistro, il basso nell'alto (la differenza fra due pixel che si toccano è piccola quanto fra due vicini)
def salto(im, a, b): return sum(abs(x - y) for x, y in zip(im.getpixel(a)[:3], im.getpixel(b)[:3]))
pav = inf['inferno-pav-stanze']
cucitura = [salto(pav, (63, y), (0, y)) for y in range(0, 48, 3)]
interno = [salto(pav, (31, y), (32, y)) for y in range(0, 48, 3)]
out = {
  'inferno_uguale': inferno_uguale, 'inferno_misure': inferno_misure, 'cucitura': sum(cucitura) / len(cucitura), 'interno': sum(interno) / len(interno),
  'tri_pixel': conta(tri), 'tri_angolo': tri.getpixel((0, 15)), 'tri_lontano': tri.getpixel((15, 0)), 'tri_diag': [tri.getpixel((7, 8)), tri.getpixel((7, 7))],
  'cerchio_angolo': cerchio.getpixel((0, 0)), 'cerchio_lontano': cerchio.getpixel((15, 15)), 'cerchio_pixel': conta(cerchio),
  'prof': [D.profondita(h) for h in (0, 1, 2, 3, 5, 12)],
  'no_misura': list(no.size), 'no_colonna0': no.getpixel((0, 16))[:3], 'no_colonna_sopra': [no.getpixel((0, 15))[3], no.getpixel((0, 31))[3]],
  'no_u15': [no.getpixel((15, 0))[3], no.getpixel((15, 1))[3], no.getpixel((15, 16))[3], no.getpixel((15, 17))[3]],
  'ne_u0': [ne.getpixel((0, 0))[3], ne.getpixel((0, 15))[3], ne.getpixel((0, 16))[3]],
  'so_pavimento': [so.getpixel((15, 0))[3], so.getpixel((0, 15))[3], so.getpixel((0, 1))[3]],
  'so_bordo_in_cima': so.getpixel((0, 1))[:3], 'so_roccia_giu': so.getpixel((0, 15))[:3],
  'se_specchio': [se.getpixel((15, 1))[3], se.getpixel((0, 15))[3], se.getpixel((15, 15))[3]],
  'fogli': fuori,
}
print(json.dumps(out))
`

const r = python(PROVA)
if (!r) {
  nota('python3 o Pillow non ci sono: salto le prove sui pezzi derivati')
} else {
  controlla('inferno.py rifà il foglio scritto in sorgenti, pezzo per pezzo', r.inferno_uguale)
  uguale('...coi pavimenti, il tetto e il medaglione delle misure giuste', J(r.inferno_misure), J({ 'inferno-pav-stanze': [64, 48], 'inferno-pav-corridoi': [16, 64], 'inferno-tetto': [64, 64], 'inferno-medaglione': [48, 48] }))
  controlla('il pavimento si ripete senza cucitura: il salto fra il lato destro e il sinistro non supera il doppio di quello fra due pixel vicini', r.cucitura <= r.interno * 2 + 20, `${r.cucitura.toFixed(1)} contro ${r.interno.toFixed(1)}`)
  uguale('il triangolo: i pixel sotto la diagonale (120 su 256)', r.tri_pixel, 120)
  uguale('...col suo angolo retto in basso a sinistra, e l\'angolo opposto fuori', J([r.tri_angolo, r.tri_lontano]), J([255, 0]))
  uguale('...e la diagonale a gradini di un pixel: dentro un pixel sotto la linea, fuori sulla linea', J(r.tri_diag), J([255, 0]))
  uguale('il quarto di cerchio ha il centro nell\'angolo e lascia fuori l\'angolo opposto', J([r.cerchio_angolo, r.cerchio_lontano]), J([255, 0]))
  controlla('...e copre poco meno di un quarto di quadrato di raggio la cella', r.cerchio_pixel > 190 && r.cerchio_pixel < 210, String(r.cerchio_pixel))
  uguale('la profondità sul bordo cresce di un pixel ogni radice di due colonne', J(r.prof), J([0, 1, 1, 2, 3, 8]))
  uguale('la faccia obliqua è larga una cella e alta due', J(r.no_misura), J([16, 32]))
  uguale('`no`: la colonna sinistra comincia dove comincia la cella (riga 16) e prende la prima riga della faccia', J(r.no_colonna0), J([0, 0, 9]))
  uguale('...e a sinistra niente nella cella sopra, tutto nella cella', J(r.no_colonna_sopra), J([0, 255]))
  uguale('...a destra la fascia sale: la colonna 15 comincia alla riga 1', J(r.no_u15), J([0, 255, 255, 0]))
  uguale('`ne` scende verso destra: a sinistra comincia in alto', J(r.ne_u0), J([255, 255, 0]))
  uguale('il bordo: sotto la linea il pavimento è trasparente, la roccia piena', J(r.so_pavimento), J([0, 255, 255]))
  uguale('...in cima alla roccia c\'è il bordo, più in fondo la roccia', J([r.so_bordo_in_cima, r.so_roccia_giu]), J([[200, 10, 10], [50, 50, 50]]))
  uguale('`se` è lo specchio di `so`: la roccia sta in basso a destra, il pavimento in alto a sinistra', J(r.se_specchio), J([255, 0, 255]))
  for (const [scena, ok] of Object.entries(r.fogli)) controlla(`il foglio di ${scena} è quello che il comando rifà`, ok)
}

riassunto('i pezzi derivati in codice')
