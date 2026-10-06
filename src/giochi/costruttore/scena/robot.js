// Il Robot, uno solo: i pezzi del disegno come dati, in unità del robot
// (origine fra testa e corpo, y in giù, alto 35,4 dall'antenna ai cingoli).
// Li dipingono la scheda (SVG, viste/Robot.vue), il cantiere e il porto
// (canvas, `dipingiRobot`). Le pose: docs/costruttore/scheda.md («Il robot»).

export const COLORI = {
  inchiostro: '#1c2420', testa: '#e3ebe7', corpo: '#cbd6d1', braccia: '#9fb0a8',
  occhi: '#7fe0f0', pannello: '#e8a24f', antenna: '#ffc857', allarme: '#e5484d', mozzo: '#55635d',
}
export const ALTO = 35.4      // dall'antenna (-19,4) ai cingoli (16)
export const PIEDI = 16

const R = (x, y, w, h, r, fill, sw = 0) => ({ t: 'rett', x, y, w, h, r, fill, stroke: sw ? COLORI.inchiostro : null, sw })
const C = (x, y, r, fill, sw = 0) => ({ t: 'cerchio', x, y, r, fill, stroke: sw ? COLORI.inchiostro : null, sw })
const L = (punti, colore, sw) => ({ t: 'linea', punti, stroke: colore, sw })

/* verso: 'fronte' | 'destra' | 'sinistra' | 'retro'
   braccia: 'giu' | 'avanti' (verso dove guarda) | 'su'
   occhi: 'aperti' | 'spalancati' (cade) | 'contenti' | 'strizzati' (ha sbattuto)
   giro: l'angolo dei mozzi sui cingoli, che girano quando cammina */
export function pezzi({ verso = 'fronte', braccia = 'giu', occhi = 'aperti', allarme = false, giro = 0 } = {}) {
  const v = verso === 'destra' ? 1 : verso === 'sinistra' ? -1 : 0
  const dietro = verso === 'retro'
  const p = []
  /* le braccia stanno dietro testa e corpo: si disegnano prima */
  if (braccia === 'su') {
    p.push(R(-14, -13, 3.5, 11, 1.5, COLORI.braccia, 1.2), R(10.5, -13, 3.5, 11, 1.5, COLORI.braccia, 1.2))
  } else if (braccia === 'avanti' && v) {
    p.push(R(v > 0 ? -12.5 : 9, 2, 3.5, 7, 1.5, COLORI.braccia, 1.2))
    p.push(R(v > 0 ? 6 : -14.5, 3, 8.5, 3.5, 1.5, COLORI.braccia, 1.2))
  } else {
    p.push(R(-12.5, 2, 3.5, 7, 1.5, COLORI.braccia, 1.2), R(9, 2, 3.5, 7, 1.5, COLORI.braccia, 1.2))
  }
  p.push(L([[0, -12], [0, -16.5]], COLORI.inchiostro, 1.6))
  p.push(C(0, -17, 2.4, allarme ? COLORI.allarme : COLORI.antenna, 1.2))
  p.push(R(-10, -12, 20, 12, 4, COLORI.testa, 1.4))
  if (dietro) {
    for (let i = 0; i < 3; i++) p.push(R(-5.5, -9.2 + i * 2.6, 11, 1.2, 0.6, COLORI.braccia))
  } else {
    const dx = v * 2
    p.push(R(-6.5 + dx, -8.5, 13, 5.5, 2.5, COLORI.inchiostro))
    for (const s of [-1, 1]) {
      const x = s * 3.2 + dx, y = -5.75
      if (occhi === 'contenti') p.push(L([[x - 1.6, y + 0.9], [x, y - 0.9], [x + 1.6, y + 0.9]], COLORI.occhi, 1.1))
      else if (occhi === 'strizzati') p.push(L([[x + s * 1.5, y - 1.4], [x - s * 1.1, y], [x + s * 1.5, y + 1.4]], COLORI.occhi, 1.1))
      else if (occhi === 'spalancati') p.push(C(x, y, 2.1, COLORI.occhi), C(x, y, 0.8, COLORI.inchiostro))
      else p.push(C(x, y, 1.5, COLORI.occhi))
    }
  }
  p.push(R(-8.5, 0.5, 17, 10.5, 2.5, COLORI.corpo, 1.4))
  if (dietro) p.push(R(-4, 3, 8, 5, 1, COLORI.braccia))
  else p.push(R(-3 + v * 1.5, 3.5, 6, 3.5, 1, COLORI.pannello))
  /* i cingoli toccano terra (`suolo`: sulla scheda non dondolano); i mozzi
     hanno un raggio, e girando dicono che cammina */
  const cingoli = [R(-9.5, 11.5, 19, 4.5, 2.25, COLORI.inchiostro)]
  const cx = Math.cos(giro), sy = Math.sin(giro)
  for (const x of [-5.5, 0, 5.5]) {
    cingoli.push(C(x, 13.75, 1.35, COLORI.mozzo))
    cingoli.push(L([[x - cx, 13.75 - sy], [x + cx, 13.75 + sy]], COLORI.inchiostro, 0.6))
  }
  return [...p, ...cingoli.map(k => ({ ...k, suolo: true }))]
}

/* Il robot sulla tela: `x` è il mezzo, `piedi` dove poggiano i cingoli,
   `scala` i pixel per unità. Se `ctx.roundRect` manca (Safari < 16) i
   pezzi sono squadrati, ma ci sono. */
export function dipingiRobot(ctx, x, piedi, scala, posa) {
  ctx.save()
  ctx.translate(x, piedi - PIEDI * scala)
  ctx.scale(scala, scala)
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  for (const k of pezzi(posa)) {
    ctx.beginPath()
    if (k.t === 'rett') {
      if (ctx.roundRect) ctx.roundRect(k.x, k.y, k.w, k.h, k.r)
      else ctx.rect(k.x, k.y, k.w, k.h)
    } else if (k.t === 'cerchio') ctx.arc(k.x, k.y, k.r, 0, Math.PI * 2)
    else {
      k.punti.forEach(([a, b], i) => (i ? ctx.lineTo(a, b) : ctx.moveTo(a, b)))
      ctx.strokeStyle = k.stroke
      ctx.lineWidth = k.sw
      ctx.stroke()
      continue
    }
    ctx.fillStyle = k.fill
    ctx.fill()
    if (k.stroke) { ctx.strokeStyle = k.stroke; ctx.lineWidth = k.sw; ctx.stroke() }
  }
  ctx.restore()
}
