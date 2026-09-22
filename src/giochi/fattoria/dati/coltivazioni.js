/* ═══════════════════════════════════════════════════════════════════
   QUELLO CHE SI COLTIVA, E COSA CI SI FA

   Dato puro: nessuna funzione che gioca, nessun `import` di motore o di
   Vue. Le regole stanno in `motore/fattoria.js`, il disegno in `scena/`.

   ── IL FRENO È IL TEMPO, NON IL PREZZO ────────────────────────────
   La fattoria è **l'unico money pit**: le monete si guadagnano facendo
   esercizi negli altri giochi e qui si bruciano. Una catena di
   produzione è la cosa che più rischia di ribaltarlo, quindi due regole
   che non si toccano.

   La prima: **niente si vende**. Grano, mais, mangime sono valuta
   interna e non tornano monete, mai. Il verso è sempre monete → cose. È
   lo stesso motivo per cui sgomberare il bosco costa e non rende
   (`motore/fattoria.js`): una seconda fonte di monete che non passa da
   nessun esercizio farebbe smettere di fare esercizi.

   La seconda: **coltivare costa meno che comprare, ma costa tempo
   vero**. Il mangime prodotto viene sui 3 contro i 5 del cibo comprato,
   e il pastone sui 7 contro 14 — cioè si risparmia circa la metà, non
   l'80%. Il resto del freno lo mette l'orologio: quindici minuti veri
   per un giro di grano, e la capacità installata (quanti campi hai) è
   il tetto di quanto puoi produrre in una sera. Chi vuole dar da
   mangiare *adesso* compra, come ha sempre fatto. Chi ha aspettato
   risparmia. Ed è per questo che il money pit regge: l'attrezzatura —
   il campo, il mulino, i silos — si paga **prima**, in monete grosse, e
   si ripaga in decine di raccolti.

   ── NIENTE MARCISCE. MAI. ─────────────────────────────────────────
   Un campo maturo resta maturo per sempre: se il gioco sta chiuso una
   settimana, al ritorno il grano è lì. È la stessa decisione del fondo
   0,15 di `bisogni.js` — la bestia ha fame ma non muore — applicata al
   raccolto, e per lo stesso motivo: questo posto è il premio per gli
   esercizi fatti altrove, non un altro compito. Un campo che si perde
   se non apri l'app trasforma il premio in un dovere, e il dovere si
   smette. Tutto è **in pausa**, niente è in scadenza.

   Da qui viene anche la regola sulle monete: raccogliere costa, ma chi
   è a zero monete **non perde il raccolto** — il campo resta pronto e
   aspetta il primo esercizio fatto. Vedi `raccogli()` nel motore.

   ── GLI STADI SONO NOMI DI TESSERE ────────────────────────────────
   Ogni coltura dichiara come si vede mano a mano che cresce: una
   tessera per stadio. Erano **ripieghi** — un germoglio generico, un
   mucchio di fieno — in attesa del foglio dei campi a stadi; il foglio
   è arrivato (`sorgenti/fattoria/generati/campi.png`) ed è cambiata questa tabella e
   nient'altro, come c'era scritto. La scena disegna il nome che le
   arriva e non sa cosa sia il grano.

   Sette stati per una coltura sono tanti **apposta** — il tempo di
   crescita è vero, e in dieci minuti deve succedere qualcosa a ogni
   occhiata, se no il campo sembra fermo e non ci si torna più. Il primo
   è già visibile (vedi `CRESCE`): un campo appena seminato deve dire di
   essere stato seminato.

   ── E NON SI RIPETONO PIÙ SU OGNI CELLA ───────────────────────────
   *Ribalta la scelta di prima.* Uno stadio si ripeteva su ogni cella del
   piede finché era una tesserina da 16 px: quattro germogli su un campo
   2×2 erano un campo che cresce, uno solo in mezzo era un ciuffo d'erba.
   Adesso uno stadio **è il campo intero**, aiuola compresa, disegnato
   una volta sola sul piede 2×2 — e le piante alte sbordano in su, che è
   il motivo per cui un campo di mais maturo si vede da lontano.
   ═══════════════════════════════════════════════════════════════════ */

/* L'unico import, e va in una direzione sola: dato che guarda dato.
   Serve al controllo in fondo — uno stadio che l'atlante non ha è un
   campo che cresce senza vedersi crescere, e non lo dice nessuno. */
import { PEZZI } from './atlante.js'

/* Un minuto in millisecondi, scritto una volta: i tempi qui sotto sono
   in minuti veri, che è l'unità in cui si ragiona tarandoli. */
export const MINUTO = 60000

/* ── quello che finisce in granaio ────────────────────────────────
   `nome` ed `emoji` sono per chi guarda; `cibo` (facoltativo) dice che
   quella roba, oltre a stare in granaio, si può mettere nella ciotola —
   il legame vero sta in `bisogni.js`, che la pesca da qui.

   `silo` dice **in quale dei due** va a finire, e non è un dettaglio.

   *Ribalta la scelta di prima.* Il criterio era **da dove viene la
   roba**: dalla terra nel silo del raccolto — compreso quello che il
   mulino ne ricava — e dalle bestie nel silo della stalla. È un fatto
   vero, ed è completamente invisibile a chi gioca: nessun bambino sa
   che il mangime «viene dalla terra», lo sa che si dà alle galline.

   Adesso il criterio è quello che si vede: **il rosso è dei campi, il
   bianco è degli animali** — quello che mangiano e quello che danno.
   Cinque merci di qua, nove di là.

   E non è solo ordine. Il mulino prende 3 🌾 dal silo del raccolto e ci
   mette 2 🥣 **nell'altro**: macinare libera tre posti invece di uno,
   cioè diventa il modo di svuotare il silo che si tappa. Prima il
   prodotto rientrava dov'era il grano e la valvola non esisteva: chi
   riempiva il raccolto di mais restava fermo, perché l'unica uscita
   restituiva quasi tutto lo spazio che aveva preso.

   ── `pezzo` — LA FACCIA DI UNA MERCE ──────────────────────────────
   Un'emoji la disegna il telefono, quindi in mezzo a uno schermo
   dipinto a mano ha lo stile di Apple: è la stessa ragione per cui i
   mostri del dungeon hanno smesso di essere emoji. Qui ogni roba del
   granaio ha il suo **pezzo dell'atlante**, e l'emoji resta scritta
   accanto come ripiego — la usa `viste/Merce.vue` quando un disegno
   non c'è (oggi non capita mai) e la usano le frasi, dove un canvas in
   mezzo alle parole starebbe storto.

   Non è decorazione: la stessa faccia si vede in quattro posti che
   devono dire la stessa cosa — nel fumetto sopra un recinto che ha
   fame, sullo scaffale del silo, sui tasti delle ricette, sulla scheda
   di un campo — e un'emoji piccola dentro un fumetto piccolo era
   proprio il difetto da cui è nato tutto questo: due bestie che
   vogliono la stessa cosa la mostravano con due disegni diversi, e
   nessuno dei due si leggeva.

   Nove delle quattordici facce erano **già nell'atlante e non le
   nominava nessuno** (le casse del raccolto, la balla, la bottiglia
   del latte). Le altre sei sono un foglio a parte, generato apposta:
   `sorgenti/fattoria/generati/merci.jpg`, sei oggetti su fondo
   magenta — e il magenta è la ragione per cui si scontornano da soli. */
