// Che cos'è una parola spagnola: nome (col suo genere), aggettivo, colore,
// numero, pronome, determinante, verbo… quanto basta alle trappole e alla
// grammatica per far concordare le cose. Più plurali, femminili, la chiave
// SRS di una parola a schermo e la traduzione di una parola toccata.
// Vedi docs/lingue/spagnolo-motore.md.
import { PAROLE_ES as WORDS } from '../../../data/parole-es.js'
import { VERBI_ES as VERBI } from '../../../data/verbi-es.js'
import { GLOSSARIO } from '../dati/glossario.js'
import { PERSONAGGI } from '../dati/elenchi.js'
import { GENERI, GENERE_COMUNE, A_TONICA, ALTRI_NOMI } from '../dati/generi.js'
import { flesse, VERBI_DI_STRUTTURA } from './flessioni.js'

const low = s => String(s).toLowerCase()
const CAT = new Map(WORDS.map(w => [low(w[0]), w[3]]))
const IT = new Map(WORDS.map(w => [low(w[0]), w[1]]))
const SCRITTA = new Map(WORDS.map(w => [low(w[0]), w[0]]))
const VERBO = new Map(VERBI.map(v => [v[0], v[1]]))

export const PRONOMI = new Set(['yo', 'tú', 'él', 'ella', 'nosotros', 'nosotras', 'ellos', 'ellas', 'usted',
                                'ustedes'])
export const GENERE_DEL_PRONOME = { él: 'm', ella: 'f', nosotros: 'm', nosotras: 'f', ellos: 'm', ellas: 'f' }
// i pronomi attaccati al verbo che stanno prima: me levanto, te llamas, se lava, me gusta
export const CLITICI = new Set(['me', 'te', 'se', 'nos', 'le', 'les', 'lo'])
export const NOMI_PROPRI = new Set(PERSONAGGI.map(p => low(p.nome)))
export const genereDelNome = w => {
  const p = PERSONAGGI.find(x => low(x.nome) === low(w))
  return p ? (p.lei ? 'f' : 'm') : null
}

/* ═══════════ i determinanti ═══════════
   Ogni famiglia in fila: maschile, femminile, maschile plurale, femminile
   plurale. mi, tu, su non cambiano col genere. */
export const FAMIGLIE = [
  ['un', 'una', 'unos', 'unas'], ['el', 'la', 'los', 'las'], ['al', 'a la', 'a los', 'a las'],
  ['del', 'de la', 'de los', 'de las'], ['este', 'esta', 'estos', 'estas'], ['ese', 'esa', 'esos', 'esas'],
  ['aquel', 'aquella', 'aquellos', 'aquellas'], ['nuestro', 'nuestra', 'nuestros', 'nuestras'],
  ['mi', 'mi', 'mis', 'mis'], ['tu', 'tu', 'tus', 'tus'], ['su', 'su', 'sus', 'sus'],
  ['mucho', 'mucha', 'muchos', 'muchas'], ['poco', 'poca', 'pocos', 'pocas'],
  ['algún', 'alguna', 'algunos', 'algunas'], ['ningún', 'ninguna', 'ningunos', 'ningunas'],
  ['otro', 'otra', 'otros', 'otras'], ['cuánto', 'cuánta', 'cuántos', 'cuántas'],
]
// davanti a un femminile con la «a» accentata: el agua, un agua, del agua
const CON_A_TONICA = new Set(['un', 'el', 'al', 'del', 'algún', 'ningún'])
const DI_FAMIGLIA = new Map()
for (const f of FAMIGLIE) f.forEach((w, i) => {
  if (/\s/.test(w) || DI_FAMIGLIA.has(w)) return
  DI_FAMIGLIA.set(w, { famiglia: f, genere: f[0] === f[1] ? null : i % 2 ? 'f' : 'm', plurale: i >= 2 })
})
export const DET = new Set(DI_FAMIGLIA.keys())
export const DIMOSTRATIVI = new Set(['este', 'esta', 'estos', 'estas', 'ese', 'esa', 'esos', 'esas'])
// { genere (null: va con tutti e due), plurale } di un determinante, o null
export const determinante = w => {
  const d = DI_FAMIGLIA.get(low(w))
  return d ? { genere: d.genere, plurale: d.plurale } : null
}
// lo stesso determinante accordato con un nome: (el, 'f', false, 'casa') → la; el agua
export function accordaDet(w, genere, plurale, nome = '') {
  const d = DI_FAMIGLIA.get(low(w))
  if (!d) return w
  const f = d.famiglia
  if (!plurale && genere === 'f' && A_TONICA.has(low(nome)) && CON_A_TONICA.has(f[0])) return f[0]
  return f[(plurale ? 2 : 0) + (genere === 'f' ? 1 : 0)]
}

