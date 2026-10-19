# Da fare: il 3D, il mondo aperto e il resto del giro del 16 ottobre 2026

Le voci aperte alla fine del giro che ha portato il Sotterraneo 3D, il mondo di sopra generato, i paesaggi, le botti, i
pensieri, la torcia, la pergamena del portale e il tema legno e ottone. Il resto delle voci del sotterraneo sta in
[da-fare.md](da-fare.md). Il progetto del mondo: [mondo-aperto-progetto.md](mondo-aperto-progetto.md) e
[mondo-aperto-fasi.md](mondo-aperto-fasi.md).

## Da provare col dito (sul PC a 120 Hz e sul telefono)

Tutto è stato guardato solo in Chrome senza GPU, mai su un telefono vero.

- **I mostri a 120 Hz**: la cadenza (8 al secondo da svegli, 4 respirando, 1,5 i passi dei dormienti, come il 2D) è giusta o
  a scatti? Se i fotogrammi sono troppo distanti si alza (10–12) tenendo il tempo reale. L'eroe va bene com'è.
- **La torcia**: cono 9,5 celle, alone 3,8, apertura 300°, nessun agguato alle spalle con la torcia accesa: dà il «respiro»
  che si voleva? ([luce.md](luce.md))
- **Il villaggio 3D** e il mondo di sopra ([mondo-3d.md](mondo-3d.md)): leggibilità dell'eroe (~25 px su 390), stile degli sprite
  accanto al 3D liscio, nebbia, veduta, pietre del viaggio.
