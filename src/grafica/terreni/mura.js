/* ═══════════════════════════════════════════════════════════════════
   LE MURA — il terreno delle ultime cinque tappe

   Dentro il castello tutto è stato tagliato da qualcuno: il pavimento
   è a lastroni (`lastre` di `materiali/pietra.js`, la stessa posa dei
   corridoi del Generale), la via è lastricata di traverso con il suo
   cordolo, e quello che sta intorno alla strada non sono più alberi o
   rocce ma **roba messa lì**: casse, barili, bracieri, blocchi di
   pietra di risulta.

   È il terreno più chiaro dei tre, ed è voluto: le ultime cinque tappe
   sono anche le più affollate — quattro tipi di torre, sei tipi di
   mostro, il preavviso delle ondate — e un fondo cupo le renderebbe
   illeggibili proprio dove c'è più da leggere. Il buio qui è un velo
   sottile e basta: il dramma lo fanno i mostri, non il pavimento.

   ── le cinque tavolozze ──
   Cortile (all'aperto, luce piena), camminamento (pietra sbiancata dal
   sole), corridoio (chiuso, torce), trono (marmo e oro), bastione
   (tramonto rosso sull'ultima tappa).
   ═══════════════════════════════════════════════════════════════════ */
import { mescola, ell, rett, velo, poly } from '../comune.js'
import { POSE, DETTAGLI, semina, variazioni } from '../materiali/indice.js'
import { concio } from '../materiali/semina.js'
import { lastricato } from './vie.js'

export const MURA = {
  nome: 'Le mura',
  posa: 'lastre', via: null,
  /* il fondo sta **indietro**: fra i lastroni e i loro giunti ci deve
     essere abbastanza differenza da vedere il selciato e non tanta da
     farlo diventare un reticolo. Il contrasto forte è riservato alla
     via, che è la cosa che si deve leggere per prima. */
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
    /* il cortile è all'aperto: fra le lastre spunta l'erba, e non c'è
       un filo di buio. È anche il metro di paragone per le altre
       quattro — se una stanza chiusa sembra chiara come questa, non è
       ancora abbastanza chiusa. */
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

/* ═════ la roba del castello ═════
   Non cresce: qualcuno l'ha messa lì. Sono tre sagome sole, e il
   colpo d'occhio lo fa il fatto che siano squadrate — in mezzo al
   bosco tutto è tondo, qui tutto ha un angolo. */
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

/* il blocco di pietra di risulta: `concio` è quello che squadra i
   muri delle stanze del Generale, e qui fa un masso appoggiato */
function blocco(p, x, y, s, A) {
  ell(p.ctx, x, y + 4 * s, 8 * s, 2.8 * s, '#00000026')
  concio(p.ctx, x - 7 * s, y - 6 * s, 14 * s, 11 * s, mescola(A.lastra[0], '#ffffff', 0.1),
         i => ((i * 29) % 13) / 13, true)
}

export const TERRENO_MURA = {
  nome: 'Le mura',
  via: 'lastricato',
  /* lastre piccole: con la maglia delle stanze del Generale il
     pavimento del cortile leggeva come un muro di mattoni tirato su
     davanti alla telecamera. Un selciato guardato dall'alto ha le
     pietre corte. */
  maglia: 19,

  /* ── il selciato, posato in diagonale ──
     È l'unica stranezza di questo file, e risolve il difetto peggiore
     che abbiano avuto le Mura: con i corsi orizzontali il pavimento
     leggeva come **un muro di mattoni tirato su davanti alla
     telecamera**, non come un cortile guardato dall'alto — perché i
     corsi orizzontali sono esattamente quello che fa un muro.
     Ruotandoli di un sesto di giro la cosa sparisce di colpo, e in più
     un cortile lastricato in diagonale è quello che si vede nei
     castelli veri. La regione si allarga della diagonale del campo, se
     no gli angoli restano scoperti. */
  fondo(p, A, { lato }) {
    const { ctx, W, H } = p
    const g = ctx.createLinearGradient(0, 0, W * 0.35, H)
    g.addColorStop(0, mescola(A.fondo[0], '#ffffff', 0.1)); g.addColorStop(1, A.fondo[1])
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
    const r = Math.hypot(W, H) / 2
    const largo = { x0: -r, y0: -r, x1: r, y1: r }
    ctx.save()
    ctx.translate(W / 2, H / 2); ctx.rotate(0.52)
    POSE[A.posa](ctx, largo, A, lato)
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

  /* Meno roba che nel bosco, e apposta: le ultime tappe hanno il campo
     più pieno di mostri e di torri alte, e uno sfondo affollato le
     renderebbe illeggibili. Un cortile mezzo vuoto è un cortile. */
  sparso(p, A, { caso, vicino, postazioni }) {
    const { W, H, S } = p
    const roba = []
    for (let i = 0; i < 34; i++) {
      const x = caso() * W, y = caso() * H
      if (vicino(x, y) < 36 * S) continue
      if (postazioni.some(q => Math.hypot(q.x - x, q.y - y) < 32 * S)) continue
      // grandi quanto mezza torre: più piccole erano granelli marroni
      // sparsi sul pavimento, e non si capiva che cosa fossero
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

  /* la piazzola: una piattaforma di pietra squadrata con il bordo
     d'oro. Nel castello anche il posto dove si mette una torre è stato
     costruito da qualcuno. */
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

  /* un velo appena, e la vignettatura calda: qui il buio non serve a
     fare atmosfera, serve solo a non lasciare i bordi piatti */
  velo(p, A) {
    const { ctx, W, H } = p
    if (A.buio) velo(ctx, A.buio, () => { ctx.fillStyle = '#1a1424'; ctx.fillRect(0, 0, W, H) })
    const v = ctx.createRadialGradient(W * 0.5, H * 0.45, H * 0.3, W * 0.5, H * 0.5, H * 1.05)
    v.addColorStop(0, '#00000000'); v.addColorStop(1, '#241a2a44')
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H)
  },
}
