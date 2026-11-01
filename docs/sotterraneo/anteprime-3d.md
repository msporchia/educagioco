# Le anteprime 3D nei pannelli

Nel sotterraneo ([grafica-3d.md](grafica-3d.md)) l'eroe, i mostri e gli effetti sono modelli ([mostri-3d.md](mostri-3d.md));
per coerenza (l'utente, 21 ottobre 2026) lo sono anche le immagini dei pannelli: le caselle della roba (zaino, botteghe, il
pannello del pezzo, il confronto affiancato), il ritratto dell'eroe (zaino, bottega, pagina dell'eroe, scelta dell'avventura) e la
fila dei turni dello scontro. Sono fotografie dei modelli veri, fatte una volta e tenute.
Le anteprime le fornisce Gioco.vue.

## Fatte sul computer (28/10)

**Il telefono disegna solo il ritratto dell'eroe vestito** (`eroe:`, `busto:`: dipende da cosa porta, le combinazioni non si contano).
Il resto, cioè la roba con ogni figura, rarità ed elemento a cui può uscire, l'armatura sui quattro eroi, i copricapi, i consumabili, i mostri con gradi e
varianti, i grossi e le persone, lo fotografa `npm run anteprime sotterraneo` (`strumenti/anteprime-sotterraneo3d.mjs`) col servizio
vero nel file costruito: ~970 WebP alla misura di `MISURE`, ~2,9 MB, in `dati/anteprime-fatte.js` (generato). Il fornitore
(`viste/anteprima3d.js`, `creaFornitore`) carica il file a parte quando il 3D parte, decodifica una foto alla prima richiesta della
sua chiave e la dà alla vista come la tela di prima (`Quadro3d` copia un'immagine come una tela); per una chiave che non c'è chiama il servizio.
- **Le chiavi le dà il codice del gioco**: `chiaveDellaCosa` su ogni pezzo possibile (ogni base, rarità, abilità a una e a due, livello
  1–120: la figura la sceglie un hash della chiave, e oltre i 100 non ne escono di nuove), più mostri, grossi e persone. Una figura
  nuova cambia l'elenco e `unita/sotterraneo-anteprime-fatte` è rosso finché non si rifanno.
- **La firma dei sorgenti** (`SORGENTI`: il servizio, la roba, gli eroi, i mostri, le persone) dice se le foto sono dei modelli di adesso.
- Sul Note 7 lo zaino da 15 anteprime faceva 2,7 s, con un fotogramma fermo di 250 ms; la misura (`zaino-15`) passa ora dal fornitore,
  come il gioco.

## Dove sta cosa

| file | cosa tiene |
|---|---|
| `scena3d/anteprime3d-pura.js` | senza three: `pezzo3dDi` (oggetto → figura, ripiego, rarità, elemento: [roba-3d.md](roba-3d.md)), `MODELLO_DI` (il ripiego della collezione), `dotazioneDi`, `pregioDi`, le chiavi, `leggiChiave`, la coda `creaCoda` |
| `scena3d/roba3d.js` | la figura costruita dal modulo della sua famiglia, o il ripiego, con l'alone se è leggendaria ([roba-3d.md](roba-3d.md)) |
| `scena3d/anteprime3d.js` | il renderer, la scena di posa, le inquadrature, `creaAnteprime3d` |
| `scena3d/eroe3d.js` | `vestiEroe(g, roba)` e `vestiDotazione(g, d)`: l'eroe in scena e quello delle anteprime si vestono con la stessa funzione |
| `viste/anteprima3d.js` | `creaFornitore` (le foto fatte, il servizio per il resto), `fornisciAnteprime3d` (Gioco.vue), `usaAnteprima(chiave)`: un ref null finché l'immagine non c'è |
| `dati/anteprime-fatte.js` | GENERATO da `npm run anteprime sotterraneo`: le foto, `SENZA` (le chiavi senza modello), le due firme |
| `viste/Quadro3d.vue` | la tela che mostra un'anteprima |
| `viste/Icona.vue` | `tre` (la chiave) o `cosa3d` (la cosa: la chiave si ricava), `lato`; lo sprite (`sprite`) solo senza chiave |
| `viste/Armato.vue` | l'eroe vestito: `mano`, `mancina`, `corpo`, `testa` |
| `viste/Ritratto.vue` · `viste/Grosso.vue` | la persona di sopra (`persona:`) · il grosso nella sua barra (`mostro:grosso:`), con la corona |

Chi la usa: `Casella`, `Pannello`, `Confronto`, `ScegliPozione`, `Zaino` (la torcia), `Tesori`, `Eroi` (la roba addosso), il diario (il
regalo, il mostro o chi si è perso), gli avvisi della roba trovata e la festa del leggendario (`cosa3d`); `Addosso`, `PaginaEroe`, `Eroi`
(`Armato`); `FilaDeiTurni` (`tre`, con `chi`, `mano`, `mancina`, `corpo` dell'eroe che `viste/campo.js` aggiunge alla vista dello scontro).

## Le chiavi e le inquadrature

La chiave dice la figura e l'aspetto, non l'oggetto: due spade con la stessa figura e la stessa rarità sono la stessa anteprima. Il
«gettone» di un pezzo è `<figura>.<ripiego>.<lettera della rarità>.<elemento>` (`spada-28.spada-lunga.m.fuoco`, `-` dove manca).

| chiave | cosa si vede | pixel |
|---|---|---|
| `arma:<gettone>` | l'arma (la figura, o il ripiego) in diagonale, la punta in alto a destra; l'arco girato di lato perché si veda la curva; la balestra con la bocca in alto a destra, vista da sopra e un poco di fianco perché si veda la croce dell'arco di piatto ([roba-3d.md](roba-3d.md#come-si-tiene-unarma)); l'alone fermo a 1,3 s | 128² |
| `scudo:<gettone>` · `gioiello:<gettone>` | lo scudo, la collana o l'anello di fronte, appena girato | 128² |
| `copricapo:<modello>:<rarità>` | il copricapo da solo su una testa finta, di tre quarti, con l'alone se è leggendario ([elmo.md](elmo.md)) | 128² |
| `consumabile:<chiave>:<rarità>` | la pozione, la torcia, la chiave o la pergamena di fronte (l'alone solo ai rarissimi) | 128² |
| `armatura:<tipo>:<pregio>:<eroe>:<corpo>` | l'armatura su un manichino: l'eroe di adesso senza testa e senza armi (la veste della figura se il modulo `vesti` c'è); `<corpo>` = `<tipo>.<pregio>.<figura>.<rarità>.<elemento>` | 128² |
| `eroe:<chi>:<destra>:<sinistra>:<corpo>:<collo>` (e `:<copricapo>` in coda, solo se ce l'ha) | l'eroe intero nella guardia, con le armi, l'armatura, la collana e il copricapo | 150×176 |
| `busto:…` (lo stesso) | la faccia e le spalle, uguali per tutti (il cappello del mago e la barba del nano restano dentro a metà) | 96² |
| `persona:<modello>` | una persona del mondo di sopra a mezzo busto ([persone-3d.md](persone-3d.md)): il dialogo, il diario, la bottega | 96² |
| `mostro:<tipo>:<grado>:<variante>` · `mostro:grosso:<chi>` | il modello del registro (`idDi`), di tre quarti verso sinistra, dalla testa a circa due terzi | 96² |

- **Il pregio dell'armatura viene dalla rarità** (comune 1, magico 2, raro e leggendario 3), anche per l'eroe in scena: prima era
  2 per ogni pezzo trovato, e il terzo non si vedeva mai.
- **Ogni pezzo che si anima si mette in un istante** (`animaTutto`): prima della prima `anima` le fiamme e le braci dell'ascia di
  lava erano grandi quanto l'arma, e l'anteprima era un quadrato giallo.
- La luce è quella delle torce: un'emisferica bruna, un fuoco caldo davanti a sinistra, un filo freddo da dietro che stacca il
  contorno; tono ACES come la scena.

## Una cosa con un modello si mostra solo con la sua foto

L'utente, 31 ottobre 2026: il ripiego di un disegno 3D è il disegno 2D fatto dal 3D, non uno dipinto a parte.

- **Finché la foto non c'è il posto resta vuoto della sua misura**, senza sprite sotto (`data-anteprima="attesa"`, poi `"3d"`). Le
  caselle compaiono subito; la foto fatta arriva al primo decodificarsi, quella viva (l'eroe vestito) dal servizio.
- **Lo sprite dipinto resta solo dove una chiave non c'è**: oggi i tre gioielli di base senza figura (`amuleto-rosso`, `medaglione`,
  `amuleto-osso`: [roba-3d.md](roba-3d.md)). Ogni specie, grosso e persona ha il suo modello (`SENZA` è vuoto).
- **Un modello che si rompe o un contesto perso valgono null**: il posto resta vuoto, mai uno sprite. Il sotterraneo si apre solo con
  WebGL 2 (`Entrata.vue`), quindi un ripiego per «niente WebGL» non serve.
- **Il ritratto tiene i segni della roba** (`data-in-mano`, `data-addosso`, `data-in-braccio`) su elementi vuoti, per le prove.
- I cheat `#icone2d`, `#sprite` ed `#eroe2d` non ci sono più; per misurare la scena senza modelli dei mostri c'è `&spegni=mostri3d` (tutti in sagoma: [sagome-3d.md](sagome-3d.md)). In scena la figura piatta di un mostro o di una persona è la stessa idea: la foto del modello, fatta sul computer.

## Quanto costa

- **Un renderer solo, suo** (la bottega sta sopra, dove la scena della discesa non c'è): una tela piccola, creato alla prima
  richiesta (e three col modulo, a richiesta), chiuso dopo 30 s senza richieste (`dispose` e `forceContextLoss`); si riapre alla
  prossima. La cache delle immagini resta finché si gioca; `via()` alla chiusura del gioco.
- **Il `webglcontextlost` di `forceContextLoss` arriva dopo**, un compito più in là: conta solo se la tela è ancora quella
  aperta (chiudendo si toglie il renderer prima). Era il guasto dei ritratti del mondo di sopra: dopo 30 s di cammino la chiusura
  per ozio passava per una perdita e il servizio restava `rotto`. Un contesto tolto davvero dal browser (telefoni con pochi
  contesti) chiude il renderer, che si riapre alla richiesta dopo; `rotto` per sempre solo alla terza perdita (`stato().perdite`).
  Un'immagine persa a metà torna `RIPROVA`: null, ma non resta in cache.
- **La coda**: una chiave una volta sola; in un giro se ne fanno finché non passano 16 ms (almeno una), poi si cede il filo con
  un messaggio (il tocco e i fotogrammi passano prima). Un'anteprima a fette è una promessa: il giro si ferma e la chiave dopo
  parte quando è arrivata (le fette usano la stessa scena).
- **A fette**, ognuna in un compito suo: il renderer, se non c'è; il modello in posa con gli shader nuovi chiesti (`compile`, che
  non aspetta), poi un'attesa (finché sono pronti con `KHR_parallel_shader_compile`, se no 60 ms a programma, al più 400); il disegno
  e la fotografia della tela (`createImageBitmap`, che arriva dopo senza aspettare la GPU sul filo); la tela 2D. Sul Redmi Note 7 lo
  zaino aveva un fotogramma fermo di 400 ms: la copia (`drawImage` dalla tela WebGL) aspettava la GPU, e il primo disegno di un
  materiale nuovo la compilazione ([prestazioni-3d.md](prestazioni-3d.md), «Shader e prima apparizione»).
- **L'immagine è una tela 2D** copiata dal renderer, e la vista la copia nella sua (`Quadro3d.vue`): niente PNG.

Misurato con SwiftShader (390×844, la discesa in 3D accesa dietro; `node strumenti/tavola-anteprime.mjs`):

| | anteprime | dal primo chiedere all'ultima pronta | disegno (di cui modelli · render · copia) |
|---|---|---|---|
| tutta la roba con un modello | 37 | ~0,5 s | ~210 ms (~60 · ~45 · ~120) |
| roba, eroi e mostri | 110 | ~3 s | ~1,5 s |
| lo zaino aperto (test) | ~10 | ~0,9 s dal tocco, col modulo da caricare | — |

Provato e lasciato: `toDataURL` (la codifica PNG era tre quarti del tempo, sul filo principale), `toBlob` (le immagini arrivavano
un secondo dopo la coda), una anteprima per fotogramma (dietro la scena in SwiftShader trenta caselle ci mettevano tre secondi),
`antialias: false` (nessun guadagno misurabile).

## Per guardarle

```bash
npm run build && node strumenti/tavola-anteprime.mjs          # tutte, in tmp/scatti/tavola-anteprime.png, coi tempi
node strumenti/tavola-anteprime.mjs --solo eroi --eroe mago    # roba, eroi, mostri; l'armatura sul mago
node strumenti/tavola-anteprime.mjs --solo rarita              # le figure e gli aloni: ogni base comune, magica, rara, e i pezzi col nome
node strumenti/tavola-anteprime.mjs --chiavi arma:spada-28.spada-lunga.l.fuoco,busto:nano:-:-:-:-
node strumenti/tavola-anteprime.mjs --chiavi eroe:elfa:-:arco-07.balestra.c.ombra:-:- --zoom 4   # da vicino: l'arma in mano
node strumenti/tavola-anteprime.mjs --solo armi --eroe nano --famiglia arco,ascia --zoom 2      # ogni arma che si impugna, in mano
node strumenti/tavola-anteprime.mjs --solo armi --eroe mago --posa marcia --giro 1.57 --istante 3  # a metà passo, di fianco, fuori dal gesto
node strumenti/tavola-anteprime.mjs --solo armi --da-sola                                        # le stesse da sole (arma:, scudo:)
node strumenti/scatta-app.mjs 'sotterraneo=1&eroe=cavaliere&sotterraneo=roba&dpr=1' --dist --aspetta 6000 --tocca '[data-azione="zaino"]'
node strumenti/scatta-app.mjs 'sotterraneo=mondo&eroe=cavaliere&bottega=armaiolo&livello=12&roba=rara&gemme=800&dpr=1' --dist --aspetta 8000
```

I cheat dell'indirizzo che la tavola passa (solo per guardare): `#anteprime-zoom=4` le foto più grandi, `#anteprime-posa=marcia`
l'eroe a metà passo, `#anteprime-giro=1.57` girato (1,57 il fianco della sinistra, -1,57 quello della destra), `#anteprime-istante=3`
la guardia a 3 s invece che a 0,6 (che per il nano è dentro il gesto: la mano alla barba).

`window.__anteprime3d.stato()` dice quante disegnate, i ms (modelli, render, copia), quante volte s'è aperto il renderer, se è
aperto, quante in coda, e `prima`/`ultima` (il primo chiedere e l'ultima pronta); `programmi`, `msCompila` (l'attesa degli shader) e
`fettaMax` (il pezzo più lungo sul filo). `window.__anteprime3d.programmi()` i programmi del renderer aperto.

## Cosa manca

- L'armatura si mostra sull'eroe di adesso anche quando la sua classe non la porta (il ✋ lo dice già).

Nei test: `unita/sotterraneo-anteprime-3d` (il ripiego copre ogni arma e scudo del gioco, il pezzo 3D con la figura, le chiavi, null dove resta lo
sprite, la lettura delle chiavi, i mostri allo stesso modello della scena, la coda), `integrazione/sotterraneo-3d-anteprime` (lo
zaino coi modelli, un renderer solo, la pagina dell'eroe, la fila con l'eroe a mezzo busto e la pianta). Bersagli: `[data-anteprima="3d"]`
(`"attesa"` finché la foto non c'è) con `[data-anteprima-chiave]` sull'icona, e `.sot-armato[data-anteprima="3d"]` sul ritratto.