export const PRODOTTI = {
  /* dai campi — il silo del raccolto */
  grano:   { nome: 'Grano',   emoji: '🌾', silo: 'terra', pezzo: 'raccolto_grano' },
  mais:    { nome: 'Mais',    emoji: '🌽', silo: 'terra', pezzo: 'raccolto_mais' },
  carote:  { nome: 'Carote',  emoji: '🥕', silo: 'terra', pezzo: 'raccolto_carote' },
  zucche:  { nome: 'Zucche',  emoji: '🎃', silo: 'terra', pezzo: 'raccolto_zucche' },
  fieno:   { nome: 'Fieno',   emoji: '🌿', silo: 'terra', pezzo: 'raccolto_erba' },
  /* ── L'ORTO, CIOÈ LA SECONDA METÀ DEI CAMPI ──────────────────────
     Otto colture che arrivano dal livello 22 in poi, e non sono «altre
     cinque uguali»: le prime cinque sono **cereali e foraggio** (roba
     che si dà tale e quale alle bestie), queste sono **un orto** — e
     un orto si mangia a coppie, perché in una pentola non ci va mai
     una cosa sola. È per questo che le ricette dell'orto prendono due
     colture invece di una (vedi `RICETTE`): è la stessa lezione di
     «ogni coltura ha la bocca che la mangia», detta un gradino più su. */
  patate:     { nome: 'Patate',     emoji: '🥔', silo: 'terra', pezzo: 'raccolto_patate' },
  cavolfiori: { nome: 'Cavolfiori', emoji: '🥦', silo: 'terra', pezzo: 'raccolto_cavolfiori' },
  pomodori:   { nome: 'Pomodori',   emoji: '🍅', silo: 'terra', pezzo: 'raccolto_pomodori' },
  melanzane:  { nome: 'Melanzane',  emoji: '🍆', silo: 'terra', pezzo: 'raccolto_melanzane' },
  peperoni:   { nome: 'Peperoni',   emoji: '🫑', silo: 'terra', pezzo: 'raccolto_peperoni' },
  cipolle:    { nome: 'Cipolle',    emoji: '🧅', silo: 'terra', pezzo: 'raccolto_cipolle' },
  aglio:      { nome: 'Aglio',      emoji: '🧄', silo: 'terra', pezzo: 'raccolto_aglio' },
  fragole:    { nome: 'Fragole',    emoji: '🍓', silo: 'terra', pezzo: 'raccolto_fragole' },
  /* La lavanda è l'unica coltura che non finisce in nessuna bocca: va
     in tintoria, e da lì esce il colore. Sta nel silo del raccolto
     perché esce da un campo — il criterio è quello, non cosa se ne fa.
     Il vaso di lavanda del giardino le fa da faccia finché il foglio
     dei campi non porta la cassetta coi mazzi legati. */
  lavanda:    { nome: 'Lavanda',    emoji: '💐', silo: 'terra', pezzo: 'vaso_lavanda',
                aspetta: 'raccolto_lavanda' },
  /* il mangime delle bestie del cortile: esce dal fienile e non si
     mangia in casa — è la riga di mezzo della catena */
  becchime: { nome: 'Becchime', emoji: '🌰', silo: 'stalla', pezzo: 'merce_becchime' },
  foraggio: { nome: 'Foraggio', emoji: '🥬', silo: 'stalla', pezzo: 'balla_fieno_tonda' },
  zuppa:    { nome: 'Zuppa',    emoji: '🥘', silo: 'stalla', pezzo: 'merce_zuppa' },
  /* e i tre che escono dall'orto, uno per bocca nuova. Hanno una
     faccia che c'era già nell'atlante e che non nominava nessuno — la
     cassetta piena, la cesta di verdure, il cesto di fiori — che è la
     prima cosa da guardare prima di far disegnare qualcosa di nuovo. */
  beverone: { nome: 'Beverone', emoji: '🪣', silo: 'stalla', pezzo: 'cassetta_raccolto' },
  pastura:  { nome: 'Pastura',  emoji: '🍃', silo: 'stalla', pezzo: 'cesta_verdure' },
  fiori:    { nome: 'Fiori',    emoji: '🌼', silo: 'stalla', pezzo: 'cesto_fiori_misti0' },
  /* quello che mangiano il cane e il gatto di casa: esce dal mulino */
  mangime: { nome: 'Mangime', emoji: '🥣', silo: 'stalla', pezzo: 'merce_mangime' },
  /* Il calderone e non la ciotola rosa dei gatti: in una fila di nove
     scomparti di legno e iuta quella era l'unica cosa fucsia, e si
     leggeva come un errore. Un pastone sta in una pentola. */
  pastone: { nome: 'Pastone', emoji: '🍲', silo: 'stalla', pezzo: 'calderone0' },
  /* la merenda di casa: esce dal mulino come il mangime e il pastone,
     ed è l'unica pappa che non nasce da un cereale — fragole e miele. */
  merenda: { nome: 'Merenda', emoji: '🥧', silo: 'stalla', pezzo: 'cesta_picnic' },
  /* e quello che danno */
  uova:    { nome: 'Uova',    emoji: '🥚', silo: 'stalla', pezzo: 'merce_uova' },
  latte:   { nome: 'Latte',   emoji: '🥛', silo: 'stalla', pezzo: 'latte' },
  tartufi: { nome: 'Tartufi', emoji: '🍄', silo: 'stalla', pezzo: 'merce_tartufi' },
  lana:    { nome: 'Lana',    emoji: '🧶', silo: 'stalla', pezzo: 'merce_lana' },
  miele:   { nome: 'Miele',   emoji: '🍯', silo: 'stalla', pezzo: 'marmellata1' },
  /* **Il concime è un prodotto come gli altri**, e non una battuta: gli
     asini sono le uniche bestie del cortile che non danno da mangiare a
     nessuno, e quello che rendono torna alla terra — il prato fiorito
     su cui poi vanno le api (vedi la ricetta «Prato fiorito»). È il
     solo anello della fattoria che si chiude su se stesso. */
  concime: { nome: 'Concime', emoji: '💩', silo: 'stalla', pezzo: 'sacco' },

  /* ── LA DISPENSA: QUELLO CHE ESCE DALLE BOTTEGHE ──────────────────
     Il rosso è dei campi, il bianco è degli animali, e niente di
     questo esce da un campo o da una bestia: la stoffa la fa il
     telaio, il pane il panificio. Quindi **un terzo magazzino**, la
     dispensa (`silo: 'bottega'`), che tiene quello che esce dalle
     botteghe. Le merci di ieri non si spostano di silo: un prodotto
     che cambia famiglia si troverebbe a capienza zero in un
     salvataggio dove la famiglia nuova non è costruita.

     ── `aspetta` — LA FACCIA CHE NON C'È ANCORA ────────────────────
     Prima si decide l'albero, poi si generano gli sprite: l'inverso di
     com'era andata finora (`docs/fattoria-albero.md`). Una merce nuova
     nasce quindi **prima del suo disegno**, con l'emoji come ripiego
     dichiarato — che è esattamente il caso per cui `Merce.vue` tiene il
     ripiego — e scrive in `aspetta` il nome del pezzo che il foglio le
     porterà. Non è `pezzo`: un `pezzo` che l'atlante non ha è muto
     (`drawImage` non disegna e non lancia), ed è un guasto. Il giorno
     che il foglio arriva, `aspetta` diventa `pezzo` e il controllo in
     fondo lo pretende: un pezzo atteso che l'atlante ha già è una
     riga da aggiornare. Chi ha un disegno vicino lo usa intanto
     (`pezzo: 'pane'` per il pane) e dichiara lo stesso cosa aspetta. */
  stoffa: { nome: 'Stoffa', emoji: '🧵', silo: 'bottega', aspetta: 'merce_stoffa' },
  farina: { nome: 'Farina', emoji: '🌾', silo: 'bottega', aspetta: 'merce_farina' },
  /* Il pane ha un disegno nell'atlante già oggi — le due pagnotte del
     foglio dell'arredo — e lo usa intanto. */
  pane:   { nome: 'Pane',   emoji: '🍞', silo: 'bottega', pezzo: 'pane', aspetta: 'merce_pane' },
  /* Il maglione è la fine della catena del filo: lo vuole la sarta al
     mercato (`dati/mercato.js`). Era anche un addobbo sulla schiena
     pagato col granaio, ed è stato sospeso con gli altri della schiena
     — un'emoji di maglione non sta su una bestia (`dati/addobbi.js`). */
  maglione: { nome: 'Maglione', emoji: '🧥', silo: 'bottega', aspetta: 'merce_maglione' },
  /* ── IL CASEIFICIO: IL LATTE CHE DIVENTA DUE COSE ────────────────
     Il latte aveva un'uscita sola — la ciotola — ed era l'unico
     prodotto di recinto che non portava da nessuna parte. Qui si
     sdoppia: il burro è **un ingrediente** (entra nella torta, nella
     crostata e nel sapone) e il formaggio è **una pappa** e un
     ingrediente insieme (la polenta). */
  burro:     { nome: 'Burro',     emoji: '🧈', silo: 'bottega', aspetta: 'merce_burro' },
  formaggio: { nome: 'Formaggio', emoji: '🧀', silo: 'bottega', aspetta: 'merce_formaggio' },
  /* La torta ha già una faccia nell'atlante — quella dell'arredo — e
     la usa intanto, come il pane. */
  torta:     { nome: 'Torta',     emoji: '🎂', silo: 'bottega', pezzo: 'torta0', aspetta: 'merce_torta' },
  /* ── LA TINTORIA ─────────────────────────────────────────────────
     La lavanda sta **nel silo del raccolto** perché esce da un campo
     (il rosso è dei campi, e `unita/coltivazioni` lo pretende); tutto
     quello che la tintoria ne ricava esce da una bottega e va in
     dispensa. Il maglione alla lavanda è una **merce**, non un
     addobbo: la tintoria prende un maglione e ne rende un altro, e chi
     lo vuole è la sarta al banco. */
  tintura:   { nome: 'Tintura',   emoji: '🫙', silo: 'bottega', aspetta: 'merce_tintura' },
  maglione_lavanda: { nome: 'Maglione alla lavanda', emoji: '💜', silo: 'bottega',
                      aspetta: 'merce_maglione_lavanda' },
  sapone:    { nome: 'Sapone',    emoji: '🧼', silo: 'bottega', aspetta: 'merce_sapone' },

  /* ── LA CUCINA: DOVE LE COLTURE SI INCONTRANO ────────────────────
     Quattro merci che nascono **da colture diverse messe insieme**, e
     il perché sta in fondo al file, alla sezione delle confluenze: una
     coltura con una bocca sola è una coltura che si semina una volta e
     poi non più. La salsa e il minestrone tengono insieme l'orto, la
     conserva i tre ortaggi tardivi, la polenta lega il mais al
     caseificio.

     Il minestrone è **l'unica pappa delle quattro**: le altre tre
     costano più di quanto una ciotola possa valere (la polenta 🪙15),
     e il loro sbocco è il banco del mercato. */
  minestrone: { nome: 'Minestrone', emoji: '🍜', silo: 'bottega', aspetta: 'merce_minestrone' },
  /* Il vasetto rosso dell'arredo fa da salsa finché il foglio non
     porta il suo — è lo stesso ripiego che il miele usa da sempre. */
  salsa:     { nome: 'Salsa',     emoji: '🥫', silo: 'bottega', pezzo: 'marmellata0',
               aspetta: 'merce_salsa' },
  conserva:  { nome: 'Conserva d\'orto', emoji: '🥗', silo: 'bottega',
               aspetta: 'merce_conserva' },
  polenta:   { nome: 'Polenta',   emoji: '🍛', silo: 'bottega', aspetta: 'merce_polenta' },
  /* La crostatina dell'arredo e il sacco di iuta: due facce che
     l'atlante ha già e che non nominava nessuno. */
  crostata:  { nome: 'Crostata',  emoji: '🍰', silo: 'bottega', pezzo: 'crostatina',
               aspetta: 'merce_crostata' },
  sacchetto: { nome: 'Sacchetto profumato', emoji: '👝', silo: 'bottega',
               pezzo: 'sacco_iuta', aspetta: 'merce_sacchetto' },
}

