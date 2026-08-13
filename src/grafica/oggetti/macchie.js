/* ── LE MACCHIE SUL PAVIMENTO ──
   Il cono di vista e la zona di ronda: non sono oggetti, sono
   **informazione**. Il gioco dice dove guarda una guardia e fin dove
   fa il giro, e qui si dipinge — schiacciato, come tutto quello che
   sta a terra, e sempre a uno strato sotto ai personaggi.

   Sono le due sole cose del catalogo che non esistono nel mondo del
   gioco: nessun personaggio le vede, le vede solo il bambino. */
import { LATO } from './attrezzi.js'

const VERSO = { giu: Math.PI / 2, su: -Math.PI / 2, dx: 0, sx: Math.PI }

export function vista(p, cosa, S = p.S) {
  /* ── QUANDO SI SA ESATTAMENTE COSA VEDE, SI DISEGNA QUELLO ──
     Un cerchio è una bugia comoda: la vista di questo gioco si misura
     **camminando** (`ACammino`), quindi una siepe in mezzo la taglia, e
     un cerchio disegnato sopra la siepe prometteva una guardia che vede
     di là. Chi passa le celle già contate — `celle`, in pixel, quelle
     che il motore raggiunge davvero — ottiene la macchia vera: si
     ferma sui muri, gira per i passaggi, e a occhio si legge la regola
     più importante del gioco senza che nessuno la debba spiegare.
     Chi non le passa ha ancora il cerchio di prima: serve dove una
     misura di cammino non c'è (un raggio di scena, un'anteprima). */
  if (cosa.celle) return macchiaDiCelle(p, cosa, S)
  const { x, y, dir = 'giu', raggio = 3, apertura = 0.85, colore = '#ffd24a', giro = false } = cosa
  const R = raggio * LATO * S
  const a0 = VERSO[dir] ?? 0
  p.ctx.save()
  p.ctx.translate(x, y); p.ctx.scale(1, 0.72)
  const g = p.ctx.createRadialGradient(0, 0, R * 0.12, 0, 0, R)
  g.addColorStop(0, colore + '55'); g.addColorStop(0.6, colore + '2e'); g.addColorStop(1, colore + '00')
  p.ctx.fillStyle = g
  p.ctx.beginPath()
  if (giro) p.ctx.arc(0, 0, R, 0, 6.29)
  else { p.ctx.moveTo(0, 0); p.ctx.arc(0, 0, R, a0 - apertura, a0 + apertura); p.ctx.closePath() }
  p.ctx.fill()
  p.ctx.strokeStyle = colore + '2a'; p.ctx.lineWidth = 1 * S
  p.ctx.stroke()
  p.ctx.restore()
}

/* le celle che qualcuno raggiunge davvero: una macchia sola, non
   quaranta quadrati. Si dipingono tutte le caselle in un tracciato
   unico e poi si riempie una volta — così i bordi interni fra due
   caselle vicine non si vedono, e il velo non si somma dove si
   toccano. `lato` è quanto è larga una casella a schermo: lo sa solo
   chi ha in mano la telecamera, quindi arriva da fuori. */
function macchiaDiCelle(p, cosa, S) {
  const { celle, colore = '#ffd24a', lato = LATO * S } = cosa
  if (!celle.length) return
  const c = p.ctx
  const traccia = () => {
    c.beginPath()
    for (const q of celle) c.rect(q.x - lato / 2, q.y - lato / 2, lato, lato)
  }
  c.save()
  /* ── UNO SGUARDO NON HA I BORDI DRITTI ──
     La prima stesura riempiva le caselle e ci passava un contorno
     attorno: a schermo si leggevano come **quadretti**, cioè come una
     griglia di roba, e la prima domanda di chi guardava è stata «e
     quelli cosa sono?». Sono un'area, e un'area si dipinge sfumata: lo
     stesso tracciato steso due volte, una sfocata e larga per il fiato
     esterno e una netta e bassa per il corpo. Le caselle restano la
     verità sotto — quello che si vede è esattamente quello che il
     motore raggiunge — ma smettono di sembrare una scacchiera. */
  if ('filter' in c) {
    c.filter = `blur(${Math.max(2, lato * 0.28)}px)`
    c.fillStyle = colore + '3a'
    traccia(); c.fill()
    c.filter = 'none'
  }
  c.fillStyle = colore + '22'
  traccia(); c.fill()
  c.restore()
}

/* il tratteggio che gira: le formichine del bordo dicono «questo è un
   giro che si ripete» senza scriverlo */
export function ronda(p, cosa, S = p.S) {
  const { celle, colore = '#3fd0b0', lato = LATO } = cosa
  const L = lato * S
  let x0, y0, x1, y1
  if (celle && celle.length) {
    x0 = Math.min(...celle.map(c => c.x)) - L / 2; x1 = Math.max(...celle.map(c => c.x)) + L / 2
    y0 = Math.min(...celle.map(c => c.y)) - L / 2; y1 = Math.max(...celle.map(c => c.y)) + L / 2
  } else {
    x0 = cosa.x - cosa.w / 2; x1 = cosa.x + cosa.w / 2
    y0 = cosa.y - cosa.h / 2; y1 = cosa.y + cosa.h / 2
  }
  const r = L * 0.22
  p.velo(0.13, () => {
    p.ctx.fillStyle = colore
    p.ctx.beginPath(); p.ctx.rect(x0, y0, x1 - x0, y1 - y0); p.ctx.fill()
  })
  p.ctx.save()
  p.ctx.strokeStyle = colore; p.ctx.lineWidth = 1.8 * S
  p.ctx.setLineDash([5 * S, 4 * S])
  p.ctx.lineDashOffset = -((p.tempo || 0) * 14 * S) % (9 * S)
  p.ctx.beginPath()
  p.ctx.moveTo(x0 + r, y0)
  p.ctx.arcTo(x1, y0, x1, y1, r); p.ctx.arcTo(x1, y1, x0, y1, r)
  p.ctx.arcTo(x0, y1, x0, y0, r); p.ctx.arcTo(x0, y0, x1, y0, r)
  p.ctx.closePath(); p.ctx.stroke()
  p.ctx.restore()
}
