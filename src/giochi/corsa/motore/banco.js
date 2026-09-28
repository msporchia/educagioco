// Il banco di prova: un giocatore finto che guarda tre numeri e sceglie
// la corsia. `bravura` è quanto spesso il conto gli viene giusto (a 1
// prende sempre il migliore, a 0.5 metà delle volte sceglie a caso);
// `sapienza` quanto spesso risponde giusto al cancello d'oro; `gusto`
// se lo prende (`studioso`) o tira dritto (`svelto`), per provare che la
// campagna si finisce anche senza fare un esercizio.
import { Partita } from './corsa.js'

// da quanto lontano decide: un bambino guarda il cancello quando è leggibile
const SGUARDO = 26

export class Pilota {
  constructor({ rnd = Math.random, bravura = 1, sapienza = 0.8, gusto = 'studioso',
                fretta = false } = {}) {
    this.rnd = rnd
    this.bravura = bravura
    this.sapienza = sapienza
    this.gusto = gusto
    this.fretta = fretta   // il bambino che martella lo schermo per non aspettare
    this.domande = 0
    this.giuste = 0
  }

  // quanto vale un cancello per lui, adesso: il cancello d'oro vale
  // quanto pensa di saperne
  valore(op, truppa, tetto) {
    // si guarda dove si arriva dopo il tetto, o un pilota "esatto" oltre
    // il tetto racconterebbe una precisione che non c'è
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
      if (this.rnd() > this.bravura) return partita.punta(Math.floor(this.rnd() * 3) - 1)
      let miglioreI = 0, migliore = -Infinity
      for (const [i, op] of cancello.ops.entries()) {
        const v = this.valore(op, partita.truppa, partita.regole.tetto)
        if (v > migliore) { migliore = v; miglioreI = i }
      }
      return partita.punta(miglioreI - 1)
    }

    // fra un cancello e l'altro: prendi le casse, scansa i coni
    const vicine = cose.filter(c => (c.tipo === 'cassa' || c.tipo === 'cono') &&
                                    c.z - partita.dist < 12)
    const cassa = vicine.find(c => c.tipo === 'cassa')
    if (cassa) return partita.punta(cassa.corsia)
    const cono = vicine.find(c => c.tipo === 'cono' && c.corsia === Math.round(partita.corsiaX))
    if (cono) return partita.punta(cono.corsia === 1 ? 0 : cono.corsia + 1)
    return false
  }

  rispondi(partita) {
    if (!partita.inPausa) return null
    this.domande++
    const giusto = this.rnd() < this.sapienza
    if (giusto) this.giuste++
    return partita.rispondi(giusto)
  }
}

// `dt` fisso: il tempo di questo gioco non è quello dell'orologio, è
// quello che gli si dà.
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

// Quante volte su cento questo giocatore porta a casa la tappa, con
// quante stelle, e quanto grossa gli arriva la truppa: il numero che
// dice se una tappa è tarata.
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

export function caso(seme = 1) {
  let s = seme >>> 0 || 1
  return () => {
    s ^= s << 13; s >>>= 0
    s ^= s >>> 17
    s ^= s << 5; s >>>= 0
    return s / 4294967296
  }
}
