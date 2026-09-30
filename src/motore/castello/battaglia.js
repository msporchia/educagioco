// La battaglia: l'orchestratore. Le regole di dettaglio stanno nelle cose
// che scendono in campo (Nemico, Torre, Colpo, Percorso, Ondate,
// Tabellone); questa classe decide solo l'ordine in cui succedono e quando
// la partita finisce. Gira uguale nel gioco e in Node (vedi
// strumenti/simula-castello.mjs): non sa cosa sia un'operazione in colonna,
// non disegna, non salva niente.
import { CFG, doniDi, regaloDi, quantiRegali, OGNI_REGALO, premioDellaFretta }
  from '../../data/castello.js'
import { ABILITA, CAPO } from '../../data/mostri.js'
import { Percorso } from './percorso.js'
import { sullaCarta } from './carta.js'
import { Ondate } from './ondate.js'
import { Tabellone } from './tabellone.js'
import { Nemico } from './nemico.js'
import { Torre } from './torre.js'
import { Schizzo } from './schizzo.js'

const zitto = () => {} // niente da fare, ma senza far crollare chi chiama

export const PREAVVISO = 3

export class Battaglia {
  constructor({ tappa, misure, stato, eventi = {}, regali = null }) {
    this.tappa = tappa
    this.misure = misure

    // la tappa che non prevede regali non ne riceve nemmeno uno: è la riga
    // che tiene la campagna tarata
    this.regali = tappa.regali ? { ...(regali || {}) } : {}
    this.doni = doniDi(this.regali)
    this.daScegliere = 0

    // si gioca sulla carta a scacchiera, non sullo schizzo della tappa
    const { forme, posti } = sullaCarta(tappa)
    this.percorso = new Percorso(forme, posti, misure)
    this.ondate = new Ondate(tappa)
    this.tabellone = new Tabellone(stato)

    this.avvisa = eventi.avvisa || zitto
    this.suona = eventi.suona || zitto
    this.segna = eventi.segna || zitto

    this.nemici = []; this.torri = []; this.colpi = []; this.schizzi = []
    this.nati = []                     // i pezzi di chi si è diviso, in campo al prossimo passo
    this.daGenerare = 0; this.prossimo = 0; this.pausa = 0; this.tempo = 0
    this.usciti = 0                    // quanti sono entrati: serve ad alternare gli ingressi
    // le ondate ancora aperte, { onda: pulita }: un'ondata finisce quando se
    // n'è andato l'ultimo dei suoi, non quando il campo è pulito
    this.aperte = new Map()
    this.finito = null                 // 'vinta' | 'persa' quando la partita è chiusa
    this.bestia = this.ondate.bestiaDi(1)
  }

  ridimensiona(nuove) {
    this.misure = nuove
    this.percorso.ridimensiona(nuove)
  }

  inizia() {
    this.tabellone.azzera(this.tappa.partenza)
    this.nemici = []; this.torri = []; this.colpi = []; this.schizzi = []; this.nati = []
    this.daGenerare = 0; this.prossimo = 0; this.pausa = 0; this.tempo = 0
    this.usciti = 0
    this.aperte = new Map()
    this.finito = null
    this.daScegliere = 0
    this.bestia = this.ondate.bestiaDi(1)
  }

  // Uno ogni OGNI_REGALO ondate: l'ondata non parte finché ce n'è uno in
  // sospeso, così un regalo rimandato non si perde e non ne diventa due.
  prendiRegalo(id) {
    if (!this.tappa.regali || !regaloDi(id)) return null
    this.regali[id] = (this.regali[id] || 0) + 1
    this.doni = doniDi(this.regali)
    // le torri già in piedi ci guadagnano subito
    for (const t of this.torri) t.doni = this.doni
    if (this.daScegliere > 0) this.daScegliere--
    this.suona('livello')
    return this.regali
  }

  get regaliDaScegliere() { return this.daScegliere }
  get regaliPresi() { return quantiRegali(this.regali) }

  nuovaOnda(extra = '') {
    const o = this.tabellone.ondaNuova()
    this.bestia = this.ondate.bestiaDi(o)
    this.segna('ondate')
    this.segna('onda-massima', o)
    this.daGenerare = this.ondate.quantiDi(o)
    this.prossimo = 0; this.pausa = 0
    this.aperte.set(o, true)
    const chi = this.bestia.capo ? ` · arriva il capo: ${this.bestia.nome} gigante`
      : this.bestia.con ? ` · ${this.bestia.nome} e ${this.bestia.con.nome} insieme` : ''
    this.avvisa((this.ondate.ultima(o) ? 'Ultima ondata!' : 'Ondata ' + o) + chi + extra)
    this.suona('livello')
  }

