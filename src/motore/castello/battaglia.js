/* ═══════════════════════════════════════════════════════════════════
   LA BATTAGLIA — l'orchestratore.

   Qui non c'è nessuna regola di dettaglio: le regole stanno nelle cose
   che scendono in campo — `Nemico` cammina, `Torre` spara, `Colpo`
   ferisce, `Schizzo` sbiadisce, `Percorso` sa dove passa la strada,
   `Ondate` sa chi arriva, `Tabellone` tiene i numeri. Questa classe fa
   l'unica cosa che nessuno di loro può fare da solo: **decidere
   l'ordine in cui succedono le cose**, e dire quando la partita è
   finita.

   Non c'è un contesto 2D, non c'è Vue, non c'è il DOM: gira uguale
   dentro il gioco e dentro Node — ed è la ragione per cui esiste.
   `strumenti/simula-castello.mjs` fa girare *questo stesso codice*
   mille volte al secondo, e il bilanciamento non è più un'opinione: è
   una misura.

   Chi la crea le passa:
     `tappa`    la tappa da giocare (`data/castello.js`)
     `misure`   quanto è largo il campo e quanto vale un'unità: { W, H, S }
     `stato`    l'oggetto dove tenere il conto (vedi `Tabellone`)
     `eventi`   cosa fare quando succede qualcosa: avvisi, suoni,
                contatori del profilo. Il simulatore non ne passa nessuno
     `caso`     da dove escono i numeri a caso. Il gioco usa Math.random,
                il simulatore un seme, così una partita si può rigiocare
                identica

   Quello che la battaglia NON fa: non sa cosa sia un'operazione in
   colonna (chi compra dice quanto paga), non disegna, non salva niente.
   ═══════════════════════════════════════════════════════════════════ */
import { CFG } from '../../data/castello.js'
import { Percorso } from './percorso.js'
import { Ondate } from './ondate.js'
import { Tabellone } from './tabellone.js'
import { Nemico } from './nemico.js'
import { Torre } from './torre.js'

/* niente da fare, ma senza far crollare chi chiama */
const zitto = () => {}

/* quante ondate in anticipo si annunciano: tre è quanto basta per
   decidere cosa costruire senza diventare una tabella da studiare */
export const PREAVVISO = 3

export class Battaglia {
  constructor({ tappa, misure, stato, eventi = {}, caso = Math.random }) {
    this.tappa = tappa
    this.caso = caso
    this.misure = misure

    this.percorso = new Percorso(tappa.forma, tappa.posti, misure)
    this.ondate = new Ondate(tappa)
    this.tabellone = new Tabellone(stato)

    this.avvisa = eventi.avvisa || zitto
    this.suona = eventi.suona || zitto
    this.segna = eventi.segna || zitto
    this.moneta = eventi.moneta || zitto

    this.nemici = []; this.torri = []; this.colpi = []; this.schizzi = []
    this.daGenerare = 0; this.prossimo = 0; this.pausa = 0; this.tempo = 0
    this.ondaChiusa = true; this.ondataPulita = true
    this.finito = null                 // 'vinta' | 'persa' quando la partita è chiusa
    this.bestia = this.ondate.bestiaDi(1)
  }

  /* ── le misure dello schermo ── */
  ridimensiona(nuove) {
    this.misure = nuove
    this.percorso.ridimensiona(nuove)
  }

  /* ── una partita da capo ── */
  inizia() {
    this.tabellone.azzera(this.tappa.partenza)
    this.nemici = []; this.torri = []; this.colpi = []; this.schizzi = []
    this.daGenerare = 0; this.prossimo = 0; this.pausa = 0; this.tempo = 0
    this.ondaChiusa = true; this.ondataPulita = true
    this.finito = null
    this.bestia = this.ondate.bestiaDi(1)
  }

  /* ═══════════ le ondate ═══════════ */
  nuovaOnda(extra = '') {
    const o = this.tabellone.ondaNuova()
    this.bestia = this.ondate.bestiaDi(o)
    this.segna('ondate')
    this.segna('onda-massima', o)
    this.daGenerare = this.ondate.quantiDi(o)
    this.prossimo = 0; this.pausa = 0
    this.ondaChiusa = false; this.ondataPulita = true
    this.avvisa((this.ondate.ultima(o) ? 'Ultima ondata!' : 'Ondata ' + o) + extra)
    this.suona('livello')
  }

