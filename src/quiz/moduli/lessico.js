/* ═══════════════════════════════════════════════════════════════════
   LESSICO — sinonimi, contrari, categorie e modi di dire.

   Cinque gradi, dal più concreto al più astratto: il contrario di una
   parola si sente quasi a pelle, l'intruso vuole sapere a che famiglia
   appartiene una cosa, il sinonimo chiede una parola più fine per dire
   la stessa cosa, la frase col buco vuole il verbo che ci sta davvero,
   e i modi di dire sono l'ultimo gradino perché non si intendono alla
   lettera — bisogna già sapere che le parole, messe insieme, a volte
   dicono un'altra cosa.

   I DISTRATTORI VENGONO DA UN SERBATOIO CONDIVISO, non da una lista
   scritta a mano parola per parola: il contrario sbagliato è un'altra
   parola della stessa tabella (quindi un aggettivo vero, non rumore),
   l'intruso finto è un altro membro della stessa categoria, il
   significato sbagliato di un modo di dire è il significato *vero* di
   un altro modo di dire. Così bastano poche decine di voci per
   migliaia di combinazioni, e ogni distrattore è sempre plausibile
   perché è sempre qualcosa di vero, solo nel posto sbagliato.
   ═══════════════════════════════════════════════════════════════════ */

import { Modulo } from '../nucleo/modulo.js'
import { domanda, testo } from '../nucleo/domanda.js'

/* ── grado 1: i contrari ──
   Ogni parola compare una volta sola in tutta la tabella: se comparisse
   in due coppie diverse, chiedere il suo contrario avrebbe due risposte
   giuste possibili. */
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

/* ── grado 2: l'intruso ──
   Ogni membro compare in una sola categoria: senza questa regola
   «pomodoro» che è insieme frutto e verdura, o simili, romperebbe la
   promessa che l'intruso è vero e non discutibile. */
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

/* ── grado 3: i sinonimi ──
   Separati per categoria grammaticale — aggettivi da una parte, verbi
   dall'altra — perché il distrattore di un aggettivo dev'essere un
   altro aggettivo, non un verbo capitato lì per caso. */
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
]
const PAROLE_SIN_AGG = [...new Set(SINONIMI_AGG.flat())]
const PAROLE_SIN_VERBI = [...new Set(SINONIMI_VERBI.flat())]

/* ── grado 4: la parola giusta nella frase ──
   Il verbo giusto non lo decide il soggetto (tanti animali corrono,
   saltano, nuotano) ma il complemento che chiude la frase: è quello
   che rende sbagliati i verbi presi in prestito da un'altra categoria,
   qualunque sia il soggetto scelto per quella riga. */
