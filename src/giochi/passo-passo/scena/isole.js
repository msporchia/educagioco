// La mappa delle isole di Passo passo: dove cade ogni isola, ogni casella,
// le tane, i bivi e i ponti, e la strada del segnalino da una casella
// all'altra (salti, e nelle tane l'animale che cambia). Puro, gira in
// Node: il disegno sta in viste/Mappa.vue, le scelte in docs/passo-passo/mappa.md.

export const LARGO_MAX = 520        // oltre, la mappa resta in mezzo
const M = 8                         // dal bordo dello schermo all'isola
const RIGA = 104                    // fra una riga di caselle e la dopo
const TESTA = 92                    // sopra la prima riga: il cartello, e sotto l'animale in piedi
const FONDO = 20                    // sotto l'ultima riga
const FONDO_TANA = 96               // sotto l'ultima riga, se lì c'è la tana del bivio
const ORLO = 12                     // dalla strada al bordo dell'isola
const STRADA = 20                   // la larghezza della strada
const GOMITO = 30                   // la curva a fine riga, oltre l'ultima casella
const PONTE = 56                    // fra due isole del coniglio
const STACCO_RAMO = 36              // sopra e sotto un'isola del cane
const ISOLOTTO = 54                 // da una casella sola al bordo dell'isolotto, di lato
const CIMA = 14, FINE = 60
export const ANIMALE = { largo: 52, alto: 52, piede: 8 }   // il piede affonda un poco nel bordo della casella
export const SENTIERO = 1.35        // la casella del sentiero senza fine, rispetto alle altre

// il vestito di un'isola: solo disegno, le regole restano le stesse
export const VESTITI = {
  passi: 'prato', salto: 'stagno', ghiaccio: 'ghiaccio', massi: 'prato', buche: 'orto',
  ripeti: 'orto', fino: 'prato', se: 'stagno', mondo: 'ghiaccio',
}
const vestitoDi = isola => (isola.animale === 'cane' ? 'pascolo' : VESTITI[isola.scalino] || 'prato')

// n caselle in righe da al più `perRiga`, il più pari possibile: 5 → 3 + 2, 11 → 3 + 3 + 3 + 2
export function dividi(n, perRiga) {
  const quante = Math.max(1, Math.ceil(n / perRiga))
  const base = Math.floor(n / quante), resto = n % quante
  return Array.from({ length: quante }, (_, r) => base + (r < resto ? 1 : 0))
}

const latoDi = W => (W >= 360 ? 56 : 50)

// quante caselle stanno in una riga fra xMin e xMax, con almeno un dito fra l'una e l'altra
function perRigaDi(xMin, xMax, lato) {
  for (let k = 4; k > 1; k--) if ((xMax - xMin) / (k - 1) >= lato + 22) return k
  return 1
}

// le x di una riga, in mezzo fra xMin e xMax e a passo fisso, nell'ordine in cui si percorrono
function xDellaRiga(xMin, xMax, k, perRiga, verso) {
  const passo = perRiga > 1 ? (xMax - xMin) / (perRiga - 1) : 0
  const mezzo = (xMin + xMax) / 2
  const xs = Array.from({ length: k }, (_, j) => mezzo + (j - (k - 1) / 2) * passo)
  return verso > 0 ? xs : xs.reverse()
}

/* Le caselle di un'isola in righe a serpente: la prima riga va nel verso
   `verso`. Torna le caselle e il verso della riga dopo l'ultima. */
function righe(tappe, { x0, x1, cima, lato, verso }) {
  const xMin = x0 + ORLO + STRADA / 2 + GOMITO, xMax = x1 - ORLO - STRADA / 2 - GOMITO
  const perRiga = perRigaDi(xMin, xMax, lato)
  const caselle = []
  let y = cima + TESTA + lato / 2, i = 0
  for (const k of dividi(tappe.length, perRiga)) {
    for (const x of xDellaRiga(xMin, xMax, k, perRiga, verso)) caselle.push({ id: tappe[i++], x, y, verso })
    verso = -verso
    y += RIGA
  }
  return { caselle, verso, fondo: y - RIGA + lato / 2, xMin, xMax }
}

/* La strada che passa per una fila di punti: dritta lungo una riga, e a
   fine riga una curva che sporge di `GOMITO` e scende alla riga dopo;
   fra due isole la curva si allunga in un tratto dritto (il ponte).
   Una Catmull-Rom; `indici[k]` è il punto che cade sul punto k. */
