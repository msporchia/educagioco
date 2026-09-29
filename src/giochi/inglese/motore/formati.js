// Da una frase tutti i formati, e il giudizio di una risposta. Il formato
// lo decide la forza della frase (un gradino per punto): riconosci → cosa
// vuol dire → scegli → completa → monta → scegli e monta. Le parole tengono
// i tipi di oggi (data/domande.js). Vedi docs/lingue/mondi.md.
import { MAX_S } from '../../../store/srs.js'
import { FORME, chiaveForma } from '../dati/forme.js'
import { trappoleDi, scegliTrappole, vicineFra } from './trappole.js'
import { parole, inTappa, normalizza, accettate, eDomanda, inBella } from './testo.js'
import { chiaveDi, DET } from './lessico.js'
import { paroleNote } from './grafo.js'

export const FORMATI_FRASE = ['riconosci', 'senso', 'scegli', 'completa', 'monta', 'scegliMonta']
export const COMPONI = new Set(['completa', 'monta', 'scegliMonta'])

export const formatoPerForza = forza =>
  FORMATI_FRASE[Math.max(0, Math.min(FORMATI_FRASE.length - 1, Math.floor(forza || 0)))]

// «scegli e monta»: una tessera trappola, poi due, poi tre — la terza
// arriva quando anche la forma è al massimo (la forza si ferma a MAX_S)
export const tessereInPiu = (forza, forzaForma = 0) =>
  (forza <= 5 ? 1 : forzaForma >= MAX_S ? 3 : 2)

