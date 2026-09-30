// La mappa del tesoro su canvas: la pergamena, il mare basso, le isole dei
// mondi, i sentieri tratteggiati e i medaglioni delle tappe coi loro
// disegnini. Non sa niente di regole né di geometria: riceve la disposizione
// già fatta (disposizione.js), con le coste, lo stato di ogni nodo deciso
// (vinta, aperta, chiusa, in arrivo) e il grado. I nomi e i tasti li mette
// sopra la vista, in HTML; la nave ha la sua tela (nave.js).
import { pennello } from '../../../grafica/tela.js'
import { mescola, dado } from '../../../grafica/comune.js'
import { PITTORI, lucchetto } from './pittori.js'
import { spazioIn } from './rotte.js'

export const PERGAMENA = '#efe0bb'
export const INCHIOSTRO = '#4a3222'
const TERRA = { aperto: '#d8d397', chiuso: '#ddd0a0', arrivo: '#e6dbbb' }
const SABBIA = { aperto: '#efdfae', chiuso: '#eddfb5', arrivo: '#efe3c4' }
// quanto l'inchiostro di un'isola è pieno: un mondo in arrivo è appena abbozzato
const TINTA = { aperto: 1, chiuso: 0.8, arrivo: 0.45 }
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

// una linea chiusa, morbida: curve dal mezzo di ogni lato al mezzo del successivo
function anello(ctx, a) {
  const n = a.length
  const mx = i => (a[i % n][0] + a[(i + 1) % n][0]) / 2, my = i => (a[i % n][1] + a[(i + 1) % n][1]) / 2
  ctx.moveTo(mx(n - 1), my(n - 1))
  for (let i = 0; i < n; i++) ctx.quadraticCurveTo(a[i][0], a[i][1], mx(i), my(i))
  ctx.closePath()
}
function aperta(ctx, a) {
  ctx.moveTo(a[0][0], a[0][1])
  for (let i = 1; i < a.length - 1; i++)
    ctx.quadraticCurveTo(a[i][0], a[i][1], (a[i][0] + a[i + 1][0]) / 2, (a[i][1] + a[i + 1][1]) / 2)
  ctx.lineTo(a[a.length - 1][0], a[a.length - 1][1])
}

// il mare basso: righe che seguono la costa, sempre più tenui verso il largo
function mareBasso(ctx, q) {
  const tinte = [0.34, 0.2, 0.11]
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  q.mareBasso.forEach(({ anelli }, k) => {
    ctx.strokeStyle = `rgba(74,50,34,${tinte[k] ?? 0.1})`; ctx.lineWidth = k ? 0.9 : 1.1
    ctx.beginPath()
    for (const a of anelli) {
      // al bordo della carta la riga si interrompe: non è una costa
      let pezzo = []
      const chiudi = () => { if (pezzo.length > 2) aperta(ctx, pezzo); pezzo = [] }
      for (const p of [...a, a[0]]) {
        if (p[0] < 4 || p[1] < 4 || p[0] > q.W - 4 || p[1] > q.H - 4) chiudi()
        else pezzo.push(p)
      }
      chiudi()
    }
    ctx.stroke()
  })
}

// il tratteggio lungo la costa dal lato in ombra (sud-est), come nelle carte vecchie
function ombraDellaCosta(ctx, a, alfa) {
  ctx.beginPath()
  const n = a.length
  for (let i = 0; i < n; i += 2) {
    const [x1, y1] = a[(i - 1 + n) % n], [x2, y2] = a[(i + 1) % n]
    const l = Math.hypot(x2 - x1, y2 - y1) || 1
    const ox = (y2 - y1) / l, oy = -(x2 - x1) / l          // verso il mare (anelli con area positiva)
    const sole = ox * 0.55 + oy * 0.83
    if (sole < 0.2) continue
    const lung = 3 + sole * 6 * (0.7 + dado(i, 3, 17) * 0.6)
    ctx.moveTo(a[i][0] - ox * 1.5, a[i][1] - oy * 1.5); ctx.lineTo(a[i][0] - ox * lung, a[i][1] - oy * lung)
  }
  ctx.strokeStyle = `rgba(74,50,34,${0.32 * alfa})`; ctx.lineWidth = 0.9; ctx.stroke()
}

