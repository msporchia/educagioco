# Il mondo aperto: il progetto

**Una proposta, non ancora decisa né costruita.** La terra di sopra del Sotterraneo 3D diventa un mondo grande generato da
un seme, alla Diablo: si parte da una città al centro, le regioni salgono di livello man mano che ci si allontana, i
confini si leggono (fiumi, creste, ponti, valichi), più città si collegano con pietre del viaggio, e nelle regioni
si trovano dungeon in cui entrare. La direzione è dell'utente (16 ottobre 2026): *«ridisegnare la mappa usando questo
sistema, rinominare i dungeon e sfruttare a pieno le potenzialità senza limitarci a come eravamo messi prima»*. Parte dal
prototipo `poc/mondo-sopra` ([../../poc/mondo-sopra.md](../../poc/mondo-sopra.md)) e dal Sotterraneo 3D in prova
(ramo `worktree-agent-a4eaa3fe3a5843957`, `docs/sotterraneo/grafica-3d.md` di quel ramo).

Le quest e la storia: [mondo-aperto-quest.md](mondo-aperto-quest.md). I dati e il travaso:
[mondo-aperto-dati.md](mondo-aperto-dati.md). Il 3D, gli oggetti modellati, le fasi, i test e i rischi:
[mondo-aperto-fasi.md](mondo-aperto-fasi.md). Le scelte non ovvie sono segnate **da decidere**, con la
raccomandazione e il perché.

- **Nasce nel Sotterraneo 3D**, il gioco in prova; il Sotterraneo di sempre (2D, mappa dipinta, discese in fila) resta
  com'è finché non si decide altro.
- **Le regole del sotterraneo non cambiano**: ogni cosa costa una risposta, la domanda è quella di oggi (`quiz/scelta.js`
  col `dif` del posto), nessuna risposta sbagliata paga, l'età non chiude i posti (solo la storia).

## 1. La struttura del mondo

### Anelli, regioni, confini

- **Una griglia di 5×5 regioni**, ognuna di circa 32×28 celle (oggi il prototipo ha 3×3 regioni su 112×88): il mondo
  è **160×140 celle**, 2,3 volte il prototipo e sette volte la terra dipinta (64×48). Le regioni restano «centro più
  vicino più rumore a macchie», come in `aperta.js` e nel prototipo: i confini serpeggiano.
- **Gli anelli sono la distanza dalla città di mezzo** (la distanza a scacchiera nella griglia): l'anello 0 è il
  villaggio, l'anello 1 sono le **otto terre vicine**, l'anello 2 le **sedici delle marche**, divise in quattro marche
  di quattro regioni (nord, est, sud, ovest), ognuna col suo carattere. Il livello sale con l'anello, quindi
  allontanarsi è salire: la regola «alla Diablo» in una riga.
