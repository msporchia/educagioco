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
- **Un rifiuto dice cosa fare** (`dettoDi` in `scena3d/azioni.js`): «Servono raccolti», «Compra prima un terreno che
  confina con questo», non un «no» nudo.

## Quanto costa

| cosa | costo | perché |
|---|---|---|
| un campo | 20 + 8 per ogni copia (anche nel magazzino) | il rincaro lineare della fattoria di sempre |
| recinto / bancarella / bacheca / fontana | 45 / 15 / 12 / 30 | fissi; nel recinto una pecora, le altre si comprano (40, 60, 80) |
| aiuola / panchina / pozzo / spaventapasseri | 6 / 10 / 18 / 12 | decorazioni, fissi |
| passerella / ponte / tavolo | 8 / 14 / 18 | decorazioni (liv 3 / 5 / 4), fisse |
| pollaio / stalla | 55 / 90 | liberi nel terreno come il recinto; una bestia nel prezzo, le altre una per volta, sempre più care ([animali.md](animali.md)) |
| mulino / panificio / caseificio / cucina / gelateria | 60 / 90 / 120 / 110 / 140 | unici, nel loro posto, in lotti da comprare prima (la cucina ha ancora l'id `conserviera`) |
| pastificio (id `pasticceria`) / mongolfiera | 80 / 100 | unici, nel loro posto |
| un lotto di terreno | 40 + 20 per ogni lotto comprato oltre i nove di partenza, più 2 per il quadrato dei lotti oltre il 33° (il 100° costa 10 998) | non ci sono confini, il prezzo li fa: [mondo-infinito.md](mondo-infinito.md) |
| **un pezzo nuovo** | il prezzo, **pagato quando lo lasci sulla mappa** (`compraEMetti`) | niente conferma: il prezzo è sulla carta; senza monete il fantasma è rosso e il rilascio dice «Servono 🪙 N» |
| tagliare un albero | 3 | trenta secondi di esercizio: un albero si toglie, non dà niente (niente legna) |
| togliere un sasso o un cespuglio | 1 | pochi per lotto, restano anche dopo l'acquisto del lotto |
| spostare o mettere via un pezzo | 1 | non è un tavolino da spostare per ore; rimetterlo dov'era è gratis |
| un pezzo di strada | 1 | togliere è gratis |

I numeri stanno in `dati/catalogo.js` e `dati/regole.js`. Misurati sul metro di [calibrazione.md](../apprendimento/calibrazione.md)
(una moneta = dieci secondi di esercizio) con `npm run tara:fattoria3d`: ogni pezzo produttivo costa fra un quarto e due terzi
del salto del suo livello (il campo 3 minuti di esercizio, il mulino 10, la gelateria 23), le decorazioni meno di un decimo. Il
resto è in [livelli.md](livelli.md).

## I campi

Quattro tessere per campo, un raccolto per tessera (`TESSERE`): una coltura matura per intero, e si taglia una tessera alla
volta (`raccogliTessera`). Il tempo è vero (16 s il grano e le carote, 70 s il riso: quindici colture, crescente col livello). Seminare è gratis. **Un campo che sta crescendo non
si mette via**.

## I pezzi calpestabili

Passerella (1×3) e ponte (3×1) hanno `calpestabile: true` e `alzato` (la quota di chi ci cammina; per il ponte una per cella, la
gobba) in `dati/catalogo.js`. Sono **decorazione per fare camminamenti**: niente acqua sotto, niente altre regole.
- **Il passo li attraversa**: `libera` (eroe, compagni, celle di servizio) li conta libere; **il costruire no**: `blocca`, `puoMettere`
  e `disegnaStrada` le trovano occupate, quindi sopra non si mette nient'altro e non si sposta un pezzo lì sopra.
- **Contano come strada nel percorso** (`sullaStrada`: costo ridotto e passo svelto), ma non sono strada (`eStrada` resta 0, non si
  salvano in `strade`, non si tolgono col pennello).
- Si **toccano per salirci**: l'eroe va su una loro cella (`celleDiServizio`). Il tavolo, invece, è un pezzo qualunque: ferma il passo.

## Le pecore

`agnello → adulta → tosata (ha fame) → pasto → lana che ricresce`, e a volte ne nasce una nuova (`PECORE` in `dati/regole.js`). **Si parte con
una pecora adulta, con fame** (nel prezzo del recinto); **le altre si comprano dal cartello sopra il recinto** (adulte, 🪙40, 60, 80, fino a
quattro: [animali.md](animali.md)), come le galline e le mucche. Con due adulte le nascite ricominciano:

- un agnello **cresce dopo due pasti** (ogni pasto un raccolto qualsiasi, dalla scorta più grande);
- **dopo la tosa la pecora ha fame** (`t0: null`), come una gallina o una mucca: la lana ricresce in 25 s, ma **dal pasto**, non dalla tosa
  (`pastiPerLana`: un raccolto qualsiasi, dalla scorta più grande). Una pecora affamata non fa lana, e il tempo che passa non cambia
  niente: niente muore, niente marcisce, una pappa a ogni giro. Si tosa: `+1 🧶` a pecora;
- **due adulte nutrite due volte fanno nascere un agnellino**, fino a quattro pecore per recinto (acquisti e nascite dividono lo
  stesso tetto);
- toccando il recinto l'eroe sceglie da solo (`provaCura`): prima tosa (se c'è lana pronta), poi **nutre le tosate affamate** (tutte in un gesto,
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

Mulino, pastificio (id `pasticceria`), panificio, caseificio, cucina (id `conserviera`), gelateria, telaio, zuccherificio, sartoria e tintoria sono **macchine** con le ricette della fattoria di sempre ([merci-e-ricette.md](merci-e-ricette.md)) (`MACCHINE` in `dati/ricette.js`): ognuna ha le
sue ricette (raccolti precisi e un tempo), **tre posti** nel forno e cuoce **uno alla volta**. Gli ingredienti si scalano
subito, il successivo parte quando finisce il precedente; i pronti restano finché non si ritirano (`ritiraDa`) e passano
in dispensa (`stato.prodotti`).

- **Un ingrediente è un raccolto o il prodotto di un'altra macchina** (catena): grano → farina (mulino) → pane integrale
  (panificio); può anche uscire dalla stessa macchina (la pasta per le lasagne, come in 2D). **Un solo ingrediente è un contatore**: la
  lana (`stato.lana`, quella della tosa), per telaio e sartoria: `scortaDi` e `_togli` la trattano come le altre merci ([merci-e-ricette.md](merci-e-ricette.md)).
- **Gli id delle ricette sono globali** (sono le chiavi di `prodotti`), sono quelli della 2D e non coincidono con quelli delle colture.
- Un edificio fuori dal quadrato di partenza si compra solo con **tutti i suoi lotti tuoi** (`lotto-non-tuo`, con
  l'elenco `lotti`): meglio un rifiuto che dice cosa comprare che un edificio sospeso sul terreno altrui.
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
