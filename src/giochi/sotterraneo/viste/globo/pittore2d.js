// La strada A dei globi vivi (docs/sotterraneo/barra.md): la sfera dipinta in un canvas 2D. Il liquido col pelo a onde, il
// suo pelo visto un po' dall'alto (un'ellisse più chiara), le bolle, l'ombra della sfera, i riflessi del vetro. Lavora in
// unità del globo (−1..1, y in su) dentro un canvas quadrato; il canvas lo dimensiona chi lo chiama (GloboVivo.vue)
export const COLORI = {
  vita: { chiaro: '#ff7a5e', pieno: '#c8160d', fondo: '#4a0404', vuoto: '#2a0909', vuoto2: '#0b0203', schiuma: '#ffb59c' },
  energia: { chiaro: '#a8e4ff', pieno: '#2f7bff', fondo: '#0a1f6e', vuoto: '#0a1430', vuoto2: '#03050d', schiuma: '#d6f2ff' },
}

// y del pelo all'ascissa x: due onde a velocità diverse (una sola sembra un nastro che scorre)
const pelo = (f, x) => f.pelo + Math.sin(x * 3.1 + f.fase) * f.onda + Math.sin(x * 5.3 - f.fase * 1.4) * f.onda * 0.45

export function dipingi2d(ctx, lato, tipo, f) {
  const c = COLORI[tipo] || COLORI.vita
  const r = lato / 2
  ctx.setTransform(1, 0, 0, 1, 0, 0)
  ctx.clearRect(0, 0, lato, lato)
  ctx.setTransform(r, 0, 0, -r, r, r)       // da qui in unità del globo, y in su
  ctx.save()
  ctx.beginPath(); ctx.arc(0, 0, 1, 0, Math.PI * 2); ctx.clip()

  // il vetro vuoto: scuro, un po' più chiaro in basso al centro
  let g = ctx.createRadialGradient(0, -0.25, 0.1, 0, 0, 1.05)
  g.addColorStop(0, c.vuoto); g.addColorStop(1, c.vuoto2)
  ctx.fillStyle = g; ctx.fillRect(-1, -1, 2, 2)

  if (f.pelo > -1.02) {
    // il corpo del liquido, fino al pelo ondulato
    ctx.beginPath(); ctx.moveTo(-1, -1)
    for (let i = 0; i <= 24; i++) { const x = -1 + i / 12; ctx.lineTo(x, pelo(f, x)) }
    ctx.lineTo(1, -1); ctx.closePath()
    g = ctx.createLinearGradient(0, f.pelo, 0, -1)
    g.addColorStop(0, c.chiaro); g.addColorStop(0.35, c.pieno); g.addColorStop(1, c.fondo)
    ctx.fillStyle = g; ctx.fill()
    // il pelo visto dall'alto: un'ellisse chiara larga quanto la sfera a quell'altezza
    const largo = Math.sqrt(Math.max(0, 1 - f.pelo * f.pelo))
    if (largo > 0.05 && f.pelo < 0.98) {
      ctx.beginPath(); ctx.ellipse(0, pelo(f, 0), largo, largo * 0.16, 0, 0, Math.PI * 2)
      ctx.globalAlpha = 0.35; ctx.fillStyle = c.schiuma; ctx.fill(); ctx.globalAlpha = 1
      ctx.lineWidth = 0.025; ctx.strokeStyle = c.schiuma; ctx.globalAlpha = 0.7
      ctx.beginPath(); ctx.ellipse(0, pelo(f, 0), largo, largo * 0.16, 0, Math.PI, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1
    }
    // le bolle: un tondo chiaro col suo punto di luce
    for (const b of f.bolle) {
      ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255,255,255,.22)'; ctx.fill()
      ctx.lineWidth = 0.012; ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.stroke()
      ctx.beginPath(); ctx.arc(b.x - b.r * 0.35, b.y + b.r * 0.35, b.r * 0.28, 0, Math.PI * 2)
      ctx.fillStyle = 'rgba(255,255,255,.8)'; ctx.fill()
    }
  }
  // la luce di una cura, il lampo di un colpo
  if (f.luce > 0) { ctx.globalAlpha = f.luce * 0.45; ctx.fillStyle = c.schiuma; ctx.fillRect(-1, -1, 2, 2); ctx.globalAlpha = 1 }
  if (f.lampo > 0) { ctx.globalAlpha = f.lampo * 0.55; ctx.fillStyle = '#ff2a12'; ctx.fillRect(-1, -1, 2, 2); ctx.globalAlpha = 1 }

  // la sfera: scura ai bordi, come un volume e non un disco
  g = ctx.createRadialGradient(-0.25, 0.25, 0.2, 0, 0, 1)
  g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.7, 'rgba(0,0,0,.18)'); g.addColorStop(1, 'rgba(0,0,0,.72)')
  ctx.fillStyle = g; ctx.fillRect(-1, -1, 2, 2)
  // i riflessi del vetro: la finestra grande in alto a sinistra, il punto duro, il riflesso basso
  ctx.save(); ctx.translate(-0.34, 0.46); ctx.rotate(0.5); ctx.scale(0.42, 0.24)
  g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1)
  g.addColorStop(0, 'rgba(255,255,255,.75)'); g.addColorStop(0.6, 'rgba(255,255,255,.2)'); g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 1, 0, Math.PI * 2); ctx.fill(); ctx.restore()
  ctx.beginPath(); ctx.arc(-0.42, 0.52, 0.07, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,.95)'; ctx.fill()
  ctx.save(); ctx.translate(0.2, -0.78); ctx.scale(0.5, 0.12)
  g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1)
  g.addColorStop(0, 'rgba(255,255,255,.28)'); g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 1, 0, Math.PI * 2); ctx.fill(); ctx.restore()
  ctx.restore()
  // il bordo del vetro: un filo chiaro che dice «sfera»
  ctx.lineWidth = 0.05; ctx.strokeStyle = 'rgba(255,255,255,.14)'
  ctx.beginPath(); ctx.arc(0, 0, 0.975, 0, Math.PI * 2); ctx.stroke()
}
