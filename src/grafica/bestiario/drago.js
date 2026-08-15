/* ═════ IL DRAGO ═════
   L'ultimo di tutti, e l'unico che deve *riempire* lo schermo. Tutto
   quello che le altre creature hanno una alla volta, lui ce l'ha
   insieme: ali di membrana, corna, coda, zanne, la luce in gola.

   ── PERCHÉ È DISEGNATO DI TRE QUARTI E NON DI FRONTE ──
   Di fronte un drago è una faccia con due ali, cioè un pipistrello
   grosso. È il **collo** a fare il drago, e un collo si vede solo se è
   di traverso. Costa una posa in più rispetto a tutti gli altri: vale
   il prezzo, perché questa figura la si vede alla fine di nove tappe e
   deve valere il viaggio.

   La luce in gola cresce e cala ma non spara mai niente: nel dungeon
   il fuoco non esiste come regola, e una grafica che promette una cosa
   che il gioco non fa è una bugia. */
import { mescola, capsula, poligono, tondo } from '../comune.js'
import { ala } from './comune.js'

export const DRAGO = {
  quadrupede: true, taglia: 1.14,
  col: {
    scaglie: '#a8342c', scaglieS: '#7a1f1c', pancia: '#e0a54f',
    membrana: '#c25a3a', corna: '#f0e0c0', gola: '#ffd23f',
    unghie: '#f0e0c0', bordo: '#3d0f0d',
  },
  disegna(q, s, C, dir, sw, stato) {
    const t = q.tempo || 0
    const b = C.bordo, sp = 0.9 * s
    const respiro = Math.sin(t * 1.2)
    /* Le ali stanno **alte**, all'altezza delle spalle: attaccate al
       fianco sembravano due pinne e il drago un pesce rosso. Da lì
       incorniciano il collo, che è la parte che deve leggersi. */
    for (const v of [-1, 1])
      ala(q, s, v, { lungo: 17, alto: 13, col: C.membrana, bordo: b,
                     apertura: 0.86 + respiro * 0.14, x: v * 3 * s, y: -12 * s })
    // la coda esce da destra e si arriccia all'insù, la punta in cima
    q.ctx.strokeStyle = C.scaglieS; q.ctx.lineWidth = 2.2 * s; q.ctx.lineCap = 'round'
    q.ctx.beginPath()
    q.ctx.moveTo(3 * s, -2 * s)
    q.ctx.quadraticCurveTo(11.4 * s, -1.4 * s, (9.6 + respiro) * s, -7.4 * s)
    q.ctx.stroke()
    poligono(q, [[(8.4 + respiro) * s, -7.8 * s], [(10.8 + respiro) * s, -7 * s],
                 [(9.8 + respiro) * s, -10.4 * s]], C.corna, b, sp * 0.6)
    for (const v of [-1, 1]) {                                        // le zampe con gli artigli
      capsula(q, v * 4.4 * s, -2.4 * s, 1.8 * s, 3.2 * s, 1.4 * s, C.scaglieS, b, sp)
      for (const d of [-1, 0, 1])
        poligono(q, [[v * 4.4 * s + d * 1.2 * s, 0.4 * s], [v * 4.4 * s + d * 1.2 * s + 0.6 * s, 0.4 * s],
                     [v * 4.4 * s + d * 1.4 * s, 2 * s]], C.unghie)
    }
    tondo(q, 1 * s, -4.6 * s, 6 * s, 4.8 * s, C.scaglie, b, sp)       // il petto
    // le piastre chiare della pancia, che è dove sta tutta la luce
    for (let i = 0; i < 4; i++)
      capsula(q, 1 * s, (-1.8 - i * 2) * s, (3.2 - i * 0.35) * s, 0.85 * s, 0.8 * s, C.pancia)
    /* Il collo: cinque anelli che salgono di traverso, e devono uscire
       **dalla sagoma del petto** o il drago diventa un rospo con le
       ali. Ogni anello è più piccolo del precedente: è la rastremazione
       a dare la profondità, non l'inclinazione. */
    for (let i = 0; i < 5; i++) {
      const d = i / 4
      tondo(q, (0.4 - d * 7.4) * s, (-8.6 - d * 6.4) * s,
            (3.2 - d * 1.1) * s, (2.8 - d * 0.9) * s,
            mescola(C.scaglie, '#ffffff', d * 0.08), b, sp)
    }
    q.in(-8.4 * s, -16.4 * s, r => {
      tondo(r, 0, 0, 4.6 * s, 3.4 * s, C.scaglie, b, sp)              // il cranio
      tondo(r, -3 * s, 1.2 * s, 3 * s, 2 * s, C.scaglie, b, sp)       // il muso allungato
      for (const [dx, dy, l] of [[1.6, -3, 5], [3.2, -2.2, 4]])       // le corna all'indietro
        poligono(r, [[dx * s, dy * s], [(dx + 1) * s, (dy + 1.4) * s],
                     [(dx + l * 0.9) * s, (dy - l * 0.7) * s]], C.corna, b, sp * 0.7)
      if (stato === 'ko') {
        r.ctx.strokeStyle = b; r.ctx.lineWidth = 0.7 * s; r.ctx.lineCap = 'round'
        for (const [ox] of [[-1.6], [1]]) {
          r.ctx.beginPath()
          r.ctx.moveTo(ox * s - 0.8 * s, -1.4 * s); r.ctx.lineTo(ox * s + 0.8 * s, -0.2 * s)
          r.ctx.moveTo(ox * s + 0.8 * s, -1.4 * s); r.ctx.lineTo(ox * s - 0.8 * s, -0.2 * s)
          r.ctx.stroke()
        }
        return
      }
      // l'occhio giallo a fessura, la cosa più minacciosa del disegno
      tondo(r, -0.4 * s, -0.8 * s, 1.5 * s, 1.3 * s, '#f7e07a')
      r.ellisse(-0.4 * s, -0.8 * s, 0.4 * s, 1.1 * s, '#2b0d0d')
      // la gola che si accende piano: promette, e non spara
      const brace = Math.max(0, Math.sin(t * 0.9))
      r.velo(0.25 + brace * 0.5, () => r.cerchio(-4.6 * s, 1.8 * s, (1.4 + brace) * s, C.gola))
      for (const d of [-1, 0, 1])                                      // le zanne
        poligono(r, [[(-4.4 + d * 1.3) * s, 2.4 * s], [(-3.9 + d * 1.3) * s, 2.4 * s],
                     [(-4.15 + d * 1.3) * s, 3.8 * s]], '#f7f4ea')
    })
  },
}
