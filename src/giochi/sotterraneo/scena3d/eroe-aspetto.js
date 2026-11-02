// L'eroe col suo aspetto: il modello di `creaEroe` con la pelle e il colore dei capelli (nel modello), poi il taglio e la barba scelti
// (src/grafica/persona/capelli3d.js, in comune con la fattoria). `sprite` è la chiave del modello con l'aspetto, `maga~ambra.rossi.coda.baffi`
// (dati/eroi.js, daSprite). Lo usano l'eroe in scena (eroe3d.js) e le anteprime (anteprime3d.js).
import { creaEroe } from './eroi3d/eroi.js'
import { applicaAspetto } from '../../../grafica/persona/capelli3d.js'
import { daSprite } from '../dati/eroi.js'

export function creaEroeDa(sprite) {
  const sp = daSprite(sprite) || daSprite('cavaliere')
  const g = creaEroe(sp.modello, sp.colori)
  if (sp.taglio || sp.barba) applicaAspetto(g, { taglio: sp.taglio, barba: sp.barba, colore: sp.colori.capelli })
  return g
}
