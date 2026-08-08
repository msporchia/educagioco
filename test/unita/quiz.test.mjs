/* ═══════════════════════════════════════════════════════════════════
   TUTTI I MODULI DI QUIZ, SULLO STESSO BANCO
   tempo: 120

   Un test solo, non uno per modulo — come per i livelli del Generale.
   I moduli si raccolgono dalla cartella, quindi uno nuovo entra nel
   banco il giorno in cui il suo file compare: non c'è nessun elenco da
   ricordarsi di aggiornare, ed è l'unico modo per non avere un modulo
   scritto bene che non prova nessuno.

   Cosa si prova sta in `strumenti/quiz/banco.mjs`, che è lo stesso
   codice che si lancia a mano con `npm run quiz:banco`: la forma delle
   domande, le risposte doppie, le scene senza pittore, il caso
   ripetibile e — quello che nessuno vedrebbe giocando una volta — la
   VARIETÀ, cioè se un modulo si impara a memoria in tre partite.
   ═══════════════════════════════════════════════════════════════════ */
import { readdirSync, existsSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, resolve } from 'node:path'
import { nota, controlla, riassunto } from '../aiuto/verifica.mjs'
import { provaModulo } from '../../strumenti/quiz/banco.mjs'
import { Sorte } from '../../src/quiz/nucleo/sorte.js'

const RADICE = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
const CARTELLA = resolve(RADICE, 'src/quiz/moduli')

const moduli = []
if (existsSync(CARTELLA))
  for (const f of readdirSync(CARTELLA).sort().filter(x => x.endsWith('.js'))) {
    const mod = (await import(pathToFileURL(resolve(CARTELLA, f)).href)).default
    if (mod) moduli.push(mod)
    else controlla(`${f}: esporta un modulo`, false, 'manca l\'export default')
  }

controlla('i moduli di quiz si raccolgono da soli', moduli.length > 0)
const ids = moduli.map(m => m.id)
controlla('gli id dei moduli sono unici', new Set(ids).size === ids.length,
          ids.filter((x, i) => ids.indexOf(x) !== i).join(', '))

/* Nell'elenco un modulo si riconosce dall'icona prima che dal nome: due
   moduli con la stessa emoji sono due carte che si somigliano. */
const icone = moduli.map(m => m.icona)
controlla('le icone dei moduli sono diverse fra loro', new Set(icone).size === icone.length,
          icone.filter((x, i) => icone.indexOf(x) !== i).join(' '))

for (const m of moduli) {
  const r = provaModulo(m, { tiri: 300 })
  controlla(`${m.id}: le domande stanno in piedi`, r.guasti.length === 0, r.guasti.slice(0, 4).join(' | '))
  nota(`${m.icona} ${m.nome} — ${m.gradi} gradi, ` +
       `${r.righe.map(x => x.diverse).join('/')} domande diverse, chiavi: ${r.chiavi?.join(' ')}`)
}

/* Due moduli non devono litigare sulle chiavi: se `numero` e `misure`
   usassero tutti e due `num:stima`, il ripasso non saprebbe più di chi
   è la debolezza. */
const tutte = moduli.flatMap(m => provaModulo(m, { tiri: 120 }).chiavi.map(c => [c, m.id]))
const casa = new Map()
for (const [c, id] of tutte) {
  if (casa.has(c) && casa.get(c) !== id)
    controlla(`la chiave ${c} è di un modulo solo`, false, `usata da ${casa.get(c)} e ${id}`)
  casa.set(c, id)
}
controlla('le chiavi non si sovrappongono fra moduli', true)

/* ═══════════ quello che il banco non può sapere ═══════════
   Il banco controlla la FORMA: risposte doppie, scene senza pittore,
   varietà. Una domanda scritta in italiano storto passa tutti i suoi
   controlli e la vede solo un occhio — «Ieri Marta è diventata famoso»
   era lì da quando esiste il modulo. Quando una di queste salta fuori
   si scrive qui la regola che l'avrebbe presa, così non torna.

   Ogni voce è un modulo, e per ogni modulo delle frasi che **non
   devono mai comparire** nella consegna o nella risposta GIUSTA. I
   falsi restano fuori apposta: lì l'italiano storto è il punto —
   «Ieri Marta è detto la verità» è il falso che mostra l'ausiliare
   sbagliato, e vietarlo vorrebbe dire vietare la domanda. */
const MAI = {
  coniugazione: [
    ['col passato prossimo di essere il participio si accorda',
      /Marta è [a-zà-ù]+o\b/i],
    ['e l\'aggettivo che segue pure',
      /Marta[^.]*\b(famoso|zitto|contento)\b/i],
    ['al maschile invece resta maschile',
      /Luca[^.]*\b(famosa|zitta|contenta)\b/i],
  ],
}
for (const m of moduli) {
  const regole = MAI[m.id]
  if (!regole) continue
  const detto = []
  for (let g = 1; g <= m.gradi; g++) {
    const sorte = new Sorte(g * 97)
    for (let i = 0; i < 400; i++) {
      const d = m.chiedi(g, sorte)
      detto.push(d.testo || '')
      const buona = (d.risposte || [])[d.giusta]
      if (buona?.testo) detto.push(buona.testo)
    }
  }
  const tutto = detto.join('\n')
  for (const [dice, regola] of regole)
    controlla(`${m.id}: ${dice}`, !regola.test(tutto),
              (tutto.match(regola) || []).slice(0, 2).join(' | '))
}

nota(`moduli sul banco: ${moduli.length} — ${moduli.map(m => m.id).join(', ')}`)
riassunto('i moduli di quiz')
