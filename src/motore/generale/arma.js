/* ═══════════════════════════════════════════════════════════════════
   L'ARMA — chi dichiara fin dove si colpisce, e quanto fa male

   Prima erano due numeri cablati nel verbo: la portata era «una cella»
   scritta dentro `aPortata`, e il danno era una costante in cima al
   motore. Con l'arma come oggetto, dare un arco a un personaggio non
   richiede di riaprire `attacca`, che è la prova che il confine è nel
   posto giusto.

   Ogni unità ne ha una: chi non la dichiara impugna una spada, che è
   esattamente quello che tutti facevano prima.

   ── PERCHÉ È L'ARMA A DIRE «PUOI COLPIRE» E NON UN RAGGIO ──
   Perché per l'arco non basta la distanza: bisogna anche VEDERLO, se no
   si spara attraverso i muri. Sono due condizioni insieme, e invece di
   inventare un'algebra di raggi per un caso solo, risponde l'oggetto
   che quei raggi li possiede già.
   ═══════════════════════════════════════════════════════════════════ */
import { AContatto } from './distanze/a-contatto.js'
import { InAria } from './distanze/in-aria.js'

export class Arma {
  /* ── E IL GESTO, CHE È SUO ──
     «attacca» è il verbo del piano, uguale per tutti; come si vede
     farlo dipende da chi lo fa. L'orco mena, il cuoco prende a
     mestolate, la segretaria sgrida: è lo stesso ostacolo — ti vede, ti
     ferma — con un'altra faccia, e la faccia sta nell'arma, che è già
     il posto dove sta «come colpisce questo personaggio». Chi non lo
     dichiara colpisce, come ha sempre fatto. */
  constructor ({ nome, danno, raggio, gesto } = {}) {
    this.nome = nome || 'la spada'
    this.danno = danno ?? 1
    this.raggio = raggio || new AContatto(1)
    this.gesto = gesto || null
  }

  puoiColpire (mondo, chi, preda) { return this.raggio.arriva(mondo, chi, preda) }
  get comeSiLegge () { return `${this.nome} — ${this.raggio.comeSiLegge}` }
}

/* ── L'ARCO ──
   Arriva lontano perché la freccia i muri li scavalca… no: perché la
   misura è in linea d'aria. Ma serve vedere il bersaglio, se no si
   colpisce attraverso una parete. */
export class Arco extends Arma {
  constructor ({ nome, danno, portata, gesto } = {}) {
    super({ nome: nome || "l'arco", danno, raggio: new InAria(portata ?? 5), gesto })
  }
  puoiColpire (mondo, chi, preda) {
    return super.puoiColpire(mondo, chi, preda) && chi.vede(mondo, preda)
  }
}

/* ── DAL DATO ALL'ARMA ──
   Un livello scrive `arma: { portata: 5, tira: true, danno: 2 }`, o non
   scrive niente. Chi non dichiara nulla ha la spada di sempre, quindi
   nessun livello esistente cambia di una riga. */
export function armaDa (dato) {
  if (dato instanceof Arma) return dato
  if (!dato) return new Arma()
  return dato.tira ? new Arco(dato) : new Arma({
    nome: dato.nome, danno: dato.danno, raggio: new AContatto(dato.portata ?? 1), gesto: dato.gesto,
  })
}
