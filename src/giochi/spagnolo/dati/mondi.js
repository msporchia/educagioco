// Il grafo dei mondi dello spagnolo: un mondo per anno della scuola
// primaria (più uno dopo), le sue tappe, da cosa si apre, e le categorie di
// data/words.js che finiscono nel suo 📦 cassetto. Il perché di ogni
// scelta, e il programma di ogni anno, stanno in docs/lingue/spagnolo.md.
//
// Un mondo: { id, anno (1–5 la primaria, 6 dopo), nome (un posto, mai
//   l'anno di scuola), disegno, insegna, dopo: [id…] (tutti finiti),
//   dopoUno?: [id…] (basta uno), categorie: [cat di words.js], paesaggio
//   (il carattere dell'isola sulla mappa, scena/mappa.js), verbi?: true (i verbi di data/verbi.js che nessuna tappa insegna vanno
//   nel suo cassetto), strutture?: [forma…] (le strutture dell'anno che il
//   libro sa dalla prima pagina del mondo, prima della loro tappa di
//   frasi), tappe: [...] }. Un mondo senza tappe è «in arrivo»: sta sulla
//   mappa ma non si apre.
// Le tappe si alternano: una di FRASI — { id, nome, disegno, forme: [forma…] }
//   (una struttura, fatta solo di parole già viste) — viene
//   subito dopo le tappe di PAROLE che le servono — { id, nome, disegno,
//   argomento, parole } (8–10 parole di un argomento solo, dati/argomenti.js)
//   —, e in fondo la 🏁 (`bandiera: true`), che ripassa tutto il mondo. La `portata` la
//   mette `anno` (vedi `portate`): nessuno la scrive a mano.
import { PAROLE_ES as WORDS } from '../../../data/parole-es.js'
import { VERBI_ES as VERBI } from '../../../data/verbi-es.js'
import { FORME } from './forme.js'
import { ARGOMENTI, paroleDellArgomento } from './argomenti.js'

// dove sta l'avanzamento nel profilo: profile.campagne[CHIAVE] (p.esp resta al gioco di prima)
export const CHIAVE = 'spagnolo'

// le parole «che tengono insieme le frasi» non hanno un cassetto: arrivano con le forme
export const CATEGORIE_DI_STRUTTURA = ['q']

const parole = (id, nome, disegno, argomento, lista) => ({ id, nome, disegno, argomento, parole: lista, forme: [] })
const frasi = (id, nome, disegno, forme) => ({ id, nome, disegno, forme, parole: [], frasi: true })
const bandiera = id => ({ id, nome: 'La bandiera', disegno: 'bandiera', bandiera: true, parole: [], forme: [] })

// La portata di una tappa viene dall'anno di scuola: l'anno n va dai 5+n ai
// 6+n anni, cioè da 12,5·(n+1) a 12,5·(n+2) sulla scala di data/portata.js;
// le tappe si spargono dentro quell'anno, dalla prima all'ultima.
export const PUNTI_PER_ANNO = 12.5
export const inizioDellAnno = anno => PUNTI_PER_ANNO * (anno + 1)
function portate(m) {
  const n = m.tappe.length
  m.tappe.forEach((t, i) => {
    t.portata = Math.round(inizioDellAnno(m.anno) + (n > 1 ? (PUNTI_PER_ANNO - 1.5) * i / (n - 1) : 0))
  })
  return m
}

