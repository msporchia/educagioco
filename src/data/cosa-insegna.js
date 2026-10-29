/* Cosa chiede o cosa insegna ogni gioco, per la pagina del gioco nelle impostazioni dei grandi (docs/genitori/giochi.md).
   Serve ai giochi che non hanno un elenco di saperi da accendere (`data/domande-dei-giochi.js`): invece di dire «non fa domande»,
   dice che domande fa e perché è educativo. Scritto a mano dai documenti di presentazione dei giochi (`docs/<gioco>/presentazione.md`):
   se un gioco cambia, si cambia qui. `titolo`: «Cosa chiede» per chi fa domande, «Cosa si impara» per gli altri. */
const FATTORIA = {
  titolo: 'Cosa si impara',
  testo: 'Non fa domande: è il posto dove si spendono le monete guadagnate negli altri giochi, ed è per questo che si torna a esercitarsi. '
    + 'Dentro si pianifica: si semina e si aspetta il tempo vero, si porta il raccolto alle macchine, si fanno quadrare quello che costa e quello che rende.',
}

export const INSEGNA = {
  mate: {
    titolo: 'Cosa chiede',
    testo: 'Tabelline (i pianeti, dalla ×2 in su) e calcolo a mente (le stazioni): somme con il riporto, sottrazioni con il prestito, i doppi, '
      + 'il complemento a 10, le moltiplicazioni per 10. Le tappe seguono l\'ordine in cui servono: senza i doppi non c\'è la tabellina del 2.',
  },
  inglese: {
    titolo: 'Cosa chiede',
    testo: 'Parole e frasi in inglese, con la pronuncia. Ogni isola della mappa segue un anno di scuola (dalla prima alla quinta, più una sesta): '
      + 'parole di un argomento solo (i colori, il cibo, la casa) e frasi che usano solo parole già viste. C\'è anche un libro da leggere.',
  },
  spagnolo: {
    titolo: 'Cosa chiede',
    testo: 'Parole, frasi e un libro in spagnolo, con la pronuncia. Un percorso suo: genere, ser ed estar, tener, gustar, i verbi e i passati, '
      + 'sempre spiegati prima di essere chiesti.',
  },
  bancarella: {
    titolo: 'Cosa chiede',
    testo: 'Euro, centesimi e resto: si sta dall\'altra parte del banco, il cliente prende la spesa e paga, e bisogna dargli il resto giusto.',
  },
  codice: {
    titolo: 'Cosa si impara',
    testo: 'Niente conti: si indovina una combinazione di figure leggendo gli indizi delle prove già fatte (quante giuste al posto giusto, quante al posto sbagliato). '
      + 'Allena la deduzione e il ragionare per esclusione.',
  },
  conta: {
    titolo: 'Cosa chiede',
    testo: 'Contare davvero: gli animali in fila, sparpagliati e a insiemi, toccando quello che si conta. La consegna è fatta di icone, '
      + 'quindi si gioca anche senza saper leggere, e non si può perdere.',
  },
  prima: {
    titolo: 'Cosa si impara',
    testo: 'Il prima e il dopo: rimettere in fila le vignette di una storia (il seme, il germoglio, l\'albero). Sequenza nel tempo e causa-effetto, '
      + 'senza parole né numeri. Se si sbaglia si vede la storia giusta, un passo per volta.',
  },
  passo: {
    titolo: 'Cosa si impara',
    testo: 'Il primo gradino della programmazione, anche per chi non sa ancora leggere: si scrive una fila di frecce e il coniglio la fa alla lettera, '
      + 'sempre dall\'inizio. Se va storto si cerca quale freccia era sbagliata. Per i più grandi ci sono il cane pastore e i cicli.',
  },
  costruttore: {
    titolo: 'Cosa si impara',
    testo: 'Programmare senza scrivere codice: si compone il programma con cui un robot costruisce un muro, una scala, un castello. '
      + 'Il robot fa alla lettera quello che c\'è scritto, quindi un risultato storto vuol dire un programma da correggere. Funzioni, parametri e variabili.',
  },
  fattoria: FATTORIA,
  fattoria3d: FATTORIA,
}

export const insegnaDi = chiave => INSEGNA[chiave] || null
