// contrari/intruso/sinonimi/frase/modi di dire, dal più concreto al più astratto. I distrattori vengono da un serbatoio condiviso (un'altra voce della stessa tabella), mai da una lista scritta a mano: bastano poche decine di voci per migliaia di combinazioni, e ogni distrattore è plausibile perché è sempre qualcosa di vero, solo nel posto sbagliato.
import { Modulo } from '../nucleo/modulo.js'
import { domanda, testo } from '../nucleo/domanda.js'

// ogni parola compare una volta sola in tutta la tabella: in due coppie diverse avrebbe due contrari giusti possibili
const CONTRARI = [
  ['alto', 'basso'], ['grande', 'piccolo'], ['veloce', 'lento'], ['pieno', 'vuoto'],
  ['aperto', 'chiuso'], ['acceso', 'spento'], ['caldo', 'freddo'], ['duro', 'morbido'],
  ['pulito', 'sporco'], ['felice', 'triste'], ['ricco', 'povero'], ['vecchio', 'giovane'],
  ['lungo', 'corto'], ['largo', 'stretto'], ['leggero', 'pesante'], ['avanti', 'indietro'],
  ['presto', 'tardi'], ['vicino', 'lontano'], ['facile', 'difficile'], ['silenzioso', 'rumoroso'],
  ['bagnato', 'asciutto'], ['liscio', 'ruvido'], ['chiaro', 'scuro'], ['buono', 'cattivo'],
  ['bello', 'brutto'], ['sano', 'malato'], ['forte', 'debole'], ['dolce', 'amaro'],
  ['gentile', 'maleducato'], ['coraggioso', 'pauroso'], ['generoso', 'avaro'],
  ['ordinato', 'disordinato'], ['magro', 'grasso'], ['sveglio', 'addormentato'],
  ['curioso', 'indifferente'], ['paziente', 'impaziente'], ['onesto', 'bugiardo'],
  ['attento', 'distratto'], ['allegro', 'malinconico'], ['semplice', 'complicato'],
  ['comodo', 'scomodo'], ['utile', 'inutile'], ['sicuro', 'pericoloso'],
  ['economico', 'costoso'], ['profondo', 'superficiale'], ['spesso', 'sottile'],
  ['giusto', 'sbagliato'], ['vero', 'falso'], ['maggiore', 'minore'], ['primo', 'ultimo'],
  ['sopra', 'sotto'], ['destra', 'sinistra'], ['davanti', 'dietro'], ['dentro', 'fuori'],
  ['giorno', 'notte'], ['estate', 'inverno'], ['mattina', 'sera'],
]
const PAROLE_CONTRARI = [...new Set(CONTRARI.flat())]

// ogni membro compare in una sola categoria: senza, «pomodoro» (frutto E verdura) romperebbe la promessa che l'intruso è vero e non discutibile
const CATEGORIE = [
  { nome: 'animali della fattoria', gruppo: 'animali',
    membri: ['mucca', 'maiale', 'gallina', 'cavallo', 'pecora', 'capra', 'tacchino', 'oca', 'asino', 'coniglio'] },
  { nome: 'animali selvatici', gruppo: 'animali',
    membri: ['leone', 'tigre', 'elefante', 'giraffa', 'zebra', 'lupo', 'orso', 'volpe', 'rinoceronte', 'ippopotamo'] },
  { nome: 'animali del mare', gruppo: 'animali',
    membri: ['delfino', 'balena', 'squalo', 'polpo', 'granchio', 'medusa', 'foca', 'tartaruga marina', 'gambero', 'stella marina'] },
  { nome: 'uccelli', gruppo: 'animali',
    membri: ['aquila', 'gufo', 'pappagallo', 'passero', 'colomba', 'fenicottero', 'pavone', 'pinguino', 'anatra', 'cigno'] },
  { nome: 'insetti', gruppo: 'animali',
    membri: ['ape', 'farfalla', 'coccinella', 'formica', 'grillo', 'ragno', 'zanzara', 'libellula', 'scarafaggio'] },
  { nome: 'veicoli della strada', gruppo: 'veicoli',
    membri: ['automobile', 'autobus', 'camion', 'motocicletta', 'ambulanza', 'furgone', 'trattore', 'bicicletta', 'monopattino', 'tram'] },
  { nome: 'veicoli che volano', gruppo: 'veicoli',
    membri: ['aereo', 'elicottero', 'razzo', 'aliante', 'mongolfiera', 'deltaplano', 'drone', 'dirigibile'] },
  { nome: "veicoli dell'acqua", gruppo: 'veicoli',
    membri: ['nave', 'barca a vela', 'canoa', 'motoscafo', 'traghetto', 'gommone', 'sottomarino', 'yacht'] },
  { nome: 'frutta', gruppo: 'cibo',
    membri: ['mela', 'banana', 'fragola', 'uva', 'arancia', 'pesca', 'ciliegia', 'ananas', 'kiwi', 'pera'] },
  { nome: 'verdura', gruppo: 'cibo',
    membri: ['carota', 'broccolo', 'mais', 'lattuga', 'cipolla', 'aglio', 'cetriolo', 'peperone', 'patata', 'zucchina'] },
  { nome: 'dolci', gruppo: 'cibo',
    membri: ['torta', 'cioccolato', 'caramella', 'biscotto', 'gelato', 'ciambella', 'budino', 'marmellata', 'croissant'] },
  { nome: 'vestiti', gruppo: 'cose',
    membri: ['maglietta', 'pantaloni', 'giacca', 'vestito', 'calzini', 'scarpe', 'cappello', 'guanti', 'camicia', 'sciarpa'] },
  { nome: 'mobili di casa', gruppo: 'casa',
    membri: ['letto', 'sedia', 'divano', 'armadio', 'specchio', 'tavolo', 'poltrona', 'comodino'] },
  { nome: 'roba da cucina', gruppo: 'casa',
    membri: ['forchetta', 'cucchiaio', 'coltello', 'piatto', 'pentola', 'padella', 'teiera', 'tazza', 'mestolo'] },
  { nome: 'strumenti musicali', gruppo: 'cose',
    membri: ['chitarra', 'tamburo', 'tromba', 'violino', 'pianoforte', 'flauto', 'sassofono', 'arpa'] },
  { nome: 'sport', gruppo: 'cose',
    membri: ['calcio', 'basket', 'tennis', 'pallavolo', 'nuoto', 'ciclismo', 'pattinaggio', 'atletica', 'judo', 'scherma'] },
  { nome: 'attrezzi', gruppo: 'cose',
    membri: ['martello', 'cacciavite', 'sega', 'piccone', 'ascia', 'pinza', 'righello', 'chiodo'] },
  { nome: 'fiori e piante', gruppo: 'natura',
    membri: ['rosa', 'girasole', 'tulipano', 'margherita', 'orchidea', 'tarassaco', 'ortensia', 'giglio'] },
  { nome: 'cose del cielo', gruppo: 'natura',
    membri: ['sole', 'luna', 'stella', 'nuvola', 'arcobaleno', 'fulmine', 'cometa', 'pianeta'] },
]

