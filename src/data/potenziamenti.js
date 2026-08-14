/* ═══════════════════════════════════════════════════════════════════
   I POTENZIAMENTI DELL'ASTRONAVE — si guadagnano giocando, e finiscono
   con la partita.

   Regola che li tiene tutti in riga: **un potenziamento non risponde mai
   al posto del bambino.** Nessuno di questi toglie un calcolo, ne
   accorcia uno o segnala quale asteroide sia quello giusto — un aiuto
   così farebbe salire i punti e scendere quello che si impara, che è
   l'unica cosa che il gioco è venuto a fare. Quello che possono fare è
   pagare meglio chi va bene (il cannone doppio), perdonare una botta
   (lo scudo) e dare più tempo a chi è in difficoltà (l'emergenza).

   Nessuna moneta, nessun negozio: le monete sono la valuta della
   cameretta e un hangar che le succhia sposterebbe l'equilibrio di un
   gioco che non c'entra niente. Qui si paga con le risposte giuste.
   ═══════════════════════════════════════════════════════════════════ */

export const POTENZIAMENTI = {
  /* Il premio del filotto. Dura finché non si sbaglia — «a tempo»
     sarebbe stato più facile da scrivere, ma un bambino non guarda un
     conto alla rovescia mentre calcola; «lo perdi se sbagli» invece lo
     capisce la prima volta che gli succede. */
  doppio: {
    emoji: '🔫', nome: 'Cannone doppio', colore: '#ffd94a',
    grido: '🔫 CANNONE DOPPIO!',
    spiega: 'Due colpi invece di uno: porta via anche i sassi vicini, e i punti valgono doppio. Si perde sbagliando.',
  },
  /* Il premio del boss. Un errore o una caduta se la prende lui invece
     della vita: è la rete che permette di rischiare una risposta invece
     di lasciar cadere il sasso per paura. */
  scudo: {
    emoji: '🛡️', nome: 'Scudo', colore: '#7fe3ff',
    grido: '🛡️ SCUDO ATTIVO!',
    spiega: 'Para il prossimo colpo: un errore o un sasso caduto non costa una vita.',
  },
}

/* Quanto vale un colpo andato a segno con il cannone doppio, e quanti
   sassi sbagliati si porta via l'onda. Due, non tutti: se ripulisse il
   cielo la domanda dopo arriverebbe in un campo vuoto. */
export const DOPPIO = { punti: 2, spazza: 2 }

/* ─────────── il filotto ───────────
   Cinque di fila il cannone, dieci una vita (era già così e resta), poi
   si ricomincia: quindici il cannone di nuovo, venti la vita. Le soglie
   sono basse apposta — un premio che arriva una volta a partita non è
   un premio, è una leggenda. */
export function premioDaSerie(serie, ogniVita = 10) {
  if (serie > 0 && serie % ogniVita === 0) return 'vita'
  if (serie > 0 && serie % 5 === 0) return 'doppio'
  return null
}

/* ─────────── l'ultima vita ───────────
   Chi è rimasto con una vita sola sta quasi sempre sbagliando perché non
   fa in tempo, non perché non sa: il cielo rallenta di un quarto e la
   nave accende le luci rosse. Non è un premio, è il contrario — ma è la
   differenza fra chiudere la partita imparando qualcosa e chiuderla e
   basta. Non si annuncia con un cartello: si vede dalla nave. */
export const EMERGENZA = { sotto: 1, tempo: 1.25 }
