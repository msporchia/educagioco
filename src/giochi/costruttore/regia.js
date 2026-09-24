/* ═══════════════════════════════════════════════════════════════════
   LA REGIA — il programma che gira, a una velocità che si guarda

   Sta fra il motore e lo schermo. Tira fuori dall'esecutore un fatto
   per volta (`motore/esecutore.js`), aspetta quanto serve perché si
   veda, e intanto aggiorna due cose:

     · `quadro`, l'oggetto che la tela disegna a ogni fotogramma: si
       muta sul posto, niente reattività — la tela lo rilegge da sola;
     · `stato`, reattivo, per quello che sta nel DOM: la riga accesa, la
       pila delle carte aperte, i valori delle lavagnette, gli esiti.

   ── DUE MONDI, UNA REGIA ────────────────────────────────────────────
   Il cantiere di lato e il porto dall'alto hanno quadri diversi (li
   disegnano due tele, `scena/tela.js` e `scena/porto.js`) e qualche
   fatto diverso: nel porto il robot prende e posa, e il mondo fa i suoi
   turni — la gru cala, il nastro scorre, un cliente arriva. Tutto il
   resto — la riga che si accende, i giri, le carte dei progetti, le
   lavagnette, l'ordine delle prove — è lo stesso, e sta scritto una
   volta sola.

   Nel porto le cose che si muovono diventano **voli** nel quadro (una
   cassa dalla casella alle mani, dalla gru al molo, dal nastro al mare):
   il motore le ha già spostate, la tela le fa viaggiare.

   ── L'ORDINE DELLE PROVE ───────────────────────────────────────────
   Si parte dal primo ordine, alla velocità scelta. Se regge, gli altri
   si giocano **a schermo, accelerati** — la stessa scelta fatta per il
   Generale: vedere che il programma tiene anche con cinque gradini è la
   soddisfazione, e dirlo a parole la ruberebbe. Al primo ordine che
   cade ci si ferma lì, su quell'ordine, col guasto a vista.

   Non sa niente di monete e di profilo: a cose fatte chiama `su.fine`.
   ═══════════════════════════════════════════════════════════════════ */
import { markRaw } from 'vue'
import { Esecuzione } from './motore/esecutore.js'
import { mondoDellOrdine, verdetto, nelPorto } from './motore/prova.js'
import { copia } from './dati/scrivi.js'

/* millisecondi per un passo del robot, alle tre velocità */
export const VELOCITA = { lenta: 560, normale: 230, veloce: 45 }

/* quanto pesa ogni fatto, in passi: una riga che si accende è un'occhiata,
   uno spostamento è un passo intero */
const PESO = { riga: 0.55, metti: 0.9, giro: 0.25, guarda: 0.9, legge: 0.7,
               assegna: 0.9, entra: 0.8, esce: 0.35, prendi: 0.9, posa: 0.9 }

/* Dentro un attrezzo quello che **pensa** passa di corsa, e quello che
   **fa** col suo passo. Un attrezzo è chiuso, e il bambino lo guarda da
   fuori: conta la torre che sale, non le righe che la decidono. Era la
   torre del casaro a chiederlo — «sposta» sceglie l'asse con sei «se», e
   a velocità normale una forma spostata durava tre secondi di righe che
   si accendevano, per un gesto di mezzo secondo. */
const PENSA = new Set(['riga', 'guarda', 'giro', 'assegna', 'legge', 'entra'])
const DENTRO_ATTREZZO = 0.2

/* il quadro di un ordine fermo, prima di partire: quello che si guarda
   mentre si scrive il programma */
export function quadroFermo(livello, i) {
  const m = mondoDellOrdine(livello, i)
  return nelPorto(livello) ? quadroDelPorto(m, livello) : quadroDi(m)
}

function quadroDi(m) {
  return markRaw({
    w: m.w, h: m.h, suolo: m.suolo, mattoni: m.mattoni, bersaglio: m.bersaglio,
    robot: m.robot, robotDa: null, dal: 0, durata: 0,
    omino: m.omino, ominoDa: null, bandiera: m.bandiera,
    posa: null, guarda: null, fermo: null, confronto: null, esito: null,
    come: null, verso: 1,
    mondo: m,
  })
}

