// gli ambienti del mondo e chi ci abita: il passo da fare c'è (un animale si porta addosso il posto dove vive, vedi "si ricava, non si ricorda" in docs/apprendimento/quiz-moduli.md), il criterio è quello di scuola non la biologia (il cammello è il deserto e basta). Un animale ambiguo (gatto: città E fattoria) dichiara tutte le sue case: la prima è la risposta giusta sempre uguale, le altre non compaiono mai fra i falsi — così nessuna domanda mette in fila due risposte difendibili.
import { Modulo } from '../nucleo/modulo.js'
import { domanda, emoji, conNome } from '../nucleo/domanda.js'
import { AMBIENTI, NOMI_AMBIENTI, PITTORI_AMBIENTI, scenaAmbiente } from '../grafica/pittori/ambienti.js'

// i cinque posti di casa prima, i cinque del mondo dopo: anche i FALSI vengono da qui, o «vive nella giungla?» chiede una parola mai sentita
const DA_GRADO = {
  fattoria: 1, citta: 1, mare: 1, bosco: 1, stagno: 1,
  savana: 2, deserto: 2, giungla: 2, banchisa: 2, montagna: 2,
}

// `g`: da che grado entra in scena, segue quanto è comune non quanto è esotico
export const BESTIE = [
  /* fattoria */
  { em: '🐄', nome: 'la mucca', dove: 'fattoria', g: 1 },
  { em: '🐖', nome: 'il maiale', dove: 'fattoria', g: 1 },
  { em: '🐔', nome: 'la gallina', dove: 'fattoria', g: 1 },
  { em: '🐑', nome: 'la pecora', dove: 'fattoria', g: 1 },
  { em: '🐴', nome: 'il cavallo', dove: 'fattoria', g: 1 },
  { em: '🐐', nome: 'la capra', dove: ['fattoria', 'montagna'], g: 2 },
  { em: '🐰', nome: 'il coniglio', dove: ['fattoria', 'bosco'], g: 2 },
  { em: '🦃', nome: 'il tacchino', dove: 'fattoria', g: 3 },

  /* città */
  { em: '🐕', nome: 'il cane', dove: ['citta', 'fattoria'], g: 1 },
  { em: '🐈', nome: 'il gatto', dove: ['citta', 'fattoria'], g: 1 },
  { em: '🐁', nome: 'il topo', dove: ['citta', 'fattoria'], g: 2 },
  { em: '🕊️', nome: 'il piccione', dove: 'citta', g: 3 },

  /* mare */
  { em: '🐟', nome: 'il pesce', dove: ['mare', 'stagno'], g: 1 },
  { em: '🐬', nome: 'il delfino', dove: 'mare', g: 1 },
  { em: '🐋', nome: 'la balena', dove: 'mare', g: 1 },
  { em: '🦈', nome: 'lo squalo', dove: 'mare', g: 2 },
  { em: '🐙', nome: 'il polpo', dove: 'mare', g: 3 },
  { em: '🦀', nome: 'il granchio', dove: 'mare', g: 3 },

  /* bosco */
  { em: '🦌', nome: 'il cervo', dove: 'bosco', g: 1 },
  { em: '🦊', nome: 'la volpe', dove: 'bosco', g: 1 },
  { em: '🐻', nome: "l'orso", dove: ['bosco', 'montagna'], g: 2 },
  { em: '🐿️', nome: 'lo scoiattolo', dove: 'bosco', g: 2 },
  { em: '🦉', nome: 'il gufo', dove: 'bosco', g: 3 },
  { em: '🐗', nome: 'il cinghiale', dove: ['bosco', 'montagna'], g: 3 },
  { em: '🦔', nome: 'il riccio', dove: 'bosco', g: 3 },

  /* stagno */
  { em: '🦆', nome: "l'anatra", dove: ['stagno', 'fattoria'], g: 1 },
  { em: '🐸', nome: 'la rana', dove: 'stagno', g: 1 },
  { em: '🦢', nome: 'il cigno', dove: 'stagno', g: 3 },
  { em: '🦫', nome: 'il castoro', dove: 'stagno', g: 3 },

  /* savana */
  { em: '🦁', nome: 'il leone', dove: 'savana', g: 2 },
  { em: '🐘', nome: "l'elefante", dove: 'savana', g: 2 },
  { em: '🦒', nome: 'la giraffa', dove: 'savana', g: 2 },
  { em: '🦓', nome: 'la zebra', dove: 'savana', g: 2 },
  { em: '🦏', nome: 'il rinoceronte', dove: 'savana', g: 3 },
  { em: '🦛', nome: "l'ippopotamo", dove: 'savana', g: 3 },

  /* deserto */
  { em: '🐪', nome: 'il cammello', dove: 'deserto', g: 2 },
  { em: '🦂', nome: 'lo scorpione', dove: 'deserto', g: 3 },

  /* giungla */
  { em: '🐒', nome: 'la scimmia', dove: 'giungla', g: 2 },
  { em: '🐅', nome: 'la tigre', dove: 'giungla', g: 2 },
  { em: '🦜', nome: 'il pappagallo', dove: 'giungla', g: 2 },
  { em: '🦍', nome: 'il gorilla', dove: 'giungla', g: 3 },
  { em: '🦥', nome: 'il bradipo', dove: 'giungla', g: 3 },
  { em: '🐆', nome: 'il leopardo', dove: ['savana', 'giungla'], g: 3 },

  /* ghiacci */
  { em: '🐧', nome: 'il pinguino', dove: 'banchisa', g: 2 },
  { em: '🐻‍❄️', nome: "l'orso polare", dove: 'banchisa', g: 2 },
  { em: '🦭', nome: 'la foca', dove: 'banchisa', g: 3 },

  /* montagna */
  { em: '🦅', nome: "l'aquila", dove: ['montagna', 'bosco'], g: 2 },
  { em: '🦙', nome: 'il lama', dove: 'montagna', g: 3 },
]

