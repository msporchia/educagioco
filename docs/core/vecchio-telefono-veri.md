# La misura coi modelli veri

Zona dei grandi (codice) → **Impostazioni** → tendina **Avanzate** → **Misura questo telefono** (`components/genitori/Benchmark.vue`).
Due prove, con le scene vere dei giochi 3D e la fascia che il telefono ha: **gli fps veri** (a quanti fotogrammi gira il gioco) e
**dove pesa** (quanto costa ogni pezzo di una scena). La fascia e come si decide stanno in [vecchio-telefono.md](vecchio-telefono.md),
«La fascia»; il foglio la scrive in testa (`[data-benchmark-fascia]`: quale, da dove viene, i punti della misura di un secondo).

## Sul telefono

Il foglio ha i due tasti, con quante scene e quanti minuti (`stima(prova)` in `veri.js`). Le scene si vedono mentre girano: se una
luce, un colore o la nebbia sembrano sbagliati, alla fine c'è un campo **Note** che finisce nel resoconto. Lo schermo non deve
spegnersi (niente wake lock nel progetto: lo dice il foglio). Alla fine: **Manda** (o «Manda 1/2»… se il resoconto non sta in un
invio), **Copia**, **Rifai**. L'ultimo resoconto di ognuna delle due prove resta sul telefono (`store/benchmark.js`, chiave
`benchmark`, fuori dai profili): «L'ultima degli fps» e «L'ultima di dove pesa» lo riaprono. **Si salva a ogni scena** (`parziale` di
`eseguiVeri`): se il telefono si pianta, l'ultima ha le scene fatte fin lì, con «A METÀ: N scene di M» in testa.

Quando si fa: **gli fps veri** dopo una modifica che pesa (un effetto, un modello, una leva della fascia), per sapere se si gioca
ancora liscio; **dove pesa** quando una scena scatta, per sapere quale pezzo togliere o semplificare. Una misura nuova si chiede solo se
è cambiato qualcosa che conta per lei.

## Gli fps veri

`PROVE.fps` in `veri.js`, gruppo `fps`, 7 scene, ~3 minuti: **a quanti fotogrammi al secondo gira davvero il gioco**. Le scale leggono un
pixel a fine fotogramma per sapere quanto lavora la GPU, e così CPU e GPU vanno una dopo l'altra: il lavoro è giusto, gli fps sono più
bassi del vero. Qui niente lettura (`TEMPI.fps`, `vero`): si contano solo gli intervalli fra un fotogramma e l'altro, come li vede chi gioca.

| scena | cosa | dove |
|---|---|---|
| `fps-piano` | l'eroe cammina da una stanza all'altra di un piano, senza mostri (la nebbia si apre camminando) | `veri/discese.js`, `passeggia` |
| `fps-sot-3`, `fps-sot-6` | lo scontro con 3 e 6 mostri leggendari e un colpo ogni 0,7 s | `veri/discese.js` |
| `fps-villaggio` | l'eroe gira attorno alla piazza alla velocità del gioco, con le persone del villaggio | `veri/sopra-vero.js` |
| `fps-prato` | lo scontro sul prato davanti alla tana del primo luogo, aperto come lo apre il gioco (motore/aperta.js, palco di sopra), 3 mostri e i colpi | `veri/sopra-vero.js` |
| `fps-fat-10`, `fps-fat-30` | la fattoria «tipo» del livello 10 e del 30, col degrado del gioco acceso | `veri/fattoria.js`, `opz.degrado` |

Otto secondi di misura dopo il rodaggio, un riferimento del calore solo (un gruppo). **Nel resoconto** una riga per scena: `ok`/`~`/`XX`
(sopra 50, sopra 30, sotto 30 fps), gli fps, la parte di fotogrammi arrivati dopo più di 34 ms (sotto i 30 fps), il p95 dell'intervallo e
i fermi oltre 100 ms; il js è solo la CPU (manca la GPU, e per questo queste righe non entrano in «CPU o GPU»). Nella LETTURA la riga
**FPS VERI** le mette in fila: liscio, si gioca a tratti, a scatti. Gli fps non superano la frequenza dello schermo (60 sul Note 7).

Sul Note 7 in fascia bassa, il 29/10: tutte fra 55 e 60 (villaggio 59, prato 58; un piano 55 con due fermi oltre 100 ms, gli shader
compilati al primo incontro). Prima delle leve del mondo di sopra il villaggio andava a 17 e il prato a 15
([../sotterraneo/prestazioni-3d-bassa.md](../sotterraneo/prestazioni-3d-bassa.md)).

