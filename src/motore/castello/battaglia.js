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
     `regali`   i potenziamenti definitivi della partita libera,
                `{ id: quanti }` (vedi `REGALI` in `data/castello.js`).
                Li applica **solo** se la tappa li prevede
                (`tappa.regali`): la campagna è tarata, e un bonus che
                cresce fra una partita e l'altra la farebbe scivolare
                senza dirlo a nessuno. Senza regali la partita è quella
                di sempre, numero per numero

   Quello che la battaglia NON fa: non sa cosa sia un'operazione in
   colonna (chi compra dice quanto paga), non disegna, non salva niente.
   ═══════════════════════════════════════════════════════════════════ */
import { CFG, doniDi, regaloDi, quantiRegali, OGNI_REGALO, premioDellaFretta }
  from '../../data/castello.js'
import { ABILITA, CAPO } from '../../data/mostri.js'
import { Percorso } from './percorso.js'
import { Ondate } from './ondate.js'
import { Tabellone } from './tabellone.js'
import { Nemico } from './nemico.js'
import { Torre } from './torre.js'
import { Schizzo } from './schizzo.js'

/* niente da fare, ma senza far crollare chi chiama */
const zitto = () => {}

/* quante ondate in anticipo si annunciano: tre è quanto basta per
   decidere cosa costruire senza diventare una tabella da studiare */
export const PREAVVISO = 3

export class Battaglia {
  constructor({ tappa, misure, stato, eventi = {}, caso = Math.random, regali = null }) {
    this.tappa = tappa
    this.caso = caso
    this.misure = misure

    /* i regali, e i doni che ne escono. La tappa che non li prevede non
       ne riceve nemmeno uno: è la riga che tiene la campagna tarata. */
    this.regali = tappa.regali ? { ...(regali || {}) } : {}
    this.doni = doniDi(this.regali)
    this.daScegliere = 0

    /* `tappa.percorso` c'è solo nel campo a celle (`giochi/castello/`):
       strada a squadra e piazzole già messe. Le tappe vere non ce
       l'hanno, e il percorso è quello di sempre. */
    this.percorso = new Percorso(tappa.forme || tappa.forma, tappa.posti, misure, tappa.percorso)
    this.ondate = new Ondate(tappa)
    this.tabellone = new Tabellone(stato)

    this.avvisa = eventi.avvisa || zitto
    this.suona = eventi.suona || zitto
    this.segna = eventi.segna || zitto
    this.moneta = eventi.moneta || zitto

    this.nemici = []; this.torri = []; this.colpi = []; this.schizzi = []
    this.nati = []                     // i pezzi di chi si è diviso, in campo al prossimo passo
    this.daGenerare = 0; this.prossimo = 0; this.pausa = 0; this.tempo = 0
    this.usciti = 0                    // quanti sono entrati: serve ad alternare gli ingressi
    /* le ondate ancora aperte, `{ onda: pulita }`: da quando la prossima
       si può chiamare mentre questa è ancora in campo, «l'ondata è
       finita» non vuol più dire «il campo è pulito» — un'ondata finisce
       quando se n'è andato l'ultimo dei suoi */
    this.aperte = new Map()
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
    this.nemici = []; this.torri = []; this.colpi = []; this.schizzi = []; this.nati = []
    this.daGenerare = 0; this.prossimo = 0; this.pausa = 0; this.tempo = 0
    this.usciti = 0
    this.aperte = new Map()
    this.finito = null
    this.daScegliere = 0
    this.bestia = this.ondate.bestiaDi(1)
  }

