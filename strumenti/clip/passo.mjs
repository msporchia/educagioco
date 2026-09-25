/* Passo passo: «Il ghiaccio rotto» — il gradino del ghiaccio, quello dove
   il coniglio smette di ubbidire cella per cella e comincia a scivolare
   finché qualcosa non lo ferma. È la regola più facile da vedere in
   pochi secondi: una sola freccia lo manda a sbattere contro il sasso in
   mezzo al lago.

   La tappa si sceglie per **chiave** (`rotto`) e non per indice: la fila
   di `dati/campagna.js` si riordina quando arrivano tappe nuove (è
   successo il 25 settembre 2026 con le pecore), e un indice cablato
   finirebbe per aprire un livello diverso senza che nessuno se ne
   accorga. La soluzione non si scrive a mano: la calcola qui in Node il
   risolutore vero (`motore/risolutore.js`), lo stesso che il gioco usa
   per il 💡 — se la mappa cambia, la fila della clip cambia con lei, o
   smette di vincere e la clip lo segnala invece di restare
   silenziosamente sbagliata. Sono cinque frecce (dentro il 5-8 chiesto
   per la clip): dritto, poi contro il sasso, indietro a prendere la
   carota, e a casa scivolando di nuovo.

   Si entra dritti nella tappa (hash `#passo`, la stessa chiave del
   manifesto in `gioco.js`) e non dalla home: la mappa dei giochi non è
   quello che questa clip deve far vedere. I bersagli sono quelli del
   gioco giocato col dito — mai coordinate — come in
   `test/integrazione/passo-passo.test.mjs`: `[data-freccia]`/
   `[data-salto]` per le mosse, `[data-azione="via"]` per partire,
   `[data-fine="tappa"]` per l'arrivo. Se uno di questi sparisce (un
   rifacimento della fila, del campo, o del cartello di fine) la clip
   esce lo stesso — vedi `strumenti/scatti.mjs` — e chi la rompe sa da
   dove ripartire.

   `profilo` porta `campagne.passo.tappa` già a questo indice, e non è
   solo per sbloccare la tappa (il profilo finto di `scatti.mjs` ha già
   `tuttoAperto`): senza, il profilo nasce senza nessuna tappa fatta, e
   la prima `segna()` di questa sessione (quella di ▶, prima ancora di
   vincere) registra in silenzio i traguardi già meritati **da un
   profilo a tappa zero** — poi la vittoria li fa scattare tutti insieme
   a schermo, con un cartello «traguardo» che si mangia il resto della
   clip. Partire già a questo indice fa credere i gradi già presi da
   subito, come in una partita vera arrivata fin qui giocando. */
import { CAMPAGNA } from '../../src/giochi/passo-passo/dati/campagna.js'
import { Livello } from '../../src/giochi/passo-passo/motore/livello.js'
import { risolvi } from '../../src/giochi/passo-passo/motore/risolutore.js'

const CHIAVE_TAPPA = 'rotto'
const INDICE = CAMPAGNA.findIndex(t => t.chiave === CHIAVE_TAPPA)
const SOLUZIONE = INDICE >= 0 ? risolvi(Livello.da(CAMPAGNA[INDICE])) : null

/* il tasto di una mossa: le frecce hanno `data-freccia`, i salti
   `data-salto` — questa tappa non salta, ma se un giorno la sua
   soluzione lo chiedesse la clip non si romperebbe in silenzio */
const tastoDi = m => (m.startsWith('salto-') ? `[data-salto="${m.slice(6)}"]` : `[data-freccia="${m}"]`)

export default {
  file: 'clip-passo', dove: 'passo', attesa: '.pp-mappa',
  profilo: p => { p.campagne = { ...p.campagne, passo: { tappa: Math.max(INDICE, 0), stelle: {}, cfg: {} } }; return p },
  passi: [[`.pp-tappa[data-tappa="${INDICE}"]`, 900]],
  clip: {
    secondi: 8,
    async durante (page) {
      if (!SOLUZIONE || !SOLUZIONE.length) return   // la tappa non c'è più, o non si vince: niente da giocare
      for (const mossa of SOLUZIONE) {
        await page.locator(tastoDi(mossa)).click({ timeout: 2000 }).catch(() => {})
        await page.waitForTimeout(350)               // ritmo umano: una freccia alla volta
      }
      await page.locator('[data-azione="via"]').click({ timeout: 2000 }).catch(() => {})
      await page.waitForSelector('[data-fine="tappa"]', { timeout: 8000 }).catch(() => {})
      await page.waitForTimeout(800)                 // le stelle entrano una dopo l'altra
    },
  },
}
