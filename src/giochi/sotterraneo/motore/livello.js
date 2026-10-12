// Un piano del sotterraneo, generato tutto in una volta (contenuti compresi: entrare in una stanza accende
// la luce su cose già decise, non ne inventa). BSP classico: taglia il rettangolo, scava una stanza per
// ritaglio, unisce con corridoi a elle. Stesso seme, stesso piano (serve al banco di prova). `guasti()`
// cammina davvero dall'ingresso alla scala trattando le porte chiuse come attraversabili (si aprono
// rispondendo); `serveUnaPorta` dice comunque quanto costa arrivarci senza aprire nulla. Gira in Node.
import { ROCCIA, PAVIMENTO, PORTA } from '../dati/mondo.js'
import { ORPELLI } from '../dati/orpelli.js'
import { CURIOSITA } from '../dati/curiosita.js'
import { MOSTRI, BRANCO, PASSO_DEL_BRANCO, CAPORALE } from '../dati/mostri.js'
import { GROSSI } from '../dati/grossi.js'
import { raggiungibili } from '../../../motore/passi.js'
import { costruisci, pezziDa, celleDi, CELLE_SALA } from './forme.js'

export function seminato(seme) {
  let s = (seme >>> 0) || 1
  return () => {
    s ^= s << 13; s >>>= 0
    s ^= s >> 17
    s ^= s << 5; s >>>= 0
    return s / 4294967296
  }
}

// quanti mostri ci sono in un piano: tre quarti per stanza (la media di quando ogni stanza ne tirava da 0 a 2) meno un
// 10%, e di quelli la parte che finisce nelle sale grandi (docs/sotterraneo/piani.md)
const MOSTRI_PER_STANZA = 0.75 * 0.9
const PARTE_NELLE_SALE = 0.7
// quanti, al più, in un branco di una fascia (dalla più tenera): i ratti a cinque, i golem a due
const TETTO_DEL_BRANCO = [5, 4, 3, 2, 2]

export class Livello {
  // `guardiano`: chi porta la chiave della scala, dichiarato dalla tappa (l'unica cosa che non si può aggirare)
  constructor({ seme = 1, piano = 0, largo = 52, alto = 52, giri = 4,
                guardiano = 'scheletro', crescita = null, branco = BRANCO, grosso = null, scenario = null, caporali = true } = {}) {
    this.seme = seme
    this.piano = piano
    this.largo = largo
    this.alto = alto
    this.giri = giri
    this.chiGuarda = guardiano
    // il mostro grosso (dati/grossi.js) al posto del guardiano, nella stanza della scala: non tocca il caso del piano
    this.grosso = grosso && GROSSI[grosso] ? grosso : null
    // l'anticamera coi caporali: davanti al grosso delle discese della storia (l'abisso li lascia a chi la tappa non li chiede)
    this.coiCaporali = !!this.grosso && caporali
    this.branco = branco              // chi si incontra per strada, fascia per fascia
    // dichiarato da chi genera il piano (dipende da quanto può scendere la discesa, vedi crescitaDi in dati/campagna.js)
    this.crescita = crescita || { ossa: 0.22, attOgni: 2 }
    this.celle = new Uint8Array(largo * alto)
    this.nelle = new Int16Array(largo * alto).fill(-1)       // cella → id della stanza che la contiene (-1: nessuna, anche sotto una colonna)
    this.vicinanza = new Int16Array(largo * alto).fill(-1)   // cella → stanza di cui è dentro o sul bordo (stanzaDi)
    this.stanze = []
    this.robe = []                    // tutto ciò che sta su una cella e si tocca
    this.rnd = seminato(seme + piano * 7919)
    // l'arredo ha il suo caso e il suo scenario: cambiarli non sposta nient'altro del piano (docs/sotterraneo/arredo.md)
    this.rndArredo = seminato(seme * 17 + piano * 104729 + 99)
    this.orpelli = ORPELLI[scenario] || ORPELLI.cantine
    this.scava()
    this.arreda()
  }

  get stanzeMin() { return this.giri <= 2 ? 4 : 6 }

  a(x, y) {
    return (x < 0 || y < 0 || x >= this.largo || y >= this.alto)
      ? ROCCIA : this.celle[y * this.largo + x]
  }

  metti(x, y, v) {
    if (x >= 0 && y >= 0 && x < this.largo && y < this.alto) this.celle[y * this.largo + x] = v
  }

  calpestabile(x, y) { const c = this.a(x, y); return c === PAVIMENTO || c === PORTA }

  // si ferma quando il pezzo è piccolo abbastanza: sotto quella misura le stanze diventano stanzini
  scava() {
    const foglie = []
    const taglia = (r, giri) => {
      const inAltezza = r.h > 15, inLarghezza = r.w > 15
      if (giri <= 0 || (!inAltezza && !inLarghezza)) { foglie.push(r); return }
      const orizzontale = inAltezza && (!inLarghezza || this.rnd() < 0.5)
      if (orizzontale) {
        const t = Math.floor(r.h * (0.35 + this.rnd() * 0.3))
        taglia({ x: r.x, y: r.y, w: r.w, h: t }, giri - 1)
        taglia({ x: r.x, y: r.y + t, w: r.w, h: r.h - t }, giri - 1)
      } else {
        const t = Math.floor(r.w * (0.35 + this.rnd() * 0.3))
        taglia({ x: r.x, y: r.y, w: t, h: r.h }, giri - 1)
        taglia({ x: r.x + t, y: r.y, w: r.w - t, h: r.h }, giri - 1)
      }
    }
    taglia({ x: 1, y: 1, w: this.largo - 2, h: this.alto - 2 }, this.giri)

    const sale = this.scegliLeSale(foglie)
    foglie.forEach((f, i) => this.stanzaIn(f, i, sale.has(i)))

    // ogni stanza si collega alla più vicina fra quelle già collegate (albero di copertura), poi due o
    // tre scorciatoie in più: un sotterraneo ad albero costringerebbe sempre a tornare dalla stessa strada
    const dentro = [0], fuori = this.stanze.map((_, i) => i).slice(1)
    while (fuori.length) {
      let miglior = null
      for (const a of dentro) for (const b of fuori) {
        const d = Math.abs(this.stanze[a].cx - this.stanze[b].cx) +
                  Math.abs(this.stanze[a].cy - this.stanze[b].cy)
        if (!miglior || d < miglior.d) miglior = { a, b, d }
      }
      this.corridoio(this.stanze[miglior.a], this.stanze[miglior.b])
      dentro.push(miglior.b)
      fuori.splice(fuori.indexOf(miglior.b), 1)
    }
    for (let i = 0; i < 3; i++) {
      const a = this.stanze[Math.floor(this.rnd() * this.stanze.length)]
      const b = this.stanze[Math.floor(this.rnd() * this.stanze.length)]
      if (a && b && a !== b && !a.vicine.includes(b.id)) this.corridoio(a, b)
    }
    this.piazzaLeColonne()
    this.scavaPorte()
    this.segnaLeVicinanze()
  }