- **Gli oggetti delle città** ([mondo-3d.md](mondo-3d.md#gli-oggetti-delle-città)): se a telefono si leggono (insegne, panche, bracieri
  sono piccoli), se i bracieri e le torce non sono troppi, se il rifugio (poco spazio) sembra abbastanza suo.
- **I props fuori dalle città** ([mondo-3d.md](mondo-3d.md#i-props-fuori-dalle-città-e-attorno-agli-ingressi)): se a telefono si
  leggono (menhir e cairn sono i più sobri, le ragnatele e le lapidi sottili), se i cimiteri sono abbastanza pieni, se le palafitte
  e le ninfee non coprono troppo l'acqua. Il guado e il passo (le due città se ne mangiano quasi tutta l'erba) restano spogli.
- **Il segno d'arrivo del tocco** nel villaggio (corretto: non vola più via) e il tocco su una botte.
- **Il pannello sopra i globi su desktop** (misura vera della barra, non riprodotto in headless: se si vede ancora tagliato
  servono la riga «aggiornato il…» in fondo alla home, il carattere minimo e lo zoom del browser).
- **I globi** A (canvas 2D, predefinito) e B (WebGL, `#globi=3d`): quale resta.
- **Le prestazioni su un telefono più vecchio**: draw call e triangoli sono misurati, i millisecondi no (villaggio ~120
  chiamate e ~310 mila triangoli). Il degrado automatico a scalini è rimandato: si fa solo se il 3D convince.

## Decisioni aperte

- **Le botti bloccano finché sono intere?** Oggi l'eroe ci passa attraverso. Farle bloccare vuol dire insegnarle a `buona()` del
  motore (strade, palco, mostri), solo nel 3D.
- **La missione dell'incantatrice e la pergamena nel 2D dei bambini**: oggi ci sono anche lì (il segno sopra di lei, la
  merce, la missione «Il quaderno degli incantesimi»). Tenerle o limitarle al 3D in prova?
- **I pensieri dell'eroe nel 2D dei bambini**: ci sono anche lì. Nessun interruttore dei genitori (scelto), nessuna riga di
  novità (scelto). Eventuale voce («io» senza nome) da rivedere.
- **Il tema legno e ottone** è predefinito solo nel 3D; nel 2D resta l'aspetto di sempre (`#tema=legno|rilievo|attuale`).
  Quando il 3D sostituisce il 2D ([mondo-aperto-fasi.md](mondo-aperto-fasi.md): «ne rimarrà solo uno») va deciso se il legno diventa l'unico.
- **L'eroe fra il mondo nuovo e il 2D**: oggi il mondo nuovo vive nel campo `mondo` dell'avventura sotto la stessa chiave
  `sotterraneo`; la chiave `sotterraneo3d` e «porta qui il tuo eroe» restano per la fase 9.
- **Dopo la storia: le regioni ruotano o si espande il terreno?** E gli antri, a rotazione o sempre aperti? (blocco delle
  decisioni in [mondo-aperto-fasi.md](mondo-aperto-fasi.md))

## Lavori pronti da far partire

- **La pergamena del portale**: lo sprite disegnato (oggi l'emoji; a terra in 3D si vede solo il bagliore), la casella nella
  barra come la pozione (oggi si apre dallo zaino), un banco nelle altre città, l'abisso «dall'inizio del tratto» (oggi
  chiude la serata come il ritorno di sempre). Il pensiero «sono lontano da casa» per ricordare che si può usare.
- **La carta «riprendi» della home per il Sotterraneo 3D**: `sotterraneo3d` non ha un manifesto con `ripresa()` (è una riga di
  `data/giochi.js`), quindi in home la partita a metà non mostra l'icona; quando l'avrà, `iconaDi(chiave, true)` è già pronta
  (le icone del mondo fotografate stanno in [mondo-3d.md](mondo-3d.md#le-icone-dei-posti)). La città non ha ancora un posto
  dove mostrarsi: le tre icone ci sono, nessuna schermata le chiede.
- **Il mondo con i mostri sopra** (fase 5): fatti il motore e la scena ([mondo-aperto-mostri-scena.md](mondo-aperto-mostri-scena.md)).
  Da guardare col dito sul Note 7: lo scontro sul prato col pannello, il tocco su un mostro che cammina, il 💤 e i galloni, gli fps del
  mondo (in emulazione tre volte lo scontro delle discese, coi mostri o senza). Restano il signore del cimitero che stende chi ci va
  prima della cripta, gli abitanti da dipingere (il foglio delle creature d'aperta campagna) e la taratura (quanto si combatte girando,
  le basi delle taglie accese).
- **Le quest alla Diablo/WoW** ([mondo-aperto-quest.md](mondo-aperto-quest.md)): fatte le taglie della bacheca (consegna, esplora, trova
  chi, mappa, caccia, mostro col nome, recupera; 19 ottobre) e, coi mostri di sopra, caccia aperta, signore della regione e tana.
  Restano le quest scritte a mano nelle regioni, scorta ed eventi di mondo; la taratura delle gemme col
  banco dei giocatori tipo (quanto guadagna in più chi fa tutte le taglie); i personaggi nuovi delle città (cacciatrice, carovaniere) e
  gli sprite veri di chi si perde (oggi lo sprite del boscaiolo, della ragazza, …); la X e il viandante non hanno un disegno 3D (sono
  segni sul prato); «vai alla pietra» dal diario e la freccia sulla strada vera, non in linea d'aria.
- **I paesaggi alle discese e all'abisso**: gallerie → grotta, cisterna → tempio, fondo → miniera (già fatti nel mondo
  3D) e per l'abisso i tratti neve, ghiaccio, palude con gli abitanti adatti ([paesaggi-3d.md](paesaggi-3d.md)).
- **Le figure grandi a blocchi**: i grossi senza figura dipinta (Re Ossuto) sono lo sprite della specie ingrandito ~2,5
  volte; le armi in mano nel 3D sono a blocchi (il foglio nitido misura 11 848×2 331 e non entra come texture su un
  telefono: andrebbe ritagliato). Paladino, Luna e runico si distinguono nei pensieri solo dai nodi dell'albero.
- **Il mondo di sopra**: l'anello acceso dal tocco su un mercante si vede poco mentre l'eroe cammina; la freccina della
  missione indica la direzione sul bordo, non la strada vera.

## Da ritarare (non è stato rimisurato niente in questo giro)

Prima di accendere nel gioco normale quello che oggi è solo in prova, si rifà `npm run taratura` coi giocatori tipo: la
torcia (il curioso a 9/10 vince ogni discesa, a 4/10 il fondo 4 volte su 6 invece di 2; la guardia di
`unita/sotterraneo-roba` è allentata di uno slot), il bottino delle botti (una su cinque, Boccetta o 1–2 gemme), la
pergamena (prezzo 25 gemme, tetto 5, 3% nei forzieri dopo la missione), le risalite col portale gemello gratuito (il costo
è un numero solo in `dati/cose.js`), le regole di luce e agguato, il mondo con le fasce per anello e le missioni.

## Guasti già noti nei test del sotterraneo (non di questo giro)

`integrazione/sotterraneo` (4 caselle nello zaino, ce ne sono 6), `sotterraneo-cura` e `sotterraneo-barra` (da soli passano
spesso), `misure/sotterraneo` (equilibrio: il fondo a 4/10) e qualche timeout sotto carico (`sotterraneo-3d`, `-mondo`,
`-missioni`: con `--alla-volta=2` passano). `sotterraneo-bottega-avanti` a volte fallisce per un prezzo casuale.

## Come si pubblica senza pestarsi i piedi

- Si pubblica con `./pubblica.sh` **da una copia pulita di `main`** (`.claude/worktrees/pubblica-main`, con `pubblica.sh` e
  `.nas` copiati e `node_modules` collegato): la copia di casa è una sola, e chi pubblica da un albero vecchio cancella il
  lavoro degli altri (successo il 16 ottobre alle 14:22 e alle 14:36: la versione con il villaggio 3D è sparita dal server
  finché non si è unito il branch delle navi in `main`). Prima si unisce in `main`, poi si pubblica.
- Un `npm run build` verifica la sintassi dei file Vue: `npm test` non compila i `.vue` (un commento in fondo a una riga
  aveva rotto `Mondo3d.vue` con le unità verdi).
- Nel checkout principale c'è `AGENTS.md.prima-del-merge`: il tuo `AGENTS.md` non tracciato, spostato per poter unire il
  branch delle navi, che ne porta uno suo. Da rinominare o buttare.
- Nessun push su GitHub è stato fatto in questo giro: la copia di casa è l'unico posto dove le cose sono pubblicate.
