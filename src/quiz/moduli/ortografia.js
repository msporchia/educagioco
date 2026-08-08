/* ═══════════════════════════════════════════════════════════════════
   ORTOGRAFIA — le parole che non si scrivono come si sentono.

   È il generatore più infinito che abbiamo in casa e insieme il buco
   più grosso: i bambini parlano italiano tutto il giorno e nel gioco
   non c'era una riga di italiano. Trenta parole per regola, dieci
   regole, e per ognuna gli errori che si fanno davvero: sono già
   qualche migliaio di domande diverse, e le stesse parole tornano
   dentro formati diversi.

   I FALSI SONO GLI ERRORI VERI, non lettere spostate a caso: «lavania»
   e «lavagnia» sono le due cose che un bambino scrive davvero, e
   riconoscerle costa sapere la regola. Se scrivessimo «lavagxa» la
   domanda si risolverebbe senza saperne niente.

   LE DOPPIE HANNO BISOGNO DEL DISEGNO. «pala» e «palla» sono due parole
   vere: chiedere «quale è scritta giusta» senza dire di cosa si parla è
   una domanda senza risposta. Per questo le parole possono portarsi
   un'emoji, e quando la portano la domanda mostra la cosa e chiede come
   si scrive.
   ═══════════════════════════════════════════════════════════════════ */

import { Modulo } from '../nucleo/modulo.js'
import { domanda, testo } from '../nucleo/domanda.js'

/* ── le parole ──
   Ogni voce: la parola giusta, gli errori tipici, e — se serve a capire
   di cosa si parla — un'emoji. */
