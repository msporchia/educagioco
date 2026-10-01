/* ═══════════════════════════════════════════════════════════════════
   LO SPAGNOLO A MONDI — la lingua del motore, senza browser.
   `node test/esegui.mjs spagnolo-lingua --niente-build`

   Quello che il motore deve sapere dello spagnolo prima che arrivino le
   frasi: le forme dei verbi (presente, gerundio, pretérito indefinido,
   irregolari e riflessivi) e il ritorno dalla forma alla base; il genere
   e il plurale dei nomi, il femminile degli aggettivi; il controllo della
   concordanza (`sgrammaticata`) senza falsi allarmi; ogni riga delle
   trappole che rifà il suo esempio; e un mazzo di frasi di prova, una o
   due per tappa di frasi, da cui le trappole escono sbagliate per il
   motivo che dicono e mai per caso. I contenuti veri (frasi, concetti,
   capitoli) li controlla il test dei mondi; qui i guasti dei dati delle
   altre parti si stampano e basta. Il progetto: docs/lingue/spagnolo-motore.md.
   ═══════════════════════════════════════════════════════════════════ */
import { controlla, uguale, stessaLista, nota, riassunto } from '../aiuto/verifica.mjs'
import { PAROLE_ES } from '../../src/data/parole-es.js'
import { VERBI_ES } from '../../src/data/verbi-es.js'
import { newItem, record } from '../../src/store/srs.js'
import { flessione, flessa, flesse, formeDi, PERSONE, VERBI_DI_STRUTTURA }
  from '../../src/giochi/spagnolo/motore/flessioni.js'
import { generoDe, plurale, femminile, nomeDi, aggettivoDi, chiaveDi, traduci, nudo, eColore, eNome, PRONOMI }
  from '../../src/giochi/spagnolo/motore/lessico.js'
import { sgrammaticata, APPOSTA } from '../../src/giochi/spagnolo/motore/grammatica.js'
import { normalizza, accetta, aSchermo, inBella, eDomanda, parole }
  from '../../src/giochi/spagnolo/motore/testo.js'
import { applica, OPERAZIONI, trappoleDi } from '../../src/giochi/spagnolo/motore/trappole.js'
import { TRAPPOLE, GEMELLE } from '../../src/giochi/spagnolo/dati/trappole.js'
import { FORME, guastiDelleForme } from '../../src/giochi/spagnolo/dati/forme.js'
import { MONDI, tappaDi, guastiDeiMondi } from '../../src/giochi/spagnolo/dati/mondi.js'
import { guastiDegliArgomenti } from '../../src/giochi/spagnolo/dati/argomenti.js'
import { guastiDegliElenchi, ELENCHI } from '../../src/giochi/spagnolo/dati/elenchi.js'
import { GLOSSARIO } from '../../src/giochi/spagnolo/dati/glossario.js'
import { contesto, costruisci, giudica, composta, FORMATI_FRASE } from '../../src/giochi/spagnolo/motore/formati.js'
import { ordineGiusto, guastiDelleFrasi, guastiDelleParole } from '../../src/giochi/spagnolo/motore/guasti.js'
import { paroleNote, flessioniNote, sconosciute, cassettoDi } from '../../src/giochi/spagnolo/motore/grafo.js'
import { caselle } from '../../src/giochi/spagnolo/motore/fila.js'
import { rendi } from '../../src/giochi/spagnolo/motore/libro.js'
import { Sessione } from '../../src/giochi/spagnolo/motore/sessione.js'
import { Tocchi } from '../../src/giochi/spagnolo/motore/tocchi.js'
import { travasa, quanteVinte } from '../../src/giochi/spagnolo/motore/travaso.js'
import { sorte } from '../../src/giochi/spagnolo/motore/guasti.js'

const titolo = t => console.log('\n' + t)
const tabella = (base, come) => PERSONE.map(p => flessione(base, come, p)).join(' ')

