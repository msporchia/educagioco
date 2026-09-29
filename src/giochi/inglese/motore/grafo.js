// Il grafo letto: quali mondi sono sicuramente fatti prima di un altro,
// quali parole un bambino conosce a una tappa data, le chiavi SRS di una
// tappa e il 📦 cassetto di un mondo.
import { WORDS } from '../../../data/words.js'
import { VERBI } from '../../../data/verbi.js'
import { MONDI, mondoDi, CATEGORIE_DI_STRUTTURA } from '../dati/mondi.js'
import { FORME, chiaveForma } from '../dati/forme.js'
import { FRASI } from '../dati/frasi.js'
import { PERSONAGGI } from '../dati/elenchi.js'
import { nomeDi, NOMI_PROPRI } from './lessico.js'
import { espandi } from './testo.js'

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
    if (x.forma) for (const p of FORME[x.forma].parole) s.add(p.toLowerCase())
  }
  return s
}

export const formeNote = (mondoId, tappaId = null) =>
  new Set(tappeFatte(mondoId, tappaId).map(x => x.forma).filter(Boolean))

// Una parola a schermo è nota se lo è lei, la sua forma lunga («it's» → it
// is) o il suo singolare («dogs» → dog). Torna le parole che non lo sono.
export function sconosciute(testo, note) {
  const out = []
  for (const w of espandi(testo)) {
    if (note.has(w) || NOMI_PROPRI.has(w)) continue
    const n = nomeDi(w)
    if (n && note.has(n.base)) continue
    const poss = w.match(/^(\w+)'s$/)
    if (poss && NOMI_PROPRI.has(poss[1])) continue
    out.push(w)
  }
  return out
}

export const chiaveParola = p => 'en:' + p
export const chiaveFrase = id => 'frase:' + id

// le frasi componibili di una tappa, o di tutto il mondo per la 🏁
export function frasiDi(tappa) {
  if (tappa.bandiera) {
    const m = MONDI.find(x => x.tappe.some(y => y.id === tappa.id))
    return FRASI.filter(f => f.mondo === m.id)
  }
  return FRASI.filter(f => f.tappa === tappa.id)
}

// Le chiavi SRS di una tappa: le parole nuove, le frasi, la forma. Per la 🏁
// tutte quelle del mondo.
export function vociDi(tappa) {
  if (tappa.cassetto) return tappa.chiavi.slice()
  if (tappa.bandiera) {
    const m = MONDI.find(x => x.tappe.some(y => y.id === tappa.id))
    return [...new Set(m.tappe.filter(x => !x.bandiera).flatMap(vociDi))]
  }
  return [
    ...tappa.parole.map(chiaveParola),
    ...frasiDi(tappa).map(f => chiaveFrase(f.id)),
    chiaveForma(tappa.forma),
  ]
}

// 📦 Le parole delle categorie del mondo che nessuna tappa insegna (e per chi
// ha `verbi`, i verbi). Nessuna chiave sparisce: sta in una tappa o qui.
const IN_TAPPA = new Set(MONDI.flatMap(m => m.tappe.flatMap(x => x.parole)))

export function cassettoDi(mondoId) {
  const m = mondoDi(mondoId)
  if (!m) return null
  const parole = WORDS.filter(w => m.categorie.includes(w[3]) && !CATEGORIE_DI_STRUTTURA.includes(w[3]) &&
                                   !IN_TAPPA.has(w[0])).map(w => chiaveParola(w[0]))
  const verbi = m.verbi ? VERBI.map(v => 'verbo:' + v[0]) : []
  return { id: mondoId + ':cassetto', mondo: mondoId, cassetto: true, nome: '📦 Il cassetto',
           chiavi: [...parole, ...verbi] }
}

// usato dai controlli: ogni parola di words.js sta in una tappa o in un cassetto
export function doveSta(parola) {
  if (IN_TAPPA.has(parola)) return 'tappa'
  const w = WORDS.find(x => x[0] === parola)
  if (!w) return null
  if (CATEGORIE_DI_STRUTTURA.includes(w[3])) return 'struttura'
  return MONDI.some(m => m.categorie.includes(w[3])) ? 'cassetto' : null
}

export const mondoDellaTappa = tappaId => MONDI.find(m => m.tappe.some(x => x.id === tappaId)) || null

