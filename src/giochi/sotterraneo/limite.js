// Il sotterraneo limitato da fuori (docs/sotterraneo/scuola.md): puro, gira in Node. A casa `limite` manca e niente di qui cambia.
import { CAMPAGNA } from './dati/campagna.js'
import { eroeDi } from './dati/eroi.js'
import { robaAttesa, livelloAtteso } from './motore/storia.js'
import { crescitaA } from './motore/crescita.js'
import { tappaDelMondo, rifattiDi, conRipulito } from './motore/rigenera.js'

// `{ domande }` con `prossima()` (il `pescatore` della scuola), o niente
export const limiteDi = l => (typeof l?.domande?.prossima === 'function' ? l : null)

// la discesa del limite: la cripta, l'unica che sta in un blocco di lezione (due piani)
export const TAPPA_DEL_LIMITE = 0
const CHIAVE_DEL_LIMITE = CAMPAGNA[TAPPA_DEL_LIMITE].chiave
// i livelli in più di quello atteso per la cripta: perdonano chi sbaglia
export const LIVELLI_IN_PIU = 2
// la difficoltà della maestra sposta solo questo: Facile 4 livelli in più, Normale 2 (com'è), Difficile 0 (l'eroe atteso per la cripta)
export const LIVELLI_PER_DIFFICOLTA = { facile: 4, normale: LIVELLI_IN_PIU, difficile: 0 }
export const livelliInPiuDi = d => LIVELLI_PER_DIFFICOLTA[d] ?? LIVELLI_IN_PIU

// la domanda per una cosa che chiede: col limite quella dopo dell'esercizio, a casa la scelta di casa con la difficoltà della discesa
export const domandaDelLimite = (lim, chiesta, evita, diCasa) =>
  lim ? lim.domande.prossima() : diCasa({ difficolta: chiesta.difficolta, evita })

// la roba e la crescita della prima discesa: quelle attese per la cripta, qualche livello sopra
export const corredoDelLimite = (eroe, difficolta) =>
  ({ roba: robaAttesa(eroe, TAPPA_DEL_LIMITE), crescita: crescitaA(eroeDi(eroe), livelloAtteso(TAPPA_DEL_LIMITE) + livelliInPiuDi(difficolta)) })

// la cripta della storia (sempre due piani), col seme della volta: `rifatti` del mondo dell'avventura
export const tappaDelLimite = (eroe, mondo) =>
  tappaDelMondo(CHIAVE_DEL_LIMITE, { eroe, rifatti: rifattiDi(mondo, CHIAVE_DEL_LIMITE), storia: true })

// finita una discesa, vinta o persa, la prossima è un'altra cripta: un rifatti in più
export const mondoDopoIlLimite = mondo => conRipulito(mondo, CHIAVE_DEL_LIMITE)

// i fogli che a casa portano al villaggio: il portale e la scala che sale dal primo piano
export const versoIlVillaggio = f => !!f && (f.che === 'portale' || (f.che === 'scala-su' && !!f.fuori))
