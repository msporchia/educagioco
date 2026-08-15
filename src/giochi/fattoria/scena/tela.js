/* ═══════════════════════════════════════════════════════════════════
   LA TELA DELLA FATTORIA — il disegno, e nient'altro

   Riceve un `quadro`, cioè fatti già decisi su cosa mostrare —
   `{ fattoria, attori, scelto, preso, anello, orologio, pennello }` —
   e li dipinge su un canvas. Non sa quanto costa una staccionata né
   perché un cane ha fame: legge `fattoria.cose`, `fattoria.ostacoli`,
   `fattoria.materiaDi(x,y)`, `fattoria.piazzole` e
   `fattoria.borsa.quante()` (solo per colorare il cartello del
   prezzo) come dati, senza mai importare la classe `Fattoria` — chi
   la usa passa un'istanza vera o un finto oggetto con la stessa
   forma, e per questa classe non fa differenza.

   ── IL TERRENO NON È IL PRATO PIÙ DELLE POZZE SOPRA ────────────────
   Una cella è di UNA materia (`fattoria.materiaDi(x,y)`: prato, acqua,
   domani strada o roccia), e quale delle nove tessere di bordo va in
   ogni cella lo decide `bordi.js` guardando i vicini — non solo SE
   sono diversi, ma DI CHE MATERIA sono: acqua contro prato è una riva,
   acqua contro roccia sarà un'altra cosa. Questo file non sa cos'è un
   angolo né cos'è l'acqua: chiede `tesseraDi(materiaDi, x, y)` una
   volta per cella e disegna il nome che torna, o niente se torna
   `null` (prato, o una materia senza bordo ancora dichiarato — vedi
   `disegnaTerreno`). Il terreno si dipinge sopra il prato e sotto
   tutto il resto, come le voci `sotto: true` del catalogo: mai come
   un oggetto in mezzo alla scena ordinata per profondità.

   ── L'OROLOGIO NON LO TIENE QUESTA CLASSE ─────────────────────────
   Arriva dentro `quadro` a ogni chiamata di `disegna()`, come i prezzi
   e come tutto il resto: è la stessa distinzione applicata al tempo,
   non un'eccezione. Quello che la Tela tiene per sé è solo *quando*
   ridipingere — `avvia()`/`ferma()` guidano un giro a schermo intero
   così che trascinare la vista o stringere lo zoom resti fluido anche
   se chi guida il gioco aggiorna lo stato più di rado.

   ── LA VISTA E LO ZOOM, IN CELLE E IN PIXEL ───────────────────────
   `vista` è l'angolo in alto a sinistra del mondo, in pixel schermo.
   `scala` è un intero fra SCALA_MIN e SCALA_MAX (dati/mondo.js): la
   pixel art a scala non intera fa pixel di due misure diverse, e da
   vicino si vede — per questo `zoomA` arrotonda, e stringe ATTORNO AL
   PUNTO indicato, non attorno all'angolo: quello che si stava
   guardando resta dove lo si stava guardando.

   ── L'ORDINE DI DISEGNO ────────────────────────────────────────────
   Uno sprite si appoggia col FONDO sul fondo del suo piede: una casa
   occupa 4×2 celle per terra ma è alta cinque tessere, e il tetto sta
   SOPRA il piede, non dentro — altrimenti un personaggio che le
   cammina dietro sparirebbe sotto il tetto invece di restarci
   davanti. Si ordina quindi per `y + altezza del piede`, non per `y` e
   basta, e le voci "sotto" (un orto, uno stagno: terreno, non
   oggetti) vanno sempre per prime, sotto a tutto il resto.

   ── COSA NON C'È ────────────────────────────────────────────────────
   `vaiACasa()` (centrare la vista sul primo pezzo di terra) non è qui:
   userebbe PRIMA/ULTIMA di dati/mondo.js per una scelta che è di chi
   avvia il gioco, non del disegno — la Tela espone `vista` e `limita()`
   apposta perché chi la guida possa farlo da fuori. Le barrette dei
   bisogni (`Attore.statistiche`) disegnano quello che gli viene dato,
   ma i BISOGNI veri — fame, pelo, la loro soglia, il loro decadere
   nelle ore — non esistono ancora in `dati/` né in `motore/`: quel
   pezzo arriva quando arriva quella parte del gioco, e per adesso
   `bisogni` resta un campo facoltativo che nessuno riempie.

   `pennello` è la stessa idea del riquadro di atterraggio, applicata
   al dipingere invece che al posare:
   `{ celle: Set<"x,y">, materia: string, ok: bool }` — le celle che
   finirebbero di quella materia se si lasciasse adesso, quale materia
   si sta dipingendo (per colorare l'anteprima in modo coerente: bluastra
   per l'acqua, non un verde generico) e se ci stanno tutte. Facoltativo:
   senza, semplicemente non si disegna nessuna anteprima. Dipingere alla
   cieca fa sbagliare, ed è lo stesso motivo per cui esiste
   `disegnaAtterraggio`.
   ═══════════════════════════════════════════════════════════════════ */
