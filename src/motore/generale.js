/* ═══════════════════════════════════════════════════════════════════
   IL GENERALE — le regole, senza schermo

   Come `motore/battaglia.js`: qui dentro non c'è un contesto 2D, non
   c'è Vue, non c'è un tasto. Ci sono le unità, gli ordini e quello che
   succede quando li si esegue. Gira uguale nel gioco e in Node, ed è
   la ragione per cui i livelli si possono *provare* invece che
   guardare (`test/unita/generale.test.mjs` li gioca tutti).

   IL MODELLO. Il bambino non pilota nessuno: firma ORDINI PERMANENTI
   alle sue unità, come un generale prima della battaglia. Poi guarda.
   Un'unità sa già camminare (ci pensa una BFS): il bambino decide il
   COSA e il QUANDO, mai il COME.

   Non esiste una «IA dei mostri»: c'è UN solo linguaggio di ordini e
   UN solo esecutore. Ogni fazione ha un AUTORE — il giocatore oppure
   il livello. L'esecutore non sa e non gli importa chi ha scritto cosa.

   ── la forma di un ordine ───────────────────────────────────────
   Ogni ordine è VERBO + COMPLEMENTO, senza eccezioni: è la regolarità
   che rende il linguaggio imparabile. E ogni ordine punta a una COSA,
   mai a una direzione — «prendi a nord» non vuol dire niente, e un
   gioco fatto di passi contati insegna a contare i passi.

       { verbo:'vai', complemento:'chiave' }
       { verbo:'prendi', complemento:'chiave' }
       { verbo:'suona', complemento:'libero' }
       { verbo:'quando', complemento:'libero', allora:[ …altri ordini… ] }

   `quando` non è un'azione: arma un ascolto e passa oltre, e quando
   quel segnale arriva parte una fila nuova. È così che un programma ha
   due punti d'ingresso senza annidare niente.

   E UN PERSONAGGIO FA UNA COSA ALLA VOLTA. Il segnale sveglia solo chi
   è libero: se sta ancora eseguendo qualcos'altro — il piano di
   partenza, un altro ascolto, o lo stesso ascolto sentito un giro fa —
   quel segnale gli scivola addosso, e il registro lo dice. Niente code
   e niente interruzioni a metà: due file che comandano lo stesso
   personaggio nello stesso battito darebbero una scena che non si
   spiega con nessuno dei due piani.

   ── TRE COSE DIVERSE, TRE FORME DIVERSE ─────────────────────────
   Prima la decisione era un attributo dell'azione — `suona [x] se
   [vedi l'orco]`, col suo gemello `altrimenti` appeso di lato — e
   mescolava due concetti in una riga: chi la leggeva non vedeva né
   l'azione né il bivio. Adesso sono tre forme che non si somigliano:

     l'AZIONE      { verbo, complemento }              si fa
     la DECISIONE  { blocco:'condizione', cond, vero, falso }   sceglie
     l'EVENTO      { verbo:'quando', complemento, allora }  apre un piano

   Un BLOCCO CONDIZIONE è una struttura sua, non un ordine con
   un'aggiunta:

       { blocco:'condizione', cond:{cond:'vedi', complemento:'orco'},
         vero:  [ {verbo:'vai', complemento:'portaSotto'} ],
         falso: [ {verbo:'vai', complemento:'portaSopra'} ] }

   e vale così:
     · la condizione si valuta UNA VOLTA, quando il blocco comincia:
       parte esattamente un ramo, e da lì in poi va fino in fondo (se si
       rivalutasse a ogni passo, un'unità potrebbe partire di là e
       finire di qua a metà strada);
     · ogni ramo è una LISTA PIATTA di ordini, come tutte le altre liste
       del gioco, e si esegue in fila; finita, si passa all'ordine dopo
       il blocco;
     · un ramo può restare VUOTO, e vuol dire «in quel caso non fare
       niente»;
     · niente «altrimenti se» a catena e niente blocchi dentro blocchi:
       un ramo contiene ordini semplici. Se un livello chiede di più, si
       usano i segnali e un secondo script.

   ── quello che ogni verbo accetta ───────────────────────────────
   Ogni cosa del mondo dichiara il suo TIPO (posto, oggetto, porta,
   unita, fazione, segnale, attimo, cella) e ogni verbo dichiara quali
   tipi prende. Da lì discende tutto: «apri la chiave» non si compone
   più, e un ordine di tipo sbagliato — arrivato da un piano salvato o
   da un livello ritoccato — viene RIFIUTATO prima che qualcuno muova
   un passo.

   ── IL RUMORE, cioè il mondo che reagisce ───────────────────────
   Finché i nemici eseguono un piano fisso che non ti riguarda, il tuo
   piano non deve adattarsi a niente: si va dalla chiave, si uccide il
   mostro, si apre la porta. Sempre uguale.

   Perciò un'unità può essere fatta così — e sta scritto nella sua
   scheda, non in un ordine, perché non è una cosa che qualcuno le ha
   detto: è come è fatta lei.

       grida:   'aiuto'   se la attaccano, o se vede un avversario,
                          chiama quel segnale. Una volta sola.
       accorre: 'aiuto'   quando lo sente, molla quello che sta
                          facendo e va DOVE È PARTITO il grido; finito
                          lì, riprende i suoi ordini da dov'era.

   Non è un secondo sistema: il grido è un `suona` e chi accorre ha di
   fatto un `quando senti → vai lì`, con la stessa coda dei segnali e
   le stesse righe di registro. Da qui discendono due cose.

   COMBATTERE NON È PIÙ GRATIS. «Uccidi il mostro» diventa una
   decisione con un prezzo: fai rumore, e da tre stanze più in là
   arriva qualcuno. Ora conta DOVE combatti, QUANDO, e SE.

   E LA REAZIONE DIVENTA UN'ARMA. Se accorrono in modo prevedibile,
   farsi vedere è una mossa: il cavaliere si mostra a nord, le guardie
   lasciano il posto, e la ladra passa a sud mentre il corridoio è
   vuoto. Il segnale del nemico è un segnale come gli altri: l'ordine
   `quando senti [aiuto]` di un'unità tua parte quando grida un orco.
   Non serve nessun costrutto nuovo — serve che il mondo faccia rumore.

   DA FARE — LE SENTINELLE CHE SI PARLANO. Oggi un nemico apre bocca
   solo quando le prende o quando ti vede (`grida`). Ma una ronda che
   ogni giro si dice «tutto libero» sarebbe un segnale a orologeria
   scritto dal livello, non da chi gioca: origliarlo è la mossa —
   `quando senti [tutto libero] → parti`, cioè sincronizzarsi con un
   OROLOGIO ALTRUI invece che con un compagno. È lo stesso meccanismo
   già in piedi (una coda di segnali, un ascolto che parte), quindi
   costa poco: serve un modo per un ordine nemico di suonare in mezzo
   a una pattuglia, e serve decidere se il bambino il nome del segnale
   lo legge nel piano nemico o lo deve dedurre sentendolo.

   ── i due prerequisiti che restano ──────────────────────────────
   Camminare non è un ordine: `prendi [x]` e `apri [x]` ci vanno da
   soli, perché toccare una cosa lontana e non vedere succedere niente
   non insegna niente a nessuno. Quello che si può ancora sbagliare —
   e che è la lezione — è l'ORDINE dei gesti: il portone non si apre
   senza la chiave in mano, e chi non ha mai visto qualcuno non sa
   dove sia. Sono prerequisiti di stato, non di posizione.
   ═══════════════════════════════════════════════════════════════════ */
/* le cose passive del campo — porte, oggetti, posti, leve, totem — sono
   `Elemento`: non camminano, e sanno rispondere da sole a un comando.
   Il mondo qui dentro le costruisce e le interroga; il COME si
   comportano sta in `motore/generale/`, non in questo `switch`. */
import { Porta, Oggetto, Posto, Leva, Totem } from './generale/elementi/indice.js'

/* oltre questi passi la scena è in giro a vuoto: si chiude e lo dice */
export const PASSI_MASSIMI = 300
const DANNO = 1
const VERSO = ['nord', 'est', 'sud', 'ovest']   // serve solo a raccontare dove va

/* ── i segnali ──────────────────────────────────────────────────
   Un segnale ha un NOME, non un colore. «nemico in vista» invece di
   «allarme rosso» è il salto da una variabile chiamata x a una
   chiamata nemicoInVista: dare il nome giusto a un concetto è metà
   del programmare. Il colore resta, ma è la vernice del filo che
   unisce chi manda a chi ascolta. */
export const SEGNALI = {
  nemico:  { nome: 'nemico in vista', em: '👁️', col: '#e0554d' },
  libero:  { nome: 'tutto libero',    em: '✅', col: '#3fb872' },
  aperta:  { nome: 'porta aperta',    em: '🚪', col: '#c9853f' },
  aiuto:   { nome: 'aiuto',           em: '🆘', col: '#e8703f' },
  ora:     { nome: 'al mio segnale',  em: '⭐', col: '#f0c04a' },
  viaLibera: { nome: 'via libera',   em: '⚔️', col: '#3fb872' },
  bottino: { nome: 'tesoro trovato',  em: '💰', col: '#b06be0' },
  chiave:  { nome: 'ho la chiave',    em: '🔑', col: '#4a86e8' },
  richiamo: { nome: 'un baccano',    em: '🔔', col: '#e8a33f' },
  fracasso: { nome: 'un fracasso',   em: '💥', col: '#e8703f' },
  /* i due lati: un segnale che dice DOVE è libero, non solo che lo è.
     Colori diversi apposta — la vignetta di chi parla si legge a colpo
     d'occhio, e sono la stessa cosa detta di due posti. */
  tramontana: { nome: 'libero a tramontana', em: '⬆️', col: '#4a86e8' },
  mezzogiorno: { nome: 'libero a mezzogiorno', em: '⬇️', col: '#e8a33f' },
}
export const ilSegnale = k => SEGNALI[k] || { nome: k, em: '📣', col: '#8b97b4' }

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
  prendi:    { et: '🎒', cl: 'azione', nome: 'prendi', grado: 2, accetta: ['oggetto'] },
  apri:      { et: '🔓', cl: 'azione', nome: 'apri', grado: 2, accetta: ['porta'] },
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
  chiudi:    { et: '🔒', cl: 'azione', nome: 'chiudi', grado: 2, accetta: ['porta'] },
  /* ── UN VERBO SOLO PER OGNI CONGEGNO ──
     Una leva e un totem non si dicono in due modi diversi (`tira`,
     `gira`, `accendi` sono stati scartati apposta, §10 del piano):
     `premi` basta per tutti e due, e cosa succede quando arrivi a
     zero — o a `tacche` — lo decide il congegno che lo riceve, non
     questo verbo. Come `apri` e `prendi`, ci si arriva camminando. */
  premi:     { et: '👆', cl: 'azione', nome: 'premi', grado: 2, accetta: ['congegno'] },
  /* `elenco: true` — QUESTO BERSAGLIO NON SI INDICA COL DITO.
     Indicare un nemico sulla mappa vuol dire «quell'orco lì, quello in
     quel punto», e non è quello che si sta scrivendo: un piano si firma
     prima della battaglia, quando l'orco è ancora dove gli pare. Quello
     che si vuole dire è «un orco», cioè la classe — ed è anche la
     stessa cosa che dice la guardia: «smetti quando vedi un orco».
     Perciò il bersaglio si sceglie da un elenco di nomi, dove «gli
     orchi» è una voce come le altre. */
  attacca:   { et: '⚔️', cl: 'azione', nome: 'attacca', grado: 2,
               accetta: ['unita', 'fazione'], elenco: true },
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
  aspetta:   { et: '⏳', cl: 'attesa', nome: 'aspetta che', grado: 2,
               vuoleCond: true, accetta: ['attimo', 'porta'] },
  aspettaDiVedere: { et: '👁', cl: 'attesa', nome: 'aspetta di vedere', grado: 3,
                     accetta: ['unita', 'fazione'] },
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

const clona = x => JSON.parse(JSON.stringify(x))

/* ═══════════ il mondo ═══════════ */

const varianteDi = (livello, variante) => {
  if (variante && typeof variante === 'object') return variante
  const v = (livello.varianti || [])[variante || 0]
  if (!v) throw new Error('variante sconosciuta')
  return v
}
const patch = (base, cambi) => ({ ...base, ...(cambi || {}) })

/* creaMondo COPIA tutto quello che poi si mangia giocando: se giocasse
   sul livello, la seconda partita partirebbe da un campo già mangiato e
   nessuno se ne accorgerebbe finché un bambino non rigioca la tappa. */