/* ═══════════ i nomi ═══════════ */
const CAT_NOMI = new Set(['a', 'f', 'h', 's', 't', 'b', 'w', 'p', 'g', 'k', 'd', 'y', 'e', 'm'])
// in quelle categorie, le parole che non sono nomi
const NON_NOMI = new Set(['hoy', 'mañana', 'ayer', 'temprano', 'tarde', 'barato', 'caro'])
export const AVVERBI_DI_TEMPO = new Set(['hoy', 'mañana', 'ayer', 'temprano', 'tarde', 'anoche', 'ahora', 'luego',
                                         'pronto', 'siempre', 'nunca', 'después', 'antes'])
// le cose già al plurale, e quelle uguali al singolare e al plurale (el lunes, los lunes)
export const GIA_PLURALI = new Set(['uvas', 'fideos', 'lentes', 'tijeras', 'cartas', 'pinturas', 'palomitas',
                                    'vacaciones', 'papas fritas'])
export const INVARIABILI = new Set(['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'paraguas', 'cumpleaños',
                                    'rompecabezas', 'tenis', 'arcoíris'])
export const SEMPRE_UGUALI = INVARIABILI
// Le cose che non si contano: niente un/una e niente numeri (la leche, mucha
// agua). «Un pan», «un jugo», «un café» invece si dicono: non stanno qui.
export const NON_CONTABILI = new Set(['leche', 'agua', 'arroz', 'sal', 'miel', 'mantequilla', 'música', 'dinero',
  'gente', 'aire', 'lluvia', 'nieve', 'niebla', 'pasto', 'carne', 'natación', 'básquet', 'tenis', 'pegamento',
  'hambre', 'sed', 'calor', 'frío', 'sueño', 'miedo'])

// la parola senza l'articolo con cui sta nei dati: la mañana → mañana
export const nudo = s => String(s).replace(/^(el|la|los|las) /i, '')

// Il genere di un nome: 'm', 'f' o null se né la tabella né la regola lo sanno.
export function generoDe(parola) {
  const p = low(parola).trim()
  if (GENERI[p]) return GENERI[p]
  if (GENERE_COMUNE.has(p)) return 'm'
  const art = p.match(/^(el|la|los|las) (.+)$/)
  if (art) return art[1] === 'la' || art[1] === 'las' || A_TONICA.has(art[2]) ? 'f' : 'm'
  if (/\s/.test(p)) return generoDe(p.split(' ')[0])          // pavo real, fin de semana
  if (/(ción|sión|xión|dad|tad|tud|umbre)$/.test(p)) return 'f'
  if (/a$/.test(p)) return 'f'
  if (/o$/.test(p)) return 'm'
  if (/(aje|or|ón|ín|án|én|és|[lrntjkbyx]|ch|[áéó])$/.test(p)) return 'm'
  if (/d$/.test(p)) return 'f'
  return null
}
export const eGenereComune = w => GENERE_COMUNE.has(low(nudo(w)))
export const conATonica = w => A_TONICA.has(low(nudo(w)))

