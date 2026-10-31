// La discesa con più alleati (docs/sotterraneo/in-due.md): metodi di Corsa (`Object.assign(Corsa.prototype, ...)` in fondo a
// corsa.js), che il codice di sempre chiama quando `persone` ne ha più di una. Da soli girano solo `idInFila`, `tocca` e
// `tuaDelBottino`, che lì fanno quello di sempre. Gira in Node.
import { Corredo } from './corredo.js'
import { CAMPI_DELLA_PERSONA } from './persone.js'
import { primaLibera } from '../../../motore/passi.js'
import { ipot } from '../../../motore/conti-uguali.js'
import { RIPOSO_SCALA, VITA_PER_PIANO } from '../dati/mondo.js'
import { togli, attesaDi, chiAgisce } from './turni.js'

// quante celle (in largo e in profondo, sulla mappa) un eroe può stare dal compagno: tutti e due nello schermo del 3D
export const LONTANO = 11

// i campi della discesa con cui nasce un alleato (gli stessi del costruttore di Corsa: unita/sotterraneo-in-due lo controlla)
const ALL_INIZIO = () => ({
  vitaPiu: 0, espPresa: 0, eventi: [], trovati: new Set(), stanzaOra: null, foglio: null, energiaResto: 0, camminati: 0,
  manaCammino: 0, preparati: [], pronta: null, fiatoUsato: false, chiesta: null, contaChieste: 0, svenimenti: 0, svenimentiQui: 0,
  cureRifiutate: 0, cureTrovate: {}, ultimoSvenimento: false, domande: 0, giuste: 0, aTerra: false,
})

const cellaDi = e => ({ x: Math.floor(e.x), y: Math.floor(e.y) })
// l'istante del prossimo turno di un attore della fila (motore/turni.js)
const quando = a => (a.fatti + 1) * attesaDi(a.velocita)

