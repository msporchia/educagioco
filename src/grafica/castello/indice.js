// L'indice dei pittori del campo: ogni voce di PITTORI arriva da un file
// accanto (fondale/fortezza/torri/mostro/corpi-mostri/colpi/indizi/tinte).
// Misure in unità (`p.S`), mai in pixel.
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
