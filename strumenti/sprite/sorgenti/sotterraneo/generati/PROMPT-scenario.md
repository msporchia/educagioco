# Scheda di prompt — uno scenario del sotterraneo

Uno **scenario** è il vestito intero di un sotterraneo: tetto, muri,
pavimenti, porte, scale, fontana, mercante, arredo e le cose per terra.
Oggi ce n'è uno solo, ed è il motivo per cui questa scheda esiste.

**Cosa non va adesso**, visto disegnando un piano intero col codice vero:

- **tutta la roccia è muro di mattoni.** Il set 0x72 disegna la parete di
  fronte alta due celle (la faccia, e sopra il coronamento), e fra due
  corridoi paralleli la roccia è spessa una cella sola: il coronamento non
  ha dove stare. Per non lasciare buchi, `scena/tela.js` dipinge di
  mattoni ogni cella di roccia che tocca il pavimento, e il risultato è un
  mare di muro in cui non si capisce dove finisce una parete;
- **il pavimento è una tabella**: una piastrella sola, col suo bordo,
  ripetuta — lo diceva già il commento di `SUOLI`;
- **tre mani nella stessa stanza**: le tessere di 0x72, porte e mostri
  dei fogli generati, e le emoji della fontana e del mercante.

Il prompt è diviso in due, ed è quello che lo rende gestibile: una
**parte fissa** — la griglia, la regola del muro, la luce, i divieti —
che non si tocca mai, e un **blocco SCENARIO** in fondo, che è l'unica
cosa da cambiare per avere la cripta, la fornace o la grotta. Si parte
dalle cantine.

## Il metodo: due prompt, nella stessa chat

1. **La scena** — un pezzo di sotterraneo intero, come lo vedrebbe un
   bambino sul telefono. È il bersaglio: dice in un colpo solo se lo
   scenario è quello giusto, e dipinta tutta insieme ha una luce, una
   tavolozza e dei muri che stanno d'accordo fra loro. Se esce pulita
   sulla griglia, i pezzi si possono anche ritagliare da lì.
2. **Il foglio** — gli stessi pezzi staccati su fondo trasparente,
   allegando la scena buona: «i pezzi con cui si costruisce questa». È
   quello che si ritaglia davvero: i fondi senza cuciture, le facce in
   fila, le porte una per una.

L'ordine conta. Un foglio chiesto da solo esce con i pezzi belli uno per
uno e che non stanno insieme; chiesto dopo la scena, copia la scena — e
un generatore copia uno stile allegato molto meglio di quanto lo segua
descritto a parole.

**Cosa allegare:**

| prompt | allegati |
|---|---|
| 1, la scena | [`bottino-e-arredo.png`](bottino-e-arredo.png) (lo stile: porte, forzieri e torce che già ci sono) e [`PROMPT-scenario-pianta.png`](PROMPT-scenario-pianta.png) (dove sta ogni cosa) |
| 2, il foglio | la scena buona del prompt 1 e [`PROMPT-scenario-foglio.png`](PROMPT-scenario-foglio.png) (dove va ogni pezzo) |
| uno scenario nuovo | la scena buona dello scenario di prima al posto di `bottino-e-arredo.png`, così la mano resta la stessa |

I due schemi li disegna `python3 strumenti/sprite/scenario.py`, e la
pianta **la legge da questa scheda** — dal prompt 1 — e controlla che
rispetti la regola del muro: esiste in un posto solo, e se la si cambia
qui lo schema la segue. Sono in colori piatti e senza linee di griglia
apposta: un generatore copia quello che vede, e una griglia disegnata
nello schema tornerebbe come un pavimento a tabella.

I fogli si salvano qui accanto numerati — `sotterraneo_1.png`,
`sotterraneo_2.png` — e «Com'è andata», in fondo, dice di ognuno quale
scenario è, con quale prompt, e cosa è venuto bene.

## La regola del muro

È la parte che risolve il difetto, e sta nella parte fissa dei due
prompt:

- la roccia si vede **da sopra**: è il tetto dei muri, e dove confina col
  pavimento ha **un bordo chiaro**;
- solo dove **sotto** una cella di roccia c'è pavimento si vede **la
  faccia** del muro, alta **una cella** col suo coronamento;
- i muri ai lati e in basso non hanno faccia: solo il bordo.

