// Un piano del sotterraneo, generato tutto in una volta (contenuti compresi: entrare in una stanza accende
// la luce su cose già decise, non ne inventa). BSP classico: taglia il rettangolo, scava una stanza per
// ritaglio, unisce con corridoi a elle. Stesso seme, stesso piano (serve al banco di prova). `guasti()`
// cammina davvero dall'ingresso alla scala trattando le porte chiuse come attraversabili (si aprono
// rispondendo); `serveUnaPorta` dice comunque quanto costa arrivarci senza aprire nulla. Gira in Node.
import { ROCCIA, PAVIMENTO, PORTA, RELITTO, ACQUA } from '../dati/mondo.js'
import { ORPELLI, NICCHIE } from '../dati/orpelli.js'
import { CLASSI, aspettoDi } from '../dati/relitti.js'
import { CURIOSITA } from '../dati/curiosita.js'
import { MOSTRI, CAPORALE, minacciaDi } from '../dati/mostri.js'
import { haLeVarianti, pescaLaVariante, pescaIlGrado, vesti, rangoDelGrado } from '../dati/varianti.js'
import { GROSSI } from '../dati/grossi.js'
import { raggiungibili } from '../../../motore/passi.js'
import { costruisci, pezziDa, celleDi, pozza, CELLE_SALA } from './forme.js'

// un numero fisso per cella (senza consumare il caso del piano): da qui l'aspetto di un relitto
const numeroDa = (x, y, sale) => {
  let h = (Math.imul(x + 101, 73856093) ^ Math.imul(y + 211, 19349663) ^ Math.imul(sale + 7, 83492791)) >>> 0
  h ^= h >>> 13; h = Math.imul(h, 0x5bd1e995) >>> 0; h ^= h >>> 15
  return h >>> 0
}

export function seminato(seme) {
  let s = (seme >>> 0) || 1
  return () => {
    s ^= s << 13; s >>>= 0
    s ^= s >> 17
    s ^= s << 5; s >>>= 0
    return s / 4294967296
  }
}

// Chi abita un piano (docs/sotterraneo/piani.md, «I mostri»): una stanza ordinaria su cinque è vuota (ogni stanza piccola; la sala mai),
// una su dieci ha un solo mostro appostato, le altre un branco da due a `tettoBranco` (sei al più, più l'appostato di una sala: lo scontro ne
// prende sette); i numeri alti sono rari anche dove il tetto è alto, e i tetti alti sono delle discese tarde
const STANZE_VUOTE = 0.2
const STANZE_CON_UN_APPOSTATO = 0.1
const TETTO_DEL_BRANCO = 6
// i mostri che stanno col grosso nella sua stanza (da due a tre)
const SCAGNOZZI_DEL_GROSSO = [2, 3]
// le pelli di una porta qualunque, a caso dalla cella: dal numero non si capisce cosa c'è dietro (docs/sotterraneo/piani.md, «Le porte»)
const PELLI_DELLE_PORTE = ['semplice', 'semplice', 'ferro', 'chiara']

