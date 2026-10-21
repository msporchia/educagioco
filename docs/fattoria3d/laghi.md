# I laghetti, i ponti e (poi) la pesca

Un lotto su sette è un **laghetto**: al mezzo uno stagno, intorno terra. Si vede anche da un lotto non tuo; si attraversa coi
ponti. La pesca **non c'è ancora**: le basi sono pronte. Codice: `dati/biomi.js`, `Fattoria3d.acqua`/`puoMettere`, `scena3d/terreno.js`
(`_acqua`). Il perché dei lotti è in [mondo-infinito.md](mondo-infinito.md).

## Lo stagno

Il quadrato 2×2 al centro del lotto più **da una a tre celle del bordo** (al più una per lato, mai un angolo): 5–7 celle d'acqua,
una forma a blob che non è mai un quadrato. **Le quattro celle d'angolo e almeno tre celle per lato restano terra**: il lotto si
compra e si attraversa dai lati. Un margine di terra di una cella tutt'intorno lascerebbe quattro celle d'acqua (il lotto è 4×4):
poco più di una pozzanghera, per questo il bordo si lascia toccare in un punto per lato al massimo.

`acquaDelLotto(l)` dà le celle, `moloDelLotto(l)` una **cella di riva** (terra che tocca l'acqua) col verso dell'acqua, scelta dal
generatore: è il posto candidato per la pesca. `generaLotto` espone tutti e due (`acqua`, `molo`); il motore `acqua(i, j)`.

## Regole

- **Sull'acqua non si cammina e non si costruisce**: `blocca()` e `libera()` dicono di no, `puoMettere` rifiuta con motivo `acqua`
  («Qui c'è l'acqua: serve un ponte», in `detti.js`), niente strada a pennello. Alberi e sassi non nascono sull'acqua.
- **Ponte e passerella** hanno `suAcqua: true` in `dati/catalogo.js`: possono avere l'ingombro sull'acqua, purché almeno una cella sia
  terra, oppure tocchino di lato un altro ponte (`_appoggioPerPonte`): un ponte tutto sull'acqua senza appoggio non regge. Sono
  calpestabili: l'eroe e i compagni attraversano l'acqua sopra di loro (`cellaPasso`, che vince su `blocca`). Un ponte da 3 supera i 2
  dello stagno (un'estremità sulla riva, l'altra sull'acqua accanto alla riva opposta).
- Toglierlo richiude il passaggio; non si mette altro sul ponte.

## Il disegno

Una lastra azzurra semitrasparente per cella d'acqua (`lastra`, a istanze, senza ombra) su una **riva** di sabbia un po' più larga
(`riva`); **ninfee** (dischi verdi) sull'acqua e **canne** (tre fili alti) sulle celle di riva, tutto a istanze e deciso dalle
coordinate del lotto. Il movimento è nello shader della lastra (`uT`, lo stesso tempo del vento): un luccichio che scorre,
niente riflessioni e niente luci in più. Le istanze si rifanno con la finestra ([mondo-infinito.md](mondo-infinito.md)). Nel
catalogo 3D c'è `fattoria:stagno`.

Il cartello di un lotto comprabile con laghetto dice «🪙 N · 🏞️ laghetto» e l'offerta «Qui c'è un laghetto.».

## Come si aggancerà la pesca (non fatta)

1. **Un pezzo `molo`** (decoro calpestabile come la passerella, 1×2, `suAcqua`) che si mette dalla riva; nel `puoMettere` basta il
   flag e il posto candidato (`generaLotto(...).molo`) suggerisce dove.
2. **Un'azione «pesca»** dell'eroe in fondo al molo (`azioni.js`, come `semina`): il motore decide (`pesca(id)`), la scena anima la
   canna; costo in attesa, non in monete.
3. **Un prodotto `pesce`** (e merci derivate) in `dati/ricette.js` e `ordini`: il pesce che la 2D usa alla friggitoria, al sushi bar
   e alla peschiera ([merci-e-ricette.md](merci-e-ricette.md), [da-fare.md](da-fare.md)).
4. **La peschiera** come recinto-macchina accanto a un laghetto; i pesci da catturare per lago dipendono dal lotto
   (`mescola(a, b, sale)`), così ogni lago ha la sua pesca.

Niente di questo cambia i salvataggi: servono solo un pezzo nuovo, un'azione e una merce.

## Nei test

`unita/fattoria3d-mondo` (sezioni 6, 7 e 9: biomi e proporzioni, forma e margini, molo, `puoMettere` con acqua e ponti, percorso che
attraversa la passerella e non l'acqua, Villa Dolce con il suo laghetto e la sua passerella nel lotto `2_-1`).
