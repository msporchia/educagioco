// Dove sta un'arma in mano all'eroe, in pixel di sprite (l'eroe è 16×28, i piedi sono lo zero): la usano la tela del campo
// (scena/tela.js `arma`) e il ritratto (viste/Armato.vue), perché due copie diventano due eroi. Il perché: docs/sotterraneo/roba.md.
//   dx    di quanto sta davanti al centro dell'eroe, verso dove guarda
//   base  l'altezza del bordo basso dell'arma sopra i piedi
// Una spada si tiene per l'impugnatura, col fondo vicino ai piedi. Un arco si tiene al centro, all'altezza della mano, con la corda
// (`corda`: la sua distanza dal centro dell'eroe) appena fuori dal viso, così sta accanto alla faccia e non sopra; una balestra (`tiene: 'orizzontale'`, già girata nel foglietto) sta davanti al petto.
const MANO = 6.72, FONDO = 1.28

export const IMPUGNATURE = {
  arco: { corda: 6, centro: 11.5 },
  orizzontale: { dx: 8.5, centro: 5 },
}

// `vista`: 'campo' porta l'arma a due mani in mezzo al corpo, 'ritratto' (zaino, pagina dell'eroe) di lato, dove non lo nasconde
export function impugnatura(cosa, w, h, vista = 'campo') {
  const i = cosa && (cosa.tiene === 'orizzontale' ? IMPUGNATURE.orizzontale : cosa.famiglia === 'archi' ? IMPUGNATURE.arco : null)
  if (i) return { dx: i.dx != null ? i.dx : i.corda + w / 2, base: Math.max(0, i.centro - h / 2) }
  if (vista === 'campo' && cosa && cosa.mani === 2) return { dx: 0, base: FONDO + 0.96 }
  return { dx: MANO, base: FONDO }
}
