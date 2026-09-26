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
import { BESTIARIO } from '../../src/giochi/castello/scena/bestiario.js'

const QUI = dirname(fileURLToPath(import.meta.url))
const RADICE = join(QUI, '..', '..')
const USCITA = join(RADICE, 'poc', 'scatti', 'castello-carte.png')
const VESTITI = ['bosco', 'neve', 'lava']

const carte = [...TAPPE, ...LIBERE].map(t => {
  const c = cartaDi(t)
  for (const g of c.guasti) console.log(`${t.nome}: ${g}`)
  return { nome: t.nome, campagna: t.campagna, righe: c.righe, vie: c.vie, guasti: c.guasti }
})
const file = join(mkdtempSync(join(tmpdir(), 'carte-')), 'carte.json')
writeFileSync(file, JSON.stringify(carte))
execFileSync('python3', [join(QUI, 'scacchiera.py'), '--carte', file, USCITA], { stdio: 'inherit' })

/* e le stesse carte vestite con ogni vestito, coi pezzi di `vesti.py`:
   dal foglio del terreno di quel vestito se c'è, se no coi ritagli della
   sua scena — il provvisorio finché il foglio non arriva */
for (const nome of VESTITI) {
  const vestite = join(RADICE, 'poc', 'scatti', `castello-carte-${nome}.png`)
  execFileSync('python3', [join(QUI, 'scacchiera.py'), '--carte', file, vestite,
                           '--vesti', nome], { stdio: 'inherit' })
}

/* e una battaglia finta sulle fogne, nei tre vestiti: le torri sulle
   piazzole e sulla strada i mostri del bestiario di quel vestito — per
   vedere l'effetto finale (`prova-battaglia.py`) */
const bestiario = join(dirname(file), 'bestiario.json')
writeFileSync(bestiario, JSON.stringify(BESTIARIO))
execFileSync('python3', [join(QUI, 'prova-battaglia.py'), file,
                         join(RADICE, 'poc', 'scatti', 'castello-battaglia.png'), bestiario], { stdio: 'inherit' })
