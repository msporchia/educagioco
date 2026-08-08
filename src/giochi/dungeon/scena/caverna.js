/* ═══════════════════════════════════════════════════════════════════
   LA CAVERNA — quello che si disegna sotto le stanze

   Qui non si sa cosa sia un cuore, una gemma o una domanda: si riceve
   una fila di fatti già decisi — «questo sentiero è acceso», «la pedina
   sta qui» — e si dipinge. Le stanze invece **non** si disegnano: sono
   bottoni veri di `viste/Corsa.vue`, perché un cerchio su tela non si
   può toccare col dito né trovare in un test, e la mappa di un dungeon
   è fatta di cose da toccare.

   Quello che resta alla tela è l'atmosfera, cioè tutto quello che un
   template non sa dire: la pietra, le torce che guizzano, il pulviscolo
   che sale, i sentieri curvi, e la pedina che cammina lungo la curva
   invece di scivolare in linea retta.

   LE MISURE STANNO QUI. `MARGINE` è l'unico posto in cui si decide dove
   comincia il campo, e `Corsa.vue` lo importa per piazzare i bottoni:
   se stessero in due file diverse, un giorno le stanze si troverebbero
   staccate dai loro sentieri e nessuno saprebbe perché.
   ═══════════════════════════════════════════════════════════════════ */

/* Dove comincia il campo. Sotto ci sta la riga che dice cosa fare, e le
   stanze non le devono finire sopra; sopra basta lo spazio del bollino. */
export const MARGINE = { lati: 34, sopra: 46, sotto: 78 }

/* Quanto spazio vuole una fila. Una stanza è un bottone da 52 px col
   bollino ⚡ che sborda: sotto questa distanza due file si toccano e la
   mappa diventa una collana di palline. Le discese lunghe sono più alte
   dello schermo, e allora la discesa **scorre** — che è meglio di
   quattordici file schiacciate in una schermata sola. */
export const PASSO_FILA = 76

/* L'altezza che vuole una discesa di `file` file. */
export const altezzaDiscesa = file =>
  Math.max(0, file - 1) * PASSO_FILA + MARGINE.sopra + MARGINE.sotto

export class Caverna {
  constructor(tela) {
    this.tela = tela
    this.scena = { sentieri: [], pedina: null }
    this.vestito = { pietra: '#241f33', accento: '#a06fe0' }
    this.animazione = 0
    this.fondo = null
    this.pulviscolo = []
    this.cammino = null
    this.L = 0; this.A = 0; this.dpr = 1
    this.tempo = 0
    /* ── la finestra sulla discesa ──
       La tela è grande quanto **lo schermo**, non quanto la discesa: una
       discesa da quaranta file è alta più di tremila pixel, e un canvas
       così — moltiplicato per la densità dello schermo — sfonda il
       limite di lato che Safari su iPhone impone (4096), dove poi non
       disegna più niente. Quindi si disegna solo la fetta che si vede:
       `totale` è quanto è alta la discesa intera, `scorso` a che punto
       è arrivato lo scorrimento, e `punto()` fa la sottrazione. Offset
       e limit, niente di più. */
    this.totale = 0
    this.scorso = 0
  }

  /* Dove siamo arrivati a scorrere. Con `totale` a zero il conto torna
     quello di prima — la discesa sta tutta nello schermo — così una
     mappa corta non passa da nessun codice nuovo. */
  inquadratura(totale, scorso) {
    this.totale = totale || 0
    this.scorso = scorso || 0
  }

  /* il colore dell'ambiente: la ghiacciaia non è la fucina */
  vesti(vestito) {
    this.vestito = { ...this.vestito, ...vestito }
    this.fondo = null
  }

  mostra(scena) { this.scena = scena || { sentieri: [], pedina: null } }