  /* il campo è pulito e c'è qualcosa che difende: l'ondata può partire */
  inAttesa() {
    return !!this.torri.length && !this.nemici.length && this.daGenerare === 0 &&
           !this.finito && this.tabellone.onda < this.tappa.ondate
  }
  /* il bonus della partenza svelta è ancora lì */
  pronti() { return this.inAttesa() && this.pausa <= CFG.entroSecondi }
  /* i secondi prima che l'ondata parta da sola */
  restaAttesa() { return Math.max(0, Math.ceil(this.tappa.attesa - this.pausa)) }

  chiamaOnda() {
    if (!this.inAttesa()) return false
    const subito = this.pronti()
    if (subito) { this.tabellone.perFretta(); this.suona('moneta') }
    this.nuovaOnda(subito ? ` · pronti +${CFG.bonusPronti} ⚡` : '')
    return true
  }

  /* ── il preavviso ──
     Chi arriva dopo quella in corso (o dopo l'ultima finita, se il
     campo è pulito). È deterministico, quindi si può dire in anticipo:
     è l'informazione che rende la scelta della torre una decisione. */
  prossime(quante = PREAVVISO) {
    return this.ondate.prossime(this.tabellone.onda, quante)
  }

  /* i nemici escono dall'ingresso sfalsati di poco, così un'ondata non
     è una fila di gemelli: è l'unico punto in cui serve il caso */
  generaNemico() {
    const o = this.tabellone.onda
    this.nemici.push(new Nemico({
      d: -this.caso() * 30,
      vita: this.ondate.vitaDi(o),
      vel: this.ondate.velocitaDi(o) * this.misure.S,
      bestia: this.bestia.id, vola: !!this.bestia.vola, debole: this.bestia.debole,
    }))
  }

  /* ═══════════ l'economia ═══════════
     Il prezzo lo decide chi compra (nel gioco è l'operazione in colonna
     appena finita, con la penale degli errori): qui si paga e si mette
     in campo. Tenere il conto in un posto solo è ciò che permette al
     simulatore di spendere come spende un bambino. */
  /* Dove nasce una torre: dove l'ha messa il dito, se il dito l'ha
     detto. Chi non lo dice — il simulatore, il taratore, i test —
     prende l'ordine di sempre, dall'ingresso verso il castello: è la
     partita su cui ogni tappa è tarata, e deve restare quella anche
     adesso che a schermo si può scegliere. */
  costruisci(tipo, { prezzo = 0, penale = 0, posto = null } = {}) {
    this.tabellone.paga(prezzo + penale)
    this.pausa = 0                     // ha appena fatto qualcosa: l'attesa riparte
    const posti = this.percorso.postazioni
    const scelto = posto != null && this.libera(posto) ? posto
                                                       : this.liberi()[0] ?? 0
    const dove = posti[scelto]
    const torre = new Torre({ x: dove.x, y: dove.y, tipo })
    this.torri.push(torre)
    this.tabellone.torreNuova()
    this.segna('torri')
    this.suona('compra')
    return torre
  }

  /* Salire di un gradino, e — se è il gradino del bivio — prendere anche
     una strada. Il ramo arriva da fuori perché è una scelta di chi
     gioca, non una regola del campo. */
  potenzia(torre, { prezzo = 0, penale = 0, ramo = null } = {}) {
    this.tabellone.paga(prezzo + penale)
    this.pausa = 0
    torre.sale(ramo)
    return torre
  }

  /* ── chi occupa cosa ──
     Una piazzola è presa se ci sta sopra una torre. Il confronto è sulla
     posizione e non su un indice perché le torri si spostano col dito, e
     l'unica verità su dove stanno è dove stanno. `salvo` serve a chi si è
     già preso una torre in mano: la piazzola da cui l'ha sollevata è
     libera, se no non potrebbe rimettercela. */
  libera(i, salvo = null) {
    const p = this.percorso.postazioni[i]
    if (!p) return false
    return !this.torri.some(t => t !== salvo && Math.hypot(t.x - p.x, t.y - p.y) < 2)
  }
  liberi(salvo = null) {
    return this.percorso.postazioni.map((_, i) => i).filter(i => this.libera(i, salvo))
  }
  /* la piazzola su cui sta questa torre, se ci sta */
  postoDi(torre) {
    return this.percorso.postazioni.findIndex(p => Math.hypot(torre.x - p.x, torre.y - p.y) < 2)
  }

