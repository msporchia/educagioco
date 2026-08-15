# Sprite per la fattoria — ricerca e raccomandazione

## La raccomandazione in tre righe

Tre pacchetti Kenney/Bellanger della serie **"Tiny"** (16×16 px, top-down, CC0
reale — verificato aprendo i `License.txt` dentro gli zip, non solo le pagine
web): **Tiny Farm** + **Tiny Town** + **Tiny Creatures**. Insieme pesano
**~187+178+176 KB di zip originali**, ma quello che serve a noi — gli atlas
completi già impacchettati — sono **22 KB totali (30 KB in base64)**: praticamente
gratis dentro un HTML unico. Mancano però un cane, un gatto veri e una
fontana/lampione: vanno presi altrove o disegnati a mano (poche tessere).

## Cosa ho verificato davvero

Ho scaricato ed **estratto per davvero** i tre zip (non mi sono fermato alle
pagine di presentazione), ho letto i `License.txt` inclusi negli archivi, e ho
ingrandito gli atlas tessera per tessera con `ffmpeg` per controllare cosa
c'è dentro — inclusa la caccia esplicita a cane/gatto/maiale, che un
riassunto trovato in rete affermava presenti in Tiny Creatures e che invece
**non ci sono** (l'ho verificato guardando tutte le 180 tessere a schermo).

## I candidati

### 1. Kenney — Tiny Farm (base: terreno, coltivazioni, fienile, 3 animali)

- **Link**: https://kenney.nl/assets/tiny-farm (pagina) ·
  https://opengameart.org/content/tiny-farm (mirror con zip diretto,
  usato per il download)
- **Autore**: Kenney (kenney.nl)
- **Licenza**: CC0 1.0 Universal. Citazione esatta dal `License.txt` dentro
  lo zip: *"License: (Creative Commons Zero, CC0)
  http://creativecommons.org/publicdomain/zero/1.0/ — This content is free
  to use in personal, educational and commercial projects. Support us by
  crediting Kenney or www.kenney.nl (this is not mandatory)"*. Nessuna
  attribuzione obbligatoria in interfaccia.
- **Stile/risoluzione**: pixel art top-down, tessere 16×16 px, 1 px di
  margine, griglia 12×11 = 132 tessere.
- **Cosa copre**: sentiero/terra battuta, terra arata/bagnata (4 varianti),
  albero, pino, cespugli a più stadi, **moltissime coltivazioni** (carote,
  pomodori, cavoli, mais...) che non ci servono ma non pesano, sacchi/cesti
  di raccolto, un fienile/granaio 3×3 con tetto verde e pareti a mattoni,
  botti/secchi, **panchine (4 varianti)**, cassa, un personaggio contadino,
  **pecora, mucca, gallina**.
- **Cosa manca** rispetto alla lista: cane, gatto, maiale; sassi come
  elemento singolo (c'è solo un mucchietto grigio generico); funghi; acqua
  (nessuna tessera di stagno/laghetto); fontana, lampione; staccionata con
  pezzi d'angolo (c'è solo un "cancello", non un kit direzionale).
- **Peso reale**: zip 187 KB (verificato, `du` sul file scaricato). L'unica
  cosa che serve incorporare è l'atlas completo
  `Tilemap/tilemap.png`: **6,0 KB** (griglia uniforme, comoda per calcolare
  gli offset) o `tilemap_packed.png` **5,7 KB** (più compatto ma senza XML
  di coordinate in questo mirror, quindi più scomodo da indicizzare).
  Anche prendendo l'atlas intero, non c'è da "ridurre": è già minuscolo.

### 2. Kenney — Tiny Town (complemento: edifici, staccionate con angoli, alberi)

- **Link**: https://kenney.nl/assets/tiny-town ·
  https://opengameart.org/content/tiny-town (mirror con zip diretto)
- **Autore**: Kenney
- **Licenza**: CC0 1.0, stesso testo esatto del punto precedente (letto nel
  `License.txt` dentro lo zip).
