/* ═══════════════════════════════════════════════════════════════════
   IL TERRENO — la porta d'ingresso

   Questo file non disegna niente: è **la facciata** di quello che una
   volta era un solo modulo da mille righe. Adesso sta diviso così, e
   chi mette in scena importa da qui senza sapere dove:

     ambienti/    undici stanze, un file per stanza: la tavolozza e i
                  tre nomi (posa, muratura, dettagli)
     materiali/   di che cosa sono fatte: pose, murature, dettagli
     mappa.js     la macchina che le dipinge e il fondale in cache
     luce.js      il buio, le pozze delle torce, il sole fra le foglie

   Aggiungere una stanza è **un file in `ambienti/` più una riga nel
   suo `indice.js`**. Qui dentro non si tocca niente.
   ═══════════════════════════════════════════════════════════════════ */
export { AMBIENTI, NOMI_AMBIENTI } from './ambienti/indice.js'
export { leggiMappa, dipingiMappa, creaFondale, PITTORI_TERRENO } from './mappa.js'
export { dipingiMuri } from './muri.js'
export { POSATURE, MODULO } from './materiali/indice.js'
export { tessuto, chiazze, semeDi } from './tessuto.js'
export { dado } from './comune.js'
