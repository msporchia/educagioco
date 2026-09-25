/* ═══════════════════════════════════════════════════════════════════
   LE CLASSI DEGLI ANIMALI — mammiferi, uccelli, pesci, anfibi, rettili,
   insetti: non un animale in più, un ASSE DIVERSO.

   `animali.js` chiede DOVE vive un animale e COME SI CAPISCE guardando
   il corpo. Questo modulo chiede A CHE FAMIGLIA appartiene, e sono due
   cose diverse per davvero: un bambino può sapere benissimo che il
   delfino vive in mare e non avere idea che sia un mammifero. La
   chiave — allattare, avere le piume, respirare con le branchie, sei
   zampe — è la stessa in tutte le tipologie, quindi la domanda si
   risponde APPLICANDO UNA REGOLA, non ricordando una scheda a memoria.

   I FALSI SONO GLI ERRORI VERI. Non distrattori a caso, ma quello che
   un bambino dice davvero: la balena e il delfino presi per pesci
   perché vivono in mare, il pipistrello per un uccello perché vola, il
   pinguino «non è un uccello perché non vola», il ragno e lo scorpione
   per insetti perché sono piccoli e hanno tante zampe, la tartaruga per
   un anfibio perché sta un po' in acqua un po' in terra. Ognuno ha il
   suo `percheTrappola`, scritto per smontare proprio quell'idea — non
   «sbagliato», ma perché.

   NESSUNA DOMANDA HA DUE RISPOSTE DIFENDIBILI. Il ragno e lo scorpione
   (aracnidi, otto zampe) non sono mai la risposta giusta di «che classe
   è»: non sono una delle sei classi che la scuola insegna a questa età,
   sono l'intruso che le assomiglia. Li si vede solo dove il contrasto è
   la domanda stessa: «chi non è della famiglia» e «quante zampe ha».
   L'ornitorinco (mammifero che nasce da un uovo) non compare affatto:
   è un'eccezione vera, e un'eccezione messa in mezzo a una regola che
   si sta insegnando è una trappola, non una curiosità — resterà una
   frase da aggiungere il giorno che servirà a una domanda sua.

   LA CHIAVE È IL CONCETTO: `zoo:` è un prefisso nuovo (guardando
   `store/progressi.js` e i moduli in `moduli/`, `bio:` è già degli
   ambienti). Sei tipologie, non sei animali: `sa: 'classi-animali'`
   le tiene tutte insieme, perché per un genitore sono un sapere solo —
   vedi `src/data/saperi.js`.
   ═══════════════════════════════════════════════════════════════════ */

import { Modulo } from '../nucleo/modulo.js'
import { domanda, testo, conNome } from '../nucleo/domanda.js'

/* ── le sei classi che la scuola insegna a questa età ──
   `tratto` è la regola positiva («ha le piume ed è nato da un uovo»),
   usata sia per spiegare la classe giusta sia — negata — per spiegare
   perché un animale NON è quella sbagliata: «il gatto non respira con
   le branchie» è vero di qualunque animale che non sia un pesce, quindi
   il `contro` regge da solo, chiunque sia il soggetto della domanda. */
const CLASSI = {
  mammifero: {
    nome: 'mammifero', plurale: 'mammiferi',
    tratto: 'allatta i piccoli con il latte della madre',
    contro: 'non allatta i piccoli',
    cosE: 'i mammiferi hanno il pelo e allattano i piccoli con il latte della madre',
  },
  uccello: {
    nome: 'uccello', plurale: 'uccelli',
    tratto: 'ha le piume ed è nato da un uovo con il guscio duro',
    contro: 'non ha le piume né è nato da un uovo con il guscio duro',
    cosE: 'gli uccelli hanno le piume, il becco, e nascono da un uovo con il guscio duro',
  },
  pesce: {
    nome: 'pesce', plurale: 'pesci',
    tratto: 'ha le squame e respira sott\'acqua con le branchie',
    contro: 'non respira con le branchie',
    cosE: 'i pesci hanno le squame e respirano sott\'acqua con le branchie',
  },
  anfibio: {
    nome: 'anfibio', plurale: 'anfibi',
    tratto: 'ha la pelle nuda e umida, e vive un po\' in acqua un po\' in terra',
    contro: 'non ha la pelle nuda né vive metà in acqua e metà in terra',
    cosE: 'gli anfibi hanno la pelle nuda: da piccoli vivono in acqua e respirano con le branchie, da grandi vanno anche in terra e respirano con i polmoni',
  },
  rettile: {
    nome: 'rettile', plurale: 'rettili',
    tratto: 'ha le squame secche e depone le uova sulla terra',
    contro: 'non ha le squame secche',
    cosE: 'i rettili hanno le squame secche e depongono le uova sulla terra',
  },
  insetto: {
    nome: 'insetto', plurale: 'insetti',
    tratto: 'ha sei zampe e il corpo diviso in tre parti',
    contro: 'non ha sei zampe',
    cosE: 'gli insetti hanno sei zampe e il corpo diviso in tre parti: testa, torace e addome',
  },
}

