// Il controllo che una frase spagnola stia in piedi sulla concordanza:
// articolo, dimostrativo e possessivo col genere e il numero del nome (la
// gato, los gato, este casa), l'aggettivo che lo segue o che lo precede (una
// casa blanco, buenas días), il predicato (la vaca es negro), il plurale
// dopo un numero (dos perro), un/una davanti a una cosa che non si conta,
// el agua, al e del (a el parque). Non è una grammatica: è quello che le
// trappole generate possono sbagliare per caso. Lo usano i controlli
// (motore/guasti.js) su ogni frase e ogni trappola; le righe che sbagliano
// apposta queste cose stanno in APPOSTA. Vedi docs/lingue/spagnolo-motore.md.
import { minuscole } from './testo.js'
import { nomeDi, aggettivoDi, determinante, accordaDet, accordaAgg, eNumero, eCardinale, eGenereComune,
         NON_CONTABILI, INVARIABILI, PRONOMI, GENERE_DEL_PRONOME, NOMI_PROPRI, genereDelNome, nudo,
         ACCORCIATI } from './lessico.js'
import { flesse } from './flessioni.js'

// le righe di dati/trappole.js il cui errore è proprio questo
export const APPOSTA = new Set(['un-una', 'el-la', 'el-agua', 'este-esta', 'mi-mis', 'aggettivo-genere',
  'aggettivo-numero', 'plurale-mancante', 'plurale-in-piu', 'contrazione-a', 'contrazione-de', 'al-femminile',
  'del-femminile', 'mucho-accordo', 'buenos-buenas'])
// el cinco de mayo: dopo un numero un mese non è una cosa da contare
const MESI = new Set(['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre',
                      'octubre', 'noviembre', 'diciembre'])

export const eCopula = w => flesse(w).some(f => f.base === 'ser' || f.base === 'estar')
// un aggettivo che non è anche un verbo: «limpia» è pulita e anche «pulisce», e non si controlla
export const soloAggettivo = w => { const a = aggettivoDi(w); return a && !flesse(w).some(f => f.come !== 'ger') ? a : null }
// fra il soggetto e il verbo, e fra il verbo e l'aggettivo
const IN_MEZZO = new Set(['no', 'también', 'siempre', 'nunca', 'ya', 'todavía'])
const INTENSITA = new Set(['muy', 'tan', 'más', 'menos', 'bastante'])

// Il nome che arriva dopo T[i], saltando numeri e aggettivi messi davanti: { j, n } o null
export function nomeDopo(T, i) {
  let j = i
  while (j < T.length && !nomeDi(T[j]) && (eNumero(T[j]) || aggettivoDi(T[j]))) j++
  const n = j < T.length ? nomeDi(T[j]) : null
  return n ? { j, n } : null
}

const invariabile = n => INVARIABILI.has(nudo(n.base).toLowerCase())

// genere e numero del nome in T[j], visto il determinante che ha davanti (se c'è)
function accordoDelNome(T, j, n, det) {
  const plurale = invariabile(n) && det ? det.plurale : n.plurale
  let genere = n.genere
  if (eGenereComune(n.base)) genere = det && det.genere ? det.genere : null
  return { genere, plurale, numeroCerto: !invariabile(n) || !!det }
}

// un aggettivo accordato col nome? null se va bene, se no la forma giusta
function aggettivoStorto(w, genere, plurale, numeroCerto, davanti = false) {
  const a = aggettivoDi(w)
  if (!a) return null
  if (a.corta) return davanti && !plurale && (a.genere === null || genere === a.genere || !genere) ? null
    : accordaAgg(a.base, genere || 'm', plurale)
  const giusta = accordaAgg(a.base, genere || a.genere || 'm', plurale)
  if (numeroCerto && a.plurale !== plurale) return giusta
  if (genere && a.genere && a.genere !== genere) return giusta
  // davanti a un maschile singolare bueno, malo, primero e tercero si accorciano
  if (davanti && ACCORCIATI[a.base] && genere === 'm' && !plurale && w === a.base) return ACCORCIATI[a.base]
  return null
}

// Il soggetto in testa alla frase, per accordare il predicato: { a, genere, plurale } o null
function soggettoInTesta(T) {
  const w = T[0]
  if (!w) return null
  if (PRONOMI.has(w)) return { a: 1, genere: GENERE_DEL_PRONOME[w] || null,
                              plurale: ['nosotros', 'nosotras', 'ellos', 'ellas', 'ustedes'].includes(w) }
  if (NOMI_PROPRI.has(w)) return T[1] === 'y' ? null : { a: 1, genere: genereDelNome(w), plurale: false }
  const det = determinante(w)
  if (!det) return null
  const x = nomeDopo(T, 1)
  if (!x) return null
  const { genere, plurale } = accordoDelNome(T, x.j, x.n, det)
  let a = x.j + 1
  while (a < T.length && aggettivoDi(T[a]) && !eCopula(T[a])) a++
  if (T[a] === 'y' || T[a] === 'de' || T[a] === 'del') return null
  return { a, genere, plurale }
}

