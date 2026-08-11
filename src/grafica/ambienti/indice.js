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

/* ── I NOMI VECCHI SI DERIVANO, NON SI RIPETONO ──
   `muratura`, `posa`, `muro` e `lastra` li chiede ancora chi non passa
   dalle liste: l'anteprima di una cella sola (`PITTORI_TERRENO`), la
   vetrina, i dettagli che pescano `A.lastra` per intonarsi al
   pavimento. Un ambiente che dichiara `mura` e `suolo` **non li scrive
   più**: sono la prima voce delle sue liste, e derivarli qui è l'unico
   modo perché non possano discordare da quello che si vede davvero. */
const completa = A => {
  const capo = (lista, tinte) => (Array.isArray(lista) && lista[0]) || null
  const m = capo(A.mura), s = capo(A.suolo)
  return {
    ...A,
    muratura: A.muratura || (m && m.che) || 'pietra',
    posa: A.posa || (s && s.che) || 'lastre',
    muro: A.muro || (m && m.tinte) || ['#7a7168', '#4a443e'],
    lastra: A.lastra || (s && s.tinte) || ['#5c5c6b', '#43434f'],
  }
}

export const AMBIENTI = Object.fromEntries(Object.entries({
  cortile: CORTILE, camminamento: CAMMINAMENTO, corridoio: CORRIDOIO,
  cripta: CRIPTA, ingranaggi: INGRANAGGI, tesoro: TESORO,
  grotta: GROTTA, bosco: BOSCO, miniera: MINIERA, trono: TRONO, fogne: FOGNE,
}).map(([k, A]) => [k, completa(A)]))

export const NOMI_AMBIENTI = Object.keys(AMBIENTI)
