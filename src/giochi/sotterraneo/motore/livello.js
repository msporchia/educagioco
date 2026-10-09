// Un piano del sotterraneo, generato tutto in una volta (contenuti compresi: entrare in una stanza accende
// la luce su cose già decise, non ne inventa). BSP classico: taglia il rettangolo, scava una stanza per
// ritaglio, unisce con corridoi a elle. Stesso seme, stesso piano (serve al banco di prova). `guasti()`
// cammina davvero dall'ingresso alla scala trattando le porte chiuse come attraversabili (si aprono
// rispondendo); `serveUnaPorta` dice comunque quanto costa arrivarci senza aprire nulla. Gira in Node.
import { ROCCIA, PAVIMENTO, PORTA, ARREDI } from '../dati/mondo.js'
import { CURIOSITA } from '../dati/curiosita.js'
import { MOSTRI, BRANCO, PASSO_DEL_BRANCO } from '../dati/mostri.js'
import { GROSSI } from '../dati/grossi.js'
import { raggiungibili } from '../../../motore/passi.js'

export function seminato(seme) {
  let s = (seme >>> 0) || 1
  return () => {
    s ^= s << 13; s >>>= 0
    s ^= s >> 17
    s ^= s << 5; s >>>= 0
    return s / 4294967296
  }
}

