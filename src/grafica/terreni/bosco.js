/* ═══════════════════════════════════════════════════════════════════
   IL BOSCO — il terreno delle prime cinque tappe

   Prato, sottobosco e alberi, con il sole che passa fra le foglie. Il
   terreno non è disegnato qui riga per riga: la posa la fa `erba` di
   `materiali/verde.js`, il fondo mosso `variazioni`, i ciuffi e i
   fiori i `DETTAGLI` — gli stessi che dipingono le stanze del
   Generale. Qui dentro c'è quello che il campo del castello ha in più
   di una stanza a caselle: **alberi veri**, messi uno a uno lontano
   dalla strada e dalle piazzole, e ordinati per profondità.

   ── le cinque tavolozze ──
   Il bosco si fa più cupo tappa dopo tappa: si entra a mezzogiorno e
   si arriva alla radice che è quasi sera. È la stessa identica
   funzione di disegno, cambiano solo i colori e la forza della luce a
   chiazze — che è quanto basta perché cinque tappe di fila non
   sembrino la stessa schermata.
   ═══════════════════════════════════════════════════════════════════ */
import { mescola, rett, ell, velo } from '../comune.js'
import { POSE, DETTAGLI, semina, variazioni } from '../materiali/indice.js'
import { chiazzeDiLuce } from '../luce.js'
import { battuto } from './vie.js'

/* ── la tavolozza di base ──
   Le chiavi sono quelle degli ambienti del Generale apposta: così
   `POSE`, `DETTAGLI` e `variazioni` funzionano senza un adattatore in
   mezzo, ed è tutto il senso di aver messo i materiali fuori dalle
   stanze. `via` invece è nostro: una stanza a caselle non ha una
   strada che la attraversa. */
export const BOSCO = {
  nome: 'Il bosco',
  posa: 'erba', via: null,                  // riempita qui sotto
  fondo: ['#8ccd76', '#63b05c'],
  chiazze: ['#a3dd8a', '#4f9c53'],
  lastra: ['#8ccd76', '#63b05c'],
  terra: '#a8814f', sasso: '#a49a86', muschio: '#4f8f3f',
  erbaC: '#a8e08a', erbaS: '#4f9c53',
  giunto: '#3d6b3a', fungo: '#c9a04a',
  chioma: ['#3f9155', '#2a6a3e'], tronco: '#7a5433',
  luce: '#fff6dc', buio: 0, chiazzeLuce: 0.3,
  varianti: ['liscio', 'liscio', 'usura', 'licheni', 'detriti'],
  dettagli: [['ciuffi', 0.9], ['fiori', 2.6], ['foglie', 3.2], ['funghi', 6]],
}
BOSCO.via = {
  scarpata: '#8a6742', corpo: '#a5814f', battuto: '#d9bb8c',
  ghiaiaC: '#f0dcb8', ghiaiaS: '#b4884f',
  ciottoloC: '#c9bda8', ciottoloS: '#a99c86', ciottoloOmbra: '#6f5a45',
}

/* ── le cinque ore del bosco ──
   Ogni variante è la tavolozza di base con qualche tinta spostata.
   Scriverle per differenza invece che per intero è il motivo per cui
   si può aggiungere un'ora del giorno senza rileggere tutto. */
