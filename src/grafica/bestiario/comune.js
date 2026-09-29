// Il fondo del cassetto del bestiario: le creature stanno ferme al centro dello schermo, di fronte e
// basta (stesso stile dei personaggi del Generale, ma con più dettaglio, essendo molto più grandi). Qui
// solo quello che più di una creatura ha in comune; chi ha una cosa sua se la disegna nel proprio file.
import { mescola, capsula, poligono, tondo } from '../comune.js'

// occhi per chi non ha una faccia (segni.js copre chi ce l'ha): un ragno ha otto puntini, un guscio due che luccicano
export function occhietti(q, s, quanti, largo, y, r, stato, col = '#ffe97a') {
  const b = '#1b1430'
  for (let i = 0; i < quanti; i++) {
    const x = (i - (quanti - 1) / 2) * largo * s
    if (stato === 'ko') {
      q.ctx.strokeStyle = b; q.ctx.lineWidth = 0.5 * s; q.ctx.lineCap = 'round'
      q.ctx.beginPath()
      q.ctx.moveTo(x - r * 0.7 * s, y * s - r * 0.7 * s); q.ctx.lineTo(x + r * 0.7 * s, y * s + r * 0.7 * s)
      q.ctx.moveTo(x + r * 0.7 * s, y * s - r * 0.7 * s); q.ctx.lineTo(x - r * 0.7 * s, y * s + r * 0.7 * s)
      q.ctx.stroke()
      continue
    }
    q.cerchio(x, y * s, r * s, col)
    q.cerchio(x, y * s, r * 0.45 * s, b)
  }
}

// ragno e scorpione: due segmenti con un ginocchio più in alto del corpo, la posa che dice "ragno" anche in silhouette
export function zampe(q, s, quante, { lungo = 7, apri = 1, su = 4.4, y = 0,
                                      col = '#2f2a3d', sp = 0.9, fremito = 0 } = {}) {
  q.ctx.strokeStyle = col; q.ctx.lineWidth = sp * s; q.ctx.lineCap = 'round'
  q.ctx.lineJoin = 'round'
  for (let i = 0; i < quante; i++) {
    const passo = quante > 1 ? i / (quante - 1) - 0.5 : 0
    for (const v of [-1, 1]) {
      const f = Math.sin(fremito + i * 1.7 + v) * 0.35 * s
      // il ginocchio va fuori dal corpo, non sopra: stretto all'attaccatura finiva sotto l'addome e spariva
      const gx = v * (3.4 + lungo * apri * 0.55) * s
      const gy = (y - su + passo * 1.4) * s + f
      const px = v * (3 + lungo * apri) * s
      const py = (y + 4.2 + passo * 2.6) * s - f
      q.ctx.beginPath()
      q.ctx.moveTo(v * 1.2 * s, (y + passo * 1.4) * s)
      q.ctx.lineTo(gx, gy)
      q.ctx.lineTo(px, py)
      q.ctx.stroke()
    }
  }
}

// pipistrelli, arpie, draghi: tre dita e la pelle tesa in mezzo, il modo più corto di dire "vola"
export function ala(q, s, v, { lungo = 9, alto = 6, col = '#4b3a63', bordo = '#241a35',
                               apertura = 1, x = 0, y = 0 } = {}) {
  const L = lungo * apertura
  q.ctx.beginPath()
  q.ctx.moveTo(x, y)
  q.ctx.quadraticCurveTo(x + v * L * 0.5 * s, y - alto * s, x + v * L * s, y - alto * 0.28 * s)
  // le insenature fra le dita: senza, è un ritaglio di stoffa
  for (let i = 2; i >= 0; i--) {
    const d = i / 3
    q.ctx.quadraticCurveTo(x + v * L * (d + 0.12) * s, y + alto * 0.42 * s,
                           x + v * L * d * s, y + alto * (0.1 + d * 0.28) * s)
  }
  q.ctx.closePath()
  q.ctx.fillStyle = col; q.ctx.fill()
  q.ctx.strokeStyle = bordo; q.ctx.lineWidth = 0.55 * s; q.ctx.stroke()
  // le dita, che sono quello che rende l'ala una mano e non un velo
  q.ctx.strokeStyle = mescola(col, '#000000', 0.3); q.ctx.lineWidth = 0.5 * s
  for (let i = 1; i <= 2; i++) {
    const d = i / 3
    q.ctx.beginPath(); q.ctx.moveTo(x, y)
    q.ctx.lineTo(x + v * L * d * s, y + alto * (0.1 + d * 0.28) * s); q.ctx.stroke()
  }
}

// granchi e scorpioni: due pinze che si chiudono di un pelo a ogni respiro
export function chela(q, s, x, y, v, col, bordo, { grande = 1, stretta = 0 } = {}) {
  const g = grande, sp = 0.6 * s
  q.in(x, y, r => {
    capsula(r, 0, 0, 2.2 * g * s, 1.6 * g * s, 1.2 * g * s, col, bordo, sp)
    poligono(r, [[0.6 * g * s, -1.4 * g * s], [3.6 * g * s, (-2.4 + stretta) * g * s],
                 [2.4 * g * s, (-0.2 + stretta * 0.4) * g * s]], col, bordo, sp)
    poligono(r, [[0.6 * g * s, 1.2 * g * s], [3.6 * g * s, (2.2 - stretta) * g * s],
                 [2.4 * g * s, (0.2 - stretta * 0.4) * g * s]], mescola(col, '#000000', 0.2), bordo, sp)
  }, v > 0 ? 0 : Math.PI)
}

// blatte, scarabei, granchi: un dorso è una fila di piastre, non una macchia di colore (tre bastano)
export function corazza(q, s, w, h, col, bordo, piastre = 3) {
  tondo(q, 0, 0, w * s, h * s, col, bordo, 0.75 * s)
  q.ctx.strokeStyle = mescola(col, '#000000', 0.35); q.ctx.lineWidth = 0.55 * s
  for (let i = 1; i <= piastre; i++) {
    const y = (-h + (2 * h * i) / (piastre + 1)) * s
    const larghezza = w * s * Math.sqrt(Math.max(0, 1 - (y / (h * s)) ** 2)) * 0.92
    q.ctx.beginPath()
    q.ctx.moveTo(-larghezza, y)
    q.ctx.quadraticCurveTo(0, y + 1.1 * s, larghezza, y)
    q.ctx.stroke()
  }
}

// un cono di segmenti che si assottiglia; torna dov'è finita la punta (dove va il pungiglione)
export function coda(q, s, { da = { x: 0, y: 0 }, lungo = 9, spesso = 2,
                             daAngolo = -2.2, aAngolo = 0.4,
                             col = '#6b5a3f', bordo = '#2b2416', segmenti = 6 } = {}) {
  // angoli di Math.atan2 con l'alto negativo: -2.2 parte indietro-in-alto, 0.4 arriva davanti (da/a, non verso+arco)
  let x = da.x, y = da.y, fine = { x, y }
  for (let i = 0; i < segmenti; i++) {
    const d = i / (segmenti - 1)
    const ang = daAngolo + (aAngolo - daAngolo) * d
    x += Math.cos(ang) * (lungo / segmenti) * s
    y += Math.sin(ang) * (lungo / segmenti) * s
    const r = spesso * (1 - d * 0.5) * s
    tondo(q, x, y, r, r, mescola(col, '#000000', d * 0.18), bordo, 0.5 * s)
    fine = { x, y }
  }
  return fine
}
