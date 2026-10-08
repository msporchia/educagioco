// I cieli del volo: la tavolozza del fondale, di che cosa sono fatti i sassi e le cose grandi
// che si muovono dietro. Il gioco decide quale cielo e quale numero; qui solo il disegno.
// Nel disegno niente Math.random: tutto viene da `a.seme`, se no il sasso ribolle.

const TAU = Math.PI * 2

export const CIELI = {
  cintura: {   // il cielo di sempre
    alto: '#05081a', medio: '#0a0f2e', basso: '#0e1338', stella: '#9fd4ff', specie: 'roccia',
    neb: [
      { x: 0.18, y: 0.22, r: 0.55, c: '#6a2fd0' },
      { x: 0.82, y: 0.38, r: 0.48, c: '#2f6bd0' },
      { x: 0.45, y: 0.72, r: 0.60, c: '#1c4a8a' },
      { x: 0.70, y: 0.08, r: 0.35, c: '#d02f8a' },
    ],
  },
  ghiaccio: {
    alto: '#031420', medio: '#06263a', basso: '#0a3550', stella: '#bff8ff', specie: 'ghiaccio',
    neb: [{ x: 0.2, y: 0.2, r: 0.5, c: '#2fd0d0' }, { x: 0.85, y: 0.5, r: 0.45, c: '#2f8bd0' }, { x: 0.4, y: 0.85, r: 0.5, c: '#9fe8ff' }],
  },
  rottami: {
    alto: '#120c08', medio: '#1e150f', basso: '#2a1d14', stella: '#ffd9a0', specie: 'rottami',
    neb: [{ x: 0.8, y: 0.2, r: 0.5, c: '#d0702f' }, { x: 0.15, y: 0.6, r: 0.45, c: '#8a5a2f' }],
  },
  cristalli: {
    alto: '#12051f', medio: '#1d0a33', basso: '#2a0f45', stella: '#f0b3ff', specie: 'cristalli',
    neb: [{ x: 0.2, y: 0.3, r: 0.5, c: '#c02fd0' }, { x: 0.85, y: 0.65, r: 0.5, c: '#6a2fd0' }, { x: 0.6, y: 0.05, r: 0.35, c: '#ff5fd0' }],
  },
  alieni: {
    alto: '#04140a', medio: '#082414', basso: '#10301e', stella: '#c8ffb0', specie: 'dischi',
    neb: [{ x: 0.25, y: 0.25, r: 0.5, c: '#2fd06a' }, { x: 0.8, y: 0.6, r: 0.5, c: '#d02fa8' }],
  },
  marte: {   // sassi di roccia, ma rossa (`rossa`: lo legge disegnaAsteroide)
    alto: '#1a0a08', medio: '#2a1210', basso: '#3a1a14', stella: '#ffc9a0', specie: 'roccia', rossa: true,
    neb: [{ x: 0.2, y: 0.25, r: 0.5, c: '#c0502f' }, { x: 0.8, y: 0.6, r: 0.5, c: '#8a3a2f' }],
  },
  sole: {
    alto: '#1a0805', medio: '#200d10', basso: '#1a1030', stella: '#ffe2a0', specie: 'lava',
    neb: [{ x: 0.85, y: 0.05, r: 0.6, c: '#ff8a1c' }, { x: 0.2, y: 0.5, r: 0.4, c: '#d02f2f' }],
  },
  nero: {
    alto: '#030208', medio: '#07050f', basso: '#0c0818', stella: '#d9c8ff', specie: 'nero',
    neb: [{ x: 0.5, y: 0.3, r: 0.4, c: '#6a2fd0' }],
  },
}

export const specieDi = cielo => CIELI[cielo]?.specie || 'roccia'