export function creaMondo(livello, variante) {
  const v = varianteDi(livello, variante)
  const griglia = livello.griglia
  const h = griglia.length, w = griglia[0].length
  const celle = []
  for (let y = 0; y < h; y++) {
    const riga = []
    for (let x = 0; x < w; x++) riga.push({ muro: griglia[y][x] === '#', porta: null })
    celle.push(riga)
  }
  const porte = {}
  for (const k in (livello.porte || {})) {
    const p = patch(livello.porte[k], (v.porte || {})[k])
    porte[k] = new Porta(k, p)
    celle[p.y][p.x].porta = k
  }
  const posti = {}
  for (const k in (livello.posti || {}))
    posti[k] = new Posto(k, patch(livello.posti[k], (v.posti || {})[k]))
  /* i congegni: una leva scatta al primo `premi`, un totem conta.
     Stessa forma delle porte e dei posti — la variante può toccarne i
     parametri, mai il filo (`collegata`), che è la mappa che decide */
  const leve = {}
  for (const k in (livello.leve || {}))
    leve[k] = new Leva(k, patch(livello.leve[k], (v.leve || {})[k]))
  const totem = {}
  for (const k in (livello.totem || {}))
    totem[k] = new Totem(k, patch(livello.totem[k], (v.totem || {})[k]))
  const m = {
    livello, variante: v.nome || '', ordiniScena: v.ordini || null,
    w, h, celle, porte, posti, leve, totem,
    oggetti: (livello.oggetti || [])
      .map(o => new Oggetto(o.nome, patch(o, (v.oggetti || {})[o.nome]))),
    segnali: [...(livello.segnali || [])],
    unita: livello.unita.map(u0 => {
      const u = patch(u0, (v.unita || {})[u0.id])
      return { ...u, x0: u.x, y0: u.y, vita: u.vita || 3, vitaMax: u.vita || 3,
               vista: u.vista || 0, viva: true, zaino: [], dir: 2, visti: {},
               ordineOra: null, attesa: null }
    }),
    fili: [], ascolti: [], segnaliMandati: [], pendenti: [],
    /* la coda dei congegni: un `premi` che scatta non comanda subito —
       accoda qui, e `passo()` la consegna a fine battito, con lo
       stesso principio dei segnali (`pendenti`, poco sopra) */
    comandiPendenti: [],
    passi: 0, finita: false, vinto: false, motivo: '', colpevole: null,
    eventi: [], traccia: [], versioneMappa: 0, colpi: [], allarmi: [],
    mia: Object.keys(livello.fazioni).find(f => livello.fazioni[f].autore === 'giocatore'),
  }
  m.perId = {}
  m.unita.forEach(u => { m.perId[u.id] = u })
  /* le caselle nominabili: un punto di ronda è una cosa a tutti gli
     effetti, solo che non ha un nome. Si contano una volta sola.
     CI SONO SEMPRE. Prima le apriva `celle: true` del livello, e il
     risultato era che il dito poteva indicare un punto qualsiasi — il
     campo lo accetta da sempre — e poi il piano veniva rifiutato con
     «non è in gioco in questo livello». Il livello continua a decidere
     quali VERBI offrire (`celle: true` è quello che fa comparire la
     ronda), ma dove si può camminare non lo decide più: se il dito lo
     può indicare, l'ordine lo può dire. */
  m.caselle = []
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++)
    if (!celle[y][x].muro) m.caselle.push(x + ',' + y)
  assegnaSigilli(m)
  m.cose = coseDi(m)
  return m
}

const etichetta = (m, k) => ((m.livello.nomi || {})[k]) || k
const vive = m => m.unita.filter(u => u.viva)

/* ── IL SIGILLO SI DERIVA, NON SI DICHIARA ──
   La porta sa già qual è la sua chiave; qui si assegna un colore a ogni
   chiave DISTINTA, nell'ordine in cui compare — e lo stesso colore va
   alla porta e, se esiste come oggetto da raccogliere, alla chiave
   stessa. Chi scrive il livello non deve tenere allineate due
   dichiarazioni, e non può sbagliarsi: è la risposta al problema dei
   lucchetti tutti gialli, che a schermo non si distinguono. */
const SIGILLI = ['rosso', 'blu', 'verde', 'giallo', 'viola', 'arancio']
function assegnaSigilli (m) {
  const colore = {}
  let n = 0
  for (const k in m.porte) {
    const pt = m.porte[k]
    if (!pt.chiave) continue
    if (!colore[pt.chiave]) colore[pt.chiave] = SIGILLI[n++ % SIGILLI.length]
    pt.sigillo = colore[pt.chiave]
  }
  m.oggetti.forEach(o => { if (colore[o.nome]) o.sigillo = colore[o.nome] })
}

/* Quanti dei SUOI sono rimasti sul campo. Non fa perdere la battaglia —
   a volte mandare avanti qualcuno è la mossa giusta — ma costa una
   stella, perché altrimenti l'esca sarebbe gratis e i personaggi
   diventerebbero pezzi di ricambio. */
export const perdute = m => m.unita.filter(u => !u.viva && u.fazione === m.mia).length

/* ── le cose del mondo, ognuna col suo tipo ──
   Il tipo sta nei dati: da lì discende quali verbi la accettano, quali
   condizioni genera, con che icona si vede. Porte, posti e oggetti sono
   `Elemento`: dichiarano da soli tipo e icona, e una cosa nuova di
   quella famiglia non aggiunge più una riga qui — la aggiunge solo se
   è una famiglia NUOVA (come lo erano finora unità, fazioni, segnali). */
function coseDi (m) {
  const c = {}
  const agg = (id, tipo, nome, em) => { if (id != null && !c[id]) c[id] = { id, tipo, nome, em } }
  for (const k in m.porte) agg(k, m.porte[k].tipo, etichetta(m, k), m.porte[k].em)
  for (const k in m.posti) agg(k, m.posti[k].tipo, etichetta(m, k), m.posti[k].em)
  for (const k in m.leve) agg(k, m.leve[k].tipo, etichetta(m, k), m.leve[k].em)
  for (const k in m.totem) agg(k, m.totem[k].tipo, etichetta(m, k), m.totem[k].em)
  m.oggetti.forEach(o => agg(o.nome, o.tipo, etichetta(m, o.nome), o.em))
  m.unita.forEach(u => agg(u.id, 'unita', u.nome || u.id, u.emoji))
  for (const k in m.livello.fazioni) agg(k, 'fazione', etichetta(m, k), '🚩')
  m.segnali.forEach(k => agg(k, 'segnale', ilSegnale(k).nome, ilSegnale(k).em))
  agg('momento', 'attimo', 'un momento', '⏱️')
  return c
}
/* ── le caselle ──
   `"12,10"` è una cosa a tutti gli effetti, solo che non ha un nome — ed
   è esattamente la sua debolezza. Un oggetto lo segui ovunque vada; una
   casella è un numero scritto a mano, e nella scena dopo lì potrebbe
   esserci un muro. Non lo spiega nessuno: si vede. */
/* ── LE AZIONI NON SONO COSE DEL MONDO ──
   Un posto, una porta, un segnale esistono prima che qualcuno scriva un
   piano: stanno nel livello. Un'azione no — la scrive chi gioca, e il
   mondo la conosce solo perché gliela si dice. Perciò le si raccoglie
   dal piano e si registrano qui, e da quel momento `esegui [azione 2]`
   è un ordine come tutti gli altri: un verbo e una cosa che ha un nome.

   Sono di TUTTI, non di chi le ha scritte. Un'azione è una fila di
   ordini, e una fila di ordini la può fare chiunque: chi la chiama la
   esegue con le proprie gambe. Il posto dove è scritta dice solo dove
   la si trova a schermo. */
export function raccogliRoutine (mondo, piano) {
  const R = {}
  const giro = lista => (lista || []).forEach(o => {
    if (eRoutine(o) && o.nome) R[o.nome] = corpoDi(o)
    if (eBlocco(o)) dentroA(o).forEach(giro)
    else if (o && o.allora) giro(o.allora)
  })
  for (const id in (piano || {})) giro(piano[id])
  mondo.routine = R
  /* ── E DIVENTANO COSE COME LE ALTRE ──
     Non un elenco a parte da consultare con un «se è un'azione allora»
     sparso per il motore e per la vista: entrano in `m.cose`, che è il
     registro di tutto quello che ha un nome. Da qui in poi nessuno deve
     sapere che sono speciali — `laCosa`, i complementi di un verbo, la
     cassetta e gli elenchi dei bersagli funzionano già. */
  for (const k of Object.keys(mondo.cose || {}))
    if (mondo.cose[k].tipo === 'routine') delete mondo.cose[k]
  for (const k in R) mondo.cose[k] = { id: k, tipo: 'routine', nome: k, em: '▶️' }
  return R
}
const CASELLA = /^(\d+),(\d+)$/
export function laCosa (m, id) {
  const c = (m.cose || {})[id]
  if (c) return c
  /* Una casella libera vale SEMPRE, senza che il livello debba dichiarare
     niente: se il dito può indicarla, l'ordine deve poterla dire. Prima
     serviva un `celle: true` nel livello, e il risultato era che
     l'interfaccia lasciava comporre «vai a 2,10» e poi il motore
     rispondeva «qui non c'è niente che si chiami così» — cioè il gioco
     dava torto a chi aveva fatto esattamente quello che gli era stato
     detto di fare. */
  const q = CASELLA.exec(id || '')
  if (!q) return null
  const x = +q[1], y = +q[2]
  if (!dentro(m, x, y) || m.celle[y][x].muro) return null
  return { id, tipo: 'cella', nome: `la casella (${x},${y})`, em: '⬚', x, y }
}

/* la lista delle cose CON UN NOME che il livello mette in gioco: il
   livello può restringerla, ed è così che si dosa la combinatoria per
   chi ha sei anni. Quello che non è in elenco esiste sul campo ma non
   si nomina. Le caselle non stanno qui: non hanno un nome, e a nessuno
   si chiede di sceglierle da un elenco. */
const nominabili = m => {
  const suoi = (m.livello.complementi || Object.keys(m.cose)).filter(k => m.cose[k])
  /* le AZIONI non passano dalla manopola del livello: quando il livello
     è stato scritto non esistevano, le ha scritte chi gioca adesso.
     Sono l'unica cosa nominabile che non viene dal mondo. */
  const azioni = Object.keys(m.routine || {})
  return azioni.length ? [...new Set([...suoi, ...azioni])] : suoi
}

/* le cose con un nome che quel verbo accetta */
export function nomiDi (mondo, verbo) {
  const V = VERBI[verbo]
  if (!V || !mondo || !mondo.cose) return []
  return nominabili(mondo).filter(k => V.accetta.includes(mondo.cose[k].tipo))
}

/* quello che un verbo può davvero prendere, qui: i nomi in gioco e —
   se le accetta — tutte le caselle libere. */
export function complementiDi (mondo, verbo) {
  const V = VERBI[verbo]
  if (!V || !mondo || !mondo.cose) return []
  const nomi = nomiDi(mondo, verbo)
  return V.accetta.includes('cella') ? [...nomi, ...mondo.caselle] : nomi
}
/* ── QUALE VERBO COMPARE IN CASSETTA ──
   Non è la stessa domanda di «cosa può prendere». Le caselle libere
   valgono sempre come bersaglio, ma se bastassero a far comparire un
   verbo la ronda spunterebbe in ogni livello, primo compreso: un verbo
   che vive SOLO di caselle si offre dove il livello lo dichiara
   (`celle: true`), gli altri si offrono se hanno almeno una cosa da
   nominare. Meglio una cassetta più piccola di un verbo che non porta
   da nessuna parte. */
/* ── QUANDO UN VERBO SI OFFRE ──
   Quando qui c'è qualcosa da mordere, e «qualcosa» dipende da cosa
   chiede: chi vuole una COSA si offre se quella cosa ha un nome in
   gioco; chi vive di caselle solo dove il livello le apre; chi vuole
   una DOMANDA (`aspetta che…`) si offre dove una domanda si può fare.
   Tre righe per la stessa regola, non tre eccezioni. */
export const verbiDi = mondo => Object.keys(VERBI).filter(v =>
  (!mondo.livello.verbi || mondo.livello.verbi.includes(v)) &&
  (nomiDi(mondo, v).length ||
   (mondo.livello.celle && VERBI[v].accetta.includes('cella')) ||
   (VERBI[v].vuoleCond && condizioniDi(mondo).length)))

/* ── CHI SA COSA ──
   Il filtro ha due dimensioni: verbo × tipo (sopra) e verbo × CHI LO
   ESEGUE (qui). Un'unità dichiara nei dati cosa sa fare (`sa: […]`);
   chi non lo dichiara sa tutto quello che il livello offre. Il
   cavaliere è dentro un'armatura: combatte e aspetta, ma non fruga per
   terra e non scassina. Serve poco come regola in più, serve molto
   come RAGIONE per coordinarsi. */
const saFare = (u, v) => !u || !u.sa || u.sa.includes(v)
/* ── UN SEGNALE SI DICE A QUALCUNO ──
   `suona` e `quando senti` sono i due capi dello stesso filo, e da soli
   sul campo il filo non ha l'altro capo: la cassetta offriva «quando
   senti» a un'unità che era l'unica cosa viva della mappa, e la
   domanda «quale segnale» si apriva su un elenco vuoto.
   Chi manda però non dev'essere per forza dei nostri — un orco che
   grida «aiuto» è un mittente a tutti gli effetti, e origliarlo è una
   mossa. Perciò la domanda non è «ho due unità mie», è «c'è qualcun
   altro là fuori». */
