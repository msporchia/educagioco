# Dentro la casa

**Stato: prima prova** (3 novembre 2026, su richiesta dell'utente: Melody voleva entrare in casa). La casa di scena della fattoria si tocca e
ci si entra: dentro ci sono stanze da comprare e mobili da mettere, colorare e spostare. **In casa si arreda e basta**: niente produce,
niente si vende. Codice: `dati/interni.js`, `motore/interni.js`, `scena3d/casa3d.js`, `scena3d/mobili.js`, `scena3d/trame-pure.js`,
`casa.js`, `viste/Casa.vue`, `stile-casa.css`.

## Le regole (dell'utente)

- **Si entra toccando la casa.** Il contadino va alla porta (o alla cella sua più vicina: la casa sta fuori dalla terra di partenza) ed
  entra. Si esce con «🚪 Esci», con l'indietro della barra, o camminando fuori dalla porta di casa.
- **L'armadio cambia l'aspetto.** È un mobile di serie, c'è sempre (si sposta e si colora, non si mette via): toccarlo porta il contadino
  davanti e apre il guardaroba ([guardaroba.md](guardaroba.md)). Il tocco sul contadino fermo non apre più niente; il 👕 del HUD resta.
- **Le stanze si comprano**, una attaccata all'altra, fino a **sei** (due file da tre). Prezzi in `PREZZI_STANZE`: 60, 120, 180, 260, 360
  («una cosa vera» e «una struttura» della [calibrazione](../apprendimento/calibrazione.md)).
- **Comprare conta come esperienza** (`_spendi`), come ogni spesa della fattoria; **spostare, girare, colorare, cambiare pavimento e
  pareti, mettere via e rimettere sono gratis**.
- **I mobili si colorano**: colore per materiale (stoffa, legno, vernice) e, per le stoffe, la trama (tinta unita, righe, quadri, pois,
  fiori, cuori, stelle). Una stanza ha pavimento, colore delle pareti e carta da parati.

## La pianta

Sei stanze `STANZA.w × STANZA.d` (6×5 celle) su due file, con una riga di muro di una cella fra l'una e l'altra (`origine(s)`). La 0 è in
mezzo davanti, con la porta di casa. Fra due stanze tue c'è una porta al centro del muro in comune (`portaFra`). **Le soglie** (`soglieDi`,
la cella dentro ogni porta possibile, anche verso una stanza non ancora tua) restano libere: così una stanza comprata dopo non trova la porta
murata. Il contadino cammina sulle celle libere delle stanze tue e sulle porte (`calpestabile`, lo stesso Dijkstra di fuori).

## I mobili

36 voci in `MOBILI` (soggiorno, cucina, camera, bagno, tappeti, pareti), prezzi 6–30 («una cosetta»). Tre **strati**: `pavimento` occupa
le celle; `tappeto` sta sotto i mobili ma non sopra un altro tappeto; `muro` si appende alla parete di fondo (la prima fila di celle della
stanza) e non tocca il pavimento. Tutto quello che sta per terra si gira (`rot` 0–3, larghezza e profondità si scambiano); le cose appese no.
Un mobile messo via ha `i` e `j` a null e si ritrova nel catalogo, scheda «📦 Messi via».

**Come si aggiunge un mobile**: una riga in `MOBILI` (`dati/interni.js`: id, nome, scheda, w, d, prezzo, materiale, colore di serie) e il
suo disegno in `DISEGNI` di `scena3d/mobili.js` (origine al centro dell'impronta non girata, davanti verso +z; le cose appese a
`PARETE`). `guastiDegliInterni()` controlla il resto. Un id non si rinomina né si toglie: è nel salvataggio.

## Lo stato

`stato.interni = { stanze: [id], mobili: [{ id, tipo, i, j, rot, colore, trama }], finiture: { [stanza]: { pavimento, pareti, carta } }, prossimoId }`,
senza cambiare `VERSIONE_STATO`: uno stato di prima nasce con la stanza 0 e l'armadio. `interniInForma` non lancia mai: butta le stanze e
i mobili che non esistono, mette via (non perde) un mobile che non sta più dov'era, rimette l'armadio se manca.

**Nella fattoria in comune la casa non si apre** (lo si dice): le mosse della casa non sono in `MOSSE` di `motore/registro.js`.

## La scena

`Casa3d` è una scena sua su una tela sua, come la visita a un vicino ([vicini.md](vicini.md)): la fattoria si ferma (`mondo.ferma()`) e
riparte uscendo. Riusa il contadino (`Eroe`, con un motore finto che presta solo la strada), la telecamera e gli effetti della fattoria.
La camera guarda da sud un po' oltre il contadino (`AVANTI`); **i muri orizzontali fra lei e il contadino si abbassano** (come nel
sotterraneo), il fronte di casa sempre: una stanza dietro un'altra si vede. Pavimenti e carta sono trame canvas (`trame-pure.js`, senza
three: le usa anche il foglio per i campioni). Le foto del catalogo le fa il renderer della casa (`mobile:<tipo>:<colore>:<trama>`), non
`npm run anteprime`.

**Il dito**: un tocco sul pavimento fa camminare; sull'armadio apre il guardaroba; su un altro mobile apre il suo foglio (colore, trama, ✋
sposta, ↻ gira, 📦 metti via); tenere premuto un mobile apre il suo foglio (anche l'armadio). **Il mobile in mano** (dal catalogo o da
«Sposta») è un fantasma verde o rosso che va dove si tocca o si trascina; sotto, «🛒 Compra 🪙N» (o «✓ Metti qui»), ↻ e ✖️. Un
mobile nuovo si paga solo posandolo. Il click che il dito si lascia dietro si ingoia (`zittisciIlFantasma`, [../core/il-dito.md](../core/il-dito.md)).

## Cosa non c'è ancora

- Non è vista su un telefono né giocata da un bambino: guardata con `strumenti/scatta-app.mjs` a 390 px e provata nei test unitari.
- Niente test d'integrazione (il tocco vero sulla casa, il mobile in mano col dito).
- La casa di fuori resta la stessa comprando stanze.
- Le botteghe con le persone dentro (l'idea del bar) sono il passo dopo.

## Nei test

`unita/fattoria3d-casa` (dati, stanze attaccate e prezzi, dove sta un mobile, i gesti gratis, l'armadio, lo stato rotto e di prima).
Bersagli: `[data-f3="casa-dentro"]`, `[data-f3="tela-casa"]`, `[data-f3="esci-casa"]`, `[data-f3="apri-arreda"]`, `[data-f3="apri-pianta"]`,
`[data-f3="catalogo-casa"]` con `[data-scheda-casa]` e `[data-mobile-carta]`, `[data-f3="mobile"][data-tipo]` con `[data-colore]`,
`[data-trama]`, `[data-f3="mobile-sposta|mobile-gira|mobile-via|apri-armadio"]`, `[data-f3="mano"][data-ok]` con
`[data-f3="mano-gira|mano-posa|mano-lascia"]`, `[data-f3="pianta"]` con `[data-stanza][data-tua]`, `[data-f3="compra-stanza"]`,
`[data-pavimento]`, `[data-pareti]`, `[data-carta]`. Da una prova: `window.__fattoria3d.interni` (`entra()`, `scena()`).