function strada(punti, { dentro = x => x, testa = null, coda = null } = {}) {
  if (!punti.length) return { punti: [], indici: [] }
  const guida = [], quale = []
  if (testa) { guida.push(testa); quale.push(-1) }
  punti.forEach((n, k) => {
    const prima = punti[k - 1]
    if (prima && Math.abs(prima.y - n.y) > 1) {
      const d = prima.verso
      // se accanto c'è l'isola di un ramo del cane, il ponte gira largo: l'isoletta sta fra la riga e lui
      const fuori = dentro(prima.ponteX ?? (d > 0 ? Math.max(prima.x, n.x) + GOMITO : Math.min(prima.x, n.x) - GOMITO))
      if (n.y - prima.y > RIGA * 1.3) {
        guida.push([fuori, prima.y + RIGA * 0.42], [fuori, n.y - RIGA * 0.42]); quale.push(-1, -1)
      } else { guida.push([fuori, (prima.y + n.y) / 2]); quale.push(-1) }
    }
    guida.push([n.x, n.y]); quale.push(k)
  })
  if (coda) { guida.push(coda); quale.push(-1) }
  const out = [], indici = []
  const P = i => guida[Math.max(0, Math.min(guida.length - 1, i))]
  const PASSI = 10
  for (let i = 0; i < guida.length - 1; i++) {
    if (quale[i] >= 0) indici[quale[i]] = out.length
    const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2)
    for (let s = 0; s < PASSI; s++) {
      const t = s / PASSI, t2 = t * t, t3 = t2 * t
      const c = (a, b, c2, d) => 0.5 * (2 * b + (-a + c2) * t + (2 * a - 5 * b + 4 * c2 - d) * t2 +
                                        (-a + 3 * b - 3 * c2 + d) * t3)
      out.push([c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])])
    }
  }
  out.push([...guida[guida.length - 1]])
  if (quale[guida.length - 1] >= 0) indici[quale[guida.length - 1]] = out.length - 1
  return { punti: out, indici }
}

// dove poggia l'animale seduto su una casella: il bordo di sopra, nel mezzo
const piedeSu = (x, y, lato) => ({ x, y: y - lato / 2 + ANIMALE.piede })

/* `S` sono le strade (motore/strade.js); `sentiero` se in fondo c'è il
   sentiero senza fine. */
