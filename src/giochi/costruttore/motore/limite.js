// Il Robot limitato da fuori (a scuola): i livelli dei capitoli scelti in fila, gli aiuti che fanno ragionare, e
// un'esecuzione raccontata in breve. Puro, gira in Node. Vedi docs/costruttore/scuola.md.
import { LIVELLI, CAPITOLI } from '../dati/livelli.js'
import { RAGIONA } from '../../aiuti.js'
import { fraseDi } from './esecutore.js'

// i capitoli del limite che esistono, nell'ordine della campagna; [] se non ce n'è nessuno
export function capitoliDel(limite) {
  const chiesti = limite && Array.isArray(limite.capitoli) ? limite.capitoli : []
  return CAPITOLI.map(c => c.chiave).filter(k => chiesti.includes(k))
}

// gli indici di LIVELLI da giocare in fila; null senza limite (casa)
export function filaDelLimite(limite) {
  const capitoli = capitoliDel(limite)
  if (!capitoli.length) return null
  return LIVELLI.map((l, i) => (capitoli.includes(l.capitolo) ? i : -1)).filter(i => i >= 0)
}

// il livello dopo `i` nella fila; finita la fila si ricomincia dal primo (`daCapo: true`)
export function dopo(fila, i) {
  const k = fila.indexOf(i)
  if (k < 0) return { indice: fila[0], daCapo: false }
  return k + 1 < fila.length ? { indice: fila[k + 1], daCapo: false } : { indice: fila[0], daCapo: true }
}

// a scuola il profilo non ha monete: restano i gradini gratis che fanno ragionare (docs/core/aiuti.md)
export const scalaDelLimite = scala => scala.filter(p => p.che === RAGIONA && !p.prezzo)

/* ── la risposta per la maestra: { chiave, giusta, ultima, fatto, data, attesa }, i testi ≤ LUNGO ── */
export const LUNGO = 40
export function taglia(s, n = LUNGO) {
  s = String(s ?? '').replace(/\s+/g, ' ').trim()
  if (s.length <= n) return s
  const corto = s.slice(0, n - 1)
  const spazio = corto.lastIndexOf(' ')
  return (spazio > n / 2 ? corto.slice(0, spazio) : corto).replace(/[\s,.;:·]+$/, '') + '…'
}

const quanti = (n, uno, tanti) => `${n} ${n === 1 ? uno : tanti}`

export function chiestoDa(liv) {
  const n = liv.ordini.length
  if (liv.prova === 'giornata') return n > 1 ? `${n} giornate che tornano` : 'la giornata che torna'
  const che = liv.prova === 'passaggio' ? "l'omino alla bandiera" : 'il disegno'
  return n > 1 ? `${che}, in ${n} ordini` : che
}

const OMINO = {
  muro: 'l\'omino trova un gradino alto', splash: 'l\'omino finisce in acqua', caduta: 'l\'omino fa un salto troppo alto',
  fuori: 'l\'omino esce dal cantiere', perso: 'l\'omino non arriva',
}

const minuscola = s => s.charAt(0).toLowerCase() + s.slice(1)
// la frase che il gioco dice, fino ai due punti o al punto: «il robot non può uscire dal cantiere»
const capo = s => minuscola(String(s).split(/[:.]/)[0].trim())

function successo(esito) {
  if (esito.errore) return capo(fraseDi(esito.errore))
  if (esito.confronto) {
    const c = esito.confronto, pezzi = []
    if (c.mancano.length) pezzi.push(`${c.mancano.length === 1 ? 'manca' : 'mancano'} ${quanti(c.mancano.length, 'mattone', 'mattoni')}`)
    if (c.troppi.length) pezzi.push(`${pezzi.length ? c.troppi.length : quanti(c.troppi.length, 'mattone', 'mattoni')} di troppo`)
    if (c.sbagliati.length) pezzi.push(`${quanti(c.sbagliati.length, 'colore sbagliato', 'colori sbagliati')}`)
    return pezzi.join(', ') || 'il disegno non torna'
  }
  if (esito.giornata) return capo(esito.giornata.frasi?.[0] || 'la giornata non torna')
  if (esito.omino) return OMINO[esito.omino.esito] || 'l\'omino non arriva'
  return 'non è venuto'
}

// un'esecuzione arrivata in fondo: vinta chiude il livello, persa lo lascia aperto (`ultima: false`)
export function raccontaEsecuzione(liv, esito) {
  const attesa = taglia(chiestoDa(liv))
  const giusta = !!esito.vinto
  return { chiave: `robot:${liv.chiave}`, giusta, ultima: giusta, fatto: taglia(liv.nome),
           data: giusta ? attesa : taglia(successo(esito)), attesa }
}
