# Il sotterraneo in due (progetto)

Due bambini, due telefoni, la stessa discesa: ognuno col suo eroe e la sua roba, insieme contro i mostri.
**Stato: progetto** (29 ottobre 2026), niente di costruito. L'utente l'ha scelto fra i giochi da mettere in due perché giocarci
insieme è «veramente straordinario», e perché lo scontro è già a turni. Il pezzo comune (il tavolo, il canale, il lockstep, la
sala) è quello di Castle Battle: [../core/insieme.md](../core/insieme.md). Qui c'è quello che il sotterraneo deve dargli.

## Cosa si gioca

- **Una discesa insieme, sotto.** La terra di sopra, i mercanti, le missioni e il diario restano di chi gioca da solo: in due si
  scende e si torna. Il mondo di sopra in 3D e le sue terre sono fuori.
- **Vale per il 2D e per il 3D**: il motore della discesa è uno (`Gioco3d.vue` monta `Gioco.vue` col disegno 3D,
  [grafica-3d.md](grafica-3d.md)). Il 3D accende in più le botti e i copricapi nel bottino, che vanno col seme come il resto.
- **La domanda è di chi tocca**: chi apre la porta, il forziere o la fonte si prende la domanda; l'altro non ne ha.
- **Ognuno porta il suo eroe** dalla sua avventura ([avventure.md](avventure.md)): classe, livello, roba addosso e nello zaino,
  abilità, pozioni. Due eroi della stessa classe vanno bene.
