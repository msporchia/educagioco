// La corsa: le regole, senza schermo, sempre uguali nel browser e in
// Node — è quello che permette di misurare l'equilibrio (banco.js)
// invece di provarlo a occhio. Cosa succede e le tre cose che non si
// toccano (danno per metro non per secondo, il mostro dimensionato su
// dove la truppa sarà, il cancello d'oro che ferma tutto): docs/corsa/regole.md.
import { TETTO, figure, scomponi } from '../dati/ordini.js'
import { generaCancelli, resaPrevista, tondo } from './cancelli.js'

// fin dove si vede la pista: non un disegno, è quanto tempo hai per decidere
export const ORIZZONTE = 46

// da quanto lontano la truppa comincia a sparare: un branco grande
// esattamente quanto il mostro lo stende giusto sul filo dell'impatto
export const INGAGGIO = 16

const FRENO_BOSS = 0.45       // davanti al boss si rallenta, non ci si ferma

// quanto costa uno scontro perso: il mostro non spara, la truppa cala
// solo a eventi visibili e lo scontro si paga tutto insieme
// all'impatto, moltiplicato per PEDAGGIO — vedi docs/corsa/regole.md
const PEDAGGIO = 3

// la spinta: si spegne da sola restando sempre almeno RESPIRO secondi
// prima del prossimo cancello (in secondi, non in metri: i cancelli non
// distano sempre uguale) — vedi docs/corsa/regole.md
const SPINTA = 0.45           // quanta ne dà un tocco secco
const RIEMPI = 2.4            // ...e quanta al secondo se si tiene premuto
const SPINTA_MAX = 1.4        // fin dove si accumula: si arriva a più del doppio
const CALO = 1.6              // quanto in fretta si esaurisce, mollato il dito
const RESPIRO = 2.8           // i secondi di avvicinamento che nessuno può togliere

export class Regole {
  constructor(t) {
    this.chiave = t.chiave
    this.nome = t.nome
    this.veste = t.veste
    this.metri = t.metri
    this.passo = t.passo
    this.punta = t.punta
    this.spinta = t.spinta
    this.fraCancelli = t.fraCancelli
    this.fraScontri = t.fraScontri
    this.tetto = Math.min(t.tetto ?? TETTO, TETTO)
    this.truppa = t.truppa
    this.libri = t.libri
    this.studio = t.studio
    this.mira = t.mira
    this.coni = t.coni
  }

  get infinita() { return !Number.isFinite(this.metri) }
}

export class Partita {
  constructor(regole, { rnd = Math.random } = {}) {
    this.regole = regole
    this.rnd = rnd

    this.dist = 0
    this.v = regole.passo
    this.corsia = 0            // dove vuoi essere
    this.corsiaX = 0           // dove sei davvero: l'interpolazione fa lo scarto
    this.truppa = regole.truppa
    this.cose = []
    this.prossima = 24         // il primo cancello arriva dopo un respiro
    this.colpi = []
    this.scossa = 0
    this.fretta = 0            // la spinta accumulata
    this.tieni = false         // il dito è giù adesso

    this.daScontro = 0
    this.scontri = 0
    this.daColpo = 0

    this.vinti = 0             // scontri chiusi prima dell'impatto
    this.persi = 0             // mostri arrivati addosso ancora in piedi
    this.cancelli = 0          // cancelli attraversati
    this.meglio = 0            // quante volte hai preso il migliore dei tre
    this.libriProvati = 0
    this.libriGiusti = 0
    this.causa = ''

    this.offerta = null        // il cancello d'oro appena attraversato
    this.esito = null
    this.eventi = []

    if (!regole.infinita) this.cose.push({ tipo: 'traguardo', z: regole.metri, fatto: false })
    this.generaAvanti()
  }

  get finita() { return this.esito !== null }
  get vinta() { return this.esito === 'vinta' }
  get inPausa() { return this.offerta !== null }
  get restano() { return this.regole.infinita ? Infinity : Math.max(0, this.regole.metri - this.dist) }

  // quanti dei cancelli attraversati erano il migliore dei tre: l'unica
  // misura che dice se il conto è venuto, indipendente da come è andata la corsa
  get precisione() { return this.cancelli ? this.meglio / this.cancelli : 0 }

  get stelle() {
    if (!this.vinta) return 0
    let s = 1
    if (this.persi === 0) s++
    if (this.cancelli >= 3 && this.precisione >= this.regole.mira) s++
    return s
  }