const REGOLE = {
  gn: {
    chiave: 'orto:gn', dritta: 'dopo gn la i non ci va: gnomo, non gniomo',
    gruppi: ['gn', 'ni', 'gni'],
    parole: [
      ['lavagna', ['lavania', 'lavagnia']], ['montagna', ['montania', 'montagnia'], '⛰️'],
      ['ragno', ['ranio', 'ragnio'], '🕷️'], ['sogno', ['sonio', 'sognio'], '💤'],
      ['bagno', ['banio', 'bagnio'], '🛁'], ['legno', ['lenio', 'legnio'], '🪵'],
      ['castagna', ['castania', 'castagnia'], '🌰'], ['cagnolino', ['canio lino', 'cagniolino'], '🐕'],
      ['gnomo', ['niomo', 'gniomo'], '🧙'], ['ognuno', ['onuno', 'ognhuno']],
      ['compagno', ['companio', 'compagnio']], ['disegno', ['diseno', 'disegnio'], '🎨'],
      ['pigna', ['pinia', 'pignia'], '🌲'], ['vigna', ['vinia', 'vignia'], '🍇'],
      ['agnello', ['anniello', 'agniello'], '🐑'], ['cicogna', ['cicònia', 'cicognia'], '🦩'],
      ['spugna', ['spunia', 'spugnia'], '🧽'], ['lasagne', ['lasanie', 'lasagnie'], '🍝'],
      ['giugno', ['giunio', 'giugnio'], '📅'], ['insegnante', ['insenante', 'insegniante'], '👩‍🏫'],
      ['regno', ['renio', 'regnio'], '👑'], ['stagno', ['stanio', 'stagnio'], '🦆'],
    ],
  },
  gl: {
    chiave: 'orto:gl', dritta: 'gli suona come in «famiglia»: non si scrive lli né li',
    gruppi: ['gli', 'li', 'lli'],
    parole: [
      ['famiglia', ['familia', 'famillia'], '👨‍👩‍👧'], ['foglia', ['folia', 'follia'], '🍃'],
      ['maglia', ['malia', 'mallia'], '👕'], ['coniglio', ['conilio', 'conillio'], '🐰'],
      ['bottiglia', ['bottilia', 'bottillia'], '🍾'], ['aglio', ['alio', 'allio'], '🧄'],
      ['moglie', ['molie', 'mollie']], ['figlio', ['filio', 'fillio'], '👦'],
      ['sbaglio', ['sbalio', 'sballio']], ['paglia', ['palia', 'pallia'], '🌾'],
      ['tovaglia', ['tovalia', 'tovallia']], ['griglia', ['grilia', 'grillia']],
      ['meraviglia', ['meravilia', 'meravillia']], ['scoglio', ['scolio', 'scollio'], '🪨'],
      ['biglietto', ['bilietto', 'billietto'], '🎟️'], ['cavaliere', ['cavagliere', 'cavallier'], '🐴'],
      ['sveglia', ['svelia', 'svellia'], '⏰'], ['bagaglio', ['bagalio', 'bagallio'], '🧳'],
      ['taglia', ['talia', 'tallia'], '✂️'], ['guanciale', ['guangliale', 'guancliale'], '🛏️'],
      ['migliore', ['milliore', 'miliore']], ['battaglia', ['battalia', 'battallia'], '⚔️'],
    ],
  },
  sc: {
    chiave: 'orto:sc', dritta: 'sce si scrive senza i, tranne in «scienza» e «coscienza»',
    gruppi: ['sc', 'sci', 'sh'],
    parole: [
      ['pesce', ['pescie', 'pesscie'], '🐟'], ['scena', ['sciena', 'scèna'], '🎭'],
      ['scendere', ['sciendere', 'shendere']], ['ruscello', ['rusciello', 'rusello']],
      ['scivolo', ['sivolo', 'scivvolo'], '🛝'], ['sciarpa', ['sarpa', 'scarpa'], '🧣'],
      ['prosciutto', ['prosutto', 'proshutto'], '🥓'], ['asciugamano', ['assugamano', 'asugamano'], '🧻'],
      ['scienza', ['scenza', 'siensa'], '🔬'], ['uscita', ['usita', 'uscìta'], '🚪'],
      ['cuscino', ['cusino', 'cusciino'], '🛏️'], ['pescatore', ['pesciatore', 'peschatore'], '🎣'],
      ['scimmia', ['simmia', 'schimmia'], '🐒'], ['scoiattolo', ['scioiattolo', 'soiattolo'], '🐿️'],
      ['fascia', ['fasia', 'fascìa'], '🩹'], ['scheletro', ['sceletro', 'schieletro'], '💀'],
      ['striscia', ['strisia', 'strissia'], '🦓'], ['coscienza', ['coscenza', 'cosienza']],
    ],
  },
  cqu: {
    chiave: 'orto:cqu', dritta: 'acqua e la sua famiglia vogliono cqu: acqua, acquario, acquerello',
    parole: [
      ['acqua', ['aqua', 'acua'], '💧'], ['acquario', ['aquario', 'acuario'], '🐠'],
      ['acquerello', ['aquerello', 'acuerello'], '🖌️'], ['acquazzone', ['aquazzone', 'acuazzone'], '🌧️'],
      ['scuola', ['squola', 'scquola'], '🏫'], ['quaderno', ['cuaderno', 'qaderno'], '📓'],
      ['cuore', ['quore', 'cquore'], '❤️'], ['quadro', ['cuadro', 'qadro'], '🖼️'],
      ['scoiattolo', ['squoiattolo', 'scioiattolo'], '🐿️'], ['innaffiare', ['inaffiare', 'innafiare']],
      ['acquedotto', ['aquedotto', 'acuedotto']], ['acquisto', ['aquisto', 'acuisto'], '🛒'],
      ['squalo', ['scqualo', 'sqalo'], '🦈'], ['quattro', ['cuattro', 'quatro'], '4️⃣'],
      ['questo', ['cuesto', 'qesto']], ['liquido', ['licuido', 'liqido'], '🥤'],
      ['cuoco', ['quoco', 'cquoco'], '👨‍🍳'], ['cuoio', ['quoio', 'cquoio']],
    ],
  },
  cia: {
    chiave: 'orto:ce-cie', dritta: 'cie solo in cielo, cieco, superficie: negli altri ce ne va senza i',
    parole: [
      ['cielo', ['celo', 'ccielo'], '☁️'], ['faccia', ['facia', 'faccià'], '😀'],
      ['camicia', ['camicìa', 'camiccia'], '👔'], ['arancia', ['arancía', 'aranciia'], '🍊'],
      ['ciliegia', ['cilegia', 'ciliegìa'], '🍒'], ['pancia', ['pancía', 'panciia']],
      ['società', ['socetà', 'sociéta']], ['superficie', ['superfice', 'superficcie']],
      ['formaggio', ['formagio', 'formaggjo'], '🧀'], ['spiaggia', ['spiagia', 'spiaggja'], '🏖️'],
      ['ciliegie', ['cilegie', 'ciliege'], '🍒'], ['valigia', ['valigìa', 'valiggia'], '🧳'],
      ['grigio', ['grigjo', 'grigi'], '🩶'], ['pioggia', ['piogia', 'pioggja'], '🌧️'],
      ['acacia', ['acacìa', 'accacia'], '🌳'], ['goccia', ['gocia', 'goccià'], '💧'],
      ['riccio', ['ricio', 'ricciò'], '🦔'], ['bicicletta', ['biciccletta', 'bicicleta'], '🚲'],
    ],
  },
  doppie: {
    chiave: 'orto:doppie', dritta: 'la doppia si sente: prova a dire la parola piano piano',
    /* niente `gruppi`: un buco nelle doppie sarebbe «pa__a», e la
       risposta si vedrebbe senza sapere niente */
    parole: [
      ['palla', ['pala', 'palá'], '⚽'], ['nonna', ['nona', 'nonnna'], '👵'],
      ['cavallo', ['cavalo', 'cavalllo'], '🐴'], ['farfalla', ['farfala', 'ffarfalla'], '🦋'],
      ['bicchiere', ['bichiere', 'bicchere'], '🥛'], ['spaghetti', ['spagetti', 'spagghetti'], '🍝'],
      ['gomma', ['goma', 'gommma'], '🧽'], ['cappello', ['capello', 'cappelo'], '🎩'],
      ['sette', ['sete', 'settte'], '7️⃣'], ['babbo', ['babo', 'bbabbo'], '👨'],
      ['pizza', ['piza', 'pizzza'], '🍕'], ['tartaruga', ['tartarruga', 'tarttaruga'], '🐢'],
      ['zucchero', ['zuchero', 'zuccero'], '🍬'], ['sacco', ['saco', 'sacchò'], '🎒'],
      ['mamma', ['mama', 'mammma'], '👩'], ['neve', ['nevve', 'nnevе'], '❄️'],
      ['barca', ['barcca', 'bbarca'], '⛵'], ['penna', ['pena', 'pennna'], '🖊️'],
      ['coltello', ['coltelo', 'colltello'], '🔪'], ['formica', ['formicca', 'fformica'], '🐜'],
      ['scoppio', ['scopio', 'scoppjo'], '💥'], ['pennello', ['penello', 'pennelo'], '🖌️'],
      ['ombrello', ['ombrelo', 'ombbrello'], '☂️'], ['gattino', ['gatino', 'gattinno'], '🐱'],
    ],
  },
  /* L'ACCENTO: c'è o non c'è, e sta dove batte la voce.
     Prima metà dei falsi era la direzione — «caffé» contro «caffè»,
     «perchè» contro «perché» — e non andava bene per due motivi. Sullo
     schermo di un telefono i due segni sono quattro pixel di
     differenza, quindi la domanda misura la vista e non l'italiano. E
     soprattutto non è la regola che serve: quella vera è **ci vuole
     l'accento o no**, e su quale vocale va. La direzione è una
     convenzione tipografica che metà degli adulti sbaglia, e a un
     bambino di otto anni non cambia niente della vita.
     Restano quindi due errori, tutti e due veri: l'accento dimenticato
     e l'accento messo sulla sillaba sbagliata. */
  accento: {
    chiave: 'orto:accento', dritta: 'l\'accento si mette sull\'ultima vocale quando la voce batte lì',
    parole: [
      ['caffè', ['caffe', 'càffe'], '☕'], ['perché', ['perche', 'pèrche']],
      ['città', ['citta', 'cìtta'], '🏙️'], ['papà', ['papa', 'pàpa'], '👨'],
      ['lunedì', ['lunedi', 'lùnedi'], '📅'], ['così', ['cosi', 'còsi']],
      ['virtù', ['virtu', 'vìrtu']], ['poiché', ['poiche', 'pòiche']],
      ['già', ['gia', 'gìa']], ['più', ['piu', 'pìu']],
      ['metà', ['meta', 'mèta']], ['verità', ['verita', 'vèrita']],
      ['nonché', ['nonche', 'nònche']], ['martedì', ['martedi', 'màrtedi'], '📅'],
      ['libertà', ['liberta', 'libèrta']], ['giù', ['giu', 'gìu']],
      ['sarà', ['sara', 'sàra']], ['felicità', ['felicita', 'felìcita'], '😄'],
      ['però', ['pero', 'pèro']], ['università', ['universita', 'univèrsita'], '🎓'],
    ],
  },
  apostrofo: {
    chiave: 'orto:apostrofo', dritta: 'l\'apostrofo prende il posto di una vocale caduta',
    parole: [
      ["l'ape", ['lape', "l' ape"], '🐝'], ["un'amica", ['unamica', "un amica"], '👭'],
      ["l'orso", ['lorso', "l' orso"], '🐻'], ['un po\'', ['un pò', 'un po']],
      ["dov'è", ['dovè', "dov' è"]], ["c'è", ['cè', "c' è"]],
      ["all'ombra", ['allombra', "all ombra"]], ["quest'anno", ['questanno', "quest anno"]],
      ["l'elefante", ['lelefante', "l' elefante"], '🐘'], ["nell'acqua", ['nellacqua', 'nell acqua'], '💧'],
      ["un'ora", ['unora', 'un ora'], '⏰'], ["dell'orso", ['dellorso', 'dell orso']],
      ["sull'albero", ['sullalbero', 'sull albero'], '🌳'], ["d'accordo", ['daccordo', "d accordo"]],
      ["l'amico", ['lamico', "l' amico"]], ["senz'altro", ['senzaltro', 'senz altro']],
      ["quell'uomo", ['quelluomo', 'quell uomo']], ["un'idea", ['unidea', 'un idea'], '💡'],
    ],
  },
}

