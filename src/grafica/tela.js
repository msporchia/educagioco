/* ═══════════════════════════════════════════════════════════════════
   LA TELA — il pezzetto di motore grafico che ci siamo fatti in casa

   Perché non una libreria: Pixi o Konva pesano da cento a quattrocento
   chili di byte e portano uno scene graph completo, mentre a noi serve
   *un solo* schermo di canvas 2D. Il prodotto finito deve restare un
   HTML unico che si apre offline con due click: mezzo mega di motore
   per disegnare venti figure sarebbe un pessimo affare. Qui sotto ci
   sono le quattro cose che servivano davvero, in centocinquanta righe.

   Il confine che tiene tutto in ordine è questo:

     il gioco descrive UNA SCENA — una lista di cose con un nome, una
     posizione e i loro fatti — e non tocca mai il contesto 2D;
     la grafica ha un PITTORE per ogni nome, e non sa che esistono
     l'energia, le ondate o le operazioni in colonna.

   Fra i due passa solo la lista. Chi lavora sul gioco può ignorare
   questo file; chi lavora sul disegno può ignorare le regole.

   Le altre due cose che fa: tiene il canvas alla risoluzione giusta
   dello schermo (`ridimensiona`), e tiene in cassaforte lo sfondo che
   non cambia mai (`dipingiFondale`), che altrimenti si ridipingerebbe
   sessanta volte al secondo per niente.

   ── il mondo e la vista ──
   Sono due cose diverse, e tenerle separate è ciò che permette di
   cambiare inquadratura senza cambiare partita.

     il MONDO è quanto è grande il campo in unità di gioco. Chi ci
     gioca dentro — percorsi, raggi, velocità — misura solo questo,
     e se `mondo` è dichiarato **non dipende dallo schermo**: la
     stessa battaglia sul telefono e sul computer.
     la VISTA è dove cade il mondo dentro il canvas: una scala e uno
     scostamento, cioè una telecamera.

   Chi non dichiara un mondo lo prende dal canvas, com'è sempre stato,
   e la vista resta l'identità: per tutti gli altri giochi qui non
   cambia niente.
   ═══════════════════════════════════════════════════════════════════ */

/* Il pennello: il contesto 2D più le poche scorciatoie che nel disegno
   di un gioco ricorrono ovunque. Non nasconde `ctx` — quando serve una
   cosa strana si usa quello, senza dover allargare questa lista. */
export function pennello(ctx, misure) {
  const p = {
    ctx, ...misure, tempo: 0,

    ellisse(x, y, rx, ry, col) {
      ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, 6.29); ctx.fill()
    },
    cerchio(x, y, r, col) { p.ellisse(x, y, r, r, col) },
    rett(x, y, w, h, col) { ctx.fillStyle = col; ctx.fillRect(x, y, w, h) },
    /* un poligono da una lista di [x,y]: il modo più corto di dire
       «triangolo», che nei disegni di questo gioco è dappertutto */
    figura(punti, col) {
      ctx.fillStyle = col; ctx.beginPath()
      punti.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))
      ctx.closePath(); ctx.fill()
    },
    linea(punti, col, spessore) {
      ctx.strokeStyle = col; ctx.lineWidth = spessore
      ctx.beginPath()
      punti.forEach((q, i) => i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y))
      ctx.stroke()
    },
    testo(t, x, y, col, dim, peso = 900) {
      ctx.fillStyle = col; ctx.font = `${peso} ${dim}px system-ui`
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText(t, x, y)
    },
    /* disegna con l'origine spostata (e magari ruotata): dentro si
       ragiona in coordinate locali, che è l'unico modo per scrivere
       una figura complicata senza impazzire di somme */
    in(x, y, fn, rotazione = 0) {
      ctx.save(); ctx.translate(x, y); if (rotazione) ctx.rotate(rotazione)
      fn(p); ctx.restore()
    },
    velo(quanto, fn) { const a = ctx.globalAlpha; ctx.globalAlpha = quanto; fn(p); ctx.globalAlpha = a },
  }
  return p
}

