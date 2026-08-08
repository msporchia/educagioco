/* ═══════════════════════════════════════════════════════════════════
   LE CAMPAGNE DEL GENERALE — la storia e la didattica sono la stessa cosa.

   Nel Generale non si pilota nessuno: si **firmano ordini permanenti** e
   poi si guarda la scena girare. Da questa regola sola discende tutto il
   resto del disegno, comprese le tappe qui sotto.

   Tre campagne:
     · `dungeon`   — tredici tappe, l'arco intero dei concetti
     · `nina`      — sei tappe per chi ha sei anni: sequenza e prerequisiti
     · `fortezza`  — cinque tappe invertite, si comandano gli orchi

   **Le mappe non stanno qui.** Ogni tappa ha `mappa: null` — il posto dove
   la mappa andrà quando il formato sarà definito. `senzaMappa()` le elenca
   tutte, così chi disegna sa quante gliene mancano. Quello che una tappa
   dice al disegnatore sta in `varianti`: cosa deve cambiare fra le tre
   scene, che è l'unica cosa che il livello non può inventarsi da solo.

   **I `par` sono provvisori.** Sono contati sul piano più corto che si
   riesce a scrivere sulla mappa che avevamo in testa; quando la mappa vera
   esiste vanno rimisurati giocandola, non aggiustati a occhio. Sono più
   bassi di quelli della prima stesura per un motivo solo: i passi contati
   non ci sono più (vedi qui sotto) e gli stessi piani si dicono in meno
   righe.
   ═══════════════════════════════════════════════════════════════════ */

/* ═══════════ IL VOCABOLARIO ═══════════
   L'elenco degli ordini con cui si scrivono le cassette delle tappe. Qui
   c'è la sola cosa che serve alla progettazione — che ordine è, a che grado
   di astrazione sta, come suona letto ad alta voce. Come si *esegue* non è
   affare di questo file.

   **I passi non ci sono più.** «Fai un passo a nord» e «girati a destra»
   c'erano, ed erano il gradino basso della scala; sono stati tolti perché
   un ordine deve puntare a un **obiettivo**, mai a una direzione — «prendi
   a nord» non vuol dire niente, e un gioco fatto di passi contati insegna a
   contare i passi.

   Il gradino basso però resta, e non è sparito con loro: adesso è un **modo
   di usare `vai`**. Una fila di «vai» a mete nominate una per una —
   l'angolo a nord-ovest, poi quello a nord-est, poi il fondo — dice tutta
   la strada senza nascondere niente, esattamente come facevano i passi. Fa
   lo stesso lavoro didattico, si legge molto meglio, ed è più corta: per
   questo i par delle prime tappe sono scesi. E una meta non ha nemmeno
   bisogno di un nome: sulla mappa si punta col dito la casella che si
   vuole.

   Da qui `vai` **scende di grado da solo**, ed è la cosa più importante di
   questa tabella: puntato a una casella o a un angolo è il gradino basso,
   puntato a una cosa da fare — la torcia, la chiave, l'ogre — è quello di
   mezzo. La quarta tappa del dungeon non porta una parola nuova: porta lo
   stesso «vai» puntato a un'altra specie di cosa. */
export const GRADI = {
  posto:     'una meta alla volta: la fila di «vai» che dice tutta la strada, senza niente di nascosto',
  compito:   'si dice la cosa da fare e non come farla: chi la esegue si arrangia',
  strategia: 'un comportamento che dura nel tempo, e che da solo vale dieci mete',
  guardia:   'non è un verbo: si appende a un ordine e decide se tocca a lui',
  script:    'non è un verbo: è la testa di una lista che parte quando arriva un segnale',
}

export const VOCABOLARIO = [
  { id: 'vai',           grado: 'posto',     forma: 'vai a [x]',
    nota: 'puntato a una casella è il gradino basso; puntato a una cosa da fare è quello di mezzo' },
  { id: 'prendi',        grado: 'compito',   forma: 'prendi [x]' },
  { id: 'apri',          grado: 'compito',   forma: 'apri [x]' },
  { id: 'attacca',       grado: 'compito',   forma: 'attacca [x]' },
  { id: 'aspetta',       grado: 'compito',   forma: 'aspetta [x]',
    nota: 'prende un fatto — la porta, l\'ogre, un segnale — e anche «un momento», che è la scelta sbagliata' },
  { id: 'chiama',        grado: 'compito',   forma: 'chiama [segnale]' },
  { id: 'pattuglia',     grado: 'strategia', forma: 'pattuglia [zona] finché [cond]' },
  { id: 'segui',         grado: 'strategia', forma: 'segui [unità]' },
  { id: 'difendi',       grado: 'strategia', forma: 'difendi [posto]' },
  { id: 'se',            grado: 'guardia',   forma: '… se [cond]',
    nota: 'guarda una volta sola, quando tocca a quell\'ordine: se la cosa non è vera l\'ordine si salta' },
  { id: 'quando-arriva', grado: 'script',    forma: 'quando arriva [segnale] …' },
]

export const ORDINE = Object.fromEntries(VOCABOLARIO.map(o => [o.id, o]))

/* `se` e `quando arriva` non sono verbi: non li «sa fare» nessuno in
   particolare, li usano tutti. Serve a `saFare()` e a `verificaScala()`. */
export const eVerbo = id => !!ORDINE[id] && ORDINE[id].grado !== 'guardia' && ORDINE[id].grado !== 'script'
export const VERBI = VOCABOLARIO.filter(o => eVerbo(o.id)).map(o => o.id)

/* ═══════════ I SEGNALI ═══════════
   Un segnale ha un **nome vero**, non un colore: «nemico in vista» invece
   di «allarme rosso» è il salto da una variabile che si chiama x a una che
   si chiama nemicoInVista. Dare il nome giusto a un fatto è metà del
   programmare, e qui il bambino lo esercita scegliendo dall'elenco quello
   che descrive davvero quello che è successo. Il colore resta, ma come
   vernice del filo che unisce chi chiama a chi ascolta. */