  /* ═══════════ i regali ═══════════
     Uno ogni `OGNI_REGALO` ondate, e solo dove la tappa li prevede. Il
     conto di quanti ce ne sono da scegliere sta qui e non nella
     schermata per due motivi: perché **l'ondata non parte** finché ce
     n'è uno in sospeso (così un regalo rimandato non si perde), e
     perché un regalo non scelto non deve poter diventare due. */
  prendiRegalo(id) {
    if (!this.tappa.regali || !regaloDi(id)) return null
    this.regali[id] = (this.regali[id] || 0) + 1
    this.doni = doniDi(this.regali)
    /* le torri già in piedi ci guadagnano subito: un regalo che valesse
       solo per quelle costruite dopo sarebbe un regalo da leggere */
    for (const t of this.torri) t.doni = this.doni
    if (this.daScegliere > 0) this.daScegliere--
    this.suona('livello')
    return this.regali
  }

  /* quanti regali aspettano di essere scelti (0 o 1, di fatto: finché
     c'è un regalo in sospeso l'ondata dopo non parte) */
  get regaliDaScegliere() { return this.daScegliere }
  /* quanti ne sono stati presi in tutto: è il numero del giro delle
     carte, e quello che la mappa mostra sul tasto */
  get regaliPresi() { return quantiRegali(this.regali) }

  /* ═══════════ le ondate ═══════════ */
  nuovaOnda(extra = '') {
    const o = this.tabellone.ondaNuova()
    this.bestia = this.ondate.bestiaDi(o)
    this.segna('ondate')
    this.segna('onda-massima', o)
    this.daGenerare = this.ondate.quantiDi(o)
    this.prossimo = 0; this.pausa = 0
    this.aperte.set(o, true)
    const chi = this.bestia.capo ? ` · arriva il capo: ${this.bestia.nome} gigante` : ''
    this.avvisa((this.ondate.ultima(o) ? 'Ultima ondata!' : 'Ondata ' + o) + chi + extra)
    this.suona('livello')
  }

  /* il campo è pulito e c'è qualcosa che difende: l'ondata può partire */
  inAttesa() {
    return !!this.torri.length && !this.nemici.length && this.daGenerare === 0 &&
           !this.finito && this.tabellone.onda < this.tappa.ondate
  }

  /* ── chiamare la prossima prima del tempo ──
     Come in Kingdom Rush: finita di entrare l'ondata di adesso, la
     prossima si può far partire subito — anche con i mostri ancora in
     campo. Non mentre l'ondata sta ancora uscendo dalla bocca: le due
     file si mescolerebbero all'ingresso, e il motore genera un'ondata
     per volta. E mai con un regalo da scegliere, che ferma le ondate.

     Il premio è **il tempo risparmiato**: quanto ci avrebbero messo i
     mostri in campo ad arrivare in fondo, più l'attesa che non si fa
     (`premioDellaFretta` in `data/castello.js`, dove stanno i numeri e
     come li conta il modello). Chiamarla appena si può rende di più,
     chiamarla a campo pulito dopo aver aspettato un po' rende meno. */
  puoiChiamare() {
    return !!this.torri.length && this.daGenerare === 0 && this.daScegliere === 0 &&
           !this.finito && this.tabellone.onda < this.tappa.ondate
  }
  /* i secondi che si risparmiano chiamandola adesso */
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
  /* il premio è ancora lì: il tasto lo dice */
  pronti() { return this.premioFretta() > 0 }
  /* i secondi prima che l'ondata parta da sola */
  restaAttesa() { return Math.max(0, Math.ceil(this.tappa.attesa - this.pausa)) }

  chiamaOnda() {
    if (!this.puoiChiamare()) return false
    const premio = this.premioFretta()
    if (premio) { this.tabellone.perFretta(premio); this.suona('moneta') }
    this.nuovaOnda(premio ? ` · subito +${premio} ⚡` : '')
    return true
  }