/* ═══════════ 1. i verbi ═══════════ */
titolo('VERBI')
{
  uguale('cantar, presente', tabella('cantar', 'pres'), 'canto cantas canta cantamos cantan')
  uguale('comer, presente', tabella('comer', 'pres'), 'como comes come comemos comen')
  uguale('vivir, presente', tabella('vivir', 'pres'), 'vivo vives vive vivimos viven')
  uguale('cantar, indefinido', tabella('cantar', 'ind'), 'canté cantaste cantó cantamos cantaron')
  uguale('comer, indefinido', tabella('comer', 'ind'), 'comí comiste comió comimos comieron')
  uguale('vivir, indefinido', tabella('vivir', 'ind'), 'viví viviste vivió vivimos vivieron')
  uguale('ser', tabella('ser', 'pres'), 'soy eres es somos son')
  uguale('estar', tabella('estar', 'pres'), 'estoy estás está estamos están')
  uguale('tener', tabella('tener', 'pres'), 'tengo tienes tiene tenemos tienen')
  uguale('ir', tabella('ir', 'pres'), 'voy vas va vamos van')
  uguale('jugar (u → ue)', tabella('jugar', 'pres'), 'juego juegas juega jugamos juegan')
  uguale('querer (e → ie)', tabella('querer', 'pres'), 'quiero quieres quiere queremos quieren')
  uguale('poder (o → ue)', tabella('poder', 'pres'), 'puedo puedes puede podemos pueden')
  uguale('dormir', tabella('dormir', 'ind'), 'dormí dormiste durmió dormimos durmieron')
  uguale('pedir', tabella('pedir', 'pres'), 'pido pides pide pedimos piden')
  uguale('salir (salgo)', flessione('salir', 'pres', 'yo'), 'salgo')
  uguale('hacer, indefinido', tabella('hacer', 'ind'), 'hice hiciste hizo hicimos hicieron')
  uguale('estar, indefinido', tabella('estar', 'ind'), 'estuve estuviste estuvo estuvimos estuvieron')
  uguale('ser e ir al passato', tabella('ser', 'ind') + ' | ' + tabella('ir', 'ind'),
         'fui fuiste fue fuimos fueron | fui fuiste fue fuimos fueron')
  uguale('ver, dar (senza accento)', [flessione('ver', 'ind', 'él'), flessione('dar', 'ind', 'yo')].join(), 'vio,di')
  uguale('decir, venir, saber, poder, querer, poner',
    ['decir', 'venir', 'saber', 'poder', 'querer', 'poner'].map(b => flessione(b, 'ind', 'yo')).join(),
    'dije,vine,supe,pude,quise,puse')
  uguale('le ortografie: jugué, busqué, empecé', ['jugar', 'buscar', 'empezar'].map(b => flessione(b, 'ind', 'yo')).join(),
         'jugué,busqué,empecé')
  uguale('leer, caer, construir', ['leer', 'caer', 'construir'].map(b => flessione(b, 'ind', 'él')).join(),
         'leyó,cayó,construyó')
  uguale('reír (rio, RAE 2010)', flessione('reír', 'ind', 'él'), 'rio')
  uguale('i riflessivi: levantarse', tabella('levantarse', 'pres'), 'levanto levantas levanta levantamos levantan')
  uguale('vestirse, acostarse, despertarse', ['vestirse', 'acostarse', 'despertarse'].map(b => flessione(b, 'pres', 'yo'))
    .join(), 'visto,acuesto,despierto')
  uguale('estar de pie', flessione('estar de pie', 'pres', 'yo'), 'estoy de pie')
  uguale('i gerundi', ['cantar', 'comer', 'vivir', 'leer', 'dormir', 'pedir', 'decir', 'ir', 'reír', 'construir']
    .map(b => flessione(b, 'ger')).join(), 'cantando,comiendo,viviendo,leyendo,durmiendo,pidiendo,diciendo,yendo,riendo,construyendo')
  uguale('gustar: gusta, gustan', [flessione('gustar', 'pres', 'él'), flessione('gustar', 'pres', 'ellos')].join(), 'gusta,gustan')
  uguale('llueve, nieva; con yo niente', [flessione('llover', 'pres', 'él'), flessione('llover', 'pres', 'yo')].join(), 'llueve,')

  // dalla forma alla base: per ogni verbo di verbi-es, ogni forma torna a lui
  const perse = []
  for (const [base] of VERBI_ES) {
    if (/\s/.test(base)) continue
    for (const come of ['pres', 'ind']) for (const p of PERSONE) {
      const f = flessione(base, come, p)
      if (f && f !== base && !flesse(f).some(x => x.base === base && x.come === come && x.persona === p))
        perse.push(`${f} (${base})`)
    }
    const g = flessione(base, 'ger')
    if (!flesse(g).some(x => x.base === base)) perse.push(`${g} (${base})`)
  }
  uguale('ogni forma dei verbi di verbi-es risale alla sua base', perse.join(', '), '')
  const f = flessa('juegas')
  controlla('juegas → jugar, presente, tú', f && f.base === 'jugar' && f.come === 'pres' && f.persona === 'tú', JSON.stringify(f))
  uguale('jugué → jugar al passato', (flessa('jugué') || {}).come, 'ind')
  uguale('jugando → gerundio', (flessa('jugando') || {}).come, 'ger')
  uguale('«lavo» è lavar, non lavarse', flessa('lavo').base, 'lavar')
  uguale('«fui» è ir e ser', flesse('fui').map(x => x.base).sort().join(), 'ir,ser')
  uguale('l’infinito non è una forma flessa', flessa('comer'), null)
  uguale('le forme che una tappa ammette', formeDi('cantar', ['pres']).join(' '), 'cantar canto cantas canta cantamos cantan')
  // le ambiguità fra basi diverse: si vedono, e quelle che contano sono decise sopra
  const doppie = new Map()
  for (const base of [...VERBI_ES.map(v => v[0]), ...Object.keys(VERBI_DI_STRUTTURA)])
    for (const come of ['pres', 'ind', 'ger']) for (const p of come === 'ger' ? ['él'] : PERSONE) {
      const w = flessione(base, come, p)
      if (!w || /\s/.test(w)) continue
      const basi = [...new Set(flesse(w).map(x => x.base))]
      if (basi.length > 1) doppie.set(w, basi.join('/'))
    }
  nota(`forme con due basi: ${[...doppie].map(([w, b]) => `${w} (${b})`).join(', ')}`)
}

