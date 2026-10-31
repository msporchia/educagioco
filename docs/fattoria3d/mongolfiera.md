# La mongolfiera: la nave

Un ordine grosso che si riempie un po' alla volta, come la nave di Hay Day e come la mongolfiera della fattoria 2D, di cui legge i
numeri (`da2d/dati/mongolfiera.js`). Un pallone che scende dal cielo si nota in un modo in cui un carro fermo no. Prima era un segnaposto: si caricavano 2 raccolti, dopo 14 s
tornava una cassa che dava `+2 🧶`, e nessuno capiva a cosa servisse. Ora ha un mestiere suo, diverso dal banco: il banco
([ordini.md](ordini.md)) è il camion (tanti ordini piccoli, sempre), la mongolfiera è la nave (un carico grande che non ha fretta).
Dati in `dati/mongolfiera.js`, regole in `motore/mongolfiera.js`, il foglio in `viste/Mongolfiera.vue` (stile `stile-mongolfiera.css`).

## Le regole

- **Si compra al livello 10** (🪙 100, edificio unico, `EDIFICI.mongolfiera`): il livello d'ingresso è quello dell'edificio e non è cambiato. Si mette dove si vuole nel terreno proprio come ogni edificio ([edifici-liberi.md](edifici-liberi.md)); non si mette via se è in volo o già caricata, si sposta sempre e la stiva la segue.
  Comprata, atterra subito un carico.
- **Un carico: tre file di casse, una merce per fila** (`FILE`; **quattro dal livello 66**, `fileAl(livello)`: `LIVELLO_GRANDE` e `FILE_GRANDE` si leggono dalla 2D, è il pallone che cresce col livello, non una cosa da comprare), **2–3 casse per fila** (`CASSE_MIN`, `CASSE_MAX`) e **lo stesso numero di pezzi in
  ogni cassa della fila** (da 1 a 2 pezzi sotto il livello 14, da 1 a 3 dopo: `pezziMaxAl`). «Tre pasta» si legge in un'occhiata e un
  bambino sa quanta roba preparare. Se al livello ci sono meno di tre merci le file sono meno (a 10: pasta e pane).
- **Solo prodotti finiti** (`merceDaCassa`): ricette con **due lavorazioni o più** (`fasiDi`: la pasta è farina + uova, due; la
  farina una sola), **mai un mangime** (`MANGIMI`, la pappa di mais; una ricetta può anche dichiarare `mangime: true`). Il crudo lo chiede già il banco, e
  una fila di grano sarebbe un ordine grosso fatto di niente. Si compone da `RICETTE` come il banco: una ricetta nuova entra da sola.
- **Mai richieste impossibili**: si pesca solo fra ciò che `livelloDi` (macchina e ingredienti compresi) dice fattibile al livello di chi
  gioca, come nel banco. Dentro il livello, una merce di una **macchina che hai già pesa 4 volte** (`PESO_MACCHINA_TUA`) e una catena
  lunga pesa di più: il carico parla della tua fattoria, ma resta una cosa da raggiungere comprando la macchina che manca.
- **Si riempie un po' alla volta**: ogni cassa ha il suo tasto «Metti sulla mongolfiera» (`caricaCassa(i, c)`), toglie i pezzi e rende
  **subito** la sua esperienza. Non serve avere tutto: serve tornare. Se manca roba non cambia niente e dice cosa
  (`{ ok: false, motivo: 'mancano', mancano: { pasta: 1 } }`, come il banco).
- **Fila piena +25%** (`BONUS_FILA`, del premio delle sue casse), **tutto pieno +50%** (`BONUS_TUTTO`, di tutte) **e una sorpresa della fiera**: sono la
  ragione per riempirla davvero invece di mandarla via a metà.
- **A tutto pieno parte davvero** (la scena la fa salire e allontanare) **e torna dopo due minuti** (`RIPOSO_MS`, un minuto meno del banco: ha già
  chiesto più roba) **con un carico nuovo**. Il riposo sta sull'orologio (`ora()`): vale anche a pagina chiusa e un giorno di assenza dà
  un carico solo, niente si accumula. Niente scade: un carico a metà aspetta per sempre.
- **«Parti subito»**: si può mandarla via a metà (se una merce non va, o per cambiare carico). Restano i ⭐ delle casse già messe, niente bonus del tutto né
  sorpresa. Senza questo tasto un carico con una merce che non piace sarebbe un muro.

