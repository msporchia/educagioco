// Il mondo di sopra generato: regioni, fiumi, ponti, creste coi valichi, il lago, il villaggio coi mercanti, gli ingressi
// delle discese, le strade, i campi, le case, il decoro per habitat, e l'altezza del terreno. Da un seme fisso: la mappa
// si impara. Il cuore (regioni dal centro più vicino col rumore, fiumi e creste dalla distanza dal confine, valichi, masse)
// è quello di terre-selvagge (motore/aperta.js, ramo non unito), copiato e adattato: qui le regioni hanno un RUOLO, i ponti
// sono modellati (non moduli dipinti) e il terreno ha una quota. Puro, gira in Node: `node poc/mondo-sopra/pianta.mjs`.
import { caso, rumore, fbm } from './caso.js'
import { cerca, raggiungibili } from './strada.js'

export const ERBA = 0, ACQUA = 1, ROCCIA = 2
export const LIVELLO_ACQUA = -0.25

export const MAPPA = { seme: 7, largo: 112, alto: 88, griglia: [3, 3] }

// le regioni: (colonna, riga) nella griglia 3×3, la riga 0 in basso (verso chi guarda). `quota`: quanto è alta di base;
// `rocce`: quanto la bucano gli spuntoni (0 niente); `densita`: alberi e sassi ogni cento celle
export const REGIONI = [
  { chiave: 'villaggio', nome: 'Il villaggio', colonna: 1, riga: 1, habitat: 'villaggio', quota: 0.1, rocce: 0, densita: 1.6 },
  { chiave: 'campi', nome: 'I campi', colonna: 0, riga: 1, habitat: 'campi', quota: 0.05, rocce: 0, densita: 1.8 },
  { chiave: 'minatore', nome: 'Il campo del minatore', colonna: 2, riga: 1, habitat: 'colline', quota: 0.5, rocce: 0.72, densita: 4 },
  { chiave: 'bosco', nome: 'Il bosco', colonna: 0, riga: 0, habitat: 'bosco', quota: 0.2, rocce: 0, densita: 13 },
  { chiave: 'lago', nome: 'Il lago', colonna: 1, riga: 0, habitat: 'lago', quota: -0.05, rocce: 0, densita: 3 },
  { chiave: 'soglia', nome: 'La soglia selvaggia', colonna: 2, riga: 0, habitat: 'prateria', quota: 0.3, rocce: 0.8, densita: 4.5 },
  { chiave: 'rovine', nome: 'Le rovine', colonna: 0, riga: 2, habitat: 'rovine', quota: 0.5, rocce: 0.78, densita: 5 },
  { chiave: 'monte', nome: 'Il monte', colonna: 1, riga: 2, habitat: 'monte', quota: 1.1, rocce: 0.64, densita: 4 },
  { chiave: 'landa', nome: 'La landa vecchia', colonna: 2, riga: 2, habitat: 'landa', quota: 0.6, rocce: 0.74, densita: 4 },
]
// fra le colonne c'è sempre un fiume (coi ponti, uno per riga); fra le righe una cresta di roccia coi valichi, o niente
const CONFINE_RIGHE = { 0: 'aperto', 1: 'cresta' }   // la riga più bassa delle due → il tipo
const PONTE_DELLA_RIGA = ['travi', 'arco', 'passerella']
const LARGO_AL_PONTE = { arco: 4, travi: 3, passerella: 2 }

// gli ingressi: uno per discesa, più l'abisso e la zona selvaggia; i nomi sono quelli di dati/campagna.js e dati/terra.js
export const POSTI = [
  { chiave: 'torre', discesa: 'La torre in rovina', regione: 'campi', monumento: 'torre', w: 3, h: 3, verso: [0, -9] },
  { chiave: 'altare', discesa: 'La cripta dell\'altare', regione: 'campi', monumento: 'altare', w: 3, h: 2, verso: [-4, 8] },
  { chiave: 'arco', discesa: 'La scalinata antica', regione: 'bosco', monumento: 'arco', w: 3, h: 2, verso: [-4, 2] },
  { chiave: 'buco', discesa: 'La grotta della scaletta', regione: 'minatore', monumento: 'grotta', w: 4, h: 2, verso: [7, -5], appoggio: 'roccia' },
  { chiave: 'stagno', discesa: 'La scala sommersa', regione: 'lago', monumento: 'stagno', w: 3, h: 2, verso: [0, 0], appoggio: 'acqua' },
  { chiave: 'botola', discesa: 'La botola segreta', regione: 'rovine', monumento: 'botola', w: 2, h: 2, verso: [0, -3] },
  { chiave: 'miniera', discesa: 'La miniera abbandonata', regione: 'monte', monumento: 'miniera', w: 4, h: 2, verso: [0, -4], appoggio: 'roccia' },
  { chiave: 'pozzo-vecchio', discesa: 'L\'abisso', regione: 'landa', monumento: 'pozzo', w: 2, h: 2, verso: [5, -3] },
  { chiave: 'selvagge', discesa: 'Le terre selvagge', regione: 'soglia', monumento: 'cancello', w: 1, h: 3, verso: [60, 0] },
]
// i mercanti del villaggio (dati/mercanti.js): dove stanno rispetto al centro della piazza, e che bottega hanno
export const MERCANTI = [
  { chiave: 'rigattiere', nome: 'Il mercante', ruolo: 'gioielli, e compra quello che non ti serve', sprite: 'rigattiere', bottega: 'bancarella', w: 3, h: 2, verso: [-1, -7] },
  { chiave: 'erborista', nome: 'La guaritrice', ruolo: 'pozioni e torce', sprite: 'erborista', bottega: 'erbe', w: 3, h: 2, verso: [-9, -1] },
  { chiave: 'armaiolo', nome: 'Il fabbro', ruolo: 'armi, scudi e corazze', sprite: 'armaiolo', bottega: 'fucina', w: 4, h: 3, verso: [6, -3] },
  { chiave: 'incantatrice', nome: 'L\'incantatrice', ruolo: 'bacchette, vesti ed energia', sprite: 'incantatrice', bottega: 'torretta', w: 3, h: 3, verso: [-7, 5] },
]

