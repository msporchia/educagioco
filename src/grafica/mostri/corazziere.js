/* Il corazziere: sagoma squadrata (un'armatura, non un animale), grigio
   ardesia scuro perché l'argento sparirebbe nel fondale di pietra. */

export const corazziere = (p, s) => {
  p.figura([[-7 * s, 5.6 * s], [-7.6 * s, -0.6 * s], [-4 * s, -5 * s],
            [4 * s, -5 * s], [7.6 * s, -0.6 * s], [7 * s, 5.6 * s]], '#414855')
  p.figura([[-7 * s, 5.6 * s], [-7.6 * s, -0.6 * s], [-4 * s, -5 * s],
            [-1 * s, -5 * s], [-2 * s, 5.6 * s]], '#5c6472')                                   // riflesso
  p.figura([[-1.6 * s, -8.2 * s], [1.6 * s, -8.2 * s], [1 * s, -5 * s], [-1 * s, -5 * s]], '#c0364a')  // pennacchio, grande
  // due fessure, non una croce a T (sembrava una lapide); chiare, non buie,
  // altrimenti sparirebbero sul metallo scuro
  p.rett(-2.8 * s, -3.6 * s, 1.7 * s, 0.9 * s, '#cfe0ea')
  p.rett(1.1 * s, -3.6 * s, 1.7 * s, 0.9 * s, '#cfe0ea')
  p.rett(-0.4 * s, -3.4 * s, 0.8 * s, 2.6 * s, '#2c2438')   // il naso dell'elmo, corto
}
