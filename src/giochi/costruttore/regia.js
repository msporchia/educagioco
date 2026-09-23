/* ═══════════════════════════════════════════════════════════════════
   LA REGIA — il programma che gira, a una velocità che si guarda

   Sta fra il motore e lo schermo. Tira fuori dall'esecutore un fatto
   per volta (`motore/esecutore.js`), aspetta quanto serve perché si
   veda, e intanto aggiorna due cose:

     · `quadro`, l'oggetto che la tela disegna a ogni fotogramma: si
       muta sul posto, niente reattività — la tela lo rilegge da sola;
     · `stato`, reattivo, per quello che sta nel DOM: la riga accesa, la
       pila delle carte aperte, i valori delle lavagnette, gli esiti.

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
import { mondoDellOrdine, verdetto } from './motore/prova.js'
import { copia } from './dati/scrivi.js'

/* millisecondi per un passo del robot, alle tre velocità */
export const VELOCITA = { lenta: 560, normale: 230, veloce: 45 }

/* quanto pesa ogni fatto, in passi: una riga che si accende è un'occhiata,
   uno spostamento è un passo intero */
const PESO = { riga: 0.55, metti: 0.9, giro: 0.25, guarda: 0.9,
               assegna: 0.9, entra: 0.8, esce: 0.35 }

/* il quadro di un ordine fermo, prima di partire: quello che si guarda
   mentre si scrive il programma */
export function quadroFermo(livello, i) {
  const m = mondoDellOrdine(livello, i)
  return quadroDi(m)
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

export class Regia {
  /* `stato` è reattivo e lo tiene chi monta; `su` sono le callback:
       quadro(q)          un quadro nuovo da dare alla tela (cambia ordine)
       suono(tipo)        'passo' | 'posa' | 'errore' | 'splash' | 'ok'
       fine(esito)        { vinto, ordine, errore?, confronto?, omino? }
       mattone()          un mattone posato: per il contatore */
  constructor({ livello, programma, stato, su, velocita = 'normale' }) {
    this.livello = livello
    this.programma = copia(programma)
    this.stato = stato
    this.su = su
    this.velocita = velocita
    this.timer = 0
    this.vivo = false
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
  }

  cambiaVelocita(v) { this.velocita = v }

  proveDa(i) {
    if (!this.vivo) return
    this.ordine = i
    this.montaggio = i > 0
    const m = mondoDellOrdine(this.livello, i)
    this.mondo = m
    this.quadro = quadroDi(m)
    this.su.quadro(this.quadro, i)
    const lav = this.livello.ordini[i].lavagnette || {}
    this.es = new Esecuzione(this.programma, m, { lavagnette: lav })
    Object.assign(this.stato, {
      inCorso: true, ordine: i, montaggio: this.montaggio, riga: null, progetto: null, guasto: null,
      pila: [], valori: { ...this.es.valori }, ordineValori: { ...lav }, giro: null,
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
        if (e.a.x !== e.da.x) q.verso = Math.sign(e.a.x - e.da.x)
        if (e.come !== 'cade') this.su.suono('passo')
        break
      case 'metti':
        q.posa = { x: e.x, y: e.y, dal: ora }
        this.su.suono('posa')
        this.su.mattone()
        break
      case 'guarda':
        if (e.x !== undefined) q.guarda = { x: e.x, y: e.y, esito: e.esito, dal: ora }
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
    this.stato.tic = (this.stato.tic || 0) + 1
    /* cadere è più svelto che camminare: una caduta da sei piani non deve
       durare quanto sei passi */
    const peso = e.tipo === 'muovi' ? (e.come === 'cade' ? 0.4 : e.come === 'sale' ? 0.8 : 1) : (PESO[e.tipo] ?? 0.5)
    this.timer = setTimeout(() => this.avanti(), this.passo * peso)
  }

  /* il programma è finito senza intoppi: adesso si guarda se ha fatto
     quello che l'ordine chiedeva */
  verifica() {
    this.stato.riga = null
    this.stato.pila = []
    const v = verdetto(this.livello, this.mondo)
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
    if (esito.errore) {
      this.quadro.fermo = { ...this.quadro.robot }
      /* la riga dove si è fermato resta segnata, e la pila resta com'era
         in quel momento: «dentro colonna, con alta 3» è metà della
         spiegazione */
      this.stato.guasto = esito.errore.id
      this.stato.riga = null
      this.stato.pila = this.es.fotografia().pila
      this.su.suono('errore')
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