import {
  T, CELLE, PIAZZOLE, CELLE_MONDO, SCALA_MIN, SCALA_MAX, SCALA_INIZIALE, caso,
} from '../dati/mondo.js'
import { ATLANTE, PEZZI, pezzoAttore } from '../dati/atlante.js'
import { PER_ID, piedeDi, pezzoDi } from '../dati/catalogo.js'
import { OSTACOLI } from '../dati/ostacoli.js'
import { tesseraDi } from './bordi.js'

/* Il prato è quasi tutto una tessera piatta: le varianti spuntano di
   rado, se no da lontano si vede il motivo che si ripete e sembra un
   pavimento invece di un prato. */
const ERBE = ['erba0', 'erba0', 'erba0', 'erba0', 'erba0', 'erba0', 'erba1', 'erba2', 'erba3']

/* Il colore dell'anteprima del pennello, per materia — solo un
   suggerimento visivo, non c'entra col disegno vero (quello lo fa
   `bordi.js` con le tessere). `'*'` è il ripiego per una materia senza
   una tinta sua: lo stesso spirito del `'*'` di `bordiFra()`, un'altra
   materia in più non deve rompere questo file. */
const COLORE_MATERIA = {
  acqua: [90, 170, 230],
  roccia: [150, 150, 150],
  strada: [200, 180, 140],
  '*': [140, 220, 120],
}

/* ═══════════ un attore: chiunque cammini ═══════════
   La bambina, un cane, domani una gallina: nell'atlante sono tutti lo
   stesso formato — tre versi (giù/lato/su), N fotogrammi ciascuno — e
   le pose di lato guardano a DESTRA: la sinistra è la stessa
   specchiata via `ctx.scale(-1,1)`, e non esiste come tessera propria.

   L'attore vive in **celle**, non in pixel: lo zoom cambia mentre si
   gioca, e in cella non c'è niente da riscalare. La conversione in
   pixel schermo la fa `disegna()` all'ultimo momento, non il
   costruttore: così lo stesso Attore si disegna uguale a qualunque
   zoom, e può nascere prima ancora che una Tela esista. */
export class Attore {
  constructor(nome, cx, cy, opz = {}) {
    this.nome = nome
    this.x = cx + 0.5
    this.y = cy + 0.5
    this.verso = 'giu'
    this.passo = 0
    this.meta = null
    this.velocita = opz.velocita || 3.4     // celle al secondo
    this.vaga = opz.vaga || 0               // ogni quanti secondi si sposta da sé
    this.attesa = 1 + Math.random() * 3
    this.chi = opz.chi || nome
    /* Facoltativo, e non riempito da questa classe: `[{ colore,
       valore }]`, valore 0..1. Se c'è, si disegnano le barrette sopra
       la testa quando l'attore è quello selezionato, e un fumetto
       quando uno dei valori scende sotto la soglia — vedi il commento
       in testa al file su cosa manca ancora. */
    this.bisogni = opz.bisogni || null
  }

  get cella() { return { x: this.x | 0, y: this.y | 0 } }

  vaiA(cx, cy) { this.meta = { x: cx + 0.5, y: cy + 0.5 } }

