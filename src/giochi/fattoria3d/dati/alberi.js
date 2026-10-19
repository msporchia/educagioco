/* Gli alberi: sempre gli stessi (un caso con il seme), così «l'albero numero 32» è lo stesso a ogni avvio e i tagliati si
   salvano come numeri. Dentro il mondo si abbattono (`tagliabile`); fuori è il bosco che chiude la fattoria. */
import { LOTTI, I0, J0, GW, GH, dentro, idx, celleRiservate } from './mondo.js'

export function generaAlberi() {
  let r = 7
  const caso = () => { r = (r * 9301 + 49297) % 233280; return r / 233280 }
  const riservate = celleRiservate()
  const lista = []
  const prova = (i, j, tagliabile) => {
    if (tagliabile && riservate.has(idx(i, j))) return
    if (lista.some(a => Math.hypot(a.i - i, a.j - j) < (tagliabile ? 1.9 : 1.6))) return
    lista.push({ i, j, s: 0.8 + caso() * 0.7, c: caso(), tagliabile })
  }
  for (const l of LOTTI) for (let k = 0; k < 3; k++) prova(l.i + Math.floor(caso() * l.w), l.j + Math.floor(caso() * l.d), true)
  for (let n = 0; n < 500 && lista.length < 236; n++) {
    const i = Math.floor(I0 - 10 + caso() * (GW + 20)), j = Math.floor(J0 - 10 + caso() * (GH + 20))
    if (dentro(i, j)) continue
    prova(i, j, false)
  }
  return lista.map((a, n) => ({ ...a, n }))
}

export function guastiDegliAlberi(alberi = generaAlberi()) {
  const g = []
  const dentroMondo = alberi.filter(a => a.tagliabile)
  if (dentroMondo.length < 30) g.push(`pochi alberi da abbattere: ${dentroMondo.length}`)
  for (const a of alberi) {
    if (a.tagliabile !== dentro(a.i, a.j)) g.push(`albero ${a.n}: tagliabile e posizione non tornano`)
    if (a.n !== alberi.indexOf(a)) g.push(`albero ${a.n}: numero fuori posto`)
  }
  return g
}
