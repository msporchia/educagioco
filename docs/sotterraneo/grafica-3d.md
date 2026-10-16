# Il Sotterraneo 3D: la discesa con la luce

**Sotterraneo 3D** (`sotterraneo3d`) è un gioco in prova: lo stesso
Sotterraneo, con la discesa disegnata in WebGL (three.js) partendo dal
prototipo approvato (`poc/sotterraneo-luce`, [../../poc/sotterraneo-luce.md](../../poc/sotterraneo-luce.md)).
Il **Sotterraneo** di sempre (`sotterraneo`) resta com'era, in 2D, ed è
quello dei bambini. Il motore, le domande, la barra e i pannelli sono gli
stessi: cambia chi disegna la discesa. La terra di sopra (villaggio,
mercanti, missioni, bottega, portale gemello) resta quella del 2D, e il 3D
la attraversa così com'è (fase 1).

## Un gioco in prova, la stessa partita

- **La carta c'è solo coi giochi in prova accesi** (`sperimentale: true`
  nella riga di `src/data/giochi.js`, [../genitori/interruttori.md](../genitori/interruttori.md)).
- **La stessa schermata, un disegno diverso**: `Gioco3d.vue` monta
  `Gioco.vue` col prop `disegno: '3d'`; senza il prop è il 2D di sempre.
  `inheritAttrs: false`: il `disegno` che App.vue passa a ogni schermata
  (vuoto) non deve cadere su Gioco.
- **Lo stesso avanzamento** (scelta di questa fase): la chiave della
  campagna resta `sotterraneo`, cioè le stesse avventure, la stessa roba,
  le stesse missioni, la stessa sosta. Un gioco non aggiunge campi al
  profilo, e due copie della stessa avventura si separerebbero. **La sosta
  è una sola**: una discesa lasciata con la ✕ nel 3D si riprende anche dal
  Sotterraneo di sempre, e viceversa (il piano si rifà dal seme, il disegno
  non conta). «Riprendi da qui» in home riapre il Sotterraneo di sempre,
  perché la ripresa è sua (`ripresa` del manifesto).
- **Le sessioni** contano `sotterraneo3d` per conto suo (il tempo di gioco),
  la portata e il «già provato» sono quelli del Sotterraneo (`GEMELLI` e
  `TAPPE_DEL_GIOCO` in `data/portata-giochi.js`).
- **Il portale** in 3D si vede (il velo lampeggia, l'eroe ci si stringe
  dentro) e solo dopo si sale: la sosta è già scritta, e mentre si passa non
  si riscrive (`salendo` in Gioco.vue).

## Dove sta cosa

Tutto in `src/giochi/sotterraneo/scena3d/`, un file per tema.

