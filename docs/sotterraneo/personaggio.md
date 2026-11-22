# Il personaggio: maschio o femmina

L'utente, 2 novembre 2026: una bambina lamenta che non si può scegliere se il mago è maschio o femmina (e anche il guerriero, l'elfo, il nano…).
Ogni eroe ha un sesso scelto da chi gioca, **gratis e sempre cambiabile**. La classe è la stessa: armi, numeri, abilità, discese
e roba non cambiano. Cambia chi si vede (il modello 3D) e come si chiama (Mago/Maga, Elfo/Elfa, Cavaliere/Guerriera, Nano/Nana).

## Dove sta

- **Nel salvataggio**: `cfg.avventure[<eroe>].sesso`, `'m'` o `'f'`, un campo dell'avventura come la roba (mai nella chiave dell'eroe:
  quella è degli id dei salvataggi). Senza il campo (`null`) vale il sesso della persona del profilo (vedi sotto); `SESSO_DI_SERIE` (`dati/eroi.js`: l'elfa femmina, gli
  altri maschi) è il modello di sempre, quello di `eroeDi(chiave)` senza sesso. Un valore storto vale `null`.
- **Nei dati**: `VARIANTI[eroe][m|f] = { sprite, nome, chi }` e `eroeDi(chiave, sesso)`, che dà la scheda con la variante e gli stessi numeri;
  senza sesso torna la scheda di serie, quindi tutti i chiamanti di prima restano come erano. Il `Corredo` e la `Corsa` prendono `sesso`.
