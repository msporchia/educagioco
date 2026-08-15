/* ═══════════════════════════════════════════════════════════════════
   I TRAGUARDI — l'elenco, non il motore.

   Ogni traguardo si misura su una sola grandezza che cresce e non torna
   mai indietro (risposte giuste, tappe superate, pasti serviti...), e ha
   fino a tre soglie: 🥉 🥈 🥇. Il valore si legge dal profilo tramite
   l'oggetto `m` delle misure (vedi store/progressi.js): qui dentro non
   c'è logica, così aggiungere un traguardo è aggiungere una riga.

   Conseguenza importante: i traguardi sono RETROATTIVI. Chi ha già
   servito 60 pasti prima che questa pagina esistesse si trova il badge
   sbloccato al primo avvio, perché il valore si ricalcola dal profilo e
   non viene contato a partire da oggi.

   `come(n)` è la frase che legge il bambino, con dentro la soglia del
   grado a cui sta puntando: "Servi 60 pasti" e non "Servi tanti pasti".

   Qui sotto ci sono **i giochi vecchi**, uno per uno. I giochi nuovi
   (`src/giochi/`) portano i propri traguardi nel loro manifesto e si
   accodano da soli in fondo al file: aggiungerne uno non si fa più qui.
   ═══════════════════════════════════════════════════════════════════ */
import { AREE_GIOCHI, TRAGUARDI_GIOCHI } from '../giochi/albo.js'

/* ═══════════ l'interruttore del generale ═══════════
   TOGLIERE QUANDO IL GIOCO ENTRA IN HOME — è l'unica riga da cambiare.

   Finché è `false`, il generale non esiste per l'albo: né la sua area di
   traguardi, né i suoi cinque traguardi, né la materia degli ordini
   (`difficoltaOra('ordini')` risponde 1, e va bene: il gioco non si può
   ancora aprire). Serve perché i traguardi sono retroattivi e la
   schermata è raggiungibile solo dall'indirizzo: un bambino che apre
   l'albo e trova una sezione a 0/5 di un gioco che non può giocare vede
   un buco, non una promessa.

   Non è solo estetica: i traguardi qui sotto entrano in `quantiTotali`,
   e cinque traguardi impossibili farebbero segnare 42/47 a chi ha preso
   tutto. Tenerli fuori tiene onesti i conti. */
export const GENERALE_ATTIVO = true

/* le famiglie in cui la pagina raggruppa i traguardi */
const AREE_TUTTE = [
  { id: 'mate',     nome: 'Tabelline Asteroidi', emoji: '☄️', classe: 'mate' },
  /* parole, verbi e frasi sono un gioco solo: una famiglia sola di
     traguardi. Gli id dei vecchi traguardi dei verbi restano quelli,
     altrimenti i badge già presi sparirebbero dal profilo. */
  { id: 'inglese',  nome: 'English',             emoji: '🌐', classe: 'eng' },
  { id: 'spagnolo', nome: 'Español',             emoji: '🇪🇸', classe: 'esp' },
  { id: 'torri',    nome: 'Difendi il Castello', emoji: '🏰', classe: 'td' },
  { id: 'pozioni',  nome: 'Il laboratorio delle pozioni', emoji: '⚗️', classe: 'poz' },
  { id: 'bancarella', nome: 'La bancarella',       emoji: '🛒', classe: 'banco' },
  { id: 'generale', nome: 'Il generale',           emoji: '🎖️', classe: 'gen' },
  { id: 'animali',  nome: 'Watson, Sherlock & Irene', emoji: '🐾', classe: 'pets' },
  { id: 'cameretta',nome: 'Cameretta & Negozio', emoji: '🛏️', classe: 'room' },
  { id: 'tutti',    nome: 'Tutti i giochi',      emoji: '🌈', classe: 'tutti' },
]

/* medaglie dei tre gradi, e monete che porta ciascuno */
export const MEDAGLIE = ['🥉', '🥈', '🥇']
export const PREMI = [15, 40, 100]

