// Da una frase tutti i formati, e il giudizio di una risposta. Il formato
// lo decide la forza della frase (un gradino per punto): riconosci → cosa
// vuol dire → scegli → completa → monta → scegli e monta. Le parole tengono
// i tipi di oggi (data/domande.js). Vedi docs/lingue/frasi.md.
import { MAX_S } from '../../../store/srs.js'
import { FORME, chiaveForma } from '../dati/forme.js'
import { trappoleDi, scegliTrappole, vicineFra } from './trappole.js'
import { GEMELLE } from '../dati/trappole.js'
import { parole, normalizza, accettate, eDomanda, inBella, aSchermo } from './testo.js'
import { chiaveDi, DET, aggettivoDi, nomeDi, accordaAgg, plurale, nudo, GIA_PLURALI, INVARIABILI,
         NON_CONTABILI } from './lessico.js'
import { paroleNote, flessioniNote, chiaveFrase } from './grafo.js'
import { flesse, formeDi, PERSONE } from './flessioni.js'

export const FORMATI_FRASE = ['riconosci', 'senso', 'scegli', 'completa', 'monta', 'scegliMonta']
export const COMPONI = new Set(['completa', 'monta', 'scegliMonta'])

export const formatoPerForza = forza =>
  FORMATI_FRASE[Math.max(0, Math.min(FORMATI_FRASE.length - 1, Math.floor(forza || 0)))]

// «scegli e monta»: due tessere di troppo, poi tre, poi quattro quando anche
// la forma è al massimo (la forza si ferma a MAX_S)
export const tessereInPiu = (forza, forzaForma = 0) =>
  (forza <= 5 ? 2 : forzaForma >= MAX_S ? 4 : 3)

// Le gemelle di una parola: quelle di GEMELLE (es / son, un / una…) e le
// altre forme della stessa parola: di un verbo quelle che la tappa conosce
// (juego → juegas, jugar), di un aggettivo il genere e il numero (negro →
// negra, negros), di un nome l'altro numero (gato → gatos). Solo quelle
// note: una tessera mai vista non è una scelta.
function gemelleDi(w, note, flessioni) {
  const lw = w.toLowerCase()
  const g = GEMELLE.find(x => x[0] === lw) || GEMELLE.find(x => x.includes(lw))
  if (g) return g
  const a = aggettivoDi(lw)
  if (a && !a.corta) return [...new Set([accordaAgg(a.base, a.genere === 'f' ? 'm' : 'f', a.plurale),
                                         accordaAgg(a.base, a.genere || 'm', !a.plurale)])]
  const n = nomeDi(lw)
  if (n) {
    const b = nudo(n.base).toLowerCase()
    if (GIA_PLURALI.has(b) || INVARIABILI.has(b) || NON_CONTABILI.has(b)) return []
    return [n.plurale ? b : plurale(b)]
  }
  const f = flesse(lw).find(x => note && note.has(x.base))
  if (!f || !flessioni) return []
  return formeDi(f.base, [...flessioni]).filter(x => !/\s/.test(x))
}
const eNota = (x, note, flessioni) => {
  if (!note || note.has(x)) return true
  const n = nomeDi(x), a = aggettivoDi(x)
  if ((n && note.has(n.base.toLowerCase())) || (a && note.has(a.base))) return true
  return !!(flessioni && flesse(x).some(f => flessioni.has(f.come) && note.has(f.base)))
}

// Le tessere di troppo, dalle più istruttive: le parole delle trappole di
// grammatica, poi le gemelle delle parole della frase, poi le parole vicine.
// `rivale` è il posto della frase che la tessera contende (plays → play).
function tessereDiTroppo(T, trappole, tappa, note, ctx) {
  const presenti = new Set(T.map(w => w.toLowerCase()))
  const out = []
  const metti = (testo, trappola, rivale) => {
    const k = testo.toLowerCase()
    if (presenti.has(k) || out.some(e => e.testo.toLowerCase() === k)) return
    out.push({ testo, trappola, rivale: rivale >= 0 ? rivale : null })
  }
  const daTrappola = t => {
    const U = parole(t.es)
    const dentro = new Set(U.map(w => w.toLowerCase()))
    const rivale = T.findIndex(w => !dentro.has(w.toLowerCase()))
    for (const w of U) metti(w, t, rivale)
  }
  const scelte = scegliTrappole(trappole, trappole.length, { forzaForma: ctx.forzaForma, rnd: ctx.rnd })
  scelte.filter(t => t.pesa !== 'parola').forEach(daTrappola)
  T.forEach((w, i) => {
    const g = gemelleDi(w, note, ctx.flessioni)
    for (const x of ctx.rnd ? mescola(g, ctx.rnd) : g) if (eNota(x, note, ctx.flessioni)) metti(x, null, i)
  })
  scelte.filter(t => t.pesa === 'parola').forEach(daTrappola)
  return out
}

