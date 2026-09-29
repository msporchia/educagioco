// pittogramma/istogramma/tabella: su foglio chiaro (non blu notte), leggibili a 148px (vedi docs/apprendimento/quiz-moduli.md)
import { TINTE } from './tinte.js'

const CARTA = '#f6f8fe'
const INCHIOSTRO = '#22304f'
const MATITA = '#6b7aa3'          // gli assi e le scritte piccole
const RIGA = '#dde4f3'            // le righe sottili del quaderno
const TESTATA = '#e3e9f8'         // il fondo delle intestazioni della tabella

// colore per barra, perché «la barra accanto» sia una cosa che si vede
const BARRE = ['azzurro', 'arancione', 'verde', 'viola', 'rosso', 'giallo'].map(n => TINTE[n].base)

// emoji e parole si scrivono a corpo diverso: un'emoji piccola non si riconosce, una parola grande non ci sta
const eFigura = t => /\p{Extended_Pictographic}/u.test(String(t))

function foglio(p) {
  p.rett(1, 1, 98, 98, CARTA)
}

// i disegni stanno in colonna fra le file (un passo solo per tutto il grafico): è quello che lo rende un grafico e non un mucchio
export function pittogramma(p, { voci = [], icona = '⭐', icone = [], vale = 1 }) {
  foglio(p)
  const n = Math.max(1, voci.length)
  const legenda = vale !== 1
  const alto = 4, basso = legenda ? 84 : 96
  const h = Math.min(20, (basso - alto) / n)
  const y0 = alto + ((basso - alto) - h * n) / 2
  const x0 = 24, x1 = 96
  const massimo = Math.max(6, ...icone.map(c => Math.ceil(c)))
  const passo = Math.min(h, (x1 - x0) / massimo)
  const dim = passo * 0.82

  p.linea([{ x: x0 - 2, y: y0 }, { x: x0 - 2, y: y0 + h * n }], MATITA, 0.8)
  voci.forEach((v, i) => {
    const cy = y0 + h * i + h / 2
    if (i > 0) p.linea([{ x: 4, y: y0 + h * i }, { x: 96, y: y0 + h * i }], RIGA, 0.6)
    p.testo(String(v), 12, cy, INCHIOSTRO, eFigura(v) ? Math.min(12, h * 0.62) : Math.min(8.5, h * 0.5), 800)

    const quante = icone[i] || 0
    const intere = Math.floor(quante)
    for (let k = 0; k < intere; k++)
      p.testo(icona, x0 + passo * k + passo / 2, cy + dim * 0.06, INCHIOSTRO, dim, 500)
    if (quante > intere) {
      // mezzo disegno: tagliato al centro del suo posto (il modulo sceglie icone tonde e larghe perché si legga come metà)
      const cx = x0 + passo * intere + passo / 2
      const { ctx } = p
      ctx.save()
      ctx.beginPath(); ctx.rect(cx - passo, cy - h / 2, passo, h); ctx.clip()
      p.testo(icona, cx, cy + dim * 0.06, INCHIOSTRO, dim, 500)
      ctx.restore()
    }
  })

  if (legenda) { // riquadro suo: è la riga che si dimentica
    p.rett(26, 87, 48, 10, TESTATA)
    p.testo(`${icona} = ${vale}`, 50, 92.4, INCHIOSTRO, 8, 800)
  }
}

// dieci tacche, numero scritto una sì e una no (undici numeri su un fianco stretto non si leggono)
export const TACCHE = 10

export function istogramma(p, { voci = [], valori = [], passo = 1 }) {
  foglio(p)
  const x0 = 19, x1 = 96, fondo = 83, cima = 8
  const n = Math.max(1, voci.length)
  const y = v => fondo - (v / (passo * TACCHE)) * (fondo - cima)

  for (let t = 0; t <= TACCHE; t++) { // righe del quaderno, una per tacca, numeri a tacche alterne
    const yy = y(t * passo)
    const scritta = t % 2 === 0
    p.linea([{ x: x0 - (scritta ? 3 : 1.6), y: yy }, { x: x1, y: yy }],
      scritta ? '#cdd6ec' : RIGA, scritta ? 0.7 : 0.5)
    if (scritta) p.testo(String(t * passo), x0 - 9, yy, MATITA, passo * TACCHE >= 100 ? 6 : 7, 800)
  }

  const largo = (x1 - x0) / n
  const barra = Math.min(13, largo * 0.62)
  voci.forEach((v, i) => {
    const cx = x0 + largo * i + largo / 2
    const alto = y(valori[i] || 0)
    p.rett(cx - barra / 2, alto, barra, fondo - alto, BARRE[i % BARRE.length])
    p.linea([{ x: cx - barra / 2, y: alto }, { x: cx + barra / 2, y: alto }], INCHIOSTRO, 0.9) // bordo netto: si segue col dito fino ai numeri
    p.testo(String(v), cx, 91.5, INCHIOSTRO, eFigura(v) ? 10 : 7.5, 800)
  })

  p.linea([{ x: x0, y: cima - 3 }, { x: x0, y: fondo }], MATITA, 1.1)
  p.linea([{ x: x0, y: fondo }, { x: x1, y: fondo }], MATITA, 1.1)
}

// teste in alto e a sinistra, dove si comincia a leggere: la domanda è sempre «parti da qui e da qui, guarda dove si incontrano»
export function tabella(p, { righe = [], colonne = [], celle = [] }) {
  foglio(p)
  const nr = righe.length + 1, nc = colonne.length + 1
  const x0 = 3, y0 = 3, w = 94 / nc, h = Math.min(22, 94 / nr)
  const alto = h * nr
  const top = y0 + (94 - alto) / 2

  p.rett(x0, top, w * nc, h, TESTATA)
  p.rett(x0, top, w, alto, TESTATA)

  colonne.forEach((c, j) => {
    const cx = x0 + w * (j + 1) + w / 2
    p.testo(String(c), cx, top + h / 2 + (eFigura(c) ? 0.6 : 0), INCHIOSTRO, eFigura(c) ? Math.min(13, h * 0.6) : 8, 800)
  })
  righe.forEach((r, i) => {
    const cy = top + h * (i + 1) + h / 2
    p.testo(String(r), x0 + w / 2, cy, INCHIOSTRO, eFigura(r) ? Math.min(13, h * 0.6) : 8, 800)
    colonne.forEach((_, j) =>
      p.testo(String(celle[i]?.[j] ?? ''), x0 + w * (j + 1) + w / 2, cy, INCHIOSTRO, 11, 800))
  })

  for (let i = 0; i <= nr; i++) // griglia sopra a tutto, così i fondi non la coprono
    p.linea([{ x: x0, y: top + h * i }, { x: x0 + w * nc, y: top + h * i }], i === 1 ? MATITA : '#b9c4de', i === 1 ? 1 : 0.6)
  for (let j = 0; j <= nc; j++)
    p.linea([{ x: x0 + w * j, y: top }, { x: x0 + w * j, y: top + alto }], j === 1 ? MATITA : '#b9c4de', j === 1 ? 1 : 0.6)
}

export const PITTORI_DATI = { pittogramma, istogramma, tabella }
