/* Il rovo — Bosco, debole alle bombe.
   Una palla di rami spinosi, non un animale: niente occhi tondi,
   solo due bracce che covano dentro il groviglio. È il primo mostro
   vegetale del castello, e deve leggersi diverso da tutti gli altri
   anche a colpo d'occhio — è per questo che rinuncia alla faccia. */

export const rovo = (p, s) => {
  for (let i = 0; i < 7; i++) {
    const a = i / 7 * 6.29
    p.linea([{ x: Math.cos(a) * 4.4 * s, y: Math.sin(a) * 4.4 * s },
             { x: Math.cos(a) * 8 * s, y: Math.sin(a) * 8 * s }], '#3c5e2c', 1.3 * s)
  }
  p.ellisse(0, 0, 6 * s, 5.6 * s, '#4f7a3a')
  p.ellisse(-1.6 * s, -1.6 * s, 2.4 * s, 2 * s, '#6b9a4f')
  p.cerchio(-2 * s, -0.6 * s, 1.4 * s, '#ff5c3c')
  p.cerchio(2 * s, -0.6 * s, 1.4 * s, '#ff5c3c')
}