- **Stile/risoluzione**: identico a Tiny Farm — stessa serie, stessa griglia
  16×16+1px, 132 tessere. È pensato apposta per stare insieme a Tiny
  Dungeon/Tiny Farm (Kenney lo presenta come "fits the previous Tiny Dungeon
  release").
- **Cosa copre**: erba con 2 varianti + erba scintillante, **funghi** (coppia
  rossa a pois bianchi), tanti alberi (anche a gruppetti/foresta), muri di
  pietra e mattoni (grigio e rosso), porte, finestre, un pozzo, **un kit di
  staccionata completo**: ho ingrandito la zona e ci sono davvero il pezzo
  dritto, l'angolo, il T e il palo di fine — cioè esattamente i pezzi
  d'angolo che servono per chiudere un perimetro.
- **Cosa manca**: nessun animale (non è nel suo scopo), nessuna acqua,
  nessuna fontana/lampione, niente fiori decorativi oltre all'erba
  scintillante.
- **Peso reale**: zip 178 KB. Atlas completo `tilemap.png`: **5,3 KB**
  (`tilemap_packed.png`: 4,9 KB).

### 3. Tiny Creatures di Clint Bellanger (complemento: animali)

- **Link**: https://opengameart.org/content/tiny-creatures ·
  https://clintbellanger.itch.io/tiny-creatures
- **Autore**: Clint Bellanger (clintbellanger.net), non Kenney — ma fatto
  **con il permesso esplicito di Kenney** come espansione di Tiny
  Dungeon/Tiny Town, nello stesso stile a 16×16 con contorno spesso. L'ho
  verificato visivamente: un'immagine di esempio nel pacchetto
  (`tiny_animalsanctuary.png`) mescola la staccionata e l'edificio di Tiny
  Town con questi animali senza stonare.
- **Licenza**: CC0 1.0. Citazione esatta dal `License.txt`: *"License:
  (Creative Commons Zero, CC0) http://creativecommons.org/publicdomain/zero/1.0/
  — This content is free to use in personal, educational and commercial
  projects. Support my work by crediting Clint Bellanger (this is not
  mandatory)"*.
- **Stile/risoluzione**: 16×16 px, 1 px di margine, griglia 10×18 = 180
  tessere.
- **Cosa copre di utile per noi**: **gallina, mucca, pecora**, più capra,
  cinghiale (il più vicino a un maiale, ma è un cinghiale selvatico, non un
  maiale da fattoria), coniglio, procione, tartaruga, ape — utili come
  decorazioni di contorno anche se non richiesti. Il resto (180 tessere) è
  soprattutto bestiario fantasy (scheletri, draghi, folletti) che non serve
  e va semplicemente ignorato in fase di ritaglio.
- **Cosa manca, verificato con certezza**: **niente cane, niente gatto
  domestico.** Ho scandito tutte le 180 tessere ingrandite a strisce e non
  ci sono: c'è un lupo (mostro, non un cane da fattoria) e niente di
  felino domestico. Una sintesi trovata in rete affermava il contrario
  citando "dog" nella descrizione testuale del pacchetto — l'ho controllato
  a occhio sull'immagine reale e non è così: meglio fidarsi dei pixel che
  del testo.
- **Peso reale**: zip 176 KB. Atlas completo `Tilemap/tilemap.png`:
  **26 KB** (`tilemap_packed.png`: 11 KB — qui conviene usare il packed,
  la differenza è reale). Va comunque ritagliato: ci servono forse 5-6
  tessere su 180.

### 4. Scartato: Kenney — Isometric Miniature Farm

- **Link**: https://kenney-assets.itch.io/isometric-miniature-farm ·
  https://opengameart.org/content/isometric-miniature-farm
- **Licenza**: CC0 1.0, verificata sulla pagina OpenGameArt (stesso link
  creativecommons.org).
- **Perché scartato**: è isometrico (vista 30°×45°), non top-down, e ogni
  tessera è **256×512 px** — pensato per un motore che compone la profondità
  con basi isometriche, non per un canvas 2D con `y` come profondità come fa
  già `fattoria.html`. Lo zip pesa 10,1 MB: anche prendendo solo poche
  tessere, ogni singolo pezzo isolato pesa più dell'intero atlas di Tiny
  Farm. Stile bellissimo ma incompatibile con l'impianto attuale.

**Il vincolo che decide non è la licenza, è lo stile.** Di roba CC0 a 16×16
vista dall'alto ce n'è parecchia, e sotto ce n'è l'elenco. Quello che non si
trova è **un'altra famiglia col contorno scuro spesso e la palette calda
della serie Tiny**: appena si mescola, il confine si vede. Perciò le scelte
vere sono due, e sono in blocco — o si resta su Tiny e si ridisegnano a mano
le tre o quattro tessere mancanti, o si cambia famiglia tutta insieme.

### 5. Kenney — Roguelike/RPG Pack (1700+ tessere): **ha l'acqua**, ma stona

*Era la pista non verificata della prima ricerca. Adesso è stata aperta zip
alla mano, come le altre.*

- **Link**: https://kenney.nl/assets/roguelike-rpg-pack ·
  https://opengameart.org/content/roguelikerpg-pack-1700-tiles (mirror con
  zip diretto, 699 KB)
