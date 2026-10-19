# I livelli della fattoria 3D

Sul modello di [../fattoria/livelli.md](../fattoria/livelli.md), ricalibrato sui prezzi di qui (campo 20, recinto 45).
Il codice è `dati/livelli.js`; l'esperienza e i rifiuti stanno in `motore/fattoria3d.js`.

## L'esperienza

- **È la spesa in monete fatta dentro questo gioco**: pezzi, lotti, edifici, strade (`_spendi`). Non gli spostamenti né
  il mettere via, e un rimborso non la riduce. Sta in `stato.esperienza` e **non scende mai**.
- Le monete vengono solo dagli esercizi, quindi il livello è tempo di studio riletto; niente consegne (niente si vende).

## Le soglie

- **Una formula, non una tabella**: `1,25 · (4·(n-1)² + 44·(n-1))` arrotondata a dieci (`SOGLIA_A`, `SOGLIA_B`), così i
  livelli non finiscono mai. Il livello 2 sta a 60 monete: un secondo campo e un lotto.
- **La roba di un livello non paga il livello dopo**: ogni salto aggiunge il costo di ciò che il livello apre di
  **produttivo** (`costoDelLivello`: campo, recinto, edifici; le decorazioni no). Senza, si costruiva ciò che era appena
  arrivato ed eri già al livello dopo. Un guasto verifica che il resto del salto sia almeno `SOGLIA_B`.
- Dopo l'ultimo livello (`ULTIMO`, oggi 15) la formula continua e non si apre altro.

## Cosa arriva quando

Lo dicono le cose stesse: `liv` sul pezzo, sull'edificio, sulla coltura e sulla ricetta; `roba(liv)` le raccoglie girando
i dati veri, quindi un elenco non si scrive due volte e non si scosta.

- **Una cosa produttiva per livello al massimo** (pezzo o edificio), più le decorazioni; le colture e le ricette arrivano
  dove la catena le regge.
- **Una ricetta dichiara il livello vero**: il più tardo fra il suo, quello della sua macchina e quello dei suoi
  ingredienti (`livelloDellaRicetta`). Se non coincide col `liv` scritto è un guasto: un tasto spento non si dichiara.
- **I nomi stanno sulla cosa** (`NOMI`), l'ordine è la precedenza quando due cose arrivano insieme.

```
 1 campo, grano, carote          9 cipolle, pozzo
 2 mais, bancarella, aiuola     10 mongolfiera
 3 mulino (farine)              11 fragole
 4 recinto, pomodori            12 conserviera (passata, marmellata, cipolle)
 5 pasticceria (pane, popcorn)  13 melanzane (caponata), spaventapasseri
 6 patate, panchina, pizza      14 gelateria (gelati di fragola, di carote)
 7 panificio                    15 lavanda (gelato alla lavanda)
 8 zucche, fontana, torte
```

## Il rifiuto

`{ ok: false, motivo: 'non-sbloccato', liv }` da `compraPezzo`, `compraEdificio`, `semina`/`seminaCampo` (la coltura) e
`avviaRicetta`/`avviaRicettaIn`. Un edificio fuori dal quadrato di partenza prima chiede i lotti
(`lotto-non-tuo`, `lotti`): l'ordine dei controlli è sconosciuto → già tuo → livello → lotti → monete.
Per le fattorie già salvate **ciò che si possiede resta**: il gating vale solo per comprare, seminare e avviare. Un vecchio
stato senza `esperienza` riparte da 0 (livello 1) senza perdere niente.

Un evento `livello` (`{ livello }`) esce a ogni salita, per la scena e i contatori.

## Gli alberi sui posti nuovi

Gli alberi si generano come quando gli edifici erano due (i loro numeri sono chiavi di salvataggio); quelli che cadono sul
posto di un edificio arrivato dopo nascono già `tagliato`, senza legna.

## A schermo

Il gettone «⭐ N» con la barra sottile sta nel HUD e apre `viste/Livelli.vue`. Salendo compare un avviso («Livello N: nome») e un
pallino sul gettone finché non si apre il foglio. Ciò che non è arrivato resta visibile ma in grigio, con «Livello N»: le carte del
costruire (non si trascinano), le colture nella scelta del seme, le ricette di una macchina, i fantasmi degli edifici. Toccarle dice
il livello; un tasto grigio non è `disabled`, così il tocco ha una risposta.

Nei test: `unita/fattoria3d` (sezioni 13–17: soglie, `roba`, gating, lotti, catena, vecchio stato).
