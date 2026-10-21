# Il mondo aperto: quest e storia

**Una proposta**, parte del progetto del mondo aperto ([mondo-aperto-progetto.md](mondo-aperto-progetto.md)). Le
missioni di oggi ([missioni.md](missioni.md)) sono poche e di tre tipi (trova, sconfiggi, conta) perché il mondo era a
discese in fila e posti vicini: ognuna è «al piano N della discesa K». Con regioni, città e antri si può andare verso
le quest di Diablo e WoW. L'utente, 16 ottobre 2026: storie e missioni *«oggi fortemente limitate dalla struttura del
sistema»*; con un mondo vasto si può andare *«molto più alla Diablo/WoW come struttura delle quest»*.

## Cosa resta fermo

- **Le domande non cambiano**: una quest non tocca il `dif`, la portata, la fretta o il perché dopo uno sbaglio
  ([../apprendimento/la-domanda.md](../apprendimento/la-domanda.md)). Fa fare più cose, e ogni cosa chiede la sua
  domanda come oggi.
- **Nessuna quest paga una risposta sbagliata**: si fa o non si fa, e una cosa sbagliata si riprova (il forziere d'oro
  di oggi resta chiuso e non si brucia). Una quest a tempo o «senza sbagliare» non esiste.
- **L'esperienza viene solo dai mostri** ([livelli.md](livelli.md)), anche per le quest: il premio è gemme, roba,
  monete quante le domande in più ([missioni-monete.md](missioni-monete.md)). **Da decidere**: esperienza da quest
  (Diablo e WoW la danno), raccomandato no, perché sposta tutta la curva dei livelli e la taratura delle zone.
- **Si salva nell'avventura, come oggi**: `missioni` (`{ [id]: 'presa' | 'fatta' | 'consegnata' }`), `conti`
  (`{ [id]: n }`), `segui`. Nessun campo nel profilo.
- **Il tetto di tre** (`TETTO`) resta: è dell'utente, *«non proporgliele se sono troppe»*. Le taglie della bacheca
  contano nel tetto; la storia no, come oggi.

## (a) I tipi di quest

Ogni tipo dice cosa fa il bambino, dove la si trova, e se il motore lo sa già fare.

