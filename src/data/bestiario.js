/* ═══════════════════════════════════════════════════════════════════
   IL BESTIARIO — chi si incontra, già vestito e già fatto a modo suo

   **Il motore non sa cosa sia un orco.** Sa che esistono unità con una
   vista, un'arma e delle reazioni; che un orco assali chi vede e che
   una guardia chiami aiuto è una cosa di QUESTO mondo di gioco, e sta
   qui — nei dati, accanto ai livelli che lo abitano.

   Sta in `src/data/` e NON in `src/data/livelli/` per una ragione
   pratica che vale la pena ricordare: il banco di prova raccoglie i
   livelli da quella cartella, e un file che non è un livello ci
   finiva dentro come tale — «bestiario: non esporta niente che
   assomigli a un livello». Una cartella che si legge da sola è anche
   una cartella dove non si mette altro.

   Da cui: una campagna può avere il suo bestiario. Nella cripta gli
   orchi assalgono a vista; in una storia di contrabbandieri le guardie
   ti fermano e basta; in un livello dove il nemico è una papera, la
   papera scappa. Non è una manopola del motore: è un file di dati che
   si copia e si cambia.

   ── PERCHÉ UN DEFAULT, E PERCHÉ QUI ──
   Chi scrive un livello non può prevedere tutte le strade che prenderà
   un bambino di sei anni. Se «l'orco assale» va scritto a mano ogni
   volta, prima o poi qualcuno se lo dimentica — e quel giorno due
   bambini attraversano il carceriere ridendo, perché nessuno gli aveva
   detto di reagire. Un preset non toglie niente: è il punto di
   partenza, e chi vuole un orco che ti ignora scrive `reagisce: []`.

       const orco = chi.orco({ vista: 2, vita: 9 })     // assale di suo
       const bue  = chi.orco({ reagisce: [] })          // non gli importa

   ── E SI LEGGE NELLA SCHEDA ──
   Quello che il preset mette dentro sono ORDINI, gli stessi che il
   bambino sa leggere perché li scrive lui. La scheda che si apre col
   dito non mostra una frase inventata: mostra «attacca i nostri», e
   allora dedurre il piano nemico diventa una cosa che si fa leggendo.
   ═══════════════════════════════════════════════════════════════════ */
import { chi, reagisce } from './livelli/scrivi.js'

/* ── I NOSTRI ──
   Non hanno reazioni: le unità del giocatore fanno quello che gli hai
   detto, e nient'altro. È il patto del gioco — se si difendessero da
   sole, metà dei piani funzionerebbero per conto loro e non si
   capirebbe più quale pezzo è merito tuo. */
export const eroe = (...arg) => chi.nostro('eroe', "l'eroe",
  { corpo: 'cavaliere', emoji: '🦸', vista: 6, ...opz(arg) })

export const ladra = (...arg) => chi.nostro('ladra', 'la ladra',
  { corpo: 'ladra', emoji: '🥷', vista: 4, vita: 1, ...opz(arg) })

/* il cavaliere è dentro un'armatura: combatte e aspetta, ma non fruga
   per terra e non scassina. Serve poco come regola in più, serve molto
   come RAGIONE per coordinarsi con qualcun altro. */
export const cavaliere = (...arg) => chi.nostro('cavaliere', 'il cavaliere',
  { corpo: 'cavaliere', emoji: '🛡️', vista: 5, vita: 6,
    nonRiesce: { prendi: 'ho le mani occupate: scudo e spada' },
    ...opz(arg) })

/* ── QUELLI CONTRO ──
   L'orco assale chi vede, ed è quello che ci si aspetta da un orco. Se
   non lo facesse, gli si potrebbe camminare attraverso — ed è successo
   davvero, finché la reazione non c'era. */
export const orco = (...arg) => chi.orco(
  { vista: 3, vita: 6, reagisce: [reagisce.assale('nostri')], ...opz(arg) })

/* la guardia non è più forte di un orco: è più RUMOROSA. Quando ti
   vede chiama i suoi, e da tre stanze più in là arriva qualcuno — è
   quello che rende «uccidi il mostro» una decisione con un prezzo. */
export const guardia = (...arg) => chi.guardia(
  { vista: 4, vita: 6, grida: 'aiuto',
    reagisce: [reagisce.assale('nostri'), reagisce.chiedeAiuto('aiuto')], ...opz(arg) })

/* il carceriere non si batte: quarantaquattro punti di vita sono il
   modo di dire «questa strada è chiusa» senza vietarla. Tutto quello
   che fa sta nelle sue due reazioni — accorre, e se ti trova ti prende. */
export const carceriere = (...arg) => chi.orco('carce', 'il carceriere',
  { corpo: 'orco', vista: 2, vita: 44,
    reagisce: [reagisce.alRumore('richiamo'), reagisce.assale('nostri')], ...opz(arg) })

/* la ronda cammina e basta: quello che fa di suo è annunciare dov'è, e
   origliarla è la mossa. Non assale — se lo facesse, il livello
   diventerebbe una gara di velocità invece di un problema di ascolto. */
export const ronda = (...arg) => chi.nemico('ronda', 'la ronda',
  { corpo: 'orco', emoji: '👹', vista: 2, vita: 6,
    schiera: 'orchi', schieraNome: 'gli orchi', ...opz(arg) })

/* le opzioni sono sempre l'ultimo argomento, e sovrascrivono il preset:
   un preset che non si può smentire non è un punto di partenza, è una
   regola */
function opz (arg) { return arg.find(a => a && typeof a === 'object') || {} }

/* e i nomi, per chi vuole l'elenco: serve all'editor delle mappe, che
   deve poter offrire «metti qui un orco» senza sapere cosa sia */
export const BESTIARIO = { eroe, ladra, cavaliere, orco, guardia, carceriere, ronda }