  // Quali foglie del BSP diventano una sala grande (docs/sotterraneo/piani.md): una ogni quattro stanze del piano, almeno
  // una, scelte a caso fra quelle dove ci sta (mai l'ingresso). Se non ci sta una sala vera, la foglia più larga ne
  // ospita una piccola: un piano senza una stanza dove nascondersi non c'è.
  scegliLeSale(foglie) {
    const posto = f => (f.w - 2) * (f.h - 2)
    const idonee = foglie.map((f, i) => i).filter(i => i > 0 && foglie[i].w >= 13 && foglie[i].h >= 10 && posto(foglie[i]) >= 99)
    const quante = Math.max(1, Math.round(foglie.length / 4))
    const scelte = new Set()
    while (idonee.length && scelte.size < quante) {
      scelte.add(idonee.splice(Math.floor(this.rnd() * idonee.length), 1)[0])
    }
    if (!scelte.size) {
      const migliore = foglie.map((f, i) => i).filter(i => i > 0 && foglie[i].w >= 12 && foglie[i].h >= 10)
        .sort((a, b) => posto(foglie[b]) - posto(foglie[a]))[0]
      if (migliore != null) scelte.add(migliore)
    }
    return scelte
  }

  // La stanza di una foglia: rettangolo, L, T, croce, due rettangoli uniti o caverna (la prima foglia, l'ingresso, è sempre
  // un rettangolo); la sala occupa quasi tutta la foglia. `maschera` dice dove si cammina: nel riquadro `x,y,w,h`
  // ci possono essere angoli di roccia, e una stanza è fatta dei suoi `pezzi` (docs/sotterraneo/piani.md)
  stanzaIn(f, i, sala) {
    const maxW = f.w - 3, maxH = f.h - 3
    let forma = 'rettangolo', fatta = null
    if (sala) {
      forma = 'sala'
      fatta = costruisci('sala', f.w - 2, f.h - 2, this.rnd)
    } else if (i > 0) {
      const t = this.rnd()
      const scelta = t < 0.38 ? 'rettangolo' : t < 0.58 ? 'elle' : t < 0.70 ? 'tu' : t < 0.80 ? 'croce'
        : t < 0.90 ? 'doppia' : 'caverna'
      fatta = scelta === 'rettangolo' ? costruisci(scelta, maxW, maxH, this.rnd) : costruisci(scelta, maxW + 1, maxH + 1, this.rnd)   // le forme prendono un po' più posto
      if (fatta) forma = scelta
    }
    if (!fatta) { forma = 'rettangolo'; fatta = costruisci('rettangolo', maxW, maxH, this.rnd) }
    const { w, h, m } = fatta
    const x = f.x + 1 + Math.floor(this.rnd() * Math.max(1, f.w - w - 1))
    const y = f.y + 1 + Math.floor(this.rnd() * Math.max(1, f.h - h - 1))
    const st = { x, y, w, h, id: this.stanze.length, vicine: [], porte: [], ruolo: null, forma,
                 pezzi: pezziDa(m, w, h, x, y), suolo: [], interno: [], colonne: [] }
    this.stanze.push(st)
    for (let j = 0; j < h; j++) for (let i2 = 0; i2 < w; i2++) {
      if (!m[j * w + i2]) continue
      this.metti(x + i2, y + j, PAVIMENTO)
      this.nelle[(y + j) * this.largo + x + i2] = st.id
    }
    // il centro è una cella della stanza con la roccia lontana (le scale, i forzieri e i corridoi partono da lì)
    const viva = (cx, cy) => cx >= 0 && cy >= 0 && cx < w && cy < h && m[cy * w + cx]
    let centro = null, quanto = Infinity
    for (let j = 0; j < h; j++) for (let i2 = 0; i2 < w; i2++) {
      if (!m[j * w + i2]) continue
      const aperta = viva(i2 - 1, j) && viva(i2 + 1, j) && viva(i2, j - 1) && viva(i2, j + 1)
      const d = Math.hypot(i2 - (w >> 1), j - (h >> 1)) + (aperta ? 0 : 100)
      if (d < quanto) { quanto = d; centro = [i2, j] }
    }
    st.cx = x + centro[0]; st.cy = y + centro[1]
    st.grande = celleDi(m) >= CELLE_SALA   // le sale e le forme più larghe: qui i mostri vanno a branchi
    return st
  }