  /* ── il preavviso ──
     Chi arriva dopo quella in corso (o dopo l'ultima finita, se il
     campo è pulito). È deterministico, quindi si può dire in anticipo:
     è l'informazione che rende la scelta della torre una decisione. */
  prossime(quante = PREAVVISO) {
    const vie = this.percorso.quanteVie
    const attese = this.ondate.prossime(this.tabellone.onda, quante, vie)
    if (vie < 2) return attese
    /* da che parte entrano, detto in parole che si guardano: la strada
       non ha un nome, ma ha un ingresso, e quell'ingresso sta a destra
       o a sinistra dell'altro. È l'informazione che rende il trascinare
       una torre una mossa invece che una carezza. */
    const inizi = this.percorso.vie.map(v => v.inizio.x)
    const piuAsinistra = Math.min(...inizi)
    const lato = k => (inizi[k] <= piuAsinistra ? 'sinistra' : 'destra')
    return attese.map(p => ({ ...p, lato: p.via < 0 ? 'ambo' : lato(p.via) }))
  }

  /* i nemici escono dall'ingresso sfalsati di poco, così un'ondata non
     è una fila di gemelli: è l'unico punto in cui serve il caso */
  generaNemico() {
    const o = this.tabellone.onda
    /* da che ingresso entra: lo decide l'ondata, e quando l'ondata
       arriva da tutte e due le parti i mostri si alternano uno per uno
       — così le due file partono insieme invece che una dopo l'altra */
    const vie = this.percorso.quanteVie
    const scelta = this.ondate.viaDi(o, vie)
    const via = scelta < 0 ? this.usciti % vie : scelta
    this.usciti++
    const b = this.bestia
    this.nemici.push(new Nemico({
      d: -this.caso() * 30,
      via, onda: o,
      vita: this.ondate.vitaDi(o),
      vel: this.ondate.velocitaDi(o) * this.misure.S,
      bestia: b.id, vola: !!b.vola, immune: b.immune, abilita: b.abilita,
      capo: !!b.capo, taglia: b.capo ? CAPO.taglia : 1, paga: this.ondate.pagaDi(o),
    }))
  }

  /* ── chi cade ──
     Paga quanto vale — un mostro uno, un capo l'ondata intera, un pezzo
     la sua parte — e se si divide lascia in campo i suoi pezzi. I pezzi
     non pagano di più del mostro intero: si spartiscono quello che lui
     avrebbe pagato, così un'ondata di slime lascia l'energia di
     qualunque altra ondata, e il conto dei `calcoli` non se ne accorge. */
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
    const torre = new Torre({ x: dove.x, y: dove.y, tipo, doni: this.doni })
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

  /* ── spostare una torre ──
     Si paga in energia come tutto il resto, e si paga **qui**: che sia
     arrivata da un trascinamento o da un tocco sulla piazzola, la
     regola è una sola e sta nel motore. Torna `false` se non si può —
     energia che non basta, piazzola occupata — e allora chi ha in mano
     la torre la rimette dov'era. */
  sposta(torre, posto) {
    if (!torre || !this.libera(posto, torre)) return false
    /* rimetterla dov'è già non è uno spostamento: capita a chi solleva
       una torre e la riappoggia, e farglielo pagare sarebbe una multa
       per aver cambiato idea */
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
    if (this.nati.length) { this.nemici.push(...this.nati); this.nati = [] }
    this.schizzi = this.schizzi.filter(s => s.avanza(dt))
    return null
  }

  /* la generazione dei nemici, la chiusura delle ondate e la pausa fra
     un'ondata e l'altra */
  scorriIlTempo(dt, calcolando) {
    if (this.daGenerare > 0) {
      this.prossimo -= dt
      if (this.prossimo <= 0) {
        this.generaNemico(); this.daGenerare--
        this.prossimo = this.ondate.intervalloDi(this.tabellone.onda)
      }
    }
    this.chiudiLeOndate()
    if (this.daGenerare > 0 || this.nemici.length || this.nati.length || !this.torri.length) return null

    /* campo pulito: il gioco NON manda l'ondata da solo. Aspetta che sia
       il bambino a chiamarla, così i calcoli si fanno con tutto il tempo
       che servono; l'unica fretta è quella che sceglie lui, ed è pagata. */
    if (!calcolando) this.pausa += dt
    if (this.tabellone.onda >= this.tappa.ondate && this.pausa > CFG.respiro) return this.chiudi('vinta')
    /* col regalo da scegliere l'ondata non parte, nemmeno da sola: chi
       lo rimanda per guardarsi il campo se lo ritrova prima della
       prossima, e chi posa il telefono non trova un'ondata in faccia */
    if (this.daScegliere > 0) return null
    // stare fermi non è una strategia: passato il tempo, i nemici arrivano lo stesso
    if (this.pausa >= this.tappa.attesa) this.nuovaOnda()
    return null
  }