  /* ═══════════ un passo di gioco ═══════════
     `calcolando` dice che in questo momento c'è un'operazione aperta: il
     campo va avanti lo stesso — i nemici non aspettano — ma il conto
     dell'attesa no. Chi sta calcolando non viene mai messo sotto
     pressione; chi guarda il campo senza fare niente sì. */
  avanza(dt, calcolando = false) {
    if (this.finito) return this.finito
    this.tempo += dt

    const fine = this.scorriIlTempo(dt, calcolando)
    if (fine) return fine

    const caduto = this.muoviNemici(dt)
    if (caduto) return caduto

    this.faiFuoco(dt)
    this.muoviColpi(dt)
    this.schizzi = this.schizzi.filter(s => s.avanza(dt))
    return null
  }

  /* la generazione dei nemici e la pausa fra un'ondata e l'altra */
  scorriIlTempo(dt, calcolando) {
    if (this.daGenerare > 0) {
      this.prossimo -= dt
      if (this.prossimo <= 0) {
        this.generaNemico(); this.daGenerare--
        this.prossimo = this.ondate.intervalloDi(this.tabellone.onda)
      }
      return null
    }
    if (this.nemici.length || !this.torri.length) return null

    /* campo pulito: il gioco NON manda l'ondata da solo. Aspetta che sia
       il bambino a chiamarla, così i calcoli si fanno con tutto il tempo
       che servono; l'unica fretta è quella che sceglie lui, ed è pagata. */
    if (!calcolando) this.pausa += dt
    if (!this.ondaChiusa) {
      this.ondaChiusa = true
      const premio = this.tabellone.perOnda(this.ondataPulita)
      this.avvisa(this.ondataPulita ? `Ondata pulita +${premio} ⚡` : `Ondata finita +${premio} ⚡`)
      this.suona('moneta')
      // nella campagna le monete arrivano dal traguardo, non dal tempo passato:
      // qui paga solo la partita libera, che un traguardo non ce l'ha
      if (!this.ondate.campagna && this.tabellone.onda % CFG.perMoneta === 0) this.moneta()
    }
    if (this.tabellone.onda >= this.tappa.ondate && this.pausa > CFG.respiro) return this.chiudi('vinta')
    // stare fermi non è una strategia: passato il tempo, i nemici arrivano lo stesso
    if (this.pausa >= this.tappa.attesa) this.nuovaOnda()
    return null
  }

  muoviNemici(dt) {
    for (const n of this.nemici) n.cammina(dt, this.viaDi(n).lunghezza)
    for (const n of this.nemici) {
      if (!n.arrivato) continue
      this.ondataPulita = false
      this.suona('no')
      if (this.tabellone.cuoreVia()) return this.chiudi('persa')
    }
    /* chi è caduto camminando è caduto di veleno — o di fuoco, che è lo
       stesso male con un altro nome. Vale come un'uccisione: se no il
       ramo del veleno regalerebbe morti che non pagano energia, e
       sceglierlo sarebbe una punizione. */
    for (const n of this.nemici)
      if (!n.vivo && !n.arrivato) { this.tabellone.ucciso(); this.tabellone.perNemico() }
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
      for (const _ of morti) { this.tabellone.ucciso(); this.tabellone.perNemico() }
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

  /* ── una fotografia della partita fra un'ondata e l'altra ──
     Serve al taratore, che deve poter riprovare la stessa ondata con
     vite diverse ripartendo dalle stesse condizioni. Si scatta a campo
     pulito, quindi non c'è niente in volo da salvare. */
  istantanea() {
    return { stato: this.tabellone.foto(), torri: this.torri.map(t => t.dati()),
             pausa: this.pausa, tempo: this.tempo,
             ondaChiusa: this.ondaChiusa, ondataPulita: this.ondataPulita }
  }

  riprendi(f) {
    this.tabellone.riprendi(f.stato)
    this.torri = f.torri.map(t => Torre.da(t))
    this.nemici = []; this.colpi = []; this.schizzi = []
    this.daGenerare = 0; this.prossimo = 0
    this.pausa = f.pausa; this.tempo = f.tempo
    this.ondaChiusa = f.ondaChiusa; this.ondataPulita = f.ondataPulita
    this.finito = null
    this.bestia = this.ondate.bestiaDi(Math.max(1, this.tabellone.onda))
  }

  /* ── quello che si legge da fuori ── */
  get via() { return this.percorso }
  /* la strada su cui cammina *questo* nemico. Con una strada sola è
     sempre quella; serve a chi disegna e a chi spara per non doversi
     accorgere di quando le strade diventeranno più d'una. */
  viaDi(_nemico) { return this.percorso }
  get postazioni() { return this.percorso.postazioni }
  /* quanti ne devono ancora uscire dall'ingresso: con questo e i nemici
     in campo si sa se il campo è pulito anche prima della prima torre */
  get inArrivo() { return this.daGenerare }
  get esito() { return this.finito }
}
