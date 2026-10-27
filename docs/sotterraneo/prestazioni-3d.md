# Il Sotterraneo 3D sul telefono lento

Il bersaglio è il Redmi Note 7 della bambina (fascia bassa, la CPU 4-6 volte più lenta di un PC). Qui le quattro scene più pesanti
misurate in Chrome senza schermo con la CPU rallentata (`Emulation.setCPUThrottlingRate`) e la GPU finta (SwiftShader: la CPU fa la
GPU, quindi **fps e «compiti» dicono poco**; contano il JS a fotogramma, le chiamate, i triangoli, i tempi di caricamento). Il
rumore fra un giro e l'altro è grande (un computer carico raddoppia i tempi): si confrontano solo due file misurati di fila
(`--contro`).

## Le quattro scene

Fascia bassa (`&qualita=bassa`, quella del Note 7), pixel ratio 1, 390×844. «JS» sono i ms di script per fotogramma,
«pronto» i ms dal cambio d'indirizzo alla scena pronta (sulla CPU rallentata). Misurato il 22/10/2026, prima → dopo.

| scena | CPU | JS a fot. | pronto | chiamate | triangoli | geometrie / trame |
|---|---|---|---|---|---|---|
| scontro: 3 scheletri leggendari (guerriero, arciere, mago), l'eroe con 7 caselle leggendarie | ×1 | 2,1 → 1,8 | 2,3 → 2,4 s | 423 → 250 | 93k → 69k* | 351 → 241 / 17 |
| | ×4 | 8,7 → 7,2 | 3,9 → 4,1 s | | | |
| | ×6 | 13,2 → 10,4 | 4,9 → 5,1 s | 408 → 265 | | |
| il villaggio di sopra, sette persone | ×1 | 2,0 → 1,6 | 4,0 → 3,3 s | 161 → 144 | 304k | 131 → 125 / 52 |
| | ×4 | 7,2 → 7,5 | 7,4 → 5,5 s | | | |
| | ×6 | 10,3 → 9,5 | 9,7 → 6,8 s | | | |
| il mondo con due branchi vicini (5 mostri in vista) | ×1 | 3,4 → 2,9 | 4,0 → 3,2 s | 353 → 326 | 415k | 360 → 343 / 45 |
| | ×4 | 12,7 → 12,1 | 7,4 → 5,5 s | | | |
| | ×6 | 17,6 → 17,6 | 9,7 → 7,0 s | | | |
| lo zaino aperto: 15 anteprime 3D | ×1 | 2,3 → 2,2 | 0,53 → 0,57 s | | | |
| | ×4 | 7,2 → 6,7 | 0,91 → 1,1 s | | | |
| | ×6 | 10,3 → 9,8 | 1,24 → 1,21 s | | | |

\* i triangoli dello scontro cambiano col fotogramma (69k o 93k: chi esce dall'inquadratura), non con la saldatura. Le anteprime:
«pronto» è dal primo chiedere all'ultima pronta; di quel tempo ~250 ms sono la copia dalla tela WebGL (`drawImage`, che aspetta la
GPU: non cambia con la CPU), il resto modelli e disegno. La caricata di una zona del mondo: ~45 ms a ×1, ~290 a ×6.

## I tre costi tolti

1. **L'eroe 3D non era saldato**: vestito di tutto ~130 mesh, una chiamata l'una. Ora si salda come i mostri (`eroe3d.js`,
   `saldaEroe`): le pose stesse dicono chi si muove; cambiando roba si rifà da capo. ~130 → ~85.
