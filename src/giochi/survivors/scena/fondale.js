// Il fondale: il prato a toppe e gli ostacoli, coi pezzi dei fogli del
// terreno del castello (già nel file unico). Il fondo piatto si dipinge
// una volta per riquadro e si tiene; alberi e rocce, che sono alti, li
// dipinge il campo a ogni fotogramma insieme ai mostri, in ordine di
// profondità. Vedi docs/survivors/grafica.md.
import { SCENE, PEZZI as TUTTI, QUANTI } from '../../castello/dati/vestiti.js'
import { RIQUADRO, caso, rumore } from '../motore/terreno.js'
import { terrenoDi } from '../dati/terreno.js'

// il posto (lo scenario della tappa o una sua macchia) → il foglio del
// castello che lo veste, e una tinta moltiplicata sopra per i posti che
// un foglio loro non ce l'hanno (il deserto è la neve color sabbia). La
// notte è il bosco, e il buio lo mette il campo sopra a tutto: così anche
// le macchie che ci si trovano dentro sono al buio
export const VESTE = {
  prato:   { foglio: 'bosco',  fiori: 0.45 },
  bosco:   { foglio: 'bosco',  fiori: 0.2 },
  palude:  { foglio: 'palude', fiori: 0.3 },
  grotta:  { foglio: 'lava',   fiori: 0.25 },
  deserto: { foglio: 'neve',   fiori: 0.2, tinta: '#e8c48a' },
  neve:    { foglio: 'neve',   fiori: 0.3 },
  notte:   { foglio: 'bosco',  fiori: 0.3 },
}
export const vesteDi = s => VESTE[s] || VESTE.prato

const CELLA = 40              // una toppa ogni 40 punti di mondo
const SCALA = CELLA / 64      // i fogli sono dipinti a 64 pixel per cella
const TOPPA = 96 * SCALA
const N = RIQUADRO / CELLA
const DENSITA = 1.25          // pixel di tela per punto di mondo nei riquadri tenuti
const BORDO = 2               // i riquadri si sovrappongono di tanto: senza, fra due resta un filo
const PUNTINO = 2             // la grana del bordo di una macchia, in punti di mondo

/* ── i fogli, tinti una volta sola ── */
const fogli = {}
const attese = {}
const pronti = {}
// il foglio del posto e quelli delle sue macchie, tutti: un riquadro
// dipinto prima che arrivi quello di una macchia resterebbe tenuto senza
export function caricaFondale(scenario) {
  if (attese[scenario]) return attese[scenario]
  attese[scenario] = Promise.all([foglio(scenario), ...(terrenoDi(scenario).macchie || []).map(foglio)])
    .then(() => { pronti[scenario] = true })
  return attese[scenario]
}
function foglio(chiave) {
  const v = vesteDi(chiave)
  if (attese['foglio:' + chiave]) return attese['foglio:' + chiave]
  attese['foglio:' + chiave] = new Promise(risolvi => {
    const i = new Image()
    i.onload = () => {
      if (!v.tinta) { fogli[chiave] = i; return risolvi() }
      const c = document.createElement('canvas')
      c.width = i.width; c.height = i.height
      const x = c.getContext('2d')
      x.drawImage(i, 0, 0)
      // pixel per pixel e non con 'multiply': sugli orli sfumati delle
      // toppe il multiply prende il colore della tinta, e si vede la griglia
      const dati = x.getImageData(0, 0, c.width, c.height)
      const d = dati.data
      const [r, g, b] = [1, 3, 5].map(k => parseInt(v.tinta.slice(k, k + 2), 16) / 255)
      for (let k = 0; k < d.length; k += 4) { d[k] *= r; d[k + 1] *= g; d[k + 2] *= b }
      x.putImageData(dati, 0, 0)
      fogli[chiave] = c
      risolvi()
    }
    i.onerror = () => risolvi()
    i.src = SCENE[v.foglio]
  })
  return attese['foglio:' + chiave]
}
export const fondalePronto = s => !!pronti[s] && !!fogli[s]

const pezzi = s => TUTTI[vesteDi(s).foglio]
const quanti = s => QUANTI[vesteDi(s).foglio]

/* ── dentro un ostacolo ── */
const dentroEllisse = (o, x, y, margine = 0) => {
  const dx = (x - o.x) / Math.max(1, o.rx - margine), dy = (y - o.y) / Math.max(1, o.ry - margine)
  return dx * dx + dy * dy < 1
}

// i massi di una montagna, foglio per foglio: nella palude il pezzo grande
// numero 1 è un albero, il masso è il 2
const MASSI = {
  palude: ['grande:2', 'grande:2', 'decoro:2', 'decoro:1'],
  _: ['grande:1', 'grande:1', 'decoro:2', 'decoro:3'],
}

