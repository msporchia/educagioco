// La campagna di Spagnolo: stessa forma di English (campagna-lingua.js),
// stesso ordine di categorie, contenuti e dritte diversi — lo spagnolo è
// difficile in punti diversi (genere, ser/estar, tener). Vedi
// docs/lingue/vocaboli.md.
import { PAROLE_ES } from './parole-es.js'
import { VERBI_ES } from './verbi-es.js'
import { FRASI_ES } from './frasi-es.js'
import { chiaveParolaDi, chiaveVerboDi, chiaveFraseDi } from './lessico.js'
import { creaCampagna } from './campagna-lingua.js'

export const chiaveParolaEs = chiaveParolaDi('es')
export const chiaveVerboEs = chiaveVerboDi('es')
export const chiaveFraseEs = chiaveFraseDi('es')

// `portata`: scala 0-100 di data/portata.js (vedi docs/apprendimento/eta-e-portata.md).
// Nessuna tappa dichiara `scuola`: questo gioco è l'unica fonte per queste
// parole, quindi la testa non si taglia mai per età.
const T = [
  { emoji: '🐶', nome: 'Gli animali', cats: ['a'],
    portata: 12,
    apre: ['figura'],
    dritta: 'Si comincia guardando: tocca la figura giusta. Tante parole spagnole sono quasi le nostre — tigre, elefante, rana — e sono regali: prendili.' },
  { emoji: '🍎', nome: 'A tavola', cats: ['f'],
    portata: 15,
    apre: ['ascoltoFigura'],
    dritta: 'Da qui, appena una parola cominci a saperla, il gioco ti toglie il testo e te la fa solo sentire. Tocca la carta 🎧 per risentirla quante volte vuoi. In spagnolo si legge come si scrive: quello che senti, sai già scriverlo.' },
  { emoji: '🎨', nome: 'Colori e numeri', cats: ['c', 'n'],
    portata: 20,
    apre: ['tradIt'],
    dritta: 'I colori cambiano insieme alla parola che accompagnano: el gato negro, la casa blanca. La -o è del maschile, la -a del femminile, e non si sbaglia quasi mai.' },
  { emoji: '🏠', nome: 'Casa e scuola', cats: ['h', 's'],
    portata: 25,
    apre: ['ascoltoIt'],
    dritta: 'Attento al genere: in spagnolo si dice LA leche e EL agua, al contrario dell’italiano. Impara sempre la parola con il suo articolo, ti risparmia anni di errori.' },
  { emoji: '🏃', nome: 'Le azioni', verbi: true,
    portata: 30,
    apre: [],
    dritta: 'I verbi spagnoli finiscono in -ar, -er, -ir, come i nostri in -are, -ere, -ire: hablar è parlare, comer è mangiare, vivir è vivere. Una volta visto, non lo dimentichi più.' },
  { emoji: '👕', nome: 'Corpo, vestiti e gente', cats: ['b', 'p', 'k'],
    portata: 36,
    apre: ['tradStra'],
    dritta: 'Da qui il gioco a volte gira la domanda: parte dall’italiano e tocca a te trovare lo spagnolo. È più difficile, ed è il segno che quelle parole ormai le sai.' },
  { emoji: '🌳', nome: 'Fuori: natura e tempo', cats: ['w'],
    portata: 40,
    apre: [],
    dritta: 'Il tempo che fa in spagnolo si FA: hace frío, hace calor, hace sol. Non «è freddo»: hace frío.' },
  { emoji: '🚗', nome: 'In giro', cats: ['t', 'y', 'g', 'e', 'm'],
    portata: 44,
    apre: [],
    dritta: 'Mezzi, posti e giochi. Occhio a due parole che sembrano italiane e non lo sono: «burro» in spagnolo è l’asino, e il burro si chiama mantequilla.' },
  { emoji: '📅', nome: 'Giorni e parole di ogni giorno', cats: ['d', 'q'],
    portata: 48,
    apre: [],
    dritta: 'I giorni e i mesi in spagnolo vanno con la MINUSCOLA, come da noi: lunes, martes, enero. In inglese no, e chi studia tutte e due si confonde.' },
  { emoji: '📏', nome: 'Com’è fatto', cats: ['j'],
    portata: 52,
    apre: [],
    dritta: 'Gli aggettivi spagnoli stanno DOPO il nome, come in italiano — una casa grande — e cambiano con lui: casas grandes.' },
  { emoji: '💬', nome: 'Le prime frasi', frasi: 1,
    portata: 60,
    apre: ['fraseIt', 'fraseStra'],
    dritta: 'Le domande in spagnolo si scrivono con due segni: ¿ all’inizio e ? alla fine. Serve a sapere già dalla prima parola che stai leggendo una domanda: ¿dónde está mamá?' },
  { emoji: '🗣️', nome: 'Frasi di ogni giorno', frasi: 2,
    portata: 68,
    apre: ['buco'],
    dritta: 'Qui c’è la cosa che gli italiani sbagliano di più: fame, sete, freddo e anni in spagnolo si HANNO. Tengo hambre, tengo frío, tengo ocho años. Mai «soy hambre».' },
  { emoji: '🏆', nome: 'La prova finale', frasi: 3,
    portata: 75,
    apre: [],
    dritta: 'SER è quello che sei sempre, ESTAR è come stai adesso o dove ti trovi: mi hermano ES simpático, pero hoy ESTÁ enojado. Se hai passato questa, con la mamma puoi parlare davvero.' },
]

export const { CAMPAGNA, LIBERO, tappaDi: tappaEs } = creaCampagna(T, {
  parole: PAROLE_ES, verbi: VERBI_ES, frasi: FRASI_ES,
  chiaveParola: chiaveParolaEs, chiaveVerbo: chiaveVerboEs, chiaveFrase: chiaveFraseEs,
})

export const chiaviDi = i => tappaEs(i).chiavi
