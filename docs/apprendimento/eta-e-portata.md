# L'età: cosa si offre a chi

Come l'età di un bambino decide quali giochi ha in casa (le partenze) e da
che tappa comincia una campagna (la portata). La manopola dell'età e il
quadro che la mostra ai grandi stanno in
[../genitori/manopola.md](../genitori/manopola.md);
le domande di quiz hanno la loro scala in [quiz-livelli.md](quiz-livelli.md).

## Le partenze per età

`src/data/partenze.js` ha quattro fasce, e sono **una conseguenza
dell'età** (`settings.eta`, in anni): `partenzaPerEta` prende la più vicina,
e a pari distanza la più piccola (si sbaglia per difetto, che si corregge
giocando).

| fascia | `anni` | giochi | saperi |
|---|---|---|---|
| `piccoli` — non va a scuola | 5 | solo i `piccoli` e i `posto` (`soloPiccoli`) | quasi tutto spento |
| `prima` — prima o seconda | 6,5 | tutti tranne i `grandi` (`nienteGrandi`) | niente tabelline, misure, testi lunghi |
| `terza` — terza elementare | 8 | tutti tranne i `piccoli` (`nientePiccoli`) | moltiplicazioni sì, divisioni no |
| `quarta` — quarta o quinta | 9,5 | tutti tranne i `piccoli` | nessuno spento |

- **Sono eccezioni scritte una volta**, alla creazione (`creaGiocatore`),
  non una modalità che resta: dopo si tocca tutto a mano.
- **Un gioco che il profilo non nomina vale quello che la partenza di
  quell'età scriverebbe oggi** (`spentoDallEta` in `data/portata-giochi.js`,
  `eccezioniPerEta`): si rilegge ogni volta, così un gioco nuovo arriva a
  tutti come dice l'età. Provato il contrario (assenza = acceso): due
  bambini della stessa età avevano due home diverse secondo il giorno in
  cui erano nati.
- **I giochi si calcolano, i saperi si elencano**: i giochi escono dai
  flag del manifesto, i saperi sono scritti per fascia con un verdetto su
  ognuno (vedi [saperi.md](saperi.md) e
  [saperi-per-fascia.md](saperi-per-fascia.md)). Le materie di `saperi.js`
  raggruppano la schermata, non dicono in che anno si imparano.
- Si chiede al primo avvio e a ogni bambino aggiunto (`components/Benvenuto.vue`);
  la manopola nasce sui **quattro anni**, perché premere senza leggere
  deve sbagliare dalla parte prudente.

### Le quattro dichiarazioni del manifesto

- **`piccoli: true`** — non chiede di leggere e non si può perdere.
- **`grandi: true`** — dà per scontato che legga da solo, o la matematica
  delle classi alte. Nessun gioco è tutte e due.
- **`posto: true`** — non sta sulla scala (la fattoria: un prato dove si
  spende): non si spegne mai per età, in nessuna direzione. Dichiararsi
  `piccoli` lo farebbe sparire a nove anni.
- **`cresce: true`** accanto a `piccoli` — comincia dai piccoli e non
  finisce lì (Passo passo): le fasce dei grandi non lo spengono, fin dove
  arriva lo dice la portata.

Chi non dichiara niente sta in mezzo: acceso per tutti tranne i
piccolissimi. Nessun elenco da mantenere a mano.

### La portata non sostituisce `piccoli`

Sono due assi: la portata dice *quanto è difficile* il contenuto, `piccoli`
dice *non chiede di leggere e non si può perdere*. «dog» è facile e a cinque
anni non si sa leggere; Survivors sta nella portata di un bambino di cinque
anni e si perde. Misurato: `restaQualcosa` chiede se esiste *una* tappa
nella mira, e una campagna lunga ne ha sempre una — senza i flag a cinque
anni comparirebbero English, Spagnolo, Asteroidi e Survivors.
Nell'altro verso la portata basta quasi sempre: sopra i sette anni «Conta
gli animali» sparisce da sé. Le partenze scrivono alla creazione, la
portata filtra in continuo, e non si contraddicono.

## La portata delle tappe

Ogni tappa di ogni campagna porta **`portata`**, sulla stessa scala 0–100
delle domande (0 = quattro anni, 100 = dodici, 12,5 punti per anno). Il
conto sta in `src/data/portata.js`, il ponte coi giochi in
`src/data/portata-giochi.js` (`TAPPE_DEL_GIOCO`, `giocoDaVedere`,
`apertaQui`). Il caso che l'ha fatta nascere: a nove anni «2×2» non ha
senso, a sei «7×8» nemmeno, a otto vanno bene tutti e due.

- **Si chiama `portata` e non `livello`** perché una tappa del Dungeon
  (tolto il 6 ottobre 2026) aveva già `livello`, la potenza a cui si
  scendeva: scriverci 0–100 non dava errori, rendeva solo i mostri
  imbattibili. Un nome nuovo si cerca **anche nei motori**.
- **La larghezza è la mira, non l'ammissione** (`miraDi`: un anno sotto,
  un anno e mezzo sopra; a otto anni `[38, 69]`). Nei quiz il taglio largo
  è ammorbidito dalla campana (`pesoDi`); in una campagna non c'è un «2%
  delle volte», c'è una fila che si macina tutta. Con l'ammissione (a nove
  anni `[18,5–87,5]`) la tabellina del 2, a 40, resterebbe dentro.
- **Nessuna tappa esce mai dalla fila**: cambia il cancello
  (`statoDellaTappa`). `PASSATA` sotto (nasce aperta: «l'hai già
  passato»), `IN_PORTATA`, `AVANTI` sopra (chiusa, «arriva più avanti»,
  non «campagna finita»). `profile.campagne[<chiave>]` è un indice, e una
  fila accorciata in testa sposterebbe l'avanzamento di tutti.
- **Per merito** (`perMerito: true` nel manifesto): `AVANTI` non ferma chi
  ci arriva vincendo la tappa prima. L'età decide ancora se la carta si
  offre in home. Oggi lo dice solo il costruttore.
- **La testa si taglia solo a quello che la scuola ha già dato**: la
  tappa dichiara `scuola: '<chiave di data/saperi.js>'`, e chi non la
  dichiara non si taglia mai in testa (`dog` a dieci anni serve: nessuna
  scuola gliel'ha dato).
- **Un sapere spento fa tornare la testa**: se un grande ha tolto le
  moltiplicazioni, quelle tappe servono di nuovo.
- **Un gioco cominciato non sparisce mai**: `giaProvato()` legge
  `albo.provato`. La portata decide cosa si offre a chi arriva, non cosa si
  toglie a chi c'è.
- **I giochi senza campagna** (la fattoria) non si giudicano: l'assenza
  vuol dire «non si giudica», non «si nasconde».
- **L'inglese a mondi ha la portata dall'anno di scuola** (un mondo per
  anno, dalla prima, più uno dopo con anno 6): nessuno la scrive a mano, e decide solo se la carta
  si offre. Dentro il gioco l'età non apre mondi, si comincia dalla prima:
  il perché sta in
  [../lingue/mondi.md](../lingue/mondi.md#un-mondo-per-anno-di-scuola).

Nei test: `unita/portata`, `unita/partenze`.
