// Le mura: il terreno delle ultime cinque tappe. Il più chiaro dei tre, apposta —
// le tappe sono le più affollate e un fondo cupo le renderebbe illeggibili.
// Vedi docs/core/grafica.md.
import { mescola, ell, rett, velo, poly } from '../comune.js'
import { POSE, DETTAGLI, semina, variazioni } from '../materiali/indice.js'
import { concio } from '../materiali/semina.js'
import { lastricato } from './vie.js'

export const MURA = {
  nome: 'Le mura',
  posa: 'lastre', via: null,
  fondo: ['#847c6e', '#645d52'],
  chiazze: ['#958e7f', '#575047'],
  lastra: ['#9a9384', '#847d70'],
  terra: '#8a7452', sasso: '#a49a86', muschio: '#5f8f4f',
  erbaC: '#8fc96a', erbaS: '#4f8f3f',
  giunto: '#3f3931', fungo: '#c9a04a',
  legno: '#7a5433', ferro: '#5c5347', oro: '#e8c569',
  luce: '#fff3c4', fiamma: '#ff9a3c', buio: 0.06,
  varianti: ['liscio', 'liscio', 'usura', 'licheni', 'screpolato'],
  dettagli: [['ciottoli', 2.6], ['crepe', 3.4], ['muschio', 4.4]],
}
MURA.via = {
  cordolo: '#b2a998', cordoloS: '#6f665a',
  giunto: '#4a443b', lastraC: '#cfc7b6', lastraS: '#a29a8a',
}

export const VARIANTI_MURA = {
  cortile: {
    // all'aperto, senza buio: è il metro di paragone per le altre quattro
    fondo: ['#8f8779', '#6b6459'], chiazze: ['#9c9484', '#5e574d'],
    lastra: ['#a49c8d', '#8f8779'], buio: 0,
    varianti: ['liscio', 'usura', 'licheni', 'licheni', 'detriti'],
    dettagli: [['ciuffi', 2.2], ['ciottoli', 2.8], ['muschio', 3.4], ['crepe', 4.4]],
  },
  camminamento: {
    // pietra sbiancata dal sole e dal vento: il posto più esposto
    fondo: ['#948d80', '#726b5f'], chiazze: ['#a49c8c', '#635c51'],
    lastra: ['#aaa294', '#948c7d'], buio: 0.04,
    dettagli: [['ciottoli', 2.4], ['crepe', 2.8], ['muschio', 5.4]],
  },
  corridoio: {
    // chiuso, illuminato a torce: il primo posto delle Mura in cui il
    // buio conta qualcosa
    fondo: ['#6b6350', '#4a4438'], chiazze: ['#786f59', '#3d382d'],
    lastra: ['#7d7461', '#6b6355'], giunto: '#38332a',
    luce: '#ffd98a', buio: 0.28,
    varianti: ['liscio', 'liscio', 'usura', 'polvere', 'screpolato'],
    dettagli: [['ciottoli', 3], ['crepe', 2.6], ['ragnatele', 5]],
  },
  trono: {
    // marmo e oro: l'unica stanza del gioco che si fa guardare apposta
    fondo: ['#7d6f85', '#54485f'], chiazze: ['#8a7a94', '#463c52'],
    lastra: ['#a89db4', '#948aa4'], giunto: '#463c52',
    muschio: '#6f8f6a', luce: '#ffe9a0', buio: 0.16,
    varianti: ['liscio', 'liscio', 'polvere', 'polvere', 'usura'],
    dettagli: [['ciottoli', 4], ['crepe', 4.6], ['monete', 5]],
  },
  bastione: {
    // tramonto rosso sull'ultima tappa: si vede che è l'ultima prima
    // ancora che parta la prima ondata
    fondo: ['#957661', '#664d41'], chiazze: ['#a8836b', '#54403a'],
    lastra: ['#a48570', '#907260'], giunto: '#54403a',
    luce: '#ffb47a', fiamma: '#ff7a3d', buio: 0.14,
    varianti: ['liscio', 'usura', 'detriti', 'screpolato', 'licheni'],
    dettagli: [['ciottoli', 2.2], ['crepe', 2.4], ['ossa', 5]],
  },
}

// la roba del castello: squadrata, non tonda come nel bosco — è quello che dice «costruito»
function cassa(p, x, y, s, A) {
  const c = A.legno
  ell(p.ctx, x, y + 5 * s, 8 * s, 2.8 * s, '#00000028')
  rett(p.ctx, x - 7 * s, y - 7 * s, 14 * s, 12 * s, c)
  rett(p.ctx, x - 7 * s, y - 7 * s, 14 * s, 3 * s, mescola(c, '#ffffff', 0.22))
  rett(p.ctx, x - 7 * s, y - 1 * s, 14 * s, 1.6 * s, mescola(c, '#000000', 0.3))
  rett(p.ctx, x - 1 * s, y - 7 * s, 2 * s, 12 * s, mescola(c, '#000000', 0.22))
}

function barile(p, x, y, s, A) {
  const c = mescola(A.legno, '#000000', 0.12)
  ell(p.ctx, x, y + 5 * s, 7 * s, 2.6 * s, '#00000028')
  rett(p.ctx, x - 5.4 * s, y - 8 * s, 10.8 * s, 13 * s, c)
  ell(p.ctx, x, y - 8 * s, 5.4 * s, 2 * s, mescola(c, '#ffffff', 0.3))
  for (const dy of [-5, 0.5]) rett(p.ctx, x - 5.8 * s, y + dy * s, 11.6 * s, 1.6 * s, A.ferro)
}

