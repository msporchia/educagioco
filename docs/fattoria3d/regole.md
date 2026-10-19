# Le regole della fattoria 3D

I principi, e dove vivono: le regole sono tutte in `motore/fattoria3d.js` (pure: niente schermo, niente profilo), i numeri
in `dati/`. Da leggere prima di toccare un prezzo, un tempo o un rifiuto. Il perché di fondo è quello della fattoria di
sempre ([../fattoria/regole.md](../fattoria/regole.md)); qui le differenze.

## Risorse sue, monete vere

- **Raccolti, prodotti, lana, legna, terra e pezzi stanno nello stato suo**, `profile.campagne.fattoria3d.cfg.stato`
  (scritto da `Gioco.vue` con `ricorda`, a ritardo e subito quando la pagina sparisce). Non si leggono né si scrivono
  quelli di `campagne.fattoria`: le due fattorie non si fanno casino a vicenda.
- **Le monete sono le vere** (`state.profile.coins`). Il motore non le conosce: passano da una `borsa` (`quante()`,
  `paga(n)`) che gli dà `Gioco.vue`. Un rimborso (la monetina di uno spostamento annullato) **non conta come
  guadagnata**: non gonfia `totals.monete`.
- **Niente si vende**: il verso è sempre monete → cose. Le monete entrano solo dagli esercizi degli altri giochi.

## Cosa non succede mai

- **Niente marcisce.** Un campo maturo resta maturo, il forno tiene i pronti finché non si ritirano, la lana pronta
  aspetta la forbice. Il tempo avanza anche a pagina chiusa: i campi leggono `ora()`, la cottura si rimette in pari
  con `tick()`.
- **Niente si perde.** Un pezzo messo via va nel magazzino e si ripiazza gratis. Annullare rimette tutto com'era.
- **Un rifiuto dice cosa fare** (`dettoDi` in `scena3d/azioni.js`): «Servono raccolti», «Compra prima un terreno che
  confina con questo», non un «no» nudo.

## Quanto costa

| cosa | costo | perché |
|---|---|---|
| un campo | 20 + 8 per ogni copia (anche nel magazzino) | il rincaro lineare della fattoria di sempre |
| recinto / bancarella / fontana | 45 / 15 / 30 | fissi |
| aiuola / panchina / pozzo / spaventapasseri | 6 / 10 / 18 / 12 | decorazioni, fissi |
| pollaio / stalla | 55 / 90 | liberi nel terreno come il recinto; una bestia nel prezzo, le altre 12 / 30 ([animali.md](animali.md)) |
| mulino / panificio / caseificio / conserviera / gelateria | 60 / 90 / 120 / 110 / 140 | unici, nel loro posto, in lotti da comprare prima |
| pasticceria / mongolfiera | 80 / 100 | unici, nel loro posto |
| un lotto di terreno | 40 + 20 per ogni lotto comprato oltre i nove di partenza | allargare costa sempre di più |
| spostare o mettere via un pezzo | 1 | non è un tavolino da spostare per ore; rimetterlo dov'era è gratis |
| un pezzo di strada | 1 | togliere è gratis |

I numeri stanno in `dati/catalogo.js` e `dati/regole.js`. Misurati sul metro di [calibrazione.md](../apprendimento/calibrazione.md)
(una moneta = dieci secondi di esercizio) con `npm run tara:fattoria3d`: ogni pezzo produttivo costa fra un quarto e due terzi
del salto del suo livello (il campo 3 minuti di esercizio, il mulino 10, la gelateria 23), le decorazioni meno di un decimo. Il
resto è in [livelli.md](livelli.md).

## I campi

Quattro tessere per campo, un raccolto per tessera (`TESSERE`): una coltura matura per intero, e si taglia una tessera alla
volta (`raccogliTessera`). Il tempo è vero (16 s il grano e le carote, 64 s la lavanda: dieci colture, crescente col livello). Seminare è gratis. **Un campo che sta crescendo non
si mette via**.

## Le pecore

`agnello → adulta → tosata → lana che ricresce`, e a volte ne nasce una nuova (`PECORE` in `dati/regole.js`):

- un agnello **cresce dopo due pasti** (ogni pasto un raccolto qualsiasi, dalla scorta più grande);
- l'adulta ha la lana che ricresce in 25 s e si tosa: `+1 🧶` a pecora;
- **due adulte nutrite due volte fanno nascere un agnellino**, fino a quattro pecore per recinto;
- toccando il recinto l'eroe sceglie da solo (`provaCura`): prima tosa, poi nutre. Un recinto con le pecore **non si
  mette via** (si sposta).

## Gli animali da cortile

Pollaio (uova) e stalla (latte): una bestia nutrita fa il suo prodotto dopo un tempo e lo tiene finché non lo si raccoglie;
niente muore. → [animali.md](animali.md)

## I livelli

Quasi tutto si apre con un **livello**, che sale spendendo monete qui dentro: pezzi, edifici, colture e ricette hanno un
`liv`, e ciò che non è arrivato rifiuta con `non-sbloccato` e il livello a cui arriva. Ciò che si possiede resta: il livello
vale solo per comprare, seminare e avviare. → [livelli.md](livelli.md)

## Le macchine

Pasticceria, mulino, panificio, caseificio, conserviera e gelateria sono **macchine** (`MACCHINE` in `dati/ricette.js`): ognuna ha le
sue ricette (raccolti precisi e un tempo), **tre posti** nel forno e cuoce **uno alla volta**. Gli ingredienti si scalano
subito, il successivo parte quando finisce il precedente; i pronti restano finché non si ritirano (`ritiraDa`) e passano
in dispensa (`stato.prodotti`).

- **Un ingrediente è un raccolto o il prodotto di un'altra macchina** (catena): grano → farina (mulino) → pane integrale
  (panificio). Non di una ricetta della stessa macchina.
- **Gli id delle ricette sono globali** (sono le chiavi di `prodotti`) e non coincidono con quelli delle colture.
- Un edificio fuori dal quadrato di partenza si compra solo con **tutti i suoi lotti tuoi** (`lotto-non-tuo`, con
  l'elenco `lotti`): meglio un rifiuto che dice cosa comprare che un edificio sospeso sul terreno altrui.
- **Un ingrediente può anche essere `uova` o `latte`** delle bestie ([animali.md](animali.md)).
- I prodotti servono al banco: li chiedono i clienti ([ordini.md](ordini.md)).

## La mongolfiera

Si caricano 2 raccolti, parte per 14 s e torna con una cassa: `+2 🧶`. Una cassa da ritirare impedisce un nuovo carico.

## I contatori

`Gioco.vue` li muove dagli **eventi** del motore (`prendiEventi()`), non dai gesti: `fattoria3dTerre`, `…Pezzi` (pezzi e
edifici messi), `…Raccolti` (tessere tagliate), `…Alberi`, `…Prodotti`; sale anche l'evento `livello`. L'albo li legge dal blocco `albo` del
manifesto (`gioco.js`); l'esperienza è modesta apposta, come nella fattoria di sempre.

Nei test: `unita/fattoria3d` (le regole, a orologio finto) e `integrazione/fattoria3d` (il gioco col dito vero).
