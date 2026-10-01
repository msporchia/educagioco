// Il grafo letto: quali mondi sono sicuramente fatti prima di un altro,
// quali parole un bambino conosce a una tappa data, le chiavi SRS di una
// tappa, l'argomento di una parola e il 📦 cassetto di un mondo.
import { WORDS } from '../../../data/words.js'
import { VERBI } from '../../../data/verbi.js'
import { MONDI, mondoDi, CATEGORIE_DI_STRUTTURA } from '../dati/mondi.js'
import { FORME, chiaveForma } from '../dati/forme.js'
import { FRASI } from '../dati/frasi.js'
import { PERSONAGGI } from '../dati/elenchi.js'
import { chiaveNellArgomento, paroleDellArgomento, ARGOMENTI } from '../dati/argomenti.js'
import { nomeDi, NOMI_PROPRI } from './lessico.js'
import { espandi } from './testo.js'
import { flessa } from './flessioni.js'

// I mondi certamente finiti quando si entra in `id`: le dipendenze «tutti»
// per intero, e di quelle «basta uno» solo quello che hanno in comune.
export function garantiti(id) {
  const m = mondoDi(id)
  if (!m) return new Set()
  const out = new Set()
  for (const d of m.dopo) { out.add(d); for (const x of garantiti(d)) out.add(x) }
  if (m.dopoUno && m.dopoUno.length) {
    const rami = m.dopoUno.map(d => new Set([d, ...garantiti(d)]))
    for (const x of rami[0]) if (rami.every(r => r.has(x))) out.add(x)
  }
  return out
}

// le tappe già fatte quando si gioca `tappaId` nel mondo `mondoId` (compresa
// lei); senza tappa, il mondo intero
function tappeFatte(mondoId, tappaId = null) {
  const fuori = [...garantiti(mondoId)].flatMap(id => mondoDi(id).tappe)
  const m = mondoDi(mondoId)
  const i = tappaId ? m.tappe.findIndex(x => x.id === tappaId) : m.tappe.length - 1
  return [...fuori, ...m.tappe.slice(0, i + 1)]
}

// Le parole che il bambino ha incontrato: quelle delle tappe, le parole di
// struttura delle loro forme e i nomi dei personaggi. In minuscolo.
export function paroleNote(mondoId, tappaId = null) {
  const s = new Set(PERSONAGGI.map(p => p.nome.toLowerCase()))
  for (const x of tappeFatte(mondoId, tappaId)) {
    for (const p of x.parole) s.add(p.toLowerCase())
    for (const f of x.forme || []) for (const p of FORME[f].parole) s.add(p.toLowerCase())
  }
  return s
}

export const formeNote = (mondoId, tappaId = null) =>
  new Set(tappeFatte(mondoId, tappaId).flatMap(x => x.forme || []))

// Il libro sa anche le strutture dichiarate dai mondi (quarta, quinta:
// `strutture`), dal suo e da quelli prima, già dalla prima pagina: sono il
// programma dell'anno, e una storia a metà isola le può usare prima della
// loro tappa di frasi.
const struttureDi = mondoId => [...garantiti(mondoId), mondoId].flatMap(id => mondoDi(id).strutture || [])
export const formeDelLibro = (mondoId, tappaId = null) =>
  new Set([...formeNote(mondoId, tappaId), ...struttureDi(mondoId)])
export function paroleDelLibro(mondoId, tappaId = null) {
  const s = paroleNote(mondoId, tappaId)
  for (const f of struttureDi(mondoId)) for (const p of FORME[f].parole) s.add(p.toLowerCase())
  return s
}
// le forme dei verbi e degli aggettivi che quelle strutture ammettono (s, ing, ed, irr, er, est)
export const flessioniDi = forme =>
  new Set([...forme].flatMap(f => [].concat((FORME[f] && FORME[f].flessione) || [])))
// quelle che una frase componibile può usare alla sua tappa
export const flessioniNote = (mondoId, tappaId = null) => flessioniDi(formeNote(mondoId, tappaId))

