/* ═══════════════════════════════════════════════════════════════════
   IL VOCABOLARIO — le parole del gioco, e niente altro

   Qui dentro non succede niente: sono TABELLE. I verbi che si possono
   dare, i blocchi che li contengono, le domande che si possono fare, e
   le manciate di funzioni che leggono quelle tabelle senza guardare il
   mondo. Non si importa il mondo, non si importa la mappa, non si
   importa il registro — e per questo lo importano tutti.

   Sta qui perché è la parte che si legge per sapere COSA si può dire,
   e prima stava in mezzo alle regole di cosa succede quando lo dici:
   due domande diverse nello stesso schermo.

   ── la forma di un ordine ───────────────────────────────────────
   Ogni ordine è VERBO + COMPLEMENTO, senza eccezioni: è la regolarità
   che rende il linguaggio imparabile. E ogni ordine punta a una COSA,
   mai a una direzione — «prendi a nord» non vuol dire niente, e un
   gioco fatto di passi contati insegna a contare i passi.

       { verbo:'vai', complemento:'chiave' }
       { verbo:'prendi', complemento:'chiave' }
       { verbo:'suona', complemento:'libero' }
       { verbo:'quando', complemento:'libero', allora:[ …altri ordini… ] }

   ── TRE COSE DIVERSE, TRE FORME DIVERSE ─────────────────────────
   Prima la decisione era un attributo dell'azione — `suona [x] se
   [vedi l'orco]`, col suo gemello `altrimenti` appeso di lato — e
   mescolava due concetti in una riga: chi la leggeva non vedeva né
   l'azione né il bivio. Adesso sono tre forme che non si somigliano:

     l'AZIONE      { verbo, complemento }              si fa
     la DECISIONE  { blocco:'condizione', cond, vero, falso }   sceglie
     l'EVENTO      { verbo:'quando', complemento, allora }  apre un piano

   ── quello che ogni verbo accetta ───────────────────────────────
   Ogni cosa del mondo dichiara il suo TIPO (posto, oggetto, porta,
   unita, fazione, segnale, attimo, cella) e ogni verbo dichiara quali
   tipi prende. Da lì discende tutto: «apri la chiave» non si compone
   più, e un ordine di tipo sbagliato — arrivato da un piano salvato o
   da un livello ritoccato — viene RIFIUTATO prima che qualcuno muova
   un passo.
   ═══════════════════════════════════════════════════════════════════ */

/* ── il vocabolario ─────────────────────────────────────────────
   SI ASTRAE IL COME, NON IL COSA. È il metro per decidere se un verbo
   nuovo può stare più in alto:
     sì — nascondere il MODO di fare una cosa che non è la lezione
          (`vai` fa il pathfinding: girare intorno a un muro non è
          quello che stiamo insegnando)
     sì — riassumere una RIPETIZIONE: ma la ripetizione è un BLOCCO
          (`ripeti`), non un verbo — dieci mete contate diventano due
          ordini dentro un ciclo, e che sia un ciclo si vede
     no — fondere DUE INTENZIONI (`apri` non ti porta al portone)
     no — saltare un PREREQUISITO (se la chiave se la prende da sé, il
          secondo livello non insegna più niente)

   Tre gradi nella stessa cassetta, e convivono. Lo stesso livello si
   fa in tutti i modi: il par premia quello corto senza vietare quello
   lungo, e le tre varianti fanno vedere che quello lungo è anche più
   fragile. Perciò `vai` scende di grado da sé — puntato a un posto è
   il gradino basso, puntato a una cosa da fare è quello di mezzo. */
