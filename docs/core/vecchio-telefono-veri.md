# La misura coi modelli veri

Zona dei grandi (codice) → **Impostazioni** → tendina **Avanzate** → **Misura questo telefono** (`components/genitori/Benchmark.vue`).
**Gli fps veri**: le scene vere dei giochi 3D, con la fascia che il telefono ha, e a quanti fotogrammi girano. La fascia e come si decide stanno in [vecchio-telefono.md](vecchio-telefono.md),
«La fascia»; il foglio la scrive in testa (`[data-benchmark-fascia]`: quale, da dove viene, i punti della misura di un secondo).

## Sul telefono

Il foglio ha il tasto, con quante scene e quanti minuti (`stima()` in `veri.js`). Le scene si vedono mentre girano: se una
luce, un colore o la nebbia sembrano sbagliati, alla fine c'è un campo **Note** che finisce nel resoconto. Lo schermo non deve
spegnersi (niente wake lock nel progetto: lo dice il foglio). Alla fine: **Manda** (o «Manda 1/2»… se il resoconto non sta in un
invio), **Copia**, **Rifai**. L'ultimo resoconto resta sul telefono (`store/benchmark.js`, chiave `benchmark`, fuori dai profili):
«L'ultima misura» lo riapre. **Si salva a ogni scena** (`parziale` di
`eseguiVeri`): se il telefono si pianta, l'ultima ha le scene fatte fin lì, con «A METÀ: N scene di M» in testa.

Quando si fa: dopo una modifica che pesa (un effetto, un modello, una leva della fascia), per sapere se si gioca ancora liscio. Una
misura nuova si chiede solo se è cambiato qualcosa che conta per lei.

## Gli fps veri

`TAPPE_FPS` in `veri.js`, gruppo `fps`, 9 scene, ~3 minuti: **a quanti fotogrammi al secondo gira davvero il gioco**. Le scale leggono un
pixel a fine fotogramma per sapere quanto lavora la GPU, e così CPU e GPU vanno una dopo l'altra: il lavoro è giusto, gli fps sono più
bassi del vero. Qui niente lettura (`TEMPI.fps`, `vero`): si contano solo gli intervalli fra un fotogramma e l'altro, come li vede chi gioca.

| scena | cosa | dove |
|---|---|---|
| `fps-piano` | l'eroe cammina da una stanza all'altra di un piano, senza mostri (la nebbia si apre camminando) | `veri/discese.js`, `passeggia` |
| `fps-sot-3`, `fps-sot-6` | lo scontro con 3 e 6 mostri leggendari e un colpo ogni 0,7 s | `veri/discese.js` |
| `fps-villaggio` | l'eroe gira attorno alla piazza alla velocità del gioco, con le persone del villaggio | `veri/sopra-vero.js` |
| `fps-prato` | lo scontro sul prato davanti alla tana del primo luogo, aperto come lo apre il gioco (motore/aperta.js, palco di sopra), 3 mostri e i colpi | `veri/sopra-vero.js` |
| `fps-fat-10`, `fps-fat-30` | la fattoria «tipo» del livello 10 e del 30, col degrado del gioco acceso | `veri/fattoria.js`, `opz.degrado` |
| `fps-ast`, `fps-ast-boom` | gli Asteroidi su una partita finta: 8 sassi, la nave, la nave madre; e lo stesso con un'esplosione al secondo (scintille sotto il tetto della fascia, l'anello, la scossa) | `veri/asteroidi.js`, `boom` |

Otto secondi di misura dopo il rodaggio. **Nel resoconto** una riga per scena: `ok`/`~`/`XX`
(sopra 50, sopra 30, sotto 30 fps), gli fps, la parte di fotogrammi arrivati dopo più di 34 ms (sotto i 30 fps), il p95 dell'intervallo e
i fermi oltre 100 ms; il js è solo la CPU. Nella LETTURA la riga
**FPS VERI** le mette in fila: liscio, si gioca a tratti, a scatti. Gli fps non superano la frequenza dello schermo (60 sul Note 7).

