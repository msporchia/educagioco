// La scheda del robot: dove stanno chip, led, piste, componenti e decoro.
// Pura, gira in Node; il disegno sta in scena/scheda.js. Vedi docs/costruttore/scheda.md.

export const LARGO_MIN = 300
export const LARGO_MAX = 480
export const R_LED = 15                  // il cerchio di rame attorno al led
export const ALONE = 21                  // l'alone del led acceso
export const ROBOT = { largo: 26, alto: 32 }
export const CHIP = { alto: 64, piedino: 8 }
export const CONNETTORE = { largo: 160, alto: 46 }
export const STELLE_MAX = 2              // le stelle del gioco: fatto, e fatto senza la soluzione
export const STELLA = { passo: 16, r: 7.5 }      // le stelline accanto a un led vinto
const SCOSTA_ROBOT = 38                  // dal centro del led al centro del robot
const LUNGO = 0.75                       // da quanto di ampiezza una diagonale passa sotto un componente
const SEME = 7

export const larghezzaScheda = w => Math.max(LARGO_MIN, Math.min(LARGO_MAX, Math.floor(w || 0)))

/* ---------- geometria ---------- */
export function lunghezza(punti) {
  let L = 0
  for (let i = 1; i < punti.length; i++) L += Math.hypot(punti[i][0] - punti[i - 1][0], punti[i][1] - punti[i - 1][1])
  return L
}
// il punto a distanza `s` lungo la spezzata
export function lungo(punti, s) {
  let q = Math.max(0, s)
  for (let i = 1; i < punti.length; i++) {
    const [ax, ay] = punti[i - 1], [bx, by] = punti[i]
    const l = Math.hypot(bx - ax, by - ay)
    if (q <= l && l > 0) return [ax + (bx - ax) * q / l, ay + (by - ay) * q / l]
    q -= l
  }
  return punti[punti.length - 1].slice()
}
/* da `a` (sotto) a `b` (sopra): dritto, una diagonale a 45°, dritto */
function rotta(a, b) {
  const dx = b[0] - a[0], dy = a[1] - b[1]
  if (Math.abs(dx) < 0.5) return [a, b]
  const v = (dy - Math.abs(dx)) / 2
  return [a, [a[0], a[1] - v], [b[0], b[1] + v], b]
}
const scatola = (cx, cy, w, h) => ({ x0: cx - w / 2, y0: cy - h / 2, x1: cx + w / 2, y1: cy + h / 2 })
export const toccano = (a, b, m = 0) => a.x1 + m > b.x0 && a.x0 - m < b.x1 && a.y1 + m > b.y0 && a.y0 - m < b.y1
const dentroScatola = (p, r, m = 0) => p[0] > r.x0 - m && p[0] < r.x1 + m && p[1] > r.y0 - m && p[1] < r.y1 + m

function caso(seme) {
  let s = seme >>> 0
  return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296 }
}

/* le misure dei componenti, prima di ruotarli (il disegno sta in scena/scheda.js) */
export const MISURE = {
  resistenza: { w: 46, h: 12, sigla: 'R' }, smd: { w: 30, h: 12, sigla: 'R' },
  elettrolitico: { w: 26, h: 26, sigla: 'C' }, ceramico: { w: 18, h: 30, sigla: 'C' },
  transistor: { w: 24, h: 30, sigla: 'Q' }, quarzo: { w: 48, h: 20, sigla: 'Y' },
  diodo: { w: 42, h: 12, sigla: 'D' }, display: { w: 52, h: 56, sigla: 'DS' },
  pettine: { w: 76, h: 14, sigla: 'J' }, batteria: { w: 46, h: 46, sigla: 'BT' },
  dip: { w: 48, h: 40, sigla: 'U' }, induttanza: { w: 28, h: 28, sigla: 'L' },
  trimmer: { w: 26, h: 26, sigla: 'RV' },
}
const COPERCHI = ['batteria', 'display', 'dip']
const GROSSI = ['batteria', 'batteria', 'display', 'display', 'dip', 'dip', 'pettine', 'pettine', 'pettine',
                'quarzo', 'quarzo', 'induttanza', 'induttanza', 'trimmer', 'trimmer', 'dip', 'pettine', 'quarzo']
const PICCOLI = ['resistenza', 'smd', 'elettrolitico', 'ceramico', 'transistor', 'diodo', 'resistenza', 'smd',
                 'elettrolitico', 'transistor', 'diodo', 'induttanza', 'trimmer']

