// Il cielo degli asteroidi: solo fatti già decisi, mai vite/punti/tabelline
// (vedi docs/asteroidi/volo.md). Contesto 2D nudo, non passa da tela.js.

import { CIELI, disegnaSasso } from './cieli.js'
import { traccia, dipingiAla, disegnaStemma } from './livrea.js'

const TAU = Math.PI * 2

// ricopiate da comune.js (che tira dentro mezzo cassetto del castello)
const canale = (c, i) => parseInt(c.slice(i, i + 2), 16)
const esa = q => Math.round(Math.max(0, Math.min(1, q)) * 255).toString(16).padStart(2, '0')
function mescola(a, b, q) {
  return '#' + [1, 3, 5].map(i =>
    Math.round(canale(a, i) + (canale(b, i) - canale(a, i)) * q)
      .toString(16).padStart(2, '0')).join('')
}

// Il fondale: nebulose e polvere ferme, dipinte una volta su una tela di
// scorta e copiate da lì (lo sfondo in cache di tela.js, per un cielo).
// La tavolozza di ogni cielo sta in cieli.js; `cintura` è quello di sempre.
export function dipingiFondale(W, H, sorte = Math.random, cielo = 'cintura') {
  const pal = CIELI[cielo] || CIELI.cintura
  const cv = document.createElement('canvas')
  cv.width = Math.max(1, Math.floor(W)); cv.height = Math.max(1, Math.floor(H))
  const c = cv.getContext('2d')

  const g = c.createLinearGradient(0, 0, 0, H)
  g.addColorStop(0, pal.alto); g.addColorStop(0.55, pal.medio); g.addColorStop(1, pal.basso)
  c.fillStyle = g; c.fillRect(0, 0, W, H)

  const D = Math.max(W, H)
  for (const n of pal.neb) {
    const r = D * n.r
    const rg = c.createRadialGradient(W * n.x, H * n.y, 0, W * n.x, H * n.y, r)
    rg.addColorStop(0, n.c + '3a'); rg.addColorStop(0.5, n.c + '16'); rg.addColorStop(1, n.c + '00')
    c.fillStyle = rg; c.fillRect(0, 0, W, H)
  }

  for (let i = 0; i < 260; i++) {
    const x = sorte() * W, y = sorte() * H, r = sorte() * 1.1 + 0.25
    c.globalAlpha = 0.18 + sorte() * 0.5
    c.fillStyle = sorte() < 0.22 ? pal.stella : '#fff'
    c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill()
  }
  c.globalAlpha = 1
  return cv
}

// L'astronave: tre stati di danno a gradini, non a sfumatura. Vedi
// docs/asteroidi/volo.md. `mira` è l'angolo del cannone, -π/2 = verso l'alto.
export const statoScafo = d => (d < 0.34 ? 0 : d < 0.67 ? 1 : 2)

const SCAFO = [[0, -1.18], [0.30, -0.42], [0.36, 0.34], [0.24, 0.74],
               [-0.24, 0.74], [-0.36, 0.34], [-0.30, -0.42]]

function ali(lv) {
  if (lv <= 1) return [[[0.30, -0.10], [0.92, 0.46], [0.86, 0.72], [0.34, 0.60]]]
  if (lv === 2) return [[[0.30, -0.24], [1.16, 0.40], [1.20, 0.66], [0.86, 0.72], [0.34, 0.60]]]
  return [[[0.30, -0.30], [1.26, 0.30], [1.30, 0.58], [0.88, 0.66], [0.34, 0.52]],
          [[0.34, 0.30], [1.04, 0.78], [0.96, 0.98], [0.32, 0.80]]]
}

const PROPULSORI = { 1: [[0, 0.78, 0.20]], 2: [[-0.20, 0.76, 0.17], [0.20, 0.76, 0.17]],
                     3: [[-0.30, 0.74, 0.15], [0, 0.80, 0.19], [0.30, 0.74, 0.15]] }

// Un'ala è sempre scritta nello stesso verso (attacco alto, punta, attacco
// basso): basta a tagliarla senza sapere quale sia. `quanto` è la parte che
// RESTA. I denti sono fissi: un bordo che cambia ogni fotogramma sembra un
// guasto del disegno, non della nave.
const lerp = (p, q, k) => [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k]
const DENTI = [0.20, -0.30, 0.26, -0.22, 0.14]

