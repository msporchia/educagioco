// Generato da strumenti/promuovi-3d.mjs: non si tocca a mano. Il catalogo delle figure come lo leggono i prototipi (roba.json), dai
// dati di dati/figure3d.js (`npm run roba3d`): senza le descrizioni e i rettangoli, che il disegno non usa.
import { FIGURE3D } from '../../dati/figure3d.js'

export default { figure: Object.entries(FIGURE3D).map(([id, f]) => ({ id, ...f })) }
