// I concetti delle strutture del mondo «prima» (formato in concetti.js)
const con = rx => f => rx.test(f.es)
const domanda = f => f.domanda
// le parole che in spagnolo hanno il genere diverso dall'italiano
const DIVERSE = /\b(pato|auto|bote|cometa|mapa|regla|mochila|lápiz|bolígrafo|borrador)\b/

export default {
  'es-un': [
    { id: 'es-un:domanda', titolo: 'È un…?', prende: domanda,
      spiega: 'Come in italiano, per chiedere non cambia niente: si scrive ¿ all’inizio e ? alla fine.',
      esempi: [['es un gato', 'è un gatto'], ['[¿]es un gato[?]', 'è un gatto?']] },
    { id: 'es-un:no', titolo: 'Non è', prende: con(/\bno\b/),
      spiega: 'Per dire di no, come in italiano: no va prima di es.',
      esempi: [['es un cerdo', 'è un maiale'], ['[no] es un cerdo', 'non è un maiale']] },
    { id: 'es-un:diverso', titolo: 'Un’anatra, ma un pato', prende: con(DIVERSE),
      spiega: 'Il genere a volte non è come in italiano: l’anatra è femminile, ma in spagnolo è un pato.',
      esempi: [['es [una] vaca', 'è una mucca'], ['es [un] pato', 'è un’anatra']] },
    { id: 'es-un:un-una', titolo: 'Un, una',
      spiega: 'Es vuol dire «è». Un va con le cose maschili, una con le femminili, come in italiano.',
      esempi: [['es [un] perro', 'è un cane'], ['es [una] vaca', 'è una mucca']] },
  ],
  'el-la': [
    { id: 'el-la:diverso', titolo: 'L’anatra, ma el pato', prende: con(DIVERSE),
      spiega: 'Guarda la parola spagnola, non quella italiana: la barca, ma el bote.',
      esempi: [['[la] vaca es blanca', 'la mucca è bianca'], ['[el] bote es blanco', 'la barca è bianca']] },
    { id: 'el-la:no', titolo: 'Non è', prende: con(/\bno\b/),
      spiega: 'No va subito prima di es, come «non» prima di «è».',
      esempi: [['el conejo es negro', 'il coniglio è nero'], ['el conejo [no] es negro', 'il coniglio non è nero']] },
    { id: 'el-la:el-la', titolo: 'Il gatto, la mucca',
      spiega: 'El vuol dire «il» e va con le cose maschili; la va con le femminili.',
      esempi: [['[el] gato es negro', 'il gatto è nero'], ['[la] vaca es blanca', 'la mucca è bianca']] },
  ],
  'color-despues': [
    { id: 'color-despues:uguale', titolo: 'Blu, verde: non cambiano', prende: con(/\b(azul|verde|naranja|marrón)\b/),
      spiega: 'Azul, verde, naranja e marrón restano uguali con un e con una, come blu e verde in italiano.',
      esempi: [['es un auto [azul]', 'è un’automobile blu'], ['es una cometa [azul]', 'è un aquilone blu']] },
    { id: 'color-despues:accordo', titolo: 'Nero, nera', prende: con(/\b(roja|blanca|negra|amarilla|morada|rosada)\b/),
      spiega: 'Come in italiano il colore va d’accordo con la cosa: un gato negro, una vaca negra.',
      esempi: [['es un gato [negro]', 'è un gatto nero'], ['es una vaca [negra]', 'è una mucca nera']] },
    { id: 'color-despues:dopo', titolo: 'Un gatto nero',
      spiega: 'Il colore va dopo la cosa, come in italiano. Va con la parola spagnola: un auto rojo.',
      esempi: [['es un gato', 'è un gatto'], ['es un gato [negro]', 'è un gatto nero']] },
  ],
  saludos: [
    { id: 'saludos:buenos', titolo: 'Buongiorno, buonanotte', prende: con(/\b(buenos|buenas|feliz)\b/),
      spiega: 'Días è maschile: buenos días. Tardes e noches sono femminili: buenas noches. Per gli auguri: feliz.',
      esempi: [['[buenos] días', 'buongiorno'], ['[buenas] noches', 'buonanotte']] },
    { id: 'saludos:como', titolo: 'Come ti chiami? Come stai?', prende: con(/\b(cómo|llamas|estás|estoy)\b/),
      spiega: 'Per chiedere «come» si scrive cómo, con l’accento. Ti chiami: te llamas (non ti); come stai: cómo estás.',
      esempi: [['me llamo Leo', 'mi chiamo Leo'], ['¿[cómo te llamas]?', 'come ti chiami?']] },
    { id: 'saludos:me-llamo', titolo: 'Mi chiamo Leo',
      spiega: 'Mi chiamo si dice me llamo: in spagnolo mi vuol dire «mio». Per salutare: hola e adiós.',
      esempi: [['soy Tom', 'sono Tom'], ['[me llamo] Tom', 'mi chiamo Tom']] },
  ],
  'este-esta': [
    { id: 'este-esta:cosa', titolo: 'Questa matita', prende: con(/^(este|esta) (?!es\b|no\b)/),
      spiega: 'Este ed esta vanno anche davanti alla cosa, come «questo» e «questa»: esta regla es amarilla.',
      esempi: [['este es un lápiz', 'questa è una matita'], ['[este lápiz] es rojo', 'questa matita è rossa']] },
    { id: 'este-esta:mi', titolo: 'Il mio, la mia: mi', prende: con(/\bmi\b/),
      spiega: 'Mi vuol dire «il mio» e «la mia», tutto in una parola: mi perro, mi mochila.',
      esempi: [['este es un perro', 'questo è un cane'], ['este es [mi] perro', 'questo è il mio cane']] },
    { id: 'este-esta:diverso', titolo: 'Questa mappa, ma este mapa', prende: con(DIVERSE),
      spiega: 'Este o esta lo decide la parola spagnola: la mappa, ma este es un mapa.',
      esempi: [['[esta] es una caja', 'questa è una scatola'], ['[este] es un mapa', 'questa è una mappa']] },
    { id: 'este-esta:este', titolo: 'Questo è…',
      spiega: 'Este è «questo», esta è «questa»: este es un libro, esta es una caja.',
      esempi: [['es un libro', 'è un libro'], ['[este] es un libro', 'questo è un libro']] },
  ],
}