const QUATTRO = [[1, 0], [-1, 0], [0, 1], [0, -1]]

export function generaMondo (seme = MAPPA.seme) {
  const W = MAPPA.largo, H = MAPPA.alto, N = W * H
  const rnd = caso(seme * 7919 + 17)
  const id = (x, y) => y * W + x
  const dentro = (x, y) => x >= 0 && y >= 0 && x < W && y < H
  const guasti = []
  const R = REGIONI.map(r => ({ ...r }))
  const nR = R.length
  const regDi = Object.fromEntries(R.map((r, i) => [r.chiave, i]))
  const [colonne, righe] = MAPPA.griglia

  // 1. le regioni: il centro più vicino, con un rumore a macchie larghe che storce i confini (fiumi che serpeggiano)
  const cw = W / colonne, ch = H / righe
  const centri = R.map(r => ({ x: (r.colonna + 0.5) * cw + (rnd() - 0.5) * cw * 0.25, y: (righe - 1 - r.riga + 0.5) * ch + (rnd() - 0.5) * ch * 0.25 }))
  const reg = new Int16Array(N)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    let meglio = 0, quanto = Infinity
    for (let i = 0; i < nR; i++) {
      const d = Math.hypot(x - centri[i].x, y - centri[i].y) + 22 * (rumore(x, y, seme + i * 31, 20) - 0.5) + 7 * (rumore(x, y, seme + i * 57, 7) - 0.5)
      if (d < quanto) { quanto = d; meglio = i }
    }
    reg[id(x, y)] = meglio
  }
  const tipoConfine = (a, b) => {
    const A = R[a], B = R[b]
    if (A.colonna !== B.colonna) return 'fiume'
    return CONFINE_RIGHE[Math.min(A.riga, B.riga)] || 'aperto'
  }

  // 1 bis. i ponti: per ogni coppia di regioni affiancate nella stessa riga si cerca dove il confine è quasi dritto per dieci
  // righe, lontano da una terza regione, e lo si raddrizza: lì il fiume passa dritto e il ponte lo attraversa da riva a riva
  const siti = []
  for (let riga = 0; riga < righe; riga++) for (let col = 0; col < colonne - 1; col++) {
    const a = R.findIndex(r => r.colonna === col && r.riga === riga), b = R.findIndex(r => r.colonna === col + 1 && r.riga === riga)
    const trans = y => { let tr = -1, n = 0; for (let x = 4; x < W - 4; x++) { const p = reg[id(x - 1, y)], q = reg[id(x, y)]; if (p === a && q === b) { tr = x; n++ } else if (p === b && q === a) n += 2 } return n === 1 ? tr : -1 }
    const buoni = []
    for (let y0 = 8; y0 < H - 14; y0++) {
      const xs = []; let ok = true
      for (let y = y0 - 4; y < y0 + 6 && ok; y++) {
        const t = trans(y); if (t < 0) { ok = false; break }
        for (let x = t - 8; x <= t + 8; x++) { const v = reg[id(x, y)]; if (v !== a && v !== b) { ok = false; break } }
        xs.push(t)
      }
      if (ok && Math.max(...xs) - Math.min(...xs) <= 4) buoni.push({ y: y0, xb: xs.slice().sort((p, q) => p - q)[5] })
    }
    if (!buoni.length) { guasti.push(`nessun posto per il ponte fra ${R[a].chiave} e ${R[b].chiave}`); continue }
    const ym = buoni.reduce((n, c) => n + c.y, 0) / buoni.length
    const s = buoni.reduce((q, c) => (Math.abs(c.y - ym) < Math.abs(q.y - ym) ? c : q))
    for (let y = s.y - 4; y < s.y + 6; y++) for (let x = s.xb - 8; x <= s.xb + 8; x++) reg[id(x, y)] = x < s.xb ? a : b
    siti.push({ a, b, ym: s.y, xb: s.xb, tipo: PONTE_DELLA_RIGA[riga] })
  }

  // 2. la distanza dal confine (fino a tre celle) e con chi si confina
  const dist = new Int16Array(N).fill(-1), vicina = new Int16Array(N).fill(-1)
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

  // 3. il terreno: la cornice di roccia, i fiumi (da due a quattro celle) fra le colonne, le creste fra certe righe
  const terreno = new Uint8Array(N)
  const creste = new Map()
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const k = id(x, y)
    const bordo = Math.min(x, y, W - 1 - x, H - 1 - y)
    let v = ERBA
    if (bordo < 3 + 4 * rumore(x, y, seme + 77, 7)) v = ROCCIA
    else if (dist[k] >= 0) {
      const t = tipoConfine(reg[k], vicina[k])
      if (t === 'fiume') { if (dist[k] <= (rumore(x, y, seme + 91, 9) > 0.55 ? 1 : 0)) v = ACQUA }
      else if (t === 'cresta' && dist[k] <= (rumore(x, y, seme + 93, 6) > 0.6 ? 2 : 1)) {
        v = ROCCIA
        const g = Math.min(reg[k], vicina[k]) + ',' + Math.max(reg[k], vicina[k])
        if (!creste.has(g)) creste.set(g, []); creste.get(g).push(k)
      }
    }
    terreno[k] = v
  }
  // al ponte il fiume è largo quanto il ponte vuole, e dritto
  for (const s of siti) {
    const largo = LARGO_AL_PONTE[s.tipo]
    const x0 = s.xb - Math.ceil(largo / 2)
    for (let y = s.ym - 2; y < s.ym + 4; y++) for (let x = s.xb - 6; x <= s.xb + 6; x++) {
      const k = id(x, y)
      if (terreno[k] === ROCCIA) continue
      terreno[k] = x >= x0 && x < x0 + largo ? ACQUA : ERBA
    }
    s.x0 = x0 - 1; s.x1 = x0 + largo   // le due rive: da qui a qui si cammina sul ponte
  }
  // i valichi: due passaggi larghi nella cresta, uno vicino al mezzo e uno lontano
  for (const lista of creste.values()) {
    const xm = lista.reduce((n, k) => n + (k % W), 0) / lista.length, ym = lista.reduce((n, k) => n + ((k / W) | 0), 0) / lista.length
    const d = (k, x, y) => Math.hypot((k % W) - x, ((k / W) | 0) - y)
    const primo = lista.slice().sort((p, q) => d(p, xm, ym) - d(q, xm, ym))[0]
    const secondo = lista.filter(k => d(k, primo % W, (primo / W) | 0) >= 15 && Math.min(k % W, W - 1 - (k % W)) > 10)
      .sort((p, q) => rumore(p % W, (p / W) | 0, seme + 5, 3) - rumore(q % W, (q / W) | 0, seme + 5, 3))[0]
    for (const k of [primo, secondo]) {
      if (k == null) continue
      const cx = k % W, cy = (k / W) | 0
      for (let y = cy - 4; y <= cy + 4; y++) for (let x = cx - 4; x <= cx + 4; x++)
        if (Math.hypot(x - cx, y - cy) <= 3.4 && x > 3 && y > 3 && x < W - 4 && y < H - 4 && terreno[id(x, y)] === ROCCIA && dist[id(x, y)] >= 0) terreno[id(x, y)] = ERBA
    }
  }
  // gli spuntoni di roccia dentro le regioni alte (monte, colline, landa, rovine, la soglia)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const k = id(x, y), r = R[reg[k]]
    if (!r.rocce || terreno[k] !== ERBA || (dist[k] >= 0 && dist[k] < 3)) continue
    if (rumore(x, y, seme + 300, 7) > r.rocce) terreno[k] = ROCCIA
  }
  // il lago: una macchia d'acqua nella sua regione, lontana dai bordi
  {
    const i = regDi.lago, c = centri[i]
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const k = id(x, y)
      if (reg[k] !== i || (dist[k] >= 0 && dist[k] < 3) || terreno[k] !== ERBA) continue
      const r = 7.5 * (0.6 + 0.8 * rumore(x, y, seme + 400, 5))
      if (Math.hypot((x - c.x) * 0.8, y - c.y - 1) < r) terreno[k] = ACQUA
    }
  }

  // 4. di ogni regione si tiene la massa d'erba più grande; i frammenti piccoli tagliati via diventano roccia
  const massa = new Int32Array(N).fill(-1)
  const masse = []
  for (let k0 = 0; k0 < N; k0++) {
    if (terreno[k0] !== ERBA || massa[k0] >= 0) continue
    const q = [k0]; massa[k0] = masse.length
    for (let i = 0; i < q.length; i++) {
      const k = q[i], x = k % W, y = (k / W) | 0
      for (const [dx, dy] of QUATTRO) {
        const a = x + dx, b = y + dy, nk = id(a, b)
        if (!dentro(a, b) || terreno[nk] !== ERBA || massa[nk] >= 0 || reg[nk] !== reg[k0]) continue
        massa[nk] = masse.length; q.push(nk)
      }
    }
    masse.push({ reg: reg[k0], celle: q })
  }
  for (let r = 0; r < nR; r++) {
    const sue = masse.filter(m => m.reg === r).sort((p, q) => q.celle.length - p.celle.length)
    // un frammento che tocca l'acqua resta un isolotto d'erba (non ci si arriva, ma si vede); gli altri diventano roccia
    for (const m of sue.slice(1)) if (m.celle.length < 40) {
      const isola = m.celle.some(k => QUATTRO.some(([dx, dy]) => terreno[k + dy * W + dx] === ACQUA))
      if (!isola) for (const k of m.celle) terreno[k] = ROCCIA
    }
  }

  // 5. i ponti: due righe di piano da riva a riva
  const ponte = new Int16Array(N).fill(-1)
  const ponti = siti.map((s, i) => {
    for (let y = s.ym; y < s.ym + 2; y++) for (let x = s.x0; x <= s.x1; x++) { ponte[id(x, y)] = i; if (x === s.x0 || x === s.x1) terreno[id(x, y)] = ERBA }
    return { id: i, tipo: s.tipo, x0: s.x0, x1: s.x1, y0: s.ym, y1: s.ym + 1, da: R[s.a].chiave, a: R[s.b].chiave }
  })

  // 6. il centro di ogni regione: la cella più lontana dai bordi, vicina al suo centro
  const interno = new Int16Array(N).fill(-1)
  {
    const q = []
    for (let k = 0; k < N; k++) {
      if (terreno[k] !== ERBA) continue
      const x = k % W, y = (k / W) | 0
      if (QUATTRO.some(([dx, dy]) => !dentro(x + dx, y + dy) || terreno[id(x + dx, y + dy)] !== ERBA || reg[id(x + dx, y + dy)] !== reg[k])) { interno[k] = 0; q.push(k) }
    }
    for (let i = 0; i < q.length; i++) {
      const k = q[i], x = k % W, y = (k / W) | 0
      for (const [dx, dy] of QUATTRO) { const nk = id(x + dx, y + dy); if (terreno[nk] === ERBA && reg[nk] === reg[k] && interno[nk] < 0) { interno[nk] = interno[k] + 1; q.push(nk) } }
    }
  }
  for (let i = 0; i < nR; i++) {
    let m = null, p = -Infinity
    for (let k = 0; k < N; k++) {
      if (reg[k] !== i || terreno[k] !== ERBA) continue
      const s = Math.min(interno[k], 8) * 2 - Math.hypot(k % W - centri[i].x, ((k / W) | 0) - centri[i].y) * 0.5
      if (s > p) { p = s; m = k }
    }
    R[i].cx = m % W; R[i].cy = (m / W) | 0
  }

  // 7. i lotti: chi occupa che cosa. Un lotto è un rettangolo d'erba della regione, con attorno un anello libero
  const blocco = new Uint8Array(N)     // 1 = occupato (case, botteghe, monumenti, alberi, campi)
  const riservato = new Uint8Array(N)  // il decoro non entra (davanti alle porte, la piazza)
  const fuori = new Uint8Array(N)      // si vede ma non si cammina (la strada oltre il cancello)
  const strada = new Uint8Array(N)     // 1 sentiero, 2 strada, 3 piazza
  const campo = new Uint8Array(N)
  const erbaLibera = (x, y) => dentro(x, y) && terreno[id(x, y)] === ERBA && ponte[id(x, y)] < 0 && !blocco[id(x, y)] && !fuori[id(x, y)]
  function lotto (regione, w, h, punteggio, { margine = 1, sud = margine, appoggio = null, senzaStrada = false } = {}) {
    let meglio = null, p = -Infinity
    for (let y = 1; y < H - h - 1; y++) for (let x = 1; x < W - w - 1; x++) {
      if (reg[id(x, y)] !== regione) continue
      let ok = true
      for (let j = -margine; j < h + sud && ok; j++) for (let i = -margine; i < w + margine; i++) {
        const a = x + i, b = y + j
        const nel = i >= 0 && j >= 0 && i < w && j < h
        if (!dentro(a, b)) { ok = false; break }
        const k = id(a, b)
        if (!nel && j < 0 && appoggio) continue   // il lato di dietro può appoggiarsi alla roccia o all'acqua
        if (!erbaLibera(a, b) || riservato[k] || (nel && reg[k] !== regione) || (senzaStrada && strada[k])) { ok = false; break }
        if (nel && strada[k]) { ok = false; break }
      }
      if (!ok) continue
      const s = punteggio(x, y)
      if (s > p) { p = s; meglio = { x, y } }
    }
    return meglio
  }
  const occupa = (x, y, w, h, v = 1) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) blocco[id(x + i, y + j)] = v }
  const riserva = (x, y, w, h) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (dentro(x + i, y + j)) riservato[id(x + i, y + j)] = 1 }

  // la piazza: un tondo di ciottoli al centro del villaggio, col pozzo nel mezzo
  const V = R[regDi.villaggio]
  const piazza = { x: V.cx + 0.5, y: V.cy + 0.5, r: 4.6 }
  for (let y = V.cy - 6; y <= V.cy + 6; y++) for (let x = V.cx - 6; x <= V.cx + 6; x++)
    if (dentro(x, y) && Math.hypot(x + 0.5 - piazza.x, y + 0.5 - piazza.y) < piazza.r && terreno[id(x, y)] === ERBA) { strada[id(x, y)] = 3; riservato[id(x, y)] = 1 }
  const pozzo = { x: V.cx - 1, y: V.cy - 1, w: 2, h: 2 }
  occupa(pozzo.x, pozzo.y, 2, 2)
  const partenza = { x: V.cx, y: V.cy + 2 }

  // i mercanti: un lotto attorno alla piazza, il più vicino al posto che vogliono
  const mercanti = []
  for (const M of MERCANTI) {
    const tx = V.cx + M.verso[0], ty = V.cy + M.verso[1]
    const l = lotto(regDi.villaggio, M.w, M.h, (x, y) => -Math.hypot(x - tx, y - ty), { margine: 1, sud: 3 })
    if (!l) { guasti.push(`nessun posto per ${M.nome}`); continue }
    occupa(l.x, l.y, M.w, M.h)
    const cx = l.x + Math.floor(M.w / 2)
    // chi sta dietro il banco sta dentro il lotto; il fabbro e l'incantatrice davanti alla porta
    const piede = M.bottega === 'bancarella' || M.bottega === 'erbe' ? { x: cx, y: l.y } : { x: l.x + M.w - 1, y: l.y + M.h }
    const accanto = { x: piede.x, y: Math.max(piede.y, l.y + M.h) + 2 }
    blocco[id(piede.x, piede.y)] = 1
    riserva(l.x - 1, l.y + M.h, M.w + 2, 3)
    mercanti.push({ ...M, x: l.x, y: l.y, piede, accanto })
  }

  // gli ingressi delle discese: ognuno nella sua regione, verso il lato che vuole (lontano dal villaggio)
  const posti = []
  for (const P of POSTI) {
    const i = regDi[P.regione], r = R[i]
    const tx = r.cx + P.verso[0], ty = r.cy + P.verso[1]
    let punt = P.monumento === 'cancello' ? (x, y) => -Math.abs(x - (W - 9)) * 0.5 - Math.abs(y - r.cy) * 2 : (x, y) => -Math.hypot(x - tx, y - ty) - posti.reduce((n, q) => n + (Math.hypot(q.x - x, q.y - y) < 10 ? 50 : 0), 0)
    if (P.appoggio === 'acqua') { const base = punt; punt = (x, y) => { let n = 0; for (let i2 = 0; i2 < P.w; i2++) for (let j = 1; j <= 2; j++) if (dentro(x + i2, y - j) && terreno[id(x + i2, y - j)] === ACQUA) n++; return base(x, y) * 0.2 + n * 4 } }
    const l = lotto(i, P.w, P.h, punt, { margine: P.monumento === 'cancello' ? 1 : 2, sud: 3, appoggio: P.appoggio })
    if (!l) { guasti.push(`nessun posto per ${P.discesa}`); continue }
    occupa(l.x, l.y, P.w, P.h)
    let accanto = { x: l.x + Math.floor(P.w / 2), y: l.y + P.h + 2 }
    if (P.monumento === 'cancello') {
      // il cancello sta di traverso sulla strada che esce dalla mappa a est: oltre si vede, non si cammina
      accanto = { x: l.x - 2, y: l.y + 1 }
      for (let y = l.y; y < l.y + 3; y++) for (let x = l.x + 1; x < W; x++) { const k = id(x, y); terreno[k] = ERBA; fuori[k] = 1; strada[k] = 2; reg[k] = i }
      riserva(l.x - 3, l.y - 1, 3, 5)
    } else riserva(l.x - 1, l.y + P.h, P.w + 2, 3)
    if (P.appoggio === 'roccia') {
      // una gobba di roccia dietro: la grotta e la miniera entrano nel monte
      for (let y = l.y - 4; y < l.y; y++) for (let x = l.x - 2; x < l.x + P.w + 2; x++) {
        if (!dentro(x, y) || ponte[id(x, y)] >= 0 || strada[id(x, y)]) continue
        if (Math.abs(x - (l.x + P.w / 2 - 0.5)) <= P.w / 2 + 1.5 - (l.y - y - 1) * 0.35) terreno[id(x, y)] = ROCCIA
      }
    }
    posti.push({ ...P, x: l.x, y: l.y, accanto, regione: P.regione })
  }

  // il campo del minatore: la tenda, il falò, il carretto, e lui davanti
  let minatore = null
  {
    const i = regDi.minatore, r = R[i]
    const l = lotto(i, 6, 3, (x, y) => -Math.hypot(x - (r.cx - 6), y - (r.cy + 2)) - (posti.some(p => Math.hypot(p.x - x, p.y - y) < 9) ? 50 : 0), { margine: 1, sud: 4 })
    if (!l) guasti.push('nessun posto per il minatore')
    else {
      occupa(l.x, l.y, 3, 2); occupa(l.x + 4, l.y, 2, 1); occupa(l.x + 4, l.y + 2, 1, 1)
      const piede = { x: l.x + 2, y: l.y + 3 }
      blocco[id(piede.x, piede.y)] = 1
      riserva(l.x - 1, l.y - 1, 8, 7)
      minatore = { x: l.x, y: l.y, tenda: { x: l.x, y: l.y }, carretto: { x: l.x + 4, y: l.y }, falo: { x: l.x + 4, y: l.y + 2 }, piede, accanto: { x: piede.x, y: piede.y + 2 } }
    }
  }

  // il mulino: sulla riva del fiume del villaggio, con la ruota nell'acqua, lontano dai ponti
  let mulino = null
  {
    // una riva dritta per tre righe, con l'erba libera attorno (il lotto non va: chiede l'anello d'erba anche sul lato dell'acqua)
    let meglio = null, p = -Infinity
    for (let y = 4; y < H - 6; y++) for (let x = 4; x < W - 6; x++) for (const lato of [-1, 1]) {
      if (reg[id(x, y)] !== regDi.villaggio && reg[id(x, y)] !== regDi.campi) continue
      let ok = true
      for (let j = -1; j < 5 && ok; j++) for (let i = 0; i < 3; i++) if (!erbaLibera(x + i, y + j) || riservato[id(x + i, y + j)]) { ok = false; break }
      if (!ok) continue
      const cx = lato < 0 ? x - 1 : x + 3
      let n = 0; for (let j = 0; j < 3; j++) if (terreno[id(cx, y + j)] === ACQUA && ponte[id(cx, y + j)] < 0) n++
      if (n < 3 || ponti.some(q => Math.abs(q.y0 - y) < 7 && Math.abs(q.x0 - x) < 12)) continue
      const s = -Math.hypot(x - V.cx, y - V.cy)
      if (s > p) { p = s; meglio = { x, y, lato } }
    }
    mulino = meglio
  }
  if (mulino) {
    occupa(mulino.x, mulino.y, 3, 3)
    mulino.ruota = { x: mulino.lato < 0 ? mulino.x - 0.5 : mulino.x + 3.5, y: mulino.y + 1.5 }
    mulino.accanto = { x: mulino.x + 1, y: mulino.y + 4 }
    riserva(mulino.x - 1, mulino.y + 3, 5, 2)
  } else guasti.push('nessun posto per il mulino')

  // 7 bis. ogni posto si raggiunge: dove una cresta o uno spuntone chiude la strada si apre un varco largo tre celle (la roccia
  // costa cara ma si passa; l'acqua, i lotti e la cornice no)
  const cammino0 = (x, y) => dentro(x, y) && (terreno[id(x, y)] === ERBA || ponte[id(x, y)] >= 0) && !blocco[id(x, y)] && !fuori[id(x, y)]
  const costoVarco = k => {
    const x = k % W, y = (k / W) | 0
    if (cammino0(x, y)) return 1
    if (terreno[k] === ROCCIA && Math.min(x, y, W - 1 - x, H - 1 - y) > 7 && !blocco[k]) return 30
    return Infinity
  }
  const mete0 = [...posti.map(p => p.accanto), ...mercanti.map(m => m.accanto), ...(minatore ? [minatore.accanto] : []), ...ponti.flatMap(p => [{ x: p.x0, y: p.y0 }, { x: p.x1, y: p.y0 }])]
  for (const meta of mete0) {
    if (raggiungibili(W, H, cammino0, partenza)[id(meta.x, meta.y)]) continue
    const via = cerca(W, H, costoVarco, partenza, meta, { diagonali: false })
    if (!via) { guasti.push(`nessun varco per ${meta.x},${meta.y}`); continue }
    for (const c of via) for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
      const k = id(c.x + i, c.y + j)
      if (terreno[k] === ROCCIA && Math.min(c.x + i, c.y + j, W - 1 - c.x - i, H - 1 - c.y - j) > 6 && !blocco[k]) terreno[k] = ERBA
    }
  }

  // 8. le strade: dalla piazza a ogni posto, preferendo quelle già tracciate (così si uniscono in una rete), lontano dall'acqua
  const calpestabile = (x, y) => dentro(x, y) && (terreno[id(x, y)] === ERBA || ponte[id(x, y)] >= 0) && !blocco[id(x, y)] && !fuori[id(x, y)]
  const vicinoA = (k, t) => { const x = k % W, y = (k / W) | 0; for (const [dx, dy] of QUATTRO) if (dentro(x + dx, y + dy) && terreno[id(x + dx, y + dy)] === t && ponte[id(x + dx, y + dy)] < 0) return true; return false }
  const costoStrada = k => {
    const x = k % W, y = (k / W) | 0
    if (!calpestabile(x, y)) return Infinity
    if (ponte[k] >= 0) return 0.3
    let c = strada[k] ? 0.35 : 1 + 0.5 * rumore(x, y, seme + 600, 5)
    if (vicinoA(k, ACQUA)) c += 2
    if (vicinoA(k, ROCCIA)) c += 0.8
    return c
  }
  const traccia = (meta, livello) => {
    const via = cerca(W, H, costoStrada, partenza, meta)
    if (!via) { guasti.push(`nessuna strada per ${meta.x},${meta.y}`); return }
    for (const c of via) { const k = id(c.x, c.y); if (strada[k] < livello) strada[k] = livello }
  }
  const mete = [...posti.map(p => ({ c: p.accanto, l: 2 })), ...(minatore ? [{ c: minatore.accanto, l: 2 }] : []), ...mercanti.map(m => ({ c: m.accanto, l: 2 })),
    ...(mulino ? [{ c: mulino.accanto, l: 1 }] : [])]
  mete.sort((p, q) => Math.hypot(p.c.x - V.cx, p.c.y - V.cy) - Math.hypot(q.c.x - V.cx, q.c.y - V.cy))
  for (const m of mete) traccia(m.c, m.l)
  // ogni ponte sta su un sentiero
  for (const p of ponti) { traccia({ x: p.x0, y: p.y0 }, 1); traccia({ x: p.x1, y: p.y0 + 1 }, 1) }
  for (const p of ponti) for (let y = p.y0; y <= p.y1; y++) for (let x = p.x0; x <= p.x1; x++) strada[id(x, y)] = Math.max(strada[id(x, y)], 1)

  // 9. i campi coltivati (recintati) e le case
  const distStrada = new Int16Array(N).fill(99)
  {
    const q = []
    for (let k = 0; k < N; k++) if (strada[k]) { distStrada[k] = 0; q.push(k) }
    for (let i = 0; i < q.length; i++) {
      const k = q[i], x = k % W, y = (k / W) | 0
      for (const [dx, dy] of QUATTRO) { if (!dentro(x + dx, y + dy)) continue; const nk = id(x + dx, y + dy); if (distStrada[nk] > distStrada[k] + 1) { distStrada[nk] = distStrada[k] + 1; q.push(nk) } }
    }
  }
  const campi = []
  const COLTURE = ['grano', 'cavoli', 'grano', 'vigna', 'zucche']
  for (const [ri, quanti] of [[regDi.campi, 6], [regDi.villaggio, 2], [regDi.lago, 1]]) {
    for (let n = 0; n < quanti; n++) {
      const w = 5 + Math.floor(rnd() * 4), h = 4 + Math.floor(rnd() * 3)
      const ox = rnd() * 20 - 10, oy = rnd() * 16 - 8
      const l = lotto(ri, w, h, (x, y) => {
        const d = distStrada[id(x, y + h)]
        return -Math.abs(d - 1.5) * 3 - Math.hypot(x - R[ri].cx - ox, y - R[ri].cy - oy) * 0.4 - (Math.hypot(x - V.cx, y - V.cy) < 9 ? 99 : 0)
      }, { margine: 1, senzaStrada: true })
      if (!l) continue
      occupa(l.x, l.y, w, h)
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) campo[id(l.x + i, l.y + j)] = 1
      campi.push({ x: l.x, y: l.y, w, h, coltura: COLTURE[campi.length % COLTURE.length], file: rnd() < 0.5 ? 'x' : 'y' })
    }
  }
  const case_ = []
  const FORME = [[3, 3], [4, 3], [3, 2], [3, 4], [4, 4]]
  const casa = (ri, dmin, dmax, cx, cy) => {
    const [w, h] = FORME[Math.floor(rnd() * FORME.length)]
    const ang = rnd() * Math.PI * 2, rr = dmin + rnd() * (dmax - dmin)
    const tx = cx + Math.cos(ang) * rr, ty = cy + Math.sin(ang) * rr
    const l = lotto(ri, w, h, (x, y) => {
      let dmn = 99
      for (let j = -1; j <= h; j++) for (let i = -1; i <= w; i++) if (dentro(x + i, y + j)) dmn = Math.min(dmn, distStrada[id(x + i, y + j)])
      const dc = Math.hypot(x + w / 2 - cx, y + h / 2 - cy)
      return -Math.abs(dmn - 1) * 4 - Math.hypot(x - tx, y - ty) * 0.6 - (dc < dmin ? 50 : 0)
    }, { margine: 1, senzaStrada: true })
    if (!l) return
    // la porta guarda la strada più vicina
    let verso = 's', md = 99
    const prova = (v, xs, ys) => { for (const [x, y] of xs.flatMap(a => ys.map(b => [a, b]))) if (dentro(x, y) && distStrada[id(x, y)] < md) { md = distStrada[id(x, y)]; verso = v } }
    prova('s', [l.x + Math.floor(w / 2)], [l.y + h, l.y + h + 1]); prova('n', [l.x + Math.floor(w / 2)], [l.y - 1, l.y - 2])
    prova('e', [l.x + w, l.x + w + 1], [l.y + Math.floor(h / 2)]); prova('o', [l.x - 1, l.x - 2], [l.y + Math.floor(h / 2)])
    occupa(l.x, l.y, w, h)
    case_.push({ x: l.x, y: l.y, w, h, verso, seme: Math.floor(rnd() * 1e6) })
  }
  for (let n = 0; n < 13; n++) casa(regDi.villaggio, 6, 15, V.cx, V.cy)
  for (let n = 0; n < 3; n++) casa(regDi.campi, 3, 10, R[regDi.campi].cx, R[regDi.campi].cy)
  casa(regDi.bosco, 2, 6, R[regDi.bosco].cx, R[regDi.bosco].cy)
  casa(regDi.lago, 4, 9, R[regDi.lago].cx, R[regDi.lago].cy)

  // le staccionate: attorno ai campi (una mezza cella fuori) e lungo la strada maestra fuori dal villaggio, a tratti
  const staccionate = []
  for (const c of campi) {
    const x0 = c.x - 0.1, y0 = c.y - 0.1, x1 = c.x + c.w + 0.1, y1 = c.y + c.h + 0.1
    staccionate.push([x0, y0, x1, y0], [x1, y0, x1, y1], [x0, y1, x1, y1], [x0, y0, x0, y1])
  }

  // 10. lanterne, cartelli, falò: lungo le strade
  const lanterne = [], cartelli = []
  {
    let conta = 0
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const k = id(x, y)
      if (strada[k] !== 2 || reg[k] !== regDi.villaggio || Math.hypot(x - V.cx, y - V.cy) > 16) continue
      if (((x * 7 + y * 13) % 11) !== 0) continue
      for (const [dx, dy] of QUATTRO) {
        const a = x + dx, b = y + dy, nk = id(a, b)
        if (erbaLibera(a, b) && !strada[nk] && !riservato[nk] && lanterne.every(l => Math.hypot(l.x - a, l.y - b) > 4)) { lanterne.push({ x: a, y: b }); blocco[nk] = 1; conta++; break }
      }
    }
    // i cartelli agli incroci fuori dal villaggio: dove la strada ha tre vie
    for (let y = 2; y < H - 2; y++) for (let x = 2; x < W - 2; x++) {
      const k = id(x, y)
      if (!strada[k] || strada[k] === 3 || ponte[k] >= 0 || Math.hypot(x - V.cx, y - V.cy) < 9) continue
      const vie = QUATTRO.filter(([dx, dy]) => strada[id(x + dx, y + dy)]).length
      if (vie < 3 || cartelli.some(c => Math.hypot(c.x - x, c.y - y) < 12)) continue
      for (const [dx, dy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
        const a = x + dx, b = y + dy, nk = id(a, b)
        if (erbaLibera(a, b) && !strada[nk] && !riservato[nk]) { cartelli.push({ x: a, y: b, verso: Math.atan2(V.cy - b, V.cx - a) }); blocco[nk] = 1; break }
      }
    }
  }

  // 11. il decoro per habitat: un ingombro (albero, masso, rudere) sta in mezzo all'erba con una cella libera attorno, così non
  // chiude mai una strada; cespugli, fiori e canne non bloccano
  const DECORO = {
    villaggio: [['tondo', 5, 1], ['frutto', 3, 1], ['cespuglio', 5, 0], ['botte', 2, 1], ['cassa', 2, 1], ['covone', 1, 1]],
    campi: [['tondo', 4, 1], ['frutto', 4, 1], ['cespuglio', 3, 0], ['covone', 3, 1], ['sasso', 1, 1], ['spaventapasseri', 1, 1]],
    bosco: [['pino', 7, 1], ['tondo', 5, 1], ['abete', 4, 1], ['cespuglio', 4, 0], ['ceppo', 1, 1], ['funghi', 2, 0], ['sasso', 1, 1]],
    lago: [['salice', 4, 1], ['tondo', 2, 1], ['canne', 6, 0], ['cespuglio', 3, 0], ['sasso', 2, 1]],
    prateria: [['tondo', 3, 1], ['pino', 2, 1], ['sasso', 3, 1], ['cespuglio', 4, 0], ['masso', 1, 1]],
    colline: [['pino', 4, 1], ['abete', 2, 1], ['sasso', 4, 1], ['masso', 2, 1], ['cespuglio', 3, 0]],
    rovine: [['rudere', 4, 1], ['colonna', 3, 1], ['secco', 3, 1], ['tondo', 2, 1], ['sasso', 3, 1], ['cespuglio', 3, 0]],
    monte: [['abete', 5, 1], ['pino', 3, 1], ['masso', 3, 1], ['sasso', 3, 1], ['cespuglio', 2, 0]],
    landa: [['secco', 5, 1], ['masso', 3, 1], ['sasso', 3, 1], ['ossa', 1, 0], ['cespuglio', 2, 0]],
  }
  const decoro = []
  const riva = (x, y) => QUATTRO.some(([dx, dy]) => dentro(x + dx, y + dy) && terreno[id(x + dx, y + dy)] === ACQUA)
  for (let ri = 0; ri < nR; ri++) {
    const r = R[ri], lista = DECORO[r.habitat]
    const celle = []
    for (let k = 0; k < N; k++) if (reg[k] === ri && terreno[k] === ERBA && !strada[k] && !blocco[k] && !riservato[k] && !fuori[k] && ponte[k] < 0) celle.push(k)
    const quanti = Math.round(r.densita * celle.length / 100)
    const tot = lista.reduce((n, d) => n + d[1], 0)
    let messi = 0
    for (let prove = 0; messi < quanti && prove < quanti * 30; prove++) {
      const k = celle[Math.floor(rnd() * celle.length)], x = k % W, y = (k / W) | 0
      if (blocco[k] || strada[k]) continue
      // nel bosco gli alberi fanno macchie: lontano dalle macchie si mette meno
      if (r.habitat === 'bosco' && rumore(x, y, seme + 700, 9) < 0.35 && rnd() < 0.7) continue
      let t = rnd() * tot, d = lista[lista.length - 1]
      for (const q of lista) if ((t -= q[1]) < 0) { d = q; break }
      const [tipo, , blocca] = d
      if (tipo === 'canne' && !riva(x, y)) continue
      if (blocca) {
        let pulito = true
        for (let j = -1; j <= 1 && pulito; j++) for (let i = -1; i <= 1; i++) if (!erbaLibera(x + i, y + j) && !(i === 0 && j === 0)) { pulito = false; break }
        if (!pulito || riva(x, y) && tipo !== 'salice') continue
        blocco[k] = 2
      }
      decoro.push({ tipo, x: x + 0.5 + (rnd() - 0.5) * (blocca ? 0.3 : 0.8), y: y + 0.5 + (rnd() - 0.5) * (blocca ? 0.3 : 0.8), s: 0.8 + rnd() * 0.45, r: rnd() * Math.PI * 2, c: rnd() })
      messi++
    }
  }
  // massi grandi sulle creste e sulla cornice, che fanno la sagoma della montagna
  for (let k = 0; k < N; k++) {
    if (terreno[k] !== ROCCIA) continue
    const x = k % W, y = (k / W) | 0
    if (rnd() < 0.16) decoro.push({ tipo: 'rupe', x: x + rnd(), y: y + rnd(), s: 0.9 + rnd() * 1.4, r: rnd() * Math.PI * 2, c: rnd() })
    else if (rnd() < 0.05) decoro.push({ tipo: 'abete', x: x + 0.5, y: y + 0.5, s: 0.8 + rnd() * 0.4, r: rnd() * 6.28, c: rnd() })
  }

  // 12. la quota: base dolce per regione, la roccia alta (più alta quanto più è dentro), l'acqua bassa; poi si ammorbidisce,
  // le rive restano sopra il pelo dell'acqua e i lotti si spianano
  const quota = new Float32Array(N)
  const nelRoccia = new Int16Array(N).fill(0), nellAcqua = new Int16Array(N).fill(0)
  for (const [t, arr] of [[ROCCIA, nelRoccia], [ACQUA, nellAcqua]]) {
    const q = []
    for (let k = 0; k < N; k++) if (terreno[k] === t && !(t === ACQUA && false)) { const x = k % W, y = (k / W) | 0; if (QUATTRO.some(([dx, dy]) => dentro(x + dx, y + dy) && terreno[id(x + dx, y + dy)] !== t)) { arr[k] = 1; q.push(k) } }
    for (let i = 0; i < q.length; i++) {
      const k = q[i], x = k % W, y = (k / W) | 0
      for (const [dx, dy] of QUATTRO) { if (!dentro(x + dx, y + dy)) continue; const nk = id(x + dx, y + dy); if (terreno[nk] === t && !arr[nk]) { arr[nk] = arr[k] + 1; q.push(nk) } }
    }
  }
  const grezza = new Float32Array(N)
  for (let k = 0; k < N; k++) {
    const x = k % W, y = (k / W) | 0
    const base = (fbm(x, y, seme + 500, 22) - 0.5) * 1.1 + R[reg[k]].quota
    if (terreno[k] === ROCCIA) {
      const bordo = Math.min(x, y, W - 1 - x, H - 1 - y)
      grezza[k] = base + 0.9 + Math.min(nelRoccia[k], 6) * 0.7 + fbm(x, y, seme + 510, 5) * 1.6 + (bordo < 4 ? (4 - bordo) * 0.9 : 0)
    } else if (terreno[k] === ACQUA) grezza[k] = LIVELLO_ACQUA - 0.35 - Math.min(nellAcqua[k], 4) * 0.22
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
    let v = q2[k]
    if (t === ROCCIA) v = Math.max(v, grezza[k] * 0.85)
    else if (t === ACQUA) v = Math.min(v, LIVELLO_ACQUA - 0.18)
    else v = Math.max(v, LIVELLO_ACQUA + (riva(k % W, (k / W) | 0) ? 0.07 : 0.14))
    quota[k] = v
  }
  const spiana = (x, y, w, h) => {
    let s = 0, n = 0
    for (let j = -1; j <= h; j++) for (let i = -1; i <= w; i++) if (dentro(x + i, y + j) && terreno[id(x + i, y + j)] === ERBA) { s += quota[id(x + i, y + j)]; n++ }
    if (!n) return
    const m = s / n
    for (let j = -1; j <= h; j++) for (let i = -1; i <= w; i++) if (dentro(x + i, y + j) && terreno[id(x + i, y + j)] === ERBA) quota[id(x + i, y + j)] = (i < 0 || j < 0 || i === w || j === h) ? (quota[id(x + i, y + j)] + m) / 2 : m
  }
  spiana(V.cx - 5, V.cy - 5, 11, 11)
  for (const m of mercanti) spiana(m.x, m.y, m.w, m.h)
  for (const p of posti) spiana(p.x, p.y, p.w, p.h)
  for (const c of case_) spiana(c.x, c.y, c.w, c.h)
  for (const c of campi) spiana(c.x, c.y, c.w, c.h)
  if (mulino) spiana(mulino.x, mulino.y, 3, 3)
  if (minatore) spiana(minatore.x, minatore.y, 6, 4)
  // il piano dei ponti: alla quota della riva più alta, un poco sopra
  for (const p of ponti) {
    const qa = Math.max(quota[id(p.x0, p.y0)], quota[id(p.x0, p.y1)]), qb = Math.max(quota[id(p.x1, p.y0)], quota[id(p.x1, p.y1)])
    p.quota = Math.max(qa, qb, LIVELLO_ACQUA + 0.3) + 0.08
    for (let y = p.y0; y <= p.y1; y++) { quota[id(p.x0, y)] = p.quota - 0.05; quota[id(p.x1, y)] = p.quota - 0.05 }
    p.arco = p.tipo === 'arco' ? 0.45 : p.tipo === 'travi' ? 0.12 : 0.05
  }

  // 13. i guasti: dalla piazza si arriva a ogni ingresso, a ogni mercante, al minatore, alle due rive di ogni ponte
  const visto = raggiungibili(W, H, calpestabile, partenza)
  for (const p of posti) if (!visto[id(p.accanto.x, p.accanto.y)]) guasti.push(`non si arriva a ${p.discesa}`)
  for (const m of mercanti) if (!visto[id(m.accanto.x, m.accanto.y)]) guasti.push(`non si arriva a ${m.nome}`)
  if (minatore && !visto[id(minatore.accanto.x, minatore.accanto.y)]) guasti.push('non si arriva al minatore')
  for (const p of ponti) if (!visto[id(p.x0, p.y0)] || !visto[id(p.x1, p.y0)]) guasti.push(`il ponte fra ${p.da} e ${p.a} non porta da una riva all'altra`)

  return {
    W, H, seme, terreno, reg, regioni: R, ponte, ponti, blocco, fuori, strada, campo, quota, riservato,
    piazza, pozzo, partenza, mercanti, posti, minatore, mulino, campi, case: case_, staccionate, lanterne, cartelli, decoro, guasti,
    calpestabile, id,
  }
}

