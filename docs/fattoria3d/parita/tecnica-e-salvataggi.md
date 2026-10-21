# Parità: salvataggi, peso, telefoni, test

Legenda in [README.md](README.md). Archivio: [../../core/archivio.md](../../core/archivio.md). Peso: [../scena.md](../scena.md)
«Qualità e peso». Migrazioni passate: [../merci-e-ricette.md](../merci-e-ricette.md) «I vecchi salvataggi».

## I salvataggi (S1)

| id | cosa | stato | pri |
|---|---|---|---|
| T1 | **migrazione 2D → 3D** | ❌ non esiste. La 3D scrive in `profile.campagne.fattoria3d.cfg.stato` (`VERSIONE_STATO` 9) e non legge mai `campagne.fattoria`. Chi passa dalla 2D parte da zero e perde tutto (terra, bestie, livello fino a 70) | **P0** |
| T2 | cosa convertire (se D1 lo sceglie) | livello (`speso` + `guadagnato` della 2D → `esperienza`), campi/macchine/recinti per equivalenza di tipo, scorte e prodotti, `fila`, bestie, addobbi, ordini aperti, nomi, traguardi (contatori `fattoria*` restano) | P0 con T1 |
| T3 | il rischio degli id | `pasticceria` e `conserviera` significano cose diverse nelle due; gli id dei contenuti non si rinominano ([../../core/archivio.md](../../core/archivio.md)); le merci `carote`/`carota` hanno chiavi diverse | P0 con T1 |
| T4 | convivenza | oggi le due fattorie condividono le monete e hanno stati separati: nessun conflitto di dati, ma due posti dove spendere | D1, D14 |
| T5 | salvataggio a pagina nascosta | ✅ `salva({ subito })` su `visibilitychange`/`pagehide` come la 2D | – |
| T6 | cestino e ripristino | 2D sì | ❌ per la 3D (I17) |

La migrazione si scrive come **funzione pura** `statoDa2D(datoFattoria) → stato3D` (come `normalizza`: non lancia mai), provata su ogni
livello con `motore/tipo.js` della 2D (1–99) e su un salvataggio vero esportato. Tocca la 3D in sola lettura sullo stato 2D.

## Peso e telefoni (S7)

| id | cosa | 2D | 3D | pri |
|---|---|---|---|---|
| T7 | **misura su un telefono vero** (fps, caldo, batteria, draw call ~430 a stato pieno) | gira sui telefoni deboli, tela 2D | ❌ solo SwiftShader; `Mostra il rapporto` nel pannello ⚙ serve a questo | **P0** |
| T8 | senza WebGL 2 | non serve | 🟡 il messaggio e il ritorno in home: un bambino su un telefono vecchio perde la fattoria. Serve un ripiego (aprire la 2D?) o una decisione | **P0** D15 |
| T9 | fasce di qualità e degrado | – | ✅ `dati/qualita.js` (basso/medio/alto dalla fascia del telefono), degrado adattivo `dati/degrado.js` (scende sotto 30 fps per 2 s, risale dopo 10 s a 55); **da tarare su un telefono** | P1 |
| T10 | istanziare il campo (−100 draw call), aiuole/panchine/pali, LOD, compagni più leggeri | – | ❌ elencati in [../da-fare.md](../da-fare.md) «Il peso della scena» | P1 |
| T11 | costo dell'avvio dei modelli | – | cache, ma ×5–8 sui telefoni: da misurare | P1 |
| T12 | peso nel file | atlante 1,9 MB | three ~640 KB + `fattoria3d`; la 3D importa l'atlante 2D (`Faccia.vue`): se la 2D si toglie, l'atlante deve restare | P1 D14 |
| T13 | ogni modello nuovo si paga in mesh | – | ~30 modelli nuovi per la parità (recinti, pentolone, botteghe, decori): il budget va fissato per famiglia (`strumenti/misura-modelli3d.mjs`) | P1 |
| T14 | contesti WebGL durante una visita | – | due tele insieme; da provare su un telefono | P1 |

## Il sito spezzato e il service worker

| id | cosa | stato | pri |
|---|---|---|---|
| T15 | gruppo `fattoria3d` (three, visita, atlante) nel sito spezzato | 🟡 three sta nel gruppo degli Asteroidi; l'atlante come modulo condiviso: non provato con un build | P1 `node strumenti/prova-sito.mjs` |
| T16 | offline, file unico | ✅ il 3D è dentro `dist/index.html` | – |
| T17 | aggiornamento | uguale agli altri giochi ([../../core/aggiornamento.md](../../core/aggiornamento.md)) | – |

## I test

| id | cosa | 2D | 3D | pri |
|---|---|---|---|---|
| T18 | unità | ~15 file (fattoria, tipo, mercato, botteghe, mongolfiera, coda, bolla, spinta, stagioni, addobbi, albero, animali, consiglio, coltivazioni, livelli) | ✅ 22 file | – |
| T19 | integrazione col dito | 8 file | 🟡 2 file, **aggiornati ma non eseguiti** dopo molti giri (la build era vietata): `fattoria3d`, `fattoria3d-vicini` | **P0** |
| T20 | una fattoria già giocata a ogni livello | `unita/fattoria-tipo` | ❌ | P1 |
| T21 | un test di parità 2D/3D: ogni macchina, recinto, ricetta, bottega della 2D è in 3D o è in una lista di deviazioni dichiarate (come `MANCANTI` di `unita/fattoria3d-merci`) | – | ❌ solo le ricette | P1 |
| T22 | un comando che rifa i numeri di questa cartella (`npm run parita:fattoria3d`) | – | ❌: oggi si ricavano importando i dati; la regola «niente cose una tantum» vuole uno strumento in `strumenti/` | P1 |
| T23 | `npm run test:misure` per l'equilibrio | `tara` (livelli) | ✅ `tara:fattoria3d` | – |

## Voci aperte tecniche (restano in [../da-fare.md](../da-fare.md))

Non visti col dito né su un telefono: la bacheca, i tre stadi delle bestie, gli edifici liberi, il pezzo al dito e lo scorrimento ai bordi, «Costruisci qui»,
le anteprime 3D, la pesca e il mare, il mondo senza confini, il foglio della macchina, la mongolfiera, i quattro edifici nuovi, il
fienile (due fienili in vista), «Quando ci premi», i vicini. Da giocare: i prezzi delle bestie, la lana a 25 s, i riposi. Da ridisegnare: i
modelli di pastificio e cucina. Ognuna passa a ✅ solo con una prova eseguita sulla build e un dito su un telefono.
