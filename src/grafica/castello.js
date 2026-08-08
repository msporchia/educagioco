/* ═══════════════════════════════════════════════════════════════════
   COME SI DIPINGE IL CAMPO DEL CASTELLO — la porta d'ingresso.

   Questo file non disegna niente: è **la facciata** di quello che era
   un solo modulo da ottocento righe. Adesso sta diviso per famiglia di
   pittore sotto `castello/`, come è già fatto per gli ambienti del
   Generale: un file per cosa, più un indice.

   Chi mette in scena importa da qui — `PITTORI` per la tela, `campo`
   per il fondale — senza sapere dove sta cosa. Dentro `castello/` la
   mappa è scritta in `indice.js`.
   ═══════════════════════════════════════════════════════════════════ */
export { PITTORI, campo, NOMI_BESTIE, disegnaBestia, TINTA } from './castello/indice.js'
