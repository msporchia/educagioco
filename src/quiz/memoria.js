/* ═══════════════════════════════════════════════════════════════════
   LA MEMORIA DELLE DOMANDE — il ponte fra i quiz e il profilo.

   Due funzioni, e stanno insieme perché sono i due versi della stessa
   cosa: `annota` scrive com'è andata una domanda, `bisognoDi` rilegge
   quello scritto per dire quanto quella tipologia va rivista.

   È l'unico file di `src/quiz/` che conosce il profilo. Il nucleo non
   lo importa e non lo deve importare — `classi.js`, `modulo.js` e
   `nucleo/bisogno.js` girano in Node e si provano contando i tiri —
   quindi il bisogno viaggia come **funzione passata a mano**:
   `scelta.js` la prende da qui e la consegna al nucleo.

   LE CHIAVI SONO QUELLE DELLE TIPOLOGIE (`orto:gn`, `gri:perimetro`) e
   finiscono nello stesso cassetto delle tabelline e delle parole
   inglesi, `profile.items`. Nessuno le conta: tutto quello che legge
   quel cassetto lo fa per prefisso (`en:`, `math:`, `pozioni:`…), e i
   prefissi dei quiz sono altri. Il giorno che se ne volesse fare una
   materia con la sua padronanza — «Italiano» nell'albo — il posto è
   `store/progressi.js`, ma serve un `totale` e un totale qui non c'è:
   le tipologie non sono un elenco chiuso di cose da imparare.

   IL RIPASSO NON SI SPEGNE, e non è un interruttore dimenticato: non
   toglie né aggiunge domande, sposta solo di poco la frequenza dentro
   quelle che il bambino già vedeva. Quello che si spegne davvero —
   cosa non è stato fatto a scuola — sta nei saperi, ed è un'altra
   cosa.
   ═══════════════════════════════════════════════════════════════════ */

import { state, answer } from '../store/profile.js'
import { bisognoDa } from './nucleo/bisogno.js'

/* Si legge `state.profile.items` a mano invece di chiamare `item()`:
   quello **crea** l'elemento se non c'è, e qui si guarda una tipologia
   per ogni pesca — centotrenta elementi vuoti scritti nel profilo di
   un bambino che non ha ancora risposto a niente. Chi non c'è vale
   `undefined`, e `bisognoDa` lo tratta come «mai visto». */
export function bisognoDi(chiave, now = Date.now()) {
  if (!chiave) return 1
  return bisognoDa(state.profile?.items?.[chiave], now)
}

/* la funzione da passare al nucleo: un `now` solo per tutta la pesca,
   così due tipologie non si confrontano su due istanti diversi */
export function ilBisogno(now = Date.now()) {
  return chiave => bisognoDi(chiave, now)
}

/* ── e il verso contrario ──
   `chiave` è quella della domanda, che è quella della tipologia che
   l'ha generata (lo controlla `unita/saperi`). Una domanda senza
   chiave non si annota: succede solo per i moduli che le tipologie non
   le dichiarano, e allora non ci sarebbe niente da riconoscere.

   `tempo` arriva in secondi da `Domanda.vue` e va in millisecondi
   perché è così che lo vuole `srs.js` — ma non pesa: `useTime` è per
   le tabelline, dove rispondere lento *è* non saperle. Una domanda di
   logica letta con calma non è un errore. */
export function annota({ chiave, giusto, tempo = 0 }) {
  if (!chiave) return
  answer(chiave, { correct: !!giusto, ms: Math.max(0, tempo) * 1000 })
}
