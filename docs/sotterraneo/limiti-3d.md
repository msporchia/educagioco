# I limiti del sotterraneo sul vecchio telefono

Fin dove regge il Redmi Note 7 (fascia bassa) con quanti personaggi, e chi pesa di più, senza giocare a mano. Due fonti, da non
confondere:

- **telefono vero**: il log coi modelli veri del 22/10 (`strumenti/vecchio-telefono/log/redmi-note7-veri-22ott.txt`,
  [../core/vecchio-telefono-veri.md](../core/vecchio-telefono-veri.md)), scene ridotte (lo scontro vero, ma sopra solo un prato);
- **imitato**: `strumenti/vecchio-telefono.mjs` (SwiftShader su 4 core, CPU ×5,04 di `profilo.json`), il gioco intero; misurato il
  22/10 a macchina quasi calma, ogni riga dubbia rifatta (le differenze sotto il 5-10% sono rumore).

Le colonne imitate: **compiti** = ms del filo principale a fotogramma (JS, three, chiamate: tarato sul telefono, ×0,96), **banco** =
ms della sola tela, disegni aspettati uno a uno (`banco()`: la GPU finta, senza i 60 Hz). Dal confronto con le stesse scene del log
vero, **telefono ≈ 0,55 × (compiti + banco)** nello scontro e sul prato (fra 0,5 e 1,2 a seconda della scena; il log vero misura
anche lui JS e GPU in fila, con una lettura di un pixel). **Non vale per il mondo intero**: SwiftShader paga i triangoli 5-10 volte il
telefono (log vero: ×8 triangoli, da 86k a 475k, +17 ms), e il mondo ne ha 240k. Soglie: 30 fps = 33 ms, 20 fps = 50 ms.

## I limiti, in una tabella

| scena (fascia bassa, pixel ratio 1) | 30 fps finché | 20 fps finché | da dove |
|---|---|---|---|
| scontro delle discese, fermo (scheletri) | **mai**: 3 mostri fermi 72 ms | mai | telefono vero |
| scontro delle discese, coi colpi ogni 0,7 s | mai: 1 mostro 64 ms (prima del rimedio 1 sotto) | mai | telefono vero |
| scontro, quanto aggiunge un mostro | +~3,5 ms l'uno (scheletri, specie miste); **un drago +~13 ms** | | imitato |
| il prato di sopra, persone 3D | **~5** (4: 32 ms, 8: 38) | **~12** (16: 63) | telefono vero |
| il prato di sopra, mostri 3D | **meno di 4** (4: 49 ms) | **~4** (8: 78) | telefono vero |
| il mondo intero con N personaggi | non misurato sul telefono: l'imitato non ci arriva (vedi sotto) | | |
| la roba addosso: 24 eroi vestiti | 109 ms (1486 chiamate) | | telefono vero |

Il collo non è il numero di personaggi: **la scena di base delle discese sta già oltre i 33 ms** (sul telefono vero: pixel ratio 1
→ 1,41 +14 ms, da 6 a 12 fuochi +98 ms, chiamate ×4 +24 ms, triangoli ×8 +17 ms, la nebbia niente). Il telefono si è scaldato
durante la misura (lo scontro di riferimento da 77 a 137 ms): i numeri delle ultime scene sono pessimisti. I personaggi spostano poco;
sopra, dove la base è leggera, contano.

## Lo scontro delle discese, imitato

`'sotterraneo=1&seme=11&sotterraneo=branco&tipo=…&stanza=sala&qualita=bassa&dpr=1&eroe=cavaliere'`, fermo (niente attacchi), due giri:

| mostri | chiamate | triangoli | banco | compiti | telefono stimato |
|---|---|---|---|---|---|
| 1 scheletro | 100-115 | 49-73k | 82-87 | 17,5 | ~56 ms |
| 3 scheletri | 171-186 | 64-89k | 92-100 | 15-21 | ~63 ms |
| 6 scheletri | 279 | 85k | 106-108 | 22-31 | ~73 ms |
| 8 scheletri | 351 | 99k | 114 | 30-35 | ~80 ms |
| 3 / 6 / 8 di specie miste (scheletro, goblin, lupo, orco, ragno, zombie, vespa, cinghiale) | 186 / 295 / 348 | 58-79k | 96 / 97 / 118 | 22 / 24 / 34 | ~65 / 66 / 83 |
| 3 / 6 / 8 draghi | 381 / 786 / 976 | 68-123k | 107 / 148 / 169 | 34 / 60 / 92 | ~77 / 115 / 144 |

