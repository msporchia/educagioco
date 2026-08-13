/* ═══════════════════════════════════════════════════════════════════
   APERTA — «il portone è aperto»

   Lo stato di una porta, e si chiede alla porta, che è l'unica a
   saperlo.

   ── MA NON DA QUALUNQUE POSTO ──
   Se a chiedere è un personaggio, vale il vincolo di sempre: si sa
   quello che si vede. Il portone dall'altra parte della mappa non è né
   aperto né chiuso per chi non lo vede — è una cosa che non può
   sapere, e rispondere «chiuso» sarebbe una bugia comoda che
   trasformerebbe un piano sbagliato in uno che funziona per caso.
   Perciò lancia, e chi ha fatto la domanda decide cosa farne: chi
   aspetta dice «me lo deve dire qualcuno», ed è così che il gioco
   insegna a cosa servono i segnali.

   Quando invece a chiedere è il LIVELLO — le condizioni di vittoria e
   di sconfitta — non c'è nessun `chi`, e nessun vincolo: quello è il
   mondo che si guarda dall'alto, non un personaggio che sbircia.
   ═══════════════════════════════════════════════════════════════════ */
import { Domanda, NonPossoSaperlo } from './domanda.js'

export class Aperta extends Domanda {
  static parola = 'aperta'

  valuta (mondo, chi) {
    const porta = mondo.laCosa(this.di, chi)
    if (!porta || typeof porta.chiedi !== 'function') return false
    if (chi && !chi.vede(mondo, porta))
      throw new NonPossoSaperlo(
        `${this.nomeDi(mondo)} non lo vedo da qui: non posso sapere se è aperto — ` +
        'me lo deve dire qualcuno')
    return !!porta.chiedi('aperta')
  }

  testo (mondo) { return `${this.nomeDi(mondo)} è aperto` }
  testoNegato (mondo) { return `${this.nomeDi(mondo)} è chiuso` }
}
