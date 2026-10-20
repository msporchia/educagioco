# Merci e ricette della fattoria 3D

Le merci della fattoria 3D (raccolti, prodotti delle macchine, uova e latte) **sono quelle della fattoria di sempre**:
stesso nome, stessa faccia, stessi ingredienti. Prima la 3D aveva inventato le sue (popcorn, pane integrale, gelato alla
lavanda…) e le disegnava con le emoji; la 2D ha una catena curata ([../fattoria/catena.md](../fattoria/catena.md),
[macchine.md](../fattoria/macchine.md)) e un atlante di sprite. Qui le regole che le tengono allineate.

## Una faccia per ogni merce

- **Ogni merce dichiara il suo `pezzo` dell'atlante** nei dati 3D (`dati/colture.js`, `dati/ricette.js`, `PRODOTTI_ANIMALI`
  in `dati/animali.js`), e dove l'id coincide con uno di `PRODOTTI` (2D, `dati/coltivazioni.js`) è **lo stesso pezzo**. Un test
  (`unita/fattoria3d-merci`) lo confronta con la 2D: nome e faccia di una merce comune non possono scostarsi.
- **`viste/Faccia.vue`** disegna la merce (`k` = la chiave 3D) con `Provino.vue` della 2D, che non si tocca: la 3D importa la
  vista e i dati dell'atlante, non mezza fattoria. L'**emoji è il ripiego dichiarato**: una merce senza `pezzo` ha `aspetta`
  (il pezzo che un foglio futuro porterà), come in 2D ([../fattoria/sprite.md](../fattoria/sprite.md)). Oggi solo la parmigiana.
- **Dove si vede**: scorte e prodotti del HUD, i dischi del banco, ingredienti, ricette, forno e pronti di ogni macchina, la scelta
  del seme, i fogli dei livelli, la cassa e il mercato dei vicini, il volo «+1» sopra la scena. Restano emoji i **testi**
  (messaggi, fumetti, il badge «🍞 2 pronti!» sopra una macchina): una riga non è un disegno.
- **Le emoji di ripiego sono tutte diverse** fra loro (`guastiDelleRicette`): in una riga di testo «manca 🌾 2» deve dire una cosa sola.

## Le ricette sono quelle della 2D

- **Stesso id, stessi ingredienti, stesse quantità (N → 1)** quando la macchina esiste nelle due fattorie. I **tempi** sono
  in scala 3D: i minuti della 2D diventano secondi (`minuti × 1000` ms). I **livelli** non si scrivono a mano: `liv` di una
  ricetta è il più tardo fra la sua macchina e i suoi ingredienti, e `guastiDeiLivelli` lo controlla.
- **Ogni macchina della 3D ha la sua sorella in 2D** (mulino, panificio, caseificio, gelateria; e il pastificio e la cucina, che qui
  hanno ancora gli id dei salvataggi `pasticceria` e `conserviera`): si chiamano come in 2D, e **nessuna è inventata**. Il perché:
  una «Pasticceria» che fa la pasta era una bugia, e rinominare un id vuol dire migrare ogni salvataggio e ogni modello per un
  nome che il bambino non legge. Restano da ridisegnare i due modelli 3D ([da-fare.md](da-fare.md)).
- **Dove la 2D ha una macchina in più, non si porta** (telaio, sartoria, tintoria, zuccherificio, friggitoria, sushi bar,
  pentolone, fienile e i recinti oltre pollaio e stalla): è in [da-fare.md](da-fare.md).
- **Adattamenti** (unici scarti dalla 2D, quando manca una coltura che la 3D non ha: cavolfiori, peperoni, aglio, barbabietola):

| ricetta | 2D | 3D | scarto |
|---|---|---|---|
| salsa | pomodori 2, cipolle 1, aglio 1 | pomodoro 2, cipolla 1 | senza aglio |
| minestrone | patate, carote, cavolfiori | patata, carota, zucca | la zucca per il cavolfiore |
| gelato | latte 2, zucchero 1 | latte 2, fragola 1 | la fragola per lo zucchero |

## La mappa

| macchina (id) | livello | ricette (ingredienti) |
|---|---|---|
| Mulino (`mulino`) | 3 | farina (grano 2), pastone (mais 3) |
| Pastificio (`pasticceria`) | 6 | pasta (farina 2, uova 1), pizza (farina, salsa, formaggio), lasagne (pasta, salsa, formaggio) |
| Panificio (`panificio`) | 7 | pane (farina 2), torta (farina 2, uova, burro), crostata (farina, fragola, burro) |
| Caseificio (`caseificio`) | 11 | burro (latte 1), formaggio (latte 2) |
| Cucina (`conserviera`) | 12 | salsa, polenta (mais 2, formaggio), minestrone, parmigiana (melanzana 2, salsa, formaggio) |
| Gelateria (`gelateria`) | 14 | frullato (fragola 2, latte), gelato |

Per far stare le ricette al loro livello il pollaio scende al 5 e il pastificio sale al 6 (la pasta vuole le uova): i prezzi
e le soglie non cambiano di sensibile (`npm run tara:fattoria3d`).

## Le colture

Gli id restano quelli di prima (`carota`, `patata`…, singolari): sono le chiavi dei salvataggi e dei modelli di
`scena3d/modelli-colture.js`; il legame con la 2D è il `pezzo` (`raccolto_carote`…) e il test. **Tempi e livelli non seguono la
2D**: la taratura vuole che una coltura che arriva dopo non maturi prima (`guastiDellaScala`), e la 2D ha un altro ordine.
La lavanda e la zucca hanno una sola uscita (il banco, i vicini): il resto della loro catena è in 2D (tintoria, pentolone).

## I vecchi salvataggi (stato v7)

`normalizza` traduce gli id di una fattoria già giocata (`MERCI_VECCHIE` in `motore/stato.js`): ogni vecchio prodotto diventa il
suo cugino di mestiere, **un pezzo per un pezzo** (popcorn → pastone, tre torte → torta, i gelati → gelato…). Vale per le scorte,
le code e i pronti delle macchine, gli ordini aperti e lo stato dei vicini (cassa, mercato). Niente si perde; una coda che
cambia macchina (il pane che era della pasticceria) torna nella sua.

## Nei test

`[data-merce="<id>"]` è la faccia di una merce (HUD, banco, macchina, cassa…); `unita/fattoria3d-merci` tiene ferme facce e ricette.
