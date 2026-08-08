/* ═══════════════════════════════════════════════════════════════════
   LE CIME DELLE TORRI — quello che si vede in punta.

   Coordinate locali, con l'origine sulla corona di merli: ognuna riceve
   (pennello, unità, stadio, tinta, tempo) e disegna attorno allo zero.

   La cima cambia di netto ai tre stadi (1-3, 4-6, 7-10) ed è lì che si
   vede il salto: l'arco diventa balestra e poi tripla balestra, la
   bombarda diventa doppio cannone e poi rampa di missili, il globo si
   mette anelli e rune. Un calcolo difficile deve *vedersi*, non finire
   in un numerino.

   Sono indicizzate per **aspetto**, non per operazione: quale torre si
   compri con quale conto lo decide `data/ops.js`, e scambiarli non deve
   voler dire venire a rimescolare i disegni qui dentro.
   ═══════════════════════════════════════════════════════════════════ */

function cimaArciere(p, s, stadio, tinta, t) {
  const { ctx } = p
  if (stadio === 0) {
    ctx.strokeStyle = '#7a5433'; ctx.lineWidth = 1.9 * s; ctx.lineCap = 'round'
    ctx.beginPath(); ctx.arc(0, -5 * s, 6 * s, -1.15, 1.15); ctx.stroke()
    ctx.strokeStyle = '#f3ead6'; ctx.lineWidth = 0.9 * s
    ctx.beginPath(); ctx.moveTo(5.4 * s, -9.8 * s); ctx.lineTo(5.4 * s, -0.2 * s); ctx.stroke()
    ctx.strokeStyle = '#5a4a3a'; ctx.lineWidth = 1.6 * s
    ctx.beginPath(); ctx.moveTo(5.4 * s, -5 * s); ctx.lineTo(-3.4 * s, -5 * s); ctx.stroke()
    p.figura([[-7 * s, -5 * s], [-3 * s, -7 * s], [-3 * s, -3 * s]], tinta.scuro)
  } else if (stadio === 1) {
    p.rett(-1.6 * s, -6 * s, 3.2 * s, 6 * s, '#5a4a3a')
    p.in(0, -8 * s, () => {
      p.rett(-9 * s, -1.2 * s, 18 * s, 2.4 * s, '#7a5433')
      ctx.strokeStyle = '#4a3a2a'; ctx.lineWidth = 1.8 * s; ctx.lineCap = 'round'
      ctx.beginPath(); ctx.moveTo(2 * s, -6 * s); ctx.quadraticCurveTo(6 * s, 0, 2 * s, 6 * s); ctx.stroke()
      ctx.strokeStyle = '#f3ead6'; ctx.lineWidth = 0.9 * s
      ctx.beginPath(); ctx.moveTo(2 * s, -6 * s); ctx.lineTo(-4 * s, 0); ctx.lineTo(2 * s, 6 * s); ctx.stroke()
      p.figura([[11 * s, 0], [7 * s, -2.4 * s], [7 * s, 2.4 * s]], tinta.scuro)
    }, -0.18)
  } else {
    p.rett(-2 * s, -7 * s, 4 * s, 7 * s, '#5a4a3a')
    for (const a of [-0.55, 0, 0.55]) p.in(0, -10 * s, () => {
      p.rett(0, -1.1 * s, 11 * s, 2.2 * s, '#7a5433')
      p.figura([[13 * s, 0], [9.4 * s, -2.2 * s], [9.4 * s, 2.2 * s]], tinta.scuro)
    }, a)
    p.ellisse(0, -10 * s, 3.4 * s, 3.4 * s, '#8e8577')
    p.ellisse(-1 * s, -11 * s, 1.6 * s, 1.4 * s, '#c4bdad')
    p.linea([{ x: 0, y: -18.4 * s }, { x: 0, y: -10 * s }], '#6b5f52', 1.1 * s)
    p.figura([[0, -18 * s], [9 * s, -15.6 * s], [0, -13.2 * s]], '#ffd76a')
  }
}