const COLORE_FRAMMENTI = {
  roccia: '#6d6153', ghiaccio: '#9fdcf5', rottami: '#8a93a3', cristalli: '#b04dff',
  dischi: '#8a96b0', lava: '#4a2a1c', nero: '#2a1f45', bomba: '#4a3a6a',
}
export const coloreFrammenti = specie => COLORE_FRAMMENTI[specie] || COLORE_FRAMMENTI.roccia

// ---- le cose grandi, dietro ai sassi ----
// Tutto in unità di `k` (1 = uno schermo largo 360): su un telefono o su un monitor ha lo stesso peso.

function sole(c, W, H, t, k) {
  const r = 190 * k, x = W * 0.82, y = -30 * k
  c.save(); c.translate(x, y)
  for (let i = 0; i < 16; i++) {
    c.rotate(TAU / 16); c.fillStyle = '#ffb34733'
    c.beginPath(); c.moveTo(-14 * k, r * 0.95); c.lineTo(0, r * (1.35 + 0.06 * Math.sin(t * 2 + i))); c.lineTo(14 * k, r * 0.95); c.fill()
  }
  c.restore()
  const g = c.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r)
  g.addColorStop(0, '#fff6c2'); g.addColorStop(0.5, '#ffc53a'); g.addColorStop(1, '#ff7a1c')
  c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill()
}

// tenue di proposito: un cerchio nero grosso e un bordo vivo sembrerebbero qualcosa da toccare
function bucoNero(c, W, H, t, k) {
  const x = W * 0.5, y = H * 0.27
  c.save(); c.globalAlpha = 0.8; c.translate(x, y)
  c.lineWidth = Math.max(1, 1.2 * k); c.strokeStyle = '#d9c8ff33'
  for (let i = 0; i < 26; i++) {   // stelle stirate attorno
    const a = i * 2.39 + t * 0.15, d = (90 + (i * 37) % 120) * k
    c.beginPath(); c.arc(0, 0, d, a, a + 0.35); c.stroke()
  }
  c.rotate(-0.18)
  const anelli = ['#ff8a3c22', '#ffb34733', '#ffd9a044', '#c08cff44', '#ffffff55']
  for (let i = 0; i < 5; i++) {
    c.beginPath(); c.ellipse(0, 0, (150 - i * 18) * k, (38 - i * 4) * k, 0, 0, TAU)
    c.strokeStyle = anelli[i]; c.lineWidth = (9 - i) * k; c.stroke()
  }
  c.restore()
  c.save(); c.globalAlpha = 0.85
  c.beginPath(); c.arc(x, y, 46 * k, 0, TAU); c.fillStyle = '#000'; c.fill()
  c.strokeStyle = '#ffb34733'; c.lineWidth = 11 * k; c.stroke()   // l'alone, senza shadowBlur (caro sui telefoni)
  c.strokeStyle = '#ffd9a0'; c.lineWidth = Math.max(1.5, 3 * k); c.stroke()
  c.translate(x, y); c.rotate(-0.18); c.beginPath(); c.ellipse(0, 0, 150 * k, 38 * k, 0, 0, Math.PI)
  c.strokeStyle = '#ffd9a066'; c.lineWidth = 5 * k; c.stroke()
  c.restore()
}

export function disegnaSfondoVivo(ctx, cielo, W, H, t) {
  const k = Math.min(W, H * 0.5) / 360
  if (cielo === 'sole') sole(ctx, W, H, t, k)
  else if (cielo === 'nero') bucoNero(ctx, W, H, t, k)
}

