/* ═══════════════════════════════════════════════════════════════════
   LE STORIE DEL GENERALE — cinque storie a capitoli.

   Le tre campagne di `campagne-generale.js` insegnano il vocabolario:
   una tappa, un ordine nuovo, e si sale la scala. Fanno il loro lavoro e
   restano dove sono. Il guaio è che quasi tutte finiscono nello stesso
   modo — vai dalla chiave, mena il mostro, apri la porta, prendi il
   tesoro — e un bambino che l'ha fatto quattro volte ha imparato i
   tasti, non il mestiere.

   Queste cinque storie stanno all'altra estremità. Il vocabolario è già
   noto (o si impara strada facendo, ma non è il punto), e quello che
   cambia sono due cose sole:

     1. **la forma dell'obiettivo** — undici forme diverse, e dentro una
        storia due capitoli di fila non hanno mai la stessa. «Arrivare al
        tesoro» è la dodicesima, ed è l'unica che in tutte e cinque non
        compare mai;
     2. **i fili** — quello che un capitolo lascia e un altro eredita. La
        lanterna presa nel primo capitolo serve fino al sesto, la porta
        lasciata aperta nel secondo è la via di fuga del quinto, la capra
        piantata di là dal crinale va ripresa. È l'unica cosa che
        trasforma una fila di esercizi in una storia, e insegna una cosa
        vera: le conseguenze durano oltre il momento in cui agisci.

   **Le mappe non stanno qui.** Ogni capitolo ha `mappa: null` — le
   disegna un altro pezzo di lavoro, un agente per livello. Quello che
   una storia dice al disegnatore sta in `varianti` (cosa cambia fra le
   tre scene) e in `obiettivo` (quando è vinta).

   **I par sono provvisori** come quelli delle campagne: sono contati sul
   piano più corto che si riesce a scrivere sulla mappa che avevamo in
   testa. Quando la mappa esiste si rimisurano giocandola.
   ═══════════════════════════════════════════════════════════════════ */

/* La scala dei concetti è **una sola** in tutto il Generale, e sta nelle
   campagne: qui non se ne inventa una seconda. Si importa e basta. */
import { CONCETTI, CONCETTO, gradinoDi } from './campagne-generale.js'
export { CONCETTI, CONCETTO, gradinoDi }

/* ═══════════ IL VOCABOLARIO ═══════════
   Nove ordini, ed è quello che il motore sa già eseguire. Due avvertenze
   per chi arriva da `campagne-generale.js`:

     · il verbo dei segnali si chiama **`suona`**, non «chiama»: è il nome
       che usa il motore (`data/generale.js`), e questo file sta dalla
       parte del motore;
     · `segui` e `difendi` **non ci sono**. Le campagne li nominano, il
       motore no, e nessuna di queste cinque storie ne ha bisogno: chi
       deve stare addosso a qualcuno lo fa con `vai` e `aspetta`, chi deve
       tenere un posto lo fa con `pattuglia … finché`.

   Quello che manca davvero — e che due o tre capitoli qui sotto
   girerebbero meglio se ci fosse — è scritto in fondo, in `PROPOSTE`.
   Non è dato per scontato da nessuna parte: nessun capitolo lo usa. */
export const GRADI = {
  posto:     'una meta alla volta: la fila di «vai» che dice tutta la strada',
  compito:   'si dice la cosa da fare e non come farla',
  strategia: 'un comportamento che dura nel tempo, e da solo vale dieci mete',
  guardia:   'non è un verbo: si appende a un ordine e decide se tocca a lui',
  script:    'non è un verbo: è la testa di una lista che parte a un segnale',
}

export const VOCABOLARIO = [
  { id: 'vai',           grado: 'posto',     forma: 'vai a [x]',
    nota: 'puntato a una casella è il gradino basso; puntato a una cosa da fare è quello di mezzo' },
  { id: 'prendi',        grado: 'compito',   forma: 'prendi [x]' },
  { id: 'apri',          grado: 'compito',   forma: 'apri [x]', nota: 'vuole la chiave addosso' },
  { id: 'attacca',       grado: 'compito',   forma: 'attacca [x]',
    nota: 'non è gratis: chi le prende chiama, e chi sente accorre' },
  { id: 'aspetta',       grado: 'compito',   forma: 'aspetta [x]',
    nota: 'prende un fatto — la porta, la guardia, un segnale' },
  { id: 'suona',         grado: 'compito',   forma: 'suona [segnale]' },
  { id: 'pattuglia',     grado: 'strategia', forma: 'pattuglia [punti] finché [cond]' },
  { id: 'se',            grado: 'guardia',   forma: '… se [cond]',
    nota: 'guarda una volta sola, quando tocca a quell\'ordine' },
  { id: 'quando-arriva', grado: 'script',    forma: 'quando arriva [segnale] …' },
]

export const ORDINE = Object.fromEntries(VOCABOLARIO.map(o => [o.id, o]))
export const eVerbo = id => !!ORDINE[id] && ORDINE[id].grado !== 'guardia' && ORDINE[id].grado !== 'script'
export const VERBI = VOCABOLARIO.filter(o => eVerbo(o.id)).map(o => o.id)

/* ═══════════ LE CONDIZIONI SONO SOLO PERCETTIVE ═══════════
   **Nessuno è onnisciente.** Una guardia `se`, la coda di un `pattuglia
   … finché` e un `aspetta` possono guardare soltanto quattro cose, e
   sono tutte cose che quell'unità lì può sapere da sola:

     vedi      quello che ha davanti agli occhi, adesso
     ho        quello che ha addosso
     sono      dove si trova
     arrivato  un segnale che le è arrivato

   Da qui discende metà del disegno di queste storie: quello che succede
   fuori dalla vista di un'unità **deve passare per un annuncio**, e per
   questo `suona` e `quando arriva` non sono un ordine elegante ma
   l'unico modo. E da qui discende anche il diversivo: se il nemico
   guarda solo quello che vede, farsi vedere apposta da un'altra parte è
   una mossa. */
export const CONDIZIONI = [
  { id: 'vedi',     forma: 'vedi [x]',           cosa: 'ce l\'ha davanti agli occhi in questo momento' },
  { id: 'ho',       forma: 'ho [x]',             cosa: 'ce l\'ha addosso' },
  { id: 'sono',     forma: 'sono a [x]',         cosa: 'si trova lì' },
  { id: 'arrivato', forma: 'è arrivato [segnale]', cosa: 'quel segnale le è stato suonato' },
]

/* ═══════════ I SEGNALI ═══════════
   Come nelle campagne: un nome vero, non un colore. */
export const SEGNALI = [
  { id: 'nemico',  emoji: '👁️', nome: 'nemico in vista' },
  { id: 'libero',  emoji: '✅', nome: 'tutto libero' },
  { id: 'aperta',  emoji: '🚪', nome: 'porta aperta' },
  { id: 'aiuto',   emoji: '🆘', nome: 'aiuto' },
  { id: 'ciSiamo', emoji: '🏁', nome: 'ci siamo' },
  { id: 'via',     emoji: '🏃', nome: 'via, adesso' },
]

/* ═══════════ LE FORME DELL'OBIETTIVO ═══════════
   È la prima delle due leve, ed è la risposta alla frase da cui sono
   nate queste storie: «deve esserci qualcosa che ti impedisce di fare un
   gameplay banale sempre uguale».

   Un obiettivo di forma diversa non è un vestito diverso sulla stessa
   partita: cambia **cosa conta**. In una `traversata` chi ti vede ha già
   vinto anche se non ti tocca; in una `resistenza` il tempo è
   l'avversario e non lo spazio; in un'`esca` la cosa migliore che puoi
   fare è farti trovare. Gli stessi nove ordini, tre mestieri diversi.

   La regola che tiene: **dentro una storia due capitoli di fila non
   hanno mai la stessa forma** (`verificaStorie()` lo controlla). E in
   queste cinque, per come sono venute, non si ripete mai nemmeno una
   forma dentro la stessa storia. */
