// La campagna: la fila dei livelli, nella forma che si aspettano la mappa
// del gioco e `data/portata-giochi.js`. Vedi docs/costruttore/campagna.md.
import { LIVELLI, CAPITOLI } from './livelli.js'

export { CAPITOLI }

export const CAMPAGNA = LIVELLI.map(l => ({
  chiave: l.chiave,
  nome: l.nome,
  icona: l.icona,
  capitolo: l.capitolo,
  impara: l.impara,
  portata: l.portata,
  premio: l.premio,
}))

export const QUANTE_TAPPE = CAMPAGNA.length

// Ogni fila giocata resta scritta qui, per versione: vedi docs/costruttore/campagna.md.
export const FILE = {
  1: ['primo-muretto', 'torretta', 'muro-lungo', 'quanto-lungo', 'muro-alto', 'bosco', 'tempio',
      'castello', 'scala', 'piramide', 'buchi', 'ponte', 'muro-gemello'],
  2: ['primo-muretto', 'torretta', 'muro-lungo', 'quanto-lungo', 'muro-alto', 'torta',
      'sui-rossi', 'rosso-su-rosso', 'buchi', 'strisce', 'ponte',
      'bosco', 'tempio', 'castello', 'bandiere', 'villaggio',
      'scala', 'piramide', 'candele', 'muro-gemello', 'conta-rossi', 'scacchiera'],
  3: ['primo-muretto', 'torretta', 'muro-lungo', 'quanto-lungo', 'muro-alto', 'torta',
      'sui-rossi', 'rosso-su-rosso', 'buchi', 'strisce', 'ponte',
      'bosco', 'tempio', 'castello', 'bandiere', 'villaggio',
      'scala', 'piramide', 'candele',
      'primo-carico', 'stiva', 'rosse-e-blu', 'bolla', 'gru', 'nastro', 'smistamento', 'bottega',
      'muro-gemello', 'conta-rossi', 'scacchiera'],
  4: ['primo-muretto', 'torretta', 'muro-lungo', 'quanto-lungo', 'muro-alto', 'torta',
      'sui-rossi', 'rosso-su-rosso', 'buchi', 'strisce', 'ponte',
      'cinta', 'bosco', 'tempio', 'castello', 'bandiere', 'villaggio',
      'scala', 'piramide', 'candele',
      'primo-carico', 'stiva', 'rosse-e-blu', 'bolla', 'gru', 'nastro', 'smistamento', 'bottega',
      'muro-gemello', 'conta-rossi', 'scacchiera',
      'primo-camion', 'postino', 'frigo', 'pesce-fresco', 'due-lavori', 'giornata-porto'],
  5: ['primo-muretto', 'torretta', 'muro-lungo', 'quanto-lungo', 'muro-alto', 'torta',
      'sui-rossi', 'rosso-su-rosso', 'buchi', 'strisce', 'ponte',
      'cinta', 'bosco', 'tempio', 'castello', 'bandiere', 'villaggio',
      'scala', 'piramide', 'candele',
      'primo-carico', 'stiva', 'rosse-e-blu', 'bolla', 'gru', 'nastro', 'smistamento', 'bottega',
      'strade', 'porto-grande',
      'muro-gemello', 'conta-rossi', 'scacchiera',
      'primo-camion', 'postino', 'frigo', 'pesce-fresco', 'due-lavori', 'giornata-porto',
      'due-lettere', 'passata', 'in-ordine'],
}
export const FILA_ATTUALE = 5

export function riordina(av, vecchia, nuova = CAMPAGNA.map(t => t.chiave)) {
  const stelle = {}
  for (const [i, s] of Object.entries((av && av.stelle) || {})) {
    const j = nuova.indexOf(vecchia[Number(i)])
    if (j >= 0 && s > 0) stelle[j] = s
  }
  // fatto = ha stelle, o stava prima della tappa raggiunta (altrimenti un
  // avanzamento arrivato lì per altre strade tornerebbe a zero)
  const fatti = new Set([...vecchia.slice(0, (av && av.tappa) || 0), ...Object.keys(stelle).map(j => nuova[j])])
  let tappa = 0
  while (tappa < nuova.length && fatti.has(nuova[tappa])) tappa++
  return { stelle, tappa, libera: tappa >= nuova.length }
}

export const livello = indice => LIVELLI[Math.max(0, Math.min(indice, LIVELLI.length - 1))]

export const tappeDelCapitolo = chiave =>
  CAMPAGNA.map((t, i) => ({ ...t, indice: i })).filter(t => t.capitolo === chiave)

export function guastiDellaCampagna(campagna = CAMPAGNA) {
  const guasti = []
  const ordine = CAPITOLI.map(c => c.chiave)
  const fila = campagna.map(t => ordine.indexOf(t.capitolo))
  if (fila.some((n, i) => i > 0 && n < fila[i - 1])) guasti.push('i capitoli non sono in fila')
  for (const c of CAPITOLI)
    if (!campagna.some(t => t.capitolo === c.chiave)) guasti.push(`il capitolo «${c.chiave}» è vuoto`)
  if (campagna.some((t, i) => i > 0 && t.portata < campagna[i - 1].portata))
    guasti.push('la portata scende da un livello al successivo')
  return guasti
}
