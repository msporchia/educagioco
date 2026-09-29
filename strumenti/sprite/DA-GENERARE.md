# Cosa generare, in che ordine, con che prompt

Il piano degli sprite **comune al castello e al sotterraneo**, scritto il
25 settembre 2026 guardando la battaglia finta
(`poc/scatti/castello-battaglia.png`, che si rifà con
`node strumenti/sprite/carte-castello.mjs`) e rifatto il 26 dopo aver
predisposto tutti i lettori. Si aggiorna ogni volta che un'immagine
arriva: una voce fatta si segna ✅ con il nome del file.

**Ogni immagine ha già il suo posto e il suo comando**: si salva col
nome scritto nella sua voce, si lancia quel comando, e il gioco la usa.
Nessun lettore va scritto quando arriva un'immagine — sono stati provati
tutti su un foglio finto fatto coi pezzi che ci sono già (le torri di
agosto messe a righe, il respiro messo a passi, lo schema del foglio del
terreno col bianco tolto), e il castello si è giocato così nel browser.

## La regola che rende possibile un foglio per due giochi

**Una cella è 16 pixel del disegno, in tutti e due i giochi.** Le scene
del castello (`td_1.png`…) sono dipinte con celle da 64 px, cioè
quattro pixel dello schermo per pixel del disegno; i fogli di creature
del sotterraneo (`mostri-1.png`, `mostri-2.png`) sono a scala 4 anche
loro; e la cella del sotterraneo è di 16 px. Quindi un mostro preso
**alla misura del suo foglio**, senza ridurlo né ingrandirlo, ha la
stessa grana della scena in tutti e due i giochi. Nella prima prova i
mostri erano ingranditi di due e mezzo e sembravano appiccicati; alla
misura del foglio sembrano del posto.

Per questo ogni prompt qui sotto dice le misure **in celle da 64 px**, e
la grana sempre allo stesso modo: «ogni pixel del disegno è un quadrato
di 4×4 px».

## Cosa NON serve generare

- **I mostri del castello.** Un mostro vale l'altro (parole
  dell'utente: «puoi usare un mostro per un altro, è abbastanza
  irrilevante»), e i due fogli del sotterraneo hanno 54 creature. Per il
  gioco un mostro è solo resistenza, volo e nome, quindi **la figura
  cambia da vestito a vestito** senza toccare l'equilibrio: quaranta
  creature per i quattro vestiti, tutte ritagliate ✅ (il 26 settembre; le
  coordinate delle nuove stanno in `creature-castello.json`, quelle che
  il sotterraneo aveva già nei suoi foglietti). Chi fa chi lo dice
  `src/giochi/castello/scena/bestiario.js`, e questa tabella è la sua
  copia da leggere — com'è descritta la creatura nel foglio, perché è
  così che la cercano i prompt del cammino:

