# Scheda di prompt — uno scenario del castello

Il calco è la scheda del sotterraneo
([`../../sotterraneo/generati/PROMPT-scenario.md`](../../sotterraneo/generati/PROMPT-scenario.md)),
che ha già pagato le sue lezioni: si chiede prima **una scena intera**,
poi **il foglio dei pezzi** con cui la si ricostruisce, e il prompt è
diviso in una **parte fissa** che non si tocca mai e un **blocco
SCENARIO** in fondo, che è l'unica cosa da cambiare per passare dal
bosco alle grotte, alle mura o alla palude.

Uno **scenario** è il vestito intero di un campo del tower defense: il
fondo, la strada, il fitto ai bordi, l'acqua, la bocca da cui arrivano i
mostri, le piazzole dove si costruisce, il castello da difendere, il
decoro e le cose per terra. Torri e mostri no: sono figure, e vengono
dopo (in fondo, «Dopo il terreno»).

**Cosa non va adesso**, e perché si rifà da zero invece di ritoccare:

- **`terreni.png` ha una provenienza che non si sa** (vedi
  `PROVENIENZA.txt`): sembra scaricato, non generato. Rifarlo chiude la
  questione;
- **le strade sono curve**, e sulla griglia delle tessere una curva non
  sta: il foglio doveva avere strade che toccano il bordo della cella in
  mezzo, a sinistra o a destra (`c`, `sx`, `dx`), e il campo si
  componeva come un sudoku che a volte non si chiudeva — e allora
  ripiegava, dichiarando i giunti storti;
- **sette materiali presi da un foglio solo**: il bosco e la palude
  sono lo stesso verde, le grotte e le mura la stessa pietra, e la
  sabbia non ha una strada che si legga.

## La scacchiera

È la decisione che rende tutto il resto semplice: **le strade vanno solo
a squadra, e sono larghe esattamente una cella.** Allora ogni cella del
campo è una cosa sola — fondo, strada, piazzola, acqua, fitto — e una
cella di strada ha solo da sapere **da quali lati prosegue**: dritta,
gomito, innesto a T, incrocio. Sono undici casi in tutto, e ci stanno
dentro un solo pezzo di strada dipinto tutto insieme (la «finestra» del
prompt 2): non c'è più niente da comporre come un sudoku e niente che
possa non chiudersi.

In più l'orlo della strada cade **sul bordo della cella**: la strada
occupa la cella intera, e i suoi bordi (sassi, ciuffi, assi) stanno
dentro la cella di strada, sul lato da cui la strada non prosegue. Così
fra una cella di strada e una di fondo c'è un bordo vero — dove finisce
la strada — e non una cucitura in mezzo al prato.

Quello che la scacchiera cambia nel gioco è in «Come si monta nel
gioco», in fondo.

## Il metodo: due prompt, nella stessa chat

1. **La scena** — un campo intero, più grande di quello del gioco (16×24
   celle contro 12×22) perché ci stiano tutti i casi insieme: due bocche,
   due strade che si uniscono, una strada che si attraversa da sé, i
   gomiti nei quattro versi, lo stagno, il fitto, il castello. È il
   bersaglio: dice in un colpo solo se lo scenario è quello giusto, e
   dipinta tutta insieme ha una luce e una tavolozza che stanno d'accordo.
2. **Il foglio** — gli stessi pezzi staccati su fondo trasparente,
   allegando la scena buona. È quello che si ritaglia davvero.

L'ordine conta, per lo stesso motivo del sotterraneo: un foglio chiesto
da solo esce coi pezzi belli uno per uno che non stanno insieme; chiesto
dopo la scena, copia la scena.

**Cosa allegare:**

| prompt | allegati |
|---|---|
| 1, la scena | [`PROMPT-scenario-pianta.png`](PROMPT-scenario-pianta.png) (dove sta ogni cosa) e, per il primo scenario, [`../../sotterraneo/generati/sotterraneo_1.png`](../../sotterraneo/generati/sotterraneo_1.png) come STILE — la mano delle cantine, così i due giochi sembrano dello stesso posto |
| 2, il foglio | la scena buona del prompt 1 e [`PROMPT-scenario-foglio.png`](PROMPT-scenario-foglio.png) (dove va ogni pezzo) |
| uno scenario nuovo | la scena buona dello scenario di prima al posto delle cantine, così la mano resta la stessa |

