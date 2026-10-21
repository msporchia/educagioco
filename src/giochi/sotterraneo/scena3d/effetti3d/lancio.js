// Generato da strumenti/promuovi-3d.mjs da poc/effetti-3d/lancio.js: non si tocca a mano (si cambia il prototipo e si rilancia `npm run promuovi3d`).
// Gli effetti magici di LANCIO in 3D: lancio, fascio, cielo, catena (contratto in poc/effetti-lancio-3d.html).
//   EFFETTI = { chiave: { via, durata, arrivo, passo, crea(ctx) → { gruppo, aggiorna(t, dt) → vivo, libera() } } }
// Ogni gruppo è autonomo: questi file non importano niente dagli altri gruppi di effetti.
import { EFFETTI as COLPI } from './lancio-colpi.js'
import { EFFETTI as FASCI } from './lancio-fasci.js'
import { EFFETTI as CIELO } from './lancio-cielo.js'
import { EFFETTI as CIELO2 } from './lancio-cielo2.js'

export const EFFETTI = { ...COLPI, ...FASCI, ...CIELO, ...CIELO2 }

// l'elemento con cui si prova ciascun effetto nella pagina (il gioco passa la `tinta` giusta)
export const ELEMENTO_PROVA = {
  palla: 'fuoco', dardo: 'fulmine', freccia: 'fisico', 'freccia-fuoco': 'fuoco', 'freccia-veleno': 'veleno', quadrello: 'fisico', trapassa: 'fisico',
  scheggia: 'gelo', lancia: 'gelo', falce: 'sacro', fascio: 'gelo', fulmine: 'fulmine', luce: 'sacro', colonna: 'sacro', meteora: 'fuoco', pioggia: 'fisico',
  massi: 'fisico', brace: 'fuoco', nevicata: 'gelo', catena: 'fulmine', ascia: 'fisico',
}
export const PREPARA = () => {}