/* ── le frasi con l'acca ──
   Qui non c'è una parola da guardare ma un buco da riempire: ho/o,
   hai/ai, ha/a, hanno/anno sono la stessa domanda in quattro salse, e
   l'unico modo di rispondere è chiedersi «è il verbo avere?». */
const ACCA = [
  ['___ mangiato tutta la pizza.', 'ho', ['o'], '🍕'],
  ['___ visto il mio cane?', 'Hai', ['Ai'], '🐕'],
  ['Marta ___ due gatti.', 'ha', ['a'], '🐈'],
  ['I nonni ___ una casa al mare.', 'hanno', ['anno'], '🏖️'],
  ['Vado ___ scuola con Luca.', 'a', ['ha'], '🏫'],
  ['Vieni con me ___ resti qui?', 'o', ['ho']],
  ['L\'___ prossimo faccio otto anni.', 'anno', ['hanno'], '🎂'],
  ['Ho dato la palla ___ bambini.', 'ai', ['hai'], '⚽'],
  ['___ freddo o caldo?', 'Ho', ['O'], '🥶'],
  ['Il gelato ___ il gusto di fragola.', 'ha', ['a'], '🍦'],
  ['Noi ___ finito i compiti.', 'abbiamo', ['abiamo'], '📓'],
  ['Domani andiamo ___ Roma.', 'a', ['ha'], '🏛️'],
  ['I bambini ___ paura del buio.', 'hanno', ['anno'], '🌙'],
  ['___ tu la mia penna?', 'Hai', ['Ai'], '🖊️'],
  ['Preferisci il tè ___ il latte?', 'o', ['ho'], '🥛'],
  ['Il cane ___ mangiato l\'osso.', 'ha', ['a'], '🦴'],
  ['Quest\'___ ho imparato a nuotare.', 'anno', ['hanno'], '🏊'],
  ['___ dato il libro a Sara.', 'Ho', ['O'], '📗'],
]