I due schemi li disegna `python3 strumenti/sprite/scacchiera.py`, e la
pianta **la legge da questa scheda** — dal prompt 1 — e controlla che
rispetti la regola della scacchiera: strada larga una cella (mai quattro
celle di strada in quadrato), nessun vicolo cieco, ogni piazzola accanto
alla strada, tutta la strada che arriva al castello. Se si cambia la
pianta qui, lo schema la segue. Colori piatti e nessuna linea di griglia,
apposta: una griglia disegnata tornerebbe come un prato a tabella.

I fogli si salvano qui accanto numerati — `castello_1.png`,
`castello_2.png` — e «Com'è andata», in fondo, dice di ognuno quale
scenario è, con quale prompt, e cosa è venuto bene.

## Prompt 1 — la scena

```text
Disegna in pixel art la schermata di un gioco di difesa della torre a 16 bit: un campo intero visto dall'alto a tre quarti, in proiezione ortogonale — niente prospettiva: le verticali restano verticali. Le cose alte (alberi, bocca, castello) si vedono un po' di fronte e salgono sulla cella di sopra; tutto il resto si vede da sopra.

Allego due immagini. La prima è lo STILE: stesso contorno scuro, stessa luce da in alto a sinistra, stessa cura — lo stile, non il posto. La seconda è la PIANTA: dice solo dove sta ogni cosa, e i suoi colori piatti non vanno copiati.

L'immagine è 1024×1536 px, verticale, su una griglia invisibile di 16 colonne × 24 righe di celle da 64×64 px: la stessa della pianta, cella per cella. Ogni cella contiene 16×16 pixel del disegno, cioè ogni pixel è un quadrato pieno di 4×4 px. LA GRIGLIA NON SI DISEGNA: nessuna linea fra una cella e l'altra, e il fondo continua da una cella all'altra come un terreno vero, non come una scacchiera di piastrelle.

COME È FATTA LA STRADA — vale ovunque, senza eccezioni:
- la strada va solo in orizzontale e in verticale, mai in diagonale e mai in curva morbida: gira ad angolo retto, dentro una cella;
- è larga esattamente una cella, sempre: i suoi bordi cadono esattamente sui bordi delle celle, dritti come un righello;
- l'orlo della strada (quello che la separa dal fondo) sta dentro la cella di strada, largo un pixel o due del disegno, e c'è solo sui lati da cui la strada non prosegue; dove la strada gira o si innesta in un'altra, l'orlo fa l'angolo;
- dove due strade si incontrano la cella è un innesto a T, dove si attraversano è un incrocio: la strada resta larga una cella anche lì, non si allarga mai in una piazza;
- due tratti di strada vicini hanno sempre almeno una cella di fondo in mezzo.

Le piazzole sono i posti dove il giocatore costruirà le torri: una cella ciascuna, vuote, piatte, ben distinguibili dal fondo, tutte uguali fra loro. Le bocche sono da dove arrivano i mostri: larghe tre celle e alte due, in cima al campo, con la strada che esce dal mezzo della loro riga di sotto. Il castello è in fondo: largo cinque celle, e la strada arriva al suo portone, che sta nel mezzo del muro di sopra — quello che guarda la strada.

La luce è piatta e uguale dappertutto: niente pozze di luce, niente angoli in ombra, niente vignettatura, niente nebbia. Il terreno è il fondo: colori più spenti e meno contrastati di tutto quello che ci camminerà sopra e ci verrà costruito sopra. La strada si deve leggere da lontano: più chiara o più scura del fondo, mai dello stesso tono.

Nella scena non c'è nessuno e non c'è niente da prendere: niente personaggi, mostri, torri, soldati, monete, gemme, armi. NESSUNA PAROLA SCRITTA, NESSUN NUMERO, NESSUNA INTERFACCIA.

La pianta, cella per cella, 16 caratteri per riga. È una guida per te, non va disegnata:
. fondo · , fondo con qualcosa in più (vedi «Il fondo qua e là») · ^ il fitto: non ci si passa e non ci si costruisce · ~ acqua, con la sua riva · d un decoro sparso, grande una cella · + strada · o piazzola vuota · A bocca da cui arrivano i mostri · C il castello

^^AAA^^,,,,AAA^^
^^AAA...,,.AAA^^
^..+.d......+..^
^..+.....d..+o.^
^..++++.....+..^
^.....+d.++++++^
....o.+..+..+.+^
.++++++,,+o.+d+^
.+.......+..+.+^
.+od.....++++.+^
.+.....d...o..+^
.+++++....,,.o+^
...o.+........+^
.....+..d.+++++.
.d,,.+....+.....
..,,.+o...+.~~..
...d.+...o+.~~~^
.....++++++.~~~^
^^.....+.....~~^
^^^....+d..d...^
^^^^...+....^^^^
^^^^.CCCCC.^^^^^
^^^^^CCCCC^^^^^^
^^^^^CCCCC^^^^^^
```