export const SEGNALI = [
  { id: 'nemico',  emoji: '👁️', nome: 'nemico in vista' },
  { id: 'libero',  emoji: '✅', nome: 'tutto libero' },
  { id: 'aperta',  emoji: '🚪', nome: 'porta aperta' },
  { id: 'aiuto',   emoji: '🆘', nome: 'aiuto' },
  { id: 'ciSiamo', emoji: '🏁', nome: 'ci siamo' },
]

/* ═══════════ LA SCALA DEI CONCETTI ═══════════
   Questa fila **non segue la trama**: segue come si impara. La trama le va
   dietro, e dove non ci riusciva è la trama che è stata riscritta.

   `n` è la posizione nella scala: serve a controllare che nessuna campagna
   torni indietro e che nessuna tappa chieda una cosa prima del suo turno
   (`verificaScala()`). */
export const CONCETTI = [
  { id: 'sequenza',    nome: 'La fila',            cosa: 'gli ordini si eseguono uno dopo l\'altro, dal primo all\'ultimo, e quello che non hai scritto non succede' },
  { id: 'prossimita',  nome: 'Da vicino',          cosa: 'un\'azione non cammina: per aprire una cosa bisogna già esserle davanti' },
  { id: 'prerequisiti',nome: 'Prima quello',       cosa: 'certe azioni ne pretendono un\'altra prima — la spada prima del mostro — e l\'ordine in cui si scrivono è la differenza fra vincere e perdere' },
  { id: 'astrazione',  nome: 'Un ordine per sei',  cosa: 'dire dove si va invece di nominare una per una le mete della strada: costa meno e soprattutto regge quando la stanza cambia' },
  { id: 'condizione',  nome: 'Se',                 cosa: 'un ordine con una guardia si esegue solo se la cosa è vera, e se non lo è si salta: è il modo di firmare un piano prima di sapere cosa si troverà' },
  { id: 'attesa',      nome: 'Aspetta che',        cosa: 'fermarsi finché un fatto succede, invece di contare i momenti e sperare che siano sempre gli stessi' },
  { id: 'eventi',      nome: 'Il segnale',         cosa: 'uno vede e tutti sanno: un\'unità chiama un fatto per nome, le altre hanno una lista che comincia con «quando arriva»' },
  { id: 'coordinamento', nome: 'In due',           cosa: 'due unità che dipendono l\'una dall\'altra per tutta la scena, non per un istante solo — e chi fa cosa lo decide chi lo sa fare' },
  { id: 'ripetizione', nome: 'Ancora e ancora',    cosa: 'la stessa cosa tante volte, scritta a mano: lunga da scrivere e fragile da cambiare — ed è il punto' },
  { id: 'ciclo',       nome: 'Finché',             cosa: 'la ripetizione detta in un ordine solo, con la condizione che dice quando smettere' },
  { id: 'piano-altrui',nome: 'Il piano dell\'altro', cosa: 'anche l\'avversario ha ordini firmati, e si possono leggere prima dei propri: non è fortuna, è lettura' },
  { id: 'bug',         nome: 'L\'errore dell\'altro', cosa: 'nel piano dell\'avversario c\'è uno sbaglio. Non va corretto: va usato' },
  { id: 'inversione',  nome: 'Dall\'altra parte',  cosa: 'si comanda chi difende, e chi attacca è il programma: pensare a dove passerà, non a dove è' },
  { id: 'debug',       nome: 'La crepa',           cosa: 'stavolta lo sbaglio è nel tuo piano: si riguarda la scena finché non si vede dov\'è' },
  { id: 'sintesi',     nome: 'Tutto insieme',      cosa: 'niente di nuovo nella cassetta: quello che c\'è va messo in fila' },
].map((c, n) => ({ ...c, n }))

export const CONCETTO = Object.fromEntries(CONCETTI.map(c => [c.id, c]))
export const gradinoDi = id => CONCETTO[id]?.n ?? -1

/* ═══════════ I PERSONAGGI, E COSA SANNO FARE ═══════════
   Servono a due cose e tutte e due contano: un'unità con un nome si comanda
   volentieri, e nella campagna della piccola sono metà del gioco.

   `sa` è l'elenco dei verbi che quell'unità sa eseguire, ed è **la ragione
   per cui una tappa ha più di un'unità**: se il compito lo sa fare uno
   solo, dare il compito giusto alla persona giusta diventa parte del
   pensiero. Nel dungeon la regola sta in una frase — **le serrature e gli
   ingranaggi li apre solo Gedeo, la spada la tiene solo Berto** — e da lì
   discendono la seconda tappa, l'ingranaggio, la botola e il drago.
   È una proprietà della creatura, non del livello: Lilla non impara ad
   aprire le porte alla terza tappa. */
export const AVVENTURIERI = [
  { id: 'mira',  emoji: '🔦', nome: 'Mira',  che: 'va avanti e porta la torcia',
    sa: ['vai', 'prendi', 'aspetta', 'chiama', 'segui', 'pattuglia'] },
  { id: 'berto', emoji: '🗡️', nome: 'Berto', che: 'quello grosso, e l\'unico che tiene una spada',
    sa: ['vai', 'prendi', 'attacca', 'aspetta', 'chiama', 'segui', 'pattuglia', 'difendi'] },
  { id: 'gedeo', emoji: '🧰', nome: 'Gedeo', che: 'l\'unico che apre serrature e capisce gli ingranaggi',
    sa: ['vai', 'prendi', 'apri', 'aspetta', 'chiama', 'segui', 'pattuglia'] },
  { id: 'lilla', emoji: '🎒', nome: 'Lilla', che: 'la più piccola, passa dove non passa nessuno',
    sa: ['vai', 'prendi', 'aspetta', 'chiama', 'segui'] },
]

