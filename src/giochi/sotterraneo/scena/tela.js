/* ═══════════════════════════════════════════════════════════════════
   LA TELA DEL SOTTERRANEO — il disegno, e nient'altro

   Riceve un quadro — `{ corsa, orologio, alza }` — e lo dipinge. Legge
   lo stato della discesa **come dato** (`corsa.livello`, `corsa.luceDi`,
   `corsa.robe`) senza importare la classe: chi la usa passa un'istanza
   vera o un finto oggetto della stessa forma, e per questa classe non fa
   differenza. Di regole non sa niente: non sa quanto costa un mostro né
   perché una porta è chiusa.

   ── I DUE MOTORI CONDIVISI, FINALMENTE AGGANCIATI ─────────────────
   `grafica/atlante.js` (`creaFoglio`, `netto`, `scalaIntera`) sa posare
   uno sprite: il piede, lo specchio, i bordi netti. `grafica/tessere.js`
   (`bordoOtto`, `pezzoPer`, `variante`) sa **quale** pezzo va in una
   cella, ricavandolo dai vicini. Erano stati scritti per questo e sono
   rimasti a lungo senza nessuno che li usasse; qui si aggancia riga per
   riga, e quello che resta scritto a mano è soltanto la geometria di
   questo set — che è la parte che cambia davvero cambiando foglio.

   ── LA SCALA STA NELLA TRASFORMAZIONE, NON NEI CONTI ──────────────
   Il contesto si scala una volta per fotogramma (`dpr × scala`), e da lì
   in poi **tutto è in pixel dello sprite**: una cella è `T`, un mostro è
   alto quello che è alto. Senza, ogni riga di disegno finisce per
   moltiplicare per la scala, e prima o poi una se ne dimentica o la
   moltiplica due volte — che è il difetto trovato nel bestiario, dove
   una nebbia diventava grande quanto la bestia solo a figura grande.
   Lo zoom resta **a numeri interi** (`dati/mondo.js`): a scala 2,3 i
   pixel verrebbero larghi due e altri tre, e da vicino si vede.

   ── I MURI SONO ALTI DUE CELLE, E NON È UN DETTAGLIO ──────────────
   Questo set disegna la parete come la si vede di fronte: una fascia di
   mattoni con sopra il suo coronamento. Quindi il muro a nord di una
   stanza **occupa due celle** di roccia, non una: la cella subito sopra
   il pavimento porta la faccia, quella ancora sopra porta la cima. È il
   costo vero di un cambio di famiglia di sprite, e vive qui — un set con
   i muri visti dall'alto vorrebbe un altro disegno, e nient'altro del
   gioco se ne accorgerebbe.
   ═══════════════════════════════════════════════════════════════════ */