  // le colonne: nelle sale e nelle caverne, celle di roccia sole o a coppie, mai attaccate al muro né fra loro (sempre due
  // celle libere in mezzo): si gira attorno e ci si nasconde dietro, ma non si chiude mai una strada. Si piazzano dopo i
  // corridoi, che non le attraversano (ci passerebbero sopra).
  piazzaLeColonne() {
    for (const s of this.stanze) {
      if (s.forma !== 'sala' && s.forma !== 'caverna') continue
      const L = this.largo
      const mia = (x, y) => x >= 0 && y >= 0 && x < L && y < this.alto && this.nelle[y * L + x] === s.id &&
        this.a(x, y) === PAVIMENTO
      const colonne = []
      const libero = (cx, cy, gruppo) => {
        // intorno al gruppo (un cerchio di una cella) tutto stanza e niente colonne: la colonna non tocca il muro
        for (let y = cy - 1; y <= cy + gruppo.h; y++) for (let x = cx - 1; x <= cx + gruppo.w; x++)
          if (!mia(x, y) && !(x >= cx && x < cx + gruppo.w && y >= cy && y < cy + gruppo.h)) return false
        // e dalle altre colonne e dal centro ce n'è almeno due, o si fa un muro
        for (const c of [...colonne, { x: s.cx, y: s.cy, w: 1, h: 1 }]) {
          const dx = Math.max(c.x - (cx + gruppo.w - 1), cx - (c.x + c.w - 1)) - 1
          const dy = Math.max(c.y - (cy + gruppo.h - 1), cy - (c.y + c.h - 1)) - 1
          if (Math.max(dx, dy) < 2) return false
        }
        return true
      }
      const prove = Math.round((s.w * s.h) / 6) + 6
      const cella = () => {
        const j = Math.floor(this.rnd() * s.h), i = Math.floor(this.rnd() * s.w)
        return [s.x + i, s.y + j]
      }
      const quante = s.forma === 'sala' ? Infinity : 1 + Math.floor(this.rnd() * 3)
      for (let p = 0; p < prove * 3 && colonne.length < quante; p++) {
        const [cx, cy] = cella()
        const t = this.rnd()
        const gruppo = t < 0.55 ? { w: 1, h: 1 } : t < 0.78 ? { w: 2, h: 1 } : { w: 1, h: 2 }
        if (!libero(cx, cy, gruppo)) continue
        colonne.push({ x: cx, y: cy, w: gruppo.w, h: gruppo.h })
      }
      for (const c of colonne) for (let j = 0; j < c.h; j++) for (let i = 0; i < c.w; i++) {
        this.metti(c.x + i, c.y + j, ROCCIA)
        this.nelle[(c.y + j) * L + c.x + i] = -1
        s.colonne.push({ x: c.x + i, y: c.y + j })
      }
    }
  }

