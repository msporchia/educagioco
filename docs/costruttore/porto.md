# Il costruttore — il porto

La seconda parte: un mondo **visto dall'alto che lavora da solo**, e un robot
che non sa cosa arriverà né quando. Codice in `motore/porto/`, `dati/porto/`,
`scena/porto.js` (sotto `src/giochi/costruttore/`); banco in
`test/unita/costruttore-porto`.

## Il taglio che lo regge

- **L'esecutore sa il controllo del flusso, il mondo sa i gesti** (`fai`,
  `guarda`, `leggi`, e se ha un orologio `attendi` e `finoASera`). Il cantiere
  di lato è un mondo come questo: l'esecutore è lo stesso.
- **Agire costa un turno, pensare no.** Ogni gesto — un passo, prendere,
  posare, un turno d'attesa — fa fare una mossa alla gru, ai nastri e ai
  clienti; guardare, leggere, decidere e fare i conti no. Un programma giusto
  con tanti «se» non deve essere lento senza motivo.
- **Gli attori sono pochi comportamenti con tanti costumi** (una sorgente come
  la gru, un nastro, un cliente). Una sfida nuova è una mappa, qualche attore
  e un `obiettivo` dichiarato («nel camion cinque casse», «tutti i clienti
  serviti»), **mai una meccanica scritta apposta**: un motore che regga tante
  sfide.
- **Niente eventi nel linguaggio**, solo `aspetta che` e `ripeti per sempre`:
  gli eventi e i personaggi che reagiscono sono del Generale.

## Le regole del porto

- il robot va ↑ ↓ ← → e **non passa sopra le cose**;
- **porta una cosa alla volta**, e prende e posa **di fianco a sé**, verso una
  delle quattro frecce;
- per terra, su uno scaffale, sul bancone e su un nastro ci sta una cosa
  sola; un cassone ne tiene tante, e se ha un colore prende solo quelle;
- **legge** quello che ha di fianco o in mano: il colore di una cassa, il
  numero di un biglietto, cosa chiede il cliente, quante casse ha un cassone;
- **un guaio del mondo ferma la giornata dove succede**: una cassa in fondo al
  nastro cade in mare, un cliente che aspetta troppo o riceve un'altra cosa se
  ne va arrabbiato;
- **la giornata finisce da sola** quando non può più succedere niente, ed è
  così che un «per sempre» si ferma (è la `Sera` di `motore/inciampo.js`, non
  un errore). A sera `motore/porto/esito.js` dice cosa manca, coi numeri, non
  «riprova»: quello che va storto **durante** la giornata (una cassa in mare,
  un cliente arrabbiato) ferma la giornata subito, con un `Inciampo` — l'esito
  guarda solo com'è finita.

## L'obiettivo di una giornata

Il livello (o l'ordine) lo dichiara in `obiettivo`, invece di scriverlo in
codice; ognuno vale da sé se il pezzo di mondo che riguarda c'è (si
disattiva con `false`):

| chiave | cosa guarda |
|---|---|
| `bersagli` | le casse disegnate in trasparenza sono al loro posto, del colore giusto |
| `cassoni` | `{ <nome>: { quante } }`, o `{ vuoto: true }` per dire che deve restare vuoto |
| `serviti` | tutti i clienti se ne sono andati contenti |
| `gru` | la gru ha calato tutte le sue casse, e sotto di lei non ne è rimasta nessuna |
| `camion` | tutti i camion della giornata sono ripartiti pieni |
| `mani` | a sera il robot non ha niente in mano (vale sempre) |
| `inOrdine` | `{ y, da, a }` (una riga dello scaffale) o `{ cassone }` (dal fondo alla cima), con `colori` per guardare casse invece di lettere — vedi [algoritmi.md](algoritmi.md) |

Il linguaggio è quello del cantiere più **prendi** e **posa** (una freccia
ciascuno), **aspetta che …**, **ripeti per sempre**, e il valore **📖 leggi**
(«voglio diventa 📖 ←» mette in una lavagnetta il colore chiesto). Nelle
giornate c'è anche **aspetta un turno**, per chi ha due lavori e in quel
momento nessuno.

Ogni ordine è **una giornata** diversa (un'altra nave, i cesti in un altro
ordine, altri clienti): il programma che ha ricordato la prima invece di
guardarla perde la seconda.

## Le mappe

- **A coppie di caratteri, posto + cosa**: `=R` uno scaffale con una cassa
  rossa, `.@` il robot. La legenda sta in `dati/porto/legenda.js`.
- **Una scena si scrive piena, come un posto vero**, non una striscia con
  solo quello che serve alla lezione. Provato con i primi otto livelli: la
  scena di prova sembrava un esercizio, non un porto.
- Il decoro non deve sembrare una cosa da spostare (niente casse o lettere di
  decoro).

Il primo carattere è **il posto**, il secondo **la cosa**:

