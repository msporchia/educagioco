/* Il sotterraneo per la partita finta in due (../sfida-finta.mjs) e il banco della rete: la regola, le scelte di chi crea e le mosse
   dei due bambini finti. Ognuno guarda la sua copia della discesa e manda una mossa alla volta, e aspetta che sia arrivata prima
   della prossima (passa 0,6 s: senza, manderebbe la stessa dieci volte). Chi crea va alla chiave e alla scala, l'altro lo segue
   (le mete di src/giochi/sotterraneo/motore/banco-in-due.js); rispondono giusto quattro volte su cinque. */
import { regolaSotterraneo, alleatoDi } from '../../../src/giochi/sotterraneo/sfida/regia.js'
import { metaDi, versoDi } from '../../../src/giochi/sotterraneo/motore/banco-in-due.js'
import { robaPer, crescitaPer } from '../../../src/giochi/sotterraneo/motore/banco.js'
import { viaVerso } from '../../../src/motore/passi.js'

const EROE = { host: 'cavaliere', ospite: 'mago' }
const TAPPA = 1   // gli eroi come la storia li vuole alla seconda discesa

// la mossa di adesso per chi sta in `c` (come(i)), o niente
function decidi(c, r) {
  const f = c.foglio
  if (f) {
    if (f.che === 'scontro') return c.chiesta ? ['rispondi', c.chiesta.id, r() < 0.8 ? 1 : 0] : f.pericolo && !c.nonTocca(f) ? ['continua'] : null
    if (['porta', 'forziere', 'fonte', 'curiosita'].includes(f.che) && c.chiesta) return ['rispondi', c.chiesta.id, r() < 0.8 ? 1 : 0]
    if (f.che === 'svenuto') return ['riprendi']
    if (f.che === 'scala') return ['scendi']
    if (f.che === 'aspetta') return null
    return ['chiudi']
  }
  if (c.strada || c.scontroAperto()) return null
  const i = c.indiceDi()
  const meta = metaDi(c, i)
  if (!meta) return null
  if (meta.che === 'compagno') return ['vai', meta.x, meta.y, 0]
  const dove = versoDi(c, meta)
  if (!dove) return null
  const da = { x: Math.floor(c.eroe.x), y: Math.floor(c.eroe.y) }
  const via = viaVerso(c.buona(), dove, da, { sopra: ['scala', 'fonte'].includes(dove.che) })
  return via && via.strada && via.strada.length ? ['vai', via.dove.x, via.dove.y, 0] : ['vai', dove.x, dove.y, 1]
}

export default {
  regola: ({ firma, ruolo = 'host' }) => regolaSotterraneo({
    firma,
    eroe: () => ({ eroe: EROE[ruolo], roba: robaPer(TAPPA, { eroe: EROE[ruolo] }), crescita: crescitaPer(TAPPA, { eroe: EROE[ruolo] }), nome: ruolo === 'host' ? 'Leo' : 'Melody' }),
  }),
  scelte: seme => ({ chiave: 'cantine', difficolta: 'facile', seme: seme * 13 }),
  /* un passo da 16 ms di uno dei due: `inc.scegli(mossa)` se gli va */
  muovi(ruolo, inc, r) {
    const c = inc.partita, ls = inc.lockstep
    const st = inc._finto || (inc._finto = { finoA: -1 })
    if (!c || !ls || ls.k <= st.finoA || c.finita) return
    const mossa = c.come(alleatoDi(ruolo), () => decidi(c, r))
    if (!mossa) return
    const k = ls.hoMio
    if (inc.scegli(mossa)) st.finoA = k
  },
}
