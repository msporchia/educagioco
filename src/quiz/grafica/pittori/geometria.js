/* ═══════════════════════════════════════════════════════════════════
   I PITTORI DELLA GEOMETRIA

   Cinque scene, tutte dentro il quadrato 100×100 del riquadro:

     { che: 'figura',  forma: 'esagono', ruota: .12, colore: 'verde',
                       asse: null | 'v' | 'o' | 'd1' | 'd2' }
     { che: 'griglia', celle: [[0,0],[1,0]], colonne: 4, righe: 4,
                       colore: 'viola', asse: null|'sinistra'|'destra'|'centro' }
     { che: 'angolo',  gradi: 90, ruota: 1.2, colore: 'giallo' }
     { che: 'solido',  tipo: 'cubo', colore: 'azzurro' }
     { che: 'costruzione', cubi: [[0,0,0],[1,0,0],[0,0,1]], colore: 'viola',
                       scatola: 0 | 2 | 3 }

   QUI NON SI DECIDE NIENTE. Il pittore non sa quale sia la risposta
   giusta, non sa che grado di difficoltà sta servendo e non ruota né
   specchia niente per conto suo: `celle` sono già le celle che si
   devono vedere. È una scelta voluta — nel modulo una figura girata di
   un quarto e la stessa specchiata devono essere due liste di celle
   diverse, altrimenti due risposte con un JSON diverso potrebbero
   apparire identiche al bambino, che è il guasto peggiore di tutti
   perché nessun controllo automatico lo prende.

   IL COLORE È UN NOME, non un codice: la scena dice `colore: 'verde'`
   e le tre gradazioni che servono a far sembrare un cubo un cubo
   stanno qui. Dentro una stessa domanda tutte le figure hanno lo
   stesso colore, se no il bambino sceglie il colore e non la forma.
   ═══════════════════════════════════════════════════════════════════ */

/* la tavolozza sta in `tinte.js`: la dividono con i pittori delle
   sequenze, dove il colore non è decorazione ma la regola stessa —
   e allora due rossi diversi sarebbero un guasto. `COLORI` si
   ri-esporta perché i moduli lo importano da qui da sempre. */
import { COLORI, tinta, inchiostroAsse } from './tinte.js'
export { COLORI }

const GIRO = Math.PI * 2


/* ── attrezzi ── */

/* poligono regolare centrato in (0,0), primo vertice in alto */
function regolare(n, r, fase = 0) {
  const v = []
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + fase + (i / n) * GIRO
    v.push([Math.cos(a) * r, Math.sin(a) * r])
  }
  return v
}

/* un quarto di giro in senso orario, `q` volte (le coordinate hanno la
   y in giù, quindi (x,y) → (−y,x) gira come le lancette) */
const ruotaPunti = (v, q) => {
  let r = v
  for (let i = 0; i < ((q % 4) + 4) % 4; i++) r = r.map(([x, y]) => [-y, x])
  return r
}

const chiudi = v => [...v, v[0]].map(([x, y]) => ({ x, y }))

/* il contorno si chiude tornando sul primo punto, e i capi tondi
   servono a non lasciare la tacchetta che si vede dove il tratto
   finisce sopra sé stesso */
function faccia(p, punti, riempimento, orlo, spessore = 1.6) {
  p.figura(punti, riempimento)
  if (!orlo) return
  p.ctx.lineCap = 'round'
  p.linea(chiudi(punti), orlo, spessore)
  p.ctx.lineCap = 'butt'
}

function tratteggio(p, [ax, ay], [bx, by], col) {
  const dx = bx - ax, dy = by - ay
  const n = Math.max(2, Math.round(Math.hypot(dx, dy) / 7))
  for (let i = 0; i < n; i += 2) {
    const t0 = i / n, t1 = (i + 0.72) / n
    p.linea([{ x: ax + dx * t0, y: ay + dy * t0 }, { x: ax + dx * t1, y: ay + dy * t1 }], col, 2.4)
  }
}

/* ── le figure piane ──
   Le varianti girate si ricavano da quelle dritte: così «la casa col
   tetto a destra» non è una seconda lista di punti da tenere allineata
   a mano, ed è garantito che sia proprio la stessa figura. */
