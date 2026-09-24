# I prompt del secondo albero

Il progetto è [`docs/fattoria-albero.md`](../../../../../docs/fattoria-albero.md)
§8. I primi tre fogli (✅) sono quelli che arrivano entro il livello 30;
gli altri chiudono il resto — **tutte** le merci che mancano in un
foglio solo, la friggitoria e la fiera in un altro, e la peschiera in
un terzo, perché è un recinto e si chiede accanto ai recinti. In fondo
c'è l'unica cosa che non è dell'albero: gli addobbi al collo e sulla
schiena, sospesi finché non sono sprite. La lista di quello che manca,
sprite e non, sta in
[`docs/fattoria-da-fare.md`](../../../../../docs/fattoria-da-fare.md).

Zuccherificio, pastificio, pasticceria, osteria (`rosticceria`),
merceria e sushi bar sono già in `edifici_3.png`.

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

## 4. `merci_4.png` — tutte le merci che mancano, in un foglio solo ✅

Fatto il 24 settembre 2026: tutte e ventiquattro, nell'ordine chiesto,
una macchia sola ciascuna. È tornato a 1248×832 invece che a
1536×1024 (stesse proporzioni) e con un alone chiaro e leggero, tolto
dallo stesso `"alone": 128`. Le misure hanno un divisore solo, 7,25.

**Allegare:** `merci_3.png`.

I fogli da sei erano una prudenza: si temeva che sopra i sei il
generatore stringesse gli oggetti fino a perdere i dettagli. Ma una
merce nel gioco è larga 25–30 px, e una cella da 256 px del foglio ne
dà quasi otto per ogni pixel del gioco: c'è posto per tutto. Quindi le
**ventidue** che mancano in un colpo solo, su una griglia 6×4 — e nelle
due celle che avanzavano i due ripieghi che non lo dichiaravano: il
pastone, che è ancora il calderone grigio del set CC0 in mezzo a merci
dipinte, e il miele, che è un vasetto rosso di marmellata (lo stesso
che marmellata e salsa smettono di usare con questo foglio, e che a
quel punto direbbe «marmellata» da solo).

> Disegna un foglio di oggetti in pixel art nello stesso stile di questa
> immagine: stessa tavolozza calda, stesso contorno scuro, stessa vista
> — di fronte e un po' dall'alto — stessa luce da in alto a sinistra.
>
> Il foglio è 1536×1024 px su fondo trasparente (PNG). Disponi 24
> oggetti su una griglia dichiarata di 6 colonne × 4 righe, celle di
> 256×256 px, ognuno centrato nella sua cella. Ogni oggetto è largo
> circa 190 px e nessuno tocca il bordo della sua cella (nel gioco
> diventa 25–30 px: un oggetto solo, grande, che si riconosca anche a
> venti pixel).
>
> Ogni oggetto è appoggiato, visto da chi lo guarda dal banco, con la
> base che si vede. Nessuna ombra, nessun piano d'appoggio, nessun fondo
> dietro, e nessun alone o bagliore attorno agli oggetti: i bordi sono
> netti e pieni, e fuori dall'oggetto è tutto trasparente.
>
> NESSUNA PAROLA SCRITTA, da nessuna parte: né etichette, né lettere,
> né numeri.
>
> Quello che appartiene a un oggetto dev'essere attaccato al suo disegno
> in un pezzo solo. Niente briciole che galleggiano lontane.
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
> Riga 4 — la peschiera, il riso e la stalla:
> 19. un pesce intero argentato e azzurro, appena pescato, appoggiato su un letto di foglie
> 20. tre arancini dorati a forma di pera, impilati, uno spezzato che mostra il riso giallo dentro
> 21. un piattino di legno con quattro pezzi di sushi: riso bianco con sopra una fetta di salmone arancione
> 22. tre maki tondi con l'alga verde scuro fuori, il riso bianco e le verdure colorate al centro
> 23. una scodella smaltata bianca col bordo blu, colma di pastone di mais giallo, denso e a grumi, con una pannocchia appoggiata contro la scodella
> 24. un vasetto di vetro basso e panciuto pieno di miele dorato, col tappo di legno e il mestolino da miele di legno appoggiato sopra, e una goccia di miele che cola lungo il vetro