Un mostro qualunque ~+35 chiamate, ~+2 ms di filo e ~+4 di tela; un drago ~+100 chiamate, ~+12 ms di filo e ~+12 di tela. Con 8 mostri il filo
principale da solo arriva ai 30-35 ms: anche con una GPU che reggesse, otto sono il tetto dei 30 fps.

**L'eroe** (3 scheletri, fermo): il corredo leggendario +66 chiamate, +4-5 ms di filo, +5-10 di tela rispetto a quello di partenza;
senza gli aloni −17 chiamate e −1-4 ms (poco, dentro il rumore); senza la saldatura +370-400 chiamate e +10 ms di filo. Il mago non
costa più del cavaliere (la luce della gemma esiste solo dopo il colpo della staffa: vedi le proposte).

**Gli effetti, spenti uno alla volta** (`--spegni`, 3 scheletri leggendari e l'eroe leggendario, fermo; tutto acceso banco 102,
compiti 29): i chiarori −9 di tela, gli aloni −11 di tela e −6 di filo, la nebbia −12 di tela, **i mostri sprite (`mostri3d:0`) −19 di
tela e −15 di filo** (114 chiamate invece di 250). Il resto in [grafica-3d-costi.md](grafica-3d-costi.md).

**Coi colpi** (un attacco ogni 3 s, 20 s): gli effetti 3D costavano ~50 ms di filo a fotogramma, per **15-19 shader ricompilati a ogni
attacco**: l'effetto finito buttava i suoi materiali, three liberava il programma e il colpo dopo lo ricompilava (sull'Adreno 50-300 ms
l'uno, e il log vero dice +41 shader nella scena coi colpi). È il rimedio 1: ora i compiti coi colpi sono 47-53 ms invece di 83-87
(senza effetti 34), e dopo il primo giro si compilano 0-2 shader (un effetto mai visto).

## Il mondo di sopra, imitato

Il prato dei campi (`porta(90.5, 43.5)`, senza i mostri veri), fascia bassa: la base è tela 294-304, compiti 16-17, 93 chiamate, 237k
triangoli (il telefono non ne paga così tanti: la stima ×0,55 qui non vale; conta il filo, tarato, e le differenze).

| | 0 | 4 | 8 | 12 | 16 | 24 |
|---|---|---|---|---|---|---|
| persone 3D: chiamate / tela / compiti | 93 / 304 / 16 | 114 / 306 / 20 | 135 / 320 / 18 | 156 / 329 / 19 | 177 / 341 / 23 | 219 / 363 / 23 |
| mostri 3D (specie miste): chiamate / tela / compiti | 93 / 294 / 17 | 249 / 313 / 20 | 377 / 328 / 29 | 531 / 346 / 33 (12: il tetto di `ACCESI.mostri3d`) | | |

Una persona ~5 chiamate e ~+0,3 ms di filo (sul telefono vero ~1,5-3 ms tutto compreso); un mostro ~35 chiamate e ~+2 ms di filo
(sul telefono vero ~7 ms). Con 8 persone e 8 mostri (tela 351, compiti 30-37): **l'ombra del sole a 2048 −32 di tela** (anche nella
bassa: il mondo non legge `ombraMappa`), le macchie d'ombra niente, senza saldatura 943 chiamate e +10 ms di filo, coi mostri sprite
compiti 17. Il tetto dei mostri 3D di sopra: **rimedio 2**.

## Chi pesa di più (la classifica)

`node strumenti/pesi-3d.mjs`: ogni modello costruito come nel gioco (mostri ed eroe saldati), 4 copie alla stessa misura (1,6) su un
fondo fisso con emisferica, sole e due fuochi, CPU ×5 e SwiftShader su 4 core; ms per copia = (tela con le copie − fondo) / copie,
più l'animazione per copia. Rumore ±0,5 ms. 79 mostri, 14 persone, 4 eroi × 4 vestiti, 210 pezzi di roba, 12 aloni, 297 voci della
Fattoria 3D. Le mediane: mostro 2,9 ms (35 chiamate), persona 2,7 (4), eroe 7,2 (50), roba 0,24 (8), Fattoria 1,0 (2,5).

