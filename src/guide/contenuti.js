/* ═══════════════════════════════════════════════════════════════════
   LE GUIDE — DATO PURO

   Due registri, perché sono due pubblici diversi.

   `GUIDE` sono per i grandi, e stanno nella schermata «Come funziona»
   (`src/guide/Guide.vue`), **fuori dal codice di casa**: un genitore che
   riceve il link per la prima volta deve poter leggere come si installa
   senza sapere che il codice di partenza è 0000.

   `AIUTI` sono uno per gioco, e li apre il `?` della barra
   (`components/Barra.vue`). Li legge chi ha il gioco già aperto — spesso
   un bambino — quindi frasi corte, niente strategia in venti righe, e
   soprattutto **le cose che dallo schermo non si vedono**: che il dito va
   tenuto premuto, che la cifra si scrive una alla volta. Come si tocca un
   tasto lo scopre da sé; che esista il tocco lungo, no.

   ── PERCHÉ NON STANNO NEI MANIFESTI ──
   Sarebbe stato il posto naturale per i giochi nuovi (`gioco.js`), ma
   metà dei giochi non ce l'ha un manifesto: quelli in `src/views/` sono
   più vecchi della convenzione. Con l'aiuto nel manifesto ci sarebbero
   due posti dove cercarlo, e il tower defense — che è quello che ne ha
   più bisogno di tutti — sarebbe finito in quello sbagliato.

   ── LA FORMA DI UN BLOCCO ──
   Una stringa è un paragrafo. Un oggetto può avere:
     titolo   un'intestazione sopra il blocco
     righe    un elenco puntato
     passi    un elenco numerato (le istruzioni da seguire in ordine)
     se       'android' | 'ios' | 'computer' | 'installata' | 'da-installare'
              — il blocco compare solo lì (vedi `guide/aiuto.js`)
   Niente HTML: quello che si può scrivere è quello che c'è qui sopra, e
   una chiave sconosciuta non viene disegnata.
   ═══════════════════════════════════════════════════════════════════ */

