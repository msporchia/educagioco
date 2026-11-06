# Il procedimento

Una tappa è una pozione sola, con un nome e una ricetta in parole. La spesa dal
mercante ([regole.md](regole.md)) è la prima metà; la seconda è **ricavare dal
testo cosa fare**: cosa pestare insieme, cosa versare, quando mescolare e
scaldare. Non sono cose impegnative, ma scaldare prima di aver mescolato fa un
pasticcio. Il motore è `motore/procedimento.js`.

## Le regole

- **La pergamena ha la ricetta a elenco puntato** (`righe`): «Pesta insieme
  polvere di luna e stelle tritate», «Versa il pestato nel calderone e accendi il
  fuoco». **Ogni tanto due azioni stanno nello stesso punto** (`INSIEME`): bisogna
  leggere fino in fondo. **Si legge come parlerebbe una persona**: al contrario si
  dicono solo le mosse sul calderone («accendi il fuoco dopo aver mescolato bene»), e
  pestare e versare diventano «versa nel calderone X e Y pestati insieme». Provato
  a girare una coppia a caso: «versa il pestato, ma prima pesta» non si leggeva. La si legge già durante la spesa, tranne col rotolo
  aperto, dove sul telefono non ci sta. Fatta la spesa resta solo lei, e i punti
  fatti si cancellano.
- **Si comincia col listino aperto**: il primo passo è comprare, guardare il banco
  prima non serviva.
- **Con la spesa nel calderone non va niente**: gli strumenti arrivati all'oro si
  mettono via, e dentro si versa solo col procedimento.
- **Si parte sempre da zero**: ogni strumento comincia vuoto, e tutta la dose si
  compra dal mercante. Provato con un pezzo già in casa: confondeva, e la
  sottrazione fra unità diverse rubava la scena alla conversione.
- **Niente bottoni: tutto si trascina, e gli attrezzi si muovono col dito.** La roba
  sta sul bancone col nome, nel suo recipiente o con la foto del suo modello
  ([gesti.md](gesti.md)), gli attrezzi sul tavolo. La
  roba sul calderone si versa, sul mortaio e sul tagliere ci va, sulla grattugia si
  sfrega; il pestello sul mortaio pesta, il coltello sul tagliere sminuzza, il mortaio,
  il tagliere e il ciotolino sul calderone versano; il mestolo mescola, il fiammifero sulla legna
  accende il fuoco, la bacchetta fa l'incantesimo, la
  brocca diluisce, il sale e il pepe si scuotono, il mestolo pieno riempie la fiala (`MOSSE` in `procedimento.js`, i gesti in [gesti.md](gesti.md)). Le
  cose entrano una alla volta, in qualunque ordine; provato coi bottoni: troppi, e
  non sembrava di fare niente.
- **Sminuzzare e grattugiare dipendono dalla roba** (`lavoro` in `dati/misure.js`):
  radici, rami, vermi e steli si tagliano, conchiglie, ghiande, funghi e ossa si
  grattano. Senza niente da tagliare il tagliere non si tira fuori (`attrezziDi`).
- **La riga del tagliere dice tutto**: «Sminuzza il ramo di quercia e versalo nel
  calderone». `art` dice l'articolo.
- **L'incantesimo ha una riga tutta sua**, con la formula: «Agita la bacchetta sul
  calderone e sussurra: «Stelle e vapore, cambia colore!»». La formula dipende dagli
  ingredienti (`FORMULE`). Scritto solo «agita la bacchetta» era poco teatrale.
- **Il pizzico non si misura**: sale o pepe, uno a ricetta. Non si compra e non ha dose,
  è un gesto in più per divertirsi. Sul tavolo ci sono tutti e due col nome davanti: quello
  che la ricetta non dice è un pasticcio. Viene dopo che la roba è nel calderone.
- **La fiala chiude sempre la ricetta**: si vede la pozione fatta, e resta sul tavolo.
- **Lasciato sul tavolo, resta lì**: se un attrezzo dà fastidio lo si sposta, come
  su un banco vero (`posa`). Non si salva: rientrando ognuno è al suo posto.
- **Quello che ingombra sta in fondo**: il mestolo appeso al gancio sotto lo scaffale,
  la bacchetta nel suo vasetto, che pende indietro perché dall'alto, dritta, si accorcerebbe
  a niente. Questi due (`fisso`) tornano sempre lì.
- **Il fuoco parte spento**: scaldare vuol dire accenderlo, e a fuoco spento il
  brodo non bolle e non fuma.
- **Finché non si mescola nel calderone c'è un arcobaleno che gira**; mescolando
  sparisce in un colore solo, e con tutto dentro è quello della pozione (`brodo`).
- **Il pasticcio**: una mossa che non fa avanzare il prossimo passo, o con la cosa
  sbagliata, non cambia niente, il calderone sbuffa, costa un gettone (`PASTICCIO`) e il
  cartello dice cosa diceva la ricetta. Si legge con la barra, come dopo un trabocco.
