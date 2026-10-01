// Le strutture (le «forme») dello spagnolo a mondi: la chiave SRS è
// `forma-es:<id>`. `parole` sono le parole di struttura che la forma porta con
// sé (note da quando la forma si incontra); `regola` è il «Si fa così» che
// si mostra dopo uno sbaglio; `segni` sono le parole da cui si riconosce
// che una frase usa quella struttura: una frase di una tappa ne contiene
// almeno uno (`#c` vuol dire un colore, `#j` un aggettivo, `#n` un numero).
// Vedi docs/lingue/frasi.md e, per quarta e quinta, docs/lingue/strutture.md.
export const PREFISSO_FORMA = 'forma-es:'

export const FORME = {
  /* ── La valle dei girasoli ── */
  'es-un': {
    nome: 'es un …, es una …',
    parole: ['es', 'no', 'un', 'una', 'sí'],
    segni: ['un', 'una'],
    regola: 'Un per le cose maschili, una per le femminili: es un perro, es una vaca. «Es» vuol dire «è».',
  },
  'el-la': {
    nome: 'el, la',
    parole: ['es', 'no', 'un', 'una', 'el', 'la', 'sí'],
    segni: ['el', 'la'],
    regola: 'El è maschile, la è femminile: el gato, la vaca. Il genere non è sempre come in italiano.',
  },
  'color-despues': {
    nome: 'un gato negro',
    parole: ['es', 'no', 'un', 'una', 'el', 'la', 'y'],
    segni: ['#c', '#j'],
    regola: 'Il colore sta dopo la cosa e concorda: un gato negro, una vaca negra.',
  },
  saludos: {
    nome: 'hola, me llamo …',
    parole: ['hola', 'adiós', 'buenos', 'buenas', 'días', 'noches', 'tardes', 'me', 'llamo', 'te', 'llamas',
             'cómo', 'estás', 'estoy', 'bien', 'gracias', 'y', 'tú', 'yo', 'soy', 'feliz', 'por favor', 'sí', 'no'],
    segni: ['hola', 'llamo', 'llamas', 'cómo', 'buenos', 'buenas', 'adiós', 'gracias', 'feliz', 'estoy'],
    regola: 'Per presentarti: me llamo Leo. Per chiedere: ¿cómo te llamas? Per salutare: hola, ¿cómo estás?',
  },
  'este-esta': {
    nome: 'este es …, esta es …',
    parole: ['este', 'esta', 'es', 'no', 'un', 'una', 'el', 'la', 'mi', 'sí'],
    segni: ['este', 'esta'],
    regola: 'Este è maschile, esta è femminile: este es un libro, esta es una regla.',
  },
  /* ── La baia delle palme ── */
  plural: {
    nome: 'los gatos, dos gatos',
    parole: ['los', 'las', 'son', 'y', 'unos', 'unas', 'no', 'estos', 'estas'],
    segni: ['los', 'las', 'son', '#n'],
    regola: 'Più cose: -s dopo una vocale, -es dopo una consonante: los gatos, los lápices. «Son» è «sono».',
  },
  'me-gusta': {
    nome: 'me gusta, me gustan',
    parole: ['me', 'te', 'gusta', 'gustan', 'no', 'mucho', 'sí', 'también', 'a', 'mí', 'ti'],
    segni: ['gusta', 'gustan'],
    regola: 'Me gusta + una cosa sola, me gustan + più cose: me gusta el pan, me gustan las uvas.',
  },
  'mi-tu-su': {
    nome: 'mi, tu, su',
    parole: ['mi', 'mis', 'tu', 'tus', 'su', 'sus', 'es', 'son', 'él', 'ella', 'yo', 'tú', 'y'],
    segni: ['mi', 'mis', 'tu', 'tus', 'su', 'sus'],
    regola: 'Mi, tu, su stanno davanti alla cosa e prendono la s se sono più d’una: mi gato, mis gatos.',
  },
  ser: {
    nome: 'yo soy, tú eres',
    parole: ['yo', 'tú', 'él', 'ella', 'nosotros', 'ellos', 'ellas', 'soy', 'eres', 'es', 'somos', 'son', 'no',
             'muy', 'y'],
    segni: ['soy', 'eres', 'somos', 'son', 'yo', 'tú'],
    regola: 'Ser: yo soy, tú eres, él es, nosotros somos, ellos son. Dice chi o come sei: soy alto.',
  },
  tener: {
    nome: 'tengo …',
    parole: ['yo', 'tú', 'tengo', 'tienes', 'no', 'años', 'hambre', 'sed', 'frío', 'calor', 'sueño', 'miedo',
             'muy', 'y', 'cuántos', 'cuántas'],
    segni: ['tengo', 'tienes', 'años', 'hambre', 'sed', 'sueño', 'miedo'],
    regola: 'Ho: tengo. Fame, sete, freddo e anni si «hanno»: tengo hambre, tengo siete años (non «soy»).',
  },
  tiene: {
    nome: 'ella tiene …',
    parole: ['él', 'ella', 'nosotros', 'ellos', 'ellas', 'tiene', 'tienen', 'tenemos', 'no', 'muy', 'y'],
    segni: ['tiene', 'tienen', 'tenemos'],
    regola: 'Con él, ella o un nome: tiene. Con ellos: tienen. Con noi: tenemos.',
  },
  /* ── L'altopiano d'autunno ── */
  'esta-en': {
    nome: '¿dónde está? en, sobre, debajo',
    parole: ['dónde', 'está', 'están', 'estoy', 'estás', 'estamos', 'en', 'sobre', 'debajo', 'detrás', 'cerca',
             'al lado de', 'no', 'y', 'aquí', 'allí'],
    segni: ['está', 'están', 'estoy', 'estás', 'dónde', 'sobre', 'debajo', 'detrás', 'cerca', 'en'],
    regola: '¿Dónde está? Per un posto si usa estar: el gato está en la mesa. Sobre è sopra, debajo è sotto.',
  },
  hay: {
    nome: 'hay …',
    parole: ['hay', 'no', 'un', 'una', 'unos', 'unas', 'en', 'cuántos', 'cuántas', 'y', 'sobre', 'debajo'],
    segni: ['hay'],
    regola: 'Hay vuol dire «c’è» e «ci sono»: hay un gato, hay dos gatos. Non cambia mai.',
  },
  preguntas: {
    nome: '¿quién? ¿qué? ¿cómo?',
    parole: ['quién', 'qué', 'cómo', 'dónde', 'cuántos', 'cuántas', 'cuándo', 'cuál', 'es', 'son', 'está', 'hay',
             'tiene', 'tienen', 'y', 'de'],
    segni: ['quién', 'qué', 'cómo', 'dónde', 'cuántos', 'cuántas', 'cuál', 'cuándo'],
    regola: 'Con l’accento si chiede: ¿qué?, ¿quién?, ¿cómo?. Senza accento «que» e «como» sono altre parole.',
  },
  'hoy-es': {
    nome: 'hoy es lunes, en mayo',
    parole: ['hoy', 'mañana', 'es', 'el', 'en', 'de', 'mi', 'son', 'no', 'cuándo', 'qué', 'día'],
    segni: ['hoy', 'mañana', 'en', 'el'],
    regola: 'Hoy es lunes. Con i giorni «el»: el lunes juego. Con i mesi e le stagioni: en mayo, en verano.',
  },
  hace: {
    nome: 'hace frío, llueve',
    parole: ['hace', 'hay', 'llueve', 'nieva', 'mucho', 'muy', 'frío', 'calor', 'sol', 'viento', 'nubes', 'hoy',
             'no', 'en'],
    segni: ['hace', 'llueve', 'nieva'],
    regola: 'Il tempo: hace frío, hace sol, hace viento. La pioggia: llueve. La neve: nieva.',
  },
  'ser-estar': {
    nome: 'ser o estar',
    parole: ['soy', 'eres', 'es', 'somos', 'son', 'estoy', 'estás', 'está', 'estamos', 'están', 'muy', 'de',
             'yo', 'tú', 'él', 'ella', 'nosotros', 'ellos', 'no', 'y', 'en'],
    segni: ['soy', 'eres', 'es', 'estoy', 'estás', 'está'],
    regola: 'Ser per come sei (soy alto), estar per come stai e dove sei (estoy cansado, está en casa).',
  },
  /* ── Il rifugio d'inverno ──
     Le `parole` sono anche le parolette che servono a raccontare nel libro,
     che le sa dalla prima pagina del mondo; `flessione` è la forma dei
     verbi che la struttura ammette, in una frase e nel libro
     (motore/flessioni.js: pres, ger, ind). I segni con # sono forme flesse:
     #pres canto, #ger cantando, #ind canté. */
  hora: {
    nome: '¿qué hora es?',
    parole: ['qué', 'hora', 'es', 'son', 'la', 'las', 'una', 'y', 'menos', 'media', 'cuarto', 'a', 'en punto',
             'de la mañana', 'de la tarde', 'de la noche'],
    segni: ['hora', 'las', 'la', 'una'],
    regola: '¿Qué hora es? Es la una, son las tres. A che ora: a las tres. «Y media» è «e mezza».',
  },
  'presente-ar': {
    nome: 'yo canto, tú cantas',
    parole: ['yo', 'tú', 'él', 'ella', 'nosotros', 'ellos', 'ellas', 'no', 'siempre', 'nunca', 'a veces', 'mucho',
             'y', 'también', 'con', 'en', 'a'],
    segni: ['#pres'], flessione: 'pres',
    regola: 'Verbi in -ar: -o, -as, -a, -amos, -an. Yo canto, tú cantas, él canta. Il pronome spesso non si dice.',
  },
  fechas: {
    nome: 'el cinco de mayo, a las siete',
    parole: ['el', 'de', 'en', 'a', 'las', 'la', 'es', 'hoy', 'cuándo', 'qué', 'día'],
    segni: ['de', 'en', 'a', 'el'],
    regola: 'Date: el cinco de mayo. Con i giorni «el»: el lunes. Con i mesi: en mayo. Con le ore: a las siete.',
  },
  cantidad: {
    nome: 'unos, un poco de, mucho',
    parole: ['unos', 'unas', 'algunos', 'algunas', 'un poco de', 'mucho', 'mucha', 'muchos', 'muchas', 'poco',
             'nada', 'ningún', 'no', 'hay', 'de', 'tengo', 'tiene'],
    segni: ['unos', 'unas', 'algunos', 'algunas', 'poco', 'mucho', 'mucha', 'muchos', 'muchas', 'nada'],
    regola: 'Unos, unas: alcuni. Un poco de: un po’ di (non cambia). Mucho, mucha, muchos, muchas concordano.',
  },
  'presente-er-ir': {
    nome: 'ella come, él vive',
    parole: ['yo', 'tú', 'él', 'ella', 'nosotros', 'ellos', 'ellas', 'no', 'siempre', 'nunca', 'a veces', 'y',
             'también', 'con', 'en'],
    segni: ['#pres'], flessione: 'pres',
    regola: 'Verbi in -er e -ir: -o, -es, -e, -emos / -imos, -en. Como, comes, come; vivo, vives, vive.',
  },
  reflexivos: {
    nome: 'me levanto',
    parole: ['me', 'te', 'se', 'nos', 'a', 'las', 'la', 'y', 'temprano', 'tarde', 'yo', 'tú', 'él', 'ella', 'no',
             'siempre', 'después'],
    segni: ['me', 'te', 'se', 'nos'], flessione: 'pres',
    regola: 'Con levantarse, lavarse… si dice me, te, se prima del verbo: me levanto, ella se lava.',
  },
  gerundio: {
    nome: 'estoy jugando',
    parole: ['estoy', 'estás', 'está', 'estamos', 'están', 'ahora', 'yo', 'tú', 'él', 'ella', 'nosotros', 'ellos',
             'no', 'qué', 'y', 'con'],
    segni: ['#ger'], flessione: 'ger',
    regola: 'Adesso: estar + -ando / -iendo: estoy cantando, está comiendo. Mai «estoy cantar».',
  },
  /* ── La terra dei vulcani ── */
  'voy-al': {
    nome: 'voy al parque',
    parole: ['voy', 'vas', 'va', 'vamos', 'van', 'a', 'al', 'del', 'de', 'la', 'el', 'los', 'las', 'en', 'vengo',
             'vienes', 'viene', 'vienen', 'dónde', 'adónde', 'yo', 'tú', 'él', 'ella', 'nosotros', 'ellos', 'no'],
    segni: ['voy', 'vas', 'va', 'vamos', 'van', 'al', 'del'], flessione: 'pres',
    regola: 'Ir: voy, vas, va, vamos, van + a. A + el = al (voy al parque), de + el = del (vengo del cine).',
  },
  direcciones: {
    nome: 'gira a la izquierda',
    parole: ['gira', 'sigue', 'cruza', 'recto', 'izquierda', 'derecha', 'la', 'a', 'al lado de', 'del', 'hasta',
             'por', 'dónde', 'está', 'la calle', 'y', 'luego', 'el', 'en', 'al', 'enfrente de', 'entre'],
    segni: ['gira', 'sigue', 'cruza', 'izquierda', 'derecha', 'recto', 'lado', 'hasta', 'enfrente', 'entre'],
    regola: 'Per la strada si dà del «tu»: gira a la izquierda, sigue recto, cruza la calle. Accanto: al lado de.',
  },
  cuanto: {
    nome: '¿cuánto cuesta?',
    parole: ['cuánto', 'cuánta', 'cuesta', 'cuestan', 'cuántos', 'es', 'son', 'bolivianos', 'boliviano',
             'centavos', 'y', 'no', 'muy', 'un', 'una', 'dos'],
    segni: ['cuánto', 'cuesta', 'cuestan', 'bolivianos', 'boliviano', 'centavos', 'barato', 'caro'],
    regola: '¿Cuánto cuesta? Per una cosa: cuesta. Per più cose: cuestan. Due bolivianos: dos bolivianos.',
  },
  de: {
    nome: 'el perro de Tom',
    parole: ['de', 'del', 'de la', 'es', 'son', 'el', 'la', 'los', 'las', 'quién', 'un', 'una', 'y'],
    segni: ['de', 'del'],
    regola: 'Di chi è: la cosa + de + chi la ha: el perro de Tom. De + el = del: el perro del niño.',
  },
  'quiero-puedo': {
    nome: 'quiero, puedo',
    parole: ['yo', 'tú', 'él', 'ella', 'nosotros', 'ellos', 'quiero', 'quieres', 'quiere', 'queremos', 'quieren',
             'puedo', 'puedes', 'puede', 'podemos', 'pueden', 'no', 'mucho', 'y', 'ahora', 'ir', 'comer'],
    segni: ['quiero', 'quieres', 'quiere', 'queremos', 'quieren', 'puedo', 'puedes', 'puede', 'podemos',
            'pueden', '#pres'],
    flessione: 'pres',
    regola: 'Querer e poder cambiano la vocale: quiero, puedo. Dopo di loro il verbo resta com’è: quiero nadar.',
  },
  /* ── La città tra le nuvole ── */
  ayer: {
    nome: 'ayer estuve, fui',
    parole: ['ayer', 'estuve', 'estuviste', 'estuvo', 'estuvimos', 'estuvieron', 'fui', 'fuiste', 'fue', 'fuimos',
             'fueron', 'anoche', 'en', 'al', 'a', 'no', 'y', 'yo', 'tú', 'él', 'ella', 'nosotros', 'ellos'],
    segni: ['ayer', 'estuve', 'estuviste', 'estuvo', 'estuvimos', 'estuvieron', 'fui', 'fuiste', 'fue',
            'fuimos', 'fueron'],
    regola: 'Ieri: ayer + passato. Estar fa estuve, estuvo; ir e ser fanno fui, fue.',
  },
  'pasado-irr': {
    nome: 'hice, vi, vine',
    parole: ['ayer', 'anoche', 'no', 'y', 'yo', 'tú', 'él', 'ella', 'nosotros', 'ellos'],
    segni: ['#ind'], flessione: 'ind',
    regola: 'Alcuni verbi cambiano tutto: hacer → hice, ver → vi, venir → vine, dar → di. Vanno imparati.',
  },
  'pasado-reg': {
    nome: 'jugué, comió, viví',
    parole: ['ayer', 'anoche', 'no', 'y', 'yo', 'tú', 'él', 'ella', 'nosotros', 'ellos', 'antes', 'después'],
    segni: ['#ind'], flessione: 'ind',
    regola: 'Verbi regolari: -ar → -é, -aste, -ó; -er e -ir → -í, -iste, -ió. Gli accenti contano: comió, comio no.',
  },
  decir: {
    nome: 'dijo, me dijo',
    parole: ['dijo', 'dije', 'dijiste', 'dijimos', 'dijeron', 'dice', 'dicen', 'digo', 'que', 'me', 'te', 'le',
             'nos', 'les', 'a', 'y', 'no'],
    segni: ['dijo', 'dije', 'dijiste', 'dijimos', 'dijeron', 'dice', 'dicen', 'digo'],
    regola: 'Decir è irregolare: él dijo hola. A chi: me, te, le: me dijo una historia.',
  },
  cuando: {
    nome: 'cuando, mientras',
    parole: ['cuando', 'mientras', 'que', 'porque', 'y', 'no', 'yo', 'él', 'ella', 'nosotros', 'ellos', 'hace'],
    segni: ['cuando', 'mientras'],
    regola: 'Quando: cuando (senza accento). Mentre: mientras. Dopo cuando c’è un verbo: cuando hace frío.',
  },
  'voy-a': {
    nome: 'voy a nadar',
    parole: ['voy', 'vas', 'va', 'vamos', 'van', 'a', 'mañana', 'luego', 'pronto', 'no', 'yo', 'tú', 'él', 'ella',
             'nosotros', 'ellos', 'qué', 'y'],
    segni: ['voy', 'vas', 'va', 'vamos', 'van'], flessione: 'pres',
    regola: 'Per il futuro vicino: ir + a + il verbo com’è: voy a nadar. La a non si dimentica.',
  },
  comparativos: {
    nome: 'más alto que, el más alto',
    parole: ['más', 'menos', 'que', 'el', 'la', 'los', 'las', 'mejor', 'peor', 'tan', 'como', 'es', 'son', 'de',
             'y', 'muy'],
    segni: ['más', 'menos', 'mejor', 'peor', 'tan'],
    regola: 'Più di: más … que: más alto que. Il più: el más alto. Mejor e peor: migliore e peggiore (non «más bueno»).',
  },
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
    for (const x of [].concat(f.flessione || []))
      if (!['pres', 'ger', 'ind'].includes(x)) g.push(`forma ${id}: flessione sconosciuta ${x}`)
  }
  return g
}