// separati per categoria grammaticale: il distrattore di un aggettivo dev'essere un altro aggettivo, non un verbo capitato lì per caso
const SINONIMI_AGG = [
  ['bello', 'carino'], ['veloce', 'rapido'], ['grande', 'enorme'], ['piccolo', 'minuscolo'],
  ['felice', 'contento'], ['triste', 'mesto'], ['forte', 'robusto'], ['debole', 'fragile'],
  ['bravo', 'capace'], ['cattivo', 'malvagio'], ['furbo', 'astuto'], ['stanco', 'spossato'],
  ['pulito', 'immacolato'], ['sporco', 'lurido'], ['silenzioso', 'quieto'], ['rumoroso', 'chiassoso'],
  ['coraggioso', 'audace'], ['pauroso', 'timoroso'], ['intelligente', 'sveglio'],
  ['semplice', 'elementare'], ['difficile', 'arduo'], ['importante', 'rilevante'],
  ['strano', 'bizzarro'], ['simpatico', 'gradevole'], ['allegro', 'gioioso'],
  ['freddo', 'gelido'], ['caldo', 'torrido'], ['magro', 'snello'], ['grasso', 'paffuto'],
  ['luminoso', 'splendente'], ['buio', 'scuro'], ['ricco', 'facoltoso'], ['povero', 'misero'],
  ['vecchio', 'anziano'], ['goloso', 'ingordo'], ['timido', 'vergognoso'], ['educato', 'cortese'],
  ['maleducato', 'scortese'], ['onesto', 'sincero'], ['attento', 'vigile'],
  ['comodo', 'confortevole'], ['preciso', 'esatto'],
  ['antico', 'arcaico'], ['moderno', 'attuale'], ['vicino', 'prossimo'], ['lontano', 'remoto'],
  ['alto', 'elevato'], ['basso', 'ridotto'], ['largo', 'ampio'], ['stretto', 'angusto'],
  ['pesante', 'massiccio'], ['leggero', 'lieve'], ['morbido', 'soffice'], ['duro', 'rigido'],
  ['dolce', 'zuccherino'], ['amaro', 'acre'], ['salato', 'salino'], ['aspro', 'acido'],
  ['chiaro', 'limpido'], ['scuro', 'tenebroso'], ['pieno', 'colmo'], ['vuoto', 'deserto'],
  ['aperto', 'spalancato'], ['chiuso', 'serrato'], ['sano', 'salutare'], ['malato', 'infermo'],
  ['gentile', 'premuroso'], ['arrabbiato', 'furioso'], ['spaventato', 'terrorizzato'],
  ['sorpreso', 'stupito'], ['orgoglioso', 'fiero'], ['geloso', 'possessivo'],
  ['curioso', 'interessato'], ['annoiato', 'stufo'], ['occupato', 'impegnato'],
  ['libero', 'disponibile'], ['giusto', 'corretto'], ['sbagliato', 'errato'],
  ['utile', 'vantaggioso'], ['inutile', 'superfluo'], ['certo', 'convinto'],
  ['pericoloso', 'rischioso'], ['famoso', 'celebre'], ['sconosciuto', 'ignoto'],
  ['elegante', 'raffinato'], ['pigro', 'svogliato'], ['vivace', 'energico'],
  ['tranquillo', 'calmo'], ['nervoso', 'agitato'], ['potente', 'forte'], ['fedele', 'leale'],
  ['misterioso', 'enigmatico'], ['incredibile', 'straordinario'], ['delicato', 'gracile'],
  ['spazioso', 'capiente'], ['splendido', 'magnifico'], ['buffo', 'divertente'],
]
const SINONIMI_VERBI = [
  ['guardare', 'osservare'], ['parlare', 'chiacchierare'], ['mangiare', 'divorare'],
  ['camminare', 'passeggiare'], ['ridere', 'sghignazzare'], ['urlare', 'gridare'],
  ['dire', 'affermare'], ['prendere', 'afferrare'], ['buttare', 'gettare'],
  ['rompere', 'spaccare'], ['iniziare', 'cominciare'], ['finire', 'terminare'],
  ['aiutare', 'soccorrere'], ['cercare', 'ricercare'], ['trovare', 'scoprire'],
  ['capire', 'comprendere'], ['pensare', 'riflettere'], ['chiedere', 'domandare'],
  ['rispondere', 'replicare'], ['saltare', 'balzare'], ['correre', 'scattare'],
  ['dormire', 'riposare'], ['costruire', 'edificare'], ['riparare', 'aggiustare'],
  ['pulire', 'lavare'],
  ['mangiare', 'cibarsi'], ['guardare', 'scrutare'], ['parlare', 'conversare'],
  ['dire', 'dichiarare'], ['buttare', 'scaraventare'],
  ['rompere', 'frantumare'], ['iniziare', 'avviare'], ['finire', 'concludere'],
  ['aiutare', 'assistere'], ['cercare', 'scovare'], ['trovare', 'rintracciare'],
  ['pensare', 'meditare'],
  ['rispondere', 'ribattere'], ['correre', 'precipitarsi'],
  ['mandare', 'inviare'],
  ['portare', 'trasportare'], ['lasciare', 'abbandonare'], ['entrare', 'accedere'],
  ['uscire', 'andarsene'], ['scendere', 'discendere'],
  ['volare', 'svolazzare'], ['guidare', 'condurre'], ['cantare', 'intonare'],
  ['disegnare', 'tracciare'], ['scrivere', 'annotare'],
  ['ballare', 'danzare'], ['cucinare', 'preparare'], ['sognare', 'fantasticare'],
  ['ricordare', 'rammentare'], ['dimenticare', 'scordare'], ['aspettare', 'attendere'],
  ['arrivare', 'giungere'], ['partire', 'incamminarsi'], ['rubare', 'sottrarre'],
  ['nascondere', 'celare'], ['mostrare', 'rivelare'],
  ['lanciare', 'scagliare'], ['voltare', 'girare'], ['chiudere', 'serrare'],
  ['aprire', 'spalancare'], ['vedere', 'notare'],
  ['vincere', 'trionfare'],
]
const PAROLE_SIN_AGG = [...new Set(SINONIMI_AGG.flat())]
const PAROLE_SIN_VERBI = [...new Set(SINONIMI_VERBI.flat())]