/* ═══════════ 2. nomi, aggettivi, parole ═══════════ */
titolo('LESSICO')
{
  for (const [w, g] of [['perro', 'm'], ['vaca', 'f'], ['mano', 'f'], ['día', 'm'], ['mapa', 'm'], ['sofá', 'm'],
                        ['leche', 'f'], ['tomate', 'm'], ['lápiz', 'm'], ['nariz', 'f'], ['canción', 'f'],
                        ['ciudad', 'f'], ['agua', 'f'], ['la mañana', 'f'], ['el día', 'm'], ['flor', 'f'],
                        ['sal', 'f'], ['árbol', 'm'], ['camión', 'm'], ['lunes', 'm'], ['fantasma', 'm'],
                        ['pavo real', 'm'], ['papas fritas', 'f'], ['fin de semana', 'm']])
    uguale(`${w} è ${g}`, generoDe(w), g)
  // il genere di tutti i nomi di parole-es: quelli senza si stampano (li aggiunge chi li mette)
  const nomi = PAROLE_ES.filter(w => nomeDi(nudo(w[0])))
  const senza = nomi.filter(w => !generoDe(w[0])).map(w => w[0])
  nota(`${nomi.length} nomi in parole-es; senza genere dedotto: ${senza.join(', ') || 'nessuno'}`)
  if (senza.length) nota('⚠ da aggiungere a src/giochi/spagnolo/dati/generi.js:', senza.join(', '))

  for (const [s, p] of [['perro', 'perros'], ['ratón', 'ratones'], ['lápiz', 'lápices'], ['canción', 'canciones'],
                        ['joven', 'jóvenes'], ['examen', 'exámenes'], ['lunes', 'lunes'], ['paraguas', 'paraguas'],
                        ['autobús', 'autobuses'], ['país', 'países'], ['mes', 'meses'], ['rey', 'reyes'], ['sofá', 'sofás'],
                        ['uvas', 'uvas'], ['la noche', 'las noches'], ['fin de semana', 'fines de semana'],
                        ['pavo real', 'pavos reales'], ['árbol', 'árboles'], ['feliz', 'felices']])
    uguale(`plurale di ${s}`, plurale(s), p)
  for (const [m, f] of [['negro', 'negra'], ['rosado', 'rosada'], ['azul', 'azul'], ['verde', 'verde'], ['gris', 'gris'],
                        ['marrón', 'marrón'], ['naranja', 'naranja'], ['grande', 'grande'], ['trabajador', 'trabajadora'],
                        ['feliz', 'feliz'], ['mejor', 'mejor']])
    uguale(`femminile di ${m}`, femminile(m), f)

  uguale('perros → perro, plurale', JSON.stringify(nomeDi('perros')), JSON.stringify({ base: 'perro', plurale: true, genere: 'm' }))
  uguale('lápices → lápiz', nomeDi('lápices').base, 'lápiz')
  uguale('uvas è già plurale', nomeDi('uvas').plurale, true)
  uguale('noches → la noche', nomeDi('noches').base, 'la noche')
  uguale('rojas → rojo, femminile plurale', JSON.stringify(aggettivoDi('rojas')), JSON.stringify({ base: 'rojo', genere: 'f', plurale: true }))
  controlla('negra è un colore, color no', eColore('negra') && !eColore('color'))
  controlla('Laura è un nome', eNome('Laura'))
  controlla('i pronomi', ['yo', 'tú', 'él', 'ella', 'nosotros', 'ellos', 'ellas', 'usted', 'ustedes'].every(p => PRONOMI.has(p)))

  for (const [w, k] of [['perros', 'es:perro'], ['roja', 'es:rojo'], ['rojas', 'es:rojo'], ['juegas', 'verbo-es:jugar'],
                        ['jugué', 'verbo-es:jugar'], ['jugando', 'verbo-es:jugar'], ['me', null], ['es', null],
                        ['lápices', 'es:lápiz'], ['noches', 'es:la noche'], ['Laura', null]])
    uguale(`chiave di ${w}`, chiaveDi(w), k)
  for (const [w, it] of [['juega', 'giocare (lui/lei)'], ['jugando', 'giocare (adesso)'], ['jugué', 'giocare (al passato)'],
                         ['rojas', 'rosso'], ['perros', 'cane'], ['del', 'di + il (del niño: del bambino)'],
                         ['al', 'a + il (al parque: al parco)'], ['fui', 'andare / essere (al passato)'],
                         ['tengo', 'ho'], ['Laura', 'è un nome']])
    uguale(`${w} toccato`, traduci(w).it, it)
  // ogni parola di struttura delle forme dice qualcosa quando la si tocca
  const mute = new Set()
  for (const f of Object.values(FORME)) for (const p of [...f.parole, ...f.segni])
    for (const w of p.split(' ')) if (!w.startsWith('#') && !traduci(w).it) mute.add(w)
  uguale('le parole delle forme si traducono', [...mute].join(', '), '')
  controlla('il glossario non ripete le parole di parole-es che si traducono già',
            Object.keys(GLOSSARIO).length > 50)
}

