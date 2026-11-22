# Il tintore

L'utente, 2 novembre 2026: *«a volte la bambina non vuole dargli quell'arma perché non è carina o il colore del mantello non va bene; un NPC che
ti permette di personalizzare un oggetto pagando qualcosina, non esorbitante, tipo 20-30 diamantini; cose base tipo il colore dei vestiti»*.
Nel villaggio c'è il tintore: per `COSTO` (25) 💎 ritinge un pezzo, con una **tavolozza** di quindici colori standard (bianco, nero, grigio, marrone e i colori dell'arcobaleno: `src/grafica/persona/tinte.js`, in comune con la fattoria) (non una ruota libera). Il pezzo non
cambia: numeri, nome e rarità restano, cambia il colore.

## Cosa si ritinge, e come si ricorda

- **Quali pezzi**: arma (`mano`), scudo o seconda arma (`mancina`), armatura o veste (`corpo`), copricapo (`testa`); non i gioielli né le cure; il copricapo con cui l'eroe parte è un pezzo come gli altri ([elmo.md](elmo.md), «Quello di serie»), quindi si ritinge anche lui
  (`sipuoTingere`, `dati/tinte.js`). Addosso o nello zaino, è lo stesso.
- **Dove sta**: `roba.tinte = { [chiaveOggetto]: idTinta }` (`dati/tinte.js`: `TINTE`, `COSTO`, `rileggiTinte`). Il campo c'è solo se c'è una tinta: la `v`
  di roba non cambia e un salvataggio di prima si apre com'era. La tinta segue la **chiave del pezzo**: in tasca, rimesso addosso, ripreso resta
  quella (una seconda spada uguale non si ha mai, `possiedo`). Un pezzo venduto o perso si porta via la sua (`get roba` la pota); ricomprarlo lo
  ridà di serie.
- **Le gemme**: si scalano nel `Corredo` come al banco (`motore/tintore.js`, `tingi`); senza gemme, un id che non c'è, un pezzo che non si ha o lo
  stesso colore non pagano e non toccano niente. `togliLaTinta` riporta il colore di serie (si paga come una tintura).

## Il disegno (`scena3d/tinge3d.js`)

I materiali di `eroi3d/` e `roba3d/` stanno in cache condivisa e **non si toccano mai**: si fanno copie tinte, a loro volta in cache per
(originale, tinta), così la saldatura continua a trovare un materiale per colore. Le armi hanno il colore nei vertici (`vertexColors`): lì si
ritinge una copia della geometria. La regola (`spostaColore`): i colori cromatici vanno verso la tinta restando chiari o scuri come erano, i
grigi del metallo ne prendono un velo (45%), nero, bianco di contorno, emissivi e aloni additivi restano.

- `vestiDotazione` (`eroe3d.js`) tinge i gruppi dell'arma e dello scudo (`tingiGruppo`) e, per corpo e testa, solo ciò che `vesti`/`copri` aggiungono
  (`tingiAggiunte`: differenza fra le mesh prima e dopo). La pelle e la testa dell'eroe non si tingono mai.
- Il ritratto: `dotazioneDi(roba)` legge `roba.tinte` e dà `d.tinte = { destra, sinistra, corpo, testa }` per **posto**. La chiave `eroe:…` ha in coda
  `:@<destra>.<sinistra>.<corpo>.<testa>` (`-` dove non c'è), solo se c'è una tinta; `leggiChiave` la rilegge. Le foto fatte (`anteprime-fatte.js`) non
  hanno tinta: una chiave tinta va al servizio a runtime. `Armato` prende `tinte` (per chiave di pezzo); Eroi, Personaggio, PaginaEroe, Zaino/Addosso
  e la fila dei turni (`viste/campo.js`) lo passano. Firma di `equipa` in `eroe3d.js`: include le tinte, e l'eroe in scena si rifà.
- Limite: un materiale animato di un copricapo (la gemma che pulsa) tinto perde il battito, perché la copia non è quella che l'animazione tocca.
  Le anteprime delle singole cose (`arma:`, `armatura:` …) nelle caselle dello zaino restano di serie.

## Il tintore nel mondo

`persona` del villaggio (`VILLAGGIO.lotti`, `PERSONE_NUOVE`), come il capitano: `PERSONAGGI_DI_SOPRA.tintore` (`dati/missioni.js`), dialoghi in
`dati/dialoghi.js` (`bottega: 'Vorrei cambiare colore a un pezzo'`), modello 3D `tintore` in `poc/persone-3d/persone.js` (promosso con
`npm run promuovi3d`), altezza in `dati/altezze.js`. La firma del mondo è cambiata (un lotto in più): la vecchia (`a318930d`) resta in
`firmeCompatibili`, nebbia e posto salvati restano buoni. La scelta «bottega» dice `bottega` a `Gioco.vue`, che per `tintore` apre il foglio
`viste/Tintore.vue` (`apriTintore`, `tingiSopra`) invece di un banco; la logica è in `motore/tintore.js`.

Il foglio sta sopra l'interfaccia unica ([../core/personalizza.md](../core/personalizza.md)), tema del sotterraneo: schede per posto (Armi;
Difese, cioè scudi e armature; Copricapi), le voci sono i pezzi (addosso, poi lo zaino) con una forma sola, i colori sono la tavolozza a
quindici. Un colore si prova sull'eroe grande (il pezzo addosso, anche se è nello zaino; si gira a scatti), e «Acquista e indossa · 25 💎» lo
paga (ogni tinta nuova si paga, ogni volta: il colore che ha già è acceso e gratis). Le foto dei gettoni sono l'eroe col pezzo e la tinta in
prova (`Armato`, chiavi `:@<tinte>` e `:r<n>`). La ✕ in alto a destra.

Nei test: `[data-tintore]` (`data-gemme`), `[data-pezzo="<chiave>"]` (`data-tinto`), `[data-tinta="<id>"]`, `[data-prs-scheda="armi|difese|copricapi"]`,
`[data-prs="paga"]`, `[data-personaggio="tintore"]`; `unita/sotterraneo-tintore`, `integrazione/sotterraneo-bottega`.

## Cosa resta

- Il colore delle caselle dello zaino e delle anteprime delle singole cose (oggi di serie).
- Il tintore non ha frasi sue per `novita` né segni di missione.