  /* da 0..1 a pixel. È l'unico posto in cui si fa questo conto, e
     `Corsa.vue` fa lo stesso con `MARGINE` in CSS. */
  punto(xn, yn) {
    const { lati, sopra, sotto } = MARGINE
    /* l'altezza di riferimento è quella della **discesa intera**, non
       quella della tela: le stanze stanno lì dentro, e i sentieri
       devono passarci sopra al pixel. Poi si toglie lo scorrimento, che
       è quello che porta in vista la fetta giusta. */
    const H = this.totale || this.A
    return {
      x: lati + xn * Math.max(1, this.L - lati * 2),
      y: H - sotto - yn * Math.max(1, H - sopra - sotto) - this.scorso,
    }
  }

  misura() {
    const tela = this.tela
    if (!tela) return false
    const r = tela.getBoundingClientRect()
    if (!r.width || !r.height) return false
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    if (Math.round(r.width) === this.L && Math.round(r.height) === this.A && dpr === this.dpr) return true
    this.L = Math.round(r.width); this.A = Math.round(r.height); this.dpr = dpr
    tela.width = Math.round(this.L * dpr)
    tela.height = Math.round(this.A * dpr)
    this.fondo = null
    return true
  }

  avvia() {
    if (this.animazione) return
    const passo = ora => {
      this.animazione = requestAnimationFrame(passo)
      this.disegna(ora)
    }
    this.animazione = requestAnimationFrame(passo)
  }

  ferma() {
    cancelAnimationFrame(this.animazione)
    this.animazione = 0
    this.cammino = null
  }

  /* ── la pedina cammina lungo la curva ──
     Una coreografia a tempo: parte, ci mette il suo, e alla fine
     avvisa. Chi l'ha chiamata non sa quanti fotogrammi ci vogliono. */
  muovi(da, a, curva, poi) {
    this.cammino = { da, a, curva, t: 0, durata: 0.7, poi, passo: 0 }
  }

  get inCammino() { return !!this.cammino }

  /* ═══════ il disegno ═══════ */
  disegna(ora) {
    if (!this.misura()) return
    const ctx = this.tela.getContext('2d')
    const dt = Math.min(0.05, (ora - this.tempo) / 1000 || 0)
    this.tempo = ora
    const t = ora / 1000

    ctx.setTransform(1, 0, 0, 1, 0, 0)
    if (!this.fondo) this.fondo = this.dipingiFondo()
    ctx.drawImage(this.fondo, 0, 0)
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)

