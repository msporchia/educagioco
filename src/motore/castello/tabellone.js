// Il tabellone: cuori, ondata, uccisi, torri, energia. L'unica cosa che il
// motore scrive fuori da sé (chi lo crea gli passa un oggetto e se lo
// ritrova aggiornato). Non sa i prezzi: il prezzo lo dice chi compra.
import { CFG } from '../../data/castello.js'

export class Tabellone {
  constructor(stato) { this.stato = stato }

  azzera(partenza) {
    const s = this.stato
    s.cuori = CFG.cuori; s.onda = 0; s.uccisi = 0; s.torri = 0; s.energia = partenza
    this.resto = 0
  }

  get cuori() { return this.stato.cuori }
  get onda() { return this.stato.onda }
  get energia() { return this.stato.energia }

  paga(quanto) { this.stato.energia = Math.max(0, this.stato.energia - quanto) }
  // l'energia a schermo è sempre intera, ma quello che si incassa può non
  // esserlo (chi si divide, chi si rialza): i resti si accumulano e si
  // pagano quando fanno un punto intero
  incassa(quanto) {
    this.resto = (this.resto || 0) + quanto
    const intero = Math.floor(this.resto + 1e-9)
    this.resto -= intero
    this.stato.energia += intero
    return intero
  }

  perNemico(piu = 0, quanti = 1) { return this.incassa(CFG.perNemico * quanti + (piu || 0)) }
  perOnda(pulita) { return this.incassa(CFG.fineOnda + (pulita ? CFG.ondataPulita : 0)) }
  perFretta(premio) { return this.incassa(premio) }

  ondaNuova() { return ++this.stato.onda }
  torreNuova() { this.stato.torri++ }
  ucciso() { this.stato.uccisi++ }
  cuoreVia() { return --this.stato.cuori <= 0 }   // true se il castello è caduto

  foto() { return { ...this.stato } }
  riprendi(f) { Object.assign(this.stato, f) }
}
