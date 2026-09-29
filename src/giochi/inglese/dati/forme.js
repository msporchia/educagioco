// Le strutture (le «forme») dell'inglese a mondi: la chiave SRS è
// `forma:<id>`. `parole` sono le parole di struttura che la forma porta con
// sé (note da quando la forma si incontra); `regola` è il «Si fa così» che
// si mostra dopo uno sbaglio. Vedi docs/lingue/mondi.md.
export const PREFISSO_FORMA = 'forma:'

export const FORME = {
  'it-is': {
    nome: 'it is a …',
    parole: ['it', 'is', 'a', 'an', 'the', 'not'],
    regola: 'Per dire che cos’è: it is a dog. It è la cosa, is vuol dire «è».',
  },
  'is-it': {
    nome: 'is it …?',
    parole: ['is', 'it', 'yes', 'no'],
    regola: 'Per chiedere si gira: is it a dog? Il verbo va prima di it.',
  },
  'colore-prima': {
    nome: 'a red ball',
    parole: [],
    regola: 'Il colore va prima della cosa: a red ball. E non prende mai la s.',
  },
  plurale: {
    nome: 'they are … / two dogs',
    parole: ['they', 'are', 'and'],
    regola: 'Da due in su la cosa prende la s: two dogs. «Sono» si dice they are.',
  },
  'this-is': {
    nome: 'this is …',
    parole: ['this', 'not'],
    regola: 'This vuol dire «questo»: this is a pen. Per chiedere: is this a pen?',
  },
  'i-like': {
    nome: 'I like / I do not like',
    parole: ['I', 'like', 'do', 'you', 'not', 'yes', 'no'],
    regola: 'Mi piace: I like. Non mi piace: I do not like. Ti piace?: do you like?',
  },
  'this-is-my': {
    nome: 'this is my …',
    parole: ['my', 'your', 'he', 'she', 'I', 'am', 'you', 'are'],
    regola: 'My è mio, your è tuo. He è lui, she è lei. I am, you are, he is.',
  },
  'have-got': {
    nome: 'I have got …',
    parole: ['have', 'got'],
    regola: 'Ho: I have got. Hai?: have you got? Non ho: I have not got.',
  },
  'has-got': {
    nome: 'she has got …',
    parole: ['has'],
    regola: 'Con he, she e it si dice has got: she has got a cat.',
  },
  /* Le forme dei mondi che non ci sono ancora: servono alle righe della
     tabella delle trappole, che si provano già adesso sul loro esempio. */
  can: { nome: 'I can …', parole: ['can', 'cannot'], regola: 'Dopo can il verbo va da solo: I can swim.' },
  'terza-s': { nome: 'she plays', parole: ['does'], regola: 'Con he, she e it il verbo prende la s: she plays.' },
  passato: { nome: 'I went', parole: ['was', 'were'], regola: 'Tanti verbi al passato cambiano forma: go → went.' },
}

export const chiaveForma = id => PREFISSO_FORMA + id

export function guastiDelleForme() {
  const g = []
  for (const [id, f] of Object.entries(FORME)) {
    if (!f.nome) g.push(`forma ${id}: senza nome`)
    if (!f.regola) g.push(`forma ${id}: senza regola`)
    else if (f.regola.length > 110) g.push(`forma ${id}: regola troppo lunga`)
    if (!Array.isArray(f.parole)) g.push(`forma ${id}: parole non è un elenco`)
  }
  return g
}
