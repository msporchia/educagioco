# Le regole

I numeri stanno in `src/giochi/arena/dati/regole.js`, il motore in
`motore/partita.js` (senza schermo, il caso passato da fuori). Qui il perché.

## Il campo: una corsia sola

- **Una corsia, un ponte, al centro.** C'erano due corsie (come Clash Royale):
  tolte perché i nemici finivano «dietro» i muri e le caserme costruiti, e il
  muro, che copre una corsia sola, non serviva a niente sull'altra.
- Il motore conta la corsia in verticale (`y` lungo, `x` di lato), e la scena la
  disegna così, col castello di chi gioca in basso (vedi [grafica.md](grafica.md)).
- **Il castello sta sul bordo, e se ne vede solo un pezzo**: è l'obiettivo finale, non
  deve prendere campo (l'utente). Fra lui e il ponte ci sono **sei piazzole fisse**, su
  tre file, con la loro base stabile, sempre in vista, come nel castello a torri: ci si
  costruiscono caserme e miniere, e quando una crolla resta la base. Erano quattro:
  l'utente voleva «poter far molto più casino». **Provato** a stringere
  castello e caserme in una cittadella alla Heroes, con gli edifici attaccati al castello:
  ma una caserma si può abbattere, e attaccata al castello non lo si poteva più fare
  senza toccare lui, né si vedeva che l'assedio arriva al castello per ultimo.
- **Una partita dura 5:00.** Vince chi abbatte il castello nemico; allo scadere chi ha
  fatto più danni (sotto, «La durata»). Era 3:00: troppo poco perché la miniera rendesse,
  e vinceva sempre chi attaccava subito (sotto, «Rush o economia»).

## Le caserme: sei piazzole libere

- **Gli edifici sono quattro** (`EDIFICI`): la cripta (arcieri | opliti), la tana
  (mummie | pipistrelli, e le bestie cornute della battaglia infinita), la torre oscura
  (negromanti | diavoletti), l'antro (golem | drago). Le truppe di un edificio **costano
  uguale**: si sceglie il mestiere, non il prezzo. L'edificio dice com'è disegnata la caserma, non quante se ne fanno.
- **Le piazzole sono libere**: su ognuna delle sei si costruisce la caserma che si
  vuole, **anche due uguali** (due cripte di arcieri), o una miniera. Prima un edificio era uno solo, e
  nella prima tappa, che ha solo la cripta, si restava con una caserma e niente da
  aggiungere (l'utente). La piazzola **la sceglie chi gioca toccandola sul campo**; il
  nemico e i giocatori finti la lasciano al gioco (il lato con meno caserme, e dentro
  il lato il più lontano dal fiume).
- **Ogni caserma ha il suo livello e parte dall'1**, anche la seconda uguale (scelta
  dell'utente). Prima il livello era una ricerca dell'edificio e una caserma rifatta
  ripartiva da lì: con due caserme uguali avrebbe dato un esercito raddoppiato a buon
  mercato. Il livello (1-10) fa uscire le squadre più spesso
  (`9 / (1 + 0.12·(liv−1))` secondi), più numerose (una truppa in più ogni tre livelli, sotto) e più forti;
  potenziando, la vita in più della caserma arriva subito. Potenziare costa 8, 11, 14,
  18, 24… (`salita`): rende tanto, e a 6, 8, 10 era la mossa che batteva tutte le altre.
- **Si vende**: nei dettagli di una caserma, «Vendi» ridà **metà di quello che ci si è
  speso** (costruzione e potenziamenti, `spesa`) e libera la piazzola, per cambiare
  strategia (l'utente). Si paga con un calcolo come le altre scelte (una sottrazione):
  non è un'uscita gratis. Il nemico non vende.
- **L'antro (golem | drago) costa 20**, e le sue truppe sono forti in proporzione: è un
  investimento, non un'apertura. A 14 costava quanto le monete di partenza.
- **Le truppe sono nove e si distinguono per chi colpiscono, non per quanto
  valgono**: arcieri e negromanti feriscono tutti, opliti, mummie, bestie cornute e diavoletti solo chi
  cammina, il golem solo le costruzioni, i pipistrelli e il drago volano e scavalcano
  i muri. Il `guasti…()` di `dati/regole.js` pretende due o tre truppe per edificio allo
  stesso prezzo, chi vola e chi, da terra, ferisce chi vola, e (battaglia infinita, sotto) una
  truppa da costruire per ogni edificio in ogni terreno.
- **Masse, non quattro omini**: le squadre sono grandi (quattro arcieri, sei
  pipistrelli…) con vita e danno divisi in proporzione, e **ai livelli 3, 6, 9… la
  squadra prende una truppa in più** (`CRESCITA.omini`: gli arcieri da 4 a 7 al livello
  9), **fino a 12 per squadra** (`SQUADRA_MAX`: il campo regge 800 unità e le caserme
  sono fino a sei per parte); poi sale solo la potenza. L'utente: «col tempo una massa di
  persone», «potenziare dovrebbe aumentare anche il numero di truppe», e «chiaramente
  aumenti meno la potenza se aumenti anche il numero, è giusto per fare un po' di scena».
- **Il bilancio non cambia, cambia la forma** (`CRESCITA.forza(liv, n)`): la potenza di una
  squadra (truppe × forza di una) segue `(1 + 0.15·(liv−1)) · (1 + (liv−1)/8)`, la crescita
  di quando le truppe in più erano un ottavo a livello; la forza di ogni truppa è quel
  totale diviso per quante sono, ma **non scende mai e sale almeno del 4%** (`SALITA_MIN`).
  Così dove arriva una truppa il guadagno di ognuna è piccolo (arcieri: 1,29 al 2, 1,35 al 3),
  agli altri livelli è quello che serve. Il totale di una squadra, rispetto al livello 1:
  da 4 truppe 1,3 · 1,7 · 2,0 · 2,4 · 3,0 al 2, 3, 4, 5, 6 (prima 1,4 · 1,6 · 2,2 · 2,4 · 3,1);
  da 1 o 2 truppe (golem, drago, opliti, negromanti, diavoletti) lo scatto della truppa in più
  da solo vale più di un livello (un golem al 3 è due golem, ×2,7): il minimo del 4% evita che
  i livelli dopo lo scatto siano fermi. Lo controlla `unita/arena`: la squadra sale a ogni livello,
  senza saltare più del doppio (più di 1,6 se ha almeno tre truppe).

## Vita e danno: chi sta davanti e chi sta dietro

- **Chi colpisce da vicino ha più vita e meno danno, chi tira da lontano il contrario**
  (l'utente), **ma senza esagerare**: chi tira sta nelle retrovie e muore già meno. Per
  squadra, al livello 1: opliti 600 di vita e 40 di danno al secondo, mummie 560 e 50,
  arcieri 180 e 72, negromanti e diavoletti 180 e 29-30 (ad area), pipistrelli 240 e 36.
- **I raggi dei colpi ad area stanno in scala con le figure** (13-15): con le masse fitte
  un raggio di 26-30, quello di quando le figure erano grandi il doppio, prendeva sei
  omini a colpo e il drago spazzava tutto.
- **Si controlla coi duelli a parità di monete** (`npm run tara:arena -- --duelli --budget 120`:
  ogni parte spende 120 monete in squadre della stessa truppa, in campo aperto, senza castelli né
  porte). A squadre uguali il drago vinceva l'86% perché costa il triplo: il conto giusto è il
  prezzo. **Non esiste la truppa perfetta** (l'utente): nessuna deve stare sopra il ~70% né sotto
  il ~30%, e deve esserci il giro. Ultimo giro (19/10): arcieri 57%, opliti 57%, mummie 57%,
  bestie 29%, pipistrelli 71%, negromanti 43%, diavoletti 57%, drago 57%. Chi sta a terra e
  tira (arcieri, negromanti) ferma chi vola; chi vola batte la fanteria; le masse veloci
  (mummie) raggiungono chi tira; chi tira ad area ripulisce le masse. Il golem non duella:
  ignora le truppe. Per ritoccare: `hp`, `dmg` e `costo` in `dati/regole.js`, poi si
  rilancia il duello e `npm run tara:arena`. `BATTE` in `motore/nemico.js` è la stessa
  tabella: va riletta se un giro cambia.

## La battaglia infinita e le truppe di un terreno

La voce in cima alla mappa (`INFINITA` in `dati/campagna.js`): **niente timer**, il nemico alla
**difficoltà massima** (la scheda dell'ultima tappa, `NEMICO.trono`, niente scale né crescita), finisce
quando cade un castello. **Il terreno è diverso a ogni volta** (`terrenoDiverso`: bosco, palude,
neve, lava; l'ultimo sta in `campagne.arena.ultimoTerreno`), e **ogni terreno ha una truppa firma**
che altrove non si costruisce (`ESCLUSIVE` e `TRUPPE_DEL_TERRENO` in `dati/regole.js`):

| terreno | firma | edificio |
|---|---|---|
| bosco | pipistrelli | tana |
| palude | mummie | tana |
| neve | golem | antro |
| lava | diavoletti | torre oscura |

Arcieri, opliti, negromanti e drago sono di tutti. Le operazioni valgono tutte e quattro (`INFINITA.operazioni`),
anche dove nessuna truppa ammessa porta `×`. **La campagna usa le stesse liste**, tolte le truppe la cui operazione non è ancora
stata insegnata ([campagna.md](campagna.md)); nella battaglia infinita le operazioni valgono tutte
e ci sono tutte le truppe del terreno. Il nemico e i giocatori finti usano la stessa lista (`Partita.truppeAmmesse`).

- **Le bestie cornute completano la tana**: senza mummie e pipistrelli, in neve e in lava la tana non
  avrebbe truppe; sono per quei due terreni (`×`, 8 monete come le altre della tana: tre per squadra, 190 di
  vita, 13 di danno, 56 di velocità, colpiscono solo chi cammina, da vicino). Il ruolo è «regge e
  colpisce a corto raggio», fra le mummie (veloci, di più danno) e i pipistrelli (volano, fragili).
  L'operazione è `×` perché in lava non c'è nessun'altra truppa con la moltiplicazione.
- **Non c'è un record** (l'utente: «non ha senso per questo gioco»): a fine battaglia si dice solo il tempo
  di questa volta, niente `senzaFine` nel manifesto né riga nella tabella dei primati. Non ci sono nemmeno
  stelle, tappe o un finale di campagna.
- **Si apre come una tappa dopo l'ultima** (`apertaQui(INFINITA, QUANTE_TAPPE, fatte)`): campagna finita; chiusa, la voce ha il lucchetto.
- **Senza timer la partita non può restare in piedi per sempre**: `npm run tara:arena -- --infinita` misura i
  giocatori finti in ogni terreno col tetto di 30 minuti, e dice quante restano «aperte» (nessuna, all'ultimo giro).
- La sosta ha chiave `infinita` e il terreno ([sosta.md](sosta.md)).

## Come marciano, e l'ordine dell'assedio

- **Appena uscite si va sulla strada** (davanti al castello), poi si marcia in fila:
  prima tagliavano il campo in diagonale verso il ponte e le due file si incrociavano
  (l'utente: «strano che partano da lì e si incrocino»).
- **Una truppa vede un'altra truppa a 80** e la colpisce (la più vicina).
- **Nella propria metà si accorre ai nemici vicini al castello** (entro 190), anche se
  sono più lontani di 80: prima le squadre appena uscite ignoravano chi picchiava il
  castello e partivano verso il ponte.
- **Se non c'è nessuno da colpire si va all'obiettivo, in ordine**: chi cammina sfonda
  la **porta** in fondo al ponte, poi tutti vanno sulle **caserme** (la più vicina), e
  il **castello per ultimo** (`obiettivo()`). L'utente: «una lenta agonia, non un
  flash». Le caserme reggono (1100 di vita, più 160 a livello) perché sono il primo
  bersaglio.

## La miniera, un edificio

**La miniera sta su una piazzola come una caserma** (l'utente): si costruisce, si potenzia,
si vende, si ripara, e il nemico la può abbattere. Ogni suo livello fa arrivare le monete
il 70% più in fretta finché sta in piedi (il livello di miniera di una parte è 1 + la somma
dei livelli delle sue miniere: `contaMiniere`). Costa 8 costruirla, poi 15, 24, 35, 48…
(`CRESCITA.miniera.prezzo`), ha meno vita di una caserma, e se ne fanno quante si vuole:
rush o economia diventa una scelta di spazio, oltre che di monete. Prima era un pulsante
sotto il campo, al più al livello 6. Il nemico e i giocatori finti la chiedono con l'azione
`miniera` del motore: la prima la costruisce, poi alza la più indietro.

## Niente tetti

**I livelli non hanno un massimo** (`LIV_MAX` è infinito): caserme, castello e miniere
salgono finché si pagano, e i prezzi crescono abbastanza da fermarli da soli. L'utente: «non
c'è motivo di imporre un tetto», e «se una partita tira lunga mi aspetto tutte le piazzole
piene di draghi; se succede sempre abbiamo sbagliato la taratura». Le squadre di una caserma
non escono più spesso di una ogni 2,5 secondi.

## Le scelte che non stanno su una piazzola

Costano diamanti di battaglia (💎, per non confonderli con le monete vere) e un calcolo, come gli edifici.

| scelta | cosa fa | prezzo |
|---|---|---|
| 🔧 Ripara | +40% di vita alla costruzione messa peggio, porta compresa (anche crollata) | 6 |
| 🏰 Castello | più danno, cadenza, gittata e vita (+300 per livello); si tocca sul campo | 8, 10, 14, 18, 23… |
| 💣 Bomba | **in regalo** (non si compra): spazza le truppe nemiche più fitte | 0 monete, un calcolo |

- **Il castello è l'unica costruzione che spara.** Prima c'era una torretta
  davanti alla base: tolta (l'utente: «più un potenziamento del castello»), e il
  castello ne ha preso la gittata (215, più 4 per livello) perché dal bordo deve
  coprire la porta in fondo al ponte.
- **Sotto casa il castello picchia il triplo** sul bersaglio (`difesa` 180, `vicino` ×3),
  **e ad area** col danno di base (`splash` 16, al 60%): la zona delle piazzole, non la
  porta. L'area al triplo spazzava i gruppi di chi tira: gli arcieri al livello 10 morivano
  a un colpo e non arrivavano mai sotto le mura (l'utente). Chi assedia le caserme lo paga, e
  il castello fa da «reset» automatico: lo scontro torna al centro e la superiorità non
  arriva in fretta (l'utente: «perdi troppo facilmente le caserme, il castello dovrebbe
  proteggerle di più»). Con lui le caserme da 700 a 1100 e la porta da 1000 a 1400.
- **La porta è una sola per parte e non si compra**: c'è dall'inizio, chi cammina la
  colpisce prima del resto, chi vola la scavalca. Se crolla resta il cumulo e **si
  ricostruisce riparando** (la riparazione la cerca per prima). **Provati** due muri
  in fila sulla corsia (uno finiva «dietro» all'altro e non serviva) e poi una
  muraglia attorno all'accampamento con un muro davanti al castello: bocciata,
  «qualcosa sopra il ponte e basta».
- **La miniera conviene presto e lascia scoperti**: è la scelta di strategia
  voluta dall'utente (produrre di più ma non attaccare); la riparazione e il
  castello più forte sono la risposta difensiva che prende tempo.

## La bomba: un regalo, non un acquisto

Ogni 40 secondi ne arriva una a tutti e due (se ne tengono al massimo due). Si lancia
con un calcolo di divisione ma **non costa monete**. **È un'arma difensiva**: colpisce
solo le truppe nemiche entrate nella *tua* metà (fra il fiume e il tuo castello), nel
punto dove sono più fitte e più vive (raggio 95, 700 di danno). Una bomba che colpisse
ovunque servirebbe a poco: spazzerebbe truppe lontane che non fanno ancora danno
(l'utente: «un'arma difensiva non offensiva, altrimenti non serve a nulla»).
Perché in regalo e non da comprare: è il «reset» per quando uno ha una forza
schiacciante e va avanti per inerzia, e chi è già indietro non ha le monete per una
cosa da comprare («non ne esci»). Il nemico la usa quando un ammasso di tue truppe entra nella
sua metà (vedi [nemico.md](nemico.md)); il giocatore finto idem (`motore/banco.js`).

## Rush o economia

**Si deve poter scegliere** fra attaccare subito e prima far crescere le monete (l'utente:
«vince chi fa un rush, ma dovrebbe darti almeno la possibilità di scegliere»). Si misura
con due giocatori finti ugualmente bravi, `rush` (solo caserme e potenziamenti) ed
`economia` (la cripta, poi la miniera al 3): `npm run tara:arena -- --misura`.

Con le regole di prima il rush vinceva l'80-100% e l'economia lo 0-43%, e tutte le
vittorie arrivavano allo scadere, ai punti: chi danneggia per primo vince, e le monete
della miniera arrivano quando la partita è finita. **Non basta alzare il prezzo del golem**:
il rush si fa con arcieri e opliti. Si è mosso l'insieme: la partita a 5:00, i
potenziamenti più cari, la miniera che rende di più, il castello che picchia il triplo
sotto casa, le costruzioni più dure, l'antro come investimento. Misurato prima di
ritarare: nel bosco e nella palude rush ed economia vincono tutti e due l'80-100% (e
l'economia a volte abbatte il castello prima dello scadere); nelle nevi il rush resta
avanti.

## La durata

Il castello da 4000 (più 300 a livello) cade per ultimo, dopo caserme e porta, e spesso
non cade: allora decidono i punti. **Allo scadere vince chi ha fatto
più danni** (`punti()`): ogni costruzione abbattuta vale uno, il castello abbattuto tre
(in proporzione alla vita che gli manca); entro un quarto di punto è pari. Col castello
che cade per ultimo, «vince il castello più sano» finiva quasi sempre pari.

## Si gioca toccando il campo

- **Niente carte sotto il campo**: si toccano le piazzole e il castello (l'utente: «tutta
  l'interfaccia può essere semplificata se premo sopra le piazzole, così abbiamo tutto lo
  spazio sotto»). Sopra ognuna c'è un bersaglio trasparente grande quanto l'edificio
  (`viste/Campo.vue`, le misure dalla scena); le piazzole libere hanno un «＋».
- **Una piazzola libera apre una nuvoletta** (`viste/Scelta.vue`, dentro il campo sopra la
  piazzola): il disegno di ogni truppa della tappa e la miniera, ciascuno col prezzo. Si preme
  il disegno o il prezzo; il «?» piccolo nell'angolo apre «i numeri». Niente nomi né frasi.
- **Un edificio toccato mostra l'anello**: ⬆️ potenzia (livello dopo e prezzo, o quanto
  riposa), 💰 vendi (quanto ridà), un «?» piccolo per i numeri. Il castello ha l'anello senza
  vendere. **Vendere non chiede un calcolo**: due tocchi (il primo cambia 💰 in ✓, il secondo
  vende e ridà metà della spesa, `vendiSubito` in `Gioco.vue`); `AZIONI.vendi.op` resta nei
  dati ma chi gioca non lo incontra più. Toccarlo di nuovo o toccare il campo lo chiude; il campo
  intanto non si ferma.
- **I dettagli** (`viste/Dettagli.vue`, la scheda dei «numeri») hanno le righe «adesso →
  livello dopo» di `motore/dettagli.js`, tre righe su chi colpisce e se vola, il pulsante col
  prezzo, e per un edificio costruito «Vendi» in disparte.
- **Il campo sta fermo** finché dettagli o nuvoletta sono aperti: servono a confrontare
  con calma.
- **Sotto resta una barra sottile**: le monete, 🔧 ripara e 💣 bomba, che non stanno su un
  edificio.

## Il respiro

Il castello **spara da solo dal primo secondo** e il nemico si costruisce la cripta
dopo un paio di secondi: chi non fa niente resisteva una cinquantina di secondi
(misurato dal banco prima che il castello picchiasse il triplo sotto casa: adesso di più).
Il tempo di decidere c'è, poi la base viene sopraffatta.

## Nei test

`[data-piazzola=<n>]` (con `data-variante=<truppa|miniera>` se c'è un edificio), `[data-castello]`,
`[data-anello=potenzia|vendi|numeri]`, `[data-scelta=<n>]`, `[data-costruisci=<truppa|miniera>]`,
`[data-dettagli=<truppa|miniera|ripara|bomba>]`, `[data-vendi]`, `[data-azione=ripara|bomba]`, `[data-monete]`, `[data-avviso]`,
`[data-tappa=<n>]`, `[data-infinita]` (la voce della battaglia infinita in cima alla mappa, `disabled` se chiusa), `[data-ancora]` (il tasto del cartello di fine), `[data-fine=vinta|persa|pari]`.
