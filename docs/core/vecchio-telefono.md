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
| `--gpu sw` | SwiftShader: la CPU fa la GPU, deterministico ma sono ms di un'altra cosa (usata anche dalle misure in `grafica-3d-costi.md`) | |

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

## Tarare le leve sul telefono vero (una volta)

**Più semplice, senza il benchmark:** col contatore acceso si fa una misura di una scena fissa (per esempio
`#sotterraneo3d=1&seme=7&dpr=1`, 15 secondi) e si cercano CPU e zavorra che sul computer, con lo stesso cheat, danno gli stessi
fps e p95. Il benchmark sotto serve se si vuole una taratura che non dipende dal gioco.

1. Sul Note 7 apri `strumenti/vecchio-telefono/benchmark.html` (non sta nel sito: va copiato sul telefono), tocca *Misura*:
   dà `js` (ms della CPU) e `gpu` (ms per riempire lo schermo con lo shader).
2. `node strumenti/vecchio-telefono.mjs calibra --telefono js=…,gpu=…` cerca la CPU ×N e la zavorra K che sul computer danno
   gli stessi due numeri e li salva in `strumenti/vecchio-telefono/profilo.json` (uno per `--gpu`). Va rifatta se cambia il
   computer. **Senza taratura le leve sono una stima (CPU ×6, zavorra 4) e lo strumento lo scrive**: i numeri valgono per
   confrontare prima e dopo, non come verità.

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
