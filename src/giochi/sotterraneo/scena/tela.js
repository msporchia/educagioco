// La tela: riceve un quadro ({ corsa, orologio }) e lo dipinge. Legge lo
// stato come dato (corsa.livello, corsa.luceDi, corsa.robe) senza importare
// la classe, e non sa niente di regole. grafica/atlante.js sa posare uno
// sprite; quale pezzo di muro va in una cella lo decide scena/muri.js
// (docs/sotterraneo/scenari.md: il muro alto una cella, non un bordo di
// zona). La scala sta nella trasformazione (dpr × scala), mai nei conti:
// da lì in poi tutto è in pixel di sprite — altrimenti una riga prima o
// poi la moltiplica due volte (il difetto trovato nel bestiario).
import { ATLANTE, PEZZI, TESSERA } from '../dati/atlante.js'
import { T, SCALA_MIN, SCALA_MAX, SCALA_INIZIALE, ROCCIA, PAVIMENTO, PORTA, BERSAGLIO } from '../dati/mondo.js'
import { SCENARI, SCENARIO, PEZZO_DI, pezzoAndante } from '../dati/tessere.js'
import { MOSTRI } from '../dati/mostri.js'
import { COSE, SEGNI } from '../dati/cose.js'
import { creaFoglio, netto } from '../../../grafica/atlante.js'
import { tetto, faccia, bordiDelTetto, capiDellaFaccia, versoDellaPorta, sorteDi } from './muri.js'
import { dipingiPortale, PORTALE } from './portale.js'
import { dipingiScalaSu } from './scala-su.js'