/* ── quattro frasi diverse per classe, per l'indizio ──
   Come in `animali.js`: la stessa regola detta in più modi, sempre vera
   della classe e falsa delle altre cinque. */
const INDIZI_CLASSE = {
  mammifero: [
    'Ha il pelo e allatta i piccoli con il latte della madre.',
    'Nasce già formato, e sua madre lo allatta col latte.',
  ],
  uccello: [
    'Ha le piume e nasce da un uovo con il guscio duro.',
    'Ha il becco, le piume, e nasce da un uovo con il guscio duro.',
  ],
  pesce: [
    'Ha le squame e respira sott\'acqua con le branchie.',
    'Vive sempre in acqua e respira con le branchie, mai con i polmoni.',
  ],
  anfibio: [
    'Ha la pelle nuda e umida, e vive un po\' in acqua un po\' in terra.',
  ],
  rettile: [
    'Ha le squame secche e depone le uova sulla terra.',
  ],
  insetto: [
    'Ha sei zampe e il corpo diviso in tre parti.',
  ],
}

/* ── curiosità vere, una frase, dette dopo aver sbagliato ──
   Non su tutti gli animali: solo dove ne conosciamo una controllata, e
   solo per aggiungere qualcosa oltre alla regola, mai al posto sua. */
const CURIOSITA = {
  'il pipistrello': 'è l\'unico mammifero che riesce davvero a volare, non solo a planare',
  'il delfino': 'dorme con un occhio aperto, tenendo mezzo cervello sveglio per respirare',
  'la balena': 'respira aria e sale in superficie a soffiare, come una fontana',
  'la foca': 'può restare sott\'acqua diversi minuti senza tornare a respirare',
  'il pinguino': 'non vola in aria, ma sott\'acqua nuota usando le ali come pinne',
  'la tartaruga': 'alcune tartarughe di mare vivono più di cent\'anni',
  'il coccodrillo': 'può restare sott\'acqua trattenendo il respiro per quasi un\'ora',
  'il canguro': 'la mamma porta il piccolo in una tasca sulla pancia finché non è grande',
  'il polpo': 'ha otto tentacoli e il sangue blu',
  'il ragno': 'ha otto zampe e spesso anche otto occhi: è un aracnide, non un insetto',
  'lo scorpione': 'ha otto zampe come il ragno: è un aracnide, non un insetto',
}

/* ── la tabella degli animali ──
   `trappola` è la classe SBAGLIATA in cui un bambino metterebbe questo
   animale, con la frase che smonta proprio quell'idea. `classe: 'altro'`
   sono gli invertebrati che non sono insetti (aracnidi, molluschi,
   crostacei, vermi): non sono una delle sei classi scolastiche, quindi
   non escono mai come risposta giusta di «che classe è» — solo come
   intruso, o per contare le zampe. `aracnide: true` serve solo lì. */
