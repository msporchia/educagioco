# Come si fa un livello del Generale

Tutto quello che serve per scrivere un livello, in un posto solo: il
metodo, le regole del mondo, il linguaggio del bambino, il formato del
file, il materiale già disegnato, le misure dello schermo, come si
prova, e le ricette dei personaggi già provate (§12).

> **La regola di questa guida.** Chi scrive un livello legge questa, non
> il motore. Se manca qualcosa, la si verifica (col simulatore, §7.1, o
> nel codice) **e la si scrive qui**, nella sezione giusta: chi viene
> dopo la trova. Un livello fatto da un agente che conosce solo questa
> guida è la prova che la guida basta (§11), e le lacune che quell'agente
> segnala sono la lista di cosa aggiungere.

Le fonti, quando serve andare a vedere: il formato e i campi stanno in
`livello.js`, le fabbriche in `scrivi.js`, le regole in
`src/motore/generale/` (i file sono citati sezione per sezione), il banco
in `test/aiuto/livello.mjs`.

---

## 0. La strada, in nove passi

1. **La sceneggiatura, prima del file.** Dieci righe: chi vuole cosa e
   perché; chi c'è e cosa fa **di suo** (il giro, a cosa reagisce, quanto
   vede); cosa vuol dire vincere; la regola da capire, **detta in una
   frase**; le strade sensate; due modi buffi di sbagliare. Se la regola
   non si dice in una frase, il livello non c'è ancora.
2. **La mappa** (§4.3): tre token, niente cornice di muro, la forma la
   dà il fuori. Grande quanto serve, senza limiti: si scorre (§6).
3. **Il file** (§4): mappa e legenda, personaggi, obiettivo, parole.
4. **Il simulatore** (§7.1): prima `--mappa` per le coordinate, poi le
   soluzioni che hai in mente, poi **una griglia di piani plausibili** —
   da dove, in che ordine, chi parte prima, cosa succede se il bambino fa
   la cosa ovvia. *Come* si scrive un'abitudine lo dicono i meccanismi
   già provati del §12; *quali* abitudini dare ai personaggi lo decide la
   storia, non quell'elenco. Un livello di prova per scoprire una regola
   si fa solo per quello che né il §2 né il §12 dicono, e il risultato si
   scrive qui.
5. **Tarare.** Si sposta una cosa, si cambia un'abitudine, finché: la
   regola si dice in una frase, **le strade sensate vincono tutte**, le
   mosse ingenue perdono ognuna per un motivo che si vede. Un livello
   che vince con un piano su cinquanta, al millimetro, si rifà.
6. **Soluzioni e aiuti** nel file (§4.6, §4.7), poi `npm test`.
7. **In fila, dietro 🧪** (§8).
8. **Build e prova nel browser** (§7.3). La build la lancia solo chi
   coordina, mai un agente.
9. **Il resoconto**: la sceneggiatura, **le strade scritte come piani**
   (ordine per ordine, per personaggio), le mosse ingenue con il motivo
   per cui perdono, i numeri del simulatore (quanti piani provati,
   quanti vincono), cosa c'è di nuovo rispetto ai livelli prima, e cosa
   mancava in questa guida.

---

## 1. Cosa rende buono un livello

Sono le regole uscite da tre mesi di livelli buttati. Ognuna ha una
storia dietro; la più importante è la prima.

- **Un posto, non un indovinello.** Si parte da chi c'è e da cosa fa,
  mai dalla risposta. Scritti a partire dalla risposta («qui serve il
  bivio»), i livelli venivano copie della prova da cui partivano: è il
  motivo per cui il 23 settembre 2026 ne sono stati cancellati venti.
- **Tante cose da fare.** Un livello è una situazione con più cose
  dentro e **una sola regola nuova**. Il piano dev'essere un lavoro, non
  un gesto: più obiettivi in fila (prendi, apri, porta), distanze vere,
  due o tre personaggi nostri con mestieri diversi. Il verdetto sulla
  prima pagina della torta: «vai, fai rumore, arriva, prendi, torni» è
  **troppo corto**, con pochi attori e una mappa minuscola.
- **Attori che si toccano fra loro.** Un personaggio che reagisce a un
  altro (il lupo abbaia, il cuoco accorre) fa nascere catene di causa ed
  effetto. È il sapore cercato, alla Day of the Tentacle: «la segretaria
  che si distrae, così entri». Scriptato, ma non banale.
- **La regola si dice in una frase** («chiamalo dal lato ovest»).
- **Più strade, se sono sensate.** Ogni strada nasce da un'abitudine di
  un personaggio: un cuoco che accorre quando lo chiamano, che batte il
  mestolo, che vede poco, dà tre strade. **Non si inventano strade
  assurde per fare numero**: se la strada sensata è una, è una.
- **Le mosse ingenue perdono, ognuna per un motivo che si vede**
  (`motivoSconfitta`, e il registro dice chi ha visto chi).
- **Le regole del mondo valgono sempre.** Chi è ostile e ti vede ti
  viene addosso, in ogni livello (§2.5). Un mondo che non si prevede non
  si programma: niente regole che valgono qui e non là.
- **Gli oggetti fanno più di una cosa.** L'osso che distrae il lupo
  occupa anche una mano; la chiave apre, e la porta cigola.
- **Le regole generano il gioco.** Le due mani, la porta che toglie la
  vista ma non il suono, il rumore che attira: le sequenze nascono da
  lì, senza inventare enigmi.
- **Niente punti-tappa.** Se la soluzione è una fila di `vai [posto]`, è
  un percorso ricalcato col dito. Le decisioni sono *cosa* prendere,
  aprire, chiudere, e *quando*.
- **Niente scene finte.** `prove: 1` finché non c'è davvero qualcosa da
  indovinare (§4.8): tre scene che non cambiano il piano sono un'attesa.
- **Lo stesso ostacolo, un'altra faccia.** L'orco che mena e la
  segretaria che sgrida sono lo stesso meccanismo; `arma.gesto`
  («prende a mestolate», «sgrida») cambia come si racconta.
- **Un divieto si spiega con le parole del mondo** (`nonRiesce`: «io non
  rubo: sono la principessa!»), o si toglie e resta la conseguenza.
- **Non si fa il debug del piano di un altro.** Leggere la scheda di un
  personaggio per capire com'è fatto sì; trovare l'errore nel suo piano
  no.
- **Si dice solo quello che la mappa non mostra.** La `dritta` dice cosa
  vuol dire vincere; il `racconto` sono due frasi; quello che si scopre
  toccando un personaggio è materia da aiuto.
- **Il banco misura il rigore, non l'interesse.** Passare `npm test` è
  il minimo, non la prova che il livello valga qualcosa.

### Trucchi di mappa, trovati tarando

- **Due corridoi invece di uno**, per chi non si deve incontrare: nella
  dispensa della pagina 2, con un corridoio solo la ladra e il lupo si
  incrociavano sempre, e il piano diventava un balletto al battito.
- **Una scorciatoia che aggira un oggetto lo rende inutile.** Con una
  porta dalla camera al cortile, la chiave del cortile si raccoglieva per
  niente: si chiude la scorciatoia, e l'oggetto torna a servire.
- **Una coincidenza di tempi non è una regola.** Se una strada vince
  perché un rumore cade due battiti prima di un altro, si sposta
  qualcosa finché vince per un motivo che si può dire.