function cimaGhiaccio(p, s, stadio, tinta, t) {
  const cristallo = (dx, h, w, col) => p.figura(
    [[dx, -h], [dx + w, -h * 0.42], [dx + w * 0.55, 0], [dx - w * 0.55, 0], [dx - w, -h * 0.42]], col)
  if (stadio === 0) {
    cristallo(-4 * s, 7 * s, 2.6 * s, '#8fd0ff'); cristallo(4 * s, 8 * s, 2.6 * s, '#8fd0ff')
    cristallo(0, 12 * s, 3.6 * s, '#c9ecff')
    p.figura([[-1 * s, -10 * s], [0.8 * s, -5.4 * s], [-1 * s, -1.6 * s]], '#ffffffcc')
  } else if (stadio === 1) {
    cristallo(-6 * s, 9 * s, 2.8 * s, '#8fd0ff'); cristallo(6 * s, 9.6 * s, 2.8 * s, '#8fd0ff')
    cristallo(-2.6 * s, 13 * s, 3 * s, '#a9dcff'); cristallo(2.4 * s, 17 * s, 4 * s, '#dff2ff')
    for (let i = 0; i < 5; i++) {           // schegge che girano piano
      const a = t * 0.7 + i / 5 * 6.29
      p.ellisse(Math.cos(a) * 10 * s, -8 * s + Math.sin(a) * 3.4 * s, 1.5 * s, 1.5 * s, '#e8f7ff')
    }
  } else {
    p.cerchio(0, -10 * s, 15 * s, '#bfe6ff44')     // l'aura di freddo
    cristallo(-7 * s, 11 * s, 3 * s, '#8fd0ff'); cristallo(7 * s, 11.6 * s, 3 * s, '#8fd0ff')
    cristallo(0, 23 * s, 4.6 * s, '#e8f7ff')
    p.figura([[-1.4 * s, -19 * s], [1.2 * s, -10 * s], [-1.4 * s, -2 * s]], '#ffffffaa')
    for (let i = 0; i < 7; i++) {
      const a = t * 0.9 + i / 7 * 6.29
      p.ellisse(Math.cos(a) * 13 * s, -12 * s + Math.sin(a * 1.3) * 7 * s, 1.6 * s, 1.6 * s, '#ffffff')
    }
  }
}

function cimaMagica(p, s, stadio, tinta, t) {
  const h = (13 + stadio * 4) * s
  p.figura([[-9 * s, 0], [9 * s, 0], [0, -h]], tinta.scuro)          // tetto conico
  p.figura([[-9 * s, 0], [0, 0], [0, -h]], '#ffffff2e')
  if (stadio > 0) for (let i = 0; i < 3; i++) p.rett(-9 * s + i * 6.4 * s, -h * 0.32, 3 * s, 1.4 * s, '#ffd76a')
  const r = (3.8 + stadio * 1.1) * s
  const oy = -h - r - 3 * s + Math.sin(t * 2) * 1.4 * s              // il globo respira
  p.cerchio(0, oy, r * 2.1, tinta.chiaro + '40')
  p.cerchio(0, oy, r, '#d9c2ff')
  p.ellisse(-r * 0.3, oy - r * 0.3, r * 0.4, r * 0.36, '#ffffff')
  if (stadio > 0) {
    p.ctx.strokeStyle = tinta.chiaro + 'aa'; p.ctx.lineWidth = 1.2 * s
    p.ctx.beginPath(); p.ctx.ellipse(0, oy, r * 2.2, r * 0.8, Math.sin(t * 0.6) * 0.4, 0, 6.29); p.ctx.stroke()
  }
  if (stadio > 1) for (let i = 0; i < 3; i++) {
    const a = t * 1.6 + i / 3 * 6.29
    p.ellisse(Math.cos(a) * r * 2.2, oy + Math.sin(a) * r * 0.8, 1.7 * s, 1.7 * s, '#f0e2ff')
  }
}

