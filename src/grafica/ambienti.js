// Il terreno: la facciata di ambienti/ (stanze), materiali/ (di cosa sono
// fatte), mappa.js e luce.js. Aggiungere una stanza è un file in ambienti/
// più una riga nel suo indice.js.
export { AMBIENTI, NOMI_AMBIENTI } from './ambienti/indice.js'
export { leggiMappa, dipingiMappa, creaFondale, PITTORI_TERRENO } from './mappa.js'
export { dipingiMuri } from './muri.js'
export { POSATURE, MODULO } from './materiali/indice.js'
export { tessuto, chiazze, semeDi } from './tessuto.js'
export { dado } from './comune.js'
