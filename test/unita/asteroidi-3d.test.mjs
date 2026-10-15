/* Gli asteroidi in 3D, senza browser: i comandi col dito (quale sasso si è toccato,
   il falso che urta la nave, le quote dei falsi) e le forme dei sassi di ogni cielo.
   Vedi docs/asteroidi/grafica-3d.md.
   `node test/esegui.mjs asteroidi-3d --niente-build` */
import { sassoSotto, toccaLaNave, ordineFalsi, TOCCO } from '../../src/motore/asteroidi/comandi.js'
import { formaDi, VARIANTI } from '../../src/grafica/spazio3d/forme.js'
import { CIELI, specieDi } from '../../src/grafica/cieli.js'
import { controlla, uguale, stessaLista, nota, riassunto } from '../aiuto/verifica.mjs'

/* ══════════ 1. il dito: sopra il sasso è la risposta, altrove si guida ══════════ */
{
  const a = { x: 100, y: 100, r: 30, morto: false }, b = { x: 170, y: 100, r: 30, morto: false }
  uguale('sopra il sasso lo prende', sassoSotto([a, b], 105, 95), a)
  uguale('appena fuori dal bordo lo prende ancora', sassoSotto([a, b], 100 + 30 * 1.1, 100), a)
  uguale('più in là non prende niente: si guida', sassoSotto([a, b], 100, 100 + 30 * 1.3), null)
  uguale('fra due sassi vince il più vicino', sassoSotto([a, b], 136, 100), b)
  uguale('un sasso già tolto non si prende', sassoSotto([{ ...a, morto: true }], 100, 100), null)
  const piccolo = { x: 0, y: 0, r: 10, morto: false }
  uguale('un sasso piccolo si prende entro il minimo del pollice', sassoSotto([piccolo], TOCCO.minimo - 1, 0), piccolo)
}

/* ══════════ 2. il falso che tocca la nave ══════════ */
{
  const nave = { x: 200, y: 700, r: 40 }
  controlla('addosso alla nave la tocca', toccaLaNave({ x: 210, y: 650, r: 30 }, nave))
  controlla('a due raggi di distanza no', !toccaLaNave({ x: 200, y: 560, r: 30 }, nave))
}

/* ══════════ 3. le quote dei falsi: due vicini mai alla stessa altezza ══════════ */
{
  for (let n = 0; n <= 6; n++) {
    const o = ordineFalsi(n)
    stessaLista(`con ${n} falsi ogni quota una volta`, [...o].sort((x, y) => x - y), Array.from({ length: n }, (_, j) => j))
    if (n >= 4) controlla(`con ${n} falsi due vicini stanno ad almeno due passi`,
                          o.every((q, i) => i === 0 || Math.abs(q - o[i - 1]) >= 2), o.join(','))
  }
}

/* ══════════ 4. le forme: ogni cielo ha i suoi sassi, e il davanti per il numero ══════════ */
{
  const specie = [...new Set(Object.keys(CIELI).map(specieDi)), 'marte', 'bomba']
  for (const s of specie) {
    for (let n = 0; n < VARIANTI; n++) {
      const g = formaDi(s, n)
      const k = g.attributes.position.count
      controlla(`${s} ${n}: posizione, normale, colore, brace e uv per ogni vertice`,
                ['normal', 'color', 'brace', 'uv'].every(x => g.attributes[x]?.count === k),
                Object.keys(g.attributes).join(','))
      const uv = g.attributes.uv
      let davanti = 0
      // il davanti ha l'uv della tela del numero (anche oltre 0..1: la proiezione è piana), il dietro -5
      for (let i = 0; i < uv.count; i++) if (uv.getX(i) > -4 && Math.abs(uv.getX(i) - 0.5) < 1.5) davanti++
      controlla(`${s} ${n}: ha un davanti dove si incide il numero`, davanti > 6, `${davanti} vertici`)
      g.computeBoundingBox()
      const b = g.boundingBox
      const largo = Math.max(-b.min.x, b.max.x)
      controlla(`${s} ${n}: sta nel suo raggio`, largo <= (s === 'dischi' ? 1.25 : 1.55), largo.toFixed(2))
      uguale(`${s} ${n}: la stessa forma per lo stesso seme`, formaDi(s, n), g)
    }
  }
  nota(`${specie.length} specie: ${specie.join(', ')}`)
}

riassunto('asteroidi in 3D: il dito e le forme')
