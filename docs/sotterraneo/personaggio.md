# Il personaggio: maschio o femmina

L'utente, 2 novembre 2026: *«Melody lamenta che non si può scegliere se il mago è maschio o femmina (e anche il guerriero, l'elfo, il nano…)»*.
Ogni eroe ha un sesso scelto da chi gioca, **gratis e sempre cambiabile**. La classe è la stessa: armi, numeri, abilità, discese
e roba non cambiano. Cambia chi si vede (il modello 3D) e come si chiama (Mago/Maga, Elfo/Elfa, Cavaliere/Cavaliera, Nano/Nana).

## Dove sta

- **Nel salvataggio**: `cfg.avventure[<eroe>].sesso`, `'m'` o `'f'`, un campo dell'avventura come la roba (mai nella chiave dell'eroe:
  quella è degli id dei salvataggi). Senza il campo vale `SESSO_DI_SERIE` (`dati/eroi.js`: l'elfa femmina, gli altri maschi, come prima della
  scelta): chi non ha mai scelto ritrova il suo eroe com'era. Un valore storto torna a quello di serie (`sessoValido`).
- **Nei dati**: `VARIANTI[eroe][m|f] = { sprite, nome, chi }` e `eroeDi(chiave, sesso)`, che dà la scheda con la variante e gli stessi numeri;
  senza sesso torna la scheda di serie, quindi tutti i chiamanti di prima restano come erano. Il `Corredo` e la `Corsa` prendono `sesso`.
- **Il modello è `io.sprite`**: otto modelli in `scena3d/eroi3d/eroi.js` (da `poc/eroi-3d/eroi.js`, `npm run promuovi3d`). Le pose, i gesti
  e il rimbalzo sono della **classe** (`CLASSE`, `userData.classe`): la cavaliera impugna come il cavaliere, la maga alza lo scettro come il mago.
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

## L'editor (`viste/Personaggio.vue`)

Un foglio coi due modelli uno accanto all'altro, vestiti con la roba che l'eroe ha addosso; toccarne uno lo sceglie subito (si scrive
`sesso` nell'avventura, nessuna conferma). Si apre:
- dalla ✎ sulla scheda di ogni eroe nella scelta delle avventure (`[data-personaggio-di="<eroe>"]`);
- da «Come è il mago» in fondo alla pagina dell'eroe, sopra (`[data-azione="personaggio"]`);
- da solo, la prima volta che si sceglie un'avventura mai cominciata (il bottone dice «Si parte»), già scelto come la persona del profilo
  (`aspettoDi()`, la stessa della contadina nella fattoria: bambina → femmina, bimbo → maschio); si può cambiare subito.

Nei test: `[data-editor-personaggio]`, `[data-pelle="<id>"]` e `[data-capelli="<id>"]` (le tavolozze), `[data-sesso="m|f"]`, `[data-azione="chiudi-personaggio"]`; `unita/sotterraneo-personaggio`.

## Cosa resta

- Altre scelte nello stesso foglio (il taglio dei capelli, la barba) si aggiungono qui, sempre in `cfg.avventure[eroe]`; il taglio vorrebbe un modello per ognuno.
- Le frasi di chi parla all'eroe usano il nome della variante (`conNome` in `Gioco.vue`); i testi scritti a mano che dicono «il mago» o «l'elfa»
  (pensieri, missioni, `dice` della scheda) restano al maschile/di serie: si rifanno quando serve, con `chi` della variante.
