/* ═══════════════════════════════════════════════════════════════════
   IL PORTO DISEGNATO — dall'alto, e con una telecamera

   Il fratello di `tela.js`, con la stessa forma e lo stesso patto:
   riceve un **quadro** già deciso e lo disegna sessanta volte al
   secondo. Non sa cosa sia un programma, un livello o una moneta, e non
   sa nemmeno *perché* una cassa stia volando: sa da dove parte, dove
   arriva e a che ora.

     quadro = {
       mondo: 'porto', porto,               // il Porto: si legge, non si tocca mai
       tema: 'molo'|'magazzino'|'bottega',  // la tavolozza del pavimento
       robot, robotDa, dal, durata, verso,  // il passo in corso, come nel cantiere
       voli: [{ cosa, da, a, dal, durata }],  // le cose in viaggio
       mezzi: [{ come: 'arriva'|'parte', x, y, dal, durata,
                 colore, capienza, carico, contento }],  // i camion sulla strada
       guarda, legge, fermo, guaio,         // l'occhio, la nuvoletta, i guai
       mancano, sbagliati, umore,           // la sera, e il cliente appena andato
       nastroDal, passo, seguiRobot,
     }

   Il porto arriva qui già alla fine del turno: la cassa presa è già in
   mano, quella calata è già per terra. Il disegno deve raccontare **come
   ci è arrivato**, e per questo il quadro porta gli orari: finché un
   volo è in corso la cosa si disegna in viaggio e non al suo posto, e
   quando atterra il porto la ritrova da solo dove il motore l'aveva già
   messa. Così qui non c'è niente da tenere in pari con il motore. I
   camion sono la stessa cosa in grande: mentre arriva, il camion è già
   un arredo sulla piazzola, ma si disegna sulla strada; quando riparte
   l'arredo non c'è più, e il camion se ne va col carico che il mezzo
   si porta dietro.

   ── DRITTO E DI SBIECO ───────────────────────────────────────────────
   Pavimento, arredi e casse si vedono dritti dall'alto: sono loro che si
   contano. Il robot, i clienti e la gru invece sono un po' di sbieco, con
   la testa più su dei piedi: visto proprio da sopra il robot sarebbe una
   testa grigia e basta, e il giallo del muratore di latta — che è come lo
   si riconosce dal cantiere — sparirebbe. L'altezza si disegna spostando
   verso la cima dello schermo: è così che la cassa della gru *scende*
   lungo il cavo, invece di ingrandirsi sul posto.

   ── LA TELECAMERA ────────────────────────────────────────────────────
   Se la mappa sta nello spazio con celle di almeno 26 px, non c'è: il
   canvas è grande quanto la mappa. Se no la cella resta a 30 px — più
   piccola a dito non si conta — e il canvas diventa una finestra sulla
   mappa: mentre il programma gira segue il robot, da fermi si trascina.

   Quello che questa tela ricorda da un fotogramma all'altro è solo roba
   da occhi: dov'è la telecamera, il dito che trascina, gli schizzi
   d'acqua ancora aperti, da quando è arrivato il cliente al bancone.
   ═══════════════════════════════════════════════════════════════════ */
import { colore } from '../dati/colori.js'

/* le quattro frecce, come nel motore: `y` cresce verso il basso */
const DIREZIONI = { su: [0, -1], giu: [0, 1], destra: [1, 0], sinistra: [-1, 0] }
const OPPOSTO = { su: 'giu', giu: 'su', destra: 'sinistra', sinistra: 'destra' }
const DI_FIANCO = { su: ['destra', 'sinistra'], giu: ['destra', 'sinistra'], destra: ['giu', 'su'], sinistra: ['giu', 'su'] }
/* per girare un disegno fatto «in avanti verso destra» (il nastro) o
   «con la testa in su» (il camion, la porta del magazzino) */
const DA_DESTRA = { destra: 0, giu: Math.PI / 2, sinistra: Math.PI, su: -Math.PI / 2 }
const DA_SU = { su: 0, destra: Math.PI / 2, giu: Math.PI, sinistra: -Math.PI / 2 }

/* Le misure. Sotto i 26 px una cella non si conta più a colpo d'occhio,
   sopra i 48 una mappa piccola diventa un poster; con la telecamera la
   cella sta a 30, che è il meno che un dito tocca senza sbagliare. */
const CELLA_MIN = 26, CELLA_MAX = 48, CELLA_TELECAMERA = 30
/* un tocco diventa un trascinamento solo oltre la misura del dito: sotto,
   Android e iOS considerano il dito ancora fermo (vedi CLAUDE.md) */
const SOGLIA_DITO = 16
/* una cassa è un po' più piccola della cella, così fra due vicine si vede
   il pavimento; in mano è più piccola ancora, e resta dentro la sagoma */
const LATO_CASSA = 0.74, IN_MANO = 0.7
/* il braccio della gru sta in alto: di quanto, in celle di schermo. Poco
   meno di una cella: il carrello cade sul bordo della cella di sopra, e
   non si confonde con la riga dopo */
const ALTEZZA_GRU = 0.9
/* appesa al gancio, lassù, una cassa è più vicina all'occhio: più grande */
const IN_ALTO = 1.3
/* dove tiene le cose il robot, rispetto al centro della sua cella: in
   avanti verso la freccia, e sopra la testa quando guarda in su */
const MANO = { destra: [0.44, 0.04], sinistra: [-0.44, 0.04], giu: [0, 0.19], su: [0, -0.5] }

const INCHIOSTRO = '#2d2a26', CARTA = '#fffdf9'
const ROSSO = '#c0262d', VERDE = '#2f9e44', GRIGIO = '#868e96'
const GIALLO = '#f5b82e', GIALLO_BORDO = '#8a6112'
const MARE = { fondo: '#3f8ecf', onda: 'rgba(190,228,250,.6)', ombra: 'rgba(12,40,80,.3)' }
const MURO = { fondo: '#8d8880', chiaro: '#a9a39a', scuro: '#7f7a72', giunto: '#615c55', faccia: '#6b665f', bordo: '#4f4b45' }
const STRADA = { asfalto: '#4f5358', chiaro: '#5d6167', scuro: '#44484d', riga: 'rgba(242,240,230,.92)', cordolo: '#cfc9bd', cordoloScuro: '#8f897e' }
/* la buca delle lettere è verde scuro: il rosso delle buche vere qui
   vorrebbe dire «prende solo casse rosse», e il numero sopra è già
   tutto quello che serve sapere */
const BUCA = { corpo: '#2f6d67', coperchio: '#428d85', bordo: '#1b4440', fessura: '#0e1d1b', ottone: '#caa24b' }

/* I tre pavimenti. Stanno tutti sul chiaro e sul caldo: sopra ci devono
   leggersi dieci colori di casse, e un pavimento saturo se ne mangerebbe
   qualcuno (il cotto si mangia l'arancio, il blu il blu). */
const PAVIMENTI = {
  molo:      { fondo: '#d6b588', chiaro: '#e0c298', scuro: '#c9a777', giunto: 'rgba(255,244,222,.45)', chiodo: '#8a6843', bordo: '#7d5a37', griglia: 'rgba(92,58,22,.3)' },
  magazzino: { fondo: '#bcb3a6', chiaro: '#c6beb2', scuro: '#b0a699', giunto: 'rgba(88,78,66,.32)', chiodo: '#9d9487', bordo: '#7b7266', griglia: 'rgba(60,50,40,.16)' },
  bottega:   { fondo: '#eee2c8', chiaro: '#f4ead5', scuro: '#e5d5b5', giunto: 'rgba(150,118,78,.38)', chiodo: '#c27b59', bordo: '#a58d6b', griglia: 'rgba(120,90,55,.1)' },
}

/* i clienti: tre tavolozze che girano con l'id, così lo stesso cliente
   resta lo stesso dalla fila al bancone */
const MAGLIE = ['#e8743b', '#4f86c6', '#6aa84f', '#c2185b', '#7e57c2', '#26a69a', '#f4a825', '#5d6d7e']
const PELLI = ['#f5c9a0', '#e3b088', '#c68b5e', '#8d5a3b', '#f1d3b3']
const CAPELLI = ['#3a2a1e', '#6b4226', '#d9a441', '#1f1f1f', '#a0522d', '#9a9a9a']

const fra = (v, a, b) => Math.max(a, Math.min(b, v))
const morbido = f => (f < 0.5 ? 2 * f * f : 1 - Math.pow(-2 * f + 2, 2) / 2)
const frena = f => 1 - Math.pow(1 - f, 3)
const tuffo = f => 1 + 2.2 * Math.pow(f - 1, 3) + 1.2 * Math.pow(f - 1, 2)
/* a metà strada fra due angoli, per la via più corta: una curva a destra
   non deve diventare tre quarti di giro a sinistra */
const mescola = (a, b, k) => {
  let d = b - a
  while (d > Math.PI) d -= Math.PI * 2
  while (d < -Math.PI) d += Math.PI * 2
  return a + d * k
}
/* un numero fisso fra 0 e 1 per ogni cella: i sassolini, le venature e
   le onde stanno sempre allo stesso posto — niente tremola */
const caso = (a, b, n = 0) => {
  const s = Math.sin(a * 127.1 + b * 311.7 + n * 74.7) * 43758.5453
  return s - Math.floor(s)
}

/* `roundRect` manca sui Safari prima del 16: lì gli spigoli sono vivi, ma
   il disegno c'è */
function rett(ctx, x, y, w, h, r = 0) {
  ctx.beginPath()
  if (ctx.roundRect) ctx.roundRect(x, y, w, h, r)
  else ctx.rect(x, y, w, h)
}

/* quello che dipende solo dalla mappa (da che parte arriva la gru, dove
   si mette la fila): si calcola una volta per porto */
const MEMO = new WeakMap()