/* ── l'accento che cambia il significato ──
   Questa è la regola dell'accento che serve davvero, ed è fatta come
   quella dell'acca: non c'è niente da ricordare a memoria, c'è da
   capire cosa dice la frase. «Il gelato e buono» non è brutto da
   vedere, è **un'altra cosa** — e finché non lo si sente, l'accento
   sembra un ghirigoro che i grandi mettono a caso. */
const CAMBIA = [
  ['Il gelato ___ buono.', 'è', ['e'], '🍦'],
  ['Marco ___ Sara giocano insieme.', 'e', ['è'], '👫'],
  ['___, vengo anch\'io!', 'Sì', ['Si'], '🙋'],
  ['Non ___ sa mai come va a finire.', 'si', ['sì']],
  ['La palla è ___, sotto il tavolo.', 'là', ['la'], '⚽'],
  ['Passami ___ penna rossa.', 'la', ['là'], '🖊️'],
  ['Il nonno mi ___ la mano.', 'dà', ['da'], '🤝'],
  ['Domani vengo ___ te.', 'da', ['dà'], '🏠'],
  ['Pensa solo a ___ stesso.', 'sé', ['se']],
  ['___ piove restiamo a casa.', 'Se', ['Sé'], '🌧️'],
  ['Non voglio ___ questo ___ quello.', 'né', ['ne']],
  ['Di torta ___ ho mangiata due fette.', 'ne', ['né'], '🍰'],
  ['Questo cane ___ mio.', 'è', ['e'], '🐕'],
  ['Il gatto ___ il topo corrono.', 'e', ['è'], '🐈'],
  ['Vieni qui o resti ___?', 'là', ['la']],
  ['Ho perso ___ chiave di casa.', 'la', ['là'], '🔑'],
  ['La maestra ci ___ i compiti.', 'dà', ['da'], '📓'],
  ['Torno ___ scuola alle quattro.', 'da', ['dà'], '🏫'],
  ['___ che ho ragione io.', 'So', ['Sò']],
  ['Non ___ dove ho messo il libro.', 'so', ['sò'], '📚'],
]

