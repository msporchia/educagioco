// La tela: riceve un quadro ({ corsa, orologio }) e lo dipinge. Legge lo
// stato come dato (corsa.livello, corsa.luceDi, corsa.robe) senza importare
// la classe, e non sa niente di regole. grafica/atlante.js sa posare uno
// sprite; quale pezzo di muro va in una cella lo decide scena/muri.js
// (docs/sotterraneo/scenari.md: il muro alto una cella, non un bordo di
// zona). La scala sta nella trasformazione (dpr × scala), mai nei conti:
// da lì in poi tutto è in pixel di sprite — altrimenti una riga prima o
// poi la moltiplica due volte (il difetto trovato nel bestiario).
import { ATLANTE, PEZZI, TESSERA, NITIDO, NITIDI } from '../dati/atlante.js'
import { T, SCALA_MIN, SCALA_MAX, SCALA_INIZIALE, ROCCIA, PAVIMENTO, PORTA, RELITTO, ACQUA, BERSAGLIO } from '../dati/mondo.js'
import { SCENARI, SCENARIO, PEZZO_DI, pezzoAndante } from '../dati/tessere.js'
import { MOSTRI } from '../dati/mostri.js'
import { COSE } from '../dati/cose.js'
import { impugnatura } from '../dati/impugna.js'
import { creaFoglio, netto } from '../../../grafica/atlante.js'
import { tetto, faccia, bordiDelTetto, capiDellaFaccia, versoDellaPorta, sorteDi, diagonaliDelPiano, VICINA_DEL_TAGLIO } from './muri.js'
import { dipingiPortale, PORTALE } from './portale.js'
import { dipingiRelitto, dipingiAcqua } from './relitti.js'
import { TINTE_RELITTI } from '../dati/relitti.js'
import { chiaroreDellaScala, SCALA_SU } from './scala-su.js'
import { GROSSI, figuraDelGrosso, spriteDelGrosso } from '../dati/grossi.js'
import { fotogrammaDi } from '../dati/fotogrammi.js'
import { MANI } from '../dati/varianti.js'
import { fattoreDelMostro } from '../viste/campo.js'

// l'aura di un pezzo per terra, del colore della sua rarità (docs/sotterraneo/rarita.md): il comune non ne ha
const AURA = { magico: '111,141,255', raro: '255,210,63', leggendario: '255,154,46' }
const STANZE_LISCE = ['smussata', 'cappella', 'sala']   // le forme che hanno muri in diagonale (docs/sotterraneo/scenari.md)

