/* Il Generale: «Mettetevi d'accordo» — due personaggi e un segnale, non
   una fila sola che si esegue da cima a fondo. Il cavaliere mena l'orco,
   suona «via libera», e SOLO A QUEL SEGNALE l'eroe — che da dov'è non
   vede niente — va a prendere il tesoro (`fai.quando`). È il livello che
   insegna che quello che uno non vede glielo deve dire un altro, ed è un
   passo più fondo del primo tutorial («La chiave e il portone», tre
   ordini in fila, usato prima): qui girano DUE unità insieme, e la
   riga che si accende lo fa in due fasce diverse (`.riga.attivo`,
   `views/generale/FilaOrdini.vue`).

   La tappa si sceglie per **chiave stabile** (`id: 'attesa'`), non per
   posizione in `LIVELLI`: la fila del Generale si riordina (è già
   successo con le storie a puntate).

   Il piano NON si scrive a mano: è la prima soluzione dichiarata NON
   fragile del livello (`liv.soluzioni`, lo stesso campo che gioca
   `test/aiuto/livello.mjs`) — se il livello cambiasse mappa o verbi, la
   clip cambia con lui, o smette di vincere e lo dice invece di restare
   silenziosamente sbagliata.

   Si entra dritti sull'elenco delle prove (hash `#generale`) e si apre
   il livello **dal gancio** `window.__gen.apri(indice)`, non toccando
   la riga nell'elenco: `views/generale/ElencoProve.vue` non porta
   nessun `data-tappa`/`data-id` sul bottone — solo `$emit('apri', r.i)`
   — quindi cliccare lì vorrebbe dire affidarsi a «il primo non
   chiuso», che apre un livello diverso ogni volta che la fila cambia.
   `apri()` è la stessa funzione che il tasto chiamerebbe
   (`views/generale/navigazione.js`), quindi non è un trucco: è la via
   diretta a un risultato che il dito otterrebbe comunque. Aperto il
   livello, si chiude il cartello dell'obiettivo toccando la ✕ vera
   (`.foglio .capo button`, come fa la ricetta `generale-gioco` di
   `scatti.mjs`), si scrive il piano nel gancio (`window.__gen.piano`,
   un `ref` di Vue: assegnarne `.value` da fuori è la stessa cosa che fa
   `castello.mjs` con `T.op.value`) e si preme ▶ Via
   (`window.__gen.via()`).

   NIENTE VARIANTI SECONDA E TERZA IN CHIARO — E NIENTE CARTELLO CHE
   COPRE FRA UNA SCENA E L'ALTRA. Questo livello ha tre scene (l'orco
   sta in un posto diverso a ogni battaglia): vinta la prima, il gioco
   manderebbe A SCHERMO anche le altre due, precedute ognuna da un
   cartello «scena 2 di 3» che COPRE tutto il campo per un secondo e
   mezzo (`CartelloScena.vue`, `.cambio-scena { position:absolute;
   inset:0 }`) — tre volte più lungo del budget di questa clip, e con
   due schermate nere in mezzo che non fanno vedere niente. Si guarda
   giocare SOLO la prima scena (le due unità, il segnale, la vittoria),
   e appena vinta si chiama `window.__gen.saltaMontaggio()`: le altre
   due si giocano da sole SENZA schermo (lo stesso motore, `esegui()` in
   `motore/generale.js`, «niente Math.random da nessuna parte» — quindi
   vincono di sicuro, essendo la stessa soluzione dichiarata) e si va
   dritti al velo di vittoria. È la stessa funzione che il tasto
   «salta →» del montaggio chiama per chi ha già capito.

   Dipende da: `window.__gen` (in particolare `apri`, `piano`, `via`,
   `esiti`, `saltaMontaggio`), il selettore `.tappa` (per sapere che
   l'elenco è pronto), `.foglio .capo button` (la ✕ del cartello) e
   `.generale .velo` (il velo di vittoria dentro la vista del Generale —
   con lo scoping su `.generale` perché **lo stesso nome di classe** lo
   usa anche `components/Traguardo.vue`, il cartello «Traguardo!» montato
   in App.vue, e senza scoping il primo dei due a comparire fa risolvere
   l'attesa sul cartello sbagliato). Se uno di questi cambia forma, è
   qui che va aggiornata la ricetta.

   NIENTE CARTELLO DI TRAGUARDO IN MEZZO ALLA CLIP. La primissima
   vittoria «da solo» del Generale fa scattare il traguardo «Ci sono
   arrivato da solo» (`data/traguardi.js`, id `gen-par`): un velo suo,
   sopra tutto (`z-index:80` contro il 20 del velo di vittoria), che
   resta a schermo finché non lo si tocca. Per questo `profilo` porta i
   contatori del Generale (`daSolo`, `missioni`, `avanzati`) oltre
   l'ultima soglia dichiarata: il traguardo risulta già preso prima
   ancora di cominciare, esattamente come da profilo vero di chi ha già
   giocato molto, e la vittoria di questa clip resta quello che si
   vede. */
import { LIVELLI } from '../../src/data/generale.js'

const CHIAVE_ID = 'attesa'
const INDICE = LIVELLI.findIndex(l => l.id === CHIAVE_ID)
const LIV = INDICE >= 0 ? LIVELLI[INDICE] : null
const SOLUZIONE = LIV ? (LIV.soluzioni.find(s => !s.fragile) || LIV.soluzioni[0]).piano : null

export default {
  file: 'clip-generale', dove: 'generale', attesa: '.tappa',
  /* oltre le soglie più alte di gen-par [1,6,20], gen-livelli [1,5,12]
     e gen-avanzati [1,10,40] in `data/traguardi.js` */
  profilo: p => { p.totals = { ...p.totals, daSolo: 25, missioni: 15, avanzati: 45 }; return p },
  passi: [
    async page => { if (INDICE >= 0) await page.evaluate(i => window.__gen.apri(i), INDICE) },
    ['.foglio .capo button', 500],   // chiude il cartello dell'obiettivo: sotto c'è la mappa
    /* il piano si scrive PRIMA di registrare: la clip comincia con la
       fila già firmata e ferma — «ecco il programma» — e non con uno
       scatto istantaneo da vuota a piena a metà ripresa */
    async page => {
      if (!SOLUZIONE) return
      await page.evaluate(piano => {
        const G = window.__gen
        G.piano.value = { ...G.piano.value, ...piano }
      }, SOLUZIONE)
    },
  ],
  clip: {
    secondi: 10,
    async durante (page) {
      if (!SOLUZIONE) return   // il livello non c'è più: niente da giocare
      await page.waitForTimeout(500)               // il piano scritto si legge un istante, fermo
      await page.evaluate(() => window.__gen.via())
      /* si guarda la prima scena vera — il cavaliere che attacca, il
         segnale, l'eroe che parte — e appena è vinta si salta dritto
         alle altre due (vedi sopra): niente cartello che copre */
      await page.waitForFunction(() => window.__gen.esiti.value[0] === true, { timeout: 8000 }).catch(() => {})
      await page.evaluate(() => window.__gen.saltaMontaggio())
      await page.waitForSelector('.generale .velo', { timeout: 4000 }).catch(() => {})
      await page.waitForTimeout(1500)               // le stelle e il cartello di vittoria si leggono
    },
  },
}