  // il campo è pulito e c'è qualcosa che difende: l'ondata può partire
  inAttesa() {
    return !!this.torri.length && !this.nemici.length && this.daGenerare === 0 &&
           !this.finito && this.tabellone.onda < this.tappa.ondate
  }

  // Chiamare la prossima prima del tempo (come in Kingdom Rush): non mentre
  // l'ondata sta ancora uscendo dalla bocca, e mai con un regalo da
  // scegliere. Il premio è il tempo risparmiato (`premioDellaFretta`).
  puoiChiamare() {
    return !!this.torri.length && this.daGenerare === 0 && this.daScegliere === 0 &&
           !this.finito && this.tabellone.onda < this.tappa.ondate
  }
  risparmiati() {
    const attesa = Math.max(0, this.tappa.attesa - (this.nemici.length ? 0 : this.pausa))
    let camminare = 0
    for (const n of this.nemici) {
      const vel = Math.max(1, n.vel)
      camminare = Math.max(camminare, (this.viaDi(n).lunghezza - n.d) / vel + n.aTerra)
    }
    return attesa + camminare
  }
  premioFretta() { return this.puoiChiamare() ? premioDellaFretta(this.risparmiati()) : 0 }
  pronti() { return this.premioFretta() > 0 }
  restaAttesa() { return Math.max(0, Math.ceil(this.tappa.attesa - this.pausa)) }

  chiamaOnda() {
    if (!this.puoiChiamare()) return false
    const premio = this.premioFretta()
    if (premio) { this.tabellone.perFretta(premio); this.suona('moneta') }
    this.nuovaOnda(premio ? ` · subito +${premio} ⚡` : '')
    return true
  }

  // Il preavviso: chi arriva dopo quella in corso. È deterministico, quindi
  // si può dire in anticipo.
  prossime(quante = PREAVVISO) {
    const vie = this.percorso.quanteVie
    const attese = this.ondate.prossime(this.tabellone.onda, quante, vie)
    if (vie < 2) return attese
    // da che parte entrano, detto in parole (la strada non ha un nome, ma
    // un ingresso a destra o a sinistra dell'altro)
    const inizi = this.percorso.vie.map(v => v.inizio.x)
    const piuAsinistra = Math.min(...inizi)
    const lato = k => (inizi[k] <= piuAsinistra ? 'sinistra' : 'destra')
    return attese.map(p => ({ ...p, lato: p.via < 0 ? 'ambo' : lato(p.via) }))
  }

  generaNemico() {
    const o = this.tabellone.onda
    // da che ingresso entra (lo decide l'ondata): con le due bocche insieme
    // si alternano uno per uno, così le due file partono insieme
    const vie = this.percorso.quanteVie
    const scelta = this.ondate.viaDi(o, vie)
    const via = scelta < 0 ? this.usciti % vie : scelta
    this.usciti++
    // in un'ondata mista i due tipi escono alternati (`chiEsce`)
    const k = this.ondate.quantiDi(o) - this.daGenerare
    const b = this.ondate.chiEsce(o, k, this.bestia)
    this.nemici.push(new Nemico({
      d: -this.ondate.sfalsoDi(o, k),
      via, onda: o,
      vita: this.ondate.vitaDi(o),
      vel: this.ondate.velocitaDi(o) * this.misure.S,
      bestia: b.id, vola: !!b.vola, immune: b.immune, abilita: b.abilita,
      capo: !!b.capo, taglia: b.capo ? CAPO.taglia : 1, paga: this.ondate.pagaDi(o),
    }))
  }

  // Chi cade paga quanto vale; se si divide i pezzi si spartiscono la sua
  // paga, così un'ondata di slime non lascia più energia di un'altra.
  caduto(n) {
    const div = ABILITA.dividi
    if (n.abilita === 'dividi' && !n.pezzo) {
      for (let k = 0; k < div.quanti; k++) {
        const scarto = (k - (div.quanti - 1) / 2) * 9 * this.misure.S
        this.nati.push(new Nemico({
          d: Math.max(0, n.d + scarto), via: n.via, onda: n.onda,
          vita: n.vitaMax * div.vita, vel: n.vel, bestia: n.bestia, vola: n.vola,
          immune: n.immune, paga: n.paga / div.quanti, taglia: n.taglia * div.taglia,
          pezzo: true,
        }))
      }
      const p = this.viaDi(n).puntoA(n.d)
      this.schizzi.push(new Schizzo({ x: p.x, y: p.y, max: 16 * this.misure.S,
                                      tipo: null, dividi: true, cresce: 6, spegne: 2.5 }))
      this.suona('colpito')
      return
    }
    this.tabellone.ucciso()
    this.tabellone.perNemico(this.doni.perNemico, n.paga)
  }

