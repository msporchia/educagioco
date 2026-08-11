/* ═══════════════════════════════════════════════════════════════════
   L'ACQUA — il mattone bagnato delle fogne

   Gli stessi mattoni della cripta, e poi l'acqua che ci sta sopra: le
   colature scure lungo i giunti, il velo verdastro a chiazze, e i
   lucidi — righe chiare piatte che sono il riflesso della volta.

   Il velo è tenuto basso apposta: **bagnato vuol dire lucido a
   tratti**, non verde tutto. Una fogna verde piena diventa una tinta
   piatta, e i personaggi ci annegano dentro come in un pavimento
   troppo carico.
   ═══════════════════════════════════════════════════════════════════ */
import { ell, velo } from '../comune.js'
import { semina, crepa } from './semina.js'
import { mattoniPosa } from './pietra.js'

/* `stagnante` e `asciutta` sono le due direzioni in cui l'acqua ferma
   può cedere: più acqua, o meno. Non sono un velo sopra il pavimento
   bagnato — sono quanto pavimento resta bagnato, e basta. */
export function umido(c, reg, A, lato, tinte, scoperto, opz = {}) {
  const modo = opz.modo || 'normale', sm = (opz.seme || 0) * 107
  mattoniPosa(c, reg, A, lato, tinte, scoperto, opz)
  const sogliaAlga = modo === 'stagnante' ? 0.25 : modo === 'asciutta' ? 0.72 : 0.45
  semina(reg, lato * 1.55, 27 + sm, 1, null, (x, y, r) => {
    if (r(1) < sogliaAlga) return
    const rx = lato * (0.25 + r(2) * 0.65) * (modo === 'stagnante' ? 1.35 : 1)
    velo(c, (0.1 + r(3) * 0.13) * (modo === 'stagnante' ? 1.6 : 1), () =>
      ell(c, x, y, rx, rx * (0.3 + r(4) * 0.3), r(5) > 0.5 ? A.muschio : '#0d1418'))
  })
  // i lucidi: piatti, orizzontali, e mai due uguali — l'asciutta ne
  // tiene pochi, quelli dell'ultima pozza rimasta
  const sogliaLucido = modo === 'asciutta' ? 0.85 : 0.6
  semina(reg, lato * 2.2, 29 + sm, 1, null, (x, y, r) => {
    if (r(1) < sogliaLucido) return
    velo(c, 0.14 + r(2) * 0.1, () =>
      ell(c, x, y, lato * (0.15 + r(3) * 0.25), lato * 0.03, '#bfe8ef'))
  })
  // l'asciutta si screpola dove l'acqua è calata: fango secco, non
  // più fogna bagnata
  if (modo === 'asciutta')
    semina(reg, lato * 1.8, 31 + sm, 1, null, (x, y, r) => {
      if (r(1) < 0.5) return
      velo(c, 0.35, () => crepa(c, x, y, lato * (0.4 + r(2) * 0.5), '#2a2018', r))
    })
}
umido.modi = ['normale', 'stagnante', 'asciutta']
