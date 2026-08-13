/* ═══════════════════════════════════════════════════════════════════
   DEFINIZIONE — un pezzo di piano con un nome

   Non è un ordine: è una dichiarazione. Nella fila si scavalca senza
   che costi un battito, come una riga di intestazione — e chi la
   esegue davvero è `Chiama`, che va a cercarla per nome.

   Il nome lo mette il gioco («azione 1», «azione 2»): a sei anni
   scrivere un nome è una tastiera in mezzo al pensiero.
   ═══════════════════════════════════════════════════════════════════ */
import { Azione } from './azione.js'
import { Esito } from './esiti.js'

export class Definizione extends Azione {
  constructor (via, nome) { super(via); this.nome = nome }
  static compila (dato, via) { return new Definizione(via, dato.nome) }
  esegui () { return Esito.finitoSubito() }
}
