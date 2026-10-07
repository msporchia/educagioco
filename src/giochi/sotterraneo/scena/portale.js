// Il portale, disegnato in codice e non dal foglio: un ovale di luce azzurra e viola che gira, a pixel interi
// come il resto ma coi colori di nessuno scenario, così si capisce che è magia e non arredo
// (docs/sotterraneo/regole.md). Lo stesso disegno giù nel piano (scena/tela.js) e sopra nel villaggio
// (viste/Portale.vue): `ctx` lavora in pixel di sprite, (cx, cy) è il centro dell'ovale.

export const PORTALE = { rx: 7, ry: 11 }   // i semiassi, in pixel

// l'anello: otto spicchi che girano, dal bianco al viola e ritorno
const ANELLO = ['#f2f8ff', '#9be9ff', '#4fb4ff', '#6f7bff', '#b05cff', '#6f7bff', '#4fb4ff', '#9be9ff']
const DENTRO = ['#2a1d72', '#3d2aa6', '#5a44d6']

export function dipingiPortale(ctx, cx, cy, t, { alfa = 1, bagliore = true } = {}) {
  const { rx, ry } = PORTALE
  ctx.save()
  ctx.globalAlpha = alfa
  if (bagliore) {
    const r = ry * 1.7
    const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, r)
    g.addColorStop(0, `rgba(150,120,255,${0.42 + 0.1 * Math.sin(t * 3)})`)
    g.addColorStop(1, 'rgba(80,170,255,0)')
    ctx.fillStyle = g
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill()
  }
  // l'ombra per terra, sotto l'ovale
  ctx.fillStyle = 'rgba(10,6,30,.45)'
  ctx.beginPath(); ctx.ellipse(cx, cy + ry, rx * 0.9, 2, 0, 0, 7); ctx.fill()

  for (let j = -ry; j <= ry; j++) for (let i = -rx; i <= rx; i++) {
    const d = Math.hypot(i / (rx + 0.5), j / (ry + 0.5))
    if (d > 1) continue
    const a = Math.atan2(j / ry, i / rx)
    if (d > 0.74) {
      const k = Math.floor(((a / (2 * Math.PI)) * 8 + t * 2.4) % 8 + 8) % 8
      ctx.fillStyle = ANELLO[k]
    } else {
      // dentro un vortice più scuro, che gira al contrario
      const s = Math.sin(a * 2 + d * 9 - t * 5)
      ctx.fillStyle = DENTRO[s > 0.35 ? 2 : s > -0.35 ? 1 : 0]
    }
    ctx.fillRect(cx + i, cy + j, 1, 1)
  }
  // tre scintille che girano attorno
  ctx.fillStyle = '#ffffff'
  for (let n = 0; n < 3; n++) {
    const g = t * 1.7 + n * 2.094
    ctx.fillRect(Math.round(cx + Math.cos(g) * (rx + 2)), Math.round(cy + Math.sin(g) * (ry + 1)), 1, 1)
  }
  ctx.restore()
}