const DRITTE = {
  triangolo: regolare(3, 46),
  quadrato: [[-32, -32], [32, -32], [32, 32], [-32, 32]],
  rettangolo: [[-44, -26], [44, -26], [44, 26], [-44, 26]],
  rombo: [[0, -44], [32, 0], [0, 44], [-32, 0]],
  trapezio: [[-25, -28], [25, -28], [44, 28], [-44, 28]],
  pentagono: regolare(5, 45),
  esagono: regolare(6, 45),
  ottagono: regolare(8, 44, Math.PI / 8),
  isoscele: [[0, -42], [40, 34], [-40, 34]],
  casa: [[0, -44], [38, -10], [38, 40], [-38, 40], [-38, -10]],
  freccia: [[0, -44], [40, 6], [17, 6], [17, 42], [-17, 42], [-17, 6], [-40, 6]],
  retto: [[-38, -38], [38, -38], [-38, 38]],
}

const FORME = { ...DRITTE }
for (const f of ['isoscele', 'casa', 'freccia', 'trapezio']) {
  FORME[f + '-su'] = DRITTE[f]
  FORME[f + '-destra'] = ruotaPunti(DRITTE[f], 1)
  FORME[f + '-giu'] = ruotaPunti(DRITTE[f], 2)
  FORME[f + '-sinistra'] = ruotaPunti(DRITTE[f], 3)
}
/* i quattro triangoli rettangoli, chiamati come sta l'angolo retto */
FORME['retto-tl'] = DRITTE.retto
FORME['retto-tr'] = ruotaPunti(DRITTE.retto, 1)
FORME['retto-br'] = ruotaPunti(DRITTE.retto, 2)
FORME['retto-bl'] = ruotaPunti(DRITTE.retto, 3)

export const FORME_NOTE = Object.keys(FORME).concat('cerchio')

const ASSI = {
  v: [[50, 4], [50, 96]],
  o: [[4, 50], [96, 50]],
  d1: [[7, 7], [93, 93]],
  d2: [[7, 93], [93, 7]],
}

export function figura(p, { forma = 'quadrato', ruota = 0, colore = 'azzurro', asse = null }) {
  const t = tinta(colore)
  p.ctx.lineJoin = 'round'
  p.in(50, 50, q => {
    if (forma === 'cerchio') {
      q.cerchio(0, 0, 43, t.base)
      const cerchietto = []
      for (let i = 0; i <= 40; i++) cerchietto.push({ x: Math.cos(i / 40 * GIRO) * 43, y: Math.sin(i / 40 * GIRO) * 43 })
      q.linea(cerchietto, t.orlo, 2.6)
    } else {
      const v = FORME[forma] || FORME.quadrato
      faccia(q, v, t.base, t.orlo, 2.6)
    }
  }, ruota)
  if (asse && ASSI[asse]) tratteggio(p, ASSI[asse][0], ASSI[asse][1], inchiostroAsse(colore))
}

/* ── la griglia ──
   Il quaderno a quadretti: un pannello chiaro, i quadretti segnati e le
   celle accese sopra. L'asse è la piega, e si disegna sul bordo dove il
   modulo dice che sta lo specchio. */
export function griglia(p, { celle = [], colonne = 4, righe = 4, colore = 'azzurro', asse = null }) {
  const t = tinta(colore)
  const lato = Math.min(84 / colonne, 84 / righe)
  const w = lato * colonne, h = lato * righe
  const x0 = 50 - w / 2, y0 = 50 - h / 2
  p.ctx.lineJoin = 'round'

  p.rett(x0 - 4, y0 - 4, w + 8, h + 8, 'rgba(233,240,255,.09)')
  for (let i = 0; i <= colonne; i++)
    p.linea([{ x: x0 + i * lato, y: y0 }, { x: x0 + i * lato, y: y0 + h }], 'rgba(233,240,255,.22)', 0.8)
  for (let j = 0; j <= righe; j++)
    p.linea([{ x: x0, y: y0 + j * lato }, { x: x0 + w, y: y0 + j * lato }], 'rgba(233,240,255,.22)', 0.8)

  for (const [cx, cy] of celle) {
    const x = x0 + cx * lato + 0.9, y = y0 + cy * lato + 0.9, l = lato - 1.8
    p.rett(x, y, l, l, t.base)
    p.linea([{ x, y }, { x: x + l, y }, { x: x + l, y: y + l }, { x, y: y + l }, { x, y }], t.orlo, 1.3)
  }

  if (asse) {
    const x = asse === 'destra' ? x0 + w : asse === 'centro' ? x0 + w / 2 : x0
    tratteggio(p, [x, y0 - 7], [x, y0 + h + 7], inchiostroAsse(colore))
  }
}

/* ── l'angolo ──
   Due raggi e il ventaglio che sta in mezzo: senza il ventaglio colorato
   un bambino guarda i raggi invece dell'apertura. Niente quadratino
   dell'angolo retto: sarebbe la risposta scritta sopra la domanda. */