/* I sette stati di una coltura, scritti una volta: sono i sette
   riquadri del foglio, in fila. Si scrive qui e non riga per riga perché
   il foglio è fatto così per tutte e cinque, e ricopiare sette nomi
   cinque volte è il modo di sbagliarne uno e accorgersene fra un mese.

   **Il primo stato non è più `null`.** Lo era — «appena seminato non si
   vede niente, la terra mossa è già il disegno del campo» — ed era il
   difetto che si vedeva a occhio: per il primo settimo della crescita un
   campo seminato era *identico* a un campo vuoto, quindi non si capiva
   se seminare avesse funzionato. Adesso il primo riquadro sono **i semi
   per terra**, e compaiono nell'istante in cui si semina.

   Quello che resta a raccontare il campo vuoto è il pezzo del catalogo
   (`campo_vuoto`): terra nuda, non lavorata, presa da un'altra riga del
   foglio apposta. Da lì a un'aiuola col bordo e i semi la differenza si
   vede da lontano — è il campo che è stato arato. */
const CRESCE = coltura => Array.from({ length: 7 }, (_, i) => `campo_${coltura}${i}`)

/* ── le colture ───────────────────────────────────────────────────
   `semina` e `raccolta` sono monete, `minuti` è tempo vero, `resa` è
   quanti prodotti escono da un campo. Il rapporto fra le tre cose è
   tutta l'economia: vedi `unita/coltivazioni`, che rifiuta una coltura
   che costa più del cibo che sostituisce. */
/* `liv` è il livello della fattoria a cui la coltura si sblocca
   (`dati/livelli.js`), e **ognuna arriva con la bocca che la mangia**:

     grano       1   e al 3 c'è il mulino che ne fa mangime
     carote      5   insieme alla conigliera, che mangia solo quelle
     mais       10   per il pastone, quando il mulino gira da un pezzo
     erba       12   insieme all'ovile: prima il fieno, poi le pecore
     patate     22   col beverone e lo stagno delle anatre
     cavolfiori 22   nello stesso beverone: una coppia, una bocca
     zucche     26   insieme al porcile, l'unico che le vuole
     pomodori   29   la zuppa d'orto, più svelta di quella di zucca
     melanzane  33   con la pastura e il recinto delle capre
     peperoni   33   nella stessa pastura
     cipolle    38   lasciate fiorire: il fiorume delle api
     aglio      38   nello stesso fiorume
     fragole    44   col miele fanno la merenda, al mulino

   Il primo campo ha **una scelta sola**, e non è una limitazione: a
   quattro anni cinque bottoni sono un elenco da leggere, uno è una cosa
   da fare. Una coltura che arriva prima di quello che la consuma
   sarebbe roba che riempie il silo senza servire a niente — che è il
   modo di far sembrare rotto un gioco che funziona.

   ── E TREDICI NON SONO CINQUE ─────────────────────────────────────
   Le prime cinque arrivano entro il livello 26, cioè nella prima metà
   del gioco; le altre otto stanno tutte oltre, ed è deliberato. Fra il
   porcile (26) e la fine del catalogo (64) non arrivava **più niente
   che lavorasse**: trentotto livelli di sole decorazioni, cioè la
   parte del gioco in cui chi ha imparato la catena non ha più niente
   da imparare. L'orto è quel pezzo lì. */
export const COLTURE = [
  /* L'erba medica è la più veloce, e non è cibo per nessuno: serve al
     fienile, che è il modo di dire «prima il fieno, poi gli animali»
     senza scriverlo da nessuna parte. */
  {
    id: 'erba', liv: 12, nome: 'Erba medica', emoji: '🌿',
    semina: 0, raccolta: 1, minuti: 4, resa: 1, da: 'fieno',
    stadi: CRESCE('erba'),
  },
  {
    id: 'grano', liv: 1, nome: 'Grano', emoji: '🌾',
    semina: 0, raccolta: 1, minuti: 5, resa: 1, da: 'grano',
    stadi: CRESCE('grano'),
  },
  {
    id: 'carote', liv: 5, nome: 'Carote', emoji: '🥕',
    semina: 0, raccolta: 1, minuti: 6, resa: 1, da: 'carote',
    stadi: CRESCE('carote'),
  },
  {
    id: 'mais', liv: 10, nome: 'Mais', emoji: '🌽',
    semina: 0, raccolta: 2, minuti: 8, resa: 1, da: 'mais',
    stadi: CRESCE('mais'),
  },
  /* La più lenta e la più cara, e l'unica che i maiali cercano: è la
     coltura che si semina quando si ha già tutto il resto. */
  {
    id: 'zucche', liv: 26, nome: 'Zucche', emoji: '🎃',
    semina: 0, raccolta: 2, minuti: 10, resa: 1, da: 'zucche',
    stadi: CRESCE('zucche'),
  },

  /* ── L'ORTO ──────────────────────────────────────────────────────
     Otto colture nella seconda metà del gioco. I tempi stanno nella
     stessa forchetta delle prime cinque (4–12 minuti): quello che le
     distingue non è la lentezza, è **con cosa vanno in coppia**.

     Il prezzo di raccolta resta 1 o 2 monete — un gesto è un gesto
     (`CALIBRAZIONE.md`) — e quello che costa davvero è avere due campi
     liberi nello stesso momento invece di uno. */
  {
    id: 'patate', liv: 22, nome: 'Patate', emoji: '🥔',
    semina: 0, raccolta: 1, minuti: 7, resa: 1, da: 'patate',
    stadi: CRESCE('patate'),
  },
  {
    id: 'cavolfiori', liv: 22, nome: 'Cavolfiori', emoji: '🥦',
    semina: 0, raccolta: 1, minuti: 9, resa: 1, da: 'cavolfiori',
    stadi: CRESCE('cavolfiori'),
  },
  /* Costano 2 come le zucche, ed è il numero che tiene in piedi il
     tartufo: la zuppa d'orto è la seconda strada per la zuppa dei
     maiali, e se i pomodori costassero 1 il tartufo verrebbe a metà
     prezzo del cibo che sostituisce (`unita/coltivazioni`). */
  {
    id: 'pomodori', liv: 29, nome: 'Pomodori', emoji: '🍅',
    semina: 0, raccolta: 2, minuti: 8, resa: 1, da: 'pomodori',
    stadi: CRESCE('pomodori'),
  },
  {
    id: 'melanzane', liv: 33, nome: 'Melanzane', emoji: '🍆',
    semina: 0, raccolta: 2, minuti: 9, resa: 1, da: 'melanzane',
    stadi: CRESCE('melanzane'),
  },
  {
    id: 'peperoni', liv: 33, nome: 'Peperoni', emoji: '🫑',
    semina: 0, raccolta: 1, minuti: 7, resa: 1, da: 'peperoni',
    stadi: CRESCE('peperoni'),
  },
  {
    id: 'cipolle', liv: 38, nome: 'Cipolle', emoji: '🧅',
    semina: 0, raccolta: 1, minuti: 6, resa: 1, da: 'cipolle',
    stadi: CRESCE('cipolle'),
  },
  /* La più lenta di tutte, e non per bilanciamento: l'aglio ci mette
     davvero mesi, ed è la coltura su cui si aspetta. */
  {
    id: 'aglio', liv: 38, nome: 'Aglio', emoji: '🧄',
    semina: 0, raccolta: 1, minuti: 12, resa: 1, da: 'aglio',
    stadi: CRESCE('aglio'),
  },
  {
    id: 'fragole', liv: 44, nome: 'Fragole', emoji: '🍓',
    semina: 0, raccolta: 1, minuti: 11, resa: 1, da: 'fragole',
    stadi: CRESCE('fragole'),
  },

  /* ── LA LAVANDA, E IL PRIMO CAMPO CHE CRESCE COL DISEGNO DI UN
       ALTRO ─────────────────────────────────────────────────────────
     Arriva al 52 **con la tintoria**, che è la bocca che la mangia:
     l'unica coltura della fattoria che non finisce in una ciotola né
     in una mangiatoia.

     Gli stadi sono quelli delle melanzane, ed è un ripiego dichiarato:
     il foglio `campi_3.png` non c'è ancora, e un campo che cresce
     senza vedersi crescere sembra rotto — meglio un cespuglio viola
     che assomiglia, dicendo qui quale sarà il suo. `aspetta` è il
     **prefisso** dei sette riquadri (`campo_lavanda0..6`) e
     `guastiDelleColture` diventa rosso il giorno che il primo c'è. */
  {
    id: 'lavanda', liv: 52, nome: 'Lavanda', emoji: '💐',
    semina: 0, raccolta: 1, minuti: 9, resa: 1, da: 'lavanda',
    stadi: CRESCE('melanzane'), aspetta: 'campo_lavanda',
  },
]

export const PER_COLTURA = Object.fromEntries(COLTURE.map(c => [c.id, c]))

