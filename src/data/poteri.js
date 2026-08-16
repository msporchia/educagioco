/* ═══════════════════════════════════════════════════════════════════
   I POTERI DEGLI ASTEROIDI — si guadagnano giocando, si tengono in
   tasca, e li spendi TU.

   Prima qui c'erano due potenziamenti che si accendevano da soli: il
   cannone doppio dopo cinque risposte di fila e lo scudo abbattendo un
   boss. Non si capivano e non aiutavano abbastanza — è la stessa cosa,
   in realtà: un potere che arriva addosso non è una mossa, è un lampo
   colorato. Non c'è nessun momento in cui il bambino decide qualcosa,
   quindi non c'è niente da ricordare.

   Adesso il filotto **non fa succedere niente**: mette un gettone in
   tasca. Il gettone resta lì fra una partita e l'altra finché non lo si
   preme, e il momento in cui lo si preme è la sola cosa che conta —
   quando la domanda è difficile, quando il cielo è troppo fitto, quando
   la nave è messa male. È lo stesso patto delle monete della cameretta:
   si guadagnano facendo, si spendono scegliendo.

   Cade con questo anche la vecchia regola «un potenziamento non
   risponde mai al posto del bambino», che era scritta per dei poteri
   regalati. La scopa toglie **una** risposta sbagliata dal cielo, e
   quello sconto lo si è già pagato prima con cinque risposte giuste di
   fila: non è un aiuto piovuto addosso, è una cosa comprata.
   ═══════════════════════════════════════════════════════════════════ */

export const POTERI = {
  /* Il gelo rallenta TUTTO il cielo, non un asteroide: quello che manca
     quando si è in difficoltà non è un sasso in meno, è il tempo per
     fare il conto. Dieci secondi sono quasi una caduta intera. */
  gelo: {
    emoji: '❄️', nome: 'Super gelo', colore: '#9fd8ff',
    grido: '❄️ GELO IN TASCA!',
    spiega: 'Premilo e tutto il cielo rallenta per dieci secondi: il tempo di fare il conto con calma.',
  },
  /* La scopa toglie una risposta sbagliata. Non dice qual è quella
     giusta — se i sassi sono sei ne restano cinque — ma è la cosa che
     serve davvero quando il cielo si infittisce, perché salendo di
     livello è proprio il numero dei falsi a crescere. */
  aiuto: {
    emoji: '🧹', nome: 'Scopa', colore: '#ffd94a',
    grido: '🧹 SCOPA IN TASCA!',
    spiega: 'Premila e una risposta sbagliata sparisce dal cielo: una in meno da scartare.',
  },
}

/* L'ordine in cui i gettoni si mostrano in basso a destra: sempre lo
   stesso, così il dito impara dove sta il gelo senza guardare. */
export const ORDINE_POTERI = ['gelo', 'aiuto']

/* ─────────── il gelo ───────────
   Dieci secondi come li ha chiesti chi ci gioca. Il fattore è un terzo
   scarso: meno di così non si nota, di più e il sasso sembra fermo. */
export const GELO = { secondi: 10, fattore: 0.35 }

/* ─────────── il filotto è la moneta ───────────
   Un gettone ogni cinque risposte giuste di fila, e non a fine tappa:
   arriva mentre si sta giocando, che è quando il filotto si sente. La
   soglia è bassa apposta — un premio che capita una volta a partita non
   è un premio, è una leggenda.

   I due poteri si alternano (5 gelo, 10 scopa, 15 gelo…) perché se il
   primo fosse sempre lo stesso il secondo resterebbe sconosciuto per
   settimane, e un potere che non si è mai visto non si spende. */
export function premioDaSerie(serie, ogni = 5) {
  if (serie <= 0 || serie % ogni) return null
  return ((serie / ogni - 1) % 2) === 0 ? 'gelo' : 'aiuto'
}

/* ─────────── l'ultima vita ───────────
   Chi è rimasto con una vita sola sta quasi sempre sbagliando perché non
   fa in tempo, non perché non sa: il cielo rallenta di un quarto. Non è
   un premio, è il contrario — ma è la differenza fra chiudere la partita
   imparando qualcosa e chiuderla e basta. Non si annuncia con un
   cartello: si vede dalla nave, che a quel punto è in fiamme. */
export const EMERGENZA = { sotto: 1, tempo: 1.25 }
