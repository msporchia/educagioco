/* ═══════════════════════════════════════════════════════════════════
   SENTITO — «è arrivato il via libera»

   Chiede a CHI FA LA DOMANDA se quel segnale gli è arrivato davvero.
   Non se qualcuno l'ha mandato: se **lui** l'ha sentito.

   ── PERCHÉ LA DIFFERENZA È DIVENTATA VERA ──
   Finché un segnale arrivava dappertutto le due cose coincidevano, e
   questa domanda guardava un elenco globale del mondo. Poi il rumore ha
   preso una portata — un fracasso attraversa il castello, un cigolio lo
   sente solo chi è dietro la porta — e da quel giorno l'elenco globale è
   diventato una bugia: rispondeva di sì anche a chi era troppo lontano.
   Peggio di una bugia qualsiasi, perché è di quelle comode: un piano
   costruito su «lui non può sentirmi da lì» funzionava per il motivo
   sbagliato, e non si sarebbe rotto finché qualcuno non ci avesse
   costruito sopra un livello.

   Adesso l'unità registra quello che le arriva (`Unita.senti`), e la
   consegna passa da lì: il messaggio raggiunge un personaggio solo se
   `arrivaA` dice di sì.

   ── QUANDO A CHIEDERE È IL LIVELLO ──
   Le condizioni di vittoria non le fa nessun personaggio: lì `chi` è
   nullo, e la domanda torna a guardare il mondo. È lo stesso principio
   di tutte le altre domande — un vincolo di percezione ha senso solo se
   c'è qualcuno che percepisce.
   ═══════════════════════════════════════════════════════════════════ */
import { Domanda } from './domanda.js'

export class Sentito extends Domanda {
  static parola = 'segnale'

  valuta (mondo, chi) {
    if (chi && typeof chi.haSentito === 'function') return chi.haSentito(this.di)
    return mondo.segnaliMandati.includes(this.di)
  }

  testo (mondo) { return `è arrivato «${this.nomeDi(mondo)}»` }
  testoNegato (mondo) { return `non è arrivato «${this.nomeDi(mondo)}»` }
}
