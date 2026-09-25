/* ═══════════════════════════════════════════════════════════════════
   LA TELA DEL SOTTERRANEO — il disegno, e nient'altro

   Riceve un quadro — `{ corsa, orologio, alza }` — e lo dipinge. Legge
   lo stato della discesa **come dato** (`corsa.livello`, `corsa.luceDi`,
   `corsa.robe`) senza importare la classe: chi la usa passa un'istanza
   vera o un finto oggetto della stessa forma, e per questa classe non fa
   differenza. Di regole non sa niente: non sa quanto costa un mostro né
   perché una porta è chiusa.

   ── CHI SA COSA ─────────────────────────────────────────────────
   `grafica/atlante.js` (`creaFoglio`, `netto`) sa posare uno sprite: il
   piede, lo specchio, i bordi netti, e un pezzo di un pezzo (`ritaglio`)
   per i fondi che si disegnano a fette. **Quale** pezzo va in una cella
   di muro lo decide `scena/muri.js` guardando i vicini. Il muro prima lo
   sceglieva `bordoOtto` di `grafica/tessere.js`, che però risponde a
   un'altra domanda — che forma ha il bordo di una zona vista da sopra —
   e a tre quarti la faccia di un muro non è un bordo: è una cella intera
   che si vede solo da una parte. Se un altro mondo a tre quarti vorrà la
   stessa regola, `muri.js` sale in `grafica/` quel giorno.

   ── LA SCALA STA NELLA TRASFORMAZIONE, NON NEI CONTI ──────────────
   Il contesto si scala una volta per fotogramma (`dpr × scala`), e da lì
   in poi **tutto è in pixel dello sprite**: una cella è `T`, un mostro è
   alto quello che è alto. Senza, ogni riga di disegno finisce per
   moltiplicare per la scala, e prima o poi una se ne dimentica o la
   moltiplica due volte — che è il difetto trovato nel bestiario, dove
   una nebbia diventava grande quanto la bestia solo a figura grande.
   Lo zoom resta **a numeri interi** (`dati/mondo.js`): a scala 2,3 i
   pixel verrebbero larghi due e altri tre, e da vicino si vede.

   ── IL MURO È ALTO UNA CELLA, E NON È UN DETTAGLIO ────────────────
   La roccia si vede da sopra, col suo bordo; la faccia di mattoni c'è
   solo dove sotto si cammina, ed è alta una cella (più il filo del
   coronamento, che sale sulla cella di sopra). Così **qualunque muro sta
   in una cella di spessore**, compreso quello fra due corridoi, che col
   set di prima non ci stava e riempiva di mattoni tutta la roccia. La
   regola sta in `scena/muri.js`, che gira in Node e si prova lì; qui si
   mettono soltanto i pezzi.

   ── LO SCENARIO ─────────────────────────────────────────────────
   Pavimenti, tetto, facce, porte, scala, fontana e mercante vengono
   dallo scenario (`SCENARI` in `dati/tessere.js`): tutte le voci hanno
   le stesse chiavi, e questa tela non sa quale sta disegnando.
   ═══════════════════════════════════════════════════════════════════ */
import { ATLANTE, PEZZI, TESSERA } from '../dati/atlante.js'
import { T, SCALA_MIN, SCALA_MAX, SCALA_INIZIALE, ROCCIA, PAVIMENTO, PORTA } from '../dati/mondo.js'
import { SCENARI, SCENARIO, PEZZO_DI, pezzoAndante } from '../dati/tessere.js'
import { MOSTRI } from '../dati/mostri.js'
import { COSE, SEGNI } from '../dati/cose.js'
import { creaFoglio, netto } from '../../../grafica/atlante.js'
import { tetto, faccia, bordiDelTetto, capiDellaFaccia, versoDellaPorta, sorteDi } from './muri.js'