Con la faccia alta una cella, qualunque muro sta in una cella di
spessore: un muro fra due corridoi mostra il coronamento da una parte e
la faccia dall'altra, e non c'è più niente da riempire. La porta prende
il verso **dal muro in cui sta**: di fronte nella fila delle facce, di
taglio in un muro laterale — oggi una porta di fianco è disegnata di
fronte, girata verso chi guarda dentro un muro che va dall'alto in
basso.

## Prompt 1 — la scena

```text
Disegna in pixel art la schermata di un gioco di ruolo a 16 bit: un pezzo di sotterraneo visto dall'alto a tre quarti, in proiezione ortogonale — niente prospettiva: le verticali restano verticali e i muri laterali non si vedono di sbieco.

Allego due immagini. La prima è lo STILE: porte, forzieri e torce di questo gioco — stesso contorno scuro, stessa luce da in alto a sinistra, stessa cura. La seconda è la PIANTA: dice solo dove sta ogni cosa, e i suoi colori piatti non vanno copiati.

L'immagine è 1024×1536 px, verticale, su una griglia invisibile di 16 colonne × 24 righe di celle da 64×64 px: la stessa della pianta, cella per cella. Ogni cella contiene 16×16 pixel del disegno, cioè ogni pixel è un quadrato pieno di 4×4 px. Muri, porte e cambi di pavimento cadono esattamente sui bordi delle celle. LA GRIGLIA NON SI DISEGNA: nessuna linea fra una cella e l'altra, e il pavimento continua da una cella all'altra come un pavimento vero, non come una scacchiera di piastrelle.

COME SI VEDONO I MURI — vale ovunque, senza eccezioni:
- la roccia non scavata si vede da sopra: è il tetto dei muri, e dove confina con il pavimento ha un bordo chiaro largo due pixel;
- dove sotto una cella di roccia c'è pavimento, di quella cella si vede la faccia del muro, di fronte, alta esattamente una cella, con in cima un filo chiaro: il coronamento;
- i muri ai lati delle stanze e dei corridoi, e quelli in basso, NON mostrano la faccia: se ne vede solo il bordo chiaro del tetto;
- nessun muro è alto più di una cella, e un muro spesso una cella sola mostra il coronamento da una parte e la faccia dall'altra.

Le porte ad arco sono larghe una cella e stanno nella fila delle facce; il loro arco sale di mezza cella sul tetto.

La luce è piatta e uguale dappertutto: niente pozze di luce sul pavimento, niente angoli in ombra, niente vignettatura, niente nebbia. Le fiamme ci sono ma non illuminano niente: la luce la mette il gioco. Il terreno è il fondo: colori più spenti e meno contrastati di tutto quello che ci camminerà sopra.

Nella scena non c'è nessuno e non c'è niente da prendere: niente personaggi, mostri, monete, gemme, chiavi, pozioni, armi, forzieri. NESSUNA PAROLA SCRITTA, NESSUN NUMERO, NESSUNA INTERFACCIA.

L'arredo del posto mettilo dove ha senso: contro i muri e negli angoli, mai nei corridoi, lasciando libero il centro delle stanze. Se ti viene in mente altro che renda vivo un posto così, aggiungilo — con un limite solo: niente che si possa scambiare per una cosa da raccogliere.

La pianta, cella per cella, 16 caratteri per riga. È una guida per te, non va disegnata:
# tetto · = faccia del muro · t faccia con una torcia accesa · g faccia con una grata · . pavimento delle stanze · , pavimento dei corridoi · o pavimento speciale · A porta aperta · P porta chiusa · L porta chiusa in un muro laterale, vista da sopra: l'anta di traverso nel varco · l la stessa aperta, accostata al muro · F fontanella · S scala che scende: un buco quadrato con i gradini che vanno giù nel buio

################
################
######===t==####
######,,,,,,####
###===A===#,####
###.......#,####
#==.......#,####
#,L.......#,####
#,#.......#,####
#,#.......#,####
#,#########,####
#,#########,####
#,#########,####
#,#########,####
#,#==t==g==P=###
#,#..........###
#,=....#.....###
#,looo.=.....###
###oFo.......###
###ooo.....S.###
###..........###
========P#######
,,,,,,,,,#######
################
```

…e in coda **il blocco dello scenario**, copiato intero da «Gli
scenari» qui sotto.

La pianta non è un piano a caso: in 16×24 celle ci sono tutti i casi
che il generatore dei livelli produce davvero — il muro spesso una
cella fra un corridoio e una stanza (in alto, e in fondo), quello
verticale fra la stanza e il corridoio a destra, il moncone sopra una
porta laterale, un pilastro in mezzo a una stanza, le porte nei tre
versi, gli angoli dentro e fuori.