  // da che stanza è una cella, anche se è l'uscio: la stanza più il giro di celle attorno. Sceglie la stanza di cui
  // si è dentro, poi quella col numero più basso (come quando una stanza era un rettangolo)
  segnaLeVicinanze() {
    const L = this.largo
    for (const s of this.stanze) s.suolo = []
    for (let k = 0; k < this.nelle.length; k++) {
      const id = this.nelle[k]
      if (id < 0) continue
      this.vicinanza[k] = id
      this.stanze[id].suolo.push({ x: k % L, y: (k / L) | 0 })
    }
    // prima le celle che toccano la stanza di lato (l'uscio è sempre della stanza che tocca), poi quelle in diagonale
    for (const diagonali of [false, true]) for (const s of this.stanze) {
      for (const { x, y } of s.suolo) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if ((dx !== 0 && dy !== 0) !== diagonali || (!dx && !dy)) continue
        const a = x + dx, b = y + dy
        if (a < 0 || b < 0 || a >= L || b >= this.alto) continue
        if (this.vicinanza[b * L + a] < 0) this.vicinanza[b * L + a] = s.id
      }
    }
    for (const s of this.stanze) {
      // le celle con tutte e quattro le vicine nella stanza: lontane dai muri
      s.interno = s.suolo.filter(c => [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dy]) => this.dentro(s, c.x + dx, c.y + dy)))
    }
  }

  corridoio(a, b) {
    const prima = this.rnd() < 0.5
    const x0 = a.cx, y0 = a.cy, x1 = b.cx, y1 = b.cy
    const passo = (x, y) => { if (this.a(x, y) === ROCCIA) this.metti(x, y, PAVIMENTO) }
    if (prima) {
      for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) passo(x, y0)
      for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) passo(x1, y)
    } else {
      for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) passo(x0, y)
      for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) passo(x, y1)
    }
    a.vicine.push(b.id); b.vicine.push(a.id)
  }

  // dove un corridoio tocca il bordo di una stanza; mai gli angoli, che si attraverserebbero in diagonale
  scavaPorte() {
    const L = this.largo
    for (const st of this.stanze) {
      // le celle di corridoio che toccano la stanza di lato (non in diagonale: si attraverserebbe in diagonale)
      const viste = new Set()
      for (const pz of st.pezzi) for (let i = -1; i <= pz.w; i++) for (let j = -1; j <= pz.h; j++) {
        if ((i === -1 || i === pz.w) === (j === -1 || j === pz.h)) continue   // dentro il pezzo, o un angolo
        const x = pz.x + i, y = pz.y + j
        if (x < 0 || y < 0 || x >= L || y >= this.alto || viste.has(y * L + x)) continue
        viste.add(y * L + x)
        if (this.a(x, y) !== PAVIMENTO || this.nelle[y * L + x] >= 0) continue
        this.metti(x, y, PORTA)
        st.porte.push({ x, y })
      }
    }
  }

  // ruoli delle stanze prima, poi si riempie: se l'uscita si scegliesse dopo la roba, capiterebbe accanto all'ingresso
  arreda() {
    const st = this.stanze
    const ingresso = st[0]
    ingresso.ruolo = 'ingresso'

    // la più lontana in linea d'aria: si vuole che il piano si attraversi, non che si sfiori
    let uscita = st[1] || st[0], quanto = -1
    for (const s of st) {
      if (s === ingresso) continue
      const d = Math.hypot(s.cx - ingresso.cx, s.cy - ingresso.cy)
      if (d > quanto) { quanto = d; uscita = s }
    }
    uscita.ruolo = 'uscita'
    this.robe.push({ che: 'scala', x: uscita.cx, y: uscita.cy, em: '🕳️',
                     nome: 'La scala che scende' })

    // dove sta il mostro grosso, la stanza subito prima sulla strada è l'anticamera, coi caporali (si sceglie prima del
    // premio, che altrimenti la prenderebbe: docs/sotterraneo/piani.md)
    const anticamera = this.coiCaporali ? this.anticameraDi(ingresso, uscita) : null
    if (anticamera) anticamera.ruolo = 'anticamera'

    // il premio (portale, fonte, forzieri) si pesca fra le foglie (un solo collegamento): una stanza di
    // mezzo è un pezzo di strada, e sbarrarla metterebbe un pedaggio sulla via della scala (chiudiPorte)
    const foglia = s => s.vicine.length <= 1
    const libere = st.filter(s => !s.ruolo)
    const pesca = () => {
      if (!libere.length) return null
      const fra = libere.some(foglia) ? libere.filter(foglia) : libere
      const scelta = fra[Math.floor(this.rnd() * fra.length)]
      libere.splice(libere.indexOf(scelta), 1)
      return scelta
    }

    // il portale nella stanza che era del mercante (salito sopra): si torna al villaggio e si ritrova il piano
    // com'era (docs/sotterraneo/regole.md). Stessa pesca e nessun tiro in più: il piano nasce identico. Senza
    // porta: è la strada di casa, non un premio da pagare
    const portale = pesca()
    if (portale) {
      portale.ruolo = 'portale'
      this.robe.push({ che: 'portale', x: portale.cx, y: portale.cy, em: '🌀', nome: 'Un portale' })
    }
    const fonte = pesca()
    if (fonte) {
      fonte.ruolo = 'fonte'
      this.robe.push({ che: 'fonte', x: fonte.cx, y: fonte.cy, em: '⛲', nome: 'Una fonte' })
    }
    // due o tre stanze del tesoro
    for (let i = 0; i < 2 + (this.rnd() < 0.5 ? 1 : 0); i++) {
      const s = pesca(); if (!s) break
      s.ruolo = 'tesoro'
      this.robe.push({ che: 'forziere', x: s.cx, y: s.cy, em: '🎁', nome: 'Un forziere',
                       pelle: this.pelleDelForziere(),   // l'oro è raro e si riconosce da lontano
                       aperto: false })
    }

    // più giù, più grossi; nelle stanze del tesoro c'è la guardia (il patto dietro il segno 💀 sopra la porta)
    const scala = Math.min(1, this.piano / 5)
    // un tiro solo: le cifre alte dicono la fascia, quelle basse la faccia. Un secondo rnd() sposterebbe
    // il flusso del caso e farebbe nascere un piano diverso da quello di ieri stesso seme
    // un branco è della stessa fascia: la prima faccia sta nel tiro della fascia, le altre un tiro l'una
    // `tetto`: un branco più giù è più piccolo (TETTO_DEL_BRANCO), o il costo in domande di un incontro crescerebbe scendendo
    const tipiPer = (forza, quanti, tetto = false) => {
      const r = this.rnd()
      const i = Math.max(0, Math.min(this.branco.length - 1,
        Math.floor((forza + scala) * PASSO_DEL_BRANCO + r * 1.4)))
      const fascia = this.branco[i]
      if (tetto) quanti = Math.min(quanti, TETTO_DEL_BRANCO[Math.min(i, TETTO_DEL_BRANCO.length - 1)])
      const tipi = [fascia[Math.floor(r * 1e6) % fascia.length]]
      while (tipi.length < quanti) tipi.push(fascia[Math.floor(this.rnd() * fascia.length)])
      return tipi
    }
    this.popolaIlPiano(tipiPer)

    // la scala è chiusa e la chiave ce l'ha qualcuno: senza, i mostri si aggirano tutti e il gioco diventa
    // una passeggiata al buio. Il guardiano sta accanto alla scala.
    const guardiano = this.grosso ? this.mostroGrosso(this.grosso, uscita.cx, uscita.cy - 1)
      : this.mostro(this.chiGuarda, uscita.cx, uscita.cy - 1)
    if (!this.calpestabile(guardiano.x, guardiano.y)) {
      guardiano.x = uscita.cx; guardiano.y = uscita.cy + 1
    }
    // il mostro grosso prova anche ai lati: deve stare nella sua stanza, accanto alla scala
    if (this.grosso) for (const [dx, dy] of [[-1, 0], [1, 0]]) {
      if (this.calpestabile(guardiano.x, guardiano.y) && !this.robeSu(guardiano.x, guardiano.y).length) break
      guardiano.x = uscita.cx + dx; guardiano.y = uscita.cy + dy
    }
    if (this.calpestabile(guardiano.x, guardiano.y) && !this.robeSu(guardiano.x, guardiano.y).length) {
      guardiano.chiave = true
      this.robe.push(guardiano)
    } else {
      // nessun posto buono accanto alla scala: la chiave la porta il mostro più lontano dall'ingresso (e, se il piano
      // ha un mostro grosso, diventa lui: dove stava quello)
      const lontano = this.robe.filter(r => r.che === 'mostro')
        .sort((a, b) => Math.hypot(b.x - ingresso.cx, b.y - ingresso.cy) -
                        Math.hypot(a.x - ingresso.cx, a.y - ingresso.cy))[0]
      if (lontano && this.grosso) Object.assign(lontano, this.mostroGrosso(this.grosso, lontano.x, lontano.y))
      if (lontano) lontano.chiave = true
    }

    // gemme sparse: fanno valere la pena scostarsi dalla strada anche quando in una stanza non c'è altro
    for (const s of st) {
      if (this.rnd() > 0.55) continue
      const { x, y } = this.cellaDellaStanza(s)
      if (!this.robeSu(x, y).length)
        this.robe.push({ che: 'gemme', x, y, em: '💎', quante: 2 + Math.floor(this.rnd() * 5) })
    }

    this.spargiLeCuriosita(st)
    this.arredaLeStanze()
    this.chiudiPorte()
  }

  // un tiro solo, non due annidati: ogni numero pescato sposta tutta la generazione a valle
  pelleDelForziere() {
    const t = this.rnd()
    return t < 0.2 ? 'forziere-oro-chiuso'
      : t < 0.45 ? 'forziere-scuro-chiuso' : 'forziere-chiuso'
  }

  // mai nella stanza d'ingresso; una o due per piano a ogni misura (12/10/2026, vedi docs/sotterraneo/roba.md):
  // un tiro solo per il numero, che ogni tiro in più o in meno sposta il piano a valle
  spargiLeCuriosita(st) {
    const buone = st.filter(s => s.ruolo !== 'ingresso')
    const quante = 1 + (this.rnd() < 0.5 ? 1 : 0)
    for (let n = 0; n < quante; n++) {
      const s = buone[Math.floor(this.rnd() * buone.length)]
      if (!s) return
      for (let giro = 0; giro < 12; giro++) {
        const { x, y } = this.cellaDellaStanza(s)
        if (!this.calpestabile(x, y) || this.robeSu(x, y).length) continue
        if (this.porteVicine(x, y)) continue
        const c = CURIOSITA[Math.floor(this.rnd() * CURIOSITA.length)]
        this.robe.push({ che: 'curiosita', tipo: c.tipo, x, y, em: c.em,
                         nome: c.nome, pezzo: c.pezzo })
        break
      }
    }
  }

  // quanto è epica una stanza, da 0 a 10: un'entrata è niente, una stanza del tesoro e la sua guardia qualcosa, la
  // stanza della scala di più, e dove sta un mostro grosso è la sala del trono. Più si scende, più sale un poco.
  epicaDellaStanza(s) {
    const dentro = this.robe.filter(r => r.che === 'mostro' && this.dentroStanza(r, s))
    const base = { ingresso: 0, uscita: 4, portale: 2, fonte: 3, tesoro: 3, anticamera: 3 }[s.ruolo] ?? 1
    const guardia = s.ruolo === 'tesoro' && dentro.length ? 1 : 0
    const grosso = dentro.some(r => r.grosso) ? 5 : 0
    return Math.min(10, base + guardia + grosso + Math.min(2, Math.floor(this.piano / 4)))
  }

  // gli orpelli (dati/orpelli.js): più la stanza è epica, più ne ha e più sono epici; ognuno sa come si piazza.
  // Mai davanti a una porta né sopra altra roba, e uno solo acceso per stanza
  arredaLeStanze() {
    const rnd = this.rndArredo
    for (const s of this.stanze) {
      s.epica = this.epicaDellaStanza(s)
      let quanti = 1 + Math.floor(s.epica / 3) + Math.floor(rnd() * 3)
      let acceso = false
      const usati = new Set(), provati = new Set()   // messi, e già tentati senza trovare posto
      let forte = s.epica >= 5   // il pezzo forte della stanza epica va messo per primo
      for (let giro = 0; quanti > 0 && giro < 40; giro++) {
        const adatti = this.orpelli.filter(o => o.epica <= s.epica + (o.epica <= 1 ? 1 : 0) &&
          (!forte || o.epica >= s.epica - 3) && !usati.has(o.pezzo) && !provati.has(o.pezzo) && !(o.arde && acceso))
        if (!adatti.length) { if (forte) { forte = false; continue } break }
        const peso = o => 1 + o.epica
        let tiro = rnd() * adatti.reduce((n, o) => n + peso(o), 0)
        const o = adatti.find(q => (tiro -= peso(q)) < 0) || adatti[adatti.length - 1]
        const celle = this.cellePer(o, s, rnd)
        if (!celle) { provati.add(o.pezzo); continue }
        usati.add(o.pezzo)
        forte = false
        if (o.arde) acceso = true
        for (const [x, y] of celle)
          this.robe.push({ che: 'arredo', x, y, em: o.arde ? '🔥' : o.posa === 'appeso' ? '🎌' : '📦',
                           pezzo: o.pezzo, arde: !!o.arde, epica: o.epica })
        quanti -= celle.length
      }
    }
  }

  // le celle dove sta un orpello di questa stanza, o null se la posa non trova posto (si pesca un altro). La stanza non è
  // più un rettangolo: «contro la parete» vuol dire una cella della stanza con la roccia accanto (anche una colonna)
  cellePer(o, s, rnd) {
    const libera = (x, y) => this.dentro(s, x, y) && this.calpestabile(x, y) && !this.robeSu(x, y).length && !this.porteVicine(x, y)
    const roccia = (x, y) => this.a(x, y) === ROCCIA
    const pesca = quali => { const l = quali.filter(c => libera(c.x, c.y)); return l.length ? l[Math.floor(rnd() * l.length)] : null }
    if (o.posa === 'coppia') {
      // ai lati della parete di fondo: la fila in alto della stanza, due celle in dentro dai capi
      const fila = s.suolo.filter(c => c.y === s.y).map(c => c.x)
      const a = [Math.min(...fila) + 1, s.y], b = [Math.max(...fila) - 1, s.y]
      return b[0] - a[0] >= 2 && libera(...a) && libera(...b) ? [a, b] : null
    }
    if (o.posa === 'fondo') {
      const colonna = s.suolo.filter(c => c.x === s.cx)
      const cima = colonna.reduce((m, c) => Math.min(m, c.y), Infinity)
      return roccia(s.cx, cima - 1) && libera(s.cx, cima) ? [[s.cx, cima]] : null
    }
    const c = pesca(o.posa === 'appeso' ? s.suolo.filter(c => roccia(c.x, c.y - 1))
      : o.posa === 'angolo' ? s.suolo.filter(c => (roccia(c.x - 1, c.y) || roccia(c.x + 1, c.y)) && (roccia(c.x, c.y - 1) || roccia(c.x, c.y + 1)))
      : s.suolo.filter(c => roccia(c.x - 1, c.y) || roccia(c.x + 1, c.y) || roccia(c.x, c.y - 1) || roccia(c.x, c.y + 1)))
    return c ? [[c.x, c.y]] : null
  }

  // l'arredo si tiene a distanza da una porta, o si rischia di chiuderla con una cassa
  porteVicine(x, y) {
    return this.stanze.some(s => s.porte.some(p =>
      Math.abs(p.x - x) <= 1 && Math.abs(p.y - y) <= 1))
  }

  // la cella è libera per un mostro: dentro la stanza, vuota, e non davanti a una porta (un mostro che dorme è un
  // ostacolo, e uno davanti a un uscio lo chiuderebbe)
  liberaPerUnMostro(s, x, y) {
    return this.dentro(s, x, y) && this.calpestabile(x, y) && !this.robeSu(x, y).length && !this.porteVicine(x, y)
  }

  // Chi sta nel piano (docs/sotterraneo/piani.md). Il numero di mostri è quello di sempre (tre quarti di mostro per stanza,
  // meno i caporali, che sono mostri anche loro: le domande di una discesa non crescono), ma raggruppato: le sale grandi
  // hanno un branco da due a cinque, tutti vicini fra loro; qualche mostro sta solo, appostato in un angolo o dietro una
  // colonna; poche stanze piccole ne hanno uno o due; le altre sono vuote. La stanza del tesoro ha la sua guardia.
  // `tipiPer(forza, quanti)` dà i tipi di una stessa fascia
  popolaIlPiano(tipiPer) {
    const vive = this.stanze.filter(s => !['ingresso', 'anticamera', 'tesoro'].includes(s.ruolo) && !(this.grosso && s.ruolo === 'uscita'))
    const caporali = this.stanze.find(s => s.ruolo === 'anticamera')
    const mescola = lista => { const l = [...lista]; for (let i = l.length - 1; i > 0; i--) { const j = Math.floor(this.rnd() * (i + 1)); [l[i], l[j]] = [l[j], l[i]] } return l }
    if (caporali) this.mettiICaporali(caporali, tipiPer)
    for (const s of this.stanze.filter(r => r.ruolo === 'tesoro')) this.mettiIlBranco(s, tipiPer(0.6, 1))

    let resto = Math.max(0, Math.round(MOSTRI_PER_STANZA * vive.length) - (caporali ? 2 * this.quantiCaporali(caporali) : 0))
    const grandi = mescola(vive.filter(s => s.grande))
    const dato = n => { n = Math.min(n, resto); resto -= n; return n }
    grandi.forEach((s, i) => {
      // la parte dei mostri che va nelle sale, divisa fra le sale che restano; due almeno, o non è un branco
      const n = Math.max(2, Math.min(5, Math.round(resto * PARTE_NELLE_SALE / (grandi.length - i)) + (this.rnd() < 0.3 ? 1 : 0)))
      const tipi = tipiPer(0.15, n, true)
      resto = Math.max(0, resto - tipi.length)
      this.mettiIlBranco(s, tipi)
    })
    for (const s of grandi) if (resto > 0 && this.rnd() < 0.6 && this.mettiUnAppostato(s, tipiPer(0.15, 1)[0])) resto--
    for (const s of mescola(vive.filter(r => !r.grande))) {
      if (resto <= 0) break
      const n = dato(resto >= 2 && this.rnd() < 0.35 ? 2 : 1)
      if (n === 1 && this.rnd() < 0.5) { if (!this.mettiUnAppostato(s, tipiPer(0.15, 1)[0])) this.mettiIlBranco(s, tipiPer(0.15, 1)) }
      else this.mettiIlBranco(s, tipiPer(0.15, n))
    }
  }

  // un branco: tutti entro due celle da un'ancora (uno scontro prende chi sta a 4,5 celle: il gruppo ci sta sempre dentro)
  mettiIlBranco(s, tipi, ancora = null) {
    let a = ancora && this.liberaPerUnMostro(s, ancora.x, ancora.y) ? ancora : null
    for (let prova = 0; !a && prova < 12; prova++) {
      const c = this.cellaDellaStanza(s, this.rnd, true)
      if (this.liberaPerUnMostro(s, c.x, c.y)) a = c
    }
    if (!a) return []
    const vicine = s.suolo.filter(c => Math.hypot(c.x - a.x, c.y - a.y) <= 2 && this.liberaPerUnMostro(s, c.x, c.y))
      .map(c => ({ c, d: Math.hypot(c.x - a.x, c.y - a.y) + this.rnd() * 0.8 }))   // l'ancora è sempre la prima
      .sort((p, q) => p.d - q.d).map(o => o.c)
    this.branchi = (this.branchi || 0) + 1
    const messi = []
    for (let i = 0; i < tipi.length && i < vicine.length; i++) {
      const m = this.mostro(tipi[i], vicine[i].x, vicine[i].y)
      m.branco = this.branchi
      this.robe.push(m); messi.push(m)
    }
    return messi
  }

  // un mostro solo, nascosto: in un angolo (roccia da due lati) o dietro una colonna, dalla parte lontana dalle porte;
  // lontano da ogni altro mostro, o non sarebbe «solo». È lui che fa gli agguati
  mettiUnAppostato(s, tipo) {
    const roccia = (x, y) => this.a(x, y) === ROCCIA
    const solo = c => this.liberaPerUnMostro(s, c.x, c.y) &&
      !this.robe.some(r => r.che === 'mostro' && Math.hypot(r.x - c.x, r.y - c.y) < 4)
    const angoli = s.suolo.filter(c => (roccia(c.x - 1, c.y) || roccia(c.x + 1, c.y)) &&
      (roccia(c.x, c.y - 1) || roccia(c.x, c.y + 1)) && solo(c))
    const dallePorte = c => s.porte.reduce((m, p) => Math.min(m, Math.hypot(p.x - c.x, p.y - c.y)), Infinity)
    const dietro = s.colonne.flatMap(col => [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => ({ x: col.x + dx, y: col.y + dy, da: col })))
      .filter(c => solo(c) && dallePorte(c) > dallePorte(c.da))
    const dietroOk = dietro.length && (!angoli.length || this.rnd() < 0.5)
    const quali = dietroOk ? dietro : angoli
    if (!quali.length) return null
    const c = quali[Math.floor(this.rnd() * quali.length)]
    const m = this.mostro(tipo, c.x, c.y)
    m.appostato = dietroOk ? 'colonna' : 'angolo'
    this.robe.push(m)
    return m
  }

  // l'anticamera del mostro grosso: la stanza subito prima, sulla strada più corta dall'ingresso alla scala (non
  // l'ingresso stesso: ci si troverebbero i caporali addosso appena arrivati). Se la strada va dritta dall'ingresso
  // alla stanza della scala, la stanza più lontana dall'ingresso fra le sue vicine
  anticameraDi(ingresso, uscita) {
    const L = this.largo, k = (x, y) => y * L + x
    const prima = new Map([[k(ingresso.cx, ingresso.cy), null]]), coda = [{ x: ingresso.cx, y: ingresso.cy }]
    for (let i = 0; i < coda.length && !prima.has(k(uscita.cx, uscita.cy)); i++) {
      const q = coda[i]
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const x = q.x + dx, y = q.y + dy
        if (prima.has(k(x, y)) || !this.calpestabile(x, y)) continue
        prima.set(k(x, y), q); coda.push({ x, y })
      }
    }
    for (let q = prima.get(k(uscita.cx, uscita.cy)); q; q = prima.get(k(q.x, q.y))) {
      const id = this.nelle[k(q.x, q.y)]
      if (id < 0 || id === uscita.id) continue
      if (id !== ingresso.id) return this.stanze[id]
      break
    }
    return uscita.vicine.map(i => this.stanze[i]).filter(s => s !== ingresso && s !== uscita)
      .sort((p, q) => Math.hypot(q.cx - ingresso.cx, q.cy - ingresso.cy) - Math.hypot(p.cx - ingresso.cx, p.cy - ingresso.cy))[0] || null
  }

  // due o tre caporali (tre se l'anticamera è una sala) nel mezzo della stanza: la specie di strada, più duri
  // (`CAPORALE` in dati/mostri.js), e si riconoscono dal segno che portano (galloni, scena/tela.js)
  quantiCaporali(s) { return s.grande && this.stanze.length >= 8 ? 3 : 2 }
  mettiICaporali(s, tipiPer) {
    const messi = this.mettiIlBranco(s, tipiPer(0.15, this.quantiCaporali(s)), { x: s.cx, y: s.cy })
    for (const m of messi) {
      m.ossa = m.ossaMax = Math.round(m.ossa * CAPORALE.ossa)
      m.att += CAPORALE.att
      m.nome = `${m.nome} caporale`
      m.caporale = true
    }
  }

  // le ossa crescono col piano, l'attacco le segue più piano; la difesa non cresce mai (la manopola velenosa)
  mostro(tipo, x, y) {
    const m = MOSTRI[tipo]
    const su = (1 + this.piano * this.crescita.ossa) * (this.crescita.forza || 1)
    const ossa = Math.round(m.ossa * su)
    return { che: 'mostro', tipo, x, y, em: m.em, nome: m.nome,
             ossa, ossaMax: ossa,
             att: m.att + Math.floor(this.piano / this.crescita.attOgni) + (this.crescita.spinta || 0), dif: m.dif,
             chiave: false, morto: false }
  }

  // il mostro grosso: il mostro del bestiario su cui si regge, con più ossa e un colpo in più, il suo nome e la sua figura
  mostroGrosso(id, x, y) {
    const G = GROSSI[id]
    const m = this.mostro(G.tipo, x, y)
    m.ossa = m.ossaMax = Math.round(m.ossa * G.ossa)
    m.att += G.att
    m.grosso = id
    m.nome = G.nome
    return m
  }

  // solo le porte che danno su qualcosa che vale: una porta chiusa su una stanza vuota è una bugia. Si
  // chiude la STANZA (tutte le sue porte, stesso `gruppo`): rispondere ne apre una e con lei tutte le
  // altre (Corsa.rispostaPorta), o il segno 💀 prometterebbe una guardia scavalcabile dall'altra parte
  chiudiPorte() {
    const messe = new Map()
    for (const s of this.stanze) {
      if (!s.ruolo || s.ruolo === 'ingresso' || !s.porte.length) continue
      const segno = s.ruolo === 'tesoro'
        ? (this.robe.some(r => r.che === 'mostro' && this.dentroStanza(r, s)) ? 'guardia' : 'tesoro')
        : s.ruolo === 'fonte' ? 'fonte' : null
      if (!segno) continue
      // non si sbarra mai la strada: se chiudendola alla scala non si arriva più, resta aperta e senza segno
      if (this.taglierebbeLaStrada(s, messe)) continue
      // le celle contigue di uno stesso varco contano come una cosa sola: al centro la porta, il resto si
      // mura (mai una porta per cella: sembrerebbe una prigione)
      const varchi = this.varchiDi(s.porte)
      const stretti = varchi.map(v => {
        const mezzo = v[Math.floor(v.length / 2)]
        return { mezzo, troppe: v.filter(p => p !== mezzo) }
      })
      // o tutti o nessuno: un varco murato e un altro spalancato si aggirerebbe dall'altra parte
      if (!stretti.every(v => this.stringiIlVarco(v.troppe, v.mezzo))) continue
      for (const { mezzo } of stretti) {
        const k = mezzo.x + ',' + mezzo.y
        if (messe.has(k)) continue
        const porta = { che: 'porta', x: mezzo.x, y: mezzo.y, em: '🚪',
                        nome: 'Una porta chiusa', segno, aperta: false, gruppo: s.id }
        messe.set(k, porta)
        this.robe.push(porta)
      }
    }
  }

  // le celle di porta contigue, raggruppate: un varco largo quattro è una lista di quattro
  varchiDi(porte) {
    const restano = porte.map(p => ({ x: p.x, y: p.y }))
    const gruppi = []
    while (restano.length) {
      const gruppo = [restano.pop()]
      for (let i = 0; i < gruppo.length; i++) {
        for (let j = restano.length - 1; j >= 0; j--) {
          const d = Math.abs(restano[j].x - gruppo[i].x) + Math.abs(restano[j].y - gruppo[i].y)
          if (d === 1) gruppo.push(restano.splice(j, 1)[0])
        }
      }
      gruppi.push(gruppo)
    }
    return gruppi
  }

  // mura le celle in eccesso di un varco, e si tira indietro se così isola qualcosa (si prova prima)
  stringiIlVarco(troppe, mezzo) {
    if (!troppe.length) return true
    const prima = troppe.map(p => this.a(p.x, p.y))
    for (const p of troppe) this.metti(p.x, p.y, ROCCIA)
    const partenza = this.stanze[0]
    const visti = raggiungibili((x, y) => this.calpestabile(x, y),
                                { x: partenza.cx, y: partenza.cy })
    const tutto = this.robe.every(r => visti.has(r.x + ',' + r.y)) &&
                  visti.has(mezzo.x + ',' + mezzo.y)
    if (tutto) return true
    troppe.forEach((p, i) => this.metti(p.x, p.y, prima[i]))
    return false
  }

  // si arriva ancora alla scala chiudendo anche i varchi di questa stanza? si cammina davvero
  taglierebbeLaStrada(s, gia) {
    const scala = this.robe.find(r => r.che === 'scala')
    const partenza = this.stanze[0]
    if (!scala || !partenza) return false
    const mura = new Set([...gia.keys(), ...s.porte.map(p => p.x + ',' + p.y)])
    const visti = raggiungibili(
      (x, y) => this.calpestabile(x, y) && !mura.has(x + ',' + y),
      { x: partenza.cx, y: partenza.cy })
    return !visti.has(scala.x + ',' + scala.y)
  }

  // la cella (x, y) è dentro la stanza `s`? una stanza non è più un rettangolo (L, croce, caverna, colonne): si guarda
  // la mappa delle celle, mai il riquadro `x, y, w, h`
  dentro(s, x, y) {
    return x >= 0 && y >= 0 && x < this.largo && y < this.alto && this.nelle[y * this.largo + x] === s.id
  }
  dentroStanza(r, s) { return this.dentro(s, r.x, r.y) }
  robeSu(x, y) { return this.robe.filter(r => r.x === x && r.y === y && !r.morto && !r.presa) }

  // la stanza di una cella, o di una cella sul suo bordo (l'uscio, il muro attorno); null in un corridoio
  stanzaDi(x, y) {
    if (x < 0 || y < 0 || x >= this.largo || y >= this.alto) return null
    return this.stanze[this.vicinanza[y * this.largo + x]] || null
  }

  // le celle di una stanza più il giro di celle attorno (muri, usci): quello che si accende entrando con la torcia
  celleDellaLuce(s) {
    if (s.luce) return s.luce
    const viste = new Set(), fuori = []
    for (const { x, y } of s.suolo) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const a = x + dx, b = y + dy, k = b * this.largo + a
      if (a < 0 || b < 0 || a >= this.largo || b >= this.alto || viste.has(k)) continue
      viste.add(k); fuori.push([a, b])
    }
    return (s.luce = fuori)
  }

  // una cella a caso della stanza (un tiro solo); `lontano` restringe a quelle senza roccia accanto
  cellaDellaStanza(s, rnd = this.rnd, lontano = false) {
    const da = lontano && s.interno.length ? s.interno : s.suolo
    return da[Math.floor(rnd() * da.length)]
  }

  guasti() {
    const g = []
    const partenza = this.stanze[0]
    if (!partenza) return ['nessuna stanza']
    const da = { x: partenza.cx, y: partenza.cy }
    const chiuse = new Set(this.robe.filter(r => r.che === 'porta').map(r => r.x + ',' + r.y))
    // si cammina come si camminerà davvero: le porte si aprono rispondendo, quindi si attraversano
    const visti = raggiungibili((x, y) => this.calpestabile(x, y), da)
    // senza aprirle: non è un guasto, è quanto costa arrivare in fondo su questo piano
    const senzaAprire = raggiungibili(
      (x, y) => this.calpestabile(x, y) && !chiuse.has(x + ',' + y), da)

    const scala = this.robe.find(r => r.che === 'scala')
    if (!scala) g.push('non c\'è nessuna scala che scende')
    else if (!visti.has(scala.x + ',' + scala.y))
      g.push('alla scala non si arriva affatto')
    this.serveUnaPorta = !!scala && !senzaAprire.has(scala.x + ',' + scala.y)
    if (this.stanze.length < this.stanzeMin)
      g.push(`solo ${this.stanze.length} stanze: il piano si gira in un minuto`)
    if (!this.robe.some(r => r.che === 'mostro' && r.chiave))
      g.push('nessuno porta la chiave della scala')
    if (this.coiCaporali && !this.stanze.some(s => s.ruolo === 'anticamera'))
      g.push('il mostro grosso non ha un\'anticamera')
    for (const r of this.robe.filter(r => r.che === 'porta'))
      if (this.a(r.x, r.y) !== PORTA) g.push(`una porta chiusa non sta su una porta (${r.x},${r.y})`)
    return g
  }
}

// dopo venti tentativi si consegna l'ultimo comunque (meglio un piano storto che una schermata bianca) e lo si dice
export function generaPiano(opz) {
  let ultimo = null
  for (let i = 0; i < 20; i++) {
    ultimo = new Livello({ ...opz, seme: (opz.seme || 1) + i * 131 })
    if (!ultimo.guasti().length) return ultimo
  }
  ultimo.storto = ultimo.guasti()
  return ultimo
}