export function disponiIsole(W, S, { sentiero = true } = {}) {
  const lato = latoDi(W)
  const isole = [], nodi = [], strade = [], archi = [], bivi = []
  const nodo = n => { nodi.push(n); return n }
  const xMinTutta = M + ORLO + STRADA / 2 + GOMITO, xMaxTutta = W - M - ORLO - STRADA / 2 - GOMITO
  const dentro = x => Math.max(M + STRADA / 2 + 2, Math.min(W - M - STRADA / 2 - 2, x))
  const maestra = []                 // le caselle della strada del coniglio, in fila
  let y = CIMA
  let verso = 1                      // la riga che viene: 1 da sinistra a destra
  const lista = S.isole

  for (let k = 0; k < lista.length; k++) {
    const isola = lista[k]
    if (isola.animale === 'cane' && isola.da) continue      // la mette l'isola della sua tana
    const ramo = lista[k + 1] && lista[k + 1].animale === 'cane' && lista[k + 1].da === isola.chiave
      ? lista[k + 1] : null
    const kIsola = isole.length
    const r = righe(isola.tappe, { x0: M, x1: W - M, cima: y, lato, verso })
    const fondo = r.fondo + (ramo ? FONDO_TANA : FONDO)
    const prima = r.caselle[0]
    isole.push({ k: kIsola, chiave: isola.chiave, scalino: isola.scalino, animale: isola.animale,
                 vestito: vestitoDi(isola), x: M, y, w: W - 2 * M, h: fondo - y, tappe: isola.tappe,
                 // il cartello dalla parte dove la prima riga non comincia
                 cartello: { lato: -prima.verso, y: y + 10 } })
    for (const c of r.caselle) {
      const n = nodo({ id: c.id, tipo: 'tappa', x: c.x, y: c.y, lato, isola: kIsola, animale: isola.animale,
                       piede: piedeSu(c.x, c.y, lato), verso: c.verso })
      if (ramo && c === r.caselle.at(-1)) n.ponteX = c.verso > 0 ? xMaxTutta + GOMITO : xMinTutta - GOMITO
      if (isola.animale === 'coniglio') maestra.push(n)
    }
    if (isola.animale === 'cane') {
      for (let j = 1; j < r.caselle.length; j++) archi.push({ a: r.caselle[j - 1].id, b: r.caselle[j].id, tipo: 'passo' })
      // un'isola del cane senza tana (non succede oggi): la sua strada e basta
      const s = strada(nodi.filter(n => n.isola === kIsola))
      strade.push({ tipo: 'strada', isola: kIsola, punti: s.punti })
    }
    verso = r.verso
    y = fondo

    if (!ramo) { y += PONTE; continue }

    /* il ramo del cane: un'isola nello spazio dopo, dalla parte opposta a
       dove passa il ponte del coniglio; la tana sul bordo di sotto di
       quest'isola, e la sua gemella sul bordo di sopra di quella del cane */
    const lato0 = r.caselle.at(-1).verso      // il ponte scende da questa parte
    const kRamo = isole.length
    const yR = y + STACCO_RAMO
    const largo = ramo.tappe.length === 1 ? lato + 2 * ISOLOTTO
      : (lato0 > 0 ? xMaxTutta + GOMITO - STRADA / 2 - 14 - M : W - M - (xMinTutta - GOMITO + STRADA / 2 + 14))
    const x0 = ramo.tappe.length === 1 ? (lato0 > 0 ? M + 8 : W - M - 8 - largo)
      : (lato0 > 0 ? M : W - M - largo)
    // le caselle del cane cominciano dalla parte della tana, lontano dal ponte
    const rr = righe(ramo.tappe, { x0, x1: x0 + largo, cima: yR, lato, verso: lato0 })
    const fondoR = rr.fondo + FONDO
    isole.push({ k: kRamo, chiave: ramo.chiave, scalino: ramo.scalino, animale: 'cane', vestito: 'pascolo',
                 x: x0, y: yR, w: largo, h: fondoR - yR, tappe: ramo.tappe, isolotto: ramo.tappe.length === 1,
                 attacco: ramo.attacco, da: kIsola,
                 cartello: ramo.tappe.length === 1 ? null : { lato: lato0, y: yR + 10 } })
    for (const c of rr.caselle)
      nodo({ id: c.id, tipo: 'tappa', x: c.x, y: c.y, lato, isola: kRamo, animale: 'cane',
             piede: piedeSu(c.x, c.y, lato), verso: c.verso })
    for (let j = 1; j < rr.caselle.length; j++) archi.push({ a: rr.caselle[j - 1].id, b: rr.caselle[j].id, tipo: 'passo' })

    /* le due tane, una sopra l'altra: quella del coniglio in fondo a
       quest'isola, in capo a un ramo di strada che parte dall'ultima
       casella se la tana è la fine dell'isola (le buche), se no dalla più
       vicina dell'ultima riga; quella del cane in cima all'isola del cane */
    const primaR = rr.caselle[0]
    const xt = primaR.x
    const yT = fondo - 26
    const tanaC = nodo({ id: `tana:${ramo.chiave}:coniglio`, tipo: 'tana', x: xt, y: yT, isola: kIsola,
                         animale: 'coniglio', ramo: ramo.chiave, piede: { x: xt, y: yT + 4 } })
    const tanaD = nodo({ id: `tana:${ramo.chiave}:cane`, tipo: 'tana', x: xt, y: yR + 28, isola: kRamo,
                         animale: 'cane', ramo: ramo.chiave, piede: { x: xt, y: yR + 32 } })
    archi.push({ a: tanaC.id, b: tanaD.id, tipo: 'tunnel' })
    archi.push({ a: tanaD.id, b: primaR.id, tipo: 'passo' })
    const ultimaRiga = r.caselle.filter(c => Math.abs(c.y - r.caselle.at(-1).y) < 1)
    const daQui = ramo.attacco === isola.tappe.at(-1) ? r.caselle.at(-1)
      : ultimaRiga.reduce((a, b) => (Math.abs(b.x - xt) < Math.abs(a.x - xt) ? b : a))
    archi.push({ a: daQui.id, b: tanaC.id, tipo: 'passo' })
    const ramoDiStrada = gomitoGiu([daQui.x, daQui.y], [xt, yT])
    strade.push({ tipo: 'ramo', isola: kIsola, punti: ramoDiStrada })
    strade.push({ tipo: 'tunnel', punti: [[xt, yT + 12], [xt, tanaD.y - 12]] })
    const sR = strada(rr.caselle, { testa: [xt, tanaD.y] })
    strade.push({ tipo: 'strada', isola: kRamo, punti: sR.punti })

    // il cartello del bivio: vicino al ramo, dove non tocca niente
    const ponte = [lato0 > 0 ? xMaxTutta + GOMITO : xMinTutta - GOMITO, fondo + 30]
    const occupato = (x, y) => ramoDiStrada.some(([sx, sy]) => Math.abs(sx - x) < 34 && Math.abs(sy - y) < 30) ||
      Math.hypot(x - xt, y - yT) < 46 || x < M + 30 || x > W - M - 30 ||
      Math.abs(x - ponte[0]) < 44 || r.caselle.some(c => Math.abs(c.x - x) < lato / 2 + 30 && Math.abs(c.y - y) < lato / 2 + 22)
    const posti = [[daQui.x - lato0 * 52, yT - 36], [daQui.x - lato0 * 100, yT - 36], [xt + lato0 * 56, yT],
                   [xt - lato0 * 56, yT], [xt + lato0 * 56, yT - 36], [xt - lato0 * 56, yT - 36],
                   // se la tana sta contro il bordo, il ramo gli occupa il posto vicino: più in là, lungo il fondo
                   [xt + lato0 * 110, yT], [xt + lato0 * 110, yT - 36], [xt + lato0 * 164, yT], [xt + lato0 * 164, yT - 36]]
    const [bx, by] = posti.find(([x, y]) => !occupato(x, y)) || posti[0]
    const gradi = (p, q) => Math.round(Math.atan2(q[1] - p[1], q[0] - p[0]) * 180 / Math.PI)
    bivi.push({ x: bx, y: by, isola: kIsola, ramo: ramo.chiave, tana: tanaC.id,
                coniglio: gradi([bx, by], ponte), cane: gradi([bx, by], [xt, yT]) })

    y = fondoR + STACCO_RAMO
  }

  // in fondo alla strada maestra, il sentiero senza fine
  if (sentiero && maestra.length) {
    const ultima = maestra.at(-1)
    const grande = Math.round(lato * SENTIERO)
    const tondo = grande + 40
    const x = Math.max(M + tondo / 2 + 4, Math.min(W - M - tondo / 2 - 4, ultima.verso > 0 ? xMaxTutta : xMinTutta))
    const cy = y + 70 + tondo / 2
    const kS = isole.length
    isole.push({ k: kS, chiave: 'senza-fine', scalino: null, animale: 'coniglio', vestito: 'sentiero', tondo: true,
                 // più alta che larga: sopra la casella c'è l'animale
                 x: x - tondo / 2, y: cy - tondo / 2 - 30, w: tondo, h: tondo + 30, tappe: [], cartello: null })
    const n = nodo({ id: 'senza-fine', tipo: 'sentiero', x, y: cy, lato: grande, isola: kS, animale: 'coniglio',
                     piede: piedeSu(x, cy, grande), verso: -ultima.verso })
    // il nome dall'altra parte
    const lx = x - ultima.verso * (tondo / 2 + 10)
    n.etichetta = { lato: -ultima.verso, x: lx, largo: ultima.verso > 0 ? lx - M - 6 : W - M - 6 - lx }
    maestra.push(n)
    y = cy + tondo / 2
  }
  // la strada maestra, da una casella alla dopo, anche sopra i ponti
  for (let j = 1; j < maestra.length; j++) archi.push({ a: maestra[j - 1].id, b: maestra[j].id, tipo: 'passo' })
  const sM = strada(maestra, { dentro })
  strade.unshift({ tipo: 'maestra', punti: sM.punti })
  maestra.forEach((n, k) => { n.punto = sM.indici[k] })

  return { W, H: y + FINE, lato, isole, nodi, strade, archi, bivi }
}