export const VERBI = {
  /* `vai` accetta anche una CELLA QUALSIASI, non solo le cose che hanno
     un nome: «vai lì» dietro quel muro è una mossa legittima, e apre
     soluzioni che il livello non aveva previsto. Ha però un prezzo che
     il bambino scoprirà da solo — una cella è un numero scritto a mano,
     e se nella scena dopo il muro si sposta quel piano cade, mentre
     «vai alla chiave» segue la chiave dovunque sia. */
  vai:       { et: '🚶', cl: 'moto', nome: 'vai a', grado: 1,
               accetta: ['posto', 'oggetto', 'porta', 'unita', 'fazione', 'cella'] },
  /* `comando: true` — QUESTO VERBO SI CONSEGNA A UNA COSA.
     Cioè: quando ci si arriva, non si fa niente da soli — le si dice
     una parola (`Contesto.consegna`) e lei risponde. Serve a una regola
     sola, e sta qui perché è del vocabolario: **un comando si offre in
     cassetta solo a chi lo capisce** (`Mondo.nomi`, che lo chiede alla
     cosa con `accetta`). Senza, `attacca` comparirebbe in ogni livello
     che ha una chiave per terra, perché una chiave è un oggetto e
     `attacca` accetta gli oggetti. */
  prendi:    { et: '🎒', cl: 'azione', nome: 'prendi', grado: 2, comando: true, accetta: ['oggetto'] },
  /* ── E IL SUO GEMELLO ──
     Senza `posa` una cosa presa è una cosa tolta dal mondo, e passarla
     a qualcun altro non si può scrivere. Con lui l'oggetto torna a
     essere un posto: lo lasci dove sei, e chi passa di lì lo trova. */
  posa:      { et: '🫳', cl: 'azione', nome: 'posa', grado: 2, comando: true, accetta: ['oggetto'] },
  apri:      { et: '🔓', cl: 'azione', nome: 'apri', grado: 2, comando: true, accetta: ['porta'] },
  /* ── CHIUDERSI DIETRO UNA PORTA ──
     Il gemello di `apri`, e non è una simmetria per bellezza: una porta
     chiusa **taglia la vista** (di qua e di là: si vede a distanza di
     cammino, e da una porta chiusa non ci si cammina) ma **non taglia
     il suono**. Chi si chiude dentro diventa cieco e resta in ascolto:
     l'unica cosa che gli arriva è un segnale, ed è esattamente il
     principio del gioco reso letterale — quello che non vedi te lo
     deve dire qualcuno.
     Da qui viene anche il tempo: dietro una porta chiusa aspettare non
     costa niente, e il rischio si concentra tutto nell'istante in cui
     riapri. */
  chiudi:    { et: '🔒', cl: 'azione', nome: 'chiudi', grado: 2, comando: true, accetta: ['porta'] },
  /* ── UN VERBO SOLO PER OGNI CONGEGNO ──
     Una leva e un totem non si dicono in due modi diversi (`tira`,
     `gira`, `accendi` sono stati scartati apposta, §10 del piano):
     `premi` basta per tutti e due, e cosa succede quando arrivi a
     zero — o a `tacche` — lo decide il congegno che lo riceve, non
     questo verbo. Come `apri` e `prendi`, ci si arriva camminando. */
  premi:     { et: '👆', cl: 'azione', nome: 'premi', grado: 2, comando: true, accetta: ['congegno'] },
  /* `elenco: true` — QUESTO BERSAGLIO NON SI INDICA COL DITO.
     Indicare un nemico sulla mappa vuol dire «quell'orco lì, quello in
     quel punto», e non è quello che si sta scrivendo: un piano si firma
     prima della battaglia, quando l'orco è ancora dove gli pare. Quello
     che si vuole dire è «un orco», cioè la classe — ed è anche la
     stessa cosa che dice la guardia: «smetti quando vedi un orco».
     Perciò il bersaglio si sceglie da un elenco di nomi, dove «gli
     orchi» è una voce come le altre.

     ── E SI ATTACCANO ANCHE LE COSE ──
     Il tamburo, la scala, la leva del ponte: il SABOTAGGIO. Prima non
     era esprimibile e i capitoli che ci si reggevano diventavano altro
     («rompilo» finiva scritto «portalo via»). Non tutte le cose si
     rompono — solo quelle a cui il livello scrive addosso una
     `resistenza` — e chi non la dichiara non compare nemmeno in
     elenco: se ne occupa `comando: true` qui sopra.

     ── E SI PUÒ DIRE QUALE ──
     Su una schiera l'ordine può portare un `quale` (`scelte.js`):
     `il più vicino` (il valore normale), `il più lontano`, `quello
     messo peggio`, `quello più in forze`. Non è un nome, è un
     criterio — «quello laggiù» invecchia con la mappa, «il più
     lontano» no — ed è quello che rende ripulibile un gruppo diviso
     in due posti. */
  attacca:   { et: '⚔️', cl: 'azione', nome: 'attacca', grado: 2, comando: true,
               accetta: ['unita', 'fazione', 'oggetto', 'congegno'], elenco: true },
  /* NESSUNA UNITÀ È ONNISCIENTE. Prima `aspetta [l'orco]` voleva dire
     «finché non è fuori combattimento», e lo sapeva anche da tre stanze
     più in là senza aver visto niente: era un fatto globale travestito
     da percezione. Adesso si aspetta un SEGNALE — cioè qualcuno che te
     lo dice — oppure un momento. Quello che succede fuori dalla vista
     deve passare per un messaggio, che è anche il modo in cui si
     sincronizzano davvero due che non si vedono. */
  /* ── ASPETTARE UNO STATO, RICEVERE UN MESSAGGIO ──
     Sono due cose diverse e prima si sovrapponevano: «l'eroe aspetta il
     via libera» si poteva dire in tutti e due i modi, e nessuno capiva
     quando serviva l'uno o l'altro. Adesso si distinguono da COSA
     ASCOLTANO. `aspetta` guarda il MONDO e aspetta che cambi — il
     portone che si apre, un momento che passa — e funziona solo su
     quello che l'unità VEDE da dov'è. `quando senti` riceve un
     MESSAGGIO, e funziona a distanza proprio perché non stai
     guardando: ti stanno parlando.
     È la regola dell'onniscienza vista dall'altro lato: quello che
     vedi lo puoi aspettare, quello che non vedi te lo deve dire
     qualcuno. Per questo i segnali qui NON ci sono più. */
  /* ── ASPETTARE UNA DOMANDA, cioè `await` ──
     `aspetta che [non vedi le sentinelle]` è l'attesa vera: si sta
     fermi finché il mondo non dice di sì. Prima si poteva aspettare
     solo una COSA — un momento, una porta — e per aspettare uno stato
     bisognava girarci intorno con un ciclo che non fa niente, o
     peggio con un'azione che richiama sé stessa: due modi contorti di
     scrivere una cosa che il linguaggio aveva già mezza in mano, le
     domande dei bivi.
     Resta il vincolo di sempre: si aspetta quello che si VEDE da dove
     si è. Quello che non vedi te lo deve dire qualcuno — e per quello
     c'è «quando senti». */
  /* ── UN MODO SOLO DI ASPETTARE ──
     Erano quattro: `aspetta di vedere [l'orco]`, `aspetta [il
     portone]`, `aspetta [un momento]`, `aspetta che [vedi l'orco]`. A
     chi sta imparando a programmare quattro sinonimi non insegnano
     niente — insegnano che il linguaggio è arbitrario. Ne resta uno, e
     le altre tre sono lo stesso costrutto con la domanda giusta dentro:
     `[vedi l'orco]`, `[il portone è aperto]`, `[passa un momento]`.
     La domanda è la stessa con cui si sceglie una strada in un bivio,
     quindi non è una parola in più da imparare: è quella di prima,
     in un altro posto. */
  aspetta:   { et: '⏳', cl: 'attesa', nome: 'aspetta che', grado: 2,
               vuoleCond: true, accetta: [] },
  suona:     { et: '📣', cl: 'msg', nome: 'suona', grado: 2, accetta: ['segnale'] },
  /* ── IL MESSAGGIO DIRETTO ──
     `suona` è il grido a chiunque stia ascoltando, ovunque sia:
     rumore, con una posizione ma senza un destinatario. `parla` è la
     CHIAMATA — la stessa parola, lo stesso segnale, ma consegnata solo
     a chi il mittente VEDE nell'istante in cui arriva (§3.2 del
     piano). Il vincolo non è un dettaglio: il motore ha un principio
     esplicito — «quello che vedi lo puoi aspettare, quello che non
     vedi te lo deve dire qualcuno» — e un messaggio diretto a distanza
     infinita lo cancellerebbe. Per questo non fa rumore e non chiama
     chi accorre: è un mezzo silenzio, non un allarme. */
  parla:     { et: '🗨️', cl: 'msg', nome: 'parla', grado: 2, accetta: ['segnale'] },
  quando:    { et: '🎬', cl: 'msg', nome: 'quando senti', grado: 3, accetta: ['segnale'] },
  /* ── CHIAMARE UN PEZZO DI PIANO CHE HAI SCRITTO TU ──
     È l'unico verbo che non punta a una cosa del mondo: punta a una
     AZIONE, cioè a una fila di ordini con un nome. Serve a spezzare un
     piano in pezzi che stanno in piedi da soli, e soprattutto a mettere
     una domanda dove una domanda non ci starebbe: dentro il ramo di un
     bivio non entra un altro bivio, ma ci entra un `esegui`, e la
     seconda domanda si fa di là. */
  esegui:    { et: '▶️', cl: 'chiama', nome: 'esegui', grado: 3, accetta: ['routine'] },
}