// la quota dove si cammina (sul ponte, il piano; altrove il terreno, interpolato fra i centri delle celle)
export function quotaA (m, x, z) {
  const cx = Math.floor(x), cy = Math.floor(z)
  if (cx >= 0 && cy >= 0 && cx < m.W && cy < m.H) {
    const p = m.ponte[cy * m.W + cx]
    if (p >= 0) { const P = m.ponti[p]; const t = (x - P.x0) / (P.x1 + 1 - P.x0); return P.quota + P.arco * Math.sin(Math.PI * Math.min(1, Math.max(0, t))) }
  }
  return quotaTerreno(m, x, z)
}
export function quotaTerreno (m, x, z) {
  const fx = Math.min(m.W - 1.001, Math.max(0, x - 0.5)), fz = Math.min(m.H - 1.001, Math.max(0, z - 0.5))
  const x0 = Math.floor(fx), z0 = Math.floor(fz), tx = fx - x0, tz = fz - z0
  const q = m.quota, W = m.W
  const a = q[z0 * W + x0], b = q[z0 * W + x0 + 1], c = q[(z0 + 1) * W + x0], d = q[(z0 + 1) * W + x0 + 1]
  return (a * (1 - tx) + b * tx) * (1 - tz) + (c * (1 - tx) + d * tx) * tz
}