function strappa(a, quanto) {
  const n = a.length
  const alto = lerp(a[0], a[1], quanto)
  const basso = lerp(a[n - 1], a[n - 2], quanto)
  const bordo = DENTI.map((d, i) => {
    const b = lerp(alto, basso, (i + 1) / (DENTI.length + 1))
    return [b[0] + d * 0.26, b[1]]
  })
  return [a[0], alto, ...bordo, basso, a[n - 1]]
}

// due schegge FUORI dalla sagoma: un contorno con dei cocci attorno si legge come una cosa rotta
const SCHEGGE = [[0.16, -0.10, 0.10, 1.0], [0.30, 0.16, 0.07, -1.4]]

// dove sta lo strappo: serve al gioco per soffiarci il fumo (particelle, non disegno)
export const puntoRotto = (lv = 1) => {
  const a = ali(Math.max(1, Math.min(3, lv)))[0]
  const alto = lerp(a[0], a[1], 0.55)
  return { x: -alto[0], y: alto[1] }
}

// Il metallo: un gradiente più contrastato (chiaro, ombra, chiaro, ombra) e una striscia
// chiara in diagonale che scivola piano. Lavorano sul tracciato già pronto e non lo consumano.
function metallo(g, chiaro, scuro) {
  g.addColorStop(0.15, mescola(chiaro, '#ffffff', 0.5)); g.addColorStop(0.38, chiaro)
  g.addColorStop(0.55, mescola(scuro, '#000000', 0.15)); g.addColorStop(0.72, mescola(chiaro, '#ffffff', 0.3))
  g.addColorStop(1, mescola(scuro, '#000000', 0.3))
}
function riflesso(ctx, R, t) {
  const q = Math.sin(t * 1.1) * R * 0.45
  ctx.save(); ctx.clip(); ctx.rotate(-0.7)
  ctx.fillStyle = 'rgba(255,255,255,0.34)'; ctx.fillRect(-R * 2, q - R * 0.12, R * 4, R * 0.16)
  ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(-R * 2, q + R * 0.08, R * 4, R * 0.06)
  ctx.restore()
}

