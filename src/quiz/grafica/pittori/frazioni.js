/* ═══════════════════════════════════════════════════════════════════
   IL PITTORE DELLE FRAZIONI

   Una scena sola, in tre forme, dentro il quadrato 100×100:

     { che: 'frazione', forma: 'torta',     parti: 8, colorate: [0, 1, 2],
                        tinta: 'arancione', giro: 0 }
     { che: 'frazione', forma: 'barra',     parti: 5, colorate: [0, 3],
                        tinta: 'verde', verso: 'o' | 'v' }
     { che: 'frazione', forma: 'tavoletta', parti: 6, righe: 2, colorate: [4],
                        tinta: 'viola' }

   e, per la torta e la barra, i PEZZI STORTI:

     { …, pezzi: [0.6, 0.6, 1.4, 1.4] }     // quanto è grande ogni pezzo

   Senza `pezzi` le parti sono uguali, che è il caso normale. Con
   `pezzi` ognuno è largo quanto il suo peso sul totale: serve al falso
   più importante di tutto il modulo — una figura divisa in quattro
   pezzi che non sono quarti. È il pittore a disegnarla, ma è il modulo
   a sapere perché: qui non si sa quale sia la risposta giusta, né che
   i pezzi storti siano un errore. Si ricevono dei fatti e si disegnano.

   LE PARTI UGUALI DEVONO SEMBRARE UGUALI, e a 148 pixel non è gratis.
   Il tratto che separa i pezzi è uno solo e dello stesso spessore
   dappertutto (se il bordo esterno fosse più grosso, i pezzi in cima
   alla barra sembrerebbero più stretti di quelli in mezzo), e la torta
   è un poligono fitto — un grado e mezzo per lato — perché con pochi
   lati gli spicchi che cadono sugli spigoli sembrerebbero più grossi.

   SI DISEGNA CHIARO, NON SCURO, come negli altri pittori: la carta dei
   quiz è blu notte. Il pezzo non colorato è un velo bianco quasi
   trasparente — «vuoto», come le caselle della linea dei numeri — e il
   colorato è pieno. Così la domanda «che parte è colorata?» non ha
   due letture: pieno e vuoto non si scambiano, mentre due colori sì.

   IL GIALLO NON SI USA: sul velo chiaro il giallo pieno e il vuoto
   distano troppo poco, e a schermo piccolo un quarto giallo si perde.
   Lo sceglie il modulo, ma il pittore se lo ritrova lo stesso e ripiega
   sull'arancione: meglio una tinta diversa da quella chiesta che un
   pezzo che non si vede.
   ═══════════════════════════════════════════════════════════════════ */

import { tinta } from './tinte.js'

const GIRO = Math.PI * 2
const VUOTO = 'rgba(255,255,255,.13)'
const TRATTO = '#e8edf7'
const SPESSORE = 1.8

const pieno = nome => tinta(nome === 'giallo' ? 'arancione' : nome).base

/* i confini dei pezzi, da 0 a 1: uguali se non c'è `pezzi`, altrimenti
   ognuno largo quanto il suo peso */
function confini(parti, pezzi) {
  const pesi = Array.isArray(pezzi) && pezzi.length === parti
    ? pezzi.map(w => Math.max(0.05, Number(w) || 0))
    : Array.from({ length: parti }, () => 1)
  const tot = pesi.reduce((s, w) => s + w, 0)
  const c = [0]
  let somma = 0
  for (const w of pesi) { somma += w; c.push(somma / tot) }
  c[c.length - 1] = 1
  return c
}

/* ── la torta ──
   Il primo taglio sta in cima (le dodici dell'orologio), e `giro` lo
   sposta di una frazione di giro: mezza parte basta a far sembrare
   diversa la stessa torta, senza farla diventare un'altra. */