2. **I perni fermi separavano le saldature dei mostri**: una mesh si saldava solo coi fratelli dello stesso perno, e uno scheletro
   ha un perno per osso. Ora si salda col primo antenato che si muove (`salda3d.js`, l'«ancora»): uno scheletro ~80 → ~45, tutti
   i modelli 4829 → 4286 mesh. Il JS a fotogramma dello scontro è quasi tutto three che gira oggetto per oggetto (`setProgram`,
   uniformi, `renderBufferDirect`): le chiamate sono la leva.
3. **I ciottoli del mondo di sopra** (`mondo/trame.js`): la trama di Voronoi guardava 900 distanze per pixel; ora 25, stesso
   disegno. Era ~2,9 s su ~16 dell'apertura del mondo con la CPU ×6 (−30% sul «pronto» del mondo).

Nessuno cambia l'aspetto: i test (`unita/sotterraneo-mostri-3d`, `unita/sotterraneo-eroe-3d-saldato`, `unita/sotterraneo-mondo-3d`)
confrontano i vertici del saldato con un gemello non saldato in venti pose, e i ciottoli col conto di prima.

- provato a confrontare le scatole (`Box3`) invece dei vertici: non vede niente, i pezzi si muovono coi perni, non da soli.
- l'attacco va provato sopra l'idle in movimento, non solo da fermo: la mano del goblin rosso si muove solo se attacca durante un gesto.

## Meno chiamate: la pelle (23/10)

Sul Note 7 il JS di un fotogramma costa ~0,18 ms per chiamata di disegno: per stare nei 25 ms lo scontro deve fare meno di ~130
chiamate. Dopo la saldatura (sopra) restavano i pezzi che si muovono: ognuno una chiamata. Ora (`salda3d.js`, `pelle`, chiamata da
`saldaTutto` in `mostro3d.js` ed `eroe3d.js`) quello che resta diventa **una `SkinnedMesh` per materiale**, come le persone
([persone-3d.md](persone-3d.md)): le ossa sono le mesh stesse, che restano dove sono e si muovono come prima ma non si disegnano più
(`layers` vuoti, `osso(o)`). I materiali Standard che differiscono solo in colore, ruvidezza, metallo ed emissivo si fondono in uno
(«largo»: quei valori stanno nei vertici, `aMat` e `aEmis`, e lo shader li legge al posto delle uniform); gli altri tipi solo nel
colore. Il lampo, la tinta degli stati e il bagliore delle mosse passano dallo shader del fuso (`copiaMateriale`, `tingiFusa`,
`lampoFuso`, `materiale.lampo`). Un programma di shader in più per tipo (`pelle-larga`, `pelle-colore`), lo stesso per tutti i modelli.

Restano a sé: chi si accende e si spegne, cambia forma, materiale o genitore durante le prove (`studia`: le fiamme del soffio, le
melme che rifanno le normali); un osso schiacciato a zero nella posa di adesso (le foglie che cadono); i trasparenti non additivi
(l'ordine fra i pezzi conta); i materiali che si animano (`vivi`: gli occhi che pulsano), che si uniscono solo fra pezzi dello stesso
materiale; quelli con lo shader riscritto o con le trame.

Chiamate di `renderer.info.render.calls` (`window.__sotterraneo3d.grafica().chiamate`, SwiftShader, fascia bassa, `&dpr=1`;
`&spegni=pelle` è il «prima», con la saldatura di sempre):

| scena | prima | dopo |
|---|---|---|
| scontro: 3 scheletri leggendari (guerriero, arciere, mago), cavaliere con 7 caselle leggendarie | 265 | **76** |
| scontro: il drago d'oro e il mago leggendario | 203 | **71** |
| mondo di sopra, `folla=8&branco3d=8` (6 mostri 3D in vista nella bassa) | 391 | **144** |

Per modello (mesh disegnate, in Node: `unita/sotterraneo-eroe-3d-saldato`, `budget-3d --elenco`):

| modello | senza saldare | saldato | con la pelle |
|---|---|---|---|
| eroe cavaliere vestito di leggendari | 134 | 82 | **13** |
| eroe mago / elfa / nano | 79 / 134 / 141 | 56 / 76 / 68 | **20 / 11 / 10** |
| drago (verde, azzurro, oro, rosso, di lava) | 140 | 105 | **~20** |
| gorgo / sibilla / polpo / negromante | 116 / 100 / 72 / 87 | 116 / 99 / 72 / 87 | **≤13 / ≤8 / ≤7 / ≤12** |
| scheletro arciere | 51 | 45 | **≤12** |
| tutti gli 87 modelli dei mostri | 8724 | ~4300 | **642** |

L'aspetto non cambia: i test confrontano i vertici col gemello non saldato in venti pose, e (anche per polpo e gorgo, che animandosi
pescano a caso) che ogni vertice della pelle stia dove il suo osso porterebbe il pezzo, coi colori, la ruvidezza, il metallo e
l'emissivo del materiale di adesso. Le tavole a occhio: `tmp/scatti/b-pelle*-vicino.png`, `drago-confronto.png`,
`mondo-confronto.png` (`node strumenti/scatta-app.mjs '<scena>&spegni=pelle'` contro la stessa senza).

- Le normali dei pezzi che si deformano senza scala uniforme (il respiro che allunga un pezzo in y) le ruota la pelle con la matrice
  dell'osso, non con la sua inversa trasposta: per scale di pochi punti la luce non cambia a vedere.
- Nell'istante in cui un mostro lampeggia (colpito) durante una mossa che lo fa brillare, il fuso largo mostra il lampo e non il
  bagliore della mossa sotto.
- Svanendo (il portale) i pezzi di un fuso diventano trasparenti insieme, in una mesh: l'ordine fra loro è quello del disegno.

**Cosa resta oltre il tetto** (`ECCEZIONI` di `test/unita/budget-3d.test.mjs`): gli spiriti di fuoco e azzurro (64: fiamme che si
accendono e si spengono, ognuna col suo materiale vivo), il golem di magma (44), le melme (13 materiali fisici, le normali rifatte a
ogni fotogramma). Lì la pelle non entra: va cambiato il modello nel prototipo (fiamme che si scalano invece di spegnersi, un materiale
vivo solo per tutte), poi `npm run promuovi3d`. Da fare anche: gli aloni della roba (un Points per pezzo, 2-3 sull'eroe) in uno
solo, e la scena (muri, pavimento, colonne, arredo, particelle) contata per famiglia.

## Per rifarla

```bash
npm run build && cp dist/index.html tmp/prima.html   # il file di prima; poi la modifica, di nuovo npm run build
S='sotterraneo3d=1&seme=11&stanza=sala&sotterraneo=branco&mostri=3&tipo=scheletro&variante=guerriero,arciere,mago&grado=leggendario&corredo=leggendario&eroe=cavaliere&qualita=bassa&dpr=1'
node strumenti/profila-app.mjs "$S" --contro tmp/prima.html --lento 1,4,6 --secondi 8 --funzioni 0 \
  --pronto 'window.__sotterraneo3d && window.__sotterraneo3d.grafica().mostri3d >= 3' --stampa 'window.__sotterraneo3d.grafica()'
# il villaggio (per i due branchi --prima porta l'eroe fra i due branchi più vicini: il punto medio dei loro centri)
node strumenti/profila-app.mjs 'sotterraneo3d=mondo&eroe=cavaliere&qualita=bassa&dpr=1' --contro tmp/prima.html --lento 1,4,6 --secondi 8 --funzioni 0 \
  --pronto 'window.__sotterraneo3d && window.__sotterraneo3d.pronto' --prima "window.__mondo3d.vai('personaggio:villaggio:capitano')" \
  --stabile 'window.__sotterraneo3d.grafica().pezzi.join() + window.__sotterraneo3d.grafica().zone.join()' --stampa 'window.__sotterraneo3d.grafica()'
# lo zaino
node strumenti/profila-app.mjs 'sotterraneo3d=1&seme=11&eroe=cavaliere&sotterraneo=roba&qualita=bassa&dpr=1' --contro tmp/prima.html --lento 1,4,6 --secondi 8 --funzioni 0 \
  --pronto 'window.__sotterraneo3d && window.__sotterraneo3d.grafica().chiamate > 0' --esegui "document.querySelector('[data-azione=\"zaino\"]').click()" \
  --stampa 'window.__anteprime3d.stato()'
```

Per sapere chi fa le chiamate: `window.__sotterraneo3d.scena` (il Sotterraneo e il mondo di sopra), da contare con `--stampa`.
Senza `--funzioni 0` e col file costruito in chiaro (`npx vite build --minify false --outDir tmp/dist-chiaro`) si vedono le funzioni.

## Il ritaglio di pavimento e pareti (27/10)

La scala della verifica del Note 7 (27/10, [../core/vecchio-telefono-veri.md](../core/vecchio-telefono-veri.md#la-scala)) ha detto che
il fondo pesa più di tutto il resto: pavimento e pareti con una luce +23 ms (5 chiamate), luci, nebbia e rilievo insieme ~0. Sono una
mesh ciascuno per tutto il piano (~1450 celle), e con la luce per vertice ogni cella del pavimento è 3×3 quadrati e ogni triangolo di
parete diviso in quattro: 73k triangoli, 60k vertici che fanno fino a 12 luci e la nebbia, quasi tutti fuori dall'inquadratura (al più
~15×15 celle). Il JS in più di quel gradino (+7,5 ms sul telefono) non è del gioco: a ×4 sul computer il gioco aggiunge 1 ms, il resto è
l'attesa della GPU.

`scena3d/ritaglio.js`: i triangoli di pavimento e pareti stanno a blocchi di 4×4 celle e prima di ogni disegno l'indice tiene solo i
blocchi che la telecamera tocca (con una cella di margine), riscritto solo quando cambiano; i gruppi dei quattro materiali delle pareti
restano, quindi le chiamate non crescono. Nello scontro di `S` qui sopra: da 128k a 79k triangoli, 69 blocchi su 248. A schermo non
cambia niente (`&spegni=ritaglio` lo spegne, `grafica().ritaglio`: blocchi disegnati e blocchi pieni). Da confermare sul telefono:
il gradino 1 della scala.

## Cosa resta da guardare sul telefono vero

- **La GPU**: qui non si misura (SwiftShader fa 4-6 fps nel mondo per i pixel, non per il JS). Col contatore fps: scontro fermo, tre
  attacchi, dieci secondi nel villaggio e fra due branchi ([../core/vecchio-telefono.md](../core/vecchio-telefono.md)).
- **Gli shader alla prima volta**: sotto, «Shader e prima apparizione».
- **Le trame generate del sotterraneo** (pavimento, pareti, legno, normali dell'atlante): ~0,8 s a ×6 a ogni scenario nuovo.
- **Il mondo con due branchi**: 17,6 ms di JS a fotogramma a ×6, il più alto; ci pesano l'aggiornamento delle matrici e la melma che
  ricalcola le normali a ogni fotogramma (~15% del JS quando c'è), oltre ai 415k triangoli.
- **La memoria**: le perdite (renderer chiusi che restavano vivi, riserve della discesa) e il banco che le conta stanno in
  [prestazioni-3d-perdite.md](prestazioni-3d-perdite.md), con cosa guardare nella scheda Memory di `chrome://inspect`.
- **La copia delle anteprime** (~16 ms l'una qui, ferma qualunque sia la CPU): sul telefono è un'attesa della GPU, da vedere nella
  scheda Performance di `chrome://inspect` aprendo lo zaino.

## Shader e prima apparizione

Sul Redmi Note 7 (log del 22/10, `strumenti/vecchio-telefono/log/redmi-note7-veri-22ott.txt`) la prima apparizione di una scena del
Sotterraneo 3D ferma il fotogramma **2-6 s**, con 40-57 programmi di shader nuovi (548 in tutta la prova); il telefono non ha
`KHR_parallel_shader_compile`, quindi ogni programma si compila al suo primo disegno, ~140 ms l'uno, e lo zaino con 15 anteprime ha un
fotogramma fermo di **400 ms**. three fa un programma per ogni combinazione di tipo di materiale, luci, ombra, nebbia, colori ai
vertici, trame, trasparenza, facce, istanze e codice aggiunto (`customProgramCacheKey`). Le leve, in quest'ordine:

1. **Meno varianti.** Due materiali col codice uguale devono avere la stessa chiave. La maschera (`maschera.js`) metteva nella chiave il
   nome del pezzo, e ogni pezzo d'arredo, la staffa, i relitti, le botti avevano un programma loro: ora il nome entra solo con un
   `poi` (codice che da fuori non si legge). Il mondo di sopra (`mondo/vesti.js`) metteva il nome del materiale e quanto si piega: ora
   un `codice` solo per chi riscrive lo shader (il terreno, la stoffa), e vento e rigido sono uniform. Le luci erano già a numero
   fisso (`luci.js`), la nebbia e l'ombra uguali per tutta la discesa.
2. **La coda degli shader** (`coda-shader.js`, usata da `indice.js`): al più **un programma nuovo per fotogramma** e un tetto di
   ~12 ms di JS, con un turno comune fra discese, mondo di sopra e anteprime (la GPU del telefono compila in fila per tutti). Il primo
   riscaldamento (un secondo dopo il primo disegno, «la scena intera» come primo pezzo) faceva nascere decine di programmi in un
   fotogramma: sul Note 7 (verifica del 23/10) l'entrata in un piano aveva un fotogramma di **5644 ms** contro 3230 senza
   riscaldamento. Ora:
   - **l'entrata a passi**: il piano si costruisce un pezzo per fotogramma (`piano.js`, `costruisciPianoAPassi`; le trame
     `pavimentoAPassi`/`muroAPassi` in `trame.js`) e poi ogni oggetto che il primo disegno vedrebbe si compila da solo, con il suo
     disegno di prova in un pixel (`disegno-prova.js`) per i driver che compilano al disegno; intanto non si disegna e resta il quadro di
     prima (al più `ENTRATA_MAX`, 12 s);
   - **il resto dopo il primo disegno**: gli effetti previsti (`effettiPrevisti`: le abilità imparate, l'arma in mano, le mosse e i
     colpi dei modelli), le cose ancora spente (anelli, colonne, portali), un'istanza in serbo di ogni modello di mostro del piano
     (`mostro3d.js`, `prepara`, un modello nuovo per fotogramma); esplorando un fotogramma sì e uno no, mai mentre si racconta un colpo;
   - **la discesa scaldata prima di scendere** (`Gioco.vue`, `scaldaDiscesa`, `anticipo()` in `indice.js`): aperto il fumetto di un
     ingresso, una tela non ancora nella pagina costruisce il primo piano e compila tutto quello che potrà chiedere; scendendo, il piano
     vero (stesso dungeon, stesso seme) trova i programmi pronti e l'entrata dura uno o due fotogrammi. Cambiando piano i programmi
     del vecchio restano (`tieniProgrammi`): il piano nuovo li riusa;
   - col passaggio finale si compila nella sua texture (`post.compila`, `post.compilaQuadro`): fuori sarebbero altri programmi.
   Dove c'è `KHR_parallel_shader_compile` (non sul Note 7) il piano si chiede tutto subito e si disegna quando è pronto (al più 1 s).
3. **Le anteprime a fette** ([anteprime-3d.md](anteprime-3d.md)): il renderer, il modello con `compile`, il disegno, la copia con
   `createImageBitmap`, ognuno in un compito suo, e i programmi nuovi nel turno comune.

| programmi (`renderer.info.programs`, fascia bassa) | prima | dopo |
|---|---|---|
| scontro dei tre scheletri leggendari, scena pronta | 34 | 28 |
| … dopo il riscaldamento (la scena, i tre modelli, gli effetti previsti) | — | 52-56 |
| … nuovi durante gli attacchi (otto abilità di prova e i colpi dei mostri, `prova()`) | +11 | +3 (un'abilità che l'eroe non ha) |
| … `linkProgram` al primo, secondo, terzo attacco giocato (test) | una decina | 0, 1, 1 |
| il villaggio di sopra | 45 | 37 |
| … lo scontro sul prato, compilato prima | — | +4 un secondo dopo l'arrivo |
| zaino, 15 anteprime | 8 | 8 |

Nel simulatore (SwiftShader, CPU ×5, il computer carico: i ms valgono come ordine di grandezza) lo zaino con 15 anteprime: fotogramma
più lungo 267-383 → 117-217 ms, la copia sul filo 299 → 5 ms, il tutto uguale (~1,5-2 s). L'avviso di three `toNonIndexed(): already
non-indexed` (49 nel log del telefono) veniva dal campo sfumato degli scudi (`poc/roba-3d/scudi.js`): ora zero.

- provato a scaldare tutti gli effetti: 70 programmi invece di 52, i più mai usati (a ~140 ms l'uno, secondi di GPU a ogni discesa).
- il riscaldamento parte dopo il primo disegno, non prima: la GPU fa le cose in fila, e il primo disegno aspetterebbe anche gli
  shader dei mostri e degli effetti.

**Da confermare sul Note 7** (la verifica corta, riga `INGRESSO`: il fotogramma più lungo deve scendere da 5644 ms a qualche centinaio): nelle `discese` il «+Nsh» del primo fotogramma
dovrebbe scendere (le varianti) e i colpi seguenti non aggiungere shader; il «primo» della prima scena resta alto (i programmi del
piano servono subito), quello delle scene dopo deve calare; lo `zaino` deve stare sotto i 400 ms di fotogramma fermo (atteso
~150-250); `luci` e `calore` cambiano poco (ogni scena di `luci` cambia il numero di luci, e quindi ricompila tutto: è la prova, non il
gioco). Giocando: il primo attacco della prima discesa non deve più fermarsi, e il primo secondo di un piano nuovo può scattare un
poco (il riscaldamento).

Per contare: `window.__sotterraneo3d.programmi()` (le discese e il mondo) e `window.__anteprime3d.programmi()` dicono ogni programma
col tipo, i materiali che lo usano (le scelte che fanno variante, `scena3d/programmi.js`) e dove la chiave differisce dal primo dello
stesso tipo; `grafica().programmi` quanti, `grafica().daScaldare` quanti pezzi restano del riscaldamento (`scaldato` nel mondo),
`__anteprime3d.stato()` `programmi`, `msCompila` e `fettaMax`. `&spegni=riscaldamento` spegne il riscaldamento (discese e mondo): quanto toglie
sul telefono lo dice la misura coi modelli veri, «L'ingresso» ([../core/vecchio-telefono-veri.md](../core/vecchio-telefono-veri.md)).

```bash
S='sotterraneo3d=1&seme=11&stanza=sala&sotterraneo=branco&mostri=3&tipo=scheletro&variante=guerriero,arciere,mago&grado=leggendario&corredo=leggendario&eroe=cavaliere&qualita=bassa&dpr=1'
node strumenti/profila-app.mjs "$S" --secondi 3 --funzioni 0 --pronto 'window.__sotterraneo3d && window.__sotterraneo3d.grafica().mostri3d >= 3' \
  --stampa 'window.__sotterraneo3d.programmi()'
```

Nei test: `integrazione/sotterraneo-3d` conta i `linkProgram` degli attacchi dopo il riscaldamento e aspetta il primo disegno (`grafica().entrando` falso) prima di contare le chiamate; `unita/sotterraneo-coda-shader` la coda; `unita/sotterraneo-ritaglio` il ritaglio; `unita/sotterraneo-anteprime-3d`
la coda a fette.

Torna a [grafica-3d-costi.md](grafica-3d-costi.md).
