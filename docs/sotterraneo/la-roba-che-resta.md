# La roba che resta

Fino al 7 ottobre 2026 fra una discesa e l'altra si ripartiva nudi. Adesso
quello che si trova e si compra resta, e il mercante è salito sulla terra di
sopra. La roba è di un'avventura, una per eroe ([avventure.md](avventure.md)).
 Qui le regole della roba che resta e la misura che le tiene in
equilibrio; i mercanti stanno in [roba.md](roba.md#i-mercanti-di-sopra) e
[terra-di-sopra.md](terra-di-sopra.md#i-mercanti), lo svenimento in
[regole.md](regole.md#svenire-e-il-fondo-degli-svenimenti).

Il codice: `motore/corredo.js` (la roba e le regole che valgono sotto e
sopra), `motore/bottega.js` (i banchi),
`dati/campagna.js` (`forza`, `spinta`, `SVENIMENTI_IN_REGALO`),
`dati/mercanti.js`, `motore/banco.js` (`allaBottega`, `misuraConLaRoba`,
`robaPer`).

## Le regole

- **Quello che si ha addosso, nelle tasche e le gemme scende e risale con
  l'avventuriero** (`Corredo` in `motore/corredo.js`, in
  `profile.campagne.sotterraneo.cfg.avventure[<eroe>].roba`): uscendo da una discesa vinta,
  persa o lasciata a metà, la discesa dopo lo ritrova. Quello lasciato per
  terra resta giù. Provato: si ripartiva nudi; l'utente l'ha voluto cambiare
  perché portarsi dietro le cose diverte di più.
- **Ogni eroe ha la sua roba**, dentro la sua avventura
  ([avventure.md](avventure.md)): un eroe nuovo comincia con lo zaino vuoto.
  Provato: una roba sola per tutti e quattro, e cambiando eroe quello che il
  nuovo non porta finiva in tasca; con la storia lunga cambiare eroe diventava
  o impossibile o strano, e l'utente ha voluto un'avventura per eroe. Quello
  che la classe non porta va in tasca scendendo (`sistemaIlCorredo`), o per
  terra se le tasche sono piene: una rete sotto, mai un caso del gioco.
- **Le gemme si spendono sopra**, dai mercanti
  ([terra-di-sopra.md](terra-di-sopra.md#i-mercanti)); nelle discese non c'è
  più nessuno che vende. Le monete non cambiano (🪙1 a risposta giusta) e la
  roba **non si vende mai in monete**, solo in gemme.
- **Le discese dopo la prima contano sulla roba** (`forza` sulle ossa e
  `spinta` sull'attacco dei mostri, in `dati/campagna.js`; `crescitaDi`):
  pozzo 1,3/+1, grotta 1,6/+2, scala sommersa 1,3/+2, botola 1,8/+2, miniera
  2,1/+2. La scalinata si comincia a mani nude e resta com'era
  (`guastiDellaCampagna` lo pretende). A mani nude dalla grotta in giù non si
  passa nemmeno rispondendo sempre giusto: la roba si fa discesa dopo
  discesa. Le gemme di bentornato a chi aveva già finito delle discese non
  ci sono più: i salvataggi di prima si sono azzerati
  ([avventure.md](avventure.md)).
- **Chi porta la chiave lascia sempre qualcosa** (prima a caso, `droppa`):
  è l'unico bottino che arriva anche a chi va dritto alla scala, e tiene
  vicina la roba di chi va dritto e di chi gira tutto.
- **Il forziere pesca per profondità** (`pescaCosa` con `profondita`, la
  stessa pesatura del banco): la scalinata non regala lo spadone che poi
  scende per sempre.
- **La sosta tiene il piano, la roba sta accanto** nell'avventura e si
  scrivono insieme (`salva` in `Gioco.vue`): usciti a metà (con la ✕ o dal
  portale) si può andare dai mercanti, e riprendendo la discesa ritrova la
  roba com'è adesso (`leggi` con la roba). La sosta non ne tiene una copia.
- **Le missioni dei personaggi** verranno ([da-fare.md](da-fare.md)): il posto
  c'è già, `missioni` in ogni avventura accanto alla roba.

## L'equilibrio, misurato

Venti file per eroe (`misure/sotterraneo`, `misuraConLaRoba`): la campagna
giocata in fila a otto su dieci, con la spesa sopra fra una discesa e l'altra,
e prima di ogni discesa una copia giocata a otto, sei e quattro su dieci con
lo zaino di quel momento. Due file: chi gira tutto (lo zaino più pieno) e chi
va dritto alla scala. Il cavaliere, discese vinte su venti:

| | scalinata | pozzo | grotta | scala sommersa | botola | miniera |
|---|---|---|---|---|---|---|
| prima, nudi, a 8/10 | 20 | 20 | 20 | 20 | 19 | 20 |
| prima, nudi, a 6/10 | 20 | 16 | 9 | 7 | 14 | 11 |
| prima, nudi, a 4/10 | 18 | 5 | 4 | 0 | 1 | 2 |
| con la roba che resta e i numeri di prima, gira tutto, a 4/10 | 20 | 13 | 19 | 19 | 20 | 18 |
| con la seconda fonte, gira tutto, a 8 · 6 · 4 | 20·20·20 | 20·16·4 | 20·13·3 | 20·14·1 | 19·12·0 | 19·8·0 |
| adesso (una fonte e il portale), gira tutto, a 8 · 6 · 4 | 20·20·19 | 20·17·2 | 20·16·4 | 20·15·2 | 20·13·1 | 20·12·1 |
| adesso, va dritto, a 8 · 6 · 4 | 20·20·19 | 19·13·0 | 18·13·2 | 20·13·1 | 19·12·0 | 19·10·0 |

A otto si arriva in fondo quasi sempre, a sei circa metà, a quattro quasi mai
anche con lo zaino pieno — tranne la scalinata, che perdona. Togliere la
seconda fonte per il portale non ha spostato niente oltre il rumore fra due
giri. Il mago, che
regge meno, a otto su dieci va dritto in fondo 16–19 volte su 20; elfa e nano
sono più comodi, come prima.

Nei test: `unita/sotterraneo-roba` (la roba fra due discese, lo svenimento,
la sosta, il portale al posto del mercante, un'avventura nuova che parte nuda,
i banchi, e l'equilibrio su sei file),
`misure/sotterraneo` (la tabella qui sopra, venti file per il cavaliere e il
mago), `integrazione/sotterraneo-mercanti` (col dito: si compra, si vende, si
scende con la roba e la si ritrova).
