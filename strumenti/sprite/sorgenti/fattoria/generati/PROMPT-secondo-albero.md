# I prompt del secondo albero

Il progetto è [`docs/fattoria-albero.md`](../../../../../docs/fattoria-albero.md)
§8. I primi tre fogli (✅) sono quelli che arrivano entro il livello 30;
gli ultimi due chiudono il resto — **tutte** le merci che mancano in un
foglio solo, e tutto quello che non è una merce in un altro. La lista
di quello che manca, sprite e non, sta in
[`docs/fattoria-da-fare.md`](../../../../../docs/fattoria-da-fare.md).

Zuccherificio, pastificio, pasticceria, osteria (`rosticceria`),
merceria e sushi bar sono già in `edifici_3.png`.

**Finché il secondo albero sta sul branch `fattoria-hayday`, i fogli
vanno nel suo worktree** (`../games-hayday`), non nella cartella del
repo principale: `merci_3` e `campi_3` sono arrivati là, e sono stati
copiati a mano.

Il metodo è quello delle schede `PROMPT-edificio.md` e
`PROMPT-merce.md`: si allega **l'ultimo foglio buono** e si dice «nello
stesso stile di questa». Il prompt si copia nel campo `prompt` del
foglietto **nello stesso momento** in cui si salva il PNG.

## 1. `edifici_4.png` — la mongolfiera, la gelateria, la mensa ✅

Fatto il 23 settembre 2026. È tornato con un alone rossastro attorno a
ogni figura: lo toglie `"alone": 128` nel foglietto (`FORMATO.md`).

**Allegare:** `edifici_3.png`.

> Disegna un foglio di sprite in pixel art **nello stesso stile di questa
> immagine**: stessa tavolozza (legno caldo, tegole rosse e blu, pietra
> grigia), stesso contorno scuro di un pixel, stessa vista — facciata
> frontale vista da tre quarti dall'alto, come gli edifici allegati — e
> stessa luce da in alto a sinistra.
>
> Il foglio è 1536×1024 px, su **fondo trasparente** (PNG). Disponi
> **4 soggetti** su una griglia dichiarata di 4 colonne × 1 riga, celle
> di 384×1024 px, ognuno centrato nella sua cella e appoggiato al bordo
> di sotto della cella lasciando 32 px di margine. Nessun soggetto
> tocca il bordo della cella. Gli edifici sono larghi circa 256 px e
> alti fra 220 e 290 px; la mongolfiera è larga circa 256 px e alta
> circa 600 px.
>
> **Il disegno finisce dove il soggetto tocca terra**: la soglia della
> porta, il gradino, il fondo del cesto. Sotto e di fianco è tutto
> trasparente. **Niente prato, niente terra, niente ciuffi d'erba,
> niente ombra proiettata e nessuna macchia sotto.**
>
> **NESSUNA PAROLA SCRITTA, da nessuna parte**: né insegne con testo, né
> cartelli, né numeri, né lettere. Dove serve un'insegna è **un
> oggetto**.
>
> Quello che appartiene a un soggetto dev'essere **attaccato al suo
> disegno in un pezzo solo**: le corde toccano il cesto, il fumo tocca
> il comignolo. Niente pezzetti staccati che galleggiano nel vuoto.
>
> Da sinistra a destra:
> 1. una **mongolfiera atterrata**: un grande pallone a spicchi rossi e
>    crema con una fascia di bandierine colorate, legato con corde a un
>    cesto di vimini largo e basso appoggiato a terra; dentro il cesto
>    si vedono tre casse di legno vuote impilate
> 2. **la piazzola della mongolfiera quando è partita**: un cerchio di
>    assi di legno appoggiato a terra, con quattro sacchetti di zavorra
>    ai lati e una corda arrotolata, niente pallone — larga come il
>    cesto, bassa
> 3. una **gelateria**: casetta col tetto a strisce rosa e bianche come
>    una tenda, un bancone aperto sul davanti con tre vaschette di
>    gelato colorate dietro il vetro, e un grande cono gelato di legno
>    come insegna sopra la porta
> 4. una **scuoletta di campagna** (la mensa): edificio basso color
>    giallo tenue col tetto rosso, un campanile piccolo con la campana
>    sul colmo, finestre con le tendine a quadretti, e davanti alla
>    porta una lavagnetta e un cestino di mele

**Il foglietto:** `scala` come `edifici_3.json` (5, se i pezzi vengono
più grandi di 270 px), `famiglia: "figura"`. La mongolfiera è l'unico
pezzo **più alto di una cella del gioco per quattro**: il piede lo
ricava `piedeDalDisegno` dalla larghezza, e l'altezza sborda in su
come il mais maturo.

