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
sul Redmi: CPU ×2,9, zavorra 16. **Quanto somiglia**: il rapporto computer/telefono sta fra 0,8 e 1,2 per pixel semplici,
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
