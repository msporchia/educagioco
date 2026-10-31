# Gli ordini: il banco della fattoria 3D

Chi chiede i raccolti e i prodotti delle macchine. Dati in `dati/ordini.js`, regole pure in `motore/ordini.js`, il banco
(i posti, `consegna`, `rifiuta`) nella `Fattoria3d`. Il modello è il mercato della fattoria 2D, da
Hay Day: il banco è il camion (tanti ordini piccoli, sempre), le [botteghe](botteghe.md) i visitatori, la [mongolfiera](mongolfiera.md)
la nave. Tutti pagano esperienza e mai monete ([regole.md](regole.md)).

## Le regole

- **Il banco lavora se c'è una bacheca o una bancarella**: il livello è almeno 2 (`LIVELLO_BANCO`, quello dei due pezzi) **e**
  una `cosa` di tipo `bacheca` o `bancarella` è messa sulla mappa (`PEZZI_DEL_BANCO` in `dati/ordini.js`, letto da `bancoAperto()`).
  La **bacheca** (2×1, 🪙 12, livello 2, 📋) è il pezzo vero del banco: i foglietti appuntati sono gli ordini aperti e sul suo
  cartello compare «🧺 N pronti!» come per le macchine. La **bancarella** resta nel menu «Costruisci qui» (scheda Edifici) come arredo e apre lo stesso banco: chi
  l'aveva già messa non perde niente. Perché: dà un senso al pezzo, che prima era una decorazione, e un bambino che non l'ha
  comprato non vede un'interfaccia che non ha chiesto. Messi via tutti e due il banco si chiude (`ordini()` torna `[]`) ma gli
  ordini restano salvati e tornano rimettendone uno.
- **Gli ordini aperti crescono col livello** (`POSTI(livello)` in `dati/ordini.js`, tabella `POSTI_PER_LIVELLO`: 3 fino al livello 4, 4 dal 5, 5 dal
  8, 6 dal 11, 8 dal 14; `POSTI_MAX` = 8), ciascuno di un cliente diverso (dieci personaggi del paese, `CLIENTI`: nome ed emoji,
  nessuno chiede per mestiere: il banco è per tutti).
- **Un ordine chiede 1–3 cose diverse**: raccolti (1–4 ciascuno) o prodotti (1–2 ciascuno). Non c'è un elenco di ordini: si
  compongono da `COLTURE` e `RICETTE` vere, quindi un raccolto o una ricetta nuova entra nel banco da sola.
