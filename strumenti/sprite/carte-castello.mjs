/* Le carte delle tappe del castello, disegnate con lo schema.

     node strumenti/sprite/carte-castello.mjs

   Le carte le fa il generatore vero del gioco (`cartaDi` in
   `src/giochi/castello/motore/carta.js`) — le venti tappe e le quattro
   partite libere — e le disegna `scacchiera.py --carte` con gli stessi
   colori piatti della pianta da allegare ai prompt. Esce
   `poc/scatti/castello-carte.png`, e in console quali carte non
   rispettano la scacchiera e perché.

   Poi le rifà vestite con ognuna delle tre scene generate
   (`castello-carte-bosco.png`, `-neve`, `-lava`): vedi `vesti.py`.

   E una battaglia finta (`castello-battaglia.png`, più il catalogo
   delle figure in `castello-battaglia-figure.png`): vedi
   `prova-battaglia.py`.

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
const GENERATI = join(QUI, 'sorgenti', 'castello', 'generati')
const SCENE = [['td_1.png', 'bosco'], ['td_2.png', 'neve'], ['td_3.png', 'lava']]

const carte = [...TAPPE, ...LIBERE].map(t => {
  const c = cartaDi(t)
  for (const g of c.guasti) console.log(`${t.nome}: ${g}`)
  return { nome: t.nome, campagna: t.campagna, righe: c.righe, vie: c.vie, guasti: c.guasti }
})
const file = join(mkdtempSync(join(tmpdir(), 'carte-')), 'carte.json')
writeFileSync(file, JSON.stringify(carte))
execFileSync('python3', [join(QUI, 'scacchiera.py'), '--carte', file, USCITA], { stdio: 'inherit' })

/* e le stesse carte vestite con ogni scena generata, coi ritagli di
   `vesti.py`: una tabella sola per tutte, perché le scene sono la stessa
   rivestita. Il provvisorio finché non c'è il foglio dei pezzi. */
for (const [scena, nome] of SCENE) {
  const vestite = join(RADICE, 'poc', 'scatti', `castello-carte-${nome}.png`)
  execFileSync('python3', [join(QUI, 'scacchiera.py'), '--carte', file, vestite,
                           '--vesti', join(GENERATI, scena)], { stdio: 'inherit' })
}

/* e una battaglia finta sulle fogne, nei tre vestiti: le torri di
   agosto sulle piazzole e i mostri che ci sono già sulla strada — per
   vedere l'effetto finale e cosa manca (`prova-battaglia.py`) */
execFileSync('python3', [join(QUI, 'prova-battaglia.py'), file,
                         join(RADICE, 'poc', 'scatti', 'castello-battaglia.png')], { stdio: 'inherit' })