function braciere(p, x, y, s, A) {
  ell(p.ctx, x, y + 4 * s, 7 * s, 2.6 * s, '#00000028')
  poly(p.ctx, [[x - 5 * s, y - 6 * s], [x + 5 * s, y - 6 * s], [x + 3 * s, y + 4 * s],
               [x - 3 * s, y + 4 * s]], A.ferro)
  velo(p.ctx, 0.9, () => {
    ell(p.ctx, x, y - 9 * s, 5.4 * s, 5 * s, A.luce + '55')
    ell(p.ctx, x, y - 8 * s, 3.4 * s, 3.6 * s, '#ff9a3c')
    ell(p.ctx, x, y - 7.4 * s, 1.8 * s, 2.4 * s, '#ffe9a0')
  })
}

function blocco(p, x, y, s, A) {
  ell(p.ctx, x, y + 4 * s, 8 * s, 2.8 * s, '#00000026')
  concio(p.ctx, x - 7 * s, y - 6 * s, 14 * s, 11 * s, mescola(A.lastra[0], '#ffffff', 0.1),
         i => ((i * 29) % 13) / 13, true)
}

export const TERRENO_MURA = {
  nome: 'Le mura',
  via: 'lastricato',
  maglia: 19,

  // ruotato di un sesto di giro: i corsi orizzontali leggevano come un muro, non un
  // selciato dall'alto. La regione si allarga della diagonale, o gli angoli restano scoperti.
  fondo(p, A, { lato }) {
    const { ctx, W, H } = p
    const g = ctx.createLinearGradient(0, 0, W * 0.35, H)
    g.addColorStop(0, mescola(A.fondo[0], '#ffffff', 0.1)); g.addColorStop(1, A.fondo[1])
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
    const r = Math.hypot(W, H) / 2
    const largo = { x0: -r, y0: -r, x1: r, y1: r }
    ctx.save()
    ctx.translate(W / 2, H / 2); ctx.rotate(0.52)
    POSE[A.posa](ctx, largo, A, lato, A.lastra)
    variazioni(ctx, largo, A, lato, 71)
    ctx.restore()
  },

  strada(p, A, { via, caso }) { lastricato(p, via, A, caso) },

  minuti(p, A, { lato, reg, vicino }) {
    const s = lato / 20, S = p.S
    const libera = (x, y) => vicino(x, y) > 20 * S
    for (const [nome, passo] of A.dettagli) {
      const fn = DETTAGLI[nome]
      if (fn) semina(reg, lato * passo, nome.length * 7 + 5, 1, libera,
                     (x, y, r) => fn(p.ctx, x, y, s, A, r))
    }
  },

  sparso(p, A, { caso, vicino, postazioni }) {
    const { W, H, S } = p
    const roba = []
    for (let i = 0; i < 34; i++) {
      const x = caso() * W, y = caso() * H
      if (vicino(x, y) < 36 * S) continue
      if (postazioni.some(q => Math.hypot(q.x - x, q.y - y) < 32 * S)) continue
      roba.push({ x, y, s: (0.8 + caso() * 0.5) * S, che: caso() })
    }
    roba.sort((a, b) => a.y - b.y)
    for (const r of roba) {
      if (r.che > 0.82) braciere(p, r.x, r.y, r.s, A)
      else if (r.che > 0.62) barile(p, r.x, r.y, r.s, A)
      else if (r.che > 0.34) cassa(p, r.x, r.y, r.s, A)
      else blocco(p, r.x, r.y, r.s, A)
    }
  },

  piazzola(p, x, y, A, caso) {
    const { ctx, S } = p
    ell(ctx, x, y, 15 * S, 9.5 * S, '#00000024')
    const w = 12.5 * S, h = 7.6 * S
    poly(ctx, [[x - w, y], [x, y - h], [x + w, y], [x, y + h]],
         mescola(A.lastra[0], '#ffffff', 0.18))
    poly(ctx, [[x - w, y], [x, y - h], [x + w, y], [x, y - h * 0.1]],
         mescola(A.lastra[0], '#ffffff', 0.38))
    velo(ctx, 0.5, () => {
      ctx.strokeStyle = A.oro; ctx.lineWidth = 1.4 * S
      ctx.beginPath()
      ctx.moveTo(x - w, y); ctx.lineTo(x, y - h); ctx.lineTo(x + w, y)
      ctx.lineTo(x, y + h); ctx.closePath(); ctx.stroke()
    })
    if (caso() > 0.5) velo(ctx, 0.3, () => ell(ctx, x, y, 4 * S, 2.4 * S, A.giunto))
  },

  velo(p, A) {
    const { ctx, W, H } = p
    if (A.buio) velo(ctx, A.buio, () => { ctx.fillStyle = '#1a1424'; ctx.fillRect(0, 0, W, H) })
    const v = ctx.createRadialGradient(W * 0.5, H * 0.45, H * 0.3, W * 0.5, H * 0.5, H * 1.05)
    v.addColorStop(0, '#00000000'); v.addColorStop(1, '#241a2a44')
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H)
  },
}
