// La nave della mappa del tesoro: una caravella a inchiostro e acquerello,
// come i disegnini delle tappe. Si disegna su una tela piccola tutta sua,
// che la vista sposta: la mappa sotto resta ferma. Non sa dove va né
// perché: riceve verso, dondolio e quanto è lunga la scia.
// Le scelte in docs/lingue/mondi-vista.md («La nave»).
import { INCHIOSTRO } from './mappa.js'
import { lungo } from './rotte.js'

export const LATO_NAVE = 120          // la tela della nave, in px CSS: la scia ci sta dentro
const LEGNO = '#a4632f', LEGNO_SCURO = '#7d4a22', VELA = '#f7f0dc', ROSSO = '#c0392b'

function linea(ctx, sp, col = INCHIOSTRO) { ctx.lineWidth = sp; ctx.strokeStyle = col; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke() }

// la caravella di profilo, prua a destra, la linea d'acqua a y = 8
function caravella(ctx, onda) {
  // gli alberi
  for (const [x, y0, y1] of [[1, -3, -41], [12, -3, -29], [-12, -7, -27]]) {
    ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1); linea(ctx, 1.8, LEGNO_SCURO)
  }
  // la bandierina in cima, che sventola
  ctx.beginPath(); ctx.moveTo(1, -41)
  ctx.quadraticCurveTo(5, -43 + onda, 10, -40 + onda * 0.5); ctx.lineTo(1, -37); ctx.closePath()
  ctx.fillStyle = ROSSO; ctx.fill(); linea(ctx, 1)
  // le vele quadre, gonfie verso prua
  const vela = (x0, x1, y0, y1, gonfia) => {
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y0)
    ctx.quadraticCurveTo(x1 + gonfia, (y0 + y1) / 2, x1, y1); ctx.lineTo(x0, y1)
    ctx.quadraticCurveTo(x0 + gonfia, (y0 + y1) / 2, x0, y0); ctx.closePath()
    ctx.fillStyle = VELA; ctx.fill(); linea(ctx, 1.3)
  }
  vela(-8, 10, -34, -14, 5)
  vela(-5, 7, -39, -35, 2)
  vela(6, 17, -26, -11, 4)
  // la croce rossa sulla vela grande: è una caravella
  ctx.beginPath(); ctx.moveTo(1 + 2.5, -30); ctx.lineTo(1 + 2.5, -18); ctx.moveTo(-3, -24); ctx.lineTo(10, -24)
  linea(ctx, 2.4, ROSSO)
  // la vela latina a poppa
  ctx.beginPath(); ctx.moveTo(-12, -27); ctx.quadraticCurveTo(-17, -16, -12, -8); ctx.lineTo(-22, -9); ctx.closePath()
  ctx.fillStyle = VELA; ctx.fill(); linea(ctx, 1.2)
  // lo scafo, col castello di poppa alto
  ctx.beginPath()
  ctx.moveTo(-21, -9); ctx.lineTo(-12, -9); ctx.lineTo(-12, -4); ctx.lineTo(13, -4); ctx.lineTo(22, -8)
  ctx.quadraticCurveTo(19, 6, 9, 8.5); ctx.lineTo(-13, 8.5); ctx.quadraticCurveTo(-20, 6, -21, -9); ctx.closePath()
  ctx.fillStyle = LEGNO; ctx.fill(); linea(ctx, 1.6)
  // le assi e gli oblò
  ctx.beginPath(); ctx.moveTo(-19, 1.5); ctx.quadraticCurveTo(0, 3.5, 19, 0); linea(ctx, 0.8)
  ctx.fillStyle = INCHIOSTRO
  for (const x of [-7, 0, 7]) { ctx.beginPath(); ctx.arc(x, -0.6, 1.1, 0, 7); ctx.fill() }
}

// le onde piccole attorno allo scafo
function acqua(ctx, t) {
  ctx.globalAlpha = 0.55
  for (const [x, k] of [[-24, 0], [22, 1]]) {
    const dx = Math.sin(t * 3 + k * 2) * 1.5
    ctx.beginPath(); ctx.moveTo(x - 5 + dx, 10); ctx.quadraticCurveTo(x + dx, 7, x + 5 + dx, 10); linea(ctx, 1.1)
  }
  ctx.globalAlpha = 1
}