// gli indizi del corpo (grado 4): nessun animale da ricordare, un fatto vero di QUEL posto e falso degli altri nove.
// quattro frasi per posto, non una: senza, l'impronta della domanda (dal `testo`) userebbe sempre la stessa consegna
const INDIZI = {
  banchisa: [
    'ha il pelo bianco e uno strato di grasso sotto la pelle, per non sentire il gelo',
    'ha le zampe larghe e pelose, per non affondare quando cammina sulla neve',
    'nuota in un\'acqua così fredda che senza uno strato di grasso sotto la pelle si congelerebbe',
    'vive dove per metà dell\'anno il sole non tramonta quasi mai, e per l\'altra metà è quasi sempre buio',
  ],
  deserto: [
    'sopporta giorni senza bere e cammina sulla sabbia bollente senza scottarsi',
    'ha la gobba piena di grasso, per resistere tanti giorni senza mangiare né bere',
    'ha le zampe larghe che non si affondano nella sabbia',
    'vive dove di giorno il caldo è fortissimo e di notte fa freddo, e la pioggia è rarissima',
  ],
  mare: [
    'non ha zampe, respira in superficie e non esce mai dall\'acqua salata',
    'nuota per tutta la vita in acqua salata e non tocca mai la terra, perché non ha le zampe',
    'ha il corpo fatto per nuotare veloce, senza mai uscire dall\'acqua profonda e salata',
    'vive in un\'acqua così grande che non se ne vede la fine, e piena di sale',
  ],
  giungla: [
    'sta sugli alberi di un posto dove piove quasi ogni giorno e non fa mai freddo',
    'vive fra alberi altissimi e foglie enormi, dove l\'aria è calda e umida tutto l\'anno',
    'si arrampica e salta da un albero all\'altro in un posto dove piove quasi tutti i giorni',
    'vive in un posto così caldo e umido che non nevica mai, nemmeno una volta l\'anno',
  ],
  savana: [
    'vive nell\'erba alta e gialla, dove piove solo in una stagione e l\'acqua è lontana',
    'vive in una pianura d\'erba gialla con pochi alberi, dove per metà dell\'anno non piove quasi mai',
    'deve camminare a lungo per trovare l\'acqua, in un posto pieno d\'erba alta e con pochi alberi',
    'vive in un posto caldo con l\'erba gialla, dove piove forte solo in una stagione dell\'anno',
  ],
  montagna: [
    'si arrampica sulle rocce ripide e respira bene anche dove l\'aria è sottile',
    'si arrampica su rocce ripide dove l\'aria è fredda e sottile, e in cima nevica anche d\'estate',
    'vive in alto, dove fa più freddo che in basso e ci sono più rocce che erba',
    'ha zampe forti per arrampicarsi su pendii ripidi che farebbero paura a chiunque altro',
  ],
  bosco: [
    'fa la scorta di ghiande e nocciole per l\'inverno fra gli alberi che perdono le foglie',
    'vive fra alberi che d\'inverno restano spogli, e fa la scorta di cibo prima del freddo',
    'si nasconde fra tronchi e foglie cadute, in un posto dove d\'inverno può nevicare',
    'vive in una foresta come le nostre, dove le foglie cadono in autunno e la neve arriva d\'inverno',
  ],
  stagno: [
    'ha le zampe palmate e non si allontana mai dall\'acqua dolce e ferma',
    'non si allontana mai da un\'acqua dolce e ferma, circondata da canne e piante',
    'ha le zampe fatte apposta per nuotare in un\'acqua dolce che non scorre, vicino alle canne',
    'vive in un\'acqua dolce e ferma, piccola, con le canne intorno e niente sale',
  ],
  fattoria: [
    'lo nutre l\'uomo, che in cambio prende il suo latte, le sue uova o la sua lana',
    'vive vicino alle persone, che lo nutrono ogni giorno e prendono qualcosa da lui in cambio',
    'sta in un recinto o in una stalla, e ogni giorno arriva qualcuno a portargli da mangiare',
    'non deve cercarsi il cibo da solo: ci pensa l\'uomo, in cambio di latte, uova o lana',
  ],
  citta: [
    'vive fra le case e le strade, e mangia quello che le persone lasciano indietro',
    'vive fra i palazzi e le strade, e trova da mangiare vicino alle persone senza essere allevato da loro',
    'gira per le strade e i cortili, e si arrangia con quello che trova vicino alle case',
    'vive in mezzo al traffico e alle case, senza un padrone che lo nutra apposta',
  ],
}

