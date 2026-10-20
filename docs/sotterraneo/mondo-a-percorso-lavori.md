# Il mondo a percorso: i lavori

Come si costruisce [mondo-a-percorso.md](mondo-a-percorso.md): cosa cambia modulo per modulo, il salvataggio e la migrazione, quanto
costa, e la spartizione in cinque compiti con file disgiunti. Il prototipo (`strumenti/sotterraneo-percorso/`, `npm run pianta --
--percorso`) è la forma da portare nel gioco, non il codice da copiare: il generatore vero tiene la quota, il decoro, i campi fuori
dal villaggio e le misure di oggi.

## La mappa di impatto

| modulo | cosa cambia |
|---|---|
| `dati/mondo-aperto.js` | via `REGIONI_DEL_MONDO` a griglia, `MARCHE`, `PASSAGGI`, `regolaDi`, `haGrata`, `passaggioAperto`, `anelloDi`, `FASCE_DEGLI_ANELLI`; dentro `PERCORSO`, `TRACCIATO`, `ZONE` coi luoghi (le chiavi delle regioni di oggi), i confini, `DUNGEON` coi quattordici, `CITTA` con gli avamposti, `VILLAGGIO` e `AVAMPOSTO`, `TERRE`; `HABITAT` e `LOTTI` restano |
| `motore/mondo-aperto.js` | i passi 1–5 (regioni a centri, ponti, valichi, masse) diventano la curva, il corridoio, le creste fra le file e i confini di traverso; 7a la pianta stampata; 7b i dungeon per zona; le pietre per zona; via gli antri; 12 i guasti nuovi (quelli del prototipo) al posto di `perTappa`; un parametro `terra` |
| `motore/mondo-aperto-strade.js` | niente: l'A* e i passi servono uguali |
| `motore/mondo-sopra.js` | via `aperturaDi`, `chiusoPerche`, i passaggi chiusi; `cittaDelDungeon` dalla zona (non dalla marca); le pietre `zona:<chiave>` e la pietra del villaggio che porta avanti; `difDellaPietra` dalla zona; `frecceDelCartello` sulla strada maestra; la nebbia a 352×216; `mondoNuovo` e il travaso (sotto) |
| `motore/aperta.js`, `dati/mondo-aperto-mostri.js` | l'anello diventa la zona; la fascia sale lungo l'arco della zona; la cintura letta da `m.cintura`; `guardieDelSignore` per zona; `CURVA_DI_SOPRA` fino al 15 (e oltre per le terre) |
| `motore/taglie-bacheca.js`, `dati/missioni-modelli.js` | `anelloDi(r) < 1` diventa «fuori dal villaggio»; `regioniServite` per zona; gli id restano |
| `motore/storia.js`, `dati/dialoghi.js`, `motore/dialoghi.js` | i livelli attesi nel 3D (domanda 3); il minatore e il capitano che consigliano la zona e annunciano la porta delle terre; nessuna riga sulle grate |
| `dati/grossi.js`, `dati/pezzi.js`, `dati/zone.js` | i sei boss nuovi e i loro pezzi col nome; i volti dei sei nuovi |
| nuovo `dati/dungeon-del-mondo.js`, `motore/rigenera.js` | i sei dungeon nuovi come tappe (paesaggio, abitanti, caporale, boss, piani); il seme e gli abitanti di una rigenerazione, la tappa di una ripetuta (sul calco di `zonaDi`) |
| `Gioco.vue`, `motore/sosta.js` | la discesa ripulita (`vinta`) fa `rifatti + 1`; il seme da `(eroe, chiave, rifatti, terra)`; la sosta di un dungeon senza indice (per chiave) |
| `scena3d/mondo/ponti.js` | via le grate; restano ponti, cartello, bacheca; via gli antri |
| `scena3d/mondo/monumenti.js` | sei monumenti nuovi coi props che ci sono; la porta delle terre; la pietra runica di zona |
| `scena3d/mondo/kit.js`, `props-citta.js` | il villaggio dalla pianta: le botteghe col davanti a sud, niente orti né bucato sul davanti; gli avamposti |
| `scena3d/mondo/props-dove.js` | l'habitat dal luogo e non dalla regione a griglia; nessun prop sui confini |
| `scena3d/mondo/pezzi.js`, `lontano.js`, `veduta.js` | 11×8 pezzi invece di 5×5; il lontano a un vertice ogni due celle (sotto, «Quanto costa»); la veduta coi nomi delle zone |
| `scena3d/mondo/vesti.js`, `acqua.js` | la tinta della terra (terreno e cielo) |
| `viste/Mondo3d.vue`, `viste/FumettoMondo.vue` | via i bersagli e il fumetto delle grate; l'annuncio della zona; la telecamera più lontana nel villaggio; la porta delle terre |
| `strumenti/icone-mondo.mjs`, `dati/icone-mondo.js` | quattordici dungeon e tre città; si rifà con `npm run scatti icone-mondo` |
| `strumenti/sotterraneo-pianta-mondo.mjs`, `motore/banco-mondo.js` | la pianta e il banco del mondo sul percorso (il banco misura per zona, non per anello) |