export class Livello {
  // `guardiano`: chi porta la chiave della scala, dichiarato dalla tappa (l'unica cosa che non si può aggirare)
  constructor({ seme = 1, piano = 0, largo = 52, alto = 52, giri = 4,
                guardiano = 'scheletro', crescita = null, branco = ['scheletro'], caporale = null, tettoBranco = 5, grosso = null, scenario = null, caporali = true,
                pianta = 'costruita', acqua = false, densita = 1, livello = 1 } = {}) {
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
    this.branco = branco              // chi si incontra per strada: gli abitanti del posto (`mostri` in dati/campagna.js)
    // la più dura (colpo per velocità): quella che sta a guardia del tesoro; e chi fa il caporale (`caporale` del posto, se manca la più dura)
    this.piuDura = branco.reduce((a, b) => (minacciaDi(MOSTRI[b]) >= minacciaDi(MOSTRI[a]) ? b : a))
    this.caporale = caporale || this.piuDura
    this.livelloDelPosto = livello    // quanto è giù il posto: dice i gradi delle varianti (dati/varianti.js)
    this.tettoBranco = tettoBranco    // quanti, al più, in un branco della discesa
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
    // la famiglia del piano: `costruita` (stanze a pianta, colonnati, nicchie) o `caverna` (grotte e passaggi storti), docs/sotterraneo/piani-caverne.md
    this.pianta = pianta === 'caverna' ? 'caverna' : 'costruita'
    this.acqua = !!acqua   // pozze da aggirare
    this.densita = densita   // quante stanze hanno qualcuno, rispetto agli altri piani: 1 una su cinque vuota (`densita` della discesa, dati/campagna.js)
    // i relitti (macerie, statue rotte, rocce…) hanno il loro caso: non spostano né mostri né arredo, e si vedono nell'elenco `relitti`
    this.rndRelitti = seminato(seme * 29 + piano * 130363 + 7)
    this.relitti = []
    this.bassi = new Set()   // le celle dei relitti bassi: la luce ci passa sopra
    this.scenario = scenario
    // in una grotta non stanno un altare, un trono o due cavalieri di guardia
    this.orpelli = (ORPELLI[scenario] || ORPELLI.cantine).filter(o => this.pianta !== 'caverna' || (o.posa !== 'fondo' && o.posa !== 'coppia'))
    // e le varianti e i gradi il loro, per la stessa ragione: cambiare chi ha l'arco non sposta un mostro né una stanza
    this.rndVarianti = seminato(seme * 31 + piano * 65537 + 7)
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
      this.collega(this.stanze[miglior.a], this.stanze[miglior.b])
      dentro.push(miglior.b)
      fuori.splice(fuori.indexOf(miglior.b), 1)
    }
    for (let i = 0; i < 3; i++) {
      const a = this.stanze[Math.floor(this.rnd() * this.stanze.length)]
      const b = this.stanze[Math.floor(this.rnd() * this.stanze.length)]
      if (a && b && a !== b && !a.vicine.includes(b.id)) this.collega(a, b)
    }
    this.piazzaLeColonne()
    this.scavaLeNicchie()
    this.scavaPorte()
    this.piazzaIRelitti()
    this.piazzaLAcqua()
    this.segnaLeVicinanze()
  }

  // il collegamento fra due stanze: un corridoio a elle (le costruite) o un passaggio storto e di larghezza diversa (le grotte)
  collega(a, b) { return this.pianta === 'caverna' ? this.passaggio(a, b) : this.corridoio(a, b) }

  // Quali foglie del BSP diventano una sala grande (docs/sotterraneo/piani.md): una ogni quattro stanze del piano, almeno
  // una, scelte a caso fra quelle dove ci sta (mai l'ingresso). Se non ci sta una sala vera, la foglia più larga ne
  // ospita una piccola: un piano senza una stanza dove nascondersi non c'è.
  scegliLeSale(foglie) {
    const posto = f => (f.w - 2) * (f.h - 2)
    // un antro vuole più posto di una sala: l'automa cellulare mangia i bordi
    const [minW, minH] = [13, 10]
    const idonee = foglie.map((f, i) => i).filter(i => i > 0 && foglie[i].w >= minW && foglie[i].h >= minH && posto(foglie[i]) >= 99)
    const quante = Math.max(1, Math.round(foglie.length / 4))
    const scelte = new Set()
    while (idonee.length && scelte.size < quante) {
      scelte.add(idonee.splice(Math.floor(this.rnd() * idonee.length), 1)[0])
    }
    if (!scelte.size) {
      const migliore = foglie.map((f, i) => i).filter(i => i > 0 && foglie[i].w >= minW - 1 && foglie[i].h >= minH - 1)
        .sort((a, b) => posto(foglie[b]) - posto(foglie[a]))[0]
      if (migliore != null) scelte.add(migliore)
    }
    return scelte
  }

  // La stanza di una foglia (docs/sotterraneo/piani.md, piani-caverne.md). Nelle costruite: rettangolo, smussata, L, T, croce, cappella
  // o due rettangoli uniti (la prima foglia, l'ingresso, è sempre un rettangolo) e la sala, che occupa quasi tutta la foglia; nelle
  // grotte: grotta, bilobata o galleria, e l'antro al posto della sala. `maschera` dice dove si cammina: nel riquadro `x,y,w,h` ci
  // possono essere angoli di roccia, e una stanza è fatta dei suoi `pezzi`
  stanzaIn(f, i, sala) {
    const maxW = f.w - 3, maxH = f.h - 3
    const grotta = this.pianta === 'caverna'
    let forma = grotta ? 'grotta' : 'rettangolo', fatta = null
    if (sala) {
      forma = grotta ? 'antro' : 'sala'
      fatta = grotta ? costruisci(forma, f.w, f.h, this.rnd) : costruisci(forma, f.w - 2, f.h - 2, this.rnd)   // il bordo di un antro è sempre vuoto: ha già il suo margine
    } else if (i > 0) {
      // si tira una forma, e se nella foglia non ci sta se ne tira un'altra (fino a tre volte): in una foglia piccola ci stanno
      // solo le forme piccole, e a rimettere sempre il rettangolo il piano tornerebbe quadrato
      for (let tentativo = 0; tentativo < 3 && !fatta; tentativo++) {
        const t = this.rnd()
        const scelta = grotta ? (t < 0.4 ? 'grotta' : t < 0.7 ? 'bilobata' : 'galleria')
          : t < 0.18 ? 'rettangolo' : t < 0.38 ? 'smussata' : t < 0.50 ? 'elle' : t < 0.60 ? 'tu' : t < 0.72 ? 'croce'
            : t < 0.86 ? 'cappella' : 'doppia'
        fatta = scelta === 'rettangolo' ? costruisci(scelta, maxW, maxH, this.rnd) : costruisci(scelta, maxW + 1, maxH + 1, this.rnd)   // le forme prendono un po' più posto
        if (fatta) forma = scelta
      }
    }
    if (!fatta && grotta) { forma = 'grotta'; fatta = costruisci('grotta', maxW, maxH, this.rnd) }
    if (!fatta) { forma = 'rettangolo'; fatta = costruisci('rettangolo', maxW, maxH, this.rnd) }
    const { w, h, m } = fatta
    const x = f.x + 1 + Math.floor(this.rnd() * Math.max(1, f.w - w - 1))
    const y = f.y + 1 + Math.floor(this.rnd() * Math.max(1, f.h - h - 1))
    const st = { x, y, w, h, id: this.stanze.length, vicine: [], porte: [], ruolo: null, forma,
                 pezzi: pezziDa(m, w, h, x, y), suolo: [], interno: [], colonne: [], nicchie: [], relitti: [], acqua: [] }
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

  // quante celle calpestabili si raggiungono dall'ingresso, a quattro direzioni: serve a chi mette una cosa che non si cammina
  // (colonna, relitto, pozza) per accorgersi che ha chiuso una strada. Senza stringhe né insiemi: si chiama a ogni tentativo
  raggiunte() {
    const L = this.largo, A = this.alto, p = this.stanze[0]
    const visto = this._visto || (this._visto = new Uint8Array(L * A))
    const coda = this._coda || (this._coda = new Int32Array(L * A))
    visto.fill(0)
    let letto = 0, scritto = 0
    const k0 = p.cy * L + p.cx
    coda[scritto++] = k0; visto[k0] = 1
    const c = this.celle
    const apri = k => { if (!visto[k] && (c[k] === PAVIMENTO || c[k] === PORTA)) { visto[k] = 1; coda[scritto++] = k } }
    while (letto < scritto) {
      const k = coda[letto++], x = k % L, y = (k / L) | 0
      if (x > 0) apri(k - 1)
      if (x < L - 1) apri(k + 1)
      if (y > 0) apri(k - L)
      if (y < A - 1) apri(k + L)
    }
    return scritto
  }

  // una cella della stanza `s` dove si può mettere qualcosa che non si cammina: pavimento suo, e non una nicchia
  cellaMia(s, x, y) {
    return x >= 0 && y >= 0 && x < this.largo && y < this.alto && this.nelle[y * this.largo + x] === s.id &&
      this.a(x, y) === PAVIMENTO && !s.nicchie.some(n => n.x === x && n.y === y)
  }

  // Prova a riempire `celle` con `tipo` (ROCCIA, RELITTO, ACQUA): se così una strada si chiude (qualcosa che si raggiungeva non si
  // raggiunge più) rimette tutto com'era e dice no. `prima` è quanto si raggiungeva, si aggiorna
  occupa(s, celle, tipo) {
    const L = this.largo
    for (const c of celle) { this.metti(c.x, c.y, tipo); this.nelle[c.y * L + c.x] = -1 }
    // tutte le celle che si sono chiuse si raggiungevano, e niente altro deve essersi perso: altrimenti è nata una tasca isolata
    const adesso = this.raggiunte()
    if (adesso === this.raggiuntePrima - celle.length) { this.raggiuntePrima = adesso; return true }
    for (const c of celle) { this.metti(c.x, c.y, PAVIMENTO); this.nelle[c.y * L + c.x] = s.id }
    return false
  }

  // le colonne: nelle sale delle costruite, in fila (un colonnato, o a caso dove non ci sta); celle di roccia sole, mai attaccate al muro né
  // fra loro (sempre due celle libere in mezzo): si gira attorno e ci si nasconde dietro, ma non si chiude mai una strada. Si
  // piazzano dopo i corridoi, che non le attraversano (ci passerebbero sopra). Le grotte non ne hanno: la roccia in mezzo è dei relitti.
  piazzaLeColonne() {
    if (this.pianta === 'caverna') return
    this.raggiuntePrima = this.raggiunte()
    for (const s of this.stanze) if (s.forma === 'sala' && !this.colonnato(s)) this.colonneSparse(s)
  }

  // un colonnato: due file di pilastri ai due lati, a due celle dal muro, uno ogni tre celle e centrati: una navata col suo
  // corridoio in mezzo. Se meno di quattro stanno al loro posto la sala non ne ha (e ricade sulle colonne a caso)
  colonnato(s) {
    const L = this.largo
    const lungoX = s.w >= s.h
    const A = lungoX ? s.w : s.h, B = lungoX ? s.h : s.w
    if (A < 9 || B < 8) return false
    const n = Math.floor((A - 5) / 3) + 1
    const da = Math.floor((A - 1 - 3 * (n - 1)) / 2)
    const messe = []
    for (const fila of [2, B - 3]) for (let i = 0; i < n; i++) {
      const pos = da + 3 * i
      const x = lungoX ? s.x + pos : s.x + fila, y = lungoX ? s.y + fila : s.y + pos
      if (Math.max(Math.abs(x - s.cx), Math.abs(y - s.cy)) < 2) continue
      let libera = true
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++)
        if (!(dx === 0 && dy === 0) && !this.cellaMia(s, x + dx, y + dy)) libera = false
      if (!libera || !this.cellaMia(s, x, y)) continue
      if (this.occupa(s, [{ x, y }], ROCCIA)) messe.push({ x, y })
    }
    if (messe.length < 4) {
      for (const c of messe) { this.metti(c.x, c.y, PAVIMENTO); this.nelle[c.y * L + c.x] = s.id }
      this.raggiuntePrima = this.raggiunte()
      return false
    }
    for (const c of messe) s.colonne.push(c)
    s.colonnato = { lungoX, pos: [...new Set(messe.map(c => (lungoX ? c.x : c.y)))] }
    return true
  }

  // le colonne a caso (la sala dove un colonnato non ci sta): roccia sola o a coppia, mai a meno di due celle da un'altra e dal centro
  colonneSparse(s) {
    const L = this.largo
    const mia = (x, y) => this.cellaMia(s, x, y)
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
    for (let p = 0; p < prove * 3; p++) {
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
    this.raggiuntePrima = this.raggiunte()
  }

  // le nicchie delle costruite: una cella scavata nel muro, spessa una, con la roccia attorno e dietro (due celle di muro), aperta
  // su un tratto dritto di parete. Nelle sale col colonnato stanno in linea coi pilastri, alle due pareti lunghe; altrove una su due
  // stanze ne ha da una a tre, distanti fra loro. Sono celle della stanza (ci si appostano mostri, ci sta una gemma)
  scavaLeNicchie() {
    if (this.pianta === 'caverna') return
    const L = this.largo
    const roccia = (x, y) => this.a(x, y) === ROCCIA
    const DIR = [[0, -1], [0, 1], [-1, 0], [1, 0]]
    for (const s of this.stanze) {
      const mia = (x, y) => this.nelle[y * L + x] === s.id && this.a(x, y) === PAVIMENTO
      const slot = []
      for (let y = s.y; y < s.y + s.h; y++) for (let x = s.x; x < s.x + s.w; x++) {
        if (!mia(x, y)) continue
        for (const [dx, dy] of DIR) {
          const px = -dy, py = dx   // lungo la parete
          const nx = x + dx, ny = y + dy
          if (nx < 2 || ny < 2 || nx > L - 3 || ny > this.alto - 3) continue
          // la nicchia, i suoi fianchi e il muro dietro: tutta roccia, a due celle di spessore
          const roccioso = [[0, 0], [px, py], [-px, -py], [dx, dy], [dx + px, dy + py], [dx - px, dy - py], [2 * dx, 2 * dy]]
          if (!roccioso.every(([a, b]) => roccia(nx + a, ny + b))) continue
          // e aperta su un tratto dritto: le due celle accanto a quella davanti sono della stanza
          if (!mia(x + px, y + py) || !mia(x - px, y - py)) continue
          slot.push({ x: nx, y: ny, da: { x, y }, dx, dy })
        }
      }
      if (!slot.length) continue
      let scelti = []
      const lontano = c => scelti.every(o => Math.max(Math.abs(o.x - c.x), Math.abs(o.y - c.y)) > 2)
      if (s.colonnato) {
        // in linea coi pilastri, sulle due pareti lunghe (la direzione in cui si leggono le file)
        const { lungoX, pos } = s.colonnato
        for (const c of slot) if (lungoX ? c.dy !== 0 && pos.includes(c.x) : c.dx !== 0 && pos.includes(c.y)) scelti.push(c)
      } else if (this.rnd() < 0.5 + (s.forma === 'cappella' || s.forma === 'croce' ? 0.4 : 0)) {
        const quante = 1 + Math.floor(this.rnd() * 3)
        const mescolati = [...slot]
        for (let k = mescolati.length - 1; k > 0; k--) { const r = Math.floor(this.rnd() * (k + 1)); [mescolati[k], mescolati[r]] = [mescolati[r], mescolati[k]] }
        scelti = []
        for (const c of mescolati) { if (scelti.length >= quante) break; if (lontano(c)) scelti.push(c) }
      }
      for (const c of scelti) {
        // la nicchia accanto a un'altra appena scavata (stesso uscio) non va: i controlli sono su roccia, quindi qui si rifanno
        if (!roccia(c.x, c.y)) continue
        this.metti(c.x, c.y, PAVIMENTO)
        this.nelle[c.y * L + c.x] = s.id
        s.nicchie.push({ x: c.x, y: c.y })
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
    for (const s of this.stanze) this.riquadroDi(s)
  }

  // le celle lontane dai muri e il riquadro con i pezzi di una stanza, dal suo suolo
  riquadroDi(s) {
    // le celle con tutte e quattro le vicine nella stanza: lontane dai muri
    s.interno = s.suolo.filter(c => [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dy]) => this.dentro(s, c.x + dx, c.y + dy)))
    // il riquadro e i pezzi sono il suolo più le colonne: una nicchia esce dal riquadro di nascita (relitti e acqua stanno dentro)
    const celle = [...s.suolo, ...s.colonne]
    const x0 = Math.min(...celle.map(c => c.x)), y0 = Math.min(...celle.map(c => c.y))
    const w = Math.max(...celle.map(c => c.x)) - x0 + 1, h = Math.max(...celle.map(c => c.y)) - y0 + 1
    const m = new Uint8Array(w * h)
    for (const c of celle) m[(c.y - y0) * w + c.x - x0] = 1
    s.x = x0; s.y = y0; s.w = w; s.h = h
    s.pezzi = pezziDa(m, w, h, x0, y0)
  }

  // un corridoio a elle; uno su tre è largo due celle (la seconda corsia sotto o accanto alla prima)
  corridoio(a, b) {
    const prima = this.rnd() < 0.5
    const largo = this.rnd() < 0.3
    const x0 = a.cx, y0 = a.cy, x1 = b.cx, y1 = b.cy
    const passo = (x, y) => { if (x > 0 && y > 0 && x < this.largo - 1 && y < this.alto - 1 && this.a(x, y) === ROCCIA) this.metti(x, y, PAVIMENTO) }
    if (prima) {
      for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) { passo(x, y0); if (largo) passo(x, y0 + 1) }
      for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) { passo(x1, y); if (largo) passo(x1 + 1, y) }
    } else {
      for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) { passo(x0, y); if (largo) passo(x0 + 1, y) }
      for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) { passo(x, y1); if (largo) passo(x, y1 + 1) }
    }
    a.vicine.push(b.id); b.vicine.push(a.id)
  }

  // un passaggio di grotta: dal centro di una stanza a quello dell'altra, un passo alla volta verso la meta ma con delle
  // sbandate di lato (da due a cinque celle) che lo fanno serpeggiare; se la strada è lunga passa da una tappa fuori linea, e
  // curva. La sezione cambia ogni tanto (una, due o tre celle) e vicino alle stanze è sempre una sola: un'imboccatura stretta, dove
  // sta la porta di una stanza premio
  passaggio(a, b) {
    const rnd = this.rnd, L = this.largo, A = this.alto
    const lungo = Math.abs(b.cx - a.cx) + Math.abs(b.cy - a.cy)
    const tappe = []
    if (lungo >= 12) {
      // la tappa: a metà strada, spostata di lato di un quarto della lunghezza al più (dalla parte che capita)
      const mx = (a.cx + b.cx) / 2, my = (a.cy + b.cy) / 2
      const dx = b.cx - a.cx, dy = b.cy - a.cy, n = Math.hypot(dx, dy)
      const d = (rnd() < 0.5 ? -1 : 1) * (0.1 + 0.2 * rnd()) * lungo
      tappe.push({ x: Math.max(2, Math.min(L - 3, Math.round(mx - dy / n * d))), y: Math.max(2, Math.min(A - 3, Math.round(my + dx / n * d))) })
    }
    tappe.push({ x: b.cx, y: b.cy })
    let da = { x: a.cx, y: a.cy }
    for (const meta of tappe) { this.camminaStorto(da, meta); da = meta }
    a.vicine.push(b.id); b.vicine.push(a.id)
  }

  camminaStorto(da, meta) {
    const rnd = this.rnd, L = this.largo, A = this.alto
    const vicino = (px, py, r) => {
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        const q = px + dx, w = py + dy
        if (q >= 0 && w >= 0 && q < L && w < A && this.nelle[w * L + q] >= 0) return true
      }
      return false
    }
    const scava = (px, py) => {
      if (px > 0 && py > 0 && px < L - 1 && py < A - 1 && this.a(px, py) === ROCCIA) this.metti(px, py, PAVIMENTO)
    }
    let x = da.x, y = da.y, largo = 1, resta = 0, giro = null
    const tx = meta.x, ty = meta.y
    const timbro = () => {
      scava(x, y)
      if (largo >= 2 && !vicino(x, y, 3)) {
        scava(x + 1, y); scava(x, y + 1)
        if (largo === 3) { scava(x - 1, y); scava(x, y - 1); scava(x + 1, y + 1) }
      }
    }
    const tetto = 6 * (Math.abs(tx - x) + Math.abs(ty - y)) + 40
    for (let passi = 0; (x !== tx || y !== ty) && passi < tetto; passi++) {
      if (resta-- <= 0) {
        const r = rnd()
        largo = vicino(x, y, 3) ? 1 : r < 0.5 ? 1 : r < 0.88 ? 2 : 3
        resta = 3 + Math.floor(rnd() * 5)
      }
      timbro()
      let sx = 0, sy = 0
      const dx = Math.sign(tx - x), dy = Math.sign(ty - y)
      if (giro && giro.n > 0) { sx = giro.sx; sy = giro.sy; giro.n-- }
      else {
        if (dx && dy) { if ((Math.abs(tx - x) >= Math.abs(ty - y)) === (rnd() < 0.65)) sx = dx; else sy = dy }
        else if (dx) sx = dx
        else sy = dy
        // una sbandata di lato: lontano dalle stanze, e mai più di sei per tratto
        if (!vicino(x, y, 3) && rnd() < 0.22 && (giro ? giro.fatte : 0) < 6) {
          const verso = rnd() < 0.5 ? 1 : -1
          giro = { sx: sx ? 0 : verso, sy: sx ? verso : 0, n: 1 + Math.floor(rnd() * 4), fatte: (giro ? giro.fatte : 0) + 1 }
          sx = giro.sx; sy = giro.sy
        }
      }
      x = Math.max(1, Math.min(L - 2, x + sx)); y = Math.max(1, Math.min(A - 2, y + sy))
    }
    // se la strada storta non è arrivata (il tetto di passi), si chiude dritta: un piano senza collegamento è un piano rotto
    while (x !== tx) { timbro(); x += Math.sign(tx - x) }
    while (y !== ty) { timbro(); y += Math.sign(ty - y) }
    timbro()
  }

  // dove un corridoio tocca il bordo di una stanza: la cella di passaggio accanto (da un lato, mai in diagonale: si attraverserebbe in
  // diagonale) a una cella della stanza. Vale anche per le grotte: lì sono le imboccature
  scavaPorte() {
    const L = this.largo
    for (const st of this.stanze) {
      for (let y = st.y; y < st.y + st.h; y++) for (let x = st.x; x < st.x + st.w; x++) {
        if (this.nelle[y * L + x] !== st.id) continue
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const a = x + dx, b = y + dy
          if (a < 0 || b < 0 || a >= L || b >= this.alto) continue
          if (this.a(a, b) !== PAVIMENTO || this.nelle[b * L + a] >= 0) continue
          this.metti(a, b, PORTA)
          st.porte.push({ x: a, y: b })
        }
      }
    }
  }

  // Le celle di una stanza prima che ci si metta qualcosa: nelle caverne e nelle costruite lo stesso elenco
  celleNate(s) {
    const L = this.largo, o = []
    for (let y = s.y; y < s.y + s.h; y++) for (let x = s.x; x < s.x + s.w; x++)
      if (this.nelle[y * L + x] === s.id && this.a(x, y) === PAVIMENTO) o.push({ x, y })
    return o
  }

  // una cella dove si può posare un ingombro (relitto o pozza): della stanza e non una nicchia, a due celle dal centro (le scale, i
  // forzieri e i corridoi partono da lì), a due celle da ogni porta (non la si chiude), e per i relitti a una cella da ogni altro ingombro
  libera(s, x, y, ingombri = true) {
    if (!this.cellaMia(s, x, y)) return false
    if (Math.max(Math.abs(x - s.cx), Math.abs(y - s.cy)) < 2) return false
    for (const r of this.stanze) for (const p of r.porte) if (Math.abs(p.x - x) < 2 && Math.abs(p.y - y) < 2) return false
    if (ingombri) for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const c = this.a(x + dx, y + dy)
      if (c === RELITTO || c === ACQUA || (c === ROCCIA && s.colonne.some(q => q.x === x + dx && q.y === y + dy))) return false
    }
    return true
  }

  // I relitti (docs/sotterraneo/piani-caverne.md): macerie, statue rotte, sarcofagi, rocce, un carro rovesciato. Bloccano il passo e la
  // luce come un muro e fanno angoli dove appostarsi. Mai a chiudere una strada (si prova e, se serve, si toglie), mai a meno di due
  // celle da una porta o dal centro, mai accanto a un altro ingombro. Il numero dipende da quanto è grande la stanza; nell'ingresso al più uno.
  piazzaIRelitti() {
    const rnd = this.rndRelitti
    this.raggiuntePrima = this.raggiunte()
    const classi = Object.entries(CLASSI)
    const peso = classi.reduce((n, [, c]) => n + c.peso, 0)
    for (const s of this.stanze) {
      const celle = this.celleNate(s)
      if (celle.length < 14) continue
      // tre ogni cento celle sopra le dodici, e il resto a sorte: una stanza di venti ne ha uno una volta su cinque, una di quaranta
      // quasi sempre, una sala da cento tre o quattro
      let quanti = Math.floor((celle.length - 12) * 0.03 + rnd())
      if (s.id === 0) quanti = Math.min(quanti, 1)   // l'ingresso (i ruoli si danno dopo): chi arriva trova un posto semplice
      quanti = Math.min(quanti, s.grande ? 6 : 3)
      for (let messi = 0, prove = 0; messi < quanti && prove < 40; prove++) {
        let tiro = rnd() * peso
        const [nome, r] = classi.find(([, q]) => (tiro -= q.peso) < 0) || classi[0]
        const v = r.orienta === 'entrambe' && rnd() < 0.5
        const w = v ? r.h : r.w, h = v ? r.w : r.h
        const ancora = celle[Math.floor(rnd() * celle.length)]
        const piede = []
        for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) piede.push({ x: ancora.x + i, y: ancora.y + j })
        if (!piede.every(c => this.libera(s, c.x, c.y))) continue
        // la posa: contro il muro (roccia accanto a una cella), staccato (tutt'attorno stanza) o dove capita
        const roccia = (x, y) => this.a(x, y) === ROCCIA && !s.colonne.some(q => q.x === x && q.y === y)
        const alMuro = piede.some(c => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => roccia(c.x + dx, c.y + dy)))
        const staccato = piede.every(c => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (!this.cellaMia(s, c.x + dx, c.y + dy) && !piede.some(q => q.x === c.x + dx && q.y === c.y + dy)) return false
        } return true })
        if (r.posa === 'parete' && !alMuro) continue
        if (r.posa === 'libero' && !staccato) continue
        if (!this.occupa(s, piede, RELITTO)) continue
        // l'aspetto lo dice la cella (non un tiro: lo scenario non sposta il caso del piano)
        const aspetto = aspettoDi(this.scenario, this.pianta, nome, numeroDa(ancora.x, ancora.y, 77), v)
        this.relitti.push({ x: ancora.x, y: ancora.y, w, h, classe: nome, id: aspetto.id, pezzo: aspetto.pezzo || null, disegno: aspetto.disegno || null, dice: aspetto.dice, v })
        for (const c of piede) { s.relitti.push(c); if (aspetto.basso) this.bassi.add(c.y * this.largo + c.x) }
        messi++
      }
    }
  }

  // Le pozze d'acqua (la scala sommersa): celle che non si calpestano e non fermano la luce, da aggirare. Una o più per stanza,
  // un decimo o poco più delle celle, attaccate al muro se capita; mai a chiudere una strada, né a meno di due celle da porte e
  // centro. Possono toccarsi fra loro e farne una più grande.
  piazzaLAcqua() {
    if (!this.acqua) return
    const rnd = this.rndRelitti
    this.raggiuntePrima = this.raggiunte()
    for (const s of this.stanze) {
      const celle = this.celleNate(s)
      if (celle.length < 20) continue
      const bersaglio = Math.round(celle.length * (0.1 + 0.12 * rnd()))
      let fatte = 0
      for (let prove = 0; fatte < bersaglio && prove < 12; prove++) {
        const w = 4 + Math.floor(rnd() * 3), h = 3 + Math.floor(rnd() * 3)
        const forma = pozza(w, h, rnd)
        if (!forma) continue
        // dove sta tutta: fra le celle della stanza, quelle da cui la pozza ci sta interamente (e non tocca un relitto)
        const posti = []
        for (const ancora of celle) {
          const piede = []
          for (let j = 0; j < forma.h; j++) for (let i = 0; i < forma.w; i++)
            if (forma.m[j * forma.w + i]) piede.push({ x: ancora.x + i, y: ancora.y + j })
          if (piede.every(c => this.libera(s, c.x, c.y, false) && ![[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]
            .some(([dx, dy]) => this.a(c.x + dx, c.y + dy) === RELITTO))) posti.push(piede)
        }
        if (!posti.length) continue
        const piede = posti[Math.floor(rnd() * posti.length)]
        if (!this.occupa(s, piede, ACQUA)) continue
        for (const c of piede) s.acqua.push(c)
        fatte += piede.length
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
                       pelle: this.pelleDelForziere(),   // un numero: lo scenario sceglie il disegno (dati/tessere.js)
                       aperto: false })
    }

    // chi c'è per strada è la coppia della discesa, e basta: quanto sono forti lo dice il livello (forza e spinta, `mostro`). Un
    // branco ha la specie del primo tiro più altre pescate a caso fra le due. `forza` 0,6 e oltre, dove c'è la guardia del
    // tesoro, sceglie la specie più dura. Il tiro è uno solo: un secondo rnd() sposterebbe il caso di tutto il piano
    const tipiPer = (forza, quanti, tetto = false) => {
      const r = this.rnd()
      if (tetto) quanti = Math.min(quanti, this.tettoBranco)
      const tipi = [forza >= 0.5 ? this.piuDura : this.branco[Math.floor(r * 1e6) % this.branco.length]]
      while (tipi.length < quanti) tipi.push(this.branco[Math.floor(this.rnd() * this.branco.length)])
      return tipi
    }
    this.popolaIlPiano(tipiPer)

    // la scala è chiusa e la chiave ce l'ha qualcuno: senza, i mostri si aggirano tutti e il gioco diventa
    // una passeggiata al buio. Il guardiano sta accanto alla scala.
    const guardiano = this.grosso ? this.mostroGrosso(this.grosso, uscita.cx, uscita.cy - 1)
      : this.faiCaporale(this.mostro(this.chiGuarda, uscita.cx, uscita.cy - 1))
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

    const capo = this.grosso && this.robe.find(r => r.che === 'mostro' && r.grosso)
    if (capo) this.mettiGliScagnozzi(capo)

    // gemme sparse: fanno valere la pena scostarsi dalla strada anche quando in una stanza non c'è altro
    for (const s of st) {
      if (this.rnd() > 0.55) continue
      const { x, y } = this.cellaDellaStanza(s)
      if (!this.robeSu(x, y).length)
        this.robe.push({ che: 'gemme', x, y, em: '💎', quante: 2 + Math.floor(this.rnd() * 5) })
    }

    this.spargiLeCuriosita(st)
    this.arredaLeStanze()
    this.arredaLeNicchie()
    this.chiudiPorte()
  }

  // un tiro solo, non due annidati: ogni numero pescato sposta tutta la generazione a valle
  pelleDelForziere() { return Math.floor(this.rnd() * 1000) }

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

  // una nicchia vuota sembra un buco nel muro: ogni nicchia senza un mostro, una gemma o un orpello ne riceve uno dei suoi (`NICCHIE`
  // dello scenario), scelto dalla cella (`numeroDa`) e non dal caso del piano: nient'altro si sposta (docs/sotterraneo/piani-caverne.md)
  arredaLeNicchie() {
    const lista = ORPELLI[this.scenario] || ORPELLI.cantine
    const nomi = NICCHIE[this.scenario] || NICCHIE.cantine
    for (const s of this.stanze) for (const n of s.nicchie) {
      if (this.robeSu(n.x, n.y).length) continue
      const o = lista.find(q => q.pezzo === nomi[numeroDa(n.x, n.y, this.piano + 31) % nomi.length])
      this.robe.push({ che: 'arredo', x: n.x, y: n.y, em: '📦', pezzo: o.pezzo, arde: false, epica: o.epica, nicchia: true })
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

  // Chi sta nel piano (docs/sotterraneo/piani.md). Ogni stanza dove vanno i mostri è vuota una volta su cinque (le sale mai: lì stanno i
  // branchi), ha un solo mostro appostato in un angolo o dietro una colonna una volta su dieci, e altrimenti un branco da due fino al
  // tetto della discesa e della stanza, tutti vicini fra loro; le sale grandi hanno spesso anche un appostato. La stanza del tesoro ha la
  // sua guardia. `tipiPer(forza, quanti)` dà i tipi di una stessa fascia
  popolaIlPiano(tipiPer) {
    const vive = this.stanze.filter(s => !['ingresso', 'anticamera', 'tesoro'].includes(s.ruolo) && !(this.grosso && s.ruolo === 'uscita'))
    const caporali = this.stanze.find(s => s.ruolo === 'anticamera')
    const mescola = lista => { const l = [...lista]; for (let i = l.length - 1; i > 0; i--) { const j = Math.floor(this.rnd() * (i + 1)); [l[i], l[j]] = [l[j], l[i]] } return l }
    if (caporali) this.mettiICaporali(caporali, tipiPer)
    for (const s of this.stanze.filter(r => r.ruolo === 'tesoro')) this.mettiIlBranco(s, tipiPer(0.6, 1))

    const vuota = Math.min(0.4, Math.max(0.05, STANZE_VUOTE / this.densita))
    for (const s of mescola(vive)) {
      if (!s.grande && this.rnd() < vuota) continue
      if (!s.grande && this.rnd() < STANZE_CON_UN_APPOSTATO / (1 - vuota) && this.mettiUnAppostato(s, tipiPer(0.15, 1)[0])) continue
      // il branco: una stanza stretta ne tiene meno (in una da venti celle tre mostri sono una folla)
      const celle = s.suolo.length
      const tetto = Math.max(2, Math.min(this.tettoBranco, TETTO_DEL_BRANCO, celle < 25 ? 3 : celle < 45 ? 4 : celle < CELLE_SALA ? 5 : TETTO_DEL_BRANCO))
      const n = 2 + Math.floor(Math.pow(this.rnd(), 1.6) * (tetto - 1))   // la coda verso il tetto è corta
      this.mettiIlBranco(s, tipiPer(0.15, n, true))
      if (s.grande && this.rnd() < 0.5) this.mettiUnAppostato(s, tipiPer(0.15, 1)[0])
    }
  }

  // Il mostro grosso non sta solo: da due a tre mostri del posto gli stanno attorno, nella sua stanza (entrano nello scontro con lui: lo scontro
  // prende chi sta a 4,5 celle e il grosso vale due posti: con tre scagnozzi sono cinque posti su sette)
  mettiGliScagnozzi(capo) {
    const s = this.stanzaDi(capo.x, capo.y)
    if (!s) return []
    const n = SCAGNOZZI_DEL_GROSSO[0] + Math.floor(this.rnd() * (SCAGNOZZI_DEL_GROSSO[1] - SCAGNOZZI_DEL_GROSSO[0] + 1))
    const vicine = s.suolo.filter(c => this.liberaPerUnMostro(s, c.x, c.y) && Math.hypot(c.x - capo.x, c.y - capo.y) <= 2.5)
      .map(c => ({ c, d: Math.hypot(c.x - capo.x, c.y - capo.y) + this.rnd() * 0.8 }))
      .sort((p, q) => p.d - q.d).map(o => o.c)
    this.branchi = (this.branchi || 0) + 1
    capo.branco = this.branchi
    const messi = []
    for (let i = 0; i < n && i < vicine.length; i++) {
      const m = this.mostro(this.branco[Math.floor(this.rnd() * this.branco.length)], vicine[i].x, vicine[i].y)
      m.branco = this.branchi
      this.robe.push(m); messi.push(m)
    }
    return messi
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
    const ingombri = [...s.colonne.map(c => ({ ...c, tipo: 'colonna' })), ...s.relitti.map(c => ({ ...c, tipo: 'relitto' }))]
    const dietro = ingombri.flatMap(col => [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([dx, dy]) => ({ x: col.x + dx, y: col.y + dy, da: col, tipo: col.tipo })))
      .filter(c => solo(c) && dallePorte(c) > dallePorte(c.da))
    const dietroOk = dietro.length && (!angoli.length || this.rnd() < 0.5)
    const quali = dietroOk ? dietro : angoli
    if (!quali.length) return null
    const c = quali[Math.floor(this.rnd() * quali.length)]
    const m = this.mostro(tipo, c.x, c.y)
    m.appostato = dietroOk ? c.tipo : 'angolo'
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

  // due o tre caporali (tre se l'anticamera è una sala) nel mezzo della stanza: il caporale del posto, più duri
  // (`CAPORALE` in dati/mostri.js) e di un grado alto (dati/varianti.js), e si riconoscono dal segno che portano (galloni, scena/tela.js)
  quantiCaporali(s) { return s.grande && this.stanze.length >= 8 ? 3 : 2 }
  mettiICaporali(s, tipiPer) {
    tipiPer(0.15, this.quantiCaporali(s))   // i tiri ci sono sempre stati (ora i tipi li dice il caporale del posto): tolti, il caso di tutto il piano si sposterebbe
    const messi = this.mettiIlBranco(s, Array(this.quantiCaporali(s)).fill(this.caporale), { x: s.cx, y: s.cy })
    for (const m of messi) {
      this.faiCaporale(m)
    }
  }
  faiCaporale(m) {
    // un caporale non è mai comune: il suo grado, se non ce l'ha già dalla variante, si pesca qui (gradi più alti dei soldati)
    if (rangoDelGrado(m.grado) === 0) {
      const r = this.mostro(m.tipo, m.x, m.y, { variante: m.variante || null, grado: pescaIlGrado(this.livelloDelPosto, this.rndVarianti(), true) })
      for (const k of ['nome', 'grado', 'arma', 'velocita', 'difese', 'att', 'ossa', 'ossaMax', 'variante', 'incanto']) if (r[k] !== undefined) m[k] = r[k]
    }
    m.ossa = m.ossaMax = Math.round(m.ossa * (this.crescita.caporali || CAPORALE.ossa))
    m.att += CAPORALE.att
    m.nome = `${m.nome} caporale`
    m.caporale = true
    return m
  }

  // le ossa crescono col piano, l'attacco le segue più piano; la difesa non cresce mai (la manopola velenosa)
  // `variante` e `grado` (dati/varianti.js) si possono chiedere (un cheat, una prova); se no una specie con le mani pesca i suoi
  // col caso delle varianti
  mostro(tipo, x, y, { variante = undefined, grado = undefined } = {}) {
    const m = MOSTRI[tipo]
    const su = (1 + this.piano * this.crescita.ossa) * (this.crescita.forza || 1)
    const ossa = Math.round(m.ossa * su)
    const r = { che: 'mostro', tipo, x, y, em: m.em, nome: m.nome,
                ossa, ossaMax: ossa,
                att: m.att + Math.floor(this.piano / this.crescita.attOgni) + (this.crescita.spinta || 0), dif: m.dif,
                chiave: false, morto: false }
    if (haLeVarianti(tipo) || variante || grado) {
      const v = variante !== undefined ? variante : pescaLaVariante(tipo, this.rndVarianti())
      const g = grado || pescaIlGrado(this.livelloDelPosto, this.rndVarianti())
      vesti(r, m, { variante: v, grado: g, k: Math.floor(this.rndVarianti() * 9), peso: this.crescita.gradi ?? 1 })
    }
    return r
  }

  // il mostro grosso: il mostro del bestiario su cui si regge, con più ossa e un colpo in più, il suo nome e la sua figura
  mostroGrosso(id, x, y) {
    const G = GROSSI[id]
    const m = this.mostro(G.tipo, x, y)
    m.ossa = m.ossaMax = Math.max(Math.round(m.ossa * G.ossa * (this.crescita.grosso || 1)), m.ossa + 2)   // dove la forza è piccola (la cripta) il grosso resta almeno due ossa sopra il suo simile
    m.att += G.att
    m.grosso = id
    m.nome = G.nome
    return m
  }

  // Solo le porte che danno su qualcosa che vale: una porta chiusa su una stanza vuota è una bugia. Si chiude la STANZA (tutte le sue
  // porte, stesso `gruppo`): rispondere ne apre una e con lei tutte le altre (Corsa.rispostaPorta). Una porta non dice cosa c'è dietro
  // (nessun segno: «non devi già sapere cosa troverai»): solo la stanza del grosso, in tre piani su quattro (la geometria ne toglie: circa uno su due resta), ha il portone più bello
  // (`pelle: 'bella'`), l'unica a stare sulla strada della scala; le altre stanno fuori strada. Mai su un muro a scaletta: il varco si
  // stringe a una cella con un muro dritto attorno (`portaDritta`), se no la stanza resta aperta (docs/sotterraneo/piani.md, «Le porte»)
  chiudiPorte() {
    const messe = new Map()
    const conPortone = !!this.grosso && numeroDa(this.seme, this.piano, 3) % 4 !== 0
    for (const s of this.stanze) {
      if (!s.ruolo || s.ruolo === 'ingresso' || !s.porte.length) continue
      const portone = conPortone && s.ruolo === 'uscita'
      if (!portone && s.ruolo !== 'tesoro' && s.ruolo !== 'fonte') continue
      // non si sbarra mai la strada (tranne il portone del grosso): se chiudendola alla scala non si arriva più, resta aperta
      if (!portone && this.taglierebbeLaStrada(s, messe)) continue
      // le celle contigue di uno stesso varco contano come una cosa sola: al centro la porta, il resto si
      // mura (mai una porta per cella: sembrerebbe una prigione)
      const scelti = this.varchiDi(s.porte).map(v => this.portaDritta(v, s))
      if (scelti.some(v => !v)) continue
      // due porte di fila (la stanza accanto è sbarrata anche lei, o il corridoio fra le due è corto) sembrerebbero una porta doppia: la seconda resta aperta
      if (scelti.some(v => [...messe.values()].some(q => Math.max(Math.abs(q.x - v.mezzo.x), Math.abs(q.y - v.mezzo.y)) <= 2))) continue
      // o tutti o nessuno: un varco murato e un altro spalancato si aggirerebbe dall'altra parte
      const murate = []
      const tutti = scelti.every(v => {
        const prima = v.troppe.map(p => this.a(p.x, p.y))
        if (!this.stringiIlVarco(v.troppe, v.mezzo)) return false
        v.troppe.forEach((p, i) => murate.push({ p, prima: prima[i] }))
        return true
      })
      if (!tutti) { for (const { p, prima } of murate) this.metti(p.x, p.y, prima); continue }
      for (const v of scelti) for (const c of v.scava) if (!this.dentro(s, c.x, c.y)) this.scavaPerLaStanza(s, c)
      for (const { mezzo } of scelti) {
        const k = mezzo.x + ',' + mezzo.y
        if (messe.has(k)) continue
        const porta = { che: 'porta', x: mezzo.x, y: mezzo.y, em: '🚪',
                        nome: 'Una porta chiusa', pelle: portone ? 'bella' : PELLI_DELLE_PORTE[numeroDa(mezzo.x, mezzo.y, 5) % PELLI_DELLE_PORTE.length],
                        aperta: false, gruppo: s.id }
        messe.set(k, porta)
        this.robe.push(porta)
      }
    }
  }

  // La cella di un varco dove sta bene una porta: una sola in mezzo a un muro dritto, cioè con la roccia ai due lati (o murata, se è un'altra
  // cella dello stesso varco) e la stanza che continua dritta di qua, per tre celle; dall'altra parte il passaggio. Dove il muro non lo è
  // ma si può farlo (la roccia accanto alla stanza, da scavare in una o due celle che non aprono altro) lo si squadra: un angolo smussato o
  // una grotta altrimenti non avrebbero mai una porta. Torna `{ mezzo, troppe, scava }` (le altre celle del varco, da murare; le celle
  // di roccia da scavare, che `chiudiPorte` scava solo se la stanza si chiude) o null se nessuna cella ci sta
  portaDritta(varco, s) {
    const centro = varco[Math.floor(varco.length / 2)]
    const ordine = [...varco].sort((a, b) => Math.hypot(a.x - centro.x, a.y - centro.y) - Math.hypot(b.x - centro.x, b.y - centro.y))
    let squadrata = null
    for (const p of ordine) {
      const troppe = varco.filter(q => q !== p)
      const roccia = (x, y) => this.a(x, y) === ROCCIA || troppe.some(q => q.x === x && q.y === y)
      for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
        const lx = Math.abs(dy), ly = Math.abs(dx)   // lungo il muro
        if (!this.dentro(s, p.x + dx, p.y + dy) || this.dentro(s, p.x - dx, p.y - dy) || !this.calpestabile(p.x - dx, p.y - dy)) continue
        if (!roccia(p.x + lx, p.y + ly) || !roccia(p.x - lx, p.y - ly)) continue
        const lati = [[lx, ly], [-lx, -ly]].map(([a, b]) => ({ x: p.x + dx + a, y: p.y + dy + b }))
        const scava = lati.filter(c => !this.dentro(s, c.x, c.y))
        if (!scava.length) return { mezzo: p, troppe, scava }
        if (!squadrata && scava.every(c => this.sipuoScavare(s, c, troppe))) squadrata = { mezzo: p, troppe, scava }
      }
    }
    return squadrata
  }

  // una cella di roccia accanto alla stanza che si può scavare per squadrare un muro: lontana dal bordo del piano, e con attorno solo roccia o
  // la stanza stessa (se no si aprirebbe un buco verso un corridoio, e la porta si aggirerebbe)
  sipuoScavare(s, c, murate) {
    if (this.a(c.x, c.y) !== ROCCIA || this.nelle[c.y * this.largo + c.x] >= 0) return false
    if (c.x < 2 || c.y < 2 || c.x > this.largo - 3 || c.y > this.alto - 3) return false
    // chi sta accanto (un appostato nel suo angolo, un orpello appeso al muro) vuole la sua roccia
    if (this.robe.some(r => Math.max(Math.abs(r.x - c.x), Math.abs(r.y - c.y)) <= 1)) return false
    // una nicchia vuole due celle di roccia attorno e dietro
    if (this.stanze.some(r => r.nicchie.some(n => Math.max(Math.abs(n.x - c.x), Math.abs(n.y - c.y)) <= 2))) return false
    return [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([a, b]) => {
      const x = c.x + a, y = c.y + b
      return this.a(x, y) === ROCCIA || murate.some(q => q.x === x && q.y === y) || this.dentro(s, x, y)
    })
  }

  // scava una cella di roccia per farla stanza: la stanza la possiede, e il suo riquadro e i suoi pezzi la contano
  scavaPerLaStanza(s, c) {
    this.metti(c.x, c.y, PAVIMENTO)
    this.nelle[c.y * this.largo + c.x] = s.id
    this.vicinanza[c.y * this.largo + c.x] = s.id
    s.suolo.push({ x: c.x, y: c.y })
    ;(s.squadrate ||= []).push({ x: c.x, y: c.y })   // la forma di nascita si legge senza di loro
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const k = (c.y + dy) * this.largo + c.x + dx
      if (c.x + dx >= 0 && c.y + dy >= 0 && c.x + dx < this.largo && c.y + dy < this.alto && this.vicinanza[k] < 0) this.vicinanza[k] = s.id
    }
    s.luce = null
    this.riquadroDi(s)
  }

  // le celle di porta vicine, raggruppate (anche in diagonale e a una cella di distanza: un muro a scaletta, o due corridoi affiancati, sono un varco solo e una porta sola): un varco largo quattro è una lista di quattro
  varchiDi(porte) {
    const restano = porte.map(p => ({ x: p.x, y: p.y }))
    const gruppi = []
    while (restano.length) {
      const gruppo = [restano.pop()]
      for (let i = 0; i < gruppo.length; i++) {
        for (let j = restano.length - 1; j >= 0; j--) {
          const d = Math.max(Math.abs(restano[j].x - gruppo[i].x), Math.abs(restano[j].y - gruppo[i].y))
          if (d <= 2) gruppo.push(restano.splice(j, 1)[0])
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
    const raggiungevo = this.raggiunte()
    for (const p of troppe) this.metti(p.x, p.y, ROCCIA)
    const partenza = this.stanze[0]
    const visti = raggiungibili((x, y) => this.calpestabile(x, y),
                                { x: partenza.cx, y: partenza.cy })
    // niente deve restare isolato: le cose del piano, il varco, e nemmeno una cella (una tasca fra un relitto e il muro)
    const tutto = this.robe.every(r => visti.has(r.x + ',' + r.y)) &&
                  visti.has(mezzo.x + ',' + mezzo.y) && visti.size === raggiungevo - troppe.length
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
    if (this.robe.some(r => !visti.has(r.x + ',' + r.y))) g.push('una cosa del piano non si raggiunge')
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
