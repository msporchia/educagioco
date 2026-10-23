// La scena VERA del Sotterraneo 3D (scena3d/indice.js) senza il gioco: una discesa del motore, l'eroe vestito di leggendari, e una
// delle quattro viste (scontro con tre mostri, la cantina in esplorazione, lo scontro col fuoco e la torcia, l'eroe da vicino).
// Lo scontro è quello della misura coi modelli veri del telefono (grafica/benchmark/veri/discese.js, `tri-1`): stessa campagna,
// stesso seme, stessi mostri, così i ms del computer si confrontano con quelli del Redmi. Copiato qui apposta (prima l'autonomia).
import { creaSotterraneo3d } from '../../src/giochi/sotterraneo/scena3d/indice.js'
import { Corsa } from '../../src/giochi/sotterraneo/motore/corsa.js'
import { CAMPAGNA } from '../../src/giochi/sotterraneo/dati/campagna.js'
import { MOSTRI } from '../../src/giochi/sotterraneo/dati/mostri.js'
import { COSE, COPRICAPI, chiaveDelPezzo } from '../../src/giochi/sotterraneo/dati/cose.js'
import { LEGGENDARI } from '../../src/giochi/sotterraneo/dati/pezzi.js'
import { pescaAbilita } from '../../src/giochi/sotterraneo/motore/bottino.js'

const SEME = 11
const TIPI = ['scheletro', 'goblin', 'orco', 'lupo', 'ragno', 'zombie', 'troll', 'diavoletto'].filter(t => MOSTRI[t])
export const VISTE = {
  scontro: 'lo scontro: tre mostri leggendari, fermo',
  cantina: 'la cantina in esplorazione, torcia accesa',
  fuoco: 'lo scontro col fuoco: torcia accesa e una magia di fuoco a metà',
  vicino: "l'eroe da vicino (lo scontro, zoom massimo)",
}

// il corredo leggendario (il cheat `&corredo=leggendario`, come grafica/benchmark/veri/leggendario.js)
function vestiLeggendario(c) {
  const L = c.livelloDelBottino || 1
  const leggendario = dove => {
    const id = Object.keys(LEGGENDARI).find(id => COSE[LEGGENDARI[id].base].dove === dove && c.porta(LEGGENDARI[id].base))
    return id ? chiaveDelPezzo(LEGGENDARI[id].base, L, 'leggendario', [], id) : null
  }
  c.mano = leggendario('mano')
  c.mancina = c.mano && COSE[c.mano].mani === 2 ? null : leggendario('mancina')
  c.corpo = leggendario('corpo'); c.collo = leggendario('collo')
  c.dito = c.dito2 = leggendario('dito')
  const t = COPRICAPI.find(k => !COSE[k].deiGrossi && c.porta(k))
  c.testa = t ? chiaveDelPezzo(t, L, 'raro', pescaAbilita(t, 2)) : null
  c.sistemaIlCorredo()
  return c
}

const accendiTorcia = c => { if (!c.torciaAccesa) { c.torceInScorta = 0; c.accendi('torcia') } c.aggiornaLuce() }

// lo scontro della misura: la sala, l'eroe nel punto più lontano dai mostri, n mostri attorno e lo scontro aperto
function corsaDelloScontro(n, torcia) {
  const c = new Corsa(CAMPAGNA[1], { seme: SEME, eroe: 'cavaliere', botti: true, copricapi: true })
  vestiLeggendario(c)
  const liv = c.livello
  const s = liv.stanze.find(r => r.forma === 'sala') || liv.stanze.reduce((a, b) => (b.suolo.length > a.suolo.length ? b : a), liv.stanze[0])
  const mostri = liv.robe.filter(r => r.che === 'mostro')
  const lontano = r => mostri.reduce((m, o) => Math.min(m, Math.hypot(o.x - r.x, o.y - r.y)), 99)
  const dove = s.suolo.reduce((b, r) => (lontano(r) > lontano(b) ? r : b), s.suolo[0])
  c.eroe = { x: dove.x + 0.5, y: dove.y + 0.5 }
  c.segnaLaStanza()
  if (torcia) accendiTorcia(c); else c.aggiornaLuce()
  const ex = Math.floor(c.eroe.x), ey = Math.floor(c.eroe.y), stanza = liv.stanzaDi(ex, ey), libere = []
  for (let y = ey - 4; y <= ey + 4; y++) for (let x = ex - 4; x <= ex + 4; x++) {
    if ((x === ex && y === ey) || !liv.calpestabile(x, y) || liv.robeSu(x, y).length) continue
    if (liv.stanzaDi(x, y) !== stanza || Math.hypot(x + 0.5 - c.eroe.x, y + 0.5 - c.eroe.y) > 4.4) continue
    libere.push({ x, y, d: Math.hypot(x - ex, y - ey) })
  }
  libere.sort((a, b) => (a.d - b.d) || (b.x - a.x))
  const fatti = libere.slice(0, n).map(({ x, y }, k) => liv.mostro(TIPI[k % TIPI.length], x, y, { grado: 'leggendario' }))
  liv.robe.push(...fatti)
  fatti.forEach(m => { m.sveglio = true })
  c.scontro(fatti[0])
  return c
}

