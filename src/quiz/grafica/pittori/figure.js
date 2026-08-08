/* ═══════════════════════════════════════════════════════════════════
   I PITTORI DELLE FIGURE A ATTRIBUTI

   Li dividono i due moduli che fanno domande sulle regole nascoste —
   `sequenze` (cosa viene dopo, chi non c'entra) e `analogie` (A sta a B
   come C sta a ?) — perché la figura è la stessa cosa e disegnarla due
   volte vorrebbe dire vederla diversa in due domande.

   Tre scene, tutte dentro il quadrato 100×100:

     { che: 'cella',    fig: {forma,colore,quante,grande,ruota} }
     { che: 'fila',     celle: [fig, …], buco: true }
     { che: 'analogia', a, b, c }        ognuno { fig } oppure { em }

   Una FIGURA qui ha cinque attributi, e sono cinque perché sono le
   cinque cose che una regola può far cambiare: la forma, il colore,
   quante ce ne sono, se è grande o piccola, come è girata. Il pittore
   non sa quale di questi sia la regola e quali siano rumore — quello lo
   sa il modulo, ed è tutta la difficoltà della domanda.

   LA FILA È IL SOGGETTO, la cella è la risposta: la stessa figura si
   vede in fila piccola e nel tasto grande, quindi **la taglia non si
   può leggere confrontando i due disegni**. Per questo `grande` non
   cambia la cella di quanto cambierebbe una figura sul foglio: dentro
   la sua cella una figura grande riempie, una piccola sta in mezzo, e
   il paragone si fa fra celle vicine — mai fra la fila e il tasto.
   ═══════════════════════════════════════════════════════════════════ */

import { tinta } from './tinte.js'

const GIRO = Math.PI * 2

/* poligono regolare centrato in (0,0), primo vertice in alto */
function regolare(n, r, fase = 0) {
  const v = []
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + fase + (i / n) * GIRO
    v.push([Math.cos(a) * r, Math.sin(a) * r])
  }
  return v
}

/* la stella a cinque punte: raggio grande e piccolo che si alternano */
function stella(r) {
  const v = []
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i / 10) * GIRO
    const k = i % 2 ? r * 0.45 : r
    v.push([Math.cos(a) * k, Math.sin(a) * k])
  }
  return v
}

/* il cuore, per punti: è la forma che i bambini riconoscono da più
   lontano di tutte, e in una fila piccola serve proprio quello */
function cuore(r) {
  const v = []
  for (let i = 0; i <= 40; i++) {
    const t = (i / 40) * GIRO
    const x = 16 * Math.sin(t) ** 3
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))
    v.push([x * r / 17, y * r / 17])
  }
  return v
}

const SAGOME = {
  cerchio: null,                                  // il cerchio si disegna a parte
  quadrato: r => [[-r, -r], [r, -r], [r, r], [-r, r]],
  triangolo: r => regolare(3, r * 1.15),
  rombo: r => [[0, -r * 1.15], [r * 0.85, 0], [0, r * 1.15], [-r * 0.85, 0]],
  stella: r => stella(r * 1.15),
  cuore: r => cuore(r * 1.1),
  freccia: r => [[0, -r * 1.15], [r, r * 0.15], [r * 0.42, r * 0.15], [r * 0.42, r * 1.1],
    [-r * 0.42, r * 1.1], [-r * 0.42, r * 0.15], [-r, r * 0.15]],
}
export const FORME_FIGURE = Object.keys(SAGOME)

/* Dove stanno le figurine quando ce n'è più di una, e quanto si
   rimpiccioliscono. I numeri sono stretti apposta: **niente deve uscire
   dalla propria cella**. In una fila le celle sono attaccate, e una
   figura che sborda si legge come se stesse nella cella di fianco —
   guardando gli scatti si vedevano due quadrati di una cella sola letti
   come due celle, e la sequenza diventava incontabile. Il conto da
   rispettare: scarto + raggio × 1.15 (la forma più sporgente) < 0.5. */
const POSTI = {
  1: [[0, 0]],
  2: [[-0.25, 0], [0.25, 0]],
  3: [[0, -0.25], [-0.25, 0.23], [0.25, 0.23]],
  4: [[-0.25, -0.25], [0.25, -0.25], [-0.25, 0.25], [0.25, 0.25]],
}
const RIMPICCIOLISCE = { 1: 1, 2: 0.5, 3: 0.44, 4: 0.42 }