- **Le stelle restano sui gettoni**: i pasticci pesano lì, non c'è un secondo conto.
- **Un passo giusto al primo colpo vale una moneta** (`MONETE_A_PASSO`): è una
  lettura, non un conto. Dopo un pasticcio quel passo non paga.
- Niente va al motore di apprendimento: seguire una ricetta non è una conversione.

## La scaletta

`procedimento` in `dati/campagna.js` dice quanto è ricco; gli attrezzi sul tavolo
(`azioniDi`, `ATTREZZI`) sono tutti quelli del livello, anche se la ricetta non
li usa: capire cosa serve è parte del gioco.

| | passi | gradini |
|---|---|---|
| 1 | versa tutto, mescola, accendi il fuoco, la bacchetta, il pizzico, la fiala | `banco` |
| 2 | come l'1 | `grande` |
| 3 | pesta due cose e versa, poi il resto; i liquidi versano tutto | `grandi`, `virgola`, `virgole` |
| 4 | come il 3, e si diluisce | `media`, `miste`, `inversa` |
| 5 | come il 4, e una coppia di passi detta al contrario («accendi il fuoco dopo aver mescolato bene») | `inverse`, le finali |

- **Si gioca al banco dalla prima tappa**: con «versa e mescola» il fuoco restava spento
  e il brodo non ribolliva. Fuoco, bacchetta, pizzico e fiala ci sono da subito,
  tagliere e grattugia da `virgole` (`AZIONI_DA`). Nelle finali e nel
  calderone senza fondo c'è tutto.
- **La bacchetta è di contorno**: entra appena è sul tavolo, mai oltre
  dieci passi e otto punti (`TETTO`, `RIGHE`: la pergamena coprirebbe il calderone). Il
  posto per la fiala è tenuto, poi viene lei e per ultimo il pizzico. Quello che resta
  fuori sta sul tavolo lo stesso.
- **Si mescola sempre prima di scaldare.**
- **L'ordine cambia di ricetta in ricetta**: bacchetta e brocca cambiano
  posto, se no si imparerebbe a memoria e il testo non si leggerebbe.
- **I liquidi non si pestano**: in una pozione di soli liquidi il mortaio e il
  pestello non stanno sul tavolo (`azioniDel`), e la ricetta versa tutto. Provato con
  della roba secca in dispensa per dare un senso al mortaio: era di nuovo «hai già
  qualcosa in casa», e confondeva. Nelle finali, con pesi e lunghezze, il mortaio c'è.

## Il calderone senza fondo

Sta in fondo alla mappa, si apre con l'ultima tappa e non conta fra le ventinove
(`INFINITA`, `giroInfinito`, indice -1). Una pozione dopo l'altra sulle dosi delle
finali: dalla quarta quattro ingredienti, e il procedimento sale fino in fondo.

- **I gettoni avanzati passano alla pozione dopo**: si parte con una scorta di sei,
  e chi spende il minimo non perde niente. **Si smette finendo una pozione in rosso.**
- **Il record è quante di fila** (`senzaFine` nel manifesto, misura `fila`,
  [../core/primati.md](../core/primati.md)), e si legge sul tasto.
- Paga come le tappe: tre monete a dose, una a passo. La sosta tiene il giro e la
  pozione (`giro`), e la dopo è già pronta mentre il calderone fa festa.

## Il disegno e i suoni

- **Gli attrezzi** (`scena3d/attrezzi.js`) compaiono a spesa fatta, con una presa
  invisibile più grande di loro, se no il dito non li prende. Si portano su un
  piano in aria (`inAria`), e `bersaglio(x, y, id)` dice su cosa si è lasciato, guardando
  sullo schermo, con le zone più larghe di come si vedono (`ZONE`). Provato su
  quel piano: per quello che sta basso sul tavolo il dito cadeva lontano, e sul
  mortaio non succedeva niente. A fine mossa tornano a posto.
- `passo(a)` suona le mosse: la view dice solo com'è andata.
- **I suoni** stanno in `suoni.js`, sopra `nota` e `rumore` di `src/audio.js`: le
  ampolle, il liquido che gorgoglia salendo, la polvere, la radice, il trabocco, il
  tuffo, il pestello, la lama, la grattugia, il mestolo, il fiammifero,
  la bacchetta, il pizzico, il tappo, il fuoco, il pasticcio, una bolla ogni tanto.
  **Non dicono niente che non si veda**: a volume spento il gioco è intero.

Provato e tolto: due o tre pozioni per tappa con un cliente che arrivava a berle
e il mercante in figura accanto al calderone. Non aggiungevano abbastanza: meglio
una pozione più ricca che tante uguali.

Nei test: `unita/pozioni`, `unita/pozioni-sosta`, `integrazione/pozioni`,
`integrazione/pozioni-sosta`; `.pz-mercante[data-fase="procedimento"]`,
`[data-ricetta]`, `[data-riga]`; `window.__poz.fai(azione, cosa)` (la mossa senza dito),
`window.__bottega3d.dove('calderone'|'mestolo'|'roba:0'|…)`
(dove sta sullo schermo, per trascinare); gli altri in [gesti.md](gesti.md).