/* il quadro del porto: il porto stesso (la tela lo legge, non lo tocca)
   più quello che sta succedendo adesso */
function quadroDelPorto(p, livello) {
  return markRaw({
    mondo: 'porto', porto: p, tema: livello.tema || 'molo',
    w: p.w, h: p.h,
    robot: { ...p.robot }, robotDa: null, dal: 0, durata: 0, verso: p.verso,
    voli: [], mezzi: [], guarda: null, legge: null, fermo: null, guaio: null,
    mancano: null, sbagliati: null, umore: null, nastroDal: 0,
    passo: VELOCITA.normale, seguiRobot: false,
  })
}

export class Regia {
  /* `stato` è reattivo e lo tiene chi monta; `su` sono le callback:
       quadro(q)          un quadro nuovo da dare alla tela (cambia ordine)
       suono(tipo)        'passo' | 'posa' | 'prendi' | 'errore' | 'splash' | 'ok' | 'cala' | 'servito'
       fine(esito)        { vinto, ordine, errore?, confronto?, omino?, giornata? }
       mattone()          un mattone posato: per il contatore */
  constructor({ livello, programma, stato, su, velocita = 'normale' }) {
    this.livello = livello
    this.porto = nelPorto(livello)
    this.programma = copia(programma)
    this.stato = stato
    this.su = su
    this.velocita = velocita
    this.timer = 0
    this.vivo = false
    this.attese = 0
  }

  get passo() { return VELOCITA[this.montaggio ? 'veloce' : this.velocita] || VELOCITA.normale }

  avvia() {
    this.vivo = true
    this.stato.esiti = this.livello.ordini.map(() => null)
    this.proveDa(0)
  }

  ferma() {
    this.vivo = false
    clearTimeout(this.timer)
    this.stato.inCorso = false
    this.stato.riga = null
    this.stato.pila = []
    if (this.quadro && this.porto) this.quadro.seguiRobot = false
  }

  cambiaVelocita(v) { this.velocita = v }

  /* la carta in cima alla pila è un attrezzo? */
  inAttrezzo() {
    const pila = this.es && this.es.pila
    const cima = pila && pila.length > 1 ? pila[pila.length - 1].progetto : null
    return !!cima && !!((this.programma.progetti || []).find(p => p.id === cima) || {}).attrezzo
  }

  proveDa(i) {
    if (!this.vivo) return
    this.ordine = i
    this.montaggio = i > 0
    const m = mondoDellOrdine(this.livello, i)
    this.mondo = m
    this.quadro = this.porto ? quadroDelPorto(m, this.livello) : quadroDi(m)
    if (this.porto) { this.quadro.seguiRobot = true; this.quadro.passo = this.passo }
    this.su.quadro(this.quadro, i)
    const lav = this.livello.ordini[i].lavagnette || {}
    this.es = new Esecuzione(this.programma, m, { lavagnette: lav })
    this.attese = 0
    Object.assign(this.stato, {
      inCorso: true, ordine: i, montaggio: this.montaggio, riga: null, progetto: null, guasto: null,
      pila: [], valori: { ...this.es.valori }, ordineValori: { ...lav }, giro: null, turno: 0,
    })
    /* il cartello «ordine 2: …» ha bisogno di un attimo per essere letto */
    this.timer = setTimeout(() => this.avanti(), this.montaggio ? 650 : 120)
  }

