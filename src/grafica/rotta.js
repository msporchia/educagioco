// La mappa dello spazio degli asteroidi: fondo, costellazioni, rotta, pianeti
// e stazioni. Colori piatti, niente sfumature. Riceve fatti già decisi (lo
// stato di ogni tappa), non sa di profili né di tabelline in gioco.
// Le scelte in docs/asteroidi/mappa.md.
import { disegnaNave } from './spazio.js'
import { sorte } from '../motore/asteroidi/rotta.js'

const TAU = Math.PI * 2
export const FONDO = '#0b1029'
const ORO = '#ffd94a', ROTTA_FATTA = '#ffd94a', ROTTA_DA_FARE = '#7d8bc4'
const SPENTO = '#4a5274', LUCCHETTO = '#c3cbe6'

/* I pianeti, uno per tabellina (la `nuova` della tappa; 0 è il Sole).
   corpo, bande, crateri, macchie (le terre), anello, luna. */
const PIANETI = {
  2: { corpo: '#4f9cf0', bande: ['#438bdc'], macchie: '#63c98f' },
  10: { corpo: '#ece0b6', crateri: '#d4c48e' },
  5: { corpo: '#eab673', bande: ['#d59a55', '#f4cf98', '#d59a55'], anello: '#cdb78c' },
  3: { corpo: '#e3624a', bande: ['#cc4d37'], crateri: '#b94531' },
  4: { corpo: '#58c48b', bande: ['#45a974', '#7ad6a4'] },
  6: { corpo: '#f2c24f', bande: ['#e1a83a', '#f7d77f'], anello: '#f6e2a8' },
  7: { corpo: '#9d7ef0', bande: ['#8261de', '#b79ff7'], luna: '#ddd4ff' },
  8: { corpo: '#4565d8', bande: ['#3651bd', '#6b87e8'], anello: '#a3b5f3' },
  9: { corpo: '#b8865c', bande: ['#a57349'], crateri: '#966845' },
  0: { sole: true, corpo: '#ffcd3c', dentro: '#ffe27a', raggi: '#ffaf24' },
}
// gli accenti delle stazioni, a turno
const ACCENTI = ['#ff8a5c', '#4fd1c5', '#ffd94a', '#b18cff', '#ff6f91', '#7fe3ff']

// il raggio da toccare e la metà della larghezza (l'anello e i pannelli sporgono): lo legge la disposizione
export function ingombro(v) {
  const d = v.disegno || v
  if (d.tipo === 'volo') return { r: 40, mezzo: 46 }
  if (d.tipo === 'mente') return { r: 27, mezzo: 27 * 1.55 }
  const P = PIANETI[d.nuova || 0] || PIANETI[0]
  if (P.sole) return { r: 36, mezzo: 36 * 1.3 }
  return { r: 29, mezzo: P.anello ? 29 * 1.72 : P.luna ? 29 * 1.45 : 29 }
}

// `stati[k]`: fatta | ora | aperta | chiusa; `fino`: il nodo del razzo, dove la rotta smette d'essere d'oro
export function dipingiRotta(canvas, quadro, { stati, disegni, fino }) {
  const dpr = Math.min(2, (typeof window !== 'undefined' && window.devicePixelRatio) || 1)
  canvas.width = Math.floor(quadro.W * dpr)
  canvas.height = Math.floor(quadro.H * dpr)
  canvas.style.width = quadro.W + 'px'
  canvas.style.height = quadro.H + 'px'
  const ctx = canvas.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.fillStyle = FONDO
  ctx.fillRect(0, 0, quadro.W, quadro.H)
  for (const s of quadro.stelle) {
    ctx.globalAlpha = s.a
    ctx.fillStyle = s.tinta ? '#a9c8ff' : '#ffffff'
    ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, TAU); ctx.fill()
  }
  ctx.globalAlpha = 1
  for (const t of quadro.titoli) costellazione(ctx, t)
  rotta(ctx, quadro, fino)
  quadro.nodi.forEach((n, k) => {
    const stato = stati[k] || 'chiusa'
    nodo(ctx, n, disegni[k], stato === 'chiusa')
    if (stato === 'chiusa') lucchetto(ctx, n.x, n.y, n.r * 0.42)
    if (stato === 'fatta') stella(ctx, n.x + n.r * 0.78, n.y - n.r * 0.78, 9)
  })
}