/* ── le ricette: dove la roba diventa un'altra roba ───────────────
   Una ricetta sta in una **macchina** (`dove`, un id di catalogo): senza
   quell'oggetto in mappa non si può fare, ed è lì il money pit vero —
   il mulino costa più di trenta pappe comprate, e si ripaga solo a chi
   coltiva per giorni.

   ── `liv`: QUANDO UNA RICETTA COMPARE ─────────────────────────────
   Il ripiego è il livello della sua macchina, ed è giusto per sei
   ricette su sette. Il pastone no, e il perché è il difetto che questo
   campo esiste per riparare: il mulino arriva al livello 3, il mais al
   10. Per sette livelli — 🪙2000 di esercizi, cinque ore e mezza — il
   mulino mostrava «Pastone: 4 🌽» a chi il mais non poteva nemmeno
   seminarlo. Un tasto spento per cinque ore non è un obiettivo, è una
   cosa rotta: chi lo preme non ottiene niente e nessuno gli dice che
   deve aspettare metà del gioco.

   Adesso una ricetta può dire **quando compare**, e la regola che la
   tiene onesta la controlla `guastiDelleColture` in fondo: nessuna
   ricetta può arrivare prima di quello che le serve. Effetto
   collaterale voluto: il mulino appena comprato ha **una ricetta
   sola**, che è la stessa scelta del primo campo con una coltura sola —
   a quattro anni un bottone è una cosa da fare, cinque sono un elenco
   da leggere.

   Costano anche monete (`costo`), poche: il gesto di far partire una
   macchina è un gesto come seminare.

   ── UN RECINTO È UNA MACCHINA ─────────────────────────────────────
   E non un'altra meccanica. Gli si dà quello che è cresciuto nei campi,
   passa del tempo vero, e rende la sua roba: sono esattamente i verbi
   del mulino — `avvia`, aspetta, `ritira` — quindi il motore è quello
   che c'è già e non c'è niente di nuovo da imparare né da parte di chi
   gioca né da parte di chi legge il codice.

   Quello che un recinto ha di suo è che **si vede in che stato è**: il
   foglio degli animali disegna ogni specie sei volte (calmo, ha fame,
   mangia, contento, dorme, pronto) e il catalogo dice quale pezzo va con
   quale stato. Da lontano, senza aprire niente, si legge se c'è da fare
   qualcosa — che è lo stesso mestiere del 💭 sopra un cane affamato.

   ── E IN MEZZO C'È IL FIENILE ─────────────────────────────────────
   *Ribalta la catena di prima*, che era **campo → recinto → prodotto**:
   si raccoglieva il grano e lo si buttava dentro il pollaio così com'era.
   Tre righe corte, e il difetto era proprio la lunghezza — dopo il primo
   pomeriggio non c'era più niente da scoprire, e il posto dove si
   bruciano le monete deve avere qualcosa che si allarga.

   Adesso in mezzo c'è il **fienile**, che dal raccolto fa il *mangime*
   delle bestie: **campo → fienile → recinto → prodotto**. È una macchina
   come il mulino, non una meccanica nuova, ed è un edificio che c'era
   già nel baule come decorazione — l'orto e il carretto del vicino sono
   arrivati per la stessa strada, e chi se l'era comprato per bellezza se
   lo ritrova utile senza che ci sia niente da migrare.

   E i due mestieri restano separati, che è quello che rende leggibili
   due macchine invece di una sola con sette tasti:

     🌾 il mulino    → 🥣 mangime, 🍲 pastone, 🌾 farina   macina e basta
     🏚 il fienile   → 🌰 becchime, 🥬 foraggio, 🌼 fiorume  i tagli a freddo
     🍲 il pentolone → 🪣 beverone, 🥘 zuppa, 🍃 pastura    quello che si scalda
     🍞 il panificio → 🍞 pane, 🥧 merenda                  la tavola di casa

   ── IL FIENILE FA IL SECCO, IL PENTOLONE FA IL COTTO ──────────────
   *Ribalta la scelta di prima*, che teneva nove ricette nel fienile e
   tre nel mulino, di cui una — «Fragole al miele» — non è una
   macinatura. Il criterio è **un edificio = un mestiere che si
   riconosce a colpo d'occhio**, e mai più di quattro ricette: quattro
   tasti in un foglio si leggono, nove sono un elenco. Restano nel
   fienile i tagli a freddo; le quattro cose che si scaldano vanno nel
   pentolone, che arriva al 22 col beverone — cioè quando la prima
   ricetta cotta compariva già; la merenda va nel panificio.

   ── E UNA FATTORIA DI IERI NON SI ROMPE ───────────────────────────
   Una lavorazione in corso è `{ ricetta, da }` dentro la cosa, e il
   motore la legge per **id di ricetta**, non per macchina: una zuppa
   partita ieri nel fienile finisce e si ritira lo stesso, e solo la
   *prossima* si fa nel pentolone. Chi è oltre il 22 con la zuppa nel
   fienile deve comprare il pentolone (🪙150) per farla ancora, e il
   consiglio glielo dice («si fa nel pentolone, che non hai») — è
   l'unica tappa che toglie qualcosa a una fattoria di ieri, ed è
   stata confermata. `unita/recinti` gioca la migrazione.

   ── TRE MANGIMI, TRE BOCCHE ───────────────────────────────────────
   Uno solo sarebbe stato più semplice da scrivere e avrebbe cancellato
   la cosa che il gioco insegna: **ogni coltura ha la bocca che la
   mangia**. Con un mangime unico si coltiva la coltura più conveniente e
   basta; con tre, il grano resta la cosa delle galline e le zucche
   restano la cosa dei maiali, e il fienile è solo il passaggio in mezzo.

     🌾 grano  → 🌰 becchime → 🐔 galline           → 🥚 uova
     🥕 carote → 🥬 foraggio → 🐰 conigli           → 🧶 lana
     🌿 fieno  → 🥬 foraggio → 🐑 pecore · 🐄 mucche → 🧶 lana · 🥛 latte
     🎃 zucche → 🥘 zuppa    → 🐖 maiali            → 🍄 tartufi
     🌽 mais   → 🍲 pastone  (il mulino, per la ciotola)

   Due strade per lo stesso foraggio non sono una svista: le carote
   arrivano col primo recinto, il fieno sette livelli dopo ed è la metà
   del prezzo — chi ha aspettato risparmia, come sempre qui dentro.

   ── E L'ORTO, CIOÈ LE COPPIE ──────────────────────────────────────
   Le otto colture della seconda metà si mangiano **a due per volta**,
   che è la differenza fra un cereale e un orto:

     🥔 patate + 🥦 cavolfiori → 🪣 beverone → 🦆 anatre  → 🥚 uova
     🍅 pomodori               → 🥘 zuppa    → 🐖 maiali  → 🍄 tartufi
     🍆 melanzane + 🫑 peperoni → 🍃 pastura  → 🐐 capre   → 🥛 latte
     🧅 cipolle + 🧄 aglio      → 🌼 fiorume  → 🐝 api     → 🍯 miele
                  🥬 foraggio              → 🦙 alpaca  → 🧶 lana
                  🌰 becchime              → 🫏 asini   → 💩 concime
     🍓 fragole + 🍯 miele      → 🥧 merenda  (il mulino, per la ciotola)
     💩 concime + 🌿 fieno      → 🌼 fiori    (e l'anello si chiude)

   Due cose da leggere in quella tabella. La prima: **le api e gli
   asini non mangiano niente di nuovo** — foraggio e becchime sono
   quelli di sempre — perché cinque bocche nuove con cinque mangimi
   nuovi sarebbero stati cinque scomparti di silo in più per nulla.
   La seconda: **il concime torna nel prato**, ed è l'unico punto in
   cui la catena non va avanti dritta ma si richiude. Non è la strada
   più economica per i fiori: è quella che non chiede l'orto.

   ── E ALLORA LE PECORE E I CONIGLI? ───────────────────────────────
   Mangiano lo stesso foraggio e fanno la stessa lana, quindi l'ovile
   dev'essere **più efficiente**, se no costa il doppio della conigliera
   per fare la stessa cosa: 3 🥬 → 2 🧶 contro 2 🥬 → 1 🧶. Si paga prima
   e si risparmia dopo, che è la forma di tutta l'attrezzatura di questo
   gioco.

   La catena, per intero:
   campo → granaio → fienile → granaio → recinto → granaio → ciotola.
   Il verso resta uno solo, e non torna mai indietro in monete. */