export class Tela {
  constructor(canvas) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.scala = SCALA_INIZIALE
    this.vista = { x: 0, y: 0 }          // l'angolo in alto a sinistra, in pixel di sprite
    this.L = 0; this.A = 0; this.dpr = 1
    // il foglio si carica da sé: disegnare prima che sia pronto non rompe niente, `posa` risponde `false`
    this.foglio = creaFoglio({ pezzi: PEZZI, immagine: ATLANTE, tessera: TESSERA,
                              nitidi: { pezzi: NITIDI, immagine: NITIDO } })
    this.foglio.carica().catch(() => {})
    this.quadro = null
    this.mappaGrande = false   // la mappina aperta grande dalla barra in basso
    this.colonne = []          // le colonne di luce di un livello salito: { x, y, t, colore, segui }
    this.numerini = []         // l'esperienza di un mostro battuto, che sale dal campo e sparisce: { testo, x, y, t }
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
    // il cono sfuma ai bordi: la forza di una cella in luce (da 0,2 a 1) la porta dal ricordo (mezzo spento) alla luce
    // piena, senza gradini; il velo del ricordo si alleggerisce di conseguenza (docs/sotterraneo/luce.md)
    const forza = (x, y) => (corsa.forzaDi ? corsa.forzaDi(x, y) : 1)
    const alfaDi = (luce, x, y) => (luce === 2 ? 0.5 + 0.5 * forza(x, y) : 0.5)
    for (let y = c0y; y < c1y; y++) for (let x = c0x; x < c1x; x++) {
      const luce = corsa.luceDi(x, y)
      if (!luce) continue
      if (!pietra(x, y)) this.pavimento(sc, forma, x, y, alfaDi(luce, x, y))
      else if (forma.tagli.has(y * liv.largo + x)) {   // sotto un taglio in diagonale resta il pavimento vero
        const [dx, dy] = VICINA_DEL_TAGLIO[forma.tagli.get(y * liv.largo + x)]
        this.pavimento(sc, forma, x, y, alfaDi(luce, x, y), { x: x + dx, y: y + dy })
      }
    }
    for (let y = c0y; y < c1y; y++) for (let x = c0x; x < c1x; x++) {
      const luce = corsa.luceDi(x, y)
      const k = y * liv.largo + x
      const dentro = forma.interni.get(k)   // un angolo interno smussato: sul pavimento, il bordo in basso (i due sopra sono facce)
      if (luce && (dentro === 'so' || dentro === 'se')) this.taglio(sc, dentro, x, y, alfaDi(luce, x, y))
      if (luce && forma.sopraInterni.has(k)) this.tetto(sc, pietra, x, y, alfaDi(luce, x, y), true)   // sotto è una faccia obliqua: qui il tetto
      if (!luce || !tetto(pietra, x, y)) continue
      if (forma.tagli.has(k)) this.taglio(sc, forma.tagli.get(k), x, y, alfaDi(luce, x, y))
      else this.tetto(sc, pietra, x, y, alfaDi(luce, x, y), forma.sopra.has(k))
    }
    const torce = []
    for (let y = c0y; y < c1y; y++) for (let x = c0x; x < c1x; x++) {
      const luce = corsa.luceDi(x, y)
      if (!luce) continue
      const dentro = forma.interni.get(y * liv.largo + x)
      if (dentro === 'no' || dentro === 'ne') {   // l'angolo interno: la faccia obliqua posata sul pavimento
        const su = corsa.luceDi(x, y - 1)
        this.facciaObliqua(sc, dentro, x, y, alfaDi(luce, x, y), su ? alfaDi(su, x, y - 1) : 0)
        continue
      }
      if (!faccia(pietra, x, y) || forma.sopraInterni.has(y * liv.largo + x)) continue
      const obliqua = forma.tagli.get(y * liv.largo + x)
      if (obliqua) {
        const su = corsa.luceDi(x, y - 1)
        this.facciaObliqua(sc, obliqua, x, y, alfaDi(luce, x, y), su ? alfaDi(su, x, y - 1) : 0)
        continue
      }
      if (this.faccia(sc, liv, pietra, x, y, alfaDi(luce, x, y)) && luce === 2 && forza(x, y) > 0.6) torce.push([x, y])
    }
    for (const [x, y] of torce) this.fiamma(x, y, orologio)
    // l'acqua e i relitti sono terreno: stanno sotto i veli, e il ricordo o il cono li scuriscono come il pavimento
    this.ingombri(corsa, liv, sc, c0x, c0y, c1x, c1y, alfaDi, orologio)
    // i veli delle caselle in luce si posano a gradini di un quarto, ognuno in un tracciato solo: due rettangoli che si
    // sovrappongono (velo() sbordando di mezzo pixel) lascerebbero la riga della giunzione più scura
    const ambra = corsa.torciaAccesa ? 0.16 : 0.09   // la luce è calda davanti e si raffredda ai bordi
    const scuri = [[], [], [], []], caldi = [[], [], [], []]
    for (let y = c0y; y < c1y; y++) for (let x = c0x; x < c1x; x++) {
      const luce = corsa.luceDi(x, y)
      if (luce === 1) this.velo(x, y)
      else if (luce === 2) {
        const f = forza(x, y)
        if (f < 0.88) scuri[Math.max(0, Math.round((1 - f) * 4) - 1)].push([x, y])
        caldi[Math.max(0, Math.round(f * 4) - 1)].push([x, y])
      }
    }
    scuri.forEach((celle, i) => this.veli(celle, '8,12,30', 0.5 * (i + 1) / 4))
    caldi.forEach((celle, i) => this.veli(celle, '255,172,76', ambra * (i + 1) / 4))

