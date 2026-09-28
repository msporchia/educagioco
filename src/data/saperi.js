/* I macrogruppi di sapere che i genitori accendono e spengono: un pezzo di
   scuola, non un gioco o un modulo. Chi fa le domande dichiara il bisogno
   (`sa:` nei moduli, `chiede:` nel manifesto di un gioco); questo file
   dà solo i nomi grossi e le parole per un genitore (`che`, `esempio`,
   `spegne`). Acceso è l'assenza, tranne `difetto: false` (nasce spento:
   il congiuntivo, il passato remoto…). Vedi
   docs/apprendimento/saperi.md — leggerlo prima di aggiungere una riga. */
export const SAPERI = [
  /* ── matematica ── */
  {
    chiave: 'numeri', nome: 'I numeri e le quantità', ico: '🔢', materia: 'matematica',
    che: 'contare, confrontare, mettere in ordine e trovare il posto di un numero sulla linea',
    esempio: '«quale numero sta fra 40 e 60?»',
    spegne: 'le domande sulla linea dei numeri, sui confronti e sugli ordinamenti',
  },
  {
    chiave: 'decine', nome: 'Decine e valore delle cifre', ico: '🧮', materia: 'matematica',
    che: 'che in 47 il 4 vale quaranta e non quattro, e che dieci unità fanno una decina',
    esempio: '«nel numero 358, quanto vale il 5?»',
    spegne: 'le domande sulle decine e sul valore delle cifre',
  },
  {
    chiave: 'stima', nome: 'Stima e arrotondamento', ico: '≈', materia: 'matematica',
    che: 'dire circa quanto fa senza calcolare, e riconoscere un risultato impossibile',
    esempio: '«circa quanto fa 198 + 203?»',
    spegne: 'le domande di stima, di arrotondamento e di ordine di grandezza',
  },
  {
    chiave: 'misure', nome: 'Metri, litri e chili', ico: '📏', materia: 'matematica',
    che: 'sapere con che cosa si misura una cosa, e quanto è grande davvero un metro, un litro, un chilo',
    esempio: '«con che cosa misuri quanto ci sta in una bottiglia?»',
    spegne: 'tutte le domande di misure, conversioni comprese',
  },
  {
    chiave: 'conversioni', nome: 'Le conversioni', ico: '🔁', materia: 'matematica',
    che: 'passare da un\'unità all\'altra: 3 m sono 300 cm, mezzo chilo sono 500 g',
    esempio: '«quanti centilitri sono 2 litri?»',
    spegne: 'le conversioni, i confronti e i problemi con le misure dentro; restano le domande su cosa si misura con cosa',
  },
  {
    chiave: 'moltiplicazioni', nome: 'Le moltiplicazioni', ico: '✖️', materia: 'matematica',
    che: 'moltiplicare: le tabelline e la moltiplicazione in colonna',
    esempio: '«24 × 3»',
    spegne: 'le moltiplicazioni in colonna del castello — la torre Ghiaccio chiede sottrazioni più difficili, e le Bombe scendono con lei',
  },
  {
    chiave: 'divisioni', nome: 'Le divisioni', ico: '➗', materia: 'matematica',
    che: 'dividere: in colonna e a mente',
    esempio: '«84 : 4»',
    spegne: 'le divisioni in colonna del castello — la torre Bombe chiede moltiplicazioni più difficili',
  },
  // il gioco le spiega nella carta (sotto i pezzi, sopra i colorati): da terza in su restano accese anche a chi è indietro
  {
    chiave: 'frazioni', nome: 'Le frazioni', ico: '🍕', materia: 'matematica',
    che: 'dividere una cosa in pezzi uguali e dire quanti se ne prendono: 3/4 di torta, 1/3 di 12',
    esempio: '«che parte della torta è colorata?»',
    spegne: 'tutte le domande sulle frazioni, disegnate e col conto',
  },
  // gruppo a sé: un bambino che conta benissimo può non aver mai visto una scala che va di due in due
  {
    chiave: 'dati', nome: 'Grafici e tabelle', ico: '📈', materia: 'matematica',
    che: 'leggere un pittogramma, un grafico a barre e una tabella: quanti sono, chi ne ha di più, quanti in tutto, e in quinta moda e media',
    esempio: '«nel grafico, quanti gelati ha venduto il gelataio giovedì?»',
    spegne: 'le domande su pittogrammi, grafici a barre e tabelle, con la moda e la media',
  },
  // l'unica domanda di matematica che bisogna saper leggere: a chi ancora decifra le parole non è difficile, è muta
  {
    chiave: 'problemi', nome: 'I problemi scritti', ico: '📝', materia: 'matematica',
    che: 'leggere una storia con dei numeri dentro e capire da solo che conto chiede',
    esempio: '«Nina ha 4 mele e poi ne raccoglie ancora 3: quante mele ha adesso?»',
    spegne: 'tutti i problemi a parole; i conti restano, chiesti come conti',
  },
  // l'algebra prima dell'algebra: si insegna in carta («togli la stessa cosa da tutte e due le parti»), resta accesa
  {
    chiave: 'bilance', nome: 'Le bilance e il numero nascosto', ico: '⚖️', materia: 'matematica',
    che: 'trovare il numero che manca in un conto, e quanto pesa una cosa guardando una bilancia in pari',
    esempio: '«tre 🍎 pesano come un peso da 12: quanto pesa una 🍎?»',
    spegne: 'le domande col numero nascosto e con le bilance; i conti restano, chiesti come conti',
  },
  // due gruppi non uno: un bambino di terza sa già dare il resto (denaro) ma non ha ancora visto decimi e centesimi
  {
    chiave: 'denaro', nome: 'Le monete e gli euro', ico: '💰', materia: 'matematica',
    che: 'riconoscere monete e banconote, contare quanto fanno insieme, dare il resto',
    esempio: '«paghi con 5 €, quanto resto ricevi?»',
    spegne: 'le domande sui soldi: quanto fanno le monete, il resto, quanto costano più cose, quale prezzo è più alto',
  },
  {
    chiave: 'decimali', nome: 'I numeri con la virgola', ico: '🔟', materia: 'matematica',
    che: 'il numero con la virgola come numero: il valore dei decimi e dei centesimi, confrontarli, metterli in ordine, arrotondarli',
    esempio: '«in 4,37 quanto vale il 3?»',
    spegne: 'le domande sui numeri decimali senza euro: valore delle cifre, confronto, ordine e arrotondamento',
  },

  /* ── spazio ── */
  {
    chiave: 'figure', nome: 'Le figure piane', ico: '🔺', materia: 'spazio',
    che: 'i nomi delle figure — triangolo, quadrato, rombo, trapezio — e contare lati, angoli e vertici',
    esempio: '«quanti lati ha un esagono?»',
    spegne: 'le domande sui nomi delle figure e sul conto di lati e angoli',
  },
  {
    chiave: 'simmetria', nome: 'La simmetria', ico: '🦋', materia: 'spazio',
    che: 'la metà che manca a una figura, e dove si piega perché le due parti combacino',
    esempio: '«quale metà completa questa farfalla?»',
    spegne: 'le domande di simmetria e sulle linee di piega',
  },
  {
    chiave: 'spazio-mente', nome: 'Girare le figure con la mente', ico: '🔄', materia: 'spazio',
    che: 'immaginare una figura ruotata o allo specchio, e i cubetti che non si vedono dietro',
    esempio: '«quanti cubetti ci sono in questa costruzione?»',
    spegne: 'le rotazioni, gli specchi, i cubetti nascosti e gli sviluppi da piegare',
  },
  {
    chiave: 'griglia', nome: 'La griglia e i percorsi', ico: '🗺️', materia: 'spazio',
    che: 'trovare una casella per lettera e numero, e seguire un percorso a frecce',
    esempio: '«che cosa c\'è nella casella B3?»',
    spegne: 'le domande su coordinate, direzioni e percorsi; restano area e perimetro',
  },
  {
    chiave: 'area-perimetro', nome: 'Area e perimetro', ico: '▦', materia: 'spazio',
    che: 'contare i quadretti dentro una figura e i passi del suo bordo, e sapere che sono due cose diverse',
    esempio: '«quanti quadretti fa il giro di questa figura?»',
    spegne: 'le domande di area e perimetro sulla griglia',
  },
  {
    chiave: 'solidi', nome: 'I solidi', ico: '🧊', materia: 'spazio',
    che: 'cubo, piramide, cilindro: come si chiamano e come si vedono dall\'alto',
    esempio: '«se guardi un cilindro dall\'alto, che cosa vedi?»',
    spegne: 'le domande sui solidi e sulle viste dall\'alto',
  },

  /* ── tempo ── */
  {
    chiave: 'calendario', nome: 'Giorni, mesi e stagioni', ico: '🗓️', materia: 'tempo',
    che: 'l\'ordine dei giorni e dei mesi, quanti giorni ha un mese, quando cominciano le stagioni',
    esempio: '«che giorno viene dopo giovedì?»',
    spegne: 'le domande su giorni, mesi, stagioni e feste; resta il contare i giorni, che è un altro gruppo',
  },
  {
    chiave: 'orologio', nome: 'L\'orologio a lancette', ico: '🕰️', materia: 'tempo',
    che: 'leggere l\'ora dalle lancette, non dal display del telefono',
    esempio: '«che ore sono?» con l\'orologio disegnato',
    spegne: 'tutte le domande sull\'orologio',
  },
  {
    chiave: 'date', nome: 'Contare i giorni', ico: '📅', materia: 'tempo',
    che: 'quanti giorni passano fra due date, e quanto dura una cosa',
    esempio: '«dal 3 al 17 marzo quanti giorni passano?»',
    spegne: 'le domande su date e durate; restano i giorni, i mesi e le stagioni',
  },

  /* ── italiano ── */
  // l'unico che si spegne guardando in basso: non «non l'ha ancora fatto» ma «l'ha già fatto» (il bambino che legge presto)
  {
    chiave: 'lettura', nome: 'Leggere le parole', ico: '🔤', materia: 'italiano',
    che: 'riconoscere le lettere e leggere una parola corta fino in fondo, invece di indovinarla dalla prima',
    esempio: '«con che lettera comincia 🐝?»',
    spegne: 'le domande sulle lettere e sulle parole da leggere, quelle di chi comincia adesso',
  },
  // il gradino sopra «lettura», si spegne dall'altra parte: chi legge ancora a fatica, non chi legge bene
  {
    chiave: 'comprensione', nome: 'Capire quello che si legge', ico: '📚', materia: 'italiano',
    che: 'leggere due o tre frasi e ritrovarci chi, dove, prima e dopo, perché — e quello che si capisce senza che sia scritto',
    esempio: '«Prima di uscire, Ugo chiude la finestra»: che cosa fa per prima?',
    spegne: 'le domande su un testo breve da leggere; le altre domande di italiano restano',
  },
  {
    chiave: 'suoni-difficili', nome: 'I suoni difficili', ico: '✏️', materia: 'italiano',
    che: 'le parole che si scrivono diverse da come si sentono: gn, gl, sc, le doppie, cqu',
    esempio: '«si scrive "famiglia" o "familia"?»',
    spegne: 'le domande di ortografia sui gruppi di lettere e sulle doppie',
  },
  {
    chiave: 'sillabe', nome: 'Sillabe e rime', ico: '🎵', materia: 'italiano',
    che: 'spezzare una parola nei pezzi che si dicono in un colpo, e sentire quando due parole finiscono uguale',
    esempio: '«quante sillabe ha "farfalla"?»',
    spegne: 'le domande su sillabe e rime',
  },
  {
    chiave: 'lessico', nome: 'Il significato delle parole', ico: '💭', materia: 'italiano',
    che: 'contrari, sinonimi, l\'intruso di una famiglia e i modi di dire',
    esempio: '«qual è il contrario di "veloce"?»',
    spegne: 'le domande sul significato delle parole',
  },
  {
    chiave: 'flessione', nome: 'Nomi, articoli e aggettivi', ico: '🧩', materia: 'italiano',
    che: 'maschile e femminile, singolare e plurale, e l\'aggettivo che segue il nome',
    esempio: '«qual è il plurale di "uovo"?»',
    spegne: 'le domande su plurali, generi, articoli e concordanza',
  },
  {
    chiave: 'analisi', nome: 'Analisi grammaticale', ico: '🔤', materia: 'italiano',
    che: 'i nomi delle parti del discorso: nome, verbo, articolo, aggettivo, soggetto, predicato',
    esempio: '«che parte del discorso è "veloce"?»',
    spegne: 'le domande che chiedono il nome della parte del discorso; restano plurali, generi e articoli',
  },
  {
    chiave: 'presente', nome: 'I verbi al presente', ico: '🏃', materia: 'italiano',
    che: 'coniugare al presente, anche i verbi irregolari di tutti i giorni (andare, fare, venire)',
    esempio: '«noi ___ (venire) domani»',
    spegne: 'le domande di coniugazione al presente',
  },
  {
    chiave: 'tempi-verbali', nome: 'I tempi dei verbi', ico: '🗣️', materia: 'italiano',
    che: 'passato prossimo, imperfetto e futuro — non solo il presente, e riconoscere quale dei tre vuole la frase',
    esempio: '«ieri io ___ (andare) al mare»',
    spegne: 'le domande sui tempi diversi dal presente',
  },
  {
    chiave: 'passato-remoto', nome: 'Il passato remoto', ico: '📜', materia: 'italiano',
    che: 'il tempo delle fiabe e dei racconti: «andò», «mangiammo», «io cossi ma noi cocemmo»',
    esempio: '«qual è il passato remoto di "cuocere" con "io"?»',
    spegne: 'le domande sul passato remoto',
    difetto: false,
  },
  {
    chiave: 'tempi-composti', nome: 'Gli altri tempi composti', ico: '⏪', materia: 'italiano',
    che: 'i tempi fatti con due parole, dove il tempo lo dà l\'ausiliare: «avevo mangiato», «avrò mangiato», «ebbi mangiato»',
    esempio: '«qual è il trapassato prossimo di "mangiare" con "noi"?»',
    spegne: 'le domande su trapassato prossimo, futuro anteriore e trapassato remoto',
    difetto: false,
  },
  {
    chiave: 'condizionale', nome: 'Il condizionale', ico: '🎀', materia: 'italiano',
    che: 'quello che si farebbe: «vorrei», «mangerei», «avrei mangiato volentieri»',
    esempio: '«se potessi, io ___ (andare) al mare»',
    spegne: 'le domande sul condizionale, presente e passato',
    difetto: false,
  },
  {
    chiave: 'imperativo', nome: "L'imperativo", ico: '❗', materia: 'italiano',
    che: 'dare un ordine: «parla piano!», «andiamo!», e il «non correre!» che vuole l\'infinito',
    esempio: '«Marta, ___ (parlare) più piano!»',
    spegne: "le domande sull'imperativo",
    difetto: false,
  },
  {
    chiave: 'congiuntivo', nome: 'Il congiuntivo', ico: '🌙', materia: 'italiano',
    che: 'il modo del dubbio e del desiderio: «penso che tu abbia ragione», «se io fossi»',
    esempio: '«penso che loro ___ (essere) contenti»',
    spegne: 'le domande sul congiuntivo',
    difetto: false,
  },
  {
    chiave: 'accenti', nome: 'Accenti e apostrofi', ico: '´', materia: 'italiano',
    che: 'quando ci vuole l\'accento o l\'apostrofo, e quando la parola cambia senso',
    esempio: '«"papa" o "papà"?»',
    spegne: 'le domande su accenti, apostrofi e la lettera h',
  },

  // ── ragionamento ── non pezzi di scuola: servono a isolare un tipo di ragionamento, non a coprire una lacuna
  {
    chiave: 'deduzione', nome: 'Dedurre da una regola', ico: '🧠', materia: 'ragionamento',
    che: 'tirare la conclusione da una regola: se vale per tutti, vale anche per lui',
    esempio: '«tutti i grufoli hanno le ali, Bibo è un grufolo: Bibo ha le ali?»',
    spegne: 'le deduzioni dirette, quelle negate e le catene di regole',
  },
  {
    chiave: 'incertezza', nome: 'Quando non si può sapere', ico: '❓', materia: 'ragionamento',
    che: 'accorgersi che la regola non basta a rispondere, e che «non si sa» è la risposta giusta',
    esempio: '«tutti i grufoli hanno le ali, Bibo ha le ali: Bibo è un grufolo?»',
    spegne: 'le domande con la regola girata e quelle a cui si risponde «non si può sapere»',
  },
  {
    chiave: 'insiemi', nome: 'Tutti e nessuno', ico: '⭕', materia: 'ragionamento',
    che: 'le regole che valgono per tutti o per nessuno, e cosa vuol dire davvero «nessuno»',
    esempio: '«nessun brillo dorme di giorno: Zaz dorme di giorno?»',
    spegne: 'le domande costruite su «tutti» e «nessuno»',
  },
  {
    chiave: 'confronti', nome: 'Rimettere in ordine dagli indizi', ico: '📊', materia: 'ragionamento',
    che: 'ricostruire un ordine da confronti sparsi: se A è più alto di B e B di C, chi è il più basso',
    esempio: '«Ale è più alto di Bea, Bea più di Cip: chi è il più basso?»',
    spegne: 'le domande che chiedono di mettere in fila per confronti',
  },
  {
    chiave: 'analogie', nome: 'Le analogie', ico: '🔗', materia: 'ragionamento',
    che: 'vedere che due coppie stanno insieme allo stesso modo: A sta a B come C sta a…',
    esempio: '«il cane sta all\'osso come il gatto sta a…?»',
    spegne: 'le analogie, sia quelle sulle cose del mondo sia quelle fra figure',
  },
  {
    chiave: 'sequenze', nome: 'Sequenze e ritmi', ico: '➡️', materia: 'ragionamento',
    che: 'vedere il ritmo di una fila e dire cosa viene dopo, o chi non c\'entra',
    esempio: '«rosso, blu, rosso, blu, …?»',
    spegne: 'le sequenze da continuare e le figure intruse',
  },

  // ── scienze ── due pezzi per due ragioni: ambienti (dove vive) è di seconda-terza, adattamento (come si capisce) è il gradino sopra
  {
    chiave: 'ambienti', nome: 'Gli ambienti del mondo', ico: '🌍', materia: 'scienze',
    che: 'savana, deserto, giungla, ghiacci: che posti sono e quali animali ci vivono',
    esempio: '«dove vive il pinguino?»',
    spegne: 'le domande su dove vivono gli animali; restano quelle sui posti di casa',
  },
  {
    chiave: 'adattamento', nome: 'Com\'è fatto un animale', ico: '🐾', materia: 'scienze',
    che: 'che il corpo di un animale dice dove vive: il pelo bianco il gelo, le zampe palmate l\'acqua',
    esempio: '«un animale ha il pelo bianco e il grasso sotto la pelle: dove vive?»',
    spegne: 'le domande in cui il posto si ricava dall\'indizio; restano quelle su chi vive dove',
  },
]

export const CHIAVI_SAPERI = SAPERI.map(s => s.chiave)
export const sapereDi = chiave => SAPERI.find(s => s.chiave === chiave)
export const esisteSapere = chiave => CHIAVI_SAPERI.includes(chiave)

// ricavate dall'elenco: un sapere di una materia nuova non tocca questa riga
export const MATERIE_SAPERI = [...new Set(SAPERI.map(s => s.materia))]
export const saperiDiMateria = materia => SAPERI.filter(s => s.materia === materia)