- **Chi crea sceglie il posto e la difficoltà**; il livello lo calcola il gioco dai due eroi (sotto).
- **Si risponde dal proprio telefono, alle proprie domande**: ognuno ha la sua età, i suoi saperi e il suo SRS. Le monete sono di
  chi risponde (🪙1 a risposta giusta, come sempre: [regole.md](regole.md#le-monete)). Nessuno guadagna con le risposte dell'altro.

## Il posto e la difficoltà

Idea dell'utente: si sceglie l'ambientazione, e la discesa si tara sulla forza dei due insieme, con una manopola: «se fanno 100
messi insieme, il dungeon è fatto per 100; facile per 80, difficile per 120, impossibile per 140».

- **Il posto**: uno dei tredici dungeon (le sette discese della storia e i sei nuovi del mondo 3D, `CHIAVI_DEI_DUNGEON` in
  `motore/rigenera.js`), ognuno col suo paesaggio, i suoi abitanti, il caporale e il grosso in fondo. Tutti, anche quelli che
  nessuno dei due ha ancora aperto: non è la storia.
- **La difficoltà**: facile, normale, difficile, impossibile. Nello slot della sala, accanto al posto.
- **Il livello lo calcola il gioco quando partono**, perché serve l'eroe dell'ospite: chi crea sceglie prima che l'altro entri.
  All'inizio si legge «La fornace · difficile · livello 19» sui due telefoni.
- **Il dungeon c'è già**: `tappaDelMondo(chiave, { livello })` fa qualunque posto a qualunque livello, con mostri, bottino e
  piani di una zona ([zone.md](zone.md)). Il lavoro nuovo è solo il livello.

**Il livello della coppia** viene da `motore/forza.js`, che oggi lo fa per un eroe solo ([forza.md](forza.md)): il livello L più
alto in cui l'eroe regge i mostri di L almeno quanto l'eroe che il gioco si aspetta a L. Il conto è quanti turni gli servono per
abbattere un mostro (l'offesa, il «quanto picchia») contro quanti ne regge prima di cadere (la resistenza).

- **Per due**: l'offesa è quella dei due insieme (si abbatte il mostro con i colpi di tutti e due), la resistenza quella dei due
  insieme (i mostri dividono i colpi), confrontate con l'eroe atteso **da solo**. Così in due gli scontri durano quanto da soli.
- **La difficoltà moltiplica l'offesa della coppia** prima del confronto: facile come se picchiassero all'80%, normale al 100%,
  difficile al 120%, impossibile al 140%. A facile il livello scende, a impossibile sale.
- **Il più debole non deve cadere al primo colpo** (proposta): il livello non sale oltre quello in cui il colpo di un mostro
  porta via più di un terzo della sua vita. Senza, un eroe del livello 8 con un amico del 15 sverrebbe a ogni scontro.
- **I numeri si misurano col banco**, con due giocatori finti di livelli diversi: «facile» deve vincere quasi sempre, «impossibile»
  di rado ma non mai.

**Cosa cambia con la difficoltà**: i mostri (vita, colpo, livello), e quindi la roba che cade (del livello del posto) e
l'esperienza. **Le domande no**: ognuno ha quelle della sua età e del suo livello di forza, non quelle del posto (`dif` di
`numeriDelLivello` si calcola per ognuno). **Le monete nemmeno**: una a risposta giusta, a ogni difficoltà. Il premio di
«impossibile» è la roba e l'esperienza, non il pagamento delle risposte.

## Il mondo è uno solo, e non si ferma per una domanda

- **Il motore gira su tutti e due i telefoni col lockstep** (fette fisse da 0,05 s, le mosse applicate dopo 0,6 s), come Castle
  Battle. Chi crea è il primo eroe, l'ospite il secondo. Ogni telefono salva solo il suo eroe.
- **Camminare regge il ritardo**: si tocca dove andare, e l'eroe parte dopo 0,6 s. Il segno della meta si accende subito, sul
  telefono di chi ha toccato, così il tocco non sembra perso. Un tocco che dà un ordine regge mezzo secondo; il dito che guida
  (Survivors) no. Da sentire coi telefoni veri.
- **Da soli, con un foglio aperto non si muove niente** (`Corsa.passo`): una domanda, una porta, un forziere, lo scontro. **In due
  il foglio è di chi lo apre, e il mondo va avanti per l'altro** (l'utente: «se sta rispondendo puoi andare avanti, è solo quando
  sei in uno scontro che conta»). Chi apre la porta resta lì a rispondere; l'altro cammina, e i mostri con lui.
- **Chi risponde non si tocca**: un mostro che lo raggiunge mentre ha una domanda aperta aspetta, e lo scontro parte quando ha
  finito (l'utente: «finirà di aprirla e poi parte lo scontro»). Lo stesso se il compagno apre uno scontro nella sua stanza: chi
  risponde finisce, poi entra. Da soli la regola c'è già, perché col foglio aperto i mostri non si muovono.
- **Dopo uno sbaglio si spiega**, come da soli ([../apprendimento/la-domanda.md](../apprendimento/la-domanda.md)): chi legge è al
  riparo. Niente domanda `svelta`.
- **Si vede cosa fa l'altro**: sopra il suo eroe un segno piccolo mentre risponde (la porta, il forziere), e il suo nome.
- **Il ⏸ ferma tutti e due**, con «Leo ha messo in pausa». È l'unica pausa condivisa, oltre alla scala. Non c'è la
  sosta: una discesa in due non si lascia a metà per riprenderla
  (vedi «Finire», sotto).

## I due eroi nella discesa

- **Il motore oggi ha un eroe solo**, sparso in `Corsa` e `Corredo` (posizione, vita, energia, mana, roba, incanti preparati,
  strada, foglio). Il lavoro grosso è portarlo in **una persona**: la discesa tiene il piano, i mostri e l'orologio, e una lista di
  persone. Da soli la lista ha una persona, e **tutte le misure del banco devono restare identiche** (un test lo controlla, come
  `unita/sotterraneo-strade` tiene fermo il mana).
- **La lista serve anche all'aiutante** che l'utente vuole mettere prima o poi: un alleato mosso dal gioco invece che da un
  bambino. La sua testa c'è già, il giocatore finto di `motore/banco.js`. Le regole dei due eroi (chi entra nello scontro, chi i
  mostri colpiscono, la fila) vanno scritte per «gli alleati», non per «i due bambini».
- **I mostri si svegliano per chi entra nella loro stanza** e vanno verso il più vicino dei due; l'agguato prende alle spalle quello
  che raggiungono. La luce è l'unione dei due coni ([luce.md](luce.md)): un mostro nella luce dell'uno va dritto.
- **L'orologio conta i passi di tutti e due**: i mostri morti tornano prima, la torcia brucia per chi la porta
  ([orologio.md](orologio.md)). Il mana torna a ognuno coi suoi passi.
- **La scala**: si scende quando ci sono tutti e due. Il primo che la tocca aspetta lì («Aspetto Leo alla scala»), e quando arriva
  l'altro si scende insieme. Così il piano nuovo comincia con tutti e due e non c'è un piano per ognuno.
- **Il portale** porta su tutti e due, e finisce la discesa.

## Lo scontro in due

- **Entra chi è vicino**: i mostri entro il raggio da chi apre lo scontro, come oggi ([scontro.md](scontro.md#chi-entra)), e il
  compagno se è nella stessa stanza (se sta rispondendo, appena ha finito).
- **Chi è nello scontro esce dal tempo**: lì si va a turni, e la fila si muove solo agendo. **Chi è lontano** (da confermare con
  l'utente): o continua a camminare, e allora ci possono essere due scontri insieme, ognuno con la sua fila, e chi arriva nella
  stanza di uno scontro aperto entra al giro dopo; o il mondo si ferma anche per lui finché lo scontro non finisce, e lo guarda.
- **Il compagno è già previsto**: la fila ha un `lato` per ogni attore, e il palco ha il posto del compagno sfalsato sotto l'eroe,
  in diagonale (`viste/campo.js`, `[data-posto-compagno]`, oggi spento). Ognuno ha la sua velocità e i suoi turni nella fila;
  `passaIlTurno`, che si ferma al primo del lato dell'eroe, va insegnato a fermarsi a chi tocca.
- **Al suo turno risponde chi gioca quell'eroe**; l'altro vede la scelta e la domanda arrivare («Tocca a Leo»).
- **I mostri colpiscono il più forte** (l'utente). Ogni alleato ha un peso, **pericolosità × vita rimasta in proporzione**, e il
  mostro punta quello col peso più alto. A parità vince l'ordine nella fila, quindi niente caso.
  - **La pericolosità non è il livello**, ma quanto quell'alleato fa male a quel mostro: il danno a turno della formula della
    forza (`offesa` in `motore/forza.js`, con le due abilità forti), contro le difese di quel mostro.
  - **La vita in proporzione fa girare i colpi**: il più forte prende i primi colpi, e quando è ferito il peso passa all'altro. Il
    più debole viene colpito solo quando il forte è già messo male. È anche quello che protegge l'eroe di livello 8 accanto
    all'amico del 15, oltre al tetto della difficoltà (sopra).
  - **Vale per qualunque numero di alleati**: due bambini, o un eroe col suo aiutante, quando ci sarà (sotto). Da soli il
    bersaglio è sempre l'eroe, e non cambia niente.
  - **Si vede a chi mira**: la mossa annunciata (`viste/MossaAnnunciata.vue`, [mosse.md](mosse.md)) dice anche il bersaglio.
    Le regole giuste che a schermo non si capiscono sono un gioco sbagliato.
- **Le abilità che curano o proteggono** possono andare anche sul compagno: oggi «in area» non vuol dire niente perché l'eroe è
  solo ([mosse.md](mosse.md)), in due sì.
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
3. **Il secondo eroe**: i mostri, la luce, la scala, la pausa per tutti, lo scontro col compagno, il bottino a turno, il livello
   della coppia con la difficoltà. Provato e tarato col banco con due giocatori finti, senza rete.
4. **La regia** e l'incontro che porta l'eroe dell'ospite; la partita finta in due (`npm test`) e il banco della rete.
5. **La vista 2D**: il secondo eroe col nome e cosa sta facendo, «Aspetto Leo alla scala», il compagno sul palco, la sala.
6. **La vista 3D**: la scena prende già una lista di cose; un eroe in più.

Il punto 2 è il lavoro più grosso e il più rischioso (il motore della discesa è di quasi 13.000 righe, e l'eroe solo ci sta
dappertutto); i punti 1 e 2 si possono pubblicare senza che si veda niente.

## Da decidere (con l'utente)

- **Il tetto per il più debole** (sopra): un terzo della vita è una proposta da provare.
- **La storia in due**: proposta no (sopra). Se sì, una discesa nuova per l'ospite gli chiuderebbe una porta della storia giocata
  con l'eroe dell'altro.
- **Chi è lontano durante lo scontro**: continua a camminare (due scontri possibili, chi arriva entra al giro dopo), o si ferma e lo
  guarda. Il primo è più vivo; il secondo è più semplice da fare.
