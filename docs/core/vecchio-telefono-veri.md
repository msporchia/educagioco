# La misura coi modelli veri

La misura a scene ([vecchio-telefono.md](vecchio-telefono.md#la-misura-a-scene-il-benchmark)) dice quanto costa ogni cosa da
sola, su forme finte. Questa fa girare **il codice vero dei giochi** sul telefono vero, per sapere fin dove regge senza farci
giocare il bambino: quanti mostri nello scontro, quante persone sopra, quanti edifici nella fattoria, e che cosa rallenta
(triangoli, chiamate, pixel, luci). Il computer imitato non lo dice: la GPU del telefono non si imita.

## Sul telefono

Zona dei grandi (codice) → **Impostazioni** → tendina **Avanzate** → **Misura questo telefono** → **Avvia coi modelli veri**.
Dura un quarto d'ora circa (57 scene, e fra un gruppo e l'altro 8 s di schermo nero perché il telefono si raffreddi): la barra in fondo dice a
che scena si è, **Interrompi** la ferma e tiene il resoconto di quello che c'è. Le scene si vedono mentre girano: se una luce, un
colore o la nebbia sembrano sbagliati, alla fine c'è un campo **Note** che finisce nel resoconto. Lo schermo non deve spegnersi
(niente wake lock nel progetto: lo dice l'avviso). Alla fine: **Manda** (o «Manda 1/2», «Manda 2/2» se il resoconto non sta in un
invio), **Copia**, **Rifai**. L'ultimo resoconto di ognuna delle due prove resta sul telefono (`store/benchmark.js`, chiave
`benchmark`, fuori dai profili): «L'ultima coi modelli veri» lo riapre per mandarlo dopo.

## Le scene