    this.torce(ctx, t)
    this.granelli(ctx, dt, t)
    this.sentieri(ctx, t)
    this.pedina(ctx, dt, t)
  }

  /* la pietra: si dipinge una volta e si tiene da parte, perché
     duecento mattoni per fotogramma sono duecento mattoni di troppo */
  dipingiFondo() {
    const c = document.createElement('canvas')
    c.width = Math.round(this.L * this.dpr)
    c.height = Math.round(this.A * this.dpr)
    const x = c.getContext('2d')
    x.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    const L = this.L, A = this.A
    const g = x.createLinearGradient(0, 0, 0, A)
    g.addColorStop(0, this.schiara(0.28)); g.addColorStop(0.55, this.vestito.pietra)
    g.addColorStop(1, this.schiara(0.12))
    x.fillStyle = g; x.fillRect(0, 0, L, A)

    const hM = 34, wM = 62
    for (let riga = 0, y = -hM; y < A + hM; y += hM, riga++)
      for (let px = (riga % 2 ? -wM / 2 : 0); px < L + wM; px += wM) {
        x.fillStyle = `rgba(255,255,255,${0.012 + Math.random() * 0.02})`
        x.fillRect(px + 1.5, y + 1.5, wM - 3, hM - 3)
        x.strokeStyle = 'rgba(0,0,0,0.22)'; x.lineWidth = 1
        x.strokeRect(px + 1.5, y + 1.5, wM - 3, hM - 3)
      }
    /* macchie di umido e di muffa, col colore dell'ambiente */
    for (let i = 0; i < 60; i++) {
      const cx = Math.random() * L, cy = Math.random() * A, r = 6 + Math.random() * 26
      const gg = x.createRadialGradient(cx, cy, 0, cx, cy, r)
      gg.addColorStop(0, Math.random() < 0.45 ? 'rgba(90,150,100,0.09)' : this.tinta(0.10))
      gg.addColorStop(1, 'rgba(0,0,0,0)')
      x.fillStyle = gg; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill()
    }
    const v = x.createRadialGradient(L / 2, A / 2, A * 0.22, L / 2, A / 2, A * 0.8)
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.6)')
    x.fillStyle = v; x.fillRect(0, 0, L, A)
    return c
  }

  /* le torce stanno nella striscia laterale dove le stanze non arrivano
     mai (xn resta fra 0.16 e 0.84): non danno fastidio a nessuno */
  torce(ctx, t) {
    const posti = [{ s: 0, q: 0.18 }, { s: 1, q: 0.44 }, { s: 0, q: 0.7 }, { s: 1, q: 0.92 }]
    for (const [i, p] of posti.entries()) {
      const x = p.s ? this.L - 16 : 16
      const y = MARGINE.sopra + p.q * (this.A - MARGINE.sopra - MARGINE.sotto)
      const guizzo = 0.72 + 0.28 * Math.sin(t * 7 + i * 2.1) * Math.sin(t * 11.3 + i)
      const g = ctx.createRadialGradient(x, y, 2, x, y, 72 * guizzo)
      g.addColorStop(0, `rgba(255,180,80,${0.3 * guizzo})`)
      g.addColorStop(0.45, `rgba(255,140,50,${0.1 * guizzo})`)
      g.addColorStop(1, 'rgba(255,120,40,0)')
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 72 * guizzo, 0, 7); ctx.fill()
      ctx.fillStyle = '#4a3a2c'; ctx.fillRect(x - 3, y + 2, 6, 18)
      ctx.fillStyle = '#6b5340'; ctx.fillRect(x - 6, y, 12, 5)
      ctx.fillStyle = `rgba(255,175,55,${0.9 * guizzo})`
      ctx.beginPath(); ctx.ellipse(x, y - 7, 6, 11 * guizzo, 0, 0, 7); ctx.fill()
      ctx.fillStyle = `rgba(255,235,150,${0.95 * guizzo})`
      ctx.beginPath(); ctx.ellipse(x, y - 5, 3.2, 6.5 * guizzo, 0, 0, 7); ctx.fill()
    }
  }

  granelli(ctx, dt, t) {
    if (this.pulviscolo.length < 30)
      this.pulviscolo.push({ x: Math.random() * this.L, y: this.A + 10,
                             v: 6 + Math.random() * 14, r: 0.7 + Math.random() * 1.3,
                             o: 0.08 + Math.random() * 0.22 })
    for (const p of this.pulviscolo) {
      p.y -= p.v * dt
      p.x += Math.sin(t + p.y * 0.02) * 0.25
      if (p.y < -10) { p.y = this.A + 10; p.x = Math.random() * this.L }
      ctx.fillStyle = `rgba(255,225,170,${p.o})`
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill()
    }
  }

  /* il punto di controllo del sentiero: spostato di lato, ma con la
     pancia tagliata a 24 px — sui tratti lunghi una curva proporzionale
     scavallerebbe il sentiero vicino e sembrerebbero incrociarsi */
  controllo(s) {
    const a = this.punto(s.ax, s.ay), b = this.punto(s.bx, s.by)
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2
    const dx = b.x - a.x, dy = b.y - a.y
    const len = Math.hypot(dx, dy) || 1
    const panza = Math.sign(s.curva) * Math.min(Math.abs(s.curva) * len, 24)
    return { a, b, q: { x: mx + (-dy / len) * panza, y: my + (dx / len) * panza } }
  }

  traccia(ctx, s) {
    const { a, b, q } = this.controllo(s)
    ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(q.x, q.y, b.x, b.y)
  }

  sentieri(ctx, t) {
    ctx.lineCap = 'round'
    for (const s of this.scena.sentieri || []) {
      this.traccia(ctx, s)
      ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 9; ctx.stroke()
      this.traccia(ctx, s)
      ctx.setLineDash([2, 9])
      ctx.strokeStyle = s.stato === 'fatto' ? 'rgba(255,201,60,0.5)' : 'rgba(190,175,225,0.28)'
      ctx.lineWidth = 4; ctx.stroke()
      ctx.setLineDash([])
      if (s.stato !== 'acceso') continue
      /* la strada che si può prendere adesso: corre */
      this.traccia(ctx, s)
      ctx.setLineDash([3, 10]); ctx.lineDashOffset = -t * 26
      ctx.strokeStyle = 'rgba(255,214,110,0.95)'; ctx.lineWidth = 5.5
      ctx.shadowColor = 'rgba(255,190,70,0.9)'; ctx.shadowBlur = 12
      ctx.stroke()
      ctx.shadowBlur = 0; ctx.setLineDash([]); ctx.lineDashOffset = 0
    }
    /* la prima scelta non ha un sentiero da cui arrivare: un tratteggio
       che sale dal fondo dice da dove si entra */
    for (const s of this.scena.ingressi || []) {
      const p = this.punto(s.x, s.y)
      ctx.beginPath(); ctx.moveTo(p.x, this.A + 6); ctx.lineTo(p.x, p.y)
      ctx.setLineDash([3, 10]); ctx.lineDashOffset = -t * 26
      ctx.strokeStyle = 'rgba(255,214,110,0.8)'; ctx.lineWidth = 5
      ctx.stroke(); ctx.setLineDash([]); ctx.lineDashOffset = 0
    }
  }

  pedina(ctx, dt, t) {
    let posto = null
    const c = this.cammino
    if (c) {
      c.t = Math.min(1, c.t + dt / c.durata)
      const e = c.t < 0.5 ? 2 * c.t * c.t : 1 - Math.pow(-2 * c.t + 2, 2) / 2
      const { a, b, q } = this.controllo({ ax: c.da.x, ay: c.da.y, bx: c.a.x, by: c.a.y, curva: c.curva })
      const u = 1 - e
      posto = { x: u * u * a.x + 2 * u * e * q.x + e * e * b.x,
                y: u * u * a.y + 2 * u * e * q.y + e * e * b.y }
      if (c.t >= 1) { const poi = c.poi; this.cammino = null; poi?.() }
    } else if (this.scena.pedina) {
      const p = this.punto(this.scena.pedina.x, this.scena.pedina.y)
      /* ferma, la pedina sta SOPRA la stanza e non sulla sua icona: se
         la coprisse non si saprebbe più dove si è finiti */
      posto = { x: p.x, y: p.y - 30 }
    }
    if (!posto) return

    const salto = Math.abs(Math.sin(t * 6)) * (c ? 5 : 1.6)
    ctx.fillStyle = 'rgba(0,0,0,0.45)'
    ctx.beginPath(); ctx.ellipse(posto.x, posto.y + 14, 10, 4, 0, 0, 7); ctx.fill()
    const g = ctx.createRadialGradient(posto.x, posto.y - salto, 2, posto.x, posto.y - salto, 28)
    g.addColorStop(0, 'rgba(255,220,150,0.5)'); g.addColorStop(1, 'rgba(255,220,150,0)')
    ctx.fillStyle = g
    ctx.beginPath(); ctx.arc(posto.x, posto.y - salto, 28, 0, 7); ctx.fill()
    ctx.font = '27px system-ui,"Noto Color Emoji","Segoe UI Emoji",sans-serif'
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText('🧒', posto.x, posto.y - salto - 2)
  }

  /* due comodità di colore: la pietra dell'ambiente schiarita, e
     l'accento reso trasparente. Servono al fondo e alle macchie. */
  schiara(quanto) {
    const [r, g, b] = leggi(this.vestito.pietra)
    const su = v => Math.round(v + (255 - v) * quanto)
    return `rgb(${su(r)},${su(g)},${su(b)})`
  }

  tinta(alfa) {
    const [r, g, b] = leggi(this.vestito.accento)
    return `rgba(${r},${g},${b},${alfa})`
  }
}

function leggi(colore) {
  const m = /^#([0-9a-f]{6})$/i.exec(colore || '')
  if (!m) return [40, 34, 54]
  const n = parseInt(m[1], 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