  // Dove nasce una torre: dove l'ha messa il dito, se l'ha detto. Chi non
  // lo dice (simulatore, taratore, test) prende l'ordine di sempre,
  // dall'ingresso verso il castello: è la partita su cui la tappa è tarata.
  costruisci(tipo, { prezzo = 0, penale = 0, posto = null } = {}) {
    this.tabellone.paga(prezzo + penale)
    this.pausa = 0                     // ha appena fatto qualcosa: l'attesa riparte
    const posti = this.percorso.postazioni
    const scelto = posto != null && this.libera(posto) ? posto
                                                       : this.liberi()[0] ?? 0
    const dove = posti[scelto]
    const torre = new Torre({ x: dove.x, y: dove.y, tipo, doni: this.doni })
    this.torri.push(torre)
    this.tabellone.torreNuova()
    this.segna('torri')
    this.suona('compra')
    return torre
  }

  potenzia(torre, { prezzo = 0, penale = 0, ramo = null } = {}) {
    this.tabellone.paga(prezzo + penale)
    this.pausa = 0
    torre.sale(ramo)
    return torre
  }

  // Spostare una torre si paga qui, qualunque sia il gesto che l'ha
  // causato. `false` se non si può (energia, piazzola occupata).
  sposta(torre, posto) {
    if (!torre || !this.libera(posto, torre)) return false
    // rimetterla dov'è già non è uno spostamento: non si paga per aver cambiato idea
    if (this.postoDi(torre) === posto) return true
    if (this.tabellone.energia < CFG.spostamento) return false
    const p = this.percorso.postazioni[posto]
    if (!p) return false
    this.tabellone.paga(CFG.spostamento)
    torre.sposta(p.x, p.y)
    this.pausa = 0
    this.suona('compra')
    return true
  }

  // Una piazzola è presa se ci sta sopra una torre (sulla posizione, non su
  // un indice: le torri si spostano col dito). `salvo` è la torre che si ha
  // già in mano: la piazzola da cui l'ha sollevata resta libera.
  libera(i, salvo = null) {
    const p = this.percorso.postazioni[i]
    if (!p) return false
    return !this.torri.some(t => t !== salvo && Math.hypot(t.x - p.x, t.y - p.y) < 2)
  }
  liberi(salvo = null) {
    return this.percorso.postazioni.map((_, i) => i).filter(i => this.libera(i, salvo))
  }
  postoDi(torre) {
    return this.percorso.postazioni.findIndex(p => Math.hypot(torre.x - p.x, torre.y - p.y) < 2)
  }

  // `calcolando`: il campo va avanti lo stesso, ma il conto dell'attesa no
  // (chi sta calcolando non viene mai messo sotto pressione).
  avanza(dt, calcolando = false) {
    if (this.finito) return this.finito
    this.tempo += dt

    const fine = this.scorriIlTempo(dt, calcolando)
    if (fine) return fine

    const caduto = this.muoviNemici(dt)
    if (caduto) return caduto

    this.faiFuoco(dt)
    this.muoviColpi(dt)
    if (this.nati.length) { this.nemici.push(...this.nati); this.nati = [] }
    this.schizzi = this.schizzi.filter(s => s.avanza(dt))
    return null
  }

  scorriIlTempo(dt, calcolando) {
    if (this.daGenerare > 0) {
      this.prossimo -= dt
      if (this.prossimo <= 0) {
        this.generaNemico(); this.daGenerare--
        // il passo fino al prossimo segue il ritmo dell'ondata (`ritmoDi`)
        const o = this.tabellone.onda
        this.prossimo = this.ondate.intervalloDi(o) *
          this.ondate.ritmoDi(o, this.ondate.quantiDi(o) - this.daGenerare - 1)
      }
    }
    this.chiudiLeOndate()
    if (this.daGenerare > 0 || this.nemici.length || this.nati.length || !this.torri.length) return null

    // campo pulito: il gioco non manda l'ondata da solo, aspetta il bambino
    if (!calcolando) this.pausa += dt
    if (this.tabellone.onda >= this.tappa.ondate && this.pausa > CFG.respiro) return this.chiudi('vinta')
    // col regalo da scegliere l'ondata non parte, nemmeno da sola
    if (this.daScegliere > 0) return null
    // stare fermi non è una strategia: passato il tempo, i nemici arrivano lo stesso
    if (this.pausa >= this.tappa.attesa) this.nuovaOnda()
    return null
  }