export const RICETTE = [
  /* ── il mulino: la ciotola di casa ── */
  {
    id: 'mangime', nome: 'Mangime', emoji: '🥣', dove: 'mulino',
    prende: { grano: 2 }, costo: 1, minuti: 4, da: 'mangime', resa: 1,
  },
  /* Col mais, non col mulino: è la ricetta per cui esiste `liv`. */
  {
    id: 'pastone', nome: 'Pastone', emoji: '🍲', dove: 'mulino', liv: 10,
    prende: { mais: 3 }, costo: 1, minuti: 6, da: 'pastone', resa: 1,
  },

  /* ── il fienile: il mangime del cortile ──
     Ogni ricetta arriva **col recinto che la mangia**, e non prima: un
     sacco di becchime in granaio prima che esista una gallina è roba
     che occupa uno scomparto e non serve a niente. */
  {
    id: 'foraggio_carote', nome: 'Foraggio di carote', emoji: '🥬',
    dove: 'fienile', liv: 5,
    prende: { carote: 2 }, costo: 0, minuti: 5, da: 'foraggio', resa: 1,
  },
  {
    id: 'becchime', nome: 'Becchime', emoji: '🌰', dove: 'fienile', liv: 8,
    prende: { grano: 2 }, costo: 0, minuti: 4, da: 'becchime', resa: 1,
  },
  {
    id: 'foraggio', nome: 'Foraggio d\'erba', emoji: '🥬', dove: 'fienile', liv: 12,
    prende: { fieno: 2 }, costo: 0, minuti: 5, da: 'foraggio', resa: 1,
  },
  {
    id: 'zuppa', nome: 'Zuppa di zucca', emoji: '🥘', dove: 'pentolone', liv: 26,
    prende: { zucche: 2 }, costo: 0, minuti: 6, da: 'zuppa', resa: 1,
  },

  /* ── i recinti: il mangime diventa roba ── */
  {
    id: 'uova', nome: 'Uovo', emoji: '🥚', dove: 'pollaio',
    prende: { becchime: 2 }, costo: 1, minuti: 8, da: 'uova', resa: 1,
  },
  {
    id: 'latte', nome: 'Latte', emoji: '🥛', dove: 'stalla',
    prende: { foraggio: 2 }, costo: 1, minuti: 10, da: 'latte', resa: 1,
  },
  /* **L'ovile ne chiede uno solo**, ed è tutta la sua ragione di
     esistere: conigli e pecore fanno la stessa lana, quindi quello che
     costa il doppio deve chiedere la metà. Si paga prima e si risparmia
     dopo, come tutta l'attrezzatura di questo gioco. */
  {
    id: 'lana', nome: 'Lana', emoji: '🧶', dove: 'ovile',
    prende: { foraggio: 1 }, costo: 1, minuti: 8, da: 'lana', resa: 1,
  },
  {
    id: 'lana_angora', nome: 'Lana d\'angora', emoji: '🧶', dove: 'conigliera',
    prende: { foraggio: 2 }, costo: 1, minuti: 14, da: 'lana', resa: 1,
  },
  {
    id: 'tartufi', nome: 'Tartufo', emoji: '🍄', dove: 'porcile',
    prende: { zuppa: 2 }, costo: 1, minuti: 20, da: 'tartufi', resa: 1,
  },

  /* ═══════════ L'ORTO, E LE CINQUE BOCCHE NUOVE ═══════════
     La seconda metà del cortile. Cinque specie in più, e nessuna di
     loro è una meccanica nuova: sono macchine come le altre, con la
     faccia che cambia da sola. Quello che hanno di nuovo è **da dove
     arriva quello che mangiano**: non da un cereale, ma da una coppia
     di ortaggi.

     ── PERCHÉ UNA RICETTA DELL'ORTO PRENDE DUE COLTURE ─────────────
     Perché in una pentola non ci va mai una cosa sola, e perché con
     una coltura per ricetta le otto nuove avrebbero voluto otto
     ricette e otto scomparti di silo: un elenco, non un gioco. In
     coppia, invece, ognuna dice cosa seminare *accanto*, e la domanda
     «cosa mi manca» resta una cosa che si conta sulle dita — 2 🍆 e
     1 🫑, che sono tre campi da riempire.

     La resa resta **uno** (vedi `RESA`): N → 1 vale anche quando gli N
     sono di due specie diverse.

     ── E NESSUNA DELLE CINQUE È UN DOPPIONE ────────────────────────
     Tre danno una roba che c'era già (uova, latte, lana) e due una
     roba nuova (miele, concime). Le prime tre **non costano meno** di
     chi le faceva prima — sarebbe il modo di rendere inutile la prima
     metà del catalogo a chi ci è appena arrivato — e guadagnano su
     un'altra leva, che qui è la sola che conta davvero: **quanti campi
     e quanti passaggi**. Il freno della fattoria non è il prezzo, è il
     tempo e quanti campi hai. */

  /* ── il fienile dell'orto ── */
  /* Patate lesse e foglie di cavolo: è il pastone vero del pollame, e
     costa una monetina perché si scalda — le altre ricette del fienile
     sono tagli a freddo e non costano niente. */
  {
    id: 'beverone', nome: 'Beverone', emoji: '🪣', dove: 'pentolone', liv: 22,
    prende: { patate: 2, cavolfiori: 1 }, costo: 1, minuti: 4, da: 'beverone', resa: 1,
  },
  /* **La seconda strada per la zuppa dei maiali**, e la prima che non
     passa dalle zucche. Costa uguale (🪙4) e ci mette sei minuti in
     meno: chi ha aspettato risparmia, come per le due strade del
     foraggio. */
  {
    id: 'zuppa_orto', nome: 'Zuppa d\'orto', emoji: '🥘', dove: 'pentolone', liv: 29,
    prende: { pomodori: 2 }, costo: 0, minuti: 4, da: 'zuppa', resa: 1,
  },
  {
    id: 'pastura', nome: 'Pastura', emoji: '🍃', dove: 'pentolone', liv: 33,
    prende: { melanzane: 2, peperoni: 1 }, costo: 0, minuti: 5, da: 'pastura', resa: 1,
  },
  /* **Cipolle e aglio lasciati fiorire.** Non è una licenza: i fiori
     dell'aglio e della cipolla sono fra i migliori per le api, e
     lasciare andare a fiore invece di raccogliere è una cosa che si
     fa per davvero. Ed è il senso di questa riga nel gioco: due
     colture che non finiscono in nessuna ciotola trovano una bocca
     proprio perché non le si raccoglie per mangiarle. */
  {
    id: 'fiorume', nome: 'Fiorume', emoji: '🌼', dove: 'fienile', liv: 38,
    prende: { cipolle: 1, aglio: 1 }, costo: 0, minuti: 4, da: 'fiori', resa: 1,
  },
  /* ── E QUI L'ANELLO SI CHIUDE ──────────────────────────────────
     Il concime degli asini più un po' di erba medica: il prato torna
     a fiorire e le api ci vanno sopra. È l'unica ricetta della
     fattoria il cui ingrediente **viene da una bestia** invece che da
     un campo, e per questo arriva ultima.

     Non è la strada più corta per i fiori (il fiorume costa 🪙2 e
     ventidue minuti, questa 🪙6 e quarantasette) e non deve esserlo:
     è la strada che **non chiede l'orto**. Chi ha i campi pieni di
     pomodori fa il miele col grano e con gli asini. */
  {
    id: 'fiorume_concime', nome: 'Prato fiorito', emoji: '🌼', dove: 'fienile', liv: 47,
    prende: { concime: 1, fieno: 1 }, costo: 0, minuti: 5, da: 'fiori', resa: 1,
  },

  /* ── il panificio: la seconda pappa di casa ──
     Stava nel mulino, che macina e basta; stesso id, stesso livello,
     cambia solo `dove`. L'unica cosa di questa fattoria che non nasce
     da un cereale, e la ragione per cui le api servono a qualcosa
     dentro casa e non solo al banco del mercato. */
  {
    id: 'merenda', nome: 'Fragole al miele', emoji: '🥧', dove: 'panificio', liv: 44,
    prende: { fragole: 2, miele: 1 }, costo: 1, minuti: 6, da: 'merenda', resa: 1,
  },

  /* ── i cinque recinti nuovi ── */
  /* **Le anatre non fanno un uovo più a buon mercato del pollaio**:
     ne fanno uno con **un campo in meno** (tre invece di quattro) e
     tre minuti prima. Costa 🪙5 tutti e due, ed è voluto: un uovo è un
     uovo, e chi ha il pollaio non deve ritrovarselo svalutato. */
  {
    id: 'uova_anatra', nome: 'Uova d\'anatra', emoji: '🥚', dove: 'anatre',
    prende: { beverone: 1 }, costo: 1, minuti: 6, da: 'uova', resa: 1,
  },
  /* Le capre si accontentano dell'orto: **una pastura sola** dove la
     stalla vuole due foraggi, cioè tre campi invece di quattro e due
     passaggi di macchina invece di tre. In minuti sono più lente
     (quarantadue contro trentasei) — la scelta è fra tempo e spazio, e
     da qui in avanti è quasi sempre lo spazio a mancare. */
  {
    id: 'latte_capra', nome: 'Latte di capra', emoji: '🥛', dove: 'capre',
    prende: { pastura: 1 }, costo: 1, minuti: 12, da: 'latte', resa: 1,
  },
  {
    id: 'miele', nome: 'Miele', emoji: '🍯', dove: 'arnie',
    prende: { fiori: 2 }, costo: 1, minuti: 12, da: 'miele', resa: 1,
  },
  /* Come l'ovile — un foraggio solo — ma in cinque minuti invece di
     otto: è la stessa efficienza in più che l'ovile ha sulla
     conigliera, spostata di un gradino e pagata prima. */
  {
    id: 'lana_alpaca', nome: 'Lana d\'alpaca', emoji: '🧶', dove: 'alpaca',
    prende: { foraggio: 1 }, costo: 1, minuti: 5, da: 'lana', resa: 1,
  },
  {
    id: 'concime', nome: 'Concime', emoji: '💩', dove: 'asini',
    prende: { becchime: 2 }, costo: 1, minuti: 10, da: 'concime', resa: 1,
  },

  /* ═══════════ LE BOTTEGHE: L'ALBERO A PIÙ FASI ═══════════
     La lana finiva in una copertina, e fra la lana e un vestito non
     c'era niente: l'unico prodotto che non si mangia aveva un'uscita
     sola. Da qui in poi le ricette prendono **quello che esce da
     un'altra macchina** e lo portano un gradino più su — la catena
     del filo è erba → foraggio → lana → stoffa → maglione, cinque fasi
     — e quello che ne esce finisce nella dispensa, il terzo silo.
     Il progetto intero, con le catene che arrivano dopo, sta in
     `docs/fattoria-albero.md`. */

  /* ── il telaio: la stoffa ──
     Arriva al 14, due livelli dopo l'ovile: due lane fanno una stoffa,
     e la stoffa è il primo pezzo della catena che finisce alla sarta
     (il maglione, in sartoria). */
  {
    id: 'stoffa', nome: 'Stoffa', emoji: '🧵', dove: 'telaio', liv: 14,
    prende: { lana: 2 }, costo: 1, minuti: 8, da: 'stoffa', resa: 1,
  },

  /* ── il mulino macina la farina, il panificio la cuoce ──
     La farina arriva al 16 **col panificio** e non prima: farina
     senza panificio è roba che riempie la dispensa e non serve. Il
     pane è un cibo (0,60 di pancia): 🪙7 contro 🪙10 comprato, il 70%,
     dentro la fascia di `unita/coltivazioni`. */
  {
    id: 'farina', nome: 'Farina', emoji: '🌾', dove: 'mulino', liv: 16,
    prende: { grano: 2 }, costo: 1, minuti: 5, da: 'farina', resa: 1,
  },
  {
    id: 'pane', nome: 'Pane', emoji: '🍞', dove: 'panificio', liv: 16,
    prende: { farina: 2 }, costo: 1, minuti: 6, da: 'pane', resa: 1,
  },

  /* ── la sartoria: il maglione ──
     Due stoffe fanno un maglione, al 36: vale 🪙16 e un'ora e cinquanta
     di fattoria con un campo solo (`docs/fattoria-albero.md`, §3), e
     non si mangia — lo vuole la sarta — quindi non entra nel conto
     delle pappe: il suo freno è il tempo. */
  {
    id: 'maglione', nome: 'Maglione', emoji: '🧥', dove: 'sartoria', liv: 36,
    prende: { stoffa: 2 }, costo: 2, minuti: 10, da: 'maglione', resa: 1,
  },

  /* ── il caseificio: il latte si sdoppia ──
     **Il burro costa un gesto, il formaggio no**, e non è una svista:
     cagliare è un taglio a freddo come il foraggio, e con 🪙1 il
     formaggio arriverebbe al 78% della stessa pancia comprata — dentro
     la fascia di `unita/coltivazioni`, ma sul bordo. Il burro invece
     non è una pappa: il suo freno è il tempo di chi lo usa più su. */
  {
    id: 'burro', nome: 'Burro', emoji: '🧈', dove: 'caseificio', liv: 20,
    prende: { latte: 1 }, costo: 1, minuti: 5, da: 'burro', resa: 1,
  },
  {
    id: 'formaggio', nome: 'Formaggio', emoji: '🧀', dove: 'caseificio', liv: 20,
    prende: { latte: 2 }, costo: 0, minuti: 10, da: 'formaggio', resa: 1,
  },

  /* ── la torta: tre rami che si incontrano ──
     È la prima ricetta della fattoria che prende **tre cose da tre
     catene diverse** — il grano macinato, le uova del pollaio, il
     burro del caseificio — e per questo è l'ordine che il mercato paga
     di più. Non è una pappa: riempie la **voglia di giocare**, ed è il
     compleanno del cane (`COCCOLE` in `dati/bisogni.js`). */
  {
    id: 'torta', nome: 'Torta', emoji: '🎂', dove: 'panificio', liv: 20,
    prende: { farina: 2, uova: 1, burro: 1 }, costo: 2, minuti: 8, da: 'torta', resa: 1,
  },

  /* ── la tintoria: dove il colore incontra il filo e il latte ──
     La catena più lunga della fattoria finisce qui: erba → foraggio →
     lana → stoffa → maglione → maglione alla lavanda, **sei fasi**, e
     non ne esiste una più corta (è il numero che `PROFONDITA` tiene
     d'occhio). La tintoria è anche il punto in cui tre rami si
     toccano: il colore dai campi, il maglione dal filo, il burro dal
     latte.

     **Il maglione alla lavanda è una merce e non un addobbo**: entra
     un maglione, esce un maglione di un altro colore, e chi lo vuole
     è la sarta al banco. Il sapone invece è una coccola — il bagnetto
     — ed è la seconda cosa che si fa col burro. */
  {
    id: 'tintura', nome: 'Tintura', emoji: '🫙', dove: 'tintoria', liv: 52,
    prende: { lavanda: 2 }, costo: 1, minuti: 5, da: 'tintura', resa: 1,
  },
  {
    id: 'maglione_lavanda', nome: 'Maglione alla lavanda', emoji: '💜',
    dove: 'tintoria', liv: 52,
    prende: { maglione: 1, tintura: 1 }, costo: 1, minuti: 6,
    da: 'maglione_lavanda', resa: 1,
  },
  {
    id: 'sapone', nome: 'Sapone', emoji: '🧼', dove: 'tintoria', liv: 52,
    prende: { tintura: 1, burro: 1 }, costo: 1, minuti: 5, da: 'sapone', resa: 1,
  },
  /* La quarta della tintoria, e la seconda bocca della lavanda: due
     mazzi dentro un pezzo di stoffa. È la confluenza più corta fra il
     colore e il filo, e arriva insieme alle altre — una coltura con
     una bocca sola è una coltura che si semina una volta. */
  {
    id: 'sacchetto', nome: 'Sacchetto profumato', emoji: '👝',
    dove: 'tintoria', liv: 52,
    prende: { lavanda: 2, stoffa: 1 }, costo: 1, minuti: 5, da: 'sacchetto', resa: 1,
  },

  /* ═══════════ LA CUCINA: LE COLTURE CHE SI INCONTRANO ═══════════
     Il difetto che questa macchina esiste per riparare sta in fondo al
     file, in `guastiDelleColture`: **dodici colture su tredici avevano
     una bocca sola**, e quasi tutte una bocca che prendeva solo loro.
     Un orto fatto così si semina una volta per vedere com'è e poi si
     torna alla coltura che serve — mentre quello che rende vivo un
     orto è che due cose diverse, insieme, ne facciano una terza.

     Le quattro ricette sono tutte **a confluenza**, cioè prendono roba
     di catene diverse, e nessuna prende meno di due ingredienti. La
     cucina arriva al 24, fra le anatre e i maiali: è il primo livello
     in cui il caseificio c'è già e l'orto ha aperto. */
  {
    id: 'minestrone', nome: 'Minestrone', emoji: '🍜', dove: 'cucina', liv: 24,
    prende: { patate: 1, carote: 1, cavolfiori: 1 }, costo: 1, minuti: 6,
    da: 'minestrone', resa: 1,
  },
  /* La polenta lega il mais al caseificio, ed è la ragione per cui il
     mais non è più la coltura che serve solo ai cani: costa 🪙15, cioè
     troppo per una ciotola — si porta al banco. */
  {
    id: 'polenta', nome: 'Polenta e formaggio', emoji: '🍛', dove: 'cucina', liv: 24,
    prende: { mais: 2, formaggio: 1 }, costo: 1, minuti: 8, da: 'polenta', resa: 1,
  },
  {
    id: 'conserva', nome: 'Conserva d\'orto', emoji: '🥗', dove: 'cucina', liv: 33,
    prende: { melanzane: 1, peperoni: 1, zucche: 1 }, costo: 1, minuti: 7,
    da: 'conserva', resa: 1,
  },
  /* Pomodori, cipolle e aglio: il soffritto, cioè le tre colture che
     al banco andavano solo crude. */
  {
    id: 'salsa', nome: 'Salsa di pomodoro', emoji: '🥫', dove: 'cucina', liv: 38,
    prende: { pomodori: 2, cipolle: 1, aglio: 1 }, costo: 1, minuti: 6,
    da: 'salsa', resa: 1,
  },

  /* La quarta del panificio, e la seconda bocca delle fragole: farina,
     fragole e burro, cioè tre catene di nuovo. */
  {
    id: 'crostata', nome: 'Crostata di fragole', emoji: '🍰',
    dove: 'panificio', liv: 44,
    prende: { farina: 1, fragole: 1, burro: 1 }, costo: 2, minuti: 7,
    da: 'crostata', resa: 1,
  },
]

