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
  un errore). A sera `motore/porto/esito.js` dice cosa manca, coi numeri.

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

Dopo le giornate vengono gli algoritmi: [algoritmi.md](algoritmi.md).