function isole(ctx, elenco) {
  for (const is of elenco) {
    const stato = is.stato || 'chiuso', alfa = TINTA[stato] ?? 1
    const tutti = [is.costa, ...is.isolotti].filter(Boolean)
    const terra = new Path2D()
    for (const a of tutti) anello(terra, a)
    ctx.fillStyle = TERRA[stato] || TERRA.chiuso; ctx.fill(terra)
    ctx.save(); ctx.clip(terra)
    // la sabbia: una striscia chiara appena dentro la costa
    ctx.strokeStyle = SABBIA[stato] || SABBIA.chiuso; ctx.lineWidth = 13; ctx.stroke(terra)
    ctx.fillStyle = `rgba(150,120,60,${0.22 * alfa})`
    for (const a of tutti) for (let i = 0; i < a.length; i += 3) {
      const d = 2 + dado(i, 7, is.seme) * 4, q = dado(i, 8, is.seme)
      const [x1, y1] = a[i], [x2, y2] = a[(i + 1) % a.length]
      const l = Math.hypot(x2 - x1, y2 - y1) || 1
      ctx.fillRect(x1 - (y2 - y1) / l * d + q, y1 + (x2 - x1) / l * d - q, 0.9, 0.9)
    }
    for (const a of tutti) ombraDellaCosta(ctx, a, alfa)
    ctx.restore()
    // la costa, tracciata una volta sola
    ctx.strokeStyle = mescola(INCHIOSTRO, PERGAMENA, 1 - alfa * 0.95)
    ctx.lineWidth = stato === 'arrivo' ? 1.5 : 2; ctx.lineJoin = 'round'
    if (stato === 'arrivo') ctx.setLineDash([6, 4])
    ctx.stroke(terra); ctx.setLineDash([])
  }
}

// alberelli, monticelli e ciuffi a inchiostro, dove la terra è libera
function decori(ctx, q) {
  const stati = new Map(q.isole.map(is => [is.mondo, is.stato]))
  for (const d of q.decori) {
    const stato = stati.get(d.mondo) || 'chiuso', alfa = TINTA[stato] ?? 1
    const ink = mescola(INCHIOSTRO, TERRA[stato] || TERRA.chiuso, 1 - alfa * 0.85)
    const tinta = c => mescola(c, TERRA[stato] || TERRA.chiuso, 1 - alfa * 0.8)
    const s = d.s
    ctx.save(); ctx.translate(d.x, d.y); ctx.scale(s, s)
    ctx.strokeStyle = ink; ctx.lineWidth = 1.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
    if (d.tipo === 'albero') {
      ctx.beginPath(); ctx.moveTo(0, 6); ctx.lineTo(0, 0); ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(-5, 1); ctx.quadraticCurveTo(-8, -4, -3, -6); ctx.quadraticCurveTo(0, -11, 3, -6)
      ctx.quadraticCurveTo(8, -4, 5, 1); ctx.closePath()
      ctx.fillStyle = tinta('#8fae62'); ctx.fill(); ctx.stroke()
    } else if (d.tipo === 'monte') {
      ctx.beginPath(); ctx.moveTo(-10, 5); ctx.quadraticCurveTo(-3, -9, 0, -8); ctx.quadraticCurveTo(4, -8, 10, 5)
      ctx.fillStyle = tinta('#cdb47c'); ctx.fill(); ctx.stroke()
      ctx.beginPath()
      for (const x of [2.5, 5, 7.5]) { ctx.moveTo(x, -4 + x * 0.6); ctx.lineTo(x - 1.5, 4) }
      ctx.lineWidth = 0.8; ctx.stroke()
    } else {
      ctx.beginPath(); ctx.moveTo(-3, 3); ctx.lineTo(-4, -2); ctx.moveTo(0, 3); ctx.lineTo(0, -3.5)
      ctx.moveTo(3, 3); ctx.lineTo(4, -2); ctx.lineWidth = 1; ctx.stroke()
    }
    ctx.restore()
  }
}

// qualche onda nel mare aperto, lontano dalle coste
function onde(ctx, q) {
  ctx.strokeStyle = 'rgba(74,50,34,.35)'; ctx.lineWidth = 1.3; ctx.lineCap = 'round'
  const n = Math.round(q.H / 60)
  for (let i = 0; i < n * 4 && i < 400; i++) {
    const x = 16 + dado(i, 11, 5) * (q.W - 32), y = 20 + dado(i, 12, 5) * (q.H - 40)
    if (spazioIn(q.mare, x, y) < 30) continue
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
    ctx.beginPath()
    if (s.tratti) for (const t of s.tratti) aperta(ctx, t)
    else { ctx.moveTo(s.da.x, s.da.y); ctx.quadraticCurveTo(s.ctrl.x, s.ctrl.y, s.a.x, s.a.y) }
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
  mareBasso(ctx, quadro)
  // le rotte fra i mondi sono per mare: vanno da un porto all'altro, attorno alla terra
  sentieri(ctx, quadro.sentieri.filter(s => s.tipo === 'fra'))
  isole(ctx, quadro.isole)
  decori(ctx, quadro)
  rosa(ctx, quadro.rosa.x, quadro.rosa.y, 22)
  sentieri(ctx, quadro.sentieri.filter(s => s.tipo !== 'fra'))
  const p = pennello(ctx, { W: quadro.W, H: quadro.H, S: 1 })
  for (const n of quadro.nodi) medaglione(p, n)
}