export const PER_RICETTA = Object.fromEntries(RICETTE.map(r => [r.id, r]))

/* Le ricette di una macchina. `liv` è il livello della fattoria: chi
   non lo passa le vuole tutte (i controlli, gli strumenti), chi gioca
   passa il suo e vede solo quelle arrivate. Il ripiego di una ricetta
   senza `liv` è il livello della sua macchina — se la macchina ce
   l'hai, la ricetta c'è. */
export const ricetteDi = (dove, liv = null) =>
  RICETTE.filter(r => r.dove === dove && (liv === null || (r.liv || 1) <= liv))

/* ── i due silos ──────────────────────────────────────────────────
   *Ribalta la scelta di prima.* C'era un granaio solo, con un tetto
   generoso (trenta) **per ogni prodotto** e un silo che ne aggiungeva
   altri trenta a testa: si comprava un secondo silo e non cambiava
   niente che si potesse vedere, perché quel tetto non lo toccava
   nessuno. Un numero grande che non morde non è un limite, è una riga
   di spiegazione in fondo a un foglio.

   Adesso il magazzino è **piccolo, condiviso e si ingrandisce
   pagando**, come in Hay Day, e sono tre decisioni diverse:

     · **piccolo** — quattro posti, e ci si arriva subito. Serve a non
       far diventare questo posto una contabilità: chi gioca deve avere
       poca roba in mano e spenderla, non tenere scorte.
     · **condiviso** — i quattro posti sono di *tutto quello che sta in
       quel silo*, non di ogni prodotto. Era la cosa che non si capiva:
       «di ogni cosa ce ne stanno 90» è una frase che nessuno sa
       trasformare in «adesso quanto ci sta».
     · **si ingrandisce** — il silo è una struttura sola e si potenzia
       (+2 posti a colpo), e il prezzo raddoppia il passo ogni volta:
       20, 30, 50, 90, 170. I primi due sono un pomeriggio, il quinto è
       una decisione.

   E i silos sono **due, diversi, e servono entrambi**: il rosso tiene
   quello che viene dalla terra, il bianco quello che danno le bestie.
   Non è simmetria per bellezza — è quello che rende il pollaio una
   spesa che ne trascina un'altra, e che tiene la catena leggibile: se
   il raccolto è pieno, le uova entrano lo stesso.

   Chi non ha costruito il silo **non ha capienza affatto**: capienza
   zero, non capienza piccola. Un raccolto senza posto dove finire non
   si raccoglie, e il campo resta pronto ad aspettare (`motore/`). */