  segnala(che) { if (this.eventi.length < 60) this.eventi.push(che) }
  svuotaEventi() { const e = this.eventi; this.eventi = []; return e }

  vai(delta) {
    const n = Math.max(-1, Math.min(1, this.corsia + delta))
    if (n === this.corsia) return false
    this.corsia = n
    this.segnala('cambio')
    return true
  }

  punta(corsia) { return this.vai(Math.max(-1, Math.min(1, corsia)) - this.corsia) }

  // un tocco secco = una spintarella; vale anche a corsia già giusta,
  // il gesto è «voglio andare», non «voglio spostarmi»
  spingi() {
    if (this.finita || this.inPausa) return 0
    this.fretta = Math.min(SPINTA_MAX, this.fretta + SPINTA)
    return this.fretta
  }

  premi(giu) {
    this.tieni = !!giu && !this.finita && !this.inPausa
    return this.tieni
  }

  // quanto vale la spinta adesso: tanta quanta ne resta dopo aver messo
  // da parte RESPIRO secondi di avvicinamento al prossimo cancello
  get spintaOra() {
    if (!this.fretta) return 1
    const scelta = this.cose
      .filter(c => c.tipo === 'cancelli' && !c.fatto && c.z - this.dist > 0)
      .sort((a, b) => a.z - b.z)[0]
    const libera = 1 + this.fretta
    if (!scelta) return libera
    const concessa = (scelta.z - this.dist) / (RESPIRO * this.v)
    return Math.min(libera, Math.max(1, concessa))
  }

  avanza(dt) {
    if (this.finita || this.inPausa) return

    // davanti a un boss si rallenta, non ci si ferma: è tempo di fuoco in più
    const capo = this.cose.find(c => c.tipo === 'nemici' && c.boss && !c.fatto &&
                                     c.z - this.dist < 18 && c.vita > 0)
    const freno = capo ? FRENO_BOSS : 1

    const metri = this.v * freno * this.spintaOra * dt
    if (this.tieni) this.fretta = Math.min(SPINTA_MAX, this.fretta + dt * RIEMPI)
    else this.fretta = Math.max(0, this.fretta - dt * CALO)
    this.dist += metri
    this.v = Math.min(this.regole.punta, this.v + dt * this.regole.spinta)
    this.corsiaX += (this.corsia - this.corsiaX) * Math.min(1, dt * 12)
    this.scossa = Math.max(0, this.scossa - dt * 45)

    this.generaAvanti()
    this.sparatoria(metri)

    for (const e of this.cose) {
      if (e.fatto || e.z - this.dist > 0.5) continue
      e.fatto = true
      this.attraversa(e)
      if (this.finita || this.inPausa) return
    }
    this.cose = this.cose.filter(e => e.z - this.dist > -3)

    for (const c of this.colpi) { c.z += 42 * dt; c.meta -= metri }
    this.colpi = this.colpi.filter(c => c.z < c.meta)

    if (this.truppa <= 0) {
      if (!this.causa) this.causa = 'la truppa è finita'
      this.finisci('persa')
    }
  }

  finisci(esito) {
    if (this.finita) return
    this.esito = esito
    this.segnala(esito === 'vinta' ? 'vittoria' : 'fine')
  }

  // sempre una quarantina di metri più avanti dello sguardo, e mai oltre
  // il traguardo
  generaAvanti() {
    const r = this.regole
    const fine = r.infinita ? Infinity : r.metri - r.fraCancelli * 0.5
    let giri = 0
    while (this.prossima < this.dist + ORIZZONTE && this.prossima < fine && giri++ < 40)
      this.generaPezzo()
  }

  // con quanti soldati si arriverà fin lì, nel caso peggiore e nel
  // migliore: i cancelli in volo sono già tutti generati, quindi il
  // conto è esatto e non una stima
  previsione() {
    const tetto = this.regole.tetto
    let min = this.truppa, max = this.truppa
    for (const c of this.cose) {
      if (c.tipo !== 'cancelli' || c.fatto) continue
      const v = c.ops.flatMap(o => [resaPrevista(o)(min), resaPrevista(o)(max)])
      min = Math.min(...v, tetto)
      max = Math.min(Math.max(...v), tetto)
    }
    return { min: Math.max(1, min), max: Math.max(1, max) }
  }