/* ═══════════ 3. il testo ═══════════ */
titolo('TESTO')
{
  uguale('la punteggiatura non è una parola', parole('¿Dónde está el gato?').join(' '), 'Dónde está el gato')
  uguale('normalizza', normalizza('¡Hola! ¿Cómo estás?'), 'hola cómo estás')
  controlla('gli accenti contano', !accetta('el es alto', { es: 'él es alto' }) && accetta('Él es alto.', { es: 'él es alto' }))
  controlla('qué non è que', !accetta('que es', { es: 'qué es' }))
  uguale('la domanda a schermo', aSchermo('dónde está el gato', true, 'es'), '¿Dónde está el gato?')
  uguale('l’affermazione a schermo', aSchermo('es un perro', false, 'es'), 'Es un perro.')
  uguale('l’italiano', aSchermo('è un cane?'), 'È un cane?')
  uguale('la fila', inBella(['qué', 'es'], { domanda: true }), '¿Qué es?')
  controlla('la domanda la dice l’italiano', eDomanda({ it: 'dov’è?' }) && !eDomanda({ it: 'è qui' }))
  const d = { formato: 'monta', domandaIt: true, tessere: [{ id: 0, testo: 'qué' }, { id: 1, testo: 'es' }], soluzione: ['qué', 'es'] }
  const c = caselle(d, [0, 1])
  uguale('la fila di una domanda: ¿ in testa e ? in coda', [c.apre, c.caselle.map(x => x.testo).join(' '), c.punto].join(''), '¿Qué es?')
}

/* ═══════════ 4. la concordanza ═══════════ */
titolo('CONCORDANZA')
{
  const giuste = ['es un perro', 'es una vaca', 'el gato negro', 'la vaca negra', 'los gatos negros', 'dos perros',
    'el agua fría', 'el agua está fría', 'la casa es blanca', 'ellos están cansados', 'buenos días', 'buenas noches',
    'hace mucho frío', 'tengo mucha hambre', 'voy al parque', 'el perro del niño', 'son las tres y media', 'es la una',
    'el cinco de mayo', 'feliz cumpleaños', 'los lunes juego', 'este es mi perro', 'esta es una regla', 'mis gatos',
    'el primer día', 'tengo siete años', 'me gustan las uvas', 'el lápiz azul', 'los lápices azules', 'Laura es alta',
    'mi hermano es más alto que mi hermana', 'quiero un poco de leche', 'la mano', 'el mapa', 'una casa verde',
    'una vaca marrón', 'es un gato blanco y negro', 'otra vez', 'a veces', 'el perro de Laura es negro',
    'Laura y Leo son altos', 'el niño limpia la casa', 'la cantante es alta', 'el cantante es alto', 'yo soy alta',
    'hay dos camas', 'la vaca es una vaca', 'gira a la izquierda', 'está al lado del parque', 'nosotros somos amigos',
    'mi mamá cocina pizza', 'ella come pan', 'me levanto a las siete', 'estoy comiendo', 'ayer fui al cine']
  for (const s of giuste) uguale(`«${s}» sta in piedi`, sgrammaticata(s), null)
  const storte = ['es una perro', 'la gato', 'los gato', 'este casa', 'una casa blanco', 'dos perro', 'la agua',
    'una agua', 'a el parque', 'de el niño', 'la vaca es negro', 'buenas días', 'un leche', 'el primero día', 'mis gato',
    'un perros', 'al escuela', 'muchos agua', 'ella está cansado', 'los gatos negro', 'uno perro', 'dos leches']
  for (const s of storte) controlla(`«${s}» è sgrammaticata`, !!sgrammaticata(s))
}