// il ramo che porta alla tana: giù dalla casella, e poi di lato fino a lei, con l'angolo tondo
function gomitoGiu(a, b) {
  const [ax, ay] = a, [bx, by] = b
  if (Math.abs(bx - ax) < 16) return [[ax, ay], [bx, by]]
  const r = Math.min(18, Math.abs(bx - ax) / 2), d = Math.sign(bx - ax)
  const out = [[ax, ay], [ax, by - r]]
  for (let i = 1; i <= 6; i++) {
    const t = (i / 6) * Math.PI / 2
    out.push([ax + d * r * (1 - Math.cos(t)), by - r + r * Math.sin(t)])
  }
  out.push([bx, by])
  return out
}

// una fila di punti come attributo `d` di un path SVG
export function tratto(punti, da = 0, a = punti.length - 1) {
  if (!punti.length || a <= da) return ''
  let d = `M${punti[da][0].toFixed(1)} ${punti[da][1].toFixed(1)}`
  for (let i = da + 1; i <= a; i++) d += `L${punti[i][0].toFixed(1)} ${punti[i][1].toFixed(1)}`
  return d
}

// il rettangolo che l'animale occupa seduto sulla casella
export function ingombroAnimale(n) {
  const p = n.piede
  return { x: p.x - ANIMALE.largo / 2, y: p.y - ANIMALE.alto, largo: ANIMALE.largo, alto: ANIMALE.alto }
}