export function angolo(p, { gradi = 90, ruota = 0, colore = 'azzurro' }) {
  const t = tinta(colore)
  const a0 = ruota, a1 = ruota + gradi * Math.PI / 180

  /* Si centra l'angolo, non il suo vertice: i due raggi partono da un
     punto solo e vanno tutti e due dalla stessa parte, quindi col
     vertice in mezzo al riquadro il disegno finisce sempre in un
     angolo. Si misura l'ingombro a raggio unitario, si allunga fino a
     riempire il quadrato e si sposta il vertice di conseguenza — così
     un angolo stretto e uno largo occupano lo stesso spazio e la
     grandezza del disegno non suggerisce la risposta. */
  const ingombro = [[0, 0], [Math.cos(a0), Math.sin(a0)], [Math.cos(a1), Math.sin(a1)]]
  for (let i = 0; i <= 16; i++) {
    const a = a0 + (a1 - a0) * (i / 16)
    ingombro.push([Math.cos(a) * 0.42, Math.sin(a) * 0.42])
  }
  const xs = ingombro.map(q => q[0]), ys = ingombro.map(q => q[1])
  const x1 = Math.min(...xs), x2 = Math.max(...xs), y1 = Math.min(...ys), y2 = Math.max(...ys)
  const lungo = Math.min(86 / (x2 - x1), 86 / (y2 - y1))
  const raggio = Math.min(lungo * 0.42, 21)
  const vx = 50 - (x1 + x2) / 2 * lungo, vy = 50 - (y1 + y2) / 2 * lungo
  const su = a => ({ x: vx + Math.cos(a) * lungo, y: vy + Math.sin(a) * lungo })

  const ventaglio = [[vx, vy]]
  for (let i = 0; i <= 24; i++) {
    const a = a0 + (a1 - a0) * (i / 24)
    ventaglio.push([vx + Math.cos(a) * raggio, vy + Math.sin(a) * raggio])
  }
  p.ctx.lineCap = 'round'
  p.velo(0.42, q => q.figura(ventaglio, t.luce))
  p.linea(ventaglio.slice(1).map(([x, y]) => ({ x, y })), t.luce, 2)
  p.linea([{ x: vx, y: vy }, su(a0)], t.base, 5)
  p.linea([{ x: vx, y: vy }, su(a1)], t.base, 5)
  p.cerchio(vx, vy, 3.4, t.orlo)
  p.ctx.lineCap = 'butt'
}

/* ── i solidi ──
   Tre gradazioni della stessa tinta e gli spigoli chiari: è il minimo
   per far vedere che una cosa ha un davanti, un sopra e un fianco. */
function scatola(p, t, w, h, prof) {
  const d = prof
  const fx = -(w + d) / 2, fy = (d - h) / 2
  const davanti = [[fx, fy], [fx + w, fy], [fx + w, fy + h], [fx, fy + h]]
  const sopra = [[fx, fy], [fx + w, fy], [fx + w + d, fy - d], [fx + d, fy - d]]
  const fianco = [[fx + w, fy], [fx + w + d, fy - d], [fx + w + d, fy - d + h], [fx + w, fy + h]]
  faccia(p, sopra, t.luce, t.orlo)
  faccia(p, fianco, t.scuro, t.orlo)
  faccia(p, davanti, t.base, t.orlo)
}