export const MONDI = [
  {
    id: 'prima', anno: 1, nome: 'La valle dei girasoli', disegno: 'palla', paesaggio: 'primavera',
    insegna: 'un e una, el e la, hola, me llamo, este y esta, i numeri fino a dieci, un gato negro',
    dopo: [], categorie: ['a', 'c', 's', 'g', 'e'],
    tappe: [
      parole('prima-colores', 'I colori', 'pennelli', 'colores',
        ['rojo', 'azul', 'verde', 'amarillo', 'naranja', 'morado', 'rosado', 'negro', 'blanco', 'marrón']),
      parole('prima-animales', 'Gli animali', 'cane', 'animales',
        ['perro', 'gato', 'pez', 'pájaro', 'ratón', 'conejo', 'caballo', 'vaca', 'cerdo', 'pato']),
      parole('prima-juguetes', 'I giocattoli', 'palla', 'juguetes',
        ['pelota', 'muñeca', 'peluche', 'cometa', 'rompecabezas', 'juego', 'auto', 'bote', 'patín', 'dado']),
      frasi('prima-es-un', 'È un cane, è una mucca', 'punto-di-domanda', ['es-un']),
      frasi('prima-el-la', 'Il gatto, la mucca', 'cane', ['el-la']),
      frasi('prima-color', 'Un gatto nero', 'pennelli', ['color-despues']),
      parole('prima-fiestas', 'Le feste', 'zucca', 'fiestas',
        ['fiesta', 'regalo', 'globo', 'Navidad', 'Pascua', 'Carnaval', 'calabaza', 'bruja', 'fantasma',
         'disfraz']),
      frasi('prima-hola', 'Ciao! Come ti chiami?', 'coppia', ['saludos']),
      parole('prima-escuela', 'A scuola', 'zaino', 'escuela',
        ['libro', 'lápiz', 'bolígrafo', 'regla', 'mochila', 'cuaderno', 'borrador', 'mapa', 'caja', 'tijeras']),
      frasi('prima-este', 'Questo è…', 'zaino', ['este-esta']),
      parole('prima-numeros', 'I numeri fino a dieci', 'dita', 'numeros',
        ['uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez']),
      bandiera('prima-bandera'),
    ],
  },
  {
    id: 'seconda', anno: 2, nome: 'La baia delle palme', disegno: 'casetta', paesaggio: 'estate',
    insegna: 'los e las, i plurali, me gusta, mi, tu, su, yo soy, tengo, i numeri fino a venti',
    dopo: ['prima'], categorie: ['b', 'k', 'f', 'p', 'j'],
    tappe: [
      parole('seconda-comida', 'Il cibo', 'torta', 'comida',
        ['manzana', 'plátano', 'pizza', 'torta', 'leche', 'pan', 'queso', 'chocolate', 'huevo', 'galleta']),
      frasi('seconda-plural', 'Due gatti, i gatti', 'torta', ['plural']),
      parole('seconda-almuerzo', 'A pranzo', 'piatto', 'comida',
        ['zanahoria', 'papa', 'tomate', 'ensalada', 'sopa', 'fideos', 'arroz', 'jugo', 'frutilla', 'uvas']),
      frasi('seconda-gusta', 'Mi piace!', 'torta', ['me-gusta']),
      parole('seconda-familia', 'La famiglia', 'famiglia', 'familia',
        ['mamá', 'papá', 'hermana', 'hermano', 'abuela', 'abuelo', 'bebé', 'amigo', 'tía', 'tío']),
      parole('seconda-ropa', 'I vestiti', 'cappello', 'ropa',
        ['sombrero', 'gorra', 'camiseta', 'vestido', 'zapato', 'calcetín', 'abrigo', 'bufanda', 'guante',
         'pantalón']),
      frasi('seconda-mi', 'Questo è mio', 'famiglia', ['mi-tu-su']),
      parole('seconda-como', 'Come sono', 'faccia', 'como-son',
        ['grande', 'pequeño', 'alto', 'bajo', 'nuevo', 'viejo', 'bueno', 'malo', 'bonito', 'fuerte']),
      frasi('seconda-soy', 'Io sono, tu sei', 'famiglia', ['ser']),
      parole('seconda-veinte', 'I numeri fino a venti', 'dita', 'numeros',
        ['once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve',
         'veinte']),
      frasi('seconda-tengo', 'Ho un…, ho fame', 'cappello', ['tener']),
      parole('seconda-cuerpo', 'Il corpo', 'faccia', 'cuerpo',
        ['cabeza', 'ojo', 'oreja', 'nariz', 'boca', 'mano', 'pie', 'pierna', 'brazo', 'pelo']),
      frasi('seconda-tiene', 'Lei ha…', 'faccia', ['tiene']),
      bandiera('seconda-bandera'),
    ],
  },
  {
    id: 'terza', anno: 3, nome: 'L’altopiano d’autunno', disegno: 'scatola', paesaggio: 'autunno',
    insegna: 'dónde está, en, sobre, debajo, hay, quién, qué, cómo, hoy es, hace frío, estar y ser',
    dopo: ['seconda'], categorie: ['h', 'd', 'w', 'n'],
    tappe: [
      parole('terza-casa', 'La casa', 'casetta', 'casa',
        ['casa', 'cocina', 'dormitorio', 'baño', 'jardín', 'garaje', 'puerta', 'ventana', 'techo', 'pared']),
      parole('terza-muebles', 'I mobili', 'scatola', 'casa',
        ['cama', 'silla', 'mesa', 'sofá', 'lámpara', 'espejo', 'reloj', 'cuadro', 'ducha', 'bañera']),
      frasi('terza-donde', 'Dov’è?', 'scatola', ['esta-en']),
      parole('terza-cien', 'I numeri fino a cento', 'dita', 'numeros',
        ['treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa', 'cien']),
      frasi('terza-hay', 'C’è, ci sono', 'casetta', ['hay']),
      frasi('terza-quien', 'Chi? Che cosa? Come?', 'punto-di-domanda', ['preguntas']),
      parole('terza-dias', 'I giorni', 'sole', 'calendario',
        ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo', 'hoy', 'mañana',
         'fin de semana']),
      parole('terza-estaciones', 'Le stagioni e i mesi', 'clessidra', 'calendario',
        ['primavera', 'verano', 'otoño', 'invierno', 'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio']),
      parole('terza-meses', 'Gli altri mesi', 'clessidra', 'calendario',
        ['julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre', 'cumpleaños', 'vacaciones']),
      frasi('terza-hoy', 'Oggi è lunedì', 'sole', ['hoy-es']),
      parole('terza-tiempo', 'Che tempo fa', 'sole', 'tiempo',
        ['sol', 'lluvia', 'nieve', 'viento', 'nube', 'tormenta', 'niebla', 'arcoíris', 'cielo', 'hielo']),
      frasi('terza-hace', 'Fa freddo, piove', 'sole', ['hace']),
      parole('terza-estados', 'Come stai?', 'faccia', 'estados',
        ['feliz', 'triste', 'cansado', 'enojado', 'enfermo', 'asustado', 'hambriento', 'sediento', 'contento']),
      frasi('terza-estar', 'Essere o stare?', 'faccia', ['ser-estar']),
      bandiera('terza-bandera'),
    ],
  },
  {
    id: 'quarta', anno: 4, nome: 'Il rifugio d’inverno', disegno: 'sole', paesaggio: 'inverno',
    insegna: 'qué hora es, lavo, como, me levanto, el cinco de mayo, unos, un poco de, estoy jugando',
    dopo: ['terza'], categorie: ['t'], verbi: true, strutture: ['hora', 'presente-ar', 'presente-er-ir', 'reflexivos', 'gerundio'],
    tappe: [
      parole('quarta-dia', 'La giornata', 'sole', 'dia',
        ['la mañana', 'la tarde', 'el atardecer', 'la noche', 'el día', 'desayuno', 'almuerzo', 'cena',
         'hora', 'minuto']),
      frasi('quarta-hora', 'Che ore sono?', 'clessidra', ['hora']),
      parole('quarta-verbos', 'Ogni giorno', 'torta', 'verbos',
        ['comer', 'beber', 'vivir', 'lavar', 'cocinar', 'escuchar', 'mirar', 'ayudar', 'abrir', 'limpiar']),
      parole('quarta-deportes', 'Sport e musica', 'palla', 'deportes',
        ['tenis', 'básquet', 'natación', 'guitarra', 'tambor', 'piano', 'trompeta', 'violín', 'música',
         'equipo']),
      frasi('quarta-canto', 'Io lavo, tu ascolti', 'palla', ['presente-ar']),
      frasi('quarta-fechas', 'Il cinque di maggio', 'clessidra', ['fechas']),
      frasi('quarta-unos', 'Un po’ di…, alcuni', 'torta', ['cantidad']),
      parole('quarta-oficios', 'I mestieri', 'coppia', 'oficios',
        ['maestra', 'doctor', 'agricultor', 'cocinero', 'policía', 'bombero', 'piloto', 'enfermera',
         'cantante']),
      frasi('quarta-come', 'Lei mangia, lui vive', 'coppia', ['presente-er-ir']),
      parole('quarta-rutina', 'La mattina', 'sole', 'rutina',
        ['levantarse', 'despertarse', 'lavarse', 'ducharse', 'peinarse', 'vestirse', 'acostarse', 'sentarse']),
      frasi('quarta-me-levanto', 'Mi alzo alle sette', 'sole', ['reflexivos']),
      parole('quarta-transportes', 'I mezzi', 'bicicletta', 'transportes',
        ['autobús', 'bicicleta', 'tren', 'avión', 'barco', 'camión', 'taxi', 'helicóptero', 'tractor',
         'monopatín']),
      frasi('quarta-gerundio', 'Che cosa stai facendo?', 'bicicletta', ['gerundio']),
      bandiera('quarta-bandera'),
    ],
  },
  {
    id: 'quinta', anno: 5, nome: 'La terra dei vulcani', disegno: 'casetta', paesaggio: 'vulcano',
    insegna: 'voy al parque, gira a la izquierda, al lado del…, ¿cuánto cuesta?, el perro de Tom, quiero, puedo',
    dopo: ['quarta'], categorie: ['y', 'm'], strutture: ['voy-al', 'direcciones', 'cuanto', 'de'],
    tappe: [
      parole('quinta-ciudad', 'In città', 'casetta', 'lugares',
        ['escuela', 'tienda', 'hospital', 'parque', 'estación', 'museo', 'banco', 'cine', 'biblioteca',
         'zoológico']),
      frasi('quinta-voy', 'Vado al parco', 'casetta', ['voy-al']),
      parole('quinta-calle', 'Per strada', 'bicicletta', 'calle',
        ['calle', 'esquina', 'plaza', 'semáforo', 'parada', 'estacionamiento', 'cruce', 'rotonda', 'vereda',
         'letrero']),
      frasi('quinta-gira', 'Gira a sinistra', 'bicicletta', ['direcciones']),
      parole('quinta-dinero', 'I soldi', 'forziere', 'dinero',
        ['dinero', 'moneda', 'billete', 'centavo', 'precio', 'billetera', 'barato', 'caro']),
      frasi('quinta-cuanto', 'Quanto costa?', 'forziere', ['cuanto']),
      frasi('quinta-de', 'Il cane di Tom', 'cane', ['de']),
      parole('quinta-cambian', 'I verbi che cambiano', 'clessidra', 'verbos',
        ['querer', 'poder', 'jugar', 'dormir', 'hacer', 'ver', 'venir', 'salir', 'pedir']),
      frasi('quinta-quiero', 'Voglio, posso', 'clessidra', ['quiero-puedo']),
      bandiera('quinta-bandera'),
    ],
  },
  {
    id: 'sesta', anno: 6, nome: 'La città tra le nuvole', disegno: 'clessidra', paesaggio: 'nuvole',
    insegna: 'ayer estuve, fui, jugué, dijo, cuando, mientras, más alto que, voy a jugar',
    dopo: ['quinta'], categorie: [],
    strutture: ['ayer', 'pasado-irr', 'pasado-reg', 'decir', 'cuando', 'voy-a', 'comparativos'],
    tappe: [
      frasi('sesta-ayer', 'Ieri ero al parco', 'casetta', ['ayer']),
      parole('sesta-fuera', 'Fuori città', 'bicicletta', 'lugares',
        ['castillo', 'puente', 'aeropuerto', 'ciudad', 'pueblo', 'carretera', 'iglesia', 'mercado',
         'restaurante', 'granja']),
      parole('sesta-verbos', 'Che cosa è successo', 'clessidra', 'verbos',
        ['dar', 'tomar', 'lanzar', 'atrapar', 'encontrar', 'comprar', 'llevar', 'ganar', 'decir']),
      frasi('sesta-fui', 'Sono andato al castello', 'clessidra', ['pasado-irr']),
      frasi('sesta-jugue', 'Ho giocato', 'palla', ['pasado-reg']),
      parole('sesta-hablar', 'Chi parla, chi ride', 'coppia', 'verbos',
        ['preguntar', 'responder', 'hablar', 'reír', 'llorar', 'sonreír', 'contar', 'saber']),
      frasi('sesta-dijo', 'Ha detto ciao', 'coppia', ['decir']),
      frasi('sesta-cuando', 'Quando fa freddo', 'sole', ['cuando']),
      parole('sesta-adjetivos', 'Alto e veloce', 'faccia', 'adjetivos',
        ['rápido', 'lento', 'joven', 'difícil', 'fácil', 'gracioso', 'limpio', 'sucio', 'amable', 'valiente']),
      frasi('sesta-mas', 'Chi è più alto?', 'faccia', ['comparativos']),
      frasi('sesta-voy-a', 'Domani andrò', 'bicicletta', ['voy-a']),
      bandiera('sesta-bandera'),
    ],
  },
].map(m => (m.tappe.length ? portate(m) : m))