// Una parola a schermo è nota se lo è lei, la sua forma lunga («it's» → it
// is) o il suo singolare («dogs» → dog), o se è un verbo noto flesso come
// una struttura ammette (`flessioni`: «went» solo dove c'è il passato).
// Torna le parole che non lo sono.
export function sconosciute(testo, note, flessioni = null) {
  const out = []
  for (const w of espandi(testo)) {
    if (note.has(w) || NOMI_PROPRI.has(w)) continue
    const n = nomeDi(w)
    if (n && note.has(n.base)) continue
    const f = flessioni && flessa(w)
    if (f && flessioni.has(f.come) && note.has(f.base)) continue
    const poss = w.match(/^(\w+)'s$/)
    if (poss && (NOMI_PROPRI.has(poss[1]) || note.has(poss[1]))) continue
    out.push(w)
  }
  return out
}

export const chiaveParola = p => 'en:' + p
export const chiaveFrase = id => 'frase:' + id

// la chiave SRS di una parola nuova di una tappa (un verbo è `verbo:`)
export const chiaveDellaTappa = (tappa, p) => chiaveNellArgomento(tappa.argomento, p)

const mondoDellaBandiera = tappa => MONDI.find(x => x.tappe.some(y => y.id === tappa.id))

// le frasi componibili di una tappa, o di tutto il mondo per la 🏁
export function frasiDi(tappa) {
  if (tappa.bandiera) return FRASI.filter(f => f.mondo === mondoDellaBandiera(tappa).id)
  return FRASI.filter(f => f.tappa === tappa.id)
}

// Le chiavi SRS di una tappa: le parole nuove, o le frasi e le forme. Per la
// 🏁 tutte quelle del mondo.
export function vociDi(tappa) {
  if (tappa.cassetto) return tappa.chiavi.slice()
  if (tappa.bandiera)
    return [...new Set(mondoDellaBandiera(tappa).tappe.filter(x => !x.bandiera).flatMap(vociDi))]
  return [
    ...tappa.parole.map(p => chiaveDellaTappa(tappa, p)),
    ...frasiDi(tappa).map(f => chiaveFrase(f.id)),
    ...(tappa.forme || []).map(chiaveForma),
  ]
}

// Chi insegna una chiave: la tappa di parole (e da lì il suo argomento)
const IN_TAPPA = new Map()
for (const m of MONDI) for (const t of m.tappe) for (const p of t.parole) IN_TAPPA.set(chiaveDellaTappa(t, p), t)

export const tappaCheInsegna = chiave => IN_TAPPA.get(chiave) || null

// Il gruppo di una parola per le «parole vicine»: il suo argomento se una
// tappa la insegna, se no la sua categoria. `w` in minuscolo.
const GRUPPO = new Map()
for (const [k, t] of IN_TAPPA) GRUPPO.set(k.replace(/^\w+:/, '').toLowerCase(), 'arg:' + t.argomento)
for (const w of WORDS) if (!GRUPPO.has(w[0].toLowerCase())) GRUPPO.set(w[0].toLowerCase(), 'cat:' + w[3])
for (const v of VERBI) if (!GRUPPO.has(v[0])) GRUPPO.set(v[0], 'arg:azioni')
export const gruppoDi = w => GRUPPO.get(String(w).toLowerCase()) || null

// Da dove vengono le risposte sbagliate di una domanda su una parola: le
// parole della sua tappa, poi il resto del suo argomento, poi gli argomenti
// vicini. Null per chi non sta in una tappa (il cassetto: i distrattori di sempre).
export function fontiDi(chiave, voceDi) {
  const t = tappaCheInsegna(chiave)
  if (!t) return null
  const pre = chiave.startsWith('verbo:') ? 'verbo:' : 'en:'
  const voci = lista => lista.map(p => voceDi(pre + p)).filter(Boolean)
  const a = ARGOMENTI[t.argomento]
  return [voci(t.parole), voci(paroleDellArgomento(t.argomento)),
          ...(a.vicini || []).map(v => voci(paroleDellArgomento(v)))]
}

// 📦 Le parole delle categorie del mondo che nessuna tappa insegna (e per chi
// ha `verbi`, i verbi). Nessuna chiave sparisce: sta in una tappa o qui.
export function cassettoDi(mondoId) {
  const m = mondoDi(mondoId)
  if (!m) return null
  const parole = WORDS.filter(w => m.categorie.includes(w[3]) && !CATEGORIE_DI_STRUTTURA.includes(w[3]) &&
                                   !IN_TAPPA.has(chiaveParola(w[0]))).map(w => chiaveParola(w[0]))
  const verbi = m.verbi ? VERBI.map(v => 'verbo:' + v[0]).filter(k => !IN_TAPPA.has(k)) : []
  return { id: mondoId + ':cassetto', mondo: mondoId, cassetto: true, nome: '📦 Il cassetto',
           chiavi: [...parole, ...verbi] }
}

// usato dai controlli: ogni parola di words.js sta in una tappa o in un cassetto
export function doveSta(parola) {
  if (IN_TAPPA.has(chiaveParola(parola))) return 'tappa'
  const w = WORDS.find(x => x[0] === parola)
  if (!w) return null
  if (CATEGORIE_DI_STRUTTURA.includes(w[3])) return 'struttura'
  return MONDI.some(m => m.categorie.includes(w[3])) ? 'cassetto' : null
}

export const mondoDellaTappa = tappaId => MONDI.find(m => m.tappe.some(x => x.id === tappaId)) || null
