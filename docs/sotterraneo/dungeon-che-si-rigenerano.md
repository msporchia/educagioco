# I dungeon che si rigenerano

Il compito C del [mondo a percorso](mondo-a-percorso.md) ([i lavori](mondo-a-percorso-lavori.md), compito C),
**solo del Sotterraneo 3D**. L'utente, 20 ottobre 2026: «i dungeon sono legati alla forza di quella zona, sono in genere un po' più
forti dei mostri di quella zona e hanno ognuno il suo boss; ogni volta che li ripulisci […] si rigenerano con un'altra forma, altri
mostri ecc. (sempre stessa zona, stessa cosa), quindi in una zona puoi avere più dungeon». Per i sei nuovi «usa quello che puoi»:
paesaggi, abitanti e boss che ci sono già; i numeri si tarano dopo.

Il codice: `dati/dungeon-del-mondo.js` (le zone, i livelli, i sei nuovi, le leve da tarare), `motore/rigenera.js` (le regole, pure),
`dati/zone.js` (`VOLTI` dei sei), `dati/grossi.js` e `dati/pezzi.js` (i sei grossi e i loro pezzi), `motore/sosta.js` (la sosta per
chiave), `Gioco.vue` (scendere, riprendere, chiudere).

## Le regole

- **Ripulito vuol dire**: battuto il grosso e usciti dalla scala dell'ultimo piano (la discesa è `vinta`; la chiave dell'ultima
  scala ce l'ha il grosso). Salire dal portale lascia la sosta e si ritrova tutto com'era; lasciar perdere, svenire, uscire con la
  ✕ ritrovano **la stessa forma**, coi mostri tornati. Nessuno dei tre conta.
- **Il seme è fisso finché non lo si ripulisce**: `(eroe, chiave, rifatti, terra)`. Nel 2D il seme è a caso a ogni entrata, come
  sempre. `#seme=` vince su tutti e due (le prove).
- **Ripulito, rientrando è un altro**: un altro seme (un'altra forma dei piani), altri abitanti, il volto nuovo (nome, dritta,
  annuncio) e lo stesso grosso, la stessa zona, lo stesso paesaggio, lo stesso livello.
