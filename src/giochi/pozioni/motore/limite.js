/* A SCUOLA — le tappe delle famiglie e dei gradini scelti, in giro, e come si racconta una dose alla maestra.
   Puro, gira in Node: vedi docs/pozioni/scuola.md. */
import { CAMPAGNA } from '../dati/campagna.js'
import { scrivi } from '../dati/misure.js'
import { chiaveDi } from './misura.js'

// i testi che vanno alla maestra (il tetto del servizio, docs/scuola/protocollo.md)
export const LUNGO = 40

/* `{ famiglie, gradini }`: gli indici delle tappe di quelle famiglie a quei gradini, nell'ordine della campagna (le
   finali, a tre famiglie, no). Senza limite, o con un limite che non chiede niente, `null`: è casa */
export function tappeDelLimite(limite) {
  if (!limite || !Array.isArray(limite.famiglie) || !Array.isArray(limite.gradini)) return null
  const giro = CAMPAGNA.flatMap((t, i) => (t.famiglie.length === 1 && limite.famiglie.includes(t.famiglie[0]) &&
    limite.gradini.includes(t.gradino) ? [i] : []))
  return giro.length ? giro : null
}

// finita l'ultima si ricomincia dalla prima
export const dopoNelGiro = (giro, i) => giro[(giro.indexOf(i) + 1) % giro.length]

// tagliato a una parola intera, senza un «+» appeso, coi puntini
export function corto(s) {
  if (s.length <= LUNGO) return s
  const t = s.slice(0, LUNGO - 1), spazio = t.lastIndexOf(' ')
  return (spazio > LUNGO / 2 ? t.slice(0, spazio) : t).replace(/[\s+·:,]+$/, '') + '…'
}

// le dosi che un ordine decide, già raccontate (quali e con che chiave: docs/pozioni/scuola.md); `comprate[i]`, le etichette
// entrate nell'ingrediente i, qui si allunga
export function risposteDellOrdine(bottega, esiti, comprate, ms) {
  const fuori = []
  for (const e of esiti) {
    const g = bottega.ingredienti[e.ingrediente], o = g.offerte[e.ampolla]
    const comune = { chiave: chiaveDi(o.unita, g.unita) || `pozioni:${g.unita}`, ms: Math.round(ms),
                     fatto: corto(`${scrivi(g.dose, g.unita)} di ${g.nome}`) }
    if (e.tipo === 'trabocca') {
      const manca = g.dose - e.prima
      fuori.push({ ...comune, giusta: false, ultima: false,
                   data: corto(e.prima ? `${e.testo} su ${scrivi(e.prima, g.unita)}` : e.testo),
                   attesa: corto(manca > 0 ? `ne mancavano ${scrivi(manca, g.unita)}` : 'era già al segno') })
      continue
    }
    const sue = (comprate[e.ingrediente] ||= [])
    sue.push(e.testo)
    if (e.pieno) fuori.push({ ...comune, giusta: true, ultima: true, data: corto(sue.join(' + ')),
                              attesa: corto(g.ottimo.pezzi.map(k => scrivi(g.offerte[k].base, g.offerte[k].unita)).join(' + ')) })
  }
  return fuori
}
