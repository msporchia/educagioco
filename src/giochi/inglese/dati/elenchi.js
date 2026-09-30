// Gli elenchi in comune fra i capitoli del libro: personaggi, animali,
// colori, cibi… con le forme italiane che servono alle risposte. Il mondo
// da cui una parola è nota NON si scrive qui: lo dice il grafo
// (dati/mondi.js), quindi una parola che entra in una tappa arricchisce da
// sola tutti i capitoli che la possono pescare. Vedi docs/lingue/mondi.md.
//
// Campi: en (la chiave di data/words.js), it, un (con l'articolo
// indeterminativo), il (determinativo), itPl / ilPl (plurale), pl (plurale
// inglese, solo se irregolare).

export const PERSONAGGI = [
  { nome: 'Laura', lei: true },
  { nome: 'Leo' },
  { nome: 'Tom' },
  { nome: 'Pip', cane: true },
]

const a = (en, it, un, il, itPl, ilPl, altro = {}) => ({ en, it, un, il, itPl, ilPl, ...altro })

export const ELENCHI = {
  animali: [
    a('dog', 'cane', 'un cane', 'il cane', 'cani', 'i cani'),
    a('cat', 'gatto', 'un gatto', 'il gatto', 'gatti', 'i gatti'),
    a('fish', 'pesce', 'un pesce', 'il pesce', 'pesci', 'i pesci', { pl: 'fish' }),
    a('bird', 'uccello', 'un uccello', 'l’uccello', 'uccelli', 'gli uccelli'),
    a('mouse', 'topo', 'un topo', 'il topo', 'topi', 'i topi', { pl: 'mice' }),
    a('rabbit', 'coniglio', 'un coniglio', 'il coniglio', 'conigli', 'i conigli'),
    a('horse', 'cavallo', 'un cavallo', 'il cavallo', 'cavalli', 'i cavalli'),
    a('cow', 'mucca', 'una mucca', 'la mucca', 'mucche', 'le mucche'),
    a('pig', 'maiale', 'un maiale', 'il maiale', 'maiali', 'i maiali'),
    a('duck', 'anatra', 'un’anatra', 'l’anatra', 'anatre', 'le anatre'),
    a('frog', 'rana', 'una rana', 'la rana', 'rane', 'le rane'),
    a('sheep', 'pecora', 'una pecora', 'la pecora', 'pecore', 'le pecore', { pl: 'sheep' }),
    a('lion', 'leone', 'un leone', 'il leone', 'leoni', 'i leoni'),
    a('bear', 'orso', 'un orso', 'l’orso', 'orsi', 'gli orsi'),
    a('monkey', 'scimmia', 'una scimmia', 'la scimmia', 'scimmie', 'le scimmie'),
    a('elephant', 'elefante', 'un elefante', 'l’elefante', 'elefanti', 'gli elefanti'),
  ],
  colori: [
    a('red', 'rosso'), a('blue', 'blu'), a('green', 'verde'), a('yellow', 'giallo'),
    a('black', 'nero'), a('white', 'bianco'), a('brown', 'marrone'), a('pink', 'rosa'),
    a('orange', 'arancione'), a('purple', 'viola'), a('grey', 'grigio'),
  ],
  aggettivi: [
    a('big', 'grande'), a('small', 'piccolo'), a('long', 'lungo'), a('hot', 'caldo'), a('cold', 'freddo'),
  ],
  numeri: [
    a('two', 'due', null, null, null, null, { n: 2 }), a('three', 'tre', null, null, null, null, { n: 3 }),
    a('four', 'quattro', null, null, null, null, { n: 4 }), a('five', 'cinque', null, null, null, null, { n: 5 }),
    a('six', 'sei', null, null, null, null, { n: 6 }), a('seven', 'sette', null, null, null, null, { n: 7 }),
    a('eight', 'otto', null, null, null, null, { n: 8 }), a('nine', 'nove', null, null, null, null, { n: 9 }),
    a('ten', 'dieci', null, null, null, null, { n: 10 }),
  ],
  // `contabile`: si dice «two apples»; gli altri no («I like cheese»)
  cibi: [
    a('apple', 'mela', 'una mela', 'la mela', 'mele', 'le mele', { contabile: true }),
    a('banana', 'banana', 'una banana', 'la banana', 'banane', 'le banane', { contabile: true }),
    a('egg', 'uovo', 'un uovo', 'l’uovo', 'uova', 'le uova', { contabile: true }),
    a('cookie', 'biscotto', 'un biscotto', 'il biscotto', 'biscotti', 'i biscotti', { contabile: true }),
    a('carrot', 'carota', 'una carota', 'la carota', 'carote', 'le carote', { contabile: true }),
    a('strawberry', 'fragola', 'una fragola', 'la fragola', 'fragole', 'le fragole', { contabile: true }),
    a('tomato', 'pomodoro', 'un pomodoro', 'il pomodoro', 'pomodori', 'i pomodori', { contabile: true }),
    a('pizza', 'pizza', 'una pizza', 'la pizza', 'pizze', 'le pizze'),
    a('cake', 'torta', 'una torta', 'la torta', 'torte', 'le torte'),
    a('cheese', 'formaggio', null, 'il formaggio'),
    a('chocolate', 'cioccolato', null, 'il cioccolato'),
    a('bread', 'pane', null, 'il pane'),
    a('pasta', 'pasta', null, 'la pasta'),
    a('milk', 'latte', null, 'il latte'),
    a('soup', 'zuppa', null, 'la zuppa'),
    a('juice', 'succo', null, 'il succo'),
    a('rice', 'riso', null, 'il riso'),
    a('salad', 'insalata', null, 'l’insalata'),
  ],
  giocattoli: [
    a('ball', 'palla', 'una palla', 'la palla', 'palle', 'le palle'),
    a('doll', 'bambola', 'una bambola', 'la bambola', 'bambole', 'le bambole'),
    a('kite', 'aquilone', 'un aquilone', 'l’aquilone', 'aquiloni', 'gli aquiloni'),
    a('puzzle', 'puzzle', 'un puzzle', 'il puzzle', 'puzzle', 'i puzzle'),
    a('car', 'macchinina', 'una macchinina', 'la macchinina', 'macchinine', 'le macchinine'),
    a('train', 'trenino', 'un trenino', 'il trenino', 'trenini', 'i trenini'),
    a('plane', 'aeroplano', 'un aeroplano', 'l’aeroplano', 'aeroplani', 'gli aeroplani'),
    a('boat', 'barchetta', 'una barchetta', 'la barchetta', 'barchette', 'le barchette'),
  ],
  // `al`: come si dice «andare lì» in italiano (al parco, in biblioteca)
  luoghi: [
    a('shop', 'negozio', 'un negozio', 'il negozio', 'negozi', 'i negozi', { al: 'al negozio' }),
    a('park', 'parco', 'un parco', 'il parco', 'parchi', 'i parchi', { al: 'al parco' }),
    a('station', 'stazione', 'una stazione', 'la stazione', 'stazioni', 'le stazioni', { al: 'alla stazione' }),
    a('museum', 'museo', 'un museo', 'il museo', 'musei', 'i musei', { al: 'al museo' }),
    a('cinema', 'cinema', 'un cinema', 'il cinema', 'cinema', 'i cinema', { al: 'al cinema' }),
    a('library', 'biblioteca', 'una biblioteca', 'la biblioteca', 'biblioteche', 'le biblioteche',
      { al: 'in biblioteca' }),
    a('zoo', 'zoo', 'uno zoo', 'lo zoo', 'zoo', 'gli zoo', { al: 'allo zoo' }),
    a('hospital', 'ospedale', 'un ospedale', 'l’ospedale', 'ospedali', 'gli ospedali', { al: 'all’ospedale' }),
    a('market', 'mercato', 'un mercato', 'il mercato', 'mercati', 'i mercati', { al: 'al mercato' }),
    a('restaurant', 'ristorante', 'un ristorante', 'il ristorante', 'ristoranti', 'i ristoranti',
      { al: 'al ristorante' }),
    a('church', 'chiesa', 'una chiesa', 'la chiesa', 'chiese', 'le chiese', { al: 'in chiesa' }),
    a('farm', 'fattoria', 'una fattoria', 'la fattoria', 'fattorie', 'le fattorie', { al: 'alla fattoria' }),
    a('castle', 'castello', 'un castello', 'il castello', 'castelli', 'i castelli', { al: 'al castello' }),
  ],
  // `in`: come si viaggia in italiano (in autobus, in bici)
  mezzi: [
    a('bus', 'autobus', 'un autobus', 'l’autobus', 'autobus', 'gli autobus', { in: 'in autobus' }),
    a('train', 'treno', 'un treno', 'il treno', 'treni', 'i treni', { in: 'in treno' }),
    a('car', 'macchina', 'una macchina', 'la macchina', 'macchine', 'le macchine', { in: 'in macchina' }),
    a('taxi', 'taxi', 'un taxi', 'il taxi', 'taxi', 'i taxi', { in: 'in taxi' }),
    a('bike', 'bici', 'una bici', 'la bici', 'bici', 'le bici', { in: 'in bici' }),
    a('motorbike', 'moto', 'una moto', 'la moto', 'moto', 'le moto', { in: 'in moto' }),
    a('scooter', 'monopattino', 'un monopattino', 'il monopattino', 'monopattini', 'i monopattini',
      { in: 'in monopattino' }),
  ],
  scuola: [
    a('pen', 'penna', 'una penna', 'la penna', 'penne', 'le penne'),
    a('pencil', 'matita', 'una matita', 'la matita', 'matite', 'le matite'),
    a('ruler', 'righello', 'un righello', 'il righello', 'righelli', 'i righelli'),
    a('rubber', 'gomma', 'una gomma', 'la gomma', 'gomme', 'le gomme'),
    a('crayon', 'pastello', 'un pastello', 'il pastello', 'pastelli', 'i pastelli'),
    a('book', 'libro', 'un libro', 'il libro', 'libri', 'i libri'),
  ],
  stanze: [
    a('kitchen', 'cucina', 'una cucina', 'la cucina', 'cucine', 'le cucine'),
    a('bedroom', 'camera', 'una camera', 'la camera', 'camere', 'le camere'),
    a('bathroom', 'bagno', 'un bagno', 'il bagno', 'bagni', 'i bagni'),
    a('garden', 'giardino', 'un giardino', 'il giardino', 'giardini', 'i giardini'),
  ],
  mobili: [
    a('bed', 'letto', 'un letto', 'il letto', 'letti', 'i letti'),
    a('table', 'tavolo', 'un tavolo', 'il tavolo', 'tavoli', 'i tavoli'),
    a('chair', 'sedia', 'una sedia', 'la sedia', 'sedie', 'le sedie'),
    a('sofa', 'divano', 'un divano', 'il divano', 'divani', 'i divani'),
  ],
  giorni: [
    a('Monday', 'lunedì'), a('Tuesday', 'martedì'), a('Wednesday', 'mercoledì'), a('Thursday', 'giovedì'),
    a('Friday', 'venerdì'), a('Saturday', 'sabato'), a('Sunday', 'domenica'),
  ],
  vestiti: [
    a('hat', 'cappello', 'un cappello', 'il cappello', 'cappelli', 'i cappelli'),
    a('cap', 'berretto', 'un berretto', 'il berretto', 'berretti', 'i berretti'),
    a('scarf', 'sciarpa', 'una sciarpa', 'la sciarpa', 'sciarpe', 'le sciarpe'),
    a('coat', 'cappotto', 'un cappotto', 'il cappotto', 'cappotti', 'i cappotti'),
    a('dress', 'vestito', 'un vestito', 'il vestito', 'vestiti', 'i vestiti'),
  ],
}

export function guastiDegliElenchi(paroleNote) {
  const g = []
  for (const [nome, voci] of Object.entries(ELENCHI)) {
    const viste = new Set()
    for (const v of voci) {
      if (!v.en || !v.it) g.push(`elenco ${nome}: voce senza en o it`)
      if (viste.has(v.en)) g.push(`elenco ${nome}: «${v.en}» due volte`)
      viste.add(v.en)
      if (paroleNote && !paroleNote.has(v.en)) g.push(`elenco ${nome}: «${v.en}» non è in data/words.js`)
    }
  }
  const nomi = new Set()
  for (const p of PERSONAGGI) {
    if (nomi.has(p.nome)) g.push(`personaggio doppio: ${p.nome}`)
    nomi.add(p.nome)
  }
  return g
}