export const GUIDE = [
  {
    id: 'installare',
    emoji: '📲',
    titolo: 'Mettilo sul telefono',
    sommario: 'Si installa come un\'app, e poi funziona anche senza internet',
    blocchi: [
      { se: 'installata', titolo: '✅ È già installato',
        righe: ['Stai giocando dall\'icona sulla schermata iniziale: è così che va bene.'] },
      'Il gioco è una pagina web, ma si può aggiungere alla schermata iniziale del telefono. Da lì in poi si apre con un\'icona come tutte le altre app, a schermo intero, e **funziona anche senza internet**.',
      { se: 'android', titolo: 'Su Android', passi: [
        'Apri il menu di Chrome (i tre puntini in alto a destra).',
        'Tocca «Installa app», oppure «Aggiungi a schermata Home».',
        'Conferma. L\'icona compare fra le altre app.',
      ] },
      { se: 'ios', titolo: 'Su iPhone e iPad', passi: [
        'Serve **Safari**: da Chrome il tasto non c\'è. Se sei arrivato qui da un altro browser, riapri il link con Safari.',
        'Tocca il tasto Condividi in basso (il quadrato con la freccia).',
        'Scorri e tocca «Aggiungi a Home».',
        'Conferma in alto a destra.',
      ] },
      { se: 'computer', titolo: 'Sul computer', righe: [
        'Da Chrome o Edge: l\'icona con la freccia dentro lo schermo, in fondo alla barra dell\'indirizzo.',
        'Non è necessario: sul computer va bene anche una scheda del browser, basta salvarla fra i preferiti.',
      ] },
      { titolo: 'Perché conviene', righe: [
        'Si apre con un tocco, senza cercare l\'indirizzo.',
        'Funziona in aereo, in macchina, dove non prende.',
        'Niente barra del browser: i bambini non finiscono su altre pagine.',
      ] },
      { se: 'da-installare', titolo: '⚠️ Una cosa da sapere', righe: [
        'I progressi restano **dentro questo telefono**: non c\'è nessun account e niente va su internet. Se un giorno cancelli i dati del browser, spariscono. Per questo c\'è «Salva su file» nelle impostazioni.',
      ] },
    ],
  },

  {
    id: 'bambini',
    emoji: '👧🧒',
    titolo: 'Se giocano in due (o in tre)',
    sommario: 'Ogni bambino ha monete, progressi ed età tutti suoi',
    blocchi: [
      'Sullo stesso telefono possono giocare più fratelli, e non si pestano i piedi: monete, animali, traguardi, età e perfino **quali giochi si vedono** sono separati. Quello che uno impara non conta per l\'altro, e le domande le pesca ognuno sulla sua misura.',
      { titolo: 'Aggiungerne uno', passi: [
        'Impostazioni → scheda «Bambini» → «Aggiungi un giocatore».',
        'Il nome, e in che classe è: da lì il gioco decide cosa fargli vedere.',
      ] },
      { titolo: 'Passare dall\'uno all\'altro', righe: [
        'In cima alla home compare una **fila coi nomi**: si tocca il proprio e si gioca. Con un bambino solo la fila non c\'è, perché non c\'è niente da scegliere.',
        'Il gioco riapre sempre sull\'ultimo che ha giocato: chi si siede deve ricordarsi di toccare il proprio nome.',
      ] },
      { titolo: 'Le cose che restano di casa', righe: [
        'Il **codice dei genitori** è uno solo per tutti.',
        'Il **salvataggio** li porta via tutti insieme, in un file solo.',
        'Cancellare un bambino cancella i suoi progressi, ma per un po\' ne resta una copia da rimettere.',
      ] },
    ],
  },

  {
    id: 'eta',
    emoji: '🎂',
    titolo: 'Quanti anni ha il bambino',
    sommario: 'È il numero che decide quanto sono difficili le domande',
    blocchi: [
      'Ogni domanda del gioco ha una difficoltà, e ogni bambino ha un\'età: il gioco pesca solo quello che sta attorno a lui — un po\' indietro per ripassare, un po\' avanti per imparare. Non è una classifica e non lo boccia nessuno: serve a non chiedere le divisioni a chi fa la prima, e a non chiedere «con che lettera comincia 🐝» a chi ne ha dieci.',
      { titolo: 'Dove si cambia', passi: [
        'Impostazioni (il tasto grigio in fondo alla home).',
        'Scheda «Giochi e domande» → la manopola in cima.',
        'Sotto compare il quadro di quell\'età: cosa trova in home e che domande gli arrivano. Si guarda, poi si preme «Applica».',
      ] },
      'Se non sei sicuro, **metti l\'età vera**. Se poi le domande sembrano fuori misura si aggiusta materia per materia, senza spostare l\'età: vedi la guida qui accanto.',
      { titolo: 'Quando l\'hai appena creato', righe: [
        'Al primo avvio il gioco chiede in che classe è: da lì decide quali giochi far vedere e cosa dare per scontato. Si può rifare più tardi dalla scheda del bambino.',
      ] },
    ],
  },

  {
    id: 'difficolta',
    emoji: '🎚️',
    titolo: 'Se le domande sono troppo difficili',
    sommario: 'O troppo facili: si aggiusta una materia per volta',
    blocchi: [
      'L\'età sposta tutto insieme. Ma un bambino può essere avanti in lettura e indietro nelle tabelline, quindi ogni materia si ritocca da sola.',
      { titolo: 'Come si fa', passi: [
        'Impostazioni → scheda «Giochi e domande» → sotto la manopola, il quadro.',
        'Le materie stanno in blocchi, rispetto a lui: quelle che sa già fare, quelle che sta imparando, quelle difficili.',
        'Apri il blocco, poi la **✎** della materia: una tacca la sposta di mezzo anno per volta, e dice dove va a finire. Si conferma.',
        'Il **▶** ti fa provare una domanda vera, prima di decidere.',
      ] },
      { titolo: 'Se a scuola non l\'hanno ancora fatta', righe: [
        'Nella stessa tacca, l\'ultimo scatto a destra è «non ancora spiegate»: fa sparire le *domande* che danno per scontata quella materia, in tutti i giochi. Si rimette quando l\'avranno fatta.',
      ] },
      { titolo: 'Il gioco te lo dice da sé', righe: [
        'Se una materia gli va storta, i numeri li trovi provando le sue domande col **▶**: è lì che si vede se la taratura è sbagliata o se era solo una brutta giornata.',
      ] },
      'Quello che hai messo a mano resta **color ambra** nell\'elenco, e in fondo al quadro c\'è il tasto che rimette tutto com\'è di partenza a quell\'età. I progressi non si toccano.',
    ],
  },

  {
    id: 'giochi',
    emoji: '🎮',
    titolo: 'Se un gioco non va bene',
    sommario: 'Si toglie dalla home, e i progressi restano dove sono',
    blocchi: [
      'Undici giochi sono tanti per un bambino piccolo. Si possono spegnere quelli che non servono: la carta sparisce dalla home e il gioco non esiste più, per lui.',
      { titolo: 'Come si fa', passi: [
        'Impostazioni → scheda «Giochi e domande» → il primo blocco, «In casa».',
        'La **✎** accanto al gioco: «Non ce l\'ha», «Come dice l\'età», «Ce l\'ha». Si conferma.',
      ] },
      { titolo: 'Se l\'età sbaglia', righe: [
        'Alcuni giochi arrivano più avanti, altri il bambino li ha già passati: lo dice la riga. Con «Ce l\'ha» lo tieni in home lo stesso — serve quando il piccolo gioca col fratello grande.',
      ] },
      { titolo: 'Cosa succede ai progressi', righe: [
        'Niente: restano dove sono. Riaccendendo il gioco si riparte da dov\'era.',
        'La scelta è **per bambino**: fratelli diversi vedono home diverse.',
      ] },
      'C\'è anche un interruttore per i «giochi in prova»: sono quelli non ancora finiti, spenti di partenza.',
    ],
  },

  {
    id: 'monete',
    emoji: '🪙',
    titolo: 'A cosa servono le monete',
    sommario: 'Si guadagnano studiando e si spendono nella fattoria',
    blocchi: [
      'Ogni risposta giusta, ogni tappa vinta, dà monete. Le monete non servono a niente dentro gli esercizi: servono **fuori**, nella fattoria, dove si comprano terra, animali e cose da mettere.',
      'È fatto apposta così. La fattoria è il posto dove si spende, gli altri giochi sono il posto dove si guadagna: chi vuole la mucca deve passare dalle tabelline.',
      { titolo: 'Se sembra che non arrivino mai', righe: [
        'Vuol dire che le domande sono troppo difficili: si sbaglia, e chi sbaglia non guadagna. Prima di alzare i premi, guarda la difficoltà.',
      ] },
    ],
  },

  {
    id: 'progressi',
    emoji: '💾',
    titolo: 'Dove stanno i progressi',
    sommario: 'Dentro il telefono, e come portarli su un altro',
    blocchi: [
      'Non c\'è nessun account, nessuna registrazione, e niente esce da qui: monete, animali, traguardi e risposte stanno **dentro questo telefono**. Il gioco funziona senza internet proprio per questo.',
      { titolo: 'Il rovescio della medaglia', righe: [
        'Se cancelli i dati del sito dal browser, spariscono.',
        'Se cambi telefono, non ti seguono da soli.',
      ] },
      { titolo: 'Il salvataggio', passi: [
        'Impostazioni → in fondo, «Salva su file».',
        'Tienilo dove tieni le foto, o mandalo a te stesso.',
        'Sul telefono nuovo: Impostazioni → «Rimetti da un file».',
      ] },
      { titolo: 'Se cancelli per sbaglio', righe: [
        'Prima di cancellare i progressi di un bambino, il gioco ne mette da parte una copia: la trovi in fondo a **Impostazioni → Progressi**, e ne tiene le ultime tre.',
        'Vale anche per un bambino eliminato: rimetterlo lo riporta anche nell\'elenco di chi gioca.',
        'Le copie stanno sullo stesso telefono: se lo perdi, perdi anche quelle. Il file salvato no.',
      ] },
      'Il file contiene i nomi dei bambini e cosa hanno giocato. È roba tua: non mandarlo in giro più di quanto serve.',
    ],
  },

  {
    id: 'guasti',
    emoji: '🩹',
    titolo: 'Se qualcosa non funziona',
    sommario: 'Cosa provare prima di scrivere, e cosa scrivere',
    blocchi: [
      { titolo: 'Nell\'ordine', passi: [
        'Chiudi il gioco e riaprilo: la maggior parte delle volte basta.',
        'Impostazioni → «Riscarica il gioco»: lo riscarica da internet e riparte pulito. Ci vuole la connessione, e **i progressi restano dove sono.**',
        'Se ancora non va, segnalalo: Impostazioni → «Dimmelo».',
      ] },
      { titolo: 'Il numero in fondo alla home', righe: [
        'È la versione. Serve a sapere se il telefono ha preso l\'aggiornamento: se due telefoni mostrano numeri diversi, uno dei due è indietro e basta riaprirlo.',
      ] },
      { titolo: 'Se hai dimenticato il codice', righe: [
        'Sul tastierino, in fondo, c\'è **«Non ricordi il codice?»**: si risponde a una domanda e il codice torna a 0000, così puoi sceglierne uno nuovo. **I progressi non si toccano.**',
      ] },
      'Il tasto rosso «cancella tutto» è l\'unico che porta via i progressi, chiede conferma, e per un po\' ne resta comunque una copia da rimettere. Nessun altro li tocca.',
    ],
  },
]

