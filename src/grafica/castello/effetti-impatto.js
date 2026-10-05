// Quello che un colpo lascia dove cade, per ogni tiro. Lo tiene il motore
// (`Schizzo`) perché deve morire con la partita; qui si sa solo disegnarlo
// a una certa età. Ogni effetto ha due strati: `suolo` (sotto i mostri:
// pozze, bruciature, fiamme a terra) e `aria` (sopra: lampi, scintille,
// schegge). `a` è in coordinate locali con l'origine sull'impatto: `eta`
// secondi dalla caduta, `D` da dove è partito, `an` l'angolo, `R` quanto è
// grande, `col` la tinta del ramo.
import { TAU, clamp, ease, rnd, rgba, glow, disc, ring, add, sparks, onda, flamma, fumo,
         cristallo, fiocco, fulmineLinea, freccia } from './effetti-base.js'

const fondo = (a, da, dura) => clamp(1 - (a - da) / dura)

/* ── l'arciere e i suoi rami ── */
function arciere(g, a) {
  const { eta, an, col } = a
  // la freccia resta piantata, vibra e svanisce
  if (eta < 0.3) {
    g.save(); g.globalAlpha = 1 - clamp((eta - 0.12) / 0.18)
    freccia(g, -Math.cos(an) * 6, -Math.sin(an) * 6, an + Math.sin(eta * 60) * 0.18 * Math.exp(-eta * 9), { col })
    g.restore()
  }
  sparks(g, 0, 0, eta, { n: 7, v: 70, life: 0.28, col: '#ffe9a8', seed: 3, line: 0.05, w: 1.6, dir: an + Math.PI, spread: 2 })
  onda(g, 0, 0, eta, 0.2, 11, '#ffffff', 2, 1)
  sparks(g, 0, 6, eta, { n: 4, v: 20, life: 0.5, col: '#cdbb96', seed: 9, r: 3, shrink: 1, grav: -8, spread: 2, dir: -Math.PI / 2 })
}

function cecchino(g, a) {
  const { eta, an, col, D } = a
  // la riga di luce resta in aria dopo il passaggio
  const lin = fondo(eta, 0, 0.4)
  if (lin > 0) {
    g.save(); g.lineCap = 'round'
    const q = g.createLinearGradient(D.x, D.y, 0, 0)
    q.addColorStop(0, rgba('#c8ffd8', 0)); q.addColorStop(1, rgba('#c8ffd8', 0.8 * lin))
    g.strokeStyle = q; g.lineWidth = 1.8 * lin + 0.4; g.beginPath(); g.moveTo(D.x, D.y); g.lineTo(0, 0); g.stroke()
    g.restore()
  }
  // colpo critico: stella a otto punte
  if (eta < 0.3) {
    const k = eta / 0.3
    g.save(); g.rotate(0.4)
    for (let i = 0; i < 8; i++) {
      g.rotate(TAU / 8)
      const l = (i % 2 ? 6 : 13) * ease(k * 1.3)
      g.strokeStyle = rgba('#fff3a8', 1 - k); g.lineWidth = 2 * (1 - k) + 0.4
      g.beginPath(); g.moveTo(5, 0); g.lineTo(5 + l, 0); g.stroke()
    }
    g.restore()
    onda(g, 0, 0, eta, 0.25, 12, '#ffd76a', 2, 1)
  }
  if (eta < 0.3) {
    g.save(); g.globalAlpha = 1 - clamp((eta - 0.1) / 0.2)
    freccia(g, -Math.cos(an) * 8, -Math.sin(an) * 8, an, { col, len: 1.5, pen: '#1f7a4a' }); g.restore()
  }
  sparks(g, 0, 0, eta, { n: 6, v: 60, life: 0.25, col: '#e8ffd2', seed: 14, line: 0.05, w: 1.4, dir: an + Math.PI, spread: 2 })
}

function raffica(g, a) {
  const { eta, an, col } = a
  if (eta < 0.25) {
    g.save(); g.globalAlpha = 1 - clamp((eta - 0.08) / 0.17)
    freccia(g, -Math.cos(an) * 6, -Math.sin(an) * 6, an + Math.sin(eta * 60) * 0.15 * Math.exp(-eta * 9), { col, len: 0.9 })
    g.restore()
  }
  sparks(g, 0, 0, eta, { n: 6, v: 60, life: 0.25, col: '#f2ffd2', seed: 20, line: 0.05, w: 1.4, dir: an + Math.PI, spread: 2 })
  onda(g, 0, 0, eta, 0.18, 10, '#e9ffd2', 2, 1)
}

