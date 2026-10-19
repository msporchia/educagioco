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
spento. **Botti, arredo e ombre restano in tutte le fasce**: dai log del Note 7 i triangoli costano poco (10k → 100k: +1,4 ms), pesano i
pixel. Emulazione (SwiftShader, CPU ×2,8), p50 di un fotogramma: esplorazione alta 50 ms → bassa 17; scontro con 3 mostri alta 67 →
bassa 17 (p95 67). L'emulazione sovrastima i triangoli, quindi sul telefono dovrebbe andare meglio. **I numeri di media e bassa sono un'ipotesi dai log: da provare sul Note 7** (col
contatore fps e `Misura questo telefono`) e ritoccare. In zona dei grandi (scheda *giochi*) la carta «Qualità della grafica 3D»
dice la fascia, la fa scegliere a mano (`auto`/`alta`/`media`/`bassa`) e la rimisura; il cheat `#…&qualita=bassa` vince su tutto,
per provarla sul computer (`[data-fascia]`, `[data-fascia-scelta]`, `[data-azione="rimisura-fascia"]`).

## La misura a scene (il benchmark)

Zona dei grandi → *giochi* → **Misura questo telefono** (`components/genitori/Benchmark.vue`, nei test
`[data-azione="benchmark"]`, `[data-benchmark-log]`). Un minuto di scene di `grafica/benchmark/prove.js`, ognuna con UNA
cosa sola a qualità diverse: pixel (shader leggero e pesante, pixel ratio 1 / 1,5 / vero), 8 strati sfumati a schermo
intero, scintille additive da 40 a 120 px (le esplosioni), 10k / 40k / 100k triangoli con luci, 30 / 150 / 400 oggetti
separati (le chiamate), ombre a 1024 e 2048, il passaggio finale su tela half-float contro il disegno diretto, e una prova
di CPU pura. Per ogni scena sono i **ms di lavoro** per fotogramma (disegno più attesa della GPU con una lettura di un
pixel: non dipende dai 60 Hz) con p95 e fps. `grafica/benchmark/log.js` li compone in un testo (✓ sotto 8 ms, ~ fino a 16,
XX sopra) con una «LETTURA» che nomina cosa pesa e cosa togliere, e in fondo la riga `DATI {…}`. «Manda» apre il modulo dei
giudizi con il log nel campo `giudizi` (l'unico modulo con un campo lungo: ~3,5k caratteri, se l'indirizzo è troppo lungo
c'è «Copia»); «Rifai» ripete. Un pezzo che il telefono non regge (la tela half-float) è una riga «non regge», non un errore.

## Tarare il computer sul telefono (una volta)

1. Sul Note 7 si fa la misura e si manda (o si copia in un file `telefono.txt`).
2. `node strumenti/vecchio-telefono.mjs calibra --log telefono.txt` cerca la CPU ×N che dà lo stesso `js` e la zavorra K che
   dà gli stessi ms di «pixel, shader leggero, dpr nativo» e li salva in `strumenti/vecchio-telefono/profilo.json` (uno per
   `--gpu`). Va rifatta se cambia il computer. **Senza taratura le leve sono una stima (CPU ×6, zavorra 4) e lo strumento lo
   scrive.**
3. `node strumenti/vecchio-telefono.mjs benchmark --contro telefono.txt` rifà la misura sul computer rallentato e dà il
   rapporto riga per riga: vicino a 1 quella parte è imitata bene, lontano no (e allora per quella parte il computer non
   vale come telefono: si misura sul telefono).

Le misure vere stanno in `strumenti/vecchio-telefono/log/` (Redmi Note 7, Pixel 9a, iPhone 12 Pro Max), e il `profilo.json` è tarato
sul Redmi: con `--gpu sw` 4 core e CPU ×5,0 (tarato il 19/10; una taratura fatta a computer carico dà numeri sbagliati: ripetere a macchina calma); con `--gpu hw` (la RTX) CPU ×2,9 e zavorra 16, che però sbaglia di tre volte gli shader pesanti. **Quanto somiglia**: il rapporto computer/telefono sta fra 0,8 e 1,2 per pixel semplici,
triangoli, chiamate, ombre e passaggio finale; **non somiglia** per gli shader pesanti (×0,36: la RTX li mangia) e le
sfumature a schermo intero (×0,3), e il pavimento di un fotogramma è più alto (la zavorra costa CPU: JS ×1,56). Quindi il
simulatore va bene per confrontare un degrado con la versione di prima su geometria, chiamate e pixel; per nebbia, esplosioni
e sfumature vale il log del telefono vero.

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
scena (un anello, un guscio) è un fermo che il computer non vede (3 ms contro i 50-300 ms attesi su un Adreno): non misurato.
