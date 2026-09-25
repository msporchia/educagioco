/* Le carte delle tappe del castello, disegnate con lo schema.

     node strumenti/sprite/carte-castello.mjs

   Le carte le fa il generatore vero del gioco (`cartaDi` in
   `src/giochi/castello/motore/carta.js`) — le venti tappe e le quattro
   partite libere — e le disegna `scacchiera.py --carte` con gli stessi
   colori piatti della pianta da allegare ai prompt. Esce
   `poc/scatti/castello-carte.png`, e in console quali carte non
   rispettano la scacchiera e perché.

   Serve a guardare **la forma** dei campi prima di avere i pezzi del
   foglio: dove passa la strada, dove cadono le piazzole, quanto spazio
   si prendono laghetti, fitto e decori. Si rilancia ogni volta che si
   tocca il generatore o una forma. */
import { writeFileSync, mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { TAPPE, LIBERE } from '../../src/data/castello.js'
import { cartaDi } from '../../src/giochi/castello/motore/carta.js'

const QUI = dirname(fileURLToPath(import.meta.url))
const RADICE = join(QUI, '..', '..')
const USCITA = join(RADICE, 'poc', 'scatti', 'castello-carte.png')

const carte = [...TAPPE, ...LIBERE].map(t => {
  const c = cartaDi(t)
  for (const g of c.guasti) console.log(`${t.nome}: ${g}`)
  return { nome: t.nome, campagna: t.campagna, righe: c.righe, guasti: c.guasti }
})
const file = join(mkdtempSync(join(tmpdir(), 'carte-')), 'carte.json')
writeFileSync(file, JSON.stringify(carte))
execFileSync('python3', [join(QUI, 'scacchiera.py'), '--carte', file, USCITA], { stdio: 'inherit' })
