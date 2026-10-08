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
  `spinta` sull'attacco dei mostri, in `dati/campagna.js`; `crescitaDi`),
  tarate sulla roba con cui ci si entra secondo la storia
  ([la-grande-storia.md](la-grande-storia.md)): scalinata 1,3/+2, torre
  1,2/+2, grotta 1,15/+2, scala sommersa 1,5/+2, botola 2,2/+2, miniera
  2,3/+2. La cripta si comincia a mani nude (`guastiDellaCampagna` lo
  pretende). A mani nude dalla grotta in giù non si
  passa nemmeno rispondendo sempre giusto: la roba si fa discesa dopo
  discesa. Le gemme di bentornato a chi aveva già finito delle discese non
  ci sono più: i salvataggi di prima si sono azzerati
  ([avventure.md](avventure.md)).
- **Chi porta la chiave lascia sempre qualcosa**: quello dell'ultimo piano
  il pezzo della riga dopo della storia, gli altri da bere. È l'unico
  bottino che arriva anche a chi va dritto alla scala.
- **Il forziere dà il pezzo della storia che manca**, poi da bere o da
  accendere; i mostri di tutti i giorni solo da bere. La roba pescata a caso
  per profondità (`pescaCosa` con `profondita`) è rimasta all'abisso
  ([la-grande-storia.md](la-grande-storia.md#chi-da-la-riga-dopo)).
- **La sosta tiene il piano, la roba sta accanto** nell'avventura e si
  scrivono insieme (`salva` in `Gioco.vue`): salendo dal portale si può andare
  dai mercanti, e riprendendo la discesa ritrova la roba com'è adesso (`leggi`
  con la roba); uscendo con la ✕ si riprende giù ([regole.md](portale-e-sosta.md#il-portale-e-luscita)).
  La sosta non ne tiene una copia.
- **Le missioni dei personaggi** stanno in ogni avventura accanto alla roba
  (`missioni`): [missioni.md](missioni.md).

## L'equilibrio, misurato

Fino alla grande storia l'equilibrio si misurava giocando la campagna in
fila col banco di prova, che faceva la spesa sopra (`misuraConLaRoba`, venti
file per eroe). Il cavaliere, discese vinte su venti, a 8 · 6 · 4 su dieci:

| | scalinata | pozzo | grotta | scala sommersa | botola | miniera |
|---|---|---|---|---|---|---|
| prima, nudi | 20·20·18 | 20·16·5 | 20·9·4 | 20·7·0 | 19·14·1 | 20·11·2 |
| con la roba pescata a caso, gira tutto | 20·20·19 | 20·17·2 | 20·16·4 | 20·15·2 | 20·13·1 | 20·12·1 |
| con la roba pescata a caso, va dritto | 20·20·19 | 19·13·0 | 18·13·2 | 20·13·1 | 19·12·0 | 19·10·0 |

Adesso la roba con cui si entra in ogni discesa è scritta (`dati/storia.js`)
e la misura la gioca riga per riga, con la roba attesa, quella di una
discesa prima e quella di due avanti: i numeri stanno in
[la-grande-storia.md](la-grande-storia.md#le-misure).

Nei test: `unita/sotterraneo-roba` (la roba fra due discese, lo svenimento,
la sosta, il portale al posto del mercante, un'avventura nuova che parte nuda,
i banchi del passo, e l'equilibrio con la roba attesa su sei semi),
`misure/sotterraneo` (la tabella della storia, venti semi per i quattro
eroi), `integrazione/sotterraneo-mercanti` (col dito: si compra, si vende, si
scende con la roba e la si ritrova).