- **Da dove parte chi non è nostro** sposta i tempi di tutto: è la prima
  manopola da provare quando una strada vince per caso. Quando la storia
  le fissa (una pagina che parte da dove ha finito l'altra), restano le
  soste (`aspettaUnPo`), la vista, la voce dei segnali e dove stanno le
  cose; e si prova con `--confronta` o `--manopole` (§7.1) se una
  manopola conta.
- **Un guardiano che si può far chiamare a ogni battito del suo orologio
  è via metà del tempo**, e un piano fatto a metà (la ladra che non
  aspetta niente) vince per caso una volta su tre. La torta l'ha risolto
  mettendo il suo giro **sulla strada** (il pentolone accanto al
  corridoio della camera): nessun momento del giro è libero, si passa
  solo chiamandolo.
- **«Chiama subito» e «chiama solo al mestolo» hanno fasi diverse**: una
  griglia le prova tutte e due, se no i piani fortunati cadono nella fase
  che non si è provata.

### Cosa sa già chi arriva

Il tutorial (i sei livelli pubblicati, un blocco solo nella fila:
«il tutorial — un comando per volta») insegna un costrutto per prova, in
quest'ordine:

| livello — `impara` | id | cosa insegna |
|---|---|---|
| Il primo ordine — azioni base | `primo` | un verbo e una cosa: `apri [il forziere]` |
| La chiave e il portone — aprire le porte | `chiave` | prima la chiave, poi la porta: la sequenza |
| Lo sgombero del mulino — l'inventario | `parole-due-chiavi` | tre cose da portare e due mani: `posa` |
| Due strade — le scelte | `due-strade` | guarda prima di scegliere: il `se` con `vedi`, su tre scene |
| Mettetevi d'accordo — i segnali | `attesa` | due personaggi: uno `suona`, l'altro `quando senti` |
| Il richiamo — il rumore | `richiamo` | fai rumore lontano da dove devi passare |

Nessun livello insegna ancora `ripeti`, `aspetta che`, le azioni con
`esegui`, `parla`, `chiudi`, le leve, `attacca`, il buio. Dopo il
tutorial vengono le **storie a puntate** (§9), dove i costrutti lavorano
insieme.

---

## 2. Le regole del mondo

### 2.1 Il tempo

- La scena va a **battiti**. A ogni battito ognuno fa un passo del suo
  ordine: una casella, o un gesto (prendere, aprire, suonare).
- Tutto è **deterministico**: stesso piano, stesso esito. Niente caso.
- Finisce quando `perde` è vero (si guarda per primo), quando `vince` è
  vero, quando nessuno ha più niente da fare né da ascoltare («gli
  ordini sono finiti»), quando uno dei nostri è piantato su un'attesa
  che non arriverà (stallo, e si dice quale), o dopo **300 battiti**
  (`PASSI_MASSIMI`, `motore/generale/partita.js`). Un nemico con un giro
  infinito tiene viva la scena: a chiuderla è l'obiettivo o il tetto.
- Un ordine che non si può fare (mani piene, una chiave che non si ha)
  **si rifiuta**, lo scrive nel registro con il perché, e la fila passa
  all'ordine dopo.
- ⚠ Ma un ordine verso una cosa **che non si raggiunge** (la strada è
  chiusa, per esempio da una porta che nessuno apre) non si rifiuta: il
  personaggio **resta fermo ad aspettare** che qualcuno apra, fino a 25
  battiti, e poi la sua fila si ferma. Se l'ordine sta dentro un
  ascolto, gli altri ascolti aspettano in fila che finisca.

### 2.2 Muoversi

- **Quattro direzioni**, una casella a battito, per la strada più corta:
  `vai` gira intorno ai muri da sé. Due personaggi possono stare sulla
  stessa casella: nessuno blocca nessuno.
- `vai` a un posto o a un oggetto: ci sale sopra. A un personaggio o a
  una porta chiusa: si ferma accanto. A una casella `'x,y'`: ci va (le
  caselle si toccano sulla mappa; `celle: true` è di serie).
- Verso un personaggio si va solo se lo si vede, o lo si è visto: allora
  si va dove lo si è visto l'ultima volta. Verso uno **mai visto**
  l'ordine si rifiuta («non so dov'è») e la fila va avanti.
- `vai` a una porta **aperta** sale sulla sua casella (su una chiusa ci si
  ferma accanto): «vai alla porticina» è un posto dove aspettare.

### 2.3 Vedere

- La vista si misura **in passi di cammino**, non in linea d'aria
  (`distanze/a-cammino.js`): un muro in mezzo allunga la strada, e quindi
  la vista. Non c'è un cono e non c'è una direzione in cui si guarda.
  Muri, fuori, mobili e **porte chiuse** fermano la vista; una porta
  chiusa acceca tutti e due i lati.
- `vista` di serie **4** (mezza stanza). Il bambino la vede: dove un
  nemico guarda, la mappa è rossa.
- Chi vede qualcuno si ricorda dove l'ha visto.
- **Il buio.** `vistaAlBuio: n` nel livello abbassa a n la vista di
  tutti. Chi sta nel cerchio di una lanterna (`raggio` di serie 3, in
  passi) ci vede come sempre **ed è visto da lontano** da chiunque: la
  luce che ti fa vedere è la stessa che ti fa scoprire. Una lanterna si
  porta (e occupa una mano) o si posa, e fa luce dove sta.

### 2.4 Sentire

- `suona [segnale]` è **rumore**: si sente **in linea d'aria, attraverso
  i muri**, fino alla `voce` del segnale — di serie 20; un cigolio 5,
  «aiuto» 30, un fracasso 40 (`SEGNALI` in `motore/generale/mondo.js`).
  La linea d'aria è quella vera (`Math.hypot`): con voce 5 si sente a
  (5,0) di distanza e non a (5,1). Sulla mappa si vede dove parte.
- `parla [segnale]` **non fa rumore**: arriva solo a chi chi parla
  **vede** in quel momento, nemici compresi se li ha davanti
  (`messaggi/voce.js`).
- Un segnale arriva alla fine del battito in cui parte, dopo che tutti
  hanno fatto il loro passo: chi lo sente si muove dal battito dopo. Lo
  stesso per il comando di una leva.
- **Le porte fanno rumore da sole.** Aprirne una con la chiave o a mano
  **cigola**: è il segnale `'cigolio'` (o quello che la porta dichiara
  in `cigolio`), voce 5, e parte **dalla porta**, non da chi apre.
  Sfondarla fa il suo `rumore` una volta sola; anche una porta aperta da
  una leva cigola. Un personaggio ci reagisce con
  `quando.senti('cigolio', …)`; per dargli un nome nella scheda si mette
  `cose.segnale('cigolio', 'il cigolio di una porta', { voce: 5 })` fra i
  `segnali`, e **non** fra i `complementi` (vedi sotto).
- ⚠ **Chi ha `suona` può suonare qualunque segnale fra i
  `complementi`.** Un segnale che il bambino deve poter *ascoltare* (per
  scrivere `quando senti il mestolo`) è anche un segnale che può
  *fingere*: la principessa che batte il mestolo di Grugno. Si decide
  livello per livello se è una strada o un buco; non c'è modo di dire
  «questo lo senti ma non lo fai».
- `se.sentito(x)` chiede a chi guarda se l'ha sentito **lui**; nelle
  condizioni del livello vuol dire «è stato mandato».

### 2.5 Chi fa cosa: piani, ascolti, reazioni

- Un nostro personaggio ha **una fila** (il piano) e degli **ascolti**
  (`quando senti X`): un secondo punto d'ingresso, che parte ogni volta
  che X arriva e si riarma quando ha finito (è il «un colpo per
  mestolo» della cucina).
- **Un ascolto interrompe, come una reazione.** Se X arriva mentre il
  personaggio sta camminando o aspettando, lascia quello che sta
  facendo, fa la fila dell'ascolto, e poi torna al punto del piano in
  cui era. È la stessa regola del nemico che ti vede mentre cammina
  (deciso dall'utente il 23 settembre 2026; prima il segnale arrivato a
  personaggio occupato andava perso).
- ⚠ Se **lo stesso ascolto** sta ancora girando quando X arriva di
  nuovo, quel segnale non lo fa ripartire: va perso (lo strumento lo
  segnala, §7.1). Due ascolti **diversi** invece si mettono in fila: il
  secondo aspetta che il primo finisca.