export function disegnaNave(ctx, n) {
  const R = n.r, lv = Math.max(1, Math.min(3, n.lv || 1))
  const st = statoScafo(Math.max(0, Math.min(1, n.danno || 0)))
  const d = st / 2                       // 0, 0.5, 1: i gradini, non la sfumatura
  const t = n.t || 0
  // la livrea parte dai suoi colori, il danno li imbrunisce sopra: senza livrea è la nave di serie
  const L = n.livrea || null
  const chiaro = mescola(L?.scafo ? mescola(L.scafo, '#ffffff', 0.55) : '#e8eefc', '#5a4a44', d * 0.75)
  const scuro = mescola(L?.scafo ? mescola(L.scafo, '#000000', 0.35) : '#7d8aa6', '#2a1f1c', d * 0.8)
  const accento = mescola(L?.scafo ? mescola(L.scafo, '#000000', 0.2) : '#2f7bff', '#7a3a20', d * 0.7)
  const chiaroAli = L?.ali ? mescola(mescola(L.ali, '#ffffff', 0.3), '#5a4a44', d * 0.75) : chiaro
  const scuroAli = L?.ali ? mescola(mescola(L.ali, '#000000', 0.45), '#2a1f1c', d * 0.8) : scuro
  const fiamma = L?.fiamma || null

  ctx.save()
  ctx.translate(n.x, n.y)

  // sta dietro la nave: davanti la ridipingerebbe di rosso e nasconderebbe lo squarcio
  if (st === 2) {
    const l = 0.35 + 0.65 * Math.abs(Math.sin(t * 5))
    const rg = ctx.createRadialGradient(0, 0, R * 0.7, 0, 0, R * 2.1)
    rg.addColorStop(0, `rgba(255,60,60,${0.34 * l})`); rg.addColorStop(1, 'rgba(255,60,60,0)')
    ctx.fillStyle = rg
    ctx.beginPath(); ctx.arc(0, 0, R * 2.1, 0, TAU); ctx.fill()
  }

  const sp = 0.8 + (n.spinta || 0) * 1.1 + Math.sin(t * 22) * 0.14
  for (const [px, py, pr] of PROPULSORI[lv]) {
    const x = px * R, y = py * R, w = pr * R
    // il motore rotto va a singhiozzo: la fiamma sinistra sparisce e torna
    const lung = w * (3.4 * sp) * (st === 2 && ((px < 0) === (Math.sin(t * 9) > 0)) ? 0.35 : 1)
    const alone = ctx.createRadialGradient(x, y + lung * 0.3, 0, x, y + lung * 0.3, lung * 1.1)
    alone.addColorStop(0, (fiamma || '#7fe3ff') + '55'); alone.addColorStop(1, (fiamma || '#7fe3ff') + '00')
    ctx.fillStyle = alone
    ctx.beginPath(); ctx.arc(x, y + lung * 0.3, lung * 1.1, 0, TAU); ctx.fill()
    const g = ctx.createLinearGradient(x, y, x, y + lung)
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.3, fiamma ? mescola(fiamma, '#ffffff', 0.6) : '#bff2ff')
    g.addColorStop(0.62, fiamma || '#4aa3ff'); g.addColorStop(1, (fiamma || '#2f7bff') + '00')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.moveTo(x - w * 0.75, y); ctx.quadraticCurveTo(x, y + lung * 1.15, x + w * 0.75, y)
    ctx.fill()
    ctx.fillStyle = scuro
    ctx.fillRect(x - w * 0.7, y - w * 0.5, w * 1.4, w * 0.8)
  }

  const resta = st >= 2 ? 0.34 : 0.55   // l'ala sinistra si STRAPPA già alla prima botta
  for (const [i, a] of ali(lv).entries()) {
    for (const verso of [1, -1]) {
      const rotta = st >= 1 && verso < 0 && i === 0
      const p = rotta ? strappa(a, resta) : a
      traccia(ctx, p.map(([x, y]) => [x * verso, y]), R)
      const g = ctx.createLinearGradient(0, -R * 0.4, 0, R * 0.8)
      if (L?.aliLucida) metallo(g, chiaroAli, scuroAli)
      else { g.addColorStop(0, chiaroAli); g.addColorStop(1, scuroAli) }
      ctx.fillStyle = g; ctx.fill()
      if (L) {   // vernice: il riflesso, il disegno e lo stemma stanno DENTRO l'ala com'è (anche strappata)
        if (L.aliLucida) riflesso(ctx, R, t)
        dipingiAla(ctx, p.map(([x, y]) => [x * verso, y]), R, verso, L)
        if (L.stemma && i === 0 && !rotta) {
          const a0 = ali(lv)[0], cx = a0.reduce((q, [x]) => q + x, 0) / a0.length, cy = a0.reduce((q, [, y]) => q + y, 0) / a0.length
          ctx.save(); traccia(ctx, p.map(([x, y]) => [x * verso, y]), R); ctx.clip()
          disegnaStemma(ctx, L.stemma, verso * cx * R * 1.05, cy * R, R * 0.17, L.colStemma)
          ctx.restore()
        }
        traccia(ctx, p.map(([x, y]) => [x * verso, y]), R)
      }
      ctx.lineWidth = Math.max(1, R * 0.05); ctx.strokeStyle = accento; ctx.stroke()
      if (rotta) {   // il bordo bruciato dello strappo
        ctx.strokeStyle = '#1a0f0c'; ctx.lineWidth = Math.max(2.5, R * 0.10); ctx.stroke()
      }
    }
  }

  if (st >= 1) {   // i cocci: dopo le ali, per staccarsi anche dal bordo bruciato
    const a0 = ali(lv)[0]
    const dove = lerp(a0[0], a0[1], resta)
    for (const [dx, dy, r, giro] of SCHEGGE) {
      const ondeggio = Math.sin(t * 1.6 + dx * 9) * 0.045
      const x = -(dove[0] + dx) * R, y = (dove[1] + dy + ondeggio) * R
      ctx.save(); ctx.translate(x, y); ctx.rotate(giro + Math.sin(t * 1.1 + dy * 7) * 0.25)
      ctx.beginPath()
      ctx.moveTo(-r * R, -r * R * 0.7); ctx.lineTo(r * R, -r * R * 0.2)
      ctx.lineTo(r * R * 0.2, r * R * 0.9); ctx.closePath()
      ctx.fillStyle = scuro; ctx.fill()
      ctx.lineWidth = Math.max(1, R * 0.035); ctx.strokeStyle = '#1a0f0c'; ctx.stroke()
      ctx.restore()
    }
    // le scintille: la cosa che SI MUOVE, la prima che l'occhio nota
    const bocca = { x: -dove[0] * R, y: dove[1] * R }
    for (let k = 0; k < 3; k++) {
      const q = (t * 2.2 + k * 0.37) % 1
      if (q > 0.42) continue
      const su = q * 0.9
      ctx.globalAlpha = 1 - q / 0.42
      ctx.fillStyle = k % 2 ? '#ffd94a' : '#ff9d1c'
      ctx.beginPath()
      ctx.arc(bocca.x - su * R * 0.28, bocca.y - su * R * 0.5,
              Math.max(1.4, R * 0.07) * (1 - su), 0, TAU)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }

  traccia(ctx, SCAFO, R)
  const g = ctx.createLinearGradient(-R * 0.4, -R, R * 0.5, R)
  if (L?.scafoLucida) { g.addColorStop(0, '#ffffff'); metallo(g, chiaro, scuro) }
  else { g.addColorStop(0, '#ffffff'); g.addColorStop(0.35, chiaro); g.addColorStop(1, scuro) }
  ctx.fillStyle = g; ctx.fill()
  if (L?.scafoLucida) riflesso(ctx, R, t)
  ctx.lineWidth = Math.max(1.5, R * 0.06); ctx.strokeStyle = accento; ctx.stroke()

  if (st >= 1) {   // ammaccature: macchie ferme, così la nave non «brulica» a ogni fotogramma
    ctx.fillStyle = '#00000055'
    const macchie = [[0.16, 0.10, 0.16], [-0.18, 0.38, 0.12], [0.06, -0.55, 0.10]]
    macchie.slice(0, st === 2 ? 3 : 2).forEach(([x, y, r]) => {
      ctx.beginPath(); ctx.arc(x * R, y * R, r * R, 0, TAU); ctx.fill()
    })

    // la luce d'allarme: sul lato buono, non sull'ala strappata (sparirebbe col pezzo mancante)
    const rossa = st >= 2
    const battito = Math.abs(Math.sin(t * (rossa ? 7.5 : 3.6)))
    const acceso = 0.22 + 0.78 * battito * battito
    const tinta = rossa ? '255,70,60' : '255,176,32'
    const bx = R * 0.20, by = -R * 0.05
    const raggio = Math.max(9, R * 0.5)
    const al = ctx.createRadialGradient(bx, by, 0, bx, by, raggio)
    al.addColorStop(0, `rgba(${tinta},${0.95 * acceso})`)
    al.addColorStop(0.45, `rgba(${tinta},${0.4 * acceso})`)
    al.addColorStop(1, `rgba(${tinta},0)`)
    ctx.fillStyle = al
    ctx.beginPath(); ctx.arc(bx, by, raggio, 0, TAU); ctx.fill()
    // mai sotto due pixel, se no la spia sparisce a nave piccola
    ctx.fillStyle = `rgba(${tinta},${0.45 + 0.55 * acceso})`
    ctx.beginPath(); ctx.arc(bx, by, Math.max(2.2, R * 0.11), 0, TAU); ctx.fill()
  }

  // la cabina
  const cy = -R * 0.42
  ctx.beginPath(); ctx.ellipse(0, cy, R * 0.21, R * 0.30, 0, 0, TAU)
  const cg = ctx.createLinearGradient(0, cy - R * 0.3, 0, cy + R * 0.3)
  cg.addColorStop(0, st === 2 ? '#ffb3b3' : '#dffaff')
  cg.addColorStop(1, st === 2 ? '#7a1f1f' : '#2f7bff')
  ctx.fillStyle = cg; ctx.fill()
  ctx.lineWidth = Math.max(1, R * 0.045); ctx.strokeStyle = chiaro; ctx.stroke()
  if (st === 2) {   // il vetro crepato
    ctx.strokeStyle = '#ffffffcc'; ctx.lineWidth = Math.max(1, R * 0.03)
    ctx.beginPath()
    ctx.moveTo(-R * 0.18, cy - R * 0.1); ctx.lineTo(R * 0.04, cy + R * 0.02)
    ctx.lineTo(R * 0.16, cy + R * 0.2); ctx.moveTo(R * 0.04, cy + R * 0.02)
    ctx.lineTo(R * 0.12, cy - R * 0.22); ctx.stroke()
  }

  ctx.save()
  ctx.translate(0, -R * 0.18)
  // la torretta è ferma e non ruota: senza, il cannone sembra staccato e appoggiato lì
  ctx.beginPath(); ctx.arc(0, 0, R * 0.26, 0, TAU)
  const tg = ctx.createRadialGradient(-R * 0.08, -R * 0.1, 0, 0, 0, R * 0.26)
  tg.addColorStop(0, chiaro); tg.addColorStop(1, scuro)
  ctx.fillStyle = tg; ctx.fill()
  ctx.lineWidth = Math.max(1, R * 0.045); ctx.strokeStyle = accento; ctx.stroke()
  ctx.rotate((n.mira ?? -Math.PI / 2) + Math.PI / 2)
  ctx.fillStyle = mescola('#b9c6dd', '#5a4a44', d * 0.7)
  ctx.fillRect(-R * 0.13, -R * 0.50, R * 0.26, R * 0.50)
  ctx.fillStyle = mescola('#8f9fbb', '#5a4a44', d * 0.7)
  ctx.fillRect(-R * 0.10, -R * 0.95, R * 0.20, R * 0.50)
  ctx.fillStyle = n.gelo > 0 ? '#9fd8ff' : '#ffd94a'   // azzurra col gelo, per dire che spara la nave
  ctx.fillRect(-R * 0.14, -R * 1.03, R * 0.28, R * 0.15)
  ctx.restore()

  // la botta appena presa: la nave sbianca per un attimo
  if (n.botta > 0) {
    traccia(ctx, SCAFO, R)
    ctx.fillStyle = `rgba(255,120,120,${Math.min(0.8, n.botta)})`; ctx.fill()
  }
  // la riparazione: un lampo verde, il contrario esatto della botta
  if (n.riparata > 0) {
    traccia(ctx, SCAFO, R)
    ctx.fillStyle = `rgba(140,255,180,${Math.min(0.8, n.riparata)})`; ctx.fill()
  }

  // brina esagonale: un cerchio si confonderebbe con la luce dei motori
  if (n.gelo > 0) {
    const q = Math.min(1, n.gelo)
    const k = 1 + Math.sin(t * 3) * 0.04
    const rr = R * 1.75 * k
    ctx.beginPath()
    for (let i = 0; i < 6; i++) {
      const ang = -Math.PI / 2 + i * TAU / 6
      const x = Math.cos(ang) * rr, y = Math.sin(ang) * rr * 1.05
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)
    }
    ctx.closePath()
    const sg = ctx.createRadialGradient(0, 0, rr * 0.55, 0, 0, rr)
    sg.addColorStop(0, '#9fd8ff00'); sg.addColorStop(1, '#9fd8ff' + esa(0.22 * q))
    ctx.fillStyle = sg; ctx.fill()
    ctx.strokeStyle = '#dff6ff' + esa(0.8 * q); ctx.lineWidth = Math.max(2, R * 0.07); ctx.stroke()
  }
  ctx.restore()
}