export class Tela {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.scala = SCALA_INIZIALE
    this.vista = { x: 0, y: 0 }          // l'angolo in alto a sinistra, in pixel di sprite
    this.L = 0; this.A = 0; this.dpr = 1
    /* Il foglio si carica da sé: disegnare prima che sia pronto non
       rompe niente — `posa` risponde `false` e basta — e il primo
       fotogramma buono arriva al giro dopo, perché il disegno è
       continuo. */
    this.foglio = creaFoglio({ pezzi: PEZZI, immagine: ATLANTE, tessera: TESSERA })
    this.foglio.carica().catch(() => {})
    this.quadro = null
    this._raf = 0
  }

  /* ── la tela può cambiare sotto i piedi ──
     Fra una discesa e l'altra si torna alla mappa delle tappe, e il
     `v-if` del coordinatore smonta il campo: il canvas che si ritrova la
     discesa dopo è **un altro elemento**. Un pittore che si tiene il
     primo continua a dipingere benissimo — su una tela staccata dal DOM,
     cioè su niente: a schermo resta nero, e non c'è nessun errore da
     nessuna parte, perché non è successo niente di sbagliato. Si è visto
     giocando la seconda discesa, non leggendo.

     Si riaggancia invece di rifare il pittore da capo perché così il
     foglio degli sprite resta caricato (niente primo fotogramma senza
     figure) e lo zoom scelto col pizzico resta quello che si era
     scelto. */
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

  /* ── la telecamera sta addosso all'eroe ──
     `coperto` è quanti pixel di schermo, in basso, sono nascosti da un
     foglio: l'eroe non va centrato nello schermo ma **in quello che dello
     schermo resta**, o si risponde a domande su un mostro che non si
     vede. (Il castello risolve la stessa cosa stringendo il campo.)

     La riga che conta è il limite in basso: `M.y - a + h` invece di
     `M.y - a`. Senza, vicino al bordo sud del piano la telecamera si
     ferma sul bordo del mondo e l'eroe resta sotto il pannello comunque —
     e succede **proprio dove il gioco ti ci manda**, perché la scala e il
     suo guardiano stanno nella stanza più lontana. Si scopre del nero
     sotto il mondo, ma quel nero sta dietro al foglio e non lo vede
     nessuno. */
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

  /* la cella del mondo sotto un punto dello schermo */
  cellaDa(sx, sy) {
    return {
      x: Math.floor((sx / this.scala + this.vista.x) / T),
      y: Math.floor((sy / this.scala + this.vista.y) / T),
    }
  }

  /* ── il giro ──
     `mostra()` deposita l'ultimo quadro, `avvia()` ridipinge a ogni
     fotogramma dello schermo: le animazioni (i mostri che corrono, la
     moneta che gira) vivono sull'orologio, non sugli aggiornamenti di
     chi guida il gioco. */
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

    /* da qui in poi si ragiona in pixel di sprite */
    ctx.setTransform(S, 0, 0, S, -this.vista.x * S, -this.vista.y * S)
    netto(ctx)

    const c0x = Math.max(0, Math.floor(this.vista.x / T) - 2)
    const c0y = Math.max(0, Math.floor(this.vista.y / T) - 2)
    const c1x = Math.min(liv.largo, c0x + Math.ceil(this.largoMondo / T) + 4)
    const c1y = Math.min(liv.alto, c0y + Math.ceil(this.altoMondo / T) + 4)

    /* ── il terreno, in tre passate ──
       Prima i pavimenti, poi il tetto coi suoi bordi, poi le facce: una
       faccia sale di un filo sulla cella di sopra (è il coronamento), e
       deve coprire il tetto o il pavimento che ci trova. Il velo del
       ricordo va per ultimo e in una passata sola, così sulla striscia
       dove una faccia sborda non se ne posano due. */
    const sc = SCENARI[SCENARIO]
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

    for (const r of liv.robe) {
      /* la fonte bevuta resta dov'era, asciutta; tutto il resto che è
         stato preso o battuto se ne va */
      if (r.presa || (r.morto && r.che !== 'fonte')) continue
      const luce = corsa.luceDi(r.x, r.y)
      if (!luce) continue
      /* `toccabile` è un fatto già deciso dal motore, come `potenziabile`
         nel castello: qui non si ricalcola niente, si guarda. */
      this.roba(r, luce, orologio, !!(corsa.toccabile && corsa.toccabile(r)), sc, corsa)
    }
    this.eroe(corsa, orologio)
    if (corsa.bersaglio) this.bersaglio(corsa.bersaglio, orologio)

    /* l'interfaccia torna in pixel schermo: la mappina non si ingrandisce
       con lo zoom, o a ×5 coprirebbe mezzo telefono */
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    this.minimappa(corsa)
  }

  /* uno sprite più alto di una cella — un personaggio, una porta ad arco
     — si appoggia col **fondo sul fondo della sua cella** e sborda verso
     l'alto: è quello che permette a un mostro di stare dietro al muro che
     ha davanti invece di galleggiarci sopra */
  posa(nome, cx, cy, opz = {}) {
    return this.foglio.posa(this.ctx, nome, (cx + 0.5) * T, (cy + 1) * T, opz)
  }

  /* Il ricordo: quello che si è visto ma non si sta guardando. Si spegne
     **e si raffredda** — un velo blu — perché spegnere e basta non basta:
     due tessere scure, da lontano, sono la stessa cosa. */
  velo(cx, cy) {
    const ctx = this.ctx
    ctx.fillStyle = 'rgba(8,12,30,.5)'
    ctx.fillRect(cx * T, cy * T, T + 0.5, T + 0.5)
  }

  /* ── la forma del piano, una volta per piano ──
     Quale cella è di una stanza e quale di un corridoio, dove sta il
     medaglione della fonte, cosa c'è per terra: cose che non cambiano
     finché il piano è quello, e ricalcolarle a ogni fotogramma vorrebbe
     dire rifare sessanta volte al secondo lo stesso conto. */
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
      /* il medaglione sta sotto la fontana: la stanza della fonte si
         riconosce da lontano, come dietro il teschio c'è la guardia */
      if (s.ruolo === 'fonte')
        for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
          const x = s.cx + i, y = s.cy + j
          if (stanza[y * L + x] === s.id) medaglione.set(y * L + x, [i + 1, j + 1])
        }
      /* le ragnatele negli angoli in alto, dove la fila delle facce
         incontra il muro di lato: una stanza su due, sempre la stessa */
      if (sorteDi(s.x, s.y, 3) % 2) continue
      if (pietra(s.x, s.y - 1) && pietra(s.x - 1, s.y))
        perTerra.set(s.y * L + s.x, { nome: sc.ragnatele.sx, dove: 'no' })
      const xd = s.x + s.w - 1
      if (pietra(xd, s.y - 1) && pietra(xd + 1, s.y))
        perTerra.set(s.y * L + xd, { nome: sc.ragnatele.dx, dove: 'ne' })
    }
    /* qua e là per terra: poche, mai sul medaglione, sempre le stesse */
    for (let y = 0; y < A; y++) for (let x = 0; x < L; x++) {
      const k = y * L + x
      if (liv.a(x, y) !== PAVIMENTO || perTerra.has(k) || medaglione.has(k)) continue
      const h = sorteDi(x, y, 1)
      const nome = h % 67 === 0 ? sc.perTerra[2] : h % 29 === 0 ? sc.perTerra[1]
        : h % 17 === 0 ? sc.perTerra[0] : null
      if (nome) perTerra.set(k, { nome, dove: 'centro', specchia: ((h >>> 9) & 1) === 1 })
    }
    this._forma = { liv, sc, stanza, medaglione, perTerra }
    return this._forma
  }

  /* ── il pavimento ──
     La stanza e il corridoio hanno due disegni, ed è la prima cosa che
     dice dove si è. Ognuno è un quadrato di 4×4 celle da cui ogni cella
     prende la sua parte: nessuna piastrella col suo bordo, quindi niente
     tabella. */
  pavimento(sc, forma, x, y, alfa) {
    const ctx = this.ctx, f = this.foglio
    const k = y * forma.liv.largo + x
    const nome = forma.stanza[k] >= 0 ? sc.pavimento.stanza : sc.pavimento.corridoio
    f.ritaglio(ctx, nome, (x & 3) * T, (y & 3) * T, T, T, x * T, y * T, { alfa })
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

  /* ── il tetto, e il suo bordo ──
     La roccia vista da sopra: quasi piatta, e con la sua trama di sassi
     e radici solo vicino a dove si cammina — piena a una cella, sfumata
     a due, niente più in là. È com'è nella scena generata, ed è il
     motivo per cui una stanza si stacca dal buio: ripetuta dappertutto,
     la trama faceva carta da parati sui muri spessi. I bordi e gli
     angoli li decide `bordiDelTetto`. */
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
    const a = f.misura(sc.bordi.angolo)
    for (const q of b.angoli)
      f.pezzo(ctx, sc.bordi.angolo, x * T + (q[1] === 'o' ? 0 : T - a.w),
              y * T + (q[0] === 'n' ? 0 : T - a.h), { alfa })
  }

  /* ── la faccia del muro ──
     Una striscia di sei celle, e ogni tanto una variante di una cella
     in mezzo: una torcia, una grata, un arco murato. Sale di un filo
     sulla cella di sopra, ed è il coronamento. Torna `true` se ha messo
     una torcia, perché la sua luce si disegna dopo, sopra tutto. */
  faccia(sc, liv, pietra, x, y, alfa) {
    const ctx = this.ctx, f = this.foglio
    const h = sorteDi(x, y, 2)
    const torcia = h % 9 === 0
    let nome = sc.faccia, rx = (x % 6) * T
    if (torcia) { nome = sc.torcia; rx = 0 }
    else if (h % 5 === 1) { nome = sc.varianti[(h >>> 8) % sc.varianti.length]; rx = 0 }
    const m = f.misura(nome)
    if (!m) return false
    const y0 = y * T + T - m.h
    f.ritaglio(ctx, nome, rx, 0, T, m.h, x * T, y0, { alfa })
    const c = capiDellaFaccia(pietra, (a, b) => liv.a(a, b) === PORTA, x, y)
    if (c.sx) f.pezzo(ctx, sc.capi.sx, x * T, y0, { alfa })
    if (c.dx) f.pezzo(ctx, sc.capi.dx, x * T + T - f.misura(sc.capi.dx).w, y0, { alfa })
    return torcia
  }

  /* La luce di una torcia sul muro: la stessa del braciere, più piccola
     — dice che la stanza ha qualcuno che la tiene accesa, e scalda il
     muro invece di stare lì come un disegno. */
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

  /* ── le cose ──
     Ognuna ha il suo pezzo; quelle animate scorrono i fotogrammi
     sull'orologio. Quello che nel foglio non c'è si disegna con l'emoji:
     un buco si nota, e un pezzo mancante non deve far sparire un
     forziere. */
  roba(r, luce, t, tocca = false, sc = SCENARI[SCENARIO], corsa = null) {
    const ctx = this.ctx
    const px = r.fx != null ? r.fx : r.x + 0.5
    const py = r.fy != null ? r.fy : r.y + 0.5
    /* ── l'arredo sta un passo indietro ──
       Barile, cassa, stendardo: sono disegnati dallo stesso foglio di un
       forziere e con la stessa cura, quindi a piena luce chiedevano
       attenzione esattamente quanto le cose che rispondono al dito — e
       i bambini infatti le toccavano e chiedevano a cosa servissero. Il
       filo dorato dice «io sì»; questo dice «io no», ed è la metà che
       mancava. Non si spegne del tutto: sparire farebbe di una stanza
       arredata una stanza vuota, che è il difetto opposto. La luce del
       braciere resta piena, perché quella non è la figura — è quello
       che la figura fa. */
    const alfaLuce = luce === 2 ? 1 : 0.45
    const alfa = alfaLuce * (r.che === 'arredo' ? 0.66 : 1)

    if (r.che === 'mostro') {
      const scheda = MOSTRI[r.tipo]
      /* `unaPosa` è dichiarato dal mostro (`dati/mostri.js`): i fogli
         del bestiario nuovo disegnano il respiro e basta, una corsa
         separata non ce l'hanno. Chiederla lo stesso vorrebbe dire un
         nome che nell'atlante non c'è, e `drawImage` con un argomento
         non finito torna **senza disegnare e senza lanciare** — cioè
         un mostro invisibile e nessun errore da nessuna parte. */
      const posa = r.sveglio && !scheda.unaPosa ? 'corsa' : 'fermo'
      const fr = (t * (r.sveglio ? 8 : 4)) | 0
      /* l'alone dice «questo ti costa», e da sveglio pulsa: si vede prima
         di essergli arrivati addosso */
      const q = r.sveglio ? 0.3 + 0.14 * Math.sin(t * 7) : 0.14
      ctx.fillStyle = `rgba(224,100,79,${q * alfa})`
      ctx.beginPath()
      ctx.arc(px * T, py * T + T * 0.2, T * 0.5, 0, 7)
      ctx.fill()

      const suo = pezzoAndante(scheda.sprite, posa, fr)
      /* un mostro ha già il suo alone rosso, che dice la stessa cosa in
         un'altra lingua: qui il filo serve solo a dire che ci si può
         arrivare col dito da dove si sta */
      if (tocca) this.filo(suo, px - 0.5, py - 0.5, t, { specchia: r.guarda === 'sx' })
      if (!this.posa(suo, px - 0.5, py - 0.5, { alfa, specchia: r.guarda === 'sx' }))
        this.emoji(r.em, px, py, alfa)
      if (r.chiave) this.emoji('🗝️', px + 0.42, py - 0.55, alfa, 0.42)
      if (!r.sveglio) this.emoji('💤', px + 0.4, py - 0.4, alfa * 0.8, 0.32)
      if (r.ossa < r.ossaMax) this.barretta(px, py, r.ossa / r.ossaMax, alfa)
      return
    }

    /* ── quello che sta per terra galleggia ──
       Da quando la roba si raccoglie **toccandola** e non camminandoci
       sopra, un oggetto fermo in mezzo al pavimento è indistinguibile da
       una crepa disegnata: il respiro e l'alone caldo sono tutto quello
       che dice «questo qui si prende». Sta nel disegno e non nelle
       regole, come vuole la casa: la tela non sa cosa sia una spada. */
    /* ── quello che arde ──
       Un braciere acceso non è una figura ferma: **fa luce**, e la luce
       trema. È tutta la differenza fra una stanza arredata e una stanza
       con dentro delle icone. */
    if (r.arde) {
      const q = 0.22 + 0.07 * Math.sin(t * 6 + r.x * 1.7 + r.y)
      const alone = ctx.createRadialGradient(px * T, py * T, T * 0.2, px * T, py * T, T * 2.2)
      /* la luce del braciere è piena anche se la sua figura è smorzata:
         quello che fa non è arredo */
      alone.addColorStop(0, `rgba(255,176,80,${q * alfaLuce})`)
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

    /* quello che il pezzo non può sapere da sé e la tela sì: da che
       parte si vede una porta (dal muro in cui sta) e se la scala è
       ancora chiusa (dalla chiave del piano) */
    const liv = corsa && corsa.livello
    const info = r.che === 'porta' && liv
      ? { verso: versoDellaPorta((a, b) => liv.a(a, b) !== PAVIMENTO, r.x, r.y) }
      : r.che === 'scala' && corsa ? { chiusa: !corsa.chiaveDelPiano } : {}
    const quale = PEZZO_DI[r.che]
    const nome = r.che === 'cosa' ? (COSE[r.cosa] || {}).sprite : quale ? quale(r, t, sc, info) : null
    /* ── il filo di luce su quello che si tocca ──
       Una lanterna a terra e un forziere sono lo stesso genere di
       disegno, e finché si somigliavano non c'era modo di sapere quale
       dei due risponde al dito se non provandoli tutti. Il filo lo dice
       senza scriverlo, ed è la convenzione di tutti i giochi di questo
       genere. Solo in piena luce, perché toccabile lo è solo lì. */
    if (tocca && nome) this.filo(nome, px - 0.5, py - 0.5 + su, t)
    /* quello che il foglio non disegna resta un'emoji, e un'emoji non ha
       una sagoma da contornare: lì il «questo si tocca» lo dice un alone
       tondo dietro, che è la stessa luce con un'altra forma. Oggi non
       succede più a niente in scena — fonte e mercante hanno il loro
       disegno — ma è il ripiego di un pezzo che manca, e un pezzo che
       manca non deve far sparire una cosa da toccare. */
    if (tocca && !nome) this.aureola(px, py + su, t)
    if (!nome || !this.posa(nome, px - 0.5, py - 0.5 + su, { alfa }))
      this.emoji(r.em, px, py + su, alfa)

    /* il segno sopra una porta chiusa: l'unica cosa con cui si sceglie
       dove andare, quindi si vede anche in un piano già girato */
    if (r.che === 'porta' && !r.aperta && SEGNI[r.segno])
      this.emoji(SEGNI[r.segno].em, px, py - 1.25, alfa, 0.5)
  }

  /* Il filo di luce intorno a una figura: respira piano — abbastanza
     da farsi notare girando lo sguardo, non tanto da sembrare un
     allarme. Il colore è quello del bersaglio e dell'alone della roba
     per terra: in questo gioco l'oro vuol dire «questo riguarda te». */
  filo(nome, cx, cy, t, opz = {}) {
    /* un filo più marcato di prima (0,5 ± 0,22): con l'arredo smorzato
       accanto, i due segnali si leggono insieme — questo si accende,
       quello sta indietro — ed è la coppia che spiega la regola senza
       scriverla. Sotto l'unità non si sale: un contorno che pulsa da 0 a
       1 diventa un allarme, e allora la stanza intera lampeggia. */
    const q = 0.62 + 0.28 * Math.sin(t * 2.4)
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

  /* Le emoji le disegna il telefono, quindi non si tingono dell'ambiente
     e hanno lo stile di chi l'ha fatto: si usano **solo** per quello che
     il foglio non ha — i segni sopra le porte, e il ripiego di un pezzo
     che manca — mai per un mostro. */
  emoji(em, px, py, alfa, quanto = 0.8) {
    const ctx = this.ctx
    ctx.save()
    ctx.globalAlpha = alfa
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `${Math.round(T * quanto)}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`
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

    /* la torcia in mano: piccola e calda, non un faro. Dice «la luce sei
       tu», e fa vedere che la luce di una stanza è un'altra cosa */
    const alone = ctx.createRadialGradient(sx, sy, T * 0.3, sx, sy, T * 2.4)
    alone.addColorStop(0, 'rgba(255,214,140,.20)')
    alone.addColorStop(1, 'rgba(255,214,140,0)')
    ctx.fillStyle = alone
    ctx.beginPath(); ctx.arc(sx, sy, T * 2.4, 0, 7); ctx.fill()
    ctx.fillStyle = 'rgba(0,0,0,.4)'
    ctx.beginPath(); ctx.ellipse(sx, sy + T * 0.38, T * 0.28, T * 0.1, 0, 0, 7); ctx.fill()

    /* chi si è scelto: la scheda porta il nome della sua famiglia di
       pezzi (`cavaliere`, `elfa`, `mago`, `nano`) e da qui in poi non
       cambia niente altro */
    const chi = (corsa.io && corsa.io.sprite) || 'cavaliere'
    const specchia = corsa.guarda === 'sx'
    if (!this.posa(pezzoAndante(chi, cammina ? 'corsa' : 'fermo', fr),
                   corsa.eroe.x - 0.5, corsa.eroe.y - 0.5, { specchia }))
      this.emoji(corsa.io ? corsa.io.em : '🧝', corsa.eroe.x, corsa.eroe.y, 1)

    this.arma(corsa, sx, sy, specchia, t, cammina)

    /* La vita **sopra la testa**, non solo nella fascia in cima: mentre
       si combatte gli occhi stanno sul campo, e un numero in cima allo
       schermo lo si scopre dopo — cioè quando è già finita. Compare solo
       quando manca qualcosa, come per i mostri feriti: una barra sempre
       piena è una barra che non si guarda più. */
    if (corsa.vita < corsa.vitaMax)
      this.barretta(corsa.eroe.x, corsa.eroe.y - 1.15, corsa.vita / corsa.vitaMax, 1)
  }

  /* ── l'arma che si porta ──
     Non c'è nessun fotogramma dell'eroe che impugni qualcosa: 0x72
     disegna le armi **staccate**, ed è quello che permette a un foglio
     di dodici armi di andare bene per quattro personaggi senza
     disegnarne quarantotto. Si posa quindi accanto al pugno, punta in
     su, e respira col passo — che è il modo in cui i giochi di questa
     famiglia le hanno sempre mostrate.

     Il verso lo decide `specchia`, come per chi la porta: un'arma che
     resta a destra mentre l'eroe guarda a sinistra sembra portata da
     qualcun altro. */
  arma(corsa, sx, sy, specchia, t, cammina) {
    const su = Math.sin(t * (cammina ? 9 : 3)) * (cammina ? 0.9 : 0.5)
    const lato = specchia ? -1 : 1
    const posa = (k, verso, opz) => {
      const nome = (COSE[k] || {}).sprite
      if (!nome) return
      this.foglio.posa(this.ctx, nome, sx + verso * T * 0.42, sy + T * 0.42 + su, opz)
    }
    /* chi porta due armi le porta **una per lato**, ed è l'unico modo
       di far vedere dal campo che la scelta è stata fatta: nel corredo
       si vedono due caselle piene, qui si vedono due lame. Quella
       debole va dietro — si disegna prima — o coprirebbe il braccio
       buono.

       Un'arma a due mani si posa invece **in mezzo, davanti al corpo**:
       è così che si tiene un'asta o uno spadone, e si legge a colpo
       d'occhio che le mani sono impegnate tutte e due. La prima idea
       era posarne una copia sbiadita anche dall'altro lato, come fa il
       corredo con l'ombra nella casella: a schermo si vedono due armi,
       non una tenuta in due — l'ombra funziona in un elenco di caselle,
       dove il posto vuoto ha un significato, e non addosso a una
       figura. */
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

  /* ── la mappina ──
     In un posto grande la domanda che torna sempre è «da che parte non
     sono ancora stato». Mostra solo quello che si è visto, e i tre punti
     che servono: dove sei, dov'è la scala, chi ha la chiave. */
  minimappa(corsa) {
    const liv = corsa.livello
    const ctx = this.ctx
    const p = Math.max(1.6, Math.min(2.6, 120 / liv.largo))
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
      /* un baule già aperto sparisce dalla mappina: segnarlo vorrebbe
         dire mandare qualcuno dall'altra parte del piano per niente.
         La roba per terra invece **si segna**, perché adesso va toccata
         e una spada dimenticata è una spada persa. */
      const colore = r.che === 'mostro' && r.chiave ? '#ffd23f'
        : r.che === 'porta' && !r.aperta ? '#c9a227'
        : r.che === 'scala' ? '#6fc6ff'
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
