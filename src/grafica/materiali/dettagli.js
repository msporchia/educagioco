/* ═══════════════════════════════════════════════════════════════════
   I DETTAGLI DI PIETRA — quelli che tolgono la piattezza

   Ciottoli, crepe, ossa, bulloni, monete, ragnatele, assi, cristalli:
   tutti minuscoli, tutti col loro dado, tutti alla stessa scala `s`
   (un'unità = lato/20). Il trucco non è che siano belli: è che siano
   **tanti e piccoli**. Un dettaglio che si vede da solo è un dettaglio
   sbagliato — il fondo deve stare indietro.

   La firma è sempre `(c, x, y, s, A, r)`: contesto, posizione, scala,
   ambiente, dado. Aggiungerne uno è una funzione qui e una riga
   nell'indice; usarlo è una riga nei dati di un ambiente.
   ═══════════════════════════════════════════════════════════════════ */
import { mescola, rett, ell, velo, poly } from '../comune.js'
import { crepa } from './semina.js'

export function ciottoli(c, x, y, s, A, r) {
  const rx = (0.8 + r(1) * 1.1) * s
  ell(c, x, y + 0.4 * s, rx, rx * 0.7, '#00000022')
  ell(c, x, y, rx, rx * 0.72, mescola(A.sasso, '#000000', r(2) * 0.25))
  ell(c, x - rx * 0.25, y - rx * 0.2, rx * 0.45, rx * 0.3, mescola(A.sasso, '#ffffff', 0.3))
}

export function crepe(c, x, y, s, A, r) {
  crepa(c, x, y, (4 + r(1) * 5) * s, A.giunto, r)
}

export function ossa(c, x, y, s, A, r) {
  if (r(1) < 0.62) return
  const osso = '#e2dccb'
  if (r(2) > 0.6) {                       // un teschio
    ell(c, x, y, 1.7 * s, 1.5 * s, osso)
    rett(c, x - 0.85 * s, y + 1.1 * s, 1.7 * s, 0.65 * s, osso)
    ell(c, x - 0.65 * s, y - 0.15 * s, 0.55 * s, 0.6 * s, '#3a3229')
    ell(c, x + 0.65 * s, y - 0.15 * s, 0.55 * s, 0.6 * s, '#3a3229')
  } else {                                 // due ossa incrociate
    for (const a of [0.5, -0.5]) {
      c.save(); c.translate(x, y); c.rotate(a)
      rett(c, -2 * s, -0.35 * s, 4 * s, 0.7 * s, osso)
      for (const dx of [-2, 2]) {
        ell(c, dx * s, -0.45 * s, 0.55 * s, 0.55 * s, osso)
        ell(c, dx * s, 0.45 * s, 0.55 * s, 0.55 * s, osso)
      }
      c.restore()
    }
  }
}

export function bulloni(c, x, y, s, A, r) {
  if (r(1) > 0.45) {                       // una ruota dentata incassata
    const R = (2.5 + r(2) * 2) * s
    velo(c, 0.55, () => {
      ell(c, x, y, R, R, mescola(A.lastra[1], '#000000', 0.3))
      for (let k = 0; k < 10; k++) {
        const a = k / 10 * 6.29 + r(3)
        ell(c, x + Math.cos(a) * R, y + Math.sin(a) * R, R * 0.22, R * 0.22,
            mescola(A.lastra[1], '#000000', 0.3))
      }
      ell(c, x, y, R * 0.55, R * 0.55, mescola(A.lastra[0], '#ffffff', 0.1))
      ell(c, x, y, R * 0.22, R * 0.22, mescola(A.lastra[1], '#000000', 0.45))
    })
    return
  }
  velo(c, 0.5, () => {                     // o una macchia d'olio
    const rx = (2 + r(4) * 3) * s
    ell(c, x, y, rx, rx * 0.5, '#14161a')
    ell(c, x - rx * 0.2, y - rx * 0.1, rx * 0.4, rx * 0.14, '#3d4a52')
  })
}