// Gli asteroidi: un poligono (forma decisa dal gioco) con crateri, bordo
// caldo di chi entra in atmosfera, e ombra portata.
export function disegnaAsteroide(ctx, a, S, t) {
  if (a.specie && a.specie !== 'roccia') { disegnaSasso(ctx, a, S, t); return }
  const R = a.r
  ctx.save(); ctx.translate(a.x, a.y)

  if (a.boss) {
    const k = 1 + Math.sin(t * 4 + a.ph) * 0.06
    const h = ctx.createRadialGradient(0, 0, R * 0.8, 0, 0, R * 1.9 * k)
    h.addColorStop(0, '#ff6b6b55'); h.addColorStop(0.6, '#ff9d1c22'); h.addColorStop(1, '#ff6b6b00')
    ctx.fillStyle = h; ctx.beginPath(); ctx.arc(0, 0, R * 1.9 * k, 0, TAU); ctx.fill()
    ctx.scale(k, k)
  }

  // l'attrito sta davanti (sotto), non dietro: il sasso scende, e si scalda sotto
  const brina = Math.max(0, Math.min(1, a.gelo || 0))
  const caldo = brina > 0 ? '#9fd8ff' : a.boss ? '#ff6b6b' : '#ff9d1c'
  const bg = ctx.createRadialGradient(0, R * 0.55, R * 0.2, 0, R * 0.55, R * 1.25)
  bg.addColorStop(0, caldo + (a.boss ? '77' : '55')); bg.addColorStop(1, caldo + '00')
  ctx.fillStyle = bg
  ctx.beginPath(); ctx.arc(0, R * 0.55, R * 1.25, 0, TAU); ctx.fill()
  const sc = ctx.createLinearGradient(0, -R * 1.7, 0, 0)
  sc.addColorStop(0, caldo + '00'); sc.addColorStop(1, caldo + '1c')
  ctx.fillStyle = sc
  ctx.beginPath(); ctx.moveTo(-R * 0.34, 0); ctx.lineTo(0, -R * 1.7); ctx.lineTo(R * 0.34, 0)
  ctx.closePath(); ctx.fill()

  ctx.save()
  ctx.rotate(a.rot)
  ctx.beginPath()
  a.forma.forEach((m, i) => {
    const ang = i / a.forma.length * TAU
    const x = Math.cos(ang) * R * m, y = Math.sin(ang) * R * m
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)
  })
  ctx.closePath()
  const rg = ctx.createRadialGradient(-R * 0.34, -R * 0.34, R * 0.12, 0, 0, R * 1.05)
  if (a.boss) { rg.addColorStop(0, '#e07068'); rg.addColorStop(0.6, '#8f2a22'); rg.addColorStop(1, '#3a0f0c') }
  else if (a.rossa) { rg.addColorStop(0, '#c9876a'); rg.addColorStop(0.6, '#8a4a38'); rg.addColorStop(1, '#3a1f18') }   // marte
  else { rg.addColorStop(0, '#b3a591'); rg.addColorStop(0.6, '#6d6153'); rg.addColorStop(1, '#3a332b') }
  ctx.fillStyle = rg; ctx.fill()
  ctx.save(); ctx.clip()
  for (const [cx, cy, cr] of a.crateri || []) {   // bordo chiaro in alto: la luce viene dall'alto
    ctx.beginPath(); ctx.arc(cx * R, cy * R, cr * R, 0, TAU)
    ctx.fillStyle = a.boss ? '#00000044' : '#00000038'; ctx.fill()
    ctx.beginPath(); ctx.arc(cx * R, cy * R - cr * 0.18, cr * R, Math.PI * 1.1, Math.PI * 1.9)
    ctx.strokeStyle = '#ffffff22'; ctx.lineWidth = Math.max(1, R * 0.04); ctx.stroke()
  }
  const og = ctx.createLinearGradient(-R * 0.3, -R * 0.3, R, R)
  og.addColorStop(0, '#00000000'); og.addColorStop(1, '#00000066')
  ctx.fillStyle = og; ctx.fillRect(-R, -R, R * 2, R * 2)
  ctx.restore()
  ctx.lineWidth = (a.boss ? 4.5 : 2.5) * S
  ctx.strokeStyle = a.boss ? '#ffd94a' : '#241f19'
  ctx.stroke()
  ctx.restore()

  ctx.restore()

  // il numero si disegna per ultimo, dritto, e non ruota col sasso
  ctx.fillStyle = '#fff'
  ctx.font = `900 ${R * 0.85}px "Emoji Gioco", system-ui, sans-serif`
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.lineWidth = 5 * S; ctx.strokeStyle = '#000000aa'
  ctx.strokeText(a.v, a.x, a.y); ctx.fillText(a.v, a.x, a.y)
}

