// riscrive src/quiz/dati/sillabe-parole-vere.js: le parole italiane che un falso del buco di sil:manca può formare (ca-__ con «ni» fa «cani»), da scartare perché sarebbero una seconda risposta giusta
//   npm run quiz:parole-sillabe              riscrive il file
//   npm run quiz:parole-sillabe -- --controlla   non scrive, esce con 1 se il file è vecchio
// vuole il dizionario di sistema (Debian/Ubuntu: pacchetto witalian, /usr/share/dict/italian); DICT=… per un altro
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

import { DIVISE, POOL_SILLABE } from '../../src/quiz/moduli/sillabe.js'

const QUI = dirname(fileURLToPath(import.meta.url))
const FUORI = resolve(QUI, '../../src/quiz/dati/sillabe-parole-vere.js')
const DIZIONARIO = process.env.DICT || '/usr/share/dict/italian'
const SOLO_CONTROLLO = process.argv.includes('--controlla')

if (!existsSync(DIZIONARIO)) {
  console.error(`manca il dizionario italiano (${DIZIONARIO}): non riscrivo niente.\n` +
    'Su Debian/Ubuntu: sudo apt install witalian; oppure DICT=/percorso/del/dizionario.')
  process.exit(1)
}
const dizionario = new Set(readFileSync(DIZIONARIO, 'utf8').split('\n').map(x => x.trim().toLowerCase()).filter(Boolean))
if (dizionario.size < 10000) { console.error(`${DIZIONARIO} ha ${dizionario.size} parole: troppo poche, non riscrivo niente`); process.exit(1) }

// stesse sostituzioni di manca(): ogni sillaba di ogni parola cambiata con ogni altra sillaba del mazzo
const proprie = new Set(DIVISE.map(w => w[0])) // queste le aggiunge il modulo da sé
const vere = new Set()
for (const [, sillabe] of DIVISE)
  for (let i = 0; i < sillabe.length; i++)
    for (const f of POOL_SILLABE) {
      if (f === sillabe[i]) continue
      const parola = sillabe.map((s, j) => (j === i ? f : s)).join('')
      if (dizionario.has(parola) && !proprie.has(parola)) vere.add(parola)
    }

const righe = []
let riga = ''
for (const p of [...vere].sort()) {
  const voce = `'${p}',`
  if (riga && riga.length + voce.length + 1 > 110) { righe.push(riga); riga = voce } else riga = riga ? `${riga} ${voce}` : voce
}
if (riga) righe.push(riga)

const contenuto = `/* GENERATO da \`npm run quiz:parole-sillabe\` — non modificare a mano.

   Le parole italiane (dal dizionario di sistema) che un falso del buco di \`sil:manca\` può formare:
   il modulo scarta quei falsi, perché sarebbero una seconda risposta giusta.
   Si rifà dopo aver toccato DIVISE in moduli/sillabe.js. */
export const PAROLE_VERE_SILLABE = [
${righe.map(r => '  ' + r).join('\n')}
]
`

if (SOLO_CONTROLLO) {
  const attuale = existsSync(FUORI) ? readFileSync(FUORI, 'utf8') : ''
  if (attuale !== contenuto) { console.error('sillabe-parole-vere.js è vecchio: npm run quiz:parole-sillabe'); process.exit(1) }
  console.log(`sillabe-parole-vere.js è aggiornato (${vere.size} parole)`)
} else {
  writeFileSync(FUORI, contenuto)
  console.log(`scritto ${FUORI} (${vere.size} parole)`)
}
