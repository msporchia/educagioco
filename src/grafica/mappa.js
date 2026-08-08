/* ═══════════════════════════════════════════════════════════════════
   DIPINGERE UNA MAPPA

   Il momento in cui una stanza smette di essere una griglia. Qui non
   c'è nessun colore scritto a mano: i colori stanno negli ambienti
   (`ambienti/`), le tecniche nei materiali (`materiali/`), la luce in
   `luce.js`. Questo file mette in fila i passaggi, e sono sempre gli
   stessi per tutte e undici le stanze.

   E siccome il terreno non si muove, si dipinge **una volta sola** su
   una tela di scorta grande quanto la mappa, e poi si ricopia —
   esattamente come `campo()` fa per il castello.
   ═══════════════════════════════════════════════════════════════════ */
import { dado } from './comune.js'
import { POSE, MURI, DETTAGLI, semina, variazioni } from './materiali/indice.js'
import { AMBIENTI } from './ambienti/indice.js'
import { luceEBuio, chiazzeDiLuce, torciaFerma } from './luce.js'
import { dipingiMuri } from './muri.js'

export { dipingiMuri }

/* la mappa può arrivare come righe di caratteri ('#' muro, il resto
   pavimento) — è il formato del gioco — o come funzione. */
export function leggiMappa(mappa, larghezza, altezza) {
  if (typeof mappa === 'function') return { larghezza, altezza, muro: mappa }
  const righe = mappa
  return {
    larghezza: righe[0].length, altezza: righe.length,
    muro: (i, k) => righe[k] !== undefined && righe[k][i] === '#',
  }
}

export function dipingiMappa(ctx, opz) {
  const { ambiente = 'corridoio', lato = 36 } = opz
  /* di solito `ambiente` è un nome; può però arrivare già come voce di
     dati, e serve a chi vuole vedere *una* variante alla volta (la
     vetrina) senza dover inventare un ambiente finto nell'indice */
  const A = (typeof ambiente === 'object' ? ambiente : AMBIENTI[ambiente]) || AMBIENTI.corridoio
  const { larghezza, altezza, muro } = leggiMappa(opz.mappa, opz.larghezza, opz.altezza)
  const W = larghezza * lato, H = altezza * lato
  const s = lato / 20                                   // l'unità di disegno
  const reg = { x0: 0, y0: 0, x1: W, y1: H }
  const c = ctx

  /* 1 ─ il gradiente di base, che toglie la piattezza */
  const g = c.createLinearGradient(0, 0, W * 0.35, H)
  g.addColorStop(0, A.fondo[0]); g.addColorStop(1, A.fondo[1])
  c.fillStyle = g; c.fillRect(0, 0, W, H)

  /* 2 ─ la posa.

         `scoperto` è il gemello di `dentro` (più sotto): il pavimento
         si genera su tutta la mappa perché i giunti devono correre da
         un capo all'altro, ma quello che finisce sotto a un muro non
         lo vedrà mai nessuno. Le due prove insieme fanno sì che una
         mappa quasi tutta scavata costi poco muro, e una quasi tutta
         piena costi poco pavimento: qualunque stanza, il conto resta
         nell'ordine dei venti millisecondi. */
  const scoperto = (x, y, w, h) => {
    const i0 = Math.floor(x / lato), i1 = Math.floor((x + w) / lato)
    const k0 = Math.floor(y / lato), k1 = Math.floor((y + h) / lato)
    for (let k = k0; k <= k1; k++)
      for (let i = i0; i <= i1; i++) if (!muro(i, k)) return true
    return false
  }
  POSE[A.posa](c, reg, A, lato, scoperto)

  /* 3 ─ le variazioni: il fondo mosso dappertutto, e sopra le macchie
         di posa — otto celle di passo, tre o quattro modi diversi di
         stare per terra pescati dal sacchetto dell'ambiente. È il
         passaggio che fa sì che due angoli della stessa stanza non
         siano la stessa fotografia. Sta prima dei muri apposta: quello
         che finisce sotto una parete non lo vede nessuno. */
  variazioni(c, reg, A, lato)

  /* 4 ─ i dettagli, mai dentro un muro. La densità è nei dati: il
         numero è il passo della semina in celle, quindi più è piccolo
         più sono fitti. */
  const libera = (x, y) => !muro(Math.floor(x / lato), Math.floor(y / lato))
  for (const [nome, passo] of A.dettagli) {
    const fn = DETTAGLI[nome]
    if (!fn) continue
    semina(reg, lato * passo, nome.length * 7 + 5, 1, libera,
           (x, y, r) => fn(c, x, y, s, A, r))
  }

  /* 5 ─ dove sono appese le torce: una ogni sei colonne, sulla faccia
         di un muro che dà sul pavimento (là si vedono). Più fitte di
         così le pozze si toccano e tornano una fascia gialla continua:
         senza buio in mezzo, la luce non si vede. */
  const torce = []
  if (A.torce)
    for (let k = 0; k < altezza; k++)
      for (let i = 0; i < larghezza; i++)
        // `k + 1 < altezza`: una torcia sull'ultima fila illuminerebbe
        // fuori dalla mappa, e in gioco sarebbe un lume sprecato
        if (muro(i, k) && k + 1 < altezza && !muro(i, k + 1) &&
            i % 6 === 3 && dado(i, k, 800) > 0.3)
          torce.push([i, k])

  /* 6 ─ i muri */
  dipingiMuri(c, { A, lato, larghezza, altezza, muro })

  /* 7 ─ le torce vere e proprie, appese alla faccia del muro */
  for (const [i, k] of torce) torciaFerma(c, i * lato + lato / 2, (k + 1) * lato - lato * 0.34, s, A)

  /* 8 ─ il buio, e le pozze di luce che ci fanno il buco. Va per
         ultimo apposta: la luce di una torcia prende il pavimento *e*
         la faccia del muro sopra, e se il buio si stendesse prima
         schiarirebbe solo le mattonelle. */
  if (A.buio || torce.length) luceEBuio(c, W, H, A, torce, lato)

  /* 9 ─ e per il bosco, il sole che passa fra le foglie: dopo il buio,
         se no il buio se lo mangia. */
  if (A.chiazzeLuce) chiazzeDiLuce(c, reg, A, lato)

  return { larghezza: W, altezza: H }
}

