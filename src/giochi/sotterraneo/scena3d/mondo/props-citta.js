// Gli oggetti di scena delle tre città (villaggio, forte del guado, rifugio del passo): dove stanno (puro, derivato dal mondo già
// generato con un caso suo: il generatore e la firma della pianta non cambiano) e come si posano nel cantiere del pezzo.
// Stanno sempre su celle libere di erba dentro la zona della città, mai su una strada, su un posto, davanti a una porta o nelle
// zone tenute libere davanti alle botteghe; non cambiano la mappa di blocco (l'eroe non ne ha bisogno: sono ai margini).
// Ogni città ha il suo carattere (MENU). Dettagli e numeri: docs/sotterraneo/mondo-3d.md, «Gli oggetti delle città».
import { ERBA } from '../../motore/mondo-aperto.js'
import { caso, quotaTerreno } from './suolo.js'
import { grigliaDi, pezzoDi } from './pezzi.js'
import { MODELLI } from './props-modelli.js'

const DIR = { n: [0, -1], s: [0, 1], e: [1, 0], o: [-1, 0] }
const LATI = ['n', 's', 'e', 'o']
// quante celle occupa un oggetto lungo il muro (il resto è una cella)
const LARGHE = { carretto: 2, orto: 2, bucato: 2, rastrelliera: 2, scaffale: 2, catasta: 2, pellicce: 2, slitta: 2, bancarella: 2, botti: 1 }

// il carattere di ogni città: cosa si mette ai muri delle case (peso) e quanti di ciascuno al massimo
const MENU = {
  villaggio: { case: { carretto: 3, orto: 3, fiori: 4, vaso: 2, bucato: 2, legna: 2, barile: 2, botti: 1, sacchi: 2, casse: 1, balle: 2, panca: 2, tavolo: 1 },
               max: { carretto: 3, orto: 4, bucato: 3, tavolo: 2, botti: 2, balle: 3, fiori: 6, vaso: 4 }, case_n: 3, sparsi: 9,
               aperto: { orto: 3, fiori: 3, balle: 2, legna: 1, bucato: 3, carretto: 2, vaso: 1, panca: 1, barile: 1 },
               piazza: { lampioni: 4, lampione: 'lanterna', bancarelle: 2, panche: 3, bandiere: 0, tende: 0 },
               extra: ['fiori', 'carretto', 'sacchi'] },
  forte: { case: { casse: 3, barile: 3, botti: 1, sacchi: 2, rastrelliera: 3, manichino: 1, panca: 1, tavolo: 1, legna: 1 },
           max: { rastrelliera: 3, manichino: 2, botti: 1, tavolo: 1 }, case_n: 2, sparsi: 10,
           aperto: { rastrelliera: 3, manichino: 2, casse: 2, barile: 2, sacchi: 2, legna: 1, tavolo: 1, panca: 1, torcia: 1 },
           piazza: { lampioni: 4, lampione: 'torcia', bancarelle: 0, panche: 2, bandiere: 2, tende: 3, palizzata: true },
           extra: ['casse', 'rastrelliera', 'manichino'] },
  rifugio: { case: { legna: 3, catasta: 2, pellicce: 3, barile: 2, sacchi: 1, casse: 1, slitta: 1, ceppo: 2, panca: 1, tavolo: 1 },
             max: { catasta: 3, slitta: 1, pellicce: 4, ceppo: 2, tavolo: 1, braciere: 5 }, case_n: 3, sparsi: 14,
             aperto: { catasta: 3, pellicce: 3, slitta: 1, ceppo: 2, braciere: 2, barile: 2, botti: 1, sacchi: 1, casse: 1, legna: 3 },
             piazza: { lampioni: 3, lampione: 'braciere', bancarelle: 1, panche: 2, bandiere: 0, tende: 0 },
             extra: ['catasta', 'pellicce'],
             arredo: { bancarella: ['pellicce', 'catasta', 'sacchi'], erbe: ['catasta', 'pellicce', 'barile'], torretta: ['braciere', 'pellicce', 'catasta'] } },
}
// cosa sta attorno a una bottega, oltre all'insegna
const ARREDO = {
  fucina: ['ruota', 'rastrelliera', 'incudine', 'barile', 'carbone'],
  bancarella: ['sacchi', 'casse', 'barile', 'botti'],
  erbe: ['scaffale', 'fiori', 'vaso', 'barile', 'fiori'],
  torretta: ['lanterna', 'barile', 'vaso', 'panca'],
}

const mescola = (l, r) => { for (let i = l.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [l[i], l[j]] = [l[j], l[i]] } return l }
function pesca(r, pesi, fuori) {
  const v = Object.entries(pesi).filter(([k]) => !fuori.has(k)), tot = v.reduce((s, [, p]) => s + p, 0)
  let x = r() * tot
  for (const [k, p] of v) { if ((x -= p) < 0) return k }
  return v.length ? v[0][0] : null
}

