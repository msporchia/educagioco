# Dentro la casa

**Stato: prima prova** (3 novembre 2026, su richiesta dell'utente: una bambina voleva entrare in casa). La casa di scena della fattoria si tocca e
ci si entra: dentro ci sono stanze da comprare e mobili da mettere, colorare e spostare. **In casa si arreda e basta**: niente produce,
niente si vende. Codice: `dati/interni.js`, `motore/interni.js`, `scena3d/casa3d.js`, `scena3d/mobili.js`, `scena3d/trame-pure.js`,
`casa.js`, `viste/Casa.vue`, `stile-casa.css`. La base comune agli interni (anche alle botteghe, [botteghe.md](botteghe.md) «Dentro») è
`scena3d/interno3d.js`.

## Le regole (dell'utente)

- **Si entra toccando la casa.** Il contadino va alla porta (o alla cella sua più vicina: la casa sta fuori dalla terra di partenza) ed
  entra. Si esce con «🚪 Esci», con l'indietro della barra, o camminando fuori dalla porta di casa.
- **L'armadio cambia l'aspetto.** È un mobile di serie, c'è sempre (si sposta, si gira e si colora, non si mette via). Un tocco apre le sue opzioni come per ogni
  mobile: «👕 Apri l'armadio» porta il contadino davanti e apre il guardaroba ([guardaroba.md](guardaroba.md)). È l'unica strada: il 👕 del HUD non c'è più.
- **Le stanze si comprano come i lotti**, in scena e senza fogli: un tocco sul cartello o sulla stanza in vendita apre la domanda del terreno
  («Compra · 🪙 N», «Non ora»). Una attaccata all'altra, fino a **sei** (due file da tre). Prezzi in `PREZZI_STANZE`: 60, 120, 180, 260, 360
  («una cosa vera» e «una struttura» della [calibrazione](../apprendimento/calibrazione.md)).
- **Pavimento e pareti costano** (`PREZZI_FINITURE`: pavimento 20, pareti 12, carta 12, «una cosetta»), e si paga solo quello che cambia. Si
  provano sulla stanza prima di pagare (🎨 Colori).
- **Comprare conta come esperienza** (`_spendi`), come ogni spesa della fattoria; **spostare, girare, colorare un mobile, mettere via e
  rimettere sono gratis**.
- **I mobili si colorano**: colore per materiale (stoffa, legno, vernice) e, per le stoffe, la trama (tinta unita, righe, quadri, pois,
  fiori, cuori, stelle). Una stanza ha pavimento, colore delle pareti e carta da parati.

## La pianta

Sei stanze `STANZA.w × STANZA.d` (6×5 celle) su due file, con una riga di muro di una cella fra l'una e l'altra (`origine(s)`). La 0 è in
mezzo davanti, con la porta di casa. Fra due stanze tue c'è una porta al centro del muro in comune (`portaFra`). **Le soglie** (`soglieDi`, la
cella dentro una porta che c'è) restano libere, e sulla porta di fondo non si appende niente. Verso una stanza non ancora tua la porta non c'è
e lì si arreda: provato tenerle libere tutte, ma sul muro laterale la soglia sta in mezzo e un mobile lungo tre non ci stava mai. Comprando la
stanza, chi sta davanti alla porta nuova si sposta nel posto libero più vicino, girato com'è se si può (`liberaLePorte`), e lo dice il
contadino; un posto c'è sempre, al peggio nella stanza nuova. Il contadino cammina sulle celle libere delle stanze tue e sulle porte
(`calpestabile`, lo stesso Dijkstra di fuori).

## I mobili

39 voci in `MOBILI` (soggiorno, cucina, camera, bagno, tappeti, pareti, con quattro finestre), prezzi 6–30 («una cosetta»). Tre **strati**: `pavimento` occupa
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

`Casa3d` estende `Interno3d` (`scena3d/interno3d.js`: renderer, luce, camera, contadino, pavimenti, muri con le porte, il dito): una scena sua su una tela sua, come la visita a un vicino ([vicini.md](vicini.md)): la fattoria si ferma (`mondo.ferma()`) e
riparte uscendo. Riusa il contadino (`Eroe`, con un motore finto che presta solo la strada), la telecamera e gli effetti della fattoria.
La camera guarda da sud un po' oltre il contadino (`AVANTI`); **i muri orizzontali fra lei e il contadino si abbassano** (come nel
sotterraneo), il fronte di casa sempre: una stanza dietro un'altra si vede. Pavimenti e carta sono trame canvas (`trame-pure.js`, senza
three: le usa anche la striscia per i campioni). Le foto del catalogo le fa il renderer della casa (`mobile:<tipo>:<colore>:<trama>`), non
`npm run anteprime`.

