# I livelli della fattoria 3D

Sul modello di [../fattoria/livelli.md](../fattoria/livelli.md), ricalibrato sui prezzi di qui (campo 20, recinto 45).
Il codice è `dati/livelli.js`; l'esperienza e i rifiuti stanno in `motore/fattoria3d.js`.

## L'esperienza

- **È la spesa in monete fatta dentro questo gioco**: pezzi, lotti, edifici, strade (`_spendi`). Non gli spostamenti né
  il mettere via, e un rimborso non la riduce. Sta in `stato.esperienza` e **non scende mai**.
- Le monete vengono solo dagli esercizi, quindi il livello è tempo di studio riletto; niente consegne (niente si vende).

## Le soglie

- **Una formula, non una tabella**: `1,25 · ((n-1)² + 47·(n-1))` arrotondata a dieci (`SOGLIA_A`, `SOGLIA_B`), così i
  livelli non finiscono mai. Il livello 2 sta a 60 monete (10 minuti di esercizio): un secondo campo e un lotto.
- **La roba di un livello non paga il livello dopo**: ogni salto aggiunge il costo di ciò che il livello apre di
  **produttivo** (`costoDelLivello`: campo, recinto, edifici; le decorazioni no). Senza, si costruiva ciò che era appena
  arrivato ed eri già al livello dopo. Un guasto verifica che il resto del salto sia almeno `SOGLIA_B`.
- Dopo l'ultimo livello (`ULTIMO`, oggi 16) la formula continua e non si apre altro.

## La misura

`npm run tara:fattoria3d` (logica in `motore/taratura.js`) stampa la tabella; `unita/fattoria3d-taratura` ne tiene ferme le
promesse: **il livello 2 non oltre 10 minuti di esercizio, l'ultimo non oltre 7 ore (erano 5 e mezza coi quindici livelli: il sedicesimo e i quattro edifici di telaio, zuccherificio, sartoria e tintoria hanno aggiunto ~75 minuti), nessuna cosa chiesta con più di 2
minuti di attesa in catena, nessun pezzo produttivo sopra i due terzi del salto del suo livello, nessun premio sopra il tetto.**
Metro: 🪙6 al minuto. «Attesa» = maturazione più cottura in catena, campi e bestie in parallelo, una macchina alla volta.

| livello | monete in tutto | minuti | attesa più lunga di ciò che apre |
|---|---|---|---|
| 2 | 60 | 10 | 24 s |
| 3 | 120 | 20 | 30 s |
| 4 | 250 | 42 | 28 s |
| 5 | 365 | 61 | — |
| 6 | 490 | 82 | 52 s |
| 7 | 640 | 107 | 36 s |
| 8 | 800 | 133 | 53 s |
| 9 | 950 | 158 | 44 s |
| 10 | 1120 | 187 | 46 s |
| 11 | 1300 | 217 | 77 s |
| 12 | 1510 | 252 | 86 s |
| 13 | 1710 | 285 | 83 s |
| 14 | 1930 | 322 | 72 s |
| 15 | 2160 | 360 (6 h) | 71 s |
| 16 | 2400 | 400 (6 h 40) | 77 s |