// ---- i sassi ----
function rng(seme) {   // mulberry32
  let a = seme >>> 0
  return () => {
    a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function forma(r) { return Array.from({ length: 9 }, () => 0.76 + r() * 0.34) }

function poligono(c, f, R, n = f.length) {
  c.beginPath()
  for (let i = 0; i < n; i++) {
    const ang = i / n * TAU, m = f[i % f.length]
    i ? c.lineTo(Math.cos(ang) * R * m, Math.sin(ang) * R * m) : c.moveTo(Math.cos(ang) * R * m, Math.sin(ang) * R * m)
  }
  c.closePath()
}

function alone(c, R, col, y = 0, k = 1.6) {
  const g = c.createRadialGradient(0, y, R * 0.3, 0, y, R * k)
  g.addColorStop(0, col + '55'); g.addColorStop(1, col + '00')
  c.fillStyle = g; c.beginPath(); c.arc(0, y, R * k, 0, TAU); c.fill()
}

// il numero sta sopra a tutto, dritto, bianco col bordo scuro: lo stesso di disegnaAsteroide
function numero(c, a, S, px, dy = 0) {
  c.save()
  c.fillStyle = '#fff'
  c.font = `900 ${px}px "Emoji Gioco", system-ui, sans-serif`
  c.textAlign = 'center'; c.textBaseline = 'middle'
  c.lineJoin = 'round'; c.lineWidth = 5 * S; c.strokeStyle = '#000000aa'
  c.strokeText(a.v, a.x, a.y + dy); c.fillText(a.v, a.x, a.y + dy)
  c.restore()
}

function ghiaccio(c, a, S, t, r) {
  const R = a.r, f = forma(r)
  c.save(); c.translate(a.x, a.y)
  const tinta = a.gelo > 0 ? '#9fd8ff' : '#7fe3ff'
  const g = c.createLinearGradient(0, -R * 3.4, 0, 0)   // la coda, sopra: la cometa scende
  g.addColorStop(0, '#9fe8ff00'); g.addColorStop(1, '#d8f8ff99')
  c.fillStyle = g; c.beginPath(); c.moveTo(-R * 0.75, -R * 0.1)
  c.quadraticCurveTo(-R * 0.25, -R * 2, 0, -R * 3.4)
  c.quadraticCurveTo(R * 0.25, -R * 2, R * 0.75, -R * 0.1); c.fill()
  alone(c, R, tinta, 0, 1.5)
  c.save(); c.rotate(a.rot); poligono(c, f, R, 7)
  const q = c.createLinearGradient(-R, -R, R, R)
  q.addColorStop(0, '#f6feff'); q.addColorStop(0.45, '#9fdcf5'); q.addColorStop(1, '#2f7fb4')
  c.fillStyle = q; c.fill(); c.lineWidth = 2.5 * S; c.strokeStyle = '#0f3a5c'; c.stroke()
  c.save(); c.clip()
  c.strokeStyle = '#ffffff66'; c.lineWidth = Math.max(1, 1.5 * S)
  for (let i = 0; i < 7; i++) {   // le facce del ghiaccio
    const ang = i / 7 * TAU, m = f[i]
    c.beginPath(); c.moveTo(-R * 0.15, -R * 0.2); c.lineTo(Math.cos(ang) * R * m, Math.sin(ang) * R * m); c.stroke()
  }
  c.restore(); c.restore()
  const s = R * 0.28 * (0.55 + 0.45 * Math.sin(t * 3 + a.ph))   // il luccichio
  c.translate(R * 0.38, -R * 0.42); c.fillStyle = '#fff'
  c.beginPath(); c.moveTo(0, -s); c.lineTo(s * 0.2, -s * 0.2); c.lineTo(s, 0); c.lineTo(s * 0.2, s * 0.2)
  c.lineTo(0, s); c.lineTo(-s * 0.2, s * 0.2); c.lineTo(-s, 0); c.lineTo(-s * 0.2, -s * 0.2); c.fill()
  c.restore(); numero(c, a, S, R * 0.85)
}

function rivetto(c, x, y, R) {
  const r = Math.max(1.5, R * 0.07)
  c.fillStyle = '#2b313c'; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill()
  c.fillStyle = '#ffffff88'; c.beginPath(); c.arc(x - r * 0.3, y - r * 0.3, r * 0.4, 0, TAU); c.fill()
}

function rottame(c, a, S, t, r) {
  const R = a.r, k = (a.seme >>> 0) % 3
  c.save(); c.translate(a.x, a.y)
  alone(c, R, a.gelo > 0 ? '#9fd8ff' : '#ff9d1c', R * 0.5, 1.2); c.rotate(a.rot * 0.4)
  c.lineWidth = 2.5 * S; c.strokeStyle = '#1b1f27'; c.lineJoin = 'round'
  if (k === 0) {   // una lastra con le strisce del pericolo
    const P = [[-1, -0.6], [0.7, -0.78], [1.02, -0.2], [0.86, 0.72], [-0.6, 0.82], [-0.96, 0.2]]
    c.beginPath(); P.forEach(([x, y], i) => i ? c.lineTo(x * R, y * R) : c.moveTo(x * R, y * R)); c.closePath()
    const g = c.createLinearGradient(-R, -R, R, R)
    g.addColorStop(0, '#e2e6ec'); g.addColorStop(0.5, '#8a93a3'); g.addColorStop(1, '#3d4452')
    c.fillStyle = g; c.fill(); c.stroke()
    c.save(); c.clip()
    const p = R * 0.39   // il passo delle strisce: legato al raggio, non a 14 px
    for (let i = -6; i < 8; i++) {
      c.fillStyle = i % 2 ? '#f2c230' : '#1b1f27'
      c.beginPath(); c.moveTo(i * p, R * 0.45); c.lineTo(i * p + p, R * 0.45)
      c.lineTo(i * p + p * 0.29, R); c.lineTo(i * p - p * 0.71, R); c.fill()
    }
    c.restore()
    rivetto(c, -R * 0.72, -R * 0.4, R); rivetto(c, R * 0.55, -R * 0.55, R)
    rivetto(c, R * 0.7, R * 0.25, R); rivetto(c, -R * 0.7, R * 0.1, R)
  } else if (k === 1) {   // un pezzo di pannello solare, rotto in un angolo
    c.beginPath(); c.moveTo(-R, -R * 0.62); c.lineTo(R * 0.95, -R * 0.62); c.lineTo(R * 0.95, R * 0.1)
    c.lineTo(R * 0.55, R * 0.3); c.lineTo(R * 0.7, R * 0.62); c.lineTo(-R, R * 0.62); c.closePath()
    c.fillStyle = '#9aa3b2'; c.fill(); c.stroke()
    c.save(); c.clip(); c.fillStyle = '#1f4fa8'; c.fillRect(-R * 0.9, -R * 0.52, R * 1.75, R * 1.04)
    c.strokeStyle = '#9fc3ff66'; c.lineWidth = 1.2
    for (let x = -R * 0.9; x < R; x += R * 0.35) { c.beginPath(); c.moveTo(x, -R); c.lineTo(x, R); c.stroke() }
    for (let y = -R * 0.52; y < R; y += R * 0.35) { c.beginPath(); c.moveTo(-R, y); c.lineTo(R, y); c.stroke() }
    c.restore()
    c.strokeStyle = '#e0702f'; c.lineWidth = 2   // il filo che penzola
    c.beginPath(); c.moveTo(R * 0.9, R * 0.1); c.quadraticCurveTo(R * 1.2, R * 0.3, R * 1.1, R * 0.6); c.stroke()
  } else {   // un serbatoio ammaccato
    c.beginPath(); c.moveTo(-R * 0.1, -R * 0.9); c.lineTo(R * 0.1, -R * 0.9)   // il tracciato tondo, a mano
    c.arcTo(R * 0.55, -R * 0.9, R * 0.55, -R * 0.45, R * 0.45); c.arcTo(R * 0.55, R * 0.9, R * 0.1, R * 0.9, R * 0.45)
    c.arcTo(-R * 0.55, R * 0.9, -R * 0.55, R * 0.45, R * 0.45); c.arcTo(-R * 0.55, -R * 0.9, -R * 0.1, -R * 0.9, R * 0.45)
    c.closePath()
    const g = c.createLinearGradient(-R * 0.55, 0, R * 0.55, 0)
    g.addColorStop(0, '#7a3a14'); g.addColorStop(0.35, '#f08a3c'); g.addColorStop(1, '#5a2a0c')
    c.fillStyle = g; c.fill(); c.stroke()
    c.fillStyle = '#1b1f2799'; c.fillRect(-R * 0.55, -R * 0.45, R * 1.1, R * 0.12); c.fillRect(-R * 0.55, R * 0.35, R * 1.1, R * 0.12)
    c.fillStyle = '#00000055'; c.beginPath(); c.ellipse(R * 0.15, R * 0.05, R * 0.2, R * 0.28, 0.4, 0, TAU); c.fill()
  }
  c.restore()
  if (Math.sin(t * 5 + a.ph) > 0.6) {   // una scintilla
    c.fillStyle = '#ffd94a'; c.beginPath(); c.arc(a.x + R * 0.8, a.y - R * 0.5, Math.max(1.5, R * 0.07), 0, TAU); c.fill()
  }
  numero(c, a, S, R * 0.85)
}

function cristalli(c, a, S, t, r) {
  const R = a.r
  const prismi = Array.from({ length: 4 }, (_, j) => ({ a: j * 1.57 + r() * 0.8, l: 0.9 + r() * 0.45, w: 0.32 + r() * 0.12 }))
  c.save(); c.translate(a.x, a.y)
  alone(c, R, a.gelo > 0 ? '#9fd8ff' : '#d07bff', 0, 1.7 + Math.sin(t * 2 + a.ph) * 0.1)
  c.rotate(a.rot)
  c.lineWidth = 2.2 * S; c.strokeStyle = '#2a0848'; c.lineJoin = 'round'
  for (const p of prismi) {
    c.save(); c.rotate(p.a)
    const L = R * p.l, w = R * p.w
    c.beginPath(); c.moveTo(0, -w); c.lineTo(L * 0.72, -w); c.lineTo(L, 0); c.lineTo(L * 0.72, w); c.lineTo(0, w); c.closePath()
    const g = c.createLinearGradient(0, -w, 0, w)
    g.addColorStop(0, '#ffe0ff'); g.addColorStop(0.5, '#c04dff'); g.addColorStop(1, '#4a1580')
    c.fillStyle = g; c.fill(); c.stroke()
    c.strokeStyle = '#ffffff77'; c.lineWidth = 1.4 * S
    c.beginPath(); c.moveTo(R * 0.2, -w * 0.3); c.lineTo(L * 0.85, -w * 0.1); c.stroke()
    c.strokeStyle = '#2a0848'; c.lineWidth = 2.2 * S
    c.restore()
  }
  c.beginPath(); c.arc(0, 0, R * 0.62, 0, TAU)
  const g = c.createRadialGradient(-R * 0.2, -R * 0.2, 0, 0, 0, R * 0.62)
  g.addColorStop(0, '#f2c8ff'); g.addColorStop(1, '#6a1fa8')
  c.fillStyle = g; c.fill(); c.stroke()
  c.restore(); numero(c, a, S, R * 0.85)
}

// un disco volante: largo, ma resta entro ~1,25 R di semilarghezza
function dischi(c, a, S, t) {
  const R = a.r, ond = Math.sin(t * 2 + a.ph) * R * 0.08
  c.save(); c.translate(a.x, a.y + ond)
  const b = c.createLinearGradient(0, R * 0.2, 0, R * 1.9)   // il raggio traente
  b.addColorStop(0, a.gelo > 0 ? '#9fd8ff33' : '#9dff9d33'); b.addColorStop(1, a.gelo > 0 ? '#9fd8ff00' : '#9dff9d00')
  c.fillStyle = b; c.beginPath(); c.moveTo(-R * 0.45, R * 0.35); c.lineTo(R * 0.45, R * 0.35)
  c.lineTo(R * 0.9, R * 1.9); c.lineTo(-R * 0.9, R * 1.9); c.fill()
  c.beginPath(); c.arc(0, -R * 0.12, R * 0.52, Math.PI, 0); c.closePath()   // la cupola, con l'alieno dentro
  c.fillStyle = '#c8ffe055'; c.fill()
  c.fillStyle = '#6ee26e'; c.beginPath(); c.ellipse(0, -R * 0.3, R * 0.24, R * 0.21, 0, 0, TAU); c.fill()
  c.strokeStyle = '#6ee26e'; c.lineWidth = Math.max(1, 2 * S); c.lineCap = 'round'
  c.beginPath(); c.moveTo(-R * 0.1, -R * 0.48); c.lineTo(-R * 0.18, -R * 0.62)
  c.moveTo(R * 0.1, -R * 0.48); c.lineTo(R * 0.18, -R * 0.62); c.stroke()
  const pt = Math.max(1.8, R * 0.08)
  c.fillStyle = '#6ee26e'; c.beginPath(); c.arc(-R * 0.18, -R * 0.62, pt, 0, TAU)
  c.moveTo(R * 0.18 + pt, -R * 0.62); c.arc(R * 0.18, -R * 0.62, pt, 0, TAU); c.fill()
  c.fillStyle = '#111'; c.beginPath(); c.ellipse(-R * 0.09, -R * 0.3, R * 0.065, R * 0.09, 0, 0, TAU)
  c.moveTo(R * 0.155, -R * 0.3); c.ellipse(R * 0.09, -R * 0.3, R * 0.065, R * 0.09, 0, 0, TAU); c.fill()
  c.fillStyle = '#fff'; c.beginPath(); c.arc(-R * 0.07, -R * 0.34, R * 0.035, 0, TAU)
  c.moveTo(R * 0.11 + R * 0.035, -R * 0.34); c.arc(R * 0.11, -R * 0.34, R * 0.035, 0, TAU); c.fill()
  c.beginPath(); c.arc(0, -R * 0.12, R * 0.52, Math.PI, 0)
  c.strokeStyle = '#e8fff0aa'; c.lineWidth = Math.max(1, 2 * S); c.stroke()
  c.beginPath(); c.ellipse(0, R * 0.1, R * 1.18, R * 0.42, 0, 0, TAU)   // il disco
  const g = c.createLinearGradient(0, -R * 0.3, 0, R * 0.5)
  g.addColorStop(0, '#e2e8f2'); g.addColorStop(0.5, '#8a96b0'); g.addColorStop(1, '#3d4660')
  c.fillStyle = g; c.fill(); c.lineWidth = 2.5 * S; c.strokeStyle = '#1b2030'; c.stroke()
  for (let i = 0; i < 7; i++) {   // le luci, a catena
    const ang = Math.PI * (0.1 + i * 0.8 / 6), x = -Math.cos(ang) * R, y = R * 0.1 + Math.sin(ang) * R * 0.3
    c.fillStyle = Math.sin(t * 6 - i) > 0 ? ['#ffd94a', '#7fe3ff', '#ff6bd0'][i % 3] : '#3a4058'
    c.beginPath(); c.arc(x, y, Math.max(1.8, R * 0.08), 0, TAU); c.fill()
  }
  c.restore()
  numero(c, a, S, R * 0.62, R * 0.08 + ond)
}

function lava(c, a, S, t, r) {
  const R = a.r, f = forma(r)
  const crepe = Array.from({ length: 4 }, () => { const x = r() * TAU; return [x, x + (r() - 0.5) * 1.2, 0.3 + r() * 0.5] })
  c.save(); c.translate(a.x, a.y)
  alone(c, R, a.gelo > 0 ? '#9fd8ff' : '#ff6a00', R * 0.45, 1.4)
  c.rotate(a.rot); poligono(c, f, R)
  const g = c.createRadialGradient(-R * 0.3, -R * 0.3, 0, 0, 0, R)
  g.addColorStop(0, '#6a3a26'); g.addColorStop(1, '#1c0d08')
  c.fillStyle = g; c.fill(); c.lineWidth = 2.5 * S; c.strokeStyle = '#120604'; c.stroke()
  c.save(); c.clip()
  const viva = 0.7 + 0.3 * Math.sin(t * 3 + a.ph)
  c.lineCap = 'round'; c.lineJoin = 'round'
  for (const [pass, col, lw] of [[0, `rgba(255,106,0,${0.35 * viva})`, 6], [1, `rgba(255,170,60,${viva})`, 2.6]]) {   // alone largo, poi la vena (niente shadowBlur)
    c.strokeStyle = col; c.lineWidth = lw * S
    for (const [a0, a1, l] of crepe) {
      c.beginPath(); c.moveTo(Math.cos(a0) * R * 0.1, Math.sin(a0) * R * 0.1)
      c.lineTo(Math.cos(a0) * R * l * 0.7, Math.sin(a0) * R * l * 0.7)
      c.lineTo(Math.cos(a1) * R * 1.1, Math.sin(a1) * R * 1.1); c.stroke()
    }
  }
  c.restore(); c.restore(); numero(c, a, S, R * 0.85)
}

function nero(c, a, S, t, r) {
  const R = a.r, f = forma(r)
  c.save(); c.translate(a.x, a.y); alone(c, R, a.gelo > 0 ? '#9fd8ff' : '#a06bff', 0, 1.45)
  c.rotate(a.rot); poligono(c, f, R)
  const g = c.createRadialGradient(-R * 0.3, -R * 0.3, 0, 0, 0, R)
  g.addColorStop(0, '#4a3d66'); g.addColorStop(1, '#100a1c')
  c.fillStyle = g; c.fill()
  c.lineJoin = 'round'
  c.strokeStyle = '#c08cff44'; c.lineWidth = 8 * S; c.stroke()   // il bagliore, senza shadowBlur
  c.strokeStyle = '#c08cff'; c.lineWidth = 3 * S; c.stroke()
  c.restore(); numero(c, a, S, R * 0.85)
}

// la mina a punte che lancia la nave madre
function bomba(c, a, S, t) {
  const R = a.r
  c.save(); c.translate(a.x, a.y); alone(c, R, '#ff6b6b', 0, 1.5); c.rotate(a.rot)
  c.fillStyle = '#3a2a4a'
  for (let i = 0; i < 8; i++) {
    c.save(); c.rotate(i * TAU / 8)
    c.beginPath(); c.moveTo(-R * 0.16, -R * 0.8); c.lineTo(0, -R * 1.12); c.lineTo(R * 0.16, -R * 0.8); c.fill(); c.restore()
  }
  c.beginPath(); c.arc(0, 0, R * 0.86, 0, TAU)
  const g = c.createRadialGradient(-R * 0.3, -R * 0.3, 0, 0, 0, R * 0.86)
  g.addColorStop(0, '#8a6aa8'); g.addColorStop(1, '#2a1a3a')
  c.fillStyle = g; c.fill(); c.lineWidth = 2.5 * S; c.strokeStyle = '#120a1c'; c.stroke()
  c.restore()
  c.fillStyle = Math.sin(t * 7 + a.ph) > 0 ? '#ff4a4a' : '#5a1a1a'   // la spia, ferma sopra: non gira
  c.beginPath(); c.arc(a.x, a.y - R * 0.62, Math.max(2, R * 0.11), 0, TAU); c.fill()
  numero(c, a, S, R * 0.8)
}

const SPECIE = { ghiaccio, rottami: rottame, cristalli, dischi, lava, nero, bomba }

export function disegnaSasso(ctx, a, S, t) {
  const f = SPECIE[a.specie]
  if (!f) return
  ctx.save()
  f(ctx, a, S, t, rng(a.seme || 1))
  ctx.restore()
}