/* ── la magica e i suoi rami ── */
function runa(g, r, rot, col, al) {
  g.save(); g.rotate(rot); g.lineCap = 'round'
  ring(g, 0, 0, r, col, 1.6, al); ring(g, 0, 0, r * 0.72, col, 1, al * 0.7)
  for (let i = 0; i < 6; i++) {
    g.rotate(TAU / 6)
    g.strokeStyle = rgba(col, al); g.lineWidth = 1.5
    g.beginPath(); g.moveTo(r * 0.72, 0); g.lineTo(r, 0); g.stroke()
    disc(g, r, 0, 1.8, '#ffffff', al * 0.8)
  }
  g.strokeStyle = rgba(col, al * 0.8); g.lineWidth = 1.1; g.beginPath()
  for (let i = 0; i < 3; i++) { const q = i * TAU / 3 + 0.3; g.lineTo(Math.cos(q) * r * 0.72, Math.sin(q) * r * 0.72) }
  g.closePath(); g.stroke(); g.restore()
}

function magica(g, a) {
  const { eta, R, col } = a
  const k = eta / 0.9, al = 1 - clamp((k - 0.45) / 0.55)
  add(g, () => glow(g, 0, 0, R * 0.6 * ease(k * 3), col, 0.3 * (1 - k)))
  disc(g, 0, 0, R * ease(k * 3), col, 0.05 * al)
  runa(g, R * ease(k * 2.5), eta * 2.2, col, 0.6 * al)
  add(g, () => disc(g, 0, 0, 10 * (1 - clamp(k * 4)), '#ffffff', 0.9 * (1 - clamp(k * 4))))
  sparks(g, 0, 0, eta, { n: 8, v: 60, life: 0.6, col: '#e7d5ff', seed: 41, r: 1.8, shrink: 1 })
  for (let i = 0; i < 6; i++) {
    const kk = (k * 1.5 + i / 6) % 1, ang = i * 1.05
    disc(g, Math.cos(ang) * R * 0.5, Math.sin(ang) * R * 0.3 - kk * 16, 1.6 * (1 - kk), '#ffffff', 0.7 * al * (1 - kk))
  }
}

const VERDE = '#7dff4a'
// la pozza resta sotto i mostri, bolle e schizzi sopra
function velenoSuolo(g, a) {
  const { eta, R } = a
  const al = clamp(eta / 0.12) * (1 - clamp((eta - 1.5) / 0.4)), r = R * ease(eta * 4)
  g.save(); g.translate(0, 6); g.scale(1, 0.55)
  disc(g, 0, 0, r, '#3a8f1d', 0.32 * al); disc(g, 0, 0, r * 0.7, VERDE, 0.14 * al)
  ring(g, 0, 0, r, '#b5ff7a', 1.2, 0.5 * al); g.restore()
}
function velenoAria(g, a) {
  const { eta, R } = a
  const al = clamp(eta / 0.12) * (1 - clamp((eta - 1.5) / 0.4))
  for (let i = 0; i < 7; i++) {
    const k = (eta * 0.9 + i / 7) % 1
    ring(g, (rnd(60 + i) - 0.5) * R * 1.2, 6 + (rnd(70 + i) - 0.5) * 12 - k * 16, 1.3 + 2.2 * k, '#c9ff9a', 1, al * (1 - k))
  }
  sparks(g, 0, 0, eta, { n: 10, v: 70, life: 0.5, col: VERDE, seed: 55, r: 2.2, shrink: 1, grav: 90, dir: -Math.PI / 2, spread: 2.6 })
}

