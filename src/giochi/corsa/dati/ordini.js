/* ═══════════════════════════════════════════════════════════════════
   LA TRUPPA È UN NUMERO SCRITTO IN TERRA

   Cinque verdi valgono un rosso, cinque rossi un blu, cinque blu un
   giallo — e ognuno spara quanto vale. Non è una trovata grafica per non
   disegnare duecento figure: è il **raggruppamento** messo in terra. 87
   non è un mucchio, sono tre blu, due rossi e due verdi, e si contano
   con gli occhi.

   Si cambia **ogni cinque**, non ogni dieci. Con dieci il branco arriva a
   quattromila e i cancelli devono offrire «+6000» per contare qualcosa:
   numeri che nessuno somma a mente e che in terra non si vedono più. Con
   cinque il massimo è 624 — quattro gradi, al massimo quattro figure per
   grado, sedici soldati in scena — e ogni bonus torna un numero umano.

   Qui dentro non c'è niente che giochi: c'è la tabella dei gradi e il
   modo di scrivere un numero con quei gradi. Chi disegna legge i colori
   da qui, chi calcola legge i valori: sono la stessa tabella, ed è
   l'unico motivo per cui il numero scritto e quello che corre in terra
   non possono raccontare due storie diverse.
   ═══════════════════════════════════════════════════════════════════ */

export const CAMBIO = 5

export const ORDINI = [
  { v: 1,           colore: '#6fd46a', ombra: '#2f8f3c', nome: 'verdi' },
  { v: CAMBIO,      colore: '#f2705f', ombra: '#9c2a20', nome: 'rossi' },
  { v: CAMBIO ** 2, colore: '#5aa9ff', ombra: '#1f5fb0', nome: 'blu' },
  { v: CAMBIO ** 3, colore: '#ffcf3a', ombra: '#b98c00', nome: 'gialli' },
]

/* Il massimo che i quattro gradi sanno rappresentare: quattro gialli,
   quattro blu, quattro rossi, quattro verdi. Oltre non si va — chi
   guadagna di più lo incassa in stelle (vedi `motore/corsa.js`), perché
   un branco da diecimila non è un numero: è una scritta. */
export const TETTO = CAMBIO ** 4 - 1

/* Da un numero ai suoi gruppi, dal grado più alto al più basso.
   `[{ grado, quanti }]`, e i gradi vuoti non compaiono. */
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

/* La stessa cosa detta a parole — «3 blu · 2 rossi · 2 verdi» — che è
   quello che compare accanto alla truppa mentre corre. Scritto e
   disegnato devono dire la stessa cosa, o il raggruppamento non si
   impara: si subisce. */
export const aParole = n =>
  scomponi(n).map(({ grado, quanti }) => `${quanti} ${ORDINI[grado].nome}`).join(' · ')

/* La fila di soldati da mettere in scena, uno per figura, dal più forte
   al più debole. Chi disegna riceve **i gradi già decisi** e pensa solo a
   dove metterli: qui non si sa niente di schieramenti e di pixel. */
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
  /* la prova che conta: qualunque numero fino al tetto si scrive, e
     rileggendo i gruppi si ritrova identico */
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