import { ATLANTE, PEZZI, TESSERA } from '../dati/atlante.js'
import { T, SCALA_MIN, SCALA_MAX, SCALA_INIZIALE, ROCCIA } from '../dati/mondo.js'
import { SUOLI, MATTONI, FACCE, CIME, CORONA, PEZZO_DI, pezzoAndante } from '../dati/tessere.js'
import { MOSTRI } from '../dati/mostri.js'
import { COSE, SEGNI } from '../dati/cose.js'
import { creaFoglio, netto } from '../../../grafica/atlante.js'
import { bordoOtto, pezzoPer, variante } from '../../../grafica/tessere.js'

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

    /* prima il suolo, poi i muri: i muri sono alti e devono poter coprire
       il suolo della cella sopra la loro */
    for (let x = c0x; x < c1x; x++) for (let y = c0y; y < c1y; y++) {
      const luce = corsa.luceDi(x, y)
      if (!luce || liv.a(x, y) === ROCCIA) continue
      this.tessera(variante(SUOLI, x, y, 3), x, y, luce === 2 ? 1 : 0.5)
      if (luce === 1) this.velo(x, y)
    }
    for (let x = c0x; x < c1x; x++) for (let y = c0y; y < c1y; y++) {
      const luce = corsa.luceDi(x, y)
      if (!luce || liv.a(x, y) !== ROCCIA) continue
      this.muro(liv, x, y, luce)
    }

    for (const r of liv.robe) {
      if (r.presa || r.morto) continue
      const luce = corsa.luceDi(r.x, r.y)
      if (!luce) continue
      /* `toccabile` è un fatto già deciso dal motore, come `potenziabile`
         nel castello: qui non si ricalcola niente, si guarda. */
      this.roba(r, luce, orologio, !!(corsa.toccabile && corsa.toccabile(r)))
    }
    this.eroe(corsa, orologio)
    if (corsa.bersaglio) this.bersaglio(corsa.bersaglio, orologio)

    /* l'interfaccia torna in pixel schermo: la mappina non si ingrandisce
       con lo zoom, o a ×5 coprirebbe mezzo telefono */
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
    this.minimappa(corsa)
  }

  /* una tessera di terreno riempie il suo quadrato e basta: non sborda,
     non si appoggia */
  tessera(nome, cx, cy, alfa) {
    return this.foglio.pezzo(this.ctx, nome, cx * T, cy * T, { alfa })
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

  /* ── il muro ──
     Prima si **riempie**: ogni cella di roccia che tocca il pavimento,
     anche solo per un angolo, si dipinge di mattoni. Senza questo passo
     restano buchi neri dentro le pareti — le celle che toccano il
     pavimento solo in diagonale — e una parete bucata si legge come un
     guasto, perché è quello che sembra.

     Poi si rifinisce, e solo dove il foglio ha un pezzo apposta. La
     chiave la dà `bordoOtto` guardando dove finisce la roccia; la tavola
     è in `dati/tessere.js`, e quello che non c'è nella tavola non si
     disegna. */
  muro(liv, x, y, luce) {
    const solido = (a, b) => liv.a(a, b) === ROCCIA
    const alfa = luce === 2 ? 1 : 0.5
    let tocca = false
    for (let dx = -1; dx <= 1 && !tocca; dx++)
      for (let dy = -1; dy <= 1; dy++)
        if ((dx || dy) && !solido(x + dx, y + dy)) { tocca = true; break }

    /* la roccia profonda non è un buco: è muro anche lei, solo più scuro.
       Lasciarla nera spezzava le pareti in due. */
    if (!tocca) return this.tessera(MATTONI, x, y, alfa * 0.45)
    this.tessera(MATTONI, x, y, alfa)

    const lati = bordoOtto(solido, x, y).split('-')[0]
    if (lati.includes('S')) {
      const faccia = pezzoPer(FACCE, lati)
      this.tessera(faccia ? faccia.nome : FACCE.S, x, y, alfa)
      if (solido(x, y - 1)) {
        const cima = pezzoPer(CIME, lati)
        this.tessera(cima ? cima.nome : CIME.S, x, y - 1, alfa)
      }
    } else if (lati.includes('N')) {
      /* il lato di sotto della stanza: da qui si vede il coronamento del
         muro, non la sua faccia */
      this.tessera(CORONA, x, y, alfa)
    }
    if (luce === 1) this.velo(x, y)
  }

  /* ── le cose ──
     Ognuna ha il suo pezzo; quelle animate scorrono i fotogrammi
     sull'orologio. Quello che nel foglio non c'è si disegna con l'emoji:
     un buco si nota, e un pezzo mancante non deve far sparire un
     forziere. */
  roba(r, luce, t, tocca = false) {
    const ctx = this.ctx
    const px = r.fx != null ? r.fx : r.x + 0.5
    const py = r.fy != null ? r.fy : r.y + 0.5
    const alfa = luce === 2 ? 1 : 0.45

    if (r.che === 'mostro') {
      const scheda = MOSTRI[r.tipo]
      const posa = r.sveglio ? 'corsa' : 'fermo'
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
      alone.addColorStop(0, `rgba(255,176,80,${q * alfa})`)
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

    const quale = PEZZO_DI[r.che]
    const nome = r.che === 'cosa' ? (COSE[r.cosa] || {}).sprite : quale ? quale(r, t) : null
    /* ── il filo di luce su quello che si tocca ──
       Una lanterna a terra e un forziere sono lo stesso genere di
       disegno, e finché si somigliavano non c'era modo di sapere quale
       dei due risponde al dito se non provandoli tutti. Il filo lo dice
       senza scriverlo, ed è la convenzione di tutti i giochi di questo
       genere. Solo in piena luce, perché toccabile lo è solo lì. */
    if (tocca && nome) this.filo(nome, px - 0.5, py - 0.5 + su, t)
    /* la fonte e il mercante sono emoji — il foglio non li disegna — e
       un'emoji non ha una sagoma da contornare: lì il «questo si tocca»
       lo dice un alone tondo dietro, che è la stessa luce con un'altra
       forma */
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
    const q = 0.5 + 0.22 * Math.sin(t * 2.4)
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
     il foglio non ha (una fontana, un mercante), mai per un mostro. */
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