function catena(g, a) {
  const { eta, col, D } = a
  const dur = 0.9
  if (eta > dur) return
  // il fulmine sfarfalla: a tratti si spegne un istante, poi si riaccende più debole
  const al = (1 - eta / dur) * (0.55 + 0.45 * rnd(Math.floor(a.t * 24) + 5)), w = 3.4 * al + 0.8, f = Math.floor(a.t * 24)
  const P = { x: D.x, y: D.y - 4 }
  // dal punto d'impatto verso ognuno che l'area ha colpito, più sottile
  a.P.forEach((q, i) => {
    add(g, () => fulmineLinea(g, { x: 0, y: 0 }, q, f * 7 + i * 31, w * 2, rgba(col, 0.5 * al), 5))
    fulmineLinea(g, { x: 0, y: 0 }, q, f * 7 + i * 31, w * 0.6, rgba('#ffffff', al), 5)
  })
  add(g, () => {
    fulmineLinea(g, P, { x: 0, y: 0 }, f * 13, w * 5, rgba(col, 0.4 * al), 7)
    fulmineLinea(g, P, { x: 0, y: 0 }, f * 13, w * 2.4, rgba('#e7d5ff', 0.85 * al), 7)
    glow(g, 0, 0, 24 * al, col, 0.9 * al)
  })
  fulmineLinea(g, P, { x: 0, y: 0 }, f * 13, w, rgba('#ffffff', al), 7)
  for (let r = 0; r < 3; r++) {   // i rametti
    const k = 0.25 + r * 0.25, bx = D.x * (1 - k), by = P.y * (1 - k), an = rnd(f * 7 + r) * TAU
    g.strokeStyle = rgba('#f2e6ff', 0.8 * al); g.lineWidth = 1.4
    g.beginPath(); g.moveTo(bx, by); g.lineTo(bx + Math.cos(an) * 12, by + Math.sin(an) * 12); g.stroke()
  }
  sparks(g, 0, 0, eta, { n: 10, v: 70, life: 0.4, col: '#f2e6ff', seed: 80, line: 0.06, w: 1.3 })
}

/* ── le bombe e i loro rami ── */
// la bruciatura che resta a terra
function bruciatura(g, a, dura) {
  const { eta, R } = a
  g.save(); g.translate(0, 4); g.scale(1, 0.5)
  disc(g, 0, 0, R * 0.45, '#1c1814', 0.55 * clamp(eta / 0.3) * clamp(1 - (eta - dura * 0.55) / (dura * 0.45)))
  g.restore()
}

function esplosione(g, a, { fuoco = '#ff7a3d', fumoSc = 1, schegge = 8, seme = 1 }) {
  const { eta, R } = a
  if (eta > 1.1) return
  add(g, () => {
    if (eta < 0.08) glow(g, 0, -R * 0.2, R * 1.4, '#ffffff', 1 - eta / 0.08)
    glow(g, 0, -R * 0.2, R * 1.8 * clamp(1 - eta / 0.35), fuoco, 0.6)
  })
  if (eta < 0.5) {
    // la palla di fuoco è un grumo: sei bolle che si gonfiano e salgono, non cerchi concentrici
    const e = ease(eta / 0.2) * 0.62, f = 1 - clamp((eta - 0.15) / 0.35), su = R * 0.25 * ease(eta / 0.5)
    for (const [col, k, al] of [['#c43a10', 1, 0.8], [fuoco, 0.75, 0.9], ['#ffd76a', 0.45, 0.95]])
      for (let i = 0; i < 6; i++) {
        const an = rnd(seme + i) * TAU, d = R * 0.45 * e * (0.4 + rnd(seme + i + 3) * 0.7)
        disc(g, Math.cos(an) * d, Math.sin(an) * d * 0.7 - su * k, R * (0.34 + 0.2 * rnd(seme + i + 9)) * e * k, col, al * f)
      }
    disc(g, 0, -su, R * 0.18 * e, '#fff8d6', f)
  }
  onda(g, 0, 4, eta, 0.4, R, '#ffe3b0', 1.6, 0.5)
  fumo(g, 0, 0, eta - 0.06, 7, fumoSc, seme * 5)
  sparks(g, 0, 0, eta, { n: schegge, v: R * 3, life: 0.7, col: '#ffd76a', seed: seme * 11, line: 0.05, w: 1.6, grav: 120, dir: -Math.PI / 2, spread: 3 })
  sparks(g, 0, 0, eta, { n: 6, v: R * 1.9, life: 0.8, col: '#3a2e24', seed: seme * 13, r: 2.4, grav: 150, dir: -Math.PI / 2, spread: 2.6, r0: R * 0.45 })
}

function mortaioAria(g, a) {
  esplosione(g, a, { fuoco: '#d1521c', fumoSc: 1.3, schegge: 11, seme: 4 })
  onda(g, 0, 4, a.eta - 0.05, 0.7, a.R, '#cdbb96', 3, 0.4)   // l'onda di polvere
}