  /* `dentroMio(x,y)` dice se una cella è terra sua: senza, l'attore
     non saprebbe dove è lecito vagare da sé e potrebbe finire nel
     bosco — un cane che sparisce lì dentro è un cane che non si trova
     più. Chi lo chiama passa `fattoria.cellaMia.bind(fattoria)` o
     equivalente: questa classe non importa `motore/`. */
  muovi(dt, dentroMio) {
    if (!this.meta) {
      if (!this.vaga) return
      this.attesa -= dt
      if (this.attesa > 0) return
      this.attesa = this.vaga * (0.6 + Math.random())
      const c = this.cella
      for (let prova = 0; prova < 12; prova++) {
        const x = c.x + ((Math.random() * 9) | 0) - 4
        const y = c.y + ((Math.random() * 9) | 0) - 4
        if (!dentroMio || dentroMio(x, y)) { this.vaiA(x, y); break }
      }
      return
    }
    const dx = this.meta.x - this.x, dy = this.meta.y - this.y
    const d = Math.hypot(dx, dy)
    if (d < 0.1) { this.meta = null; return }
    const v = this.velocita * dt
    this.x += dx / d * Math.min(v, d)
    this.y += dy / d * Math.min(v, d)
    this.passo += dt
    if (Math.abs(dx) > Math.abs(dy)) this.verso = dx > 0 ? 'lato' : 'sinistra'
    else this.verso = dy > 0 ? 'giu' : 'su'
  }

  /* Il rettangolo che occupa a schermo, per chi deve sapere se lo si è
     toccato — non questa classe, che di un tocco non sa niente.
     `cellaPx` è quanti pixel vale una cella alla scala corrente. */
  riquadro(cellaPx, vista, pezzo = null) {
    /* Si misura **il fotogramma che si sta disegnando**, non sempre
       quello di fronte. Di lato un quadrupede è largo il doppio: dando
       per buona la misura del «giù», a ogni svolta lo sprite veniva
       centrato su un rettangolo stretto e saltava di mezza cella. A
       schermo si vede come un lampeggio — la bestia che compare e
       scompare — e non come uno spostamento, perché succede a ogni
       cambio di direzione. Chi cerca *dove ho toccato* passa il pezzo
       più largo, così il bersaglio non si restringe mentre cammina. */
    const p = pezzo || pezzoAttore(this.nome, 'lato', 0) || pezzoAttore(this.nome, 'giu', 0)
    const scala = cellaPx / T
    const w = (p ? p[2] : T) * scala, h = (p ? p[3] : T * 2) * scala
    return {
      x: this.x * cellaPx - vista.x - w / 2,
      y: this.y * cellaPx - vista.y - h + cellaPx / 2,
      w, h,
    }
  }

  disegna(ctx, immagine, cellaPx, vista, orologio, evidenziato) {
    const scala = cellaPx / T
    const fr = this.meta ? 1 + (((this.passo * 6) | 0) % 3) : 0
    const specchio = this.verso === 'sinistra'
    const p = pezzoAttore(this.nome, specchio ? 'lato' : this.verso, fr)
    if (!p) return
    const r = this.riquadro(cellaPx, vista, p)
    const x = Math.round(r.x), y = Math.round(r.y), w = p[2] * scala, h = p[3] * scala
    if (specchio) {
      ctx.save(); ctx.translate(x + w, y); ctx.scale(-1, 1)
      ctx.drawImage(immagine, p[0], p[1], p[2], p[3], 0, 0, w, h)
      ctx.restore()
    } else {
      ctx.drawImage(immagine, p[0], p[1], p[2], p[3], x, y, w, h)
    }
    if (evidenziato) {
      ctx.save()
      ctx.setLineDash([5, 4]); ctx.lineDashOffset = -orologio * 12
      ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,.85)'
      ctx.strokeRect(x + 1, y + h * .38, w - 2, h * .62 - 1)
      ctx.restore()
      this.statistiche(ctx, x + w / 2, y + h * .38, w)
    } else if (this.bisogni && this.bisogni.some(b => b.valore < .35)) {
      this.fumetto(ctx, x + w / 2, y - 4, orologio, scala)
    }
  }

  /* Le barrette sopra la testa, disegnate nel mondo: seguono l'attore
     anche mentre cammina, che è quello che fanno mentre lo si guarda.
     Impilano rettangoli pieni a metà — non sanno se sia fame o voglia
     di giocare, quello lo decide chi riempie `this.bisogni`. */
  statistiche(ctx, x, y, larg) {
    const bis = this.bisogni
    if (!bis || !bis.length) return
    const w = Math.max(46, larg * 1.8), h = 5, passo = h + 3
    const x0 = Math.round(x - w / 2)
    let y0 = Math.round(y - bis.length * passo - 8)
    ctx.save()
    ctx.fillStyle = 'rgba(8,20,12,.72)'
    ctx.fillRect(x0 - 4, y0 - 4, w + 8, bis.length * passo + 6)
    for (const b of bis) {
      ctx.fillStyle = 'rgba(0,0,0,.45)'
      ctx.fillRect(x0, y0, w, h)
      ctx.fillStyle = b.colore
      ctx.fillRect(x0, y0, Math.round(w * Math.max(0, Math.min(1, b.valore))), h)
      y0 += passo
    }
    ctx.restore()
  }

  /* Un invito, non un rimprovero: non succede niente se lo si ignora.
     La soglia sotto cui compare è una scelta di quando disegnarlo, non
     una regola di gioco — non tocca monete né punteggio. */
  fumetto(ctx, x, y, orologio, scala) {
    const s = 2 + Math.sin(orologio * 4) * 1.2
    ctx.save()
    ctx.font = `${Math.round(11 + scala * 2)}px system-ui,sans-serif`
    ctx.textAlign = 'center'
    ctx.fillText('💭', x, y - s)
    ctx.restore()
  }
}

