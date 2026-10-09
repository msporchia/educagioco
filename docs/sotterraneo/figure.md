# Le figure della roba

I tre fogli dipinti del sotterraneo (`bottino-e-arredo.png`, `scudi.png`,
`armature-e-vesti.png` in `strumenti/sprite/sorgenti/sotterraneo/generati/`)
contengono **244 figure da indossare**: 36 spade e pugnali, 12 asce e aste,
11 archi e balestre, 57 bacchette, bastoni e scettri, 39 armature e vesti,
53 scudi, 36 amuleti e anelli. **Ne sono in gioco 227**: le basi, i pezzi
col nome e gli aspetti dei pezzi trovati. Prima di chiederne di nuove a un
generatore si guarda qui.

## Il catalogo

`generati/roba.json` ha una voce per figura: il foglio, il rettangolo sul
foglio grande e una descrizione scritta guardandola. Per ogni figura ci
sono:

- `cosa`: il tipo dell'oggetto;
- `descrizione`: una frase per riconoscerla fra trenta simili;
- `elemento`: fuoco, ghiaccio, fulmine, acqua, natura, veleno, ombra, luce,
  arcano, sangue, oro, morte o nessuno;
- `materia`, `stile` (guerriero, esploratore, mago, chiunque), `mani`,
  `pregio` (da 1 a 4) e un `nome` proposto;
- `pezzo`: la base che veste (vedi sotto);
- `buchi`, solo dove il vuoto da togliere è più grande del solito (la
  cordicella larga di un ciondolo: `strumenti/sprite/FORMATO.md`);
- `dubbi`, quando la figura è storta o non si capisce.

**La descrizione esiste perché la figura da sola non basta.** Un bastone
con un cristallo azzurro è del ghiaccio, uno con la gemma a fiamma è del
fuoco. Una veste lunga col cappuccio è da mago, una cotta di piastre da
cavaliere o da nano. Senza questa riga, chi sceglie fra sei mesi mette il
bastone del fuoco a un pezzo del gelo, o la corazza a un pezzo di stoffa
che il mago porta. La regola per chi sceglie: **la figura dice la stessa
cosa del pezzo**. L'elemento richiama l'abilità, la `materia` richiama la
famiglia (`ferro` per il cavaliere e il nano, `stoffa` per l'elfa e il mago,
cuoio per tutti: [roba.md](roba.md)).

Le descrizioni e i `pezzo` sono dati scritti a mano (le descrizioni da
agenti, il 9/10/2026): non si rigenerano, si correggono. **Quali figure sono
già ritagliate non sta nel catalogo**: lo dicono i foglietti, e `roba.py`
lo ricava ogni volta. Una copia scritta a mano diventerebbe vecchia senza
che nessuno se ne accorga.

```bash
python3 strumenti/sprite/roba.py                          # tutte, in tmp/roba/catalogo.png
python3 strumenti/sprite/roba.py veste --stile mago       # una categoria, filtrata
python3 strumenti/sprite/roba.py bastone --elemento fuoco --libere
python3 strumenti/sprite/roba.py --foglietto bastone-08   # la riga da incollare nel foglietto
python3 strumenti/sprite/roba.py --gioco                  # dopo aver toccato un `pezzo`; poi atlante.py
```

Nel provino le figure già ritagliate hanno il bordo verde e il nome dello
sprite. Le altre mostrano il loro `pezzo`, oppure «fuori».

## Gli aspetti dei pezzi trovati

**Un pezzo trovato ha la figura di uno dei suoi aspetti**, cioè una delle
figure col suo `pezzo`. Vale per i pezzi con un livello o con una rarità,
come `spada@7` o `spada@7.m.fuoco`. Il pezzo di base, quello con la chiave
di sempre, tiene la sua figura. `roba.py --gioco` scrive gli aspetti in un
blocco di ogni foglietto (fra `__aspetti` e `__aspetti-fine`, non si tocca a
mano) e la tabella `ASPETTI` in `dati/aspetti.js`. La scelta la fa
`aspettoDi` in `dati/cose.js`:

1. **il pregio della rarità** (`pregio` in `RARITA`): comune 1–2, magico
   2–3, raro 3–4. Un pezzo comune ha l'aria da bottega, uno raro quella
   preziosa;
2. **la prima abilità che richiama una figura** (`TINTE_DELLE_ABILITA` in
   `dati/pezzi.js`). La Spada fiammeggiante è una spada del fuoco, quella
   «della gazza» è d'oro;
3. **una sola, scelta dalla chiave**: lo stesso pezzo ha sempre la stessa
   figura, nello zaino, per terra e dopo un ricaricamento. Nel salvataggio
   non c'è niente di nuovo.

**Il `pezzo` segue il nome, non il colore.** Una figura veste solo una base
che si chiama come quello che si vede: le scimitarre sono «Spada», i
pugnali «Spada corta», le vesti col cappuccio «Mantello» e quelle senza
«Tunica», le piastre «Corazza», gli scudi con la croce «Scudo crociato».
Un ciondolo azzurro è un «Amuleto azzurro», uno rosso un «Amuleto rosso»;
gli altri sono «Medaglione», l'unico nome che non dice un colore. Le armi
in asta (falcioni, tridente) sono «Ascia», la cosa più vicina che c'è. Le
regole stanno nei dati: per spostare una figura si cambia il suo `pezzo` e
si rilancia `--gioco`.

**Restano fuori 17 figure, e ognuna ha il suo motivo** nel campo `dubbi`:

- le 13 disegnate in diagonale: dieci bastoni e tre balestre (la balestra
  di base resta). In mano le armi stanno dritte ([roba.md](roba.md)), e un
  giro di 45° su una figura così piccola la rovina. Sono quelle da far
  rifare;
- 4 di forma che nessun pezzo ha: la frusta, il maglio, la mazza (la porta
  solo Grumo) e l'arco con la lama.

Pesano nell'atlante: con gli aspetti passa da 244 a 316 KB di PNG, più i
pezzi nitidi (451 KB di WebP: [../core/sprite.md](../core/sprite.md)), che
sono quelli che si vedono nello zaino e in scena.

## I pezzi col nome hanno la loro figura

Gli undici leggendari e i sette pezzi dei mostri grossi (`UNICI` in
`dati/pezzi.js`) hanno **la figura chiamata come loro** nell'atlante
(`zanna-del-drago`, `mazza-di-grumo`). `componi` in `dati/cose.js` la mette
al posto di quella della base. Un pezzo col nome che avesse il disegno della
sua base sarebbe una spada qualunque con un nome importante. Un pezzo col
nome nuovo vuole la sua riga in un foglietto, e `guastiDelleCose` si accorge
se manca.

Due scelte da rifare quando ci saranno figure migliori:

- **Gli anelli dipinti sono quattro** (`amuleto-33`…`36`). L'Anello di
  Zannaverde ha preso l'unico rimasto, che è azzurro, mentre il ragno è
  verde. Un ciondolo verde sarebbe stato del colore giusto ma della forma
  sbagliata.
- **Il Pugnale dell'ombra è una spada** (`spada-07`, la lama dal dorso
  viola). Nei fogli non c'è un pugnale scuro.

Nei test: `unita/sotterraneo` («le cose»: ogni sprite, ogni aspetto e ogni
pezzo col nome è nell'atlante) e `unita/sotterraneo-rarita` (l'aspetto: la
base tiene la sua figura, la spada fiammeggiante è del fuoco, il comune da
bottega, il raro prezioso, la stessa chiave dà la stessa figura).