// ── il terreno della città: cosa è libero e cosa no ──
function creaContesto(m, ci) {
  const c = m.citta[ci], W = m.W, H = m.H
  const k = (x, y) => y * W + x
  const fisso = new Set(), preso = new Set()
  const rett = (x, y, w, h) => { for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) fisso.add(k(i, j)) }
  const dist = o => Math.hypot(o.x + (o.w || 1) / 2 - c.centro.x - 0.5, o.y + (o.h || 1) / 2 - c.centro.y - 0.5)
  const vicina = o => dist(o) <= c.raggio + 1.5
  // le case della città: quelle della sua regione entro due raggi; attorno a loro la zona si allarga di tre celle
  const case_ = m.case.filter(o => vicina(o) || (o.regione === c.regione && dist(o) <= c.raggio * 2))
  const zonaCase = new Set()
  for (const cs of case_) for (let j = cs.y - 3; j < cs.y + cs.h + 3; j++) for (let i = cs.x - 3; i < cs.x + cs.w + 3; i++) if (i >= 0 && j >= 0 && i < W && j < H) zonaCase.add(k(i, j))
  for (const cs of case_) {
    rett(cs.x, cs.y, cs.w, cs.h)
    // davanti alla porta resta libero
    const [dx, dz] = DIR[cs.verso]
    if (dz) rett(cs.x - 1, dz > 0 ? cs.y + cs.h : cs.y - 1, cs.w + 2, 1)
    else rett(dx > 0 ? cs.x + cs.w : cs.x - 1, cs.y - 1, 1, cs.h + 2)
  }
  const posti = m.posti.filter(p => p.tipo !== 'citta' && (p.citta === c.chiave || vicina(p)))
  for (const p of posti) {
    rett(p.x, p.y, p.w, p.h)
    if (p.accanto) rett(p.accanto.x - 1, p.accanto.y - 1, 3, 2)
    if (p.piede) rett(p.piede.x - 1, p.piede.y - 1, 3, 3)
    if (p.tipo === 'minatore' && p.tenda) rett(p.x - 1, p.y, p.w + 3, p.h + 2)
    if (p.tipo === 'persona') rett(p.x - 1, p.y - 1, 3, 3)
  }
  rett(c.pozzo.x - 1, c.pozzo.y - 1, c.pozzo.w + 2, c.pozzo.h + 2)
  for (const d of m.decoro) {
    if (Math.hypot(d.x - c.centro.x, d.y - c.centro.y) > c.raggio + 2) continue
    const x = Math.floor(d.x), y = Math.floor(d.y)
    if (d.blocca) rett(x - 1, y - 1, 3, 3); else rett(x, y, 1, 1)
  }
  const libera = (x, y) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return false
    const i = k(x, y)
    return (Math.hypot(x - c.centro.x, y - c.centro.y) <= c.raggio + 1 || zonaCase.has(i)) && m.terreno[i] === ERBA && !m.strada[i] && !m.blocco[i] && !m.riservato[i] && m.ponte[i] < 0
      && !(m.campo && m.campo[i]) && !fisso.has(i) && !preso.has(i)
  }
  return { m, c, ci, k, libera, preso, fisso, case_, posti, lista: [], conta: {}, r: caso((Math.imul((m.seme | 0) + 7, 2654435761) ^ Math.imul(ci + 3, 40503)) >>> 0) }
}

