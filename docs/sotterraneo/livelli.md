# L'eroe sale di livello

Da quando l'utente ha visto Diablo (8 ottobre 2026) l'eroe cresce: battendo
i mostri prende esperienza, sale di livello, e a ogni livello ha un punto da
dare a una di quattro caratteristiche. Qui l'esperienza, i livelli, le
caratteristiche, la regola del bilanciamento, le classi, la pagina
dell'eroe e le misure. La roba con livello e rarità sta in
[rarita.md](rarita.md), i mostri grossi in [grossi.md](grossi.md).

Il codice: `dati/livelli.js` (le soglie, quanto rende un punto, l'esperienza
di un mostro), `dati/eroi.js` (`parte`, `vitaPerLivello`, `dote`),
`motore/crescita.js` (i punti, la regola, quanto aggiunge la crescita),
`motore/corredo.js` (`piu`, `livelloEroe`, `caratteristiche()`),
`motore/corsa.js` (`guadagna`, `daiUnPunto`), `viste/PaginaEroe.vue`.

## L'esperienza viene solo dai mostri

- **Tanta quanto sono forti**: `espDi` conta la specie (le ossa e l'attacco
  del bestiario, `dati/mostri.js`) e quanto è giù il posto (il livello del
  posto, `livelloDelPosto` in `dati/campagna.js`: +30% a livello). Il mostro
  grosso tre volte tanto (`ESP_DEL_CAPO`). Decisione dell'utente: *«fermiamoci
  all'esperienza che si accumula uccidendo i mostri: più i mostri son forti,
  più esperienza»*. Niente per i piani nuovi né per le missioni.
- **Provato: contarla sulle ossa vere del mostro**, già moltiplicate dalla
  discesa (`forza`). Si avvitava: indurendo una discesa i mostri davano più
  esperienza, l'eroe saliva di livello a metà discesa, e la discesa diventava
  più facile quanto più la si induriva. Il banco non trovava una taratura.
- **L'esperienza resta anche perdendo**: i mostri battuti sono battuti. Il
  cartello di fine la dice (`[data-esp-presa]`).

## Le soglie