const SEGNALE = { suona: 1, quando: 1, parla: 1 }
const conChiParlare = (mondo, id) => mondo.unita.some(u => u.id !== id && u.viva)
export const verbiPer = (mondo, id) =>
  verbiDi(mondo).filter(v => saFare(mondo.perId[id], v) &&
                             (!SEGNALE[v] || conChiParlare(mondo, id)))
export const nonSa = (mondo, id) => {
  const u = mondo.perId[id]
  return u && u.sa ? verbiDi(mondo).filter(v => !saFare(u, v)) : []
}
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
export const scusaDi = (mondo, id, v) => nonRiesce(mondo && mondo.perId[id], v)

/* ═══════════ le condizioni ═══════════
   Percezione e stato, mai numeri astratti. Ogni condizione nomina UNA
   cosa, con lo stesso `complemento` degli ordini: così la guardia si
   sceglie dalla stessa lista da cui si sceglie il bersaglio. */
export function valuta (m, io, c) {
  if (!c) return true
  const v = grezza(m, io, c)
  return c.non ? !v : v
}
function grezza (m, io, c) {
  const chi = c.complemento
  switch (c.cond) {
    case 'vedi': return vive(m).some(u => u !== io && combacia(u, chi) && vede(m, io, u))
    case 'vivo': return vive(m).some(u => combacia(u, chi))
    case 'hai': {
      const u = c.chi ? m.perId[c.chi] : io
      return !!(u && u.zaino.includes(chi))
    }
    case 'aperta': return !!(m.porte[chi] && m.porte[chi].chiedi('aperta'))
    case 'premuto': { const e = elementoConId(m, chi); return !!(e && e.chiedi('premuto')) }
    case 'almeno': {
      const e = elementoConId(m, chi)
      const v = e ? e.chiedi('almeno') : null
      return v != null && v >= (c.n || 0)
    }
    case 'segnale': return m.segnaliMandati.includes(chi)
    case 'qui': {
      const u = c.chi ? m.perId[c.chi] : io
      const p = m.posti[chi]
      return !!(u && u.viva && p && u.x === p.x && u.y === p.y)
    }
    case 'sempre': return true
    default: return false
  }
}
/* il complemento di una condizione può essere l'id di un'unità o il
   nome di una fazione: «vedi l'orco» e «vedi gli orchi» */
const combacia = (u, chi) => u.viva && (u.id === chi || u.fazione === chi)

/* le condizioni che il livello offre alla guardia `se`. Non si
   inventano: escono dalle stesse cose da cui escono i complementi. Un
   livello può dettarle a mano quando la combinatoria è troppa. */
export function condizioniDi (mondo, io) {
  if (mondo.livello.condizioni) return mondo.livello.condizioni
  const out = []
  for (const k of nominabili(mondo)) {
    const x = mondo.cose[k]
    if (!x || k === io) continue
    const due = cond => out.push({ ...cond }, { ...cond, non: true })
    /* quello che vede adesso, quello che ha addosso, i segnali che le
       sono arrivati. Lo stato di una porta dall'altra parte della mappa
       non è percezione: se serve saperlo, qualcuno deve dirlo. */
    if (x.tipo === 'unita' || x.tipo === 'fazione') due({ cond: 'vedi', complemento: k })
    else if (x.tipo === 'oggetto') due({ cond: 'hai', complemento: k })
    else if (x.tipo === 'segnale') due({ cond: 'segnale', complemento: k })
  }
  return out
}
export const chiaveCond = c => c
  ? [c.cond, c.complemento || '', c.chi || '', c.non ? '!' : ''].join('|') : ''

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
}
/* quello che si può chiedere qui, raggruppato per verbo di condizione.
   Esce dalle stesse cose da cui escono i complementi — e se il livello
   detta le sue condizioni, si raggruppano quelle: la manopola della
   difficoltà resta al livello. */
export function condCompone (mondo, io) {
  const out = []
  for (const c of condizioniDi(mondo, io)) {
    if (!c || !c.cond || c.cond === 'sempre' || !c.complemento) continue
    let g = out.find(x => x.cond === c.cond)
    if (!g) out.push(g = { cond: c.cond, nome: (CONDIZIONI[c.cond] || {}).nome || c.cond,
                           em: (CONDIZIONI[c.cond] || {}).em || '❓', cose: [] })
    if (!g.cose.includes(c.complemento)) g.cose.push(c.complemento)
  }
  return out
}

const valutabile = (mondo, c) => !!(c && c.cond && (
  c.cond === 'sempre' || (c.complemento && !!mondo.cose[c.complemento])))

/* ═══════════ la mappa ═══════════ */
const dentro = (m, x, y) => x >= 0 && y >= 0 && x < m.w && y < m.h
export function libera (m, x, y) {
  if (!dentro(m, x, y)) return false
  const c = m.celle[y][x]
  if (c.muro) return false
  if (c.porta && !m.porte[c.porta].aperta) return false
  return true
}
/* Le unità NON si bloccano fra loro: due sulla stessa cella sono
   ammesse (il disegno le sfalsa). Bloccarsi genererebbe stalli finti
   che non hanno niente da insegnare. */

/* BFS: la mappa delle distanze da una cella. È il «sa già camminare». */
export function distanze (m, x0, y0) {
  const d = new Int16Array(m.w * m.h).fill(-1)
  d[y0 * m.w + x0] = 0
  const coda = [[x0, y0]]
  const P = [[0, -1], [1, 0], [0, 1], [-1, 0]]
  let testa = 0
  while (testa < coda.length) {
    const [x, y] = coda[testa++], q = d[y * m.w + x]
    for (const [dx, dy] of P) {
      const nx = x + dx, ny = y + dy
      if (!libera(m, nx, ny)) continue
      if (d[ny * m.w + nx] !== -1) continue
      d[ny * m.w + nx] = q + 1
      coda.push([nx, ny])
    }
  }
  return d
}
function mappaDi (m, u) {
  const k = u.x + ',' + u.y + ',' + m.versioneMappa
  if (u._mk !== k) { u._mk = k; u._md = distanze(m, u.x, u.y) }
  return u._md
}
/* un passo verso (bx,by): si va a ritroso sulla mappa di distanze del
   bersaglio */
function passoVerso (m, u, bx, by) {
  const d = distanze(m, bx, by)
  const qui = d[u.y * m.w + u.x]
  if (qui <= 0) return null
  const P = [[0, -1], [1, 0], [0, 1], [-1, 0]]
  for (const [dx, dy] of P) {
    const nx = u.x + dx, ny = u.y + dy
    if (libera(m, nx, ny) && d[ny * m.w + nx] === qui - 1) return [nx, ny]
  }
  return null
}
/* «vedere» è a distanza di cammino: un muro in mezzo toglie la vista
   senza bisogno di tracciare raggi */
export function vede (m, io, altro) {
  if (!io) return false
  const d = mappaDi(m, io)[altro.y * m.w + altro.x]
  return d >= 0 && d <= (io.vista || 0)
}
const aPortata = (u, t) => !!t && Math.abs(u.x - t.x) + Math.abs(u.y - t.y) <= 1
/* Una porta CHIUSA non si attraversa, quindi la mappa delle distanze non
   ci arriva sopra: la si vede se si vede una casella che le sta
   accanto. Senza questo, chi è appoggiato al portone «non lo vede». */
function vedePorta (m, io, p) {
  const d = mappaDi(m, io), v = io.vista || 0
  return [[p.x, p.y], [p.x + 1, p.y], [p.x - 1, p.y], [p.x, p.y + 1], [p.x, p.y - 1]]
    .some(([x, y]) => dentro(m, x, y) && d[y * m.w + x] >= 0 && d[y * m.w + x] <= v)
}

/* ═══════════ il piano ═══════════
   `piano` è { idUnità: [ordini] }. Il piano completo è quello scritto
   dal livello più quello del giocatore, che ha l'ultima parola sulle
   sue unità. */
export function pianoCompleto (livello, delGiocatore) {
  const p = {}
  for (const nome in livello.fazioni)
    for (const id in (livello.fazioni[nome].ordini || {}))
      p[id] = clona(livello.fazioni[nome].ordini[id])
  for (const id in (delGiocatore || {})) p[id] = clona(delGiocatore[id])
  return p
}
/* le unità di cui il giocatore firma gli ordini: quelle della sua
   fazione che il livello non ha già istruito */
export function mieUnita (livello) {
  const out = []
  for (const nome in livello.fazioni) {
    const fz = livello.fazioni[nome]
    if (fz.autore !== 'giocatore') continue
    livello.unita.filter(u => u.fazione === nome && !(fz.ordini || {})[u.id])
      .forEach(u => out.push(u.id))
  }
  return out
}
/* le unità di cui il giocatore può LEGGERE gli ordini scritti da altri */
export function altruiUnita (livello) {
  const out = []
  for (const nome in livello.fazioni)
    for (const id in (livello.fazioni[nome].ordini || {})) out.push(id)
  return out
}
export const pianoVuoto = livello =>
  Object.fromEntries(mieUnita(livello).map(id => [id, []]))
/* quanti ordini pesa un piano: quelli dentro un `quando` e quelli dentro
   i rami di una condizione contano, se no nascondere una fila dentro un
   evento o dentro un bivio sarebbe gratis. E il blocco stesso pesa uno:
   decidere è una cosa che hai scritto tu. */
export function contaOrdini (piano) {
  let n = 0
  const conta = l => (l || []).forEach(o => {
    n++
    if (eBlocco(o)) { dentroA(o).forEach(conta); return }
    if (o && o.allora) conta(o.allora)
  })
  for (const id in (piano || {})) conta(piano[id])
  return n
}
/* tutte le voci di una fila, blocchi compresi e con dentro i loro rami:
   il validatore le guarda una per una */
const tutteLeVoci = l => (l || []).flatMap(o => eBlocco(o)
  ? [o, ...dentroA(o).flatMap(tutteLeVoci)]
  : [o, ...tutteLeVoci(o && o.allora)])

/* ── IL RIFIUTO ──
   Un ordine che l'interfaccia non lascerebbe comporre può arrivare lo
   stesso: da un piano salvato ieri, da un livello ritoccato. Il motore
   non lo esegue e poi spiega — rifiuta il piano prima di cominciare, e
   dice quali ordini non stanno in piedi. */
