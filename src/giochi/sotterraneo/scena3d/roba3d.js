// La roba in 3D (docs/sotterraneo/roba-3d.md): un oggetto → la sua figura dei fogli → il modello del modulo della sua famiglia
// (roba3d/: lame, bastoni, scudi, vesti, gioielli, quelli che `npm run promuovi3d` ha trovato pronti), con l'alone della rarità e
// dell'elemento. Dove il modulo manca, la figura non è coperta o il modello si rompe, il ripiego è il modello della base nella
// collezione (MODELLO_DI); senza nemmeno quello null, e la vista tiene lo sprite.
import { creaDaId, perId } from './eroi3d/collezione.js'
import { MODULI } from './roba3d/moduli.js'
import { aggiungiAlone } from './roba3d/aloni.js'
import { FIGURE3D } from '../dati/figure3d.js'
import { pezzo3dDi, consumabile3dDi } from './anteprime3d-pura.js'
import { lookDi } from './roba3d-pura.js'

export { MODULI }
const rotte = new Set()                  // le figure il cui modello s'è rotto una volta: non si riprovano
const avvisa = (cosa, e) => { if (typeof console !== 'undefined') console.warn(`roba 3D: ${cosa} non si costruisce, ripiego`, e && e.message) }

/** Il record della figura come lo vogliono i moduli (quello di roba.json: `{ id, cosa, elemento, materia, … }`), o null. */
export const recordDi = figura => (FIGURE3D[figura] ? { id: figura, ...FIGURE3D[figura] } : null)

/** Il modulo che disegna la figura, se c'è (`moduli` per le prove): `crea(figura)`, o `vesti(eroe, figura)` per le vesti. */
export function moduloDi(figura, moduli = MODULI) {
  const f = FIGURE3D[figura]
  const m = f && moduli[f.famiglia]
  return m && (typeof m.crea === 'function' || typeof m.vesti === 'function') ? m : null
}

/** Il modello della figura dal suo modulo, o null (modulo che manca, figura che non copre, guasto). */
export function creaFigura(figura, moduli = MODULI) {
  const m = moduloDi(figura, moduli)
  if (!m || typeof m.crea !== 'function' || rotte.has(figura)) return null
  try {
    const g = m.crea(recordDi(figura))
    if (g && g.isObject3D) return g
  } catch (e) { avvisa(figura, e) }
  rotte.add(figura)
  return null
}

/** Il modello di un consumabile (una pozione, la torcia, la chiave, la pergamena) dal modulo `pozioni`, o null. */
export function creaConsumabile(chiave, moduli = MODULI) {
  const m = moduli.pozioni
  if (!m || typeof m.crea !== 'function' || (Array.isArray(m.CHIAVI) && !m.CHIAVI.includes(chiave)) || rotte.has(`usa:${chiave}`)) return null
  try {
    const g = m.crea(chiave)
    if (g && g.isObject3D) return g
  } catch (e) { avvisa(chiave, e) }
  rotte.add(`usa:${chiave}`)
  return null
}

/**
 * Il modello di un pezzo 3D (`pezzo3dDi`: { figura, id, rarita, elemento }): la figura, se no il ripiego della collezione, se no null.
 * `alone` (sì di difetto) mette l'alone della rarità e dell'elemento ai pezzi non comuni, coi punti grandi `scalaAlone`; l'eroe lo
 * muove con `userData.animaAlone`.
 */
export function creaPezzo(p, { moduli = MODULI, alone = true, scalaAlone = 1 } = {}) {
  if (!p) return null
  let g = p.figura ? creaFigura(p.figura, moduli) : p.consumabile ? creaConsumabile(p.consumabile, moduli) : null
  if (g) g.userData.daFigura = true
  else if (p.id && perId(p.id)) {
    try { g = creaDaId(p.id) } catch (e) { avvisa(p.id, e); g = null }
  }
  if (!g) return null
  if (alone && p.rarita && p.rarita !== 'comune') {
    try { if (g.userData.anima) g.userData.anima(0.5); aggiungiAlone(g, { rarita: p.rarita, elemento: p.elemento, scala: scalaAlone }) } catch (e) { avvisa(`l'alone di ${p.figura || p.id}`, e) }
  }
  return g
}

/**
 * Dalla chiave di un oggetto (anche composta, `spada@7.m.fuoco`) quello che serve per disegnarlo:
 * { figura, famiglia, modulo (la famiglia se il suo modulo c'è, se no null: si ripiega), ripiego (l'id della collezione o null),
 *   crea() → Group|null, look: { rarita, elemento, materia, pregio } }, o null se l'oggetto non ha né figura né ripiego.
 */
export function modelloDiRoba(chiave, { moduli = MODULI } = {}) {
  const u = consumabile3dDi(chiave)
  if (u) {
    return { figura: null, famiglia: 'pozioni', modulo: moduli.pozioni ? 'pozioni' : null, ripiego: null, consumabile: u.consumabile,
             crea: () => creaPezzo(u, { moduli }), look: { rarita: u.rarita, elemento: 'nessuno', materia: null, pregio: u.rarita === 'comune' ? 1 : 3 } }
  }
  const p = pezzo3dDi(chiave)
  if (!p) return null
  const f = p.figura ? FIGURE3D[p.figura] : null
  return {
    figura: p.figura, famiglia: f ? f.famiglia : null, modulo: p.figura && moduloDi(p.figura, moduli) ? f.famiglia : null, ripiego: p.id,
    crea: () => creaPezzo(p, { moduli }), look: lookDi(chiave),
  }
}

/** La veste del modulo `vesti` sull'eroe (`vesti(eroe, figura)`), o null se il modulo o la figura non c'è: si ripiega su armature.js. */
export function vestiFigura(eroe, figura, moduli = MODULI) {
  const m = moduli.vesti
  if (!m || typeof m.vesti !== 'function' || !FIGURE3D[figura] || FIGURE3D[figura].famiglia !== 'vesti' || rotte.has(`veste:${figura}`)) return null
  try {
    const togli = m.vesti(eroe, recordDi(figura))
    if (typeof togli === 'function') return togli
  } catch (e) { avvisa(figura, e) }
  rotte.add(`veste:${figura}`)
  return null
}

/** La collana del modulo `gioielli` al collo dell'eroe, senza alone (la catena allungata lo spargeva su tutto l'eroe); → `togli()` (con `.gruppo`), o null. */
export function indossaGioiello(eroe, p, moduli = MODULI) {
  const m = moduli.gioielli
  if (!p || !p.figura || !m || typeof m.indossa !== 'function' || rotte.has(p.figura)) return null
  try {
    const togli = m.indossa(eroe, recordDi(p.figura))
    if (typeof togli !== 'function') return null
    return togli
  } catch (e) { avvisa(p.figura, e); rotte.add(p.figura) }
  return null
}
