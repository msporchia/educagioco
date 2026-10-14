/* Come l'eroe tiene l'arma in mano (dati/impugna.js, docs/sotterraneo/roba.md «le figure delle armi»): un arco sta al fianco,
   all'altezza della mano e in proporzione all'eroe, mai sopra la faccia; una balestra è bassa, orizzontale e più piccola di un arco.
   `node test/esegui.mjs sotterraneo-impugna --niente-build` */
import { COSE } from '../../src/giochi/sotterraneo/dati/cose.js'
import { ASPETTI } from '../../src/giochi/sotterraneo/dati/aspetti.js'
import { PEZZI } from '../../src/giochi/sotterraneo/dati/atlante.js'
import { impugnatura } from '../../src/giochi/sotterraneo/dati/impugna.js'
import { controlla, riassunto } from '../aiuto/verifica.mjs'

const ALTO = 28, META = 8   // l'eroe: 16 × 28; mezza larghezza del corpo

const misura = s => PEZZI[s] ? { w: PEZZI[s][2], h: PEZZI[s][3] } : null
const come = (base, sprite) => {
  const cosa = { ...COSE[base], sprite }, m = misura(sprite)
  return { cosa, m, ...impugnatura(cosa, m.w, m.h), ritratto: impugnatura(cosa, m.w, m.h) }
}

for (const base of ['arco-corto', 'arco-lungo', 'balestra']) {
  for (const a of ASPETTI[base]) {
    const { cosa, m, dx, base: fondo, ritratto } = come(base, a.sprite)
    const nome = `${base} · ${a.sprite}`
    controlla(`${nome}: sta nell'atlante`, !!m)
    if (!m) continue
    controlla(`${nome}: dal campo e dal ritratto sta nello stesso posto`, ritratto.dx === dx && ritratto.base === fondo)
    controlla(`${nome}: non sporge sopra la testa né sotto i piedi`, fondo >= 0 && fondo + m.h <= ALTO, `da ${fondo} a ${fondo + m.h}`)
    if (cosa.tiene === 'orizzontale') {
      controlla(`${nome}: la balestra è orizzontale`, m.w > m.h, `${m.w}×${m.h}`)
      controlla(`${nome}: la balestra è bassa, sotto la faccia`, fondo + m.h <= 12, `arriva a ${fondo + m.h}`)
      controlla(`${nome}: la balestra è più piccola di un arco`, m.w <= 14)
    } else {
      controlla(`${nome}: l'arco sta in piedi, accanto al corpo e non in mezzo`, m.h > m.w && dx - m.w / 2 >= META - 3, `corda a ${dx - m.w / 2}`)
      controlla(`${nome}: la mano lo tiene a metà, fra il petto e la fronte`, Math.abs(fondo + m.h / 2 - 11.5) <= 1.5 || fondo === 0, `centro a ${fondo + m.h / 2}`)
      const [da, a2] = base === 'arco-corto' ? [14, 18] : [22, 25]
      controlla(`${nome}: in proporzione all'eroe (${base}: ${da}–${a2} di altezza su 28)`, m.h >= da && m.h <= a2, `alto ${m.h}`)
    }
  }
}

{
  controlla('un\'arma a due mani si tiene di lato anche sul campo: in mezzo copriva la faccia', impugnatura(COSE.spadone, 10, 24).dx > 0)
  controlla('una spada si tiene col fondo vicino ai piedi', impugnatura(COSE.spada, 8, 20).base < 2)
}

riassunto('come si tengono gli archi in mano')