// Le figure alte di un ostacolo, coi piedi dentro l'ellisse: alberi per un
// bosco, massi e sassi per le rocce. Si calcolano una volta per ostacolo.
const figureDi = new WeakMap()
export function figureOstacolo(o, scenario) {
  let f = figureDi.get(o)
  if (f) return f
  f = []
  if (o.bioma && fogli[o.bioma]) scenario = o.bioma
  const q = quanti(scenario)
  if (o.tipo === 'bosco' || o.tipo === 'rocce') {
    const passo = o.tipo === 'bosco' ? 30 : 24
    const massi = MASSI[vesteDi(scenario).foglio] || MASSI._
    let k = 0
    for (let y = o.y - o.ry; y <= o.y + o.ry; y += passo * 0.8) {
      const riga = Math.round((y - o.y) / (passo * 0.8))
      for (let x = o.x - o.rx + (riga & 1 ? passo / 2 : 0); x <= o.x + o.rx; x += passo) {
        k++
        const jx = x + (caso(k, o.seme, 1) - 0.5) * passo * 0.5
        const jy = y + (caso(k, o.seme, 2) - 0.5) * passo * 0.4
        if (!dentroEllisse(o, jx, jy, o.tipo === 'rocce' ? 12 : 8)) continue
        const v = caso(k, o.seme, 3)
        let nome
        if (o.tipo === 'bosco') nome = v < 0.12 && q.grande ? 'grande:0' : `albero:${Math.floor(v * q.albero)}`
        else nome = massi[Math.floor(v * massi.length)]
        f.push({ nome, x: jx, y: jy, scala: o.tipo === 'rocce' ? (nome.startsWith('grande') ? 1.5 : 1.9) : 1,
                 bioma: scenario })
      }
    }
    f.sort((a, b) => a.y - b.y)
  }
  figureDi.set(o, f)
  return f
}

// una figura dei fogli del terreno col piede in (x, y)
export function disegnaPezzo(ctx, scenario, nome, x, y, scala = 1, alfa = 1) {
  const img = fogli[scenario]
  const r = pezzi(scenario)?.[nome]
  if (!img || !r) return
  const w = r[2] * SCALA * scala, h = r[3] * SCALA * scala
  ctx.globalAlpha = alfa
  ctx.drawImage(img, r[0], r[1], r[2], r[3], x - w / 2, y - h + 6, w, h)
  ctx.globalAlpha = 1
  return h
}

/* ── il fondo di un riquadro, dipinto una volta ──
   Le toppe sfumano sui bordi e si sovrappongono: si dipingono anche
   quelle della cornice di celle intorno, nello stesso ordine in tutti e
   due i riquadri che la dividono, così la giunta non si vede. */
