// Gli oggetti di scena del villaggio, l'unica città: dove stanno (puro, derivato dal mondo già generato con un caso suo: il
// generatore e la firma non cambiano) e come si posano nel cantiere del pezzo. Il villaggio è un ferro di cavallo aperto a sud
// (dati/mondo-aperto.js, VILLAGGIO), e dalla piazza si devono vedere tutti: niente orti, bucato né carretti sul davanti, cioè
// fra la piazza e la telecamera; le cose stanno ai fianchi delle botteghe, dietro, attorno alle case del fondale e sui lati della
// piazza. Sempre su celle libere d'erba del villaggio, mai su una strada, un posto, davanti a una porta o nelle zone tenute
// libere davanti alle botteghe; non cambiano la mappa di blocco. docs/sotterraneo/mondo-3d.md, «Gli oggetti del villaggio».
import { caso, quotaTerreno, ERBA } from './suolo.js'
import { grigliaDi, pezzoDi } from './pezzi.js'
import { MODELLI } from './props-modelli.js'

const DIR = { n: [0, -1], s: [0, 1], e: [1, 0], o: [-1, 0] }
// quante celle occupa un oggetto lungo il muro (il resto è una cella)
const LARGHE = { carretto: 2, bucato: 2, rastrelliera: 2, scaffale: 2, catasta: 2, bancarella: 2, botti: 1 }

// il carattere del villaggio: cosa si mette attorno alle case (peso) e quanti al più; cosa sta sparso dietro e ai lati
const MENU = {
  case: { carretto: 2, fiori: 4, vaso: 2, bucato: 2, legna: 3, barile: 2, botti: 1, sacchi: 2, casse: 1, balle: 2 },
  max: { carretto: 2, bucato: 2, tavolo: 2, botti: 2, balle: 3, fiori: 8, vaso: 4, lanterna: 8, panca: 4 },
  sparsi: 10,
  aperto: { fiori: 3, balle: 2, legna: 2, barile: 2, sacchi: 1, casse: 1, vaso: 1 },
  extra: ['fiori', 'sacchi', 'vaso'],
}
// cosa sta attorno a una bottega, oltre all'insegna
const ARREDO = {
  fucina: ['ruota', 'rastrelliera', 'incudine', 'barile', 'carbone'],
  bancarella: ['sacchi', 'casse', 'barile', 'botti'],
  erbe: ['scaffale', 'fiori', 'vaso', 'barile', 'fiori'],
  torretta: ['lanterna', 'barile', 'vaso', 'fiori'],
}

const mescola = (l, r) => { for (let i = l.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [l[i], l[j]] = [l[j], l[i]] } return l }
function pesca(r, pesi, fuori) {
  const v = Object.entries(pesi).filter(([k]) => !fuori.has(k)), tot = v.reduce((s, [, p]) => s + p, 0)
  let x = r() * tot
  for (const [k, p] of v) { if ((x -= p) < 0) return k }
  return v.length ? v[0][0] : null
}

// ── il terreno del villaggio: cosa è libero e cosa no. `davanti`: le righe dalla piazza in giù, verso la telecamera ──
function creaContesto(m) {
  const c = m.villaggio, W = m.W, H = m.H
  const k = (x, y) => y * W + x
  const fisso = new Set(), preso = new Set()
  const rett = (x, y, w, h) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) fisso.add(k(i, j)) }
  const case_ = c.case
  for (const cs of case_) rett(cs.x, cs.y, cs.w, cs.h)
  const posti = m.posti.filter(p => p.tipo !== 'citta' && p.citta === 'villaggio')
  for (const p of posti) {
    rett(p.x, p.y, p.w, p.h)
    if (p.accanto) rett(p.accanto.x - 1, p.accanto.y - 1, 3, 2)
    if (p.piede) rett(p.piede.x - 1, p.piede.y - 1, 3, 3)
    if (p.tipo === 'persona' || p.tipo === 'pozzo') rett(p.x - 1, p.y - 1, p.w + 2, p.h + 2)
  }
  for (const a of c.alberi) rett(a.x - 1, a.y - 1, 3, 3)
  const davanti = y => y >= c.piazza.y + c.piazza.h
  const libera = (x, y) => {
    if (x < c.x || y < c.y || x >= c.x + c.w || y >= c.y + c.h || x >= W || y >= H) return false
    const i = k(x, y)
    return m.terreno[i] === ERBA && !m.strada[i] && !m.blocco[i] && !m.riservato[i] && m.ponte[i] < 0 && !fisso.has(i) && !preso.has(i)
  }
  return { m, c, k, libera, preso, fisso, case_, posti, davanti, lista: [], conta: {}, r: caso((Math.imul((m.seme | 0) + 7, 2654435761) ^ 40503 * 3) >>> 0) }
}

