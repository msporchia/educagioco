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
import { dado, velo } from './comune.js'
import { POSE, MURI, DETTAGLI, semina, variazioni } from './materiali/indice.js'
import { AMBIENTI } from './ambienti/indice.js'
import { luceEBuio, chiazzeDiLuce, torciaFerma, creaLuce } from './luce.js'
import { dipingiMuri } from './muri.js'
import { tessuto } from './tessuto.js'

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

/* Dove sono appese le torce: una ogni sei colonne, sulla faccia di un
   muro che dà sul pavimento (là si vedono). Più fitte di così le pozze
   si toccano e tornano una fascia gialla continua: senza buio in
   mezzo, la luce non si vede.

   Sta fuori da `dipingiMappa` perché adesso la risposta serve due
   volte: al fondale, che ci dipinge sopra le pozze, e ai personaggi,
   che vogliono sapere se ci stanno dentro. Ed è **lo stesso conto**,
   non due che si somigliano: se domani le torce cambiassero passo, un
   orco continuerebbe ad accendersi dove il pavimento si accende. */
export function torceDi(A, larghezza, altezza, muro) {
  const torce = []
  if (!A.torce) return torce
  for (let k = 0; k < altezza; k++)
    for (let i = 0; i < larghezza; i++)
      // `k + 1 < altezza`: una torcia sull'ultima fila illuminerebbe
      // fuori dalla mappa, e in gioco sarebbe un lume sprecato
      if (muro(i, k) && k + 1 < altezza && !muro(i, k + 1) &&
          i % 6 === 3 && dado(i, k, 800) > 0.3)
        torce.push([i, k])
  return torce
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
  /* DI CHE COSA È FATTA OGNI CELLA. Il tessuto si costruisce una volta
     e serve tre volte: qui per la posa, sotto per i muri, e poi per i
     dettagli. Con un ambiente che dichiara una posa e una muratura
     sole risponde sempre quelle, e questo file passa esattamente da
     dove passava prima. */
  const T = tessuto({ larghezza, altezza, muro, A, seme: opz.seme })
  /* una passata per voce, come per i muri: la lista `suolo`
     dell'ambiente, in ordine, e ognuna sa solo dipingere il suo pezzo
     di pavimento. La firma è la stessa delle murature — `tinte` è un
     parametro esplicito, non più pescato da `A.lastra` — quindi la
     roccia viva di una cripta può avere il suo colore senza dover
     truccare la tavolozza dell'ambiente per farglielo vedere. */
  T.suolo.forEach((v, n) => {
    if (!v.dipingi) return
    v.dipingi(c, reg, A, lato, v.tinte,
      (x, y, w, h) => scoperto(x, y, w, h) &&
                      T.vinceSuolo(n, (x + w / 2) / lato, (y + h / 2) / lato, true),
      { modo: v.modo, seme: v.seme })
  })

  /* 3 ─ le variazioni: il fondo mosso dappertutto, e sopra le macchie
         di posa — otto celle di passo, tre o quattro modi diversi di
         stare per terra pescati dal sacchetto dell'ambiente. È il
         passaggio che fa sì che due angoli della stessa stanza non
         siano la stessa fotografia. Sta prima dei muri apposta: quello
         che finisce sotto una parete non lo vede nessuno. */
  variazioni(c, reg, A, lato)

  /* 4 ─ i dettagli, mai dentro un muro. La densità è nei dati: il
         numero è il passo della semina in celle, quindi più è piccolo
         più sono fitti.

         ── DUE COSE CHE MANCAVANO, E SI VEDEVANO ──
         · **il seme era costante** (`nome.length * 7 + 5`): le pozze
           di ogni stanza del gioco cadevano esattamente negli stessi
           punti relativi. Adesso ci si somma il seme della tappa, e
           due cripte non hanno più le stesse pozzanghere.
         · **cadevano ovunque**. Un dettaglio può dichiarare dove ha
           senso — `['pozze', 3.2, 'umido']` — e allora si semina solo
           lì. È lo stesso campo che decide dove il rivestimento è
           caduto, quindi le pozze stanno **sotto le lacune**, dove
           l'acqua che le ha fatte sta ancora colando. È quello che
           lega le due cose invece di lasciarle succedere nello stesso
           posto per caso. */
  const libera = (x, y) => !muro(Math.floor(x / lato), Math.floor(y / lato))
  /* `dove` è il nome di un campo della stanza — gli stessi che le
     tessiture nominano, quindi il muschio può cadere **dove cola** e
     il paramento può essere caduto per la stessa ragione. Tre forme:
       'umido'   dove quel campo è alto
       '!umido'  dove è basso
       'rotto'   dove il pavimento non è quello di fondo */
  const ammessoDa = dove => {
    if (!dove) return null
    if (dove === 'rotto')
      return (x, y) => T.suoloQui(Math.floor(x / lato), Math.floor(y / lato)) !== T.suolo[0]
    const meno = dove[0] === '!'
    const nome = meno ? dove.slice(1) : dove
    return (x, y) => (T.valore(nome, x / lato, y / lato) > 0.54) !== meno
  }
  for (const [nome, passo, dove] of A.dettagli) {
    const fn = DETTAGLI[nome]
    if (!fn) continue
    const ammesso = ammessoDa(dove)
    semina(reg, lato * passo, nome.length * 7 + 5 + T.seme, 1,
           ammesso ? (x, y) => libera(x, y) && ammesso(x, y) : libera,
           (x, y, r) => fn(c, x, y, s, A, r))
  }

  /* 5 ─ dove sono appese le torce */
  const torce = torceDi(A, larghezza, altezza, muro)

  /* 6 ─ i muri */
  dipingiMuri(c, { A, lato, larghezza, altezza, muro, tessuto: T })

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
  const { larghezza, altezza, muro } = leggiMappa(opz.mappa, opz.larghezza, opz.altezza)
  const A = (typeof opz.ambiente === 'object' ? opz.ambiente : AMBIENTI[opz.ambiente]) || AMBIENTI.corridoio
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
    canvas: cv, larghezza: W, altezza: H, millisecondi, ambiente: A,
    memoria: Math.round(cv.width * cv.height * 4 / 1048576 * 10) / 10,   // MB
    /* La luce di questa stanza, da chiedere punto per punto. Esce di
       qui e non da chi mette in scena perché è **la stessa** che il
       fondale si è appena dipinto addosso: le torce sono quelle, e
       nessuno le deve contare una seconda volta. */
    luce: creaLuce({ ambiente: A, torce: torceDi(A, larghezza, altezza, muro), lato }),
    /* La finestra che si vede adesso, ricopiata di netto.

       `scala` serve a una cosa sola, ed è il pinch: mentre due dita
       stringono, il lato della cella cambia a ogni fotogramma, e
       ridipingere la stanza a ogni fotogramma costa decine di
       millisecondi — il gesto verrebbe a scatti proprio mentre lo si
       fa. Quindi durante il gesto si continua a ricopiare **questa**
       stanza, tirata o schiacciata (`scala` = quanto è grande la cella
       adesso rispetto a quando è stata dipinta): si vede un filo
       morbida, ma segue il dito. Al rilascio chi comanda ne dipinge
       una nuova alla misura giusta e la scala torna a 1.

       Il resto del disegno — personaggi, oggetti, macchie — non passa
       di qui e resta nitido anche durante il gesto: a sfocarsi è solo
       il terreno, che è la cosa che se ne accorge di meno. */
    mostra(ctx, camX = 0, camY = 0, vw = W, vh = H, scala = 1) {
      const k = dpr / (scala || 1)
      ctx.drawImage(cv, camX * k, camY * k, vw * k, vh * k, 0, 0, vw, vh)
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
    POSE[A.posa](c, reg, A, lato, A.lastra)
  } else {
    dipingiMuri(c, { A, lato, larghezza: 3, altezza: 3, muro: (i, k) => i === 1 && k === 1 })
  }
  c.restore()
}

export const PITTORI_TERRENO = {
  pavimento: (p, cosa, S = p.S) => unaCella(p, cosa, S, 'pavimento'),
  muro: (p, cosa, S = p.S) => unaCella(p, cosa, S, 'muro'),
}