/* ---------- un posto per righe, per non guardare tutta la scheda a ogni prova ---------- */
const RIGA = 64
function griglia() {
  const righe = new Map()
  const metti = (y0, y1, cosa) => {
    for (let r = Math.floor(y0 / RIGA); r <= Math.floor(y1 / RIGA); r++) {
      if (!righe.has(r)) righe.set(r, [])
      righe.get(r).push(cosa)
    }
  }
  const vicini = (y0, y1) => {
    const visti = new Set()
    for (let r = Math.floor(y0 / RIGA); r <= Math.floor(y1 / RIGA); r++) for (const c of righe.get(r) || []) visti.add(c)
    return visti
  }
  return { metti, vicini }
}

/**
 * capitoli: [{ chiave, quanti }] nell'ordine della fila, dal primo.
 * Si parte dal basso (il primo capitolo) e si sale: y cresce verso il basso come sullo schermo.
 */
export function disponiScheda(largo, capitoli) {
  const W = larghezzaScheda(largo), c = W / 2
  const A = Math.min(120, Math.round(W * 0.27))
  const mezzoChip = Math.max(100, Math.min(120, Math.round((W - 80) / 2)))

  /* i nodi lungo la pista, dal basso; `su` è l'altezza dal fondo */
  const nodi = []
  let su = 52
  const conn = { tipo: 'connettore', su, x: c }
  let ultimoLed = null, indice = 0
  capitoli.forEach((cap, ci) => {
    su += ci === 0 ? 103 : Math.max(64, Math.abs(ultimoLed.dev) + 16) + CHIP.alto / 2 + CHIP.piedino
    nodi.push({ tipo: 'chip', cap: cap.chiave, ci, su, x: c, dev: 0, mezzo: mezzoChip })
    su += CHIP.alto / 2 + CHIP.piedino
    let prima = 0
    for (let j = 0; j < cap.quanti; j++) {
      const dev = Math.round(A * Math.sin(2 * Math.PI * (j + 1) / (cap.quanti + 1)))
      const dd = Math.abs(dev - prima)
      const sotto = j > 0 && dd >= LUNGO * A
      su += j === 0 ? Math.max(64, Math.abs(dev) + 16) : sotto ? Math.max(110, dd + 64) : Math.max(76, dd + 16)
      prima = dev
      ultimoLed = { tipo: 'led', cap: cap.chiave, ci, indice: indice++, su, x: c + dev, dev, sotto }
      nodi.push(ultimoLed)
    }
  })
  const H = su + 90
  for (const n of [conn, ...nodi]) n.y = H - n.su
  nodi.forEach((n, k) => { n.k = k })

  const fuori = n => (n.tipo === 'chip' ? [n.x, n.y - CHIP.alto / 2 - CHIP.piedino] : [n.x, n.y])
  const dentro = n => (n.tipo === 'chip' ? [n.x, n.y + CHIP.alto / 2 + CHIP.piedino] : [n.x, n.y])

  /* le piste: il tratto k va dal nodo k al nodo k+1 */
  const tratti = []
  for (let k = 0; k + 1 < nodi.length; k++) tratti.push({ k, punti: rotta(fuori(nodi[k]), dentro(nodi[k + 1])), coperchio: null })
  const attacco = { punti: [[c, conn.y - CONNETTORE.alto / 2], dentro(nodi[0])] }
  const puntiPista = []
  for (const t of [attacco, ...tratti]) {
    for (let i = 1; i < t.punti.length; i++) {
      const [ax, ay] = t.punti[i - 1], [bx, by] = t.punti[i]
      const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 4))
      for (let s = 0; s <= n; s++) puntiPista.push([ax + (bx - ax) * s / n, ay + (by - ay) * s / n])
    }
  }

  /* i passaggi sotto un componente: la diagonale lunga fra due led */
  let ic = 0
  for (const t of tratti) {
    const a = nodi[t.k + 1]
    if (a.tipo !== 'led' || !a.sotto || nodi[t.k].tipo !== 'led') continue
    const tipo = COPERCHI[ic++ % COPERCHI.length], m = MISURE[tipo]
    const L = lunghezza(t.punti), centro = lungo(t.punti, L / 2)
    const via = Math.hypot(m.w, m.h) / 2 + 6
    t.coperchio = { tipo, x: centro[0], y: centro[1], w: m.w, h: m.h,
                    vie: [lungo(t.punti, L / 2 - via), lungo(t.punti, L / 2 + via)], da: L / 2 - via, a: L / 2 + via }
  }

  /* il robot accanto al led: dalla parte di fuori, se lì non passa la pista */
  const g = griglia()
  for (const p of puntiPista) g.metti(p[1], p[1], { p })
  const passaPista = (r, m) => {
    for (const o of g.vicini(r.y0 - m, r.y1 + m)) if (o.p && dentroScatola(o.p, r, m)) return true
    return false
  }
  for (const n of nodi) {
    if (n.tipo !== 'led') continue
    const fuoriLato = n.x >= c ? 1 : -1
    const posto = s => ({ x: n.x + s * SCOSTA_ROBOT, y: n.y })
    const libero = s => {
      const p = posto(s), r = scatola(p.x, p.y, ROBOT.largo, ROBOT.alto)
      return r.x0 >= 4 && r.x1 <= W - 4 && !passaPista(r, 4)
    }
    const lato = libero(fuoriLato) || !libero(-fuoriLato) ? fuoriLato : -fuoriLato
    n.robot = posto(lato)
    n.lato = lato
  }

  /* ---------- il decoro: prima gli ostacoli, poi componenti nei vuoti ---------- */
  const ostacoli = []
  const ostacolo = r => { ostacoli.push(r); g.metti(r.y0, r.y1, { r }) }
  const urta = (r, m) => {
    for (const o of g.vicini(r.y0 - m, r.y1 + m)) if (o.r && toccano(r, o.r, m)) return true
    return false
  }
  for (const n of nodi) {
    if (n.tipo === 'chip') ostacolo(scatola(n.x, n.y, 2 * n.mezzo + 22, CHIP.alto + 2 * CHIP.piedino + 12))
    else {
      ostacolo(scatola(n.x, n.y, 2 * ALONE + 14, 2 * ALONE + 14))
      ostacolo(scatola(n.robot.x, n.robot.y, ROBOT.largo + 6, ROBOT.alto + 4))
    }
  }
  ostacolo(scatola(c, conn.y, CONNETTORE.largo + 24, CONNETTORE.alto + 18))
  const scritta = { x: c, y: 26, testo: 'SCHEDA ROBOT · rev B' }
  ostacolo(scatola(c, scritta.y - 4, 170, 24))
  const fori = [[16, 18], [W - 16, 18], [16, H - 18], [W - 16, H - 18]]
  for (const [x, y] of fori) ostacolo(scatola(x, y, 30, 30))
  const coperchi = tratti.filter(t => t.coperchio).map(t => t.coperchio)
  for (const cp of coperchi) ostacolo(scatola(cp.x, cp.y, cp.w + 6, cp.h + 6))

  /* le stelline di un led vinto: dalla parte opposta al robot, dove non passa la pista;
     se lì non c'è posto, una delle altre. `dx`, `dy` dal centro del led. */
  const wS = STELLE_MAX * STELLA.passo + 2, hS = 2 * STELLA.r + 3
  const scartiS = lato => [[-lato, 0], [-lato, -1], [-lato, 1], [lato, -2], [lato, 2], [-lato, -2], [-lato, 2]]
    .map(([s, k]) => [s * (ALONE + 8 + wS / 2), k * 14])
  for (const n of nodi) {
    if (n.tipo !== 'led') continue
    for (const [dx, dy] of scartiS(n.lato)) {
      const r = scatola(n.x + dx, n.y + dy, wS, hS)
      if (r.x0 < 4 || r.x1 > W - 4 || passaPista(r, 3) || urta(r, 1)) continue
      n.stelline = { dx, dy, w: wS, h: hS }
      ostacolo(r)
      break
    }
  }

  const rnd = caso(SEME)
  const tra = (r, m = 0) => r.x0 >= 40 && r.x1 <= W - 40 && r.y0 >= 50 && r.y1 <= H - 50
  const decoro = [], fili = [], vie = []
  let sigla = 0
  function piazza(tipo, prove) {
    const m = MISURE[tipo]
    for (let t = 0; t < prove; t++) {
      const rot = m.w !== m.h && rnd() < 0.45 ? 90 : 0
      const w = rot ? m.h : m.w, h = rot ? m.w : m.h
      const x = Math.round(46 + rnd() * (W - 92)), y = Math.round(60 + rnd() * (H - 120))
      const conSigla = rnd() < 0.4
      const r = scatola(x, y + (conSigla ? 5 : 0), w + 4, h + 4 + (conSigla ? 12 : 0))
      if (!tra(r) || urta(r, 3) || passaPista(r, 16)) continue
      ostacolo(r)
      sigla++
      const pezzo = { tipo, x, y, rot, w, h, sigla: conSigla ? m.sigla + sigla : null }
      decoro.push(pezzo)
      // un filo sottile verso il bus del bordo, se la strada è libera
      if (rnd() < 0.5) {
        const bx = x < c ? 30 : W - 30, x0 = Math.min(bx, x), x1 = Math.max(bx, x)
        const filo = scatola((x0 + x1) / 2, y, x1 - x0, 4)
        let libero = !passaPista(filo, 10)
        if (libero) for (const o of g.vicini(filo.y0 - 2, filo.y1 + 2)) if (o.r && o.r !== r && toccano(filo, o.r, 2)) { libero = false; break }
        if (libero) { fili.push({ x0: x, x1: bx, y }); vie.push([bx, y]); ostacolo(scatola((x0 + x1) / 2, y, x1 - x0, 6)) }
      }
      return true
    }
    return false
  }
  const quanto = ((W - 80) * (H - 100)) / 462000
  for (let i = 0; i < Math.round(GROSSI.length * quanto); i++) piazza(GROSSI[i % GROSSI.length], 60)
  for (let i = 0; i < Math.round(150 * quanto); i++) piazza(PICCOLI[i % PICCOLI.length], 25)
  for (let i = 0; i < Math.round(60 * quanto); i++) {
    const x = 46 + rnd() * (W - 92), y = 60 + rnd() * (H - 120), r = scatola(x, y, 8, 8)
    if (tra(r) && !urta(r, 5) && !passaPista(r, 16)) { ostacolo(r); vie.push([Math.round(x), Math.round(y)]) }
  }

  /* il bus ai bordi: tre fili per parte, con quattro scarti */
  const scarti = [0.82, 0.62, 0.4, 0.2].map(f => Math.round(H * f))
  const bus = []
  for (const x0 of [12, 20, 28]) for (const lato of [1, -1]) {
    const X = v => (lato === 1 ? v : W - v)
    const punti = [[X(x0), H - 44]]
    let x = x0, verso = 1
    for (const sy of scarti) { const s = 8 * verso; punti.push([X(x), sy], [X(x + s), sy - 8]); x += s; verso = -verso }
    punti.push([X(x), 44])
    bus.push(punti)
  }

  const ledDi = []
  for (const n of nodi) if (n.tipo === 'led') ledDi[n.indice] = n
  return { W, H, A, nodi, ledDi, tratti, attacco, connettore: conn, coperchi, decoro, fili, vie, bus, fori, scritta,
           ostacoli, puntiPista }
}


