/* «vedi l'orco», «vedi gli orchi» — la percezione, e il metro di tutte
   le altre. Si vede a distanza di cammino: un muro in mezzo toglie la
   vista, e una porta chiusa acceca tutti e due i lati. */
import { Domanda } from './domanda.js'

export class Vedi extends Domanda {
  static parola = 'vedi'
  /* è l'unità a dire fin dove vede — il suo raggio è suo, e un giorno
     può essere diverso da quello di chiunque altro. Senza nessuno che
     guardi (quando a chiedere è il livello) non vede nessuno: guardare
     è una cosa che fa qualcuno. */
  valuta (mondo, chi) {
    if (!chi) return false
    return mondo.vivi().some(u => u !== chi && this.combacia(u) && chi.vede(mondo, u))
  }
  /* il complemento può essere l'id di un'unità o il nome di una
     schiera: «vedi l'orco» e «vedi gli orchi». Chi è già caduto l'ha
     tolto di mezzo `vivi()`: qui non si guarda dentro nessuno. */
  combacia (u) { return u.id === this.di || u.fazione === this.di }
  testo (mondo) { return `vedi ${this.nomeDi(mondo)}` }
  testoNegato (mondo) { return `non vedi ${this.nomeDi(mondo)}` }
}