// le parole di struttura: quelle che «completa» toglie per prime
const STRUTTURA = new Set(Object.values(FORME).flatMap(f => f.parole.flatMap(p => p.toLowerCase().split(' '))))
const eStruttura = w => STRUTTURA.has(w.toLowerCase()) || DET.has(w.toLowerCase())

const mescola = (a, rnd) => {
  const b = a.slice()
  for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [b[i], b[j]] = [b[j], b[i]] }
  return b
}
// mescolate davvero: una fila già in ordine non è un esercizio
const mescolaDavvero = (a, rnd) => {
  if (a.length < 2 || new Set(a.map(x => x.testo)).size < 2) return a.slice()
  for (let k = 0; k < 8; k++) {
    const b = mescola(a, rnd)
    if (b.some((x, i) => x.testo !== a[i].testo)) return b
  }
  return a.slice().reverse()
}

// il contesto di una frase: la tappa e le altre frasi
// da cui pescare quando le trappole non bastano
export function contesto(frase, { tappa = null, altre = [], forzaForma = () => 0, rnd = Math.random } = {}) {
  const note = paroleNote(frase.mondo, frase.tappa)
  return { tappa, altre: altre.filter(f => f.id !== frase.id), forzaForma, rnd,
           vicine: vicineFra(note), note, flessioni: flessioniNote(frase.mondo, frase.tappa) }
}

const opzione = (testo, giusta, trappola = null) => ({ testo, giusta, ...(trappola ? { trappola } : {}) })
// l'italiano col punto o col «?», lo spagnolo con la maiuscola e, se è una
// domanda, con ¿ e ?: lo spagnolo non gira il verbo, la domanda la dicono i segni
const inBellaTutte = (opzioni, lingua, domanda) =>
  opzioni.map(o => ({ ...o, testo: lingua === 'it' ? aSchermo(o.testo) : inBella(o.testo, { domanda }) }))

// fino a `n` testi diversi fra loro e dai `vietati`
function pesca(candidati, n, vietati, rnd) {
  const visti = new Set(vietati.map(normalizza))
  const out = []
  for (const c of mescola(candidati, rnd)) {
    if (out.length >= n) break
    const k = normalizza(c.testo)
    if (!c.testo || visti.has(k)) continue
    visti.add(k); out.push(c)
  }
  return out
}

// Costruisce la domanda. `forza` serve solo a «scegli e monta».
export function costruisci(frase, formato, ctx, { forza = 0 } = {}) {
  const { tappa, altre, rnd } = ctx
  const es = frase.es
  const domanda = eDomanda(frase)
  const trappole = trappoleDi(frase, ctx)
  const forzaForma = ctx.forzaForma(frase.forma)
  const base = {
    genere: 'frase', formato, chiave: chiaveFrase(frase.id), frase: frase.id,
    domandaIt: domanda, regola: FORME[frase.forma].regola,
  }

  if (formato === 'riconosci' || formato === 'senso') {
    let sbagliate = []
    if (formato === 'senso')
      sbagliate = pesca(scegliTrappole(trappole.filter(t => t.it), 9, { forzaForma: ctx.forzaForma, rnd })
        .map(t => opzione(t.it, false, t)), 3, [frase.it], rnd)
    // prima le altre frasi che sono domande se lo è lei: il «?» da solo direbbe quale scegliere
    for (const fra of [altre.filter(f => eDomanda(f) === domanda), altre])
      sbagliate.push(...pesca(fra.map(f => opzione(f.it, false)), 3 - sbagliate.length,
                              [frase.it, ...sbagliate.map(o => o.testo)], rnd))
    return { ...base, domanda: { testo: inBella(es, { domanda }), lingua: 'es' },
             opzioni: inBellaTutte(mescola([opzione(frase.it, true), ...sbagliate], rnd), 'it') }
  }

  if (formato === 'scegli') {
    const scelte = scegliTrappole(trappole, trappole.length, { forzaForma: ctx.forzaForma, rnd })
    const sbagliate = []
    const visti = new Set(accettate(frase))
    for (const t of scelte) {
      if (sbagliate.length >= 3) break
      const k = normalizza(t.es)
      if (visti.has(k)) continue
      visti.add(k); sbagliate.push(opzione(t.es, false, t))
    }
    // le altre frasi riempiono: a schermo prendono tutte i segni della domanda, se lo è
    sbagliate.push(...pesca(altre.map(f => opzione(f.es, false)), 3 - sbagliate.length,
                            [frase.es, ...sbagliate.map(o => o.testo)], rnd))
    return { ...base, domanda: { testo: aSchermo(frase.it), lingua: 'it' },
             opzioni: inBellaTutte(mescola([opzione(es, true), ...sbagliate], rnd), 'es', domanda) }
  }

  // i tre «componi»: la fila, le tessere, e dove vanno
  const T = parole(es)
  const tessere = T.map((testo, i) => ({ id: i, testo }))
  const out = { ...base, domanda: { testo: aSchermo(frase.it), lingua: 'it' }, soluzione: T.slice() }

  const extra = tessereDiTroppo(T, trappole, tappa, ctx.note, ctx)

  if (formato === 'completa') {
    // due buchi da tre parole in su, e una tessera di troppo che ne contende
    // uno (juegas accanto a juego): un buco con una tessera sola non è una scelta
    const quanti = T.length <= 2 ? 1 : T.length <= 5 ? 2 : 3
    const strutt = T.map((w, i) => i).filter(i => eStruttura(T[i]))
    const altri = T.map((w, i) => i).filter(i => !eStruttura(T[i]))
    const rivale = extra.length ? extra[0].rivale : null
    const buchi = [...new Set([...(rivale != null ? [rivale] : []), ...mescola(strutt, rnd), ...mescola(altri, rnd)])]
      .slice(0, quanti).sort((a, b) => a - b)
    const piu = extra.slice(0, 1).map((e, i) => ({ id: T.length + i, testo: e.testo }))
    return { ...out, rivale,
             righe: T.map((testo, i) => (buchi.includes(i) ? { buco: buchi.indexOf(i) } : { testo })),
             tessere: mescolaDavvero([...buchi.map(i => tessere[i]), ...piu], rnd), inPiu: piu.length }
  }
  if (formato === 'monta')
    return { ...out, tessere: mescolaDavvero(tessere, rnd) }

  // scegli e monta: le tessere in più vengono dalle trappole
  const k = tessereInPiu(forza, forzaForma)
  const piu = extra.slice(0, k).map((e, i) => ({ id: T.length + i, testo: e.testo }))
  return { ...out, tessere: mescolaDavvero([...tessere, ...piu], rnd), inPiu: piu.length }
}