const SOLIDI = {
  cubo: (p, t) => scatola(p, t, 52, 52, 18),
  parallelepipedo: (p, t) => scatola(p, t, 66, 34, 16),
  piramide: (p, t) => {
    const b0 = [-40, 24], b1 = [0, 42], b2 = [40, 24], b3 = [0, 6], ap = [0, -42]
    faccia(p, [b0, b1, b2, b3], t.scuro, t.orlo)
    faccia(p, [b0, b1, ap], t.base, t.orlo)
    faccia(p, [b1, b2, ap], t.luce, t.orlo)
  },
  cilindro: (p, t) => {
    p.ellisse(0, 30, 30, 11, t.scuro)
    p.rett(-30, -30, 60, 60, t.base)
    p.linea([{ x: -30, y: 30 }, { x: -30, y: -30 }], t.orlo, 1.6)
    p.linea([{ x: 30, y: 30 }, { x: 30, y: -30 }], t.orlo, 1.6)
    const arco = (cy, da, a) => {
      const q = []
      for (let i = 0; i <= 30; i++) { const ang = da + (a - da) * i / 30; q.push({ x: Math.cos(ang) * 30, y: cy + Math.sin(ang) * 11 }) }
      return q
    }
    p.linea(arco(30, 0, Math.PI), t.orlo, 1.6)
    p.ellisse(0, -30, 30, 11, t.luce)
    p.linea(arco(-30, 0, GIRO), t.orlo, 1.6)
  },
  cono: (p, t) => {
    p.ellisse(0, 32, 32, 11, t.scuro)
    const arco = []
    for (let i = 0; i <= 30; i++) { const a = (i / 30) * Math.PI; arco.push({ x: Math.cos(a) * 32, y: 32 + Math.sin(a) * 11 }) }
    p.linea(arco, t.orlo, 1.6)
    faccia(p, [[0, -42], [32, 32], [-32, 32]], t.base, t.orlo)
    p.velo(0.5, q => q.figura([[0, -42], [0, 32], [-32, 32]], t.luce))
  },
  sfera: (p, t) => {
    p.cerchio(0, 0, 41, t.base)
    p.velo(0.55, q => q.ellisse(-13, -14, 17, 14, t.luce))
    p.velo(0.45, q => q.figura(
      Array.from({ length: 31 }, (_, i) => {
        const a = -Math.PI / 3 + (i / 30) * (Math.PI * 1.15)
        return [Math.cos(a) * 41, Math.sin(a) * 41]
      }).concat([[0, 41]]), t.scuro))
    const giro = []
    for (let i = 0; i <= 44; i++) giro.push({ x: Math.cos(i / 44 * GIRO) * 41, y: Math.sin(i / 44 * GIRO) * 41 })
    p.linea(giro, t.orlo, 2)
  },
}

export const SOLIDI_NOTI = Object.keys(SOLIDI)

export function solido(p, { tipo = 'cubo', colore = 'azzurro' }) {
  const t = tinta(colore)
  p.ctx.lineJoin = 'round'
  p.in(50, 50, q => (SOLIDI[tipo] || SOLIDI.cubo)(q, t))
}

/* ── i cubetti impilati ──
     { che: 'costruzione', cubi: [[x, y, z], …], colore: 'viola',
       scatola: 0 }

   x va in basso a destra, y in basso a sinistra, z in su: è
   l'assonometria dei mattoncini, quella in cui un cubetto si vede con
   tre facce e la pila si legge a colpo d'occhio.

   DUE COSE, E NESSUNA È UN VEZZO. I cubi si disegnano dal più lontano
   al più vicino (`x+y+z` crescente): è l'unico ordine in cui quello
   davanti copre quello dietro invece di essere coperto. E la scala si
   ricava dall'ingombro vero della costruzione, non da un numero fisso:
   una torre di quattro e un tappeto di nove devono riempire lo stesso
   riquadro, se no la grandezza del disegno racconta la risposta prima
   che il bambino conti — e quando c'è la scatola l'ingombro è LEI, se
   no due costruzioni nella stessa scatola verrebbero grandi diverse. */
