# Calibrazione: quanto vale una moneta

Questo file risponde a **una domanda sola**: quanto deve costare una cosa, e
quanto deve rendere un gioco. Prima non c'era una risposta, e si vede — gli
stessi asteroidi pagano una moneta ad asteroide mentre una tappa del
sotterraneo ne paga trentaquattro, e nella fattoria un ingrandimento del silo
è arrivato a chiedere quarantamila monete, cioè centoundici ore di esercizi.
Nessuno di quei numeri era sbagliato *da solo*: erano sbagliati fra loro,
perché ognuno era stato scelto guardando il proprio gioco.

## L'unità: una moneta sono dieci secondi

> **🪙1 = 10 secondi di esercizio.**

Da lì viene tutto il resto:

| quanto | in monete | perché |
|---|---|---|
| un asteroide abbattuto | 🪙1 | una tabellina è un colpo d'occhio: dieci secondi |
| una domanda vera (dungeon, corsa, sotterraneo, survivors, castello) | 🪙3 | si legge una consegna, si sceglie fra quattro: mezzo minuto |
| un minuto di esercizi | 🪙6 | |
| **un'ora di esercizi** | **🪙360** | il numero da tenere in testa quando si scrive un prezzo |

Un gioco non paga «per partita»: paga **per il tempo di esercizio che ha
davvero chiesto**. Una tappa che fa otto domande vale 🪙24, che ci si metta
tre minuti o dieci — il resto del tempo è il gioco, ed è il premio, non il
lavoro.

## Il cambio: giocare costa il doppio di studiare

La fattoria, la cameretta, tutto quello che si compra con le monete è **il
posto dove si spende**. Il rapporto scelto è:

> **cinque minuti passati a spendere costano dieci minuti di esercizi.**

Un gesto in un gioco di spesa (seminare, raccogliere, far partire una
macchina, dare da mangiare) dura circa **dieci secondi**, quindi ne costa
venti di esercizio:

> **un gesto = 🪙2.**

È il motivo per cui seminare costa 1–4 monete e non 20: un gesto è un gesto.
Quello che costa tanto sono le **strutture**, che si comprano una volta e
poi lavorano per sempre.

## La scala delle spese

Tradotta in tempo di esercizi, una spesa deve cadere in una di queste fasce.
Se una spesa nuova non ci sta dentro, è quella spesa a essere sbagliata — non
la scala.

| fascia | tempo | cos'è | esempi di oggi |
|---|---|---|---|
| un gesto | 10–40 s | 🪙1–4 | seminare, raccogliere, avviare il mulino, una crocchetta |
| una cosetta | 1–5 min | 🪙6–30 | un cespuglio, una panchina, un cibo buono |
| una cosa vera | 5–25 min | 🪙30–150 | un campo (22), un pezzo di terra (45), un silo (120) |
| una struttura | 25–60 min | 🪙150–360 | il mulino (150), i recinti (95–260), un animale (75–120) |
| una spesa lunga | 1–2 ore | 🪙360–720 | gli ingrandimenti alti, la terra dopo il decimo pezzo |

Sopra le due ore non ci va **niente**. Un bambino gioca venti o trenta minuti
al giorno: due ore sono già una settimana, e una settimana per una cosa sola
è il punto in cui si smette di provarci.

## Le curve: mai esponenziali

Una cosa che si compra più volte deve rincarare — se no la strategia è
comprarne dieci e il gioco finisce lì — ma **il rincaro non è mai
esponenziale**, e il motivo è che le monete si guadagnano sempre allo stesso
ritmo. Una curva esponenziale presume che chi paga diventi più ricco a ogni
passo; qui non succede, quindi **lo sforzo riparte da zero ogni volta** e il
prezzo va scritto in *ore di esercizio*, non in percentuali.

Le due forme buone:

- **lineare** (`base · (1 + n·k)`), quando ogni copia vale quanto la prima:
  i campi e i recinti della fattoria (`cresce` nel catalogo, k = 0,6 → 🪙22,
  35, 48, 62…). Il pezzo di terra usa ancora un 1,38 geometrico: è l'ultimo
  rimasto, e va guardato la prossima volta che si tocca l'economia — il
  decimo pezzo costa già 🪙800, più di due ore;
- **logaritmica** (`base + passo · ln(1+n)`), quando la cosa migliora sempre
  la stessa cosa: gli ingrandimenti del silo — 🪙40, 130, 185, 220, 250… cioè
  7 minuti il primo, mezz'ora il secondo, poi sempre intorno all'ora, e mai
  di più.

Il controllo da fare a mente su ogni curva nuova: **quanto costa la decima
volta, in ore?** Se la risposta è «più di due», la curva è sbagliata.

## Il livello di un gioco che si spende

La fattoria ha un livello che sale **con le monete spese lì dentro**
(`giochi/fattoria/dati/livelli.js`), e la forma è riusabile: soglia
`A·(n-1)² + B·(n-1)`, tanti livelli che danno poco, e quello che non è ancora
arrivato mostrato in una pagina dei livelli invece che spento dentro il
negozio. I numeri da tenere a mente: il secondo livello a dieci minuti di
esercizi, il decimo a tre ore, l'ultimo a un centinaio — e mai un livello che
non porta niente.

## Dove stanno i numeri

- `src/giochi/fattoria/dati/coltivazioni.js` — prezzi dei gesti, capienza e
  ingrandimenti dei silos (`costoIngrandimento`)
- `src/giochi/fattoria/dati/catalogo.js` — prezzi delle cose, e `cresce` per
  quelle che rincarano
- `src/giochi/fattoria/dati/mondo.js` — il pezzo di terra e il suo rincaro
- `src/giochi/*/dati/campagna.js` — i premi delle tappe, gioco per gioco
- `src/data/shop.js`, `src/data/arredamento.js` — quello che si compra fuori

## Quello che ancora non torna

Il riequilibrio dei **premi dei giochi** non è stato fatto: oggi una tappa
rende `premio × stelle` con premi scelti gioco per gioco (dungeon 3→10,
sotterraneo 10→34, conta 1→4), senza nessun rapporto con quante domande
contiene davvero. La strada è dichiarare in ogni campagna **quante domande
chiede una tappa** e pagarle a 🪙3, poi un test che confronta il dichiarato
con quello che il motore chiede davvero — come già fa `npm run tara` per il
castello.
