/* ═══════════════════════════════════════════════════════════════════
   IL SOTTERRANEO — il terreno delle tappe dalla sesta alla decima

   Roccia scavata, buio vero, e la luce che arriva solo dalle torce
   piantate lungo il cammino. Il pavimento è `rocciaPosa` di
   `materiali/roccia.js` — gli stessi massi tondeggianti delle grotte
   del Generale — e il buio è `luceEBuio` di `luce.js`, che non stende
   un velo giallo dove sta la fiaccola ma **buca il buio**: dentro il
   buco si vede il pavimento per com'è, fuori resta la grotta.

   Il pezzo nuovo è dove si appendono le torce. In una stanza a caselle
   stanno sulla faccia di un muro; qui non ci sono muri, e allora si
   piantano **lungo la strada**, alternate ai due lati: illuminano
   quello che serve vedere — il tracciato — e lasciano il resto al
   buio, che è esattamente il colpo d'occhio di un sotterraneo.

   ── le cinque tavolozze ──
   Grotta, miniera, fogne, cripta, gola: la stessa roccia con cinque
   luci diverse. È la luce a fare il posto — arancio di fuoco nella
   grotta, giallo di lampada nella miniera, verde marcio nelle fogne,
   menta fredda nella cripta, azzurro di cielo nella gola, che è
   l'unica di quaggiù ad avere un pezzo di cielo sopra.
   ═══════════════════════════════════════════════════════════════════ */
import { mescola, ell, velo, poly } from '../comune.js'
import { POSE, DETTAGLI, semina, variazioni } from '../materiali/indice.js'
import { masso } from '../materiali/semina.js'
import { luceEBuio, torciaFerma } from '../luce.js'
import { acciottolato } from './vie.js'

export const SOTTERRANEO = {
  nome: 'Il sotterraneo',
  posa: 'roccia', via: null,
  fondo: ['#2a2620', '#1a1714'],
  chiazze: ['#584f42', '#141210'],
  lastra: ['#544b3f', '#413931'],
  terra: '#4a4034', sasso: '#6b6153', muschio: '#4a6b4a',
  erbaC: '#5f8a4a', erbaS: '#3f6b3a',
  giunto: '#171310', fungo: '#8fb8c9', cristallo: '#8fd0ff',
  parete: ['#6f6353', '#453c31'],
  luce: '#ffbf7a', fiamma: '#ff9a3c', buio: 0.46,
  varianti: ['liscio', 'liscio', 'usura', 'detriti', 'licheni', 'ombra'],
  dettagli: [['ciottoli', 2.3], ['funghi', 3.6], ['crepe', 4.3], ['muschio', 5]],
}
SOTTERRANEO.via = {
  scarpata: '#2b2621', corpo: '#4a4238',
  giunto: '#221d18', ciottoloC: '#8a7f6d', ciottoloS: '#5c5346',
  acqua: '#5f8fa8',
}

export const VARIANTI_SOTTERRANEO = {
  grotta: {},                                // la roccia com'è, a lume di torcia
  miniera: {
    fondo: ['#2e2820', '#1c1813'], chiazze: ['#63563f', '#161310'],
    lastra: ['#5c5140', '#463d31'], sasso: '#7a6c52', cristallo: '#ffd76a',
    luce: '#ffd98a', fiamma: '#ffb44a', buio: 0.44,
    dettagli: [['ciottoli', 1.9], ['cristalli', 4.2], ['crepe', 3.6], ['funghi', 6]],
  },
  fogne: {
    fondo: ['#22282a', '#141819'], chiazze: ['#48585a', '#101415'],
    lastra: ['#455055', '#333c40'], muschio: '#4a7a52', fungo: '#a8c98f',
    luce: '#a8e08a', fiamma: '#6fbf5a', buio: 0.5,
    varianti: ['liscio', 'ombra', 'umidiccio', 'umidiccio', 'licheni', 'detriti'],
    dettagli: [['ciottoli', 2.6], ['muschio', 2.4], ['funghi', 4], ['crepe', 5]],
  },
  cripta: {
    fondo: ['#22242a', '#16171c'], chiazze: ['#53565e', '#141519'],
    lastra: ['#5e6169', '#474a52'], sasso: '#7a6a5c', muschio: '#4a6b4a',
    luce: '#7fe0c0', fiamma: '#35c79a', buio: 0.48,
    varianti: ['liscio', 'liscio', 'usura', 'screpolato', 'licheni', 'detriti'],
    dettagli: [['crepe', 2.3], ['ossa', 3], ['muschio', 5], ['ciottoli', 4.3]],
  },
  gola: {
    /* l'unica di quaggiù che ha il cielo sopra: il buio si dimezza e
       la luce diventa fredda, perché non viene più dal fuoco */
    fondo: ['#3a352c', '#241f1a'], chiazze: ['#6b6150', '#1c1815'],
    lastra: ['#6b6053', '#4e453a'], sasso: '#8a7d68',
    luce: '#cfe4ff', fiamma: '#8fb8e0', buio: 0.24,
    varianti: ['liscio', 'liscio', 'usura', 'detriti', 'screpolato'],
    dettagli: [['ciottoli', 2], ['crepe', 3.2], ['muschio', 6]],
  },
}