export function guaiDi (mondo, piano) {
  const out = []
  /* le azioni del piano si registrano PRIMA di guardarlo: `esegui
     [azione 2]` è un ordine buono solo se azione 2 esiste, e chi la
     dichiara è il piano stesso. Chiunque validi — il gioco mentre si
     scrive, il test prima di giocare — parte da qui. */
  raccogliRoutine(mondo, piano)
  for (const id in (piano || {})) {
    const u = mondo.perId[id]
    if (!u) { out.push({ unita: id, motivo: `«${id}» non è sul campo` }); continue }
    for (const o of tutteLeVoci(piano[id])) {
      /* ── un blocco non è un ordine ──
         Ha una condizione e due rami, e si controlla per quello che è:
         la condizione deve parlare di qualcosa che c'è, i rami devono
         essere liste, e dentro un ramo non ci va né un altro blocco né
         un `quando` — quello apre un piano nuovo, e un piano nuovo non
         sta dentro un bivio. */
      if (eCondizione(o)) {
        const dove = `${id}: condizione`
        if (!valutabile(mondo, o.cond))
          out.push({ unita: id, ordine: o,
                     motivo: `${dove} — la condizione parla di una cosa che non c'è` })
        for (const r of ['vero', 'falso'])
          if (o[r] !== undefined && !Array.isArray(o[r]))
            out.push({ unita: id, ordine: o,
                       motivo: `${dove} — il ramo «${r}» non è una lista di ordini` })
        const dentro = [...ramoDi(o, 'vero'), ...ramoDi(o, 'falso')]
        /* NESSUN BLOCCO dentro un ramo, non solo nessuna condizione. Il
           controllo guardava solo i bivi, e un ciclo infilato in un ramo
           passava la validazione per poi essere SALTATO in partita come
           un ordine senza verbo: il piano sembrava buono, la scena
           faceva finta di niente e il bambino non poteva capire perché.
           Chi ha bisogno di un secondo blocco lì dentro scrive
           un'azione e la chiama. */
        if (dentro.some(eBlocco))
          out.push({ unita: id, ordine: o,
                     motivo: `${dove} — dentro un ramo non ci va un altro blocco: ` +
                             'scrivi un\'azione e chiamala con «esegui»' })
        if (dentro.some(q => q && q.verbo === 'quando'))
          out.push({ unita: id, ordine: o,
                     motivo: `${dove} — dentro un ramo non ci va un «quando senti»: ` +
                             'quello è un piano che parte da capo, e sta accanto agli altri' })
        continue
      }
      /* ── l'azione ──
         Una definizione, non un ordine: sta accanto alla fila, ha un
         nome e una lista dentro. Le regole sono due, e sono le stesse
         di tutti gli altri blocchi: dentro non ci va un «quando senti»
         (quello è un piano che parte da sé, e non si nasconde dentro
         una chiamata) né un'altra definizione di azione — le azioni si
         CHIAMANO fra loro, non si contengono. */
      if (eRoutine(o)) {
        const dove = `${id}: azione`
        if (!o.nome) out.push({ unita: id, ordine: o, motivo: `${dove} — senza nome non si può chiamare` })
        if (o.corpo !== undefined && !Array.isArray(o.corpo))
          out.push({ unita: id, ordine: o, motivo: `${dove} — il corpo non è una lista di ordini` })
        const dentro = corpoDi(o)
        if (dentro.some(eRoutine))
          out.push({ unita: id, ordine: o,
                     motivo: `${dove} — dentro un'azione non se ne scrive un'altra: si chiama` })
        /* un «quando senti» DENTRO un'azione invece ci sta, ed è una
           cosa che serve: l'ascolto si arma quando l'azione viene
           chiamata, cioè «da adesso in poi ascolto anche questo». È il
           modo di non sentire un segnale prima di essere nel punto in
           cui quel segnale vuol dire qualcosa. Dentro il ramo di un
           bivio resta vietato: lì un piano che parte da capo non ci
           sta, perché il ramo è una strada, non un posto. */
        continue
      }
      /* ── il ciclo ──
         Una lista di ordini e un'uscita. Le regole sono le stesse dei
         rami: dentro non ci va un altro blocco (un ciclo dentro un
         ciclo non lo si legge più) né un «quando senti», che è un piano
         a parte. E l'uscita non è facoltativa: senza, il giro non
         finisce mai e gli ordini dopo non partono. */
      if (eRipeti(o)) {
        const dove = `${id}: ripeti`
        if (o.corpo !== undefined && !Array.isArray(o.corpo))
          out.push({ unita: id, ordine: o, motivo: `${dove} — il corpo non è una lista di ordini` })
        if (!valutabile(mondo, o.finche))
          out.push({ unita: id, ordine: o,
                     motivo: `${dove} — senza «smetti quando» è un giro che non finisce mai` })
        const dentro = corpoDi(o)
        if (dentro.some(eBlocco))
          out.push({ unita: id, ordine: o, motivo: `${dove} — dentro un ciclo non ci va un altro blocco` })
        if (dentro.some(q => q && q.verbo === 'quando'))
          out.push({ unita: id, ordine: o,
                     motivo: `${dove} — dentro un ciclo non ci va un «quando senti»` })
        continue
      }
      if (o && o.blocco)
        { out.push({ unita: id, ordine: o, motivo: `${id}: «${o.blocco}» non è un blocco` }); continue }
      const V = VERBI[o && o.verbo]
      const dove = `${id}: ${o && o.verbo}`
      if (!V) { out.push({ unita: id, ordine: o, motivo: `${dove} — non è un verbo` }); continue }
      /* un'attesa con la domanda non ha bersaglio: si controlla la
         domanda e si passa oltre */
      if (V.vuoleCond && o.cond) {
        if (!valutabile(mondo, o.cond))
          out.push({ unita: id, ordine: o,
                     motivo: `${dove} — la domanda parla di una cosa che non c'è` })
        continue
      }
      const C = laCosa(mondo, o.complemento)
      if (!C) {
        out.push({ unita: id, ordine: o, motivo: o.complemento
          ? `${dove} «${o.complemento}» — qui non c'è niente che si chiami così`
          : `${dove} — questo ordine non dice su cosa` })
        continue
      }
      for (const q of (o.punti || []))
        if (!complementiDi(mondo, o.verbo).includes(q))
          out.push({ unita: id, ordine: o, motivo: `${dove} — il punto «${q}» non è sulla mappa` })
      if (!V.accetta.includes(C.tipo))
        out.push({ unita: id, ordine: o, motivo: `${dove} — «${V.nome}» non prende ${C.tipo} («${C.nome}»)` })
      else if (!complementiDi(mondo, o.verbo).includes(o.complemento))
        out.push({ unita: id, ordine: o, motivo: `${dove} — «${C.nome}» non è in gioco in questo livello` })
      if (!saFare(u, o.verbo))
        out.push({ unita: id, ordine: o, motivo: `${dove} — ${u.nome || id} non sa «${V.nome}»` })
      if (o.finche && !valutabile(mondo, o.finche))
        out.push({ unita: id, ordine: o, motivo: `${dove} — la condizione parla di una cosa che non c'è` })
      /* UN ORDINE NON DECIDE. La guardia `se` non esiste più: chi deve
         scegliere fra due strade scrive un blocco condizione, e le due
         cose non si mescolano più in una riga. */
      if (o.se)
        out.push({ unita: id, ordine: o,
                   motivo: `${dove} — un ordine non porta una condizione addosso: ` +
                           'per scegliere fra due strade serve un blocco condizione' })
      /* l'uscita obbligatoria: un giro senza uscita non finisce mai */
      if (V.vuoleFinche && !valutabile(mondo, o.finche))
        out.push({ unita: id, ordine: o,
                   motivo: `${dove} — «${V.nome}» senza «smetti quando» è un giro che non finisce mai` })
    }
  }
  return out
}

/* ── QUELLO CHE MANCA A UN ORDINE ──
   Non è un guasto di chi ha scritto il livello: è un ordine che il
   bambino sta ancora scrivendo. Serve all'interfaccia per segnare la
   riga e per dire, invece di far partire una scena che non finirà,
   che cosa manca. Una frase sola, in seconda persona. */
export function manca (mondo, o) {
  /* un blocco condizione: gli manca la domanda, o gli manca da dire
     cosa fare. Un ramo vuoto è legittimo — vuol dire «in quel caso non
     fare niente» — ma tutti e due vuoti no: quel blocco non fa niente
     in nessuno dei due casi, e allora non è una decisione. */
  if (eCondizione(o)) {
    if (!valutabile(mondo, o.cond)) return 'la domanda della condizione non è finita'
    if (!ramoDi(o, 'vero').length && !ramoDi(o, 'falso').length)
      return 'i due rami sono vuoti: metti almeno un ordine in uno dei due'
    return ''
  }
  if (eRipeti(o)) {
    if (!corpoDi(o).length) return 'il ciclo è vuoto: mettici dentro almeno un ordine'
    if (!valutabile(mondo, o.finche))
      return 'manca lo «smetti quando»: senza, il giro non finisce mai e gli ordini dopo non partono'
    return ''
  }
  const V = VERBI[o && o.verbo]
  if (!V) return ''
  /* chi vuole una domanda è finito quando la domanda c'è, e non gli si
     chiede nessun bersaglio: la sua «cosa» è la domanda. (La vecchia
     forma con il complemento — «aspetta [il portone]» — resta buona.) */
  if (V.vuoleCond) {
    if (valutabile(mondo, o.cond)) return ''
    if (!laCosa(mondo, o.complemento)) return 'manca la domanda: cosa aspetti che succeda?'
  }
  if (V.vuoleFinche && !valutabile(mondo, o.finche))
    return 'manca il «smetti quando»: senza, il giro non finisce mai e gli ordini dopo non partono'
  if (o.finche && !valutabile(mondo, o.finche)) return 'la domanda dello «smetti quando» non è finita'
  if (!laCosa(mondo, o.complemento)) return 'manca il bersaglio'
  return ''
}

/* ═══════════ avviare la scena ═══════════ */
export function avvia (mondo, piano) {
  const m = mondo
  m.piano = piano || {}
  /* le azioni scritte nel piano diventano cose che si possono nominare:
     da qui in poi `esegui [azione 2]` sa dove andare a leggere */
  raccogliRoutine(m, m.piano)
  /* ── UNA SCENA PUÒ AVERE IL SUO PIANO NEMICO ──
     Le varianti finora spostavano solo le cose: dove sta l'orco, dove
     la chiave. Ma «da che parte entra» non è una posizione — è un
     ORDINE, e senza questo il piano nemico era per forza lo stesso in
     tutte le scene: se l'orco sfonda la porta di ponente lo sfonda
     sempre, e non c'è più niente da indovinare. Una variante può
     riscrivere gli ordini di chi non è tuo (`ordini: { orco: [...] }`),
     e per il resto del motore non cambia niente: sono ordini come
     tutti gli altri, si leggono nel registro e si spiano con 🕵.
     Le unità del giocatore non si toccano mai: quelle le comandi tu. */
  const scena = m.ordiniScena
  if (scena) for (const id in scena) {
    const u = m.perId[id]
    if (u && u.fazione !== m.mia) m.piano[id] = clona(scena[id])
  }
  m.passi = 0; m.finita = false; m.vinto = false; m.motivo = ''; m.colpevole = null
  m.segnaliMandati = []; m.pendenti = []; m.comandiPendenti = []; m.eventi = []; m.traccia = []
  m.versioneMappa = 0; m.ascolti = []; m.colpi = []; m.allarmi = []
  /* rigiocare la scena: ogni elemento si rimette com'era da sé — è il
     patto di `azzera()`, e un elemento nuovo non può dimenticarselo */
  for (const k in m.porte) m.porte[k].azzera()
  for (const k in m.posti) m.posti[k].azzera()
  for (const k in m.leve) m.leve[k].azzera()
  for (const k in m.totem) m.totem[k].azzera()
  m.oggetti.forEach(o => o.azzera())
  m.unita.forEach(u => {
    u.x = u.x0; u.y = u.y0; u.vita = u.vitaMax; u.viva = true; u.zaino = []
    u.ordineOra = null; u._mk = null; u.dir = 2; u.visti = {}; u.attesa = null
    u.gridato = false
  })
  m.fili = m.unita.map(u => nuovoFilo(u.id, m.piano[u.id] || [], 'principale'))
  return m
}
const nuovoFilo = (unita, ordini, nome) => ({
  unita, ordini: ordini || [], nome: nome || 'evento', i: 0, nuovo: true,
  st: {}, finito: false, ordine: null,
  /* ── LA PILA DELLE CHIAMATE ──
     `esegui [azione 2]` non fa partire un secondo personaggio: fa
     scendere QUESTO dentro un'altra fila. Qui si tiene da parte dov'era
     — quale fila, a che punto, dentro quale ramo — per poterci tornare
     quando l'azione finisce. È l'unica pila del gioco, e c'è solo
     perché un'azione può chiamarne un'altra (e sé stessa). */
  pila: [],
  /* dentro quale ramo di un blocco condizione e a che punto di quel ramo:
     null tutte e due quando si sta nella fila di fuori */
  ramo: null, rj: null, rnuovo: false,
})

/* ═══════════ DI CHI SI PUÒ DIRE CHE HA SBAGLIATO ═══════════
   Il VERDETTO di una partita persa deve parlare solo di cose che il
   bambino può cambiare. Un'unità del livello non la comanda lui:
   «l'orco è in attesa di vedere l'eroe e non succederà mai» è vero
   come descrizione e inutile come diagnosi — chi legge non sa cosa
   farci. Lo stesso fatto detto dalla parte della leva diventa «nessuno
   si è mai fatto vedere dall'orco», e la leva è il piano.

   Nel registro l'orco resta soggetto di quello che fa: lì si racconta
   quello che si è visto, ed è giusto così. Qui si giudica, e chi non
   prende ordini dal bambino può comparire solo come OGGETTO di quello
   che è mancato — mai come colpevole. */
const mio = (m, id) => { const u = m.perId[id]; return !!u && u.fazione === m.mia }

/* quello che il piano non ha fatto, letto dal filo di un'unità che il
   bambino non comanda */
function mancato (m, f) {
  return ALLA(mancato0(m, f))
}
function mancato0 (m, f) {
  const u = m.perId[f.unita]
  const chi = (u && (u.nome || u.id)) || 'qualcuno'
  const o = f.ordine || {}
  const C = laCosa(m, o.complemento)
  const N = C ? C.nome : (o.complemento || 'qualcosa')
  switch (o.verbo) {
    case 'aspettaDiVedere':
    case 'attacca':
      return `nessuno si è mai fatto vedere da ${chi}, che sta ancora aspettando`
    case 'aspetta':
      return `nessuno ha mandato «${N}», che ${chi} sta ancora aspettando`
    case 'vai': case 'prendi': case 'apri':
      return `la strada verso ${N} è rimasta chiusa, e da lì non si è mosso più niente`
    default:
      return 'non è più successo niente, e il piano è finito lì'
  }
}

