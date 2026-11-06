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
del sotterraneo (`mostri-1.png`, `mostri-2.png`, in `sorgenti/creature/`) sono a scala 4 anche
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
  coordinate stanno nel catalogo comune, `sorgenti/creature/creature.json`:
  docs/core/creature.md). Chi fa chi lo dice
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
  (alfa sotto 64). Poi, l'8 ottobre, le figure sono passate a WebP senza perdita
  a colori a passo 12 (`codifica.py`): 1190 KB invece di 759 con la perdita.

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
   `src/motore/castello/carta.js`): `DA_RIDISEGNARE` è vuoto;
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

### 2 — Le torri, nella mano delle scene · 1 immagine · ✅ 27 settembre 2026 · superata dalla 2b

**Perché**: le torri della prova venivano da
`sorgenti/castello/non-usati/PVX1O.png`, che aveva la **provenienza non
documentata**. Dal 27 settembre vennero da `torri-1.png`, e dal 29 da
`torri-2.png` (la 2b qui sotto): quel giorno `torri-1.png` e `PVX1O.png`
sono stati tolti tutti e due, col ripiego che `vesti.py` e
`prova-battaglia.py` tenevano sul foglio di agosto. Quello che segue è la
storia del foglio 1.

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

**Stava in** `strumenti/sprite/sorgenti/castello/generati/torri-1.png`.

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
alto; `torri-1.png` è stato tolto il 29 settembre, e oggi il foglio è uno.

**Sta in** `strumenti/sprite/sorgenti/castello/generati/torri-2.png`.

```bash
python3 strumenti/sprite/vesti.py --atlante
node strumenti/sprite/carte-castello.mjs      # castello-battaglia-figure.png: le venti torri in fila
```

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

### 5 — I mostri che camminano · un video per creatura · in corso

**Come immagine non viene.** Due fogli chiesti a Grok il 28 settembre
2026, con due prompt diversi (il secondo è quello qui sotto): sempre otto
figure per riga anche chiedendone quattro, pose quasi uguali, mai la
vista di fronte, armi che cambiano a metà riga, creature sostituite.
Non si riprova.