## Prompt 2 — il foglio

```text
Disegna il foglio dei pezzi (uno sprite sheet) con cui si costruisce ESATTAMENTE la scena allegata: stesso scenario, stessa tavolozza, stessi muri, stessi pavimenti, stesso tetto, stessa luce piatta, stessa misura. La seconda immagine allegata è lo SCHEMA del foglio: dice dove va ogni pezzo e quanto è grande, e i suoi colori piatti non vanno copiati.

Il foglio è 1536×1024 px su FONDO TRASPARENTE (PNG), con la griglia della scena: celle da 64×64 px, e ogni pixel del disegno è un quadrato pieno di 4×4 px. Ogni pezzo sta staccato dagli altri da almeno mezza cella di trasparente. Nessuna ombra sotto i pezzi, nessun bagliore attorno, nessuna cornice. NESSUNA PAROLA SCRITTA, NESSUN NUMERO.

Dall'alto in basso:

1. I quattro fondi, ognuno un quadrato di 4×4 celle che si ripete SENZA CUCITURE — il bordo destro continua nel sinistro, quello di sotto in quello di sopra — senza bordi e senza linee di griglia: il pavimento delle stanze, quello dei corridoi, quello speciale, e il tetto com'è lontano dai bordi (senza il bordo chiaro e senza i sassi che lo accompagnano). A destra: due scale che scendono, una aperta e una chiusa da una grata di ferro col lucchetto; e due fontanelle alte una cella e mezza, una piena d'acqua e una asciutta, con la vasca vuota e crepata.

2. Le facce del muro, alte una cella col loro coronamento: una fila lunga sei celle che si ripete senza cuciture; una fila lunga due celle che finisce ai due capi con uno spigolo di pietre squadrate; una faccia sola, larga una cella, con i due spigoli. Poi sei facce di una cella che si mettono in fila con le altre: con una torcia accesa nel suo sostegno, con una grata di ferro, con la pietra crepata, e le tre della riga «Sui muri» dello scenario.

3. Due pezzi di sotterraneo interi, disegnati come nella scena. La stanzetta, 5×4 celle: il tetto tutto intorno, la fila di facce in alto, sotto una fila di pavimento. Il pilastro, 5×4 celle: un blocco di roccia largo tre celle in mezzo al pavimento, col tetto e il bordo chiaro sopra e ai lati, e sotto la sua fila di facce. Accanto, le porte: sei porte ad arco, ognuna una cella di faccia del muro con la porta dentro e l'arco che sale di mezza cella sopra il coronamento — semplice; rinforzata di ferro; ricca, con la cornice e le borchie d'oro; minacciosa, con un piccolo teschio sopra l'arco; chiara e accogliente; e la stessa porta aperta, che si vede aperta: l'anta girata contro lo stipite, e dentro l'arco il buio del passaggio. Sotto, le stesse sei come stanno in un muro laterale: viste da sopra, di taglio — l'anta è una tavola stretta in verticale in mezzo alla cella, trasparente attorno.

4. Il mercante: un incappucciato dietro il suo banchetto, largo e alto una cella e mezza, in due pose (fermo, e che alza la mano per salutare). Poi l'arredo del posto, ogni pezzo da solo: prima quello che c'è nella scena allegata, uno per tipo, poi altri a tua scelta fino a sette pezzi; fissi, grandi da una a due celle.

5. Dodici cose per terra, ognuna dentro una cella e piatta sul pavimento: due crepe, una pozzanghera, dei sassolini, una ragnatela per l'angolo in alto a sinistra e la stessa per l'angolo in alto a destra, e sei dalla riga «Per terra» dello scenario. Niente che si possa scambiare per una cosa da raccogliere.
```

…e in coda lo stesso blocco dello scenario del prompt 1, identico.

## Gli scenari

Il blocco va in fondo ai due prompt, e le righe sono sempre le stesse
undici: è quello che permette di confrontare due scenari e di
cambiarne uno pezzo per pezzo. «Sui muri» e «Per terra» riempiono le
caselle che la parte fissa lascia libere; «L'arredo del posto» è
dove il generatore ha mano libera, ed è voluto — quello che inventa
lui spesso è la cosa che rende vivo il posto. Il limite è uno solo e sta
già nella parte fissa: niente che si possa scambiare per una cosa da
raccogliere (vedi la memoria sul decoro che confonde: un bambino legge
ogni oggetto in scena come parte del problema).