export class Tela {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.scala = SCALA_INIZIALE
    this.vista = { x: 0, y: 0 }          // l'angolo in alto a sinistra, in pixel di sprite
    this.L = 0; this.A = 0; this.dpr = 1
    // il foglio si carica da sé: disegnare prima che sia pronto non rompe niente, `posa` risponde `false`
    this.foglio = creaFoglio({ pezzi: PEZZI, immagine: ATLANTE, tessera: TESSERA })
    this.foglio.carica().catch(() => {})
    this.quadro = null
    this._raf = 0
  }

  // la tela può cambiare sotto i piedi: un v-if smonta il campo fra una discesa e l'altra, e il canvas nuovo
  // è un altro elemento. Ci si riaggancia invece di rifare il pittore, così il foglio resta caricato e lo zoom resta quello scelto
  attacca(canvas) {
    if (this.canvas === canvas) return false
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.L = 0; this.A = 0; this.dpr = 1        // così `misura()` rifà tutto
    return true
  }

  /* quanto è largo lo schermo, in pixel di sprite */
  get largoMondo() { return this.L / this.scala }
  get altoMondo() { return this.A / this.scala }

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
    return true
  }

  zoomA(voluta) {
    const n = Math.max(SCALA_MIN, Math.min(SCALA_MAX, Math.round(voluta)))
    if (n === this.scala) return false
    this.scala = n
    return true
  }

  // la telecamera sta addosso all'eroe: `coperto` è quanto schermo nasconde un foglio in basso, e l'eroe va
  // centrato in quello che RESTA (come il castello stringe il campo), o si risponde a un mostro che non si vede
  segui(mondo, ex, ey, coperto = 0) {
    const M = { x: mondo.largo * T, y: mondo.alto * T }
    const l = this.largoMondo
    const h = Math.min(coperto / this.scala, this.altoMondo * 0.7)
    const a = this.altoMondo - h                     // quello che si vede davvero
    this.vista.x = M.x <= l ? (M.x - l) / 2
      : Math.max(0, Math.min(ex * T - l / 2, M.x - l))
    const mira = ey * T - a / 2
    this.vista.y = M.y <= a ? (M.y - a) / 2
      : Math.max(0, Math.min(mira, M.y - a))
  }

  // dove cade, sullo schermo, un punto del piano in celle (il centro di una cella è x + 0.5): serve a chi posa
  // sopra la tela qualcosa che segue l'eroe (la freccina verso la missione, Gioco.vue)
  schermoDi(x, y) {
    return { x: (x * T - this.vista.x) * this.scala, y: (y * T - this.vista.y) * this.scala }
  }

  cellaDa(sx, sy) {
    return {
      x: Math.floor((sx / this.scala + this.vista.x) / T),
      y: Math.floor((sy / this.scala + this.vista.y) / T),
    }
  }

  // le animazioni vivono sull'orologio (avvia), non sugli aggiornamenti di chi guida il gioco (mostra)
  mostra(quadro) { this.quadro = quadro }

  avvia() {
    if (this._raf) return
    const passo = () => { this._raf = requestAnimationFrame(passo); this.disegna(this.quadro) }
    this._raf = requestAnimationFrame(passo)
  }

  ferma() { cancelAnimationFrame(this._raf); this._raf = 0 }

  disegna(quadro) {
    if (!quadro || !quadro.corsa || !this.misura()) return
    this.quadro = quadro
    const { corsa, orologio = 0 } = quadro
    const liv = corsa.livello
    const ctx = this.ctx
    const S = this.scala * this.dpr

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    ctx.fillStyle = '#05060a'
    ctx.fillRect(0, 0, this.L, this.A)

    // da qui in poi si ragiona in pixel di sprite
    ctx.setTransform(S, 0, 0, S, -this.vista.x * S, -this.vista.y * S)
    netto(ctx)

    const c0x = Math.max(0, Math.floor(this.vista.x / T) - 2)
    const c0y = Math.max(0, Math.floor(this.vista.y / T) - 2)
    const c1x = Math.min(liv.largo, c0x + Math.ceil(this.largoMondo / T) + 4)
    const c1y = Math.min(liv.alto, c0y + Math.ceil(this.altoMondo / T) + 4)

    // il terreno in tre passate: pavimenti, poi tetto e bordi, poi facce (che sale sulla cella sopra e
    // deve coprire quel che trova); il velo del ricordo va per ultimo, o sulla striscia sbordata se ne posano due
    const sc = SCENARI[corsa.scenario] || SCENARI[SCENARIO]
    const forma = this.forma(liv, sc)
    const pietra = (x, y) => liv.a(x, y) === ROCCIA
    const alfaDi = luce => (luce === 2 ? 1 : 0.5)
    for (let y = c0y; y < c1y; y++) for (let x = c0x; x < c1x; x++) {
      const luce = corsa.luceDi(x, y)
      if (luce && !pietra(x, y)) this.pavimento(sc, forma, x, y, alfaDi(luce))
    }
    for (let y = c0y; y < c1y; y++) for (let x = c0x; x < c1x; x++) {
      const luce = corsa.luceDi(x, y)
      if (luce && tetto(pietra, x, y)) this.tetto(sc, pietra, x, y, alfaDi(luce))
    }
    const torce = []
    for (let y = c0y; y < c1y; y++) for (let x = c0x; x < c1x; x++) {
      const luce = corsa.luceDi(x, y)
      if (!luce || !faccia(pietra, x, y)) continue
      if (this.faccia(sc, liv, pietra, x, y, alfaDi(luce)) && luce === 2) torce.push([x, y])
    }
    for (const [x, y] of torce) this.fiamma(x, y, orologio)
    for (let y = c0y; y < c1y; y++) for (let x = c0x; x < c1x; x++)
      if (corsa.luceDi(x, y) === 1) this.velo(x, y)

    this.etichette = []
    for (const r of liv.robe) {
      if (r.presa || (r.morto && r.che !== 'fonte')) continue   // la fonte bevuta resta, il resto se ne va
      const luce = corsa.luceDi(r.x, r.y)
      if (!luce) continue
      // `toccabile` è un fatto già deciso dal motore, come `potenziabile` nel castello: qui si guarda, non si ricalcola
      this.roba(r, luce, orologio, !!(corsa.toccabile && corsa.toccabile(r)), sc, corsa)
    }
    this.eroe(corsa, orologio)
    // il nome del bersaglio di una missione sta sopra a tutto, eroe compreso: se no ci passa sotto
    for (const e of this.etichette) this.etichetta(e.testo, e.px, e.py)
    if (corsa.bersaglio) this.bersaglio(corsa.bersaglio, orologio)

    // l'interfaccia torna in pixel schermo: la mappina non si ingrandisce con lo zoom
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    this.minimappa(corsa)
    this.dovEroe(corsa)
  }

  // un canvas non ha figli da cercare: si scrive la cella e il punto in pixel come attributo del DOM,
  // solo quando cambia (non un disegno) — serve alla prova col dito, che non può fidarsi del centro schermo
  dovEroe(corsa) {
    const e = corsa.eroe
    if (!e) return
    const cella = `${Math.floor(e.x)},${Math.floor(e.y)}`
    const schermo = `${Math.round((e.x * T - this.vista.x) * this.scala)},` +
                    `${Math.round((e.y * T - this.vista.y) * this.scala)}`
    const d = this.canvas.dataset
    if (d.eroe !== cella) d.eroe = cella
    if (d.eroeSchermo !== schermo) d.eroeSchermo = schermo
    if (d.scala !== String(this.scala)) d.scala = this.scala   // quanti pixel di schermo per pixel di sprite
  }

  // il fondo sul fondo della sua cella, sbordando in alto: così un mostro sta dietro al muro invece di galleggiarci sopra
  posa(nome, cx, cy, opz = {}) {
    return this.foglio.posa(this.ctx, nome, (cx + 0.5) * T, (cy + 1) * T, opz)
  }

  // il ricordo si spegne E si raffredda (velo blu): spegnere e basta non basta, due tessere scure sono la stessa cosa
  velo(cx, cy) {
    const ctx = this.ctx
    ctx.fillStyle = 'rgba(8,12,30,.5)'
    ctx.fillRect(cx * T, cy * T, T + 0.5, T + 0.5)
  }

  // calcolata una volta per piano (stanza/corridoio, medaglione, roba per terra), o si rifà sessanta volte al secondo
  forma(liv, sc) {
    if (this._forma && this._forma.liv === liv && this._forma.sc === sc) return this._forma
    const L = liv.largo, A = liv.alto
    const stanza = new Int16Array(L * A).fill(-1)
    const medaglione = new Map(), perTerra = new Map()
    const stanze = liv.stanze || []
    const pietra = (x, y) => liv.a(x, y) === ROCCIA
    for (const s of stanze)
      for (let x = s.x; x < s.x + s.w; x++)
        for (let y = s.y; y < s.y + s.h; y++) stanza[y * L + x] = s.id
    for (const s of stanze) {
      // il medaglione sta sotto la fontana: la stanza della fonte si riconosce da lontano
      if (s.ruolo === 'fonte')
        for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
          const x = s.cx + i, y = s.cy + j
          if (stanza[y * L + x] === s.id) medaglione.set(y * L + x, [i + 1, j + 1])
        }
      // ragnatele negli angoli in alto: una stanza su due, sempre la stessa
      if (sorteDi(s.x, s.y, 3) % 2) continue
      if (pietra(s.x, s.y - 1) && pietra(s.x - 1, s.y))
        perTerra.set(s.y * L + s.x, { nome: sc.ragnatele.sx, dove: 'no' })
      const xd = s.x + s.w - 1
      if (pietra(xd, s.y - 1) && pietra(xd + 1, s.y))
        perTerra.set(s.y * L + xd, { nome: sc.ragnatele.dx, dove: 'ne' })
    }
    // qua e là per terra: poche (una cella su venticinque; una su dieci copriva le stanze), mai sul medaglione, sempre le stesse
    for (let y = 0; y < A; y++) for (let x = 0; x < L; x++) {
      const k = y * L + x
      if (liv.a(x, y) !== PAVIMENTO || perTerra.has(k) || medaglione.has(k)) continue
      const h = sorteDi(x, y, 1)
      const i = h % 151 === 0 ? 2 : h % 79 === 0 ? 1 : h % 47 === 0 ? 0 : -1
      const nome = i < 0 ? null : sc.perTerra[i % sc.perTerra.length]
      if (nome) perTerra.set(k, { nome, dove: 'centro', specchia: ((h >>> 9) & 1) === 1 })
    }
    this._forma = { liv, sc, stanza, medaglione, perTerra }
    return this._forma
  }

  // stanza e corridoio: due quadrati di 4×4 celle da cui ogni cella prende la sua parte, niente piastrelle col bordo
  pavimento(sc, forma, x, y, alfa) {
    const ctx = this.ctx, f = this.foglio
    const k = y * forma.liv.largo + x
    const nome = forma.stanza[k] >= 0 ? sc.pavimento.stanza : sc.pavimento.corridoio
    const q = f.misura(nome) || { w: 4 * T, h: 4 * T }
    f.ritaglio(ctx, nome, (x % Math.round(q.w / T)) * T, (y % Math.round(q.h / T)) * T, T, T, x * T, y * T, { alfa })
    const m = forma.medaglione.get(k)
    if (m) f.ritaglio(ctx, sc.medaglione, m[0] * T, m[1] * T, T, T, x * T, y * T, { alfa })
    const d = forma.perTerra.get(k)
    if (!d) return
    const w = f.misura(d.nome)
    if (!w) return
    const px = d.dove === 'no' ? 0 : d.dove === 'ne' ? T - w.w : (T - w.w) / 2
    const py = d.dove === 'centro' ? (T - w.h) / 2 : 0
    f.pezzo(ctx, d.nome, x * T + px, y * T + py, { alfa, specchia: d.specchia })
  }

  // la roccia vista da sopra: la trama solo vicino a dove si cammina, o farebbe carta da parati sui muri spessi
  tetto(sc, pietra, x, y, alfa) {
    const ctx = this.ctx, f = this.foglio
    const prima = ctx.globalAlpha
    ctx.globalAlpha = prima * alfa
    ctx.fillStyle = sc.colori.roccia
    ctx.fillRect(x * T, y * T, T, T)
    ctx.globalAlpha = prima
    let vicino = 3
    for (let dx = -2; dx <= 2; dx++)
      for (let dy = -2; dy <= 2; dy++)
        if (!pietra(x + dx, y + dy)) vicino = Math.min(vicino, Math.max(Math.abs(dx), Math.abs(dy)))
    if (vicino <= 2)
      f.ritaglio(ctx, sc.tetto, (x & 3) * T, (y & 3) * T, T, T, x * T, y * T,
                 { alfa: alfa * (vicino === 1 ? 1 : 0.35) })
    const b = bordiDelTetto(pietra, x, y)
    if (b.n) f.pezzo(ctx, sc.bordi.n, x * T, y * T, { alfa })
    if (b.o) f.pezzo(ctx, sc.bordi.o, x * T, y * T, { alfa })
    if (b.e) f.pezzo(ctx, sc.bordi.e, x * T + T - f.misura(sc.bordi.e).w, y * T, { alfa })
    // un bordo con la fascia scura verso l'interno la stende sulla riga chiara dell'altro: le righe si ripassano
    const L = sc.bordi.luce
    if (L) {
      if (b.n) f.ritaglio(ctx, sc.bordi.n, 0, 0, T, L, x * T, y * T, { alfa })
      if (b.o) f.ritaglio(ctx, sc.bordi.o, 0, 0, L, T, x * T, y * T, { alfa })
      if (b.e) f.ritaglio(ctx, sc.bordi.e, f.misura(sc.bordi.e).w - L, 0, L, T, x * T + T - L, y * T, { alfa })
    }
    const a = f.misura(sc.bordi.angolo)
    // gli angoli in fondo raccordano un coronamento che sale sulla cella di sopra: con la faccia alta una cella sporgerebbero
    const sale = (f.misura(sc.faccia) || { h: T }).h > T
    for (const q of b.angoli) {
      if (q[0] === 's' && !sale) continue
      f.pezzo(ctx, sc.bordi.angolo, x * T + (q[1] === 'o' ? 0 : T - a.w),
              y * T + (q[0] === 'n' ? 0 : T - a.h), { alfa })
    }
  }

  // striscia di sei celle, con varianti (torcia, grata, arco); torna true se torcia, la sua luce si disegna dopo
  faccia(sc, liv, pietra, x, y, alfa) {
    const ctx = this.ctx, f = this.foglio
    const h = sorteDi(x, y, 2)
    const torcia = h % 9 === 0
    let nome = sc.faccia, fila = true
    if (torcia) { nome = sc.torcia; fila = false }
    else if (h % 5 === 1) { nome = sc.varianti[(h >>> 8) % sc.varianti.length]; fila = false }
    const m = f.misura(nome)
    if (!m) return false
    const rx = fila ? (x % Math.round(m.w / T)) * T : 0
    const y0 = y * T + T - m.h
    f.ritaglio(ctx, nome, rx, 0, T, m.h, x * T, y0, { alfa })
    const c = capiDellaFaccia(pietra, (a, b) => liv.a(a, b) === PORTA, x, y)
    if (c.sx) f.pezzo(ctx, sc.capi.sx, x * T, y0, { alfa })
    if (c.dx) f.pezzo(ctx, sc.capi.dx, x * T + T - f.misura(sc.capi.dx).w, y0, { alfa })
    return torcia
  }

  fiamma(x, y, t) {
    const ctx = this.ctx
    const px = x * T + T / 2, py = y * T + 3
    const q = 0.2 + 0.06 * Math.sin(t * 7 + x * 1.3 + y)
    const g = ctx.createRadialGradient(px, py, 1, px, py, T * 1.8)
    g.addColorStop(0, `rgba(255,176,80,${q})`)
    g.addColorStop(1, 'rgba(255,176,80,0)')
    ctx.fillStyle = g
    ctx.beginPath(); ctx.arc(px, py, T * 1.8, 0, 7); ctx.fill()
  }

  // ognuna ha il suo pezzo; quelle animate scorrono i fotogrammi sull'orologio. Un pezzo mancante disegna
  // l'emoji (un buco si nota, ma non deve far sparire un forziere)
  roba(r, luce, t, tocca = false, sc = SCENARI[SCENARIO], corsa = null) {
    const ctx = this.ctx
    const px = r.fx != null ? r.fx : r.x + 0.5
    const py = r.fy != null ? r.fy : r.y + 0.5
    // l'arredo sta un passo indietro (0.66 di alfa): non si spegne del tutto, o una stanza arredata sembra vuota
    const alfaLuce = luce === 2 ? 1 : 0.45
    const alfa = alfaLuce * (r.che === 'arredo' ? 0.66 : 1)

    // il portale non ha pezzo nel foglio: si disegna da sé, coi piedi sul fondo della sua cella
    if (r.che === 'portale') {
      dipingiPortale(ctx, Math.round(px * T), Math.round((r.y + 1) * T - PORTALE.ry - 2), t, { alfa })
      return
    }

    // la scala che sale non ha pezzo nel foglio: si disegna da sé, in tutta la cella
    if (r.che === 'scala-su') {
      dipingiScalaSu(ctx, r.x * T, r.y * T, t, { alfa })
      return
    }

    if (r.che === 'mostro') {
      const scheda = MOSTRI[r.tipo]
      // `unaPosa`: i mostri del bestiario nuovo non hanno una corsa separata, e chiederla darebbe un mostro invisibile senza errore
      const posa = r.sveglio && !scheda.unaPosa ? 'corsa' : 'fermo'
      const fr = (t * (r.sveglio ? 8 : 4)) | 0
      const q = r.sveglio ? 0.3 + 0.14 * Math.sin(t * 7) : 0.14   // l'alone pulsa da sveglio: si vede prima di arrivargli addosso
      ctx.fillStyle = `rgba(224,100,79,${q * alfa})`
      ctx.beginPath()
      ctx.arc(px * T, py * T + T * 0.2, T * 0.5, 0, 7)
      ctx.fill()

      const suo = pezzoAndante(scheda.sprite, posa, fr)
      // il bersaglio di una missione è più grande dei suoi simili e ha un'aura sua (dati/mondo.js, BERSAGLIO)
      const grande = r.missione ? BERSAGLIO.scala : 1
      if (r.missione) this.auraDelBersaglio(px, py, t, alfa)
      if (grande !== 1) this.ingrandisci(px, py + 0.5, grande)
      if (r.missione) this.contornoDelBersaglio(suo, px - 0.5, py - 0.5, t, alfa, { specchia: r.guarda === 'sx' })
      // un mostro ha già il suo alone rosso: il filo qui serve solo a dire "ci si arriva col dito da qui"
      else if (tocca) this.filo(suo, px - 0.5, py - 0.5, t, { specchia: r.guarda === 'sx' })
      if (!this.posa(suo, px - 0.5, py - 0.5, { alfa, specchia: r.guarda === 'sx' }))
        this.emoji(r.em, px, py, alfa)
      if (grande !== 1) ctx.restore()
      if (r.chiave) this.emoji('🗝️', px + 0.42, py - 0.55, alfa, 0.42)
      // il mostro col nome di una missione porta la corona e il nome sopra la testa, quando è in vista
      if (r.missione) {
        this.emoji('👑', px - 0.05, py - 1.3 + Math.sin(t * 3) * 0.05, alfa, 0.5)
        if (luce === 2) this.etichette.push({ testo: r.nome, px, py: py - 1.75 })
      }
      if (!r.sveglio) this.emoji('💤', px + (r.missione ? 0.55 : 0.4), py - (r.missione ? 0.7 : 0.4), alfa * 0.8, 0.32)
      if (r.ossa < r.ossaMax) this.barretta(px, py, r.ossa / r.ossaMax, alfa)
      return
    }

    // un braciere acceso fa luce, e la luce trema: la differenza fra una stanza arredata e una con dentro delle icone
    if (r.arde) {
      const q = 0.22 + 0.07 * Math.sin(t * 6 + r.x * 1.7 + r.y)
      const alone = ctx.createRadialGradient(px * T, py * T, T * 0.2, px * T, py * T, T * 2.2)
      alone.addColorStop(0, `rgba(255,176,80,${q * alfaLuce})`)   // piena anche se la figura è smorzata: la luce non è arredo
      alone.addColorStop(1, 'rgba(255,176,80,0)')
      ctx.fillStyle = alone
      ctx.beginPath(); ctx.arc(px * T, py * T, T * 2.2, 0, 7); ctx.fill()
    }

    let su = 0
    if (r.che === 'cosa') {
      su = Math.sin(t * 2.6 + (r.x + r.y)) * 0.08
      const q = 0.16 + 0.06 * Math.sin(t * 2.6 + (r.x + r.y))
      ctx.fillStyle = `rgba(255,210,120,${q * alfa})`
      ctx.beginPath()
      ctx.ellipse(px * T, py * T + T * 0.34, T * 0.34, T * 0.13, 0, 0, 7)
      ctx.fill()
    }

    // quello che il pezzo non sa da sé e la tela sì: da che parte si vede una porta, se la scala è ancora chiusa
    const liv = corsa && corsa.livello
    const info = r.che === 'porta' && liv
      ? { verso: versoDellaPorta((a, b) => liv.a(a, b) !== PAVIMENTO, r.x, r.y) }
      : r.che === 'scala' && corsa ? { chiusa: !corsa.chiaveDelPiano } : {}
    const quale = PEZZO_DI[r.che]
    const nome = r.che === 'cosa' ? (COSE[r.cosa] || {}).sprite : quale ? quale(r, t, sc, info) : null
    // il forziere di una missione, finché è chiuso, è più grande degli altri e ha la sua aura (come il mostro col nome)
    const bersaglio = r.che === 'forziere' && r.missione && !r.aperto
    if (bersaglio) {
      this.auraDelBersaglio(px, py, t, alfa)
      this.ingrandisci(px, py + 0.5, BERSAGLIO.scala)
    }
    // il filo di luce dice "questo si tocca", la convenzione di tutti i giochi del genere; solo in piena luce
    if (bersaglio && nome) this.contornoDelBersaglio(nome, px - 0.5, py - 0.5 + su, t, alfa)
    else if (tocca && nome) this.filo(nome, px - 0.5, py - 0.5 + su, t)
    // un'emoji non ha sagoma da contornare: un'aureola dietro fa lo stesso lavoro (ripiego per un pezzo mancante)
    if (tocca && !nome) this.aureola(px, py + su, t)
    if (!nome || !this.posa(nome, px - 0.5, py - 0.5 + su, { alfa }))
      this.emoji(r.em, px, py + su, alfa)
    if (bersaglio) this.ctx.restore()

    // la cosa da trovare per una missione galleggia sopra il suo forziere d'oro, finché non si apre, col nome sopra
    if (bersaglio) {
      this.emoji(r.em, px, py - 1.5 + Math.sin(t * 2.4) * 0.08, alfa, 0.95)
      if (luce === 2) this.etichette.push({ testo: r.nome, px, py: py - 2.1 })
    }

    // il segno sopra una porta chiusa: l'unica cosa con cui si sceglie dove andare, si vede anche in un piano già girato
    if (r.che === 'porta' && !r.aperta && SEGNI[r.segno])
      this.emoji(SEGNI[r.segno].em, px, py - 1.25, alfa, 0.5)
  }

  // respira piano: abbastanza da notarsi girando lo sguardo, non tanto da sembrare un allarme. Oro = "questo riguarda te"
  filo(nome, cx, cy, t, opz = {}) {
    const q = 0.62 + 0.28 * Math.sin(t * 2.4)   // sotto l'unità non si sale, o un contorno che arriva a 1 sembra un allarme
    this.foglio.alone(this.ctx, nome, (cx + 0.5) * T, (cy + 1) * T,
                      { ...opz, colore: '#ffd27a', alfa: q, raggio: 1 })
  }

  aureola(px, py, t) {
    const ctx = this.ctx
    const q = 0.16 + 0.07 * Math.sin(t * 2.4)
    const a = ctx.createRadialGradient(px * T, py * T, T * 0.15, px * T, py * T, T * 0.75)
    a.addColorStop(0, `rgba(255,210,122,${q})`)
    a.addColorStop(1, 'rgba(255,210,122,0)')
    ctx.fillStyle = a
    ctx.beginPath(); ctx.arc(px * T, py * T, T * 0.75, 0, 7); ctx.fill()
  }

  // la scala di un bersaglio: tutto quello che si disegna fino al `restore()` cresce attorno ai piedi (px, py: il centro della
  // cella, py + 0.5 il suolo), come `posa` che appoggia il pezzo sul fondo della cella
  ingrandisci(px, suolo, k) {
    const ctx = this.ctx
    ctx.save()
    ctx.translate(px * T, suolo * T)
    ctx.scale(k, k)
    ctx.translate(-px * T, -suolo * T)
  }

  // l'aura del bersaglio di una missione: un chiarore del suo colore che respira piano, dietro la figura
  auraDelBersaglio(px, py, t, alfa) {
    const ctx = this.ctx
    const q = 0.5 + 0.5 * Math.sin(t * 2.2)
    const R = T * (1.05 + 0.12 * q)
    const g = ctx.createRadialGradient(px * T, py * T + T * 0.1, T * 0.2, px * T, py * T + T * 0.1, R)
    g.addColorStop(0, `rgba(${BERSAGLIO.luce},${(0.3 + 0.25 * q) * alfa})`)
    g.addColorStop(1, `rgba(${BERSAGLIO.luce},0)`)
    ctx.fillStyle = g
    ctx.beginPath(); ctx.arc(px * T, py * T + T * 0.1, R, 0, 7); ctx.fill()
  }

  // il contorno del suo colore, che pulsa come l'aura: dice «è questo» anche a chi non ha letto il promemoria
  contornoDelBersaglio(nome, cx, cy, t, alfa, opz = {}) {
    const q = 0.5 + 0.5 * Math.sin(t * 2.2)
    this.foglio.alone(this.ctx, nome, (cx + 0.5) * T, (cy + 1) * T,
                      { ...opz, colore: BERSAGLIO.colore, alfa: (0.55 + 0.4 * q) * alfa, raggio: 1 })
  }

  // il nome del bersaglio, in una targhetta scura col filo del suo colore; `px`,`py` in celle, al centro della targhetta
  etichetta(testo, px, py) {
    if (!testo) return
    const ctx = this.ctx
    ctx.save()
    ctx.font = `bold ${T * 0.32}px "Emoji Gioco", system-ui, "Segoe UI", sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const w = Math.ceil(ctx.measureText(testo).width) + 5, h = T * 0.5
    const x = Math.round(px * T - w / 2), y = Math.round(py * T - h / 2)
    ctx.fillStyle = 'rgba(12,8,22,.82)'
    ctx.fillRect(x, y, w, h)
    ctx.strokeStyle = BERSAGLIO.colore
    ctx.lineWidth = 0.6
    ctx.strokeRect(x + 0.3, y + 0.3, w - 0.6, h - 0.6)
    ctx.fillStyle = '#ffe3f7'
    ctx.fillText(testo, px * T, y + h / 2 + 0.3)
    ctx.restore()
  }

  // le emoji le disegna il telefono: si usano solo per i segni sopra le porte e il ripiego di un pezzo mancante, mai per un mostro
  emoji(em, px, py, alfa, quanto = 0.8) {
    const ctx = this.ctx
    ctx.save()
    ctx.globalAlpha = alfa
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `${Math.round(T * quanto)}px "Emoji Gioco","Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`
    ctx.fillText(em, px * T, py * T)
    ctx.restore()
  }

  barretta(px, py, q, alfa) {
    const ctx = this.ctx
    const w = T * 0.7, x = px * T - w / 2, y = py * T + T * 0.42
    ctx.save()
    ctx.globalAlpha = alfa
    ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(x, y, w, 1.5)
    ctx.fillStyle = '#e0644f'; ctx.fillRect(x, y, w * q, 1.5)
    ctx.restore()
  }

  eroe(corsa, t) {
    const ctx = this.ctx
    const cammina = !!(corsa.strada && corsa.strada.length)
    const fr = (t * (cammina ? 9 : 4)) | 0
    const sx = corsa.eroe.x * T, sy = corsa.eroe.y * T

    // la torcia in mano: piccola e calda, non un faro. Dice "la luce sei tu"
    const alone = ctx.createRadialGradient(sx, sy, T * 0.3, sx, sy, T * 2.4)
    alone.addColorStop(0, 'rgba(255,214,140,.20)')
    alone.addColorStop(1, 'rgba(255,214,140,0)')
    ctx.fillStyle = alone
    ctx.beginPath(); ctx.arc(sx, sy, T * 2.4, 0, 7); ctx.fill()
    ctx.fillStyle = 'rgba(0,0,0,.4)'
    ctx.beginPath(); ctx.ellipse(sx, sy + T * 0.38, T * 0.28, T * 0.1, 0, 0, 7); ctx.fill()

    const chi = (corsa.io && corsa.io.sprite) || 'cavaliere'   // la famiglia di pezzi: cavaliere, elfa, mago, nano
    const specchia = corsa.guarda === 'sx'
    if (!this.posa(pezzoAndante(chi, cammina ? 'corsa' : 'fermo', fr),
                   corsa.eroe.x - 0.5, corsa.eroe.y - 0.5, { specchia }))
      this.emoji(corsa.io ? corsa.io.em : '🧝', corsa.eroe.x, corsa.eroe.y, 1)

    this.arma(corsa, sx, sy, specchia, t, cammina)

    // sopra la testa, non solo in cima: mentre si combatte gli occhi stanno sul campo. Solo quando manca qualcosa
    if (corsa.vita < corsa.vitaMax)
      this.barretta(corsa.eroe.x, corsa.eroe.y - 1.15, corsa.vita / corsa.vitaMax, 1)
  }

  // 0x72 disegna le armi staccate: un foglio di dodici va bene per quattro personaggi senza disegnarne quarantotto
  arma(corsa, sx, sy, specchia, t, cammina) {
    const su = Math.sin(t * (cammina ? 9 : 3)) * (cammina ? 0.9 : 0.5)
    const lato = specchia ? -1 : 1
    const posa = (k, verso, opz) => {
      const nome = (COSE[k] || {}).sprite
      if (!nome) return
      this.foglio.posa(this.ctx, nome, sx + verso * T * 0.42, sy + T * 0.42 + su, opz)
    }
    // due armi si portano una per lato (la debole va dietro, prima, o coprirebbe la buona); una a due mani
    // sta in mezzo, davanti al corpo (una copia sbiadita dall'altro lato farebbe sembrare due armi, non una tenuta in due)
    const due = corsa.mano && (COSE[corsa.mano] || {}).mani === 2
    if (due) return posa(corsa.mano, 0, { specchia, dy: -T * 0.06 })
    if (corsa.mancina) posa(corsa.mancina, -lato, { specchia: !specchia })
    if (corsa.mano) posa(corsa.mano, lato, { specchia })
  }

  bersaglio(b, t) {
    const ctx = this.ctx
    const q = (t % 0.9) / 0.9
    ctx.save()
    ctx.strokeStyle = `rgba(255,210,120,${0.8 - q * 0.7})`
    ctx.lineWidth = 2 / this.scala
    ctx.beginPath()
    ctx.arc(b.x * T + T / 2, b.y * T + T / 2, T * (0.25 + q * 0.35), 0, 7)
    ctx.stroke()
    ctx.restore()
  }

  // mostra solo quello che si è visto, e i tre punti che servono: dove sei, dov'è la scala, chi ha la chiave
  minimappa(corsa) {
    const liv = corsa.livello
    const ctx = this.ctx
    const p = Math.max(1.4, Math.min(2.6, 120 / Math.max(liv.largo, liv.alto)))
    const larg = liv.largo * p, alt = liv.alto * p
    const x0 = this.L - larg - 10, y0 = 12
    ctx.save()
    ctx.fillStyle = 'rgba(6,8,14,.78)'
    ctx.fillRect(x0 - 4, y0 - 4, larg + 8, alt + 8)
    ctx.strokeStyle = 'rgba(255,255,255,.14)'
    ctx.lineWidth = 1
    ctx.strokeRect(x0 - 4.5, y0 - 4.5, larg + 9, alt + 9)
    ctx.fillStyle = 'rgba(180,170,150,.5)'
    for (let x = 0; x < liv.largo; x++) for (let y = 0; y < liv.alto; y++) {
      if (!corsa.visto[y * liv.largo + x] || liv.a(x, y) === ROCCIA) continue
      ctx.fillRect(x0 + x * p, y0 + y * p, p, p)
    }
    for (const r of liv.robe) {
      if (r.presa || r.morto || !corsa.visto[r.y * liv.largo + r.x]) continue
      // un baule già aperto sparisce; la roba per terra si segna, perché ora va toccata e una spada dimenticata è persa
      const colore = r.missione && !r.aperto ? '#ff7ad9'
        : r.che === 'mostro' && r.chiave ? '#ffd23f'
        : r.che === 'porta' && !r.aperta ? '#c9a227'
        : r.che === 'scala' ? '#6fc6ff'
        : r.che === 'portale' ? '#b48cff'
        : r.che === 'cosa' ? '#7ee08a'
        : r.che === 'forziere' && !r.aperto ? '#ff9b3d' : null
      if (!colore) continue
      ctx.fillStyle = colore
      ctx.fillRect(x0 + r.x * p - 1, y0 + r.y * p - 1, p + 2, p + 2)
    }
    ctx.fillStyle = '#fff'
    ctx.fillRect(x0 + Math.floor(corsa.eroe.x) * p - 1, y0 + Math.floor(corsa.eroe.y) * p - 1,
                 p + 2, p + 2)
    ctx.restore()
  }
}