/* ---------- la strada del robot ---------- */

/* la pista intera, in una spezzata sola dal primo chip all'ultimo nodo: `S[k]` è dove
   si incontra il nodo k (il centro di un led, l'ingresso di un chip), `nascosti` i pezzi
   sotto un componente. Dal chip si esce dall'altra parte: il tratto prima finiva sotto,
   questo parte sopra, e il robot lo attraversa in linea retta. */
const pisteIntere = new WeakMap()
export function pistaIntera(scheda) {
  if (pisteIntere.has(scheda)) return pisteIntere.get(scheda)
  const n0 = scheda.nodi[0]
  const punti = [[n0.x, n0.tipo === 'chip' ? n0.y + CHIP.alto / 2 + CHIP.piedino : n0.y]]
  const S = [0], nascosti = []
  scheda.tratti.forEach((t, k) => {
    const ultimo = punti[punti.length - 1]
    if (Math.hypot(t.punti[0][0] - ultimo[0], t.punti[0][1] - ultimo[1]) > 0.5) punti.push(t.punti[0].slice())
    const s0 = lunghezza(punti)
    for (let i = 1; i < t.punti.length; i++) punti.push(t.punti[i].slice())
    if (t.coperchio) nascosti.push([s0 + t.coperchio.da, s0 + t.coperchio.a])
    S[k + 1] = lunghezza(punti)
  })
  const pista = { punti, S, nascosti, L: lunghezza(punti) }
  pisteIntere.set(scheda, pista)
  return pista
}

