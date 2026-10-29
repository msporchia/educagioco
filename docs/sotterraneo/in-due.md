# Il sotterraneo in due (progetto)

Due bambini, due telefoni, la stessa discesa: ognuno col suo eroe e la sua roba, insieme contro i mostri.
**Stato: progetto** (29 ottobre 2026), niente di costruito. L'utente l'ha scelto fra i giochi da mettere in due perché giocarci
insieme è «veramente straordinario», e perché lo scontro è già a turni. Il pezzo comune (il tavolo, il canale, il lockstep, la
sala) è quello di Castle Battle: [../core/insieme.md](../core/insieme.md). Qui c'è quello che il sotterraneo deve dargli.

## Cosa si gioca

- **Una discesa insieme, sotto.** La terra di sopra, i mercanti, le missioni e il diario restano di chi gioca da solo: in due si
  scende e si torna. Il mondo di sopra in 3D e le sue terre sono fuori.
- **Ognuno porta il suo eroe** dalla sua avventura ([avventure.md](avventure.md)): classe, livello, roba addosso e nello zaino,
  abilità, pozioni. Due eroi della stessa classe vanno bene.
- **La discesa la sceglie chi crea**, nello slot della sala comune. Quale, e a che livello, è una domanda aperta (sotto).
- **Si risponde dal proprio telefono, alle proprie domande**: ognuno ha la sua età, i suoi saperi e il suo SRS. Le monete sono di
  chi risponde (🪙1 a risposta giusta, come sempre: [regole.md](regole.md#le-monete)). Nessuno guadagna con le risposte dell'altro.

## Il mondo è uno solo, e si ferma per tutti e due

- **Il motore gira su tutti e due i telefoni col lockstep** (fette fisse da 0,05 s, le mosse applicate dopo 0,6 s), come Castle
  Battle. Chi crea è il primo eroe, l'ospite il secondo. Ogni telefono salva solo il suo eroe.
- **Camminare regge il ritardo**: si tocca dove andare, e l'eroe parte dopo 0,6 s. Il segno della meta si accende subito, sul
  telefono di chi ha toccato, così il tocco non sembra perso. Un tocco che dà un ordine regge mezzo secondo; il dito che guida
  (Survivors) no. Da sentire coi telefoni veri.
- **Da soli, con un foglio aperto non si muove niente** (`Corsa.passo`): una domanda, una porta, un forziere, lo scontro. **In due
  vale per tutti e due**: chi apre una porta ferma anche l'altro. È la pausa condivisa che l'utente ha voluto anche per Survivors
  in due: fra compagni fermarsi insieme è giusto (in Castle Battle, uno contro l'altro, no).
- **Chi aspetta lo sa**: sul telefono dell'altro la scena resta, ferma, con un cartello piccolo «Aspetto che Leo apra la porta»
  («…finisca lo scontro», «…scelga cosa bere»), col nome del bambino. Non un velo che copre tutto: la scena dice già cosa succede.
- **Dopo uno sbaglio si spiega**, come da soli ([../apprendimento/la-domanda.md](../apprendimento/la-domanda.md)): col mondo fermo
  nessuno perde leggendo. Niente domanda `svelta`.
- **Il ⏸ ferma tutti e due**, con «Leo ha messo in pausa». Non c'è la sosta: una discesa in due non si lascia a metà per riprenderla
  (vedi «Finire», sotto).

## I due eroi nella discesa

- **Il motore oggi ha un eroe solo**, sparso in `Corsa` e `Corredo` (posizione, vita, energia, mana, roba, incanti preparati,
  strada, foglio). Il lavoro grosso è portarlo in **una persona**: la discesa tiene il piano, i mostri e l'orologio, e una lista di
  persone. Da soli la lista ha una persona, e **tutte le misure del banco devono restare identiche** (un test lo controlla, come
  `unita/sotterraneo-strade` tiene fermo il mana).
- **I mostri si svegliano per chi entra nella loro stanza** e vanno verso il più vicino dei due; l'agguato prende alle spalle quello
  che raggiungono. La luce è l'unione dei due coni ([luce.md](luce.md)): un mostro nella luce dell'uno va dritto.
- **L'orologio conta i passi di tutti e due**: i mostri morti tornano prima, la torcia brucia per chi la porta
  ([orologio.md](orologio.md)). Il mana torna a ognuno coi suoi passi.
- **La scala**: si scende quando ci sono tutti e due. Il primo che la tocca aspetta lì («Aspetto Leo alla scala»), e quando arriva
  l'altro si scende insieme. Così il piano nuovo comincia con tutti e due e non c'è un piano per ognuno.
- **Il portale** porta su tutti e due, e finisce la discesa.

## Lo scontro in due

- **Entra chi è vicino**: i mostri entro il raggio da chi apre lo scontro, come oggi ([scontro.md](scontro.md#chi-entra)), e il
  compagno se è nella stessa stanza. Chi è lontano non entra, e sul suo telefono lo scontro si guarda (il mondo è fermo comunque).
- **Il compagno è già previsto**: la fila ha un `lato` per ogni attore, e il palco ha il posto del compagno sfalsato sotto l'eroe,
  in diagonale (`viste/campo.js`, `[data-posto-compagno]`, oggi spento). Ognuno ha la sua velocità e i suoi turni nella fila;
  `passaIlTurno`, che si ferma al primo del lato dell'eroe, va insegnato a fermarsi a chi tocca.
- **Al suo turno risponde chi gioca quell'eroe**; l'altro vede la scelta e la domanda arrivare («Tocca a Leo»).
- **I mostri scelgono chi colpire** fra i due. Le abilità che curano o proteggono possono andare anche sul compagno: oggi «in area»
  non vuol dire niente perché l'eroe è solo ([mosse.md](mosse.md)), in due sì.
- **Chi sviene resta a terra fino alla fine dello scontro**, poi si rialza con poca vita. Se svengono tutti e due vale la regola di
  oggi per tutti e due ([regole.md](regole.md#svenire-e-il-fondo-degli-svenimenti)).
- **Il pericolo** (lo stop dello scontro, [pericolo.md](pericolo.md)) guarda ognuno per sé.

## La roba: chi la prende

- **La prende chi ci arriva prima.** È il «rubarsi le cose» dell'utente, e regge perché **la roba si lascia per terra**
  (`posaRoba`, lo zaino ha «butta»): chi trova un pezzo che sta meglio all'altro lo posa e glielo lascia.
- **Le gemme** si prendono passandoci sopra, come oggi: sono di chi passa.
- **Il bottino si pesca per un eroe** (`tua: k => this.porta(k)`: un pezzo che la sua classe può portare). In due ogni caduta si
  pesca per uno dei due, a turno col seme. Così tutti e due trovano roba propria, e un pezzo dell'altra classe si può
  vendere sopra.
- **L'esperienza di uno scontro va intera a chi l'ha combattuto**: è un premio del gioco, non monete, e il compagno ha risposto
  anche lui. Le monete restano solo delle risposte (sopra).

## Finire

- **Si finisce col portale, con la scala del fondo, o svenendo** come da soli. Ognuno torna nella sua avventura con il suo eroe:
  livello, esperienza, roba, gemme, pozioni.
- **La linea che cade** la regge il pezzo comune (il cartello, «riparte da dov'era»). Se la sfida finisce male, **ognuno tiene
  quello che aveva preso fino a lì**: una caduta della linea non deve buttare via mezz'ora di discesa.
- **La storia non si muove in due** (proposta, sotto): la discesa in due non chiude le porte della grande storia.

## Il caso e i conti uguali sui due telefoni

Quello che va fatto prima di tutto, perché senza le due copie si separano (in Castle Battle si separavano per un `Math.hypot`):

- **Tutto il caso dal seme.** `Corsa` prende già `rnd`, e il bottino in buona parte usa `tiroDalSeme`; ma `bottino.js`,
  `bottega.js` e `storia.js` hanno `rnd = Math.random` come valore di difetto, e ogni chiamata dentro la discesa deve passare quello
  della corsa.
- **Niente `Math.hypot`** nel motore (66 righe): `ipot`, come in `giochi/arena/motore/partita.js`. Gli `atan2` (5) e i `sin`/`cos`
  (2) toccano la luce, quindi il gioco: si sostituiscono coi prodotti scalari, o con versioni uguali al bit: due browser possono
  arrotondarli in modo diverso.
- **Il passo fisso**: `passo(dt)` taglia già a 0,05 s; in due il battito è sempre 0,05.
- **La fotografia c'è quasi**: la sosta (`motore/sosta.js`) salva il piano come differenza da quello nato dal seme, coi mostri dove
  erano. In due serve anche lo scontro aperto e la fila, che la sosta non salva.
- **L'impronta**: vita ed energia dei due, celle dei due, mostri vivi e somma delle loro posizioni, piano, passi.
- `unita/sotterraneo-lockstep`: due discese con lo stesso seme e gli stessi comandi restano uguali al bit (come `unita/arena-lockstep`).

## Cosa dà il sotterraneo al pezzo comune

Come Castle Battle ([../arena/multigiocatore.md](../arena/multigiocatore.md)): la regola (versione, proposta, cosa si accetta), il
motore del lockstep (avanza, applica una mossa, impronta, foto), le mosse (`vai`, `tocca`, `rispondi`, `abilita`, `bevi`, `posa`,
`scendi`…), i bambini finti in `test/aiuto/sfide/sotterraneo.mjs` (il giocatore finto di `motore/banco.js` sa già scendere).

**Una cosa nuova nel pezzo comune**: oggi la proposta la fa solo chi crea, e l'ospite accetta. Qui anche l'ospite porta qualcosa,
il suo eroe. L'incontro (`src/insieme/incontro.js`) deve far mandare a ognuno la sua parte prima di partire (l'ospite col
`pronto`), e `crea` riceve tutte e due. Serve a ogni gioco in cui ognuno porta la sua roba.

## In che ordine

1. **Il caso e i conti uguali** (sopra), col test del lockstep su una discesa da soli. Non cambia niente a chi gioca.
2. **Le persone nel motore**: un eroe diventa una lista di uno, con le misure del banco identiche.
3. **Il secondo eroe**: i mostri, la luce, la scala, la pausa per tutti, lo scontro col compagno, il bottino a turno. Provato col
   banco con due giocatori finti, senza rete.
4. **La regia** e l'incontro che porta l'eroe dell'ospite; la partita finta in due (`npm test`) e il banco della rete.
5. **La vista 2D**: il secondo eroe col nome, il cartello «Aspetto che…», il compagno sul palco, la sala.
6. **La vista 3D**: la scena prende già una lista di cose; un eroe in più.

Il punto 2 è il lavoro più grosso e il più rischioso (il motore della discesa è di quasi 13.000 righe, e l'eroe solo ci sta
dappertutto); i punti 1 e 2 si possono pubblicare senza che si veda niente.

## Da decidere (con l'utente)

- **Quale discesa, a che livello.** Proposta: chi crea sceglie fra le discese che ha già finito, e i mostri hanno il livello della
  zona ([zone.md](zone.md)). Due eroi lontani di livello (8 e 15) giocano lo stesso: il più forte porta l'altro.
- **I mostri più forti in due?** Due eroi contro un branco tarato per uno vincono facile. Proposta: più vita ai mostri in due, alla
  Diablo, tarata col banco a due giocatori finti.
- **La storia in due**: proposta no (sopra). Se sì, una discesa nuova per l'ospite gli chiuderebbe una porta della storia giocata
  con l'eroe dell'altro.
- **Chi è lontano durante lo scontro**: lo guarda (proposta), o può accorrere ed entrare al giro dopo.