const FRASI_AZIONE = [
  { verbo: 'volò', luogo: 'nel cielo azzurro',
    soggetti: ["L'uccellino", 'Il pipistrello', 'La farfalla', "L'aquila", 'Il moscone', 'Il gabbiano'] },
  { verbo: 'nuotò', luogo: "nell'acqua del mare",
    soggetti: ['Il pesce', 'Il delfino', 'La foca', 'Il nuotatore', "L'anatra", 'La balena'] },
  { verbo: 'saltò', luogo: 'sul letto',
    soggetti: ['Il gatto', 'Il canguro', 'La rana', 'Il coniglio', 'Il bambino', 'Il grillo'] },
  { verbo: 'corse', luogo: 'nel prato',
    soggetti: ['Il cane', 'Il cavallo', 'Il ghepardo', 'Il bambino', 'Il topo', 'La lepre'] },
  { verbo: 'strisciò', luogo: 'sotto il cespuglio',
    soggetti: ['Il serpente', 'La lumaca', 'Il verme', 'Il bruco', 'La lucertola'] },
  { verbo: 'abbaiò', luogo: 'davanti al cancello',
    soggetti: ['Il cane', 'Il cucciolo', 'Il pastore tedesco'] },
  { verbo: 'miagolò', luogo: 'sul davanzale',
    soggetti: ['Il gatto', 'Il gattino', 'Il micio'] },
  { verbo: 'ruggì', luogo: 'nella savana',
    soggetti: ['Il leone', 'La tigre', 'Il giaguaro'] },
  { verbo: 'cantò', luogo: 'una canzone a squarciagola',
    soggetti: ['Il cantante', "L'uccellino", 'La nonna', 'Il coro'] },
  { verbo: 'ballò', luogo: 'in punta di piedi',
    soggetti: ['La ballerina', 'Il bambino', 'La coppia', 'Il clown'] },
  { verbo: 'disegnò', luogo: 'su un grande foglio',
    soggetti: ['La maestra', 'Il bambino', "L'artista", 'La bambina'] },
  { verbo: 'cucinò', luogo: 'una torta di mele',
    soggetti: ['Il cuoco', 'La mamma', 'Il papà', 'Il nonno'] },
  { verbo: 'lesse', luogo: 'un libro sul divano',
    soggetti: ['La bambina', 'Il nonno', 'La maestra', 'Il bambino'] },
  { verbo: 'dipinse', luogo: 'un quadro colorato',
    soggetti: ['Il pittore', 'La bambina', "L'artista"] },
  { verbo: 'costruì', luogo: 'una torre di cubi',
    soggetti: ['Il bambino', "L'operaio", 'Il muratore'] },
  { verbo: 'guidò', luogo: 'lungo la strada',
    soggetti: ['Il papà', "L'autista", 'Il camionista'] },
  { verbo: 'pilotò', luogo: 'attraverso le nuvole',
    soggetti: ['Il pilota', "L'astronauta"] },
  { verbo: 'navigò', luogo: 'in mezzo al mare',
    soggetti: ['Il marinaio', 'Il capitano', 'Il pescatore'] },
  { verbo: 'remò', luogo: 'lungo il fiume',
    soggetti: ['Il canoista', 'Lo sportivo'] },
  { verbo: 'pescò', luogo: 'seduto sulla riva',
    soggetti: ['Il pescatore', 'Il nonno', "L'orso"] },
  { verbo: 'piantò', luogo: 'un fiore nel vaso',
    soggetti: ['Il giardiniere', 'La nonna', 'Il contadino'] },
  { verbo: 'innaffiò', luogo: 'le piante del giardino',
    soggetti: ['La mamma', 'Il giardiniere', 'Il bambino'] },
  { verbo: 'martellò', luogo: 'un chiodo nel legno',
    soggetti: ['Il falegname', "L'operaio"] },
]

/* ── grado 5: i modi di dire e le parole difficili ──
   I falsi vengono dal significato *vero* di un altro modo di dire (o
   di un'altra parola): mai un significato inventato, perché un
   distrattore inventato si riconosce anche senza sapere niente. */
const MODI = [
  ['essere al verde', 'non avere più soldi'],
  ['avere le mani in pasta', 'essere coinvolto in qualcosa'],
  ['prendere due piccioni con una fava', 'ottenere due risultati con una sola azione'],
  ['avere la testa fra le nuvole', "essere distratto, sognare a occhi aperti"],
  ['in bocca al lupo', 'un modo per augurare buona fortuna'],
  ['costare un occhio della testa', 'costare moltissimo'],
  ['fare orecchie da mercante', 'fingere di non sentire'],
  ['rompere il ghiaccio', "far cadere l'imbarazzo iniziale fra due persone"],
  ['piovere a catinelle', 'piovere moltissimo, molto forte'],
  ['avere un diavolo per capello', 'essere molto arrabbiato'],
  ['essere una pappa molle', 'essere una persona timida e poco decisa'],
  ['fare il primo passo', 'essere il primo a iniziare qualcosa'],
  ['andare a gonfie vele', 'andare tutto molto bene'],
  ['gettare la spugna', 'arrendersi, smettere di provarci'],
  ['avere le farfalle nello stomaco', 'sentire agitazione ed emozione'],
  ['mettere il carro davanti ai buoi', 'fare le cose nel loro ordine sbagliato'],
  ['tagliare la corda', 'scappare via di nascosto'],
  ["essere un pesce fuor d'acqua", 'sentirsi a disagio, fuori posto'],
  ['saltare di palo in frasca', 'cambiare discorso di colpo, senza un filo'],
  ['avere una fame da lupi', 'avere moltissima fame'],
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
]