| castello | immune a | bosco | lava | neve | palude |
|---|---|---|---|---|---|
| slime | — · ✂️ | la melma verde | la melma viola | la melma rosa | la melma verde |
| goblin | — | lo scorpione viola | il diavoletto rosso | la mummia | il granchio rosso |
| pipistrello | bombe, ghiaccio · vola | il pipistrello viola | l'occhio volante rosso | il pipistrello con un occhio solo | il pipistrello viola |
| fantasma | bombe, arciere · vola | il fantasma verde acqua | il fantasma verde acqua | il fantasma azzurro | il fantasma azzurro |
| ragno | — | il ragno nero | il granchio rosso | lo scorpione viola | il ragno nero |
| orco | — | lo zombie verde | la bestia cornuta | il cinghiale | lo zombie verde |
| scheletro | magica, ghiaccio · 💫 | lo scheletro | il negromante col cappuccio viola | il teschio con la fiamma azzurra | lo scheletro |
| golem | arciere, magica | il golem di pietra bruna | il golem di lava | il golem di ghiaccio | il golem di pietra col muschio |
| arpia | bombe, ghiaccio · vola | il grifone | il pipistrello con un occhio solo | il tornado azzurro | il grifone |
| drago | bombe, magica · vola | il drago rosso con le ali | il drago rosso con le ali | il drago rosso con le ali | il drago rosso con le ali |
| lupo | — | il lupo grigio | il lupo grigio | lo spirito del fulmine giallo | il lupo grigio |
| corvo | bombe, ghiaccio · vola | il pipistrello con un occhio solo | il pipistrello viola | il pipistrello viola | il pipistrello con un occhio solo |
| rovo | arciere, bombe | la pianta carnivora | la pianta carnivora | l'uomo albero | la pianta carnivora |
| verme | — · ✂️ | l'ombra viola con gli occhi gialli | l'ombra viola con gli occhi gialli | l'ombra viola con gli occhi gialli | l'ombra viola con gli occhi gialli |
| blatta | bombe, magica | il draghetto rosa con le ali | il draghetto rosa con le ali | il drago di lava senza ali | il draghetto rosa con le ali |
| troll | arciere, magica · 💫 | l'omone grigio con la clava | il sasso di magma con le corna di fuoco | il golem di pietra col muschio | l'omone grigio con la clava |
| corazziere | arciere, magica | lo scheletro con spada e scudo | lo spirito di fuoco | la tartaruga corazzata | la tartaruga corazzata |
| balestriere | — | il serpente verde | il mostro viola con la bocca grande | il serpente verde | il serpente verde |

  Il nome che il castello dà al mostro resta quello del gioco (è la
  chiave delle sue immunità, `data/mostri.js`; ✂️ si divide, 💫 si
  rialza); cambia la figura, e **il nome che il bambino legge** sul
  nastro e sulla scheda è quello della figura («Grifone», «Golem di
  magma»: `NOMI` nel bestiario). Chi vola nel
  gioco prende una figura che vola, e `unita/castello-bestiario` lo
  pretende. **La figura dice a quale torre è immune** — è quello che
  serve al bambino per scegliere la torre, non chi è il mostro: il
  carapace e le setole reggono le frecce, pietra e guscio anche la
  magia, le ossa reggono la magia, i draghi le bombe e la magia, i
  grovigli le bombe e le frecce. **Il «—» sono i comuni**: goblin,
  orco, ragno, lupo, balestriere, slime e verme non sono immuni a
  niente, e le loro figure (scorpione, zombie, melme, ombra, serpente,
  lupo…) non devono sembrare corazzate né volare. Il vocabolario intero
  sta in testa al bestiario, e una figura che fa due mostri in due
  vestiti li fa con le stesse immunità (lo scorpione è il goblin del
  bosco e il ragno della neve: comuni tutti e due). Rifatto il 27 settembre
  coi profili a due immunità al massimo: prima lo spirito di fuoco
  faceva il fantasma, lo scheletro con lo scudo il goblin e il
  balestriere, e il verme che si divide era un serpente.

  **Il peso**: le quaranta creature col respiro sono 626 KB di WebP in
  `dati/figure.js` (864 KB col base64, 605 KB più di prima). È il
  motivo per cui il bagliore dietro le creature si toglie al ritaglio
  (alfa sotto 64) e le figure si comprimono a qualità 80.

- **I colpi, le barre della vita, il raggio delle torri**: li disegna il
  gioco, com'era deciso ad agosto.
- **Il castello e la bocca**: si prendono dal foglio del terreno di ogni
  vestito. Il castello doveva restare identico nei tre, e la lava l'ha
  rivestito di pietra nera con le crepe di lava: va bene così.

## Il lavoro senza gettoni

