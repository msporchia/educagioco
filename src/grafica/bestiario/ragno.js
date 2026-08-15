/* ═════ IL RAGNO ═════
   La prima cosa che si incontra scendendo, e quella che deve far
   capire in mezzo secondo che il gioco è cominciato. Addome grosso e
   lucido col disegno chiaro sopra, cefalotorace piccolo davanti, otto
   zampe coi ginocchi alti.

   Gli occhi sono **sei in fila e tutti uguali**: è la cosa che rende
   un ragno un ragno e non un insetto qualunque, e non costa niente.
   Nessun dente, nessuna goccia: qui ci gioca un bambino di sei anni,
   e il patto è che facciano paura per la forma, non per il sangue. */
import { mescola, tondo } from '../comune.js'
import { occhietti, zampe } from './comune.js'

export const RAGNO = {
  quadrupede: true, taglia: 1,
  col: {
    corpo: '#3a2f52', corpoS: '#251d38', segno: '#c9a227',
    /* le zampe più chiare del corpo, non più scure: sul fondo di una
       caverna un filo nero su nero è un filo che non c'è, e senza
       zampe un ragno è una biglia */
    zampe: '#6b5b8c', occhio: '#ffe97a', bordo: '#160f26',
  },
  disegna(q, s, C, dir, sw, stato) {
    const t = q.tempo || 0
    const b = C.bordo
    /* ── la prospettiva, che è tutto il disegno ──
       Un ragno visto di fronte ha l'addome **dietro** e quindi in
       scorcio: se lo si disegna grosso in cima, come sarebbe visto di
       lato, il risultato è una goccia con una faccia sotto — un
       fantasma, non un ragno. Davanti sta il cefalotorace, largo, con
       sopra gli occhi; l'addome spunta appena dietro.
       E le zampe si disegnano per prime e vanno **oltre** il corpo: la
       sagoma di un ragno è fatta di zampe, il corpo è quello che sta
       in mezzo. */
    zampe(q, s, 4, { lungo: 9, apri: 1.25, su: 4.6, y: -3.6,
                     col: C.zampe, sp: 1.15, fremito: t * 2.2 })
    tondo(q, 0, -6.6 * s, 3.8 * s, 3.2 * s, C.corpoS, b, 0.8 * s)      // l'addome, dietro
    tondo(q, 0, -7.4 * s, 1.8 * s, 1.2 * s, mescola(C.corpo, C.segno, 0.45))
    tondo(q, 0, -3.4 * s, 5 * s, 4.2 * s, C.corpo, b, 0.85 * s)        // il cefalotorace
    tondo(q, 0, -4.6 * s, 2.6 * s, 1.6 * s, mescola(C.corpo, '#ffffff', 0.16))
    // le due zanne sotto, corte: sono il segno che morde, e bastano
    for (const v of [-1, 1])
      q.figura([[v * 1.1 * s, -0.4 * s], [v * 2.1 * s, -0.8 * s], [v * 1.5 * s, 1.4 * s]], '#e8e2d0')
    // gli otto occhi: quattro grandi in fila e quattro piccoli sopra
    occhietti(q, s, 4, 1.9, -3.6, 0.72, stato, C.occhio)
    occhietti(q, s, 4, 1.5, -5.2, 0.44, stato, C.occhio)
  },
}