- **Il modello è `io.sprite`**: otto modelli in `scena3d/eroi3d/eroi.js` (da `poc/eroi-3d/eroi.js`, `npm run promuovi3d`). Le pose, i gesti
  e il rimbalzo sono della **classe** (`CLASSE`, `userData.classe`): la guerriera (modello `cavaliera`, nome a schermo scelto dall'utente: «cavaliera non si può sentire») impugna come il cavaliere, la maga alza lo scettro come il mago.
  Faccia, corpo, capelli e colori sono del modello (`STILI`). Ogni modello ha `copricapo` e `capelli` perché `copri()` nasconda quelli di serie.
- **L'anteprima** (`chiaveDellEroe`) ha il modello nella chiave: `eroe:maga:…`. Le foto dell'eroe si fanno a runtime sul telefono; le armature
  sui modelli e le altre si fotografano coi quattro nuovi (`npm run anteprime sotterraneo`, `unita/sotterraneo-anteprime-fatte`).

## Pelle e capelli, in comune con la fattoria

I toni stanno in `src/grafica/persona/aspetto.js` (dato puro, `unita/aspetto-persona`): `PELLI` (cinque) e `COLORI_CAPELLI` (naturali e di
fantasia), gli stessi id del guardaroba del contadino ([../fattoria3d/guardaroba.md](../fattoria3d/guardaroba.md)). Una miglioria lì (un tono in più, un
colore più bello) arriva in entrambi; il prezzo dei colori di fantasia resta di chi li usa (qui sono gratis). Il prototipo degli eroi
(`poc/eroi-3d/eroi.js`) non importa niente: `creaEroe(chiave, { pelle, capelli })` vuole numeri 0xRRGGBB.
- **Salvataggio**: `cfg.avventure[eroe].aspetto = { pelle, capelli }` (id o `null`: il colore di serie del modello; un id storto vale `null`).
- **Come viaggia**: dentro la chiave del modello, `io.sprite` = `maga~ambra.rossi` (`-` per il campo non scelto): così la corsa, il mondo di sopra,
  la fila dei turni e le chiavi delle anteprime (`eroe:maga~ambra.rossi:…`) lo portano senza un campo in più. `daSprite()` (`dati/eroi.js`) lo apre
  in modello e colori; chi disegna (`eroe3d.js`, `anteprime3d.js`) passa da lì. Le foto delle armature addosso agli eroi, fatte col colore di serie, per
  un eroe colorato si disegnano al momento.
- **Il disegno**: la pelle colora la testa, le orecchie, le mani e il naso (un po' più scuro) e la faccia sulla tela; il colore dei capelli i capelli,
  la barba e le trecce (con la loro ombra) e le sopracciglia. Le facce si ricordano per modello, pelle e capelli.

### Taglio di capelli e barba

Anche i tagli (`TAGLI`: corti, lunghi, coda, trecce, caschetto, ricci, calvo) e le barbe (`BARBE`: nessuna, corta, folta, lunga, baffi, pizzetto) hanno gli id in
`aspetto.js` e il disegno in `src/grafica/persona/capelli3d.js` (three, in comune): `applicaAspetto(g, { taglio, barba, colore })` monta il
taglio su qualunque testa tonda (`userData.testa, R, cy`) e nasconde i capelli e la barba di serie del modello (`userData.crini`, `barbe`, segnati
nel prototipo). Un campo non scelto lascia quello di serie; `calvo` e `nessuna` sono scelte vere. I capelli corti e simili stanno nel gruppo che sparisce
sotto un elmo (`userData.capelli`), le code e le trecce restano fuori. La chiave è `modello~pelle.capelli.taglio.barba` (`-` per il non scelto,
i campi in coda non scelti si tolgono); `scena3d/eroe-aspetto.js` (`creaEroeDa`) la apre e costruisce il modello per l'eroe in scena e le anteprime.
Il contadino della fattoria può usare lo stesso `applicaAspetto` dando le sue misure della testa.

### Il copricapo di serie

Il cappello a punta della maga, l'elmo del cavaliere e gli altri non sono più parte del modello e basta: sono un pezzo vero che l'eroe ha
addosso dal primo giorno, si toglie e si ritinge ([elmo.md](elmo.md), «Quello di serie»). Con la testa nuda restano a vista i capelli, il taglio
e la barba scelti qui sopra.

## L'editor (`viste/Personaggio.vue`)

Sopra l'interfaccia unica ([../core/personalizza.md](../core/personalizza.md)), col tema del sotterraneo: in alto l'eroe grande
vestito con la sua roba (si gira a scatti di 45° con le frecce e col dito: `giro` nella chiave dell'anteprima), sotto tre schede.

- **Chi sei**: le due varianti, coi loro nomi. **A schermo mai la parola «sesso»** (né «maschio/femmina»: è un gioco per bambini);
  `sesso`, `SESSI` e `m`/`f` sono chiavi interne.
- **Aspetto**: nella griglia Pelle, Capelli, Barba; nel pannello sotto, in ordine di dipendenza, il taglio (la forma dei capelli) e poi il
  colore, o la barba, o il tono della pelle. «Di serie» (`-`, nel salvataggio `null`) rimette quello del modello: il tocco che toglieva non c'è più.
- **Set**: sei posti per i set salvati di questo eroe (sesso e aspetto insieme), un tocco per rimetterli.

Tutto è gratis: ogni scelta si scrive subito nell'avventura, nessuna conferma. Le foto dei gettoni sono l'eroe disegnato adesso con quella
scelta (`Armato`: il busto per l'aspetto, la figura per chi sei e per i set): nessuna foto fatta prima, nessuna icona.
`viste/personaggio-valori.js` va dal sesso e dall'aspetto ai valori dei posti dell'interfaccia (`chi`, `pelle`, `capelli`, `barba`) e ritorno.

Si apre:
- dalla ✎ sulla scheda di ogni eroe nella scelta delle avventure (`[data-personaggio-di="<eroe>"]`);
- da «✎ Aspetto» in fondo alla pagina dell'eroe (anche durante una discesa: la corsa aggiorna la sua scheda e il cambio si vede subito), sulla riga di «Cambia eroe» (che c'è solo sopra) (`[data-azione="personaggio"]`; una riga a sé rubava spazio alla lista delle caratteristiche).
Si chiude solo con la ✕ in alto a destra (il «Fatto» in fondo non c'è più).

**Nessun passo in più**: scegliere un eroe non apre l'editor. Finché non si sceglie niente il sesso è quello della persona del profilo
(`aspettoDi()`, la stessa della contadina nella fattoria: bambina → femmina, bimbo → maschio, `sessoDi` in `Gioco.vue`); l'avventura non ha il
campo (`avventuraDi` dà `null`). Toccando un modello nell'editor il sesso si scrive e vale da lì.

### I set salvati

`cfg.avventure[eroe].vestiti = [{ posto: 0..5, nome, sesso, aspetto }]` (`vestitiValidi` in `motore/avventure.js`: un posto fuori misura,
doppio o senza nome si butta, il nome si accorcia a sedici lettere). Sono di quell'eroe: il mago non vede i set dell'elfa. Si salva quello
che l'eroe ha adesso; rimettere un set scrive il sesso e l'aspetto suoi.

Nei test: `[data-editor-personaggio]` (con `data-eroe-editor` e `data-sesso-scelto`), le schede `[data-prs-scheda="chi|aspetto|set"]`, le voci
`[data-prs-voce="pelle|capelli|barba"]`, le scelte `[data-sesso="m|f"]`, `[data-pelle="<id>|-"]`, `[data-capelli="<id>|-"]`,
`[data-taglio="<id>|-"]`, `[data-barba="<id>|-"]`, i set `[data-prs-set-mio="<n>"]` e gli altri bersagli del componente; `unita/sotterraneo-personaggio`
e `integrazione/sotterraneo-sopra-eroe`.

## Cosa resta

- Altre scelte nello stesso foglio si aggiungono qui, sempre in `cfg.avventure[eroe]` (altre acconciature, un cappello, le sopracciglia).
- Le frasi di chi parla all'eroe usano il nome della variante (`conNome` in `Gioco.vue`); i testi scritti a mano che dicono «il mago» o «l'elfa»
  (pensieri, missioni, `dice` della scheda) restano al maschile/di serie: si rifanno quando serve, con `chi` della variante.
