# Gli animali da cortile

Seconda filiera della fattoria 3D, accanto alle pecore: il **pollaio** (galline → uova) e la **stalla** (mucche → latte).
Le bestie di tutti e tre i pezzi (anche le pecore del recinto) si comprano allo stesso modo, dal cartello sopra l'edificio.
I numeri sono in `dati/animali.js`, le regole in `motore/fattoria3d.js` (sezione «gli animali da cortile»), il disegno in
`scena3d/modelli.js` (`creaPollaio`, `creaStalla`, `creaGallina`, `creaMucca`). Ispirati alle bestie della fattoria di
sempre ([../fattoria/animali.md](../fattoria/animali.md)) ma più semplici delle pecore: niente nascite, niente fasi di crescita.

## Le regole

- **Due pezzi del catalogo**, piazzabili liberamente nel terreno proprio come il recinto: `pollaio` 3×2 (🪙55, livello 6) e
  `stalla` 4×3 (🪙90, livello 9), produttivi (il loro prezzo si somma al salto di livello), rincaro 0.
- **Una bestia è nel prezzo** e parte con fame. Nutrirla costa raccolti, dalla scorta più grande fra quelli che mangia:
  la gallina **1** fra grano e mais, la mucca **2** fra mais e carote. Dopo `ms` la bestia ha il suo prodotto: 25 s per un
  uovo, 40 s per un latte (da prova).
- **Il prodotto aspetta**: una bestia pronta non ne fa un altro, non lo perde, non marcisce; anche a pagina chiusa conta
  l'orologio (`fine` è un'ora assoluta). Si raccoglie col tocco: tutto il pronto del pezzo in un gesto, e va in
  `stato.prodotti` (`uova`, `latte`). Le bestie hanno di nuovo fame. **Niente muore.**
- **Altre bestie si comprano dentro l'edificio, quando si vuole.** Recinto, pollaio e stalla funzionano allo stesso modo
  (`CORTILE` in `dati/animali.js`): una bestia nel prezzo del pezzo, le altre una per volta fino alla **capienza** (`posti`):
  recinto 4 pecore, pollaio 6 galline, stalla 4 mucche. **Il livello apre il pezzo, non i posti.** Ogni bestia costa
  più della precedente: `prezzoBestia + rincaroBestia · (n − 1)` con `n` le bestie già dentro (pecora 20, 30, 40;
  gallina 15, 23, 31, 39, 47; mucca 30, 45, 60). Conta come esperienza. Pieno rifiuta con `pieno`, senza monete con
  `poche-monete` e il `costo`. Una pecora comprata è **adulta** (la lana ricresce da quel momento); le nascite restano
  ([regole.md](regole.md), «Le pecore»).
- **Un pollaio o una stalla con le bestie non si mette via** (`ha-le-bestie`), si sposta, come il recinto.
- Nutrire dà da mangiare **a tutte le bestie che hanno fame**, finché c'è da mangiare (una gallina per raccolto).

## Uova e latte: ingredienti, non ricette

`uova` e `latte` (`PRODOTTI_ANIMALI`) non hanno una macchina e non si chiedono da soli al banco: servono alle ricette
([ricette.js](../../src/giochi/fattoria3d/dati/ricette.js)). Il loro livello è quello del pezzo che li fa
(`livelloDellaRicetta` lo sa), e per il premio degli ordini valgono il loro tempo più il primo raccolto che mangiano
(`msDelProdotto`: 45 s un uovo, 88 s un latte).

| ricetta | macchina | ingredienti | livello |
|---|---|---|---|
| torta soffice | pasticceria | uova 2, farina 1 | 6 |
| frittata | pasticceria | uova 2, cipolle 1 | 9 |
| brioche | panificio | farina 2, uova 1, latte 1 | 9 |
| formaggio / burro | **caseificio** | latte 2 | 11 |
| yogurt alla fragola | caseificio | latte 1, fragole 1 | 11 |
| gelato alla crema | gelateria | latte 2, uova 1 | 14 |

Il **caseificio** è un edificio unico 3×3 (🪙120, livello 11, posto `{ i: 6, j: -3 }` nel lotto `5_2`, accanto al quadrato di
partenza): una macchina come le altre, tre posti nel forno. Il suo lotto è da comprare prima (`lotto-non-tuo`).

**Un ordine può chiedere una ricetta con le uova senza che si abbia il pollaio**: come per le altre macchine, è un ordine
che si può rifiutare.

## Lo stato (dal v4)

Sulla cosa `pollaio`/`stalla`: `bestie: [{ fine }]`, `fine` è l'ora a cui il prodotto è pronto, o `null` se ha fame (stato
`'fame'` / `'lavora'` / `'pronta'` in `statoBestia`). `bestieInForma` (in `motore/stato.js`) ne tiene da una a `posti`,
mai un'eccezione; un v3 si apre uguale (il caseificio e i prodotti nuovi si riempiono da sé). Il v5 non cambia la forma:
una stalla da 2 mucche o un pollaio da 3 galline del v4 restano com'erano e ora hanno posto per le altre.

