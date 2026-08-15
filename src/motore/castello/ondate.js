/* ═══════════════════════════════════════════════════════════════════
   LE ONDATE — chi arriva, quanti sono, e quando.

   Il ciclo della tappa in una classe sola: data un'ondata, dice chi la
   compone, quanti nemici sono, ogni quanto escono dall'ingresso. Non
   tiene tempo e non fa camminare nessuno: è una **tabella calcolata**,
   e per questo si può guardare anche in avanti.

   ── il preavviso ──
   Ed è tutto il punto. Chi arriva è deterministico — `mostroDiOnda`
   dipende solo dal numero dell'ondata — quindi «fra tre ondate arriva
   il Golem, debole alle bombe» si può dire *adesso*, mentre il campo è
   pulito e si stanno facendo i conti per comprare. Prima la debolezza
   si scopriva quando l'ondata era già partita, cioè quando non serviva
   più a niente: era un dettaglio, non una decisione.

   `prossime()` è quello che l'interfaccia mette in un nastro, ed è il
   solo motivo per cui il motore espone il futuro invece del presente.
   ═══════════════════════════════════════════════════════════════════ */
import { nemiciDiOnda, intervalloDiOnda, vitaNemico, velocitaNemico } from '../../data/castello.js'
import { MOSTRI, mostroDiOnda, mostroLibero, torreDebole } from '../../data/mostri.js'

export class Ondate {
  constructor(tappa) { this.tappa = tappa }

  /* la partita libera non ha un numero di ondate: non finisce */
  get campagna() { return Number.isFinite(this.tappa.ondate) }
  get quante() { return this.tappa.ondate }
  ultima(o) { return this.campagna && o >= this.quante }

  /* Chi arriva in questa ondata: un tipo solo, così la scheda in alto a
     destra parla di lui e scegliere la torre è una domanda con una
     risposta. La debolezza c'è solo dove la tappa la prevede. */
  bestiaDi(o) {
    const id = this.tappa.mostri ? mostroDiOnda(this.tappa.mostri, o) : mostroLibero(o)
    return { id, ...MOSTRI[id], debole: this.tappa.debolezze ? torreDebole(id) : null }
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
     vita ha ciascuno e a quale torre è debole: tutto quello che serve
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