// voci che dicono quasi la stessa cosa pur stando in righe diverse: una non è mai un falso dell'altra (le righe che condividono una parola contano già come un gruppo solo)
function affini(righe, gruppi = []) {
  const vicine = new Map()
  const lega = g => g.forEach(a => g.forEach(b => vicine.set(a, (vicine.get(a) || new Set()).add(b))))
  const perParola = new Map()
  for (const r of righe) for (const p of r) perParola.set(p, [...(perParola.get(p) || []), ...r])
  perParola.forEach(lega)
  gruppi.forEach(lega)
  return (a, b) => a === b || !!vicine.get(a)?.has(b)
}
const AFFINI_AGG = affini(SINONIMI_AGG, [
  ['felice', 'contento', 'allegro', 'gioioso', 'vivace', 'energico'],
  ['bello', 'carino', 'gradevole', 'simpatico', 'splendido', 'magnifico', 'incredibile', 'straordinario', 'splendente'],
  ['furbo', 'astuto', 'intelligente', 'sveglio', 'bravo', 'capace'], ['sveglio', 'attento', 'vigile'],
  ['amaro', 'acre', 'aspro', 'acido'], ['grande', 'enorme', 'largo', 'ampio', 'spazioso', 'capiente'],
  ['forte', 'robusto', 'potente', 'massiccio'], ['piccolo', 'minuscolo', 'ridotto'],
  ['debole', 'fragile', 'delicato', 'gracile'], ['magro', 'snello', 'gracile'],
  ['pulito', 'immacolato', 'limpido'], ['luminoso', 'splendente', 'chiaro', 'limpido'],
  ['silenzioso', 'quieto', 'tranquillo', 'calmo'], ['pauroso', 'timoroso', 'spaventato', 'terrorizzato'],
  ['timido', 'vergognoso', 'timoroso'], ['strano', 'bizzarro', 'buffo'],
  ['misterioso', 'enigmatico', 'sconosciuto', 'ignoto'], ['vecchio', 'anziano', 'antico', 'arcaico'],
  ['educato', 'cortese', 'gentile', 'premuroso', 'dolce'], ['onesto', 'sincero', 'leale', 'fedele'],
  ['preciso', 'esatto', 'giusto', 'corretto'], ['difficile', 'arduo', 'duro'], ['libero', 'disponibile', 'vuoto'],
  ['nervoso', 'agitato', 'arrabbiato', 'furioso'], ['stanco', 'spossato', 'stufo', 'annoiato'],
  ['importante', 'rilevante', 'famoso', 'celebre'], ['comodo', 'confortevole', 'gradevole'],
])
const AFFINI_VERBI = affini(SINONIMI_VERBI, [
  ['guardare', 'osservare', 'scrutare', 'vedere', 'notare'],
  ['parlare', 'chiacchierare', 'conversare', 'dire', 'affermare', 'dichiarare'],
  ['buttare', 'gettare', 'scaraventare', 'lanciare', 'scagliare'],
  ['cercare', 'ricercare', 'scovare', 'trovare', 'scoprire', 'rintracciare'],
  ['pensare', 'riflettere', 'meditare', 'fantasticare', 'sognare'],
  ['partire', 'andarsene', 'incamminarsi', 'uscire'], ['mostrare', 'rivelare', 'scoprire'],
  ['portare', 'trasportare', 'mandare', 'inviare'], ['guidare', 'condurre', 'portare'],
  ['saltare', 'balzare', 'scattare', 'correre'], ['iniziare', 'cominciare', 'avviare', 'partire'],
  ['lasciare', 'abbandonare', 'andarsene'], ['prendere', 'afferrare', 'rubare', 'sottrarre'],
  ['finire', 'terminare', 'concludere', 'chiudere'],
])
// per i contrari le liste sono dello stesso lato: «alto» e «grande» stanno dalla stessa parte, e il contrario dell'uno lo è un po' anche dell'altro
const LATI_CONTRARI = [
  ['alto', 'grande', 'maggiore'], ['sopra', 'alto'], ['largo', 'grande'],
  ['basso', 'piccolo', 'minore'], ['sotto', 'basso'], ['stretto', 'piccolo'], ['superficiale', 'basso'],
  ['felice', 'allegro'], ['triste', 'malinconico'],
  ['avanti', 'davanti', 'primo'], ['indietro', 'dietro', 'ultimo'],
  ['buono', 'bello', 'gentile'], ['cattivo', 'brutto', 'maleducato'],
  ['sano', 'forte'], ['malato', 'debole'], ['magro', 'sottile'], ['grasso', 'spesso'],
  ['facile', 'semplice'], ['difficile', 'complicato'],
  ['giusto', 'vero', 'onesto'], ['sbagliato', 'falso', 'bugiardo'],
  ['mattina', 'giorno'], ['sera', 'notte'],
  ['distratto', 'indifferente', 'addormentato'], ['sveglio', 'attento'],
  ['presto', 'veloce'], ['tardi', 'lento'], ['pulito', 'ordinato'], ['sporco', 'disordinato'],
]
const STESSO_LATO = affini([], LATI_CONTRARI)
const CONTRARIO_DI = new Map(CONTRARI.flatMap(([a, b]) => [[a, b], [b, a]]))

