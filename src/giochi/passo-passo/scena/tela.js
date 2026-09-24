/* ═══════════════════════════════════════════════════════════════════
   LA TELA — il livello, disegnato

   Riceve un fotogramma già deciso (`scena/proiezione.js`: dove sta il
   coniglio, che faccia ha, dove sono i massi, cosa sta succedendo) e lo
   dipinge. Non sa niente di regole: non sa perché il coniglio si ferma,
   né quanto vale una carota.

   ── LA SCALA STA NELLA TRASFORMAZIONE ─────────────────────────────
   Come nel sotterraneo: il contesto si scala una volta per fotogramma,
   e da lì in poi tutto è in **pixel dello sprite** — una cella è 16, il
   coniglio è alto quello che è alto. Lo zoom è intero **in pixel del
   dispositivo** (`k`): il canvas è grande esattamente `mondo × k`, e il
   CSS lo rimpicciolisce di `devicePixelRatio`, così un pixel dello
   sprite è sempre un quadrato di `k` pixel veri e niente si sfrangia.
   Con `k` in pixel veri e non in pixel CSS ci sono più misure fra cui
   scegliere: a densità 2, una cella può essere 40 px CSS invece di
   dover saltare da 32 a 48.

   ── LA PLANCIA ────────────────────────────────────────────────────
   Il livello è un pezzo di mondo posato sullo schermo, con il suo
   spessore di terra sotto: si vede dove finisce, ed è lì che il
   coniglio sbatte. Sopra la prima riga c'è un po' d'aria (`TESTA`),
   perché le orecchie e i salti ci passano.

   ── DAVANTI E DIETRO ──────────────────────────────────────────────
   Tutto quello che sta in piedi — alberi, sassi, massi, la tana, la
   carota, il coniglio — si disegna in ordine di **dove tocca terra**:
   chi sta più in basso sullo schermo sta davanti. Il terreno, le buche
   e i ponti stanno per terra e si disegnano prima.
   ═══════════════════════════════════════════════════════════════════ */
import { ATLANTE, PEZZI, TESSERA } from '../../fattoria/dati/atlante.js'
import { creaFoglio, netto } from '../../../grafica/atlante.js'
import { pezzo, COLORI, STAGIONI, CAROTA, ALBERO, ALBERO_NEVE, ALBERO_AUTUNNO, TANA, MASSO,
         CESPUGLIO, TAVOLOZZA_BACCHE, TAVOLOZZA_FIORI, PALO, FUMETTO, CUORE, STELLINA } from './pixel.js'
import { COPPIE } from '../dati/mondo.js'

/* il colore dell'anello di una buca: lo dice il vocabolario del mondo,
   perché «la coppia viola» è un fatto e non un disegno */
const coloreBuca = coppia => (COPPIE[coppia] || {}).colore || '#ffffff'

export const T = TESSERA              // 16: una cella, in pixel dello sprite
export const TESTA = 10               // l'aria sopra la prima riga
export const ZOCCOLO = 5              // lo spessore di terra sotto l'ultima
export const LATO = 1                 // un filo ai lati, per l'ombra della plancia
const CELLA_MAX = 90                  // px CSS: oltre, un livello piccolo diventa un poster

/* un numero fisso per cella, per le decorazioni: lo stesso livello si
   disegna sempre uguale, e due celle vicine non si somigliano */
const hash = (x, y, k = 0) => {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(k, 1274126177)) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296
}