- **Ogni confine si vede**: fra due regioni dello stesso anello un fiume o una cresta (come nel prototipo); **fra due
  anelli sempre un confine che si passa in pochi punti** (ponti e valichi), così il salto di livello ha una porta e la
  si riconosce. Una regione si annuncia entrando: una riga in fondo col nome, la fascia e il colore per quell'eroe
  (lo stesso conto del pallino, [zone.md](zone.md#il-pallino-e-la-sentinella)), come nelle terre selvagge.
- **Le regioni hanno mostri**, le città no. Una regione è una stanza grande del motore (`dentro`, `stanzaDi`: i mostri
  non ne escono), a branchi sparsi, con le tane dei caporali: il motore aperto delle terre selvagge
  (`motore/aperta.js`, ramo `terre-selvagge`). **Da decidere**: mostri anche sopra (raccomandato: senza, le fasce
  degli anelli non vogliono dire niente e il mondo è una mappa da attraversare) o un mondo sicuro con i mostri solo nei
  dungeon (costa una fase in meno, [mondo-aperto-fasi.md](mondo-aperto-fasi.md)).

| anello | regioni | fascia dei mostri di sopra | cosa c'è | età (`portata`) |
|---|---|---|---|---|
| 0 | il villaggio | nessuno | i mercanti, il minatore, la pietra del viaggio | sempre aperto |
| 1 | otto terre vicine | 1–6 | quattro dungeon della storia, gli antri | la più bassa dei suoi dungeon |
| 2 | sedici, in quattro marche | 6–13 | tre dungeon della storia, l'abisso, due città, gli antri | la più bassa dei dungeon della marca |

- **La fascia di una regione segue il dungeon della storia che ci sta**: un livello sotto quello atteso
  (`LIVELLI_ATTESI` di oggi: 1 · 2 · 3 · 5 · 7 · 8 · 10 · 12), perché sopra si cammina verso il dungeon e lo si trova
  un poco più facile; le regioni senza dungeon stanno a metà fra le vicine. Il `dif` di una regione è l'inizio di quello
  del suo dungeon. Sono numeri da misurare col banco, non da credere (sotto, «Cosa va ricalibrato»).
- **L'età non chiude passaggi**: si aprono solo per la storia (se ha finito le discese prima può andare anche oltre).

### Le città

Tre città, una per lato del viaggio: si torna sempre a una città vicina, mai al centro dall'altra parte del mondo.

| città | dove | chi ci sta | serve |
|---|---|---|---|
| **Il villaggio** | al centro, anello 0 | fabbro, guaritrice, incantatrice, mercante, minatore, la ragazza del pozzo | le terre vicine |
| **Il forte del guado** | fra la marca del sud e quella dell'ovest, all'ingresso | fabbro, guaritrice, il capitano | le marche del sud e dell'ovest |
| **Il rifugio del passo** | sul valico fra la marca del nord e quella dell'est | guaritrice, incantatrice, mercante, il vecchio minatore (ci sale dopo la sesta porta) | le marche del nord e dell'est |

- **I banchi sono per mercante, non per città**: il fabbro del forte è lo stesso `armaiolo` del villaggio, con lo
  stesso banco (`botteghe.banchi[armaiolo]`). Così il salvataggio della bottega non cambia, e comprare in due città
  non raddoppia l'offerta. **Da decidere**: un fabbro diverso, col suo banco (più Diablo, ma un campo nuovo e una
  taratura della bottega).
- **In ogni città qualcuno cura gratis** chi è salito dal portale ([chi-cura.md](chi-cura.md)): la guaritrice dove
  c'è, se no la fontana della piazza (una cosa di scena modellata, che cura come lei).
- **Il portale gemello sta nella città che serve quel dungeon**: si sale dal portale di un dungeon delle marche del sud e
  si sbuca al forte, non al villaggio. Ogni città ha il suo `PORTALE` (`piede`, `accanto`).

### Le pietre del viaggio

- **Una pietra in ogni città e una davanti a ogni dungeon della storia** (undici in tutto): un cerchio di sassi con
  la runa che si accende, modellato in codice. Toccata una pietra accesa si sceglie dove andare fra quelle accese; il
  viaggio è immediato.
- **Si accende la prima volta con una domanda**, come una fonte; sbagliando resta spenta e si riprova (come il
  forziere d'oro delle missioni: niente si brucia). Viaggiare poi è gratis. Il perché: «ogni cosa costa una risposta», e
  una pietra accesa è una scorciatoia che si guadagna una volta. **Da decidere**: accenderla gratis toccandola (meno
  domande, ma la pietra non vale niente).
- **La veduta dall'alto mostra le pietre accese** e un tocco su una pietra nella veduta è il viaggio, se l'eroe sta
  accanto a una pietra; se no la veduta dice «vai a una pietra».

### Il centro e la partenza

- **Si parte nel villaggio**, sulla piazza, come oggi; l'eroe nuovo vede il villaggio e il primo tratto della strada
  verso il primo dungeon. La strada dei campi porta al primo ponte: il primo dungeon sta nell'anello 1, vicino.
- **Il cartello all'incrocio** resta, una freccia per ogni ponte del villaggio, coi nomi dei posti già trovati.

### Il seme e cosa cambia

- **La mappa non cambia mai** (`MAPPA.seme` fisso, scelto guardando la pianta con `npm run pianta -- --mondo`): la mappa
  si impara, come nelle terre selvagge. Terreno, fiumi, ponti, città, dungeon, pietre, strade e decoro sono sempre gli
  stessi.
- **Cambia quello che vive sopra**: i mostri, le casse, le gemme per terra, gli antri aperti. Il seme del contenuto è
  `(eroe, giro)`, dove il **giro** sale ogni volta che si entra in una città: Diablo rifà il mondo a ogni partita, qui lo
  rifà a ogni ritorno. Il conto è in passi e ritorni, mai in ore: il telefono posato non fa girare il mondo
  ([../core/interfaccia.md](../core/interfaccia.md)).
- **Il generatore gira all'avvio** (puro, ~0,3 s stimati per 160×140, misurare) e un test confronta la firma della
  pianta: chi cambia il rumore lo vede rosso, e sa che invalida le nebbie salvate. **Da decidere**: generarlo a tempo di
  build in un file (`dati/mondo-mappa.js`, `npm run mondo`, il test della firma come per la taratura): più sicuro, ma
  ~100 KB di dati nel file unico.

### Come cresce

- **Il mondo è intero dal primo giorno**, ma i passaggi fra gli anelli si aprono con la storia: il ponte verso le
  marche del sud e dell'ovest si alza quando si batte il grosso del quarto dungeon, il valico del nord quando si batte
  quello del sesto (le chiuse dicono cosa le apre: «Si apre quando batti Zannaverde»). Un passaggio chiuso è una grata
  calata, modellata, non un muro invisibile.
- **Regioni nuove si aggiungono fuori** (un anello 3, una marca del mare) cambiando la griglia: cambia la firma, e le
  nebbie salvate si allargano con lo stesso trucco di `LARGHEZZE_VECCHIE` (il vecchio codice si rimette dentro e il
  nuovo è nebbia). La regola: si aggiunge solo fuori, mai in mezzo.

## 2. I dungeon

### I sette della storia, l'abisso, le terre selvagge

- **Le chiavi non cambiano** (`altare`, `cantine`, …): sono gli indici della campagna (`profile.campagne.sotterraneo`,
  [../apprendimento/eta-e-portata.md](../apprendimento/eta-e-portata.md)), i requisiti delle missioni, le soste. Cambiano
  il `nome`, la `dritta`, `dove`, le frasi del minatore (`LUOGHI`) e i volti delle zone.
- **La regola dei nomi**: «*il posto* + *chi ci abita o cosa c'è*», in parole che un bambino conosce, e che reggono in
  mezzo a una frase («sotto la torre bruciata non duri»). Il nome dice l'interno (l'ambientazione,
  [ambientazioni.md](ambientazioni.md)), non il disegno di sopra, che adesso è un monumento modellato e può cambiare.
  Niente nome del grosso nel nome: il grosso è la sorpresa in fondo.
- **L'ordine resta quello della fila**: dungeon k più lontano dalla partenza del dungeon k−1 (lo controlla il test,
  come oggi `unita/sotterraneo-terra`), ma non più tutti su una strada: girano attorno al centro.

