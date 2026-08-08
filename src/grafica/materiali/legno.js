/* ═══════════════════════════════════════════════════════════════════
   IL LEGNO E LA TERRA — la miniera

   Tre materiali che vanno insieme: la terra battuta (il pavimento più
   quieto di tutti, nessuna posa, solo chiazze), i binari che
   attraversano la stanza, e i muri tenuti su dalle travi.

   La miniera è l'unica stanza che si legge come **costruita in
   fretta**, ed è giusto così: è un buco tenuto su dalle assi.
   ═══════════════════════════════════════════════════════════════════ */
import { mescola, dado, rett, ell, velo } from '../comune.js'
import { semina } from './semina.js'

/* ── la terra battuta ──
   Nessun giunto: solo il colore che cambia a chiazze morbide e i
   solchi di chi è passato. Serve anche al bosco. */
export function terra(c, reg, A, lato) {
  semina(reg, lato * 0.95, 21, 1, null, (x, y, r) => {
    /* piccole e tenui: grandi tre quarti di cella e al trenta per
       cento di velo erano bolle chiare, e una miniera con le bolle
       sembra una pozza di fango invece che terra battuta */
    const rx = lato * (0.16 + r(1) * 0.42)
    velo(c, 0.1 + r(2) * 0.1, () =>
      ell(c, x, y, rx, rx * (0.4 + r(3) * 0.35),
          r(4) > 0.5 ? mescola(A.terra, '#ffffff', 0.16) : mescola(A.terra, '#000000', 0.22)))
  })
  semina(reg, lato * 3.4, 23, 1, null, (x, y, r) => {
    if (r(1) < 0.72) return
    velo(c, 0.2, () => {
      c.strokeStyle = mescola(A.terra, '#000000', 0.35)
      c.lineWidth = lato * 0.03; c.lineCap = 'round'
      c.beginPath()
      c.moveTo(x - lato * 1.2, y)
      c.quadraticCurveTo(x, y + lato * (r(2) - 0.5) * 0.5, x + lato * 1.2, y)
      c.stroke()
    })
  })
}

/* ── i binari ──
   Terra battuta più il binario vero: traversine di legno e due rotaie,
   che corrono **per tutta la stanza** su righe fisse. Non è un
   dettaglio sparso: un binario a pezzi non porta da nessuna parte, e
   la prima cosa che un binario deve dire è che arriva da lontano e va
   lontano. */
export function binari(c, reg, A, lato, scoperto) {
  terra(c, reg, A, lato)
  const passo = lato * 6.5                        // ogni quante celle un binario
  for (let f = Math.floor(reg.y0 / passo); f < Math.ceil(reg.y1 / passo); f++) {
    const y = f * passo + passo * 0.42
    if (y < reg.y0 - lato || y > reg.y1 + lato) continue
    for (let x = Math.floor(reg.x0 / (lato * 0.5)) * lato * 0.5; x < reg.x1 + lato; x += lato * 0.5) {
      const r = m => dado(Math.round(x), f, 1100 + m)
      const col = mescola('#6a4a2c', '#3f2a16', r(1))
      rett(c, x, y - lato * 0.32, lato * 0.34, lato * 0.64, col)
      rett(c, x, y - lato * 0.32, lato * 0.34, lato * 0.12, mescola(col, '#ffffff', 0.14))
    }
    for (const d of [-1, 1]) {
      rett(c, reg.x0, y + d * lato * 0.24 - lato * 0.05, reg.x1 - reg.x0, lato * 0.1, '#5c6470')
      rett(c, reg.x0, y + d * lato * 0.24 - lato * 0.05, reg.x1 - reg.x0, lato * 0.035, '#8f9aa8')
    }
  }
}

/* ── il muro di legname ──
   Assi orizzontali basse (la solita scala) e i montanti verticali ogni
   cella e mezza, con i chiodi. */
export function legno(c, reg, A, lato, tinte, dentro) {
  const h = lato * 0.26, g = lato * 0.02
  for (let k = Math.floor(reg.y0 / h) - 1; k < Math.ceil(reg.y1 / h); k++)
    for (let i = Math.floor(reg.x0 / (lato * 0.9)) - 1; i < Math.ceil(reg.x1 / (lato * 0.9)); i++) {
      const r = m => dado(i, k, 1400 + m)
      const x = i * lato * 0.9, w = lato * 0.9
      if (dentro && !dentro(x, k * h, w, h)) continue
      const col = mescola(tinte[0], tinte[1], r(1))
      rett(c, x + g, k * h + g, w - g * 2, h - g * 2, col)
      rett(c, x + g, k * h + g, w - g * 2, (h - g * 2) * 0.26, mescola(col, '#ffffff', 0.16))
      rett(c, x + g, k * h + h - g - (h - g * 2) * 0.2, w - g * 2, (h - g * 2) * 0.2,
           mescola(col, '#000000', 0.24))
      // la venatura del legno: una riga sola, e basta
      if (r(2) > 0.5) {
        velo(c, 0.3, () => {
          c.strokeStyle = mescola(col, '#000000', 0.5); c.lineWidth = lato * 0.012
          c.beginPath()
          c.moveTo(x + g, k * h + h * (0.35 + r(3) * 0.3))
          c.lineTo(x + w - g, k * h + h * (0.35 + r(4) * 0.3))
          c.stroke()
        })
      }
    }
  // i montanti, sopra a tutto, con i chiodi
  const passo = lato * 1.8
  for (let i = Math.floor(reg.x0 / passo) - 1; i < Math.ceil(reg.x1 / passo); i++) {
    const x = i * passo + passo * 0.5
    const col = mescola(tinte[0], '#000000', 0.22)
    rett(c, x - lato * 0.11, reg.y0, lato * 0.22, reg.y1 - reg.y0, col)
    rett(c, x - lato * 0.11, reg.y0, lato * 0.07, reg.y1 - reg.y0, mescola(col, '#ffffff', 0.16))
    for (let k = Math.floor(reg.y0 / (lato * 0.52)); k < Math.ceil(reg.y1 / (lato * 0.52)); k++)
      ell(c, x, k * lato * 0.52 + lato * 0.26, lato * 0.03, lato * 0.03, '#3f4550')
  }
}
