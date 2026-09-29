// La mappa del tesoro come stato: cosa è aperto, cosa è vinto, il grado di
// ogni tappa. L'avanzamento sta in profile.campagne.inglese (CHIAVE in
// dati/mondi.js), scritto da src/giochi/campagne.js come per tutti:
//   { tappa, libera, stelle, cfg,   ← la forma comune (tappa = quante vinte)
//     vinte: { <id tappa>: <quando> } }
// Un grado calato non richiude niente: aperto vuol dire vinto una volta.
import { MONDI, mondoDi, pronto } from '../dati/mondi.js'
import { gradoTappa } from './grado.js'
import { cassettoDi } from './grafo.js'

export const vinte = c => (c && c.vinte && typeof c.vinte === 'object' ? c.vinte : {})
export const vinta = (c, id) => !!vinte(c)[id]

export function mondoFinito(c, id) {
  const m = mondoDi(id)
  return !!m && pronto(m) && vinta(c, m.tappe[m.tappe.length - 1].id)
}

export function mondoAperto(c, id) {
  const m = mondoDi(id)
  if (!m || !pronto(m)) return false
  if (!m.dopo.every(d => mondoFinito(c, d))) return false
  return !m.dopoUno || !m.dopoUno.length || m.dopoUno.some(d => mondoFinito(c, d))
}

export function tappaAperta(c, id) {
  const m = MONDI.find(x => x.tappe.some(t => t.id === id))
  if (!m || !mondoAperto(c, m.id)) return false
  const i = m.tappe.findIndex(t => t.id === id)
  return i === 0 || vinta(c, m.tappe[i - 1].id) || vinta(c, id)
}

// il cassetto si apre alla prima tappa vinta del mondo
export const cassettoAperto = (c, id) => {
  const m = mondoDi(id)
  return !!m && pronto(m) && m.tappe.some(t => vinta(c, t.id))
}

// Segna una tappa vinta (la prima volta resta la data della prima volta).
// Torna vero se è la prima: il premio grosso è della prima volta.
export function segnaVinta(c, id, ora = Date.now()) {
  if (!c.vinte || typeof c.vinte !== 'object') c.vinte = {}
  const prima = !c.vinte[id]
  if (prima) c.vinte[id] = ora
  c.tappa = Object.keys(c.vinte).length
  const finale = MONDI.filter(m => m.prova && pronto(m))
  c.libera = finale.length > 0 && finale.every(m => mondoFinito(c, m.id))
  return prima
}

// Tutto quello che la mappa disegna, in un colpo.
export function statoMappa(c, forzaDi) {
  return MONDI.map(m => ({
    id: m.id, nome: m.nome, disegno: m.disegno || null, insegna: m.insegna, dopo: m.dopo, dopoUno: m.dopoUno || [],
    pronto: pronto(m), aperto: mondoAperto(c, m.id), finito: mondoFinito(c, m.id),
    tappe: m.tappe.map(t => ({
      id: t.id, nome: t.nome, disegno: t.disegno, bandiera: !!t.bandiera,
      aperta: tappaAperta(c, t.id), vinta: vinta(c, t.id), grado: gradoTappa(t, forzaDi),
    })),
    cassetto: pronto(m) ? { aperto: cassettoAperto(c, m.id), chiavi: cassettoDi(m.id).chiavi.length } : null,
  }))
}