Merci: `merce_maglione`, `merce_maglione_lavanda`, `merce_tintura`,
`merce_sapone`, `merce_sacchetto`, `merce_sciarpa_lana`,
`merce_berretto`, `merce_crostata`, `merce_salsa`, `merce_conserva`,
`merce_marmellata`, `merce_caramelle`, `merce_frullato`,
`merce_biscotti`, `merce_pizza`, `merce_lasagne`, `merce_patatine`,
`merce_fritto`, `merce_pesce`, `merce_arancini`, `merce_sushi`,
`merce_maki`, `merce_pastone`, `merce_miele`. **`merce_sciarpa_lana` e
non `merce_sciarpa`**: `sciarpa` è l'addobbo da 🪙14, e `aspetta` in
`dati/coltivazioni.js` dice già il nome lungo.

## 5. `edifici_5.png` — la friggitoria e la fiera ✅

Fatto il 24 settembre 2026, anche lui a 1248×832 e con l'alone
leggero. Due divisori, uno per famiglia: la friggitoria sta accanto
alle botteghe (3,3), la fiera accanto alle decorazioni (5,6, preso
dallo spaventapasseri di tutti i giorni).

**Allegare:** `edifici_4.png` e `giardino.png` (la fiera sono
decorazioni, e devono stare accanto a quelle).

La peschiera stava in questo foglio e ne è uscita: è un recinto, e un
recinto si chiede accanto ai recinti (§6). Qui la regola «niente prato»
le avrebbe tolto il prato che hanno tutti gli altri, e in mappa sarebbe
sembrata una decorazione in mezzo a dieci macchine.

> Disegna un foglio di sprite in pixel art nello stesso stile di queste
> immagini: stessa tavolozza (legno caldo, tegole rosse e blu, pietra
> grigia), stesso contorno scuro di un pixel, stessa vista da tre quarti
> dall'alto, stessa luce da in alto a sinistra. La prima immagine sono
> gli edifici e la seconda le decorazioni del giardino: la friggitoria
> va accanto ai primi, le cose della fiera accanto alle seconde.
>
> Il foglio è 1536×1024 px, su fondo trasparente (PNG). Disponi 9
> soggetti su una griglia dichiarata di 3 colonne × 3 righe, celle di
> 512×341 px, ognuno centrato nella sua cella e appoggiato al bordo di
> sotto lasciando 16 px di margine. Nessun soggetto tocca il bordo della
> cella.
>
> Il disegno finisce dove il soggetto tocca terra. Sotto e di fianco è
> tutto trasparente: niente prato, niente terra, niente ciuffi d'erba,
> niente ombra proiettata, nessun alone o bagliore.
>
> NESSUNA PAROLA SCRITTA, da nessuna parte. Dove serve un'insegna è un
> oggetto.
>
> Quello che appartiene a un soggetto dev'essere attaccato al suo disegno
> in un pezzo solo: il vapore tocca il pentolone, le bandierine toccano
> il filo. Niente pezzetti staccati che galleggiano nel vuoto.
>
> Da sinistra a destra, riga per riga:
> 1. una friggitoria: chiosco di legno col tetto a spiovente a strisce gialle e bianche, un bancone aperto sul davanti con un grande pentolone d'olio e un filo di vapore, e un cono di patatine di legno come insegna sopra il tetto
>
> Gli altri otto sono le decorazioni di una fiera di paese, allegre, con
> gli stessi colori ricorrenti — rosso, giallo, azzurro e crema — perché
> sono una collezione:
> 2. un filo di bandierine triangolari colorate teso fra due pali di legno
> 3. una piccola giostra a cavalli di legno col tettuccio a spicchi
> 4. un carretto dello zucchero filato con una nuvola rosa sul bastoncino
> 5. un palo con tre lanterne di carta colorate appese
> 6. un tiro al barattolo: un bancone di legno con una piramide di barattoli colorati
> 7. un grande girasole di legno dipinto su un piedistallo
> 8. uno spaventapasseri vestito a festa, col cappello a punta a strisce e i nastri colorati sulle braccia
> 9. un piccolo palco di legno con un tamburo e una tromba appoggiati