export class Tela {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.vista = { x: 0, y: 0 }
    this.scala = SCALA_INIZIALE
    this.dpr = 1
    this.L = 0
    this.A = 0
    this.quadro = null
    this._raf = 0
    /* L'atlante si carica una volta, in background: disegnare prima
       che sia pronto non fa niente (`drawImage` su un'immagine non
       ancora caricata è un no-op silenzioso, non un errore), e il
       primo fotogramma buono arriva da sé perché il giro di disegno è
       continuo — non serve un `onload` che richiami nessuno. */
    this.immagine = new Image()
    this.immagine.src = ATLANTE
  }

  /* ── misure ── */
  get cellaPx() { return T * this.scala }
  get latoPx() { return this.cellaPx * CELLE }
  get mondoPx() { return this.latoPx * PIAZZOLE }

  /* Si misura dal **genitore**, mai da sé. Misurandosi da sé la tela
     entra in un giro senza fondo: leggo la mia larghezza, ci scrivo
     dentro la mia larghezza per il rapporto pixel, al fotogramma dopo
     rileggo quella nuova e la raddoppio ancora. Succede solo se il CSS
     non la sta ancorando, e allora non se ne accorge nessuno finché a
     schermo non resta il bianco: in due secondi era arrivata a 67
     milioni di pixel per lato. Il genitore invece una misura vera ce
     l'ha sempre, e non dipende da noi. */
  misura() {
    const casa = this.canvas.parentElement || this.canvas
    const r = casa.getBoundingClientRect()
    if (!r.width || !r.height) return false
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    if (Math.round(r.width) === this.L && Math.round(r.height) === this.A && dpr === this.dpr)
      return true
    this.L = Math.round(r.width); this.A = Math.round(r.height); this.dpr = dpr
    this.canvas.width = Math.round(this.L * dpr)
    this.canvas.height = Math.round(this.A * dpr)
    this.canvas.style.width = this.L + 'px'
    this.canvas.style.height = this.A + 'px'
    this.limita()
    return true
  }

  /* ── vista e zoom ──
     Si stringe ATTORNO A UN PUNTO, non attorno all'angolo in alto a
     sinistra: quello che si stava guardando resta dove lo si stava
     guardando. Senza, pizzicare per ingrandire fa scattare la scena da
     un'altra parte — su un telefono è la prima cosa che si nota. */
  zoomA(voluta, ancoraX, ancoraY) {
    const nuova = Math.max(SCALA_MIN, Math.min(SCALA_MAX, Math.round(voluta)))
    if (nuova === this.scala) return
    const prima = {
      x: (ancoraX + this.vista.x) / this.cellaPx,
      y: (ancoraY + this.vista.y) / this.cellaPx,
    }
    this.scala = nuova
    this.vista.x = prima.x * this.cellaPx - ancoraX
    this.vista.y = prima.y * this.cellaPx - ancoraY
    this.limita()
  }

  /* Se il mondo intero ci sta nello schermo — succede appena si
     allarga lo zoom, o su un tablet — non si incolla in alto a
     sinistra lasciando nero sotto e a destra: si mette in mezzo. */
  limita() {
    const w = this.L, h = this.A, M = this.mondoPx
    this.vista.x = Math.round(M <= w ? (M - w) / 2 : Math.max(0, Math.min(this.vista.x, M - w)))
    this.vista.y = Math.round(M <= h ? (M - h) / 2 : Math.max(0, Math.min(this.vista.y, M - h)))
  }

  /* La cella del mondo sotto un punto dello schermo. */
  cellaDa(sx, sy) {
    return {
      x: ((sx + this.vista.x) / this.cellaPx) | 0,
      y: ((sy + this.vista.y) / this.cellaPx) | 0,
    }
  }

  /* ── il giro ──
     `mostra()` deposita l'ultimo quadro; `avvia()` fa ripartire un
     giro a `requestAnimationFrame` che ridipinge quel quadro a ogni
     fotogramma dello schermo — anche se chi guida il gioco lo
     aggiorna più di rado (mentre si trascina la vista, per dire, dove
     cambia solo `vista` e nient'altro nel resto del quadro). */
  mostra(quadro) { this.quadro = quadro }

  avvia() {
    if (this._raf) return
    const passo = () => { this._raf = requestAnimationFrame(passo); this.disegna(this.quadro) }
    this._raf = requestAnimationFrame(passo)
  }

  ferma() {
    cancelAnimationFrame(this._raf)
    this._raf = 0
  }

  /* ── il disegno ──
     `quadro` porta:
       fattoria  lo stato del mondo (letto come dato, mai importato come classe)
       attori    chi cammina, già istanze di `Attore`
       scelto    la `cosa` o l'`Attore` selezionato, per identità (===)
       preso     cosa si sta trascinando, o null — vedi `disegnaAtterraggio`
       anello    { x, y, q } la pressione lunga in corso, o null
       orologio  i secondi trascorsi: l'unico orologio che questa classe usa
       pennello  { celle, materia, ok } l'anteprima di dove finirebbe la
                 materia che si sta dipingendo, o null/assente —
                 vedi `disegnaPennello` */
  disegna(quadro) {
    if (!quadro || !this.misura()) return
    this.quadro = quadro
    const { fattoria } = quadro
    const ctx = this.ctx
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    ctx.imageSmoothingEnabled = false
    ctx.clearRect(0, 0, this.L, this.A)

    this.disegnaPrato()
    this.disegnaTerreno(fattoria)

    /* tutto quello che sta in scena, ordinato per quanto è avanti */
    const scena = []
    for (const k in fattoria.ostacoli) {
      const [x, y] = k.split(',').map(Number)
      const o = OSTACOLI[fattoria.ostacoli[k]]
      if (!o) continue          // un tipo che non esiste più: si salta, non si esplode
      if (!o) continue
      scena.push({ nome: o.pezzo, x, y, piede: o.piede, fondo: y + o.piede[1] })
    }
    for (const c of fattoria.cose) {
      if (quadro.preso && quadro.preso.da === c) continue   // è in mano, non per terra
      const v = PER_ID[c.id]; if (!v) continue
      let nome = pezzoDi(c, v)
      const piede = piedeDi(c, v)
      if (v.anima) nome = v.anima[((quadro.orologio * 4) | 0) % v.anima.length]
      scena.push({ nome, x: c.x, y: c.y, piede, cosa: c, fondo: v.sotto ? -1 : c.y + piede[1] })
    }
    for (const a of quadro.attori || []) scena.push({ attore: a, fondo: a.y + 1 })
    scena.sort((a, b) => a.fondo - b.fondo)

    for (const e of scena) {
      if (e.attore) {
        e.attore.disegna(ctx, this.immagine, this.cellaPx, this.vista, quadro.orologio,
          e.attore === quadro.scelto)
        continue
      }
      this.posa(e.nome, e.x, e.y, e.piede)
      if (e.cosa && e.cosa === quadro.scelto)
        this.schiarisci(e.nome, e.x, e.y, e.piede, quadro.orologio)
    }

    this.disegnaAtterraggio(quadro.preso)
    this.disegnaPennello(quadro.pennello)
    this.disegnaNebbia(fattoria)
    this.cartelli(fattoria, quadro.orologio)
    this.disegnaAnello(quadro.anello)
  }

  pezzo(nome, sx, sy, alfa) {
    const p = PEZZI[nome]; if (!p) return
    const ctx = this.ctx
    if (alfa != null) ctx.globalAlpha = alfa
    ctx.drawImage(this.immagine, p[0], p[1], p[2], p[3],
      Math.round(sx), Math.round(sy), p[2] * this.scala, p[3] * this.scala)
    if (alfa != null) ctx.globalAlpha = 1
  }

  /* Uno sprite si appoggia col FONDO sul fondo del suo piede: è quello
     che permette a una casa alta cinque tessere di stare su un piede
     di due, col tetto che sporge sopra invece di schiacciarsi dentro. */
  posa(nome, cx, cy, piede, alfa) {
    const p = PEZZI[nome]; if (!p) return
    const larg = p[2] * this.scala
    const x = cx * this.cellaPx - this.vista.x + (piede[0] * this.cellaPx - larg) / 2
    const y = (cy + piede[1]) * this.cellaPx - this.vista.y - p[3] * this.scala
    this.pezzo(nome, x, y, alfa)
  }

  /* Le celle di mondo visibili in questo momento, con un margine di una
     cella: la stessa domanda se la pongono il prato e l'acqua, ognuno
     dei quali disegna una tessera per cella — farla due volte in due
     posti diversi vorrebbe dire tenerle d'accordo a mano. */
  celleVisibili() {
    const cellaPx = this.cellaPx
    const c0x = Math.max(0, ((this.vista.x / cellaPx) | 0) - 1)
    const c0y = Math.max(0, ((this.vista.y / cellaPx) | 0) - 1)
    const c1x = Math.min(CELLE_MONDO, c0x + ((this.L / cellaPx) | 0) + 3)
    const c1y = Math.min(CELLE_MONDO, c0y + ((this.A / cellaPx) | 0) + 3)
    return { c0x, c0y, c1x, c1y }
  }

  disegnaPrato() {
    const cellaPx = this.cellaPx
    const { c0x, c0y, c1x, c1y } = this.celleVisibili()
    for (let cx = c0x; cx < c1x; cx++)
      for (let cy = c0y; cy < c1y; cy++) {
        const e = ERBE[((caso(cx, cy, 7) * 100) | 0) % ERBE.length]
        this.pezzo(e, cx * cellaPx - this.vista.x, cy * cellaPx - this.vista.y)
      }
  }

  /* Il terreno — acqua oggi, domani strada e roccia — è materia, non
     un oggetto: si dipinge subito sopra il prato, prima della scena
     ordinata per profondità, esattamente come le voci `sotto: true`
     del catalogo. Per ogni cella visibile si chiede a `bordi.js` una
     volta sola: `tesseraDi` guarda da sé di che materia è la cella e
     i quattro vicini, e torna il nome giusto — o `null` se lì c'è
     prato (niente da disegnare sopra) o se quella materia non ha
     ancora un bordo dichiarato. Questa classe non sa cos'è un angolo
     né cos'è l'acqua: sa solo disegnare il nome che torna, e saltare
     la cella quando non torna niente — mai una tessera a caso. */
  disegnaTerreno(fattoria) {
    const cellaPx = this.cellaPx
    const { c0x, c0y, c1x, c1y } = this.celleVisibili()
    const materiaDi = (x, y) => fattoria.materiaDi(x, y)
    for (let cx = c0x; cx < c1x; cx++)
      for (let cy = c0y; cy < c1y; cy++) {
        const nome = tesseraDi(materiaDi, cx, cy)
        if (!nome) continue
        this.pezzo(nome, cx * cellaPx - this.vista.x, cy * cellaPx - this.vista.y)
      }
  }

  /* Il selvatico non è un terreno diverso: è lo stesso prato al buio.
     Il confine è netto e cade sul bordo della piazzola — è un confine
     vero, di là è tuo e di qua no, e una sfumatura mentirebbe su dove
     passa: è stato provato con la sfumatura e tolta apposta. Il pezzo
     che si può comprare adesso è meno buio degli altri: dice «questo,
     non tutto il bosco» senza scriverlo. */
  disegnaNebbia(fattoria) {
    const ctx = this.ctx, lato = this.latoPx
    for (let px = 0; px < PIAZZOLE; px++)
      for (let py = 0; py < PIAZZOLE; py++) {
        if (fattoria.mia(px, py)) continue
        const x = px * lato - this.vista.x, y = py * lato - this.vista.y
        if (x > this.L || y > this.A || x + lato < 0 || y + lato < 0) continue
        ctx.fillStyle = fattoria.comprabile(px, py) ? 'rgba(10,26,18,.34)' : 'rgba(10,26,18,.62)'
        ctx.fillRect(x, y, lato, lato)
      }
  }

  /* Quello che si compra è esattamente il riquadro tratteggiato:
     nessuna sorpresa su quanto viene, e gli ostacoli che ci sono dentro
     si vedono già prima di pagare. */
  cartelli(fattoria, orologio) {
    const ctx = this.ctx, lato = this.latoPx
    const prezzo = fattoria.prezzoDellaProssima
    const posso = fattoria.borsa.quante() >= prezzo
    ctx.textAlign = 'center'
    ctx.lineJoin = 'round'
    for (let px = 0; px < PIAZZOLE; px++)
      for (let py = 0; py < PIAZZOLE; py++) {
        if (!fattoria.comprabile(px, py)) continue
        const x = px * lato - this.vista.x, y = py * lato - this.vista.y
        if (x > this.L || y > this.A || x + lato < 0 || y + lato < 0) continue

        ctx.save()
        ctx.setLineDash([9, 7])
        ctx.lineDashOffset = -orologio * 14      // il tratteggio cammina piano
        ctx.lineWidth = 3
        ctx.strokeStyle = posso ? 'rgba(255,224,138,.95)' : 'rgba(255,255,255,.42)'
        ctx.strokeRect(x + 2, y + 2, lato - 4, lato - 4)
        ctx.restore()

        const cx = x + lato / 2, cy = y + lato / 2
        const pc = PEZZI.cartello
        this.pezzo('cartello', cx - pc[2] * this.scala / 2, cy - pc[3] * this.scala + 14)
        /* La monetina sopra e il numero sotto, invece di «🪙45» in fila.
           In fila non ci stava sul cartello e l'avevo tolta, ma un numero
           nudo piantato in mezzo al bosco non dice **cosa** costa: poteva
           essere una distanza, un livello, l'ora. Su due righe ci sta, e
           si capisce a colpo d'occhio anche senza saper leggere. */
        ctx.font = `${8 + this.scala * 2}px system-ui,sans-serif`
        ctx.fillText('🪙', cx, cy - 3 - this.scala)
        ctx.font = `700 ${9 + this.scala * 3}px system-ui,sans-serif`
        ctx.fillStyle = posso ? '#3a2a12' : '#7a2a2a'
        ctx.fillText(String(prezzo), cx, cy + 9 + this.scala * 2)
      }
    ctx.textAlign = 'left'
  }

  /* Un oggetto selezionato si schiarisce E prende un contorno: da soli
     non basterebbero — il contorno si perde sull'erba chiara, la
     schiaritura si perde sugli sprite già chiari. */
  schiarisci(nome, cx, cy, piede, orologio) {
    const p = PEZZI[nome]; if (!p) return
    const ctx = this.ctx
    const battito = .16 + .12 * (1 + Math.sin(orologio * 5)) / 2
    const larg = p[2] * this.scala
    const x = cx * this.cellaPx - this.vista.x + (piede[0] * this.cellaPx - larg) / 2
    const y = (cy + piede[1]) * this.cellaPx - this.vista.y - p[3] * this.scala
    ctx.save()
    ctx.globalCompositeOperation = 'lighter'
    ctx.globalAlpha = battito
    ctx.drawImage(this.immagine, p[0], p[1], p[2], p[3],
      Math.round(x), Math.round(y), larg, p[3] * this.scala)
    ctx.restore()
    ctx.save()
    ctx.setLineDash([5, 4])
    ctx.lineDashOffset = -orologio * 12
    ctx.lineWidth = 2
    ctx.strokeStyle = 'rgba(255,255,255,.85)'
    ctx.strokeRect(cx * this.cellaPx - this.vista.x + 1, cy * this.cellaPx - this.vista.y + 1,
      piede[0] * this.cellaPx - 2, piede[1] * this.cellaPx - 2)
    ctx.restore()
  }

  /* Dove finirebbe se si lascia adesso. Il riquadro dice se ci sta, lo
     sprite in trasparenza dice come verrebbe — insieme tolgono la
     domanda «dove va?» a chi sta trascinando. */
  disegnaAtterraggio(preso) {
    if (!preso || preso.cx == null) return
    const { v, da, cx, cy, ok } = preso
    const piede = piedeDi(da, v)
    const ctx = this.ctx
    const x = cx * this.cellaPx - this.vista.x, y = cy * this.cellaPx - this.vista.y
    ctx.save()
    ctx.fillStyle = ok ? 'rgba(140,220,120,.28)' : 'rgba(220,110,110,.32)'
    ctx.fillRect(x, y, piede[0] * this.cellaPx, piede[1] * this.cellaPx)
    ctx.lineWidth = 2
    ctx.strokeStyle = ok ? 'rgba(180,255,160,.9)' : 'rgba(255,150,150,.9)'
    ctx.strokeRect(x + 1, y + 1, piede[0] * this.cellaPx - 2, piede[1] * this.cellaPx - 2)
    ctx.restore()
    this.posa(pezzoDi(da, v), cx, cy, piede, ok ? .85 : .45)
  }

  /* Dove finirebbe la materia se si lasciasse il pennello adesso:
     stesso spirito di `disegnaAtterraggio`, ma sono celle sparse (una
     L, una S, quello che si sta tracciando col dito) e non un piede
     rettangolare solo, quindi si colora ogni cella per conto suo
     invece di un riquadro unico. Senza questo, dipingere vorrebbe dire
     scoprire il risultato solo a dito alzato: con macchie non
     quadrate è facile sbagliare di una cella.

     Il colore dipende dalla materia (`pennello.materia`) SOLO quando
     `ok` è vero: l'acqua è bluastra, non il verde generico di prima —
     due pennelli diversi (acqua, domani roccia) restano riconoscibili
     mentre ci si pensa su. Il rosso di "qui non si può" resta invece
     uguale per tutti: è un avviso, non una descrizione, e cambiargli
     tinta a seconda della materia lo renderebbe più lento da
     riconoscere e non più chiaro. */
  disegnaPennello(pennello) {
    if (!pennello || !pennello.celle || !pennello.celle.size) return
    const ctx = this.ctx, cellaPx = this.cellaPx
    const [r, g, b] = pennello.ok
      ? (COLORE_MATERIA[pennello.materia] || COLORE_MATERIA['*'])
      : [220, 110, 110]
    ctx.save()
    ctx.fillStyle = `rgba(${r},${g},${b},.30)`
    ctx.strokeStyle = `rgba(${r},${g},${b},.92)`
    ctx.lineWidth = 2
    for (const k of pennello.celle) {
      const [cx, cy] = k.split(',').map(Number)
      const x = cx * cellaPx - this.vista.x, y = cy * cellaPx - this.vista.y
      ctx.fillRect(x, y, cellaPx, cellaPx)
      ctx.strokeRect(x + 1, y + 1, cellaPx - 2, cellaPx - 2)
    }
    ctx.restore()
  }

  /* L'anello che si riempie mentre si tiene premuto: finché non è
     pieno non è successo niente, e lasciando adesso non si è mosso
     nulla. `anello.q` (0..1) arriva già calcolato da chi tiene la
     pressione — questa classe non sa quanto dura un tocco lungo, sa
     solo disegnare una frazione. */
  disegnaAnello(anello) {
    if (!anello) return
    const ctx = this.ctx, r = 20
    const q = Math.max(0, Math.min(1, anello.q))
    ctx.save()
    ctx.lineWidth = 4
    ctx.strokeStyle = 'rgba(0,0,0,.35)'
    ctx.beginPath(); ctx.arc(anello.x, anello.y, r, 0, Math.PI * 2); ctx.stroke()
    ctx.strokeStyle = 'rgba(255,224,138,.95)'
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.arc(anello.x, anello.y, r, -Math.PI / 2, -Math.PI / 2 + q * Math.PI * 2)
    ctx.stroke()
    ctx.restore()
  }
}