function fine (m, vinto, motivo, colpevole) {
  m.finita = true; m.vinto = vinto; m.motivo = motivo
  m.colpevole = colpevole || m.colpevole || null
  /* Perdere senza un ordine colpevole non aiuta nessuno: si indica
     l'ordine che qualcuno stava eseguendo in quel momento. È il
     fotogramma della rottura — e si cerca solo fra i TUOI, perché un
     ordine che non hai scritto non è un ordine che puoi correggere. */
  if (!vinto && !m.colpevole) {
    const miei = m.unita.filter(z => z.fazione === m.mia)
    const u = miei.find(z => !z.viva && z.ordineOra) || miei.find(z => z.ordineOra)
    if (u && u.ordineOra) m.colpevole = { unita: u.id, i: u.ordineOra.i, filo: u.ordineOra.filo,
                                          ramo: u.ordineOra.ramo || null,
                                          j: u.ordineOra.j ?? null }
    const r = [...m.traccia].reverse().find(x => x.esito === 'no' && mio(m, x.unita))
    if (r) m.colpevole = { unita: r.unita, i: r.i, filo: r.filo, ramo: r.ramo || null,
                           j: r.j ?? null }
  }
  m.eventi.push(vinto ? 'vinta' : 'persa')
}

/* ═══════════ IL RUMORE ═══════════
   Il grido non è un ordine: nessuno l'ha scritto, sta nella scheda
   dell'unità (`grida`). Ma è un `suona` a tutti gli effetti — stessa
   coda, stesso segnale, stessa riga nel registro — e chi lo sente
   (`accorre`) fa un `vai [lì]`. Un solo sistema, non due. */
function chiamaAllarme (m, u, perche) {
  const seg = u && u.grida
  if (!seg || !u.viva || u.gridato) return
  /* UNA VOLTA SOLA. Un grido che riparte a ogni colpo trascinerebbe
     mezza mappa avanti e indietro, e soprattutto renderebbe la
     reazione imprevedibile — che è l'esatto contrario di quello che
     serve perché il diversivo sia una mossa e non una speranza. */
  u.gridato = true
  m.pendenti.push({ seg, da: u.id, x: u.x, y: u.y, rumore: true })
  m.eventi.push('allarme')
  m.allarmi.push({ x: u.x, y: u.y, seg, da: u.id })
  const filo = { nome: 'rumore', i: 0, ordine: { verbo: 'suona', complemento: seg } }
  nota(m, filo, u, 'fa',
       perche === 'colpito' ? `mi stanno addosso: chiamo «${ilSegnale(seg).nome}»`
                            : `ho visto qualcuno: chiamo «${ilSegnale(seg).nome}»`,
       'chiama aiuto')
}
/* chi accorre lascia il posto: i suoi ordini si SOSPENDONO — non si
   buttano — e riprendono quando è arrivato. È lì che sta la falla che
   un piano può sfruttare: non nel fatto che se ne vada, ma in quanto
   tempo ci mette ad andare e a tornare. */
function accorri (m, u, p) {
  const meta = p.x + ',' + p.y
  const gia = m.fili.find(f => f.unita === u.id && f.reazione && !f.finito)
  if (gia) {
    gia.ordini = [{ verbo: 'vai', complemento: meta }]
    gia.i = 0; gia.nuovo = true; gia.st = {}; gia.ramo = null; gia.rj = null
    return
  }
  m.fili.forEach(z => { if (z.unita === u.id && !z.finito) z.sospeso = true })
  const f = nuovoFilo(u.id, [{ verbo: 'vai', complemento: meta }],
                      `accorre a «${ilSegnale(p.seg).nome}»`)
  f.reazione = true
  m.fili.push(f)
}
const riprendi = (m, u) => m.fili.forEach(z => { if (z.unita === u.id) z.sospeso = false })

/* quello che il livello dichiara, detto a parole: serve alla scheda di
   un'unità, perché una reazione che non si può leggere non è una
   regola del mondo, è una sorpresa */
export function reazioniDi (mondo, id) {
  const u = mondo && mondo.perId[id]
  if (!u) return []
  const out = []
  if (u.grida) out.push({ che: 'grida', segnale: u.grida, em: '📣',
    testo: `se lo attaccano, o se vede un avversario, chiama «${ilSegnale(u.grida).nome}»` })
  if (u.accorre) out.push({ che: 'accorre', segnale: u.accorre, em: '🏃',
    testo: `quando sente «${ilSegnale(u.accorre).nome}» lascia il posto e corre dov'è partito` })
  return out
}

/* ═══════════ un passo ═══════════ */
export function passo (m) {
  if (m.finita) return
  m.eventi = []
  m.colpi = []; m.allarmi = []
  if (m.passi >= PASSI_MASSIMI) {
    /* e se qualcuno dei tuoi è fermo ad aspettare, la scena finisce
       dicendo COSA aspettava: «gira a vuoto» è vero per un ciclo che
       non esce, ma su un'attesa che non arriverà mai è una diagnosi
       che non si può usare */
    const fermo = m.unita.find(u => u.viva && u.fazione === m.mia && u.attesa)
    fine(m, false, fermo
      ? `La scena non finisce più: ${fermo.nome || fermo.id} è ancora lì — «${fermo.attesa}».`
      : 'La scena non finisce più: qualcuno gira a vuoto.')
    return
  }
  m.passi++

  let agisce = false
  for (const f of m.fili.slice()) {
    if (m.finita) break
    if (f.finito || f.sospeso) continue
    const u = m.perId[f.unita]
    if (!u.viva) { f.finito = true; f.ordine = null; continue }
    const r = passoFilo(m, f, u)
    if (f.reazione && f.finito) riprendi(m, u)
    if (r !== 'attesa') agisce = true
  }

  /* ── CHI HA FINITO, HA FINITO ADESSO ──
     Una fila arrivata in fondo si marcava conclusa solo al battito
     dopo, quando qualcuno tornava a guardarla. Un battito di niente,
     tranne che nell'unico momento in cui conta: i segnali si
     consegnano qui sotto, e un'unità che ha appena suonato come ultimo
     ordine risultava «ancora impegnata» — così non poteva **lanciarsi
     da sé una seconda routine**, che è il modo con cui in questo gioco
     si scrive un sottoprogramma (`suona [nome]` di qua, `quando senti
     [nome]` di là, tutti e due suoi). */
  for (const f of m.fili)
    if (!f.finito && f.i >= f.ordini.length) { f.finito = true; f.ordine = null }

  /* i segnali partono a fine passo: così un segnale mandato adesso si
     sente al giro dopo, uguale per tutti. E si dice sempre CHI si
     sveglia: un salto che non si vede è la parte peggiore del goto. */
  if (m.pendenti.length) {
    agisce = true
    const partiti = m.pendenti; m.pendenti = []
    for (const p of partiti) {
      if (!m.segnaliMandati.includes(p.seg)) m.segnaliMandati.push(p.seg)
      const svegli = [], occupati = []
      for (const a of m.ascolti) {
        if (a.segnale !== p.seg) continue
        const u = m.perId[a.unita]
        if (!u || !u.viva) continue
        /* ── PARLA CONSEGNA SOLO A CHI SI VEDE, ADESSO ──
           `diretto` viene da `parla` (non da `suona`): il messaggio non
           ha destinatari scelti, ma la vista sì — si guarda con gli
           occhi di CHI L'HA DETTO, nell'istante in cui arriva, non in
           quello in cui è partito, perché nel frattempo qualcuno può
           essersi mosso. Chi non è visto in quel momento non riceve
           niente: «quello che non vedi te lo deve dire qualcuno», e
           qui nessuno gliel'ha detto. */
        if (p.diretto) {
          const mitt = m.perId[p.da]
          if (!mitt || !mitt.viva || !vede(m, mitt, u)) continue
        }
        const vecchio = m.fili.find(f => f.ascolto === a)
        /* ── UNA COSA ALLA VOLTA ──
           Un segnale sveglia qualcuno solo se quel qualcuno è LIBERO.
           Finché sta eseguendo qualcosa — il piano che parte
           all'inizio, un altro ascolto, o l'ascolto di questo stesso
           segnale arrivato un giro fa — il segnale gli scivola addosso
           e passa oltre. Non si accoda e non lo interrompe.

           Prima succedevano due cose, tutte e due sbagliate a
           guardarle giocare. Il segnale che tornava RIAVVOLGEVA
           l'ascolto: su una ronda che annuncia a ogni giro, chi era
           partito al segnale scorso si fermava a metà strada — allo
           scoperto — perché la domanda in cima al piano, rivalutata da
           lì, diceva un'altra cosa. E due ascolti diversi della stessa
           unità GIRAVANO INSIEME: due file che comandano lo stesso
           personaggio nello stesso battito, una lo manda di qua e una
           di là, e quello che si vede sullo schermo non è più
           spiegabile con nessuno dei due piani.

           Un personaggio è uno: fa una cosa per volta, e quando ha
           finito è di nuovo in ascolto. */
        const impegnata = m.fili.some(f => f.unita === u.id && !f.finito && !f.sospeso)
        if (impegnata) { occupati.push(u.nome || u.id); continue }
        svegli.push(u.nome || u.id)
        if (vecchio) {
          vecchio.i = 0; vecchio.nuovo = true; vecchio.st = {}; vecchio.finito = false
          vecchio.ramo = null; vecchio.rj = null
        }
        else {
          const f = nuovoFilo(a.unita, a.ordini, `quando «${ilSegnale(p.seg).nome}»`)
          f.ascolto = a
          m.fili.push(f)
        }
      }
      /* e chi è FATTO per accorrere: non ha un `quando senti` scritto
         da nessuno, ce l'ha addosso. Il grido dice anche DA DOVE, e
         quello diventa la meta. */
      if (p.rumore) for (const u of vive(m)) {
        if (u.accorre !== p.seg || u.id === p.da) continue
        svegli.push(u.nome || u.id)
        accorri(m, u, p)
      }
      const chi = m.perId[p.da]
      const N = ilSegnale(p.seg).nome
      /* la riga porta il verbo di chi ha suonato o parlato: così chi
         legge la traccia sa a quale ordine appartiene */
      const filo = { nome: 'segnali', i: 0,
                     ordine: { verbo: p.diretto ? 'parla' : 'suona', complemento: p.seg } }
      const desti = svegli.length || occupati.length
      if (chi) nota(m, filo, chi, desti ? 'fa' : 'salto',
        svegli.length ? `${p.diretto ? 'dico' : 'arriva'} «${N}»: si sveglia ${[...new Set(svegli)].join(' e ')}`
        : occupati.length ? `${p.diretto ? 'dico' : 'arriva'} «${N}», ma ${[...new Set(occupati)].join(' e ')} ` +
                            'sta ancora facendo quello di prima'
        : p.diretto ? `dico «${N}», ma non mi vede nessuno` : `arriva «${N}», ma non lo ascolta nessuno`,
        desti ? `manda ${N}` : (p.diretto ? 'parla a vuoto' : 'grida nel vuoto'))
    }
  }

  /* ── LA CODA DEI CONGEGNI ──
     Stesso principio dei segnali qui sopra, e per lo stesso motivo: un
     comando mandato ADESSO arriva al battito DOPO. Senza, una leva che
     ne comanda un'altra che rimanda un comando alla prima girerebbe
     nello stesso istante all'infinito; così invece si rimbalzano un
     messaggio al giro, e si vede — non si pianta. */
  if (m.comandiPendenti.length) {
    agisce = true
    const partiti = m.comandiPendenti; m.comandiPendenti = []
    for (const p of partiti) {
      const Nmitt = p.mittente.nomeIn(m)
      const chiFinto = { id: p.mittente.id, x: p.mittente.x, y: p.mittente.y,
                         fazione: null, emoji: p.mittente.em }
      const filo = { nome: 'congegni', i: 0, ordine: { verbo: 'premi', complemento: p.a } }
      const dest = elementoConId(m, p.a)
      /* ── OGNI CONSEGNA LASCIA UNA RIGA COL MITTENTE ──
         Il rischio vero di un modello a eventi è l'azione a distanza:
         una porta che si apre e sullo schermo non c'è nessuno che
         l'ha aperta. Qui la riga la scrive chi ha mandato il comando,
         non chi lo riceve — è la leva o il totem che «dice», la porta
         che ascolta. */
      if (!dest || !dest.accetta(p.cmd)) {
        nota(m, filo, chiFinto, 'no', `${Nmitt} manda «${p.cmd}» a «${p.a}», ma lì non c'è niente che lo ascolti`,
             'aziona un congegno')
        continue
      }
      const ris = dest.ricevi(p.cmd, null, { m, f: filo, congegno: true })
      if (ris && (ris.esito === 'fatto' || ris.esito === 'lavora')) {
        const Ndest = dest.nomeIn(m)
        nota(m, filo, chiFinto, 'fa', `${Nmitt} dice a ${Ndest}: ${p.cmd}`, `${Nmitt} aziona ${Ndest}`)
      }
      /* 'subito' — era già fatto — non lascia riga, come un `apri` su
         una porta già aperta: non è successo niente di nuovo */
    }
  }
  if (m.finita) return

  /* quello che si vede si tiene a mente: è la memoria su cui lavora
     `vai [qualcuno]`, e il motivo per cui una ronda serve davvero */
  for (const u of vive(m)) for (const z of vive(m))
    if (z !== u && vede(m, u, z)) {
      u.visti[z.id] = { x: z.x, y: z.y }
      /* e chi è fatto per gridare, grida: vedere un avversario è già
         rumore, non serve che qualcuno gli abbia detto di dirlo */
      if (z.fazione !== u.fazione) chiamaAllarme(m, u, 'visto')
    }

  if (condizioni(m, m.livello.sconfitta)) {
    fine(m, false, m.livello.motivoSconfitta || 'La missione è fallita.'); return
  }
  if (condizioni(m, m.livello.obiettivo)) { fine(m, true, 'Missione compiuta.'); return }

  const attivi = m.fili.filter(f => !f.finito && !f.sospeso)
  const inAscolto = m.ascolti.filter(a => {
    const u = m.perId[a.unita]
    return u && u.viva && !m.fili.some(f => f.ascolto === a && !f.finito)
  })
  if (!attivi.length && !inAscolto.length) {
    /* l'intoppo che si racconta è uno dei TUOI: quello di un'unità del
       livello sarebbe una notizia su cui non si può fare niente */
    const r = [...m.traccia].reverse().find(x => x.esito === 'no' && mio(m, x.unita))
    fine(m, false, 'Gli ordini sono finiti e la missione non è compiuta.' +
      (r ? ` L'ultimo intoppo: ${nomeDi(m, r.unita)} — «${r.testo}».` : ''))
    return
  }
  /* STALLO: se nessuno ha fatto niente, niente potrà più cambiare. Non
     è un ciclo da far girare: è un errore, e va detto — dalla parte di
     chi può rimediare. */
  if (!agisce) {
    const miei = attivi.filter(z => mio(m, z.unita))
    const loro = attivi.filter(z => !mio(m, z.unita))
    const fermi = l => l.some(z => (m.perId[z.unita] || {}).attesa)
    if (miei.length && loro.length && fermi(miei) && fermi(loro)) {
      const f = miei[0]
      fine(m, false, 'Stallo: vi state aspettando a vicenda, e nessuno fa la prima mossa.',
           { unita: f.unita, i: f.i, filo: f.nome, ramo: f.ramo || null, j: f.rj ?? null })
    } else if (miei.length) {
      const f = miei[0]
      const u = m.perId[f.unita]
      const che = f.ordine ? `«${descrivi(m, f.ordine)}»` : 'qualcosa'
      const altri = miei.length > 1 ? ` (e con lui ${miei.length - 1} altro/i)` : ''
      fine(m, false, `Stallo: ${u.nome || u.id} è piantato su ${che} e non succederà mai${altri}.`,
           { unita: f.unita, i: f.i, filo: f.nome, ramo: f.ramo || null, j: f.rj ?? null })
    } else if (loro.length) {
      fine(m, false, `Stallo: ${mancato(m, loro[0])}.`)
    } else {
      const a = inAscolto[0]
      fine(m, false, mio(m, a.unita)
        ? `Stallo: ${nomeDi(m, a.unita)} aspetta «${ilSegnale(a.segnale).nome}», ` +
          'ma non lo manderà più nessuno.'
        : `Stallo: nessuno ha mandato «${ilSegnale(a.segnale).nome}», ` +
          `che ${nomeDi(m, a.unita)} sta ancora aspettando.`)
    }
  }
}
const condizioni = (m, lista) => !!(lista && lista.length) && lista.every(c => valuta(m, null, c))
const nomeDi = (m, id) => (m.perId[id] && (m.perId[id].nome || id)) || id

