/* ═══════════════════════════════════════════════════════════════════
   IL FONDO DEL CASSETTO DEL BESTIARIO

   Le creature del dungeon non camminano su una griglia e non si vedono
   di spalle: stanno ferme al centro dello schermo, grandi, e aspettano
   che gli si risponda. Sono quindi disegnate **di fronte e basta**, e
   quello che le distingue dai personaggi del Generale non è lo stile —
   è lo stesso, e deve restarlo — ma il fatto che possono permettersi
   il dettaglio: là una figura è larga trentasei pixel e un dente in
   più è una macchia, qui ne è larga centoventi.

   Qui dentro c'è solo quello che più di una creatura ha in comune:
   zampe di ragno, ali di membrana, un guscio, una coda. Chi ha una
   cosa sua se la disegna a casa propria — un file per creatura,
   esattamente come in `personaggi/`.
   ═══════════════════════════════════════════════════════════════════ */
import { mescola, capsula, poligono, tondo } from '../comune.js'

/* ─────────── gli occhi cattivi ───────────
   `segni.js` ne ha già di suoi, e sono quelli giusti per chi ha una
   faccia. Ma metà del bestiario non ce l'ha: un ragno ha otto puntini
   in fila, uno sciame di occhi senza espressione, e un guscio ne ha
   due che luccicano nel buio. Quelli sono questi.

   Da `ko` valgono le stesse due croci di tutto il gioco: non è una
   ripetizione da togliere, è la cosa che un bambino di sei anni
   riconosce prima di leggere qualsiasi barra. */
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

/* ─────────── le zampe articolate ───────────
   Quelle del ragno e dello scorpione: due segmenti con un ginocchio in
   mezzo, che è l'unica cosa che le distingue da otto bastoncini. Il
   ginocchio sta **più in alto del corpo** — è la posa che dice ragno
   anche a chi vede la sagoma per mezzo secondo.

   `apri` sposta il piede in fuori, `su` quanto è alto il ginocchio, e
   il fremito lo passa chi mette in scena: le zampe di una cosa viva
   non stanno mai ferme del tutto. */
export function zampe(q, s, quante, { lungo = 7, apri = 1, su = 4.4, y = 0,
                                      col = '#2f2a3d', sp = 0.9, fremito = 0 } = {}) {
  q.ctx.strokeStyle = col; q.ctx.lineWidth = sp * s; q.ctx.lineCap = 'round'
  q.ctx.lineJoin = 'round'
  for (let i = 0; i < quante; i++) {
    const passo = quante > 1 ? i / (quante - 1) - 0.5 : 0
    for (const v of [-1, 1]) {
      const f = Math.sin(fremito + i * 1.7 + v) * 0.35 * s
      /* Il ginocchio va **fuori dal corpo**, non sopra: tenuto stretto
         all'attaccatura finiva sotto l'addome e le otto zampe
         sparivano, che è esattamente il difetto che questa creatura
         doveva risolvere. Sporge di mezza lunghezza e poi il piede
         scende: è la posa che si legge anche in silhouette. */
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

/* ─────────── l'ala di membrana ───────────
   Pipistrelli, arpie, draghi: tre dita e la pelle tesa in mezzo, che è
   il modo più corto di dire «vola» senza disegnare una piuma. Si apre
   e si chiude col respiro di chi la porta — un'ala ferma è un
   cartonato. */
export function ala(q, s, v, { lungo = 9, alto = 6, col = '#4b3a63', bordo = '#241a35',
                               apertura = 1, x = 0, y = 0 } = {}) {
  const L = lungo * apertura
  q.ctx.beginPath()
  q.ctx.moveTo(x, y)
  q.ctx.quadraticCurveTo(x + v * L * 0.5 * s, y - alto * s, x + v * L * s, y - alto * 0.28 * s)
  // le tre insenature fra le dita: senza, è un ritaglio di stoffa
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

/* ─────────── la chela ───────────
   Granchi e scorpioni. Due pinze che si chiudono di un pelo a ogni
   respiro: è quel movimento, non la forma, a togliere alla figura
   l'aria di soprammobile. */
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

/* ─────────── il guscio a piastre ───────────
   Blatte, scarabei, granchi: un dorso non è una macchia di colore, è
   una fila di piastre che si accavallano. Tre bastano; a sei diventa
   una grattugia. */
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

/* ─────────── la coda ───────────
   Un cono di segmenti che si assottiglia, curvato dove dice `arco`.
   La usano il serpente, lo scorpione e la lucertola, e ognuno le
   attacca in cima quello che vuole. Torna dov'è finita la punta, che
   è dove va messo il pungiglione. */
export function coda(q, s, { da = { x: 0, y: 0 }, lungo = 9, spesso = 2,
                             daAngolo = -2.2, aAngolo = 0.4,
                             col = '#6b5a3f', bordo = '#2b2416', segmenti = 6 } = {}) {
  /* Gli angoli sono quelli di `Math.atan2` con l'alto negativo, come
     tutto il resto del disegno: `-2.2` parte indietro-in-alto, `0.4`
     arriva davanti. Per un po' questa funzione prendeva un «verso» e
     un «arco», e la coda dello scorpione usciva **di fianco** invece
     che sopra la testa: due parametri che vanno d'accordo solo se chi
     li scrive tiene a mente la formula non sono due parametri, sono un
     tranello. Dire da dove parte e dove arriva si sbaglia meno. */
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
