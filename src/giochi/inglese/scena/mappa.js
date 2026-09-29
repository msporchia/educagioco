// La mappa del tesoro su canvas: la pergamena, le isole dei mondi, i
// sentieri tratteggiati e i medaglioni delle tappe coi loro disegnini. Non
// sa niente di regole: riceve la disposizione già fatta (disposizione.js),
// con lo stato di ogni nodo deciso (vinta, aperta, chiusa, in arrivo) e il
// grado. I nomi e i tasti li mette sopra la vista, in HTML.
import { pennello } from '../../../grafica/tela.js'
import { mescola, dado } from '../../../grafica/comune.js'
import { PITTORI, lucchetto } from './pittori.js'

export const PERGAMENA = '#efe0bb'
export const INCHIOSTRO = '#4a3222'
const TERRA = { aperto: '#dfd79c', chiuso: '#e0d3a6', arrivo: '#e6dbbd' }
const SENTIERO = '#8a3b1c'
const GRADO_PIENO = '#2f8a4c'
const GIRO = Math.PI * 2

// quanto un disegno è sbiadito verso la pergamena: il grado lo riempie
export function sbiadito(n) {
  if (n.stato === 'arrivo') return 0.86
  if (n.stato === 'chiusa') return 0.8
  if (n.tipo !== 'tappa') return 0.08
  return 0.7 * (1 - Math.max(0, Math.min(10, n.grado || 0)) / 10)
}

function pergamena(ctx, W, H) {
  const g = ctx.createLinearGradient(0, 0, W * 0.3, H)
  g.addColorStop(0, '#f3e6c4'); g.addColorStop(0.5, PERGAMENA); g.addColorStop(1, '#e8d6ab')
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
  // le macchie: la carta vecchia non è mai di un colore solo
  const n = Math.round(W * H / 7000)
  for (let i = 0; i < n; i++) {
    const x = dado(i, 1, 9) * W, y = dado(i, 2, 9) * H, r = 18 + dado(i, 3, 9) * 70
    const m = ctx.createRadialGradient(x, y, 0, x, y, r)
    const a = 0.04 + dado(i, 4, 9) * 0.08
    m.addColorStop(0, `rgba(150,110,50,${a})`); m.addColorStop(1, 'rgba(150,110,50,0)')
    ctx.fillStyle = m; ctx.fillRect(x - r, y - r, 2 * r, 2 * r)
  }
  // le fibre
  ctx.strokeStyle = 'rgba(120,85,40,.10)'; ctx.lineWidth = 0.8
  for (let i = 0; i < n * 3; i++) {
    const x = dado(i, 5, 9) * W, y = dado(i, 6, 9) * H, l = 4 + dado(i, 7, 9) * 10
    const a = dado(i, 8, 9) * GIRO
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); ctx.stroke()
  }
  // i bordi bruciacchiati
  const lato = (x0, x1) => {
    const b = ctx.createLinearGradient(x0, 0, x1, 0)
    b.addColorStop(0, 'rgba(110,70,25,.38)'); b.addColorStop(1, 'rgba(110,70,25,0)')
    ctx.fillStyle = b; ctx.fillRect(Math.min(x0, x1), 0, Math.abs(x1 - x0), H)
  }
  lato(0, 18); lato(W, W - 18)
  const su = ctx.createLinearGradient(0, 0, 0, 16); su.addColorStop(0, 'rgba(110,70,25,.3)'); su.addColorStop(1, 'rgba(110,70,25,0)')
  ctx.fillStyle = su; ctx.fillRect(0, 0, W, 16)
}

function isole(ctx, elenco) {
  const passata = (fn) => { for (const is of elenco) for (const c of is.cerchi) fn(is, c) }
  passata((is, c) => { ctx.beginPath(); ctx.arc(c.x, c.y, c.r + 9, 0, GIRO)
                       ctx.fillStyle = `rgba(74,50,34,${is.stato === 'arrivo' ? 0.04 : 0.08})`; ctx.fill() })
  passata((is, c) => { ctx.beginPath(); ctx.arc(c.x, c.y, c.r + 2.4, 0, GIRO)
                       ctx.fillStyle = is.stato === 'arrivo' ? 'rgba(74,50,34,.28)' : 'rgba(74,50,34,.7)'; ctx.fill() })
  passata((is, c) => { ctx.beginPath(); ctx.arc(c.x, c.y, c.r, 0, GIRO)
                       ctx.fillStyle = TERRA[is.stato] || TERRA.chiuso; ctx.fill() })
}

// qualche onda nel mare, dove non c'è terra
function onde(ctx, q) {
  const libero = (x, y) => q.isole.every(is => is.cerchi.every(c => Math.hypot(c.x - x, c.y - y) > c.r + 22))
  ctx.strokeStyle = 'rgba(74,50,34,.35)'; ctx.lineWidth = 1.3; ctx.lineCap = 'round'
  const n = Math.round(q.H / 60)
  for (let i = 0; i < n * 4 && i < 400; i++) {
    const x = 16 + dado(i, 11, 5) * (q.W - 32), y = 20 + dado(i, 12, 5) * (q.H - 40)
    if (!libero(x, y)) continue
    ctx.beginPath()
    ctx.moveTo(x - 9, y); ctx.quadraticCurveTo(x - 4.5, y - 4, x, y); ctx.quadraticCurveTo(x + 4.5, y + 4, x + 9, y)
    ctx.stroke()
  }
}