// la rotta: d'oro fin dove si è arrivati, tenue dopo
function rotta(ctx, quadro, fino) {
  const p = quadro.punti
  const taglio = quadro.nodi[Math.max(0, Math.min(quadro.nodi.length - 1, fino))].punto
  const tratto = (da, a, colore, alfa) => {
    if (a <= da) return
    ctx.beginPath()
    ctx.moveTo(p[da][0], p[da][1])
    for (let i = da + 1; i <= a; i++) ctx.lineTo(p[i][0], p[i][1])
    ctx.globalAlpha = alfa
    ctx.strokeStyle = colore
    ctx.stroke()
  }
  ctx.save()
  ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  ctx.setLineDash([1, 10])
  tratto(taglio, p.length - 1, ROTTA_DA_FARE, 0.55)
  ctx.setLineDash([7, 8])
  tratto(0, taglio, ROTTA_FATTA, 0.9)
  ctx.restore()
}

// il nome di un capitolo è una costellazione: qualche stella unita da un filo
function costellazione(ctx, t) {
  const caso = sorte(101 + t.cap * 37)
  const quante = 4 + Math.floor(caso() * 2)
  const largo = Math.min(96, t.largo * 0.8)
  const x0 = t.lato > 0 ? t.x + 4 : t.x - 4 - largo
  const stelle = []
  for (let i = 0; i < quante; i++)
    stelle.push([x0 + (i + 0.3 + caso() * 0.4) * largo / quante, t.y - 30 + caso() * 18])
  ctx.save()
  ctx.strokeStyle = '#8fa0d8'; ctx.globalAlpha = 0.35; ctx.lineWidth = 1
  ctx.beginPath()
  stelle.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)))
  ctx.stroke()
  ctx.globalAlpha = 0.9; ctx.fillStyle = '#dfe6ff'
  for (const [x, y] of stelle) { ctx.beginPath(); ctx.arc(x, y, 1.9, 0, TAU); ctx.fill() }
  ctx.restore()
}

// chiuso si sbiadisce a mano (tela a parte, source-atop): `ctx.filter` su Safari non c'è
function nodo(ctx, n, disegno, chiuso) {
  if (!chiuso) return figura(ctx, n.x, n.y, n.r, disegno)
  const lato = Math.ceil((n.mezzo + n.r) * 2.4)
  const cv = document.createElement('canvas')
  const dpr = ctx.getTransform().a || 1
  cv.width = cv.height = Math.ceil(lato * dpr)
  const c = cv.getContext('2d')
  c.setTransform(dpr, 0, 0, dpr, 0, 0)
  figura(c, lato / 2, lato / 2, n.r, disegno)
  c.globalCompositeOperation = 'source-atop'
  c.globalAlpha = 0.72
  c.fillStyle = SPENTO
  c.fillRect(0, 0, lato, lato)
  ctx.save()
  ctx.globalAlpha = 0.6
  ctx.drawImage(cv, n.x - lato / 2, n.y - lato / 2, lato, lato)
  ctx.restore()
}

// quale figura: un pianeta (per tabellina), una stazione (per indice), il volo
function figura(ctx, x, y, r, d) {
  if (d.tipo === 'volo') return galassia(ctx, x, y, r)
  if (d.tipo === 'mente') return stazione(ctx, x, y, r, d.i, d.ultima)
  return pianeta(ctx, x, y, r, PIANETI[d.nuova || 0] || PIANETI[0])
}

function cerchio(ctx, x, y, r, colore) {
  ctx.fillStyle = colore
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill()
}