export const GRADI = { 1: 'un posto alla volta', 2: 'un compito', 3: 'una strategia' }
export const gradoDi = (v, tipo) => {
  const V = VERBI[v]; if (!V) return 2
  if (v === 'vai') return tipo === 'posto' ? 1 : 2
  return V.grado
}

/* ── i blocchi ──
   Non sono verbi e non stanno in cassetta coi verbi: sono STRUTTURE,
   cioè cose che CONTENGONO ordini. Stanno qui e non nella vista perché
   è il motore a sapere cosa vogliono dire, e le stesse parole le usano
   il registro e il validatore.

   ── PERCHÉ «RIPETI» È UN BLOCCO E NON UN VERBO ───────────────────
   Per un pezzo il ciclo è stato il verbo `pattuglia`: prendeva una
   lista di PUNTI e li faceva in tondo. Funzionava, e nascondeva la
   cosa da imparare — perché quella lista di punti era un `for`
   travestito, e dentro non ci si poteva mettere nient'altro. Una ronda
   che a metà giro grida «tutto libero» non era scrivibile; una che
   apre una porta a ogni passaggio nemmeno.
   `ripeti` invece contiene ORDINI QUALSIASI, come i rami di un bivio
   contengono ordini qualsiasi, e sotto ha la sua uscita: è un `while`,
   e la ronda diventa il suo caso più semplice — «ripeti: vai qui, vai
   là — smetti quando vedi qualcuno». Una struttura in meno da spiegare
   e un mondo in più da comporre. */