/* ═══════════ il viaggio del segnalino ═══════════ */

/* La strada più corta fra due nodi, sugli archi (ogni arco costa la sua
   lunghezza, un tunnel poco: sotto terra non si vede). */
export function percorso(quadro, da, a) {
  const per = new Map(quadro.nodi.map(n => [n.id, n]))
  if (!per.has(da) || !per.has(a)) return null
  if (da === a) return [da]
  const vicini = new Map(quadro.nodi.map(n => [n.id, []]))
  for (const e of quadro.archi) {
    const p = per.get(e.a), q = per.get(e.b)
    const costo = e.tipo === 'tunnel' ? 40 : Math.hypot(p.x - q.x, p.y - q.y)
    vicini.get(e.a).push([e.b, costo, e.tipo])
    vicini.get(e.b).push([e.a, costo, e.tipo])
  }
  const dist = new Map([[da, 0]]), prima = new Map(), fatti = new Set()
  while (true) {
    let u = null
    for (const [k, d] of dist) if (!fatti.has(k) && (u === null || d < dist.get(u))) u = k
    if (u === null) return null
    if (u === a) break
    fatti.add(u)
    for (const [v, c] of vicini.get(u)) {
      const d = dist.get(u) + c
      if (!dist.has(v) || d < dist.get(v)) { dist.set(v, d); prima.set(v, u) }
    }
  }
  const via = [a]
  while (via[0] !== da) via.unshift(prima.get(via[0]))
  return via
}

export const VICINO = 5             // fino a qui salta di casella in casella, oltre fa un balzo solo
const SALTELLO = 0.26               // la durata di un salto da una casella alla vicina
const TANA_DENTRO = 0.34, TANA_FUORI = 0.36

/* I passi del viaggio: { che: 'salto', da, a, dur, alto, verso, animale }
   fra due piedi, { che: 'entra' | 'esce', dove, dur, animale } in una
   tana. Fra le tane l'animale cambia. */
export function viaggio(quadro, da, a) {
  const via = percorso(quadro, da, a)
  if (!via || via.length < 2) return []
  const per = new Map(quadro.nodi.map(n => [n.id, n]))
  const tunnel = (x, y) => quadro.archi.some(e => e.tipo === 'tunnel' &&
    ((e.a === x && e.b === y) || (e.a === y && e.b === x)))
  // a pezzi: un pezzo è una fila di salti, fra un pezzo e l'altro una tana
  const pezzi = [[via[0]]]
  for (let i = 1; i < via.length; i++) {
    if (tunnel(via[i - 1], via[i])) pezzi.push([via[i]])
    else pezzi.at(-1).push(via[i])
  }
  const passi = []
  pezzi.forEach((pz, k) => {
    const animale = per.get(pz[0]).animale
    if (k > 0) passi.push({ che: 'esce', dove: per.get(pz[0]).piede, dur: TANA_FUORI, animale, al: pz[0] })
    const tappe = pz.length - 1 <= VICINO ? pz.map((_, i) => i) : [0, pz.length - 1]
    for (let j = 1; j < tappe.length; j++) {
      const p = per.get(pz[tappe[j - 1]]).piede, q = per.get(pz[tappe[j]]).piede
      const lungo = Math.hypot(q.x - p.x, q.y - p.y)
      const balzo = tappe.length === 2 && pz.length - 1 > VICINO
      passi.push({
        che: 'salto', da: p, a: q, animale, al: pz[tappe[j]],
        dur: balzo ? Math.min(1.1, 0.5 + lungo / 1600) : Math.min(0.42, SALTELLO + lungo / 1400),
        alto: balzo ? Math.min(170, 46 + lungo * 0.16) : Math.min(50, 20 + lungo * 0.14),
        // girato verso dove va; un salto dritto in giù tiene il verso di prima
        verso: Math.abs(q.x - p.x) < 2 ? 0 : Math.sign(q.x - p.x),
      })
    }
    if (k < pezzi.length - 1) passi.push({ che: 'entra', dove: per.get(pz.at(-1)).piede, dur: TANA_DENTRO, animale,
                                           al: pz.at(-1) })
  })
  return passi
}