**Come video sì** (Grok Imagine, da immagine a video): una creatura sola,
ritagliata stretta e centrata su fondo bianco, animata **sul posto**,
prima di lato e poi di fronte nello stesso video (i crediti gratuiti ne
danno uno al giorno). `cammino.py` ne tiene solo i passi — sei di lato e
sei di fronte, in `sorgenti/creature/passi/<creatura>.png` — e il video
non si conserva. `vesti.py --atlante` li porta alla misura della creatura
**senza ridurli alla grana dei fogli**: i mostri fatti così sono più
nitidi degli altri, ed è una scelta (meglio alcuni belli e altri come
prima che tutti uguali e brutti). Fatti: il drago (29 settembre), il lupo (1 ottobre), lo scorpione (2 ottobre), la melma (5 ottobre), il ragno (7 ottobre), il troll (9 ottobre: Grok l'ha tenuto di fronte solo dal fotogramma 88 al 113, e il giro di fronte si è cercato lì dentro, 99:10), il golem di lava (10 ottobre: lato 46:33, fronte 102:20).

I prompt **non nominano mai la creatura** («the creature in the attached
image»): col nome dentro basta allegare l'immagine sbagliata, o il prompt
di un altro, e Grok disegna la creatura del nome (il 6 ottobre, col ragno
allegato e il prompt del serpente, ha fatto un serpente). Uno per modo di
muoversi:

chi cammina (lupo, scorpione, ragno, troll, cinghiale, golem):

```text
Pixel art game sprite animation of the creature in the attached image, two parts in one shot. First half: the creature walks in place facing right, side view, a steady looping walk cycle, legs clearly alternating. Second half: the creature turns quickly to face the viewer and keeps walking in place, front view, the same steady cycle. The creature always stays in the center of the frame, does not move forward and does not get bigger. The camera is completely still, no zoom, no pan. Plain flat white background, no shadow, no scenery. Do not change the creature into another animal: keep the exact same creature, same body, same colors, same pixel art style.
```

chi vola (drago, pipistrelli, draghetto):

```text
Pixel art game sprite animation of the creature in the attached image, two parts in one shot. First half: the creature flies in place facing right, side view, a steady looping flight cycle, wings flapping up and down slowly and clearly, body gently rising and falling. Second half: the creature turns quickly to face the viewer and keeps flying in place, front view, the same steady cycle. No fire, no smoke, no breath effects. The creature always stays in the center of the frame, does not move forward and does not get bigger. The camera is completely still, no zoom, no pan. Plain flat white background, no shadow, no scenery. Do not change the creature into another animal: keep the exact same creature, same body, same colors, same pixel art style.
```

chi striscia (serpente):

```text
Pixel art game sprite animation of the creature in the attached image, two parts in one shot. First half: the creature slithers in place facing right, side view, a steady looping slither, the body waving in small S-curves while it keeps its coiled shape. Second half: the creature turns quickly to face the viewer and keeps slithering in place, front view, the same steady cycle. The creature always stays in the center of the frame, does not move forward and does not get bigger. The camera is completely still, no zoom, no pan. Plain flat white background, no shadow, no scenery. Do not change the creature into another animal: keep the exact same creature, same body, same colors, same pixel art style.
```

chi salta (melme; poi `--misura area`):

```text
Pixel art game sprite animation of the creature in the attached image, two parts in one shot. First half: the creature hops in place facing right, side view, a steady looping hop cycle, squashing flat before each jump and stretching up in the air, always landing on the same spot. Second half: the creature turns quickly to face the viewer and keeps hopping in place, front view, the same steady cycle. The creature always stays in the center of the frame, does not move forward and does not get bigger. The camera is completely still, no zoom, no pan. Plain flat white background, no shadow, no scenery. Do not change the creature into another animal: keep the exact same creature, same body, same colors, same pixel art style.
```

```bash
python3 strumenti/sprite/cammino.py video.mp4 drago --cerca --provino /tmp/p.png   # i giri che si chiudono
python3 strumenti/sprite/cammino.py video.mp4 drago --lato 34:17 --fronte 120:22
python3 strumenti/sprite/cammino.py video.mp4 melma --lato 28:24 --fronte 92:24 --misura area   # chi salta: misurata sull'area, non sull'altezza
python3 strumenti/sprite/vesti.py --atlante
npm run build && node strumenti/sprite/in-campo.mjs drago   # le GIF in tmp/in-campo/drago/
```

Quello che segue è il piano di prima, coi fogli di immagini: resta per
memoria.

#### Il piano coi fogli (non ha funzionato)

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
**Allegati**: `mostri-1.png` e `mostri-2.png` (in `sorgenti/creature/`: sono loro che si
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

### 7 — La cittadella di Castle Battle, a fogli · provata il 13 ottobre 2026: niente di buono, la sostituisce la 7b

**Perché**: in Castle Battle castello e caserme stanno stretti su un
lastricato unico, come la città di Heroes of Might and Magic III; oggi le
caserme sono casette disegnate in codice (`src/giochi/arena/scena/campo.js`).
Le caserme diventano **quattro edifici a due varianti** (si sceglie quale
quando si costruisce): cripta (arcieri | opliti), torre oscura (negromanti |
diavoletti), tana (lupi | pipistrelli), antro (golem | drago). Ogni
edificio ha **la stessa fondazione** in tutte le sue forme, così si
incastra sul lastricato; il colore della squadra è **un blu solo**, che il
gioco ridipinge di rosso per il nemico (come il castello, `castelloNemico()`).

**Come si manda**: ChatGPT, chat nuova. Si allegano `torri-2.png` per
primo (il formato da imitare), `td_1.png` per secondo («solo stile»).

**Si salva in** `strumenti/sprite/sorgenti/arena/caserme.png` (prompt A) e
`strumenti/sprite/sorgenti/arena/cittadella.png` (prompt B). **Il lettore è
da scrivere** quando arrivano: come le torri, per righe (`righe.py`).

Prompt A, le caserme:

```text
Disegna il foglio degli edifici (uno sprite sheet) di un gioco di strategia, nella mano ESATTA delle immagini allegate: stesso contorno scuro, stessa luce da in alto a sinistra, stessa tavolozza, stessa grana — ogni pixel del disegno è un quadrato pieno di 4×4 px. La prima immagine è un foglio di torri: imita il suo FORMATO (righe, celle, trasparente). La seconda serve SOLO per lo stile.

IL CONCETTO: come la schermata della città in Heroes of Might and Magic III. Gli edifici non stanno sparsi su un prato: si incastrano l'uno accanto all'altro su un unico lastricato di pietra, intorno a un castello, e insieme fanno UNA cittadella sola. Per questo ogni edificio poggia su UNA FONDAZIONE IDENTICA in tutte le venti celle: un basamento basso e quadrato di pietra grigia squadrata, largo circa 200 px, visto dall'alto a tre quarti. Gli edifici sono COMPATTI e crescono in altezza, mai di lato oltre la fondazione, perché nel gioco si toccano coi vicini.

Il foglio è ORIZZONTALE, 1536×1024 px, su FONDO TRASPARENTE (PNG). Nessuna ombra sotto, nessun prato, nessun bagliore, nessuna cornice. NESSUNA PAROLA SCRITTA, NESSUN NUMERO, NESSUNA ETICHETTA.

IL COLORE DELLA SQUADRA: in ogni edificio tetti, bandiere e stendardi sono di UN SOLO BLU SATURO E UNIFORME (come #2a5cff). Nessun altro blu o azzurro negli edifici, e niente rosso tranne il fuoco: il gioco ridipinge quel blu di rosso per la squadra nemica.

Quattro righe, una per edificio, in quest'ordine. In ogni riga ESATTAMENTE CINQUE figure, da sinistra a destra: 1) la fondazione vuota con un'impalcatura di legno, il cantiere; 2) la prima variante appena costruita; 3) la prima variante al massimo; 4) la seconda variante appena costruita; 5) la seconda variante al massimo. Le due varianti sono LO STESSO EDIFICIO SULLA STESSA FONDAZIONE, con la parte di sopra diversa; al massimo è più alto e più ricco, non solo più grande. Ogni figura sta dentro una cella invisibile di 300×250 px, con la fondazione sulla stessa linea delle altre della riga; fra una figura e l'altra almeno 40 px di trasparente, e niente esce dalla sua cella. Misure: appena costruito circa 200 px di larghezza e 150 di altezza; al massimo fino a 230 di altezza, MAI più largo di 220.

1. LA CRIPTA DELLE OSSA — pietra chiara e ossa, per i soldati scheletro. Prima variante, GLI ARCIERI: una cripta con una torretta a feritoie, faretre di frecce e un bersaglio di paglia. Seconda variante, GLI OPLITI: una cripta-caserma con rastrelliere di lance e scudi tondi e un portone pesante.
2. LA TORRE OSCURA — pietra viola e oro. Prima variante, I NEGROMANTI: una guglia con un libro aperto e un teschio luminoso viola che galleggia attaccato in cima, candele sui merli. Seconda variante, I DIAVOLETTI: una fucina infernale con un pozzo di brace rossa, barili di bombe e un camino a corna.
3. LA TANA — legno scuro, pelli e ossa. Prima variante, I LUPI: una baracca di tronchi con un recinto, ossa rosicchiate e segni di artigli. Seconda variante, I PIPISTRELLI: una torre alta e stretta che finisce in una grotta, con pipistrelli appesi a testa in giù, attaccati.
4. L'ANTRO DEI GIGANTI — massi enormi e catene. Prima variante, IL GOLEM: una cava-laboratorio con blocchi di pietra, una grande incudine e rune che brillano. Seconda variante, IL DRAGO: un arco di roccia sopra un nido con uova, catene spezzate e una piccola fiamma attaccata alla roccia.

Da lontano e piccoli, i quattro edifici si devono riconoscere dalla sola SAGOMA e dal colore della pietra: cripta chiara, guglia viola, tronchi scuri, massi enormi.
```

Prompt B, il cuore della cittadella (stessa chat, dopo la A):

```text
Ora, nella stessa mano e con le stesse regole (trasparente, niente scritte, il colore della squadra di UN SOLO BLU SATURO), il foglio del cuore della cittadella, 1536×1024. Quattro righe, figure separate da almeno 40 px di trasparente:

1. IL CASTELLO al centro della cittadella, in TRE figure che crescono: un mastio con due torri; lo stesso con quattro torri e le mura più alte; lo stesso al massimo, con una torre centrale e gli stendardi. Ogni figura larga al massimo 300 px, con la stessa fondazione di pietra squadrata degli edifici del foglio di prima, solo più grande.
2. LA TESORERIA, che fa arrivare le monete: TRE figure che crescono, sulla stessa fondazione degli edifici di prima: un capanno con un forziere; un edificio di pietra con una ruota e i sacchi d'oro; al massimo una zecca con la cupola dorata.
3. LA PORTA DEL PONTE, larga 200 px e alta 120: un portone di legno rinforzato in mezzo a due torrette basse, in TRE stati: intatta, danneggiata e crepata, crollata a cumulo di sassi con le torrette spezzate.
4. LE COSE DEL LASTRICATO, piccole, per riempire gli spazi fra gli edifici: un braciere acceso, una fontana, una statua di cavaliere, barili, casse, una pila di palle di cannone, un pozzo, un carro, un'asta con lo stendardo blu, una rastrelliera di lance, un mucchio di legna, due panche. Almeno dodici pezzi, ognuno largo fra 50 e 110 px.
```

### 7b — Le caserme di Castle Battle sulle piazzole · ✅ provvisorio, 14 ottobre 2026 · la rifà la 7c

**Perché**: la 7 (edifici staccati descritti uno per uno) non ha dato niente di buono.
Provata a parole anche una città alla Heroes con gli edifici attaccati al castello, e
scartata prima di mandarla: una caserma si abbatte, e attaccata al castello non si
poteva. Il campo adesso è come il castello a torri: il castello spunta dal bordo, davanti
ci sono quattro piazzole fisse, e su ognuna si costruisce una caserma. Il prompt racconta
il gioco e lascia **libero di ideare** gli edifici (l'utente); fisse restano solo le
regole che servono a ritagliarli.

**Com'è andata**: il primo foglio (ChatGPT ha finito i gettoni, «non è la versione
definitiva») ha le righe da 6, 6, 8, 8: nella torre e nell'antro una forma semplice in più
all'inizio, che il foglietto salta; le piazzole non sono tutte della stessa misura, e lo
strumento le pareggia. È nel gioco così: un foglio nuovo si salva sopra e si rilancia
`python3 strumenti/sprite/caserme-arena.py`, correggendo il foglietto se le righe cambiano.

**Come si manda**: ChatGPT, chat nuova. Si allega uno screen del gioco di adesso (il campo
a metà partita, col pannello delle carte) e la piazzola (`terreno-bosco.png`, «la base è
questa»). **Sta in** `strumenti/sprite/sorgenti/arena/caserme.webp`, col foglietto `caserme.json`;
lo legge `strumenti/sprite/caserme-arena.py` (per righe, con `righe.py`), che scrive
`src/giochi/arena/dati/caserme-dipinte.js`. Il nemico ridipinge il blu di rosso.

```text
Ti racconto un gioco per bambini dai 6 ai 12 anni e ti chiedo di disegnarne gli edifici. La prima immagine allegata è uno screen del gioco com'è oggi, con gli edifici provvisori disegnati in codice: guardala per capire com'è fatto, non per lo stile. La seconda contiene la piazzola di legno e pietra su cui gli edifici si costruiscono.

IL GIOCO. Si chiama Castle Battle. Il campo è verticale: in basso il tuo castello, che spunta appena dal bordo, in alto quello del nemico, in mezzo un fiume con un ponte e una porta fortificata a ciascun capo. Fra la porta e il castello ci sono quattro piazzole fisse, come in un tower defense: su ognuna si costruisce una caserma. Non si piazza niente col dito: si sceglie cosa costruire o potenziare, e ogni scelta si paga con monete di battaglia e risolvendo un calcolo. Le caserme fanno uscire da sole le truppe, che col tempo diventano una piccola folla e marciano sulla strada verso il nemico. L'assedio ha un ordine: prima si sfonda la porta del ponte, poi si abbattono le caserme, e il castello cade per ultimo. Una caserma abbattuta lascia la sua piazzola, e si può ricostruire.

LE CASERME sono quattro, e costruendo ognuna si sceglie chi ci abita:
- la cripta delle ossa: scheletri ARCIERI oppure scheletri OPLITI con lancia e scudo;
- la tana: LUPI oppure PIPISTRELLI;
- la torre oscura: NEGROMANTI oppure DIAVOLETTI che lanciano bombe;
- l'antro dei giganti: un GOLEM di pietra oppure un DRAGO.
Le due versioni di una caserma sono lo stesso edificio: cambia la parte che dice chi ci abita. Dal livello 5 una caserma cresce. Anche il nemico ha le stesse caserme: sono le stesse immagini, ridipinte di rosso.

COSA TI CHIEDO: un foglio con tutte le caserme. Inventa tu che forma hanno: devono essere belle, diverse fra loro, riconoscibili da piccole dalla sola sagoma, e dire chi ci abita senza bisogno di scritte. Quattro righe, una per caserma, e in ogni riga sei figure: la prima versione appena costruita, la prima versione cresciuta, la seconda versione appena costruita, la seconda versione cresciuta, la caserma abbattuta (un rudere, macerie e una bandiera strappata) e la piazzola vuota.

LE REGOLE TECNICHE, queste sì precise, perché il foglio poi si taglia a pezzi: tutte le figure stanno SULLA STESSA PIAZZOLA della seconda immagine, vista dall'alto a tre quarti, della stessa misura in tutte e ventiquattro, e l'edificio non esce dalla piazzola di lato; il foglio è ORIZZONTALE, 1536×1024 px, su FONDO TRASPARENTE; ogni figura dentro una cella invisibile, con la piazzola sulla stessa linea delle altre della riga e almeno 30 px di trasparente fra una figura e l'altra; nessuna ombra sotto, nessun prato, nessun bagliore, nessuna cornice; NESSUNA PAROLA SCRITTA, NESSUN NUMERO; pixel art, ogni pixel del disegno un quadrato pieno di 4×4 px. Tetti, bandiere e stendardi di tutte le caserme sono di UN SOLO BLU SATURO E UNIFORME (come #2a5cff), nessun altro blu, e niente rosso tranne il fuoco: il gioco ridipinge quel blu di rosso per le caserme del nemico.
```

### 7c — Le caserme definitive, con la miniera · 1 immagine · ✅ 5 novembre 2026

**Perché**: il foglio della 7b è provvisorio ed è nato quando le truppe erano altre. Adesso sono fissate: la tana ha le mummie
(prima lupi) e le bestie cornute, che oggi prendono in prestito la capanna, e la miniera non c'è. Un foglio solo, ventisei figure.

**Come si manda**: ChatGPT, chat nuova. Si allegano in quest'ordine `sorgenti/arena/caserme.webp` (il foglio da rifare, per primo) e
`sorgenti/arena/schemi/partita.png` (il gioco, «solo per capire»): più di due allegati non passano.

**Si salva in** `strumenti/sprite/sorgenti/arena/caserme-2.png`. **Comando**: `python3 strumenti/sprite/caserme-arena.py`, che legge
il foglietto `caserme-2.json` e pretende righe da 6, 7, 5, 5, 3; se i conti non tornano si guarda
`python3 strumenti/sprite/righe.py strumenti/sprite/sorgenti/arena/caserme-2.png provino.png`. La miniera disegnata a monte resta finché il pezzo non c'è.

```text
Ti allego due immagini di un gioco per bambini dai 6 ai 12 anni, Castle Battle. La prima è il foglio provvisorio delle caserme: è il foglio da rifare, tienine il formato e l'idea di ogni edificio ma disegnalo molto meglio, più ricco, più epico, più curato. La seconda è una schermata del gioco: serve solo a capire chi abita le caserme e quanto piccole si vedono, non è lo stile da copiare.

IL GIOCO. Il campo è verticale: il tuo castello in basso, quello nemico in alto, in mezzo un fiume con un ponte. Davanti a ogni castello ci sono sei piazzole fisse di legno e pietra, e su ognuna si costruisce un edificio. Le caserme fanno uscire da sole le truppe. La miniera fa guadagnare monete. Un edificio abbattuto lascia un rudere sulla sua piazzola.

COSA TI CHIEDO: un foglio con ventisei figure, in cinque righe. Ogni figura sta sulla stessa piazzola di legno e pietra.
RIGA 1, la cripta delle ossa, sei figure: per gli scheletri ARCIERI la versione appena costruita e quella cresciuta, per gli scheletri OPLITI con lancia e scudo la versione appena costruita e quella cresciuta, il rudere della cripta, la piazzola vuota.
RIGA 2, la tana, sette figure: per le MUMMIE la versione appena costruita e quella cresciuta (una tomba di sabbia con le bende), per i PIPISTRELLI appena costruita e cresciuta (una grotta alta con le ali), per le BESTIE CORNUTE appena costruita e cresciuta (una tana di ossa e corna), il rudere della tana.
RIGA 3, la torre oscura, cinque figure: per i NEGROMANTI appena costruita e cresciuta, per i DIAVOLETTI che lanciano bombe appena costruita e cresciuta, il rudere della torre.
RIGA 4, l'antro dei giganti, cinque figure: per il GOLEM di pietra appena costruito e cresciuto, per il DRAGO appena costruito e cresciuto, il rudere dell'antro.
RIGA 5, la miniera, tre figure: la miniera appena costruita (un monte di roccia con l'imbocco armato di travi, le rotaie, un carrello pieno d'oro e una lanterna), la miniera cresciuta (più grande, con una torre di legno col verricello e le vene d'oro nella roccia), il rudere della miniera.

Le versioni dello stesso edificio si somigliano: cambia la parte che dice chi ci abita. Ogni edificio deve essere bello, riconoscibile da piccolo dalla sola sagoma e dire chi ci abita senza scritte. Il tono è epico e serio ma adatto ai bambini: niente sangue.

LE REGOLE TECNICHE, precise, perché il foglio si taglia a pezzi da solo: foglio ORIZZONTALE 1536×1024 px su FONDO TRASPARENTE; pixel art, ogni pixel del disegno un quadrato pieno di 4×4 px; vista dall'alto a tre quarti; tutte le figure stanno sulla stessa piazzola, della stessa misura in tutte e ventisei, larga circa 140 px, e l'edificio non esce dalla piazzola di lato; ogni riga è alta al massimo 190 px e le figure di una riga poggiano sulla stessa linea; almeno 30 px di trasparente fra una figura e l'altra, anche fra le righe, e niente che tocchi la figura vicina; nessuna ombra sotto, nessun prato, nessun bagliore, nessuna cornice; NESSUNA PAROLA SCRITTA, NESSUN NUMERO. Tetti, bandiere e stendardi di tutti gli edifici sono di UN SOLO BLU SATURO E UNIFORME (come #2a5cff), nessun altro blu, e niente rosso tranne il fuoco: il gioco ridipinge quel blu di rosso per il nemico.
```

### 8 — I quattro terreni di Castle Battle · 4 immagini · colline ✅ 5 novembre 2026 col ponte da stringere, canyon ✅ 6 novembre 2026 (Grok), deserto e cenere da fare

**Perché**: il terreno è più grande del campo e si adatta allo schermo senza stirarsi (`docs/arena/grafica.md`). In partita è
un'immagine già pronta, oggi disegnata a monte da `npm run disegni:arena`: ha già la forma giusta, il dipinto la rifà e non la inventa, e al
gioco non costa niente di più. Le colline hanno detto che lo stile regge. La base degli edifici sta nel foglio delle caserme, quindi nel terreno non ci va.

**Le colline, la modifica** (nella stessa chat, senza allegati; ha tolto i riquadri che ChatGPT aveva aggiunto e messo il ponte, uscito largo il 22%: in partita tocca le caserme):

```text
Modifica questa immagine e lascia identico tutto il resto: stessa inquadratura, stesso fiume, stessa strada, stessi alberi, campi e muretti, stessa grana. Due cambiamenti soltanto.
1. Togli i dodici riquadri di terra con i sassi attorno: al loro posto solo il terreno dorato, con qualche ciuffo e sassolino basso.
2. Aggiungi sul fiume, al centro esatto dove la strada lo incontra, UN PONTE EPICO di pietra chiara e legno, con l'edera rossa d'autunno: dritto in verticale, visto dall'alto come il resto, solo da una riva all'altra (dal 41% al 56% dell'altezza dell'immagine), largo in tutto il 10% dell'immagine con parapetti e spalle compresi, perché ai lati ci stanno gli edifici. Parapetti robusti, due archi che si vedono sull'acqua, lanterne o stendardi rossi e oro solo sui parapetti. Il piano del ponte resta libero e leggibile, perché ci camminano sopra le truppe: niente torri, niente porte, niente personaggi.
```

**Come si manda**: ChatGPT, **nella chat delle caserme**: proseguire o modificare un'immagine costa meno che ripartire da zero e tiene
tutto omogeneo (l'utente, 5/11). Si allega solo `sorgenti/arena/schemi/terreno-<chiave>.png` (lo rifà `npm run disegni:arena`). Se
un'immagine ha un difetto si chiede di correggerla, non di rifarla.

**Con Grok** il canyon è venuto al primo colpo, con due allegati: le colline per lo stile e lo schema per la disposizione. Gli altri due si fanno nella stessa chat, senza allegati, rifacendo il canyon in un altro posto: così le misure restano quelle che in partita hanno retto.

```text
Ora rifai questa stessa immagine in un altro posto. Tieni identici l'inquadratura, lo stile, la grana e tutte le misure: la fascia orizzontale al centro, la strada dritta, il ponte largo e lungo uguale, la zona attorno alla strada bassa e libera, col decoro alto solo ai lati. Cambia solo il mondo: di cristalli e roccia viola non deve restare niente.

IL POSTO: il deserto delle tombe. Dune di sabbia dorata con le creste al vento. La fascia al centro diventa un fiume d'oasi turchese con le rive verdi. La strada è un selciato antico di arenaria. Il ponte è di grandi lastre d'arenaria, con piccole colonne sui parapetti al posto delle catene. Ai lati obelischi e colonne spezzate mezzi sepolti, blocchi di tempio, e palme solo vicino all'acqua. Attorno alla strada solo sabbia e piccoli dettagli a terra. Sole alto e abbagliante, ombre nette.

Stesso formato 3:2. NESSUN EDIFICIO, NESSUN CASTELLO, NESSUN PERSONAGGIO, NESSUNA SCRITTA, nessuna cornice.
```

```text
Ora rifai questa stessa immagine in un altro posto ancora. Tieni identici l'inquadratura, lo stile, la grana e tutte le misure: la fascia orizzontale al centro, la strada dritta, il ponte largo e lungo uguale, la zona attorno alla strada bassa e libera, col decoro alto solo ai lati. Cambia solo il mondo: di sabbia, acqua e palme non deve restare niente.

IL POSTO: le terre di cenere, una notte rossa dopo una grande guerra. Terra nera e grigia di cenere con le crepe di brace. La fascia al centro diventa un fossato di brace che pulsa sotto una crosta nera. La strada è un selciato rotto. Il ponte è di ferro e pietra nera, con piccoli bracieri accesi sui parapetti. Ai lati alberi morti, spuntoni di roccia, vecchie spade piantate nel terreno, stendardi strappati. Attorno alla strada solo terreno e piccoli dettagli a terra. Tono cupo ma adatto ai bambini: niente sangue, niente teschi in primo piano. Luce rossa dal basso.

Stesso formato 3:2. NESSUN EDIFICIO, NESSUN CASTELLO, NESSUN PERSONAGGIO, NESSUNA SCRITTA, nessuna cornice.
```

Le colline, nella stessa chat, con `terreno-bosco.png` allegato:

```text
Ora riprendi questa immagine delle colline e lascia identico tutto il resto: stessa inquadratura, stesso fiume, stessa strada, stessi alberi, campi e muretti, stessa grana. Un cambiamento soltanto: il ponte è troppo largo. Rifallo stretto come quello del canyon, meno della metà di adesso. Tieni la pietra chiara, il legno, l'edera rossa e gli stendardi rossi e oro sui parapetti. Dove il ponte si ritira ci va il fiume con le sue rive, come ai lati. Il formato resta 3:2.
```

**Si salva in** `strumenti/sprite/sorgenti/arena/terreno-<chiave>.png` (`bosco`, `palude`, `neve`, `lava`). **Comando**:
`python3 strumenti/sprite/terreni-arena.py`. Lo strumento si ferma se l'immagine non è 3:2: non si stira mai, e i dipinti entrano in gioco solo quando ci sono tutti e quattro. Il ponte è del dipinto, perché ChatGPT lo fa
meglio del disegno in codice; la porta, il castello e la base degli edifici li mette il gioco, quindi nel dipinto non ci devono essere. Se il fiume esce storto o la strada si sposta, si scarta: il motore
cammina dov'è il disegno.

**Le colline d'oro** (`terreno-bosco.png`):

```text
Ora, nello stesso identico stile, con la stessa grana e gli stessi colori pieni, mi serve il terreno su cui stanno queste caserme. Questa volta non è un foglio di figure: è una scena unica a fondo pieno, senza trasparenza, vista dall'alto a tre quarti. Ridipingi l'immagine allegata: l'ho disegnata con un programma, la forma è giusta ma il disegno è povero. Tieni esattamente la stessa disposizione.

IL POSTO: le colline d'oro, un tramonto d'autunno. Erba secca dorata, campi di grano, boschi di querce rosse e arancioni, muretti di pietra, un fiume color verde scuro con i riflessi del sole basso. Luce calda e radente da in alto a sinistra, ombre lunghe.

LA DISPOSIZIONE, da rispettare al millimetro, perché il gioco ci cammina sopra: il fiume attraversa tutta l'immagine in orizzontale, alto il 9% dell'immagine al centro, esattamente a metà altezza, e più largo verso i bordi. La strada è dritta in verticale al centro esatto, larga il 4% dell'immagine, da sopra a sotto, e attraversa il fiume su UN PONTE EPICO di pietra chiara e legno, con l'edera rossa d'autunno: dritto e snello, solo da una riva all'altra (dal 41% al 56% dell'altezza dell'immagine, niente sulla terra oltre le rive), largo in tutto il 10% dell'immagine con parapetti e spalle compresi, perché ai lati ci stanno gli edifici; il piano libero e leggibile, ci camminano sopra le truppe (niente torri, niente porte). La fascia centrale, dal 33% al 67% della larghezza, deve restare bassa e libera: solo terreno e piccoli dettagli a terra, niente alberi, niente rocce alte, niente che sembri una cosa da toccare. NIENTE chiazze né riquadri di terra: la base degli edifici la mette il gioco. Il decoro alto sta solo fuori da quella fascia.

LE REGOLE TECNICHE: immagine ORIZZONTALE 1536×1024 px che riempie tutto il quadro; pixel art, ogni pixel del disegno un quadrato pieno di 4×4 px; NESSUNA CASERMA, NESSUN CASTELLO, NESSUN EDIFICIO, NESSUN PERSONAGGIO, NESSUNA PAROLA SCRITTA, nessuna cornice. Ai quattro bordi il disegno continua specchiato, quindi niente di grande tagliato a metà sul bordo.
```

**Il deserto delle tombe** (`terreno-palude.png`):

```text
Ora, nello stesso identico stile, con la stessa grana e gli stessi colori pieni, mi serve il terreno su cui stanno queste caserme. Questa volta non è un foglio di figure: è una scena unica a fondo pieno, senza trasparenza, vista dall'alto a tre quarti. Ridipingi l'immagine allegata: l'ho disegnata con un programma, la forma è giusta ma il disegno è povero. Tieni esattamente la stessa disposizione.

IL POSTO: il deserto delle tombe. Dune di sabbia dorata con le creste al vento, obelischi e colonne spezzate mezzi sepolti, blocchi di tempio, e un fiume d'oasi turchese con le rive verdi e le palme solo vicino all'acqua. Sole alto e abbagliante, ombre nette.

LA DISPOSIZIONE, da rispettare al millimetro, perché il gioco ci cammina sopra: il fiume attraversa tutta l'immagine in orizzontale, alto il 9% dell'immagine al centro, esattamente a metà altezza, e più largo verso i bordi. La strada è un selciato antico, dritto in verticale al centro esatto, largo il 4% dell'immagine, da sopra a sotto, e attraversa il fiume su UN PONTE EPICO di grandi lastre d'arenaria, con colonne e obelischi ai lati: dritto e snello, solo da una riva all'altra (dal 41% al 56% dell'altezza dell'immagine, niente sulla terra oltre le rive), largo in tutto il 10% dell'immagine con parapetti e spalle compresi, perché ai lati ci stanno gli edifici; il piano libero e leggibile, ci camminano sopra le truppe (niente torri, niente porte). La fascia centrale, dal 33% al 67% della larghezza, deve restare bassa e libera: solo sabbia e piccoli dettagli a terra, niente palme, niente colonne, niente che sembri una cosa da toccare. NIENTE chiazze né riquadri di terra: la base degli edifici la mette il gioco. Il decoro alto sta solo fuori da quella fascia.

LE REGOLE TECNICHE: immagine ORIZZONTALE 1536×1024 px che riempie tutto il quadro; pixel art, ogni pixel del disegno un quadrato pieno di 4×4 px; NESSUNA CASERMA, NESSUN CASTELLO, NESSUN EDIFICIO, NESSUN PERSONAGGIO, NESSUNA PAROLA SCRITTA, nessuna cornice. Ai quattro bordi il disegno continua specchiato, quindi niente di grande tagliato a metà sul bordo.
```

**Il canyon di cristallo** (`terreno-neve.png`):

```text
Ora, nello stesso identico stile, con la stessa grana e gli stessi colori pieni, mi serve il terreno su cui stanno queste caserme. Questa volta non è un foglio di figure: è una scena unica a fondo pieno, senza trasparenza, vista dall'alto a tre quarti. Ridipingi l'immagine allegata: l'ho disegnata con un programma, la forma è giusta ma il disegno è povero. Tieni esattamente la stessa disposizione.

IL POSTO: il canyon di cristallo. Roccia scura blu violetta a lastre, percorsa da vene che brillano, grandi grappoli di cristalli viola, azzurri e rosa, guglie di pietra. Al posto del fiume c'è un baratro senza fondo con la nebbia viola che sale dal buio. Luce fredda che viene dai cristalli.

LA DISPOSIZIONE, da rispettare al millimetro, perché il gioco ci cammina sopra: il baratro attraversa tutta l'immagine in orizzontale, alto il 9% dell'immagine al centro, esattamente a metà altezza, e più largo verso i bordi. La strada è un selciato dritto in verticale al centro esatto, largo il 4% dell'immagine, da sopra a sotto, e attraversa il baratro su UN PONTE EPICO di pietra scura sospeso con le catene, con cristalli incastonati: dritto e snello, solo da una riva all'altra (dal 41% al 56% dell'altezza dell'immagine, niente sulla terra oltre le rive), largo in tutto il 10% dell'immagine con parapetti e spalle compresi, perché ai lati ci stanno gli edifici; il piano libero e leggibile, ci camminano sopra le truppe (niente torri, niente porte). La fascia centrale, dal 33% al 67% della larghezza, deve restare bassa e libera: solo roccia e piccoli dettagli a terra, niente cristalli alti, niente guglie, niente che sembri una cosa da toccare. NIENTE chiazze né riquadri di terra: la base degli edifici la mette il gioco. Il decoro alto sta solo fuori da quella fascia.

LE REGOLE TECNICHE: immagine ORIZZONTALE 1536×1024 px che riempie tutto il quadro; pixel art, ogni pixel del disegno un quadrato pieno di 4×4 px; NESSUNA CASERMA, NESSUN CASTELLO, NESSUN EDIFICIO, NESSUN PERSONAGGIO, NESSUNA PAROLA SCRITTA, nessuna cornice. Ai quattro bordi il disegno continua specchiato, quindi niente di grande tagliato a metà sul bordo.
```

**Le terre di cenere** (`terreno-lava.png`):

```text
Ora, nello stesso identico stile, con la stessa grana e gli stessi colori pieni, mi serve il terreno su cui stanno queste caserme. Questa volta non è un foglio di figure: è una scena unica a fondo pieno, senza trasparenza, vista dall'alto a tre quarti. Ridipingi l'immagine allegata: l'ho disegnata con un programma, la forma è giusta ma il disegno è povero. Tieni esattamente la stessa disposizione.

IL POSTO: le terre di cenere, una notte rossa dopo una grande guerra. Terra nera e grigia di cenere con le crepe di brace, alberi morti, spuntoni di roccia, vecchie spade piantate nel terreno, stendardi strappati, bracieri. Al posto del fiume c'è un fossato di brace che pulsa sotto una crosta nera. Tono cupo ma adatto ai bambini: niente sangue, niente teschi in primo piano. Luce rossa dal basso.

LA DISPOSIZIONE, da rispettare al millimetro, perché il gioco ci cammina sopra: il fossato attraversa tutta l'immagine in orizzontale, alto il 9% dell'immagine al centro, esattamente a metà altezza, e più largo verso i bordi. La strada è un selciato rotto, dritto in verticale al centro esatto, largo il 4% dell'immagine, da sopra a sotto, e attraversa il fossato su UN PONTE EPICO di ferro e pietra nera, con bracieri accesi ai lati: dritto e snello, solo da una riva all'altra (dal 41% al 56% dell'altezza dell'immagine, niente sulla terra oltre le rive), largo in tutto il 10% dell'immagine con parapetti e spalle compresi, perché ai lati ci stanno gli edifici; il piano libero e leggibile, ci camminano sopra le truppe (niente torri, niente porte). La fascia centrale, dal 33% al 67% della larghezza, deve restare bassa e libera: solo terreno e piccoli dettagli a terra, niente alberi, niente spuntoni, niente che sembri una cosa da toccare. NIENTE chiazze né riquadri di terra: la base degli edifici la mette il gioco. Il decoro alto sta solo fuori da quella fascia.

LE REGOLE TECNICHE: immagine ORIZZONTALE 1536×1024 px che riempie tutto il quadro; pixel art, ogni pixel del disegno un quadrato pieno di 4×4 px; NESSUNA CASERMA, NESSUN CASTELLO, NESSUN EDIFICIO, NESSUN PERSONAGGIO, NESSUNA PAROLA SCRITTA, nessuna cornice. Ai quattro bordi il disegno continua specchiato, quindi niente di grande tagliato a metà sul bordo.
```

### 9 — Le fortezze dei quattro posti · 1 immagine · da fare

**Perché**: il castello è ancora quello del vestito `bosco` del castello a torri, ricolorato a monte; porta e ponte sono disegnati a monte col programma.

**Come si manda**: ChatGPT, chat nuova. Si allegano `sorgenti/arena/schemi/partita.png` e, se ci sono già, i terreni riusciti («solo stile»).

**Si salva in** `strumenti/sprite/sorgenti/arena/fortezze.png`. **Comando**: `python3 strumenti/sprite/fortezze-arena.py`, che legge il foglietto
`fortezze.json` e pretende quattro righe da cinque. Il nemico ridipinge il blu di rosso.

```text
Ti chiedo un foglio di fortezze per un gioco di battaglia per bambini, Castle Battle. L'immagine allegata è una schermata del gioco: guardala per capire le misure, non per lo stile. Il gioco ha quattro posti e voglio per ognuno il suo castello, epico e bellissimo, la sua porta fortificata e il suo ponte.

COSA TI CHIEDO: quattro righe da cinque figure. Ogni riga è un posto: da sinistra il CASTELLO, la PORTA INTERA (due torri merlate e un portone in mezzo), la stessa PORTA ROTTA (crepe, portone sfondato), la stessa PORTA CROLLATA (un cumulo di macerie) e il PONTE, visto dall'alto, più alto che largo, da attraversare dal basso verso l'alto.
RIGA 1, le colline d'oro: pietra chiara calda, legno, edera rossa d'autunno.
RIGA 2, il deserto delle tombe: arenaria, colonne, obelischi, ponte di lastre.
RIGA 3, il canyon di cristallo: pietra scura violetta con cristalli incastonati, ponte di pietra sospeso con le catene.
RIGA 4, le terre di cenere: pietra nera, ferro, bracieri accesi, ponte di ferro e assi bruciate.

Il castello si vede dal davanti a tre quarti, con la base larga e le torri alte: nel gioco ne spunta solo un pezzo dal bordo dello schermo, quindi deve essere bello sia in cima sia al portone.

LE REGOLE TECNICHE, precise, perché il foglio si taglia a pezzi da solo: foglio ORIZZONTALE 1536×1024 px su FONDO TRASPARENTE; pixel art, ogni pixel del disegno un quadrato pieno di 4×4 px; ogni riga è alta al massimo 230 px; il castello è largo circa 340 px, le porte circa 200 px, il ponte circa 150 px; le figure di una riga poggiano sulla stessa linea; almeno 30 px di trasparente fra una figura e l'altra, anche fra le righe; nessuna ombra sotto, nessun prato, nessun bagliore, nessuna cornice; NESSUNA PAROLA SCRITTA, NESSUN NUMERO. Tetti, bandiere e stendardi sono di UN SOLO BLU SATURO E UNIFORME (come #2a5cff), nessun altro blu, e niente rosso tranne il fuoco: il gioco ridipinge quel blu di rosso per il nemico.
```

### 10 — La copertina di Castle Battle · 1 immagine · da fare

**Perché**: quella della home è un quadro di un foglio di prova, e il frontone della mappa è solo uno scorcio del terreno. Un disegno bello per tutti e due.

**Come si manda**: ChatGPT, chat nuova. Si allega `sorgenti/arena/schemi/partita.png` («per capire il gioco»).

**Si salva in** `strumenti/sprite/sorgenti/home/copertina-arena.png`, che vince sul quadro di `foglio_arena.webp`. **Comando**:
`python3 strumenti/sprite/terreni-arena.py && python3 strumenti/sprite/copertine.py`. Il frontone ne mostra la striscia di mezzo: il soggetto sta lì.

```text
Dipingi la copertina di un gioco di battaglia per bambini dai 6 ai 12 anni, Castle Battle. L'immagine allegata è una schermata del gioco: serve solo a capire di cosa parla, non a copiarne lo stile.

LA SCENA: un grande campo di battaglia al tramonto, visto da lontano e dall'alto. A sinistra un castello con i tetti blu, a destra un castello con i tetti rossi, e fra i due un fiume con un ponte. Sul ponte due eserciti si incontrano: scheletri con arco e scudo, mummie, golem di pietra e negromanti da una parte e dall'altra, e sopra di loro un drago rosso che vola. Cielo enorme, luce dorata, polvere, stendardi al vento. Epico come il poster di un film, ma adatto ai bambini: niente sangue, niente ferite.

LE REGOLE: immagine ORIZZONTALE 1536×1024 px, pixel art ricca, ogni pixel del disegno un quadrato pieno di 4×4 px. La parte importante sta nella striscia centrale, fra il 30% e il 70% dell'altezza: il resto può essere tagliato. NESSUNA PAROLA SCRITTA, NESSUN TITOLO, nessuna cornice.
```

### 11 — Le icone dei comandi · 1 immagine · da fare

**Perché**: accanto a un edificio stanno tre pulsanti, e con emoji di stili diversi facevano brutto (l'utente). Oggi sono undici icone di una famiglia sola
disegnate in `viste/Icona.vue`: il foglio le rifà più belle, e i pulsanti non cambiano.

**Come si manda**: ChatGPT, chat nuova. Si allega `sorgenti/arena/schemi/partita.png`, «solo per capire il gioco».

**Si salva in** `strumenti/sprite/sorgenti/arena/icone.png`. **Comando**: `python3 strumenti/sprite/icone-arena.py`, che legge il foglietto `icone.json`, pretende
righe da 4, 4, 3 e mette ogni icona nello stesso quadrato.

```text
Dipingi un foglio di icone per i comandi di un gioco di battaglia per bambini, Castle Battle, in stile fantasy epico. L'immagine allegata è una schermata del gioco: serve solo a capire il tono. La cosa più importante: le undici icone sono UNA FAMIGLIA SOLA. Stesso stile, stesso tratto scuro attorno, stessa luce da in alto a sinistra, stessa grandezza a schermo, stesso peso visivo. Messe in fila devono sembrare fatte dalla stessa mano, come le icone di un gioco di strategia.

COSA TI CHIEDO, tre righe.
RIGA 1, quattro icone: una doppia freccia verde verso l'alto (potenzia), un sacchetto di monete d'oro (vendi), un segno di spunta verde (confermo), una pergamena scritta (i numeri).
RIGA 2, quattro icone: una chiave inglese d'acciaio (ripara), una bomba nera con la miccia accesa (bomba), un piccone (miniera), una luna con una Z (riposa).
RIGA 3, tre icone: una clessidra d'oro (il tempo), il simbolo dell'infinito in oro, un diamante azzurro (le monete di battaglia).

LE REGOLE TECNICHE, precise, perché il foglio si taglia a pezzi da solo: foglio ORIZZONTALE 1536×1024 px su FONDO TRASPARENTE; pixel art, ogni pixel del disegno un quadrato pieno di 4×4 px; ogni icona sta in un quadrato di circa 220 px e lo riempie; almeno 60 px di trasparente fra un'icona e l'altra, anche fra le righe, e ogni icona è un pezzo solo, senza parti staccate; nessun fondo, nessun cerchio o bottone attorno, nessuna ombra sotto, nessun bagliore, nessuna cornice; NESSUNA PAROLA SCRITTA, NESSUN NUMERO, tranne la Z della luna.
```

### 12 — Le truppe di Castle Battle con la casacca · 1 immagine · ✅ 5 novembre 2026 (Grok), due pose degli opliti da rifare

**Perché**: la squadra di una truppa oggi si legge da un contorno e da un disco; farlo in codice non regge (`docs/arena/grafica.md`). La casacca va
dipinta sulla figura: una stoffa blu per ognuna, e il nemico la ha rossa da `ricolora()`, come le caserme. Sono le 35 pose che il gioco usa e solo quelle.

**Come si manda**: ChatGPT, nella chat delle caserme. Si allega solo `sorgenti/arena/schemi/truppe.png` (lo rifà `python3 strumenti/sprite/truppe-arena.py`).

**Si salva in** `strumenti/sprite/sorgenti/arena/truppe.png`, stessa griglia (sette per cinque, qualunque misura). **Comando**: `python3 strumenti/sprite/truppe-arena.py`. Una posa uscita male si
fa uguale a un'altra in `truppe.json` finché non è corretta: oggi le 6 e 7, senza casacca.

```text
Ti allego il foglio delle truppe di questo stesso gioco: 35 figure, sette per riga, cinque righe. Sono pose di un'animazione, e il gioco ha due squadre uguali che oggi non si distinguono: mi serve lo stesso foglio con ogni figura vestita del colore della squadra.

COSA TI CHIEDO: ridipingi le 35 figure nello stesso stile delle caserme, nella stessa casella, con la stessa posa, la stessa misura e i piedi alla stessa altezza, e aggiungi a ognuna una stoffa di UN SOLO BLU vivo, cucita e ombreggiata come parte del personaggio, ben visibile anche da piccola, che resti uguale in tutte le pose della stessa truppa.
Le figure, in ordine di lettura:
1-4, gli scheletri arcieri: una casacca blu corta sul torace, con la cintura.
5-7, gli scheletri opliti: la stessa casacca, e lo scudo col bordo blu.
8-11, le mummie: una casacca blu sopra le bende.
12-15, i diavoletti: un gilet blu e una fascia in vita.
16-19, i pipistrelli: una mantellina blu sul dorso. Le ali diventano viola scuro, senza blu.
20-21, le bestie cornute: una gualdrappa blu sulla schiena.
22-25, i negromanti: la veste diventa blu, il cappuccio resta viola.
26-29, i golem: una grande fascia di stoffa blu a tracolla.
30-35, i draghi: una sella con la gualdrappa blu.

LE REGOLE TECNICHE, precise, perché il foglio si taglia a pezzi da solo: foglio ORIZZONTALE 1536×1024 px su FONDO TRASPARENTE; pixel art, ogni pixel del disegno un quadrato pieno di 4×4 px; le figure staccate fra loro; il blu solo sulla stoffa, perché nel gioco diventa rosso per il nemico: niente altro di blu in tutto il foglio; niente ombre a terra, NESSUNA PAROLA SCRITTA, nessuna cornice.
```

### 12b — Le truppe nuove, un foglio blu e uno rosso · 2 immagini · da fare

**Perché**: le squadre sono due sole e al gioco bastano quattro pose per truppa, quindi si disegnano da zero sul loro colore invece di ricalcare le figure del castello e tingere il
nemico. Le pose hanno un compito: fermo, due passi che si alternano (un ciclo intero da un foglio non viene: voce 5) e il colpo, che oggi manca.

**Come si manda**: nella chat di Grok del foglio delle truppe, prima il blu e poi il rosso. In una chat nuova si allega `sorgenti/arena/truppe.png`, solo per lo stile.

**Si salva in** `strumenti/sprite/sorgenti/arena/truppe-blu.png` e `truppe-rosso.png`. Il taglio (otto colonne per cinque righe) e il gioco che prende ogni squadra dal suo foglio si fanno quando ci sono;
la misura in campo resta quella di oggi, la dà `SCALA`, e l'arco di `arco()` non serve più.

**La squadra blu**:

```text
Disegna da zero le truppe di Castle Battle, un gioco di battaglia per bambini dai 6 ai 12 anni, nello stesso stile pixel art del foglio di prima: stessa grana, contorno scuro, figure simpatiche ma da battaglia, ben riconoscibili anche da piccole. Non devi ricalcare le figure di prima: sono solo un'idea di chi è chi.

Questa è la squadra BLU: ogni figura è nata blu, con le sue sfumature dal blu notte all'azzurro, e ogni cosa che brilla è azzurra.

COSA TI CHIEDO: un foglio con 9 truppe, 4 pose ciascuna. Tutte le figure guardano a DESTRA, viste di lato. Le 4 pose di ogni truppa, sempre in quest'ordine: 1 ferma, 2 un passo con il piede avanti, 3 il passo con l'altro piede avanti, 4 mentre colpisce. Chi vola: 1 ali a metà, 2 ali in alto, 3 ali in basso, 4 mentre colpisce. Le pose di una truppa sono la stessa figura, stessi colori, stessa misura, stessi dettagli: cambiano solo braccia, gambe o ali.

RIGA 1: gli SCHELETRI ARCIERI (ossa chiare con riflessi azzurri, casacca blu, arco in mano; nel colpo tendono l'arco) e gli SCHELETRI OPLITI (casacca blu, lancia, grande scudo blu; nel colpo affondano la lancia).
RIGA 2: le MUMMIE (bende azzurro-grigie, occhi azzurri, casacca blu; nel colpo allungano le braccia) e i DIAVOLETTI (pelle blu, corna dorate; nel colpo lanciano una bomba azzurra).
RIGA 3: i PIPISTRELLI (ali e corpo blu elettrico, occhi chiari; nel colpo mordono) e le BESTIE CORNUTE (grosse, pelo blu notte, crepe azzurre luminose, corna dorate; nel colpo caricano a testa bassa).
RIGA 4: i NEGROMANTI (veste e cappuccio blu, bastone con la sfera azzurra; nel colpo lanciano la magia) e i GOLEM (massicci, roccia grigio-blu con cristalli azzurri; nel colpo alzano i pugni).
RIGA 5: i DRAGHI (scaglie e ali blu, pancia azzurra; nel colpo sputano una fiammata azzurra).

LE REGOLE TECNICHE, precise, perché il foglio si taglia a pezzi da solo: foglio ORIZZONTALE su FONDO TRASPARENTE, una griglia regolare di otto colonne e cinque righe, ogni figura nella sua casella e staccata dalle altre, centrata, con i piedi tutti alla stessa altezza in fondo alla casella. Le righe da 1 a 4 hanno due truppe, quattro caselle ciascuna; la riga 5 ha solo le prime quattro caselle piene. Niente rosso, niente ombre a terra, NESSUNA PAROLA SCRITTA, nessuna cornice.
```

**La squadra rossa** (subito dopo, nella stessa chat):

```text
Ora lo stesso identico foglio per la squadra ROSSA: stesse 9 truppe, stesse pose, stessa griglia, stessa misura, figura per figura. Cambia solo il colore: ogni figura è nata rossa, con le sue sfumature dal rosso scuro all'arancio, e ogni cosa che brilla è rossa e arancio. Ossa chiare con riflessi caldi e casacche rosse, bende color sabbia rosata, diavoletti rossi con la bomba di fuoco, pipistrelli rosso scuro, bestie rosso brace con le crepe di fuoco, negromanti con veste rossa e magia di fuoco, golem di roccia bruna con le crepe di lava, draghi rossi con la fiammata arancio. Tutte le figure guardano sempre a DESTRA. Stesse regole tecniche, e niente blu.
```

## In fila

*Le scene `td_2/3/4.png` sono state eliminate il 13/10/2026 (stanno già in `terreno-neve/lava/palude.png`): dove la tabella le nomina come allegato di uno stile, si allega il `terreno-*.png` del vestito. `td_1.png` resta.*

| # | cosa | immagini | allegati | si salva come | sblocca |
|---|---|---|---|---|---|
| 1 ✅ | foglio del terreno, bosco | 1 | `td_1`, schema del foglio | `castello/generati/terreno-bosco.png` | le carte vere |
| 2 ✅ | le torri (tolte il 29/9, le ha sostituite la 2b) | 1 | `td_1`, `PVX1O` | ~~`castello/generati/torri-1.png`~~ | le torri pubblicabili |
| 2b ✅ | le torri rifatte (ChatGPT) | 1 | `td_1`, `torri-1` | `castello/generati/torri-2.png` | quattro torri che si distinguono |
| 3 — | la lava più calma (non serve più) | 1 | (chat di `td_3`) | — (il nome `td_4.png` è andato alla palude) | un vestito che si legge |
| 4 ✅ | fogli del terreno, neve e lava | 2 | la scena del vestito | `terreno-neve.png`, `terreno-lava.png` | gli altri due vestiti |
| 4b ✅ | la scena e il foglio del terreno della palude | 2 | `terreno-neve`, `td_4`, chat nuova | `td_4.png`, `terreno-palude.png` | la palude col suo vestito |
| 5 | i mostri che camminano, un video per creatura | 1 al giorno | la creatura ritagliata | `creature/passi/<creatura>.png` (`cammino.py`) | mostri che camminano, di lato e di fronte |
| 6 | gli eroi | 1 | `mostri-1`, una scena | — | l'addio a 0x72 |
| 7 ✗ | la cittadella di Castle Battle a fogli (ChatGPT, 13/10: niente di buono) | 2 | `torri-2`, `td_1` | — | — |
| 7b ✅ | le caserme di Castle Battle sulle piazzole (ChatGPT, il gioco raccontato; provvisorio) | 1 | uno screen del gioco, `terreno-bosco` | `arena/caserme.webp` | caserme dipinte, rudere e piazzola vuota |
| 7c ✅ | le caserme definitive di Castle Battle, con mummie, bestie cornute e miniera (ChatGPT) | 1 | `arena/caserme.webp`, `schemi/partita` | `arena/caserme-2.png` | caserme e miniera dipinte |
| 8 | i quattro terreni di Castle Battle (ChatGPT, si ridipinge il disegno in codice) | 4 | `schemi/terreno-<chiave>` | `arena/terreno-<chiave>.png` | il terreno dipinto |
| 9 | castello, porta e ponte dei quattro posti (ChatGPT) | 1 | `schemi/partita` | `arena/fortezze.png` | i castelli di Castle Battle |
| 10 | la copertina di Castle Battle (ChatGPT) | 1 | `schemi/partita` | `home/copertina-arena.png` | la home e il frontone della mappa |
| 11 | le icone dei comandi di Castle Battle (ChatGPT) | 1 | `schemi/partita` | `arena/icone.png` | l'anello, ripara e bomba dipinti |
| 12 ✅ | le truppe di Castle Battle con la casacca (Grok) | 1 | `schemi/truppe` | `arena/truppe.png` | la squadra si legge dalla figura, via il contorno |
| 12b | le truppe nuove da zero, un foglio per squadra (Grok) | 2 | `arena/truppe`, solo per lo stile | `arena/truppe-blu.png`, `arena/truppe-rosso.png` | il nemico dipinto invece che tinto |

Il **minimo per rifare il gioco** sono l'1 e il 2: col bosco, le torri
nuove e i mostri che ci sono già il castello si gioca e si pubblica. Il
resto lo fa più bello, non lo fa funzionare. Dopo ognuno,
`node test/esegui.mjs torri-figure --scatti` e un'occhiata agli
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
