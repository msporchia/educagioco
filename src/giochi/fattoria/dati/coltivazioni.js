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
   è arrivato (`sorgenti/gfx/campi.png`) ed è cambiata questa tabella e
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
   `strumenti/sprite/sorgenti/oggetti.jpg`, sei oggetti su fondo
   magenta — e il magenta è la ragione per cui si scontornano da soli. */
export const PRODOTTI = {
  /* dai campi — il silo del raccolto */
  grano:   { nome: 'Grano',   emoji: '🌾', silo: 'terra', pezzo: 'raccolto_grano' },
  mais:    { nome: 'Mais',    emoji: '🌽', silo: 'terra', pezzo: 'raccolto_mais' },
  carote:  { nome: 'Carote',  emoji: '🥕', silo: 'terra', pezzo: 'raccolto_carote' },
  zucche:  { nome: 'Zucche',  emoji: '🎃', silo: 'terra', pezzo: 'raccolto_zucche' },
  fieno:   { nome: 'Fieno',   emoji: '🌿', silo: 'terra', pezzo: 'raccolto_erba' },
  /* il mangime delle bestie del cortile: esce dal fienile e non si
     mangia in casa — è la riga di mezzo della catena */
  becchime: { nome: 'Becchime', emoji: '🌰', silo: 'stalla', pezzo: 'merce_becchime' },
  foraggio: { nome: 'Foraggio', emoji: '🥬', silo: 'stalla', pezzo: 'balla_fieno_tonda' },
  zuppa:    { nome: 'Zuppa',    emoji: '🥘', silo: 'stalla', pezzo: 'merce_zuppa' },
  /* quello che mangiano il cane e il gatto di casa: esce dal mulino */
  mangime: { nome: 'Mangime', emoji: '🥣', silo: 'stalla', pezzo: 'merce_mangime' },
  /* Il calderone e non la ciotola rosa dei gatti: in una fila di nove
     scomparti di legno e iuta quella era l'unica cosa fucsia, e si
     leggeva come un errore. Un pastone sta in una pentola. */
  pastone: { nome: 'Pastone', emoji: '🍲', silo: 'stalla', pezzo: 'calderone0' },
  /* e quello che danno */
  uova:    { nome: 'Uova',    emoji: '🥚', silo: 'stalla', pezzo: 'merce_uova' },
  latte:   { nome: 'Latte',   emoji: '🥛', silo: 'stalla', pezzo: 'latte' },
  tartufi: { nome: 'Tartufi', emoji: '🍄', silo: 'stalla', pezzo: 'merce_tartufi' },
  lana:    { nome: 'Lana',    emoji: '🧶', silo: 'stalla', pezzo: 'merce_lana' },
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

     grano   1   e al 3 c'è il mulino che ne fa mangime
     carote  5   insieme alla conigliera, che mangia solo quelle
     mais   10   per il pastone, quando il mulino gira da un pezzo
     erba   12   insieme all'ovile: prima il fieno, poi le pecore
     zucche 26   insieme al porcile, l'unico che le vuole

   Il primo campo ha **una scelta sola**, e non è una limitazione: a
   quattro anni cinque bottoni sono un elenco da leggere, uno è una cosa
   da fare. Una coltura che arriva prima di quello che la consuma
   sarebbe roba che riempie il silo senza servire a niente — che è il
   modo di far sembrare rotto un gioco che funziona. */
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

     🌾 il mulino  → 🥣 mangime, 🍲 pastone   la ciotola di casa
     🏚 il fienile → 🌰 becchime, 🥬 foraggio, 🥘 zuppa   il cortile

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
    id: 'zuppa', nome: 'Zuppa di zucca', emoji: '🥘', dove: 'fienile', liv: 26,
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
export const SILI = {
  terra:  { cosa: 'silo',        nome: 'Silo del raccolto', emoji: '🌾' },
  stalla: { cosa: 'silo_bianco', nome: 'Silo della stalla',  emoji: '🥛' },
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

export function guastiDelleColture() {
  const g = []
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