function torta(p, { parti, colorate, tinta: t, pezzi, giro = 0 }) {
  const cx = 50, cy = 50, r = 43
  const c = confini(parti, pezzi)
  const angolo = f => -Math.PI / 2 + (f + giro) * GIRO
  const punto = a => [cx + Math.cos(a) * r, cy + Math.sin(a) * r]

  for (let i = 0; i < parti; i++) {
    const a0 = angolo(c[i]), a1 = angolo(c[i + 1])
    const passi = Math.max(2, Math.ceil((a1 - a0) / (GIRO / 240)))
    const bordo = [[cx, cy]]
    for (let s = 0; s <= passi; s++) bordo.push(punto(a0 + (a1 - a0) * s / passi))
    p.figura(bordo, colorate.includes(i) ? pieno(t) : VUOTO)
  }

  /* il contorno, poi i tagli: tutti dal centro, tutti uguali */
  const giro360 = []
  for (let s = 0; s <= 240; s++) {
    const [x, y] = punto(s / 240 * GIRO)
    giro360.push({ x, y })
  }
  p.linea(giro360, TRATTO, SPESSORE)
  if (parti > 1) for (let i = 0; i < parti; i++) {
    const [x, y] = punto(angolo(c[i]))
    p.linea([{ x: cx, y: cy }, { x, y }], TRATTO, SPESSORE)
  }
}

/* ── la barra ──
   Larga e bassa, o alta e stretta: è la stessa barretta di cioccolato
   girata, e la domanda non cambia. La misura corta resta 30 perché
   dodici pezzi in 84 unità sono sette unità l'uno — dieci pixel a
   schermo piccolo, il minimo per contarli senza il dito. */
function barra(p, { parti, colorate, tinta: t, pezzi, verso = 'o' }) {
  const lungo = 84, corto = 30
  const c = confini(parti, pezzi)
  const x0 = verso === 'v' ? 50 - corto / 2 : 8
  const y0 = verso === 'v' ? 8 : 50 - corto / 2
  const pezzo = (a, b) => verso === 'v'
    ? [x0, y0 + a * lungo, corto, (b - a) * lungo]
    : [x0 + a * lungo, y0, (b - a) * lungo, corto]

  for (let i = 0; i < parti; i++) {
    const [x, y, w, h] = pezzo(c[i], c[i + 1])
    p.rett(x, y, w, h, colorate.includes(i) ? pieno(t) : VUOTO)
  }
  const [W, H] = verso === 'v' ? [corto, lungo] : [lungo, corto]
  p.ctx.lineJoin = 'round'
  p.linea([{ x: x0, y: y0 }, { x: x0 + W, y: y0 }, { x: x0 + W, y: y0 + H },
           { x: x0, y: y0 + H }, { x: x0, y: y0 }], TRATTO, SPESSORE)
  p.ctx.lineJoin = 'miter'
  for (let i = 1; i < parti; i++) {
    const [x, y] = pezzo(c[i], c[i])
    p.linea(verso === 'v'
      ? [{ x: x0, y }, { x: x0 + corto, y }]
      : [{ x, y: y0 }, { x, y: y0 + corto }], TRATTO, SPESSORE)
  }
}

/* ── la tavoletta ──
   Una griglia di quadretti tutti uguali: la cioccolata vera. I pezzi si
   contano per righe, da sinistra a destra, come si legge. Non ha pezzi
   storti — una griglia storta non sembra più una tavoletta, sembra un
   errore di disegno. */
function tavoletta(p, { parti, righe = 1, colorate, tinta: t }) {
  const colonne = Math.max(1, Math.round(parti / righe))
  const lato = Math.min(80 / colonne, 80 / righe, 26)
  const W = lato * colonne, H = lato * righe
  const x0 = 50 - W / 2, y0 = 50 - H / 2
  for (let i = 0; i < parti; i++) {
    const cx = i % colonne, cy = Math.floor(i / colonne)
    p.rett(x0 + cx * lato, y0 + cy * lato, lato, lato, colorate.includes(i) ? pieno(t) : VUOTO)
  }
  for (let x = 0; x <= colonne; x++)
    p.linea([{ x: x0 + x * lato, y: y0 }, { x: x0 + x * lato, y: y0 + H }], TRATTO, SPESSORE)
  for (let y = 0; y <= righe; y++)
    p.linea([{ x: x0, y: y0 + y * lato }, { x: x0 + W, y: y0 + y * lato }], TRATTO, SPESSORE)
}

const FORME = { torta, barra, tavoletta }

export function frazione(p, scena) {
  const s = { ...scena, colorate: scena.colorate || [] }
  ;(FORME[s.forma] || barra)(p, s)
}

export const PITTORI_FRAZIONI = { frazione }
