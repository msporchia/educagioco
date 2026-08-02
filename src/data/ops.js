/* ═══════════════════════════════════════════════════════════════════
   OPERAZIONI IN COLONNA
   Si scrivono SOLO le cifre del risultato, da destra verso sinistra.
   I riporti si tengono a mente: scriverli sarebbe una stampella e
   l'obiettivo è che imparino a farne a meno.

   Unica eccezione la moltiplicazione con moltiplicatore a due cifre:
   lì i prodotti parziali sono passaggi veri del procedimento, non
   promemoria, quindi si scrivono per intero e poi si sommano.

   Le cifre sono in ordine "little endian": indice 0 = unità.
   ═══════════════════════════════════════════════════════════════════ */

export const cifre = n => String(n).split('').reverse().map(Number)
const casuale = (min, max) => min + Math.floor(Math.random() * (max - min + 1))

/* le cifre di un numero diventano i passi da scrivere, da destra a sinistra */
const passiDa = (arr, k = 'ris') => arr.map((v, i) => ({ k, col: i, atteso: v }))

/* ---------- addizione ---------- */
export function colonnaAdd(a, b) {
  const ris = cifre(a + b)
  return { ris, passi: passiDa(ris), colonne: ris.length }
}

/* ---------- sottrazione ---------- */
export function colonnaSub(a, b) {
  const ris = cifre(a - b)
  return { ris, passi: passiDa(ris), colonne: Math.max(ris.length, cifre(a).length) }
}

/* ---------- moltiplicazione per una cifra ---------- */
export function colonnaMul(a, m) {
  const ris = cifre(a * m)
  return { ris, passi: passiDa(ris), colonne: ris.length }
}

/* ---------- moltiplicazione per due cifre ----------
   Qui i due prodotti parziali sono passaggi del procedimento, non appunti:
   prima a×unità, poi a×decine incolonnato uno spazio più a sinistra, e
   infine la somma dei due. Si scrivono tutti e tre. */
export function colonnaMul2(a, b) {
  const bu = b % 10, bd = Math.floor(b / 10)
  const p1 = cifre(a * bu)
  const p2 = cifre(a * bd)          // va disegnato spostato di una colonna
  const ris = cifre(a * b)
  return {
    p1, p2, ris, doppia: true,
    passi: [...passiDa(p1, 'p1'), ...passiDa(p2, 'p2'), ...passiDa(ris)],
    colonne: Math.max(ris.length, p2.length + 1),
  }
}

/* ---------- divisione per una cifra, quoziente da sinistra ---------- */
export function colonnaDiv(a, m) {
  const dig = String(a).split('').map(Number)
  let resto = 0
  const quo = []
  for (const d of dig) {
    const cur = resto * 10 + d
    quo.push(Math.floor(cur / m))
    resto = cur % m
  }
  let inizio = 0
  while (inizio < quo.length - 1 && quo[inizio] === 0) inizio++
  const q = quo.slice(inizio)
  const passi = q.map((v, i) => ({ k: 'quo', col: i, atteso: v }))
  passi.push({ k: 'res', col: 0, atteso: resto })
  return { quoziente: q, resto, passi, colonne: q.length, saltate: inizio }
}

/* ═══════════ GENERATORI PER LIVELLO (1..5) ═══════════
   Il livello sale con le risposte giuste e scende con gli errori, quindi
   la taglia dei numeri segue il bambino invece di essere decisa a priori. */

export function generaAdd(lv) {
  const [a, b] = lv <= 1 ? [casuale(11, 44), casuale(11, 44)]        // due cifre, di solito senza riporto
    : lv === 2 ? [casuale(15, 89), casuale(15, 89)]                  // due cifre con riporto
    : lv === 3 ? [casuale(100, 499), casuale(15, 99)]
    : lv === 4 ? [casuale(120, 899), casuale(120, 899)]
    : [casuale(1000, 4999), casuale(120, 999)]
  return { tipo: 'add', a, b, segno: '+', ...colonnaAdd(a, b), risultato: a + b }
}

export function generaSub(lv) {
  let a, b
  if (lv <= 1) { a = casuale(25, 99); b = casuale(11, a - 10) }
  else if (lv === 2) { a = casuale(30, 99); b = casuale(12, a - 5) }
  else if (lv === 3) { a = casuale(120, 499); b = casuale(15, 99) }
  else if (lv === 4) { a = casuale(200, 899); b = casuale(110, a - 50) }
  else { a = casuale(1200, 4999); b = casuale(150, 999) }
  return { tipo: 'sub', a, b, segno: '−', ...colonnaSub(a, b), risultato: a - b }
}

/* il moltiplicatore arriva da fuori: così la torre magica allena
   proprio le tabelline che il gioco degli asteroidi ha trovato deboli */
export function generaMul(lv, moltiplicatore) {
  const u = moltiplicatore || casuale(2, 9)          // la tabellina da allenare
  if (lv <= 1) { const a = casuale(11, 39); return { tipo:'mul', a, b:u, segno:'×', ...colonnaMul(a,u), risultato:a*u } }
  if (lv === 2) { const a = casuale(102, 799); return { tipo:'mul', a, b:u, segno:'×', ...colonnaMul(a,u), risultato:a*u } }
  // da qui il moltiplicatore ha due cifre: entrano in scena i prodotti parziali
  const dec = casuale(2, 9)
  const b = dec * 10 + u
  const a = lv === 3 ? casuale(12, 99) : lv === 4 ? casuale(101, 499) : casuale(120, 999)
  return { tipo: 'mul', a, b, segno: '×', ...colonnaMul2(a, b), risultato: a * b }
}

export function generaDiv(lv) {
  const m = lv <= 2 ? casuale(2, 5) : casuale(2, 9)
  let a
  if (lv <= 1) a = m * casuale(4, 20)                       // esatta, due cifre
  else if (lv === 2) a = m * casuale(4, 20) + casuale(1, m - 1)
  else if (lv === 3) a = m * casuale(20, 120)
  else if (lv === 4) a = m * casuale(30, 190) + casuale(1, m - 1)
  else a = m * casuale(200, 1200) + casuale(0, m - 1)
  return { tipo: 'div', a, b: m, segno: ':', ...colonnaDiv(a, m),
           risultato: Math.floor(a / m) }
}

export const GENERATORI = { add: generaAdd, sub: generaSub, mul: generaMul, div: generaDiv }

export const TORRI = {
  add: { nome: 'Arciere',  emoji: '🏹', segno: '+', colore: '#38c172',
         raggio: 92,  danno: 11, ricarica: 0.62, area: 0,  descr: 'colpi rapidi su un nemico' },
  sub: { nome: 'Ghiaccio', emoji: '❄️', segno: '−', colore: '#4aa3ff',
         raggio: 86,  danno: 0,  ricarica: 0.5,  area: 0,  rallenta: 0.45,
         descr: 'non fa danno: congela i nemici vicini' },
  mul: { nome: 'Magica',   emoji: '🔮', segno: '×', colore: '#a06bff',
         raggio: 104, danno: 24, ricarica: 1.5,  area: 46, descr: 'onda magica che colpisce a zona' },
  div: { nome: 'Bombe',    emoji: '💣', segno: ':', colore: '#ff7a3d',
         raggio: 132, danno: 44, ricarica: 2.3,  area: 62, descr: 'colpo lento e devastante' },
}