// Il primo errore di concordanza della frase, in parole; null se non ce n'è.
export function sgrammaticata(es) {
  const T = minuscole(es)
  for (let i = 0; i < T.length; i++) {
    const w = T[i]
    if ((w === 'a' || w === 'de') && T[i + 1] === 'el') return `«${w} el»: si scrive ${w === 'a' ? 'al' : 'del'}`
    // un poco de: «poco» qui non va d'accordo con niente
    const det = !(w === 'poco' && T[i - 1] === 'un') && determinante(w)
    if (det) {
      const x = nomeDopo(T, i + 1)
      if (!x) continue
      const nome = T[x.j]
      const { genere, plurale, numeroCerto } = accordoDelNome(T, x.j, x.n, det)
      if ((w === 'un' || w === 'una') && !plurale && NON_CONTABILI.has(nudo(x.n.base).toLowerCase()))
        return `«${w} ${nome}»: ${nome} non si conta`
      const atteso = accordaDet(w, genere || det.genere || 'm', numeroCerto ? plurale : det.plurale, nudo(x.n.base))
      if (atteso !== w && (genere || det.plurale !== plurale)) return `«${w} … ${nome}»: si dice ${atteso} ${nome}`
      for (let k = i + 1; k < x.j; k++) {
        const giusta = aggettivoStorto(T[k], genere, plurale, numeroCerto, true)
        if (giusta) return `«${T[k]} ${nome}»: ci vuole ${giusta}`
      }
      continue
    }
    if (eCardinale(w)) {
      const x = nomeDopo(T, i + 1)
      if (!x || invariabile(x.n) || MESI.has(T[x.j])) continue
      const nome = T[x.j]
      if (w === 'uno') return `«uno ${nome}»: davanti a una cosa si dice un`
      if (NON_CONTABILI.has(nudo(x.n.base).toLowerCase())) return `«${w} ${nome}»: ${nome} non si conta`
      if (!x.n.plurale) return `«${w} … ${nome}»: ci vuole il plurale`
      continue
    }
    // l'aggettivo davanti a un nome senza determinante: buenos días, buenas noches
    if (soloAggettivo(w) && !nomeDi(w) && T[i + 1] && nomeDi(T[i + 1]) && !determinante(T[i - 1] || '')) {
      const n = nomeDi(T[i + 1])
      const { genere, plurale, numeroCerto } = accordoDelNome(T, i + 1, n, null)
      const giusta = aggettivoStorto(w, genere, plurale, numeroCerto, true)
      if (giusta) return `«${w} ${T[i + 1]}»: ci vuole ${giusta}`
    }
    // gli aggettivi dopo un nome: una casa blanca, dos gatos negros
    const n = nomeDi(w)
    if (n) {
      let d = null
      for (let k = i - 1; k >= 0; k--) {
        if (determinante(T[k])) { d = determinante(T[k]); break }
        if (!(eNumero(T[k]) || aggettivoDi(T[k]))) break
      }
      const { genere, plurale, numeroCerto } = accordoDelNome(T, i, n, d)
      for (let k = i + 1; k < T.length; k++) {
        if (T[k] === 'y' && soloAggettivo(T[k + 1] || '') && !nomeDi(T[k + 1])) continue
        if (!soloAggettivo(T[k]) || (nomeDi(T[k]) && k > i + 1)) break
        const giusta = aggettivoStorto(T[k], genere, plurale, numeroCerto)
        if (giusta) return `«${w} ${T[k]}»: ci vuole ${giusta}`
      }
    }
  }
  // il predicato: la vaca es negra, ellos están cansados
  const s = soggettoInTesta(T)
  if (s) {
    let k = s.a
    while (IN_MEZZO.has(T[k])) k++
    if (k < T.length && eCopula(T[k])) {
      k++
      while (INTENSITA.has(T[k])) k++
      if (T[k] && soloAggettivo(T[k]) && !(T[k + 1] && nomeDi(T[k + 1]) && !aggettivoDi(T[k + 1]))) {
        const giusta = aggettivoStorto(T[k], s.genere, s.plurale, true)
        if (giusta) return `«… ${T[k]}»: ci vuole ${giusta}`
      }
    }
  }
  return null
}