export class TelaPorto {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.quadro = null
    this.cella = CELLA_TELECAMERA
    this.dpr = 1
    this.w = 0
    this.h = 0
    this.vistaW = 0
    this.vistaH = 0
    this.telecamera = false
    this.cam = { x: 0, y: 0 }
    this.daCentrare = true
    this.ricentra = false
    this.seguiva = false
    this.dito = null
    this.trascinatoAlle = -Infinity
    this.schizzi = new Map()
    this.inPartenza = new Map()
    this.cliente = null
    this.portoVisto = null
    this.nuovo = true
    this.ultimo = 0
    this.vivo = true
    this.ascolti = []
    const ascolta = (tipo, fn, opzioni) => {
      const f = fn.bind(this)
      canvas.addEventListener(tipo, f, opzioni)
      this.ascolti.push([tipo, f, opzioni])
    }
    ascolta('pointerdown', this.premuto)
    ascolta('pointermove', this.mosso)
    ascolta('pointerup', this.lasciato)
    ascolta('pointercancel', this.lasciato)
    ascolta('click', this.cliccato, true)
    this.giro = this.giro.bind(this)
    this.raf = requestAnimationFrame(this.giro)
  }

  ferma() {
    this.vivo = false
    cancelAnimationFrame(this.raf)
    for (const [tipo, f, opzioni] of this.ascolti) this.canvas.removeEventListener(tipo, f, opzioni)
    this.ascolti = []
  }

  /* Quanto è grande la cella, e quanto il canvas. La regola sta in testa
     al file; qui conta che si possa richiamare a ogni ridimensionamento:
     il canvas si tocca solo se cambia (riassegnare `width` lo svuota), e
     la telecamera resta sullo stesso punto della mappa. */
  misura(larghezza, altezzaMassima, w, h) {
    const p = this.quadro && this.quadro.porto
    w = w || (p && p.w) || 1
    h = h || (p && p.h) || 1
    const L = Math.max(0, Math.floor(larghezza)), A = Math.max(0, Math.floor(altezzaMassima))
    const piena = Math.floor(Math.min(L / w, A / h))
    const prima = this.cella, aveva = this.telecamera
    if (piena >= CELLA_MIN) {
      this.telecamera = false
      this.cella = Math.min(CELLA_MAX, piena)
      this.vistaW = this.cella * w
      this.vistaH = this.cella * h
    } else {
      this.telecamera = true
      this.cella = CELLA_TELECAMERA
      this.vistaW = Math.min(L, this.cella * w)
      this.vistaH = Math.min(A, this.cella * h)
    }
    this.w = w
    this.h = h
    const dpr = Math.min(window.devicePixelRatio || 1, 3)
    this.dpr = dpr
    const pw = Math.round(this.vistaW * dpr), ph = Math.round(this.vistaH * dpr)
    if (this.canvas.width !== pw) this.canvas.width = pw
    if (this.canvas.height !== ph) this.canvas.height = ph
    this.canvas.style.width = `${this.vistaW}px`
    this.canvas.style.height = `${this.vistaH}px`
    /* il dito che trascina non deve far scorrere la pagina; senza
       telecamera invece il canvas torna una parte della pagina come le
       altre, e ci si scorre sopra */
    this.canvas.style.touchAction = this.telecamera ? 'none' : ''
    if (prima !== this.cella) {
      this.cam.x *= this.cella / prima
      this.cam.y *= this.cella / prima
    }
    if (this.telecamera && !aveva) this.daCentrare = true
    this.tieniDentro()
    return this.cella
  }

  aggiorna(quadro) {
    if (quadro !== this.quadro) this.daCapo()
    this.quadro = quadro
  }

  /* un quadro nuovo è un altro ordine, o un'altra giornata: la telecamera
     torna sul robot e gli effetti di prima si chiudono */
  daCapo() {
    this.daCentrare = true
    this.schizzi.clear()
    this.cliente = null
    this.nuovo = true
  }

  giro(t) {
    if (!this.vivo) return
    const dt = this.ultimo ? fra(t - this.ultimo, 0, 100) : 16
    this.ultimo = t
    const q = this.quadro
    if (q && q.porto && this.vistaW > 0 && this.vistaH > 0) {
      if (q.porto !== this.portoVisto) {
        if (this.portoVisto) this.daCapo()
        this.portoVisto = q.porto
      }
      this.inquadra(q, t, dt)
      this.disegna(q, t)
      this.nuovo = false
    }
    this.raf = requestAnimationFrame(this.giro)
  }

  /* ═══════════ la telecamera ═══════════ */
  tieniDentro() {
    const c = this.cella
    this.cam.x = fra(this.cam.x, 0, Math.max(0, this.w * c - this.vistaW))
    this.cam.y = fra(this.cam.y, 0, Math.max(0, this.h * c - this.vistaH))
  }

  /* Mentre il programma gira la telecamera va dietro al robot, ma non
     gli sta incollata: si muove solo quando lui esce dal riquadro in
     mezzo. Un mondo che scorre a ogni passo sotto i piedi del robot non
     si riesce più a contare, ed è contando le celle che si scrive il
     programma. Quando `seguiRobot` si riaccende — si è trascinato per
     guardare altrove, e si preme ▶ — prima si torna col robot al centro. */
  inquadra(q, t, dt) {
    if (!this.telecamera) {
      this.cam.x = this.cam.y = 0
      return
    }
    const r = this.posRobot(q, q.porto, t)
    const W = this.vistaW, H = this.vistaH
    if (this.daCentrare) {
      this.cam.x = r.x - W / 2
      this.cam.y = r.y - H / 2
      this.tieniDentro()
      this.daCentrare = false
      this.seguiva = !!q.seguiRobot
      return
    }
    const segue = !!q.seguiRobot
    if (segue && !this.seguiva) this.ricentra = true
    if (segue) this.dito = null
    this.seguiva = segue
    if (!segue) return
    const c = this.cella
    let tx = this.cam.x, ty = this.cam.y
    if (this.ricentra) {
      tx = r.x - W / 2
      ty = r.y - H / 2
    } else {
      const mx = Math.min(W * 0.3, W / 2 - c * 0.5), my = Math.min(H * 0.3, H / 2 - c * 0.5)
      if (r.x - tx < mx) tx = r.x - mx
      else if (r.x - tx > W - mx) tx = r.x - (W - mx)
      if (r.y - ty < my) ty = r.y - my
      else if (r.y - ty > H - my) ty = r.y - (H - my)
    }
    tx = fra(tx, 0, Math.max(0, this.w * c - W))
    ty = fra(ty, 0, Math.max(0, this.h * c - H))
    const k = 1 - Math.exp(-dt / 140)
    this.cam.x += (tx - this.cam.x) * k
    this.cam.y += (ty - this.cam.y) * k
    if (Math.abs(tx - this.cam.x) < 0.5 && Math.abs(ty - this.cam.y) < 0.5) {
      this.cam.x = tx
      this.cam.y = ty
      this.ricentra = false
    }
  }

  /* ── il dito ──
     Si trascina solo da fermi e solo con la telecamera. Un tocco breve non
     muove niente: sotto la soglia il dito è ancora un tocco, e il click
     che lascia arriva a chi sta sotto come sempre. Dopo un trascinamento
     invece quel click si ingoia: il dito che si alza non è una scelta. */
  premuto(e) {
    if (!this.telecamera || (this.quadro && this.quadro.seguiRobot)) return
    if (e.pointerType === 'mouse' && e.button !== 0) return
    /* un secondo dito non ruba il trascinamento al primo; un dito nuovo
       invece sì, anche se del vecchio non è mai arrivato il `pointerup` —
       col mouse succede lasciando il tasto fuori dal canvas */
    if (this.dito && !e.isPrimary) return
    this.dito = { id: e.pointerId, x0: e.clientX, y0: e.clientY, cx: this.cam.x, cy: this.cam.y, via: false }
  }

  mosso(e) {
    const d = this.dito
    if (!d || e.pointerId !== d.id) return
    if (!d.via) {
      if (Math.hypot(e.clientX - d.x0, e.clientY - d.y0) < SOGLIA_DITO) return
      /* si riparte da qui, se no la mappa salterebbe di sedici pixel */
      d.via = true
      d.x0 = e.clientX
      d.y0 = e.clientY
      d.cx = this.cam.x
      d.cy = this.cam.y
      try { this.canvas.setPointerCapture(e.pointerId) } catch { /* il dito è già andato */ }
    }
    this.cam.x = d.cx - (e.clientX - d.x0)
    this.cam.y = d.cy - (e.clientY - d.y0)
    this.tieniDentro()
    e.preventDefault()
  }

  lasciato(e) {
    const d = this.dito
    if (!d || e.pointerId !== d.id) return
    if (d.via) this.trascinatoAlle = performance.now()
    this.dito = null
  }

  /* in cattura sul canvas stesso: così arriva prima di un `@click` messo
     sullo stesso elemento, e lo ferma insieme a quelli dei genitori */
  cliccato(e) {
    if (performance.now() - this.trascinatoAlle < 400) {
      e.stopImmediatePropagation()
      e.preventDefault()
    }
  }

  /* ═══════════ il fotogramma ═══════════ */
  disegna(q, t) {
    const { ctx, dpr, cella: c } = this
    const p = q.porto
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    /* ogni fotogramma parte dallo stesso stato: un tratteggio o una
       trasparenza dimenticati da un pittore non passano al successivo */
    ctx.globalAlpha = 1
    ctx.setLineDash([])
    ctx.lineCap = 'butt'
    ctx.lineJoin = 'miter'
    ctx.fillStyle = MARE.fondo
    ctx.fillRect(0, 0, this.vistaW, this.vistaH)
    /* la telecamera si ferma sui pixel interi: una griglia spostata di
       mezzo pixel diventa sfocata, e mentre scorre sfarfalla */
    const ox = Math.round(this.cam.x), oy = Math.round(this.cam.y)
    ctx.translate(-ox, -oy)
    /* si disegna solo quello che si vede, più una cella di margine per chi
       sporge (la testa del robot, il camion, le etichette) */
    const vis = {
      x0: Math.max(0, Math.floor(ox / c) - 1), x1: Math.min(p.w - 1, Math.ceil((ox + this.vistaW) / c)),
      y0: Math.max(0, Math.floor(oy / c) - 1), y1: Math.min(p.h - 1, Math.ceil((oy + this.vistaH) / c) + 1),
    }
    /* le cose in viaggio: finché volano non stanno al loro posto */
    const inVolo = new Set()
    for (const v of q.voli || []) if (v && v.cosa && t < v.dal + (v.durata || 0)) inVolo.add(v.cosa.id)
    /* e i camion che stanno arrivando: sono già sulla piazzola per il
       motore, ma sullo schermo sono ancora per strada */
    const inArrivo = new Set()
    for (const m of q.mezzi || [])
      if (m && m.come === 'arriva' && t < m.dal + (m.durata || 0) && p.dentro(m.x, m.y)) inArrivo.add(m.y * p.w + m.x)
    this.inPartenza = new Map()
    const tema = PAVIMENTI[q.tema] || PAVIMENTI.molo
    const cl = p.clienti && p.clienti.alBancone
    const idCliente = cl ? cl.id : null
    if (!this.cliente || this.cliente.id !== idCliente)
      this.cliente = { id: idCliente, dal: this.nuovo ? -Infinity : t }

    this.pavimento(p, tema, vis)
    this.strade(p, vis)
    this.mare(p, vis, t)
    this.muri(p, vis)
    this.griglia(p, vis, tema)
    this.segniPerTerra(p)
    this.arredi(p, q, t, vis, inVolo, inArrivo)
    this.scivoli(p, vis)
    this.fantasmi(p, q, t, vis, inVolo)
    this.cose(p, vis, inVolo)
    this.mezzi(p, q, t, inVolo)
    /* gli schizzi dopo gli arredi: una cassa caduta oltre il bordo della
       mappa fa gli anelli sul bordo, che può essere la fine di un nastro */
    this.acqua(t)
    if (q.sbagliati && q.sbagliati.length) this.croci(q.sbagliati, t)
    this.ombraGru(p)
    this.clienti(p, t)
    this.robot(p, q, t, inVolo)
    this.gru(p, q, t)
    this.voli(p, q, t)
    this.occhiata(p, q, t)
    this.segnali(p, q, t)
    this.umore(p, q, t)
    this.richiesta(p, t)
    this.etichette(p, vis, inVolo, inArrivo, t)
    this.lettura(p, q, t)
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    if (this.telecamera) this.bordi(p)
  }

  /* ═══════════ il pavimento ═══════════ */
  pavimento(p, tema, vis) {
    const { ctx, cella: c } = this
    /* una mano di fondo su tutto quello che si vede, e poi i dettagli
       sopra: due rettangoli vicini lasciano una riga chiara fra loro
       quando il bordo cade a metà di un pixel del telefono */
    ctx.fillStyle = tema.fondo
    ctx.fillRect(vis.x0 * c, vis.y0 * c, (vis.x1 - vis.x0 + 1) * c, (vis.y1 - vis.y0 + 1) * c)
    if (tema === PAVIMENTI.magazzino) this.cemento(p, tema, vis)
    else if (tema === PAVIMENTI.bottega) this.mattonelle(p, tema, vis)
    else this.assi(p, tema, vis)

    /* dove il pavimento finisce nel mare c'è la trave del bordo: si vede
       dove non si può andare prima di doverlo leggere */
    ctx.fillStyle = tema.bordo
    ctx.beginPath()
    const b = c * 0.08
    this.celle(p, vis, 'pavimento', (x, y, px, py) => {
      if (this.suoloDi(p, x, y - 1) === 'mare') ctx.rect(px, py, c, b)
      if (this.suoloDi(p, x, y + 1) === 'mare') ctx.rect(px, py + c - b, c, b)
      if (this.suoloDi(p, x - 1, y) === 'mare') ctx.rect(px, py, b, c)
      if (this.suoloDi(p, x + 1, y) === 'mare') ctx.rect(px + c - b, py, b, c)
    })
    ctx.fill()
  }

  celle(p, vis, suolo, fn) {
    const c = this.cella
    for (let y = vis.y0; y <= vis.y1; y++) for (let x = vis.x0; x <= vis.x1; x++)
      if (!suolo || p.suolo[y * p.w + x] === suolo) fn(x, y, x * c, y * c)
  }

  suoloDi(p, x, y) { return p.dentro(x, y) ? p.suolo[y * p.w + x] : null }

  /* il molo: assi di legno, due per cella, lunghe due celle e sfalsate
     come si inchiodano davvero. Fra le due assi di una cella c'è solo un
     filo di luce, mai una riga scura: la riga scura è la griglia, ed è
     quella che si conta — con due righe uguali per cella le file
     sembrerebbero il doppio */
  assi(p, tema, vis) {
    const { ctx, cella: c } = this
    const mezza = c / 2
    this.celle(p, vis, 'pavimento', (x, y, px, py) => {
      for (let i = 0; i < 2; i++) {
        const riga = y * 2 + i
        const tono = caso(Math.floor((x + (riga % 2)) / 2), riga, 1)
        if (tono < 0.34) ctx.fillStyle = tema.chiaro
        else if (tono > 0.68) ctx.fillStyle = tema.scuro
        else continue
        ctx.fillRect(px, py + i * mezza, c, mezza)
      }
    })
    ctx.strokeStyle = tema.giunto
    ctx.lineWidth = 1
    ctx.beginPath()
    this.celle(p, vis, 'pavimento', (x, y, px, py) => {
      ctx.moveTo(px, py + mezza + 0.5)
      ctx.lineTo(px + c, py + mezza + 0.5)
    })
    ctx.stroke()
    /* i chiodi, ai due capi di ogni asse */
    ctx.fillStyle = tema.chiodo
    ctx.beginPath()
    const n = Math.max(1, c * 0.05)
    this.celle(p, vis, 'pavimento', (x, y, px, py) => {
      for (let i = 0; i < 2; i++) {
        if ((x + ((y * 2 + i) % 2)) % 2) continue
        const cy = py + (i + 0.5) * mezza - n / 2
        ctx.rect(px + c * 0.09, cy, n, n)
        if (this.suoloDi(p, x - 1, y) === 'pavimento') ctx.rect(px - c * 0.09 - n, cy, n, n)
      }
    })
    ctx.fill()
  }

  /* il magazzino: lastre di cemento di due celle per due, con i
     sassolini e qualche macchia d'olio */
  cemento(p, tema, vis) {
    const { ctx, cella: c } = this
    this.celle(p, vis, 'pavimento', (x, y, px, py) => {
      const tono = caso(Math.floor(x / 2), Math.floor(y / 2), 2)
      if (tono < 0.3) ctx.fillStyle = tema.chiaro
      else if (tono > 0.7) ctx.fillStyle = tema.scuro
      else return
      ctx.fillRect(px, py, c, c)
    })
    ctx.fillStyle = 'rgba(70,58,44,.09)'
    this.celle(p, vis, 'pavimento', (x, y, px, py) => {
      if (caso(x, y, 9) > 0.07) return
      ctx.beginPath()
      ctx.ellipse(px + c * (0.3 + 0.4 * caso(x, y, 10)), py + c * (0.3 + 0.4 * caso(x, y, 11)), c * 0.26, c * 0.17, 0, 0, Math.PI * 2)
      ctx.fill()
    })
    ctx.fillStyle = tema.chiodo
    ctx.beginPath()
    const s = Math.max(1, c * 0.04)
    this.celle(p, vis, 'pavimento', (x, y, px, py) => {
      for (let i = 0; i < 3; i++) ctx.rect(px + c * (0.1 + 0.8 * caso(x, y, 20 + i)), py + c * (0.1 + 0.8 * caso(x, y, 30 + i)), s, s)
    })
    ctx.fill()
    ctx.strokeStyle = tema.giunto
    ctx.lineWidth = 1
    ctx.beginPath()
    this.celle(p, vis, 'pavimento', (x, y, px, py) => {
      if (x % 2 === 0 && this.suoloDi(p, x - 1, y) === 'pavimento') { ctx.moveTo(px + 0.5, py); ctx.lineTo(px + 0.5, py + c) }
      if (y % 2 === 0 && this.suoloDi(p, x, y - 1) === 'pavimento') { ctx.moveTo(px, py + 0.5); ctx.lineTo(px + c, py + 0.5) }
    })
    ctx.stroke()
  }

  /* la bottega: mattonelle di graniglia, una per cella, col rombo di cotto
     negli incroci — la griglia qui c'è già, ed è la fuga */
  mattonelle(p, tema, vis) {
    const { ctx, cella: c } = this
    ctx.fillStyle = tema.scuro
    ctx.beginPath()
    this.celle(p, vis, 'pavimento', (x, y, px, py) => { if ((x + y) % 2) ctx.rect(px, py, c, c) })
    ctx.fill()
    ctx.strokeStyle = tema.giunto
    ctx.lineWidth = 1
    ctx.beginPath()
    this.celle(p, vis, 'pavimento', (x, y, px, py) => {
      ctx.moveTo(px + 0.5, py); ctx.lineTo(px + 0.5, py + c)
      ctx.moveTo(px, py + 0.5); ctx.lineTo(px + c, py + 0.5)
    })
    ctx.stroke()
    ctx.fillStyle = tema.chiodo
    ctx.beginPath()
    const d = c * 0.09
    this.celle(p, vis, 'pavimento', (x, y, px, py) => {
      if (this.suoloDi(p, x - 1, y - 1) !== 'pavimento') return
      ctx.moveTo(px, py - d); ctx.lineTo(px + d, py); ctx.lineTo(px, py + d); ctx.lineTo(px - d, py); ctx.closePath()
    })
    ctx.fill()
  }

  /* ── la strada dei camion ──
     Asfalto, la riga tratteggiata dove la strada va — la si ricava dalle
     caselle-strada vicine, quindi viene da sé dritta, in curva o a
     incrocio — e il cordolo chiaro verso tutto quello che strada non è:
     è il confine che il robot non passa. La piazzola ha le strisce del
     parcheggio, e si vede anche vuota: lì si ferma qualcuno. */
  strade(p, vis) {
    const { ctx, cella: c } = this
    const asfalto = []
    this.celle(p, vis, 'strada', (x, y, px, py) => asfalto.push([x, y, px, py]))
    if (!asfalto.length) return
    const strada = (x, y) => this.suoloDi(p, x, y) === 'strada'
    ctx.fillStyle = STRADA.asfalto
    ctx.beginPath()
    for (const [, , px, py] of asfalto) ctx.rect(px, py, c, c)
    ctx.fill()
    /* la grana, fissa come i sassolini del cemento */
    const g = Math.max(1, c * 0.045)
    for (const [tono, da] of [[STRADA.chiaro, 60], [STRADA.scuro, 70]]) {
      ctx.fillStyle = tono
      ctx.beginPath()
      for (const [x, y, px, py] of asfalto)
        for (let i = 0; i < 4; i++) ctx.rect(px + c * (0.08 + 0.84 * caso(x, y, da + i)), py + c * (0.08 + 0.84 * caso(x, y, da + 5 + i)), g, g)
      ctx.fill()
    }
    /* la riga di mezzo: da ogni casella un braccio verso ogni strada
       vicina (e verso fuori, dove la strada esce dalla mappa); due bracci
       in fila fanno un trattino, due ad angolo una curva */
    ctx.strokeStyle = STRADA.riga
    ctx.lineWidth = Math.max(1.5, c * 0.065)
    ctx.lineCap = 'square'
    ctx.beginPath()
    for (const [x, y, px, py] of asfalto) {
      if (this.ePiazzola(p, x, y)) continue
      const cx = px + c / 2, cy = py + c / 2
      const esce = this.uscita(p, x, y)
      for (const d of ['su', 'giu', 'sinistra', 'destra']) {
        const [dx, dy] = DIREZIONI[d]
        if (!(esce === d || (strada(x + dx, y + dy) && !this.ePiazzola(p, x + dx, y + dy)))) continue
        ctx.moveTo(cx, cy)
        ctx.lineTo(cx + dx * c * 0.24, cy + dy * c * 0.24)
      }
    }
    ctx.stroke()
    ctx.lineCap = 'butt'
    /* il cordolo, dentro la casella di strada, verso quello che strada
       non è; verso il bordo della mappa no, perché di là continua */
    const b = c * 0.12
    const fuori = (x, y) => p.dentro(x, y) && !strada(x, y)
    ctx.fillStyle = STRADA.cordolo
    ctx.beginPath()
    for (const [x, y, px, py] of asfalto) {
      if (fuori(x, y - 1)) ctx.rect(px, py, c, b)
      if (fuori(x, y + 1)) ctx.rect(px, py + c - b, c, b)
      if (fuori(x - 1, y)) ctx.rect(px, py, b, c)
      if (fuori(x + 1, y)) ctx.rect(px + c - b, py, b, c)
    }
    ctx.fill()
    ctx.strokeStyle = STRADA.cordoloScuro
    ctx.lineWidth = Math.max(1, c * 0.03)
    ctx.beginPath()
    for (const [x, y, px, py] of asfalto) {
      if (fuori(x, y - 1)) { ctx.moveTo(px, py + b); ctx.lineTo(px + c, py + b) }
      if (fuori(x, y + 1)) { ctx.moveTo(px, py + c - b); ctx.lineTo(px + c, py + c - b) }
      if (fuori(x - 1, y)) { ctx.moveTo(px + b, py); ctx.lineTo(px + b, py + c) }
      if (fuori(x + 1, y)) { ctx.moveTo(px + c - b, py); ctx.lineTo(px + c - b, py + c) }
    }
    ctx.stroke()
    /* le strisce del parcheggio */
    ctx.strokeStyle = STRADA.riga
    ctx.lineWidth = Math.max(1.5, c * 0.055)
    ctx.setLineDash([c * 0.13, c * 0.08])
    for (const [x, y, px, py] of asfalto) {
      if (!this.ePiazzola(p, x, y)) continue
      const m = c * 0.17
      ctx.strokeRect(px + m, py + m, c - 2 * m, c - 2 * m)
    }
    ctx.setLineDash([])
  }

  ePiazzola(p, x, y) {
    const m = this.memo(p)
    if (!m.piazzole) m.piazzole = new Set(p.piazzole || [])
    return p.dentro(x, y) && m.piazzole.has(y * p.w + x)
  }

  /* Da che parte una casella di strada esce dalla mappa, se esce. Sta sul
     bordo non basta: una strada che corre lungo il bordo non esce di
     lato. Esce se la strada arriva dritta contro il bordo (ha una strada
     dalla parte opposta), o se è una casella sola. Le piazzole non contano
     come strada qui: una piazzola sopra la strada del bordo non la fa
     uscire di sotto. E una piazzola non è mai un'uscita, se ha una strada
     vicino: in fondo a una strada, contro il bordo, è un parcheggio, e i
     camion ci arrivano dalla strada — non dal niente oltre il bordo. */
  uscita(p, x, y) {
    const m = this.memo(p)
    if (!m.uscite) m.uscite = new Map()
    const k = y * p.w + x
    if (m.uscite.has(k)) return m.uscite.get(k)
    const strada = (ax, ay) => this.suoloDi(p, ax, ay) === 'strada' && !this.ePiazzola(p, ax, ay)
    const vicini = ['su', 'giu', 'sinistra', 'destra'].filter(d => strada(x + DIREZIONI[d][0], y + DIREZIONI[d][1]))
    let esce = null
    if (!(this.ePiazzola(p, x, y) && vicini.length)) {
      for (const d of ['giu', 'destra', 'sinistra', 'su']) {
        const [dx, dy] = DIREZIONI[d]
        if (p.dentro(x + dx, y + dy)) continue
        if (!vicini.length || vicini.includes(OPPOSTO[d])) { esce = d; break }
      }
    }
    m.uscite.set(k, esce)
    return esce
  }

  /* ── la strada di un camion ──
     Dalla piazzola al bordo più vicino, lungo la strada (una ricerca in
     ampiezza sulle caselle di strada), e poi fuori dalla mappa quanto
     basta a sparire. Se la strada non esce da nessuna parte il camion
     arriva dal basso, dritto. È la stessa strada all'andata e al
     ritorno: il camion ha sempre la cabina verso l'uscita — entra in
     retromarcia, come ai moli di carico, ed esce col muso avanti — così
     non deve mai girarsi su se stesso in una casella sola. */
  percorso(p, x, y) {
    const m = this.memo(p)
    if (!m.percorsi) m.percorsi = new Map()
    const k0 = y * p.w + x
    if (m.percorsi.has(k0)) return m.percorsi.get(k0)
    const prima = new Map([[k0, -1]])
    const coda = [k0]
    let fine = -1
    for (let i = 0; i < coda.length; i++) {
      const k = coda[i]
      const cx = k % p.w, cy = (k - cx) / p.w
      if (this.uscita(p, cx, cy)) { fine = k; break }
      for (const d of ['giu', 'destra', 'sinistra', 'su']) {
        const [dx, dy] = DIREZIONI[d]
        const nx = cx + dx, ny = cy + dy
        if (this.suoloDi(p, nx, ny) !== 'strada') continue
        const nk = ny * p.w + nx
        if (prima.has(nk)) continue
        prima.set(nk, k)
        coda.push(nk)
      }
    }
    let punti
    if (fine >= 0 && this.suoloDi(p, x, y) === 'strada') {
      const celle = []
      for (let k = fine; k >= 0; k = prima.get(k)) celle.unshift(k)
      punti = celle.map(k => [(k % p.w) + 0.5, Math.floor(k / p.w) + 0.5])
      const [ux, uy] = DIREZIONI[this.uscita(p, fine % p.w, Math.floor(fine / p.w))]
      const [lx, ly] = punti[punti.length - 1]
      punti.push([lx + ux * 1.7, ly + uy * 1.7])
    } else {
      punti = [[x + 0.5, y + 0.5], [x + 0.5, p.h + 1.2]]
    }
    const tratti = []
    let lung = 0
    for (let i = 1; i < punti.length; i++) {
      const [ax, ay] = punti[i - 1], [bx, by] = punti[i]
      const l = Math.hypot(bx - ax, by - ay)
      tratti.push({ ax, ay, bx, by, l, da: lung, angolo: Math.atan2(bx - ax, -(by - ay)) })
      lung += l
    }
    const r = { punti, tratti, lung }
    m.percorsi.set(k0, r)
    return r
  }

  /* dove sta, e da che parte guarda la cabina, un camion a `s` celle
     dalla piazzola lungo la sua strada; nelle curve la cabina gira un po'
     prima e un po' dopo l'angolo, invece che di scatto */
  lungoLaStrada(r, s) {
    s = fra(s, 0, r.lung)
    let i = r.tratti.findIndex(t => s <= t.da + t.l)
    if (i < 0) i = r.tratti.length - 1
    const t = r.tratti[i]
    const f = t.l ? (s - t.da) / t.l : 0
    const R = 0.32
    let angolo = t.angolo
    const dentro = s - t.da, resto = t.l - dentro
    if (resto < R && i + 1 < r.tratti.length) angolo = mescola(angolo, r.tratti[i + 1].angolo, (1 - resto / R) / 2)
    else if (dentro < R && i > 0) angolo = mescola(angolo, r.tratti[i - 1].angolo, (1 - dentro / R) / 2)
    return { x: t.ax + (t.bx - t.ax) * f, y: t.ay + (t.by - t.ay) * f, angolo }
  }

  /* ── il mare ──
     Onde lente e fisse al loro posto: si muovono avanti e indietro di
     poco, con periodi di secondi. Un'acqua che tremola a sessanta
     fotogrammi si guarda al posto del robot. */
  mare(p, vis, t) {
    const { ctx, cella: c } = this
    const acqua = []
    this.celle(p, vis, 'mare', (x, y, px, py) => acqua.push([x, y, px, py]))
    if (!acqua.length) return
    const terra = (x, y) => { const s = this.suoloDi(p, x, y); return s !== null && s !== 'mare' }
    ctx.fillStyle = MARE.fondo
    ctx.beginPath()
    for (const [, , px, py] of acqua) ctx.rect(px, py, c, c)
    ctx.fill()
    /* l'ombra della banchina sull'acqua: il sole viene dall'alto a sinistra */
    ctx.fillStyle = MARE.ombra
    ctx.beginPath()
    for (const [x, y, px, py] of acqua) {
      if (terra(x, y - 1)) ctx.rect(px, py, c, c * 0.16)
      if (terra(x - 1, y)) ctx.rect(px, py, c * 0.12, c)
    }
    ctx.fill()
    ctx.strokeStyle = MARE.onda
    ctx.lineWidth = Math.max(1, c * 0.05)
    ctx.lineCap = 'round'
    ctx.beginPath()
    for (const [x, y, px, py] of acqua) {
      for (let n = 0; n < 2; n++) {
        const a = caso(x, y, 40 + n), b = caso(x, y, 50 + n)
        const cx = px + c * (0.24 + 0.52 * a) + Math.sin(t / 2600 + a * 6.28) * c * 0.07
        const cy = py + c * (0.28 + 0.46 * b)
        ctx.moveTo(cx - c * 0.13, cy)
        ctx.quadraticCurveTo(cx, cy - c * 0.08, cx + c * 0.13, cy)
      }
    }
    ctx.stroke()
    /* la schiuma contro la banchina respira piano, tutta insieme */
    ctx.strokeStyle = `rgba(255,255,255,${0.42 + 0.16 * Math.sin(t / 1300)})`
    ctx.lineWidth = Math.max(1, c * 0.06)
    ctx.beginPath()
    const o = c * 0.08
    for (const [x, y, px, py] of acqua) {
      if (terra(x, y - 1)) { ctx.moveTo(px, py + o); ctx.lineTo(px + c, py + o) }
      if (terra(x, y + 1)) { ctx.moveTo(px, py + c - o); ctx.lineTo(px + c, py + c - o) }
      if (terra(x - 1, y)) { ctx.moveTo(px + o, py); ctx.lineTo(px + o, py + c) }
      if (terra(x + 1, y)) { ctx.moveTo(px + c - o, py); ctx.lineTo(px + c - o, py + c) }
    }
    ctx.stroke()
    ctx.lineCap = 'butt'
  }

  /* ── i muri: blocchi di pietra sfalsati, con la faccia davanti più
     scura dove finiscono, e l'ombra sul pavimento a destra e sotto ── */
  muri(p, vis) {
    const { ctx, cella: c } = this
    const mezza = c / 2
    let qualcuno = false
    this.celle(p, vis, 'muro', (x, y, px, py) => {
      qualcuno = true
      ctx.fillStyle = MURO.fondo
      ctx.fillRect(px, py, c, c)
      for (let i = 0; i < 2; i++) {
        const riga = y * 2 + i
        const sfasa = (riga % 2) * c * 0.25
        for (let j = -1; j < 2; j++) {
          const bx0 = Math.max(px, px - sfasa + j * mezza), bx1 = Math.min(px + c, px - sfasa + (j + 1) * mezza)
          if (bx1 <= bx0) continue
          const tono = caso(x * 2 + j + (riga % 2), riga, 5)
          if (tono < 0.3) ctx.fillStyle = MURO.chiaro
          else if (tono > 0.72) ctx.fillStyle = MURO.scuro
          else continue
          ctx.fillRect(bx0, py + i * mezza, bx1 - bx0, mezza)
        }
      }
    })
    if (!qualcuno) return
    ctx.strokeStyle = MURO.giunto
    ctx.lineWidth = 1
    ctx.beginPath()
    this.celle(p, vis, 'muro', (x, y, px, py) => {
      ctx.moveTo(px, py + mezza + 0.5); ctx.lineTo(px + c, py + mezza + 0.5)
      if (this.suoloDi(p, x, y - 1) === 'muro') { ctx.moveTo(px, py + 0.5); ctx.lineTo(px + c, py + 0.5) }
      for (let i = 0; i < 2; i++) {
        const sfasa = ((y * 2 + i) % 2) * c * 0.25
        for (let j = 0; j < 3; j++) {
          const gx = px - sfasa + j * mezza
          if (gx <= px || gx >= px + c) continue
          ctx.moveTo(gx + 0.5, py + i * mezza); ctx.lineTo(gx + 0.5, py + (i + 1) * mezza)
        }
      }
    })
    ctx.stroke()
    /* la faccia davanti, dove il muro finisce verso il basso: è quello che
       lo fa stare in piedi invece che dipinto per terra */
    ctx.fillStyle = MURO.faccia
    ctx.beginPath()
    this.celle(p, vis, 'muro', (x, y, px, py) => {
      if (this.suoloDi(p, x, y + 1) !== 'muro' && y + 1 < p.h) ctx.rect(px, py + c * 0.78, c, c * 0.22)
    })
    ctx.fill()
    ctx.strokeStyle = MURO.bordo
    ctx.lineWidth = Math.max(1, c * 0.04)
    ctx.beginPath()
    this.celle(p, vis, 'muro', (x, y, px, py) => {
      const fuori = (dx, dy) => { const s = this.suoloDi(p, x + dx, y + dy); return s !== null && s !== 'muro' }
      if (fuori(0, -1)) { ctx.moveTo(px, py); ctx.lineTo(px + c, py) }
      if (fuori(0, 1)) { ctx.moveTo(px, py + c); ctx.lineTo(px + c, py + c) }
      if (fuori(-1, 0)) { ctx.moveTo(px, py); ctx.lineTo(px, py + c) }
      if (fuori(1, 0)) { ctx.moveTo(px + c, py); ctx.lineTo(px + c, py + c) }
    })
    ctx.stroke()
    ctx.fillStyle = 'rgba(35,28,20,.17)'
    ctx.beginPath()
    this.celle(p, vis, null, (x, y, px, py) => {
      const s = p.suolo[y * p.w + x]
      if (s !== 'pavimento' && s !== 'strada') return
      if (this.suoloDi(p, x - 1, y) === 'muro') ctx.rect(px, py, c * 0.14, c)
      if (this.suoloDi(p, x, y - 1) === 'muro') ctx.rect(px, py, c, c * 0.14)
    })
    ctx.fill()
  }

  /* la griglia si vede appena, e solo dove si cammina: serve a contare i
     passi, non a decorare (sul mare farebbe una piscina) */
  griglia(p, vis, tema) {
    const { ctx, cella: c } = this
    const pav = (x, y) => this.suoloDi(p, x, y) === 'pavimento'
    ctx.strokeStyle = tema.griglia
    ctx.lineWidth = 1
    ctx.beginPath()
    this.celle(p, vis, 'pavimento', (x, y, px, py) => {
      if (pav(x - 1, y)) { ctx.moveTo(px + 0.5, py); ctx.lineTo(px + 0.5, py + c) }
      if (pav(x, y - 1)) { ctx.moveTo(px, py + 0.5); ctx.lineTo(px + c, py + 0.5) }
    })
    ctx.stroke()
  }

  /* ── gli schizzi: una cassa finita in mare lascia gli anelli sull'acqua.
     Si ricordano qui e non nel quadro, così durano il loro tempo anche se
     la regia toglie il volo appena atterrato ── */
  acqua(t) {
    const { ctx, cella: c } = this
    for (const [chiave, s] of this.schizzi) {
      const e = t - s.dal
      if (e > 1300) { this.schizzi.delete(chiave); continue }
      if (e < 0) continue
      const f = e / 1300
      ctx.lineWidth = Math.max(1.2, c * 0.06)
      for (let i = 0; i < 3; i++) {
        const g = f * 1.25 - i * 0.18
        if (g <= 0 || g >= 1) continue
        ctx.strokeStyle = `rgba(255,255,255,${(1 - g) * 0.85})`
        ctx.beginPath()
        ctx.ellipse(s.x, s.y, c * (0.12 + g * 0.5), c * (0.08 + g * 0.3), 0, 0, Math.PI * 2)
        ctx.stroke()
      }
      /* e le gocce, nei primi istanti */
      if (e < 450) {
        const g = e / 450
        ctx.fillStyle = `rgba(225,242,255,${1 - g})`
        for (let i = 0; i < 6; i++) {
          const a = (i / 6) * Math.PI * 2 + 0.4
          const r = c * 0.45 * g
          ctx.beginPath()
          ctx.arc(s.x + Math.cos(a) * r, s.y + Math.sin(a) * r * 0.6 - Math.sin(g * Math.PI) * c * 0.35, Math.max(1, c * 0.05), 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }
  }

  /* ── i segni per terra: dove cala la gru, e dove si mettono i clienti ── */
  segniPerTerra(p) {
    const { ctx, cella: c } = this
    if (p.puntoGru) {
      /* quattro squadrette gialle e nere, quelle dei piazzali: dicono
         «qui scende qualcosa» senza sembrare una cassa da mettere */
      const px = p.puntoGru.x * c, py = p.puntoGru.y * c
      const m = c * 0.08, l = c * 0.26, s = c * 0.08
      ctx.fillStyle = '#f2b632'
      ctx.strokeStyle = 'rgba(55,38,0,.6)'
      ctx.lineWidth = Math.max(1, c * 0.03)
      for (const [sx, sy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
        const ax = sx ? px + c - m : px + m, ay = sy ? py + c - m : py + m
        const dx = sx ? -1 : 1, dy = sy ? -1 : 1
        ctx.beginPath()
        ctx.moveTo(ax, ay)
        ctx.lineTo(ax + dx * l, ay)
        ctx.lineTo(ax + dx * l, ay + dy * s)
        ctx.lineTo(ax + dx * s, ay + dy * s)
        ctx.lineTo(ax + dx * s, ay + dy * l)
        ctx.lineTo(ax, ay + dy * l)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
      }
    }
    if (p.puntoClienti) {
      /* lo zerbino: il posto del cliente si vede anche quando è vuoto */
      const cx = (p.puntoClienti.x + 0.5) * c, cy = (p.puntoClienti.y + 0.5) * c
      ctx.fillStyle = '#9c7b58'
      rett(ctx, cx - c * 0.36, cy - c * 0.26, c * 0.72, c * 0.52, c * 0.08)
      ctx.fill()
      ctx.strokeStyle = '#7a5e40'
      ctx.lineWidth = Math.max(1, c * 0.03)
      ctx.stroke()
      ctx.beginPath()
      for (let i = 1; i < 6; i++) {
        const x = cx - c * 0.36 + (c * 0.72 * i) / 6
        ctx.moveTo(x, cy - c * 0.18); ctx.lineTo(x, cy + c * 0.18)
      }
      ctx.strokeStyle = 'rgba(80,58,35,.45)'
      ctx.stroke()
    }
  }

  /* ═══════════ gli arredi ═══════════ */
  arredi(p, q, t, vis, inVolo, inArrivo) {
    for (let y = vis.y0; y <= vis.y1; y++) for (let x = vis.x0; x <= vis.x1; x++) {
      const a = p.arredo[y * p.w + x]
      if (!a || inArrivo.has(y * p.w + x)) continue
      if (a.tipo === 'scaffale') this.scaffale(x, y)
      else if (a.tipo === 'bancone') this.bancone(p, x, y)
      else if (a.tipo === 'nastro') this.nastro(p, x, y, a, q, t)
      else if (a.tipo === 'cassone') this.cassone(p, x, y, a, inVolo)
    }
  }

  /* lo scaffale: un telaio scuro con tre listelli, i quattro montanti agli
     angoli; fra un listello e l'altro si vede il buio di sotto */
  scaffale(x, y) {
    const { ctx, cella: c } = this
    const m = c * 0.07, l = c - 2 * m, X = x * c + m, Y = y * c + m
    ctx.fillStyle = 'rgba(40,25,10,.22)'
    rett(ctx, X + c * 0.05, Y + c * 0.07, l, l, c * 0.06)
    ctx.fill()
    ctx.fillStyle = '#4b311c'
    rett(ctx, X, Y, l, l, c * 0.06)
    ctx.fill()
    const g = c * 0.05, hs = (l - g * 4) / 3
    for (let i = 0; i < 3; i++) {
      const sy = Y + g + i * (hs + g)
      ctx.fillStyle = '#9a6a40'
      ctx.fillRect(X + g * 0.7, sy, l - g * 1.4, hs)
      ctx.fillStyle = '#b9865b'
      ctx.fillRect(X + g * 0.7, sy, l - g * 1.4, Math.max(1, hs * 0.22))
    }
    ctx.fillStyle = '#35220f'
    const s = c * 0.13
    for (const [ax, ay] of [[X, Y], [X + l - s, Y], [X, Y + l - s], [X + l - s, Y + l - s]]) ctx.fillRect(ax, ay, s, s)
  }

  /* il bancone: legno lucido. Più celle di bancone in fila fanno un
     bancone solo — gli spigoli si arrotondano solo dove finisce, e la
     faccia davanti (più scura) solo dove sotto non continua */
  bancone(p, x, y) {
    const { ctx, cella: c } = this
    const px = x * c, py = y * c
    const vicino = d => {
      const [dx, dy] = DIREZIONI[d]
      const nx = x + dx, ny = y + dy
      return p.dentro(nx, ny) && !!p.arredo[ny * p.w + nx] && p.arredo[ny * p.w + nx].tipo === 'bancone'
    }
    const su = vicino('su'), giu = vicino('giu'), sx = vicino('sinistra'), dx = vicino('destra')
    const m = c * 0.06, r = c * 0.12
    const x0 = px + (sx ? 0 : m), x1 = px + c - (dx ? 0 : m)
    const y0 = py + (su ? 0 : m), y1 = py + c - (giu ? 0 : m)
    const raggi = [!su && !sx ? r : 0, !su && !dx ? r : 0, !giu && !dx ? r : 0, !giu && !sx ? r : 0]
    ctx.fillStyle = 'rgba(40,25,10,.22)'
    ctx.fillRect(x0 + c * 0.05, y0 + c * 0.07, x1 - x0, y1 - y0)
    ctx.fillStyle = '#74441f'
    rett(ctx, x0, y0, x1 - x0, y1 - y0, raggi)
    ctx.fill()
    const fronte = giu ? 0 : c * 0.15
    ctx.fillStyle = '#b8793f'
    rett(ctx, x0, y0, x1 - x0, y1 - y0 - fronte, [raggi[0], raggi[1], giu ? 0 : r * 0.5, giu ? 0 : r * 0.5])
    ctx.fill()
    /* le venature, e la luce sul piano: è quello che lo fa «lucido» */
    ctx.strokeStyle = 'rgba(110,62,25,.35)'
    ctx.lineWidth = 1
    ctx.beginPath()
    for (const f of [0.34, 0.62]) {
      const vy = y0 + (y1 - y0 - fronte) * f + (caso(x, y, 7) - 0.5) * c * 0.06
      ctx.moveTo(x0 + c * 0.08, vy)
      ctx.quadraticCurveTo((x0 + x1) / 2, vy + c * 0.05, x1 - c * 0.08, vy)
    }
    ctx.stroke()
    ctx.fillStyle = 'rgba(255,236,200,.4)'
    if (!su) ctx.fillRect(x0 + (sx ? 0 : r * 0.6), y0 + c * 0.05, x1 - x0 - (sx ? 0 : r * 0.6) - (dx ? 0 : r * 0.6), Math.max(1, c * 0.06))
    ctx.fillStyle = 'rgba(255,255,255,.14)'
    ctx.beginPath()
    ctx.moveTo(px + c * 0.25, y0)
    ctx.lineTo(px + c * 0.45, y0)
    ctx.lineTo(px + c * 0.2, y1 - fronte)
    ctx.lineTo(px + c * 0.0, y1 - fronte)
    ctx.closePath()
    ctx.fill()
  }

  /* ── il nastro ──
     Si disegna «in avanti verso destra» e si gira. I listelli e le frecce
     scorrono di una cella a ogni scatto (`nastroDal`), e il disegno si
     ripete ogni mezza cella: finito lo scatto è identico a prima, quindi
     non serve sapere quanti scatti ci sono stati. Il nastro sta fermo fra
     uno scatto e l'altro, come la cassa che ci sta sopra. */
  nastro(p, x, y, a, q, t) {
    const { ctx, cella: c } = this
    const [dx, dy] = DIREZIONI[a.verso] || DIREZIONI.destra
    const eNastro = (nx, ny) => p.dentro(nx, ny) && !!p.arredo[ny * p.w + nx] && p.arredo[ny * p.w + nx].tipo === 'nastro'
    /* davanti c'è un altro nastro, o un cassone in cui scaricare: in tutti
       e due i casi il nastro non finisce nel vuoto, e il rullo non c'è */
    const avanti = eNastro(x + dx, y + dy) || this.scaricaIn(p, x, y, a)
    let dietro = false
    for (const d of Object.keys(DIREZIONI)) {
      const [ex, ey] = DIREZIONI[d]
      const nx = x + ex, ny = y + ey
      if (!eNastro(nx, ny)) continue
      const [bx, by] = DIREZIONI[p.arredo[ny * p.w + nx].verso] || [0, 0]
      if (nx + bx === x && ny + by === y) dietro = true
    }
    const dura = q.passo || 230
    const f = q.nastroDal ? fra((t - q.nastroDal) / dura, 0, 1) : 1
    const scatto = morbido(f) * c
    const h = c / 2, larga = c * 0.34
    ctx.save()
    ctx.translate((x + 0.5) * c, (y + 0.5) * c)
    ctx.rotate(DA_DESTRA[a.verso] || 0)
    /* il telaio, con le sponde */
    ctx.fillStyle = 'rgba(30,30,35,.25)'
    ctx.fillRect(-h + c * 0.04, -h + c * 0.08, c, c - c * 0.06)
    ctx.fillStyle = '#8a9199'
    ctx.fillRect(-h, -h + c * 0.05, c, c - c * 0.1)
    ctx.fillStyle = '#6b727a'
    ctx.fillRect(-h, -larga - c * 0.03, c, c * 0.03)
    ctx.fillRect(-h, larga, c, c * 0.03)
    ctx.fillStyle = '#b3b9c0'
    ctx.fillRect(-h, -h + c * 0.05, c, Math.max(1, c * 0.035))
    /* il tappeto, con listelli e frecce che scorrono */
    ctx.save()
    ctx.beginPath()
    ctx.rect(-h, -larga, c, 2 * larga)
    ctx.clip()
    ctx.fillStyle = '#3b4047'
    ctx.fillRect(-h, -larga, c, 2 * larga)
    ctx.fillStyle = '#4b5159'
    const ps = c / 4
    for (let k = -1; k <= 4; k++) ctx.fillRect(-h + k * ps + (scatto % ps), -larga, Math.max(1, c * 0.035), 2 * larga)
    ctx.strokeStyle = '#b4bbc3'
    ctx.lineWidth = Math.max(1.5, c * 0.07)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    const pf = c / 2
    for (let k = -1; k <= 2; k++) {
      const ax = -h + k * pf + (scatto % pf) + pf * 0.62
      ctx.moveTo(ax - c * 0.12, -larga * 0.56)
      ctx.lineTo(ax, 0)
      ctx.lineTo(ax - c * 0.12, larga * 0.56)
    }
    ctx.stroke()
    ctx.restore()
    /* i rulli: in fondo dove il nastro finisce, in testa dove comincia */
    const rullo = rx => {
      ctx.fillStyle = '#5c636b'
      ctx.fillRect(rx, -h + c * 0.05, c * 0.11, c - c * 0.1)
      ctx.fillStyle = '#c2c8ce'
      ctx.fillRect(rx + c * 0.02, -h + c * 0.05, c * 0.035, c - c * 0.1)
    }
    if (!avanti) rullo(h - c * 0.11)
    if (!dietro) rullo(-h)
    ctx.restore()
    ctx.lineCap = 'butt'
  }

  /* il cassone in fondo a un nastro, se c'è: è lì che il nastro scarica */
  scaricaIn(p, x, y, a) {
    const [dx, dy] = DIREZIONI[a.verso] || DIREZIONI.destra
    const nx = x + dx, ny = y + dy
    const b = p.dentro(nx, ny) && p.arredo[ny * p.w + nx]
    return b && b.tipo === 'cassone' ? b : null
  }

  /* ── gli scivoli ──
     Dove un nastro scarica in un cassone, la fine del nastro diventa uno
     scivolo che entra oltre il bordo del cassone: si vede che le casse
     finiscono lì dentro. Si disegnano dopo tutti gli arredi, perché il
     cassone può venire prima o dopo il nastro nel giro delle caselle, e
     lo scivolo deve stargli sopra in tutti e due i casi. */
  scivoli(p, vis) {
    const { ctx, cella: c } = this
    const h = c / 2, larga = c * 0.34
    for (let y = vis.y0; y <= vis.y1; y++) for (let x = vis.x0; x <= vis.x1; x++) {
      const a = p.arredo[y * p.w + x]
      if (!a || a.tipo !== 'nastro' || !this.scaricaIn(p, x, y, a)) continue
      ctx.save()
      ctx.translate((x + 0.5) * c, (y + 0.5) * c)
      ctx.rotate(DA_DESTRA[a.verso] || 0)
      const fondo = h + c * 0.22
      ctx.fillStyle = 'rgba(30,30,35,.25)'
      ctx.fillRect(h, -larga + c * 0.05, c * 0.24, 2 * larga)
      ctx.fillStyle = '#80878f'
      ctx.beginPath()
      ctx.moveTo(h - c * 0.02, -larga - c * 0.05)
      ctx.lineTo(fondo, -larga * 0.82)
      ctx.lineTo(fondo, larga * 0.82)
      ctx.lineTo(h - c * 0.02, larga + c * 0.05)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = '#3b4047'
      ctx.beginPath()
      ctx.moveTo(h - c * 0.02, -larga)
      ctx.lineTo(fondo - c * 0.04, -larga * 0.7)
      ctx.lineTo(fondo - c * 0.04, larga * 0.7)
      ctx.lineTo(h - c * 0.02, larga)
      ctx.closePath()
      ctx.fill()
      /* il labbro dello scivolo, lucido */
      ctx.fillStyle = '#c9ced4'
      ctx.fillRect(fondo - c * 0.04, -larga * 0.82, c * 0.04, larga * 1.64)
      ctx.restore()
    }
  }

  /* ── i cassoni ──
     Quattro figure per la stessa cosa: un posto che tiene tante casse.
     Se accetta un colore solo, quel colore lo porta addosso in grande — il
     bordo del cassone, le sponde del camion, la mastra della stiva, la
     fascia sulla porta — e di nuovo nell'etichetta con il conto. */
  cassone(p, x, y, a, inVolo) {
    const pila = p.pile[y * p.w + x]
    let cima = null
    for (let i = pila.length - 1; i >= 0; i--) if (!inVolo.has(pila[i].id)) { cima = pila[i]; break }
    const col = a.colore ? colore(a.colore) : null
    const figura = a.figura || 'cassone'
    /* nella buca le lettere non si vedono: sono dentro. Si vede solo che
       ce n'è qualcuna, da un foglio che spunta dalla fessura */
    if (figura === 'buca') return this.buca(x, y, !!cima)
    if (figura === 'camion') this.camion(p, x, y, col)
    else if (figura === 'stiva') this.stiva(x, y, col)
    else if (figura === 'magazzino') this.portaMagazzino(p, x, y, col)
    else this.cassoneDiLegno(x, y, col)
    if (cima) {
      const d = this.contenuto(p, x, y)
      this.cosa(d.x, d.y, d.s, cima, false)
      if (figura === 'stiva') {
        /* giù nella stiva è buio: la cassa si intravede, non si vede */
        this.ctx.fillStyle = 'rgba(8,12,18,.3)'
        this.ctx.fillRect(x * this.cella + this.cella * 0.2, y * this.cella + this.cella * 0.2, this.cella * 0.6, this.cella * 0.6)
      }
      if (figura === 'cassone') this.ombraInterna(x, y)
    }
  }

  /* dove sta, e quanto è grande, la cassa in cima a un cassone: serve al
     cassone per disegnarla e ai voli per farla atterrare lì */
  contenuto(p, x, y) {
    const c = this.cella
    const a = p.arredo[y * p.w + x]
    const cx = (x + 0.5) * c, cy = (y + 0.5) * c
    if (!a || a.tipo !== 'cassone') return { x: cx, y: cy, s: 1 }
    const figura = a.figura || 'cassone'
    if (figura === 'camion') {
      /* il pianale sta dietro la cabina, che guarda dalla parte di `angolo` */
      const angolo = this.angoloCabina(p, x, y)
      return { x: cx - Math.sin(angolo) * c * 0.155, y: cy + Math.cos(angolo) * c * 0.155, s: 0.7 }
    }
    if (figura === 'magazzino') {
      const [ux, uy] = DIREZIONI[this.latoEsterno(p, x, y)]
      return { x: cx - ux * c * 0.13, y: cy - uy * c * 0.13, s: 0.72 }
    }
    /* nella buca si entra dalla fessura, e la lettera ci sparisce dentro */
    if (figura === 'buca') return { x: cx, y: y * c + c * 0.21, s: 0.42 }
    return { x: cx, y: cy + (figura === 'cassone' ? c * 0.01 : 0), s: figura === 'stiva' ? 0.7 : 0.8 }
  }

  /* da che parte guarda la cabina di un camion: sulla piazzola verso
     l'uscita della sua strada, altrove verso il muro o il bordo */
  angoloCabina(p, x, y) {
    if (this.suoloDi(p, x, y) === 'strada') return this.percorso(p, x, y).tratti[0].angolo
    return DA_SU[this.latoEsterno(p, x, y)]
  }

  /* il lato «di fuori» di una cella: dove c'è un muro, il mare o il bordo.
     Lì va la cabina del camion e la porta del magazzino, così il cassone
     si apre verso il pavimento dove lavora il robot */
  latoEsterno(p, x, y) {
    const m = this.memo(p)
    const chiave = y * p.w + x
    if (!m.esterni) m.esterni = new Map()
    if (m.esterni.has(chiave)) return m.esterni.get(chiave)
    let lato = 'su'
    for (const d of ['su', 'destra', 'sinistra', 'giu']) {
      const [dx, dy] = DIREZIONI[d]
      const s = this.suoloDi(p, x + dx, y + dy)
      if (s === null || s === 'muro' || s === 'mare') { lato = d; break }
    }
    m.esterni.set(chiave, lato)
    return lato
  }

  memo(p) {
    let m = MEMO.get(p)
    if (!m) MEMO.set(p, (m = {}))
    return m
  }

  cassoneDiLegno(x, y, col) {
    const { ctx, cella: c } = this
    const m = c * 0.05, l = c - 2 * m, X = x * c + m, Y = y * c + m
    ctx.fillStyle = 'rgba(40,25,10,.24)'
    rett(ctx, X + c * 0.05, Y + c * 0.07, l, l, c * 0.08)
    ctx.fill()
    ctx.fillStyle = '#946439'
    rett(ctx, X, Y, l, l, c * 0.08)
    ctx.fill()
    ctx.strokeStyle = '#5a3a1e'
    ctx.lineWidth = Math.max(1, c * 0.04)
    ctx.stroke()
    const b = c * 0.13
    /* le assi del bordo */
    ctx.strokeStyle = 'rgba(70,42,18,.5)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(X + b / 2, Y + b / 2); ctx.lineTo(X + l - b / 2, Y + b / 2); ctx.lineTo(X + l - b / 2, Y + l - b / 2)
    ctx.lineTo(X + b / 2, Y + l - b / 2); ctx.closePath()
    ctx.stroke()
    if (col) {
      ctx.strokeStyle = col.ombra
      ctx.lineWidth = c * 0.12
      rett(ctx, X + b / 2, Y + b / 2, l - b, l - b, c * 0.04)
      ctx.stroke()
      ctx.strokeStyle = col.tinta
      ctx.lineWidth = c * 0.08
      ctx.stroke()
    }
    ctx.fillStyle = '#3d2816'
    rett(ctx, X + b, Y + b, l - 2 * b, l - 2 * b, c * 0.03)
    ctx.fill()
  }

  /* dentro un cassone aperto le sponde fanno ombra sulla cassa */
  ombraInterna(x, y) {
    const { ctx, cella: c } = this
    const b = c * 0.18, X = x * c + b, Y = y * c + b, l = c - 2 * b
    ctx.fillStyle = 'rgba(0,0,0,.26)'
    ctx.fillRect(X, Y, l, c * 0.07)
    ctx.fillRect(X, Y + c * 0.07, c * 0.06, l - c * 0.07)
  }

  /* il camion: cabina dalla parte di fuori, pianale verso il pavimento */
  camion(p, x, y, col) {
    const c = this.cella
    this.figuraCamion((x + 0.5) * c, (y + 0.5) * c, this.angoloCabina(p, x, y), col)
  }

  /* il camion visto da sopra, con la cabina verso `angolo` (0 = in su):
     lo stesso fermo sulla piazzola e in viaggio sulla strada */
  figuraCamion(cx, cy, angolo, col) {
    const { ctx, cella: c } = this
    /* l'ombra cade sempre in basso a destra, anche quando il camion gira */
    ctx.save()
    ctx.translate(cx + c * 0.05, cy + c * 0.07)
    ctx.rotate(angolo)
    ctx.fillStyle = 'rgba(30,25,20,.25)'
    rett(ctx, -c * 0.41, -c * 0.5, c * 0.82, c * 0.98, c * 0.09)
    ctx.fill()
    ctx.restore()
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(angolo)
    /* le ruote sporgono appena dai fianchi */
    ctx.fillStyle = '#22262c'
    for (const wy of [-0.33, 0.3]) for (const wx of [-0.47, 0.39]) ctx.fillRect(wx * c, wy * c - c * 0.09, c * 0.08, c * 0.18)
    /* il pianale, di legno, con le sponde */
    ctx.fillStyle = '#a07549'
    ctx.fillRect(-c * 0.4, -c * 0.16, c * 0.8, c * 0.63)
    ctx.strokeStyle = 'rgba(80,50,22,.45)'
    ctx.lineWidth = 1
    ctx.beginPath()
    for (const lx of [-0.2, 0, 0.2]) { ctx.moveTo(lx * c, -c * 0.14); ctx.lineTo(lx * c, c * 0.45) }
    ctx.stroke()
    ctx.lineWidth = c * (col ? 0.1 : 0.07)
    ctx.strokeStyle = col ? col.tinta : '#5e4127'
    ctx.strokeRect(-c * 0.4 + ctx.lineWidth / 2, -c * 0.16 + ctx.lineWidth / 2, c * 0.8 - ctx.lineWidth, c * 0.63 - ctx.lineWidth)
    if (col) {
      ctx.lineWidth = 1
      ctx.strokeStyle = col.ombra
      ctx.strokeRect(-c * 0.4 + 0.5, -c * 0.16 + 0.5, c * 0.8 - 1, c * 0.63 - 1)
    }
    /* la cabina: tetto chiaro, parabrezza scuro davanti, e gli specchietti
       che sporgono — sono loro che dicono «camion» visto da sopra */
    ctx.fillStyle = '#2b3036'
    ctx.fillRect(-c * 0.47, -c * 0.44, c * 0.1, c * 0.05)
    ctx.fillRect(c * 0.37, -c * 0.44, c * 0.1, c * 0.05)
    ctx.fillStyle = col ? col.tinta : '#dde3e8'
    rett(ctx, -c * 0.38, -c * 0.49, c * 0.76, c * 0.31, c * 0.09)
    ctx.fill()
    ctx.strokeStyle = col ? col.ombra : '#56626e'
    ctx.lineWidth = Math.max(1, c * 0.04)
    ctx.stroke()
    ctx.fillStyle = '#3f5a70'
    rett(ctx, -c * 0.3, -c * 0.47, c * 0.6, c * 0.09, c * 0.04)
    ctx.fill()
    ctx.fillStyle = 'rgba(255,255,255,.35)'
    ctx.fillRect(-c * 0.24, -c * 0.34, c * 0.48, c * 0.05)
    ctx.restore()
  }

  /* la stiva: un pezzo di ponte d'acciaio, la mastra intorno al boccaporto
     e il buio della nave sotto */
  stiva(x, y, col) {
    const { ctx, cella: c } = this
    const px = x * c, py = y * c
    ctx.fillStyle = '#586672'
    ctx.fillRect(px + c * 0.02, py + c * 0.02, c * 0.96, c * 0.96)
    ctx.strokeStyle = '#3d4953'
    ctx.lineWidth = Math.max(1, c * 0.03)
    ctx.strokeRect(px + c * 0.02, py + c * 0.02, c * 0.96, c * 0.96)
    ctx.fillStyle = '#8d9aa5'
    for (const [rx, ry] of [[0.08, 0.08], [0.92, 0.08], [0.08, 0.92], [0.92, 0.92], [0.5, 0.08], [0.5, 0.92], [0.08, 0.5], [0.92, 0.5]]) {
      ctx.beginPath()
      ctx.arc(px + rx * c, py + ry * c, Math.max(0.8, c * 0.025), 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = col ? col.tinta : '#2f3a44'
    rett(ctx, px + c * 0.13, py + c * 0.13, c * 0.74, c * 0.74, c * 0.06)
    ctx.fill()
    ctx.strokeStyle = col ? col.ombra : '#1a2229'
    ctx.lineWidth = Math.max(1, c * 0.04)
    ctx.stroke()
    ctx.fillStyle = '#11171c'
    ctx.fillRect(px + c * 0.2, py + c * 0.2, c * 0.6, c * 0.6)
  }

  /* la porta del magazzino: la saracinesca dalla parte del muro, e davanti
     il bancale dove si posano le casse */
  portaMagazzino(p, x, y, col) {
    const { ctx, cella: c } = this
    const lato = this.latoEsterno(p, x, y)
    ctx.save()
    ctx.translate((x + 0.5) * c, (y + 0.5) * c)
    ctx.rotate(DA_SU[lato])
    /* la piazzola dipinta per terra: bianca, o del colore che accetta — è
       la parte che si vede sempre, anche sotto l'etichetta */
    ctx.fillStyle = 'rgba(40,30,20,.12)'
    ctx.fillRect(-c * 0.47, -c * 0.47, c * 0.94, c * 0.94)
    if (col) {
      ctx.strokeStyle = col.ombra
      ctx.lineWidth = Math.max(2, c * 0.1)
      ctx.strokeRect(-c * 0.43, -c * 0.43, c * 0.86, c * 0.86)
    }
    ctx.strokeStyle = col ? col.tinta : 'rgba(255,255,255,.7)'
    ctx.lineWidth = Math.max(1, c * (col ? 0.065 : 0.035))
    ctx.setLineDash([c * 0.1, c * 0.07])
    ctx.strokeRect(-c * 0.43, -c * 0.43, c * 0.86, c * 0.86)
    ctx.setLineDash([])
    ctx.fillStyle = '#98a1a9'
    ctx.fillRect(-c * 0.48, -c * 0.5, c * 0.96, c * 0.25)
    ctx.strokeStyle = '#6f7880'
    ctx.lineWidth = 1
    ctx.beginPath()
    for (let i = 1; i < 5; i++) { ctx.moveTo(-c * 0.48, -c * 0.5 + i * c * 0.05); ctx.lineTo(c * 0.48, -c * 0.5 + i * c * 0.05) }
    ctx.stroke()
    ctx.fillStyle = '#4a5058'
    ctx.fillRect(-c * 0.5, -c * 0.5, c * 0.07, c * 0.29)
    ctx.fillRect(c * 0.43, -c * 0.5, c * 0.07, c * 0.29)
    if (col) {
      ctx.fillStyle = col.tinta
      ctx.fillRect(-c * 0.43, -c * 0.42, c * 0.86, c * 0.11)
      ctx.strokeStyle = col.ombra
      ctx.lineWidth = Math.max(1, c * 0.03)
      ctx.strokeRect(-c * 0.43, -c * 0.42, c * 0.86, c * 0.11)
    }
    /* il bancale: tre assi con le fessure */
    ctx.fillStyle = '#6f5334'
    ctx.fillRect(-c * 0.36, -c * 0.17, c * 0.72, c * 0.6)
    ctx.fillStyle = '#caa26c'
    for (let i = 0; i < 3; i++) ctx.fillRect(-c * 0.36 + i * c * 0.255, -c * 0.17, c * 0.21, c * 0.6)
    ctx.restore()
  }

  /* La buca delle lettere, in piedi e un po' di sbieco come il robot:
     vista proprio da sopra sarebbe una scatola qualunque, ed è il davanti
     — la fessura, il numero — che la fa buca. Sopra il coperchio con la
     fessura e la sua linguetta d'ottone, davanti il posto per il numero:
     quello, che è l'indirizzo e va letto prima di tutto il resto, lo
     mette `etichette`, grande. */
  buca(x, y, piena) {
    const { ctx, cella: c } = this
    const px = x * c, py = y * c
    const X = px + c * 0.13, W = c * 0.74
    const cima = py + c * 0.06, spigolo = py + c * 0.33, fondo = py + c * 0.94
    ctx.fillStyle = 'rgba(30,25,20,.25)'
    rett(ctx, X + c * 0.06, cima + c * 0.1, W, fondo - cima, c * 0.12)
    ctx.fill()
    /* il davanti, più scuro */
    ctx.fillStyle = BUCA.corpo
    rett(ctx, X, cima, W, fondo - cima, c * 0.12)
    ctx.fill()
    ctx.strokeStyle = BUCA.bordo
    ctx.lineWidth = Math.max(1, c * 0.04)
    ctx.stroke()
    /* il coperchio, tondo davanti, con la luce sopra */
    ctx.fillStyle = BUCA.coperchio
    ctx.beginPath()
    ctx.moveTo(X, spigolo)
    ctx.lineTo(X, cima + c * 0.12)
    ctx.quadraticCurveTo(X, cima, X + c * 0.12, cima)
    ctx.lineTo(X + W - c * 0.12, cima)
    ctx.quadraticCurveTo(X + W, cima, X + W, cima + c * 0.12)
    ctx.lineTo(X + W, spigolo)
    ctx.quadraticCurveTo(X + W / 2, spigolo + c * 0.07, X, spigolo)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    const fx = X + W * 0.2, fw = W * 0.6, fh = Math.max(2, c * 0.07), fy = cima + c * 0.12
    ctx.fillStyle = BUCA.fessura
    rett(ctx, fx, fy, fw, fh, fh / 2)
    ctx.fill()
    ctx.fillStyle = BUCA.ottone
    ctx.fillRect(fx + c * 0.02, fy + fh + c * 0.015, fw - c * 0.04, Math.max(1, c * 0.03))
    if (piena) {
      /* una lettera che spunta dalla fessura: dentro c'è posta */
      ctx.save()
      ctx.translate(px + c * 0.5, fy + fh / 2)
      ctx.rotate(-0.1)
      ctx.fillStyle = '#fffdf6'
      ctx.fillRect(-c * 0.12, -c * 0.09, c * 0.24, c * 0.09)
      ctx.strokeStyle = '#a79f90'
      ctx.lineWidth = Math.max(0.8, c * 0.02)
      ctx.strokeRect(-c * 0.12, -c * 0.09, c * 0.24, c * 0.09)
      ctx.restore()
    }
  }

  /* il numero di un cassone che prende solo lettere: la targhetta bianca
     col numero grosso, come il civico di una casa */
  targa(cx, cy, numero, lato) {
    const { ctx } = this
    ctx.fillStyle = CARTA
    ctx.strokeStyle = INCHIOSTRO
    ctx.lineWidth = Math.max(1.2, lato * 0.07)
    rett(ctx, cx - lato / 2, cy - lato / 2, lato, lato, lato * 0.22)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = INCHIOSTRO
    ctx.font = `900 ${Math.round(lato * 0.8)}px system-ui, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(String(numero), cx, cy + lato * 0.05)
  }

  /* ═══════════ le cose ═══════════ */
  cose(p, vis, inVolo) {
    const c = this.cella
    for (let y = vis.y0; y <= vis.y1; y++) for (let x = vis.x0; x <= vis.x1; x++) {
      const k = y * p.w + x
      const pila = p.pile[k]
      if (!pila.length) continue
      const a = p.arredo[k]
      if (a && a.tipo === 'cassone') continue
      let cima = null
      for (let i = pila.length - 1; i >= 0; i--) if (!inVolo.has(pila[i].id)) { cima = pila[i]; break }
      if (cima) this.cosa((x + 0.5) * c, (y + 0.5) * c, 1, cima, true)
    }
  }

  cosa(x, y, scala, cosa, ombra = true) {
    if (!cosa) return
    if (cosa.tipo === 'biglietto') this.biglietto(x, y, scala, cosa.numero, cosa.id || 0, ombra)
    else this.cassa(x, y, LATO_CASSA * this.cella * scala, cosa.colore, ombra)
  }

  /* La cassa vista dall'alto: il telaio del colore, la luce sugli spigoli
     in alto a sinistra, il pannello incassato e le due assi incrociate.
     Il bordo scuro (`ombra`) la stacca da qualunque pavimento, anche la
     cassa bianca sulla graniglia della bottega. */
  cassa(cx, cy, l, chiave, ombra = true) {
    const { ctx } = this
    const col = colore(chiave) || colore('grigio')
    const x = cx - l / 2, y = cy - l / 2, r = l * 0.09
    if (ombra) {
      ctx.fillStyle = 'rgba(35,25,15,.24)'
      rett(ctx, x + l * 0.07, y + l * 0.1, l, l, r)
      ctx.fill()
    }
    ctx.fillStyle = col.ombra
    rett(ctx, x, y, l, l, r)
    ctx.fill()
    const s = l * 0.07
    ctx.fillStyle = col.tinta
    rett(ctx, x, y, l - s, l - s, r)
    ctx.fill()
    const b = l * 0.17
    const ix = x + b, iy = y + b, il = l - s - 2 * b
    if (il > 2) {
      ctx.save()
      ctx.beginPath()
      ctx.rect(ix, iy, il, il)
      ctx.clip()
      ctx.fillStyle = col.ombra
      ctx.globalAlpha = 0.42
      ctx.fillRect(ix, iy, il, il)
      ctx.globalAlpha = 1
      ctx.strokeStyle = col.tinta
      ctx.lineWidth = Math.max(1, l * 0.14)
      ctx.beginPath()
      ctx.moveTo(ix, iy); ctx.lineTo(ix + il, iy + il)
      ctx.moveTo(ix + il, iy); ctx.lineTo(ix, iy + il)
      ctx.stroke()
      ctx.strokeStyle = col.luce
      ctx.lineWidth = Math.max(0.7, l * 0.035)
      ctx.beginPath()
      ctx.moveTo(ix, iy - l * 0.05); ctx.lineTo(ix + il + l * 0.05, iy + il)
      ctx.stroke()
      ctx.restore()
    }
    ctx.fillStyle = col.luce
    ctx.fillRect(x + r * 0.6, y + l * 0.02, l - s - r * 1.2, Math.max(1, l * 0.06))
    ctx.fillRect(x + l * 0.02, y + r * 0.6, Math.max(1, l * 0.06), l - s - r * 1.2)
    ctx.strokeStyle = 'rgba(25,18,10,.45)'
    ctx.lineWidth = Math.max(0.8, l * 0.035)
    rett(ctx, x, y, l, l, r)
    ctx.stroke()
  }

  /* il biglietto: un foglietto bianco un po' storto (sempre dello stesso
     storto: l'angolo viene dal suo id), col numero grande */
  biglietto(cx, cy, scala, numero, id, ombra = true) {
    const { ctx, cella: c } = this
    const w = c * 0.7 * scala, h = c * 0.56 * scala
    const angolo = (((id * 37) % 7) - 3) * 0.045
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(angolo)
    if (ombra) {
      ctx.fillStyle = 'rgba(35,25,15,.22)'
      ctx.fillRect(-w / 2 + c * 0.04, -h / 2 + c * 0.06, w, h)
    }
    const piega = w * 0.22
    ctx.fillStyle = '#fffdf6'
    ctx.beginPath()
    ctx.moveTo(-w / 2, -h / 2)
    ctx.lineTo(w / 2 - piega, -h / 2)
    ctx.lineTo(w / 2, -h / 2 + piega)
    ctx.lineTo(w / 2, h / 2)
    ctx.lineTo(-w / 2, h / 2)
    ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = '#a79f90'
    ctx.lineWidth = Math.max(0.8, c * 0.025)
    ctx.stroke()
    ctx.fillStyle = '#e4dccb'
    ctx.beginPath()
    ctx.moveTo(w / 2 - piega, -h / 2)
    ctx.lineTo(w / 2 - piega, -h / 2 + piega)
    ctx.lineTo(w / 2, -h / 2 + piega)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = INCHIOSTRO
    ctx.font = `800 ${Math.max(7, Math.round(h * 0.82))}px system-ui, sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(String(numero), 0, h * 0.06)
    ctx.restore()
  }

  /* il disegno in trasparenza: la cassa che ci deve finire, tratteggiata.
     Quelle che mancano a sera lampeggiano, come nel cantiere */
  fantasmi(p, q, t, vis, inVolo) {
    const { ctx, cella: c } = this
    for (const [k, chiave] of p.bersaglio) {
      const x = k % p.w, y = Math.floor(k / p.w)
      if (x < vis.x0 || x > vis.x1 || y < vis.y0 || y > vis.y1) continue
      const pila = p.pile[k]
      let cima = null
      for (let i = pila.length - 1; i >= 0; i--) if (!inVolo.has(pila[i].id)) { cima = pila[i]; break }
      if (cima && cima.tipo === 'cassa') continue
      const col = colore(chiave) || colore('grigio')
      const manca = !!q.mancano && q.mancano.some(m => m.x === x && m.y === y)
      const l = LATO_CASSA * c, X = (x + 0.5) * c - l / 2, Y = (y + 0.5) * c - l / 2
      ctx.globalAlpha = manca ? 0.3 + 0.35 * (0.5 + 0.5 * Math.sin(t / 150)) : 0.24
      ctx.fillStyle = col.tinta
      rett(ctx, X, Y, l, l, l * 0.09)
      ctx.fill()
      ctx.globalAlpha = 1
      ctx.strokeStyle = col.ombra
      ctx.lineWidth = Math.max(1.5, c * 0.06)
      ctx.setLineDash([c * 0.14, c * 0.09])
      rett(ctx, X + 1, Y + 1, l - 2, l - 2, l * 0.09)
      ctx.stroke()
      ctx.setLineDash([])
    }
  }

  croci(elenco, t) {
    const { ctx, cella: c } = this
    ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t / 160)
    ctx.strokeStyle = ROSSO
    ctx.lineWidth = Math.max(2, c * 0.12)
    ctx.lineCap = 'round'
    ctx.beginPath()
    for (const { x, y } of elenco) {
      const px = x * c, py = y * c
      ctx.moveTo(px + c * 0.2, py + c * 0.2); ctx.lineTo(px + c * 0.8, py + c * 0.8)
      ctx.moveTo(px + c * 0.8, py + c * 0.2); ctx.lineTo(px + c * 0.2, py + c * 0.8)
    }
    ctx.stroke()
    ctx.globalAlpha = 1
    ctx.lineCap = 'butt'
  }

  /* ═══════════ i camion per strada ═══════════
     Un mezzo è un camion che arriva o che riparte, lungo la sua strada
     (`percorso`): arrivando frena in fondo, ripartendo prende la rincorsa.
     Chi riparte si porta il carico, e se riparte mezzo vuoto se ne va
     sotto la nuvola scura del cliente arrabbiato. Dietro lascia due
     sbuffi di fumo, che dicono da che parte sta andando. Mentre riparte,
     il suo pianale si ricorda in `inPartenza`: l'ultima cassa, se è
     ancora in volo, ci atterra sopra invece che sulla piazzola vuota. */
  mezzi(p, q, t, inVolo) {
    const { ctx, cella: c } = this
    for (const m of q.mezzi || []) {
      if (!m || !Number.isFinite(m.x) || !Number.isFinite(m.y)) continue
      const fine = m.dal + (m.durata || 0)
      if (t >= fine) continue
      const f = fra((t - m.dal) / Math.max(1, m.durata || 1), 0, 1)
      const r = this.percorso(p, m.x, m.y)
      const parte = m.come === 'parte'
      const s = parte ? f * f * r.lung : (1 - frena(f)) * r.lung
      const P = this.lungoLaStrada(r, s)
      const x = P.x * c, y = P.y * c
      if (f > 0 && f < 1) this.fumo(r, s, parte ? -1 : 1, t)
      this.figuraCamion(x, y, P.angolo, m.colore ? colore(m.colore) : null)
      const pianale = { x: x - Math.sin(P.angolo) * c * 0.155, y: y + Math.cos(P.angolo) * c * 0.155, s: 0.7 }
      if (parte && p.dentro(m.x, m.y)) this.inPartenza.set(m.y * p.w + m.x, pianale)
      const carico = (m.carico || []).filter(k => k && !inVolo.has(k.id))
      if (carico.length > 1) this.cosa(pianale.x + c * 0.05, pianale.y + c * 0.05, 0.62, carico[carico.length - 2], false)
      if (carico.length) this.cosa(pianale.x, pianale.y, 0.7, carico[carico.length - 1], false)
      if (parte && m.contento === false) {
        ctx.globalAlpha = f < 0.7 ? 1 : 1 - (f - 0.7) / 0.3
        this.nuvolaScura(x, y - c * 0.85 - f * c * 0.2, c * 0.3)
        ctx.globalAlpha = 1
      }
    }
  }

  /* gli sbuffi dietro al camion, presi lungo la sua strada: dove è appena
     passato, non dove punta la marmitta — è la scia che dice il verso */
  fumo(r, s, verso, t) {
    const { ctx, cella: c } = this
    for (let i = 0; i < 3; i++) {
      const d = s + verso * (0.6 + i * 0.3)
      if (d < 0 || d > r.lung) continue
      const P = this.lungoLaStrada(r, d)
      const dondola = Math.sin(t / 170 + i * 1.7) * c * 0.04
      ctx.fillStyle = `rgba(112,114,120,${0.34 - i * 0.1})`
      ctx.beginPath()
      ctx.arc(P.x * c + dondola, P.y * c - dondola, c * (0.09 + i * 0.045), 0, Math.PI * 2)
      ctx.fill()
    }
  }

  /* ═══════════ la gru ═══════════
     Il braccio arriva da fuori, dal lato dove passa sopra meno cose che
     contano (il pavimento, gli arredi: il mare e i muri no); fra quelli,
     preferisce passare sopra il mare, dove si vede per intero ed è il
     posto delle gru vere, e a pari merito arriva dall'alto dello schermo.
     Sta in alto (`ALTEZZA_GRU`): si disegna spostato verso la cima dello
     schermo, e per terra ne resta l'ombra. Per questo dal basso arriva
     solo se proprio non c'è altro: spostato in su, un braccio che viene
     da sotto passa sopra la sua stessa cella, e copre la cassa calata. */
  latoGru(p) {
    const m = this.memo(p)
    if (m.gru) return m.gru
    const g = p.puntoGru
    let meglio = null
    for (const d of ['su', 'sinistra', 'destra', 'giu']) {
      const [dx, dy] = DIREZIONI[d]
      let copre = 0, lungo = 0, mare = 0
      for (let x = g.x + dx, y = g.y + dy; p.dentro(x, y); x += dx, y += dy) {
        lungo++
        const s = p.suolo[y * p.w + x]
        if (s === 'mare') mare++
        else if (s !== 'muro') copre++
      }
      const voto = copre * 1000 + lungo - Math.min(mare, 4) * 3 + (d === 'giu' ? 2500 : 0)
      if (!meglio || voto < meglio.voto) meglio = { d, voto }
    }
    return (m.gru = meglio.d)
  }

  carrello(p) {
    const c = this.cella
    return { x: (p.puntoGru.x + 0.5) * c, y: (p.puntoGru.y + 0.5) * c - ALTEZZA_GRU * c }
  }

  ombraGru(p) {
    if (!p.puntoGru) return
    const { ctx, cella: c } = this
    const [ux, uy] = DIREZIONI[this.latoGru(p)]
    const gx = (p.puntoGru.x + 0.5) * c + c * 0.16, gy = (p.puntoGru.y + 0.5) * c + c * 0.22
    const lontano = (Math.max(p.w, p.h) + 3) * c
    ctx.strokeStyle = 'rgba(20,20,30,.1)'
    ctx.lineWidth = c * 0.3
    ctx.beginPath()
    ctx.moveTo(gx - ux * c * 0.3, gy - uy * c * 0.3)
    ctx.lineTo(gx + ux * lontano, gy + uy * lontano)
    ctx.stroke()
  }

  gru(p, q, t) {
    if (!p.puntoGru) return
    const { ctx, cella: c } = this
    const [ux, uy] = DIREZIONI[this.latoGru(p)]
    const T = this.carrello(p)
    const lontano = (Math.max(p.w, p.h) + 3) * c
    const F = { x: T.x + ux * lontano, y: T.y + uy * lontano }
    const P = { x: T.x - ux * c * 0.4, y: T.y - uy * c * 0.4 }
    /* il traliccio: due correnti e la zeta fra loro, ancorata alla punta
       così resta ferma anche quando la telecamera scorre */
    const dx = P.x - F.x, dy = P.y - F.y, L = Math.hypot(dx, dy)
    const ax = dx / L, ay = dy / L, nx = -ay, ny = ax, w = c * 0.17
    const punto = (d, s) => [F.x + ax * d + nx * w * s, F.y + ay * d + ny * w * s]
    const traccia = () => {
      ctx.beginPath()
      ctx.moveTo(...punto(0, -1)); ctx.lineTo(...punto(L, -1))
      ctx.moveTo(...punto(0, 1)); ctx.lineTo(...punto(L, 1))
      let s = 1
      ctx.moveTo(...punto(L, -1))
      for (let d = L - c * 0.34; d > -c * 0.34; d -= c * 0.34) {
        ctx.lineTo(...punto(Math.max(0, d), s))
        s = -s
      }
      ctx.moveTo(...punto(L, -1)); ctx.lineTo(...punto(L, 1))
    }
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    traccia()
    ctx.strokeStyle = '#7a4d0c'
    ctx.lineWidth = Math.max(2, c * 0.11)
    ctx.stroke()
    ctx.strokeStyle = '#eba12a'
    ctx.lineWidth = Math.max(1, c * 0.055)
    ctx.stroke()
    ctx.lineCap = 'butt'
    /* il carrello */
    ctx.fillStyle = '#3a3f47'
    rett(ctx, T.x - c * 0.2, T.y - c * 0.15, c * 0.4, c * 0.3, c * 0.06)
    ctx.fill()
    ctx.fillStyle = '#6b727c'
    ctx.fillRect(T.x - c * 0.12, T.y - c * 0.05, c * 0.24, c * 0.1)
    /* il gancio, quando non sta calando niente: a riposo sotto il
       carrello, tirato su quando le casse sono finite */
    const cala = (q.voli || []).some(v => v && v.da === 'gru' && t < v.dal + (v.durata || 0))
    if (cala) return
    const finita = !!p.gru && !p.gru.casse.length
    const giu = T.y + c * (finita ? 0.2 : 0.46)
    ctx.strokeStyle = '#2b2f36'
    ctx.lineWidth = Math.max(1, c * 0.04)
    ctx.beginPath()
    ctx.moveTo(T.x, T.y)
    ctx.lineTo(T.x, giu)
    ctx.stroke()
    this.gancio(T.x, giu)
  }

  gancio(x, y) {
    const { ctx, cella: c } = this
    ctx.strokeStyle = '#4a5058'
    ctx.lineWidth = Math.max(1.5, c * 0.06)
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineTo(x, y + c * 0.08)
    ctx.arc(x - c * 0.06, y + c * 0.08, c * 0.06, 0, Math.PI * 0.95)
    ctx.stroke()
    ctx.lineCap = 'butt'
  }

  /* ═══════════ i clienti ═══════════
     Guardano il bancone, la fila si mette dietro (dalla parte opposta, o
     di fianco se dietro finisce la mappa) e la nuvoletta va dall'unica
     parte che resta libera: né sul bancone, né sulla fila. */
  disposizione(p) {
    const m = this.memo(p)
    if (m.clienti) return m.clienti
    const pc = p.puntoClienti
    const dentro = d => { const [dx, dy] = DIREZIONI[d]; return p.dentro(pc.x + dx, pc.y + dy) }
    let verso = null
    for (const d of ['su', 'sinistra', 'destra', 'giu']) {
      const [dx, dy] = DIREZIONI[d]
      const x = pc.x + dx, y = pc.y + dy
      const a = p.dentro(x, y) && p.arredo[y * p.w + x]
      if (a && a.tipo === 'bancone') { verso = d; break }
    }
    verso = verso || 'su'
    const fila = [OPPOSTO[verso], ...DI_FIANCO[verso]].find(dentro) || OPPOSTO[verso]
    const altri = ['su', 'destra', 'sinistra', 'giu'].filter(d => d !== verso && d !== fila)
    const nuvola = altri.find(dentro) || altri[0]
    /* il «+3» di chi aspetta sta di fianco alla fila, dalla parte opposta
       alla nuvoletta */
    const lato = DI_FIANCO[fila].find(d => d !== nuvola) || DI_FIANCO[fila][0]
    /* quanto posto c'è dietro, fino al bordo: la fila si stringe invece di
       uscire dalla mappa, se no il «+3» finirebbe fuori dal canvas */
    const [fx, fy] = DIREZIONI[fila]
    let spazio = 0.5
    for (let x = pc.x + fx, y = pc.y + fy; p.dentro(x, y); x += fx, y += fy) spazio++
    return (m.clienti = { verso, fila, nuvola, lato, spazio })
  }

  /* quanti della fila si vedono, e a che distanza l'uno dall'altro */
  fila(d, n) {
    const primo = 0.72, largo = 0.52, stretto = 0.4, mezzo = 0.22
    let quanti = Math.min(3, n)
    while (quanti > 1 && primo + stretto * (quanti - 1) + mezzo > d.spazio) quanti--
    const passo = quanti > 1 ? Math.min(largo, (d.spazio - primo - mezzo) / (quanti - 1)) : largo
    return { quanti, primo, passo }
  }

  /* dove sta il cliente al bancone: appena arrivato, fa gli ultimi passi
     dalla testa della fila */
  postoCliente(p, t) {
    const c = this.cella, pc = p.puntoClienti
    const x = (pc.x + 0.5) * c, y = (pc.y + 0.5) * c
    const e = this.cliente ? fra((t - this.cliente.dal) / 380, 0, 1) : 1
    if (e >= 1) return { x, y }
    const [fx, fy] = DIREZIONI[this.disposizione(p).fila]
    const k = 1 - morbido(e)
    return { x: x + fx * c * 0.8 * k, y: y + fy * c * 0.8 * k }
  }

  clienti(p, t) {
    if (!p.puntoClienti || !p.clienti) return
    const c = this.cella
    const d = this.disposizione(p)
    const [fx, fy] = DIREZIONI[d.fila]
    const pc = p.puntoClienti
    const bx = (pc.x + 0.5) * c, by = (pc.y + 0.5) * c
    const persone = []
    /* chi aspetta: gli stessi che conta `porto.inFila()`, presi per nome
       così ognuno ha la sua maglia */
    const attesa = p.clienti.fila.filter(f => f.arriva <= p.t)
    const f = this.fila(d, attesa.length)
    attesa.slice(0, f.quanti).forEach((chi, i) => {
      const passo = f.primo + f.passo * i
      persone.push({ x: bx + fx * c * passo, y: by + fy * c * passo, s: 0.74, id: chi.id })
    })
    const cl = p.clienti.alBancone
    if (cl) persone.push({ ...this.postoCliente(p, t), s: 1, id: cl.id })
    /* chi sta più in alto sullo schermo sta più lontano: si disegna prima */
    persone.sort((a, b) => a.y - b.y)
    for (const pe of persone) this.persona(pe.x, pe.y, pe.s, d.verso, pe.id)
    if (attesa.length > f.quanti) {
      const ultimo = f.primo + f.passo * Math.max(0, f.quanti - 1)
      const [sx, sy] = DIREZIONI[d.lato]
      this.pastiglia(bx + fx * c * ultimo + sx * c * 0.55, by + fy * c * ultimo + sy * c * 0.5 - c * 0.08,
                     `+${attesa.length - f.quanti}`, Math.max(10, c * 0.3), { largo: p.w * c })
    }
  }

  /* una persona di sbieco: spalle, testa, capelli dalla parte della nuca */
  persona(x, y, s, verso, id) {
    const { ctx, cella: c } = this
    const u = c * s
    const n = Math.abs(id | 0)
    const maglia = MAGLIE[(n * 5 + 1) % MAGLIE.length]
    const pelle = PELLI[(n * 3) % PELLI.length]
    const capelli = CAPELLI[(n * 7 + 2) % CAPELLI.length]
    ctx.fillStyle = 'rgba(0,0,0,.18)'
    ctx.beginPath()
    ctx.ellipse(x, y + u * 0.3, u * 0.3, u * 0.1, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = maglia
    rett(ctx, x - u * 0.29, y - u * 0.05, u * 0.58, u * 0.36, u * 0.15)
    ctx.fill()
    ctx.strokeStyle = 'rgba(0,0,0,.28)'
    ctx.lineWidth = Math.max(1, u * 0.035)
    ctx.stroke()
    const hy = y - u * 0.2, r = u * 0.19
    ctx.fillStyle = pelle
    ctx.beginPath()
    ctx.arc(x, hy, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = capelli
    ctx.beginPath()
    if (verso === 'su') {
      ctx.arc(x, hy - u * 0.01, r * 1.02, 0, Math.PI * 2)
    } else if (verso === 'giu') {
      ctx.arc(x, hy - u * 0.02, r * 1.04, Math.PI * 1.02, Math.PI * 1.98)
      ctx.closePath()
    } else {
      const v = verso === 'destra' ? 1 : -1
      ctx.moveTo(x, hy)
      if (v > 0) ctx.arc(x, hy, r * 1.04, Math.PI * 0.62, Math.PI * 1.86)
      else ctx.arc(x, hy, r * 1.04, -Math.PI * 0.86, Math.PI * 0.38)
      ctx.closePath()
    }
    ctx.fill()
    ctx.fillStyle = INCHIOSTRO
    const occhio = Math.max(0.8, u * 0.032)
    if (verso === 'giu') {
      for (const ex of [-0.07, 0.07]) { ctx.beginPath(); ctx.arc(x + ex * u, hy + u * 0.03, occhio, 0, Math.PI * 2); ctx.fill() }
    } else if (verso !== 'su') {
      const v = verso === 'destra' ? 1 : -1
      ctx.beginPath()
      ctx.arc(x + v * u * 0.1, hy + u * 0.02, occhio, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  /* ═══════════ il robot ═══════════
     Lo stesso muratore di latta del cantiere, un po' di sbieco: la testa
     con lo schermo e l'occhio sopra il corpo giallo, le gambe sotto.
     L'occhio guarda verso `verso`; di spalle (in su) si vede la griglia
     sul retro della testa. Quello che tiene in mano sta davanti a lui,
     dalla parte dove guarda — sopra la testa se guarda in su. */
  posRobot(q, p, t) {
    const c = this.cella
    const r = q.robot || p.robot || { x: 0, y: 0 }
    const da = q.robotDa
    let x = r.x, y = r.y, f = 1
    const muove = !!da && q.durata > 0 && (da.x !== r.x || da.y !== r.y)
    if (muove) {
      f = fra((t - q.dal) / q.durata, 0, 1)
      const e = morbido(f)
      x = da.x + (r.x - da.x) * e
      y = da.y + (r.y - da.y) * e
    }
    const cammina = muove && f < 1
    return { x: (x + 0.5) * c, y: (y + 0.5) * c, f, cammina, salto: cammina ? Math.sin(f * Math.PI) * c * 0.05 : 0 }
  }

  manoDi(q, p, t) {
    const c = this.cella
    const R = this.posRobot(q, p, t)
    const o = MANO[q.verso || p.verso] || MANO.destra
    return { x: R.x + o[0] * c, y: R.y - R.salto + o[1] * c }
  }

  robot(p, q, t, inVolo) {
    const { ctx, cella: c } = this
    const R = this.posRobot(q, p, t)
    const verso = MANO[q.verso || p.verso] ? (q.verso || p.verso) : 'destra'
    const orizz = verso === 'destra' || verso === 'sinistra'
    const v = verso === 'sinistra' ? -1 : 1
    const cx = R.x, cy = R.y - R.salto
    const fase = R.cammina ? Math.sin(R.f * Math.PI * 2) : 0
    const mano = p.mano && !inVolo.has(p.mano.id) ? p.mano : null
    const M = this.manoDi(q, p, t)
    const lw = Math.max(1, c * 0.05)

    ctx.fillStyle = 'rgba(0,0,0,.2)'
    ctx.beginPath()
    ctx.ellipse(R.x, R.y + c * 0.35, c * 0.27, c * 0.09, 0, 0, Math.PI * 2)
    ctx.fill()
    /* le gambe: di fianco vanno avanti e indietro, di fronte e di spalle
       si alzano a turno */
    ctx.fillStyle = '#3d4450'
    const lg = c * 0.1
    if (orizz) {
      ctx.fillRect(cx - c * 0.16 + fase * c * 0.06, cy + c * 0.16, lg, c * 0.2)
      ctx.fillRect(cx + c * 0.06 - fase * c * 0.06, cy + c * 0.16, lg, c * 0.2)
    } else {
      ctx.fillRect(cx - c * 0.15, cy + c * 0.16, lg, c * 0.2 - Math.max(0, fase) * c * 0.06)
      ctx.fillRect(cx + c * 0.05, cy + c * 0.16, lg, c * 0.2 - Math.max(0, -fase) * c * 0.06)
    }
    /* guardando in su la cosa sta dietro la testa: si disegna prima */
    if (mano && verso === 'su') this.cosa(M.x, M.y, IN_MANO, mano, false)
    /* il corpo */
    ctx.fillStyle = GIALLO
    ctx.strokeStyle = GIALLO_BORDO
    ctx.lineWidth = lw
    rett(ctx, cx - c * 0.26, cy - c * 0.09, c * 0.52, c * 0.3, c * 0.08)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = 'rgba(138,97,18,.35)'
    ctx.fillRect(cx - c * 0.12, cy + c * 0.03, c * 0.24, Math.max(1, c * 0.04))
    /* le braccia, quando sono vuote: di fianco una sola, verso dove
       guarda; di fronte e di spalle tutte e due, che dondolano */
    ctx.fillStyle = GIALLO_BORDO
    if (!mano) {
      if (orizz) ctx.fillRect(v > 0 ? cx + c * 0.22 : cx - c * 0.36, cy - c * 0.01 + fase * c * 0.02, c * 0.14, c * 0.07)
      else for (const s of [-1, 1]) ctx.fillRect(cx + s * c * 0.3 - c * 0.035, cy - c * 0.05 + s * fase * c * 0.03, c * 0.07, c * 0.16)
    } else if (verso === 'su') {
      for (const s of [-1, 1]) ctx.fillRect(cx + s * c * 0.27 - c * 0.035, cy - c * 0.34, c * 0.07, c * 0.28)
    }
    /* la testa, con lo schermo */
    ctx.fillStyle = '#e9edf2'
    ctx.strokeStyle = '#4a5260'
    rett(ctx, cx - c * 0.22, cy - c * 0.39, c * 0.44, c * 0.31, c * 0.08)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = '#23303d'
    if (orizz) {
      ctx.beginPath()
      ctx.arc(cx + v * c * 0.08, cy - c * 0.23, c * 0.068, 0, Math.PI * 2)
      ctx.fill()
    } else if (verso === 'giu') {
      ctx.beginPath()
      ctx.arc(cx, cy - c * 0.21, c * 0.075, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(cx + c * 0.025, cy - c * 0.235, c * 0.022, 0, Math.PI * 2)
      ctx.fill()
    } else {
      /* di spalle: la griglia sul retro della testa */
      ctx.fillStyle = '#9aa3ae'
      for (let i = 0; i < 3; i++) ctx.fillRect(cx - c * 0.1, cy - c * 0.3 + i * c * 0.06, c * 0.2, Math.max(1, c * 0.03))
    }
    /* l'antenna, con la lucina: rossa quando si è fermato */
    ctx.fillStyle = '#4a5260'
    ctx.fillRect(cx - c * 0.015, cy - c * 0.49, c * 0.03, c * 0.1)
    ctx.fillStyle = q.fermo ? ROSSO : '#ff8a3d'
    ctx.beginPath()
    ctx.arc(cx, cy - c * 0.49, c * 0.05, 0, Math.PI * 2)
    ctx.fill()
    /* la cosa in mano, davanti, e le mani che la stringono ai lati: il
       braccio sotto la cosa, la mano sopra il bordo — sul numero di un
       biglietto non ci va niente */
    if (mano && verso !== 'su') {
      ctx.fillStyle = GIALLO_BORDO
      if (orizz) ctx.fillRect(v > 0 ? cx + c * 0.2 : cx - c * 0.34, cy - c * 0.01, c * 0.14, c * 0.07)
      this.cosa(M.x, M.y, IN_MANO, mano, false)
      ctx.fillStyle = GIALLO_BORDO
      const meta = (LATO_CASSA * c * IN_MANO) / 2
      if (orizz) {
        ctx.fillRect(M.x - v * meta - c * 0.035, M.y - meta * 0.55, c * 0.07, meta * 1.1)
      } else {
        for (const s of [-1, 1]) ctx.fillRect(M.x + s * meta - c * 0.035, M.y - c * 0.08, c * 0.07, c * 0.16)
      }
    }
    if (q.fermo) {
      ctx.fillStyle = ROSSO
      ctx.beginPath()
      ctx.arc(cx + c * 0.36, cy - c * 0.44, c * 0.16, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.font = `bold ${Math.round(c * 0.26)}px system-ui, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('!', cx + c * 0.36, cy - c * 0.43)
    }
  }

  /* ═══════════ le cose in viaggio ═══════════
     Ogni capo di un volo è una cella o uno dei quattro posti con un nome;
     il modo di viaggiare dipende da dove parte e dove arriva: dalla gru
     scende lungo il cavo, verso il mare cade e sparisce, al cliente va in
     mano e sparisce, fra due celle scorre dritta, fra una cella e le mani
     fa un saltello. */
  capo(capo, p, q, t, volo) {
    const c = this.cella
    if (capo === 'mano') { const M = this.manoDi(q, p, t); return { ...M, s: IN_MANO } }
    if (capo === 'gru' && p.puntoGru) {
      /* appesa sotto il carrello, e più grande perché è più in alto */
      const T = this.carrello(p)
      return { x: T.x, y: T.y + c * 0.1 + this.mezzaAltezza(volo && volo.cosa, IN_ALTO), s: IN_ALTO }
    }
    if (capo === 'cliente' && p.puntoClienti) {
      const P = this.postoCliente(p, t)
      return { x: P.x, y: P.y - c * 0.05, s: 0.55 }
    }
    if (capo === 'mare') {
      /* oltre il bordo della mappa per il motore è mare anche lui: lo
         schizzo si tira dentro quanto basta perché se ne vedano gli anelli */
      const m = this.puntoMare(p, q, volo)
      return { x: fra((m.x + 0.5) * c, c * 0.2, (p.w - 0.2) * c), y: fra((m.y + 0.5) * c, c * 0.2, (p.h - 0.2) * c), s: 0.5 }
    }
    if (capo && typeof capo === 'object') {
      /* l'ultima cassa di un camion che si riempie: il camion riparte
         mentre lei è ancora in volo, e lei ci atterra sopra lo stesso */
      const via = p.dentro(capo.x, capo.y) && this.inPartenza.get(capo.y * p.w + capo.x)
      return via || this.contenuto(p, capo.x, capo.y)
    }
    const R = this.posRobot(q, p, t)
    return { x: R.x, y: R.y, s: 1 }
  }

  /* dove finisce in acqua una cosa: in fondo al nastro da cui cade, se no
     nel mare accanto, se no davanti al robot */
  puntoMare(p, q, volo) {
    const da = volo && volo.da
    if (da && typeof da === 'object') {
      const a = p.dentro(da.x, da.y) && p.arredo[da.y * p.w + da.x]
      if (a && a.tipo === 'nastro' && DIREZIONI[a.verso]) {
        const [dx, dy] = DIREZIONI[a.verso]
        return { x: da.x + dx, y: da.y + dy }
      }
      for (const d of ['destra', 'giu', 'sinistra', 'su']) {
        const [dx, dy] = DIREZIONI[d]
        if (this.suoloDi(p, da.x + dx, da.y + dy) === 'mare') return { x: da.x + dx, y: da.y + dy }
      }
      return { x: da.x, y: da.y + 1 }
    }
    const r = q.robot || p.robot || { x: 0, y: 0 }
    const [dx, dy] = DIREZIONI[q.verso] || [0, 1]
    return { x: r.x + dx, y: r.y + dy }
  }

  voli(p, q, t) {
    const { ctx, cella: c } = this
    for (const v of q.voli || []) {
      if (!v || !v.cosa) continue
      const fine = v.dal + (v.durata || 0)
      /* lo schizzo si segna appena si vede il volo, con l'ora in cui la
         cassa toccherà l'acqua: la regia può togliere il volo appena
         finito, e un telefono lento può non avere un fotogramma lì in mezzo */
      if (v.a === 'mare') this.schizzo(v, p, q, t, fine)
      if (t >= fine) continue
      const f = fra((t - v.dal) / Math.max(1, v.durata || 1), 0, 1)
      const A = this.capo(v.da, p, q, t, v), B = this.capo(v.a, p, q, t, v)
      let e = morbido(f), arco = 0, alfa = 1
      if (v.da === 'gru') {
        /* scende piano e frena in fondo, come si posa un carico; l'ombra
           per terra si stringe e si scurisce mentre la cosa si avvicina */
        e = frena(f)
        alfa = f < 0.12 ? f / 0.12 : 1
        const g = 1.25 - 0.25 * e
        const lw = (v.cosa.tipo === 'biglietto' ? c * 0.7 : LATO_CASSA * c) * g
        const lh = (v.cosa.tipo === 'biglietto' ? c * 0.56 : LATO_CASSA * c) * g
        ctx.fillStyle = `rgba(35,25,15,${0.05 + 0.17 * e})`
        rett(ctx, B.x - lw / 2 + c * 0.05, B.y - lh / 2 + c * 0.07, lw, lh, Math.min(lw, lh) * 0.09)
        ctx.fill()
      } else if (v.a === 'mare') {
        e = f * f
        alfa = f < 0.7 ? 1 : 1 - ((f - 0.7) / 0.3) * 0.85
      } else if (v.a === 'cliente') {
        arco = Math.sin(Math.PI * f) * c * 0.3
        alfa = f < 0.65 ? 1 : 1 - (f - 0.65) / 0.35
      } else if (v.da === 'mano' || v.a === 'mano') {
        arco = Math.sin(Math.PI * f) * c * 0.22
      }
      const x = A.x + (B.x - A.x) * e
      const y = A.y + (B.y - A.y) * e - arco
      const s = A.s + (B.s - A.s) * e
      const cima = y - this.mezzaAltezza(v.cosa, s)
      if (v.da === 'gru') {
        const T = this.carrello(p)
        ctx.strokeStyle = '#2b2f36'
        ctx.lineWidth = Math.max(1, c * 0.04)
        ctx.beginPath()
        ctx.moveTo(T.x, T.y)
        ctx.lineTo(x, cima)
        ctx.stroke()
      }
      ctx.globalAlpha = alfa
      this.cosa(x, y, s, v.cosa, v.da !== 'gru' && v.a !== 'mare')
      ctx.globalAlpha = 1
      /* il gancio che la tiene, sopra la cassa */
      if (v.da === 'gru') this.gancio(x, cima - c * 0.1)
    }
  }

  /* mezza altezza di una cosa, a una scala: il gancio della gru e il cavo
     prendono una cassa e un biglietto dal loro bordo di sopra */
  mezzaAltezza(cosa, s) {
    return cosa && cosa.tipo === 'biglietto' ? this.cella * 0.28 * s : (LATO_CASSA * this.cella * s) / 2
  }

  schizzo(v, p, q, t, fine) {
    const chiave = `${v.cosa.id}@${v.dal}`
    if (this.schizzi.has(chiave) || t - fine > 1300) return
    const B = this.capo('mare', p, q, t, v)
    this.schizzi.set(chiave, { x: B.x, y: B.y, dal: fine })
  }

  /* ═══════════ quello che il robot guarda, e legge ═══════════ */

  /* dove disegnare il riquadro di una cella; una cella fuori dalla mappa
     («a destra c'è il bordo?», un passo oltre il bordo) si tira dentro
     finché ne resta una striscia sul bordo: se no il riquadro starebbe
     fuori dal canvas, e l'occhiata non si vedrebbe */
  cellaVisibile(p, x, y) {
    const c = this.cella, dentro = c * 0.24
    return {
      x: fra(x * c, dentro - c, p.w * c - dentro),
      y: fra(y * c, dentro - c, p.h * c - dentro),
    }
  }

  occhiata(p, q, t) {
    const g = q.guarda
    if (!g) return
    const e = t - g.dal
    if (e < 0 || e > 700) return
    const { ctx, cella: c } = this
    let x, y, l
    if (g.mano) {
      const M = this.manoDi(q, p, t)
      l = LATO_CASSA * c * IN_MANO + c * 0.2
      x = M.x - l / 2
      y = M.y - l / 2
    } else {
      const r = this.cellaVisibile(p, g.x, g.y)
      x = r.x + 1.5
      y = r.y + 1.5
      l = c - 3
    }
    const col = g.esito ? VERDE : GRIGIO
    ctx.globalAlpha = e > 540 ? 1 - (e - 540) / 160 : 1
    ctx.fillStyle = g.esito ? 'rgba(47,158,68,.14)' : 'rgba(134,142,150,.14)'
    rett(ctx, x, y, l, l, c * 0.1)
    ctx.fill()
    ctx.strokeStyle = col
    ctx.lineWidth = Math.max(2, c * 0.1)
    ctx.stroke()
    ctx.globalAlpha = 1
  }

  /* ── i guai: la cella dove il robot si è fermato, e l'anello rosso dove
     il mondo ha fatto perdere la giornata ── */
  segnali(p, q, t) {
    const { ctx, cella: c } = this
    const f = q.fermo
    const r = q.robot || p.robot
    if (f && Number.isFinite(f.x) && Number.isFinite(f.y) && !(r && r.x === f.x && r.y === f.y)) {
      const z = this.cellaVisibile(p, f.x, f.y)
      ctx.globalAlpha = 0.55 + 0.45 * Math.sin(t / 170)
      ctx.fillStyle = 'rgba(192,38,45,.16)'
      rett(ctx, z.x + 2, z.y + 2, c - 4, c - 4, c * 0.12)
      ctx.fill()
      ctx.strokeStyle = ROSSO
      ctx.lineWidth = Math.max(2, c * 0.09)
      ctx.setLineDash([c * 0.16, c * 0.1])
      ctx.stroke()
      ctx.setLineDash([])
      ctx.globalAlpha = 1
    }
    const g = q.guaio
    if (g && Number.isFinite(g.x) && Number.isFinite(g.y)) {
      /* una cassa caduta oltre il bordo ha il guaio fuori dalla mappa: si
         tira dentro, come lo schizzo */
      const cx = fra((g.x + 0.5) * c, c * 0.2, (p.w - 0.2) * c), cy = fra((g.y + 0.5) * c, c * 0.2, (p.h - 0.2) * c)
      const e = Math.max(0, t - (g.dal || 0))
      ctx.strokeStyle = ROSSO
      ctx.lineWidth = Math.max(2, c * 0.08)
      for (const sfasa of [0, 0.5]) {
        const k = ((e / 900) + sfasa) % 1
        ctx.globalAlpha = 1 - k
        ctx.beginPath()
        ctx.arc(cx, cy, c * (0.28 + 0.42 * k), 0, Math.PI * 2)
        ctx.stroke()
      }
      ctx.globalAlpha = 1
      ctx.beginPath()
      ctx.arc(cx, cy, c * 0.3, 0, Math.PI * 2)
      ctx.stroke()
    }
  }

  /* il cliente appena servito lascia un cuore che sale; quello andato via
     arrabbiato una nuvola scura col fulmine */
  umore(p, q, t) {
    const u = q.umore
    if (!u || !p.puntoClienti) return
    const f = (t - u.dal) / 900
    if (f < 0 || f > 1) return
    const { ctx, cella: c } = this
    /* sale di fianco alla testa: né sopra il bancone né sulla nuvoletta,
       perché il cliente dopo può essere già arrivato con la sua richiesta */
    const d = this.disposizione(p)
    const verso = d.verso === 'destra' || d.verso === 'sinistra' ? -DIREZIONI[d.verso][0] : d.nuvola === 'sinistra' ? 1 : -1
    const x = (p.puntoClienti.x + 0.5) * c + verso * c * 0.72
    const y = (p.puntoClienti.y + 0.5) * c - c * 0.45 - f * c * 0.7
    ctx.globalAlpha = f < 0.6 ? 1 : 1 - (f - 0.6) / 0.4
    const s = c * (0.3 + 0.08 * Math.sin(Math.min(1, f * 3) * Math.PI))
    if (u.come === 'arrabbiato') this.nuvolaScura(x, y, s)
    else this.cuore(x, y, s)
    ctx.globalAlpha = 1
  }

  /* la nuvola scura col fulmine: il cliente andato via arrabbiato, il
     camion ripartito mezzo vuoto */
  nuvolaScura(x, y, s) {
    const { ctx } = this
    ctx.fillStyle = '#4b5058'
    for (const [dx, dy, r] of [[-0.5, 0.1, 0.42], [0, -0.12, 0.55], [0.5, 0.08, 0.42], [0, 0.2, 0.45]]) {
      ctx.beginPath()
      ctx.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.fillStyle = '#ffd23f'
    ctx.beginPath()
    ctx.moveTo(x + s * 0.08, y + s * 0.3)
    ctx.lineTo(x - s * 0.18, y + s * 0.75)
    ctx.lineTo(x + s * 0.02, y + s * 0.72)
    ctx.lineTo(x - s * 0.1, y + s * 1.08)
    ctx.lineTo(x + s * 0.22, y + s * 0.6)
    ctx.lineTo(x + s * 0.02, y + s * 0.62)
    ctx.closePath()
    ctx.fill()
  }

  cuore(x, y, s) {
    const { ctx, cella: c } = this
    ctx.fillStyle = '#e8456b'
    ctx.strokeStyle = '#a8243f'
    ctx.lineWidth = Math.max(1, c * 0.035)
    ctx.beginPath()
    ctx.moveTo(x, y + s * 0.7)
    ctx.bezierCurveTo(x - s * 1.1, y + s * 0.05, x - s * 0.55, y - s * 0.75, x, y - s * 0.22)
    ctx.bezierCurveTo(x + s * 0.55, y - s * 0.75, x + s * 1.1, y + s * 0.05, x, y + s * 0.7)
    ctx.fill()
    ctx.stroke()
    ctx.fillStyle = 'rgba(255,255,255,.6)'
    ctx.beginPath()
    ctx.ellipse(x - s * 0.35, y - s * 0.12, s * 0.13, s * 0.08, -0.6, 0, Math.PI * 2)
    ctx.fill()
  }

  /* ── la nuvoletta del cliente ──
     È l'informazione più importante dello schermo: la cassa che vuole,
     grande, e sotto quanta pazienza gli resta. Quando la barretta diventa
     rossa lampeggia piano: la fretta si vede senza bisogno del suono. */
  richiesta(p, t) {
    const cl = p.clienti && p.clienti.alBancone
    if (!cl || !p.puntoClienti) return
    const { ctx, cella: c } = this
    const d = this.disposizione(p)
    const P = this.postoCliente(p, t)
    const bw = c * 1.04, bh = c * 1.16
    let bx = P.x, by = P.y - c * 1.3
    if (d.nuvola === 'giu') by = P.y + c * 1.05
    else if (d.nuvola === 'destra' || d.nuvola === 'sinistra') {
      /* di fianco, ma lontano dal bancone: se il bancone è sopra la
         nuvoletta si abbassa all'altezza del cliente */
      bx = P.x + DIREZIONI[d.nuvola][0] * c * 1.08
      by = P.y + (d.verso === 'su' ? c * 0.02 : -c * 0.55)
    }
    const e = this.cliente && this.cliente.id === cl.id ? fra((t - this.cliente.dal) / 300, 0, 1) : 1
    const s = e < 1 ? tuffo(e) : 1
    ctx.save()
    ctx.translate(bx, by)
    ctx.scale(s, s)
    ctx.translate(-bx, -by)
    this.nuvoletta(bx, by, bw, bh, P.x, P.y - c * 0.25)
    const cy = by - bh * 0.1
    if (typeof cl.chiede === 'number') this.biglietto(bx, cy, 1.05, cl.chiede, 0, false)
    else this.cassa(bx, cy, c * 0.7, cl.chiede, false)
    const max = cl.max || cl.pazienza || 1
    const k = fra((cl.pazienza ?? max) / max, 0, 1)
    const lw = bw * 0.72, lh = Math.max(3, c * 0.1)
    const lx = bx - lw / 2, ly = by + bh / 2 - lh - c * 0.09
    ctx.fillStyle = '#e6ded0'
    rett(ctx, lx, ly, lw, lh, lh / 2)
    ctx.fill()
    ctx.globalAlpha = k < 0.25 ? 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(t / 130)) : 1
    ctx.fillStyle = `hsl(${Math.round(120 * k)}, 72%, 42%)`
    rett(ctx, lx, ly, Math.max(lh, lw * k), lh, lh / 2)
    ctx.fill()
    ctx.globalAlpha = 1
    ctx.restore()
  }

  /* una nuvoletta con la coda verso chi parla: prima la coda, poi il
     corpo sopra, e poi di nuovo il pieno della coda sopra il bordo del
     corpo, così le due forme sembrano una */
  nuvoletta(bx, by, w, h, tx, ty) {
    const { ctx, cella: c } = this
    const x = bx - w / 2, y = by - h / 2, r = Math.min(w, h) * 0.22
    const dx = tx - bx, dy = ty - by
    const bw = Math.min(w, h) * 0.34
    let b1, b2, base, dentro
    if (Math.abs(dy) * w > Math.abs(dx) * h) {
      const sy = dy > 0 ? y + h : y
      const sx = fra(bx + dx * 0.35, x + r + bw / 2, x + w - r - bw / 2)
      b1 = [sx - bw / 2, sy]; b2 = [sx + bw / 2, sy]; base = [sx, sy]; dentro = [0, dy > 0 ? -1 : 1]
    } else {
      const sx = dx > 0 ? x + w : x
      const sy = fra(by + dy * 0.35, y + r + bw / 2, y + h - r - bw / 2)
      b1 = [sx, sy - bw / 2]; b2 = [sx, sy + bw / 2]; base = [sx, sy]; dentro = [dx > 0 ? -1 : 1, 0]
    }
    const ex = tx - base[0], ey = ty - base[1], dist = Math.hypot(ex, ey) || 1
    const L = Math.min(dist, c * 0.42)
    const punta = [base[0] + (ex / dist) * L, base[1] + (ey / dist) * L]
    const lw = Math.max(1.5, c * 0.05)
    ctx.lineWidth = lw
    ctx.lineJoin = 'round'
    ctx.strokeStyle = INCHIOSTRO
    ctx.fillStyle = CARTA
    ctx.beginPath()
    ctx.moveTo(...b1); ctx.lineTo(...punta); ctx.lineTo(...b2); ctx.closePath()
    ctx.fill()
    ctx.stroke()
    /* l'ombra del canvas non segue la trasformazione: va moltiplicata a
       mano per il `devicePixelRatio`, se no sul telefono sparisce */
    ctx.shadowColor = 'rgba(0,0,0,.18)'
    ctx.shadowBlur = c * 0.12 * this.dpr
    ctx.shadowOffsetY = c * 0.04 * this.dpr
    rett(ctx, x, y, w, h, r)
    ctx.fill()
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetY = 0
    ctx.stroke()
    const lungo = [b2[0] - b1[0], b2[1] - b1[1]]
    const ll = Math.hypot(...lungo) || 1
    const ux = lungo[0] / ll, uy = lungo[1] / ll
    ctx.beginPath()
    ctx.moveTo(b1[0] + ux * lw + dentro[0] * lw, b1[1] + uy * lw + dentro[1] * lw)
    ctx.lineTo(punta[0] - (ex / dist) * lw * 1.3, punta[1] - (ey / dist) * lw * 1.3)
    ctx.lineTo(b2[0] - ux * lw + dentro[0] * lw, b2[1] - uy * lw + dentro[1] * lw)
    ctx.closePath()
    ctx.fill()
  }

  /* il robot ha letto: la nuvoletta sopra quello che ha letto, col valore
     dentro — un colore si mostra come una cassa, un numero come un numero */
  lettura(p, q, t) {
    const l = q.legge
    if (!l) return
    const e = t - l.dal
    if (e < 0 || e > 900) return
    const { ctx, cella: c } = this
    /* quello che ha letto: una cella di fianco, o la cosa che tiene in mano */
    let tx, ty
    if (l.mano) {
      const M = this.manoDi(q, p, t)
      tx = M.x
      ty = M.y
    } else {
      tx = (l.x + 0.5) * c
      ty = (l.y + 0.5) * c
    }
    const w = c * 0.86, h = c * 0.76
    const { x: bx, y: by } = this.postoNuvoletta(p, q, t, tx, ty, w, h)
    const f = e / 900
    const s = e < 140 ? tuffo(e / 140) : 1
    ctx.save()
    ctx.globalAlpha = f > 0.8 ? (1 - f) / 0.2 : 1
    ctx.translate(bx, by)
    ctx.scale(s, s)
    ctx.translate(-bx, -by)
    this.nuvoletta(bx, by, w, h, tx, ty - c * 0.25)
    const v = l.valore
    if (typeof v === 'string' && colore(v)) this.cassa(bx, by, c * 0.5, v, false)
    else {
      ctx.fillStyle = INCHIOSTRO
      ctx.font = `800 ${Math.round(c * 0.46)}px system-ui, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(String(v), bx, by + c * 0.02)
    }
    ctx.restore()
  }

  /* Dove va la nuvoletta di quello che il robot ha letto: sopra, se c'è
     posto e se non copre il robot. Il robot legge di fianco a sé, quindi
     quando legge in giù la cella di sopra è proprio la sua: lì la
     nuvoletta va di sbieco, poi di fianco, e per ultima sotto. */
  postoNuvoletta(p, q, t, tx, ty, w, h) {
    const c = this.cella
    const R = this.posRobot(q, p, t)
    const x0 = this.cam.x + 2, x1 = this.cam.x + this.vistaW - 2
    const y0 = this.cam.y + 2, y1 = this.cam.y + this.vistaH - 2
    let ripiego = null
    for (const [dx, dy] of [[0, -1.02], [0.95, -0.9], [-0.95, -0.9], [1.05, 0], [-1.05, 0], [0, 1.02]]) {
      const x = tx + dx * c, y = ty + dy * c
      if (x - w / 2 < x0 || x + w / 2 > x1 || y - h / 2 < y0 || y + h / 2 > y1) continue
      const copre = Math.abs(x - R.x) < w / 2 + c * 0.3 && y + h / 2 > R.y - c * 0.55 && y - h / 2 < R.y + c * 0.4
      if (!copre) return { x, y }
      if (!ripiego) ripiego = { x, y }
    }
    return ripiego || { x: fra(tx, x0 + w / 2, x1 - w / 2), y: fra(ty - c, y0 + h / 2, y1 - h / 2) }
  }

  /* ── le etichette dei cassoni: quante casse ci sono (e quante ne
     entrano, se non sono infinite), col colore che accetta davanti.
     Stanno sul bordo in alto del cassone e sopra tutto il resto: è un
     numero che il programma legge, e il bambino deve poterlo leggere
     con lui ── */
  etichette(p, vis, inVolo, inArrivo, t) {
    const c = this.cella
    for (let y = vis.y0; y <= vis.y1; y++) for (let x = vis.x0; x <= vis.x1; x++) {
      const k = y * p.w + x
      const a = p.arredo[k]
      if (!a || a.tipo !== 'cassone' || inArrivo.has(k)) continue
      /* si contano quelle arrivate: una cassa ancora in volo non c'è ancora */
      const n = p.pile[k].filter(q => !inVolo.has(q.id)).length
      const testo = a.capienza < 99 ? `${n}/${a.capienza}` : String(n)
      /* un cassone con un numero è un indirizzo: il numero va grande,
         da leggere a colpo d'occhio («la buca del 5»), e il conto delle
         lettere passa piccolo in un angolo */
      if (a.numero != null || a.figura === 'buca') {
        const buca = a.figura === 'buca'
        if (a.numero != null) {
          if (buca) this.targa((x + 0.5) * c, y * c + c * 0.64, a.numero, c * 0.5)
          else this.targa(x * c + c * 0.24, y * c + c * 0.24, a.numero, c * 0.44)
        }
        this.pastiglia(x * c + c * (buca ? 0.86 : 0.8), y * c + c * (buca ? 0.1 : 0.92), testo,
                       Math.max(9, Math.round(c * 0.25)), { largo: p.w * c })
        continue
      }
      /* sopra il cassone; un camion invece l'etichetta la porta sulla
         cabina, dalla parte della strada, così il pianale col carico resta
         scoperto */
      let ex = (x + 0.5) * c, ey = y > 0 ? y * c + c * 0.02 : (y + 1) * c - c * 0.02
      if (a.figura === 'camion') {
        const angolo = this.angoloCabina(p, x, y)
        const dx = Math.round(Math.sin(angolo)), dy = Math.round(-Math.cos(angolo))
        if (dy > 0) ey = (y + 1) * c + c * 0.04
        else if (dy < 0) ey = y * c - c * 0.08
        else { ex = (x + 0.5 + dx * 0.62) * c; ey = (y + 0.5) * c - c * 0.12 }
      }
      /* un camion ha fretta: sotto il conto, la sua pazienza */
      const pazienza = a.max ? (a.pazienza ?? a.max) / a.max : null
      this.pastiglia(ex, ey, testo, Math.max(10, Math.round(c * 0.31)),
                     { col: a.colore ? colore(a.colore) : null, largo: p.w * c, alto: p.h * c, pazienza, t })
    }
  }

  /* Una pastiglia bianca con un testo corto (e un quadretto di colore);
     se sporgerebbe dalla mappa si sposta dentro. Con `pazienza` (da 0 a 1)
     sotto il testo c'è la barretta, la stessa dei clienti: dal verde al
     rosso, e sotto un quarto lampeggia. */
  pastiglia(cx, cy, testo, corpo, { col = null, largo = Infinity, alto = Infinity, pazienza = null, t = 0 } = {}) {
    const { ctx } = this
    ctx.font = `800 ${Math.round(corpo)}px system-ui, sans-serif`
    const tw = ctx.measureText(testo).width
    const alta = corpo * 1.35, q = col ? corpo * 0.8 : 0, gap = col ? corpo * 0.3 : 0
    const barra = pazienza != null ? corpo * 0.5 : 0
    const w = Math.max(tw + q + gap + corpo * 0.8, barra ? corpo * 3 : 0)
    const h = alta + barra
    cx = fra(cx, w / 2 + 1, largo - w / 2 - 1)
    cy = fra(cy, alta / 2 + 1, alto - alta / 2 - barra - 1)
    const x = cx - w / 2, y = cy - alta / 2
    ctx.fillStyle = CARTA
    ctx.strokeStyle = INCHIOSTRO
    ctx.lineWidth = Math.max(1, corpo * 0.1)
    rett(ctx, x, y, w, h, barra ? corpo * 0.5 : h / 2)
    ctx.fill()
    ctx.stroke()
    if (barra) {
      const k = fra(pazienza, 0, 1), bw = w - corpo * 0.7, bh = Math.max(2.5, corpo * 0.28)
      const bx = cx - bw / 2, by = y + alta - corpo * 0.08
      ctx.fillStyle = '#e6ded0'
      rett(ctx, bx, by, bw, bh, bh / 2)
      ctx.fill()
      ctx.globalAlpha = k < 0.25 ? 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(t / 130)) : 1
      ctx.fillStyle = `hsl(${Math.round(120 * k)}, 72%, 42%)`
      rett(ctx, bx, by, Math.max(bh, bw * k), bh, bh / 2)
      ctx.fill()
      ctx.globalAlpha = 1
    }
    let tx = cx - (tw + q + gap) / 2
    if (col) {
      ctx.fillStyle = col.tinta
      rett(ctx, tx, cy - q / 2, q, q, q * 0.2)
      ctx.fill()
      ctx.strokeStyle = col.ombra
      ctx.lineWidth = Math.max(1, corpo * 0.08)
      ctx.stroke()
      tx += q + gap
    }
    ctx.fillStyle = INCHIOSTRO
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.fillText(testo, tx, cy + corpo * 0.04)
  }

  /* ── i bordi della vista: dove la mappa continua, un'ombra leggera e
     una freccetta. Senza, una mappa più grande dello schermo sembra
     finire dove finisce il canvas ── */
  bordi(p) {
    const { ctx, cella: c } = this
    const W = this.vistaW, H = this.vistaH, L = 14
    const mw = p.w * c, mh = p.h * c
    const lati = [
      ['sinistra', this.cam.x > 1], ['destra', this.cam.x + W < mw - 1],
      ['su', this.cam.y > 1], ['giu', this.cam.y + H < mh - 1],
    ]
    for (const [lato, continua] of lati) {
      if (!continua) continue
      let g
      if (lato === 'sinistra') g = ctx.createLinearGradient(0, 0, L, 0)
      else if (lato === 'destra') g = ctx.createLinearGradient(W, 0, W - L, 0)
      else if (lato === 'su') g = ctx.createLinearGradient(0, 0, 0, L)
      else g = ctx.createLinearGradient(0, H, 0, H - L)
      g.addColorStop(0, 'rgba(25,32,45,.26)')
      g.addColorStop(1, 'rgba(25,32,45,0)')
      ctx.fillStyle = g
      if (lato === 'sinistra') ctx.fillRect(0, 0, L, H)
      else if (lato === 'destra') ctx.fillRect(W - L, 0, L, H)
      else if (lato === 'su') ctx.fillRect(0, 0, W, L)
      else ctx.fillRect(0, H - L, W, L)
      const [dx, dy] = DIREZIONI[lato]
      const mx = lato === 'sinistra' ? 7 : lato === 'destra' ? W - 7 : W / 2
      const my = lato === 'su' ? 7 : lato === 'giu' ? H - 7 : H / 2
      const px = -dy, py = dx
      ctx.beginPath()
      ctx.moveTo(mx - dx * 4 + px * 6, my - dy * 4 + py * 6)
      ctx.lineTo(mx + dx * 2, my + dy * 2)
      ctx.lineTo(mx - dx * 4 - px * 6, my - dy * 4 - py * 6)
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.strokeStyle = 'rgba(20,25,35,.55)'
      ctx.lineWidth = 5
      ctx.stroke()
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2.5
      ctx.stroke()
      ctx.lineCap = 'butt'
    }
  }
}