// i punti della pista fra le distanze `a` e `b`, nel verso da `a` a `b`
function tagliaPista(pista, a, b) {
  const lo = Math.min(a, b), hi = Math.max(a, b)
  const fuori = [lungo(pista.punti, lo)]
  let s = 0
  for (let i = 1; i < pista.punti.length; i++) {
    s += Math.hypot(pista.punti[i][0] - pista.punti[i - 1][0], pista.punti[i][1] - pista.punti[i - 1][1])
    if (s > lo + 0.01 && s < hi - 0.01) fuori.push(pista.punti[i].slice())
  }
  fuori.push(lungo(pista.punti, hi))
  return a <= b ? fuori : fuori.reverse()
}

/* il posto da cui parte un robot fermo accanto a un led: sul led, dove si aggancia alla pista */
export function partenzaDa(scheda, led) {
  const n = scheda.ledDi[led]
  return n ? { x: n.robot.x, y: n.robot.y, s: pistaIntera(scheda).S[n.k] } : null
}

/* la strada del robot da dove sta (`inizio`: { x, y, s }, s è dove si aggancia alla pista) al
   posto accanto al led `a`, avanti o indietro: va alla pista, la segue (attraverso i chip) e
   sale al posto accanto al led. Parte anche da un punto qualunque, per chi cambia meta in volo.
   `nascosti` sono i pezzi sotto un componente, `tappe` dove incontra ogni nodo, `primo` e
   `ultimo` dove comincia e finisce la pista dentro la strada, `suPista(d)` a che punto della
   pista sta chi ha fatto `d` di strada. */