/* ═══════════ 5. la tabella delle trappole ═══════════ */
titolo('TRAPPOLE')
{
  const ids = new Set()
  for (const r of TRAPPOLE) {
    controlla(`trappola ${r.id}: id unico`, !ids.has(r.id)); ids.add(r.id)
    controlla(`trappola ${r.id}: operazione nota`, !!OPERAZIONI[r.fa])
    controlla(`trappola ${r.id}: forma nota`, r.forma === null || !!FORME[r.forma])
    for (const f of r.soloForme || []) controlla(`trappola ${r.id}: soloForme ${f} esiste`, !!FORME[f])
    const [giusta, sbagliata] = r.esempio
    uguale(`trappola ${r.id}: l’esempio giusto sta in piedi`, sgrammaticata(giusta), null)
    const fuori = applica(r, { es: giusta, forma: null }, { domanda: /^¿/.test(giusta), vicine: () => ['gato', 'perro'] })
    const t = fuori.find(x => normalizza(x.es) === normalizza(sbagliata))
    controlla(`trappola ${r.id}: dal suo esempio esce «${sbagliata}»`, !!t, fuori.map(x => x.es).join(' | '))
    if (t) controlla(`trappola ${r.id}: perché sotto i 70`, t.perche.length <= 70 && !/[{}]/.test(t.perche), t.perche)
    if (APPOSTA.has(r.id)) controlla(`trappola ${r.id}: sbaglia apposta la concordanza`, !!sgrammaticata(sbagliata))
  }
  for (const id of APPOSTA) controlla(`APPOSTA nomina una riga che c’è (${id})`, ids.has(id))
  // ogni struttura ha almeno una riga che la riguarda
  const scoperte = Object.keys(FORME).filter(f => !TRAPPOLE.some(r => r.forma === f || (r.soloForme || []).includes(f)))
  uguale('ogni forma ha una sua trappola', scoperte.join(', '), '')
  controlla('le gemelle sono parole minuscole e diverse', GEMELLE.every(g => g.length >= 2 && new Set(g).size === g.length &&
                                                                         g.every(w => w === w.toLowerCase())))
  nota(`${TRAPPOLE.length} righe per ${Object.keys(FORME).length} forme`)
}

/* ═══════════ 6. un mazzo di frasi di prova ═══════════
   Non sono i dati del gioco: servono a vedere che da frasi vere le
   trappole escono sbagliate per il motivo che dicono, e ogni formato si
   costruisce e ha una sola risposta giusta. */