export function monete(c, x, y, s, A, r) {
  if (r(1) < 0.55) return
  const n = 1 + Math.floor(r(2) * 3)
  for (let k = 0; k < n; k++) {
    const mx = x + (r(k + 3) - 0.5) * 4 * s, my = y + (r(k + 6) - 0.5) * 2.5 * s
    if (r(k + 9) > 0.7) {                  // una gemma
      const col = ['#7fe0ff', '#ff5a7a', '#4fe08a'][Math.floor(r(k + 12) * 3)]
      poly(c, [[mx, my - 1 * s], [mx + 0.85 * s, my - 0.2 * s], [mx, my + 1 * s],
               [mx - 0.85 * s, my - 0.2 * s]], col, mescola(col, '#000000', 0.4), 0.3 * s)
    } else {
      ell(c, mx, my + 0.3 * s, 1.05 * s, 0.55 * s, '#00000026')
      ell(c, mx, my, 1.05 * s, 0.75 * s, '#f2c94c')
      ell(c, mx, my, 0.6 * s, 0.4 * s, '#ffe9a0')
    }
  }
}

/* la ragnatela sparsa: solo negli angoli, e ci pensa chi chiama */
export function ragnatele(c, x, y, s, A, r) {
  if (r(1) < 0.7) return
  velo(c, 0.4, () => {
    c.strokeStyle = '#e8e4d8'; c.lineWidth = 0.35 * s
    const R = (3.5 + r(2) * 2.5) * s
    for (let k = 0; k <= 4; k++) {
      const a = k / 4 * 1.57
      c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * R, y + Math.sin(a) * R); c.stroke()
    }
    for (let g = 1; g <= 3; g++) {
      c.beginPath(); c.arc(x, y, R * g / 3.4, 0, 1.57); c.stroke()
    }
  })
}

/* le assi abbandonate della miniera */
export function assi(c, x, y, s, A, r) {
  if (r(1) < 0.62) return
  const col = mescola('#8a5a30', '#5a3a1c', r(2))
  c.save(); c.translate(x, y); c.rotate((r(3) - 0.5) * 1.6)
  const w = (4.5 + r(4) * 3) * s
  ell(c, 0, 0.7 * s, w * 0.55, 0.6 * s, '#00000022')
  rett(c, -w / 2, -0.55 * s, w, 1.1 * s, col)
  rett(c, -w / 2, -0.55 * s, w, 0.3 * s, mescola(col, '#ffffff', 0.18))
  for (const dx of [-0.35, 0.32]) ell(c, w * dx, 0, 0.2 * s, 0.2 * s, '#3f4550')
  c.restore()
}

/* i cristalli: il solo dettaglio del gioco che è **acceso**. Rari
   apposta — se ce n'è uno ogni due celle non è più un tesoro. */
export function cristalli(c, x, y, s, A, r) {
  if (r(1) < 0.78) return
  const col = A.cristallo || '#7fd8e0'
  velo(c, 0.85, () => {
    ell(c, x, y + 0.3 * s, 2 * s, 0.7 * s, col + '22')
    for (let k = 0; k < 3; k++) {
      // `x +`: senza, le tre punte finivano tutte contro il bordo sinistro
      // della mappa invece che accanto al loro alone
      const dx = x + (k - 1) * 0.95 * s + (r(k + 2) - 0.5) * 0.5 * s
      const h = (1.3 + r(k + 5) * 1.3) * s
      poly(c, [[dx - 0.5 * s, y], [dx, y - h], [dx + 0.5 * s, y]], col,
           mescola(col, '#000000', 0.45), 0.25 * s)
      poly(c, [[dx - 0.15 * s, y], [dx, y - h], [dx + 0.18 * s, y - h * 0.3]],
           mescola(col, '#ffffff', 0.5))
    }
  })
}
