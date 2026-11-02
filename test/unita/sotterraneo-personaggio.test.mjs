/* ═══════════════════════════════════════════════════════════════════
   IL PERSONAGGIO, MASCHIO O FEMMINA — docs/sotterraneo/personaggio.md

   Il sesso sta nell'avventura e cambia chi si vede (modello 3D, nome),
   mai i numeri né la chiave dell'eroe. Qui: le varianti dei dati sono
   coerenti, ogni modello si costruisce e si veste con le armi della sua
   classe, e il sesso scritto resta nel salvataggio.
   ═══════════════════════════════════════════════════════════════════ */
import { EROI, SESSI, VARIANTI, MODELLI_EROI, SESSO_DI_SERIE, eroeDi, sessoValido, guastiDegliEroi } from '../../src/giochi/sotterraneo/dati/eroi.js'
import { avventuraDi, scriviNellAvventura } from '../../src/giochi/sotterraneo/motore/avventure.js'
import { Corredo } from '../../src/giochi/sotterraneo/motore/corredo.js'
import { EROI as MODELLI_ANTEPRIME } from '../../src/giochi/sotterraneo/scena3d/anteprime3d-pura.js'
import { creaEroe, CHIAVI, CLASSE } from '../../src/giochi/sotterraneo/scena3d/eroi3d/eroi.js'
import { vestiEroe, posa } from '../../src/giochi/sotterraneo/scena3d/eroe3d.js'
import { controlla, uguale, stessaLista, riassunto } from '../aiuto/verifica.mjs'

const c2d = new Proxy({}, { get: (_, k) => (k === 'canvas' ? {} : () => ({ data: [] })), set: () => true })
globalThis.document = globalThis.document || { createElement: () => ({ width: 0, height: 0, getContext: () => c2d }) }

controlla('i dati degli eroi non hanno guasti', guastiDegliEroi().length === 0, guastiDegliEroi().join(' | '))
stessaLista('i modelli di dati/eroi.js sono quelli del 3D', [...MODELLI_EROI].sort(), [...CHIAVI].sort())
stessaLista('e quelli delle anteprime', [...MODELLI_ANTEPRIME].sort(), [...CHIAVI].sort())

for (const e of EROI) {
  const m = eroeDi(e.chiave, 'm'), f = eroeDi(e.chiave, 'f')
  controlla(`${e.chiave}: maschio e femmina hanno nomi e modelli diversi`, m.sprite !== f.sprite && m.nome !== f.nome && m.chi !== f.chi)
  controlla(`${e.chiave}: i numeri sono gli stessi`, m.vita === f.vita && m.att === f.att && m.dif === f.dif && m.chiave === f.chiave && m.porta === f.porta)
  uguale(`${e.chiave}: senza sesso la scheda è quella di serie`, eroeDi(e.chiave).sprite, VARIANTI[e.chiave][SESSO_DI_SERIE[e.chiave]].sprite)
  controlla(`${e.chiave}: le due classi dei modelli sono la sua`, SESSI.every(x => CLASSE[VARIANTI[e.chiave][x].sprite] === (CLASSE[e.sprite])))
}
uguale('il mago femmina è la maga', eroeDi('mago', 'f').nome, 'Maga')
uguale('l\'elfa maschio è l\'elfo', eroeDi('elfa', 'm').chi, 'l\'elfo')
uguale('un sesso storto vale quello di serie', sessoValido('elfa', 'x'), 'f')

// nel salvataggio
const c = {}
uguale('un\'avventura senza sesso ha quello di serie', avventuraDi(c, 'mago').sesso ?? sessoValido('mago', undefined), 'm')
scriviNellAvventura(c, 'mago', { sesso: 'f' })
uguale('il sesso scritto si rilegge', avventuraDi(c, 'mago').sesso, 'f')
scriviNellAvventura(c, 'mago', { sesso: 'zzz' })
uguale('un sesso storto nel salvataggio torna quello di serie', avventuraDi(c, 'mago').sesso, 'm')
uguale('il corredo con il sesso ha il modello giusto', new Corredo({ eroe: 'nano', sesso: 'f' }).io.sprite, 'nana')

// ogni modello si costruisce, si veste con un'arma della sua classe e si muove
const ARMA = { cavaliere: 'spada-corta', elfa: 'arco-corto', mago: 'verga', nano: 'accetta' }
for (const k of CHIAVI) {
  let g = null, errore = ''
  try { g = creaEroe(k); vestiEroe(g, { mano: ARMA[CLASSE[k]] }); for (const t of [0, 3, 9.5, 40]) posa(g, t, t > 5, t > 30 ? 0.5 : null) } catch (e) { errore = e.message }
  controlla(`${k}: si costruisce, si veste e si muove`, !!g && !errore, errore)
  controlla(`${k}: ha la sua classe`, g && g.userData.classe === CLASSE[k])
}
riassunto('il personaggio, maschio o femmina')