/* ═══════════ UNO PER GIOCO, dietro il `?` della barra ═══════════
   La chiave è quella della schermata (`App.vue` / `giochi/schermate.js`),
   così chi monta la barra scrive `guida="torri"` e non deve inventarsi
   un altro nome. Manca un gioco? Il `?` non compare: chi non ha niente
   da spiegare non deve avere un tasto che apre una schermata vuota. */
export const AIUTI = {
  torri: {
    emoji: '🏹', titolo: 'La difesa del castello',
    blocchi: [
      'Dei nemici camminano lungo la strada. Se arrivano in fondo, il castello perde una vita.',
      { titolo: 'Come si gioca', righe: [
        'Tocca una **piazzola vuota** lungo la strada per costruirci una torre.',
        'Tocca una **torre già in piedi** per potenziarla.',
        'Per costruire e potenziare servono soldi, e i soldi si prendono **facendo i conti**.',
      ] },
      { titolo: 'Le cose che si capiscono tardi', righe: [
        'Le torri sparano solo a chi passa **vicino a loro**: metterle tutte insieme all\'inizio lascia scoperto il resto.',
        'Una torre potenziata vale più di due torri deboli.',
        'A metà scaletta una torre sceglie un mestiere: cambia **come** colpisce, non quanto. Nessuno dei due è quello sbagliato.',
        'Il campo non si ferma mentre fai i conti: i nemici camminano.',
      ] },
      { titolo: 'Cosa allena', righe: [
        'Le quattro operazioni **in colonna**, coi riporti e i prestiti, su numeri che crescono tappa dopo tappa.',
        'E la parte che non è matematica: decidere dove spendere quello che si ha, che è la cosa che il gioco chiede davvero.',
      ] },
    ],
  },

  castello: {
    emoji: '🏰', titolo: 'Il castello',
    blocchi: [
      'Ogni tappa è un assedio: i nemici arrivano da una parte, tu costruisci le torri lungo la strada.',
      { titolo: 'Come si gioca', righe: [
        'Tocca il campo dove vuoi costruire: si apre il foglio con le torri e i prezzi.',
        'I conti danno i soldi per costruire. Più ne fai, più torri metti.',
        'Le torri si potenziano toccandole.',
      ] },
      { titolo: 'Consigli', righe: [
        'Una torre sola tenuta forte regge più di quattro appena messe.',
        'Guarda da dove entrano: in certe tappe gli ingressi sono due.',
      ] },
      { titolo: 'Cosa allena', righe: [
        'Il calcolo in colonna, come il tower defense, ma dentro una mappa che si guarda dall\'alto.',
        'E il conto della spesa: quanto costa una torre nuova contro quanto costa alzare quella che c\'è.',
      ] },
    ],
  },

  fattoria: {
    emoji: '🚜', titolo: 'La fattoria',
    blocchi: [
      'Qui non si vince: è il posto dove si spendono le monete guadagnate negli altri giochi. Cresce piano, e resta com\'era lasciata.',
      { titolo: 'I due tocchi', righe: [
        '**Un tocco** apre o raccoglie.',
        '**Tenere il dito premuto** su una cosa già messa la prende, per spostarla.',
        '**Tenere premuto sul prato vuoto** apre il baule, senza andare fino al tasto in alto.',
      ] },
      { titolo: 'Le prime cose da fare', righe: [
        'Compra un pezzo di terra: la fattoria diventa più grande.',
        'Sgombra il bosco per fare posto.',
        'Semina un campo, e **torna più tardi** a raccoglierlo: ci mette qualche minuto vero.',
        'Niente marcisce mai: se ti dimentichi un campo, lo trovi lì.',
      ] },
      { titolo: 'Gli animali', righe: [
        'Si comprano dal baule e poi girano per il prato per conto loro.',
        'Hanno fame, voglia di giocare e di essere spazzolati: ogni gesto costa una monetina.',
        'Nessuno sta mai male davvero e **nessuno muore**: se il gioco resta chiuso una settimana, al ritorno hanno solo fame.',
        'Per metterne uno nel recinto lo si **prende e si posa** dentro, tenendo il dito premuto: da solo la staccionata non la passa.',
      ] },
      { titolo: 'Le cose nuove nel baule', righe: [
        'Non c\'è tutto dal primo giorno: il baule si riempie **spendendo**. Più monete si spendono qui, più sale il livello della fattoria e più roba arriva.',
        'Cosa arriva al livello dopo si legge nella pagina dei livelli — così si sa per cosa si sta risparmiando.',
      ] },
      { titolo: 'La catena', righe: [
        'Il raccolto non si mangia così com\'è: al **fienile** diventa mangime, e il mangime si dà ai recinti.',
        'Un recinto che ha fame lo dice da solo: sopra gli galleggia **proprio quello che aspetta**.',
        'Quello che ne torna — uova, latte, lana — finisce nella ciotola o addosso a un animale di casa.',
        'Se una cosa non si può fare, il foglio dice **cosa fare adesso** e porta il tasto per farlo.',
      ] },
      { titolo: 'Cosa allena', righe: [
        'Niente domande: qui non si studia, si **spende**. È il motivo per cui vale la pena esercitarsi negli altri giochi.',
        'Quello che chiede davvero è aspettare e fare un progetto: risparmiare per il pezzo di terra invece di comprare subito la cosa piccola.',
      ] },
    ],
  },

  mate: {
    emoji: '➕', titolo: 'I conti in colonna',
    blocchi: [
      { titolo: 'Si scrive una cifra alla volta', righe: [
        'Se il risultato della colonna è **12**, non si scrive «12»: si scrive **2** sotto la colonna, e l\'**1** è il riporto — nel gioco non si scrive da nessuna parte, si tiene a mente per la colonna accanto.',
        'Si parte sempre da destra.',
      ] },
      'Il gioco segue da sé: scritta una cifra, passa alla colonna dopo. E se si sbaglia, la riga sotto smette di ripetere la regola e **fa vedere il conto di quella colonna**, riporto compreso.',
      { titolo: 'Cosa allena', righe: [
        'Le tabelline e il calcolo a mente, e la procedura della colonna — quella che a scuola si chiama «l\'algoritmo».',
        'Le domande arrivano più spesso su quello che va male: chi sbaglia il 7×8 lo rivede presto, chi lo sa se lo ritrova di rado.',
      ] },
    ],
  },

  generale: {
    emoji: '🎖️', titolo: 'Il generale',
    blocchi: [
      'Tu non giochi: **dai gli ordini**, e poi guardi come va a finire. Se qualcosa non torna, si cambia il piano e si riprova.',
      { titolo: 'Come si gioca', righe: [
        'Metti in fila gli ordini, uno sotto l\'altro.',
        'Poi manda avanti e guarda: gli ordini vengono eseguiti in quell\'ordine.',
        'Se finisce male, non hai perso niente: cambia un ordine e rilancia.',
      ] },
      'Le prime prove insegnano una cosa per volta. Non c\'è fretta e non c\'è punteggio a tempo.',
      { titolo: 'Cosa allena', righe: [
        'Pensare per passi e prevedere le conseguenze: è programmare, senza chiamarlo così.',
        'E l\'idea che un errore si legge — «è andata storta qui» — invece di riprovare a caso.',
      ] },
    ],
  },

  sotterraneo: {
    emoji: '🗝️', titolo: 'Il sotterraneo',
    blocchi: [
      'Si scende di stanza in stanza cercando la chiave e la scala. Quasi tutto quello che c\'è dentro chiede una domanda.',
      { titolo: 'Cosa chiede cosa', righe: [
        '🚪 **una porta chiusa** — una domanda facile: se sbagli si riprova.',
        '🎁 **un forziere** — una domanda sola, tosta: se sbagli resta chiuso.',
        '⛲ **una fonte** — una domanda, e ti ridà vita.',
        '👹 **un mostro** — una domanda a colpo, finché uno dei due cade.',
        '📖🔮⏳🍷 **le curiosità** — un libro, una sfera, una clessidra, un calice: una domanda, e poi si vede cosa succede. Può andare bene o male, e spesso male vuol dire solo una risata.',
      ] },
      { titolo: 'Le armi', righe: [
        'Un\'arma migliore di quella che hai **te la metti da sola** appena la tocchi, e la riga che compare dice quanto ci guadagni: «⚔️ +2».',
        'Le armi leggere — spade corte, accette, pugnali — si portano **due alla volta**, una per mano; la mano debole colpisce la metà. Due leggere valgono una pesante.',
        'Quelle grosse (spadoni, asce, archi, bastoni) vogliono **tutte e due le mani**: nello zaino lo vedi dall\'ombra nella casella di sinistra.',
        'Un\'arma non fa più danno a ogni colpo: fa **cadere prima** chi hai davanti, e siccome il mostro ti graffia a ogni scambio, chi cade prima ti costa meno vita.',
      ] },
      { titolo: 'Le pozioni', righe: [
        'Si bevono dallo zaino, quando vuoi tu: la 🧪 boccetta ridà 6 punti, la pozione 10, la 🍷 ampolla 18. Non scadono e non si sprecano — bevute a vita piena, la parte che avanza è persa.',
        'Il mostro ti prende qualcosa **anche quando rispondi giusto** (un graffio, metà del colpo), e per questo le pozioni servono: senza, una discesa lunga finisce con uno svenimento.',
        'Le tasche sono sei. Quando sono piene, quello che trovi resta per terra: dal mercante puoi vendere a metà prezzo quello che non usi.',
        '🔦 **La torcia non si accende**: basta prenderla, e da lì in avanti vedi più lontano. Non occupa nemmeno una tasca.',
      ] },
      { titolo: 'Consigli', righe: [
        'Non serve aprire tutto: alla scala si arriva anche saltando qualcosa.',
        'Se la vita è quasi finita, la fonte vale più di un forziere.',
        'Le gemme si prendono camminandoci sopra: quello che luccica intorno a una cosa vuol dire che quella cosa si tocca.',
      ] },
      { titolo: 'Cosa allena', righe: [
        'Le domande sono di tutte le materie, tarate sull\'età del bambino: matematica, italiano, le lingue, quello che è acceso nelle impostazioni.',
        'In più c\'è da decidere dove andare con quello che si ha, che è la parte che nessun quiz da solo insegna.',
      ] },
    ],
  },

  dungeon: {
    emoji: '⚔️', titolo: 'Il dungeon',
    blocchi: [
      'Si scende in fondo al sotterraneo e si combatte rispondendo: ogni risposta giusta è un colpo dato, ogni sbaglio è un colpo preso.',
      { titolo: 'Consigli', righe: [
        'Dopo uno sbaglio il gioco si ferma un paio di secondi **apposta**: serve a leggere la risposta giusta, non è un tasto rotto.',
        'Le pozioni e i tesori raccolti restano per gli scontri dopo: non conviene tenerli da parte fino alla fine.',
      ] },
      { titolo: 'Cosa allena', righe: [
        'Le stesse domande del sotterraneo — tutte le materie, sulla misura del bambino — ma chieste una dietro l\'altra, senza mappa da guardare.',
        'È il gioco giusto per fare tanti esercizi in poco tempo.',
      ] },
    ],
  },

  corsa: {
    emoji: '🏁', titolo: 'La corsa dei numeri',
    blocchi: [
      'Si corre lungo una strada e ai cancelli si sceglie da che parte passare: la scelta si fa **col conto**, al volo.',
      { titolo: 'Consigli', righe: [
        'Sbagliare un cancello non toglie niente: si è perso solo il tempo di provarci.',
        'Ma il tempo conta: chi arriva agli scontri col fiato corto fa più fatica.',
      ] },
      { titolo: 'Cosa allena', righe: [
        'Il calcolo **rapido**: non i conti difficili, ma quelli facili fatti senza fermarsi a pensare.',
        'È l\'esercizio che rende automatico quello che si è già capito altrove.',
      ] },
    ],
  },

  codice: {
    emoji: '🔐', titolo: 'Il codice segreto',
    blocchi: [
      'Devi indovinare un codice nascosto. A ogni tentativo il gioco dice **quanti** ne hai azzeccati, non quali.',
      { titolo: 'Come si ragiona', righe: [
        'Un tentativo che sbaglia serve lo stesso: dice qualcosa.',
        'Cambia **una cosa per volta** e guarda se il conto sale o scende.',
      ] },
      'Alla fine di una partita si può rivedere la spiegazione: fa vedere il ragionamento passo per passo.',
      { titolo: 'Cosa allena', righe: [
        'Il ragionamento per esclusione: dedurre quello che non si vede da quello che si vede.',
        'Non c\'è niente da sapere a memoria — si può giocare senza saper leggere bene.',
      ] },
    ],
  },

  bancarella: {
    emoji: '🍎', titolo: 'Al mercato',
    blocchi: [
      'Un banco per volta, tre clienti a banco: si legge il cartellino, si conta quello che chiedono e si dà il resto giusto.',
      { titolo: 'La cosa da sapere', righe: [
        'I clienti **hanno una loro pazienza**: se ci si mette troppo si lamentano, e la giornata si può chiudere male.',
        'Tappa dopo tappa il tempo si stringe: è lì che il gioco diventa difficile, non nei numeri più grandi.',
      ] },
      { titolo: 'Cosa allena', righe: [
        'I soldi veri: euro e centesimi, comporre una cifra coi tagli che si hanno, e **il resto**.',
        'Contare avendo un po\' di fretta addosso — che è come si conta alla cassa vera.',
      ] },
    ],
  },

  pozioni: {
    emoji: '🧪', titolo: 'Le pozioni',
    blocchi: [
      'La ricetta è scritta in unità grandi (0,75 l), gli attrezzi del banco sono tarati in unità piccole (ml): convertire non è una domanda, è il modo di usare l\'attrezzo.',
      { titolo: 'I tre attrezzi', righe: [
        '🫗 **versa** — tieni premuto per riempire in fretta, poi la goccia fine.',
        '⚖️ **pesa** — metti i pesi sul piatto finché fanno la quantità.',
        '✂️ **taglia** — trascina la lama sul righello e taglia.',
      ] },
      'Si sbaglia col troppo: la boccia trabocca e la pozione fa BOOM. Non costa una vita, costa tempo.',
      { titolo: 'Cosa allena', righe: [
        'Le misure e le unità: litri e millilitri, chili e grammi, metri e centimetri — e passare dall\'una all\'altra.',
        'I decimali visti come quantità e non come numeri sulla carta: 0,75 l è tre quarti di boccia.',
      ] },
    ],
  },

  survivors: {
    emoji: '🏹', titolo: 'Survivors',
    blocchi: [
      'Si scappa dai mostri, e si spara da soli: il dito serve solo a **muoversi**.',
      { titolo: 'Come si gioca', righe: [
        'Trascina il dito sullo schermo per spostarti.',
        'I mostri arrivano da tutte le parti: stare fermi non conviene mai.',
        'Ogni tanto si sceglie un potenziamento. Prendere sempre lo stesso lo rende molto forte, prenderne di diversi copre più situazioni.',
      ] },
      { titolo: 'Cosa allena', righe: [
        'Riflessi e colpo d\'occhio, non materie di scuola: è uno dei giochi che si prendono come ricompensa.',
        'L\'unica scelta che ragiona è quella dei potenziamenti, e si impara perdendo.',
      ] },
    ],
  },

  conta: {
    emoji: '🔢', titolo: 'Conta gli animali',
    blocchi: [
      'Si conta quello che si vede e si tocca il numero giusto. Niente da leggere: la consegna in cima è tutta disegni.',
      'Non c\'è tempo che stringe e non si perde: se la risposta è sbagliata si conta insieme e si riprova la stessa domanda, finché non riesce.',
      { titolo: 'Cosa allena', righe: [
        'Contare, e riconoscere «quanti sono» senza contarli uno a uno.',
        'È il primo gioco che un bambino di quattro anni apre da solo.',
      ] },
    ],
  },

  prima: {
    emoji: '⏭️', titolo: 'Prima e dopo',
    blocchi: [
      'Ci sono dei disegni fuori ordine: raccontano una storia, e va rimessa in fila.',
      { titolo: 'Come si gioca', righe: [
        'Tocca i disegni **nell\'ordine in cui succedono**: prima quello che viene prima.',
        'Un tocco sbagliato lampeggia e basta: non si perde niente, si continua da lì.',
      ] },
      { titolo: 'Cosa allena', righe: [
        'Il tempo: prima, dopo, che cosa fa succedere che cosa.',
        'E raccontare — guardare quattro disegni e capire che sono una storia sola.',
      ] },
    ],
  },

  lingua: {
    emoji: '🗣️', titolo: 'Le parole',
    blocchi: [
      'Si impara una parola alla volta: prima la si sente, poi la si riconosce, poi la si scrive.',
      { titolo: 'Come si gioca', righe: [
        'Tocca **l\'altoparlante** per risentire la parola: si può quante volte si vuole.',
        'Una parola sbagliata non è persa: torna più avanti, e più spesso di quelle che vanno bene.',
      ] },
      { titolo: 'Cosa allena', righe: [
        'Vocaboli e frasi, con la pronuncia incisa da voci vere — non la voce del telefono.',
        'Le due lingue restano separate: quello che si impara in inglese non si mescola con lo spagnolo, e viceversa.',
      ] },
    ],
  },

  cameretta: {
    emoji: '🛏️', titolo: 'La cameretta',
    blocchi: [
      'Il posto degli animali: si comprano coi soldi guadagnati negli altri giochi, e poi hanno bisogno di qualcosa — mangiare, giocare, essere lavati.',
      { titolo: 'Cosa allena', righe: [
        'Niente: è la ricompensa, come la fattoria. Serve a dare un motivo per esercitarsi.',
        'Prendersene cura è l\'unica cosa che chiede, e non si può sbagliare.',
      ] },
    ],
  },
}

export const guida = id => GUIDE.find(g => g.id === id) || null
export const aiutoDi = chiave => AIUTI[chiave] || null