    this.etichette = []
    for (const r of liv.robe) {
      if (r.presa || (r.morto && r.che !== 'fonte')) continue   // la fonte bevuta resta, il resto se ne va
      const luce = corsa.luceDi(r.x, r.y)
      if (!luce) continue
      if (luce === 1 && r.che === 'mostro') continue   // il ricordo non muove: un mostro si vede solo in luce (docs/sotterraneo/regole.md, «La luce»)
      // `toccabile` è un fatto già deciso dal motore, come `potenziabile` nel castello: qui si guarda, non si ricalcola
      this.roba(r, luce, orologio, !!(corsa.toccabile && corsa.toccabile(r)), sc, corsa)
    }
    this.eroe(corsa, orologio)
    this.colonneDiLuce(corsa, orologio)
    this.numeriniCheSalgono(orologio)
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
  // `alfa` qui è quanta luce arriva: il pezzo resta opaco e si scurisce (`scuro`), mai trasparente sul pavimento
  posa(nome, cx, cy, opz = {}) {
    return this.foglio.posa(this.ctx, nome, (cx + 0.5) * T, (cy + 1) * T, { scuro: true, ...opz })
  }

  // il ricordo si spegne E si raffredda (velo blu): spegnere e basta non basta, due tessere scure sono la stessa cosa
  veli(celle, colore, alfa) {
    if (!celle.length) return
    const ctx = this.ctx
    ctx.fillStyle = `rgba(${colore},${alfa})`
    ctx.beginPath()
    for (const [x, y] of celle) ctx.rect(x * T, y * T, T, T)
    ctx.fill()
  }

  velo(cx, cy, alfa = 0.5) {
    const ctx = this.ctx
    ctx.fillStyle = `rgba(8,12,30,${alfa})`
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
    for (let k = 0; k < stanza.length; k++) stanza[k] = liv.nelle ? liv.nelle[k] : -1   // dove la stanza è davvero (non il riquadro)
    for (const s of stanze) {
      // il medaglione sta sotto la fontana: la stanza della fonte si riconosce da lontano
      if (s.ruolo === 'fonte')
        for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) {
          const x = s.cx + i, y = s.cy + j
          if (stanza[y * L + x] === s.id) medaglione.set(y * L + x, [i + 1, j + 1])
        }
      // ragnatele negli angoli in alto: una stanza su due, sempre la stessa. Gli angoli sono i capi della fila più alta
      if (sorteDi(s.x, s.y, 3) % 2) continue
      const fila = s.suolo.filter(c => c.y === s.y).map(c => c.x)
      if (!fila.length) continue
      const xs = Math.min(...fila), xd = Math.max(...fila)
      if (pietra(xs, s.y - 1) && pietra(xs - 1, s.y))
        perTerra.set(s.y * L + xs, { nome: sc.ragnatele.sx, dove: 'no' })
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
    // i muri in diagonale (solo gli scenari che hanno i pezzi): le celle tagliate, gli angoli interni e le celle sopra una faccia obliqua
    const { tagli, sopra, interni, sopraInterni } = sc.diagonali ? diagonaliDelPiano(liv, STANZE_LISCE)
      : { tagli: new Map(), sopra: new Set(), interni: new Map(), sopraInterni: new Set() }
    this._forma = { liv, sc, stanza, medaglione, perTerra, tagli, sopra, interni, sopraInterni }
    return this._forma
  }

