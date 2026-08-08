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

/* ─────────── le forme che ricorrono ───────────
   Un gioco di omini è fatto quasi tutto di capsule e di poligoni con
   il contorno scuro. Il contorno non è un vezzo: a 36 px è l'unica
   cosa che tiene staccato un personaggio dal pavimento. */

export function capsula(q, x, y, w, h, r, col, bordo, sp) {
  const c = q.ctx
  r = Math.min(r, w, h)
  c.beginPath()
  c.moveTo(x - w + r, y - h)
  c.arcTo(x + w, y - h, x + w, y + h, r)
  c.arcTo(x + w, y + h, x - w, y + h, r)
  c.arcTo(x - w, y + h, x - w, y - h, r)
  c.arcTo(x - w, y - h, x + w, y - h, r)
  c.closePath()
  c.fillStyle = col; c.fill()
  if (bordo) { c.strokeStyle = bordo; c.lineWidth = sp; c.lineJoin = 'round'; c.stroke() }
}

export function poligono(q, punti, col, bordo, sp) {
  const c = q.ctx
  c.beginPath()
  punti.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y))
  c.closePath()
  c.fillStyle = col; c.fill()
  if (bordo) { c.strokeStyle = bordo; c.lineWidth = sp; c.lineJoin = 'round'; c.stroke() }
}

export function tondo(q, x, y, rx, ry, col, bordo, sp) {
  const c = q.ctx
  c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 6.29)
  c.fillStyle = col; c.fill()
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