/* ── che cosa si chiede a ogni grado ── */
const SCALETTA = [
  'i contrari',
  "l'intruso",
  'i sinonimi',
  'la parola giusta nella frase',
  'i modi di dire e le parole difficili',
]

/* Le tipologie. Sono tutte lo stesso pezzo di scuola — sapere cosa
   vogliono dire le parole — e infatti dichiarano tutte `lessico`: chi
   lo spegne toglie il modulo intero, ed è giusto così, perché qui non
   c'è un grado «di base» che regge senza il resto. */
const TIPI = [
  { chiave: 'less:contrario', nome: 'I contrari', sa: 'lessico', gradi: { 1: 1 } },
  { chiave: 'less:intruso', nome: "L'intruso", sa: 'lessico', gradi: { 2: 1 } },
  { chiave: 'less:sinonimo', nome: 'I sinonimi', sa: 'lessico', gradi: { 3: 1 } },
  { chiave: 'less:frase', nome: 'La parola giusta nella frase', sa: 'lessico', gradi: { 4: 1 } },
  { chiave: 'less:parola-difficile', nome: 'Le parole difficili', sa: 'lessico', gradi: { 5: 0.5 } },
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

  /* grado 1 — il contrario di una parola */
  contrario(sorte) {
    const coppia = sorte.uno(CONTRARI)
    const [a, b] = sorte.forse(0.5) ? coppia : [coppia[1], coppia[0]]
    const falsi = sorte.distrattori(PAROLE_CONTRARI, 3, x => x === a || x === b)
    return domanda({
      testo: `Qual è il contrario di «${a}»?`,
      buona: testo(b),
      falsi: falsi.map(f => testo(f, `non è il contrario di «${a}»`)),
      chiave: 'less:contrario',
      aiuto: 'il contrario è la parola con il significato opposto',
      sorte,
    })
  }

  /* grado 2 — l'intruso: tre cose della stessa famiglia e una no */
  intruso(sorte) {
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

  /* grado 3 — un sinonimo, cioè un'altra parola per dire la stessa cosa */
  sinonimo(sorte) {
    const daAgg = sorte.forse(0.6)
    const tabella = daAgg ? SINONIMI_AGG : SINONIMI_VERBI
    const pool = daAgg ? PAROLE_SIN_AGG : PAROLE_SIN_VERBI
    const [parola, sinon] = sorte.uno(tabella)
    const falsi = sorte.distrattori(pool, 3, x => x === parola || x === sinon)
    return domanda({
      testo: `Quale parola vuol dire quasi la stessa cosa di «${parola}»?`,
      buona: testo(sinon),
      falsi: falsi.map(f => testo(f, `non è un sinonimo di «${parola}»`)),
      chiave: 'less:sinonimo',
      aiuto: 'un sinonimo dice quasi la stessa cosa con un\'altra parola',
      sorte,
    })
  }

  /* grado 4 — il verbo giusto per completare la frase: è il pezzo dopo
     il buco (dove va il soggetto) a dire quale verbo ci sta davvero */
  frase(sorte) {
    const cat = sorte.uno(FRASI_AZIONE)
    const soggetto = sorte.uno(cat.soggetti)
    const altre = FRASI_AZIONE.filter(c => c !== cat)
    const falsiCat = sorte.alcuni(altre, 3)
    return domanda({
      testo: `${soggetto} ___ ${cat.luogo}.`,
      buona: testo(cat.verbo),
      falsi: falsiCat.map(c => testo(c.verbo, `non ci si può "${c.verbo}" ${cat.luogo}`)),
      chiave: 'less:frase',
      aiuto: 'guarda come finisce la frase: solo un verbo ci sta bene',
      sorte,
    })
  }

  /* grado 5 — modi di dire e parole difficili: qui non si può indovinare
     dal suono, bisogna già sapere cosa vuol dire davvero */
  significato(sorte, modo) {
    const tabella = modo ? MODI : PAROLE_DIFFICILI
    const [voce, giusto] = sorte.uno(tabella)
    const pool = tabella.map(v => v[1])
    const falsi = sorte.distrattori(pool, 3, x => x === giusto)
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
}

export default new Lessico()
