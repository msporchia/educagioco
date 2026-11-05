// Le opere disegnate in codice: il ponte, la porta e la miniera, finché non arriva il foglio dipinto (docs/arena/grafica.md).
// Ricevono già misure e colori: qui non entra niente delle regole, solo quello che il motore ha deciso.
const IO = '#3d8bff', NEM = '#ff5a4d'
const squadra = lato => (lato === 'io' ? IO : NEM)

function poli(c, col, ...p) {
  c.fillStyle = col; c.beginPath(); c.moveTo(p[0], p[1])
  for (let i = 2; i < p.length; i += 2) c.lineTo(p[i], p[i + 1])
  c.closePath(); c.fill()
}

/* una bandiera che sventola: col tempo, non coi fotogrammi */
export function stendardo(c, x, y, alto, largo, colore, ora, verso = 1) {
  c.fillStyle = '#2b2118'; c.fillRect(x - 1, y - alto, 2, alto)
  c.fillStyle = '#ffd24a'; c.beginPath(); c.arc(x, y - alto, 2, 0, 7); c.fill()
  const n = 6, sopra = [], sotto = []
  for (let i = 0; i <= n; i++) {
    const q = i / n, onda = Math.sin(ora * 4.2 + q * 5 + x * 0.05) * largo * 0.1 * q
    sopra.push([x + verso * largo * q, y - alto + 2 + onda])
    sotto.push([x + verso * largo * q, y - alto + 2 + largo * (0.62 - q * 0.2) + onda])
  }
  c.fillStyle = colore; c.beginPath(); c.moveTo(...sopra[0])
  for (const p of sopra) c.lineTo(...p)
  for (const p of sotto.reverse()) c.lineTo(...p)
  c.closePath(); c.fill()
  c.fillStyle = 'rgba(255,255,255,.18)'; c.beginPath(); c.moveTo(...sopra[0])
  for (const p of sopra) c.lineTo(p[0], p[1] + largo * 0.12)
  c.lineTo(...sopra[sopra.length - 1]); c.closePath(); c.fill()
}

/* il ponte: le assi sull'acqua fra due spalle di pietra, con le travi ai lati */
export function disegnaPonte(c, { x0, x1, y0, y1, m, colori }) {
  const { assi, trave, pietra } = colori, largo = x1 - x0, alto = y1 - y0
  c.fillStyle = 'rgba(0,0,0,.34)'; c.fillRect(x0 + m(5), y0, largo + m(3), alto + m(3))
  c.fillStyle = trave; c.fillRect(x0, y0, largo, alto)
  for (let y = y0, i = 0; y < y1 - m(2); y += m(6), i++) {
    c.fillStyle = assi[i % 2]; c.fillRect(x0 + m(3), y + m(0.6), largo - m(6), m(5))
    c.fillStyle = 'rgba(255,255,255,.12)'; c.fillRect(x0 + m(3), y + m(0.6), largo - m(6), m(1))
    c.fillStyle = 'rgba(0,0,0,.28)'
    c.fillRect(x0 + m(9 + (i % 3) * 4), y + m(2), m(1), m(1)); c.fillRect(x1 - m(10 + (i % 2) * 5), y + m(3), m(1), m(1))
  }
  // il centro è consumato dai piedi
  c.fillStyle = 'rgba(0,0,0,.10)'; c.fillRect((x0 + x1) / 2 - largo * 0.2, y0, largo * 0.4, alto)
  for (const x of [x0 - m(1), x1 - m(5)]) {
    c.fillStyle = trave; c.fillRect(x, y0, m(6), alto)
    c.fillStyle = assi[1]; c.fillRect(x + m(1), y0, m(2), alto)
    for (let i = 0; i <= 4; i++) {
      const y = y0 + alto * i / 4
      c.fillStyle = pietra[0]; c.fillRect(x - m(1.5), y - m(4), m(9), m(8))
      c.fillStyle = pietra[1]; c.fillRect(x - m(1.5), y - m(4), m(7.5), m(6.2))
      c.fillStyle = pietra[2]; c.fillRect(x - m(1.5), y - m(4), m(7.5), m(1.6))
    }
  }
}

