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
- **Dove si vede**: il foglio dell'inventario (il HUD non mostra più scorte), i dischi del banco, ingredienti, ricette, forno e pronti di ogni macchina, la scelta
  del seme, i fogli dei livelli, la cassa e il mercato dei vicini, il volo «+1» sopra la scena. Restano emoji i **testi**
  (messaggi, fumetti, il badge «🍞 2 pronti!» sopra una macchina): una riga non è un disegno.
- **Le emoji di ripiego sono tutte diverse** fra loro (`guastiDelleRicette`): in una riga di testo «manca 🌾 2» deve dire una cosa sola.

## Le ricette sono quelle della 2D

- **Stesso id, stessi ingredienti, stesse quantità (N → 1)** quando la macchina esiste nelle due fattorie. I **tempi** sono
  in scala 3D: i minuti della 2D diventano secondi (`minuti × 1000` ms). I **livelli** non si scrivono a mano: `liv` di una
  ricetta è il più tardo fra la sua macchina e i suoi ingredienti, e `guastiDeiLivelli` lo controlla.
- **Ogni macchina della 3D ha la sua sorella in 2D** (mulino, panificio, caseificio, gelateria, telaio, zuccherificio, sartoria, tintoria; e il pastificio e la cucina, che qui
  hanno ancora gli id dei salvataggi `pasticceria` e `conserviera`): si chiamano come in 2D, e **nessuna è inventata**. Il perché:
  una «Pasticceria» che fa la pasta era una bugia, e rinominare un id vuol dire migrare ogni salvataggio e ogni modello per un
  nome che il bambino non legge. Restano da ridisegnare i due modelli 3D ([da-fare.md](da-fare.md)).
- **Dove la 2D ha una macchina in più, non si porta** (friggitoria, sushi bar, pentolone, fienile e i recinti oltre pollaio e
  stalla): è in [da-fare.md](da-fare.md).