export const FORME = [
  { id: 'presa',       nome: 'Portarsela a casa',   cosa: 'alla fine quella cosa lì deve essere addosso a uno dei tuoi. Dove sono, non conta' },
  { id: 'consegna',    nome: 'Da qui a là',         cosa: 'un oggetto deve arrivare in un posto — e spesso chi lo trova non è chi lo porta' },
  { id: 'passaggio',   nome: 'Passare senza',       cosa: 'attraversare un tratto senza farsi vedere: chi ti vede chiama, e allora hai perso anche se non ti ha toccato' },
  { id: 'scorta',      nome: 'Portalo intero',      cosa: 'qualcuno che non sa difendersi deve arrivare fin là. Tu ci arrivi facile: il problema è lui' },
  { id: 'esca',        nome: 'Guardate me',         cosa: 'alla meta ci arriva un altro, mentre tu ti fai guardare. Farsi vedere è la mossa, non l\'errore' },
  { id: 'apripista',   nome: 'Aprire la strada',    cosa: 'la strada deve restare aperta per quelli che passano dopo, e chi apre non è chi passa' },
  { id: 'sabotaggio',  nome: 'Farla smettere',      cosa: 'una cosa deve smettere di funzionare: un tamburo, una scala, una sbarra' },
  { id: 'resistenza',  nome: 'Tenere duro',         cosa: 'restare dove sei finché un fatto succede. L\'avversario qui è il tempo' },
  { id: 'interdizione',nome: 'Di qui non passi',    cosa: 'impedire che l\'altro arrivi da qualche parte: si vince stando dove passerà, non inseguendolo' },
  { id: 'fuga',        nome: 'Uscirne',             cosa: 'tornare fuori da dove si è entrati, e tutti quanti: chi resta indietro fa perdere' },
  { id: 'raduno',      nome: 'Tutti qui',           cosa: 'unità sparse che devono ritrovarsi nello stesso posto, o riprendersi uno che è rimasto indietro' },

  /* La dodicesima, e sta in fondo per un motivo. */
  { id: 'arrivo',      nome: 'Arrivare al tesoro',  cosa: 'uno dei tuoi arriva sul forziere. È la forma di quasi tutti i livelli esistenti, ed è quella che in queste cinque storie **non compare mai**' },
]

export const FORMA = Object.fromEntries(FORME.map(f => [f.id, f]))

/* ═══════════ CHI C'È, E COSA SA FARE ═══════════
   `sa` è l'elenco dei verbi che quell'unità sa eseguire. Come nelle
   campagne, è la ragione per cui un capitolo ha più di un'unità: se il
   compito lo sa fare uno solo, dare il compito giusto alla persona
   giusta è già mezzo piano. Qui però serve anche a un'altra cosa —
   **tiene fuori le soluzioni banali**. Se nessuno dei tuoi sa `attacca`,
   il problema non si può risolvere menando; se chi vede lontano non sa
   prendere niente, l'informazione deve viaggiare. */

/* Storia 1 — quattro che rubano nella miniera sotto il paese */
const MINATORI = [
  { id: 'tilde', emoji: '🏮', nome: 'Tilde', che: 'la lanternaia: porta la luce e vede al buio, e non mena nessuno',
    sa: ['vai', 'prendi', 'aspetta', 'suona'] },
  { id: 'ras',   emoji: '🗝️', nome: 'Ras',   che: 'il ferravecchi: l\'unico che apre grate, lucchetti e serrature',
    sa: ['vai', 'prendi', 'apri', 'aspetta', 'suona'] },
  { id: 'orso',  emoji: '🪓', nome: 'Orso',  che: 'il boscaiolo: lento, e l\'unico che rompe qualcosa',
    sa: ['vai', 'attacca', 'aspetta', 'suona'] },
  { id: 'bea',   emoji: '🔔', nome: 'Bea',   che: 'la staffetta: corre, si fa vedere e sparisce. Non tiene un colpo',
    sa: ['vai', 'aspetta', 'suona', 'pattuglia'] },
]

/* Storia 2 — il cortile di casa, per chi ha sei anni */
const CORTILE = [
  { id: 'rosa', emoji: '👧', nome: 'Rosa', che: 'ha una papera e le vuole bene',
    sa: ['vai', 'prendi', 'apri', 'aspetta'] },
  { id: 'bibi', emoji: '🦆', nome: 'Bibi', che: 'la papera: non ascolta nessuno, ascolta il pane',
    sa: ['vai', 'aspetta'] },
]

/* Storia 3 — i draghi, cioè quelli che di solito sono il nemico */
const DRAGHI = [
  { id: 'brasa',  emoji: '🐲', nome: 'Brasa',  che: 'la madre: grande e lenta, e nei cunicoli stretti non ci passa',
    sa: ['vai', 'attacca', 'aspetta', 'suona'] },
  { id: 'cenere', emoji: '🐉', nome: 'Cenere', che: 'il draghetto: piccolo, nero, veloce, e non attacca nessuno',
    sa: ['vai', 'prendi', 'aspetta', 'suona'] },
  { id: 'fumo',   emoji: '🦇', nome: 'Fumo',   che: 'il pipistrello: vede lontano al buio, ma non prende e non mena',
    sa: ['vai', 'aspetta', 'suona', 'pattuglia'] },
  { id: 'roccia', emoji: '🪨', nome: 'Roccia', che: 'il guardiano di pietra: non corre e non si stanca mai',
    sa: ['vai', 'attacca', 'aspetta'] },
]

/* Storia 4 — la carovana: tante unità e nessuna che vale da sola */
const CAROVANA = [
  { id: 'rea',  emoji: '🧓', nome: 'nonna Rea', che: 'guida il carro: va piano, non mena e non lascia il carro',
    sa: ['vai', 'aspetta', 'suona'] },
  { id: 'vito', emoji: '🛡️', nome: 'Vito',      che: 'la scorta: l\'unico che regge un colpo, e l\'unico che ne dà',
    sa: ['vai', 'attacca', 'aspetta', 'suona', 'pattuglia'] },
  { id: 'bugo', emoji: '🔧', nome: 'Bugo',      che: 'il carradore: apre sbarre, casse e lucchetti, e carica il carro',
    sa: ['vai', 'prendi', 'apri', 'aspetta', 'suona'] },
  { id: 'sisa', emoji: '🐐', nome: 'Sisa',      che: 'la capra: va dove il carro non va, e corre più di tutti',
    sa: ['vai', 'aspetta', 'pattuglia'] },
]

/* Storia 5 — i prigionieri. **Nessuno dei quattro sa `attacca`**, ed è
   la regola della storia: quel verbo non entra mai in cassetta. */
const PRIGIONIERI = [
  { id: 'marta', emoji: '🪡', nome: 'Marta', che: 'la sarta: con un ago apre qualunque serratura',
    sa: ['vai', 'prendi', 'apri', 'aspetta', 'suona'] },
  { id: 'cric',  emoji: '🐭', nome: 'Cric',  che: 'il topo: passa sotto le porte e porta cose piccole. Non apre niente',
    sa: ['vai', 'prendi', 'aspetta'] },
  { id: 'nilo',  emoji: '🪶', nome: 'Nilo',  che: 'il copista: legge i turni delle guardie, e corre giusto il necessario',
    sa: ['vai', 'prendi', 'aspetta', 'suona', 'pattuglia'] },
  { id: 'pero',  emoji: '🧓', nome: 'il vecchio Pero', che: 'cammina piano e non si difende. Ma sa dov\'è ogni cosa nella torre',
    sa: ['vai', 'aspetta'] },
]

export const UNITA = Object.fromEntries(
  [...MINATORI, ...CORTILE, ...DRAGHI, ...CAROVANA, ...PRIGIONIERI].map(u => [u.id, u]))

export const saFare = (chi, ordine) => {
  const u = UNITA[chi]
  if (!u || !ORDINE[ordine]) return false
  return eVerbo(ordine) ? u.sa.includes(ordine) : true
}

/* ═══════════════════════════════════════════════════════════════════
   STORIA 1 — LA LANTERNA DEI FONDI 🏮
   Sei capitoli, e il filo è **un oggetto**: la lanterna. Si prende nel
   primo e serve fino all'ultimo, ma non fa sempre lo stesso mestiere —
   e due volte su sei è un guaio invece che un aiuto. Chi la porta vede,
   e chi la porta si vede: è il pezzo di disegno da cui esce mezza
   storia.

   Il passaggio di mano fra Tilde e Ras avviene **fra un capitolo e
   l'altro**, non dentro una scena: dentro una scena non si posa niente
   per terra, perché il verbo per farlo non c'è (vedi `PROPOSTE`).
   ═══════════════════════════════════════════════════════════════════ */

