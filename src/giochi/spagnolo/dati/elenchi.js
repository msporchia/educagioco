// Gli elenchi in comune fra i capitoli del libro: personaggi, animali,
// colori, cibi… con le forme italiane che servono alle risposte. Il mondo
// da cui una parola è nota NON si scrive qui: lo dice il grafo
// (dati/mondi.js), quindi una parola che entra in una tappa arricchisce da
// sola tutti i capitoli che la possono pescare. Vedi docs/lingue/spagnolo-motore.md.
//
// Campi: es (la chiave di data/parole-es.js, senza articolo), it, un (con
// l'articolo indeterminativo), il (determinativo), itPl / ilPl (plurale),
// genere ('m' | 'f', solo se la regola di motore/lessico.js sbaglia), pl
// (plurale spagnolo, solo se irregolare). Nel capitolo l'articolo spagnolo
// lo mette il segnaposto ({un:x}, {el:x}): qui non si scrive.

export const PERSONAGGI = [
  { nome: 'Laura', lei: true },
  { nome: 'Leo' },
  { nome: 'Tom' },
  { nome: 'Pip', cane: true },
]

// Chi può parlare in una storia (`chi` di una frase) e il nome che il libro
// gli mette davanti, in italiano: uno per chiave, in un posto solo.
export const CHI_PARLA = {
  Laura: 'Laura', Leo: 'Leo', Tom: 'Tom', Pip: 'Pip',
  mamma: 'La mamma', papa: 'Il papà', nonna: 'La nonna', nonno: 'Il nonno',
  maestra: 'La maestra', dottore: 'Il dottore', contadino: 'Il contadino', contadina: 'La contadina',
  pappagallo: 'Il pappagallo', voce: 'Una voce', signora: 'La signora',
  venditore: 'Il venditore', bambino: 'Il bambino',
}
// Le risposte sbagliate di «Chi l'ha detto?» quando nella storia parlano in
// pochi: la gente di casa, che può aver detto qualunque cosa (docs/lingue/libro-racconti.md)
export const CHI_DI_CASA = ['Laura', 'Leo', 'Tom', 'mamma', 'papa', 'nonna', 'nonno']

const a = (es, it, un, il, itPl, ilPl, altro = {}) => ({ es, it, un, il, itPl, ilPl, ...altro })