## 2. `merci_3.png` — il forno, lo zucchero e la gelateria ✅

Fatto il 23 settembre 2026, con lo stesso alone di `edifici_4` anche se il
prompt lo vietava: `"alone": 128`, e misure a divisore unico 16.

**Allegare:** `merci_2.png`.

> Disegna un foglio di oggetti in pixel art **nello stesso stile di questa
> immagine**: stessa tavolozza calda, stesso contorno scuro, stessa vista
> — di fronte e un po' dall'alto — stessa luce da in alto a sinistra.
>
> Il foglio è **1536×1024 px** su **fondo trasparente** (PNG). Disponi
> **6 oggetti** su una griglia dichiarata di **3 colonne × 2 righe**,
> celle di **512×512 px**, ognuno centrato nella sua cella. Ogni oggetto
> è largo circa **380 px** (nel gioco diventa 25–30 px: un oggetto solo,
> grande, che si riconosca anche a venti pixel).
>
> Ogni oggetto è **appoggiato**, visto da chi lo guarda dal banco, con la
> base che si vede. **Nessuna ombra** sotto l'oggetto, nemmeno leggera,
> nessun piano d'appoggio disegnato, nessun fondo dietro: sotto e
> attorno è tutto trasparente.
>
> **NESSUNA PAROLA SCRITTA, da nessuna parte**: né etichette sui
> barattoli, né lettere, né numeri.
>
> Quello che appartiene a un oggetto dev'essere **attaccato al suo
> disegno in un pezzo solo**. Niente briciole che galleggiano lontane.
>
> Da sinistra a destra, riga per riga:
> 1. due pagnotte tonde e dorate con il taglio a croce sopra, una
>    appoggiata all'altra
> 2. una torta rotonda a due piani con la glassa rosa, una fragola in
>    cima e un filo di panna sul bordo
> 3. un sacchetto di carta bianca aperto, pieno di zucchero bianco a
>    granelli che trabocca un poco sul bordo, con due zollette
>    appoggiate contro il sacchetto
> 4. un bicchiere alto di vetro pieno di succo arancione e rosso, con
>    una cannuccia a strisce e una rondella di carota sul bordo
> 5. una coppetta di cialda con tre palline di gelato — rosa, crema e
>    marrone — e un cucchiaino di legno piantato sopra
> 6. un mazzetto di spaghetti gialli legati con uno spago, accanto a un
>    mucchietto di farfalle di pasta

Merci: `merce_pane`, `merce_torta`, `merce_zucchero`, `merce_succo`,
`merce_gelato`, `merce_pasta`. La pasta arriva al 31: sta qui perché
il sesto posto del foglio era libero.

## 3. `campi_3.png` — la barbabietola (e già che c'è, lavanda e riso) ✅

Fatto il 23 settembre 2026, con un alone forte (`"alone": 128`). Le
misure riportano ogni letto a 32×27 come in `campi_2`.

**Allegare:** `campi_2.png`.

> Disegna un foglio di sprite in pixel art **nello stesso stile di questa
> immagine**, riga per riga identico nella forma: a sinistra il
> cartello di legno con il disegno della pianta, poi **otto aiuole in
> fila** dalla terra appena arata ai semi, al germoglio, alla pianta
> che cresce, fino al raccolto maturo, e in fondo a destra la
> cassetta di legno piena del raccolto. Stessa misura delle aiuole,
> stessa terra, stesso bordo, stessa luce.
>
> Il foglio è 1536×1024 px. **Tre righe**, con la stessa spaziatura
> delle righe allegate e il resto del foglio vuoto:
> 1. **barbabietola da zucchero**: ciuffi di grandi foglie verde scuro
>    con le coste rosse, e alla fine le radici tonde viola-rossastre
>    che spuntano dalla terra; la cassetta piena di barbabietole con
>    le foglie
> 2. **lavanda**: cespuglietti grigioverdi che crescono, poi le spighe
>    viola chiaro sempre più fitte; la cassetta coi mazzi di lavanda
>    legati con lo spago
> 3. **riso**: l'aiuola allagata con un filo d'acqua che luccica, le
>    piantine verdi in file, poi le spighe che si piegano e diventano
>    dorate; la cassetta piena di pannocchie di riso dorate
>
> **Il cartello porta il disegno della pianta e nient'altro**: nessuna
> parola scritta sul cartello (quelle dell'immagine allegata non vanno
> copiate).