// va nell'`aiuto`, si legge dopo aver sbagliato
const COS_E = {
  savana: 'la savana è la pianura d\'erba alta e gialla dell\'Africa, con pochi alberi',
  deserto: 'il deserto è sabbia e sassi, caldissimo di giorno, dove non piove quasi mai',
  giungla: 'la giungla è la foresta dove piove ogni giorno e gli alberi sono altissimi',
  banchisa: 'i ghiacci sono il mare gelato dei poli, dove è sempre inverno',
  mare: 'il mare è acqua salata, e non se ne vede la fine',
  bosco: 'il bosco è la foresta dei posti come il nostro, dove d\'inverno cade la neve',
  montagna: 'la montagna è roccia ripida e aria fredda, sopra i boschi',
  stagno: 'lo stagno è acqua dolce e ferma, con le canne intorno',
  fattoria: 'la fattoria è il posto degli animali che l\'uomo alleva',
  citta: 'la città è dove viviamo noi, fra le case e le strade',
}

const SCALETTA = [
  'I posti che si conoscono: la fattoria, il mare, il bosco',
  'I posti del mondo: savana, deserto, giungla, ghiacci',
  'Chi ci vive, e chi non c\'entra',
  'Com\'è fatto un animale dice dove vive',
]

// la chiave è la tipologia (`bio:dove-vive`), non il posto (`bio:savana` sembrava utile ma test/unita/saperi l'ha bocciato: la chiave dev'essere quella del tipo che l'ha chiesta)
const TIPI = [
  { chiave: 'bio:dove-vive', nome: 'Dove vive questo animale', sa: 'ambienti',
    gradi: { 1: 1, 2: 1, 3: 0.4, 4: 0.2 } },
  { chiave: 'bio:chi-ci-vive', nome: 'Chi vive in questo posto', sa: 'ambienti',
    gradi: { 3: 0.3 } },
  { chiave: 'bio:intruso', nome: 'Chi non vive qui', sa: 'ambienti',
    gradi: { 3: 0.3, 4: 0.3 } },
  { chiave: 'bio:adattamento', nome: 'Il corpo dice il posto', sa: ['adattamento', 'ambienti'],
    gradi: { 4: 0.5 } },
]

// le preposizioni non si ricavano dal nome («nella savana», «in montagna»): scriverle qui costa meno di una frase storta
export const DOVE = {
  savana: 'nella savana', deserto: 'nel deserto', giungla: 'nella giungla',
  banchisa: 'fra i ghiacci', mare: 'nel mare', bosco: 'nel bosco',
  montagna: 'in montagna', stagno: 'nello stagno',
  fattoria: 'in fattoria', citta: 'in città',
}
const dove = id => DOVE[id]

// case di un animale, sempre come elenco: chi ne ha una la scrive come stringa (caso normale), chi legge non deve saperlo
export const caseDi = b => [].concat(b.dove)
const case_ = caseDi
export const casa = b => case_(b)[0] // la casa che si chiede: la prima, sempre la stessa

const bestieDi = grado => BESTIE.filter(b => b.g <= grado)
const postiDi = grado => AMBIENTI.filter(a => DA_GRADO[a.id] <= grado)
// di casa (prima casa) sceglie la risposta giusta; non va confuso con case_(b).includes(id), che scarta un falso
const diCasa = (id, grado) => bestieDi(grado).filter(b => casa(b) === id)

