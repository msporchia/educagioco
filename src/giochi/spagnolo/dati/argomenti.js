// Gli argomenti delle tappe di parole: «I colori» sono solo colori. Un
// argomento dice quali parole gli appartengono (per categoria di
// data/parole-es.js, o elencate), e le risposte sbagliate di una domanda su una
// parola vengono da lì — mai da tutta la lingua. `vicini`: gli argomenti da
// cui si prende in prestito quando le parole sono poche. `verbi: true`: le
// parole sono di data/verbi-es.js (chiave `verbo-es:`). `figure: false`: niente
// domande con le figure, dove il disegno non ha un significato solo (vedi
// docs/lingue/mondi.md).
import { PAROLE_ES as WORDS } from '../../../data/parole-es.js'
import { VERBI_ES as VERBI } from '../../../data/verbi-es.js'

export const ARGOMENTI = {
  colores: { nome: 'i colori', cat: ['c'] },
  numeros: { nome: 'i numeri', cat: ['n'] },
  animales: { nome: 'gli animali', cat: ['a'] },
  escuela: { nome: 'la scuola', cat: ['s'] },
  juguetes: { nome: 'i giocattoli',
    parole: ['pelota', 'muñeca', 'peluche', 'cometa', 'rompecabezas', 'juego', 'auto', 'tren', 'avión', 'bote',
             'patín', 'tambor', 'guitarra', 'dado', 'cartas'],
    vicini: ['deportes'] },
  deportes: { nome: 'lo sport e la musica', cat: ['g'] },
  cuerpo: { nome: 'il corpo', cat: ['b'] },
  familia: { nome: 'la famiglia e gli amici',
    parole: ['mamá', 'papá', 'hermana', 'hermano', 'abuela', 'abuelo', 'bebé', 'amigo', 'familia', 'tía', 'tío',
             'primo', 'hombre', 'mujer', 'chico', 'chica', 'niño'], figure: false },
  comida: { nome: 'il cibo', cat: ['f'] },
  ropa: { nome: 'i vestiti', cat: ['p'] },
  'como-son': { nome: 'come sono le cose', cat: ['j'], figure: false },
  estados: { nome: 'come stai', cat: ['j'], figure: false },
  adjetivos: { nome: 'come sono le cose', cat: ['j'], figure: false },
  casa: { nome: 'la casa', cat: ['h'], parole: ['jardín'] },
  calendario: { nome: 'il calendario',
    parole: ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo', 'hoy', 'mañana', 'ayer',
             'fin de semana', 'primavera', 'verano', 'otoño', 'invierno', 'cumpleaños', 'vacaciones', 'enero',
             'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre',
             'noviembre', 'diciembre'] },
  tiempo: { nome: 'il tempo che fa', cat: ['w'] },
  dia: { nome: 'la giornata',
    parole: ['la mañana', 'la tarde', 'el atardecer', 'la noche', 'el día', 'desayuno', 'almuerzo', 'cena',
             'hora', 'minuto', 'tiempo', 'semana', 'mes', 'año', 'temprano', 'tarde'],
    vicini: ['calendario'], figure: false },
  oficios: { nome: 'i mestieri',
    parole: ['maestra', 'doctor', 'agricultor', 'cocinero', 'policía', 'bombero', 'piloto', 'enfermera',
             'cantante', 'rey', 'reina'], figure: false },
  transportes: { nome: 'i mezzi', cat: ['t'] },
  lugares: { nome: 'i luoghi', cat: ['y'], figure: false },
  calle: { nome: 'la strada', parole: ['calle', 'esquina', 'plaza', 'semáforo', 'parada', 'estacionamiento',
                                      'cruce', 'rotonda', 'vereda', 'letrero'], vicini: ['lugares'] },
  verbos: { nome: 'le azioni', verbi: true },
  rutina: { nome: 'la routine', verbi: true },
  fiestas: { nome: 'le feste', cat: ['e'], parole: ['Navidad'] },
  dinero: { nome: 'i soldi', cat: ['m'], vicini: ['lugares'] },
}

const CAT = new Map(WORDS.map(w => [w[0], w[3]]))
const IN_VERBI = new Set(VERBI.map(v => v[0]))

// le parole di un argomento, come stanno in words.js (o in verbi.js)
export function paroleDellArgomento(id) {
  const a = ARGOMENTI[id]
  if (!a) return []
  if (a.verbi) return VERBI.map(v => v[0])
  const out = WORDS.filter(w => (a.cat || []).includes(w[3])).map(w => w[0])
  for (const p of a.parole || []) if (!out.includes(p)) out.push(p)
  return out
}

// la chiave SRS di una parola di una tappa: dipende dall'argomento
export const chiaveNellArgomento = (id, parola) =>
  (ARGOMENTI[id] && ARGOMENTI[id].verbi ? 'verbo-es:' : 'es:') + parola

export function guastiDegliArgomenti() {
  const g = []
  for (const [id, a] of Object.entries(ARGOMENTI)) {
    if (!a.nome) g.push(`argomento ${id}: senza nome`)
    if (!a.verbi && !(a.cat || []).length && !(a.parole || []).length) g.push(`argomento ${id}: vuoto`)
    for (const p of a.parole || [])
      if (!CAT.has(p)) g.push(`argomento ${id}: «${p}» non è in data/words.js`)
    for (const v of a.vicini || []) if (!ARGOMENTI[v]) g.push(`argomento ${id}: vicino sconosciuto ${v}`)
    if (a.verbi && !IN_VERBI.size) g.push(`argomento ${id}: data/verbi.js è vuoto`)
  }
  return g
}
