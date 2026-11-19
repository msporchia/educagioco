/* A SCUOLA — le tappe scelte dalla maestra in giro, e come si racconta una
   risposta. Puro, gira in Node: vedi docs/lingue/scuola.md. */
import { MONDI } from '../dati/mondi.js'
import { COMPONI, rigaInBella } from './formati.js'

// i testi che vanno alla maestra (il tetto del servizio, docs/scuola/protocollo.md)
export const LUNGO = 40

/* `{ isola, tappe }`: gli id delle tappe scelte, nell'ordine dell'isola.
   Senza limite, o con un limite che non chiede niente, `null`: è casa */
export function tappeDelLimite(limite) {
  if (!limite || typeof limite !== 'object' || !Array.isArray(limite.tappe)) return null
  const m = MONDI.find(x => x.id === limite.isola)
  if (!m) return null
  const giro = m.tappe.map(t => t.id).filter(id => limite.tappe.includes(id))
  return giro.length ? giro : null
}

// finita l'ultima si ricomincia dalla prima
export const dopoNelGiro = (giro, id) => giro[(giro.indexOf(id) + 1) % giro.length]

// a una parola intera coi puntini; una parola sola troppo lunga, senza spezzare un'emoji
export function corto(s) {
  const t = String(s ?? '').replace(/\s+/g, ' ').trim()
  if (t.length <= LUNGO) return t
  const spazio = t.slice(0, LUNGO).lastIndexOf(' ')
  if (spazio > LUNGO / 2) return t.slice(0, spazio).replace(/[\s,;:.]+$/, '') + '…'
  let fuori = ''
  for (const p of Array.from(t)) { if (fuori.length + p.length > LUNGO - 1) break; fuori += p }
  return fuori + '…'
}

// la consegna in breve: cosa chiede il formato, e il testo che il bambino ha davanti
const CHIEDE = {
  figura: 'La figura', ascoltoFigura: 'Ascolta, la figura', tradIt: 'Che vuol dire', ascoltoIt: 'Ascolta, che vuol dire',
  tradStra: 'In inglese', riconosci: 'Che vuol dire', senso: 'Che vuol dire', scegli: 'In inglese',
  completa: 'Completa', monta: 'In ordine', scegliMonta: 'Componi',
}

/* Una risposta per la maestra: `d` la domanda della sessione, `risposta`
   l'opzione toccata o gli id delle tessere in fila, `esito` quello di
   `Sessione.rispondi`. Torna `{ fatto, data, attesa }`, ognuno ≤ LUNGO */
export function racconta(d, risposta, esito) {
  const q = d.domanda || {}
  const testo = q.testo || q.svela || q.ascolta || ''
  const fatto = corto(`${CHIEDE[d.formato] || 'Domanda'}: ${testo}`)
  if (COMPONI.has(d.formato))
    return { fatto, data: corto(rigaInBella(d, Array.isArray(risposta) ? risposta : [])), attesa: corto(esito.giustaEra) }
  const giusta = (d.opzioni || []).find(o => o.giusta)
  return { fatto, data: corto(risposta ? risposta.testo : '—'), attesa: corto(giusta ? giusta.testo : '') }
}