export const BLOCCHI = {
  condizione: { et: '❓', cl: 'scelta', nome: 'condizione',
                che: 'guarda una volta sola, quando ci arriva, e da lì prende ' +
                     'una delle due strade: mai tutte e due, mai nessuna.' },
  ripeti: { et: '🔁', cl: 'ciclo', nome: 'ripeti',
            che: 'rifà gli ordini che ha dentro, uno dopo l\'altro, e quando ' +
                 'sono finiti ricomincia da capo. Smette quando la domanda ' +
                 'diventa vera — e la guarda a ogni battito, non a fine giro.' },
  /* ── L'AZIONE, cioè un pezzo di piano con un nome ──
     Non sta nella fila: sta accanto, come un «quando senti», e non
     parte da sé. Parte quando qualcuno la chiama con `esegui`, e
     quando ha finito si torna all'ordine dopo la chiamata — è una
     chiamata, non un lancio, e il personaggio resta uno solo.
     Il nome lo mette il gioco («azione 1», «azione 2»): a sei anni
     scrivere un nome è una tastiera in mezzo al pensiero. */
  routine: { et: '▶️', cl: 'chiama', nome: 'azione',
             che: 'una fila di ordini con un nome. Non parte da sola: la chiami ' +
                  'con «esegui», e quando finisce si riprende da dov\'eri. Dentro ' +
                  'ci può stare una domanda — ed è così che si fa una seconda ' +
                  'scelta dove non ci starebbe.' },
}
export const eCondizione = o => !!o && o.blocco === 'condizione'
export const eRipeti = o => !!o && o.blocco === 'ripeti'
export const eRoutine = o => !!o && o.blocco === 'routine'
export const eBlocco = o => eCondizione(o) || eRipeti(o) || eRoutine(o)
export const RAMI = [
  { ramo: 'vero', nome: 'se è vero', et: '✔' },
  { ramo: 'falso', nome: 'se è falso', et: '✘' },
]
/* la lista di un ramo, sempre una lista anche quando non c'è */
export const ramoDi = (o, r) => (eCondizione(o) && Array.isArray(o[r]) ? o[r] : [])
/* e quella di un ciclo o di un'azione: si chiama `corpo`, ed è una fila
   come le altre */
export const corpoDi = o => ((eRipeti(o) || eRoutine(o)) && Array.isArray(o.corpo) ? o.corpo : [])
/* le liste che un blocco si porta dentro, chiunque sia */
export const dentroA = o => eCondizione(o) ? [ramoDi(o, 'vero'), ramoDi(o, 'falso')]
                          : (eRipeti(o) || eRoutine(o)) ? [corpoDi(o)] : []

