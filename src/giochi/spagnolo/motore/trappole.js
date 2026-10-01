// Il generatore delle frasi sbagliate: le operazioni che le righe di
// dati/trappole.js nominano con `fa`. Ogni operazione riceve le parole della
// frase e torna le alternative sbagliate con i buchi del perché. Una
// trappola sbaglia in un punto solo e per un motivo solo: se cambiare una
// parola ne scombina un'altra (el gato → la vaca), il resto si riaccorda.
// Da una scrittura escono tutti i formati: le opzioni di «scegli»,
// l'italiano di «cosa vuol dire», le tessere in più di «componi».
// Vedi docs/lingue/spagnolo-motore.md.
import { TRAPPOLE } from '../dati/trappole.js'
import { MAX_S } from '../../../store/srs.js'
import { PAROLE_ES as WORDS } from '../../../data/parole-es.js'
import { CON_DITTONGO, IRREGOLARI } from '../dati/irregolari.js'
import { PRONOMI, CLITICI, NOMI_PROPRI, DET, DIMOSTRATIVI, determinante, accordaDet, accordaAgg, aggettivoDi, nomeDi, eNumero,
         eCardinale, eColore, NON_CONTABILI, GIA_PLURALI, INVARIABILI, plurale, nudo, generoDe, genereDelNome,
         GENERE_DEL_PRONOME, itDelVerbo, eGenereComune, conATonica, ACCORCIATI, eVerbo } from './lessico.js'
import { gruppoDi } from './grafo.js'
import { mondoDi } from '../dati/mondi.js'
import { parole, normalizza, accettate, eDomanda } from './testo.js'
import { flesse, flessione, regolare, classe, eRiflessivo, PERSONE, PERSONA_DI, VERBI_DI_STRUTTURA }
  from './flessioni.js'
import { eCopula, nomeDopo, soloAggettivo } from './grammatica.js'

const low = w => (w == null ? null : String(w).toLowerCase())
const IT = new Map(WORDS.map(w => [low(w[0]), w[1]]))
const SCRITTA = new Map(WORDS.map(w => [low(w[0]), w[0]]))
const scritta = w => SCRITTA.get(low(w)) || w
const GENERE_IT = { m: 'maschile', f: 'femminile' }
// fra il soggetto e il verbo: yo no me levanto, ella siempre canta
const IN_MEZZO = new Set(['no', 'también', 'siempre', 'nunca', 'ya', 'todavía'])
const INTENSITA = new Set(['muy', 'tan', 'más', 'menos', 'bastante'])
const PLURALI_DI_PERSONA = new Set(['nosotros', 'ellos'])
const MESI = new Set(['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre',
                      'octubre', 'noviembre', 'diciembre'])
const GIORNI = new Set(['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'])
const LE_ORE = w => eCardinale(w) || w === 'una'

// le forme coniugate (non il gerundio) di un verbo: [{ base, come, persona }]
const coniugato = w => flesse(w).filter(f => f.come !== 'ger')
const gerundio = w => flesse(w).find(f => f.come === 'ger') || null
const eInfinito = w => !!w && (eVerbo(w) || !!VERBI_DI_STRUTTURA[low(w)])
const formeDi = base => w => flesse(w).filter(f => f.base === base)

// Il soggetto che comincia in T[i]: { a (fine esclusa), chi, persona, plurale, genere }
export function soggetto(T, i) {
  const w = low(T[i])
  if (w == null) return null
  if (PRONOMI.has(w)) {
    const persona = PERSONA_DI[w]
    return { a: i + 1, chi: T[i], persona, plurale: PLURALI_DI_PERSONA.has(persona), genere: GENERE_DEL_PRONOME[w] || null }
  }
  let s = null
  if (NOMI_PROPRI.has(w)) s = { a: i + 1, chi: T[i], persona: 'él', plurale: false, genere: genereDelNome(w) }
  else {
    const d = determinante(w)
    const x = d && nomeDopo(T, i + 1)
    if (!x) return null
    let a = x.j + 1
    while (a < T.length && aggettivoDi(T[a]) && !eCopula(T[a])) a++
    const pl = INVARIABILI.has(low(nudo(x.n.base))) ? d.plurale : x.n.plurale
    s = { a, chi: T.slice(i, x.j + 1).join(' '), persona: pl ? 'ellos' : 'él', plurale: pl,
          genere: eGenereComune(x.n.base) ? d.genere : x.n.genere }
  }
  // Laura y Leo, el perro y el gato: due cose sono «ellos»
  if (low(T[s.a]) === 'y') {
    const s2 = soggetto(T, s.a + 1)
    if (s2 && !PRONOMI.has(low(T[s.a + 1])))
      return { a: s2.a, chi: T.slice(i, s2.a).join(' '), persona: 'ellos', plurale: true,
               genere: s.genere === 'f' && s2.genere === 'f' ? 'f' : 'm' }
  }
  return s
}

// il soggetto in testa alla frase, anche dopo hoy, ayer, mañana…
function soggettoInTesta(T) {
  for (let i = 0; i < Math.min(2, T.length); i++) {
    const s = soggetto(T, i)
    if (s) return s
    if (!['hoy', 'ayer', 'mañana', 'ahora', 'anoche'].includes(low(T[i]))) return null
  }
  return null
}

// dal posto `k` salta no, siempre e i pronomi attaccati: il primo verbo coniugato, o -1
function verboDa(T, k) {
  while (k < T.length && (IN_MEZZO.has(low(T[k])) || (CLITICI.has(low(T[k])) && coniugato(T[k + 1]).length))) k++
  return k < T.length && coniugato(T[k]).length ? k : -1
}

const alt = (T, dati = {}, it = null) => ({ T: T.filter(x => x !== null && x !== ''), dati, it })
const trova = (T, prova, da = 0) => { for (let i = da; i < T.length; i++) if (prova(low(T[i]), i)) return i; return -1 }
const metti = (T, i, w) => { const U = T.slice(); U[i] = w; return U }

function sostituisciIt(it, coppie) {
  for (const [a, b] of coppie) {
    for (const [da, per] of [[a, b], [b, a]]) {
      const re = new RegExp(`(^|[\\s’'])${da}(?=$|[\\s?.,])`)
      if (re.test(it)) return it.replace(re, (_, p) => p + per)
    }
  }
  return null
}

/* Riaccorda quello che dipende dal nome in U[i] (appena cambiato): gli
   aggettivi dopo, il predicato se il nome è il soggetto in testa (la vaca es
   negra → el perro es negro), gli aggettivi e il determinante davanti (a la
   → al). Torna una fila nuova. */
