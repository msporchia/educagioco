// Quanto rende una cosa fatta, pagata nel momento in cui si fa: niente premi
// di fine tappa, niente moltiplicatori, mai una mezza moneta. Il perché di
// ogni numero sta in docs/apprendimento/calibrazione.md («Si paga subito»).
// I giochi che avevano già una tabella loro la tengono: conta (`premio` di
// ogni tappa), pozioni (`MONETE_A_DOSE`), bancarella (`MONETE_CLIENTE`),
// inglese a mondi (`giochi/inglese/dati/monete.js`).
export const PAGA = {
  asteroide: 1,      // una tabellina o un calcolo a mente: un colpo d'occhio
  parola: 1,         // una parola dello spagnolo: come quelle dell'inglese
  cancello: 1,       // un cancello della corsa preso giusto: tre conti letti al volo
  mossa: 1,          // una domanda che è la mossa stessa (dungeon, sotterraneo): una ogni pochi secondi
  domanda: 3,        // una domanda che ferma il gioco (survivors, il libro della corsa)
  operazione: 3,     // un'operazione in colonna del castello, senza errori
  storia: 2,         // una storia di Prima e dopo rimessa in ordine
}

export function guastiDellePaghe(paghe = PAGA) {
  const g = []
  for (const [k, v] of Object.entries(paghe))
    if (!(Number.isInteger(v) && v >= 1 && v <= 4)) g.push(`${k}: ${v} (una cosa fatta vale da 1 a 4 monete intere)`)
  return g
}