/* ═══════════════════════════════════════════════════════════════════
   IL FONDALE IN CACHE

   La mappa più grande è 34×22 celle: a 36 px sono 1224×792, quattro
   schermate. Dipingerla a ogni fotogramma sarebbe assurdo, e
   dipingerla grande quanto lo schermo vorrebbe dire rifarla a ogni
   trascinata. Quindi: una tela di scorta grande quanto la **mappa**,
   dipinta una volta, e poi solo `drawImage` della parte che si vede.

   Il moltiplicatore di pixel è fermo a 2 apposta: è una texture, non
   del testo, e su un telefono a dpr 3 sarebbero 35 MB di memoria per
   una differenza che non si vede.
   ═══════════════════════════════════════════════════════════════════ */
export function creaFondale(opz) {
  const { lato = 36 } = opz
  const { larghezza, altezza } = leggiMappa(opz.mappa, opz.larghezza, opz.altezza)
  const dpr = Math.min(2, opz.dpr || (typeof window !== 'undefined' && window.devicePixelRatio) || 1)
  const W = larghezza * lato, H = altezza * lato
  const cv = document.createElement('canvas')
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr)
  const c = cv.getContext('2d')
  c.setTransform(dpr, 0, 0, dpr, 0, 0)
  const avvio = (typeof performance !== 'undefined' ? performance : Date).now()
  dipingiMappa(c, opz)
  const millisecondi = Math.round((typeof performance !== 'undefined' ? performance : Date).now() - avvio)
  return {
    canvas: cv, larghezza: W, altezza: H, millisecondi,
    memoria: Math.round(cv.width * cv.height * 4 / 1048576 * 10) / 10,   // MB
    /* la finestra che si vede adesso, ricopiata di netto */
    mostra(ctx, camX = 0, camY = 0, vw = W, vh = H) {
      ctx.drawImage(cv, camX * dpr, camY * dpr, vw * dpr, vh * dpr, 0, 0, vw, vh)
    },
  }
}

/* ═══════════════════════════════════════════════════════════════════
   DUE PITTORI PER LA TABELLA

   Servono a chi deve disegnare **una cella sola** fuori dal fondale:
   l'anteprima, un editor, un muro che crolla in corsa. La stanza vera
   non passa di qui — passa da `creaFondale`.

   Si dipinge un intorno di tre celle per tre e poi si ritaglia quella
   di mezzo: dipingere la sola cella darebbe una macchia e non un
   pavimento, perché un lastrone è largo più di una cella e un corso di
   muratura non comincia dove comincia la casella.
   ═══════════════════════════════════════════════════════════════════ */
function unaCella(p, cosa, S, chi) {
  const lato = (cosa.lato || 20) * S
  const A = AMBIENTI[cosa.ambiente] || AMBIENTI.camminamento
  const c = p.ctx
  const sp = lato * 0.34                        // lo spessore del muro, che sborda in alto
  c.save()
  c.translate(cosa.x - lato / 2, cosa.y - lato / 2)
  c.beginPath()
  c.rect(0, chi === 'muro' ? -sp : 0, lato, chi === 'muro' ? lato + sp : lato)
  c.clip()
  c.translate(-lato, -lato)                     // la cella di mezzo va dov'era la sua
  const reg = { x0: 0, y0: 0, x1: lato * 3, y1: lato * 3 }
  if (chi === 'pavimento') {
    const g = c.createLinearGradient(0, 0, lato * 3, lato * 3)
    g.addColorStop(0, A.fondo[0]); g.addColorStop(1, A.fondo[1])
    c.fillStyle = g; c.fillRect(0, 0, lato * 3, lato * 3)
    POSE[A.posa](c, reg, A, lato)
  } else {
    dipingiMuri(c, { A, lato, larghezza: 3, altezza: 3, muro: (i, k) => i === 1 && k === 1 })
  }
  c.restore()
}

export const PITTORI_TERRENO = {
  pavimento: (p, cosa, S = p.S) => unaCella(p, cosa, S, 'pavimento'),
  muro: (p, cosa, S = p.S) => unaCella(p, cosa, S, 'muro'),
}
