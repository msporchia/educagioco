/* ═══════════════════════════════════════════════════════════════════
   IL CAMPO DEL CASTELLO — l'indice dei pittori.

   Il gioco manda una lista tipo
       { che: 'torre', x, y, tipo: 'div', lv: 8, posso: true }
   e la torre esce disegnata. Qui c'è la tabella che dice chi dipinge
   cosa; il disegno vero sta nei file accanto, uno per famiglia:

     fondale.js   prato, strada, bosco, piazzole — quello che non cambia
     fortezza.js  il castello da difendere
     torri.js     fusto, corona, targhe          (le cime in `cime.js`)
     mostro.js    il mostro in scena: ombra, volo, vita, resistenza
     corpi-mostri.js  i corpi delle dieci bestie (isolati apposta)
     colpi.js     proiettili ed esplosioni
     indizi.js    le piazzole libere e il raggio, mentre si trascina
     tinte.js     il colore di ogni torre, chiaro e scuro

   Tutte le misure sono in **unità**, non in pixel: `p.S` è quanto vale
   un'unità sullo schermo di adesso. Così la stessa scena sta bene sul
   telefono e sul computer.

   Qui dentro non esistono energia, ondate, prezzi, operazioni in
   colonna: esistono cose da disegnare. Se domani le torri diventano
   astronavi si riscrive `torre()` e il gioco non se ne accorge.
   ═══════════════════════════════════════════════════════════════════ */
import { castello } from './fortezza.js'
import { torre } from './torri.js'
import { mostro, ritratto } from './mostro.js'
import { colpo, schizzo } from './colpi.js'
import { piazzolaViva, raggio, ingresso } from './indizi.js'

export { campo } from './fondale.js'
export { NOMI_BESTIE, disegnaBestia } from './mostro.js'
export { TINTA } from './tinte.js'

export const PITTORI = { castello, torre, mostro, ritratto,
                         colpo, schizzo, piazzola: piazzolaViva, raggio, ingresso }