const tenuti = new Map()
function riquadroDipinto(terreno, i, j, scenario) {
  const chiave = `${scenario}:${i},${j}`
  let c = tenuti.get(chiave)
  if (c) return c
  if (!fogli[scenario]) return null
  if (tenuti.size > 14) tenuti.delete(tenuti.keys().next().value)
  // il foglio di un posto, o quello della tappa se non è ancora pronto
  const di = b => (fogli[b] ? b : scenario)
  const lato = RIQUADRO + 2 * BORDO
  const x0 = i * RIQUADRO - BORDO, y0 = j * RIQUADRO - BORDO
  const tela = () => {
    const t = document.createElement('canvas')
    t.width = t.height = Math.ceil(lato * DENSITA)
    const x = t.getContext('2d')
    x.imageSmoothingEnabled = false
    x.scale(DENSITA, DENSITA)
    x.translate(-x0, -y0)
    return [t, x]
  }
  let x
  ;[c, x] = tela()

  // gli ostacoli di qui e dei vicini (le toppe della cornice ci finiscono sopra)
  const ostacoli = []
  for (let b = j - 1; b <= j + 1; b++)
    for (let a = i - 1; a <= i + 1; a++) ostacoli.push(...terreno.riquadro(a, b).ostacoli)
  const sotto = (cx, cy) => ostacoli.find(o => o.tipo === 'bosco' && dentroEllisse(o, cx, cy, -6))

  /* quale posto, punto per punto (ogni PUNTINO punti di mondo): il bordo
     di una macchia segue la sua forma vera, non le celle delle toppe */
  const n = Math.ceil(lato / PUNTINO)
  const mappa = new Array(n * n)
  const presenti = new Set()
  for (let b = 0; b < n; b++)
    for (let a = 0; a < n; a++) {
      const k = di(terreno.bioma(x0 + (a + 0.5) * PUNTINO, y0 + (b + 0.5) * PUNTINO))
      mappa[b * n + a] = k
      presenti.add(k)
    }

  const celle = []
  for (let b = -1; b <= N; b++)
    for (let a = -1; a <= N; a++) celle.push([i * N + a, j * N + b])
  celle.sort((p, q) => caso(p[0], p[1], 5) - caso(q[0], q[1], 5))
  const s = terreno.seme

  // ogni posto si dipinge intero sul suo strato, e si ritaglia con la mappa
  const dipingi = (x, b) => {
    const Q = quanti(b), r = pezzi(b).fondo
    if (r) x.drawImage(fogli[b], r[0], r[1], r[2], r[3], x0, y0, lato, lato)
    for (const [ci, cj] of celle) {
      const cx = (ci + 0.5) * CELLA, cy = (cj + 0.5) * CELLA
      const fiore = rumore(cx / 260, cy / 260, s + 3) < vesteDi(b).fiori * 0.9 && Q.qua
      const nome = sotto(cx, cy) ? `fitto:${Math.floor(caso(ci, cj, 4) * Q.fitto)}`
        : fiore ? `qua:${Math.floor(caso(ci, cj, 8) * Q.qua)}`
        : `prato:${Math.floor(caso(ci, cj, 6) * Q.prato)}`
      const p = pezzi(b)[nome]
      if (p) x.drawImage(fogli[b], p[0], p[1], p[2], p[3], cx - TOPPA / 2, cy - TOPPA / 2, TOPPA, TOPPA)
    }
  }
  dipingi(x, scenario)
  for (const b of presenti) {
    if (b === scenario) continue
    const [t, y] = tela()
    dipingi(y, b)
    const m = document.createElement('canvas')
    m.width = m.height = n
    const mx = m.getContext('2d')
    const dati = mx.createImageData(n, n)
    for (let k = 0; k < n * n; k++) if (mappa[k] === b) dati.data[k * 4 + 3] = 255
    mx.putImageData(dati, 0, 0)
    y.globalCompositeOperation = 'destination-in'
    y.imageSmoothingEnabled = true                 // la maschera sfumata: niente scalini sul bordo
    y.drawImage(m, x0, y0, n * PUNTINO, n * PUNTINO)
    x.save(); x.setTransform(1, 0, 0, 1, 0, 0); x.drawImage(t, 0, 0); x.restore()
  }
  const posa = (nome, px, py, w, h, b = scenario) => {
    const r = pezzi(b)[nome]
    if (r) x.drawImage(fogli[b], r[0], r[1], r[2], r[3], px, py, w ?? r[2] * SCALA, h ?? r[3] * SCALA)
  }

  // le cose piatte per terra, una cella su sette, mai sopra un ostacolo
  for (let b = 0; b < N; b++)
    for (let a = 0; a < N; a++) {
      const ci = i * N + a, cj = j * N + b
      if (caso(ci, cj, 13) > 0.14) continue
      const cx = (ci + caso(ci, cj, 15)) * CELLA, cy = (cj + caso(ci, cj, 16)) * CELLA
      if (ostacoli.some(o => dentroEllisse(o, cx, cy, -20))) continue
      const bb = di(terreno.bioma(cx, cy)), Q = quanti(bb)
      if (!Q.terra) continue
      const r = pezzi(bb)[`terra:${Math.floor(caso(ci, cj, 14) * Q.terra)}`]
      if (r) x.drawImage(fogli[bb], r[0], r[1], r[2], r[3], cx - r[2] * SCALA / 2, cy - r[3] * SCALA / 2,
                         r[2] * SCALA, r[3] * SCALA)
    }

  // l'acqua è piatta: si dipinge qui. Lo stagno del foglio ha la riva
  // intorno, quindi si allarga un po' oltre l'ellisse che ferma
  for (const o of terreno.riquadro(i, j).ostacoli) {
    if (o.tipo !== 'acqua') continue
    const b = di(o.bioma), Pb = pezzi(b)
    posa(o.rx > 105 && Pb.stagno ? 'stagno' : Pb.stagnetto ? 'stagnetto' : 'stagno',
         o.x - o.rx * 1.22, o.y - o.ry * 1.3, o.rx * 2.44, o.ry * 2.5, b)
  }
  tenuti.set(chiave, c)
  return c
}

// Il fondo che si vede: torna false se il foglio non è ancora pronto
export function disegnaFondo(ctx, terreno, scenario, x0, y0, x1, y1) {
  if (!fondalePronto(scenario)) return false
  for (let j = Math.floor(y0 / RIQUADRO); j <= Math.floor(y1 / RIQUADRO); j++)
    for (let i = Math.floor(x0 / RIQUADRO); i <= Math.floor(x1 / RIQUADRO); i++) {
      const c = riquadroDipinto(terreno, i, j, scenario)
      if (c) ctx.drawImage(c, i * RIQUADRO - BORDO, j * RIQUADRO - BORDO,
                           RIQUADRO + 2 * BORDO, RIQUADRO + 2 * BORDO)
    }
  return true
}
