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

## Cosa resta da guardare sul telefono vero

- **La GPU**: qui non si misura (SwiftShader fa 4-6 fps nel mondo per i pixel, non per il JS). Col contatore fps: scontro fermo, tre
  attacchi, dieci secondi nel villaggio e fra due branchi ([../core/vecchio-telefono.md](../core/vecchio-telefono.md)).
- **Gli shader alla prima volta**: sotto, «Shader e prima apparizione».
- **Le trame generate del sotterraneo** (pavimento, pareti, legno, normali dell'atlante): ~0,8 s a ×6 a ogni scenario nuovo.
- **Il mondo con due branchi**: 17,6 ms di JS a fotogramma a ×6, il più alto; ci pesano l'aggiornamento delle matrici e la melma che
  ricalcola le normali a ogni fotogramma (~15% del JS quando c'è), oltre ai 415k triangoli.
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
2. **Il riscaldamento** (`indice.js`, `scaldaPiano`): `renderer.compile` chiede i programmi e non aspetta (si aspetta al primo
   disegno, quando three legge l'esito), quindi il telefono li compila mentre si esplora. Un secondo dopo il primo disegno di un piano,
   un pezzo per fotogramma e mai mentre si racconta un colpo: la scena intera (le cose ancora spente: anelli, colonne, portali),
   un'istanza in serbo di ogni modello di mostro del piano con le copie trasparenti di chi svanisce (`mostro3d.js`, `prepara`), e
   gli effetti che la discesa può chiedere (`effetti3d/gestore.js`, `effettiPrevisti`: le abilità imparate, l'arma in mano, le mosse e
   i colpi dei modelli; tutti e sessanta sarebbero ~30 programmi in più, quasi tutti inutili). Col passaggio finale si compila nella
   sua texture (`post.compila`): fuori sarebbero altri programmi. Nel mondo di sopra, un secondo dopo i primi pezzi, la scena intera
   (lo scontro sul prato, spento finché non si combatte). Dove c'è `KHR_parallel_shader_compile` il piano nuovo si disegna quando i
   suoi programmi sono pronti (al più un secondo; intanto resta il quadro di prima).
3. **Le anteprime a fette** ([anteprime-3d.md](anteprime-3d.md)): il renderer, il modello con `compile`, il disegno, la copia con
   `createImageBitmap`, ognuno in un compito suo.

Non c'è una schermata di caricamento da usare: il piano si costruisce nel fotogramma in cui si arriva, e i suoi programmi servono
subito. Quello che si sposta è tutto il resto, che prima cadeva nello scontro.

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

**Da confermare sul Note 7** (Misura questo telefono, la prova coi modelli veri): nelle `discese` il «+Nsh» del primo fotogramma
dovrebbe scendere (le varianti) e i colpi seguenti non aggiungere shader; il «primo» della prima scena resta alto (i programmi del
piano servono subito), quello delle scene dopo deve calare; lo `zaino` deve stare sotto i 400 ms di fotogramma fermo (atteso
~150-250); `luci` e `calore` cambiano poco (ogni scena di `luci` cambia il numero di luci, e quindi ricompila tutto: è la prova, non il
gioco). Giocando: il primo attacco della prima discesa non deve più fermarsi, e il primo secondo di un piano nuovo può scattare un
poco (il riscaldamento).

Per contare: `window.__sotterraneo3d.programmi()` (le discese e il mondo) e `window.__anteprime3d.programmi()` dicono ogni programma
col tipo, i materiali che lo usano (le scelte che fanno variante, `scena3d/programmi.js`) e dove la chiave differisce dal primo dello
stesso tipo; `grafica().programmi` quanti, `grafica().daScaldare` quanti pezzi restano del riscaldamento (`scaldato` nel mondo),
`__anteprime3d.stato()` `programmi`, `msCompila` e `fettaMax`.

```bash
S='sotterraneo3d=1&seme=11&stanza=sala&sotterraneo=branco&mostri=3&tipo=scheletro&variante=guerriero,arciere,mago&grado=leggendario&corredo=leggendario&eroe=cavaliere&qualita=bassa&dpr=1'
node strumenti/profila-app.mjs "$S" --secondi 3 --funzioni 0 --pronto 'window.__sotterraneo3d && window.__sotterraneo3d.grafica().mostri3d >= 3' \
  --stampa 'window.__sotterraneo3d.programmi()'
```

Nei test: `integrazione/sotterraneo-3d` conta i `linkProgram` degli attacchi dopo il riscaldamento; `unita/sotterraneo-anteprime-3d`
la coda a fette.

Torna a [grafica-3d-costi.md](grafica-3d-costi.md).
