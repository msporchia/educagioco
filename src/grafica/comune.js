/* ═══════════════════════════════════════════════════════════════════
   IL FONDO DEL CASSETTO — colore e forme, per tutti

   Le due dozzine di righe che stavano in cima a `generale.js` e in cima
   a `ambienti.js`, scritte due volte. Non è un modulo «di utilità»: è
   il posto dove sta l'unica cosa che chi disegna gli omini e chi
   disegna i muri devono avere in comune, cioè **come si mescola un
   colore** e **come si traccia una capsula**.

   Due livelli, apposta:
     · `capsula`, `poligono`, `tondo` prendono il **pennello** di
       `tela.js` (usano `q.ctx`): li usa chi disegna in scena;
     · `rett`, `ell`, `velo`, `poly` prendono il **contesto 2D nudo**:
       li usa chi dipinge il fondale, che lavora su una tela di scorta
       che il motore non conosce.
   ═══════════════════════════════════════════════════════════════════ */
import { RESA } from './resa.js'
import { trama } from './materia.js'

/* ─────────── colore ───────────
   Due sole funzioni, e servono a non scrivere a mano trenta tinte:
   l'ombra di un colore è quel colore più scuro, e un personaggio che
   lampeggia è la sua tavolozza spostata verso il rosso. */

const canale = (c, i) => parseInt(c.slice(i, i + 2), 16)

export function mescola(a, b, q) {
  return '#' + [1, 3, 5].map(i =>
    Math.round(canale(a, i) + (canale(b, i) - canale(a, i)) * q)
      .toString(16).padStart(2, '0')).join('')
}

export const buio = (c, q = 0.34) => mescola(c, '#1a1226', q)

/* la tavolozza intera spostata verso una tinta: è così che un
   personaggio diventa rosso di errore o bianco di botta senza che
   ogni singola figura debba saperlo */
export function tinge(pal, col, q) {
  if (q <= 0) return pal
  const out = {}
  for (const k in pal) {
    const v = pal[k]
    out[k] = (typeof v === 'string' && v[0] === '#' && v.length === 7)
      ? mescola(v, col, q) : v
  }
  return out
}

/* ─────────── il volume ───────────
   La ragione per cui trent'anni di cerchi in più non miglioravano il
   disegno: `fillStyle` prendeva sempre **una tinta sola**, e una tinta
   sola è una campitura, non un corpo. Aggiungere forme dentro una
   campitura non le dà volume — la riempie di righe.

   Il rimedio non è disegnare di più: è che la stessa forma, riempita
   con un gradiente invece che con una tinta, smette di essere un
   ritaglio di carta. `fillStyle` accetta già un `CanvasGradient`, e i
   pittori continuano a passare la loro stringa: la traduzione avviene
   qui sotto, una volta, per tutti.

   **La luce viene dall'alto**, sempre, in tutto il gioco. Non è una
   semplificazione da poco prezzo: la scena è vista di tre quarti
   dall'alto, e una direzione sola dichiarata una volta è ciò che fa
   sembrare le figure illuminate dalla stessa lampada invece che
   ognuna dalla sua. */

const CHIARO = '#ffffff', SCURO = '#0a0616'

const tinta = c => typeof c === 'string' && c.length === 7 && c[0] === '#'

/* Dall'alto schiarito al basso incupito, lungo l'altezza della forma.

   ── la curva non è diritta, ed è tutta la differenza ──
   Un gradiente lineare da chiaro a scuro fa una cosa sola: sbiadisce.
   Il primo tentativo era esattamente quello — 26% di bianco in cima,
   24% di nero in fondo, in mezzo il colore — e il risultato restava
   *piatto*, perché una superficie che cambia tono in modo uniforme è
   quello che l'occhio legge come **carta stampata male**, non come
   una cosa tonda.

   Quello che dice «tondo» è dove la luce **smette**: un colmo chiaro
   stretto in alto, un tuffo rapido verso il tono pieno, e poi il
   fondo che si scurisce piano. Tre fermate ravvicinate in cima e una
   lontana in fondo — cioè una curva con un ginocchio, non una
   diagonale. È la stessa ragione per cui `luce.js` alle pozze delle
   torce dà cinque fermate e non due.

   E in fondo il colore non va nel nero ma nel blu della notte: il
   nero spegne e basta, un'ombra colorata resta materia. */
function volume(c, col, alto, basso) {
  if (!RESA.volume || !tinta(col)) return col
  const g = c.createLinearGradient(0, alto, 0, basso)
  g.addColorStop(0, mescola(col, CHIARO, 0.46))     // il colmo
  g.addColorStop(0.16, mescola(col, CHIARO, 0.22))  // il ginocchio
  g.addColorStop(0.42, col)                         // il tono pieno
  g.addColorStop(1, mescola(col, SCURO, 0.34))      // il sottosquadro
  return g
}