export const mondoDi = id => MONDI.find(m => m.id === id) || null
export const pronto = m => m.tappe.length > 0
export const TAPPE = MONDI.flatMap(m => m.tappe.map(x => ({ ...x, mondo: m.id })))
export const tappaDi = id => TAPPE.find(x => x.id === id) || null
// tre specie di tappa: di parole, di frasi, la 🏁
export const specieDi = t => (t.bandiera ? 'bandiera' : t.frasi ? 'frasi' : 'parole')

// Il dato si controlla da solo: un riferimento sbagliato è rosso in
// test/unita/spagnolo-mondi, non una mappa bianca su un telefono.
export function guastiDeiMondi() {
  const g = []
  const inWords = new Map(WORDS.map(w => [w[0], w[3]]))
  const inVerbi = new Set(VERBI.map(v => v[0]))
  const ids = new Set()
  const categorie = new Map()
  const inTappa = new Map()
  for (const m of MONDI) {
    if (ids.has(m.id)) g.push(`mondo doppio: ${m.id}`)
    ids.add(m.id)
    for (const c of m.categorie) {
      if (categorie.has(c)) g.push(`categoria ${c} in due mondi: ${categorie.get(c)} e ${m.id}`)
      categorie.set(c, m.id)
    }
    for (const f of m.strutture || []) if (!FORME[f]) g.push(`${m.id}: struttura sconosciuta ${f}`)
  }
  let annoPrima = 0
  for (const m of MONDI) {
    for (const d of [...m.dopo, ...(m.dopoUno || [])])
      if (!ids.has(d)) g.push(`${m.id}: dipende da un mondo che non c'è (${d})`)
    if (!pronto(m)) continue
    if (!(m.anno >= 1 && m.anno <= 6)) g.push(`${m.id}: senza anno di scuola (1–5, 6 la prima media)`)
    if (m.anno < annoPrima) g.push(`${m.id}: l'anno ${m.anno} viene dopo l'anno ${annoPrima}`)
    annoPrima = m.anno
    const ultima = m.tappe[m.tappe.length - 1]
    if (!ultima.bandiera) g.push(`${m.id}: l'ultima tappa non è la 🏁`)
    let giaFrasi = false
    for (const x of m.tappe) {
      if (ids.has(x.id)) g.push(`id doppio: ${x.id}`)
      ids.add(x.id)
      if (typeof x.portata !== 'number') g.push(`${x.id}: senza portata`)
      else if (x.portata < inizioDellAnno(m.anno) || x.portata >= inizioDellAnno(m.anno + 1))
        g.push(`${x.id}: portata ${x.portata} fuori dal suo anno (${m.anno})`)
      if (x.bandiera) {
        if (x !== ultima) g.push(`${x.id}: la 🏁 sta in mezzo al mondo`)
        continue
      }
      if (x.frasi) {
        giaFrasi = true
        if (!x.forme.length) g.push(`${x.id}: una tappa di frasi senza struttura`)
        for (const f of x.forme) if (!FORME[f]) g.push(`${x.id}: forma sconosciuta ${f}`)
        if (x.parole.length) g.push(`${x.id}: una tappa di frasi non porta parole nuove`)
        continue
      }
      // una tappa di parole: 8–10 parole, un argomento solo
      const arg = ARGOMENTI[x.argomento]
      if (!arg) { g.push(`${x.id}: argomento sconosciuto ${x.argomento}`); continue }
      if (x.parole.length < 8 || x.parole.length > 10)
        g.push(`${x.id}: ${x.parole.length} parole nuove (ne vanno 8–10)`)
      const dellArgomento = new Set(paroleDellArgomento(x.argomento))
      for (const p of x.parole) {
        if (arg.verbi ? !inVerbi.has(p) : !inWords.has(p))
          g.push(`${x.id}: «${p}» non è in data/${arg.verbi ? 'verbi' : 'words'}.js`)
        if (!dellArgomento.has(p)) g.push(`${x.id}: «${p}» non è ${arg.nome}`)
        const k = (arg.verbi ? 'verbo-es:' : 'es:') + p
        if (inTappa.has(k)) g.push(`«${p}» in due tappe: ${inTappa.get(k)} e ${x.id}`)
        inTappa.set(k, x.id)
      }
    }
    // un mondo che ha le frasi ha anche il suo libro; chi non le ha ancora dichiara le strutture
    if (!giaFrasi && !(m.strutture || []).length) g.push(`${m.id}: né tappe di frasi né strutture dichiarate`)
  }
  // ogni categoria (tranne quelle di struttura) ha un mondo: nessuna parola resta fuori
  for (const c of new Set(WORDS.map(w => w[3])))
    if (!categorie.has(c) && !CATEGORIE_DI_STRUTTURA.includes(c))
      g.push(`la categoria ${c} non ha un mondo: le sue parole non starebbero da nessuna parte`)
  if (!MONDI.some(m => m.verbi) && VERBI.length) g.push('nessun mondo tiene i verbi nel cassetto')
  // niente cicli nelle dipendenze
  const visita = (id, pila = []) => {
    if (pila.includes(id)) { g.push(`ciclo: ${[...pila, id].join(' → ')}`); return }
    const m = mondoDi(id)
    if (m) for (const d of [...m.dopo, ...(m.dopoUno || [])]) visita(d, [...pila, id])
  }
  for (const m of MONDI) visita(m.id)
  return g
}
