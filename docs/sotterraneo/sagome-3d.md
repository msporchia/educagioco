# Le sagome: la figura piatta è la foto del modello

Nel sotterraneo ([grafica-3d.md](grafica-3d.md)) mostri, grossi, eroi e persone di sopra sono modelli 3D ([mostri-3d.md](mostri-3d.md),
[persone-3d.md](persone-3d.md)). Dove il modello non si mette, al suo posto c'è la **sagoma**: la foto di quel modello, nella posa e
dalla parte che il modello avrebbe adesso, su un cartello in piedi. Gli sprite dipinti di mostri, eroi e persone non ci sono più.

L'utente, 31 ottobre 2026: «abbiamo il modello, deve essere preso dal modello»; e poi «in caso posato il modello nel modo giusto, ma
in ogni caso deve essere quello, altrimenti è confusionario». Passando dal modello alla sagoma (un mostro che esce dal tetto dei
modelli) non si deve vedere una cosa diversa: stessi colori, stessa arma, stessa misura, stessa posa.

## Dove si vede

- **I mostri oltre il tetto dei modelli**: nelle discese i più vicini all'eroe (lo scontro per primo) fino a `ACCESI.mostri3d` (12),
  sopra 8 (6 nella fascia bassa, `mostriSopra`). Il tetto non è cambiato: cambia solo da dove viene l'immagine piatta.
- **Le persone di sopra lontane**: oltre le 8 più vicine, o oltre 18 celle. Con `#persone2d` tutte in sagoma.
- **Un modello che si rompe** animando (`mostro3d.js`, `persona3d.js`): da lì in poi la sua sagoma.
- Con `&spegni=mostri3d` tutti i mostri sono sagome: è la leva per misurarle.

Finché l'atlante non è arrivato (si carica a parte quando il 3D parte, qualche centinaio di ms) il posto resta vuoto, come per le
anteprime ([anteprime-3d.md](anteprime-3d.md)). Mai uno sprite al suo posto.

## Come sono fatte

`npm run anteprime sotterraneo` (o solo `npm run anteprime sagome`) apre il file costruito e fotografa ogni modello come sta in scena
(`preparaModello` di `mostro3d.js`: saldato, a riposo; `creaPersona` per le persone): `strumenti/sagome-sotterraneo3d.mjs` dà
l'elenco, `scena3d/sagome-foto.js` scatta, e il risultato è `dati/sagome-fatte.js` (generato, con la firma dell'atlante e dei sorgenti).

- **Chi**: ogni id che il registro può dare (le specie con i gradi, le varianti armate dello scheletro col loro rango, i grossi) e le
  quattordici persone: 87 modelli di mostri, 14 persone.