/* ── che cosa si chiede a ogni grado ──
   Solo la riga da leggere: quali domande escono a ogni grado lo dicono
   i tipi qui sotto, ed è l'unico posto dove sta scritto. */
const SCALETTA = [
  'gn e gl',
  'sc, sce e sci',
  'le doppie',
  'cqu, cia e cie',
  'accenti, apostrofi e la lettera h',
]

/* Le tipologie. I gruppi di lettere e le doppie sono `suoni-difficili`:
   si imparano scrivendo, e chi non li ha ancora visti li sbaglia ma può
   ragionarci sopra. Accento, apostrofo e acca sono l'altro gruppo — i
   segni che cambiano una parola — e lì senza la regola non c'è niente
   da ragionare. */
const TIPI = [
  { chiave: 'orto:gn', nome: 'Il suono gn (montagna)', sa: 'suoni-difficili', gradi: { 1: 0.5, 2: 0.33 } },
  { chiave: 'orto:gl', nome: 'Il suono gl (famiglia)', sa: 'suoni-difficili', gradi: { 1: 0.5, 2: 0.33 } },
  { chiave: 'orto:sc', nome: 'Il suono sc (pesce, scienza)', sa: 'suoni-difficili', gradi: { 2: 0.34, 3: 0.5 } },
  { chiave: 'orto:doppie', nome: 'Le doppie', sa: 'suoni-difficili', gradi: { 3: 0.5, 4: 0.33 } },
  { chiave: 'orto:cqu', nome: 'Acqua e la sua famiglia (cqu, qu, cu)', sa: 'suoni-difficili', gradi: { 4: 0.34 } },
  { chiave: 'orto:ce-cie', nome: 'cia, ce e cie', sa: 'suoni-difficili', gradi: { 4: 0.33 } },
  { chiave: 'orto:acca', nome: 'La lettera h (ho, hai, ha, hanno)', sa: 'accenti', gradi: { 5: 0.3 } },
  { chiave: 'orto:accento-cambia', nome: "L'accento che cambia il significato (è, sì, là)", sa: 'accenti', gradi: { 5: 0.3 } },
  { chiave: 'orto:accento', nome: "Quando ci vuole l'accento", sa: 'accenti', gradi: { 5: 0.2 } },
  { chiave: 'orto:apostrofo', nome: "L'apostrofo", sa: 'accenti', gradi: { 5: 0.2 } },
]