export const ORCHI = [
  { id: 'grum',   emoji: '🪓', nome: 'Grum',   che: 'il capitano, e non è il più sveglio',
    sa: ['vai', 'prendi', 'attacca', 'aspetta', 'chiama', 'segui', 'pattuglia', 'difendi'] },
  { id: 'zanna',  emoji: '🛡️', nome: 'Zanna',  che: 'sta al portone e non si sposta: non fa la ronda',
    sa: ['vai', 'attacca', 'aspetta', 'chiama', 'segui', 'difendi'] },
  { id: 'mola',   emoji: '🔨', nome: 'Mola',   che: 'l\'unica che gira le manovelle e apre i portoni',
    sa: ['vai', 'prendi', 'apri', 'aspetta', 'chiama', 'segui', 'pattuglia'] },
  { id: 'occhio', emoji: '🔔', nome: 'Occhio', che: 'sta in torre, vede tutto e chiama',
    sa: ['vai', 'aspetta', 'chiama', 'pattuglia', 'difendi'] },
]

export const AMICI_NINA = [
  { id: 'nina',      emoji: '🧒', nome: 'Nina',        che: 'ha sempre fame',
    sa: ['vai', 'prendi', 'apri', 'aspetta', 'chiama', 'segui'] },
  { id: 'pippo',     emoji: '🐕', nome: 'Pippo',       che: 'il cane di Nina: corre e segue, ma non ha le mani',
    sa: ['vai', 'aspetta', 'chiama', 'segui', 'pattuglia'] },
  { id: 'draghetto', emoji: '🐉', nome: 'il draghetto', che: 'compie gli anni',
    sa: ['vai', 'aspetta', 'segui'] },
]

export const UNITA = Object.fromEntries(
  [...AVVENTURIERI, ...ORCHI, ...AMICI_NINA].map(u => [u.id, u]))

/* «Gedeo sa aprire?» — e le due cose che non sono verbi le usano tutti. */
export const saFare = (chi, ordine) => {
  const u = UNITA[chi]
  if (!u || !ORDINE[ordine]) return false
  return eVerbo(ordine) ? u.sa.includes(ordine) : true
}

/* ═══════════════════════════════════════════════════════════════════
   CAMPAGNA 1 — IL DUNGEON
   Tredici tappe. Una tappa è una ministoria e **lo stesso identico
   respiro** di un concetto: si scende una scalinata (la fila di ordini),
   si tira un chiavistello (da vicino), si incontrano i primi mostri
   (prima la spada), e così via fino al drago.

   Il par non sale sempre, ed è voluto: le tappe 4 e 10 sono quelle in cui
   una parola vecchia usata in un modo nuovo *accorcia* il piano invece di
   allungarlo, e si vede dal numero. È lo stesso disegno a coppie del
   laboratorio delle pozioni: prima si fatica a mano, poi arriva la cosa
   che toglie la fatica.
   ═══════════════════════════════════════════════════════════════════ */

/* ▲▲▲ IL NUMERO DA TARARE DAL VIVO ▲▲▲
   Quante volte, nella nona tappa, la stessa riga va riscritta a mano.
   È l'unico numero di tutto il file che **va misurato guardando giocare un
   bambino**, e non contando su una mappa: la nona tappa non porta un
   ordine nuovo, porta soltanto fatica, e la fatica è il suo contenuto —
   ma la fatica **satura**. Dopo otto o dieci righe identiche il messaggio
   «così è lungo» è già arrivato tutto, e quello che si aggiunge dopo non
   insegna più niente: annoia, e un bambino annoiato non arriva alla decima
   tappa, dove sta il regalo.

   Provala a 8, a 12, a 22 — si cambia qui e basta, e il par della nona e
   le due frasi che citano il numero (nella nona e nella decima) vengono
   dietro da sole. 10 è un'ipotesi, non una misura. */
const VOLTE_STATUE = 10

