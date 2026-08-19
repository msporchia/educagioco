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

/* Il volo libero: si apre a campagna finita e non finisce mai. Le dieci
   tabelline ci sono tutte, ma non si spuntano a mano — nemmeno qui: la
   domanda «quali vuoi allenare?» resta una domanda a cui un bambino non
   sa rispondere anche dopo aver finito la campagna. Sceglie il motore,
   quello che si ricorda meno (`poolLibero` in `store/tabelline.js`). */
export const VOLO_LIBERO = {
  i: -1, nome: 'Volo libero', emoji: '♾️', dritta: '',
  /* nessun livello: non è una tappa della fila, è quello che resta dopo.
     Chi non dichiara niente è sempre alla portata di tutti. */
  nuova: null, tabelle: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  bersaglio: Infinity, mirate: 0,
}

export const tappaMate = i => (i >= 0 && i < CAMPAGNA.length ? CAMPAGNA[i] : VOLO_LIBERO)