…e in coda **il blocco dello scenario**, copiato intero da «Gli
scenari» qui sotto.

La pianta non è un campo a caso: in 16×24 celle ci sono tutti i casi
che le tappe producono — due bocche e due strade che si uniscono in un
innesto a T davanti al castello (come le fogne e il torrione), una
strada che fa un cappio e **si attraversa da sé** (come il bastione:
l'incrocio è la cella `(12,5)`), i gomiti nei quattro versi, i dritti
nei due, una piazzola dentro il cappio, lo stagno accanto alla strada,
il fitto sui bordi e intorno al castello.

## Prompt 2 — il foglio

```text
Disegna il foglio dei pezzi (uno sprite sheet) con cui si costruisce ESATTAMENTE la scena allegata: stesso scenario, stessa tavolozza, stessa strada, stesso fondo, stessa luce piatta, stessa misura. La seconda immagine allegata è lo SCHEMA del foglio: dice dove va ogni pezzo e quanto è grande, e i suoi colori piatti non vanno copiati.

Il foglio è ORIZZONTALE, 1536×1024 px (più largo che alto), su FONDO TRASPARENTE (PNG), con la griglia della scena: celle da 64×64 px, e ogni pixel del disegno è un quadrato pieno di 4×4 px. Ogni pezzo sta staccato dagli altri da almeno mezza cella di trasparente. Nessuna ombra sotto i pezzi, nessun bagliore attorno, nessuna cornice. NESSUNA PAROLA SCRITTA, NESSUN NUMERO.

Dall'alto in basso:

1. I tre fondi, ognuno un quadrato di 4×4 celle che si ripete SENZA CUCITURE — il bordo destro continua nel sinistro, quello di sotto in quello di sopra — senza bordi e senza linee di griglia: il fondo, il fondo con qualcosa in più, e il fitto visto da sopra, pieno, senza un buco. A destra: i due specchi d'acqua della scena, interi con la loro riva e trasparenti attorno, uno di 3×3 celle e uno di 2×2; e due piazzole vuote, una cella ciascuna, uguali fra loro ma non identiche.

2. La finestra di strada: un pezzo di 5×5 celle col fondo nei buchi, dove la strada fa il giro di tutto il quadrato e una croce di strada lo divide in quattro. Contiene, nello stesso disegno, i quattro gomiti negli angoli, i quattro innesti a T a metà dei lati, l'incrocio nel mezzo e i dritti nei due versi: la strada è larga una cella, i bordi cadono sui bordi delle celle, e l'orlo sta dentro le celle di strada solo sui lati da cui non prosegue — sia verso l'esterno del quadrato, sia verso i quattro buchi. Accanto, la bocca da cui arrivano i mostri, tre celle per due, com'è nella scena. Accanto ancora, il castello: largo cinque celle e alto quattro — tre di pianta e una per le torri che salgono — col portone nel mezzo del muro di sopra.

3. Sei pezzi del fitto, ognuno largo una cella e alto due — da mettere lungo il suo bordo, dove il fitto confina col fondo: la parte di sotto poggia a terra, quella di sopra sale sulla cella di sopra. Poi sei decori sparsi, grandi una cella ciascuno: prima quelli che ci sono nella scena allegata, uno per tipo, poi altri a tua scelta dalla riga «Il decoro sparso» dello scenario.

4. Dodici cose per terra, ognuna dentro una cella, piatte sul fondo e SENZA NESSUN QUADRATO DI FONDO SOTTO: il trasparente arriva fino al bordo della cosa. Prese dalla riga «Per terra» dello scenario. Niente che si possa scambiare per una cosa da raccogliere.
```

…e in coda lo stesso blocco dello scenario del prompt 1, identico.

## Gli scenari

Il blocco va in fondo ai due prompt, e le righe sono sempre le stesse
quattordici: è quello che permette di confrontare due scenari e di
cambiarne uno pezzo per pezzo. Uno per campagna, per cominciare; le
cinque tappe di una campagna oggi hanno cinque tavolozze (il bosco
chiaro, il guado, la radura, il folto, la notte), e se una tavolozza
merita un vestito suo è un blocco in più con le stesse righe.

«Il decoro sparso» è dove il generatore ha mano libera, ed è voluto. Il
limite è uno solo e sta già nella parte fissa: niente che si possa
scambiare per una cosa da raccogliere, e qui anche **niente che sembri
una torre** — un bambino legge ogni cosa in scena come parte del
problema, e un campanile di decoro accanto a una piazzola è una torre
che non spara.

### Il bosco — si parte da qui

```text
SCENARIO: IL BOSCO
Atmosfera: un bosco luminoso di fine estate, allegro e un po' selvatico: il primo posto da difendere. Non fa paura.
Tavolozza: verde prato, verde scuro delle chiome, terra ocra, legno bruno, pietra grigio chiaro, un tocco di giallo nei fiori.
Il fondo: prato basso verde medio, con l'erba appena accennata, spento e uniforme.
Il fondo qua e là: il prato con qualche fiorellino giallo e bianco e un ciuffo d'erba più alto.
Il fitto: il bosco fitto visto da sopra, chiome tonde di querce e abeti una contro l'altra, verde scuro, senza vedere il terreno.
La strada: un sentiero di terra battuta ocra, con le ruote dei carri appena segnate e qualche sassolino.
L'orlo della strada: un filo di ciuffi d'erba e di sassi tondi.
L'acqua: uno stagno limpido verde-azzurro, con la riva di sabbia e canne.
La bocca: l'imbocco buio di una tana sotto le radici di un albero enorme, con le radici che fanno da arco.
Le piazzole: un tondo di assi di legno chiaro inchiodate, piatto, bordato di pietre.
Il castello: un piccolo castello di pietra chiara con i tetti conici blu, le bandiere rosse e il portone di legno con la grata alzata.
Il decoro sparso: cespugli tondi, un ceppo tagliato, un masso coperto di muschio, una staccionata spezzata, un tronco caduto, una cassetta di legno per le api.
Per terra: foglie, fiori, trifogli, sassolini, un ciuffo d'erba, un ramo secco.
```

### Le grotte

```text
SCENARIO: LE GROTTE
Atmosfera: le gallerie sotto la montagna — una grotta, una miniera abbandonata, le fogne, una cripta: si capisce di essere sotto terra, ma è un posto da esplorare, non da temere.
Tavolozza: grigio-bruno della roccia, ocra della terra, legno scuro delle travi, un filo di azzurro nell'acqua e nei cristalli; di caldo solo le lanterne.
Il fondo: il pavimento della caverna, roccia grigio-bruna liscia e un po' polverosa.
Il fondo qua e là: la stessa roccia con piccole crepe e qualche macchia di ghiaia.
Il fitto: la roccia viva della montagna vista da sopra, massi scuri incastrati uno nell'altro, senza vedere il pavimento.
La strada: una galleria di terra battuta con due binari di miniera che la percorrono nel verso della strada; negli innesti e negli incroci i binari si incrociano.
L'orlo della strada: una fila di sassi squadrati e, ogni tanto, il piede di una trave di sostegno.
L'acqua: una pozza sotterranea scura e ferma, con la riva di roccia bagnata.
La bocca: un buco nero nella parete di roccia, puntellato da tre travi di legno.
Le piazzole: una lastra di pietra squadrata, piatta, con i quattro angoli segnati da un chiodo di ferro.
Il castello: la rocca scavata nella montagna: un muro di pietra squadrata con due torri tozze, lanterne accese ai lati e il portone di ferro con la grata alzata.
Il decoro sparso: stalagmiti basse, un carrello da miniera rovesciato, un mucchio di assi, una lanterna spenta su un palo, una roccia con cristalli azzurri grandi come un pugno chiuso (mai piccoli come una gemma), un secchio.
Per terra: ghiaia, crepe, schegge di roccia, polvere, un'asse spezzata, una pozzanghera piccola.
```

### Le mura

```text
SCENARIO: LE MURA
Atmosfera: dentro le mura di una città fortificata, fra il cortile, i camminamenti e il borgo: ordinata, di pietra, solenne ma non cupa.
Tavolozza: pietra beige e grigio caldo, lastre più chiare, tetti rosso mattone e ardesia, legno bruno, stendardi blu.
Il fondo: il lastricato del cortile, lastre di pietra beige di misure diverse, con le fughe appena più scure.
Il fondo qua e là: lo stesso lastricato con qualche ciuffo d'erba fra le lastre e una lastra crepata.
Il fitto: i tetti del borgo visti da sopra, fitti uno contro l'altro, coppi rossi e ardesia grigia, senza vedere il cortile.
La strada: una via di ciottoli tondi grigi, più scura del lastricato.
L'orlo della strada: un cordolo di pietre lunghe squadrate.
L'acqua: una vasca di pietra rettangolare con l'acqua azzurra, bordata di marmo chiaro.
La bocca: una breccia nelle mura, con i blocchi crollati ai lati e il buio dietro.
Le piazzole: una piattaforma rotonda di pietra levigata, con un anello di mattoni.
Il castello: il mastio del re: una torre quadrata alta con i merli, due torri più piccole ai lati, stendardi blu e il portone con la grata alzata.
Il decoro sparso: botti in piedi, un carro senza cavallo, un pozzo di pietra, una rastrelliera vuota, una pila di sacchi, un albero in un'aiuola di pietra.
Per terra: paglia, ciottoli smossi, una lastra spaccata, foglie, un secchio rovesciato, una ruota di carro.
```

### La palude

```text
SCENARIO: LA PALUDE
Atmosfera: una palude calma all'alba, verde e umida, piena di acqua ferma e di canne: misteriosa ma gentile, con le lucciole e non con i teschi.
Tavolozza: verde oliva, verde acqua, bruno del fango, legno grigio consumato, lilla dei fiori di palude.
Il fondo: erba bassa e fangosa verde oliva, spenta.
Il fondo qua e là: la stessa erba con pozzette di fango e qualche fiore lilla.
Il fitto: il canneto visto da sopra, canne alte e fitte verde-giallo, senza vedere il terreno.
La strada: una passerella di assi di legno grigio, messe di traverso nel verso della strada, appoggiata sul fango.
L'orlo della strada: i pali corti che reggono la passerella, e un filo di fango.
L'acqua: acqua ferma verde-bruna, con le ninfee e la riva di fango e canne.
La bocca: un tronco cavo enorme e marcio, coricato, con l'apertura buia rivolta verso la strada.
Le piazzole: una piattaforma quadrata di tronchi legati, piatta, su quattro pali.
Il castello: un castello di legno e pietra su un isolotto, con la palizzata di tronchi appuntiti, due torrette col tetto di paglia e il portone di legno.
Il decoro sparso: salici piangenti bassi, ceppi con i funghi a mensola, una barca rovesciata, un mucchio di canne tagliate, un pontile rotto, una lanterna di carta appesa a un palo.
Per terra: fango, ninfee secche, sassi coperti di muschio, un ramo, fiori lilla, un ciuffo di canne.
```

## Come si guarda se è venuto bene

Quattro controlli, in quest'ordine — e nessuno dei quattro è «è bello»:

1. **La scacchiera.** Sovrapposta una griglia da 64 px (sul foglio
   ridotto, e a occhio sulla scena), i bordi della strada cadono sui
   bordi delle celle, e la strada è larga una cella anche negli innesti e
   nell'incrocio. Dove si rompe di solito: la strada che si allarga
   negli incroci, i gomiti arrotondati che escono dalla cella, la strada
   che sbanda di mezza cella. Se sbanda la scena resta buona come
   bersaglio, ma i pezzi si prendono dal foglio.
2. **L'orlo.** Nella finestra ogni cella di strada ha l'orlo solo dove
   non prosegue: è quello che permette di prenderne una qualsiasi e
   metterla accanto a un'altra. Un orlo in mezzo a un dritto, o un gomito
   senza l'angolo interno, e quella cella non si può usare.
3. **Il fondo non è una tabella**: nessuna linea regolare ogni 64 px.
4. **La prova dei trenta pixel.** Ridotta come in partita — una cella a
   una trentina di pixel dello schermo, cioè il campo largo quanto un
   telefono — con una torre e un mostro posati sopra: la strada si legge
   da lontano, le piazzole si vedono senza cercarle, e il fondo non ruba
   l'occhio alle figure.

## Come si monta nel gioco

Il gioco va **rifatto** quando le immagini ci sono. La bozza in
`src/giochi/castello/` (gioco sperimentale `castello`: mostra i campi
delle venti tappe a tessere, non si gioca) è rimasta indietro rispetto
al gioco vero `torri` — non ha le quattro partite libere, la palude, i
regali, i rami — e soprattutto è costruita sulle strade curve. Cosa
cambia con la scacchiera:

- **le strade delle tappe diventano spezzate a squadra sulla
  scacchiera** (12×22 celle): angoli in celle intere invece di punti
  0–1 sul riquadro. Il motore cammina da centro a centro di cella, le
  piazzole sono celle accanto alla strada, e siccome la geometria
  cambia si rilancia `npm run tara` — la firma se ne accorge da sé;
- **una cella di strada prende il suo pezzo dalla finestra** secondo i
  lati da cui prosegue: undici casi, una tabella di undici righe. I
  dritti ci sono sei volte per verso, quindi si alternano per posto e un
  rettifilo lungo non si legge come una tabella;
- **i fondi sono quadrati di 4×4 celle**: ogni cella prende il suo
  pezzo del quadrato, come nel sotterraneo (`ritaglio` di
  `grafica/atlante.js`);
- **il fitto** è il suo fondo, e lungo il bordo, dove confina col prato,
  ci si posano i sei pezzi alti: coprono la cucitura e fanno da quinta;
- **uno scenario è una voce di `SCENARI`**, con le stesse chiavi per
  tutti, e la campagna dichiara il suo: com'è in
  `src/giochi/sotterraneo/dati/tessere.js`;
- il foglio si ritaglia con `atlante.py` e un foglietto accanto
  (`castello_2.json`, una `misura` per pezzo come `sotterraneo_2.json`):
  `terreni.py` e le tessere a etichette (`sx`, `dx`, `c`) servono solo
  alle strade curve, e con la scacchiera si possono lasciare andare.

## Dopo il terreno: le figure

Con lo scenario del bosco fatto, la sua scena diventa lo STILE delle
figure — che non dipendono dal terreno, e si chiedono una volta sola
per tutti. Quante sono lo dice il gioco, non questa scheda:

- **le torri** (`TORRI` in `src/data/ops.js`): quattro — arciere,
  magica, ghiaccio, bombe — con tre stadi (livelli 1-3, 4-6, 7-10) e due
  rami dal quarto livello. Cioè cinque figure per torre: com'è nata, e
  per ogni ramo cresciuta e al massimo. Venti in tutto, alte una cella e
  mezza su una piazzola;
- **i mostri** (`MOSTRI` in `src/data/mostri.js`): diciotto, cinque dei
  quali volano. Camminano a squadra, quindi servono di lato (la sinistra
  è la destra specchiata) e di fronte, qualche passo ciascuno;
- **i colpi restano procedurali**, com'era deciso: nei fogli non c'è un
  proiettile, e lì il vettoriale è meglio.

Le loro schede si scrivono quando c'è la scena del bosco, perché è lei
che si allega.

## Le trappole già note

Dalle schede della fattoria e del sotterraneo, che sono state pagate:

- **Le scritte**: vanno vietate in maiuscolo, e funziona dire cosa
  disegnare più che cosa non disegnare. In un foglio di pezzi il
  generatore ha voglia di scrivere le etichette («ROAD», «TOWER»).
- **Il foglio torna verticale** anche se lo si chiede orizzontale: al
  sotterraneo è successo. Qui la prima riga lo dice in maiuscolo; se
  torna verticale lo stesso, si ritaglia lo stesso con una `misura` per
  pezzo.
- **Il fondo trasparente** torna quasi sempre con un alone colorato
  attorno ai pezzi: lo toglie `"alone": 128` nel foglietto
  (`FORMATO.md`). Se torna una scacchiera dipinta, è da rifare.
- **Le cose per terra con un quadrato di fondo sotto**: al sotterraneo
  metà sono tornate così e sono rimaste fuori. Qui il prompt lo vieta
  già.
- **Il ritocco ha un tetto di passaggi**: una o due correzioni mirate
  funzionano, poi il generatore ricomincia a inventare. Esaurito il
  tetto si riparte da zero, allegando l'ultima buona.
- **Il prompt si conserva nel foglietto** del foglio che ne esce, campo
  `prompt`, **nello stesso momento** in cui si salva il PNG — e così
  com'è stato mandato, blocco dello scenario compreso.

## Com'è andata

Ancora niente: nessuna scena e nessun foglio generati. Quando arrivano,
qui va scritto di ognuno quale scenario è, con quale prompt e quali
allegati, e cosa è venuto bene e cosa no — com'è nella scheda del
sotterraneo.