const DUNGEON = [
  { id: 'scalinata', emoji: '🕯️', nome: 'La scalinata',
    storia: 'Il dungeon è là sotto e la scalinata è l\'unica strada. Gli ordini si firmano qui in cima: più giù non si parla più.',
    concetto: 'sequenza',
    dritta: 'Scrivi la fila di ordini e poi guarda. Una meta alla volta — il pianerottolo, la svolta, il fondo, la porta — e ricordati che quello che non hai scritto non succede.',
    nuovo: ['vai'], unita: 1, attori: ['mira'], nemico: null,
    par: 4,
    varianti: [
      'la scalinata al lume di torcia, dritta fino alla porta',
      'la stessa scalinata, con l\'acqua che gocciola dal soffitto',
      'la stessa scalinata, e un ratto che attraversa: non fa niente, ma si vede',
    ] },

  { id: 'chiavistello', emoji: '🔩', nome: 'Il chiavistello',
    storia: 'In fondo alla scalinata c\'è una porta di ferro, e il chiavistello sta dalla nostra parte. Basta tirarlo: ma da lontano non si tira niente, e di serrature ci capisce solo Gedeo.',
    concetto: 'prossimita',
    dritta: '«Apri» non cammina. Porta Gedeo fin lì con una fila di «vai», una meta dopo l\'altra, e solo quando è davanti alla porta digli di aprire.',
    nuovo: ['apri'], unita: 1, attori: ['gedeo'], nemico: null,
    par: 5,
    varianti: [
      'una porta di ferro con il chiavistello',
      'nello stesso posto, un baule con il coperchio pesante',
      'nello stesso posto, una grata che scorre di lato',
    ] },

  { id: 'primi-mostri', emoji: '🐀', nome: 'I primi mostri',
    storia: 'Dietro la porta qualcosa si muove nel buio. Le spade sono nella rastrelliera all\'ingresso, e nessuno attacca un ratto gigante a mani vuote.',
    concetto: 'prerequisiti',
    dritta: 'Gli stessi ordini in un altro ordine sono un altro piano: prima la rastrelliera, poi il ratto. E la spada la prende Berto — Mira porta la torcia e non mena.',
    nuovo: ['prendi', 'attacca'], unita: 2, attori: ['mira', 'berto'], nemico: 'ratti giganti',
    par: 8,
    varianti: [
      'un ratto, e la rastrelliera vicino all\'ingresso',
      'due ratti, uno per angolo',
      'la rastrelliera è in fondo alla sala, i ratti stanno in mezzo',
    ] },

  /* La tappa dell'astrazione, e **non porta una parola nuova**: porta lo
     stesso «vai» delle prime tre puntato a un'altra specie di cosa. Fin
     qui una meta era una casella — l'angolo, la svolta, il fondo — e la
     fila diceva tutta la strada; qui la meta è la torcia, cioè una cosa
     che si sposta da una scena all'altra. Il par crolla da 8 a 3, e si
     vede sul contatore. */
  { id: 'colonne', emoji: '🏛️', nome: 'La sala delle colonne',
    storia: 'La sala è così grande che il fondo non si vede, e la torcia da accendere è appesa a una colonna. Nominare una per una le mete fin là dentro non finisce più — e il brutto è che ogni volta la colonna è un\'altra.',
    concetto: 'astrazione',
    nuovaIdea: 'lo stesso «vai», puntato alla cosa invece che alla casella: uno vale sei, e regge anche quando la cosa si è spostata',
    dritta: '«Vai alla torcia» costa un ordine invece di sei. Ma la ragione vera è un\'altra: sei mete nominate a mano non ci arrivano più se la torcia cambia colonna, «vai alla torcia» sì.',
    nuovo: [], unita: 2, attori: ['mira', 'berto'], nemico: null,
    par: 3,
    varianti: [
      'la torcia sulla colonna di destra',
      'la stessa sala, la torcia sulla colonna in fondo',
      'la sala è più larga e la torcia sta nel mezzo',
    ] },

  { id: 'corridoi', emoji: '🔀', nome: 'I due corridoi',
    storia: 'Due corridoi, e uno solo è aperto. Quale, lo si scopre arrivandoci. Gli ordini però si firmano prima di arrivarci.',
    concetto: 'condizione',
    dritta: 'Appendi «se» a un ordine e quell\'ordine, quando tocca a lui, guarda e decide: se la cosa non è vera si salta e il piano tira dritto. Due ordini con due «se» opposti coprono tutti e due i corridoi.',
    nuovo: ['se'], unita: 2, attori: ['mira', 'gedeo'], nemico: null,
    par: 7,
    varianti: [
      'è aperto il corridoio di destra',
      'è aperto quello di sinistra',
      'sono aperti tutti e due: si passa da quello che si trova per primo',
    ] },

  { id: 'saracinesca', emoji: '⛓️', nome: 'La saracinesca',
    storia: 'La saracinesca si alza da sola con un rumore di catene, resta su un po\' e poi ricade. Aspettare il momento giusto va bene. Contare fino a tre no, perché non è sempre tre.',
    concetto: 'attesa',
    dritta: '«Aspetta» prende due cose, e una è la trappola: «aspetta un momento» conta e spera, e funziona su una scena su tre. «Aspetta che la saracinesca è alzata» guarda la saracinesca, non l\'orologio. E occhio al «se»: una guardia guarda una volta sola, e se in quel momento la saracinesca è giù salta l\'ordine e nessuno lo rifà.',
    nuovo: ['aspetta'], unita: 2, attori: ['mira', 'gedeo'], nemico: null,
    par: 6,
    varianti: [
      'la saracinesca si alza dopo tre momenti',
      'dopo sette',
      'si alza subito ma resta su la metà del tempo',
    ] },

  { id: 'ingranaggio', emoji: '⚙️', nome: 'L\'ingranaggio',
    storia: 'L\'ingranaggio sta in una stanza e il ponte che alza sta in un\'altra. Chi gira la manovella non vede il ponte; chi è sul ponte non vede la manovella. Bisogna dirselo.',
    concetto: 'eventi',
    dritta: 'La manovella la gira Gedeo, che è l\'unico capace, e appena è girata chiama «🚪 porta aperta». Mira ha una seconda lista che parte solo quando arriva quel segnale. Nessuno dei due deve indovinare quanto ci mette l\'altro — e il segnale si sceglie per quello che dice, non per il colore.',
    nuovo: ['chiama', 'quando-arriva'], unita: 2, attori: ['gedeo', 'mira'], nemico: null,
    par: 8,
    varianti: [
      'manovella e ponte come sulla pianta',
      'la manovella è più lontana: girarla porta via il doppio del tempo',
      'davanti alla manovella c\'è una porta da aprire: nessuno sa quando Gedeo avrà finito',
    ] },

  /* Il coordinamento, e qui **le abilità sono il livello**: la botola la
     sa aprire solo Gedeo, quindi non può essere lui a tenere la piastra;
     la torcia ce l'ha Mira, quindi sotto si va dietro a lei. Chi fa cosa
     è già deciso prima di scrivere una riga, e il bambino lo scopre
     leggendo le unità invece che provando. */
  { id: 'botola', emoji: '🕳️', nome: 'La botola',
    storia: 'Sotto il tappeto c\'è una botola, e resta aperta solo finché qualcuno sta sulla piastra dall\'altra parte della sala. Aprirla sa farlo solo Gedeo, e sotto è buio: la torcia ce l\'ha Mira.',
    concetto: 'coordinamento',
    dritta: 'Gedeo apre la botola, quindi sulla piastra ci deve stare Lilla: non è una scelta, è l\'unica distribuzione che funziona. Sotto, copiare la strada di Mira in un altro piano regge una volta e poi si sfalsa — basta che lei si fermi un momento. «Segui Mira» non si sfalsa mai.',
    nuovo: ['segui'], unita: 3, attori: ['mira', 'gedeo', 'lilla'], nemico: null,
    par: 10,
    varianti: [
      'la piastra a destra, la botola nel mezzo',
      'la piastra in fondo alla sala: chi ci sta sopra arriva molto più tardi',
      'sotto, il pavimento buono fa una curva diversa',
    ] },

  /* Il livello più lungo della campagna, e senza un ordine nuovo. Sta qui
     apposta: la parola `pattuglia` la si regala alla tappa dopo, e la si
     regala a qualcuno che ha già scritto tante volte la stessa riga. Se
     arrivasse prima sarebbe una comodità; arrivando dopo è un sollievo, e
     un sollievo si ricorda.
     Quanto lunga sia la fatica è l'unico numero da tarare dal vivo:
     `VOLTE_STATUE`, in cima a questa campagna. */
  { id: 'statue', emoji: '🗿', nome: 'Il corridoio delle statue',
    storia: 'Le statue del corridoio si girano quando nessuno le guarda, e restano ferme finché qualcuno cammina avanti e indietro davanti a loro. Gli altri intanto lavorano in fondo.',
    concetto: 'ripetizione',
    dritta: `È il piano più lungo di tutta la campagna, e va scritto tutto: Berto va da un capo all'altro del corridoio ${VOLTE_STATUE} volte, e sono ${VOLTE_STATUE} righe uguali. Contale mentre le scrivi: alla prossima tappa ti serviranno per un motivo.`,
    nuovo: [], unita: 3, attori: ['berto', 'gedeo', 'lilla'], nemico: 'le statue',
    /* le VOLTE_STATUE righe della ronda a mano, più le quattro degli
       altri due che intanto lavorano in fondo */
    par: VOLTE_STATUE + 4,
    varianti: [
      'un corridoio con quattro statue',
      'lo stesso corridoio, più lungo',
      'sei statue e una svolta a metà',
    ] },

  { id: 'sala-buia', emoji: '🔁', nome: 'La sala buia',
    storia: `${VOLTE_STATUE} righe uguali, ieri, per tenere ferme le statue. Oggi nella cassetta c'è «pattuglia … finché», che è la stessa cosa detta in una riga sola — e serve subito, perché la chiave del tesoro è in un angolo della sala buia e non è sempre lo stesso angolo.`,
    concetto: 'ciclo',
    dritta: `La prima scena è il corridoio di ieri: rifallo e conta gli ordini, da ${VOLTE_STATUE} righe a una. Poi c'è la sala buia, dove una fila scritta a mano non basterebbe comunque, perché la chiave si sposta.`,
    nuovo: ['pattuglia'], unita: 3, attori: ['berto', 'gedeo', 'lilla'], nemico: 'le statue',
    par: 6,
    varianti: [
      'il corridoio delle statue della tappa scorsa, da rifare in un ordine',
      'la sala buia, con la chiave nell\'angolo a nord',
      'la sala buia, con la chiave a sud e una porta che si richiude',
    ] },

  { id: 'guardia', emoji: '📜', nome: 'La guardia del tesoro',
    storia: 'Davanti alla porta del tesoro c\'è un ogre che non dorme mai. I suoi ordini però sono scritti su una tavola appesa al muro, e si leggono prima di firmare i nostri.',
    concetto: 'piano-altrui',
    dritta: 'Non serve batterlo: serve sapere dov\'è. Leggi il suo giro, trova il momento in cui dà le spalle alla porta, e fai partire il tuo da lì — e ricordati che la porta la apre solo Gedeo, quindi è lui che deve essere lì in quel momento.',
    nuovo: [], unita: 3, attori: ['mira', 'lilla', 'gedeo'], nemico: 'l\'ogre',
    pianoVisibile: true,
    par: 10,
    varianti: [
      'l\'ogre fa avanti e indietro davanti alla porta',
      'lo stesso giro, ma parte dall\'altro capo',
      'l\'ogre si ferma a bere: il suo giro dura di più',
    ] },

  { id: 'portone', emoji: '🐞', nome: 'Il portone',
    storia: 'Anche il capitano degli orchi ha firmato i suoi ordini, e uno è sbagliato: apre il portone e solo dopo guarda chi c\'è fuori. Nessuno gliel\'ha detto. Non va corretto: va usato.',
    concetto: 'bug',
    dritta: 'Leggi il suo piano riga per riga e cerca le due che stanno nell\'ordine sbagliato. Poi mettiti dove ti conviene essere nel momento in cui le esegue.',
    nuovo: [], unita: 4, attori: ['mira', 'berto', 'gedeo', 'lilla'], nemico: 'il capitano Grum',
    pianoVisibile: true,
    bug: 'Grum apre il portone e solo dopo controlla chi c\'è fuori: fra le due righe c\'è un momento in cui il portone è aperto e lui non guarda',
    par: 11,
    varianti: [
      'il capitano da solo',
      'il capitano e una sentinella sulle mura',
      'la sentinella chiama «👁️ nemico in vista»: Grum lo sente, ma le sue due righe restano in quell\'ordine',
    ] },

  { id: 'cuore', emoji: '🐲', nome: 'Il cuore del dungeon',
    storia: 'L\'ultima sala ha quattro porte, due leve, un drago che dorme e nessun ordine nuovo. Tutto quello che serve è già stato imparato: qui si tratta di metterlo in fila.',
    concetto: 'sintesi',
    dritta: 'Nessuna parola nuova. Guarda la sala, decidi chi fa cosa — le porte e le leve sono di Gedeo, il drago di Berto — e ricordati che il drago si sveglia col rumore: le leve vanno tirate nell\'ordine giusto.',
    nuovo: [], unita: 4, attori: ['mira', 'berto', 'gedeo', 'lilla'], nemico: 'il drago',
    pianoVisibile: true,
    par: 18,
    varianti: [
      'quattro porte, due leve, il drago dorme',
      'una leva è già abbassata e una porta è chiusa a chiave',
      'il drago si sveglia a metà scena',
    ] },
]