const ANIMALI = [
  /* mammiferi */
  { em: '🐶', nome: 'il cane', classe: 'mammifero' },
  { em: '🐱', nome: 'il gatto', classe: 'mammifero' },
  { em: '🐭', nome: 'il topo', classe: 'mammifero' },
  { em: '🐹', nome: 'il criceto', classe: 'mammifero' },
  { em: '🐰', nome: 'il coniglio', classe: 'mammifero' },
  { em: '🦊', nome: 'la volpe', classe: 'mammifero' },
  { em: '🐻', nome: 'l\'orso', classe: 'mammifero' },
  { em: '🐼', nome: 'il panda', classe: 'mammifero' },
  { em: '🐨', nome: 'il koala', classe: 'mammifero' },
  { em: '🦁', nome: 'il leone', classe: 'mammifero' },
  { em: '🐯', nome: 'la tigre', classe: 'mammifero' },
  { em: '🐮', nome: 'la mucca', classe: 'mammifero' },
  { em: '🐷', nome: 'il maiale', classe: 'mammifero' },
  { em: '🐑', nome: 'la pecora', classe: 'mammifero' },
  { em: '🐴', nome: 'il cavallo', classe: 'mammifero' },
  { em: '🦌', nome: 'il cervo', classe: 'mammifero' },
  { em: '🐘', nome: 'l\'elefante', classe: 'mammifero' },
  { em: '🦏', nome: 'il rinoceronte', classe: 'mammifero' },
  { em: '🦒', nome: 'la giraffa', classe: 'mammifero' },
  { em: '🦓', nome: 'la zebra', classe: 'mammifero' },
  { em: '🐿️', nome: 'lo scoiattolo', classe: 'mammifero' },
  { em: '🦫', nome: 'il castoro', classe: 'mammifero' },
  { em: '🦥', nome: 'il bradipo', classe: 'mammifero' },
  { em: '🦘', nome: 'il canguro', classe: 'mammifero' },
  { em: '🦇', nome: 'il pipistrello', classe: 'mammifero', trappola: 'uccello',
    percheTrappola: 'Il pipistrello non ha piume né becco: ha il pelo e allatta i piccoli, è un mammifero che vola.' },
  { em: '🐬', nome: 'il delfino', classe: 'mammifero', trappola: 'pesce',
    percheTrappola: 'Il delfino non respira con le branchie: sale in superficie e respira aria con i polmoni, allatta i piccoli, è un mammifero.' },
  { em: '🐋', nome: 'la balena', classe: 'mammifero', trappola: 'pesce',
    percheTrappola: 'La balena respira aria e allatta i piccoli: è un mammifero, anche se vive in mare come i pesci.' },
  { em: '🦭', nome: 'la foca', classe: 'mammifero', trappola: 'pesce',
    percheTrappola: 'La foca ha il pelo e allatta i piccoli sulla spiaggia: è un mammifero, anche se nuota come un pesce.' },

  /* uccelli */
  { em: '🐦', nome: 'l\'uccellino', classe: 'uccello' },
  { em: '🦅', nome: 'l\'aquila', classe: 'uccello' },
  { em: '🦉', nome: 'il gufo', classe: 'uccello' },
  { em: '🦜', nome: 'il pappagallo', classe: 'uccello' },
  { em: '🦆', nome: 'l\'anatra', classe: 'uccello' },
  { em: '🦢', nome: 'il cigno', classe: 'uccello' },
  { em: '🐓', nome: 'il gallo', classe: 'uccello' },
  { em: '🐔', nome: 'la gallina', classe: 'uccello' },
  { em: '🦃', nome: 'il tacchino', classe: 'uccello' },
  { em: '🦩', nome: 'il fenicottero', classe: 'uccello' },
  { em: '🕊️', nome: 'la colomba', classe: 'uccello' },
  { em: '🦚', nome: 'il pavone', classe: 'uccello' },
  { em: '🐧', nome: 'il pinguino', classe: 'uccello', trappola: 'pesce',
    percheTrappola: 'Il pinguino ha le piume ed è nato da un uovo: è un uccello, anche se non vola e nuota benissimo.' },

  /* pesci */
  { em: '🐟', nome: 'il pesce', classe: 'pesce' },
  { em: '🐠', nome: 'il pesce tropicale', classe: 'pesce' },
  { em: '🐡', nome: 'il pesce palla', classe: 'pesce' },
  { em: '🦈', nome: 'lo squalo', classe: 'pesce' },

  /* anfibi */
  { em: '🐸', nome: 'la rana', classe: 'anfibio' },

  /* rettili */
  { em: '🐢', nome: 'la tartaruga', classe: 'rettile', trappola: 'anfibio',
    percheTrappola: 'La tartaruga ha le squame e depone le uova sulla terra o sulla sabbia: è un rettile, non un anfibio.' },
  { em: '🐍', nome: 'il serpente', classe: 'rettile' },
  { em: '🦎', nome: 'la lucertola', classe: 'rettile' },
  { em: '🐊', nome: 'il coccodrillo', classe: 'rettile' },

  /* insetti */
  { em: '🐝', nome: 'l\'ape', classe: 'insetto' },
  { em: '🐜', nome: 'la formica', classe: 'insetto' },
  { em: '🦋', nome: 'la farfalla', classe: 'insetto' },
  { em: '🐞', nome: 'la coccinella', classe: 'insetto' },
  { em: '🦗', nome: 'il grillo', classe: 'insetto' },
  { em: '🦟', nome: 'la zanzara', classe: 'insetto' },
  { em: '🪰', nome: 'la mosca', classe: 'insetto' },
  { em: '🪲', nome: 'il coleottero', classe: 'insetto' },

  /* altri invertebrati: non insetti, e non una delle sei classi */
  { em: '🕷️', nome: 'il ragno', classe: 'altro', trappola: 'insetto', aracnide: true,
    percheTrappola: 'Il ragno ha otto zampe, non sei: è un aracnide, non un insetto.' },
  { em: '🦂', nome: 'lo scorpione', classe: 'altro', trappola: 'insetto', aracnide: true,
    percheTrappola: 'Lo scorpione ha otto zampe come il ragno: è un aracnide, non un insetto.' },
  { em: '🐙', nome: 'il polpo', classe: 'altro' },
  { em: '🦑', nome: 'il calamaro', classe: 'altro' },
  { em: '🐌', nome: 'la chiocciola', classe: 'altro' },
  { em: '🦀', nome: 'il granchio', classe: 'altro' },
  { em: '🦐', nome: 'il gamberetto', classe: 'altro' },
  { em: '🪱', nome: 'il verme', classe: 'altro' },
]

