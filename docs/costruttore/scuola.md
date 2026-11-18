# Il Robot a scuola

A scuola il bambino gioca al Robot vero (`src/giochi/costruttore/Gioco.vue`), limitato ai capitoli che la maestra ha
scelto: non si storpia, si limita. Chi lo monta è la pagina dei bambini; il contratto dei giochi veri, la scheda e la
forma della risposta stanno in [../scuola/giochi.md](../scuola/giochi.md). I capitoli come scelta della maestra e
gli aiuti gratis sono scelte dell'utente, 18 novembre 2026.

## L'esercizio

```js
{ tipo: 'robot', capitoli: ['cantiere', 'guardare'] }   // le chiavi di CAPITOLI (dati/livelli.js)
```

- **Almeno un capitolo, senza doppioni, nell'ordine della campagna**: `valido` (in `src/scuola/giochi/robot/scheda.js`)
  rifiuta una chiave in più, un capitolo che non c'è, un ordine diverso (un link manomesso non porta dentro niente).
  Le chiavi dei capitoli, come quelle dei livelli, non si rinominano: stanno nelle lezioni salvate.
- **`descrivi`**: «Il Robot · il cantiere e «guardare e decidere» · 11 livelli» (un nome con una «e» dentro va fra «»).
- **L'editor della maestra** (`Parametri.vue`) mostra i capitoli come tessere col numero e quanti livelli hanno, e
  non lascia spegnere l'ultimo. Il primo capitolo è l'unico con la guida: chi parte da un capitolo dopo deve già
  sapere quelli prima (lo dice la nota sotto le tessere).
- È un contenuto del gioco: si fa solo nel Robot, non entra in un insieme, e se il gioco non parte il bambino vede
  «chiama la maestra».

## La prop `limite`

`<Gioco :limite="{ capitoli: ['cantiere'] }">`; **a casa manca** (`null`), e `filaDelLimite` (in `motore/limite.js`,
puro) torna `null`: niente di quello che segue esiste.

- **La fila** sono gli indici dei livelli dei capitoli scelti, nell'ordine della campagna. Si parte dal primo, senza
  la scheda (`vista` nasce `cantiere`); vinto un livello il cartello dice «avanti →» e si va al dopo.
- **Finita la fila si ricomincia dal primo**, coi programmi da riscrivere (quelli della fila si cancellano, e con loro
  gli «annulla»): rifare un livello col programma già scritto sarebbe premere ▶. Il cartello dell'ultimo lo dice.
- **Niente monete, stelle, tappa né sosta**: `vittoria` mostra il cartello senza stelle e non chiama `completa`
  né `addCoins`. I programmi stanno nell'archivio in memoria della scuola: ricaricando la pagina si perdono, e
  rientrando nello stesso blocco (in tondo) si riparte dal primo livello coi programmi già scritti.
- **Gli aiuti**: a casa si pagano in monete, e a scuola il profilo parte da zero. Restano **i gradini gratis che fanno
  ragionare** (`ragiona`, [../core/aiuti.md](../core/aiuti.md)); gli indizi e i gradini che scrivono nel programma
  sono spenti (`scalaDelLimite`). Finiti quelli, il foglio dice «il resto è tuo».
- **La guida del primo giro** resta: il primo muretto la mostra finché non è vinto (qui le stelle non arrivano mai,
  quindi torna a ogni giro). Quella della scheda no, perché la scheda non c'è.
- La scheda (`viste/Scheda.vue`) a scuola è un `Vuoto.vue` (`src/scuola/giochi/robot/sostituti.js`): non si apre, e
  porta via anche gli amici sui led.

## L'evento `risposta`

Ogni esecuzione che arriva in fondo (il ▶ che gira fino a vincere o a sbagliare) emette una risposta già raccontata
(`raccontaEsecuzione`):

```js
{ chiave: 'robot:primo-muretto', giusta: false, ultima: false, ms: 41200,
  fatto: 'Il primo muretto', data: 'mancano 2 mattoni', attesa: 'il disegno' }
```

- **Vinto**: `giusta` e `ultima` (il livello è una domanda chiusa), `data` uguale ad `attesa`. Dopo, quel livello non
  risponde più finché non si riapre: premere ▶ di nuovo non fa contare un'altra giusta.
- **Non arriva**: `giusta: false, ultima: false`, la domanda resta aperta. `data` è la frase del gioco accorciata (cosa
  manca o è di troppo, dove si è fermato il robot, cosa non torna a sera), `attesa` cosa si chiedeva
  («il disegno, in 3 ordini», «l'omino alla bandiera», «2 giornate che tornano»). Testi ≤ 40 caratteri.
- **Non sono risposte** il ▶ fermato da una casella da scegliere o dallo zaino pieno (il robot non parte) e ■ Stop.
- `ms` è il tempo da quando il livello si è aperto, o dall'esecuzione prima.

## Il peso

Il gioco senza la scheda pesa nella pagina dei bambini circa 290 KB di JavaScript minificato (150 di dati dei livelli)
più i componenti e lo stile, sui 350-400 KB in tutto. I dati dei livelli (~150 KB) entrano anche nella pagina della
maestra, perché la scheda legge `CAPITOLI` e conta i livelli da `dati/livelli.js`.

Nei test: `unita/costruttore-scuola` (`valido` contro le forme storte e nel catalogo, `descrivi`, senza limite nessuna
fila, la fila dei capitoli scelti e il giro che ricomincia, la scala ridotta ai gradini gratis per ogni livello, la
risposta di ogni soluzione e di ogni mossa ingenua nei 40 caratteri). Bersagli: la vista `[data-gioco="robot"]`, le
tessere dei capitoli `[data-capitolo-robot="<chiave>"]`, sul cartello di fine livello `[data-da-capo]` quando dopo si
ricomincia; il resto è di [scheda.md](scheda.md) e [linguaggio.md](linguaggio.md).
