/* ═══════════════════════════════════════════════════════════════════
   I LIVELLI DEL GENERALE — dati puri, niente logica

   Un livello è una coreografia da far funzionare. Il giocatore firma
   gli ordini di una fazione, il livello quelli dell'altra: stesso
   linguaggio (`motore/generale.js`), autore diverso.

   ── com'è fatto un livello ────────────────────────────────────────
     id, nome, idea          come si chiama e cosa insegna
     dritta, racconto, aiuti le parole: la riga sotto la scena, il
                             cartello del 💡, e i tre suggerimenti a
                             scalare (il primo è gratis).

                             LA REGOLA È UNA SOLA: si dice soltanto
                             quello che la mappa NON mostra. Dov'è il
                             tesoro, dove sono le porte, chi sta dove
                             — quello si vede, e ridirlo a parole è
                             una pagina da saltare. Restano quattro
                             cose, e sono invisibili per davvero:
                             cosa vuol dire vincere (la `dritta`, e
                             quasi sempre basta lei), cosa CAMBIA da
                             una battaglia all'altra, chi non vede
                             cosa, e i numeri che decidono («cade al
                             primo colpo», «venti spallate»). Il
                             `racconto` sono due frasi, non un
                             paragrafo; quello che si scopre toccando
                             un personaggio è materia da aiuto, non da
                             cartello.
     griglia                 righe di caratteri: '#' muro, il resto
                             pavimento
     posti, porte, oggetti,
     segnali, nomi           le cose, ognuna col suo tipo (è il tipo che
                             decide quali verbi la accettano)
     celle: true             apre anche le CASELLE come complementi: sono
                             i punti fra cui si fa un giro di ronda, e si
                             toccano sulla mappa
     unita, fazioni          chi c'è e chi lo comanda
     complementi             QUALI cose si possono nominare: è la
                             manopola della difficoltà, perché da lì
                             discende anche quali verbi compaiono in
                             cassetta (un verbo senza complementi non si
                             offre). Toglierla vuol dire dare tutto.
     verbi                   e QUALI VERBI, quando la manopola di sopra
                             non basta: «gli orchi» servono ad `attacca`
                             e si tirano dietro `aspetta di vedere`, che
                             in quel livello non serve a niente. È una
                             manopola del livello — i verbi si
                             introducono a scaglioni — e per questo NON
                             chiede spiegazioni, mentre un divieto
                             addosso a un personaggio sì (`nonRiesce`).
     obiettivo, sconfitta    quando è vinta e quando è persa
     varianti                TRE almeno, e sono la lezione del gioco: il
                             piano si firma prima di sapere quale tocca,
                             e un piano che funziona su una mappa sola è
                             fortuna. Ognuna è una toppa sulle
                             posizioni, non un livello nuovo. Di più se
                             le varianti sono la scelta stessa (i
                             quattro ingressi del forte) — ma allora
                             `prove` dev'essere alto abbastanza da
                             giocarsele tutte.
     par, soluzioni          la promessa («si può fare con questi») e la
                             prova che la promessa è mantenuta: il test
                             GIOCA le soluzioni su tutte e tre le
                             varianti, e se una non vince il livello è
                             rotto. Il par conta anche gli ordini dentro
                             un `quando`.

   Una soluzione `fragile` è quella che il gioco vuole far CADERE: una
   fila di mete esplicite che regge in un mondo e non negli altri. Se
   vincesse sempre non dimostrerebbe niente, se non vincesse mai non
   sarebbe una tentazione.

   I PRIMI SEI SONO IL TUTORIAL — un ordine, una fila, un giro, un
   segnale, una scelta, il rumore — e vanno fatti in fila. Dopo ne
   restano due, e sono due esami: la settima mette insieme l'evento e
   la decisione su un'informazione rubata al nemico, l'ottava è la
   mappa grande, dove le mete a una a una non bastano più.

   QUI NON SI FA IL DEBUG DEL PIANO DI UN ALTRO. Per un pezzo dopo la
   settima c'erano quattro prove costruite su un errore deliberato nel
   piano avversario — l'ordine invertito, il segnale con il nome
   sbagliato, l'attesa che dipende da uno solo, i due orchi mandati
   nello stesso posto — e si vincevano leggendo il piano e trovandoci
   la falla. Sono state tolte: il linguaggio lo insegnano le sei prove
   del tutorial, e a quel punto si impara battendoci la testa, non
   correggendo lo sbaglio di qualcun altro — che è un mestiere diverso
   dallo scrivere un piano proprio.

   Restano due difetti avversari, e nessuno dei due è un bug: sono
   abitudini, cioè cose che si notano giocando invece che leggendo.
     6  la reazione prevedibile  — chi accorre lascia il posto, e ci
                                   mette un pezzo ad arrivare
     7  la parola di troppo      — la ronda annuncia quando è lontana,
                                   e un segnale non ha destinatari
   ═══════════════════════════════════════════════════════════════════ */