  avanti() {
    if (!this.vivo) return
    const e = this.es.prossimo()
    const ora = performance.now()
    const q = this.quadro
    q.robotDa = null
    if (this.porto) q.passo = this.passo
    let peso = PESO[e.tipo] ?? 0.5
    switch (e.tipo) {
      case 'riga':
        this.stato.riga = e.id
        this.stato.progetto = e.progetto
        break
      case 'muovi':
        q.robotDa = e.da
        q.robot = { ...e.a }
        q.come = e.come
        q.dal = ora
        q.durata = this.passo * (e.come === 'cade' ? 0.4 : 0.85)
        if (this.porto) q.verso = e.verso
        else if (e.a.x !== e.da.x) q.verso = Math.sign(e.a.x - e.da.x)
        if (e.come !== 'cade') this.su.suono('passo')
        /* cadere è più svelto che camminare: una caduta da sei piani non
           deve durare quanto sei passi */
        peso = e.come === 'cade' ? 0.4 : e.come === 'sale' ? 0.8 : 1
        this.attese = 0
        break
      case 'metti':
        q.posa = { x: e.x, y: e.y, dal: ora }
        this.su.suono('posa')
        this.su.mattone()
        break
      /* ── il porto ── */
      case 'prendi':
        q.verso = this.mondo.verso
        this.vola(e.cosa, { x: e.x, y: e.y }, 'mano', ora, 0.7)
        this.su.suono('prendi')
        this.attese = 0
        break
      case 'posa':
        q.verso = this.mondo.verso
        this.vola(e.cosa, 'mano', e.servito ? 'cliente' : { x: e.x, y: e.y }, ora, e.servito ? 1.1 : 0.7)
        if (e.servito) { q.umore = { come: 'contento', dal: ora + this.passo * 0.8 }; this.su.suono('servito') }
        else this.su.suono('posa')
        this.attese = 0
        break
      case 'turno':
        peso = this.turno(e, ora)
        break
      case 'legge':
        q.legge = e.mano ? { mano: true, valore: e.valore, dal: ora } : { x: e.x, y: e.y, valore: e.valore, dal: ora }
        break
      case 'guarda':
        if (e.mano) q.guarda = { mano: true, esito: e.esito, dal: ora }
        else if (e.x !== undefined) q.guarda = { x: e.x, y: e.y, esito: e.esito, dal: ora }
        /* chi aspetta guarda a ogni turno: l'occhiata si fa breve, se no
           un'attesa lunga dura quanto una passeggiata */
        if (e.attesa) peso = Math.max(0.1, 0.5 * Math.pow(0.85, this.attese))
        break
      case 'giro':
        this.stato.giro = { id: e.id, n: e.n, di: e.di }
        break
      case 'assegna':
        this.stato.valori = { ...this.es.valori }
        break
      case 'entra':
      case 'esce':
        this.stato.pila = this.es.fotografia().pila
        break
      case 'errore':
        return this.finito({ vinto: false, errore: e })
      case 'fine':
        return this.verifica()
    }
    if (PENSA.has(e.tipo) && this.inAttrezzo()) peso *= DENTRO_ATTREZZO
    this.stato.tic = (this.stato.tic || 0) + 1
    this.timer = setTimeout(() => this.avanti(), this.passo * peso)
  }

  /* una cosa in movimento nel porto: la tela la fa viaggiare, poi se ne
     scorda da sola quando il volo è finito */
  vola(cosa, da, a, ora, durata) {
    const q = this.quadro
    q.voli = q.voli.filter(v => ora < v.dal + v.durata + 50 && v.cosa.id !== cosa.id)
    q.voli.push({ cosa, da, a, dal: ora, durata: this.passo * durata })
  }

  /* un camion in viaggio sulla strada: come i voli, se ne scorda la tela
     quando è arrivato o uscito */
  mezzo(m, ora) {
    const q = this.quadro
    q.mezzi = (q.mezzi || []).filter(v => ora < v.dal + v.durata + 50)
    q.mezzi.push({ ...m, dal: ora, durata: this.passo * 1.8 })
  }