titolo('FRASI DI PROVA')
const P = (tappa, forma, it, es) => ({ id: 'prova-' + es.replace(/\s+/g, '-'), tappa, forma, it, es })
const PROVE = [
  P('prima-es-un', 'es-un', 'è un cane', 'es un perro'), P('prima-es-un', 'es-un', 'è una mucca?', 'es una vaca'),
  P('prima-es-un', 'es-un', 'non è un gatto', 'no es un gato'), P('prima-el-la', 'el-la', 'il gatto è un gatto', 'el gato es un gato'),
  P('prima-color', 'color-despues', 'è un gatto nero', 'es un gato negro'),
  P('prima-color', 'color-despues', 'la mucca è bianca', 'la vaca es blanca'),
  P('prima-color', 'color-despues', 'è una palla rossa', 'es una pelota roja'),
  P('prima-hola', 'saludos', 'ciao, mi chiamo Leo', 'hola me llamo Leo'), P('prima-hola', 'saludos', 'come ti chiami?', 'cómo te llamas'),
  P('prima-hola', 'saludos', 'buongiorno, come stai?', 'buenos días cómo estás'),
  P('prima-este', 'este-esta', 'questo è un libro', 'este es un libro'), P('prima-este', 'este-esta', 'questa è la mia riga', 'esta es mi regla'),
  P('seconda-plural', 'plural', 'sono due gatti', 'son dos gatos'), P('seconda-plural', 'plural', 'i cani sono neri', 'los perros son negros'),
  P('seconda-gusta', 'me-gusta', 'mi piace il pane', 'me gusta el pan'),
  P('seconda-gusta', 'me-gusta', 'ti piacciono le mele?', 'te gustan las manzanas'),
  P('seconda-gusta', 'me-gusta', 'non mi piace il latte', 'no me gusta la leche'),
  P('seconda-mi', 'mi-tu-su', 'sono i miei gatti', 'son mis gatos'), P('seconda-soy', 'ser', 'lei è piccola', 'ella es pequeña'),
  P('seconda-tengo', 'tener', 'ho sette anni', 'tengo siete años'), P('seconda-tiene', 'tiene', 'lei ha un cappello', 'ella tiene un sombrero'),
  P('terza-donde', 'esta-en', 'dov’è il gatto?', 'dónde está el gato'),
  P('terza-donde', 'esta-en', 'il gatto è sul tavolo', 'el gato está sobre la mesa'),
  P('terza-hay', 'hay', 'c’è un gatto in cucina', 'hay un gato en la cocina'), P('terza-hay', 'hay', 'ci sono due letti', 'hay dos camas'),
  P('terza-hoy', 'hoy-es', 'oggi è lunedì', 'hoy es lunes'), P('terza-hace', 'hace', 'oggi fa molto caldo', 'hoy hace mucho calor'),
  P('terza-estar', 'ser-estar', 'mia sorella è alta', 'mi hermana es alta'), P('terza-estar', 'ser-estar', 'sono stanco', 'estoy cansado'),
  P('quarta-hora', 'hora', 'sono le tre e mezza', 'son las tres y media'),
  P('quarta-canto', 'presente-ar', 'lei ascolta la musica', 'ella escucha música'),
  P('quarta-fechas', 'fechas', 'il mio compleanno è il cinque di maggio', 'mi cumpleaños es el cinco de mayo'),
  P('quarta-unos', 'cantidad', 'c’è molta acqua', 'hay mucha agua'),
  P('quarta-come', 'presente-er-ir', 'noi viviamo in una casa grande', 'nosotros vivimos en una casa grande'),
  P('quarta-come', 'presente-er-ir', 'lei mangia il pane', 'ella come pan'),
  P('quarta-me-levanto', 'reflexivos', 'mi alzo alle sette', 'me levanto a las siete'),
  P('quarta-gerundio', 'gerundio', 'lui sta ascoltando la musica', 'él está escuchando música'),
  P('quinta-voy', 'voy-al', 'andiamo a scuola', 'vamos a la escuela'), P('quinta-voy', 'voy-al', 'vado al parco', 'voy al parque'),
  P('quinta-gira', 'direcciones', 'la banca è accanto al parco', 'el banco está al lado del parque'),
  P('quinta-cuanto', 'cuanto', 'costa due bolivianos', 'cuesta dos bolivianos'),
  P('quinta-de', 'de', 'è la casa del nonno', 'es la casa del abuelo'), P('quinta-quiero', 'quiero-puedo', 'voglio giocare', 'quiero jugar'),
  P('quinta-quiero', 'quiero-puedo', 'possiamo dormire qui', 'podemos dormir aquí'),
  P('sesta-ayer', 'ayer', 'ieri ero al parco', 'ayer estuve en el parque'),
  P('sesta-fui', 'pasado-irr', 'ieri ho fatto una torta', 'ayer hice una torta'),
  P('sesta-jugue', 'pasado-reg', 'lei ha mangiato una mela', 'ella comió una manzana'),
  P('sesta-dijo', 'decir', 'Leo ha detto ciao', 'Leo dijo hola'),
  P('sesta-cuando', 'cuando', 'quando fa freddo bevo latte', 'cuando hace frío bebo leche'),
  P('sesta-mas', 'comparativos', 'mio fratello è più alto di me', 'mi hermano es más alto que yo'),
  P('sesta-voy-a', 'voy-a', 'lei giocherà a tennis', 'ella va a jugar al tenis'),
]
{
  const guasti = []
  let quante = 0
  for (const f of PROVE) f.mondo = (tappaDi(f.tappa) || {}).mondo
  for (const f of PROVE) {
    const tappa = tappaDi(f.tappa)
    if (!tappa) { guasti.push(`${f.es}: tappa ${f.tappa} sconosciuta`); continue }
    if (sgrammaticata(f.es)) guasti.push(`${f.es}: sgrammaticata (${sgrammaticata(f.es)})`)
    const altre = PROVE.filter(x => x.mondo === f.mondo && x !== f)
    const tr = trappoleDi(f, contesto(f, { tappa, altre }))
    quante += tr.length
    if (tr.length < 2) guasti.push(`${f.es}: solo ${tr.length} trappole`)
    for (const t of tr) {
      if (accetta(t.es, f)) guasti.push(`${f.es}: la trappola ${t.id} è la giusta`)
      const s = !APPOSTA.has(t.id) && sgrammaticata(t.es)
      if (s) guasti.push(`${f.es}: la trappola ${t.id} «${t.es}» è sgrammaticata per caso (${s})`)
      if (t.perche.length > 70 || /[{}]/.test(t.perche)) guasti.push(`${f.es}: perché storto: ${t.perche}`)
    }
    for (let s = 1; s <= 3; s++) {
      const ctx = contesto(f, { tappa, altre, rnd: sorte(s * 31 + f.es.length) })
      for (const formato of FORMATI_FRASE) {
        const d = costruisci(f, formato, ctx, { forza: 6 })
        if (d.opzioni) {
          const giuste = d.opzioni.filter(o => o.giusta)
          if (giuste.length !== 1 || d.opzioni.length !== 4) guasti.push(`${f.es} (${formato}): ${giuste.length} giuste su ${d.opzioni.length}`)
          if (!giudica(f, d, giuste[0], { ctx }).giusta) guasti.push(`${f.es} (${formato}): la giusta non è giusta`)
          if (formato === 'scegli' && eDomanda(f) && !d.opzioni.every(o => /^¿.*\?$/.test(o.testo)))
            guasti.push(`${f.es} (scegli): le opzioni di una domanda vogliono tutte ¿…?`)
        } else {
          const ids = ordineGiusto(d)
          if (!ids || !accetta(composta(d, ids), f) || !giudica(f, d, ids, { ctx }).giusta)
            guasti.push(`${f.es} (${formato}): la fila giusta non torna`)
        }
      }
    }
  }
  uguale('le frasi di prova e le loro trappole', guasti.slice(0, 15).join(' · '), '')
  nota(`${PROVE.length} frasi di prova, ${quante} trappole`)
  // le trappole rifanno il resto: niente due sbagli in uno
  const tr = (es, tappa, forma, it) => {
    const f = { id: 'x', es, tappa, forma, it, mondo: tappaDi(tappa).mondo }
    return trappoleDi(f, contesto(f, { tappa: tappaDi(tappa) })).map(t => t.es)
  }
  controlla('la mucca al posto del gatto si porta l’articolo e il colore', tr('es un gato negro', 'prima-color', 'color-despues', 'è un gatto nero')
    .includes('es una vaca negra'))
  controlla('e il predicato', tr('el gato es negro', 'prima-color', 'color-despues', 'il gatto è nero').includes('la vaca es negra'))
  controlla('esta es mi regla → este es mi libro', tr('esta es mi regla', 'prima-este', 'este-esta', 'questa è la mia riga')
    .includes('este es mi libro'))
  controlla('tengo → tiene senza soggetto non è una trappola', !tr('tengo un perro', 'seconda-tengo', 'tener', 'ho un cane')
    .includes('tiene un perro'))
  controlla('una domanda resta una domanda (niente trappole che la girano)', tr('dónde está el gato', 'terza-donde', 'esta-en',
    'dov’è il gatto?').every(t => !/^el gato/.test(t)))
  controlla('«pedo» non esce mai', !PROVE.some(f => trappoleDi(f, contesto(f, { tappa: tappaDi(f.tappa) })).some(t => /\bpedo\b/.test(t.es))))
}

