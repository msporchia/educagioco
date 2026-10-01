// La campagna di English: tredici tappe, contenuti e dritte. La forma
// (cumulativa, bersaglio/mirate) sta in campagna-lingua.js. Vedi
// docs/lingue/vocaboli.md.
import { WORDS } from './words.js'
import { VERBI } from './verbi.js'
import { FRASI } from './frasi.js'
import { chiaveParolaDi, chiaveVerboDi, chiaveFraseDi } from './lessico.js'
import { creaCampagna, NOMI_TIPI } from './campagna-lingua.js'

export const chiaveParola = chiaveParolaDi('en')
export const chiaveVerbo = chiaveVerboDi('en')
export const chiaveFrase = chiaveFraseDi('en')

// riesportato: la campagna è il posto da cui si guarda cosa apre una tappa
export const TIPI = NOMI_TIPI

// `portata`: scala 0-100 di data/portata.js (vedi docs/apprendimento/eta-e-portata.md).
// Nessuna tappa dichiara `scuola`: questo gioco è l'unica fonte per queste
// parole, quindi la testa non si taglia mai per età.
const T = [
  { emoji: '🐶', nome: 'Gli animali', cats: ['a'],
    portata: 12,
    apre: ['figura'],
    dritta: 'Si comincia guardando: tocca la figura giusta. Le parole che ti sembrano già familiari — panda, zebra — sono regali: in inglese si dicono quasi uguali.' },
  { emoji: '🍎', nome: 'A tavola', cats: ['f'],
    portata: 15,
    apre: ['ascoltoFigura'],
    dritta: 'Da qui, appena una parola cominci a saperla, il gioco ti toglie il testo e te la fa solo sentire. Tocca la carta 🎧 per risentirla quante volte vuoi.' },
  { emoji: '🎨', nome: 'Colori e numeri', cats: ['c', 'n'],
    portata: 20,
    apre: ['tradIt'],
    dritta: 'I numeri oltre il dieci finiscono quasi tutti in -teen: thirteen, fourteen, fifteen. È tredici, quattordici, quindici con la coda.' },
  { emoji: '🏠', nome: 'Casa e scuola', cats: ['h', 's'],
    portata: 25,
    apre: ['ascoltoIt'],
    dritta: 'Le cose di tutti i giorni: quelle che puoi indicare col dito mentre le dici a voce.' },
  { emoji: '🏃', nome: 'Le azioni', verbi: true,
    portata: 30,
    apre: [],
    dritta: 'I verbi sono quelli che fanno succedere le cose. Senza di loro hai un elenco di oggetti, non una frase.' },
  { emoji: '👕', nome: 'Corpo, vestiti e gente', cats: ['b', 'p', 'k'],
    portata: 36,
    apre: ['tradStra'],
    dritta: 'Da qui il gioco a volte gira la domanda: parte dall’italiano e tocca a te trovare l’inglese. È più difficile, ed è il segno che quelle parole ormai le sai.' },
  { emoji: '🌳', nome: 'Fuori: natura e tempo', cats: ['w'],
    portata: 40,
    apre: [],
    dritta: 'Il tempo che fa è la prima cosa di cui si parla in inglese. Sempre. Davvero.' },
  { emoji: '🚗', nome: 'In giro', cats: ['t', 'y', 'g', 'm'],
    portata: 44,
    apre: [],
    dritta: 'Mezzi, posti e giochi: le parole che servono quando esci di casa.' },
  { emoji: '📅', nome: 'Giorni e parole di ogni giorno', cats: ['d', 'q', 'e'],
    portata: 48,
    apre: [],
    dritta: 'I giorni e i mesi in inglese si scrivono con la MAIUSCOLA: Monday, June. In italiano no, ed è un errore che fanno tutti.' },
  { emoji: '📏', nome: 'Com’è fatto', cats: ['j'],
    portata: 52,
    apre: [],
    dritta: 'Gli aggettivi in inglese stanno PRIMA del nome e non cambiano mai: a big dog, big dogs. Mai "bigs".' },
  { emoji: '💬', nome: 'Le prime frasi', frasi: 1,
    portata: 60,
    apre: ['fraseIt', 'fraseStra'],
    dritta: 'Occhio alle risposte che sembrano uguali: «questo è un gatto» e «questo è un gatto?» sono due frasi diverse. In inglese la domanda si fa girando il verbo — this is → is this.' },
  { emoji: '🗣️', nome: 'Frasi di ogni giorno', frasi: 2,
    portata: 68,
    apre: ['buco'],
    dritta: 'Qualche domanda ha un buco da riempire. Ricordati la regola più importante di tutte: I am, you are, he is.' },
  { emoji: '🏆', nome: 'La prova finale', frasi: 3,
    portata: 75,
    apre: [],
    dritta: 'Tutto insieme, senza sconti: parole, verbi e frasi, avanti e indietro. Se passi questa, l’inglese della scuola non ti fa più paura.' },
]

export const { CAMPAGNA, LIBERO, tappaDi: tappaEn } = creaCampagna(T, {
  parole: WORDS, verbi: VERBI, frasi: FRASI,
  chiaveParola, chiaveVerbo, chiaveFrase,
})

/* Quante chiavi di una tappa sono già imparate: serve per allineare la
   campagna a chi giocava prima che esistesse, e per la mappa. */
export const chiaviDi = i => tappaEn(i).chiavi