| posto | | cosa | |
|---|---|---|---|
| `.` pavimento | `#` muro | `.` niente | `@` il robot (solo su pavimento) |
| `~` mare | `=` scaffale | `R` una cassa (maiuscola del colore) | `r` qui, alla fine, una cassa (disegno) |
| `B` bancone dei clienti | `>` `<` `^` `v` nastro (verso) | `1`…`9` un biglietto con quel numero | `*` qui cala la gru |
| `_` la strada dei camion (il robot non ci va) | `C` + nome: un cassone | `%` qui si mettono i clienti | `&` la piazzola del camion |

Le lettere dei colori sono quelle di `dati/colori.js`. Un carattere ripetuto
(`##`, `~~`, `==`, `>>`) vuol dire «e basta», come nelle mappe del Generale —
non per le lettere, dove `BB` è il bancone con sopra una cassa blu. La
piazzola del camion (`&`) resta strada anche quando il camion non c'è. Una
coppia che la legenda non riconosce è un guasto, non un pavimento vuoto: deve
arrossare un test. Un ordine può aggiungere coppie sue (`legenda: {'BX': {...}}`).

## I capitoli del porto

| sfida | cosa si impara |
|---|---|
| 📦 Il primo carico | prendere e posare, di fianco, nelle quattro direzioni |
| 🚢 La stiva | ripeti, dall'alto: dalla nave al camion |
| 🍅 Rosse e blu | se in mano c'è una cassa rossa… altrimenti… |
| 📋 La bolla | leggere un numero: quante casse caricare |
| 🏗️ La gru | aspetta che…, ripeti per sempre |
| 🐟 Il nastro | il mondo non aspetta: prenderle prima che cadano in mare |
| 🧺 Lo smistamento | un colore letto, e il cesto di quel colore da cercare |
| 🛍️ La bottega dei colori | un progetto che cerca: i clienti chiedono, il robot trova e porta |

**I posti** (`dati/porto/posti.js`): un lavoro diverso per ogni colore di
cassa, prima con le strade date come attrezzi, poi scritte dal bambino una
volta sola e chiamate da più colori, su una mappa più larga dello schermo.
**Le strade di una mappa sono attrezzi di quella mappa** (`attrezzo` di
`dati/attrezzi.js`), non del catalogo.

## Le giornate

`dati/porto/giornate.js`, in fondo alla fila: i pezzi del porto lavorano
tutti insieme.

- **Quello che lavora intorno non deve poter far perdere** chi non l'ha
  ancora imparato: la gru scarica su un nastro che finisce in un cassone e lo
  riempie da sola.
- **I camion** (`camion`, sulla piazzola `&`) arrivano alla loro ora e
  **ripartono appena pieni**: sono l'attore che il livello mette apposta.

| giornata | grandezza | cosa si impara |
|---|---|---|
| 🚚 Il primo camion | piccola | si carica finché il camion c'è |
| ✉️ Il postino | media | il numero letto diventa i passi fino alla buca, andata e ritorno |
| 🧊 Il frigo | media | aspettare dentro un ripeti: il pesce arriva un po' per volta |
| 🦐 Pesce fresco | difficile | cercare il frigo giusto, e tornare prima che la cassa dopo cada in mare |
| 🔀 Due lavori | difficile | camion e clienti dallo stesso posto: chi c'è si serve, se no si aspetta un turno |
| ⚓ La giornata del porto | oltre lo schermo | tutto insieme, e la telecamera segue il robot |

## La tela del porto (`scena/porto.js`)

Il fratello di `scena/tela.js`: riceve un `quadro` già deciso e lo disegna,
senza sapere perché una cassa vola. Il porto arriva già alla fine del
turno (la cassa presa è già in mano), e il quadro porta gli orari di ogni
volo e mezzo: finché un volo è in corso la cosa si disegna in viaggio, e
quando atterra la tela la ritrova da sola dov'è — niente da tenere in pari
col motore.

- **Dritto e di sbieco**: pavimento, arredi e casse si vedono dritti
  dall'alto (sono loro che si contano); il robot, i clienti e la gru sono
  un po' di sbieco, con la testa più su dei piedi — visto da sopra il
  robot sarebbe solo una testa grigia, e il giallo del muratore di latta
  sparirebbe. L'altezza si disegna spostando verso la cima dello schermo:
  è così che la cassa della gru *scende* lungo il cavo invece di
  ingrandirsi sul posto.
- **La telecamera**: se la mappa sta nello schermo con celle di almeno
  26px, non c'è — il canvas è grande quanto la mappa. Se no la cella resta
  a 30px (più piccola a dito non si conta) e il canvas diventa una
  finestra che segue il robot mentre il programma gira, e si trascina col
  dito da fermi.
- **Quello che la tela ricorda fra un fotogramma e l'altro è solo roba da
  occhi**: dov'è la telecamera, il dito che trascina, gli schizzi d'acqua
  ancora aperti, da quando è arrivato il cliente al bancone — mai stato di
  gioco.

Dopo le giornate vengono gli algoritmi: [algoritmi.md](algoritmi.md).
