# Le anteprime 3D nei pannelli

Nel Sotterraneo 3D ([grafica-3d.md](grafica-3d.md)) l'eroe, i mostri e gli effetti sono modelli ([mostri-3d.md](mostri-3d.md));
per coerenza (l'utente, 21 ottobre 2026) lo sono anche le immagini dei pannelli: le caselle della roba (zaino, botteghe, il
pannello del pezzo, il confronto affiancato), il ritratto dell'eroe (zaino, bottega, pagina dell'eroe, scelta dell'avventura) e la
fila dei turni dello scontro. Sono fotografie dei modelli veri, fatte una volta e tenute. **Il Sotterraneo di sempre non cambia**:
le anteprime le fornisce solo Gioco.vue col `disegno: '3d'`.

## Dove sta cosa

| file | cosa tiene |
|---|---|
| `scena3d/anteprime3d-pura.js` | senza three: `MODELLO_DI` (oggetto → modello della collezione, la stessa mappa che veste l'eroe in scena), `dotazioneDi`, `pregioDi`, le chiavi, `leggiChiave`, la coda `creaCoda` |
| `scena3d/anteprime3d.js` | il renderer, la scena di posa, le inquadrature, `creaAnteprime3d` |
| `scena3d/eroe3d.js` | `vestiEroe(g, roba)` e `vestiDotazione(g, d)`: l'eroe in scena e quello delle anteprime si vestono con la stessa funzione |
| `viste/anteprima3d.js` | `fornisciAnteprime3d` (Gioco.vue), `usaAnteprima(chiave)`: un ref null finché l'immagine non c'è |
| `viste/Quadro3d.vue` | la tela che mostra un'anteprima |
| `viste/Icona.vue` | `tre` (la chiave) o `cosa3d` (la cosa: la chiave si ricava), `lato`, `riduci` |
| `viste/Armato.vue` | `in3d`, `corpo`: il ritratto 3D sopra lo sprite |

Chi la usa: `Casella`, `Pannello`, `Confronto` (`cosa3d`), `Addosso`, `PaginaEroe`, `Eroi` (`in3d`), `FilaDeiTurni` (`tre`, con
`chi`, `mano`, `mancina`, `corpo` dell'eroe che `viste/campo.js` aggiunge alla vista dello scontro).

## Le chiavi e le inquadrature

La chiave dice la figura, non l'oggetto: due spade di rarità diverse sono la stessa anteprima.

| chiave | cosa si vede | pixel |
|---|---|---|
| `arma:<id>` | l'arma della collezione in diagonale, la punta in alto a destra; l'arco girato di lato perché si veda la curva | 128² |
| `scudo:<id>` | lo scudo di fronte, appena girato | 128² |
| `armatura:<tipo>:<pregio>:<eroe>` | l'armatura su un manichino: l'eroe di adesso senza testa e senza armi | 128² |
| `eroe:<chi>:<destra>:<sinistra>:<corpo.pregio>` | l'eroe intero nella guardia, con le armi e l'armatura | 150×176 |
| `busto:…` (lo stesso) | la faccia e le spalle, uguali per tutti (il cappello del mago e la barba del nano restano dentro a metà) | 96² |
| `mostro:<tipo>:<grado>:<variante>` · `mostro:grosso:<chi>` | il modello del registro (`idDi`), di tre quarti verso sinistra, dalla testa a circa due terzi | 96² |

- **Il pregio dell'armatura viene dalla rarità** (comune 1, magico 2, raro e leggendario 3), anche per l'eroe in scena: prima era
  2 per ogni pezzo trovato, e il terzo non si vedeva mai.
- **Ogni pezzo che si anima si mette in un istante** (`animaTutto`): prima della prima `anima` le fiamme e le braci dell'ascia di
  lava erano grandi quanto l'arma, e l'anteprima era un quadrato giallo.
- La luce è quella delle torce: un'emisferica bruna, un fuoco caldo davanti a sinistra, un filo freddo da dietro che stacca il
  contorno; tono ACES come la scena.

## Lo sprite non sparisce mai

- **Finché l'anteprima non è pronta si vede lo sprite**, e poi si scambia. Le caselle compaiono subito.
- **Dove il modello non c'è resta lo sprite**: anelli, collane, pozioni, torce, chiavi, le sei specie senza modello (pianta,
  piranha, golem di muschio, scorpione, mostro viola, pipistrello occhio). Una chiave senza modello, un modello che si rompe, un
  WebGL che non c'è o un contesto perso valgono null: niente riquadri vuoti.
- **Il ritratto tiene sotto lo sprite** coi suoi `data-in-mano`/`data-addosso` (nascosto con `visibility`): i test e i `data-` di
  sempre non cambiano. Nella fila il rimpicciolimento dello sprite (`riduci`) non tocca l'anteprima, già della misura giusta.
- `#icone2d` nell'indirizzo le spegne tutte; `#sprite` spegne i mostri e `#eroe2d` l'eroe, come in scena.

## Quanto costa

- **Un renderer solo, suo** (la bottega sta sopra, dove la scena della discesa non c'è): una tela piccola, creato alla prima
  richiesta (e three col modulo, a richiesta), chiuso dopo 30 s senza richieste (`dispose` e `forceContextLoss`); si riapre alla
  prossima. La cache delle immagini resta finché si gioca; `via()` alla chiusura del gioco.
- **La coda**: una chiave una volta sola; in un giro se ne fanno finché non passano 16 ms (almeno una), poi si cede il filo con
  un messaggio (il tocco e i fotogrammi passano prima).
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
node strumenti/tavola-anteprime.mjs --chiavi arma:ascia-lava,busto:nano:accetta:scudo-nanico:-
node strumenti/scatta-app.mjs 'sotterraneo3d=1&eroe=cavaliere&sotterraneo=roba&dpr=1' --dist --aspetta 6000 --tocca '[data-azione="zaino"]'
node strumenti/scatta-app.mjs 'sotterraneo3d=mondo&eroe=cavaliere&bottega=armaiolo&livello=12&roba=rara&gemme=800&dpr=1' --dist --aspetta 8000
```

`window.__anteprime3d.stato()` dice quante disegnate, i ms (modelli, render, copia), quante volte s'è aperto il renderer, se è
aperto, quante in coda, e `prima`/`ultima` (il primo chiedere e l'ultima pronta).

## Cosa manca

- **Le figure dei pezzi trovati**: lo sprite ha gli aspetti ([figure.md](figure.md)), il 3D la sola base (tutte le spade sono la
  spada lunga). La collezione ha dieci modelli per famiglia con l'elemento: scegliere fra quelli come `aspettoDi` cambierebbe
  anche l'arma in mano in scena.
- L'armatura si mostra sull'eroe di adesso anche quando la sua classe non la porta (il ✋ lo dice già).
- Anelli, collane e pozioni non hanno un modello.

Nei test: `unita/sotterraneo-anteprime-3d` (la mappa copre ogni arma, scudo e armatura del gioco, le chiavi, null dove resta lo
sprite, la lettura delle chiavi, i mostri allo stesso modello della scena, la coda), `integrazione/sotterraneo-3d-anteprime` (lo
zaino coi modelli e gli sprite dove servono, un renderer solo, la pagina dell'eroe, la fila con l'eroe a mezzo busto e la pianta
sprite, il 2D e `#icone2d` senza anteprime). Bersagli: `[data-anteprima="3d"]` con `[data-anteprima-chiave]` sull'icona, e
`.sot-armato[data-anteprima="3d"]` sul ritratto.