| gruppo | scene | cosa c'è del gioco | cosa non c'è |
|---|---|---|---|
| `calore` | la stessa scena all'inizio e alla fine | lo scontro con 8 mostri e gli effetti | |
| `pavimento` | lo schermo che si pulisce e basta; 100 cubi semplici (Lambert, una luce, una chiamata l'uno) | il renderer del Sotterraneo (`veri/base.js`) | il gioco: è quanto costa un fotogramma da solo |
| `togli` | lo scontro con 1 mostro e gli effetti, intero e con UNA cosa tolta: l'ombra, le luci tranne il cono, tutte le luci, le particelle, le normal map, i materiali Lambert, i materiali Basic; e (un Sotterraneo ciascuna) le fette di nebbia, il passaggio finale, il pixel ratio a 0,6 | lo scontro vero | i materiali semplici non hanno la maschera della luce: tutto è illuminato |
| `discese` | 1, 3, 6, 8 mostri, gli effetti a ripetizione (un colpo ogni 0,7 s, eroe e mostri a turno) | `creaSotterraneo3d` (luci, nebbia, ombra del cono, palco, mostri ed eroe 3D, effetti 3D) su una discesa vera del motore: il cheat `sotterraneo=branco&grado=leggendario&corredo=leggendario&stanza=sala` rifatto in `veri/discese.js` | il pannello e le domande; lo scontro ne prende al più 7 (l'ottavo resta attorno) |
| `discese` | triangoli ×1, ×2, ×4, ×8; chiamate ×2, ×4 | lo scontro con 3 mostri, fermo | |
| `luci` | 1, 2, 4, 6, 12 fuochi con l'ombra del cono; 1, 6, 12 senza | lo scontro con 3 mostri, la riserva dei fuochi spenta (`fuochi:0`) e fuochi uguali a quelli di `luci.js` attorno al palco | |
| `pixel` | pixel ratio 1, 1,41, 2; senza nebbia | lo scontro con 3 mostri, un Sotterraneo per scena | |
| `sopra` | 4, 8, 16, 24 persone; 4, 8, 16 mostri | i modelli di `persona3d.js` e `mostro3d.js` e l'eroe 3D, con sole, ombra, foschia e telecamera del mondo (`mondo/indice.js`, `veduta.js`), senza tetti | il mondo (zone, case, alberi): un prato |
| `zaino` | 15 e 40 anteprime di fila | il servizio vero (`anteprime3d.js`), cache vuota, chiavi diverse | |
| `roba` | 24 lame, bastoni, scudi, vesti, gioielli, pozioni | `creaPezzo` con l'alone del leggendario (pozioni: del raro), animati; le vesti addosso a 24 eroi | |
| `fattoria` | 10, 30, 60 edifici; 4 pollai e 4 stalle; Natale con 30 edifici | `Mondo3d` su `fattoriaTipo(10)`, le opzioni della fascia, il degrado fermo, `mondo.stress` | i fogli e il dito |

Le scene del Sotterraneo usano la fascia del telefono (`store/qualita.js`) e il pixel ratio che il gioco darebbe, fermo. Le serie
si fanno fino in fondo: una serie che cresce (mostri, persone, edifici) salta il resto solo se una scena supera i 400 ms al p95,
per non piantare il telefono (provato a fermarle a 66 ms: sul Redmi si perdevano proprio 3, 6, 8 mostri, 24 persone, 30 e 60 edifici).

## Come si misura

- **Lavoro di un fotogramma**: dal primo `requestAnimationFrame` del fotogramma (chiesto prima del giro del gioco) all'ultimo
  (chiesto dopo), con la lettura di un pixel che aspetta la GPU: il JS del gioco, il disegno e la GPU, senza i 60 Hz. Mediana e p95.
  Diviso in due: **js** (fino alla lettura del pixel: il JS e l'invio dei comandi) e **gpu** (l'attesa della lettura: la scheda che
  finisce). Se la gpu tiene quasi tutto, il collo sono pixel, luci e ombre; se tiene il js, le chiamate e il codice.
- **Calore**: prima di ogni gruppo 8 s a schermo nero, poi un **riferimento** fisso (`veri/base.js`: 100 cubi lucidi, quattro luci,
  un pavimento a tutto schermo, ~3 s). La deriva (riferimento ÷ il primo) va nella testa del gruppo (`rif 31 ms x1.12`) e su ogni
  riga; la LETTURA usa i ms divisi per la deriva (le righe scaldate dicono anche `≈` il valore corretto). Sul Redmi lo scontro con 8
  mostri valeva 77 ms all'inizio e 137 alla fine: senza la correzione le serie in fondo sembravano il doppio. In testa anche la
  batteria all'inizio e alla fine (`navigator.getBattery`) e la rete; il risparmio energetico il browser non lo dice.
- **Prima apparizione**: i fotogrammi mentre la scena si prepara e i primi dieci (shader, geometrie e trame caricate, riserve di
  modelli) si tengono a parte: `primo` è il più lungo, `+Nsh` gli shader nuovi (`renderer.info.programs`), `pronto` quanto ci ha
  messo la scena (se più di 1,5 s).
- **Rodaggio**: 2-5 s scartati, finché la mediana di 10 fotogrammi non cambia più del 15% dalle 10 prima. **Misura**: 5-8 s a
  finestre di 1,5 s, finché la parte di fotogrammi lenti (oltre 33 ms) e la mediana di due finestre di fila non si fermano; al tetto
  la riga dice «instabile». Una finestra vuole almeno 15 fotogrammi e una fase almeno 30 (il telefono imitato fa un fotogramma ogni
  mezzo secondo: col tempo soltanto sarebbero dieci), con un tetto di 20 s a fase.
- Chiamate e triangoli da `renderer.info`, la memoria (geometrie, trame) nella testa del gruppo; un contesto WebGL perso (non
  buttato apposta a scena finita) si conta; gli avvisi e gli errori della console mentre gira (shader che non compilano, modelli
  che non si saldano) si riassumono in **AVVISI**. Un gruppo che non si carica o una scena che si rompe sono «non regge».

**Le leve dei colli di bottiglia** (`veri/moltiplica.js`): i triangoli ×k dividono ogni triangolo di ogni mesh in k (piatti: forma,
materiali, luci e chiamate restano); le chiamate ×k spezzano ogni mesh in k gruppi dello stesso materiale (stessi triangoli).

## Il resoconto

Testa: modello (da `userAgentData`: lo user agent ridotto di Chrome dice «K»), schermo, core, fascia; batteria e rete; GPU e fornitore; trame massime, uniform del vertice e del frammento, varying, i bit di
`highp` e `mediump` (un `mediump` a 10 bit è mezzo float; senza `highp` nei frammenti luci, normal map e nebbia sgranano), le
estensioni che il gioco usa e mancano. Poi un gruppo alla volta (`[discese] codice 50 ms, dpr 1, luci 3p 1s 0d 1h ombre 1, mem…, prog 57, rif 31 ms x1.12`)
e una riga per scena: `ok`/`~`/`XX` (p95 sotto 20, fino a 33, oltre), `ms/p95`, `(js … gpu …)`, fps, chiamate, migliaia di triangoli,
e `≈` (corretto dal calore), `primo`, `+Nsh`, `pronto` quando contano. La **LETTURA** dice il calore, il **pavimento** (schermo
vuoto e 100 cubi), il **LIMITE** di ogni serie (fin dove sta sotto 33 ms al p95, da dove supera 33 e 66; con due scene la
pendenza, ms per elemento in più, e la retta a zero: «ogni persona in più +3 ms, con zero ~31»), **TOGLIERE** (quanto si guadagna
togliendo ogni cosa allo scontro, dalla più cara), i tre colli (triangoli: c'è margine per ~N× di dettaglio o no; ms ogni 100 chiamate; ms per milione di pixel; il salto
più grande delle luci, l'ombra del cono, la nebbia) e il **COLLO DI BOTTIGLIA** (quello che a raddoppiarlo costa di più), la roba che
pesa, lo zaino, la festa, il **calore** (il riferimento alla fine diviso quello all'inizio: sopra 1,15 il telefono si è scaldato),
le prime apparizioni lente, chi pesa di più, la GPU, i contesti persi. In fondo le **NOTE** e la riga `DATI {"v":2,"k":"veri",…}`:
`r` ha `[id, ms, p95, fps, chiamate, ktriangoli, primo, shader, js, gpu, deriva]` (le prime otto come nei log di prima), lo zaino `[id, totale, fotogramma max, lavoro, attesa]`.

Un invio del modulo dei giudizi regge ~3,5k caratteri: un resoconto più lungo (quasi sempre, con 40 scene) si **spezza in più
invii** a 3400 caratteri, fra una riga e l'altra, ognuno con «(parte k/n)» in testa e la riga DATI intera nell'ultimo. Per lo
strumento basta incollare le parti in un file, una dopo l'altra. «Copia» copia tutto in una volta.

## Sul computer

```bash
npm run build
node strumenti/vecchio-telefono.mjs benchmark --veri                      # le stesse scene sul Note 7 imitato
node strumenti/vecchio-telefono.mjs benchmark --contro veri.txt           # e riga per riga contro il telefono (ms e p95)
node strumenti/vecchio-telefono.mjs benchmark --veri --solo sot-,tri-     # solo le scene che cominciano così
node strumenti/vecchio-telefono.mjs calibra --log veri.txt [--scena px-1] [--prova]   # la CPU sul `js` del log, la zavorra su una sua scena (a computer scarico)
```

Con la CPU ×5 e SwiftShader su 4 core la prova dura molto di più che sul telefono (decine di minuti): per guardare solo che giri,
`--cpu 1 --core 0 --gpu hw`.

## Cosa dice il Redmi Note 7 (22/10)

Il primo log vero (`strumenti/vecchio-telefono/log/redmi-note7-veri-22ott.txt`, fascia bassa, pixel ratio 1, 392×718; prima del
riferimento del calore e delle serie fino in fondo). Lo scontro con 8 mostri valeva 77 ms all'inizio e 137 alla fine (×1,77): le serie
in fondo (sopra, roba, fattoria) sono gonfiate dal calore.

- **Scontro**: 1 mostro con gli effetti 64 ms (p95 98); 8 mostri 77 (p95 135) a telefono fresco. Già un mostro è oltre i 33 ms.
- **Triangoli**: da 86k a 475k (×8) solo +17 ms (+23%): costano poco, ~0,04 ms ogni mille. Il dettaglio dei modelli non è il guaio.
- **Chiamate**: da 241 a 892 +24 ms, ~3,7 ms ogni 100: contano più dei triangoli.
- **Luci**: da 2 a 6 fuochi +14 ms, da 6 a 12 **+98 ms** (12 fuochi 194 ms; senza l'ombra del cono 153). Oltre la riserva di oggi (6
  fuochi più alone, lampo e cono) il telefono crolla: 256 uniform nel frammento, ogni luce è un pezzo di shader per ogni pixel.
  L'ombra del cono con 6 fuochi costa ~2,5 ms.
- **Pixel**: pixel ratio 1 → 1,41 → 2: 84 → 98 → 135 ms, ~60 ms ogni milione di pixel. La nebbia in fascia bassa ~1 ms.
- **Sopra**: persone 4 / 8 / 16 → p95 44 / 54 / 80: ~3 ms per persona e ~31 ms con zero (un pavimento alto: prato, sole con l'ombra
  a 2048, l'eroe leggendario). Mostri 4 / 8 → 59 / 93: ~8,5 ms per mostro.
- **Roba**: le vesti 109 ms (24 eroi, 1486 chiamate), le pozioni 70 (395 chiamate), le lame 39.
- **Zaino**: 15 anteprime in 1,9 s con un fotogramma fermo di **400 ms**; 40 in 2,8 s.
- **Fattoria**: 10 edifici 54 ms, Natale con 30 edifici 52, le bestie 57 (gonfiate dal calore).
- **Prima apparizione**: 2-6 s per scena, 40-57 shader nuovi ognuna, 548 in tutto; il telefono non ha `KHR_parallel_shader_compile`.

**Precompilare gli shader.** Senza `KHR_parallel_shader_compile` ogni programma nuovo si compila al primo disegno e ferma il
fotogramma (il «primo» delle righe). La strada: `await renderer.compileAsync(scena, camera)` a una schermata di caricamento (lo
scendere di piano, la porta di un villaggio), con la scena già com'è nel gioco: lo stesso numero di luci (luci.js lo tiene fisso
apposta: una luce in più o in meno cambia la variante di ogni materiale), l'ombra accesa, e un esemplare di ogni modello che
arriverà (le specie del piano, l'eroe vestito, gli effetti 3D: i loro materiali restano vivi fra un colpo e l'altro) appeso fuori
vista durante la compilazione. Senza l'estensione `compileAsync` aspetta lo stesso programma per programma, ma il fermo cade sulla
schermata di caricamento e non nello scontro. Gli shader dell'ombra (la profondità) si compilano al primo disegno con l'ombra:
un fotogramma disegnato dietro la schermata li prende.

## L'imitazione contro il Redmi

`benchmark --contro redmi-note7-veri-22ott.txt` rifà le stesse scene sul Note 7 imitato. **I ms del computer non valgono** (il
computer è condiviso con altri processi e agenti: fra due giri ballano del 20-50%), quindi non si tara `calibra` su questi giri e
dal confronto si leggono la struttura e gli ordini di grandezza. La struttura torna: le stesse chiamate, gli stessi triangoli e gli
stessi shader nuovi scena per scena (per esempio lo scontro dei colli 241 chiamate e 86k triangoli, le vesti 1486 chiamate, le
persone 104 / 118 / 165, gli shader nuovi della prima scena di un Sotterraneo 34-57), quindi le scene sono le stesse. Chiamate e
triangoli di una scena cambiano col fotogramma (chi entra ed esce dall'inquadratura: 226 o 241, 62k o 86k): dal 22/10 la riga dice
il più alto di un campione ogni 15 fotogrammi. Come ordine di grandezza, SwiftShader (`--gpu sw`) va più piano del Redmi sui pixel
(pixel ratio 2: ~3-4 volte) e più svelto con molte luci e nelle anteprime: per pixel, luci e zaino conta solo il telefono.

## Il codice

`grafica/benchmark/veri.js` (le scene, il giro dei fotogrammi, il calore, la GPU, gli avvisi), `veri/discese.js`, `sopra.js`,
`zaino.js`, `roba.js`, `fattoria.js`, `base.js` (un gruppo ciascuno, caricati con `import()` quando tocca a loro), `veri/moltiplica.js`
(le leve: triangoli, chiamate, materiali semplici, normal map, particelle), `veri/tela.js`, `veri/leggendario.js` (il corredo del
cheat); il log in `grafica/benchmark/log-veri.js` (`componiVeri`, `letturaVeri`, `limite`, `corretta`, `spezza`, `conNote`). Nel sito
spezzato `vite.config.js` tiene `grafica/benchmark/` fuori dal file `comune`: si carica a richiesta, e i modelli veri tirano dentro i giochi.

Nei test: `[data-azione="benchmark-veri"]`, `[data-benchmark-palco]` (dove girano le scene), `[data-azione="benchmark-interrompi"]`,
`[data-benchmark-note]`, `[data-azione="benchmark-manda"][data-parte]`, `[data-azione="benchmark-ultima"][data-tipo]`;
`window.__benchmarkVeri` (i dati), `window.__benchmarkSolo` (gli inizi degli id), `window.__benchmarkCorto` (scene di pochi decimi,
senza pausa), `window.__benchmarkRaffredda` (i ms di pausa fra i gruppi: lo strumento la toglie quando tara).
`unita/benchmark-veri` (il log, il limite, gli invii, le leve), `integrazione/benchmark-veri` (una scena per gruppo, a schermo).

## Mandare il resoconto al computer

`node strumenti/ricevi-log.mjs [--porta 8787] [--dist dist-sito]` serve il sito (dopo `npm run build:sito`) su `0.0.0.0` e stampa
gli indirizzi da aprire sul telefono (IP di LAN; il nome e l'IP Tailscale se `tailscale status --json` c'è). In http su un IP il
browser non registra il service worker (non è un contesto sicuro): la PWA non disturba. `GET /ricevi-log` risponde `{ok:true,v:1}`;
`POST /ricevi-log` prende `{ testo, dati?, agente?, note?, quando? }` (JSON, max 200 KB) e scrive
`strumenti/vecchio-telefono/log/ricevuti/AAAA-MM-GGThhmm-<modello>.txt` (non versionata) col `testo` (più `DATI …` se `dati` non è già
dentro), poi risponde `{ok:true,file}` e la console stampa «ricevuto: <file> (<n> byte)». Il file va a `calibra --log` e a
`benchmark --contro`. Si accettano solo Host e Origin di casa (localhost, reti private, tailnet `100.64/10` e `*.ts.net`, `.local`);
il CORS si apre solo per quelle origini.

Lato app: `src/grafica/benchmark/invio-diretto.js` esporta `sondaRicevitore(origin)` (GET con timeout 1,5 s, `true`/`false`, mai
errori) e `mandaAlRicevitore(payload, origin)` (`{ok,file}` o `{ok:false,errore}`). Per integrarlo in `Benchmark.vue`: all'apertura
del resoconto finale chiamare `sondaRicevitore()`; se `true` mostrare accanto a «Manda» il bottone **Manda al computer**, che chiama
`mandaAlRicevitore({ testo, agente: navigator.userAgent, note, quando: Date.now() })` con il resoconto intero (non spezzato in
parti) e mostra «Mandato» o l'errore. Fuori dal ricevitore (sito vero, file unico) la sonda è falsa e il bottone non c'è.