  // stanza e corridoio: due quadrati di 4×4 celle da cui ogni cella prende la sua parte, niente piastrelle col bordo
  pavimento(sc, forma, x, y, alfa, comeDi = null) {
    const ctx = this.ctx, f = this.foglio
    const k = y * forma.liv.largo + x
    const nome = forma.stanza[comeDi ? comeDi.y * forma.liv.largo + comeDi.x : k] >= 0 ? sc.pavimento.stanza : sc.pavimento.corridoio
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
  tetto(sc, pietra, x, y, alfa, sottoUnaFaccia = false) {
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
    if (sottoUnaFaccia) { b.o = false; b.e = false }   // mezza cella è la faccia obliqua: i suoi lati non hanno striscia
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

  // una cella tagliata in diagonale, roccia sotto (`so`, `se`): il pezzo è la roccia col suo bordo, il pavimento sotto è già posato
  taglio(sc, lato, x, y, alfa) {
    this.foglio.pezzo(this.ctx, sc.diagonali.taglio[lato], x * T, y * T, { alfa })
  }

  // la faccia di una parete obliqua: un pezzo alto due celle, la cella e quella sopra, ognuna con la sua luce (0 = non vista)
  facciaObliqua(sc, lato, x, y, alfa, alfaSopra) {
    const ctx = this.ctx, f = this.foglio
    const nome = sc.diagonali.faccia[lato][x & 1]
    if (alfaSopra) f.ritaglio(ctx, nome, 0, 0, T, T, x * T, (y - 1) * T, { alfa: alfaSopra })
    f.ritaglio(ctx, nome, 0, T, T, T, x * T, y * T, { alfa })
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

  // le pozze e i relitti di un piano (scena/relitti.js, docs/sotterraneo/piani-caverne.md): le pozze prima, poi i relitti dall'alto
  // in basso, che quelli più giù coprono il bordo di quelli più su. Un relitto con uno sprite nell'atlante si posa come l'arredo, uno
  // senza si disegna in codice
  ingombri(corsa, liv, sc, c0x, c0y, c1x, c1y, alfaDi, t) {
    const scenario = corsa.scenario
    const tinte = TINTE_RELITTI[scenario] || TINTE_RELITTI.cantine
    for (let y = c0y; y < c1y; y++) for (let x = c0x; x < c1x; x++) {
      if (liv.a(x, y) !== ACQUA) continue
      const luce = corsa.luceDi(x, y)
      if (!luce) continue
      const terra = (a, b) => liv.a(a, b) !== ACQUA
      dipingiAcqua(this.ctx, x, y, { n: terra(x, y - 1), s: terra(x, y + 1), o: terra(x - 1, y), e: terra(x + 1, y) }, t, alfaDi(luce, x, y))
    }
    const visti = (liv.relitti || []).filter(r => r.x + r.w >= c0x && r.x < c1x && r.y + r.h >= c0y && r.y < c1y)
      .sort((a, b) => (a.y + a.h) - (b.y + b.h) || a.x - b.x)
    for (const r of visti) {
      let luce = 0, alfa = 0
      for (let j = 0; j < r.h; j++) for (let i = 0; i < r.w; i++) {
        const l = corsa.luceDi(r.x + i, r.y + j)
        if (l > luce) luce = l
        if (l) alfa = Math.max(alfa, alfaDi(l, r.x + i, r.y + j))
      }
      if (!luce) continue
      if (r.pezzo) this.posa(r.pezzo, r.x + (r.w - 1) / 2, r.y + r.h - 1, { alfa })
      else dipingiRelitto(this.ctx, r, scenario, alfa)
    }
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

    // la scala che sale: la scala a pioli dipinta, in piedi nella cella, sopra il suo chiarore
    if (r.che === 'scala-su') {
      chiaroreDellaScala(ctx, r.x * T, r.y * T, t, { alfa })
      const m = this.foglio.misura(SCALA_SU)
      if (m) this.foglio.pezzo(ctx, SCALA_SU, r.x * T + Math.round((T - m.w) / 2), r.y * T + T - m.h, { alfa, scuro: true })
      return
    }

    if (r.che === 'mostro' && r.grosso) return this.grosso(r, px, py, t, alfa, luce)

    if (r.che === 'mostro') {
      const scheda = MOSTRI[r.tipo]
      // `unaPosa`: chi non ha i passi dai video respira soltanto, e chiedere la corsa darebbe un mostro invisibile senza errore.
      // Chi ha i passi cammina davvero da sveglio; il drago (`fermoDaiPassi`) ha il respiro rotto e da fermo usa i passi, piano
      const passi = !scheda.unaPosa
      const posa = passi && (r.sveglio || scheda.fermoDaiPassi) ? 'corsa' : 'fermo'
      const fr = (t * (r.sveglio ? 8 : posa === 'corsa' ? 1.5 : 4)) | 0
      // l'alone rosso resta solo per chi conta (un capo, il custode della chiave, il bersaglio di una missione): gli altri
      // mostri sono abbastanza riconoscibili da soli, e l'alone sporcava il terreno (l'utente, 9 ottobre)
      if (scheda.capo || r.chiave || r.missione) {
        const q = r.sveglio ? 0.3 + 0.14 * Math.sin(t * 7) : 0.14   // l'alone pulsa da sveglio: si vede prima di arrivargli addosso
        ctx.fillStyle = `rgba(224,100,79,${q * alfa})`
        ctx.beginPath()
        ctx.arc(px * T, py * T + T * 0.2, T * 0.5, 0, 7)
        ctx.fill()
      }

      const suo = fotogrammaDi(scheda.sprite, posa, fr)
      const gradato = r.grado && r.grado !== 'comune' && AURA[r.grado]
      // il grado dà un alone del colore della sua rarità sotto i piedi, come la roba per terra
      if (gradato) this.aura(px, py, t, alfa, AURA[r.grado], r.grado === 'leggendario')
      // il bersaglio di una missione è più grande dei suoi simili e ha un'aura sua (dati/mondo.js, BERSAGLIO)
      // e ogni mostro dipinto sta in proporzione con l'eroe (`TAGLIA`, viste/campo.js: com'è nello scontro), a quarti attorno ai piedi
      const grande = (r.missione ? BERSAGLIO.scala : 1) * fattoreDelMostro(r.tipo, PEZZI[suo] ? PEZZI[suo][3] : 16, PEZZI[suo] ? PEZZI[suo][2] : 0)
      if (r.missione) this.auraDelBersaglio(px, py, t, alfa)
      if (grande !== 1) this.ingrandisci(px, py + 0.5, grande)
      if (r.missione) this.contornoDelBersaglio(suo, px - 0.5, py - 0.5, t, alfa, { specchia: r.guarda === 'sx' })
      // un mostro importante ha già il suo alone rosso: il filo qui serve solo a dire "ci si arriva col dito da qui"
      else if (tocca) this.filo(suo, px - 0.5, py - 0.5, t, { specchia: r.guarda === 'sx' })
      if (!this.posa(suo, px - 0.5, py - 0.5, { alfa, specchia: r.guarda === 'sx' }))
        this.emoji(r.em, px, py, alfa)
      if (r.arma) this.armaDelMostro(r, suo, px, py, alfa)
      if (grande !== 1) ctx.restore()
      if (r.caporale) this.galloni(px, py, alfa)
      // il mostro col nome di una missione porta la corona e il nome sopra la testa, quando è in vista
      if (r.missione) {
        this.emoji('👑', px - 0.05, py - 1.3 + Math.sin(t * 3) * 0.05, alfa, 0.5)
        if (luce === 2) this.etichette.push({ testo: r.nome, px, py: py - 1.75 })
      }
      if (!r.sveglio) this.emoji('💤', px + (r.missione ? 0.55 : 0.4), py - (r.missione ? 0.7 : 0.4), alfa * 0.8, 0.32)
      if (r.ossa < r.ossaMax) this.barretta(px, py, r.ossa / r.ossaMax, alfa)
      return
    }

    // un fuoco acceso fa luce, e la luce trema: la differenza fra una stanza arredata e una con dentro delle icone
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
      const c = COSE[r.cosa]
      if (c && AURA[c.rarita]) this.aura(px, py, t, alfa, AURA[c.rarita], c.rarita === 'leggendario')
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
    // quello che si tocca è disegnato com'è, senza contorno (lo sfasava): a distinguerlo basta l'arredo più spento
    if (bersaglio && nome) this.contornoDelBersaglio(nome, px - 0.5, py - 0.5 + su, t, alfa)
    if (!nome || !this.posa(nome, px - 0.5, py - 0.5 + su, { alfa }))
      this.emoji(r.em, px, py + su, alfa)
    if (bersaglio) this.ctx.restore()

    // la cosa da trovare per una missione galleggia sopra il suo forziere d'oro, finché non si apre, col nome sopra
    if (bersaglio) {
      this.emoji(r.em, px, py - 1.5 + Math.sin(t * 2.4) * 0.08, alfa, 0.95)
      if (luce === 2) this.etichette.push({ testo: r.nome, px, py: py - 2.1 })
    }
  }

  // Il mostro grosso (dati/grossi.js): lo sprite dipinto se l'atlante ce l'ha, se no quello della sua specie ingrandito
  // (`ingrandisci`, come il bersaglio di una missione) e con la corona sopra la testa. Coi piedi sul fondo della sua
  // cella, che respira; l'alone rosso più largo e un chiarore della sua tinta, la chiave, il sonno e la barretta come gli altri
  grosso(r, px, py, t, alfa, luce) {
    const ctx = this.ctx
    const G = GROSSI[r.grosso]
    const F = figuraDelGrosso(r.grosso)
    const nome = F && spriteDelGrosso(F, r.sveglio, (t * 8) | 0)
    const m = nome && this.foglio.misura(nome)
    const suolo = py + 0.5
    const q = r.sveglio ? 0.32 + 0.16 * Math.sin(t * 6) : 0.16
    ctx.fillStyle = `rgba(224,100,79,${q * alfa})`
    ctx.beginPath(); ctx.ellipse(px * T, py * T + T * 0.35, T * 1.05, T * 0.42, 0, 0, 7); ctx.fill()
    const respiro = 1 + 0.035 * Math.sin(t * (r.sveglio ? 5 : 2.2))
    let alto = 2   // in caselle: quanto sale la figura, per mettere la corona, il nome e la chiave sopra la testa
    let metà = 1
    if (m) {
      alto = (m.h - (this.foglio.vuotoSopra ? this.foglio.vuotoSopra(nome) : 0)) * F.k * respiro / T   // fin dove arriva la testa
      metà = m.w * F.k / 2 / T
      // il chiarore della sua tinta dietro la figura: distingue Re Ossuto da Carbonchio, che sono tutti e due scheletri
      const R = Math.max(alto, metà * 2) * T * 0.62
      const cy = (suolo - alto / 2) * T
      const g = ctx.createRadialGradient(px * T, cy, R * 0.15, px * T, cy, R)
      g.addColorStop(0, G.tinta); g.addColorStop(1, G.tinta + '00')
      ctx.save()
      ctx.globalAlpha = (r.sveglio ? 0.34 + 0.1 * Math.sin(t * 4) : 0.2) * alfa
      ctx.fillStyle = g
      ctx.beginPath(); ctx.arc(px * T, cy, R, 0, 7); ctx.fill()
      ctx.restore()
      // l'ingrandimento e il respiro (solo in altezza) attorno ai piedi
      ctx.save()
      ctx.translate(px * T, suolo * T)
      ctx.scale(F.k, F.k * respiro)
      ctx.translate(-px * T, -suolo * T)
      this.posa(nome, px - 0.5, py - 0.5, { alfa, specchia: r.guarda === 'sx' })
      ctx.restore()
    } else this.emoji(r.em, px, py - 0.5, alfa, 1.4)
    // la corona al ripiego: quello dipinto ha già la sua (o no, e allora non è un re)
    if (m && !F.dipinto) this.emoji('👑', px, suolo - alto - 0.1 + Math.sin(t * 3) * 0.05, alfa, Math.max(0.5, Math.min(0.7, metà * 0.6)))   // un terzo della figura, mai un mostro di corona
    const sopra = suolo - alto - (m && !F.dipinto ? 0.75 : 0.3)
    const lato = px + Math.max(0.55, metà * 0.85)
    if (!r.sveglio) this.emoji('💤', lato, suolo - alto + 0.5, alfa * 0.8, 0.32)
    if (luce === 2) this.etichette.push({ testo: r.nome, px, py: sopra - 0.45 })
    if (r.ossa < r.ossaMax) this.barretta(px, py + 0.1, r.ossa / r.ossaMax, alfa)
  }

  // L'arma in pugno di un mostro con le mani (dati/varianti.js): una figura della roba posata sulla sua mano (`MANI`), più bassa
  // dell'originale perché stia in proporzione con lui. Da che parte sta la mano lo dice lo sprite, che guarda a destra; specchiato,
  // si specchia anche l'arma. Piccola a quel modo si ammorbidisce: la figura nitida dell'atlante regge la riduzione
  armaDelMostro(r, suo, px, py, alfa) {
    const mano = MANI[r.tipo]
    const corpo = this.foglio.misura(suo), arma = this.foglio.misura(r.arma)
    if (!mano || !corpo || !arma) return
    const lato = r.guarda === 'sx' ? -1 : 1
    const k = mano.k * corpo.h / arma.h
    const ctx = this.ctx
    ctx.save()
    ctx.translate(px * T + (mano.x - 0.5) * corpo.w * lato, (py + 0.5) * T - (1 - mano.y) * corpo.h)
    ctx.scale(k, k)
    // l'impugnatura sta a due terzi dell'arma, al centro: lì si tiene
    this.foglio.pezzo(ctx, r.arma, -arma.w / 2, -arma.h * 0.68, { alfa, specchia: lato < 0, scuro: true })
    ctx.restore()
  }

  // l'aura di un pezzo non comune per terra; il leggendario ha anche la sua colonna di luce, finché nessuno lo prende
  aura(px, py, t, alfa, rgb, colonna) {
    const ctx = this.ctx
    const q = 0.35 + 0.15 * Math.sin(t * 3 + px)
    const g = ctx.createRadialGradient(px * T, py * T + T * 0.2, T * 0.1, px * T, py * T + T * 0.2, T * 0.75)
    g.addColorStop(0, `rgba(${rgb},${q * alfa})`)
    g.addColorStop(1, `rgba(${rgb},0)`)
    ctx.fillStyle = g
    ctx.beginPath(); ctx.arc(px * T, py * T + T * 0.2, T * 0.75, 0, 7); ctx.fill()
    if (colonna) this.colonna(px, py + 0.4, t, rgb, alfa * (0.55 + 0.2 * Math.sin(t * 2.5)), 0.42)
  }

  // una colonna di luce che sale da terra: il leggendario per terra, l'eroe che sale di livello
  colonna(px, suolo, t, rgb, alfa, largo = 0.5, alto = 5) {
    const ctx = this.ctx
    const x0 = px * T - largo * T, w = 2 * largo * T, y1 = suolo * T, y0 = y1 - alto * T
    const g = ctx.createLinearGradient(0, y0, 0, y1)
    g.addColorStop(0, `rgba(${rgb},0)`)
    g.addColorStop(0.7, `rgba(${rgb},${0.45 * alfa})`)
    g.addColorStop(1, `rgba(${rgb},${0.8 * alfa})`)
    ctx.save()
    ctx.fillStyle = g
    ctx.fillRect(x0, y0, w, y1 - y0)
    const h = ctx.createLinearGradient(x0, 0, x0 + w, 0)
    h.addColorStop(0, `rgba(255,255,255,0)`)
    h.addColorStop(0.5, `rgba(255,255,255,${0.5 * alfa})`)
    h.addColorStop(1, `rgba(255,255,255,0)`)
    ctx.globalCompositeOperation = 'lighter'
    ctx.fillStyle = h
    ctx.fillRect(x0 + w * 0.3, y0 + (y1 - y0) * 0.25, w * 0.4, (y1 - y0) * 0.75)
    ctx.restore()
  }

  // «+12 ✨»: sale di una casella in un secondo e sparisce; niente avviso a parole per un mostro qualunque
  numeriniCheSalgono(t) {
    this.numerini = this.numerini.filter(n => t - n.t < 1.1)
    const ctx = this.ctx
    for (const n of this.numerini) {
      const k = (t - n.t) / 1.1
      ctx.save()
      ctx.globalAlpha = 1 - k * k
      ctx.font = `bold ${T * 0.42}px "Emoji Gioco", system-ui, sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.lineWidth = 1.2
      ctx.strokeStyle = 'rgba(20,8,40,.9)'
      ctx.fillStyle = '#d9c6ff'
      const y = (n.y - 0.2 - k) * T
      ctx.strokeText(n.testo, n.x * T, y)
      ctx.fillText(n.testo, n.x * T, y)
      ctx.restore()
    }
  }

  // il livello salito: una colonna d'oro sull'eroe per un secondo e mezzo (Gioco.vue la chiede, `colonna`)
  colonneDiLuce(corsa, t) {
    this.colonne = this.colonne.filter(c => t - c.t < 1.6)
    for (const c of this.colonne) {
      const k = (t - c.t) / 1.6
      const x = c.segui ? corsa.eroe.x : c.x, y = c.segui ? corsa.eroe.y : c.y
      this.colonna(x, y + 0.45, t, c.colore, Math.sin(Math.PI * Math.min(1, k * 1.4)), 0.55 + 0.25 * k, 6)
    }
  }

  // respira piano: abbastanza da notarsi girando lo sguardo, non tanto da sembrare un allarme. Oro = "questo riguarda te"
  filo(nome, cx, cy, t, opz = {}) {
    const q = 0.62 + 0.28 * Math.sin(t * 2.4)   // sotto l'unità non si sale, o un contorno che arriva a 1 sembra un allarme
    this.foglio.alone(this.ctx, nome, (cx + 0.5) * T, (cy + 1) * T,
                      { ...opz, colore: '#ffd27a', alfa: q, raggio: 1 })
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

  // i galloni di un caporale (docs/sotterraneo/piani.md): due V d'oro sopra la testa e un anello d'oro ai piedi, disegnati
  // in codice. Niente emoji: il sotterraneo è un gioco serio
  galloni(px, py, alfa) {
    const ctx = this.ctx
    ctx.save()
    ctx.globalAlpha = alfa
    ctx.strokeStyle = 'rgba(240,194,74,.75)'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.ellipse(px * T, py * T + T * 0.38, T * 0.44, T * 0.14, 0, 0, 7); ctx.stroke()
    const x = px * T, y = (py - 0.5) * T - 2
    for (const dy of [0, 3]) {
      ctx.beginPath()
      ctx.moveTo(x - 4, y + dy - 2); ctx.lineTo(x, y + dy + 1); ctx.lineTo(x + 4, y + dy - 2)
      ctx.strokeStyle = '#3a2a0a'; ctx.lineWidth = 3.2; ctx.stroke()
      ctx.strokeStyle = '#f0c24a'; ctx.lineWidth = 1.6; ctx.stroke()
    }
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
      const cosa = COSE[k] || {}
      const m = cosa.sprite && this.foglio.misura(cosa.sprite)
      if (!m) return
      const { dx, base } = impugnatura(cosa, m.w, m.h, 'campo')
      this.foglio.posa(this.ctx, cosa.sprite, sx + verso * dx, sy + T * 0.5 - base + su, opz)
    }
    // due armi si portano una per lato (la debole va dietro, prima, o coprirebbe la buona); una a due mani
    // sta in mezzo, davanti al corpo (una copia sbiadita dall'altro lato farebbe sembrare due armi, non una tenuta in due);
    // un arco o una balestra stanno dove li tiene una mano (dati/impugna.js)
    if (corsa.mano && (COSE[corsa.mano] || {}).mani === 2) return posa(corsa.mano, lato, { specchia })
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
  // `mappaGrande` (la 🗺️ della barra): la stessa, al centro e grande quanto lo schermo lascia; il campo sotto si scurisce
  minimappa(corsa) {
    const liv = corsa.livello
    const ctx = this.ctx
    const grande = !!this.mappaGrande
    const p = grande
      ? Math.max(2, Math.min((this.L - 36) / liv.largo, (this.A - 96) / liv.alto))
      : Math.max(1.4, Math.min(2.6, 120 / Math.max(liv.largo, liv.alto)))
    const larg = liv.largo * p, alt = liv.alto * p
    const x0 = grande ? Math.round((this.L - larg) / 2) : this.L - larg - 10
    const y0 = grande ? Math.round((this.A - alt) / 2) : 12
    ctx.save()
    if (grande) {
      ctx.fillStyle = 'rgba(4,5,10,.6)'
      ctx.fillRect(0, 0, this.L, this.A)
    }
    ctx.fillStyle = 'rgba(6,8,14,.78)'
    ctx.fillRect(x0 - 4, y0 - 4, larg + 8, alt + 8)
    ctx.strokeStyle = 'rgba(255,255,255,.14)'
    ctx.lineWidth = 1
    ctx.strokeRect(x0 - 4.5, y0 - 4.5, larg + 9, alt + 9)
    ctx.fillStyle = 'rgba(180,170,150,.5)'
    for (let x = 0; x < liv.largo; x++) for (let y = 0; y < liv.alto; y++) {
      const v = liv.a(x, y)
      if (!corsa.visto[y * liv.largo + x] || v === ROCCIA) continue
      // un relitto è quasi roccia, l'acqua è azzurra: sulla mappina si vede dove non si passa
      ctx.fillStyle = v === RELITTO ? 'rgba(96,88,80,.55)' : v === ACQUA ? 'rgba(70,140,200,.6)' : 'rgba(180,170,150,.5)'
      ctx.fillRect(x0 + x * p, y0 + y * p, p, p)
    }
    for (const r of liv.robe) {
      // il custode della chiave si segna dov'è la sua casa, mai dov'è adesso (docs/sotterraneo/regole.md, «La luce»)
      const sx = r.che === 'mostro' && r.casa ? r.casa.x : r.x, sy = r.che === 'mostro' && r.casa ? r.casa.y : r.y
      if (r.presa || r.morto || !corsa.visto[sy * liv.largo + sx]) continue
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
      ctx.fillRect(x0 + sx * p - 1, y0 + sy * p - 1, p + 2, p + 2)
    }
    ctx.fillStyle = '#fff'
    ctx.fillRect(x0 + Math.floor(corsa.eroe.x) * p - 1, y0 + Math.floor(corsa.eroe.y) * p - 1,
                 p + 2, p + 2)
    ctx.restore()
  }
}