// le parole di struttura: quelle che «completa» toglie per prime
const STRUTTURA = new Set(Object.values(FORME).flatMap(f => f.parole.map(p => p.toLowerCase())))
const eStruttura = w => {
  const l = w.toLowerCase().replace(/[’']\w+$/, '')
  return STRUTTURA.has(l) || DET.has(l) || /[’']/.test(w)
}

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

// il contesto di una frase: la tappa (per la contrazione) e le altre frasi
// da cui pescare quando le trappole non bastano
export function contesto(frase, { tappa = null, altre = [], forzaForma = () => 0, rnd = Math.random } = {}) {
  const note = paroleNote(frase.mondo, frase.tappa)
  return { tappa, altre: altre.filter(f => f.id !== frase.id), forzaForma, rnd,
           vicine: vicineFra(note), note }
}

const opzione = (testo, giusta, trappola = null) => ({ testo, giusta, ...(trappola ? { trappola } : {}) })

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
  const en = inTappa(frase.en, tappa)
  const trappole = trappoleDi(frase, ctx)
  const forzaForma = ctx.forzaForma(frase.forma)
  const base = {
    genere: 'frase', formato, chiave: 'frase:' + frase.id, frase: frase.id,
    domandaIt: eDomanda(frase), regola: FORME[frase.forma].regola,
  }

  if (formato === 'riconosci' || formato === 'senso') {
    let sbagliate = []
    if (formato === 'senso')
      sbagliate = pesca(scegliTrappole(trappole.filter(t => t.it), 9, { forzaForma: ctx.forzaForma, rnd })
        .map(t => opzione(t.it, false, t)), 3, [frase.it], rnd)
    sbagliate.push(...pesca(altre.map(f => opzione(f.it, false)), 3 - sbagliate.length,
                            [frase.it, ...sbagliate.map(o => o.testo)], rnd))
    return { ...base, domanda: { testo: en, lingua: 'en' },
             opzioni: mescola([opzione(frase.it, true), ...sbagliate], rnd) }
  }

  if (formato === 'scegli') {
    const scelte = scegliTrappole(trappole, trappole.length, { forzaForma: ctx.forzaForma, rnd })
    const sbagliate = []
    const visti = new Set(accettate(frase))
    for (const t of scelte) {
      if (sbagliate.length >= 3) break
      const k = normalizza(t.en)
      if (visti.has(k)) continue
      visti.add(k); sbagliate.push(opzione(inTappa(t.en, tappa), false, t))
    }
    sbagliate.push(...pesca(altre.map(f => opzione(inTappa(f.en, tappa), false)), 3 - sbagliate.length,
                            [frase.en, ...sbagliate.map(o => o.testo)], rnd))
    return { ...base, domanda: { testo: frase.it, lingua: 'it' },
             opzioni: mescola([opzione(en, true), ...sbagliate], rnd) }
  }

  // i tre «componi»: la fila, le tessere, e dove vanno
  const T = parole(en)
  const tessere = T.map((testo, i) => ({ id: i, testo }))
  const out = { ...base, domanda: { testo: frase.it, lingua: 'it' }, soluzione: T.slice() }

  if (formato === 'completa') {
    const quanti = T.length <= 3 ? 1 : T.length <= 5 ? 2 : 3
    const strutt = T.map((w, i) => i).filter(i => eStruttura(T[i]))
    const altri = T.map((w, i) => i).filter(i => !eStruttura(T[i]))
    const buchi = [...mescola(strutt, rnd), ...mescola(altri, rnd)].slice(0, quanti).sort((a, b) => a - b)
    return { ...out,
             righe: T.map((testo, i) => (buchi.includes(i) ? { buco: buchi.indexOf(i) } : { testo })),
             tessere: mescolaDavvero(buchi.map(i => tessere[i]), rnd) }
  }
  if (formato === 'monta')
    return { ...out, tessere: mescolaDavvero(tessere, rnd) }

  // scegli e monta: le tessere in più sono le parole delle trappole che
  // nella frase giusta non ci sono
  const presenti = new Set(T.map(w => w.toLowerCase()))
  const extra = []
  for (const t of scegliTrappole(trappole, trappole.length, { forzaForma: ctx.forzaForma, rnd }))
    for (const w of parole(inTappa(t.en, tappa)))
      if (!presenti.has(w.toLowerCase()) && !extra.some(e => e.testo.toLowerCase() === w.toLowerCase()))
        extra.push({ testo: w, trappola: t })
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

export const rigaInBella = (d, idTessere) => inBella(composta(d, idTessere), { domanda: d.domandaIt })

// le chiavi delle parole di una frase che hanno una voce SRS
export const paroleDellaFrase = frase =>
  [...new Set(parole(frase.en).map(chiaveDi).filter(k => k && k.startsWith('en:')))]

/* Il giudizio: giusta o no, il perché e cosa segnare nello SRS.
   `risposta`: l'opzione toccata, o gli id delle tessere nella fila.
   `scadutaDi(chiave)`: vero se la parola è da ripassare — una frase giusta
   ripassa solo quelle. Uno sbaglio su una parola vicina pesa sulla parola,
   uno di grammatica sulla frase e sulla forma. */
export function giudica(frase, d, risposta, { scadutaDi = () => false, ctx = null } = {}) {
  const chiaveF = 'frase:' + frase.id
  const formaF = chiaveForma(frase.forma)
  let giusta, trappola = null, scritta = null
  if (COMPONI.has(d.formato)) {
    scritta = composta(d, risposta)
    giusta = accettate(frase).includes(normalizza(scritta))
    if (!giusta) {
      const k = normalizza(scritta)
      trappola = trappoleDi(frase, ctx || contesto(frase)).find(t => normalizza(t.en) === k) || null
    }
  } else {
    giusta = !!(risposta && risposta.giusta)
    trappola = (risposta && risposta.trappola) || null
  }

  let registra
  if (giusta)
    registra = [{ chiave: chiaveF, correct: true }, { chiave: formaF, correct: true },
                ...paroleDellaFrase(frase).filter(scadutaDi).map(chiave => ({ chiave, correct: true }))]
  else if (trappola && trappola.pesa === 'parola' && trappola.parola)
    registra = [{ chiave: 'en:' + trappola.parola, correct: false }]
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
    giustaEra: inBella(inTappa(frase.en, d && ctx ? ctx.tappa : null), { domanda: eDomanda(frase) }),
  }
}