export class Tela {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.foglio = creaFoglio({ pezzi: PEZZI, immagine: ATLANTE, tessera: T })
    this.foglio.carica().catch(() => {})
    this.liv = null
    this.fondo = null
    this.k = 0
    this.dpr = 1
    this.W = 0
    this.H = 0
  }

  /* la tela può cambiare sotto i piedi: tornando alla mappa il `v-if`
     smonta il campo, e il canvas della partita dopo è un altro elemento
     (vedi `sotterraneo/scena/tela.js`, dove questo guasto si è visto) */
  attacca(canvas) {
    if (this.canvas === canvas) return false
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.k = 0
    return true
  }

  /* ── il livello nuovo ──
     Il terreno non si muove mai: si dipinge una volta in un canvas a
     parte, e a ogni fotogramma si copia. */
  prepara(liv, tema = 'primavera') {
    this.liv = liv
    this.tema = STAGIONI[tema] ? tema : 'primavera'
    this.W = liv.colonne * T + 2 * LATO
    this.H = TESTA + liv.righe * T + ZOCCOLO + 1
    this.fondo = dipingiFondo(liv, this.tema)
    this.k = 0
    this.misura()
  }

  /* quanto è grande, adesso: l'ingrandimento intero più grande che fa
     stare la plancia intera nel suo riquadro */
  misura() {
    if (!this.liv) return false
    const casa = this.canvas.parentElement || this.canvas
    const r = casa.getBoundingClientRect()
    if (!r.width || !r.height) return false
    const dpr = Math.min(3, window.devicePixelRatio || 1)
    const kSta = Math.floor(Math.min(r.width * dpr / this.W, r.height * dpr / this.H))
    const kTetto = Math.floor(CELLA_MAX * dpr / T)
    const k = Math.max(1, Math.min(kSta, kTetto))
    if (k === this.k && dpr === this.dpr) return true
    this.k = k
    this.dpr = dpr
    this.canvas.width = this.W * k
    this.canvas.height = this.H * k
    this.canvas.style.width = `${(this.W * k) / dpr}px`
    this.canvas.style.height = `${(this.H * k) / dpr}px`
    return true
  }

  /* ═══════════ un fotogramma ═══════════ */
  disegna(f, orologio = 0) {
    if (!this.liv || !this.fondo || !this.misura()) return
    const ctx = this.ctx
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    ctx.setTransform(this.k, 0, 0, this.k, 0, 0)
    netto(ctx)

    ctx.drawImage(this.fondo, 0, 0)
    this.acquaViva(f, orologio)
    this.ghiaccioVivo(orologio)

    /* per terra: le buche, i ponti, e la cella dove qualcosa è andato storto */
    this.buche(orologio)
    for (const p of f.ponti) this.ponte(p)
    if (f.guasto) this.segnaGuasto(f.guasto, orologio)

    /* in piedi, in ordine di dove toccano terra */
    const figure = []
    const liv = this.liv
    for (let i = 0; i < liv.n; i++) {
      const o = liv.ostacolo[i]
      if (!o) continue
      const x = liv.x(i), y = liv.y(i)
      figure.push({ piede: (y + 1) * T, disegna: () => this.ostacolo(o, x, y) })
    }
    const tana = liv.xy(liv.tana)
    figure.push({ piede: (tana.y + 1) * T - 0.5, disegna: () => this.tana(tana.x, tana.y, f) })
    for (const m of f.massi) {
      if (m.alfa <= 0) continue
      figure.push({ piede: (m.y + 1) * T - 1, disegna: () => this.masso(m) })
    }
    if (f.carota && !f.carota.presa)
      figure.push({ piede: (f.carota.y + 1) * T - 1.5, disegna: () => this.carota(f.carota, orologio) })
    /* il coniglio sta davanti a quello che ha nella sua stessa riga: entra
       dalla porta della tana, e solo alla fine le scivola dietro */
    const c = f.coniglio
    figure.push({ piede: (c.y + 1) * T + 0.5, disegna: () => this.coniglio(c, f, orologio) })
    figure.sort((a, b) => a.piede - b.piede)
    for (const fig of figure) fig.disegna()

    for (const e of f.effetti) this.effetto(e, f.t)
    if (f.fumetto) this.fumetto(c, f.t - f.fumetto.t0)
    if (f.scenetta === 'sbatte' || f.scenetta === 'stanco') this.stelleInTesta(c, orologio)
  }

  /* da cella a pixel dello sprite: il centro della cella, e il fondo */
  cx(x) { return LATO + (x + 0.5) * T }
  fy(y) { return TESTA + (y + 1) * T }

  /* ═══════════ il terreno che si muove ═══════════ */
  acquaViva(f, t) {
    const ctx = this.ctx, liv = this.liv
    ctx.fillStyle = COLORI.acquaRiflesso
    for (let i = 0; i < liv.n; i++) {
      if (liv.terreno[i] !== 'acqua') continue
      const x = liv.x(i), y = liv.y(i)
      if (f.ponti.some(p => p.x === x && p.y === y)) continue
      const x0 = LATO + x * T, y0 = TESTA + y * T
      for (let r = 0; r < 2; r++) {
        const fase = hash(x, y, r + 3)
        const riga = 4 + r * 6 + Math.round(fase * 3)
        const scorre = Math.floor((t * 2.2 + fase * 12) % 12)
        ctx.fillRect(x0 + scorre, y0 + riga, 3, 1)
      }
    }
  }

  ghiaccioVivo(t) {
    const ctx = this.ctx, liv = this.liv
    ctx.fillStyle = COLORI.ghiaccioLuce
    for (let i = 0; i < liv.n; i++) {
      if (liv.terreno[i] !== 'ghiaccio') continue
      const x = liv.x(i), y = liv.y(i)
      const fase = hash(x, y, 9)
      const q = (t * 0.7 + fase * 5) % 5
      if (q > 0.35) continue
      const px = LATO + x * T + 3 + Math.floor(hash(x, y, 10) * 10)
      const py = TESTA + y * T + 3 + Math.floor(hash(x, y, 11) * 10)
      ctx.fillRect(px, py - 1, 1, 3)
      ctx.fillRect(px - 1, py, 3, 1)
    }
  }

  buche(t) {
    const ctx = this.ctx, liv = this.liv
    for (let i = 0; i < liv.n; i++) {
      if (liv.terreno[i] !== 'buca') continue
      const x = liv.x(i), y = liv.y(i)
      const x0 = LATO + x * T, y0 = TESTA + y * T
      const colore = coloreBuca(liv.coppia[i])
      /* l'anello respira piano: dice «qui succede qualcosa» senza
         lampeggiare */
      const luce = 0.75 + 0.25 * Math.sin(t * 2.4 + liv.coppia[i])
      ctx.globalAlpha = luce
      ellisse(ctx, x0 + 1, y0 + 4, 14, 10, colore)
      ctx.globalAlpha = 1
      ellisse(ctx, x0 + 3, y0 + 6, 10, 6, '#3a2618')
      ellisse(ctx, x0 + 4, y0 + 7, 8, 4, '#140c08')
    }
  }

  ponte(p) {
    const ctx = this.ctx
    const x0 = LATO + p.x * T, y0 = TESTA + p.y * T
    /* la cima del masso affondato, a pelo d'acqua: lo stesso sasso di
       prima, con gli stessi colori — è diventato un ponte, non è
       arrivato un sasso nuovo. Ci si cammina sopra. */
    ellisse(ctx, x0 + 1, y0 + 3, 14, 11, '#4a3020')
    ellisse(ctx, x0 + 1, y0 + 2, 14, 10, '#b88a58')
    ellisse(ctx, x0 + 3, y0 + 3, 7, 3, '#e2c294')
    ctx.fillStyle = COLORI.acquaRiflesso
    ctx.fillRect(x0 + 2, y0 + 13, 12, 1)
  }

  /* il punto dove la fila si è fermata: un riquadro caldo che pulsa, non
     rosso — è un «guarda qui», non un «hai sbagliato» */
  segnaGuasto(g, t) {
    const ctx = this.ctx, liv = this.liv
    const q = 0.55 + 0.45 * Math.sin(t * 9)
    ctx.globalAlpha = q
    ctx.fillStyle = '#ffb020'
    if (g.fuori) {
      /* contro il bordo: si accende il bordo della plancia da quella parte */
      const x = Math.max(-1, Math.min(liv.colonne, g.x)), y = Math.max(-1, Math.min(liv.righe, g.y))
      if (x < 0) ctx.fillRect(0, TESTA + y * T, 2, T)
      else if (x >= liv.colonne) ctx.fillRect(LATO + liv.colonne * T - 1, TESTA + y * T, 2, T)
      else if (y < 0) ctx.fillRect(LATO + x * T, TESTA - 1, T, 2)
      else ctx.fillRect(LATO + x * T, TESTA + liv.righe * T - 1, T, 2)
    } else {
      const x0 = LATO + g.x * T, y0 = TESTA + g.y * T
      ctx.fillRect(x0, y0, T, 1)
      ctx.fillRect(x0, y0 + T - 1, T, 1)
      ctx.fillRect(x0, y0, 1, T)
      ctx.fillRect(x0 + T - 1, y0, 1, T)
    }
    ctx.globalAlpha = 1
  }

  /* ═══════════ chi sta in piedi ═══════════ */
  ostacolo(o, x, y) {
    const ctx = this.ctx
    const cx = this.cx(x), fy = this.fy(y)
    if (o === 'albero') {
      const disegno = this.tema === 'inverno' ? pezzo('albero-neve', ALBERO_NEVE)
        : this.tema === 'autunno' ? pezzo('albero-autunno', ALBERO_AUTUNNO)
        : pezzo('albero', ALBERO)
      ombra(ctx, cx, fy - 1, 12)
      /* metà degli alberi allo specchio: un bosco di alberi tutti uguali
         sembra un timbro */
      specchiato(ctx, disegno, Math.round(cx - 8), fy - 15, hash(x, y, 7) < 0.5)
      if (this.tema === 'inverno' && hash(x, y, 4) < 0.5) {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(Math.round(cx - 6 + hash(x, y, 5) * 3), fy - 2, 3, 1)
      }
    } else if (o === 'cespuglio') {
      const bacche = hash(x, y, 1) < 0.5
      const d = pezzo(bacche ? 'cespuglio-bacche' : 'cespuglio-fiori',
                      { righe: CESPUGLIO, tavolozza: bacche ? TAVOLOZZA_BACCHE : TAVOLOZZA_FIORI })
      ombra(ctx, cx, fy - 1, 13)
      specchiato(ctx, d, Math.round(cx - 8), fy - 13, hash(x, y, 8) < 0.5)
    } else if (o === 'sasso') {
      ombra(ctx, cx, fy - 1, 13)
      this.foglio.posa(ctx, 'sasso_fiorito7', cx, fy)
      if (this.tema === 'inverno') {
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(Math.round(cx - 4), fy - 15, 7, 1)
        ctx.fillRect(Math.round(cx - 5), fy - 14, 3, 1)
      }
    } else if (o === 'tronco') {
      ombra(ctx, cx, fy - 3, 14)
      this.foglio.posa(ctx, 'tronco_corto', cx, fy - 3)
    } else if (o === 'staccionata') {
      this.staccionata(x, y)
    }
  }

  /* La staccionata si compone con le vicine, come una strada: le
     traverse vanno verso le celle dove continua. Da sola è un pezzo di
     staccionata di traverso. È bassa, e deve sembrarlo: le traverse
     stanno a metà altezza di un coniglio. */
  staccionata(x, y) {
    const ctx = this.ctx, liv = this.liv
    const e = (dx, dy) => {
      const i = liv.vicino(liv.indice(x, y), dx, dy)
      return i >= 0 && liv.ostacolo[i] === 'staccionata'
    }
    const x0 = LATO + x * T, y0 = TESTA + y * T
    const sx = e(-1, 0), dx = e(1, 0), su = e(0, -1), giu = e(0, 1)
    const legno = '#b07a44', scuro = '#6a4424'
    ctx.fillStyle = 'rgba(0,0,0,.18)'
    ctx.fillRect(x0 + (sx ? 0 : 6), y0 + 13, (sx ? 8 : 2) + (dx ? 8 : 2), 2)
    /* le traverse orizzontali */
    const orizz = sx || dx || !(su || giu)
    if (orizz) {
      const a = sx || !(dx) ? 0 : 7, b = dx || !(sx) ? 16 : 9
      for (const r of [8, 11]) {
        ctx.fillStyle = scuro; ctx.fillRect(x0 + a, y0 + r + 1, b - a, 1)
        ctx.fillStyle = legno; ctx.fillRect(x0 + a, y0 + r, b - a, 1)
      }
    }
    /* e quelle che scendono */
    if (su || giu) {
      const a = su ? 0 : 7, b = giu ? 16 : 9
      ctx.fillStyle = scuro; ctx.fillRect(x0 + 8, y0 + a, 1, b - a)
      ctx.fillStyle = legno; ctx.fillRect(x0 + 7, y0 + a, 1, b - a)
    }
    const palo = pezzo('palo', PALO)
    ctx.drawImage(palo, x0 + 6, y0 + 7)
    if (orizz && !sx && !dx) {
      ctx.drawImage(palo, x0, y0 + 7)
      ctx.drawImage(palo, x0 + 12, y0 + 7)
    }
  }

  tana(x, y, f) {
    const ctx = this.ctx
    const cx = this.cx(x), fy = this.fy(y)
    ombra(ctx, cx, fy - 1, 15)
    ctx.drawImage(pezzo('tana', TANA), Math.round(cx - 8), fy - 14)
    /* la porta si accende quando si arriva: c'è qualcuno in casa */
    if (f.festa) {
      ctx.fillStyle = 'rgba(255,214,90,.55)'
      ctx.fillRect(Math.round(cx - 3), fy - 7, 6, 5)
    }
  }

  masso(m) {
    const ctx = this.ctx
    const cx = this.cx(m.x), fy = this.fy(m.y)
    const giu = Math.round((m.affonda || 0) * 9)
    ombra(ctx, cx, fy - 1, 12)
    const d = pezzo('masso', MASSO)
    const h = d.height - giu
    if (h <= 0) return
    /* affondando, si vede solo quello che sta ancora sopra l'acqua */
    ctx.drawImage(d, 0, 0, d.width, h, Math.round(cx - d.width / 2), fy - 1 - d.height + giu, d.width, h)
  }

  carota(c, t) {
    const ctx = this.ctx
    const cx = this.cx(c.x), fy = this.fy(c.y)
    /* la carota respira: dice «prendimi» a chi guarda la mappa */
    const su = Math.round(Math.sin(t * 3.2) * 1)
    ombra(ctx, cx, fy - 2, 7)
    ctx.drawImage(pezzo('carota', CAROTA), Math.round(cx - 4.5), fy - 14 + su)
  }

  /* ── il coniglio ──
     Dall'atlante della fattoria: tre versi, quattro fotogrammi, e la
     sinistra è la destra allo specchio. Il fotogramma 0 è da fermo, gli
     altri tre sono il passo. */
  coniglio(c, f, t) {
    if (c.alfa <= 0) return
    const ctx = this.ctx
    const img = this.foglio.immagine
    const specchia = c.verso === 'sinistra'
    const verso = c.verso === 'destra' || c.verso === 'sinistra' ? 'lato' : c.verso
    let fr = 0
    if (c.posa === 'cammina') fr = 1 + (Math.floor(c.fase * 6) % 3)
    else if (c.posa === 'spinge') fr = 1 + (Math.floor(c.fase * 4) % 3)
    else if (c.posa === 'salta') fr = 2
    const nome = `coniglio_${verso}${fr}`
    const p = PEZZI[nome] || PEZZI[`coniglio_${verso}0`]
    const cx = this.cx(c.x)
    const fy = this.fy(c.y) + 1
    let dx = 0
    /* stordito: trema di un pixel, a scatti. Girare uno sprite in pixel
       art lo sfrangerebbe; spostarlo no */
    if (c.posa === 'stordito') dx = Math.floor(t * 14) % 2 ? 1 : -1
    if (c.posa === 'spinge') dx = specchia ? -1 : verso === 'lato' ? 1 : 0

    if (!c.immerso) ombra(ctx, cx, this.fy(c.y) - 1, Math.max(4, 11 - Math.round((c.su || 0) * 0.6)))
    if (!img || !p) return
    const [sx, sy, w, h] = p
    /* Le ultime tre righe dello sprite sono vuote: i piedi finiscono lì
       sopra. Immerso — nell'acqua, in una buca, dentro la tana — si vede
       solo la parte di sopra, appoggiata al pelo dell'acqua. */
    const pieno = h - 3
    const vis = c.immerso ? Math.round(pieno * (1 - c.immerso)) : h
    if (vis <= 0) return
    const x = Math.round(cx - w / 2) + dx
    const piedi = fy - 3 - Math.round(c.su || 0)
    const y = c.immerso ? piedi - 2 - vis : piedi + 3 - h
    ctx.globalAlpha = c.alfa
    if (specchia) {
      ctx.save()
      ctx.translate(x + w, y)
      ctx.scale(-1, 1)
      ctx.drawImage(img, sx, sy, w, vis, 0, 0, w, vis)
      ctx.restore()
    } else {
      ctx.drawImage(img, sx, sy, w, vis, x, y, w, vis)
    }
    ctx.globalAlpha = 1
    /* nell'acqua fino al collo: il pelo dell'acqua gli passa davanti, e
       ai lati fa due cerchi */
    if (c.immerso && f.scenetta === 'splash') {
      ctx.fillStyle = COLORI.schiuma
      ctx.fillRect(x + 2, y + vis, w - 4, 1)
      ctx.fillStyle = COLORI.acquaRiflesso
      ctx.fillRect(x - 1, y + vis + 1, 3, 1)
      ctx.fillRect(x + w - 2, y + vis + 1, 3, 1)
    }
  }

  stelleInTesta(c, t) {
    const ctx = this.ctx
    const cx = this.cx(c.x), top = this.fy(c.y) - 20
    const stella = pezzo('stellina', STELLINA)
    for (let i = 0; i < 3; i++) {
      const a = t * 4 + i * (Math.PI * 2 / 3)
      ctx.drawImage(stella, Math.round(cx - 2 + Math.cos(a) * 7), Math.round(top + Math.sin(a) * 2))
    }
  }

  fumetto(c, eta) {
    if (eta < 0) return
    const ctx = this.ctx
    const d = pezzo('fumetto', FUMETTO)
    const su = eta < 0.25 ? Math.round((1 - eta / 0.25) * 4) : Math.round(Math.sin(eta * 3) * 1)
    const x = Math.min(this.W - d.width, Math.max(0, Math.round(this.cx(c.x) + 3)))
    const y = Math.max(0, this.fy(c.y) - 21 - d.height + su)
    ctx.drawImage(d, x, y)
  }

  /* ═══════════ quello che succede e passa ═══════════ */
  effetto(e, adesso) {
    const eta = adesso - e.t0
    if (eta < 0) return
    const ctx = this.ctx
    const cx = this.cx(e.x), fy = this.fy(e.y)
    switch (e.che) {
      case 'brina': {
        if (eta > 0.35) return
        ctx.globalAlpha = 1 - eta / 0.35
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(Math.round(cx - 5), fy - 2, 2, 1)
        ctx.fillRect(Math.round(cx + 3), fy - 3, 1, 1)
        ctx.globalAlpha = 1
        return
      }
      case 'botta': {
        if (eta > 0.7) return
        const stella = pezzo('stellina', STELLINA)
        const r = 3 + eta * 14
        ctx.globalAlpha = 1 - eta / 0.7
        for (let i = 0; i < 4; i++) {
          const a = i * Math.PI / 2 + 0.6
          ctx.drawImage(stella, Math.round(cx - 2 + Math.cos(a) * r), Math.round(fy - 10 + Math.sin(a) * r * 0.7))
        }
        ctx.globalAlpha = 1
        return
      }
      case 'splash': {
        if (eta > 1) return
        ctx.globalAlpha = 1 - eta
        ctx.fillStyle = '#ffffff'
        for (let i = 0; i < 6; i++) {
          const a = Math.PI + (i / 5) * Math.PI
          const r = 3 + eta * 10
          const x = cx + Math.cos(a) * r
          const y = fy - 6 + Math.sin(a) * r * 0.9 + eta * eta * 12
          ctx.fillRect(Math.round(x), Math.round(y), 2, 2)
        }
        ellisseVuota(ctx, cx - 4 - eta * 5, fy - 5, 8 + eta * 10, 4 + eta * 3, '#ffffff')
        ctx.globalAlpha = 1
        return
      }
      case 'anelli': {
        if (eta > 1.1) return
        ctx.globalAlpha = 1 - eta / 1.1
        ellisseVuota(ctx, cx - 3 - eta * 6, fy - 8 - eta * 2, 6 + eta * 12, 3 + eta * 5, '#ffffff')
        ctx.globalAlpha = 1
        return
      }
      case 'carota': {
        if (eta > 0.7) return
        const k = eta / 0.7
        ctx.globalAlpha = 1 - k
        ctx.drawImage(pezzo('carota', CAROTA), Math.round(cx - 4.5), Math.round(fy - 14 - k * 16))
        const stella = pezzo('stellina', STELLINA)
        ctx.drawImage(stella, Math.round(cx - 8 - k * 4), Math.round(fy - 12 - k * 10))
        ctx.drawImage(stella, Math.round(cx + 4 + k * 4), Math.round(fy - 16 - k * 8))
        ctx.globalAlpha = 1
        return
      }
      case 'buca': {
        if (eta > 0.55) return
        const k = eta / 0.55
        ctx.globalAlpha = 1 - k
        ellisseVuota(ctx, cx - 7 - k * 3, fy - 12 - k * 2, 14 + k * 6, 10 + k * 4, coloreBuca(e.coppia))
        ctx.globalAlpha = 1
        return
      }
      case 'cuori': {
        if (eta > 1.6) return
        const cuore = pezzo('cuore', CUORE)
        for (let i = 0; i < 3; i++) {
          const k = Math.min(1, Math.max(0, (eta - i * 0.18) / 1.2))
          if (k <= 0 || k >= 1) continue
          ctx.globalAlpha = 1 - k
          ctx.drawImage(cuore, Math.round(cx - 4 + (i - 1) * 6 + Math.sin(k * 6 + i) * 2), Math.round(fy - 14 - k * 22))
        }
        ctx.globalAlpha = 1
        return
      }
      case 'sbuffo': {
        if (eta > 0.45) return
        const k = eta / 0.45
        ctx.globalAlpha = 0.8 * (1 - k)
        ctx.fillStyle = '#ffffff'
        for (let i = 0; i < 5; i++) {
          const a = i * Math.PI * 2 / 5 + 0.3
          ctx.fillRect(Math.round(cx + Math.cos(a) * (4 + k * 7)), Math.round(fy - 8 + Math.sin(a) * (3 + k * 5)), 2, 2)
        }
        ctx.globalAlpha = 1
        return
      }
      default: break
    }
  }
}

