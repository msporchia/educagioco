/* ═══════════════════════════════════════════════════════════════════
   BIVIO — si guarda una volta sola, e si parte

   La domanda si valuta UNA VOLTA, quando il blocco comincia: parte
   esattamente un ramo, e da lì in poi va fino in fondo. Se si
   rivalutasse a ogni passo, un'unità potrebbe partire di là e finire di
   qua a metà strada — che è proprio la cosa che rende un programma
   imprevedibile.

   E decidere NON COSTA UN BATTITO: si guarda e si parte nello stesso
   istante. Perciò dopo aver scelto si esegue subito dentro il ramo,
   senza tornare a chi ci contiene.

   Un ramo può restare VUOTO, e vuol dire «in quel caso non fare
   niente»: una fila vuota risponde subito «ho finito», e non c'è nessun
   caso particolare da scrivere.
   ═══════════════════════════════════════════════════════════════════ */
import { Azione } from './azione.js'
import { domandaDa } from '../domande/indice.js'

export class Bivio extends Azione {
  constructor (via, domanda, vero, falso) {
    super(via)
    this.domanda = domanda
    this.vero = vero
    this.falso = falso
    this.scelto = null
  }

  static compila (dato, via, fila) {
    return new Bivio(via, domandaDa(dato.cond),
      fila(Array.isArray(dato.vero) ? dato.vero : [], [...via, 'vero']),
      fila(Array.isArray(dato.falso) ? dato.falso : [], [...via, 'falso']))
  }

  azzera () { super.azzera(); this.scelto = null; this.vero.azzera(); this.falso.azzera() }
  figli () { return [this.vero, this.falso] }

  esegui (contesto) {
    if (!this.scelto) {
      const { mondo, chi } = contesto
      const vero = this.domanda.valuta(mondo, chi)
      this.scelto = vero ? 'vero' : 'falso'
      this.dice(contesto,
        `${this.domanda.testo(mondo)}? ${vero ? 'sì' : 'no'} — prendo il ramo del ${this.scelto}`,
        'sceglie una strada')
    }
    return this[this.scelto].esegui(contesto)
  }
}