/* la porta in fondo al ponte: due torri merlate e il portone che si rompe; crollata, resta il cumulo */
export function disegnaPorta(c, { x, y, S, lato, hp, max, ferita, pietra, ora, barra }) {
  const col = squadra(lato), mezza = 24 * S, alto = 15 * S, q = hp / max
  const torre = (tx, verso) => {
    const w = 8 * S, h = alto + 9 * S, base = y + 5 * S
    c.fillStyle = 'rgba(0,0,0,.3)'; c.fillRect(tx - w + 3, base - 2, w * 2 + 3, 5 * S)
    c.fillStyle = pietra[0]; c.fillRect(tx - w, base - h, w * 2, h)
    c.fillStyle = pietra[1]; c.fillRect(tx - w, base - h, w * 1.45, h)
    c.fillStyle = pietra[2]; c.fillRect(tx - w, base - h, w * 0.4, h)
    c.fillStyle = 'rgba(0,0,0,.2)'
    for (let r = 1; r < 4; r++) c.fillRect(tx - w, base - h * r / 4, w * 2, Math.max(1, S * 0.7))
    for (const d of [-w - S, -w * 0.32, w * 0.46]) {       // i merli
      c.fillStyle = pietra[1]; c.fillRect(tx + d, base - h - 4 * S, 4.6 * S, 4.6 * S)
      c.fillStyle = pietra[2]; c.fillRect(tx + d, base - h - 4 * S, 4.6 * S, 1.3 * S)
    }
    c.fillStyle = '#17121a'; c.fillRect(tx - 1.6 * S, base - h + 5 * S, 3.2 * S, 7 * S)        // la feritoia
    stendardo(c, tx, base - h - 2 * S, 11 * S, 11 * S, col, ora, verso)
  }
  if (hp <= 0) {
    for (const [dx, dy, r, i] of [[-13, 3, 6, 0], [-3, 6, 7, 1], [7, 2, 6, 0], [14, 5, 5, 1], [0, 0, 4, 2]]) {
      c.fillStyle = pietra[i]; c.beginPath(); c.ellipse(x + dx * S, y + dy * S, r * S, r * 0.62 * S, 0, 0, 7); c.fill()
    }
    return
  }
  c.save()
  if (ferita) c.globalAlpha = 0.72
  c.fillStyle = pietra[0]; c.fillRect(x - mezza, y - alto - 3 * S, mezza * 2, alto + 8 * S)     // l'arco
  c.fillStyle = '#2b1a10'; c.beginPath(); c.roundRect(x - mezza + 6 * S, y - alto + 1 * S, mezza * 2 - 12 * S, alto + 4 * S, [9 * S, 9 * S, 0, 0]); c.fill()
  c.fillStyle = '#6b4424'; c.beginPath(); c.roundRect(x - mezza + 7 * S, y - alto + 2 * S, mezza * 2 - 14 * S, alto + 3 * S, [8 * S, 8 * S, 0, 0]); c.fill()
  c.strokeStyle = '#3a2412'; c.lineWidth = Math.max(1, S * 0.9)
  for (let d = -mezza + 12 * S; d < mezza - 8 * S; d += 5 * S) { c.beginPath(); c.moveTo(x + d, y - alto + 3 * S); c.lineTo(x + d, y + 5 * S); c.stroke() }
  c.fillStyle = '#2b2b33'
  for (const dy of [-alto * 0.45, 0]) c.fillRect(x - mezza + 7 * S, y + dy, mezza * 2 - 14 * S, 1.8 * S)
  c.fillStyle = col; c.fillRect(x - mezza, y - alto - 3 * S, mezza * 2, 2.4 * S)
  // le crepe dicono quanto regge
  c.strokeStyle = '#120c08'; c.lineWidth = Math.max(1, S * 0.8)
  if (q < 0.66) { c.beginPath(); c.moveTo(x - 7 * S, y - alto + 4 * S); c.lineTo(x - 2 * S, y - 5 * S); c.lineTo(x - 6 * S, y + 3 * S); c.stroke() }
  if (q < 0.33) { c.beginPath(); c.moveTo(x + 8 * S, y - alto + 6 * S); c.lineTo(x + 3 * S, y - 3 * S); c.lineTo(x + 9 * S, y + 4 * S); c.stroke() }
  c.restore()
  torre(x - mezza, -1); torre(x + mezza, 1)
  if (barra) barra(y - alto - 14 * S)
}

/* la miniera: un monte di roccia con l'imbocco armato di travi, le rotaie e il carrello d'oro; dal livello 5 cresce la
   torre col verricello. `u` è una misura di edificio, già scalata mentre spunta */
