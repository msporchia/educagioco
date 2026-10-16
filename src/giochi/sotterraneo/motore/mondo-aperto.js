// Il generatore del mondo aperto (docs/sotterraneo/mondo-aperto-generatore.md): dalla scheda (dati/mondo-aperto.js) e da un seme
// fisso la mappa di celle (erba, acqua, roccia, ponti, varchi, strade, decoro), le regioni col loro anello e la loro fascia, i
// passaggi fra le regioni con la grata, le città, i posti (ingressi, pietre del viaggio, antri, mercanti, chi sta fermo) con
// `piede` e `accanto`, la firma e i guasti. Il cuore (regioni dal centro più vicino col rumore, fiumi e creste dalla distanza
// dal confine, valichi, masse) viene dalle terre selvagge (motore/aperta.js del ramo `terre-selvagge`), i ponti modellati, i
// lotti, le strade e la quota dal prototipo poc/mondo-sopra. Puro: gira in Node (`npm run pianta -- --mondo`).
import { MONDO_APERTO, REGIONI_DEL_MONDO, PASSAGGI, DUNGEON, CITTA, BOTTEGHE, PERSONE, PERSONE_NUOVE, HABITAT, LOTTI, MARCHE,
  regolaDi, haGrata, anelloDi, fasciaDi, difDi } from '../dati/mondo-aperto.js'
import { MERCANTI } from '../dati/mercanti.js'
import { cerca, passiDa } from './mondo-aperto-strade.js'

export const ERBA = 0, ACQUA = 1, ROCCIA = 2
export const LIVELLO_ACQUA = -0.25
// quanto è largo il fiume sotto ogni ponte, e quante celle di passi almeno fra un dungeon della storia e il dopo
const LARGO_AL_PONTE = { arco: 4, travi: 3, passerella: 2 }
const STACCO = 6
const QUATTRO = [[1, 0], [-1, 0], [0, 1], [0, -1]]

// il caso col seme e il rumore liscio (dalle terre selvagge): la mappa è sempre la stessa
function caso(seme) {
  let s = (seme >>> 0) || 1
  return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296 }
}
const scarta = (x, y, s) => {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1274126177)) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}
function rumore(x, y, seme, passo) {
  const gx = x / passo, gy = y / passo, x0 = Math.floor(gx), y0 = Math.floor(gy), fx = gx - x0, fy = gy - y0
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy)
  const a = scarta(x0, y0, seme), b = scarta(x0 + 1, y0, seme), c = scarta(x0, y0 + 1, seme), d = scarta(x0 + 1, y0 + 1, seme)
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v
}
const fbm = (x, y, seme, passo) => {
  let s = 0, a = 0.5, t = 0, p = passo
  for (let i = 0; i < 3; i++) { s += rumore(x, y, seme + i * 101, p) * a; t += a; a *= 0.5; p /= 2 }
  return s / t
}