const FONDI = [
  { id: 'magazzino', emoji: '📦', nome: 'Il magazzino',
    storia: 'La lanterna dei Fondi sta in magazzino da vent\'anni, e l\'olio è nell\'altra stanza. Sotto non si scende senza: là il buio è pieno di roba.',
    forma: 'presa',
    obiettivo: 'la lanterna e la latta dell\'olio addosso a Tilde. Dove finisce, non conta.',
    concetto: 'sequenza',
    dritta: 'Due cose da avere in mano, e nessuno che ti guardi: è il capitolo in cui si impara che quello che non hai scritto non succede. Una meta alla volta, e ricordati che da lontano non si prende niente.',
    nuovo: ['vai', 'prendi'], attori: ['tilde'], nemico: null,
    eredita: [],
    lascia: [{ filo: 'lanterna', come: 'accesa, l\'olio pieno, addosso a Tilde' }],
    par: 5,
    varianti: [
      'la lanterna sullo scaffale alto, l\'olio nel ripostiglio',
      'lo stesso magazzino, la lanterna dietro le casse',
      'la latta dell\'olio è già sul banco, la lanterna è in fondo',
    ] },

  { id: 'pozzo', emoji: '🪣', nome: 'Il pozzo',
    storia: 'Il pozzo è l\'unica via per i Fondi, e sopra c\'è una grata chiusa. Tilde ha lasciato la lanterna sul bordo: giù ci scende Ras, perché la serratura è roba sua.',
    forma: 'consegna',
    obiettivo: 'la lanterna in fondo al pozzo, addosso a Ras.',
    concetto: 'prerequisiti',
    dritta: 'Gli stessi ordini in un altro ordine sono un altro piano: la chiave della grata sta appesa al verricello, e la grata non si apre a mani vuote. E la lanterna si prende quando si è già dalla parte giusta della grata, se no si scende al buio.',
    nuovo: ['apri'], attori: ['ras'], nemico: null,
    eredita: [{ filo: 'lanterna', come: 'posata sul bordo del pozzo dov\'era rimasta' }],
    lascia: [
      { filo: 'lanterna', come: 'giù nei Fondi, addosso a Ras' },
      { filo: 'pozzo', come: 'la grata resta aperta: è la porta di casa' },
    ],
    par: 4,
    varianti: [
      'la chiave al verricello, la grata sopra il pozzo',
      'la chiave è nella cassetta degli attrezzi, che è anche lei chiusa',
      'due grate una sopra l\'altra, una chiave sola',
    ] },

  { id: 'falene', emoji: '🦋', nome: 'Le falene',
    storia: 'Nella galleria dormono le falene bianche, e la luce le chiama tutte insieme. Chi porta la lanterna di lì non passa. Gli altri, al buio, sì.',
    forma: 'esca',
    obiettivo: 'Bea e Orso dall\'altra parte della galleria. Ras resta di qua, fermo, con tutte le falene addosso.',
    concetto: 'condizione',
    dritta: 'La lanterna qui non aiuta: chiama. Ras si ferma dove le falene lo trovano e non si muove più; gli altri partono **se non vedono falene** davanti, e al buio ci arrivano. È il primo capitolo in cui la cosa migliore che puoi fare è farti trovare.',
    nuovo: ['aspetta', 'se'], attori: ['ras', 'bea', 'orso'], nemico: 'le falene bianche',
    eredita: [{ filo: 'lanterna', come: 'accesa in mano a Ras, e sono guai' }],
    lascia: [{ filo: 'falene', come: 'adesso lo sapete: le falene vanno dove c\'è luce, e la luce potete metterla dove volete' }],
    par: 7,
    varianti: [
      'le falene dormono a metà galleria',
      'sono in due sciami, uno per imbocco',
      'la galleria fa una curva: chi sta fermo non vede più chi passa',
    ] },

  { id: 'frana', emoji: '⛏️', nome: 'La frana',
    storia: 'Dietro la frana c\'è la galleria vecchia, e la galleria vecchia arriva sotto il paese. Chi scava non vede quando è passato abbastanza; chi guarda dall\'altra parte non sa scavare.',
    forma: 'apripista',
    obiettivo: 'il varco aperto e tutti e quattro dall\'altra parte.',
    concetto: 'eventi',
    dritta: 'Orso scava e non vede niente oltre il suo naso. Tilde è di là con la lanterna ed è l\'unica che vede il varco aprirsi: quando lo vede **suona**, e gli altri hanno una lista che comincia con «quando arriva». Nessuno deve indovinare quanto ci mette Orso, che è la cosa che non si può indovinare.',
    nuovo: ['suona', 'quando-arriva'], attori: ['orso', 'tilde', 'ras', 'bea'], nemico: null,
    eredita: [
      { filo: 'lanterna', come: 'in mano a Tilde, dalla parte buia della frana' },
      { filo: 'pozzo', come: 'si entra ancora dal pozzo aperto nel secondo capitolo' },
    ],
    lascia: [{ filo: 'varco', come: 'la galleria vecchia è aperta, e gira intorno alla sala grande' }],
    par: 9,
    varianti: [
      'la frana sottile: Orso ci mette poco',
      'la frana spessa: ci mette il doppio, e chi conta i momenti sbaglia',
      'il varco si apre in alto, e chi è di qua non lo vede subito',
    ] },

  { id: 'tamburo', emoji: '🥁', nome: 'Il tamburo',
    storia: 'Nella sala grande gli orchi tengono un tamburo: chi vede qualcosa lo suona, e allora arrivano tutti. Finché c\'è quel tamburo, di qui non si passa due volte.',
    forma: 'sabotaggio',
    obiettivo: 'il tamburo sfondato, e nessuno dei nostri preso.',
    concetto: 'ciclo',
    dritta: 'Non li batti: sono troppi, e appena uno chiama accorrono. Però **accorrono dove chiama**. Bea pattuglia il lato di levante finché vede una guardia — cioè finché si fa vedere — e Tilde le sta dietro con la lanterna, così anche la luce dice «sono di là». Orso intanto è dall\'altra parte con tutto il tempo che gli serve.',
    nuovo: ['pattuglia', 'attacca'], attori: ['bea', 'tilde', 'orso'], nemico: 'le guardie della sala grande',
    pianoVisibile: true,
    eredita: [
      { filo: 'lanterna', come: 'la luce si vede da lontano, e stavolta è quello che vuoi' },
      { filo: 'varco', come: 'Orso arriva alla sala dalla galleria vecchia, non dalla porta' },
      { filo: 'falene', come: 'la stessa regola di due capitoli fa: si va dove c\'è da guardare' },
    ],
    lascia: [{ filo: 'tamburo', come: 'rotto: da adesso in poi gli orchi non si chiamano più fra loro' }],
    par: 8,
    varianti: [
      'due guardie, il tamburo in mezzo alla sala',
      'tre guardie, e una non lascia mai il tamburo',
      'il tamburo è appeso al muro di fondo, lontano da tutti gli imbocchi',
    ] },

  { id: 'risalire', emoji: '🏮', nome: 'Risalire',
    storia: 'L\'olio è agli sgoccioli. La strada di casa è il pozzo da cui siete scesi, e si esce in quattro o non si esce.',
    forma: 'fuga',
    obiettivo: 'tutti e quattro fuori dalla grata del pozzo.',
    concetto: 'sintesi',
    dritta: 'Niente di nuovo. Il pozzo è dove siete entrati, la galleria vecchia evita la sala grande, il tamburo non suona più — quindi una guardia che vi vede resta una guardia sola. E le falene vanno dove c\'è luce: se la lanterna va da una parte, la galleria dall\'altra è libera.',
    nuovo: [], attori: ['tilde', 'ras', 'orso', 'bea'], nemico: 'le guardie e le falene',
    pianoVisibile: true,
    eredita: [
      { filo: 'lanterna', come: 'l\'olio basta per metà scena: è la sveglia, non un attrezzo' },
      { filo: 'pozzo', come: 'la grata aperta nel secondo capitolo è l\'uscita' },
      { filo: 'varco', come: 'la galleria vecchia gira intorno alla sala grande' },
      { filo: 'tamburo', come: 'nessuno chiama più nessuno' },
      { filo: 'falene', come: 'la luce le porta dove volete voi' },
    ],
    lascia: [],
    par: 14,
    varianti: [
      'due guardie sveglie e la galleria vecchia libera',
      'le falene si sono spostate sull\'imbocco del pozzo',
      'una guardia è ferma proprio sotto il pozzo',
    ] },
]

