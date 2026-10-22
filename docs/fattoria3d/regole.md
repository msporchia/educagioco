# Le regole della fattoria 3D

I principi, e dove vivono: le regole sono tutte in `motore/fattoria3d.js` (pure: niente schermo, niente profilo), i numeri
in `dati/`. Da leggere prima di toccare un prezzo, un tempo o un rifiuto. Il perché di fondo è quello della fattoria di
sempre ([../fattoria/regole.md](../fattoria/regole.md)); qui le differenze.

## Risorse sue, monete vere

- **Raccolti, prodotti, lana, terra e pezzi stanno nello stato suo**, `profile.campagne.fattoria3d.cfg.stato`
  (scritto da `Gioco.vue` con `ricorda`, a ritardo e subito quando la pagina sparisce). Non si leggono né si scrivono
  quelli di `campagne.fattoria`: le due fattorie non si fanno casino a vicenda.
- **Le monete sono le vere** (`state.profile.coins`). Il motore non le conosce: passano da una `borsa` (`quante()`,
  `paga(n)`) che gli dà `Gioco.vue`. Un rimborso (`rimborsa`) **non conta come
  guadagnato**: non gonfia `totals.monete`.
- **Niente si vende**: il verso è sempre monete → cose. Le monete entrano solo dagli esercizi degli altri giochi. Anche con i vicini ([vicini.md](vicini.md)): vendere dà esperienza e roba, mai monete.

## Cosa non succede mai

- **Niente marcisce.** Un campo maturo resta maturo, il forno tiene i pronti finché non si ritirano, la lana pronta
  aspetta la forbice. Il tempo avanza anche a pagina chiusa: i campi leggono `ora()`, la cottura si rimette in pari
  con `tick()`.
- **Niente si perde.** Un pezzo messo via va nel magazzino e si ripiazza gratis. Non c'è un «annulla»: si paga al rilascio, e un rilascio che non va non costa niente.
- **Un rifiuto dice cosa fare** (`dettoDi` in `scena3d/azioni.js`): «Serve foraggio: lo fa il fienile», «Compra prima un terreno che
  confina con questo», non un «no» nudo.

## Quanto costa

| cosa | costo | perché |
|---|---|---|
| un campo | 20 + 8 per ogni copia (anche nel magazzino) | il rincaro lineare della fattoria di sempre |
| recinto / bancarella / bacheca / fontana | 45 / 15 / 12 / 30 | fissi; nel recinto una pecora, le altre si comprano (40, 60, 80) |
| aiuola / panchina / pozzo / spaventapasseri | 6 / 10 / 18 / 12 | decorazioni, fissi |
| passerella / ponte / tavolo | 8 / 14 / 18 | decorazioni (liv 3 / 5 / 4), fisse |
| stagno / laghetto | 35 / 110 | decorazioni d'acqua (liv 5 / 11), fisse; non produttive: non spostano la scaletta ([laghi.md](laghi.md)) |
| molo / molo girato / porticciolo | 12 / 12 / 90 | la pesca (liv 4 / 4 / 9), fissi; il porticciolo è uno solo e sta sulla riva; non produttivi ([geografia-e-pesca.md](geografia-e-pesca.md)) |
| friggitoria / sushi bar | 170 / 180 | edifici unici come gli altri (liv 17 / 18: i due livelli in coda alla scaletta), le ricette della 2D col pesce ([geografia-e-pesca.md](geografia-e-pesca.md)) |
| pollaio / stalla | 55 / 90 | liberi nel terreno come il recinto; una bestia nel prezzo, le altre una per volta, sempre più care ([animali.md](animali.md)) |
| mulino / panificio / caseificio / cucina / gelateria | 60 / 90 / 120 / 110 / 140 | unici (uno per tipo), si mettono dove si vuole ([edifici-liberi.md](edifici-liberi.md)); la cucina ha ancora l'id `conserviera` |
| pastificio (id `pasticceria`) / mongolfiera | 80 / 100 | unici, si mettono dove si vuole |
| un lotto di terreno | 40 + 20 per ogni lotto comprato oltre i nove di partenza, più 2 per il quadrato dei lotti oltre il 33° (il 100° costa 10 998) | non ci sono confini, il prezzo li fa: [mondo-infinito.md](mondo-infinito.md) |
| **un pezzo nuovo** | il prezzo, **pagato quando lo lasci sulla mappa** (`compraEMetti`) | niente conferma: il prezzo è sulla carta; senza monete il fantasma è rosso e il rilascio dice «Servono 🪙 N» |
| tagliare un albero | 3 | trenta secondi di esercizio: un albero si toglie, non dà niente (niente legna) |
| togliere un sasso o un cespuglio | 1 | pochi per lotto, restano anche dopo l'acquisto del lotto |
| spostare o mettere via un pezzo (anche un edificio) | 1 | non è un tavolino da spostare per ore; rimetterlo dov'era è gratis |
| un pezzo di strada | 1 | togliere è gratis |