/* ═══════════ 7. i segnaposto del libro ═══════════ */
titolo('LIBRO')
{
  const [perro, gato, vaca] = ELENCHI.animali
  const negro = ELENCHI.colori[0]
  uguale('{un:x}', rendi('{un:a} y {un:b}', { a: perro, b: vaca }), 'un perro y una vaca')
  uguale('{El:x} e {los:x}', rendi('{El:a} y {los:b}', { a: vaca, b: gato }), 'La vaca y los gatos')
  uguale('el agua', rendi('{el:x}', { x: { es: 'agua', it: 'acqua' } }), 'el agua')
  uguale('{c~x}: il colore accordato', rendi('{un:x} {c~x}', { x: vaca, c: negro }), 'una vaca negra')
  uguale('{c~x.pl}', rendi('{los:x} {c~x.pl}', { x: vaca, c: negro }), 'las vacas negras')
  uguale('{x.f}, {x.pl}', rendi('{c.f} {x.pl}', { x: perro, c: negro }), 'negra perros')
  const posto = es => ({ es, it: es })
  uguale('{al:x}, {del:x}', rendi('{al:a} {al:b} {al:c} {Del:a} {del:b}', { a: posto('parque'), b: posto('escuela'),
    c: posto('agua') }), 'al parque a la escuela al agua Del parque de la escuela')
  uguale('{este:x}', rendi('{este:a} y {Este:b}', { a: vaca, b: perro }), 'esta vaca y Este perro')
  uguale('{bonito~x}: un aggettivo scritto', rendi('{un:x} {bonito~x}', { x: vaca }), 'una vaca bonita')
  uguale('sgrammaticata non passa la virgola', sgrammaticata('A las ocho, mamá abre la puerta'), null)
  stessaLista('i puntini tagliano', parole('Leo… hoy'), ['Leo', 'hoy'])
  nessunoStampa('gli elenchi del libro', guastiDegliElenchi(new Set(PAROLE_ES.map(w => w[0]))))
}

