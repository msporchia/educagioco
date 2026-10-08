# I file della fattoria

Dove sta cosa in `src/giochi/fattoria/`, e le prove che lo tengono fermo.
La forma è quella della convenzione dei giochi nuovi
([`../core/convenzione-giochi.md`](../core/convenzione-giochi.md)):
`dati/` puro, `motore/` senza schermo, `scena/` che disegna e non sa le
regole, `viste/`, `Gioco.vue` che coordina.

## `dati/`

| file | cosa |
|:--|:--|
| `coltivazioni.js` | colture, ricette, merci, silos, `PROFONDITA`, `RESA` — e il perché dei numeri |
| `catalogo.js` | cosa si compra: `campo`, `macchina`, `silo`, `posto`, `mongolfiera`, `stati`, `aspetta`, `cresce`, `unico` |
| `livelli.js` | soglie, `costoDelLivello`, `NOMI`, cosa arriva quando (`roba`), i premi, `livelloDelProdotto` |
| `mercato.js` | i clienti, il premio a gesti, `valoreDi`/`minutiDi`/`gestiDi`, `megliaDi`, la pesca pesata |
| `botteghe.js` | i numeri delle botteghe del paese: pezzi, attese, fama |
| `mongolfiera.js` | file, casse, bonus, il cielo vuoto |
| `coda.js` | la fila delle macchine: posti e prezzi |
| `usi.js` | a cosa serve una merce, tutte le uscite |
| `bisogni.js` | i bisogni, i cibi, le coccole, quando una bestia si premia |
| `animali.js` | le bestie di casa, `premioBenessere`, `AGGANCI`, `BOB`, `porta` |
| `addobbi.js` | cappellini e occhiali in vendita, collo e schiena sospesi |
| `albero.js` | la pagina dell'albero, pura (`alberoDi`, `righeDi`) |
| `stagioni.js` | le finestre di Halloween e Natale, `addobbiStagionali` |
| `mondo.js` | le misure (celle, piazzole, `COSTO_SPOSTARE`) |
| `terreni.js` `ostacoli.js` | i terreni dipingibili, il bosco da sgomberare |
| `atlante.js` | generato da `atlante.py`: non si scrive a mano |

## `motore/`, `scena/`, `viste/`

| file | cosa |
|:--|:--|
| `motore/fattoria.js` | tutte le regole, senza schermo — gira anche in Node |
| `motore/consiglio.js` | il prossimo passo, che risale la catena |
| `motore/mercato.js` `botteghe.js` `mongolfiera.js` `vicino.js` | chi chiede e il carretto: cosa si chiede, cosa succede consegnando |
| `motore/camminata.js` | chi cammina: a celle, aggirando le case |
| `motore/tipo.js` | la fattoria già giocata di `#fattoria-tipo=` |
| `scena/tela.js` | il disegno, che non sa cosa sia il grano |
| `scena/spinta.js` `dito.js` | lo scorrimento contro il bordo, le soglie del dito |
| `scena/bolla.js` | dove stanno i gettoni (il semicerchio, le pagine) e la fila sotto una macchina: puro, lo leggono la tela e il dito |
| `scena/pixel-festa.js` | i disegni in pixel della festa (zucche, cappello da strega): un carattere è un pixel |
| `scena/bordi.js` | l'auto-bordo fra due materie dipinte (l'acqua e il prato) |
| `viste/Granaio.vue` | un silo: scomparti, chi usa cosa, ingrandire |
| `viste/Roba.vue` `Provino.vue` | il baule e la figura in scala |
| `viste/Merce.vue` | la faccia di una merce: il disegno, o l'emoji |
| `viste/Mercato.vue` `Bottega.vue` `Mongolfiera.vue` `Vicino.vue` | i posti che chiedono, a caselle |
| `viste/Albero.vue` | la pagina dell'albero |
| `viste/Livelli.vue` | la pagina dei livelli e i premi da prendere |
| `viste/Bestia.vue` `Vestiario.vue` `Battesimo.vue` | la scheda di una bestia, «Vestilo», il nome |
| `viste/Passo.vue` | il prossimo passo a schermo: la riga del consiglio e il suo tasto |
| `viste/Attrezzi.vue` | ↻ ⇄ 📦 appesi alla cosa tenuta premuta |
| `viste/Pixel.vue` | un disegno di `pixel-festa.js` dentro un foglio (il cappello nel guardaroba) |
| `viste/Chiudi.vue` | la ✕ di tutti i fogli |

`strumenti/sprite/festa.mjs` fa dai disegni di `pixel-festa.js` il foglio delle
zucche (poi `atlante.py fattoria`). I fogli degli sprite (`campi*.json`, `animali*.json`, `merci*.json`,
`edifici*.json`, con il perché di ogni ritaglio) stanno in
`strumenti/sprite/sorgenti/fattoria/generati/`.

## Le prove

| prova | cosa |
|:--|:--|
| `unita/fattoria` | il motore, i premi delle bestie, la ✕ di ogni foglio |
| `unita/coltivazioni` | si coltiva spostando l'orologio; coltivare conviene la metà; le confluenze (1b-bis); nel raccolto solo colture (5b) |
| `unita/recinti` | i ritratti, la catena intera giocata, cosa chiede chi ha fame |
| `unita/livelli-fattoria` | le soglie, i premi, `ULTIMO` |
| `unita/mercato` | si chiede solo il possibile, a ogni livello; il tetto del premio |
| `unita/botteghe-fattoria` `mongolfiera-fattoria` `coda-fattoria` | le tre forme del secondo albero |
| `unita/albero` `consiglio` | l'albero per ogni merce a ogni livello; albero e consiglio d'accordo |
| `unita/addobbi` | si compra, si mette, si toglie, cosa non gli sta |
| `unita/stagioni-fattoria` `spinta-fattoria` `fattoria-tipo` | le finestre, lo scorrimento, la fattoria di prova |
| `integrazione/campi` | col dito: semina, chiude, torna, raccoglie; lo scaffale che scorre |
| `unita/bolla-fattoria` | i gettoni non si coprono e stanno nello schermo, da uno a una pagina piena |
| `integrazione/fattoria-bolla` | il seme strisciato su quattro campi, il cesto, la ricetta portata sul mulino, il ritiro al tocco |
| `integrazione/fattoria-fila` | la fila sul prato: togliere chi aspetta, comprare il posto in più |
| `integrazione/fattoria` `albero` `fattoria-fila` `fattoria-bottega` `fattoria-mongolfiera` `fattoria-stagioni` `fattoria-tipo` | le schermate col dito |
