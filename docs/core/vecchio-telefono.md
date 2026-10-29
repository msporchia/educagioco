# Il vecchio telefono: il metro dei giochi 3D

Il metro di paragone è il **Redmi Note 7 della bambina** (Snapdragon 660, Adreno 512, 1080×2340, 393×851 a pixel ratio 2,75). Su
quel telefono le esplosioni degli Asteroidi 3D e tutto il Sotterraneo 3D vanno a scatti: un gioco 3D è abbastanza leggero
quando lì resta sotto i ~30 ms a fotogramma. Sul computer (RTX, 20 core) non si vede niente, quindi lo si rallenta:
`node strumenti/vecchio-telefono.mjs` (le opzioni in testa al file).

## Le leve

| Leva | Cosa fa | Cosa NON fa |
|---|---|---|
| schermo e pixel ratio | 393×851 a 2,75, touch, user agent Android | |
| `--cpu N` | `Emulation.setCPUThrottlingRate`: il JS e la preparazione del fotogramma costano N volte | non rallenta i thread della GPU (con `--gpu sw`, SwiftShader, il disegno non è rallentato da questa leva) |
| `--zavorra K` | un'altra pagina disegna K schermi pieni con uno shader pesante a ogni fotogramma: la GPU vera si divide col gioco | non imita la banda di memoria né il calore del telefono |
| `--gpu sw` (di difetto) + `--core N` | SwiftShader: la CPU fa la GPU, e `taskset` (nessun comando di sistema) la limita a N core: con 4 core e CPU ×5 il computer somiglia al Note 7 sui pixel (shader leggero ×1,2, pesante ×1,2, JS ×0,96, triangoli ×0,9-1,9, chiamate ×0,6-1,2) e **sovrastima** strati sfumati (×2,2-5,7) e scintille grandi (×2,8-6,8): per i giochi è pessimista. Senza `--core` la macchina va 3 volte più forte, e un carico qualunque sul computer sposta i numeri | |

Un telefono non si imita davvero: serve a trovare **dove** scatta e **se un degrado aiuta**, e i numeri veri si confermano
sul telefono (`chrome://inspect`, scheda Performance, [comandi.md](comandi.md)).

## Il contatore sul telefono vero

Dalla zona dei grandi (codice, scheda *giochi*, «Interruttori di casa») l'interruttore **Contatore di fluidità (fps)**,
spento di partenza e **del telefono** (`store/fps.js`, chiave `contafps`, fuori dai profili: cambiando bambino non si
spegne). Acceso, in un angolo di ogni schermata sta una pastiglia con gli fps dell'ultimo mezzo secondo (verde da 50,
giallo da 28, rosso sotto). Un tocco avvia una **misura** (diventa rossa), un secondo tocco la chiude e la tiene: fps medi,
p50/p95/p99, quanti fotogrammi sopra 33 e 50 ms, la vista, e per i giochi 3D pixel ratio, chiamate e triangoli. Il «▾»
apre le ultime sei, che restano anche dopo la chiusura dell'app; «svuota» le butta. I numeri sono quelli di
`strumenti/vecchio-telefono.mjs`, e si confrontano con le sue righe. Un fotogramma sopra il secondo non conta (telefono
posato). Costa un `requestAnimationFrame` solo da acceso. `components/ContaFps.vue`, nei test `[data-fps]`,
`[data-azione="fps-misura"]`, `.carta[data-flag="fps"]`.

## La fascia: misurare una volta e tenerla

Un telefono non cambia prestazioni nel tempo, quindi non si misura a ogni partita: `grafica/benchmark/qualita-rapida.js` fa in
meno di un secondo quattro prove del benchmark (pixel leggeri a pixel ratio 1,5, shader pesante, 8 strati sfumati, 500
scintille additive; WebGL nudo, senza three) più un quarto della prova di CPU, e ne ricava la **fascia** (`alta`, `media`,
`bassa`): somma dei ms sotto 28 alta, fino a 40 media, oltre bassa, e un JS lento (≥ 100 ms) scende di una fascia. Le soglie
vengono dai log veri: Redmi Note 7 = 52 punti (bassa), iPhone 12 Pro Max = 23 e Pixel 9a = 19 (alta). `store/qualita.js` la tiene
fuori dai profili (chiave `qualita`) e la rifà dopo 30 giorni, se cambia il pixel ratio dello schermo o se si alza
`VERSIONE_MISURA`. Parte da sola in home dopo 4 secondi (mai sotto automazione: `navigator.webdriver`).

