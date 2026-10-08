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
// Il carattere di un'isola (`paesaggio` del mondo): la terra, la sabbia e i
// decori. Chiusa, la terra va verso la pergamena ma resta riconoscibile.
// Vedi docs/lingue/mondi-vista.md («Le isole»).
const PAESAGGI = {
  primavera: { terra: '#c3db8c', sabbia: '#ecebb6' },
  estate: { terra: '#ecd28a', sabbia: '#f7e9bd' },
  autunno: { terra: '#dcb877', sabbia: '#eedaa8' },
  inverno: { terra: '#e9eff0', sabbia: '#f6f8f7' },
  vulcano: { terra: '#c9c1b2', sabbia: '#ddd5c4' },
  nuvole: { terra: '#d9cdea', sabbia: '#ece5f4' },
}
const SBIADISCE = { aperto: 0, chiuso: 0.5, arrivo: 0.75 }
const coloreDi = (is, chi, base) => {
  const p = PAESAGGI[is.paesaggio]
  const stato = is.stato || 'chiuso'
  return p ? mescola(p[chi], PERGAMENA, SBIADISCE[stato] ?? 0.5) : (base[stato] || base.chiuso)
}
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
    ctx.fillStyle = coloreDi(is, 'terra', TERRA); ctx.fill(terra)
    ctx.save(); ctx.clip(terra)
    // la sabbia: una striscia chiara appena dentro la costa
    ctx.strokeStyle = coloreDi(is, 'sabbia', SABBIA); ctx.lineWidth = 13; ctx.stroke(terra)
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

// I decori a inchiostro, dove la terra è libera: tre posti (albero, monte,
// ciuffo, scelti da disposizione.js) che ogni paesaggio riempie a modo suo.
// `t(colore)` sbiadisce il colore con lo stato dell'isola.
function chioma(ctx, colore) {
  ctx.beginPath()
  ctx.moveTo(-5, 1); ctx.quadraticCurveTo(-8, -4, -3, -6); ctx.quadraticCurveTo(0, -11, 3, -6)
  ctx.quadraticCurveTo(8, -4, 5, 1); ctx.closePath()
  ctx.fillStyle = colore; ctx.fill(); ctx.stroke()
}
function tronco(ctx) { ctx.beginPath(); ctx.moveTo(0, 6); ctx.lineTo(0, 0); ctx.stroke() }
function collina(ctx, colore) {
  ctx.beginPath(); ctx.moveTo(-10, 5); ctx.quadraticCurveTo(-3, -9, 0, -8); ctx.quadraticCurveTo(4, -8, 10, 5)
  ctx.fillStyle = colore; ctx.fill(); ctx.stroke()
  ctx.beginPath()
  for (const x of [2.5, 5, 7.5]) { ctx.moveTo(x, -4 + x * 0.6); ctx.lineTo(x - 1.5, 4) }
  ctx.lineWidth = 0.8; ctx.stroke()
}
function puntini(ctx, punti, colore, r = 1.1) {
  ctx.fillStyle = colore
  for (const [x, y] of punti) { ctx.beginPath(); ctx.arc(x, y, r, 0, GIRO); ctx.fill() }
}
const COLORI_DEI_FIORI = ['#d9453a', '#f2c230', '#3a86d4', '#e27fb0', '#f08a2a']
function fiore(ctx, t, k, x, y) {
  ctx.beginPath(); ctx.moveTo(x, y + 4); ctx.lineTo(x, y - 1); ctx.lineWidth = 1; ctx.stroke()
  ctx.fillStyle = t(COLORI_DEI_FIORI[k % COLORI_DEI_FIORI.length])
  for (let i = 0; i < 5; i++) {
    const a = i / 5 * GIRO
    ctx.beginPath(); ctx.arc(x + Math.cos(a) * 2.2, y - 3 + Math.sin(a) * 2.2, 1.6, 0, GIRO); ctx.fill()
  }
  puntini(ctx, [[x, y - 3]], t('#f7e27a'), 1.2)
}