function napalmSuolo(g, a) {
  const { eta, R } = a
  const al = fondo(eta, 1.5, 0.5)
  if (eta > 2.1) return
  g.save(); g.translate(0, 5); g.scale(1, 0.55)
  disc(g, 0, 0, R * ease(eta * 4), '#2a1408', 0.4 * al)
  disc(g, 0, 0, R * 0.9 * ease(eta * 4), '#ff5a1a', 0.2 * al)
  g.restore()
}
function napalmAria(g, a) {
  const { eta, R } = a
  add(g, () => { if (eta < 0.3) glow(g, 0, 0, R * 0.9 * ease(eta / 0.2) * (1 - eta / 0.3), '#ff8a3a', 0.7) })
  onda(g, 0, 4, eta, 0.35, R, '#ffab3d', 1.6, 0.55)
  const al = fondo(eta, 1.5, 0.5)
  if (eta < 2.1) {
    // il tappeto di fiamme che resta, ognuna a modo suo
    for (let i = 0; i < 9; i++) {
      const an = i / 9 * TAU + 0.5, rr = (0.2 + rnd(i) * 0.7) * R * ease(eta * 4)
      const fl = 0.75 + 0.25 * Math.sin(a.t * 14 + i * 2)
      flamma(g, Math.cos(an) * rr, 5 + Math.sin(an) * rr * 0.5, (3.4 + rnd(i + 4) * 2.4) * fl * ease(eta * 5), al * 0.9)
    }
    for (let i = 0; i < 8; i++) {
      const k = (a.t * 0.9 + rnd(i)) % 1
      disc(g, (rnd(i + 20) - 0.5) * R * 1.4, -k * 28, 1.2, '#ffd76a', al * (1 - k))
    }
  }
  sparks(g, 0, 0, eta, { n: 14, v: 90, life: 0.6, col: '#ffb43a', seed: 99, r: 2.4, shrink: 1, grav: 110, dir: -Math.PI / 2, spread: 2.8 })
}

/* ── il gelo: una folata che parte dalla torre ── */
// il cerchio sottile alla misura vera della gittata; il resto dell'effetto sta vicino alla torre
function confine(g, a, col) {
  const k = ease(a.eta / 0.5), fade = 1 - clamp((a.eta - 0.3) / 0.6)
  ring(g, 0, 0, a.Rv * k, col, 1.1, 0.3 * fade)
}

function ghiaccio(g, a) {
  const { eta, R } = a
  confine(g, a, '#dff2ff')
  const k = ease(eta / 0.3), fade = 1 - clamp((eta - 0.25) / 0.55)
  const q = g.createRadialGradient(0, 0, R * k * 0.4, 0, 0, R * k)
  q.addColorStop(0, rgba('#bfe6ff', 0)); q.addColorStop(1, rgba('#e6f6ff', 0.16 * fade))
  g.fillStyle = q; g.beginPath(); g.arc(0, 0, R * k, 0, TAU); g.fill()
  ring(g, 0, 0, R * k, '#ffffff', 1.4, 0.75 * fade)
  for (let i = 0; i < 12; i++) {   // poche schegge lungo il bordo
    const an = i / 9 * TAU + rnd(i) * 0.3, grow = clamp((eta - 0.03 * (i % 3)) / 0.15)
    cristallo(g, Math.cos(an) * R * k, Math.sin(an) * R * k, 2.6 + 2.2 * rnd(i + 30), an + Math.PI / 2, '#9bd3ff', grow * fade * 0.9)
  }
  for (let i = 0; i < 3; i++) {
    const an = i * 2.1 + eta * 0.8
    fiocco(g, Math.cos(an) * R * k * 0.6, Math.sin(an) * R * k * 0.6, 3, eta * 3 + i, 0.75 * fade)
  }
}

