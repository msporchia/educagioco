# Le campagne del castello

Le venti tappe in quattro campagne, cosa dichiara una tappa, perché i
percorsi sono quelli, le tappe a più bocche e i terreni dipinti. Il racconto
sta in `src/data/campagne-castello.js` (nomi, terreni, mostri, tracciati),
i numeri in `src/data/castello.js`, i fondali in `src/grafica/terreni/`.

```bash
node strumenti/valida-percorsi.mjs   # le mappe ai raggi X
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
- **Le forme sono spezzate 0–1** che il motore smussa (Chaikin,
  `grafica/geometria.js`) e su cui dispone le piazzole ai lati, alternate,
  partendo dall'ingresso.

## La difficoltà che sta nella mappa: il presidio

- **Conta quanta strada ogni torre tiene sotto tiro, non quanto è lunga.**
  Il raggio va da 86 a 132 unità; una strada che si ripiega si fa battere
  due o tre volte dalla stessa torre. Il validatore la chiama `presidio`
  (strada per postazione, in raggi d'arciere), e **scende di campagna in
  campagna**: bosco ~2,4 (perdona), sotterraneo ~2,1, mura ~1,9 (una torre,
  un tratto). Fasce e lunghezze in `FASCE`, pavimento `PRESIDIO_MINIMO`
  1,85, scalino fra campagne `SCALINO`.
- **La Palude è fuori dalla scala**: strade corte perché sono due, e la
  difficoltà sta nei fronti. Chiederle di scendere sotto le Mura vorrebbe
  dire rettifili nudi su più ingressi.
- **Il carattere segue**: nel bosco curve larghe e diagonali, sotto terra
  gomiti netti e rettifili, dentro il castello angoli retti e tratti corti.
- **Il presidio è una media, e le medie non hanno buchi.** Il validatore
  misura anche il **buco**: il tratto interno più lungo che nessuna torre
  vede, con le postazioni che la tappa ha davvero (`postiDi`). Al massimo
  `BUCO_INTERNO` 60 unità. I buchi in testa e in coda non contano: li lascia
  la formula che dispone le piazzole a `lunghezza/(n+1)`. In coda prova
  sempre anche **tre** postazioni (`MAGRO`) e avverte senza fallire, perché
  quante piazzole aprire è una manopola che si gira spesso.

## Le distanze minime, e perché sono due

- **Fra corsie parallele 62** (`CORRIDOIO`): una postazione sta a 34 unità
  dal centro della strada, la piazzola è larga 15, mezza strada 17 — sotto
  66 una piazzola finisce sull'altra corsia.
- **Dentro un gomito 52** (`GOMITO`): nell'incavo di una curva la torre ci
  sta apposta, ed è da lì che viene il presidio. Il validatore distingue i
  due casi dalla distanza **lungo il cammino**: fino a 200 unità è un gomito,
  oltre due corsie. Provato un minimo solo: bocciava tutte le mappe
  interessanti.
- **Lo smussamento stringe i tornanti**: Chaikin porta un vertice a
  `¼·prima + ½·vertice + ¼·dopo`, e una U di due punti perde metà del
  raggio. **Le U si scrivono con quattro punti.**
- **Le piazzole si accavallano dove il tracciato rientra**: il validatore
  controlla le due più vicine (`PIAZZOLE` 40) da tre fino a quante ne avrà la
  tappa, più due di margine (`PIAZZOLE_FITTE` 22).

## Le tappe a più bocche

Le fogne, il torrione, tutta la Palude e tre libere su quattro hanno due
ingressi: due strade, un castello solo, e una difesa da dividere.

- **Le strade si possono fondere** (una Y, un anello, un canale che si
  immette): il `Percorso` chiede solo che ognuna sappia dov'è il suo
  ingresso e dove il castello. Sotto `FUSE` 9 unità due strade sono la
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

## I terreni

- **Tre terreni (come si dipinge) e venti tavolozze (con che colori)**:
  `bosco.js`, `sotterraneo.js`, `mura.js` in `src/grafica/terreni/`; la
  palude è un bosco allagato, stesso terreno e altri colori. Una tappa nomina
  la tavolozza (`ambiente`), le tavolozze sono scritte **per differenza**
  dalla base della campagna: una tappa nuova costa cinque righe. Un ambiente
  che non esiste ripiega sul bosco di mezzogiorno (`terrenoDi`): uno sfondo
  sbagliato si gioca, uno assente no.
- **Dal Generale si riusa quello che lavora su una regione**:
  `grafica/materiali/` (`POSE`, `variazioni`, `POSATURE`, `DETTAGLI`,
  `semina`, `masso`, `concio`, `crepa`) e `luce.js` (`luceEBuio`,
  `torciaFerma`, `chiazzeDiLuce`).
- **Non si riusa quello che cammina sulla griglia** (`MURI`, `dipingiMuri`,
  `dipingiMappa`, `creaFondale`): nel castello non c'è una cella piena, e un
  muro è un oggetto. Le tavolozze di `grafica/ambienti/` non si importano
  apposta: un ritocco a una stanza del Generale non deve cambiare una tappa.
- **Di nuovo**: le vie (`terreni/vie.js`: `battuto`, `acciottolato`,
  `lastricato`), la roba sparsa lontano da strada e piazzole e ordinata per
  profondità, le piazzole.
- **Tre cose imparate guardando**: il selciato delle mura si posa in
  diagonale (a corsi orizzontali sembrava un muro davanti alla telecamera);
  le lastre della via stanno due o tre per fila, sfalsate (una per fila
  faceva una ferrovia); le torce sono poche e lontane, ma sotto la via corre
  un filo di luce continuo, perché il tracciato è l'informazione da cui
  dipende ogni decisione.

Il castello a sprite (chiave `castello`, in prova) dipinge lo stesso campo a
celle con le immagini generate: vedi [`../core/grafica.md`](../core/grafica.md).

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