/* ═══════════════════════════════════════════════════════════════════
   STORIA 2 — BIBI ALLO STAGNO 🦆
   Quattro capitoli per chi ha sei anni. Non è una storia corta: è una
   storia con altre regole, le stesse che valgono per Nina.

     · **una riga di racconto, dieci parole al massimo**, e parole di
       tutti i giorni;
     · **niente segnali, niente cicli, niente condizioni**: si sale fino
       ai prerequisiti e ci si ferma;
     · **il premio si vede**: il pane, la papera che arriva, il cancello
       aperto, Bibi nell\'acqua;
     · **non si perde**. Una scena può non riuscire, e allora si riguarda.

   E ha comunque i suoi fili, perché quelli sono la cosa che a sei anni
   funziona meglio di tutte: il pane del primo capitolo fa venire Bibi
   nel secondo e la fa scendere in acqua nel quarto.
   ═══════════════════════════════════════════════════════════════════ */

const BIBI = [
  { id: 'pane', emoji: '🥖', nome: 'Il pane',
    storia: 'Rosa ha una papera. La papera si chiama Bibi. Il pane è in cucina.',
    forma: 'presa',
    obiettivo: 'il pane in mano a Rosa.',
    concetto: 'sequenza',
    dritta: 'Un ordine alla volta, dal primo all\'ultimo. Per prendere una cosa bisogna esserci sopra.',
    nuovo: ['vai', 'prendi'], attori: ['rosa'], nemico: null,
    eredita: [],
    lascia: [{ filo: 'pane', come: 'in tasca a Rosa, e Bibi lo sa' }],
    par: 3,
    varianti: ['il pane sul tavolo', 'il pane sulla sedia', 'il pane sulla mensola bassa'] },

  { id: 'bibi', emoji: '🦆', nome: 'Bibi',
    storia: 'Bibi non ascolta nessuno. Bibi ascolta il pane.',
    forma: 'raduno',
    obiettivo: 'Bibi accanto a Rosa.',
    concetto: 'prossimita',
    dritta: 'Due amici, due liste di ordini. Rosa si mette dove vuole lei e aspetta. Bibi va dov\'è il pane, e il pane ce l\'ha Rosa.',
    nuovo: ['aspetta'], attori: ['rosa', 'bibi'], nemico: null,
    eredita: [{ filo: 'pane', come: 'senza quello Bibi non si muove' }],
    lascia: [{ filo: 'bibi', come: 'da adesso Bibi viene dietro a chi ha il pane' }],
    par: 4,
    varianti: ['Bibi sotto il melo', 'Bibi vicino alla pompa', 'Bibi dietro il fienile'] },

  { id: 'bombo', emoji: '🦴', nome: 'Bombo',
    storia: 'Bombo fa la guardia. Per l\'osso lascia il suo posto.',
    forma: 'passaggio',
    obiettivo: 'Rosa e Bibi dall\'altra parte del cortile, e Bombo occupato con l\'osso.',
    concetto: 'sincronizzazione',
    dritta: 'L\'osso va portato alla cuccia, e finché Bombo è di guardia non si passa. Qui non conta solo cosa si fa: conta quando, e chi aspetta chi.',
    nuovo: ['aspetta'], attori: ['rosa', 'bibi'], nemico: 'Bombo, il cane del vicino',
    eredita: [
      { filo: 'pane', come: 'Bibi segue Rosa solo per quello' },
      { filo: 'bibi', come: 'Bibi è con voi, e non sa niente dei cani' },
    ],
    lascia: [{ filo: 'cortile', come: 'il cancello del cortile resta aperto: è la strada dello stagno' }],
    par: 7,
    varianti: ['la cuccia in mezzo al cortile', 'la cuccia in alto, l\'osso in fondo',
               'la cuccia in basso, l\'osso in alto'] },

  { id: 'stagno', emoji: '💦', nome: 'Lo stagno',
    storia: 'Lo stagno è grande. Bibi non l\'ha mai visto. Rosa sì.',
    forma: 'scorta',
    obiettivo: 'Bibi nell\'acqua, e l\'oca che non l\'ha fatta scappare.',
    concetto: 'sintesi',
    nuovaIdea: 'lo stesso «vai» di sempre, ma puntato allo stagno invece che a sei posti in fila: uno vale sei, e regge anche quando lo stagno è dall\'altra parte',
    dritta: 'Bibi non si difende da sola: sull\'erba c\'è un\'oca, e Rosa deve starle in mezzo. «Vai allo stagno» vale sei posti in fila, e stavolta serve, perché lo stagno non è sempre nello stesso posto.',
    nuovo: [], attori: ['rosa', 'bibi'], nemico: 'l\'oca dello stagno',
    eredita: [
      { filo: 'pane', come: 'l\'ultimo pezzo: serve a farla scendere in acqua' },
      { filo: 'bibi', come: 'Bibi è con voi da due capitoli' },
      { filo: 'cortile', come: 'si passa dal cancello lasciato aperto' },
    ],
    lascia: [],
    par: 5,
    varianti: ['lo stagno in fondo al prato', 'lo stagno dietro la siepe', 'lo stagno di lato, e l\'oca in mezzo'] },
]

/* ═══════════════════════════════════════════════════════════════════
   STORIA 3 — IL NIDO DI BRASA 🥚
   Cinque capitoli dalla parte del mostro. Non è «la fortezza degli
   orchi» con altri nomi: là si difendeva una fortezza, qui si difende un
   uovo, e i draghi hanno il problema che ha sempre avuto il nemico —
   **sono pochi, sono grossi e stanno fermi in un posto solo**, mentre
   quelli che arrivano sono tanti, piccoli e decidono loro quando.

   Il capitolo di apertura porta tre ordini invece di uno, ed è voluto:
   vai, aspetta, attacca sono il gesto della guardia, e sono una frase
   sola — mettiti dove passerà, stai lì, e quando arriva fermalo. Questa
   storia comincia da lì perché è tutta lì.
   ═══════════════════════════════════════════════════════════════════ */

