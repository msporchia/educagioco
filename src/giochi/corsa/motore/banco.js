/* ═══════════════════════════════════════════════════════════════════
   IL BANCO DI PROVA — un giocatore finto che sceglie il cancello

   Non serve al gioco: serve a chi lo prova. Il gioco non lo importa e nel
   file unico non ci finisce (nessuno lo chiama, il build lo scarta).

   In questa corsa il bambino fa **una cosa sola**: guarda tre numeri e
   decide in quale corsia mettersi. Quindi il giocatore finto fa quella —
   calcola cosa gli farebbero i tre cancelli e va dal migliore — e le
   manopole che contano sono due:

     `bravura`  quanto spesso il conto gli viene giusto. A 1 prende
                sempre il migliore; a 0.5 metà delle volte sceglie a
                caso, che è il bambino vero. È questo numero che dice se
                una tappa è giocabile davvero e non solo in teoria.
     `sapienza` quanto spesso risponde giusto all'esercizio del cancello
                d'oro. Sbagliare non toglie niente — resta com'è — e
                anche questo va misurato: **una tappa che si vince solo
                rispondendo bene sarebbe una tappa che si perde a
                scuola**, e non è questo il patto.

   `gusto` è se il cancello d'oro lo prende o tira dritto: `studioso` lo
   sceglie quando conviene, `svelto` non lo guarda mai. Serve a provare
   che si finisce la campagna **anche senza fare un solo esercizio** — se
   no non è un'offerta, è un pedaggio con un altro nome.
   ═══════════════════════════════════════════════════════════════════ */
import { Partita } from './corsa.js'

/* Da quanto lontano decide. Un bambino guarda il cancello quando è
   leggibile, non appena spunta all'orizzonte. */
const SGUARDO = 26

export class Pilota {
  constructor({ rnd = Math.random, bravura = 1, sapienza = 0.8, gusto = 'studioso',
                fretta = false } = {}) {
    this.rnd = rnd
    this.bravura = bravura
    this.sapienza = sapienza
    this.gusto = gusto
    /* `fretta` è il bambino che martella lo schermo per non aspettare.
       Serve a provare la cosa che la spinta non deve mai fare: rubare il
       tempo di leggere i cancelli. */
    this.fretta = fretta
    this.domande = 0
    this.giuste = 0
  }

  /* Quanto vale un cancello per lui, adesso. Il cancello d'oro vale
     quanto pensa di saperne: chi non risponde mai lo conta come niente e
     tira dritto. */
  valore(op, truppa, tetto) {
    /* si guarda dove si arriva **dopo il tetto**: sopra il tetto due
       cancelli diversissimi sono la stessa cosa, e un pilota che non lo
       sapesse racconterebbe una precisione che non c'è */
    if (!op.libro) return Math.min(tetto, op.f(truppa))
    if (this.gusto !== 'studioso') return -1
    return Math.min(tetto, truppa * (1 + 4 * this.sapienza))
  }

  guida(partita) {
    if (this.fretta) partita.spingi()
    const cose = partita.cose.filter(c => !c.fatto && c.z - partita.dist > 0.6)
    const cancello = cose.filter(c => c.tipo === 'cancelli')
      .sort((a, b) => a.z - b.z)[0]

    if (cancello && cancello.z - partita.dist < SGUARDO) {
      /* il conto gli viene, oppure no: sotto la bravura sceglie a caso,
         che è quello che fa un bambino che non ha fatto in tempo */
      if (this.rnd() > this.bravura) return partita.punta(Math.floor(this.rnd() * 3) - 1)
      let miglioreI = 0, migliore = -Infinity
      for (const [i, op] of cancello.ops.entries()) {
        const v = this.valore(op, partita.truppa, partita.regole.tetto)
        if (v > migliore) { migliore = v; miglioreI = i }
      }
      return partita.punta(miglioreI - 1)
    }

    /* fra un cancello e l'altro: prendi le casse, scansa i coni */
    const vicine = cose.filter(c => (c.tipo === 'cassa' || c.tipo === 'cono') &&
                                    c.z - partita.dist < 12)
    const cassa = vicine.find(c => c.tipo === 'cassa')
    if (cassa) return partita.punta(cassa.corsia)
    const cono = vicine.find(c => c.tipo === 'cono' && c.corsia === Math.round(partita.corsiaX))
    if (cono) return partita.punta(cono.corsia === 1 ? 0 : cono.corsia + 1)
    return false
  }

  /* L'esercizio del cancello d'oro. Sbagliare costa il giro e nient'altro. */
  rispondi(partita) {
    if (!partita.inPausa) return null
    this.domande++
    const giusto = this.rnd() < this.sapienza
    if (giusto) this.giuste++
    return partita.rispondi(giusto)
  }
}

/* Una partita giocata dal finto giocatore. `dt` fisso: il tempo di questo
   gioco non è quello dell'orologio, è quello che gli si dà. */
export function gioca(regole, {
  rnd = Math.random, dt = 1 / 30, bravura = 1, sapienza = 0.8, gusto = 'studioso',
  fermo = false, fino = 240, fretta = false,
} = {}) {
  const partita = new Partita(regole, { rnd })
  const pilota = new Pilota({ rnd, bravura, sapienza, gusto, fretta })
  const massimo = Math.ceil(fino / dt) + 400
  let passi = 0
  while (passi++ < massimo) {
    if (partita.finita) break
    if (partita.inPausa) { pilota.rispondi(partita); continue }
    if (!fermo) pilota.guida(partita)
    partita.avanza(dt)
    if (partita.eventi.length) partita.svuotaEventi()
    if (regole.infinita && partita.dist >= fino) break
  }
  return { partita, pilota }
}

/* Quante volte su cento questo giocatore porta a casa la tappa, con
   quante stelle, e quanto grossa gli arriva la truppa. È il numero che
   dice se una tappa è tarata: sotto una certa soglia non è difficile, è
   ingiusta — e sopra un'altra non è una tappa, è una passeggiata. */
export function misura(regole, { volte = 20, rnd = Math.random, ...resto } = {}) {
  let vinte = 0, stelle = 0, truppa = 0, persi = 0, metri = 0, domande = 0, tre = 0
  for (let i = 0; i < volte; i++) {
    const { partita, pilota } = gioca(regole, { rnd, ...resto })
    if (partita.vinta) vinte++
    if (partita.stelle === 3) tre++
    stelle += partita.stelle
    truppa += partita.truppa
    persi += partita.persi
    metri += partita.dist
    domande += pilota.domande
  }
  return {
    volte, vinte, quota: vinte / volte, treStelle: tre / volte,
    stelleMedie: stelle / volte,
    truppaMedia: truppa / volte,
    persiMedi: persi / volte,
    metriMedi: metri / volte,
    domandeMedie: domande / volte,
  }
}

/* Il caso ripetibile: due prove uguali devono raccontare la stessa
   storia, o un test rosso non si sa se è un guasto o sfortuna. */
export function caso(seme = 1) {
  let s = seme >>> 0 || 1
  return () => {
    s ^= s << 13; s >>>= 0
    s ^= s >>> 17
    s ^= s << 5; s >>>= 0
    return s / 4294967296
  }
}
