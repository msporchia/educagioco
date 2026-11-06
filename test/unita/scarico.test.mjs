/* ═══════════════════════════════════════════════════════════════════
   QUANDO SI RICHIEDE LO SCARICO

   Il service worker può sparire a metà senza dirlo, e la pagina se ne
   accorge solo dal silenzio. Il giro vero (service worker fermato, file
   appeso, file sparito) sta in `integrazione/scarico`: qui la regola.
   ═══════════════════════════════════════════════════════════════════ */
import { daRichiedere, pausaDopo } from '../../src/scarico.js'
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'

const inCorso = { fine: false }
controlla('chi ha appena parlato non si disturba', !daRichiedere(inCorso, 1000, 0))
controlla('dopo venti secondi di silenzio si richiede', daRichiedere(inCorso, 20000, 0))
controlla('a scarico finito non si richiede mai', !daRichiedere({ fine: true }, 1e9, 0))
controlla('andata a vuoto, si aspetta il doppio', !daRichiedere(inCorso, 20000, 1) && daRichiedere(inCorso, 40000, 1))
uguale('e mai più di cinque minuti', pausaDopo(50), 5 * 60 * 1000)

riassunto('Quando si richiede lo scarico')
