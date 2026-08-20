/* ═══════════════════════════════════════════════════════════════════
   I CUBETTI NELLA SCATOLA

   Le domande di geometria le prova già tutte il banco (`unita/quiz`):
   la forma, le risposte doppie, la varietà. Qui c'è l'unica cosa che
   il banco non può sapere, perché non è una regola dei quiz ma una
   promessa fra il generatore e il disegno: **la scatola disegnata deve
   contenere davvero la costruzione**.

   Da quando la scatola si vede — prima stava scritta nel testo come
   «2×2×2», che a un bambino di dieci anni non dice niente — un cubetto
   fuori posto non sarebbe più un dettaglio invisibile: sarebbe una
   domanda che mostra dei cubetti fuori dalla scatola e poi chiede
   quanti ne mancano per riempirla. E siccome la scala del disegno si
   ricava dalla scatola, un cubetto oltre il bordo uscirebbe anche dal
   riquadro.

   Tre promesse, quindi, su cinquecento tiri:
     1. la scena dichiara la scatola, e ogni cubetto ci sta dentro
     2. ne manca sempre almeno uno (se no la risposta sarebbe zero, e
        la domanda una presa in giro)
     3. la risposta giusta è esattamente i posti liberi
   ═══════════════════════════════════════════════════════════════════ */
import geometria from '../../src/quiz/moduli/geometria.js'
import { Sorte } from '../../src/quiz/nucleo/sorte.js'
import { controlla, dentro, nota, riassunto } from '../aiuto/verifica.mjs'

const GIRI = 500

const fuori = []          // i cubetti oltre il bordo della scatola
const senzaScatola = []   // le scene che la scatola non la dichiarano
const piene = []          // quelle dove non manca niente
const conti = []          // dove la risposta non è il numero dei posti liberi
const lati = new Set()

for (let i = 0; i < GIRI; i++) {
  const d = geometria.mancanoCubetti(new Sorte(i * 7919 + 3))
  const s = d.soggetto?.scena
  const L = s?.scatola
  if (!L) { senzaScatola.push(i); continue }
  lati.add(L)
  const cubi = s.cubi || []
  if (cubi.some(([x, y, z]) => [x, y, z].some(q => q < 0 || q >= L))) fuori.push(i)
  const liberi = L * L * L - cubi.length
  if (liberi <= 0) piene.push(i)
  if (Number(d.risposte[d.giusta].testo) !== liberi) conti.push(i)
}

controlla('la scena dichiara la scatola', senzaScatola.length === 0,
          `${senzaScatola.length} scene senza`)
controlla('i cubetti stanno tutti dentro la scatola', fuori.length === 0,
          `${fuori.length} costruzioni sporgono (semi ${fuori.slice(0, 3).join(', ')})`)
controlla('ne manca sempre almeno uno', piene.length === 0,
          `${piene.length} scatole già piene`)
controlla('la risposta giusta è il numero dei posti liberi', conti.length === 0,
          `${conti.length} conti sbagliati (semi ${conti.slice(0, 3).join(', ')})`)

/* Due lati soli e non uno: una scatola 2×2×2 la si conta a memoria dopo
   qualche domanda, e senza il 3×3×3 il grado più alto della geometria
   si esaurirebbe in una sera. */
dentro('le scatole non sono tutte uguali', lati.size, 2, 3)
nota('lati visti:', [...lati].sort().join(', '))

/* La domanda che NON parla di scatole non deve disegnarne una: sono due
   consegne diverse, e un contenitore intorno a «quanti cubetti ci
   vogliono» sposterebbe il conto senza che il testo lo dica. */
const conScatola = []
for (let i = 0; i < GIRI; i++) {
  const d = geometria.contaCubetti(new Sorte(i * 104729 + 11))
  if (d.soggetto?.scena?.scatola) conScatola.push(i)
}
controlla('«quanti ce ne vogliono» non disegna nessuna scatola', conScatola.length === 0,
          `${conScatola.length} su ${GIRI}`)

riassunto('i cubetti nella scatola')