- ⚠ **La trappola dei piani in due tempi.** Due ascolti armati sullo
  stesso segnale partono **tutti e due** alla stessa chiamata: il secondo
  si mette in fila e gira dopo, con un segnale ormai vecchio. E un
  ascolto finito riparte al segnale dopo **rifacendo tutti i suoi
  ordini**. Per «alla prima chiamata vai, alla seconda torna» si scrive
  la prima parte nel piano (`aspetta che è arrivata la chiamata`, poi
  l'andata) e **in fondo** l'ascolto del ritorno: si arma quando la fila
  ci arriva, quindi sente solo le chiamate dopo (è la strada della torta).
- **Un ascolto si arma quando la fila ci arriva.** `quando senti` è un
  ordine come gli altri: finché la fila non ci passa, quel segnale non lo
  ascolta nessuno, e quelli arrivati prima non contano. Messo dopo
  un'attesa, ascolta solo da lì in poi: è il modo di scrivere «prima
  questo, poi aspetta quello».
- ⚠ **«È arrivato X» vuol dire «è mai arrivato».** Una volta sentito
  resta vero: un secondo `aspetta che è arrivato il mestolo` riparte
  subito. Per aspettare **il prossimo** si usa `quando senti`.
- **Gli ascolti stanno solo in cima al piano.** Nell'editor un `quando
  senti` non si mette dentro un altro, né dentro un `se`, un ciclo o
  un'azione. Due ascolti uno dopo l'altro sì: una soluzione dichiarata
  deve avere la stessa forma, se no il bambino non la può scrivere.
- Un personaggio del livello ha un **piano** (`fa: [...]`, gli stessi
  ordini del bambino, di solito un `fai.ripeti([...])` che non finisce) e
  delle **reazioni** (`reagisce: [...]`) che **lo interrompono** e poi lo
  rimettono dov'era. Quello che vede (`quando.vedi`, priorità 20) passa
  davanti a quello che sente o che lo colpisce (`quando.senti`,
  `quando.colpito`, 10), che passa davanti al piano (0). Una reazione non
  riparte mentre sta già girando.
- ⚠ **A parità di priorità vince quella che sta già girando**, e l'altra
  **aspetta che finisca, non si perde**: un cigolio sentito mentre Grugno
  corre alla chiamata parte dopo il suo «torna dov'eri». Con due `quando.vedi`
  vuol dire: **vince chi ha visto per primo**. E una reazione a vista si riarma a ogni battito
  finché il bersaglio resta in vista: l'oca che «quando vede Micio gli va
  dietro» resta occupata finché vede Micio, e non becca la ladra nemmeno
  se le passa accanto. È il modo di scrivere una guardia distratta
  (ricetta 7), ma **la scheda non lo mostra**: va detto in un aiuto o
  nel racconto.
- Dentro una reazione ci sono due bersagli che nessuno può scrivere
  prima: `dove.hoSentito` (da dove è partito il rumore) e `dove.ero`
  (dove stava quando l'hanno interrotto). `reagisce.alRumore(segnale,
  { sosta, torna })` è la scorciatoia «corre al rumore, si guarda
  intorno `sosta` battiti, torna».
- ⚠ **Una reazione a vista tiene occupato anche quando non fa niente.**
  Si riarma a ogni battito finché il bersaglio resta in vista: Zanna con
  l'osso in bocca («se ha l'osso: niente») resta ferma a guardare la
  ladra, e smette perfino di mangiare, finché la vede.
- **Una reazione fa solo i suoi ordini.** Interrompe il piano e lo
  riprende dopo, ma non fa le cose del piano: Zanna che al mestolo va
  alla ciotola **non raccoglie** l'osso che c'è, perché raccoglierlo è del
  suo piano (ricetta 5), non della reazione (ricetta 8). Due meccanismi
  non si sommano da soli: si prova.
- Una reazione può contenere un `fai.bivio`, e la scheda la legge coi
  suoi due rami: «quando vede la ladra: se ha l'osso: niente; se no:
  morde la ladra».
- Le reazioni `quando.vedi` scattano **solo su personaggi** (un id o una
  schiera), mai su un oggetto.
- **L'istinto.** Ogni personaggio ostile (`chi.nemico`, `chi.orco`,
  `chi.guardia`) che non ha un suo `quando.vedi` riceve dal motore
  «quando vede i nostri, li attacca» (`conIstinto` in
  `motore/generale/allestimento.js`), e la scheda lo mostra. Scriverne
  uno proprio **lo sostituisce**: è il modo di dire «guarda solo la
  ladra» o «se ti vede abbaia invece di mordere». `chi.terzo` non è
  ostile e non ha istinto.
- `grida: 'segnale'` su un personaggio: la prima volta che vede
  qualcuno di un'altra schiera, o che lo colpiscono, grida quel segnale.
  Una volta sola per scena.
- `mostraNemici: true` nel livello: i piani dei personaggi del livello
  **si leggono** toccandoli, dall'inizio. Senza, restano chiusi 🔒. Nelle
  storie serve sempre: le abitudini sono la cosa da leggere.

### 2.6 Attaccare

- `attacca` va verso il bersaglio e colpisce quando è a portata: di
  serie **accanto**, danno 1. `arma: { danno, portata, tira: true }` per
  chi colpisce da lontano (portata di serie 5, in linea d'aria); `gesto`
  per come si racconta.
- `vita` di serie 3. Con `vita: 1` si cade al primo colpo: «se ti vede,
  ti becca», senza inseguimenti alla pari che non vince nessuno.
- La preda si sceglie una volta. Se sparisce dalla vista si va dove la
  si è vista; arrivati lì senza vederla, si lascia perdere.
- Le cose si rompono solo se hanno una `resistenza`: `attacca` le
  sfascia e `se.rotto` lo chiede. Le porte non si attaccano: si sfondano
  (`forza`).
- Chi viene colpito fa partire le sue reazioni `quando.colpito`.

### 2.7 Le mani e le cose

- **Due mani e tre tasche.** La roba piccola (`tasca: true`: le chiavi,
  di serie) va in tasca; il resto occupa una mano. La terza cosa in mano
  si rifiuta: «prima devo posare qualcosa». È la regola da cui nascono
  le sequenze (lo sgombero del mulino ci vive sopra).
- `posa` lascia la cosa sulla casella dove si sta, e chiunque passi la
  può prendere. `se.qui(cosa, posto)` è vero solo per una cosa **per
  terra** su quel posto: è così che si vince portando roba.
- Una cosa in mano a qualcuno sta dove sta lui: `vai [la chiave]` segue
  chi la porta.
- Un oggetto con `arma` cambia come colpisce chi lo prende.
- ⚠ **Si parte sempre a mani vuote.** `zaino` è accettato dalla fabbrica
  ma il motore non lo legge. Chi deve partire con qualcosa lo trova
  sulla sua casella, e il suo primo ordine è `prendi`.

### 2.8 Porte e congegni

- Una porta (`elementi/porta.js`) si scrive con: `chiave` (l'id
  dell'oggetto che la apre), `forza` (quante spallate), `aMano: false`
  (si apre solo con un congegno), `aperta` (parte aperta), `rumore` (il
  segnale dello sfondare), `cigolio` (il segnale del suo cigolio, se
  nella scena ce n'è più d'una da distinguere). Fabbriche: `cose.porta`,
  `cose.grata` (ferro), `cose.saracinesca`, `cose.botola` (pietra),
  `cose.forziere` (una porta che non si attraversa: si apre).
- `apri` si fa da accanto, e chi ha la chiave apre subito. `chiudi` pure,
  ma non con qualcuno sulla soglia. Una porta chiusa ferma la vista, non
  il suono. Anche un personaggio del livello può chiudere e aprire nel
  suo piano, e chiedersi `se.aperto(porta)` (provato, non ancora usato).
- `cose.leva({ collegata: [id] })`: `premi` apre le porte collegate al
  battito dopo, **una volta sola**. `cose.totem({ tacche: n,
  collegata })`: apre alla n-esima pressione, e `se.almeno(totem, n)` ne
  legge il conto.
- I colori dei sigilli (quale chiave per quale porta) li mette il
  motore. Una porta con una `chiave` che non esiste si disegna sbarrata.

### 2.9 Cosa si può sapere

- Un personaggio sa quello che vede, più i segnali che gli arrivano.
  Una domanda su una cosa che non vede non ha risposta: ⚠ `aspetta che`
  su una cosa fuori vista **non aspetta**, dice «non posso saperlo» e
  passa all'ordine dopo.
- Le condizioni del livello (`vince`, `perde`) guardano tutto dall'alto.
- `se.qui` non guarda la vista: nel piano di un personaggio del livello
  è il modo di dire «lo sente dall'odore» (il lupo che sa dov'è l'osso).

---

## 3. Il linguaggio del bambino

| verbo | cosa fa | grado |
|---|---|---|
| `vai a` | cammina fino a una cosa, a un personaggio, a una casella | 1 (2 se punta a una cosa da fare) |
| `prendi` · `posa` | in mano, e giù dove sei | 2 |
| `apri` · `chiudi` | porte, grate, forzieri | 2 |
| `premi` | leve e totem | 2 |
| `attacca` | un personaggio, una schiera (con `quale`: il più vicino, il più lontano, quello messo peggio, quello più in forze) o una cosa rompibile | 2 |
| `aspetta che` | si ferma finché una domanda diventa vera | 2 |
| `suona` · `parla` | un segnale: rumore a tutti, o sottovoce a chi vedi | 2 |
| `quando senti` | un ascolto: quando arriva quel segnale, fa questa fila | 3 |
| `esegui` | chiama un'azione (una fila con un nome) | 3 |

**Ogni verbo che punta a una cosa ci cammina da sé**: `prendi la farina`
va fino alla farina e la prende, `apri la porta` si ferma accanto e apre,
`premi` va alla leva, `attacca` insegue. `vai` serve a fermarsi in un
posto (una soglia, una casella da cui guardare o da cui farsi vedere).

I **blocchi**: la *condizione* (`fai.bivio`) guarda una volta e prende uno
dei due rami — dentro un ramo non ci va un'altra condizione, ci va un
`esegui`; il *ciclo* (`fai.ripeti(corpo, smetti)`) rifà il corpo e smette
quando la domanda diventa vera, guardata a ogni battito; l'*azione*
(`fai.azione(nome, corpo)`) è una fila con un nome, e parte con `esegui`.

Le **domande** che il bambino può comporre sono quattro, e nascono dalle
cose che il livello nomina (`domande/quali.js`): *vedi / non vedi*
[personaggio o schiera], *hai / non hai* [oggetto], *è arrivato / non è
arrivato* [segnale], [cosa] *è rotta / è intera*. Non ci sono contatori di
battiti, né «la porta è aperta», a meno che il livello non le detti in
`condizioni`: il bambino aspetta **fatti**, non tempi.

Le **manopole**. Del livello: `verbi` (la cassetta), `complementi` (cosa
si può nominare: da lì discendono anche verbi e domande; senza, tutto),
`celle`, `condizioni`. Del personaggio: `sa` (i verbi che conosce) e
`nonRiesce: { verbo: 'la frase del perché' }`.

Le **regole di lingua** già decise: `vai` sposta e non ottiene (la cosa
si prende con `prendi`); una schiera si sceglie da un elenco, non si
indica col dito; l'uscita di un ciclo si legge «smetti quando»; un verbo
che non porta da nessuna parte non si offre; nel tutorial si comanda
sempre il buono.

---

## 4. Scrivere il file

### 4.1 Dove, e l'id

`src/data/livelli/<serie>/<n>-<nome>.js`, con `export const NOME =
livello({ … })` e `export default NOME`. L'**`id` è la chiave dei
progressi**: una volta pubblicato non si rinomina mai. `livello()` rifiuta
i campi che non esistono (e suggerisce quello giusto), le mappe storte e i
token senza legenda; le fabbriche rifiutano le opzioni sconosciute.

### 4.2 Lo scheletro

```js
import { livello, campo, cose, chi, fai, se, quando, dove, reagisce, aiuto,
         suoli, muri, arredo } from '../scrivi.js'

/* i nostri: chi comanda il bambino */
const ladra = chi.nostro('ladra', 'la ladra', { corpo: 'ladra', vista: 5, vita: 1,
  sa: ['vai', 'prendi', 'posa', 'aspetta', 'quando'] })

/* i segnali: non stanno sulla mappa, si dicono */
const chiamata = cose.segnale('chiamata', 'Grugno!', { em: '📣', col: '#e8a33f', voce: 30 })

/* le cose */
const forno = cose.posto('forno', 'il forno')
const chiave = cose.chiave('chiave', 'la chiave della dispensa')

/* quelli del livello: un giro che non finisce, e le reazioni */
const cuoco = chi.orco('grugno', 'Grugno', { vista: 3, vita: 40,
  arma: { nome: 'il mestolo', tira: true, portata: 3, gesto: 'prende a mestolate' },
  reagisce: [quando.vedi('ladra', [fai.attacca('ladra')]),
             quando.senti('chiamata', [fai.vai(dove.hoSentito), fai.aspettaUnPo(4), fai.vai(dove.ero)])],
  fa: [fai.ripeti([fai.vai(forno), fai.aspettaUnPo(3), /* … */])] })

export const SCENA = campo([
  '  |  |  |  |  |  ',
  '  |..|..|FO|..|  ',
  '  |LA|..|CH|..|  ',
  '  |  |  |  |  |  ',
], { FO: [forno, cuoco], LA: ladra, CH: chiave })

export const MIO = livello({
  id: 'serie-nome', nome: 'Il nome', idea: 'la regola, in una riga',
  dritta: 'Obiettivo: <b>…</b>.',                 // cosa vuol dire vincere
  racconto: 'Due frasi di storia.',
  aiuti: [aiuto.dice('…'), aiuto.scrive({ ladra: [/* … */] }, '…'), aiuto.svela()],
  ambiente: 'camminamento', prove: 1,
  scena: SCENA,
  segnali: [chiamata],
  celle: true,
  complementi: ['chiave', 'forno', 'grugno', 'chiamata'],
  verbi: ['vai', 'prendi', 'suona', 'quando', 'aspetta'],
  vince: [se.ha(ladra, chiave), se.qui(ladra, 'camera')],
  perde: [se.caduto(ladra)],
  motivoSconfitta: 'Grugno ha visto la ladra.',
  mostraNemici: true,
  soluzioni: [{ nome: 'la chiamata', piano: { /* id → [ordini] */ } }],
})
export default MIO
```

L'esempio completo, con la storia della taratura in testa, è la torta:
`livelli/torta/1-andata-e-ritorno.js`.

### 4.3 La mappa

- Una riga è una stringa di **token da due caratteri** separati da `|`;
  tutte le righe hanno la stessa larghezza. `x` è la colonna, `y` la
  riga, da 0.
- **Tre token di serie**, senza legenda: `..` pavimento, `##` muro, due
  spazi **il fuori** (`DI_SERIE` in `livello.js`). Per il gioco il fuori
  è un muro; a schermo è nero.
- **Niente cornice.** Il muro vero sta solo dove serve: fra due stanze,
  attorno a una porta, dove qualcosa ci sta appeso. Tutto il resto è
  fuori, ed è il fuori che dà la forma al posto: nicchie, corridoi che
  girano, stanze che non sono rettangoli in un rettangolo. Con una
  cornice di mattoni ogni mappa sembrava un edificio solo, e il nero in
  mezzo si leggeva come un buco (`docs/mappe.md` per il resto).
- **La legenda** dà un token a ogni cosa: `{ FO: forno, LA: ladra }`.
  Una voce può essere una **lista**, per due cose sulla stessa casella
  (`FO: [forno, grugno]`: Grugno parte dal forno), anche con un pavimento
  dentro: `CH: [suoli.mattonelle(), chiave]` è la chiave sopra le
  mattonelle.
- **Pavimenti e muri di un altro materiale** sono token come gli altri:
  `{ mm: suoli.mattonelle(), '==': suoli.lastre(), LL: muri.legno() }`.
  Un suolo resta pavimento, un muro resta muro: cambia solo il disegno.
- **L'arredo occupa la casella**: `arredo.tavolo()`, `arredo.botte()`.
  Per il gioco è un muro (non ci si passa, la vista si ferma), ed è
  giusto: quello che si vede ingombrare, ingombra. `arredo.niente()`
  dice «qui non va niente», nemmeno l'arredo automatico.
- La `scenografia` è solo disegno: `[{ che: 'ossa', x, y }]`. La regola
  del banco: la roba **piatta** (ossa, pozzanghera, acqua, ragnatela,
  binario) sta su una casella di **pavimento**; quella **con un volume**
  (torcia, bandiera, cartello, e tutto l'elenco `INGOMBRANTI` di
  `grafica/oggetti/indice.js`) sta su una casella di **muro** — un muro
  vero accanto al pavimento, non il fuori, dove finirebbe nel nero. Mai
  su una casella usata dal gioco, mai fra i `complementi`. Un mobile che
  si vede ingombrare è arredo, non scenografia.

### 4.4 I personaggi

`chi.nostro` (comandato dal bambino), `chi.nemico` / `chi.orco` /
`chi.guardia` (del livello, ostili, con istinto), `chi.terzo` (del
livello, non ostile). Si scrive `chi.nostro('id', 'come si chiama', {…})`.

Opzioni: `corpo` (il disegno, §5), `emoji` (la faccina nei piani: va
scritta per `principessa`, `topo`, `falena`, che non ce l'hanno di
serie), `vista` (4), `vita` (3), `sa`, `nonRiesce`, `fa` (il piano),
`reagisce` (le reazioni), `arma` (`{ nome, danno, portata, tira, gesto }`),
`grida`, `mani` (2), `tasche` (3), `schiera`/`schieraNome` (per nominare un
gruppo: «gli orchi»), `parte`. (`zaino` c'è ma non funziona: §2.7.)

### 4.5 Le cose

| fabbrica | cos'è | opzioni |
|---|---|---|
| `cose.posto` | un punto con un nome: ci si va | `pittore` (una faccia: `'legno'`, `'cespuglio'`…), `em` |
| `cose.oggetto` | una cosa da prendere | `pittore`, `em`, `tasca`, `arma`, `raggio` |
| `cose.chiave` · `osso` · `pane` · `corda` · `tesoro` · `pugnale` · `spada` · `lanterna` | oggetti già vestiti | come sopra |
| `cose.porta` · `grata` · `saracinesca` · `botola` · `forziere` | cose che si aprono | `chiave`, `forza`, `aMano`, `aperta`, `rumore`, `cigolio`, `stile` |
| `cose.leva` · `cose.totem` | congegni | `collegata`, `tacche` |
| `cose.segnale` | un segnale (va nella lista `segnali`) | `em`, `col`, `voce` |
| `cose.segnaposto` | un posto che una scena riempie (§4.8) | |

Un oggetto nuovo si veste con un pittore esistente: la farina è
`cose.oggetto('farina', 'la farina', { pittore: 'sacco', em: '🌾' })`.
Anche un **posto** può avere un disegno, con lo stesso elenco di nomi
(§5): `cose.posto('nido', 'il nido', { pittore: 'cesta' })`. Si disegna
sotto i piedi, perché su un posto ci si sale. Senza `pittore` il posto è
invisibile, e si riconosce solo dalla sua `em` nelle frasi.

### 4.6 Le soluzioni

`soluzioni: [{ nome, piano: { idPersonaggio: [ordini] } }]`. Il banco le
**gioca** (§7.2). Un piano scritto dal livello usa le stesse fabbriche del
bambino: `fai.vai(forno)`, `fai.vai('11,6')`, `fai.quando(chiamata, …)`,
`fai.aspettaChe(se.nonVedi(grugno))`, `fai.bivio(se.ha(ladra, chiave),
[…], […])`, `fai.ripeti([…], se.vedi('orco'))`, `fai.azione('a1', […])` con
`fai.esegui('a1')`, `fai.parla(chi, segnale)`.

- Una soluzione normale deve vincere su tutte le scene, e **ogni suo
  ordine dev'essere necessario**: togliendone uno qualsiasi, perde.
- `lunga: true`: vince ma costa di più — **più ordini** della soluzione
  normale più corta, non più battiti — e lì un ordine si può togliere.
- `fragile: true`: la tentazione, che vince una scena e ne perde un'altra.
- **La prima soluzione normale è quella che l'ultimo aiuto svela.**
  Mettici quella che vuoi mostrare.

### 4.7 Le parole

- `nome`, e `idea`: la regola in una riga (la dice il cartello del 💡,
  e la fila la scrive sotto il nome).
- `impara`: cosa si impara, **in due parole** («azioni base», «aprire le
  porte», «l'inventario»). La fila la scrive accanto al nome; sta a parte
  dal `nome` perché il nome va anche nella barra del gioco, dove sul
  telefono ci stanno una ventina di lettere. Ce l'hanno le prove del
  tutorial; una pagina di storia ne ha una se insegna un comando nuovo.
- `dritta`: cosa vuol dire vincere, in grassetto (`<b>…</b>`).
- `racconto`: due frasi di storia. Si dice solo l'invisibile: cosa vuol
  dire vincere, chi non vede cosa, i numeri che decidono («cade al primo
  colpo»).
- `motivoSconfitta`: la frase quando si perde per `perde`. È **una
  sola**: con più guardie le nomina tutte («Grugno col mestolo, Zanna coi
  denti o Berta col becco»); chi ha preso chi il bambino lo legge nel
  registro, e chi scrive il livello con `--perche` (§7.1).
- `aiuti`: **una scala sola**, a gradini, e si paga in monete
  (`src/giochi/aiuti.js`):
  - `aiuto.ragiona('…')` — **gratis**, e ce ne vogliono **due**, in testa.
    Fanno ragionare e non dicono la risposta: il primo dice cosa chiede
    il livello e cosa lo rende difficile («Il forziere sta dietro il
    portone, e il portone è chiuso a chiave: il livello chiede tre cose,
    e ognuna ha bisogno di quella prima»), il secondo la domanda giusta
    da farsi, o come provarci («Per ogni cosa chiediti: cosa serve per
    farla? E quando ci arriva, ce l'ha già?»). Se leggendolo si potesse
    scrivere il piano senza pensare, è un indizio;
  - `aiuto.dice('…')` — un **indizio**, 🪙10: una cosa concreta da
    guardare o da fare. Da largo a stretto;
  - `aiuto.scrive({ id: [ordini] }, '…')`, `aiuto.forma()`, `aiuto.svela()`
    — scrivono nel piano, a 🪙50 · 100 · 200 (l'ultimo costa sempre 200).
    La frase che spiega un pezzo appena comparso va **dentro il pezzo**, non
    in un gradino dopo: la scala sale e non scende.
  Se non dichiari nessun gradino che scrive, il gioco aggiunge da sé un
  pezzo (la prima metà di ogni fila della soluzione), la forma e la
  soluzione. Se la prima metà della soluzione è già tutta la lezione
  (come in «Due strade», dove è il bivio), dichiara `aiuto.forma()`: così
  il pezzo di serie non c'è. Scala tipica: cosa chiede → la domanda →
  guarda questo → nota quest'abitudine → un pezzo di piano → la forma →
  tutto. Il banco (`unita/piano-generale`) pretende due `ragiona` in
  testa e una scala che sale.

### 4.8 Più scene (le varianti)

Solo se c'è qualcosa da indovinare: il piano si firma prima di sapere
quale scena tocca, e così un piano che ricalca le mete cade. Si scrive
`prove: 3` e `varianti: [{ nome, metti: { k1: chiave } }, …]`: la mappa ha
dei `cose.segnaposto()` (`k1`, `k2`…) e ogni scena ne riempie uno. Una
variante può anche ridisegnare la mappa (`scena: campo([...])`, e la
legenda si eredita). Senza varianti la scena è una: `prove: 1`.

### 4.9 Le condizioni di fine

`vince` e `perde` sono liste: servono **tutte** vere.
`se.ha(chi, cosa)`, `se.nonHa`, `se.qui(chi o cosa, posto)`,
`se.aperto(porta)`, `se.chiuso`, `se.caduto(chi)`, `se.vivo`,
`se.sentito(segnale)`, `se.premuto(leva)`, `se.almeno(totem, n)`. L'«o
questo o quello» si scrive `{ cond: 'oppure', fra: [ … ] }`, e
`{ cond: 'entrambe', fra: [ … ] }` dentro un `oppure`.

---

## 5. Il materiale

Si usa quello che c'è: uno sprite nuovo è un lavoro a parte, da proporre.
Un nome cambiato fa già metà del lavoro (l'orco diventa il cuoco Grugno).

- **Corpi** (`grafica/personaggi/`): capitano, cavaliere, elfo, falena,
  gatto, goblin, guardia, ladra, lupo, mago, orco, orso, papera,
  principessa, scheletro, topo.
- **Oggetti da prendere** (pittori): chiave, gemma, moneta, mappa,
  pergamena, pozione, libro, bacchetta, scudo, elmo, stivali, pane,
  corda, secchio, martello, piccone, pugnale, spada, corona, spazzola,
  campana, tamburo, corno, lanterna, torciaMano, ossa, sacco, cesta.
- **Arredo** (occupa la casella): botte, barile, cassa, sacco, tavolo,
  carrello, colonna, altare, fontana, pozzo, braciere, falo, cesta,
  cuccia, forziere, roccia, stalagmite, cristallo, albero, cespuglio.
- **Da muro** (scenografia appesa): torcia, bandiera, cartello, tenda,
  scala, catena, e cespuglio, albero, roccia, stalagmite, cristallo.
- **Pavimenti** (`suoli.*`): erba, lastre, mattonelle, pietraia, terra,
  metallo, mosaico, tappeto, acqua.
- **Muri** (`muri.*`): pietra, mattoni, roccia, legno, ferro, marmo,
  alberi.
- **Ambienti** (`ambiente`, l'aria della stanza): bosco, camminamento,
  corridoio, cortile, cripta, fogne, grotta, ingranaggi, miniera, tesoro,
  trono.

---

## 6. Lo schermo

- **Non c'è un limite di righe e colonne.** Il bambino scorre la mappa
  col dito, e le frecce sul bordo dicono chi è fuori campo (parole
  dell'utente: «può essere anche molte più righe e colonne, non c'è un
  limite, tanto può scrollare»). Le mappe grandi vanno bene, anzi: la
  distanza fra due cose diventa lavoro, ed è da lì che nascono i piani
  lunghi. Una mappa piccola è il difetto da non rifare.
- Come si vede (`CampoLivello.vue`): il campo è alto il **40% della
  finestra**. All'apertura, e ogni volta che il piano parte, si
  allontana finché la mappa sta tutta, ma la casella non scende sotto i
  **18 px**; il bambino si avvicina con + o con due dita (casella da 32
  px in su) e scorre. Su un telefono (circa 390×340) una mappa fino a
  circa **21×18** si vede intera da lontano; oltre, si scorre anche
  da lontano.

---

## 7. Provare

### 7.1 Il simulatore

```bash
node strumenti/generale/piani.mjs src/data/livelli/torta/1-andata-e-ritorno.js --mappa
node strumenti/generale/piani.mjs <livello.js>                      # le soluzioni dichiarate
node strumenti/generale/piani.mjs <livello.js> <piani.mjs>          # i tuoi piani
node strumenti/generale/piani.mjs <livello.js> <piani.mjs> --traccia mestolo
```

- `--mappa` stampa la griglia con le coordinate (il fuori vuoto, muri e
  mobili pieni, una sigla per chi e cosa): serve a scrivere le caselle
  `'x,y'` e a contare i passi.
- Ogni piano perso dice **per colpa di chi** («presa da Zanna»), o se è
  finito in stallo, a ordini finiti o a tempo scaduto.
- `--perche` aggiunge le ultime righe del registro di ogni piano perso:
  chi ha fatto cosa, gli ordini rifiutati e perché.
- `--traccia [nome]` segue battito per battito dove sta ognuno, chi cade
  e che rumori partono.
- `--solo [nome]` gioca solo i piani col nome che contiene quello;
  `--zitto` stampa solo il riassunto; `--help` dice tutto questo.
- Un piano perso in cui un `quando senti` ha perso un segnale (perché
  stava ancora girando) lo dice: «⚠ segnale perso: la ladra ha sentito
  «il mestolo» al battito 30, ma quel suo ascolto stava ancora
  girando».
- `--confronta NOME=a,b` gioca gli stessi piani con la manopola della
  bozza (`process.env.NOME`, vedi sotto) in due posizioni, e stampa solo
  quelli che cambiano **esito** (vince o perde, e per colpa di chi; i
  battiti diversi si contano a parte): è la risposta a «questa abitudine
  conta?». Il secondo agente ci ha perso un giro a mano; così sono due
  secondi.
- `--manopole "A=1 B=2" "A=0 B=2" …` gioca la griglia una volta per
  combinazione e mette il riassunto per famiglia in una tabella, una
  colonna per combinazione: è la taratura di una bozza. Il terzo agente
  se l'era scritta a mano (`giro.sh`).
- `--solo =nome` gioca il piano con quel nome esatto (senza `=`, ogni
  nome che lo contiene).

Il file dei piani esporta una lista `[{ nome, piano, famiglia }]` o una
funzione `({ fai, se }) => [...]`, che è il modo di provare **una
griglia**. Chi dà una `famiglia` ai piani trova in fondo **il riassunto
per famiglia** — quanti vincono, in quanti battiti, e per colpa di chi
perdono gli altri — senza doverlo contare a mano:

```js
export default ({ fai }) => {
  const piani = []
  for (const dove of ['sala', '3,8', '10,8', 'camera'])
    for (const primo of ['chiave', 'osso'])
      piani.push({ nome: `chiama da ${dove}, prima ${primo}`, famiglia: `da ${dove}`, piano: {
        principessa: [fai.vai(dove), fai.suona('chiamata')],
        ladra: [fai.quando('chiamata', fai.prendi(primo), /* … */)] } })
  return piani
}
```

Cosa si guarda: quante famiglie di piani vincono (e se si dicono in una
frase), perché perdono gli altri, e se la mossa ovvia di un bambino perde
per un motivo che lui può vedere.

**Una bozza sola, con le manopole fuori.** Per provare varianti del
livello (dove sta una cosa, quanto aspetta una guardia) non si fanno
copie del file: la bozza legge `process.env` —
`const SOSTA = Number(process.env.SOSTA || 3)` — e si gioca
`SOSTA=5 node strumenti/generale/piani.mjs bozza.js piani.mjs --zitto`.
Le bozze e i file dei piani stanno nella cartella temporanea, non nel
repo.

### 7.2 Il banco

`npm test` gioca ogni livello della cartella (`test/unita/livelli`), e
per ognuno controlla: mappa rettangolare e cose su pavimento; ogni
soluzione normale vince su tutte le scene e non ha ordini di troppo; le
`fragile` vincono qualcosa e perdono qualcosa; le `lunga` costano di più;
il piano vuoto non vince mai; nessun ordine viene rifiutato; giocare non
sporca i dati del livello. Il test del Generale controlla anche che ogni
reazione si legga nella scheda e che ogni ostile abbia il suo «vedi».

Quello che un livello ha di suo si dichiara nel campo `verifiche`, e il
banco lo esegue: `nonInFila` (senza sincronizzazione si perde),
`serveOgnuno` (con un personaggio solo non si vince), `ordineConta: [['apri
porta', 'prendi chiave']]`, `ordineLibero`, `senza: ['osso']` (senza quella
cosa non si vince). Il contratto sta in testa a `test/aiuto/livello.mjs`,
ma quello che serve per scrivere un livello è tutto qui: non serve
rileggerlo (tutti e due gli agenti l'hanno fatto, per niente).

### 7.3 Nel browser

La build (`npm run build`) la lancia solo chi coordina. Poi
`dist/index.html`: nella schermata dei grandi si accende **«giochi in
prova» 🧪**, e un livello fuori da `APPROVATI` compare in fila; «apri
tutto» salta il cancello dei livelli precedenti. Da una pagina aperta,
`window.__gen` dà i fili per guidarla da uno script (`apri`, `via`,
`unPasso`, `piano`, `mondo`…), come fa `test/integrazione/generale`. La
prova col browser di un file solo: `node test/esegui.mjs generale
--niente-build`.

---

## 8. Metterlo in gioco

- Si importa in `src/data/generale.js` e si mette in un `TRATTI`: il
  tutorial è un blocco solo, ogni serie ha il suo tratto, e una serie
  nuova ne apre uno.
- **Non si mette in `APPROVATI`**: un livello nuovo nasce dietro 🧪, e lo
  promuove solo l'utente dopo averlo fatto giocare.
- Le stelle stanno sotto l'`id`: una se lo si vince, due se lo si vince
  **da soli** (senza farsi scrivere il piano intero e senza nostri
  caduti: gli altri aiuti si pagano in monete, e la stella non la toccano).
  Riordinare la fila non tocca le stelle di nessuno.
- Le note per i grandi (`guide/novita.js`) le decide l'utente, mai chi
  scrive il livello.

---

## 9. Le storie

- **Una storia è un livello lungo, non una fila di pagine corte.** Era
  partita a puntate — pagina 1 *La chiave della dispensa*, pagina 2 *La
  farina e le uova* — e l'utente le ha fatte unire: «visto che le mappe
  sono compatibili puoi unirle e fare in modo che si possa fare tutto in
  un colpo solo, chiaramente è più lungo come istruzioni ma è un
  processo iterativo». Il bambino il piano lo scrive a pezzi, prova, e
  lo allunga: un piano lungo è voluto.
- **Niente uscite regalate.** Parole sue sulla prima versione unita, che
  finiva nel cortile: «non ha forse più senso obbligarlo a tornare
  indietro dovendo coordinarsi nuovamente per spostare l'orco da lì, al
  posto di dargli una via d'uscita così banale?». La strada del ritorno
  ripassa da dove ci si è già dovuti coordinare, e ci si coordina
  un'altra volta, col mondo che nel frattempo è andato avanti.
- **Le parti si toccano**: quello che si fa in una parte cambia l'altra
  (l'osso lasciato a Zanna all'andata è quello che la tiene buona al
  ritorno), non solo stanno in fila.
- Se una storia continua in un livello dopo, quello **parte dallo stato
  in cui l'ha lasciato questo**, scritto nel livello: chi sta dove, quali
  porte sono aperte, cosa è già stato preso. Non c'è una memoria vera fra
  i livelli (per aprire il dopo bisogna aver vinto questo), quindi lo
  stato di partenza è quello canonico. Si parte a mani vuote (§2.7):
  quello che si aveva in tasca sta per terra sulla casella del
  personaggio. Le stanze già viste restano uguali, casella per casella.
- La prima storia è **la torta del re**, in un livello solo:
  `torta/1-andata-e-ritorno.js` (id `torta-tutto`). Domani è il
  compleanno del re e la principessa vuole fargli una torta a sorpresa:
  la ladra prende la chiave della dispensa e un osso nella cucina di
  Grugno, la farina nella dispensa dove dorme Zanna, le uova nel pollaio
  dell'oca Berta; Micio, il gatto, si fa guardare. È anche il livello da
  leggere come esempio (§4.2).

---

## 10. Trappole note

Cose vere e non ovvie, ognuna costata un livello rotto o un pomeriggio:

- Si parte a mani vuote: `zaino` non funziona (§2.7).
- Un ascolto interrompe; ma se sta ancora girando, lo stesso segnale
  che torna va perso, e due ascolti diversi si mettono in fila (§2.5).
- `aspetta che` su una cosa fuori vista non aspetta (§2.9).
- Le reazioni `vedi` guardano solo personaggi, mai oggetti (§2.5).
- Un `quando.vedi` scritto a mano sostituisce l'istinto: se guarda solo
  la ladra, alla principessa non fa niente (ed è voluto, ma va saputo).
- La vista è a passi: uno dietro un muro a una casella di distanza può
  essere a dieci passi, e non ti vede.
- Il suono passa i muri: un rumore nella stanza accanto attira; e una
  porta che cigola accanto a una guardia la chiama.
- `parla` arriva anche ai nemici che chi parla ha davanti.
- `grida` è una volta sola per scena.
- Una leva funziona una volta sola.
- `complementi` restringe tutto: una cosa che non ci sta non si può
  nominare, e i verbi e le domande che la riguardano spariscono.
- Senza `mostraNemici: true` i piani dei personaggi del livello non si
  leggono.
- In una soluzione normale ogni ordine dev'essere necessario: niente
  mete di comodo in più.
- Una scena si chiude a 300 battiti.
- «È arrivato X» vuol dire «è mai arrivato» (§2.5).
- A parità di priorità vince la reazione che sta già girando: fra due
  `quando.vedi`, vince chi è stato visto per primo (§2.5).
- `quando senti` sta solo in cima al piano: niente ascolti dentro altri
  ascolti, `se`, cicli o azioni (§2.5).
- Chi ha `suona` può fingere i segnali degli altri (§2.4).
- La scenografia con un volume va su un muro vero, non nel fuori (§4.3).

---

## 11. Dare il lavoro a un agente

Un livello si può far scrivere a un agente che conosce **solo questa
guida**: è ripetibile, e misura la guida. Il compito si dà così (i punti
in `[…]` sono da riempire):

> Devi scrivere un livello del Generale: [la richiesta: quale serie e
> quale pagina, cosa deve succedere, cosa non è piaciuto l'ultima volta].
>
> Leggi `src/data/livelli/GUIDA.md` per intero, e segui quella. I
> meccanismi del §12 dicono come si scrive un'abitudine, non quali usare:
> il livello deve averne almeno una che lì non c'è. Come
> esempio puoi leggere il livello che la guida cita
> (`src/data/livelli/torta/1-andata-e-ritorno.js`) e `scrivi.js`
> per le firme delle fabbriche. **Non leggere il motore**
> (`src/motore/`), né altri livelli. Se ti serve una regola che la guida
> non dice, provala col simulatore; se neanche così la ricavi, fanne a
> meno. In tutti e due i casi **segnala la lacuna**.
>
> Consegna: il file del livello, messo in fila in `src/data/generale.js`
> dietro 🧪 (non in `APPROVATI`), con `npm test` verde. Non lanciare la
> build, non fare commit, non scrivere note in `guide/novita.js`.
>
> Rispondi con: la sceneggiatura; le strade scritte come piani, ordine
> per ordine; le mosse ingenue e perché perdono; quanti piani hai
> provato al simulatore e quanti vincono; cosa c'è di nuovo rispetto
> alle pagine prima; **le lacune della guida**, ognuna con quello che hai
> fatto per aggirarla.

Le lacune tornano qui: si verificano, e si scrivono nella sezione
giusta.

**Quanto è costata la prima volta**, per misurare le prossime. La pagina 2
l'ha scritta un agente con questa guida (23 settembre 2026): 63 minuti e
75 mosse, circa 390 mila token di risposta. Non ha mai aperto il motore.
Dove ha perso tempo: 12 minuti a costruire quattro livelli di prova per
scoprire regole (l'esca, l'abbaio, fin dove si sente il cigolio,
l'inseguimento), che adesso stanno al §2 e al §12; e parecchi giri a
ricavare dalle tracce chi aveva preso la ladra e a contare a mano le
griglie, che adesso lo strumento fa da sé (`--perche`, le famiglie). Le sue
dodici lacune sono tutte in questa guida.

**Il secondo giro** (il livello che unisce le prime due pagine): 38 minuti e 54
mosse, circa 300 mila token di risposta, un terzo in meno. Nessun livello
di prova per le regole di base. Il tempo è andato nel progetto e nelle
griglie; gli sprechi rimasti erano la rilettura del banco, una sonda per
sapere se il cigolio contava (adesso `--confronta`) e una per sapere se
un pavimento sta in lista con un oggetto (adesso al §4.3). Le sue otto
lacune sono qui.

**Il terzo giro** (andata e ritorno): circa 80 minuti e 110 mosse, con una
pausa in mezzo per il limite d'uso, circa 420 mila token di risposta. Il
tempo è andato quasi tutto nel **tarare la mappa** per togliere una banda
di piani fortunati (circa 44 mila piani su una bozza a otto manopole,
girati con un ciclo scritto a mano: adesso `--manopole`). Le sue dieci
lacune sono qui; una era un test che rifiutava le soluzioni `lunga` che la
guida ammette, ed è stato corretto.

---

## 12. Meccanismi già provati — come si scrive, non cosa scrivere

Servono a non riscoprire ogni volta **come** si dice una cosa al motore:
l'agente della pagina 2 ci ha perso dodici minuti, costruendo livelli di
prova. **Non sono un menù.** Un livello montato con queste voci è un
livello già visto, ed è proprio il difetto da cui è partita questa guida
(i livelli copia l'uno dell'altro). Parole dell'utente: «occhio che non
iniziamo a seguire ricette preconfezionate per tutto, altrimenti poi
ogni livello è uguale».

La regola quindi è doppia:
- ogni livello porta **almeno un'abitudine che qui non c'è**, e non
  rifà la trovata della pagina prima (la distrazione, l'esca, il rumore
  dall'altra parte: cambiano da pagina a pagina);
- quando un livello inventa un meccanismo nuovo e lo prova, lo si
  aggiunge qui come **esempio di sintassi**, col livello da cui viene,
  non come modello da ripetere.

Ognuno sta in un livello che il banco gioca.

1. **Il giro con l'orologio** (Grugno, la torta): sempre lo stesso
   giro, e a un certo punto un rumore che dice dov'è. Il bambino legge il
   giro toccandolo (`mostraNemici: true`) e usa il rumore come orologio.
   ```js
   fa: [fai.ripeti([
     fai.vai(forno), fai.aspettaUnPo(3),
     fai.vai(tavola), fai.aspettaUnPo(3),
     fai.vai(pentolone), fai.suona(mestolo), fai.aspettaUnPo(5),
   ])]
   ```
2. **Chi accorre a un richiamo, e torna** (Grugno e la principessa). La
   strada è chiamarlo da una parte e passare dall'altra; chiamato dalla
   parte sbagliata, arriva addosso a chi passa.
   ```js
   quando.senti('chiamata', [fai.vai(dove.hoSentito), fai.aspettaUnPo(4), fai.vai(dove.ero)])
   ```
   Scorciatoia: `reagisce.alRumore('chiamata', { sosta: 4 })`.
3. **Chi viene a vedere una porta che cigola** (Grugno, la torta). Col
   raggio 5 del cigolio conta *quando* si apre: con lui lontano non sente.
   ```js
   quando.senti('cigolio', [fai.vai(dove.hoSentito), fai.aspettaUnPo(2), fai.vai(dove.ero)])
   ```
4. **Il bersaglio unico**: un nemico che guarda solo uno dei nostri (la
   principessa passa, la ladra no). Un `quando.vedi` scritto a mano toglie
   l'istinto (§2.5).
   ```js
   quando.vedi('ladra', [fai.attacca('ladra')])
   ```
5. **L'esca, dal naso** (Zanna, la torta): va a prendersi una cosa quando
   qualcuno la **posa** in un posto. È `posa` usato come mossa; `se.qui`
   non guarda la vista (§2.9), quindi lo sente anche da lontano.
   ```js
   fa: [fai.ripeti([fai.bivio(se.qui(osso, ciotola),
     [fai.vai(ciotola), fai.prendi(osso), fai.vai(cuccia)],
     [fai.vai(cuccia), fai.aspettaUnPo(1)])])]
   ```
6. **Chi morde, ma non a bocca piena** (Zanna): una reazione con dentro
   un `se`, e il gesto che dice come attacca.
   ```js
   arma: { nome: 'i denti', gesto: 'morde' },
   reagisce: [quando.vedi('ladra', [fai.bivio(se.ha('zanna', osso), [], [fai.attacca('ladra')])])]
   ```
7. **La guardia distratta** (Berta e Micio, la torta): due reazioni a
   vista, e vince quella che parte prima (§2.5). Finché vede Micio, Berta
   gli sta dietro e non becca la ladra; Micio deve farsi vedere **prima**
   che arrivi la ladra, e restare in vista. La scheda non lo dice: lo dice
   un aiuto.
   ```js
   reagisce: [quando.vedi('ladra', [fai.attacca('ladra')]),
              quando.vedi('micio', [fai.vai('micio')])]
   ```
8. **La catena fra due del livello** (il mestolo di Grugno è la pappa di
   Zanna): il segnale di uno sposta un altro, ed è quello che fa sembrare
   vivo un posto. Nella torta rovescia il trucco del mestolo: al mestolo
   la cucina è libera, ma la ciotola dietro la porta è occupata.
   ```js
   quando.senti('mestolo', [fai.vai(ciotola), fai.aspettaUnPo(3), fai.vai(cuccia)])
   ```
9. **Chi dà l'allarme invece di attaccare** (provata, non ancora in un
   livello): il cane abbaia, il padrone accorre.
   ```js
   quando.vedi('ladra', [fai.suona(abbaio)])                           // il cane
   quando.senti('abbaio', [fai.vai(dove.hoSentito), fai.aspettaUnPo(4), fai.vai(dove.ero)])  // il padrone
   ```
   Oppure `grida: 'abbaio'` sul cane, che però grida una volta sola.
10. **Chi ti becca da lontano** (Grugno): `arma: { nome: 'il mestolo',
    tira: true, portata: 3, gesto: 'prende a mestolate' }`, con la ladra a
    `vita: 1`. «Se ti vede, ti becca», senza inseguimenti alla pari.
11. **I mestieri dei nostri**: la ladra prende e apre e non parla (`sa`
    senza `suona`), vede 5, cade al primo colpo; la principessa chiama e
    non ruba (`nonRiesce: { prendi: 'io non rubo: sono la principessa!
    ci pensa la ladra' }`); il gatto non prende niente (`nonRiesce: {
    prendi: 'sono un gatto: le zampe non prendono niente' }`) e serve a
    farsi guardare.
12. **Due tempi con lo stesso orologio** (la torta): il mestolo fa
    partire la chiamata, la chiamata fa partire la ladra, e l'ascolto del
    ritorno si arma solo dopo l'andata (§2.5, la trappola dei piani in
    due tempi).
    ```js
    principessa: [fai.vai(sala), fai.quando(mestolo, fai.suona(chiamata))],
    ladra: [fai.aspettaChe(se.sentito(chiamata)), /* …l'andata… */,
            fai.vai(porticina), fai.quando(chiamata, fai.vai(camera))],
    ```