export class Livello {
  // `guardiano`: chi porta la chiave della scala, dichiarato dalla tappa (l'unica cosa che non si può aggirare)
  constructor({ seme = 1, piano = 0, largo = 52, alto = 52, giri = 4,
                guardiano = 'scheletro', crescita = null, branco = BRANCO, grosso = null } = {}) {
    this.seme = seme
    this.piano = piano
    this.largo = largo
    this.alto = alto
    this.giri = giri
    this.chiGuarda = guardiano
    // il mostro grosso (dati/grossi.js) al posto del guardiano, nella stanza della scala: non tocca il caso del piano
    this.grosso = grosso && GROSSI[grosso] ? grosso : null
    this.branco = branco              // chi si incontra per strada, fascia per fascia
    // dichiarato da chi genera il piano (dipende da quanto può scendere la discesa, vedi crescitaDi in dati/campagna.js)
    this.crescita = crescita || { ossa: 0.22, attOgni: 2 }
    this.celle = new Uint8Array(largo * alto)
    this.stanze = []
    this.robe = []                    // tutto ciò che sta su una cella e si tocca
    this.rnd = seminato(seme + piano * 7919)
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

    for (const f of foglie) {
      const w = Math.max(5, Math.min(f.w - 3, 5 + Math.floor(this.rnd() * 6)))
      const h = Math.max(4, Math.min(f.h - 3, 4 + Math.floor(this.rnd() * 5)))
      const x = f.x + 1 + Math.floor(this.rnd() * Math.max(1, f.w - w - 1))
      const y = f.y + 1 + Math.floor(this.rnd() * Math.max(1, f.h - h - 1))
      const st = { x, y, w, h, id: this.stanze.length, vicine: [], porte: [], ruolo: null }
      st.cx = x + (w >> 1); st.cy = y + (h >> 1)
      this.stanze.push(st)
      for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) this.metti(x + i, y + j, PAVIMENTO)
    }

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
    this.scavaPorte()
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
    for (const st of this.stanze) {
      for (let i = -1; i <= st.w; i++) for (let j = -1; j <= st.h; j++) {
        const bordo = (i === -1 || j === -1 || i === st.w || j === st.h)
        if (!bordo) continue
        const angolo = (i === -1 || i === st.w) && (j === -1 || j === st.h)
        if (angolo) continue
        const x = st.x + i, y = st.y + j
        if (this.a(x, y) !== PAVIMENTO) continue
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
    const tipoPer = forza => {
      const r = this.rnd()
      const i = Math.min(this.branco.length - 1,
        Math.floor((forza + scala) * PASSO_DEL_BRANCO + r * 1.4))
      const fascia = this.branco[Math.max(0, i)]
      return fascia[Math.floor(r * 1e6) % fascia.length]
    }
    for (const s of st) {
      if (s.ruolo === 'ingresso') continue
      const quanti = s.ruolo === 'tesoro' ? 1 : Math.floor(this.rnd() * 2.4)
      for (let i = 0; i < quanti; i++) {
        const x = s.x + Math.floor(this.rnd() * s.w), y = s.y + Math.floor(this.rnd() * s.h)
        if (this.robeSu(x, y).length) continue
        this.robe.push(this.mostro(tipoPer(s.ruolo === 'tesoro' ? 0.6 : 0.15), x, y))
      }
    }

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
      const x = s.x + Math.floor(this.rnd() * s.w), y = s.y + Math.floor(this.rnd() * s.h)
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

  // mai nella stanza d'ingresso; due o tre per piano (tre o quattro sui grandi), la stessa densità dei
  // forzieri: non cambia il costo della discesa (si passa oltre), cambia quello che c'è da guardare
  spargiLeCuriosita(st) {
    const buone = st.filter(s => s.ruolo !== 'ingresso')
    const quante = (buone.length >= 8 ? 3 : 2) + (this.rnd() < 0.6 ? 1 : 0)
    for (let n = 0; n < quante; n++) {
      const s = buone[Math.floor(this.rnd() * buone.length)]
      if (!s) return
      for (let giro = 0; giro < 12; giro++) {
        const x = s.x + Math.floor(this.rnd() * s.w)
        const y = s.y + Math.floor(this.rnd() * s.h)
        if (!this.calpestabile(x, y) || this.robeSu(x, y).length) continue
        if (this.porteVicine(x, y)) continue
        const c = CURIOSITA[Math.floor(this.rnd() * CURIOSITA.length)]
        this.robe.push({ che: 'curiosita', tipo: c.tipo, x, y, em: c.em,
                         nome: c.nome, pezzo: c.pezzo })
        break
      }
    }
  }

  // roba che non fa niente (barili, ossa...): sta contro le pareti, non in mezzo dove si cammina
  arredaLeStanze() {
    // uno solo acceso per stanza: due lanterne nella stessa cantina illuminano tutto
    const { appeso: APPESO, posato: POSATO, fuoco: FUOCO } = ARREDI
    const pesca = quali => quali[Math.floor(this.rnd() * quali.length)]

    for (const s of this.stanze) {
      const quanti = 1 + Math.floor(this.rnd() * 3)
      let acceso = false
      for (let i = 0; i < quanti; i++) {
        const appeso = this.rnd() < 0.35
        const fuoco = !appeso && !acceso && this.rnd() < 0.4
        // appeso: sulla fila in alto, contro la parete di faccia. posato: su un bordo qualunque
        const x = appeso || this.rnd() < 0.6
          ? s.x + Math.floor(this.rnd() * s.w)
          : (this.rnd() < 0.5 ? s.x : s.x + s.w - 1)
        const y = appeso ? s.y
          : (this.rnd() < 0.5 ? s.y : s.y + s.h - 1)
        if (!this.calpestabile(x, y) || this.robeSu(x, y).length) continue
        if (this.porteVicine(x, y)) continue
        if (fuoco) acceso = true
        this.robe.push({ che: 'arredo', x, y, em: fuoco ? '🔥' : appeso ? '🎌' : '📦',
                         pezzo: pesca(fuoco ? FUOCO : appeso ? APPESO : POSATO),
                         arde: fuoco })
      }
    }
  }

  // l'arredo si tiene a distanza da una porta, o si rischia di chiuderla con una cassa
  porteVicine(x, y) {
    return this.stanze.some(s => s.porte.some(p =>
      Math.abs(p.x - x) <= 1 && Math.abs(p.y - y) <= 1))
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

  dentroStanza(r, s) { return r.x >= s.x && r.y >= s.y && r.x < s.x + s.w && r.y < s.y + s.h }
  robeSu(x, y) { return this.robe.filter(r => r.x === x && r.y === y && !r.morto && !r.presa) }

  stanzaDi(x, y) {
    return this.stanze.find(s => x >= s.x - 1 && y >= s.y - 1 &&
                                 x < s.x + s.w + 1 && y < s.y + s.h + 1) || null
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
