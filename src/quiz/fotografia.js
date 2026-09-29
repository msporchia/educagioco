// Il ponte fra i conti puri di «Come va» (quiz/comeva.js) e il profilo di chi gioca; e la fotografia settimanale
// (store/istantanee.js), che parte da quando c'è: App.vue la chiede entrando in un gioco, «Come va» aprendosi.
import { state } from '../store/profile.js'
import { MATERIE, abilita } from '../store/progressi.js'
import { fotografaSeServe } from '../store/istantanee.js'
import { fasceDelBambino } from './catalogo.js'
import { mattonelleDi, fotoDa } from './comeva.js'

// righe: quelle di fasceDelBambino, se chi chiama le ha già (il catalogo si ricalcola a mano, costa)
export function mattonelleOra({ prima = null, now = Date.now(),
                               righe = fasceDelBambino().flatMap(f => f.righe) } = {}) {
  const albo = MATERIE.map(m => abilita(state.profile, m, now)).filter(Boolean)
  return { righe, ...mattonelleDi({ albo, righe, items: state.profile.items || {}, prima, now }) }
}

export function fotografa(now = Date.now()) {
  const id = state.player
  if (!id) return Promise.resolve(false)
  return fotografaSeServe(id, () => {
    const { viste, nonAncora, righe } = mattonelleOra({ now })
    const tipi = [...new Set(righe.map(r => r.tipo).filter(Boolean))]
    return fotoDa([...viste, ...nonAncora], state.profile.items || {}, tipi)
  }, now).catch(() => false)
}
