/* Il regno del castello, senza browser: il modulo è quello del foglietto (se
   no si rilancia lo strumento), c'è un posto per ogni tappa e uno per ogni
   partita libera, ogni posto sta sulla mappa e due segnalini non si coprono.
   Vedi docs/castello/regno.md.
   `node test/esegui.mjs castello-regno --niente-build` */
import { readFileSync } from 'node:fs'
import { TAPPE, LIBERE } from '../../src/data/castello.js'
import { LARGO, ALTO, POSTI, LIBERE_POSTI, MAPPA } from '../../src/giochi/castello/dati/regno.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const fg = JSON.parse(readFileSync(new URL('../../strumenti/sprite/sorgenti/castello/regno.json', import.meta.url), 'utf8'))

uguale('i posti sono quelli del foglietto (se no: python3 strumenti/sprite/regno-castello.py)',
       JSON.stringify(POSTI), JSON.stringify(fg.posti))
uguale('e le libere anche', JSON.stringify(LIBERE_POSTI), JSON.stringify(fg.libere))
uguale('un posto per tappa', POSTI.length, TAPPE.length)
uguale('un torrione per partita libera', Object.keys(LIBERE_POSTI).sort().join(), LIBERE.map(l => l.chiave).sort().join())
controlla('la mappa c\'è', MAPPA.startsWith('data:image/webp;base64,') && MAPPA.length > 100000)

const tutti = [...POSTI, ...Object.values(LIBERE_POSTI)]
controlla('ogni posto sta sulla mappa', tutti.every(([x, y]) => x > 20 && x < LARGO - 20 && y > 20 && y < ALTO - 20),
          tutti.filter(([x, y]) => !(x > 20 && x < LARGO - 20 && y > 20 && y < ALTO - 20)))
// alla misura più stretta (640 px di mappa) un segnalino è largo 36: i centri stanno ad almeno 40
const SCALA = 640 / LARGO
const vicini = []
for (let i = 0; i < tutti.length; i++) {
  for (let j = i + 1; j < tutti.length; j++) {
    if (Math.hypot(tutti[i][0] - tutti[j][0], tutti[i][1] - tutti[j][1]) * SCALA < 40) vicini.push([i, j])
  }
}
uguale('due segnalini non si coprono', JSON.stringify(vicini), '[]')

riassunto('il regno del castello')
