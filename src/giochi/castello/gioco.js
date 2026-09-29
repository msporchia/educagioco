// Il manifesto del castello a sprite: due castelli per ora, `torri` (quello
// vero) e `castello` (stessa tappe e progressi, un'altra pelle). Vedi
// docs/castello/da-fare.md.
import { RACCONTO } from '../../data/campagne-castello.js'

export const CHIAVE = 'castello'

export default {
  chiave: CHIAVE,
  nome: 'Il castello a sprite',
  icona: '🧱',
  che: 'il tower defense, disegnato con le figure',
  area: 'numeri',
  come: 'strategia',
  tappe: RACCONTO.length,
  tinta: '#e3ead6',
  grandi: true,
  sperimentale: true,

  // non ha un avanzamento suo: le tappe sono quelle di `torri`
  riassunto() { return `le ${RACCONTO.length} tappe del castello, a sprite` },
}