- **Licenza**: CC0 1.0, `License.txt` dentro lo zip, stesso testo esatto
  degli altri Kenney (*"License (Creative Commons Zero, CC0) … Credit
  (Kenney or www.kenney.nl) would be nice but is not mandatory"*).
- **Stile/risoluzione**: 16×16 con 1 px di margine — lo dice
  `spritesheetInfo.txt` dentro lo zip — atlas `roguelikeSheet_transparent.png`
  di **968×526 px**, cioè 57×31 = 1767 tessere.
- **Cosa copre che agli altri tre manca**: **l'acqua, col set di bordi
  completo** (stagno con la sponda erbosa, angoli interni ed esterni: è
  esattamente il pezzo che mancava), **fiori** in tre colori con le loro
  cornici, terra e sentieri con gli angoli arrotondati, moltissimi alberi e
  cespugli, panchine, un **kit di staccionata di legno**, sassi, casse,
  barili, carrelli da miniera, e un intero corredo da interni che qui non
  serve.
- **Cosa manca comunque**: **nessun animale**, **nessuna fontana**, **nessun
  lampione** (ci sono torce, candele e candelabri — roba da dungeon, non da
  cortile).
- **Peso reale**: l'atlas è **92 KB**, cioè ~123 KB in base64: da solo pesa
  **quattro volte** i tre atlas Tiny messi insieme. A differenza di quelli,
  questo **non si incorpora intero**: va ritagliato sulle poche tessere che
  servono.
- **Il problema vero non è il peso, è lo stile.** Messo accanto a Tiny Farm
  non regge: la serie Tiny ha un **contorno scuro spesso** su ogni sprite e
  una palette calda desaturata, il Roguelike è **piatto e senza contorno**,
  su toni più freddi. Se si prende solo l'acqua e si mette in mezzo alla
  fattoria Tiny, il confine si vede.

### Le famiglie che NON sono di Kenney

Sono state cercate apposta, per rispondere a «possibile che ci sia solo
Kenney?». Risposta breve: no, ma nessuna risolve il problema.

**ArMM1998 — Zelda-like tilesets and sprites** *(scaricato e guardato)*

- https://opengameart.org/content/zelda-like-tilesets-and-sprites — zip 171 KB,
  `Overworld.png` 640×576, tessere 16×16.
- **Licenza CC0 dichiarata sulla pagina OGA, ma niente `License.txt` dentro
  lo zip**: la prova di provenienza è solo una pagina web, ed è più fragile
  dello standard tenuto per i tre pacchetti sopra. Vale la pena salvarsi la
  pagina, non solo il file.
- **Ha la fontana** — anzi ne ha tre fotogrammi, cioè animata — più acqua con
  bordi, pozzi, panchine, staccionate, casette, la bancarella del mercato con
  le cassette di verdura, lanterne appese.
- **Non ha cane né gatto.**
- **Stile**: molto più ombreggiato, con ombre portate sotto ogni oggetto e
  proporzioni da Zelda. Stona con Tiny più ancora del Roguelike. È una
  famiglia *alternativa*, non un complemento: o si prende quella e si molla
  Tiny, o non si mescola.

**Tiny 16: Basic** di Lanea Zimmerman (Sharm) —
https://opengameart.org/content/tiny-16-basic — 16×16, acqua, alberi, ponti,
personaggi e creature: è la famiglia non-Kenney più vicina per taglia e
intenzione. **Ma non è CC0**: CC-BY 4.0 / CC-BY 3.0 / OGA-BY 3.0, quindi
l'attribuzione è **obbligatoria**, non una cortesia. Non è squalificante di
per sé — basterebbe la riga in `CREDITI.md` — ma cambia la natura
dell'impegno, e va deciso apposta.

**0x72** (16x16 DungeonTileset II, µFantasy) — CC0 e 16×16, stile pulitissimo
e coerente, ma è roba da dungeon fantasy: niente fattoria, niente animali
domestici.

**LPC (Liberated Pixel Cup)** — c'è letteralmente tutto, animali da fattoria e
perfino un «LPC Lamp Posts Rework», ma è **32×32** e **CC-BY-SA 3.0 / GPL**:
misura doppia e licenza virale. Fuori.

**Dungeon Crawl Stone Soup** — in gran parte CC0, ma 32×32 e da dungeon.

**Mage City Arcanos** di Hyptosis —
https://opengameart.org/content/magecity-arcanos — CC0, `magecity_1.png`,
167 KB. **Bellissimo**, ed è segnato qui perché prima o poi tornerà utile,
non perché serva alla fattoria: è **32×32**, cioè il doppio di tutto il
resto, ed è una città fantasy (mura, tetti, pavimentazioni, barili,
panchine), non un cortile. Autore: *«Feel free to use it for anything, you
can even make profit… credit as 'Hyptosis' … but you're not obligated to»*.

### Il cane e il gatto: cercati di nuovo, non trovati

Sono stati cercati apposta, ed è la cosa che questa seconda ricerca chiude:

- **Cute 16x16 Animal Icons** (Spring Spring, CC0, 2,9 KB) — *scaricato e
  ingrandito*: sono **faccine di profilo su fondo quadrato**, ritratti da
  scheda personaggio, non sprite visti dall'alto. C'è un cane e c'è un
  felino, e sono inutilizzabili in mappa.
- **Pixel Animals 16x16** (GrumpyDiamond, CC0) — 299 byte in tutto: mucche e
  una pecora, cioè le tre cose che abbiamo già.
- **Free Pixel Animation: Cat** (Zeenaz, CC0, 16×16, sei animazioni) — è **di
  profilo**, da platform. Bellissimo e fuori uso.
- **104 Free Dogs** (PixelFight, 16×16) — solo **frontali**, e la licenza non
  è CC0: è un «fateci quello che volete» scritto nella descrizione, che non
  è la stessa cosa.

Cioè: la conclusione della prima ricerca regge dopo la seconda. **Un cane e
un gatto 16×16 visti dall'alto e nello stile Tiny non esistono già pronti**,
e le due tessere vanno disegnate.

## Come si integrano in un HTML unico

1. Prendere l'atlas **`tilemap.png`** (griglia uniforme) di ciascun
   pacchetto — non i 130+ PNG singoli: un solo `<img>`/`Image()` per
   pacchetto tenuto in memoria, ritagliato con
   `ctx.drawImage(atlas, sx, sy, 16, 16, dx, dy, 16*scala, 16*scala)`.
   Con passo di 17 px (16 + 1 di margine) calcolare `sx = (indice % colonne) * 17`,
   `sy = Math.floor(indice / colonne) * 17` — niente XML esterno da portarsi
   dietro, bastano due costanti per pacchetto.
2. Codificare i tre PNG in base64 e metterli in tre costanti stringa in cima
   allo script (`const ATLAS_FARM = 'data:image/png;base64,...'`), esattamente
   come oggi si tengono le emoji in `CATALOGO`/`OSTACOLI`. Un `new Image()`
   per atlas, caricato una volta sola all'avvio.
3. **Fondamentale per la resa**: `ctx.imageSmoothingEnabled = false` prima di
   disegnare gli sprite, altrimenti il canvas sfoca la pixel art 16×16
   ingrandita — cosa che oggi non serve perché le emoji sono vettoriali.
4. Ordine di grandezza finale: anche incorporando **gli atlas interi e non
   ritagliati** dei tre pacchetti, il costo è ~30 KB in base64 — una frazione
   trascurabile rispetto al budget di 300-500 KB indicato, e ben sotto la
   soglia di guardia del megabyte. Ritagliare in un atlas su misura (solo le
   tessere che servono) lo ridurrebbe ulteriormente ma qui non è nemmeno
   necessario: si può includere tutto senza pensarci.
5. L'SVG non serve qui: nessuno dei pacchetti CC0 validi trovati era in SVG
   (Game-icons.net è SVG ma CC-BY, stile a icona singolo colore, non un set
   di ambiente — scartato per stile, non per licenza).

## I rischi

- **Crediti**: nessuna licenza qui è a rischio "sparizione dei diritti" (CC0
  è irrevocabile), ma tutti e tre i `License.txt` chiedono la citazione come
  cortesia. Non essendo obbligatoria non deve stare nell'interfaccia di
  gioco (coerente col vincolo del progetto), ma vale la pena mettere una riga
  in un `CREDITI.md` o in un commento in testa al file, come già si fa per le
  altre decisioni di design in `fattoria.html`: *"Sprite: Kenney (Tiny Farm,
  Tiny Town, CC0) e Clint Bellanger (Tiny Creatures, CC0)"*.