Quale discesa usa quale scenario **è da decidere**: oggi il gioco ne ha
uno solo, e agganciarli sarà una riga per tappa in `dati/campagna.js`.

### Le cantine — si parte da qui

```text
SCENARIO: LE CANTINE
Atmosfera: la cantina sotto un vecchio castello, calda e un po' polverosa: il primo posto in cui si scende. Non fa paura, incuriosisce.
Tavolozza: mattoni bruno-rossicci, pietra grigio-beige, legno scuro, un filo di verde muschio.
Il tetto: terra battuta bruno scura, quasi nera, con qualche sasso e qualche radice.
La faccia del muro: mattoni bruno-rossicci irregolari, qualcuno più chiaro o scheggiato; il coronamento è una fila di pietre grigio-beige.
Il pavimento delle stanze: lastroni di pietra grigio-beige di misure diverse (due celle per due, una per due, una per una), con le fughe scure di un pixel.
Il pavimento dei corridoi: mattoncini bruno chiaro a spina di pesce.
Il pavimento speciale: un mosaico di tessere ocra e azzurre a cerchi.
Le porte: quercia scura con le borchie di ferro.
Sui muri: il muschio che cola, un arco di mattoni murato, una mensola di legno vuota.
Per terra: paglia, colature di cera, chiazze di muschio, schegge di mattone, polvere, una radice che spunta.
L'arredo del posto: grandi botti coricate sul cavalletto, scaffali di legno vuoti, un tavolaccio con la panca, una pila di legna, una vecchia macina di pietra.
```

### La cripta — più dark

```text
SCENARIO: LA CRIPTA
Atmosfera: la cripta sotto una chiesa abbandonata, fredda e silenziosa. È più buia delle cantine ma si legge tutto: il pavimento si distingue sempre dal tetto.
Tavolozza: grigio-blu freddo, pietra verdastra, ferro scuro, qualche filo d'argento; di caldo ci sono solo le fiamme.
Il tetto: roccia nero-bluastra, liscia, con qualche crepa.
La faccia del muro: grandi blocchi squadrati di granito grigio-blu; il coronamento è una cornice di pietra scolpita semplice.
Il pavimento delle stanze: grandi lastre di ardesia grigio-blu, un po' sconnesse.
Il pavimento dei corridoi: pietre strette e lunghe messe di traverso, consumate dai passi.
Il pavimento speciale: lastre chiare con una stella a otto punte incisa.
Le porte: ferro battuto scuro, con le borchie.
Sui muri: una nicchia vuota ad arco, il bassorilievo di un cavaliere, l'edera secca.
Per terra: polvere, foglie secche, lastre spaccate, cera colata, una grata di scolo, calcinacci.
L'arredo del posto: sarcofagi di pietra chiusi, statue di cavalieri addormentati, colonne spezzate, candelabri alti di ferro.
```

### La fornace — più diabolica

```text
SCENARIO: LA FORNACE
Atmosfera: le fucine dei diavoletti sotto un vulcano: rossa e nera, calda, un po' minacciosa ma da cartone animato. Niente sangue, niente simboli.
Tavolozza: nero, rosso cupo, arancio di brace, ferro brunito.
Il tetto: roccia vulcanica nera e porosa, con qualche crepa rosso cupo.
La faccia del muro: mattoni neri anneriti dal fumo, con le fughe color brace; il coronamento è una fascia di ferro chiodato.
Il pavimento delle stanze: basalto a esagoni neri, con le fughe rosso spento.
Il pavimento dei corridoi: lastre di ferro scuro rivettate.
Il pavimento speciale: una piattaforma di ferro a raggiera, arancio spento.
Le porte: ferro nero, con due corna ricurve sopra l'arco.
Sui muri: una colata di lava rappresa, un mantice appeso, una testa di gargoyle che sbuffa fumo.
Per terra: cenere, crepe che brillano appena, sassi neri, braci spente, fuliggine, una scoria di ferro.
L'arredo del posto: calderoni sulle braci, incudini, catene appese, statue di gargoyle, bocche di fornace chiuse da una grata.
```

### La grotta di cristallo — più fantasy

