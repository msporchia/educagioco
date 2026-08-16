/* ═══════════════════════════════════════════════════════════════════
   IL CASTELLO A TESSERE — IL MANIFESTO

   Dato puro, come vuole `src/giochi/CONVENZIONE.md`: non importa Vue,
   non importa il profilo. La schermata sta in `src/giochi/schermate.js`.

   ⚠ DUE CASTELLI, PER ORA. Il tower defense che si gioca oggi ha chiave
   `torri` e vive nei posti vecchi — `src/views/castello/`,
   `src/components/castello/`, `src/motore/castello/`, `src/data/castello.js`,
   `src/grafica/castello/`. Questo ha chiave `castello`, sta in
   `src/giochi/` come vuole la convenzione nuova, e per adesso è **solo
   il campo**: le stesse venti tappe, gli stessi percorsi e le stesse
   piazzole, disegnati con gli sprite di un foglio a tessere invece che
   coi poligoni. I dati non sono duplicati: li importa di là.

   Non si gioca: si guarda. Sta dietro «i giochi in prova» e ci resta
   finché non ha le figure (torri, castello, mostri) e la battaglia
   attaccata — cioè finché non è un gioco. Un gioco a metà che si può
   aprire è peggio di un gioco che non c'è.
   ═══════════════════════════════════════════════════════════════════ */
import { RACCONTO } from '../../data/campagne-castello.js'

export const CHIAVE = 'castello'

export default {
  chiave: CHIAVE,
  nome: 'Il castello a tessere',
  icona: '🧱',
  che: 'il campo del castello, disegnato a mattonelle',
  area: 'numeri',
  /* `strategia` come il tower defense di cui prenderà il posto: quello
     che si compra si paga in calcoli, ma la domanda che il gioco fa è
     dove metterlo */
  come: 'strategia',
  tappe: RACCONTO.length,
  tinta: '#e3ead6',

  /* Dietro «i giochi in prova», e non è una precauzione: qui dentro non
     c'è ancora niente da giocare. */
  sperimentale: true,

  /* Non ha un avanzamento suo — le tappe sono quelle di `torri`, e
     duplicarle vorrebbe dire due libretti per la stessa campagna. La
     riga sotto il nome in home dice quello che è. */
  riassunto() { return `${RACCONTO.length} campi da guardare` },
}