// posa un oggetto largo `larghe` celle, con il davanti verso `dir`, a partire dalla cella (x, y); `retro`: quanto sta addossato al muro
function colloca(ctx, tipo, x, y, dir, larghe = LARGHE[tipo] || 1, extra = null, retro = 0.1) {
  const t = [dir[1], -dir[0]], celle = []
  for (let i = 0; i < larghe; i++) celle.push([x + t[0] * i, y + t[1] * i])
  if (!celle.every(([a, b]) => ctx.libera(a, b))) return false
  // sul davanti (fra la piazza e chi guarda) solo le cose basse e piccole dei lati: niente che copra qualcuno
  if (celle.some(([, b]) => ctx.davanti(b)) && !BASSI.has(tipo)) return false
  for (const [a, b] of celle) ctx.preso.add(ctx.k(a, b))
  const cx = celle.reduce((s, v) => s + v[0], 0) / larghe + 0.5 - dir[0] * retro, cz = celle.reduce((s, v) => s + v[1], 0) / larghe + 0.5 - dir[1] * retro
  ctx.lista.push({ tipo, x: cx, z: cz, ry: Math.atan2(dir[0], dir[1]), seme: Math.floor(ctx.r() * 1e9) + 1, celle, citta: 'villaggio', ...extra })
  ctx.conta[tipo] = (ctx.conta[tipo] || 0) + 1
  return true
}
const BASSI = new Set(['fiori', 'vaso', 'lanterna', 'panca'])
// le celle attorno a un rettangolo, col davanti verso fuori; `escludi` i lati da saltare
function murali(r, escludi) {
  const v = []
  for (const lato of ['n', 's', 'e', 'o']) {
    if (escludi.includes(lato)) continue
    const dir = DIR[lato]
    if (lato === 'n' || lato === 's') for (let x = r.x; x < r.x + r.w; x++) v.push({ x, y: lato === 'n' ? r.y - 1 : r.y + r.h, dir })
    else for (let y = r.y; y < r.y + r.h; y++) v.push({ x: lato === 'o' ? r.x - 1 : r.x + r.w, y, dir })
  }
  return v
}
function provaCandidati(ctx, tipo, cands, extra = null, retro = 0.1) {
  for (const cd of cands) if (colloca(ctx, tipo, cd.x, cd.y, cd.dir, LARGHE[tipo] || 1, extra, retro)) return true
  return false
}
// la cella libera più vicina a un punto ideale, entro `raggio`, col davanti verso `dir`
function vicino(ctx, ix, iz, raggio, tipo, dir, extra = null) {
  const cand = []
  for (let y = Math.floor(iz - raggio); y <= Math.ceil(iz + raggio); y++) for (let x = Math.floor(ix - raggio); x <= Math.ceil(ix + raggio); x++) {
    const d = Math.hypot(x + 0.5 - ix, y + 0.5 - iz)
    if (d <= raggio) cand.push({ x, y, d })
  }
  cand.sort((a, b) => a.d - b.d || a.y - b.y || a.x - b.x)
  for (const cd of cand) if (colloca(ctx, tipo, cd.x, cd.y, dir, LARGHE[tipo] || 1, extra, 0)) return true
  return false
}

