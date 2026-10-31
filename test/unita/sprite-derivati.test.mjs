/* I pezzi derivati in codice (strumenti/sprite/inferno.py, la libreria in derivati.py; docs/core/sprite.md): che il foglio scritto in `sorgenti/`
   sia proprio quello che il comando rifà (un foglio ritoccato a mano, o un comando cambiato senza rilanciarlo, è rosso). Lancia il vero script
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
import derivati as D, inferno as I
from PIL import Image

# i pezzi dell'inferno: il foglio scritto in sorgenti è quello che il codice rifà adesso, pezzo per pezzo
inf = I.costruisci()
inf_foglio = Image.open(D.SORGENTI / 'sotterraneo/generati' / (I.FOGLIO + '.png')).convert('RGBA')
inf_json = json.loads((D.SORGENTI / 'sotterraneo/generati' / (I.FOGLIO + '.json')).read_text())
inferno_uguale = sorted(inf) == sorted(inf_json['sprite']) and all(
    inf_foglio.crop((s['da'][0], s['da'][1], s['da'][0] + s['cella'][0], s['da'][1] + s['cella'][1])).tobytes() == inf[n].convert('RGBA').tobytes()
    for n, s in inf_json['sprite'].items())
print(json.dumps({'inferno_uguale': inferno_uguale, 'fianco': list(inf['inferno-fianco-semplice'].size)}))
`

const r = python(PROVA)
if (!r) {
  nota('python3 o Pillow non ci sono: salto le prove sui pezzi derivati')
} else {
  controlla('inferno.py rifà il foglio scritto in sorgenti, pezzo per pezzo', r.inferno_uguale)
  uguale('...e i fianchi sono tavole strette di 6×20', J(r.fianco), J([6, 20]))
}

riassunto('i pezzi derivati in codice')
