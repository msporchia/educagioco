/* ═══════════════════════════════════════════════════════════════════
   COSA SA IL BAMBINO — i macrogruppi che i genitori accendono e spengono.

   Nasce da un fatto banale e scomodo: a scuola certe cose un bambino non
   le ha ancora fatte. Non sa quanto è un litro, non sa che un chilo è
   mille grammi — e un gioco che gliele chiede non è «difficile», è muto: non
   c'è niente da ragionare, si tira a indovinare. Le divisioni del
   castello avevano già il loro interruttore per la stessa ragione;
   questo file generalizza quel gesto invece di ripeterlo undici volte.

   L'IDEA È UNA SOLA: un sapere è **un pezzo di scuola**, non un gioco e
   non un modulo. Spegnerlo toglie le domande che senza quel pezzo non
   si possono ragionare — e basta. Tutto il resto resta identico: gli
   stessi giochi, le stesse tappe, gli stessi progressi. Il gioco degrada
   invece di sbarrare, esattamente come il castello che senza divisioni
   chiede moltiplicazioni più difficili.

   DOVE STA LA MAPPA. Non qui: qui c'è solo l'elenco dei pezzi di
   scuola, con le parole per dirlo a un genitore. **Chi dichiara di aver
   bisogno di un sapere è chi fa le domande** — un modulo di quiz lo
   dichiara tipologia per tipologia (`sa:` dentro `tipi`), il castello
   lo chiede a `divisioniAccese()`. Così la domanda e il suo requisito
   cambiano insieme, e non esiste un elenco da tenere allineato a mano.
   `test/unita/saperi.test.mjs` controlla che le due parti si parlino:
   una chiave citata da un modulo e non elencata qui è un guasto, e un
   sapere che non toglie niente da nessuna parte è un interruttore finto
   — peggio che non averlo.

   DUE LIVELLI. Un gruppo è grosso — «accenti e apostrofi» — e le
   tipologie che ci stanno dentro sono quattro: l'accento, l'apostrofo,
   la lettera h, l'accento tonico. Il genitore che
   spegne il gruppo le toglie tutte; quello che apre il dettaglio ne
   toglie una sola. Le sottovoci NON stanno in questo file — sono le
   `tipi` dei moduli, e chi le raccoglie per la schermata dei genitori è
   `src/quiz/saperi.js`. Il motivo è sempre quello: chi fa la domanda
   dichiara, il catalogo dà solo i nomi grossi. Se le sottovoci stessero
   qui, aggiungere una tipologia vorrebbe dire ricordarsi di venire a
   scriverla anche in questo file — e prima o poi non lo si fa.

   DUE RAGIONI PER SPEGNERE, e la seconda è arrivata dopo. La prima è
   quella di sempre: **il bambino quella cosa non l'ha fatta**, e la
   domanda gli arriva muta. La seconda è **isolare**: i gruppi di
   ragionamento (le deduzioni, le analogie, le sequenze) non sono pezzi
   di scuola e nessuno li spegne per una lacuna — si spengono per
   vedere un tipo di domanda da solo, o per toglierne uno che a questo
   bambino adesso non serve. Vale anche dentro i gruppi che una lacuna
   ce l'hanno: l'orologio si sa leggere o no, ma il dettaglio permette
   lo stesso di lasciare i quarti e togliere i minuti spicci. Il
   meccanismo è uno solo, le ragioni per usarlo sono due.

   ACCESO È L'ASSENZA. Nel profilo si salvano solo le eccezioni
   (`settings.sa = { misure: false }`), come per i giochi in home: un
   sapere nuovo nasce acceso anche per chi ha il profilo di ieri, e non
   serve nessuna migrazione.

   TRANNE QUELLI CHE NASCONO SPENTI (`difetto: false`). La regola di
   sopra vale finché un sapere è roba che a scuola si fa presto e per
   tutti: chi non l'ha fatto lo spegne, e nel frattempo qualche domanda
   muta è il prezzo. Non vale per i pezzi che si fanno **dopo** — il
   congiuntivo, il condizionale, il passato remoto — dove i bambini che
   non li hanno mai visti sono la maggioranza e quelli che li hanno
   visti l'eccezione. Lì l'assenza va letta al contrario, se no
   aggiungere il congiuntivo vuol dire mandarlo d'ufficio a tutti quelli
   che hanno il profilo di ieri, e un genitore che non apre mai questa
   schermata non ha modo di saperlo.

   È l'unico posto dove il difetto si dichiara: `store/profile.js` lo
   legge da qui, e chi accende o spegne continua a salvare **solo quello
   che si scosta dal difetto** — la voce nel profilo resta l'eccezione,
   cambia solo da cosa. `spegne` è comunque scritto dal lato dello
   spegnere, anche per questi: è cosa si perde, e vale uguale che sia il
   punto di partenza o una scelta.
   ═══════════════════════════════════════════════════════════════════ */