function riaccorda(U0, i, genere, pl) {
  const U = U0.slice()
  for (let k = i + 1; k < U.length; k++) {
    if (low(U[k]) === 'y' && aggettivoDi(U[k + 1] || '') && !nomeDi(U[k + 1])) continue
    const a = aggettivoDi(U[k])
    if (!a || (nomeDi(U[k]) && k > i + 1)) break
    U[k] = accordaAgg(a.base, genere, pl)
  }
  const s = soggetto(U, 0)
  if (s && i < s.a) riaccordaPredicato(U, genere, pl)
  // esta es mi regla → este es mi libro: il dimostrativo da solo va col nome dopo es
  if (DIMOSTRATIVI.has(low(U[0])) && eCopula(U[1] || '') && i >= 2 &&
      U.slice(2, i).every(w => determinante(w) || eNumero(w) || aggettivoDi(w)))
    U[0] = accordaDet(U[0], genere, pl)
  let k = i - 1
  while (k >= 0 && !determinante(U[k]) && (eNumero(U[k]) || aggettivoDi(U[k]))) {
    const a = aggettivoDi(U[k])
    if (a && !(a.corta && genere === 'm' && !pl)) U[k] = accordaAgg(a.base, genere, pl)
    k--
  }
  if (k < 0 || !determinante(U[k])) return U
  const d = accordaDet(U[k], genere, pl, nudo(U[i]))
  const prima = low(U[k - 1])
  if (d === 'el' && (prima === 'a' || prima === 'de')) { U.splice(k - 1, 2, prima === 'a' ? 'al' : 'del'); return U }
  U[k] = d
  return U
}
// l'aggettivo del predicato (la vaca es negra) accordato con `genere` e `pl`
function riaccordaPredicato(U, genere, pl) {
  const s = soggetto(U, 0)
  if (!s) return U
  let k = s.a
  while (IN_MEZZO.has(low(U[k]))) k++
  if (!eCopula(U[k] || '')) return U
  k++
  while (INTENSITA.has(low(U[k]))) k++
  const a = aggettivoDi(U[k] || '')
  if (a && !(U[k + 1] && nomeDi(U[k + 1]))) U[k] = accordaAgg(a.base, genere || s.genere || 'm', pl)
  return U
}

// la forma di ser (o di un altro verbo) per la stessa persona e lo stesso tempo di `f`
const comeLei = (base, f) => flessione(base, f.come, f.persona || 'él')