| tipo | cosa si fa | esempio | il motore di oggi |
|---|---|---|---|
| **caccia** | battere N di una specie in una regione o in un dungeon | «sei lupi nel bosco vecchio» | `conta` c'è, per discesa; per regione basta `dove: <regione>` |
| **il mostro col nome** | battere un mostro col nome e la corona | «Rosicchione, nella torre» | `sconfiggi` c'è; in una regione `postoPer` lo mette lontano dall'arrivo |
| **il signore della regione** | battere il caporale della tana | «il re dei goblin del colle» | come sopra, sulla tana delle terre selvagge |
| **ripulisci** | battere tutti quelli di una tana o di un accampamento | «il campo dei briganti» | nuovo: un conto sui mostri di una tana (`tana: <id>`) |
| **recupera** | trovare una cosa in un dungeon o in un antro | «l'ascia di suo padre» | `trova` c'è (il forziere d'oro); in un antro, il piano è 0 |
| **consegna** | portare una cosa da una città a un'altra | «la lettera del capitano al rifugio» | nuovo: la cosa nello zaino, e un `a` diverso da `da` |
| **esplora** | arrivare a un posto e vederlo | «il faro sulla palude» | nuovo: fatta quando la nebbia scopre il posto (`scopri` lo dice già) |
| **trova chi** | trovare una persona in una regione e parlarle | «il pastore perso nella brughiera» | nuovo: un personaggio che c'è solo a quest presa |
| **scorta** | accompagnare qualcuno in una città | «il mercante fino al forte» | nuovo: chi segue l'eroe e il posto del compagno nello scontro |
| **mappa del tesoro** | seguire una mappa caduta e scavare | «la X sotto il vecchio olmo» | nuovo: la mappa nello zaino, la buca, la domanda per scavare |
| **la catena** | più quest in fila, la stessa storia | «la collana → il ladro → il covo del ladro» | c'è: `richiede: [{ consegnata }]`; manca il titolo comune nel diario |
| **la taglia** | una quest a rotazione dalla bacheca | «questa volta: i ragni del bosco» | nuovo: i modelli coi parametri e il giro |
| **l'evento** | qualcosa che succede nel mondo | «la carovana assalita sul ponte» | nuovo: un evento di mondo col suo posto e la sua fine |

### Scritte a mano o generate

**Raccomandato: un misto.**

- **Scritte a mano**: la storia e le quest con un personaggio e una battuta (le diciassette di oggi, con i loro id, più
  le nuove delle città). Stanno in `dati/missioni.js` come oggi. Il perché: una quest che si ricorda ha un chi e un
  perché, e un generatore non li scrive bene.
- **Generate da modelli**: le taglie e le cacce della bacheca. Un modello (`dati/missioni-modelli.js`) ha il tipo e i
  buchi (`specie`, `regione`, `N`, `premio`); il generatore del mondo dà i posti possibili (le regioni, le tane, gli
  antri aperti a quel giro, gli abitanti di ogni regione), e il seme `(eroe, giro)` li riempie. L'id è stabile e dice
  da dove viene (`t:caccia:bosco:12`): rileggendo l'id si rifà la quest, quindi nel salvataggio sta solo lo stato.
  Una taglia scaduta (il giro è passato senza prenderla) se ne va da sola; una presa resta finché non la si fa.
- **I numeri dei modelli sono una tabella**, non un caso: N e il premio vengono dalla fascia della regione, con la stessa
  regola delle monete di oggi (il regalo vale le domande in più). Il lavoro di taratura si segnala (sotto).

### Chi le dà

- **I personaggi di oggi restano**, con le loro chiavi (salvataggi e sprite): la ragazza del pozzo e il mugnaio nel
  villaggio, il frate al cimitero vecchio, la guardia alla torre bruciata, il pescatore alla palude, il boscaiolo al
  bosco vecchio, il minatore (nel villaggio, poi al rifugio). Stanno vicini al dungeon delle loro quest, come oggi.
- **Le città portano gente nuova**: il capitano del forte (la storia delle marche), una cacciatrice al rifugio, un
  carovaniere fra le due. Sprite nuovi da dipingere; finché non ci sono, figure in `viste/pixel.js` come ripiego,
  secondo la regola di sempre ([../core/sprite.md](../core/sprite.md)).
- **La bacheca delle taglie** in ogni città: un cartello modellato con i fogli appesi, una taglia per foglio. Si tocca
  come un personaggio e apre lo stesso dialogo (il ritratto è la bacheca).
- **I mercanti non danno quest** (oggi neanche): parlano di quello che vendono. **Da decidere**.

## (b) Il giornale e la nebbia

Il diario c'è già ([missioni.md](missioni.md#il-diario-e-il-promemoria)): la quarta scheda della finestra dell'eroe,
la pastiglia d'oro sul globo rosso, gli elenchi «da consegnare», «da fare», «ti aspettano», il dettaglio con «segui
questa» e «vai da …». Nel mondo aperto cambia il **dove**:

- **Il dove è una regione, non un piano**: «nel bosco vecchio, oltre il ponte di travi», con la città più vicina e la
  sua pietra. Il ritaglio della discesa diventa il monumento fotografato, o lo stemma della regione.
- **I segni sopra la testa restano tre** (`segnoDi`): «!» d'oro, «?» grigio, «?» d'oro che pulsa. Sopra un personaggio
  lontano e fuori vista il «?» sul bordo con la freccia, come oggi.
- **La veduta dall'alto ha i segni**: i «!» e i «?» dei personaggi già incontrati, le pietre accese, e per una quest
  seguita **un cerchio sulla regione**, non il punto: dove andare sì, cosa trovare lì no. Una quest che punta in una
  regione mai vista mostra il cerchio sopra la nebbia, ma la nebbia resta: si scopre camminando.
- **La freccina**: giù attorno all'eroe (la cosa, o la scala), sopra azzurra sul bordo verso la meta
  ([missioni-freccina.md](missioni-freccina.md)). Nel mondo sopra la freccina punta la strada vera (la prossima curva
  dell'A*), non la linea d'aria: in linea d'aria un fiume senza ponte è un muro.
- **«Vai da …»** con la pietra: se la meta è lontana e c'è una pietra accesa vicina, il dettaglio offre
  «vai alla pietra» prima di camminare.

## (c) La storia principale nel mondo aperto

- **«Chiudi le sette porte» resta**, coi sette capitoli nello stesso ordine e lo stato preso dalle discese finite
  (`laStoria`): niente da salvare, niente da travasare ([la-storia-principale.md](la-storia-principale.md)).
- **Si racconta per anelli, come gli atti di Diablo.** Primo atto, le terre vicine: le porte 1–4, date dal minatore
  nel villaggio, ognuna in un'altra direzione attorno al centro. Battuto Zannaverde il ponte del guado si alza, e il
  secondo atto è delle marche: il capitano del forte dà le porte 5 e 6, il minatore (salito al rifugio) la settima e
  poi il pozzo senza fondo.
- **Il ritmo porta fuori**: ogni capitolo chiede di passare un confine nuovo (un ponte, un valico, una regione più
  alta), e in ogni regione nuova c'è almeno una quest di un personaggio da prendere strada facendo. La strada verso
  la porta dopo passa vicino a una città o a una pietra da accendere.
- **I capitoli si riscrivono** (`CAPITOLI` in `dati/storia.js`, le frasi `LUOGHI`) sulla geografia e sui nomi nuovi.
  La regola: il minatore dice la strada con quello che si vede («oltre il ponte di pietra, nella brughiera»), mai coi
  punti cardinali.
- **Dopo la storia**: le zone come oggi ([zone.md](zone.md)), le taglie, gli antri, i Tesori. Il minatore racconta la
  zona nata (la notizia) nella città dove sta.

## (d) Ricompense: cosa va ricalibrato

Non si ricalibra qui; si segnala.

- **Il premio di ogni modello** (gemme, roba, monete) per fascia, misurato col banco come le monete di oggi: un modello
  nuovo vuole il suo conto delle domande in più.
- **Quante gemme portano le quest a ogni punto della storia**: oggi sono un vantaggio piccolo e la tabella della roba
  regge senza; con le taglie ripetibili un bambino che le fa tutte arriva più ricco. Il banco dei giocatori tipo deve
  fare anche le quest (oggi il curioso non le fa).
- **La roba delle quest** non entra nella roba attesa (come oggi i gioielli delle missioni): si controlla che non diventi
  il modo di saltare il fabbro.

## (e) Cosa si fa subito e cosa vuole mattoni nuovi

| cosa | quando | quanto |
|---|---|---|
| le diciassette di oggi nel mondo nuovo (chi sta dove, i testi coi nomi nuovi) | appena il mondo ha i dungeon | 1 giorno |
| quest nuove scritte a mano nei dungeon e negli antri (trova, sconfiggi, conta, catene) | subito, sono dati | ½ giorno per ogni quattro-cinque, più i testi |
| caccia, mostro col nome, signore della regione in una regione | quando le regioni hanno i mostri (il motore aperto) | 1–2 giorni |
| il dove a regione nel diario, la freccina sulla strada vera, il titolo della catena | con la vista del mondo | 1–1,5 giorni |
| i segni e il cerchio nella veduta dall'alto | con la veduta | 1 giorno |
| esplora un posto | mattone piccolo | ½–1 giorno |
| consegna fra città (la cosa nello zaino, `a` diverso da `da`) | mattone piccolo | 1 giorno |
| trova chi (un personaggio che c'è solo a quest presa) | mattone piccolo | 1 giorno |
| ripulisci una tana | col motore aperto | 1 giorno |
| la bacheca e le taglie dai modelli, col giro | mattone medio | 2–3 giorni |
| la mappa del tesoro (la mappa, la buca, scavare con una domanda) | mattone medio | 2 giorni |
| scorta | mattone grande: chi segue, il compagno nello scontro, chi cade | 3–4 giorni, **raccomandato dopo** |
| eventi di mondo | mattone grande: quando nasce, dove, come finisce, chi lo dice | 3–4 giorni, **raccomandato dopo** |

In tutto **8–12 giorni** senza scorta ed eventi, più i testi e gli sprite dei personaggi nuovi. È la fase 6 di
[mondo-aperto-fasi.md](mondo-aperto-fasi.md).

## Fatto: le taglie della bacheca (19 ottobre 2026)

La fase 6 nel mondo di sopra del Sotterraneo 3D, senza i mostri di sopra. Il codice: `dati/missioni-modelli.js` (i modelli, i testi, le
gemme, `rifaDaId`), `motore/taglie.js` (lo stato, il tetto, la pulizia, l'aggancio dei mostri), `motore/taglie-bacheca.js` (cosa appende
una bacheca, il posto sul prato), e gli agganci in `motore/missioni.js`, `Gioco.vue`, `Mondo3d.vue`, `FumettoMondo.vue`, `Diario.vue`.

- **L'id dice tutto**: `t:<città>:<modello>:<parametro>:<giro>` (`t:villaggio:caccia:cantine.ratto:3`). Nel salvataggio sta solo lo
  stato, `mondo.quest = { stati: { [id]: 'presa' | 'fatta' | 'consegnata' }, fatte }`; la quest si rifà dall'id (`rifaDaId`, i testi
  scelti con un hash dell'id). **Gli id sono chiavi di salvataggio: un modello, un parametro o il senso di un testo non si rinomina.**
  Un id che non si legge più (un modello tolto) si butta alla pulizia. Un salvataggio senza `quest` è nuovo, uno storto pure.
- **La bacheca per (eroe, giro, città)**: `bachecaDi` appende tre fogli, scelti con un caso seminato da quella terna fra i candidati
  della città (uno per famiglia di modelli finché si può). Sul mondo a percorso la città è una, il villaggio, e serve tutti i luoghi
  (le chiavi delle regioni di prima), le pietre delle zone (`esplora-pietra` col parametro della zona) e i quattordici ingressi (le
  cacce, i mostri col nome e le cose smarrite restano dei sette della storia). Non si propone quello che si è già visto (un luogo, un
  ingresso, una pietra), né un dungeon ancora chiuso. La consegna fra città non esce più; quelle prese prima per il forte o il
  rifugio si consegnano al villaggio, e ogni id `t:forte:…` o `t:rifugio:…` si legge sul villaggio (`cittaDiOggi`). Prendendo un foglio non ne arriva un altro: un'altra bacheca si vede al giro dopo.
- **Il giro** (`giro` in `mondo`) conta un ritorno in città solo se prima ci si è allontanati più di `raggio + 8` celle dal centro di
  ogni città (`lontanoDalleCitta`), o si è saliti dal portale: passare il confine non fa cambiare la bacheca. Chi ricomincia dall'ingresso
  di un dungeon (non dal portale) parte «lontano».
- **Il tetto**: tre taglie in mano insieme (`TETTO_TAGLIE`, fatte da consegnare comprese), a parte il tetto delle missioni dei personaggi
  (le taglie sono `fuoriDalTetto`). I fogli nuovi si vedono lo stesso ma non si prendono. Le consegnate dei due ultimi giri restano nel
  diario, le altre si dimenticano (`ripulisci`), e `fatte` conta tutte le consegne.
- **Si consegna alla bacheca**, quella da cui sono partite; la consegna fra città, a quella di laggiù (fatta e consegnata in un colpo).
  La bacheca ha il «!» d'oro se c'è un foglio da prendere, il «?» d'oro che pulsa se c'è da consegnare, il «?» grigio se hai preso
  qualcosa e non è fatto; il diario le mostra con 📜 e «vai dalla bacheca …»; «segui questa» dà la freccia sul bordo (azzurra, con la
  faccia della taglia) e il cerchio nella veduta, verso il cuore della regione, l'ingresso, la pietra o la bacheca (dove andare, non cosa
  si trova). La freccina dei dungeon è quella di sempre (`discesaDaSeguire`).

### I tipi fatti

| modello | cosa si fa | fatta quando | note |
|---|---|---|---|
| `consegna` | portare una cosa (🍞 ✉️ 🍎 📜 🧶 📦) a un'altra città | si tocca la bacheca di laggiù | in un colpo |
| `esplora-regione` · `-ingresso` · `-pietra` | vedere un posto | la nebbia scopre il cuore della regione, l'ingresso, la pietra | da sé, camminando |
| `trova-chi` | cercare una persona persa in una regione | le si parla | una figura dell'atlante che c'è solo a taglia in mano |
| `mappa` | seguire la X e scavare | una domanda giusta alla X; sbagliando si riprova | la X (✕) è un segno sul prato, solo a taglia in mano |
| `caccia` | battere N di una specie in un dungeon | N morti, anche tornati | è la «conta» di sempre (`Corsa.conti`) |
| `mostro` | un mostro col nome e la corona, più duro | cade | come «sconfiggi» di sempre |
| `recupera` | una cosa smarrita in un forziere d'oro | si apre | come «trova» di sempre |

La caccia ha N sotto la **mediana di un giro intero** della discesa (dodici semi, tutti i piani; lo misura la unità): cantine ratti 9,
goblin 12, melme 9; torre pipistrelli 5, spiriti di fuoco 8; tana dei ragni ragni 5, funghi 6, piante 5, melme rosa 5; sale allagate
polpi 9, fantasmi azzurri 5, piranha 4; porta dell'inferno bestie cornute 15, negromanti 14, troll 14; miniere scorpioni 12, golem 8,
spiriti elettrici 7. La cripta e l'abisso non hanno caccia (tre mostri per specie; l'abisso è un'altra cosa).

### Le gemme

Le taglie danno **solo gemme** (decisione del 16 ottobre: niente esperienza, e nessuna moneta, perché non c'è una domanda in più da
ripagare: [missioni-monete.md](missioni-monete.md)). `gemme = base × valoreDelLivello(livello del posto)`, tetto 6–40
(`gemmePer`). Il livello è quello atteso del dungeon (`LIVELLI_ATTESI`) o la fascia della regione (per la consegna, la più alta delle due città).

| modello | base | esempio |
|---|---|---|
| consegna | 10 | villaggio → forte (livello 6): 16 |
| trova chi · esplora | 8 | regione di livello 1: 8–9; di livello 9: 16–18 |
| mappa | 12 | 12–26 |
| recupera | 14 | 14–29 |
| mostro col nome | 16 | 16–33 |
| caccia | 1,6 a mostro | 9 ratti nelle cantine: 16; 15 bestie cornute: 40 (il tetto) |

Misure (unità, tutte le bacheche di tre punti della storia, quattro eroi, 25 giri): consegna 16–20, esplora 8–19, trova chi 8–18, mappa
12–26, recupera 14–29, mostro 16–33, caccia 11–40. Una taglia vale meno di un piano di roba per terra della discesa e più di una
gemma: è un motivo per tornare in città, non un tesoro. **Ancora da misurare**: quanto un bambino che le fa tutte guadagna in più
nel banco dei giocatori tipo (le taglie ripetute si sommano alle discese); la leva è `BASI` e il tetto.

### L'aggancio coi mostri di sopra

Tre modelli vogliono i mostri di sopra, dietro `MOTORI['mostri-sopra']` (`dati/missioni-modelli.js`): **accesi dal 19 ottobre 2026**,
quando i mostri di sopra sono arrivati a schermo; spenti non si appendono e non si prendono. Chi li conta è la scena
(`taglieDelloScontro` di `motore/aperta-scena.js`, chiamata da `Gioco.vue` a ogni scontro chiuso sul prato:
[mondo-aperto-mostri-scena.md](mondo-aperto-mostri-scena.md#le-taglie)), con le taglie dei caduti che dà il motore (`motore/aperta.js`):

- **caccia aperta** (`t:<città>:caccia-aperta:<regione>.<specie>:<giro>`, 6 da battere, provvisorio): a ogni mostro morto di una `specie`
  in una `regione` chiama `taglieDaContare(stati, specie, regione)` → `[{ id, quanti }]`, scrive il conto in `conti[id]` (lo stesso
  campo di giù) e a `quanti` dice `azioneMissione(id, 'fatta')`;
- **signore della regione** (`signore`, il caporale della regione) e **ripulisci tana** (`tana`): `taglieDaBattere(stati, 'signore' |
  'tana', regione)` → gli id da dichiarare `'fatta'` quando il caporale cade o la tana è vuota.

`azioneMissione(id, 'fatta')` è in `Gioco.vue`: passa da `statiDaScrivere` e va in `mondo.quest` o in `missioni` a seconda dell'id. Le basi
di `BASI` (provvisorie) e le N restano da tarare coi giocatori tipo; il diario mostra la caccia aperta col suo «N di M» e il signore e la
tana con la faccia del loro caporale.

### Nei test

`unita/sotterraneo-quest-modelli` (fatto: id stabili e unici, la stessa bacheca per (eroe, giro, città), le gemme nella banda, nessun modello impossibile, le cacce sotto la mediana, il mostro col nome battibile dai quattro eroi, lo stato e il salvataggio, i tre in mano, la pulizia, la regola del giro, l'aggancio) e `integrazione/sotterraneo-bacheca` (col dito vero: il «?» d'oro, il fumetto, la consegna e le gemme, un foglio nuovo, il diario, chi si era perso, la X con la domanda, il giro). Restano del piano le quest scritte a mano nel mondo: `unita/sotterraneo-missioni` allargato (ogni quest nuova ha un dove che esiste nel
mondo, i requisiti si sbloccano nell'ordine della storia, un seguito sta più lontano dal centro del padre o nella stessa città) e
`integrazione/sotterraneo-missioni` adattato alla tela (il «!» su un personaggio, il cerchio nella veduta, la consegna in un'altra città).