/* ── dove si appendono le torce ──
   Una ogni 260 unità di cammino, alternate ai due lati e appena fuori
   dalla strada. Il passo non è a occhio: una torcia arriva lontano
   circa 76 unità, quindi la sua pozza è larga 150 — con il passo a 150
   le pozze si toccavano e tornavano **una fascia arancione continua**
   lungo tutto il tracciato, che è il difetto peggiore possibile,
   perché senza buio in mezzo la luce non si vede più. */
function torceLungo(via, S) {
  // ...ma almeno tre, se no i tracciati corti della cripta e della gola
  // restano al buio per due terzi e non si vede più dove si cammina
  const passo = Math.min(260 * S, via.lunghezza / 3.2)
  const out = []
  for (let d = passo * 0.6, i = 0; d < via.lunghezza; d += passo, i++) {
    const a = via.puntoA(d), n = via.normaleA(d)
    const o = 27 * S * (i % 2 ? 1 : -1)
    out.push({ x: a.x + n.x * o, y: a.y + n.y * o })
  }
  return out
}

/* uno spuntone di roccia: la sagoma che dice «qui il soffitto scende» */
function spuntone(p, x, y, s, A) {
  const [c1, c2] = A.parete
  ell(p.ctx, x, y + 2 * s, 9 * s, 3 * s, '#00000030')
  masso(p.ctx, x, y - 3 * s, 8 * s, mescola(c1, c2, 0.5),
        mescola(c1, '#ffffff', 0.18), mescola(c2, '#000000', 0.3), i => ((i * 37) % 11) / 11)
  poly(p.ctx, [[x - 5 * s, y + 2 * s], [x + 5 * s, y + 2 * s], [x + 1.5 * s, y - 12 * s]],
       mescola(c1, '#ffffff', 0.1))
  poly(p.ctx, [[x - 5 * s, y + 2 * s], [x - 1 * s, y + 2 * s], [x + 1.5 * s, y - 12 * s]],
       mescola(c1, '#ffffff', 0.28))
}

/* un grappolo di cristalli: l'unica cosa chiara del sotterraneo, e
   serve proprio a quello — dà un punto dove appoggiare l'occhio */
function grappolo(p, x, y, s, A) {
  ell(p.ctx, x, y + 1.5 * s, 7 * s, 2.4 * s, '#00000028')
  for (const [dx, h, w] of [[-3, 9, 2.2], [3, 7.5, 2], [0, 13, 2.8]])
    poly(p.ctx, [[x + dx * s, y - h * s], [x + (dx + w) * s, y - h * s * 0.4],
                 [x + (dx + w * 0.5) * s, y], [x + (dx - w * 0.5) * s, y],
                 [x + (dx - w) * s, y - h * s * 0.4]], A.cristallo)
  velo(p.ctx, 0.6, () => ell(p.ctx, x, y - 6 * s, 9 * s, 7 * s, A.cristallo + '44'))
}