  /* Un turno del mondo: cosa ha fatto da sé mentre il robot lavorava.
     Torna quanto aspettare: poco dopo un gesto (il turno si vede insieme
     al gesto), di più mentre il robot aspetta — ma sempre meno se
     l'attesa si allunga, se no un minuto di gru ferma dura un minuto. */
  turno(e, ora) {
    const q = this.quadro
    this.stato.turno = e.t
    for (const ev of e.eventi) {
      switch (ev.che) {
        case 'nastri': q.nastroDal = ora; break
        case 'scorre': this.vola(ev.cosa, ev.da, ev.a, ora, 0.9 * this.mondo.passoNastro / 2); break
        case 'cala': this.vola(ev.cosa, 'gru', { x: ev.x, y: ev.y }, ora, 1.1); this.su.suono('cala'); break
        case 'in-mare':
          this.vola(ev.cosa, ev.da, 'mare', ora, 0.9)
          q.guaio = { ...ev.a, dal: ora }
          this.su.suono('splash')
          break
        case 'arrabbiato':
          q.umore = { come: 'arrabbiato', dal: ora }
          if (this.mondo.puntoClienti) q.guaio = { ...this.mondo.puntoClienti, dal: ora }
          break
        /* i camion entrano e escono lungo la strada: la tela li fa
           viaggiare, il porto li ha già messi (o tolti) dalla piazzola */
        case 'camion-arriva':
          this.mezzo({ come: 'arriva', x: ev.x, y: ev.y, colore: ev.colore, capienza: ev.vuole, carico: [] }, ora)
          break
        case 'camion-parte':
          this.mezzo({ come: 'parte', x: ev.x, y: ev.y, colore: ev.colore, carico: ev.carico, contento: ev.contento }, ora)
          if (ev.contento) this.su.suono('servito')
          else q.guaio = { x: ev.x, y: ev.y, dal: ora }
          break
        default: break
      }
    }
    if (e.come === 'attesa') return Math.max(0.1, 0.55 * Math.pow(0.85, this.attese++))
    if (e.come === 'da-solo') return 0.35
    return 0.08
  }

  /* il programma è finito senza intoppi: adesso si guarda se ha fatto
     quello che l'ordine chiedeva */
  verifica() {
    this.stato.riga = null
    this.stato.pila = []
    const v = verdetto(this.livello, this.mondo)
    if (this.porto) {
      if (!v.vinto) { this.quadro.mancano = v.giornata.mancano; this.quadro.sbagliati = v.giornata.sbagliati }
      return this.finito({ vinto: v.vinto, giornata: v.giornata })
    }
    if (this.livello.prova === 'passaggio') return this.cammina(v)
    if (!v.vinto) this.quadro.confronto = v.confronto
    return this.finito({ vinto: v.vinto, confronto: v.confronto })
  }

  /* l'omino prova la costruzione, un passo per volta */
  cammina(v) {
    const passi = v.omino.passi
    let k = 0
    const q = this.quadro
    const tempo = Math.max(90, this.passo * 0.8)
    const uno = () => {
      if (!this.vivo) return
      if (k >= passi.length) {
        q.ominoDa = null
        if (!v.vinto) q.esito = v.omino.esito
        return this.finito({ vinto: v.vinto, omino: v.omino })
      }
      q.ominoDa = { ...q.omino }
      q.omino = passi[k++]
      q.dal = performance.now()
      q.durata = tempo * 0.9
      this.timer = setTimeout(uno, tempo)
    }
    this.timer = setTimeout(uno, 250)
  }

  finito(esito) {
    const i = this.ordine
    this.stato.esiti[i] = esito.vinto ? 'vinto' : 'perso'
    this.stato.esiti = [...this.stato.esiti]
    if (this.porto) this.quadro.seguiRobot = false
    if (esito.errore) {
      /* un guaio del mondo (una cassa in mare, un cliente arrabbiato) non
         è colpa di una riga: il segno va dove è successo, non sul robot */
      const delMondo = !esito.errore.id && this.quadro.guaio
      if (!delMondo) this.quadro.fermo = { ...this.quadro.robot }
      /* la riga dove si è fermato resta segnata, e la pila resta com'era
         in quel momento: «dentro colonna, con alta 3» è metà della
         spiegazione */
      this.stato.guasto = esito.errore.id
      this.stato.riga = null
      this.stato.pila = this.es.fotografia().pila
      if (!delMondo) this.su.suono('errore')
    } else if (esito.omino && esito.omino.esito === 'splash') this.su.suono('splash')
    else if (!esito.vinto) this.su.suono('errore')

    if (esito.vinto && i + 1 < this.livello.ordini.length) {
      this.su.suono('ok')
      this.timer = setTimeout(() => this.proveDa(i + 1), 500)
      return
    }
    this.vivo = false
    this.stato.inCorso = false
    this.su.fine({ ...esito, ordine: i })
  }
}