- **Da dove**: una telecamera ortogonale da 52° sotto l'orizzonte, come quella delle discese e del mondo di sopra.
- **Otto direzioni**, senza specchio: la telecamera ha il giro fisso, quindi la parte del modello che si vede dipende solo da dove
  guarda lui; con meno di otto un mostro che si gira salta troppo (45° fra una foto e l'altra, ~22° al più dal modello), e lo specchio
  cambierebbe la mano dell'arma. Due foto uguali al pixel (chi non ha il colpo, un respiro fermo) si tengono una volta.
- **Le pose**, per direzione: il respiro (`anima` a 0, 0,8 e 1,6 s), il colpo (`attacca` all'arrivo, se il modello ha l'attacco),
  la caduta (rovesciato all'indietro e sprofondato come in `mostro3d.js`, il pavimento taglia il resto). Le persone hanno solo il
  respiro. I modelli non hanno passi (camminano col loro idle), quindi chi corre ha il respiro anche nella sagoma.
- **La misura**: 24 pixel per cella in scena (un telefono ne mostra 26 a cella, 39 a pixel ratio 1,5; lo sprite di prima ne aveva
  16). La risoluzione di un modello viene dal posto più grande in cui va (la specie); un grosso col modello di una specie usa quella,
  uno solo grosso al più quella di una specie alta.
- **Colore e normali**: la foto del colore ha una luce piatta (un'ambiente, niente tono: il colore del modello col suo emissivo), e una
  seconda foto ha le normali del modello girate nel verso del cartello (x a destra, y in su, z verso la telecamera), a metà misura. Il
  cartello prende la luce della scena con quelle normali, come il modello; nello scontro ha anche il suo contorno caldo
  (`CONTORNO_PELLE`). Provato con la luce cotta nella foto e il cartello piatto: le sagome venivano scure accanto ai modelli.
- **Il peso**: un atlante 2048×2988 (WebP, 1,9 MB) e le normali 1024×1494 (0,5 MB), 3,2 MB di testo nel file unico. Le normali si sono
  fatte a faccette (`flatShading`): le mesh saldate non hanno sempre le normali nei vertici.

## In scena (`scena3d/sagome.js`)

Tutte le sagome stanno in **un InstancedMesh** (`creaFigure` di `figure.js` con `foto`), con l'atlante e le sue normali: una chiamata
per tutte, come gli sprite di prima. Non fanno ombra (i modelli neanche).

- **La direzione** è quella del modello: `giraIlMostro` (`mostro3d.js`) e `giraLaPersona` (`persona3d.js`) la calcolano per tutti e
  due, smussata nello stato di disegno; la sagoma prende la foto più vicina (`direzioneDi`).
- **La posa**: il respiro col tempo e la fase del modello (`posaDi`), il colpo vicino all'arrivo (il racconto dà alla sagoma lo
  stesso attacco del modello: `attaccoSagoma`), la caduta oltre metà.
- **La misura**: `scalaDelModello` (`sagome-pura.js`) è una sola per il modello e la sua sagoma; `alto` e `largo` del modello stanno
  nel file generato, così la sagoma non costruisce niente.
- **Il cartello** sta in piedi, allungato per l'inclinazione di adesso come gli sprite (`cartelloDi`): a schermo la foto ha la sua
  misura anche nello scontro, dove la telecamera scende a 36° (lì la sagoma resta vista da 52°). Quello che nella foto sta sotto i
  piedi (chi cade in avanti) farebbe scendere il cartello sotto il pavimento: il cartello avanza verso la telecamera.
- **Il lampo** del colpo e la tinta degli stati sono additivi (`aLampo`), il dito prende la sagoma come prendeva lo sprite.

## Le misure (`dati/altezze.js`)

Quanto è alto in scena chi ha un modello non viene più dallo sprite: `ALTO_DELLA_SPECIE`, `ALTO_DEL_GROSSO`, `ALTO_DELL_EROE`,
`ALTO_DELLA_PERSONA` sono le misure degli sprite del 31 ottobre (il fotogramma fermo con la taglia della specie), fermate come dato.
Il modello è alto 0,72 volte il posto allungato per la vista, come prima. `GRANDEZZA_*` misura i chiarori per terra e la macchia
d'ombra. Una cosa sola cambia: prima il modello seguiva l'altezza del fotogramma dello sprite (chi corre aveva fotogrammi più bassi), ora
ha la misura del fermo.

## Cosa non si fotografa

- **Le mosse** dei caporali, dei signori e dei grossi (`dati/mosse.js`): una sagoma che fa una mossa respira. Si vede solo se lo
  scontro ha più mostri del tetto (oggi al più sette) o se il modello si rompe.
- **Il saluto** delle persone: si saluta entro 6 celle, dove le persone hanno il modello (salvo più di otto persone vicine).
- **Lo sprofondare a metà**: la caduta ha una posa sola, a terra.
- Nello scontro la sagoma è sfocata (la telecamera è vicina: ~3 volte la risoluzione della foto); anche questo solo oltre il tetto.

## Quanto costa

Misurato con SwiftShader (390×844, `&dpr=1`; i ms non dicono niente del telefono, le chiamate sì), prima e dopo:

| scena | prima (sprite) | dopo (sagome) |
|---|---|---|
| scontro con 7 mostri, tutti modelli (`#sotterraneo=branco&mostri=7&stanza=sala&seme=11`) | 71 chiamate, 73k triangoli | 71, 73k |
| lo stesso con `&spegni=mostri3d:3` (4 piatti) | 62, 59k | 63, 59k |
| lo stesso con `&spegni=mostri3d` (7 piatti) | 55, 45k | 56, 45k |
| il prato con `&branco3d=16&folla=24` (8 mostri e 8 persone col modello, 31 piatti) | 121, 288k | 120, 288k |
| lo stesso nella fascia bassa (6 mostri col modello, 33 piatti) | 93, 241k | 93, 241k |

Le sagome sono una chiamata in più quando ci sono anche figure dell'atlante in scena (le discese), nessuna sopra (dove la roba per terra
senza modello è rara). La texture è più grande dell'atlante degli sprite (2048×2988 più le normali, contro i 256×552 di adesso): da
misurare sul telefono il primo caricamento.

## Per guardarle

```bash
node strumenti/sagome-sotterraneo3d.mjs --tavola prati/goblin,bosco/lupo     # le foto in fila, in tmp/scatti/tavola-sagome.png
node strumenti/sagome-sotterraneo3d.mjs --tavola prati/goblin --normali       # le normali
node strumenti/scatta-app.mjs 'sotterraneo=1&seme=11&sotterraneo=branco&mostri=4&stanza=sala&luce=stanza&dpr=1.5&eroe=cavaliere&sagome=accanto' --dist --aspetta 6000
node strumenti/scatta-app.mjs 'sotterraneo=1&seme=11&sotterraneo=branco&mostri=7&stanza=sala&dpr=1&eroe=cavaliere&spegni=mostri3d:3' --dist --aspetta 7000
```

`#sagome=accanto` mette accanto a ogni modello la sua sagoma, una cella e mezza a destra: è il confronto «stessa posa, stessa misura,
stessi colori». `grafica()` dice `sagome` (quante in scena).

Nei test: `unita/sotterraneo-sagome` (una sagoma per ogni modello e persona, otto direzioni con tutte le pose, dentro l'atlante, sotto
4096 px per lato, le firme; la direzione, la posa, il cartello, la misura), `unita/sotterraneo-3d-tempo` (il respiro della sagoma va col
tempo).
