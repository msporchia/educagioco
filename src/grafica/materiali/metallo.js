/* ═══════════════════════════════════════════════════════════════════
   IL METALLO — la sala degli ingranaggi

   Piastre a terra e lastre imbullonate sui muri. Le piastre sono
   piccole (il doppio del corso del muro, non una per cella: era «un
   mattone grande un personaggio») e hanno **un rivetto sola**, non
   quattro: con piastre così piccole i bulloni sui quattro angoli si
   sarebbero moltiplicati con loro, e i bulloni sparsi ci sono già come
   dettaglio.
   ═══════════════════════════════════════════════════════════════════ */
import { mescola, dado, rett, ell, velo } from '../comune.js'

/* ── il pavimento a piastre ── */
export function metallo(c, reg, A, lato, tinte, scoperto, opz = {}) {
  const modo = opz.modo || 'normale', sm = (opz.seme || 0) * 71
  /* `arrugginito` tira il colore verso l'ossido; `consumato` ci passa
     il graffio chiaro di chi ha trascinato qualcosa sopra */
  const t = lato * 0.53, g = t * 0.07      // 0.53, non 0.52: vedi `lastre`
  for (let i = Math.floor(reg.x0 / t) - 1; i < Math.ceil(reg.x1 / t); i++)
    for (let k = Math.floor(reg.y0 / t) - 1; k < Math.ceil(reg.y1 / t); k++) {
      const r = m => dado(i, k, 200 + m + sm)
      const x = i * t + g, y = k * t + g, w = t - g * 2
      if (scoperto && !scoperto(x, y, w, w)) continue
      let col = mescola(tinte[0], tinte[1], r(1) * 0.7)
      if (modo === 'arrugginito' && r(5) > 0.35) col = mescola(col, '#9a5a28', 0.18 + r(6) * 0.3)
      rett(c, x, y, w, w, col)
      rett(c, x, y, w, w * 0.12, mescola(col, '#ffffff', modo === 'consumato' ? 0.16 : 0.3))
      rett(c, x, y + w * 0.88, w, w * 0.12, mescola(col, '#000000', 0.25))
      const bx = r(2) > 0.5 ? 0.18 : 0.82, by = r(3) > 0.5 ? 0.18 : 0.82
      ell(c, x + w * bx, y + w * by, w * 0.07, w * 0.07, mescola(col, '#000000', 0.35))
      if (r(4) > 0.93) {            // qualche piastra è una griglia
        velo(c, 0.5, () => {
          for (let s = 1; s < 4; s++)
            rett(c, x + w * 0.14, y + w * (0.14 + s * 0.22), w * 0.72, w * 0.07, '#1a1d22')
        })
      }
      // il graffio: una riga chiara diagonale, solo sul consumato
      if (modo === 'consumato' && r(7) > 0.55)
        velo(c, 0.5, () => {
          c.strokeStyle = mescola(col, '#ffffff', 0.4); c.lineWidth = w * 0.02
          c.beginPath()
          c.moveTo(x + w * 0.15, y + w * (0.2 + r(8) * 0.2))
          c.lineTo(x + w * 0.85, y + w * (0.65 + r(9) * 0.2))
          c.stroke()
        })
    }
}
metallo.modi = ['normale', 'arrugginito', 'consumato']

/* ── il muro di lastre imbullonate ──
   pannelli larghi, rivetti fitti sui bordi, la saldatura in mezzo */
export function ferro(c, reg, A, lato, tinte, dentro, opz = {}) {
  const modo = opz.modo || 'normale', sm = (opz.seme || 0) * 67
  /* `arrugginito` scioglie l'ossido sui pannelli con colature verso il
     basso; `ammaccato` incassa un colpo per pannello e perde qualche
     rivetto — è la lastra piegata, non solo sporca */
  const h = lato * 0.26, w = lato * 1.1, g = lato * 0.05
  for (let k = Math.floor(reg.y0 / h) - 1; k < Math.ceil(reg.y1 / h); k++)
    for (let i = Math.floor(reg.x0 / w) - 1; i < Math.ceil(reg.x1 / w); i++) {
      const r = m => dado(i, k, 600 + m + sm)
      const x = i * w, y = k * h
      if (dentro && !dentro(x, y, w, h)) continue
      let col = mescola(tinte[0], tinte[1], r(1) * 0.8)
      if (modo === 'arrugginito' && r(2) > 0.4) col = mescola(col, '#9a5a28', 0.2 + r(3) * 0.3)
      rett(c, x + g, y + g, w - g * 2, h - g * 2, col)
      rett(c, x + g, y + g, w - g * 2, (h - g * 2) * 0.16, mescola(col, '#ffffff', modo === 'ammaccato' ? 0.14 : 0.26))
      rett(c, x + g, y + h - g - (h - g * 2) * 0.18, w - g * 2, (h - g * 2) * 0.18,
           mescola(col, '#000000', 0.22))
      // l'ammaccatura: un'ombra ovale fuori centro, che rompe la lastra piatta
      if (modo === 'ammaccato' && r(4) > 0.45)
        velo(c, 0.4, () => ell(c, x + g + (w - g * 2) * (0.3 + r(5) * 0.4),
                               y + g + (h - g * 2) * (0.3 + r(6) * 0.4),
                               w * 0.12, h * 0.28, mescola(col, '#000000', 0.4)))
      // le colature di ruggine: una riga scura che scende dal bordo alto
      if (modo === 'arrugginito' && r(7) > 0.5)
        velo(c, 0.5, () => rett(c, x + g + (w - g * 2) * r(8), y + g,
                                (w - g * 2) * 0.05, (h - g * 2) * (0.4 + r(9) * 0.5), '#5c2f14'))
      /* i rivetti: **una fila sì e una no**, e uno solo per rivetto.
         Con due file per pannello e la lucina sopra ognuno erano
         quarantamila ellissi su una mappa grande — quaranta volte
         quello che si vede. A 36 px la differenza fra un rivetto e
         quattro non si legge; quella fra 20 ms e 100 sì. */
      if (k % 2) continue
      const n = Math.max(2, Math.round(w / (lato * 0.28)))
      for (let b = 0; b < n; b++) {
        // l'ammaccato perde qualche rivetto: è saltato col colpo
        if (modo === 'ammaccato' && dado(i * 3 + b, k, 640 + sm) > 0.75) continue
        const bx = x + g + (w - g * 2) * (b + 0.5) / n
        ell(c, bx, y + g * 2.2, lato * 0.038, lato * 0.038, mescola(col, '#000000', 0.4))
      }
    }
}
ferro.modi = ['normale', 'arrugginito', 'ammaccato']
