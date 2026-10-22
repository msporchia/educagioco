# Il catalogo 3D

Una pagina sola dove vedere **tutti i modelli 3D costruiti** (Fattoria 3D e
Sotterraneo 3D) e **in quale gioco si usano**, per decidere «questo vale la
pena usarlo anche di là». Due mulini non sono per forza uno spreco: la
pagina mostra, non impone il riuso.

```bash
npm run catalogo3d          # apre strumenti/banco/catalogo-3d.html (Vite)
npm run catalogo3d:scheda   # PNG contatto in tmp/scatti/catalogo-3d-<gioco>.png
npm run catalogo3d:scheda -- --gioco fattoria --q watson --angolo 90 --alto 10 --vicino 1.5 --pixel 2
                            # una voce da vicino, di fianco e bassa: per giudicare un modello
```

La scheda (`strumenti/catalogo-3d-scheda.mjs`) serve Vite da sé, non vuole la
build, e dice le voci che non si creano; con `--q` scrive anche mesh e triangoli
di ogni voce (quelli che si disegnano: una mesh spenta non conta). `CHROME=…` forza il browser.

## Com'è fatta

- `strumenti/banco/catalogo-3d.html` + `catalogo-3d.js`: la pagina. Un solo
  `WebGLRenderer` per tutte le anteprime (ognuna copiata in un canvas 2D: sul
  telefono i contesti WebGL sono pochi). Toccando una scheda si apre la vista
  grande (stesso renderer, rotazione col dito, zoom, animazione).
- Filtri per gioco, categoria e testo; anche da indirizzo
  (`?gioco=fattoria&cat=prop&q=pozzo`, `&scheda=1` senza controlli;
  `&angolo=` gradi attorno, 0 davanti, `&alto=` gradi sopra l'orizzonte e
  `&vicino=` per la telecamera delle anteprime).
- «Si assomigliano: valuta»: coppie di giochi diversi con la stessa
  `categoria` e un nome che condivide la radice (le prime cinque lettere).
  Le voci `entrambi` non entrano: sono già in comune.
- Un file che manca o una `crea` che fallisce non rompe la pagina: una nota in
  cima, la scheda con l'errore, il resto continua.

## Il formato di una voce

Ogni file in `strumenti/banco/catalogo-3d/<gioco>.js` esporta `VOCI`:

```js
{ id: 'fattoria:mulino', nome: 'Mulino',
  gioco: 'fattoria' | 'sotterraneo' | 'entrambi',
  categoria: 'edificio' | 'prop' | 'pianta' | 'personaggio' | 'animale' | 'effetto' | 'altro',
  dove: 'dove si vede nel gioco, in una riga',
  file: 'src/…/modelli.js:creaMulino',          // percorso:funzione, esiste davvero
  crea: () => THREE.Object3D,                   // può essere async
  misure?: '3×3',  mesh?: 21,                   // mesh: la pagina la conta da sola
  anima?: (oggetto, dt, t) => {} }              // per la vista grande
```

Senza `anima`, la vista grande chiama `oggetto.userData.anima(dt, t)` se c'è.
`crea` chiama il **costruttore vero** del gioco, mai una copia; per ciò che il
gioco monta a istanze (alberi, sassi) si ricompone la stessa forma con le
stesse geometrie. Un modello che vuole un canvas lo fa da sé: siamo in pagina.

## Chi mantiene cosa

- `catalogo-3d/fattoria-cortile2.js`: le voci del secondo cortile della Fattoria 3D (caricato da `catalogo-3d.js` accanto a `fattoria.js`; stessa forma).
- `catalogo-3d/fattoria.js`: chi lavora sulla Fattoria 3D. `dove` si ricava
  dai dati (`dati/catalogo.js`, `colture.js`, `compagni.js`), non si scrive a
  mano. Un `crea…` nuovo in `modelli.js` vuole una voce qui.
- `catalogo-3d/sotterraneo.js`: chi lavora sul Sotterraneo 3D.
- Un modello che compare in entrambi i giochi: una voce sola con
  `gioco: 'entrambi'`, nel file di chi l'ha costruito.
- Un modello **copiato** da un gioco all'altro (ponte, passerella e tavolo: Sotterraneo → Fattoria) sta in entrambi i file con **id
  diversi** (`fattoria:ponte`, `sot:kit:ponte-arco`), tutti e due `gioco: 'entrambi'`, ognuno col `file:` della sua copia; la pagina
  non li accoppia da sé.
- Nei test: `test/unita/catalogo-3d.test.mjs` controlla solo il formato e che
  `file:` esista e nomini qualcosa che c'è scritto dentro (niente three, niente
  browser). Che nessun modello manchi non lo controlla nessuno.