const VERTEBRATO = {
  mammifero: true, uccello: true, pesce: true, anfibio: true, rettile: true,
  insetto: false, altro: false,
}

/* ── la regola giusta: la ragione, non l'indizio ──
   Qui la domanda non è «che classe è» ma «perché»: la buona è il
   motivo che insegna la regola, i falsi sono i motivi che un bambino dà
   davvero — veri dell'animale, ma non quelli che decidono la classe. */
const REGOLE = [
  { em: '🐋', nome: 'la balena', classe: 'mammifero', buona: 'allatta i piccoli con il latte della madre',
    falsiTipici: ['vive in mare', 'è molto grande', 'nuota velocissima', 'soffia acqua dal naso'] },
  { em: '🐬', nome: 'il delfino', classe: 'mammifero', buona: 'allatta i piccoli con il latte della madre',
    falsiTipici: ['vive in mare', 'è molto intelligente', 'nuota velocissimo', 'salta fuori dall\'acqua'] },
  { em: '🦇', nome: 'il pipistrello', classe: 'mammifero', buona: 'allatta i piccoli con il latte della madre',
    falsiTipici: ['vola', 'esce di notte', 'vive nelle caverne', 'ha le ali'] },
  { em: '🐶', nome: 'il cane', classe: 'mammifero', buona: 'allatta i piccoli con il latte della madre',
    falsiTipici: ['ha quattro zampe', 'abbaia', 'vive in casa con noi', 'scodinzola'] },
  { em: '🐧', nome: 'il pinguino', classe: 'uccello', buona: 'ha le piume ed è nato da un uovo con il guscio duro',
    falsiTipici: ['vive al freddo', 'nuota benissimo', 'non vola', 'sta in gruppo con altri pinguini'] },
  { em: '🐔', nome: 'la gallina', classe: 'uccello', buona: 'ha le piume ed è nata da un uovo con il guscio duro',
    falsiTipici: ['ha il becco', 'vive nel pollaio', 'non vola in alto', 'fa "coccodè"'] },
  { em: '🦈', nome: 'lo squalo', classe: 'pesce', buona: 'respira sott\'acqua con le branchie',
    falsiTipici: ['vive in mare', 'è grande e pericoloso', 'nuota velocissimo', 'ha molti denti'] },
  { em: '🐸', nome: 'la rana', classe: 'anfibio', buona: 'da piccola respira con le branchie in acqua, da grande con i polmoni',
    falsiTipici: ['salta', 'vive vicino all\'acqua', 'è verde', 'fa "cra cra"'] },
  { em: '🐢', nome: 'la tartaruga', classe: 'rettile', buona: 'ha le squame e depone le uova sulla terra',
    falsiTipici: ['ha il guscio duro', 'è molto lenta', 'vive tanti anni', 'sta anche in acqua'] },
  { em: '🐝', nome: 'l\'ape', classe: 'insetto', buona: 'ha sei zampe e il corpo diviso in tre parti',
    falsiTipici: ['vola', 'fa il miele', 'vive in un alveare', 'punge'] },
  { em: '🐜', nome: 'la formica', classe: 'insetto', buona: 'ha sei zampe e il corpo diviso in tre parti',
    falsiTipici: ['vive in una colonia', 'è molto piccola', 'porta pesi enormi per la sua taglia', 'lavora sempre'] },
]