function pianeta(ctx, x, y, r, P) {
  if (P.sole) return sole(ctx, x, y, r, P)
  const inclina = -0.32
  if (P.anello) anello(ctx, x, y, r, P.anello, inclina, true)
  ctx.save()
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.clip()
  cerchio(ctx, x, y, r, P.corpo)
  ctx.translate(x, y); ctx.rotate(inclina)
  ;(P.bande || []).forEach((b, i, tutte) => {
    const h = r * 0.26, y0 = -r * 0.62 + i * (r * 1.3 / Math.max(1, tutte.length))
    ctx.fillStyle = b
    ctx.fillRect(-r * 1.2, y0 + (tutte.length === 1 ? r * 0.45 : 0), r * 2.4, h)
  })
  if (P.macchie) {
    ctx.fillStyle = P.macchie
    for (const [mx, my, mr] of [[-0.42, -0.28, 0.34], [-0.16, -0.38, 0.24], [0.38, 0.32, 0.3], [0.22, 0.5, 0.2]]) {
      ctx.beginPath(); ctx.arc(mx * r, my * r, mr * r, 0, TAU); ctx.fill()
    }
  }
  if (P.crateri) {
    ctx.fillStyle = P.crateri
    for (const [cx, cy, cr] of [[-0.35, -0.3, 0.2], [0.3, 0.1, 0.14], [-0.05, 0.45, 0.12], [0.42, -0.42, 0.09]]) {
      ctx.beginPath(); ctx.arc(cx * r, cy * r, cr * r, 0, TAU); ctx.fill()
    }
  }
  ctx.restore()
  // l'ombra: una falce piatta dalla parte opposta alla luce
  ctx.save()
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.clip()
  ctx.globalAlpha = 0.2
  ctx.fillStyle = '#0b1029'
  ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.arc(x - r * 0.3, y - r * 0.3, r * 1.02, 0, TAU, true); ctx.fill()
  ctx.restore()
  if (P.anello) anello(ctx, x, y, r, P.anello, inclina, false)
  if (P.luna) cerchio(ctx, x + r * 1.18, y - r * 0.82, r * 0.22, P.luna)
}

// l'anello in due metà: quella dietro prima del pianeta, quella davanti dopo
function anello(ctx, x, y, r, colore, inclina, dietro) {
  ctx.save()
  ctx.translate(x, y); ctx.rotate(inclina)
  ctx.strokeStyle = colore; ctx.lineWidth = r * 0.16
  ctx.beginPath()
  if (dietro) ctx.ellipse(0, 0, r * 1.62, r * 0.42, 0, Math.PI, TAU)
  else ctx.ellipse(0, 0, r * 1.62, r * 0.42, 0, 0, Math.PI)
  ctx.stroke()
  ctx.restore()
}

function sole(ctx, x, y, r, P) {
  ctx.save()
  ctx.translate(x, y)
  ctx.fillStyle = P.raggi
  for (let i = 0; i < 12; i++) {
    ctx.rotate(TAU / 12)
    ctx.beginPath(); ctx.moveTo(-r * 0.2, -r * 0.9); ctx.lineTo(0, -r * 1.3); ctx.lineTo(r * 0.2, -r * 0.9); ctx.fill()
  }
  ctx.restore()
  cerchio(ctx, x, y, r, P.corpo)
  cerchio(ctx, x - r * 0.12, y - r * 0.12, r * 0.66, P.dentro)
}

// una stazione cresce lungo la fila: più pannelli, l'antenna, il secondo modulo; l'ultima ha la stella
function stazione(ctx, x, y, r, i, ultima) {
  const accento = ACCENTI[i % ACCENTI.length]
  const coppie = i < 3 ? 1 : i < 7 ? 2 : 3
  ctx.save()
  ctx.translate(x, y); ctx.rotate(-0.22)
  // i bracci
  ctx.strokeStyle = '#9aa6c4'; ctx.lineWidth = Math.max(1.5, r * 0.08)
  ctx.beginPath(); ctx.moveTo(-r * 1.45, 0); ctx.lineTo(r * 1.45, 0); ctx.stroke()
  // i pannelli: una fila per coppia, sopra e sotto il braccio
  const pw = r * 0.62, ph = coppie === 1 ? r * 0.7 : r * 0.42
  const righe = coppie === 1 ? [-ph / 2] : coppie === 2 ? [-ph - 1, 1] : [-ph * 1.5 - 1, -ph / 2, ph / 2 + 1]
  for (const verso of [-1, 1]) {
    for (const ry of righe) {
      const px = verso < 0 ? -r * 1.45 : r * 1.45 - pw
      ctx.fillStyle = '#2f4fa8'; ctx.fillRect(px, ry, pw, ph)
      ctx.strokeStyle = '#6f8de0'; ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(px + pw / 2, ry); ctx.lineTo(px + pw / 2, ry + ph)
      ctx.moveTo(px, ry + ph / 2); ctx.lineTo(px + pw, ry + ph / 2)
      ctx.stroke()
    }
  }
  // l'antenna, dalla quarta stazione
  if (i >= 3) {
    ctx.strokeStyle = '#c9d2ea'; ctx.lineWidth = 1.6
    ctx.beginPath(); ctx.moveTo(0, -r * 0.4); ctx.lineTo(0, -r * 0.95); ctx.stroke()
    cerchio(ctx, 0, -r * 0.98, 2.4, accento)
  }
  // il secondo modulo, dalla sesta
  if (i >= 5) {
    ctx.fillStyle = '#c3cce2'
    tondoRett(ctx, -r * 0.2, r * 0.3, r * 0.4, r * 0.5, 3); ctx.fill()
  }
  // il modulo in mezzo
  ctx.fillStyle = '#e4e9f5'
  tondoRett(ctx, -r * 0.4, -r * 0.42, r * 0.8, r * 0.84, r * 0.2); ctx.fill()
  ctx.fillStyle = accento
  ctx.fillRect(-r * 0.4, -r * 0.08, r * 0.8, r * 0.16)
  cerchio(ctx, 0, -r * 0.22, r * 0.12, '#2a3a6e')
  ctx.restore()
  if (ultima) stella(ctx, x, y - r * 1.15, 8)
}