/* una figura dentro un quadrato di lato `lato` centrato in (cx, cy) */
function unaFigura(p, fig, cx, cy, lato) {
  const t = tinta(fig.colore)
  const quante = fig.quante || 1
  const grande = fig.grande === undefined ? true : fig.grande
  const posti = POSTI[quante] || POSTI[1]
  const raggio = lato * 0.5 * 0.78 * RIMPICCIOLISCE[quante] * (grande ? 1 : 0.62)
  const orlo = Math.max(1, lato * 0.035)

  for (const [dx, dy] of posti) {
    const x = cx + dx * lato, y = cy + dy * lato
    if (fig.forma === 'cerchio') {
      p.cerchio(x, y, raggio, t.base)
      const giro = []
      for (let i = 0; i <= 40; i++) giro.push({ x: x + Math.cos(i / 40 * GIRO) * raggio, y: y + Math.sin(i / 40 * GIRO) * raggio })
      p.linea(giro, t.orlo, orlo)
      continue
    }
    const punti = (SAGOME[fig.forma] || SAGOME.quadrato)(raggio)
    p.in(x, y, q => {
      q.figura(punti, t.base)
      q.ctx.lineCap = 'round'
      q.linea([...punti, punti[0]].map(([a, b]) => ({ x: a, y: b })), t.orlo, orlo)
      q.ctx.lineCap = 'butt'
    }, ((fig.ruota || 0) / 360) * GIRO)
  }
}

/* il fondo di una cella: serve a far vedere dove finisce una figura e
   dove comincia la prossima, che in una sequenza è metà del lavoro */
function fondo(p, x, y, lato) {
  p.rett(x + lato * 0.05, y + lato * 0.05, lato * 0.9, lato * 0.9, 'rgba(233,240,255,.1)')
}

export function cella(p, { fig = {} }) {
  p.ctx.lineJoin = 'round'
  fondo(p, 4, 4, 92)
  unaFigura(p, fig, 50, 50, 92)
}

/* la fila, col posto vuoto in fondo. Il «?» non è un vezzo: senza,
   l'ultima cella vuota si legge come «qui non c'è niente» invece che
   «questa è la domanda» — e un bambino che conta i posti sbaglia il
   passo di uno. */
export function fila(p, { celle = [], buco = true, colore = 'azzurro' }) {
  const n = celle.length + (buco ? 1 : 0)
  if (!n) return
  const lato = Math.min(96 / n, 46)
  const w = lato * n
  const x0 = 50 - w / 2, y0 = 50 - lato / 2
  p.ctx.lineJoin = 'round'

  celle.forEach((f, i) => {
    fondo(p, x0 + i * lato, y0, lato)
    unaFigura(p, f, x0 + i * lato + lato / 2, 50, lato)
  })
  if (!buco) return

  const x = x0 + celle.length * lato
  p.rett(x + lato * 0.04, y0 + lato * 0.04, lato * 0.92, lato * 0.92, 'rgba(255,209,103,.13)')
  p.testo('?', x + lato / 2, 50, tinta(colore).orlo, lato * 0.62, 800)
}

/* ── l'analogia ──
     { che: 'analogia', a: {fig|em}, b: {fig|em}, c: {fig|em} }

   Due righe, e sono due righe apposta: «A sta a B» sopra, «C sta a ?»
   sotto, incolonnate. In fila unica (A B C ?) la coppia da capire e la
   coppia da completare si leggono come una sequenza sola, e il bambino
   cerca un ritmo che non c'è. Incolonnate, la freccia si legge due
   volte e si vede che è la stessa.

   La casella accetta una figura o un'emoji, perché l'analogia vale su
   tutti e due: «piccolo sta a grande» è la stessa domanda di «la mucca
   sta al latte». Il layout è uno, il contenuto no. */
function casella(p, cosa, cx, cy, lato) {
  if (!cosa) return
  if (cosa.em !== undefined) { p.testo(cosa.em, cx, cy + lato * 0.03, '#eaf0ff', lato * 0.72, 400); return }
  fondo(p, cx - lato / 2, cy - lato / 2, lato)
  unaFigura(p, cosa.fig, cx, cy, lato)
}

function freccia(p, x1, x2, y, col) {
  p.linea([{ x: x1, y }, { x: x2, y }], col, 2)
  p.figura([[x2, y], [x2 - 4.5, y - 3.2], [x2 - 4.5, y + 3.2]], col)
}

export function analogia(p, { a, b, c, colore = 'azzurro' }) {
  const t = tinta(colore)
  const lato = 30
  const y1 = 27, y2 = 73
  const xa = 22, xb = 78                    // le due colonne
  p.ctx.lineJoin = 'round'
  p.ctx.lineCap = 'round'

  casella(p, a, xa, y1, lato)
  casella(p, b, xb, y1, lato)
  casella(p, c, xa, y2, lato)

  /* il posto della risposta: il «?» al posto del disegno, così si vede
     che manca una cosa e non che ce n'è una vuota */
  p.rett(xb - lato / 2, y2 - lato / 2, lato, lato, 'rgba(255,209,103,.13)')
  p.testo('?', xb, y2, t.orlo, lato * 0.66, 800)

  for (const y of [y1, y2]) freccia(p, xa + lato / 2 + 4, xb - lato / 2 - 4, y, 'rgba(233,240,255,.55)')
  p.ctx.lineCap = 'butt'
}

export const PITTORI_FIGURE = { cella, fila, analogia }
