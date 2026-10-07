# La terra di sopra

Le discese non si scelgono da un elenco: si raggiungono a piedi su una mappa
grande (la «terra di sopra»), nella nebbia, e chi le cerca ha qualcuno che
gli indica la strada; fra le case stanno i mercanti. Il codice:
`viste/Terra.vue` (la mappa, la vista, il dito, il fumetto, i mercanti),
`motore/terra.js` (strada e nebbia, gira in Node), `dati/terra.js` (quale
discesa sta dove, cosa dicono minatore e cartello), `dati/mercanti.js` (chi
vende cosa), `dati/terra-mappa.js` (generato). `viste/Campagna.vue` ci mette
sopra la discesa a metà e chi scende, con la sua roba e le gemme.

## La mappa

- **Si tiene com'è**: `generati/mappa_sotterraneo.png`, un'immagine sola di
  1024×1536 (16×24 celle da 64 px), uscita al primo colpo dal prompt 1 della
  scheda `PROMPT-terra-di-sopra.md`. Le strade ci sono già: il codice non la
  ricompone a tessere, ci posa sopra solo quello che cambia (discese chiuse,
  chi indica, sassi, nebbia, eroe).
- **Entra nel file unico in WebP** (qualità 75, ~390 KB): a 2× non si
  distingue dall'originale. La fa `python3 strumenti/sprite/terra-di-sopra.py`,
  che scrive `src/giochi/sotterraneo/dati/terra-mappa.js` copiandoci il
  foglietto `strumenti/sprite/sorgenti/sotterraneo/terra-di-sopra.json`.
  Il modulo non si tocca: si corregge il foglietto e si rilancia.
- **La scala: una cella della mappa è grande quanto l'eroe.** L'eroe è a
  scala 3 come nel sotterraneo (16 px × 3 = 48 px), quindi la mappa si
  mostra a 3/4 (`SCALA_TERRA`): un pixel del disegno (4 px della mappa)
  diventa 3 px dello schermo, come un pixel dell'eroe. Su un telefono da 390
  px si vedono otto celle in larghezza, la mappa è due schermi per uno e
  mezzo. `image-rendering: pixelated`.

## La vista, alla Monkey Island