/* il caso ripetibile: stesso seme, stesso bosco. Sta qui perché una
   texture che cambia a ogni ridisegno è una texture sbagliata. */
export function seminato(seme) {
  let s = seme | 0
  return () => {
    s = s + 0x6d2b79f5 | 0
    let t = Math.imul(s ^ s >>> 15, 1 | s)
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t
    return ((t ^ t >>> 14) >>> 0) / 4294967296
  }
}

/* ── la tela ──
   `pittori` è la tabella nome → funzione(pennello, cosa). Aggiungere un
   tipo di cosa al gioco vuol dire aggiungere una riga lì, non mettere
   le mani qui dentro. */
export function creaTela(canvas, pittori,
                         { unita = 420, minimo = 0.62, massimo = 1.5, mondo = null } = {}) {
  let ctx = null, W = 0, H = 0, S = 1, dpr = 1     // il mondo: quello che i pittori misurano
  let Wc = 0, Hc = 0                               // il canvas: i pixel veri sullo schermo
  let fondale = null, qualita = 1                  // la tela nascosta con lo sfondo fermo

  /* La telecamera. `ora` è dove sta, `mira` dov'è diretta: fra le due
     c'è un avvicinamento morbido, perché una vista che salta è una
     vista che disorienta.

     Per un po' si stringeva da sé quando qualcosa copriva il campo dal
     basso — il foglio di un'operazione — così mentre si calcolava si
     vedeva tutta la battaglia. Non si fa più: un'inquadratura che entra
     e esce a ogni tocco stanca l'occhio, e ricalcolare la scala di un
     canvas grande a ogni fotogramma stanca il telefono. Adesso il mondo
     sta fermo dov'è, e chi lo copre lo copre. */
  const ora = { k: 1, x: 0, y: 0 }
  const mira = { k: 1, x: 0, y: 0 }
  /* lo zoom di chi guarda, sopra a quello della telecamera: due dita
     sul campo. Uno non toglie l'altro — la mappa resta incorniciata,
     e questo la ingrandisce dentro la cornice. */
  let zoom = 1, panX = 0, panY = 0

  const fra = (min, v, max) => Math.max(min, Math.min(max, v))

  /* La scala: quanti pixel vale un'unità di disegno. Tutti i numeri dei
     pittori sono in unità, così la stessa scena sta bene sul telefono e
     sul computer senza scriverla due volte. */
  function ridimensiona() {
    const r = canvas.parentElement.getBoundingClientRect()
    Wc = r.width; Hc = r.height
    dpr = window.devicePixelRatio || 1
    canvas.width = Math.floor(Wc * dpr); canvas.height = Math.floor(Hc * dpr)
    canvas.style.width = Wc + 'px'; canvas.style.height = Hc + 'px'
    ctx = canvas.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    /* un mondo dichiarato non si piega allo schermo: è lo schermo che
       gli si adatta, ed è tutta la differenza fra una battaglia uguale
       dappertutto e quindici mappe che si deformano */
    W = mondo ? mondo.W : Wc
    H = mondo ? mondo.H : Hc
    /* un mondo può dichiarare anche la sua scala, e allora è quella:
       quanto vede una torre non è una conseguenza della forma dello
       schermo, è una regola del gioco */
    S = mondo && mondo.S ? mondo.S
                         : Math.max(minimo, Math.min(massimo, Math.min(W, H) / unita))
    fondale = null                        // cambiata la misura, lo sfondo va rifatto
    inquadra(true)
    return { W, H, S }
  }

  /* ── dove cade il mondo dentro il canvas ──
     Tutto intero, centrato. `subito` salta l'avvicinamento morbido:
     serve quando cambia la misura dello schermo, dove non c'è niente da
     accompagnare — mentre il pizzico delle dita va accompagnato. */
  function inquadra(subito = false) {
    const visibile = Hc
    const base = Math.min(Wc / W, visibile / H)
    mira.k = base * zoom
    // lo scostamento è quello che centra il mondo nella fascia libera, più
    // quanto l'ha spostato il dito; oltre il bordo non si va
    const spanX = Math.max(0, W * mira.k - Wc), spanY = Math.max(0, H * mira.k - visibile)
    panX = fra(-spanX / 2, panX, spanX / 2); panY = fra(-spanY / 2, panY, spanY / 2)
    mira.x = (Wc - W * mira.k) / 2 + panX
    mira.y = (visibile - H * mira.k) / 2 + panY
    if (subito) Object.assign(ora, mira)
    return mira
  }

  /* le due dita: `pizzica` ingrandisce, `trascina` sposta. Il fondale
     non si ridipinge — si ricopia più grande — perché a zoom fatto con
     le dita la nitidezza conta meno della fluidità. */
  function pizzica(fattore) { zoom = fra(1, zoom * fattore, 3); return inquadra() }
  function trascina(dx, dy) { panX += dx; panY += dy; return inquadra() }
  function rimetti() { zoom = 1; panX = panY = 0; return inquadra() }

  /* dal dito al campo: l'inverso esatto della telecamera, ed è l'unica
     cosa che chi raccoglie i tocchi deve sapere di lei */
  const versoIlMondo = (x, y) => ({ x: (x - ora.x) / ora.k, y: (y - ora.y) / ora.k })
  /* e l'andata, che serve a chi deve mettere un dito — o una prova
     automatica — su una cosa di cui conosce il posto nel mondo */
  const versoLoSchermo = (x, y) => ({ x: x * ora.k + ora.x, y: y * ora.k + ora.y })

  /* Lo sfondo fermo, dipinto una volta su una tela nascosta e poi solo
     ricopiato. Va richiamato quando cambia *cosa* c'è sullo sfondo (la
     tappa), non quando cambia quello che ci si muove sopra.

     Si dipinge alla scala della vista **piena**, che è la più grande a
     cui si vedrà: quando il foglio dell'operazione sale, la telecamera
     rimpicciolisce e una copia ridotta è sempre bella. Il contrario —
     dipingerlo piccolo e ingrandirlo — sarebbe una sfocatura. */
  function dipingiFondale(dipingi) {
    if (!W || !H || !Wc || !Hc) return
    qualita = Math.max(1, Math.min(Wc / W, Hc / H))
    const cv = document.createElement('canvas')
    cv.width = Math.max(1, Math.floor(W * dpr * qualita))
    cv.height = Math.max(1, Math.floor(H * dpr * qualita))
    const c = cv.getContext('2d')
    c.setTransform(dpr * qualita, 0, 0, dpr * qualita, 0, 0)
    dipingi(pennello(c, { W, H, S }))
    fondale = cv
  }

  /* Un fotogramma. `scena` è la lista di cose: ognuna ha `che` (chi la
     dipinge), una posizione, e i fatti che le servono. L'ordine lo
     decide la tela, non chi ha scritto la lista:

       `strato` −1 sotto tutto, 0 a terra, 1 sopra tutto;
       a terra si va dal più lontano al più vicino, cioè per `y`
       crescente, così chi sta davanti copre chi sta dietro.

     È il motivo per cui un mostro passa *dietro* alla torre più in
     basso e *davanti* a quella più in alto senza che nessuno se ne
     debba occupare. */
  function disegna(scena, tempo = 0, luce = null) {
    if (!ctx) return
    avvicina()
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, Wc, Hc)
    /* da qui in giù si dipinge nel mondo: i pittori non sanno che
       esiste una telecamera, e non devono saperlo */
    ctx.setTransform(dpr * ora.k, 0, 0, dpr * ora.k, dpr * ora.x, dpr * ora.y)
    if (fondale) ctx.drawImage(fondale, 0, 0, W, H)
    const p = pennello(ctx, { W, H, S })
    p.tempo = tempo
    /* CHE LUCE C'È QUI. Arriva come funzione e non come dato perché
       dipende da *dove* sta la cosa che si sta dipingendo, e questo
       lo sa solo il pittore un attimo prima di posare il colore.
       Chi non la passa disegna in piena luce, come ha sempre fatto:
       un ritratto, una vetrina e un'anteprima non hanno una stanza
       attorno, e non devono inventarsene una. */
    p.luce = luce
    const ordinata = scena.slice().sort((a, b) =>
      (a.strato || 0) - (b.strato || 0) || (a.y || 0) - (b.y || 0))
    for (const cosa of ordinata) {
      const pittore = pittori[cosa.che]
      if (!pittore) continue
      /* ── QUESTA SI NOMINA, QUELLA È DIPINTA ──
         Due righe, e sono la differenza fra un campo leggibile e un
         campo pieno di roba. Il motore lo dichiara da sempre — ogni
         `faccia()` di una cosa in gioco passa `alone: true`, e i
         commenti in `elementi/porta.js` e `elementi/oggetto.js` dicono
         cosa vuol dire: «è una cosa che si nomina in un ordine, non
         arredo dipinto sul fondale». Solo che non lo disegnava
         nessuno, e allora una cassa di scena e un forziere da aprire
         erano due disegni con lo stesso peso.
         Il segno sta A TERRA e non addosso alla figura: non copre il
         disegno, non lampeggia, e si legge anche quando le cose sono
         fitte. `velo` è il rovescio della stessa medaglia — quanto una
         cosa deve stare indietro — e chi non lo passa dipinge in
         pieno, come ha sempre fatto. */
      if (cosa.alone) {
        /* ── E IL BORDO SEGUE LA FIGURA, NON LA CASELLA ──
           Il fiato a terra dice «qui c'è qualcosa» ma non stacca la
           cosa dal fondo: un sacco marrone su un pavimento marrone
           resta invisibile anche con un alone sotto. L'ombra chiara
           invece si attacca alla **sagoma** — la disegna il canvas da
           sé, seguendo l'alfa di quello che il pittore posa — quindi è
           un bordino luminoso attorno al contorno vero, qualunque
           forma abbia, senza che nessun pittore debba saperne niente. */
        fiato(p, cosa)
        ctx.save()
        ctx.shadowColor = '#fffbe8'
        ctx.shadowBlur = 3.5 * S
        pittore(p, cosa)
        ctx.restore()
      } else if (cosa.velo != null) p.velo(cosa.velo, () => pittore(p, cosa))
      else pittore(p, cosa)
    }
  }

  /* il fiato sotto una cosa che si può nominare: un'ellisse chiara e
     bassa, schiacciata come tutto quello che sta a terra */
  function fiato(p, cosa) {
    const R = S * 13
    const g = p.ctx.createRadialGradient(cosa.x, cosa.y, R * 0.2, cosa.x, cosa.y, R)
    g.addColorStop(0, '#ffe9b422'); g.addColorStop(0.7, '#ffe9b40e'); g.addColorStop(1, '#ffe9b400')
    p.ctx.save()
    p.ctx.translate(cosa.x, cosa.y); p.ctx.scale(1, 0.5); p.ctx.translate(-cosa.x, -cosa.y)
    p.ctx.fillStyle = g
    p.ctx.beginPath(); p.ctx.arc(cosa.x, cosa.y, R, 0, 6.29); p.ctx.fill()
    p.ctx.restore()
  }

  /* l'avvicinamento morbido: un quinto della strada che manca a ogni
     fotogramma, e quando è vicina si posa. Non serve il tempo vero —
     un'inquadratura non è una fisica, e a schermo fermo non si muove
     nessuno. */
  function avvicina() {
    for (const k of ['k', 'x', 'y']) {
      const d = mira[k] - ora[k]
      ora[k] = Math.abs(d) < (k === 'k' ? 0.001 : 0.3) ? mira[k] : ora[k] + d * 0.2
    }
  }

  return {
    ridimensiona, dipingiFondale, disegna,
    inquadra, pizzica, trascina, rimetti, versoIlMondo, versoLoSchermo,
    get misure() { return { W, H, S } },
    /* quanto del canvas sta occupando il mondo adesso: serve a chi deve
       mettere qualcosa *accanto* al campo senza coprirlo */
    get vista() { return { ...ora, Wc, Hc } },
  }
}