```text
SCENARIO: LA GROTTA DI CRISTALLO
Atmosfera: una grotta incantata dove vivono le fate, fresca e luminosa, con le radici di un albero enorme che scendono dall'alto.
Tavolozza: azzurro, lilla, verde muschio, bianco perla; mai nero pieno.
Il tetto: roccia viola scura con chiazze di muschio che brilla appena e qualche radice.
La faccia del muro: pietra azzurra levigata con vene di cristallo; il coronamento è di radici intrecciate.
Il pavimento delle stanze: lastre di pietra chiara con foglie d'argento intarsiate.
Il pavimento dei corridoi: muschio morbido con sassi piatti.
Il pavimento speciale: un cerchio di tessere di madreperla a spirale.
Le porte: legno chiaro di rami intrecciati, con una foglia d'argento sopra l'arco.
Sui muri: un grande cristallo incastonato, una radice che scende, una cascatella sottile.
Per terra: funghetti luminosi, petali, ciuffi d'erba, sassi tondi, muschio chiaro, un rigagnolo.
L'arredo del posto: grandi formazioni di cristallo alte due celle (mai piccole come una gemma), radici che salgono dal pavimento, statue di cervo, lanterne delle fate appese, una panchina di pietra coperta di muschio.
```

## Come si guarda se è venuto bene

Quattro controlli, in quest'ordine — e nessuno dei quattro è «è bello»:

1. **La regola del muro.** Dove si rompe di solito: facce disegnate
   anche sui muri laterali, muri alti due celle, muri laterali visti in
   prospettiva. Si confronta con la pianta: una faccia dove la pianta ha
   `#` è un difetto, e si chiede come ritocco («mostrano la faccia solo
   le celle di roccia che hanno del pavimento sotto; non toccare
   altro»).
2. **La griglia.** Sovrapposta una griglia da 64 px, ogni muro e ogni
   porta cadono sul bordo di una cella. Se la griglia scivola la scena
   resta buona come bersaglio, ma i pezzi si prendono dal foglio.
3. **Il pavimento non è una tabella**: nessuna linea regolare ogni
   64 px, nessuna piastrella col suo bordo.
4. **La prova dei sedici pixel.** Ridotta di quattro e ingrandita di
   tre, come in partita, col cavaliere e un mostro posati sopra: se il
   terreno ruba l'occhio alle figure è troppo acceso, e il bambino non
   vede più cosa si tocca.

## Come si monta nel gioco

- **La cella del gioco resta di 16 px**: ogni pezzo del foglio si riduce
  alla sua `misura` in pixel di gioco, come i mostri, e l'eroe e le cose
  restano quelli di prima.
- **I fondi sono quadrati di 4×4 celle**, non piastrelle: ogni cella
  prende il suo pezzo del quadrato (`ritaglio` di `grafica/atlante.js`),
  e il pavimento smette di essere una tabella senza bisogno di varianti a
  caso.
- **Il muro** lo decide `scena/muri.js` con la regola qui sopra, e lo
  prova `unita/muri-sotterraneo` sui piani veri; `scena/tela.js` ci mette
  i pezzi. I bordi sono blocchi di pietra presi dalla stanzetta, e gli
  angoli si compongono per quarto di cella.
- **Le porte scelgono il verso** dal muro in cui stanno.
- **La scala con la grata** finché la chiave non è presa
  (`chiaveDelPiano`), e **la fonte asciutta** invece di una fonte che
  sparisce dopo il sorso.
- **Uno scenario è una voce di `SCENARI`** in `dati/tessere.js`, e tutte
  le voci hanno le stesse chiavi: per la cripta si genera, si ritaglia
  col suo foglietto e si aggiunge una voce. Quale discesa indossa quale
  scenario resta da decidere; per ora tutte indossano le cantine.
- L'eroe resta di 0x72, ed è l'ultimo pezzo di quel set: adesso è la
  prossima cosa che non combacia.

## Le trappole già note

Dalle schede della fattoria, che sono state pagate:

- **Le scritte**: vanno vietate in maiuscolo, e funziona dire cosa
  disegnare più che cosa non disegnare. In un foglio di pezzi il
  generatore ha voglia di scrivere le etichette («FLOOR», «WALL»).
- **Il fondo trasparente** torna quasi sempre con un alone colorato
  attorno ai pezzi: lo toglie `"alone": 128` nel foglietto
  (`FORMATO.md`). Se torna una scacchiera dipinta, è da rifare.
- **Il ritocco ha un tetto di passaggi**: una o due correzioni mirate
  funzionano, poi il generatore ricomincia a inventare. Esaurito il
  tetto si riparte da zero, allegando l'ultima buona.
- **Il prompt si conserva nel foglietto** del foglio che ne esce, campo
  `prompt`, **nello stesso momento** in cui si salva il PNG — e così
  com'è stato mandato, blocco dello scenario compreso.

## Com'è andata