/* `che` è cosa vuol dire saperlo, `esempio` è una domanda vera che
   sparisce, `spegne` è cosa cambia nel gioco. Sono tre righe e non una
   perché il genitore che spegne deve poter prevedere l'effetto: senza
   l'esempio si spegne a naso, e a naso si spegne troppo.

   `difetto: false` è la quarta riga, e ce l'hanno in pochi: nasce
   spento, e resta spento finché un genitore non dice di sì. */
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
  /* I problemi non sono un'operazione in più: sono il passo prima, e si
     spengono da soli perché sono l'unica domanda di matematica che
     bisogna saper LEGGERE. A un bambino che ancora decifra le parole
     una storia con dentro un conto non è difficile — è muta, e quello
     che si misura non è più la matematica. */
  {
    chiave: 'problemi', nome: 'I problemi scritti', ico: '📝', materia: 'matematica',
    che: 'leggere una storia con dei numeri dentro e capire da solo che conto chiede',
    esempio: '«Nina ha 4 mele e poi ne raccoglie ancora 3: quante mele ha adesso?»',
    spegne: 'tutti i problemi a parole; i conti restano, chiesti come conti',
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
    spegne: 'le domande su sillabe e rime; resta l\'accento tonico, che è un altro gruppo',
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
    chiave: 'trapassato', nome: 'Il trapassato prossimo', ico: '⏪', materia: 'italiano',
    che: 'il passato di prima di un altro passato: «quando arrivai, lui era già uscito»',
    esempio: '«qual è il trapassato prossimo di "mangiare" con "noi"?»',
    spegne: 'le domande sul trapassato prossimo',
    difetto: false,
  },
  {
    chiave: 'condizionale', nome: 'Il condizionale', ico: '🎀', materia: 'italiano',
    che: 'quello che si farebbe: «vorrei», «mangerei», «sarebbe bello»',
    esempio: '«se potessi, io ___ (andare) al mare»',
    spegne: 'le domande sul condizionale',
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
    che: 'quando ci vuole l\'accento o l\'apostrofo, e dove batte la voce in una parola',
    esempio: '«"papa" o "papà"?»',
    spegne: 'le domande su accenti, apostrofi, la lettera h e l\'accento tonico',
  },

  /* ── ragionamento ──
     Questi non sono pezzi di scuola: non c'è una lezione da aver fatto,
     e nessuno di questi interruttori serve a nascondere una lacuna.
     Sono qui per l'altra ragione — poter isolare un tipo di
     ragionamento e vederlo da solo, che è utile a chi prova il gioco
     tanto quanto a chi lo gioca. Nascono accesi come tutto il resto. */
  {
    chiave: 'deduzione', nome: 'Cosa segue di sicuro', ico: '🧠', materia: 'ragionamento',
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
    chiave: 'confronti', nome: 'Mettere in fila', ico: '📊', materia: 'ragionamento',
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
]

export const CHIAVI_SAPERI = SAPERI.map(s => s.chiave)
export const sapereDi = chiave => SAPERI.find(s => s.chiave === chiave)
export const esisteSapere = chiave => CHIAVI_SAPERI.includes(chiave)

/* le materie nell'ordine in cui si presentano ai genitori, ricavate
   dall'elenco: aggiungere un sapere di una materia nuova non vuol dire
   toccare anche questa riga */
export const MATERIE_SAPERI = [...new Set(SAPERI.map(s => s.materia))]
export const saperiDiMateria = materia => SAPERI.filter(s => s.materia === materia)