- **Se un pacchetto viene ritirato**: CC0 è una rinuncia irrevocabile al
  copyright — anche se Kenney o Bellanger cancellassero la pagina domani, la
  copia già incorporata nell'HTML resta legittima. Consiglio comunque di
  tenere gli zip originali (con `License.txt`) da qualche parte fuori dal
  repo — non dentro il gioco, ma come prova di provenienza — perché
  in futuro potrebbe non essere più possibile riscaricarli dallo stesso link.
- **Mescolare pacchetti di autori diversi**: Tiny Creatures non è di Kenney,
  ma è stato fatto apposta per essere compatibile e con il suo permesso — è
  il caso più sicuro di "set coerente da più fonti". Se in futuro si
  aggiungesse un quarto pacchetto per acqua/fontana/cane/gatto da un autore
  scollegato, andrebbe verificato a occhio (come ho fatto qui) che il
  contorno e la palette non stonino — non basta che la licenza torni.
- **Cane e gatto restano un buco**: sono probabilmente gli sprite più
  "sentiti" dai bambini (nel prototipo attuale sono i primi due animali
  piazzati). Prima di introdurre gli sprite conviene decidere se disegnarli
  a mano nello stesso stile 16×16 con contorno scuro (poche ore di lavoro,
  2 sole tessere) o cercare ancora — non ho trovato un pacchetto CC0 già
  pronto che li abbia nello stesso stile esatto. **Cercato una seconda volta,
  stesso esito**: vedi «Il cane e il gatto: cercati di nuovo, non trovati».
  Adesso «cercare ancora» non è più una delle due opzioni.

