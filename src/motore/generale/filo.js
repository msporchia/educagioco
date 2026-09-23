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

   ── ASCOLTARE E REAGIRE SONO LA STESSA REGOLA ──
   Una reazione è **come sei fatto**, un ascolto è una cosa che **hai
   scritto tu**; tutte e due ti prendono mentre stai facendo altro, ti
   fanno fare la loro cosa e poi ti restituiscono dov'eri. Un ascolto
   aspettava educatamente che il personaggio fosse libero — e in pratica
   il segnale arrivato mentre camminava andava perso, mentre la cassetta
   prometteva al bambino il contrario. Deciso dall'utente il 23
   settembre 2026: «concettualmente dovrebbe interrompere, è su questo
   che si basa il "vedi un nemico mentre cammini"». La priorità resta la
   differenza fra il piano e tutto il resto, non fra chi l'ha scritto.
   ═══════════════════════════════════════════════════════════════════ */

/* chi può togliere il posto a chi */
export const NORMALE = 0
export const REAZIONE = 10
/* il «quando senti» del bambino: interrompe come una reazione */
export const ASCOLTO = REAZIONE
/* ── E VEDERE UN AVVERSARIO SCAVALCA TUTTO IL RESTO ──
   Le reazioni erano tutte alla pari, e a parità vince chi sta già
   girando: un carceriere che correva verso un rumore **passava
   attraverso la ladra** senza fermarsi, perché la corsa era partita
   prima e «non si cambia cavallo per niente». Era la soluzione ufficiale
   del «Richiamo», e un bambino l'ha vista: l'orco ti passa davanti e non
   succede niente. La regola che uno si aspetta è quella dei giochi di
   guardie di sempre — prima quello che vedi, poi quello che senti, poi
   il tuo giro — e sta tutta in questo numero. */
export const VISTA = 20

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