Pezzi: `friggitoria`, `fiera_bandierine`, `fiera_giostra`,
`fiera_zucchero_filato`, `fiera_lanterne`, `fiera_barattoli`,
`fiera_girasole`, `fiera_spaventapasseri`, `fiera_palco`. Il
foglietto come `edifici_4.json` (`scala`, `"alone": 128`), e per le
decorazioni una `misura` a testa: stanno accanto a quelle del giardino,
non agli edifici.

## 6. `animali_3.png` — la peschiera

**Allegare:** `animali_2.png` (lo stagno delle anatre è il recinto
d'acqua da imitare).

Tre ritratti e non sei, come le specie di `animali_2`: `RECINTO()` in
`dati/catalogo.js` manda gli stati che mancano su quello calmo. Si
chiede **una riga sola**, come si era fatto per `campi_3`: il foglio
allegato fa da misura, e i tre riquadri escono della taglia degli altri
recinti. `animali_2.png` è RGB con la scacchiera **dipinta**, e un
generatore tende a ricopiarla: il prompt chiede l'alfa vero, e se torna
lo stesso con la scacchiera si ritaglia con `"fondo": "auto"`, come quello.

> Disegna un foglio di sprite in pixel art nello stesso stile di questa
> immagine, riquadro per riquadro identico nella forma: stessa
> staccionata di legno, stesso prato alla base coi fiorellini agli
> angoli, stessa misura dei riquadri, stessa vista dall'alto di tre
> quarti, stessa luce.
>
> Il foglio è 1536×1024 px su fondo trasparente vero (PNG con l'alfa),
> non una scacchiera disegnata. Una riga sola di tre riquadri, grandi e
> distanziati come quelli allegati, e il resto del foglio vuoto.
>
> È un recinto nuovo, la peschiera: dentro la staccionata, al posto
> degli animali, un laghetto rotondo d'acqua azzurra bordato di sassi,
> con tre pesci arancioni, una ninfea e un secchio di legno sulla riva.
> I tre riquadri sono lo stesso recinto in tre momenti, identici in
> tutto — la forma del laghetto, i sassi, la ninfea, il secchio — tranne
> quello che cambia:
> 1. tranquilla: i tre pesci nuotano sparsi nell'acqua
> 2. mangia: i tre pesci sono venuti a galla tutti insieme con la bocca aperta, verso dei granelli di becchime che galleggiano
> 3. dorme: l'acqua più scura e ferma, i pesci fermi sul fondo, una lucciola sulla ninfea, e la piccola Z azzurra in alto a destra come negli altri recinti che dormono
>
> NESSUN FUMETTO sopra i primi due riquadri: quelli dell'immagine
> allegata non vanno copiati. NESSUNA PAROLA SCRITTA. Nessun alone o
> bagliore attorno ai riquadri: i bordi sono netti, e fuori dal
> riquadro è tutto trasparente.

Pezzi: `recinto_pesci_calmo`, `recinto_pesci_mangia`,
`recinto_pesci_dorme`, con la `misura` dello stagno delle anatre
(72×56, e il riquadro che dorme più basso se torna senza fumetto sopra,
come i suoi). Poi `peschiera` in `dati/catalogo.js` passa a
`RECINTO('pesci')`, e `aspetta` diventa il pezzo.

## 7. Fuori dall'albero: `addobbi.png` — il collo e la schiena

**Allegare:** `cane-bobtail2.png` (il cane di casa, nelle tre viste).

Fiocco, sciarpa, campanella, mantellina e zainetto sono sospesi
(`sospeso: true` in `dati/addobbi.js`): un'emoji è disegnata per una
persona vista di fronte, e sul collo o sulla schiena di una bestia a
quattro zampe non si aggancia. Si rifanno **in tre viste** — di fronte,
di lato e di spalle, cioè i tre versi in cui la scena disegna una
bestia (`giu`, `lato`, `su`) — perché una mantellina di lato e una di
spalle sono due disegni diversi. Di fronte, che è la vista che si
guarda di più (`unita/addobbi` pretende un punto lì per ogni aggancio),
si disegna solo quello che spunta: un addobbo della schiena disegnato
intero sopra il petto sarebbe peggio dell'emoji.

**È l'unico foglio che vuole anche del codice**, oltre al foglietto:
`addosso()` in `scena/tela.js` oggi sa scrivere un'emoji e nient'altro.
Una riga di `ADDOBBI` dichiarerà un pezzo per verso al posto
dell'emoji, la scena lo posa col suo centro sul punto dell'aggancio, e
il di lato si ribalta insieme alla bestia, dentro la stessa
trasformazione. Cappelli e occhiali restano emoji: lì reggono (un punto
solo da rispettare), e metterli qui avrebbe più che raddoppiato un
foglio già difficile.

> Disegna un foglio di sprite in pixel art nello stesso stile del cane di
> questa immagine: stesso contorno scuro, stessa luce da in alto a
> sinistra, colori pieni e forme semplici.
>
> Sono cinque addobbi per le bestie di casa — cani, gatti, un coniglio —
> e ognuno va disegnato in tre viste, come starebbe addosso al cane
> dell'immagine: di fronte, di lato (guarda a destra) e di spalle. IL
> CANE NON SI DISEGNA: si disegna solo l'addobbo, come se lo portasse
> un cane invisibile, e la parte che resterebbe nascosta dietro il corpo
> non c'è.
>
> Il foglio è 1536×1024 px su fondo trasparente (PNG). Griglia
> dichiarata di 5 colonne × 3 righe, celle di 307×341 px, ogni addobbo
> centrato nella sua cella: una colonna per addobbo, e le righe sono le
> viste — in alto di fronte, in mezzo di lato, in basso di spalle. Ogni
> addobbo è grande, fra 150 e 250 px, e le sue tre viste sono alla
> stessa scala fra loro (nel gioco diventa largo 8–12 px: niente
> dettagli minuti, conta la sagoma).
>
> Nessuna ombra, nessun alone o bagliore, nessun fondo: fuori
> dall'addobbo è tutto trasparente. NESSUNA PAROLA SCRITTA. Quello che
> appartiene a un addobbo è attaccato al suo disegno in un pezzo solo.
>
> Da sinistra a destra, le colonne:
> 1. un fiocco di nastro rosa acceso. Di fronte: il fiocco a due anse con le code, sotto il mento, sul nastrino che gira attorno al collo. Di lato: il nastrino attorno al collo visto di fianco, col fiocco che sporge davanti. Di spalle: solo il nastrino che passa dietro il collo.
> 2. una sciarpa di lana rossa con le frange. Di fronte: avvolta attorno al collo, coi due capi che pendono sul petto, uno più lungo dell'altro. Di lato: avvolta attorno al collo, coi capi che pendono e svolazzano un poco indietro. Di spalle: il giro morbido della sciarpa dietro il collo.
> 3. un collarino verde con una campanella dorata. Di fronte: il collarino ad arco con la campanella tonda appesa al centro. Di lato: il collarino visto di fianco, con la campanella appesa davanti. Di spalle: solo il collarino, con la fibbia.
> 4. una mantellina blu col bordo dorato, allacciata al collo con un fermaglio d'oro. Di fronte: il fermaglio al collo e i due lembi blu che spuntano ai lati delle spalle. Di lato: stesa sulla schiena dal collo fino alla coda, che ricade morbida sul fianco. Di spalle: copre tutta la schiena, più larga in fondo.
> 5. uno zainetto giallo con la patta rossa. Di fronte: le due cinghie che scendono ai lati del petto e la cima dello zainetto che spunta dietro la testa. Di lato: lo zainetto appoggiato sulla schiena, con una cinghia che gira sotto la pancia. Di spalle: lo zainetto visto da dietro, con la patta, la tasca e le due cinghie.

Pezzi: `addobbo_<id>_giu`, `addobbo_<id>_lato`, `addobbo_<id>_su` per
`fiocco`, `sciarpa`, `campanella`, `mantellina` e `zainetto` — gli id
di `dati/addobbi.js`, che sono chiavi dei salvataggi e non si
rinominano. Se il di lato torna girato a sinistra, lo raddrizza
`specchia` nel foglietto come per `cane-bobtail2`.

Con questi quattro fogli **nessuna voce della fattoria aspetta più un
disegno**: le `aspetta` del catalogo e delle merci sono tutte qui, e
gli addobbi sospesi pure. Restano emoji i cappelli e gli occhiali, per
scelta; e restano i ripieghi scelti apposta fra i disegni che l'atlante
aveva già (il beverone nella cassetta, la pastura nella cesta, il
concime nel sacco), che non dichiarano niente perché non aspettano
niente.
