# Gli ordini: il banco della fattoria 3D

Chi chiede i raccolti e i prodotti delle macchine. Dati in `dati/ordini.js`, regole pure in `motore/ordini.js`, il banco
(i posti, `consegna`, `rifiuta`) nella `Fattoria3d`. Il modello è il mercato della fattoria di sempre
([../fattoria/chi-chiede.md](../fattoria/chi-chiede.md)); qui le differenze.

## Le regole

- **Il banco lavora se c'è la bancarella**: il livello è almeno 2 (`LIVELLO_BANCO`, quello della bancarella) **e** una
  bancarella è messa sulla mappa (una `cosa` di tipo `bancarella` in `stato.cose`). Perché: dà un senso al pezzo, che
  prima era una decorazione, e un bambino che non l'ha comprata non vede un'interfaccia che non ha chiesto. Messa via la
  bancarella il banco si chiude (`ordini()` torna `[]`) ma gli ordini restano salvati e tornano rimettendola.
- **Tre ordini aperti** (`POSTI`), ciascuno di un cliente diverso (dieci personaggi del paese, `CLIENTI`: nome ed emoji,
  nessuno chiede per mestiere: il banco è per tutti).
- **Un ordine chiede 1–3 cose diverse**: raccolti (1–4 ciascuno) o prodotti (1–2 ciascuno). Non c'è un elenco di ordini: si
  compongono da `COLTURE` e `RICETTE` vere, quindi un raccolto o una ricetta nuova entra nel banco da sola.
- **Mai un ordine impossibile**: si chiede solo ciò che `livelloDellaColtura`/`livelloDellaRicetta` (macchina e ingredienti
  compresi) dicono fattibile al livello di chi gioca. Al livello 2 sono solo raccolti; i prodotti arrivano man mano che
  arrivano le macchine. Un ordine dichiara il suo `liv` (il più alto fra le cose chieste) e non supera mai quello di chi
  l'ha ricevuto. Con i prodotti disponibili, uno slot su due ne chiede uno: se no le macchine non servirebbero.
- **Consegnare** (`consegna(idx)`) toglie la roba dalle scorte (`merci` o `prodotti`), dà esperienza, riempie subito il
  posto con un ordine nuovo. Se manca roba non cambia niente: `{ ok: false, motivo: 'mancano', mancano: { chiave: n } }`.
  Altri motivi: `banco-chiuso`, `sconosciuto` (posto vuoto o fuori numero).
- **Rifiutare / cambiare** (`rifiuta(idx)`, `cambia` è lo stesso) è gratis ma il posto resta vuoto per tre minuti
  (`RIPOSO_MS`): senza attesa si premerebbe finché esce l'ordine facile. L'attesa è sull'orologio (`ora()`), quindi vale
  anche a pagina chiusa.
- **Un ordine non scade**: aspetta finché non si consegna o si rifiuta. Niente marcisce, niente si perde.
- **Niente monete**: il verso è sempre monete → cose. Un ordine paga **esperienza** (la stessa della spesa: un salto di
  soglia manda l'evento `livello`, come comprare).

## Il premio: si paga il tempo

```
minuti   = Σ quantità · ms(cosa) / 60000      ms di un raccolto = la sua maturazione
tetto    = 6 · minuti                          ms di un prodotto = la ricetta + i suoi ingredienti, a catena
premio   = max(1, floor(tetto · 0,5))
```

- **Il tetto è 🪙6 al minuto** ([calibrazione](../apprendimento/calibrazione.md): una moneta vale dieci secondi): un ordine
  non rende mai più del tempo che costa. `guastiDegliOrdini()` e `unita/fattoria3d-ordini` lo tengono fermo.
- **Si paga la metà del tetto** (`FRAZIONE_DEL_TETTO`): il tempo di un raccolto è contato una tessera alla volta, ma un campo
  ne fa quattro e più campi crescono insieme, quindi il tempo vero è minore. Se la roba arriva troppo in fretta la leva è
  questa frazione.
- **La catena si paga da sola**: un prodotto conta anche il tempo degli ingredienti, così il pane integrale rende più
  del grano che contiene. Il premio non ha un numero scritto: si ricalcola dai dati, anche per un ordine già salvato.

## Lo stato (versione 3)

```
stato.ordini = {
  aperti:    [ordine | null, ordine | null, ordine | null],   // un posto vuoto è null
  riprende:  [ms | null, …],                                  // quando il posto vuoto si riempie (null = subito)
  prossimoId: n,                                              // l'id dell'ordine che nasce
}
ordine = { id, cliente: 'nonna', chiede: { grano: 2, pane: 1 }, premio: 7, liv: 5 }
```

- **Un v2 non perde niente**: manca `ordini`, il banco parte vuoto e si riempie al primo `tick()`/`ordini()`.
- **`normalizza` non lancia mai**: un ordine guasto diventa un posto vuoto; di uno quasi buono si tengono le righe valide,
  premio e livello si ricalcolano (`ordineInForma`).
- **Il caso viene da `rnd`**: con un `rnd` fisso lo stesso stato dà gli stessi ordini (i test).

## Per la vista

- `ordini()` → un elemento per posto, `[]` a banco chiuso (`bancoAperto()`):
  - ordine: `{ idx, id, cliente: { id, nome, emoji }, chiede: [{ k, n, nome, emoji, ha, manca, prodotto }], premio, liv, pronto }`;
  - posto che riposa: `{ idx, attesa: true, restoMs }`.
- `consegna(idx)` / `rifiuta(idx)` / `cambia(idx)` → `{ ok, … }` o `{ ok: false, motivo }`; `mancanoPerOrdine(idx)`.
- Eventi (`prendiEventi()`): `consegna` (`cliente`, `premio`, `chiede`), `rifiuto`, `livello` se si sale.

## Nei test

`unita/fattoria3d-ordini`: dati senza guasti, ordini fattibili e dentro il tetto per ogni livello (con `rnd` finto), il
banco chiuso senza bancarella o al livello 1, consegna e `mancano`, salto di livello consegnando, rifiuto con ritardo,
salvataggio e migrazione dal v2. Per ora nessun bersaglio `[data-…]`: la vista non c'è ancora.
