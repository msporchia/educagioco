# I livelli della fattoria 3D

Sul modello di [../fattoria/livelli.md](../fattoria/livelli.md), ricalibrato sui prezzi di qui (campo 20, recinto 45).
Il codice è `dati/livelli.js`; l'esperienza e i rifiuti stanno in `motore/fattoria3d.js`.

## L'esperienza

- **È la spesa in monete fatta dentro questo gioco**: pezzi, lotti, edifici, strade (`_spendi`). Non gli spostamenti né
  il mettere via, e un rimborso non la riduce. Sta in `stato.esperienza` e **non scende mai**.
- Le monete vengono solo dagli esercizi, quindi il livello è tempo di studio riletto; anche le consegne (banco, mongolfiera, vicini) e la terra dànno esperienza, mai monete (niente si vende).

## Le soglie

- **Una formula, non una tabella**: `1,25 · ((n-1)² + 47·(n-1))` arrotondata a dieci (`SOGLIA_A`, `SOGLIA_B`), così i
  livelli non finiscono mai. Il livello 2 sta a 60 monete (10 minuti di esercizio): un secondo campo e un lotto.
- **La roba di un livello non paga il livello dopo**: ogni salto aggiunge il costo di ciò che il livello apre di
  **produttivo** (`costoDelLivello`: campo, recinto, edifici; le decorazioni no). Senza, si costruiva ciò che era appena
  arrivato ed eri già al livello dopo. Un guasto verifica che il resto del salto sia almeno `SOGLIA_B`.
- Dopo l'ultimo livello (`ULTIMO`, oggi 22) la formula continua e non si apre altro.

## La misura

`npm run tara:fattoria3d` (logica in `motore/taratura.js`) stampa la tabella; `unita/fattoria3d-taratura` ne tiene ferme le
promesse: **il livello 2 non oltre 10 minuti di esercizio, l'ultimo non oltre 11 ore (provvisorio: 19–22 sono il pentolone e le tre bestie del giro G4, [cortile-e-pentolone.md](cortile-e-pentolone.md); erano 8 ore e mezza, e prima 5 e mezza coi quindici livelli, 7 coi sedici: il sedicesimo e i quattro edifici di telaio, zuccherificio, sartoria e tintoria hanno aggiunto ~75 minuti, la friggitoria e il sushi bar del diciassettesimo e del diciottesimo ~90), nessuna cosa chiesta con più di 2
minuti di attesa in catena, nessun pezzo produttivo sopra i due terzi del salto del suo livello, nessun premio sopra il tetto.**
Metro: 🪙6 al minuto. «Attesa» = maturazione più cottura in catena, campi e bestie in parallelo, una macchina alla volta.