/* ═══════════ il terreno, una volta sola ═══════════ */
function dipingiFondo(liv, tema) {
  const st = STAGIONI[tema]
  const W = liv.colonne * T + 2 * LATO
  const H = TESTA + liv.righe * T + ZOCCOLO + 1
  const c = document.createElement('canvas')
  c.width = W; c.height = H
  const g = c.getContext('2d')
  g.imageSmoothingEnabled = false

  const grezzo = (x, y) => liv.dentro(x, y) ? liv.terreno[liv.indice(x, y)] : null
  /* sotto una buca il terreno è quello che ha intorno: una buca in mezzo
     al lago ghiacciato sta nel ghiaccio, non su un quadrato d'erba */
  const terra = (x, y) => {
    const t = grezzo(x, y)
    if (!t) return null
    if (t === 'acqua' || t === 'ghiaccio') return t
    if (t === 'buca') {
      const intorno = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => grezzo(x + dx, y + dy)).filter(Boolean)
      const ghiaccio = intorno.filter(v => v === 'ghiaccio').length
      if (ghiaccio * 2 > intorno.length) return 'ghiaccio'
    }
    return 'prato'
  }

  /* l'ombra della plancia, sotto e ai lati */
  g.fillStyle = 'rgba(0,0,0,.16)'
  g.fillRect(2, TESTA + 2, W - 4, liv.righe * T + ZOCCOLO)

  for (let y = 0; y < liv.righe; y++) for (let x = 0; x < liv.colonne; x++) {
    const x0 = LATO + x * T, y0 = TESTA + y * T
    const t = terra(x, y)
    if (t === 'acqua') {
      g.fillStyle = COLORI.acqua
      g.fillRect(x0, y0, T, T)
      /* la riva: la terra sopra l'acqua ha il suo spessore, come la
         plancia — un'isola è un piccolo altopiano, non una piastrella
         incorniciata. Sugli altri lati basta un filo d'acqua più chiara. */
      const sopra = terra(x, y - 1)
      if (sopra && sopra !== 'acqua') {
        g.fillStyle = sopra === 'ghiaccio' ? '#8fc3e0' : '#8a6238'
        g.fillRect(x0, y0, T, 2)
        g.fillStyle = sopra === 'ghiaccio' ? '#6aa4c8' : '#5e4024'
        g.fillRect(x0, y0 + 2, T, 1)
        g.fillStyle = COLORI.acquaFonda
        g.fillRect(x0, y0 + 3, T, 1)
      }
      g.fillStyle = COLORI.acquaRiflesso
      if (terra(x, y + 1) && terra(x, y + 1) !== 'acqua') g.fillRect(x0, y0 + T - 1, T, 1)
      if (terra(x - 1, y) && terra(x - 1, y) !== 'acqua') g.fillRect(x0, y0 + (sopra && sopra !== 'acqua' ? 3 : 0), 1, T)
      if (terra(x + 1, y) && terra(x + 1, y) !== 'acqua') g.fillRect(x0 + T - 1, y0 + (sopra && sopra !== 'acqua' ? 3 : 0), 1, T)
    } else if (t === 'ghiaccio') {
      g.fillStyle = COLORI.ghiaccio
      g.fillRect(x0, y0, T, T)
      /* i riflessi: due righe oblique, dove capita */
      g.fillStyle = COLORI.ghiaccioLuce
      const a = Math.floor(hash(x, y, 1) * 6)
      for (let k = 0; k < 4; k++) g.fillRect(x0 + 2 + a + k, y0 + 11 - a / 2 - k, 1, 1)
      if (hash(x, y, 2) < 0.6) for (let k = 0; k < 2; k++) g.fillRect(x0 + 9 + k, y0 + 5 - k, 1, 1)
      g.fillStyle = COLORI.ghiaccioOmbra
      if (hash(x, y, 3) < 0.5) g.fillRect(x0 + 3 + Math.floor(hash(x, y, 6) * 8), y0 + 13, 3, 1)
      g.fillStyle = COLORI.ghiaccioBordo
      if (terra(x, y - 1) !== 'ghiaccio') g.fillRect(x0, y0, T, 1)
      if (terra(x, y + 1) !== 'ghiaccio') g.fillRect(x0, y0 + T - 1, T, 1)
      if (terra(x - 1, y) !== 'ghiaccio') g.fillRect(x0, y0, 1, T)
      if (terra(x + 1, y) !== 'ghiaccio') g.fillRect(x0 + T - 1, y0, 1, T)
    } else {
      g.fillStyle = st.erba[(x + y) % 2]
      g.fillRect(x0, y0, T, T)
      /* i ciuffi: piccole v, tre per cella, messe a caso ma sempre uguali */
      g.fillStyle = st.ciuffo
      for (let k = 0; k < 3; k++) {
        const px = x0 + 1 + Math.floor(hash(x, y, 10 + k) * 12)
        const py = y0 + 2 + Math.floor(hash(x, y, 20 + k) * 12)
        g.fillRect(px, py, 1, 1); g.fillRect(px + 1, py + 1, 1, 1); g.fillRect(px + 2, py, 1, 1)
      }
      if (st.fiori && hash(x, y, 30) < 0.3) {
        const px = x0 + 2 + Math.floor(hash(x, y, 31) * 11), py = y0 + 3 + Math.floor(hash(x, y, 32) * 10)
        g.fillStyle = st.fiori[Math.floor(hash(x, y, 33) * st.fiori.length)]
        g.fillRect(px, py, 1, 1); g.fillRect(px + 1, py, 1, 1)
        g.fillStyle = '#ffd84a'; g.fillRect(px, py + 1, 1, 1)
      }
      if (st.foglie && hash(x, y, 40) < 0.45) {
        for (let k = 0; k < 2; k++) {
          g.fillStyle = st.foglie[Math.floor(hash(x, y, 41 + k) * st.foglie.length)]
          g.fillRect(x0 + 2 + Math.floor(hash(x, y, 43 + k) * 11), y0 + 2 + Math.floor(hash(x, y, 45 + k) * 11), 2, 1)
        }
      }
      if (st.neve && hash(x, y, 50) < 0.5) {
        g.fillStyle = '#eef6fa'
        const px = x0 + 1 + Math.floor(hash(x, y, 51) * 9), py = y0 + 2 + Math.floor(hash(x, y, 52) * 10)
        g.fillRect(px, py, 4, 2); g.fillRect(px + 1, py - 1, 2, 1)
      }
    }
  }

  /* lo spessore della plancia: terra sotto il prato, acqua scura sotto
     l'acqua, ghiaccio sotto il ghiaccio */
  const y1 = TESTA + liv.righe * T
  for (let x = 0; x < liv.colonne; x++) {
    const t = terra(x, liv.righe - 1)
    const [chiaro, scuro] = t === 'acqua' ? ['#17628f', '#0f4466']
      : t === 'ghiaccio' ? ['#9fcfe8', '#6fa8c8'] : ['#9a6a3a', '#6a4424']
    g.fillStyle = chiaro
    g.fillRect(LATO + x * T, y1, T, ZOCCOLO)
    g.fillStyle = scuro
    g.fillRect(LATO + x * T, y1 + ZOCCOLO - 1, T, 1)
    if (t !== 'acqua' && t !== 'ghiaccio') {
      g.fillRect(LATO + x * T + 3 + Math.floor(hash(x, 99) * 8), y1 + 2, 2, 1)
    }
  }
  /* gli angoli si smussano: una plancia, non un foglio tagliato */
  g.clearRect(LATO, TESTA, 1, 1)
  g.clearRect(LATO + liv.colonne * T - 1, TESTA, 1, 1)
  g.clearRect(LATO, y1 + ZOCCOLO - 1, 1, 1)
  g.clearRect(LATO + liv.colonne * T - 1, y1 + ZOCCOLO - 1, 1, 1)
  return c
}

