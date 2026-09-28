# Il Generale — da fare

Solo voci aperte, verificate sul codice di questo ramo. Il ramo che lavora
sul Generale potrebbe averne chiuse altre: prima di cominciarne una si
riguarda il codice. Il punto della situazione del motore sta in
`docs/generale_improvements.md`.

## In ordine

1. **I livelli, da capo.** Ne restano sei nel tutorial più la prima storia
   a puntate (`src/data/generale.js`); il resto è stato tolto perché,
   giocato, era noioso. Si riparte da quello che rende un livello un posto
   dove valga la pena entrare, non da quello che il banco sa misurare
   ([didattica.md](didattica.md), nota in testa). Gli attriti qui sotto
   sono il mondo che manca per farlo.
2. **Le scorciatoie mancanti in `src/data/livelli/scrivi.js`**, l'unico posto
   rimasto indietro rispetto al motore:
   - `resistenza` fra le `OPZIONI` di `oggetto` (e dei congegni): il motore
     la legge (`src/motore/generale/elemento.js`, `rompibile`), ma
     `controllaOpzioni` la rifiuta scritta in una fabbrica;
   - `quale` negli ordini (`fai.attacca(orchi, { quale: 'lontano' })`): il
     motore lo sa (`src/motore/generale/scelte.js`, `Ordine.quale`), le
     fabbriche di `fai` prendono solo la cosa;
   - `se.rotto(x)` (domanda `rotto`, `domande/rotto.js`) e
     `se.oppure(...)` / `se.entrambe(...)` (`{ cond: 'oppure', fra: [...] }`,
     `domande/insieme.js`).
   Senza, un livello scrive il dato per esteso (funziona: i test lo fanno).
3. **`quale` componibile a schermo**: il criterio («il più lontano») non si
   può ancora scegliere nell'editor (`src/views/generale/SceltaAzione.vue`,
   `EditorPiano.vue`).
4. **`sa` da lista di permessi a lista di divieti.** Oggi (`saFare` in
   `src/motore/generale/vocabolario.js`) un'unità che dichiara `sa` e non
   elenca `suona` è muta per omissione, e i livelli ripetono `suona`,
   `aspetta`, `quando` in ogni scheda. Parlare non è un talento come
   scassinare: la lista deve dire chi **non** può. (Diverso da
   `nonRiesce`, che lascia il verbo in cassetta e fallisce parlando.)

## Dalla didattica: quello che le regole chiedono e non c'è

- **Il dominio in ombra (§1.1).** Le posizioni possibili di un nemico (i
  segnaposto delle varianti) si disegnano in ombra da subito, quella vera
  compare quando una tua unità lo vede, e un'ombra sparisce quando una tua
  unità guarda quel punto vuoto. Tratteggio, opacità e una riga «uno di
  questi», se no quattro ombre sono quattro orchi. Insieme va ripensato
  `mostraNemici: true` (`src/views/GeneraleGame.vue`, `scoperte`), che
  mostra nemici mai visti: l'unica violazione di «nessuno è onnisciente».
- **I fallimenti come vignette sul campo (§7).** Le vignette di
  `src/views/generale/CampoLivello.vue` sono alimentate solo da
  `mondo.allarmi` (i segnali). Mancano: le frasi di fallimento dei tuoi
  (`penso`: «ho le mani occupate», «non si apre così») e i fatti degli
  altri (`siVede`); l'**onda del rumore** in linea d'aria, che attraversa i
  muri mentre la vista gira intorno; le **onomatopee** per segnale (GNIIK,
  CLACK, SBAM) con la grandezza come intensità; il fumetto unico che pulsa
  col conto per le ripetizioni. Il `motivo` di un rifiuto c'è già
  (`riuscito: false`): la vignetta si attacca lì.
- **La tacca di mezzo del rumore (§6).** I raggi in `SEGNALI`
  (`src/motore/generale/mondo.js`) sono 5 / 20 / 30 / 40: su mappe piccole
  le tacche vere sono due, *solo chi è addosso* e *tutti*. Perché dosare il
  rumore sia una scelta serve il rumore che arriva a metà mappa: si
  rimisurano sulla dimensione vera delle stanze.
- **`segnaleDi` non fonde.** In `mondo.js` è
  `vocabolario[k] || ilSegnale(k)`: un livello che ridichiara un segnale
  della tabella globale per dargli nome ed emoji suoi perde il resto, e
  senza `voce` il suo raggio scende a 20 (`VOCE_NORMALE`) in silenzio
  (misurato: un `fracasso` a 20 invece di 40). Va fuso
  `{ ...ilSegnale(k), ...dichiarato }` **omettendo le chiavi non
  dichiarate**, se no un `em: undefined` cancella l'emoji buona. Oggi la
  torta scrive `voce` a mano su ogni segnale e non ci casca.
- **`insegna:` / `chiede:` (§9).** Il livello dichiara i concetti, lo
  sblocco si deriva dal grafo (un tronco e dei rami). Poi due reti del
  banco (§11): ogni `chiede` dev'essere stato insegnato prima, e ogni
  soluzione usa solo costrutti già disponibili.