  /* ── quando un'ondata è finita ──
     Quando se n'è andato l'ultimo dei suoi — fermato o arrivato — e non
     ne devono più uscire. Di solito coincide col campo pulito; con la
     prossima chiamata in anticipo no, e il premio di fine ondata, la
     moneta della libera e il regalo arrivano lo stesso, al momento
     giusto. */
  chiudiLeOndate() {
    for (const [o, pulita] of this.aperte) {
      if (o === this.tabellone.onda && this.daGenerare > 0) continue
      if (this.nemici.some(n => n.onda === o) || this.nati.some(n => n.onda === o)) continue
      this.aperte.delete(o)
      const premio = this.tabellone.perOnda(pulita)
      this.avvisa(pulita ? `Ondata pulita +${premio} ⚡` : `Ondata finita +${premio} ⚡`)
      this.suona('moneta')
      // nella campagna le monete arrivano dal traguardo, non dal tempo passato:
      // qui paga solo la partita libera, che un traguardo non ce l'ha
      if (!this.ondate.campagna && o % CFG.perMoneta === 0) this.moneta()
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
      /* il capo se ne porta via di più: vedi `CAPO` */
      for (let k = 0; k < (n.capo ? CAPO.cuori : 1); k++)
        if (this.tabellone.cuoreVia()) return this.chiudi('persa')
    }
    /* chi è caduto camminando è caduto di veleno — o di fuoco, che è lo
       stesso male con un altro nome. Vale come un'uccisione: se no il
       ramo del veleno regalerebbe morti che non pagano energia, e
       sceglierlo sarebbe una punizione. */
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

  /* ── una fotografia della partita fra un'ondata e l'altra ──
     Serve al taratore, che deve poter riprovare la stessa ondata con
     vite diverse ripartendo dalle stesse condizioni. Si scatta a campo
     pulito, quindi non c'è niente in volo da salvare. */
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

  /* ── quello che si legge da fuori ── */
  /* Da che bocca sta scendendo la roba: quella dell'ondata in corso se
     ce n'è una, se no quella che arriverà. `-1` vuol dire tutte e due.
     Serve al campo per accendere la freccia giusta — e la differenza
     conta: mentre i mostri scendono da sinistra, indicare la bocca
     della prossima ondata sarebbe una bugia con le migliori
     intenzioni. */
  get bocca() {
    const vie = this.percorso.quanteVie
    if (vie < 2) return 0
    const inCorso = this.daGenerare > 0 || this.nemici.length > 0
    return this.ondate.viaDi(this.tabellone.onda + (inCorso ? 0 : 1), vie)
  }
  get via() { return this.percorso }
  /* la strada su cui cammina *questo* nemico. Con una strada sola è
     sempre quella, e chi disegna o chi spara non deve accorgersi di
     quando le strade sono due. */
  viaDi(nemico) { return this.percorso.viaN(nemico ? nemico.via : 0) }
  get postazioni() { return this.percorso.postazioni }
  /* quanti ne devono ancora uscire dall'ingresso: con questo e i nemici
     in campo si sa se il campo è pulito anche prima della prima torre */
  get inArrivo() { return this.daGenerare }
  /* nessuna ondata aperta: vuol dire anche che premi e regali di quella
     di prima sono già stati dati */
  get ondaChiusa() { return this.aperte.size === 0 }
  get esito() { return this.finito }
}