export const ELENCHI = {
  animali: [
    a('perro', 'cane', 'un cane', 'il cane', 'cani', 'i cani'),
    a('gato', 'gatto', 'un gatto', 'il gatto', 'gatti', 'i gatti'),
    a('vaca', 'mucca', 'una mucca', 'la mucca', 'mucche', 'le mucche'),
    a('pez', 'pesce', 'un pesce', 'il pesce', 'pesci', 'i pesci'),
    a('pájaro', 'uccello', 'un uccello', 'l’uccello', 'uccelli', 'gli uccelli'),
    a('ratón', 'topo', 'un topo', 'il topo', 'topi', 'i topi'),
    a('conejo', 'coniglio', 'un coniglio', 'il coniglio', 'conigli', 'i conigli'),
    a('caballo', 'cavallo', 'un cavallo', 'il cavallo', 'cavalli', 'i cavalli'),
    a('cerdo', 'maiale', 'un maiale', 'il maiale', 'maiali', 'i maiali'),
    a('pato', 'anatra', 'un’anatra', 'l’anatra', 'anatre', 'le anatre'),
    a('rana', 'rana', 'una rana', 'la rana', 'rane', 'le rane'),
    a('oveja', 'pecora', 'una pecora', 'la pecora', 'pecore', 'le pecore'),
    a('león', 'leone', 'un leone', 'il leone', 'leoni', 'i leoni'),
    a('oso', 'orso', 'un orso', 'l’orso', 'orsi', 'gli orsi'),
    a('mono', 'scimmia', 'una scimmia', 'la scimmia', 'scimmie', 'le scimmie'),
    a('elefante', 'elefante', 'un elefante', 'l’elefante', 'elefanti', 'gli elefanti'),
  ],
  // gli aggettivi si accordano nel capitolo: {colore~animale} (negro, negra)
  colori: [
    a('negro', 'nero'), a('blanco', 'bianco'), a('azul', 'blu'), a('rojo', 'rosso'), a('verde', 'verde'),
    a('amarillo', 'giallo'), a('marrón', 'marrone'), a('rosado', 'rosa'), a('naranja', 'arancione'),
    a('morado', 'viola'), a('gris', 'grigio'),
  ],
  aggettivi: [
    a('grande', 'grande'), a('pequeño', 'piccolo'), a('largo', 'lungo'), a('caliente', 'caldo'),
    a('frío', 'freddo'),
  ],
  numeri: [
    a('dos', 'due', null, null, null, null, { n: 2 }), a('tres', 'tre', null, null, null, null, { n: 3 }),
    a('cuatro', 'quattro', null, null, null, null, { n: 4 }), a('cinco', 'cinque', null, null, null, null, { n: 5 }),
    a('seis', 'sei', null, null, null, null, { n: 6 }), a('siete', 'sette', null, null, null, null, { n: 7 }),
    a('ocho', 'otto', null, null, null, null, { n: 8 }), a('nueve', 'nove', null, null, null, null, { n: 9 }),
    a('diez', 'dieci', null, null, null, null, { n: 10 }),
  ],
  // `contabile`: si dice «dos manzanas»; gli altri no («me gusta la leche»)
  cibi: [
    a('manzana', 'mela', 'una mela', 'la mela', 'mele', 'le mele', { contabile: true }),
    a('plátano', 'banana', 'una banana', 'la banana', 'banane', 'le banane', { contabile: true }),
    a('huevo', 'uovo', 'un uovo', 'l’uovo', 'uova', 'le uova', { contabile: true }),
    a('galleta', 'biscotto', 'un biscotto', 'il biscotto', 'biscotti', 'i biscotti', { contabile: true }),
    a('zanahoria', 'carota', 'una carota', 'la carota', 'carote', 'le carote', { contabile: true }),
    a('frutilla', 'fragola', 'una fragola', 'la fragola', 'fragole', 'le fragole', { contabile: true }),
    a('tomate', 'pomodoro', 'un pomodoro', 'il pomodoro', 'pomodori', 'i pomodori', { contabile: true }),
    a('pizza', 'pizza', 'una pizza', 'la pizza', 'pizze', 'le pizze'),
    a('torta', 'torta', 'una torta', 'la torta', 'torte', 'le torte'),
    a('queso', 'formaggio', null, 'il formaggio'),
    a('chocolate', 'cioccolato', null, 'il cioccolato'),
    a('pan', 'pane', null, 'il pane'),
    a('fideos', 'pasta', null, 'la pasta'),
    a('leche', 'latte', null, 'il latte'),
    a('sopa', 'zuppa', null, 'la zuppa'),
    a('jugo', 'succo', null, 'il succo'),
    a('arroz', 'riso', null, 'il riso'),
    a('ensalada', 'insalata', null, 'l’insalata'),
  ],
  giocattoli: [
    a('pelota', 'palla', 'una palla', 'la palla', 'palle', 'le palle'),
    a('muñeca', 'bambola', 'una bambola', 'la bambola', 'bambole', 'le bambole'),
    a('cometa', 'aquilone', 'un aquilone', 'l’aquilone', 'aquiloni', 'gli aquiloni'),
    a('rompecabezas', 'puzzle', 'un puzzle', 'il puzzle', 'puzzle', 'i puzzle'),
    a('auto', 'macchinina', 'una macchinina', 'la macchinina', 'macchinine', 'le macchinine'),
    a('tren', 'trenino', 'un trenino', 'il trenino', 'trenini', 'i trenini'),
    a('avión', 'aeroplano', 'un aeroplano', 'l’aeroplano', 'aeroplani', 'gli aeroplani'),
    a('bote', 'barchetta', 'una barchetta', 'la barchetta', 'barchette', 'le barchette'),
  ],
  // `al`: come si dice «andare lì» in italiano (al parco, in biblioteca)
  luoghi: [
    a('tienda', 'negozio', 'un negozio', 'il negozio', 'negozi', 'i negozi', { al: 'al negozio' }),
    a('parque', 'parco', 'un parco', 'il parco', 'parchi', 'i parchi', { al: 'al parco' }),
    a('estación', 'stazione', 'una stazione', 'la stazione', 'stazioni', 'le stazioni', { al: 'alla stazione' }),
    a('museo', 'museo', 'un museo', 'il museo', 'musei', 'i musei', { al: 'al museo' }),
    a('cine', 'cinema', 'un cinema', 'il cinema', 'cinema', 'i cinema', { al: 'al cinema' }),
    a('biblioteca', 'biblioteca', 'una biblioteca', 'la biblioteca', 'biblioteche', 'le biblioteche',
      { al: 'in biblioteca' }),
    a('zoológico', 'zoo', 'uno zoo', 'lo zoo', 'zoo', 'gli zoo', { al: 'allo zoo' }),
    a('hospital', 'ospedale', 'un ospedale', 'l’ospedale', 'ospedali', 'gli ospedali', { al: 'all’ospedale' }),
    a('mercado', 'mercato', 'un mercato', 'il mercato', 'mercati', 'i mercati', { al: 'al mercato' }),
    a('restaurante', 'ristorante', 'un ristorante', 'il ristorante', 'ristoranti', 'i ristoranti',
      { al: 'al ristorante' }),
    a('iglesia', 'chiesa', 'una chiesa', 'la chiesa', 'chiese', 'le chiese', { al: 'in chiesa' }),
    a('granja', 'fattoria', 'una fattoria', 'la fattoria', 'fattorie', 'le fattorie', { al: 'alla fattoria' }),
    a('castillo', 'castello', 'un castello', 'il castello', 'castelli', 'i castelli', { al: 'al castello' }),
  ],
  // `in`: come si viaggia in italiano (in autobus, in bici)
  mezzi: [
    a('autobús', 'autobus', 'un autobus', 'l’autobus', 'autobus', 'gli autobus', { in: 'in autobus' }),
    a('tren', 'treno', 'un treno', 'il treno', 'treni', 'i treni', { in: 'in treno' }),
    a('auto', 'macchina', 'una macchina', 'la macchina', 'macchine', 'le macchine', { in: 'in macchina' }),
    a('taxi', 'taxi', 'un taxi', 'il taxi', 'taxi', 'i taxi', { in: 'in taxi' }),
    a('bicicleta', 'bici', 'una bici', 'la bici', 'bici', 'le bici', { in: 'in bici' }),
    a('motocicleta', 'moto', 'una moto', 'la moto', 'moto', 'le moto', { in: 'in moto' }),
    a('monopatín', 'monopattino', 'un monopattino', 'il monopattino', 'monopattini', 'i monopattini',
      { in: 'in monopattino' }),
  ],
  scuola: [
    a('bolígrafo', 'penna', 'una penna', 'la penna', 'penne', 'le penne'),
    a('lápiz', 'matita', 'una matita', 'la matita', 'matite', 'le matite'),
    a('regla', 'righello', 'un righello', 'il righello', 'righelli', 'i righelli'),
    a('borrador', 'gomma', 'una gomma', 'la gomma', 'gomme', 'le gomme'),
    a('crayón', 'pastello', 'un pastello', 'il pastello', 'pastelli', 'i pastelli'),
    a('libro', 'libro', 'un libro', 'il libro', 'libri', 'i libri'),
  ],
  stanze: [
    a('cocina', 'cucina', 'una cucina', 'la cucina', 'cucine', 'le cucine'),
    a('dormitorio', 'camera', 'una camera', 'la camera', 'camere', 'le camere'),
    a('baño', 'bagno', 'un bagno', 'il bagno', 'bagni', 'i bagni'),
    a('jardín', 'giardino', 'un giardino', 'il giardino', 'giardini', 'i giardini'),
  ],
  mobili: [
    a('cama', 'letto', 'un letto', 'il letto', 'letti', 'i letti'),
    a('mesa', 'tavolo', 'un tavolo', 'il tavolo', 'tavoli', 'i tavoli'),
    a('silla', 'sedia', 'una sedia', 'la sedia', 'sedie', 'le sedie'),
    a('sofá', 'divano', 'un divano', 'il divano', 'divani', 'i divani'),
  ],
  giorni: [
    a('lunes', 'lunedì'), a('martes', 'martedì'), a('miércoles', 'mercoledì'), a('jueves', 'giovedì'),
    a('viernes', 'venerdì'), a('sábado', 'sabato'), a('domingo', 'domenica'),
  ],
  vestiti: [
    a('sombrero', 'cappello', 'un cappello', 'il cappello', 'cappelli', 'i cappelli'),
    a('gorra', 'berretto', 'un berretto', 'il berretto', 'berretti', 'i berretti'),
    a('bufanda', 'sciarpa', 'una sciarpa', 'la sciarpa', 'sciarpe', 'le sciarpe'),
    a('abrigo', 'cappotto', 'un cappotto', 'il cappotto', 'cappotti', 'i cappotti'),
    a('vestido', 'vestito', 'un vestito', 'il vestito', 'vestiti', 'i vestiti'),
  ],
}

export function guastiDegliElenchi(paroleNote) {
  const g = []
  for (const [nome, voci] of Object.entries(ELENCHI)) {
    const viste = new Set()
    for (const v of voci) {
      if (!v.es || !v.it) g.push(`elenco ${nome}: voce senza es o it`)
      if (viste.has(v.es)) g.push(`elenco ${nome}: «${v.es}» due volte`)
      viste.add(v.es)
      if (paroleNote && !paroleNote.has(v.es)) g.push(`elenco ${nome}: «${v.es}» non è in data/parole-es.js`)
      if (v.genere && !['m', 'f'].includes(v.genere)) g.push(`elenco ${nome}: «${v.es}» ha un genere sconosciuto`)
    }
  }
  const nomi = new Set()
  for (const p of PERSONAGGI) {
    if (nomi.has(p.nome)) g.push(`personaggio doppio: ${p.nome}`)
    nomi.add(p.nome)
  }
  return g
}
