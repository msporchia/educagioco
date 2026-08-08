/* ═══════════════════════════════════════════════════════════════════
   GLI AMBIENTI — l'indice

   Undici stanze, undici file, una riga a testa qui. Un ambiente è una
   **voce di dati**: una tavolozza più quattro nomi (che posa ha il
   pavimento, di che è fatto il muro, quali dettagli si spargono, e in
   quanti modi diversi si può stare per terra). Chi la dipinge sta in
   `mappa.js`, di che cosa è fatta in `materiali/`.

   ── `varianti`, cioè perché due angoli non si somigliano ──
   È un **sacchetto pesato** di posature (`materiali/varianti.js`):
   `liscio`, `usura`, `ombra`, `detriti`, `screpolato`, `licheni`,
   `polvere`, `umidiccio`. Ogni otto celle la stanza ne pesca una e la
   stende in una macchia larga, sfumata contro le vicine. Un nome
   ripetuto pesa il doppio, e `liscio` ci sta sempre due o tre volte:
   se ogni macchia fa qualcosa il pavimento torna uniforme — carico
   invece che vuoto, ma uniforme.

   ── la nota sui colori, che è la cosa che si sbaglia per prima ──
   · `fondo` non è «il colore del pavimento», è **quello che si vede
     nei giunti**. Deve essere più scuro delle lastre, se no i giunti
     spariscono e il pavimento torna una tinta piatta.
   · `muro` deve stare lontano da `lastra`: in una stanza chiara il
     muro è più scuro, in una scura è più caldo. Se muro e pavimento
     hanno la stessa tinta, la stanza non ha più architettura.
   · e la regola sopra tutte: **il fondo deve stare indietro**. Le
     tinte di una stanza stanno in un fazzoletto stretto, e il
     contrasto forte è riservato ai personaggi. Un pavimento che si fa
     guardare è un pavimento in cui i personaggi annegano.
   ═══════════════════════════════════════════════════════════════════ */
import { CORTILE } from './cortile.js'
import { CAMMINAMENTO } from './camminamento.js'
import { CORRIDOIO } from './corridoio.js'
import { CRIPTA } from './cripta.js'
import { INGRANAGGI } from './ingranaggi.js'
import { TESORO } from './tesoro.js'
import { GROTTA } from './grotta.js'
import { BOSCO } from './bosco.js'
import { MINIERA } from './miniera.js'
import { TRONO } from './trono.js'
import { FOGNE } from './fogne.js'

export const AMBIENTI = {
  cortile: CORTILE, camminamento: CAMMINAMENTO, corridoio: CORRIDOIO,
  cripta: CRIPTA, ingranaggi: INGRANAGGI, tesoro: TESORO,
  grotta: GROTTA, bosco: BOSCO, miniera: MINIERA, trono: TRONO, fogne: FOGNE,
}

export const NOMI_AMBIENTI = Object.keys(AMBIENTI)