/* ═══════════════════════════════════════════════════════════════════
   CAMPAGNA 2 — NINA E IL DRAGHETTO
   Sei tappe per chi ha sei anni e legge male. Regole che valgono solo qui:

     · **una riga di storia, dieci parole al massimo**, parole di tutti i
       giorni. Chi non le legge se le fa leggere, e non perde niente;
     · **niente condizioni, niente segnali, niente cicli**: si arriva alla
       fila di ordini e ai prerequisiti, e si finisce lì;
     · **i personaggi hanno un nome e il premio si vede**. Non c'è un solo
       livello che finisca con «superato»: finisce con la mela, la chiave,
       il cane fuori dal recinto, la torta sul tavolo;
     · **niente si perde**. La scena può non riuscire, e allora si riguarda.

   La quinta tappa è la gemella della quarta del dungeon: la parola non
   cambia, cambia dove si punta. Fin lì Nina va di meta in meta — il sasso,
   la panchina, l'albero — e nel prato grande scopre che si può dire dove
   si vuole arrivare e basta.
   ═══════════════════════════════════════════════════════════════════ */

const NINA = [
  { id: 'mela', emoji: '🍎', nome: 'La mela',
    storia: 'Nina ha fame. La mela è in fondo al prato.',
    concetto: 'sequenza',
    dritta: 'Un ordine alla volta, dal primo all\'ultimo. Dille dove andare, un posto per volta.',
    nuovo: ['vai'], unita: 1, attori: ['nina'],
    par: 3,
    varianti: ['il prato con le margherite', 'lo stesso prato di sera', 'lo stesso prato, e una farfalla'] },

  { id: 'chiave', emoji: '🔑', nome: 'La chiave',
    storia: 'La chiave è nell\'erba. Nina la vuole.',
    concetto: 'prossimita',
    dritta: 'Per prendere una cosa bisogna esserci sopra.',
    nuovo: ['prendi'], unita: 1, attori: ['nina'],
    par: 4,
    varianti: ['la chiave nell\'erba alta', 'la chiave vicino al sasso', 'la chiave sotto la panchina'] },

  { id: 'porta', emoji: '🚪', nome: 'La porta',
    storia: 'La porta dell\'orto è chiusa. Nina va e apre.',
    concetto: 'prossimita',
    dritta: 'Da lontano non si apre niente. Prima arrivarci, poi aprire.',
    nuovo: ['apri'], unita: 1, attori: ['nina'],
    par: 4,
    varianti: ['la porta di legno', 'la stessa porta, con il gatto sopra', 'la stessa porta, e piove'] },

  { id: 'cancello', emoji: '🐾', nome: 'Pippo',
    storia: 'Pippo è nel recinto. Prima la chiave, poi il cancello.',
    concetto: 'prerequisiti',
    dritta: 'Senza chiave il cancello non si apre.',
    nuovo: [], unita: 1, attori: ['nina', 'pippo'],
    par: 5,
    varianti: ['la chiave sul muretto', 'la chiave dietro il fienile', 'due cancelli e una chiave sola'] },

  { id: 'prato-grande', emoji: '🌾', nome: 'Il prato grande',
    storia: 'Il prato è grande. Nina dice dove va.',
    concetto: 'astrazione',
    nuovaIdea: 'lo stesso «vai» di sempre, ma puntato all\'albero invece che a sei posti in fila: uno vale sei',
    dritta: '«Vai all\'albero» vale sei posti in fila.',
    /* Pippo qui corre e basta: comandarlo è la novità della tappa dopo */
    nuovo: [], unita: 1, attori: ['nina'],
    par: 3,
    varianti: ['l\'albero a destra', 'l\'albero in fondo', 'l\'albero dall\'altra parte'] },

  { id: 'festa', emoji: '🎂', nome: 'La festa',
    storia: 'Il draghetto fa gli anni. Torta e candele!',
    concetto: 'sintesi',
    dritta: 'Due amici, due liste di ordini. Pippo non ha le mani: la torta e le candele le porta Nina. Lui sa correre e basta, e allora mandalo dal draghetto.',
    nuovo: [], unita: 2, attori: ['nina', 'pippo', 'draghetto'],
    par: 7,
    varianti: ['la torta in cucina', 'la torta in dispensa, chiusa a chiave', 'le candele sono due e stanno lontane'] },
]