## Il premio: esperienza ⭐, mai monete

```
cassa    = premioDi({ merce: pezzi })        quello che renderebbero gli stessi pezzi al banco (il conto della 2D, ordini.md)
fila     = Σ casse + 25% di quelle casse     (arrotondato)
tutto    = Σ casse + 25% per fila + 50% di tutte le casse
```

- **Il tetto è lo stesso del banco** ([ordini.md](ordini.md), «Il premio»): un carico non rende mai più di 🪙6 per ogni minuto che costa farne la roba.
  `guastiDellaMongolfiera()` lo controlla merce per merce sul caso
  peggiore (una fila di tre casse da tre pezzi, tutti i bonus) e `unita/fattoria3d-mongolfiera` su ogni livello, dal 10 all'ultimo.
- **Il bonus è esperienza** (`_guadagna`, con l'evento `livello` se si sale): niente monete, come tutto ciò che si consegna nella 3D. Le monete si guadagnano
  esercitandosi; qui l'unico modo di averne dalla mongolfiera è il traguardo dell'albo (sotto).
- **Il premio si ricalcola dai dati**, non è un numero scritto: un carico già salvato si rilegge con i premi di oggi (`stivaInForma`).

## La sorpresa della fiera

Nella 2D è una delle otto decorazioni della fiera, che non si compra. Nella 3D è **un regalo: un pezzo decorativo gratis nel magazzino**, uno degli otto con `fiera: true`
(bandierine, giostrina, zucchero filato, lanterne, tiro al barattolo, girasole di legno, spaventapasseri in festa, palco: `SORPRESE`, scheda «Feste» del menu, [decorazioni.md](decorazioni.md)). Si mette dal menu
«Costruisci qui» come uno comprato (la carta c'è solo se ne hai uno; `compraPezzo` risponde `non-in-vendita`). Si sceglie **preferendo quelli che si
hanno di meno** (cose in mappa più magazzino) e a parità decide `rnd`: così ruotano e non esce sempre la stessa; i regali non sono una moneta travestita, non si rivendono. Evento `fiera` con il `pezzo`.
(Fino al giro G9 il regalo era un decoro qualunque del catalogo, perché la fiera non c'era.)

## Lo stato

```
stato.mongolfiera = {
  stiva:  null | { file: [{ merce: 'pasta', casse: [{ pezzi: 2, xp: 14, piena: false }, …] }, …] },
  via:    null | ms,        // quando è partita (la scena sale da lì)
  riposo: null | ms,        // quando torna; null = è a terra
  giri:   n,                // i viaggi fatti
}
```

- **A terra**: `stiva` c'è, `riposo` è null. **In viaggio**: `stiva` è null, `riposo` e `via` ci sono. Quando `ora() >= riposo` il `tick()` atterra
  un carico nuovo (`aggiornaMongolfiera`); senza la mongolfiera comprata non succede niente. La versione dello stato **non sale** (resta 7): i campi che
  mancano si riempiono.
- **Il segnaposto di prima** (`{ fine, cassa }`) si legge senza errori e si chiude senza lamentele: un viaggio in corso o una cassa da ritirare
  valgono **la lana che avrebbero dato (+2 🧶)**, aggiunta una volta sola (poi i campi vecchi non ci sono più), e il primo carico nuovo atterra al primo `tick()`.
  I due raccolti caricati allora restano spesi: erano il prezzo di un giro che il segnaposto ha già pagato in lana.
- **Un carico rotto** si rimette in forma: merci che non esistono più, doppie o mangimi si scartano, i pezzi fuori misura pure, premio ricalcolato; se non
  resta niente `stiva` è null e ne atterra uno nuovo. `normalizza` non lancia mai.

## Per la vista

- `vistaMongolfiera()` → `{ stato: 'non-tua' | 'terra' | 'viaggio' | 'vuota', posseduta, aperta, liv, prezzo, giri, file, piene, totale, pronte, restoMs, … }`;
  `file[i] = { i, k, nome, emoji, piena, bonus, casse: [{ c, pezzi, xp, piena, ha, manca, pronta }] }`. Guarda `ha/pezzi` contro `scortaDi`.
- `caricaCassa(i, c)` → `{ ok, xp, cassa, bonusFila, bonusTutto, sorpresa, pieno, parte }`; `partiMongolfiera()` → `{ ok, piene, di }`.
  Rifiuti: `non-tua`, `in-viaggio`, `sconosciuta`, `gia-piena`, `mancano`.
- Eventi (`prendiEventi()`): `cassa` (`merce`, `pezzi`, `xp`) → contatore `fattoria3dMongolfiera`; `fiera` (`pezzo`) → `fattoria3dFiere`; `livello` se si sale.

## Il foglio e la scena

- **Il foglio** (`Mongolfiera.vue`, `data-f3="mongolfiera"`, aperto toccando la mongolfiera: `azioni.js` → `ui.apriMongolfiera()`): un'insegna col cielo azzurro,
  nuvolette che passano e il pallone grande che sale e scende; la ✕ in alto a destra; il corpo scorre. Sotto, la **stiva**: la barra «Casse a bordo 3/8», il
  riquadro del bonus «Tutto pieno: +50% … e una sorpresa della fiera 🎪» che si accende a tutto pieno, e le **tre file**: la faccia della merce (`Faccia.vue`),
  «2 pezzi per cassa», il chip «Fila piena +25%» che diventa verde, e le cassette di legno con la faccia, il `ha/serve` rosso o verde, «+N ⭐» e il tasto
  verde (`aria-disabled` finché manca roba: il tocco dice cosa). Una cassa a bordo ha il timbro ✓. In fondo «Parti subito» e il traguardo.
  In viaggio il foglio mostra il pallone che vola e «Torna fra m:ss». Se non è tua dice come averla (il livello, il prezzo, il terreno da comprare prima).
- **In scena** (`pezzi.js`, `_edificio`): da ferma il pallone sale e scende piano; a tutto pieno (o «Parti subito») **sale in quattro secondi** (`SALITA_MS`),
  si allontana, resta via e **scende negli ultimi quattro secondi del riposo**, col tempo e non coi fotogrammi. Il cartello sopra: «🎈 N casse pronte!» (le
  casse che si possono riempire adesso, come i «pronti» delle macchine), «🎈 in viaggio · m:ss», niente quando non c'è niente da fare.
- **Il traguardo «Sulla mongolfiera»** (`f3d-mongolfiera`, 🎈): metti 10, 40, 120 casse. Soglie alte apposta: un carico sono 6–9 casse, e il premio resta
  quello modesto degli altri traguardi della 3D ([livelli.md](livelli.md)).

## Cosa non c'è, rispetto alla 2D

- **La quarta fila c'è** (dal 66, come la mongolfiera grande della 2D: la scala dei livelli ora è la stessa). Un carico già salvato con tre file resta com'è; il nuovo ne ha quattro. Il foglio scorre.
- **Niente albero che si apre dalla merce che manca**: la 3D non ha la pagina dell'albero; la faccia dice cosa serve e il tocco sul tasto spento dice cosa manca.
- **Niente piazzola che cambia disegno quando è partita**: il pallone parte davvero, la base resta.
- **La fiera c'è** dal giro G9 (otto pezzi, sopra): niente di diverso dalla 2D.

## Nei test

`unita/fattoria3d-mongolfiera`: i dati senza guasti, il crudo e i mangimi esclusi, un carico fattibile e dentro il tetto a ogni livello dal 10 all'ultimo (con `rnd`
finto), una cassa alla volta (manca roba, rende, non tocca le monete), il bonus della fila e del tutto, la sorpresa che ruota e preferisce ciò che hai di
meno, la partenza e il ritorno a tempo (anche dopo un giorno), «Parti subito», lo stato che si rilegge e il segnaposto vecchio che si chiude, gli stati rotti.
Bersagli per il dito (non provati, serve la build): `[data-f3="mongolfiera"]` (con `data-stato`), `[data-f3="mongolfiera-cassa"]`
(`data-fila`, `data-cassa`, `data-piena`, `data-pronta`), `[data-f3="mongolfiera-carica"]` (`data-puoi`), `[data-f3="mongolfiera-piene"]`,
`[data-f3="mongolfiera-tutto"]`, `[data-f3="mongolfiera-fila-bonus"]` (`data-acceso`), `[data-f3="mongolfiera-parti"]`, `[data-f3="mongolfiera-msg"]`,
`[data-f3="mongolfiera-viaggio"]`, `[data-f3="mongolfiera-resto"]`, `[data-f3="mongolfiera-chiusa"]`, `[data-chiudi]`.
