// I tempi del contadino nella fattoria in comune, senza niente di three: li usano Gioco.vue, scena3d/ospite.js e il banco
// (docs/fattoria3d/in-comune.md, «I due contadini»).
export const OGNI_QUI = 200              // ms fra un controllo e l'altro: fino a cinque messaggi al secondo
export const ANCORA_QUI = 2000           // ms: anche da fermo si dice che si è lì, con l'abito
export const SPARISCE = 10000            // ms senza notizie: più di quanto serve a scoprire un filo morto e riaprirlo

/* Chi decide se una posizione parte. `manda(messaggio)` dice se è partita: una che non è partita si riprova al giro dopo. */
export function spedizione(manda, ora = () => performance.now()) {
  let spedito = '', speditoA = -Infinity
  return (m, abito) => {
    const firma = JSON.stringify(m), t = ora(), ancora = t - speditoA >= ANCORA_QUI
    if (firma === spedito && !ancora) return
    if (manda(ancora ? { ...m, a: { ...abito } } : m)) { spedito = firma; speditoA = t }
  }
}