  generaPezzo() {
    const r = this.regole
    const { min, max } = this.previsione()

    if (this.daScontro >= r.fraScontri) {
      this.daScontro = 0
      // la vita del mostro sta fra il peggio e il meglio, in proporzione
      // (qui si moltiplica: la metà aritmetica sarebbe quasi il massimo)
      const base = Math.max(2, Math.round(min * Math.pow(max / Math.max(1, min), 0.42)))
      // ogni quarto scontro è un boss, ma mai più di quanto la truppa
      // possa diventare — durante l'avvicinamento il mostro spara e la
      // truppa si consuma, quindi il tetto del boss è sotto il massimo teorico
      const boss = ++this.scontri % 4 === 0
      const quanti = Math.max(2, Math.min(boss ? Math.round(base * 1.9) : base,
                                          Math.round(max * (boss ? 0.72 : 0.82))))
      this.cose.push({ tipo: 'nemici', z: this.prossima, quanti, vita: quanti, boss, fatto: false })
      this.prossima += r.fraCancelli * (boss ? 2 : 1.45)
      return
    }

    this.daScontro++
    const mezzo = Math.round((min + max) / 2)
    this.cose.push({
      tipo: 'cancelli', z: this.prossima, fatto: false,
      ops: generaCancelli(mezzo, { rnd: this.rnd, libri: r.libri, tetto: r.tetto }),
    })

    // fra un cancello e l'altro le mani devono fare qualcosa: un cono da
    // scansare e una cassa da prendere
    for (let i = 0; i < r.coni; i++)
      this.cose.push({ tipo: 'cono', z: this.prossima + this.fra(4, r.fraCancelli - 3),
                       corsia: this.fra(-1, 1), fatto: false })
    if (this.rnd() < 0.65)
      this.cose.push({ tipo: 'cassa', z: this.prossima + this.fra(5, r.fraCancelli - 3),
                       corsia: this.fra(-1, 1), quanti: Math.max(1, tondo(mezzo, 0.06)), fatto: false })

    this.prossima += r.fraCancelli
  }

  fra(a, b) { return a + Math.floor(this.rnd() * (b - a + 1)) }

  attraversa(e) {
    const qui = Math.round(this.corsiaX)

    if (e.tipo === 'traguardo') return this.finisci('vinta')

    if (e.tipo === 'cancelli') {
      const op = e.ops[qui + 1]
      const prima = this.truppa
      this.cancelli++
      // si guarda prima di applicare, sul valore nominale: chi prende
      // l'oro conta come scelta giusta anche se poi sbaglia l'esercizio,
      // chi tira dritto si confronta solo con i due cancelli normali
      const dove = o => Math.min(this.regole.tetto, o.f(prima))
      const migliore = op.libro
        ? dove(op)
        : Math.max(...e.ops.filter(o => !o.libro).map(dove))
      if (dove(op) === migliore) this.meglio++

      if (op.libro) {
        this.libriProvati++
        this.offerta = { seg: op.seg, f: op.f, prima }
        this.segnala('libro')
        return
      }
      this.applica(op.f(prima))
      this.segnala(this.truppa > prima ? 'meglio' : 'peggio')
      return
    }

    if (e.tipo === 'nemici') {
      // il conto è già stato fatto durante l'avvicinamento: qui si tira solo la riga
      if (e.vita <= 0) {
        this.vinti++
        this.segnala('abbattuto')
        return
      }
      const resta = Math.ceil(e.vita)
      const persi = Math.min(this.truppa, resta * PEDAGGIO)
      this.causa = `${e.boss ? 'un boss' : 'un mostro'} da ${e.quanti}: ` +
                   `era ancora in piedi con ${resta}, e te ne ha presi ${persi}`
      this.persi++
      this.truppa -= persi
      this.scossa = 20
      this.segnala('colpito')
      return
    }

    if (e.tipo === 'cassa') {
      if (e.corsia !== qui) return
      this.applica(this.truppa + e.quanti)
      this.segnala('cassa')
      return
    }

    if (e.tipo === 'cono') {
      if (e.corsia !== qui) return
      this.truppa = Math.max(0, this.truppa - 1)
      this.scossa = 14
      this.segnala('cono')
      if (this.truppa <= 0) this.causa = 'un cono, con un soldato solo rimasto'
    }
  }

  // il tetto della truppa: quelli in più restano fuori (diventavano monete,
  // e non pagavano nessun esercizio: docs/corsa/regole.md)
  applica(n) {
    this.truppa = Math.min(this.regole.tetto, Math.max(0, Math.floor(n)))
  }