**Le stanze in vendita** hanno un pavimento accennato (un tratteggio sul buio) e un cartello `＋ 🪙 N` sul muro dove si aprirebbe la porta più
vicina al contadino. Si compra solo da lì, quindi un cartello fuori schermo resta sul bordo con la freccia. Sta sopra un pavimento tuo: il tocco
lo cerca prima dei mobili (`_cartelloSotto`). La domanda è il `Dialogo` della fattoria, che per questo sta fuori dal HUD; gli avvisi di casa li
dice il contadino nel suo fumetto (`fx.parla`), perché l'avviso della fattoria sta in barre che qui non ci sono.

**🎨 Colori** apre una striscia in basso per la stanza dove sta il contadino, senza foglio, così la stanza si vede: la camera ci si mette sopra
(`guardaStanza`), un colore tocca solo la scena (`provaFinitura`, nella firma di `sincronizza`) e il motore lo sente a «🛒 Compra 🪙N»; ✖️ torna
com'era e non costa.

**Il dito** ([gesti.md](gesti.md)): un tocco sul pavimento fa camminare; su una stanza in vendita o sul suo cartello chiede se comprarla; su un mobile apre il suo foglio
(colore, trama, ↻ gira, 📦 metti via; l'armadio ha anche «👕 Apri l'armadio» e non ha 📦); **tenere premuto un mobile lo sposta**: segue il dito, si posa staccandolo, dove non ci sta torna
dov'era e lo dice il contadino. **Il mobile in mano** (dal catalogo o da «Messi via») è un fantasma verde o rosso che va dove si tocca o si trascina; la riga
sopra dice perché lì non ci sta; sotto, «🛒 Compra 🪙N» (o «✓ Metti qui»), ↻ e ✖️. Un mobile nuovo si paga solo posandolo. Il click che il dito
si lascia dietro si ingoia (`zittisciIlFantasma`, [../core/il-dito.md](../core/il-dito.md)).

## Cosa non c'è ancora

- Non è vista su un telefono né giocata da un bambino: guardata a 390 px e provata col tocco simulato. Il test entra con `entra()`: il tocco
  vero sulla casa da fuori non è provato.
- La casa di fuori resta la stessa comprando stanze.
- Le finestre stanno solo sulla parete di fondo, come ogni cosa appesa, e una finestra sul muro in comune con una stanza comprata dopo continua
  a mostrare il prato.

## Nei test

`unita/fattoria3d-casa` (dati, stanze attaccate e prezzi, dove sta un mobile, le porte che ci sono e quelle nuove, i gesti gratis, le finiture
che si pagano, l'armadio, lo stato rotto e di prima); `integrazione/fattoria3d-casa` (col dito: il cartello, il divano lungo il muro, la stanza
comprata, la striscia, le finestre, il motivo del fantasma, le opzioni e il colore dell'armadio, un mobile tenuto al dito, senza monete). `node test/esegui.mjs fattoria3d-casa` li lancia tutti e due.
Bersagli: `[data-f3="casa-dentro"]`, `[data-f3="tela-casa"]`, `[data-f3="esci-casa"]`, `[data-f3="apri-arreda"]`, `[data-f3="apri-tinte"]`,
`[data-f3="catalogo-casa"]` con `[data-scheda-casa]` e `[data-mobile-carta]`, `[data-f3="mobile"][data-tipo]` con `[data-colore]`,
`[data-trama]`, `[data-f3="mobile-gira|mobile-via|apri-armadio"]`, `[data-f3="mano"][data-ok]` con
`[data-f3="mano-riga|mano-gira|mano-posa|mano-lascia"]`, `[data-f3="tinte"][data-stanza]` con `[data-parte]`, `[data-pavimento]`, `[data-pareti]`,
`[data-carta]` e `[data-f3="tinte-riga|tinte-compra|tinte-lascia"]`, `[data-f3="dialogo"]` con `[data-scelta]`.
Da una prova: `window.__fattoria3d.interni` (`entra()`, `scena()`, e di lei `badge`, `prova`, `proietta`).
