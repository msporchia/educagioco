// Il conto puro del foglio «Inventario» (Inventario.vue), senza DOM: quali merci stanno in quale scheda, in che ordine, «a cosa
// serve» una merce e se è entrata roba nuova. Vedi docs/fattoria3d/file.md («Il foglio dell'inventario»).
import { COLTURE } from '../dati/colture.js'
import { RICETTE, merceDi } from '../dati/ricette.js'
import { PRODOTTI_ANIMALI, LANA, CORTILE } from '../dati/animali.js'
import { PECORE } from '../dati/regole.js'
import { PESCI } from '../dati/pesca.js'
import { EDIFICI } from '../dati/catalogo.js'
import { livelloDellaColtura } from '../dati/livelli.js'

export const SCHEDE = [
  { id: 'raccolti', emoji: '🌾', nome: 'Raccolti' },
  { id: 'prodotti', emoji: '🧺', nome: 'Prodotti' },
  { id: 'altro', emoji: '🧶', nome: 'Lana e altro' },
]

/** Le tre schede: `{ raccolti, prodotti, altro }`, ognuna `[{ k, n, nome, emoji, velata }]`.
    Raccolti: tutte le colture arrivate al livello, nell'ordine dei dati, con le vuote velate. Prodotti: le ricette che hai (> 0), nell'ordine
    delle macchine. Altro: lana, uova, latte che hai (> 0). `s` ha `merci`, `prodotti` e `lana` come lo stato del motore. */
export function schedeDellInventario(s, livello) {
  const merci = s.merci || {}, prodotti = s.prodotti || {}
  const voce = (k, n) => { const m = merceDi(k) || {}; return { k, n, nome: m.nome || k, emoji: m.emoji || '❔', velata: n <= 0 } }
  const raccolti = Object.keys(COLTURE).filter(k => livelloDellaColtura(k) <= livello || (merci[k] || 0) > 0).map(k => voce(k, merci[k] || 0))
  const prodottiVoci = Object.keys(RICETTE).filter(k => (prodotti[k] || 0) > 0).map(k => voce(k, prodotti[k]))
  const altro = [...Object.keys(LANA).map(k => voce(k, k === 'lana' ? (s.lana || 0) : (prodotti[k] || 0))),
    ...Object.keys(PRODOTTI_ANIMALI).map(k => voce(k, prodotti[k] || 0))].filter(v => v.n > 0)
  return { raccolti, prodotti: prodottiVoci, altro }
}

/** Quante merci diverse hai (n > 0) in una scheda. */
export const tipiDi = voci => voci.filter(v => v.n > 0).length

/** Le ricette (nomi) che usano la merce come ingrediente, nell'ordine dei dati. */
export const serveA = k => Object.values(RICETTE).filter(r => r.ing && r.ing[k]).map(r => r.nome)

/** Le bestie che mangiano quel mangime (becchime: galline; foraggio: pecore e mucche), nell'ordine del cortile. */
export const bestieChe = k => Object.entries(CORTILE).filter(([t, a]) => (t === 'recinto' ? PECORE.mangia : a.mangia).includes(k)).map(([, a]) => a.bestie)

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
