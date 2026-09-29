# La taratura del castello

Come escono i numeri di una tappa: il numero di calcoli è l'input, il resto
si deriva, e la vita dei mostri la misura un simulatore col motore vero.
Quanto vale una moneta rispetto all'esercizio sta in
[`../apprendimento/calibrazione.md`](../apprendimento/calibrazione.md).

## Il numero di calcoli è l'input

- **Una tappa costa il numero di calcoli che promette.** Dichiara `calcoli`
  (quante operazioni per finirla) e `cap` (fin dove arriva la scaletta);
  tutto il resto lo deriva `src/data/castello.js`. Un calcolo = un acquisto:
  una torre costruita o un gradino salito. Provato il contrario (le
  postazioni scelte perché l'energia si spendesse tutta, `RESPIRO_SPESA`):
  uscivano da 21 a 52 operazioni per tappa, e una partita diventava un
  compito.
- **La catena ha quattro anelli.** `pianoDi` (i `calcoli` acquisti del
  giocatore modello e quanto costano) → `ondateDi` (quante ondate servono
  perché le entrate paghino il piano, tranne le due torri di partenza) →
  `partenzaDi` (quello che le ondate non pagano, dato all'inizio) →
  `postiDi` (le piazzole). Entrate = costo del piano: chi gioca bene fa
  esattamente `calcoli` acquisti e finisce a tasche vuote.
- **`operazioniDi` deve tornare uguale a `calcoli`.** È il controllo che
  tiene onesta la derivazione: se esce diverso, è sbagliato il modello.
- **Chi ritocca l'equilibrio cambia prezzi o entrate e rilancia
  `npm run tara`.** Non si scrivono a mano postazioni, energia di partenza,
  ondate né vite (`ondate`, `posti`, `partenza`, `attesa`, `durezza`, `vite`
  li appende `data/castello.js`).

I calcoli per campagna (in `src/data/campagne-castello.js`):

| campagna | calcoli per tappa |
|---|---|
| Bosco | 6 · 7 · 8 · 10 · 12 |
| Sotterraneo | 9 · 11 · 13 · 16 · 19 |
| Mura | 14 · 18 · 22 · 26 · 30 |
| Palude | 12 · 14 · 18 · 21 · 24 |

Le prime tre ripartono più basse della fine della precedente e arrivano più
in alto (il modello del Generale). La Palude **scende**: dopo le Mura non ci
sono operazioni nuove da insegnare, trenta calcoli sono già un pomeriggio, e
lì a crescere è la difficoltà tattica (le bocche).

## L'energia, e perché il calcolo difficile conviene

- **Ogni nemico fermato lascia ⚡** (`CFG.perNemico` 2), più un premio di fine
  ondata (`fineOnda` 4, `ondataPulita` 6 se non passa nessuno).
- **Allargarsi rincara, salire quasi no.** Costruire: 40, poi 60, 80…
  (`costruzione` 40, `costruzionePiu` 20, per il listino della torre);
  potenziare: 36 +2 a gradino. Un gradino rende il 60% in più. Provato con
  costruire poco più caro che potenziare: riempire il campo di torri di
  livello 1 era la mossa migliore, e la matematica difficile diventava una
  tassa invece della scelta furba.
- **Gli errori si pagano in energia, mai in vite** (`malusErrore` 6: un
  sesto di gradino). Con sei calcoli in una tappa, un errore che costasse un
  acquisto toglierebbe un sesto della difesa per un riporto.
- **Spostare una torre costa 2 ⚡** (`spostamento`). Con due ingressi portare
  il ghiaccio dalla parte giusta è *la* mossa, e una mossa che vince non si
  fa a costo zero; due punti fanno solo pensare un secondo.
- **Le monete.** `premioTappa`: una moneta ogni dieci operazioni della tappa
  (almeno una); una sola di cortesia se era già vinta. Nelle libere una ogni
  `CFG.perMoneta` (5) ondate (`motore/castello/battaglia.js`). Niente
  moltiplicatore di livello: era rimasto dai giochi vecchi, e faceva
  rendere di più lo stesso ⚡ a chi aveva giocato di più altrove
  ([../apprendimento/calibrazione.md](../apprendimento/calibrazione.md)).

## Le piazzole

- **Il minimo:** quelle che il piano occupa più una, mai meno di tre né delle
  torri che la tappa offre — se fossero meno dei tipi, la scelta di quale
  torre mettere sarebbe finta.
- **Sopra, una quota per campagna** (`PIAZZOLE`: bosco 4, sotterraneo 6, mura
  8, palude 5): nel Bosco il campo è stretto apposta, finito lo spazio si
  impara a salire. Le piazzole in più non spostano i calcoli: il modello non
  ne approfitta perché salire costa meno che costruire (il test lo ricontrolla
  tappa per tappa).
- **+3 per ogni ingresso oltre il primo** (`PIAZZOLE_PER_INGRESSO`): con due
  strade la difesa va divisa, e la scelta deve restare «dove metto la
  prossima», non «quale porta lascio aperta».
- **Le piazzole si occupano dall'ingresso** (`GEOMETRIA.dallIngresso`). Dal
  castello, con due o tre torri finivano tutte davanti alla porta e il mostro
  faceva l'85% della strada senza un colpo.
- **La geometria è equilibrio travestito da disegno.** Sta in `GEOMETRIA` in
  `data/castello.js` ed entra nella firma della taratura. **Chi tocca
  `piazzole()` (`motore/castello/percorso.js`) incrementa `GEOMETRIA.v`**:
  il codice i dati non lo descrivono, e senza il test non vede che il campo
  è cambiato.
- **Il mondo è uno** (`MONDO`: 420×760, verticale, uguale su ogni schermo):
  cambia solo quanto lo si vede grande. La telecamera sta in
  [`../core/grafica.md`](../core/grafica.md). La scala `S` (1,3) non è a
  occhio: tiene la stessa area del vecchio campo (390×420 a S=0,93), solo
  in una forma più stretta e più alta. Prima del mondo unico il campo aveva
  un `max-width:520px` che sembrava estetica ed era un guasto di
  bilanciamento: la strada è disegnata in proporzione al riquadro ma il
  raggio delle torri no, quindi su un monitor largo la strada si allungava a
  parità di gittata e i mostri passavano nei buchi — oltre i 520px l'ultima
  tappa non si finiva più.

## Il giocatore modello

- **`sequenzaTorri` dice che torre compra e su che strada**, con tre regole
  in ordine: le prime torri (una per ingresso, e che sparino) sono quelle che
  feriscono più ondate di fila dall'inizio, poi più mostri, poi quelle che
  costano meno; poi si copre il resto strada per strada con le torri
  **urgenti** (`urgenti`: un mostro che su quella strada nessuno ferisce);
  poi a giro, la torre che ce n'è di meno. È un bambino diligente che legge
  il preavviso, non un ottimizzatore.
- **`prossimoAcquisto` è la stessa mossa** per il piano dei calcoli, per
  `difesaCon` e per il simulatore: se divergessero, la promessa dei calcoli
  con prezzi diversi non reggerebbe.
- **Sa da che ondata le bocche scendono insieme** (`insiemeDa`, la stessa
  del motore). Contandolo sempre dalla quinta, nelle libere comprava torri
  per la strada sbagliata.
- **Le ondate miste le conosce come bisogni** (`miste` di `sequenzaTorri`),
  accesi dal preavviso (`PREAVVISO_MISTE` 3) e guardati da `prossimoAcquisto`
  contro le torri in campo — non nella fila, che è il piano e quindi la
  promessa dei `calcoli`.
- **La fatica** (`faticaDi`: vita addosso × fronti ÷ potenza comprabile) è
  quello che deve crescere lungo la campagna, non la robustezza dei nemici.

## La vita dei mostri: `npm run tara`

```bash
npm run simula                   # le tappe giocate da sei profili
npm run simula -- --quote 1,.9,.75
npm run tara                     # tara e riscrive src/data/taratura-castello.js
npm run tara -- --prova          # tara e stampa, senza scrivere
npm run tara -- --da 0.6 --bersaglio 0.85
```

- **Il motore gira senza schermo** (`src/motore/battaglia.js`, facciata di
  `src/motore/castello/`): stesso codice nel gioco e in Node, ed è l'unico
  motivo per cui il bilanciamento si misura invece di provarlo a occhio. Una
  tappa costa qualche decimo di secondo.
- **I profili** (`PROFILI` in `strumenti/simula-castello.mjs`): `misura` (il
  metro: spende tutto, non sbaglia, non corre), `parco` (tiene un decimo),
  `pigro` (tiene un quarto: non deve passare), `pieno`, `pasticcione`
  (sbaglia un conto su quattro, lento, niente fretta: deve passare), `largo`
  (solo torri di livello 1: deve arrivare meno lontano).
- **Il limite di un'ondata** è la vita oltre la quale il metro comincia a
  perdere cuori; lo trova una bisezione. Le ondate si tarano in ordine,
  ognuna partendo dalla difesa che il metro ha davvero a quel punto.
- **La vita è una frazione del limite, da 0,60 alla prima ondata a 0,85
  all'ultima** (`BERSAGLIO`). La tensione va in fondo: l'energia la lasciano
  i nemici uccisi, e chi resta indietro di un soffio incassa meno e resta
  indietro di più. Provato 0,55 → 0,95: con tappe corte l'anello di
  sicurezza scattava su dieci tappe su sedici.
- **L'anello di sicurezza.** Tarata la tappa, la gioca il `pasticcione` con
  tre semi; dove perde cuori quelle ondate (solo quelle) si abbassano di
  cinque punti, fino a `GIU_MAX` 0,3 e `GIRI_ANELLO` 16 giri. Abbassare tutta
  la rampa non separava il pasticcione dal `pigro`: cadevano alla stessa
  ondata e passavano insieme.
- **Si spiana mostro per mostro** (`spiana`): lo stesso mostro più avanti
  non torna mai più debole, verso il basso (al rialzo si chiederebbe una
  difesa che non si può avere). Capo e miste fanno gruppo a sé (`chiDi`).
  Un golem che solo le bombe aprono può avere meno vita di un pipistrello, e
  non è un errore. Spianando tutta la fila, un golem in fondo ammorbidiva la
  tappa intera.
- **La promessa:** chi spende tutto finisce la tappa; chi tiene in tasca un
  quarto no (perde quattordici volte su quindici); il pasticcione ce la fa.

## La vecchia curva, e a cosa serve ancora

`durezzaDi` (con `RESA` 0,55 e `MARGINE` 1,35) è il modello che *prima*
decideva quanto fossero duri i nemici: potenza in campo contro vita in
arrivo. Non tara più niente — quel mestiere è passato a `npm run tara`, che
gioca invece di stimare — ma non è codice morto: la `durezza` che ne esce
muove ancora la **velocità** dei nemici (`velocitaNemico`) e la vita di chi
la tabella non ce l'ha, cioè le partite libere oltre l'ultima ondata tarata.

## Il file generato e la firma

- **`src/data/taratura-castello.js` è generato**: `VITE` (per tappa, chiave
  `chiaveTappa` = `campagna/nome`), `OLTRE` (il passo delle libere, vedi
  [libere.md](libere.md)), `BERSAGLIO` e `FIRMA`. Non si modifica a mano.
- **La firma** (`firmaEquilibrio`) è l'impronta di `CFG`, prezzi, torri,
  rami, `GEOMETRIA`, `MONDO`, mostri (immunità, abilità, capo, miste), tappe
  e libere coi loro tracciati interi (`forme`, `fronti`): se cambia, `unita/castello` diventa rosso e chiede
  di rilanciare `npm run tara` invece di giocare su un equilibrio di ieri.

## Gli strumenti di misura

- **`npm run dps`** (`strumenti/dps-castello.mjs`): una torre sola davanti a
  un'ondata vera, col motore vero. Tre numeri: `singolo` (danno al secondo su
  uno), `efficace` (contando tutti quelli presi: area, rimbalzi, veleno),
  `valore` (vita fermata con nemici che muoiono, in arcieri di livello 1). Il
  ghiaccio vale la vita in più fermata da due arcieri con lui in mezzo.
  Accanto, la stima del modello (`dpsDi`) e il rapporto fra le due.
- **`node strumenti/valida-percorsi.mjs`**: le mappe ai raggi X (vedi
  [campagne.md](campagne.md)).
- **`node strumenti/regali-castello.mjs`**: quanto vale un regalo (vedi
  [libere.md](libere.md)).

Nei test: `test/unita/castello` gioca tutte le tappe coi profili (chi spende
tutto finisce, chi tiene un quarto no, a chi spende non avanza più del 10%,
il pasticcione ce la fa, c'è sempre qualcosa da comprare, la fretta vale al
più due acquisti, la firma è fresca); `integrazione/torri-equilibrio` gioca nel browser
la prima e l'ultima tappa (tutte con `TAPPE_PROVA=tutte`) e controlla che
gioco e simulatore raccontino la stessa partita.