## L'API del motore

`provaCuraBestie(id)` (`{ azione: 'raccogli'|'nutri'|null, n, motivo }`: prima si raccoglie, poi si nutre, senza cambiare
niente), `nutriBestie(id)`, `raccogliProdotti(id)` (`{ ok, n, prodotto }`), `prodottiDelCortile()`. Eventi: `uovo` e `latte`
(`{ n }`), per i contatori; `bestia` (`{ tipo }`) a ogni acquisto, senza contatore.

**Una sola API per tutte le specie** (recinto, pollaio, stalla): `numeroBestie(c)`, `infoBestie(c)` → `{ tipo, bestia, bestie,
emoji, n, max, pieno, prezzo }` (`prezzo` è null se pieno; null l'intero risultato se la cosa non tiene bestie) e
`compraBestia(id)` → `{ ok, costo, n }` o un rifiuto (`sconosciuto`, `pieno`, `poche-monete` + `costo`). `postiBestie` e
`livelliPosti` non ci sono più.

## Il disegno

- **Il modello mostra tante bestie quante ne hai** (`sincronizzaBestie`, `sincronizzaPecore`): la nuova compare nel posto
  libero (`userData.posto(k)`) e si muove a modo suo. Posti: pollaio due file di tre galline sulla terra battuta, stalla
  quattro mucche in fila davanti al fienile (le balle di fieno stanno ai lati), recinto le pecore a coppie.
- **Pollaio**: casetta di legno su palafitte con scaletta e tetto rosso, terra battuta davanti, mangiatoia; le galline
  (bianche e brune a turno) razzolano e beccano di più se hanno fame; un uovo accanto alla gallina pronta.
- **Stalla**: fienile rosso con tetto di legno e portone a croce, mangiatoia e balle; le mucche (bianche con chiazze,
  una bruna e una scura) ruminano piano, scodinzolano, abbassano la testa se hanno fame; un secchio di latte accanto
  alla pronta.
- **Caseificio**: casetta bianca col tetto di tegole blu, forme di formaggio gialle su un bancale, la ruota ad acqua che
  gira piano.
- Il cartello sopra recinto, pollaio e stalla (`pezzi.js`, `Effetti.nuovoCartello`): in alto lo stato («🥚 N pronti!», «⏳ Ns»,
  «🐔 ha fame», «🧶 pronta!» per le pecore), sotto il conto «🐄 2/4» e il pulsante «＋ 🪙 40». Peso: pollaio ~47 mesh
  con una gallina (+~8 per ogni altra), stalla ~57 con le bestie al completo, caseificio ~32; geometrie delle bestie condivise, animazioni col tempo.

## Il collegamento alla scena

- **Il tocco sull'edificio** (`scena3d/azioni.js`, `curaBestie`): se c'è un prodotto pronto si raccoglie (gesto di semina, testo che
  vola «+2 🥚»), altrimenti si nutre («🍽️ ×N»); se lavorano dice quanto manca; senza raccolti dice cosa serve
  (`manca-raccolto` con `servono` e `mangia`). Niente più dialogo: comprare non passa di qui.
- **Il pulsante «＋ 🪙 N» del cartello** (`azioni.compraBestia(id)`): compra subito, senza conferma e senza camminare fino
  all'edificio; compare la bestia, scintille e «+1 🐄». Se mancano monete dice quante (`Ti mancano 🪙 N`) e il pulsante è
  grigio (`aria-disabled`, ma risponde). Pieno, il pulsante sparisce e il conto diventa verde. Ignorato in Costruisci e con un
  foglio aperto. Il cartello prende il dito solo col pulsante (`pointer-events`), il resto lascia passare il tocco alla tela.
- **La vista** (`Gioco.vue`): uova e latte stanno in `prodotti` e nel HUD (`emojiDi`, non `RICETTE`); gli eventi `uovo` e
  `latte` muovono i contatori `fattoria3dUova` e `fattoria3dLatte`, che insieme fanno il traguardo `f3d-cortile`. Niente
  esperienza dai contatori.
- I motivi `ha-le-bestie`, `lavora`, `pieno` e `manca-raccolto` per le bestie sono in `scena3d/detti.js`.

Nei test: `unita/fattoria3d` (sezioni 8 e 18–20); `integrazione/fattoria3d` (sezione «gli animali da cortile»: nutrire, uova,
bestie comprate dal cartello — `[data-f3="cartello-bestie"]` con `data-n`/`data-max`, `[data-f3="compra-bestia"]` con
`aria-disabled` —, latte, il recinto da una pecora a quattro, contatori, `[data-f3="prodotti"]`).
