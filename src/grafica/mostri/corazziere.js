/* Il corazziere — Mura, debole alla magica.
   Metallo e basta: nessun occhio da vedere, solo la fessura scura
   della visiera a croce. La sagoma è squadrata, non tonda come le
   bestie — è il primo mostro umano del castello, e deve leggersi
   subito come «un'armatura», non come «un animale grosso». Grigio
   ardesia scuro, non argento: sulla pietra grigia della sua stessa
   tappa un metallo chiaro sarebbe sparito nel fondale. */

export const corazziere = (p, s) => {
  p.figura([[-7 * s, 5.6 * s], [-7.6 * s, -0.6 * s], [-4 * s, -5 * s],
            [4 * s, -5 * s], [7.6 * s, -0.6 * s], [7 * s, 5.6 * s]], '#414855')
  p.figura([[-7 * s, 5.6 * s], [-7.6 * s, -0.6 * s], [-4 * s, -5 * s],
            [-1 * s, -5 * s], [-2 * s, 5.6 * s]], '#5c6472')                                   // riflesso
  p.figura([[-1.6 * s, -8.2 * s], [1.6 * s, -8.2 * s], [1 * s, -5 * s], [-1 * s, -5 * s]], '#c0364a')  // pennacchio, grande
  // due fessure rettangolari, non una croce: la prima versione con la
  // fessura a T sembrava una lapide, non un elmo. Chiare, non buie: sul
  // metallo scuro un buco nero sparirebbe quasi quanto l'argento sulla
  // pietra — qui dentro brillano invece che sparire.
  p.rett(-2.8 * s, -3.6 * s, 1.7 * s, 0.9 * s, '#cfe0ea')
  p.rett(1.1 * s, -3.6 * s, 1.7 * s, 0.9 * s, '#cfe0ea')
  p.rett(-0.4 * s, -3.4 * s, 0.8 * s, 2.6 * s, '#2c2438')   // il naso dell'elmo, corto
}