Cosa cambia una fascia sta tutto in `PROFILI` di `store/qualita.js`: negli Asteroidi 3D il pixel ratio di partenza (2 / 1,5 / 1),
il tetto delle scintille (1400 / 700 / 350) e del fumo, e quanto in fretta il gioco scende di pixel (90 fotogrammi lenti a passo
×0,85 contro 20 a ×0,75); nel Sotterraneo 3D il pixel ratio massimo (1,5 / 1,25 / 1), le fette di nebbia (5 / 3 / 2) e, nella bassa, il passaggio finale
spento, due luci dei fuochi invece di sei, niente luci del rimbalzo e del palco (lampo e magia in una), l'ombra a 512 a fotogrammi
alterni, meno scintille ([../sotterraneo/grafica-3d-costi.md](../sotterraneo/grafica-3d-costi.md), «La fascia bassa»). **Botti e arredo restano in tutte le fasce** (le ombre no, dal 23/10: la fascia bassa le toglie, con la nebbia a una fetta e meno polvere: misurato sul Note 7, l'ombra costa ~8 ms): dai log del Note 7 i triangoli costano poco (10k → 100k: +1,4 ms), pesano i
pixel. Emulazione (SwiftShader, CPU ×2,8), p50 di un fotogramma: esplorazione alta 50 ms → bassa 17; scontro con 3 mostri alta 67 →
bassa 17 (p95 67). L'emulazione sovrastima i triangoli, quindi sul telefono dovrebbe andare meglio. **I numeri di media e bassa sono un'ipotesi dai log: da provare sul Note 7** (col
contatore fps e `Misura questo telefono`) e ritoccare. In zona dei grandi (scheda *giochi*) la carta «Qualità della grafica 3D»
dice la fascia, la fa scegliere a mano (`auto`/`alta`/`media`/`bassa`) e la rimisura; il cheat `#…&qualita=bassa` vince su tutto,
per provarla sul computer (`[data-fascia]`, `[data-fascia-scelta]`, `[data-azione="rimisura-fascia"]`).

## La misura del telefono

Zona dei grandi → *Impostazioni* → *Avanzate* → **Misura questo telefono**: gli fps veri e dove pesa, coi modelli veri dei giochi
([vecchio-telefono-veri.md](vecchio-telefono-veri.md)). In testa dice la fascia del telefono e da dove viene.

## Tarare il computer sul telefono (una volta)

1. Sul Note 7 si fa «dove pesa» e si manda (o si copia in un file `dovepesa.txt`).
2. `node strumenti/vecchio-telefono.mjs calibra --log dovepesa.txt` cerca la CPU ×N che dà lo stesso `js` e la zavorra K che dà gli
   stessi ms di una scena (di difetto il villaggio intero, `scala-sopra-9`) e li salva in `strumenti/vecchio-telefono/profilo.json`
   (uno per `--gpu`). Va rifatta se cambia il computer, a macchina calma. **Senza taratura le leve sono una stima e lo strumento lo
   scrive.**
3. `node strumenti/vecchio-telefono.mjs benchmark --contro dovepesa.txt` rifà la prova sul computer rallentato e dà il rapporto scena
   per scena: vicino a 1 quella parte è imitata bene, lontano no (e allora per quella parte si misura sul telefono).

Le misure vere stanno in `strumenti/vecchio-telefono/log/` (Redmi Note 7, Pixel 9a, iPhone 12 Pro Max), e il `profilo.json` è tarato
sul Redmi: con `--gpu sw` 4 core e CPU ×5,0; con `--gpu hw` (la RTX) CPU ×2,9 e zavorra 16, che però sbaglia di tre volte gli shader
pesanti. Il simulatore va bene per confrontare un degrado con la versione di prima su geometria, chiamate e pixel; per nebbia,
esplosioni e sfumature vale il telefono vero.

## Cosa dice il Note 7 (19 ottobre 2026)

Contro un Pixel 9a (ms per scena): CPU 4,3 volte più lenta (469 contro 108); shader pesante 20,6 contro 5,9; 1200 scintille
23,7 contro 7,6; 8 strati a schermo intero a pixel ratio vero 26,9 contro 9,1; 400 chiamate 19,6 contro 9. Pixel semplici,
triangoli e passaggio finale solo il doppio. L'iPhone 12 Pro Max (pixel ratio 3) paga comunque 22 ms le sfumature a schermo intero.

**Il perché degli Asteroidi 3D** (da `grafica/spazio3d/`): parte a pixel ratio 2 (`DPR_START`), fino a 1400 scintille additive
più 400 di fumo fino a ~50 px, dipinte su una tela half-float e poi un passaggio finale a schermo intero con tre letture
della tela e la grana. Sul Note 7 le sole scintille a pixel ratio 1,5 costano già 24 ms e a 2 sono ~1,8 volte i pixel: da
sole oltre il fotogramma. Il gioco abbassa il pixel ratio solo dopo 90 fotogrammi lenti, a passi di ×0,85: durante
un'esplosione non fa in tempo. **Sul Sotterraneo** il guaio probabile è la nebbia (shader pesante a tutto schermo) e l'ombra
(15 ms a mappa 1024). Sono ipotesi da confermare togliendo il pezzo (`&spegni=nebbia,post` nel Sotterraneo 3D).


## Misurare

```bash
node strumenti/vecchio-telefono.mjs 'sotterraneo3d=1&seme=7' --cpu 1,5 --zavorra 0,32 --secondi 10
node strumenti/vecchio-telefono.mjs 'mate3d=3&volo' --esegui '<scatena le esplosioni>' --tocca 200,500
```

Una riga per ogni combinazione: fps, p50/p95/p99 fra due fotogrammi, quanti sopra 33 e 50 ms, e `grafica()` del gioco (pixel
ratio, chiamate, triangoli). **Liscio** se p95 < 20 ms, **a scatti** se > 33. I giochi adattano il pixel ratio da soli: la riga
«si adatta» dice che è successo; per il costo vero a una risoluzione si fissa col cheat `&dpr=N`, e per confrontare un
degrado con quello che c'era si usa `--dist` su due file.

Provato il 19 ottobre 2026 (taratura inventata, solo per vedere che le leve muovano): il Sotterraneo 3D (seme 7) passa da
55 fps (p95 33 ms) a 27 fps con CPU ×5 e a 13 con in più la zavorra 32; il pixel ratio scende da 1,4 a 1.

## Lo scontro

`node strumenti/vecchio-telefono.mjs '<cheat dello scontro>' --scontro` porta il Sotterraneo 3D in uno scontro ripetibile: un attacco
con la risposta giusta ogni tre secondi (`--ogni`), l'eroe che non sviene (la vita torna piena: si misura il disegno, non lo scontro),
una riga per fase (`fermo` col pannello, `racconto` mentre il colpo si racconta, `fuori`) e sotto il **banco della tela**:
`window.__sotterraneo3d.banco(30)` disegna la scena ferma trenta volte aspettando ognuna (una lettura di un pixel), quindi dice i ms
della sola tela senza i 60 Hz e senza la pagina. È la misura da usare per un degrado: i fps del simulatore a GPU finta balzano coi
carichi del computer, il banco molto meno. Il cheat dello scontro:

```bash
node strumenti/vecchio-telefono.mjs 'sotterraneo3d=1&seme=11&sotterraneo=branco&mostri=3&tipo=scheletro&stanza=sala&qualita=bassa&dpr=1&eroe=cavaliere' --scontro --secondi 20
… --scontro --ritmo ';'                       # fermo e basta (nessun attacco)
… --scontro --ritmo ';' --spegni '-,fuochi:2,lampi,palco,nebbia' --secondi 2   # il banco con un pezzo spento per riga
… --scontro --gpu hw --core 0 --cpu 5 --traccia 30   # la GPU vera e la CPU lenta: cosa tiene il filo principale
# lo scontro di sopra, sul prato dei campi (il mondo dà anche lui `corsa`, `palco` e `banco()`): si aspetta il mondo, ci si porta alle vespe
node strumenti/vecchio-telefono.mjs 'sotterraneo3d=mondo&eroe=cavaliere&qualita=bassa&dpr=1' --scontro --secondi 20 --esegui "new Promise(r => { const t = setInterval(() => { if (window.__mondo3d && window.__sotterraneo3d && window.__sotterraneo3d.pronto) { clearInterval(t); window.__mondo3d.porta(90.5, 43.5); setTimeout(() => { window.__extra = () => window.__sotterraneo3d.banco(30); r() }, 12000) } }, 300) })"
```

Il 19/10 (fascia bassa, 4 core, CPU ×5): il banco della tela nello scontro di sopra 290 ms, il mondo fermo nello stesso posto 281; lo
scontro sul prato costa poco più del mondo, ma il mondo costa circa tre volte lo scontro delle discese
([../sotterraneo/mondo-aperto-mostri-scena.md](../sotterraneo/mondo-aperto-mostri-scena.md#quanto-costa)).

`--fasi '<espressione>'` dà il nome di un fotogramma (la riga per fase), `--ritmo` le istruzioni ripetute, `--spegni` una riga per
gruppo di pezzi di `ACCESI` (`+` li unisce, `-` nessuno, `fuochi:2` un numero), `--profilo N` le funzioni che tengono il filo
principale, `--traccia N` le voci della traccia di Chrome (`Commit`, `DoUpdateLayers`: il DOM composto sopra la tela), e sotto ogni
riga i fotogrammi lunghi del filo (Long Animation Frames). `grafica().programmi` conta gli shader compilati: se cresce a ogni colpo
il telefono si ferma a compilare (sull'Adreno 50-300 ms, il computer non lo vede); un test lo controlla.

**Cosa si è visto il 19/10** (fascia bassa, pixel ratio 1, 4 core e CPU ×5, computer carico: contano i rapporti). Il filo principale
non è il collo: con la GPU vera e la CPU ×5 lo scontro fermo sta a 60 fps (7 ms di filo a fotogramma, nessun fotogramma lungo),
e anche il racconto (12 ms: JS 4, il resto è comporre il DOM sopra la tela). Il collo è la GPU: il banco dello scontro fermo è
~100 ms, quello del racconto lo stesso +5-20% (le scintille sono una chiamata sola e piccole: ~8 px). Il DOM sopra la tela, nascosto,
toglie ~12% ai fps ma niente al banco. Nessuno shader nuovo a ogni colpo (29 prima e dopo). **Sul telefono il racconto scende da
48 a 15 fps, il simulatore no**: la differenza è dell'Adreno e si cerca sul telefono (sotto). Cosa pesa e cosa si è tolto:
[../sotterraneo/grafica-3d-costi.md](../sotterraneo/grafica-3d-costi.md).

**Da rifare sul Note 7, col contatore fps** (fascia bassa: zona dei grandi → «Qualità della grafica 3D» la dice): una misura (tocco
sulla pastiglia, tocco per chiuderla) di dieci secondi fermi nello scontro col pannello delle abilità aperto, una di tre attacchi di
fila (dal tocco sull'attacco a racconto finito), una camminando; il confronto è con 48 fps fermo e 15 nell'attacco. Se l'attacco resta
sotto i 45 la misura «Misura questo telefono» non basta più: serve la scheda Performance di `chrome://inspect` durante un attacco.

## Cosa può dare problemi (e cosa si è visto)

**Nell'emulazione** (SwiftShader, CPU ×2,8 su tutti i core, quindi più lenta di una taratura giusta di quanto il computer fosse carico; 392×774 a 2,75: i valori sono da rifare con `--core 4` e CPU ×5), Asteroidi 3D, p50 di un fotogramma: fascia alta (pixel ratio 2) 83 ms,
media 50, bassa (pixel ratio 1) 33: il pixel ratio è la leva che conta, il resto no. **Senza esplosioni è lo stesso**: l'emulazione
sovrastima la scena di base (triangoli e passaggio finale ×2-4 contro il Note 7), quindi non separa le esplosioni; sul computer vero
(RTX, nessun rallentamento) un'esplosione ogni 0,5 s porta da 59 a 39-51 fps. Il JS che prepara il fotogramma sta sotto il mezzo
millisecondo e le chiamate a WebGL sotto i 5: il costo è la GPU, non il JS. Un'esplosione sono ~47 punti (le scintille 5-15 px, i
quattro lampi fino a ~100 px, il fumo ~30 px) più, per ogni sasso, un anello d'urto additivo grande fino a 0,55 volte il lato corto:
sono pochi pixel di punti ma qualche megapixel di anelli sovrapposti, e la prova «1200 scintille da 120 px» del benchmark è un caso
peggiore, non l'esplosione vera. **Da confermare sul Note 7** con il contatore fps, una partita senza e una con esplosioni.

**I rischi della fascia**: (1) misurata male e tenuta un mese (telefono occupato, appena aggiornato, in risparmio energetico): la
misura si scarta se la scheda si nasconde o un fotogramma supera i 400 ms; resta il rischio di una fascia sbagliata, che i grandi
correggono a mano o con «Rimisura»; (2) soglie ricavate da tre telefoni: un telefono di fascia media è un'ipotesi; (3) la prova di
un secondo carica la GPU in home (un'attesa di 4 secondi, e non parte se si è già entrati in un gioco); (4) una fascia bassa
toglie nitidezza (pixel ratio 1 su uno schermo a 2,75) e nel Sotterraneo le ombre; (5) lo shader compilato la prima volta in una
scena (un anello, un guscio) è un fermo che il computer non vede (3 ms contro i ~140 ms misurati sul Note 7): si contano i programmi,
e il Sotterraneo 3D li compila in anticipo ([../sotterraneo/prestazioni-3d.md](../sotterraneo/prestazioni-3d.md), «Shader e prima apparizione»).