## Quanto lavoro è passare da emoji a sprite nel prototipo

Non è un rifacimento, ma tocca più punti di quanti sembri a prima vista:

- **`CATALOGO`, `OSTACOLI`, `CURE`, `DONI`** oggi tengono un carattere emoji
  (`e: '🐕'`) usato sia per il disegno sia come identità dell'oggetto.
  Passando a sprite serve un indice di tessera (e l'atlas di provenienza) al
  posto del carattere: è un cambio di forma dati, non solo di resa.
- **`figura()`** oggi è un `ctx.fillText` con font emoji: va affiancata (o
  sostituita) da un `drawImage` che ritaglia dall'atlas. `ombra()` e
  `basamento()` restano identiche, perché disegnano forme proprie sotto la
  figura, non toccano l'emoji.
- **Il fantasma che segue il dito** (`#fantasma`, oggi `textContent` con
  l'emoji in un `<div>`) va rifatto con uno sfondo CSS
  (`background-image` + `background-position`) sullo stesso atlas, oppure
  con un mini-canvas: la logica di trascinamento non cambia, solo come si
  disegna il dito fantasma.
- **Le staccionate con gli angoli sono lavoro di gioco vero, non solo di
  grafica**: oggi `staccio` è un singolo oggetto piazzabile senza sapere cosa
  ha vicino. Per usare il kit di Tiny Town (dritto/angolo/T/palo) serve una
  funzione che guarda le celle adiacenti e sceglie la tessera giusta — la
  stessa categoria di problema già risolta altrove nel codice per i bordi
  della piazzola (`tessera()`, i lati con `LATI`), quindi c'è un modello a
  cui appoggiarsi, ma è codice nuovo, non solo un cambio di font.
- **`ctx.imageSmoothingEnabled = false`** va impostato una volta, ma va
  ricordato: è l'unico modo per cui i 16 px restino nitidi e non sfocati.
- Tutto il resto — ordinamento per profondità, ombre, cartello del prezzo,
  numerini volanti, anellino di pressione — non dipende da come è disegnata
  la figura sopra e resta com'è.
