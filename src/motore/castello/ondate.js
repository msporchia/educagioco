// Le ondate: chi arriva, quanti sono, quando escono. Una tabella calcolata
// (niente tempo, nessuno cammina), deterministica per ondata: è quello che
// rende possibile il preavviso, mostrato prima che l'ondata parta.
import { nemiciDiOnda, intervalloDiOnda, vitaNemico, velocitaNemico, insiemeDa,
         boccaDellOnda } from '../../data/castello.js'
import { MOSTRI, CAPO, ABILITA, mostroDiOnda, mostroLibero, immuniDi, coppiaDellOnda }
  from '../../data/mostri.js'

const RITMO = { stretto: 0.5, mosso: 0.25, gruppo: [2, 3], da: 3, quota: 1 / 3, sfalso: 30 }
// un numero fra 0 e 1 che dipende solo da `a` e `b`: tira sempre lo stesso
// per la stessa ondata (il ritmo e lo sfalso devono essere ripetibili)
function caso(a, b = 0) {
  let h = Math.imul(a + 1, 2654435761) ^ Math.imul(b + 7, 40503)
  h = Math.imul(h ^ (h >>> 15), 2246822519)
  return ((h ^ (h >>> 13)) >>> 0) / 4294967296
}

export class Ondate {
  // chi arriva non cambia mai: si calcola una volta per ondata (`bestiaDi`)
  constructor(tappa) { this.tappa = tappa; this.bestie = new Map() }

  get campagna() { return Number.isFinite(this.tappa.ondate) }
  get quante() { return this.tappa.ondate }
  ultima(o) { return this.campagna && o >= this.quante }

  // Chi arriva: di solito un tipo solo. Nelle miste il secondo tipo sta in
  // `con` (vedi docs/castello/mostri.md); il primo resta quello che la fila
  // avrebbe mandato comunque. Le immunità sono sempre accese (com'è fatto
  // il mostro); le abilità solo se la tappa le accende (`abilita`).
  bestiaDi(o) {
    if (!this.bestie.has(o)) this.bestie.set(o, this.componi(o))
    return this.bestie.get(o)
  }
  componi(o) {
    const capo = this.eCapo(o)
    const coppia = capo ? null : coppiaDellOnda(this.tappa, o)
    const id = coppia ? coppia[0]
      : this.tappa.mostri ? mostroDiOnda(this.tappa.mostri, o) : mostroLibero(o)
    const b = { ...this.schedaDi(id), capo }
    if (coppia) b.con = this.schedaDi(coppia[1])
    return b
  }
  schedaDi(id) {
    const m = MOSTRI[id] || {}
    return { id, nome: m.nome, vola: !!m.vola, immune: immuniDi(id),
             abilita: this.tappa.abilita ? m.abilita || null : null }
  }

  // Quanti per tipo, in una mista: metà e metà, ognuno con la sua `folla`.
  perTipoDi(o) {
    const b = this.bestiaDi(o)
    const n = nemiciDiOnda(o)
    const folla = x => (x.abilita ? ABILITA[x.abilita].folla : 1)
    return [Math.max(1, Math.round(n / 2 * folla(b))), Math.max(1, Math.round(n / 2 * folla(b.con)))]
  }
  // Chi esce per k-esimo: alternati, spargendo lungo la fila chi è di meno
  // invece di finire tutti in fondo.
  chiEsce(o, k, b = this.bestiaDi(o)) {
    if (!b.con) return b
    const [na, nb] = this.perTipoDi(o)
    const tot = na + nb
    return Math.floor((k + 1) * nb / tot) > Math.floor(k * nb / tot) ? b.con : b
  }

  eCapo(o) {
    const t = this.tappa
    return !!((t.capi && o > 0 && o % t.capi === 0) ||
              (t.capo && this.campagna && o === this.quante))
  }

  // Chi ha un'abilità arriva in meno (`folla`): un'ondata intera di chi si
  // divide non la ferma la vita, la ferma quante frecce al secondo si
  // tirano (misurato coi vermi). L'energia dell'ondata non cambia (`pagaDi`).
  follaDi(o) {
    if (this.eCapo(o)) return 1
    const b = this.bestiaDi(o)
    if (b.con) return this.quantiDi(o) / nemiciDiOnda(o)
    return b.abilita ? ABILITA[b.abilita].folla : 1
  }
  quantiDi(o) {
    if (this.eCapo(o)) return 1
    if (this.bestiaDi(o).con) { const [na, nb] = this.perTipoDi(o); return na + nb }
    return Math.max(1, Math.round(nemiciDiOnda(o) * this.follaDi(o)))
  }
  intervalloDi(o) { return intervalloDiOnda(o) / this.follaDi(o) }
  // Il passo fra un mostro e il dopo: dalla terza ondata, una su tre esce a
  // gruppetti (dove le torri ad area rendono), le altre con un ritmo mosso.
  // Deterministico (il numero dell'ondata, non il caso) e in media 1 (la
  // durata e l'energia dell'ondata non cambiano).
  ritmoDi(o, k) {
    // le prime due ondate escono regolari: due mostri vicini sull'unica
    // torre appena costruita sarebbero un cuore perso senza aver capito niente
    if (o < RITMO.da) return 1
    if (caso(o) < RITMO.quota) {
      const [da, a] = RITMO.gruppo
      const g = da + Math.floor(caso(o, 99) * (a - da + 1))
      return k % g < g - 1 ? RITMO.stretto : g - RITMO.stretto * (g - 1)
    }
    return 1 - RITMO.mosso + 2 * RITMO.mosso * caso(o, k + 1)
  }
  // Di quanto il k-esimo mostro esce indietro rispetto alla bocca (fra zero
  // e RITMO.sfalso): deterministico, perché altrimenti la stessa ondata
  // usciva diversa fra taratura e partita vera, e un soffio decideva chi
  // finiva sotto la stessa bomba.
  sfalsoDi(o, k) { return caso(o, k + 1000) * RITMO.sfalso }
  vitaDi(o) {
    const v = vitaNemico(this.tappa, o)
    return this.eCapo(o) ? v * nemiciDiOnda(o) * CAPO.vita : v
  }
  velocitaDi(o) { return velocitaNemico(this.tappa, o) * (this.eCapo(o) ? CAPO.passo : 1) }
  // il capo vale l'ondata intera: l'energia lasciata non cambia se è capo o no
  pagaDi(o) { return nemiciDiOnda(o) / this.quantiDi(o) }

  // Da che ingresso arriva l'ondata: con due si alternano, ogni terza da
  // tutte e due insieme (-1). Deterministico, per il preavviso.
  viaDi(o, quante = 1) { return boccaDellOnda(o, quante, this.daQuandoInsieme) }

  get daQuandoInsieme() { return insiemeDa(this.quante) }

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
