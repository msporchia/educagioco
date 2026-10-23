# L'appiattimento del Sotterraneo 3D (prototipo)

La scena vera di uno scontro del Sotterraneo 3D (`scena3d/indice.js`: muri, pavimento, eroe leggendario, tre mostri 3D, torcia,
fuochi, nebbia) disegnata con la luce spostata dai pixel ai vertici, per sapere **cosa costa sul Redmi Note 7 e su cosa si può
osare**. Il perché, le misure, il budget e il piano: [../docs/sotterraneo/appiattimento-3d.md](../docs/sotterraneo/appiattimento-3d.md).
Non tocca `src/`: monta i moduli veri e cambia i materiali dopo, a scena fatta.

## Come si apre

- Dev: `npx vite`, poi `/poc/appiattimento-3d.html`: **alta** e **bassa** affiancate (`?livelli=alta,oggi,bassa,bassa+` per
  aggiungerne), i bottoni in basso cambiano la vista (`scontro`, `cantina`, `fuoco`, `vicino`).
- Una scena sola (quella che si misura): `?livello=alta|oggi|bassa|bassa+&vista=…`, e le leve sopra un livello con
  `&leve=luci:6+ombra:macchia` (i gettoni in `leve.js`; uno sconosciuto va al gioco come pezzo di `ACCESI`, come `&spegni=`).
  Anche nell'hash (`#livello=…`): lo strumento del vecchio telefono passa da lì.
- `&mostri=1&colpi=1`: un mostro e i colpi a ripetizione (la scomposizione `ab-*` del telefono).
- **Sul telefono**: `?telefono=1` (`&gruppi=livelli,togli`) fa tutte le scene di `SCENE` (leve.js) una dopo l'altra e alla fine dà il
  resoconto da copiare (una riga per scena e `DATI {…}`).
- `window.__prova`: `pronto`, `conti()` (chiamate, triangoli, shader in uso, nodi, oggetti visibili, luci vere), `banco(n, giri)` (n
  disegni fermi aspettati, il minimo di `giri` mediane: ms, cpu dentro `render`, gpu l'attesa, il rumore), `contaGL()` (le chiamate a
  WebGL di un disegno), `conta()` (tutto, più i frammenti pesati di `conta.js`), `colpo(chiave)`.
- Il file unico: `POC=appiattimento-3d FUORI=tmp/poc-appiattimento npx vite build -c strumenti/poc-file-unico.config.js`.

## I comandi

```bash
node poc/appiattimento-3d/scatta.mjs                   # le tavole affiancate in tmp/scatti/appiattimento-<vista>.png
node poc/appiattimento-3d/scatta.mjs --viste vicino --leve 'mat:lambert,luce:vertice' --nome leve-luce
node poc/appiattimento-3d/misura.mjs                   # i conti di ogni scena del catalogo (i ms solo come ordine di grandezza)
node poc/appiattimento-3d/misura.mjs --gruppi livelli --profilo   # e dove va il JS
node test/unita/budget-3d.test.mjs --elenco            # il peso di ogni modello del catalogo 3D contro il budget
```

## I file (poc/appiattimento-3d/)

| file | cosa |
|---|---|
| `scena.js` | la discesa del motore, l'eroe leggendario, lo scontro della misura del telefono (`tri-1`), la cantina; chi sta in piedi |
| `piatto.js` | la luce per vertice: i materiali Standard del gioco senza luci per pixel, la nebbia per vertice, la luce cotta, il rilievo dalla normal map, pavimento e muri suddivisi |
| `finti.js` | l'ombra a macchia e i bagliori additivi |
| `conta.js` | i frammenti colorati, pesati per luci, trame e ombra, divisi per famiglia di materiale |
| `carichi.js` | le leve di costo: triangoli, chiamate, Lambert/Basic, luci vere, additivi, particelle, persone con e senza pelle, senza trame |
| `leve.js` | i livelli (alta, oggi, bassa, bassa+) e i gettoni delle leve |
| `main.js` | la pagina: il confronto o la scena sola, `window.__prova` |
| `budget.js` | quanto pesa un modello (`pesa`) e il budget per famiglia (`BUDGET`, `SCENA`) |
| `scatta.mjs`, `misura.mjs` | gli scatti e la misura |