export const MetodiInDue = {
  /* ═══════════ gli alleati ═══════════ */

  // un alleato in più, col suo eroe, la sua roba e la sua crescita, accanto al primo. Torna il suo indice
  aggiungiAlleato({ eroe, roba = null, crescita = null, nome = '' }) {
    const c = new Corredo({ eroe, roba, crescita })
    const p = {}
    for (const k of CAMPI_DELLA_PERSONA) if (Object.prototype.hasOwnProperty.call(c, k)) p[k] = c[k]
    this.persone.push(p)
    const i = this.persone.length - 1
    this.come(i, () => {
      for (const [k, v] of Object.entries(ALL_INIZIO())) this[k] = v
      this.nome = nome
      this.mettiAccanto(this.persone[0])
      this.accendiDallaCintura()
      this.sistemaIlCorredo()
      this.vita = this.vitaMax
      this.energia = this.energiaMax
    })
    this.aggiornaLuce()
    return i
  },

  indiceDi(p = this.persona) { return this.persone.indexOf(p) },

  // l'eroe di adesso nella prima cella libera accanto a `chi` (mai sopra un altro alleato), fermo e voltato a destra
  mettiAccanto(chi) {
    const occupata = (x, y) => this.persone.some(p => p !== this.persona && p.eroe && Math.floor(p.eroe.x) === x && Math.floor(p.eroe.y) === y)
    const da = cellaDi(chi.eroe)
    const dove = primaLibera((x, y) => this.libera(x, y) && !this.bloccata(x, y) && !occupata(x, y), da, 3) || da
    this.eroe = { x: dove.x + 0.5, y: dove.y + 0.5 }
    this.guarda = 'dx'
    this.verso = null
    this.strada = null; this.mira = null; this.bersaglio = null
    this.segnaLaStanza()
  },

  // dopo un piano nuovo (o una risalita) gli altri compaiono accanto al primo
  metteGliAltri() {
    for (let i = 1; i < this.persone.length; i++) this.come(i, () => this.mettiAccanto(this.persone[0]))
  },

  // il nome di un altro alleato, per i fumetti («non mi allontano da Leo»)
  nomeDellAltro() {
    const altro = this.persone.find(p => p !== this.persona)
    return (altro && altro.nome) || 'il compagno'
  },

  /* ═══════════ il mondo ═══════════ */

  scontroAperto() { return this.persone.some(p => p.foglio && p.foglio.che === 'scontro') },

  // il mondo non si ferma per una domanda: si ferma solo per lo scontro, che è di tutti. Chi ha un foglio aperto resta fermo
  passoInDue(dt) {
    if (this.finita || this.scontroAperto()) return
    const t = Math.min(0.05, dt)
    this.muoviMostri(t)
    for (let i = 0; i < this.persone.length; i++) {
      if (this.finita || this.scontroAperto()) return
      if (!this.persone[i].foglio) this.come(i, () => this.muoviEroe(t))
    }
  },

  // ogni mostro va verso il più vicino degli alleati nella sua stanza; chi sta rispondendo non lo tocca (muoviUnMostro)
  muoviMostriInDue(dt) {
    const stanze = this.persone.map(p => { const c = cellaDi(p.eroe); return this.livello.stanzaDi(c.x, c.y) })
    for (const m of this.livello.robe) {
      if (m.che !== 'mostro' || m.morto) continue
      if (m.fx == null) { m.fx = m.x + 0.5; m.fy = m.y + 0.5; m.casa = { x: m.x, y: m.y }; m.calmo = 0 }
      const sua = this.livello.stanzaDi(m.casa.x, m.casa.y)
      let chi = 0, meglio = Infinity
      this.persone.forEach((p, i) => {
        if (!sua || stanze[i] !== sua || p.aTerra) return
        const d = ipot(m.fx - p.eroe.x, m.fy - p.eroe.y)
        if (d < meglio) { meglio = d; chi = i }
      })
      if (this.come(chi, () => this.muoviUnMostro(m, dt, stanze[chi]))) return
    }
  },

  // la luce è l'unione dei coni: in ogni cella la più forte
  aggiornaLuceDiTutti() {
    const tutte = new Map()
    this._unaLuce = true
    try {
      for (let i = 0; i < this.persone.length; i++) this.come(i, () => {
        this.aggiornaLuce()
        for (const [k, f] of this.forzaLuce) if (f > (tutte.get(k) || 0)) tutte.set(k, f)
      })
    } finally { this._unaLuce = false }
    this.luce = new Set(tutte.keys())
    this.forzaLuce = tutte
  },

  // la cella `c` porterebbe l'eroe di adesso a più di LONTANO celle da un altro alleato in piedi
  troppoLontano(c) {
    return this.persone.some(p => p !== this.persona && !p.aTerra &&
      (Math.abs(c.x + 0.5 - p.eroe.x) > LONTANO || Math.abs(c.y + 0.5 - p.eroe.y) > LONTANO))
  },
  fermatiQui() {
    this.strada = null; this.mira = null; this.bersaglio = null
    this.dillo(`non mi allontano da ${this.nomeDellAltro()}`)
  },

  /* ═══════════ la scala: si scende e si sale insieme ═══════════ */

  // chi ha detto sì aspetta alla scala (un foglio: è al riparo); quando ci sono tutti, si va
  aspettaGliAltri(perche) {
    this.foglio = { che: 'aspetta', perche, chi: this.nomeDellAltro() }
    this.chiesta = null
    return this.persone.every(p => p.foglio && p.foglio.che === 'aspetta' && p.foglio.perche === perche)
  },
  nonAspettoPiu() {
    if (this.foglio && this.foglio.che === 'aspetta') this.foglio = null
  },

  scendiInDue() {
    if (!this.foglio || this.foglio.che !== 'scala') return null
    if (!this.aspettaGliAltri('scala')) return { che: 'aspetta' }
    const nuovo = this.piano + 1 > this.fondo
    const ultimo = this.piano >= this.quantiPiani - 1
    if (nuovo || ultimo) this.pianiFatti++
    if (ultimo) {
      this.finita = true
      this.vinta = true
      for (const p of this.persone) { p.foglio = null; p.chiesta = null }
      return { che: 'finita' }
    }
    this.lasciaIlPiano()
    this.piano++
    for (let i = 0; i < this.persone.length; i++) this.come(i, () => {
      if (nuovo) {
        this.svenimentiQui = 0
        this.vitaPiu += VITA_PER_PIANO
        this.vita = Math.min(this.vitaMax, this.vita + RIPOSO_SCALA)
      }
      this.foglio = null
      this.chiesta = null
    })
    this.entraInsieme('sopra')
    return { che: 'sceso', piano: this.piano }
  },

  saliInDue() {
    if (!this.foglio || this.foglio.che !== 'scala-su' || this.piano === 0) return null
    if (!this.aspettaGliAltri('sali')) return { che: 'aspetta' }
    this.lasciaIlPiano()
    this.piano--
    for (const p of this.persone) { p.foglio = null; p.chiesta = null }
    this.entraInsieme('sotto')
    return { che: 'salito', piano: this.piano }
  },

  // il primo entra nel piano come da solo (la luce solo sua, o segnerebbe le celle dove gli altri stavano di sopra), gli altri accanto
  entraInsieme(dal) {
    this._unaLuce = true
    try { this.come(0, () => this.entraNelPiano({ dal })) } finally { this._unaLuce = false }
    this.metteGliAltri()
    this.aggiornaLuce()
  },
  /* ═══════════ lo scontro: di tutti, ognuno coi suoi turni ═══════════ */

  // il posto dell'alleato `i` nella fila dei turni: il primo è 'eroe' come da soli, gli altri 'eroe1', 'eroe2'
  idInFila(i = this.indiceDi()) { return i <= 0 ? 'eroe' : `eroe${i}` },
  indiceDellId(id) { return id === 'eroe' ? 0 : Number(String(id).slice(4)) },

  // comincia il turno dell'eroe a cui tocca (da soli, l'unico)
  // (in due la domanda è solo di chi tocca: quella di chi ha appena risposto si spegne)
  tocca(f) {
    if (!f.ioDi) return this.iniziaTurnoEroe(f)
    for (const p of this.persone) if (p.foglio === f) p.chiesta = null
    return this.come(f.diTurno ?? this.indiceDi(), () => this.iniziaTurnoEroe(f))
  },
  // in due si gioca solo al proprio turno
  nonTocca(f) { return !!(f && f.ioDi && f.diTurno != null && f.diTurno !== this.indiceDi()) },

  // lo scontro appena aperto da chi è adesso diventa di tutti: ognuno ha il suo stato dello scontro (`io`: scudo, parata, gelo…), e
  // chi non ha un foglio aperto è tirato dentro subito; chi sta rispondendo entra quando ha finito (dopoChiuso)
  apriLoScontroInDue(f) {
    f.ioDi = this.persone.map(p => (p === this.persona ? f.io : {}))
    Object.defineProperty(f, 'io', { get: () => f.ioDi[this.indiceDi()], enumerable: true, configurable: true })
    this.persone.forEach((p, i) => { if (p !== this.persona && !p.foglio) this.entraNelloScontro(f, i) })
  },

  // l'alleato `i` entra nello scontro `f`: il suo posto nella fila, al primo turno che gli tocca da adesso
  entraNelloScontro(f, i) {
    this.come(i, () => {
      this.foglio = f
      this.chiesta = null
      this.strada = null; this.mira = null; this.bersaglio = null
      this.pronta = null
      const velocita = this.velocita, ora = f.coda.length ? Math.min(...f.coda.map(quando)) : 0
      // `fatti` tale che il suo prossimo turno cada adesso o subito dopo: chi arriva a scontro aperto non salta la fila
      const fatti = Math.max(0, Math.ceil(ora / attesaDi(velocita) - 1e-9) - 1)
      f.coda = [...f.coda, { id: this.idInFila(i), lato: 'eroe', velocita, fatti }]
      f.partiti = [...(f.partiti || []), ...(this.apriConIPreparati(f) || [])]
    })
  },

  // chi è nello scontro aperto (anche a terra): l'esperienza va a tutti loro. Fuori dallo scontro, chi è adesso
  chiCombatte() {
    const f = this.persone.map(p => p.foglio).find(x => x && x.che === 'scontro')
    return f ? this.persone.map((p, i) => (p.foglio === f ? i : -1)).filter(i => i >= 0) : [this.indiceDi()]
  },

  // il mostro colpisce l'alleato col peso più alto: quanto gli fa male a turno (il colpo di quell'eroe contro di lui) per la vita
  // che gli resta in proporzione. Il più forte prende i primi colpi, e quando è ferito tocca all'altro (docs/sotterraneo/in-due.md)
  bersaglioDelMostro(f, x) {
    let chi = this.indiceDi(), peso = -1
    this.persone.forEach((p, i) => {
      if (p.foglio !== f || p.aTerra) return
      const q = this.come(i, () => this.colpo(x) * this.vita / Math.max(1, this.vitaMax))
      if (q > peso) { peso = q; chi = i }
    })
    return chi
  },
  colpisceIlPiuForte(f, x) {
    const i = this.bersaglioDelMostro(f, x)
    return this.come(i, () => this.turnoDelMostro(x)).map(e => (e.contro === 'eroe' ? { ...e, persona: i } : e))
  },

  restaInPiedi(f) { return this.persone.some(p => p !== this.persona && p.foglio === f && !p.aTerra) },
  // a terra fino alla fine dello scontro: fuori dalla fila, niente domanda
  cadeATerra(f) {
    this.aTerra = true
    this.chiesta = null
    f.coda = togli(f.coda, this.idInFila())
    if (f.diTurno === this.indiceDi()) { const a = chiAgisce(f.coda); f.diTurno = a && a.lato === 'eroe' ? this.indiceDellId(a.id) : f.diTurno }
    this.dillo('a terra: ti rialzi a fine scontro')
  },
  // cade l'ultimo in piedi: svengono tutti, come da soli
  sviengonoTutti(f) {
    this.persone.forEach((p, i) => { if (p.foglio === f) this.come(i, () => { this.aTerra = false; this.svieni() }) })
  },

  // un foglio chiuso: se era lo scontro si chiude per tutti (chi era a terra si rialza con un quarto della vita); se no, chi l'ha
  // chiuso entra nello scontro aperto dagli altri, se ce n'è uno
  dopoChiuso(f) {
    if (f && f.che === 'scontro') {
      this.persone.forEach((p, i) => {
        if (p.foglio !== f && !(p === this.persona)) return
        this.come(i, () => {
          if (this.foglio === f) { this.foglio = null; this.chiesta = null }
          if (this.aTerra) { this.aTerra = false; this.vita = Math.max(1, Math.round(this.vitaMax / 4)) }
        })
      })
      return
    }
    const aperto = this.persone.map(p => p.foglio).find(x => x && x.che === 'scontro')
    if (aperto) this.entraNelloScontro(aperto, this.indiceDi())
  },

  /* ═══════════ il bottino: una caduta per uno ═══════════ */

  // `tua` delle pesche del bottino: da soli la roba che l'eroe porta; in due ogni caduta si pesca per uno, a turno
  tuaDelBottino() {
    if (this.persone.length === 1) return k => this.porta(k)
    const i = this.cadute = ((this.cadute || 0) + 1) % this.persone.length
    return k => this.come(i, () => this.porta(k))
  },
}