// La fila composta come testo: per «completa» la risposta sono le tessere
// messe nei buchi in ordine, per gli altri due la fila intera.
export function composta(d, idTessere) {
  const testo = id => (d.tessere.find(t => t.id === id) || {}).testo
  if (d.formato === 'completa') {
    let k = 0
    return d.righe.map(r => (r.buco === undefined ? r.testo : testo(idTessere[k++]))).filter(Boolean).join(' ')
  }
  return idTessere.map(testo).filter(Boolean).join(' ')
}

export const rigaInBella = (d, idTessere) => aSchermo(composta(d, idTessere), d.domandaIt, 'es')

// le chiavi delle parole (e dei verbi) di una frase che hanno una voce SRS
export const paroleDellaFrase = frase =>
  [...new Set(parole(frase.es).map(chiaveDi).filter(k => k && /^(es|verbo-es):/.test(k)))]

/* Il giudizio: giusta o no, il perché e cosa segnare nello SRS.
   `risposta`: l'opzione toccata, o gli id delle tessere nella fila.
   `scadutaDi(chiave)`: vero se la parola è da ripassare — una frase giusta
   ripassa solo quelle. Uno sbaglio su una parola vicina pesa sulla parola,
   uno di grammatica sulla frase e sulla forma. */
export function giudica(frase, d, risposta, { scadutaDi = () => false, ctx = null } = {}) {
  const chiaveF = chiaveFrase(frase.id)
  const formaF = chiaveForma(frase.forma)
  let giusta, trappola = null, scritta = null
  if (COMPONI.has(d.formato)) {
    scritta = composta(d, risposta)
    giusta = accettate(frase).includes(normalizza(scritta))
    if (!giusta) {
      const k = normalizza(scritta)
      trappola = trappoleDi(frase, ctx || contesto(frase)).find(t => normalizza(t.es) === k) || null
    }
  } else {
    giusta = !!(risposta && risposta.giusta)
    trappola = (risposta && risposta.trappola) || null
  }

  let registra
  if (giusta)
    registra = [{ chiave: chiaveF, correct: true }, { chiave: formaF, correct: true },
                ...paroleDellaFrase(frase).filter(scadutaDi).map(chiave => ({ chiave, correct: true }))]
  else if (trappola && trappola.pesa === 'parola' && trappola.chiave)
    registra = [{ chiave: trappola.chiave, correct: false }]
  else if (!trappola && (d.formato === 'riconosci' || d.formato === 'senso'))
    registra = [{ chiave: chiaveF, correct: false }]       // ha preso un'altra frase: non è grammatica
  else
    registra = [{ chiave: chiaveF, correct: false },
                { chiave: chiaveForma((trappola && trappola.forma) || frase.forma), correct: false }]

  return {
    giusta, registra, scritta,
    trappola: trappola ? trappola.id : null,
    perche: giusta ? null : (trappola ? trappola.perche : null),
    siFa: giusta ? null : FORME[(trappola && trappola.forma) || frase.forma].regola,
    giustaEra: aSchermo(frase.es, eDomanda(frase), 'es'),
  }
}
