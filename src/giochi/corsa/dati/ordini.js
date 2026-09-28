// La truppa è un numero scritto in terra: cinque verdi valgono un
// rosso, cinque rossi un blu, cinque blu un giallo, e ognuno spara
// quanto vale — è il raggruppamento, non una trovata per non disegnare
// duecento figure. Il perché del cambio ogni cinque (non dieci) è in
// docs/corsa/regole.md.

export const CAMBIO = 5

export const ORDINI = [
  { v: 1,           colore: '#6fd46a', ombra: '#2f8f3c', nome: 'verdi' },
  { v: CAMBIO,      colore: '#f2705f', ombra: '#9c2a20', nome: 'rossi' },
  { v: CAMBIO ** 2, colore: '#5aa9ff', ombra: '#1f5fb0', nome: 'blu' },
  { v: CAMBIO ** 3, colore: '#ffcf3a', ombra: '#b98c00', nome: 'gialli' },
]

// Il massimo che i quattro gradi sanno rappresentare (quattro gialli,
// quattro blu, quattro rossi, quattro verdi): oltre non si va, chi
// guadagna di più lo incassa in stelle.
export const TETTO = CAMBIO ** 4 - 1

// Da un numero ai suoi gruppi, dal grado più alto al più basso.
// [{ grado, quanti }], e i gradi vuoti non compaiono.
export function scomponi(n) {
  const fuori = []
  let resto = Math.max(0, Math.floor(n))
  for (let g = ORDINI.length - 1; g >= 0; g--) {
    const q = Math.floor(resto / ORDINI[g].v)
    resto -= q * ORDINI[g].v
    if (q) fuori.push({ grado: g, quanti: q })
  }
  return fuori
}

// «3 blu · 2 rossi · 2 verdi»: quello che compare accanto alla truppa
// mentre corre, e deve dire la stessa cosa del disegno in terra.
export const aParole = n =>
  scomponi(n).map(({ grado, quanti }) => `${quanti} ${ORDINI[grado].nome}`).join(' · ')

// La fila di soldati da mettere in scena, uno per figura, dal più forte
// al più debole. Chi disegna riceve i gradi già decisi.
export function figure(n) {
  const fila = []
  for (const { grado, quanti } of scomponi(n))
    for (let k = 0; k < quanti; k++) fila.push(grado)
  return fila
}

export function guastiDegliOrdini() {
  const guasti = []
  if (CAMBIO < 3 || CAMBIO > 10)
    guasti.push(`si cambia ogni ${CAMBIO}: fuori da questa fascia i gruppi non si contano a occhio`)
  for (const [i, o] of ORDINI.entries()) {
    if (o.v !== CAMBIO ** i) guasti.push(`il grado ${i} vale ${o.v} invece di ${CAMBIO ** i}`)
    if (!o.nome || !o.colore || !o.ombra) guasti.push(`il grado ${i} è senza nome o senza colore`)
  }
  const colori = new Set(ORDINI.map(o => o.colore))
  if (colori.size !== ORDINI.length)
    guasti.push('due gradi hanno lo stesso colore: in terra sarebbero indistinguibili')
  if (TETTO !== CAMBIO ** ORDINI.length - 1)
    guasti.push(`il tetto (${TETTO}) non è quello che i ${ORDINI.length} gradi sanno scrivere`)
  // la prova che conta: qualunque numero fino al tetto si scrive, e
  // rileggendo i gruppi si ritrova identico
  for (const n of [0, 1, 4, 5, 24, 25, 87, 124, 125, 243, 500, TETTO]) {
    const somma = scomponi(n).reduce((t, { grado, quanti }) => t + quanti * ORDINI[grado].v, 0)
    if (somma !== n) guasti.push(`${n} scomposto e risommato fa ${somma}`)
    if (scomponi(n).some(({ quanti }) => quanti >= CAMBIO))
      guasti.push(`${n} tiene ${CAMBIO} figure dello stesso grado: andavano cambiate`)
  }
  if (figure(TETTO).length !== (CAMBIO - 1) * ORDINI.length)
    guasti.push(`al tetto la truppa è di ${figure(TETTO).length} figure, troppe per starci in terra`)
  return guasti
}