- **Nessuna ricetta è adattata**: le colture che mancavano (cavolfiore, aglio…) sono arrivate e salsa (con l'aglio) e minestrone
  (col cavolfiore) sono tornate quelle della 2D; il test non ha più eccezioni.

## La mappa

| macchina (id) | livello | ricette (ingredienti) |
|---|---|---|
| Mulino (`mulino`) | 3 | farina (grano 2), pastone (mais 3) |
| Pastificio (`pasticceria`) | 6 | pasta (farina 2, uova 1), biscotti (farina, burro, zucchero), pizza (farina, salsa, formaggio), lasagne (pasta, salsa, formaggio) |
| Panificio (`panificio`) | 7 | pane (farina 2), torta (farina 2, uova, burro), crostata (farina, fragola, burro) |
| Caseificio (`caseificio`) | 11 | burro (latte 1), formaggio (latte 2) |
| Cucina (`conserviera`) | 12 | salsa (pomodoro 2, cipolla, aglio), polenta (mais 2, formaggio), minestrone (patata, carota, cavolfiore), conserva d'orto (melanzana, peperone, zucca), parmigiana (melanzana 2, salsa, formaggio) |
| Gelateria (`gelateria`) | 14 | succo (carota, barbabietola), frullato (fragola 2, latte), gelato (latte 2, zucchero) |
| Telaio (`telaio`) | 8 | stoffa (lana 2) |
| Zuccherificio (`zuccherificio`) | 13 | zucchero (barbabietola 2), marmellata (fragola 2, zucchero) |
| Sartoria (`sartoria`) | 15 | maglione (stoffa 2), sciarpa di lana (stoffa, lana), berretto (stoffa) |
| Tintoria (`tintoria`) | 16 | tintura (lavanda 2), sapone (tintura, burro), sacchetto profumato (lavanda 2, stoffa), maglione alla lavanda (maglione, tintura) |

Per far stare le ricette al loro livello il pollaio scende al 5 e il pastificio sale al 6 (la pasta vuole le uova): i prezzi
e le soglie non cambiano di sensibile (`npm run tara:fattoria3d`).

## Altre macchine: il telaio, la sartoria, la tintoria e lo zuccherificio

Portate insieme perché le loro merci si usano a vicenda (la stoffa vuole il telaio, il maglione la sartoria, il maglione alla lavanda la
tintoria; lo zucchero chiude il gelato, i biscotti e la marmellata). Ricette, quantità e tempi sono quelli della 2D (minuti → secondi); i
`liv` stanno nei buchi della scaletta (una sola cosa produttiva per livello: [livelli.md](livelli.md)).

- **La fibra è la lana, non il cotone.** La 2D non ha nessun «cotone» (né coltura né merce): la sua catena tessile parte dalla **lana**
  delle pecore (e di conigli e alpaca, che qui non ci sono) → stoffa (telaio) → maglione, sciarpa di lana, berretto (sartoria) → tintura,
  sapone, sacchetto e maglione alla lavanda (tintoria, con la lavanda). La 3D fa lo stesso, e non ha niente da inventare.
- **La lana è un ingrediente che sta fuori da `stato.prodotti`**: è il contatore `stato.lana` (la tosa del recinto, il regalo della
  mongolfiera). `LANA` (`dati/animali.js`) la dichiara come merce (nome, emoji, `pezzo` `merce_lana`, il pezzo che la fa, il tempo); il
  motore la legge in `scortaDi` e la scala in `_togli`, `merceDi` le dà la faccia, `msDi` e `catenaMs` il tempo (una tosa e il suo pasto).
  Non si chiede in un ordine né si baratta con un vicino: ogni elenco che parte da `RICETTE` non la vede.
- **Lo zuccherificio sta al 13** (la barbabietola arriva all'11): lo zucchero rimette gli ingredienti veri nel gelato (prima la fragola) e
  apre i biscotti del pastificio, il succo della gelateria e la marmellata (che non è più un vecchio nome della crostata: `MERCI_VECCHIE`
  non la traduce più). **Caramelle** (zucchero + miele) restano fuori: il miele non c'è.
- **L'emoji di ripiego della tintura è 🧴**: 🫙, quella della 2D, è già della marmellata e un'emoji non è di due merci (`guastiDelleRicette`).
- Posti: telaio (−9,−4), zuccherificio (6,4), sartoria (6,0), tintoria (−9,4), tutti 3×3 in un lotto accanto al quadrato di partenza (un
  vicino li può avere: Zio Beppe il telaio, Villa Dolce lo zuccherificio).

## Le colture

Gli id restano quelli di prima (`carota`, `patata`…, singolari): sono le chiavi dei salvataggi e dei modelli di
`scena3d/modelli-colture.js`; il legame con la 2D è il `pezzo` (`raccolto_carote`…) e il test. **Tempi e livelli non seguono la
2D**: la taratura vuole che una coltura che arriva dopo non maturi prima (`guastiDellaScala`), e la 2D ha un altro ordine.
La lavanda ha ora la tintoria al 16; la zucca ha una sola uscita (il banco, i vicini): il resto della sua catena è in 2D (pentolone).

Le cinque colture portate dopo, con il loro `pezzo` (`raccolto_cavolfiori`, `_peperoni`, `_aglio`, `_barbabietola`, `_riso`): gli id
sono al singolare come gli altri (`cavolfiore`, `peperone`, `aglio`, `barbabietola`, `riso`), e il test li legge con `COME_2D`.

| coltura | livello | tempo | dove serve |
|---|---|---|---|
| cavolfiore | 8 | 40 s | minestrone |
| aglio | 10 | 46 s | salsa |
| barbabietola | 11 | 48 s | zucchero (zuccherificio) |
| peperone | 12 | 54 s | conserva d'orto |
| riso | 15 | 70 s | solo banco e vicini (arancini e sushi sono di macchine non ancora portate: friggitoria e sushi bar) |

Stanno in coda alla scaletta dove non spostano niente: la regola «matura dopo chi arriva prima» (`guastiDellaScala`) le
vuole fra la zucca (38 s) e la lavanda (64 s), e l'aglio sta prima della cucina perché la salsa non faccia slittare pizza e lasagne.
Il campo di riso ha una lastra d'acqua per tessera (una `sfera` schiacciata, nessuna forma in più). Nuovi in questo giro anche
la **conserva d'orto** (`pezzo` `merce_conserva`), l'unica ricetta della 2D che chiedeva il peperone.

## I vecchi salvataggi (stato v7)

`normalizza` traduce gli id di una fattoria già giocata (`MERCI_VECCHIE` in `motore/stato.js`): ogni vecchio prodotto diventa il
suo cugino di mestiere, **un pezzo per un pezzo** (popcorn → pastone, tre torte → torta, i gelati → gelato…). Vale per le scorte,
le code e i pronti delle macchine, gli ordini aperti e lo stato dei vicini (cassa, mercato). Niente si perde; una coda che
cambia macchina (il pane che era della pasticceria) torna nella sua.

## Nei test

`[data-merce="<id>"]` è la faccia di una merce (HUD, banco, macchina, cassa…); `unita/fattoria3d-merci` tiene ferme facce e ricette.