Sono monete spese del tutto (pezzi, lotti, strade): ordini consegnati e lotti contano come esperienza e accorciano la strada.
Provato: curva A=4, B=44 portava il 15 a 7 ore e 20: troppo; con A=1, B=47 il 2 resta a 60 (il test d'integrazione lo conta).

## Cosa arriva quando

Lo dicono le cose stesse: `liv` sul pezzo, sull'edificio, sulla coltura e sulla ricetta; `roba(liv)` le raccoglie girando
i dati veri, quindi un elenco non si scrive due volte e non si scosta.

- **Una cosa produttiva per livello al massimo** (pezzo o edificio), più le decorazioni; le colture e le ricette arrivano
  dove la catena le regge.
- **Una ricetta dichiara il livello vero**: il più tardo fra il suo, quello della sua macchina e quello dei suoi
  ingredienti (`livelloDellaRicetta`). Se non coincide col `liv` scritto è un guasto: un tasto spento non si dichiara.
- **I nomi stanno sulla cosa** (`NOMI`), l'ordine è la precedenza quando due cose arrivano insieme.

```
 1 campo, grano, carote          9 stalla (latte), cipolle, pozzo
 2 mais, bancarella, aiuola     10 mongolfiera, aglio
 3 mulino (farina, pappa di mais), passerella
                                11 caseificio (burro, formaggio), fragole, barbabietola, torta, crostata
 4 recinto, pomodori, tavolo   12 cucina (salsa, polenta, minestrone), peperoni, pizza, lasagne
 5 pollaio (uova), ponte        13 zuccherificio (zucchero, marmellata, biscotti),
                                   melanzane (parmigiana, conserva), spaventapasseri
 6 pastificio (pasta), patate,  14 gelateria (succo, frullato, gelato)
   panchina
 7 panificio (pane)             15 sartoria (maglione, sciarpa, berretto), lavanda, riso
 8 telaio (stoffa), zucche,     16 tintoria (tintura, sapone, sacchetto, maglione alla lavanda)
   cavolfiori, fontana
```

Il livello apre il **pezzo** (pollaio, stalla, recinto); le bestie in più dentro non hanno livello: si comprano a monete
([animali.md](animali.md)), contano come esperienza ma non spostano la scaletta (la taratura conta solo i pezzi produttivi).

Le decorazioni nuove (passerella al 3, tavolo al 4, ponte al 5) non spostano la scaletta: non sono produttive, quindi non si sommano ai salti.

Pollaio, stalla e caseificio stanno **nei buchi** della scaletta (5, 9, 11: livelli senza una cosa produttiva), così i
livelli restano quindici e le soglie dopo il 5 salgono del loro prezzo (55, 90, 120). Lo stesso hanno fatto telaio (8, 🪙70), zuccherificio (13, 🪙130) e
sartoria (15, 🪙150); la tintoria (🪙160) vuole la lavanda, che è del 15, e **ha aperto un sedicesimo livello**: la scaletta ne ha 16. Il pollaio è al 5 e il pastificio al 6 (era il
contrario, con la pasticceria): la pasta vuole le uova, e una macchina non si compra prima della sua prima ricetta. Il livello di `uova` e `latte` è
quello del pezzo che li fa, e `livelloDellaRicetta` li conta fra gli ingredienti ([animali.md](animali.md)).

## Il rifiuto

`{ ok: false, motivo: 'non-sbloccato', liv }` da `compraPezzo`, `compraEdificio`, `semina`/`seminaCampo` (la coltura) e
`avviaRicetta`/`avviaRicettaIn`. Un edificio fuori dal quadrato di partenza prima chiede i lotti
(`lotto-non-tuo`, `lotti`): l'ordine dei controlli è sconosciuto → già tuo → livello → lotti → monete.
Per le fattorie già salvate **ciò che si possiede resta**: il gating vale solo per comprare, seminare e avviare. Un vecchio
stato senza `esperienza` riparte da 0 (livello 1) senza perdere niente.

Un evento `livello` (`{ livello }`) esce a ogni salita, per la scena e i contatori.

## Gli alberi sui posti nuovi

Gli alberi si generano come quando gli edifici erano due (i loro numeri sono chiavi di salvataggio); quelli che cadono sul
posto di un edificio arrivato dopo nascono già `tagliato` (senza costo).

## A schermo

Il gettone «⭐ N» con la barra sottile sta nel HUD e apre `viste/Livelli.vue`: una **scala** col livello di adesso in cima
(numero grande che batte, barra a strisce che scorre, la scatola già aperta con ciò che è arrivato), sotto il gradino
successivo con la scatola ancora chiusa (lucchetto, grigio) e un gradino segreto. Salendo compare un avviso («Livello N: nome») e un
pallino sul gettone finché non si apre il foglio. Ciò che non è arrivato resta visibile ma in grigio, con «Livello N»: le carte del
costruire (non si trascinano), le colture nella scelta del seme, le ricette di una macchina, i fantasmi degli edifici. Toccarle dice
il livello; un tasto grigio non è `disabled`, così il tocco ha una risposta.

Nei test: `unita/fattoria3d` (sezioni 13–20: soglie, `roba`, gating, lotti, catena, vecchio stato).