export const OPERAZIONI = {
  /* ── genere e numero ── */
  // es un perro → es una perro; esta es una regla → este es una regla
  scambiaGenere(T, _, { famiglie, pronome = false }) {
    const dellaFamiglia = w => famiglie.some(f => accordaDet(f, 'm', false) === accordaDet(w, 'm', false) &&
                                                 determinante(w))
    for (let i = 0; i < T.length; i++) {
      if (!dellaFamiglia(T[i])) continue
      const d = determinante(T[i])
      const x = nomeDopo(T, i + 1)
      let genere, cosa
      if (x && x.j === i + 1) {
        if (eGenereComune(x.n.base) || conATonica(x.n.base) || !x.n.genere) continue
        genere = x.n.genere; cosa = T[x.j]
      } else if (pronome && eCopula(T[i + 1] || '')) {
        // este es un libro: il dimostrativo da solo va col nome che viene dopo
        const y = nomeDopo(T, i + 3)
        if (!determinante(T[i + 2] || '') || !y || !y.n.genere || eGenereComune(y.n.base)) continue
        genere = y.n.genere; cosa = T[y.j]
      } else continue
      const sbagliato = accordaDet(T[i], genere === 'm' ? 'f' : 'm', d.plurale)
      if (sbagliato === low(T[i])) continue
      // a la → a el sarebbero due sbagli (manca anche al): ci pensa la sua riga
      if (sbagliato === 'el' && ['a', 'de'].includes(low(T[i - 1]))) continue
      return [alt(metti(T, i, sbagliato), { giusto: T[i], sbagliato, cosa, genere: GENERE_IT[genere] })]
    }
    return []
  },
  // el agua → la agua
  elAgua(T) {
    const i = trova(T, (w, k) => ['el', 'un', 'al', 'del'].includes(w) && conATonica(T[k + 1] || ''))
    if (i < 0) return []
    const sbagliato = { el: 'la', un: 'una', al: 'a la', del: 'de la' }[low(T[i])]
    return [alt(metti(T, i, sbagliato), { giusto: T[i], sbagliato, cosa: T[i + 1] })]
  },
  // mis gatos → mi gatos
  scambiaNumeroDet(T, _, { famiglie }) {
    const i = trova(T, (w, k) => famiglie.some(f => accordaDet(f, 'm', false) === accordaDet(w, 'm', false)) &&
                                 !!determinante(w) && !!nomeDi(T[k + 1] || ''))
    if (i < 0) return []
    const d = determinante(T[i])
    const sbagliato = accordaDet(T[i], 'm', !d.plurale)
    return [alt(metti(T, i, sbagliato), { giusto: T[i], sbagliato, cosa: nudo(nomeDi(T[i + 1]).base),
                                          sg: accordaDet(T[i], 'm', false), pl: accordaDet(T[i], 'm', true) })]
  },
  // una vaca negra → una vaca negro; la vaca es negra → la vaca es negro
  aggettivoGenere(T) {
    const prova = (i, k) => {
      const a = soloAggettivo(T[k] || '')
      return a && a.genere && !a.corta ? a : null
    }
    for (let i = 0; i < T.length; i++) {
      const n = nomeDi(T[i])
      if (!n || !n.genere || eGenereComune(n.base)) continue
      const a = prova(i, i + 1)
      if (!a) continue
      const sbagliato = accordaAgg(a.base, a.genere === 'm' ? 'f' : 'm', a.plurale)
      return [alt(metti(T, i + 1, sbagliato), { cosa: T[i], giusto: T[i + 1], sbagliato, genere: GENERE_IT[n.genere] })]
    }
    const s = soggettoInTesta(T)
    if (!s || !s.genere) return []
    let k = s.a
    while (IN_MEZZO.has(low(T[k]))) k++
    if (!eCopula(T[k] || '')) return []
    k++
    while (INTENSITA.has(low(T[k]))) k++
    const a = prova(s.a, k)
    if (!a || (T[k + 1] && nomeDi(T[k + 1]))) return []
    const sbagliato = accordaAgg(a.base, a.genere === 'm' ? 'f' : 'm', a.plurale)
    return [alt(metti(T, k, sbagliato), { cosa: s.chi, giusto: T[k], sbagliato, genere: GENERE_IT[s.genere] })]
  },
  // los gatos negros → los gatos negro
  aggettivoNumero(T) {
    const i = trova(T, (w, k) => { const n = nomeDi(w); return !!n && n.plurale && !GIA_PLURALI.has(w) &&
                                   !!aggettivoDi(T[k + 1] || '') && aggettivoDi(T[k + 1]).plurale })
    if (i < 0) return []
    const a = aggettivoDi(T[i + 1])
    const sbagliato = accordaAgg(a.base, a.genere || 'm', false)
    if (sbagliato === low(T[i + 1])) return []
    return [alt(metti(T, i + 1, sbagliato), { cosa: T[i], giusto: T[i + 1], sbagliato })]
  },
  // un gato negro → un negro gato
  aggettivoPrima(T) {
    const i = trova(T, (w, k) => !!nomeDi(w) && eColore(T[k + 1] || '') && !nomeDi(T[k + 1]))
    if (i < 0) return []
    const U = T.slice(); [U[i], U[i + 1]] = [U[i + 1], U[i]]
    return [alt(U, { agg: T[i + 1], cosa: T[i] })]
  },
  // buenos días → buenas días
  aggettivoDavanti(T, _, { parole: quali }) {
    const i = trova(T, (w, k) => quali.includes(w) && !!nomeDi(T[k + 1] || ''))
    if (i < 0) return []
    const n = nomeDi(T[i + 1]), a = aggettivoDi(T[i])
    if (!n.genere || !a.genere) return []
    const sbagliato = accordaAgg(a.base, a.genere === 'm' ? 'f' : 'm', a.plurale)
    return [alt(metti(T, i, sbagliato), { giusto: T[i], sbagliato, cosa: T[i + 1], genere: GENERE_IT[n.genere] })]
  },
  // dos perros → dos perro, los gatos → los gato
  pluraleMancante(T) {
    for (let i = 0; i < T.length; i++) {
      const d = determinante(T[i])
      if (!((d && d.plurale) || (eCardinale(T[i]) && !['uno', 'un', 'una'].includes(low(T[i]))))) continue
      const x = nomeDopo(T, i + 1)
      if (!x || !x.n.plurale || GIA_PLURALI.has(low(T[x.j])) || INVARIABILI.has(low(T[x.j]))) continue
      const base = nudo(x.n.base)
      if (low(base) === low(T[x.j])) continue
      return [alt(metti(T, x.j, base), { prima: T[i], cosa: base, giusto: T[x.j] })]
    }
    return []
  },
  // es un gato → es un gatos
  pluraleInPiu(T) {
    for (let i = 0; i < T.length; i++) {
      const d = determinante(T[i])
      if (!d || d.plurale || !nomeDi(T[i + 1] || '')) continue
      const n = nomeDi(T[i + 1])
      const w = low(T[i + 1])
      if (n.plurale || GIA_PLURALI.has(w) || INVARIABILI.has(w) || NON_CONTABILI.has(w)) continue
      const sbagliato = plurale(T[i + 1])
      if (low(sbagliato) === w) continue
      return [alt(metti(T, i + 1, sbagliato), { prima: T[i], giusto: T[i + 1], sbagliato })]
    }
    return []
  },
  // los lápices → los lápizes, los papeles → los papels
  pluraleStorto(T) {
    const i = trova(T, w => { const n = nomeDi(w); return !!n && n.plurale && /es$/.test(w) && !GIA_PLURALI.has(w) &&
                                                       /[^aeiouáéíóú]$/.test(nudo(n.base)) })
    if (i < 0) return []
    const base = nudo(nomeDi(T[i]).base)
    const z = /z$/.test(base)
    const sbagliato = z ? base + 'es' : base + 's'
    return [alt(metti(T, i, sbagliato), { giusto: T[i], sbagliato,
      regola: z ? 'Con la z il plurale fa -ces' : 'Dopo una consonante il plurale vuole -es' })]
  },
  // muchos gatos → mucho gatos, mucha agua → mucho agua
  muchoAccordo(T) {
    const i = trova(T, (w, k) => /^(mucho|mucha|muchos|muchas|poco|poca|pocos|pocas)$/.test(w) && !!nomeDi(T[k + 1] || ''))
    if (i < 0) return []
    const d = determinante(T[i]), n = nomeDi(T[i + 1])
    const sbagliato = n.genere ? accordaDet(T[i], n.genere === 'm' ? 'f' : 'm', d.plurale)
      : accordaDet(T[i], d.genere, !d.plurale)
    if (sbagliato === low(T[i])) return []
    return [alt(metti(T, i, sbagliato), { giusto: T[i], sbagliato, cosa: T[i + 1] })]
  },
  // un poco de leche → un poco leche
  togliDe(T, _, { dopo }) {
    const i = trova(T, (w, k) => w === 'de' && low(T[k - 1]) === dopo)
    if (i < 0) return []
    return [alt(metti(T, i, null), {})]
  },

  /* ── ser, estar, tener, gustar, hay ── */
  // estoy cansado → soy cansado; el gato está en la mesa → el gato es en la mesa
  serAlPostoDiEstar(T) {
    const i = trova(T, (w, k) => {
      const f = formeDi('estar')(w).find(x => x.come !== 'ger')
      if (!f || /\s/.test(w)) return false
      let j = k + 1
      while (INTENSITA.has(low(T[j]))) j++
      const dopo = low(T[j])
      if (!dopo) return low(T[k - 1]) === 'dónde'
      if (gerundio(dopo)) return false
      return ['en', 'sobre', 'debajo', 'detrás', 'cerca', 'aquí', 'allí', 'bien', 'mal', 'al'].includes(dopo) ||
        (!!aggettivoDi(dopo) && !nomeDi(T[j + 1] || '')) || low(T[k - 1]) === 'dónde'
    })
    if (i < 0) return []
    const f = formeDi('estar')(T[i]).find(x => x.come !== 'ger')
    const sbagliato = comeLei('ser', f)
    return [alt(metti(T, i, sbagliato), { giusto: T[i], sbagliato })]
  },
  // es un perro → está un perro; soy Leo → estoy Leo
  estarAlPostoDiSer(T) {
    const i = trova(T, (w, k) => {
      if (!formeDi('ser')(w).some(x => x.come === 'pres') || formeDi('ir')(w).length) return false
      const dopo = low(T[k + 1])
      return ['un', 'una'].includes(dopo) || NOMI_PROPRI.has(dopo) || (!!nomeDi(dopo || '') && !aggettivoDi(dopo))
    })
    if (i < 0) return []
    const f = formeDi('ser')(T[i]).find(x => x.come === 'pres')
    const sbagliato = comeLei('estar', f)
    return [alt(metti(T, i, sbagliato), { giusto: T[i], sbagliato })]
  },
  // tengo hambre → soy hambre; tengo siete años → soy siete años
  tenerSer(T) {
    const COSE = new Set(['hambre', 'sed', 'frío', 'calor', 'sueño', 'miedo', 'años'])
    const i = trova(T, (w, k) => {
      if (!formeDi('tener')(w).some(x => x.come !== 'ger')) return false
      let j = k + 1
      while (j < T.length && (/^(mucho|mucha|muy)$/.test(low(T[j])) || eCardinale(T[j]))) j++
      return COSE.has(low(T[j])) || low(T[k - 1]) === 'años'
    })
    if (i < 0) return []
    const f = formeDi('tener')(T[i]).find(x => x.come !== 'ger')
    const sbagliato = comeLei('ser', f)
    return [alt(metti(T, i, sbagliato), { giusto: T[i], sbagliato })]
  },
  // tengo un perro → he un perro: «ho» all'italiana
  tenerHaber(T) {
    const HABER = { yo: 'he', tú: 'has', él: 'ha', nosotros: 'hemos', ellos: 'han' }
    const i = trova(T, w => formeDi('tener')(w).some(f => f.come === 'pres'))
    if (i < 0) return []
    const f = formeDi('tener')(T[i]).find(x => x.come === 'pres')
    return [alt(metti(T, i, HABER[f.persona]), { giusto: T[i], sbagliato: HABER[f.persona] })]
  },
  // me gusta el pan → yo gusto el pan
  gustarIo(T) {
    const CHI = { me: 'yo', te: 'tú', le: 'él', nos: 'nosotros', les: 'ellos' }
    const i = trova(T, (w, k) => !!CHI[w] && ['gusta', 'gustan'].includes(low(T[k + 1])) && low(T[k - 1]) !== 'mí' &&
                                 low(T[k - 2]) !== 'a')
    if (i < 0) return []
    const chi = CHI[low(T[i])]
    const verbo = flessione('gustar', 'pres', PERSONA_DI[chi])
    const no = low(T[i - 1]) === 'no' ? i - 1 : i
    const U = [...T.slice(0, no), chi, ...(no < i ? ['no'] : []), verbo, ...T.slice(i + 2)]
    return [alt(U, { giusto: `${T[i]} ${T[i + 1]}`, sbagliato: `${chi} ${verbo}` })]
  },
  // me gustan las uvas → me gusta las uvas
  gustaGustan(T) {
    const i = trova(T, w => w === 'gusta' || w === 'gustan')
    if (i < 0) return []
    const sbagliato = low(T[i]) === 'gusta' ? 'gustan' : 'gusta'
    return [alt(metti(T, i, sbagliato), { giusto: T[i], sbagliato })]
  },
  // hay un gato en la mesa → es un gato en la mesa
  hayEs(T) {
    const i = trova(T, (w, k) => w === 'hay' && k + 1 < T.length && !/^cuánt/.test(low(T[0])))
    if (i < 0) return []
    const x = nomeDopo(T, determinante(T[i + 1]) ? i + 2 : i + 1)
    const pl = (determinante(T[i + 1]) || {}).plurale || (x && x.n.plurale) || eCardinale(T[i + 1]) &&
      !['uno', 'un'].includes(low(T[i + 1]))
    const sbagliato = pl ? 'son' : 'es'
    return [alt(metti(T, i, sbagliato), { sbagliato })]
  },
  // hay un gato → hay el gato
  hayDeterminato(T) {
    const i = trova(T, (w, k) => ['un', 'una', 'unos', 'unas'].includes(w) && low(T[k - 1]) === 'hay')
    if (i < 0) return []
    const sbagliato = { un: 'el', una: 'la', unos: 'los', unas: 'las' }[low(T[i])]
    return [alt(metti(T, i, sbagliato), { giusto: T[i], sbagliato, cosa: T[i + 1] })]
  },

  /* ── i verbi ── */
  // yo tengo → yo tiene, ella juega → ella juego: il soggetto c'è e il verbo è d'altri
  personaSbagliata(T, _, { verbi = null, tranne = [] }) {
    const s = soggettoInTesta(T)
    if (!s) return []
    const k = verboDa(T, s.a)
    if (k < 0) return []
    const f = coniugato(T[k]).find(x => x.persona === s.persona && (!verbi || verbi.includes(x.base)) &&
                                        !tranne.includes(x.base))
    if (!f) return []
    const ALTRA = { yo: 'él', tú: 'él', él: 'yo', nosotros: 'ellos', ellos: 'él' }
    for (const p of [ALTRA[s.persona], ...PERSONE]) {
      if (p === s.persona) continue
      const sbagliato = flessione(f.base, f.come, p)
      if (sbagliato && low(sbagliato) !== low(T[k]))
        return [alt(metti(T, k, sbagliato), { chi: s.chi, giusto: T[k], sbagliato })]
    }
    return []
  },
  // él come → él coma, nosotros vivimos → nosotros vivemos: le desinenze dell'altra classe
  desinenzaClasse(T) {
    const s = soggettoInTesta(T)
    if (!s || s.persona === 'yo') return []
    const k = verboDa(T, s.a)
    if (k < 0) return []
    const f = coniugato(T[k]).find(x => x.come === 'pres' && x.persona === s.persona && eVerbo(x.base))
    if (!f || flessione(f.base, 'pres', f.persona) !== regolare(f.base, 'pres', f.persona)) return []
    const cl = classe(f.base)
    // comamos, cantemos con nosotros sono un invito («mangiamo!»): una frase giusta, non una trappola
    if (f.persona === 'nosotros' && cl !== 'ir') return []
    const v = f.base.replace(/se$/, '')
    const altra = cl === 'ar' ? 'er' : cl === 'ir' && f.persona === 'nosotros' ? 'er' : 'ar'
    const sbagliato = regolare(v.slice(0, -2) + altra, 'pres', f.persona)
    if (low(sbagliato) === low(T[k])) return []
    return [alt(metti(T, k, sbagliato), { base: f.base, classe: cl, giusto: T[k], sbagliato })]
  },
  // quiero → quero, puedo → podo: la vocale che cambia, dimenticata
  senzaDittongo(T) {
    const i = trova(T, w => coniugato(w).some(f => f.come === 'pres' && CON_DITTONGO.has(f.base.replace(/se$/, '')) &&
                                             regolare(f.base, 'pres', f.persona) !== w))
    if (i < 0) return []
    const f = coniugato(T[i]).find(x => x.come === 'pres' && CON_DITTONGO.has(x.base.replace(/se$/, '')))
    const sbagliato = regolare(f.base, 'pres', f.persona)
    return [alt(metti(T, i, sbagliato), { base: f.base, giusto: T[i], sbagliato })]
  },
  // podemos → puedemos: la vocale che cambia anche dove non cambia
  dittongoInPiu(T) {
    const i = trova(T, w => coniugato(w).some(f => f.come === 'pres' && f.persona === 'nosotros' &&
                                             CON_DITTONGO.has(f.base.replace(/se$/, ''))))
    if (i < 0) return []
    const f = coniugato(T[i]).find(x => x.come === 'pres' && x.persona === 'nosotros')
    const lui = flessione(f.base, 'pres', 'él')
    const sbagliato = lui.slice(0, -1) + low(T[i]).slice(-4)
    if (sbagliato === low(T[i]) || !/(amos|emos|imos)$/.test(sbagliato)) return []
    return [alt(metti(T, i, sbagliato), { base: f.base, giusto: T[i], sbagliato })]
  },
  // quiero nadar → quiero nado: dopo querer e poder il verbo resta com'è
  infinitoConiugato(T, _, { dopo }) {
    const i = trova(T, (w, k) => coniugato(w).some(f => dopo.includes(f.base)) && eInfinito(T[k + 1]))
    if (i < 0) return []
    const f = coniugato(T[i]).find(x => dopo.includes(x.base))
    const sbagliato = flessione(low(T[i + 1]), 'pres', f.persona)
    if (!sbagliato || low(sbagliato) === low(T[i + 1])) return []
    return [alt(metti(T, i + 1, sbagliato), { verbo: T[i], giusto: T[i + 1], sbagliato })]
  },
  // estoy jugando → jugando
  gerundioSenzaEstar(T) {
    const i = trova(T, (w, k) => formeDi('estar')(w).length > 0 && !!gerundio(T[k + 1] || ''))
    if (i < 0) return []
    return [alt(metti(T, i, null), { estar: T[i], ger: T[i + 1] })]
  },
  // estoy jugando → estoy jugar
  gerundioInfinito(T) {
    const i = trova(T, (w, k) => !!gerundio(w) && formeDi('estar')(T[k - 1] || '').length > 0)
    if (i < 0) return []
    const sbagliato = gerundio(T[i]).base.replace(/se$/, '')
    return [alt(metti(T, i, sbagliato), { estar: T[i - 1], giusto: T[i], sbagliato })]
  },
  // comiendo → comando, cantando → cantiendo
  gerundioClasse(T) {
    const i = trova(T, w => { const g = gerundio(w); return !!g && /(ando|iendo)$/.test(w) && eVerbo(g.base) })
    if (i < 0) return []
    const w = low(T[i])
    const sbagliato = /ando$/.test(w) ? w.replace(/ando$/, 'iendo') : w.replace(/iendo$/, 'ando')
    return [alt(metti(T, i, sbagliato), { base: gerundio(w).base, giusto: T[i], sbagliato })]
  },
  // voy a nadar → voy nadar
  togliA(T) {
    const i = trova(T, (w, k) => w === 'a' && coniugato(T[k - 1] || '').some(f => f.base === 'ir') && eInfinito(T[k + 1]))
    if (i < 0) return []
    return [alt(metti(T, i, null), { ir: T[i - 1], inf: T[i + 1] })]
  },
  // voy a nadar → voy a nadando
  irAGerundio(T) {
    const i = trova(T, (w, k) => w === 'a' && coniugato(T[k - 1] || '').some(f => f.base === 'ir') && eInfinito(T[k + 1]))
    if (i < 0) return []
    const sbagliato = flessione(low(T[i + 1]), 'ger')
    return [alt(metti(T, i + 1, sbagliato), { ir: T[i - 1], inf: T[i + 1], sbagliato })]
  },
  // me levanto → levanto
  togliRiflessivo(T, _, { tranne = [] }) {
    const i = trova(T, (w, k) => ['me', 'te', 'se', 'nos'].includes(w) &&
      coniugato(T[k + 1] || '').some(f => eRiflessivo(f.base) && !tranne.includes(f.base)))
    if (i < 0) return []
    const f = coniugato(T[i + 1]).find(x => eRiflessivo(x.base))
    return [alt(metti(T, i, null), { base: f.base, giusto: `${T[i]} ${T[i + 1]}`, sbagliato: T[i + 1] })]
  },
  // me levanto → se levanto
  riflessivoPersona(T) {
    const i = trova(T, (w, k) => ['me', 'te', 'se', 'nos'].includes(w) &&
      coniugato(T[k + 1] || '').some(f => eRiflessivo(f.base)))
    if (i < 0) return []
    const sbagliato = low(T[i]) === 'se' ? 'me' : 'se'
    return [alt(metti(T, i, sbagliato), { giusto: T[i], sbagliato, verbo: T[i + 1] })]
  },
  // me llamo → mi llamo, te gusta → ti gusta: il pronome all'italiana
  cliticoItaliano(T, _, { da, a }) {
    const i = trova(T, (w, k) => w === da && coniugato(T[k + 1] || '').length > 0)
    if (i < 0) return []
    return [alt(metti(T, i, a), { giusto: T[i], sbagliato: a, verbo: T[i + 1] })]
  },

  /* ── il passato ── */
  // ayer jugué → ayer juego
  passatoAlPresente(T) {
    const i = trova(T, w => coniugato(w).some(f => f.come === 'ind') && !coniugato(w).some(f => f.come === 'pres'))
    if (i < 0) return []
    const f = coniugato(T[i]).find(x => x.come === 'ind')
    const sbagliato = flessione(f.base, 'pres', f.persona)
    if (!sbagliato) return []
    return [alt(metti(T, i, sbagliato), { base: f.base, giusto: T[i], sbagliato })]
  },
  // hice → hací, supe → sabí: l'irregolare fatto come se fosse regolare
  passatoRegolare(T, _, { verbi = null, tranne = [] }) {
    const i = trova(T, w => coniugato(w).some(f => f.come === 'ind' && IRREGOLARI[f.base.replace(/se$/, '')]?.ind &&
      (!verbi || verbi.includes(f.base)) && !tranne.includes(f.base)))
    if (i < 0) return []
    const f = coniugato(T[i]).find(x => x.come === 'ind' && IRREGOLARI[x.base.replace(/se$/, '')]?.ind)
    const sbagliato = regolare(f.base, 'ind', f.persona)
    if (low(sbagliato) === low(T[i])) return []
    return [alt(metti(T, i, sbagliato), { base: f.base, giusto: T[i], sbagliato })]
  },
  // comió → comio, jugué → jugue
  passatoSenzaAccento(T) {
    const i = trova(T, w => /[áéíóú]$/.test(w) && coniugato(w).some(f => f.come === 'ind'))
    if (i < 0) return []
    const sbagliato = low(T[i]).replace(/[áéíóú]$/, c => ({ á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u' }[c]))
    return [alt(metti(T, i, sbagliato), { giusto: T[i], sbagliato })]
  },
  // jugué → jugé, busqué → buscé, empecé → empezé
  passatoOrtografia(T) {
    const i = trova(T, w => /(gué|qué|cé)$/.test(w) && coniugato(w).some(f => f.come === 'ind' && f.persona === 'yo'))
    if (i < 0) return []
    const f = coniugato(T[i]).find(x => x.come === 'ind')
    const sbagliato = f.base.replace(/se$/, '').slice(0, -2) + 'é'
    if (sbagliato === low(T[i])) return []
    return [alt(metti(T, i, sbagliato), { base: f.base, giusto: T[i], sbagliato })]
  },
  // ayer estuve en el parque → ayer fui en el parque
  estuveFui(T) {
    const i = trova(T, (w, k) => formeDi('estar')(w).some(f => f.come === 'ind') && low(T[k + 1]) === 'en')
    if (i < 0) return []
    const f = formeDi('estar')(T[i]).find(x => x.come === 'ind')
    const sbagliato = flessione('ser', 'ind', f.persona)
    return [alt(metti(T, i, sbagliato), { giusto: T[i], sbagliato })]
  },

  /* ── le preposizioni, al e del ── */
  // voy al parque → voy en el parque, voy a la escuela → voy en la escuela
  aInEn(T) {
    const i = trova(T, (w, k) => (w === 'a' || w === 'al') && coniugato(T[k - 1] || '').some(f => f.base === 'ir') &&
      (w === 'al' || !!determinante(T[k + 1] || '') || !!nomeDi(T[k + 1] || '')))
    if (i < 0) return []
    return [alt(metti(T, i, low(T[i]) === 'al' ? 'en el' : 'en'), { giusto: T[i] })]
  },
  // estoy en casa → estoy a casa, está en el parque → está al parque
  enInA(T) {
    const i = trova(T, (w, k) => w === 'en' && formeDi('estar')(T[k - 1] || '').length > 0 &&
      (!!determinante(T[k + 1] || '') || !!nomeDi(T[k + 1] || '')))
    if (i < 0) return []
    if (low(T[i + 1]) === 'el') return [alt([...T.slice(0, i), 'al', ...T.slice(i + 2)], {})]
    return [alt(metti(T, i, 'a'), {})]
  },
  // al → a el, del → de el
  contrazioneMancante(T, _, { prep }) {
    const corta = prep === 'a' ? 'al' : 'del'
    const i = trova(T, w => w === corta)
    if (i < 0) return []
    return [alt(metti(T, i, `${prep} el`), { giusto: corta, prep, cosa: T[i + 1] || '' })]
  },
  // a la escuela → al escuela, de la niña → del niña
  contraiFemminile(T, _, { prep }) {
    const i = trova(T, (w, k) => w === prep && low(T[k + 1]) === 'la' && !!nomeDi(T[k + 2] || '') &&
                                 !LE_ORE(low(T[k + 2])))
    if (i < 0) return []
    const corta = prep === 'a' ? 'al' : 'del'
    return [alt([...T.slice(0, i), corta, ...T.slice(i + 2)], { giusto: `${prep} la`, sbagliato: corta, cosa: T[i + 2] })]
  },
  // gira a la izquierda → gira a izquierda
  togliLa(T, _, { prima }) {
    const i = trova(T, (w, k) => w === 'la' && low(T[k - 1]) === 'a' && prima.includes(low(T[k + 1])))
    if (i < 0) return []
    return [alt(metti(T, i, null), { cosa: T[i + 1] })]
  },
  // al lado del parque → al lado al parque
  alLadoAl(T) {
    const i = trova(T, (w, k) => w === 'lado' && low(T[k - 1]) === 'al' && ['de', 'del'].includes(low(T[k + 1])))
    if (i < 0) return []
    return [alt(metti(T, i + 1, low(T[i + 1]) === 'del' ? 'al' : 'a'), {})]
  },
  // el gato está sobre la mesa → debajo de la mesa: la parola e il «de» che si porta dietro
  scambiaPosto(T, _, { coppie, glossa = {} }) {
    const CON_DE = new Set(['debajo', 'detrás', 'cerca', 'encima', 'delante'])
    for (let i = 0; i < T.length; i++) for (const [a, b] of coppie) for (const [da, per] of [[a, b], [b, a]]) {
      if (low(T[i]) !== da) continue
      let U = metti(T, i, per)
      const de = low(T[i + 1])
      if (CON_DE.has(da) && !CON_DE.has(per)) {
        if (de === 'de') U[i + 1] = null
        else if (de === 'del') U[i + 1] = 'el'
        else continue
      } else if (!CON_DE.has(da) && CON_DE.has(per)) {
        if (low(T[i + 1]) === 'el') U[i + 1] = 'del'
        else U = [...U.slice(0, i + 1), 'de', ...U.slice(i + 1)]
      }
      const it = x => sostituisciIt(x, [[glossa[da], glossa[per]]])
      return [alt(U, { giusto: da, sbagliato: per, itGiusto: glossa[da], itSbagliato: glossa[per] }, it)]
    }
    return []
  },

  /* ── l'ora, le date, il tempo ── */
  // a las siete → en las siete
  oraEnA(T) {
    const i = trova(T, (w, k) => w === 'a' && ['la', 'las'].includes(low(T[k + 1])) && LE_ORE(low(T[k + 2] || '')))
    if (i < 0) return []
    return [alt(metti(T, i, 'en'), {})]
  },
  // son las tres → es las tres, es la una → son la una
  oraEsSon(T) {
    const i = trova(T, (w, k) => (w === 'son' && low(T[k + 1]) === 'las') || (w === 'es' && low(T[k + 1]) === 'la' &&
                                 low(T[k + 2]) === 'una'))
    if (i < 0) return []
    return [alt(metti(T, i, low(T[i]) === 'son' ? 'es' : 'son'), {})]
  },
  // el cinco de mayo → el cinco mayo
  dataSenzaDe(T) {
    const i = trova(T, (w, k) => w === 'de' && eNumero(T[k - 1] || '') && MESI.has(low(T[k + 1])))
    if (i < 0) return []
    return [alt(metti(T, i, null), {})]
  },
  // el lunes juego → en el lunes juego
  giornoConEn(T) {
    const i = trova(T, (w, k) => w === 'el' && GIORNI.has(low(T[k + 1])) && !['es', 'en', 'hasta', 'de'].includes(low(T[k - 1])))
    if (i < 0) return []
    return [alt([...T.slice(0, i), 'en', ...T.slice(i)], {})]
  },
  // en mayo → en el mayo
  meseConEl(T) {
    const i = trova(T, (w, k) => w === 'en' && (MESI.has(low(T[k + 1])) ||
      ['primavera', 'verano', 'otoño', 'invierno'].includes(low(T[k + 1]))))
    if (i < 0) return []
    return [alt([...T.slice(0, i + 1), 'el', ...T.slice(i + 1)], { cosa: T[i + 1] })]
  },
  // hace frío → es frío
  haceEs(T) {
    const i = trova(T, (w, k) => w === 'hace' && ['frío', 'calor', 'sol', 'viento', 'mucho', 'buen', 'mal'].includes(low(T[k + 1])))
    if (i < 0) return []
    return [alt(metti(T, i, 'es'), { cosa: T[i + 1] })]
  },
  // hace mucho frío → hace muy frío, tengo mucha hambre → tengo muy hambre
  muyMucho(T) {
    const i = trova(T, (w, k) => /^(mucho|mucha)$/.test(w) && ['frío', 'calor', 'hambre', 'sed', 'sueño', 'miedo', 'sol',
      'viento'].includes(low(T[k + 1])))
    if (i < 0) return []
    return [alt(metti(T, i, 'muy'), { giusto: T[i], cosa: T[i + 1] })]
  },
  // ¿cuánto cuesta? ↔ cuestan
  cuestaCuestan(T) {
    const i = trova(T, w => w === 'cuesta' || w === 'cuestan')
    if (i < 0) return []
    return [alt(metti(T, i, low(T[i]) === 'cuesta' ? 'cuestan' : 'cuesta'), { giusto: T[i] })]
  },
  // cuesta → costa: costar all'italiana
  costaCalco(T) {
    const i = trova(T, w => w === 'cuesta' || w === 'cuestan')
    if (i < 0) return []
    const sbagliato = low(T[i]).replace('cuest', 'cost')
    return [alt(metti(T, i, sbagliato), { giusto: T[i], sbagliato })]
  },

  /* ── i paragoni ── */
  // más alto que → más alto de
  masDe(T) {
    const i = trova(T, (w, k) => w === 'que' && ['más', 'menos'].includes(low(T[k - 2])) && !!aggettivoDi(T[k - 1] || ''))
    if (i < 0) return []
    return [alt(metti(T, i, 'de'), {})]
  },
  // mejor → más bueno, peor → más malo
  masBueno(T) {
    const i = trova(T, (w, k) => /^(mejor|peor)(es)?$/.test(w) && low(T[k - 1]) !== 'más')
    if (i < 0) return []
    const w = low(T[i])
    const s = soggettoInTesta(T)
    const base = /^mejor/.test(w) ? 'bueno' : 'malo'
    const agg = accordaAgg(base, (s && s.genere) || 'm', /es$/.test(w))
    return [alt([...T.slice(0, i), 'más', agg, ...T.slice(i + 1)], { giusto: T[i], sbagliato: `más ${agg}` })]
  },
  // mejor → más mejor
  masMejor(T) {
    const i = trova(T, (w, k) => /^(mejor|peor)(es)?$/.test(w) && low(T[k - 1]) !== 'más')
    if (i < 0) return []
    return [alt([...T.slice(0, i), 'más', ...T.slice(i)], { giusto: T[i] })]
  },

  /* ── le parole scambiate, gli accenti, il no ── */
  scambia(T, _, { coppie, it = [], glossa = {}, unVerso = false, riaccorda: rifai = false }) {
    for (let i = 0; i < T.length; i++)
      for (const [a, b] of coppie)
        for (const [da, per] of (unVerso ? [[a, b]] : [[a, b], [b, a]]))
          if (low(T[i]) === da) {
            const U = metti(T, i, per)
            // ella es alta → él es alto: il predicato segue chi lo dice (e l'italiano,
            // che andrebbe accordato anche lui, non si offre)
            let cambiato = false
            if (rifai && i === 0 && GENERE_DEL_PRONOME[per]) {
              const prima = U.join(' ')
              riaccordaPredicato(U, GENERE_DEL_PRONOME[per], false)
              cambiato = U.join(' ') !== prima
            }
            // l'italiano si offre solo se non ha niente da accordare (è stanca, è venuta)
            const daAccordare = rifai && T.some(w => aggettivoDi(w) || coniugato(w).some(f => f.come === 'ind'))
            return [alt(U, { giusto: da, sbagliato: per, itGiusto: glossa[da], itSbagliato: glossa[per] },
                        cambiato || daAccordare ? null : x => sostituisciIt(x, it))]
          }
    return []
  },
  // ¿qué es? → ¿que es?
  togliAccento(T, _, { parole: quali }) {
    const i = trova(T, w => quali.includes(w))
    if (i < 0) return []
    const sbagliato = low(T[i]).normalize('NFD').replace(/[́]/g, '').normalize('NFC')
    return [alt(metti(T, i, sbagliato), { giusto: T[i], sbagliato })]
  },
  // más alto que Leo → más alto qué Leo; cuando llueve → cuándo llueve
  mettiAccento(T, { domanda }, { coppie }) {
    const i = trova(T, (w, k) => coppie.some(([a]) => a === w) && !(domanda && k === 0))
    if (i < 0) return []
    const sbagliato = coppie.find(([a]) => a === low(T[i]))[1]
    return [alt(metti(T, i, sbagliato), { giusto: T[i], sbagliato })]
  },
  togliNegazione(T) {
    const i = trova(T, (w, k) => w === 'no' && (coniugato(T[k + 1] || '').length > 0 || CLITICI.has(low(T[k + 1]))))
    if (i < 0 || T.some(w => ['nada', 'nunca', 'nadie', 'ningún', 'ninguna'].includes(low(w)))) return []
    return [alt(metti(T, i, null), {}, x => (/(^|\s)non\s/.test(x) ? x.replace(/(^|\s)non\s/, '$1') : null))]
  },
  aggiungiNegazione(T, { domanda }) {
    if (domanda || T.some(w => ['no', 'nunca', 'nada'].includes(low(w)))) return []
    const s = soggettoInTesta(T)
    let k = verboDa(T, s ? s.a : 0)
    if (k < 0) return []
    while (k > 0 && CLITICI.has(low(T[k - 1]))) k--
    if (s && k < s.a) return []
    const it = x => {
      if (/^(mi|ti|gli|le|ci|si) /i.test(x)) return 'non ' + x
      const m = x.match(/^(io|tu|lui|lei|noi|loro) (.+)$/i)
      return m ? `${m[1]} non ${m[2]}` : null
    }
    return [alt([...T.slice(0, k), 'no', ...T.slice(k)], {}, it)]
  },

  /* Una parola dello stesso gruppo al posto di una della frase: una
     alternativa per ogni parola vicina che il bambino conosce. La frase
     resta in piedi: il nome nuovo si porta il suo genere e il resto si
     riaccorda (el gato negro → la vaca negra), il numero resta quello (los
     gatos → los perros, mai una cosa già plurale al posto di una sola),
     l'aggettivo si accorda col suo nome, il verbo resta nella sua persona
     e nel suo tempo (juego → canto). */
  parolaVicina(T, { vicine }) {
    if (!vicine) return []
    const out = []
    T.forEach((w, i) => {
      const lw = low(w)
      if (eNumero(lw) || DET.has(lw) || PRONOMI.has(lw) || NOMI_PROPRI.has(lw)) return
      const n = nomeDi(lw)
      const a = !n && aggettivoDi(lw)
      const vs = !n && !a ? flesse(lw).filter(f => eVerbo(f.base)) : []
      const v = !n && !a ? (eVerbo(lw) ? { base: lw, come: null } : vs[0] || null) : null
      const base = n ? n.base : a ? a.base : v ? v.base : null
      if (!base) return
      const conDet = i > 0 && (!!determinante(T[i - 1]) || eNumero(T[i - 1]) || !!aggettivoDi(T[i - 1]))
      // senza articolo (en casa, hoy es lunes) si scambia solo un giorno con un giorno, un mese con un mese
      const nudoOk = x => GIORNI.has(low(x)) || MESI.has(low(x))
      for (const vicina of vicine(low(base))) {
        if (low(vicina) === low(base)) continue
        let U = T.slice()
        let parola = null, verbo = null
        if (n) {
          const vn = nomeDi(nudo(vicina))
          const nuovo = nudo(scritta(vicina))
          if (!vn || /\s/.test(nuovo) || !vn.genere || eGenereComune(vicina) !== eGenereComune(base)) continue
          const giaPl = GIA_PLURALI.has(low(nuovo))
          if (n.plurale) {
            if (NON_CONTABILI.has(low(nuovo))) continue
            U[i] = giaPl ? nuovo : plurale(nuovo)
          } else {
            if (giaPl) continue
            if (!conDet && !NON_CONTABILI.has(low(nudo(base))) && !(nudoOk(nudo(base)) && nudoOk(nuovo))) continue
            if (NON_CONTABILI.has(low(nuovo)) !== NON_CONTABILI.has(low(nudo(base))) && !conDet) continue
            if (NON_CONTABILI.has(low(nuovo)) && ['un', 'una'].includes(low(T[i - 1]))) continue
            U[i] = nuovo
          }
          if (INVARIABILI.has(low(nuovo)) !== INVARIABILI.has(low(nudo(base)))) continue
          U = riaccorda(U, i, vn.genere, n.plurale)
          parola = scritta(base)
        } else if (a) {
          if (!aggettivoDi(vicina) || aggettivoDi(vicina).base !== low(vicina)) continue
          U[i] = accordaAgg(low(vicina), a.genere || 'm', a.plurale)
          if (a.genere === null && accordaAgg(low(vicina), 'f', a.plurale) !== accordaAgg(low(vicina), 'm', a.plurale)) {
            // l'aggettivo di prima non diceva il genere: lo dice il nome davanti, o il soggetto
            const nm = nomeDi(T[i - 1] || '')
            const s = soggettoInTesta(T)
            const g = nm ? nm.genere : s && s.genere
            if (!g) continue
            U[i] = accordaAgg(low(vicina), g, a.plurale)
          }
          parola = scritta(base)
        } else {
          if (!eVerbo(vicina) || /\s/.test(vicina) || eRiflessivo(vicina) !== eRiflessivo(v.base)) continue
          U[i] = v.come ? flessione(vicina, v.come, v.persona || 'él') : vicina
          // «limpia», «cocina»: una forma che è anche un aggettivo o un nome si legge male
          if (!U[i] || aggettivoDi(U[i]) || nomeDi(U[i])) continue
          verbo = v.base
        }
        const it = x => IT.get(low(x)) || itDelVerbo(x)
        out.push(alt(U, { giusto: scritta(nudo(base)), sbagliato: scritta(nudo(vicina)), itGiusto: it(base),
                          itSbagliato: it(vicina), parola, verbo }))
      }
    })
    return out
  },
}

// le parole che una trappola non deve mai mettere davanti a un bambino (pedir → «pedo»)
const MAI = new Set(['pedo', 'pedos'])

export const riempi = (modello, dati) => modello.replace(/\{(\w+)\}/g, (_, k) => (dati[k] ?? `{${k}}`))

const maiuscola = s => (s ? s[0].toUpperCase() + s.slice(1) : s)

// Una riga della tabella applicata a una frase: le alternative con es, it
// (se l'errore ha un senso in italiano) e perché.
export function applica(riga, frase, ctx = {}) {
  const op = OPERAZIONI[riga.fa]
  if (!op) throw new Error(`trappola ${riga.id}: operazione sconosciuta ${riga.fa}`)
  const T = parole(frase.es)
  const domanda = frase.it ? eDomanda(frase) : !!ctx.domanda
  return op(T, { ...ctx, domanda }, riga.con || {}).filter(a => !a.T.some(w => MAI.has(low(w)))).map(a => {
    const itNuovo = typeof a.it === 'function' && frase.it ? a.it(frase.it) : null
    return {
      id: riga.id,
      es: a.T.join(' '),
      it: itNuovo && itNuovo !== frase.it ? itNuovo : null,
      perche: maiuscola(riempi(riga.perche, a.dati)),
      pesa: riga.pesa || 'forma',
      forma: riga.forma || frase.forma || null,
      parola: a.dati.parola || a.dati.verbo || null,
      // la voce SRS su cui pesa uno sbaglio di parola (un verbo è `verbo-es:`)
      chiave: a.dati.verbo ? 'verbo-es:' + a.dati.verbo : a.dati.parola ? 'es:' + a.dati.parola : null,
    }
  })
}

// Le parole vicine a una data: stesso gruppo (l'argomento della tappa che
// la insegna, se no la categoria), fra quelle note
export const vicineFra = note => base => {
  const g = gruppoDi(base)
  return g ? [...note].filter(w => w !== low(base) && gruppoDi(w) === g) : []
}

// Tutte le trappole di una frase: generate dalla tabella (meno quelle in
// `niente`) più quelle scritte a mano; nessuna uguale alla giusta o a una
// variante, nessun doppione.
export function trappoleDi(frase, ctx = {}) {
  const giuste = new Set(accettate(frase))
  const viste = new Set()
  const out = []
  const aggiungi = t => {
    const k = normalizza(t.es)
    if (giuste.has(k) || viste.has(k)) return
    viste.add(k); out.push(t)
  }
  for (const t of frase.trappole || [])
    aggiungi({ id: 'a-mano', es: t.es, it: t.it || null, perche: t.perche,
               pesa: t.parola ? 'parola' : 'forma', forma: frase.forma, parola: t.parola || null,
               chiave: t.parola ? 'es:' + t.parola : null })
  const anno = (mondoDi(frase.mondo) || {}).anno || 0
  for (const riga of TRAPPOLE)
    if (!(frase.niente || []).includes(riga.id) && (!riga.soloForme || riga.soloForme.includes(frase.forma)) &&
        !(riga.dallAnno && anno && anno < riga.dallAnno))
      for (const t of applica(riga, frase, ctx)) aggiungi(t)
  return out
}

// Ne sceglie `n`, una per riga della tabella: una forma debole fa uscire più
// spesso la sua trappola; le parole vicine riempiono, non comandano.
export function scegliTrappole(lista, n, { forzaForma = () => 0, rnd = Math.random } = {}) {
  const gruppi = new Map()
  lista.forEach((t, i) => {
    const k = t.id === 'a-mano' ? 'a-mano:' + i : t.id
    if (!gruppi.has(k)) gruppi.set(k, [])
    gruppi.get(k).push(t)
  })
  const peso = g => {
    const t = g[0]
    if (t.id === 'a-mano') return 2
    if (t.pesa === 'parola') return 0.3
    return 1 + Math.max(0, MAX_S - (t.forma ? forzaForma(t.forma) : 0))
  }
  const restano = [...gruppi.values()]
  const scelte = []
  while (scelte.length < n && restano.length) {
    const pesi = restano.map(peso)
    let r = rnd() * pesi.reduce((a, b) => a + b, 0)
    let k = restano.length - 1
    for (let i = 0; i < restano.length; i++) { r -= pesi[i]; if (r <= 0) { k = i; break } }
    const g = restano.splice(k, 1)[0]
    scelte.push(g[Math.floor(rnd() * g.length) % g.length])
  }
  return scelte
}
