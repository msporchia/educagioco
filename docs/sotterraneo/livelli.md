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
anche `20 · (n − 12)³`: nell'abisso i mostri crescono a ogni piano, e senza
il cubo l'eroe saliva più in fretta di loro (misurato: livello 34 al piano
30).

| livello | 2 | 3 | 5 | 8 | 10 | 12 | 15 | 20 |
|---|---|---|---|---|---|---|---|---|
| esperienza | 30 | 74 | 204 | 504 | 774 | 1100 | 2234 | 13204 |

## Salire di livello

- **A ogni livello**: la vita della classe (`vitaPerLivello`: 3 il
  cavaliere, l'elfa e il nano, 2 il mago) e un punto da dare
  (`PUNTI_PER_LIVELLO`). La vita in più arriva subito.
- **Non si torna in piena forma.** Provato, come in Diablo: a metà discesa
  era una pozione gratis, e siccome l'esperienza arriva combattendo, chi
  sbagliava di più (e combatteva più a lungo) si ritrovava curato più spesso.
- **Si festeggia**: la colonna di luce d'oro sull'eroe (`colonneDiLuce` in
  `scena/tela.js`), il globo dell'esperienza che si accende, un arpeggio suo
  (`suoniDellaFesta` in `Gioco.vue`) e in mezzo al campo «✨ Livello 5! Tocca
  il globo viola: hai un punto da dare». Il gioco ricorda a chi gioca di rado
  dove si danno i punti: il «+» d'oro sul globo resta finché non li dà.

## Le quattro caratteristiche

| | rende, per punto dato | si legge sulla pagina |
|---|---|---|
| ⚔️ Forza | ⚔️ +1 attacco | «⚔️ 12 → 13» |
| ❤️ Tempra | ❤️ +3 vita | «❤️ 66 → 69» |
| 🛡️ Scorza | 🛡️ +1 difesa ogni due punti | «🛡️ 3 → 3½» |
| 🍀 Fortuna | 💎 +5% gemme e roba non comune un dodicesimo più spesso | «💎 ×1,05 → ×1,1» |

- **La scorza va a mezzo ritmo** perché la difesa entra in una sottrazione e
  vale il doppio dell'attacco ([abisso.md](abisso.md)): con un punto a punto,
  tutto nella scorza voleva dire non farsi più male. Il mezzo scudo si vede
  («3½»): ogni punto cambia qualcosa sulla pagina.
- **Le caratteristiche di partenza raccontano i numeri della classe**
  (`parte` in `dati/eroi.js`): la forza è il braccio, la scorza è il doppio
  della difesa (`guastiDegliEroi` lo pretende). La crescita aggiunge sopra
  (`piuDellaCrescita`).
- **La roba può dare le stesse cose**: le abilità ⚔️ 🛡️ ❤️ 🍀 dei pezzi
  ([rarita.md](rarita.md)) si sommano ai punti. Si sommano tutte (arma,
  scudo, livello, punti): il banco misura la somma, non le parti
  ([Le misure](#le-misure)).

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

| | parte (forza · tempra · scorza · fortuna) | vita a livello | dote, ogni tre livelli |
|---|---|---|---|
| 🛡️ Cavaliere | 3 · 4 · 2 · 1 | 3 | tempra |
| 🧝 Elfa | 4 · 3 · 2 · 2 | 3 | forza |
| 🧙 Mago | 5 · 2 · 0 · 3 | 2 | scorza |
| 🧔 Nano | 3 · 5 · 4 · 1 | 3 | forza |

- **La dote** è un punto che la classe prende da sé ogni `DOTE_OGNI` (3)
  livelli nella sua caratteristica: si vede come un numero che sale senza
  averlo dato. Non conta nella regola del bilanciamento (non è un punto dato).
- Provato: la dote del nano nella scorza (la sua forza vera) lo rendeva
  quasi invincibile nelle ultime discese mentre il mago non arrivava in
  fondo; la scorza al mago, che ogni sbaglio fa malissimo, li avvicina.

## La pagina dell'eroe

`viste/PaginaEroe.vue`, nella cornice dello zaino. Si apre dal globo
dell'esperienza della barra in basso (sopra e sotto, [barra.md](barra.md)) e
dal ritratto della carta di chi scende sulla terra di sopra. Dall'alto: il
ritratto armato, il nome, il livello e la barra dell'esperienza («✨ 5 /
72»); i numeri che decidono uno scontro (❤️ ⚔️ 🛡️ 💎: attacco e difesa non
stanno più in cima allo schermo); «Hai 2 punti da dare» in oro, o senza punti
«Batti i mostri: a ogni livello, un punto da dare»; le quattro righe con
l'icona, il nome, il valore, la frase corta, prima → dopo e un «+» grande
(52 px); in fondo la porta dei Tesori ([rarita.md](rarita.md#i-leggendari-e-i-tesori)).
Si chiude con la ✕ o toccando fuori; giù non si apre durante uno scontro.
I numeri li dà il motore (`Corredo.caratteristiche()`): la pagina li mostra.

## Le misure

Il livello con cui si entra in ogni discesa (`LIVELLI_ATTESI` in
`dati/storia.js`) è quello di chi va dritto alla scala rispondendo bene otto
volte su dieci e rifacendo quella persa, misurato col banco sulla storia
giocata davvero (`misuraConLaRoba`, fila `minimo`): 1 · 1,7 · 3,1 · 4,8 ·
6,8 · 8,5 · 10,3, e l'abisso dopo la miniera. Chi gira tutto arriva tre
livelli sopra: 1 · 2 · 4,3 · 6,6 · 8,9 · 11 · 13,4.

| entra in | cripta | scalinata | torre | grotta | sommersa | botola | miniera | abisso |
|---|---|---|---|---|---|---|---|---|
| livello atteso | 1 | 2 | 3 | 5 | 7 | 8 | 10 | 12 |

Le misure della storia con i livelli (la tabella, i livelli sotto e sopra,
la somma di roba e livelli) stanno in
[la-grande-storia.md](la-grande-storia.md#le-misure).

Nei test: `unita/sotterraneo-livelli` (le soglie, l'esperienza solo dai
mostri e tanta quanto sono forti, il livello salito giù con la sua vita e la
festa, quanto rende ogni caratteristica, le doti, la regola coi tre esempi
dell'utente e il «+» acceso sempre, la pagina coi «+» spenti e la
caratteristica indietro), `misure/sotterraneo` (due livelli sotto e tre
sopra), `integrazione/sotterraneo-eroe` (col dito: il «+» d'oro sul globo,
la pagina dal ritratto e dal globo, il «+» spento e quello che brilla, un
punto dato, i Tesori, il livello salito battendo il mostro grosso). Sulla
barra `[data-azione="eroe-pagina"]` con `data-punti`, il globo
`[data-globo="esperienza"]` col livello in `.sot-globo-numero`; la carta di
sopra `[data-azione="ritratto"]`, `[data-roba-sopra]` con `data-livello`;
la pagina `[data-pagina-eroe]` con `[data-livello-eroe][data-livello]`,
`[data-esperienza]` (`data-fatto`, `data-serve`), `[data-numero="vita|att|dif|gemme"]`,
`[data-punti-da-dare][data-n]`, le righe `[data-caratteristica="<chiave>"]` con
`data-valore`, `data-dati`, `data-trattenuta`, `data-indietro`, dentro
`[data-cambia]` e il «+» `[data-azione="dai"][data-dai="<chiave>"]`,
`[data-azione="tesori"]`; giù la festa `[data-livello-su][data-livello]`,
nel cartello di fine `[data-esp-presa]`.