// la cantina: la prima discesa delle cantine, l'eroe in mezzo alla stanza più grande, la torcia accesa, nessuno scontro
function corsaDellaCantina() {
  const tappa = CAMPAGNA.find(t => t.chiave === 'cantine') || CAMPAGNA[0]
  const c = new Corsa(tappa, { seme: SEME, eroe: 'cavaliere', botti: true, copricapi: true })
  vestiLeggendario(c)
  const liv = c.livello
  const s = liv.stanze.reduce((a, b) => (b.suolo.length > a.suolo.length ? b : a), liv.stanze[0])
  const cx = s.suolo.reduce((a, r) => a + r.x, 0) / s.suolo.length, cy = s.suolo.reduce((a, r) => a + r.y, 0) / s.suolo.length
  const dove = s.suolo.reduce((b, r) => (Math.hypot(r.x - cx, r.y - cy) < Math.hypot(b.x - cx, b.y - cy) && liv.calpestabile(r.x, r.y) ? r : b), s.suolo[0])
  c.eroe = { x: dove.x + 0.5, y: dove.y + 0.5 }
  c.segnaLaStanza()
  accendiTorcia(c)
  return c
}

/**
 * Monta il Sotterraneo 3D nel contenitore e prepara la vista. `opz`: { vista, dpr, spegni, mostri (nello scontro) }.
 * → { pittore, corsa, canvas, colpo() (la magia della vista `fuoco`), via() }
 */
export async function montaScena(contenitore, { vista = 'scontro', dpr = 1, spegni = [], mostri = 3 } = {}) {
  const canvas = document.createElement('canvas')
  Object.assign(canvas.style, { position: 'absolute', inset: '0', width: '100%', height: '100%', display: 'block' })
  const strato = document.createElement('div')
  Object.assign(strato.style, { position: 'absolute', inset: '0', pointerEvents: 'none', overflow: 'hidden' })
  contenitore.append(canvas, strato)
  const pittore = creaSotterraneo3d(canvas, { strato, dpr, spegni, cieca: 320 })
  if (!pittore) throw new Error('il Sotterraneo 3D non parte (WebGL 2?)')
  const corsa = vista === 'cantina' ? corsaDellaCantina() : corsaDelloScontro(mostri, vista === 'fuoco' || vista === 'vicino')
  pittore.misura()
  pittore.mostra({ corsa, orologio: 0, fx: null })
  if (vista === 'vicino' || vista === 'cantina') pittore.zoomA(vista === 'vicino' ? 5 : 3)
  pittore.avvia()
  return {
    pittore, corsa, canvas,
    // una magia di fuoco dell'eroe sul primo mostro (la vista `fuoco`): effetti 3D, lampo e scintille
    colpo(chiave = 'fiammata') { try { pittore.prova(chiave, 0) } catch (e) { /* un effetto che non c'è */ } },
    via() { pittore.distruggi(); canvas.remove(); strato.remove() },
  }
}

/** Chi sta in piedi adesso (per le ombre a macchia): l'eroe e i mostri disegnati, { x, z, r }. */
export function piedi(pittore, corsa) {
  const v = []
  const e = pittore.eroe && pittore.eroe.disegnato
  if (e) v.push({ x: e.x, z: e.z, r: 0.42 })
  const campo = pittore.palco ? pittore.palco.campo : (corsa.livello.robe || []).filter(r => r.che === 'mostro' && !r.morto)
  for (const r of campo) {
    const s = pittore.statoDi(r)
    if (!s || s.x == null || r.morto) continue
    v.push({ x: s.x + (s.dx || 0), z: s.z + (s.dz || 0), r: 0.32 + 0.12 * Math.min(2, s.alto || 1) })
  }
  return v
}