function tondoRett(ctx, x, y, w, h, r) {
  ctx.beginPath()
  ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r)
  ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r)
  ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r)
  ctx.closePath()
}

// il volo infinito: una galassia a spirale, bracci piatti attorno a un cuore
function galassia(ctx, x, y, r) {
  ctx.save()
  ctx.translate(x, y); ctx.scale(1, 0.72); ctx.rotate(-0.4)
  cerchio(ctx, 0, 0, r * 0.98, '#1a1f4a')
  const bracci = [['#7a5cff', 0], ['#ff6fb1', Math.PI]]
  ctx.lineCap = 'round'
  for (const [colore, da] of bracci) {
    for (const [spessore, alfa] of [[r * 0.34, 0.35], [r * 0.16, 1]]) {
      ctx.strokeStyle = colore; ctx.globalAlpha = alfa; ctx.lineWidth = spessore
      ctx.beginPath()
      for (let t = 0; t <= 1.001; t += 0.05) {
        const a = da + t * Math.PI * 1.25, rr = r * (0.18 + t * 0.78)
        const px = Math.cos(a) * rr, py = Math.sin(a) * rr
        t ? ctx.lineTo(px, py) : ctx.moveTo(px, py)
      }
      ctx.stroke()
    }
  }
  ctx.globalAlpha = 1
  cerchio(ctx, 0, 0, r * 0.26, '#ffe9a8')
  cerchio(ctx, 0, 0, r * 0.13, '#ffffff')
  ctx.restore()
}

// la stella di «superata»: piatta, d'oro, col bordo scuro per staccarsi dal disegno
export function stella(ctx, x, y, R) {
  ctx.save()
  ctx.beginPath()
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? R * 0.45 : R
    const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr
    i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)
  }
  ctx.closePath()
  ctx.lineWidth = 2.5; ctx.strokeStyle = FONDO; ctx.lineJoin = 'round'; ctx.stroke()
  ctx.fillStyle = ORO; ctx.fill()
  ctx.restore()
}

function lucchetto(ctx, x, y, s) {
  ctx.save()
  ctx.strokeStyle = LUCCHETTO; ctx.lineWidth = s * 0.28
  ctx.beginPath(); ctx.arc(x, y - s * 0.2, s * 0.48, Math.PI, TAU); ctx.lineTo(x + s * 0.48, y + s * 0.1)
  ctx.moveTo(x - s * 0.48, y - s * 0.2); ctx.lineTo(x - s * 0.48, y + s * 0.1); ctx.stroke()
  ctx.fillStyle = LUCCHETTO
  tondoRett(ctx, x - s * 0.8, y, s * 1.6, s * 1.2, s * 0.22); ctx.fill()
  cerchio(ctx, x, y + s * 0.55, s * 0.17, FONDO)
  ctx.restore()
}

/* ═══════════ il razzo ═══════════ */

export const LATO_RAZZO = 64     // la sua tela, in px CSS

// è la nave della partita, girata verso dove va; `spinta` accende i motori
export function dipingiRazzo(canvas, { angolo = -Math.PI / 2, spinta = 0, t = 0 } = {}) {
  const dpr = Math.min(2, (typeof window !== 'undefined' && window.devicePixelRatio) || 1)
  const px = Math.floor(LATO_RAZZO * dpr)
  if (canvas.width !== px) { canvas.width = px; canvas.height = px }
  const ctx = canvas.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, LATO_RAZZO, LATO_RAZZO)
  ctx.translate(LATO_RAZZO / 2, LATO_RAZZO / 2)
  ctx.rotate(angolo + Math.PI / 2)
  disegnaNave(ctx, { x: 0, y: 0, r: 15, lv: 1, danno: 0, t, spinta: spinta - 0.7, mira: -Math.PI / 2 })
}
