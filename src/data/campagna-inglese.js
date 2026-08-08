/* ═══════════════════════════════════════════════════════════════════
   LA CAMPAGNA DI ENGLISH — tredici tappe, una strada sola.

   Prima l'inglese era due giochi separati (parole con le figure, verbi
   in ascolto) e nessuno dei due andava da nessuna parte: si apriva, si
   macinava, si chiudeva. Qui vale quello che vale per i pianeti delle
   tabelline: la strada è già tracciata, ogni tappa porta roba nuova, e
   quello di prima resta dentro come ripasso.

   La forma delle tappe — cumulativa, con bersaglio e mirate — sta in
   `campagna-lingua.js`, condivisa con lo spagnolo: qui ci sono solo i
   contenuti e le dritte da leggere.
   ═══════════════════════════════════════════════════════════════════ */
import { WORDS } from './words.js'
import { VERBI } from './verbi.js'
import { FRASI } from './frasi.js'
import { chiaveParolaDi, chiaveVerboDi, chiaveFraseDi } from './lessico.js'
import { creaCampagna, NOMI_TIPI } from './campagna-lingua.js'

export const chiaveParola = chiaveParolaDi('en')
export const chiaveVerbo = chiaveVerboDi('en')
export const chiaveFrase = chiaveFraseDi('en')

/* i tipi di domanda, dal più facile al più difficile: l'elenco vero sta
   in `data/domande.js`, qui si ri-esporta perché la campagna è il posto
   da cui si guarda cosa una tappa apre. */
export const TIPI = NOMI_TIPI

const T = [
  { emoji: '🐶', nome: 'Gli animali', cats: ['a'],
    apre: ['figura'],
    dritta: 'Si comincia guardando: tocca la figura giusta. Le parole che ti sembrano già familiari — panda, zebra — sono regali: in inglese si dicono quasi uguali.' },
  { emoji: '🍎', nome: 'A tavola', cats: ['f'],
    apre: ['ascoltoFigura'],
    dritta: 'Da qui, appena una parola cominci a saperla, il gioco ti toglie il testo e te la fa solo sentire. Tocca la carta 🎧 per risentirla quante volte vuoi.' },
  { emoji: '🎨', nome: 'Colori e numeri', cats: ['c', 'n'],
    apre: ['tradIt'],
    dritta: 'I numeri oltre il dieci finiscono quasi tutti in -teen: thirteen, fourteen, fifteen. È tredici, quattordici, quindici con la coda.' },
  { emoji: '🏠', nome: 'Casa e scuola', cats: ['h', 's'],
    apre: ['ascoltoIt'],
    dritta: 'Le cose di tutti i giorni: quelle che puoi indicare col dito mentre le dici a voce.' },
  { emoji: '🏃', nome: 'Le azioni', verbi: true,
    apre: [],
    dritta: 'I verbi sono quelli che fanno succedere le cose. Senza di loro hai un elenco di oggetti, non una frase.' },
  { emoji: '👕', nome: 'Corpo, vestiti e gente', cats: ['b', 'p', 'k'],
    apre: ['tradStra'],
    dritta: 'Da qui il gioco a volte gira la domanda: parte dall’italiano e tocca a te trovare l’inglese. È più difficile, ed è il segno che quelle parole ormai le sai.' },
  { emoji: '🌳', nome: 'Fuori: natura e tempo', cats: ['w'],
    apre: [],
    dritta: 'Il tempo che fa è la prima cosa di cui si parla in inglese. Sempre. Davvero.' },
  { emoji: '🚗', nome: 'In giro', cats: ['t', 'y', 'g'],
    apre: [],
    dritta: 'Mezzi, posti e giochi: le parole che servono quando esci di casa.' },
  { emoji: '📅', nome: 'Giorni e parole di ogni giorno', cats: ['d', 'q'],
    apre: [],
    dritta: 'I giorni e i mesi in inglese si scrivono con la MAIUSCOLA: Monday, June. In italiano no, ed è un errore che fanno tutti.' },
  { emoji: '📏', nome: 'Com’è fatto', cats: ['j'],
    apre: [],
    dritta: 'Gli aggettivi in inglese stanno PRIMA del nome e non cambiano mai: a big dog, big dogs. Mai "bigs".' },
  { emoji: '💬', nome: 'Le prime frasi', frasi: 1,
    apre: ['fraseIt', 'fraseStra'],
    dritta: 'Occhio alle risposte che sembrano uguali: «questo è un gatto» e «questo è un gatto?» sono due frasi diverse. In inglese la domanda si fa girando il verbo — this is → is this.' },
  { emoji: '🗣️', nome: 'Frasi di ogni giorno', frasi: 2,
    apre: ['buco'],
    dritta: 'Qualche domanda ha un buco da riempire. Ricordati la regola più importante di tutte: I am, you are, he is.' },
  { emoji: '🏆', nome: 'La prova finale', frasi: 3,
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
