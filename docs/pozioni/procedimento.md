# Il procedimento

Una tappa è una pozione sola, con un nome e una ricetta in parole. La spesa dal
mercante ([regole.md](regole.md)) è la prima metà; la seconda è **ricavare dal
testo cosa fare**: cosa pestare insieme, cosa versare, quando mescolare e
scaldare. Non sono cose impegnative, ma scaldare prima di aver mescolato fa un
pasticcio. Il motore è `motore/procedimento.js`.

## Le regole

- **La pergamena ha la ricetta a elenco puntato** (`righe`): «Pesta insieme
  polvere di luna e stelle tritate», «Versa il pestato nel calderone e scalda sul
  fuoco». **Ogni tanto due azioni stanno nello stesso punto** (`INSIEME`): bisogna
  leggere fino in fondo. La si legge già durante la spesa, tranne col rotolo
  aperto, dove sul telefono non ci sta. Fatta la spesa resta solo lei, e i punti
  fatti si cancellano.
- **Si comincia col listino aperto**: il primo passo è comprare, guardare il banco
  prima non serviva.
- **Con la spesa nel calderone non va niente**: gli strumenti arrivati all'oro si
  mettono via, e dentro si versa solo col procedimento.
- **In casa c'è già qualcosa** (`casa`, su `virgole`, `inverse` e le finali): un
  ingrediente parte col pezzo più grande già nello strumento, e il rotolo lo dice.
  Si compra solo quello che manca, cioè una sottrazione fra unità diverse.
- **Si tocca la roba, poi l'azione**: pestare e versare vogliono le cose scelte,
  mescolare, scaldare e diluire no. Non conta in che ordine si toccano le cose.
- **Il pasticcio**: un'azione che non è il prossimo passo, o con le cose sbagliate,
  non cambia niente, il calderone sbuffa, costa un gettone (`PASTICCIO`) e il
  cartello dice cosa diceva la ricetta. Si legge con la barra, come dopo un trabocco.
- **Le stelle restano sui gettoni**: i pasticci pesano lì, non c'è un secondo conto.
- **Un passo giusto al primo colpo vale una moneta** (`MONETE_A_PASSO`): è una
  lettura, non un conto. Dopo un pasticcio quel passo non paga.
- Niente va al motore di apprendimento: seguire una ricetta non è una conversione.

## La scaletta

`procedimento` in `dati/campagna.js` dice quanto è ricco; le azioni sul tavolo
(`AZIONI_DEL`) sono tutte quelle del livello, anche se la ricetta non le usa:
capire cosa serve è parte del gioco.

| | passi | gradini |
|---|---|---|
| 1 | versa tutto, mescola | `banco`, `grande` |
| 2 | versa tutto; mescola e scalda in ordine a caso | `grandi`, `virgola` |
| 3 | pesta due cose e versa, poi il resto (i liquidi: versa, mescola o scalda, versa il resto) | `virgole`, `media` |
| 4 | come il 3, e si diluisce | `miste`, `inversa` |
| 5 | come il 4, e una coppia di passi detta al contrario («scalda, ma prima mescola») | `inverse`, le finali |

- **L'ordine cambia di ricetta in ricetta**: se fosse sempre lo stesso si
  imparerebbe a memoria e il testo non si leggerebbe.
- I liquidi non si pestano: la ricetta non lo chiede, e tentarlo è un pasticcio.

## Il disegno e i suoni

- **Gli attrezzi** (`scena3d/attrezzi.js`) compaiono a spesa fatta: il mortaio, la
  ciotola che porta la roba, la brocca, il mestolo. Le mosse sono `MOSSE` in
  `indice.js`, e `passo(a)` le suona: la view dice solo com'è andata.
- **Il fuoco è basso** finché non si scalda (`banco.fuoco`).
- **I suoni** stanno in `suoni.js`, sopra `nota` e `rumore` di `src/audio.js`: le
  ampolle, il liquido che gorgoglia salendo, la polvere, la radice, il trabocco, il
  tuffo, il pestello, il mestolo, il fuoco, il pasticcio, una bolla ogni tanto.
  **Non dicono niente che non si veda**: a volume spento il gioco è intero.

Provato e tolto: due o tre pozioni per tappa con un cliente che arrivava a berle
e il mercante in figura accanto al calderone. Non aggiungevano abbastanza: meglio
una pozione più ricca che tante uguali.

Nei test: `unita/pozioni`, `unita/pozioni-sosta`, `integrazione/pozioni`,
`integrazione/pozioni-sosta`; `.pz-mercante[data-fase="procedimento"]`,
`[data-ricetta]`, `[data-riga]`, `[data-tavolo]`, `[data-cosa="i"]` (`-1` il
pestato), `[data-fai="pesta"|"versa"|"mescola"|"scalda"|"diluisci"]`;
`window.__poz.fai(azione, cosa)`.