/* gli ordini che fanno la differenza fra «ce l'ho fatta» e «ho capito»:
   un ciclo, un evento, una decisione. È quello che il profilo conta a
   parte con `avanzati`. */
export const eAvanzato = o => !!o && (eBlocco(o) || o.verbo === 'quando' ||
                                      o.verbo === 'esegui' ||
                                      o.verbo === 'aspettaDiVedere' || !!o.finche)

/* ── UNA CONDIZIONE SI COMPONE COME UN ORDINE ──
   verbo + complemento, la stessa grammatica: `vedi [l'orco]`, `hai [la
   chiave]`, `è aperto [il portone]`. Prima l'interfaccia offriva frasi
   già fatte, col bersaglio deciso dal livello — e una frase fatta non
   si compone, si sceglie. Qui il vocabolario delle condizioni; il
   «non» non è una voce dell'elenco, è un interruttore. */
export const CONDIZIONI = {
  vedi:    { nome: 'vedi', em: '👁' },
  vivo:    { nome: 'è in piedi', em: '❤️' },
  hai:     { nome: 'hai', em: '🎒' },
  aperta:  { nome: 'è aperto', em: '🚪' },
  segnale: { nome: 'hai sentito', em: '📣' },
  qui:     { nome: 'è arrivato a', em: '📍' },
  premuto: { nome: 'è stata premuta', em: '👆' },
  /* «il totem è a 3 o più»: il numero sta nella condizione (`n`), non
     nel totem — è la stessa `c.complemento` degli ordini, con un
     parametro in più, come `qui` ha `chi` */
  almeno:  { nome: 'è almeno a', em: '🗿' },
  /* «il tamburo è rotto»: lo stato di una cosa che si può sfasciare, e
     l'unico modo di dire a un livello che il sabotaggio è riuscito */
  rotto:   { nome: 'è rotto', em: '💥' },
  /* ── LE DUE CHE NE CONTENGONO ALTRE ──
     Non hanno un complemento: hanno un `fra`, cioè una lista di
     domande. Non si offrono nella cassetta del bambino — le scrive
     l'autore del livello, ed è lì che servivano (`vince`/`perde` erano
     liste in AND e basta) — ma valgono ovunque valga una domanda: la
     guardia di un ciclo, il bivio, «aspetta che». */
  oppure:   { nome: 'una di queste', em: '🔀' },
  entrambe: { nome: 'tutte queste', em: '🔗' },
}

/* la chiave con cui due domande si riconoscono uguali. Una domanda che
   ne contiene altre si riconosce dalle sue: se no due `oppure` diversi
   sarebbero la stessa domanda. */
export const chiaveCond = c => !c ? ''
  : [c.cond, c.complemento || '', c.chi || '',
     Array.isArray(c.fra) ? c.fra.map(chiaveCond).join('+') : '',
     c.non ? '!' : ''].join('|')

/* ── CHI SA COSA ──
   Il filtro ha due dimensioni: verbo × tipo (nelle tabelle qui sopra) e
   verbo × CHI LO ESEGUE (qui). Un'unità dichiara nei dati cosa sa fare
   (`sa: […]`); chi non lo dichiara sa tutto quello che il livello
   offre. Il cavaliere è dentro un'armatura: combatte e aspetta, ma non
   fruga per terra e non scassina. Serve poco come regola in più, serve
   molto come RAGIONE per coordinarsi. */
export const saFare = (u, v) => !u || !u.sa || u.sa.includes(v)
/* ── QUELLO CHE NON GLI RIESCE ──
   Diverso da `sa`, e la differenza è tutta nel MOMENTO in cui si
   scopre. `sa` toglie il verbo dalla cassetta: serve per quello che un
   personaggio non c'entra proprio a fare. `nonRiesce` invece lo lascia
   lì — l'ordine si scrive, la scena parte, e quando tocca a lui il
   cavaliere risponde «ho le mani occupate: scudo e spada».
   Un divieto muto sembra un capriccio del gioco e lascia la domanda
   «dov'è finito prendi?»; un ordine che fallisce parlando lascia «ah,
   allora ci deve andare l'altro» — che è la lezione. */
export const nonRiesce = (u, v) => (u && u.nonRiesce && u.nonRiesce[v]) || ''