/* ── L'ELENCO, E PERCHÉ È SCRITTO A MANO ──
   Ogni prova sta nel suo file, in `livelli/tutorial/`, col numero
   davanti: `3-il-giro-delle-mura.js`. Prima stavano tutte qui dentro,
   ottocento righe in fila, e per trovare la terza si scorreva.

   L'elenco però resta **esplicito**, e non è pigrizia: l'ordine delle
   prove è la lezione. Un ordine, poi una sequenza, poi un giro, poi un
   segnale, poi una scelta, poi il rumore, e infine tenere insieme due
   che non si vedono — chi cambia quest'ordine sta cambiando il modo in
   cui si impara, e deve farlo scrivendolo, non rinominando un file.
   (Le storie invece si raccolgono da sole: là l'ordine lo dice il
   capitolo, qui lo dice questa lista.) */
import PRIMO from './livelli/tutorial/1-primo-ordine.js'
import CHIAVE from './livelli/tutorial/2-la-chiave-e-il-portone.js'
import RONDA from './livelli/tutorial/3-il-giro-delle-mura.js'
import ATTESA from './livelli/tutorial/4-mettetevi-daccordo.js'
import DUE_STRADE from './livelli/tutorial/5-due-strade.js'
import RICHIAMO from './livelli/tutorial/6-il-richiamo.js'
import DUE_VIE from './livelli/tutorial/7-da-una-parte-e-dallaltra.js'
/* ── L'OTTAVA STA IN CODA, MA IL SUO POSTO È IL QUINTO ──
   Il ciclo che conta viene subito dopo il giro delle mura: là il
   `ripeti` si ferma su una cosa che si vede, qui su un numero, ed è la
   stessa struttura con l'uscita cambiata. In mezzo alla fila però la
   sposterebbero anche le prove dal quarto al settimo, e quelle sono
   ancora in travaso — quindi per ora si prova in fondo, e il giorno in
   cui la si infila al quinto posto **è questa riga** che si sposta. Gli
   `id` non c'entrano e non si toccano: sono le chiavi dei progressi. */
/* IL TOTEM È FERMO IN PANCHINA. Il livello c'è ed è finito, ma il
   congegno che insegna è appena nato e va guardato giocare da vicino
   prima di metterlo davanti a un bambino. Il file resta dov'è: per
   rimetterlo in campo basta togliere i commenti a queste due righe. */
// import TOTEM from './livelli/tutorial/8-il-totem.js'

export const LIVELLI = [PRIMO, CHIAVE, RONDA, ATTESA, DUE_STRADE, RICHIAMO, DUE_VIE]

export const QUANTI = LIVELLI.length
/* ── IL TUTORIAL SONO TUTTE ──
   Non è un allenamento facoltativo: sono le cose senza le quali una
   storia non si può nemmeno leggere — un ordine, una sequenza, un
   giro, un segnale, una scelta, il rumore, e poi origliare e tenere
   insieme due che non si vedono. Stavano in fondo alla home sotto «e
   poi, quando vuoi», e il risultato era che si entrava in una storia
   senza sapere cosa fosse un ordine. Adesso vengono prima, e le
   avventure aspettano.

   E LA SOGLIA È IN FONDO, non a metà. Per un pezzo `TUTORIAL` valeva
   sei e le prove dopo erano «quelle dove le idee si mescolano»: una
   divisione che a schermo prometteva un cambio di passo che non
   c'era. Adesso la soglia coincide con l'ultima prova — cioè non c'è
   più nessun «dopo» finché le avventure restano chiuse — e resta una
   costante invece di un `QUANTI` scritto due volte, perché il giorno
   in cui le avventure si riaprono qui si torna a decidere DA DOVE si
   parte, che è una domanda diversa da QUANTE prove ci sono. */
export const TUTORIAL = QUANTI
export const livelloDi = i => LIVELLI[Math.max(0, Math.min(LIVELLI.length - 1, i))]
/* su quanti mondi si prova il piano: i primi due livelli sono un
   tutorial e ne giocano uno solo, così il primo piano che si scrive
   funziona davvero. Dal terzo in poi sono tre, e i piani rigidi
   cominciano a cadere. */
/* ── QUANTE SCENE SI GIOCANO ──
   Il livello dichiara quante ne vuole (`prove`) e quante ne ha
   (`varianti`), e si gioca la più piccola delle due. **Ma mai zero**:
   un livello senza varianti ha comunque una scena, la sua — e prima
   questo conto dava 0, quindi la partita si vinceva e il velo di fine
   non si alzava mai, perché il gioco stava ancora aspettando una scena
   che non esisteva. */
export const proveDi = liv =>
  Math.max(1, Math.min(liv.prove || 3, (liv.varianti || []).length || 1))
