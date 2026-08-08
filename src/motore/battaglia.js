/* ═══════════════════════════════════════════════════════════════════
   IL MOTORE DELLA BATTAGLIA — la porta d'ingresso.

   Questo file non contiene più regole: è **la facciata** di quello che
   era un modulo solo da trecentocinquanta righe. Le regole adesso sono
   classi, una per file, sotto `motore/castello/`:

     battaglia.js   l'orchestratore: decide l'ordine delle cose
     percorso.js    la strada e le piazzole
     ondate.js      chi arriva, quanti, quando — e il **preavviso**
     tabellone.js   i cinque numeri della partita e l'energia
     nemico.js      chi cammina e incassa
     torre.js       chi prende di mira e spara
     colpo.js       quello che viaggia, e ferisce quando arriva
     schizzo.js     quello che si allarga e sbiadisce

   Sotto `motore/` non entrano Vue, il DOM o un contesto 2D: è la
   ragione per cui `strumenti/simula-castello.mjs` può far girare *le
   regole vere* mille volte al secondo dentro Node, e il bilanciamento
   non è un'opinione ma una misura.

   `creaBattaglia` resta quello che era — una funzione che torna un
   oggetto con cui giocare — perché è quello che gli strumenti e il
   gioco sanno chiamare. Dentro adesso c'è `new Battaglia`.
   ═══════════════════════════════════════════════════════════════════ */
export { Battaglia, PREAVVISO } from './castello/battaglia.js'
export { Percorso } from './castello/percorso.js'
export { Ondate } from './castello/ondate.js'
export { Tabellone } from './castello/tabellone.js'
export { Nemico } from './castello/nemico.js'
export { Torre } from './castello/torre.js'
export { Colpo } from './castello/colpo.js'
export { Schizzo } from './castello/schizzo.js'

import { Battaglia } from './castello/battaglia.js'

export function creaBattaglia(opzioni) {
  return new Battaglia(opzioni)
}
