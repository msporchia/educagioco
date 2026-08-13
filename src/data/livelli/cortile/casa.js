/* ═══════════════════════════════════════════════════════════════════
   LA CASA DI ROSA — il mondo del cortile, uno per tutti gli episodi

   Le prime stesure di questa campagna avevano una stanza nuova per
   capitolo, quattro celle e due ordini: il costo di capire dove sei
   era cinque volte il gioco, e lo si pagava daccapo a ogni livello.
   Qui la mappa è **una sola** e si impara una volta: dal secondo
   episodio in poi si sa già dov'è la dispensa, e tutto il tempo va nel
   piano invece che nella lettura della stanza.

       ┌── casa ───────────┐
       │ dispensa │ cucina │   la porta di casa dà sul cortile
       └──────────┬────────┘
              cortile           il pozzo, e la strada per tutto il resto
        aia ──┘        └── orto     le uova di là, la verdura di qua
              stagno            dove Bibi passa le giornate

   ── I DUE IMBOCCHI ──
   L'aia e l'orto sono due stanze sotto il cortile, e per un pezzo sono
   state **murate su tutti e quattro i lati**: il disegno qui sopra le
   attaccava al cortile, la mappa no. Non se n'era accorto nessuno
   perché il guasto non si vede leggendo — si vede solo giocando, e
   infatti l'ha trovato il banco, che a «La colazione» rispondeva
   «Rosa è piantato su: non riesco ad arrivare a le uova, la strada è
   chiusa». Adesso ognuna ha il suo imbocco sulla riga di mezzo, ed è
   una casella sola per parte: si passa di lì, e da nessun'altra
   parte.

   ── COSA C'È, E PERCHÉ ──
   · il **tavolo** in cucina è dove finisce la roba: è un `posto`, e un
     posto adesso ha una faccia (`elementi/posto.js`), quindi si
     riconosce senza leggere niente;
   · la **porta di casa** si apre e si chiude a mano, e serve a tenere
     fuori il cane: è l'unico vincolo del mondo che chiede di
     ricordarsi una cosa **dopo** averla fatta, ed è quello che
     trasforma una fila di commissioni in un piano;
   · **Bombo** non morde. Aspetta, e se trova la porta aperta entra e
     si porta via quello che c'è sul tavolo: è una regola del mondo,
     non un nemico da combattere;
   · **Bibi** insegue il pane e basta — il suo piano è una riga sola e
     si legge toccandola.

   Le fabbriche stanno qui perché un episodio non deve ridisegnare il
   mondo: importa quello che gli serve e ci scrive dentro la sua
   storia. Un episodio nuovo è un file, non una mappa.
   ═══════════════════════════════════════════════════════════════════ */
import { campo, cose, chi, fai, se, quando, reagisce, dove } from '../scrivi.js'

/* ── QUESTO FILE NON È UNO SCENARIO, ED È LUI A DIRLO ──
   Il banco raccoglie i livelli dalla cartella e prova tutto quello che
   trova: senza questa riga bocciava la casa di Rosa con «non esporta
   niente che assomigli a un livello», che è un guasto che non è un
   guasto. Lo dichiara il file, non un elenco di nomi tenuto altrove. */
export const mondo = true

/* ═══════════ chi ci abita ═══════════ */
export const rosa = () => chi.nostro('rosa', 'Rosa',
  { corpo: 'principessa', emoji: '👧', vista: 6, vita: 6 })

/* Bibi non si comanda: ha una riga sua, e quella riga è tutta la
   campagna — «vai al pane», rifatto per sempre. Da lì escono tre
   comportamenti che sembrano tre caratteri: ti segue se il pane ce
   l'hai tu, ci va se lo posi, resta ferma se non lo vede. */
export const bibi = (fa = []) => chi.terzo('bibi', 'Bibi',
  { corpo: 'papera', emoji: '🦆', schiera: 'corte', schieraNome: 'la corte',
    vista: 3, vita: 4, fa })