/* ═══════════ plurali e femminili ═══════════ */
const VOCALI = 'aeiouáéíóúü'
const ACCENTO = { á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u' }
const METTI = { a: 'á', e: 'é', i: 'í', o: 'ó', u: 'ú' }
const gruppi = p => [...p.matchAll(/[aeiouáéíóúü]+/g)]
const sillabe = p => gruppi(p).length
// ratón → raton(es), canción → cancion(es): l'accento in fondo si toglie, se
// non tiene separate due vocali (país → países)
function togliAccentoFinale(p) {
  const m = p.match(/([áéíóú])([^aeiouáéíóúü]*)$/)
  if (!m || (/[íú]/.test(m[1]) && /[aeiou]/.test(p[m.index - 1] || ''))) return p
  return p.slice(0, m.index) + ACCENTO[m[1]] + m[2]
}
// joven → jóven(es): la sillaba che si sentiva resta, e adesso vuole l'accento
function mettiAccento(p) {
  const g = gruppi(p)
  if (g.length < 2) return p
  const x = g[g.length - 2]
  const k = /[aeo]/.exec(x[0])
  const i = x.index + (k ? k.index : x[0].length - 1)
  return p.slice(0, i) + (METTI[p[i]] || p[i]) + p.slice(i + 1)
}
function pluraleDiParola(p) {
  if (/[aeiouáéóíú]$/.test(p)) return p + 's'
  if (/z$/.test(p)) return p.slice(0, -1) + 'ces'
  if (/[sx]$/.test(p)) {
    if (sillabe(p) === 1) return p + 'es'                         // mes → meses
    if (/[áéíóú][^aeiouáéíóúü]*$/.test(p)) return togliAccentoFinale(p) + 'es'   // autobús → autobuses
    return p                                                       // lunes, paraguas
  }
  if (/[áéíóú]n$/.test(p)) return togliAccentoFinale(p) + 'es'    // ratón → ratones
  if (/n$/.test(p) && !/[áéíóú]/.test(p) && sillabe(p) >= 2) return mettiAccento(p) + 'es'   // joven → jóvenes
  return p + 'es'                                                  // papel → papeles, rey → reyes
}
// Il plurale di un nome o di un aggettivo: perro → perros, lápiz → lápices,
// ratón → ratones, lunes → lunes, la noche → las noches, fin de semana →
// fines de semana, pavo real → pavos reales.
export function plurale(s) {
  const p = String(s)
  const l = low(p)
  if (GIA_PLURALI.has(l) || INVARIABILI.has(l)) return p
  const art = p.match(/^(el|la) (.+)$/i)
  if (art) return (low(art[1]) === 'el' ? 'los' : 'las') + ' ' + plurale(art[2])
  if (/ de /.test(p)) { const [a, ...b] = p.split(' de '); return [plurale(a), ...b].join(' de ') }
  if (/\s/.test(p)) return p.split(' ').map(plurale).join(' ')
  return pluraleDiParola(p)
}
export const plural = plurale

// gli aggettivi che non cambiano col genere anche se la regola direbbe di sì
const SENZA_FEMMINILE = new Set(['marrón', 'naranja', 'rosa', 'violeta', 'mayor', 'menor', 'mejor', 'peor',
                                 'superior', 'inferior', 'exterior', 'interior'])
// Il femminile di un aggettivo: negro → negra, trabajador → trabajadora,
// dormilón → dormilona; grande, verde, azul, feliz, gris non cambiano.
export function femminile(a) {
  const p = String(a)
  if (SENZA_FEMMINILE.has(low(p))) return p
  if (/o$/.test(p)) return p.slice(0, -1) + 'a'
  if (/or$/.test(p)) return p + 'a'
  if (/ón$/.test(p)) return p.slice(0, -2) + 'ona'
  if (/án$/.test(p)) return p.slice(0, -2) + 'ana'
  if (/ín$/.test(p)) return p.slice(0, -2) + 'ina'
  if (/és$/.test(p)) return p.slice(0, -2) + 'esa'
  return p
}
// l'aggettivo `base` (maschile singolare) accordato: (negro, 'f', true) → negras
export function accordaAgg(base, genere, plurali = false) {
  const g = genere === 'f' ? femminile(base) : base
  return plurali ? plurale(g) : g
}

/* ═══════════ le tabelle delle parole ═══════════ */
const ORDINALI = ['primero', 'segundo', 'tercero']
const COLORI = new Set(WORDS.filter(w => w[3] === 'c' && w[0] !== 'color').map(w => low(w[0])))
const AGGETTIVI = [...new Set([...WORDS.filter(w => w[3] === 'j' || (w[3] === 'c' && w[0] !== 'color'))
  .map(w => low(w[0])), 'barato', 'caro', ...ORDINALI])]

// forma a schermo → { base, genere (null se non cambia), plurale }
const AGG = new Map()
for (const base of AGGETTIVI) {
  const f = femminile(base)
  const metti = (w, genere, pl) => { if (!AGG.has(w)) AGG.set(w, { base, genere, plurale: pl }) }
  if (f === base) { metti(base, null, false); metti(plurale(base), null, true); continue }
  metti(base, 'm', false); metti(f, 'f', false); metti(plurale(base), 'm', true); metti(plurale(f), 'f', true)
}
// buen día, mal tiempo, gran casa, el primer día: davanti a un nome si accorciano
for (const [corta, base, genere] of [['buen', 'bueno', 'm'], ['mal', 'malo', 'm'], ['gran', 'grande', null],
                                      ['primer', 'primero', 'm'], ['tercer', 'tercero', 'm']])
  AGG.set(corta, { base, genere, plurale: false, corta: true })
export const ACCORCIATI = { bueno: 'buen', malo: 'mal', primero: 'primer', tercero: 'tercer' }

// forma a schermo (senza articolo) → la voce di parole-es (o la parola, se è un nome di struttura)
const NOMI = new Map()
const PLURALI = new Map()
for (const w of WORDS) {
  const k = low(w[0])
  if (!(CAT_NOMI.has(w[3]) || k === 'color') || NON_NOMI.has(k)) continue
  const n = low(nudo(w[0]))
  if (!NOMI.has(n)) NOMI.set(n, w[0])
}
// il singolare delle cose che nei dati sono già plurali: una uva, un fideo
const SINGOLARI_DEI_PLURALI = new Map(Object.entries({ uva: 'uvas', fideo: 'fideos', lente: 'lentes',
  tijera: 'tijeras', palomita: 'palomitas', pintura: 'pinturas', vacación: 'vacaciones', 'papa frita': 'papas fritas' })
  .filter(([s, p]) => CAT.has(p) && !CAT.has(s)))
for (const n of ALTRI_NOMI) if (!NOMI.has(n)) NOMI.set(n, n)
for (const [n, voce] of NOMI) if (!GIA_PLURALI.has(n) && !INVARIABILI.has(n)) {
  const p = plurale(n)
  if (p !== n && !PLURALI.has(p) && !NOMI.has(p)) PLURALI.set(p, voce)
}
// pavo real, fin de semana: un pezzo toccato da solo dice la voce intera
const COMPONENTI = new Map()
for (const w of WORDS) {
  if (!/\s/.test(w[0]) || w[3] === 'q' || /^(el|la) /.test(w[0])) continue
  for (const x of low(w[0]).split(' '))
    if (x !== 'de' && !CAT.has(x) && !NOMI.has(x) && !PLURALI.has(x) && !AGG.has(x) && !GLOSSARIO[x])
      COMPONENTI.set(x, w[0])
}

export const aggettivoDi = w => AGG.get(low(w)) || null
export const eColore = w => { const a = aggettivoDi(w); return !!a && COLORI.has(a.base) }
export const eAggettivo = w => !!aggettivoDi(w)
export const eNumero = w => CAT.get(low(w)) === 'n'
export const eCardinale = w => eNumero(w) && !ORDINALI.includes(low(w))
export const eVerbo = w => VERBO.has(low(w))
export const itDelVerbo = w => VERBO.get(low(w)) || null
export const inParole = w => CAT.has(low(w))

// { base (la voce di parole-es), plurale, genere } se `w` è un nome o il plurale di un nome
export function nomeDi(w) {
  const l = low(w)
  const con = (base, pl) => ({ base, plurale: pl, genere: generoDe(base) })
  if (NOMI.has(l)) return con(NOMI.get(l), GIA_PLURALI.has(l))
  if (PLURALI.has(l)) return con(PLURALI.get(l), true)
  if (SINGOLARI_DEI_PLURALI.has(l)) return con(SINGOLARI_DEI_PLURALI.get(l), false)
  return null
}
export const eNome = w => !!nomeDi(w) || NOMI_PROPRI.has(low(w))
export const eContabile = w => { const n = low(nudo(w)); return !NON_CONTABILI.has(n) && !GIA_PLURALI.has(n) }

// la chiave SRS di una parola a schermo: 'es:perro' anche per «perros»,
// 'es:rojo' per «rojas», 'verbo-es:jugar' per «juegas», «jugué», «jugando»
export function chiaveDi(parola) {
  const w = low(parola)
  if (CAT.has(w) && CAT.get(w) !== 'q') return 'es:' + SCRITTA.get(w)
  const n = nomeDi(w)
  if (n && CAT.has(low(n.base))) return 'es:' + SCRITTA.get(low(n.base))
  const a = aggettivoDi(w)
  if (a && CAT.has(a.base)) return 'es:' + SCRITTA.get(a.base)
  if (VERBO.has(w)) return 'verbo-es:' + w
  const f = flesse(w).find(x => VERBO.has(x.base))
  if (f) return 'verbo-es:' + f.base
  if (COMPONENTI.has(w)) return 'es:' + COMPONENTI.get(w)
  return null
}

const PERSONA_IT = { yo: 'io', tú: 'tu', él: 'lui/lei', nosotros: 'noi', ellos: 'loro' }
const COME_E = { pres: p => ` (${PERSONA_IT[p]})`, ger: () => ' (adesso)', ind: () => ' (al passato)' }
const itDellaBase = b => VERBO.get(b) || VERBI_DI_STRUTTURA[b] || null
// «juega» → giocare (lui/lei); «fui» → andare / essere (al passato)
function descriviFlessa(fs) {
  const basi = [...new Set(fs.map(f => itDellaBase(f.base)).filter(Boolean))]
  return basi.length ? basi.join(' / ') + COME_E[fs[0].come](fs[0].persona) : null
}

// Cosa vuol dire una parola toccata. `chiave` è null per le parole di
// struttura e per i nomi dei personaggi: quelle non hanno SRS.
export function traduci(parola) {
  const w = low(parola)
  if (NOMI_PROPRI.has(w)) return { parola, chiave: null, it: 'è un nome' }
  const chiave = chiaveDi(w)
  const fs = flesse(w).filter(f => itDellaBase(f.base))
  if (chiave && chiave.startsWith('es:')) {
    const it = IT.get(low(chiave.slice(3)))
    // «cocina» è la cucina e anche «cucina» (lui/lei): si dicono tutti e due
    return { parola, chiave, it: fs.length && !COMPONENTI.has(w) ? `${it} / ${descriviFlessa(fs)}` : it }
  }
  // «como» è anche «come»: la parola di struttura e il verbo, tutti e due
  if (chiave) return { parola, chiave, it: VERBO.has(w) ? VERBO.get(w)
    : [GLOSSARIO[w], descriviFlessa(fs)].filter(Boolean).join(' / ') }
  if (GLOSSARIO[w]) return { parola, chiave: null, it: GLOSSARIO[w] }
  if (fs.length) return { parola, chiave: null, it: descriviFlessa(fs) }
  if (IT.has(w)) return { parola, chiave: null, it: IT.get(w) }
  return { parola, chiave: null, it: null }
}