## Il salvataggio e la migrazione

Tutto sta già nell'avventura (`profile.campagne.sotterraneo.cfg.avventure[eroe].mondo`); niente campi nel profilo, `MONDO` non sale.

- **Il mondo porta la sua firma**: `mondo.firma` si scrive salvando. Una firma diversa (o assente, cioè tutti i salvataggi di oggi)
  vuol dire mondo cambiato: **la nebbia, `dove` e `sopra` si rifanno** col travaso, il resto resta. La nebbia vecchia non si
  allarga: `LARGHEZZE_VECCHIE` vale per la terra dipinta, dove la mappa nuova conteneva la vecchia; qui è un'altra mappa, e un
  codice che non torna è già nebbia nuova (`nebbiaDaBase64`).
- **Il travaso** (`mondoNuovo`, la tabella di [mondo-aperto-dati.md](mondo-aperto-dati.md)): si ricomincia nella piazza; per ogni
  porta della storia finita si scopre la strada maestra fino a lei e si accende la pietra della sua zona.
- **Le pietre accese**: le chiavi delle città restano; una chiave di dungeon (`altare`, …) diventa `zona:<la zona del dungeon>`.
- **`sopra`** (i mostri morti per indice) si butta: con un'altra mappa gli indici sono altri mostri. È il caso «salvato storto» che
  `riprendiMondo` sa già: tornano tutti.
- **Le taglie** (`t:<città>:<modello>:<parametro>:<giro>`): città, regioni (ora luoghi) e dungeon tengono la chiave, quindi un id
  salvato si rifà ancora. Una taglia presa per un posto che ha cambiato zona resta valida: il posto c'è.
- **La sosta col portale**: il gemello nella città della zona del dungeon (villaggio, forte o rifugio); il caso peggiore resta il
  villaggio.
- **I dungeon nuovi e le rigenerazioni**: `mondo.dungeon` manca nei salvataggi di oggi, cioè `rifatti` 0 per tutti.
- **Le terre**: `terra` manca, cioè 1; `mondi` manca, cioè nessuna terra dopo. Il 2D (la terra dipinta, `terra` dell'avventura) non
  si tocca.

## Quanto costa

- **Il disegno vicino non cambia**: i nove pezzi di 32×28 attorno all'eroe sono gli stessi (oggi 119 chiamate e 311k triangoli dalla
  piazza, sotto il tetto del Note 7 di 150 e 400k). Il villaggio senza campi né orti costa meno di oggi.
- **Il lontano e la veduta sì**: un vertice per cella su 76 000 celle è 3,4 volte il terreno lontano di oggi; a un vertice ogni due
  celle torna sotto quello di oggi. La veduta d'insieme (oggi 60 chiamate e 260k) si rimisura.
- **La nebbia**: 9 504 byte, 12 672 caratteri in base64 per terra (oggi 3 734); le due trame 352×216.
- **Generare**: il prototipo ci mette ~0,4 s in Node senza quota né decoro; il vero (oggi 0,3 s per 22 400 celle) si stima a 1–1,5 s,
  sul telefono di più. Si misura: se passa il secondo e mezzo sul Note 7 si genera in un worker mentre carica three.
- **I mostri di sopra**: ~3 volte l'erba di oggi, ~3 volte i branchi a parità di `cellePerBranco` (~650 mostri): `muoviMostri` e il
  salvataggio dei morti si rimisurano; la leva è `cellePerBranco` per zona.

## La spartizione

