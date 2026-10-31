# Le figure della roba

I tre fogli dipinti del sotterraneo (`bottino-e-arredo.png`, `scudi.png`,
`armature-e-vesti.png` in `strumenti/sprite/sorgenti/sotterraneo/generati/`)
contengono **238 figure da indossare**: 36 spade e pugnali, 10 asce e aste,
7 archi e balestre, 57 bacchette, bastoni e scettri, 39 armature e vesti,
53 scudi, 36 amuleti e anelli. **Sono tutte in gioco**: le basi, i pezzi
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

**Le figure disegnate in diagonale si girano nel foglietto** (`"ruota": 35` nella figura di `roba.json`, i gradi misurati sull'asse; `atlante.py`
gira il pezzo grande e poi lo riduce, `ruota_in`): dieci bastoni e bacchette (`bastone-14` e `49`…`57`) sono diventati aspetti di «Bastone magico»
e «Bacchetta», e `bastone-46` (uno scettro già dritto) di «Scettro». Quelle dei fogli degli scudi sono disegnate più piccole delle altre, e `"misura"`
le porta alla stessa altezza. **La balestra (`arco-07`) non è una balestra:** è un arco con un dardo in diagonale, e gira a fatica. Nel foglietto è girata di 90° (`ruota`) e
ridotta a 12×10 perché in mano, orizzontale e bassa, almeno si legga come un'arma da tiro; resta l'unico aspetto del terzo gradino degli archi e
**va rifatta** (`generati/PROMPT-armi.md`: il fusto in verticale e l'arco in croce in cima). Gli archi hanno una `misura` che li mette in
proporzione all'eroe (corti 17 pixel, lunghi 24: `unita/sotterraneo-impugna`). **Sono state tolte dal catalogo sei figure**, e il PNG non si tocca: le balestre `arco-08`, `09` e `10` (anche girate
restano un anello con una corda: non si leggono come balestre a quella misura), l'arco con la lama (`arco-11`), la frusta a catena (`ascia-10`) e la
mazza (`ascia-12`, che nel gioco è l'arma di Grumo e non si trova): nessun pezzo ha la loro forma.

Pesano nell'atlante: con gli aspetti passa da 244 a 316 KB di PNG. Si vedono per terra e in pugno ai mostri delle varianti;
nello zaino e nelle botteghe c'è la foto del modello 3D ([anteprime-3d.md](anteprime-3d.md)), e il pezzo nitido non c'è più.

## I pezzi col nome hanno la loro figura

Gli undici leggendari e i sette pezzi dei mostri grossi (`UNICI` in
`dati/pezzi.js`) hanno **la figura chiamata come loro** nell'atlante
(`zanna-del-drago`, `mazza-di-grumo`). `componi` in `dati/cose.js` la mette
al posto di quella della base. Un pezzo col nome che avesse il disegno della
sua base sarebbe una spada qualunque con un nome importante. Un pezzo col
nome nuovo vuole la sua riga in un foglietto, e `guastiDelleCose` si accorge
se manca.

**I pezzi dei sei grossi dei dungeon nuovi** ([dungeon-che-si-rigenerano.md](dungeon-che-si-rigenerano.md)) hanno la loro dal
22 ottobre: la figura che vestivano come aspetto è ritagliata col loro nome (il blocco `__pezzi-col-nome` dei foglietti) e ha perso il
`pezzo` nel catalogo, così nessun pezzo trovato la porta più. Le chiavi restano quelle di prima dei nomi (sono salvataggi):

| pezzo | chiave (sprite) | figura | perché |
|---|---|---|---|
| Scudo di Roccaverde | `scudo-di-barbamuschio` | `scudo-08` | il campo verde del bosco sacro: muschio, natura |
| Medaglione di Piumanera | `medaglione-di-piumanera` | `amuleto-21` | il pendente con le punte e la gemma nera: il corvo, l'ombra |
| Giubba di Sibilla | `giubba-di-sibilla` | `veste-08` | la giubba verde di cuoio (una giubba, non una veste da mago) |
| Scudo di Vulcanor | `scudo-di-brontolava` | `scudo-53` | il tondo scuro con la fiamma, il più prezioso del fuoco |
| Amuleto di Gelomagno | `amuleto-di-brinaldo` | `amuleto-28` | il cristallo azzurro stretto dagli artigli: il ghiaccio |
| Scudo di Falcenera | `scudo-di-falcenera` | `scudo-38` | il teschio sul blu notte: la morte |

`figura` in `UNICI` (`componi`, `guastiDelleCose`) resta per un pezzo col nome nuovo che non ha ancora la sua. Il panciotto ha ora due
aspetti soli (il gelo e il fuoco). **Una `misura` scritta solo nel foglietto si perde** al `--gioco` dopo: sta nella figura di
`roba.json` (gli archi `arco-02`, `04`, `05` ce l'avevano solo nel foglietto).

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
