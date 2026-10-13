// Gli edifici della cittadella, disegnati in codice finché non arriva il foglio dipinto
// (strumenti/sprite/DA-GENERARE.md, voce 7): è l'unico punto da cambiare. Ogni edificio ha
// la stessa fondazione di pietra, la parte di sopra dice quale delle sue due truppe ci
// abita, e dal livello 5 cresce (`stadio` 2). Nessuna regola qui: solo il disegno.
// `u(v)` dà una misura di progetto in pixel dello schermo; (x, y) è il piede, al centro.

const PIETRA = '#a49c8e', PIETRA_SCURA = '#7d7568'

function rett(c, u, x, y, x0, y0, x1, y1, colore) {
  c.fillStyle = colore
  c.fillRect(x + u(x0), y + u(y0), u(x1 - x0), u(y1 - y0))
}
function poli(c, u, x, y, punti, colore) {
  c.fillStyle = colore
  c.beginPath()
  punti.forEach(([px, py], i) => (i ? c.lineTo(x + u(px), y + u(py)) : c.moveTo(x + u(px), y + u(py))))
  c.closePath(); c.fill()
}
function tondo(c, u, x, y, cx, cy, r, colore) {
  c.fillStyle = colore
  c.beginPath(); c.arc(x + u(cx), y + u(cy), u(r), 0, 7); c.fill()
}
function porta(c, u, x, y, largo = 5, alto = 9) {
  c.fillStyle = '#24160d'
  c.beginPath(); c.moveTo(x - u(largo), y + u(-3)); c.lineTo(x - u(largo), y - u(alto - 2))
  c.quadraticCurveTo(x, y - u(alto + 3), x + u(largo), y - u(alto - 2)); c.lineTo(x + u(largo), y + u(-3)); c.fill()
}
function bandiera(c, u, x, y, px, py, col, ora) {
  c.strokeStyle = '#3b2716'; c.lineWidth = Math.max(1, u(1.3))
  c.beginPath(); c.moveTo(x + u(px), y + u(py)); c.lineTo(x + u(px), y + u(py - 13)); c.stroke()
  const sv = Math.sin(ora * 5 + x * 0.1) * u(1.4)
  poli(c, u, x, y + sv, [[px, py - 13], [px + 11, py - 10], [px, py - 7]], col)
}

/* la fondazione comune: un basamento basso di pietra squadrata */
function fondazione(c, u, x, y) {
  rett(c, u, x, y, -25, -5, 25, 1, PIETRA)
  rett(c, u, x, y, -25, -1, 25, 1, PIETRA_SCURA)
  c.strokeStyle = 'rgba(50,44,36,.35)'; c.lineWidth = 1
  for (let i = -20; i < 25; i += 9) { c.beginPath(); c.moveTo(x + u(i), y - u(5)); c.lineTo(x + u(i), y + u(1)); c.stroke() }
}