| # | chiave | oggi | nome nuovo | regione (anello) | il monumento di sopra |
|---|---|---|---|---|---|
| 0 | `altare` | La cripta dell'altare | **La cripta dei re** | il cimitero vecchio (1, nord-ovest) | l'altare fra le colonne |
| 1 | `cantine` | La scalinata antica | **Le cantine dei goblin** | il colle delle rovine (1, nord-est) | l'arco con la grata |
| 2 | `torre` | La torre in rovina | **La torre bruciata** | la brughiera (1, est) | la torre con la cima rotta |
| 3 | `gallerie` | La grotta della scaletta | **La tana dei ragni** | il bosco vecchio (1, sud-ovest) | la bocca della grotta fra le radici |
| 4 | `cisterna` | La scala sommersa | **Le sale allagate** | la palude (2, marca del sud) | la scala che scende nel lago |
| 5 | `labirinto` | La botola segreta | **La porta dell'inferno** | la piana delle ceneri (2, marca dell'ovest) | la botola nel telaio, che fuma |
| 6 | `fondo` | La miniera abbandonata | **Le miniere di brace** | il monte (2, marca del nord) | la miniera coi binari |
| — | abisso | il pozzo vecchio | **Il pozzo senza fondo** | la landa vecchia (2, marca dell'est) | il pozzo col tetto d'ardesia |
| — | terre selvagge | il cancello | **le marche stesse** | anello 2 | (nessuno: ci si cammina) |

- **Le terre selvagge non sono più un posto dove entrare: sono le marche.** Le loro sei regioni (l'accampamento, il
  bosco secco, le rovine del guado, le colline di roccia, la gola dei venti, la vetta dei troll, con i loro abitanti e
  caporali) diventano sei delle sedici regioni dell'anello 2; il generatore, lo scontro del solo branco, l'inseguimento
  che si ferma e la luce a cerchio vengono da lì ([mondo-aperto-fasi.md](mondo-aperto-fasi.md)). I moduli dei ponti
  dipinti del ramo no: i ponti sono modellati.
- **Le dieci regioni che mancano** (le otto vicine e due delle marche) vogliono abitanti di superficie: il catalogo
  ne ha pochi (goblin, lupo, cinghiale, ragno, vespone, scorpione, serpente…) e le terre selvagge lo dicevano già
  («servirebbe un foglio di creature d'aperta campagna»). Sopra una creatura può stare in più regioni (la regola delle
  terre selvagge); nei dungeon resta in un posto solo.
- **I volti delle zone** (`VOLTI` in `dati/zone.js`, tre per zona) vanno riscritti coi nomi nuovi: «Gli orchi hanno preso
  la scalinata antica» nomina il nome di prima.

### Gli antri: i dungeon che si trovano

Fra un dungeon della storia e l'altro, **ogni regione ha da uno a tre ingressi piccoli** (grotte, cantine di una casa
crollata, una tomba aperta): gli **antri**, dove entrare «per trovare qualcosa di interessante».