// la scia: increspature che restano indietro, nel verso da cui la nave arriva,
// sempre più larghe e più tenui
function scia(ctx, dx, dy, lunga) {
  if (lunga < 4) return
  const l = Math.hypot(dx, dy) || 1
  const ux = -dx / l, uy = -dy / l, px = -uy, py = ux
  const n = Math.max(1, Math.round(lunga / 10))
  ctx.lineCap = 'round'; ctx.lineWidth = 1.3
  for (let k = 1; k <= n; k++) {
    const d = 8 + k * 9, w = 4 + k * 3
    const cx = ux * d, cy = uy * d + 8
    ctx.beginPath()
    ctx.moveTo(cx - px * w, cy - py * w)
    ctx.quadraticCurveTo(cx + ux * 4, cy + uy * 4, cx + px * w, cy + py * w)
    ctx.strokeStyle = `rgba(74,50,34,${0.5 * (1 - (k - 1) / n)})`
    ctx.stroke()
  }
}

// dove sta la tela rispetto al punto d'attracco (lo scafo)
const CENTRO_X = LATO_NAVE / 2, CENTRO_Y = LATO_NAVE / 2 + 12
function sposta(contenitore, x, y) {
  contenitore.style.transform = `translate(${Math.round(x - CENTRO_X)}px, ${Math.round(y - CENTRO_Y)}px)`
}

// la nave ferma all'attracco, con la prua verso l'isola
export function posa(tela, contenitore, x, y, verso = 1) {
  sposta(contenitore, x, y)
  dipingiNave(tela, { verso: verso < 0 ? -1 : 1 })
}

/* Il viaggio, a fotogrammi: la nave segue `punti` in `durata` secondi,
   dondola e si lascia dietro la scia. Il tempo avanza solo fra due
   fotogrammi e mai più di 50 ms alla volta: a schermo nascosto il browser
   non ne consegna e il viaggio resta dov'era, e alla ripresa non salta.
   `chiudi()` lo porta subito in fondo (un tocco durante il viaggio). */
export function viaggia(tela, contenitore, punti, durata, fine) {
  let t = 0, prima = null, id = 0, finito = false, verso = 1
  const disegna = q => {
    const e = q < 0.5 ? 2 * q * q : 1 - (-2 * q + 2) ** 2 / 2
    const p = lungo(punti, e)
    if (Math.abs(p.dx) > Math.abs(p.dy) * 0.25 && p.dx) verso = p.dx > 0 ? 1 : -1
    sposta(contenitore, p.x, p.y)
    dipingiNave(tela, { verso, dondolo: Math.sin(t * 7.5) * 0.09 * Math.sin(Math.PI * q), dx: p.dx, dy: p.dy,
                        lunga: 40 * Math.sin(Math.PI * Math.min(1, q * 1.3)), t })
  }
  const arriva = () => {
    if (finito) return
    finito = true
    cancelAnimationFrame(id)
    const ultimo = punti[punti.length - 1]
    sposta(contenitore, ultimo[0], ultimo[1])
    dipingiNave(tela, { verso })
    fine()
  }
  const fotogramma = ora => {
    if (finito) return
    const nascosto = typeof document !== 'undefined' && document.hidden
    if (prima !== null && !nascosto) t += Math.min(0.05, Math.max(0, (ora - prima) / 1000))
    prima = ora
    if (t >= durata) { arriva(); return }
    disegna(t / durata)
    id = requestAnimationFrame(fotogramma)
  }
  disegna(0)
  id = requestAnimationFrame(fotogramma)
  return { chiudi: arriva, ferma() { finito = true; cancelAnimationFrame(id) } }
}

/* Dipinge la nave al centro della sua tela. `verso`: 1 prua a destra, -1 a
   sinistra; `dondolo`: l'angolo del beccheggio; `rotta`: da dove viene
   (dx, dy) e quanto è lunga la scia; `t` il tempo, per le onde. */
export function dipingiNave(canvas, { verso = 1, dondolo = 0, dx = 0, dy = 0, lunga = 0, t = 0 } = {}) {
  const dpr = Math.min(2, (typeof window !== 'undefined' && window.devicePixelRatio) || 1)
  const px = Math.floor(LATO_NAVE * dpr)
  if (canvas.width !== px) { canvas.width = px; canvas.height = px }
  const ctx = canvas.getContext('2d')
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  ctx.clearRect(0, 0, LATO_NAVE, LATO_NAVE)
  ctx.translate(LATO_NAVE / 2, LATO_NAVE / 2 + 10)
  scia(ctx, dx, dy, lunga)
  acqua(ctx, t)
  ctx.save()
  ctx.translate(0, 8); ctx.rotate(dondolo); ctx.translate(0, -8)
  ctx.scale(verso * 0.95, 0.95)
  caravella(ctx, Math.sin(t * 9) * 2)
  ctx.restore()
}
