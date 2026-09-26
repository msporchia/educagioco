/* ═══════════════════════════════════════════════════════════════════
   IL CASTELLO A SPRITE — IL MANIFESTO

   Dato puro, come vuole `src/giochi/CONVENZIONE.md`: non importa Vue,
   non importa il profilo. La schermata sta in `src/giochi/schermate.js`.

   ⚠ DUE CASTELLI, PER ORA. Il tower defense che si gioca oggi ha chiave
   `torri` e vive nei posti vecchi — `src/views/castello/`,
   `src/components/castello/`, `src/motore/castello/`, `src/data/castello.js`,
   `src/grafica/castello/`. Questo ha chiave `castello` ed è **lo stesso
   gioco con un'altra pelle**: il campo a celle vestito con le immagini
   generate, torri e mostri come figure (`Gioco.vue` dice cosa manca).
   Le tappe e i progressi sono quelli di `torri`: non ne ha di suoi.

   Sta dietro «i giochi in prova» finché la pelle non è finita — le
   scene che mancano, i mostri che fanno le veci di altri, le torri da
   rifare — e il giorno che lo è prende il posto di `torri`.
   ═══════════════════════════════════════════════════════════════════ */
import { RACCONTO } from '../../data/campagne-castello.js'

export const CHIAVE = 'castello'

export default {
  chiave: CHIAVE,
  nome: 'Il castello a sprite',
  icona: '🧱',
  che: 'il tower defense, disegnato con le figure',
  area: 'numeri',
  /* `strategia` come il tower defense di cui prenderà il posto: quello
     che si compra si paga in calcoli, ma la domanda che il gioco fa è
     dove metterlo */
  come: 'strategia',
  tappe: RACCONTO.length,
  tinta: '#e3ead6',
  /* per la scala di `data/giochi.js`: è il tower defense, che si paga in
     operazioni in colonna */
  grandi: true,

  /* Dietro «i giochi in prova»: si gioca, ma la pelle è a metà. */
  sperimentale: true,

  /* Non ha un avanzamento suo — le tappe sono quelle di `torri`, e
     duplicarle vorrebbe dire due libretti per la stessa campagna. La
     riga sotto il nome in home dice quello che è. */
  riassunto() { return `le ${RACCONTO.length} tappe del castello, a sprite` },
}
