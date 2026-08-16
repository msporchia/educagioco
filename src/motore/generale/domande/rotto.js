/* ═══════════════════════════════════════════════════════════════════
   ROTTO — «il tamburo è sfondato»

   Lo stato di una cosa che si può rompere, e si chiede a lei, che è
   l'unica a saperlo (`Elemento.chiedi`). È la controparte di `attacca`
   sulle cose: senza una domanda, il sabotaggio si potrebbe fare e non
   si potrebbe né vincere né aspettare — cioè non varrebbe niente.

   ── E VALE IL VINCOLO DI SEMPRE ──
   Uguale a `aperta`: un personaggio sa quello che vede. Il tamburo
   dall'altra parte della mappa non è né rotto né intero per chi non lo
   vede — è una cosa che non può sapere, e me lo deve dire qualcuno.
   Quando invece a chiedere è il LIVELLO (le condizioni di vittoria e di
   sconfitta) non c'è nessun `chi`, e nessun vincolo: quello è il mondo
   guardato dall'alto.
   ═══════════════════════════════════════════════════════════════════ */
import { Domanda, NonPossoSaperlo } from './domanda.js'

export class Rotto extends Domanda {
  static parola = 'rotto'

  valuta (mondo, chi) {
    const cosa = mondo.laCosa(this.di, chi)
    if (!cosa || typeof cosa.chiedi !== 'function') return false
    if (chi && !chi.vede(mondo, cosa))
      throw new NonPossoSaperlo(
        `${this.nomeDi(mondo)} non lo vedo da qui: non posso sapere se è rotto — ` +
        'me lo deve dire qualcuno')
    return !!cosa.chiedi('rotto')
  }

  testo (mondo) { return `${this.nomeDi(mondo)} è rotto` }
  testoNegato (mondo) { return `${this.nomeDi(mondo)} è intero` }
}
