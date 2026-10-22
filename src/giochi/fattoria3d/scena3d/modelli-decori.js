// Le decorazioni portate dalla 2D (giro G8): il registro che dice, per ogni id di dati/decori.js, quale modello lo disegna. Cinque file, uno per famiglia
// (verde, recinti, raccolto, case, bestiole); ogni modello è in cache (`memoModello`) e fuso, quindi la decima siepe costa un clone. Vedi
// docs/fattoria3d/decorazioni.md.
import { VERDE_DECORI } from './modelli-decori-verde.js'
import { RECINTI_DECORI } from './modelli-decori-recinti.js'
import { RACCOLTO_DECORI } from './modelli-decori-raccolto.js'
import { CASE_DECORI } from './modelli-decori-case.js'
import { BESTIOLE_DECORI } from './modelli-decori-bestiole.js'

/** id → il creatore (`() => Group`), per tutte le decorazioni portate. */
export const DECORI_CREA = { ...VERDE_DECORI, ...RECINTI_DECORI, ...RACCOLTO_DECORI, ...CASE_DECORI, ...BESTIOLE_DECORI }
export const creaDecoro = id => DECORI_CREA[id]()
