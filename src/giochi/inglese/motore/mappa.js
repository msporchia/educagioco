// La mappa del tesoro come stato: cosa è aperto, cosa è vinto, cosa è
// «passato» per età, il grado di ogni tappa. L'avanzamento sta in
// profile.campagne.inglese (CHIAVE in dati/mondi.js), scritto da
// src/giochi/campagne.js come per tutti:
//   { tappa, libera, stelle, cfg,   ← la forma comune (tappa = quante vinte)
//     vinte: { <id tappa>: <quando> } }
// Un grado calato non richiude niente: aperto vuol dire vinto una volta.
//
// Le regole (`r`): { tutto, eta }. `tutto` è «Sblocca tutti i livelli» dei
// grandi (settings.tuttoAperto), che passa davanti a tutto; `eta` apre come
// «passati» i mondi degli anni di scuola che il bambino ha già fatto. Per
// compatibilità `r` può essere anche solo il booleano di `tutto`.
import { MONDI, mondoDi, pronto } from '../dati/mondi.js'
import { miraDi } from '../../../data/portata.js'
import { gradoTappa } from './grado.js'
import { cassettoDi } from './grafo.js'
import { quanteVinte } from './travaso.js'

const regole = r => (typeof r === 'boolean' ? { tutto: r } : r || {})

export const vinte = c => (c && c.vinte && typeof c.vinte === 'object' ? c.vinte : {})
export const vinta = (c, id) => !!vinte(c)[id]

// Un mondo è passato quando tutte le sue tappe stanno sotto la mira
// dell'età (data/portata.js, la stessa di ogni campagna): la scuola gliel'ha
// già dato. Si apre tutto, da ripassare quando vuole; non è vinto.
export function mondoPassato(id, eta) {
  const m = mondoDi(id)
  const mira = miraDi(eta)
  return !!m && pronto(m) && !!mira && m.tappe.every(t => t.portata < mira[0])
}

export function mondoFinito(c, id) {
  const m = mondoDi(id)
  return !!m && pronto(m) && vinta(c, m.tappe[m.tappe.length - 1].id)
}

// una dipendenza è soddisfatta da un mondo finito o passato
const fatto = (c, id, eta) => mondoFinito(c, id) || mondoPassato(id, eta)

export function mondoAperto(c, id, r) {
  const { tutto = false, eta = null } = regole(r)
  const m = mondoDi(id)
  if (!m || !pronto(m)) return false
  if (tutto || mondoPassato(id, eta)) return true
  if (!m.dopo.every(d => fatto(c, d, eta))) return false
  return !m.dopoUno || !m.dopoUno.length || m.dopoUno.some(d => fatto(c, d, eta))
}

export function tappaAperta(c, id, r) {
  const { tutto = false, eta = null } = regole(r)
  const m = MONDI.find(x => x.tappe.some(t => t.id === id))
  if (!m || !mondoAperto(c, m.id, r)) return false
  if (tutto || mondoPassato(m.id, eta)) return true
  const i = m.tappe.findIndex(t => t.id === id)
  return i === 0 || vinta(c, m.tappe[i - 1].id) || vinta(c, id)
}

// il cassetto si apre alla prima tappa vinta del mondo (o col mondo passato)
export const cassettoAperto = (c, id, r) => {
  const { tutto = false, eta = null } = regole(r)
  const m = mondoDi(id)
  return !!m && pronto(m) && (tutto || mondoPassato(id, eta) || m.tappe.some(t => vinta(c, t.id)))
}

// Segna una tappa vinta (la prima volta resta la data della prima volta).
// Torna vero se è la prima: il premio grosso è della prima volta.
export function segnaVinta(c, id, ora = Date.now()) {
  if (!c.vinte || typeof c.vinte !== 'object') c.vinte = {}
  const prima = !c.vinte[id]
  if (prima) c.vinte[id] = ora
  c.tappa = quanteVinte(c.vinte)
  const finale = MONDI.filter(m => m.prova && pronto(m))
  c.libera = finale.length > 0 && finale.every(m => mondoFinito(c, m.id))
  return prima
}

// Tutto quello che la mappa disegna, in un colpo.
export function statoMappa(c, forzaDi, r) {
  const { eta = null } = regole(r)
  return MONDI.map(m => ({
    id: m.id, anno: m.anno || null, nome: m.nome, disegno: m.disegno || null, insegna: m.insegna,
    dopo: m.dopo, dopoUno: m.dopoUno || [],
    pronto: pronto(m), aperto: mondoAperto(c, m.id, r), finito: mondoFinito(c, m.id),
    passato: mondoPassato(m.id, eta),
    tappe: m.tappe.map(t => ({
      id: t.id, nome: t.nome, disegno: t.disegno, bandiera: !!t.bandiera, frasi: !!t.frasi,
      aperta: tappaAperta(c, t.id, r), vinta: vinta(c, t.id), grado: gradoTappa(t, forzaDi),
    })),
    cassetto: pronto(m) ? { aperto: cassettoAperto(c, m.id, r), chiavi: cassettoDi(m.id).chiavi.length } : null,
  }))
}

// Cosa serve per aprire un nodo chiuso della mappa, detto al bambino quando
// lo tocca (la nave non parte). `stato` è quello di statoMappa, `n` un nodo
// della disposizione ({ tipo, id, mondo }); `extra` quello che il gioco
// dice del libro e del cassetto di quel mondo ({ libro: { serve } }).
export function cosaServe(stato, n, extra = null) {
  const m = stato.find(x => x.id === n.mondo)
  if (!m) return ''
  if (n.tipo === 'mondo' || !m.pronto) return 'Questo mondo arriva presto'
  const nome = id => `«${(stato.find(x => x.id === id) || {}).nome || id}»`
  if (!m.aperto) {
    const fatto = d => { const x = stato.find(y => y.id === d) || {}; return x.finito || x.passato }
    const manca = m.dopo.filter(d => !fatto(d))
    if (manca.length) return `Prima finisci ${nome(manca[0])}`
    if (m.dopoUno.length) return `Prima finisci ${m.dopoUno.map(nome).join(' o ')}`
  }
  if (n.tipo === 'libro') return (extra && extra.libro && extra.libro.serve) || 'Si apre quando arrivi alla bandiera'
  if (n.tipo === 'cassetto') return 'Si apre quando vinci una tappa di questo mondo'
  const i = m.tappe.findIndex(t => t.id === n.id)
  return i > 0 ? `Prima vinci «${m.tappe[i - 1].nome}»` : ''
}
