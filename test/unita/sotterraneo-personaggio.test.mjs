/* ═══════════════════════════════════════════════════════════════════
   IL PERSONAGGIO, MASCHIO O FEMMINA — docs/sotterraneo/personaggio.md

   Il sesso sta nell'avventura e cambia chi si vede (modello 3D, nome),
   mai i numeri né la chiave dell'eroe. Qui: le varianti dei dati sono
   coerenti, ogni modello si costruisce e si veste con le armi della sua
   classe, e il sesso scritto resta nel salvataggio.
   ═══════════════════════════════════════════════════════════════════ */
import { EROI, SESSI, VARIANTI, MODELLI_EROI, SESSO_DI_SERIE, eroeDi, sessoValido, guastiDegliEroi, daSprite, spriteConAspetto, aspettoValido } from '../../src/giochi/sotterraneo/dati/eroi.js'
import { avventuraDi, scriviNellAvventura } from '../../src/giochi/sotterraneo/motore/avventure.js'
import { Corredo } from '../../src/giochi/sotterraneo/motore/corredo.js'
import { EROI as MODELLI_ANTEPRIME, chiaveDellEroe, leggiChiave } from '../../src/giochi/sotterraneo/scena3d/anteprime3d-pura.js'
import { creaEroe, CHIAVI, CLASSE } from '../../src/giochi/sotterraneo/scena3d/eroi3d/eroi.js'
import { creaEroeDa } from '../../src/giochi/sotterraneo/scena3d/eroe-aspetto.js'
import { TAGLI, BARBE } from '../../src/grafica/persona/aspetto.js'
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
uguale('un\'avventura senza sesso non ce l\'ha (vale quello del profilo)', avventuraDi(c, 'mago').sesso ?? null, null)
scriviNellAvventura(c, 'mago', { sesso: 'f' })
uguale('il sesso scritto si rilegge', avventuraDi(c, 'mago').sesso, 'f')
scriviNellAvventura(c, 'mago', { sesso: 'zzz' })
uguale('un sesso storto nel salvataggio vale come non scelto', avventuraDi(c, 'mago').sesso ?? null, null)
uguale('il corredo con il sesso ha il modello giusto', new Corredo({ eroe: 'nano', sesso: 'f' }).io.sprite, 'nana')

// ogni modello si costruisce, si veste con un'arma della sua classe e si muove
const ARMA = { cavaliere: 'spada-corta', elfa: 'arco-corto', mago: 'verga', nano: 'accetta' }
for (const k of CHIAVI) {
  let g = null, errore = ''
  try { g = creaEroe(k); vestiEroe(g, { mano: ARMA[CLASSE[k]] }); for (const t of [0, 3, 9.5, 40]) posa(g, t, t > 5, t > 30 ? 0.5 : null) } catch (e) { errore = e.message }
  controlla(`${k}: si costruisce, si veste e si muove`, !!g && !errore, errore)
  controlla(`${k}: ha la sua classe`, g && g.userData.classe === CLASSE[k])
}

// pelle e capelli: viaggiano nella chiave del modello (`maga~ambra.rossi`)
uguale('senza colori la chiave è quella di prima', spriteConAspetto('maga', {}), 'maga')
uguale('con i colori', spriteConAspetto('maga', { pelle: 'ambra', capelli: 'rossi' }), 'maga~ambra.rossi')
uguale('un solo campo', spriteConAspetto('elfo', { capelli: 'blu' }), 'elfo~-.blu')
uguale('un id che non c\'è si butta', spriteConAspetto('elfo', { pelle: 'zzz', capelli: 'blu' }), 'elfo~-.blu')
const ap = daSprite('nana~scura.verdi')
controlla('si riapre in modello e colori', ap.modello === 'nana' && ap.colori.pelle === 0x6e4630 && ap.colori.capelli === 0x4aa84a)
uguale('un modello che non c\'è non si apre', daSprite('drago~scura.verdi'), null)
uguale('la scheda col sesso e i colori', eroeDi('mago', 'f', { pelle: 'chiara', capelli: 'neri' }).sprite, 'maga~chiara.neri')
uguale('i numeri restano quelli', eroeDi('mago', 'f', { pelle: 'chiara' }).att, eroeDi('mago').att)
uguale('l\'avventura rilegge un aspetto storto', avventuraDi({ cfg: { avventure: { mago: { aspetto: { pelle: 'x', capelli: 'rossi' } } } } }, 'mago').aspetto.pelle, null)
for (const k of CHIAVI) for (const a of [{ pelle: 0x6e4630 }, { capelli: 0x3d78d8 }, { pelle: 0xf8d8bc, capelli: 0x2a2220 }]) {
  let ok = false, errore = ''
  try { const g = creaEroe(k, a); vestiEroe(g, { mano: ARMA[CLASSE[k]] }); posa(g, 3, false, null); ok = true } catch (e) { errore = e.message }
  controlla(`${k} con ${JSON.stringify(a)}: si costruisce`, ok, errore)
}
// taglio e barba: la chiave si apre e si richiude, e ogni combinazione costruisce un modello vestito che si muove
uguale('taglio e barba nella chiave', spriteConAspetto('mago', { taglio: 'coda', barba: 'baffi' }), 'mago~-.-.coda.baffi')
uguale('si riaprono', daSprite('mago~-.-.coda.baffi').barba, 'baffi')
uguale('i campi in coda non scelti si tolgono', spriteConAspetto('mago', { pelle: 'ambra', capelli: 'blu' }), 'mago~ambra.blu')
uguale('un taglio che non c\'è si butta', aspettoValido({ taglio: 'zzz' }).taglio, null)
for (const k of CHIAVI) for (const t of [null, ...TAGLI.map(x => x.id)]) for (const b of [null, ...BARBE.map(x => x.id)]) {
  if ((t && b && t !== 'coda' && b !== 'baffi') || (!t && !b)) continue   // tutte le coppie sono troppe: ogni taglio da solo, ogni barba da sola, e una coppia
  let ok = false, errore = ''
  try { const g = creaEroeDa(spriteConAspetto(k, { taglio: t, barba: b, capelli: 'rossi' })); vestiEroe(g, { mano: ARMA[CLASSE[k]] }); posa(g, 3, false, null); ok = true } catch (e) { errore = e.message }
  controlla(`${k} taglio ${t} barba ${b}`, ok, errore)
}
// l'anteprima si gira a scatti da 45° (`:r<n>` in coda alla chiave)
uguale('senza giro la chiave è quella di prima', chiaveDellEroe('maga', {}), 'eroe:maga:-:-:-:-')
uguale('girata di tre scatti', chiaveDellEroe('maga', {}, 'figura', 3), 'eroe:maga:-:-:-:-:r3')
uguale('e si rilegge', leggiChiave(chiaveDellEroe('maga', {}, 'figura', 3)).giro, 3)
uguale('zero o fuori misura non entrano', chiaveDellEroe('maga', {}, 'figura', 9), 'eroe:maga:-:-:-:-')
riassunto('il personaggio, maschio o femmina')