/* `vuoto` è la frase del silo costruito prima di avere di che
   riempirlo: la dice `viste/Granaio.vue`, e va detta con le parole di
   quel silo — «ci arriverà la roba degli animali» sopra la dispensa
   sarebbe una bugia. */
export const SILI = {
  terra:  { cosa: 'silo',        nome: 'Silo del raccolto', emoji: '🌾',
            vuoto: 'quello che raccogli nei campi' },
  stalla: { cosa: 'silo_bianco', nome: 'Silo della stalla',  emoji: '🥛',
            vuoto: 'la roba degli animali' },
  /* Il terzo, per quello che esce dalle botteghe: il perché sta sopra
     `PRODOTTI`, alla voce della stoffa. Arriva al 14 col telaio, che è
     la prima bottega, e costa quanto gli altri due. */
  bottega: { cosa: 'dispensa',   nome: 'Dispensa',           emoji: '📦',
             vuoto: 'quello che esce dalle botteghe' },
}

/* ── UNO SCOMPARTO PER MERCE ──────────────────────────────────────
   *Ribalta la scelta di prima*, e va detto perché: i posti condivisi
   erano **la cosa giusta contro il difetto sbagliato**.

   Il difetto di due versioni fa era un tetto di 30 (poi 90) **per
   prodotto**: un numero che non mordeva mai, quindi comprare il secondo
   silo non cambiava niente che si potesse vedere. La risposta fu
   metterli in comune e farli pochi — dodici, condivisi — e come
   risposta a *quel* difetto era esatta.

   Ma dodici posti condivisi reggono **sette merci diverse**: due a
   testa. E il conto non è teorico, è quello che è successo: 32 di mais
   e 4 di carote in un silo da 36, e niente più raccoglibile. Un
   bambino non alterna le colture, semina quella che gli piace — è la
   cosa che fa e va bene che la faccia — e la conseguenza era che il
   gioco si fermava senza che niente fosse andato storto.

   Adesso ogni merce ha **il suo scomparto**, tutti della stessa
   misura, e ingrandire il silo li ingrandisce tutti insieme. Il mais
   non può più mangiarsi il posto delle carote: è impossibile per
   costruzione, non improbabile.

   E la domanda che i posti condivisi lasciavano senza risposta —
   «quanto ci sta ancora?» — diventa una cosa che si guarda, perché
   uno scomparto è una barretta con un numero sopra. Il tetto vecchio
   era invisibile e grande; questo è visibile e piccolo, ed è tutta la
   differenza fra i due.

   OTTO, CIOÈ QUATTRO GIRI DI RICETTA. *Ribalta la ragione di prima*,
   che era «due campi della stessa coltura ci stanno e tre no» — vera
   finché un campo rendeva da due a cinque, e senza senso da quando ne
   rende **uno** (vedi `RESA`). Otto adesso vuol dire otto raccolti, e
   una ricetta ne chiede due: si può accumulare per quattro giri prima
   di dover usare qualcosa. Abbastanza per non star lì a contare, poco
   abbastanza perché chi semina sempre e non trasforma mai si trovi lo
   scomparto colmo — che è il momento in cui il gioco insegna il resto
   della catena. */
export const SCOMPARTO_BASE = 8
export const SCOMPARTO_PIU = 2

/* Quanti pezzi di **una** merce ci stanno, con gli ingrandimenti fatti.
   `livello` è quante volte il silo è stato ingrandito: zero è appena
   costruito. */
export const postiPerMerce = livello =>
  SCOMPARTO_BASE + SCOMPARTO_PIU * Math.max(0, livello | 0)

/* Quali merci vanno in un silo, in ordine di tabella: è l'elenco degli
   scomparti che quel silo ha, e serve a disegnarli tutti — anche quelli
   vuoti, perché uno scomparto vuoto è il posto dove *potrebbe* andare
   qualcosa, cioè un invito. */
export const merciDi = famiglia =>
  Object.keys(PRODOTTI).filter(k => PRODOTTI[k].silo === famiglia)

/* Quanto costa il prossimo ingrandimento: 40, 130, 185, 220, 250, 275…
   — che in tempo di gioco (vedi `CALIBRAZIONE.md`: una moneta sono dieci
   secondi di esercizi) vuol dire 7 minuti il primo, poi mezz'ora, poi
   sempre intorno all'ora.

   *Ribalta la scelta di prima*, che raddoppiava il passo (20, 30, 50,
   90, 170, 330…). Sembrava prudente — «semi-esponenziale, non un ×2
   secco» — ed era la stessa cosa: per arrivare a 28 posti chiedeva
   quarantamila monete, cioè **centoundici ore** di esercizi. Il difetto
   di ragionamento è che una curva esponenziale presume che chi paga
   diventi più ricco a ogni passo, e qui non succede: le monete si
   guadagnano sempre allo stesso ritmo, quindi **lo sforzo riparte da
   zero ogni volta**.

   Logaritmica, invece, dice la cosa giusta: il salto vero è il secondo
   (da 7 minuti a mezz'ora), poi ogni ingrandimento costa più o meno la
   stessa fatica — un'ora — e non arriva mai a costare una settimana.
   Arrotondato a cinque perché un prezzo è una cosa che si legge. */
export const costoIngrandimento = livello =>
  Math.round((40 + 130 * Math.log(1 + Math.max(0, livello | 0))) / 5) * 5

/* In quale silo va a finire un prodotto. Sconosciuto vuol dire nessun
   silo: non ci sta da nessuna parte, che è come si comporta un prodotto
   tolto dalla tabella. */
export const siloDelProdotto = prodotto => (PRODOTTI[prodotto] || {}).silo || null

/* ── COME SI FA UNA ROBA ──────────────────────────────────────────
   Il contrario di `serveA()` (in `dati/bisogni.js`): là si chiede a
   cosa serve quello che hai, qui **come si ottiene quello che non
   hai**. Serve alla ciotola: un tasto spento perché il mangime è finito
   deve poter dire «3 🌾 nel mulino», se no chi gioca sa solo che non
   può, e la catena resta una cosa da indovinare.

   Torna righe di dato, non frasi: il nome della macchina lo sa il
   catalogo, che importa da qui. */
export function comeSiFa(prodotto) {
  const modi = []
  for (const c of COLTURE)
    if (c.da === prodotto)
      modi.push({ che: 'coltura', id: c.id, emoji: c.emoji, nome: c.nome,
                  minuti: c.minuti, resa: c.resa })
  for (const r of RICETTE)
    if (r.da === prodotto)
      modi.push({ che: 'ricetta', dove: r.dove, prende: r.prende,
                  minuti: r.minuti, resa: r.resa, emoji: r.emoji, nome: r.nome })
  return modi
}

/* ── leggere l'orologio ───────────────────────────────────────────
   Quanto è cresciuto qualcosa che è cominciato a `da` e vuole `minuti`.
   Si ferma a 1 e non va oltre: **niente marcisce**, quindi oltre il
   maturo non c'è nessun altro stato.

   Il massimo con zero serve a un orologio che va indietro — succede su
   un telefono a cui si cambia la data, e senza il taglio un campo
   seminato risulterebbe seminato *nel futuro* e non maturerebbe più. */
export function quantoCresciuto(da, minuti, ora = Date.now()) {
  if (!da || !(minuti > 0)) return 1
  return Math.max(0, Math.min(1, (ora - da) / (minuti * MINUTO)))
}

/* Quale stadio mostrare, fra quelli dichiarati. L'ultimo è il maturo, e
   ci si arriva solo a crescita finita: se no un campo al 99% sembrerebbe
   pronto e chi lo tocca troverebbe un tasto spento. */
export function stadioDi(coltura, quanto) {
  const st = (coltura && coltura.stadi) || []
  if (!st.length) return null
  if (quanto >= 1) return st[st.length - 1]
  const q = Math.max(0, Math.min(0.999, quanto))
  return st[Math.floor(q * (st.length - 1))]
}

/* Quanto manca, in minuti interi arrotondati per eccesso: «fra 3 minuti»
   è una cosa che si può dire a un bambino, «fra 154 secondi» no. Zero
   vuol dire pronto. */
export function minutiCheMancano(da, minuti, ora = Date.now()) {
  const q = quantoCresciuto(da, minuti, ora)
  if (q >= 1) return 0
  return Math.max(1, Math.ceil((1 - q) * minuti))
}