/* ═══════════ le forme che servono ═══════════
   Ellissi a gradini di pixel, come le disegnerebbe un pittore di pixel:
   `arc` le farebbe lisce, e accanto agli sprite si vedrebbero finte. */
function ellisse(ctx, x, y, w, h, colore) {
  ctx.fillStyle = colore
  const rx = w / 2, ry = h / 2
  for (let r = 0; r < h; r++) {
    const dy = (r + 0.5 - ry) / ry
    const mezza = Math.round(rx * Math.sqrt(Math.max(0, 1 - dy * dy)))
    if (mezza <= 0) continue
    ctx.fillRect(Math.round(x + rx - mezza), Math.round(y + r), mezza * 2, 1)
  }
}

function ellisseVuota(ctx, x, y, w, h, colore) {
  ctx.fillStyle = colore
  const rx = w / 2, ry = h / 2
  const passi = Math.max(12, Math.round((w + h) * 1.4))
  for (let i = 0; i < passi; i++) {
    const a = (i / passi) * Math.PI * 2
    ctx.fillRect(Math.round(x + rx + Math.cos(a) * rx), Math.round(y + ry + Math.sin(a) * ry), 1, 1)
  }
}

/* un disegno, dritto o allo specchio */
function specchiato(ctx, d, x, y, specchia) {
  if (!specchia) return ctx.drawImage(d, x, y)
  ctx.save()
  ctx.translate(x + d.width, y)
  ctx.scale(-1, 1)
  ctx.drawImage(d, 0, 0)
  ctx.restore()
}

function ombra(ctx, cx, fy, w) {
  ctx.globalAlpha = 0.22
  ellisse(ctx, Math.round(cx - w / 2), fy - 2, w, 4, '#000000')
  ctx.globalAlpha = 1
}
