/* Il mangime: ciò che mangiano le bestie, come nella fattoria di sempre (src/giochi/fattoria/dati/coltivazioni.js). Un raccolto non si dà
   da mangiare: si porta al fienile e diventa becchime (le galline) o foraggio (mucche e pecore); l'erba medica è la seconda strada del
   foraggio. Qui stanno le tre ricette del fienile (le usa `MACCHINE.fienile` in dati/ricette.js) e il conto del loro tempo, in un
   file a parte perché `animali.js` ne ha bisogno e `ricette.js` importa `animali.js`. Vedi docs/fattoria3d/mangime-e-catena.md. */
import { COLTURE } from './colture.js'

/** Le ricette del fienile, con gli id della 2D (`foraggio_carote`, `becchime`, `foraggio`). `da`: il prodotto, se non è l'id (due strade per
    lo stesso foraggio). `mangime: true`: non si chiede al banco, non sale in mongolfiera, non si baratta con i vicini (come `mangime: true` in 2D).
    `liv` è il più tardo fra la macchina e gli ingredienti (dati/livelli.js lo controlla); i secondi sono i minuti della 2D. */
export const RICETTE_FIENILE = {
  foraggio_carote: { nome: 'Foraggio di carote', emoji: '🥬', pezzo: 'balla_fieno_tonda', da: 'foraggio', mangime: true, ing: { carota: 2 }, ms: 5000, liv: 2 },
  becchime:        { nome: 'Becchime',           emoji: '🌰', pezzo: 'merce_becchime',    mangime: true, ing: { grano: 2 },  ms: 4000, liv: 2 },
  foraggio:        { nome: 'Foraggio',           emoji: '🥬', pezzo: 'balla_fieno_tonda', mangime: true, ing: { erba: 2 },   ms: 5000, liv: 9 },
}

/** Il prodotto di una ricetta del fienile (di solito il suo id). */
export const prodottoDi = id => (RICETTE_FIENILE[id] || {}).da || id

/** I mangimi che il fienile fa: `becchime`, `foraggio`. */
export const MANGIMI_DEL_FIENILE = [...new Set(Object.keys(RICETTE_FIENILE).map(prodottoDi))]

/** Le ricette che fanno quel mangime (uno o due modi). */
export const ricetteDelMangime = k => Object.entries(RICETTE_FIENILE).filter(([id]) => prodottoDi(id) === k)

/** Il lavoro per avere `n` pezzi di un mangime, dalla strada che costa meno: la cottura più il tempo di ogni raccolto (il conto degli ordini, come `msDi`). */
export function lavoroDelMangime(k, n = 1) {
  const r = ricetteDelMangime(k).map(([, x]) => x.ms + Object.entries(x.ing).reduce((t, [i, q]) => t + q * COLTURE[i].ms, 0))
  return r.length ? n * Math.min(...r) : Infinity
}

/** L'attesa per avere `n` pezzi di un mangime, dalla strada più svelta: i raccolti maturano insieme (il più lento) e poi si cuoce `n` volte (il conto della scala, come `catenaMs`). */
export function attesaDelMangime(k, n = 1) {
  const r = ricetteDelMangime(k).map(([, x]) => n * x.ms + Math.max(0, ...Object.keys(x.ing).map(i => COLTURE[i].ms)))
  return r.length ? Math.min(...r) : Infinity
}