- **Un antro è corto**: uno o due piani, l'ambientazione e gli abitanti della sua regione, la fascia della regione,
  un forziere in fondo con il caporale della regione davanti. Si fa in cinque minuti, e rende come cinque minuti di
  regione più il forziere. Non è una tappa: ha un indice suo come l'abisso (−1) e le terre selvagge (−2), con il posto
  nella sosta (`antro: <id>`).
- **Gli ingressi sono sempre gli stessi, aperti a rotazione**: a ogni giro una parte è aperta (la porta modellata è
  su, la grata alzata) e una chiusa, scelta dal seme del giro. Tornare in città cambia quali: un motivo per rigirare il
  mondo noto. **Da decidere**: tutti sempre aperti (più semplice, meno sorpresa).
- **Ogni antro può avere uno di questi**, scelto dal seme: un mostro col nome (il caporale con la corona), un forziere
  chiuso che vuole la **chiave** caduta a un caporale della regione, il pezzo per una missione, una **mappa del
  tesoro** (che dice dov'è una buca nella regione: [mondo-aperto-quest.md](mondo-aperto-quest.md)). Un antro di livello
  verde mostra il pallino come i dungeon.
- **I Tesori** (i leggendari, [rarita.md](rarita.md)) possono avere un antro loro, sempre lo stesso, che si apre con
  una chiave rara: è il posto dove un bambino sa che c'è *quel* pezzo. Non toccano la tabella della storia.

### Grossi, caporali, bottino

- **I grossi restano in fondo ai sette** ([grossi.md](grossi.md)), con i loro pezzi col nome nella roba attesa. Il
  quinto piano dell'abisso, idem.
- **Ogni regione ha il suo signore**: il caporale della regione, col nome e la corona, nella tana al centro (come le
  tane delle terre selvagge). Lascia un raro della fascia. Non è roba attesa: la tabella della storia non lo conta.
- **Finita la storia, i sette diventano le zone di oggi** ([zone.md](zone.md)): le fasce che ruotano, la sentinella, la
  notizia del minatore, tutto `motore/zone.js` com'è. **Le regioni di sopra restano ferme** (diventano grigie) e l'abisso
  resta la sfida del primato. Gli antri dopo la storia prendono la fascia della zona verde più vicina per l'eroe, così
  anche girando il mondo noto si trova qualcosa a misura. **Da decidere**: far ruotare anche le regioni come zone
  (undici zone invece di sette: il conto di «due grigie, due verdi, due arancio, una rossa» non regge più, e si
  ritarano le zone).

### Cosa va ricalibrato (non qui)

Il lavoro si segnala, non si fa in questo progetto: `npm run taratura`, `npm run sotterraneo` e `test:misure` misurano
la storia in fila, e **il mondo aperto cambia la progressione**.

- **L'esperienza e le gemme di sopra**: chi attraversa le regioni per arrivare a un dungeon arriva più alto di livello e
  più ricco di oggi. La tabella della storia ([la-grande-storia.md](la-grande-storia.md)) e i giocatori tipo
  ([giocatori-tipo.md](giocatori-tipo.md)) vanno rifatti con il curioso che gira le regioni.
- **Le fasce delle regioni e degli antri**, la `forza` e la `spinta` dei mostri di superficie (oggi la curva delle zone,
  pensata per i dungeon), i branchi aperti (le terre selvagge non sono mai state misurate col banco).
- **Il bottino degli antri e dei signori**, le chiavi, le mappe del tesoro e le ricompense delle quest
  ([mondo-aperto-quest.md](mondo-aperto-quest.md)).
- **Il conto delle domande per seduta** (il tetto di 85 di oggi): una regione più un dungeon è più lunga di un dungeon.

## 3. Da oggi al mondo aperto

| oggi | nel mondo aperto |
|---|---|
| le discese in fila per strada | i sette nello stesso ordine, ma attorno al centro e anello per anello |
| le zone a fine storia | identiche (`motore/zone.js`): i sette ruotano, le regioni restano ferme |
| l'abisso | uguale, nel pozzo della landa vecchia, il posto più lontano |
| le terre selvagge (ramo) | sono l'anello 2: il generatore e lo scontro del branco passano al mondo |
| svenire e tornare su | in un dungeon come oggi; sopra ci si risveglia nell'ultima città o pietra toccata, con metà delle gemme e le tasche vuote, e nessun tetto agli svenimenti (non c'è una tappa da perdere). **Da decidere** |
| il portale gemello | nella città che serve quel dungeon |
| la scala che sale, «lascio perdere» | uguali; «lascio perdere» riporta all'ingresso del dungeon, non al villaggio |
| la sosta e la ripresa | quella del dungeon com'è; in più la superficie lasciata con la ✕ si riprende lì (il posto e i mostri della regione) |
| le missioni | le stesse diciassette, con gli stessi id, più le nuove: [mondo-aperto-quest.md](mondo-aperto-quest.md) |
| la nebbia salvata | una nebbia nuova per il mondo, salvata allo stesso modo |
| i mercanti | divisi fra tre città, i banchi per mercante come oggi |
| il minatore e il cartello | il minatore parla della storia nella città dove sta; il cartello in ogni città |
| le icone delle discese (ritagli dalla mappa dipinta) | il monumento fotografato in 3D: [mondo-aperto-fasi.md](mondo-aperto-fasi.md) |