I numeri stanno in `dati/catalogo.js` e `dati/regole.js`. Misurati sul metro di [calibrazione.md](../apprendimento/calibrazione.md)
(una moneta = dieci secondi di esercizio) con `npm run tara:fattoria3d`: ogni pezzo produttivo costa fra un quarto e due terzi
del salto del suo livello (il campo 3 minuti di esercizio, il mulino 10, la gelateria 23), le decorazioni meno di un decimo. Il
resto è in [livelli.md](livelli.md).

## I campi

Quattro tessere per campo, un raccolto per tessera (`TESSERE`): una coltura matura per intero, e si taglia una tessera alla
volta (`raccogliTessera`). Il tempo è vero (16 s il grano e le carote, 70 s il riso: sedici colture, crescente col livello; l'erba medica, che serve solo al fienile, è la più svelta e sta fuori dalla regola). Seminare è gratis. **Un campo che sta crescendo non
si mette via**.

## I pezzi calpestabili

Passerella (1×3) e ponte (3×1) hanno `calpestabile: true` e `alzato` (la quota di chi ci cammina; per il ponte una per cella, la
gobba) in `dati/catalogo.js`. Sono **decorazione per fare camminamenti**: niente acqua sotto, niente altre regole.
- **Il passo li attraversa**: `libera` (contadino, compagni, celle di servizio) li conta libere; **il costruire no**: `blocca`, `puoMettere`
  e `disegnaStrada` le trovano occupate, quindi sopra non si mette nient'altro e non si sposta un pezzo lì sopra.
- **Contano come strada nel percorso** (`sullaStrada`: costo ridotto e passo svelto), ma non sono strada (`eStrada` resta 0, non si
  salvano in `strade`, non si tolgono col pennello).
- Si **toccano per salirci**: il contadino va su una loro cella (`celleDiServizio`). Il tavolo, invece, è un pezzo qualunque: ferma il passo.
- **Il molo e il molo girato** (3×1, 1×3) sono calpestabili e `suAcqua` come la passerella (una cella almeno sulla riva, o un altro molo accanto), ma sono posti di pesca: in punta si lancia la lenza ([geografia-e-pesca.md](geografia-e-pesca.md)).

## Le pecore

`agnello → adulta → tosata (ha fame) → pasto → lana che ricresce`, e a volte ne nasce una nuova (`PECORE` in `dati/regole.js`). **Si parte con
una pecora adulta, con fame** (nel prezzo del recinto); **le altre si comprano dal cartello sopra il recinto** (adulte, 🪙40, 60, 80, fino a
quattro: [animali.md](animali.md)), come le galline e le mucche. Con due adulte le nascite ricominciano:

- **le pecore mangiano foraggio**, il mangime del fienile come l'ovile della 2D ([mangime-e-catena.md](mangime-e-catena.md)): non un raccolto qualsiasi. Un agnello **cresce dopo due pasti** (un foraggio a pasto);
- **dopo la tosa la pecora ha fame** (`t0: null`), come una gallina o una mucca: la lana ricresce in 25 s, ma **dal pasto**, non dalla tosa
  (`pastiPerLana`: un foraggio). Una pecora affamata non fa lana, e il tempo che passa non cambia
  niente: niente muore, niente marcisce, una pappa a ogni giro. Si tosa: `+1 🧶` a pecora;
- **due adulte nutrite due volte fanno nascere un agnellino**, fino a quattro pecore per recinto (acquisti e nascite dividono lo
  stesso tetto);
- toccando il recinto il contadino sceglie da solo (`provaCura`): prima tosa (se c'è lana pronta), poi **nutre le tosate affamate** (tutte in un gesto,
  finché c'è da mangiare), poi l'agnello o la nascita; se tutte sono al lavoro dice «la lana ricresce, ancora N s». La pecora comprata arriva
  con fame e il giro di pappa dell'acquisto le dà il primo pasto. Un recinto con le pecore **non si
  mette via** (si sposta).

## Gli animali da cortile

Pollaio (uova) e stalla (latte): una bestia nutrita fa il suo prodotto dopo un tempo e lo tiene finché non lo si raccoglie;
niente muore. → [animali.md](animali.md)

## I livelli

Quasi tutto si apre con un **livello**, che sale spendendo monete qui dentro: pezzi, edifici, colture e ricette hanno un
`liv`, e ciò che non è arrivato rifiuta con `non-sbloccato` e il livello a cui arriva. Ciò che si possiede resta: il livello
vale solo per comprare, seminare e avviare. → [livelli.md](livelli.md)

## Le macchine

Fienile (il mangime delle bestie: [mangime-e-catena.md](mangime-e-catena.md)), mulino, pastificio (id `pasticceria`), panificio, caseificio, cucina (id `conserviera`), gelateria, telaio, zuccherificio, sartoria e tintoria sono **macchine** con le ricette della fattoria di sempre ([merci-e-ricette.md](merci-e-ricette.md)) (`MACCHINE` in `dati/ricette.js`): ognuna ha le
sue ricette (raccolti precisi e un tempo), **un posto di partenza** e cuoce **uno alla volta**. Gli ingredienti si scalano
subito, il successivo parte quando finisce il precedente; i pronti restano finché non si ritirano (`ritiraDa`) e passano
in dispensa (`stato.prodotti`).

- **I posti si comprano, per macchina, fino a sei** (`dati/posti.js`): è la fila della 2D tale e quale ([../fattoria/macchine.md](../fattoria/macchine.md), «La fila»),
  perché il metro è lo stesso (🪙1 = 10 s di esercizio): si parte con **un** posto, il 2º, 3º, 4º, 5º e 6º costano **🪙20 · 40 · 80 · 160 · 320**
  (`PREZZI_DEI_POSTI`; un test li confronta con `PREZZI_DELLA_FILA` della 2D). In tutto 🪙620 per macchina, sotto le due ore di esercizio (🪙720):
  `guastiDeiPosti`. La fila è autonomia, e l'autonomia si compra; qui c'è una macchina per tipo, quindi una fila lunga lascia solo
  caricare di più (non va più svelta). `compraPosto(tipo)` paga (**conta come esperienza**, come ogni acquisto, quindi fa salire di livello; la
  scala di `npm run tara:fattoria3d` non lo conta, ed è verde), senza conferma; rifiuti `non-posseduta`, `pieno` (al sesto), `poche-monete` (con `costo`);
  evento `posto` (`macchina`, `posti`), nessun traguardo. `postiDi(tipo)` dice quanti sono; `avviaRicettaIn` rifiuta con `forno-pieno` quando la coda li riempie.
- **Lo stato**: `stato.macchine[tipo].posti` (default 1, tetto 6, `normalizza` lo rimette in forma). Niente salto di versione: un vecchio stato senza il campo vale 1, ma
  **una coda già lunga (fino a tre, quando i posti erano tre) lavora fino in fondo**; poi si torna ai posti pagati, come fa la 2D.
- **Nel foglio** i posti oltre quelli posseduti sono vani chiusi col prezzo («＋ 🪙 20», `data-f3="posto-chiuso"`), il prossimo in evidenza
  (`data-prossimo`): un tocco compra, un rifiuto dice «Servono 🪙 N». Il cartello sopra la macchina conta «posti occupati» sui posti veri.
- **Ogni macchina ha il suo nome per la sezione dei posti** (`LAVORAZIONE`, `dentroDi(tipo)` in `dati/ricette.js`): mulino «Alla macina», pastificio e panificio
  «Nel forno», caseificio «Nel paiolo», cucina «Sul fuoco», gelateria «Nella gelatiera», telaio «Al telaio», zuccherificio «Nella caldaia», sartoria «In sartoria»,
  tintoria «Nella tinozza»; i pronti dicono tutti «Pronto da ritirare». Un test controlla che ognuna ne abbia uno e che solo i forni dicano «forno».

- **Un ingrediente è un raccolto o il prodotto di un'altra macchina** (catena): grano → farina (mulino) → pane integrale
  (panificio); può anche uscire dalla stessa macchina (la pasta per le lasagne, come in 2D). **Un solo ingrediente è un contatore**: la
  lana (`stato.lana`, quella della tosa), per telaio e sartoria: `scortaDi` e `_togli` la trattano come le altre merci ([merci-e-ricette.md](merci-e-ricette.md)).
- **Gli id delle ricette sono globali** (sono le chiavi di `prodotti`), sono quelli della 2D e non coincidono con quelli delle colture.
- **Un edificio è un pezzo libero** ([edifici-liberi.md](edifici-liberi.md)): si compra dal menu e si paga al rilascio, nel terreno proprio, uno per
  tipo (`gia-tuo`). Non si mette via se la macchina lavora o ha pronti (`macchina-al-lavoro`); spostarla si può sempre e la coda la segue.
- **Un ingrediente può anche essere `uova` o `latte`** delle bestie ([animali.md](animali.md)).
- I prodotti servono al banco: li chiedono i clienti ([ordini.md](ordini.md)).

## La mongolfiera

È la nave: un carico di tre file di casse (una merce per fila, solo prodotti finiti, mai impossibili al livello) che si riempie un po' alla volta; ogni cassa
rende subito esperienza ⭐ (mai monete, sotto il tetto di 🪙6 al minuto), fila piena +25%, tutto pieno +50% e un decoro in regalo; a tutto pieno parte e torna
dopo due minuti con un carico nuovo. Il segnaposto di prima (2 raccolti, 14 s, `+2 🧶`) non c'è più. Tutto in [mongolfiera.md](mongolfiera.md).

## I contatori

`Gioco.vue` li muove dagli **eventi** del motore (`prendiEventi()`), non dai gesti: `fattoria3dTerre`, `…Pezzi` (pezzi e
edifici messi), `…Visite` e `…Aiuti` ([vicini.md](vicini.md)), `…Raccolti` (tessere tagliate), `…Alberi`, `…Prodotti`; sale anche l'evento `livello`. L'albo li legge dal blocco `albo` del
manifesto (`gioco.js`); l'esperienza è modesta apposta, come nella fattoria di sempre.

Nei test: `unita/fattoria3d` (le regole, a orologio finto) e `integrazione/fattoria3d` (il gioco col dito vero).
