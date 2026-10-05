// Come si vede che un mostro ha preso un colpo, è avvelenato, brucia o è
// fragile: sopra la figura, che è dello sprite. `cy` e `r` sono il centro e
// la taglia del corpo; il tempo (`p.tempo`) muove bolle e fiamme.
import { locale, flamma, disc, rgba, add, glow } from './effetti-base.js'

export function statiMostro(p, { x, cy, r, lampo = 0, male = null, fragile = false, gelo = 0 }) {
  const S = p.S
  // il bianco del colpo, breve
  if (lampo > 0) p.velo(lampo * 0.75, () => p.ellisse(x, cy, r * 0.85, r, '#ffffff'))
  if (!male && !(fragile && gelo > 0)) return
  const u = r / S
  locale(p, x, cy, g => {
    if (male === 'div') {
      // il napalm: fiamme addosso
      for (let i = 0; i < 5; i++) {
        const k = (p.tempo * 2.4 + i / 5) % 1
        flamma(g, (i - 2) * u * 0.38, u * 0.3 - k * u * 1.3, 3.4 * (1 - k) + 1, 0.9 * (1 - k * 0.6))
      }
    } else if (male) {
      // il veleno: verde sul corpo e bolle che salgono
      disc(g, 0, 0, u, '#5fd02a', 0.26)
      for (let i = 0; i < 4; i++) {
        const k = (p.tempo * 1.2 + i / 4) % 1
        disc(g, (i - 1.5) * u * 0.5, -u * 0.5 - k * u * 1.3, 1.8 * (1 - k) + 0.3, '#9dff4a', 1 - k)
      }
    }
    if (fragile && gelo > 0) {
      // chi è fragile ha una crepa nel ghiaccio e ogni tanto un lampo
      g.strokeStyle = rgba('#ffffff', 0.9); g.lineWidth = 1.1
      g.beginPath(); g.moveTo(-u * 0.4, -u * 0.8); g.lineTo(-u * 0.1, -u * 0.2); g.lineTo(-u * 0.35, u * 0.25); g.lineTo(u * 0.1, u * 0.75); g.stroke()
      add(g, () => glow(g, u * 0.35, -u * 0.5, 7, '#ffffff', 0.9 * Math.abs(Math.sin(p.tempo * 9))))
    }
  })
}