- **La griglia dei pattern (§11).** Uno strumento che stampa quale forma
  sta in quale posizione della fila: si vedono due uguali di fila, un
  pattern insegnato e mai più chiesto, un costrutto che sparisce per dodici
  livelli. Oggi l'informazione sta solo nei commenti in testa ai file.

## Dalle mappe

- **I dettagli sul lastricato**: l'esclusione vive ancora in `libera()` di
  `src/grafica/mappa.js` e legge i suoli, invece di chiederlo alla mappa
  piena (`src/motore/generale/stanze.js`). Funziona, ma è la seconda copia
  di una domanda a cui sa rispondere qualcun altro.
- **Il raccordo fra due murature diverse**: dove la pietra incontra il
  legno oggi c'è uno stacco netto.
- **Gli ingombranti in `scenografia`**: i livelli del tutorial mettono
  alberi, cespugli e bandiere in `scenografia` su caselle di muro. Si vedono
  giusti e ingombrano davvero, ma è una convenzione da tenere a mente:
  si riscrivono con `arredo.*` quando si apre il livello per altro.

## Gli attriti: il mondo che manca

Annotati scrivendo quattro campagne poi tolte («qui mi servirebbe dire X e
non posso»); fra parentesi quante le hanno colpite. Già caduti: passare una
cosa (`posa`), rompere (`attacca` sulle cose, domanda `rotto`), partire con
qualcosa in mano (`zaino`), aspettare che uno se ne vada (`aspetta che [non
vedi …]`), ordini nemici e stanza diversi per scena (`ordini` e `scena`
nella variante).

- **A. Aspettare e sincronizzare (4 su 4).** Da riprovare su un capitolo
  vero prima di cancellare: `aspetta che [è arrivato X]` ora esiste e
  ricorda anche un segnale arrivato prima (`Unita.senti`,
  `domande/sentito.js`). Restano:
  - **non si può dire «sono arrivato»**: servono sempre `vai` + `suona` (la
    voce più frequente);
  - `aspetta di vedere [fazione]` non distingue *chi*; un segnale non porta
    niente con sé; un `quando senti` armato dopo che il segnale è partito
    non lo sente;
  - **contro-attrito**: chi va verso una porta chiusa aspetta da solo 25
    battiti (`aspettando`, `quanto = 25` in
    `src/motore/generale/azioni/azione.js`). Toglie il bisogno del segnale,
    ed è un numero invisibile su cui un livello finisce per tararsi. La
    lezione dei segnali va difesa dal motore.
- **B. Le cose (3).** Una condizione non può guardare una cosa, solo
  un'unità (`domande/vedi.js`): «non vedi [la lanterna]» si scrive «non
  vedi [chi la porta]», e il piano dice altro dal racconto.
- **C. Attaccare (3).** Chi insegue alla stessa velocità non prende mai
  nessuno. `verifiche: { senza: [...] }` toglie ordini che *nominano* una
  cosa, non che usano un verbo: `senza: ['attacca']` non si può dichiarare.
- **D. Il tempo (3).** Non c'è un orologio né la velocità: la *resistenza*
  («tieni fino all'alba») è sei righe, la lentezza è una posa raccontata, una
  scadenza si tara ridisegnando la mappa. C'è la domanda `passati` (conta i
  battiti, `fai.aspettaUnPo`): da provare come orologio in `vince`.
- **E. Chi è fatto come (3).** Nessuna taglia (il carro passa dove passa
  la capra), niente «di qui passa solo il topo»; «dorme» non esiste (si
  mima con `vista: 1`).
- **F. Obiettivi (3).** `grida` non distingue chi ha visto (`gridaSe` in
  `mondo.js`).
- **H. Regole non dichiarate.** L'ordine di `unita` nell'array decide chi
  agisce, e quindi colpisce e viene visto, per primo (`passo()` in
  `src/motore/generale/partita.js`; i messaggi invece si consegnano dopo);
  due fili sulla stessa unità la fanno agire due volte per battito; una
  guardia che grida e una che accorre non possono essere la stessa — si
  trascinano a vicenda e il livello si vince da fermi. Da riverificare le
  ultime due prima di scriverci sopra un livello.

## Design rimandato

- **I fatti che passano fra capitoli**: non un inventario ma un insieme di
  fatti che un capitolo vinto lascia, e se un fatto manca il capitolo si
  adatta invece di bloccarsi; con **il grafo delle storie** a diamante. La
  forma era decisa; si riprende con le storie nuove (il posto nel profilo,
  `storie`, è stato tolto).
- **PvP**, due autori umani: `fazioni.*.autore` non lo preclude.

## Da guardare col dito, dopo una build

- **La mappa che si trascina mentre si mira**: sotto la soglia mira, sopra
  trascina; in mira la soglia è 16 invece di 9 (`SOGLIA_MIRA` in
  `CampoLivello.vue`) perché mirare col dito trema. Provato dai test, mai
  giocato: un gesto si giudica toccandolo.
