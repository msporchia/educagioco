/* `generaLotto(a, b)`: tutto ciò che un lotto contiene, puro e uguale a ogni chiamata (niente `Math.random`): bioma, acqua, posto del
   molo, alberi e sassi. I 42 lotti storici hanno gli alberi e i sassi di prima; gli altri nascono dalle coordinate. Il motore e la
   scena lo chiedono solo per i lotti vicini al terreno proprio. Vedi docs/fattoria3d/mondo-infinito.md. */
import { lotto, eStorico, chiave } from './mondo.js'
import { biomaDi, biomaVecchio, acquaDelLotto, spiaggiaDelLotto, moloDelLotto } from './biomi.js'
import { alberiStorici, alberiNuovi } from './alberi.js'
import { ostacoliDelLotto, riservateDeiLottiStorici } from './ostacoli.js'

/** `vecchio`: la geografia di prima (solo prato, bosco e laghetto) per i lotti che un salvataggio vecchio aveva già comprato nelle zone dove ora c'è il mare o un lago:
    restano com'erano, con gli stessi alberi e sassi (docs/fattoria3d/geografia-e-pesca.md). Per gli altri lotti è lo stesso. */
export function generaLotto(a, b, { vecchio = false } = {}) {
  const l = lotto(a, b), bioma = vecchio ? biomaVecchio(a, b) : biomaDi(a, b)
  const acqua = acquaDelLotto(l, vecchio), molo = moloDelLotto(l, acqua)
  const spiaggia = vecchio ? [] : spiaggiaDelLotto(l)
  if (bioma === 'mare') return { id: l.id, a, b, bioma, acqua, spiaggia, molo: null, alberi: [], ostacoli: [], mare: true }        // tutto acqua: niente alberi né sassi, e la scena lo disegna come un piano solo
  const celleAcqua = new Set(acqua.map(([i, j]) => chiave(i, j)))
  for (const [i, j] of spiaggia) celleAcqua.add(chiave(i, j))                // sulla sabbia non nascono alberi
  let alberi, riservate
  if (eStorico(l)) {
    alberi = alberiStorici().filter(x => x.i >= l.i && x.i < l.i + l.w && x.j >= l.j && x.j < l.j + l.d)
    riservate = new Set(riservateDeiLottiStorici())
  } else {
    alberi = alberiNuovi(l, bioma, celleAcqua)
    riservate = new Set(celleAcqua)
    if (molo) riservate.add(chiave(molo.i, molo.j))
  }
  if (!eStorico(l)) for (const [i, j] of spiaggia) riservate.add(chiave(i, j))
  for (const x of alberi) riservate.add(chiave(x.i, x.j))
  const ostacoli = ostacoliDelLotto(l, riservate, bioma)
  return { id: l.id, a, b, bioma, acqua, spiaggia, molo, alberi: alberi.map(x => ({ ...x })), ostacoli, mare: false }
}