## Dove pesa: le due scale

`PROVE.scale`, 21 scene, ~4 minuti: una scena vera costruita **un gradino alla volta**, dal fondo fino alla scena intera; ogni gradino
accende i suoi pezzi sopra quelli di prima, nella fascia del telefono (un pezzo che la fascia spegne resta spento). Il **salto** da un
gradino all'altro è il costo di quel pezzo dentro la scena vera, JS e GPU a parte; in fondo un gradino si rifà (`-ancora`) e la
differenza è il **rumore** (un salto più piccolo non dice niente). Le scale sono in `veri/scala.js` (`SCALE`, `ELEMENTI_SCALA`):

- **lo scontro delle discese** (`scala`, la scena di `veri/elementi-sot.js` con 3 mostri): niente disegnato (il giro del gioco), la luce
  fissa e il resto, il pavimento, le pareti, colonne e arredo, rilievo-torcia-fuochi-lampi-nebbia, l'eroe, i mostri, e in cima
  particelle, effetti, ombra e passaggio finale; il rumore rifà le pareti.
- **il villaggio di sopra** (`scala-sopra`, la scena di `veri/elementi-sopra.js`, 4 persone e 3 mostri finti): niente, cielo e luci,
  mare, terreno, il rilievo del terreno, case e piazza, alberi-erba-natura, nebbia della mappa-foschia-vita-scia, persone ed eroe,
  mostri; il rumore rifà il terreno. L'ombra del sole sta col cielo: la bassa non la disegna.

I ms sono **lavoro in fila** (si aspetta la GPU a ogni fotogramma): contano i salti, non il totale, e le righe hanno `·` al posto di
`ok`/`XX`. La LETTURA ha una riga per gradino, i tre più cari sopra il rumore e, in cima a ogni scala, «Dove va il JS»: il giro del gioco
(`grafica().msJs`), il disegno di three (`msDisegno`) e il resto, sugli stessi fotogrammi. **In salita, dal semplice**: se il telefono si
pianta al gradino 6, i primi cinque sono già salvati.

- Provato: un pezzo da solo su scena vuota non dice il costo vero (una luce senza niente da illuminare è gratis), tolto dalla scena
  intera si confonde con gli altri. La scala li dice dentro la scena vera.
- Per sapere quanto toglie una leva della fascia: la scala con e senza (`&riaccendi=` rimette un pezzo che la fascia spegne), o una
  tappa con `opz.riaccendi` per scena, come si è fatto il 29/10 (prestazioni-3d-bassa.md).

### Come si spegne un elemento