export function disegnaMiniera(c, { x, piede, u, stadio, lato, ora, sasso }) {
  const [s, m, l] = sasso, y = piede - u(9), col = squadra(lato)
  c.fillStyle = 'rgba(0,0,0,.3)'; c.beginPath(); c.ellipse(x + u(4), y + u(1), u(32), u(7), 0, 0, 7); c.fill()
  // il monte: tre piani di roccia, chiaro a sinistra
  poli(c, s, x - u(31), y, x - u(24), y - u(21), x - u(11), y - u(33), x + u(6), y - u(39), x + u(21), y - u(27), x + u(31), y)
  poli(c, m, x - u(31), y, x - u(24), y - u(21), x - u(11), y - u(33), x + u(6), y - u(39), x + u(1), y - u(18), x - u(3), y)
  poli(c, l, x - u(24), y - u(21), x - u(11), y - u(33), x + u(6), y - u(39), x - u(5), y - u(27))
  poli(c, s, x + u(13), y, x + u(16), y - u(13), x + u(25), y - u(9), x + u(31), y)
  // le vene d'oro che brillano
  c.fillStyle = '#ffd24a'
  for (const [dx, dy, k] of [[-19, -18, 0], [13, -29, 1.7], [-7, -29, 3.1], [19, -14, 4.4]]) {
    const b = 0.45 + 0.55 * Math.abs(Math.sin(ora * 1.7 + k))
    c.globalAlpha = b; c.fillRect(x + u(dx), y + u(dy), u(3), u(2)); c.fillRect(x + u(dx + 1), y + u(dy - 1), u(1), u(4))
  }
  c.globalAlpha = 1
  // l'imbocco: buio, con la lanterna che trema
  c.fillStyle = '#120c08'; c.beginPath(); c.roundRect(x - u(11), y - u(24), u(22), u(25), [u(9), u(9), 0, 0]); c.fill()
  const fiamma = 0.3 + 0.1 * Math.sin(ora * 9) + 0.06 * Math.sin(ora * 23)
  const g = c.createRadialGradient(x, y - u(13), 0, x, y - u(13), u(13))
  g.addColorStop(0, `rgba(255,190,90,${fiamma + 0.25})`); g.addColorStop(1, 'rgba(255,150,50,0)')
  c.fillStyle = g; c.fillRect(x - u(12), y - u(25), u(24), u(26))
  c.fillStyle = '#6b4a2b'; c.fillRect(x - u(13), y - u(26), u(4.5), u(27)); c.fillRect(x + u(8.5), y - u(26), u(4.5), u(27))
  c.fillStyle = '#8a6438'; c.fillRect(x - u(13), y - u(26), u(1.6), u(27)); c.fillRect(x + u(8.5), y - u(26), u(1.6), u(27))
  c.fillStyle = '#7a5730'; c.fillRect(x - u(16), y - u(30), u(32), u(5))
  c.fillStyle = '#a07a48'; c.fillRect(x - u(16), y - u(30), u(32), u(1.6))
  // le rotaie e il carrello
  c.fillStyle = '#3a2c20'
  for (let i = 0; i < 4; i++) c.fillRect(x - u(4) + u(i * 6.5), y - u(1.5), u(2), u(4))
  c.fillStyle = '#7c7c86'; c.fillRect(x - u(7), y - u(0.5), u(32), u(1)); c.fillRect(x - u(7), y + u(1.4), u(32), u(1))
  const cx = x + u(15)
  c.fillStyle = '#3b3b44'; poli(c, '#3b3b44', cx - u(9), y - u(9), cx + u(9), y - u(9), cx + u(7), y - u(1.5), cx - u(7), y - u(1.5))
  c.fillStyle = '#5a5a66'; c.fillRect(cx - u(9), y - u(9), u(18), u(1.6))
  c.fillStyle = '#17171c'; for (const d of [-5, 5]) { c.beginPath(); c.arc(cx + u(d), y - u(1), u(2), 0, 7); c.fill() }
  for (const [dx, dy, r, i] of [[-5, -10, 3, 0], [0, -11.5, 3.4, 1], [5, -10, 3, 0], [-2.5, -13, 2.4, 1], [2.8, -13.6, 2.2, 0]]) {
    c.fillStyle = i ? '#ffe27a' : '#f0b52c'; c.beginPath(); c.arc(cx + u(dx), y + u(dy), u(r), 0, 7); c.fill()
  }
  c.fillStyle = '#fff6c8'; c.fillRect(cx - u(1), y - u(14), u(1.4), u(1.4))
  // dal livello 5: la torre col verricello che gira
  if (stadio >= 2) {
    const tx = x - u(17), ty = y - u(22)
    c.strokeStyle = '#6b4a2b'; c.lineWidth = u(2.4)
    c.beginPath(); c.moveTo(tx - u(8), ty + u(14)); c.lineTo(tx, ty - u(20)); c.lineTo(tx + u(8), ty + u(14)); c.moveTo(tx - u(4.5), ty); c.lineTo(tx + u(4.5), ty); c.stroke()
    c.strokeStyle = '#a07a48'; c.lineWidth = u(1.5); c.beginPath(); c.arc(tx, ty - u(20), u(6), 0, 7); c.stroke()
    for (let i = 0; i < 3; i++) {
      const a = ora * 1.6 + i * Math.PI / 3
      c.beginPath(); c.moveTo(tx - Math.cos(a) * u(6), ty - u(20) - Math.sin(a) * u(6)); c.lineTo(tx + Math.cos(a) * u(6), ty - u(20) + Math.sin(a) * u(6)); c.stroke()
    }
  }
  stendardo(c, x + u(6), y - u(35), u(16), u(13), col, ora)
}

/* quello che resta di una miniera crollata */
export function disegnaRuderiMiniera(c, { x, piede, u, sasso }) {
  const y = piede - u(9)
  for (const [dx, dy, r, i] of [[-15, -2, 9, 0], [-3, -5, 11, 1], [11, -1, 8, 0], [20, 1, 5, 1], [-22, 1, 5, 2]]) {
    c.fillStyle = sasso[i]; c.beginPath(); c.ellipse(x + u(dx), y + u(dy), u(r), u(r * 0.66), 0, 0, 7); c.fill()
  }
  c.save(); c.translate(x + u(4), y - u(9)); c.rotate(-0.5)
  c.fillStyle = '#6b4a2b'; c.fillRect(-u(13), -u(2), u(26), u(4)); c.restore()
  c.fillStyle = '#ffd24a'; c.fillRect(x - u(8), y - u(8), u(3), u(2))
}
