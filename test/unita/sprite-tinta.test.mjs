/* La ricolorazione di un pezzo, `"tinta"` nel foglietto (strumenti/sprite/atlante.py, `ritinge_in`): la tonalità dei pixel
   verdi ruota al viola, la pelle e il grigio restano, l'alfa non si tocca. Per una figura provvisoria fatta da un'altra
   (l'incantatrice è la guaritrice col verde ruotato, docs/sotterraneo/chi-cura.md). Lancia il vero script Python su
   una figurina finta; senza python3 o Pillow (come in CI, che lancia solo le unità) salta e lo dice. L'ultimo pezzo guarda
   che l'atlante del sotterraneo abbia le due pose dell'incantatrice. */
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

const python = code => {
  const r = spawnSync('python3', ['-c', code], { encoding: 'utf8', cwd: new URL('../..', import.meta.url).pathname })
  return r.status === 0 ? JSON.parse(r.stdout.trim().split('\n').pop()) : null
}

const PROVA = `
import sys, json
sys.path.insert(0, 'strumenti/sprite')
import atlante as A
from PIL import Image
import colorsys

VERDE, PELLE, GRIGIO = (60, 140, 60, 255), (230, 180, 140, 255), (120, 120, 120, 255)
im = Image.new('RGBA', (3, 1), VERDE)
im.putpixel((1, 0), PELLE)
im.putpixel((2, 0), GRIGIO)
im.putpixel((0, 0), (60, 140, 60, 200))     # un pixel verde mezzo trasparente: l'alfa resta
def tonalita(c): return round(colorsys.rgb_to_hsv(c[0] / 255, c[1] / 255, c[2] / 255)[0] * 360)
fuori = A.ritinge_in(im, {'da': [50, 170], 'gradi': 195}, 'a')
out = {
  'verde_prima': tonalita(im.getpixel((0, 0))),
  'verde_dopo': tonalita(fuori.getpixel((0, 0))),
  'alfa': fuori.getpixel((0, 0))[3],
  'pelle': list(fuori.getpixel((1, 0))),
  'grigio': list(fuori.getpixel((2, 0))),
  'senza': list(A.ritinge_in(im, None, 'b').getpixel((0, 0))),
  'storta': list(A.ritinge_in(im, {'da': 5}, 'c').getpixel((0, 0))),
  'originale': list(im.getpixel((0, 0))),
}
print(json.dumps(out))
`

const r = python(PROVA)
if (!r) {
  nota('python3 o Pillow non ci sono: salto la prova su una figurina finta')
} else {
  uguale('il verde era a 120 gradi', r.verde_prima, 120)
  // 120 + 195 = 315 (un viola rosato): ±4 per l'arrotondamento dei canali a 8 bit
  controlla('dopo la tinta il verde è un viola (circa 315 gradi)', Math.abs(r.verde_dopo - 315) <= 4, String(r.verde_dopo))
  uguale('l\'alfa non si tocca', r.alfa, 200)
  uguale('la pelle resta com\'era', JSON.stringify(r.pelle), '[230,180,140,255]')
  uguale('il grigio resta com\'era', JSON.stringify(r.grigio), '[120,120,120,255]')
  uguale('senza "tinta" non fa niente', JSON.stringify(r.senza), JSON.stringify(r.originale))
  uguale('una regola storta non fa niente (e lo dice)', JSON.stringify(r.storta), JSON.stringify(r.originale))
  uguale('l\'originale non si modifica', JSON.stringify(r.originale), '[60,140,60,200]')
}

// nell'atlante vero ci sono le due pose dell'incantatrice, e il foglietto dice che la tinta è sua
const atlante = readFileSync(new URL('../../src/giochi/sotterraneo/dati/atlante.js', import.meta.url), 'utf8')
for (const n of ['incantatrice-fermo-0', 'incantatrice-saluta-0']) controlla(`nell'atlante c'è ${n}`, atlante.includes(`"${n}":[`))
const foglietto = JSON.parse(readFileSync(new URL('../../strumenti/sprite/sorgenti/sotterraneo/generati/sopra-personaggi-1.json', import.meta.url), 'utf8'))
for (const n of ['incantatrice-fermo-0', 'incantatrice-saluta-0'])
  controlla(`${n}: dal foglietto, ricolorato`, !!(foglietto.sprite[n] && foglietto.sprite[n].tinta))

riassunto('la ricolorazione dei pezzi')