/* ═══════════════════════════════════════════════════════════════════
   CAMPAGNA 3 — LA FORTEZZA DEGLI ORCHI (invertita)
   Si apre a dungeon finito, e si comanda l'altra parte: gli avventurieri
   diventano il programma, gli orchi diventano i tuoi.

   La cassetta parte piena — chi arriva qui sa già tutto — quindi la
   campagna non può vivere di ordini nuovi. Vive di **tre mestieri che dal
   lato dell'attacco non esistono**: mettersi dove l'altro passerà invece di
   inseguirlo; coprire un buco nel tempo e non nello spazio; e trovare
   l'errore nel piano proprio invece che in quello altrui. `difendi` è
   l'unica parola nuova, ed entra dove serve: alla prima riga.

   E c'è una quarta cosa, che dal lato dell'attacco c'era ma contava meno:
   **gli orchi sanno fare cose diverse**. Zanna non fa la ronda e Mola non
   mena: metà delle domande di questa campagna si risolvono leggendo le
   unità.
   ═══════════════════════════════════════════════════════════════════ */

const FORTEZZA = [
  { id: 'turno', emoji: '🛡️', nome: 'Il turno di guardia',
    storia: 'Stavolta la fortezza è nostra. Gli avventurieri sono là fuori, i loro ordini sono già scritti e si leggono: quello che manca è qualcuno che stia dove passeranno.',
    concetto: 'inversione',
    dritta: 'Non inseguirli. Leggi dove vanno e mettici Zanna prima che ci arrivino: «difendi il portone» vuol dire restare lì anche quando sembra che non serva.',
    nuovo: ['difendi'], unita: 2, attori: ['zanna', 'grum'], nemico: 'gli avventurieri',
    pianoVisibile: true,
    par: 8,
    varianti: [
      'tre avventurieri e una porta sola',
      'gli stessi tre entrano dal lato opposto',
      'uno resta fuori a fare da richiamo',
    ] },

  { id: 'ronda', emoji: '🧱', nome: 'La ronda sulle mura',
    storia: 'Le mura sono lunghe e gli orchi sono due. Chi cammina non può essere in due posti, quindi la domanda non è dove mettersi: è per quanto tempo un pezzo di muro resta scoperto.',
    concetto: 'ciclo', ripasso: true,
    nuovaIdea: 'una pattuglia non copre uno spazio: copre uno spazio ogni tanto. Il buco che lascia è nel tempo, e si misura',
    dritta: 'Zanna al portone non si sposta, quindi la ronda è di Mola: una sola, e lunga quanto decidi tu. Una pattuglia lunga copre tanto muro e lo copre di rado. Guarda quando arrivano loro, poi decidi quanto larga farla.',
    nuovo: [], unita: 2, attori: ['zanna', 'mola'], nemico: 'gli avventurieri',
    pianoVisibile: true,
    par: 7,
    varianti: [
      'entrano da nord appena comincia',
      'entrano da sud, più tardi',
      'aspettano che la ronda si allontani e poi scavalcano',
    ] },

  { id: 'vedetta', emoji: '🔔', nome: 'La vedetta',
    storia: 'Dalla torre si vede tutto e non si difende niente. Occhio lassù vale gli altri tre, ma solo se dice quello che vede, e solo se gli altri hanno una lista che comincia con «quando arriva».',
    concetto: 'eventi', ripasso: true,
    nuovaIdea: 'nel dungeon il segnale si ascoltava; qui si decide chi lo chiama e quale — e un segnale che dice solo «sono arrivati» non basta a nessuno',
    dritta: 'Un segnale solo non basta se entrano da due parti: appendi un «se» alla chiamata e Occhio sceglie quale nome dire — «👁️ nemico in vista» o «🚪 porta aperta» — e chi lo sente va in due posti diversi.',
    nuovo: [], unita: 3, attori: ['occhio', 'zanna', 'mola'], nemico: 'gli avventurieri',
    pianoVisibile: true,
    par: 10,
    varianti: [
      'entrano in tre dallo stesso lato',
      'si dividono in due gruppi',
      'uno finge di entrare da nord mentre gli altri passano da sud',
    ] },

  /* L'unico livello di tutte e tre le campagne che arriva col piano già
     scritto. È la mossa che rende possibile insegnare il debug: un errore
     nel proprio piano si trova solo se il piano c'era già e la scena si
     può rivedere quante volte si vuole. */
  { id: 'crepa', emoji: '🩹', nome: 'La crepa',
    storia: 'Il piano di ieri notte è ancora appeso al muro, e la fortezza è caduta lo stesso. Non è colpa degli avventurieri: nel piano c\'è una crepa, e la scena si riguarda finché non si trova dov\'è.',
    concetto: 'debug',
    dritta: 'Guarda la scena una volta senza toccare niente e segnati il momento in cui entrano. Poi torna indietro e guarda cosa stavano facendo i due del cortile in quel momento.',
    nuovo: [], unita: 3, attori: ['grum', 'zanna', 'mola'], nemico: 'gli avventurieri',
    pianoVisibile: true, pianoDato: true,
    bug: 'i due orchi del cortile hanno ricevuto lo stesso ordine, quindi lasciano lo stesso cancello nello stesso momento e l\'altro non lo guarda nessuno',
    par: 10,
    varianti: [
      'la scena persa di ieri notte, da guardare',
      'gli avventurieri arrivano prima',
      'gli avventurieri sono quattro',
    ] },

  { id: 'notte', emoji: '🌑', nome: 'La notte lunga',
    storia: 'Quattro orchi, sei avventurieri, due portoni e nessun ordine nuovo. Se la fortezza regge fino all\'alba, il dungeon resta nostro.',
    concetto: 'sintesi',
    dritta: 'Il piano degli avventurieri è lungo e si legge tutto. Leggilo prima: metà del lavoro è già lì dentro. E i portoni li apre e li chiude solo Mola, quindi il suo giro va scritto per primo.',
    nuovo: [], unita: 4, attori: ['grum', 'zanna', 'mola', 'occhio'], nemico: 'gli avventurieri',
    pianoVisibile: true,
    par: 16,
    varianti: [
      'entrano tutti insieme dal portone grande',
      'si dividono in tre gruppi e uno fa il giro largo',
      'uno di loro sa del segnale e lo fa chiamare apposta',
    ] },
]