const TRAGUARDI_TUTTI = [
  /* ---------- Tabelline Asteroidi ---------- */
  /* «partiteMath» conta le partite di tutti e due i cieli — pianeti e
     stazioni — quindi la frase non nomina le tabelline */
  { id: 'mate-prima', area: 'mate', emoji: '🚀', nome: 'Primo volo',
    come: () => 'Gioca una partita agli Asteroidi',
    soglie: [1], valore: m => m.tot('partiteMath') },
  { id: 'mate-giuste', area: 'mate', emoji: '☄️', nome: 'Cacciatore di asteroidi',
    come: n => `Colpisci ${n} asteroidi giusti`,
    soglie: [50, 250, 1000], valore: m => m.tot('math') },
  { id: 'mate-campagna', area: 'mate', emoji: '🪐', nome: 'Esploratore di pianeti',
    come: n => n === 1 ? 'Supera il primo pianeta' : `Supera ${n} pianeti della campagna`,
    soglie: [1, 5, 10], valore: m => m.tappeMate() },
  { id: 'mate-sicure', area: 'mate', emoji: '✖️', nome: 'Tabelline sicure',
    come: n => `Impara ${n} calcoli sul serio`,
    soglie: [10, 30, 55], valore: m => m.imparati('math:') },
  /* Il traguardo che il bambino racconta a parole: "so la tabellina del
     7". Vale tutta la tabellina, non un calcolo per volta, e la misura
     guarda la forza di adesso: una tabellina lasciata lì per un mese
     smette di contare finché non si ripassa. */
  { id: 'mate-tabelline', area: 'mate', emoji: '⭐', nome: 'Tabelline a memoria',
    come: n => n === 1 ? 'Impara una tabellina intera, tutte e dieci le caselle'
                       : `Impara ${n} tabelline intere`,
    soglie: [1, 5, 10], valore: m => m.tabellineIntere() },
  { id: 'mate-serie', area: 'mate', emoji: '🎯', nome: 'Filotto',
    come: n => `${n} risposte giuste di fila in una partita`,
    soglie: [10, 20, 40], valore: m => m.best('serieMath') },
  { id: 'mate-record', area: 'mate', emoji: '🏆', nome: 'Punteggio da record',
    come: n => `Arriva a ${n} punti in una partita`,
    soglie: [200, 600, 1500], valore: m => m.best('math') },

  /* ---------- il calcolo a mente, che sta negli stessi asteroidi ---------- */
  { id: 'mente-stazioni', area: 'mate', emoji: '🛰️', nome: 'Stazioni orbitali',
    come: n => n === 1 ? 'Supera la prima stazione del calcolo a mente'
                       : `Supera ${n} stazioni del calcolo a mente`,
    soglie: [1, 5, 9], valore: m => m.tappeMente() },
  { id: 'mente-giuste', area: 'mate', emoji: '🧠', nome: 'Conti a mente',
    come: n => `Fai ${n} calcoli a mente giusti`,
    soglie: [50, 250, 1000], valore: m => m.tot('mente') },
  /* Non i calcoli ma le STRATEGIE che reggono adesso: «so arrivare alla
     decina» vale più di cento somme azzeccate per caso. Come le tabelline
     intere, scende se non si ripassa. */
  { id: 'mente-concetti', area: 'mate', emoji: '💡', nome: 'Trucchi in tasca',
    come: n => `Tieni in mano ${n} trucchi di calcolo`,
    soglie: [5, 15, 30], valore: m => m.concettiSaldi() },

  /* ---------- English ---------- */
  { id: 'en-parole', area: 'inglese', emoji: '🔤', nome: 'Vocabolario',
    come: n => `Impara ${n} parole inglesi`,
    soglie: [10, 50, 150], valore: m => m.imparati('en:') },
  { id: 'en-giuste', area: 'inglese', emoji: '💬', nome: 'Chiacchierone',
    come: n => `Rispondi giusto ${n} volte in English`,
    soglie: [50, 250, 1000], valore: m => m.tot('en') },
  { id: 'en-categorie', area: 'inglese', emoji: '🗂️', nome: 'Giro del mondo',
    come: n => `Impara almeno 3 parole in ${n} categorie diverse`,
    soglie: [3, 6, 9], valore: m => m.categorieEn(3) },
  { id: 'en-campagna', area: 'inglese', emoji: '🗺️', nome: 'In viaggio',
    come: n => n === 1 ? 'Supera la prima tappa di English' : `Supera ${n} tappe di English`,
    soglie: [1, 6, 13], valore: m => m.tappeEn() },
  { id: 'verbi-imparati', area: 'inglese', emoji: '🎧', nome: 'Orecchio fino',
    come: n => `Impara ${n} verbi`,
    soglie: [5, 15, 30], valore: m => m.imparati('verbo:') },
  { id: 'verbi-giuste', area: 'inglese', emoji: '🔁', nome: 'Coniugatore',
    come: n => `Rispondi giusto ${n} volte sui verbi`,
    soglie: [30, 150, 500], valore: m => m.tot('verbi') },
  { id: 'frasi-imparate', area: 'inglese', emoji: '💬', nome: 'Chi parla inglese',
    come: n => `Impara ${n} frasi intere`,
    soglie: [5, 25, 80], valore: m => m.imparati('frase:') },
  { id: 'frasi-giuste', area: 'inglese', emoji: '🗣️', nome: 'Botta e risposta',
    come: n => `Rispondi giusto ${n} volte sulle frasi`,
    soglie: [20, 100, 400], valore: m => m.tot('frasi') },

  /* ---------- Español ----------
     Gli stessi traguardi dell'inglese, con gli id loro: due lingue non
     si sommano, e chi impara «perro» non ha imparato «dog». */
  { id: 'es-parole', area: 'spagnolo', emoji: '🔤', nome: 'Vocabulario',
    come: n => `Impara ${n} parole spagnole`,
    soglie: [10, 50, 150], valore: m => m.imparati('es:') },
  { id: 'es-giuste', area: 'spagnolo', emoji: '💬', nome: 'Parlantina',
    come: n => `Rispondi giusto ${n} volte in Español`,
    soglie: [50, 250, 1000], valore: m => m.tot('es') },
  { id: 'es-categorie', area: 'spagnolo', emoji: '🗂️', nome: 'Giro del mondo',
    come: n => `Impara almeno 3 parole spagnole in ${n} categorie diverse`,
    soglie: [3, 6, 9], valore: m => m.categorieEs(3) },
  { id: 'es-campagna', area: 'spagnolo', emoji: '🗺️', nome: 'In viaggio',
    come: n => n === 1 ? 'Supera la prima tappa di Español' : `Supera ${n} tappe di Español`,
    soglie: [1, 6, 13], valore: m => m.tappeEs() },
  { id: 'es-verbi', area: 'spagnolo', emoji: '🎧', nome: 'Orecchio fino',
    come: n => `Impara ${n} verbi spagnoli`,
    soglie: [5, 15, 30], valore: m => m.imparati('verbo-es:') },
  { id: 'es-frasi', area: 'spagnolo', emoji: '🗣️', nome: 'Chi parla spagnolo',
    come: n => `Impara ${n} frasi spagnole intere`,
    soglie: [5, 25, 80], valore: m => m.imparati('frase-es:') },
  { id: 'es-frasi-giuste', area: 'spagnolo', emoji: '🔁', nome: 'Botta e risposta',
    come: n => `Rispondi giusto ${n} volte sulle frasi spagnole`,
    soglie: [20, 100, 400], valore: m => m.tot('frasiEs') },
  /* Quello che questo gioco è venuto a fare: parlare con la mamma. Si
     prende quando si sanno le frasi di tutti i giorni, non le parole
     sciolte, ed è l'unico traguardo con un grado solo. */
  { id: 'es-mamma', area: 'spagnolo', emoji: '💛', nome: 'Ahora hablo con mamá',
    come: () => 'Impara 20 frasi spagnole e supera sei tappe',
    soglie: [1], valore: m => (m.imparati('frase-es:') >= 20 && m.tappeEs() >= 6 ? 1 : 0) },

  /* ---------- Difendi il Castello ---------- */
  /* le soglie sono i confini delle tre campagne — la prima tappa, il
     Bosco intero, tutte e quindici — e non tre numeri qualsiasi: erano
     `[1, 3, 6]` da quando le tappe erano sei in tutto, e l'oro si
     sarebbe preso a un terzo del viaggio. Chi l'oro ce l'ha già lo
     tiene: un grado registrato non si toglie mai (`riscuotiTraguardi`). */
  { id: 'td-tappe', area: 'torri', emoji: '🗺️', nome: 'La campagna',
    come: n => n === 1 ? 'Supera la prima tappa'
                       : n === 15 ? 'Finisci tutte e quindici le tappe'
                       : `Supera ${n} tappe`,
    soglie: [1, 5, 15], valore: m => m.tappe() },
  { id: 'td-torri', area: 'torri', emoji: '🗼', nome: 'Costruttore',
    come: n => `Costruisci ${n} torri`,
    soglie: [10, 60, 250], valore: m => m.tot('torri') },
  { id: 'td-perfette', area: 'torri', emoji: '⭐', nome: 'Senza sbavature',
    come: n => `Risolvi ${n} operazioni senza un errore`,
    soglie: [5, 30, 120], valore: m => m.tot('perfette') },
  { id: 'td-onda', area: 'torri', emoji: '🌊', nome: 'Resisti!',
    come: n => `Arriva all'ondata ${n} in una partita`,
    soglie: [5, 15, 30], valore: m => m.best('onda') },
  { id: 'td-quattro', area: 'torri', emoji: '➗', nome: 'Le quattro operazioni',
    come: n => n === 4 ? 'Diventa sicuro in tutte e quattro le operazioni'
                       : `Diventa sicuro in ${n} operazioni`,
    soglie: [2, 4], valore: m => m.imparati('op:') },

  /* ---------- Il laboratorio delle pozioni ---------- */
  { id: 'poz-pozioni', area: 'pozioni', emoji: '🧪', nome: 'Alchimista',
    come: n => `Prepara ${n} pozioni`,
    soglie: [10, 50, 200], valore: m => m.tot('pozioni') },
  { id: 'poz-perfette', area: 'pozioni', emoji: '✨', nome: 'Mano ferma',
    come: n => `Prepara ${n} pozioni senza un errore`,
    soglie: [5, 30, 120], valore: m => m.tot('pozioniPerfette') },
  /* le nove conversioni sono l'intero programma del gioco: saperle tutte
     vuol dire aver capito che ogni scalino vale ×10 */
  { id: 'poz-misure', area: 'pozioni', emoji: '🪜', nome: 'Le nove conversioni',
    come: n => n === 9 ? 'Impara tutte e nove le conversioni' : `Impara ${n} conversioni`,
    soglie: [3, 6, 9], valore: m => m.imparati('pozioni:') },
  { id: 'poz-turno', area: 'pozioni', emoji: '🔮', nome: 'Turno da record',
    come: n => `Prepara ${n} pozioni prima di finire i cuori`,
    soglie: [5, 10, 20], valore: m => m.best('pozioni') },
  { id: 'poz-tappe', area: 'pozioni', emoji: '🗺️', nome: 'Il laboratorio',
    come: n => n === 1 ? 'Supera la prima tappa del laboratorio'
                       : n === 8 ? 'Finisci tutte e otto le tappe' : `Supera ${n} tappe`,
    soglie: [1, 4, 8], valore: m => m.tappePoz() },

  /* ---------- La bancarella ---------- */
  { id: 'banco-clienti', area: 'bancarella', emoji: '🧾', nome: 'Bottegaio',
    come: n => `Servi ${n} clienti`,
    soglie: [10, 60, 250], valore: m => m.tot('clienti') },
  { id: 'banco-perfetti', area: 'bancarella', emoji: '✨', nome: 'Resto preciso',
    come: n => `Dai ${n} resti col minor numero di monete`,
    soglie: [5, 30, 120], valore: m => m.tot('restiPerfetti') },
  { id: 'banco-fasce', area: 'bancarella', emoji: '🪙', nome: 'Cassiere provetto',
    come: n => n === 5 ? 'Cavatela con ogni resto, centesimi compresi'
                       : `Diventa sicuro su ${n} tipi di resto`,
    soglie: [2, 4, 5], valore: m => m.imparati('bancarella:') },
  { id: 'banco-giornata', area: 'bancarella', emoji: '🛒', nome: 'Giornata piena',
    come: n => `Servi ${n} clienti prima di chiudere`,
    soglie: [5, 12, 25], valore: m => m.best('clienti') },
  { id: 'banco-mercati', area: 'bancarella', emoji: '🧺', nome: 'Giro di mercato',
    come: n => n === 1 ? 'Finisci la prima giornata di mercato'
                       : `Finisci ${n} giornate di mercato`,
    soglie: [1, 3, 6], valore: m => m.tot('mercati') },
  { id: 'banco-incasso', area: 'bancarella', emoji: '💰', nome: 'Cassa d\'oro',
    come: n => `Incassa ${Math.round(n / 100)} € in tutto`,
    soglie: [10000, 50000, 200000], valore: m => m.tot('incasso') },

  /* ---------- Il generale ----------
     Qui non si conta quante volte si è indovinato: si conta quante volte
     ci si è arrivati da soli. Per un pezzo il metro è stato il par — «ce
     l'ho fatta con quattro ordini» — ed era il metro sbagliato: il gioco
     non chiede di risolvere in poche mosse, chiede di risolvere. Adesso
     quello che vale è aver chiuso senza farsi svelare né la struttura né
     la soluzione, e senza lasciare nessuno sul campo. */
  { id: 'gen-livelli', area: 'generale', emoji: '🎖️', nome: 'Sul campo',
    come: n => n === 1 ? 'Supera il primo livello del generale'
                       : `Supera ${n} livelli del generale`,
    soglie: [1, 5, 12], valore: m => m.tot('missioni') },
  /* l'`id` resta `gen-par` anche se il par non c'è più: è la chiave con
     cui la medaglia è già salvata nei profili (`p.badge[id]`), e
     cambiarla farebbe ripartire da zero chi l'aveva presa — che è
     esattamente quello che il travaso `nelPar` → `daSolo` in
     `store/profile.js` serve a evitare. Gli id sono chiavi, non nomi. */
  { id: 'gen-par', area: 'generale', emoji: '🎯', nome: 'Ci sono arrivato da solo',
    come: n => n === 1 ? 'Vinci un livello senza farti svelare niente'
                       : `Vinci ${n} livelli senza farti svelare niente`,
    soglie: [1, 6, 20], valore: m => m.tot('daSolo') },
  /* La riga che il gioco è venuto a insegnare: dire una volta sola una
     cosa che va fatta cento volte. */
  { id: 'gen-avanzati', area: 'generale', emoji: '🔁', nome: 'Non lo ripeto due volte',
    come: n => n === 1 ? 'Vinci un livello con un ordine che si ripete o che aspetta'
                       : `Vinci ${n} livelli con un ordine di alto livello`,
    soglie: [1, 10, 40], valore: m => m.tot('avanzati') },
  { id: 'gen-stelle', area: 'generale', emoji: '⭐', nome: 'Petto di stelle',
    come: n => `Raccogli ${n} stelle sul campo`,
    soglie: [10, 30, 60], valore: m => m.stelleGen() },
  { id: 'gen-campagna', area: 'generale', emoji: '🏁', nome: 'Generale in capo',
    come: () => 'Finisci tutti i livelli della campagna',
    soglie: [1], valore: m => m.campagnaGen() },

  /* ---------- Animali ---------- */
  /* Le soglie sono [1, 3, 8] e non [1, 4, 8] apposta: chi aveva già
     adottato i tre animali di quando ce n'erano tre si tiene l'oro di
     allora, e la medaglia mostrata si ricalcola ogni volta — alzare il
     secondo gradino gliela farebbe tornare indietro sotto gli occhi. */
  { id: 'pets-adozioni', area: 'animali', emoji: '🐾', nome: 'Famiglia',
    come: n => n === 1 ? 'Adotta il primo amico' : `Adotta ${n} amici`,
    soglie: [1, 3, 8], valore: m => m.animali() },
  { id: 'pets-specie', area: 'animali', emoji: '🦜', nome: 'Che varietà',
    come: n => `Adotta amici di ${n} specie diverse`,
    soglie: [2, 3, 5], valore: m => m.specie() },
  { id: 'pets-pasti', area: 'animali', emoji: '🍖', nome: 'Cuoco di casa',
    come: n => `Servi ${n} pasti`,
    soglie: [10, 60, 250], valore: m => m.tot('pasti') },
  { id: 'pets-preferiti', area: 'animali', emoji: '💛', nome: 'Il piatto giusto',
    come: n => `Azzecca ${n} volte quello che preferiscono`,
    soglie: [5, 25, 100], valore: m => m.tot('preferiti') },
  { id: 'pets-sazi', area: 'animali', emoji: '😻', nome: 'Nessuno ha fame',
    come: () => 'Tieni tutti i tuoi amici con la pancia piena',
    soglie: [1], valore: m => m.tuttiSazi() },
  { id: 'pets-cure', area: 'animali', emoji: '🫧', nome: 'Che coccole',
    come: n => `Lava, spazzola e fai giocare ${n} volte`,
    soglie: [10, 60, 250], valore: m => m.tot('cure') },
  { id: 'pets-contenti', area: 'animali', emoji: '🌟', nome: 'Al settimo cielo',
    come: () => 'Tieni tutti i tuoi amici contenti su tutto',
    soglie: [1], valore: m => m.tuttiContenti() },
  { id: 'pets-capsule', area: 'animali', emoji: '🎁', nome: 'Che sorpresa!',
    come: n => `Apri ${n} capsule`,
    soglie: [5, 25, 100], valore: m => m.tot('capsule') },
  { id: 'pets-guardaroba', area: 'animali', emoji: '🎩', nome: 'Guardaroba',
    come: n => `Colleziona ${n} accessori`,
    soglie: [6, 24, 72], valore: m => m.accessori() },
  { id: 'pets-serie', area: 'animali', emoji: '🏅', nome: 'Collezione completa',
    come: n => n === 1 ? 'Completa una serie di sorprese' : `Completa ${n} serie di sorprese`,
    soglie: [1, 3, 6], valore: m => m.serieComplete() },

  /* ---------- Cameretta ---------- */
  { id: 'room-oggetti', area: 'cameretta', emoji: '🛏️', nome: 'Arredatore',
    come: n => `Compra ${n} oggetti per la cameretta`,
    soglie: [5, 15, 30], valore: m => m.oggetti() },
  { id: 'room-monete', area: 'cameretta', emoji: '🪙', nome: 'Salvadanaio',
    come: n => `Guadagna ${n} monete in tutto`,
    soglie: [100, 500, 2000], valore: m => m.tot('monete') },

  /* ---------- trasversali ---------- */
  { id: 'all-serie', area: 'tutti', emoji: '🔥', nome: 'Ogni giorno',
    come: n => `Gioca ${n} giorni di fila`,
    soglie: [3, 7, 30], valore: m => m.best('serieGiorni') },
  /* i giochi sono sette: la terza soglia è arrivata con il laboratorio e la
     bancarella, e chi aveva già l'argento adesso ha un oro da prendere.
     Col generale i giochi diventano otto, ma le soglie NON si toccano:
     alzare l'oro a 8 farebbe retrocedere a 🥈 chi l'oro ce l'ha già —
     il badge resta scritto nel profilo, ma la medaglia mostrata si
     ricalcola ogni volta, e tornerebbe indietro sotto gli occhi. */
  { id: 'all-tuttofare', area: 'tutti', emoji: '🌈', nome: 'Tuttofare',
    come: n => `Prova ${n} giochi diversi`,
    soglie: [3, 5, 7], valore: m => m.giochiProvati() },
  { id: 'all-livello', area: 'tutti', emoji: '🎓', nome: 'Si sale',
    come: n => `Arriva al livello ${n}`,
    soglie: [3, 6, 12], valore: m => m.livello() },
]

/* Quello che il resto del programma vede: se il generale è spento, la
   sua area e i suoi traguardi non ci sono proprio, e ogni conto — badge
   presi, totali, percentuali — resta quello dei giochi veri. */
const acceso = a => a !== 'generale' || GENERALE_ATTIVO
/* I giochi nuovi (`src/giochi/`) non hanno una riga qui: si presentano da
   soli col blocco `albo` del loro manifesto, e `giochi/albo.js` li mette
   in fila. Vanno in fondo, prima dei trasversali, che restano l'ultima
   famiglia perché parlano di tutti i giochi insieme. */
const trasversale = a => a.id === 'tutti'
export const AREE = [
  ...AREE_TUTTE.filter(a => acceso(a.id) && !trasversale(a)),
  ...AREE_GIOCHI,
  ...AREE_TUTTE.filter(trasversale),
]
export const TRAGUARDI = [
  ...TRAGUARDI_TUTTI.filter(t => acceso(t.area) && t.area !== 'tutti'),
  ...TRAGUARDI_GIOCHI,
  ...TRAGUARDI_TUTTI.filter(t => t.area === 'tutti'),
]

export const traguardoDi = id => TRAGUARDI.find(t => t.id === id) || null
