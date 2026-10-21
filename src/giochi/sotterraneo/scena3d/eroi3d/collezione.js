// La collezione di armi 3D: una cinquantina di pezzi, dieci per tipo, dalla più umile alla leggendaria.
// Contratto: CATALOGO = [{ id, famiglia, nome, grado 1..10, elemento, crea() }], creaDaId(id).
// Orientamento come `creaArma` di armi.js: origine nel pugno, lama/testa/bastone verso +y; l'arco verticale col pancione
// verso +z; lo scudo con la faccia verso +z. `userData.famiglia` è quella che `equipaggia` capisce (spada | arco | scudo | staffa);
// `userData.tipo` è il tipo della collezione (spada | ascia | arco | bacchetta | scudo).
import { SPADE } from './collezione-spade.js'
import { ASCE } from './collezione-asce.js'
import { ARCHI } from './collezione-archi.js'
import { BACCHETTE } from './collezione-bacchette.js'
import { SCUDI } from './collezione-scudi.js'

export const FAMIGLIE = ['spada', 'ascia', 'arco', 'bacchetta', 'scudo']
const PER_EQUIPAGGIA = { spada: 'spada', ascia: 'spada', arco: 'arco', bacchetta: 'staffa', scudo: 'scudo' }
const TABELLE = { spada: SPADE, ascia: ASCE, arco: ARCHI, bacchetta: BACCHETTE, scudo: SCUDI }

export const CATALOGO = FAMIGLIE.flatMap(famiglia => TABELLE[famiglia].map(([id, nome, grado, elemento, costruisci]) => ({
  id, famiglia, nome, grado, elemento,
  crea () {
    const g = costruisci()
    g.userData.famiglia = PER_EQUIPAGGIA[famiglia]; g.userData.tipo = famiglia
    g.userData.id = id; g.userData.nome = nome; g.userData.grado = grado; g.userData.elemento = elemento
    return g
  }
})))

const PER_ID = new Map(CATALOGO.map(a => [a.id, a]))
export function creaDaId (id) {
  const a = PER_ID.get(id)
  if (!a) throw new Error(`arma sconosciuta: ${id}`)
  return a.crea()
}
export const perId = id => PER_ID.get(id) || null
