# Il mangime e la catena

Le bestie della fattoria 3D **non mangiano più un raccolto qualsiasi**: mangiano il mangime della fattoria di sempre, che si fa in una
macchina. La catena è quella decisa in 2D ([../fattoria/catena.md](../fattoria/catena.md), [macchine.md](../fattoria/macchine.md)) e qui si
rispetta: stesse trasformazioni, stesse quantità N → 1, stessa macchina. I dati stanno in `dati/mangime.js` (le ricette del fienile e i
conti dei tempi), `dati/animali.js` e `dati/regole.js` (`PECORE.mangia`) per chi mangia cosa, `motore/fattoria3d.js` per il pasto.

## La regola, e il perché

- **Un raccolto non si dà da mangiare: si porta alla macchina.** Il grano è la cosa delle galline *dopo* il fienile, le carote (o l'erba
  medica) quella di mucche e pecore. Il gioco insegna anche questo: ogni coltura ha la sua bocca, e fra il campo e la bocca c'è un mestiere
  ([../fattoria/catena.md](../fattoria/catena.md), «Tre mangimi, tre bocche»). Prima la 3D faceva mangiare grano e mais a chiunque: la catena
  finiva nel campo.
- **N → 1 e mai il contrario.** Due grani un becchime, due becchimi un uovo; due carote un foraggio, due foraggi un latte, un foraggio una lana.
- **Il mangime c'è prima della bocca**, o insieme: una bestia che chiede una cosa che non si può ancora fare sarebbe un rifiuto senza uscita.
  `guastiDeiLivelli` lo controlla (`livelloDelMangime(k) ≤ livello del pezzo`).
- **Il mangime non si consegna**: non lo chiede il banco, non sale in mongolfiera, non si baratta con i vicini (`mangime: true`, come in 2D
  per la mongolfiera; in 2D il banco lo chiede la veterinaria, qui no, dichiarato sotto).

## La catena

```
 grano ──2──▶ fienile: becchime ──2──▶ pollaio (gallina) ──▶ 🥚 uova       25 s
 carote ─2──▶ fienile: foraggio ─2──▶ stalla  (mucca)    ──▶ 🥛 latte      40 s
 erba medica ─2─▶ fienile: foraggio ─1──▶ recinto (pecora) ──▶ 🧶 lana      25 s dal pasto
```

| ricetta del fienile | ingredienti | secondi | livello | note |
|---|---|--:|--:|---|
| `foraggio_carote` | 2 carote | 5 | 2 | dà `foraggio` |
| `becchime` | 2 grano | 4 | 2 | |
| `foraggio` | 2 erba medica | 5 | 9 | la seconda strada: stesso prodotto, stesso scomparto |

Due strade per la stessa merce non sono una svista ([../fattoria/catena.md](../fattoria/catena.md)): la ricetta `foraggio_carote` ha `da: 'foraggio'`
(`tick` mette il pronto sotto il nome del prodotto), `foraggio` è quella dell'erba. **L'erba medica** (`erba`, `mangime: true`) è la
coltura più svelta (12 s contro i 16 delle carote, come i 4 minuti contro i 6 della 2D) e perciò sta **fuori** dalla regola della scala
«chi arriva dopo matura dopo» (`guastiDellaScala` salta le colture `mangime`). Arriva al 9, con la stalla, che è la bestia che ne mangia di più.

## Chi mangia cosa

| pezzo | mangia | per pasto | produce | 2D |
|---|---|--:|---|---|
| pollaio (gallina) | `becchime` | 2 | `uova` | pollaio: 2 becchime → uovo |
| stalla (mucca) | `foraggio` | 2 | `latte` | stalla: 2 foraggio → latte |
| recinto (pecora) | `foraggio` | 1 (`PECORE.pastiPerLana`) | `lana` | ovile: 1 foraggio → lana |

Le pecore chiedono foraggio anche per far crescere un agnello (2 pasti) e per far nascere il prossimo (2 pasti): sono regole della 3D, il
cibo è lo stesso. Non mangiano più grano, mais, carote né becchime: un rifiuto con quelli in scorta è il caso provato.

- **Il rifiuto dice cosa serve e dove si fa**: `manca-mangime` con `servono` e `mangia`, in parole «Serve 🥬 foraggio (2 a testa): lo fa il
  fienile» (`dettoDi`). Il cartello «ha fame» resta.