function rosa(ctx, x, y, r) {
  ctx.save(); ctx.translate(x, y)
  ctx.strokeStyle = INCHIOSTRO; ctx.lineWidth = 1.2
  ctx.beginPath(); ctx.arc(0, 0, r * 0.62, 0, GIRO); ctx.stroke()
  for (let i = 0; i < 8; i++) {
    const a = i / 8 * GIRO - Math.PI / 2, l = i % 2 ? r * 0.55 : r
    ctx.beginPath(); ctx.moveTo(Math.cos(a - 0.3) * r * 0.16, Math.sin(a - 0.3) * r * 0.16)
    ctx.lineTo(Math.cos(a) * l, Math.sin(a) * l)
    ctx.lineTo(Math.cos(a + 0.3) * r * 0.16, Math.sin(a + 0.3) * r * 0.16); ctx.closePath()
    ctx.fillStyle = i === 0 ? '#b0412a' : i % 2 ? 'rgba(74,50,34,.35)' : 'rgba(74,50,34,.7)'
    ctx.fill(); ctx.stroke()
  }
  ctx.fillStyle = INCHIOSTRO; ctx.font = `700 ${Math.round(r * 0.5)}px Georgia, serif`
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('N', 0, -r - 8)
  ctx.restore()
}

function sentieri(ctx, elenco) {
  ctx.lineCap = 'round'
  for (const s of elenco) {
    ctx.beginPath(); ctx.moveTo(s.da.x, s.da.y); ctx.quadraticCurveTo(s.ctrl.x, s.ctrl.y, s.a.x, s.a.y)
    if (s.battuto) { ctx.strokeStyle = SENTIERO; ctx.lineWidth = 3.2; ctx.setLineDash([8, 6]) }
    else { ctx.strokeStyle = 'rgba(74,50,34,.5)'; ctx.lineWidth = 2; ctx.setLineDash([3, 7]) }
    ctx.stroke()
  }
  ctx.setLineDash([])
}

function medaglione(p, n) {
  const ctx = p.ctx
  const q = sbiadito(n)
  const c = { t: col => mescola(col, PERGAMENA, q),
              inchiostro: mescola(INCHIOSTRO, PERGAMENA, n.stato === 'chiusa' || n.stato === 'arrivo' ? 0.45 : 0) }
  ctx.save(); ctx.translate(n.x, n.y)
  // il fondo del medaglione, con l'ombra sotto
  ctx.beginPath(); ctx.arc(1.5, 3, n.r, 0, GIRO); ctx.fillStyle = 'rgba(74,50,34,.25)'; ctx.fill()
  ctx.beginPath(); ctx.arc(0, 0, n.r, 0, GIRO); ctx.fillStyle = '#f8efd6'; ctx.fill()
  ctx.lineWidth = n.stato === 'vinta' ? 3 : 2
  ctx.strokeStyle = n.stato === 'vinta' ? '#b8862b' : c.inchiostro
  if (n.stato === 'arrivo') ctx.setLineDash([4, 4])
  ctx.stroke(); ctx.setLineDash([])
  // il disegno, dentro il medaglione
  ctx.save(); ctx.beginPath(); ctx.arc(0, 0, n.r - 1.5, 0, GIRO); ctx.clip()
  const s = (n.r * 0.86) / 40
  ctx.scale(s, s)
  const pittore = PITTORI[n.disegno]
  if (pittore) pittore(p, c)
  ctx.restore()
  // il grado: dieci tacche attorno, piene quante il grado
  if (n.tipo === 'tappa' && n.stato !== 'chiusa') {
    const R = n.r + 5.5
    for (let i = 0; i < 10; i++) {
      const a0 = -Math.PI / 2 + i / 10 * GIRO + 0.07, a1 = a0 + GIRO / 10 - 0.14
      ctx.beginPath(); ctx.arc(0, 0, R, a0, a1)
      ctx.lineWidth = 4.2; ctx.lineCap = 'round'
      ctx.strokeStyle = i < (n.grado || 0) ? GRADO_PIENO : 'rgba(74,50,34,.18)'
      ctx.stroke()
    }
  }
  if (n.stato === 'chiusa') lucchetto(p, c, n.r * 0.62, n.r * 0.62)
  ctx.restore()
}

// Tutto in un colpo: la mappa è ferma, si ridipinge solo quando cambia
// lo stato o la larghezza.
export function dipingiMappa(canvas, quadro) {
  const dpr = Math.min(2, (typeof window !== 'undefined' && window.devicePixelRatio) || 1)
  canvas.width = Math.floor(quadro.W * dpr)
  canvas.height = Math.floor(quadro.H * dpr)
  canvas.style.width = quadro.W + 'px'
  canvas.style.height = quadro.H + 'px'
  const ctx = canvas.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  pergamena(ctx, quadro.W, quadro.H)
  onde(ctx, quadro)
  // le rotte fra i mondi stanno sul mare, sotto la terra: arrivano alla costa, non attraversano il libro
  sentieri(ctx, quadro.sentieri.filter(s => s.tipo === 'fra'))
  isole(ctx, quadro.isole)
  rosa(ctx, 44, quadro.H - 58, 22)
  sentieri(ctx, quadro.sentieri.filter(s => s.tipo !== 'fra'))
  const p = pennello(ctx, { W: quadro.W, H: quadro.H, S: 1 })
  for (const n of quadro.nodi) medaglione(p, n)
}
