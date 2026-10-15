# Avvio e memoria

Quanto ci mette il file unico ad aprirsi e quanta memoria d'immagini si tiene.
Lo misura `node strumenti/misura-avvio.mjs` (`--lento 4`, un gioco per nome,
`--dist file`, `--soglia MB`): per la home il tempo a «carte toccabili» e a
prima cosa dipinta, il blocco più lungo del thread, la memoria di JavaScript;
per ogni gioco aperto dall'indirizzo i MB che le immagini occuperebbero
**decodificate** (larghezza × altezza × 4), più le tele.

## Cosa dice il numero

- **I MB decodificati contano più dei MB del file.** Un atlante 2048×2048 pesa
  16 MB in memoria qualunque sia il suo peso su disco; uno 4096×4096, 64 MB. Su
  un telefono povero è la memoria delle texture a finire, non il disco.
- **Il numero è un tetto, non una fotografia della GPU**: conta ogni immagine
  viva una volta sola (`new Image()`, `<img>`, sfondi in CSS) più le tele.
  Non vede le texture che il browser butta e ricrea da solo.
- **Un gioco si misura dalla schermata d'ingresso**, non giocando: le immagini
  che un gioco carica solo a partita iniziata (survivors, arena, castello) qui
  non ci sono ancora. Per quelle serve un tocco in più nello strumento.
- **Come un telefono**: `--lento 4` rallenta la CPU, non la GPU né la rete. Il
  tempo di scaricare il file da GitHub Pages non c'è (si apre da `file://`).

## Lo stato (15 ottobre 2026, build di `claude/priorita-test-velocita-mobile`)

File 26,6 MB; la home è pronta in ~0,7 s (2,8 s a CPU 4× più lenta), il blocco
più lungo è 0,23 s (0,9 s a 4×). I giochi si aprono in un tempo pari alla home
(il codice è già nel file). Fra le immagini, il sotterraneo tiene 30 MB e la
tela più grande delle lingue 53–56 MB.

## Il sito spezzato

`npm run build:sito` (`SPEZZATO=1`) scrive `dist-sito/`: una pagina di 4 KB, un
JS di avvio (~1,6 MB), un file JS per gioco (`gioco-<nome>-<hash>.js`, da 23 a
490 KB) e per le schermate dei grandi, un CSS e i file veri di sprite e voci,
ognuno col suo hash nel nome.
Il file unico (`npm run build`, `dist/index.html`) resta com'è: serve ai test,
al doppio click e a `./pubblica.sh`. La CI pubblica `dist-sito/` con accanto
`giochi.html` (il file unico).

- **Gli sprite sono ancora scritti come `data:` nei moduli generati**
  (`dati/atlante.js` e gli altri): nel sito spezzato `estraiDati`
  (`vite.config.js`) li estrae in file e lascia l'indirizzo al posto della
  stringa. Nei test in Node i moduli restano com'erano. Chi legge uno sprite deve
  accettare un indirizzo oltre a un `data:` (`voce.js` lo fa con `byteDi`).
- **Ogni gioco è un file suo** (`giochi/carica.js`, `caricaQuando`): `schermate.js` e
  `App.vue` importano le schermate con `import()`. Nel file unico il build le rimette
  dentro la pagina e cambia solo un istante di attesa. Un file che manca (senza rete e
  non ancora scaricato) fa dire al bambino «Questo gioco non è ancora sul telefono».
- **Cosa cambia fra una versione e l'altra** lo dicono i nomi: l'hash è quello del
  contenuto, quindi un file uguale ha lo stesso nome e il service worker lo ricopia
  dalla cache di prima. Cambiano sempre il JS di avvio (porta `__VERSIONE__`) e i
  file che dipendono da lui; tutto il resto resta. Il codice comune va tenuto piccolo.
- **Il service worker scarica tutto** (`scaricaTutto` nel `sw.js` generato): sei
  file alla volta, copia dalle cache delle versioni precedenti quello che ha lo
  stesso nome (hash uguale = file uguale), e fallisce l'installazione se ne manca
  uno. I progressi vanno sul canale `educagioco-scarico`; li mostra
  `components/Scarico.vue`, la striscia in cima.
- **«Cerca aggiornamenti»** aspetta il service worker nuovo fino a 3 minuti
  invece di 8 secondi (`__SPEZZATO__`), perché prima deve finire di scaricare.
- **Provarlo:** `node strumenti/prova-sito.mjs` (`--rete KB/s`, `--lento N`,
  `--dist dist --solo-prima` per il file unico a confronto): prima visita, poi
  senza rete, poi alcuni giochi.

Primo risultato (rete 1500 KB/s e CPU 4× più lenta, prima visita): la home dopo
**20 s** col file unico, **4,8 s** spezzato. Senza rete: 0 richieste al server,
home in 0,2 s, giochi aperti senza immagini rotte.

## Le mappe di inglese e spagnolo

Aprirle costava ~0,8 s sul computer (4-8 s su un telefono lento): le coste sono un
campo di distanza su ~35 000 celle per isola, e non cambiano mai per la stessa larghezza.

- **La larghezza si arrotonda per difetto a multipli di 10 px** (`misura()` in
  `viste/Mappa.vue`; la tavola è centrata): i telefoni quasi uguali dividono la stessa
  geografia.
- **La geografia si tiene da parte** (`src/calcoli-in-cassa.js`, database
  `educagioco-calcoli`, fuori dai salvataggi, dai backup e dalle cache del service worker): la
  prima apertura calcola, le altre la rileggono (`caricaGeografie` prima di disporre).
  Una copia vale per la versione dell'app che l'ha fatta; aggiornando, si rifà una volta.
  Misurato a CPU 4× più lenta: 6,0 s la prima volta, 3,4 s riaperta (dentro c'è il riavvio).
- **`unione` scarta le forme lontane** (`scena/costa.js`) con lo stesso risultato; lo
  garantisce `unita/costa-unione`. Provato e scartato: valutare il campo ogni 8 px e
  interpolare (la costa si sposta, e con la copia da parte non serve).
- **Profilare un'apertura:** `node strumenti/profila-app.mjs 'inglese' --apertura --lento 4`
  (parte dalla home e registra solo l'ingresso nel gioco).

## Da fare

- **L'installazione è tutto o niente**: se la rete cade a metà riparte da capo
  (i file già in cassa si ricopiano, ma c'è da riscaricare). Il passo dopo è lo
  scarico a due tempi: prima il minimo per giocare, poi un gioco alla volta con
  la lista nel build, e un gioco non ancora scaricato che dice «in download».
- **La prima apertura di una mappa** calcola ancora: si può fare nel sottofondo dopo lo scarico, isola per isola.
- **Il banco di memoria per gioco** (sopra) non entra in partita: misura solo
  l'ingresso.
- **`pubblica.sh` (server di casa) serve ancora il file unico.**
- **iPhone**: lo scarico lungo con l'app in secondo piano si prova su un telefono
  vero.
