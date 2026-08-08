/* ═══════════════════════════════════════════════════════════════════
   IL VERDE — l'erba e gli alberi

   L'erba è l'unico pavimento in cui le celle spariscono del tutto: non
   c'è niente di squadrato, solo chiazze di terra dove passa la gente.

   Gli alberi sono la cosa più strana del file: **una muratura che non
   è muratura**. Le celle chiuse del bosco non sono muri, sono chiome —
   ma la macchina che dipinge i muri (ombra portata, sagoma ritagliata,
   filo di luce in cima) va bene lo stesso, e anzi il filo di luce
   diventa il sole che batte sulle cime. Questo è tutto il vantaggio di
   avere le murature come dati: un bosco costa una funzione, non un
   secondo motore.
   ═══════════════════════════════════════════════════════════════════ */
import { mescola, dado, rett, ell, velo } from '../comune.js'
import { semina } from './semina.js'

/* ── il prato ── */
export function erba(c, reg, A, lato) {
  /* le chiazze di terra: **la metà** di prima e il doppio di numero.
     Grandi come una cella e mezza sembravano buche in cui il
     personaggio poteva cadere; grandi mezza cella sono il consumo di
     chi ci cammina, che è quello che dovevano essere. */
  semina(reg, lato * 2.1, 11, 1, null, (x, y, r) => {
    if (r(1) > 0.55) return
    const rx = lato * (0.4 + r(2) * 0.8)
    velo(c, 0.42 + r(3) * 0.26, () => ell(c, x, y, rx, rx * (0.5 + r(4) * 0.3), A.terra))
    velo(c, 0.3, () => ell(c, x - rx * 0.2, y - rx * 0.15, rx * 0.6, rx * 0.3,
                           mescola(A.terra, '#ffffff', 0.25)))
  })
}

/* ── le chiome del bosco ──
   Ciuffi tondi e fitti, due verdi, più qualche tronco che si
   intravede sotto. Un bosco visto dall'alto è chioma: il tronco si
   indovina, non si disegna. */
export function alberi(c, reg, A, lato, tinte, dentro) {
  // il sottobosco scuro sotto le chiome: senza, fra un ciuffo e
  // l'altro si vedrebbe il pavimento
  rett(c, reg.x0, reg.y0, reg.x1 - reg.x0, reg.y1 - reg.y0, mescola(tinte[1], '#000000', 0.35))
  const passo = lato * 0.5
  for (let k = Math.floor(reg.y0 / passo) - 1; k < Math.ceil(reg.y1 / passo) + 1; k++)
    for (let i = Math.floor(reg.x0 / passo) - 1; i < Math.ceil(reg.x1 / passo) + 1; i++) {
      if (dentro && !dentro(i * passo, k * passo, passo, passo)) continue
      const r = m => dado(i, k, 1300 + m)
      const cx = (i + 0.5 + (r(1) - 0.5) * 0.9) * passo
      const cy = (k + 0.5 + (r(2) - 0.5) * 0.9) * passo
      const rr = passo * (0.55 + r(3) * 0.45)
      const col = mescola(tinte[0], tinte[1], r(4))
      ell(c, cx, cy + rr * 0.25, rr, rr * 0.82, mescola(col, '#000000', 0.3))
      ell(c, cx, cy, rr, rr * 0.86, col)
      // il lume in cima al ciuffo: è quello che fa la chioma tonda
      if (r(5) > 0.4)
        ell(c, cx - rr * 0.28, cy - rr * 0.3, rr * 0.45, rr * 0.32, mescola(col, '#ffffff', 0.22))
    }
  semina(reg, lato * 1.9, 37, 1, null, (x, y, r) => {
    if (r(1) < 0.62) return
    velo(c, 0.55, () => {
      ell(c, x, y, lato * 0.16, lato * 0.13, '#4a3520')
      ell(c, x - lato * 0.05, y - lato * 0.04, lato * 0.07, lato * 0.05, '#6a4f30')
    })
  })
}
