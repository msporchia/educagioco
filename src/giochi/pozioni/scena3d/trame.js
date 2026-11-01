// Le trame dipinte su una tela 2D: legno, mattoni, il cartellino delle
// ampolle, la macchia e il puntino morbido delle particelle. Una volta
// sola per scena, tranne i cartellini (cambiano col banchetto).
import { CanvasTexture, SRGBColorSpace, RepeatWrapping } from 'three'

const FONTE = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'

function tela(w, h) {
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  return [c, c.getContext('2d')]
}
function trama(c, { ripeti = false, colore = true } = {}) {
  const t = new CanvasTexture(c)
  if (colore) t.colorSpace = SRGBColorSpace
  if (ripeti) t.wrapS = t.wrapT = RepeatWrapping
  t.anisotropy = 4
  return t
}
// un caso ripetibile, così il banco è uguale a ogni apertura
function caso(seme) {
  let s = seme
  return () => ((s = (s * 16807) % 2147483647) / 2147483647)
}

export function legno() {
  const [c, g] = tela(512, 512), r = caso(7)
  const assi = 5, h = 512 / assi
  for (let a = 0; a < assi; a++) {
    const tono = 0.85 + r() * 0.3
    g.fillStyle = `rgb(${110 * tono | 0},${66 * tono | 0},${38 * tono | 0})`
    g.fillRect(0, a * h, 512, h)
    for (let v = 0; v < 26; v++) {                       // le venature
      g.strokeStyle = `rgba(${40 + r() * 30 | 0},${20 + r() * 15 | 0},10,${0.15 + r() * 0.25})`
      g.lineWidth = 1 + r() * 2
      const y = a * h + r() * h
      g.beginPath(); g.moveTo(0, y)
      for (let x = 0; x <= 512; x += 64) g.lineTo(x, y + Math.sin(x * 0.02 + v) * 3 + (r() - 0.5) * 3)
      g.stroke()
    }
    g.fillStyle = 'rgba(20,10,5,.7)'; g.fillRect(0, a * h, 512, 3)   // la fessura fra due assi
    for (let n = 0; n < 2; n++) {                                    // un nodo e un chiodo
      const x = r() * 512, y = a * h + 10 + r() * (h - 20)
      g.fillStyle = 'rgba(50,25,10,.55)'; g.beginPath(); g.ellipse(x, y, 10 + r() * 8, 5, 0, 0, 7); g.fill()
    }
    g.fillStyle = '#2a2420'; g.fillRect(14, a * h + h / 2 - 3, 6, 6); g.fillRect(492, a * h + h / 2 - 3, 6, 6)
  }
  return trama(c, { ripeti: true })
}

export function mattoni() {
  const [c, g] = tela(512, 512), r = caso(3)
  g.fillStyle = '#1d1726'; g.fillRect(0, 0, 512, 512)
  const fila = 40, largo = 96
  for (let y = 0, f = 0; y < 512; y += fila, f++)
    for (let x = f % 2 ? -largo / 2 : 0; x < 512; x += largo) {
      const t = 0.75 + r() * 0.5
      g.fillStyle = `rgb(${62 * t | 0},${50 * t | 0},${78 * t | 0})`
      g.fillRect(x + 3, y + 3, largo - 6, fila - 6)
      g.fillStyle = 'rgba(255,255,255,.05)'; g.fillRect(x + 3, y + 3, largo - 6, 4)
      if (r() < 0.25) { g.fillStyle = 'rgba(30,90,50,.25)'; g.fillRect(x + 3, y + fila - 12, largo * r(), 9) }   // un po' di muschio
    }
  return trama(c, { ripeti: true })
}

// la grana di una polvere o la scorza di una radice, chiara: la tinta la dà il materiale
export function grana(tipo = 'polvere') {
  const [c, g] = tela(128, 128), r = caso(tipo === 'polvere' ? 11 : 19)
  g.fillStyle = '#fff'; g.fillRect(0, 0, 128, 128)
  if (tipo === 'polvere')
    for (let i = 0; i < 900; i++) { g.fillStyle = `rgba(0,0,0,${r() * 0.25})`; g.fillRect(r() * 128, r() * 128, 2, 2) }
  else
    for (let i = 0; i < 40; i++) {
      g.strokeStyle = `rgba(60,30,10,${0.2 + r() * 0.3})`; g.lineWidth = 1 + r() * 2
      const x = r() * 128
      g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + 8, 40, x - 8, 90, x + 4, 128); g.stroke()
    }
  return trama(c, { ripeti: true })
}

// il puntino morbido delle particelle e del vapore (bianco: la tinta la dà chi lo usa)
export function morbido() {
  const [c, g] = tela(64, 64)
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.4, 'rgba(255,255,255,.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64)
  return trama(c)
}

// la macchia per terra: bianca su fondo trasparente, a lobi
export function macchia() {
  const [c, g] = tela(256, 256), r = caso(5)
  g.fillStyle = '#fff'
  g.beginPath()
  for (let a = 0; a <= 24; a++) {
    const t = a / 24 * Math.PI * 2, d = 80 + Math.sin(t * 3) * 18 + r() * 22
    const x = 128 + Math.cos(t) * d, y = 128 + Math.sin(t) * d * 0.8
    a ? g.lineTo(x, y) : g.moveTo(x, y)
  }
  g.fill()
  for (let i = 0; i < 7; i++) { g.beginPath(); g.arc(128 + (r() - 0.5) * 220, 128 + (r() - 0.5) * 200, 6 + r() * 12, 0, 7); g.fill() }
  return trama(c)
}

/* La targhetta appesa a un'ampolla: quanto c'è dentro, scritto come
   l'ha scritto il mercante (il prezzo sta nel listino, già pagato). */
export function cartellino(testo) {
  const [c, g] = tela(320, 176)
  const tondo = (x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r) }
  g.fillStyle = 'rgba(0,0,0,.35)'; tondo(8, 14, 304, 156, 26); g.fill()
  g.fillStyle = '#fff4dc'; tondo(4, 4, 304, 156, 26); g.fill()
  g.strokeStyle = '#b48a4a'; g.lineWidth = 5; tondo(6, 6, 300, 152, 24); g.stroke()
  g.fillStyle = '#2d2340'
  g.textAlign = 'center'; g.textBaseline = 'middle'
  let corpo = 92
  g.font = `900 ${corpo}px "Emoji Gioco", ${FONTE}`
  while (g.measureText(testo).width > 280 && corpo > 40) g.font = `900 ${(corpo -= 4)}px "Emoji Gioco", ${FONTE}`
  g.fillText(testo, 156, 84)
  return trama(c)
}