const NIDO = [
  { id: 'primo-ladro', emoji: '🥚', nome: 'Il primo ladro',
    storia: 'Un uomo con un sacco sta salendo al nido. Sulla neve i suoi passi si leggono: si sa da dove viene e dove va.',
    forma: 'interdizione',
    obiettivo: 'il ladro non arriva al nido. Non serve prenderlo: serve che non ci arrivi.',
    concetto: 'sequenza',
    nuovaIdea: 'i suoi ordini sono scritti e si leggono prima dei tuoi: non si insegue chi cammina, ci si mette dove passerà',
    dritta: 'Brasa è grossa e lenta: dietro non lo prende mai. Leggi la sua strada, scegli il punto stretto, arrivaci prima e aspettalo lì. Tre ordini in fila, e sono il mestiere di tutta la storia.',
    nuovo: ['vai', 'aspetta', 'attacca'], attori: ['brasa'], nemico: 'il ladro col sacco',
    pianoVisibile: true,
    eredita: [],
    lascia: [{ filo: 'voce', come: 'è tornato a valle e ha raccontato: adesso in paese sanno che al nido c\'è un drago' }],
    par: 4,
    varianti: [
      'sale dal sentiero di ponente',
      'sale dalla cengia, che è più lunga',
      'parte dal sentiero e a metà taglia per la cengia',
    ] },

  { id: 'contarli', emoji: '❄️', nome: 'Contarli',
    storia: 'Adesso sono in tanti e stanno accampati sotto la parete. Prima di decidere bisogna sapere quanti sono, e Cenere è piccolo e nero: di notte non lo vede nessuno.',
    forma: 'passaggio',
    obiettivo: 'Cenere attraversa l\'accampamento e torna al nido senza che nessuno lo veda.',
    concetto: 'condizione',
    dritta: 'Chi ti vede grida, e chi sente accorre: qui farsi vedere una volta sola fa perdere il capitolo. Appendi «se» agli ordini e Cenere passa dal lato buio — quello dove **non vede** la sentinella — qualunque sia il lato buio stanotte.',
    nuovo: ['se'], attori: ['cenere'], nemico: 'le sentinelle dei ladri',
    eredita: [{ filo: 'voce', come: 'sono venuti in sei proprio perché il primo ha raccontato' }],
    lascia: [{ filo: 'conto', come: 'sapete quanti sono, dove dormono e da dove vogliono salire: da qui in poi il loro piano si legge' }],
    par: 6,
    varianti: [
      'il fuoco a ponente, la sentinella a levante',
      'due fuochi e una sentinella che gira',
      'il fuoco è spento e la sentinella dorme, ma i cani no',
    ] },

  { id: 'richiamo', emoji: '🔔', nome: 'Il richiamo',
    storia: 'Le corde stanno in mezzo all\'accampamento, e senza corde alla parete non si sale. Cenere può prenderle, ma solo se tutti guardano da un\'altra parte.',
    forma: 'esca',
    obiettivo: 'le corde al nido, e nessuno dei nostri visto da vicino.',
    concetto: 'eventi',
    dritta: 'Fumo passa alto sopra il fuoco: lo vedono, gridano, corrono tutti là — e **corrono dove hanno visto**. Ma Cenere da sotto non sa quando è il momento, quindi Fumo glielo deve dire: suona «🏁 ci siamo» e Cenere ha una lista che comincia con «quando arriva». Brasa non serve: se si muove lei, si accorgono che il nido è sguarnito.',
    nuovo: ['suona', 'quando-arriva'], attori: ['fumo', 'cenere', 'brasa'], nemico: 'i sei ladri',
    pianoVisibile: true,
    eredita: [{ filo: 'conto', come: 'sapete dove tengono la roba e chi fa il turno' }],
    lascia: [{ filo: 'corde', come: 'le corde sono al nido: alla parete non si sale più a mani nude' }],
    par: 9,
    varianti: [
      'le corde vicino al fuoco',
      'le corde sotto il telo, dalla parte opposta al fuoco',
      'due matasse in due posti diversi, e Fumo può farsi vedere una volta sola',
    ] },

  { id: 'scala', emoji: '🪜', nome: 'La scala di legno',
    storia: 'Senza corde si sono messi a costruire. La scala è a metà parete e in due notti è finita. Roccia ci mette una notte a scendere fin là, e quando è arrivato non lo ferma nessuno.',
    forma: 'sabotaggio',
    obiettivo: 'la scala giù, e Roccia non deve tornare indietro: può restare là.',
    concetto: 'ciclo',
    dritta: 'Roccia è lento e non vede lontano: mentre scende, qualcuno deve guardargli le spalle per tutta la notte. Fumo pattuglia il crinale **finché vede i ladri tornare** — una riga sola invece di venti — e quando li vede suona. Cenere sta al nido, che sguarnito non si lascia mai.',
    nuovo: ['pattuglia'], attori: ['roccia', 'fumo', 'cenere'], nemico: 'i sei ladri',
    pianoVisibile: true,
    eredita: [{ filo: 'corde', come: 'la scala esiste solo perché le corde gliele avete prese' }],
    lascia: [{ filo: 'scala', come: 'giù: la parete torna una parete' }],
    par: 8,
    varianti: [
      'tornano a metà notte dal sentiero',
      'tornano tardi e dalla cengia',
      'si dividono: tre tornano subito, tre restano al fuoco',
    ] },

  { id: 'alba', emoji: '🌅', nome: 'La notte del nido',
    storia: 'Stanotte vengono tutti e salgono a mani nude. Se il nido regge fino all\'alba se ne vanno: al sole nessuno ruba un uovo a un drago sveglio.',
    forma: 'resistenza',
    obiettivo: 'l\'uovo ancora nel nido quando è giorno.',
    concetto: 'sintesi',
    dritta: 'Niente di nuovo. Il loro piano si legge tutto, e metà del lavoro è lì dentro: senza corde e senza scala hanno una strada sola. Fumo vede e dice, Roccia sta dove passeranno, Brasa non insegue nessuno, Cenere non attacca — e non è un difetto, è il motivo per cui può stare dove gli altri no.',
    nuovo: [], attori: ['brasa', 'cenere', 'fumo', 'roccia'], nemico: 'i sei ladri',
    pianoVisibile: true,
    eredita: [
      { filo: 'voce', come: 'sanno che c\'è un drago: non passano più dal sentiero facile' },
      { filo: 'conto', come: 'sapete quanti sono e come si dividono' },
      { filo: 'corde', come: 'senza corde' },
      { filo: 'scala', come: 'e senza scala' },
    ],
    lascia: [],
    par: 15,
    varianti: [
      'salgono tutti insieme dalla cengia',
      'si dividono in due gruppi, uno per lato',
      'due fanno rumore da una parte e quattro salgono dall\'altra',
    ] },
]

/* ═══════════════════════════════════════════════════════════════════
   STORIA 4 — LA CAROVANA DEL SALE 🧂
   Sei capitoli, e il taglio è questo: **niente è tuo tranne il carro**.
   Non c'è un posto da prendere e non c'è un nemico da battere — c'è un
   carro che va piano, una vecchia che non corre e una strada lunga, e
   ogni capitolo è un modo diverso di far arrivare qualcosa da qualche
   parte.

   Il filo lungo è il sale, che parte nel primo capitolo e arriva
   nell'ultimo. Ma quello che conta è l'altro: nel quarto capitolo Sisa
   fa da esca e **resta di là**, e il quinto capitolo esiste solo per
   andarla a riprendere. Chi la riprende se la ritrova accanto
   nell'ultimo, e chi non ci riesce lo finisce in tre.
   ═══════════════════════════════════════════════════════════════════ */