// il verbo giusto lo decide il complemento che chiude la frase, non il soggetto (tanti animali corrono, saltano, nuotano)
const FRASI_AZIONE = [
  { verbo: 'volò', luogo: 'nel cielo azzurro',
    soggetti: ["L'uccellino", 'Il pipistrello', 'La farfalla', "L'aquila", 'Il moscone', 'Il gabbiano',
      'La colomba', 'La rondine', 'La cicogna', 'Il calabrone', 'Il pappagallo'] },
  { verbo: 'nuotò', luogo: "nell'acqua del mare",
    soggetti: ['Il pesce', 'Il delfino', 'La foca', 'Il nuotatore', "L'anatra", 'La balena',
      'Lo squalo', 'La tartaruga marina', 'Il pinguino'] },
  { verbo: 'saltò', luogo: 'sul letto',
    soggetti: ['Il gatto', 'Il canguro', 'La rana', 'Il coniglio', 'Il bambino', 'Il grillo',
      'Il cane', 'La cavalletta', 'La bambina'] },
  { verbo: 'corse', luogo: 'nel prato',
    soggetti: ['Il cane', 'Il cavallo', 'Il ghepardo', 'Il bambino', 'Il topo', 'La lepre',
      'Il capretto', 'Il daino', 'La volpe'] },
  { verbo: 'strisciò', luogo: 'sotto il cespuglio',
    soggetti: ['Il serpente', 'La lumaca', 'Il verme', 'Il bruco', 'La lucertola', 'La biscia'] },
  { verbo: 'abbaiò', luogo: 'davanti al cancello',
    soggetti: ['Il cane', 'Il cucciolo', 'Il pastore tedesco', 'Il bassotto', 'Il levriero'] },
  { verbo: 'miagolò', luogo: 'sul davanzale',
    soggetti: ['Il gatto', 'Il gattino', 'Il micio', 'Il randagio'] },
  { verbo: 'ruggì', luogo: 'nella savana',
    soggetti: ['Il leone', 'La tigre', 'Il giaguaro', 'Il leopardo'] },
  { verbo: 'cantò', luogo: 'una canzone a squarciagola',
    soggetti: ['Il cantante', "L'uccellino", 'La nonna', 'Il coro', 'Il solista', 'Il pappagallo'] },
  { verbo: 'ballò', luogo: 'in punta di piedi',
    soggetti: ['La ballerina', 'Il bambino', 'La coppia', 'Il clown', 'Il danzatore'] },
  { verbo: 'disegnò', luogo: 'su un grande foglio',
    soggetti: ['La maestra', 'Il bambino', "L'artista", 'La bambina', 'Il pittore'] },
  { verbo: 'cucinò', luogo: 'una torta di mele',
    soggetti: ['Il cuoco', 'La mamma', 'Il papà', 'Il nonno', 'La nonna', 'Il pasticciere'] },
  { verbo: 'lesse', luogo: 'un libro sul divano',
    soggetti: ['La bambina', 'Il nonno', 'La maestra', 'Il bambino', 'La nonna', 'Il papà'] },
  { verbo: 'dipinse', luogo: 'un quadro colorato',
    soggetti: ['Il pittore', 'La bambina', "L'artista", 'Il bambino'] },
  { verbo: 'costruì', luogo: 'una torre di cubi',
    soggetti: ['Il bambino', "L'operaio", 'Il muratore', 'La bambina'] },
  { verbo: 'guidò', luogo: 'lungo la strada',
    soggetti: ['Il papà', "L'autista", 'Il camionista', 'La mamma'] },
  { verbo: 'pilotò', luogo: 'attraverso le nuvole',
    soggetti: ['Il pilota', "L'astronauta", "L'aviatore"] },
  { verbo: 'navigò', luogo: 'in mezzo al mare',
    soggetti: ['Il marinaio', 'Il capitano', 'Il pescatore', "L'ammiraglio"] },
  { verbo: 'remò', luogo: 'lungo il fiume',
    soggetti: ['Il canoista', 'Lo sportivo', 'Il vogatore'] },
  { verbo: 'pescò', luogo: 'seduto sulla riva',
    soggetti: ['Il pescatore', 'Il nonno', "L'orso", 'Il bambino'] },
  { verbo: 'piantò', luogo: 'un fiore nel vaso',
    soggetti: ['Il giardiniere', 'La nonna', 'Il contadino', 'La bambina'] },
  { verbo: 'innaffiò', luogo: 'le piante del giardino',
    soggetti: ['La mamma', 'Il giardiniere', 'Il bambino', 'Il nonno'] },
  { verbo: 'martellò', luogo: 'un chiodo nel legno',
    soggetti: ['Il falegname', "L'operaio", 'Il papà'] },
  { verbo: 'atterrò', luogo: "sulla pista dell'aeroporto",
    soggetti: ["L'aereo", "L'elicottero", 'Il pilota', 'La mongolfiera'] },
  { verbo: 'scivolò', luogo: 'giù dallo scivolo',
    soggetti: ['Il bambino', 'La bambina', 'Il nonno', 'Il gatto'] },
  { verbo: 'pianse', luogo: 'per la tristezza',
    soggetti: ['Il bambino', 'La bambina', 'Il cucciolo', 'La nonna'] },
  { verbo: 'russò', luogo: 'tutta la notte',
    soggetti: ['Il nonno', 'Il papà', 'Il cane', 'Il gatto'] },
  { verbo: 'starnutì', luogo: 'improvvisamente',
    soggetti: ['Il bambino', 'La nonna', 'Il gatto', 'Il maestro'] },
  { verbo: 'sospirò', luogo: 'di stanchezza',
    soggetti: ['La mamma', 'Il nonno', 'La maestra', 'Il papà'] },
  { verbo: 'sbadigliò', luogo: 'davanti alla televisione',
    soggetti: ['Il bambino', 'Il gatto', 'Il nonno', 'Il cane'] },
]