// La bufera è aria: neve che gira a spirale su una zona larga, tutta bianca, senza cristalli.
function bufera(g, a) {
  const { eta, R } = a
  confine(g, a, '#cfe9ff')
  const k = ease(eta / 0.35), fade = clamp(1 - (eta - 0.7) / 0.5)
  disc(g, 0, 0, R * k, '#eef8ff', 0.05 * fade)
  // strisce di vento: archi corti che girano più forte vicino al centro
  for (let i = 0; i < 34; i++) {
    const rad = R * k * (0.15 + 0.85 * ((i / 34 + eta * 0.5) % 1)), an = i * 2.4 + eta * 6 * (1.3 - rad / R)
    g.strokeStyle = rgba('#ffffff', (0.85 - 0.6 * rad / R) * fade); g.lineWidth = 1.2; g.lineCap = 'round'
    g.beginPath(); g.arc(0, 0, rad, an, an + 0.45); g.stroke()
  }
  for (let i = 0; i < 18; i++) {   // e fiocchi di neve portati dal vento
    const rad = R * k * (0.2 + 0.8 * rnd(i + 50)), an = rnd(i) * TAU + eta * 3.2 * (1.2 - rad / R)
    disc(g, Math.cos(an) * rad, Math.sin(an) * rad, 0.9 + 1.2 * rnd(i + 9), '#ffffff', 0.9 * fade)
  }
  for (let i = 0; i < 3; i++) {
    const an = eta * 2.4 + i * 2.1
    fiocco(g, Math.cos(an) * R * k * 0.6, Math.sin(an) * R * k * 0.6, 5, eta * 4 + i, 0.85 * fade)
  }
}

// La brina è terra: una chiazza di gelo con le crepe sotto i mostri, e cristalli blu scuro che
// crescono e scintillano, su una zona stretta. Si ferma e resta, non gira.
function brinaSuolo(g, a) {
  const { eta, R } = a
  const k = ease(eta / 0.25), fade = 1 - clamp((eta - 0.9) / 0.6)
  g.save(); g.translate(0, 5); g.scale(1, 0.6)
  g.fillStyle = rgba('#bfe6ff', 0.38 * fade); g.beginPath()
  for (let i = 0; i < 16; i++) {   // il bordo è dentato come una lastra di brina
    const an = i / 16 * TAU, r = R * k * (i % 2 ? 0.8 : 1.08)
    g.lineTo(Math.cos(an) * r, Math.sin(an) * r)
  }
  g.closePath(); g.fill()
  g.strokeStyle = rgba('#ffffff', 0.8 * fade); g.lineWidth = 1.1; g.stroke()
  g.strokeStyle = rgba('#ffffff', 0.6 * fade); g.lineWidth = 0.9
  for (let i = 0; i < 6; i++) {    // le crepe
    const an = i * 1.05 + 0.3
    g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(an) * R * k * 0.55, Math.sin(an) * R * k * 0.55)
    g.lineTo(Math.cos(an + 0.25) * R * k * 0.95, Math.sin(an + 0.25) * R * k * 0.95); g.stroke()
  }
  g.restore()
}
function brina(g, a) {
  const { eta, R } = a
  const fade = 1 - clamp((eta - 0.9) / 0.6)
  confine(g, a, '#7ec2ff')
  for (let i = 0; i < 7; i++) {   // lame di cristallo blu scuro che salgono dal terreno
    const an = i / 7 * TAU + 0.4, rr = R * (i % 2 ? 0.55 : 0.9)
    const su = ease((eta - 0.04 * i) / 0.18) * fade
    cristallo(g, Math.cos(an) * rr, Math.sin(an) * rr * 0.6 + 5, (10 + 6 * rnd(i)) * su, 0, '#3b8ee0', su)
  }
  for (let i = 0; i < 4; i++) {   // scintille a croce sulle punte
    const an = i * 1.6 + 0.9, rr = R * (0.3 + 0.6 * rnd(i + 3)), s2 = Math.abs(Math.sin(eta * 8 + i * 2)) * fade
    const x = Math.cos(an) * rr, y = Math.sin(an) * rr * 0.6 - 8
    g.strokeStyle = rgba('#ffffff', s2); g.lineWidth = 1.1
    g.beginPath(); g.moveTo(x - 4, y); g.lineTo(x + 4, y); g.moveTo(x, y - 4); g.lineTo(x, y + 4); g.stroke()
  }
}

// chiave = ramo, o l'aspetto della torre quando non ne ha
export const IMPATTI = {
  arciere: { aria: arciere },
  cecchino: { aria: cecchino },
  raffica: { aria: raffica },
  magica: { aria: magica },
  veleno: { suolo: velenoSuolo, aria: velenoAria },
  catena: { aria: catena },
  bombe: { suolo: (g, a) => bruciatura(g, a, 1.6), aria: (g, a) => esplosione(g, a, { seme: 2 }) },
  mortaio: { suolo: (g, a) => bruciatura(g, a, 1.8), aria: mortaioAria },
  napalm: { suolo: napalmSuolo, aria: napalmAria },
  ghiaccio: { aria: ghiaccio },
  bufera: { aria: bufera },
  brina: { suolo: brinaSuolo, aria: brina },
}