/* ── gli impostori: chi si fa scambiare per un membro della famiglia ──
   Per «chi non è della famiglia»: un animale che vive o si comporta
   come quella classe, ma non ne fa parte. Ricostruita dal campo
   `trappola` degli animali, invece di scriverla due volte. */
const impostoriDi = classe => ANIMALI.filter(a => a.trappola === classe)

const SCALETTA = [
  'Dagli indizi alla classe',
  'Che classe è questo animale',
  'Chi non è della famiglia',
  'Perché è di quella classe',
  'Vertebrati, invertebrati, insetti e ragni',
]

const TIPI = [
  { chiave: 'zoo:indizio-classe', nome: 'Dagli indizi alla classe', sa: 'classi-animali',
    gradi: { 1: 1, 2: 0.35 } },
  { chiave: 'zoo:che-classe', nome: 'Che classe è questo animale', sa: 'classi-animali',
    gradi: { 2: 0.65, 3: 0.3 } },
  { chiave: 'zoo:intruso', nome: 'Chi non è della famiglia', sa: 'classi-animali',
    gradi: { 3: 0.5, 4: 0.3 } },
  { chiave: 'zoo:regola', nome: 'Perché è di quella classe', sa: 'classi-animali',
    gradi: { 4: 0.5, 5: 0.4 } },
  { chiave: 'zoo:vertebrati', nome: 'Vertebrato o invertebrato', sa: 'classi-animali',
    gradi: { 3: 0.2, 5: 0.3 } },
  { chiave: 'zoo:zampe', nome: 'Insetto o ragno: quante zampe', sa: 'classi-animali',
    gradi: { 4: 0.2, 5: 0.3 } },
]