  // la truppa spara da sola per tutto l'avvicinamento: il numero è la
  // potenza di fuoco, e finché il mostro è in piedi spara anche lui
  sparatoria(metri) {
    if (metri <= 0) return
    const bersaglio = this.cose.find(e => e.tipo === 'nemici' && !e.fatto &&
                                          e.z - this.dist <= INGAGGIO && e.z - this.dist > 0)
    if (!bersaglio || bersaglio.vita <= 0) return

    bersaglio.vita -= this.truppa * metri / INGAGGIO
    if (bersaglio.vita <= 0) {
      bersaglio.vita = 0
      this.segnala('caduto')
    }

    this.daColpo += metri
    if (this.daColpo > 0.55) {
      this.daColpo = 0
      this.colpi.push({ z: 0.5, corsia: this.corsiaX + (this.rnd() - 0.5) * 0.5,
                        meta: bersaglio.z - this.dist })
      this.segnala('sparo')
    }
  }

  // si risponde da fermi: sbagliare non toglie niente, si è perso solo
  // il tempo di provarci
  rispondi(giusto) {
    const o = this.offerta
    if (!o) return null
    this.offerta = null
    if (giusto) {
      this.libriGiusti++
      this.applica(o.f(o.prima))
      this.segnala('meglio')
    } else {
      this.segnala('peggio')
    }
    return { giusto, prima: o.prima, dopo: this.truppa }
  }

  // fatti già decisi, mai regole: chi disegna non sa cosa sia un
  // esercizio o il raggruppamento
  scena() {
    const cose = []
    for (const e of this.cose) {
      const z = e.z - this.dist
      if (z < -1.2 || z > ORIZZONTE) continue
      if (e.tipo === 'cancelli') {
        cose.push({ che: 'cancelli', z, passato: e.fatto, ops: e.ops.map(o => ({
          // si consegna il conto e basta: il "buono" lo deve ricavare il
          // bambino, dirlo qui risolverebbe il gioco un fotogramma prima
          testo: o.seg, oro: !!o.libro,
        })) })
      } else if (e.tipo === 'nemici') {
        // un mostro abbattuto sparisce subito: restare in scena a vita
        // zero lo farebbe sembrare ancora un ostacolo
        if (e.vita <= 0) continue
        cose.push({ che: 'nemici', z, quanti: e.quanti, boss: e.boss,
                    quota: e.vita / e.quanti, resta: Math.ceil(e.vita) })
      } else if (e.tipo === 'traguardo') {
        cose.push({ che: 'traguardo', z })
      } else {
        cose.push({ che: e.tipo, z, corsia: e.corsia, quanti: e.quanti })
      }
    }
    // il cancello attivo è il primo non ancora attraversato (non il più
    // vicino): quello appena passato resta in scena un metro o due mentre sfila via
    const attivo = cose.filter(c => c.che === 'cancelli' && !c.passato)
      .sort((a, b) => a.z - b.z)[0]
    if (attivo) attivo.attivo = true

    return {
      veste: this.regole.veste,
      dist: this.dist, corsia: this.corsiaX, scossa: this.scossa,
      spinta: this.spintaOra - 1,   // quanto sta spingendo davvero (zero davanti a un cancello)
      truppa: this.truppa, soldati: figure(this.truppa),
      cose: cose.sort((a, b) => b.z - a.z),
      colpi: this.colpi.map(c => ({ z: c.z, corsia: c.corsia })),
    }
  }

  get cruscotto() {
    // l'avviso parla solo di chi è ancora in piedi
    const avanti = this.cose.filter(c => c.tipo === 'nemici' && !c.fatto && c.vita > 0)
      .sort((a, b) => a.z - b.z)[0]
    return {
      truppa: this.truppa,
      gruppi: scomponi(this.truppa),
      piena: this.truppa >= this.regole.tetto,
      metri: Math.floor(this.dist),
      restano: Math.max(0, Math.ceil(this.restano)),
      infinita: this.regole.infinita,
      quota: this.regole.infinita ? 0 : Math.min(1, this.dist / this.regole.metri),
      vinti: this.vinti,
      // l'avviso arriva presto apposta: sapere in anticipo del mostro
      // rende la scelta del cancello una decisione, non un riflesso
      mostro: avanti && avanti.z - this.dist < 44
        ? { quanti: avanti.quanti, boss: avanti.boss, fra: Math.ceil(avanti.z - this.dist) }
        : null,
    }
  }
}
