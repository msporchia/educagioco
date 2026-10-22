# La misura coi modelli veri

La misura a scene ([vecchio-telefono.md](vecchio-telefono.md#la-misura-a-scene-il-benchmark)) dice quanto costa ogni cosa da
sola, su forme finte. Questa fa girare **il codice vero dei giochi** sul telefono vero, per sapere fin dove regge senza farci
giocare il bambino: quanti mostri nello scontro, quante persone sopra, quanti edifici nella fattoria, e che cosa rallenta
(triangoli, chiamate, pixel, luci). Il computer imitato non lo dice: la GPU del telefono non si imita.

## Sul telefono

Zona dei grandi (codice) → **Impostazioni** → tendina **Avanzate** → **Misura questo telefono** → **Avvia coi modelli veri**.
Dura qualche minuto (cinque al più; sul Redmi Note 7 meno, perché le serie oltre il limite si saltano): la barra in fondo dice a
che scena si è, **Interrompi** la ferma e tiene il resoconto di quello che c'è. Le scene si vedono mentre girano: se una luce, un
colore o la nebbia sembrano sbagliati, alla fine c'è un campo **Note** che finisce nel resoconto. Lo schermo non deve spegnersi
(niente wake lock nel progetto: lo dice l'avviso). Alla fine: **Manda** (o «Manda 1/2», «Manda 2/2» se il resoconto non sta in un
invio), **Copia**, **Rifai**. L'ultimo resoconto di ognuna delle due prove resta sul telefono (`store/benchmark.js`, chiave
`benchmark`, fuori dai profili): «L'ultima coi modelli veri» lo riapre per mandarlo dopo.

## Le scene

| gruppo | scene | cosa c'è del gioco | cosa non c'è |
|---|---|---|---|
| `calore` | la stessa scena all'inizio e alla fine | lo scontro con 8 mostri e gli effetti | |
| `discese` | 1, 3, 6, 8 mostri, gli effetti a ripetizione (un colpo ogni 0,7 s, eroe e mostri a turno) | `creaSotterraneo3d` (luci, nebbia, ombra del cono, palco, mostri ed eroe 3D, effetti 3D) su una discesa vera del motore: il cheat `sotterraneo=branco&grado=leggendario&corredo=leggendario&stanza=sala` rifatto in `veri/discese.js` | il pannello e le domande; lo scontro ne prende al più 7 (l'ottavo resta attorno) |
| `discese` | triangoli ×1, ×2, ×4, ×8; chiamate ×2, ×4 | lo scontro con 3 mostri, fermo | |
| `luci` | 1, 2, 4, 6, 12 fuochi con l'ombra del cono; 1, 6, 12 senza | lo scontro con 3 mostri, la riserva dei fuochi spenta (`fuochi:0`) e fuochi uguali a quelli di `luci.js` attorno al palco | |
| `pixel` | pixel ratio 1, 1,41, 2; senza nebbia | lo scontro con 3 mostri, un Sotterraneo per scena | |
| `sopra` | 4, 8, 16, 24 persone; 4, 8, 16 mostri | i modelli di `persona3d.js` e `mostro3d.js` e l'eroe 3D, con sole, ombra, foschia e telecamera del mondo (`mondo/indice.js`, `veduta.js`), senza tetti | il mondo (zone, case, alberi): un prato |
| `zaino` | 15 e 40 anteprime di fila | il servizio vero (`anteprime3d.js`), cache vuota, chiavi diverse | |
| `roba` | 24 lame, bastoni, scudi, vesti, gioielli, pozioni | `creaPezzo` con l'alone del leggendario (pozioni: del raro), animati; le vesti addosso a 24 eroi | |
| `fattoria` | 10, 30, 60 edifici; 4 pollai e 4 stalle; Natale con 30 edifici | `Mondo3d` su `fattoriaTipo(10)`, le opzioni della fascia, il degrado fermo, `mondo.stress` | i fogli e il dito |

Le scene del Sotterraneo usano la fascia del telefono (`store/qualita.js`) e il pixel ratio che il gioco darebbe, fermo. Una serie
che cresce (mostri, persone, edifici) si ferma alla prima scena oltre 66 ms al p95 (le altre sono «saltata»); le leve dei colli e
la roba si fanno tutte, perché si confrontano fra loro.

## Come si misura

- **Lavoro di un fotogramma**: dal primo `requestAnimationFrame` del fotogramma (chiesto prima del giro del gioco) all'ultimo
  (chiesto dopo), con la lettura di un pixel che aspetta la GPU: il JS del gioco, il disegno e la GPU, senza i 60 Hz. Mediana e p95.
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

Testa: modello, schermo, core, fascia; GPU e fornitore; trame massime, uniform del vertice e del frammento, varying, i bit di
`highp` e `mediump` (un `mediump` a 10 bit è mezzo float; senza `highp` nei frammenti luci, normal map e nebbia sgranano), le
estensioni che il gioco usa e mancano. Poi un gruppo alla volta (`[discese] pronto 2.3 s, dpr 1, luci 3p 1s 0d 1h ombre 1, mem…`)
e una riga per scena: `ok`/`~`/`XX` (p95 sotto 20, fino a 33, oltre), `ms/p95`, fps, chiamate, migliaia di triangoli, e
`primo`, `+Nsh`, `pronto` quando contano. La **LETTURA** dice il **LIMITE** di ogni serie (la prima scena oltre 33 ms al p95: «LIMITE
3 mostri»), i tre colli (triangoli: c'è margine per ~N× di dettaglio o no; ms ogni 100 chiamate; ms per milione di pixel; il salto
più grande delle luci, l'ombra del cono, la nebbia) e il **COLLO DI BOTTIGLIA** (quello che a raddoppiarlo costa di più), la roba che
pesa, lo zaino, la festa, il **calore** (il riferimento alla fine diviso quello all'inizio: sopra 1,15 il telefono si è scaldato),
le prime apparizioni lente, chi pesa di più, la GPU, i contesti persi. In fondo le **NOTE** e la riga `DATI {"v":2,"k":"veri",…}`:
`r` ha `[id, ms, p95, fps, chiamate, ktriangoli, primo, shader]`, lo zaino `[id, totale, fotogramma max, lavoro, attesa]`.

Un invio del modulo dei giudizi regge ~3,5k caratteri: un resoconto più lungo (quasi sempre, con 40 scene) si **spezza in più
invii** a 3400 caratteri, fra una riga e l'altra, ognuno con «(parte k/n)» in testa e la riga DATI intera nell'ultimo. Per lo
strumento basta incollare le parti in un file, una dopo l'altra. «Copia» copia tutto in una volta.

## Sul computer

```bash
npm run build
node strumenti/vecchio-telefono.mjs benchmark --veri                      # le stesse scene sul Note 7 imitato
node strumenti/vecchio-telefono.mjs benchmark --contro veri.txt           # e riga per riga contro il telefono (ms e p95)
node strumenti/vecchio-telefono.mjs benchmark --veri --solo sot-,tri-     # solo le scene che cominciano così
node strumenti/vecchio-telefono.mjs calibra --log veri.txt                # tara la CPU sul `js` del log (la GPU vuole il log a scene)
```

Con la CPU ×5 e SwiftShader su 4 core la prova dura molto di più che sul telefono (decine di minuti): per guardare solo che giri,
`--cpu 1 --core 0 --gpu hw`.

**Il primo giro sul Note 7 imitato** (22/10, `--qualita bassa`, SwiftShader su 4 core e CPU ×5, computer carico: i ms sono
pessimisti e ballano del 20-30% fra due giri; contano i rapporti). Sette minuti. Tutte le serie che crescono sono oltre già alla
prima scena (lo scontro con 1 mostro 140 ms, 4 persone 46, la fattoria con 10 edifici 132): l'imitazione non dice il limite, lo
dirà il telefono. I colli, sulla stessa scena dello scontro (3 mostri, ~115 ms): **i pixel** (pixel ratio 1 → 1,41: +46 ms; 2: ×4),
poi le luci (6 → 12 fuochi +16 ms, l'ombra del cono +7), la nebbia +25; i triangoli quasi niente a ×2 (+2 ms) e +55% a ×8 (62k →
388k); le chiamate niente (226 → 859, stessi ms). La roba: le vesti (24 eroi, 1486 chiamate) le più care, le pozioni le più
leggere. Lo zaino: 40 anteprime in 1,7 s, un fotogramma fermo fino a 233 ms. La prima apparizione di una scena del Sotterraneo è
di 3-6 s (50 shader). Nessun contesto perso; 49 avvisi di three (`toNonIndexed()` su geometrie già senza indice: dalle anteprime e
dalla roba).

## Il codice

`grafica/benchmark/veri.js` (le scene, il giro dei fotogrammi, la GPU, gli avvisi), `veri/discese.js`, `sopra.js`, `zaino.js`,
`roba.js`, `fattoria.js` (un gruppo ciascuno, caricati con `import()` quando tocca a loro), `veri/moltiplica.js` (le leve),
`veri/tela.js`, `veri/leggendario.js` (il corredo del cheat); il log in `grafica/benchmark/log.js` (`componiVeri`, `letturaVeri`,
`limite`, `spezza`, `conNote`). Nel sito spezzato `vite.config.js` tiene `grafica/benchmark/veri*` fuori dal file `comune`: tira
dentro i giochi, e starebbe nella base.

Nei test: `[data-azione="benchmark-veri"]`, `[data-benchmark-palco]` (dove girano le scene), `[data-azione="benchmark-interrompi"]`,
`[data-benchmark-note]`, `[data-azione="benchmark-manda"][data-parte]`, `[data-azione="benchmark-ultima"][data-tipo]`;
`window.__benchmarkVeri` (i dati), `window.__benchmarkSolo` (gli inizi degli id), `window.__benchmarkCorto` (scene di pochi decimi).
`unita/benchmark-veri` (il log, il limite, gli invii, le leve), `integrazione/benchmark-veri` (una scena per gruppo, a schermo).