/* Bombo abbaia e non morde. Quello che fa di suo sta nella scheda, e
   si legge come un piano perché è un piano. */
export const bombo = (fa = []) => chi.terzo('bombo', 'Bombo',
  { corpo: 'lupo', emoji: '🐕', schiera: 'vicini', schieraNome: 'i vicini',
    vista: 5, vita: 8, fa })

/* ═══════════ le cose ═══════════ */
export const pane = () => cose.pane()
export const uova = () => cose.oggetto('uova', 'le uova', { pittore: 'sacco', em: '🥚' })
export const farina = () => cose.oggetto('farina', 'la farina', { pittore: 'botte', em: '🌾' })
export const verdura = () => cose.oggetto('verdura', 'la verdura', { pittore: 'fungo', em: '🥕' })
export const secchio = () => cose.oggetto('secchio', "il secchio d'acqua",
  { pittore: 'secchio', em: '🪣' })
export const chiaveDispensa = () => cose.chiave('chiaveDispensa', 'la chiave della dispensa')

/* ═══════════ i posti, e ognuno si vede ═══════════ */
export const tavolo = () => cose.posto('tavolo', 'il tavolo', { pittore: 'cassa', em: '🍽️' })
export const pozzo = () => cose.posto('pozzo', 'il pozzo', { pittore: 'pozzo', em: '⛲' })
export const nido = () => cose.posto('nido', 'il nido', { pittore: 'cespuglio', em: '🪹' })
export const filare = () => cose.posto('filare', "il filare dell'orto",
  { pittore: 'albero', em: '🌱' })
export const riva = () => cose.posto('riva', 'la riva dello stagno',
  { pittore: 'acqua', em: '💧' })

/* la porta di casa: si apre e si chiude, nessuna chiave */
export const portaCasa = () => cose.porta('portaCasa', 'la porta di casa', { stile: 'legno' })
/* la dispensa invece è chiusa a chiave, e la chiave sta appesa in cucina */
export const portaDispensa = () => cose.porta('portaDispensa', 'la porta della dispensa',
  { stile: 'legno', chiave: 'chiaveDispensa' })

/* ═══════════ la mappa ═══════════
   Venti celle per dodici: su un telefono si scorre, e va bene — non è
   una stanza da tenere tutta sotto gli occhi come il forte a due
   aperture, è un posto in cui si va e si torna.

   I token fissi sono quelli del MONDO (le stanze, i posti, le porte);
   quelli delle COSE li mette l'episodio, perché è la sua storia a dire
   cosa serve stavolta. */
export const MAPPA = [
  '##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##',
  '##|FA|..|..|..|##|..|..|CH|..|..|##|##|##|##|##|##|##|##|##',
  '##|..|..|..|..|pd|..|..|..|TV|..|##|##|##|##|##|##|##|##|##',
  '##|..|..|..|..|##|..|RS|..|..|..|##|##|##|##|##|##|##|##|##',
  '##|##|##|##|##|##|##|pc|##|##|##|##|##|##|##|##|##|##|##|##',
  '##|..|..|..|..|..|..|..|..|..|..|..|..|..|..|..|..|..|..|##',
  '##|..|..|..|..|..|..|SE|PZ|..|..|..|..|..|..|..|BM|..|..|##',
  '##|..|..|..|..|..|..|..|..|..|..|..|..|..|..|..|..|..|..|##',
  '##|##|##|..|##|..|..|..|..|..|..|..|..|..|##|..|##|##|##|##',
  '##|UO|ND|..|##|..|..|..|..|..|..|..|..|..|##|..|VE|FL|..|##',
  '##|..|..|..|##|..|..|..|RV|BI|..|..|..|..|##|..|..|..|..|##',
  '##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##|##',
]

export { campo, cose, chi, fai, se, quando, reagisce, dove }
