// I materiali — l'indice: un file per famiglia, e qui le tabelle che gli ambienti
// nominano per nome (POSE, MURI, DETTAGLI, POSATURE). Vedi docs/core/grafica.md.
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
