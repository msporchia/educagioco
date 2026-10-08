/* I gettoni della fattoria non si coprono mai e stanno nello schermo: da uno a quanti ne stanno in
   una pagina, su un telefono stretto e su uno largo, sopra e sotto la cosa, piccola o grande.
   Vedi docs/fattoria/come-si-tocca.md («I gettoni»). */
import { controlla, uguale, riassunto } from '../aiuto/verifica.mjs'
import { disponiGettoni, quantiNeStanno, disponiFila, LATO_GETTONE, LATO_POSTO }
  from '../../src/giochi/fattoria/scena/bolla.js'

const lato = LATO_GETTONE
const piuVicini = punti => {
  let d = Infinity
  for (let i = 0; i < punti.length; i++)
    for (let j = i + 1; j < punti.length; j++)
      d = Math.min(d, Math.hypot(punti[i].x - punti[j].x, punti[i].y - punti[j].y))
  return d
}
for (const L of [320, 390, 800])
  for (const raggio of [40, 90])
    for (const cy of [60, 420]) {
      const quanti = quantiNeStanno({ raggio, L })
      controlla(`schermo ${L}, cosa grande ${raggio}: in una pagina ce ne stanno almeno 4`, quanti >= 4,
                `${quanti}`)
      for (let n = 1; n <= quanti; n++) {
        const { punti } = disponiGettoni(n, { cx: L / 2, cy, raggio, L, A: 760 })
        const d = piuVicini(punti)
        controlla(`${n} gettoni, schermo ${L}, cosa ${raggio} a ${cy}: non si coprono`, d >= lato,
                  `i due più vicini a ${Math.round(d)} px`)
        controlla(`${n} gettoni, schermo ${L}, cosa ${raggio} a ${cy}: stanno nello schermo`,
                  punti.every(p => p.x - lato / 2 >= 0 && p.x + lato / 2 <= L && p.y - lato / 2 >= 0))
      }
    }

/* la fila: in riga, dentro lo schermo anche sotto una cosa sul bordo */
const fila = disponiFila(5, { x: 10, y: 300, L: 320 })
controlla('la fila sta nello schermo', fila.every(p => p.x - LATO_POSTO / 2 >= 0))
uguale('e i posti non si toccano', piuVicini(fila) > LATO_POSTO, true)

riassunto('I gettoni della fattoria')