/* ═══════════ LE CAMPAGNE ═══════════
   `cassetta` è la cassetta di partenza; a ogni tappa si aggiunge quello che
   dice `nuovo` e non si toglie mai niente — quello di prima resta dentro,
   come il ripasso nelle tappe delle lingue. Da qui viene anche la garanzia
   che nessuna tappa possa usare un ordine non ancora introdotto: non è una
   convenzione da rispettare a mano, è come sono costruiti i dati. */

function conCassetta(camp) {
  let cassetta = [...(camp.cassetta || [])]
  const tappe = camp.tappe.map((t, n) => {
    cassetta = [...cassetta, ...(t.nuovo || [])]
    return {
      ...t, n, campagna: camp.id,
      cassetta: [...cassetta],
      pianoVisibile: !!t.pianoVisibile,
      pianoDato: !!t.pianoDato,
      ripasso: !!t.ripasso,
      nuovaIdea: t.nuovaIdea || CONCETTO[t.concetto]?.cosa || '',
      bug: t.bug || null,
      /* ─────────────────────────────────────────────────────────────
         ▼▼▼ QUI VA LA MAPPA ▼▼▼
         Il formato lo sta definendo un altro pezzo di lavoro. Quando
         c'è, questo campo diventa la mappa della tappa; le tre scene
         che ne devono uscire sono descritte in `varianti`.
         `senzaMappa()` elenca tutte le tappe ancora scoperte.
         ───────────────────────────────────────────────────────────── */
      mappa: t.mappa ?? null,
    }
  })
  return { ...camp, tappe }
}

