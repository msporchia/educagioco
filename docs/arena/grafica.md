# La grafica

Le truppe sono sprite del castello a torri, riusati tali e quali
(`src/giochi/castello/dati/figure.js`).

## In partita non si disegna niente che si possa preparare

La CPU ha già le truppe (l'utente), quindi la grafica nuova si fa a monte e il gioco legge immagini.

- **`npm run disegni:arena`** (`strumenti/sprite/disegni-arena.mjs`) apre un browser, ci fa girare i disegni di
  `strumenti/sprite/arena-disegni/` (il gioco non li importa) e scrive i terreni e `dati/opere-disegnate.js`: castelli, porte, ponti,
  miniere e stendardi. Poi `terreni-arena.py` fa `dati/terreni-pronti.js` (terreni e scorci della mappa). `unita/arena` confronta la firma.
- **Il dipinto vince sul disegno, e il resto del gioco non lo sa**: ogni foglio di ChatGPT prende lo stesso posto (voci 7c, 8, 9, 10 e 11 di
  `strumenti/sprite/DA-GENERARE.md`). Il disegno a monte è la forma, ed è anche l'allegato del prompt.
- **Il terreno si compone una volta sola alla misura vera dello schermo**, col ponte e i bordi scuri dentro (`scena/terreno.js`): a
  fotogramma è un disegno senza scala. **Provato** a disegnare in partita, punto per punto: bello ma lavoro buttato a ogni battaglia.
- **Ogni truppa è già pronta** (`figura()` in `scena/campo.js`): alla misura dello schermo, con l'arco in mano e
  girata dalla sua parte, tutte le pose prima che la battaglia cominci. Un disegno a fotogramma invece di cinque ingranditi dal foglio. Il prezzo:
  l'arco non rincula più. Sul telefono lento finto (`vecchio-telefono.mjs`, CPU ×6, ultima misura 5/11) il lavoro del filo principale a
  fotogramma è sceso da 23 a 16,6 ms, con le figure più grandi di prima.
- **Gli atlanti si ricolorano una volta sola**, non a ogni battaglia (`atlanti` in `scena/campo.js`).
- **A fotogramma restano** l'aria del posto (poche decine di tocchi) e le bandiere, quattro fotogrammi già pronti.

## Il terreno e i posti

- **Il terreno è più grande del campo e non si stira mai** (`scena/terreno.js`). Il campo del
  motore (360 × 540) sta in mezzo a un mondo senza bordi: la scala è una sola (`adatta()` in
  `scena/campo.js`), il campo sta in altezza così i castelli spuntano dai due bordi, e di lato
  si vede il terreno che lo schermo lascia. Sotto i `LARGO_MINIMO` (276) di mondo non si scende:
  sono le piazzole coi loro bordi, e su un telefono stretto è la larghezza a decidere la scala.
  Il quadro prende tutto lo schermo (`.ar-largo`, niente più colonna). È solo scena: motore, posti
  e taratura non cambiano. **Era** una colonna 2:3 col terreno specchiato sopra e sotto: su un telefono
  alto il castello si vedeva intero, su un monitor restavano due bande vuote.
- **È il pezzo di mondo `PEZZO_DI_MONDO`** (810 × 540, il campo in mezzo), e oltre i bordi continua specchiato: serve solo a un monitor
  molto largo. Disegnato a monte a due punti per unità (`G`), la grana delle figure: rampe di colori col retino (`tono()`),
  rumore da una tavola, poi i decori e la luce. La tela si rifà se si svuota (un telefono a corto di memoria lo fa
  in silenzio, `controlla()`).
- **I posti sono di Castle Battle** (`scena/ambienti.js`), non i vestiti del castello a torri:

  | chiave | il posto | al posto del fiume | truppa firma |
  |---|---|---|---|
  | `bosco` | le colline d'oro, un tramonto d'autunno | l'acqua | pipistrelli |
  | `palude` | il deserto delle tombe, con le palme solo sull'acqua | l'oasi | mummie |
  | `neve` | il canyon di cristallo | un baratro, con la nebbia viola | golem |
  | `lava` | le terre di cenere, una notte rossa | un fossato di brace | diavoletti |

  **Le chiavi non cambiano** (stanno in `ultimoTerreno`, nella sosta e nelle sfide): cambia solo quello che si vede.
- **I decori stanno a macchie**, con le radure in mezzo (`decora()`): uniformi, l'occhio non si fermava da
  nessuna parte. Quello alto sta fuori dalla diagonale delle piazzole (`libero()`), davanti non copre nessuno;
  sul campo solo cose basse che non si confondono con quello che si tocca.
- **L'aria del posto** (`scena/atmosfera.js`) sta sopra il terreno: ombre di nuvole, riflessi, foglie, sabbia, scintille e braci.
  Va col tempo, e non sa niente della partita.

## La scena

- **La corsia è verticale**: il nemico in alto, chi gioca in basso. È come il motore
  conta (`y` lungo la corsia), quindi la scena non ruota niente. **Provato orizzontale
  e tolto**: i castelli ai due capi mangiavano più di metà della corsia.
- **Tutto è piccolo e il campo è largo** (`ZOOM` 0,5 in `scena/campo.js`): le cose ci stanno
  «più armoniose». Le truppe sono un po' più grandi del terreno (×1,2), castello ed edifici ancora di
  più (`ZE`).
- **Il castello spunta dal bordo** (`base()`): di chi gioca la cima, in basso; del nemico la
  base col portone, in alto. La barra della vita sta dalla parte del campo.
- **Gli edifici sulle piazzole sono il 30% più piccoli del castello** (`TAGLIA`, `ma()` in `scena/campo.js`), perché il campo non sembri affollato. I posti del motore non cambiano, e il bersaglio resta largo per il dito.
- **I posti delle caserme sono piazzole fisse** (`piazzole()`): la piazzola del castello a
  torri, sempre in vista anche vuota, come in un tower defense. Nella metà di ciascuno
  non ci sono alberi né staccionate (le celle `_` della carta prendono solo il prato).
  **Provati e tolti**: una muraglia attorno all'accampamento, un muro davanti al castello,
  e un lastricato alla Heroes con gli edifici attaccati al castello (vedi
  [regole.md](regole.md)).
- **Le caserme e la miniera sono dipinte** (`dati/caserme-dipinte.js`, generato da
  `strumenti/sprite/caserme-arena.py` dal foglio di ChatGPT, voce 7c di
  `strumenti/sprite/DA-GENERARE.md`): ogni edificio con le
  sue truppe, appena costruito e dal livello 5, **il rudere** e **la piazzola vuota**,
  tutti sulla stessa piazzola. Un posto mai usato mostra la piazzola vuota; dove una caserma
  è crollata resta il suo rudere finché non se ne costruisce un'altra (la scena lo ricorda
  dall'evento del crollo, che porta il posto). Le piazzole del foglio non sono tutte della
  stessa misura: lo strumento scala ogni figura sulla sua piazzola, e il punto d'appoggio è
  il centro della piazzola in basso. Finché l'atlante non c'è, o se manca un pezzo, gli
  edifici si disegnano in codice (`scena/edifici.js`, con lo scudo della truppa davanti).
- **Il nemico ha le stesse immagini col blu fatto rosso** (`ricolora()`, una volta per
  atlante): per questo il prompt vuole il colore della squadra di un blu solo. Il rosso del foglio
  non si tocca: è il fuoco e il drago, che anche dal nemico restano rossi. Le truppe no: hanno un foglio per squadra (qui sotto).
- **Il castello è uno solo, del colore della sua squadra** (a monte: blu anche negli stendardi, e il nemico è lo stesso col blu fatto rosso), e
  il prato dipinto ai suoi piedi prende il colore del posto. Viene dal vestito `bosco` del castello a torri finché non arrivano i castelli del posto (voce 9).
  Prima ogni terreno aveva il suo, e nella lava i colori delle squadre erano rovesciati.
  **Provato** il filtro `hue-rotate`: tetti verdi e neve rosa.
- **Ogni squadra ha il suo foglio di truppe** (voce 12b, ChatGPT; Grok in modalità agente non era partito): disegnate da zero,
  blu per chi gioca e rosse per il nemico, nove truppe con quattro pose ciascuna, **ferma, due passi, il colpo**
  (`dati/truppe-dipinte.js`, `truppe-arena.py`). Il colpo dura quanto lo scatto in avanti (`u.colpo`), chi cammina alterna i passi,
  chi vola sbatte le ali sempre (`fotogramma()` in `scena/figure.js`). L'arco, la lancia, la bomba e la fiammata sono nel dipinto:
  l'arco del sotterraneo messo in mano a parte non c'è più. Le figure guardano a destra e il nemico si specchia.
- **Il taglio** non segue la griglia: la freccia e la fiammata escono dalla casella, e nel foglio rosso la fiammata del drago tocca
  il drago dopo (Grok ne ha disegnati otto invece di quattro: gli altri si ignorano). Le figure sono le macchie di pixel attaccati,
  e una macchia divisa fra due caselle si taglia nel punto più stretto. Le pose di una truppa hanno lo stesso piede e lo stesso centro
  (quello della ferma, `centro` del pezzo): il pipistrello che sbatte le ali non salta. La misura in campo è quella di prima
  (`alto` in `truppe.json`), con l'atlante una volta e mezza più fitto (`risoluzione`): 789 KB, tre volte quello di prima.
- Sotto i piedi resta un disco pieno del colore della squadra. **Provati prima**, e bocciati: un contorno del colore della squadra
  (un alone al neon anche sottile), una fascia di traverso in codice (nastro adesivo), il busto tinto in codice.
- **Chi è chi**: scheletri arcieri, scheletri opliti, mummie (`lupi` nel codice), diavoletti, pipistrelli, bestie cornute,
  negromanti, golem, draghi.
- **Una caserma nuova spunta** dalla sua piazzola con un rimbalzo e uno sbuffo di polvere.
- **La vita dei castelli sta SOPRA i castelli**, in una targa di legno orlata d'oro, grande e sempre
  accesa, col numero. Il livello è uno scudetto. **Le altre barre si vedono solo sul ferito** (caserme, porta, truppe).
- **Un crollo e la bomba si sentono**: il quadro trema un terzo di secondo (`scossa`), le schegge saltano, la bomba ha
  il lampo e la seconda onda. Trema solo il disegno: il mondo resta dov'è.
- **Niente barra della prossima squadra**: c'era, verde, sotto il livello delle carte; tolta
  (l'utente: «orribili»), e poi tolte anche le carte: si tocca il campo ([regole.md](regole.md)).
- **La miniera** (`disegnaMiniera()` in `arena-disegni/opere.js`) è un monte di roccia con le
  vene d'oro, l'imbocco armato di travi con la lanterna, le rotaie, il carrello d'oro e lo stendardo; dal livello
  5 la torre col verricello. La roccia è uguale in tutti i posti (`ROCCIA`), se no sul terreno
  scuro spariva. Crollata resta il suo rudere. Il foglio 7c ha gli stessi tre pezzi, e `dipinta()` li preferisce: quello disegnato resta solo di riserva.
- **I terreni dipinti entrano tutti insieme**: `terreni-arena.py` li usa solo quando ci sono tutti e quattro, perché uno solo in mezzo ai disegni stona. Ora ci sono: il ponte delle colline è ancora largo e tocca le caserme ai lati, si rifà (voce 8).
- **Sul ponte si cammina fra i parapetti** (`CAMPO.ponte`, in `separa()`): chi non ci passa si mette in fila, chi vola ci passa sopra. Il limite è la misura del piano dei dipinti, meno mezza truppa.
- **Un terreno dipinto ha il suo ponte** (`PONTE_DIPINTO` di `dati/terreni-pronti.js`), e il gioco non ci mette il suo: sta fra le rive e largo il 10% dell'immagine, se no tocca le caserme ai lati.
- **Il ponte e la porta** (`arena-disegni/opere.js`) prendono legno e pietra dal posto. Il ponte ha le assi fra due travi
  con le spalle di pietra; la porta due torri merlate con lo stendardo e il portone, che si crepa sotto i due terzi e
  sotto un terzo della vita; crollata, resta il cumulo. Il foglio 9 ha castello e porta (intera, rotta,
  crollata) per ogni posto, col fondo trasparente: il ponte sta nel terreno (`strumenti/sprite/fortezze-arena.py`, `dati/fortezze-dipinte.js`).
  **La porta di chi gioca si vede da dietro** (`porta:<posto>:<stato>:dietro`, foglio 9b): il campo si guarda da sotto, e la sua faccia col portone
  guarda il nemico. Un posto che non ce l'ha usa quella dal davanti. Le porte dipinte hanno le loro bandiere: quelle in codice solo sulle disegnate.
- **Mancano**: i fogli 10 e 11, e le pose di morte delle truppe.

## Il quadro e i comandi

- **Le icone dei comandi sono una famiglia sola** (`viste/Icona.vue`): stessa cornice, stesso tratto, due toni. Tre pulsanti di stili e misure
  diversi nella stessa riga facevano brutto (l'utente): nell'anello sono tre gemelli da 68 px, icona sopra e una riga sotto, e niente emoji
  dove c'è un'icona, nemmeno il diamante dei prezzi. Il foglio 11 le rifà dipinte.

Tutta l'interfaccia è **legno e oro come le finestre del sotterraneo** (`--ar-cornice`, `--ar-ottone` e gli altri valori in testa a `stile.css`, gli angoli sono il suo `Angoli.vue`, i titoli in serif: niente font in più). Una finestra ha il bordo d'oro sfumato, dentro i riquadri sono incassati, i tasti che contano sono d'ottone. Il quadro
prende tutto quello che la barra (`scura`) e la targa lasciano. Orologio e diamanti stanno nella targa in alto; ripara e
bomba sono due scudi di bronzo nei due angoli di sotto del campo (`.ar-azioni`), ai lati del castello e più bassi delle
piazzole, col prezzo o l'attesa in un cartellino: impilati a destra coprivano una caserma. Su uno schermo largo
stanno agli angoli del campo, non a quelli del quadro (`cqh`).
- **L'annuncio**: quando una battaglia comincia (non quando si riprende) il suo nome passa su una fascia con le spade
  (`.ar-annuncio`), e sparisce da solo. Non ferma le dita.
- **La fine**: stemma con le spade, e i raggi che girano dietro una vittoria.
- **La mappa è una sala di guerra**: il frontone, e per ogni posto uno scorcio già pronto dello stesso terreno del campo
  (`viste/Panorama.vue`, un'immagine). Quando c'è la copertina dipinta (voce 10) il frontone mostra quella (`INSEGNA`).
- **La nuvoletta va a capo**: con più di quattro opzioni (le truppe di un terreno della battaglia
  infinita sono sei, più la miniera) le righe sono due, bilanciate; prima, con otto truppe, usciva dallo schermo.
- **Le modali sono quelle della fattoria e del sotterraneo, ma asciutte**: la scelta di una
  piazzola è una nuvoletta di pergamena con l'orlo di bronzo (disegno e pulsantino col prezzo, il «?»
  dei numeri piccolo nell'angolo), l'anello usa gli stessi pulsanti, i dettagli una scheda
  scura con la ✕ rossa tonda. Il bambino sa già cosa vuole costruire: **niente nomi, note e
  titoli**, e le emoji restano solo dove portano informazione (💎 del prezzo, 💰 vendi, ⛏️ per
  la miniera, che non ha un ritratto).

## Lo sfondo che resta verde

Se il campo restava del colore di fondo c'erano due strade: un'immagine non arrivava (`carica` e `caricaFigure` ricordavano il
fallimento per sempre) o la tela del terreno si svuotava. Ora `Campo.prepara` riprova fino a cinque volte e ogni due secondi
`Terreno.controlla` guarda un punto della tela: se è trasparente la butta e la rifà. Non riprodotto a banco: se torna, si guarda
quale delle due.