| | voce | ms/copia | di cui animazione | chiamate | triangoli | mesh |
|---|---|---|---|---|---|---|
| 1 | eroe mago leggendario | 11,8 | 0,3 | 51 | 5,0k | 54 (+1 luce) |
| 2 | mostro prati/fantasma | 8,7 | **2,8** | 10 | 3,4k | 8 |
| 3 | eroe nano leggendario | 8,3 | 0,2 | 52 | 5,6k | 55 |
| 4 | eroe cavaliere (corredo comune) | 8,2 | 0,3 | 45 | 4,2k | 48 |
| 5 | Fattoria: campo di pomodori | 7,9 | 0,5 | 5 | 4,6k | 5 |
| 6 | mostro draghi/verde | 7,8 | 1,2 | **99** | 7,9k | 105 |
| 7 | mostro draghi/azzurro | 7,5 | 1,2 | 99 | 7,9k | 105 |
| 8 | mostro draghi/oro | 7,4 | 1,4 | 101 | 8,5k | 105 |
| 9 | mostro draghi/rosso | 5,8 | 1,1 | 99 | 7,9k | 105 |
| 10 | mostro palude/sibilla | 5,8 | 0,3 | 82 | 6,3k | 99 |

Poi melma (5,5: 1,7 di animazione, le normali rifatte a ogni fotogramma; melma rosa 1,4, viola 1,3), drago di lava, polpo, negromante,
gorgo (100 chiamate). Sopra 50 chiamate dopo la saldatura: i quattro draghi, il drago di lava, il gorgo, la sibilla, il negromante, il
polpo, i serpenti, lo spirito di fuoco e quello azzurro, il golem di magma. **Gli aloni**: un Points a pezzo; leggendario ~2-2,6 ms a
copia, raro ~0,4-0,8, magico ~0 (sul telefono vero 24 lame leggendarie 39 ms contro 24 vesti 109: pesano le vesti, non gli aloni).
Le vesti non si misurano da sole (si mettono addosso a un eroe: «crea non torna un Object3D» nel resoconto è voluto).

## I rimedi applicati

1. **Gli effetti 3D non ricompilano** (`effetti3d/gestore.js`): i materiali di un effetto finito non si buttano (`dispose` a vuoto), il
   programma resta in serbo. 15-19 shader a ogni attacco → 0-2; filo coi colpi 83-87 → 47-53 ms (imitato). Il test
   `integrazione/sotterraneo-3d` conta i `linkProgram` (il conto dei programmi vivi non lo vedeva: si liberano e si rifanno).
2. **Nella fascia bassa 6 mostri 3D di sopra invece di 8** (`mostriSopra` in `PROFILI`, `store/qualita.js`): gli altri restano sprite
   come già oltre l'ottavo. Branco pieno: 325 chiamate invece di 399, filo 25,0 contro 27,8 ms (tre giri alterni).

## I rimedi grossi (proposte)

- **Lo scontro delle discese**: la base è oltre i 33 ms anche con un mostro; sul telefono vero i fuochi (6 → 12: +98 ms) e i pixel sono
  il collo, non i personaggi. Rifare la misura vera dopo il rimedio 1 (i +41 shader della scena coi colpi) prima di decidere.
- **I draghi e i grossi della palude**: 99-116 mesh anche saldati (ali, collo, coda a ossa). Uno scheletro con pelle (`SkinnedMesh`) o
  la saldatura per osso con le ossa in una texture: da ~100 a pochi.
- **Il fantasma (2,8 ms) e le melme (1,3-1,7)**: l'animazione rifà geometria o normali a ogni fotogramma; nei prototipi
  (`poc/mostri-3d/`), poi `npm run promuovi3d`.
- **L'ombra del sole di sopra a 2048 anche nella bassa** (−32 di tela spenta): 1024 o a fotogrammi alterni nella bassa, come nelle
  discese. Cambia come si vede: da guardare.