`grafica/elementi3d.js`: ogni cosa porta il nome del suo elemento in `userData.elemento3d` (`segna`, `segnaNuovi` attorno a chi la
crea; i figli lo ereditano), e una mesh a più materiali il nome di ogni materiale (`userData.elementiMateriali`, i muri). A ogni
fotogramma `creaElementi` spegne quelli spenti in `ACCESI`: sullo strato 31 (né la telecamera né l'ombra lo guardano) o il materiale
invisibile; tutto acceso non tocca niente. Quello senza nome in cima è il `resto`: col gradino 0 le chiamate devono essere 0 (la prova
del browser lo controlla). Speciali delle scene: `ombra`, `normali` (`veri/normali.js`), `post`, `foschia`. A mano:
`#…&spegni=pavimento,pareteVicina` nelle discese, `&spegni=case,natura` di sopra, `&spegni=edifici,erba` nella fattoria 3D (comandi.md).

## Come si misura

- **Lavoro di un fotogramma** (le scale): dal primo `requestAnimationFrame` del fotogramma (chiesto prima del giro del gioco)
  all'ultimo (chiesto dopo), con la lettura di un pixel che aspetta la GPU. Mediana e p95, diviso in **js** (fino alla lettura) e
  **gpu** (l'attesa della lettura). Se la gpu tiene quasi tutto, il collo sono pixel, luci e ombre; se tiene il js, chiamate e codice.
- **Calore**: prima di ogni gruppo 4,5 s a schermo nero, poi un **riferimento** fisso (`veri/base.js`: 100 cubi lucidi, quattro luci,
  un pavimento a tutto schermo, ~3 s; il primo si rifà sempre, perché è freddo, e uno più che doppio del più svelto si rifà una volta).
  La deriva (riferimento ÷ il più svelto) va nella testa del gruppo (`rif 31 ms x1.12`) e su ogni riga; la LETTURA usa i ms divisi per
  la deriva (le righe scaldate dicono `≈` il valore corretto). In testa anche la batteria all'inizio e alla fine e la rete.
- **Prima apparizione**: i fotogrammi mentre la scena si prepara e i primi dieci si tengono a parte: `primo` è il più lungo, `+Nsh` gli
  shader nuovi (`renderer.info.programs`), `pronto` quanto ci ha messo la scena (se più di 1,5 s).
- **Rodaggio** 1,5-3 s scartati (doppio alla prima scena di un gruppo), finché la mediana di 10 fotogrammi non cambia più del 15% dalle
  10 prima; **misura** 3-4,5 s a finestre di 1 s, finché fotogrammi lenti e mediana di due finestre di fila non si fermano; al tetto la
  riga dice «instabile». Gli fps veri: 8 s.
- Chiamate e triangoli da `renderer.info` (il più alto di un campione ogni 5 fotogrammi), la memoria nella testa del gruppo; un contesto
  WebGL perso si conta; gli avvisi e gli errori della console mentre gira si riassumono in **AVVISI**. Un gruppo che non si carica o una
  scena che si rompe sono «non regge».

### Il tetto di tempo e il lettore

`veri.js`, `TETTO`, `conTetto`: ogni scena ha un tetto (le due fasi a `fine` più 15 s), il caricamento di un gruppo 30 s, il riferimento
del calore la pausa più 45 s. Scaduto, la scena è «non regge: tempo scaduto (… oltre N s)», il gruppo si butta e si rifà da capo per la
scena dopo, e la prova va avanti; una preparazione che arriva dopo il tetto si butta appena arriva. Il tetto non può niente se la
pagina intera è ferma (un fotogramma che non torna dalla GPU blocca anche i timer): per questo c'è il lettore.

**Il lettore**, in alto a sinistra mentre una prova gira: gli fps dell'ultimo mezzo secondo (un requestAnimationFrame suo, come
`ContaFps.vue`) e i secondi nella scena di adesso; lo stesso nel riquadro in basso. Se i fotogrammi non arrivano per 5 s scrive «il
telefono non risponde»; se si ferma tutta la pagina lo scrive il CSS, perché il battito che ogni mezzo secondo rimette la scritta
invisibile non arriva più (l'opacità la anima il compositore).

## Il resoconto

Testa: la prova (`(fps veri)` o `(dove pesa)`), modello (da `userAgentData`: lo user agent ridotto di Chrome dice «K»), schermo, core,
fascia; batteria e rete; GPU e fornitore; trame massime, uniform, varying, i bit di `highp` e `mediump` (un `mediump` a 10 bit è mezzo
float), le estensioni che il gioco usa e mancano. Poi un gruppo alla volta (`[scala] codice 3400 ms, dpr 1, luci 0p 0s 1d 1h ombre 0,
mem…, prog 95, rif 25.6 ms x1`) e una riga per scena. La **LETTURA**: gli FPS VERI, «Dove va il JS», le SCALE, il calore, la CPU (la prova
JS: un computer sta fra 110 e 160 ms), la batteria, CPU o GPU, le prime apparizioni lente (senza `KHR_parallel_shader_compile` gli shader
si compilano bloccando), la GPU, i contesti persi, chi non regge. In fondo le **NOTE** e la riga `DATI {"v":3,"k":"veri","p":"scale",…}`:
`r` ha `[id, ms, p95, fps, chiamate, ktriangoli, primo, shader, js, gpu, deriva]` e, dove c'è, `gioco, disegno` in coda.

Un invio del modulo dei giudizi regge ~3,5k caratteri: un resoconto più lungo si **spezza in più invii** a 3400 caratteri, fra una
riga e l'altra, ognuno con «(parte k/n)» in testa e la riga DATI intera nell'ultimo. Per lo strumento basta incollare le parti in un
file, una dopo l'altra. «Copia» copia tutto in una volta.

## Mandare il resoconto al computer

`node strumenti/ricevi-log.mjs [--porta 8787] [--dist dist-sito]` serve il sito (dopo `npm run build:sito`) su `0.0.0.0` e stampa
gli indirizzi da aprire sul telefono (IP di LAN; il nome e l'IP Tailscale se `tailscale status --json` c'è). In http su un IP il
browser non registra il service worker (non è un contesto sicuro): la PWA non disturba. `GET /ricevi-log` risponde `{ok:true,v:1}`;
`POST /ricevi-log` prende `{ testo, dati?, agente?, note?, quando? }` (JSON, max 200 KB) e scrive
`strumenti/vecchio-telefono/log/ricevuti/AAAA-MM-GGThhmm-<modello>.txt` (non versionata). Si accettano solo Host e Origin di casa
(localhost, reti private, tailnet `100.64/10` e `*.ts.net`, `.local`).

Lato app: `grafica/benchmark/invio-diretto.js` (`sondaRicevitore`, `mandaAlRicevitore`). A fine prova (e riaprendo l'ultima) il foglio
sonda il ricevitore; se la pagina è servita da lui il resoconto parte **da solo** al computer e compare **Manda al computer** per
rimandarlo con le note. Fuori dal ricevitore (sito vero, file unico) restano «Manda» (modulo) e «Copia».

## Sul computer

```bash
npm run build
node strumenti/vecchio-telefono.mjs benchmark                          # gli fps veri sul Note 7 imitato
node strumenti/vecchio-telefono.mjs benchmark --scale [--solo scala-sopra]   # dove pesa, o solo alcune scene
node strumenti/vecchio-telefono.mjs benchmark --contro telefono.txt    # e riga per riga contro il telefono (la prova la dice il log)
node strumenti/vecchio-telefono.mjs calibra --log dovepesa.txt [--scena scala-sopra-9] [--prova]   # la CPU sul `js`, la zavorra su una scena
```

Con la CPU ×5 e SwiftShader su 4 core la prova dura molto di più che sul telefono: per guardare solo che giri, `--cpu 1 --core 0 --gpu hw`.
**I ms del computer non valgono** come telefono (il computer è condiviso: fra due giri ballano del 20-50%; SwiftShader va più piano sui
pixel e più svelto con molte luci): dal confronto si leggono la struttura (le stesse chiamate, triangoli e shader scena per scena) e gli
ordini di grandezza. I numeri veri li dà il telefono.

## Il codice

`grafica/benchmark/veri.js` (le due prove, `PROVE`, `stima`, il giro dei fotogrammi, il calore, la GPU, gli avvisi, `proveCpu`),
`veri/discese.js`, `sopra-vero.js`, `fattoria.js` (gli fps veri), `elementi-sot.js`, `elementi-sopra.js` (le scale), `base.js` (il
riferimento), `tela.js`, `normali.js`, `leggendario.js` (il corredo del cheat), `scala.js` (i gradini e la loro LETTURA); il log in
`log-veri.js` (`componiVeri`, `letturaVeri`, `corretta`, `spezza`, `conNote`). Nel sito spezzato `vite.config.js` tiene
`grafica/benchmark/` fuori dal file `comune`: si carica a richiesta, e i modelli veri tirano dentro i giochi.

Tolte il 29/10, perché avevano risposto (la storia in `git log`): la misura a scene sintetiche, le misure complete (serie di mostri,
persone, edifici, triangoli, chiamate, luci, pixel, la roba, lo zaino, la scena con una cosa tolta alla volta), «chi pesa» un elemento
alla volta, l'ingresso da freddo, il confronto con la misura del 22/10.

Nei test: `[data-azione="benchmark-veri"]` (gli fps veri), `[data-azione="benchmark-scale"]` (dove pesa), `[data-benchmark-fascia]`,
`[data-benchmark-palco]` (dove girano le scene), `[data-azione="benchmark-interrompi"]`, `[data-benchmark-note]`,
`[data-azione="benchmark-manda"][data-parte]`, `[data-azione="benchmark-ultima"][data-tipo="fps"|"scale"]`,
`[data-azione="benchmark-al-computer"]`, `[data-benchmark-lettore]`, `[data-benchmark-secondi]`, `[data-benchmark-muto]`;
`window.__benchmarkVeri` (i dati), `window.__benchmarkSolo` (gli inizi degli id o dei gruppi), `window.__benchmarkCorto` (scene di pochi
decimi), `window.__benchmarkRaffredda` (i ms di pausa fra i gruppi). `unita/benchmark-veri` (le prove, il log, la scala, gli invii, la
prova a metà), `unita/benchmark-tetto` (una scena che non finisce, un gruppo che non si carica), `unita/elementi-3d`,
`integrazione/benchmark-veri` (le due prove intere, in tempi corti).
