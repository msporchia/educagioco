/* ═══════════════════════════════════════════════════════════════════
   IL CALENDARIO — che la domanda dica quello che conta

   La forma delle domande la prova il banco (`unita/quiz`): che ci sia
   una risposta sola, che i falsi siano diversi, che ne esistano tante.
   Qui c'è quello che il banco non può vedere, perché non è un difetto
   di forma ma **una frase che si può leggere in due modi**.

   Il caso vero, ed è quello da cui nasce questo file: «Quanti mesi
   mancano da marzo a gennaio?». Da marzo a gennaio non si va avanti,
   si va indietro — a meno di sottintendere il giro dell'anno, che
   nella domanda non era scritto da nessuna parte. Il conto atteso era
   10, e chi rispondeva 2 aveva contato una cosa sensata: una domanda
   con due risposte difendibili, formalmente ineccepibile, e invisibile
   a qualunque controllo automatico che guardi solo la forma.

   Adesso il presente è dichiarato — «Siamo a marzo. Quanti mesi
   mancano a gennaio?» — e da un presente si manca solo in avanti.
   Quello che si prova qui è che **il numero giusto sia quello che il
   testo chiede**: si rileggono i due mesi dalla frase, si conta in
   avanti, e si confronta. Se un giorno qualcuno rigirasse la frase
   senza rigirare il conto, questo diventa rosso.
   ═══════════════════════════════════════════════════════════════════ */
import calendario from '../../src/quiz/moduli/calendario.js'
import { Sorte } from '../../src/quiz/nucleo/sorte.js'
import { controlla, uguale, nota, riassunto } from '../aiuto/verifica.mjs'

const GIRI = 400
const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio',
              'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre']

const FRASE = /^Siamo ad? ([a-z]+)\. Quanti mesi mancano ad? ([a-z]+)\?$/

const senzaPresente = []   // il testo non dice da quando si conta
const contiStorti = []     // la risposta non è il conto in avanti
const inciampi = []        // «a aprile», «a agosto»
const distanze = new Set()

for (let i = 0; i < GIRI; i++) {
  const d = calendario.durataMesi(new Sorte(i * 7919 + 11))
  const m = FRASE.exec(d.testo)
  if (!m) { senzaPresente.push(d.testo); continue }
  if (/\ba (aprile|agosto)\b/.test(d.testo)) inciampi.push(d.testo)
  const da = MESI.indexOf(m[1]), a = MESI.indexOf(m[2])
  const avanti = ((a - da) + 12) % 12
  distanze.add(avanti)
  const detta = Number(d.risposte[d.giusta].testo)
  if (detta !== avanti) contiStorti.push(`${d.testo} → ${detta}, in avanti sono ${avanti}`)
}

uguale('ogni domanda dice da quando si conta, se no il verso è a scelta di chi legge',
       senzaPresente.length, 0, senzaPresente[0])
uguale('e la risposta giusta è il conto in avanti, quello che la frase chiede',
       contiStorti.length, 0, contiStorti[0])
uguale('«ad aprile», «ad agosto»: la d eufonica c\'è dove serve',
       inciampi.length, 0, inciampi[0])
controlla('mai zero mesi: due mesi uguali non sono una domanda',
          !distanze.has(0), [...distanze].sort((a, b) => a - b).join(' '))
controlla('e si attraversa anche il capodanno, che è il caso interessante',
          [...distanze].some(n => n > 6), `distanze viste: ${[...distanze].length}`)

/* ── e la sorella, che aveva già la stessa cura ──
   «Quanti giorni passano dal 3 al 17» e non «quanti giorni ci sono»:
   la seconda si conta includendo il giorno di partenza, e allora le
   risposte difendibili tornano a essere due. */
const giorniStorti = []
for (let i = 0; i < GIRI; i++) {
  const d = calendario.durataGiorni(new Sorte(i * 104729 + 7))
  const m = /^Quanti giorni passano dal (\d+) al (\d+) [a-z]+\?$/.exec(d.testo)
  if (!m) { giorniStorti.push(d.testo); continue }
  const atteso = Number(m[2]) - Number(m[1])
  if (Number(d.risposte[d.giusta].testo) !== atteso)
    giorniStorti.push(`${d.testo} → ${d.risposte[d.giusta].testo}, la differenza è ${atteso}`)
}
uguale('i giorni «passano», e sono la differenza fra le due date',
       giorniStorti.length, 0, giorniStorti[0])

nota(`${GIRI} tiri per tipo · distanze in mesi: ${[...distanze].sort((a, b) => a - b).join(' ')}`)
riassunto('il calendario')