`sogliaDi(n)` è l'esperienza che serve per il livello `n`: un salto costa
`ESP_A · n + ESP_B` (14 e 16), quindi il totale cresce col quadrato, mai
esponenziale ([../apprendimento/calibrazione.md](../apprendimento/calibrazione.md#le-curve-mai-esponenziali)).
Oltre il livello 12 (`ESP_OLTRE`, dove finisce la storia) ogni livello costa
anche `120 + 10 · (2m + 1)`, con m i livelli sopra il 12 (`ESP_R`, `ESP_Q`):
una retta come l'esperienza di una zona, così una zona verde vinta vale più o
meno un livello a ogni altezza ([zone.md](zone.md#lesperienza)). Provato: il
cubo di m, messo per l'abisso; dal 18 una zona valeva 0,2 livelli. L'abisso
dà un terzo dell'esperienza, e cresce come prima.

| livello | 2 | 3 | 5 | 8 | 10 | 12 | 15 | 20 | 30 |
|---|---|---|---|---|---|---|---|---|---|
| esperienza | 30 | 74 | 204 | 504 | 774 | 1100 | 2144 | 4564 | 11954 |

## Salire di livello

- **A ogni livello**: la vita della classe (`vitaPerLivello`: 3 il
  cavaliere, l'elfa e il nano, 2 il mago), un punto da dare
  (`PUNTI_PER_LIVELLO`) e un punto per l'albero delle abilità
  ([abilita.md](abilita.md)). La vita in più arriva subito.
- **Non si torna in piena forma.** Provato, come in Diablo: a metà discesa
  era una pozione gratis, e siccome l'esperienza arriva combattendo, chi
  sbagliava di più (e combatteva più a lungo) si ritrovava curato più spesso.
- **Si festeggia**: la colonna di luce d'oro sull'eroe (`colonneDiLuce` in
  `scena/tela.js`), la riga dell'esperienza che si accende, un arpeggio suo
  (`suoniDellaFesta` in `Gioco.vue`) e in mezzo al campo «✨ Livello 5!» con
  sotto «Un punto per l'eroe e uno per le abilità». Il gioco ricorda a chi gioca di rado
  dove si danno i punti: il «+» d'oro sul livello (e sul globo blu, per
  l'albero) resta finché non li dà.

## Le quattro caratteristiche

Dal 9 ottobre 2026 sono Forza, Destrezza, Intelligenza e Tempra: scorza e
fortuna sono uscite (l'utente), perché alzare la forza conveniva a tutti e
le classi si somigliavano. La fortuna resta solo sulla roba.

| | dà l'attacco a | a tutti, per punto | è il requisito di |
|---|---|---|---|
| Forza | spade e asce | — | spade e asce |
| Destrezza | archi | 1% di schivata dei graffi | archi |
| Intelligenza | bacchette e bastoni | un punto di energia massima | bacchette e bastoni |
| Tempra | — | tre di vita, e una difesa ogni tre punti | — |

- **L'attacco viene dalla caratteristica dell'arma in mano** (`carDellArma`
  in `motore/corredo.js`, `car` delle famiglie in `dati/eroi.js`): l'elfa con
  la spada cresce di forza, con l'arco di destrezza. **A mani nude e con
  un'arma senza famiglia** (la mazza, i pezzi dei grossi) **conta la più
  alta** delle tre. Provato con la forza: il mago con la Mazza di Grumo, e a
  mani nude nella scalinata, non picchiava più. Un arco può picchiare meno
  dei pugni a chi ha alzato la forza: il mercante non lo propone
  (`sottoAddosso` in `motore/bottega.js`).
- **La difesa che era della scorza sta nella tempra, a un terzo di ritmo**:
  la difesa entra in una sottrazione e vale il doppio dell'attacco
  ([abisso.md](abisso.md)). Provata sulla forza: chi alzava la forza per
  l'attacco prendeva anche la difesa, e il nano e l'elfa (la loro dote è la
  forza) a quattro su dieci vincevano quasi tutto; il mago, che la forza non
  la alza, restava senza difesa e non arrivava in fondo.
- **L'intelligenza è il mana**: l'energia massima è 5 più l'intelligenza
  ([abilita.md](abilita.md)), quindi il mago parte da dieci, il cavaliere e
  il nano da sei.
- **Le caratteristiche di partenza raccontano i numeri della classe**
  (`parte` in `dati/eroi.js`): la caratteristica di ogni arma che la classe
  porta vale il suo braccio, più o meno uno (`guastiDegliEroi` lo
  pretende). La crescita aggiunge quello che sale oltre (`piuDellaCrescita`),
  e al livello 1 i numeri sono quelli di sempre.
- **La pagina le mostra in medaglioni** come l'albero (`glifo` e `tinta` in
  `CARATTERISTICHE`), e sotto il «+» dice cosa cambierebbe: l'attacco se è
  la caratteristica dell'arma in mano, la difesa quando la tempra arriva al
  punto che la alza, la vita, la schivata, l'energia.
- **La roba può dare le stesse cose**: le abilità dei pezzi
  ([rarita.md](rarita.md)) si sommano ai punti. Si sommano tutte (arma,
  scudo, livello, punti): il banco misura la somma, non le parti
  ([Le misure](#le-misure)).
- **Un salvataggio di prima** (con scorza e fortuna, `v` diverso da 2 in
  `crescita`) tiene esperienza e albero, e i punti tornano tutti da dare.

## I requisiti delle armi

Regola dell'utente: **rigidi, sotto il requisito l'arma non si indossa**.
Il requisito è la caratteristica della famiglia, tanta quanto il gradino
(`REQUISITO_DEL_GRADINO`: 0, 1, 3) più un punto ogni quattro livelli del
pezzo (`requisitoDi` in `dati/eroi.js`): uno spadone di livello 13 vuole
forza 6. Mite apposta: chi alza la caratteristica della sua arma non lo
sente, chi la lascia indietro sì.

- **Si raccoglie lo stesso**, e si vende: il limite è sull'indossare
  (`posso`), il bottino predilige la classe come prima (`porta`), così il
  caso dei forzieri non è cambiato.
- **Si dice perché**: «Serve Forza 7 (hai 5)» sulla tasca e al banco
  (`perchéNo`), e il requisito sta sulla riga sotto il nome di ogni arma
  («Spada · a una mano · livello 7 · comune · Forza 2»).
- **Il mercante e la storia propongono il pezzo al livello più alto che si
  impugna** (`livelloPortabile`): un'arma da guardare e basta non serve.
- **La roba della storia si indossa con i punti dati come il banco**:
  `unita/sotterraneo-livelli` lo controlla discesa per discesa.
- Riassegnando i punti, quello che non si regge più torna in tasca
  (`sistemaIlCorredo`).

## Riassegnare

Niente scelte per sempre (l'utente): i punti delle caratteristiche e quelli
dell'albero si possono riassegnare, a **5 gemme a punto da rimettere**
(`GEMME_PER_RIASSEGNARE`). Abbastanza per non farlo a ogni discesa, poco per
rimediare a un errore. «Riassegna 💎 40» sta accanto ai punti da dare, nella
pagina dell'eroe e nell'albero; il primo tocco chiede «Sicuro?», il secondo
fa. Sopra e sotto.

## La regola del bilanciamento

Regola dell'utente: il bambino sceglie, ma non può alzare troppo una
caratteristica lasciando indietro le altre. **Fra due caratteristiche
qualsiasi, contando solo i punti dati** (non la partenza della classe, non
la roba), va bene se la differenza è al più 8 (`SCARTO_AMMESSO`) **oppure**
se la più bassa è almeno la metà della più alta: 18 e 12 sì, 18 e 7 no, 50 e
30 sì (`stannoInsieme` in `motore/crescita.js`).

- **Il «+» che romperebbe la regola è spento** (`chiTrattiene`, `puoiDare`),
  e dice perché: «prima un po' di tempra»; la caratteristica rimasta
  indietro brilla d'oro e dice «prima un po' di questa». Mostra invece di
  spiegare.
- **Un «+» acceso c'è sempre** finché ci sono punti: la caratteristica più
  bassa si può sempre alzare (`unita/sotterraneo-livelli` lo prova su
  duemila mani a caso).
- Il banco li dà come una classe li darebbe (`COME_LI_DA`, dove la classe è
  debole prima) e, se la regola lo ferma, alla più bassa (`prossimoPunto`).

## Le classi partono diverse e crescono diverse

| | parte (forza · destrezza · intelligenza · tempra) | vita a livello | dote, ogni tre livelli |
|---|---|---|---|
| 🛡️ Cavaliere | 3 · 2 · 1 · 4 | 3 | tempra |
| 🧝 Elfa | 4 · 4 · 2 · 3 | 3 | forza |
| 🧙 Mago | 1 · 2 · 5 · 2 | 2 | tempra |
| 🧔 Nano | 3 · 2 · 1 · 5 | 3 | forza |

- **La dote** è un punto che la classe prende da sé ogni `DOTE_OGNI` (3)
  livelli nella sua caratteristica: si vede come un numero che sale senza
  averlo dato. Non conta nella regola del bilanciamento (non è un punto dato).
- Provato: la dote del nano nella scorza (la sua forza vera) lo rendeva
  quasi invincibile nelle ultime discese mentre il mago non arrivava in
  fondo. Al mago, che ogni sbaglio fa malissimo, la tempra (era la scorza,
  che non c'è più).

## La pagina dell'eroe

`viste/PaginaEroe.vue`, nella cornice dello zaino. Si apre dal livello
nella barra in basso (sopra e sotto, [barra.md](barra.md)), e porta
all'albero delle abilità col tasto «🔷 Abilità» ([abilita.md](abilita.md)).
Dall'alto: il
ritratto armato, il nome, il livello e la barra dell'esperienza («✨ 5 /
72»); i numeri che decidono uno scontro (❤️ ⚔️ 🛡️ 💎: attacco e difesa non
stanno più in cima allo schermo); «Hai 2 punti da dare» in oro, o senza punti
«Batti i mostri: a ogni livello, un punto da dare»; le quattro righe con
l'icona, il nome, il valore, la frase corta, prima → dopo e un «+» grande
(52 px); in fondo la porta dei Tesori ([rarita.md](rarita.md#i-leggendari-e-i-tesori)).
Sopra, sotto i numeri, i tratti della roba addosso («💎 ×1,5», «🔦 vedi più
lontano»), e in fondo **«Cambia eroe»**: un tasto piccolo a bordo d'oro, non
un altro tasto grosso, che chiude la pagina e apre la scelta delle avventure
([avventure.md](avventure.md)). Stava in una carta in fondo alla mappa,
insieme al ritratto e al livello: la carta è stata tolta perché diceva due
volte quello che il globo e la pagina dicono già (l'utente, 9 ottobre). Giù
non c'è: si cambia dal velo della pausa ([portale-e-sosta.md](portale-e-sosta.md)).
Si chiude con la ✕ o toccando fuori; giù non si apre durante uno scontro.
I numeri li dà il motore (`Corredo.caratteristiche()`): la pagina li mostra.

## Le misure

Il livello con cui si entra in ogni discesa (`LIVELLI_ATTESI` in
`dati/storia.js`) è quello di chi va dritto alla scala rispondendo bene otto
volte su dieci e rifacendo quella persa, misurato col banco sulla storia
giocata davvero (`misuraConLaRoba`, fila `minimo`): 1 · 1,7 · 3,1 · 4,8 ·
6,8 · 8,5 · 10,3, e l'abisso dopo la miniera. Chi gira tutto arriva tre
livelli sopra: 1 · 2 · 4,2 · 6,5 · 8,9 · 11 · 13.

| entra in | cripta | scalinata | torre | grotta | sommersa | botola | miniera | abisso |
|---|---|---|---|---|---|---|---|---|
| livello atteso | 1 | 2 | 3 | 5 | 7 | 8 | 10 | 12 |

Le misure della storia con i livelli (la tabella, i livelli sotto e sopra,
la somma di roba e livelli) stanno in
[la-grande-storia.md](la-grande-storia.md#le-misure).

Nei test: `unita/sotterraneo-livelli` (le soglie, l'esperienza solo dai
mostri e tanta quanto sono forti, il livello salito giù con la sua vita e la
festa, quanto rende ogni caratteristica e con quale arma, la crescita di
prima che torna da dare, le doti, i requisiti delle armi e la roba della
storia che si indossa, riassegnare a gemme, la regola coi tre esempi
dell'utente e il «+» acceso sempre, la pagina coi «+» spenti e la
caratteristica indietro), `misure/sotterraneo` (due livelli sotto e tre
sopra), `integrazione/sotterraneo-eroe` (col dito: il «+» d'oro sul livello,
la pagina dal livello, la mappa senza la carta e il «Cambia eroe» della pagina, il «+» spento e quello che brilla, un
punto dato, i Tesori, il livello salito battendo il mostro grosso). Sulla
barra `[data-azione="eroe-pagina"]` con `data-livello` e `data-punti`, la riga
`[data-esperienza-barra]` con fatta/serve in `.sot-esp-numero`; sopra non
c'è più la carta (`[data-chi-sopra]`, `[data-roba-sopra]` e `[data-azione="ritratto"]`
non esistono); la pagina `[data-pagina-eroe]` con `[data-livello-eroe][data-livello]`,
`[data-esperienza]` (`data-fatto`, `data-serve`), `[data-numero="vita|att|dif|gemme"]`,
`[data-azione="riassegna"][data-costo]`, `[data-punti-da-dare][data-n]`, le righe `[data-caratteristica="<chiave>"]` con
`data-valore`, `data-dati`, `data-trattenuta`, `data-indietro`, dentro
`[data-cambia]` e il «+» `[data-azione="dai"][data-dai="<chiave>"]`,
`[data-azione="tesori"]`, `[data-tratti-eroe]` (sopra), `[data-azione="eroe"]` («Cambia eroe», solo sopra); giù la festa `[data-livello-su][data-livello]`,
nel cartello di fine `[data-esp-presa]`.
