# Le campagne del castello

Le venti tappe in quattro campagne, cosa dichiara una tappa, perché i
percorsi sono quelli, le tappe a più bocche e i vestiti. Il racconto sta in
`src/data/campagne-castello.js` (nomi, mostri, schizzi dei percorsi), i
numeri in `src/data/castello.js`, la carta a scacchiera su cui si gioca in
`src/motore/castello/carta.js`, i vestiti in `src/giochi/castello/scena/`.

```bash
node strumenti/valida-percorsi.mjs         # le carte ai raggi X
node strumenti/sprite/carte-castello.mjs   # le carte vestite, da guardare
```

## Cosa dichiara una tappa

Solo quello che si racconta:

```js
{ nome: 'Il sentiero', emoji: '🌱', ambiente: 'bosco-chiaro',
  calcoli: 6, cap: 3,              // la promessa, e fin dove sale la scaletta
  torri: ['add'], rami: false, capo: false,
  mostri: ['slime', 'goblin', …],  // la fila, un tipo per ondata, a giro
  forme: […], fronti: 1.5 }        // il percorso (o `forma`), e le difese vere
```

`ondate`, `posti`, `partenza`, `attesa`, `durezza`, `vite` li appende
`data/castello.js` (vedi [taratura.md](taratura.md)). `campagna`,
`abilita` (dal Sotterraneo in poi) e `portata` li aggiunge `RACCONTO`.
**`portata` si ricava dal `cap`** (`LIVELLO_CAP`: cap 3 → 37, cap 10 → 75),
e **niente `scuola`**: aprire una tappa di mezzo romperebbe l'economia (chi
comincia dalla nona non ha le torri comprate prima), quindi il taglio per
età agisce solo in alto.

## Le quattro campagne

| | racconto | torri | rami, abilità | calcoli |
|---|---|---|---|---|
| 🌲 **Bosco** | la scuola: si impara a costruire e potenziare | entrano una alla volta: `add` · +`sub` · `sub` · +`mul` · +`div` | rami dal guado (il sentiero ha cap 3), niente abilità | 6 · 7 · 8 · 10 · 12 |
| 🕯️ **Sotterraneo** | tutte aperte: non si sblocca più niente, si sceglie | tutte | sì | 9 · 11 · 13 · 16 · 19 |
| 🏰 **Mura** | dentro il castello, addosso al portone | tutte | sì | 14 · 18 · 22 · 26 · 30 |
| 🐸 **Palude** | più attenzione e non più conti: due bocche in ogni tappa | tutte | sì | 12 · 14 · 18 · 21 · 24 |

L'ultima tappa di ogni campagna chiude col capo. Dare le bombe già nel Bosco
non taglia fuori chi non ha fatto le divisioni: la torre chiede un'altra
operazione più su (vedi [operazioni.md](operazioni.md)).