const Cap = s => s.charAt(0).toUpperCase() + s.slice(1)
const senzaArticolo = nome => nome.replace(/^(il |la |lo |l')/, '')
const bestia = a => conNome({ emoji: a.em }, senzaArticolo(a.nome))
const CLASSI_CHIAVI = Object.keys(CLASSI)

/* la curiosità, se ne conosciamo una vera per questo animale */
const curiositaDi = nome => CURIOSITA[nome] ? ` Curiosità: ${CURIOSITA[nome]}.` : ''

class ClassiAnimali extends Modulo {
  constructor() {
    super({
      id: 'classi-animali',
      nome: 'Le classi degli animali',
      icona: '🐋',
      materia: 'scienze',
      chiaro: 'riconoscere mammiferi, uccelli, pesci, anfibi, rettili e insetti applicando la regola',
      scaletta: SCALETTA,
      /* Vertebrati, invertebrati e le classi si insegnano in terza e
         quarta (Indicazioni 2012): prima la regola non si può ancora
         applicare, non c'è niente da ragionare sopra. La scala comune
         (12,5 punti per anno, 0 = quattro anni) mette terza a 50 e
         quarta a 62,5: i cinque gradi vanno da poco prima di terza (per
         chi la sta anticipando giocando) a un anno dentro quarta. */
      livelli: [44, 50, 56, 60, 65],
      tipi: TIPI,
    })
  }

  genera(grado, sorte, tipo) {
    switch (tipo) {
      case 'zoo:che-classe': return this.cheClasse(sorte)
      case 'zoo:intruso': return this.intruso(sorte)
      case 'zoo:regola': return this.regola(sorte)
      case 'zoo:vertebrati': return this.vertebrati(sorte)
      case 'zoo:zampe': return this.zampe(sorte)
      default: return this.indizioClasse(sorte)
    }
  }

  /* ── 1. dagli indizi alla classe ──
     La regola viene detta, non l'animale: quattro figure di quattro
     classi diverse, e solo una risponde all'indizio. */
  indizioClasse(sorte) {
    const classe = sorte.uno(CLASSI_CHIAVI)
    const frase = sorte.uno(INDIZI_CLASSE[classe])
    const buonaAnimale = sorte.uno(ANIMALI.filter(a => a.classe === classe))
    const altreClassi = sorte.alcuni(CLASSI_CHIAVI.filter(c => c !== classe), 3)
    const falsiAnimali = altreClassi.map(c => sorte.uno(ANIMALI.filter(a => a.classe === c)))
    return domanda({
      testo: `${frase}\nChi è?`,
      buona: bestia(buonaAnimale),
      falsi: falsiAnimali.map(a => ({
        ...bestia(a),
        perche: `${Cap(senzaArticolo(a.nome))} ${CLASSI[classe].contro}: è un ${CLASSI[a.classe].nome}.`,
      })),
      chiave: 'zoo:indizio-classe',
      aiuto: CLASSI[classe].cosE + curiositaDi(buonaAnimale.nome),
      sorte,
    })
  }

  /* ── 2. che classe è questo animale ──
     Peschiamo più spesso fra i casi che ingannano (il pipistrello, il
     delfino, il pinguino…): sono il motivo per cui questa tipologia
     esiste. Il ragno e lo scorpione non entrano qui: la loro classe
     vera non è una delle sei che si stanno insegnando. */
  cheClasse(sorte) {
    const trappole = ANIMALI.filter(a => a.trappola && a.classe !== 'altro')
    const usaTrappola = trappole.length && sorte.forse(0.55)
    const animale = usaTrappola ? sorte.uno(trappole)
      : sorte.uno(ANIMALI.filter(a => a.classe !== 'altro'))
    const classeCorretta = animale.classe
    const altre = CLASSI_CHIAVI.filter(c => c !== classeCorretta)
    const conTrappola = animale.trappola && altre.includes(animale.trappola)
    const resto = sorte.alcuni(altre.filter(c => c !== animale.trappola), conTrappola ? 2 : 3)
    const classiFalse = conTrappola ? [animale.trappola, ...resto] : resto

    const percheDi = c => c === animale.trappola
      ? animale.percheTrappola
      : `${Cap(senzaArticolo(animale.nome))} ${CLASSI[c].contro}: ${CLASSI[classeCorretta].tratto}, quindi è un ${CLASSI[classeCorretta].nome}.`

    return domanda({
      testo: 'A quale famiglia appartiene?',
      soggetto: conNome({ emoji: animale.em }, senzaArticolo(animale.nome)),
      buona: testo(CLASSI[classeCorretta].nome),
      falsi: classiFalse.map(c => testo(CLASSI[c].nome, percheDi(c))),
      chiave: 'zoo:che-classe',
      aiuto: CLASSI[classeCorretta].cosE + curiositaDi(animale.nome),
      sorte,
    })
  }

  /* ── 3. chi non è della famiglia ──
     Tre veri, e un quarto che sembra ma non è: il delfino fra i pesci,
     il pipistrello fra gli uccelli, il ragno fra gli insetti. Quando
     non c'è un impostore per quella classe si pesca un animale comune
     di un'altra famiglia, che resta comunque un vero intruso. */
  intruso(sorte) {
    const classi = CLASSI_CHIAVI.filter(c => ANIMALI.filter(a => a.classe === c).length >= 3)
    const c = sorte.uno(classi)
    const membri = ANIMALI.filter(a => a.classe === c)
    const dentro = sorte.alcuni(membri, 3)
    const impostori = impostoriDi(c)
    const fuori = impostori.length && sorte.forse(0.6) ? sorte.uno(impostori)
      : sorte.uno(ANIMALI.filter(a => a.classe !== c && a.classe !== 'altro' &&
          !dentro.some(d => d.nome === a.nome)))

    return domanda({
      testo: `Tre di questi sono ${CLASSI[c].plurale}. Chi non lo è?`,
      buona: bestia(fuori),
      falsi: dentro.map(a => ({
        ...bestia(a),
        perche: `${Cap(senzaArticolo(a.nome))} ${CLASSI[c].tratto}: è un ${CLASSI[c].nome}.`,
      })),
      chiave: 'zoo:intruso',
      aiuto: (fuori.trappola === c ? fuori.percheTrappola
        : `${Cap(senzaArticolo(fuori.nome))} ${CLASSI[fuori.classe]?.contro ?? 'non è di questa famiglia'}: non è un ${CLASSI[c].nome}.`) +
        curiositaDi(fuori.nome),
      sorte,
    })
  }

  /* ── 4. la regola giusta ──
     «Perché la balena è un mammifero?»: i falsi sono le ragioni vere
     che un bambino dà (vive in mare, è grande, nuota) e che non sono
     la regola — la regola è una sola, ed è quella che allatta. */
  regola(sorte) {
    const r = sorte.uno(REGOLE)
    const falsi = sorte.alcuni(r.falsiTipici, 3)
    const dritta = `Sì, è vero — ma non è il motivo: un ${CLASSI[r.classe].nome} lo è perché ${r.buona}.`
    return domanda({
      testo: `Perché ${r.nome} è un ${CLASSI[r.classe].nome}?`,
      soggetto: conNome({ emoji: r.em }, senzaArticolo(r.nome)),
      buona: testo(r.buona),
      falsi: falsi.map(f => testo(f, dritta)),
      chiave: 'zoo:regola',
      aiuto: CLASSI[r.classe].cosE + curiositaDi(r.nome),
      sorte,
    })
  }

  /* ── 5. vertebrato o invertebrato ──
     Due sole risposte: la spina dorsale c'è o non c'è, e non ci sono
     via di mezzo da confondere. */
  vertebrati(sorte) {
    const a = sorte.uno(ANIMALI)
    const vero = VERTEBRATO[a.classe]
    const giusta = vero ? 'vertebrato' : 'invertebrato'
    const sbagliata = vero ? 'invertebrato' : 'vertebrato'
    const spiegazione = vero
      ? `${Cap(senzaArticolo(a.nome))} ha la spina dorsale dentro il corpo: è un vertebrato.`
      : `${Cap(senzaArticolo(a.nome))} non ha la spina dorsale: è un invertebrato.`
    return domanda({
      testo: 'È un vertebrato o un invertebrato?',
      soggetto: conNome({ emoji: a.em }, senzaArticolo(a.nome)),
      buona: testo(giusta),
      falsi: [testo(sbagliata, spiegazione)],
      chiave: 'zoo:vertebrati',
      aiuto: 'i vertebrati hanno una spina dorsale dentro il corpo, come noi; gli invertebrati no' + curiositaDi(a.nome),
      sorte,
    })
  }

  /* ── 6. insetto o ragno: le zampe si contano ──
     Il ragno e lo scorpione hanno otto zampe, non sei: è la regola che
     li tiene fuori dagli insetti, e qui è la domanda stessa. */
  zampe(sorte) {
    const pool = ANIMALI.filter(a => a.classe === 'insetto' || a.aracnide)
    const a = sorte.uno(pool)
    const giusta = a.aracnide ? 8 : 6
    const opzioni = [6, 8, 4, 2].filter(n => n !== giusta)
    const spiegazioneDi = n => {
      if (n === 8) return `Otto zampe le hanno i ragni e gli scorpioni: ${senzaArticolo(a.nome)} ne ha ${giusta}.`
      if (n === 6) return `Sei zampe le hanno gli insetti: ${senzaArticolo(a.nome)} ne ha ${giusta}, è un aracnide.`
      if (n === 4) return `Quattro zampe le hanno tanti mammiferi: ${senzaArticolo(a.nome)} ne ha ${giusta}.`
      return `Due zampe le hanno gli uccelli e noi: ${senzaArticolo(a.nome)} ne ha ${giusta}.`
    }
    return domanda({
      testo: 'Quante zampe ha?',
      soggetto: conNome({ emoji: a.em }, senzaArticolo(a.nome)),
      buona: testo(String(giusta)),
      falsi: opzioni.map(n => testo(String(n), spiegazioneDi(n))),
      chiave: 'zoo:zampe',
      aiuto: a.aracnide
        ? 'i ragni e gli scorpioni hanno otto zampe: sono aracnidi, non insetti'
        : 'gli insetti hanno sempre sei zampe: è uno dei modi per riconoscerli',
      sorte,
    })
  }
}

export default new ClassiAnimali()
