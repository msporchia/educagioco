# I limiti della Fattoria 3D sul vecchio telefono

Quante cose regge il Redmi Note 7 (fascia bassa → preset `basso`: scala 1, niente ombre, vento e scintille) e cosa pesa. Il metodo,
le due fonti (telefono vero e imitato) e la stima **telefono ≈ 0,55 × (compiti + banco)** sono quelli di
[../sotterraneo/limiti-3d.md](../sotterraneo/limiti-3d.md): **compiti** = ms del filo principale a fotogramma (tarato sul telefono),
**banco** = ms della sola tela (`Mondo3d.banco()`, l'ombra rifatta a disegni alterni come a camera ferma). Imitato il 22/10, degrado
fermo (`&degrado=no`), la camera di serie (22), una fattoria nuova con le prove di stress (`&stress=`, anche sopra gli alberi e fuori
dal terreno comprato: misurano il peso, non giocano).

## Il telefono vero (22/10, coi modelli veri)

`fattoriaTipo(10)` con le opzioni della bassa: **10 edifici 54 ms** (16 fps), 4 pollai e 4 stalle con le bestie 57 ms, Natale con 30
edifici 52 ms; le serie da 30 e 60 edifici saltate (già oltre i 33 ms). Il telefono era caldo (la scena di riferimento è passata da 77
a 137 ms durante la prova, e la fattoria era verso la fine): da rifare a telefono freddo. Prima di allora, giocando, la fattoria
stava a 60 fps: la misura legge un pixel a ogni fotogramma (aspetta la GPU), il gioco no, quindi la misura è pessimista.

## L'imitato: quante cose

| fattoria nuova + … | chiamate | triangoli | banco | compiti | telefono stimato |
|---|---|---|---|---|---|
| niente (il vuoto di partenza) | 43 | 35k | 61-85 | 7 | ~38-50 ms |
| 6 / 12 / 18 / 26 edifici (a giro, anche doppi) | 61 / 80 / 108 / 122 | 38-49k | 66 / 72 / 81 / 86 | 6 / 7 / 8,5 / 10 | ~40 / 44 / 49 / 53 |
| 10 / 20 / 40 / 59 campi (colture a caso) | 60 / 67 / 79 / 92 | 59 / 88 / 120 / 168k | 83 / 116 / 139 / 208 | 6,5 / 9 / 8,5 / 15 | ~49 / 69 / 81 / 122* |
| 4 / 8 / 16 / 28 recinti (con le pecore) | 70 / 72 / 114 / 186 | 38-53k | 67 / 67 / 72 / 84 | 6 / 6 / 7 / 9 | ~40 / 40 / 44 / 51 |
| 8 / 16 / 40 pollai (con le galline) | 224 / 468 / 979 | 42-72k | 77 / 92 / 117 | 12 / 15 / **31** | ~49 / 59 / 81 |
| 8 / 16 / 28 stalle (con le mucche) | 98 / 313 / 333 | 47-94k | 75 / 117 / 128 | 10 / 12 / 16 | ~47 / 71 / 79 |
| 12 edifici a Natale / ad Halloween | 82 / 79 | 46 / 40k | 80 / 75 (+8 / +3) | 8 / 8 | |
| `fattoria3d-tipo=30` / `=99` (giocate, piene) | 148 / 180 | 89 / 94k | 154 / 168 | 19 / 16 | ~95 / 101* |
| `=99` con la camera lontana (40) | 223 | 108k | 165 | 20 | |
| preset `medio` (scala 1,5, ombre 1024): vuota / 26 edifici / 40 campi / tipo 99 | 44 / 187 / 150 / 320 | | 141 / 218 / 315 / 330 | 11 / 22 / 28 / 31 | |

\* i campi sono triangoli (grano e riso 5,5k l'uno, pomodori 4,6k): SwiftShader li paga 5-10 volte il telefono, che da 86k a 475k
triangoli sale di 17 ms. Per i campi la stima è molto pessimista.

**I limiti**: il filo principale (che sul telefono è tarato) regge tutto quello che il gioco lascia fare: gli edifici sono uno per tipo
(15), i pezzi con molte bestie arrivano ai 30 ms solo con ~40 pollai (979 chiamate: le galline non sono istanze). La tela no: secondo
la stima la bassa è già vicina ai 33 ms vuota, e una fattoria piena (tipo 99) sta sui 100 ms; ma la stessa stima dava ~50 ms alla
fattoria vuota, che giocando andava a 60 fps. **Il limite vero della fattoria lo dice solo il telefono**: quello imitato dice cosa
cresce più in fretta, cioè **i campi** (+~3 ms di tela l'uno), **i pollai e le stalle** (24 e 20 chiamate l'uno con le bestie), poi
gli edifici (+~1 ms l'uno). Il preset `medio` sul Redmi raddoppia la tela: la bassa → `basso` è giusta.

## Chi pesa di più

Da `node strumenti/pesi-3d.mjs --gruppo fattoria` (297 voci del catalogo, 4 copie alla stessa misura; mediana 1,0 ms e 2,5 chiamate):
i **campi maturi** in testa (pomodori 7,9 ms a copia, mais 5,9, zucche 5,1, melanzane 5,0, carote 4,7, grano 4,6; 3-5 chiamate ma
2-5,8k triangoli e 0,2-0,5 ms di animazione), poi **Watson** (3-4 ms, 14 chiamate, 5,4k triangoli in ogni posa) e i gatti (2-3 ms, 13
chiamate), i recinti del secondo cortile (conigliera 41 chiamate, stagno delle anatre 33, arnie 31, alpaca 33, asini 28, capre 31),
la stalla (20) e il pollaio (21). Gli edifici fusi costano poco (1-8 chiamate).

## Rimedi

Nessuno applicato: niente supera il filo principale nei numeri che il gioco consente, e la tela imitata non è credibile qui.
**Proposte**, da decidere dopo la misura a telefono freddo:
- **Le galline e le mucche a istanze** (come i campi, [istanze.md](istanze.md)): un pollaio con le galline sono ~24 chiamate.
- **I campi più leggeri da lontano**: un LOD come per i compagni (oltre ~15 m meno piante, o una lastra dipinta).
- **I recinti del secondo cortile** fusi come quelli del primo (30-40 chiamate l'uno).
- La rotazione dei pezzi (`rot`) non cambia il peso: non si misura.

## Per rifarle

```bash
npm run build
A='new Promise(r => setTimeout(r, 6000))'
node strumenti/vecchio-telefono.mjs 'fattoria3d&qualita=bassa&degrado=no' --per 'stress=edifici:0,edifici:6,edifici:12,edifici:18,edifici:26' --secondi 6 --esegui "$A" --banco 20
node strumenti/vecchio-telefono.mjs 'fattoria3d&qualita=bassa&degrado=no' --per 'stress=campo:10,campo:20,campo:40,campo:59' --secondi 6 --esegui "$A" --banco 20
node strumenti/vecchio-telefono.mjs 'fattoria3d&qualita=bassa&degrado=no' --per 'stress=pollaio:8,pollaio:16,pollaio:40' --secondi 6 --esegui "$A" --banco 20   # e recinto:, stalla:
node strumenti/vecchio-telefono.mjs 'fattoria3d&qualita=bassa&degrado=no&stress=edifici:12' --per 'stagione=natale,halloween' --secondi 6 --esegui "$A" --banco 20
node strumenti/vecchio-telefono.mjs 'fattoria3d&qualita=bassa&degrado=no' --per 'fattoria3d-tipo=99' --secondi 6 --esegui 'new Promise(r => setTimeout(r, 8000))' --banco 20
```

`--per` fa una riga per valore (un valore solo per chiave: `fattoria3d-tipo=30,fattoria3d-tipo=99` non va, due comandi);
`&qualita=media` per il preset `medio`; la camera lontana con `--esegui` (`window.__fattoria3d.q.camera = 40`). Le leve:
`&stress=` e `&degrado=no` ([../core/comandi.md](../core/comandi.md)), `Mondo3d.banco(n)`, `mondo.stress('edifici', n)`.