const SALE = [
  { id: 'partenza', emoji: '🌅', nome: 'Si parte all\'alba',
    storia: 'Il carro parte quando suona la campana, con o senza di te. Il sale è nel magazzino e i tre sono sparsi per il paese.',
    forma: 'raduno',
    obiettivo: 'i tre al carro e i sacchi caricati prima che suoni la campana.',
    concetto: 'sequenza',
    dritta: 'Tre unità e tre liste che girano tutte insieme: è la prima cosa da guardare in faccia, perché da qui in poi non se ne comanda più una sola. Ognuno fa la strada sua, e nessuno aspetta nessuno se non glielo dici.',
    nuovo: ['vai', 'prendi'], attori: ['rea', 'vito', 'bugo'], nemico: null,
    eredita: [],
    lascia: [{ filo: 'sale', come: 'sei sacchi sul carro' }],
    par: 7,
    varianti: [
      'i sacchi nel magazzino, i tre in tre punti del paese',
      'il magazzino è chiuso e la chiave è dal fornaio',
      'metà sacchi sono già sul carro, e il carro è dall\'altra parte della piazza',
    ] },

  { id: 'sbarra', emoji: '🚧', nome: 'La sbarra del pedaggio',
    storia: 'La sbarra si alza solo dalla garitta, e nella garitta il carro non ci entra. Il gabelliere dorme, e non è il caso di svegliarlo.',
    forma: 'apripista',
    obiettivo: 'il carro dall\'altra parte della sbarra, e il gabelliere che dorme ancora.',
    concetto: 'prossimita',
    dritta: 'Chi apre non è chi passa, ed è tutto qui il capitolo: Bugo è l\'unico che apre, e per aprire deve essere dentro la garitta. Il carro non ci entra e non ci prova. Attenzione a chi passa davanti alla finestra: chi lo vede si sveglia, e uno sveglio è peggio di una sbarra.',
    nuovo: ['apri'], attori: ['bugo', 'rea', 'vito'], nemico: 'il gabelliere che dorme',
    eredita: [{ filo: 'sale', come: 'sul carro, e il carro è pesante: di strade ne ha una' }],
    lascia: [{ filo: 'sbarra', come: 'alzata e lasciata così: al ritorno di qui si passa senza fermarsi' }],
    par: 6,
    varianti: [
      'la garitta a destra della sbarra',
      'la garitta dall\'altra parte, e si passa davanti alla finestra',
      'due sbarre in fila, una manovella sola',
    ] },

  { id: 'lupi', emoji: '🐺', nome: 'I lupi del passo',
    storia: 'Nonna Rea non corre e non mena, e i lupi lo capiscono prima di te. Una capra si è messa dietro al carro e non se ne va più.',
    forma: 'scorta',
    obiettivo: 'Rea e il carro al rifugio, interi.',
    concetto: 'condizione',
    dritta: 'Rea ha una lista corta e non deve mai trovarsi sola: Vito attacca **se vede** un lupo, e se non lo vede tira dritto — una guardia guarda una volta sola, quando tocca a quell\'ordine. E il carro parte solo quando il tratto davanti è sgombro, non quando è comodo a te.',
    nuovo: ['aspetta', 'se'], attori: ['rea', 'vito', 'bugo', 'sisa'], nemico: 'i lupi',
    eredita: [{ filo: 'sale', come: 'il carico rallenta il carro di un terzo' }],
    lascia: [{ filo: 'sisa', come: 'la capra è della carovana adesso, e nessuno l\'ha decisa' }],
    par: 8,
    varianti: [
      'due lupi sul tornante',
      'tre lupi, e uno taglia dal bosco',
      'i lupi aspettano il carro al rifugio invece che sulla strada',
    ] },

  { id: 'crinale-fuochi', emoji: '🔥', nome: 'I fuochi del crinale',
    storia: 'I briganti sono più di noi e stanno più in alto. Ma guardano dove si muove qualcosa, e Sisa corre più di tutti.',
    forma: 'esca',
    obiettivo: 'il carro passa sotto il crinale mentre loro guardano dall\'altra parte.',
    concetto: 'eventi',
    dritta: 'Sisa va su per il costone e si fa vedere: loro scendono di là, e mentre scendono nessuno guarda la strada. Ma il carro da sotto non vede il crinale: Sisa deve **suonare** quando li ha tirati abbastanza lontano, e il carro deve avere una lista che comincia con «quando arriva». Chi parte a occhio parte troppo presto.',
    nuovo: ['suona', 'quando-arriva'], attori: ['sisa', 'rea', 'vito', 'bugo'], nemico: 'i briganti del passo',
    pianoVisibile: true,
    eredita: [
      { filo: 'sisa', come: 'è l\'unica che sale dove il carro non va' },
      { filo: 'sale', come: 'il carro non può accelerare: il tempo se lo devi comprare tu' },
    ],
    lascia: [{ filo: 'sisa', come: 'è rimasta di là dal crinale, e i briganti adesso sono fra lei e voi' }],
    par: 9,
    varianti: [
      'i fuochi sul costone di ponente',
      'i fuochi in due punti, e uno resta sempre di guardia alla strada',
      'il crinale è lungo: Sisa deve tirarli molto più in là',
    ] },

  { id: 'crinale', emoji: '🧗', nome: 'Il crinale',
    storia: 'Sisa non è tornata. È lassù e i briganti risalgono. Il carro fin là non ci arriva: qualcuno deve tenere l\'imbocco finché lei scende.',
    forma: 'resistenza',
    obiettivo: 'tenere l\'imbocco del sentiero finché Sisa è giù. Non serve batterli: serve durare.',
    concetto: 'ciclo',
    dritta: 'Due imbocchi e un uomo solo: Vito non può stare in due posti, quindi pattuglia fra i due **finché vede Sisa** arrivata. Una pattuglia larga copre tanto sentiero e lo copre di rado, una stretta il contrario: è la stessa domanda della ronda sulle mura, e la risposta la dà il tempo che ci mette lei.',
    nuovo: ['pattuglia', 'attacca'], attori: ['vito', 'sisa', 'bugo'], nemico: 'i briganti del passo',
    pianoVisibile: true,
    eredita: [{ filo: 'sisa', come: 'è in cima e scende da sola: tu puoi solo tenerle libera la strada' }],
    lascia: [{ filo: 'sisa', come: 'è tornata, e adesso quel versante lo conosce meglio di tutti' }],
    par: 9,
    varianti: [
      'risalgono in due dall\'imbocco basso',
      'risalgono in tre e si dividono sui due imbocchi',
      'Sisa scende dalla parte sbagliata e la strada da tenere è l\'altra',
    ] },

  { id: 'forno', emoji: '🥖', nome: 'Il forno del paese',
    storia: 'Il sale è per il forno, e il forno apre all\'alba. L\'ultimo tratto è proprio quello dove ti aspettano.',
    forma: 'consegna',
    obiettivo: 'i sacchi dentro il forno.',
    concetto: 'sintesi',
    dritta: 'Niente di nuovo, e tutto insieme. Il loro piano si legge; la sbarra del pedaggio è ancora alzata, e di lì si passa senza fermarsi; Sisa conosce la scorciatoia del versante e può tirarli via un\'altra volta. Il sale non deve arrivare intatto: deve arrivare.',
    nuovo: [], attori: ['rea', 'vito', 'bugo', 'sisa'], nemico: 'i briganti del passo',
    pianoVisibile: true,
    eredita: [
      { filo: 'sale', come: 'quello che è rimasto sul carro' },
      { filo: 'sbarra', come: 'alzata dal secondo capitolo: è la strada corta' },
      { filo: 'sisa', come: 'la conoscete, e lei conosce il versante' },
    ],
    lascia: [],
    par: 14,
    varianti: [
      'i briganti sulla strada del pedaggio',
      'i briganti alla piazza, davanti al forno',
      'si dividono: metà alla sbarra, metà alla piazza',
    ] },
]

/* ═══════════════════════════════════════════════════════════════════
   STORIA 5 — I PRIGIONIERI DELLA TORRE 🗝️
   Cinque capitoli, e una regola sola che vale per tutti: **nessuno dei
   quattro sa attaccare**. `attacca` non entra in cassetta in nessun
   capitolo, e non è una dimenticanza — è il vincolo che rende
   impossibile il gameplay banale. Non c'è un mostro da togliere di
   mezzo: c'è gente che guarda, e ci si passa in mezzo.

   È anche la storia in cui **non c'è nessun tesoro**. Il primo capitolo
   serve al secondo, il secondo lascia aperta la porta con cui si esce
   nel quinto, e l'obiettivo di tutta la storia è arrivare al capitolo
   dopo.
   ═══════════════════════════════════════════════════════════════════ */

