// Le strutture (le «forme») dell'inglese a mondi: la chiave SRS è
// `forma:<id>`. `parole` sono le parole di struttura che la forma porta con
// sé (note da quando la forma si incontra); `regola` è il «Si fa così» che
// si mostra dopo uno sbaglio; `segni` sono le parole da cui si riconosce
// che una frase usa quella struttura: una frase di una tappa ne contiene
// almeno uno (`#c` vuol dire un colore, `#j` un aggettivo, `#n` un numero).
// Vedi docs/lingue/mondi.md.
export const PREFISSO_FORMA = 'forma:'

export const FORME = {
  saluti: {
    nome: 'hello, my name is …',
    parole: ['hello', 'goodbye', 'good', 'morning', 'afternoon', 'evening', 'night', 'my', 'name',
             'is', 'I', 'am', 'what', 'your', 'how', 'are', 'you', 'fine', 'thank', 'yes', 'no'],
    segni: ['name', 'hello', 'goodbye', 'how', 'fine', 'morning', 'night', 'am'],
    regola: 'Per presentarti: my name is Leo, o I am Leo. Per chiedere: what is your name?',
  },
  'it-is': {
    nome: 'it is a …',
    parole: ['it', 'is', 'a', 'an', 'the', 'not'],
    segni: ['it'],
    regola: 'Per dire che cos’è: it is a dog. It è la cosa, is vuol dire «è».',
  },
  'is-it': {
    nome: 'is it …?',
    parole: ['is', 'it', 'yes', 'no'],
    segni: ['it'],
    regola: 'Per chiedere si gira: is it a dog? Il verbo va prima di it.',
  },
  'colore-prima': {
    nome: 'a red ball',
    parole: [],
    segni: ['#c', '#j'],
    regola: 'Il colore va prima della cosa: a red ball. E non prende mai la s.',
  },
  plurale: {
    nome: 'they are … / two dogs',
    parole: ['they', 'are', 'and'],
    segni: ['they', 'are', '#n'],
    regola: 'Da due in su la cosa prende la s: two dogs. «Sono» si dice they are.',
  },
  'this-is': {
    nome: 'this is …',
    parole: ['this', 'not'],
    segni: ['this'],
    regola: 'This vuol dire «questo»: this is a pen. Per chiedere: is this a pen?',
  },
  'i-like': {
    nome: 'I like / I do not like',
    parole: ['I', 'like', 'do', 'you', 'not', 'yes', 'no'],
    segni: ['like'],
    regola: 'Mi piace: I like. Non mi piace: I do not like. Ti piace?: do you like?',
  },
  'this-is-my': {
    nome: 'this is my …',
    parole: ['my', 'your', 'he', 'she', 'I', 'am', 'you', 'are'],
    segni: ['my', 'your', 'he', 'she', 'am', 'you'],
    regola: 'My è mio, your è tuo. He è lui, she è lei. I am, you are, he is.',
  },
  'have-got': {
    nome: 'I have got …',
    parole: ['have', 'got'],
    segni: ['have'],
    regola: 'Ho: I have got. Hai?: have you got? Non ho: I have not got.',
  },
  'has-got': {
    nome: 'she has got …',
    parole: ['has'],
    segni: ['has'],
    regola: 'Con he, she e it si dice has got: she has got a cat.',
  },
  'there-is': {
    nome: 'there is / there are',
    parole: ['there', 'is', 'are', 'in', 'on', 'how', 'many'],
    segni: ['there'],
    regola: 'C’è: there is a cat. Ci sono: there are two cats. Per chiedere: is there…?',
  },
  dove: {
    nome: 'where is …? in, on, under',
    parole: ['where', 'in', 'on', 'under', 'behind', 'near'],
    segni: ['where', 'in', 'on', 'under', 'behind', 'near'],
    regola: 'Dov’è?: where is…? In è dentro, on è sopra, under è sotto, behind è dietro.',
  },
  oggi: {
    nome: 'today is Monday, in May',
    parole: ['today', 'tomorrow', 'in', 'on', 'it', 'is'],
    segni: ['today', 'tomorrow', 'in'],
    regola: 'Oggi è lunedì: today is Monday. Con i mesi e le stagioni si dice in: in May.',
  },
  can: {
    nome: 'I can …',
    parole: ['can', 'cannot'],
    segni: ['can', 'cannot'],
    regola: 'Dopo can il verbo va da solo: I can swim. Non so: I cannot swim.',
  },
  /* Le forme dei mondi che hanno solo le tappe di parole (quarta e
     quinta): non hanno ancora frasi da comporre, ma sono il programma
     dell'anno e il libro di quel mondo le usa (docs/lingue/libro.md). Le
     loro `parole` sono anche le parolette che servono a raccontare;
     `flessione` è la forma dei verbi che la struttura ammette nel libro
     (motore/flessioni.js: s, ing, ed, irr). */
  presente: { nome: 'I play',
              parole: ['I', 'you', 'we', 'they', 'at', 'to', 'every', 'day', 'always', 'never', 'sometimes',
                       'with', 'home', 'by', 'me', 'us', 'them', 'our', 'their', 'because', 'but', 'very',
                       'then', 'after', 'before', 'from', 'for', 'who'],
              segni: ['at'],
              regola: 'Con I, you, we e they il verbo resta com’è: I play, we go.' },
  'terza-s': { nome: 'she plays', parole: ['does', 'he', 'she', 'his', 'her', 'him'], segni: ['does'],
               flessione: 's', regola: 'Con he, she e it il verbo prende la s: she plays.' },
  ing: { nome: 'I am playing', parole: ['am', 'is', 'are', 'now'], segni: ['am', 'is', 'are'], flessione: 'ing',
         regola: 'Adesso: am, is o are, e il verbo con -ing: I am playing.' },
  ora: { nome: 'what time is it?', parole: ['what', 'time', 'it', 'is', 'at', 'o\'clock'], segni: ['time', 'at'],
         regola: 'Che ore sono?: what time is it? Alle tre: at three o’clock.' },
  'was-were': { nome: 'I was, we were', parole: ['was', 'were', 'yesterday', 'last'], segni: ['was', 'were'],
                regola: 'Ieri: I was, he was, we were, they were.' },
  passato: { nome: 'I went', parole: ['was', 'were'], segni: [], flessione: 'irr',
             regola: 'Tanti verbi al passato cambiano forma: go → went.' },
  'passato-ed': { nome: 'I played', parole: [], segni: [], flessione: 'ed',
                  regola: 'Al passato tanti verbi prendono -ed: play → played.' },
}

export const chiaveForma = id => PREFISSO_FORMA + id

export function guastiDelleForme() {
  const g = []
  for (const [id, f] of Object.entries(FORME)) {
    if (!f.nome) g.push(`forma ${id}: senza nome`)
    if (!f.regola) g.push(`forma ${id}: senza regola`)
    else if (f.regola.length > 110) g.push(`forma ${id}: regola troppo lunga`)
    if (!Array.isArray(f.parole)) g.push(`forma ${id}: parole non è un elenco`)
    if (!Array.isArray(f.segni)) g.push(`forma ${id}: segni non è un elenco`)
    if (f.flessione && !['s', 'ing', 'ed', 'irr'].includes(f.flessione))
      g.push(`forma ${id}: flessione sconosciuta ${f.flessione}`)
  }
  return g
}
