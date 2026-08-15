/* ═════ LO SCORPIONE ═════
   È lui il motivo per cui questo cassetto esiste: il mostro grosso
   della cantina era un'emoji di scorpione grande quanto quella del
   topo, e nessuno poteva capire che picchiava il doppio.

   Disegnato, la differenza si vede da sola: la coda sale sopra la
   testa col pungiglione in cima, le due chele stanno aperte davanti, e
   il corpo è **largo**. Quella coda alzata è tutta la posa — abbassata
   diventa un gambero. */
import { mescola, tondo } from '../comune.js'
import { occhietti, zampe, chela, coda } from './comune.js'

export const SCORPIONE = {
  quadrupede: true, taglia: 1.05,
  col: {
    guscio: '#b06a2c', guscioS: '#7d4519', pancia: '#d99b52',
    occhio: '#2b1a0d', punta: '#f0d68c', bordo: '#3a1f0c',
  },
  disegna(q, s, C, dir, sw, stato) {
    const t = q.tempo || 0
    const b = C.bordo
    const respiro = Math.sin(t * 1.8)
    zampe(q, s, 4, { lungo: 6, apri: 1.1, su: 3.4, y: 0.6,
                     col: C.guscioS, sp: 1, fremito: t * 2 })
    /* La coda parte da dietro, sale, e ricade in avanti **sopra la
       testa**: è quell'arco a fare lo scorpione. Il pungiglione guarda
       in giù, verso chi sta davanti, che è dove sta chi legge. */
    const punta = coda(q, s, { da: { x: 1 * s, y: -4 * s }, lungo: 17, spesso: 1.9,
                               daAngolo: -2.4, aAngolo: 0.9 + respiro * 0.1,
                               col: C.guscio, bordo: b, segmenti: 8 })
    q.figura([[punta.x - 1.4 * s, punta.y], [punta.x + 1.2 * s, punta.y + 0.4 * s],
              [punta.x - 0.4 * s, punta.y + 3 * s]], C.punta)
    tondo(q, 0, -1.4 * s, 5.2 * s, 3.8 * s, C.guscio, b, 0.8 * s)   // il corpo largo
    tondo(q, 0, -0.6 * s, 3 * s, 2 * s, C.pancia)
    for (const v of [-1, 1])                                         // le chele, sempre in moto
      chela(q, s, v * 4.6 * s, 2.6 * s, v, C.guscio, b,
            { grande: 1.15, stretta: 0.5 + respiro * 0.5 })
    tondo(q, 0, 1.6 * s, 2.6 * s, 1.9 * s, C.guscioS, b, 0.75 * s)  // il capo
    occhietti(q, s, 2, 1.6, 1.2, 0.52, stato, mescola(C.punta, '#ffffff', 0.3))
  },
}