export function generaMondoAperto(seme = MONDO_APERTO.seme, scheda = {}) {
  const t0 = Date.now()
  const REG = scheda.regioni || REGIONI_DEL_MONDO, PAS = scheda.passaggi || PASSAGGI
  const W = MONDO_APERTO.largo, H = MONDO_APERTO.alto, N = W * H
  const [colonne, righe] = MONDO_APERTO.griglia
  const rnd = caso(seme * 7919 + 17)
  const id = (x, y) => y * W + x
  const dentro = (x, y) => x >= 0 && y >= 0 && x < W && y < H
  const bordoDi = (x, y) => Math.min(x, y, W - 1 - x, H - 1 - y)
  const guasti = []
  const R = REG.map((q, i) => ({ ...q, i, anello: anelloDi(q), fascia: fasciaDi(q), dif: difDi(q), marca: q.marca || null }))
  const nR = R.length
  const regDi = Object.fromEntries(R.map(q => [q.chiave, q.i]))
  const passaggi = PAS.map((q, i) => ({ ...q, id: i, ...regolaDi(q, REG), conGrata: haGrata(q, REG), a_: regDi[q.a], da_: regDi[q.da] }))
  for (const q of passaggi) if (q.a_ == null || q.da_ == null) guasti.push(`il passaggio ${q.da}–${q.a} nomina una regione che non c'è`)
  const chiaveCoppia = (a, b) => (a < b ? a * 100 + b : b * 100 + a)
  const passDiCoppia = new Map(passaggi.map(q => [chiaveCoppia(q.da_, q.a_), q]))

  // 1. le regioni: il centro più vicino, con un rumore a macchie larghe che storce i confini. Il villaggio sta in mezzo
  const cw = W / colonne, ch = H / righe
  const centri = R.map(q => (q.anello === 0 ? { x: W / 2, y: H / 2 }
    : { x: (q.colonna + 0.5) * cw + (rnd() - 0.5) * cw * 0.2, y: (q.riga + 0.5) * ch + (rnd() - 0.5) * ch * 0.2 }))
  const reg = new Int16Array(N)
  const piatta = new Float32Array(nR)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let meglio = 0, quanto = Infinity, vicino = Infinity
    for (let i = 0; i < nR; i++) { piatta[i] = Math.hypot(x - centri[i].x, y - centri[i].y) - (R[i].anello === 0 ? 3 : 0); vicino = Math.min(vicino, piatta[i]) }
    for (let i = 0; i < nR; i++) {
      if (piatta[i] > vicino + 20) continue   // il rumore sposta al più di 10 per parte: questa non vince
      const d = piatta[i] + 15 * (rumore(x, y, seme + i * 31, 18) - 0.5) + 5 * (rumore(x, y, seme + i * 57, 6) - 0.5)
      if (d < quanto) { quanto = d; meglio = i }
    }
    reg[id(x, y)] = meglio
  }
  // il tipo di confine: quello che il passaggio vuole; se no fiume attorno al villaggio e fra due colonne, cresta fra due righe
  const tipoConfine = (a, b) => {
    const q = passDiCoppia.get(chiaveCoppia(a, b))
    if (q) return q.tipo === 'ponte' ? 'fiume' : 'cresta'
    if (R[a].anello === 0 || R[b].anello === 0) return 'fiume'
    return R[a].riga === R[b].riga ? 'fiume' : 'cresta'
  }

  // 1 bis. i ponti: dove il confine fra le due regioni è quasi dritto per dieci celle, lontano da una terza regione, lo si
  // raddrizza; lì il fiume passa dritto e il ponte lo attraversa da riva a riva. Un ponte fra due colonne va da ovest a est, uno
  // fra due righe da nord a sud: `u` corre lungo il confine, `v` lo attraversa
  const finestre = []   // { x0, y0, x1, y1 }: dove sta già un ponte o un valico
  const libereDa = (x0, y0, x1, y1, m) => finestre.every(f => x1 + m < f.x0 || f.x1 + m < x0 || y1 + m < f.y0 || f.y1 + m < y0)
  const siti = []
  for (const q of passaggi) {
    if (q.tipo !== 'ponte' || q.a_ == null || q.da_ == null) continue
    let a = q.da_, b = q.a_
    const dc = R[b].colonna - R[a].colonna, dr = R[b].riga - R[a].riga
    if (dc && dr) { guasti.push(`il ponte ${q.da}–${q.a} unisce due regioni in diagonale`); continue }
    if (dc < 0 || dr < 0) [a, b] = [b, a]
    const oriz = dr === 0
    const U = oriz ? H : W, V = oriz ? W : H
    const at = oriz ? (u, v) => u * W + v : (u, v) => v * W + u
    const xy = oriz ? (u, v) => [v, u] : (u, v) => [u, v]
    // il confine fra a e b sta fra i loro due centri: lì la prima transizione da a a b; attorno, per sette celle, solo a e b
    const [va, vb0] = oriz ? [centri[a].x, centri[b].x] : [centri[a].y, centri[b].y]
    const trans = u => {
      for (let v = Math.max(6, Math.floor(va)); v < Math.min(V - 6, Math.ceil(vb0)); v++) if (reg[at(u, v - 1)] === a && reg[at(u, v)] === b) return v
      return -1
    }
    const buoni = []
    for (let u0 = 9; u0 < U - 10; u0++) {
      const vs = []; let ok = true
      for (let u = u0 - 3; u < u0 + 5 && ok; u++) {
        const t = trans(u); if (t < 9 || t > V - 10) { ok = false; break }
        for (let v = t - 7; v <= t + 7; v++) { const g = reg[at(u, v)]; if (g !== a && g !== b) { ok = false; break } }
        vs.push(t)
      }
      if (!ok) continue
      const storto = Math.max(...vs) - Math.min(...vs)
      if (storto > 6) continue
      const vb = vs.slice().sort((p, r) => p - r)[4]
      const [xa, ya] = xy(u0 - 5, vb - 7), [xb, yb] = xy(u0 + 6, vb + 7)
      if (!libereDa(Math.min(xa, xb), Math.min(ya, yb), Math.max(xa, xb), Math.max(ya, yb), 1)) continue
      buoni.push({ u: u0, vb, storto })
    }
    if (!buoni.length) { guasti.push(`nessun posto per il ponte fra ${R[a].chiave} e ${R[b].chiave}`); continue }
    // il più dritto, e a pari storto il più vicino al mezzo del tratto di confine buono
    const um = buoni.reduce((n, c) => n + c.u, 0) / buoni.length
    const voto = c => c.storto * 2 + Math.abs(c.u - um) * 0.5
    const s = buoni.reduce((p, c) => (voto(c) < voto(p) ? c : p))
    for (let u = s.u - 3; u < s.u + 5; u++) for (let v = s.vb - 7; v <= s.vb + 7; v++) reg[at(u, v)] = v < s.vb ? a : b
    const [xa, ya] = xy(s.u - 5, s.vb - 7), [xb, yb] = xy(s.u + 6, s.vb + 7)
    finestre.push({ x0: Math.min(xa, xb), y0: Math.min(ya, yb), x1: Math.max(xa, xb), y1: Math.max(ya, yb) })
    siti.push({ q, a, b, oriz, at, xy, u: s.u, vb: s.vb })
  }

  // 2. la distanza dal confine (fino a tre celle) e con chi si confina
  const dist = new Int16Array(N).fill(-1), vicina = new Int16Array(N).fill(-1)
  {
    const coda = []
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const k = id(x, y)
      for (const [dx, dy] of QUATTRO) {
        const a = x + dx, b = y + dy
        if (!dentro(a, b) || reg[id(a, b)] === reg[k]) continue
        dist[k] = 0; vicina[k] = reg[id(a, b)]; coda.push(k); break
      }
    }
    for (let i = 0; i < coda.length; i++) {
      const k = coda[i]; if (dist[k] >= 3) continue
      const x = k % W, y = (k / W) | 0
      for (const [dx, dy] of QUATTRO) {
        const a = x + dx, b = y + dy, nk = id(a, b)
        if (!dentro(a, b) || dist[nk] >= 0 || reg[nk] !== reg[k]) continue
        dist[nk] = dist[k] + 1; vicina[nk] = vicina[k]; coda.push(nk)
      }
    }
  }

  // 3. il terreno: la cornice di roccia, i fiumi (da due a quattro celle), le creste. Ogni cella che tocca un'altra regione è
  // acqua o roccia: fra due regioni non si passa mai se non da un passaggio
  const terreno = new Uint8Array(N)
  const creste = new Map()
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const k = id(x, y)
    let v = ERBA
    if (bordoDi(x, y) < 3 + 4 * rumore(x, y, seme + 77, 7)) v = ROCCIA
    else if (dist[k] >= 0) {
      const t = tipoConfine(reg[k], vicina[k])
      if (t === 'fiume') { if (dist[k] <= (rumore(x, y, seme + 91, 9) > 0.55 ? 1 : 0)) v = ACQUA }
      else if (dist[k] <= (rumore(x, y, seme + 93, 6) > 0.6 ? 2 : 1)) {
        v = ROCCIA
        const g = chiaveCoppia(reg[k], vicina[k])
        if (!creste.has(g)) creste.set(g, []); creste.get(g).push(k)
      }
    }
    terreno[k] = v
  }
  // al ponte il fiume è largo quanto il ponte vuole, e dritto; il piano del ponte sono due file da riva a riva
  const ponte = new Int16Array(N).fill(-1)     // il passaggio di ogni cella del piano di un ponte
  const varco = new Int16Array(N).fill(-1)     // il passaggio di ogni cella aperta di un valico
  for (const s of siti) {
    const largo = LARGO_AL_PONTE[s.q.modello] || 3
    const v0 = s.vb - Math.ceil(largo / 2)
    for (let u = s.u - 2; u < s.u + 4; u++) for (let v = s.vb - 6; v <= s.vb + 6; v++) {
      const k = s.at(u, v)
      if (terreno[k] === ROCCIA && bordoDi(...s.xy(u, v)) < 8) continue
      terreno[k] = v >= v0 && v < v0 + largo ? ACQUA : ERBA
    }
    const celle = [], grata = []
    for (let u = s.u; u < s.u + 2; u++) for (let v = v0 - 1; v <= v0 + largo; v++) {
      const k = s.at(u, v); const [x, y] = s.xy(u, v)
      ponte[k] = s.q.id; celle.push({ x, y })
      if (v === v0 - 1 || v === v0 + largo) terreno[k] = ERBA; else if (s.q.conGrata) grata.push({ x, y })
    }
    const [ax, ay] = s.xy(s.u, v0 - 2), [bx, by] = s.xy(s.u, v0 + largo + 1)
    Object.assign(s.q, { celle, grata, verso: s.oriz ? 'est' : 'sud', largo,
      rive: [{ x: ax, y: ay, regione: R[s.a].chiave }, { x: bx, y: by, regione: R[s.b].chiave }] })
  }
  // i valichi: la cresta si apre in un passaggio largo una casa, vicino al mezzo del confine e lontano da una terza regione
  for (const q of passaggi) {
    if (q.tipo !== 'valico' || q.a_ == null || q.da_ == null) continue
    const a = q.da_, b = q.a_
    const lista = creste.get(chiaveCoppia(a, b))
    if (!lista || !lista.length) { guasti.push(`fra ${q.da} e ${q.a} non c'è una cresta dove aprire il valico`); continue }
    const xm = lista.reduce((n, k) => n + (k % W), 0) / lista.length, ym = lista.reduce((n, k) => n + ((k / W) | 0), 0) / lista.length
    const dx0 = centri[b].x - centri[a].x, dy0 = centri[b].y - centri[a].y, dl = Math.hypot(dx0, dy0) || 1
    const ux = dx0 / dl, uy = dy0 / dl
    let meglio = null, p = Infinity
    for (const k of lista) {
      if (dist[k] !== 0) continue
      const cx = k % W, cy = (k / W) | 0
      if (bordoDi(cx, cy) < 8 || !libereDa(cx - 6, cy - 6, cx + 6, cy + 6, 2)) continue
      let solo = true
      for (let y = cy - 6; y <= cy + 6 && solo; y++) for (let x = cx - 6; x <= cx + 6; x++) { const g = reg[id(x, y)]; if (g !== a && g !== b) { solo = false; break } }
      if (!solo) continue
      const s = Math.hypot(cx - xm, cy - ym)
      if (s < p) { p = s; meglio = k }
    }
    if (meglio == null) { guasti.push(`nessun posto per il valico fra ${q.da} e ${q.a}`); continue }
    const cx = meglio % W, cy = (meglio / W) | 0
    const celle = []
    const apri = (x, y) => {
      const k = id(x, y)
      if (!dentro(x, y) || varco[k] >= 0 || terreno[k] !== ROCCIA || dist[k] < 0 || (reg[k] !== a && reg[k] !== b) || bordoDi(x, y) < 4) return
      terreno[k] = ERBA; varco[k] = q.id; celle.push({ x, y })
    }
    for (let y = cy - 4; y <= cy + 4; y++) for (let x = cx - 4; x <= cx + 4; x++) if (Math.hypot(x - cx, y - cy) <= 2.6) apri(x, y)
    for (let t = -7; t <= 7; t += 0.5) {
      const px = cx + ux * t, py = cy + uy * t
      for (let y = Math.floor(py - 2); y <= py + 2; y++) for (let x = Math.floor(px - 2); x <= px + 2; x++) if (Math.hypot(x + 0.5 - px, y + 0.5 - py) <= 1.7) apri(x, y)
    }
    finestre.push({ x0: cx - 7, y0: cy - 7, x1: cx + 7, y1: cy + 7 })
    const riva = segno => { // la prima cella d'erba fuori dal varco, dalla parte di una regione
      for (let t = 2; t < 14; t += 0.5) {
        const x = Math.round(cx + ux * t * segno), y = Math.round(cy + uy * t * segno), k = id(x, y)
        if (dentro(x, y) && terreno[k] === ERBA && varco[k] < 0 && dist[k] !== 0) return { x, y, regione: R[reg[k]].chiave }
      }
      return null
    }
    Object.assign(q, { celle, grata: q.conGrata ? celle : [], centro: { x: cx, y: cy }, rive: [riva(-1), riva(1)].filter(Boolean) })
    if (q.rive.length < 2) guasti.push(`il valico fra ${q.da} e ${q.a} non ha due rive`)
  }
  // vicino ai passaggi niente spuntoni né pozze: la strada ci deve arrivare
  const presso = new Uint8Array(N)
  {
    const d = new Int16Array(N).fill(-1), q = []
    for (let k = 0; k < N; k++) if (ponte[k] >= 0 || varco[k] >= 0) { d[k] = 0; q.push(k) }
    for (let i = 0; i < q.length; i++) {
      const k = q[i]; presso[k] = 1; if (d[k] >= 7) continue
      const x = k % W, y = (k / W) | 0
      for (const [dx, dy] of QUATTRO) { const nk = id(x + dx, y + dy); if (dentro(x + dx, y + dy) && d[nk] < 0) { d[nk] = d[k] + 1; q.push(nk) } }
    }
  }

  // 4. gli spuntoni di roccia nelle regioni alte (non dove sta una città: le serve spazio), il lago, le pozze della palude
  const habitat = q => HABITAT[q.habitat]
  const conCitta = new Set(CITTA.map(c => c.regione))
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const k = id(x, y), q = R[reg[k]], hb = habitat(q)
    if (terreno[k] !== ERBA || presso[k] || (dist[k] >= 0 && dist[k] < 3)) continue
    if (hb.rocce && !conCitta.has(q.chiave) && rumore(x, y, seme + 300, 7) > hb.rocce) terreno[k] = ROCCIA
    else if (hb.acqua === 'lago') {
      const c = centri[q.i], rr = 6.5 * (0.6 + 0.8 * rumore(x, y, seme + 400, 5))
      if (Math.hypot((x - c.x) * 0.8, y - c.y - 1) < rr) terreno[k] = ACQUA
    } else if (hb.acqua === 'pozze' && dist[k] < 0 && rumore(x, y, seme + 410, 4) > 0.63) terreno[k] = ACQUA
  }

  // 5. di ogni regione si tiene la massa d'erba più grande (la «principale»): un frammento che tocca l'acqua resta un isolotto
  // (si vede, non ci si arriva), gli altri diventano roccia. Ponti e varchi non si toccano
  const principale = new Uint8Array(N), isola = new Uint8Array(N)
  {
    const massa = new Int32Array(N).fill(-1), masse = []
    for (let k0 = 0; k0 < N; k0++) {
      if (terreno[k0] !== ERBA || massa[k0] >= 0 || ponte[k0] >= 0) continue
      const q = [k0]; massa[k0] = masse.length
      for (let i = 0; i < q.length; i++) {
        const k = q[i], x = k % W, y = (k / W) | 0
        for (const [dx, dy] of QUATTRO) {
          const a = x + dx, b = y + dy, nk = id(a, b)
          if (!dentro(a, b) || terreno[nk] !== ERBA || massa[nk] >= 0 || reg[nk] !== reg[k0] || ponte[nk] >= 0) continue
          massa[nk] = masse.length; q.push(nk)
        }
      }
      masse.push({ reg: reg[k0], celle: q })
    }
    for (let i = 0; i < nR; i++) {
      const sue = masse.filter(m => m.reg === i).sort((p, q) => q.celle.length - p.celle.length)
      if (!sue.length) { guasti.push(`la regione ${R[i].chiave} non ha erba`); continue }
      for (const k of sue[0].celle) principale[k] = 1
      for (const m of sue.slice(1)) {
        const tocca = m.celle.some(k => QUATTRO.some(([dx, dy]) => terreno[k + dy * W + dx] === ACQUA))
        for (const k of m.celle) if (varco[k] < 0) { if (tocca) isola[k] = 1; else terreno[k] = ROCCIA }
      }
    }
  }

  // 6. il centro di ogni regione: la cella più dentro (fino a otto dal bordo), vicina al suo centro. È la tana del suo signore
  const interno = new Int16Array(N).fill(-1)
  {
    const q = []
    for (let k = 0; k < N; k++) {
      if (!principale[k]) continue
      const x = k % W, y = (k / W) | 0
      if (QUATTRO.some(([dx, dy]) => !principale[id(x + dx, y + dy)] || reg[id(x + dx, y + dy)] !== reg[k])) { interno[k] = 0; q.push(k) }
    }
    for (let i = 0; i < q.length; i++) {
      const k = q[i], x = k % W, y = (k / W) | 0
      for (const [dx, dy] of QUATTRO) { const nk = id(x + dx, y + dy); if (principale[nk] && reg[nk] === reg[k] && interno[nk] < 0) { interno[nk] = interno[k] + 1; q.push(nk) } }
    }
  }
  const scatola = R.map(() => ({ x0: W, y0: H, x1: 0, y1: 0, celle: 0, area: 0 }))
  for (let k = 0; k < N; k++) {
    const b = scatola[reg[k]], x = k % W, y = (k / W) | 0
    if (principale[k]) b.celle++
    if (principale[k] || (terreno[k] === ACQUA && dist[k] < 0)) b.area++
    b.x0 = Math.min(b.x0, x); b.y0 = Math.min(b.y0, y); b.x1 = Math.max(b.x1, x); b.y1 = Math.max(b.y1, y)
  }
  for (const q of R) {
    let m = -1, p = -Infinity
    const b = scatola[q.i]
    for (let y = b.y0; y <= b.y1; y++) for (let x = b.x0; x <= b.x1; x++) {
      const k = id(x, y); if (reg[k] !== q.i || !principale[k]) continue
      const s = Math.min(interno[k], 8) * 2 - Math.hypot(x - centri[q.i].x, y - centri[q.i].y) * 0.5
      if (s > p) { p = s; m = k }
    }
    q.cx = m % W; q.cy = (m / W) | 0; q.celle = b.celle; q.area = b.area
  }

  // 7. i lotti. Un lotto è un rettangolo d'erba principale della regione, con attorno un anello libero (più largo davanti, a sud)
  const blocco = new Uint8Array(N)     // 1 = occupato (case, botteghe, monumenti, chi sta fermo), 2 = un ingombro del decoro
  const riservato = new Uint8Array(N)  // il decoro non entra (davanti alle porte, le piazze, le tane)
  const strada = new Uint8Array(N)     // 1 sentiero, 2 strada, 3 piazza
  const zonaCitta = new Uint8Array(N)      // 1 + l'indice della città: la zona dei mercanti, senza mostri
  const campo = new Uint8Array(N)
  const libera = k => terreno[k] === ERBA && principale[k] && ponte[k] < 0 && varco[k] < 0 && !blocco[k]
  // `inCitta`: dentro la zona di quella città, e se lì non c'è posto nel resto della sua regione
  function lotto(ri, w, h, punteggio, opz = {}) {
    const l = lottoSolo(ri, w, h, punteggio, opz)
    return l || (opz.inCitta != null ? lottoSolo(ri, w, h, punteggio, { ...opz, inCitta: null, fuoriCitta: false }) : null)
  }
  function lottoSolo(ri, w, h, punteggio, { margine = 1, sud = margine, appoggio = null, senzaStrada = false, inCitta = null, fuoriCitta = true } = {}) {
    let meglio = null, p = -Infinity
    const b = scatola[ri]
    for (let y = Math.max(2, b.y0); y <= Math.min(H - h - 4, b.y1); y++) for (let x = Math.max(2, b.x0); x <= Math.min(W - w - 3, b.x1); x++) {
      if (reg[id(x, y)] !== ri) continue
      let ok = true
      for (let j = -margine; j < h + sud && ok; j++) for (let i = -margine; i < w + margine; i++) {
        const a = x + i, c = y + j, k = id(a, c)
        const nel = i >= 0 && j >= 0 && i < w && j < h
        if (!nel && j < 0 && appoggio) continue
        if (!libera(k) || riservato[k] || reg[k] !== ri) { ok = false; break }
        if ((nel || senzaStrada) && strada[k]) { ok = false; break }
        if (nel && inCitta != null && zonaCitta[k] !== inCitta + 1) { ok = false; break }
        if (nel && inCitta == null && fuoriCitta && zonaCitta[k]) { ok = false; break }
      }
      if (!ok) continue
      const s = punteggio(x, y)
      if (s > p) { p = s; meglio = { x, y } }
    }
    return meglio
  }
  const occupa = (x, y, w, h, v = 1) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) blocco[id(x + i, y + j)] = v }
  const riserva = (x, y, w, h) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (dentro(x + i, y + j)) riservato[id(x + i, y + j)] = 1 }
  const posti = []
  const posa = (tipo, chiave, ri, l, w, h, extra) => {
    const q = { tipo, chiave, regione: R[ri].chiave, x: l.x, y: l.y, w, h, ...extra }
    posti.push(q); return q
  }
  // chi sta fermo: una cella occupata, e accanto (due più giù) dove si ferma l'eroe per parlargli
  const fermo = (tipo, chiave, ri, punteggio, extra = {}, opz = {}) => {
    const l = lotto(ri, 1, 1, punteggio, { margine: 1, sud: 3, ...opz })
    if (!l) { guasti.push(`nessun posto per ${chiave} (${R[ri].chiave})`); return null }
    occupa(l.x, l.y, 1, 1); riserva(l.x - 1, l.y + 1, 3, 2)
    return posa(tipo, chiave, ri, l, 1, 1, { piede: { x: l.x, y: l.y }, accanto: { x: l.x, y: l.y + 2 }, ...extra })
  }
  // le tane: il centro di ogni regione fuori dal villaggio resta libero per il signore della regione (dove c'è una città, la
  // tana si sceglie dopo, fuori dalla città)
  for (const q of R) if (q.anello > 0 && !conCitta.has(q.chiave)) { q.tana = { x: q.cx, y: q.cy }; riserva(q.cx - 3, q.cy - 3, 7, 7) }

  // 7a. le città: la piazza (un tondo di ciottoli), la zona dei mercanti attorno, poi le botteghe, il portale gemello, la pietra
  // del viaggio, la bacheca, il cartello, chi ci sta
  const cittaFatte = []
  const vicinoA = (tx, ty) => (x, y) => -Math.hypot(x - tx, y - ty)
  for (const [ci, C] of CITTA.entries()) {
    const ri = regDi[C.regione]
    if (ri == null) { guasti.push(`la città ${C.chiave} sta in una regione che non c'è`); continue }
    let centro = { x: R[ri].cx, y: R[ri].cy }
    if (C.verso) {
      // all'ingresso della marca: a una dozzina di celle dalla riva del passaggio che la città guarda, dove c'è spazio
      const q = passaggi.find(z => z.nome === C.verso)
      const riva = q && (q.rive || []).find(v => v.regione === C.regione)
      if (!riva) { guasti.push(`la città ${C.chiave} non trova ${C.verso}`); continue }
      let m = null, p = -Infinity
      const b = scatola[ri]
      for (let y = b.y0; y <= b.y1; y++) for (let x = b.x0; x <= b.x1; x++) {
        const k = id(x, y); if (reg[k] !== ri || !principale[k] || interno[k] < 5) continue
        const s = Math.min(interno[k], 9) * 1.5 - Math.abs(Math.hypot(x - riva.x, y - riva.y) - 13) - Math.hypot(x - R[ri].cx, y - R[ri].cy) * 0.05
        if (s > p) { p = s; m = { x, y } }
      }
      if (!m) { guasti.push(`la città ${C.chiave} non ha spazio`); continue }
      centro = m
    }
    let celle = 0
    for (let y = centro.y - C.raggio; y <= centro.y + C.raggio; y++) for (let x = centro.x - C.raggio; x <= centro.x + C.raggio; x++) {
      if (!dentro(x, y)) continue
      const k = id(x, y)
      if (reg[k] === ri && Math.hypot(x - centro.x, y - centro.y) <= C.raggio && (principale[k] || terreno[k] !== ERBA)) { zonaCitta[k] = ci + 1; if (principale[k]) celle++ }
    }
    const rp = C.chiave === 'villaggio' ? 4.6 : 3.6
    for (let y = centro.y - 6; y <= centro.y + 6; y++) for (let x = centro.x - 6; x <= centro.x + 6; x++)
      if (dentro(x, y) && Math.hypot(x + 0.5 - centro.x - 0.5, y + 0.5 - centro.y - 0.5) < rp && libera(id(x, y)) && reg[id(x, y)] === ri) { strada[id(x, y)] = 3; riservato[id(x, y)] = 1 }
    const piazza = { x: centro.x + 0.5, y: centro.y + 0.5, r: rp }
    const pozzo = { x: centro.x - 1, y: centro.y - 1, w: 2, h: 2 }
    occupa(pozzo.x, pozzo.y, 2, 2)
    const scala = C.raggio / 13
    const fatta = { chiave: C.chiave, nome: C.nome, regione: C.regione, centro, raggio: C.raggio, celle, piazza, pozzo, mercanti: [], persone: [] }
    cittaFatte.push(fatta)
    posa('citta', C.chiave, ri, { x: centro.x - C.raggio, y: centro.y - C.raggio }, C.raggio * 2 + 1, C.raggio * 2 + 1,
      { nome: C.nome, piede: { ...centro }, accanto: { x: centro.x, y: centro.y + 2 } })
    // la partenza: nella piazza del villaggio, sotto il pozzo
    if (C.chiave === 'villaggio') fatta.partenza = { x: centro.x, y: centro.y + 2 }
    for (const chiave of C.mercanti) {
      const B = BOTTEGHE[chiave], M = MERCANTI.find(z => z.chiave === chiave)
      if (!B || !M) { guasti.push(`${chiave} non è un mercante`); continue }
      const tx = centro.x + Math.round(B.verso[0] * scala), ty = centro.y + Math.round(B.verso[1] * scala)
      const l = lotto(ri, B.w, B.h, vicinoA(tx, ty), { margine: 1, sud: 3, inCitta: ci })
      if (!l) { guasti.push(`nessun posto per ${M.nome} (${C.nome})`); continue }
      occupa(l.x, l.y, B.w, B.h)
      const cx = l.x + Math.floor(B.w / 2)
      // chi sta dietro il banco sta dentro il lotto; il fabbro e l'incantatrice davanti alla porta
      const piede = B.dietro ? { x: cx, y: l.y } : { x: l.x + B.w - 1, y: l.y + B.h }
      blocco[id(piede.x, piede.y)] = 1
      riserva(l.x - 1, l.y + B.h, B.w + 2, 3)
      const q = posa('mercante', chiave, ri, l, B.w, B.h, { citta: C.chiave, nome: M.nome, em: M.em, sprite: M.sprite,
        ruolo: M.schede.map(s => s.nome).join(', '), bottega: B.bottega, piede, accanto: { x: piede.x, y: l.y + B.h + 2 } })
      fatta.mercanti.push(q)
    }
    // il portale gemello: non è un ostacolo, ma la sua cella resta libera
    {
      const l = lotto(ri, 1, 1, vicinoA(centro.x + Math.round(3 * scala), centro.y + Math.round(2 * scala)), { margine: 1, sud: 3, inCitta: ci })
      if (!l) guasti.push(`nessun posto per il portale (${C.nome})`)
      else { riserva(l.x, l.y, 1, 3); fatta.portale = posa('portale', C.chiave, ri, l, 1, 1, { citta: C.chiave, piede: { ...l }, accanto: { x: l.x, y: l.y + 2 } }) }
    }
    for (const [tipo, [w, h], verso] of [['pietra', LOTTI.pietra, [5, 4]], ['bacheca', LOTTI.bacheca, [4, -5]], ['cartello', LOTTI.cartello, [-4, 4]]]) {
      const l = lotto(ri, w, h, vicinoA(centro.x + Math.round(verso[0] * scala), centro.y + Math.round(verso[1] * scala)), { margine: 1, sud: 3, inCitta: ci })
      if (!l) { guasti.push(`nessun posto per ${tipo} (${C.nome})`); continue }
      occupa(l.x, l.y, w, h); riserva(l.x - 1, l.y + h, w + 2, 2)
      fatta[tipo] = posa(tipo, tipo === 'pietra' ? C.chiave : `${tipo}:${C.chiave}`, ri, l, w, h,
        { citta: C.chiave, piede: { x: l.x + Math.floor(w / 2), y: l.y + h - 1 }, accanto: { x: l.x + Math.floor(w / 2), y: l.y + h + 1 } })
    }
    for (const chi of C.persone) {
      const verso = chi === 'ragazza' ? [2, 0] : [-3, -5]
      const q = fermo('persona', chi, ri, vicinoA(centro.x + verso[0], centro.y + verso[1]), { citta: C.chiave, ...(PERSONE_NUOVE[chi] ? { ...PERSONE_NUOVE[chi], nuovo: true } : {}) }, { inCitta: ci })
      if (q) fatta.persone.push(q)
    }
    if (C.minatore != null) {
      // il vecchio minatore: nel villaggio la sua tenda, verso la strada della prima discesa; al rifugio solo lui
      const prima = R[regDi[DUNGEON[0].regione]]
      const dx = prima.cx - centro.x, dy = prima.cy - centro.y, dl = Math.hypot(dx, dy) || 1
      const tx = centro.x + Math.round(dx / dl * 8 * scala), ty = centro.y + Math.round(dy / dl * 8 * scala)
      if (C.chiave === 'villaggio') {
        const [w, h] = LOTTI.tenda
        const l = lotto(ri, w + 1, h, vicinoA(tx, ty), { margine: 1, sud: 4, inCitta: ci })
        if (!l) guasti.push(`nessun posto per il minatore (${C.nome})`)
        else {
          occupa(l.x, l.y, w, h)
          const piede = { x: l.x + w, y: l.y + h }
          blocco[id(piede.x, piede.y)] = 1; riserva(l.x - 1, l.y + h, w + 3, 4)
          fatta.minatore = posa('minatore', 'minatore', ri, l, w, h, { citta: C.chiave, dalla: C.minatore, tenda: { x: l.x, y: l.y }, piede, accanto: { x: piede.x, y: piede.y + 2 } })
        }
      } else fatta.minatore = fermo('minatore', 'minatore', ri, vicinoA(centro.x - 4, centro.y + 3), { citta: C.chiave, dalla: C.minatore }, { inCitta: ci })
    }
  }
  for (const c of cittaFatte) {
    const q = R[regDi[c.regione]]
    if (!q.anello) continue
    let m = null, p = -Infinity
    const b = scatola[q.i]
    for (let y = b.y0; y <= b.y1; y++) for (let x = b.x0; x <= b.x1; x++) {
      const k = id(x, y)
      if (reg[k] !== q.i || !libera(k) || Math.hypot(x - c.centro.x, y - c.centro.y) < c.raggio + 6) continue
      const s = Math.min(interno[k], 6) * 2 - Math.hypot(x - q.cx, y - q.cy) * 0.2
      if (s > p) { p = s; m = { x, y } }
    }
    if (!m) guasti.push(`nessun posto per la tana del ${q.chiave}`)
    else { q.tana = m; riserva(m.x - 3, m.y - 3, 7, 7) }
  }
  const villaggio = cittaFatte.find(c => c.chiave === 'villaggio')
  const partenza = villaggio ? villaggio.partenza : { x: W >> 1, y: H >> 1 }

  // 7b. gli ingressi dei dungeon, nell'ordine della storia: ognuno nella sua regione, dalla parte lontana dal villaggio, e
  // sempre più lontano (a passi) dalla piazza del dungeon prima
  const tuttoAperto = k => (terreno[k] === ERBA || ponte[k] >= 0) && !blocco[k]
  let passiOra = passiDa(W, H, (x, y) => tuttoAperto(id(x, y)), partenza)
  let prima = -1
  const ingressi = [], pietre = cittaFatte.map(c => c.pietra).filter(Boolean)
  // quanto lontano può stare al più ogni dungeon (la cella più lontana della sua regione), e quindi il tetto di ognuno perché
  // quelli dopo ci stiano ancora più in là
  const piuLontana = DUNGEON.map(D => {
    let m = -1
    for (let k = 0; k < N; k++) if (reg[k] === regDi[D.regione] && principale[k]) m = Math.max(m, passiOra[k])
    return m
  })
  const tetto = DUNGEON.map((_, i) => Math.min(Infinity, ...piuLontana.slice(i + 1).map((m, j) => m - 4 - STACCO * (j + 1))))
  for (const [i, D] of DUNGEON.entries()) {
    const ri = regDi[D.regione]
    if (ri == null) { guasti.push(`${D.chiave} sta in una regione che non c'è`); continue }
    // almeno STACCO passi oltre il dungeon prima, e non molti di più (così la fila non si allunga più del necessario e i dopo
    // hanno ancora spazio), verso il centro della regione: non subito dietro il ponte
    const q = R[ri], basta = prima + STACCO
    let punt = (x, y) => {
      const d = passiOra[id(x + (D.w >> 1), y + D.h + 2)]
      if (d < 0) return -Infinity
      return -Math.abs(d - basta - 4) - Math.hypot(x - q.cx, y - q.cy) * 0.3 - (d < basta ? 500 + basta - d : 0) - (d > tetto[i] ? 100 + d - tetto[i] : 0)
    }
    if (D.appoggio === 'acqua') {
      const base = punt
      punt = (x, y) => { let n = 0; for (let i = 0; i < D.w; i++) for (let j = 1; j <= 2; j++) if (terreno[id(x + i, y - j)] === ACQUA) n++; return base(x, y) + n * 6 - (n ? 0 : 60) }
    }
    const l = lotto(ri, D.w, D.h, punt, { margine: 2, sud: 3, appoggio: D.appoggio })
    if (!l) { guasti.push(`nessun posto per ${D.nome}`); continue }
    occupa(l.x, l.y, D.w, D.h); riserva(l.x - 1, l.y + D.h, D.w + 2, 3)
    if (D.appoggio === 'roccia') {
      // una gobba di roccia dietro: la grotta e la miniera entrano nel monte
      for (let y = l.y - 4; y < l.y; y++) for (let x = l.x - 2; x < l.x + D.w + 2; x++) {
        const k = id(x, y)
        if (!dentro(x, y) || !libera(k) || riservato[k] || strada[k] || zonaCitta[k] || presso[k]) continue
        if (Math.abs(x - (l.x + D.w / 2 - 0.5)) <= D.w / 2 + 1.5 - (l.y - y - 1) * 0.35) terreno[k] = ROCCIA
      }
    }
    const accanto = { x: l.x + (D.w >> 1), y: l.y + D.h + 2 }
    const ing = posa('ingresso', D.chiave, ri, l, D.w, D.h, { indice: D.indice, nome: D.nome, monumento: D.monumento,
      piede: { x: accanto.x, y: l.y + D.h - 1 }, accanto })
    ingressi.push(ing)
    passiOra = passiDa(W, H, (x, y) => tuttoAperto(id(x, y)), partenza)
    // la gobba può chiudere una sacca d'erba contro la roccia: diventa roccia anche lei
    if (D.appoggio === 'roccia') for (let k = 0; k < N; k++) if (reg[k] === ri && principale[k] && !blocco[k] && passiOra[k] < 0) { terreno[k] = ROCCIA; principale[k] = 0 }
    prima = Math.max(prima, passiOra[id(accanto.x, accanto.y)])
    // la pietra del viaggio davanti all'ingresso, a pochi passi
    const pl = lotto(ri, LOTTI.pietra[0], LOTTI.pietra[1], (x, y) => -Math.abs(Math.hypot(x - accanto.x, y - accanto.y) - 5), { margine: 1, sud: 3 })
    if (!pl) guasti.push(`nessun posto per la pietra di ${D.nome}`)
    else {
      occupa(pl.x, pl.y, 2, 2); riserva(pl.x - 1, pl.y + 2, 4, 2)
      pietre.push(posa('pietra', D.chiave, ri, pl, 2, 2, { piede: { x: pl.x + 1, y: pl.y + 1 }, accanto: { x: pl.x + 1, y: pl.y + 3 } }))
    }
  }

  // 7c. il mulino, sulla riva di un fiume della sua valle lontano dai ponti, con la ruota nell'acqua
  let mulino = null
  {
    const ri = regDi.mulino
    let meglio = null, p = -Infinity
    if (ri != null) {
      const b = scatola[ri]
      for (let y = b.y0; y <= b.y1; y++) for (let x = b.x0; x <= b.x1; x++) for (const lato of [-1, 1]) {
        let ok = true
        for (let j = -1; j < 5 && ok; j++) for (let i = 0; i < 3; i++) { const k = id(x + i, y + j); if (!dentro(x + i, y + j) || !libera(k) || riservato[k] || reg[k] !== ri) { ok = false; break } }
        for (let j = -6; j < 9 && ok; j++) for (let i = -6; i < 9; i++) if (dentro(x + i, y + j) && ponte[id(x + i, y + j)] >= 0) { ok = false; break }
        if (!ok) continue
        const cx = lato < 0 ? x - 1 : x + 3
        let n = 0; for (let j = 0; j < 3; j++) if (terreno[id(cx, y + j)] === ACQUA && ponte[id(cx, y + j)] < 0) n++
        if (n < 3) continue
        const s = -Math.hypot(x - R[ri].cx, y - R[ri].cy)
        if (s > p) { p = s; meglio = { x, y, lato } }
      }
    }
    if (meglio) {
      occupa(meglio.x, meglio.y, 3, 3); riserva(meglio.x - 1, meglio.y + 3, 5, 2)
      mulino = posa('mulino', 'mulino', ri, meglio, 3, 3, { lato: meglio.lato, ruota: { x: meglio.lato < 0 ? meglio.x - 0.5 : meglio.x + 3.5, y: meglio.y + 1.5 },
        piede: { x: meglio.x + 1, y: meglio.y + 2 }, accanto: { x: meglio.x + 1, y: meglio.y + 4 } })
    } else guasti.push('nessun posto per il mulino')
  }

  // 7d. chi sta fermo fuori dalle città, a pochi passi dal posto delle sue missioni
  const persone = []
  for (const P of PERSONE) {
    const v = P.vicino === 'mulino' ? mulino : ingressi.find(q => q.chiave === P.vicino)
    if (!v) { guasti.push(`${P.chiave} non trova ${P.vicino}`); continue }
    const ri = regDi[v.regione]
    const q = fermo('persona', P.chiave, ri, (x, y) => -Math.abs(Math.hypot(x - v.accanto.x, y - v.accanto.y) - 6))
    if (q) persone.push(q)
  }

  // 7e. gli antri: da uno a tre per regione, lontani fra loro e dagli altri posti, fuori dalle città
  const antri = []
  for (const q of R) {
    const hb = habitat(q)
    for (let n = 0; n < (q.antri || 0); n++) {
      const [w, h] = LOTTI.antro
      const vicini = posti.filter(z => z.regione === q.chiave && z.tipo !== 'citta')
      const l = lotto(q.i, w, h, (x, y) => {
        const d = Math.min(14, ...vicini.map(z => Math.hypot(z.x - x, z.y - y)), Math.hypot(x - q.cx, y - q.cy) - 2)
        return d + rumore(x, y, seme + 800 + n, 4) * 3
      }, { margine: 1, sud: 3 })
      if (!l) { guasti.push(`nessun posto per un antro (${q.chiave})`); continue }
      occupa(l.x, l.y, w, h); riserva(l.x - 1, l.y + h, w + 2, 2)
      antri.push(posa('antro', `${q.chiave}:${n}`, q.i, l, w, h, { forma: hb.antro, piede: { x: l.x + (w >> 1), y: l.y + h - 1 }, accanto: { x: l.x + (w >> 1), y: l.y + h + 1 } }))
    }
  }

  // 8. le strade: dalla piazza a ogni posto (gli antri no: si trovano), preferendo quelle già tracciate così si uniscono in una
  // rete, lontano dall'acqua; nelle città dalla loro piazza. Ogni passaggio sta su un sentiero
  // il costo di una cella che non è ancora strada, e quanto costa in più stare accanto all'acqua o alla roccia (il terreno
  // ormai non cambia: si conta una volta)
  const vicinoAl = (k, t) => { const x = k % W, y = (k / W) | 0; for (const [dx, dy] of QUATTRO) { const nk = id(x + dx, y + dy); if (dentro(x + dx, y + dy) && terreno[nk] === t && ponte[nk] < 0) return true } return false }
  const costoErba = new Float64Array(N), costoAccanto = new Float64Array(N)
  for (let k = 0; k < N; k++) {
    if (!tuttoAperto(k)) { costoErba[k] = Infinity; continue }
    costoErba[k] = 1 + 0.5 * rumore(k % W, (k / W) | 0, seme + 600, 5)
    costoAccanto[k] = (vicinoAl(k, ACQUA) ? 2 : 0) + (vicinoAl(k, ROCCIA) ? 0.8 : 0)
  }
  const costoStrada = k => (ponte[k] >= 0 ? 0.3 : costoErba[k] === Infinity ? Infinity : (strada[k] ? 0.35 : costoErba[k]) + costoAccanto[k])
  const traccia = (da, meta, livello) => {
    const via = cerca(W, H, costoStrada, da, meta)
    if (!via) { guasti.push(`nessuna strada per ${meta.x},${meta.y}`); return }
    for (const c of via) { const k = id(c.x, c.y); if (strada[k] < livello) strada[k] = livello }
  }
  const passi0 = passiDa(W, H, (x, y) => tuttoAperto(id(x, y)), partenza)
  const mete = []
  for (const c of cittaFatte) if (c !== villaggio) mete.push({ da: partenza, c: { x: c.centro.x, y: c.centro.y + 2 }, l: 2 })
  for (const q of ingressi) mete.push({ da: partenza, c: q.accanto, l: 2 })
  if (mulino) mete.push({ da: partenza, c: mulino.accanto, l: 1 })
  for (const q of persone) mete.push({ da: partenza, c: q.accanto, l: 1 })
  for (const q of pietre) if (!q.citta) mete.push({ da: partenza, c: q.accanto, l: 1 })
  mete.sort((p, q) => passi0[id(p.c.x, p.c.y)] - passi0[id(q.c.x, q.c.y)])
  for (const m of mete) traccia(m.da, m.c, m.l)
  for (const c of cittaFatte) {
    const da = { x: c.centro.x, y: c.centro.y + 2 }
    for (const q of [...c.mercanti, ...c.persone, c.minatore, c.pietra, c.bacheca, c.cartello, c.portale].filter(Boolean)) traccia(da, q.accanto, 2)
  }
  for (const q of passaggi) for (const r of q.rive || []) traccia(partenza, r, 1)
  for (const q of passaggi) for (const c of q.celle || []) strada[id(c.x, c.y)] = Math.max(strada[id(c.x, c.y)], 1)

  // 9. i campi coltivati (recintati) e le case, con la porta verso la strada più vicina
  const distStrada = new Int16Array(N).fill(99)
  {
    const q = []
    for (let k = 0; k < N; k++) if (strada[k]) { distStrada[k] = 0; q.push(k) }
    for (let i = 0; i < q.length; i++) {
      const k = q[i], x = k % W, y = (k / W) | 0
      if (distStrada[k] > 12) continue
      for (const [dx, dy] of QUATTRO) { if (!dentro(x + dx, y + dy)) continue; const nk = id(x + dx, y + dy); if (distStrada[nk] > distStrada[k] + 1) { distStrada[nk] = distStrada[k] + 1; q.push(nk) } }
    }
  }
  const campi = []
  const COLTURE = { campi: ['grano', 'cavoli', 'grano', 'vigna', 'zucche'], frutteto: ['frutteto'], prato: ['grano', 'zucche'], villaggio: ['cavoli', 'grano'] }
  for (const [chiave, quanti] of [['campi', 6], ['frutteto', 3], ['mulino', 2], ['villaggio', 2]]) {
    const ri = regDi[chiave]; if (ri == null) continue
    const colture = COLTURE[R[ri].habitat] || COLTURE.campi
    for (let n = 0; n < quanti; n++) {
      const w = 5 + Math.floor(rnd() * 4), h = 4 + Math.floor(rnd() * 3)
      const ox = rnd() * 18 - 9, oy = rnd() * 14 - 7
      const l = lotto(ri, w, h, (x, y) => -Math.abs(distStrada[id(x, y + h)] - 1.5) * 3 - Math.hypot(x - R[ri].cx - ox, y - R[ri].cy - oy) * 0.4,
        { margine: 1, senzaStrada: true, fuoriCitta: chiave !== 'villaggio' })
      if (!l) continue
      occupa(l.x, l.y, w, h)
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) campo[id(l.x + i, l.y + j)] = 1
      campi.push({ x: l.x, y: l.y, w, h, regione: chiave, coltura: colture[campi.length % colture.length], file: rnd() < 0.5 ? 'x' : 'y' })
    }
  }
  const case_ = []
  const FORME = [[3, 3], [4, 3], [3, 2], [3, 4], [4, 4]]
  const casa = (ri, dmin, dmax, cx, cy, ci) => {
    const [w, h] = FORME[Math.floor(rnd() * FORME.length)]
    const ang = rnd() * Math.PI * 2, rr = dmin + rnd() * (dmax - dmin)
    const tx = cx + Math.cos(ang) * rr, ty = cy + Math.sin(ang) * rr
    const l = lotto(ri, w, h, (x, y) => {
      let dmn = 99
      for (let j = -1; j <= h; j++) for (let i = -1; i <= w; i++) dmn = Math.min(dmn, distStrada[id(x + i, y + j)])
      return -Math.abs(dmn - 1) * 4 - Math.hypot(x - tx, y - ty) * 0.6 - (Math.hypot(x + w / 2 - cx, y + h / 2 - cy) < dmin ? 50 : 0)
    }, { margine: 1, senzaStrada: true, inCitta: ci, fuoriCitta: ci == null })
    if (!l) return
    let verso = 's', md = 99
    const prova = (v, xs, ys) => { for (const x of xs) for (const y of ys) if (dentro(x, y) && distStrada[id(x, y)] < md) { md = distStrada[id(x, y)]; verso = v } }
    prova('s', [l.x + (w >> 1)], [l.y + h, l.y + h + 1]); prova('n', [l.x + (w >> 1)], [l.y - 1, l.y - 2])
    prova('e', [l.x + w, l.x + w + 1], [l.y + (h >> 1)]); prova('o', [l.x - 1, l.x - 2], [l.y + (h >> 1)])
    occupa(l.x, l.y, w, h)
    case_.push({ x: l.x, y: l.y, w, h, verso, regione: R[ri].chiave, seme: Math.floor(rnd() * 1e6) })
  }
  for (const [ci, C] of CITTA.entries()) {
    const c = cittaFatte.find(z => z.chiave === C.chiave); if (!c) continue
    for (let n = 0; n < (C.case || 0); n++) casa(regDi[C.regione], 5, C.raggio, c.centro.x, c.centro.y, ci)
  }
  for (const [chiave, quante] of [['campi', 3], ['mulino', 2], ['frutteto', 2], ['bosco', 1], ['lago', 1]]) {
    const ri = regDi[chiave]; if (ri == null) continue
    for (let n = 0; n < quante; n++) casa(ri, 3, 11, R[ri].cx, R[ri].cy, null)
  }

  // 10. il decoro per habitat: un ingombro (albero, masso, rudere) sta in mezzo all'erba con una cella libera attorno, così non
  // chiude mai una strada; cespugli, fiori e canne non bloccano. Nelle città il decoro del villaggio
  const decoro = []
  const riva = (x, y) => QUATTRO.some(([dx, dy]) => dentro(x + dx, y + dy) && terreno[id(x + dx, y + dy)] === ACQUA)
  const liberaAttorno = (x, y) => {
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { if (!i && !j) continue; const k = id(x + i, y + j); if (!libera(k) || strada[k]) return false }
    return true
  }
  for (const q of R) {
    const celle = []
    const b = scatola[q.i]
    for (let y = b.y0; y <= b.y1; y++) for (let x = b.x0; x <= b.x1; x++) {
      const k = id(x, y)
      if (reg[k] === q.i && libera(k) && !strada[k] && !riservato[k]) celle.push(k)
    }
    const quanti = Math.round(habitat(q).densita * celle.length / 100)
    let messi = 0
    for (let prove = 0; messi < quanti && prove < quanti * 30; prove++) {
      const k = celle[Math.floor(rnd() * celle.length)], x = k % W, y = (k / W) | 0
      if (blocco[k] || strada[k]) continue
      const hb = zonaCitta[k] ? HABITAT.villaggio : habitat(q)
      if (hb.macchie && rumore(x, y, seme + 700, 9) < 0.35 && rnd() < 0.7) continue
      const lista = hb.decoro, tot = lista.reduce((n, d) => n + d[1], 0)
      let t = rnd() * tot, d = lista[lista.length - 1]
      for (const z of lista) if ((t -= z[1]) < 0) { d = z; break }
      const [tipo, , blocca] = d
      if (tipo === 'canne' && !riva(x, y)) continue
      if (blocca) {
        if (!liberaAttorno(x, y) || (riva(x, y) && tipo !== 'salice')) continue
        blocco[k] = 2
      }
      decoro.push({ tipo, x: x + 0.5 + (rnd() - 0.5) * (blocca ? 0.3 : 0.8), y: y + 0.5 + (rnd() - 0.5) * (blocca ? 0.3 : 0.8), s: 0.8 + rnd() * 0.45, r: rnd() * Math.PI * 2, c: rnd(), blocca: !!blocca })
      messi++
    }
  }
  // massi grandi sulle creste e sulla cornice, che fanno la sagoma della montagna
  for (let k = 0; k < N; k++) {
    if (terreno[k] !== ROCCIA) continue
    const x = k % W, y = (k / W) | 0
    if (rnd() < 0.12) decoro.push({ tipo: 'rupe', x: x + rnd(), y: y + rnd(), s: 0.9 + rnd() * 1.4, r: rnd() * Math.PI * 2, c: rnd(), blocca: false })
  }

  // 11. la quota: base dolce per habitat, la roccia alta (più alta quanto più è dentro), l'acqua bassa; poi si ammorbidisce, le
  // rive restano sopra il pelo dell'acqua, i lotti si spianano, i ponti stanno alla quota della riva più alta
  const quota = new Float32Array(N)
  {
    const nel = { [ROCCIA]: new Int16Array(N), [ACQUA]: new Int16Array(N) }
    for (const t of [ROCCIA, ACQUA]) {
      const arr = nel[t], q = []
      for (let k = 0; k < N; k++) if (terreno[k] === t) { const x = k % W, y = (k / W) | 0; if (QUATTRO.some(([dx, dy]) => dentro(x + dx, y + dy) && terreno[id(x + dx, y + dy)] !== t)) { arr[k] = 1; q.push(k) } }
      for (let i = 0; i < q.length; i++) {
        const k = q[i], x = k % W, y = (k / W) | 0
        for (const [dx, dy] of QUATTRO) { if (!dentro(x + dx, y + dy)) continue; const nk = id(x + dx, y + dy); if (terreno[nk] === t && !arr[nk]) { arr[nk] = arr[k] + 1; q.push(nk) } }
      }
    }
    const grezza = new Float32Array(N)
    for (let k = 0; k < N; k++) {
      const x = k % W, y = (k / W) | 0
      const base = (fbm(x, y, seme + 500, 22) - 0.5) * 1.1 + habitat(R[reg[k]]).quota
      if (terreno[k] === ROCCIA) { const b = bordoDi(x, y); grezza[k] = base + 0.9 + Math.min(nel[ROCCIA][k], 6) * 0.7 + fbm(x, y, seme + 510, 5) * 1.6 + (b < 4 ? (4 - b) * 0.9 : 0) }
      else if (terreno[k] === ACQUA) grezza[k] = LIVELLO_ACQUA - 0.35 - Math.min(nel[ACQUA][k], 4) * 0.22
      else grezza[k] = Math.max(base, LIVELLO_ACQUA + 0.2)
    }
    let q2 = grezza
    for (let passata = 0; passata < 2; passata++) {
      const o = new Float32Array(N)
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        let s = 0, n = 0
        for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) if (dentro(x + i, y + j)) { s += q2[id(x + i, y + j)]; n++ }
        o[id(x, y)] = s / n
      }
      q2 = o
    }
    for (let k = 0; k < N; k++) {
      const t = terreno[k]
      quota[k] = t === ROCCIA ? Math.max(q2[k], grezza[k] * 0.85) : t === ACQUA ? Math.min(q2[k], LIVELLO_ACQUA - 0.18)
        : Math.max(q2[k], LIVELLO_ACQUA + (riva(k % W, (k / W) | 0) ? 0.07 : 0.14))
    }
    const spiana = (x, y, w, h) => {
      let s = 0, n = 0
      for (let j = -1; j <= h; j++) for (let i = -1; i <= w; i++) if (dentro(x + i, y + j) && terreno[id(x + i, y + j)] === ERBA) { s += quota[id(x + i, y + j)]; n++ }
      if (!n) return
      const m = s / n
      for (let j = -1; j <= h; j++) for (let i = -1; i <= w; i++) if (dentro(x + i, y + j) && terreno[id(x + i, y + j)] === ERBA)
        quota[id(x + i, y + j)] = (i < 0 || j < 0 || i === w || j === h) ? (quota[id(x + i, y + j)] + m) / 2 : m
    }
    for (const c of cittaFatte) spiana(c.centro.x - 5, c.centro.y - 5, 11, 11)
    for (const z of [...posti.filter(q => q.tipo !== 'citta'), ...case_, ...campi]) spiana(z.x, z.y, z.w, z.h)
    for (const q of passaggi) {
      if (q.tipo !== 'ponte' || !q.celle) continue
      const rive = q.celle.filter(c => terreno[id(c.x, c.y)] === ERBA)
      q.quota = Math.max(LIVELLO_ACQUA + 0.3, ...rive.map(c => quota[id(c.x, c.y)])) + 0.08
      for (const c of rive) quota[id(c.x, c.y)] = q.quota - 0.05
      q.arco = q.modello === 'arco' ? 0.45 : q.modello === 'travi' ? 0.12 : 0.05
    }
  }

  // 12. i guasti. Si cammina sull'erba principale e sui ponti; un passaggio chiuso ha la grata calata (le sue celle non si passano)
  const chiusa = new Uint8Array(N)
  const calpestabileCon = aperto => {
    chiusa.fill(0)
    for (const q of passaggi) if (!aperto(q)) for (const c of q.grata || []) chiusa[id(c.x, c.y)] = 1
    const ch = chiusa.slice()
    return (x, y) => { const k = id(x, y); return (terreno[k] === ERBA || ponte[k] >= 0) && !blocco[k] && !ch[k] }
  }
  const passi = passiDa(W, H, calpestabileCon(() => true), partenza)
  const qui = c => c && passi[id(c.x, c.y)] >= 0
  for (const z of posti) if (!qui(z.accanto)) guasti.push(`non si arriva a ${z.tipo} ${z.chiave} (${z.accanto.x},${z.accanto.y})`)
  // chi sta fermo non chiude la strada a nessuno: togliendolo si arriva in più solo dove sta lui
  {
    const fermi = new Set(posti.filter(z => ['persona', 'mercante', 'minatore'].includes(z.tipo)).map(z => id(z.piede.x, z.piede.y)))
    const base = calpestabileCon(() => true)
    const senza = passiDa(W, H, (x, y) => base(x, y) || fermi.has(id(x, y)), partenza)
    for (let k = 0; k < N; k++) if (senza[k] >= 0 && passi[k] < 0 && !fermi.has(k)) { guasti.push(`chi sta fermo chiude la strada a ${k % W},${(k / W) | 0}`); break }
  }
  // di ogni regione: quanta erba principale libera si raggiunge, e a quanti passi sta la sua metà (la mediana)
  const sue = R.map(() => [])
  for (let k = 0; k < N; k++) if (principale[k] && !blocco[k]) sue[reg[k]].push(passi[k])
  for (const q of R) {
    const l = sue[q.i].filter(v => v >= 0).sort((a, b) => a - b)
    q.passi = l.length ? l[l.length >> 1] : -1
    if (l.length < sue[q.i].length * 0.95) guasti.push(`della regione ${q.chiave} si raggiunge solo il ${Math.round(100 * l.length / (sue[q.i].length || 1))}%`)
  }
  for (const q of R) if (q.area < 300) guasti.push(`la regione ${q.chiave} ha ${q.area} celle: è un angolo, non una regione`)
  for (const q of passaggi) if (!q.rive || q.rive.length < 2 || !q.rive.every(qui)) guasti.push(`il passaggio ${q.da}–${q.a} non porta da una riva all'altra`)
  // a ogni punto della storia si arriva solo dove i passaggi aperti portano: né una regione in meno, né una in più
  const grafo = R.map(() => [])
  for (const q of passaggi) if (q.a_ != null && q.da_ != null) { grafo[q.da_].push({ verso: q.a_, q }); grafo[q.a_].push({ verso: q.da_, q }) }
  const attese = finite => {
    const visto = new Set([regDi.villaggio]), coda = [regDi.villaggio]
    while (coda.length) { const r0 = coda.shift(); for (const e of grafo[r0]) if (e.q.apre <= finite && !visto.has(e.verso)) { visto.add(e.verso); coda.push(e.verso) } }
    return visto
  }
  const tappe = [...new Set([0, ...passaggi.map(q => q.apre)])].sort((a, b) => a - b)
  const perTappa = {}
  for (const f of tappe) {
    const d = passiDa(W, H, calpestabileCon(q => q.apre <= f), partenza)
    const viste = new Set()
    for (let k = 0; k < N; k++) if (d[k] >= 0) viste.add(reg[k])
    const vuole = attese(f)
    for (const r0 of viste) if (!vuole.has(r0)) guasti.push(`con ${f} discese finite si arriva a ${R[r0].chiave} senza passare da un passaggio aperto`)
    for (const r0 of vuole) if (!viste.has(r0)) guasti.push(`con ${f} discese finite non si arriva a ${R[r0].chiave}`)
    perTappa[f] = [...vuole].map(i => R[i].chiave)
  }
  // le distanze: i dungeon in fila, gli anelli che si allontanano
  const passiA = c => passi[id(c.x, c.y)]
  const fila = ingressi.map(q => ({ chiave: q.chiave, passi: passiA(q.accanto) }))
  for (let i = 1; i < fila.length; i++) if (!(fila[i].passi >= fila[i - 1].passi + 2))
    guasti.push(`${fila[i].chiave} (${fila[i].passi} passi) non è più lontano di ${fila[i - 1].chiave} (${fila[i - 1].passi})`)
  const anelli = [1, 2].map(a => R.filter(q => q.anello === a).map(q => q.passi))
  const media = l => Math.round(l.reduce((n, v) => n + v, 0) / (l.length || 1))
  const distanze = { dungeon: fila, anello1: { min: Math.min(...anelli[0]), media: media(anelli[0]), max: Math.max(...anelli[0]) },
    anello2: { min: Math.min(...anelli[1]), media: media(anelli[1]), max: Math.max(...anelli[1]) } }
  if (!(distanze.anello2.media > distanze.anello1.media * 1.6)) guasti.push(`l'anello 2 (${distanze.anello2.media} passi) non sta abbastanza più in là dell'anello 1 (${distanze.anello1.media})`)
  // passando un confine fra anelli ci si allontana: la regione di fuori sta più in là di quella di dentro
  for (const q of passaggi) {
    const [A, B] = [R[regDi[q.da]], R[regDi[q.a]]].sort((x, y) => x.anello - y.anello)
    if (A.anello !== B.anello && !(B.passi > A.passi))
      guasti.push(`passando da ${A.chiave} a ${B.chiave} (anello ${B.anello}) non ci si allontana`)
  }
  // i posti non si pestano: ognuno ha il suo lotto, e nessuno si ferma sul lotto di un altro
  const dove = new Int16Array(N).fill(-1)
  posti.forEach((z, i) => {
    if (z.tipo === 'citta' || z.tipo === 'portale') return
    for (let j = 0; j < z.h; j++) for (let k = 0; k < z.w; k++) { const c = id(z.x + k, z.y + j); if (dove[c] >= 0) guasti.push(`${z.tipo} ${z.chiave} sta sopra ${posti[dove[c]].tipo} ${posti[dove[c]].chiave}`); dove[c] = i }
  })
  for (const z of posti) if (z.tipo !== 'citta' && dove[id(z.accanto.x, z.accanto.y)] >= 0) guasti.push(`chi va da ${z.tipo} ${z.chiave} si ferma sopra un altro posto`)
  for (const c of cittaFatte) if (c.celle < Math.PI * c.raggio * c.raggio * 0.6) guasti.push(`la città ${c.chiave} ha poco spazio (${c.celle} celle)`)

  // la firma: cambia se cambia una cella o un posto
  let f = 0x811c9dc5
  const mescola = v => { f ^= v & 0xff; f = Math.imul(f, 16777619) >>> 0 }
  for (let k = 0; k < N; k++) { mescola(terreno[k]); mescola(reg[k]); mescola(ponte[k] + 1); mescola(varco[k] + 1); mescola(strada[k]); mescola(blocco[k]) }
  for (const z of posti) for (const ch of `${z.tipo}${z.chiave}${z.x},${z.y},${z.accanto.x},${z.accanto.y}`) mescola(ch.charCodeAt(0))
  const firma = f.toString(16).padStart(8, '0')

  for (const q of passaggi) { delete q.a_; delete q.da_ }
  const regioni = R.map(q => ({ chiave: q.chiave, nome: q.nome, colonna: q.colonna, riga: q.riga, anello: q.anello, marca: q.marca,
    habitat: q.habitat, livello: q.livello, fascia: q.fascia, dif: q.dif, abitanti: q.abitanti || null, caporale: q.caporale || null,
    cx: q.cx, cy: q.cy, celle: q.celle, area: q.area, passi: q.passi, tana: q.tana || null,
    dungeon: (DUNGEON.find(d => d.regione === q.chiave) || {}).chiave || null }))
  return {
    W, H, seme, firma, ms: Date.now() - t0,
    terreno, reg, ponte, varco, strada, blocco, riservato, zonaCitta, campo, isola, quota,
    regioni, passaggi, marche: MARCHE, citta: cittaFatte, posti, ingressi, pietre, antri, persone, mulino, partenza,
    case: case_, campi, decoro, passi, distanze, perTappa, guasti,
    calpestabileCon, id,
  }
}

// la maschera del mondo per motore/terra.js (`creaTerra`): una riga per fila, `.` si cammina e `#` no, con i passaggi aperti
// per chi ha finito `finite` discese (`aperto(passaggio)` decide)
export function mascheraDelMondo(m, aperto = () => true) {
  const libera = m.calpestabileCon(aperto)
  const righe = []
  for (let y = 0; y < m.H; y++) { let s = ''; for (let x = 0; x < m.W; x++) s += libera(x, y) ? '.' : '#'; righe.push(s) }
  return righe
}
