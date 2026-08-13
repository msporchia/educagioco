/* ═══════════════════════════════════════════════════════════════════
   FILO — una delle cose che un personaggio sta facendo

   Un personaggio ha UN piano, ma può avere più fili: quello principale,
   uno per ogni «quando senti» che è scattato, e — quando ci saranno —
   uno per ogni reazione che gli è addosso («se sento un rumore, corro
   a vedere»). Ne gira sempre **uno solo**: c'è un puntatore all'attivo,
   gli altri stanno in pausa, e quando l'attivo finisce il puntatore
   torna a chi aspettava.

   È la ragione per cui non serve più il timore che c'era prima — due
   file che comandano lo stesso personaggio nello stesso battito, una
   che lo manda di qua e una di là, e quello che si vede a schermo non
   lo spiega nessuno dei due piani. Con un puntatore solo non può
   succedere.

   ── LA PRIORITÀ È LA DIFFERENZA FRA ASCOLTARE E REAGIRE ──
   Un ascolto è una cosa che **hai scritto tu**: aspetta educatamente
   che il personaggio sia libero, perché se ti interrompesse a metà
   strada il tuo piano non si spiegherebbe più. Una reazione è **come
   sei fatto**: ti prende mentre stai facendo altro, ti fa fare la sua
   cosa e poi ti restituisce dov'eri. Sono la stessa struttura con un
   numero diverso.
   ═══════════════════════════════════════════════════════════════════ */

/* chi può togliere il posto a chi */
export const NORMALE = 0
export const REAZIONE = 10

export class Filo {
  constructor (fila, nome, priorita = NORMALE) {
    this.fila = fila
    /* come si chiama, per il registro: «principale», «quando "un
       rumore"», il nome di un'azione */
    this.nome = nome || 'principale'
    this.priorita = priorita
    this.finito = false
  }

  /* può prendere il posto di quello che sta girando adesso? */
  scavalca (altro) { return !altro || this.priorita > altro.priorita }

  azzera () { this.finito = false; this.fila.azzera() }
}

/* ═══════════════════════════════════════════════════════════════════
   ASCOLTATORE — «se arriva questo, fai quello»

   Non è un filo: è la promessa di farne uno. Sta appeso al personaggio
   finché il suo segnale non arriva, e allora produce il filo che
   entrerà in gioco. Riusa sempre lo stesso, perché sentire due volte
   lo stesso segnale non deve far partire due esecuzioni parallele —
   deve rifarla da capo, quando è il momento.
   ═══════════════════════════════════════════════════════════════════ */
export class Ascoltatore {
  constructor (segnale, fila, comeSiChiama, priorita = NORMALE) {
    this.segnale = segnale
    this.filo = new Filo(fila, comeSiChiama, priorita)
  }

  /* mi riguarda? */
  riconosce (messaggio) { return messaggio.segnale === this.segnale }
}