Pezzi: `campo_barbabietola0..6` + `raccolto_barbabietola`, e lo stesso
per `lavanda` e `riso`. **Sette stadi e non otto**: la prima aiuola
della fila è la terra arata, che il gioco ha già (`campo_vuoto`).

## 4. `merci_4.png` — tutte le merci che mancano, in un foglio solo

**Allegare:** `merci_3.png`.

I fogli da sei erano una prudenza: si temeva che sopra i sei il
generatore stringesse gli oggetti fino a perdere i dettagli. Ma una
merce nel gioco è larga 25–30 px, e una cella da 256 px del foglio ne
dà quasi otto per ogni pixel del gioco: c'è posto per tutto. Quindi le
**ventidue** che mancano in un colpo solo, su una griglia 6×4.

> Disegna un foglio di oggetti in pixel art **nello stesso stile di questa
> immagine**: stessa tavolozza calda, stesso contorno scuro, stessa vista
> — di fronte e un po' dall'alto — stessa luce da in alto a sinistra.
>
> Il foglio è **1536×1024 px** su **fondo trasparente** (PNG). Disponi
> **22 oggetti** su una griglia dichiarata di **6 colonne × 4 righe**,
> celle di **256×256 px**, ognuno centrato nella sua cella; le **ultime
> due celle** dell'ultima riga restano **vuote**. Ogni oggetto è largo
> circa **190 px** e nessuno tocca il bordo della sua cella.
>
> Ogni oggetto è **appoggiato**, visto da chi lo guarda dal banco, con la
> base che si vede. **Nessuna ombra**, nessun piano d'appoggio, nessun
> fondo dietro, e **nessun alone o bagliore** attorno agli oggetti: i
> bordi sono netti e pieni, e fuori dall'oggetto è tutto trasparente.
>
> **NESSUNA PAROLA SCRITTA, da nessuna parte**: né etichette, né
> lettere, né numeri.
>
> Quello che appartiene a un oggetto dev'essere **attaccato al suo
> disegno in un pezzo solo**. Niente briciole che galleggiano lontane.
>
> Da sinistra a destra, riga per riga:
>
> Riga 1 — il filo e il colore:
> 1. un maglione piegato color crema con le trecce, le maniche ripiegate sopra
> 2. lo stesso maglione piegato, tinto di viola lavanda chiaro
> 3. un vasetto di vetro col tappo di sughero, pieno di tintura viola lavanda
> 4. tre saponette impilate, due color lavanda e una crema, con una bollicina di schiuma sopra
> 5. un sacchettino di tela grezza chiuso da un nastro, con tre steli di lavanda che escono dalla bocca
> 6. una sciarpa di lana a righe crema e rosse, arrotolata a spirale
>
> Riga 2 — il forno e la dispensa:
> 7. un berretto di lana crema col pompon, a coste
> 8. una crostata rotonda con la griglia di pasta sopra e la confettura di fragole rossa fra le strisce
> 9. un barattolo di vetro con la salsa di pomodoro rossa e il tappo di metallo, un pomodorino appoggiato contro
> 10. un vaso di vetro largo con gli ortaggi a pezzi sott'olio, a strati viola, rossi e arancio
> 11. un vasetto di marmellata di fragole col tappo coperto da un quadrato di stoffa a quadretti bianchi e rossi legato con lo spago
> 12. tre caramelle incartate in carta colorata a fiocco, una rossa, una gialla, una azzurra, appoggiate l'una sull'altra
>
> Riga 3 — la pasticceria e la cucina:
> 13. un bicchiere alto con il frullato rosa di fragole, la panna in cima e una fragola sul bordo
> 14. una pila di quattro biscotti tondi con le gocce di cioccolato
> 15. una pizza intera tonda con il pomodoro, la mozzarella bianca a chiazze e due foglie di basilico
> 16. una teglia rettangolare di lasagne vista un po' dall'alto, con gli strati di pasta, il sugo rosso e la crosta dorata
> 17. un cono di carta a righe rosse e bianche pieno di patatine fritte dorate
> 18. due pesci fritti dorati e croccanti su un foglio di carta paglia, con uno spicchio di limone
>
> Riga 4 — la peschiera e il riso:
> 19. un pesce intero argentato e azzurro, appena pescato, appoggiato su un letto di foglie
> 20. tre arancini dorati a forma di pera, impilati, uno spezzato che mostra il riso giallo dentro
> 21. un piattino di legno con quattro pezzi di sushi: riso bianco con sopra una fetta di salmone arancione
> 22. tre maki tondi con l'alga verde scuro fuori, il riso bianco e le verdure colorate al centro
> 23. (vuota)
> 24. (vuota)