/* ── un passo di un filo ──
   Il filo tiene DUE segnaposti, e non ne serviranno mai di più: `i` è a
   che punto sta della sua fila, e — se lì c'è un blocco condizione —
   `ramo`/`rj` dicono quale strada ha preso e a che punto è di quella.
   Un blocco dentro un blocco non esiste (lo rifiuta `guaiDi`), quindi
   non c'è nessuna pila da tenere. */
function passoFilo (m, f, u) {
  let giri = 0
  while (giri++ < 40) {
    if (f.i >= f.ordini.length) {
      /* finita una fila: se ci si era scesi da una chiamata, si risale
         all'ordine dopo l'`esegui`; se no il filo ha finito davvero */
      if (f.pila && f.pila.length) { Object.assign(f, f.pila.pop()); continue }
      f.finito = true; f.ordine = null; u.ordineOra = null; return 'fine'
    }
    const o = f.ordini[f.i]

    /* un'AZIONE nella fila non si esegue: è una definizione, sta lì per
       essere chiamata da qualche altra parte. Si scavalca senza che
       costi un battito, come una riga di intestazione. */
    if (eRoutine(o)) { f.i++; f.nuovo = true; continue }

    /* ── IL BIVIO SI DECIDE UNA VOLTA SOLA, quando il blocco comincia ──
       Da lì in poi il ramo scelto va fino in fondo. Se si rivalutasse a
       ogni passo, un'unità potrebbe partire di là e finire di qua a metà
       strada — che è proprio la cosa che rende un programma
       imprevedibile. Decidere non costa un battito: si guarda e si parte
       nello stesso istante. */
    if (eCondizione(o)) {
      if (f.nuovo) {
        f.nuovo = false; f.st = {}
        const vero = valuta(m, u, o.cond)
        f.ramo = vero ? 'vero' : 'falso'; f.rj = null
        nota(m, f, u, 'fa',
             `${testoCond(m, o.cond)}? ${vero ? 'sì' : 'no'} — prendo il ramo del ${f.ramo}`,
             'sceglie una strada')
        f.rj = 0; f.rnuovo = true
      }
      const rami = ramoDi(o, f.ramo)
      /* un ramo vuoto vuol dire «in questo caso non fare niente»: non è
         un intoppo, si passa all'ordine dopo il blocco */
      if (f.rj >= rami.length) { f.i++; f.nuovo = true; f.ramo = null; f.rj = null; continue }
      const q = rami[f.rj]
      if (f.rnuovo) { f.rnuovo = false; f.st = {} }
      f.ordine = q
      u.ordineOra = { ordine: q, unita: f.unita, i: f.i, filo: f.nome, ramo: f.ramo, j: f.rj }
      const r = fai(m, f, u, q)
      if (r === 'subito') { f.rj++; f.rnuovo = true; continue }
      if (r === 'entra') return 'agisce'      // la chiamata ha già spostato tutto
      if (r === 'fatto' || r === 'salta') { f.rj++; f.rnuovo = true; return 'agisce' }
      if (r === 'attesa') return 'attesa'
      if (r === 'errore') { f.finito = true; f.ordine = null; u.ordineOra = null; return 'agisce' }
      return 'agisce'
    }

    /* ── IL CICLO: gli ordini che ha dentro, in tondo ──
       La differenza con il bivio è tutta in due righe: la lista è una
       sola, e quando finisce non si esce — si torna al principio.
       L'USCITA SI GUARDA A OGNI BATTITO, non a fine giro: «smetti
       quando vedi gli orchi» deve valere nell'istante in cui li vedi,
       se no si finisce di fare il giro con il nemico alle spalle. È la
       stessa promessa che faceva `pattuglia`, e l'unica ragione per cui
       questo non è un `while` da manuale — è un `while` che controlla
       anche in mezzo. */
    if (eRipeti(o)) {
      if (o.finche && valuta(m, u, o.finche)) {
        nota(m, f, u, 'fa', `${testoCond(m, o.finche)}: smetto di girare`, 'si ferma')
        f.i++; f.nuovo = true; f.ramo = null; f.rj = null
        return 'agisce'
      }
      const corpo = corpoDi(o)
      if (!corpo.length) { f.i++; f.nuovo = true; f.ramo = null; f.rj = null; continue }
      if (f.nuovo) { f.nuovo = false; f.st = {}; f.ramo = 'corpo'; f.rj = 0; f.rnuovo = true }
      if (f.rj >= corpo.length) { f.rj = 0; f.rnuovo = true }   // si ricomincia da capo
      const q = corpo[f.rj]
      if (f.rnuovo) { f.rnuovo = false; f.st = {} }
      f.ordine = q
      u.ordineOra = { ordine: q, unita: f.unita, i: f.i, filo: f.nome, ramo: 'corpo', j: f.rj }
      const r = fai(m, f, u, q)
      if (r === 'subito') { f.rj++; f.rnuovo = true; continue }
      if (r === 'entra') return 'agisce'
      if (r === 'fatto' || r === 'salta') { f.rj++; f.rnuovo = true; return 'agisce' }
      if (r === 'attesa') return 'attesa'
      if (r === 'errore') { f.finito = true; f.ordine = null; u.ordineOra = null; return 'agisce' }
      return 'agisce'
    }

    if (f.nuovo) { f.nuovo = false; f.st = {}; f.ramo = null; f.rj = null }
    f.ordine = o
    u.ordineOra = { ordine: o, unita: f.unita, i: f.i, filo: f.nome, ramo: null, j: null }
    const r = fai(m, f, u, o)
    if (r === 'subito') { f.i++; f.nuovo = true; continue }
    if (r === 'entra') return 'agisce'
    if (r === 'fatto' || r === 'salta') { f.i++; f.nuovo = true; return 'agisce' }
    if (r === 'attesa') return 'attesa'
    if (r === 'errore') { f.finito = true; f.ordine = null; u.ordineOra = null; return 'agisce' }
    return 'agisce'
  }
  nota(m, f, u, 'no', 'giro a vuoto fra i miei ordini', 'resta fermo')
  f.finito = true
  return 'agisce'
}

/* ═══════════ IL REGISTRO ═══════════
   Una riga per ordine, in prima persona, con l'esito a colori:
     fa      ho fatto qualcosa
     aspetto sto aspettando, e dico cosa
     no      non ho potuto, e dico perché
     salto   non toccava a me: sono passato oltre

   Ogni riga porta due versioni. `testo` è quello che l'unità pensa — e
   nomina l'ordine. `fatto` è quello che si VEDE da fuori: di un'unità
   coi piani coperti si mostra solo quello, e solo se qualcuno dei tuoi
   la sta guardando. Il registro serve a DEDURRE il piano nemico, non a
   leggerlo. */
