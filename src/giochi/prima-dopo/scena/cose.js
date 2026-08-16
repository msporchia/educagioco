/* ═══════════════════════════════════════════════════════════════════
   LE COSE — quello che sta in scena insieme alle persone

   Il patto è quello dei quiz (`quiz/grafica/riquadro.js`): si dipinge
   sempre dentro un quadrato di 100×100, con l'origine in alto a
   sinistra, e nessuno qui dentro sa quanto sarà grande davvero. Il
   pavimento sta a `SUOLO` (`scena/luoghi.js`), ed è l'unica misura che
   luoghi, cose e persone devono avere in comune: chi appoggia qualcosa
   per terra la mette lì.

   Ogni cosa è una funzione `(p, c)` dove `c` porta almeno `x` e `y`, e
   disegna con quelle come punto d'appoggio — che per quasi tutte è il
   punto dove tocca terra. Chi ha bisogno di variare porta i suoi campi
   (`s`, `w`, `r`, `vola`, `davanti`), e chi non li scrive vede quello
   che vedeva prima.

   ── LA REGOLA CHE VALE PIÙ DI TUTTE ──
   Una cosa che a settanta pixel non si riconosce **non va aggiunta**:
   va cambiata la storia. È la stessa trappola delle emoji vista dall'altra
   parte — lì si accettava il disegno sbagliato perché era l'unico
   disponibile, qui si accetterebbe il disegno illeggibile perché è
   quello che serviva.
   ═══════════════════════════════════════════════════════════════════ */
import { capsula, poligono, tondo, mescola } from '../../../grafica/comune.js'
import { LATO, SUOLO, LUOGHI } from './luoghi.js'

const BORDO = '#2a2036'

/* ═══════════ LE COSE ═══════════
   Ognuna è una funzione `(p, c)` dove `c` porta almeno `x` e `y`, e
   disegna con quelle come punto d'appoggio — che per quasi tutte è il
   punto dove toccano terra. */