Cinque compiti, uno per agente. **A fa il contratto** (l'output del generatore) e va per primo; **C parte subito**, non legge la
mappa; B e D partono su A (o, per cominciare, sull'output del prototipo, che ha la stessa forma); E è per dopo. `Gioco.vue` è di C
e poi di E; `Mondo3d.vue` e `scena3d/mondo/indice.js` sono di D e poi di E.

### A. Il generatore (il contratto) — 2–3 giorni

- **File suoi**: `dati/mondo-aperto.js`, `motore/mondo-aperto.js`, `strumenti/sotterraneo-pianta-mondo.mjs`,
  `strumenti/sotterraneo-percorso/` (da togliere a lavoro fatto, con la sua riga in `sotterraneo-pianta.mjs`),
  `test/unita/sotterraneo-mondo.test.mjs`, `docs/sotterraneo/mondo-aperto-generatore.md` (riscritto).
- **Il contratto**: `generaMondoAperto(seme, { terra })` con `zone` (chiave, nome, fascia nella terra, `s0 s1`), `regioni` (i luoghi,
  con `zona`), `reg`, `zona` e `arco` per cella, `cintura`, `confini` (al posto di `passaggi`, senza grata), `citta` (villaggio dalla
  pianta, avamposti), `posti` (`pietra` con chiave `zona:<chiave>` o della città, `ingresso` ×14 con `zona` e `livello`, `terre` la
  porta), `strada`, `partenza`, `passi`, `distanze` (fra pietre, dei dungeon), `guasti`, `firma`. Via `perTappa` e `mascheraDelMondo(m,
  aperto)` diventa `mascheraDelMondo(m)`.
- **Test**: firma del seme scelto, nessun guasto, lo stesso seme lo stesso mondo, `terra` 2 la stessa mappa (stessa firma) con le
  fasce +14, ogni posto raggiungibile, nessuna scorciatoia fra le file, le pietre a 130–220 passi, la storia in fila, la cripta nella
  cintura, il villaggio uguale alla pianta della scheda, i luoghi con le chiavi di oggi.

### B. Il motore di sopra — 2 giorni, dopo A

- **File suoi**: `motore/mondo-sopra.js`, `motore/aperta.js`, `dati/mondo-aperto-mostri.js`, `motore/taglie-bacheca.js`,
  `dati/missioni-modelli.js`, `motore/banco-mondo.js`, i loro test (`unita/sotterraneo-mondo-salva`, `-mondo-mostri`,
  `-quest-modelli`, `-citta`, `-mostri-sopra-scena`), `docs/sotterraneo/mondo-aperto-mostri.md`.
- **Il contratto che dà a D e C**: `pietreDi(m)`, `meteDelViaggio` col villaggio che porta avanti, `cittaDelDungeon(m, chiave)` per
  zona, `mondoDaSalvato(m, salvato)` (la firma, il travaso, le pietre vecchie), `annuncioDi` con la zona, `alSicuro` dalla cintura.
- **Test**: il travaso di un salvataggio di oggi (nebbia di 3 734 caratteri, pietre `altare`, `sopra` vecchio), la fascia che sale
  lungo la zona, nessun mostro nella cintura né sui confini, le taglie di oggi che si rifanno dall'id, il banco per zona.

### C. I dungeon che si rigenerano — 2–3 giorni, subito

- **File suoi**: nuovi `dati/dungeon-del-mondo.js` e `motore/rigenera.js`; `dati/grossi.js`, `dati/pezzi.js` (i pezzi dei sei boss,
  dalle figure dei fogli), `dati/zone.js` (i volti dei sei), `motore/sosta.js`, `motore/storia.js`, `Gioco.vue`; test nuovi
  `unita/sotterraneo-rigenera` e una prova in `integrazione/sotterraneo-mondo` (ripulire e ritrovare un'altra forma) concordata con D.
- **Il contratto**: `tappaDelMondo(chiave, { eroe, rifatti, terra, livello })` (la tappa, sette e sei nuovi), `semeDelDungeon(eroe,
  chiave, rifatti, terra)`, `ripulito(esito)`; i sei boss in `GROSSI` con `figura` del catalogo.
- **Test**: lo stesso (eroe, chiave, rifatti) la stessa forma e lo stesso mazzo, un `rifatti` in più un'altra; uscire col portale,
  lasciar perdere o svenire non aumenta `rifatti`; la prima ripulitura delle sette dà le stelle e la storia, la seconda no; un
  dungeon nuovo non tocca `tappa` né le stelle; i sei boss con le difese e la figura; nessuna specie fuori dalla sua zona.
- **Fatto** (20 ottobre 2026): [dungeon-che-si-rigenerano.md](dungeon-che-si-rigenerano.md) ha le regole, i tredici dungeon, i
  numeri da tarare e il contratto. In breve: `semeDelDungeon`, `tappaDelMondo(chiave, { eroe, rifatti, terra, livello, storia })`,
  `dungeonDellAvventura`, `ripulito`, `dopoLaDiscesa`, `tappaDellaSosta` in `motore/rigenera.js`; si salva
  `mondo.dungeon[chiave] = { rifatti }` e, nella sosta, `dungeon: { chiave, rifatti, terra, storia? }` (la chiave in `tappa` per i
  sei nuovi). `Gioco.vue` dà `dungeonDelMondo` (i tredici per chiave) a `Campagna.vue` come `dungeon`, scende con `avvia(chiave)` e
  scrive il rifatti in `chiudi()`. Restano: a **D** passare `dungeon` da Campagna a `Mondo3d.vue`, i sei ingressi coi monumenti e le
  icone, la sentinella nel 3D; a **B** tenere `mondo.dungeon` nel travaso e `cittaDelDungeon` dei sei; a **E** `terraOra()` in
  `Gioco.vue` e `mondi[t].dungeon`; alla taratura le leve di `dati/dungeon-del-mondo.js`. Il 2D non cambia (`npm run taratura --
  --presto` uguale).

### D. La scena — 3 giorni, dopo A (il villaggio e i monumenti anche prima)

- **File suoi**: `scena3d/mondo/*` (`indice.js` compreso), `viste/Mondo3d.vue`, `viste/FumettoMondo.vue`, `strumenti/icone-mondo.mjs`
  e il generato `dati/icone-mondo.js`, `dati/terra.js` (`iconaDi`), i test `unita/sotterraneo-mondo-3d`, `-mondo-props`,
  `-mondo-aperto-props`, `-icone-mondo`, `integrazione/sotterraneo-mondo`, `-bacheca`, `-mostri-sopra`, `-rotta`, `test/aiuto/browser.mjs`
  per `scendiNelMondo` (le pietre ora `pietra:zona:…`), `docs/sotterraneo/mondo-3d.md`.
- **Cosa fa**: il villaggio e gli avamposti dalla pianta, le grate via, i sei monumenti e la porta delle terre, la pietra di zona, il
  lontano a due celle, la veduta coi nomi delle zone, l'annuncio, la telecamera nel villaggio, le icone rifatte; poi misura chiamate e
  triangoli (piazza, un dungeon per fila, veduta) in `mondo-3d.md`.
- **Test**: i bersagli di oggi senza `[data-grata]`, `[data-posto]` dei quattordici con `data-zona`, `[data-pietra]` di zona, il villaggio
  con tutti visibili dalla partenza (ogni `[data-personaggio]` della piazza a schermo senza muoversi), i costi sotto 150 e 400k.

### E. Le terre successive — 2 giorni, per ultimo

- **File suoi**: nuovo `motore/terre.js`; dopo C, `Gioco.vue` (passare di terra, la sosta con la terra); dopo D, `Mondo3d.vue` e la
  tinta in `scena3d/mondo/vesti.js`; dopo B, `motore/mondo-sopra.js` per `mondi[t]`; i testi del minatore e del capitano; test nuovo
  `unita/sotterraneo-terre`.
- **Il contratto**: `terraDi(avventura)`, `mondoDellaTerra(avventura, t)`, `passaTerra(avventura, t)`, `apertaLaPorta(avventura)` (le tombe
  ripulite nella terra di adesso); le fasce le dà già A col parametro.
- **Test**: passando si porta l'eroe e si azzerano nebbia, pietre, taglie, rifatti; tornando si ritrova la prima com'era; la storia
  e le stelle non si muovono nelle terre dopo; i salvataggi di oggi sono la terra 1.

### Prima di chiudere ogni compito

Le unità (`npm test`); il browser del proprio file (`node test/esegui.mjs sotterraneo-mondo`) nel proprio worktree con la build
nuova; `npm run sotterraneo -- --mondo` per B e C. La taratura della storia nel 3D (domanda 3: i giocatori tipo sul percorso, la
forza dei sei nuovi, `cellePerBranco` per zona) è un giro a parte dopo B e C, col banco.