export const VARIANTI_BOSCO = {
  'bosco-chiaro': {},                       // mezzogiorno: il bosco com'è
  'bosco-guado': {
    fondo: ['#7fc47a', '#519c68'], chiazze: ['#96d99a', '#3f8a63'],
    erbaC: '#9adf9e', erbaS: '#468f66', muschio: '#3f8f6a',
    chioma: ['#3a8f66', '#256a4c'], chiazzeLuce: 0.26,
    dettagli: [['ciuffi', 0.9], ['fiori', 3.4], ['muschio', 2.8], ['foglie', 3.6]],
  },
  'bosco-radura': {
    fondo: ['#9ad681', '#6fb85f'], chiazze: ['#b6e79a', '#589f52'],
    erbaC: '#bbe996', chiazzeLuce: 0.42,     // la radura è il posto più chiaro
    dettagli: [['ciuffi', 0.7], ['fiori', 1.9], ['foglie', 3.2]],
  },
  'bosco-fitto': {
    fondo: ['#5f9a5c', '#3d7145'], chiazze: ['#74ad68', '#2f5c3a'],
    erbaC: '#7fbb6c', erbaS: '#3a7040', muschio: '#3a7a44', terra: '#7a5f3c',
    chioma: ['#2f7a49', '#1c4e30'], chiazzeLuce: 0.18,
    via: { scarpata: '#6b4f31', corpo: '#8a6a3f', battuto: '#bfa276',
           ghiaiaC: '#d8c39c', ghiaiaS: '#96703f',
           ciottoloC: '#ab9f8b', ciottoloS: '#8b8070', ciottoloOmbra: '#584634' },
    dettagli: [['ciuffi', 1.1], ['funghi', 3.4], ['foglie', 2.6], ['muschio', 4]],
  },
  'bosco-notte': {
    fondo: ['#48765a', '#2c4e43'], chiazze: ['#5a8d67', '#223d38'],
    erbaC: '#679c73', erbaS: '#2f5546', muschio: '#356b52', terra: '#5f4a33',
    chioma: ['#2a6247', '#16382c'], tronco: '#5a3f28',
    luce: '#cfe0ff', buio: 0.18, chiazzeLuce: 0.12,
    via: { scarpata: '#4e3a28', corpo: '#6b5232', battuto: '#9a8460',
           ghiaiaC: '#b09a76', ghiaiaS: '#7a5c36',
           ciottoloC: '#8d8474', ciottoloS: '#6f6759', ciottoloOmbra: '#3f3225' },
    varianti: ['liscio', 'liscio', 'ombra', 'licheni', 'umidiccio'],
    dettagli: [['ciuffi', 1.2], ['funghi', 3.2], ['foglie', 3], ['muschio', 3.6]],
  },
}

/* ── la palude ──
   Cinque tavolozze in più sullo stesso terreno: un bosco allagato non
   ha bisogno di un'altra tecnica per dipingersi, ha bisogno di altri
   colori. Verde che vira al marcio, acqua ferma sotto l'erba, e le vie
   che diventano passerelle di legno bagnato. La luce cala di tappa in
   tappa: si comincia all'alba e si finisce col fuoco delle torce. */
export const VARIANTI_PALUDE = {
  'palude-alba': {
    fondo: ['#7ba876', '#4e7a5f'], chiazze: ['#8fc084', '#3f6a56'],
    erbaC: '#9ac98a', erbaS: '#3f7a58', muschio: '#41866a', terra: '#7b6a45',
    chioma: ['#3c8060', '#245844'], tronco: '#6b563a',
    luce: '#ffe9c4', buio: 0.06, chiazzeLuce: 0.24,
    via: { scarpata: '#5d4a30', corpo: '#7d6743', battuto: '#a89272',
           ghiaiaC: '#c4ab84', ghiaiaS: '#7f6440',
           ciottoloC: '#9d9483', ciottoloS: '#7d7466', ciottoloOmbra: '#4b3d2c' },
    dettagli: [['ciuffi', 0.8], ['muschio', 2.2], ['funghi', 4], ['foglie', 3.4]],
  },
  'palude-verde': {
    fondo: ['#6f9c6c', '#3f6b52'], chiazze: ['#84b47a', '#33604a'],
    erbaC: '#8cbd7c', erbaS: '#356b4d', muschio: '#387a5e', terra: '#6d5f3e',
    chioma: ['#2f7355', '#1c4c3a'], tronco: '#5f4c33',
    luce: '#e8f0cf', buio: 0.1, chiazzeLuce: 0.18,
    dettagli: [['ciuffi', 1], ['muschio', 1.8], ['funghi', 3.2], ['foglie', 3.8]],
  },
  'palude-stagno': {
    fondo: ['#5f8f74', '#33604f'], chiazze: ['#74a882', '#2a5545'],
    erbaC: '#7db589', erbaS: '#2e6249', muschio: '#2f7a63', terra: '#5e5439',
    chioma: ['#2a6a52', '#173f31'], tronco: '#55442e',
    luce: '#d5e8dd', buio: 0.14, chiazzeLuce: 0.14,
    dettagli: [['ciuffi', 1.2], ['muschio', 1.4], ['funghi', 2.6], ['foglie', 4.2]],
  },
  'palude-marcio': {
    fondo: ['#57795f', '#325247'], chiazze: ['#6a9068', '#28463c'],
    erbaC: '#6f9c72', erbaS: '#2c5442', muschio: '#356b58', terra: '#544b34',
    chioma: ['#265c47', '#14372b'], tronco: '#4d3e2a',
    luce: '#cfe0d6', buio: 0.2, chiazzeLuce: 0.1,
    via: { scarpata: '#463726', corpo: '#5f4e33', battuto: '#8a7554',
           ghiaiaC: '#a68f6c', ghiaiaS: '#6b5637',
           ciottoloC: '#877e6e', ciottoloS: '#6a6255', ciottoloOmbra: '#3a2f22' },
    dettagli: [['ciuffi', 1.4], ['muschio', 1.2], ['funghi', 2.2], ['foglie', 4.6]],
  },
  'palude-torce': {
    fondo: ['#456354', '#26413a'], chiazze: ['#547260', '#1e352f'],
    erbaC: '#5c8168', erbaS: '#264639', muschio: '#2c5c4c', terra: '#463e2c',
    chioma: ['#1f4c3b', '#102b22'], tronco: '#3f3324',
    luce: '#ffca7a', buio: 0.3, chiazzeLuce: 0.08,
    via: { scarpata: '#3b2e20', corpo: '#50412b', battuto: '#75634a',
           ghiaiaC: '#8d7a5c', ghiaiaS: '#584730',
           ciottoloC: '#726b5d', ciottoloS: '#585245', ciottoloOmbra: '#2f271c' },
    dettagli: [['ciuffi', 1.6], ['muschio', 1.1], ['funghi', 1.8], ['foglie', 5]],
  },
}