class Ortografia extends Modulo {
  constructor() {
    super({
      id: 'ortografia',
      nome: 'Ortografia',
      icona: '✏️',
      materia: 'italiano',
      chiaro: 'le parole che si scrivono diverse da come si sentono',
      scaletta: SCALETTA,
      tipi: TIPI,
    })
  }

  genera(grado, sorte, tipo) {
    if (tipo === 'orto:acca') return this.frase(sorte)
    if (tipo === 'orto:accento-cambia') return this.cambia(sorte)
    const regola = Object.values(REGOLE).find(r => r.chiave === tipo) || REGOLE.gn
    const [parola, errori, em] = sorte.uno(regola.parole)
    if (regola.gruppi && parola.includes(regola.gruppi[0]) && sorte.forse(0.4))
      return this.buco(regola, parola, sorte)

    /* Con l'emoji si guarda la cosa e si sceglie come si scrive; senza,
       si legge e basta. Le due domande allenano la stessa regola ma non
       si somigliano, che è quello che tiene sveglio un bambino. */
    return domanda({
      testo: em ? 'Come si scrive?' : 'Quale parola è scritta giusta?',
      soggetto: em ? { emoji: em } : undefined,
      buona: testo(parola),
      falsi: sorte.alcuni(errori, 2).map(e => testo(e, regola.dritta)),
      chiave: regola.chiave,
      aiuto: regola.dritta,
      sorte,
    })
  }

  /* il buco nella parola: «lava__a» con gn, ni, gni da scegliere.
     È la stessa regola dell'altra domanda ma girata al contrario —
     lì si riconosce la forma giusta, qui si deve produrre. */
  buco(regola, parola, sorte) {
    const gruppo = regola.gruppi[0]
    return domanda({
      testo: 'Con che cosa si completa?',
      soggetto: { testo: parola.replace(gruppo, ' __ ') },
      buona: testo(gruppo),
      falsi: regola.gruppi.slice(1).map(g => testo(g, regola.dritta)),
      chiave: regola.chiave,
      aiuto: regola.dritta,
      sorte,
    })
  }

  /* la frase col buco: l'acca del verbo avere */
  frase(sorte) {
    const [frase, buona, falsi, em] = sorte.uno(ACCA)
    return domanda({
      testo: frase,
      soggetto: em ? { emoji: em } : undefined,
      buona: testo(buona),
      falsi: falsi.map(f => testo(f, 'l\'acca c\'è solo quando è il verbo avere')),
      chiave: 'orto:acca',
      aiuto: 'ho, hai, ha, hanno vogliono l\'acca: sono il verbo avere',
      sorte,
    })
  }

  /* la frase col buco dove l'accento cambia la parola: stessa forma
     dell'acca, perché è lo stesso mestiere — leggere la frase e capire
     quale delle due cose sta dicendo */
  cambia(sorte) {
    const [frase, buona, falsi, em] = sorte.uno(CAMBIA)
    const dritta = 'l\'accento cambia il significato: leggi la frase e senti quale delle due ci sta'
    return domanda({
      testo: frase,
      soggetto: em ? { emoji: em } : undefined,
      buona: testo(buona),
      falsi: falsi.map(f => testo(f, dritta)),
      chiave: 'orto:accento-cambia',
      aiuto: dritta,
      sorte,
    })
  }
}

export default new Ortografia()
