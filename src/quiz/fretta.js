/* ═══════════════════════════════════════════════════════════════════
   LA RAFFICA — quando i tocchi diventano un metodo

   ── IL PATTO, IN UNA RIGA ─────────────────────────────────────────
   **Sbagliare non si paga: basta averci provato. Ma se hai tirato a
   caso, dalla penalità te ne devi liberare.**

   Tutto il resto di questo file è quella frase in numeri. Chi legge la
   domanda e sbaglia aspetta i quattro secondi che servono a leggere il
   perché, e nient'altro — non c'è nessun costo per non sapere una cosa,
   in nessun gioco. Chi risponde prima che ci fosse il tempo di leggere
   si porta dietro un'attesa che cresce, e per togliersela deve fare la
   cosa che a caso non riesce: rispondere bene quattro volte.

   `nucleo/domanda.js` sa dire se **una** risposta è arrivata prima che
   ci fosse il tempo di leggere. Qui si tiene il conto di quante ne sono
   arrivate così di seguito, e la differenza non è un dettaglio: un
   tocco affrettato capita a chiunque abbia il dito già in aria, quattro
   di fila sono un modo di giocare — si preme, si vede cosa succede, si
   ricomincia.

   ── LA SCALA, IN SECONDI DI ATTESA ────────────────────────────────
   Sono i **totali** che si vedono a schermo su una domanda dalla
   spiegazione corta, cioè col pavimento dei quattro secondi che serve
   a leggerla (`PONDERA` in `nucleo/domanda.js`):

     sbaglia e basta          4,0 s
     1ª di fretta             5,5 s
     2ª di fila               7,0 s
     3ª                       9,0 s
     4ª e da lì in poi       10,0 s

   Non è una progressione geometrica e non deve esserlo: il primo scatto
   è piccolo perché **un tocco affrettato non è una colpa**, gli ultimi
   sono grossi perché a quel punto non è più un caso. Dieci secondi sono
   il tetto: oltre, una pausa smette di sembrare una pausa e comincia a
   sembrare un gioco rotto, e un gioco rotto si posa e basta.

   Dove la spiegazione è lunga il pavimento è più alto — si legge il
   perché **e** come si fa — e la colonna qui sopra parte da più su e
   arriva prima al tetto. Il tetto è quello, ed è `TETTO` in
   `nucleo/domanda.js`: la penalità si accorcia, l'attesa per leggere
   no. È l'ordine giusto — il motivo per cui si sta fermi è che c'è da
   leggere, e la penalità è quello che si aggiunge finché ci sta.

   ── E PER USCIRNE SERVONO QUATTRO RISPOSTE GIUSTE ─────────────────
   Prima bastava una risposta letta con calma, ed era troppo poco: si
   tirava a caso per tre domande, si rallentava su una, e il conto
   ripartiva da zero — cioè la scala non arrivava mai in fondo, e
   insistere restava conveniente. Adesso la trafila si azzera solo dopo
   **quattro risposte giuste**, che sono la prova che si sta giocando
   davvero.

   Giuste, non solo lette, ed è una scelta contro-intuitiva rispetto a
   tutto il resto di questo file: il criterio della fretta si guarda
   bene dal punire chi non sa la materia, e qui invece si chiede di
   azzeccare. Il motivo è che questa non è una misura sul sapere, è
   l'uscita da una penalità: dev'essere una cosa che chi tira a caso non
   può fare **per caso**. Con quattro opzioni, quattro risposte giuste
   di seguito tirando a caso capitano una volta su duecentocinquanta.
   Una risposta sbagliata ma letta non risale la scala e non la azzera:
   lascia le cose come stanno, che è quello che merita.

   ── PERCHÉ QUI E NON DENTRO IL COMPONENTE ─────────────────────────
   `quiz/Domanda.vue` **si rimonta a ogni domanda**: un contatore dentro
   di lui nascerebbe a zero ogni volta, e la raffica non si vedrebbe
   mai. Sta in un modulo perché la sequenza è più lunga di una domanda.
   È anche l'unico modo di provarlo senza un browser
   (`test/unita/tiro-a-caso`).
   ═══════════════════════════════════════════════════════════════════ */

/* Quanto si aggiunge all'attesa, in millisecondi, alla prima · seconda ·
   terza · quarta risposta di fretta consecutiva. Dall'ultimo in poi si
   resta lì: è il tetto. */
export const SCALA = [1500, 3000, 5000, 6000]
/* quante risposte giuste servono per uscirne */
export const PER_USCIRNE = 4

let difila = 0
let giuste = 0

/* Quanto costa questa risposta, e aggiorna i due conti. Torna i
   millisecondi da aggiungere e a quante di fila siamo — che è quello
   che serve a chi lo scrive a schermo: «di nuovo» detto alla seconda
   vale più di un numero.

   `giusto` serve solo a uscirne: la penalità la decide `diFretta`. */
export function pesoDellaFretta(diFretta, giusto = false) {
  if (diFretta) {
    difila = Math.min(SCALA.length, difila + 1)
    giuste = 0
    return { attesa: SCALA[difila - 1], difila, mancano: PER_USCIRNE }
  }
  if (difila && giusto) {
    giuste++
    if (giuste >= PER_USCIRNE) { difila = 0; giuste = 0 }
  }
  return { attesa: 0, difila, mancano: difila ? PER_USCIRNE - giuste : 0 }
}

/* Per i test, e per chi cambia bambino: la raffica è di chi ha il
   telefono in mano adesso. */
export function azzeraLaFretta() { difila = 0; giuste = 0 }
export const quanteDiFila = () => difila
export const quanteNeMancano = () => (difila ? PER_USCIRNE - giuste : 0)
