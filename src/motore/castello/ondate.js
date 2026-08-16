/* ═══════════════════════════════════════════════════════════════════
   LE ONDATE — chi arriva, quanti sono, e quando.

   Il ciclo della tappa in una classe sola: data un'ondata, dice chi la
   compone, quanti nemici sono, ogni quanto escono dall'ingresso. Non
   tiene tempo e non fa camminare nessuno: è una **tabella calcolata**,
   e per questo si può guardare anche in avanti.

   ── il preavviso ──
   Ed è tutto il punto. Chi arriva è deterministico — `mostroDiOnda`
   dipende solo dal numero dell'ondata — quindi «fra tre ondate arriva
   il Golem, che regge la magia» si può dire *adesso*, mentre il campo è
   pulito e si stanno facendo i conti per comprare. Prima la resistenza
   si scopriva quando l'ondata era già partita, cioè quando non serviva
   più a niente: era un dettaglio, non una decisione.

   `prossime()` è quello che l'interfaccia mette in un nastro, ed è il
   solo motivo per cui il motore espone il futuro invece del presente.
   ═══════════════════════════════════════════════════════════════════ */
import { nemiciDiOnda, intervalloDiOnda, vitaNemico, velocitaNemico } from '../../data/castello.js'
import { MOSTRI, mostroDiOnda, mostroLibero, torreResistente } from '../../data/mostri.js'

export class Ondate {
  constructor(tappa) { this.tappa = tappa }

  /* la partita libera non ha un numero di ondate: non finisce */
  get campagna() { return Number.isFinite(this.tappa.ondate) }
  get quante() { return this.tappa.ondate }
  ultima(o) { return this.campagna && o >= this.quante }

  /* Chi arriva in questa ondata: un tipo solo, così la scheda in alto a
     destra parla di lui e scegliere la torre è una domanda con una
     risposta. La resistenza c'è solo dove la tappa la prevede, e
     nemmeno lì in tutte le ondate.

     ── da quando una tappa dice a cosa si resiste ──
     Non dalla prima ondata, e per la stessa ragione per cui la prima
     tappa non ha resistenze del tutto: finché in campo c'è **una torre
     per strada**, «resiste a quella» non è una scelta, è un muro —
     quella strada resta scoperta e non c'è nessun'altra mossa da fare.
     Il gioco apre la tappa con una torre per ingresso, e ogni ondata
     ne fa comprare grosso modo un'altra: quindi le resistenze
     cominciano dopo tante ondate quante sono le bocche — dalla seconda
     dove la strada è una, dalla terza dove sono due.
     Misurato, non temuto. Senza, il Corridoio si perdeva alla prima
     ondata anche spendendo tutto (il pipistrello che la apre regge
     proprio le frecce, cioè la torre che si compra per prima); e il
     Torrione, che di bocche ne ha due, usciva dalla taratura con i
     primi nemici da dieci punti vita, perché l'ondata 2 spegneva
     l'unica torre che guardava la seconda strada.

     ── e nemmeno l'ultima ──
     L'ondata che chiude una tappa arriva con tutto, e tutto quello che
     si è costruito vale per intero: è il momento in cui il campo che
     si è messo insieme si vede per quello che è, senza che il gioco ne
     spenga un pezzo. Non è solo gusto — è quello che rende le tappe
     confrontabili fra loro. La taratura non lascia mai un'ondata più
     dura di quella dopo, quindi l'**ultima** fissa il tetto di tutta
     la tappa: se lì capita un mostro che chiude la torre più forte del
     campo, l'intera tappa si abbassa dietro di lui, e due tappe
     gemelle finiscono con vite diverse per il caso di quale bestia sia
     toccata in fondo alla fila. Con l'ultima libera, il tetto torna a
     misurare la tappa e non la sua coincidenza. */
  /* quante bocche ha la tappa: è `forme` che le dichiara, e chi ne ha
     una sola scrive `forma` al singolare */
  get daQuandoResistono() { return this.tappa.forme?.length || 1 }

  bestiaDi(o) {
    const id = this.tappa.mostri ? mostroDiOnda(this.tappa.mostri, o) : mostroLibero(o)
    const dice = this.tappa.resistenze && o > this.daQuandoResistono && !this.ultima(o)
    return { id, ...MOSTRI[id], resiste: dice ? torreResistente(id) : null }
  }

  quantiDi(o) { return nemiciDiOnda(o) }
  intervalloDi(o) { return intervalloDiOnda(o) }
  vitaDi(o) { return vitaNemico(this.tappa, o) }
  velocitaDi(o) { return velocitaNemico(this.tappa, o) }

  /* ── da che ingresso arriva l'ondata `o` ──
     Con una strada sola non c'è niente da decidere. Con due, si
     alternano: la prima da una parte, la seconda dall'altra, e ogni
     terza **da tutte e due insieme** (`-1`, che il campo legge come
     «alternali uno per uno»).

     Deterministico, come tutto il resto delle ondate, perché deve poter
     essere annunciato tre ondate prima: sapere che fra due giri arrivano
     da sotto è quello che rende il trascinare una torre una mossa invece
     che una carezza. */
  viaDi(o, quante = 1) {
    if (quante < 2) return 0
    if (o % 3 === 0 && o >= this.daQuandoInsieme) return -1
    return Math.floor((o - 1 - Math.floor((o - 1) / 3)) % quante)
  }

  /* ── da quando arrivano da tutte le bocche insieme ──
     Non dalla terza ondata: con tre strade quello vuol dire dividere in
     tre una difesa che ha ancora tre torri di livello uno, e la tappa
     si perde per una ragione che nessuno può vedere. Si comincia a un
     terzo della tappa — mai prima della quinta ondata — quando le torri
     sono cresciute abbastanza da reggere un fronte per parte. */
  get daQuandoInsieme() {
    return this.campagna ? Math.max(5, Math.ceil(this.quante / 3)) : 6
  }

  /* ── il preavviso ──
     Le ondate che arrivano dopo la `dopo`-esima, al massimo `quante`.
     Ognuna sa fra quanto arriva, chi la compone, quanti sono, quanta
     vita ha ciascuno e a quale torre resiste: tutto quello che serve
     per decidere cosa costruire *prima* che serva. */
  prossime(dopo, quante = 3, vie = 1) {
    const out = []
    for (let i = 1; i <= quante; i++) {
      const o = dopo + i
      if (this.campagna && o > this.quante) break
      out.push({ onda: o, fra: i, quanti: this.quantiDi(o), vita: Math.round(this.vitaDi(o)),
                 via: this.viaDi(o, vie), vie,
                 ...this.bestiaDi(o) })
    }
    return out
  }
}