export function stradaDaPunto(scheda, inizio, a) {
  const n1 = scheda.ledDi[a]
  if (!inizio || !n1) return null
  const pista = pistaIntera(scheda), sFine = pista.S[n1.k], s0 = inizio.s
  const punti = [[inizio.x, inizio.y]]
  const aggancio = lungo(pista.punti, s0)
  if (Math.hypot(aggancio[0] - inizio.x, aggancio[1] - inizio.y) > 0.5) punti.push(aggancio)
  const primo = lunghezza(punti)
  if (Math.abs(sFine - s0) > 0.5) for (const p of tagliaPista(pista, s0, sFine).slice(1)) punti.push(p)
  const ultimo = lunghezza(punti)
  punti.push([n1.robot.x, n1.robot.y])
  if (lunghezza(punti) < 1) return null

  const dir = sFine >= s0 ? 1 : -1
  const lo = Math.min(s0, sFine), hi = Math.max(s0, sFine)
  const alla = g => primo + dir * (g - s0)
  const nascosti = []
  for (const [h0, h1] of pista.nascosti) {
    const c0 = Math.max(h0, lo), c1 = Math.min(h1, hi)
    if (c0 >= c1) continue
    // un pezzo che comincia prima di noi (o finisce dopo) si estende un poco fuori strada
    const p = alla(dir > 0 ? c0 : c1) - (c0 === lo && dir > 0 || c1 === hi && dir < 0 ? 1 : 0)
    const q = alla(dir > 0 ? c1 : c0) + (c1 === hi && dir > 0 || c0 === lo && dir < 0 ? 1 : 0)
    nascosti.push([p, q])
  }
  const tappe = []
  scheda.nodi.forEach(n => {
    const g = pista.S[n.k]
    if (g >= lo - 0.5 && g <= hi + 0.5) tappe.push({ k: n.k, s: alla(g) })
  })
  tappe.sort((x, y) => x.s - y.s)
  const suPista = d => (d <= primo ? s0 : d >= ultimo ? sFine : s0 + dir * (d - primo))
  return { punti, nascosti, tappe, L: lunghezza(punti), primo, ultimo, suPista, avanti: dir > 0 }
}

// dal posto accanto a un led al posto accanto a un altro, avanti o indietro
export const stradaDelRobot = (scheda, da, a) => (da === a ? null : stradaDaPunto(scheda, partenzaDa(scheda, da), a))

// quanto dura il viaggio, in secondi: più lungo, più tempo, ma sempre poco
export const durataViaggio = L => Math.max(0.9, Math.min(2.8, 0.45 + L / 300))