### `sotterraneo_1.png` — la scena delle cantine ✅

24 settembre 2026, ChatGPT: il prompt 1 col blocco delle cantine,
allegati `bottino-e-arredo.png` e la pianta. Se il testo mandato è
diverso da quello di questa scheda, va scritto qui: è la spiegazione
dei difetti che il foglio si porta dietro. 1024×1536, RGB.

- **La regola del muro è rispettata dappertutto**: facce solo sopra il
  pavimento, muri laterali col solo bordo di pietra chiara, il muro
  spesso una cella fra la stanza e i corridoi (sopra e a destra), il
  moncone sopra la porta laterale, il pilastro. È il difetto per cui la
  scena esiste, ed è tolto al primo colpo.
- **Il tetto** l'ha fatto in un modo che la scheda non diceva, ed è
  meglio: scuro e quasi piatto lontano dai bordi, con una fascia di
  sassi scuri lungo ogni bordo. Il prompt 2 adesso chiede il fondo del
  tetto «com'è lontano dai bordi».
- **La griglia scivola** verso il basso fino a un quarto di cella (il
  pavimento della stanza in basso comincia a 945 px invece che a 960),
  mezza per la fontana. Come bersaglio va benissimo; per ritagliare è
  meglio il foglio.
- **Non è pixel art a blocchi**: trentamila colori in un pezzo di
  pavimento, e i cambi di colore cadono su tutte le colonne allo stesso
  modo. È dipinta a piena risoluzione come i fogli dei mostri, e si
  riduce come loro: `BOX`, di quattro.
- **La porta aperta è disegnata chiusa**: il prompt 2 adesso la
  descrive.
- **Il mosaico** è venuto largo 2,6 celle invece di 3. L'arredo
  inventato (botti sul cavalletto, panche, tavolaccio, legna, macina,
  botti in piedi) è quello giusto, e niente sembra una cosa da
  raccogliere.
- **La prova dei sedici pixel** — ridotta di quattro, ingrandita di tre,
  col cavaliere e uno scheletro posati sopra: le figure si leggono. Il
  pavimento è più chiaro di quanto chiedesse il prompt, ma in partita
  fuori dalla luce il gioco lo spegne da sé.

### `sotterraneo_2.png` — il foglio delle cantine ✅, montato nel gioco

24 settembre 2026, ChatGPT, nella stessa chat: il prompt 2 col blocco
delle cantine, allegati `sotterraneo_1.png` e lo schema del foglio. Il
foglietto (`sotterraneo_2.json`) porta il testo mandato e dice pezzo per
pezzo cosa si ritaglia e cosa no.

- **È tornato verticale**, 1024×1536 invece di 1536×1024, con le fasce
  nell'ordine chiesto ma ognuna alla sua scala: le facce della seconda
  fascia sono larghe 52 px per cella, le porte 63, i fondi 37. Per
  questo il foglietto non ha una `scala` di foglio ma una `misura` per
  ogni pezzo.
- **L'alone** c'è, bruno, su tutto il foglio: a alfa 1-31, e i pezzi fra
  224 e 254. `"alone": 128` li separa senza toccare un bordo.
- **I fondi si ripetono**: i lastroni quasi senza cuciture, la spina di
  pesce con una riga appena visibile. Il mosaico invece è un medaglione
  e non si ripete, quindi si usa come tale, sotto la fontana. Il tetto
  ha sassi e radici grandi, e ripetuto su un muro spesso faceva carta da
  parati: il gioco lo mette solo vicino a dove si cammina, e lontano usa
  il colore piatto della roccia della scena.
- **La stanzetta e il pilastro** non sono venuti come chiesti: la
  stanzetta è una stanza intera con l'arredo dentro, il pilastro ha il
  tetto disegnato come un pavimento. Dalla stanzetta si prendono solo i
  blocchi del bordo — tre per cella, da giunto a giunto, così si
  ripetono senza cuciture — e gli angoli.
- **Le cose per terra** sono venute per metà sopra un quadrato di
  pavimento (pozzanghera, paglia, cera, mattoni, muschio): posate su un
  altro pavimento sarebbero una toppa, e restano fuori. Si usano le
  cinque col fondo trasparente.
- **Una cassa scura con le borchie** nella sesta fascia si scambia per un
  forziere: fuori, come tutto l'arredo finché il gioco non lo nomina.

Se si rifà: chiedere il foglio **orizzontale** come prima riga del
prompt, e le cose per terra «senza nessun quadrato di pavimento sotto».