/* ═══════════ 8. il motore gira: una partita a una tappa di parole ═══════════ */
titolo('PARTITA')
{
  const items = new Map()
  const itemDi = k => { if (!items.has(k)) items.set(k, newItem()); return items.get(k) }
  const s = new Sessione({ tappa: tappaDi('prima-animales'), itemDi, rnd: sorte(3) })
  let turni = 0
  while (!s.finita && turni++ < 100) {
    const d = s.prossima()
    if (!d) break
    const es = s.rispondi(d, d.opzioni.find(o => o.giusta))
    for (const r of es.registra) record(itemDi(r.chiave), { correct: r.correct, now: Date.now() })
  }
  controlla('la tappa degli animali si gioca e finisce', s.finita, `${s.giuste}/${s.bersaglio}`)
  controlla('segna le chiavi es:', [...items.keys()].some(k => k === 'es:perro'), [...items.keys()].join(' '))
  const t = new Tocchi({ itemDi: k => newItem() })
  uguale('toccare «perros»', JSON.stringify([t.tocca('perros').chiave, t.tocca('perros').it]), JSON.stringify(['es:perro', 'cane']))
  controlla('le parole di struttura sono gratis e non contano', new Tocchi({ itemDi: k => newItem() }).tocca('es').chiave === null)
  const c = { tappa: 3, vinte: { 'prima-colores': 1, 'vecchia-tappa': 2 } }
  controlla('il travaso non c’è: conta solo le tappe che ci sono', travasa(c) && c.tappa === 1 && !travasa(c) &&
            quanteVinte(c.vinte) === 1)
  controlla('il cassetto della prima ha gli animali che nessuna tappa insegna', cassettoDi('prima').chiavi.includes('es:zorro'))
  uguale('le parole note a una tappa sanno i pezzi delle voci lunghe',
    sconosciute('estoy al lado de la casa', paroleNote('quinta', 'quinta-gira'), flessioniNote('quinta', 'quinta-gira')).join(), '')
  uguale('«jugué» solo dal pretérito', sconosciute('ayer jugué', paroleNote('sesta', 'sesta-ayer'), flessioniNote('sesta', 'sesta-ayer'))
    .join(), 'jugué')
}

/* ═══════════ 9. i dati delle altre parti: si stampano, non fermano ═══════════
   Il grafo, gli argomenti, le parole e le frasi li scrivono altri, e le
   parole arrivano un po' alla volta: qui si dice cosa manca ancora. */
titolo('DATI (da sistemare, non fermano il test)')
function nessunoStampa(cosa, guasti) {
  if (guasti.length) nota(`⚠ ${cosa}: ${guasti.length} — ${guasti.slice(0, 10).join(' · ')}`)
  else nota(`${cosa}: a posto`)
}
uguale('le forme stanno in piedi', guastiDelleForme().join(' · '), '')
nessunoStampa('il grafo dei mondi', guastiDeiMondi())
nessunoStampa('gli argomenti', guastiDegliArgomenti())
nessunoStampa('le domande sulle parole', guastiDelleParole({ giri: 1 }))
nessunoStampa('le frasi componibili', guastiDelleFrasi())
nota(`${MONDI.length} mondi`)

riassunto('spagnolo: la lingua del motore')