/* ── N → 1, MAI 1 → N E MAI N → M ─────────────────────────────────
   La regola che tiene contabile tutta la catena, e non è una scelta di
   bilanciamento: è **quanto costa capire**. Un campo dà una cosa, tre
   grani danno un mangime, due mangimi danno un uovo. Da lì la domanda
   «quanti me ne servono» ha una risposta che si conta sulle dita: se te
   ne chiedo tre, riempi tre campi.

   Con `resa` diversa da uno quel conto si spezza: da «due grani fanno
   tre mangimi» a «quanti campi devo seminare per due uova» ci sono due
   divisioni con un resto, e non le fa nessuno — si semina a caso e si
   torna a guardare. Peggio, il numero grande fa credere di essere
   ricchi: un campo che rende cinque mais sembra tanto finché non si
   scopre che al pastone ne servono quattro.

   Quindi la resa è **sempre 1**, e a fare la differenza fra le ricette
   restano quanto prendono, quanto costano e quanto ci mettono — tre
   leve che si leggono tutte guardando il tasto. */
export const RESA = 1

/* ── QUANTO È LUNGA LA CATENA, SCRITTO UNA VOLTA ──────────────────
   Quattro conti risalgono la catena da soli — `valoreDi` e `minutiDi`
   in `dati/mercato.js`, `livelloDelProdotto` in `dati/livelli.js`,
   `Fattoria.ottenibile` nel motore, `comeAvere` in `motore/consiglio.js`
   — e ognuno si ferma dopo un certo numero di passi, perché una tabella
   scritta male potrebbe avere un anello (il pastone che serve al
   pastone) e un conto che si avvita non dà un guasto: non finisce.

   Quel numero era **scritto in ciascuno dei quattro** (5, 4, 4, 5), e
   nessuno lanciava un errore quando la catena diventava più lunga:
   rispondevano `Infinity` o un vicolo cieco — la stoffa che non si può
   mai ordinare, «🌿 Fieno si fa in fattoria». Un numero copiato in
   quattro file è il modo in cui il quinto file dimentica di alzarlo.

   Adesso è **uno**: la profondità massima che una catena può avere,
   più due di margine. Chi aggiunge una fase lo alza qui, e
   `guastiDelleColture` diventa rosso prima — `profonditaDi` misura la
   strada più corta di ogni merce, e quella che si avvicina al tetto si
   vede senza giocare. */
export const PROFONDITA = 8

/* Quanti passaggi ci vogliono, al minimo, da un campo a questa merce:
   una coltura è 1, una ricetta è 1 più il più lungo dei suoi
   ingredienti. `Infinity` se non si produce in nessun modo entro il
   tetto — che per una merce vera è un guasto, e per un anello è
   l'unica risposta che non blocca il fotogramma. */
export function profonditaDi(prodotto, giri = PROFONDITA) {
  if (giri <= 0 || !PRODOTTI[prodotto]) return Infinity
  let min = Infinity
  for (const c of COLTURE) if (c.da === prodotto) min = Math.min(min, 1)
  for (const r of RICETTE) {
    if (r.da !== prodotto) continue
    let n = 1
    for (const k of Object.keys(r.prende || {})) n = Math.max(n, 1 + profonditaDi(k, giri - 1))
    min = Math.min(min, n)
  }
  return min
}

export function guastiDelleColture() {
  const g = []
  /* La catena più lunga deve stare **sotto** il tetto, con due passi di
     margine: al tetto esatto il conto torna giusto oggi e diventa
     `Infinity` alla prossima ricetta, senza che niente lo dica. */
  for (const p of Object.keys(PRODOTTI)) {
    const n = profonditaDi(p)
    if (!Number.isFinite(n))
      g.push(`${p}: non si produce in nessun modo entro ${PROFONDITA} passaggi — un anello, o PROFONDITA è bassa`)
    else if (n > PROFONDITA - 2)
      g.push(`${p}: la sua catena è lunga ${n} passaggi, troppo vicina al tetto (${PROFONDITA}) — alza PROFONDITA`)
  }
  for (const c of COLTURE)
    if (c.resa !== RESA)
      g.push(`${c.id}: rende ${c.resa} e non ${RESA} — un campo dà una cosa sola`)
  for (const r of RICETTE)
    if (r.resa !== RESA)
      g.push(`${r.id}: rende ${r.resa} e non ${RESA} — N → 1, mai N → M`)
  const visti = new Set()
  for (const c of COLTURE) {
    if (visti.has(c.id)) g.push(`coltura doppia: ${c.id}`)
    visti.add(c.id)
    if (!PRODOTTI[c.da]) g.push(`${c.id}: rende «${c.da}», che non è un prodotto`)
    if (!(c.minuti > 0)) g.push(`${c.id}: tempo impossibile`)
    if (!(c.resa >= 1)) g.push(`${c.id}: non rende niente`)
    if (!(c.semina >= 0) || !(c.raccolta >= 0)) g.push(`${c.id}: prezzo impossibile`)
    /* Un campo che non si vede crescere è un campo che sembra rotto: gli
       stadi devono essere almeno due, seminato e maturo. */
    if (!Array.isArray(c.stadi) || c.stadi.length < 2)
      g.push(`${c.id}: meno di due stadi — la crescita non si vedrebbe`)
    /* Uno stadio che l'atlante non ha è **muto**: `drawImage` con un
       argomento non finito torna senza disegnare e senza lanciare, quindi
       il campo cresce e non si vede crescere, e non c'è niente in
       console. È il motivo per cui i nomi si controllano qui. */
    for (const s of c.stadi || [])
      if (s && !PEZZI[s]) g.push(`${c.id}: lo stadio «${s}» non è nell'atlante`)
    /* Una coltura nata prima del suo foglio cresce **col disegno di
       un'altra**, e dice qui quale sarà il suo: `aspetta` è il
       prefisso dei sette riquadri. Il giorno che il primo c'è, la riga
       va aggiornata — se no il campo resta viola di melanzane con il
       suo disegno pronto a due cartelle di distanza. */
    if (c.aspetta && PEZZI[`${c.aspetta}0`])
      g.push(`${c.id}: aspetta «${c.aspetta}0…», che nell'atlante c'è già — prendi i suoi stadi`)
  }
  const idRicette = new Set()
  for (const r of RICETTE) {
    if (idRicette.has(r.id)) g.push(`ricetta doppia: ${r.id}`)
    idRicette.add(r.id)
    if (!PRODOTTI[r.da]) g.push(`${r.id}: fa «${r.da}», che non è un prodotto`)
    if (!(r.resa >= 1)) g.push(`${r.id}: non rende niente`)
    if (!(r.minuti > 0)) g.push(`${r.id}: tempo impossibile`)
    for (const k of Object.keys(r.prende || {})) {
      if (!PRODOTTI[k]) g.push(`${r.id}: prende «${k}», che non è un prodotto`)
      if (!(r.prende[k] >= 1)) g.push(`${r.id}: prende una quantità impossibile di ${k}`)
    }
    if (!Object.keys(r.prende || {}).length)
      g.push(`${r.id}: non prende niente — sarebbe una fonte di roba dal nulla`)
  }
  /* Un prodotto senza silo non si potrebbe raccogliere: `quantoCiSta`
     risponderebbe zero per sempre, e a schermo sarebbe un raccolto che
     non entra da nessuna parte senza che niente dica perché. */
  for (const [id, pr] of Object.entries(PRODOTTI)) {
    if (!SILI[pr.silo]) g.push(`${id}: sta in un silo che non esiste («${pr.silo}»)`)
    /* Un pezzo che l'atlante non ha è **muto** come uno stadio storto:
       `drawImage` torna senza disegnare e senza lanciare, e a schermo
       resta un fumetto vuoto sopra una bestia che ha fame. Chi il
       disegno non ce l'ha scrive solo l'emoji, che è il ripiego
       dichiarato — quello che non si regge è un nome sbagliato. */
    if (pr.pezzo && !PEZZI[pr.pezzo])
      g.push(`${id}: il pezzo «${pr.pezzo}» non è nell'atlante`)
    /* Il pezzo **atteso** è quello che un foglio futuro porterà: il
       giorno che c'è, la riga va aggiornata — se no la merce resta
       un'emoji con il disegno pronto a due righe di distanza. */
    if (pr.aspetta && PEZZI[pr.aspetta])
      g.push(`${id}: aspetta «${pr.aspetta}», che nell'atlante c'è già — scrivilo come pezzo`)
    if (!pr.pezzo && !pr.aspetta)
      g.push(`${id}: senza pezzo e senza dire quale aspetta — un'emoji per sempre`)
  }
  if (!(SCOMPARTO_BASE > 0)) g.push('uno scomparto da zero non tiene niente')
  if (!(SCOMPARTO_PIU > 0)) g.push('un ingrandimento che non aggiunge niente non si paga')
  /* Ogni silo deve avere almeno una merce, se no è un edificio che si
     compra e resta vuoto per sempre. */
  for (const fam of Object.keys(SILI))
    if (!merciDi(fam).length) g.push(`il silo «${fam}» non tiene nessuna merce`)
  /* Uno scomparto deve reggere **almeno un raccolto intero**: se la
     resa di un campo non ci sta nemmeno a scomparto vuoto, quella
     coltura non si può raccogliere mai e nessuno saprebbe dire perché. */
  for (const c of COLTURE)
    if (c.resa > SCOMPARTO_BASE)
      g.push(`${c.id}: rende ${c.resa}, più di uno scomparto vuoto (${SCOMPARTO_BASE})`)
  /* Il prezzo deve **salire**: uno che scende farebbe convenire
     aspettare, che è il contrario di quello che deve fare. */
  for (let l = 0; l < 6; l++)
    if (!(costoIngrandimento(l + 1) > costoIngrandimento(l)))
      g.push(`l'ingrandimento numero ${l + 2} non costa più del precedente`)
  return g
}