export const TERRENO_SOTTERRANEO = {
  nome: 'Il sotterraneo',
  via: 'acciottolato',

  fondo(p, A, { lato, reg }) {
    const { ctx, W, H } = p
    const g = ctx.createLinearGradient(0, 0, W * 0.35, H)
    g.addColorStop(0, A.fondo[0]); g.addColorStop(1, A.fondo[1])
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
    POSE[A.posa](ctx, reg, A, lato)
    variazioni(ctx, reg, A, lato, 71)
  },

  strada(p, A, { via, caso }) { acciottolato(p, via, A, caso) },

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
    for (let i = 0; i < 40; i++) {
      const x = caso() * W, y = caso() * H
      if (vicino(x, y) < 32 * S) continue
      if (postazioni.some(q => Math.hypot(q.x - x, q.y - y) < 30 * S)) continue
      roba.push({ x, y, s: (0.55 + caso() * 0.4) * S * 1.3, che: caso() })
    }
    roba.sort((a, b) => a.y - b.y)
    for (const r of roba) {
      if (r.che > 0.82) grappolo(p, r.x, r.y, r.s * 0.9, A)
      else spuntone(p, r.x, r.y, r.s, A)
    }
  },

  /* la piazzola: un lastrone spianato nella roccia, con il giro di
     schegge attorno. Chiara più del fondo, se no al buio sparisce e
     non si capisce più dove si può costruire. */
  piazzola(p, x, y, A, caso) {
    const { ctx, S } = p
    ell(ctx, x, y, 15 * S, 9.5 * S, '#00000030')
    ell(ctx, x, y - 0.6 * S, 13.5 * S, 8.2 * S, mescola(A.lastra[0], '#ffffff', 0.2))
    ell(ctx, x, y - 1.4 * S, 11 * S, 6.4 * S, mescola(A.lastra[0], '#ffffff', 0.4))
    for (let i = 0; i < 9; i++) {
      const a = i / 9 * 6.29 + caso() * 0.3
      ell(ctx, x + Math.cos(a) * 12.5 * S, y - 0.6 * S + Math.sin(a) * 7.6 * S,
          2 * S, 1.6 * S, i % 2 ? A.sasso : mescola(A.sasso, '#000000', 0.3))
    }
  },

  /* Il buio, e le torce che ci fanno il buco. `luceEBuio` ragiona in
     caselle perché nasce per le stanze del Generale: gli si passa un
     `lato` di comodo e le torce già convertite nelle sue coordinate —
     è più onesto che riscrivere il velo bucato una seconda volta. */
  /* ── il buio, e le due luci che ci fanno il buco ──

     La prima è **la via stessa**, appena accesa lungo tutto il suo
     percorso. Non è atmosfera, è una regola: le pozze delle torce sono
     poche e distanti apposta — senza buio in mezzo la luce non si vede
     — ma il tracciato dev'essere leggibile *tutto*, sempre, perché è
     l'unica informazione da cui dipende ogni decisione. Il velo di
     buio che viene dopo smorza allo stesso modo la via e la roccia
     attorno, quindi lo stacco resta.

     La seconda sono le torce, e la fa `luceEBuio`, che non stende un
     velo giallo dove sta la fiaccola ma **buca il nero**. Ragiona in
     caselle perché nasce per le stanze del Generale: gli si passa un
     `lato` di comodo e le torce già convertite nelle sue coordinate. */
  velo(p, A, { via }) {
    const { ctx, W, H, S } = p
    const prima = ctx.globalCompositeOperation
    ctx.globalCompositeOperation = 'lighter'
    velo(ctx, 0.13, () => p.linea(via.punti, A.luce, 40 * S))
    velo(ctx, 0.1, () => p.linea(via.punti, A.luce, 22 * S))
    ctx.globalCompositeOperation = prima

    const lato = 28 * S                       // `luceEBuio` ne ricava R = lato · 2,7
    const dove = torceLungo(via, S)
    const torce = dove.map(t => [(t.x - lato / 2) / lato, (t.y + 0.2 * lato) / lato - 1])
    luceEBuio(ctx, W, H, A, torce, lato)
    for (const t of dove) torciaFerma(ctx, t.x, t.y, S * 0.9, A)
  },
}