const cose = {
  sole(p, c) {
    p.cerchio(c.x, c.y, 9, '#ffd84d')
    p.velo(0.5, q => q.cerchio(c.x, c.y, 13, '#ffe98a'))
  },

  nuvola(p, c) {
    p.ellisse(c.x, c.y, 10, 5, '#ffffff')
    p.ellisse(c.x - 7, c.y + 2, 6, 4, '#ffffff')
    p.ellisse(c.x + 7, c.y + 2, 7, 4, '#ffffff')
  },

  cespuglio(p, c) {
    const s = c.s || 1
    p.ellisse(c.x, c.y - 4 * s, 9 * s, 7 * s, '#4f9e42')
    p.ellisse(c.x - 6 * s, c.y - 2 * s, 6 * s, 5 * s, '#5cb04d')
    p.ellisse(c.x + 6 * s, c.y - 2 * s, 6 * s, 5 * s, '#5cb04d')
  },

  /* la palla: la riga bianca che la gira è quello che la distingue da un
     cerchio colorato qualunque */
  palla(p, c) {
    const r = c.r || 6
    p.cerchio(c.x, c.y, r, '#e8503a')
    p.velo(0.9, q => q.ellisse(c.x, c.y - r * 0.15, r * 0.95, r * 0.3, '#ffffff'))
    p.cerchio(c.x - r * 0.35, c.y - r * 0.4, r * 0.22, '#ffffffcc')
    if (c.vola) {                                    // la scia di chi l'ha appena tirata
      p.velo(0.5, q => {
        for (let i = 1; i <= 3; i++)
          q.linea([{ x: c.x - 8 - i * 7, y: c.y + i * 2 }, { x: c.x - 2 - i * 7, y: c.y + i * 2 }], '#ffffff', 1.6)
      })
    }
  },

  /* il sasso dell'inciampo: piccolo apposta. Grande quanto un masso
     racconterebbe un'altra storia — che non guardava dove andava */
  sasso(p, c) {
    const s = c.s || 1
    poligono(p, [[c.x - 4 * s, c.y], [c.x - 3 * s, c.y - 3 * s], [c.x + 1 * s, c.y - 4 * s],
                 [c.x + 4 * s, c.y - 1 * s], [c.x + 3.4 * s, c.y]], '#9a9aa8', BORDO, 0.8)
    p.ellisse(c.x, c.y + 0.6, 5 * s, 1.4 * s, '#00000022')
  },

  /* i trattini della corsa. Sembra poco, ed è invece quello che tiene
     separate la prima e la seconda vignetta della storia: senza, «corre»
     e «sta cadendo» erano la stessa bambina di profilo, inclinata di
     poco più o di poco meno — e nella striscia si confondevano */
  corsa(p, c) {
    p.velo(0.55, q => {
      for (const [dy, lun] of [[-8, 11], [0, 15], [8, 9]])
        q.linea([{ x: c.x - lun, y: c.y + dy }, { x: c.x, y: c.y + dy }], '#ffffff', 2.2)
    })
  },

  tavolino(p, c) {
    const w = c.w || 20
    p.rett(c.x - w / 2, c.y - 16, w, 3.4, '#a8834f')
    p.rett(c.x - w * 0.34, c.y - 13, 3, 13, '#8c6a3d')
    p.rett(c.x + w * 0.34 - 3, c.y - 13, 3, 13, '#8c6a3d')
  },

  vaso(p, c) {
    const s = c.s || 1
    poligono(p, [[c.x - 5 * s, c.y - 14 * s], [c.x + 5 * s, c.y - 14 * s],
                 [c.x + 3.4 * s, c.y - 9 * s], [c.x + 4.6 * s, c.y - 3 * s],
                 [c.x, c.y], [c.x - 4.6 * s, c.y - 3 * s], [c.x - 3.4 * s, c.y - 9 * s]],
             '#5fa8d3', BORDO, 0.9)
    p.ellisse(c.x, c.y - 14 * s, 5 * s, 1.6 * s, '#8ecbe8')
    // due fiori, perché un vaso vuoto e un bicchiere si somigliano troppo
    for (const v of [-1, 1]) {
      p.linea([{ x: c.x, y: c.y - 14 * s }, { x: c.x + v * 4 * s, y: c.y - 22 * s }], '#4f9e42', 1.4)
      p.cerchio(c.x + v * 4 * s, c.y - 23 * s, 2.6 * s, v < 0 ? '#f2c94c' : '#ff9db1')
    }
  },

  /* il vaso rotto: i cocci per terra, l'acqua sparsa e i tre trattini
     dello schianto. Senza i trattini è «un vaso strano», con i trattini
     è successo qualcosa. */
  cocci(p, c) {
    p.velo(0.55, q => q.ellisse(c.x, c.y, 17, 4.5, '#8fc6de'))
    const pezzi = [[-11, -1, -6, -7, -2, 0], [-1, -1, 3, -9, 7, -1], [8, -1, 13, -6, 16, 0]]
    for (const [x1, y1, x2, y2, x3, y3] of pezzi)
      poligono(p, [[c.x + x1, c.y + y1], [c.x + x2, c.y + y2], [c.x + x3, c.y + y3]],
               '#5fa8d3', BORDO, 0.8)
    for (const [dx, dy] of [[-14, -14], [0, -19], [14, -14]])
      p.linea([{ x: c.x + dx * 0.6, y: c.y + dy * 0.6 }, { x: c.x + dx, y: c.y + dy }], '#f2c94c', 2)
    // i due fiori finiti per terra
    p.cerchio(c.x - 15, c.y - 3, 2.4, '#f2c94c')
    p.cerchio(c.x + 15, c.y - 4, 2.4, '#ff9db1')
  },

  pozzanghera(p, c) {
    const w = c.w || 26
    /* `davanti: true` la mette sopra a chi ci sta dentro, con un velo:
       è il modo più corto di dire «ci ha i piedi dentro» invece di «ce
       l'ha dietro» */
    p.velo(c.davanti ? 0.75 : 1, q => {
      q.ellisse(c.x, c.y, w, w * 0.28, '#7a5c3a')
      q.ellisse(c.x, c.y - 0.6, w * 0.78, w * 0.19, '#5e4630')
      q.velo(0.35, r => r.ellisse(c.x - w * 0.2, c.y - 1, w * 0.3, w * 0.07, '#cfe4ea'))
    })
  },

  /* gli schizzi di fango addosso: si mettono dopo la persona, e sono il
     modo di dire «sporco» senza sporcare il disegno */
  schizzi(p, c) {
    const punti = [[-5, -13], [4, -10], [-2, -21], [7, -18], [-7, -5], [5, -3],
                   [0, -27], [-6, -30], [6, -32], [-3, -37], [4, -39], [-8, -22],
                   [8, -25], [1, -16]]
    for (const [dx, dy] of punti)
      p.ellisse(c.x + dx, c.y + dy, 2.3, 1.9, '#5e4630')
  },

  doccia(p, c) {
    const x = c.x
    p.rett(x - 1.6, 6, 3.2, 12, '#9fb3bd')                     // il tubo
    capsula(p, x, 18, 7, 2.6, 2.4, '#c8d8e0', BORDO, 0.9)      // il soffione
    // il getto: righe verticali che sfumano, e qualche goccia
    p.velo(0.55, q => {
      for (let i = -3; i <= 3; i++)
        q.linea([{ x: x + i * 3.2, y: 22 }, { x: x + i * 4.2, y: 62 }], '#8fd3ea', 1.8)
    })
    for (const [dx, dy] of [[-9, 40], [7, 52], [-4, 60], [11, 34]])
      p.cerchio(x + dx, dy, 1.3, '#bfe8f5')
  },

  schiuma(p, c) {
    const y = c.y
    for (const [dx, dy, r] of [[-6, 0, 5], [4, -3, 6], [0, 4, 4.5], [8, 4, 4], [-9, 5, 3.5]])
      p.cerchio(c.x + dx, y + dy, r, '#ffffff')
    p.velo(0.7, q => {
      for (const [dx, dy, r] of [[-4, -2, 2], [6, -4, 2.2]])
        q.cerchio(c.x + dx, y + dy, r, '#dff2f8')
    })
  },

  asciugamano(p, c) {
    const y = c.y - 34                                    // l'altezza del piolo
    p.rett(c.x - 10, y - 2, 20, 2.2, '#9fb3bd')           // il piolo
    capsula(p, c.x, y + 10, 7, 10, 2.6, '#ffd07a', BORDO, 0.9)
    p.rett(c.x - 7, y + 8, 14, 2.6, '#f2a94c')
  },

  /* la paletta e la scopa: si raccoglie insieme quello che si è rotto */
  paletta(p, c) {
    poligono(p, [[c.x - 8, c.y], [c.x + 8, c.y], [c.x + 6, c.y - 6], [c.x - 6, c.y - 6]],
             '#5fa8d3', BORDO, 0.9)
    p.linea([{ x: c.x + 6, y: c.y - 5 }, { x: c.x + 16, y: c.y - 18 }], '#a8834f', 2.4)
  },

  /* il cuore di chi si fa consolare: l'unico segno non letterale di
     tutto il cassetto, e ci sta perché a quattro anni «vuol bene» non
     ha un disegno che non sia questo */
  cuore(p, c) {
    const s = c.s || 1
    p.velo(c.velo || 1, q => {
      q.cerchio(c.x - 2.4 * s, c.y - 2 * s, 3 * s, '#ff6b8a')
      q.cerchio(c.x + 2.4 * s, c.y - 2 * s, 3 * s, '#ff6b8a')
      poligono(q, [[c.x - 5.2 * s, c.y - 0.6 * s], [c.x + 5.2 * s, c.y - 0.6 * s], [c.x, c.y + 6 * s]],
               '#ff6b8a')
    })
  },

  /* ── LA CAMERA E LA TAVOLA ── */

  /* il letto visto di lato. Chi ci dorme dentro non è una persona del
     cassetto: è un cuscino, una coperta e una testa che spunta, perché
     `corpo.js` sa disegnare chi sta in piedi e chi è a terra, non chi è
     sotto le lenzuola — e piegarlo per una posa sola sarebbe stato un
     pittore nuovo per tre vignette. */
  letto(p, c) {
    const w = c.w || 30
    p.rett(c.x - w, c.y - 6, w * 2, 6, '#a8834f')                       // la base
    p.rett(c.x - w, c.y - 4, 3.4, 4, '#8c6a3d')
    capsula(p, c.x - w * 0.62, c.y - 20, w * 0.32, 8, 3, '#b08b5e', BORDO, 0.9)  // la testiera
    capsula(p, c.x + w * 0.2, c.y - 11, w * 0.8, 5, 2.4, '#7fb3d9', BORDO, 0.9)  // la coperta
    capsula(p, c.x - w * 0.42, c.y - 13, w * 0.24, 4, 2.4, '#ffffff', BORDO, 0.8) // il cuscino
    if (c.dorme) {
      tondo(p, c.x - w * 0.42, c.y - 17, 5.4, 5, '#f6d9bb', BORDO, 0.9)  // la testa
      poligono(p, [[c.x - w * 0.42 - 5, c.y - 19], [c.x - w * 0.42, c.y - 22.5],
                   [c.x - w * 0.42 + 5, c.y - 19], [c.x - w * 0.42 + 4, c.y - 20.5],
                   [c.x - w * 0.42 - 4, c.y - 20.5]], c.capelli || '#3f2c1e', BORDO, 0.8)
      p.ctx.strokeStyle = '#3a2a1a'; p.ctx.lineWidth = 0.7; p.ctx.lineCap = 'round'
      for (const v of [-1, 1]) {
        p.ctx.beginPath()
        p.ctx.moveTo(c.x - w * 0.42 + v * 2 - 1.1, c.y - 16.6)
        p.ctx.lineTo(c.x - w * 0.42 + v * 2 + 1.1, c.y - 16.6)
        p.ctx.stroke()
      }
    }
  },

  /* le zeta di chi dorme. Sono un simbolo e non una cosa, ma è un
     simbolo che i bambini conoscono prima di saper leggere — la stessa
     licenza che si è presa il cuore. */
  zeta(p, c) {
    const s = c.s || 1
    p.ctx.strokeStyle = '#5b6b8c'; p.ctx.lineWidth = 1.4 * s; p.ctx.lineJoin = 'round'
    for (const [i, [dx, dy, k]] of [[0, 0, 1], [7, -7, 0.75], [12, -13, 0.55]].entries()) {
      void i
      const x = c.x + dx * s, y = c.y + dy * s, l = 5 * s * k
      p.ctx.beginPath()
      p.ctx.moveTo(x - l / 2, y - l / 2); p.ctx.lineTo(x + l / 2, y - l / 2)
      p.ctx.lineTo(x - l / 2, y + l / 2); p.ctx.lineTo(x + l / 2, y + l / 2)
      p.ctx.stroke()
    }
  },

  sveglia(p, c) {
    const s = c.s || 1
    tondo(p, c.x, c.y - 5 * s, 5 * s, 5 * s, '#ff9db1', BORDO, 0.9)
    tondo(p, c.x, c.y - 5 * s, 3.6 * s, 3.6 * s, '#fff6e8')
    for (const v of [-1, 1]) tondo(p, c.x + v * 4.4 * s, c.y - 9.4 * s, 1.7 * s, 1.7 * s, '#ff9db1', BORDO, 0.8)
    p.linea([{ x: c.x, y: c.y - 5 * s }, { x: c.x, y: c.y - 7.6 * s }], '#3a2a1a', 0.9 * s)
    p.linea([{ x: c.x, y: c.y - 5 * s }, { x: c.x + 2.4 * s, y: c.y - 4 * s }], '#3a2a1a', 0.9 * s)
    p.rett(c.x - 4 * s, c.y - 1.2 * s, 8 * s, 1.4 * s, '#d97a91')
    if (c.suona) {                                  // le due strisce del trillo
      p.velo(0.7, q => {
        for (const v of [-1, 1]) for (let i = 1; i <= 2; i++)
          q.linea([{ x: c.x + v * (6 + i * 3) * s, y: c.y - (10 + i * 2) * s },
                   { x: c.x + v * (8 + i * 3) * s, y: c.y - (12 + i * 2) * s }], '#f2c94c', 1.5 * s)
      })
    }
  },

  /* la tavola: il piano, una gamba, e sopra quello che ci si mangia.
     `piatto` cambia solo il contenuto — la ciotola della colazione, il
     piatto della cena — perché un tavolo apparecchiato in due modi è la
     stessa cosa vista in due momenti, non due mobili. */
  tavola(p, c) {
    const w = c.w || 26
    p.rett(c.x - w, c.y - 18, w * 2, 4, '#c9a97f')
    p.rett(c.x - w * 0.72, c.y - 14, 4, 14, '#a8834f')
    p.rett(c.x + w * 0.72 - 4, c.y - 14, 4, 14, '#a8834f')
    if (c.piatto === 'ciotola') {
      capsula(p, c.x, c.y - 21, 6, 3, 2.6, '#ffffff', BORDO, 0.9)
      p.ellisse(c.x, c.y - 23, 5.6, 1.6, '#e8b06a')
      p.linea([{ x: c.x + 4, y: c.y - 23 }, { x: c.x + 8, y: c.y - 30 }], '#c8d8e0', 1.6)
    } else if (c.piatto === 'cena') {
      p.ellisse(c.x, c.y - 20, 7.5, 2.4, '#ffffff')
      p.ellisse(c.x, c.y - 20.6, 5, 1.5, '#e8503a')
      p.linea([{ x: c.x - 10, y: c.y - 22 }, { x: c.x - 10, y: c.y - 18 }], '#c8d8e0', 1.4)
    }
  },

  zaino(p, c) {
    const s = c.s || 1
    capsula(p, c.x, c.y, 5 * s, 6.5 * s, 2.4 * s, '#e8503a', BORDO, 0.9)
    p.rett(c.x - 4.4 * s, c.y + 1 * s, 8.8 * s, 2 * s, '#b83b2a')
    tondo(p, c.x, c.y + 2 * s, 1.1 * s, 1.1 * s, '#f2c94c')
  },

  /* il libro aperto, visto di tre quarti: due pagine che si alzano dalla
     costa. Disegnato piatto era un'asse bianca in mezzo a due persone —
     un libro si riconosce dalla **piega**, non dal rettangolo. */
  libro(p, c) {
    const s = c.s || 1
    for (const v of [-1, 1]) {
      poligono(p, [[c.x, c.y], [c.x + v * 6.5 * s, c.y - 2.6 * s],
                   [c.x + v * 6.5 * s, c.y + 2.2 * s], [c.x, c.y + 4 * s]],
               v < 0 ? '#fff6e8' : '#f2e6d2', BORDO, 0.9)
      for (const q of [0.9, 1.9])
        p.linea([{ x: c.x + v * 1.6 * s, y: c.y + q * s },
                 { x: c.x + v * 5.4 * s, y: c.y + (q - 1.4) * s }], '#c9b79a', 0.6 * s)
    }
    p.linea([{ x: c.x, y: c.y }, { x: c.x, y: c.y + 4 * s }], '#8c6a3d', 1.2 * s)
    // la copertina che spunta sotto: è quello che lo tiene insieme
    poligono(p, [[c.x - 6.8 * s, c.y + 2.4 * s], [c.x, c.y + 4.2 * s],
                 [c.x + 6.8 * s, c.y + 2.4 * s], [c.x + 6.8 * s, c.y + 3.6 * s],
                 [c.x, c.y + 5.4 * s], [c.x - 6.8 * s, c.y + 3.6 * s]], '#c0392b', BORDO, 0.8)
  },

  /* ── L'ORTO ── */

  /* il seme, e la buca dove sta per finire. Senza la buca, a questa
     taglia, era un sasso — e «si mette un sasso per terra» non è la
     prima vignetta di una storia sulla crescita. */
  seme(p, c) {
    const s = c.s || 1
    p.ellisse(c.x, c.y + 1.6 * s, 3.4 * s, 1.3 * s, '#4a3320')
    tondo(p, c.x, c.y, 1.6 * s, 2.1 * s, '#7a5c3a', BORDO, 0.6)
    p.velo(0.6, q => tondo(q, c.x - 0.4 * s, c.y - 0.6 * s, 0.5 * s, 0.7 * s, '#c9a97f'))
  },

  germoglio(p, c) {
    const s = c.s || 1
    p.linea([{ x: c.x, y: c.y }, { x: c.x, y: c.y - 7 * s }], '#4f9e42', 1.6 * s)
    for (const v of [-1, 1])
      p.ellisse(c.x + v * 2.6 * s, c.y - 6 * s, 2.8 * s, 1.7 * s, '#5cb04d')
  },

  girasole(p, c) {
    const s = c.s || 1
    const alto = c.alto || 26
    p.linea([{ x: c.x, y: c.y }, { x: c.x, y: c.y - alto * s }], '#4f9e42', 2.2 * s)
    for (const v of [-1, 1])
      p.ellisse(c.x + v * 4 * s, c.y - alto * 0.55 * s, 4.4 * s, 2.2 * s, '#5cb04d')
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * 6.283
      p.ellisse(c.x + Math.cos(a) * 5.2 * s, c.y - alto * s + Math.sin(a) * 5.2 * s,
                2.8 * s, 2.8 * s, '#f2c94c')
    }
    tondo(p, c.x, c.y - alto * s, 3.6 * s, 3.6 * s, '#8c6a3d', BORDO, 0.8)
  },

  annaffiatoio(p, c) {
    const s = c.s || 1
    capsula(p, c.x, c.y - 4 * s, 5 * s, 4 * s, 1.6 * s, '#5fa8d3', BORDO, 0.9)
    poligono(p, [[c.x + 4 * s, c.y - 6 * s], [c.x + 11 * s, c.y - 9 * s],
                 [c.x + 11 * s, c.y - 6.6 * s], [c.x + 4 * s, c.y - 4 * s]], '#4a8ab3', BORDO, 0.8)
    if (c.versa) {
      p.velo(0.6, q => {
        for (let i = 0; i < 4; i++)
          q.linea([{ x: c.x + (11 + i * 1.2) * s, y: c.y - 7 * s + i * 2 * s },
                   { x: c.x + (11.6 + i * 1.2) * s, y: c.y - 3 * s + i * 2.6 * s }], '#8fd3ea', 1.4 * s)
      })
    }
  },

  /* ── LA CUCINA ── */

  ciotola(p, c) {
    const s = c.s || 1
    capsula(p, c.x, c.y - 3 * s, 7 * s, 3.4 * s, 3 * s, '#ffffff', BORDO, 0.9)
    p.ellisse(c.x, c.y - 6 * s, 6.6 * s, 2 * s, c.dentro || '#e8c07a')
    p.linea([{ x: c.x + 3 * s, y: c.y - 6 * s }, { x: c.x + 8 * s, y: c.y - 14 * s }], '#c8d8e0', 1.8 * s)
  },

  forno(p, c) {
    const s = c.s || 1
    capsula(p, c.x, c.y - 11 * s, 11 * s, 11 * s, 2.4 * s, '#c8d8e0', BORDO, 1)
    capsula(p, c.x, c.y - 12 * s, 8 * s, 6 * s, 1.8 * s, c.acceso ? '#f2a94c' : '#5b6b8c', BORDO, 0.9)
    // dentro si intravede la torta che cuoce: il forno acceso e basta
    // sarebbe una scatola con una finestra gialla
    if (c.acceso) {
      p.velo(0.85, q => q.ellisse(c.x, c.y - 11 * s, 5 * s, 2.6 * s, '#ffd84d'))
      capsula(p, c.x, c.y - 10.5 * s, 4 * s, 2 * s, 1.2 * s, '#e8b06a', BORDO, 0.7)
    }
    p.rett(c.x - 9 * s, c.y - 20.5 * s, 18 * s, 1.6 * s, '#9fb3bd')
  },

  torta(p, c) {
    const s = c.s || 1
    capsula(p, c.x, c.y - 4 * s, 9 * s, 4 * s, 1.6 * s, '#f7d9a8', BORDO, 0.9)
    p.ellisse(c.x, c.y - 8 * s, 9 * s, 2.6 * s, '#ff9db1')
    for (const v of [-1, 0, 1]) {
      p.rett(c.x + v * 4 * s - 0.7 * s, c.y - 13 * s, 1.4 * s, 5 * s, '#5fa8d3')
      poligono(p, [[c.x + v * 4 * s - 1 * s, c.y - 13 * s], [c.x + v * 4 * s, c.y - 16.5 * s],
                   [c.x + v * 4 * s + 1 * s, c.y - 13 * s]], '#ffd84d')
    }
  },

  arance(p, c) {
    const s = c.s || 1
    for (const [dx, dy] of [[-5, 0], [5, -0.6], [0, -4.4]]) {
      tondo(p, c.x + dx * s, c.y + dy * s, 4 * s, 4 * s, '#f2913a', BORDO, 0.8)
      p.linea([{ x: c.x + dx * s, y: c.y + (dy - 4) * s },
               { x: c.x + dx * s, y: c.y + (dy - 5.6) * s }], '#4f9e42', 1.2 * s)
    }
  },

  /* `quanto` è quanto succo c'è dentro, da 0 a 1: è il modo di
     raccontare «si sta riempiendo» senza un secondo disegno */
  bicchiere(p, c) {
    const s = c.s || 1, q = c.quanto === undefined ? 1 : c.quanto
    poligono(p, [[c.x - 4 * s, c.y - 12 * s], [c.x + 4 * s, c.y - 12 * s],
                 [c.x + 3 * s, c.y], [c.x - 3 * s, c.y]], '#eaf6fb', BORDO, 0.9)
    const alto = (9 * q) * s, largo = 3 * s + 0.7 * s * q
    if (q > 0.02)
      poligono(p, [[c.x - largo, c.y - alto], [c.x + largo, c.y - alto],
                   [c.x + 3 * s, c.y - 0.5 * s], [c.x - 3 * s, c.y - 0.5 * s]], '#f2913a')
  },

  /* ── QUELLO CHE SI TIENE IN MANO, E QUELLO CHE SI PERDE ── */

  gelato(p, c) {
    const s = c.s || 1
    poligono(p, [[c.x - 3 * s, c.y - 4 * s], [c.x + 3 * s, c.y - 4 * s], [c.x, c.y + 4 * s]],
             '#e8b06a', BORDO, 0.8)
    tondo(p, c.x, c.y - 6 * s, 3.6 * s, 3.4 * s, '#ffd9e4', BORDO, 0.8)
    tondo(p, c.x - 0.6 * s, c.y - 9 * s, 3 * s, 2.8 * s, '#fff6e8', BORDO, 0.8)
  },

  /* lo stesso gelato, per terra. Vale la pena che sia riconoscibilmente
     lo stesso: è la seconda vignetta di una storia in cui la prima lo
     aveva in mano. */
  gelatoCaduto(p, c) {
    const s = c.s || 1
    p.velo(0.7, q => q.ellisse(c.x, c.y, 9 * s, 2.6 * s, '#ffd9e4'))
    tondo(p, c.x + 2 * s, c.y - 1.4 * s, 3.4 * s, 2.6 * s, '#ffd9e4', BORDO, 0.8)
    poligono(p, [[c.x - 8 * s, c.y - 1 * s], [c.x - 2 * s, c.y - 3.4 * s], [c.x - 1 * s, c.y]],
             '#e8b06a', BORDO, 0.8)
  },

  orsetto(p, c) {
    const s = c.s || 1
    for (const v of [-1, 1]) tondo(p, c.x + v * 4 * s, c.y - 9 * s, 2.2 * s, 2.2 * s, '#b98a52', BORDO, 0.8)
    tondo(p, c.x, c.y - 6.5 * s, 4.6 * s, 4.2 * s, '#c99a62', BORDO, 0.9)   // la testa
    tondo(p, c.x, c.y - 5.4 * s, 1.8 * s, 1.4 * s, '#e8c9a0')
    for (const v of [-1, 1]) tondo(p, c.x + v * 1.5 * s, c.y - 7.2 * s, 0.55 * s, 0.6 * s, '#3a2a1a')
    capsula(p, c.x, c.y - 1.6 * s, 4 * s, 3.4 * s, 2 * s, '#c99a62', BORDO, 0.9)
  },

  /* la giacca addosso: si posa **sopra** la persona, e copre la
     maglietta. È il modo più corto per raccontare «adesso è coperto»
     senza avere un secondo vestito nella scheda di chi la indossa. */
  giacca(p, c) {
    const s = c.s || 1
    capsula(p, c.x, c.y, 7.5 * s, 6 * s, 2.2 * s, '#3f6fb5', BORDO, 1)
    p.linea([{ x: c.x, y: c.y - 6 * s }, { x: c.x, y: c.y + 6 * s }], '#2d5691', 1.2 * s)
    capsula(p, c.x, c.y - 6.4 * s, 3.4 * s, 1.4 * s, 1.2 * s, '#345f9c', BORDO, 0.8)
  },

  /* il freddo: i fiocchi e due soffi di vento. Non è la neve — è il
     motivo per cui uno trema, e infatti sta anche in un cortile
     d'autunno */
  freddo(p, c) {
    p.velo(0.85, q => {
      for (const [dx, dy] of [[-26, -30], [-10, -44], [8, -34], [24, -46], [30, -22], [-32, -12]])
        tondo(q, c.x + dx, c.y + dy, 1.8, 1.8, '#ffffff')
      for (const [dx, dy, l] of [[-30, -20, 16], [14, -12, 12]])
        q.linea([{ x: c.x + dx, y: c.y + dy }, { x: c.x + dx + l, y: c.y + dy - 2 }], '#dff2f8', 1.6)
    })
  },

  /* la nuvoletta di chi sta dicendo una cosa: dentro ci va un'altra
     cosa del cassetto (`dentro`), disegnata piccola. È così che si
     racconta «l'ha detto» senza scrivere una parola. */
  nuvoletta(p, c) {
    const w = c.w || 26, h = c.h || 20
    capsula(p, c.x, c.y - h / 2, w / 2, h / 2, 6, '#ffffff', BORDO, 0.9)
    poligono(p, [[c.x - w * 0.28, c.y], [c.x - w * 0.06, c.y], [c.x - w * 0.4, c.y + 6]],
             '#ffffff', BORDO, 0.9)
  },
}

/* il vaso in cocci, disegnato piccolo dentro una nuvoletta: non è una
   cosa nuova, è la stessa cosa in scala — e vale la pena che sia la
   stessa, perché il bambino l'ha appena vista grande nella vignetta
   prima */
cose.cocciPiccoli = (p, c) => {
  p.in(c.x, c.y, q => { q.ctx.scale(0.45, 0.45); cose.cocci(q, { x: 0, y: 0 }) })
}

export const COSE = cose

export { mescola, LATO, SUOLO, LUOGHI }
