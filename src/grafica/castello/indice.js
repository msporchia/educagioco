// I pittori del campo che non sono figure: i colpi e gli scoppi, le
// piazzole che respirano, il raggio, la bocca da cui escono i mostri, e i
// segni sopra le figure (segni.js). Le torri, i mostri e il fondale li
// dipingono gli sprite (giochi/castello/scena/pittori.js e pelle.js), che
// questa tabella la allargano. Misure in unità (`p.S`), mai in pixel.
import { colpo, schizzo } from './colpi.js'
import { piazzolaViva, raggio, ingresso } from './indizi.js'

export { targhe, segnoImmune, corona } from './segni.js'
export { statiMostro } from './stati.js'
export { TINTA } from './tinte.js'

export const PITTORI = { colpo, schizzo, piazzola: piazzolaViva, raggio, ingresso }
