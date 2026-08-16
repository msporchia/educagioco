/* ═══════════════════════════════════════════════════════════════════
   IL CAMPO A CELLE — le misure, e nient'altro

   Il tower defense di oggi disegna il campo coi poligoni: la strada è
   una curva, il prato è rumore, gli alberi sono tracciati
   (`grafica/terreni/`). Qui si prova l'altra strada: **degli sprite
   posati su una griglia**. Questo file è il ponte fra i due mondi, e ha
   un solo compito — dire quanto è grande una cella e quale foglio va in
   quale tappa.

   ── due misure, e tenerle separate è il punto ──
   `CELLA` è quanto vale una casella **in unità di gioco**: 36. Da lì
   escono le dodici colonne per ventidue righe, e quel numero non si
   tocca — è la griglia su cui si ricalcano i percorsi, e cambiarlo
   cambierebbe quali tessere servono.

   `TESSERA` è tutt'altra cosa: quanto è grande una casella **in pixel
   dello sprite**, e lo decide il ritaglio del foglio. Le due misure
   partono uguali (36) ma non sono la stessa cosa, e per un po' lo sono
   state per sbaglio. Il motivo era che facendo valere un'unità di gioco
   un pixel di sprite la telecamera poteva ingrandire di un numero
   intero, che è l'unica scala a cui la pixel art non si sfrangia. Poi si
   è visto che qui lo zoom intero non si può usare — il campo è più largo
   dello schermo di un telefono, quindi l'unico intero possibile è 1 e a 1
   la mappa esce fuori (vedi `scena/tela.js`) — e a quel punto quel
   legame non pagava più niente: pagava solo metà della risoluzione del
   foglio, buttata via per una regola che non era in vigore. Adesso
   `TESSERA` si può alzare cambiando un numero nel foglietto, e qui non
   cambia niente.

   420 diviso 36 non torna intero — fanno 11 celle e due terzi — e la
   griglia quindi **sborda**: dodici colonne per ventidue righe coprono
   432×792 unità, un filo più del campo. Sborda apposta, e da tutt'e due
   i lati: il pezzetto in più resta fuori da quello che si guarda, e
   l'alternativa — stringere `MONDO` a un multiplo di 36 — vorrebbe dire
   ristirare venti mappe e rifare la taratura. Il campo non si tocca: è
   la griglia che gli si adatta.

   ── le tavolozze e i fogli ──
   Una tappa nomina una tavolozza (`ambiente: 'bosco-guado'`): ce ne sono
   venti, una per tappa, e servono a far vedere il viaggio anche dove il
   terreno è lo stesso. Il foglio invece ha sette famiglie, che sono
   materiali: bosco, sabbia, neve, pietra, lava, palude, sterpaglia. Qui
   si dice quale materiale veste quale tavolozza. Due tappe di seguito
   possono cadere sullo stesso materiale — è quello che succede oggi nel
   Bosco — e per ora va bene: la differenza fra una tappa e l'altra la
   faranno i colori, che è esattamente il mestiere che facevano le
   tavolozze.
   ═══════════════════════════════════════════════════════════════════ */
import { MONDO } from '../../../data/castello.js'
import { TESSERA } from './atlante.js'

export { MONDO, TESSERA }

/* quanto vale una casella in unità di gioco: la griglia, non il disegno */
export const CELLA = 36

export const COLONNE = Math.ceil(MONDO.W / CELLA)
export const RIGHE = Math.ceil(MONDO.H / CELLA)

/* Da unità di gioco a pixel di sprite. Le postazioni, le bocche e la
   porta arrivano dal motore in unità di gioco — non sanno che esistano
   gli sprite, ed è giusto così — e chi disegna le vuole in pixel del
   foglio. Sono uguali finché `TESSERA` vale 36, e questa funzione esiste
   proprio perché il giorno che non varranno più uguali non ci sia niente
   da cercare. */
export const inSprite = q => q * (TESSERA / CELLA)

/* la cella che contiene un punto del campo, e il suo contrario */
export const cellaDi = (x, y) => [Math.floor(x / CELLA), Math.floor(y / CELLA)]
export const centroDi = (cx, cy) => ({ x: (cx + 0.5) * CELLA, y: (cy + 0.5) * CELLA })
export const dentroIlCampo = (x, y) => x >= 0 && x < COLONNE && y >= 0 && y < RIGHE

/* ── tavolozza → materiale ──
   Le famiglie che il foglio ha sono sette; l'acqua c'è come terreno
   pieno ma non ha strade, quindi non compare. Dove una campagna intera
   cadrebbe su un materiale solo si è preferito spezzarla: quindici tappe
   dello stesso grigio sono un corridoio, non un viaggio.

   ── la sabbia non c'è, e si sa perché ──
   Il foglio ha una fila di sabbia intera, e non è qui dentro. La strada
   del deserto è **sabbia sopra sabbia**: cambia il disegno del bordo e
   quasi nient'altro, e dove le altre file separano strada e fondo di
   cinquanta punti di colore, lì la distanza scende a due. Non è che
   l'attrezzo legga male: non c'è niente da leggere, e in partita quella
   strada non si vedrebbe comunque. Resta ritagliata nell'atlante perché
   il giorno che il foglio si sostituisce con uno che quella strada la
   disegna, qui cambia una riga. */
export const AMBIENTE_DI = {
  'bosco-chiaro': 'bosco',
  'bosco-guado': 'bosco',
  'bosco-radura': 'bosco',
  'bosco-fitto': 'sterpaglia',
  'bosco-notte': 'sterpaglia',

  grotta: 'pietra',
  miniera: 'pietra',
  fogne: 'palude',
  cripta: 'pietra',
  gola: 'neve',

  cortile: 'sterpaglia',
  camminamento: 'pietra',
  corridoio: 'pietra',
  trono: 'lava',
  bastione: 'neve',

  'palude-alba': 'palude',
  'palude-verde': 'palude',
  'palude-stagno': 'palude',
  'palude-marcio': 'sterpaglia',
  'palude-torce': 'palude',
}

/* Una tavolozza che non c'è si veste di bosco invece di restare senza
   niente: un materiale sbagliato si guarda, un campo vuoto no. */
export const materialeDi = tavolozza => AMBIENTE_DI[tavolozza] || 'bosco'
