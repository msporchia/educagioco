// La campagna delle tabelline: dieci pianeti in fila, uno per tabellina.
// Vedi docs/asteroidi/scaletta.md (l'ordine, il bersaglio, la stella ⭐).

/* 6×8 e 8×6 sono lo stesso fatto: una chiave sola, sempre ordinata */
export const chiaveCalcolo = (a, b) => 'math:' + Math.min(a, b) + 'x' + Math.max(a, b)
export const fattoriDi = k => k.slice(5).split('x').map(Number)

/* i dieci calcoli di una tabellina, ×1 compreso */
export const calcoliTabellina = n =>
  Array.from({ length: 10 }, (_, i) => chiaveCalcolo(n, i + 1))

// Le tabelline grandi (11..15), lo strato oltre il catalogo del volo
// infinito: vedi docs/asteroidi/volo.md. Non sono caselle (`eCasella`
// le esclude): chi le conta passa sempre di lì.
const FATTORI_GRANDI = [
  ...Array.from({ length: 8 }, (_, i) => [i + 2, 11]),   // 2×11 … 9×11
  ...Array.from({ length: 8 }, (_, i) => [i + 2, 12]),   // 2×12 … 9×12
  [11, 11], [11, 12], [12, 12],
  ...[13, 14, 15].flatMap(n => [2, 3, 4, 5].map(m => [m, n])),
]
export const GRANDI = FATTORI_GRANDI.map(([a, b]) => chiaveCalcolo(a, b))
export const eGrande = k => fattoriDi(k)[1] > 10
/* le 55 caselle del catalogo: tutto quello che conta, si mappa e si
   premia guarda queste e non le grandi */
export const eCasella = k => !eGrande(k)

// I pianeti, in ordine di introduzione; `dritta` è il trucco detto al
// bambino prima di partire.
const PIANETI = [
  { n: 2, liv: 40,  emoji: '🌍', nome: 'Il pianeta del 2',
    dritta: 'Due alla volta: sono tutti i numeri pari. È il numero raddoppiato.' },
  { n: 10, liv: 42, emoji: '🌕', nome: 'Il pianeta del 10',
    dritta: 'Il numero con uno zero attaccato in fondo: 10 × 7 = 70.' },
  { n: 5, liv: 44,  emoji: '🪐', nome: 'Il pianeta del 5',
    dritta: 'Finiscono tutti per 5 o per 0. È la metà della tabellina del 10.' },
  { n: 3, liv: 46,  emoji: '🔴', nome: 'Il pianeta del 3',
    dritta: 'Si sale di tre in tre: 3, 6, 9, 12, 15… come una filastrocca.' },
  { n: 4, liv: 50,  emoji: '🟢', nome: 'Il pianeta del 4',
    dritta: 'È il doppio del doppio: 4 × 7 è 7 raddoppiato (14) e raddoppiato ancora (28).' },
  { n: 6, liv: 53,  emoji: '🟡', nome: 'Il pianeta del 6',
    dritta: 'È la tabellina del 3 raddoppiata: 3 × 8 = 24, quindi 6 × 8 = 48.' },
  { n: 7, liv: 56,  emoji: '🟣', nome: 'Il pianeta del 7',
    dritta: 'La più ostica: ma metà la sai già dai pianeti di prima, girata al contrario.' },
  { n: 8, liv: 58,  emoji: '🔵', nome: 'Il pianeta del 8',
    dritta: 'È il 4 raddoppiato: 4 × 7 = 28, quindi 8 × 7 = 56.' },
  { n: 9, liv: 60,  emoji: '🟤', nome: 'Il pianeta del 9',
    dritta: 'Una decina meno il numero: 9 × 6 è 60 − 6 = 54. E le cifre sommate fanno sempre 9.' },
]

// Le tappe: `tabelle` è cumulativa (ripasso), `bersaglio`/`mirate` sono
// il traguardo di partita — vedi docs/asteroidi/scaletta.md (`QUOTA_TAPPA`).
export const CAMPAGNA = PIANETI.map((p, i) => ({
  i,
  nome: p.nome,
  emoji: p.emoji,
  dritta: p.dritta,
  nuova: p.n,
  portata: p.liv, // scala 0-100 di `data/portata.js`: vedi docs/apprendimento/eta-e-portata.md
  scuola: 'moltiplicazioni',
  tabelle: [1, ...PIANETI.slice(0, i + 1).map(x => x.n)].sort((a, b) => a - b),
  bersaglio: 15 + i * 2,
  mirate: Math.round((15 + i * 2) * 0.6),
}))

CAMPAGNA.push({
  i: CAMPAGNA.length,
  nome: 'Il sole',
  emoji: '☀️',
  dritta: 'Tutte le tabelline insieme, senza sconti. Questa è la prova del nove.',
  nuova: null,
  portata: 63,
  scuola: 'moltiplicazioni',
  tabelle: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  bersaglio: 35,
  mirate: 0,
})

// Il volo infinito (a campagna finita) non sta qui: è in `data/asteroidi.js` (`VOLO`).