const ALLA = t => t
  .replace(/\ba la /g, 'alla ').replace(/\ba il /g, 'al ').replace(/\ba l'/g, "all'").replace(/\ba le /g, 'alle ')
  .replace(/\bdi la /g, 'della ').replace(/\bdi il /g, 'del ').replace(/\bdi l'/g, "dell'")
  .replace(/\bda la /g, 'dalla ').replace(/\bda il /g, 'dal ').replace(/\bda l'/g, "dall'")
function nota (m, f, u, esito, testo, fatto) {
  testo = ALLA(testo); if (fatto) fatto = ALLA(fatto)
  const visto = chiVede(m, u)
  const o = f && f.ordine
  let p = null
  for (let k = m.traccia.length - 1; k >= 0 && k > m.traccia.length - 12; k--)
    if (m.traccia[k].unita === u.id) { p = m.traccia[k]; break }
  if (p && p.testo === testo && p.esito === esito && p.visto === visto) {
    p.n++; p.tFine = m.passi; return
  }
  m.traccia.push({
    passo: m.passi, t: m.passi, tFine: m.passi, n: 1,
    unita: u.id, fazione: u.fazione, emoji: u.emoji,
    verbo: o ? o.verbo : null, complemento: o ? o.complemento : null,
    esito, testo, fatto: fatto || testo, visto,
    filo: f ? f.nome : null, i: f ? f.i : 0,
    /* dentro quale ramo di un blocco condizione siamo, e a che punto del
       ramo: `ramo` senza `j` è la riga della DECISIONE, `ramo` con `j` è
       un ordine dentro quel ramo. Senza nessuno dei due, è un ordine
       della fila di fuori. */
    ramo: (f && f.ramo) || null,
    j: f && f.ramo && Number.isFinite(f.rj) ? f.rj : null,
    /* il MOTIVO è la parte che insegna: c'è solo quando qualcosa non è
       andato, e dice perché proprio quello non è andato */
    ...(esito === 'fa' ? {} : { motivo: testo }),
  })
  if (m.traccia.length > 400) m.traccia.shift()
}
/* chi dei «tuoi» sta guardando questa unità in questo momento */
function chiVede (m, u) {
  if (u.fazione === m.mia) return true
  return vive(m).some(z => z.fazione === m.mia && vede(m, z, u))
}

/* Una strada chiusa non è subito un errore: il portone potrebbe aprirlo
   qualcun altro fra due secondi. L'unità aspetta, e solo se non succede
   niente per un pezzo si arrende dicendo perché. */
function attende (m, f, u, testo, limite) {
  f.st.fermo = (f.st.fermo || 0) + 1
  if (f.st.fermo > (limite || 25)) return guasto(m, f, u, testo)
  u.attesa = testo
  nota(m, f, u, 'aspetto', testo, 'resta fermo')
  return 'attesa'
}
/* Un ordine che non parte NON ferma la scena: ferma quel filo, lo dice,
   e la partita continua. Fermare tutto toglierebbe al bambino la parte
   più utile — vedere cosa succede dopo. */
function guasto (m, f, u, testo) {
  nota(m, f, u, 'no', testo, 'si ferma')
  incolpa(m, f, u)
  return 'errore'
}
/* l'ordine su cui la vista salta quando il piano non regge. Si segna
   solo se è un ordine dei TUOI: mandare il bambino a guardare la riga
   sbagliata di un piano che non ha scritto lui è peggio che non
   mandarlo da nessuna parte. */
function incolpa (m, f, u) {
  if (!m.colpevole && u.fazione === m.mia)
    m.colpevole = { unita: u.id, i: f.i, filo: f.nome, ramo: f.ramo || null, j: f.rj ?? null }
}
function salta (m, f, u, testo, fatto) {
  nota(m, f, u, 'no', testo, fatto || 'resta fermo')
  incolpa(m, f, u)
  return 'salta'
}

/* ── TRADURRE LA RISPOSTA DI UN ELEMENTO ──
   `Elemento.ricevi` risponde con `{ esito, dice, fatto }`, riusando il
   vocabolario di `passoFilo` (fatto/lavora/salta/attesa/subito) ma
   senza sapere come si scrive una riga di registro — quello lo sa solo
   il motore, che qui traduce l'esito nella chiamata giusta a `nota`,
   `salta` o `attende`. È il punto in cui il mondo torna a parlare con
   `fai()`, dopo aver deciso da sé cosa fare. */
function esitoOrdine (m, f, u, ris) {
  if (!ris) return 'subito'
  switch (ris.esito) {
    case 'fatto': nota(m, f, u, 'fa', ris.dice, ris.fatto); return 'fatto'
    case 'lavora': nota(m, f, u, 'fa', ris.dice, ris.fatto); return 'lavora'
    case 'salta': return salta(m, f, u, ris.dice, ris.fatto)
    case 'attesa': return attende(m, f, u, ris.dice, ris.limite)
    default: return 'subito'
  }
}

/* muove di una cella verso (bx,by) */
function verso (m, u, bx, by) {
  if (u.x === bx && u.y === by) return 'arrivato'
  const p = passoVerso(m, u, bx, by)
  if (!p) return null
  u.dir = p[0] > u.x ? 1 : p[0] < u.x ? 3 : p[1] > u.y ? 2 : 0
  u.x = p[0]; u.y = p[1]; u._mk = null
  m.eventi.push('passo')
  return u.x === bx && u.y === by ? 'arrivato' : 'passo'
}

/* dov'è una cosa, adesso: per un `Elemento` lo decide lui — la porta sta
   ferma, un oggetto preso segue chi lo tiene */
function dove (m, u, C) {
  switch (C.tipo) {
    case 'posto': return m.posti[C.id].dove(m)
    case 'porta': return m.porte[C.id].dove(m)
    case 'cella': return { x: C.x, y: C.y }
    case 'oggetto': {
      const o = m.oggetti.find(z => z.nome === C.id)
      return o ? o.dove(m) : null
    }
    case 'unita': return m.perId[C.id] && m.perId[C.id].viva ? m.perId[C.id] : null
    case 'fazione': {
      const b = vive(m).filter(z => z.fazione === C.id && z !== u)
      if (!b.length) return null
      b.sort((p, q) => mappaDi(m, u)[p.y * m.w + p.x] - mappaDi(m, u)[q.y * m.w + q.x])
      return b[0]
    }
    default: return null
  }
}
/* un elemento comandabile, qualunque famiglia sia: la coda dei
   congegni (`m.comandiPendenti`) non sa se sta parlando a una porta,
   una leva o un totem — lo chiede qui, e chi risponde decide da sé
   cosa fare del comando (`ricevi`, §8.2 del piano) */
function elementoConId (m, id) {
  return (m.porte && m.porte[id]) || (m.leve && m.leve[id]) || (m.totem && m.totem[id]) || null
}
const MOBILE = { unita: 1, fazione: 1 }
/* «essere a portata»: sulla cella o attaccati. È la precondizione di
   tutte le azioni, ed è la ragione per cui prima si dice `vai`. */
const arrivato = (m, u, C, t) =>
  MOBILE[C.tipo] || (C.tipo === 'porta' && !m.porte[C.id].chiedi('aperta'))
    ? aPortata(u, t) : (u.x === t.x && u.y === t.y)

function fai (m, f, u, o) {
  /* ── L'ATTESA DI UNA DOMANDA non ha un bersaglio ──
     Sta prima di tutto il resto perché non ha un complemento da
     cercare: la sua «cosa» è la domanda, e la domanda si valuta. */
  if (o.verbo === 'aspetta' && o.cond && o.cond.cond) {
    if (valuta(m, u, o.cond)) {
      nota(m, f, u, 'fa', `${testoCond(m, o.cond)}: riparto`, 'si rimette in moto')
      return 'fatto'
    }
    return attende(m, f, u, `aspetto che ${testoCond(m, o.cond)}`, 9999)
  }
  const C = laCosa(m, o.complemento)
  if (!C) return salta(m, f, u, o.complemento
    ? `«${o.complemento}»? qui non c'è niente che si chiami così`
    : 'questo ordine non dice su cosa')
  const N = C.nome

  /* il tipo e il mestiere sono già filtrati in cassetta e dal
     validatore: questi controlli sono la rete sotto, e servono a un
     livello scritto a mano che sbaglia */
  const V = VERBI[o.verbo]
  if (!V) return salta(m, f, u, `«${o.verbo}»? non so cosa voglia dire`)
  if (!V.accetta.includes(C.tipo)) return salta(m, f, u, `${N} non si può ${V.nome}`)
  if (!saFare(u, o.verbo)) return salta(m, f, u, `non è il mio mestiere: non so ${V.nome}`)
  /* ── QUELLO CHE NON RIESCE A FARE, LO DICE LUI, QUANDO GLIELO CHIEDI ──
     Non è `sa`: quel verbo è in cassetta, l'ordine si scrive, e la
     scena parte. Poi arriva il suo turno e il cavaliere risponde «ho le
     mani occupate: scudo e spada» — e a quel punto è UNA COSA
     SUCCESSA, non un tasto che non c'era. Un verbo tolto dal menù
     lascia la domanda «dov'è finito prendi?»; un ordine che fallisce
     parlando lascia «ah, allora ci deve andare l'altro», che è la
     lezione del livello. */
  const scusa = nonRiesce(u, o.verbo)
  if (scusa) {
    /* e ci va lo stesso, prima. Fallire da fermo, dall'altra parte
       della corte, sembra che l'ordine non sia nemmeno partito: il
       cavaliere cammina fino al forziere, ci arriva, e LÌ allarga le
       braccia. È una cosa che si guarda succedere, e si capisce senza
       leggere niente. */
    const t = dove(m, u, C)
    if (t && !arrivato(m, u, C, t)) {
      const r = verso(m, u, t.x, t.y)
      if (r === null) return attende(m, f, u, `non riesco ad arrivare a ${N}: la strada è chiusa`)
      f.st.fermo = 0
      nota(m, f, u, 'fa', `vado a ${N}`, 'va verso ' + VERSO[u.dir])
      return 'lavora'
    }
    return salta(m, f, u, scusa, 'allarga le braccia')
  }

  switch (o.verbo) {

    case 'vai': {
      let t = dove(m, u, C)
      if (MOBILE[C.tipo]) {
        /* nessuna onniscienza: si va da chi si vede, o dove lo si è
           visto l'ultima volta. Ecco perché serve prima la ronda. */
        if (t && vede(m, u, t)) u.visti[t.id] = { x: t.x, y: t.y }
        else {
          const ric = (t && u.visti[t.id]) || u.visti[C.id] || null
          if (!ric) return salta(m, f, u, `${N}? non so dov'è`, 'si guarda intorno')
          if (aPortata(u, ric) && (!t || !vede(m, u, t)))
            return salta(m, f, u, `${N} non è più qui`, 'si guarda intorno')
          t = ric
        }
      }
      if (!t) return salta(m, f, u, `${N} non c'è più`, 'si guarda intorno')
      if (arrivato(m, u, C, t)) { nota(m, f, u, 'fa', `sono a ${N}`, 'si ferma'); return 'fatto' }
      const r = verso(m, u, t.x, t.y)
      if (r === null) return attende(m, f, u, `non riesco ad arrivare a ${N}: la strada è chiusa`)
      f.st.fermo = 0
      nota(m, f, u, 'fa', `vado a ${N}`, 'va verso ' + VERSO[u.dir])
      return arrivato(m, u, C, t) ? 'fatto' : 'lavora'
    }

    /* ── prendere e aprire CAMMINANO ──
       Prima non lo facevano: un'azione riusciva solo da vicino, e il
       bambino doveva mettere un `vai` davanti. Provato col dito non
       regge — tocchi una cosa lontana, non succede niente, e non si
       capisce perché. Il prerequisito che resta, e che è più vero, non
       è la POSIZIONE ma il POSSESSO: al portone ci si arriva sempre, e
       senza la chiave non si apre lo stesso. */
    case 'prendi': {
      const og = m.oggetti.find(z => z.nome === C.id)
      if (!og) return salta(m, f, u, `${N} non c'è più`)
      if (og.preso === u.id) return 'subito'
      if (!aPortata(u, og)) {
        const r = verso(m, u, og.x, og.y)
        if (r === null) return attende(m, f, u, `non riesco ad arrivare a ${N}: la strada è chiusa`)
        f.st.fermo = 0
        nota(m, f, u, 'fa', `vado a prendere ${N}`, 'va verso ' + VERSO[u.dir])
        return 'lavora'
      }
      /* è a portata: da qui in poi decide l'oggetto, non questo switch */
      return esitoOrdine(m, f, u, og.ricevi('prendi', u, { m, f }))
    }

    case 'apri': {
      const pt = m.porte[C.id]
      if (pt.chiedi('aperta')) return 'subito'
      if (!aPortata(u, pt)) {
        const r = verso(m, u, pt.x, pt.y)
        if (r === null) return attende(m, f, u, `non riesco ad arrivare a ${N}: la strada è chiusa`)
        f.st.fermo = 0
        nota(m, f, u, 'fa', `vado ad aprire ${N}`, 'va verso ' + VERSO[u.dir])
        return 'lavora'
      }
      /* è a portata: la serratura, le spallate, il fracasso — la porta
         li conosce, questo switch no. `ctx.f` porta il filo di CHI sta
         spingendo, perché le spallate si contano per unità: due che
         spingono la stessa porta in fili diversi non sommano le forze. */
      return esitoOrdine(m, f, u, pt.ricevi('apri', u, { m, f }))
    }

    case 'chiudi': {
      const pt = m.porte[C.id]
      if (!pt.aperta) return 'subito'
      if (!aPortata(u, pt)) {
        const r = verso(m, u, pt.x, pt.y)
        if (r === null) return attende(m, f, u, `non riesco ad arrivare a ${N}: la strada è chiusa`)
        f.st.fermo = 0
        nota(m, f, u, 'fa', `torno a chiudere ${N}`, 'va verso ' + VERSO[u.dir])
        return 'lavora'
      }
      /* è a portata: chi può chiudersi e quando lo sa la porta */
      return esitoOrdine(m, f, u, pt.ricevi('chiudi', u, { m, f }))
    }

    /* ── PREMERE UN CONGEGNO CAMMINA, ESATTAMENTE COME APRIRE ──
       Il prerequisito che conta non è la posizione — è arrivarci — e
       ci si arriva da soli, come per `apri` e `prendi`. Cosa succede
       DOPO (scatta subito, o conta e basta) lo decide il congegno: una
       leva e un totem rispondono in modo diverso allo stesso comando. */
    case 'premi': {
      const cg = elementoConId(m, C.id)
      if (!cg) return salta(m, f, u, `${N} non c'è più`)
      if (!aPortata(u, cg)) {
        const r = verso(m, u, cg.x, cg.y)
        if (r === null) return attende(m, f, u, `non riesco ad arrivare a ${N}: la strada è chiusa`)
        f.st.fermo = 0
        nota(m, f, u, 'fa', `vado a premere ${N}`, 'va verso ' + VERSO[u.dir])
        return 'lavora'
      }
      return esitoOrdine(m, f, u, cg.ricevi('premi', u, { m, f }))
    }

    case 'attacca': {
      let t = f.st.bersaglio ? m.perId[f.st.bersaglio] : null
      if (t && !t.viva) t = null
      if (!t) {
        const b = dove(m, u, C)
        if (!b) return 'subito'                       // non c'è più nessuno: fatto
        /* ── ATTACCA È «VAI ADDOSSO E MENA» ──
           Chi si vede lo si insegue e gli si resta addosso finché non
           cade; e vale anche il RICORDO, come per `vai` — se l'hai
           visto un attimo fa dietro l'angolo, sai dove andare a
           cercarlo. Erano due verbi con due memorie diverse, e uno dei
           due sembrava rotto.
           Quello che NON si fa è partire verso qualcuno che non hai mai
           visto: lì l'ordine fallisce SUBITO e lo dice. Prima restava
           in attesa per sessanta battiti, e in mezzo alla mappa si
           vedeva solo un personaggio fermo che ogni tanto lampeggiava:
           sembrava un guasto del gioco, non una cosa che avevi scritto
           tu. Ed è la ragione per cui serve una ronda — detta a voce,
           una volta, invece che lasciata indovinare. */
        if (vede(m, u, b)) { u.visti[b.id] = { x: b.x, y: b.y }; t = b; f.st.bersaglio = b.id }
        else {
          /* un RICORDO non è un bersaglio: è un posto dove andare a
             guardare. Ci si cammina e basta — se arrivati non c'è più
             nessuno, l'ordine lo dice e finisce lì */
          const ric = u.visti[b.id] || u.visti[C.id] || null
          if (!ric) return salta(m, f, u, `${N}? non so dove sono: prima devo trovarli`,
                                 'si guarda intorno')
          if (aPortata(u, ric)) return salta(m, f, u, `qui non c'è più nessuno`, 'si guarda intorno')
          const rr = verso(m, u, ric.x, ric.y)
          if (rr === null) return salta(m, f, u, `non riesco ad arrivare dove li ho visti`)
          f.st.fermo = 0
          nota(m, f, u, 'fa', `vado dove ho visto ${N}`, 'va verso ' + VERSO[u.dir])
          return 'lavora'
        }
      }
      f.st.fermo = 0
      if (aPortata(u, t)) {
        t.vita -= DANNO; m.eventi.push('colpo')
        /* UNO SCONTRO DURA, E SI DEVE VEDERE. Il colpo finisce in una
           lista che si svuota a ogni passo: chi disegna sa chi ha
           menato, chi ha incassato e dov'è successo, e quei battiti
           sono la finestra in cui l'altro corre al forziere. */
        m.colpi.push({ da: u.id, a: t.id, x: t.x, y: t.y,
                       vita: Math.max(0, t.vita), vitaMax: t.vitaMax,
                       mortale: t.vita <= 0 })
        if (t.vita <= 0) {
          t.viva = false; m.eventi.push('morte')
          m.fili.forEach(z => { if (z.unita === t.id) { z.finito = true; z.ordine = null } })
          t.ordineOra = null
          nota(m, f, u, 'fa', `${t.nome || t.id} è caduto`, `abbatte ${t.nome || t.id}`)
          return 'fatto'
        }
        /* menare fa rumore: chi le prende chiama i suoi */
        chiamaAllarme(m, t, 'colpito')
        nota(m, f, u, 'fa', `colpisco ${t.nome || t.id}`, `colpisce ${t.nome || t.id}`)
        return 'lavora'
      }
      const r = verso(m, u, t.x, t.y)
      if (r === null) return attende(m, f, u, `non riesco a raggiungere ${t.nome || t.id}`)
      nota(m, f, u, 'fa', `inseguo ${t.nome || t.id}`, 'va verso ' + VERSO[u.dir])
      return 'lavora'
    }

    case 'suona': {
      /* ── SUONARE È FARE RUMORE, E IL RUMORE HA UN POSTO ──
         Il segnale porta con sé DA DOVE è partito. Serve a chi lo
         ascolta soltanto per sapere che è successo, ma a chi è fatto
         per accorrere serve eccome: corre lì. È così che «fai rumore
         lontano da dove devi passare» diventa una mossa scrivibile —
         prima solo il grido di un nemico aveva una posizione, e il
         diversivo lo si poteva sperare, non organizzare. */
      m.pendenti.push({ seg: C.id, da: u.id, x: u.x, y: u.y, rumore: true })
      m.eventi.push('segnale')
      /* e SI VEDE: un segnale mandato è una cosa che succede sulla
         mappa, nel punto in cui succede. Finiva solo nel registro —
         cioè dietro un tasto — e chi guardava la scena vedeva un
         personaggio fermarsi un battito senza motivo apparente. La
         stessa lista dei gridi: una cosa sola, un disegno solo. */
      m.allarmi.push({ x: u.x, y: u.y, seg: C.id, da: u.id })
      nota(m, f, u, 'fa', `suono «${N}»`, 'fa un segnale')
      return 'fatto'
    }

    /* ── PARLA: LA CHIAMATA, NON IL GRIDO ──
       Stessa coda di `suona` (`m.pendenti`, consegnata al battito
       dopo), ma `diretto: true` dice alla consegna di guardare CHI IL
       MITTENTE VEDE in quel momento, non chi sta semplicemente
       ascoltando quel segnale ovunque sia sulla mappa. Non fa rumore
       (`rumore` non c'è) e non chiama chi accorre: è una parola detta
       a chi hai davanti, non un allarme. */
    case 'parla': {
      m.pendenti.push({ seg: C.id, da: u.id, x: u.x, y: u.y, diretto: true })
      m.eventi.push('parla')
      nota(m, f, u, 'fa', `dico «${N}»`, 'parla sottovoce')
      return 'fatto'
    }

    /* `quando` non aspetta: ARMA un ascolto e passa oltre. Così un'unità
       può stare in ascolto di due segnali diversi e il seguito dipende
       da quale arriva — che è tutto il punto del ramo. */
    case 'quando': {
      if (!f.armati) f.armati = {}
      if (!f.armati[C.id]) {
        f.armati[C.id] = true
        m.ascolti.push({ unita: u.id, segnale: C.id, ordini: o.allora || [] })
        nota(m, f, u, 'fa', `sto in ascolto di «${N}»`, 'resta in ascolto')
      }
      return 'subito'
    }

    /* ── ESEGUI: si scende dentro un'altra fila e poi si risale ──
       Non parte niente di nuovo e non si sdoppia nessuno: è lo stesso
       personaggio che va a leggere un altro pezzo del suo piano.
       Costa un battito, e non è un dettaglio contabile — è quello che
       rende scrivibile «riprova»: un'azione che richiama sé stessa
       diventa un'attesa attiva, e nel frattempo il mondo si muove.
       Senza il battito sarebbe un giro a vuoto dentro lo stesso
       istante, cioè un blocco del gioco. */
    case 'esegui': {
      const corpo = (m.routine || {})[C.id]
      if (!Array.isArray(corpo) || !corpo.length)
        return salta(m, f, u, `${N} non ha ancora niente dentro`, 'si guarda intorno')
      /* ── SE NON RESTA NIENTE DA FARE DOPO, NON C'È NIENTE A CUI TORNARE ──
         `esegui` in fondo a una fila non impila niente: prende il posto
         di quello che c'era. Sembra un'ottimizzazione da manuale e
         invece è la differenza fra un costrutto che serve e uno che
         no — «se vedi ancora qualcuno, RIPROVA» si scrive facendo
         chiamare l'azione a sé stessa, e senza questo diventerebbe una
         pila che cresce fino a sbattere. Così invece è un'attesa
         attiva: un battito per giro, e intanto il mondo si muove.
         Dentro un ciclo non vale mai — lì dopo c'è sempre il giro dopo. */
      const b = f.ramo ? f.ordini[f.i] : null
      const coda = !f.ramo ? f.i + 1 >= f.ordini.length
        : eCondizione(b) ? (f.rj + 1 >= ramoDi(b, f.ramo).length &&
                            f.i + 1 >= f.ordini.length)
        : false
      /* e una pila che cresce e basta è un'azione che ne chiama
         un'altra all'infinito: si dice invece di lasciarla correre */
      if (!coda && f.pila.length >= 12)
        return guasto(m, f, u, `${N} chiama e richiama e non si torna più indietro`)
      if (!coda) f.pila.push({ ordini: f.ordini, i: f.i + 1, ramo: f.ramo, rj: f.rj,
                               st: f.st, nome: f.nome })
      f.ordini = corpo; f.i = 0; f.nuovo = true; f.st = {}
      f.ramo = null; f.rj = null; f.nome = C.id
      nota(m, f, u, 'fa', `faccio ${N}`, 'si mette al lavoro')
      return 'entra'
    }

    /* si aspetta uno STATO, e lo si aspetta guardando: se quella cosa
       da qui non si vede, non la si può sapere — e allora il piano
       vuole un messaggio, non un'attesa */
    case 'aspetta': {
      if (C.tipo === 'attimo') { nota(m, f, u, 'fa', 'aspetto un momento', 'resta fermo'); return 'fatto' }
      const pt = m.porte[C.id]
      if (!pt) return salta(m, f, u, `${N} non è una cosa che posso stare a guardare`)
      if (pt.chiedi('aperta')) {
        nota(m, f, u, 'fa', `${N} è aperto: riparto`, 'si rimette in moto')
        return 'fatto'
      }
      if (!vedePorta(m, u, pt))
        return salta(m, f, u, `${N} non lo vedo da qui: non posso sapere quando si apre — ` +
                              'me lo deve dire qualcuno', 'si guarda intorno')
      return attende(m, f, u, `aspetto che ${N} si apra`, 9999)
    }

    case 'aspettaDiVedere': {
      const b = vive(m).find(z => z !== u && (z.id === C.id || z.fazione === C.id) && vede(m, u, z))
      if (b) {
        u.visti[b.id] = { x: b.x, y: b.y }
        nota(m, f, u, 'fa', `eccolo: vedo ${b.nome || b.id}`, 'si volta di scatto')
        return 'fatto'
      }
      return attende(m, f, u, `sto di vedetta: non vedo ${N}`, 9999)
    }

    default:
      return salta(m, f, u, `«${o.verbo}»? non so cosa voglia dire`)
  }
}


/* ═══════════ far girare tutto ═══════════
   È quello che usa il test, ed è quello che usa il gioco quando vuole
   sapere com'è finita senza guardare: stesso mondo, stessi ordini,
   stesso esito. Niente `Math.random` da nessuna parte. */
export function esegui (mondo, ordini) {
  const miei = mieUnita(mondo.livello)
  const piano = Array.isArray(ordini) ? { [miei[0]]: ordini } : (ordini || {})

  const guai = guaiDi(mondo, piano)
  if (guai.length)
    return { vinto: false, motivo: 'Ci sono ordini che non si possono dare: ' + guai[0].motivo,
             passi: 0, traccia: [], rifiutati: guai, mondo }

  avvia(mondo, pianoCompleto(mondo.livello, piano))
  while (!mondo.finita) passo(mondo)
  return { vinto: mondo.vinto, motivo: mondo.motivo, passi: mondo.passi,
           traccia: mondo.traccia, rifiutati: [], colpevole: mondo.colpevole,
           perdute: perdute(mondo), mondo }
}

/* ═══════════ le parole ═══════════
   Le stesse etichette le usano il gioco, il registro e i messaggi del
   motore: una cosa si chiama in un modo solo. */
export function testoCond (mondo, c) {
  if (!c) return '…'
  const N = (mondo.cose[c.complemento] || {}).nome || c.complemento
  let t
  switch (c.cond) {
    case 'vedi': t = `vedi ${N}`; break
    case 'vivo': t = `${N} è in piedi`; break
    case 'hai': t = `hai ${N}`; break
    case 'aperta': t = `${N} è aperto`; break
    case 'premuto': t = `${N} è stata premuta`; break
    case 'almeno': t = `${N} è almeno a ${c.n || 0}`; break
    case 'segnale': t = `è arrivato «${N}»`; break
    case 'qui': t = `${nomeDi(mondo, c.chi)} è a ${N}`; break
    default: t = 'sempre'
  }
  if (!c.non) return t
  return t.replace(' è in piedi', ' è fuori combattimento').replace(/^vedi /, 'non vedi ')
          .replace(/^hai /, 'non hai ').replace(' è aperto', ' è chiuso')
          .replace(' è stata premuta', ' non è stata premuta')
          .replace(/^è arrivato/, 'non è arrivato').replace(' è a ', ' non è a ')
}
export function descrivi (mondo, o, secco) {
  /* un blocco si legge come la domanda che pone, e — se non si è
     stretti — con le due strade che ne partono */
  if (eCondizione(o)) {
    const testa = `condizione [${testoCond(mondo, o.cond)}]`
    if (secco) return testa
    const via = r => ramoDi(o, r).map(q => descrivi(mondo, q, true)).join(', ') || 'niente'
    return `${testa}: se è vero ${via('vero')}, se è falso ${via('falso')}`
  }
  const V = VERBI[o.verbo]; if (!V) return '?'
  if (V.vuoleCond && o.cond) return `${V.nome} [${testoCond(mondo, o.cond)}]`
  const C = laCosa(mondo, o.complemento)
  return V.nome + ' [' + (C ? C.nome : (o.complemento || '…')) + ']'
}
/* le righe del registro, dalla più vecchia alla più nuova */
export const registro = (mondo, quante) =>
  quante ? mondo.traccia.slice(-quante) : mondo.traccia