const DISEGNI = {
  /* la cripta: pietra chiara e ossa */
  cripta(c, u, x, y, { id, stadio, col, scuro, ora }) {
    const h = stadio > 1 ? 26 : 21
    rett(c, u, x, y, -19, -h, 19, -5, '#d8cfba')
    rett(c, u, x, y, 13, -h, 19, -5, '#b5ab95')
    for (let i = -19; i < 19; i += 6) rett(c, u, x, y, i, -h - 3, i + 3.5, -h, '#d8cfba')    // i merli
    rett(c, u, x, y, -19, -h, 19, -h + 1.6, col)
    // le ossa incrociate sulla facciata
    c.strokeStyle = '#f4efe2'; c.lineWidth = Math.max(1, u(1.6))
    c.beginPath(); c.moveTo(x - u(6), y - u(h - 4)); c.lineTo(x + u(6), y - u(h - 10)); c.moveTo(x + u(6), y - u(h - 4)); c.lineTo(x - u(6), y - u(h - 10)); c.stroke()
    if (id === 'guardiano') {
      porta(c, u, x, y, 7, 11)                                             // il portone degli opliti
      for (const sx of [-13, 13]) { tondo(c, u, x, y, sx, -11, 4, col); tondo(c, u, x, y, sx, -11, 1.6, scuro) }
      c.strokeStyle = '#6b5a45'
      for (const sx of [-15, -11, 11, 15]) { c.beginPath(); c.moveTo(x + u(sx), y - u(h)); c.lineTo(x + u(sx), y - u(h + 9)); c.stroke() }
    } else {
      porta(c, u, x, y)
      // la torretta a feritoie degli arcieri, e il bersaglio
      const t = stadio > 1 ? 44 : 36
      rett(c, u, x, y, 6, -t, 17, -h, '#cfc5ae')
      rett(c, u, x, y, 10.5, -t + 5, 12.5, -t + 12, '#2b1d12')
      for (let i = 6; i < 17; i += 4) rett(c, u, x, y, i, -t - 3, i + 2.5, -t, '#cfc5ae')
      for (const [r, k] of [[5, '#f4efe2'], [3.4, '#c43c2c'], [1.6, '#f4efe2']]) tondo(c, u, x, y, -21, -6, r, k)
    }
    bandiera(c, u, x, y, -15, -h - 2, col, ora)
    if (stadio > 1) bandiera(c, u, x, y, 0, -h - 2, col, ora)
  },

  /* la torre oscura: pietra viola e oro */
  torre(c, u, x, y, { id, stadio, col, ora }) {
    const t = stadio > 1 ? 50 : 42
    rett(c, u, x, y, -17, -16, 17, -5, '#6c4e8c')
    rett(c, u, x, y, -9, -t, 9, -15, '#7b5c9c')
    rett(c, u, x, y, 4, -t, 9, -15, '#5b3f78')
    rett(c, u, x, y, -9, -t + 6, 9, -t + 8, '#d9b54a')                     // la fascia d'oro
    rett(c, u, x, y, -17, -16, 17, -14.4, col)
    porta(c, u, x, y, 4.5, 9)
    if (id === 'diavoletto') {
      // il camino a corna e il pozzo di brace
      poli(c, u, x, y, [[-9, -t], [-12, -t - 9], [-5, -t], [5, -t], [12, -t - 9], [9, -t]], '#3a2433')
      const brace = 0.6 + 0.4 * Math.sin(ora * 7)
      c.fillStyle = `rgba(255,${110 + 60 * brace},40,.9)`
      c.beginPath(); c.ellipse(x - u(19), y - u(3), u(6), u(2.6), 0, 0, 7); c.fill()
      for (const sx of [17, 22]) { rett(c, u, x, y, sx - 2.5, -9, sx + 2.5, -3, '#4a3020'); rett(c, u, x, y, sx - 2.5, -7, sx + 2.5, -6, '#222') }
    } else {
      // la guglia col teschio che galleggia
      poli(c, u, x, y, [[-10, -t], [0, -t - 12], [10, -t]], col)
      const su = Math.sin(ora * 2.4) * 1.6
      c.fillStyle = 'rgba(200,120,255,.35)'; c.beginPath(); c.arc(x, y - u(t + 19 + su), u(6), 0, 7); c.fill()
      tondo(c, u, x, y, 0, -t - 19 - su, 3.6, '#efe4ff')
      tondo(c, u, x, y, -1.2, -t - 19.5 - su, 0.9, '#5b2c8a'); tondo(c, u, x, y, 1.2, -t - 19.5 - su, 0.9, '#5b2c8a')
      for (const sx of [-15, 15]) { rett(c, u, x, y, sx - 1, -21, sx + 1, -16, '#f6eccc'); tondo(c, u, x, y, sx, -22.5, 1.1, '#ffcf5a') }
    }
    bandiera(c, u, x, y, -14, -16, col, ora)
    if (stadio > 1) bandiera(c, u, x, y, 14, -16, col, ora)
  },

  /* la tana: tronchi scuri, pelli e ossa */
  tana(c, u, x, y, { id, stadio, col, ora }) {
    const h = stadio > 1 ? 22 : 18
    rett(c, u, x, y, -20, -h, 20, -5, '#5e4129')
    c.strokeStyle = 'rgba(25,15,8,.55)'; c.lineWidth = 1
    for (let i = -h + 3; i < -5; i += 3.4) { c.beginPath(); c.moveTo(x - u(20), y + u(i)); c.lineTo(x + u(20), y + u(i)); c.stroke() }
    poli(c, u, x, y, [[-24, -h], [-12, -h - 12], [12, -h - 12], [24, -h]], '#8d6c49')     // il tetto di pelli
    rett(c, u, x, y, -24, -h - 1.5, 24, -h + 0.4, col)
    porta(c, u, x, y, 5, 9)
    if (id === 'pipistrelli') {
      // la torre di legno che finisce in una grotta, coi pipistrelli appesi
      const t = stadio > 1 ? 52 : 44
      rett(c, u, x, y, 6, -t, 16, -h - 6, '#4d3420')
      c.fillStyle = '#5f5a54'; c.beginPath(); c.ellipse(x + u(11), y - u(t), u(9), u(6), 0, 0, 7); c.fill()
      c.fillStyle = '#120c10'; c.beginPath(); c.ellipse(x + u(11), y - u(t - 1), u(5), u(3.2), 0, 0, 7); c.fill()
      c.fillStyle = '#1d1420'
      for (const [bx, by] of [[5, -t + 4], [17, -t + 5], [11, -t + 7]]) {
        c.beginPath(); c.moveTo(x + u(bx - 3), y + u(by)); c.lineTo(x + u(bx), y + u(by + 2.5)); c.lineTo(x + u(bx + 3), y + u(by)); c.lineTo(x + u(bx), y + u(by + 1)); c.fill()
      }
    } else {
      // il recinto dei lupi e le ossa
      c.fillStyle = '#4a3220'
      for (let i = -26; i <= -16; i += 3.4) c.fillRect(x + u(i), y - u(8), u(1.6), u(8))
      rett(c, u, x, y, -27, -6.5, -15, -5.2, '#4a3220')
      c.strokeStyle = '#efe6d2'; c.lineWidth = Math.max(1, u(1.4))
      c.beginPath(); c.moveTo(x + u(17), y - u(2)); c.lineTo(x + u(24), y - u(4)); c.stroke()
    }
    bandiera(c, u, x, y, -17, -h - 9, col, ora)
    if (stadio > 1) bandiera(c, u, x, y, 0, -h - 12, col, ora)
  },

  /* l'antro: massi enormi e catene */
  antro(c, u, x, y, { id, stadio, col, ora }) {
    const g = stadio > 1 ? 1.15 : 1
    for (const [cx, cy, r, k] of [[-13, -12, 11, '#7f776b'], [12, -13, 12, '#8c8478'], [0, -22, 13, '#958d80'], [0, -10, 9, '#6f685d']])
      tondo(c, u, x, y, cx, cy * g, r * g, k)
    c.fillStyle = '#171310'; c.beginPath(); c.ellipse(x, y - u(7), u(7), u(6), 0, Math.PI, 0); c.fill(); c.fillRect(x - u(7), y - u(7), u(14), u(4))
    rett(c, u, x, y, -24, -4, 24, -2.6, col)
    if (id === 'drago') {
      // il nido con le uova e una fiammella attaccata alla roccia
      c.fillStyle = '#6b4a2a'; c.beginPath(); c.ellipse(x + u(18), y - u(3), u(8), u(3.4), 0, 0, 7); c.fill()
      for (const ex of [15, 19, 22]) { c.fillStyle = '#efe2c4'; c.beginPath(); c.ellipse(x + u(ex), y - u(5.5), u(2), u(2.8), 0, 0, 7); c.fill() }
      const f = 1 + 0.25 * Math.sin(ora * 9)
      c.fillStyle = '#ff9a2a'; c.beginPath(); c.ellipse(x - u(10), y - u(32 * g) - u(3 * f), u(2.6), u(4.5 * f), 0, 0, 7); c.fill()
      c.fillStyle = '#ffe07a'; c.beginPath(); c.ellipse(x - u(10), y - u(32 * g) - u(2 * f), u(1.3), u(2.5 * f), 0, 0, 7); c.fill()
    } else {
      // l'incudine e le rune che brillano
      rett(c, u, x, y, -27, -7, -15, -4.5, '#3a3a40'); rett(c, u, x, y, -24, -4.5, -18, -1, '#2c2c31')
      const luce = 0.55 + 0.45 * Math.sin(ora * 3)
      c.fillStyle = `rgba(120,255,200,${luce})`
      for (const [rx, ry] of [[-13, -15], [12, -17], [0, -27]]) c.fillRect(x + u(rx - 1), y + u(ry * g - 2), u(2), u(4))
    }
    bandiera(c, u, x, y, 4, -34 * g, col, ora)
    if (stadio > 1) bandiera(c, u, x, y, -16, -22 * g, col, ora)
  },
}

/* un edificio della cittadella; torna l'altezza in unità di progetto, per mettergli sopra
   la barra della vita */
export function disegnaEdificio(c, opz) {
  const { u, x, y, ed } = opz
  fondazione(c, u, x, y)
  DISEGNI[ed](c, u, x, y, opz)
  return opz.stadio > 1 ? 56 : 48
}

export const EDIFICI_DISEGNATI = Object.keys(DISEGNI)