// posa un oggetto largo `larghe` celle, con il davanti verso `dir`, a partire dalla cella (x, y); `retro`: quanto sta addossato al muro
function colloca(ctx, tipo, x, y, dir, larghe = LARGHE[tipo] || 1, extra = null, retro = 0.1) {
  const t = [dir[1], -dir[0]], celle = []
  for (let i = 0; i < larghe; i++) celle.push([x + t[0] * i, y + t[1] * i])
  if (!celle.every(([a, b]) => ctx.libera(a, b))) return false
  for (const [a, b] of celle) ctx.preso.add(ctx.k(a, b))
  const cx = celle.reduce((s, v) => s + v[0], 0) / larghe + 0.5 - dir[0] * retro, cz = celle.reduce((s, v) => s + v[1], 0) / larghe + 0.5 - dir[1] * retro
  ctx.lista.push({ tipo, x: cx, z: cz, ry: Math.atan2(dir[0], dir[1]), seme: Math.floor(ctx.r() * 1e9) + 1, celle, citta: ctx.c.chiave, ...extra })
  ctx.conta[tipo] = (ctx.conta[tipo] || 0) + 1
  return true
}
// le celle attorno a un rettangolo, col davanti verso fuori; `escludi` il lato della porta
function murali(r, escludi) {
  const v = []
  for (const lato of LATI) {
    if (lato === escludi) continue
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
// la direzione verso il centro della piazza (l'asse più forte)
function versoCentro(ctx, x, y) {
  const dx = ctx.c.centro.x + 0.5 - x - 0.5, dz = ctx.c.centro.y + 0.5 - y - 0.5
  return Math.abs(dx) > Math.abs(dz) ? [Math.sign(dx), 0] : [0, Math.sign(dz) || 1]
}
// la cella libera più vicina a un punto ideale, entro `raggio`
function vicino(ctx, ix, iz, raggio, tipo, extra = null, larghe = LARGHE[tipo] || 1) {
  const cand = []
  for (let y = Math.floor(iz - raggio); y <= Math.ceil(iz + raggio); y++) for (let x = Math.floor(ix - raggio); x <= Math.ceil(ix + raggio); x++) {
    const d = Math.hypot(x + 0.5 - ix, y + 0.5 - iz)
    if (d <= raggio) cand.push({ x, y, d })
  }
  cand.sort((a, b) => a.d - b.d || a.y - b.y || a.x - b.x)
  for (const cd of cand) if (colloca(ctx, tipo, cd.x, cd.y, versoCentro(ctx, cd.x, cd.y), larghe, extra, 0)) return true
  return false
}

// ── una città ──
export function propsDellaCitta(m, ci) {
  const ctx = creaContesto(m, ci), { c, r } = ctx, menu = MENU[c.chiave] || MENU.villaggio
  // 1) le insegne e l'arredo delle botteghe
  for (const p of ctx.posti.filter(q => q.tipo === 'mercante' && q.citta === c.chiave)) {
    const lato = []
    for (let dy = 1; dy <= 3; dy++) for (const x of [p.x - 1, p.x + p.w]) lato.push({ x, y: p.y + p.h - dy, dir: [0, 1] })
    provaCandidati(ctx, 'insegna', lato, { bottega: p.bottega }, 0)
    const base = (menu.arredo && menu.arredo[p.bottega]) || ARREDO[p.bottega] || []
    const lista = mescola([...base, ...menu.extra.filter(() => r() < 0.6)], r).slice(0, 4)
    for (const tipo of lista) {
      if ((ctx.conta[tipo] || 0) >= (menu.max[tipo] ?? 99)) continue
      provaCandidati(ctx, tipo, mescola(murali(p, 's'), r), { fuoco: tipo === 'braciere' || tipo === 'torcia' })
    }
    // un tavolo con le panche accanto alla bottega, ai due lati del davanti
    if (r() < 0.5 && (ctx.conta.tavolo || 0) < (menu.max.tavolo ?? 2)) {
      const ang = []
      for (let dy = 0; dy < 3; dy++) for (const x of [p.x - 2, p.x + p.w + 1]) ang.push({ x, y: p.y + p.h + dy, dir: [0, 1] })
      provaCandidati(ctx, 'tavolo', mescola(ang, r), null, 0)
    }
  }
  // 2) la piazza: i lampioni attorno, le bancarelle con la tenda, le panche, le bandiere
  const px = c.piazza.x, pz = c.piazza.y, rp = c.piazza.r, P = menu.piazza
  const giro = (n, a0) => Array.from({ length: n }, (_, i) => a0 + i * Math.PI * 2 / n)
  const fuocoLamp = P.lampione === 'braciere' || P.lampione === 'torcia'
  giro(P.lampioni, 0.5).forEach((a, i) => vicino(ctx, px + Math.cos(a) * (rp + 0.8), pz + Math.sin(a) * (rp + 0.8), 1.7, P.lampione, { fuoco: fuocoLamp && (P.lampione === 'braciere' || i % 2 === 0) }, 1))
  giro(P.bancarelle, 1.9).forEach(a => vicino(ctx, px + Math.cos(a) * (rp + 2.4), pz + Math.sin(a) * (rp + 2.4), 3.6, 'bancarella'))
  giro(P.panche, 2.7).forEach(a => vicino(ctx, px + Math.cos(a) * (rp + 1.2), pz + Math.sin(a) * (rp + 1.2), 3, 'panca'))
  giro(P.bandiere, 3.9).forEach(a => vicino(ctx, px + Math.cos(a) * (rp + 1.4), pz + Math.sin(a) * (rp + 1.4), 2, 'bandiera'))
  // 3) le tende del forte: in mezzo ai prati della città, un po' discoste dalle strade
  for (let n = 0, prove = 0; n < (P.tende || 0) && prove < 300; prove++) {
    const a = r() * Math.PI * 2, d = 4.5 + r() * (c.raggio - 5.5), x = Math.floor(c.centro.x + 0.5 + Math.cos(a) * d - 1), y = Math.floor(c.centro.y + 0.5 + Math.sin(a) * d - 1)
    let ok = true
    for (let j = y - 1; j <= y + 2 && ok; j++) for (let i = x - 1; i <= x + 2; i++) {
      const dentro = i >= x && i < x + 2 && j >= y && j < y + 2
      if (dentro ? !ctx.libera(i, j) : (i < 0 || j < 0 || m.strada[ctx.k(i, j)] || ctx.preso.has(ctx.k(i, j)))) { ok = false; break }
    }
    if (!ok) continue
    for (const [i, j] of [[x, y], [x + 1, y], [x, y + 1], [x + 1, y + 1]]) ctx.preso.add(ctx.k(i, j))
    ctx.lista.push({ tipo: 'tenda', x: x + 1, z: y + 1, ry: (Math.floor(r() * 4)) * Math.PI / 2, seme: Math.floor(r() * 1e9) + 1, celle: [[x, y], [x + 1, y], [x, y + 1], [x + 1, y + 1]], citta: c.chiave })
    n++
  }
  // 4) la palizzata del forte: un anello di pali dentro il bordo, con i varchi dove passano le strade
  if (P.palizzata) {
    for (let y = c.centro.y - c.raggio; y <= c.centro.y + c.raggio; y++) for (let x = c.centro.x - c.raggio; x <= c.centro.x + c.raggio; x++) {
      const dx = x - c.centro.x, dz = y - c.centro.y, d = Math.hypot(dx, dz)
      if (d < c.raggio - 3.4 || d > c.raggio - 0.5 || !ctx.libera(x, y)) continue
      let sbarra = false
      for (const [i, j] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) { const q = ctx.k(x + i, y + j); if (m.strada[q] || m.riservato[q] || m.ponte[q] >= 0) sbarra = true }
      if (sbarra) continue
      ctx.preso.add(ctx.k(x, y))
      ctx.lista.push({ tipo: 'palizzata', x: x + 0.5, z: y + 0.5, ry: Math.atan2(-dx, -dz), seme: Math.floor(r() * 1e9) + 1, celle: [[x, y]], citta: c.chiave })
    }
  }
  // 5) le case: ognuna ha due o tre cose ai fianchi e dietro, mai sul davanti
  const pesi = menu.case
  for (const cs of ctx.case_) {
    const n = 1 + Math.floor(r() * menu.case_n)
    const fatti = new Set()
    for (let i = 0, prove = 0; i < n && prove < 6; prove++) {
      const full = new Set([...fatti, ...Object.keys(menu.max).filter(t => (ctx.conta[t] || 0) >= menu.max[t])])
      const tipo = pesca(r, pesi, full)
      if (!tipo) break
      if (provaCandidati(ctx, tipo, mescola(murali(cs, cs.verso), r), { fuoco: false })) { fatti.add(tipo); i++ }
      else fatti.add(tipo)
    }
  }
  // 6) sparsi nei prati: dove le case non bastano (il rifugio non ne ha), a gruppetti discosti dalle strade
  const libero8 = (x, y, w) => {
    for (let j = y - 1; j <= y + 1; j++) for (let i = x - 1; i <= x + w; i++) { if (i < 0 || j < 0) return false; const q = ctx.k(i, j); if (m.strada[q] || m.riservato[q]) return false }
    return true
  }
  for (let n = 0, prove = 0; n < menu.sparsi && prove < menu.sparsi * 40; prove++) {
    const tipo = pesca(r, menu.aperto, new Set(Object.keys(menu.max).filter(t => (ctx.conta[t] || 0) >= menu.max[t])))
    const a = r() * Math.PI * 2, d = 3.5 + r() * (c.raggio - 3.5)
    const x = Math.floor(c.centro.x + 0.5 + Math.cos(a) * d), y = Math.floor(c.centro.y + 0.5 + Math.sin(a) * d), dir = DIR[LATI[Math.floor(r() * 4)]]
    if (!libero8(x, y, LARGHE[tipo] || 1)) continue
    if (colloca(ctx, tipo, x, y, dir, LARGHE[tipo] || 1, { fuoco: tipo === 'braciere' }, 0)) n++
  }
  return ctx.lista
}

const CACHE = new WeakMap()
// tutti gli oggetti del mondo, divisi per pezzo (ognuno sta nel pezzo della sua cella; la nebbia lo legge lì)
export function propsPerPezzo(m) {
  if (CACHE.has(m)) return CACHE.get(m)
  const { n } = grigliaDi(m), pezzi = Array.from({ length: n }, () => [])
  m.citta.forEach((_, ci) => { for (const o of propsDellaCitta(m, ci)) pezzi[pezzoDi(m, o.x, o.z)].push(o) })
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
