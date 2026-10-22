// Il conto puro del foglio «Inventario» (Inventario.vue), senza DOM: quali merci stanno in quale scheda, in che ordine, «a cosa
// serve» una merce e se è entrata roba nuova. Vedi docs/fattoria3d/file.md («Il foglio dell'inventario»).
import { COLTURE } from '../dati/colture.js'
import { RICETTE, merceDi } from '../dati/ricette.js'
import { PRODOTTI_ANIMALI, LANA } from '../dati/animali.js'
import { serveA, bestieChe } from '../dati/usi.js'
import { MANGIMI_SENZA_RICETTA } from '../dati/cortile2.js'
import { PESCI } from '../dati/pesca.js'
import { EDIFICI } from '../dati/catalogo.js'
import { livelloDellaColtura } from '../dati/livelli.js'

export const SCHEDE = [
  { id: 'raccolti', emoji: '🌾', nome: 'Raccolti' },
  { id: 'prodotti', emoji: '🧺', nome: 'Prodotti' },
  { id: 'altro', emoji: '🧶', nome: 'Lana e altro' },
]

/** Le tre schede: `{ raccolti, prodotti, altro }`, ognuna `[{ k, n, nome, emoji, velata, max?, pieno? }]`.
    Raccolti: tutte le colture arrivate al livello, nell'ordine dei dati, con le vuote velate. Prodotti: le ricette che hai (> 0), nell'ordine
    delle macchine. Altro: lana, uova, latte che hai (> 0). `s` ha `merci`, `prodotti` e `lana` come lo stato del motore. */
export function schedeDellInventario(s, livello, capienzaDi = null) {
  const merci = s.merci || {}, prodotti = s.prodotti || {}
  // `capienzaDi(k)`: quanti pezzi tiene lo scomparto di quella merce (dati/silos.js); senza, nessun tetto da mostrare
  const voce = (k, n) => {
    const m = merceDi(k) || {}, max = capienzaDi ? capienzaDi(k) : null
    return { k, n, nome: m.nome || k, emoji: m.emoji || '❔', velata: n <= 0, ...(Number.isFinite(max) ? { max, pieno: n >= max } : {}) }
  }
  const raccolti = Object.keys(COLTURE).filter(k => livelloDellaColtura(k) <= livello || (merci[k] || 0) > 0).map(k => voce(k, merci[k] || 0))
  const prodottiVoci = [...Object.keys(RICETTE), ...Object.keys(MANGIMI_SENZA_RICETTA)].filter(k => (prodotti[k] || 0) > 0).map(k => voce(k, prodotti[k]))
  const altro = [...Object.keys(LANA).map(k => voce(k, k === 'lana' ? (s.lana || 0) : (prodotti[k] || 0))),
    ...Object.keys(PRODOTTI_ANIMALI).map(k => voce(k, prodotti[k] || 0))].filter(v => v.n > 0)
  return { raccolti, prodotti: prodottiVoci, altro }
}

/** Quante merci diverse hai (n > 0) in una scheda. */
export const tipiDi = voci => voci.filter(v => v.n > 0).length

// «serveA» (le ricette che la usano) e «bestieChe» (chi la mangia) stanno in dati/usi.js, con «Come si fa»: si ridicono da qui per chi le importava.
export { serveA, bestieChe }

/** Il «nome — a cosa serve» di una merce, in una frase per bambini. */
export function dettaglioDi(k) {
  const m = merceDi(k); if (!m) return ''
  const r = RICETTE[k], usi = serveA(k), dove = r && EDIFICI[r.dove]
  const parti = []
  if (dove) parti.push(`Si prepara: ${dove.nome}.`)
  else if (PESCI[k]) parti.push('Si pesca dal molo, nei laghi, nei laghetti e nel mare.')
  else if (PRODOTTI_ANIMALI[k] || LANA[k]) { const p = EDIFICI[(PRODOTTI_ANIMALI[k] || LANA[k]).dove]; if (p) parti.push(`Lo fanno gli animali: ${p.nome}.`) }
  const mangiano = bestieChe(k)
  if (mangiano.length) parti.push(`Mangime per ${mangiano.join(' e ')}.`)
  if (usi.length) parti.push(`Serve per: ${usi.join(', ')}.`)
  else if (!mangiano.length && !m.mangime) parti.push('Non serve per cucinare: si consegna al banco o in mongolfiera.')
  if (m.mangime && !mangiano.length && usi.length) parti.push('Non si consegna: serve a fare il mangime.')
  return parti.join(' ')
}

/** Dal conto di prima (`visto`: `{ k: n }`) a quello di adesso: è entrata roba? Vale solo l'aumento, non il consumo. */
export function robaNuova(visto, s) {
  const adesso = contoDi(s)
  for (const k in adesso) if (adesso[k] > (visto[k] || 0)) return true
  return false
}
/** Il conto piatto di tutto ciò che c'è: `{ k: n }` (raccolti, prodotti, lana). */
export function contoDi(s) {
  const o = {}
  for (const [k, n] of Object.entries(s.merci || {})) if (n > 0) o[k] = n
  for (const [k, n] of Object.entries(s.prodotti || {})) if (n > 0) o[k] = n
  if (s.lana > 0) o.lana = s.lana
  return o
}