Merci: `merce_maglione`, `merce_maglione_lavanda`, `merce_tintura`,
`merce_sapone`, `merce_sacchetto`, `merce_sciarpa`, `merce_berretto`,
`merce_crostata`, `merce_salsa`, `merce_conserva`, `merce_marmellata`,
`merce_caramelle`, `merce_frullato`, `merce_biscotti`, `merce_pizza`,
`merce_lasagne`, `merce_patatine`, `merce_fritto`, `merce_pesce`,
`merce_arancini`, `merce_sushi`, `merce_maki`.

## 5. `edifici_5.png` — friggitoria, peschiera e la fiera

**Allegare:** `edifici_4.png`, e se il generatore accetta due immagini
anche `giardino.png` (la fiera sono decorazioni, e devono stare accanto
a quelle).

Tutto quello che non è una merce e manca ancora, in un foglio: la
friggitoria, i quattro ritratti della peschiera (un recinto **cambia
disegno** a seconda di come sta, come la stalla e lo stagno delle
anatre) e le otto decorazioni della sorpresa della mongolfiera.

> Disegna un foglio di sprite in pixel art **nello stesso stile di questa
> immagine**: stessa tavolozza (legno caldo, tegole rosse e blu, pietra
> grigia), stesso contorno scuro di un pixel, stessa vista da tre
> quarti dall'alto, stessa luce da in alto a sinistra.
>
> Il foglio è 1536×1024 px, su **fondo trasparente** (PNG). Disponi
> **12 soggetti** su una griglia dichiarata di **4 colonne × 3 righe**,
> celle di 384×341 px, ognuno centrato nella sua cella e appoggiato al
> bordo di sotto lasciando 16 px di margine. Nessun soggetto tocca il
> bordo della cella.
>
> **Il disegno finisce dove il soggetto tocca terra.** Sotto e di fianco
> è tutto trasparente: **niente prato, niente terra, niente ciuffi
> d'erba, niente ombra proiettata, nessun alone o bagliore**.
>
> **NESSUNA PAROLA SCRITTA, da nessuna parte.** Dove serve un'insegna è
> un oggetto.
>
> Da sinistra a destra, riga per riga:
>
> Riga 1 — la friggitoria e la peschiera:
> 1. una **friggitoria**: chiosco di legno col tetto a spiovente giallo e bianco, un bancone aperto sul davanti con un grande pentolone d'olio fumante e un cono di patatine di legno come insegna
> 2. la **peschiera, tranquilla**: un laghetto rotondo bordato di sassi e da una staccionata bassa di legno, con l'acqua azzurra e tre pesci arancioni che nuotano, una ninfea, un secchio di legno sulla riva
> 3. la **stessa peschiera mentre mangia**: identica, ma i tre pesci sono venuti a galla tutti insieme con la bocca aperta verso dei granelli di becchime che galleggiano
> 4. la **stessa peschiera che dorme**: identica, l'acqua più scura e ferma, i pesci fermi sul fondo, una lucciola sulla ninfea
>
> Riga 2 e 3 — la fiera, otto decorazioni allegre di una fiera di paese, con gli stessi colori ricorrenti (rosso, giallo, azzurro, crema) perché sono una collezione:
> 5. un filo di bandierine triangolari colorate teso fra due pali di legno
> 6. una piccola giostra a cavalli di legno col tettuccio a spicchi
> 7. un carretto dello zucchero filato con una nuvola rosa sul bastoncino
> 8. un palo con tre lanterne di carta colorate appese
> 9. un tiro al barattolo: un bancone di legno con una piramide di barattoli colorati
> 10. un grande girasole di legno dipinto su un piedistallo
> 11. uno spaventapasseri vestito a festa, col cappello a punta e i nastri colorati
> 12. un piccolo palco di legno con un tamburo e una tromba appoggiati

La peschiera deve essere **uguale nei tre ritratti** tranne quello che
cambia: è lo stesso recinto visto in tre momenti, e se cambia la forma
del laghetto sembra che la cosa si sposti.

Pezzi: `friggitoria`, `recinto_pesci_calmo`, `recinto_pesci_mangia`,
`recinto_pesci_dorme`, `fiera_bandierine`, `fiera_giostra`,
`fiera_zucchero_filato`, `fiera_lanterne`, `fiera_barattoli`,
`fiera_girasole`, `fiera_spaventapasseri`, `fiera_palco`.

Con questi due fogli **non manca più nessuno sprite** del secondo
albero.