- **Il giro di pappa dell'acquisto** d'una bestia usa lo stesso mangime (`compraBestia`): senza mangime non c'è pappa e non è un rifiuto.
- **Il tempo** di uova e latte nei conti di ordini e scala conta anche il mangime (`lavoroDelMangime`, `attesaDelMangime`): un uovo vale i due
  becchimi che costa, perciò i villaggi dei vicini che lo davano in dono ora danno un raccolto o la stoffa (`dati/vicini.js`).

## I livelli

**Dal 22/10/2026 il fienile è uno solo, la macchina, al livello 6 (🪙150) come in 2D**; il fienile di scena è tolto e i tempi sono in minuti (becchime al 9, foraggio d'erba al 13). Quanto segue è la storia di prima. Il fienile sta al **2**, l'unico livello senza una cosa produttiva: prima di tutti i recinti (4, 5, 9). Costa 🪙40 e ha spostato di 40 la
soglia dal livello 3 in poi (120 → 160; l'ultimo livello da 400 a 407 minuti, sotto il tetto di 420): è il prezzo di avere il mangime *prima*.
Provato al livello 1, dove la roba non entra nella soglia: avrebbe acceso un «!» per un edificio inutile fino al 4.

## L'audit: ogni trasformazione contro la 2D

Il test `unita/fattoria3d-merci` confronta ogni ricetta con la 2D (id, ingredienti, quantità, tempo in secondi, macchina) e **elenca le
deviazioni**: nessuna ricetta 3D è inventata o adattata. Combaciano mulino (farina, pappa di mais), pastificio (pasta, biscotti, pizza, lasagne),
panificio (pane, torta, crostata), caseificio (burro, formaggio), cucina (salsa, polenta, minestrone, conserva, parmigiana), gelateria (succo,
frullato, gelato), telaio, zuccherificio (zucchero, marmellata), sartoria (maglione, sciarpa, berretto), tintoria (tutte e quattro) e, da qui, il
fienile. **Le deviazioni dichiarate** (`MANCANTI` nel test):

| 2D | in 3D | perché |
|---|---|---|
| `mangime` (mulino) | non c'è | è il cibo del cane, del gatto e della peschiera: i compagni 3D non mangiano |
| `merenda`, `caramelle`, `fiorume`, `fiorume_concime` | ci sono dal giro G5 | le arnie, gli asini e i fiori ([cortile-2.md](cortile-2.md)): `MANCANTI` è ora vuoto |
| `pastone` | non è `mangime: true` | in 2D è il cibo del cane; qui nessuno lo mangia e resta una merce da banco |
| veterinaria chiede il mangime | no | in 3D il mangime non si consegna |
| erba medica: il giardiniere chiede `fieno` | no | idem |

Il **fienile di scena** (`FISSI`, 4×3, `creaFienile`) resta com'è: il nuovo `fienile` è un edificio vero (3×3, `creaFienileMacchina`) con un posto
storico `nuovo: true` in `POSTI_STORICI` (9, −7) che non tocca alberi e sassi dei lotti storici. Due fienili in vista, uno che si costruisce: da
unire se darà fastidio (voce in [da-fare.md](da-fare.md)).

## Il pentolone (G4)

Anatre, maiali e capre mangiano il mangime del pentolone (verdure lesse, pastone, verdura fresca): stessa regola, stessa lettura (`MANGIMI`, `ricetteDelMangime`),
stesso rifiuto che dice dove si fa. Vedi [cortile-e-pentolone.md](cortile-e-pentolone.md).

## I vecchi salvataggi

Niente da tradurre, la versione resta 9 (`normalizza` basta): `merci.erba` parte a zero, `macchine.fienile` è vuota e non comprata, le scorte di
raccolti restano. Le bestie di una fattoria di prima hanno fame del mangime nuovo e lo dicono; il fienile si compra con il livello 2 che hanno già.
Un ordine aperto che chiede `pastone` si consegna ancora.

## Nei test

`unita/fattoria3d-merci` (le ricette contro la 2D, `MANCANTI`, chi mangia cosa come in 2D), `unita/fattoria3d` (sezione 21: il fienile, le due
strade, le pecore, il v9 con bestie; sezioni 8 e 18: i rifiuti e i pasti col mangime giusto), `unita/fattoria3d-ordini` (il mangime non si chiede),
`unita/fattoria3d-taratura`. Nel browser: i pasti di `integrazione/fattoria3d` (sezione degli animali da cortile) scalano `prodotti.becchime` e
`prodotti.foraggio`, **scritti ma non eseguiti** (la build era vietata).
