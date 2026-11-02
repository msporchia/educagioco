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

## L'editor (`viste/Personaggio.vue`)

Un foglio coi due modelli uno accanto all'altro, vestiti con la roba che l'eroe ha addosso; toccarne uno lo sceglie subito (si scrive
`sesso` nell'avventura, nessuna conferma). Si apre:
- dalla ✎ sulla scheda di ogni eroe nella scelta delle avventure (`[data-personaggio-di="<eroe>"]`);
- da «Come è il mago» in fondo alla pagina dell'eroe, sopra (`[data-azione="personaggio"]`);
- da solo, la prima volta che si sceglie un'avventura mai cominciata (il bottone dice «Si parte»), già scelto come la persona del profilo
  (`aspettoDi()`, la stessa della contadina nella fattoria: bambina → femmina, bimbo → maschio); si può cambiare subito.

Nei test: `[data-editor-personaggio]`, `[data-sesso="m|f"]`, `[data-azione="chiudi-personaggio"]`; `unita/sotterraneo-personaggio`.

## Cosa resta

- Altre scelte nello stesso foglio (capelli, pelle) si aggiungono qui, sempre in `cfg.avventure[eroe]`.
- Le frasi di chi parla all'eroe usano il nome della variante (`conNome` in `Gioco.vue`); i testi scritti a mano che dicono «il mago» o «l'elfa»
  (pensieri, missioni, `dice` della scheda) restano al maschile/di serie: si rifanno quando serve, con `chi` della variante.
