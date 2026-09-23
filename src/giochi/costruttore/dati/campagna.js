/* ═══════════════════════════════════════════════════════════════════
   LA CAMPAGNA — i livelli in fila, come li vede il resto dell'app

   Il dato vero sta in `dati/livelli.js`; qui c'è la fila nella forma che
   si aspettano la mappa del gioco, `giochi/campagne.js` e
   `data/portata-giochi.js` (che decide, dall'età, cosa nasce aperto e
   cosa arriva più avanti). Una tappa = un livello: il costruttore non
   pesca a caso, ogni livello è un ordine scritto a mano.
   ═══════════════════════════════════════════════════════════════════ */
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

/* ═══════════ quando la fila cambia ordine ═══════════
   Le stelle di `profile.campagne.costruttore` stanno sotto **l'indice**
   del livello (è la forma di tutte le campagne, `giochi/campagne.js`), e
   il 23 settembre 2026 i livelli sono passati da tredici a ventidue, col
   capitolo del «se» spostato subito dopo il cantiere. Rimescolare senza
   dirlo avrebbe messo le stelle del bosco sul livello dei nidi.

   Ogni fila che è stata giocata resta scritta qui, per versione, e il
   profilo dice quale conosce (`cfg.fila`): chi arriva da una fila vecchia
   ha le stelle rimesse al loro livello per chiave, e la tappa ricontata
   come i livelli vinti in fila dall'inizio. Un livello nuovo in mezzo
   (la torta) si fa, e i livelli già vinti più avanti tengono le stelle e
   si riaprono arrivandoci. I programmi non si toccano: stanno sotto la
   chiave del livello, che non cambia mai. */
export const FILE = {
  1: ['primo-muretto', 'torretta', 'muro-lungo', 'quanto-lungo', 'muro-alto', 'bosco', 'tempio',
      'castello', 'scala', 'piramide', 'buchi', 'ponte', 'muro-gemello'],
}
export const FILA_ATTUALE = 2

export function riordina(av, vecchia, nuova = CAMPAGNA.map(t => t.chiave)) {
  const stelle = {}
  for (const [i, s] of Object.entries((av && av.stelle) || {})) {
    const j = nuova.indexOf(vecchia[Number(i)])
    if (j >= 0 && s > 0) stelle[j] = s
  }
  /* fatto è un livello con le sue stelle, o uno che stava prima della
     tappa raggiunta: senza la seconda metà, un avanzamento arrivato lì
     per altre strade tornerebbe a zero */
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
  /* i capitoli arrivano in fila, e nessuno resta vuoto */
  const ordine = CAPITOLI.map(c => c.chiave)
  const fila = campagna.map(t => ordine.indexOf(t.capitolo))
  if (fila.some((n, i) => i > 0 && n < fila[i - 1])) guasti.push('i capitoli non sono in fila')
  for (const c of CAPITOLI)
    if (!campagna.some(t => t.capitolo === c.chiave)) guasti.push(`il capitolo «${c.chiave}» è vuoto`)
  /* la portata non torna indietro: un livello dopo non è più facile */
  if (campagna.some((t, i) => i > 0 && t.portata < campagna[i - 1].portata))
    guasti.push('la portata scende da un livello al successivo')
  return guasti
}