// un falso è un verbo che il soggetto non sa proprio fare, o che col complemento non regge: «Il bambino corse sul letto» non è uno sbaglio, è un'altra frase giusta
const TUTTI_I_VERBI = FRASI_AZIONE.map(c => c.verbo)
const SUONI = ['abbaiò', 'miagolò', 'ruggì']
const MESTIERI = ['disegnò', 'dipinse', 'costruì', 'cucinò', 'lesse', 'piantò', 'innaffiò', 'martellò', 'guidò', 'pilotò', 'navigò', 'remò', 'pescò']
const SENZA_PESCA = MESTIERI.filter(v => v !== 'pescò')
const SANNO_SOLO = (...verbi) => TUTTI_I_VERBI.filter(v => !verbi.includes(v))
// chi non è una persona (che sa fare tutto tranne i versi): i verbi che quel genere di soggetto non sa fare, per nome senza articolo
const NON_SANNO = [
  { chi: ['cane', 'cucciolo', 'pastore tedesco', 'bassotto', 'levriero', 'volpe'], non: [...MESTIERI, 'volò', 'atterrò', 'miagolò'] },
  { chi: ['gatto', 'gattino', 'micio', 'randagio', 'leone', 'tigre', 'giaguaro', 'leopardo', 'ghepardo'], non: [...SENZA_PESCA, 'volò', 'atterrò', 'abbaiò'] },
  { chi: ['orso'], non: [...SENZA_PESCA, 'volò', 'atterrò', 'abbaiò', 'miagolò'] },
  { chi: ['cavallo', 'topo', 'lepre', 'capretto', 'daino', 'canguro', 'rana', 'coniglio'], non: [...MESTIERI, ...SUONI, 'volò', 'atterrò'] },
  { chi: ['uccellino', 'pipistrello', 'aquila', 'gabbiano', 'colomba', 'rondine', 'cicogna', 'pappagallo', 'anatra', 'pinguino'],
    non: [...SENZA_PESCA, ...SUONI, 'pianse', 'sospirò', 'russò'] },
  { chi: ['moscone', 'calabrone', 'farfalla', 'grillo', 'cavalletta'], non: SANNO_SOLO('volò', 'atterrò', 'saltò', 'corse', 'strisciò', 'cantò', 'ballò', 'scivolò') },
  { chi: ['pesce', 'delfino', 'foca', 'balena', 'squalo', 'tartaruga marina'], non: SANNO_SOLO('nuotò', 'saltò', 'scivolò', 'strisciò', 'cantò', 'sbadigliò', 'abbaiò') },
  { chi: ['serpente', 'lumaca', 'verme', 'bruco', 'lucertola', 'biscia'], non: SANNO_SOLO('strisciò', 'scivolò', 'corse', 'nuotò', 'sbadigliò') },
  { chi: ['aereo', 'elicottero', 'mongolfiera'], non: SANNO_SOLO('volò', 'atterrò', 'scivolò', 'corse') },
]
const nonSanno = soggetto => {
  const nome = soggetto.replace(/^(Il|Lo|La|L')\s*/, '').toLowerCase()
  return (NON_SANNO.find(g => g.chi.includes(nome)) || { non: SUONI }).non
}
// il complemento è un oggetto (non lo prende chi non vuole un oggetto) o un posto all'asciutto (non ci va chi sta nell'acqua)
const CON_OGGETTO = ['cantò', 'cucinò', 'lesse', 'dipinse', 'costruì', 'piantò', 'innaffiò', 'martellò']
const SENZA_OGGETTO = ['volò', 'nuotò', 'strisciò', 'abbaiò', 'miagolò', 'ruggì', 'pianse', 'russò', 'starnutì', 'sbadigliò', 'scivolò', 'atterrò', 'corse']
const ASCIUTTO = ['saltò', 'corse', 'strisciò', 'abbaiò', 'miagolò', 'ruggì', 'ballò', 'disegnò', 'guidò', 'atterrò', 'scivolò', 'sbadigliò', 'lesse', 'martellò']
const IN_ACQUA = ['nuotò', 'navigò', 'remò', 'pescò']


// [modo di dire, significato, situazione in cui si direbbe]: la terza colonna serve a «in quale situazione lo diresti?», la seconda tipologia
const MODI = [
  ['essere al verde', 'non avere più soldi', 'quando hai finito tutti i soldi e non puoi comprare niente'],
  ['avere le mani in pasta', 'essere coinvolto in qualcosa', 'quando sei coinvolto in un affare o in un progetto importante'],
  ['prendere due piccioni con una fava', 'ottenere due risultati con una sola azione', 'quando con una sola azione risolvi due problemi insieme'],
  ['avere la testa fra le nuvole', "essere distratto, sognare a occhi aperti", "quando sei distratto e sogni a occhi aperti invece di ascoltare"],
  ['in bocca al lupo', 'un modo per augurare buona fortuna', 'quando vuoi augurare buona fortuna a qualcuno prima di una prova'],
  ['costare un occhio della testa', 'costare moltissimo', 'quando qualcosa costa moltissimo, un vero sproposito'],
  ['fare orecchie da mercante', 'fingere di non sentire', 'quando fai finta di non sentire quello che non ti conviene ascoltare'],
  ['rompere il ghiaccio', "far cadere l'imbarazzo iniziale fra due persone", "quando fai il primo passo per far cadere l'imbarazzo tra due persone che non si conoscono"],
  ['piovere a catinelle', 'piovere moltissimo, molto forte', 'quando fuori piove moltissimo, con un temporale fortissimo'],
  ['avere un diavolo per capello', 'essere molto arrabbiato', 'quando sei arrabbiatissimo per qualcosa che è andato storto'],
  ['essere una pappa molle', 'essere una persona senza grinta, che si arrende subito', 'quando qualcuno si lamenta e molla appena una cosa diventa un po\' faticosa'],
  ['fare il primo passo', 'essere il primo a iniziare qualcosa', 'quando sei tu il primo a iniziare qualcosa, magari a fare amicizia'],
  ['andare a gonfie vele', 'andare tutto molto bene', 'quando un progetto o una giornata vanno benissimo, senza problemi'],
  ['gettare la spugna', 'arrendersi, smettere di provarci', 'quando ti arrendi e smetti di provare, perché è troppo difficile'],
  ['avere le farfalle nello stomaco', 'sentire agitazione ed emozione', "quando sei emozionato e un po' agitato, ad esempio prima di un appuntamento importante"],
  ['mettere il carro davanti ai buoi', 'fare le cose nel loro ordine sbagliato', 'quando fai le cose nell\'ordine sbagliato, prima quello che dovrebbe venire dopo'],
  ['tagliare la corda', 'scappare via di nascosto', 'quando scappi via di nascosto, senza farti vedere'],
  ["essere un pesce fuor d'acqua", 'sentirsi a disagio, fuori posto', 'quando ti senti a disagio, in un posto che non conosci bene'],
  ['saltare di palo in frasca', 'cambiare discorso di colpo, senza un filo', 'quando cambi discorso all\'improvviso, senza nessun filo logico'],
  ['avere una fame da lupi', 'avere moltissima fame', 'quando hai una fame tremenda e mangeresti qualunque cosa'],
  ['alzarsi con il piede sbagliato', 'iniziare la giornata in modo storto', 'quando tutto ti va male fin dal mattino'],
  ['essere in gamba', 'essere capace e in forma', 'quando qualcuno fa bene le cose ed è sveglio'],
  ['avere la coda di paglia', 'sentirsi in colpa per qualcosa', 'quando ti offendi anche se nessuno ti ha accusato, perché sai di aver sbagliato'],
  ['mettere la testa a posto', 'iniziare a comportarsi bene e con giudizio', 'quando smetti di fare sciocchezze e diventi responsabile'],
  ["non vedere l'ora", 'essere molto impaziente di fare qualcosa', 'quando aspetti con grande voglia che arrivi un momento bello'],
  ['fare il tifo per qualcuno', 'sostenere e incoraggiare qualcuno', 'quando urli e incoraggi la tua squadra allo stadio'],
  ['avere le mani bucate', 'spendere tutti i soldi senza risparmiare', 'quando spendi subito tutti i tuoi soldi in cose inutili'],
  ['essere un libro aperto', 'essere una persona sincera e facile da capire', 'quando una persona non ha segreti e si capisce subito cosa pensa'],
  ['avere il cuore in gola', 'essere molto spaventato o emozionato', "quando il cuore ti batte forte per la paura o l'emozione"],
  ['prendere in giro', 'scherzare su qualcuno per divertirsi', 'quando ti burli di qualcuno con battute e scherzi'],
  ['essere fuori di testa', 'comportarsi in modo strano o pazzo', "quando qualcuno fa cose assurde e sembra un po' pazzo"],
  ['avere la luna storta', 'essere di malumore', 'quando sei nervoso e ti arrabbi per ogni piccola cosa'],
  ['fare il broncio', 'mostrare il malumore con la faccia', 'quando fai una faccia imbronciata perché sei arrabbiato'],
  ['cadere dalle nuvole', 'essere molto sorpreso, non aspettarsi una cosa', 'quando ti dicono una notizia che non ti aspettavi per niente'],
  ['avere sette vite come i gatti', 'riuscire sempre a salvarsi dai pericoli', "quando esci sano e salvo da tanti guai, uno dopo l'altro"],
  ['essere al settimo cielo', 'essere felicissimo', 'quando sei così contento che ti senti al massimo della felicità'],
  ['prendere lucciole per lanterne', "confondere una cosa con un'altra, sbagliarsi", "quando capisci una cosa per un'altra completamente diversa"],
  ['non avere peli sulla lingua', 'dire sempre quello che si pensa, senza paura', 'quando dici la verità anche se può risultare scomoda'],
  ['essere in alto mare', 'essere ancora molto lontani dalla fine di un lavoro', 'quando hai appena iniziato un compito e manca ancora moltissimo'],
  ['mettere le carte in tavola', 'dire chiaramente le cose, senza nascondere niente', 'quando spieghi tutto apertamente prima di decidere insieme'],
]
const PAROLE_DIFFICILI = [
  ['minuscolo', 'molto piccolo'],
  ['gigantesco', 'molto grande'],
  ['penombra', 'una luce debole, quasi buio'],
  ['tempestivo', 'fatto proprio al momento giusto'],
  ['goffo', 'impacciato, poco elegante nei movimenti'],
  ['baldanzoso', 'pieno di sicurezza e coraggio'],
  ['taciturno', 'che parla poco'],
  ['vorace', 'che mangia con grande avidità'],
  ['minuto', 'piccolo e sottile'],
  ['arzillo', 'vivace ed energico, specialmente da anziani'],
  ['rimpicciolire', 'diventare più piccolo'],
  ['sonnecchiare', 'dormire leggermente, a tratti'],
  ['scaltro', 'furbo e astuto'],
  ['immenso', 'grandissimo, quasi senza confini'],
  ['riluttante', 'poco disposto a fare qualcosa'],
  ['sgargiante', 'molto colorato e vistoso'],
  ['tetro', 'triste e cupo'],
  ['vezzeggiare', 'coccolare con affetto'],
  ['baccano', 'un rumore forte e confuso'],
  ['sbigottito', 'molto sorpreso e stupito'],
  ['sgomento', 'un grande spavento o smarrimento'],
  ['ostinato', 'che non vuole cambiare idea, testardo'],
  ['malinconico', "un po' triste, pensieroso"],
  ['audace', 'coraggioso, che non ha paura di rischiare'],
  ['cauto', 'che sta attento, prudente'],
  ['sfacciato', 'che non si vergogna di niente'],
  ['brontolone', 'che si lamenta sempre'],
  ['schivo', 'che evita la compagnia, timido'],
  ['esuberante', 'pieno di energia, vivacissimo'],
  ['sventato', 'distratto, che si dimentica facilmente delle cose da fare'],
  ['sgraziato', 'senza eleganza nei movimenti'],
  ['tenace', 'che non si arrende facilmente'],
  ['inquieto', 'che non riesce a stare fermo, agitato'],
  ['affannato', 'senza fiato, che respira a fatica'],
  ['spensierato', 'senza pensieri o preoccupazioni'],
  ['accigliato', 'con la faccia scontenta e le sopracciglia aggrottate'],
  ['lezioso', 'che fa troppe smancerie'],
  ['solerte', 'che fa le cose con impegno e velocità'],
  ['impavido', 'che non ha paura di niente'],
  ['malfermo', "che non sta bene in equilibrio, instabile"],
  ['ozioso', 'che non fa niente, pigro'],
  ['avventato', 'che agisce senza pensarci, imprudente'],
  ['sagace', 'intelligente e capace di capire in fretta'],
  ['impettito', 'che sta dritto con orgoglio, impostato'],
  ['sonnolento', 'che ha sonno, assonnato'],
  ['sgangherato', 'rotto, che sta per rompersi del tutto'],
  ['attonito', 'stupito al punto da restare senza parole'],
  ['spavaldo', "coraggioso in modo esagerato e un po' sfrontato"],
  ['mogio', 'triste e silenzioso, giù di corda'],
  ['accanito', 'che fa una cosa con grande intensità e insistenza'],
  ['impaziente', 'che non riesce ad aspettare'],
  ['rigoglioso', 'che cresce forte e sano, pieno di vita'],
  ['sfinito', 'stanchissimo, senza più forze'],
  ['abbacchiato', 'triste e senza energia, giù di morale'],
  ['frastornato', 'confuso da troppo rumore o troppe cose insieme'],
  ['incerto', 'che non sa decidersi'],
  ['schietto', 'sincero, che dice le cose come stanno'],
  ['petulante', 'che infastidisce insistendo troppo'],
  ['arruffato', 'spettinato, in disordine'],
  ['rugoso', 'pieno di piccole pieghe sulla pelle'],
  ['tarchiato', 'basso e robusto'],
  ['gracile', 'debole e sottile di corporatura'],
  ['arrogante', 'che si crede superiore agli altri'],
  ['ombroso', 'che si offende facilmente'],
  ['burbero', 'che sembra scontroso ma in fondo è buono'],
  ['impassibile', 'che non mostra nessuna emozione'],
  ['smarrito', 'che si è perso, confuso'],
  ['vispo', 'vivace e allegro'],
  ['ansioso', 'preoccupato, in apprensione'],
  ['sereno', 'calmo e tranquillo'],
  ['sobrio', 'semplice, senza esagerazioni'],
  ['gioviale', 'allegro e cordiale con gli altri'],
  ['previdente', 'che pensa in anticipo alle conseguenze'],
  ['sventurato', 'che ha avuto sfortuna'],
  ['volenteroso', 'che ha tanta voglia di fare bene le cose'],
  ['sgobbone', 'che studia o lavora con grande impegno'],
  ['spiritoso', 'che fa battute e fa ridere'],
  ['risoluto', "deciso, che non ha dubbi nell'agire"],
  ['sgualcito', 'pieno di pieghe, spiegazzato'],
  ['solitario', 'che sta volentieri da solo'],
]

// parole e modi di dire con un significato quasi uguale: il significato dell'uno non è mai un falso dell'altro
const AFFINI_DIFFICILI = affini([], [
  ['minuscolo', 'minuto', 'rimpicciolire'], ['gracile', 'minuto', 'tarchiato'], ['gigantesco', 'immenso'],
  ['goffo', 'sgraziato', 'malfermo', 'sgangherato'],
  ['tetro', 'mogio', 'abbacchiato', 'malinconico', 'sventurato', 'accigliato'],
  ['audace', 'spavaldo', 'impavido', 'baldanzoso', 'avventato', 'sfacciato'], ['spavaldo', 'arrogante', 'sfacciato'],
  ['scaltro', 'sagace'], ['arzillo', 'esuberante', 'vispo', 'rigoglioso'], ['vispo', 'gioviale', 'spiritoso'],
  ['sbigottito', 'attonito', 'sgomento', 'frastornato', 'smarrito'], ['ostinato', 'tenace', 'accanito', 'risoluto'],
  ['sereno', 'spensierato', 'impassibile'], ['sonnecchiare', 'sonnolento'], ['schivo', 'solitario', 'taciturno'],
  ['solerte', 'volenteroso', 'sgobbone'], ['avventato', 'sventato'], ['sgualcito', 'arruffato', 'rugoso'],
  ['ansioso', 'inquieto', 'affannato', 'impaziente'], ['sfinito', 'affannato'], ['baccano', 'frastornato'], ['smarrito', 'incerto', 'frastornato'],
  ['brontolone', 'burbero', 'ombroso', 'petulante', 'accigliato'], ['cauto', 'previdente'],
  ['vezzeggiare', 'lezioso'], ['impettito', 'arrogante'],
])
const AFFINI_MODI = affini([], [
  ['rompere il ghiaccio', 'fare il primo passo'], ['gettare la spugna', 'essere una pappa molle'],
  ['avere le farfalle nello stomaco', 'avere il cuore in gola', "non vedere l'ora"],
  ['avere un diavolo per capello', 'avere la luna storta', 'fare il broncio', 'alzarsi con il piede sbagliato'],
  ['essere al verde', 'avere le mani bucate', 'costare un occhio della testa'],
  ['non avere peli sulla lingua', 'mettere le carte in tavola', 'essere un libro aperto'],
  ['essere al settimo cielo', 'andare a gonfie vele'], ['in bocca al lupo', 'fare il tifo per qualcuno'],
  ['avere la testa fra le nuvole', 'fare orecchie da mercante'],
])

const SCALETTA = [
  'i contrari',
  "l'intruso",
  'i sinonimi',
  'la parola giusta nella frase',
  'i modi di dire e le parole difficili',
]

// tutte lo stesso pezzo di scuola (`lessico`): chi lo spegne toglie il modulo intero, non c'è un grado «di base» che regge senza il resto
const TIPI = [
  { chiave: 'less:contrario', nome: 'I contrari', sa: 'lessico', gradi: { 1: 1 } },
  { chiave: 'less:intruso', nome: "L'intruso", sa: 'lessico', gradi: { 2: 1 } },
  { chiave: 'less:sinonimo', nome: 'I sinonimi', sa: 'lessico', gradi: { 3: 1 } },
  { chiave: 'less:frase', nome: 'La parola giusta nella frase', sa: 'lessico', gradi: { 4: 1 } },
  { chiave: 'less:parola-difficile', livello: 95, nome: 'Le parole difficili', sa: 'lessico', gradi: { 5: 0.5 } },
  { chiave: 'less:modo-di-dire', nome: 'I modi di dire', sa: 'lessico', gradi: { 5: 0.5 } },
]

class Lessico extends Modulo {
  constructor() {
    super({
      id: 'lessico',
      nome: 'Lessico',
      icona: '📖',
      materia: 'italiano',
      chiaro: 'contrari, sinonimi, categorie e modi di dire',
      scaletta: SCALETTA,
      livelli: [25, 29, 56, 63, 75], // scala 0-100 comune a tutte le materie (vedi docs/apprendimento/quiz-livelli.md)
      tipi: TIPI,
    })
  }

  genera(grado, sorte, tipo) {
    switch (tipo) {
      case 'less:intruso': return this.intruso(sorte)
      case 'less:sinonimo': return this.sinonimo(sorte)
      case 'less:frase': return this.frase(sorte)
      case 'less:parola-difficile': return this.significato(sorte, false)
      case 'less:modo-di-dire': return this.significato(sorte, true)
      default: return this.contrario(sorte)
    }
  }

  contrario(sorte) { // grado 1: il contrario di una parola
    const coppia = sorte.uno(CONTRARI)
    const [a, b] = sorte.forse(0.5) ? coppia : [coppia[1], coppia[0]]
    // un falso non è mai un altro contrario possibile: né vicino alla giusta, né il contrario di una vicina alla chiesta
    const falsi = sorte.distrattori(PAROLE_CONTRARI, 3, x => x === a || x === b || STESSO_LATO(x, b) || STESSO_LATO(CONTRARIO_DI.get(x), a))
    return domanda({
      testo: `Qual è il contrario di «${a}»?`,
      buona: testo(b),
      falsi: falsi.map(f => testo(f, `non è il contrario di «${a}»`)),
      chiave: 'less:contrario',
      aiuto: 'il contrario è la parola con il significato opposto',
      sorte,
    })
  }

  intruso(sorte) { // grado 2: tre cose della stessa famiglia e una no
    const casa = sorte.uno(CATEGORIE)
    const dentro = sorte.alcuni(casa.membri, 3)
    const altre = CATEGORIE.filter(c => c !== casa)
    const fuori = sorte.uno(altre)
    const intruso = sorte.uno(fuori.membri)
    return domanda({
      testo: "Chi non c'entra?",
      buona: testo(intruso, `gli altri sono ${casa.nome}, questo invece fa parte di: ${fuori.nome}`),
      falsi: dentro.map(m => testo(m, `fa parte di: ${casa.nome}`)),
      chiave: 'less:intruso',
      aiuto: `gli altri tre appartengono tutti a: ${casa.nome}`,
      sorte,
    })
  }

  sinonimo(sorte) { // grado 3: un'altra parola per dire la stessa cosa
    const daAgg = sorte.forse(0.6)
    const tabella = daAgg ? SINONIMI_AGG : SINONIMI_VERBI
    const pool = daAgg ? PAROLE_SIN_AGG : PAROLE_SIN_VERBI
    const [parola, sinon] = sorte.uno(tabella)
    const affine = daAgg ? AFFINI_AGG : AFFINI_VERBI
    const falsi = sorte.distrattori(pool, 3, x => affine(x, parola) || affine(x, sinon))
    return domanda({
      testo: `Quale parola vuol dire quasi la stessa cosa di «${parola}»?`,
      buona: testo(sinon),
      falsi: falsi.map(f => testo(f, `non è un sinonimo di «${parola}»`)),
      chiave: 'less:sinonimo',
      aiuto: 'un sinonimo dice quasi la stessa cosa con un\'altra parola',
      sorte,
    })
  }

  frase(sorte) { // grado 4: il pezzo dopo il buco dice quale verbo ci sta davvero
    const cat = sorte.uno(FRASI_AZIONE)
    const soggetto = sorte.uno(cat.soggetti)
    const non = nonSanno(soggetto)
    const sicuri = FRASI_AZIONE.filter(c => c !== cat && (non.includes(c.verbo) ||
      (CON_OGGETTO.includes(cat.verbo) && SENZA_OGGETTO.includes(c.verbo)) ||
      (ASCIUTTO.includes(cat.verbo) && IN_ACQUA.includes(c.verbo))))
    const falsiCat = sorte.alcuni(sicuri, 3)
    return domanda({
      testo: `${soggetto} ___ ${cat.luogo}.`,
      buona: testo(cat.verbo),
      falsi: falsiCat.map(c => testo(c.verbo, `«${soggetto} ${c.verbo} ${cat.luogo}» non ha senso`)),
      chiave: 'less:frase',
      aiuto: 'guarda chi è e come finisce la frase: solo un verbo ci sta bene',
      sorte,
    })
  }

  // grado 5: non si indovina dal suono, bisogna già saperlo. Due domande sullo stesso mazzo: significato e contesto (non a memoria, fa ragionare su quando si usa)
  significato(sorte, modo) {
    if (modo && sorte.forse(0.5)) return this.situazione(sorte)
    const tabella = modo ? MODI : PAROLE_DIFFICILI
    const [voce, giusto] = sorte.uno(tabella)
    const affine = modo ? AFFINI_MODI : AFFINI_DIFFICILI
    const falsi = sorte.alcuni(tabella.filter(v => v[1] !== giusto && !affine(v[0], voce)), 3).map(v => v[1])
    return domanda({
      testo: modo ? `Cosa vuol dire «${voce}»?` : `Cosa vuol dire la parola «${voce}»?`,
      buona: testo(giusto),
      falsi: falsi.map(f => testo(f, modo
        ? 'è il significato di un altro modo di dire, non di questo'
        : 'è il significato di un\'altra parola')),
      chiave: modo ? 'less:modo-di-dire' : 'less:parola-difficile',
      aiuto: modo
        ? 'i modi di dire non si intendono alla lettera'
        : 'prova a immaginare la frase in cui potresti sentirla',
      sorte,
    })
  }

  // stessa tabella vista dal contesto: i falsi sono situazioni di ALTRI modi di dire, mai inventate
  situazione(sorte) {
    const [modo, giusto, dove] = sorte.uno(MODI)
    const falsi = sorte.alcuni(MODI.filter(v => v[2] !== dove && !AFFINI_MODI(v[0], modo)), 3).map(v => v[2])
    return domanda({
      testo: 'In quale situazione lo diresti?',
      soggetto: { testo: modo },
      buona: testo(dove),
      falsi: falsi.map(f => testo(f, `non è quando si dice «${modo}»`)),
      chiave: 'less:modo-di-dire',
      aiuto: `«${modo}» vuol dire: ${giusto}`,
      sorte,
    })
  }
}

export default new Lessico()