- **Si riusa tale e quale**: `motore/terra.js` (`creaTerra`: l'A* e la lisciatura prendono una maschera di qualunque
  misura; `scopri`, `nebbiaInCodice`, `nebbiaDaCodice`), `motore/corsa.js` e `motore/livello.js` per i dungeon e gli
  antri, `motore/zone.js`, `motore/storia.js`, `motore/missioni.js` (con gli agganci nuovi), `motore/sosta.js`, la
  bottega, i dialoghi, la barra, la scena 3D delle discese.
- **Si porta dal ramo `terre-selvagge`**: `motore/aperta.js` (regioni, fiumi, creste, valichi, la luce a cerchio, lo
  scontro del solo branco) e i suoi agganci in `corsa.js`, `livello.js`, `scontro.js`, `sosta.js`.
- **Si porta dal prototipo**: `generatore.js` (con le regioni a ruolo, i ponti modellati, i lotti, le strade, la quota),
  `strada.js` assorbito da `motore/terra.js`, il kit, i monumenti, la natura, le trame.
- **Si riscrive**: la vista della terra di sopra (`viste/Terra.vue` è DOM e immagine; il 3D ne fa una sua accanto),
  `dati/terra.js` (`POSTO_DI`, `LUOGHI`, `FRECCE` sulla geografia nuova), `dati/terra-mappa.js` (non più generato dal
  foglietto dipinto ma dal generatore), le frasi della storia e dei volti.

## 4. I dati e il salvataggio

In [mondo-aperto-dati.md](mondo-aperto-dati.md): il campo `mondo` nell'avventura (nessun campo nel profilo), la nebbia
in base64 (3,7 KB per 160×140 celle), il 3D separato dal 2D mentre è in prova (raccomandato), e la tabella del travaso
per il giorno che il mondo sostituisce la mappa dipinta.

Nei test (da scrivere): `unita/sotterraneo-mondo` (la pianta, la firma, gli anelli, le città, le pietre, i dungeon in
fila); il resto in [mondo-aperto-fasi.md](mondo-aperto-fasi.md#i-test).