// l'animale a una frazione q di un salto: dove sta e come si schiaccia
export function arco(p, q0, q, alto) {
  const t = Math.max(0, Math.min(1, q))
  const x = p.x + (q0.x - p.x) * t
  const y = p.y + (q0.y - p.y) * t - alto * 4 * t * (1 - t)
  // si schiaccia per partire e per atterrare, si allunga in aria
  const molla = t < 0.14 ? 1 - (0.14 - t) * 1.4 : t > 0.88 ? 1 - (t - 0.88) * 1.2 : 1 + 0.1 * Math.sin(Math.PI * t)
  return { x, y, sy: molla, sx: 2 - molla }
}

/* ═══════════ il vestito ═══════════
   Le cose sparse sulle isole (fiori, ciuffi, sassi, canne, cristalli,
   paletti): dove non c'è una casella, la strada o il cartello. Il caso è
   fisso sulla posizione: la stessa mappa a ogni apertura. */
const hash = (x, y, k = 0) => {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(k, 1274126177)) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}
const COSE = { prato: ['fiore', 'ciuffo', 'fiore'], orto: ['germoglio', 'ciuffo'], stagno: ['canna', 'ciuffo', 'fiore'],
               ghiaccio: ['cristallo', 'neve'], pascolo: ['ciuffo', 'fiore', 'ciuffo'], sentiero: [] }

export function decori(quadro) {
  const out = []
  const strada = quadro.strade.flatMap(s => (s.tipo === 'tunnel' ? [] : s.punti))
  for (const isola of quadro.isole) {
    const cose = COSE[isola.vestito] || []
    if (!cose.length) continue
    const caselle = quadro.nodi.filter(n => n.isola === isola.k)
    const libero = (x, y) => caselle.every(n => Math.hypot(n.x - x, n.y - y) > (n.lato || 30) * 0.5 + 22 &&
                                                Math.hypot(n.piede.x - x, n.piede.y - ANIMALE.alto / 2 - y) > 30) &&
      strada.every(([sx, sy]) => Math.hypot(sx - x, sy - y) > STRADA / 2 + 9) &&
      !(isola.cartello && y < isola.y + 46)
    const passo = 34
    for (let gy = isola.y + 22; gy < isola.y + isola.h - 12; gy += passo)
      for (let gx = isola.x + 18; gx < isola.x + isola.w - 14; gx += passo) {
        const r = hash(gx, gy, isola.k)
        if (r > 0.38) continue
        const x = gx + (hash(gx, gy, 7) - 0.5) * 18, y = gy + (hash(gx, gy, 9) - 0.5) * 18
        if (!libero(x, y)) continue
        out.push({ isola: isola.k, che: cose[Math.floor(hash(gx, gy, 3) * cose.length)], x, y, r })
      }
    // lo stagno ha la sua pozza, se trova un posto largo
    if (isola.vestito === 'stagno') {
      const posto = cerca(isola, (x, y) => [-26, 0, 26].every(dx => [-10, 10].every(dy => libero(x + dx, y + dy))))
      if (posto) out.push({ isola: isola.k, che: 'pozza', ...posto })
    }
  }
  return out
}

function cerca(isola, va) {
  for (let gy = isola.y + isola.h - 30; gy > isola.y + 40; gy -= 12)
    for (let gx = isola.x + 40; gx < isola.x + isola.w - 40; gx += 12) if (va(gx, gy)) return { x: gx, y: gy }
  return null
}
