/* `generaLotto(a, b)`: tutto ciò che un lotto contiene, puro e uguale a ogni chiamata (niente `Math.random`): bioma, acqua, posto del
   molo, alberi e sassi. I 42 lotti storici hanno gli alberi e i sassi di prima; gli altri nascono dalle coordinate. Il motore e la
   scena lo chiedono solo per i lotti vicini al terreno proprio. Vedi docs/fattoria3d/mondo-infinito.md. */
import { lotto, eStorico, chiave } from './mondo.js'
import { biomaDi, acquaDelLotto, moloDelLotto } from './biomi.js'
import { alberiStorici, alberiNuovi } from './alberi.js'
import { ostacoliDelLotto, riservateDeiLottiStorici } from './ostacoli.js'

export function generaLotto(a, b) {
  const l = lotto(a, b), bioma = biomaDi(a, b)
  const acqua = acquaDelLotto(l), molo = moloDelLotto(l, acqua)
  const celleAcqua = new Set(acqua.map(([i, j]) => chiave(i, j)))
  let alberi, riservate
  if (eStorico(l)) {
    alberi = alberiStorici().filter(x => x.i >= l.i && x.i < l.i + l.w && x.j >= l.j && x.j < l.j + l.d)
    riservate = new Set(riservateDeiLottiStorici())
  } else {
    alberi = alberiNuovi(l, bioma, celleAcqua)
    riservate = new Set(celleAcqua)
    if (molo) riservate.add(chiave(molo.i, molo.j))
  }
  for (const x of alberi) riservate.add(chiave(x.i, x.j))
  const ostacoli = ostacoliDelLotto(l, riservate, bioma)
  return { id: l.id, a, b, bioma, acqua, molo, alberi: alberi.map(x => ({ ...x })), ostacoli }
}