- **La storia resta la prima volta**: la prima ripulitura di una delle sette è il capitolo (stelle, `completa`, medaglie,
  `XP_AREA`), come oggi. Dopo, è una **ripetuta**: una tappa con la `potenza` come una zona di [zone.md](zone.md) (il bottino come
  l'abisso, niente stelle né storia), esperienza e gemme come sempre. Nessuna risposta sbagliata paga mai.
- **I sei nuovi non hanno indice**: non toccano `tappa`, le stelle né le medaglie; sono ripetute da subito e aperti da subito.
- **Nel 3D le zone non rinascono**: la ripetuta di una porta finita ha il livello del dungeon, non la fascia di [zone.md](zone.md);
  il minatore non ha la notizia della zona rinata (`notizia` è null nel 3D). Il 2D ha le zone come prima.
- **La sentinella resta**: un dungeon rosso per la forza dell'eroe (`coloreDellaFascia` sul livello del dungeon) non si scende,
  come oggi. Se debba restare nel 3D lo decide chi fa il mondo (compito D).

## I tredici dungeon

| zona | dungeon | chiave | livello | paesaggio | il grosso | la creatura | abitanti della prima forma / caporale |
|---|---|---|---|---|---|---|---|
| 1 | La cripta dei re | `altare` | 1 | cripta | Re Ossuto | negromante | come oggi |
| 1 | Le cantine dei goblin | `cantine` | 2 | cantine | Grumo | orco | come oggi |
| 2 | La torre bruciata | `torre` | 4 | fornace | Fiammetta | spirito di fuoco | come oggi |
| 2 | La tana dei ragni | `gallerie` | 5 | grotta | Zannaverde | ragno | come oggi |
| 3 | **Il cerchio di pietre** | `cerchio` | 6 | cripta | **Roccaverde** | golem di muschio | serpente, vespa, occhio / lupo |
| 3 | **Il pozzo dei corvi** | `corvaia` | 7 | grotta | **Piumanera** | grifone | pipistrello, pipistrello con l'occhio, goblin / drago |
| 4 | Le sale allagate | `cisterna` | 8 | tempio | Gorgo | polpo | come oggi |
| 4 | **La palafitta** | `palafitta` | 9 | palude | **Sibilla** | serpente | melma, fungo, piranha / mostro verde |
| 5 | La porta dell'inferno | `labirinto` | 10 | inferno | Minotto | bestia cornuta | come oggi |
| 5 | **La fornace** | `fornace` | 11 | fornace | **Vulcanor** | golem di magma | diavoletto, spirito di fuoco, bestia cornuta / drago di lava |
| 6 | Le miniere di brace | `fondo` | 12 | miniera | Carbonchio | drago di lava | come oggi |
| 6 | **La cava gelata** | `cava` | 13 | ghiaccio | **Gelomagno** | golem di ghiaccio | golem di pietra, pipistrello, lupo / troll |
| 7 | **Le tombe del vento** | `tombe` | 15 | tempio | **Falcenera** | mietitore | mummia, ombra, teschio azzurro / negromante |

- **Le chiavi e i nomi** sono quelli di [mondo-a-percorso.md](mondo-a-percorso.md#i-dungeon); i **nomi dei sei grossi** li ho scelti
  io sul calco dei sette (una parola sola, giocosa, che dice la creatura: Roccaverde, Piumanera, Sibilla, Vulcanor, Gelomagno,
  Falcenera), da confermare. Le chiavi si salvano (`mondo.dungeon`, la sosta, le missioni): non si rinominano. `fornace` è anche
  il nome di uno scenario, di un paesaggio e di un'abilità del nano: sono campi diversi (nessuno legge `PAESAGGI[tappa.chiave]`).
- **Il livello** è quello dei mostri della zona dove sta, più uno (`LIVELLO_DEL_DUNGEON`); nelle terre dopo `+14` a terra
  (`livelloDelDungeon(chiave, terra)`). Il pozzo senza fondo (l'abisso) non ha forma né livello: resta com'è.
- **I sei nuovi** sono tre piani (`PIANI_DEI_NUOVI`), con la forma dei piani scritta nella tappa (`DUNGEON_NUOVI`); i sette ripetuti
  hanno i piani delle zone (cinque, sei nella tana).
- **I sei grossi** riusano quello che c'è: una creatura del bestiario ingrandita con la corona (`figura`, come i sette), le basi e
  i numeri dei sette (il troll fino al 9, il gigante dopo, ossa 1,1–1,2), le difese della creatura che vestono. I loro pezzi col nome
  hanno **una figura dei fogli che c'è già** (`figura` in `DEI_GROSSI`, un aspetto della base: [figure.md](figure.md)), finché la
  loro non è ritagliata: lo Scudo di Roccaverde (`scudo-08`), il Medaglione di Piumanera (`amuleto-21`), la Giubba di Sibilla
  (`veste-08`), lo Scudo di Vulcanor (`scudo-53`), l'Amuleto di Gelomagno (`amuleto-28`), lo Scudo di Falcenera (`scudo-38`). Basi
  senza famiglia: li porta chiunque.

## Gli abitanti di una rigenerazione

- **Il mazzo della zona** (`mazzoDellaZona`): gli abitanti dei dungeon della zona (la loro prima forma) e quelli di sopra dei
  suoi luoghi (`ABITANTI_DI_SOPRA`), a parte i caporali; mai un capo. I luoghi delle terre selvagge (le rovine, l'accampamento, il
  bosco secco, le colline, la gola, la vetta) non danno niente finché i loro abitanti stanno nella scheda del generatore.
- **La prima volta** (`rifatti` 0) gli abitanti di sempre; poi **tre del mazzo**, con almeno uno di quelli di sempre (il tema
  resta: nella tana c'è sempre qualcuno della tana), che costano uguale (`guastiDegliAbitanti`), in un ordine che dipende da
  eroe, dungeon e terra: mai la terna di sempre, mai due volte di fila la stessa. Il caporale gira fra quelli della zona,
  cominciando dal suo e saltando chi sta per strada.
- **«Una creatura in una zona sola»** (la proposta 5 del progetto): nei sei nuovi la regola di [mostri.md](mostri.md) «in un posto
  solo» diventa «nella sua zona»; `postiDelleCreature` resta quella dei sette e dell'abisso, e il 2D non cambia.
- **Il volto** della volta `rifatti` è `VOLTI[chiave][(rifatti + terra − 1) % 3]`: per i sette quelli delle zone di oggi, per i sei
  il primo è il dungeon com'è e gli altri due le sue rigenerazioni.

## I numeri, e cosa va tarato

Sotto il 12 la forza, la spinta e le domande vanno in linea retta fra le discese della storia ai loro livelli (`CAMPAGNA`: la cripta
all'1, la miniera al 10), dal 12 la curva delle zone (`forzaDellaZona`, con la forma della zona per i sette). Niente è stato
ritarato. Da misurare col banco, a lavoro finito (tutte le leve in `dati/dungeon-del-mondo.js` e nella curva delle zone):

- **`STORIA_DALLA_ZONA`** (spento): la prima volta delle sette ai livelli dei dungeon (1, 2, 4, 5, 8, 10, 12 invece di 1, 2, 3, 5,
  7, 8, 10; domanda 3 del progetto), che costa una taratura della storia nel 3D;
- **`PIU_FORTE`** (forza ×1, spinta +0): quanto una ripetuta sta sopra la curva; oggi il «più forte» è solo il livello in più;
- **la forma delle zone** (`FORMA_DELLA_ZONA`) vale per i sette dal 12 e non per i sei: la cava (13) esce più tenera delle miniere
  (12); **i sei grossi** (ossa e attacco) e la forma dei loro piani;
- **i piani**: una ripetuta della cripta a cinque piani al livello 1, i sei nuovi a tre.

`npm run taratura -- --presto` dà lo stesso output di prima: il 2D e il banco non leggono niente di questo.

## Il contratto

### Le funzioni (`motore/rigenera.js`)

| funzione | cosa fa |
|---|---|
| `semeDelDungeon(eroe, chiave, rifatti, terra)` | il seme della volta: 1–99 991, lo stesso per gli stessi quattro |
| `tappaDelMondo(chiave, { eroe, rifatti, terra, livello, storia })` | la tappa: con `storia` (solo i sette) quella della storia, se no la ripetuta al `livello` (di difetto quello del dungeon nella terra); sempre con `seme` e `delMondo` = `{ chiave, rifatti, terra, storia? }`; null se la chiave non è un dungeon |
| `dungeonDellAvventura(a, chiaveOIndice, { eroe, terra, mondo })` | per l'avventura: `{ chiave, indice, storia, rifatti, livello, zona, tappa }`; storia vuol dire una delle sette non ancora finita (`indice >= a.tappa`) |
| `ripulito(esito)` | vinta e (se lo si sa) il grosso battuto |
| `dopoLaDiscesa(mondo, tappa, esito)` | `{ ripulito, mondo, storia }`: il mondo da scrivere con un rifatti in più (null se non è ripulito o non è del mondo), e se la discesa dà la storia |
| `rifattiDi(mondo, chiave)`, `conRipulito(mondo, chiave)` | leggere e alzare `rifatti` |
| `tappaDellaSosta(dato)` | la tappa di una sosta, del mondo o di prima |
| `mazzoDellaZona(zona)`, `abitantiDellaVolta(chiave, rifatti, eroe, terra)`, `voltoDelDungeon`, `numeriDelLivello` | i pezzi |

### Cosa si salva

- **`mondo.dungeon[chiave] = { rifatti }`** nell'avventura (`profile.campagne.sotterraneo.cfg.avventure[eroe].mondo`), accanto alla
  nebbia e al resto del mondo di sopra: niente nel profilo, `MONDO` non sale. Manca nei salvataggi di oggi: `rifatti` 0 per tutti.
  Le terre dopo (compito E) lo tengono in `mondi[t].dungeon`, lo stesso oggetto per terra.
- **La sosta** scrive `dungeon: { chiave, rifatti, terra, storia? }` (con la `potenza` della ripetuta) e, per i sei nuovi, la chiave
  in `tappa` al posto dell'indice. Una sosta senza `dungeon` (le soste di prima, il 2D) si rilegge come prima.

### Chi chiama cosa

- **Chi apre un dungeon dal mondo** (compito D, `viste/Mondo3d.vue` dall'ingresso): la lista è `dungeonDelMondo` di `Gioco.vue`, i
  tredici per chiave (i sette come in `tappe`, i sei con `indice: null`, `aperta: true`, `livello`, `colore`, `rifatti`, `zona`),
  passata a `viste/Campagna.vue` come `dungeon`; Campagna la deve ancora passare a `Mondo3d.vue`. Il fumetto dell'ingresso manda
  `scendi` con l'oggetto della lista come oggi con una tappa; Campagna lo gira a `gioca` con `t.indice ?? t.chiave`, e
  `avvia(chiaveOIndice)` di `Gioco.vue` scende (una chiave dei sette torna il suo indice). Il livello lo dà il dungeon; se il
  generatore (compito A) ne dichiara un altro per l'ingresso, si passa a `tappaDelMondo` come `livello`.
- **Chi riceve l'esito**: `chiudi()` di `Gioco.vue`, sempre. Con `dopoLaDiscesa` scrive il mondo nuovo se ripulito, e la storia
  (`vintaNellAvventura`, `completa`) solo se `storia`. Il portale non passa di qui.
- **Chi riprende**: `riprendiDiscesa` e le forze sopra, con `tappaDellaSosta`.
- **Il motore di sopra** (compito B): `mondoDaSalvato` e il travaso non devono buttare `mondo.dungeon`; `cittaDelDungeon` deve
  conoscere i sei nuovi.
- **Le terre** (compito E): `terraOra()` in `Gioco.vue` (oggi 1) diventa `terraDi(avventura)`, e il mondo da leggere e scrivere è
  quello della terra.

## Come si guarda

`#sotterraneo3d=cerchio` scende nel cerchio di pietre (una chiave qualunque dei tredici; con gli altri cheat: `&eroe=`, `&piano=3`,
`&seme=`). Per vedere una rigenerazione: si ripulisce (il cheat `&piano=3`, il grosso battuto, «esco dal sotterraneo») e si rientra.

Nei test: `unita/sotterraneo-rigenera` (le tredici chiavi e l'ordine, i sei con i loro grossi, difese, figura e pezzi; lo stesso
(eroe, chiave, rifatti) la stessa forma e lo stesso mazzo, uno in più un'altra; nessuna specie fuori dalla zona in dodici volte;
ripulito sì e no, una discesa vera giocata dal banco; portale, lasciar perdere e svenire non alzano `rifatti`; la sosta per chiave;
la prima ripulitura della cripta dà storia e stelle, la seconda no, il cerchio non tocca tappa né stelle; i salvataggi di oggi),
`integrazione/sotterraneo-rigenera` (col dito: il cerchio col seme della volta 0, lasciato perdere uguale, ripulito toccando «esco
dal sotterraneo» e «alle discese» — prima il velo del traguardo — il mondo con `rifatti` 1, la storia ferma, rientrando il seme, gli
abitanti e il nome della volta 1), `unita/sotterraneo-rarita` (le figure dei sei grossi).
