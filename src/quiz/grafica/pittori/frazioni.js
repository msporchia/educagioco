// { che:'frazione', forma:'torta'|'barra'|'tavoletta', parti, colorate, tinta, pezzi? }: vedi "i pezzi storti" in docs/apprendimento/quiz-moduli.md
import { tinta } from './tinte.js'

const GIRO = Math.PI * 2
const VUOTO = 'rgba(255,255,255,.13)'
const TRATTO = '#e8edf7'
const SPESSORE = 1.8

const pieno = nome => tinta(nome === 'giallo' ? 'arancione' : nome).base

// confini dei pezzi da 0 a 1: uguali senza `pezzi`, altrimenti ognuno largo quanto il suo peso
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

// primo taglio in cima; `giro` lo sposta di una frazione, mezza parte basta a far sembrare diversa la stessa torta
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

  const giro360 = [] // il contorno, poi i tagli: tutti dal centro, tutti uguali
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

// larga o alta è la stessa barretta girata; la misura corta resta 30: il minimo per contare i pezzi senza il dito
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

// griglia di quadretti uguali; niente pezzi storti, una griglia storta sembra un errore di disegno
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
