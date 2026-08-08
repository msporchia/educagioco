/* ═══════════════════════════════════════════════════════════════════
   I MATERIALI — l'indice

   Un file per famiglia (pietra, roccia, legno, metallo, marmo, verde,
   acqua) e qui le tre tabelle che gli ambienti nominano per nome:

     POSE      come è messo il pavimento
     MURI      di che è fatta la parete
     DETTAGLI  che cosa si sparge sopra
     POSATURE  come cambia il pavimento da una zona all'altra

   Un ambiente non contiene un solo `ctx.qualcosa`: dice *quale* posa,
   *quale* muratura, *quali* dettagli e con che colori. Aggiungere una
   tecnica è un file nuovo più una riga qui; aggiungere una stanza non
   richiede quasi mai una tecnica nuova.
   ═══════════════════════════════════════════════════════════════════ */
import { lastre, mattoniPosa, pietra, mattoni } from './pietra.js'
import { rocciaPosa, roccia } from './roccia.js'
import { terra, binari, legno } from './legno.js'
import { metallo, ferro } from './metallo.js'
import { mosaico, tappeto, marmo } from './marmo.js'
import { erba, alberi } from './verde.js'
import { umido } from './acqua.js'
import * as pietrosi from './dettagli.js'
import * as vivi from './dettagli-vivi.js'

export { semina, crepa } from './semina.js'
export { variazioni, MODULO } from './varianti.js'
export { POSATURE } from './posature.js'

export const POSE = {
  erba, lastre, mattoni: mattoniPosa, metallo, mosaico,
  roccia: rocciaPosa, terra, binari, tappeto, umido,
}

export const MURI = { pietra, mattoni, ferro, marmo, roccia, alberi, legno }

export const DETTAGLI = { ...pietrosi, ...vivi }
