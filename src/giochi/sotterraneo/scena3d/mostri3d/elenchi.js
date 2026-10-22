// Generato da strumenti/promuovi-3d.mjs: non si tocca a mano (`npm run promuovi3d`). Gli elenchi dei mostri 3D che ci sono adesso, per zona; il drago
// grande nei suoi colori. Il registro (registro.js) li legge da qui: una zona che manca resta allo sprite.
import { MOSTRI } from './mostri.js'
import { MOSTRI_PRATI } from './prati.js'
import { MOSTRI_BOSCO } from './bosco.js'
import { MOSTRI_PALUDE } from './palude.js'
import { MOSTRI_CENERI } from './ceneri.js'
import { MOSTRI_MONTE } from './monte.js'
import { MOSTRI_LANDA } from './landa.js'
import { MOSTRI_VARIE } from './varie.js'
import { creaDragoGrande, COLORI as COLORI_DRAGHI } from './draghi.js'

export const ELENCHI = {
  mostri: MOSTRI,
  prati: MOSTRI_PRATI,
  bosco: MOSTRI_BOSCO,
  palude: MOSTRI_PALUDE,
  ceneri: MOSTRI_CENERI,
  monte: MOSTRI_MONTE,
  landa: MOSTRI_LANDA,
  varie: MOSTRI_VARIE,
  draghi: Object.keys(COLORI_DRAGHI).map(c => ({ chiave: c, nome: `Drago grande ${c}`, crea: () => creaDragoGrande(c) })),
}
