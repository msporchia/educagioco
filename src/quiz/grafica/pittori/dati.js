/* ═══════════════════════════════════════════════════════════════════
   I PITTORI DEI GRAFICI E DELLE TABELLE

   Tre scene, i tre modi in cui a scuola si mettono in fila dei dati:

     { che: 'pittogramma', voci: ['🐶', '🐱', '🐰'], icona: '🙂',
       icone: [4, 2.5, 6], vale: 2 }
     { che: 'istogramma', voci: ['lun', 'mar', 'mer'], valori: [4, 7, 3],
       passo: 1 }
     { che: 'tabella', righe: ['Ada', 'Leo', 'Eva'], colonne: ['⚽', '🦖', '🚗'],
       celle: [[3, 5, 1], [4, 2, 6], [7, 8, 9]] }

   Come tutti i pittori non sanno niente di risposte giuste: ricevono
   dei fatti e li disegnano. Il pittogramma riceve **quanti disegni**,
   non quanto valgono — la moltiplicazione per la legenda è la domanda,
   e la fa il bambino; `vale` serve solo a scrivere la legenda sotto.

   SI DISEGNA SU UN FOGLIO CHIARO. Gli altri pittori tingono in chiaro
   sul fondo notte della scheda, ma un grafico è una cosa che a scuola
   si guarda su un quaderno: inchiostro scuro su carta, righe sottili,
   e le etichette dove l'occhio le cerca. È la stessa scelta del
   quadrante dell'orologio, che è bianco per lo stesso motivo.

   LEGGIBILE A 148 PIXEL. Il riquadro vero è largo al massimo 148 pixel
   (toccandolo si apre a tutto schermo, ma chi risponde senza toccarlo
   deve poterlo leggere lo stesso): poche voci, etichette di tre lettere
   o un'emoji, numeri sull'asse solo una tacca sì e una no. Le tacche
   senza numero ci sono tutte, e hanno la loro riga sottile che
   attraversa il grafico: leggere dove cade una cima fra due numeri
   scritti è metà della lezione, e senza quella riga diventerebbe una
   stima a occhio.
   ═══════════════════════════════════════════════════════════════════ */

import { TINTE } from './tinte.js'

const CARTA = '#f6f8fe'
const INCHIOSTRO = '#22304f'
const MATITA = '#6b7aa3'          // gli assi e le scritte piccole
const RIGA = '#dde4f3'            // le righe sottili del quaderno
const TESTATA = '#e3e9f8'         // il fondo delle intestazioni della tabella

/* le barre hanno un colore ciascuna, perché «la barra accanto» sia una
   cosa che si vede e non solo un posto: presi dalla tavolozza comune,
   nel tono medio che su carta chiara ha abbastanza corpo */
const BARRE = ['azzurro', 'arancione', 'verde', 'viola', 'rosso', 'giallo'].map(n => TINTE[n].base)

/* un'etichetta è un'emoji o una parola corta, e si scrivono diverse:
   un'emoji a corpo 7 non si riconosce, una parola a corpo 12 non ci sta */
const eFigura = t => /\p{Extended_Pictographic}/u.test(String(t))

function foglio(p) {
  p.rett(1, 1, 98, 98, CARTA)
}

/* ── il pittogramma ─────────────────────────────────────────────────
   Una fila per voce, un disegno per ogni cosa (o per ogni `vale` cose).
   I disegni stanno **in colonna** da una fila all'altra: è la regola
   che rende il pittogramma un grafico e non un mucchio, perché la fila
   più lunga diventa quella che ne ha di più. Per questo il passo fra
   due disegni è uno solo per tutto il grafico, deciso dalla fila più
   lunga, e non uno per fila.

   Mezzo disegno è **la metà sinistra** del disegno, tagliata netta: è
   come lo si trova sui libri, e un disegno rimpicciolito si leggerebbe
   come un disegno intero un po' più piccolo. */
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
      /* il mezzo disegno: si taglia al centro del suo posto, dove sta
         anche il centro dell'emoji. Che si legga come mezzo dipende dal
         disegno — una mano col pollice da una parte, tagliata, resta una
         fettina — ed è il modulo che sceglie icone tonde e larghe */
      const cx = x0 + passo * intere + passo / 2
      const { ctx } = p
      ctx.save()
      ctx.beginPath(); ctx.rect(cx - passo, cy - h / 2, passo, h); ctx.clip()
      p.testo(icona, cx, cy + dim * 0.06, INCHIOSTRO, dim, 500)
      ctx.restore()
    }
  })

  /* la legenda: in un riquadro suo, perché è la riga che si dimentica */
  if (legenda) {
    p.rett(26, 87, 48, 10, TESTATA)
    p.testo(`${icona} = ${vale}`, 50, 92.4, INCHIOSTRO, 8, 800)
  }
}

/* ── l'istogramma ───────────────────────────────────────────────────
   Barre verticali su un asse con dieci tacche. `passo` è quanto vale
   una tacca, e il numero si scrive una tacca sì e una no: con undici
   numeri su un fianco largo un pollice non se ne legge nessuno. */
export const TACCHE = 10

export function istogramma(p, { voci = [], valori = [], passo = 1 }) {
  foglio(p)
  const x0 = 19, x1 = 96, fondo = 83, cima = 8
  const n = Math.max(1, voci.length)
  const y = v => fondo - (v / (passo * TACCHE)) * (fondo - cima)

  /* le righe del quaderno, una per tacca, e i numeri a tacche alterne */
  for (let t = 0; t <= TACCHE; t++) {
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
    /* il bordo in cima, un filo più scuro: è la riga che si segue con
       il dito fino ai numeri, e deve essere netta */
    p.linea([{ x: cx - barra / 2, y: alto }, { x: cx + barra / 2, y: alto }], INCHIOSTRO, 0.9)
    p.testo(String(v), cx, 91.5, INCHIOSTRO, eFigura(v) ? 10 : 7.5, 800)
  })

  p.linea([{ x: x0, y: cima - 3 }, { x: x0, y: fondo }], MATITA, 1.1)
  p.linea([{ x: x0, y: fondo }, { x: x1, y: fondo }], MATITA, 1.1)
}

/* ── la tabella a doppia entrata ────────────────────────────────────
   Una riga di testa, una colonna di testa, e i numeri all'incrocio. Le
   due teste hanno lo stesso fondo e stanno dalla parte dove si comincia
   a leggere — in alto e a sinistra — perché la domanda è sempre
   «parti da qui, e da qui, e guarda dove si incontrano». */
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

  /* la griglia sopra a tutto, così i fondi non la coprono */
  for (let i = 0; i <= nr; i++)
    p.linea([{ x: x0, y: top + h * i }, { x: x0 + w * nc, y: top + h * i }], i === 1 ? MATITA : '#b9c4de', i === 1 ? 1 : 0.6)
  for (let j = 0; j <= nc; j++)
    p.linea([{ x: x0 + w * j, y: top }, { x: x0 + w * j, y: top + alto }], j === 1 ? MATITA : '#b9c4de', j === 1 ? 1 : 0.6)
}

export const PITTORI_DATI = { pittogramma, istogramma, tabella }
