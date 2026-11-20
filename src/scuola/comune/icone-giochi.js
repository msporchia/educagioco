/* Il disegno di ogni gioco della scuola: l'icona dipinta della sua copertina di casa (docs/core/home.md, «Le copertine»).
   Nella build la riscrive `iconeGiochi` di vite.scuola.config.js con le sole nove icone, non tutte le copertine. docs/scuola/quaderno.md */
import { DIPINTE } from '../../components/home/copertine-dipinte.js'

// l'id del gioco a scuola → la chiave della sua copertina in home
const COPERTINA = { asteroidi: 'mate', survivors: 'survivors', 'passo-passo': 'passo', robot: 'costruttore', inglese: 'inglese',
  pozioni: 'pozioni', cucina: 'bancarella', castello: 'torri', sotterraneo: 'sotterraneo' }

export const ICONE = Object.fromEntries(Object.entries(COPERTINA).filter(([, k]) => DIPINTE[k]?.icona)
  .map(([id, k]) => [id, { fondo: DIPINTE[k].fondo, src: DIPINTE[k].icona }]))
