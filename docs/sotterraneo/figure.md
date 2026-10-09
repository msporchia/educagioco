# Le figure della roba

I tre fogli dipinti del sotterraneo (`bottino-e-arredo.png`, `scudi.png`,
`armature-e-vesti.png` in `strumenti/sprite/sorgenti/sotterraneo/generati/`)
contengono **244 figure da indossare**: 36 spade e pugnali, 12 asce e aste,
11 archi e balestre, 57 bacchette, bastoni e scettri, 39 armature e vesti,
53 scudi, 36 amuleti e anelli. Il gioco ne ritaglia una cinquantina. Le
altre aspettano un pezzo che le chiami. Prima di chiederne di nuove a un
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

Le descrizioni sono un dato scritto a mano (da agenti, il 9/10/2026): non si
rigenerano, si correggono. **Quali figure sono in gioco non sta nel
catalogo**: lo dicono i foglietti, e `roba.py` lo ricava ogni volta. Una
copia scritta a mano diventerebbe vecchia senza che nessuno se ne accorga.

```bash
python3 strumenti/sprite/roba.py                          # tutte, in tmp/roba/catalogo.png
python3 strumenti/sprite/roba.py veste --stile mago       # una categoria, filtrata
python3 strumenti/sprite/roba.py bastone --elemento fuoco --libere
python3 strumenti/sprite/roba.py --foglietto bastone-08   # la riga da incollare nel foglietto
```

Nel provino le figure in gioco hanno il bordo verde e il nome dello sprite;
le altre mostrano elemento e stile.

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

Nei test: `unita/sotterraneo` («le cose»: ogni sprite nominato è
nell'atlante, ogni pezzo col nome ha la sua figura).