- **La luce della gemma del mago** (`eroi3d/eroi.js`, una `PointLight` aggiunta al primo colpo della staffa): cambia il numero di luci
  della scena, quindi ricompila tutti i materiali al primo colpo e da lì costa a ogni pixel. Nella bassa un emissivo invece della luce.
- **L'eroe vestito ~50 chiamate**: armi, scudo, veste e copricapo saldati coi perni delle mani; e il tetto di 8 mostri 3D nello scontro
  delle discese (oggi 12) se il telefono vero lo chiede (mescolerebbe sprite e modelli nello stesso scontro).

## Per rifarle

```bash
npm run build
B='sotterraneo=1&seme=11&sotterraneo=branco&stanza=sala&qualita=bassa&dpr=1&eroe=cavaliere'
A="new Promise(r => setTimeout(r, 5000))"
node strumenti/vecchio-telefono.mjs "$B&tipo=scheletro" --scontro --ritmo ';' --per 'mostri=1,3,6,8' --secondi 8 --esegui "$A" --banco 20
node strumenti/vecchio-telefono.mjs "$B&tipo=drago" --scontro --ritmo ';' --per 'mostri=3,6,8' --secondi 8 --esegui "$A" --banco 20
node strumenti/vecchio-telefono.mjs "$B&mostri=3&tipo=scheletro" --scontro --ritmo ';' --per 'corredo=nessuno,leggendario' --spegni '-,aloni,saldatura' --secondi 6 --esegui "$A" --banco 20
node strumenti/vecchio-telefono.mjs "$B&mostri=3&tipo=scheletro&variante=guerriero,arciere,mago&grado=leggendario&corredo=leggendario" --scontro --secondi 20 --spegni '-,effetti3d'
# il mondo: il prato dei campi senza i mostri veri, la folla finta
P="new Promise(r => { const t = setInterval(() => { if (window.__mondo3d && window.__sotterraneo3d && window.__sotterraneo3d.pronto) { clearInterval(t); window.__mondo3d.senzaMostri(); window.__mondo3d.porta(90.5, 43.5); setTimeout(r, 12000) } }, 300) })"
node strumenti/vecchio-telefono.mjs 'sotterraneo=mondo&eroe=cavaliere&qualita=bassa&dpr=1&tetto3d=24' --per 'folla=0,4,8,12,16,24' --secondi 6 --esegui "$P" --banco 20
node strumenti/vecchio-telefono.mjs 'sotterraneo=mondo&eroe=cavaliere&qualita=bassa&dpr=1&tetto3d=24' --per 'branco3d=0,4,8,16' --secondi 6 --esegui "$P" --banco 20
node strumenti/vecchio-telefono.mjs 'sotterraneo=mondo&eroe=cavaliere&qualita=bassa&dpr=1&folla=8&branco3d=8' --spegni '-,ombre,ombreMorbide,saldatura,mostri3d:0' --secondi 6 --esegui "$P" --banco 20
node strumenti/pesi-3d.mjs --primi 15                     # la classifica (~40 minuti; --gruppo mostri per una parte)
```

Le leve: `&folla=`, `&branco3d=` (`&specie=`), `&tetto3d=` (`scena3d/mondo/folla-prova.js`, `unita/sotterraneo-folla-prova`),
`&spegni=aloni,saldatura,chiarori,ombreMorbide` (`ACCESI`, solo per misurare: nessuna fascia li tocca), `--per` e `--banco` di
`vecchio-telefono.mjs` ([../core/comandi.md](../core/comandi.md)). Gli shader compilati si contano col `linkProgram` (il blocco 4c
del test d'integrazione), non con `grafica().programmi`.

## Da confermare sul telefono vero

- La misura coi modelli veri **dopo il rimedio 1**, a telefono freddo: il gruppo `discese` (coi colpi) e `calore`.
- Il mondo intero (non il prato) con persone e mostri: col contatore fps nel villaggio e fra due branchi; l'imitato non lo dice.
- Se 6 mostri 3D di sopra si vedono bene accanto agli sprite degli altri.

Torna a [grafica-3d-costi.md](grafica-3d-costi.md) · [prestazioni-3d.md](prestazioni-3d.md).
