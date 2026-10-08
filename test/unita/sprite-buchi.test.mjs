/* La pulizia dei buchi interni, `"buchi"` nel foglietto (strumenti/sprite/atlante.py, `buchi_in`).

   `allaga` toglie il fondo del foglio solo dal bordo, e dentro una figura chiusa (l'occhio di una chiave, il
   vuoto fra un arco e la sua corda, l'interno di un anello) resta il nero. `buchi_in` lo toglie, pezzo per pezzo,
   senza toccare il grigio di una lama: il colore da solo non basta, e per questo si dichiara sul pezzo.
   Il test lancia il vero script Python su una figurina finta; senza python3 o Pillow (come in CI, che lancia
   solo le unità) salta quel pezzo e lo dice. Il secondo pezzo guarda l'atlante vero del sotterraneo. */
import { spawnSync } from 'node:child_process'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

const python = code => {
  const r = spawnSync('python3', ['-c', code], { encoding: 'utf8', cwd: new URL('../..', import.meta.url).pathname })
  // lo script può scrivere avvisi prima: il risultato è l'ultima riga
  return r.status === 0 ? JSON.parse(r.stdout.trim().split('\n').pop()) : null
}

const PROVA = `
import sys, json
sys.path.insert(0, 'strumenti/sprite')
import atlante as A
from PIL import Image

FONDI = [(0, 0, 0)]
GRIGIO, NERO, SFUMATO, ROSSO = (110, 110, 110, 255), (0, 0, 0, 255), (35, 35, 35, 255), (200, 60, 60, 255)

def anello():
    # una cornice rossa, dentro un grigio da lama, in mezzo un buco nero 3x3 con un contorno sfumato (media fra figura e fondo)
    im = Image.new('RGBA', (11, 11), (0, 0, 0, 0))
    px = im.load()
    for y in range(1, 10):
        for x in range(1, 10):
            px[x, y] = ROSSO
    for y in range(2, 9):
        for x in range(2, 9):
            px[x, y] = GRIGIO
    for y in range(3, 8):
        for x in range(3, 8):
            px[x, y] = SFUMATO
    for y in range(4, 7):
        for x in range(4, 7):
            px[x, y] = NERO
    return im

def alfa(im, x, y): return im.getpixel((x, y))[3]
def colore(im, x, y): return list(im.getpixel((x, y)))

out = {}
base = anello()
out['senza'] = alfa(A.buchi_in(base, None, FONDI, 'a'), 5, 5)
fatto = A.buchi_in(base, True, FONDI, 'b')
out['centro'] = alfa(fatto, 5, 5)
out['sfumato'] = alfa(fatto, 3, 5)             # il contorno del buco se ne va con lui
out['angolo_sfumato'] = alfa(fatto, 3, 3)      # anche l'angolo, al secondo giro
out['grigio'] = [alfa(fatto, 2, 2), colore(fatto, 2, 2), alfa(fatto, 2, 5), colore(fatto, 8, 8)]
out['cornice'] = [alfa(fatto, 1, 1), colore(fatto, 1, 5), alfa(fatto, 9, 9)]
out['piccolo'] = alfa(A.buchi_in(base, 4, FONDI, 'c'), 5, 5)       # la macchia (9 pixel) è più grande del tetto
out['grande'] = alfa(A.buchi_in(base, 9, FONDI, 'd'), 5, 5)        # e con un tetto che la contiene se ne va
out['dizionario'] = alfa(A.buchi_in(base, {'max': 20, 'tolleranza': 30}, FONDI, 'e'), 5, 5)
out['originale'] = alfa(base, 5, 5)                                # l'originale non si tocca
# una macchia che tocca il bordo del ritaglio non si sa se è chiusa: resta
bordo = Image.new('RGBA', (5, 5), NERO)
out['bordo'] = alfa(A.buchi_in(bordo, True, FONDI, 'f'), 2, 2)
# un foglio senza fondo non ha niente da togliere: torna com'è
out['senza_fondo'] = alfa(A.buchi_in(base, True, None, 'g'), 5, 5)
print(json.dumps(out))
`

const ATLANTE = `
import sys, json, re, base64, io
from PIL import Image
s = open('src/giochi/sotterraneo/dati/atlante.js').read()
im = Image.open(io.BytesIO(base64.b64decode(re.search(r"ATLANTE = 'data:image/png;base64,([^']+)'", s).group(1)))).convert('RGBA')
P = json.loads(re.search(r"export const PEZZI = (\\{.*?\\})\\n", s).group(1))
def neri(n):
    # pixel opachi del colore del fondo del foglio (nero): in un pezzo con un vuoto dentro non ne restano
    x, y, w, h = P[n]
    return sum(1 for j in range(h) for i in range(w)
               if im.getpixel((x + i, y + j))[3] and max(im.getpixel((x + i, y + j))[:3]) <= 26)
print(json.dumps({n: neri(n) for n in sys.argv[1:] or %NOMI%}))
`

const CON_BUCO = ['arco-corto', 'arco-lungo', 'balestra', 'chiave-oro', 'chiave-ferro', 'chiave-verde', 'chiave-blu',
                  'anello-ambra', 'anello-verde', 'amuleto-rosso']

const r = python(PROVA)
if (!r) {
  nota('python3 o Pillow non ci sono: salto la prova su una figurina finta')
} else {
  uguale('senza "buchi" il buco resta', r.senza, 255)
  uguale('con "buchi" il buco nero in mezzo diventa trasparente', r.centro, 0)
  uguale('e il suo contorno sfumato se ne va con lui', r.sfumato, 0)
  uguale('anche l\'angolo del contorno, al secondo giro', r.angolo_sfumato, 0)
  controlla('il grigio della lama non si tocca', r.grigio[0] === 255 && r.grigio[2] === 255 &&
            JSON.stringify(r.grigio[1]) === '[110,110,110,255]' && JSON.stringify(r.grigio[3]) === '[110,110,110,255]',
            JSON.stringify(r.grigio))
  controlla('la cornice resta intera', r.cornice[0] === 255 && r.cornice[2] === 255 &&
            JSON.stringify(r.cornice[1]) === '[200,60,60,255]', JSON.stringify(r.cornice))
  uguale('con un tetto più piccolo della macchia, resta', r.piccolo, 255)
  uguale('con un tetto che la contiene, se ne va', r.grande, 0)
  uguale('si può dichiarare anche con max e tolleranza', r.dizionario, 0)
  uguale('l\'originale non si modifica', r.originale, 255)
  uguale('una macchia sul bordo del ritaglio non si sa se è chiusa, e resta', r.bordo, 255)
  uguale('senza un fondo dichiarato non fa niente', r.senza_fondo, 255)
}

const vero = python(ATLANTE.replace('%NOMI%', JSON.stringify(CON_BUCO)))
if (!vero) {
  nota('python3 o Pillow non ci sono: salto la prova sull\'atlante vero')
} else {
  for (const n of CON_BUCO)
    uguale(`atlante del sotterraneo: ${n} non ha nero del fondo rimasto dentro`, vero[n], 0)
}

riassunto('buchi interni dei pezzi')