function cimaBombe(p, s, stadio, tinta, t) {
  const { ctx } = p
  if (stadio === 0) {
    // la bombarda sta seduta sul suo affusto, al centro dei merli: girata
    // attorno all'origine finiva mezza fuori dalla torre
    p.ellisse(0, 0, 5.6 * s, 2.4 * s, '#4a4038')
    p.in(-1.4 * s, -1 * s, () => {
      p.figura([[-3.4 * s, 2 * s], [3.4 * s, 2 * s], [4.6 * s, -10 * s], [-4.6 * s, -10 * s]], '#4a4038')
      p.rett(-5 * s, -11 * s, 10 * s, 2.4 * s, '#6b5f52')
    }, -0.42)
    p.cerchio(4.4 * s, -2.4 * s, 3.4 * s, '#2f2a26')
    p.ellisse(3.2 * s, -3.4 * s, 1.2 * s, 1 * s, '#5c554d')
    ctx.strokeStyle = '#c9a06a'; ctx.lineWidth = 1.2 * s
    ctx.beginPath(); ctx.moveTo(5.8 * s, -4.8 * s)
    ctx.quadraticCurveTo(7.8 * s, -7.6 * s, 6 * s, -8.6 * s); ctx.stroke()
    p.cerchio(6 * s, -9.4 * s, 1.8 * s, '#ffd76a')
  } else if (stadio === 1) {
    p.ellisse(0, -1 * s, 7 * s, 4.4 * s, '#4a4038')
    p.ellisse(0, -2.4 * s, 6.2 * s, 3.6 * s, '#6b5f52')
    for (const d of [-3.2, 3.2]) p.in(d * s, -4 * s, () => {
      p.rett(-2 * s, -12 * s, 4 * s, 13 * s, '#3a332c')
      p.rett(-2.6 * s, -13.4 * s, 5.2 * s, 2.4 * s, '#7a6f60')
    }, -0.45)
    p.cerchio(0, -4 * s, 2.4 * s, '#ffd76a')
    p.cerchio(8 * s, -1 * s, 3 * s, '#2f2a26'); p.cerchio(-8 * s, -1 * s, 3 * s, '#2f2a26')
  } else {
    // la rampa: tre missili pronti, quello di mezzo con il motore acceso
    p.ellisse(0, -1 * s, 8.4 * s, 4.6 * s, '#4a4038')
    p.ellisse(0, -2.6 * s, 7.4 * s, 3.8 * s, '#6b5f52')
    p.in(0, -4 * s, () => {
      for (const d of [-5, 0, 5]) {
        p.rett(d * s - 1.9 * s, -15 * s, 3.8 * s, 13 * s, '#d9d2c6')
        p.figura([[d * s - 1.9 * s, -15 * s], [d * s + 1.9 * s, -15 * s], [d * s, -20 * s]], tinta.chiaro)
        p.figura([[d * s - 1.9 * s, -3 * s], [d * s - 3.6 * s, -0.4 * s], [d * s - 1.9 * s, -0.4 * s]], '#8f8878')
        p.figura([[d * s + 1.9 * s, -3 * s], [d * s + 3.6 * s, -0.4 * s], [d * s + 1.9 * s, -0.4 * s]], '#8f8878')
      }
      const f = 2.4 + Math.sin(t * 9) * 0.8
      p.ellisse(0, 1.4 * s, 2 * s, f * s, '#ffd76a')
      p.ellisse(0, 0.6 * s, 1.2 * s, f * 0.6 * s, '#fff3c4')
    }, -0.32)
  }
}

export const CIME = { arciere: cimaArciere, ghiaccio: cimaGhiaccio,
                      magica: cimaMagica, bombe: cimaBombe }