1. ✅ ritagliare le creature: fatto per tutte e quaranta, misurate con
   `misura.py` (bande sull'alfa su tutta la larghezza, poi le macchie).
   Il grifone e il drago all'alfa sopra 128 sono staccati dai vicini, e
   bastano i rettangoli. Provino: `python3 strumenti/sprite/vesti.py
   --creature provino.png`;
2. ✅ la radura grande sulla scacchiera, scritta a mano (`A_MANO` in
   `src/giochi/castello/motore/carta.js`): `DA_RIDISEGNARE` è vuoto;
3. ✅ i lettori delle immagini che arriveranno, qui sotto voce per voce.

## Le priorità

Ogni voce dice cosa sblocca, quante immagini costa, cosa allegare, **il
nome col quale salvare** e **il comando da lanciare dopo**. Il prompt
mandato si conserva nel foglietto (dove c'è) o si incolla nella voce qui,
**nel momento in cui si salva il PNG**.

### 1 — Il foglio del terreno del bosco · 1 immagine · ✅ 27 settembre 2026

**Sblocca** le carte vere: finisce il provvisorio (`vesti.py`, che
ritaglia dalla scena), arrivano i due stagni veri e il lago che entra
dal bordo, il fondo «con qualcosa in più», gli alberi interi del fitto, i
decori grandi e le cose per terra.

**Com'è andata**: il primo prompt 2 della scheda è stato **rifiutato dal
filtro dei contenuti**; è passato il secondo, più corto, che dice «nello
stile di» invece di «esattamente» e non nomina i mostri. **Il prompt 2 da
usare è quello**, ed è conservato intero nel foglietto
(`terreno-bosco.json`, `prompt.testo`) e nella scheda. Il foglio è tornato
col fondo a **scacchiera dipinta** (`"fondo": "scacchiera"`), fuori dalla
griglia chiesta (la finestra della strada a ~56 px per cella) e coi fondi
**orlati**: il foglietto è stato rimisurato pezzo per pezzo, e i dettagli
stanno nella scheda, in «Com'è andata».

**Allegati**: `td_1.png` e `PROMPT-scenario-foglio.png`, nella chat di `td_1`.

**Sta in** `strumenti/sprite/sorgenti/castello/generati/terreno-bosco.png`.

```bash
python3 strumenti/sprite/vesti.py --provino-foglio bosco /tmp/foglio.png   # i rettangoli sopra il foglio scontornato
python3 strumenti/sprite/vesti.py --provino bosco /tmp/pezzi.png           # i pezzi che ne escono
python3 strumenti/sprite/vesti.py --atlante                                # e il gioco usa il foglio
node strumenti/sprite/carte-castello.mjs                                   # le carte vestite, da guardare
```

### 2 — Le torri, nella mano delle scene · 1 immagine · ✅ 27 settembre 2026

**Perché**: le torri della prova venivano da
`sorgenti/castello/non-usati/PVX1O.png`, che ha la **provenienza non
documentata**. Adesso vengono da `torri-1.png`; `PVX1O.png` resta in
`non-usati/` (lo legge ancora `prova-battaglia.py` come ripiego, se il
foglio nuovo mancasse) ma non entra più nell'atlante.

**Com'è andata**: il foglio è tornato 1248×832 con l'alfa vero e una
griglia regolare di cinque per quattro, ma **non nell'ordine chiesto** e
con le figure **tutte grandi uguali**, un disco d'erba sotto ognuna. I
gettoni erano finiti, quindi si è tenuto questo, e l'utente l'ha ritoccato
a mano (brina e napalm con l'alone). Tre cose le dice il suo foglietto,
`torri-1.json`, invece di ritoccare il PNG:

- **quale figura è quale torre** (`figure`, riga e colonna da 0), letto col
  foglio davanti — e le otto torri salite **senza ramo**: l'arciere la
  torretta con la tettoia (r0c1, l'unica che nessun ramo usa) e poi la
  balestra; la magica la catena; il ghiaccio le punte e poi i cristalli;
  le bombe i due mortai;
- **via il disco d'erba** (`erba`): il verde che si raggiunge dal
  trasparente passando per il verde, nel quarto basso della figura; e
  `pieno`, perché lo scontorno del disco aveva fatto mezzo trasparente il
  verde delle divise dei soldati (sul campo ci si vedeva il prato
  attraverso);
- **la crescita la dà la scala** (`scala`: 0,60 · 0,68 · 0,76 per stadio):
  sul foglio le figure sono tutte ~125×185, e senza la torre appena
  costruita sarebbe grande quanto quella al massimo.

Una figura si prende **per macchie d'alfa, non per cella**: la fiamma del
cannone di r3c4 sale dentro la cella di sopra, e ritagliando le celle la
brina si ritrovava in fondo un pezzo di fuoco (`figure_della_griglia` in
`vesti.py`).

**TODO**: il veleno ha una figura sola (r1c2): lo stadio 2 è lo stesso
dell'1. E la brina e il napalm al massimo, con l'alone e la fiamma, sono
più larghi di una cella e mezza: coprono un pezzo di strada.

**Sta in** `strumenti/sprite/sorgenti/castello/generati/torri-1.png`.

```bash
python3 strumenti/sprite/vesti.py --atlante
node strumenti/sprite/carte-castello.mjs      # castello-battaglia-figure.png: le venti torri in fila
```

Il prompt che era stato scritto per questa voce, qui sotto, non è quello
che ha prodotto il foglio (non è stato conservato):

```text
Disegna il foglio delle torri (uno sprite sheet) di questo gioco di difesa della torre, nella mano ESATTA della scena allegata: stesso contorno scuro, stessa luce da in alto a sinistra, stessa tavolozza, stessa grana — ogni pixel del disegno è un quadrato pieno di 4×4 px. La seconda immagine allegata è il VECCHIO foglio delle torri: dice cosa è ogni torre e come cresce, ma la mano da seguire è quella della scena, non quella.

Il foglio è ORIZZONTALE, 1536×1024 px, su FONDO TRASPARENTE (PNG), su una griglia invisibile di celle da 64×64 px. Ogni torre sta in piedi su una piazzola di una cella e si vede dall'alto a tre quarti, come il castello della scena: la base occupa la cella, il corpo sale sulla cella di sopra. Nessuna ombra sotto, nessun bagliore attorno, nessuna cornice, nessuna piazzola disegnata sotto. NESSUNA PAROLA SCRITTA, NESSUN NUMERO, NESSUNA ETICHETTA.

Quattro righe, una per torre, e in ogni riga cinque figure da sinistra a destra: la torre appena costruita; poi il primo ramo, cresciuto e al massimo; poi il secondo ramo, cresciuto e al massimo. Fra una figura e l'altra, e fra una riga e l'altra, almeno mezza cella di trasparente: le figure non si toccano mai. Le cinque figure di una riga hanno la base sulla stessa linea. Tutto quello che fa parte di una torre — la fiamma, i fulmini, il cristallo che galleggia, il fumo — sta attaccato alla torre o a meno di un quarto di cella da lei, mai sospeso lontano. Le misure: appena costruita larga una cella e alta una e mezza; cresciuta larga una cella e alta due; al massimo alta due e mezza e MAI PIÙ LARGA DI UNA CELLA E MEZZA, perché accanto passa la strada.

1. L'ARCIERE, che tira frecce veloci su un nemico solo. Appena costruita: una torretta di legno con un arciere in cima. Primo ramo, IL CECCHINO, che vede lontanissimo e tira un colpo forte e lento: una torre alta e stretta con un tiratore che mira col cannocchiale. Secondo ramo, LA RAFFICA, due frecce per volta su due nemici: una balestra doppia montata su un perno che gira.
2. LA MAGICA, un'onda magica che colpisce a zona. Appena costruita: una torretta di pietra con un cristallo viola che galleggia sopra. Primo ramo, IL VELENO, il male che continua da solo: un calderone verde che ribolle e fuma. Secondo ramo, LA CATENA, il colpo che rimbalza di nemico in nemico: una bobina di rame con i fulmini azzurri in cima.
3. IL GHIACCIO, che non fa male ma congela i nemici vicini. Appena costruita: una piccola torre di ghiaccio azzurro, in piedi, non un disco piatto. Primo ramo, LA BUFERA, che gela molto largo: la torre di ghiaccio con un vortice di neve che le gira attorno. Secondo ramo, LA BRINA, che gela di più e rende fragili i nemici: una torre di cristalli di ghiaccio appuntiti, bianchi e azzurri.
4. LE BOMBE, un colpo lento e devastante. Appena costruita: un cannone di ferro su un affusto di legno, grande quanto le altre torri appena costruite. Primo ramo, IL MORTAIO, che arriva lontanissimo: un mortaio grosso e tozzo che punta al cielo. Secondo ramo, IL NAPALM, che scoppia largo e lascia bruciare: un cannone con la bocca a forma di testa di drago e una fiamma che tremola.

Ogni torre si riconosce da lontano anche piccola, con una sagoma e un colore suoi — l'arciere legno e verde, la magica pietra e viola, il ghiaccio azzurro e bianco, le bombe ferro e arancio — e crescendo si capisce che è la stessa torre diventata più forte.
```

### 2b — Le torri rifatte · 1 immagine · ✅ 29 settembre 2026

**Perché**: in `torri-1.png` arciere, magica e bombe erano la stessa
torretta di pietra grigia con un cappello diverso, e sul campo da piccole
non si distinguevano; il veleno aveva una figura sola; brina e napalm al
massimo coprivano la strada.

**Com'è andata**: fatto con **ChatGPT** (non Grok), allegando `td_1.png` e
`torri-1.png`. È tornato **nell'ordine chiesto**, cinque per quattro, con
la crescita già disegnata e le quattro basi diverse (tronchi a palizzata,
guglia viola, ghiaccio, bastione di mattoni rossi), su trasparente vero ma
con **un alone colorato ad alfa bassa** dietro ogni riga. Il foglietto
`torri-2.json` dice `bagliore` (l'alone sotto 64 si toglie prima di cercare
le figure), una `scala` sola e `largo_max` (1,6 celle: le torri più larghe
si riducono un po' di più). `vesti.py` prende il foglio col numero più
alto, quindi `torri-1.png` resta come storia e non entra più nell'atlante.

**Sta in** `strumenti/sprite/sorgenti/castello/generati/torri-2.png`.

Il prompt mandato:

```text
Disegna il foglio delle torri (uno sprite sheet) di un gioco di difesa della torre, nella mano ESATTA della prima immagine allegata: stesso contorno scuro, stessa luce da in alto a sinistra, stessa tavolozza, stessa grana — ogni pixel del disegno è un quadrato pieno di 4×4 px. La seconda immagine sono le torri di adesso: dice cosa fa ogni torre, ma NON copiarne la base, perché lì tre torri su quattro sono la stessa torretta di pietra grigia e da piccole non si distinguono.

Il foglio è ORIZZONTALE, 1536×1024 px, su FONDO TRASPARENTE (PNG). Nessuna ombra sotto, nessun disco d'erba, nessun bagliore, nessuna cornice. NESSUNA PAROLA SCRITTA, NESSUN NUMERO, NESSUNA ETICHETTA.

Quattro righe, una per torre, in quest'ordine. In ogni riga ESATTAMENTE CINQUE figure, da sinistra a destra: 1) la torre appena costruita; 2) il primo ramo, cresciuto; 3) il primo ramo al massimo; 4) il secondo ramo, cresciuto; 5) il secondo ramo al massimo. Le cinque figure sono TUTTE DIVERSE fra loro, e crescendo si vede che è la stessa torre diventata più forte: più alta, più ricca, non solo più grande. Ogni figura sta dentro una cella invisibile di 300×250 px, con la base sulla stessa linea delle altre della riga; fra una figura e l'altra almeno 40 px di trasparente, e niente esce dalla sua cella — fiamme, fulmini, cristalli, fumo compresi, tutto attaccato alla torre. Vista dall'alto a tre quarti, come il castello della prima immagine.

LE MISURE, importanti: la torre appena costruita è larga circa 110 px e alta 150; al massimo è alta fino a 240 px ma MAI PIÙ LARGA DI 160 px, perché accanto passa la strada.

1. L'ARCIERE — legno e verde. Base: una torretta di TRONCHI DI LEGNO con la palizzata appuntita, mai di pietra, con un arciere vestito di verde in cima. Primo ramo, IL CECCHINO: una torre di legno alta e stretta, con il tiratore che mira col cannocchiale; al massimo più alta, con una bandierina. Secondo ramo, LA RAFFICA: una balestra doppia su un perno girevole in cima al legno; al massimo con due balestre e le frecce pronte.
2. LA MAGICA — pietra viola e oro. Base: una GUGLIA SOTTILE DI PIETRA VIOLA con un cristallo che galleggia in cima, mai la torretta grigia tonda. Primo ramo, IL VELENO: un calderone verde che ribolle sulla guglia; al massimo il calderone è più grande, trabocca e ha le fiale attorno. Secondo ramo, LA CATENA: una bobina di rame con i fulmini azzurri; al massimo due bobine con un arco elettrico fra loro, tutto attaccato alla torre.
3. IL GHIACCIO — azzurro e bianco. Base: una piccola torre di ghiaccio azzurro, in piedi. Primo ramo, LA BUFERA: la torre di ghiaccio con un piccolo vortice di neve attorno, stretto; al massimo più alta, col vortice che resta dentro i 160 px. Secondo ramo, LA BRINA: una torre di cristalli appuntiti; al massimo più alta, ma i cristalli crescono in alto e NON di lato.
4. LE BOMBE — ferro scuro e mattoni rossi. Base: un BASTIONE BASSO E QUADRATO DI MATTONI ROSSI con un cannone di ferro sopra, mai la torretta grigia tonda. Primo ramo, IL MORTAIO: un mortaio tozzo che punta al cielo; al massimo più grosso, con una pila di palle accanto. Secondo ramo, IL NAPALM: un cannone con la bocca a testa di drago; al massimo con una fiammella piccola alla bocca, attaccata, non una fiammata lunga.

Da lontano e piccole, le quattro torri si devono riconoscere dalla sola SAGOMA e dal colore: legno a palizzata, guglia viola, ghiaccio, bastione quadrato di mattoni.
```

### 3 — La lava più calma · non serve più

Era la scena della lava rifatta con la roccia calma, per ritagliarci i
pezzi. Col foglio della lava (voce 4) i pezzi non si ritagliano più dalla
scena, e la calma l'ha chiesta direttamente il suo prompt. Il foglio è
uscito comunque coi cristalli, e le toppe di fondo li scansano
(`"evita": "acceso"` in `terreno-lava.json`).

### 4 — I fogli del terreno della neve e della lava · 2 immagini · ✅ 27 settembre 2026

**Sblocca** gli altri due vestiti col foglio vero. Nella chat dove è
uscito il foglio del bosco, allegando la scena di quel vestito
(`td_2.png` per la neve, `td_3.png` per la lava). **Il fondo si chiede
magenta pieno**, non trasparente: sulla neve la scacchiera dipinta non si
toglierebbe, perché gli orli dei pezzi sono bianchi come lei.

Neve:

```text
Rifai lo stesso foglio, pezzo per pezzo, ogni pezzo nella stessa posizione e della stessa misura, vestito come la scena allegata: la neve. Il prato diventa neve, il bosco fitto e gli alberi diventano abeti innevati, i laghetti e il lago diventano ghiaccio con la riva innevata, il sentiero è terra battuta grigia, le piattaforme sono assi coperte di neve, la tana è una grotta nella roccia innevata. Il castello resta lo stesso. Il fondo dietro i pezzi è un magenta pieno e uniforme (#FF00FF), senza scacchiera, senza sfumature e senza ombre. Non spostare niente: cambia solo il vestito.
```

Lava:

```text
Rifai lo stesso foglio, pezzo per pezzo, ogni pezzo nella stessa posizione e della stessa misura, vestito come la scena allegata ma più calmo: il fondo è roccia scura uniforme con poche crepe, senza fiammelle sparse e senza cristalli. I laghetti e il lago sono lava con la riva di roccia, il bosco fitto sono rupi scure, gli alberi sono alberi secchi, il sentiero è terra bruciata chiara, le piattaforme sono lastre di pietra scura, la tana è una grotta nella roccia vulcanica. Il castello resta lo stesso. Il fondo dietro i pezzi è un magenta pieno e uniforme (#FF00FF), senza scacchiera, senza sfumature e senza ombre. Non spostare niente: cambia solo il vestito.
```

**Stanno in** `terreno-neve.png` e `terreno-lava.png`, accanto a
`terreno-bosco.png`. Sono rimasti fermi (entro 5 px dal bosco), quindi i
loro foglietti dicono solo `"come": "terreno-bosco.json"` e il fondo
`[255, 0, 255]`: coordinate e misure le ereditano. Il magenta del
generatore è rumoroso e lascia un filo viola sugli orli: lo toglie
`senza_fondo` in `vesti.py` (vedi `FORMATO.md`, `fondo`). Com'è andata
sta nella scheda.

```bash
python3 strumenti/sprite/vesti.py --provino-foglio neve /tmp/neve.png
python3 strumenti/sprite/vesti.py --atlante
node strumenti/sprite/carte-castello.mjs
```

### 4b — Il foglio del terreno della palude · 1 immagine · ✅ 28 settembre 2026

**Sblocca** la campagna della Palude col suo vestito (prima si vestiva
di bosco). Prima la scena, `td_4.png`, poi il foglio, `terreno-palude.png`,
in una **chat nuova**: allegato per primo `terreno-neve.png` (il foglio
da rifare) e per seconda `td_4.png` (solo lo stile). Il testo mandato, e
la trappola del primo tentativo — nella chat del bosco ha rifatto la
scena coi bordi magenta — stanno nel foglietto `terreno-palude.json` e
nella scheda. Il foglio **non** ha la disposizione del bosco: il suo
foglietto ha le sue coordinate, e `"smacchia": true` per il magenta
rimasto nei contorni.

```bash
python3 strumenti/sprite/vesti.py --provino-foglio palude /tmp/palude.png
python3 strumenti/sprite/vesti.py --atlante
node strumenti/sprite/carte-castello.mjs
```

### 5 — I mostri che camminano · 3 immagini per il bosco, 4 per lava e neve

**Arricchisce tutti e due**: oggi le creature generate hanno una posa
sola, il respiro di lato. Nel castello i mostri scendono quasi sempre
verso il basso e servono **di fronte**; nel sotterraneo camminano e
oggi scivolano. Nello stesso giro si sostituiscono i quattro mostri che
il sotterraneo prende ancora da 0x72 (goblin, scheletro, orco, gigante),
e i due giochi hanno una mano sola.

Il castello è già pronto a usarli: i pittori mettono i passi **di
lato** quando il mostro va a destra o a sinistra (specchiati verso
sinistra) e **di fronte** quando scende, e il respiro resta solo per chi
un foglio del cammino non ce l'ha ancora — quindi i fogli si possono
fare uno alla volta, e ognuno si vede subito.

Sette fogli, sempre con lo stesso prompt; cambia solo l'elenco in coda.
**Allegati**: `mostri-1.png` e `mostri-2.png` (sono loro che si
ridisegnano). Chat nuova, e i fogli dopo il primo nella stessa chat.

```text
Disegna un foglio di mostri che camminano (uno sprite sheet): sono le STESSE creature dei due fogli allegati — stessa figura, stessi colori, stesso contorno, stessa grana (ogni pixel del disegno è un quadrato pieno di 4×4 px) e stessa misura che hanno lì — adesso in cammino.

Il foglio è ORIZZONTALE, 1536×1024 px, su FONDO TRASPARENTE (PNG). Nessuna ombra sotto, nessun bagliore colorato attorno, nessuno sfondo colorato dietro le righe, nessuna cornice. NESSUNA PAROLA SCRITTA, NESSUN NUMERO.

Una riga per mostro, nell'ordine dell'elenco qui sotto, e le righe staccate l'una dall'altra da almeno mezza cella di trasparente (una cella è 64 px). In ogni riga ESATTAMENTE OTTO figure, da sinistra: quattro passi del mostro visto DI LATO che cammina verso destra; poi quattro passi dello stesso mostro visto DI FRONTE, che cammina verso chi guarda. Fra un passo e l'altro almeno mezza cella di trasparente: i passi non si toccano e non si sovrappongono. I passi di una riga sono tutti della stessa altezza e con i piedi sulla stessa linea; chi vola sbatte le ali restando alla stessa altezza. Niente pose di morte, niente attacchi, niente fiamme, scintille o colpi che escono dal mostro: tutto quello che è del mostro gli sta attaccato.

Le righe:
```

…e in coda l'elenco di quel foglio, una riga per mostro, **scritto com'è
la creatura nel foglio allegato** (il generatore la deve trovare):

| foglio | le righe, dall'alto |
|---|---|
| A | la melma verde · lo scheletro con spada e scudo · il pipistrello viola · il fantasma verde acqua del secondo foglio · il ragno nero · il lupo grigio |
| B | il golem di pietra bruna · l'omone grigio con la clava · lo scheletro senza armi · il drago rosso con le ali · il grifone · la pianta carnivora verde del primo foglio |
| C | il serpente verde · lo scorpione viola · l'ombra viola con gli occhi gialli · il draghetto rosa con le ali · lo zombie verde del primo foglio · il pipistrello viola con un occhio solo |
| D | il sasso di magma con le corna di fuoco · l'occhio volante rosso del primo foglio · lo spirito di fuoco · il granchio rosso · la bestia cornuta viola e arancio · il negromante col cappuccio viola |
| E | il golem di lava rosso · il diavoletto rosso · la melma viola · il mostro viola con la bocca grande |
| F | la melma rosa · la mummia · il fantasma azzurro del primo foglio · il cinghiale · il golem di pietra col muschio del secondo foglio · il teschio con la fiamma azzurra |
| G | il golem di ghiaccio del primo foglio · il tornado azzurro · l'uomo albero · lo spirito del fulmine giallo · il drago di lava senza ali · la tartaruga corazzata con le spine |

A, B, C sono il bosco; D ed E la lava; F e G la neve — una creatura
che sta in più vestiti è nel foglio del primo, prima il bosco e poi la
lava, così coi soli A, B e C il bosco cammina tutto. L'ordine delle
righe è quello di `CAMMINO` in `vesti.py`: **se il generatore ne
scambia due, si scambiano lì**, non si rifà il foglio.

**Si salvano come**
`strumenti/sprite/sorgenti/sotterraneo/generati/mostri-cammino-A.png`
(e `-B`, `-C`…), accanto ai fogli che ridisegnano. Poi:

```bash
python3 strumenti/sprite/righe.py strumenti/sprite/sorgenti/sotterraneo/generati/mostri-cammino-A.png /tmp/a.png
# deve dire «6 righe: 8 · 8 · 8 · 8 · 8 · 8 figure» (E: 4 righe)
python3 strumenti/sprite/vesti.py --atlante
python3 strumenti/sprite/vesti.py --creature /tmp/creature.png            # tutte, coi passi
```

⚠ **Il peso**: otto passi al posto di quattro respiri raddoppiano quasi
i mostri in `dati/figure.js`. I tre fogli del bosco da soli portano il
file da 0,86 a circa 1,2 MB; tutti e sette a circa 1,6 MB. Se è troppo,
si fanno solo A, B e C — lava e neve restano col respiro, e i pittori lo
sanno fare — oppure si chiedono tre passi per verso invece di quattro.

### 6 — (facoltativo) Gli eroi del sotterraneo · 1 immagine

L'ultimo pezzo di 0x72 dopo il 5: cavaliere, elfa, mago e nano, fermi e
in corsa, nella stessa mano. Resta da decidere se vale la pena (vedi la
memoria sugli scenari del sotterraneo).

## In fila

| # | cosa | immagini | allegati | si salva come | sblocca |
|---|---|---|---|---|---|
| 1 ✅ | foglio del terreno, bosco | 1 | `td_1`, schema del foglio | `castello/generati/terreno-bosco.png` | le carte vere |
| 2 ✅ | le torri | 1 | `td_1`, `PVX1O` | `castello/generati/torri-1.png` | le torri pubblicabili |
| 2b ✅ | le torri rifatte (ChatGPT) | 1 | `td_1`, `torri-1` | `castello/generati/torri-2.png` | quattro torri che si distinguono |
| 3 — | la lava più calma (non serve più) | 1 | (chat di `td_3`) | — (il nome `td_4.png` è andato alla palude) | un vestito che si legge |
| 4 ✅ | fogli del terreno, neve e lava | 2 | la scena del vestito | `terreno-neve.png`, `terreno-lava.png` | gli altri due vestiti |
| 4b ✅ | la scena e il foglio del terreno della palude | 2 | `terreno-neve`, `td_4`, chat nuova | `td_4.png`, `terreno-palude.png` | la palude col suo vestito |
| 5 | i mostri che camminano | 3 + 4 | `mostri-1`, `mostri-2` | `sotterraneo/generati/mostri-cammino-A.png`… | mostri di fronte, e il sotterraneo tutto in una mano |
| 6 | gli eroi | 1 | `mostri-1`, una scena | — | l'addio a 0x72 |

Il **minimo per rifare il gioco** sono l'1 e il 2: col bosco, le torri
nuove e i mostri che ci sono già il castello si gioca e si pubblica. Il
resto lo fa più bello, non lo fa funzionare. Dopo ognuno,
`node test/esegui.mjs castello-sprite --scatti` e un'occhiata agli
scatti.

## Le trappole già note

Valgono quelle delle schede della fattoria, del sotterraneo e del
castello, riassunte:

- i fogli tornano **verticali** anche chiesti orizzontali: si ritagliano
  lo stesso, con una `misura` per pezzo (il terreno) o da sé (torri e
  cammino, che `righe.py` legge per righe e non per coordinate);
- il **fondo trasparente** torna con un alone: `"alone": 128` nel
  foglietto del terreno, e `righe.py` lo toglie da sé. I fogli di
  creature del sotterraneo sono tornati **con un bagliore colorato
  dietro ogni riga**: il prompt 5 lo vieta apposta, e al ritaglio si
  toglie comunque (`BAGLIORE` in `vesti.py`);
- **due figure che si toccano** diventano una sola per `righe.py`, e i
  conti non tornano: per questo i prompt 2 e 5 chiedono mezza cella di
  vuoto fra una figura e l'altra, e le fiamme attaccate a chi le fa;
- le **scritte**: vietate in maiuscolo in tutti i prompt;
- **una scena allegata tira verso la scena**: nella chat dove sono
  uscite le scene, «rifai lo stesso foglio» con la scena allegata ha
  ridisegnato la scena coi bordi magenta (la palude, voce 4b). Il foglio
  da rifare si allega **per primo**, la scena per seconda e dichiarata
  «solo stile», in una chat nuova;
- il **prompt si conserva nel foglietto** del foglio che ne esce, così
  come è stato mandato; torri e cammino un foglietto non ce l'hanno, e
  il prompt resta in questa pagina, nella voce, con la data.