/* ═════ le figure che stanno in piedi ═════
   Un albero visto dall'alto è chioma, e la chioma è un grappolo di
   ellissi con il lume in cima: il tronco si indovina appena. Sono le
   uniche figure disegnate a mano di questo file — tutto il resto è
   materiale preso in prestito. */
function albero(p, x, y, s, A) {
  const [c1, c2] = A.chioma
  ell(p.ctx, x, y + 2 * s, 9 * s, 3.4 * s, '#00000025')
  rett(p.ctx, x - 1.6 * s, y - 6 * s, 3.2 * s, 7 * s, A.tronco)
  const chiome = [[0, -13, 9], [-6, -9, 7], [6, -9.5, 7],
                  [0, -19, 6.6], [-4, -16, 5.6], [4, -16.5, 5.6]]
  for (const [dx, dy, r] of chiome) ell(p.ctx, x + dx * s, y + dy * s, r * s, r * s * 0.92, c2)
  for (const [dx, dy, r] of chiome)
    ell(p.ctx, x + dx * s - r * s * 0.22, y + dy * s - r * s * 0.26,
        r * s * 0.62, r * s * 0.55, c1)
  ell(p.ctx, x - 3 * s, y - 20 * s, 3 * s, 2.4 * s, mescola(c1, '#ffffff', 0.3))
}

function cespuglio(p, x, y, s, A) {
  const [c1, c2] = A.chioma
  ell(p.ctx, x, y + 2 * s, 8 * s, 2.6 * s, '#00000020')
  ell(p.ctx, x - 3 * s, y, 4.4 * s, 4 * s, c2)
  ell(p.ctx, x + 3 * s, y, 4.6 * s, 4.2 * s, c2)
  ell(p.ctx, x, y - 2 * s, 5.2 * s, 4.6 * s, mescola(c1, c2, 0.4))
  ell(p.ctx, x - s, y - 3 * s, 3 * s, 2.4 * s, mescola(c1, '#ffffff', 0.2))
}

function sasso(p, x, y, s, A) {
  ell(p.ctx, x, y + 2 * s, 7 * s, 2.6 * s, '#00000022')
  ell(p.ctx, x, y, 6 * s, 4.4 * s, A.sasso)
  ell(p.ctx, x - 1.4 * s, y - 1.2 * s, 3.6 * s, 2.4 * s, mescola(A.sasso, '#ffffff', 0.35))
}