// Il colpo: due linee sovrapposte (larga sfumata + bianca sottile), per leggere «laser» e non «riga»
export function disegnaRaggio(ctx, r, S) {
  const q = Math.max(0, r.vita)
  ctx.save()
  ctx.globalAlpha = q
  ctx.lineCap = 'round'
  ctx.strokeStyle = r.c; ctx.lineWidth = 13 * S * q
  ctx.beginPath(); ctx.moveTo(r.x0, r.y0); ctx.lineTo(r.x1, r.y1); ctx.stroke()
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 4.5 * S * q
  ctx.beginPath(); ctx.moveTo(r.x0, r.y0); ctx.lineTo(r.x1, r.y1); ctx.stroke()
  const g = ctx.createRadialGradient(r.x0, r.y0, 0, r.x0, r.y0, 26 * S * q)
  g.addColorStop(0, '#ffffffcc'); g.addColorStop(1, '#ffffff00')
  ctx.fillStyle = g
  ctx.beginPath(); ctx.arc(r.x0, r.y0, 26 * S * q, 0, TAU); ctx.fill()
  ctx.restore()
}

// spicchi della forma dell'asteroide, non cerchietti: un sasso che esplode lascia sassi
export function disegnaFrammento(ctx, f) {
  ctx.save()
  ctx.globalAlpha = Math.max(0, f.vita)
  ctx.translate(f.x, f.y); ctx.rotate(f.rot)
  ctx.beginPath()
  f.punti.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))
  ctx.closePath()
  ctx.fillStyle = f.c; ctx.fill()
  ctx.strokeStyle = '#00000066'; ctx.lineWidth = 2; ctx.stroke()
  ctx.restore()
}