  // Un'ondata è finita quando se n'è andato l'ultimo dei suoi: di solito
  // coincide col campo pulito, ma con la chiamata in anticipo no.
  chiudiLeOndate() {
    for (const [o, pulita] of this.aperte) {
      if (o === this.tabellone.onda && this.daGenerare > 0) continue
      if (this.nemici.some(n => n.onda === o) || this.nati.some(n => n.onda === o)) continue
      this.aperte.delete(o)
      const premio = this.tabellone.perOnda(pulita)
      this.avvisa(pulita ? `Ondata pulita +${premio} ⚡` : `Ondata finita +${premio} ⚡`)
      this.suona('moneta')
      // e ogni tanto un regalo, che è l'altra cosa che la partita libera
      // ha da dare: un potenziamento che resta anche domani
      if (this.tappa.regali && o % OGNI_REGALO === 0) this.daScegliere++
    }
  }

  muoviNemici(dt) {
    for (const n of this.nemici) n.cammina(dt, this.viaDi(n).lunghezza)
    for (const n of this.nemici) {
      if (!n.arrivato) continue
      if (this.aperte.has(n.onda)) this.aperte.set(n.onda, false)
      this.suona('no')
      for (let k = 0; k < (n.capo ? CAPO.cuori : 1); k++)
        if (this.tabellone.cuoreVia()) return this.chiudi('persa')
    }
    // chi è caduto camminando è caduto di veleno (o fuoco): vale come
    // un'uccisione, o il ramo del veleno regalerebbe morti senza energia
    for (const n of this.nemici)
      if (!n.vivo && !n.arrivato) this.caduto(n)
    this.nemici = this.nemici.filter(n => n.vivo)
    return null
  }

  faiFuoco(dt) {
    const campo = { nemici: this.nemici, via: this.percorso,
                    viaDi: n => this.viaDi(n), S: this.misure.S }
    for (const t of this.torri) {
      const esito = t.agisci(dt, campo)
      if (!esito) continue
      if (esito.colpi) this.colpi.push(...esito.colpi)
      if (esito.schizzi) this.schizzi.push(...esito.schizzi)
      if (esito.sparo) this.suona('sparo')
    }
  }

  muoviColpi(dt) {
    const dove = n => this.viaDi(n).puntoA(n.d)
    // i rimbalzi si mettono in campo *dopo* il giro, non dentro: un colpo
    // nato adesso non deve prendersi anche il tempo di questo fotogramma
    const nati = []
    for (const c of this.colpi) {
      if (!c.avanza(dt)) continue
      const { colpiti, morti, schizzo, rimbalzi } = c.impatto(this.nemici, this.percorso, dove)
      for (const n of morti) this.caduto(n)
      if (schizzo) this.schizzi.push(schizzo)
      if (rimbalzi && rimbalzi.length) nati.push(...rimbalzi)
      if (colpiti) this.suona('colpito')
    }
    this.colpi = this.colpi.filter(c => !c.fatto).concat(nati)
    this.nemici = this.nemici.filter(n => n.vivo)
  }

  chiudi(esito) {
    this.finito = esito
    this.nemici = []; this.colpi = []; this.schizzi = []
    return esito
  }

  // Una fotografia della partita fra un'ondata e l'altra, per il taratore
  // (che riprova la stessa ondata con vite diverse dalle stesse condizioni).
  istantanea() {
    return { stato: this.tabellone.foto(), torri: this.torri.map(t => t.dati()),
             pausa: this.pausa, tempo: this.tempo, aperte: [...this.aperte] }
  }

  riprendi(f) {
    this.tabellone.riprendi(f.stato)
    this.torri = f.torri.map(t => Torre.da({ ...t, doni: this.doni }))
    this.nemici = []; this.colpi = []; this.schizzi = []; this.nati = []
    this.daGenerare = 0; this.prossimo = 0
    this.pausa = f.pausa; this.tempo = f.tempo
    this.aperte = new Map(f.aperte || [])
    this.finito = null
    this.bestia = this.ondate.bestiaDi(Math.max(1, this.tabellone.onda))
  }

  // Da che bocca sta scendendo la roba: quella in corso, o quella che
  // arriverà. -1 vuol dire tutte e due (accende la freccia giusta sul campo).
  get bocca() {
    const vie = this.percorso.quanteVie
    if (vie < 2) return 0
    const inCorso = this.daGenerare > 0 || this.nemici.length > 0
    return this.ondate.viaDi(this.tabellone.onda + (inCorso ? 0 : 1), vie)
  }
  get via() { return this.percorso }
  viaDi(nemico) { return this.percorso.viaN(nemico ? nemico.via : 0) }
  get postazioni() { return this.percorso.postazioni }
  get inArrivo() { return this.daGenerare }
  get ondaChiusa() { return this.aperte.size === 0 }
  get esito() { return this.finito }
}