| campagna | tappe e percorsi |
|---|---|
| Bosco | **il sentiero** 🌱 (quattro anse vicine: ogni torre lavora due volte) · **il guado** 💧 (si costeggia l'acqua) · **la radura** 🍀 (gira attorno alla radura: una torre in mezzo batte due tratti) · **il folto** 🌳 (cinque denti stretti) · **la radice** 🪵 (tre tornanti; i tracciati cominciano ad accorciarsi) |
| Sotterraneo | **la grotta** 🕳️ (la caverna col pilastro) · **la miniera** ⛏️ (gallerie a squadra) · **le fogne** 🕸️ (due collettori, la prima a due bocche) · **la cripta** ⚰️ (una scala col righello) · **la gola** ⛰️ (stretta e quasi diritta) |
| Mura | **il cortile** 🚪 (attorno al pozzo) · **il camminamento** 🧱 (la ronda, un rettifilo) · **il corridoio** 🗝️ (dritto, gomito, dritto) · **la sala del trono** 👑 (una diagonale, nessun tornante) · **il torrione** 🏰 (rampa e scala di servizio, due bocche) |
| Palude | **il guado** 💧 (una Y: due bracci, tronco corto) · **il canneto** 🌾 (un canale che si immette in fondo) · **le isole** 🏝️ (un anello: una bocca che si sdoppia) · **il pantano** 🪵 (due strade che si allontanano) · **la foce** 🌊 (una clessidra: due bocche, un nodo, due rami) |

Le file dei mostri, con le immunità ondata per ondata, stanno commentate nel
file dati; le regole che devono rispettare in [mostri.md](mostri.md).

## Il campo e i margini

- **Il campo è verticale e uno solo** (`MONDO` 420×760): il banco dei
  bottoni non c'è più e cambia solo quanto lo si vede grande.
- **Margini:** `x ∈ [0.05, 0.95]` (una strada che tocca il bordo sembra
  tagliata), `y ∈ [0.04, 0.95]` (il castello in fondo è alto una cinquantina
  di unità sopra il suo piede). Il percorso **entra dal bordo di sopra ed
  esce in fondo**, dove c'è il castello, vicino al pollice.
- **Le forme sono uno schizzo 0–1, e si gioca sulla carta.** `cartaDi`
  porta lo schizzo su una scacchiera di 12×22 celle — la strada a squadra,
  una cella per passo, uscita dritta dalla bocca ed entrata dritta nel
  castello — e ci mette le piazzole, sparse su tutta la strada
  ([piazzole.md](piazzole.md)). Il motore gioca su quella (`sullaCarta`, da `Battaglia`),
  e così la taratura, il simulatore e i test. La radura grande è l'unica
  carta scritta a mano, cella per cella (`A_MANO`). Le regole della carta
  le tiene `unita/castello-carta`.
- **La strada curva non c'è più.** Si giocava sullo schizzo smussato
  (Chaikin) con le piazzole scostate ai lati; il castello a sprite giocava
  già sulla carta, e dal 29 settembre 2026 è il castello di tutti. Sulla
  carta la strada è più lunga di circa un sesto, e le vite sono state
  ritarate lì ([taratura.md](taratura.md)).

## La difficoltà che sta nella mappa: il presidio

- **Conta quanta strada ogni torre tiene sotto tiro, non quanto è lunga.**
  Il raggio va da 92 a 130 unità; una strada che si ripiega si fa battere
  due o tre volte dalla stessa torre. Il validatore la chiama `presidio`
  (strada per postazione, in raggi d'arciere, con le piazzole che la carta
  ha davvero), e **scende di campagna in campagna**: sulla carta bosco 2,78
  (perdona), sotterraneo 2,52, mura 2,26. Pavimento `PRESIDIO_MINIMO` 1,85,
  scalino fra campagne `SCALINO` 0,12. Le fasce per campagna di lunghezza e
  presidio (`FASCE`) erano la misura con cui si disegnava lo schizzo curvo:
  sulla carta ogni strada esce più lunga e più ripiegata, e non ci sono
  più.
- **La Palude è fuori dalla scala**: strade corte perché sono due, e la
  difficoltà sta nei fronti. Chiederle di scendere sotto le Mura vorrebbe
  dire rettifili nudi su più ingressi.
- **Il carattere segue**: nel bosco curve larghe e diagonali, sotto terra
  gomiti netti e rettifili, dentro il castello angoli retti e tratti corti.
- **Il presidio è una media, e le medie non hanno buchi.** Il validatore
  misura anche il **buco**: il tratto interno più lungo che nessuna torre
  vede, con le piazzole della carta. Al massimo `BUCO_INTERNO` 60 unità; i
  buchi in testa e in coda non contano. Con le piazzole sparse su tutta la
  strada nessuna tappa ne ha più di 12 (la radura del Bosco); con quattro
  piazzole il guado e la radura ne lasciavano 63.

## Le regole della carta

Le distanze minime dello schizzo curvo (corsie, gomiti, piazzole che si
accavallano, le U da scrivere con quattro punti per lo smussamento) non ci
sono più: sulla scacchiera le dice la cella. `cartaDi` stessa segna come
guasto quattro celle di strada in quadrato, due corsie che si toccano
senza collegarsi, una strada che ripassa da una cella senza attraversarla
dritta (l'incrocio del bastione sì), una piazzola attaccata a un'altra;
`unita/castello-carta` pretende che nessuna tappa ne abbia, e che acqua,
fitto e decori stiano lontani da strada e piazzole.

## Le tappe a più bocche

Le fogne, il torrione, tutta la Palude e tre libere su quattro hanno due
ingressi: due strade, un castello solo, e una difesa da dividere.

- **Le strade si possono fondere** (una Y, un anello, un canale che si
  immette): il `Percorso` chiede solo che ognuna sappia dov'è il suo
  ingresso e dove il castello, e sulla carta due strade fuse passano per
  le stesse celle. Sotto `FUSE` 9 unità due strade sono la
  stessa strada; il tratto comune non passa mai metà strada (`COMUNE`),
  se no i due ingressi sono un disegno.
- **Vietata la via di mezzo**: un tratto lungo in cui due strade stanno a
  venti-trenta unità si legge come una strada sola sbavata e nessuna torre
  le copre insieme (`IN_MEZZO` 18% di strada al massimo). L'ultimo quinto è
  confluenza (`CONFLUENZA`): la porta è una.
- **`fronti`** dice quante difese separate chiede davvero: due strade
  separate fino alla porta ne chiedono due, due che si fondono meno. Senza,
  vale il numero di bocche, che è il verso giusto in cui sbagliare
  (`frontiDi`).
- **Da che bocca arriva un'ondata** (`boccaDellOnda`): si alternano, e ogni
  terza arriva da tutte e due insieme — ma non prima di `insiemeDa` (un
  terzo della tappa, mai prima della quinta). Sta nei dati perché la deve
  sapere anche il giocatore modello; il motore la chiede a lui
  (`Ondate.viaDi`). Il nastro lo dice tre ondate prima.

`unita/ingressi-castello` tiene le regole delle tappe a più bocche.

## I vestiti

- **Il campo si veste coi pezzi dei fogli del terreno**: la carta di una
  tappa, carattere per carattere, composta con i pezzi del suo vestito
  (`scena/vestito.js`, la stessa composizione di `vesti()` in
  `strumenti/sprite/vesti.py`). I vestiti sono quattro — bosco, neve, lava,
  palude — e non uno per campagna: grotte e mura ne prendono in prestito uno
  (`VESTITO_DI`). Come si fanno i fogli: `strumenti/sprite/DA-GENERARE.md`.
- **Torri e mostri sono figure** di un foglio (`dati/figure.js`, lo scrive
  `vesti.py --atlante`), e ogni mostro ha in ogni vestito la figura che gli
  dà il bestiario (`scena/bestiario.js`): la figura dice l'immunità.

## I salvataggi

Il progresso sta in `profile.td = { tappa, libera, v }`: `tappa` è quante
tappe sono state superate, cioè l'indice della prossima nella fila di
`RACCONTO`. **Le tappe nuove si aggiungono in fondo**, se no l'indice
sposta l'avanzamento di tutti. Quando la fila passò da sei a quindici tappe,
`migraCastello` (`store/profile.js`, `TD_DA_SEI`, `TD_VERSIONE`) ha rimappato
senza far tornare indietro nessuno: chi aveva finito le sei trova aperti
Bosco e Sotterraneo, e la libera sbloccata resta sbloccata. Il `v` si legge
**prima** di fondere il salvataggio col profilo vuoto, se no il `v` del
vuoto coprirebbe l'assenza. Le chiavi delle tappe nelle tabelle
(`chiaveTappa`: `campagna/nome`) permettono due «guadi» in due campagne.