const TORRE = [
  { id: 'sotto-la-porta', emoji: '🗝️', nome: 'Sotto la porta',
    storia: 'La chiave della cella è appesa nel corridoio, a due passi e dall\'altra parte del ferro. Sotto la porta passa solo Cric.',
    forma: 'consegna',
    obiettivo: 'la chiave dentro la cella, in mano a Marta.',
    concetto: 'sequenza',
    dritta: 'Chi la prende non è chi la usa: è la prima cosa da mettersi in testa, e in questa storia torna cinque volte. Cric non apre niente, ma porta; Marta apre tutto, ma di lì non passa.',
    nuovo: ['vai', 'prendi'], attori: ['cric', 'marta'], nemico: null,
    eredita: [],
    lascia: [{ filo: 'chiave', come: 'la chiave della cella, in mano a Marta' }],
    par: 5,
    varianti: [
      'la chiave al gancio davanti alla porta',
      'la chiave in fondo al corridoio',
      'la chiave è caduta sotto la panca, e sotto la panca Cric ci passa e Marta no',
    ] },

  { id: 'turno', emoji: '🚶', nome: 'Il turno della guardia',
    storia: 'La guardia fa sempre lo stesso giro, e i suoi ordini sono scritti sulla lavagna della sala. Il corridoio è libero per il tempo che ci mette a girarsi.',
    forma: 'passaggio',
    obiettivo: 'tutti e quattro fuori dalla cella e oltre il corridoio, senza che la guardia dia l\'allarme.',
    concetto: 'attesa',
    dritta: 'Leggi il suo giro prima di firmare il tuo piano. Poi «aspetta che» — non «aspetta un momento», che conta i momenti e funziona su una scena su tre. E Pero cammina piano: quello che basta agli altri a lui non basta.',
    nuovo: ['apri', 'aspetta'], attori: ['marta', 'cric', 'nilo', 'pero'], nemico: 'la guardia del corridoio',
    pianoVisibile: true,
    eredita: [{ filo: 'chiave', come: 'senza quella la cella non si apre' }],
    lascia: [{ filo: 'porta', come: 'la porta di servizio in fondo al corridoio è rimasta aperta, e nessuno l\'ha richiusa' }],
    par: 8,
    varianti: [
      'la guardia fa il giro corto',
      'il giro lungo, e si ferma a bere',
      'due guardie sfalsate: quando una si gira, l\'altra guarda',
    ] },

  { id: 'pero', emoji: '🧓', nome: 'Pero',
    storia: 'Pero cammina piano e non corre per nessuno. Ma sa dov\'è il pozzo, e nessuno di voi lo sa.',
    forma: 'scorta',
    obiettivo: 'Pero arriva alla cucina intero.',
    concetto: 'eventi',
    dritta: 'Pero non deve decidere niente: deve muoversi quando glielo dite. Nilo va avanti, guarda, e suona «✅ tutto libero»; la lista di Pero comincia con «quando arriva». Se Pero parte da solo, arriva sempre un momento prima o un momento dopo di quello giusto.',
    nuovo: ['suona', 'quando-arriva'], attori: ['pero', 'nilo', 'marta'], nemico: 'due guardie di ronda',
    pianoVisibile: true,
    eredita: [{ filo: 'porta', come: 'si passa di lì, e nessuno se n\'è ancora accorto' }],
    lascia: [{ filo: 'pero', come: 'Pero è con voi, e sa del pozzo del cortile e della corda che ci sta dentro' }],
    par: 8,
    varianti: [
      'le due guardie in fondo, ferme',
      'una gira e una sta al passaggio',
      'una porta si chiude a metà scena e la strada diventa un\'altra',
    ] },

  { id: 'pozzo-torre', emoji: '🪣', nome: 'Il pozzo',
    storia: 'Nel pozzo c\'è la corda per il muro, e sul pozzo c\'è una guardia che non si sposta mai. A meno che qualcuno le passi davanti e scappi.',
    forma: 'esca',
    obiettivo: 'la corda in mano a Marta.',
    concetto: 'ciclo',
    dritta: 'Nessuno di voi sa menare, e non serve: quello che si può fare è dargli qualcosa da guardare. Nilo pattuglia il porticato **finché la guardia lo vede** — è l\'unico ordine di tutto il gioco che si scrive per fallire apposta — e appena quella si stacca, Marta è già al pozzo. Poi Nilo deve avere una strada per tornare, che è la parte che si dimentica.',
    nuovo: ['pattuglia', 'se'], attori: ['nilo', 'marta', 'cric'], nemico: 'la guardia del cortile',
    pianoVisibile: true,
    eredita: [{ filo: 'pero', come: 'del pozzo l\'ha detto lui, e il pozzo non si vede dal cortile' }],
    lascia: [{ filo: 'corda', come: 'venti braccia di corda, addosso a Marta' }],
    par: 9,
    varianti: [
      'la guardia dal lato del porticato',
      'la guardia dall\'altro lato: Nilo deve farsi vedere più lontano',
      'due guardie, e una non insegue nessuno',
    ] },

  { id: 'fuori', emoji: '🌙', nome: 'La porta di servizio',
    storia: 'La corda serve per il muro, ma il muro è dopo il cortile. Si esce dalla porta lasciata aperta tre notti fa, e si esce in quattro.',
    forma: 'fuga',
    obiettivo: 'tutti e quattro fuori dalle mura. Chi resta dentro fa perdere.',
    concetto: 'sintesi',
    dritta: 'Niente di nuovo, e niente da attaccare: non lo sa fare nessuno. Hai la corda, hai una porta che nessuno ha richiuso, hai Pero che sa dove passano i turni e hai tre unità che possono farsi guardare una alla volta. Pero è il più lento: il piano lo si scrive intorno a lui, non intorno a chi corre.',
    nuovo: [], attori: ['marta', 'cric', 'nilo', 'pero'], nemico: 'tre guardie',
    pianoVisibile: true,
    eredita: [
      { filo: 'porta', come: 'aperta dal secondo capitolo: è l\'uscita' },
      { filo: 'corda', come: 'serve al muro, e la tiene chi la porta' },
      { filo: 'pero', come: 'lento come sempre, e prezioso come sempre' },
    ],
    lascia: [],
    par: 13,
    varianti: [
      'tre guardie ferme ai tre passaggi',
      'una fa il giro e le altre due stanno',
      'la porta di servizio è sorvegliata, e bisogna farla lasciare',
    ] },
]

/* ═══════════ LE CINQUE STORIE ═══════════
   `cassetta` cresce capitolo per capitolo come nelle campagne: quello che
   entra non esce più, e da qui viene la garanzia che nessun capitolo usi
   un ordine non ancora introdotto.

   `fili` è l'elenco dei fili di quella storia. Un capitolo li nomina in
   `eredita` (li ha ricevuti da prima) e in `lascia` (li consegna a dopo),
   e `verificaStorie()` controlla che nessuno erediti una cosa che nessuno
   ha lasciato. È l'unico posto del progetto in cui **la continuità è un
   dato e non una buona intenzione**. */

function conCassetta (st) {
  let cassetta = [...(st.cassetta || [])]
  const capitoli = st.capitoli.map((c, n) => {
    cassetta = [...cassetta, ...(c.nuovo || [])]
    return {
      ...c, n, storia: st.id,
      cassetta: [...cassetta],
      pianoVisibile: !!c.pianoVisibile,
      eredita: c.eredita || [],
      lascia: c.lascia || [],
      nuovaIdea: c.nuovaIdea || FORMA[c.forma]?.cosa || '',
      /* ─────────────────────────────────────────────────────────────
         ▼▼▼ QUI VA LA MAPPA ▼▼▼
         Non la disegna questo file: la disegna un agente per livello.
         Quello che gli serve sta in `obiettivo` (quando è vinta) e in
         `varianti` (le tre scene). `senzaMappa()` le elenca tutte.
         ───────────────────────────────────────────────────────────── */
      mappa: c.mappa ?? null,
    }
  })
  return { ...st, capitoli }
}

export const STORIE = [
  { id: 'fondi', nome: 'La lanterna dei Fondi', emoji: '🏮',
    sottotitolo: 'Quattro che rubano nella miniera, e una lanterna che si porta dietro tutto',
    per: 'la storia lunga: il filo è un oggetto, e l\'oggetto due volte su sei è un guaio',
    taglio: 'oggetto che passa di capitolo in capitolo',
    fili: [
      { id: 'lanterna', nome: 'la lanterna', cosa: 'chi la porta vede, e chi la porta si vede' },
      { id: 'pozzo',    nome: 'il pozzo',    cosa: 'la grata aperta al secondo capitolo: la via d\'ingresso e poi quella d\'uscita' },
      { id: 'falene',   nome: 'le falene',   cosa: 'una regola del mondo, imparata giocando: vanno dove c\'è luce' },
      { id: 'varco',    nome: 'il varco',    cosa: 'la galleria vecchia, che gira intorno alla sala grande' },
      { id: 'tamburo',  nome: 'il tamburo',  cosa: 'finché suona, ogni scontro ne chiama altri tre' },
    ],
    cassetta: [], capitoli: FONDI },

  { id: 'bibi', nome: 'Bibi allo stagno', emoji: '🦆',
    sottotitolo: 'Una bambina, una papera e un pezzo di pane',
    per: 'chi ha sei anni: quattro capitoli, poche parole, e alla fine di ognuno si vede il premio',
    taglio: 'corta e semplicissima',
    fili: [
      { id: 'pane',    nome: 'il pane',            cosa: 'l\'unica cosa che Bibi ascolta' },
      { id: 'bibi',    nome: 'Bibi',               cosa: 'da quando arriva, viene dietro: e da lì in poi è lei il problema' },
      { id: 'cortile', nome: 'il cancello aperto', cosa: 'la strada dello stagno passa di lì' },
    ],
    cassetta: [], capitoli: BIBI },

  { id: 'nido', nome: 'Il nido di Brasa', emoji: '🥚',
    sottotitolo: 'Stavolta il mostro sei tu, e quelli che salgono sono tanti',
    per: 'chi ha già giocato dalla parte di chi entra: qui si sta fermi e si aspetta',
    taglio: 'si comanda il lato che di solito è il nemico',
    fili: [
      { id: 'voce',  nome: 'la voce in paese', cosa: 'il primo ladro è tornato a valle e ha parlato' },
      { id: 'conto', nome: 'il conto',         cosa: 'sapere quanti sono rende leggibile il loro piano' },
      { id: 'corde', nome: 'le corde',         cosa: 'gliele hai prese, e allora hanno costruito' },
      { id: 'scala', nome: 'la scala',         cosa: 'buttata giù: la parete torna una parete' },
    ],
    cassetta: [], capitoli: NIDO },

  { id: 'sale', nome: 'La carovana del sale', emoji: '🧂',
    sottotitolo: 'Un carro che va piano, una strada lunga, e nessuno che vale da solo',
    per: 'chi vuole comandarne quattro alla volta: qui si perde tempo, non vite',
    taglio: 'un compagno che si perde e si va a riprendere',
    fili: [
      { id: 'sale',   nome: 'il sale',   cosa: 'il carico: rallenta il carro dall\'inizio alla fine' },
      { id: 'sbarra', nome: 'la sbarra', cosa: 'lasciata alzata al secondo capitolo, ed è la strada corta dell\'ultimo' },
      { id: 'sisa',   nome: 'Sisa',      cosa: 'arriva da sola, fa da esca, resta indietro, si va a riprendere, e alla fine è quella che sa la strada' },
    ],
    cassetta: [], capitoli: SALE },

  { id: 'torre', nome: 'I prigionieri della torre', emoji: '🗝️',
    sottotitolo: 'Quattro che devono uscire, e nessuno che sappia menare',
    per: 'chi risolve tutto attaccando: qui `attacca` non c\'è, e non arriva mai',
    taglio: 'nessuno sa attaccare, e non c\'è nessun tesoro',
    fili: [
      { id: 'chiave', nome: 'la chiave', cosa: 'la porta la prende chi non la usa' },
      { id: 'porta',  nome: 'la porta',  cosa: 'lasciata aperta al secondo capitolo, è l\'uscita del quinto' },
      { id: 'pero',   nome: 'Pero',      cosa: 'il più lento, e l\'unico che sa dov\'è ogni cosa' },
      { id: 'corda',  nome: 'la corda',  cosa: 'venti braccia: senza, il muro resta un muro' },
    ],
    cassetta: [], capitoli: TORRE },
].map(conCassetta)