| file | cosa tiene |
|---|---|
| `indice.js` | `creaSotterraneo3d`: la porta verso Gioco.vue (le stesse di scena/tela.js più il dito, il colpo, gli agganci, `grafica()`), il giro di ogni fotogramma |
| `contesto.js`, `webgl.js` | il contesto WebGL 2 chiesto a mano, il renderer, il pixel ratio che si adatta, le misure; `haWebGL2` senza three |
| `costanti.js` | telecamera, luce, misure, e `ACCESI`: **il punto unico dove si spegne un pezzo** |
| `aspetti.js` | l'aspetto di ogni paesaggio (puro): [paesaggi-3d.md](paesaggi-3d.md) |
| `pianta.js` | il livello del motore tradotto in pezzi: pavimento, muri alti e parapetti, colonne, acqua, torce (puro) |
| `visibilita.js`, `maschera.js` | visto, ricordato, mai visto: la maschera scritta dalla luce del motore (pura) e iniettata nei materiali, col buco nei muri |
| `piano.js` | un piano: costruisce e butta quello che sta fermo |
| `terreno.js` | pavimento (anche sotto i muri), le pareti scolpite (quattro chiamate), colonne nella forma del paesaggio, staffe; i muri che si abbassano nello scontro (una trama letta dallo shader) |
| `pareti.js`, `pitture.js` | la forma delle pareti (un campo continuo che sposta le facce) e i disegni di pavimento e pareti, per stile (puri) |
| `trame.js`, `rumore.js` | le pitture fatte trame, la normal map finta dell'atlante, il rumore 2D e 3D |
| `figure.js` | **tutte** le figure dell'atlante in un InstancedMesh (una chiamata) |
| `cose.js` | quale figura per ogni cosa del motore, i chiarori, i segni sopra la testa; lo stato di disegno dei mostri |
| `eroe.js` | l'eroe, le armi in mano, la torcia |
| `luci.js` | la torcia (alone e cono, una passata d'ombra), la riserva fissa dei fuochi, lampo, magia, palco |
| `segni.js` | fiamme, chiarori per terra, colonne di luce, anelli, bolla (istanziati) |
| `particelle.js` | nebbia, l'aria del paesaggio (polvere, braci, gocce, neve, brina, lucciole, bolle: `ARIA`), scintille |
| `arredo3d.js`, `raggi.js` | l'arredo modellato e fitto del paesaggio, le lame di luce dall'alto |
| `acqua.js`, `relitti.js`, `fontana.js`, `portale.js`, `botti.js` | le pozze con le rive storte (lava nell'inferno, il velo del tempio), i relitti in codice, le cose di scena modellate, le botti di decoro |
| `palco.js`, `scontro.js`, `racconto.js` | dove stanno i combattenti (puro), il palco che si apre e si chiude col foglio del motore, il turno raccontato in scena |
| `azione.js`, `dito.js` | il punta-e-clicca (puro) e la scelta di cosa sta sotto il dito |
| `camera.js`, `post.js`, `contorno.js`, `etichette.js` | la telecamera, il passaggio finale, la mappina e le feste, i segni in HTML |

Fuori da `scena3d/`: `dati/paesaggi.js` (i paesaggi e il cheat, senza three), `Gioco3d.vue` (il cancello del WebGL), le righe `in3d`
di `Gioco.vue`, `viste/Scontro3d.vue` (le scritte dello scontro sopra le
figure), `viste/Pannello3d.vue` (la scelta e la domanda in fondo),
`stile-3d.css`, `scena/minimappa.js` (la mappina, la stessa del 2D).

**Per chi viene dopo**: la terra di sopra in 3D è una vista sua accanto a
`viste/Terra.vue` (Gioco.vue la sceglie con lo stesso `in3d`); l'arredo per
paesaggio si fa in `arredo3d.js` (una posa e una forma, [paesaggi-3d.md](paesaggi-3d.md)); gli effetti in `segni.js` e
`particelle.js`; il tema dei pannelli in `stile-3d.css`, senza toccare i
componenti.

## Chi gioca non disegna

- **Il 3D legge la corsa e il racconto**, non li cambia: `livello`,
  `forzaLuce`, `visto`, `inLuce`, `luceDi`, `foglio`, `fx`. Le regole (chi si
  vede, chi si tocca, chi colpisce) sono del motore; il disegno decide solo
  dove mettere le cose e come farle muovere.
- **Il tocco chiede al motore**: `azione.js` sceglie la cella (la cosa sotto
  il dito, la più vicina a cui si arriva, la porta sulla strada) e chiama
  `vaiVerso`, come la tela 2D chiama `vaiVerso(cellaDa(…))`.
- **La luce di scena del palco** (i combattenti messi fuori dal cono) accende
  la maschera ma non scrive il ricordo, che è del motore.
- **Niente allocato a fotogramma** nei pezzi pesanti: le figure, i chiarori,
  le scintille e i segni sono riserve riempite e svuotate, le geometrie si
  fanno una volta per piano.

## La vista

- **La telecamera** sta a 52° e vede almeno 15 celle in largo e in profondo
  (nello scontro 9,5), la distanza viene dalla forma dello schermo; si alza
  di metà di quanto coprono un foglio o il pannello dello scontro
  (`misuraFoglio` in Gioco.vue). Il pizzico e la rotella la avvicinano o la
  allontanano (`zoomA`).
- **I muri con il pavimento a nord sono parapetti** (0,32): stanno fra la
  telecamera e la stanza. Colonne e spigoli alti che coprono l'eroe si
  sfaldano in un cerchio retinato (il buco). Nello scontro i muri alti alle
  spalle dei combattenti si abbassano, e le torce sopra si spengono.
- **Visto, ricordato, mai visto**: in luce il colore, nel ricordo freddo e
  scuro, nel mai visto niente. **Fiamme, scintille, gocce, l'acqua che si
  muove, le luci dei fuochi vivono solo dove si vede adesso**: le fiamme
  leggono la maschera nello shader, le particelle fuori vista non si emettono
  e la riserva dei fuochi si dà solo a quelli in vista.
- **Le figure** sono cartelli ritti (`ALLUNGA` 1,3) con la normal map finta e
  un contorno caldo; i mostri si vedono solo in luce, come nel 2D. Sopra la
  testa, in HTML: 💤, la corona e il nome del bersaglio di una missione e
  del grosso, i galloni del caporale, la barretta della vita.
- **Niente bagliore, niente pannello di qualità**: una qualità sola.

## Il tocco

Come un punta-e-clicca: un tocco su una cosa (mostro, porta, forziere,
fonte, scala, portale) è un anello che pulsa finché l'eroe ci arriva, e
arrivato la usa (il motore apre il suo foglio). Il bersaglio è generoso:
prima le forme colpite dal raggio, poi la cosa più vicina entro 44 px.
Un tocco sul pavimento porta lì (un anellino sull'arrivo); oltre una porta
chiusa, alla porta. Un altro tocco annulla. Trascinando l'eroe insegue il
dito. Il mouse conta solo col tasto sinistro premuto.

## Lo scontro

- **Il palco sul pavimento vero** (`palco.js`): l'eroe a sinistra, i mostri
  a colonne a destra come nel palco 2D, con almeno 1,2 celle d'agio dai muri
  e dalle cose posate, mai di là da un muro.
- **Le animazioni** leggono lo stesso `fx` della vista 2D: l'eroe carica,
  affonda all'`arrivo` dell'effetto e torna; il mostro scatta coi tempi del
  racconto; il colpo fa scintille nel colore dell'elemento, un lampo, la
  scossa e un fermo-immagine; scudi e cure una bolla; le magie volano o
  cadono con la loro luce; la torcia prende il colore del colpo. Chi cade usa
  i suoi pezzi a terra e svanisce.
- **Le scritte** (nome, barra, stati, segni, numeri, fila dei turni, la riga
  dell'agguato) sono quelle del palco 2D in `viste/Scontro3d.vue`, ognuna
  agganciata sopra la sua figura; il bersaglio si sceglie toccando la figura.
  **La scelta e la domanda** stanno in fondo (`viste/Pannello3d.vue`), coi
  componenti di sempre; la mappina nello scontro si toglie.

## Ogni paesaggio ha il suo aspetto

Dieci paesaggi, ognuno con la forma delle pareti, il disegno del pavimento, le colonne, la luce, l'aria e l'arredo suoi: i
quattro delle discese (cantine, cripta, fornace, inferno) e sei solo del 3D che si aprono col cheat (grotta, nevi, ghiaccio,
palude, tempio sommerso, miniera). Il paesaggio è lo scenario del piano, o il `paesaggio` della discesa o del tratto se lo
dichiarano. Tutto in [paesaggi-3d.md](paesaggi-3d.md), con la tavola che li mette affiancati
(`node strumenti/tavola-paesaggi.mjs`). Le botti di decoro restano solo nelle cantine ([arredo.md](arredo.md)); romperle è una
voce di [da-fare.md](da-fare.md).

## Senza WebGL

- **Senza WebGL 2 il gioco non si apre**: `Gioco3d.vue` lo chiede prima
  (senza caricare three), lo dice («Qui il 3D non si può disegnare») e
  riporta ai giochi senza toccare il profilo. `#sotterraneo3d&tela=niente` lo
  finge per provarlo.
- **Se il contesto si perde** a metà discesa, si salva la sosta come con la ✕
  e si dice; si riprende dal 3D o dal Sotterraneo di sempre.

## Quanto costa

Misurato in Chrome senza schermo (SwiftShader: la CPU fa la GPU, i ms non
dicono niente del telefono), 390×844, sullo stesso inizio della prima discesa
(seme 7):

| | chiamate | triangoli |
|---|---|---|
| prototipo | 164 | 29k |
| gioco, all'arrivo | 34 | 13k |
| gioco, una sala accesa tutta (fontana, colonne, botti; `luce=stanza`) | 34–43 | 13–41k |
| gioco, nello scontro (tre mostri, la sala) | 33–48 | 40–44k |
| i dieci paesaggi, la stanza più grande accesa tutta | 29–42 | 53–165k |

Il JS che prepara un fotogramma sta sotto il mezzo millisecondo, le chiamate
a WebGL sotto il millisecondo. Le figure sono una chiamata sola (prima una
per figura), i muri due, le colonne due, le fiamme una, la nebbia una; una
sola passata d'ombra (il cono); luci a numero fisso. Il pixel ratio parte da
1,5 e scende fino a 0,6 se una quarantina di fotogrammi costano più di 26 ms
in media, risale piano sotto i 15 (cambia prima del disegno, mai dopo: la
tela cambiata si svuota). **Il degrado a scalini non c'è** (l'utente vuole
prima provare): se un telefono non regge, i pezzi si spengono in `ACCESI`.
`window.__sotterraneo3d.grafica()` dice chiamate, triangoli, figure, pixel
ratio e i ms.

**Il peso**: `dist/index.html` da 29 190 a 29 289 kB (+99 kB: il codice di
`scena3d/` e delle viste nuove; three c'era già per gli Asteroidi 3D). Nel sito
spezzato three resta in `asteroidi-3d` (640 kB), `scena3d/` sta in
`sotterraneo-3d` (81 kB), chiesto solo scendendo nel Sotterraneo 3D: il
Sotterraneo di sempre non lo carica, né carica three. Il 3D non ha un
`manualChunks`: è il confine dell'import a richiesta (con un `manualChunks` si
tirava dentro i dati in comune col 2D, e il 2D finiva per caricare three)
([../core/avvio-e-memoria.md](../core/avvio-e-memoria.md)).

## Cosa manca

- Le armi in mano (dell'eroe e dei mostri) vengono dall'atlante piccolo:
  ingrandite sono a blocchi (il 2D usa i pezzi nitidi, un'immagine in più).
- I muri obliqui delle stanze smussate sono a gradini nei paesaggi costruiti (in quelli di roccia gli spigoli si smussano,
  [paesaggi-3d.md](paesaggi-3d.md)); le porte aperte non si disegnano; le ragnatele e la roba per
  terra di decoro (`perTerra`) non ci sono.
- L'acqua delle pozze è piatta da lontano (un riflesso vero costerebbe una
  passata in più).
- La terra di sopra resta in 2D: è la fase dopo.
- Da provare su un telefono vero: i ms di SwiftShader non dicono niente.

Nei test: `unita/sotterraneo-paesaggi` (i paesaggi: [paesaggi-3d.md](paesaggi-3d.md)), `unita/sotterraneo-3d` (gli aspetti, la pianta di tutte le discese
e dell'abisso, la maschera, il palco con l'agio, il tocco, le figure in un
InstancedMesh, le botti), `integrazione/sotterraneo-3d` (col dito vero: la
carta solo coi giochi in prova, la terra di sopra 2D, la discesa in 3D e
quanto costa, camminare, aprire una porta, lo scontro con una risposta
sbagliata e una giusta, il mostro che cade, la scala che sale e quella che
scende da una sosta scritta in Node, la sosta una sola col 2D, senza
WebGL, il ghiaccio e il tempio aperti col cheat). Bersagli: la tela `[data-tela="3d"|"2d"]` (con `data-eroe`,
`data-eroe-schermo`, `data-scala` come il 2D), `[data-strato3d]`,
`[data-scontro-3d]` (con `[data-mostro]`, `[data-vita]`, `[data-fila]`,
`[data-eroe-scontro]`), `[data-pannello3d]`, `[data-senza-3d]`,
`[data-perso-3d]`; `window.__sotterraneo3d` (`grafica()`, `aSchermo(x, y, z)`,
`statoDi(roba)`, `corsa`, `palco`, `eroe`). Il cheat `#sotterraneo3d=<discesa>`
(l'indice della storia o `abisso`, anche coi giochi in prova spenti; con
gli altri cheat del sotterraneo e `&dpr=1`) in [../core/comandi.md](../core/comandi.md).