const DECORI = {
  base: {
    albero: (ctx, t) => { tronco(ctx); chioma(ctx, t('#8fae62')) },
    monte: (ctx, t) => collina(ctx, t('#cdb47c')),
    ciuffo: ctx => {
      ctx.beginPath(); ctx.moveTo(-3, 3); ctx.lineTo(-4, -2); ctx.moveTo(0, 3); ctx.lineTo(0, -3.5)
      ctx.moveTo(3, 3); ctx.lineTo(4, -2); ctx.lineWidth = 1; ctx.stroke()
    },
  },
  // la prima: alberi in fiore e fiori di tutti i colori
  primavera: {
    albero: (ctx, t) => { tronco(ctx); chioma(ctx, t('#86b85c')); puntini(ctx, [[-4, -3], [1, -7], [4, -2], [-1, -1]], t('#f4a6c4')) },
    // un'aiuola: tre fiori di colori diversi
    monte: (ctx, t, d) => [[-5, 2], [0, -1], [5, 2]].forEach(([x, y], i) => fiore(ctx, t, d.k + i, x, y)),
    ciuffo: (ctx, t, d) => fiore(ctx, t, d.k, 0, 0),
  },
  // la seconda: palme, dune e stelle marine
  estate: {
    albero: (ctx, t) => {
      ctx.beginPath(); ctx.moveTo(-1, 7); ctx.quadraticCurveTo(-2, 1, 1, -5); ctx.lineWidth = 1.6; ctx.stroke()
      ctx.lineWidth = 1.1; ctx.fillStyle = t('#6fa84e')
      for (const [dx, dy] of [[-8, -3], [-6, -9], [1, -11], [7, -8], [8, -2]]) {
        ctx.beginPath(); ctx.moveTo(1, -5)
        ctx.quadraticCurveTo((1 + dx) / 2 + dy * 0.15, (-5 + dy) / 2 - 3, dx, dy)
        ctx.quadraticCurveTo((1 + dx) / 2, (-5 + dy) / 2, 1, -5); ctx.fill(); ctx.stroke()
      }
      puntini(ctx, [[0, -4], [2, -4.5]], t('#8a5a2b'), 1.2)
    },
    monte: (ctx, t) => {
      ctx.beginPath(); ctx.moveTo(-11, 4); ctx.quadraticCurveTo(-4, -6, 2, -5); ctx.quadraticCurveTo(7, -4, 11, 4)
      ctx.fillStyle = t('#f0d48e'); ctx.fill(); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(-5, 0); ctx.quadraticCurveTo(0, -3, 5, 0); ctx.lineWidth = 0.7; ctx.stroke()
    },
    ciuffo: (ctx, t) => {
      ctx.beginPath()
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + i / 10 * GIRO, r = i % 2 ? 1.8 : 4.4
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r)
      }
      ctx.closePath(); ctx.fillStyle = t('#ef8a4a'); ctx.lineWidth = 0.9; ctx.fill(); ctx.stroke()
    },
  },
  // la terza: le foglie rosse e arancioni, e i funghi
  autunno: {
    albero: (ctx, t, d) => { tronco(ctx); chioma(ctx, t(d.k % 2 ? '#d9822b' : '#c4532c')) },
    monte: (ctx, t) => collina(ctx, t('#c79a5a')),
    ciuffo: (ctx, t) => {
      ctx.beginPath(); ctx.moveTo(-1.6, 4); ctx.lineTo(-1.2, -1); ctx.lineTo(1.2, -1); ctx.lineTo(1.6, 4); ctx.closePath()
      ctx.fillStyle = t('#f6ecd6'); ctx.lineWidth = 0.9; ctx.fill(); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(-5, -1); ctx.quadraticCurveTo(0, -9, 5, -1); ctx.closePath()
      ctx.fillStyle = t('#c8352a'); ctx.fill(); ctx.stroke()
      puntini(ctx, [[-2, -3.5], [1.5, -4.5], [3, -2]], t('#fff8ec'), 0.8)
    },
  },
  // la quarta: neve, abeti, montagne bianche e qualche pupazzo
  inverno: {
    albero: (ctx, t) => {
      tronco(ctx)
      ctx.fillStyle = t('#3f7a5a')
      for (const [y, l] of [[2, 6], [-2.5, 4.8], [-6.5, 3.4]]) {
        ctx.beginPath(); ctx.moveTo(-l, y); ctx.lineTo(0, y - 5.5); ctx.lineTo(l, y); ctx.closePath(); ctx.fill(); ctx.stroke()
      }
      puntini(ctx, [[-3, 1.4], [2.5, 1.3], [-1.8, -3], [1.6, -3.2], [0, -7.5]], t('#ffffff'), 0.9)
    },
    monte: (ctx, t) => {
      ctx.beginPath(); ctx.moveTo(-11, 5); ctx.lineTo(-1, -10); ctx.lineTo(11, 5); ctx.closePath()
      ctx.fillStyle = t('#a9bccb'); ctx.fill(); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(-5, -4); ctx.lineTo(-1, -10); ctx.lineTo(3.4, -3.6); ctx.lineTo(1, -5); ctx.lineTo(-1.5, -3.2)
      ctx.closePath(); ctx.fillStyle = t('#ffffff'); ctx.fill(); ctx.lineWidth = 0.8; ctx.stroke()
    },
    ciuffo: (ctx, t, d) => {
      if (d.k % 3) {           // un cumulo di neve
        ctx.beginPath(); ctx.moveTo(-5, 3); ctx.quadraticCurveTo(-3, -2, 0, 0); ctx.quadraticCurveTo(3, -3, 5, 3)
        ctx.fillStyle = t('#ffffff'); ctx.lineWidth = 0.9; ctx.fill(); ctx.stroke()
        return
      }
      ctx.fillStyle = t('#ffffff'); ctx.lineWidth = 0.9
      ctx.beginPath(); ctx.arc(0, 1.5, 3.6, 0, GIRO); ctx.fill(); ctx.stroke()
      ctx.beginPath(); ctx.arc(0, -4, 2.5, 0, GIRO); ctx.fill(); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(0, -4); ctx.lineTo(3, -3.6); ctx.lineTo(0, -3.4); ctx.closePath()
      ctx.fillStyle = t('#ef8a2a'); ctx.fill()
      puntini(ctx, [[-0.9, -4.8]], t(INCHIOSTRO), 0.45)
    },
  },
  // la quinta: vulcani che fumano, pini a ombrello e rocce
  vulcano: {
    albero: (ctx, t) => {
      ctx.beginPath(); ctx.moveTo(0, 6); ctx.quadraticCurveTo(1, 0, 0, -3); ctx.lineWidth = 1.3; ctx.stroke()
      ctx.beginPath(); ctx.moveTo(-7, -3); ctx.quadraticCurveTo(-5, -9, 0, -8); ctx.quadraticCurveTo(5, -9, 7, -3)
      ctx.closePath(); ctx.fillStyle = t('#5f8a4a'); ctx.lineWidth = 1.2; ctx.fill(); ctx.stroke()
    },
    monte: (ctx, t) => {
      ctx.beginPath(); ctx.moveTo(-10, 5); ctx.lineTo(-2.5, -7); ctx.lineTo(2.5, -7); ctx.lineTo(10, 5); ctx.closePath()
      ctx.fillStyle = t('#8f7660'); ctx.fill(); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(-1.2, -7); ctx.quadraticCurveTo(-2.5, -2, -4.5, 1.5); ctx.quadraticCurveTo(-0.8, -1.5, 1.2, -7)
      ctx.fillStyle = t('#e0582a'); ctx.fill()
      ctx.fillStyle = t('#b9b2a8')
      for (const [x, y, r] of [[0.5, -9.5, 1.8], [2.5, -12, 2.2]]) { ctx.beginPath(); ctx.arc(x, y, r, 0, GIRO); ctx.fill() }
    },
    ciuffo: (ctx, t) => {
      ctx.lineWidth = 0.9; ctx.fillStyle = t('#9c958c')
      ctx.beginPath(); ctx.ellipse(-2, 2, 3.4, 2.4, 0, 0, GIRO); ctx.fill(); ctx.stroke()
      ctx.beginPath(); ctx.ellipse(2.6, 3, 2.4, 1.7, 0, 0, GIRO); ctx.fill(); ctx.stroke()
    },
  },
  // la sesta: torrette di castello, nuvole e stelle
  nuvole: {
    albero: (ctx, t) => {
      ctx.beginPath(); ctx.rect(-3.5, -5, 7, 11); ctx.fillStyle = t('#e9e2d4'); ctx.fill(); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(-4.5, -5); ctx.lineTo(0, -12); ctx.lineTo(4.5, -5); ctx.closePath()
      ctx.fillStyle = t('#7a6bb0'); ctx.fill(); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(0, -16); ctx.lineTo(4, -15); ctx.lineTo(0, -14)
      ctx.lineWidth = 0.9; ctx.fillStyle = t('#d9453a'); ctx.fill(); ctx.stroke()
      ctx.beginPath(); ctx.rect(-1.2, 0, 2.4, 3); ctx.fillStyle = t(INCHIOSTRO); ctx.fill()
    },
    monte: (ctx, t) => {
      ctx.beginPath()
      ctx.moveTo(-10, 4); ctx.quadraticCurveTo(-12, -2, -6, -2); ctx.quadraticCurveTo(-5, -8, 1, -7)
      ctx.quadraticCurveTo(7, -10, 8, -3); ctx.quadraticCurveTo(13, -2, 10, 4); ctx.closePath()
      ctx.fillStyle = t('#ffffff'); ctx.fill(); ctx.stroke()
    },
    ciuffo: (ctx, t) => {
      ctx.beginPath()
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + i / 10 * GIRO, r = i % 2 ? 1.6 : 4
        ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r)
      }
      ctx.closePath(); ctx.fillStyle = t('#f2c230'); ctx.lineWidth = 0.9; ctx.fill(); ctx.stroke()
    },
  },
}

function decori(ctx, q) {
  const isole = new Map(q.isole.map(is => [is.mondo, is]))
  q.decori.forEach((d, k) => {
    const is = isole.get(d.mondo) || { stato: 'chiuso' }
    const stato = is.stato || 'chiuso', alfa = TINTA[stato] ?? 1
    const fondo = coloreDi(is, 'terra', TERRA)
    const ink = mescola(INCHIOSTRO, fondo, 1 - alfa * 0.85)
    const t = c => mescola(c, fondo, 1 - alfa * 0.8)
    const pittore = (DECORI[is.paesaggio] || DECORI.base)[d.tipo] || DECORI.base[d.tipo]
    // i decori di un paesaggio sono un po' più grandi: sono loro a dare il carattere
    const s = d.s * (DECORI[is.paesaggio] ? 1.2 : 1)
    ctx.save(); ctx.translate(d.x, d.y); ctx.scale(s, s)
    ctx.strokeStyle = ink; ctx.lineWidth = 1.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
    pittore(ctx, t, { k })
    ctx.restore()
  })
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
  ctx.fillStyle = INCHIOSTRO; ctx.font = `700 ${Math.round(r * 0.5)}px "Emoji Gioco", Georgia, serif`
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
