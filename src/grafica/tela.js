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
export function creaTela(canvas, pittori, { unita = 420, minimo = 0.62, massimo = 1.5 } = {}) {
  let ctx = null, W = 0, H = 0, S = 1, dpr = 1
  let fondale = null                      // la tela nascosta con lo sfondo fermo

  /* La scala: quanti pixel vale un'unità di disegno. Tutti i numeri dei
     pittori sono in unità, così la stessa scena sta bene sul telefono e
     sul computer senza scriverla due volte. */
  function ridimensiona() {
    const r = canvas.parentElement.getBoundingClientRect()
    W = r.width; H = r.height
    dpr = window.devicePixelRatio || 1
    canvas.width = Math.floor(W * dpr); canvas.height = Math.floor(H * dpr)
    canvas.style.width = W + 'px'; canvas.style.height = H + 'px'
    ctx = canvas.getContext('2d')
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    S = Math.max(minimo, Math.min(massimo, Math.min(W, H) / unita))
    fondale = null                        // cambiata la misura, lo sfondo va rifatto
    return { W, H, S }
  }

  /* Lo sfondo fermo, dipinto una volta su una tela nascosta e poi solo
     ricopiato. Va richiamato quando cambia *cosa* c'è sullo sfondo (la
     tappa), non quando cambia quello che ci si muove sopra. */
  function dipingiFondale(dipingi) {
    if (!W || !H) return
    const cv = document.createElement('canvas')
    cv.width = Math.max(1, Math.floor(W * dpr)); cv.height = Math.max(1, Math.floor(H * dpr))
    const c = cv.getContext('2d')
    c.setTransform(dpr, 0, 0, dpr, 0, 0)
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
    ctx.clearRect(0, 0, W, H)
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

  return {
    ridimensiona, dipingiFondale, disegna,
    get misure() { return { W, H, S } },
  }
}