export const CAMPAGNE = [
  { id: 'dungeon', nome: 'Il dungeon', emoji: '🏚️',
    sottotitolo: 'Quattro avventurieri, una scala che scende e nessuno che li richiama',
    per: 'la campagna principale: l\'arco intero, dalla fila di ordini al drago',
    richiede: null, cassetta: [], tappe: DUNGEON },

  { id: 'nina', nome: 'Nina e il draghetto', emoji: '🐉',
    sottotitolo: 'Una bambina, un cane e una festa da preparare',
    per: 'chi ha sei anni: si comincia da qui, e non ci sono parole difficili',
    richiede: null, cassetta: [], tappe: NINA },

  { id: 'fortezza', nome: 'La fortezza degli orchi', emoji: '🏰',
    sottotitolo: 'Stavolta i tuoi sono quelli dentro, e gli altri hanno un piano',
    per: 'chi ha finito il dungeon: si comanda chi difende',
    richiede: 'dungeon',
    /* parte piena: chi arriva qui ha già la cassetta del dungeon in mano */
    cassetta: VOCABOLARIO.filter(o => o.id !== 'difendi').map(o => o.id),
    tappe: FORTEZZA },
].map(conCassetta)

export const CAMPAGNA = Object.fromEntries(CAMPAGNE.map(c => [c.id, c]))
export const campagnaDi = id => CAMPAGNA[id] ?? null
export const tappaDi = (id, n) => CAMPAGNA[id]?.tappe[n] ?? null
export const quanteTappe = id => CAMPAGNA[id]?.tappe.length ?? 0

/* Lo sblocco è una fila: la tappa n si apre quando la n−1 è superata, e la
   prima è sempre aperta. Le campagne si sbloccano fra loro con `richiede`,
   che oggi serve solo alla fortezza. La campagna di Nina non richiede
   niente apposta: chi ha sei anni non deve aspettare il fratello. */
export const tappaAperta = (id, n, superate = 0) => n <= superate
export const campagnaAperta = (id, finite = []) => {
  const c = CAMPAGNA[id]
  return !!c && (!c.richiede || finite.includes(c.richiede))
}

/* ═══════════ STELLE E MONETE ═══════════
   Una tappa si supera vincendo **tutte e tre** le scene, in qualunque modo:
   fra una scena e l'altra il piano si può riaprire e correggere, se no un
   bambino di sei anni non finisce la prima tappa.

   Le due stelle sono un'altra cosa, e sono il vero esercizio: **un piano
   solo**, firmato una volta, che vince tutte e tre le scene, entro il par.
   È lì che «se», «aspetta che» e «pattuglia … finché» smettono di essere
   parole eleganti e diventano l'unico modo. */
export function stelle({ vinte = 0, ordini = Infinity, unPiano = false } = {}, tappa) {
  if (vinte < 3) return 0
  return unPiano && ordini <= tappa.par ? 2 : 1
}

/* Le monete con lo stesso metro degli altri giochi: si contano gli ordini
   che la tappa chiede davvero — il par per le tre scene — e se ne paga uno
   ogni quindici. Uno ogni dieci come nelle lingue sarebbe troppo: firmare
   un ordine costa meno di un'operazione in colonna.
   Se un giorno il Generale risultasse pagato poco — con i passi via, i
   piani sono più corti — la leva è **questo metro**, non i par: i par si
   misurano, non si gonfiano. */
export const premioTappa = t => Math.max(1, Math.round(t.par * 3 / 15))

/* ═══════════ ATTREZZI PER CHI LAVORA A QUESTI DATI ═══════════ */

/* Le tappe che aspettano ancora una mappa: oggi tutte. Serve a chi disegna
   per sapere quante gliene mancano, e domani per accorgersi se una tappa
   nuova è entrata senza la sua. */
export const senzaMappa = () =>
  CAMPAGNE.flatMap(c => c.tappe.filter(t => !t.mappa).map(t => c.id + '/' + t.id))

/* Le cose che a occhio si sbagliano e che un test di unità potrà chiedere
   a questa funzione invece di riscriversele:
     1. nessuna tappa porta un ordine che non esiste (i passi, per dire);
     2. dentro una campagna i concetti non tornano indietro nella scala;
     3. ogni tappa ha tre scene e un par intero e positivo;
     4. le unità sanno fare solo verbi veri, e in ogni tappa che porta un
        ordine nuovo c'è **qualcuno capace di eseguirlo** — se no la
        cassetta cresce di una parola che in scena non serve a nessuno.
   Il secondo controllo salta due casi, tutti e due voluti: le tappe di
   `sintesi`, che stanno in fondo per definizione, e le tappe segnate
   `ripasso` — la fortezza ripassa segnali e cicli dal lato di chi difende,
   e non è un passo indietro, è lo stesso gradino girato. Un concetto che si
   ripete su due tappe di fila è ammesso: la piccola impara «da vicino» due
   volte, con due gesti diversi. */
export function verificaScala() {
  const guai = []

  for (const u of Object.values(UNITA))
    for (const v of u.sa || [])
      if (!eVerbo(v)) guai.push(`${u.id}: «${v}» non è un verbo che si possa sapere`)

  for (const c of CAMPAGNE) {
    let alto = -1
    for (const t of c.tappe) {
      for (const o of t.nuovo || []) {
        if (!ORDINE[o]) { guai.push(`${c.id}/${t.id}: ordine sconosciuto «${o}»`); continue }
        if (eVerbo(o) && !(t.attori || []).some(a => saFare(a, o)))
          guai.push(`${c.id}/${t.id}: porta «${o}» ma in scena non lo sa fare nessuno`)
      }
      if (!Number.isInteger(t.par) || t.par < 1) guai.push(`${c.id}/${t.id}: par storto`)
      if (!CONCETTO[t.concetto]) { guai.push(`${c.id}/${t.id}: concetto sconosciuto`); continue }
      if (t.concetto === 'sintesi' || t.ripasso) continue
      const g = gradinoDi(t.concetto)
      if (g < alto) guai.push(`${c.id}/${t.id}: «${t.concetto}» torna indietro nella scala`)
      alto = Math.max(alto, g)
    }
    if (c.tappe.some(t => t.varianti?.length !== 3)) guai.push(`${c.id}: una tappa non ha tre varianti`)
  }
  return guai
}
