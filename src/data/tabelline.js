/* ═══════════════════════════════════════════════════════════════════
   LA CAMPAGNA DELLE TABELLINE — dieci pianeti, uno per tabellina.

   Prima il gioco chiedeva al bambino "quali tabelline vuoi allenare?".
   È una domanda a cui non sa rispondere: chi non conosce il 7 non sceglie
   il 7, e chi spunta tutto vede ogni tabellina un decimo delle volte.
   Qui la strada è già tracciata, come nella campagna del castello: una
   tappa porta una tabellina nuova, le precedenti restano dentro come
   ripasso, e il bersaglio dice quando la tappa è superata.

   L'ordine non è 1, 2, 3...: è l'ordine con cui le tabelline si imparano
   davvero. Prima quelle che hanno una regola visibile (2, 10, 5), poi le
   piccole, infine 6, 7, 8, 9 — che sono poche caselle ma sono quelle che
   costano. La tabellina dell'1 entra insieme al 2: è una regola, non
   dieci fatti da mandare a memoria, e da sola non merita una tappa.

   Due traguardi diversi, e non vanno confusi:
     · SUPERARE la tappa  → il bersaglio di una partita, si fa stasera
     · la STELLA ⭐        → tutti e dieci i calcoli della tabellina sono
                             imparati secondo il motore, e restano tali
                             anche fra una settimana. Quella è la frase
                             "ho imparato la tabellina del 2".
   ═══════════════════════════════════════════════════════════════════ */

/* 6×8 e 8×6 sono lo stesso fatto: una chiave sola, sempre ordinata */
export const chiaveCalcolo = (a, b) => 'math:' + Math.min(a, b) + 'x' + Math.max(a, b)
export const fattoriDi = k => k.slice(5).split('x').map(Number)

/* i dieci calcoli di una tabellina, ×1 compreso */
export const calcoliTabellina = n =>
  Array.from({ length: 10 }, (_, i) => chiaveCalcolo(n, i + 1))

/* ═══════════ LE TABELLINE GRANDI ═══════════
   Il catalogo finisce a 9×9, e a scuola pure: le 55 caselle sono la
   scaletta, la mappa, le stelle, la marea. Ma chi nel volo infinito è
   arrivato a livello nove le sa tutte, e continuare a chiedergliele è
   logoramento, non esercizio. Queste sono lo STRATO OLTRE del volo
   (`store/volo.js`): l'11 e il 12 per intero, e le prime caselle del
   13, 14 e 15 — quelle che si fanno a mente spezzando (13×4 = 40+12).

   Hanno la stessa forma di chiave delle altre (`math:8x11`): sono fatti
   della stessa specie e il motore li segue allo stesso modo. Ma NON
   SONO CASELLE: non contano fra le 55, non entrano in nessuna tappa,
   non hanno una riga nella mappa né un pezzo di stella. Chi conta le
   caselle passa da `eCasella`, e `unita/asteroidi` lo controlla su ogni
   consumatore. ×1 e ×10 delle grandi non ci sono: 11×10 è una regola,
   non un fatto. */
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

/* I pianeti, in ordine di introduzione. `dritta` è il trucco che si dice
   al bambino prima di partire: sono le regole vere che gli insegnanti
   danno a voce, e scritte una volta valgono più di cento ripetizioni. */
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

/* Le tappe. `tabelle` è cumulativa — la tappa del 5 gioca anche 1, 2 e 10 —
   perché una tabellina imparata e mai più rivista si dimentica: il ripasso
   deve stare dentro la tappa nuova, non in un menu a parte.

   `bersaglio` sono le risposte giuste che servono per superarla, `mirate`
   quante di quelle devono essere sulla tabellina nuova. La seconda è poco
   più della metà della prima: la tappa chiede la sua tabellina otto volte
   su dieci (`QUOTA_TAPPA` in `store/calcolo.js`), meno la domanda del
   boss che arriva dalla tappa dopo, e il resto sono errori e ripasso.
   Chiedere quanto la quota promette, e non di più, è quello che tiene la
   tappa una serata invece che un'attesa. */
export const CAMPAGNA = PIANETI.map((p, i) => ({
  i,
  nome: p.nome,
  emoji: p.emoji,
  dritta: p.dritta,
  nuova: p.n,
  /* dove sta questa tappa sulla scala 0-100 di `data/portata.js`, e
     quale pezzo di scuola dà per scontato: insieme dicono a chi va
     offerta. Le tabelline si fanno in seconda e si finiscono in terza —
     è il motivo per cui a nove anni il pianeta del 2 non si offre più. */
  portata: p.liv,
  scuola: 'moltiplicazioni',
  tabelle: [1, ...PIANETI.slice(0, i + 1).map(x => x.n)].sort((a, b) => a - b),
  bersaglio: 15 + i * 2,
  mirate: Math.round((15 + i * 2) * 0.6),
}))

/* L'ultima tappa non porta niente di nuovo: mescola tutto quello che c'è
   stato prima. È l'esame, ed è l'unica in cui ogni domanda può venire da
   qualsiasi tabellina. */
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

/* Il volo infinito — quello che resta a campagna finita — non sta qui:
   è uno per pianeti e stazioni insieme, e sta in `data/asteroidi.js`
   (`VOLO`), che è il file della fila. */
