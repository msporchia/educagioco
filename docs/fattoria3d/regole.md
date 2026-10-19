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
| pasticceria / mongolfiera | 80 / 100 | unici, nel loro posto |
| un lotto di terreno | 40 + 20 per ogni lotto comprato oltre i nove di partenza | allargare costa sempre di più |
| spostare o mettere via un pezzo | 1 | non è un tavolino da spostare per ore; rimetterlo dov'era è gratis |
| un pezzo di strada | 1 | togliere è gratis |

I numeri stanno in `dati/catalogo.js` e `dati/regole.js`. Sono da prova: se il gioco esce dalla prova vanno tarati sul
metro di [calibrazione.md](../apprendimento/calibrazione.md) (una moneta = dieci secondi di esercizio).

## I campi

Quattro tessere per campo, un raccolto per tessera (`TESSERE`): una coltura matura per intero, e si taglia una tessera alla
volta (`raccogliTessera`). Il tempo è vero (14–32 s in prova). Seminare è gratis. **Un campo che sta crescendo non
si mette via**.

## Le pecore

`agnello → adulta → tosata → lana che ricresce`, e a volte ne nasce una nuova (`PECORE` in `dati/regole.js`):

- un agnello **cresce dopo due pasti** (ogni pasto un raccolto qualsiasi, dalla scorta più grande);
- l'adulta ha la lana che ricresce in 25 s e si tosa: `+1 🧶` a pecora;
- **due adulte nutrite due volte fanno nascere un agnellino**, fino a quattro pecore per recinto;
- toccando il recinto l'eroe sceglie da solo (`provaCura`): prima tosa, poi nutre. Un recinto con le pecore **non si
  mette via** (si sposta).

## La pasticceria

Cinque ricette (`dati/ricette.js`), ognuna con raccolti precisi e un tempo. Il forno ha **tre posti** e cuoce **uno alla
volta**: gli ingredienti si scalano subito, il successivo parte quando finisce il precedente. I pronti restano nel
forno finché non si preme «Ritira tutto» e passano in dispensa. I prodotti per ora non servono a niente (sono il
materiale per gli ordini, [da-fare.md](da-fare.md)).

## La mongolfiera

Si caricano 2 raccolti, parte per 14 s e torna con una cassa: `+2 🧶`. Una cassa da ritirare impedisce un nuovo carico.

## I contatori

`Gioco.vue` li muove dagli **eventi** del motore (`prendiEventi()`), non dai gesti: `fattoria3dTerre`, `…Pezzi` (pezzi e
edifici messi), `…Raccolti` (tessere tagliate), `…Alberi`, `…Prodotti`. L'albo li legge dal blocco `albo` del
manifesto (`gioco.js`); l'esperienza è modesta apposta, come nella fattoria di sempre.

Nei test: `unita/fattoria3d` (le regole, a orologio finto) e `integrazione/fattoria3d` (il gioco col dito vero).