// ── il villaggio ──
export function propsDellaCitta(m) {
  const ctx = creaContesto(m), { c, r } = ctx, menu = MENU
  // 1) le insegne e l'arredo delle botteghe: ai fianchi e dietro, mai sul davanti
  for (const p of ctx.posti.filter(q => q.tipo === 'mercante')) {
    const lato = []
    for (let dy = 1; dy <= 3; dy++) for (const x of [p.x - 1, p.x + p.w]) lato.push({ x, y: p.y + p.h - dy, dir: [0, 1] })
    provaCandidati(ctx, 'insegna', lato, { bottega: p.bottega }, 0)
    const lista = mescola([...(ARREDO[p.bottega] || []), ...menu.extra.filter(() => r() < 0.6)], r).slice(0, 4)
    for (const tipo of lista) {
      if ((ctx.conta[tipo] || 0) >= (menu.max[tipo] ?? 99)) continue
      provaCandidati(ctx, tipo, mescola(murali(p, ['s']), r), { fuoco: false })
    }
  }
  // 2) la piazza: le lanterne lungo il lato delle botteghe e agli angoli, le panche ai due capi (guardano dentro la piazza)
  const P = c.piazza
  for (let i = 0; i < 5; i++) vicino(ctx, P.x + 1 + i * (P.w - 2) / 4, P.y - 0.5, 1.6, 'lanterna', [0, 1])
  for (const x of [P.x - 0.5, P.x + P.w + 0.5]) vicino(ctx, x, P.y + P.h - 0.5, 1.6, 'lanterna', [0, 1])
  for (const [x, d] of [[P.x - 0.5, [1, 0]], [P.x + P.w + 0.5, [-1, 0]]]) for (const dz of [2, 6]) vicino(ctx, x, P.y + dz, 1.5, 'panca', d)
  // un tavolo con le panche ai capi della fila delle botteghe
  for (const x of [P.x + 1, P.x + P.w - 2]) if ((ctx.conta.tavolo || 0) < menu.max.tavolo) vicino(ctx, x, P.y - 2, 2, 'tavolo', [0, 1])
  // 3) le case del fondale: due o tre cose ai fianchi e dietro (a nord), mai verso le botteghe
  for (const cs of ctx.case_) {
    const n = 2 + Math.floor(r() * 2), fatti = new Set()
    for (let i = 0, prove = 0; i < n && prove < 8; prove++) {
      const full = new Set([...fatti, ...Object.keys(menu.max).filter(t => (ctx.conta[t] || 0) >= menu.max[t])])
      const tipo = pesca(r, menu.case, full)
      if (!tipo) break
      if (provaCandidati(ctx, tipo, mescola(murali(cs, ['s']), r), { fuoco: false })) { fatti.add(tipo); i++ }
      else fatti.add(tipo)
    }
  }
  // 4) sparsi dietro le botteghe e ai lati, a gruppetti discosti dalle strade
  for (let n = 0, prove = 0; n < menu.sparsi && prove < menu.sparsi * 40; prove++) {
    const tipo = pesca(r, menu.aperto, new Set(Object.keys(menu.max).filter(t => (ctx.conta[t] || 0) >= menu.max[t])))
    const x = c.x + 1 + Math.floor(r() * (c.w - 2)), y = c.y + 1 + Math.floor(r() * (P.y - c.y - 2)), dir = [DIR.s, DIR.e, DIR.o][Math.floor(r() * 3)]
    if (colloca(ctx, tipo, x, y, dir, LARGHE[tipo] || 1, { fuoco: false }, 0)) n++
  }
  return ctx.lista
}

const CACHE = new WeakMap()
// gli oggetti del villaggio, divisi per pezzo (ognuno sta nel pezzo della sua cella; la nebbia lo legge lì). Vogliono le celle del
// villaggio scritte (la sua zona caricata almeno una volta): prima, niente
export function propsPerPezzo(m) {
  if (CACHE.has(m)) return CACHE.get(m)
  const { n } = grigliaDi(m), pezzi = Array.from({ length: n }, () => [])
  const v = m.villaggio
  if (m.zona[v.partenza.y * m.W + v.partenza.x] < 0) return pezzi
  for (const o of propsDellaCitta(m)) pezzi[pezzoDi(m, o.x, o.z)].push(o)
  CACHE.set(m, pezzi)
  return pezzi
}

// li posa nel cantiere del pezzo
export function disegnaProps(lista, cant, m, cose) {
  for (const o of lista) {
    const f = MODELLI[o.tipo]
    if (!f) continue
    cant.base(o.x, quotaTerreno(m, o.x, o.z), o.z, o.ry)
    f(cant, caso(o.seme), o, cose)
  }
}