Sul Note 7 in fascia bassa, il 29/10 sera: tutte fra 56 e 60, gli asteroidi anche con le esplosioni. Una volta il piano è sceso a 41
(17:05): rifatto in fondo e con le armi semplici andava a 59 e 60, quindi era un caso (la prima scena dopo il caricamento) e non le armi. Prima delle leve del mondo di sopra il villaggio andava a 17 e il prato a 15
([../sotterraneo/prestazioni-3d-bassa.md](../sotterraneo/prestazioni-3d-bassa.md)).

Tolte il 29/10, perché avevano risposto: «dove pesa», le due scale (lo scontro e il villaggio costruiti un pezzo alla volta: il salto
da un gradino all'altro era il costo del pezzo dentro la scena vera) e le leve una per una. Se una scena torna a scattare si ripescano da
`git log` (`veri/scala.js`). Provato prima: un pezzo da solo su scena vuota non dice il costo vero, tolto dalla scena intera si confonde
con gli altri.

## Come si spegne un elemento

`grafica/elementi3d.js`: ogni cosa porta il nome del suo elemento in `userData.elemento3d` (`segna`, `segnaNuovi` attorno a chi la
crea; i figli lo ereditano), e una mesh a più materiali il nome di ogni materiale (`userData.elementiMateriali`, i muri). A ogni
fotogramma `creaElementi` spegne quelli spenti in `ACCESI`: sullo strato 31 (né la telecamera né l'ombra lo guardano) o il materiale
invisibile; tutto acceso non tocca niente. Quello senza nome in cima è il `resto`. A mano:
`#…&spegni=pavimento,pareteVicina` nelle discese, `&spegni=case,natura` di sopra, `&spegni=edifici,erba` nella fattoria 3D (comandi.md).

## Come si misura

- **Gli intervalli fra un fotogramma e l'altro**, come li vede chi gioca: fps, la parte sotto i 30, il p95, i fermi oltre 100 ms. Il js
  è il lavoro della CPU dal primo `requestAnimationFrame` del fotogramma all'ultimo, diviso fra il giro del gioco e il disegno di three.
- **Prima apparizione**: i fotogrammi mentre la scena si prepara e i primi dieci si tengono a parte: `primo` è il più lungo, `+Nsh` gli
  shader nuovi (`renderer.info.programs`).
- **Rodaggio** 2-4 s scartati (doppio alla prima scena di un gioco), finché la mediana di 10 fotogrammi non cambia più del 15% dalle 10
  prima; poi 8 s di misura.
- Chiamate e triangoli da `renderer.info` (il più alto di un campione ogni 5 fotogrammi), la memoria nella testa; un contesto WebGL perso
  si conta; gli avvisi e gli errori della console mentre gira si riassumono in **AVVISI**. Un gioco che non si carica o una scena che si
  rompe sono «non regge». In testa anche la batteria all'inizio e alla fine e la rete.

### Il tetto di tempo e il lettore

`veri.js`, `TETTO`, `conTetto`: ogni scena ha un tetto (le due fasi a `fine` più 15 s), il caricamento di un gioco 30 s. Scaduto, la scena è «non regge: tempo scaduto (… oltre N s)», il gruppo si butta e si rifà da capo per la
scena dopo, e la prova va avanti; una preparazione che arriva dopo il tetto si butta appena arriva. Il tetto non può niente se la
pagina intera è ferma (un fotogramma che non torna dalla GPU blocca anche i timer): per questo c'è il lettore.

**Il lettore**, in alto a sinistra mentre una prova gira: gli fps dell'ultimo mezzo secondo (un requestAnimationFrame suo, come
`ContaFps.vue`) e i secondi nella scena di adesso; lo stesso nel riquadro in basso. Se i fotogrammi non arrivano per 5 s scrive «il
telefono non risponde»; se si ferma tutta la pagina lo scrive il CSS, perché il battito che ogni mezzo secondo rimette la scritta
invisibile non arriva più (l'opacità la anima il compositore).

## Il resoconto

Testa: `(fps veri)`, modello (da `userAgentData`: lo user agent ridotto di Chrome dice «K»), schermo, core,
fascia; batteria e rete; GPU e fornitore; trame massime, uniform, varying, i bit di `highp` e `mediump` (un `mediump` a 10 bit è mezzo
float), le estensioni che il gioco usa e mancano. Poi la testa del gruppo (`[fps] codice 7053 ms, dpr 1, luci 4p 1s 0d 1h ombre 0,
mem…, prog 55`) e una riga per scena. La **LETTURA**: gli FPS VERI, la CPU (la prova JS: un computer sta fra 110 e 160 ms), la batteria,
le prime apparizioni lente (senza `KHR_parallel_shader_compile` gli shader si compilano bloccando), la GPU, i contesti persi, chi non
regge. In fondo le **NOTE** e la riga `DATI {"v":4,"k":"veri",…}`: `r` ha `[id, ms, p95, fps, chiamate, ktriangoli, primo, shader, js,
sotto i 30 %, fermi]` e, dove c'è, `gioco, disegno` in coda.

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
node strumenti/vecchio-telefono.mjs benchmark [--solo fps-sot,js]     # gli fps veri sul Note 7 imitato, o solo alcune scene
node strumenti/vecchio-telefono.mjs benchmark --contro telefono.txt    # e riga per riga contro il telefono
node strumenti/vecchio-telefono.mjs calibra --log telefono.txt [--prova]   # la CPU sul `js` del log; la zavorra resta (`--zavorra`)
```

Con la CPU ×5 e SwiftShader su 4 core la prova dura molto di più che sul telefono: per guardare solo che giri, `--cpu 1 --core 0 --gpu hw`.
**I ms del computer non valgono** come telefono (il computer è condiviso: fra due giri ballano del 20-50%; SwiftShader va più piano sui
pixel e più svelto con molte luci): dal confronto si leggono la struttura (le stesse chiamate, triangoli e shader scena per scena) e gli
ordini di grandezza. I numeri veri li dà il telefono.

## Il codice

`grafica/benchmark/veri.js` (le scene, `TAPPE_FPS`, `stima`, il giro dei fotogrammi, la GPU, gli avvisi, `proveCpu`), `veri/discese.js`,
`sopra-vero.js`, `fattoria.js`, `asteroidi.js` (un gioco ciascuno), `tela.js`, `leggendario.js` (il corredo del cheat); il log in
`log-veri.js` (`componiVeri`, `letturaVeri`, `spezza`, `conNote`). Nel sito spezzato `vite.config.js` tiene
`grafica/benchmark/` fuori dal file `comune`: si carica a richiesta, e i modelli veri tirano dentro i giochi.

Tolte il 29/10, perché avevano risposto (la storia in `git log`): la misura a scene sintetiche, le misure complete (serie di mostri,
persone, edifici, triangoli, chiamate, luci, pixel, la roba, lo zaino, la scena con una cosa tolta alla volta), «chi pesa» un elemento
alla volta, l'ingresso da freddo, il confronto con la misura del 22/10, le due scale di «dove pesa» e il riferimento del calore
(con un gruppo solo non serviva).

Nei test: `[data-azione="benchmark-veri"]`, `[data-benchmark-fascia]`,
`[data-benchmark-palco]` (dove girano le scene), `[data-azione="benchmark-interrompi"]`, `[data-benchmark-note]`,
`[data-azione="benchmark-manda"][data-parte]`, `[data-azione="benchmark-ultima"][data-tipo="fps"]`,
`[data-azione="benchmark-al-computer"]`, `[data-benchmark-lettore]`, `[data-benchmark-secondi]`, `[data-benchmark-muto]`;
`window.__benchmarkVeri` (i dati), `window.__benchmarkSolo` (gli inizi degli id), `window.__benchmarkCorto` (scene di pochi decimi).
`unita/benchmark-veri` (le scene, il log, gli invii, la prova a metà), `unita/benchmark-tetto` (una scena che non finisce, un gioco che
non si carica), `unita/elementi-3d`, `integrazione/benchmark-veri` (la prova intera, in tempi corti).