- **La vista non si trascina**: segue l'eroe. Lui sta libero nel mezzo, e
  quando arriva a `BORDO` dal bordo (30% di lato, 34% in cima, 26% in fondo
  dello spazio libero) la vista si sposta quel tanto che basta; ci arriva
  morbida (`MORBIDA`, un'esponenziale), mai a scatti.
- **Toccare vicino al bordo è il modo di esplorare**: l'eroe ci va, la vista
  gli scorre dietro e mostra il pezzo dopo; il tocco seguente va più in là.
- **All'avvio la vista è sull'eroe**, senza scorrere: lui a metà dello
  spazio libero.
- **Le carte in cima e in fondo** (la discesa a metà, chi scende) coprono la
  mappa: la vista le misura (`ResizeObserver`), tiene l'eroe nello spazio
  libero, e la mappa può scorrere fin sotto di loro, così il suo bordo non
  resta mai nascosto.
- **Il DOM si sposta a mano**, un `translate3d` per fotogramma sul mondo e
  sull'eroe: Vue ridisegna solo quando cambia qualcosa che si vede.

## Dove si cammina: la maschera

- **Una griglia di celle da 32 px della mappa** (32×48), una riga di testo
  per fila: `.` si cammina, `#` no. Sta nel foglietto, si legge e si
  corregge a mano.
- **Nasce da una proposta letta dai colori** (sentiero e prato sì; chiome,
  acqua, roccia, contorni scuri no) e poi si corregge: le case di paglia
  hanno il colore del sentiero, i cespugli quello del prato, e solo l'occhio
  li separa. Il giro:
  1. `python3 strumenti/sprite/terra-di-sopra.py --proponi` scrive
     `tmp/terra/proposta.txt` e dice quante celle differiscono dal foglietto;
  2. `--provino` scrive `tmp/terra/provino.png`, la mappa con sopra la
     maschera (rosso dove non si passa), i riquadri dei posti e i piedi;
  3. si corregge la riga nel foglietto, si rilancia lo strumento,
     `npm test` (`unita/sotterraneo-terra`).
- **L'eroe trova la strada da solo**: A* a otto direzioni, in diagonale solo
  se le due celle di lato sono libere (non taglia l'angolo di una casa), poi
  lisciata dove si vede dritto, così non cammina a scaletta.
- **Un tocco dove non si arriva** (l'acqua, il bosco, un posto chiuso fra le
  staccionate) porta alla cella raggiungibile più vicina in linea d'aria.
- **Il minatore e i mercanti stanno fermi** e non gli si passa attraverso
  (`ostacoli`); per parlargli ci si ferma `accanto`, due celle più in là, o le
  due figure si mangiano a vicenda. Lo strumento controlla che `piede` e
  `accanto` si possano camminare e che nessuno si fermi addosso a chi sta
  fermo.
- **Una strisciata non cammina**: oltre i 16 px il tocco non conta, e si
  agisce sul `click`, non sul `pointerup` ([../core/il-dito.md](../core/il-dito.md)).

## Le discese sui posti

Le aperture sono sette per sei discese più l'abisso. Il criterio: **le prime
vicino a casa, le ultime in cima, l'abisso nel pozzo che dicono non abbia
fondo**; a parità, il nome che somiglia al posto (`POSTO_DI` in `dati/terra.js`).

| discesa (la chiave resta) | posto | perché |
|---|---|---|
| La scalinata antica (`cantine`) | la scala sotto l'arco di pietra, al centro | la prima grossa cosa su per la strada da casa |
| Il pozzo dal tetto rosso (`pozzo`) | il pozzo coi coppi, accanto a casa | il tetto rosso lo distingue dal pozzo d'ardesia; è la prima cosa chiusa che si vede, col lucchetto, appena usciti |
| La grotta della scaletta (`gallerie`) | il buco nella roccia con la scaletta, a destra | a metà strada |
| La scala sommersa (`cisterna`) | la scala dentro lo stagno, a sinistra | a metà strada; l'acqua |
| La botola segreta (`labirinto`) | la botola nel prato, in cima | in cima, oltre il cartello |
| La miniera abbandonata (`fondo`) | la miniera dentro il monte, in cima a destra | in fondo alla strada, la più lontana da casa |
| l'abisso | il pozzo vecchio d'ardesia, in cima a sinistra | «dicono che non abbia fondo»; prima di finire le sei si vede ma non si scende |

- **Cambiano solo i nomi mostrati** (`nome` in `CAMPAGNA`): le chiavi, gli
  indici, le stelle e i salvataggi sono quelli di sempre. Il nome dice cosa
  c'è disegnato, in italiano semplice; «Si apre quando finisci …» lo
  riscrive in minuscolo, quindi deve reggere anche in mezzo a una frase.
- **Le scale in acqua si prendono da dove si vede l'apertura**: la scala
  sommersa ha i gradini che scendono verso sud, e l'eroe ci arriva dalla
  riva sud dello stagno (`piede` [7, 24]), mai dall'alto; la riva est
  accanto ai gradini è chiusa nella maschera. `unita/sotterraneo-terra`
  controlla che la strada non passi a nord del punto d'arrivo.

- **Si parte fra le case**, sulla strada sotto il pozzo di casa
  (`partenza`). Chi giocava prima della mappa si ritrova scoperto il posto
  delle discese già fatte.
- **Una discesa trovata e aperta ha un pallino per terra davanti
  all'ingresso** (al centro del bordo basso di `ingresso` nel foglietto,
  `.sot-segno-posto`): bianco, d'oro e pulsante per la prossima da fare.
  Provato un anello attorno all'ingresso: copriva il disegno ed era brutto. Niente targhette con disegnini sopra le discese, e
  niente emoji nei nomi del fumetto, dell'avviso e del cartello; la chiusa
  tiene il suo lucchetto, e le stelle si leggono nel fumetto.
- **Toccando una discesa trovata l'eroe ci va e si apre il fumetto** sopra
  (sotto, se sopra non c'è posto; la vista scorre se esce): nome, dritta,
  piani, stelle e «scendo»; dell'abisso il piano più giù toccato. Toccare il
  prato col fumetto aperto lo chiude e basta.
- **Una chiusa dice cosa ci sarà e cosa la apre** («Si apre quando finisci
  la scalinata antica»), senza tasto; chiusa per l'età non promette niente.
- **Sopra una chiusa si posa una pezza**: il riquadro della stessa mappa
  ritoccata con le discese sbarrate (`PEZZE`), finché non c'è un velo scuro
  sfumato col lucchetto disegnato in codice (`viste/pixel.js`). Come si
  chiede la mappa sbarrata: la scheda `PROMPT-terra-di-sopra.md`.
- **Con una discesa a metà**, scenderne un'altra avverte prima
  (`[data-chiede]`), come nell'elenco di prima.

## Chi indica la strada

- **Il vecchio minatore**, accanto a casa: toccato, dice dov'è la prossima
  discesa aperta («La scalinata antica: su per la strada, sempre dritto, giù per la
  scala sotto l'arco di pietra. Segui i sassi che luccicano.»); finite le
  sei, dov'è l'abisso. Finché non ha parlato ha i puntini sopra la testa.
- **Il cartello all'incrocio**: tre frecce, coi posti; accanto ai posti i
  nomi delle discese già trovate.
- **I sassi che luccicano** segnano la strada da dove sei, entrando, fino
  alla prossima discesa: uno ogni quattro passi, la scintilla che si accende
  a turno. Stanno sotto la nebbia: si seguono, non si vedono da lontano.
- **Le figure sono disegnate in codice** (`viste/pixel.js`, righe di pixel
  alla scala dell'eroe) finché non arriva il foglio dei personaggi (prompt 4
  della scheda): il minatore usa da solo lo sprite `minatore-fermo-0`
  appena l'atlante lo ha.

## I mercanti

Tre personaggi fermi fra le case (`mercanti` nel foglietto, `MERCANTI` in
`dati/terra-mappa.js`); chi vende cosa e perché sta in
[roba.md](roba.md#i-mercanti-di-sopra).

| chi | dove | piede · accanto |
|---|---|---|
| l'armaiolo | davanti alla casa di sinistra, accanto alle aiuole | [4, 34] · [6, 34] |
| l'erborista | davanti alla casa di destra, fra i fiori e la porta | [25, 42] · [27, 42] |
| il rigattiere | accanto al carro, in mezzo al prato | [27, 28] · [25, 28] |

- **Si toccano come il minatore**: l'eroe ci va, si ferma `accanto`, e
  arrivato si apre il banco (non un fumetto: la lista non ci sta). Il banco
  sta al centro, si chiude con la ✕ in alto a destra.
- **Si trovano nella nebbia** come i posti: finché la loro cella non si è
  vista sono prato (non si toccano), e trovandoli la riga in fondo lo dice
  («Hai trovato l'erborista!»).
- **Tutti e tre insieme non si vedono**: l'armaiolo sta a più di venti celle
  dagli altri due, e uno schermo da 390 px ne mostra sedici in larghezza.
  Dal carro si vedono rigattiere ed erborista.
- **Figure provvisorie disegnate in codice** (`ARMAIOLO`, `ERBORISTA`,
  `RIGATTIERE` in `viste/pixel.js`) finché non arrivano gli sprite: il posto
  è pronto, `<sprite>-fermo-0` nell'atlante (`armaiolo-fermo-0`…) si usa da
  solo, come per il minatore.
- **La carta di chi scende dice la roba**: braccio e difesa con quello che
  ha addosso, e le gemme da spendere; il suo «cambio» riapre la scelta delle
  avventure ([avventure.md](avventure.md)).
- **Il banco si pesca per avventura**: le righe dipendono dalle discese finite
  da quell'eroe, e i banchi già pescati stanno nella sua avventura.

## La nebbia

- **Nero dove non si è mai stati, scuro dove si è stati, pieno attorno a
  te.** Un sotterraneo tutto illuminato è una piantina; vale anche sopra.
- **A nuvole, non a quadretti**: ogni cella vista buca il nero con una
  nuvoletta sfumata spostata un poco a caso, su una tela a un quarto che il
  browser stira sfumando.
- **Si scopre camminando** (`VISTA`, otto celle attorno all'eroe), e un
  posto è trovato quando se ne vede il cuore: lo dice una riga in fondo
  («Hai trovato la scalinata antica!»). Un posto nel buio è prato come il resto.
- **Si ricorda per avventura** ([avventure.md](avventure.md)), in
  `cfg.avventure[<eroe>].terra`: `{ nebbia, dove, parlato }`; un eroe nuovo
  parte da casa con la nebbia nuova e il minatore da sentire, la nebbia un bit per cella in esadecimale
  (384 caratteri). Un codice che non torna (altra mappa) è nebbia nuova.

Nei test: `[data-terra]` (la vista, con `data-camera`), `[data-eroe-terra]`
(con `data-cella` e `data-cammina`), `[data-posto]` (con `data-discesa` o
`data-abisso`, `data-aperta`, `data-trovato`), `[data-chiusa]` (la pezza o il
velo), `[data-minatore]`, `[data-cartello]`, `[data-sasso]`, `[data-fumetto]`
(con `data-fumetto-di`), `[data-azione="scendi"]`, `[data-detto]`,
`[data-chiusa-perche]`, `[data-avviso-terra]`, `[data-pallino="<posto>"]` (il
pallino), `[data-mercante="<chi>"]`, `[data-roba-sopra]` (la carta di chi
scende, con le gemme); nel banco `[data-chiudi]`, `[data-merce="<cosa>"]`,
`[data-vendo="<cosa>"]`, `[data-detto-banco]`, `[data-chi-compra]`,
`[data-tasche-vuote]`, e nello zaino `[data-tasca][data-cosa="<cosa>"]`;
`unita/sotterraneo-terra`, `integrazione/sotterraneo-terra`,
`integrazione/sotterraneo-mercanti`, e `scendiNelSotterraneo` in
`test/aiuto/browser.mjs` per chi deve solo scendere.