- **Mai un ordine impossibile**: si chiede solo ciò che `livelloDellaColtura`/`livelloDellaRicetta` (macchina e ingredienti
  compresi) dicono fattibile al livello di chi gioca. Al livello 2 sono solo raccolti; i prodotti arrivano man mano che
  arrivano le macchine. Un ordine dichiara il suo `liv` (il più alto fra le cose chieste) e non supera mai quello di chi
  l'ha ricevuto. Con i prodotti disponibili, uno slot su due ne chiede uno: se no le macchine non servirebbero. **Il mangime non si chiede mai**
  (`mangime: true`: l'erba medica, becchime e foraggio: [mangime-e-catena.md](mangime-e-catena.md)); un ordine già aperto con la pappa di mais si consegna ancora.
- **Consegnare** (`consegna(idx)`) toglie la roba dalle scorte (`merci` o `prodotti`), dà esperienza, riempie subito il
  posto con un ordine nuovo. Se manca roba non cambia niente: `{ ok: false, motivo: 'mancano', mancano: { chiave: n } }`.
  Altri motivi: `banco-chiuso`, `sconosciuto` (posto vuoto o fuori numero).
- **Rifiutare / cambiare** (`rifiuta(idx)`, `cambia` è lo stesso) è gratis ma il posto resta vuoto per cinque minuti
  (`RIPOSO_MS`, da `RIPOSO_MIN` della 2D): senza attesa si premerebbe finché esce l'ordine facile; cinque minuti sono un campo di grano,
  quindi chi rifiuta torna a coltivare. L'attesa è sull'orologio (`ora()`), quindi vale
  anche a pagina chiusa.
- **Un ordine non scade**: aspetta finché non si consegna o si rifiuta. Niente marcisce, niente si perde.
- **Niente monete**: il verso è sempre monete → cose. Un ordine paga **esperienza** (la stessa della spesa: un salto di
  soglia manda l'evento `livello`, come comprare).

## Il premio: si paga il lavoro

Il conto è quello della 2D (`premioPer`, `premioDelPezzo` di `da2d/dati/mercato.js`; `premioDi` in `dati/ordini.js` traduce gli id):

```
⭐ di un pezzo  = PER_GESTO · gesti · (1 + BONUS_FASE · (fasi − 1))      PER_GESTO = 2 · BONUS_FASE = 0,2
⭐ di un ordine = PREMIO_BASE + Σ pezzi                                  PREMIO_BASE = 6
```

`gestiDi` conta raccolti e lavorazioni lungo la strada più corta, `profonditaDi` le fasi.

- **A parità di gesti la catena lunga rende di più** (da ⭐2 a ⭐4 per gesto). Provato `6 + 4·valoreDi`, cioè il costo in monete: un
  raccolto costa 🪙1 e una lavorazione 🪙0–2, quindi trasformare quasi non contava, e la mossa giusta era rifiutare la torta e aspettare
  il grano.
- **Perché 2 e non 3**: a 3 un raccolto al banco rendeva il 20–30% in più, e con botteghe (+25%), mongolfiera e fila i livelli sarebbero
  arrivati prima di aver giocato con quello che c'era. Se la roba nuova arriva troppo in fretta, la leva è `PER_GESTO`.
- **Il tetto**: un ordine non rende mai più di 🪙6 per ogni minuto che costa produrlo ([calibrazione](../apprendimento/calibrazione.md):
  una moneta vale dieci secondi). `guastiDegliOrdini()` e `unita/fattoria3d-ordini` lo tengono fermo. Il conto «metà del tetto»
  (`FRAZIONE_DEL_TETTO`) di prima, coi tempi in minuti veri, avrebbe pagato una lasagna sei volte tanto.
- Il premio non ha un numero scritto: si ricalcola dai dati, anche per un ordine già salvato.

## Lo stato (versione 3)

```
stato.ordini = {
  aperti:    [ordine | null, …],                              // uno per posto (da 3 a 8); un posto vuoto è null
  riprende:  [ms | null, …],                                  // quando il posto vuoto si riempie (null = subito)
  prossimoId: n,                                              // l'id dell'ordine che nasce
}
ordine = { id, cliente: 'nonna', chiede: { grano: 2, pane: 1 }, premio: 7, liv: 5 }
```

- **Un v2 non perde niente**: manca `ordini`, il banco parte vuoto e si riempie al primo `tick()`/`ordini()`.
- **`normalizza` non lancia mai**: un ordine guasto diventa un posto vuoto; di uno quasi buono si tengono le righe valide,
  premio e livello si ricalcolano (`ordineInForma`).
- **I posti non si perdono**: `normalizza` e `_allungaPosti()` (`serializza` e `_riempiOrdini`) portano `aperti`/`riprende` ad almeno `POSTI(livello)`
  senza mai accorciare (un elenco salvato più lungo resta, fino a 16); un elenco corto si riempie, salendo di livello si apre un posto nuovo.
  La forma è la stessa; la versione sale (v7) solo per gli id delle merci.
- **Gli ordini di prima delle ricette della 2D** chiedono ancora i vecchi id: `ordineInForma` li traduce (`nuovoId`: tre torte diverse diventano «torta ×3»),
  senza perdere righe ([merci-e-ricette.md](merci-e-ricette.md)). I dischi del fumetto mostrano la faccia di ogni merce (`Faccia.vue`).
- **Il caso viene da `rnd`**: con un `rnd` fisso lo stesso stato dà gli stessi ordini (i test).

## Per la vista

- `ordini()` → un elemento per posto, `[]` a banco chiuso (`bancoAperto()`):
  - ordine: `{ idx, id, cliente: { id, nome, emoji }, chiede: [{ k, n, nome, emoji, ha, manca, prodotto }], premio, liv, tipo, pronto, senzaMacchina: [{ tipo, nome, art, emoji }] }` (`senzaMacchina`: le macchine che l'ordine vuole e non hai in mappa; il biglietto mostra un «!» e il dettaglio «Serve il Panificio»: [edifici-liberi.md](edifici-liberi.md));
  - posto che riposa: `{ idx, attesa: true, restoMs }`.
- `consegna(idx)` / `rifiuta(idx)` / `cambia(idx)` → `{ ok, … }` o `{ ok: false, motivo }`; `mancanoPerOrdine(idx)`.
- Eventi (`prendiEventi()`): `consegna` (`cliente`, `premio`, `chiede`), `rifiuto`, `livello` se si sale.

## La vista

`viste/Bacheca.vue` (stile in `stile-bacheca.css`, prefisso `.f3-bac-`), aperto da `Gioco.vue`: toccando la bacheca o la bancarella messa
(`azioni.js` → `ui.apriBanco()`) o il tasto «🧺 Banco» del `Hud` (da livello 2; il pallino rosso conta gli ordini `pronto`). L'idea è la
bacheca degli ordini di Hay Day: un pannello di legno, «Gli ordini» su un'asse inchiodata, la ✕ rossa in alto a destra e in alto a
sinistra «Consegne 2/5» con la barra blu (le consegne fatte verso la prossima soglia del traguardo `f3d-ordini`, `traguardoOrdini` in
`Gioco.vue`: nessuna ricompensa nuova).

- **La tavola**: legno scuro a assi, i biglietti a griglia da 3, appena storti (±2°) e con la puntina rossa. Il colore viene dai
  dati, `tipoDelOrdine(chiede)`: **rosa** se chiede un prodotto delle macchine, **giallo** se è una cosa sola (facile, i primi), **verde**
  se sono più raccolti. Sul biglietto: l'emoji del cliente, «+N ⭐», e il pallino verde ✓ se si consegna adesso. Un posto che riposa è un
  biglietto grigio, «Posto libero · Torna fra m:ss».
- **Il dettaglio** (sotto la tavola sui telefoni, attaccato in basso così «Consegna» è sempre in vista; a destra da 700 px): il biglietto
  toccato si alza e il dettaglio mostra il ritratto e il nome, «+N ⭐», il **cestino 🗑️** (cambia l'ordine: è `rifiuta`, senza conferma), le merci
  come gettoni (`MerceBacheca.vue`: `k`, `emoji`, `n`, la stessa API di `Faccia.vue`, da sostituire con una riga) con ✓ verde o «2/4» rosso,
  e il tasto verde «🚜 Consegna», `aria-disabled` finché manca roba (il tocco dice cosa manca). Senza scelta vale il primo consegnabile, poi il primo che c'è.
- **Consegnare**: il biglietto si strappa (transizione `out-in`), ne compare uno nuovo e otto stelline ⭐ volano via (CSS, col tempo;
  `prefers-reduced-motion` le spegne). Il testo «Consegnato a <cliente>: +N ⭐» sta nel dettaglio e in un avviso sopra la scena.
- Banco chiuso, il foglio dice cosa fare («Il banco arriva al livello 2» / «Metti una bacheca (o una bancarella)»).
- Il vecchio `viste/Banco.vue` resta nel repo ma non è più agganciato.

La **bacheca in scena** (`pezzi.js`, `dal-sotterraneo.js`) mostra tanti foglietti quanti gli ordini aperti, fino a sei, nel colore del loro `tipo`.

## Nei test

`unita/fattoria3d-ordini`: dati senza guasti, i posti per livello (`POSTI`, che non scendono mai), i colori dei biglietti (`tipoDelOrdine`), un banco a otto posti e uno stato corto o lungo che si rimette in forma, ordini fattibili e dentro il tetto per ogni livello (con `rnd` finto), il
banco chiuso senza bacheca né bancarella o al livello 1, aperto con una sola delle due, la bacheca che si compra e si mette, consegna e `mancano`, salto di livello consegnando, rifiuto con ritardo,
salvataggio e migrazione dal v2.

`integrazione/fattoria3d` (sezione «il banco»; non eseguita dopo il passaggio alla bacheca: serve la build), bersagli: `[data-f3="apri-banco"]` (tasto
nell'Hud, assente al livello 1), `[data-f3="banco-pronti"]` (il pallino), `[data-f3="banco"]` (il foglio), `[data-f3="banco-chiuso"]`
(la spiegazione), `[data-f3="biglietto"]` e `[data-ordine="<idx>"]` (con `data-pronto`, `data-sel`) per i biglietti, `[data-f3="ordine-attesa"]`
dentro il biglietto di un posto che riposa, `[data-f3="ordini-conta"]` (l'indicatore delle consegne); nel dettaglio `[data-dettaglio="<idx>"]`
con `[data-chiede="<chiave>"]`, `[data-f3="premio"]`, `[data-f3="consegna"]` (`data-puoi`), `[data-f3="cambia"]` (il cestino) e `[data-f3="banco-msg"]`.
Per consegnare o cambiare prima si tocca il biglietto, poi il tasto dentro `[data-dettaglio]`.
