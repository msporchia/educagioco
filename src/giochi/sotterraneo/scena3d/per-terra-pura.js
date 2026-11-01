// Chi si vede col modello per terra (scena3d/roba-per-terra.js), senza three: lo legge anche il mondo di sopra (mondo/mostri.js) e
// lo strumento degli inutilizzati. Un pezzo con figura o ripiego, o un consumabile; non le armature (vesti da indossare) né i
// copricapi (il modello c'è solo su una testa).
import { COSE } from '../dati/cose.js'
import { consumabile3dDi, pezzo3dDi } from './anteprime3d-pura.js'

export function haModelloPerTerra(k) {
  const c = k ? COSE[k] : null
  if (!c || c.dove === 'corpo' || c.dove === 'testa') return false
  return !!(consumabile3dDi(k) || pezzo3dDi(k))
}