| livello | monete in tutto | minuti | attesa più lunga di ciò che apre |
|---|---|---|---|
| 2 | 60 | 10 | 24 s |
| 3 | 160 | 26,7 | 30 s |
| 4 | 290 | 48 | 28 s |
| 5 | 405 | 67,5 | — |
| 6 | 530 | 88 | 60 s |
| 7 | 680 | 113 | 36 s |
| 8 | 840 | 140 (2 h 20) | 62 s |
| 9 | 990 | 165 | 44 s |
| 10 | 1160 | 193 | 46 s |
| 11 | 1340 | 223 | 75 s |
| 12 | 1550 | 258 | 84 s |
| 13 | 1750 | 292 | 81 s |
| 14 | 1970 | 328 | 70 s |
| 15 | 2200 | 367 (6 h) | 80 s |
| 16 | 2440 | 407 (6 h 47) | 86 s |
| 17 | 2700 | 450 (7 h 30) | 81 s |
| 18 | 2970 | 495 (8 h 15) | 78 s |
| 19 | 3250 | 542 | 45 s |
| 20 | 3435 | 573 | — |
| 21 | 3665 | 611 | — |
| 22 | 3905 | 651 (10 h 50) | — |

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
 1 campo, grano, carote          9 stalla (latte), cipolle, pozzo,
                                   erba medica (foraggio d'erba)
 2 fienile (foraggio, becchime),  10 mongolfiera, aglio
   mais, bancarella, aiuola
 3 mulino (farina, pappa di mais), passerella
                                11 caseificio (burro, formaggio), fragole, barbabietola, torta, crostata
 4 recinto, pomodori, tavolo   12 cucina (salsa, polenta, minestrone), peperoni, pizza, lasagne
 5 pollaio (uova), ponte        13 zuccherificio (zucchero, marmellata, biscotti),
                                   melanzane (parmigiana, conserva), spaventapasseri
 6 pastificio (pasta), patate,  14 gelateria (succo, frullato, gelato)
   panchina
 7 panificio (pane)             15 sartoria (maglione, sciarpa, berretto), lavanda, riso
 8 telaio (stoffa), zucche,     16 tintoria (tintura, sapone, sacchetto, maglione alla lavanda)
   cavolfiori, fontana        17 friggitoria (patatine, pesce fritto, arancini)
                              18 sushi bar (sushi, maki)
                              19 pentolone (mangime), 20 stagno delle anatre, 21 porcile, 22 capre (provvisori)
```

Il livello apre il **pezzo** (pollaio, stalla, recinto); le bestie in più dentro non hanno livello: si comprano a monete
([animali.md](animali.md)), contano come esperienza ma non spostano la scaletta (la taratura conta solo i pezzi produttivi).

Le decorazioni nuove (passerella al 3, tavolo e molo al 4, ponte e stagno al 5, porticciolo al 9, laghetto all'11) non spostano la scaletta: non sono produttive, quindi non si sommano ai salti.

Il **fienile** sta al 2, l'unico livello senza una cosa produttiva: il mangime ([mangime-e-catena.md](mangime-e-catena.md)) deve esserci prima del recinto (4), del pollaio (5) e della stalla (9), e `guastiDeiLivelli` lo pretende. Costa 🪙40 e ha spostato di 40 la soglia dal 3 in poi (era 120, ora 160; tutti i livelli dopo +40, l'ultimo da 400 a 407 minuti). L'erba medica arriva al 9, con la stalla, ed è fuori dalla regola della scala.

Pollaio, stalla e caseificio stanno **nei buchi** della scaletta (5, 9, 11: livelli senza una cosa produttiva), così i
livelli restano quindici e le soglie dopo il 5 salgono del loro prezzo (55, 90, 120). Lo stesso hanno fatto telaio (8, 🪙70), zuccherificio (13, 🪙130) e
sartoria (15, 🪙150); la tintoria (🪙160) vuole la lavanda, che è del 15, e **ha aperto un sedicesimo livello**: la scaletta ne ha 16. La **friggitoria (17, 🪙170) e il sushi bar (18, 🪙180)** hanno aperto un diciassettesimo e un diciottesimo: tutti i livelli avevano già una cosa produttiva, e le soglie di prima non si muovono ([geografia-e-pesca.md](geografia-e-pesca.md)). Il pollaio è al 5 e il pastificio al 6 (era il
contrario, con la pasticceria): la pasta vuole le uova, e una macchina non si compra prima della sua prima ricetta. Il livello di `uova` e `latte` è
quello del pezzo che li fa, e `livelloDellaRicetta` li conta fra gli ingredienti ([animali.md](animali.md)).

## Il rifiuto

`{ ok: false, motivo: 'non-sbloccato', liv }` da `compraPezzo`, `compraEdificio`, `semina`/`seminaCampo` (la coltura) e
`avviaRicetta`/`avviaRicettaIn`. Un edificio fuori dal quadrato di partenza prima chiede i lotti
(`compraEdificio` è `compraEMetti`: [edifici-liberi.md](edifici-liberi.md)): l'ordine dei controlli è sconosciuto → già tuo → livello → monete; niente più lotti da comprare prima.
Per le fattorie già salvate **ciò che si possiede resta**: il gating vale solo per comprare, seminare e avviare. Un vecchio
stato senza `esperienza` riparte da 0 (livello 1) senza perdere niente.

Un evento `livello` (`{ livello }`) esce a ogni salita, per la scena e i contatori.

## Gli alberi sui posti di prima

Gli alberi dei lotti storici si generano come quando gli edifici erano due (i loro numeri sono chiavi di salvataggio); quelli che cadono sul
vecchio posto di un edificio arrivato dopo nascono già `tagliato` (senza costo). `POSTI_STORICI` (`dati/mondo.js`) ricorda quei posti anche se gli edifici oggi si mettono dove si vuole.

## A schermo

Il gettone «⭐ N» con la barra sottile sta nel HUD e apre `viste/Livelli.vue`: una **scala** col livello di adesso in cima
(numero grande che batte, barra a strisce che scorre, la scatola già aperta con ciò che è arrivato), sotto il gradino
successivo con la scatola ancora chiusa (lucchetto, grigio) e un gradino segreto. Salendo compare un avviso («Livello N: nome») e un
pallino sul gettone finché non si apre il foglio; se il livello apre un edificio l'avviso lo nomina («Livello 7: il Panificio! Costruiscilo») e un «!» sul tasto Costruisci resta finché non c'è ([edifici-liberi.md](edifici-liberi.md)). Ciò che non è arrivato resta visibile ma in grigio, con «Livello N»: le carte del
costruire (non si trascinano), le colture nella scelta del seme, le ricette di una macchina e le carte degli edifici nel menu. Toccarle dice
il livello; un tasto grigio non è `disabled`, così il tocco ha una risposta.

Nei test: `unita/fattoria3d` (sezioni 13–20: soglie, `roba`, gating, lotti, catena, vecchio stato).