const posto = id => conNome({ scena: scenaAmbiente(id) }, NOMI_AMBIENTI[id])
const bestia = b => conNome({ emoji: b.em }, b.nome.replace(/^(il |la |lo |l')/, ''))

// due esempi di chi ci vive, per spiegare un falso: dice più di «sbagliato»
function chiCiVive(id, grado, sorte) {
  const gente = diCasa(id, Math.max(grado, 2))
  if (!gente.length) return `${NOMI_AMBIENTI[id]}: non è il suo posto`
  const due = sorte.alcuni(gente, Math.min(2, gente.length)).map(b => b.nome)
  return `${NOMI_AMBIENTI[id]}: ci vivono ${due.join(' e ')}`
}

class Animali extends Modulo {
  constructor() {
    super({
      id: 'animali',
      nome: 'Animali e ambienti',
      icona: '🦁',
      materia: 'scienze',
      chiaro: 'dove vive un animale, e come si capisce guardandolo',
      scaletta: SCALETTA,
      livelli: [12, 25, 38, 50], // scala 0-100 comune a tutte le materie (vedi docs/apprendimento/quiz-livelli.md)
      tipi: TIPI,
      pittori: PITTORI_AMBIENTI,
    })
  }

  genera(grado, sorte, tipo) {
    switch (tipo) {
      case 'bio:chi-ci-vive': return this.chiViveQui(grado, sorte)
      case 'bio:intruso': return this.intruso(grado, sorte)
      case 'bio:adattamento': return this.adattamento(grado, sorte)
      default: return this.doveVive(grado, sorte)
    }
  }

  doveVive(grado, sorte) {
    // si scartano gli animali che non lascerebbero abbastanza posti liberi per tre falsi (case multiple)
    const liberi = postiDi(grado).length
    const b = sorte.uno(bestieDi(grado).filter(x =>
      DA_GRADO[casa(x)] <= grado && liberi - case_(x).length >= 3))
    const sua = casa(b)
    const falsi = sorte.distrattori(postiDi(grado).map(a => a.id), 3,
      id => case_(b).includes(id))
    return domanda({
      testo: 'Dove vive?',
      soggetto: conNome({ emoji: b.em }, b.nome),
      buona: posto(sua),
      falsi: falsi.map(id => ({ ...posto(id), perche: chiCiVive(id, grado, sorte) })),
      chiave: 'bio:dove-vive',
      aiuto: COS_E[sua],
      sorte,
    })
  }

  // il verso opposto: bisogna scorrere quattro animali e trovare quello che ci sta, non solo sapere dov'è di casa questo
  chiViveQui(grado, sorte) {
    const posti = postiDi(grado).filter(a => diCasa(a.id, grado).length)
    const a = sorte.uno(posti)
    const buona = sorte.uno(diCasa(a.id, grado))
    const falsi = sorte.distrattori(bestieDi(grado), 3, b => case_(b).includes(a.id))
    return domanda({
      testo: 'Chi vive qui?',
      soggetto: conNome({ scena: scenaAmbiente(a.id) }, NOMI_AMBIENTI[a.id]),
      buona: bestia(buona),
      falsi: falsi.map(b => ({ ...bestia(b),
        perche: `${b.nome} vive ${case_(b).map(dove).join(' o ')}` })),
      chiave: 'bio:chi-ci-vive',
      aiuto: COS_E[a.id],
      sorte,
    })
  }

  // stessa forma dell'intruso di lessico.js: il falso è sempre una cosa vera, solo nel posto sbagliato
  intruso(grado, sorte) {
    const posti = postiDi(grado).filter(a => diCasa(a.id, grado).length >= 3)
    const a = sorte.uno(posti)
    const dentro = sorte.alcuni(diCasa(a.id, grado), 3)
    const fuori = sorte.uno(bestieDi(grado).filter(b => !case_(b).includes(a.id)))
    return domanda({
      testo: `Tre di questi vivono ${dove(a.id)}. Chi no?`,
      buona: bestia(fuori),
      falsi: dentro.map(b => ({ ...bestia(b), perche: `${b.nome} vive ${dove(a.id)}` })),
      chiave: 'bio:intruso',
      aiuto: COS_E[a.id],
      sorte,
    })
  }

  // nessun animale in scena: solo un fatto, e il posto da ricavare (si sbaglia ragionando, non per non ricordare)
  adattamento(grado, sorte) {
    const posti = postiDi(grado).filter(a => INDIZI[a.id])
    const a = sorte.uno(posti)
    const falsi = sorte.distrattori(posti.map(x => x.id), 3, id => id === a.id)
    const indizio = sorte.uno(INDIZI[a.id])
    return domanda({
      testo: `Un animale ${indizio}.\nDove vive?`,
      buona: posto(a.id),
      falsi: falsi.map(id => ({ ...posto(id), perche: `${NOMI_AMBIENTI[id]}: ${COS_E[id].split(' è ')[1] || 'non torna'}` })),
      chiave: 'bio:adattamento',
      aiuto: COS_E[a.id],
      sorte,
    })
  }
}

export default new Animali()
