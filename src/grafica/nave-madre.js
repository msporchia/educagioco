// La nave madre, il boss: uno scafo a disco, due cannoni sotto le ali e il comandante nella
// cupola. Si legge il danno senza numeri: un cannone in meno, poi l'altro, poi la cupola crepata.
// Solo pittori: chi colpisce chi lo decide il gioco.
import { tondo } from './livrea.js'

const TAU = Math.PI * 2

// i punti del disegno in coordinate locali (unità di R), rotati con la nave
function inSchermo(m, lx, ly) {
  const co = Math.cos(m.inclina || 0), si = Math.sin(m.inclina || 0)
  return { x: m.x + (lx * co - ly * si) * m.r, y: m.y + (lx * si + ly * co) * m.r }
}

// il centro del cannone (sinistro: lato = -1, destro: +1), dove va il raggio che rimbalza
export const cannoneDi = (m, lato) => inSchermo(m, lato * 1.3, 0.475)
export const cupolaDi = m => inSchermo(m, 0, -0.3)

export function disegnaNaveMadre(ctx, m, S, t) {
  const c = ctx, R = m.r, u = R / 58
  const lw = v => Math.max(1, v * S)
  c.save(); c.translate(m.x, m.y); c.rotate(m.inclina || 0)
  c.lineJoin = 'round'

  const g0 = c.createRadialGradient(0, 0, R * 0.5, 0, 0, R * 2.4)
  g0.addColorStop(0, '#ff6b6b33'); g0.addColorStop(1, '#ff6b6b00')
  c.fillStyle = g0; c.beginPath(); c.arc(0, 0, R * 2.4, 0, TAU); c.fill()

  for (const lato of [-1, 1]) {   // i cannoni sotto le ali
    if (!(lato < 0 ? m.sx : m.dx)) continue
    const cx = lato * R * 1.3, cy = R * 0.3
    c.fillStyle = '#4a3a6a'; tondo(c, cx - R * 0.16, cy - R * 0.1, R * 0.32, R * 0.55, R * 0.1); c.fill()
    c.strokeStyle = '#1a1030'; c.lineWidth = lw(2.5); c.stroke()
    c.fillStyle = '#2a2040'; c.fillRect(cx - R * 0.07, cy + R * 0.4, R * 0.14, R * 0.3)
    c.fillStyle = `rgba(255,80,80,${0.6 + 0.4 * Math.sin(t * 8)})`
    c.beginPath(); c.arc(cx, cy + R * 0.72, R * 0.09, 0, TAU); c.fill()
  }

  // lo scafo, col bordo d'oro
  c.beginPath(); c.ellipse(0, R * 0.15, R * 1.7, R * 0.5, 0, 0, TAU)
  const g = c.createLinearGradient(0, -R * 0.3, 0, R * 0.6)
  g.addColorStop(0, '#b6a8e0'); g.addColorStop(0.5, '#6a5a9a'); g.addColorStop(1, '#2a1f48')
  c.fillStyle = g; c.fill(); c.lineWidth = lw(3.5); c.strokeStyle = '#ffd94a'; c.stroke()
  c.beginPath(); c.ellipse(0, R * 0.28, R * 1.2, R * 0.22, 0, 0, Math.PI)
  c.strokeStyle = '#1a1030aa'; c.lineWidth = lw(2); c.stroke()
  for (let i = 0; i < 9; i++) {   // le lucette lungo il bordo
    const x = -R * 1.4 + i * R * 0.35
    c.fillStyle = Math.sin(t * 5 + i) > 0 ? '#ff6b6b' : '#5a2030'
    c.beginPath(); c.arc(x, R * 0.22 + Math.sin(i / 8 * Math.PI) * R * 0.18, Math.max(1.8, R * 0.055), 0, TAU); c.fill()
  }

  for (const lato of [-1, 1]) {   // dove c'era un cannone: un buco col bordo bruciato, che fuma
    if (lato < 0 ? m.sx : m.dx) continue
    const cx = lato * R * 1.25, cy = R * 0.3
    c.fillStyle = '#120a1c'; c.beginPath()
    for (let i = 0; i < 9; i++) {
      const a = i / 9 * TAU, k = i % 2 ? 0.13 : 0.22
      c.lineTo(cx + Math.cos(a) * R * k * 1.3, cy + Math.sin(a) * R * k)
    }
    c.closePath(); c.fill(); c.strokeStyle = '#ff9d1c'; c.lineWidth = lw(1.5); c.stroke()
    for (let k = 0; k < 3; k++) {
      const q = (t * 1.5 + k * 0.33) % 1
      c.fillStyle = `rgba(120,110,130,${0.5 * (1 - q)})`
      c.beginPath(); c.arc(cx + lato * q * 18 * u, cy - q * 40 * u, (6 + q * 12) * u, 0, TAU); c.fill()
    }
    if (Math.sin(t * 9 + lato) > 0.3) {
      c.fillStyle = '#ffd94a'; c.beginPath(); c.arc(cx + lato * 6 * u, cy + 4 * u, Math.max(1.5, 2.5 * u), 0, TAU); c.fill()
    }
  }

  // la cupola, col comandante
  c.beginPath(); c.arc(0, -R * 0.1, R * 0.78, Math.PI, 0); c.closePath(); c.fillStyle = '#bff8ff33'; c.fill()
  c.fillStyle = m.paura ? '#9be29b' : '#6ee26e'
  c.beginPath(); c.ellipse(0, -R * 0.38, R * 0.4, R * 0.34, 0, 0, TAU); c.fill()
  let [gx, gy] = m.guarda || [0, 1]
  const lun = Math.max(1, Math.hypot(gx, gy))   // un vettore lungo si accorcia a 1, uno corto resta com'è
  gx = gx / lun * R * 0.05; gy = gy / lun * R * 0.05
  c.lineCap = 'round'
  for (const lato of [-1, 1]) {
    c.fillStyle = '#fff'; c.beginPath(); c.ellipse(lato * R * 0.15, -R * 0.4, R * 0.12, R * 0.14, 0, 0, TAU); c.fill()
    c.fillStyle = '#111'; c.beginPath(); c.arc(lato * R * 0.15 + gx, -R * 0.4 + gy, R * 0.06, 0, TAU); c.fill()
    c.strokeStyle = '#1a3a1a'; c.lineWidth = lw(3); c.beginPath()
    if (m.paura) { c.moveTo(lato * R * 0.05, -R * 0.62); c.lineTo(lato * R * 0.27, -R * 0.56) }   // sopracciglia in su, al centro
    else { c.moveTo(lato * R * 0.05, -R * 0.54); c.lineTo(lato * R * 0.28, -R * 0.64) }
    c.stroke()
  }
  c.strokeStyle = '#1a3a1a'; c.lineWidth = lw(2.5); c.beginPath()
  if (m.paura) c.ellipse(0, -R * 0.2, R * 0.08, R * 0.06, 0, 0, TAU)   // la bocca a «o»
  else { c.moveTo(-R * 0.12, -R * 0.2); c.lineTo(R * 0.12, -R * 0.22) }
  c.stroke()
  if (m.paura) {   // la goccia di sudore
    c.fillStyle = '#7fd0ff'; c.beginPath(); c.ellipse(R * 0.33, -R * 0.55, Math.max(1.8, 3 * u), Math.max(2.5, 5 * u), 0, 0, TAU); c.fill()
  }
  c.beginPath(); c.arc(0, -R * 0.1, R * 0.78, Math.PI, 0); c.strokeStyle = '#e8fff0cc'; c.lineWidth = lw(2.5); c.stroke()
  if (!m.cupola) {   // il vetro crepato
    c.strokeStyle = '#ffffffdd'; c.lineWidth = lw(1.8); c.beginPath()
    c.moveTo(-R * 0.5, -R * 0.5); c.lineTo(-R * 0.2, -R * 0.25); c.lineTo(-R * 0.3, -R * 0.02)
    c.moveTo(-R * 0.2, -R * 0.25); c.lineTo(R * 0.05, -R * 0.7)
    c.moveTo(R * 0.4, -R * 0.55); c.lineTo(R * 0.22, -R * 0.3); c.stroke()
  }
  c.restore()
}

// il cannone staccato che vola via, con le scintille dietro; r = il raggio della nave madre
export function disegnaPezzoMadre(ctx, p, S) {
  const c = ctx, R = p.r, u = R / 58
  for (let i = 0; i < 6; i++) {
    c.fillStyle = i % 2 ? '#ffd94a' : '#ff9d1c'
    c.beginPath(); c.arc(p.x - (10 + i * 7) * u, p.y + (6 + (i % 3) * 5) * u, Math.max(1, (3 - i * 0.3) * u), 0, TAU); c.fill()
  }
  c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.lineJoin = 'round'
  c.fillStyle = '#4a3a6a'; tondo(c, -R * 0.16, -R * 0.3, R * 0.32, R * 0.55, R * 0.1); c.fill()
  c.strokeStyle = '#1a1030'; c.lineWidth = Math.max(1, 2.5 * S); c.stroke()
  c.fillStyle = '#2a2040'; c.fillRect(-R * 0.07, R * 0.2, R * 0.14, R * 0.3)
  c.restore()
}