/* ─────────── posare la materia ───────────
   Va chiamata **con il tracciato della forma ancora in mano**: si
   ritaglia su quello e si riempie. Il motivo vive nelle coordinate
   del contesto di adesso — che chi disegna un personaggio ha già
   traslato sulla figura — e quindi **viaggia con lei**. È tutta qui la
   differenza fra una materia e una filigrana: nessuno calcola dove
   sta la trama, ci pensa la stessa matrice che sposta il disegno.

   Il riquadro da riempire si prende largo: costa un `fillRect` di
   qualche decina di pixel, e sbagliarlo stretto lascerebbe un angolo
   della forma senza trama. */
function posaMateria(c, materia, x, y, w, h) {
  if (!materia || !RESA.materia) return
  const t = trama(c, materia)
  if (!t) return
  c.save()
  c.clip()
  c.fillStyle = t
  c.fillRect(x - w, y - h, w * 2, h * 2)
  c.restore()
}

/* ─────────── le forme che ricorrono ───────────
   Un gioco di omini è fatto quasi tutto di capsule e di poligoni con
   il contorno scuro. Il contorno non è un vezzo: a 36 px è l'unica
   cosa che tiene staccato un personaggio dal pavimento. */

export function capsula(q, x, y, w, h, r, col, bordo, sp, materia) {
  const c = q.ctx
  r = Math.min(r, w, h)
  c.beginPath()
  c.moveTo(x - w + r, y - h)
  c.arcTo(x + w, y - h, x + w, y + h, r)
  c.arcTo(x + w, y + h, x - w, y + h, r)
  c.arcTo(x - w, y + h, x - w, y - h, r)
  c.arcTo(x - w, y - h, x + w, y - h, r)
  c.closePath()
  c.fillStyle = volume(c, col, y - h, y + h); c.fill()
  posaMateria(c, materia, x, y, w + 2, h + 2)
  if (bordo) { c.strokeStyle = bordo; c.lineWidth = sp; c.lineJoin = 'round'; c.stroke() }
}

export function poligono(q, punti, col, bordo, sp, materia) {
  const c = q.ctx
  c.beginPath()
  punti.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y))
  c.closePath()
  let alto = Infinity, basso = -Infinity
  if (RESA.volume) for (const [, y] of punti) { if (y < alto) alto = y; if (y > basso) basso = y }
  c.fillStyle = volume(c, col, alto, basso); c.fill()
  if (materia) {
    let sx = Infinity, dx = -Infinity
    for (const [x] of punti) { if (x < sx) sx = x; if (x > dx) dx = x }
    posaMateria(c, materia, (sx + dx) / 2, (alto + basso) / 2,
                (dx - sx) / 2 + 2, (basso - alto) / 2 + 2)
  }
  if (bordo) { c.strokeStyle = bordo; c.lineWidth = sp; c.lineJoin = 'round'; c.stroke() }
}

export function tondo(q, x, y, rx, ry, col, bordo, sp, materia) {
  const c = q.ctx
  c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 6.29)
  c.fillStyle = volume(c, col, y - ry, y + ry); c.fill()
  posaMateria(c, materia, x, y, rx + 2, ry + 2)
  if (bordo) { c.strokeStyle = bordo; c.lineWidth = sp; c.stroke() }
}


/* ─────────── le stesse cose sul contesto nudo ─────────── */

export const rett = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h) }

export const ell = (c, x, y, rx, ry, col) => {
  c.fillStyle = col; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 6.29); c.fill()
}

export const velo = (c, q, fn) => { const a = c.globalAlpha; c.globalAlpha = a * q; fn(); c.globalAlpha = a }

export function poly(c, punti, col, bordo, sp) {
  c.beginPath()
  punti.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y))
  c.closePath(); c.fillStyle = col; c.fill()
  if (bordo) { c.strokeStyle = bordo; c.lineWidth = sp; c.lineJoin = 'round'; c.stroke() }
}

/* ─────────── il caso che non cambia mai ───────────
   `dado(a, b, c)` è un numero fra 0 e 1 che dipende solo dai tre
   interi che gli dai. Nessuno stato, nessun ordine di chiamata: la
   stessa stanza esce identica anche se domani la si dipingesse a
   riquadri, al contrario, o due volte. */
export function dado(a, b = 0, c = 0) {
  let t = (Math.imul(a | 0, 73856093) ^ Math.imul(b | 0, 19349663) ^ Math.imul(c | 0, 83492791)) >>> 0
  t = Math.imul(t ^ t >>> 15, 0x85ebca6b)
  t = Math.imul(t ^ t >>> 13, 0xc2b2ae35)
  return ((t ^ t >>> 16) >>> 0) / 4294967296
}