export function costruzione(p, { cubi = [], colore = 'azzurro', scatola = 0 }) {
  if (!cubi.length && !scatola) return
  const t = tinta(colore)
  const px = (x, y, z) => [(x - y) * 1, (x + y) * 0.54 - z * 1.16]

  /* l'ingombro: gli otto vertici di ogni cubetto, in unità — o quelli
     della scatola, se c'è: dentro una scatola l'ingombro è la scatola,
     e la costruzione ci sta dentro per costruzione */
  const punti = scatola
    ? [0, scatola].flatMap(x => [0, scatola].flatMap(y => [0, scatola].map(z => px(x, y, z))))
    : cubi.flatMap(([x, y, z]) =>
      [0, 1].flatMap(dx => [0, 1].flatMap(dy => [0, 1].map(dz => px(x + dx, y + dy, z + dz)))))
  const xs = punti.map(q => q[0]), ys = punti.map(q => q[1])
  const x1 = Math.min(...xs), x2 = Math.max(...xs), y1 = Math.min(...ys), y2 = Math.max(...ys)
  const k = Math.min(88 / (x2 - x1), 88 / (y2 - y1))
  const su = (x, y, z) => {
    const [a, b] = px(x, y, z)
    return [50 + (a - (x1 + x2) / 2) * k, 50 + (b - (y1 + y2) / 2) * k]
  }

  p.ctx.lineJoin = 'round'
  let davanti = null            // i tre spigoli della scatola che stanno davanti a tutto

  /* ── la scatola, quando c'è ──
     `scatola: 2` vuol dire «una scatola 2×2×2, e i cubetti stanno lì
     dentro». Si disegna perché una scatola che sta solo nel testo non
     si può contare: quello che MANCA è fatto di posti vuoti, e un
     posto vuoto o si vede o non c'è. Le tre facce di fondo — il
     pavimento e le due pareti dietro — sono a caselle, così i posti
     liberi si contano guardando invece che immaginando. I tre spigoli
     davanti si disegnano due volte — pieni qui sotto, e smorzati dopo
     i cubetti (`davanti`) — perché stanno davvero davanti a tutto: se
     restassero solo qui, una costruzione che arriva al bordo li
     coprirebbe, e la scatola sparirebbe proprio quando è quasi piena. */
  if (scatola) {
    const L = scatola
    /* il vetro è azzurrino e mai bianco: l'orlo dei cubetti è quasi
       bianco (`tinte.js`), e due bianchi vicini si leggono come la
       stessa cosa — lo spigolo della scatola diventerebbe il lato di
       un cubetto che non c'è */
    const filo = 'rgba(188, 205, 242, .38)'
    const orlo = 'rgba(188, 205, 242, .78)'
    const tratto = (a, q, col = filo, sp = 1) => p.linea([{ x: a[0], y: a[1] }, { x: q[0], y: q[1] }], col, sp)
    faccia(p, [su(0, 0, 0), su(L, 0, 0), su(L, L, 0), su(0, L, 0)], 'rgba(255, 255, 255, .16)', null)
    faccia(p, [su(0, 0, 0), su(0, L, 0), su(0, L, L), su(0, 0, L)], 'rgba(255, 255, 255, .07)', null)
    faccia(p, [su(0, 0, 0), su(L, 0, 0), su(L, 0, L), su(0, 0, L)], 'rgba(255, 255, 255, .11)', null)
    for (let i = 0; i <= L; i++) {
      tratto(su(i, 0, 0), su(i, L, 0))    // il pavimento, per un verso
      tratto(su(0, i, 0), su(L, i, 0))    // e per l'altro
      tratto(su(0, i, 0), su(0, i, L))    // la parete di sinistra, in su
      tratto(su(0, 0, i), su(0, L, i))    // e di traverso
      tratto(su(i, 0, 0), su(i, 0, L))    // la parete di destra, in su
      tratto(su(0, 0, i), su(L, 0, i))    // e di traverso
    }
    /* il bordo della scatola: è quello che la fa leggere come una
       scatola invece che come un reticolo */
    tratto(su(0, 0, L), su(L, 0, L), orlo, 1.6)
    tratto(su(0, 0, L), su(0, L, L), orlo, 1.6)
    tratto(su(0, L, 0), su(0, L, L), orlo, 1.6)
    tratto(su(L, 0, 0), su(L, 0, L), orlo, 1.6)
    davanti = () => {
      tratto(su(L, L, 0), su(L, L, L), orlo, 1.6)   // lo spigolo davanti
      tratto(su(L, 0, L), su(L, L, L), orlo, 1.6)   // e i due bordi in cima
      tratto(su(0, L, L), su(L, L, L), orlo, 1.6)
    }
    davanti()
  }

  for (const [x, y, z] of cubi.slice().sort((a, b) => (a[0] + a[1] + a[2]) - (b[0] + b[1] + b[2]))) {
    const v = (dx, dy, dz) => su(x + dx, y + dy, z + dz)
    faccia(p, [v(0, 1, 0), v(1, 1, 0), v(1, 1, 1), v(0, 1, 1)], t.scuro, t.orlo, 1.2)  // fianco sinistro
    faccia(p, [v(1, 0, 0), v(1, 1, 0), v(1, 1, 1), v(1, 0, 1)], t.base, t.orlo, 1.2)   // fianco destro
    faccia(p, [v(0, 0, 1), v(1, 0, 1), v(1, 1, 1), v(0, 1, 1)], t.luce, t.orlo, 1.2)   // il coperchio
  }

  /* gli spigoli davanti si ripassano SOPRA i cubetti, smorzati: un
     cubetto che arriva al bordo frontale cancellava la scatola proprio
     quando è quasi piena — cioè quando la domanda è più difficile.
     Smorzati e non pieni perché è vetro: se tagliassero i cubetti con
     lo stesso tratto del bordo sembrerebbero un cubetto in più. */
  if (davanti) p.velo(0.42, davanti)
}

export const PITTORI_GEOMETRIA = { figura, griglia, angolo, solido, costruzione }