/* ═════ il terreno ═════ */
export const TERRENO_BOSCO = {
  nome: 'Il bosco',
  via: 'battuto',

  fondo(p, A, { lato, reg }) {
    const { ctx, W, H } = p
    const g = ctx.createLinearGradient(0, 0, W * 0.3, H)
    g.addColorStop(0, mescola(A.fondo[0], '#ffffff', 0.12))
    g.addColorStop(0.5, A.fondo[0]); g.addColorStop(1, A.fondo[1])
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
    POSE[A.posa](ctx, reg, A, lato, A.lastra)
    variazioni(ctx, reg, A, lato, 71)
  },

  strada(p, A, { via, caso }) { battuto(p, via, A, caso) },

  /* i dettagli minuti vanno **dopo** la strada e mai sopra: un fiore in
     mezzo al passaggio dice che lì nessuno cammina, ed è il contrario
     di quello che il tracciato deve raccontare */
  minuti(p, A, { lato, reg, vicino }) {
    const s = lato / 20, S = p.S
    const libera = (x, y) => vicino(x, y) > 20 * S
    for (const [nome, passo] of A.dettagli) {
      const fn = DETTAGLI[nome]
      if (fn) semina(reg, lato * passo, nome.length * 7 + 5, 1, libera,
                     (x, y, r) => fn(p.ctx, x, y, s, A, r))
    }
  },

  /* Alberi, cespugli e sassi: mai sulla strada, mai su una piazzola, e
     dipinti dal fondo verso il davanti perché chi sta più in basso
     copra chi sta dietro. È l'unica cosa di questo file che una mappa
     a caselle non saprebbe fare. */
  sparso(p, A, { caso, vicino, postazioni }) {
    const { W, H, S } = p
    const roba = []
    /* si tirano novanta posti e si tengono quelli che restano: sui
       tracciati a pettine — il sentiero, il folto — la strada occupa
       mezzo campo e con cinquanta tentativi il bosco veniva spelato
       proprio nelle tappe che dovrebbero essere le più fitte */
    for (let i = 0; i < 90; i++) {
      const x = caso() * W, y = caso() * H
      if (vicino(x, y) < 34 * S) continue
      if (postazioni.some(q => Math.hypot(q.x - x, q.y - y) < 30 * S)) continue
      roba.push({ x, y, s: (0.55 + caso() * 0.4) * S * 1.3, che: caso() })
    }
    roba.sort((a, b) => a.y - b.y)
    for (const r of roba) {
      if (r.che > 0.74) sasso(p, r.x, r.y, r.s * 0.85, A)
      else if (r.che > 0.52) cespuglio(p, r.x, r.y, r.s, A)
      else albero(p, r.x, r.y, r.s, A)
    }
  },

  /* la piazzola: terra spianata con un giro di sassi. Resta sotto la
     torre quando ci si costruisce sopra, e ferma non chiede niente. */
  piazzola(p, x, y, A, caso) {
    const { ctx, S } = p
    ell(ctx, x, y, 15 * S, 9.5 * S, '#00000018')
    ell(ctx, x, y - 0.6 * S, 13.5 * S, 8.2 * S, mescola(A.terra, '#ffffff', 0.35))
    ell(ctx, x, y - 1.4 * S, 11 * S, 6.4 * S, mescola(A.terra, '#ffffff', 0.55))
    for (let i = 0; i < 9; i++) {
      const a = i / 9 * 6.29 + caso() * 0.3
      ell(ctx, x + Math.cos(a) * 12.5 * S, y - 0.6 * S + Math.sin(a) * 7.6 * S,
          1.9 * S, 1.5 * S, i % 2 ? A.sasso : mescola(A.sasso, '#000000', 0.25))
    }
  },

  /* il sole fra le foglie, e nella tappa notturna un velo di sera. Va
     per ultimo: se il buio si stendesse dopo, se le mangerebbe. */
  velo(p, A, { lato, reg }) {
    const { ctx, W, H } = p
    if (A.buio) velo(ctx, A.buio, () => { ctx.fillStyle = '#141c2e'; ctx.fillRect(0, 0, W, H) })
    if (A.chiazzeLuce) chiazzeDiLuce(ctx, reg, A, lato)
    const v = ctx.createRadialGradient(W * 0.5, H * 0.45, H * 0.28, W * 0.5, H * 0.5, H * 1.05)
    v.addColorStop(0, '#00000000'); v.addColorStop(1, '#1c3a1a3a')
    ctx.fillStyle = v; ctx.fillRect(0, 0, W, H)
  },
}