export const STORIA = Object.fromEntries(STORIE.map(s => [s.id, s]))
export const storiaDi = id => STORIA[id] ?? null
export const capitoloDi = (id, n) => STORIA[id]?.capitoli[n] ?? null
export const quantiCapitoli = id => STORIA[id]?.capitoli.length ?? 0

/* Lo sblocco è una fila, come nelle campagne: il capitolo n si apre
   quando l'n−1 è superato, e il primo è sempre aperto. Le storie fra
   loro non si sbloccano: sono cinque porte aperte, e quella di Bibi
   deve poter essere la prima per chi ha sei anni. */
export const capitoloAperto = (id, n, superati = 0) => n <= superati

/* Le monete con lo stesso metro del resto del Generale: il par per le
   tre scene, una moneta ogni quindici ordini. */
export const premioCapitolo = c => Math.max(1, Math.round(c.par * 3 / 15))

/* ═══════════ ATTREZZI PER CHI LAVORA A QUESTI DATI ═══════════ */

/* I capitoli che aspettano una mappa: oggi tutti e ventisei. */
export const senzaMappa = () =>
  STORIE.flatMap(s => s.capitoli.filter(c => !c.mappa).map(c => s.id + '/' + c.id))

/* Quante volte una forma d'obiettivo compare, in tutte e cinque. Serve a
   una domanda sola: `arrivo` deve restare a zero. */
export const conteggioForme = () => {
  const n = Object.fromEntries(FORME.map(f => [f.id, 0]))
  for (const s of STORIE) for (const c of s.capitoli) n[c.forma] = (n[c.forma] ?? 0) + 1
  return n
}

/* Le cose che a occhio si sbagliano. Deve tornare una lista vuota.
     1. nessun capitolo porta un ordine che non esiste, e in ogni
        capitolo che ne porta uno c'è chi lo sa eseguire;
     2. par intero positivo, tre scene, forma e concetto veri;
     3. dentro una storia i concetti non tornano indietro (salvo la
        sintesi, che sta in fondo per definizione);
     4. **due capitoli di fila non hanno la stessa forma d'obiettivo** —
        è la regola per cui queste storie esistono;
     5. ogni `eredita` punta a un filo che qualcuno prima ha lasciato,
        ogni filo dichiarato è usato, e ogni storia ha almeno un filo che
        tocca tre capitoli o più. */
export function verificaStorie () {
  const guai = []

  for (const u of Object.values(UNITA))
    for (const v of u.sa || [])
      if (!eVerbo(v)) guai.push(`${u.id}: «${v}» non è un verbo che si possa sapere`)

  for (const s of STORIE) {
    let alto = -1
    let formaPrima = null
    const lasciati = new Set()
    const toccati = {}

    for (const c of s.capitoli) {
      const dove = `${s.id}/${c.id}`

      for (const ord of c.nuovo || []) {
        if (!ORDINE[ord]) { guai.push(`${dove}: ordine sconosciuto «${ord}»`); continue }
        if (eVerbo(ord) && !(c.attori || []).some(a => saFare(a, ord)))
          guai.push(`${dove}: porta «${ord}» ma in scena non lo sa fare nessuno`)
      }
      for (const a of c.attori || [])
        if (!UNITA[a]) guai.push(`${dove}: «${a}» non è nessuno`)

      if (!Number.isInteger(c.par) || c.par < 1) guai.push(`${dove}: par storto`)
      if (c.varianti?.length !== 3) guai.push(`${dove}: non ha tre scene`)
      if (!FORMA[c.forma]) guai.push(`${dove}: forma sconosciuta «${c.forma}»`)
      if (!c.obiettivo) guai.push(`${dove}: non dice quando è vinta`)

      if (c.forma && c.forma === formaPrima)
        guai.push(`${dove}: stessa forma del capitolo prima («${c.forma}»)`)
      formaPrima = c.forma

      if (!CONCETTO[c.concetto]) { guai.push(`${dove}: concetto sconosciuto`) }
      else if (c.concetto !== 'sintesi') {
        const g = gradinoDi(c.concetto)
        if (g < alto) guai.push(`${dove}: «${c.concetto}» torna indietro nella scala`)
        alto = Math.max(alto, g)
      }

      const dichiarati = new Set((s.fili || []).map(f => f.id))
      for (const e of c.eredita || []) {
        if (!dichiarati.has(e.filo)) guai.push(`${dove}: eredita «${e.filo}», che non è un filo di questa storia`)
        else if (!lasciati.has(e.filo)) guai.push(`${dove}: eredita «${e.filo}», che nessuno ha ancora lasciato`)
        toccati[e.filo] = (toccati[e.filo] ?? 0) + 1
      }
      for (const l of c.lascia || []) {
        if (!dichiarati.has(l.filo)) guai.push(`${dove}: lascia «${l.filo}», che non è un filo di questa storia`)
        lasciati.add(l.filo)
        toccati[l.filo] = (toccati[l.filo] ?? 0) + 1
      }
    }

    for (const f of s.fili || [])
      if (!toccati[f.id]) guai.push(`${s.id}: il filo «${f.id}» non lo tocca nessuno`)
    if (!Object.values(toccati).some(n => n >= 3))
      guai.push(`${s.id}: nessun filo attraversa tre capitoli`)
  }

  if (conteggioForme().arrivo !== 0)
    guai.push('c\'è un capitolo che finisce sul forziere: era la cosa da non fare')

  return guai
}

/* ═══════════ QUELLO CHE MANCHEREBBE ═══════════
   Tre cose che due o tre capitoli qui sopra girerebbero meglio se ci
   fossero. **Nessun capitolo le usa**: sono proposte, e finché non
   esistono i capitoli stanno in piedi lo stesso, con la strada più
   lunga scritta accanto. */
export const PROPOSTE = [
  { id: 'lascia', forma: 'lascia [oggetto]',
    serve: 'posare per terra quello che si ha addosso, così un altro può prenderlo',
    dove: 'fondi/pozzo e fondi/falene: la lanterna passa di mano fra Tilde e Ras, e oggi il passaggio avviene **fra un capitolo e l\'altro** perché dentro la scena non si può fare. Con `lascia` il terzo capitolo diventerebbe un\'altra cosa: la luce si posa dove vuoi tu, e chi la posa se ne va al buio',
    costo: 'un verbo in più nel vocabolario e un\'idea nuova da spiegare (un oggetto può stare a terra e cambiare padrone). Piccolo' },

  { id: 'chiudi', forma: 'chiudi [x]',
    serve: 'il gemello di `apri`: una porta si può richiudere dietro di sé',
    dove: 'torre/fuori e nido/alba, dove chiudere una porta alle spalle di chi ti insegue vale quanto aprirla. Oggi le porte del Generale si aprono e basta, e il filo «la porta lasciata aperta» funziona **solo** perché nessuno la può richiudere: è una fortuna, non un disegno',
    costo: 'quasi zero come verbo, ma cambia il mondo: se le porte si chiudono, tutti i livelli esistenti vanno riguardati' },

  { id: 'attacca-cose', forma: 'attacca [una cosa]',
    serve: 'non è un verbo nuovo: è `attacca` puntato a un oggetto invece che a qualcuno',
    dove: 'fondi/tamburo e nido/scala, cioè tutte e due le volte che l\'obiettivo è `sabotaggio`. Senza questo, quella forma d\'obiettivo non esiste',
    costo: 'nessuna parola nuova da imparare, e una forma d\'obiettivo in più. È la proposta che conviene di più' },
]
